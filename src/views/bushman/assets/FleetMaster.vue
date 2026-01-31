<template>
  <div class="fleet-master-page">
    <!-- Breadcrumb -->
    <div class="d-sm-flex align-items-center mb-3">
      <div>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/bushman/dashboard">Home</router-link></li>
          <li class="breadcrumb-item"><a href="#">Assets</a></li>
          <li class="breadcrumb-item active">Fleet Master</li>
        </ol>
        <h1 class="page-header mb-0">Vehicle Fleet Management</h1>
      </div>
    </div>

    <!-- VEHICLE LIST VIEW -->
    <template v-if="showVehicleList">
      <div class="fleet-master-list">
        <div class="row layout-top-spacing bg-white rounded">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable :columns="vehicleColumns" :data="vehicles" :loading="loadingVehicles" :disable-search="false"
                :disable-pagination="false" :action-buttons="pageActions">
                <template #registration="slotProps">
                  <span class="badge bg-warning text-dark">
                    <i class="fa fa-car me-1"></i>{{ (slotProps.row as any)?.registration_number || '-' }}
                  </span>
                </template>
                <template #make="slotProps">
                  {{ (slotProps.row as any)?.make || (slotProps.row as any).motor_vehicle?.vehicle_model?.make || '-' }}
                </template>
                <template #model="slotProps">
                  {{ (slotProps.row as any)?.model || (slotProps.row as any).motor_vehicle?.vehicle_model?.model || '-' }}
                </template>
                <template #manufacture_year="slotProps">
                  {{ (slotProps.row as any)?.manufacture_year || '-' }}
                </template>
                <template #registration_date="slotProps">
                  {{ formatLongDate((slotProps.row as any)?.registration_date) || '-' }}
                </template>
                <template #chassis="slotProps">
                  <small class="text-muted">{{ (slotProps.row as any)?.chassis_number || '-' }}</small>
                </template>
                <template #actions="slotProps">
                  <div class="d-flex gap-1">
                    <button class="btn btn-outline-primary btn-sm" title="View Details" @click="openVehicleDetails(slotProps.row)">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-primary btn-sm" title="Edit" @click="openEditVehicleForm(slotProps.row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDeleteVehicle(slotProps.row)">
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
    </template>

    <!-- VEHICLE DETAILS VIEW (READ-ONLY, FULL PAGE) -->
    <template v-else-if="showVehicleDetailsPage">
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-0"><i class="fa fa-car me-2"></i>Vehicle Details</h5>
            <small class="text-muted">{{ vehicleDetails?.registration_number || vehicleDetails?.name || '-' }}</small>
          </div>
          <button type="button" class="btn btn-outline-secondary" @click="backToVehicleList">
            <i class="fa fa-arrow-left me-2"></i>Back to List
          </button>
        </div>
        <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
          <div v-if="!vehicleDetails" class="alert alert-info">
            <i class="fa fa-spinner fa-spin me-2"></i>Loading vehicle details...
          </div>
          <template v-else>
            <!-- BASIC INFORMATION -->
            <div class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Basic Information</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Registration Number</label>
                  <div class="fw-semibold">{{ vehicleDetails.registration_number || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Make</label>
                  <div class="fw-semibold">{{ vehicleDetails.make || vehicleDetails.motor_vehicle?.vehicle_model?.make || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Model</label>
                  <div class="fw-semibold">{{ vehicleDetails.model || vehicleDetails.motor_vehicle?.vehicle_model?.model || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Manufacture Year</label>
                  <div class="fw-semibold">{{ vehicleDetails.manufacture_year || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Chassis Number</label>
                  <div class="fw-semibold">{{ vehicleDetails.chassis_number || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Engine Number</label>
                  <div class="fw-semibold">{{ vehicleDetails.engine_number || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Color</label>
                  <div class="fw-semibold">{{ vehicleDetails.color || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Fuel Type</label>
                  <div class="fw-semibold">{{ vehicleDetails.fuel_used?.name || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Registration Date</label>
                  <div class="fw-semibold">{{ formatLongDate(vehicleDetails.acquisition_date) || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- TECHNICAL SPECIFICATIONS -->
            <div class="border-bottom pb-3 mb-4">
              <h6 class="text-primary mb-3"><i class="fa fa-cog me-2"></i>Technical Specifications</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Engine Capacity (cc)</label>
                  <div class="fw-semibold">{{ vehicleDetails.engine_capacity_cc || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Tank Capacity (liters)</label>
                  <div class="fw-semibold">{{ vehicleDetails.tank_capacity_liters || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Gross Weight (kg)</label>
                  <div class="fw-semibold">{{ vehicleDetails.gross_weight || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Tare Weight (kg)</label>
                  <div class="fw-semibold">{{ vehicleDetails.tare_weight || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Axle Count</label>
                  <div class="fw-semibold">{{ vehicleDetails.axle_count || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- DESCRIPTION -->
            <div v-if="vehicleDetails.description" class="pb-3 mb-4">
              <label class="form-label text-muted">Description</label>
              <div class="border p-3 rounded bg-light">{{ vehicleDetails.description }}</div>
            </div>

            <!-- DOCUMENTS SECTION -->
            <div>
              <h6 class="text-primary mb-3"><i class="fa fa-file me-2"></i>Documents</h6>
              <div class="mb-3">
                <input type="file" class="form-control form-control-sm" @change="onVehicleFileChange" />
                <div class="mt-2 d-flex gap-2">
                  <button class="btn btn-primary btn-sm" @click="uploadVehicleDocument" :disabled="uploading">
                    <span v-if="uploading" class="spinner-border spinner-border-sm me-1"></span>Upload
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" @click="vehicleDetails?.id && refreshVehicleDocuments(vehicleDetails.id)">Refresh</button>
                </div>
              </div>
              <div v-if="vehicleDocuments.length">
                <ul class="list-group">
                  <li class="list-group-item d-flex justify-content-between align-items-center" v-for="doc in vehicleDocuments" :key="doc.id">
                    <div class="d-flex align-items-center gap-3">
                      <div v-if="(doc.mime_type || '').toString().toLowerCase().startsWith('image')" class="thumbnail">
                        <img v-if="previewMap[doc.id]" :src="previewMap[doc.id]" class="img-thumbnail small-thumb" @click="openImagePreview(doc)" style="cursor:pointer" />
                        <div v-else class="small text-muted">Loading...</div>
                      </div>
                      <div>
                        <div class="fw-semibold">{{ doc.name || doc.title || doc.code || ('Doc #' + doc.id) }}</div>
                        <div class="small text-muted">{{ doc.mime_type || doc.file_type || '' }}</div>
                      </div>
                    </div>
                    <div class="btn-group">
                      <button class="btn btn-outline-primary btn-sm" @click="downloadVehicleDocument(doc)"><i class="fa fa-download"></i></button>
                    </div>
                  </li>
                </ul>
              </div>
              <div v-else class="text-muted small">No documents uploaded for this vehicle.</div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- VEHICLE FORM VIEW -->
    <template v-else>
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="mb-0">{{ editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle' }}</h5>
          <small class="text-muted">{{ editingVehicleId ? 'Editing vehicle details' : 'Register a new vehicle' }}</small>
        </div>
        <div class="card-body">
          <div v-if="vehicleFormError" class="alert alert-danger">{{ vehicleFormError }}</div>
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">Vehicle Model <span class="text-danger">*</span></label>
              <select v-model="vehicleForm.vehicle_model_id" class="form-select" required>
                <option value="">-- Select Model --</option>
                <option v-for="m in vehicleModels" :key="m.id" :value="m.id">{{ m.full_name || [m.make, m.model, m.variant].filter(Boolean).join(' ') }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Registration Number</label>
              <input v-model="vehicleForm.registration_number" type="text" class="form-control" placeholder="KAA 100A" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Chassis Number</label>
              <input v-model="vehicleForm.chassis_number" type="text" class="form-control" placeholder="VIN123" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Manufacture Year</label>
              <input v-model.number="vehicleForm.manufacture_year" type="number" class="form-control" min="1900" :max="new Date().getFullYear()+1" />
            </div>

            <div class="col-md-3">
              <label class="form-label">Color</label>
              <input v-model="vehicleForm.color" type="text" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Fuel Type</label>
              <select v-model="vehicleForm.fuel_used_id" class="form-select">
                <option :value="null">-- Select Fuel --</option>
                <option v-for="fuel in fuelItems" :key="fuel.id" :value="fuel.id">{{ fuel.name }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Registration Date</label>
              <input v-model="vehicleForm.acquisition_date" type="date" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Engine Number</label>
              <input v-model="vehicleForm.engine_number" type="text" class="form-control" placeholder="ENG789012" />
            </div>

            <div class="col-12">
              <h6 class="border-bottom pb-2 mb-3">
                <i class="fa fa-cog me-2"></i>Technical Specifications
              </h6>
            </div>

            <div class="col-md-4">
              <label class="form-label">Engine Capacity (cc)</label>
              <input v-model.number="vehicleForm.engine_capacity_cc" type="number" class="form-control" placeholder="4500" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Tank Capacity (liters)</label>
              <input v-model.number="vehicleForm.tank_capacity_liters" type="number" class="form-control" placeholder="138" />
            </div>

            <div class="col-md-4"></div>

            <div class="col-md-4">
              <label class="form-label">Gross Weight (kg)</label>
              <input v-model.number="vehicleForm.gross_weight" type="number" class="form-control" placeholder="3500" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Tare Weight (kg)</label>
              <input v-model.number="vehicleForm.tare_weight" type="number" class="form-control" placeholder="2400" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Axle Count</label>
              <input v-model.number="vehicleForm.axle_count" type="number" class="form-control" min="1" />
            </div>

            <div class="col-12">
              <label class="form-label">Description</label>
              <textarea v-model="vehicleForm.description" rows="3" class="form-control" placeholder="Add vehicle description or notes"></textarea>
            </div>

            <div class="col-12">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="vehicleForm.is_active" id="vf_active" />
                <label class="form-check-label" for="vf_active">Active</label>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeVehicleForm">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" @click="saveVehicle" :disabled="savingVehicle">
              <span v-if="savingVehicle" class="spinner-border spinner-border-sm me-1"></span>
              {{ editingVehicleId ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Vehicle Details Modal removed: now handled by full-page details view -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import vehicleAssetService, { type VehicleAsset } from '@/services/vehicleAssetService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useDocumentsStore } from '@/stores/bushman/documents-store' 
const toast = useToast()
const swal = useSwal()

// State
const showVehicleList = ref(true)
const showVehicleDetailsPage = ref(false)
const loadingVehicles = ref(false)
const vehicles = ref<VehicleAsset[]>([])
const vehicleModels = ref<any[]>([])
const fuelItems = ref<any[]>([])
const summary = ref<any>({})

const vehicleFilters = ref({
  search: '',
  status: '',
  ownership: '',
  vehicle_model_id: ''
})

// Vehicle form state
const selectedVehicle = ref<VehicleAsset | null>(null)
const editingVehicleId = ref<number | null>(null)
const vehicleFormError = ref('')
const savingVehicle = ref(false)
const vehicleForm = ref<any>({
  code: '',
  status: 'ACTIVE',
  ownership: 'OWNED',
  vehicle_model_id: '',
  registration_number: '',
  chassis_number: '',
  engine_number: '',
  manufacture_year: null,
  color: '',
  fuel_used_id: null,
  engine_capacity_cc: null,
  tank_capacity_liters: null,
  axle_count: null,
  gross_weight: null,
  tare_weight: null,
  acquisition_date: '',
  available_for_use_date: '',
  acquisition_cost: 0,
  salvage_value: 0,
  description: '',
  is_active: true
})

// Vehicle Details modal + documents
const showVehicleDetailsModal = ref(false)
const vehicleDetails = ref<VehicleAsset | null>(null)
const vehicleDocuments = ref<any[]>([])
const uploading = ref(false)
const selectedVehicleFile = ref<File | null>(null)
const documentsStore = useDocumentsStore()

// Preview map for image thumbnails: { [docId]: objectUrl }
const previewMap = ref<Record<number | string, string>>({})

// Client-side file validation settings
const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf']
const maxFileSizeBytes = 10 * 1024 * 1024 // 10 MB
const sanitizedFileName = ref<string | null>(null)

async function loadPreview(doc: any) {
  if (!doc?.id) return
  if (previewMap.value[doc.id]) return
  const mime = (doc.mime_type || '').toString().toLowerCase()
  if (!mime.startsWith('image')) return
  try {
    const response = await documentsStore.downloadDocument(doc.id)
    const blob = new Blob([response.data], { type: response.headers['content-type'] || doc.mime_type })
    const url = window.URL.createObjectURL(blob)
    previewMap.value[doc.id] = url
  } catch (err) {
    console.warn('Failed to load preview for doc', doc.id)
  }
}
// Computed
const vehiclesCount = computed(() => vehicles.value.length)

const pageActions = computed(() => {
  const actions = []
  if (showVehicleList.value) {
    actions.push(
      {
        label: 'Refresh',
        icon: 'fa fa-sync',
        class: 'btn btn-outline-secondary',
        method: () => refreshVehicles(),
      },
      {
        label: 'Print PDF',
        icon: 'fa fa-file-pdf',
        class: 'btn btn-outline-secondary',
        method: () => openFleetMasterPdf(),
      },
      {
        label: 'Add Vehicle',
        icon: 'fa fa-plus',
        class: 'btn btn-primary',
        method: () => openAddVehicleForm(),
      }
    )
  }
  return actions
})

// Tables
const vehicleColumns = [
  { key: 'registration', label: 'Registration', sortable: true, visible: true },
  { key: 'make', label: 'Make', sortable: true, visible: true },
  { key: 'model', label: 'Model', sortable: true, visible: true },
  { key: 'manufacture_year', label: 'Year', sortable: true, visible: true },
  { key: 'registration_date', label: 'Registration Date', sortable: true, visible: true },
  { key: 'chassis', label: 'Chassis', sortable: false, visible: true },
  // Actions column to show View/Edit/Delete buttons
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
]



// Methods
let vehicleTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedFetchVehicles() {
  if (vehicleTimeout) clearTimeout(vehicleTimeout)
  vehicleTimeout = setTimeout(() => fetchVehicles(), 300)
}

function handleVehicleFiltersUpdate(newFilters: any) {
  vehicleFilters.value = { ...vehicleFilters.value, ...newFilters }
} 

async function fetchVehicles() {
  loadingVehicles.value = true
  try {
    const res = await vehicleAssetService.listVehicleAssetsDisplay(vehicleFilters.value)
    vehicles.value = res.data.data || res.data || []

    // Normalize vehicle entries to ensure an `id` field exists
    vehicles.value = vehicles.value.map((v: any) => {
      const resolvedId = v.id ?? v.asset_id ?? v.pk ?? v.motor_vehicle?.id ?? null
      if (!v.id && resolvedId) v.id = resolvedId
      return v
    })

    // Sort by manufacture_year from oldest to latest
    vehicles.value.sort((a: any, b: any) => {
      const yearA = a.manufacture_year || a.motor_vehicle?.manufacture_year || 9999
      const yearB = b.manufacture_year || b.motor_vehicle?.manufacture_year || 9999
      return yearA - yearB
    })

    console.log('🚗 Vehicles loaded:', vehicles.value.map((v: any) => ({ id: v.id, registration: v.registration_number || v.name, year: v.manufacture_year })))
  } catch (err) {
    toast.error('Failed to load vehicles')
  } finally {
    loadingVehicles.value = false
  }
}

async function fetchSummary() {
  try {
    const res = await vehicleAssetService.getFleetSummary()
    summary.value = res.data.data || res.data || {}
  } catch (err) {
    console.error('Failed to load summary')
  }
}

async function fetchMetadata() {
  try {
    const res = await vehicleAssetService.getMetadata()
    const data = res.data.data || res.data
    vehicleModels.value = data.vehicle_models || []
    
    // Get all fuel items and filter to only actual fuel types
    let allFuelItems = data.fuel_items || []
    console.log('📋 All items from API:', allFuelItems.map((f: any) => ({ id: f.id, name: f.name })))
    
    // Filter to only include actual fuel types - exclude non-fuel items
    fuelItems.value = allFuelItems.filter((item: any) => {
      const name = (item.name || '').toLowerCase()
      // Exclude non-fuel items
      const excludePatterns = ['charter', 'companion', 'hunter', 'cost', 'pricelist', 'filter', 'test', 'package', 'oil', 'service']
      return !excludePatterns.some(pattern => name.includes(pattern))
    })
    
    console.log('⛽ Filtered fuel items:', fuelItems.value.map((f: any) => f.name))
  } catch (err) {
    toast.error('Failed to load metadata')
  }
} 

function openAddVehicleForm() {
  editingVehicleId.value = null
  selectedVehicle.value = null
  resetVehicleForm()
  vehicleFormError.value = ''
  showVehicleList.value = false
}

function openEditVehicleForm(vehicle: VehicleAsset) {
  openVehicleForm(vehicle)
  showVehicleList.value = false
}

function openVehicleForm(vehicle?: VehicleAsset) {
  selectedVehicle.value = vehicle || null
  editingVehicleId.value = vehicle?.id ?? null

  if (vehicle) {
    // Populate form with existing values (try motor_vehicle nested values)
    const mv = (vehicle as any).motor_vehicle || {}
    vehicleForm.value = {
      code: vehicle.code || generateVehicleCode(),
      vehicle_model_id: mv.vehicle_model_id || mv.vehicle_model?.id || (vehicle as any).vehicle_model_id || '',
      registration_number: mv.registration_number || vehicle.registration_number || '',
      chassis_number: mv.chassis_number || vehicle.chassis_number || '',
      engine_number: mv.engine_number || (vehicle as any).engine_number || '',
      manufacture_year: mv.manufacture_year || vehicle.manufacture_year || null,
      color: mv.color || (vehicle as any).color || '',
      fuel_used_id: mv.fuel_used_id || null,
      engine_capacity_cc: mv.engine_capacity_cc || null,
      tank_capacity_liters: mv.tank_capacity_liters || null,
      axle_count: mv.axle_count || null,
      gross_weight: mv.gross_weight || null,
      tare_weight: mv.tare_weight || null,
      acquisition_date: vehicle.acquisition_date?.split('T')[0] || '',
      available_for_use_date: vehicle.available_for_use_date?.split('T')[0] || '',
      acquisition_cost: vehicle.acquisition_cost || 0,
      salvage_value: vehicle.salvage_value || 0,
      description: vehicle.description || '',
      is_active: vehicle.is_active !== false
    }
  } else {
    resetVehicleForm()
  }

  vehicleFormError.value = ''
}

function resetVehicleForm() {
  vehicleForm.value = {
    code: generateVehicleCode(),
    status: 'ACTIVE',
    ownership: 'OWNED',
    vehicle_model_id: '',
    registration_number: '',
    chassis_number: '',
    engine_number: '',
    manufacture_year: null,
    color: '',
    fuel_used_id: null,
    engine_capacity_cc: null,
    tank_capacity_liters: null,
    axle_count: null,
    gross_weight: null,
    tare_weight: null,
    acquisition_date: '',
    available_for_use_date: '',
    acquisition_cost: 0,
    salvage_value: 0,
    description: '',
    is_active: true
  }
}

function closeVehicleForm() {
  showVehicleList.value = true
  selectedVehicle.value = null
  editingVehicleId.value = null
  vehicleFormError.value = ''
  resetVehicleForm()
}

function generateVehicleCode() {
  return `VEH-${Date.now().toString().slice(-6)}`
}

async function saveVehicle() {
  vehicleFormError.value = ''
  if (!vehicleForm.value.vehicle_model_id) {
    vehicleFormError.value = 'Vehicle Model is required'
    return
  }
  savingVehicle.value = true
  try {
    if (editingVehicleId.value) {
      await vehicleAssetService.updateVehicleAsset(editingVehicleId.value, vehicleForm.value)
      toast.success('Vehicle updated successfully')
    } else {
      await vehicleAssetService.createVehicleAsset(vehicleForm.value)
      toast.success('Vehicle created successfully')
    }

    closeVehicleForm()
    await Promise.all([fetchVehicles(), fetchSummary(), fetchMetadata()])
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Failed to save vehicle'
    vehicleFormError.value = typeof message === 'string' ? message : 'Failed to save vehicle'
    toast.error(vehicleFormError.value)
  } finally {
    savingVehicle.value = false
  }
}

async function confirmDeleteVehicle(vehicle: VehicleAsset) {
  const confirmed = await swal.confirm({
    title: 'Delete Vehicle',
    text: `Are you sure you want to delete "${vehicle.name}"? This action cannot be undone.`,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!confirmed) return

  try {
    await vehicleAssetService.deleteVehicleAsset(vehicle.id!)
    toast.success('Vehicle deleted successfully')
    await Promise.all([fetchVehicles(), fetchSummary()])
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to delete vehicle'
    toast.error(msg)
  }
}

async function openVehicleDetails(vehicle: VehicleAsset) {
  // Try common id locations
  let id: any = null
  if (vehicle) {
    id = (vehicle as any).id ?? (vehicle as any).asset_id ?? (vehicle as any).pk ?? (vehicle as any).motor_vehicle?.id ?? (vehicle as any).motor_vehicle?.asset_id ?? (vehicle as any).vehicle_id ?? null
  }
  if (!id && vehicle?.registration_number) {
    try {
      const res = await vehicleAssetService.findByRegistration(vehicle.registration_number)
      const found = res.data?.data || res.data
      id = (found as any)?.id ?? (found as any)?.asset_id ?? (found as any)?.pk ?? null
      console.log('🔍 Resolved vehicle id by registration:', id)
    } catch (err) {
      console.warn('Failed to resolve vehicle by registration', vehicle.registration_number)
    }
  }
  if (!id) {
    toast.error('Vehicle id missing; cannot load details')
    return
  }
  try {
    showVehicleList.value = false
    showVehicleDetailsPage.value = true
    // fetch the full asset details
    const res = await vehicleAssetService.getVehicleAsset(id)
    vehicleDetails.value = res.data?.data || res.data || vehicle
    await refreshVehicleDocuments(id)
  } catch (err) {
    toast.error('Failed to load vehicle details')
    showVehicleList.value = true
    showVehicleDetailsPage.value = false
  }
}

function backToVehicleList() {
  showVehicleList.value = true
  showVehicleDetailsPage.value = false
  vehicleDetails.value = null
  vehicleDocuments.value = []
  selectedVehicleFile.value = null
  sanitizedFileName.value = null
}

async function refreshVehicleDocuments(vehicleId: number) {
  try {
    // We link documents to vehicle by using code = vehicle-{id}
    const res = await documentsStore.listDocuments({ code: `vehicle-${vehicleId}` })
    const list = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.results || []

    // Filter client-side to ensure we only show docs for this vehicle (backend may ignore code param)
    const expectedCode = `vehicle-${vehicleId}`
    const filtered = (list || []).filter((d: any) => {
      // Match by explicit code
      if ((d.code || '').toString() === expectedCode) return true
      // Or by vehicle_id field if present
      if (d.vehicle_id && parseInt(d.vehicle_id) === vehicleId) return true
      // Some backends may put id in nested metadata
      if (d.meta && d.meta.vehicle_id && parseInt(d.meta.vehicle_id) === vehicleId) return true
      return false
    })

    // If filtered is empty, don't show unrelated documents. Backend may not support filtering by code.
    if (!filtered.length) {
      console.warn('No docs matched by code or vehicle_id; document list will be empty for this vehicle. Backend may not filter by code/vehicle_id')
      vehicleDocuments.value = []
    } else {
      vehicleDocuments.value = filtered
    }

    // Load previews for image docs asynchronously (fire-and-forget)
    ;(vehicleDocuments.value || []).forEach((doc: any) => {
      const mime = (doc.mime_type || '').toString().toLowerCase()
      if (mime.startsWith('image')) loadPreview(doc)
    })

    console.log('🎯 Documents for', expectedCode, '=>', vehicleDocuments.value.map((d:any) => ({ id: d.id, name: d.name, code: d.code })))
  } catch (err) {
    toast.error('Failed to load vehicle documents')
    vehicleDocuments.value = []
  }
}

// Backwards-compatible alias for older calls
async function loadVehicleDocuments(vehicleId: number) {
  console.warn('Deprecated: loadVehicleDocuments called. Use refreshVehicleDocuments instead.')
  return refreshVehicleDocuments(vehicleId)
}

function sanitizeFilename(name: string) {
  if (!name) return name
  // Normalize and strip control characters, limit length
  const normalized = name.normalize ? name.normalize('NFC') : name
  // Remove non-printable/control characters except common punctuation
  const cleaned = normalized.replace(/[\x00-\x1F\x7F]/g, '')
  // Truncate to 100 chars
  return cleaned.length > 100 ? cleaned.slice(0, 100) : cleaned
}

function onVehicleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0] || null

  if (!file) {
    selectedVehicleFile.value = null
    sanitizedFileName.value = null
    return
  }

  // Validate file type
  if (!allowedFileTypes.includes(file.type)) {
    toast.error('Unsupported file type. Allowed: jpeg, png, pdf')
    input.value = ''
    selectedVehicleFile.value = null
    sanitizedFileName.value = null
    return
  }

  // Validate size
  if (file.size > maxFileSizeBytes) {
    toast.error('File too large. Maximum allowed is 10 MB')
    input.value = ''
    selectedVehicleFile.value = null
    sanitizedFileName.value = null
    return
  }

  selectedVehicleFile.value = file
  sanitizedFileName.value = sanitizeFilename(file.name)
}

async function uploadVehicleDocument() {
  if (!vehicleDetails.value?.id || !selectedVehicleFile.value) {
    toast.error('Select a file first')
    return
  }
  uploading.value = true
  try {
    // Use sanitized filename if available, otherwise fall back
    const name = sanitizedFileName.value || `${vehicleDetails.value.registration_number || vehicleDetails.value.name}`

    // Build form data manually so we can inspect it in console for debugging
    const formData = new FormData()
    formData.append('name', name)
    formData.append('code', `vehicle-${vehicleDetails.value.id}`)
    formData.append('file', selectedVehicleFile.value as File)

    // Debug: log file details (not file content)
    console.debug('Uploading file', { name, code: `vehicle-${vehicleDetails.value.id}`, fileName: selectedVehicleFile.value.name, size: selectedVehicleFile.value.size, type: selectedVehicleFile.value.type })

    const resp = await documentsStore.createDocument({ name, code: `vehicle-${vehicleDetails.value.id}`, file: selectedVehicleFile.value })

    if (resp.status === 201 || resp.status === 200) {
      toast.success('File uploaded')
      selectedVehicleFile.value = null
      sanitizedFileName.value = null
      // Auto-refresh list and previews - use safe fallback if function is missing (HMR or binding issues)
      if (typeof (refreshVehicleDocuments as any) === 'function') {
        await refreshVehicleDocuments(vehicleDetails.value!.id!)
      } else {
        console.warn('refreshVehicleDocuments not available, falling back to inline fetch')
        try {
          const r = await documentsStore.listDocuments({ code: `vehicle-${vehicleDetails.value!.id}` })
          const list = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : r.data?.results || []
          vehicleDocuments.value = list.filter((d:any) => (d.code || '').toString() === `vehicle-${vehicleDetails.value!.id}`)
        } catch (e) {
          console.error('Fallback fetch failed', e)
        }
      }

      (vehicleDocuments.value || []).forEach((doc: any) => {
        const mime = (doc.mime_type || '').toString().toLowerCase()
        if (mime.startsWith('image')) loadPreview(doc)
      })
    } else {
      const message = resp.data?.message || 'Upload failed'
      toast.error(message)
    }
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message || err?.response?.data || err.message || 'Upload failed'
    console.error('Upload error:', err)
    toast.error(typeof serverMsg === 'string' ? serverMsg : 'Upload failed (see console)')
  } finally {
    uploading.value = false
  }
}

async function downloadVehicleDocument(doc: any) {
  try {
    const response = await documentsStore.downloadDocument(doc.id)
    const blob = new Blob([response.data], { type: doc.mime_type || response.headers['content-type'] })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.name || `document-${doc.id}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    toast.error('Failed to download file')
  }
}

function closeVehicleDetails() {
  // Revoke previews
  Object.keys(previewMap.value).forEach((k) => {
    try { window.URL.revokeObjectURL(previewMap.value[k]) } catch (e) {}
  })
  previewMap.value = {}
  // Revoke any full-size preview
  if (previewImageUrl.value) {
    try { window.URL.revokeObjectURL(previewImageUrl.value) } catch (e) {}
    previewImageUrl.value = null
  }

  showVehicleDetailsModal.value = false
  vehicleDetails.value = null
  vehicleDocuments.value = []
  selectedVehicleFile.value = null
  sanitizedFileName.value = null
}

// Image preview modal state
const showImagePreviewModal = ref(false)
const previewImageUrl = ref<string | null>(null)

async function openImagePreview(doc: any) {
  // If we already have a thumbnail, reuse it, otherwise download
  if (previewMap.value[doc.id]) {
    previewImageUrl.value = previewMap.value[doc.id]
    showImagePreviewModal.value = true
    return
  }

  try {
    const response = await documentsStore.downloadDocument(doc.id)
    const blob = new Blob([response.data], { type: response.headers['content-type'] || doc.mime_type })
    const url = window.URL.createObjectURL(blob)
    previewImageUrl.value = url
    showImagePreviewModal.value = true
  } catch (err) {
    toast.error('Failed to load image preview')
  }
}

function closeImagePreview() {
  if (previewImageUrl.value) {
    try { window.URL.revokeObjectURL(previewImageUrl.value) } catch (e) {}
    previewImageUrl.value = null
  }
  showImagePreviewModal.value = false
}



function openFleetMasterPdf() {
  window.open('/#/bushman/assets/fleet-master/print', '_blank')
}



function getStatusTextColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-success',
    IN_REPAIR: 'text-warning',
    DISPOSED: 'text-secondary',
    SOLD: 'text-info',
    LOST: 'text-danger',
    DRAFT: 'text-muted'
  }
  return map[status] || 'text-secondary'
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-success',
    IN_REPAIR: 'bg-warning',
    DISPOSED: 'bg-secondary',
    SOLD: 'bg-info',
    LOST: 'bg-danger',
    DRAFT: 'bg-light text-dark'
  }
  return map[status] || 'bg-secondary'
}

function getTypeBadge(type: string): string {
  const map: Record<string, string> = {
    CAR: 'bg-primary',
    TRUCK: 'bg-success',
    BUS: 'bg-info',
    MOTORBIKE: 'bg-warning text-dark',
    TRACTOR: 'bg-secondary',
    OTHER: 'bg-light text-dark'
  }
  return map[type] || 'bg-secondary'
}

function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    CAR: 'fa fa-car',
    TRUCK: 'fa fa-truck',
    BUS: 'fa fa-bus',
    MOTORBIKE: 'fa fa-motorcycle',
    TRACTOR: 'fa fa-tractor',
    OTHER: 'fa fa-circle'
  }
  return map[type] || 'fa fa-car'
}

function formatLongDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num || 0)
}

function clearVehicleFilters() {
  vehicleFilters.value = {
    search: '',
    status: '',
    ownership: '',
    vehicle_model_id: ''
  }
}

function refreshVehicles() {
  fetchVehicles()
  toast.success('Vehicles refreshed')
}

onMounted(async () => {
  await Promise.all([
    fetchVehicles(),
    fetchSummary(),
    fetchMetadata()
  ])

  // Expose refresh function for dev/debug and ensure HMR doesn't break references
  try { (window as any).refreshVehicleDocuments = refreshVehicleDocuments } catch (e) {}
})

defineExpose({ refreshVehicleDocuments })
</script>

<style scoped>
.page-header {
  font-size: 1.5rem;
  font-weight: 600;
}

.nav-tabs .nav-link {
  color: #6c757d;
  font-weight: 500;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  font-weight: 600;
}

code {
  background: rgba(0, 123, 255, 0.1);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
}

.small-thumb {
  width: 72px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.thumbnail {
  width: 72px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 6px;
  overflow: hidden;
}

/* Remove hover effects from list view */
.fleet-master-list :deep(table.table tbody tr:hover),
.fleet-master-list :deep(table tbody tr:hover) {
  background-color: transparent !important;
}

.fleet-master-list :deep(table.table tbody tr:hover td),
.fleet-master-list :deep(table tbody tr:hover td) {
  background-color: white !important;
}

.fleet-master-list :deep(table.table thead th.sortable:hover),
.fleet-master-list :deep(table thead th.sortable:hover) {
  background-color: transparent !important;
}

.fleet-master-list :deep(table.table tbody tr) {
  cursor: default !important;
}

.fleet-master-list :deep(table.table tbody tr td) {
  transition: none !important;
  background-color: inherit !important;
}

.fleet-master-list :deep(.badge) {
  cursor: default !important;
}

.fleet-master-list :deep(.badge:hover) {
  transform: none !important;
  opacity: 1 !important;
  background-color: inherit !important;
}

.fleet-master-list :deep(.btn-outline-primary:hover),
.fleet-master-list :deep(.btn-danger:hover),
.fleet-master-list :deep(.btn:hover) {
  transform: none !important;
  transition: none !important;
}

</style>
