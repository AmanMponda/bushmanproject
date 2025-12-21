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
    <template v-if="showpackForm">
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
    </template>

    <!-- Details View -->
    <template v-else-if="showDetailsPage && selectItem">
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
              <div class="card-header bg-white">
                <h6 class="mb-0">
                  <i class="fa fa-paw me-2 text-primary"></i>
                  Species ({{ getSpeciesCount() }})
                </h6>
              </div>
              <div class="card-body">
                <div v-if="hasSpecies()" class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Species Name</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(species, index) in getSpeciesList()" :key="index">
                        <td>{{ getSpeciesName(species) }}</td>
                        <td>{{ species.quantity || 'N/A' }}</td>
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
    </template>

    <!-- Form View -->
    <template v-else-if="!showDetailsPage">
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
          <form @submit.prevent="validatepackageForm() && addNewRegulatoryPackage()">
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Name</label>
                <input v-model="packageForm.name" type="text" class="form-control" placeholder="Enter package Name"
                  required />
              </div>

              <div class="col-md-4">
                <label class="form-label">Duration in days</label>
                <input v-model="packageForm.duration" type="number" class="form-control"
                  placeholder="Enter package Duration" required />
              </div>
            </div>

            <hr class="my-4" />

            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold">Species List</span>
              </div>

              <!-- MultiRowTableInput Component -->
              <MultiRowTableInput v-model="speciesRows" :fields="speciesFields" add-button-label="Add Species" />
            </div>

            <!-- CSV Input Component -->
            <div v-if="!csvUploaded" class="mb-4">

              <h6 class="fw-bold mb-3 d-flex align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-file-csv text-success"></i>
                  <span>Bulk Import from CSV</span>
                </div>

                <a href="/assets/uploadsguide/other-uploads.csv" download
                  class="btn btn-sm btn-outline-success ms-auto">
                  <i class="fa fa-download me-1"></i>
                  Download Template
                </a>
              </h6>


              <CSVInput :column-fields="csvColumnFields" duplicate-key-field="name" :model-value="existingCsvModel"
                :allowed-values="allowedSpeciesNames" @import="handleCsvImport" />
            </div>

            <div class="mb-4">
              <button class="btn btn-success" :disabled="!isValidpackageForm || speciesRows.length === 0" type="submit">
                <i class="fa fa-check me-2"></i>Submit New
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '../../../stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import MultiRowTableInput from '../reusables/MultiRowTableInput.vue'
import CSVInput from '../reusables/CSVInput.vue'
import Swal from 'sweetalert2'

// Stores
const quotaStore = useQuotaStore()
const regulatoryPackageStore = useRegulatoryPackageStore()
const { init: toastInit } = useToast()

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

// CSVInput configuration and handlers
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

function handleCsvImport(rows: Array<{ name: string; quantity: any }>) {
  const nameToOption = new Map(
    speciesOptions.value.map((opt: any) => [String(opt.text).toLowerCase(), opt])
  )

  // Clear existing data and start fresh with CSV data
  const newSpeciesRows: any[] = []
  let newId = 0

  let added = 0
  for (const row of rows) {
    const key = String(row.name || '').toLowerCase()
    const opt = nameToOption.get(key)
    if (!opt) continue
    newId++
    newSpeciesRows.push({ _id: newId, species: opt.value, quantity: Number(row.quantity) || 1 })
    added++
  }
  if (added > 0) {
    speciesRows.value = newSpeciesRows
    csvUploaded.value = true
    toastInit({ message: `Imported ${added} species from CSV`, color: 'success' })
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
    }
  } catch (error) {
    console.error('Error fetching package details:', error)
    toastInit({ message: 'Failed to load package details', color: 'danger' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  showDetailsPage.value = false
  selectItem.value = null
  showpackForm.value = true
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

const addNewRegulatoryPackage = async () => {
  // Filter out empty rows
  const validSpecies = speciesRows.value.filter(row => row.species && row.quantity > 0)

  if (validSpecies.length === 0) {
    toastInit({ message: 'Please add at least one species item.', color: 'warning' })
    return
  }

  // Transform the data to match API format
  const speciesObjectList = validSpecies.map(row => ({
    id: row.species,
    quantity: Number(row.quantity),
  }))

  const rdata = {
    name: packageForm.name,
    duration: packageForm.duration,
    speciesObjectList: speciesObjectList,
  }

  try {
    const response = await regulatoryPackageStore.createNewRegulatoryPackage(rdata)
    if (response.status === 201) {
      toastInit({ message: response.data.message, color: 'success' })
      resetpackageForm()
      packageForm.name = null
      packageForm.duration = null
      speciesRows.value = [{ _id: 1, species: '', quantity: 1 }]
      csvUploaded.value = false
      showpackForm.value = true
      getPackages()
    }
  } catch (error) {
    handleErrors(error)
    toastInit({
      message: error instanceof Error ? error.message : 'An error occurred',
      color: 'danger',
    })
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
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
