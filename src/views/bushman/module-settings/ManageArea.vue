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
                <template #name="slotProps">
                  {{ (slotProps.row as any)?.name || (slotProps.row as any)?.location_name || (slotProps.row as any)?.location?.name || 'N/A' }}
                </template>
                <template #code="slotProps">
                  {{ (slotProps.row as any)?.code || (slotProps.row as any)?.location_code || (slotProps.row as any)?.location?.code || 'N/A' }}
                </template>
<template #species="slotProps">
                  <span v-if="(slotProps.row as any)?.species_count !== undefined">
                    {{ (slotProps.row as any).species_count }} species
                  </span>
                  <span v-else class="text-muted">Loading...</span>
                </template>
<template #actions="slotProps">
                  <div class="d-flex gap-1">
                    <button class="btn btn-primary btn-sm" title="View Details" @click="viewAreaDetails(slotProps.row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-success btn-sm" title="View Species" @click="viewAreaSpecies(slotProps.row)">
                      <i class="fa fa-paw"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(slotProps.row)">
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

<!-- Area Details View with Map -->
<template v-else-if="showAreaDetails && areaDetails">
      <div class="p-2">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="fw-bold mb-1">{{ areaDetails.location?.name || 'Hunting Area' }}</h3>
            <div class="text-muted">
              <span v-if="areaDetails.location?.code">
                Code: {{ areaDetails.location.code }}
              </span>
              <span v-if="areaDetails.description" class="ms-2">
                - {{ areaDetails.description }}
              </span>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success" @click="viewAreaSpeciesFromDetails">
              <i class="fa fa-plus me-1"></i> Add Species
            </button>
            <button class="btn btn-secondary" @click="goBackToList">Back</button>
          </div>
        </div>

        <div class="row g-3">
          <!-- Map Section -->
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h6 class="fw-bold mb-0"><i class="fa fa-map me-2"></i>Area Map</h6>
              </div>
              <div class="card-body">
                <div v-if="loadingAreaDetails" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status"></div>
                  <p class="mt-2 text-muted">Loading map...</p>
                </div>
                <div v-else-if="mapPaths.length === 0 && mapMarkers.length === 0" class="text-center py-5 text-muted">
                  <i class="fa fa-map fa-3x mb-3"></i>
                  <p>No coordinates available for this area</p>
                </div>
                <div v-else style="height: 500px; width: 100%;">
                  <div id="leaflet-map" style="width: 100%; height: 100%;"></div>
                </div> 
              </div>
            </div>
          </div>

          <!-- Information Section -->
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h6 class="fw-bold mb-0"><i class="fa fa-info-circle me-2"></i>Area Information</h6>
              </div>
              <div class="card-body">
                <p class="mb-2"><strong>Location:</strong> {{ areaDetails.location?.name || 'N/A' }}</p>
                <p class="mb-2"><strong>Code:</strong> {{ areaDetails.location?.code || 'N/A' }}</p>
                <p class="mb-2"><strong>Description:</strong> {{ areaDetails.description || 'No description' }}</p>
                <p class="mb-2"><strong>Created:</strong> {{ formatDate(areaDetails.created_at) }}</p>
                <p class="mb-0"><strong>Updated:</strong> {{ formatDate(areaDetails.updated_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Coordinates Section -->
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h6 class="fw-bold mb-0"><i class="fa fa-map-marker-alt me-2"></i>Coordinates</h6>
              </div>
              <div class="card-body">
                <div v-if="areaDetails.coordinates && areaDetails.coordinates.length > 0">
                  <div v-for="(coord, index) in areaDetails.coordinates" :key="index" class="mb-3">
                    <p class="mb-1"><strong>Type:</strong> {{ coord.coordinates_type }}</p>
                    <details>
                      <summary class="text-primary cursor-pointer">View Coordinates JSON</summary>
                      <pre class="mt-2 p-2 bg-light rounded small">{{ coord.coordinates }}</pre>
                    </details>
                  </div>
                </div>
                <p v-else class="text-muted mb-0">No coordinates available</p>
              </div>
            </div>
          </div>

          <!-- Species Management -->
          <div class="col-12">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0"><i class="fa fa-paw me-2"></i>Species</h6>
                <span class="text-muted small">Total: {{ areaSpecies.length }}</span>
              </div>
              <div class="card-body">
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
      </div>
    </template>

<!-- Add Species View -->
<template v-else-if="showAddSpecies && selectedArea">
      <div class="p-2">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="fw-bold mb-1">{{ selectedArea.location_name || selectedArea.location?.name || 'Hunting Area' }}</h3>
            <div class="text-muted">
              <span v-if="selectedArea.location_code || selectedArea.location?.code">
                Code: {{ selectedArea.location_code || selectedArea.location?.code }}
              </span>
              <span v-if="selectedArea.description" class="ms-2">
                - {{ selectedArea.description }}
              </span>
            </div>
            <div class="text-muted small">Add species to this hunting area</div>
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
                  <i class="fa fa-plus me-1"></i> Add Species
                </button>
              </div>
            </form>

            <div v-if="savingSpecies" class="mt-3">
              <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%;">
                  Adding species...
                </div>
              </div>
            </div>

            <hr class="my-4" />

            <ManageAreaCsvInput
              :column-fields="[{ key: 'specie_id', label: 'Specie ID' }, { key: 'name', label: 'Species Name' }]"
              duplicate-key-field="specie_id"
              :model-value="existingCsvModel"
              :example-path="'/assets/uploadsguide/species-upload.csv'"
              :download-headers="['specie_id', 'name']"
              :download-rows="speciesTemplateRows"
              download-filename="species-upload.csv"
              @import="handleAreaCsvImport"
            />

            <div v-if="csvImporting" class="mt-3">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Importing species...</span>
                <span>{{ csvImportDone }} / {{ csvImportTotal }}</span>
              </div>
              <div class="progress">
                <div class="progress-bar" :style="{ width: csvImportPercent + '%' }">
                  {{ csvImportPercent }}%
                </div>
              </div>
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
            <h3 class="fw-bold mb-1">{{ selectedArea.location_name || selectedArea.location?.name || 'Hunting Area' }}</h3>
            <div class="text-muted">
              <span v-if="selectedArea.location_code || selectedArea.location?.code">
                Code: {{ selectedArea.location_code || selectedArea.location?.code }}
              </span>
              <span v-if="selectedArea.description" class="ms-2">
                - {{ selectedArea.description }}
              </span>
            </div>
            <div class="text-muted small">Manage species for this hunting area</div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-secondary" @click="goBackToList">Back</button>
          </div>
        </div>
        <div class="card mb-4">
          <div class="card-body">
            <div class="mb-3 d-flex align-items-center justify-content-between">
              <h6 class="fw-bold mb-0">Species in this Area</h6>
              <button class="btn btn-danger btn-sm" :disabled="deleting || selectedSpeciesIds.length === 0" @click="bulkDeleteSpecies">
                <i class="fa fa-trash me-1"></i> Delete Selected
              </button>
            </div>
              <div v-if="loadingSpecies" class="text-center py-3">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
              <div v-else-if="areaSpecies.length === 0" class="text-center py-3 text-muted">
                No species added to this area yet.
              </div>
              <div v-else>
                <div class="list-group">
                  <div v-for="species in areaSpecies" :key="species.id" class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :value="species.specie_id"
                        v-model="selectedSpeciesIds"
                        :disabled="deleting"
                      />
                      <div>
                        <div class="fw-semibold">{{ species.specie_name }}</div>
                        <div class="text-muted small">#{{ species.specie_id }}</div>
                      </div>
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
    </template>

<!-- Create/Edit Form -->
<template v-else>
  <div class="p-2">
    <h3 class="fw-bold mb-3">{{ editMode ? 'Edit Hunting Area' : 'Create New Location & Hunting Area' }}</h3>

    <form @submit.prevent="onAreaSubmit" class="row">
      <div class="col-lg-8 col-md-12">
        <div class="card">
          <div class="card-body">
            <!-- Edit Mode: Select existing location -->
            <template v-if="editMode">
              <div class="mb-3">
                <label class="form-label">Location <span class="text-danger">*</span></label>
                <select v-model="areaForm.location_id" class="form-select" required>
                  <option :value="null" disabled>Select a location</option>
                  <option v-for="loc in locationOptions" :key="loc.value" :value="loc.value">
                    {{ loc.text }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Hunting Area Description</label>
                <textarea v-model="areaForm.description" class="form-control" rows="3"
                  placeholder="Optional "></textarea>
              </div>
            </template>

            <!-- Create Mode: Fill location and hunting area details -->
            <template v-else>
              <div class="mb-3">
                <label class="form-label">Location Name <span class="text-danger">*</span></label>
                <input v-model="areaForm.location_name" type="text" class="form-control" placeholder="e.g., Maswa"
                  required />
              </div>

              <div class="mb-3">
                <label class="form-label">Location Code <span class="text-danger">*</span></label>
                <input v-model="areaForm.location_code" type="text" class="form-control" placeholder="e.g, MS"
                  required />
              </div>

              <div class="mb-3">
                <label class="form-label">Hunting Area Description</label>
                <textarea v-model="areaForm.description" class="form-control" rows="3"
                  placeholder="Optional"></textarea>
                <div class="form-text">description for hunting area</div>
              </div>

              <hr class="my-4" />

              <h6 class="fw-bold mb-3">Geo-Location</h6>

              <div class="mb-3">
                <label class="form-label">Coordinates Type <span class="text-danger">*</span></label>
                <select v-model="areaForm.coordinates_type" class="form-select" required>
                  <option value="POINT">POINT</option>
                  <option value="POLYGON">POLYGON</option>
                  <option value="LINESTRING">LINESTRING</option>
                </select>
              </div>

              <!-- POINT coordinates: Use lat/lng inputs -->
              <template v-if="areaForm.coordinates_type === 'POINT'">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Latitude <span class="text-danger">*</span></label>
                    <input v-model="areaForm.coordinate_lat" type="number" step="any" min="-90" max="90"
                      class="form-control" placeholder="e.g. -3.56789" required />
                    <div class="form-text">Range: -90 to 90</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Longitude <span class="text-danger">*</span></label>
                    <input v-model="areaForm.coordinate_lng" type="number" step="any" min="-180" max="180"
                      class="form-control" placeholder="e.g. 35.12345" required />
                    <div class="form-text">Range: -180 to 180</div>
                  </div>
                </div>
              </template>

              <!-- POLYGON or LINESTRING: Use JSON input -->
              <template v-else>
                <div class="mb-3">
                  <label class="form-label">Coordinates (JSON) <span class="text-danger">*</span></label>
                  <textarea v-model="areaForm.coordinates" class="form-control font-monospace" rows="6"
                    placeholder='e.g., {"type":"Polygon","coordinates":[[[35.10,-3.56],[35.12,-3.58],[35.14,-3.57],[35.10,-3.56]]]}'
                    required></textarea>
                  <div class="form-text">
                    Enter valid GeoJSON format. For {{ areaForm.coordinates_type }}, provide coordinates as JSON string.
                  </div>
                </div>
              </template>
            </template>

            <div class="d-flex gap-2 mt-4">
              <button type="submit" class="btn btn-primary" :disabled="saving || !isAreaFormValid">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ editMode ? 'Update' : 'Create' }}
              </button>
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
// @ts-nocheck - StandardDataTable slot types not fully defined
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useQuotaStore } from '@/stores/bushman/quota-store'
import { useHuntingAreaStore } from '@/stores/bushman/hunting-story'
import { useToast } from '@/composables/useToast'
import handleErrors from '@/stores/bushman/errorHandler'
import Swal from 'sweetalert2'
import ManageAreaCsvInput from './ManageAreaCsvInput.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
  { key: 'code', label: 'Code' },
  { key: 'species', label: 'Species' },
  { key: 'actions', label: 'Actions' },
]

const items = ref<any[]>([])
const speciesOptions = ref<any[]>([])
const locationOptions = ref<any[]>([])
const selectedArea = ref<any>(null)
const areaDetails = ref<any>(null)
const showHuntingAreaList = ref(true)
const showAreaSpecies = ref(false)
const showAreaDetails = ref(false)
const showAddSpecies = ref(false)
const loading = ref(false)
const loadingSpecies = ref(false)
const loadingAreaDetails = ref(false)
const csvImporting = ref(false)
const csvImportTotal = ref(0)
const csvImportDone = ref(0)
const selectedSpeciesIds = ref<any[]>([])
const mapCenter = ref({ lat: -2.5, lng: 34.5 }) // Default center for Tanzania
const mapZoom = ref(10)
const mapPaths = ref<any[]>([])
const mapMarkers = ref<any[]>([])

const areaForm = reactive({
  id: null as number | null,
  location_id: null as number | null,
  // For creating new location with hunting area
  location_name: '',
  location_code: '',
  location_descriptions: '',
  description: '', // This goes to hunting area description
  coordinates_type: 'POINT' as 'POINT' | 'POLYGON' | 'LINESTRING',
  coordinates: '', // Will be formatted as JSON string
  // For coordinate input (user-friendly)
  coordinate_lat: null as number | null,
  coordinate_lng: null as number | null,
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
  if (editMode.value) {
    // For edit mode, need location_id
    return areaForm.location_id !== null && areaForm.location_id !== undefined
  } else {
    // For create mode, need location name, code, and coordinates
    const hasName = (areaForm.location_name || '').trim().length > 0
    const hasCode = (areaForm.location_code || '').trim().length > 0
    const hasCoordinates = areaForm.coordinates_type === 'POINT'
      ? areaForm.coordinate_lat !== null && areaForm.coordinate_lng !== null
      : (areaForm.coordinates || '').trim().length > 0
    return hasName && hasCode && hasCoordinates
  }
})

const existingCsvModel = computed(() => {
  return areaSpecies.value.map((item: any) => ({ specie_id: item.specie_id }))
})

const speciesTemplateRows = computed(() => {
  return speciesOptions.value.map((opt: any) => ({
    specie_id: opt.value,
    name: opt.text,
    scientific_name: '',
    type: '',
  }))
})

const csvImportPercent = computed(() => {
  if (csvImportTotal.value === 0) return 0
  return Math.round((csvImportDone.value / csvImportTotal.value) * 100)
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
  showAreaDetails.value = false
  showAddSpecies.value = false
  showHuntingAreaList.value = true
  selectedArea.value = null
  areaDetails.value = null
  areaSpecies.value = []
  speciesForm.specie = null
  csvUploaded.value = false
  mapPaths.value = []
  mapMarkers.value = []
  getAreas()
}

function showCreateForm() {
  editMode.value = false
  resetForm()
  showHuntingAreaList.value = false
}

async function viewAreaDetails(rowData: any) {
  showHuntingAreaList.value = false
  showAreaSpecies.value = false
  showAreaDetails.value = true
  showAddSpecies.value = false
  loadingAreaDetails.value = true
  mapPaths.value = []
  mapMarkers.value = []
  speciesForm.specie = null
  csvUploaded.value = false

  try {
    const response = await huntingAreaStore.getHuntingAreaByIdDirect(rowData.id)
    if (response.status === 200 && response.data?.success) {
      areaDetails.value = response.data.data
      selectedArea.value = {
        id: response.data.data.id,
        location_name: response.data.data.location?.name,
        location_code: response.data.data.location?.code,
        location_id: response.data.data.location_id,
        description: response.data.data.description,
      }
      processCoordinatesForMap(response.data.data.coordinates || [])
      loadAreaSpecies(response.data.data.id)
    } else {
      toast.init({ message: 'Failed to load area details', color: 'danger' })
      goBackToList()
    }
  } catch (error: any) {
    toast.init({
      message: error?.response?.data?.message || 'Failed to load area details',
      color: 'danger'
    })
    goBackToList()
  } finally {
    loadingAreaDetails.value = false
  }
}

function viewAreaSpeciesFromDetails() {
  if (areaDetails.value) {
    selectedArea.value = {
      id: areaDetails.value.id,
      location_name: areaDetails.value.location?.name,
      location_code: areaDetails.value.location?.code,
      location_id: areaDetails.value.location_id,
      description: areaDetails.value.description,
    }
    showAreaDetails.value = false
    showAreaSpecies.value = false
    showAddSpecies.value = true
    speciesForm.specie = null
    csvUploaded.value = false
    loadAreaSpecies(areaDetails.value.id)
  }
}

function viewAreaSpecies(rowData: any) {
  selectedArea.value = rowData
  showHuntingAreaList.value = false
  showAreaDetails.value = false
  showAddSpecies.value = false
  showAreaSpecies.value = true
  speciesForm.specie = null
  csvUploaded.value = false
  loadAreaSpecies(rowData.id)
}


function cancelEdit() {
  resetForm()
  toggleFormAndList()
}

function resetForm() {
  editMode.value = false
  areaForm.id = null
  areaForm.location_id = null
  areaForm.location_name = ''
  areaForm.location_code = ''
  areaForm.location_descriptions = ''
  areaForm.description = ''
  areaForm.coordinates_type = 'POINT'
  areaForm.coordinates = ''
  areaForm.coordinate_lat = null
  areaForm.coordinate_lng = null
  showAreaSpecies.value = false
  showAreaDetails.value = false
  showAddSpecies.value = false
}

/**
 * Process coordinates from API response and prepare for map display
 */
function processCoordinatesForMap(coordinates: any[]) {
  mapPaths.value = []
  mapMarkers.value = []

  if (!coordinates || coordinates.length === 0) return

  coordinates.forEach((coord: any) => {
    try {
      const coordJson = typeof coord.coordinates === 'string'
        ? JSON.parse(coord.coordinates)
        : coord.coordinates

      const coordType = coord.coordinates_type || coordJson.type?.toUpperCase()

      if (coordType === 'POINT' || coordJson.type === 'Point') {
        const [lng, lat] = coordJson.coordinates || []
        if (lat && lng) {
          mapMarkers.value.push({
            position: { lat, lng },
            title: areaDetails.value?.location?.name || 'Hunting Area'
          })
          // Update map center to first point
          if (mapMarkers.value.length === 1) {
            mapCenter.value = { lat, lng }
            mapZoom.value = 15
          }
        }
      } else if (coordType === 'POLYGON' || coordJson.type === 'Polygon') {
        const polygonCoords = coordJson.coordinates?.[0] || []
        const paths = polygonCoords.map(([lng, lat]: number[]) => ({ lat, lng }))

        if (paths.length > 0) {
          mapPaths.value.push({
            type: 'POLYGON',
            paths: paths
          })
          // Set map center to polygon centroid
          const center = calculateCentroid(paths)
          mapCenter.value = center
          mapZoom.value = 12
        }
      } else if (coordType === 'LINESTRING' || coordJson.type === 'LineString') {
        const lineCoords = coordJson.coordinates || []
        const paths = lineCoords.map(([lng, lat]: number[]) => ({ lat, lng }))

        if (paths.length > 0) {
          mapPaths.value.push({
            type: 'LINESTRING',
            paths: paths
          })
          // Set map center to first point
          if (paths.length > 0) {
            mapCenter.value = paths[0]
            mapZoom.value = 12
          }
        }
      }
    } catch (error) {
      console.error('Error processing coordinate:', error)
    }
  })

  // Initialize or refresh the Leaflet map now that we have coordinates
  if (mapPaths.value.length > 0 || mapMarkers.value.length > 0) {
    initLeafletMap()
  }
}

/**
 * Calculate centroid of a polygon for map centering
 */
function calculateCentroid(paths: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (paths.length === 0) return { lat: -2.5, lng: 34.5 }

  let sumLat = 0
  let sumLng = 0

  paths.forEach(point => {
    sumLat += point.lat
    sumLng += point.lng
  })

  return {
    lat: sumLat / paths.length,
    lng: sumLng / paths.length
  }
}

/**
 * Leaflet map integration (OSM tiles) and rendering functions.
 * Uses ORS API key for potential future ORS services (geocoding/routing).
 */
let leafletMap: any = null
let leafletLayers: any = null

function initLeafletMap() {
  nextTick(() => {
    try {
      const el = document.getElementById('leaflet-map')
      if (!el) return
      if (!leafletMap) {
        leafletMap = L.map(el).setView([mapCenter.value.lat, mapCenter.value.lng], mapZoom.value)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletMap)
        leafletLayers = L.layerGroup().addTo(leafletMap)
      } else {
        leafletMap.setView([mapCenter.value.lat, mapCenter.value.lng], mapZoom.value)
      }
      renderMapFeatures()
    } catch (e) {
      console.error('Error initializing Leaflet map', e)
    }
  })
}

function clearMapLayers() {
  if (leafletLayers) leafletLayers.clearLayers()
}

function renderMapFeatures() {
  if (!leafletMap || !leafletLayers) return
  clearMapLayers()
  // Add markers
  mapMarkers.value.forEach((m: any) => {
    const marker = L.marker([m.position.lat, m.position.lng])
    if (m.title) marker.bindPopup(m.title)
    marker.addTo(leafletLayers)
  })
  // Add polygons
  mapPaths.value.filter(p => p.type === 'POLYGON').forEach((p: any) => {
    const latlngs = p.paths.map((pt: any) => [pt.lat, pt.lng])
    L.polygon(latlngs, { color: '#FF0000', weight: 2, fillOpacity: 0.35 }).addTo(leafletLayers)
  })
  // Add polylines
  mapPaths.value.filter(p => p.type === 'LINESTRING').forEach((p: any) => {
    const latlngs = p.paths.map((pt: any) => [pt.lat, pt.lng])
    L.polyline(latlngs, { color: '#0000FF', weight: 3 }).addTo(leafletLayers)
  })
  // Fit map to data
  const bounds = leafletLayers.getBounds && leafletLayers.getBounds()
  if (bounds && bounds.isValid && bounds.isValid()) {
    leafletMap.fitBounds(bounds, { padding: [20, 20] })
  }
}

onMounted(() => {
  // initialize map when details view mounts (map container may not exist if details not shown)
  initLeafletMap()
})

watch([mapMarkers, mapPaths, mapCenter, mapZoom], () => {
  if (leafletMap) {
    if (mapCenter.value) leafletMap.setView([mapCenter.value.lat, mapCenter.value.lng], mapZoom.value)
    renderMapFeatures()
  }
}, { deep: true })

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  } catch {
    return dateString
  }
}

/**
 * Get ORS API key from environment or fallback to provided key
 */
const orsApiKey = computed(() => {
  return import.meta.env.VITE_ORS_API_KEY || '5b3ce3597851110001cf624801d00ef10c384be085627c68b77efe53'
})

function onAreaSubmit() {
  if (!isAreaFormValid.value) {
    if (editMode.value) {
      toast.init({ message: 'Please select a location.', color: 'warning' })
    } else {
      toast.init({ message: 'Please fill in location name, code, and coordinates.', color: 'warning' })
    }
    return
  }
  if (editMode.value) {
    updateExistingHuntingArea()
  } else {
    createNewLocationWithHuntingArea()
  }
}

async function confirmDelete(rowData: any) {
  const locationName = rowData.location_name || rowData.location?.name || 'this hunting area'
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete the hunting area from "${locationName}"? This action cannot be undone!`,
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
    const locationId = rowData.location_id || rowData.location?.id
    if (!locationId) {
      throw new Error('Location ID is required')
    }
    const response = await huntingAreaStore.deleteHuntingArea(locationId, rowData.id)
    if (response.status === 204 || response.status === 200) {
      toast.init({
        message: 'Hunting Area deleted successfully',
        color: 'success',
      })
      getAreas()
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message
    toast.init({
      message: errorMessage || 'Failed to delete hunting area',
      color: 'danger',
    })
  } finally {
    deleting.value = false
  }
}

async function updateExistingHuntingArea() {
  if (!areaForm.location_id) {
    toast.init({ message: 'Please select a location', color: 'warning' })
    return
  }
  saving.value = true
  const requestData = {
    description: (areaForm.description || '').trim(),
  }
  try {
    const response = await huntingAreaStore.updateHuntingArea(areaForm.location_id, areaForm.id!, requestData)
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

/**
 * Format coordinates based on type
 */
function formatCoordinates(): string {
  if (areaForm.coordinates_type === 'POINT') {
    if (areaForm.coordinate_lat === null || areaForm.coordinate_lng === null) {
      throw new Error('Latitude and Longitude are required for POINT coordinates')
    }
    const point = {
      type: 'Point',
      coordinates: [parseFloat(areaForm.coordinate_lng as any), parseFloat(areaForm.coordinate_lat as any)]
    }
    return JSON.stringify(point)
  } else {
    // For POLYGON and LINESTRING, user should provide JSON string
    if (!areaForm.coordinates || areaForm.coordinates.trim().length === 0) {
      throw new Error('Coordinates JSON is required for ' + areaForm.coordinates_type)
    }
    // Validate it's valid JSON
    try {
      const parsed = JSON.parse(areaForm.coordinates)
      return areaForm.coordinates
    } catch (e) {
      throw new Error('Invalid JSON format for coordinates')
    }
  }
}

async function createNewLocationWithHuntingArea() {
  saving.value = true
  try {
    // Format coordinates
    const coordinatesJson = formatCoordinates()

    const requestData = {
      name: (areaForm.location_name || '').trim(),
      code: (areaForm.location_code || '').trim(),
      descriptions: (areaForm.location_descriptions || '').trim(),
      is_disabled: false,
      hunting_areas: [
        {
          description: (areaForm.description || '').trim(),
        }
      ],
      geo_locations: [
        {
          coordinates_type: areaForm.coordinates_type,
          coordinates: coordinatesJson,
        }
      ]
    }

    const response = await huntingAreaStore.createLocationWithHuntingArea(requestData)
    if (response.status === 201 || response.status === 200) {
      saving.value = false
      toast.init({
        message: 'Location and Hunting Area created successfully',
        color: 'success',
      })
      resetForm()
      toggleFormAndList()
      getAreas()
    }
  } catch (error: any) {
    saving.value = false
    const errorMessage = error?.message || 'Failed to create location and hunting area'
    const errors = handleErrors(error)
    toast.init({
      message: errorMessage + (errors.length > 0 ? '\n' + errors.map((err, index) => `${index + 1}. ${err}`).join('\n') : ''),
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
    selectedSpeciesIds.value = []
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

  const existingIds = new Set(areaSpecies.value.map((s: any) => String(s.specie_id)))
  const toAdd: string[] = []

  for (const row of rows) {
    const idStr = String((row as any).specie_id || '').trim()
    if (!idStr) continue
    if (existingIds.has(idStr)) continue
    if (toAdd.includes(idStr)) continue
    toAdd.push(idStr)
  }

  if (toAdd.length === 0) {
    toast.init({ message: 'No new species to import', color: 'info' })
    return
  }

  csvImporting.value = true
  csvImportTotal.value = toAdd.length
  csvImportDone.value = 0
  try {
    const importErrors: string[] = []
    for (const specieId of toAdd) {
      try {
        await huntingAreaStore.addHuntingAreaSpecies({ hunting_area_id: selectedArea.value.id, specie_id: specieId })
      } catch (error: any) {
        const errors = handleErrors(error)
        if (errors.length > 0) {
          importErrors.push(...errors)
        }
      } finally {
        csvImportDone.value += 1
      }
    }
    csvUploaded.value = true
    if (importErrors.length > 0) {
      await Swal.fire({
        title: 'Completed with errors',
        html: importErrors.map((err) => `<div>${err}</div>`).join('') || 'Some species could not be imported.',
        icon: 'warning',
        confirmButtonText: 'OK',
      })
    } else {
      await Swal.fire({
        title: 'Imported',
        text: `Imported ${toAdd.length} species.`,
        icon: 'success',
        confirmButtonText: 'OK',
      })
    }
    loadAreaSpecies(selectedArea.value.id)
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to import species', color: 'danger' })
  } finally {
    csvImporting.value = false
    csvImportTotal.value = 0
    csvImportDone.value = 0
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
    await Swal.fire({
      title: 'Added',
      text: 'Species added to hunting area.',
      icon: 'success',
      confirmButtonText: 'OK',
    })
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
  if (!selectedArea.value || !record?.specie_id) return

  const result = await Swal.fire({
    title: 'Remove species?',
    html: `Remove <strong>${record.specie_name || 'this species'}</strong> from this area?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remove',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    customClass: {
      confirmButton: 'btn btn-danger me-2',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
    padding: '2em',
  })

  if (!result.isConfirmed) return

  deleting.value = true
  try {
    await huntingAreaStore.deleteHuntingAreaSpecies(
      selectedArea.value.id,
      selectedArea.value.id,
      record.specie_id
    )
    await Swal.fire({
      title: 'Deleted',
      text: 'Species removed from hunting area.',
      icon: 'success',
      confirmButtonText: 'OK',
    })
    loadAreaSpecies(selectedArea.value.id)
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to remove species', color: 'danger' })
  } finally {
    deleting.value = false
  }
}

async function bulkDeleteSpecies() {
  if (!selectedArea.value || selectedSpeciesIds.value.length === 0) return

  const result = await Swal.fire({
    title: 'Delete selected species?',
    html: `Remove <strong>${selectedSpeciesIds.value.length}</strong> species from this area?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    customClass: {
      confirmButton: 'btn btn-danger me-2',
      cancelButton: 'btn btn-secondary',
    },
    buttonsStyling: false,
    padding: '2em',
  })

  if (!result.isConfirmed) return

  deleting.value = true
  try {
    for (const specieId of selectedSpeciesIds.value) {
      await huntingAreaStore.deleteHuntingAreaSpecies(
        selectedArea.value.id,
        selectedArea.value.id,
        specieId
      )
    }
    await Swal.fire({
      title: 'Deleted',
      text: 'Selected species removed from hunting area.',
      icon: 'success',
      confirmButtonText: 'OK',
    })
    loadAreaSpecies(selectedArea.value.id)
  } catch (error: any) {
    const errors = handleErrors(error)
    toast.init({ message: errors.join('\n') || 'Failed to remove selected species', color: 'danger' })
  } finally {
    deleting.value = false
  }
}
async function getAreas() {
  try {
    loading.value = true
    const response = await huntingAreaStore.getAllHuntingAreas()

    if (response.status === 200) {
      // Response data is already an array of hunting areas with nested location
      const huntingAreas = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : []

      // Map the data to include location info and load species count
      const areasWithSpecies = await Promise.all(
        huntingAreas.map(async (area: any) => {
          // Extract location info from nested location object
          const location = area.location || {}
          const locationName = location.name || 'N/A'
          const locationCode = location.code || 'N/A'

          // Load species count for each hunting area
          let speciesCount = 0
          try {
            const speciesResponse = await huntingAreaStore.listHuntingAreaSpecies(area.id)
            const speciesList = Array.isArray(speciesResponse.data?.data)
              ? speciesResponse.data.data
              : Array.isArray(speciesResponse.data)
                ? speciesResponse.data
                : []
            speciesCount = speciesList.length
          } catch (error) {
            // If species loading fails, just set to 0
            speciesCount = 0
          }

          return {
            ...area,
            name: locationName,
            code: locationCode,
            location_id: area.location_id || location.id,
            location_name: locationName,
            location_code: locationCode,
            location: location, // Keep nested location object for compatibility
            species_count: speciesCount,
          }
        })
      )

      items.value = areasWithSpecies
      loading.value = false
    } else {
      loading.value = false
      items.value = []
      toast.init({
        message: 'No hunting areas found',
        color: 'info',
      })
    }
  } catch (error: any) {
    loading.value = false
    items.value = []
    toast.init({
      message: error?.response?.data?.message || 'Failed to load hunting areas',
      color: 'danger',
    })
  }
}

async function getLocations() {
  try {
    const response = await huntingAreaStore.getLocations()
    const locations = response.data?.data || response.data || []
    locationOptions.value = locations.map((loc: any) => ({
      value: loc.id,
      text: `${loc.name} (${loc.code})`,
      name: loc.name,
      code: loc.code,
    }))
  } catch (error) {
    toast.init({
      message: 'Failed to load locations',
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
  getLocations()
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
