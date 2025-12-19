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
              <StandardDataTable
                :columns="columns"
                :data="items"
                :loading="loading"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :show-date-filters="false"
              >
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
            <div class="ms-auto">
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
                <input
                  v-model="packageForm.name"
                  type="text"
                  class="form-control"
                  placeholder="Enter package Name"
                  required
                />
              </div>

              <div class="col-md-4">
                <label class="form-label">Duration</label>
                <input
                  v-model="packageForm.duration"
                  type="number"
                  class="form-control"
                  placeholder="Enter package Duration"
                  required
                />
              </div>
            </div>

            <hr class="my-4" />

            <div class="mb-4">
              <span class="fw-bold">Add a List of Species</span>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="w-100 me-2">
                <label class="form-label">Species <span class="text-danger">*</span></label>
                <select
                  v-model="packageForm.id"
                  class="form-select"
                  required
                >
                  <option :value="null" disabled>Select Species</option>
                  <option v-for="option in speciesOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
              </div>

              <div class="w-100">
                <label class="form-label">Quantity <span class="text-danger">*</span></label>
                <input
                  v-model.number="packageForm.quantity"
                  type="number"
                  class="form-control"
                  min="1"
                  placeholder="Enter quantity"
                  required
                />
              </div>
            </div>

            <div class="mb-4">
              <button
                class="btn btn-primary"
                type="button"
                @click="addNewSpeciesItemToStorage()"
              >
                <i class="fa fa-plus me-2"></i>Add Species
              </button>
            </div>
          </form>

          <div class="mb-4">
            <div v-if="speciesObjects.length > 0" class="fw-bold mb-2">Selected Species</div>
            <div v-for="(s, index) in speciesObjects" :key="index" class="border p-3 rounded mb-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div>Name: {{ s.name }}</div>
                  <div class="text-muted">Quantity: {{ s.quantity }}</div>
                </div>
                <button
                  class="btn btn-danger btn-sm"
                  @click="deleteFromStorage(index)"
                  title="Remove"
                >
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <button
              class="btn btn-success"
              :disabled="!isValidpackageForm"
              @click="validatepackageForm() && addNewRegulatoryPackage()"
            >
              <i class="fa fa-check me-2"></i>Submit New
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useRegulatoryPackageStore } from '../../../stores/bushman/regulatory-store'
import { useToast } from '@/composables/useToast'
import { useForm } from '@/composables/useForm'
import handleErrors from '../../../stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
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
const speciesObjects = ref<any[]>([])
const speciesOptions = ref<any[]>([])
const quotasOptions = ref<any[]>([])

const packageForm = reactive({
  id: null as any,
  duration: null as any,
  name: null as any,
  quantity: null as any,
  salesQuota: null as any,
  area: null as any,
})

const columns = [
  { key: 'regulatory_package_name', label: 'Licence', sortable: true, visible: true },
  // { key: 'area_name', label: 'Area', sortable: true, visible: true },
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
  }
}

const showDetails = (row: any) => {
  // Use the full item data if available, otherwise use row data
  const itemData = row.selfItem || row
  selectItem.value = itemData
  console.log('Selected item for details:', itemData)
  console.log('Species data:', itemData.species)
  showDetailsPage.value = true
  showpackForm.value = false
}

const goBack = () => {
  showDetailsPage.value = false
  selectItem.value = null
  showpackForm.value = true
  getPackages()
}

const getSpeciesList = () => {
  if (!selectItem.value) return []
  // Try different possible field names
  return selectItem.value.species || 
         selectItem.value.species_list || 
         selectItem.value.regulatory_package_species || 
         selectItem.value.species_object_list || 
         []
}

const hasSpecies = () => {
  const species = getSpeciesList()
  return species && species.length > 0
}

const getSpeciesCount = () => {
  return getSpeciesList().length
}

const getSpeciesName = (species: any) => {
  // Handle different possible structures
  if (species.species?.name) return species.species.name
  if (species.name) return species.name
  if (species.species_name) return species.species_name
  if (typeof species === 'string') return species
  return 'N/A'
}

const addNewSpeciesItemToStorage = () => {
  // Validate inputs
  if (!packageForm.id || !packageForm.quantity) {
    toastInit({ message: 'Please select a species and enter a quantity.', color: 'warning' })
    return
  }

  if (Number(packageForm.quantity) <= 0) {
    toastInit({ message: 'Quantity must be greater than 0.', color: 'warning' })
    return
  }

  // Find the selected species option to get the name
  const selectedSpecies = speciesOptions.value.find((option: any) => option.value === packageForm.id)
  
  if (!selectedSpecies) {
    toastInit({ message: 'Selected species not found.', color: 'danger' })
    return
  }

  // Check if this species is already added
  const exists = speciesObjects.value.some((species: { id: any }) => species.id === packageForm.id)

  if (!exists) {
    speciesObjects.value.push({
      id: packageForm.id,
      name: selectedSpecies.text,
      quantity: Number(packageForm.quantity),
    })
    toastInit({ message: `${selectedSpecies.text} added successfully.`, color: 'success' })
    
    // Reset the form fields for next addition
    packageForm.id = null
    packageForm.quantity = null
  } else {
    toastInit({ message: `${selectedSpecies.text} is already added. Please remove it first or select a different species.`, color: 'warning' })
  }
}

const deleteFromStorage = (index: number) => {
  speciesObjects.value.splice(index, 1)
  console.log('Species item deleted:', index)
}

const addNewRegulatoryPackage = async () => {
  if (speciesObjects.value.length === 0) {
    toastInit({ message: 'Please add at least one species item.', color: 'warning' })
    return
  }
  const rdata = {
    name: packageForm.name,
    duration: packageForm.duration,
    speciesObjectList: speciesObjects.value,
  }

  try {
    const response = await regulatoryPackageStore.createNewRegulatoryPackage(rdata)
    if (response.status === 201) {
      toastInit({ message: response.data.message, color: 'success' })
      resetpackageForm()
      speciesObjects.value = []
      packageForm.name = null
      packageForm.duration = null
      packageForm.id = null
      packageForm.quantity = null
      showpackForm.value = true
      getPackages()
    } else {
      console.log(response.data)
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
      loading.value = false
      const data = response.data
      items.value = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        area_name: item.area_name,
        regulatory_package_name: item.regulatory_package_name,
        duration: item.duration,
        species: item.species || [],
        selfItem: item, // Store full item for details view
      }))
    }
  } catch (error) {
    loading.value = false
    console.log(error)
  }
}

const getSpeciesItems = async () => {
  try {
    const response = await quotaStore.getSpeciesList()

    const speciesItems = response.data.map((item: { id: any; name: any }) => {
      return {
        value: item.id,
        text: item.name,
      }
    })

    speciesOptions.value = speciesOptions.value.concat(speciesItems)
  } catch (error) {
    console.log(error)
  }
}

const confirmDelete = (row: any) => {
  itemToDelete.value = row
  // SweetAlert2 confirmation
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

.input-container > VaDateInput {
  margin-right: 8px;
}

.input-container > VaInput {
  flex: 1;
}
</style>
