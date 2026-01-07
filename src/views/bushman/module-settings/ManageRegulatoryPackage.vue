<template>
  <div class="regulatory-package-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Hunting Licences</li>
        </ul>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="showpackForm">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable :columns="columns" :data="items" :loading="loading" :disable-search="false"
                :disable-pagination="false" :action-buttons="pageActions" :show-date-filters="false">
                <template #id="{ row }">
                  {{ (row as any).id }}
                </template>
                <template #name="{ row }">
                  {{ (row as any).name }}
                </template>
                <template #area_name="{ row }">
                  {{ (row as any).area_name || 'N/A' }}
                </template>
                <template #regulatory_package_name="{ row }">
                  {{ (row as any).regulatory_package_name || (row as any).name }}
                </template>
                <template #duration="{ row }">
                  {{ (row as any).duration }} Days
                </template>
                <template #actions="{ row }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="View" @click="showDetails(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Details View -->
    <div v-else-if="showDetailsPage && selectItem">
      <div class="regulatory-package-details">
        <div class="card">
          <div class="card-header d-flex align-items-center bg-white">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <i class="fa fa-certificate fa-3x text-primary"></i>
              </div>
              <div>
                <h4 class="mb-0">{{ selectItem.name || 'N/A' }}</h4>
                <small class="text-muted">Regulatory Package</small>
              </div>
            </div>
            <div class="ms-auto d-flex gap-2">
              <button v-if="!showAddSpeciesForm" class="btn btn-success btn-sm" @click="showAddSpeciesForm = true">
                <i class="fa fa-plus me-1"></i> Add Species
              </button>
              <button class="btn btn-outline-primary btn-sm" @click="exportPackageCsv">
                <i class="fa fa-file-csv me-1"></i> Export CSV
              </button>
              <button class="btn btn-secondary btn-sm" @click="goBack">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="card border-primary">
                  <div class="card-body">
                    <h6 class="card-title text-primary"><i class="fa fa-info-circle me-2"></i>Package Information</h6>
                    <p class="mb-1"><strong>Name:</strong> {{ selectItem.name || 'N/A' }}</p>
                    <p class="mb-0"><strong>Duration:</strong> {{ selectItem.duration || 'N/A' }} Days</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header bg-white d-flex align-items-center">
                <h6 class="mb-0">
                  <i class="fa fa-paw me-2 text-primary"></i>
                  Species ({{ getSpeciesCount() }})
                </h6>
                <span class="text-muted small ms-3">{{ huntingAreasList.length }} Hunting Area(s)</span>
                <div class="ms-auto d-flex align-items-center gap-2">
                  <span class="small text-muted">Edit Counts</span>
                  <div class="form-check form-switch mb-0">
                    <input
                      v-model="editSpeciesCounts"
                      class="form-check-input"
                      type="checkbox"
                      @change="toggleSpeciesCountEdit"
                    />
                  </div>
                  <button
                    v-if="editSpeciesCounts"
                    class="btn btn-sm btn-primary"
                    :disabled="savingSpeciesCounts"
                    @click="saveSpeciesCountChanges"
                  >
                    <span v-if="savingSpeciesCounts" class="spinner-border spinner-border-sm me-1"></span>
                    Save
                  </button>
                  <button
                    v-if="editSpeciesCounts"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="savingSpeciesCounts"
                    @click="cancelSpeciesCountEdit"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div class="card-body">

                <!-- Add Species Form Section -->
                <div v-if="showAddSpeciesForm" class="mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 fw-bold">Add Species</h6>
                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeAddSpeciesForm">
                      <i class="fa fa-times me-1"></i> Cancel
                    </button>
                  </div>

                  <!-- Import controls moved to details view -->
                  <div v-if="!importInProgress && !showImportResults" class="mb-4 p-3">
                    <div class="d-flex align-items-center gap-3 p-3 bg-light rounded">
                      <span class="fw-semibold text-muted" style="font-size: 0.9rem;">Import Method:</span>
                      <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" id="rpCsvModeDetails" value="csv" v-model="importMode" autocomplete="off" />
                        <label class="btn btn-outline-primary" for="rpCsvModeDetails">
                          <i class="fa fa-file-csv me-1"></i> CSV Import
                        </label>
                        <input type="radio" class="btn-check" id="rpManualModeDetails" value="manual" v-model="importMode" autocomplete="off" />
                        <label class="btn btn-outline-primary" for="rpManualModeDetails">
                          <i class="fa fa-keyboard me-1"></i> Manual Entry
                        </label>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-success ms-auto" @click="downloadSpeciesTemplate">
                        <i class="fa fa-download me-1"></i> Download Template
                      </button>
                    </div>
                  </div>

                  <!-- Manual entry UI for details -->
                  <div v-if="importMode === 'manual' && !importInProgress && !showImportResults" class="mb-4 p-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <span class="fw-bold">Species List</span>
                      <button type="button" class="btn btn-sm btn-primary" :disabled="!selectItem || speciesRows.length === 0" @click="submitSpeciesAfterCreation()">
                        <i class="fa fa-save me-1"></i>Save Manual Species
                      </button>
                    </div>
                    <MultiRowTableInput v-model="speciesRows" :fields="speciesFields" add-button-label="Add Species" />
                  </div>

                  <!-- CSV input for details -->
                  <div v-if="importMode === 'csv' && !importInProgress && !showImportResults" class="mb-4 p-3">
                    <h6 class="fw-bold mb-3 d-flex align-items-center">
                      <div class="d-flex align-items-center gap-2">
                        <i class="fa fa-file-csv text-success"></i>
                        <span>Bulk Import from CSV</span>
                      </div>
                    </h6>
                    <RegulatoryPackageCSVInput
                      :allowed-species-names="allowedSpeciesNames"
                      @import="handleCsvImport"
                    />
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
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" :style="{ width: importProgressPercent + '%' }"></div>
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

                <div v-if="hasSpecies()" class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Species Name</th>
                        <th v-for="area in huntingAreasList" :key="area.id" class="text-center">
                          {{ area.name }}
                        </th>
                        <th v-if="huntingAreasList.length === 0">Hunting Areas</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(species, index) in displayedSpeciesList" :key="index">
                        <td>{{ getSpeciesName(species) }}</td>
                        <td v-for="area in huntingAreasList" :key="area.id" class="text-center">
                          <div class="form-check form-switch mb-0 d-flex justify-content-center">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              :checked="isSpeciesInArea(species, area.id)"
                              :disabled="isToggleDisabled(species, area.id)"
                              @change="toggleSpeciesInArea(species, area.id, $event)"
                            />
                          </div>
                        </td>
                        <td v-if="huntingAreasList.length === 0" class="text-center text-muted">
                          <small>No areas loaded</small>
                        </td>
                        <td>
                          <div v-if="editSpeciesCounts" class="d-flex align-items-center gap-2">
                            <button
                              class="btn btn-sm btn-outline-secondary"
                              type="button"
                              :disabled="Number(species.quantity || 1) <= 1"
                              @click="decrementSpeciesCount(index)"
                            >
                              -
                            </button>
                            <input
                              v-model.number="species.quantity"
                              type="number"
                              min="1"
                              class="form-control form-control-sm text-center"
                              style="width: 80px;"
                            />
                            <button
                              class="btn btn-sm btn-outline-secondary"
                              type="button"
                              @click="incrementSpeciesCount(index)"
                            >
                              +
                            </button>
                          </div>
                          <span v-else>{{ species.quantity || species.qty || 'N/A' }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-center py-3 text-muted">
                  <i class="fa fa-info-circle me-2"></i>No species added to this package.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form View -->
    <div v-else>
      <div class="p-6">
        <!-- Form for Adding Species -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button class="btn btn-secondary" @click="showNewPackageForm">
              <i class="fa fa-arrow-left me-2"></i>Go Back
            </button>
          </div>
        </div>

        <div class="p-2">
          <form @submit.prevent="createRegulatoryPackageFirst()">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Name</label>
                <input v-model="packageForm.name" :disabled="packageCreatedForSpecies" type="text" class="form-control" placeholder="Enter package Name"
                  required />
              </div>

              <div class="col-md-4">
                <label class="form-label">Duration in days</label>
                <input v-model="packageForm.duration" :disabled="packageCreatedForSpecies" type="number" class="form-control"
                  placeholder="Enter package Duration" required />
              </div>
            </div>
            <div class="mb-4" v-if="!packageCreatedForSpecies">
              <button class="btn btn-success" :disabled="!packageForm.name || !packageForm.duration" type="submit">
                <i class="fa fa-check me-2"></i>Create Package
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '../../../stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'
import RegulatoryPackageCSVInput from './RegulatoryPackageCSVInput.vue'
import Swal from 'sweetalert2'
import { useSpeciesStore } from '@/stores/bushman/species-store'
import { useHuntingAreaStore } from '@/stores/bushman/hunting-story'
import axios from 'axios'

// Stores
const quotaStore = useQuotaStore()
const regulatoryPackageStore = useRegulatoryPackageStore()
const { init: toastInit } = useToast()
const speciesStore = useSpeciesStore()
const huntingAreaStore = useHuntingAreaStore()

// Form validation
const { isValid: isValidpackageForm, validate: validatepackageForm, resetValidation: resetValidationpackageForm, reset: resetpackageForm } = useForm()

const packageFormRef = ref(null) as any

// Reactive state
const items = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showpackForm = ref(true)
const showDetailsPage = ref(false)
const selectItem = ref<any>(null)
const showDeleteModal = ref(false)
const itemToDelete = ref<any>(null)
const deleting = ref(false)
const speciesOptions = ref<any[]>([])
const quotasOptions = ref<any[]>([])
const csvUploaded = ref(false)
// CSV import progress state
const importMode = ref<'csv' | 'manual'>('csv')
const importInProgress = ref(false)
const importTotal = ref(0)
const importProcessed = ref(0)
const importResults = ref<any[]>([])
const showImportResults = ref(false)
const packageCreatedForSpecies = ref(false)
const createdPackageId = ref<number | null>(null)
const createdPackageName = ref<string | null>(null)
const showAddSpeciesForm = ref(false)
const editSpeciesCounts = ref(false)
const savingSpeciesCounts = ref(false)
const editableSpeciesList = ref<any[]>([])
const huntingAreaSpeciesMap = ref<Record<number, Array<{ species_id: number; species_name: string }>>>({})
const allHuntingAreaSpeciesSet = ref<Set<number>>(new Set())
const savingAvailability = ref<Record<string, boolean>>({})
const huntingAreasMap = ref<Record<number, string>>({})

// Computed list of hunting areas for columns
const huntingAreasList = computed(() => {
  return Object.entries(huntingAreasMap.value).map(([id, name]) => ({
    id: Number(id),
    name: name
  }))
})

const importProgressPercent = computed(() => importTotal.value > 0 ? Math.round((importProcessed.value / importTotal.value) * 100) : 0)
const importSuccessCount = computed(() => importResults.value.filter((r: any) => r.ok).length)
const importFailCount = computed(() => importResults.value.filter((r: any) => !r.ok).length)
const displayedSpeciesList = computed(() => {
  if (editSpeciesCounts.value) return editableSpeciesList.value
  return getDisplaySpeciesList()
})

function closeImportResults() {
  const hadFailures = importResults.value.some((r: any) => !r.ok)
  showImportResults.value = false
  importResults.value = []
  importTotal.value = 0
  importProcessed.value = 0
  // Close the form if import was completely successful
  if (!hadFailures && showAddSpeciesForm.value) {
    closeAddSpeciesForm()
  }
}

function closeAddSpeciesForm() {
  showAddSpeciesForm.value = false
  speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
  csvUploaded.value = false
  importMode.value = 'csv'
  closeImportResults()
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

// CSV Input handlers
const allowedSpeciesNames = computed(() => speciesOptions.value.map((opt: any) => String(opt.text)))

async function handleCsvImport(rows: Array<{ name: string; quantity: any }>) {
  if (!rows || rows.length === 0) {
    toastInit({ message: 'No rows in CSV', color: 'info' })
    return
  }

  const packageId = createdPackageId.value || selectItem.value?.id
  if (!packageId) {
    toastInit({ message: 'Open the package details first before importing species.', color: 'warning' })
    return
  }

  importInProgress.value = true
  importTotal.value = rows.length
  importProcessed.value = 0
  importResults.value = []
  showImportResults.value = false

  const nameToOption = new Map(
    speciesOptions.value.map((opt: any) => [String(opt.text).toLowerCase(), opt])
  )

  const newSpeciesRows: any[] = []
  const toAssignBulk: Array<{ species_id: number; quantity: number }> = []
  let newId = 0
  let added = 0
  let created = 0
  let failed = 0

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
    let opt = nameToOption.get(key)

    if (!opt) {
      try {
        const r = await speciesStore.createSpecies({ name, swahili_name: '', scientific_name: '', type: 'NORMAL' })
        if (r && (r.status === 201 || r.status === 200)) {
          const id = r.data?.id || r.data?.data?.id
          const createdName = r.data?.name || name
          opt = { value: id, text: createdName }
          speciesOptions.value.unshift(opt as any)
          nameToOption.set(String(createdName).toLowerCase(), opt)
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

    newId++
    newSpeciesRows.push({ _id: newId, species: opt.value, quantity: qty })
    toAssignBulk.push({ species_id: Number(opt?.value), quantity: qty })
    added++
    importResults.value.push({ name, ok: true })
    importProcessed.value += 1
  }

  if (added + created > 0) {
    speciesRows.value = newSpeciesRows
    csvUploaded.value = true

    // Immediately persist to backend after successful import
    try {
      let resp: any
      const maybeFn: any = (regulatoryPackageStore as any).addSpeciesToRegulatoryPackage
      if (typeof maybeFn === 'function') {
        resp = await maybeFn(packageId as number, toAssignBulk)
      } else {
        resp = await postSpeciesToPackage(packageId as number, toAssignBulk)
      }
      if (!(resp && (resp.status === 201 || resp.status === 200 || resp.data?.success))) {
        toastInit({ message: 'Failed to save imported species to package', color: 'danger' })
        importInProgress.value = false
        showImportResults.value = true
      } else {
        // Clear CSV data and return to packages list
        importInProgress.value = false
        showImportResults.value = false
        importResults.value = []
        importTotal.value = 0
        importProcessed.value = 0
        speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
        csvUploaded.value = false
        showAddSpeciesForm.value = false
        createdPackageId.value = null
        createdPackageName.value = ''
        toastInit({ message: `Import completed: ${added} matched, ${created} created. Returning to packages list.`, color: 'success' })
        goBack()
        return // Exit early after successful import and navigation
      }
    } catch (error: any) {
      const msg = handleErrors(error.response || error)
      toastInit({ message: Array.isArray(msg) ? msg.join(', ') : String(msg || 'Failed to save species'), color: 'danger' })
      importInProgress.value = false
      showImportResults.value = true
    }
  }

  // Show import results if no species were added or if there were failures
  importInProgress.value = false
  if (added + created === 0 || failed > 0) {
    showImportResults.value = true
    if (failed) {
      toastInit({ message: `Import completed: ${added} matched, ${created} created, ${failed} failed`, color: 'warning' })
    }
  }
}

const packageForm = reactive({
  duration: null as any,
  name: null as any,
})

const columns = [
  { key: 'regulatory_package_name', label: 'Licence', sortable: true, visible: true },
  { key: 'duration', label: 'Duration', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
]

const pageActions = computed(() => [
  {
    label: 'Add New Package',
    class: 'btn-primary',
    icon: 'fa fa-plus me-2',
    method: () => {
      showNewPackageForm()
    },
  },
])

// Methods
const showNewPackageForm = () => {
  showpackForm.value = !showpackForm.value
  showDetailsPage.value = false
  selectItem.value = null
  if (showpackForm.value) {
    getPackages()
  } else {
    // Reset form when showing new package form
    packageForm.name = null
    packageForm.duration = null
    speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
    csvUploaded.value = false
  }
}

const showDetails = async (row: any) => {
  try {
    loading.value = true
    await loadHuntingAreas()
    const response = await regulatoryPackageStore.getRegulatoryPackageById(row.id)
    if (response.status === 200) {
      const apiData = response.data
      const packageData = apiData.data || apiData
      const speciesData = apiData.species || []

      selectItem.value = {
        ...packageData,
        species: speciesData,
      }

      showDetailsPage.value = true
      showpackForm.value = false
      showAddSpeciesForm.value = false
    }
  } catch (error) {
    console.error('Error fetching package details:', error)
    toastInit({ message: 'Failed to load package details', color: 'danger' })
  } finally {
    loading.value = false
    await loadHuntingAreaSpecies()
  }
}

const goBack = () => {
  showDetailsPage.value = false
  selectItem.value = null
  showpackForm.value = true
  showAddSpeciesForm.value = false
  speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
  csvUploaded.value = false
  importResults.value = []
  showImportResults.value = false
  createdPackageId.value = null
  createdPackageName.value = ''
  getPackages()
}

const getSpeciesList = () => {
  if (!selectItem.value) return []
  const speciesData = selectItem.value.species ||
    selectItem.value.species_list ||
    selectItem.value.regulatory_package_species ||
    selectItem.value.species_object_list ||
    selectItem.value.regulatoryPackageSpecies ||
    []
  return speciesData
}

const getDisplaySpeciesList = () => {
  const areaId = getPackageAreaId()
  if (!areaId) return getSpeciesList()
  const areaSpecies = huntingAreaSpeciesMap.value[areaId] || []
  if (areaSpecies.length === 0) return getSpeciesList()

  const packageSpecies = getSpeciesList()
  const qtyMap = new Map<number, number>()
  packageSpecies.forEach((sp: any) => {
    const id = getSpeciesId(sp)
    if (!id) return
    const qty = Number(sp.quantity ?? sp.qty ?? 1)
    qtyMap.set(Number(id), qty)
  })

  return areaSpecies.map((sp) => ({
    specie_id: sp.species_id,
    species_id: sp.species_id,
    species_name: sp.species_name,
    quantity: qtyMap.get(sp.species_id) ?? 1,
  }))
}

const getPackageAreaId = () => {
  if (!selectItem.value) return null
  return selectItem.value.hunting_area_id ||
    selectItem.value.hunting_area?.id ||
    selectItem.value.area_id ||
    selectItem.value.area?.id ||
    null
}

const getPackageAreaName = () => {
  // Return generic label since we're comparing against all hunting area species
  return 'In Hunting Areas'
}

const hasSpecies = () => {
  const species = getSpeciesList()
  return species && species.length > 0
}

const getSpeciesCount = () => {
  return getSpeciesList().length
}

const getSpeciesName = (species: any) => {
  if (species.species?.name) return species.species.name
  if (species.name) return species.name
  if (species.species_name) return species.species_name
  if (typeof species === 'string') return species
  return 'N/A'
}

const getSpeciesId = (species: any) => {
  if (species.species_id) return species.species_id
  if (species.species?.id) return species.species.id
  if (species.id) return species.id
  if (species.speciesId) return species.speciesId
  return null
}

const loadHuntingAreaSpecies = async () => {
  try {
    const response = await huntingAreaStore.listHuntingAreaSpecies()
    
    // Handle new payload structure: { success: true, data: [{ hunting_area_id, area_name, species: [...] }] }
    let data: any[] = []
    if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data
    } else if (Array.isArray(response.data)) {
      data = response.data
    }
    
    const map: Record<number, Array<{ species_id: number; species_name: string }>> = {}
    data.forEach((area: any) => {
      const areaId = Number(area.hunting_area_id || area.area_id)
      if (!areaId) return
      const speciesList = (area.species || [])
        .map((s: any) => ({
          species_id: Number(s.specie_id || s.species_id || s.id),
          species_name: s.specie_name || s.species_name || s.name || '',
        }))
        .filter((s: any) => s.species_id)
      map[areaId] = speciesList
    })
    huntingAreaSpeciesMap.value = map
    
    // Build flat set of all species IDs across all areas
    const allSpeciesIds = new Set<number>()
    Object.values(map).forEach(list => {
      list.forEach(s => allSpeciesIds.add(s.species_id))
    })
    allHuntingAreaSpeciesSet.value = allSpeciesIds
  } catch (error) {
    console.error('Failed to load hunting area species', error)
  }
}

const loadHuntingAreas = async () => {
  try {
    const response = await huntingAreaStore.getAllHuntingAreas()
    const data = response.data?.data || response.data || []
    const map: Record<number, string> = {}
    data.forEach((area: any) => {
      const id = Number(area.id)
      if (!id) return
      map[id] = area.name || area.description || area.location?.name || `Area ${id}`
    })
    huntingAreasMap.value = map
  } catch (error) {
    console.error('Failed to load hunting areas', error)
  }
}

const isSpeciesAvailableInArea = (species: any) => {
  const speciesId = getSpeciesId(species)
  if (!speciesId) return false
  // Check if species exists in ANY hunting area
  return allHuntingAreaSpeciesSet.value.has(Number(speciesId))
}

// Check if a specific species is in a specific hunting area
const isSpeciesInArea = (species: any, areaId: number) => {
  const speciesId = getSpeciesId(species)
  if (!speciesId) return false
  const list = huntingAreaSpeciesMap.value[areaId] || []
  return list.some((s) => Number(s.species_id) === Number(speciesId))
}

// Check if toggle is disabled for a specific species/area combo
const isToggleDisabled = (species: any, areaId: number) => {
  const speciesId = getSpeciesId(species)
  const key = `${areaId}-${speciesId}`
  return savingAvailability.value[key] || false
}

// Toggle a species for a specific hunting area
const toggleSpeciesInArea = async (species: any, areaId: number, event: Event) => {
  const speciesId = getSpeciesId(species)
  if (!speciesId || !areaId) return
  
  const target = event.target as HTMLInputElement
  const shouldEnable = !!target?.checked
  const key = `${areaId}-${speciesId}`
  
  savingAvailability.value = { ...savingAvailability.value, [key]: true }
  
  try {
    if (shouldEnable) {
      // Add species to this hunting area
      await huntingAreaStore.addHuntingAreaSpecies({
        hunting_area_id: areaId,
        specie_id: speciesId,
      })
    } else {
      // Remove species from this hunting area
      await huntingAreaStore.deleteHuntingAreaSpecies(areaId, undefined, speciesId)
    }
    
    // Update local state
    const map = { ...huntingAreaSpeciesMap.value }
    const current = map[areaId] ? [...map[areaId]] : []
    
    if (shouldEnable) {
      if (!current.some((s) => Number(s.species_id) === Number(speciesId))) {
        current.push({
          species_id: Number(speciesId),
          species_name: getSpeciesName(species),
        })
      }
    } else {
      const idx = current.findIndex((s) => Number(s.species_id) === Number(speciesId))
      if (idx !== -1) current.splice(idx, 1)
    }
    
    map[areaId] = current
    huntingAreaSpeciesMap.value = map
    
    // Update flat set
    if (shouldEnable) {
      allHuntingAreaSpeciesSet.value.add(Number(speciesId))
    } else {
      // Only remove from set if no other area has this species
      const stillExists = Object.values(map).some(list => 
        list.some(s => Number(s.species_id) === Number(speciesId))
      )
      if (!stillExists) {
        allHuntingAreaSpeciesSet.value.delete(Number(speciesId))
      }
    }
    allHuntingAreaSpeciesSet.value = new Set(allHuntingAreaSpeciesSet.value)
    
    toastInit({ 
      message: shouldEnable 
        ? `Species added to ${huntingAreasMap.value[areaId] || 'area'}` 
        : `Species removed from ${huntingAreasMap.value[areaId] || 'area'}`, 
      color: 'success' 
    })
  } catch (error) {
    const msg = handleErrors(error)
    toastInit({ message: Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to update'), color: 'danger' })
    target.checked = !shouldEnable
  } finally {
    savingAvailability.value = { ...savingAvailability.value, [key]: false }
  }
}

const toggleSpeciesAvailability = async (species: any, event: Event) => {
  // Legacy function - kept for compatibility
  const speciesId = getSpeciesId(species)
  if (!speciesId) return
  const target = event.target as HTMLInputElement
  const shouldEnable = !!target?.checked
  
  // Find which area(s) have this species, or use first available area for adding
  const areaIds = Object.keys(huntingAreaSpeciesMap.value).map(Number)
  let targetAreaId: number | null = null
  
  // For removing: find an area that has this species
  // For adding: use the first available area
  if (!shouldEnable) {
    for (const aId of areaIds) {
      const list = huntingAreaSpeciesMap.value[aId] || []
      if (list.some((s) => Number(s.species_id) === Number(speciesId))) {
        targetAreaId = aId
        break
      }
    }
  } else {
    targetAreaId = areaIds[0] || null
  }
  
  if (!targetAreaId) {
    toastInit({ message: 'No hunting area available', color: 'warning' })
    target.checked = !shouldEnable
    return
  }
  
  await toggleSpeciesInArea(species, targetAreaId, event)
}

const toggleSpeciesCountEdit = () => {
  if (!editSpeciesCounts.value) {
    editableSpeciesList.value = []
    return
  }
  const source = getSpeciesList()
  editableSpeciesList.value = source.map((species: any) => ({
    ...species,
    quantity: Number(species.quantity ?? species.qty ?? 1),
  }))
}

const cancelSpeciesCountEdit = () => {
  editSpeciesCounts.value = false
  editableSpeciesList.value = []
}

const incrementSpeciesCount = (index: number) => {
  const row = editableSpeciesList.value[index]
  if (!row) return
  row.quantity = Number(row.quantity || 0) + 1
}

const decrementSpeciesCount = (index: number) => {
  const row = editableSpeciesList.value[index]
  if (!row) return
  const current = Number(row.quantity || 1)
  row.quantity = current > 1 ? current - 1 : 1
}

const saveSpeciesCountChanges = async () => {
  if (!selectItem.value?.id) {
    toastInit({ message: 'Open the package details first before saving species.', color: 'warning' })
    return
  }
  const speciesBulk = editableSpeciesList.value
    .map((row: any) => ({
      species_id: Number(getSpeciesId(row)),
      quantity: Number(row.quantity || 1),
    }))
    .filter((row: any) => row.species_id && row.quantity > 0)

  if (speciesBulk.length === 0) {
    toastInit({ message: 'No species quantities to save.', color: 'warning' })
    return
  }

  savingSpeciesCounts.value = true
  try {
    let response: any
    const maybeFn: any = (regulatoryPackageStore as any).addSpeciesToRegulatoryPackage
    if (typeof maybeFn === 'function') {
      response = await maybeFn(selectItem.value.id as number, speciesBulk)
    } else {
      response = await postSpeciesToPackage(selectItem.value.id as number, speciesBulk)
    }
    if (response && (response.status === 201 || response.status === 200 || response.data?.success)) {
      toastInit({ message: 'Species counts updated.', color: 'success' })
      await showDetails({ id: selectItem.value.id })
      cancelSpeciesCountEdit()
    }
  } catch (error) {
    const msg = handleErrors(error)
    toastInit({ message: Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to update species counts'), color: 'danger' })
  } finally {
    savingSpeciesCounts.value = false
  }
}

const exportPackageCsv = () => {
  if (!selectItem.value) return
  const speciesList = getSpeciesList()
  if (!speciesList || speciesList.length === 0) {
    toastInit({ message: 'No species to export', color: 'warning' })
    return
  }

  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    return '"' + str.replace(/"/g, '""') + '"'
  }

  const rows = speciesList.map((s: any) => {
    const name = getSpeciesName(s)
    const qty = (s && (s.quantity ?? s.qty)) ?? ''
    return `${escapeCsv(name)},${escapeCsv(qty)}`
  })

  const header = 'Species Name,Quantity'
  const csvContent = [header].concat(rows).join('\n')

  const filenameBase = (selectItem.value.name || 'package').toString().replace(/\s+/g, '_')
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

const downloadSpeciesTemplate = () => {
  if (!speciesOptions.value || speciesOptions.value.length === 0) {
    toastInit({ message: 'No species available. Please wait for species to load.', color: 'warning' })
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
  
  toastInit({ message: 'Species template downloaded successfully', color: 'success' })
}

const createRegulatoryPackageFirst = async () => {
  if (!packageForm.name || !packageForm.duration) {
    toastInit({ message: 'Please enter name and duration.', color: 'warning' })
    return
  }

  const payload = {
    name: packageForm.name,
    duration: packageForm.duration,
    speciesObjectList: [],
  }

  try {
    const response = await regulatoryPackageStore.createNewRegulatoryPackage(payload)
    if (response && (response.status === 201 || response.status === 200)) {
      const id = response.data?.id
        || response.data?.data?.id
        || response.data?.data?.regulatory_package?.id
        || response.data?.data?.regulatoryPackage?.id
        || response.data?.data?.regulatoryPackageId

      if (id) {
        createdPackageId.value = id
        createdPackageName.value = String(packageForm.name || '')
        toastInit({ message: 'Package created. You can now add species.', color: 'success' })
        // Open details view and show add species form immediately
        await showDetails({ id })
        showpackForm.value = false
        showAddSpeciesForm.value = true
      } else {
        // Fallback: try to fetch the latest packages and match by name
        await getPackages()
        const found = items.value.find((p: any) => String(p.name).trim().toLowerCase() === String(packageForm.name).trim().toLowerCase())
        if (found?.id) {
          createdPackageId.value = found.id
          createdPackageName.value = String(found.name || packageForm.name || '')
          toastInit({ message: 'Package created. You can now add species.', color: 'success' })
          await showDetails({ id: found.id })
          showpackForm.value = false
          showAddSpeciesForm.value = true
        } else {
          toastInit({ message: 'Package created but could not resolve ID. Please reopen and try again.', color: 'warning' })
        }
      }
    }
  } catch (error) {
    const msg = handleErrors(error)
    toastInit({ message: Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to create package'), color: 'danger' })
  }
}

// Fallback helper: directly POST species to package if store action is missing
async function postSpeciesToPackage(packageId: number, speciesBulk: Array<{ species_id: number; quantity: number }>) {
  const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
  const endpoint = (import.meta.env.VITE_APP_REGULATORY_HUNTING_PACKAGES_URL || '').replace(/\/+$/, '')
  const url = `${baseUrl}/${endpoint}/${packageId}/species`
  const data = { species: speciesBulk }
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url,
    headers: { 'Content-Type': 'application/json' },
    data,
  } as any
  const response = await axios.request(config)
  return response
}

const submitSpeciesAfterCreation = async (silent = false) => {
  const packageId = createdPackageId.value || selectItem.value?.id
  if (!packageId) {
    toastInit({ message: 'Open the package details first before saving species.', color: 'warning' })
    return
  }

  const validSpecies = speciesRows.value.filter(row => row.species && Number(row.quantity) > 0)
  if (validSpecies.length === 0) {
    toastInit({ message: 'Please add at least one species item.', color: 'warning' })
    return
  }

  const speciesBulk = validSpecies.map(row => ({ species_id: Number(row.species), quantity: Number(row.quantity) }))

  try {
    let response: any
    const maybeFn: any = (regulatoryPackageStore as any).addSpeciesToRegulatoryPackage
    if (typeof maybeFn === 'function') {
      response = await maybeFn(packageId as number, speciesBulk)
    } else {
      response = await postSpeciesToPackage(packageId as number, speciesBulk)
    }
    if (response && (response.status === 201 || response.status === 200 || response.data?.success)) {
      toastInit({ message: 'Species saved to package.', color: 'success' })
      if (!silent) {
        // Reload details to reflect new species
        await showDetails({ id: packageId })
        closeAddSpeciesForm()
      }
    }
  } catch (error) {
    const msg = handleErrors(error)
    toastInit({ message: Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to save species'), color: 'danger' })
  }
}

const getQs = async (id: any = null) => {
  try {
    const response = await quotaStore.getQuotas(id)
    if (response.status === 200) {
      const data = response.data

      quotasOptions.value = data.map((item: any) => {
        const result = quotaStore.generateQuotaYear(item.start_date, item.end_date)

        return {
          value: item.id,
          text: `${result} - ${item.name}`,
        }
      })
    }
  } catch (error) {
    console.error(error)
  }
}

const getPackages = async () => {
  loading.value = true
  try {
    const response = await regulatoryPackageStore.getRegulatoryPackages()
    if (response.status === 200) {
      const data = response.data
      items.value = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        area_name: item.area_name,
        regulatory_package_name: item.regulatory_package_name || item.name,
        duration: item.duration,
      }))
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const getSpeciesItems = async () => {
  try {
    const response = await quotaStore.getSpeciesList()

    speciesOptions.value = response.data.map((item: { id: any; name: any }) => {
      return {
        value: item.id,
        text: item.name,
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const confirmDelete = (row: any) => {
  itemToDelete.value = row
  Swal.fire({
    title: 'Are you sure?',
    html: `Are you sure you want to delete <strong>${row?.name || 'this item'}</strong>?`,
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
      await confirmDeletePackage()
    } else {
      itemToDelete.value = null
    }
  })
}

const confirmDeletePackage = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    // Call the real delete API
    const response = await regulatoryPackageStore.deleteRegulatoryPackage(itemToDelete.value.id)
    if (response && (response.status === 200 || response.status === 204)) {
      toastInit({ message: 'Regulatory package deleted successfully.', color: 'success' })
      itemToDelete.value = null
      await getPackages()
    } else {
      toastInit({ message: 'Failed to delete regulatory package.', color: 'danger' })
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'An error occurred'
    toastInit({
      message: errorMessage,
      color: 'danger',
    })
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}

// Lifecycle
onMounted(() => {
  getQs()
  getSpeciesItems()
  getPackages()
})
</script>

<style lang="scss" scoped>
.regulatory-package-page {

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

    .breadcrumb-item {
      text-transform: uppercase !important;
      display: inline-flex;
      align-items: center;

      &::before {
        content: ' / ' !important;
        color: #9ca3af !important;
        padding: 0 0.5rem;
      }

      &:first-child::before {
        display: none !important;
      }

      a {
        text-transform: uppercase !important;
        color: #374151 !important;
        font-weight: 600;
        text-decoration: none !important;

        &:hover {
          color: #0d6efd;
        }
      }

      &.active {
        color: #212529 !important;
        text-transform: uppercase !important;
      }
    }

  }

  .custom-table {
    .table {
      font-size: 0.875rem;
      background-color: #ffffff;
      border-radius: 0.375rem;
      overflow: hidden;

      thead th {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #dee2e6;
        background-color: #f8f9fa;
        padding: 0.75rem;
      }

      tbody {
        tr {
          transition: background-color 0.2s ease;

          &:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }

          td {
            padding: 0.75rem;
            border-bottom: 1px solid #dee2e6;
            vertical-align: middle;
          }
        }
      }
    }
  }
}

.modal-content {
  padding: 16px;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  margin-bottom: 8px;
  font-weight: bold;
}

.input-container {
  display: flex;
  align-items: center;
}

.input-container>VaDateInput {
  margin-right: 8px;
}

.input-container>VaInput {
  flex: 1;
}
</style>
