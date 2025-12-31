<template>
  <div class="sales-package-csv-input">
    <!-- Upload Area -->
    <div
      class="csv-upload-area"
      :class="{ 'drag-over': isDragOver, 'has-file': csvFile }"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleFileDrop"
      @click="triggerCsvInput"
    >
      <input ref="csvInput" type="file" accept=".csv,text/csv" style="display: none" @change="onCsvSelected" />
      <template v-if="!csvFile && !showPreview">
        <div class="upload-icon">
          <i class="fa fa-cloud-upload-alt fa-3x text-muted"></i>
        </div>
        <div class="upload-text">
          <p class="mb-1 fw-semibold">Drag & drop your CSV file here</p>
          <p class="text-muted small mb-0">or click to browse files</p>
        </div>
        <div class="upload-hint mt-2">
          <span class="badge bg-light text-dark"><i class="fa fa-info-circle me-1"></i>CSV: Species ID, Quantity</span>
        </div>
      </template>
      <template v-else-if="csvFile && !showPreview">
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

    <!-- Parsing Progress -->
    <div v-if="parsingCsv" class="mt-3">
      <div class="d-flex align-items-center gap-2">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <span>Parsing CSV file...</span>
      </div>
    </div>

    <!-- Preview Table -->
    <div v-if="showPreview && csvHeaders.length > 0" class="csv-preview-panel mt-3">
      <div class="card">
        <div class="card-header bg-light d-flex align-items-center justify-content-between py-2">
          <div class="d-flex align-items-center gap-2">
            <i class="fa fa-table text-primary"></i>
            <span class="fw-semibold">Preview</span>
            <span class="badge bg-primary">{{ csvRows.length }} rows</span>
            <span v-if="invalidRows.length > 0" class="badge bg-warning">{{ invalidRows.length }} invalid</span>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="card-body p-0">
          <!-- Column Mapping -->
          <div class="p-3 border-bottom bg-light">
            <div class="row g-2 align-items-end">
              <div class="col-12 col-sm-6 col-md-4">
                <label class="form-label small fw-semibold">Species ID Column</label>
                <select v-model="csvColumnMap.species_id" class="form-select form-select-sm w-100" @change="recalculateCsvPreview" :disabled="csvHeaders.length === 0">
                  <option value="">(None)</option>
                  <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <label class="form-label small fw-semibold">Quantity Column</label>
                <select v-model="csvColumnMap.quantity" class="form-select form-select-sm w-100" @change="recalculateCsvPreview" :disabled="csvHeaders.length === 0">
                  <option value="">(None)</option>
                  <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-sm table-hover mb-0">
              <thead class="table-light sticky-top">
                <tr>
                  <th style="width: 40px;">
                    <input type="checkbox" class="form-check-input" :checked="allRowsSelected" @change="toggleAllRows" />
                  </th>
                  <th>Species ID</th>
                  <th>Species Name</th>
                  <th>Quantity</th>
                  <th v-if="invalidRows.length > 0">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in csvRows" :key="idx" :class="{ 'table-warning': row._invalid }">
                  <td>
                    <input type="checkbox" class="form-check-input" v-model="row._selected" :disabled="row._invalid" />
                  </td>
                  <td>{{ row.species_id || '-' }}</td>
                  <td>
                    <span v-if="row.species_name" class="fw-semibold">{{ row.species_name }}</span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>{{ row.quantity || '0' }}</td>
                  <td v-if="invalidRows.length > 0">
                    <span v-if="row._invalid" class="text-danger small">
                      <i class="fa fa-exclamation-triangle"></i> Invalid
                    </span>
                    <span v-else class="text-success small">
                      <i class="fa fa-check"></i> Valid
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
            {{ selectedRows.length }} of {{ validRows.length }} valid rows selected
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-sm btn-success"
              :disabled="selectedRows.length === 0"
              @click="importCsvData"
            >
              <i class="fa fa-upload me-1"></i>Import {{ selectedRows.length }} Rows
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No data message -->
    <div v-else-if="showPreview && csvRows.length === 0" class="alert alert-warning mt-3">
      <i class="fa fa-exclamation-triangle me-2"></i>No valid rows found in CSV.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Swal from 'sweetalert2'

interface CsvRow {
  species_id?: string | number
  species_name?: string
  quantity: string | number
  _selected?: boolean
  _invalid?: boolean
}

interface SpeciesOption {
  value: string | number
  text: string
}

const props = withDefaults(
  defineProps<{
    allowedSpeciesIds?: (string | number)[] // List of allowed species IDs from licence
    speciesOptions?: SpeciesOption[] // Species options for name lookup
  }>(),
  {
    allowedSpeciesIds: () => [],
    speciesOptions: () => [],
  }
)

const emit = defineEmits<{
  'rows-loaded': [rows: Array<{ id: number; quantity: any }>]
  'import': [rows: Array<{ id: number; quantity: any }>]
}>()

const csvInput = ref<HTMLInputElement>()
const csvFile = ref<File | null>(null)
const showPreview = ref(false)
const isDragOver = ref(false)
const parsingCsv = ref(false)
const csvRows = ref<CsvRow[]>([])
const csvHeaders = ref<string[]>([])
const csvRawRows = ref<any[]>([])
const csvColumnMap = reactive<Record<string, string>>({
  species_id: '',
  quantity: '',
})

const allowedIdsSet = computed(() => {
  const ids = props.allowedSpeciesIds.map((id) => String(id).trim())
  return new Set(ids)
})

const speciesIdToName = computed(() => {
  const map = new Map<string, string>()
  props.speciesOptions.forEach((opt) => {
    map.set(String(opt.value), opt.text)
  })
  return map
})

const validRows = computed(() => csvRows.value.filter((r) => !r._invalid))
const invalidRows = computed(() => csvRows.value.filter((r) => r._invalid))
const selectedRows = computed(() => validRows.value.filter((r) => r._selected))

const allRowsSelected = computed({
  get: () => validRows.value.length > 0 && validRows.value.every((r) => r._selected),
  set: (val) => {
    validRows.value.forEach((r) => {
      r._selected = val
    })
  },
})

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
  try {
    parsingCsv.value = true
    const text = await file.text()
    const parsed = await parseCsvText(text)

    if (!parsed || !parsed.rows || parsed.rows.length === 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Invalid CSV',
        text: 'CSV contains no valid rows. Please check the file format.',
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'btn btn-primary' },
        buttonsStyling: false,
      })
      clearCsvFile()
      parsingCsv.value = false
      return
    }

    csvHeaders.value = parsed.headerFields
    csvRawRows.value = parsed.rows

    // Auto-detect columns
    csvHeaders.value.forEach((header) => {
      const headerLower = header.toLowerCase().trim()
      if (headerLower.includes('species') && headerLower.includes('id')) {
        csvColumnMap.species_id = header
      } else if (headerLower.includes('quantity') || headerLower.includes('qty')) {
        csvColumnMap.quantity = header
      }
    })

    recalculateCsvPreview()
    showPreview.value = true
    parsingCsv.value = false
  } catch (error) {
    console.error('Error processing CSV file:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Processing Failed',
      text: 'Failed to process CSV file. Please check the file format and try again.',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
    clearCsvFile()
    parsingCsv.value = false
  }
}

async function parseCsvText(text: string) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return { headerFields: [], rows: [] }

  try {
    // Try using papaparse if available
    // @ts-ignore
    const PapaModule = await import('papaparse')
    const Papa = PapaModule && (PapaModule.default || PapaModule)
    const parsed = Papa.parse(trimmed, { header: true, skipEmptyLines: true })
    const headerFields = parsed?.meta?.fields || (parsed.data && parsed.data.length ? Object.keys(parsed.data[0]) : [])
    return { headerFields, rows: parsed.data || [] }
  } catch (e) {
    // Fallback to simple CSV parser
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length === 0) return { headerFields: [], rows: [] }

    const headerFields = parseCsvLine(lines[0]).map((h) => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map((line) => {
      const fields = parseCsvLine(line)
      const obj: any = {}
      for (let i = 0; i < headerFields.length; i++) {
        obj[headerFields[i]] = fields[i]?.trim().replace(/"/g, '') ?? ''
      }
      return obj
    })
    return { headerFields, rows }
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function recalculateCsvPreview() {
  csvRows.value = csvRawRows.value
    .map((row: any) => {
      const speciesId = csvColumnMap.species_id ? String(row[csvColumnMap.species_id] || '').trim() : ''
      const quantity = csvColumnMap.quantity ? String(row[csvColumnMap.quantity] || '').trim() : '0'
      const speciesName = speciesIdToName.value.get(speciesId) || ''

      const hasSpeciesId = speciesId.length > 0
      const isValidId = props.allowedSpeciesIds.length === 0 || allowedIdsSet.value.has(speciesId)
      const isValid = hasSpeciesId && isValidId

      return {
        species_id: speciesId,
        species_name: speciesName,
        quantity: quantity || '0',
        _selected: isValid,
        _invalid: !hasSpeciesId || !isValidId,
      }
    })
    .filter((r: CsvRow) => r.species_id) // Remove rows without species ID

  // Emit valid, selected rows
  const rowsToEmit = csvRows.value
    .filter((r) => !r._invalid && r._selected)
    .map((r) => ({ id: parseInt(String(r.species_id)) || 0, quantity: r.quantity }))
    .filter((r) => r.id > 0)

  emit('rows-loaded', rowsToEmit)
}

function toggleAllRows() {
  allRowsSelected.value = !allRowsSelected.value
}

async function importCsvData() {
  const toImport = selectedRows.value
  if (toImport.length === 0) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Rows Selected',
      text: 'Please select at least one valid row to import',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
    return
  }

  // Map to format expected by parent: { id, quantity }
  const rowsToImport = toImport
    .map((row) => ({
      id: parseInt(String(row.species_id)) || 0,
      quantity: row.quantity,
    }))
    .filter((r) => r.id > 0)

  if (rowsToImport.length === 0) {
    await Swal.fire({
      icon: 'error',
      title: 'Invalid Rows',
      text: 'No valid species IDs found in selected rows',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn btn-primary' },
      buttonsStyling: false,
    })
    return
  }

  emit('import', rowsToImport)
}

function clearCsvFile() {
  csvFile.value = null
  csvRows.value = []
  csvHeaders.value = []
  csvRawRows.value = []
  showPreview.value = false
  parsingCsv.value = false
  csvColumnMap.species_id = ''
  csvColumnMap.quantity = ''
}

function closeCsvPreview() {
  clearCsvFile()
}

// Expose for parent to call
function getSelectedRows() {
  return selectedRows.value
}

defineExpose({
  getSelectedRows,
  clearCsvFile,
  csvRows,
})
</script>

<style scoped>
.sales-package-csv-input {
  padding: 0;
}

.csv-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.csv-upload-area:hover {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.csv-upload-area.drag-over {
  border-color: #28a745;
  background-color: #f0fff4;
}

.csv-upload-area.has-file {
  background-color: #f9f9f9;
  border-color: #28a745;
  cursor: default;
}

.upload-icon {
  margin-bottom: 1rem;
}

.upload-text p {
  margin: 0;
}

.upload-hint {
  display: inline-block;
}

.selected-file {
  padding: 1rem;
}

.csv-preview-panel {
  border-radius: 8px;
}

.csv-preview-panel .card {
  border: 1px solid #dee2e6;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.csv-preview-panel .card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.csv-preview-panel .table {
  margin-bottom: 0;
}

.csv-preview-panel .table-light {
  background-color: #f8f9fa;
}

.csv-preview-panel thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  padding: 0.5rem;
}

.csv-preview-panel td {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.csv-preview-panel .form-check-input {
  margin-top: 0.25rem;
}
</style>
