
<template>
  <div class="species-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
      <ul class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
        <li class="breadcrumb-item active">Species</li>
      </ul>
      </div>
    </div>

    <template v-if="showSpeciesList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :show-date-filters="false"
              >
                <template #select="{ row }">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`select-species-${row.id}`"
                      :checked="hasSelected(row.id)"
                      @change="() => toggleSelect(row.id)"
                      aria-label="Select species"
                    />
                  </div>
                </template>

                <template #id="{ row }">
                  {{ row.id }}
                </template>

                <template #name="{ row }">
                  {{ row.name }}
                </template>

                <template #scientific_name="{ row }">
                  {{ row.scientific_name }}
                </template>

                <template #type="{ row }">
                  {{ row.type }}
                </template>

                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View Details" @click="viewSpeciesDetails(row)" aria-label="View species details">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      title="Delete"
                      @click="() => confirmDeleteSpecies(row)"
                      :disabled="deletingId === row.id || bulkDeleting"
                      aria-label="Delete species"
                    >
                      <i v-if="deletingId !== row.id" class="fa fa-trash"></i>
                      <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Species Details View with Trophy Units -->
    <template v-else-if="showSpeciesDetails && currentSpecies">
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-outline-secondary btn-sm" @click="backToList">
              <i class="fa fa-arrow-left me-1"></i> Back
            </button>
            <div>
              <h5 class="mb-0">{{ currentSpecies.name }}</h5>
              <small class="text-muted">{{ currentSpecies.scientific_name }}</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge" :class="currentSpecies.type === 'MAIN' ? 'bg-primary' : 'bg-secondary'">
              {{ currentSpecies.type }}
            </span>
          </div>
        </div>
        
        <div class="card-body">
          <!-- Species Info -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="border rounded p-3 h-100">
                <h6 class="fw-bold text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Species Information</h6>
                <div class="mb-2">
                  <strong>Name:</strong> {{ currentSpecies.name }}
                </div>
                <div class="mb-2">
                  <strong>Scientific Name:</strong> {{ currentSpecies.scientific_name }}
                </div>
                <div class="mb-2">
                  <strong>Type:</strong> 
                  <span class="badge" :class="currentSpecies.type === 'MAIN' ? 'bg-primary' : 'bg-secondary'">
                    {{ currentSpecies.type === 'MAIN' ? 'Main Species' : 'Normal Species' }}
                  </span>
                </div>
                <div v-if="currentSpecies.description">
                  <strong>Description:</strong> {{ currentSpecies.description }}
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="border rounded p-3 h-100 bg-light">
                <h6 class="fw-bold text-success mb-3"><i class="fa fa-trophy me-2"></i>Trophy Units Summary</h6>
                <div class="d-flex align-items-center justify-content-center" style="min-height: 80px;">
                  <div class="text-center">
                    <h2 class="mb-0 text-success">{{ specieUnits.length }}</h2>
                    <small class="text-muted">Trophy Unit(s) Registered</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trophy Units Section -->
          <div class="border rounded p-3">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h6 class="fw-bold mb-0"><i class="fa fa-trophy text-warning me-2"></i>Trophy Units (Skull, Horns, etc.)</h6>
              <button class="btn btn-primary btn-sm" @click="openAddUnitForm" v-if="!showUnitForm">
                <i class="fa fa-plus me-1"></i> Add Trophy Unit
              </button>
            </div>

            <!-- Add/Edit Unit Form -->
            <div v-if="showUnitForm" class="card border-primary mb-3">
              <div class="card-header bg-primary bg-opacity-10 py-2">
                <span class="fw-semibold">{{ editingUnit ? 'Edit Trophy Unit' : 'Add New Trophy Unit' }}</span>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Unit Name <span class="text-danger">*</span></label>
                    <input 
                      v-model="unitForm.name" 
                      type="text" 
                      class="form-control" 
                      placeholder="e.g., Skull, Horns, Tusks, Hide"
                      required 
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Description</label>
                    <input 
                      v-model="unitForm.descriptions" 
                      type="text" 
                      class="form-control" 
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-primary btn-sm" @click="saveUnit" :disabled="savingUnit">
                    <span v-if="savingUnit" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="fa fa-save me-1"></i>
                    {{ editingUnit ? 'Update' : 'Save' }}
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelUnitForm">Cancel</button>
                </div>
              </div>
            </div>

            <!-- Units List -->
            <div v-if="loadingUnits" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted mt-2 mb-0">Loading trophy units...</p>
            </div>

            <div v-else-if="specieUnits.length === 0" class="text-center py-4 text-muted">
              <i class="fa fa-box-open fa-3x mb-3 opacity-50"></i>
              <p class="mb-0">No trophy units registered for this species.</p>
              <p class="small">Click "Add Trophy Unit" to register skull, horns, or other collectible parts.</p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 60px">#</th>
                    <th>Unit Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th style="width: 120px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(unit, index) in specieUnits" :key="unit.id">
                    <td class="text-muted">{{ index + 1 }}</td>
                    <td class="fw-semibold">
                      <i class="fa fa-trophy text-warning me-2"></i>
                      {{ unit.name }}
                    </td>
                    <td class="text-muted">{{ unit.descriptions || '-' }}</td>
                    <td class="text-muted small">
                      {{ unit.created_at ? new Date(unit.created_at).toLocaleDateString() : '-' }}
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-outline-primary btn-sm" title="Edit" @click="openEditUnitForm(unit)">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" title="Delete" @click="deleteUnit(unit)">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="mb-0">
            <i :class="sform.id ? 'fa fa-edit text-warning' : 'fa fa-plus-circle text-primary'" class="me-2"></i>
            {{ sform.id ? 'Edit Species' : 'Add New Species' }}
          </h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="onSubmit">
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Species Name</label>
                <input v-model="sform.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Scientific Name</label>
                <input v-model="sform.scientific_name" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Type</label>
                <select v-model="sform.type" class="form-select" required>
                  <option v-for="type in TYPES" :key="type.value" :value="type.value">{{ type.text }}</option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-12">
                <label class="form-label">Description</label>
                <textarea v-model="sform.description" class="form-control" rows="2" required></textarea>
            </div>
          </div>
          <div class="d-flex gap-2 mb-4">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <i class="fa fa-save me-1"></i> Save
            </button>
            <button type="button" class="btn btn-secondary" @click="showSpecies()">Cancel</button>
          </div>
        </form>

        <!-- CSV Import Section -->
        <div class="border-top pt-4">
          <h6 class="fw-bold mb-3"><i class="fa fa-file-csv me-2 text-success"></i>Bulk Import from CSV</h6>
          
          <!-- Drag and Drop Upload Area -->
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

          <!-- CSV Preview Panel -->
          <div v-if="showCsvPreview" class="csv-preview-panel mt-3">
            <div class="card">
              <div class="card-header bg-light d-flex align-items-center justify-content-between py-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-table text-primary"></i>
                  <span class="fw-semibold">CSV Preview</span>
                  <span class="badge bg-primary">{{ csvPreviewData.length }} rows</span>
                  <span v-if="csvDuplicates > 0" class="badge bg-warning text-dark">{{ csvDuplicates }} duplicates skipped</span>
                  <span v-if="csvNewCount > 0" class="badge bg-success">{{ csvNewCount }} new</span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <div class="card-body p-0">
                <!-- Column Mapping -->
                <div class="p-3 border-bottom bg-light">
                  <div class="row g-2 align-items-end">
                    <div class="col-md-4">
                      <label class="form-label small fw-semibold">Name Column</label>
                      <select v-model="csvColumnMap.name" class="form-select form-select-sm" @change="recalculateCsvPreview">
                        <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small fw-semibold">Scientific Name Column</label>
                      <select v-model="csvColumnMap.scientific_name" class="form-select form-select-sm" @change="recalculateCsvPreview">
                        <option value="">(None)</option>
                        <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small fw-semibold">Type Column</label>
                      <select v-model="csvColumnMap.type" class="form-select form-select-sm" @change="recalculateCsvPreview">
                        <option value="">(Default: NORMAL)</option>
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
                          <input type="checkbox" class="form-check-input" :checked="allCsvRowsSelected" @change="toggleAllCsvRows" />
                        </th>
                        <th>Name</th>
                        <th>Scientific Name</th>
                        <th>Type</th>
                        <th style="width: 100px;">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, idx) in csvPreviewData" :key="idx" :class="{ 'table-secondary': row._duplicate }">
                        <td>
                          <input type="checkbox" class="form-check-input" v-model="row._selected" :disabled="row._duplicate" />
                        </td>
                        <td>{{ row.name }}</td>
                        <td>{{ row.scientific_name || '-' }}</td>
                        <td><span class="badge" :class="row.type === 'MAIN' ? 'bg-primary' : 'bg-secondary'">{{ row.type }}</span></td>
                        <td>
                          <span v-if="row._duplicate" class="badge bg-warning text-dark"><i class="fa fa-copy me-1"></i>Exists</span>
                          <span v-else class="badge bg-success"><i class="fa fa-plus me-1"></i>New</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="card-footer bg-light d-flex align-items-center justify-content-between py-2">
                <div class="text-muted small">
                  <i class="fa fa-check-circle text-success me-1"></i>
                  {{ csvSelectedCount }} of {{ csvNewCount }} new species selected for import
                </div>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeCsvPreview">
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-success"
                    :disabled="csvSelectedCount === 0 || importInProgress"
                    @click="startCsvImport"
                  >
                    <i v-if="!importInProgress" class="fa fa-upload me-1"></i>
                    <span v-else class="spinner-border spinner-border-sm me-1" role="status"></span>
                    Import {{ csvSelectedCount }} Species
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Import Progress -->
          <div v-if="importInProgress" class="mt-3">
            <div class="card border-primary">
              <div class="card-body">
                <div class="d-flex align-items-center gap-3 mb-2">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span class="fw-semibold">Importing species...</span>
                  <span class="text-muted">{{ importProcessed }} / {{ importTotal }}</span>
                </div>
                <div class="progress" style="height: 8px;">
                  <div
                    class="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    :style="{ width: importProgressPercent + '%' }"
                  ></div>
                </div>
                <div v-if="importResults.length > 0" class="mt-2">
                  <small class="text-success"><i class="fa fa-check me-1"></i>{{ importSuccessCount }} succeeded</small>
                  <small v-if="importFailCount > 0" class="text-danger ms-3"><i class="fa fa-times me-1"></i>{{ importFailCount }} failed</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Import Results -->
          <div v-if="showImportResults && !importInProgress" class="mt-3">
            <div class="card" :class="importFailCount > 0 ? 'border-warning' : 'border-success'">
              <div class="card-header d-flex align-items-center justify-content-between py-2" :class="importFailCount > 0 ? 'bg-warning bg-opacity-10' : 'bg-success bg-opacity-10'">
                <span class="fw-semibold">
                  <i class="fa fa-check-circle text-success me-2" v-if="importFailCount === 0"></i>
                  <i class="fa fa-exclamation-triangle text-warning me-2" v-else></i>
                  Import Complete
                </span>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeImportResults">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <div class="card-body">
                <div class="row text-center">
                  <div class="col">
                    <h4 class="text-success mb-0">{{ importSuccessCount }}</h4>
                    <small class="text-muted">Imported</small>
                  </div>
                  <div class="col" v-if="importFailCount > 0">
                    <h4 class="text-danger mb-0">{{ importFailCount }}</h4>
                    <small class="text-muted">Failed</small>
                  </div>
                </div>
                <div v-if="importFailCount > 0" class="mt-3">
                  <p class="small text-muted mb-2">Failed items:</p>
                  <ul class="list-group list-group-flush small">
                    <li v-for="(r, i) in importResults.filter(x => !x.ok).slice(0, 10)" :key="i" class="list-group-item py-1 px-2">
                      <i class="fa fa-times text-danger me-1"></i> {{ r.name }}
                      <span v-if="r.error" class="text-muted">- {{ Array.isArray(r.error) ? r.error.join(', ') : r.error }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useSpeciesStore } from '../../../stores/bushman/species-store'
import { useSpecieUnitsStore } from '../../../stores/bushman/specie-units-store'
import handleErrors from '../../../stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const quotaStore = useQuotaStore()
const speciesStore = useSpeciesStore()
const specieUnitsStore = useSpecieUnitsStore()
const toast = useToast()

const showSpeciesList = ref(true)
const showSpeciesDetails = ref(false)
const loading = ref(false)
const saving = ref(false)
const items = ref([])
const selectedIds = ref(new Set())
const deletingId = ref<number | string | null>(null)
const bulkDeleting = ref(false)
const currentSpecies = ref<any>(null)

// Specie Units (Trophies) state
const specieUnits = ref<any[]>([])
const loadingUnits = ref(false)
const savingUnit = ref(false)
const showUnitForm = ref(false)
const editingUnit = ref<any>(null)
const unitForm = reactive({
  name: '',
  descriptions: '',
})

const selectedCount = computed(() => (selectedIds.value && typeof selectedIds.value.size === 'number') ? selectedIds.value.size : 0)

function hasSelected(id: number | string) {
  try {
    return !!(selectedIds.value && typeof selectedIds.value.has === 'function' && selectedIds.value.has(id))
  } catch (e) {
    return false
  }
}

const sform = reactive({
  id: null as any,
  name: '',
  type: '',
  scientific_name: '',
  description: '',
})

const csvInput = ref(null)
const importInProgress = ref(false)
const importTotal = ref(0)
const importProcessed = ref(0)
const importResults = ref([] as any[])

// CSV Import UI state
const isDragOver = ref(false)
const csvFile = ref<File | null>(null)
const showCsvPreview = ref(false)
const showImportResults = ref(false)
const csvHeaders = ref<string[]>([])
const csvRawRows = ref<any[]>([])
const csvPreviewData = ref<any[]>([])
const csvColumnMap = reactive({
  name: '',
  scientific_name: '',
  type: '',
})

const csvDuplicates = computed(() => csvPreviewData.value.filter((r: any) => r._duplicate).length)
const csvNewCount = computed(() => csvPreviewData.value.filter((r: any) => !r._duplicate).length)
const csvSelectedCount = computed(() => csvPreviewData.value.filter((r: any) => r._selected && !r._duplicate).length)
const allCsvRowsSelected = computed(() => {
  const selectable = csvPreviewData.value.filter((r: any) => !r._duplicate)
  return selectable.length > 0 && selectable.every((r: any) => r._selected)
})
const importProgressPercent = computed(() => importTotal.value > 0 ? Math.round((importProcessed.value / importTotal.value) * 100) : 0)
const importSuccessCount = computed(() => importResults.value.filter((r: any) => r.ok).length)
const importFailCount = computed(() => importResults.value.filter((r: any) => !r.ok).length)

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function toggleAllCsvRows() {
  const allSelected = allCsvRowsSelected.value
  csvPreviewData.value.forEach((r: any) => {
    if (!r._duplicate) r._selected = !allSelected
  })
}

function handleFileDrop(e: DragEvent) {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
      csvFile.value = file
      processCsvFile(file)
    } else {
      toast.init({ message: 'Please upload a CSV file', color: 'warning' })
    }
  }
}

function clearCsvFile() {
  csvFile.value = null
  showCsvPreview.value = false
  csvHeaders.value = []
  csvRawRows.value = []
  csvPreviewData.value = []
  csvColumnMap.name = ''
  csvColumnMap.scientific_name = ''
  csvColumnMap.type = ''
}

function closeCsvPreview() {
  showCsvPreview.value = false
  clearCsvFile()
}

function closeImportResults() {
  showImportResults.value = false
  importResults.value = []
}

const TYPES = [
  { value: 'MAIN', text: 'Main Species' },
  { value: 'NORMAL', text: 'Normal Species' },
]

const columns = [
  { key: 'select', label: '', sortable: false, visible: true },
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'scientific_name', label: 'Scientific Name', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => {
  const actions: any[] = []
  actions.push({ label: 'Add Species', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => showSpecies() })
  actions.push({ label: 'Export', icon: 'fa fa-file-excel', class: 'btn btn-success', method: () => exportSpeciesCSV() })
  // Add Delete Selected only when there is at least one selected item
  if (selectedCount.value > 0) {
    actions.push({
      label: `Delete selected (${selectedCount.value})`,
      icon: 'fa fa-trash',
      class: 'btn btn-danger',
      method: () => confirmBulkDelete(),
    })
  }
  return actions
})

function toggleSelect(id: number | string) {
  const set = selectedIds.value
  if (set.has(id)) set.delete(id)
  else set.add(id)
  // force update
  selectedIds.value = new Set(Array.from(set))
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function confirmDeleteSpecies(row: any) {
  const id = row.id
  const name = row.name || id
  const confirmation = await Swal.fire({
    title: 'Delete species',
    html: `Are you sure you want to delete <strong>${name}</strong>?<br/><small>This may affect related records.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })

  if (!confirmation.isConfirmed) return

  deletingId.value = id
  try {
    const resp = await speciesStore.deleteSpecies(id, false)
    if (resp.status === 204 || resp.status === 200) {
      toast.init({ message: 'Species deleted', color: 'success' })
      // optimistic UI: remove locally
      items.value = items.value.filter((it: any) => it.id !== id)
      selectedIds.value.delete(id)
    }
  } catch (err: any) {
    const status = err?.response?.status
    const data = err?.response?.data
    if ((status === 409 || status === 500) && data) {
      // Show referenced objects and offer force delete. For 500 responses include details.
      const refs = data?.references || data?.referenced_objects || data?.details || []
      const listHtml = refs.length > 0 ? `<ul style="text-align:left">${refs
        .map((r: any) => `<li>${r?.label || r?.name || r?.id} (${r?.type || 'ref'})</li>`)
        .slice(0, 50)
        .join('')}</ul>` : '<em>No details provided</em>'

      const forceResult = await Swal.fire({
        title: 'Conflict: referenced by other records',
        html: `<p>The species is referenced by other records. Deleting it may affect them.</p>${listHtml}<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="force-delete-single"><label class="form-check-label" for="force-delete-single">Also remove references (force delete)</label></div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete (force)',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        preConfirm: () => {
          const cb: any = document.getElementById('force-delete-single') as HTMLInputElement
          return cb?.checked === true
        },
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
        buttonsStyling: false,
      })

      if (forceResult.isConfirmed && forceResult.value) {
        try {
          const r2 = await speciesStore.deleteSpecies(id, true)
          if (r2.status === 204 || r2.status === 200) {
            toast.init({ message: 'Species force-deleted', color: 'success' })
            items.value = items.value.filter((it: any) => it.id !== id)
            selectedIds.value.delete(id)
          }
        } catch (e: any) {
          toast.init({ message: handleErrors(e.response || e).join('\n') || 'Failed to force delete', color: 'danger' })
        }
      }
    } else {
      toast.init({ message: handleErrors(err.response || err).join('\n') || 'Failed to delete species', color: 'danger' })
    }
  } finally {
    deletingId.value = null
  }
}

async function confirmBulkDelete() {
  const ids = Array.from(selectedIds.value)
  if (!ids || ids.length === 0) {
    toast.init({ message: 'No species selected', color: 'info' })
    return
  }

  const preview = items.value.filter((it: any) => hasSelected(it.id)).slice(0, 10).map((i: any) => i.name || i.id)
  const html = `<p>Delete <strong>${ids.length}</strong> selected species?</p><p>Preview: ${preview.join(', ')}${items.value.length > 10 ? ', ...' : ''}</p><div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="force-delete-bulk"><label class="form-check-label" for="force-delete-bulk">Force delete (remove references)</label></div>`

  const result = await Swal.fire({
    title: 'Delete selected species',
    html,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    preConfirm: () => {
      const cb: any = document.getElementById('force-delete-bulk') as HTMLInputElement
      return cb?.checked === true
    },
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })

  if (!result.isConfirmed) return
  const force = !!result.value

  bulkDeleting.value = true
  try {
    const resp = await speciesStore.bulkDelete(ids, force)
    // Handle per-item results if provided
    if (resp.status === 200) {
      const resData = resp.data
      if (resData && resData.results && Array.isArray(resData.results)) {
        const succeeded = resData.results.filter((r: any) => r.status === 'ok' || r.status === 'deleted').map((r: any) => r.id)
        const failed = resData.results.filter((r: any) => r.status !== 'ok' && r.status !== 'deleted')
        if (succeeded.length > 0) {
          items.value = items.value.filter((it: any) => !succeeded.includes(it.id))
        }
        if (failed.length > 0) {
          const reasons = failed.map((f: any) => `${f.id}: ${f.message || f.reason || 'blocked'}`).join('\n')
          toast.init({ message: `Some items failed:\n${reasons}`, color: 'warning' })
        } else {
          toast.init({ message: `Deleted ${succeeded.length} species`, color: 'success' })
        }
      } else {
        // Generic success
        toast.init({ message: 'Selected species deleted', color: 'success' })
        // Remove locally
        items.value = items.value.filter((it: any) => !(selectedIds.value && typeof selectedIds.value.has === 'function' && selectedIds.value.has(it.id)))
      }
      clearSelection()
    }
  } catch (err: any) {
    const status = err?.response?.status
    const data = err?.response?.data
    // Backends may return 409 (conflict) or 500 with integrity details. Handle both.
    if ((status === 409 || status === 500) && data) {
      const blocked = data?.blocked || data?.details || data?.referenced_objects || []
      // If server returned SQL integrity details, include them in modal and don't offer silent deletion
      const listHtml = Array.isArray(blocked) && blocked.length > 0 ? `<ul style="text-align:left">${blocked.map((b: any) => `<li>${b.id || b?.name || ''}: ${b.reason || b.message || b || 'referenced'}</li>`).join('')}</ul>` : `<pre style="text-align:left;white-space:pre-wrap">${String(data?.details || data?.error || JSON.stringify(data))}</pre>`
      const forceResult = await Swal.fire({
        title: 'Some items are referenced or blocked',
        html: `<p>Some selected species are referenced by other records or cannot be deleted due to constraints.</p>${listHtml}<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="force-delete-bulk-2"><label class="form-check-label" for="force-delete-bulk-2">Attempt force delete (may fail)</label></div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Attempt force delete',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          const cb: any = document.getElementById('force-delete-bulk-2') as HTMLInputElement
          return cb?.checked === true
        },
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
        buttonsStyling: false,
      })
      if (forceResult.isConfirmed && forceResult.value) {
        try {
          const r2 = await speciesStore.bulkDelete(ids, true)
          if (r2.status === 200) {
            toast.init({ message: 'Force delete completed', color: 'success' })
            items.value = items.value.filter((it: any) => !(selectedIds.value && typeof selectedIds.value.has === 'function' && selectedIds.value.has(it.id)))
            clearSelection()
          }
        } catch (e: any) {
          toast.init({ message: handleErrors(e.response || e).join('\n') || 'Bulk force delete failed', color: 'danger' })
        }
      }
    } else {
      toast.init({ message: handleErrors(err.response || err).join('\n') || 'Bulk delete failed', color: 'danger' })
    }
  } finally {
    bulkDeleting.value = false
  }
}

function exportSpeciesCSV() {
  if (!items.value || items.value.length === 0) {
    toast.init({ message: 'No species to export', color: 'info' })
    return
  }

  const headers = ['ID', 'Name', 'Scientific Name', 'Type']
  const rows = items.value.map((it: any) => [it.id, it.name, it.scientific_name || '', it.type || ''])

  const csvContent = [headers, ...rows].map((e) => e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const filename = `species-${new Date().toISOString().slice(0,10)}.csv`
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename)
  } else {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

function triggerCsvInput() {
  const el: any = csvInput.value
  if (el) el.click()
}

async function parseCsvText(text: string) {
  // Try using PapaParse dynamically (preferred). If not available, fallback to simple parser.
  const trimmed = String(text || '').trim()
  if (!trimmed) return { headerFields: [], rows: [] }
  try {
    const PapaModule = await import('papaparse')
    const Papa = PapaModule && (PapaModule.default || PapaModule)
    const parsed = Papa.parse(trimmed, { header: true, skipEmptyLines: true })
    const headerFields = parsed?.meta?.fields || (parsed.data && parsed.data.length ? Object.keys(parsed.data[0]) : [])
    return { headerFields, rows: parsed.data || [] }
  } catch (e) {
    // Fallback simple CSV parser (basic header + comma handling + quotes)
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length === 0) return { headerFields: [], rows: [] }

    function splitLine(line: string) {
      const result: string[] = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (ch === ',' && !inQuotes) {
          result.push(cur)
          cur = ''
        } else {
          cur += ch
        }
      }
      result.push(cur)
      return result.map((s) => s.trim())
    }

    const headerFields = splitLine(lines[0])
    const rows = lines.slice(1).map((ln) => {
      const fields = splitLine(ln)
      const obj: any = {}
      for (let i = 0; i < headerFields.length; i++) {
        obj[headerFields[i]] = fields[i] ?? ''
      }
      return obj
    })
    return { headerFields, rows }
  }
}

async function onCsvSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  csvFile.value = file
  await processCsvFile(file)
  // Reset input so same file can be re-selected
  input.value = ''
}

async function processCsvFile(file: File) {
  const text = await file.text()
  const parsed = await parseCsvText(text)
  if (!parsed || !parsed.rows || parsed.rows.length === 0) {
    toast.init({ message: 'CSV contains no rows', color: 'info' })
    clearCsvFile()
    return
  }

  csvHeaders.value = parsed.headerFields
  csvRawRows.value = parsed.rows

  // Auto-detect columns
  const headersLower = parsed.headerFields.map((h: string) => h.toLowerCase())
  
  // Name column
  const tryNames = ['name', 'species', 'species_name', 'speciesname']
  for (const t of tryNames) {
    const idx = headersLower.findIndex((h) => h.includes(t))
    if (idx >= 0) {
      csvColumnMap.name = parsed.headerFields[idx]
      break
    }
  }
  if (!csvColumnMap.name && parsed.headerFields.length > 0) {
    csvColumnMap.name = parsed.headerFields[0]
  }

  // Scientific name column
  const trySci = ['scientific', 'sci_name', 'scientificname', 'latin']
  for (const t of trySci) {
    const idx = headersLower.findIndex((h) => h.includes(t))
    if (idx >= 0) {
      csvColumnMap.scientific_name = parsed.headerFields[idx]
      break
    }
  }

  // Type column
  const tryType = ['type', 'category', 'species_type']
  for (const t of tryType) {
    const idx = headersLower.findIndex((h) => h === t)
    if (idx >= 0) {
      csvColumnMap.type = parsed.headerFields[idx]
      break
    }
  }

  recalculateCsvPreview()
  showCsvPreview.value = true
}

function recalculateCsvPreview() {
  const existingNames = new Set(items.value.map((it: any) => (it.name || '').toLowerCase().trim()))
  const seenNames = new Set<string>()
  
  csvPreviewData.value = csvRawRows.value.map((row: any) => {
    const name = String(row[csvColumnMap.name] || '').trim()
    const scientific_name = csvColumnMap.scientific_name ? String(row[csvColumnMap.scientific_name] || '').trim() : ''
    let type = csvColumnMap.type ? String(row[csvColumnMap.type] || '').trim().toUpperCase() : 'NORMAL'
    if (type !== 'MAIN' && type !== 'NORMAL') type = 'NORMAL'
    
    const key = name.toLowerCase()
    const isDuplicate = !name || existingNames.has(key) || seenNames.has(key)
    if (name) seenNames.add(key)
    
    return {
      name,
      scientific_name,
      type,
      _duplicate: isDuplicate,
      _selected: !isDuplicate,
    }
  }).filter((r: any) => r.name) // Remove empty names
}

async function startCsvImport() {
  const toImport = csvPreviewData.value.filter((r: any) => r._selected && !r._duplicate)
  if (toImport.length === 0) {
    toast.init({ message: 'No species selected for import', color: 'info' })
    return
  }

  importInProgress.value = true
  importTotal.value = toImport.length
  importProcessed.value = 0
  importResults.value = []
  showCsvPreview.value = false

  for (const sp of toImport) {
    try {
      const r = await speciesStore.createSpecies({
        name: sp.name,
        scientific_name: sp.scientific_name || '',
        description: sp.description || '',
        type: sp.type || 'NORMAL',
      })
      importResults.value.push({ name: sp.name, ok: r.status === 201 || r.status === 200 })
      if (r.status === 201 || r.status === 200) {
        items.value.unshift({
          id: r.data?.id ?? Math.random().toString(36).slice(2),
          name: sp.name,
          scientific_name: sp.scientific_name,
          type: sp.type,
        })
      }
    } catch (err: any) {
      importResults.value.push({ name: sp.name, ok: false, error: handleErrors(err.response || err) })
    } finally {
      importProcessed.value += 1
    }
  }

  importInProgress.value = false
  showImportResults.value = true
  clearCsvFile()

  // Refresh list from server
  await getSpeciesItems()
}

function showSpecies(row?: any) {
  showSpeciesDetails.value = false
  showSpeciesList.value = !showSpeciesList.value
  currentSpecies.value = null
  specieUnits.value = []
  if (row) {
    // Optionally populate sform for editing if needed
  } else {
    Object.assign(sform, { id: null, name: '', type: '', scientific_name: '', description: '' })
  }
}

function editSpeciesForm(row: any) {
  showSpeciesDetails.value = false
  showSpeciesList.value = false
  currentSpecies.value = null
  specieUnits.value = []
  Object.assign(sform, {
    id: row.id,
    name: row.name || '',
    type: row.type || '',
    scientific_name: row.scientific_name || '',
    description: row.description || '',
  })
}

async function onSubmit() {
  saving.value = true
  try {
    const requestData = {
      name: sform.name,
      scientific_name: sform.scientific_name,
      description: sform.description,
      type: sform.type,
    }
    
    let response
    if (sform.id) {
      // Update existing species
      response = await speciesStore.updateSpecies(sform.id, requestData)
      if (response.status === 200) {
        toast.init({ message: response.data.message || 'Species updated successfully', color: 'success' })
        await getSpeciesItems()
        showSpecies()
      }
    } else {
      // Create new species
      response = await speciesStore.createSpecies(requestData)
      if (response.status === 201) {
        toast.init({ message: response.data.message, color: 'success' })
        await getSpeciesItems()
        showSpecies()
      }
    }
  } catch (error: any) {
    const errors = handleErrors(error.response || error)
    const message =
      errors.length > 0
        ? '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n')
        : 'An unexpected error occurred. Please try again later.'
    toast.init({ message, color: 'danger' })
  } finally {
    saving.value = false
  }
}

async function getSpeciesItems() {
  loading.value = true
  try {
    const response = await quotaStore.getSpeciesList()
    if (response.status === 200) {
      items.value = response?.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        scientific_name: item.scientific_name,
        description: item.description,
      }))
    }
  } catch (error) {
    toast.init({ message: 'Failed to fetch species items', color: 'danger' })
  } finally {
    loading.value = false
  }
}

// Specie Units (Trophies) functions
async function loadSpecieUnits(specieId: number) {
  loadingUnits.value = true
  try {
    const response = await specieUnitsStore.getSpecieUnits(specieId)
    if (response.status === 200) {
      specieUnits.value = response.data.data || response.data || []
    }
  } catch (error) {
    console.error('Error loading specie units:', error)
    specieUnits.value = []
  } finally {
    loadingUnits.value = false
  }
}

function openAddUnitForm() {
  editingUnit.value = null
  unitForm.name = ''
  unitForm.descriptions = ''
  showUnitForm.value = true
}

function openEditUnitForm(unit: any) {
  editingUnit.value = unit
  unitForm.name = unit.name || ''
  unitForm.descriptions = unit.descriptions || ''
  showUnitForm.value = true
}

function cancelUnitForm() {
  showUnitForm.value = false
  editingUnit.value = null
  unitForm.name = ''
  unitForm.descriptions = ''
}

async function saveUnit() {
  if (!unitForm.name.trim()) {
    toast.init({ message: 'Unit name is required', color: 'warning' })
    return
  }

  savingUnit.value = true
  try {
    if (editingUnit.value) {
      // Update existing unit
      const response = await specieUnitsStore.updateSpecieUnit(editingUnit.value.id, {
        name: unitForm.name,
        descriptions: unitForm.descriptions,
      })
      if (response.status === 200) {
        toast.init({ message: 'Trophy unit updated successfully', color: 'success' })
        cancelUnitForm()
        if (currentSpecies.value?.id) {
          await loadSpecieUnits(currentSpecies.value.id)
        }
      }
    } else {
      // Create new unit
      if (!currentSpecies.value?.id) {
        toast.init({ message: 'Please save the species first before adding trophy units', color: 'warning' })
        savingUnit.value = false
        return
      }
      const response = await specieUnitsStore.createSpecieUnit({
        specie_id: currentSpecies.value.id,
        name: unitForm.name,
        descriptions: unitForm.descriptions,
      })
      if (response.status === 201 || response.status === 200) {
        toast.init({ message: 'Trophy unit added successfully', color: 'success' })
        cancelUnitForm()
        await loadSpecieUnits(currentSpecies.value.id)
      }
    }
  } catch (error: any) {
    const errors = handleErrors(error.response || error)
    toast.init({ message: errors.join(', ') || 'Failed to save trophy unit', color: 'danger' })
  } finally {
    savingUnit.value = false
  }
}

async function deleteUnit(unit: any) {
  const confirmation = await Swal.fire({
    title: 'Delete Trophy Unit',
    html: `Are you sure you want to delete <strong>${unit.name}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  })

  if (!confirmation.isConfirmed) return

  try {
    const response = await specieUnitsStore.deleteSpecieUnit(unit.id)
    if (response.status === 200 || response.status === 204) {
      toast.init({ message: 'Trophy unit deleted', color: 'success' })
      if (currentSpecies.value?.id) {
        await loadSpecieUnits(currentSpecies.value.id)
      }
    }
  } catch (error: any) {
    toast.init({ message: 'Failed to delete trophy unit', color: 'danger' })
  }
}

function viewSpeciesDetails(row: any) {
  currentSpecies.value = row
  showSpeciesList.value = false
  showSpeciesDetails.value = true
  loadSpecieUnits(row.id)
}

function backToList() {
  showSpeciesList.value = true
  showSpeciesDetails.value = false
  currentSpecies.value = null
  specieUnits.value = []
  cancelUnitForm()
}

onMounted(() => {
  getSpeciesItems()
})
</script>


<style scoped>
.species-page {
  padding: 16px;
}
.custom-table {
  background: #fff;
  border-radius: 8px;
}
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

/* CSV Upload Area Styles */
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

.csv-upload-area .upload-text p {
  margin: 0;
}

.csv-upload-area .selected-file {
  padding: 0.5rem;
  text-align: left;
}

/* CSV Preview Panel */
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

/* Progress bar animation */
.progress-bar-animated {
  animation: progress-bar-stripes 1s linear infinite;
}

@keyframes progress-bar-stripes {
  from { background-position: 1rem 0; }
  to { background-position: 0 0; }
}
</style>
