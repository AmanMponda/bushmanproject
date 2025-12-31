<template>
  <div class="trophy-fees-csv-input">
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
          <span class="badge bg-light text-dark"><i class="fa fa-info-circle me-1"></i>CSV: Species ID, Species Name, Scientific Name, Amount</span>
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
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
            <i class="fa fa-times"></i>
          </button>
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
                <th>Scientific Name</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in csvRows" :key="idx">
                <td>
                  <input type="checkbox" class="form-check-input" v-model="row._selected" />
                </td>
                <td>{{ row.species_id }}</td>
                <td>{{ row.species_name }}</td>
                <td>{{ row.scientific_name }}</td>
                <td>{{ row.amount }}</td>
              </tr>
            </tbody>
          </table>
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
  species_id: string | number
  species_name: string
  scientific_name: string
  amount: string | number
  _selected?: boolean
}

const emit = defineEmits<{
  'rows-loaded': [rows: CsvRow[]]
}>()

const csvInput = ref<HTMLInputElement>()
const csvFile = ref<File | null>(null)
const showPreview = ref(false)
const isDragOver = ref(false)
const csvRows = ref<CsvRow[]>([])

const allRowsSelected = computed({
  get: () => csvRows.value.length > 0 && csvRows.value.every((r) => r._selected),
  set: (val) => {
    csvRows.value.forEach((r) => {
      r._selected = val
    })
  },
})

const selectedRows = computed(() => csvRows.value.filter((r) => r._selected))

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
  const rows = parseCsv(text)

  if (!rows || rows.length === 0) {
    alert('CSV contains no valid rows')
    clearCsvFile()
    return
  }

  csvRows.value = rows.map((row) => ({
    ...row,
    _selected: true,
  }))

  showPreview.value = true
  emit('rows-loaded', selectedRows.value)
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
    const scientificNameIdx = headers.indexOf('scientific name')
    const amountIdx = headers.indexOf('amount')

    // Fallback to alternative header names
    const speciesIdIdxAlt = headers.indexOf('species_id')
    const speciesNameIdxAlt = headers.indexOf('species_name')
    const scientificNameIdxAlt = headers.indexOf('scientific_name')
    const amountIdxAlt = headers.indexOf('amount')

    const finalSpeciesIdIdx = speciesIdIdx !== -1 ? speciesIdIdx : speciesIdIdxAlt
    const finalSpeciesNameIdx = speciesNameIdx !== -1 ? speciesNameIdx : speciesNameIdxAlt
    const finalScientificNameIdx = scientificNameIdx !== -1 ? scientificNameIdx : scientificNameIdxAlt
    const finalAmountIdx = amountIdx !== -1 ? amountIdx : amountIdxAlt

    if (finalSpeciesIdIdx === -1 || finalAmountIdx === -1) {
      alert('CSV must have columns: Species ID (or species_id) and Amount')
      return []
    }

    const rows: CsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted values
      const cells = parseCsvLine(lines[i])
      const species_id = cells[finalSpeciesIdIdx]?.trim().replace(/"/g, '')
      const species_name = finalSpeciesNameIdx >= 0 ? (cells[finalSpeciesNameIdx]?.trim().replace(/"/g, '') || '') : ''
      const scientific_name = finalScientificNameIdx >= 0 ? (cells[finalScientificNameIdx]?.trim().replace(/"/g, '') || '') : ''
      const amount = cells[finalAmountIdx]?.trim().replace(/"/g, '')

      if (species_id && amount) {
        rows.push({
          species_id,
          species_name: species_name || '',
          scientific_name: scientific_name || '',
          amount,
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
.trophy-fees-csv-input {
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

