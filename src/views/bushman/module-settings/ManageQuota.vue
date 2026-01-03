<template>
  <div class="quota-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Quotas</li>
        </ul>
      </div>
    </div>

    <!-- Table View (Quota List) -->
    <template v-if="showQuotaList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loadingQuotas"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :show-date-filters="false"
              >
                <template #id="{ row }">
                  {{ row.id }}
                </template>
                <template #name="{ row }">
                  {{ row.name }}
                </template>
                <template #start_date="{ row }">
                  {{ row.start_date }}
                </template>
                <template #end_date="{ row }">
                  {{ row.end_date }}
                </template>
                <template #species_count="{ row }">
                  {{ row.species_count ?? 0 }}
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View" @click="viewQuotaDetails(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" title="Edit" @click="editQuota(row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeleteQuota(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Details View (Individual Quota) -->
    <template v-else-if="showDetailsPage && currentViewQuota">
      <div class="quota-details">
        <div class="card">
          <div class="card-header d-flex align-items-center bg-white">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <i class="fa fa-clipboard-list fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">{{ currentViewQuota.name || 'N/A' }}</h4>
                <small class="text-muted">Sales Quota</small>
              </div>
            </div>
            <div class="ms-auto d-flex gap-2">
              <button class="btn btn-success btn-sm" @click="showAddSpeciesForm">
                <i class="fa fa-plus me-1"></i> Add Species
              </button>
              <button class="btn btn-outline-primary btn-sm" @click="exportQuotaCsv">
                <i class="fa fa-file-csv me-1"></i> Export CSV
              </button>
              <button class="btn btn-secondary btn-sm" @click="goBackToList">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="card border-primary">
                  <div class="card-body">
                    <h6 class="card-title text-primary"><i class="fa fa-info-circle me-2"></i>Quota Information</h6>
                    <p class="mb-1"><strong>Name:</strong> {{ currentViewQuota.name || 'N/A' }}</p>
                    <p class="mb-1"><strong>Start Date:</strong> {{ currentViewQuota.start_date || 'N/A' }}</p>
                    <p class="mb-0"><strong>End Date:</strong> {{ currentViewQuota.end_date || 'N/A' }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header bg-white">
                <h6 class="mb-0">
                  <i class="fa fa-paw me-2 text-primary"></i>
                  Species ({{ speciesObjects.length }})
                </h6>
              </div>
              <div class="card-body">
                <div v-if="loadingSpecies" class="text-center py-3">
                  <span class="spinner-border spinner-border-sm me-2"></span>Loading species...
                </div>
                <div v-else-if="speciesObjects.length > 0" class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Species Name</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(species, index) in speciesObjects" :key="index">
                        <td>{{ species.name }}</td>
                        <td>{{ species.quantity || 'N/A' }}</td>
                        <td>
                          <button class="btn btn-sm btn-danger" @click="deleteSpeciesFromQuota(index, species.record_id)">
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-center py-3 text-muted">
                  <i class="fa fa-info-circle me-2"></i>No species added to this quota.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Form View (Add/Edit Quota) -->
    <template v-else-if="showQuotaForm">
      <div class="p-6">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button class="btn btn-secondary" @click="goBackToList">
              <i class="fa fa-arrow-left me-2"></i>Go Back
            </button>
          </div>
        </div>

        <div class="p-2">
          <form @submit.prevent="onQuotaSubmit">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label">Name</label>
                <input v-model="form.name" type="text" class="form-control" placeholder="Enter quota name" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Hunting Area</label>
                <select v-model="sform.area" class="form-select">
                  <option :value="null">Select an area to assign species</option>
                  <option v-for="a in areasOptions" :key="a.value" :value="a">{{ a.text }}</option>
                </select>
              </div>
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label">Start Date</label>
                <input v-model="form.start_date" type="date" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">End Date</label>
                <input v-model="form.end_date" type="date" class="form-control" required />
              </div>
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-12">
                <label class="form-label">Description</label>
                <textarea v-model="form.description" class="form-control" rows="3" placeholder="Optional description"></textarea>
              </div>
            </div>

            <div v-if="!quotaCreatedForSpecies" class="mb-4">
              <button class="btn btn-success" :disabled="savingQuota || !form.name || !form.start_date || !form.end_date" type="submit">
                <span v-if="savingQuota" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="fa fa-check me-2"></i>{{ isEditing ? 'Update Quota' : 'Create Quota' }}
              </button>
            </div>

            <!-- Species Section (shown after quota creation) -->
            <template v-if="quotaCreatedForSpecies">
              <hr class="my-4" />

              <!-- Import Mode Toggle -->
              <div v-if="!importInProgress && !showImportResults" class="mb-4">
                <div class="d-flex align-items-center gap-3 p-3 bg-light rounded">
                  <span class="fw-semibold text-muted" style="font-size: 0.9rem;">Import Method:</span>
                  <div class="btn-group" role="group">
                    <input type="radio" class="btn-check" id="csvMode" value="csv" v-model="importMode" autocomplete="off">
                    <label class="btn btn-outline-primary" for="csvMode">
                      <i class="fa fa-file-csv me-1"></i> CSV Import
                    </label>
                    <input type="radio" class="btn-check" id="manualMode" value="manual" v-model="importMode" autocomplete="off">
                    <label class="btn btn-outline-primary" for="manualMode">
                      <i class="fa fa-keyboard me-1"></i> Manual Entry
                    </label>
                  </div>
                </div>
              </div>

              <!-- Manual Species Entry -->
              <div v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="fw-bold">Add Species Manually</span>
                </div>

                <!-- MultiRowTableInput Component -->
                <MultiRowTableInput v-model="speciesRows" :fields="speciesFields" add-button-label="Add Species" />
              </div>

              <hr v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="my-4" />

              <!-- CSV Input Component -->
              <div v-if="importMode === 'csv'" class="mb-4">
                <h6 class="fw-bold mb-3 d-flex align-items-center">
                  <div class="d-flex align-items-center gap-2">
                    <i class="fa fa-file-csv text-success"></i>
                    <span>Bulk Import from CSV</span>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-success ms-auto" @click="downloadSpeciesTemplate">
                    <i class="fa fa-download me-1"></i>
                    Download Template
                  </button>
                </h6>
                <CSVInput
                  :column-fields="csvColumnFields"
                  duplicate-key-field="name"
                  :model-value="existingCsvModel"
                  :allowed-values="allowedSpeciesNames"
                  :clear-after-import="true"
                  @import="handleCsvImport"
                />

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
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                          :style="{ width: importProgressPercent + '%' }"></div>
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

              <div v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="mb-4">
                <button class="btn btn-success" :disabled="savingQuotaSpecies || speciesRows.length === 0 || !sform.area" type="button" @click="submitSpeciesAfterQuotaCreation">
                  <span v-if="savingQuotaSpecies" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="fa fa-check me-2"></i>Submit Species
                </button>
              </div>

              <div class="mt-3">
                <button class="btn btn-secondary" @click="goBackToList">
                  <i class="fa fa-times me-1"></i>Close
                </button>
              </div>
            </template>
          </form>
        </div>
      </div>
    </template>

    <!-- Form View (Add Species to Quota) -->
    <template v-else-if="showSpeciesForm">
      <div class="p-6">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button class="btn btn-secondary" @click="goBackToDetails">
              <i class="fa fa-arrow-left me-2"></i>Go Back
            </button>
          </div>
        </div>

        <div class="p-2">
          <form @submit.prevent="onSpeciesSubmit">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Sales Quota</label>
                <input type="text" class="form-control" :value="currentViewQuota?.name" disabled />
              </div>
            </div>

            <hr class="my-4" />

            <!-- Import Mode Toggle -->
            <div v-if="!importInProgress && !showImportResults" class="mb-4">
              <div class="d-flex align-items-center gap-3 p-3 bg-light rounded">
                <span class="fw-semibold text-muted" style="font-size: 0.9rem;">Import Method:</span>
                <div class="btn-group" role="group">
                  <input type="radio" class="btn-check" id="csvModeSpecies" value="csv" v-model="importMode" autocomplete="off">
                  <label class="btn btn-outline-primary" for="csvModeSpecies">
                    <i class="fa fa-file-csv me-1"></i> CSV Import
                  </label>
                  <input type="radio" class="btn-check" id="manualModeSpecies" value="manual" v-model="importMode" autocomplete="off">
                  <label class="btn btn-outline-primary" for="manualModeSpecies">
                    <i class="fa fa-keyboard me-1"></i> Manual Entry
                  </label>
                </div>
              </div>
            </div>

            <!-- Manual Species Entry -->
            <div v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold">Add Species Manually</span>
              </div>

              <!-- MultiRowTableInput Component -->
              <MultiRowTableInput v-model="speciesRows" :fields="speciesFields" add-button-label="Add Species" />
            </div>

            <hr v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="my-4" />

            <!-- CSV Input Component -->
            <div v-if="importMode === 'csv'" class="mb-4">
              <h6 class="fw-bold mb-3 d-flex align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-file-csv text-success"></i>
                  <span>Bulk Import from CSV</span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-success ms-auto" @click="downloadSpeciesTemplate">
                  <i class="fa fa-download me-1"></i>
                  Download Template
                </button>
              </h6>
              <CSVInput
                :column-fields="csvColumnFields"
                duplicate-key-field="name"
                :model-value="existingCsvModel"
                :allowed-values="allowedSpeciesNames"
                :clear-after-import="true"
                @import="handleCsvImport"
              />

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
                      <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                        :style="{ width: importProgressPercent + '%' }"></div>
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

            <div v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="mb-4">
              <button class="btn btn-success" :disabled="savingQuotaSpecies || speciesRows.length === 0" type="submit">
                <span v-if="savingQuotaSpecies" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="fa fa-check me-2"></i>Submit Species
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useHuntingAreaStore } from '@/stores/bushman/hunting-story'
import handleErrors from '../../../stores/bushman/errorHandler'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'
import CSVInput from '../reusables/CSVInput.vue'
import Swal from 'sweetalert2'
import { useSpeciesStore } from '@/stores/bushman/species-store'


interface SelectOption {
  value: any
  text: string
}

interface SpeciesObject {
  id: any
  name: string
  quantity: number
  area_id?: any
  area_name?: string
  record_id?: any
}

interface FormData {
  id: any
  name: string
  start_date: Date | null
  end_date: Date | null
  description: string
}

interface SpeciesFormData {
  id: SelectOption | null
  quantity: number
  salesQuota: SelectOption | null
  area: SelectOption | null
}

const quotaStore = useQuotaStore()
const huntingAreaStore = useHuntingAreaStore()
const toast = useToast()
const speciesStore = useSpeciesStore()

// View state
const showQuotaList = ref(true)
const showDetailsPage = ref(false)
const showSpeciesForm = ref(false)
const showQuotaForm = ref(false)

// Loading states
const loadingQuotas = ref(false)
const loadingSpecies = ref(false)
const savingQuota = ref(false)
const savingQuotaSpecies = ref(false)
const deletingQuota = ref(false)

// Edit state
const isEditing = ref(false)

// Data
const items = ref<any[]>([])
const quotasOptions = ref<SelectOption[]>([])
const speciesOptions = ref<SelectOption[]>([])
const areasOptions = ref<SelectOption[]>([])
const speciesObjects = ref<SpeciesObject[]>([])
const currentViewQuota = ref<any>(null)
const csvUploaded = ref(false)
const importMode = ref<'csv' | 'manual'>('csv')
const quotaCreatedForSpecies = ref(false)

// CSV import progress state (same UX as ManageSpecies)
const importInProgress = ref(false)
const importTotal = ref(0)
const importProcessed = ref(0)
const importResults = ref<any[]>([])
const showImportResults = ref(false)

const importProgressPercent = computed(() => {
  return importTotal.value > 0 ? Math.round((importProcessed.value / importTotal.value) * 100) : 0
})
const importSuccessCount = computed(() => importResults.value.filter((r: any) => r.ok).length)
const importFailCount = computed(() => importResults.value.filter((r: any) => !r.ok).length)

function closeImportResults() {
  showImportResults.value = false
  importResults.value = []
  importTotal.value = 0
  importProcessed.value = 0
}

// Species rows for MultiRowTableInput
const speciesRows = ref<any[]>([{ _id: 1, species: '', quantity: 1 }])

// Define fields for MultiRowTableInput
const speciesFields = computed(() => [
  {
    key: 'species',
    label: 'Species',
    type: 'select' as const,
    required: true,
    options: speciesOptions.value,
    headerStyle: 'width: 60%;',
    cellStyle: 'width: 60%;'
  },
  {
    key: 'quantity',
    label: 'Quantity',
    type: 'number' as const,
    required: true,
    placeholder: 'Enter quantity',
    headerStyle: 'width: 40%;',
    cellStyle: 'width: 40%;'
  }
])

// CSVInput configuration
const csvColumnFields = [
  { key: 'name', label: 'Species Name' },
  { key: 'quantity', label: 'Quantity' },
]

const allowedSpeciesNames = computed(() => speciesOptions.value.map((opt: any) => String(opt.text)))

const existingCsvModel = computed(() => {
  const idToName = new Map(speciesOptions.value.map((opt: any) => [String(opt.value), String(opt.text)]))
  return speciesRows.value
    .filter((r: any) => r.species)
    .map((r: any) => ({ name: idToName.get(String(r.species)) || '', quantity: r.quantity }))
})

async function handleCsvImport(rows: Array<{ name: string; quantity: any }>) {
  if (!rows || rows.length === 0) {
    toast.init({ message: 'No rows in CSV', color: 'info' })
    return
  }

  // Validate required context - only require area when creating new quota
  if (!showSpeciesForm.value && (!sform.area || !sform.area.value)) {
    toast.init({ message: 'Please select a hunting area before importing CSV', color: 'warning' })
    return
  }

  // For Add Species form, require quota selection
  if (showSpeciesForm.value && !currentViewQuota.value) {
    toast.init({ message: 'No quota selected', color: 'warning' })
    return
  }

  // Initialize import progress state
  importInProgress.value = true
  importTotal.value = rows.length
  importProcessed.value = 0
  importResults.value = []
  showImportResults.value = false

  const nameToOption = new Map(
    speciesOptions.value.map((opt: any) => [String(opt.text).toLowerCase(), opt])
  )

  let added = 0
  let created = 0
  let failed = 0

  // Process rows sequentially: create missing species, then create quota assignments
  for (const row of rows) {
    const name = String(row.name || '').trim()
    if (!name) {
      importProcessed.value += 1
      importResults.value.push({ name: '', ok: false, error: 'Empty name' })
      failed++
      continue
    }

    const qty = Number(row.quantity) || 1
    const key = name.toLowerCase()
    let speciesId = null
    let existing = nameToOption.get(key)

    if (existing) {
      speciesId = existing.value
    } else {
      // Create species via species store (same behavior as ManageSpecies)
      try {
        const r = await speciesStore.createSpecies({ name, swahili_name: '', scientific_name: '', type: 'NORMAL' })
        if (r && (r.status === 201 || r.status === 200)) {
          speciesId = r.data?.id || (r.data?.data && r.data.data.id)
          const createdName = r.data?.name || name
          // Add to local speciesOptions so subsequent rows can find it
          speciesOptions.value.unshift({ value: speciesId, text: createdName })
          nameToOption.set(String(createdName).toLowerCase(), { value: speciesId, text: createdName })
          created++
        } else {
          failed++
          importResults.value.push({ name, ok: false, error: 'Failed to create species' })
          importProcessed.value += 1
          continue
        }
      } catch (err: any) {
        failed++
        const errorMsg = handleErrors(err.response || err)
        importResults.value.push({ name, ok: false, error: Array.isArray(errorMsg) ? errorMsg.join(', ') : String(errorMsg) })
        importProcessed.value += 1
        continue
      }
    }

    // Now create the quota-area-species assignment
    if (speciesId) {
      try {
        const quotaId = showSpeciesForm.value ? currentViewQuota.value.id : (form.id || null)
        
        // If we're in the main quota form (creating new quota), we can't assign species yet
        // So we'll skip direct assignment and just track success
        if (showQuotaForm.value && !form.id) {
          added++
          importResults.value.push({ name, ok: true })
        } else if (quotaId) {
          // We have an existing quota - create assignment
          const payload: any = {
            quota_id: quotaId,
            speciesObjects: [{ species_id: speciesId, quantity: qty }]
          }
          
          // Only include area_id if it's provided (not required when adding to existing quota)
          if (sform.area?.value) {
            payload.area_id = sform.area.value
          }
          
          const assignResp = await quotaStore.createQuotaAreaSpecies(payload)
          if (assignResp && (assignResp.status === 201 || assignResp.status === 200 || assignResp.data?.success)) {
            added++
            importResults.value.push({ name, ok: true })
          } else {
            failed++
            importResults.value.push({ name, ok: false, error: 'Failed to assign species to quota' })
          }
        } else {
          // No quota context - just track as added for later use
          added++
          importResults.value.push({ name, ok: true })
        }
      } catch (err: any) {
        failed++
        const errorMsg = handleErrors(err.response || err)
        importResults.value.push({ name, ok: false, error: Array.isArray(errorMsg) ? errorMsg.join(', ') : String(errorMsg) })
      }
    }

    importProcessed.value += 1
  }

  // Summarize results and show UI
  importInProgress.value = false
  showImportResults.value = true

  if (failed > 0) {
    toast.init({ message: `Import completed: ${added} assigned, ${created} species created, ${failed} failed`, color: 'warning' })
  } else {
    toast.init({ message: `Import completed: ${added} assigned, ${created} species created`, color: 'success' })
  }

  // Reload quota details if in details view
  if (showSpeciesForm.value && currentViewQuota.value) {
    await loadQuotaSpecies(currentViewQuota.value.id)
  }
}

const form = reactive<FormData>({
  id: null,
  name: '',
  start_date: null,
  end_date: null,
  description: '',
})

const sform = reactive<SpeciesFormData>({
  id: null,
  quantity: 1,
  salesQuota: null,
  area: null,
})

const columns = [
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'start_date', label: 'Start Date', sortable: true, visible: true },
  { key: 'end_date', label: 'End Date', sortable: true, visible: true },
  { key: 'species_count', label: 'Species ', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => [
  {
    label: 'Add Quota',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    method: () => showAddQuotaForm(),
  },
])

// Navigation methods
function goBackToList() {
  showQuotaList.value = true
  showDetailsPage.value = false
  showSpeciesForm.value = false
  showQuotaForm.value = false
  currentViewQuota.value = null
  speciesObjects.value = []
  resetQuotaForm()
  getQs()
}

function goBackToDetails() {
  showSpeciesForm.value = false
  showDetailsPage.value = true
  speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
  csvUploaded.value = false
  sform.area = null
  importMode.value = 'csv'
  // Reload species for this quota
  if (currentViewQuota.value) {
    loadQuotaSpecies(currentViewQuota.value.id)
  }
}

function showAddSpeciesForm() {
  showDetailsPage.value = false
  showSpeciesForm.value = true
  speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
  csvUploaded.value = false
  sform.area = null
  importMode.value = 'csv'
}

function showAddQuotaForm() {
  resetQuotaForm()
  isEditing.value = false
  showQuotaList.value = false
  showDetailsPage.value = false
  showSpeciesForm.value = false
  showQuotaForm.value = true
}

async function viewQuotaDetails(row: any) {
  currentViewQuota.value = row
  showQuotaList.value = false
  showDetailsPage.value = true
  showSpeciesForm.value = false

  await getSpeciesItems()
  await getAreas()
  await loadQuotaSpecies(row.id)
}

async function loadQuotaSpecies(quotaId: any) {
  loadingSpecies.value = true
  speciesObjects.value = []

  try {
    // Strict: call only the dedicated store action which uses sales/quota-with-assignments
    const resp = await quotaStore.getQuotaWithAssignments(quotaId)
    if (!resp || !resp.data) {
      toast.init({ message: 'No data returned from quota-with-assignments', color: 'warning' })
      return
    }
    const data = resp.data
    if (data.quota) currentViewQuota.value = data.quota
    const assignments = Array.isArray(data.assignments) ? data.assignments : (data.data || [])
    speciesObjects.value = Array.isArray(assignments)
      ? assignments.map((it: any) => ({
          id: it.species_id ?? it.species?.id ?? it.id,
          name: it.species_name ?? it.species?.name ?? it.name ?? getSpeciesNameById(it.species_id ?? it.species?.id ?? it.id),
          quantity: it.quantity ?? it.qty ?? it.count ?? 0,
          area_id: it.area_id ?? it.area?.id,
          area_name: it.area_name ?? it.area?.name ?? getAreaNameById(it.area_id ?? it.area?.id),
          record_id: it.id,
        }))
      : []
  } catch (err) {
    console.error('Failed to load quota species:', err)
    toast.init({ message: 'Failed to load quota species', color: 'danger' })
  } finally {
    loadingSpecies.value = false
  }
}

function getSpeciesNameById(speciesId: any): string {
  const found = speciesOptions.value.find((opt: any) => opt.value === speciesId)
  return found ? found.text : 'Unknown'
}

function getAreaNameById(areaId: any): string {
  const found = areasOptions.value.find((opt: any) => opt.value === areaId)
  // Return location name if available, otherwise the full text
  return found ? (found.location_name || found.text) : 'Unknown'
}

function editQuota(row: any) {
  isEditing.value = true
  form.id = row.id
  form.name = row.name
  form.start_date = row.start_date || null
  form.end_date = row.end_date || null
  form.description = row.description || ''
  showQuotaList.value = false
  showDetailsPage.value = false
  showSpeciesForm.value = false
  showQuotaForm.value = true
}

function confirmDeleteQuota(row: any) {
  Swal.fire({
    title: 'Are you sure?',
    html: `Are you sure you want to delete <strong>${row?.name || 'this quota'}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'No, cancel!',
    reverseButtons: true,
    customClass: {
      confirmButton: 'btn btn-primary me-2',
      cancelButton: 'btn btn-secondary'
    },
    buttonsStyling: false,
    padding: '2em'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await deleteQuotaItem(row)
    }
  })
}

async function deleteQuotaItem(row: any) {
  deletingQuota.value = true
  try {
    const response = await quotaStore.deleteQuota(row.id)
    if (response.success) {
      toast.init({ message: response.message || 'Quota deleted successfully', color: 'success' })
      await getQs() // Re-fetch the quota list
    } else {
      toast.init({ message: response.message || 'Delete operation failed', color: 'warning' })
    }
  } catch (error: any) {
    toast.init({ message: 'An unexpected error occurred.', color: 'danger' })
  } finally {
    deletingQuota.value = false
  }
}

async function deleteSpeciesFromQuota(index: number, recordId?: any) {
  if (recordId) {
    try {
      const resp = await quotaStore.deleteQuotaAreaSpecies(recordId)
      if (resp && (resp.status === 200 || resp.status === 204)) {
        toast.init({ message: 'Species removed from quota', color: 'success' })
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete species'
      toast.init({ message: errorMsg, color: 'danger' })
      return
    }
  }
  speciesObjects.value.splice(index, 1)
}

function resetQuotaForm() {
  isEditing.value = false
  form.id = null
  form.name = ''
  form.start_date = null
  form.end_date = null
  form.description = ''
  speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
  csvUploaded.value = false
  sform.area = null
  importMode.value = 'csv'
  quotaCreatedForSpecies.value = false
}

async function onQuotaSubmit() {
  savingQuota.value = true
  try {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.init({ message: 'Please provide name, start and end dates for the quota.', color: 'warning' })
      savingQuota.value = false
      return
    }

    if (isEditing.value && form.id) {
      const resp = await quotaStore.updateQuota({ id: form.id, name: form.name, start_date: form.start_date, end_date: form.end_date, description: form.description })
      if (resp && (resp.status === 200 || resp.status === 204 || resp.success)) {
        toast.init({ message: resp.data?.message || 'Quota updated', color: 'success' })
        goBackToList()
      }
    } else {
      const resp = await quotaStore.createQuota({ name: form.name, start_date: form.start_date, end_date: form.end_date, description: form.description })
      if (resp && (resp.status === 201 || resp.success)) {
        // Get created quota id from response
        const createdId = resp.data?.data?.id || resp.data?.id || resp.data?.data?.quota_id || resp.data?.data?.quota?.id || resp.data?.id
        
        if (createdId) {
          form.id = createdId
          currentViewQuota.value = { id: createdId, name: form.name, start_date: form.start_date, end_date: form.end_date }
          quotaCreatedForSpecies.value = true
          toast.init({ message: resp.data?.message || resp.message || 'Quota created. Now add species.', color: 'success' })
        }
        return
      }
    }
  } catch (err: any) {
    const errors = handleErrors(err.response || err)
    toast.init({ message: errors.length > 0 ? errors.join('\n') : 'Failed to save quota', color: 'danger' })
  } finally {
    savingQuota.value = false
  }
}

async function submitSpeciesAfterQuotaCreation() {
  savingQuotaSpecies.value = true
  try {
    if (!sform.area || !sform.area.value) {
      toast.init({ message: 'Please select a hunting area', color: 'warning' })
      savingQuotaSpecies.value = false
      return
    }

    // Filter out empty rows
    const validSpecies = speciesRows.value.filter(row => row.species && row.quantity > 0)

    if (validSpecies.length === 0) {
      toast.init({ message: 'Please add at least one species item.', color: 'warning' })
      savingQuotaSpecies.value = false
      return
    }

    // Transform to API format
    const speciesObjectList = validSpecies.map(row => ({
      species_id: row.species,
      quantity: Number(row.quantity),
    }))

    const rdata = {
      area_id: sform.area?.value,
      quota_id: form.id,
      speciesObjects: speciesObjectList,
    }

    const response = await quotaStore.createQuotaAreaSpecies(rdata)
    if (response.status === 201 || response.data?.success) {
      toast.init({ message: response.data?.message || 'Species added to quota', color: 'success' })
      goBackToList()
    }
  } catch (error: any) {
    const errors = handleErrors(error.response || error)
    toast.init({ message: errors.length > 0 ? errors.join('\n') : 'Failed to add species', color: 'danger' })
  } finally {
    savingQuotaSpecies.value = false
  }
}

async function onSpeciesSubmit() {
  savingQuotaSpecies.value = true

  // Filter out empty rows
  const validSpecies = speciesRows.value.filter(row => row.species && row.quantity > 0)

  if (validSpecies.length === 0) {
    toast.init({ message: 'Please add at least one species item.', color: 'warning' })
    savingQuotaSpecies.value = false
    return
  }

  if (!currentViewQuota.value) {
    toast.init({ message: 'No quota selected.', color: 'warning' })
    savingQuotaSpecies.value = false
    return
  }

  // Transform to API format
  const speciesObjectList = validSpecies.map(row => ({
    id: row.species,
    species_id: row.species,
    quantity: Number(row.quantity),
  }))

  const rdata: any = {
    quota_id: currentViewQuota.value.id,
    speciesObjects: speciesObjectList,
  }

  // Only include area_id if it's provided
  if (sform.area?.value) {
    rdata.area_id = sform.area.value
  }

  try {
    const response = await quotaStore.createQuotaAreaSpecies(rdata)
    if (response.status === 201) {
      toast.init({ message: response.data.message || 'Species added to quota', color: 'success' })
      goBackToDetails()
    }
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.length > 0 ? errors.join('\n') : 'Failed to add species', color: 'danger' })
  } finally {
    savingQuotaSpecies.value = false
  }
}

function exportQuotaCsv() {
  if (!currentViewQuota.value) return
  if (speciesObjects.value.length === 0) {
    toast.init({ message: 'No species to export', color: 'warning' })
    return
  }

  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    return '"' + str.replace(/"/g, '""') + '"'
  }

  const rows = speciesObjects.value.map((s: any) => {
    return `${escapeCsv(s.name)},${escapeCsv(s.quantity)},${escapeCsv(s.area_name || '')}`
  })

  const header = 'Species Name,Quantity,Area'
  const csvContent = [header].concat(rows).join('\n')

  const filenameBase = (currentViewQuota.value.name || 'quota').toString().replace(/\s+/g, '_')
  const filename = `${filenameBase}_species.csv`

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function downloadSpeciesTemplate() {
  if (!speciesOptions.value || speciesOptions.value.length === 0) {
    toast.init({ message: 'No species available. Please wait for species to load.', color: 'warning' })
    return
  }

  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    return '"' + str.replace(/"/g, '""') + '"'
  }

  const rows = speciesOptions.value.map((opt: any) => {
    const id = opt.value || opt.id || ''
    const name = opt.text || opt.name || ''
    const quantity = '' // Empty quantity column for template
    return `${escapeCsv(id)},${escapeCsv(name)},${escapeCsv(quantity)}`
  })

  const header = 'Species ID,Species Name,Quantity'
  const csvContent = [header].concat(rows).join('\n')

  const filename = 'species_template.csv'

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  
  toast.init({ message: 'Species template downloaded successfully', color: 'success' })
}

function generateQuotaYear(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''
  const startYear = new Date(startDate).getFullYear()
  const endYear = new Date(endDate).getFullYear()
  return `${startYear}-${endYear}`
}

async function getQs(id: number | null = null) {
  loadingQuotas.value = true
  try {
    const response = await quotaStore.getQuotas(id)
    if (response && response.data) {
      const apiResponse = response.data
      if (apiResponse.success === true && Array.isArray(apiResponse.data)) {
        const quotaItems = apiResponse.data
        // Do not call the legacy vset endpoint here. Populate quotas without species counts.
        items.value = quotaItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          start_date: item.start_date,
          end_date: item.end_date,
          species_count: item.species_count ?? 0,
        }))
        quotasOptions.value = quotaItems.map((item: any) => {
          const result = generateQuotaYear(item.start_date, item.end_date)
          return {
            value: item.id,
            text: `${result} - ${item.name}`,
          }
        })
      } else {
        items.value = []
        quotasOptions.value = []
      }
    } else {
      items.value = []
      quotasOptions.value = []
    }
  } catch (error: any) {
    toast.init({ message: 'Failed to load quotas. Please try again.', color: 'danger' })
  } finally {
    loadingQuotas.value = false
  }
}

async function getSpeciesItems() {
  try {
    const response = await quotaStore.getSpeciesList()
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || response.data)
    if (Array.isArray(list)) {
      speciesOptions.value = list.map((item: any) => ({ value: item.id, text: item.name }))
    } else {
      speciesOptions.value = []
    }
  } catch (error: any) {
    console.error('Failed to load species:', error)
  }
}

async function getAreas() {
  try {
    const response = await huntingAreaStore.getAllHuntingAreas()
    // Response data is an array of hunting areas with nested location
    const huntingAreas = Array.isArray(response.data) 
      ? response.data 
      : Array.isArray(response.data?.data) 
        ? response.data.data 
        : []
    
    if (Array.isArray(huntingAreas)) {
      areasOptions.value = huntingAreas.map((area: any) => {
        // Extract location info from nested location object
        const location = area.location || {}
        const locationName = location.name || 'N/A'
        const locationCode = location.code || 'N/A'
        // Display format: "Location Name (Code)"
        return { 
          value: area.id, 
          text: `${locationName} (${locationCode})`,
          location_name: locationName,
          location_code: locationCode,
        }
      })
    } else {
      areasOptions.value = []
    }
  } catch (error: any) {
    console.error('Failed to load areas:', error)
    toast.init({
      message: 'Failed to load hunting areas',
      color: 'danger',
    })
  }
}

onMounted(() => {
  getQs()
  getSpeciesItems()
  getAreas()
})
</script>

<style scoped>
.quota-page {
  padding: 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.breadcrumb .breadcrumb-item {
  text-transform: uppercase !important;
  display: inline-flex;
  align-items: center;
}

.breadcrumb .breadcrumb-item::before {
  content: ' / ' !important;
  color: #9ca3af !important;
  padding: 0 0.5rem;
}

.breadcrumb .breadcrumb-item:first-child::before {
  display: none !important;
}

.breadcrumb .breadcrumb-item a {
  text-transform: uppercase !important;
  color: #374151 !important;
  font-weight: 600;
  text-decoration: none !important;
}

.breadcrumb .breadcrumb-item a:hover {
  color: #0d6efd;
}

.breadcrumb .breadcrumb-item.active {
  color: #212529 !important;
  text-transform: uppercase !important;
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

.custom-table .table {
  font-size: 0.875rem;
  background-color: #ffffff;
  border-radius: 0.375rem;
  overflow: hidden;
}

.custom-table .table thead th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #dee2e6;
  background-color: #f8f9fa;
  padding: 0.75rem;
}

.custom-table .table tbody tr {
  transition: background-color 0.2s ease;
}

.custom-table .table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.custom-table .table tbody tr td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

/* Match ManageArea / ManageSpecies spacing */
.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}
</style>
