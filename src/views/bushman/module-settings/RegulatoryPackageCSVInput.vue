<template>
  <div class="regulatory-package-csv-input">
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
          <span class="badge bg-light text-dark"><i class="fa fa-info-circle me-1"></i>CSV: Species ID, Species Name, Quantity</span>
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

    <!-- Preview Table -->
    <div v-if="showPreview && csvRows.length > 0" class="csv-preview-panel mt-3">
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

        <div class="px-3 pt-3">
          <div class="row g-2 align-items-end mb-3">
            <div class="col-auto">
              <label class="form-label small mb-1">Species Name Column</label>
              <select class="form-select form-select-sm" v-model.number="selectedSpeciesNameIndex" @change="onColumnMappingChange">
                <option :value="null">Select...</option>
                <option :value="-1">Select column</option>
                <option v-for="(h, i) in headers" :key="i" :value="i">{{ h || '(empty)' }}</option>
              </select>
            </div>
            <div class="col-auto">
              <label class="form-label small mb-1">Quantity Column</label>
              <select class="form-select form-select-sm" v-model.number="selectedQuantityIndex" @change="onColumnMappingChange">
                <option :value="null">Select...</option>
                <option :value="-1">Select column</option>
                <option v-for="(h, i) in headers" :key="i" :value="i">{{ h || '(empty)' }}</option>
              </select>
            </div>
            <div class="col-auto ms-auto d-none d-md-block text-muted small align-self-center">
              <i class="fa fa-info-circle me-1"></i> If auto-detected, selected automatically. Change to override.
            </div>
          </div>
        </div>

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
                  <span v-if="row.name || row.species_name">{{ row.name || row.species_name }}</span>
                  <span v-else class="text-muted fst-italic">(empty)</span>
                  <span v-if="row._invalid" class="badge bg-danger ms-2">
                    {{ (!row.name && !row.species_name) ? 'Empty name' : 'Species name is not valid' }}
                  </span>
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
import { ref, computed } from 'vue'

interface CsvRow {
  species_id?: string | number
  species_name?: string
  name?: string // Emitted as 'name' to match parent component
  quantity: string | number
  _selected?: boolean
  _invalid?: boolean
}

const props = withDefaults(
  defineProps<{
    allowedSpeciesNames?: string[] // List of allowed species names from licence
  }>(),
  {
    allowedSpeciesNames: () => [],
  }
)

const emit = defineEmits<{
  'rows-loaded': [rows: Array<{ name: string; quantity: any }>]
  'import': [rows: Array<{ name: string; quantity: any }>]
}>()

const csvInput = ref<HTMLInputElement>()
const csvFile = ref<File | null>(null)
const showPreview = ref(false)
const isDragOver = ref(false)
const csvRows = ref<CsvRow[]>([])

// Header information and user-selected column mapping
const headers = ref<string[]>([])
const rawLines = ref<string[]>([])
const selectedSpeciesNameIndex = ref<number>(-1)
const selectedQuantityIndex = ref<number>(-1)

const allowedNamesSet = computed(() => new Set(props.allowedSpeciesNames.map((name) => name.toLowerCase().trim())))

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
    const text = await file.text()
    const lines = String(text || '').trim().split(/\r?\n/).filter((l) => l.trim() !== '')

    if (!lines || lines.length === 0) {
      alert('CSV contains no valid rows. Please check the file format.')
      clearCsvFile()
      return
    }

    // Store raw lines for re-parsing when user changes column mapping
    rawLines.value = lines

    // Parse header row
    const parsedHeader = parseCsvLine(lines[0]).map((h) => String(h || '').trim().replace(/"/g, ''))
    headers.value = parsedHeader

    // Auto-detect common headers (species name + quantity)
    const parsedHeaderLower = parsedHeader.map((h) => String(h || '').toLowerCase())
    const speciesNameIdx = parsedHeaderLower.indexOf('species name') !== -1 ? parsedHeaderLower.indexOf('species name') : parsedHeaderLower.indexOf('species_name')
    const quantityIdx = parsedHeaderLower.indexOf('quantity') !== -1 ? parsedHeaderLower.indexOf('quantity') : parsedHeaderLower.indexOf('qty')

    selectedSpeciesNameIndex.value = speciesNameIdx !== -1 ? speciesNameIdx : -1
    selectedQuantityIndex.value = quantityIdx !== -1 ? quantityIdx : -1

    // Build rows from remaining lines using current mapping (or detected defaults)
    const dataLines = lines.slice(1)
    buildRowsFromLines(dataLines)

    // Always show preview
    showPreview.value = true

    // Emit current valid rows
    const rowsToEmit = csvRows.value.filter((r) => !r._invalid && r._selected).map((r) => ({ name: r.name || r.species_name || '', quantity: r.quantity }))
    emit('rows-loaded', rowsToEmit)
  } catch (error) {
    console.error('Error processing CSV file:', error)
    alert('Failed to process CSV file. Please check the file format and try again.')
    clearCsvFile()
  }
}

// Build csvRows from raw data lines based on selected header indices
function buildRowsFromLines(dataLines: string[]) {
  const rows: CsvRow[] = []
  const parsedHeadersLower = headers.value.map((h) => String(h || '').toLowerCase())

  // Try to auto-find species id column if present
  const speciesIdIdx = parsedHeadersLower.findIndex((h) => h === 'species id' || h === 'species_id' || h === 'id')

  const nameIdx = selectedSpeciesNameIndex.value >= 0 ? selectedSpeciesNameIndex.value : parsedHeadersLower.findIndex((h) => h === 'species name' || h === 'species_name')
  const qtyIdx = selectedQuantityIndex.value >= 0 ? selectedQuantityIndex.value : parsedHeadersLower.findIndex((h) => h === 'quantity')

  for (const line of dataLines) {
    const cells = parseCsvLine(line)
    const species_id = speciesIdIdx >= 0 ? (cells[speciesIdIdx]?.trim().replace(/"/g, '') || '') : ''
    const species_name = nameIdx >= 0 ? (cells[nameIdx]?.trim().replace(/"/g, '') || '') : ''
    const quantity = qtyIdx >= 0 ? (cells[qtyIdx]?.trim().replace(/"/g, '') || '0') : (cells[2]?.trim().replace(/"/g, '') || '0')

    rows.push({ species_id: species_id || '', species_name: species_name || '', quantity: quantity || '0' })
  }

  // Validate and mark rows
  csvRows.value = rows.map((row) => {
    const speciesName = String(row.species_name || '').trim()
    const speciesNameLower = speciesName.toLowerCase()
    const hasName = speciesName.length > 0
    const isInAllowedList = props.allowedSpeciesNames.length === 0 || allowedNamesSet.value.has(speciesNameLower)
    const mappingComplete = selectedSpeciesNameIndex.value >= 0 && selectedQuantityIndex.value >= 0
    const isValid = hasName && isInAllowedList && mappingComplete

    return {
      ...row,
      name: speciesName, // Add 'name' field for parent component
      _selected: isValid, // Auto-select valid rows only when mapping is complete
      _invalid: !hasName || !isInAllowedList || !mappingComplete,
    }
  })
}

function onColumnMappingChange() {
  if (!rawLines.value || rawLines.value.length === 0) return
  const dataLines = rawLines.value.slice(1)
  buildRowsFromLines(dataLines)

  const rowsToEmit = csvRows.value.filter((r) => !r._invalid && r._selected).map((r) => ({ name: r.name || r.species_name || '', quantity: r.quantity }))
  emit('rows-loaded', rowsToEmit)
}

function parseCsv(text: string): CsvRow[] {
  const trimmed = String(text || '').trim()
  if (!trimmed) return []

  try {
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length < 2) return [] // header + at least 1 data row

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
    const speciesIdIdx = headers.indexOf('species id')
    const speciesNameIdx = headers.indexOf('species name')
    const quantityIdx = headers.indexOf('quantity')

    // Fallback to alternative header names
    const speciesIdIdxAlt = headers.indexOf('species_id')
    const speciesNameIdxAlt = headers.indexOf('species_name')
    const quantityIdxAlt = headers.indexOf('quantity')

    const finalSpeciesIdIdx = speciesIdIdx !== -1 ? speciesIdIdx : speciesIdIdxAlt
    const finalSpeciesNameIdx = speciesNameIdx !== -1 ? speciesNameIdx : speciesNameIdxAlt
    const finalQuantityIdx = quantityIdx !== -1 ? quantityIdx : quantityIdxAlt

    if (finalSpeciesNameIdx === -1 || finalQuantityIdx === -1) {
      alert('CSV must have columns: Species Name (or species_name) and Quantity')
      return []
    }

    const rows: CsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted values
      const cells = parseCsvLine(lines[i])
      const species_id = finalSpeciesIdIdx >= 0 ? (cells[finalSpeciesIdIdx]?.trim().replace(/"/g, '') || '') : ''
      const species_name = cells[finalSpeciesNameIdx]?.trim().replace(/"/g, '') || ''
      const quantity = cells[finalQuantityIdx]?.trim().replace(/"/g, '')

      // Include all rows - we'll mark invalid ones later
      // At minimum, we need either a species name or quantity to consider it a valid row
      if (species_name || quantity) {
        rows.push({
          species_id: species_id || '',
          species_name: species_name || '',
          quantity: quantity || '0',
        })
      } else {
        // Even completely empty rows should be included to show the error
        rows.push({
          species_id: species_id || '',
          species_name: '',
          quantity: '0',
        })
      }
    }

    return rows
  } catch (e) {
    console.error('CSV parse error:', e)
    return []
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

function toggleAllRows() {
  allRowsSelected.value = !allRowsSelected.value
}

function importCsvData() {
  const toImport = selectedRows.value
  if (toImport.length === 0) {
    alert('Please select at least one valid row to import')
    return
  }

  // Map to format expected by parent: { name, quantity }
  const rowsToImport = toImport.map((row) => ({
    name: row.name || row.species_name || '',
    quantity: row.quantity,
  }))

  // Validate all rows have names
  const invalidRows = rowsToImport.filter((r) => !r.name || r.name.trim() === '')
  if (invalidRows.length > 0) {
    alert(`Cannot import: ${invalidRows.length} row(s) have empty names`)
    return
  }

  emit('import', rowsToImport)
}

function clearCsvFile() {
  csvFile.value = null
  csvRows.value = []
  showPreview.value = false
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
.regulatory-package-csv-input {
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

