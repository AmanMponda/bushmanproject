<template>
  <div class="modal fade" :id="modalId" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa fa-layer-group me-2"></i>
            Bulk Add Parameters
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Error / Success Messages -->
          <div v-if="errorMessage" class="alert alert-danger alert-dismissible">
            {{ errorMessage }}
            <button type="button" class="btn-close" @click="errorMessage = ''"></button>
          </div>
          <div v-if="successMessage" class="alert alert-success alert-dismissible">
            {{ successMessage }}
            <button type="button" class="btn-close" @click="successMessage = ''"></button>
          </div>

          <!-- Tab Navigation -->
          <ul class="nav nav-pills mb-3">
            <li class="nav-item">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'select' }"
                @click="activeTab = 'select'"
              >
                <i class="fa fa-list-check me-1"></i> Select Multiple
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'csv' }"
                @click="activeTab = 'csv'"
              >
                <i class="fa fa-file-csv me-1"></i> Upload CSV
              </button>
            </li>
          </ul>

          <!-- ==================== SELECT MULTIPLE TAB ==================== -->
          <div v-show="activeTab === 'select'">
            <div class="mb-3">
              <label class="form-label fw-bold">
                Select Parameters <span class="text-danger">*</span>
              </label>
              <Multiselect
                v-model="selectedParameters"
                :options="availableParameters"
                label="name"
                track-by="id"
                placeholder="Search and select multiple parameters..."
                :searchable="true"
                :multiple="true"
                :close-on-select="false"
                :loading="loadingParameters"
                @search-change="searchParameters"
              >
                <template #tag="{ option, remove }">
                  <span class="multiselect__tag">
                    {{ option.name }}
                    <i class="multiselect__tag-icon" @click="remove(option)"></i>
                  </span>
                </template>
                <template #noResult>
                  <span>No parameters found. Try a different search.</span>
                </template>
              </Multiselect>
              <small class="text-muted">
                {{ selectedParameters.length }} parameter(s) selected
              </small>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Section (applies to all)</label>
                <Multiselect
                  v-if="!showNewSection"
                  v-model="bulkSection"
                  :options="existingSections"
                  placeholder="Select existing section or type new..."
                  :searchable="true"
                  :taggable="true"
                  @tag="addNewSection"
                />
                <input
                  v-else
                  v-model="newSectionName"
                  type="text"
                  class="form-control"
                  placeholder="Enter new section name..."
                />
                <button
                  class="btn btn-link btn-sm p-0 mt-1"
                  @click="toggleNewSection"
                >
                  {{ showNewSection ? 'Choose existing section' : '+ Add new section' }}
                </button>
              </div>
              <div class="col-md-3 mb-3">
                <label class="form-label fw-bold">Starting Position</label>
                <input
                  v-model.number="bulkStartPosition"
                  type="number"
                  class="form-control"
                  min="1"
                  placeholder="Auto"
                />
                <small class="text-muted">Positions auto-increment from here</small>
              </div>
              <div class="col-md-3 mb-3">
                <label class="form-label fw-bold">Required</label>
                <div class="form-check mt-2">
                  <input
                    v-model="bulkRequired"
                    type="checkbox"
                    class="form-check-input"
                    id="bulkRequired"
                  />
                  <label class="form-check-label" for="bulkRequired">
                    Mark all as required
                  </label>
                </div>
              </div>
            </div>

            <!-- Selected Parameters Preview Table -->
            <div v-if="selectedParameters.length > 0" class="mt-3">
              <h6 class="fw-bold mb-2">
                <i class="fa fa-eye me-1"></i> Preview ({{ selectedParameters.length }} parameters)
              </h6>
              <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-sm table-bordered table-striped mb-0">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th style="width: 50px">#</th>
                      <th>Parameter Name</th>
                      <th>Category</th>
                      <th>Section</th>
                      <th style="width: 80px" class="text-center">Position</th>
                      <th style="width: 80px" class="text-center">Required</th>
                      <th style="width: 60px" class="text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(param, index) in selectedParameters" :key="param.id">
                      <td class="text-muted">{{ index + 1 }}</td>
                      <td>{{ param.name }}</td>
                      <td>
                        <span class="badge bg-secondary">{{ param.category?.name || '—' }}</span>
                      </td>
                      <td>{{ getEffectiveSection() || 'General' }}</td>
                      <td class="text-center">{{ (bulkStartPosition || 1) + index }}</td>
                      <td class="text-center">
                        <i :class="bulkRequired ? 'fa fa-check text-success' : 'fa fa-minus text-muted'"></i>
                      </td>
                      <td class="text-center">
                        <button
                          class="btn btn-outline-danger btn-sm py-0 px-1"
                          @click="removeSelected(index)"
                          title="Remove"
                        >
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ==================== CSV UPLOAD TAB ==================== -->
          <div v-show="activeTab === 'csv'">
            <!-- CSV Format Info -->
            <div class="alert alert-info">
              <h6 class="alert-heading mb-2">
                <i class="fa fa-info-circle me-1"></i> CSV Format Guide
              </h6>
              <p class="mb-2">Upload a CSV file with the following columns:</p>
              <table class="table table-sm table-bordered bg-white mb-2">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>parameter_name</code></td>
                    <td><span class="badge bg-danger">Yes</span></td>
                    <td>Must match an existing maintenance parameter name exactly</td>
                  </tr>
                  <tr>
                    <td><code>section</code></td>
                    <td><span class="badge bg-secondary">No</span></td>
                    <td>Group name (e.g., "Engine", "Tyres")</td>
                  </tr>
                  <tr>
                    <td><code>position</code></td>
                    <td><span class="badge bg-secondary">No</span></td>
                    <td>Display order (auto-assigned if blank)</td>
                  </tr>
                  <tr>
                    <td><code>required</code></td>
                    <td><span class="badge bg-secondary">No</span></td>
                    <td>yes/no or true/false or 1/0</td>
                  </tr>
                </tbody>
              </table>
              <button class="btn btn-outline-primary btn-sm" @click="downloadSampleCsv">
                <i class="fa fa-download me-1"></i> Download Sample CSV
              </button>
            </div>

            <!-- File Upload -->
            <div class="mb-3">
              <label class="form-label fw-bold">Choose CSV File</label>
              <div
                class="upload-zone p-4 text-center border border-2 border-dashed rounded"
                :class="{ 'border-primary bg-light': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="handleFileDrop"
              >
                <i class="fa fa-cloud-upload-alt fa-3x text-muted mb-2 d-block"></i>
                <p class="mb-1">Drag & drop your CSV file here, or</p>
                <label class="btn btn-outline-primary btn-sm">
                  <i class="fa fa-folder-open me-1"></i> Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    class="d-none"
                    ref="fileInputRef"
                    @change="handleFileSelect"
                  />
                </label>
                <p class="text-muted small mt-2 mb-0" v-if="csvFile">
                  <i class="fa fa-file-csv me-1"></i> {{ csvFile.name }} ({{ formatFileSize(csvFile.size) }})
                </p>
              </div>
            </div>

            <!-- Parse button -->
            <div class="mb-3" v-if="csvFile && csvParsedRows.length === 0">
              <button class="btn btn-primary" @click="parseCsvFile" :disabled="parsingCsv">
                <span v-if="parsingCsv" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="fa fa-cogs me-1"></i>
                Parse & Validate CSV
              </button>
            </div>

            <!-- Parsed Results Preview -->
            <div v-if="csvParsedRows.length > 0" class="mt-3">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="fw-bold mb-0">
                  <i class="fa fa-table me-1"></i>
                  Parsed Results
                  <span class="badge bg-success ms-1">{{ csvValidRows.length }} valid</span>
                  <span v-if="csvErrorRows.length" class="badge bg-danger ms-1">{{ csvErrorRows.length }} errors</span>
                </h6>
                <button class="btn btn-outline-secondary btn-sm" @click="clearCsv">
                  <i class="fa fa-times me-1"></i> Clear
                </button>
              </div>

              <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
                <table class="table table-sm table-bordered mb-0">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th style="width: 40px">#</th>
                      <th>Parameter Name</th>
                      <th>Section</th>
                      <th style="width: 80px" class="text-center">Position</th>
                      <th style="width: 80px" class="text-center">Required</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in csvParsedRows"
                      :key="index"
                      :class="{ 'table-danger': row.error }"
                    >
                      <td class="text-muted">{{ index + 1 }}</td>
                      <td>
                        {{ row.parameter_name }}
                        <small v-if="row.matched_parameter" class="text-success d-block">
                          <i class="fa fa-check-circle me-1"></i> Matched: {{ row.matched_parameter.name }}
                        </small>
                      </td>
                      <td>{{ row.section || '—' }}</td>
                      <td class="text-center">{{ row.position || 'Auto' }}</td>
                      <td class="text-center">
                        <i :class="row.required ? 'fa fa-check text-success' : 'fa fa-minus text-muted'"></i>
                      </td>
                      <td>
                        <span v-if="row.error" class="text-danger small">
                          <i class="fa fa-exclamation-circle me-1"></i>{{ row.error }}
                        </span>
                        <span v-else class="text-success small">
                          <i class="fa fa-check-circle me-1"></i> Ready
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            v-if="activeTab === 'select'"
            type="button"
            class="btn btn-primary"
            @click="submitBulkSelect"
            :disabled="saving || selectedParameters.length === 0"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="fa fa-plus-circle me-1"></i>
            Add {{ selectedParameters.length }} Parameter(s)
          </button>
          <button
            v-if="activeTab === 'csv'"
            type="button"
            class="btn btn-primary"
            @click="submitCsvImport"
            :disabled="saving || csvValidRows.length === 0"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="fa fa-upload me-1"></i>
            Import {{ csvValidRows.length }} Parameter(s)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { inspectionService } from '@/services/inspectionService'

const props = defineProps<{
  existingSections: string[]
  existingParameterCount: number
  modalId?: string
}>()

const emit = defineEmits(['submit'])

// ==================== State ====================

const activeTab = ref<'select' | 'csv'>('select')
const errorMessage = ref('')
const successMessage = ref('')
const saving = ref(false)
const loadingParameters = ref(false)
const availableParameters = ref<any[]>([])
const allParameters = ref<any[]>([])

// Select Multiple state
const selectedParameters = ref<any[]>([])
const bulkSection = ref<string>('')
const bulkStartPosition = ref<number>(1)
const bulkRequired = ref(false)
const showNewSection = ref(false)
const newSectionName = ref('')

// CSV Upload state
const csvFile = ref<File | null>(null)
const isDragging = ref(false)
const parsingCsv = ref(false)
const csvParsedRows = ref<any[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// ==================== Computed ====================

const csvValidRows = computed(() => csvParsedRows.value.filter(r => !r.error))
const csvErrorRows = computed(() => csvParsedRows.value.filter(r => r.error))

// ==================== Select Multiple Methods ====================

async function searchParameters(query: string) {
  if (!query || query.length < 1) return
  loadingParameters.value = true
  try {
    const response = await inspectionService.listMaintenanceParameters({ search: query })
    const all = response.data.data || response.data || []
    availableParameters.value = all.filter((p: any) => p.active === 1 || p.active === true)
  } catch {
    availableParameters.value = []
  } finally {
    loadingParameters.value = false
  }
}

async function loadAllParameters() {
  loadingParameters.value = true
  try {
    const response = await inspectionService.listMaintenanceParameters()
    const all = response.data.data || response.data || []
    allParameters.value = all.filter((p: any) => p.active === 1 || p.active === true)
    availableParameters.value = allParameters.value
  } catch {
    allParameters.value = []
    availableParameters.value = []
  } finally {
    loadingParameters.value = false
  }
}

function removeSelected(index: number) {
  selectedParameters.value.splice(index, 1)
}

function toggleNewSection() {
  showNewSection.value = !showNewSection.value
  if (!showNewSection.value) {
    newSectionName.value = ''
  }
}

function addNewSection(tag: string) {
  bulkSection.value = tag
}

function getEffectiveSection(): string {
  return showNewSection.value ? newSectionName.value : (bulkSection.value || '')
}

function submitBulkSelect() {
  if (selectedParameters.value.length === 0) {
    errorMessage.value = 'Please select at least one parameter.'
    return
  }

  errorMessage.value = ''
  const section = getEffectiveSection()
  const startPos = bulkStartPosition.value || (props.existingParameterCount + 1)

  const parameters = selectedParameters.value.map((param, index) => ({
    maintenance_parameter_id: param.id,
    maintenance_parameter: param,
    section: section || null,
    position: startPos + index,
    required: bulkRequired.value
  }))

  emit('submit', { type: 'bulk', parameters })
}

// ==================== CSV Methods ====================

function handleFileDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.csv')) {
      csvFile.value = file
      csvParsedRows.value = []
    } else {
      errorMessage.value = 'Please upload a .csv file.'
    }
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    csvFile.value = target.files[0]
    csvParsedRows.value = []
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function downloadSampleCsv() {
  const csvContent = `parameter_name,section,position,required
Engine Oil Level,Engine,1,yes
Brake Fluid Level,Engine,2,yes
Tyre Pressure Front Left,Tyres,3,yes
Tyre Pressure Front Right,Tyres,4,yes
Windscreen Condition,Body,5,no
Fire Extinguisher Present,Safety,6,yes`

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inspection_parameters_sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function parseCsvFile() {
  if (!csvFile.value) return

  parsingCsv.value = true
  errorMessage.value = ''

  try {
    const text = await csvFile.value.text()
    const rows = parseCsvText(text)

    if (rows.length === 0) {
      errorMessage.value = 'CSV file is empty or has no data rows.'
      parsingCsv.value = false
      return
    }

    // Ensure we have all parameters loaded for matching
    if (allParameters.value.length === 0) {
      await loadAllParameters()
    }

    // Match each row against available maintenance parameters
    const startPos = props.existingParameterCount + 1
    csvParsedRows.value = rows.map((row, index) => {
      const paramName = (row.parameter_name || '').trim()
      if (!paramName) {
        return { ...row, error: 'Parameter name is required' }
      }

      // Try to match by name (case-insensitive)
      const matched = allParameters.value.find(
        (p: any) => p.name.toLowerCase() === paramName.toLowerCase()
      )

      if (!matched) {
        return {
          ...row,
          error: `No matching parameter found for "${paramName}"`
        }
      }

      return {
        parameter_name: paramName,
        matched_parameter: matched,
        maintenance_parameter_id: matched.id,
        section: (row.section || '').trim() || null,
        position: row.position ? parseInt(row.position) : (startPos + index),
        required: parseBoolean(row.required),
        error: null
      }
    })
  } catch (err: any) {
    errorMessage.value = 'Failed to parse CSV: ' + (err.message || 'Unknown error')
  } finally {
    parsingCsv.value = false
  }
}

function parseCsvText(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
  if (lines.length < 2) return []

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))

  // Parse data rows
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const row: any = {}
    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })
    return row
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  const str = String(value).toLowerCase().trim()
  return ['yes', 'true', '1', 'y'].includes(str)
}

function clearCsv() {
  csvFile.value = null
  csvParsedRows.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function submitCsvImport() {
  if (csvValidRows.value.length === 0) {
    errorMessage.value = 'No valid rows to import.'
    return
  }

  errorMessage.value = ''

  const parameters = csvValidRows.value.map(row => ({
    maintenance_parameter_id: row.maintenance_parameter_id,
    maintenance_parameter: row.matched_parameter,
    section: row.section || null,
    position: row.position,
    required: row.required
  }))

  emit('submit', { type: 'csv', parameters })
}

// ==================== Reset ====================

function resetForm() {
  activeTab.value = 'select'
  errorMessage.value = ''
  successMessage.value = ''
  selectedParameters.value = []
  bulkSection.value = ''
  bulkStartPosition.value = 1
  bulkRequired.value = false
  showNewSection.value = false
  newSectionName.value = ''
  clearCsv()
}

// ==================== Lifecycle ====================

defineExpose({ resetForm, loadAllParameters, activeTab })

// Don't load on mount — parent calls loadAllParameters() when the modal is opened
</script>

<style scoped>
.upload-zone {
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-zone:hover {
  border-color: #0d6efd !important;
  background-color: #f8f9fa;
}

.border-dashed {
  border-style: dashed !important;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1;
}

.multiselect__tag {
  background: #0d6efd;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 4px;
  display: inline-flex;
  align-items: center;
  font-size: 0.85em;
}

.multiselect__tag-icon {
  margin-left: 4px;
  cursor: pointer;
}

.multiselect__tag-icon:hover {
  color: #ff6b6b;
}
</style>
