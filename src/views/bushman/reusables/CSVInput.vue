<template>
  <div class="csv-input-component">
    <!-- Header with Download Button -->
    <div class="d-flex align-items-center justify-content-between mb-2">
      <div></div>
    </div>

    <!-- Upload Area -->
    <div
      class="csv-upload-area"
      :class="{ 'drag-over': isDragOver, 'has-file': csvFile }"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleFileDrop"
      @click="triggerCsvInput"
    >
      <input ref="csvInput" type="file" accept=".csv,text/csv" style="display:none" @change="onCsvSelected" />
      <template v-if="!csvFile && !showCsvPreview">
        <div class="upload-icon">
          <i class="fa fa-cloud-upload-alt fa-3x text-muted"></i>
        </div>
        <div class="upload-text">
          <p class="mb-1 fw-semibold">Drag & drop your CSV file here</p>
          <p class="text-muted small mb-0">or click to browse files</p>
        </div>
        <div class="upload-hint mt-2">
          <span class="badge bg-light text-dark"><i class="fa fa-info-circle me-1"></i>Supported: .csv files</span>
        </div>
      </template>
      <template v-else-if="csvFile && !showCsvPreview">
        <div class="selected-file d-flex align-items-center gap-3">
          <i class="fa fa-file-csv fa-2x text-success"></i>
          <div class="flex-grow-1">
            <p class="mb-0 fw-semibold">{{ csvFile.name }}</p>
            <small class="text-muted">{{ formatFileSize(csvFile.size) }}</small>
          </div>
          <button type="button" class="btn btn-sm btn-outline-danger" @click.stop="clearCsvFile">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </template>
    </div>

    <!-- Preview Panel -->
    <div v-if="showCsvPreview && csvHeaders.length > 0" class="csv-preview-panel mt-3">
      <div class="card">
        <div class="card-header bg-light d-flex align-items-center justify-content-between py-2">
          <div class="d-flex align-items-center gap-2">
            <i class="fa fa-table text-primary"></i>
            <span class="fw-semibold">CSV Preview</span>
            <span class="badge bg-primary">{{ csvPreviewData.length }} rows</span>
            <span v-if="csvNotAllowed > 0" class="badge bg-danger">{{ csvNotAllowed }} not in licence</span>
            <span v-if="csvDuplicates > 0" class="badge bg-warning text-dark">{{ csvDuplicates }} duplicates</span>
            <span v-if="csvNewCount > 0" class="badge bg-success">{{ csvNewCount }} valid</span>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="card-body p-0">
          <!-- Column Mapping -->
          <div class="p-3 border-bottom bg-light">
            <div class="row g-2 align-items-end">
              <div v-for="(field, idx) in columnFields" :key="idx" class="col-12 col-sm-6 col-md-3">
                <label class="form-label small fw-semibold">{{ field.label }} Column</label>
                <select v-model="csvColumnMap[field.key]" class="form-select form-select-sm w-100" @change="recalculateCsvPreview" :disabled="csvHeaders.length === 0" aria-label="Map column for {{ field.label }}">
                  <option value="">(None)</option>
                  <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                </select>
                <small v-if="csvHeaders.length === 0" class="text-muted d-block mt-1">Upload a CSV to view headers</small>
              </div>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-sm table-hover mb-0">
              <thead class="table-light sticky-top">
                <tr>
                  <th style="width: 40px;">
                    <input type="checkbox" class="form-check-input" :checked="allCsvRowsSelected" @change="toggleAllCsvRows" />
                  </th>
                  <th v-for="field in columnFields" :key="field.key">{{ field.label }}</th>
                  <th style="width: 100px;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in csvPreviewData" :key="idx" :class="{ 'table-secondary': row._duplicate, 'table-danger': row._notAllowed }">
                  <td>
                    <input type="checkbox" class="form-check-input" v-model="row._selected" :disabled="row._duplicate || row._notAllowed" />
                  </td>
                  <td v-for="field in columnFields" :key="field.key">{{ row[field.key] }}</td>
                  <td>
                    <span v-if="row._notAllowed" class="badge bg-danger">
                      <i class="fa fa-ban me-1"></i>Not in Licence
                    </span>
                    <span v-else-if="row._duplicate" class="badge bg-warning text-dark">
                      <i class="fa fa-copy me-1"></i>Duplicate
                    </span>
                    <span v-else class="badge bg-success">
                      <i class="fa fa-check me-1"></i>Valid
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-footer bg-light d-flex align-items-center justify-content-between py-2">
          <div class="text-muted small">
            <i class="fa fa-check-circle text-success me-1"></i>
            {{ csvSelectedCount }} of {{ csvNewCount }} rows selected
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-sm btn-success"
              :disabled="csvSelectedCount === 0"
              @click="importCsvData"
            >
              <i class="fa fa-upload me-1"></i>Import {{ csvSelectedCount }} Rows
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

interface ColumnField {
  key: string
  label: string
}

interface CsvRow {
  [key: string]: string | number | boolean | undefined
  _duplicate?: boolean
  _selected?: boolean
  _notAllowed?: boolean
}

const props = withDefaults(
  defineProps<{
    columnFields: ColumnField[]
    duplicateKeyField?: string
    modelValue?: CsvRow[]
    examplePath?: string
    allowedValues?: string[] // List of allowed values for duplicateKeyField (e.g. species names from licence)
    clearAfterImport?: boolean // When true, clear uploaded file after import (useful for flows that proceed immediately)
  }>(),
  {
    duplicateKeyField: 'name',
    modelValue: () => [],
    examplePath: '',
    allowedValues: () => [], // Empty means no validation, all values allowed
    clearAfterImport: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: CsvRow[]]
  'import': [data: CsvRow[]]
}>()

const csvInput = ref<HTMLInputElement>()
const csvFile = ref<File | null>(null)
const showCsvPreview = ref(false)
const isDragOver = ref(false)

const csvHeaders = ref<string[]>([])
const csvRawRows = ref<any[]>([])
const csvPreviewData = ref<CsvRow[]>([])
const csvColumnMap = reactive<Record<string, string>>({})

// Initialize column map
watch(
  () => props.columnFields,
  (fields) => {
    fields.forEach((field) => {
      if (!(field.key in csvColumnMap)) {
        csvColumnMap[field.key] = ''
      }
    })
  },
  { immediate: true }
)

const allCsvRowsSelected = computed({
  get: () => csvPreviewData.value.length > 0 && csvPreviewData.value.every((r) => r._selected || r._duplicate),
  set: (val) => {
    csvPreviewData.value.forEach((r) => {
      if (!r._duplicate) r._selected = val
    })
  }
})

const csvSelectedCount = computed(() => csvPreviewData.value.filter((r) => r._selected && !r._duplicate && !r._notAllowed).length)
const csvNewCount = computed(() => csvPreviewData.value.filter((r) => !r._duplicate && !r._notAllowed).length)
const csvDuplicates = computed(() => csvPreviewData.value.filter((r) => r._duplicate).length)
const csvNotAllowed = computed(() => csvPreviewData.value.filter((r) => r._notAllowed).length)

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function handleFileDrop(e: DragEvent) {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      csvFile.value = file
      processCsvFile(file)
    }
  }
}

function triggerCsvInput() {
  if (csvInput.value) csvInput.value.click()
}

async function onCsvSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  csvFile.value = file
  await processCsvFile(file)
  input.value = ''
}

async function processCsvFile(file: File) {
  const text = await file.text()
  const parsed = await parseCsvText(text)

  if (!parsed || !parsed.rows || parsed.rows.length === 0) {
    alert('CSV contains no rows')
    clearCsvFile()
    return
  }

  csvHeaders.value = parsed.headerFields
  csvRawRows.value = parsed.rows
  console.log('CSVInput: detected headers', csvHeaders.value)

  // Auto-detect columns (try to match by header name)
  props.columnFields.forEach((field) => {
    const matchedHeader = csvHeaders.value.find(
      (h) => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase().includes(field.key.toLowerCase())
    )
    if (matchedHeader) {
      csvColumnMap[field.key] = matchedHeader
    }
  })

  recalculateCsvPreview()
  showCsvPreview.value = true
}

async function parseCsvText(text: string) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return { headerFields: [], rows: [] }

  try {
    // @ts-ignore - papaparse has no type declarations in this project
    const PapaModule = await import('papaparse')
    const Papa = PapaModule && (PapaModule.default || PapaModule)
    const parsed = Papa.parse(trimmed, { header: true, skipEmptyLines: true })
    const headerFields = parsed?.meta?.fields || (parsed.data && parsed.data.length ? Object.keys(parsed.data[0]) : [])
    return { headerFields, rows: parsed.data || [] }
  } catch (e) {
    // Fallback to simple CSV parser
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length === 0) return { headerFields: [], rows: [] }

    const headerFields = lines[0].split(',').map((h) => h.trim())
    const rows = lines.slice(1).map((line) => {
      const fields = line.split(',').map((f) => f.trim())
      const obj: any = {}
      for (let i = 0; i < headerFields.length; i++) {
        obj[headerFields[i]] = fields[i] ?? ''
      }
      return obj
    })
    return { headerFields, rows }
  }
}

function recalculateCsvPreview() {
  console.log('CSVInput: recalculating preview. column map:', JSON.parse(JSON.stringify(csvColumnMap)))
  const seenNames = new Set<string>()
  const existingNames = new Set(props.modelValue.map((item) => String(item[props.duplicateKeyField]).toLowerCase()))
  const allowedNames = props.allowedValues.length > 0 
    ? new Set(props.allowedValues.map((v) => String(v).toLowerCase()))
    : null

  csvPreviewData.value = csvRawRows.value
    .map((row: any) => {
      const newRow: CsvRow = {
        _duplicate: false,
        _selected: true,
        _notAllowed: false
      }

      props.columnFields.forEach((field) => {
        const colName = csvColumnMap[field.key]
        newRow[field.key] = colName ? row[colName] : ''
      })

      const key = String(newRow[props.duplicateKeyField]).toLowerCase()
      
      // Check if value is in allowed list (if provided)
      const isNotAllowed = allowedNames !== null && !allowedNames.has(key)
      newRow._notAllowed = isNotAllowed
      
      const isDuplicate = !newRow[props.duplicateKeyField] || existingNames.has(key) || seenNames.has(key)
      if (newRow[props.duplicateKeyField]) seenNames.add(key)

      newRow._duplicate = isDuplicate
      if (isDuplicate || isNotAllowed) newRow._selected = false

      return newRow
    })
    .filter((r: CsvRow) => r[props.duplicateKeyField]) // Remove empty rows
  console.log('CSVInput: preview rows after recalculation:', csvPreviewData.value.length)
}

function toggleAllCsvRows() {
  allCsvRowsSelected.value = !allCsvRowsSelected.value
}

function importCsvData() {
  const toImport = csvPreviewData.value.filter((r) => r._selected && !r._duplicate && !r._notAllowed)
  if (toImport.length === 0) return

  emit('import', toImport)
  emit('update:modelValue', [...props.modelValue, ...toImport])
  // Optionally clear uploaded file immediately after import (useful for flows that proceed directly to processing)
  if (props.clearAfterImport) {
    clearCsvFile()
  } else {
    closeCsvPreview()
  }
}

function closeCsvPreview() {
  showCsvPreview.value = false
}

function clearCsvFile() {
  csvFile.value = null
  showCsvPreview.value = false
  csvHeaders.value = []
  csvRawRows.value = []
  csvPreviewData.value = []
}
</script>

<style scoped>
.csv-upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.csv-upload-area:hover {
  border-color: #0d6efd;
  background: #f0f7ff;
}

.csv-upload-area.drag-over {
  border-color: #198754;
  background: #d1e7dd;
  transform: scale(1.02);
}

.csv-upload-area.has-file {
  border-style: solid;
  border-color: #198754;
  background: #fff;
  cursor: default;
}

.csv-upload-area .upload-icon {
  margin-bottom: 0.75rem;
}

.csv-upload-area .selected-file {
  padding: 0.5rem;
  text-align: left;
}

.csv-preview-panel .table th {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.csv-preview-panel .table td {
  font-size: 0.875rem;
  vertical-align: middle;
}

.csv-preview-panel .sticky-top {
  top: 0;
  z-index: 1;
}
</style>
