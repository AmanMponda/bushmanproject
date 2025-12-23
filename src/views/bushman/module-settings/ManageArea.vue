<template>
  <div class="area-settings-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Hunting Areas</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showHuntingAreaList">
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
              >
                <template #name="{ row }: { row: any }">
                  {{ (row as any).name }}
                </template>
                <template #description="{ row }: { row: any }">
                  {{ (row as any).description }}
                </template>
                <template #lat="{ row }: { row: any }">
                  {{ (row as any).lat }}
                </template>
                <template #lng="{ row }: { row: any }">
                  {{ (row as any).lng }}
                </template>
                <template #actions="{ row }: { row: any }">
                  <div class="d-flex gap-1">
                    <button class="btn btn-primary btn-sm" title="View" @click="viewAreaSpecies(row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-info btn-sm" title="Edit" @click="editHuntingArea(row)">
                      <i class="fa fa-edit"></i>
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

    <!-- Area Species View -->
    <template v-else-if="showAreaSpecies && selectedArea">
      <div class="p-2">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="fw-bold mb-1">{{ selectedArea.name }}</h3>
            <div class="text-muted">Manage species for this hunting area</div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-secondary" @click="goBackToList">Back</button>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Add Species to Area</h6>
            <form class="row g-3" @submit.prevent="addSpeciesToArea">
              <div class="col-md-6">
                <label class="form-label">Species</label>
                <select v-model="speciesForm.specie" class="form-select" required>
                  <option :value="null" disabled>Select species</option>
                  <option v-for="s in speciesOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
                </select>
              </div>
              <div class="col-md-12">
                <button type="submit" class="btn btn-primary" :disabled="savingSpecies || !speciesForm.specie">
                  <span v-if="savingSpecies" class="spinner-border spinner-border-sm me-1"></span>
                  Add Species
                </button>
              </div>
            </form>

            <hr class="my-4" />

            <div class="mb-3">
              <div class="d-flex align-items-center mb-2">
                <h6 class="fw-bold mb-0">Bulk Import from CSV</h6>
                <a href="/assets/uploadsguide/species-upload.csv" download class="btn btn-sm btn-outline-success ms-auto">
                  <i class="fa fa-download me-1"></i>
                  Download Template
                </a>
              </div>
              <CSVInput
                :column-fields="[{ key: 'name', label: 'Species Name' }]"
                :allowed-values="allowedSpeciesNames"
                :example-path="'/assets/uploadsguide/species-upload.csv'"
                @import="handleAreaCsvImport"
              />
            </div>

            <hr class="my-4" />

            <div class="mb-3">
              <h6 class="fw-bold mb-3">Species in this Area</h6>
              <div v-if="loadingSpecies" class="text-center py-3">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
              <div v-else-if="areaSpecies.length === 0" class="text-center py-3 text-muted">
                No species added to this area yet.
              </div>
              <div v-else>
                <div class="list-group">
                  <div v-for="species in areaSpecies" :key="species.id" class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-semibold">{{ species.specie_name }}</div>
                      <div class="text-muted small">#{{ species.specie_id }}</div>
                    </div>
                    <button class="btn btn-danger btn-sm" @click="deleteAreaSpecies(species)" :disabled="deleting">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create/Edit Form -->
    <template v-else>
      <div class="p-2">
        <h3 class="fw-bold mb-3">{{ editMode ? 'Edit Hunting Area' : 'Create New Hunting Area' }}</h3>

        <form @submit.prevent="onAreaSubmit" class="row">
          <div class="col-lg-8 col-md-12">
            <div class="card">
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input v-model="areaForm.name" type="text" class="form-control" placeholder="e.g., Northern Reserve" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea v-model="areaForm.description" class="form-control" rows="3" placeholder="Optional description"></textarea>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Latitude</label>
                    <input
                      v-model="areaForm.lat"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      class="form-control"
                      placeholder="e.g. -6.123456"
                      required
                    />
                    <div class="form-text">Range: -90 to 90</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Longitude</label>
                    <input
                      v-model="areaForm.lng"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      class="form-control"
                      placeholder="e.g. 34.123456"
                      required
                    />
                    <div class="form-text">Range: -180 to 180</div>
                  </div>
                </div>

                <div class="d-flex gap-2 mt-2">
                  <button type="submit" class="btn btn-primary" :disabled="saving || !isAreaFormValid">{{ editMode ? 'Update' : 'Save' }}</button>
                  <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useQuotaStore } from '@/stores/bushman/quota-store'
import { useHuntingAreaStore } from '@/stores/bushman/hunting-story'
import { useToast } from '@/composables/useToast'
import handleErrors from '@/stores/bushman/errorHandler'
import Swal from 'sweetalert2'
import CSVInput from '../reusables/CSVInput.vue'

interface CsvRow {
  name?: string
  [key: string]: any
}

const quotaStore = useQuotaStore()
const huntingAreaStore = useHuntingAreaStore()
const toast = useToast()

// State
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lng', label: 'Longitude' },
  { key: 'actions', label: 'Actions' },
]

const items = ref<any[]>([])
const speciesOptions = ref<any[]>([])
const areasOptions = ref<any[]>([])
const selectedArea = ref<any>(null)
const showHuntingAreaList = ref(true)
const showAreaSpecies = ref(false)
const loading = ref(false)
const loadingSpecies = ref(false)
const csvImporting = ref(false)

const areaForm = reactive({
  id: null as number | null,
  name: null as string | null,
  description: '',
  lat: null as number | null,
  lng: null as number | null,
})

const speciesForm = reactive({
  specie: null as number | null,
})

const areaSpecies = ref<any[]>([])
const csvUploaded = ref(false)
const saving = ref(false)
const savingSpecies = ref(false)
const editMode = ref(false)
const deleting = ref(false)

// Computed properties
const pageActions = computed(() => {
  const actions = []
  if (showHuntingAreaList.value) {
    actions.push({
      label: 'Add New',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => showCreateForm(),
    })
  }
  return actions
})

const isAreaFormValid = computed(() => {
  const nameOk = (areaForm.name || '').trim().length >= 2
  const latNum = parseFloat(areaForm.lat as any)
  const lngNum = parseFloat(areaForm.lng as any)
  const latOk = !isNaN(latNum) && latNum >= -90 && latNum <= 90
  const lngOk = !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180
  return nameOk && latOk && lngOk
})

const allowedSpeciesNames = computed(() => {
  return speciesOptions.value.map((opt: any) => String(opt.text))
})

const existingCsvModel = computed(() => {
  return areaSpecies.value.map((item: any) => ({ name: item.specie_name || item.name || '' }))
})

// Methods
function toggleFormAndList() {
  showHuntingAreaList.value = !showHuntingAreaList.value
  showAreaSpecies.value = false
  if (showHuntingAreaList.value) {
    resetForm()
    getAreas()
  }
}

function goBackToList() {
  showAreaSpecies.value = false
  showHuntingAreaList.value = true
  selectedArea.value = null
  areaSpecies.value = []
  speciesForm.specie = null
  csvUploaded.value = false
  getAreas()
}

function showCreateForm() {
  editMode.value = false
  resetForm()
  showHuntingAreaList.value = false
}

function viewAreaSpecies(rowData: any) {
  selectedArea.value = rowData
  showHuntingAreaList.value = false
  showAreaSpecies.value = true
  speciesForm.specie = null
  csvUploaded.value = false
  loadAreaSpecies(rowData.id)
}

function editHuntingArea(rowData: any) {
  editMode.value = true
  areaForm.id = rowData.id
  areaForm.name = rowData.name
  areaForm.description = rowData.description
  areaForm.lat = rowData.lat
  areaForm.lng = rowData.lng
  showHuntingAreaList.value = false
  showAreaSpecies.value = false
}

function cancelEdit() {
  resetForm()
  toggleFormAndList()
}

function resetForm() {
  editMode.value = false
  areaForm.id = null
  areaForm.name = null
  areaForm.description = ''
  areaForm.lat = null
  areaForm.lng = null
  showAreaSpecies.value = false
}

function onAreaSubmit() {
  if (!isAreaFormValid.value) {
    toast.init({ message: 'Please fill out a valid name and coordinates.', color: 'warning' })
    return
  }
  if (editMode.value) {
    updateExistingHuntingArea()
  } else {
    createNewHuntingArea()
  }
}

async function confirmDelete(rowData: any) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete "${rowData.name}"? This action cannot be undone!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
  })

  if (!result.isConfirmed) return

  deleting.value = true
  try {
    const response = await huntingAreaStore.deleteHuntingArea(rowData.id, true)
    if (response.status === 204 || response.status === 200) {
      toast.init({
        message: 'Hunting Area deleted successfully',
        color: 'success',
      })
      getAreas()
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.detail || error?.response?.data?.message
    toast.init({
      message: errorMessage || 'Failed to delete hunting area',
      color: 'danger',
    })
  } finally {
    deleting.value = false
  }
}

async function updateExistingHuntingArea() {
  saving.value = true
  const coordinates = [
    {
      lat: parseFloat(areaForm.lat as any),
      lng: parseFloat(areaForm.lng as any),
    },
  ]
  const requestData = {
    name: (areaForm.name || '').trim(),
    description: (areaForm.description || '').trim(),
    coordinates: coordinates,
  }
  try {
    const response = await huntingAreaStore.updateHuntingArea(areaForm.id, requestData)
    if (response.status === 200) {
      saving.value = false
      toast.init({
        message: 'Hunting Area updated successfully',
        color: 'success',
      })
      resetForm()
      toggleFormAndList()
    }
  } catch (error) {
    saving.value = false
    const errors = handleErrors(error)
    toast.init({
      message: '\n' + errors.map((error: string, index: number) => `${index + 1}. ${error}`).join('\n'),
      color: 'danger',
    })
  }
}

async function createNewHuntingArea() {
  saving.value = true
  const coordinates = [
    {
      lat: parseFloat(areaForm.lat as any),
      lng: parseFloat(areaForm.lng as any),
    },
  ]
  const requestData = {
    name: (areaForm.name || '').trim(),
    description: (areaForm.description || '').trim(),
    coordinates: coordinates,
  }
  try {
    const response = await huntingAreaStore.createHuntingArea(requestData)
    if (response.status === 201) {
      saving.value = false
      toast.init({
        message: 'Hunting Area created successfully',
        color: 'success',
      })
      resetForm()
      toggleFormAndList()
      getAreas()
    } else {
      console.log(response)
    }
  } catch (error) {
    saving.value = false
    const errors = handleErrors(error)
    toast.init({
      message: '\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'),
      color: 'danger',
    })
  }
}

async function loadAreaSpecies(areaId: any) {
  loadingSpecies.value = true
  try {
    const resp = await huntingAreaStore.listHuntingAreaSpecies(areaId)
    const list = Array.isArray(resp.data?.data) ? resp.data.data : Array.isArray(resp.data) ? resp.data : []
    areaSpecies.value = list.map((item: any) => ({
      id: item.id,
      specie_id: item.specie_id ?? item.specie?.id,
      specie_name: item.specie_name ?? item.specie?.name ?? item.name,
    }))
  } catch (error) {
    toast.init({ message: 'Failed to load species for this area', color: 'danger' })
  } finally {
    loadingSpecies.value = false
  }
}

async function handleAreaCsvImport(rows: CsvRow[]) {
  if (!selectedArea.value) {
    toast.init({ message: 'Select an area first', color: 'warning' })
    return
  }

  const nameToOpt = new Map(speciesOptions.value.map((opt: any) => [String(opt.text).toLowerCase(), opt]))
  const existingIds = new Set(areaSpecies.value.map((s: any) => String(s.specie_id)))
  const toAdd: string[] = []

  for (const row of rows) {
    const key = String(row.name || '').toLowerCase()
    if (!key) continue
    const opt = nameToOpt.get(key)
    if (!opt) continue
    const idStr = String(opt.value)
    if (existingIds.has(idStr)) continue
    if (toAdd.includes(idStr)) continue
    toAdd.push(idStr)
  }

  if (toAdd.length === 0) {
    toast.init({ message: 'No new species to import', color: 'info' })
    return
  }

  csvImporting.value = true
  try {
    for (const specieId of toAdd) {
      await huntingAreaStore.addHuntingAreaSpecies({ hunting_area_id: selectedArea.value.id, specie_id: specieId })
    }
    csvUploaded.value = true
    toast.init({ message: `Imported ${toAdd.length} species`, color: 'success' })
    loadAreaSpecies(selectedArea.value.id)
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to import species', color: 'danger' })
  } finally {
    csvImporting.value = false
  }
}

async function addSpeciesToArea() {
  if (!selectedArea.value || !speciesForm.specie) return
  savingSpecies.value = true
  try {
    await huntingAreaStore.addHuntingAreaSpecies({
      hunting_area_id: selectedArea.value.id,
      specie_id: speciesForm.specie,
    })
    toast.init({ message: 'Species added to hunting area', color: 'success' })
    speciesForm.specie = null
    loadAreaSpecies(selectedArea.value.id)
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to add species', color: 'danger' })
  } finally {
    savingSpecies.value = false
  }
}

async function deleteAreaSpecies(record: any) {
  if (!record?.id || !selectedArea.value) return
  deleting.value = true
  try {
    await huntingAreaStore.deleteHuntingAreaSpecies(record.id, selectedArea.value.id, record.specie_id)
    toast.init({ message: 'Species removed from hunting area', color: 'success' })
    loadAreaSpecies(selectedArea.value.id)
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to remove species', color: 'danger' })
  } finally {
    deleting.value = false
  }
}

async function getAreas() {
  try {
    loading.value = true
    const response = await quotaStore.getAreaList()
    areasOptions.value = response.data.map((item: { id: any; name: any }) => {
      return {
        value: item.id,
        text: item.name,
      }
    })

    interface Item {
      id: string
      name: string
      description: string
      location?: {
        geo_coordinates?: {
          coordinates?: string
        }
      }
    }

    if (response.status === 200) {
      items.value = response.data.map((item: Item) => {
        const coords = JSON.parse(item?.location?.geo_coordinates?.coordinates || '[]')
        return {
          id: item?.id,
          name: item?.name,
          description: item?.description,
          lat: coords[0]?.lat,
          lng: coords[0]?.lng,
        }
      })

      loading.value = false
    } else {
      loading.value = false
      toast.init({
        message: 'No hunting areas found',
        color: 'info',
      })
    }
  } catch (error: any) {
    loading.value = false
    toast.init({
      message: 'Failed to load hunting areas',
      color: 'danger',
    })
  }
}

async function getSpeciesItems() {
  try {
    const response = await quotaStore.getSpeciesList()
    const list = Array.isArray(response.data) ? response.data : response.data?.data || []
    speciesOptions.value = list.map((item: any) => ({ value: item.id, text: item.name }))
  } catch (error) {
    // ignore load failure here
  }
}

onMounted(() => {
  getAreas()
  getSpeciesItems()
})
</script>

<style lang="scss" scoped>
.area-settings-page {
  padding: 0;
  min-height: 600px;
  width: 100%;
}

.layout-top-spacing {
  margin-top: 20px;
}

.layout-spacing {
  padding: 10px 0;
}

.breadcrumb {
  text-transform: uppercase !important;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0 !important;

  .breadcrumb-item {
    text-transform: uppercase !important;

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
        color: #1f2937 !important;
        text-decoration: none !important;
      }
    }

    &.active {
      color: #9ca3af !important;
      font-weight: 400;
      text-transform: uppercase !important;
    }
  }
}
</style>
