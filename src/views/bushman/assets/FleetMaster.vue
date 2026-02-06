<template>
  <div class="fleet-master-page">


    <!-- Breadcrumb -->
     
    <!-- VEHICLE LIST VIEW -->
    <template v-if="showVehicleList">
      <div class="fleet-master-list">
        <div class="page-header-container mb-3 px-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <ul class="breadcrumb">
                <li class="breadcrumb-item"><router-link to="/bushman/assets">ASSETS</router-link></li>
                <li class="breadcrumb-item active">FLEET MASTER</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="row layout-top-spacing bg-white rounded">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="px-3 pt-3">
              <!-- Models tab removed: managed in Settings/Master Data -->
            </div>
            <div class="custom-table p-3">
              <StandardDataTable
                :columns="vehicleColumns"
                :data="vehicles"
                :loading="loadingVehicles"
                :disable-search="false"
                :disable-pagination="false"
                :action-buttons="pageActions"
                :custom-filters="[
                  { key: 'model', label: 'Model', type: 'text' },
                  { key: 'make', label: 'Make', type: 'text' }
                ]"
                :filters="vehicleFilters"
                @update:filters="handleVehicleFiltersUpdate"
                @toggle-select-all="toggleSelectAll"
                :selected-ids="Array.from(selectedRows)"
              >
                <template #select="slotProps">
                  <input type="checkbox" :checked="selectedRows.has((slotProps.row as any)?.id)" @change="toggleRowSelection(slotProps.row)" />
                </template>
                <template #registration="slotProps">
                  {{ (slotProps.row as any)?.registration_number || '-' }}
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
      <div class="vehicle-profile-shell">
        <div class="page-header-container mb-3 px-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <ul class="breadcrumb small mb-0">
                <li class="breadcrumb-item"><router-link to="/bushman/assets">ASSETS</router-link></li>
                <li class="breadcrumb-item"><router-link to="/bushman/assets/fleet-master">FLEET MASTER</router-link></li>
                <li class="breadcrumb-item active">{{ vehicleDetails?.registration_number || vehicleDetails?.name || selectedVehicleUuid }}</li>
              </ul>
            </div>
            <div>
              <button class="btn btn-light btn-sm" @click="backToVehicleList">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>
            </div>
          </div>
        </div>

        <VehicleProfile
          :vehicle-details="vehicleDetails"
          :vehicle-documents="vehicleDocuments"
          :uploading="uploading"
          :loading="loadingVehicles"
          :preview-map="previewMap"
          @back="backToVehicleList"
          @refresh="refreshVehicleDetails"
          @edit="vehicleDetails && openEditVehicleForm(vehicleDetails)"
          @add="openAddVehicleForm"
          @refresh-documents="refreshVehicleDocuments"
          @file-change="onVehicleFileChange"
          @upload-document="uploadVehicleDocument"
          @view-document="viewVehicleDocument"
          @download-document="downloadVehicleDocument"
          @open-image-preview="openImagePreview"
          @open-seat-map="openSeatMap"
          @open-documents="openDocuments"
        />
      </div>
    </template>

    <VehicleFormModal
      id="vehicleFormModal"
      ref="vehicleFormModalRef"
      :title="editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'"
      :subtitle="editingVehicleId ? 'Editing vehicle details' : 'Register a new vehicle'"
      :vehicle-form="vehicleForm"
      :vehicle-models="vehicleModels"
      :fuel-items="fuelItems"
      :vehicle-form-error="vehicleFormError"
      :saving-vehicle="savingVehicle"
      @save="saveVehicle"
      @cancel="closeVehicleForm"
      @close="handleVehicleFormClose"
      @hidden="handleVehicleFormHidden"
    />

    <!-- Vehicle Documents Modal -->
    <VehicleDocumentsModal
      v-if="showDocumentsModal || showDocumentsModalFallback"
      :visible="showDocumentsModal || showDocumentsModalFallback"
      :vehicle-id="vehicleDetails?.id ?? null"
      @close="closeDocuments"
      @uploaded="handleDocumentUploaded"
    />

    <!-- Document Viewer Modal -->
    <div v-if="showDocumentViewer" class="document-viewer-overlay" @click.self="closeDocumentViewer">
      <div class="document-viewer-container">
        <div class="document-viewer-header">
          <h5 class="mb-0 text-truncate">
            <i class="fa fa-file-alt me-2"></i>{{ documentViewerName }}
          </h5>
          <button class="btn btn-light btn-sm" @click="closeDocumentViewer">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <div class="document-viewer-body">
          <div v-if="documentViewerLoading" class="d-flex justify-content-center align-items-center h-100">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <template v-else-if="documentViewerUrl">
            <!-- PDF Viewer -->
            <iframe 
              v-if="documentViewerMimeType.includes('pdf')"
              :src="documentViewerUrl"
              class="document-iframe"
              frameborder="0"
            ></iframe>
            <!-- Image Viewer -->
            <img 
              v-else-if="documentViewerMimeType.startsWith('image')"
              :src="documentViewerUrl"
              class="document-image"
              alt="Document"
            />
            <!-- Other files - show message -->
            <div v-else class="d-flex flex-column justify-content-center align-items-center h-100 text-center p-4">
              <i class="fa fa-file-alt fa-4x text-muted mb-3"></i>
              <h6>Preview not available for this file type</h6>
              <p class="text-muted small mb-3">File type: {{ documentViewerMimeType || 'Unknown' }}</p>
              <a :href="documentViewerUrl" download class="btn btn-primary">
                <i class="fa fa-download me-1"></i> Download to View
              </a>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Vehicle Details Modal -->
    <VehicleDetailsModal
      v-if="showVehicleDetailsModal"
      :vehicle-uuid="selectedVehicleUuid"
      :vehicle-details="vehicleDetails"
      :vehicle-documents="vehicleDocuments"
      :uploading="uploading"
      :loading="loadingVehicles"
      :preview-map="previewMap"
      :visible="showVehicleDetailsModal"
      @close="closeVehicleDetailsModal"
      @refresh="refreshVehicleDetails"
      @refresh-documents="() => selectedVehicleUuid && refreshVehicleDocuments(selectedVehicleUuid)"
      @file-change="onVehicleFileChange"
      @upload-document="uploadVehicleDocument"
      @view-document="viewVehicleDocument"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import vehicleAssetService, { type VehicleAsset } from '@/services/vehicleAssetService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import VehicleProfile from '@/views/bushman/assets/VehicleProfile.vue'
import VehicleFormModal from '@/views/bushman/assets/VehicleFormModal.vue'
import VehicleDetailsModal from '@/components/VehicleDetailsModal.vue'
import VehicleDocumentsModal from '@/components/VehicleDocumentsModal.vue'
import { useRouter, useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/bushman/documents-store'
const toast = useToast()
const swal = useSwal()

// Safe wrappers to protect against cases where toast or swal rely on DOM nodes
// that may have been removed by dev-cleanup or not yet mounted (avoids uncaught TypeErrors)
function safeToast(type: 'error' | 'success' | 'info' | 'warning', message: any, options?: any) {
  try {
    ;(toast as any)[type](message, options)
  } catch (e) {
    console.warn('[FleetMaster] toast.' + type + ' failed', e)
  }
}

const safeSwal = {
  async confirm(opts: any) {
    try {
      return await swal.confirm(opts)
    } catch (e) {
      console.warn('[FleetMaster] swal.confirm failed', e)
      return false
    }
  }
}


// State
const showVehicleList = ref(true)
const showVehicleDetailsPage = ref(false)
const showVehicleDetailsModal = ref(false)
const selectedVehicleUuid = ref(null)
const loadingVehicles = ref(false)
const loadingDetails = ref(false) // true while loading a single vehicle's details

const router = useRouter()
const route = useRoute()
const vehicles = ref<VehicleAsset[]>([])
const vehicleModels = ref<any[]>([])
const fuelItems = ref<any[]>([])
const summary = ref<any>({})

// Router for navigation to seat map (router & route already defined above)

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
const vehicleFormModalRef = ref<{ show: () => void; hide: () => void } | null>(null)


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
const vehicleDetails = ref<VehicleAsset | null>(null)
const vehicleDocuments = ref<any[]>([])
const uploading = ref(false)
const selectedVehicleFile = ref<File | null>(null)
const documentsStore = useDocumentsStore()

// Preview map for image thumbnails: { [docId]: objectUrl }
const previewMap = ref<Record<number | string, string>>({})
const showDocumentsModal = ref(false)
// Fallback flag: in case a template-assigned expression accidentally mutates the ref to a primitive,
// we keep a secondary ref to reliably control modal visibility.
const showDocumentsModalFallback = ref(false)

import { watch } from 'vue'

watch([showDocumentsModal, showDocumentsModalFallback], (vals) => {
  console.debug('[FleetMaster] documents modal state changed', { showDocumentsModal: showDocumentsModal, showDocumentsModalFallback: showDocumentsModalFallback, values: vals })
})


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

const selectedRows = ref<Set<number | string>>(new Set())

function toggleRowSelection(row: any) {
  const id = row?.id
  if (!id) return
  if (selectedRows.value.has(id)) selectedRows.value.delete(id)
  else selectedRows.value.add(id)
}

function toggleSelectAll(checked: boolean) {
  if (checked) {
    // select all currently loaded vehicles
    vehicles.value.forEach(v => { if (v.id) selectedRows.value.add(v.id) })
  } else {
    selectedRows.value.clear()
  }
}

async function deleteSelected() {
  if (!selectedRows.value.size) return
  const confirmed = await safeSwal.confirm({ title: 'Delete Selected', text: `Delete ${selectedRows.value.size} vehicle(s)? This cannot be undone.`, confirmButtonText: 'Delete', cancelButtonText: 'Cancel' })
  if (!confirmed) return
  try {
    const ids = Array.from(selectedRows.value)
    await Promise.all(ids.map(id => vehicleAssetService.deleteVehicleAsset(id as any)))
    toast.success('Selected vehicles deleted')
    selectedRows.value.clear()
    await fetchVehicles()
  } catch (err: any) {
    toast.error('Failed to delete selected vehicles')
  }
}

function exportSelectedCsv() {
  if (!selectedRows.value.size) return toast.info('No rows selected')
  const ids = new Set(selectedRows.value)
  const rows = vehicles.value.filter(v => v.id != null && ids.has(v.id as any))
  const headers = ['id','name','registration_number','make','model','chassis_number']
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${(r as any)[h] ?? ''}"`).join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vehicles-selected.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const pageActions = computed(() => {
  const actions = []
  if (showVehicleList.value) {
    // Batch actions when rows selected
    if (selectedRows.value.size) {
      actions.push(
        { label: `${selectedRows.value.size} selected`, icon: 'fa fa-check', class: 'btn btn-outline-secondary', method: () => {} },
        { label: 'Delete Selected', icon: 'fa fa-trash', class: 'btn btn-danger', method: () => deleteSelected() },
        { label: 'Export Selected', icon: 'fa fa-file-export', class: 'btn btn-outline-secondary', method: () => exportSelectedCsv() },
      )
    }

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
  { key: 'select', label: '', sortable: false, visible: true },
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
    // Use a longer timeout to tolerate slower but valid responses
    const res = await fetchWithTimeout(vehicleAssetService.listVehicleAssetsDisplay(vehicleFilters.value), 20000)
    console.debug('[FleetMaster] listVehicleAssetsDisplay response:', (res as any)?.status, (res as any)?.data)

    // Normalize various API response shapes into an array that the table expects
    const raw = (res as any)?.data
    let list: any[] = []

    if (Array.isArray(raw)) {
      list = raw
    } else if (Array.isArray(raw?.data)) {
      list = raw.data
    } else if (Array.isArray(raw?.results)) {
      list = raw.results
    } else if (Array.isArray(raw?.payload)) {
      list = raw.payload
    } else if (Array.isArray(raw?.data?.data)) {
      // Common paginated shape: { data: { data: [...] } }
      list = raw.data.data
    } else if (Array.isArray(raw?.data?.results)) {
      list = raw.data.results
    } else if (Array.isArray(raw?.data?.payload)) {
      list = raw.data.payload
    } else if (Array.isArray(raw?.data?.items)) {
      list = raw.data.items
    } else if (Array.isArray(raw?.items)) {
      list = raw.items
    } else {
      // Fallback: attempt to find an array one or two levels deep
      const found = Object.values(raw || {}).find(v => Array.isArray(v))
      if (found) list = found as any[]
      else {
        const nested = Object.values(raw || {}).reduce((acc: any[], v: any) => {
          if (v && typeof v === 'object') acc.push(...Object.values(v))
          return acc
        }, [])
        const foundNested = nested.find(v => Array.isArray(v))
        if (foundNested) list = foundNested as any[]
      }
    }

    if (!Array.isArray(list)) {
      console.warn('[FleetMaster] Unexpected vehicles payload shape — expected array. Raw:', raw)
      list = []
    } else {
      // Helpful debug: log where we extracted the array from (dev-only)
      console.debug('[FleetMaster] vehicles normalized; sample count =', list.length)
    }

    vehicles.value = list

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
  } catch (err: any) {
    // If this is a timeout, offer the user a friendly retry option
    if (String(err?.message || '').toLowerCase().includes('timeout')) {
      console.warn('[FleetMaster] Failed to load vehicles - timeout', err)
      const retry = await safeSwal.confirm({ title: 'Request timed out', text: 'Loading vehicles timed out. Retry?', confirmButtonText: 'Retry', cancelButtonText: 'Cancel' })
      if (retry) {
        await fetchVehicles()
        return
      } else {
        safeToast('error', 'Request timed out while loading vehicles')
      }
    } else {
      // Log full error for debugging and show server message when available
      console.error('[FleetMaster] Failed to load vehicles', err)
      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to load vehicles'
      safeToast('error', typeof serverMsg === 'string' ? serverMsg : 'Failed to load vehicles')
    }
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
    
    // Filter to only include actual fuel types - exclude non-fuel items
    // Only include items that are actual fuel types
    const allowedFuels = ['petrol', 'diesel', 'gas', 'electric', 'hybrid', 'lpg', 'cng', 'biodiesel', 'ethanol']
    fuelItems.value = allFuelItems.filter((item: any) => {
      const name = (item.name || '').toLowerCase()
      return allowedFuels.some(fuel => name.includes(fuel))
    })
  } catch (err) {
    toast.error('Failed to load metadata')
  }
} 



function openAddVehicleForm() {
  editingVehicleId.value = null
  selectedVehicle.value = null
  resetVehicleForm()
  vehicleFormError.value = ''
  vehicleFormModalRef.value?.show()
}

function openEditVehicleForm(vehicle: VehicleAsset) {
  openVehicleForm(vehicle)
  vehicleFormModalRef.value?.show()
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

function resetVehicleFormState() {
  selectedVehicle.value = null
  editingVehicleId.value = null
  vehicleFormError.value = ''
  resetVehicleForm()
}

function closeVehicleForm() {
  vehicleFormModalRef.value?.hide()
  resetVehicleFormState()
}

function handleVehicleFormClose() {
  resetVehicleFormState()
}

function handleVehicleFormHidden() {
  resetVehicleFormState()
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
  const confirmed = await safeSwal.confirm({
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

// Helper to avoid hanging requests: race the promise against a timeout
function fetchWithTimeout<T>(promise: Promise<T>, ms = 20000) {
  let timer: any
  return Promise.race([
    promise,
    new Promise<T>((_res, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms) })
  ]).finally(() => clearTimeout(timer))
}

async function openVehicleDetails(vehicle: VehicleAsset) {
  // Try common id locations
  let id: any = null
  if (vehicle) {
    id = (vehicle as any).id ?? (vehicle as any).asset_id ?? (vehicle as any).pk ?? (vehicle as any).motor_vehicle?.id ?? (vehicle as any).motor_vehicle?.asset_id ?? (vehicle as any).vehicle_id ?? null
  }
  console.debug('[FleetMaster] initial resolved id:', id)

  // If id is missing or looks like a non-numeric registration, try lookup by registration
  let registrationToTry: string | null = null
  if (!id) {
    registrationToTry = (vehicle as any)?.registration_number ?? null
  } else if (typeof id === 'string' && Number.isNaN(Number(id))) {
    registrationToTry = id
    id = null
  }

  if (registrationToTry) {
    try {
      // Protect lookup with a longer timeout
      const res = await fetchWithTimeout(vehicleAssetService.findByRegistration(registrationToTry), 20000)
      console.info('[FleetMaster] findByRegistration (info):', { status: (res as any).status, data: (res as any).data })
      // Fallback to raw text if axios didn't parse JSON
      if ((res as any).request && (res as any).request.responseText) {
        console.debug('[FleetMaster] findByRegistration raw response:', (res as any).request.responseText)
        console.info('[FleetMaster] findByRegistration raw response (info):', (res as any).request.responseText)
      }

      // Some backends return { success: false, message: '...' } with 200 status; handle explicitly
      if ((res as any).data && (res as any).data.success === false) {
        const msg = (res as any).data.message || `No vehicle found for registration ${registrationToTry}`
        console.warn('[FleetMaster] findByRegistration reported failure:', msg)
        safeToast('error', msg)

        // Revert view state so user isn't stuck on an empty details page
        showVehicleList.value = true
        showVehicleDetailsPage.value = false
        loadingDetails.value = false
        vehicleDetails.value = null
        selectedVehicleUuid.value = null
        return
      }

      const found = (res as any).data?.data || (res as any).data
      if (!found) {
        console.warn('[FleetMaster] findByRegistration returned no data for', registrationToTry)
        safeToast('error', `No vehicle found for registration ${registrationToTry}`)

        showVehicleList.value = true
        showVehicleDetailsPage.value = false
        loadingDetails.value = false
        vehicleDetails.value = null
        selectedVehicleUuid.value = null
        return
      }

      id = (found as any)?.id ?? (found as any)?.asset_id ?? (found as any)?.pk ?? null
      console.debug('[FleetMaster] resolved id by registration:', id)
    } catch (err: any) {
      if (String(err?.message || '').toLowerCase().includes('timeout')) {
        console.warn('[FleetMaster] registration lookup timeout for', registrationToTry)
        const retry = await safeSwal.confirm({ title: 'Request timed out', text: `Resolving vehicle ${registrationToTry} timed out. Retry?`, confirmButtonText: 'Retry', cancelButtonText: 'Cancel' })
        if (retry) {
          return await openVehicleDetails(vehicle)
        } else {
          safeToast('error', 'Timed out while resolving vehicle by registration')
        }
      } else {
        console.warn('[FleetMaster] Failed to resolve vehicle by registration', registrationToTry, err)
        safeToast('error', 'Failed to resolve vehicle by registration')
      }

      showVehicleList.value = true
      showVehicleDetailsPage.value = false
      loadingDetails.value = false
      vehicleDetails.value = null
      selectedVehicleUuid.value = null
      return
    }
  }

  if (!id) {
    // If id couldn't be resolved, ensure we revert the UI to the list view and
    // surface a clear error to the user so they aren't left on an empty details page.
    safeToast('error', 'Vehicle id missing; cannot load details')
    showVehicleList.value = true
    showVehicleDetailsPage.value = false
    loadingDetails.value = false
    vehicleDetails.value = null
    selectedVehicleUuid.value = null
    return
  }

  try {
    // Fetch the full asset details (with timeout)
    const res = await fetchWithTimeout(vehicleAssetService.getVehicleAsset(id), 20000)
    console.debug('[FleetMaster] getVehicleAsset response status/headers/data:', (res as any).status, (res as any).headers, (res as any).data)
    console.info('[FleetMaster] getVehicleAsset (info):', { status: (res as any).status, data: (res as any).data })
    if ((res as any).request && (res as any).request.responseText) {
      console.debug('[FleetMaster] getVehicleAsset raw response:', (res as any).request.responseText)
      console.info('[FleetMaster] getVehicleAsset raw response (info):', (res as any).request.responseText)
    }

    const payload = (res as any).data?.data || (res as any).data || null
    if (!payload && !vehicle) {
      // Nothing sensible returned by API and we had no row fallback - show message and revert
      toast.error('No vehicle details returned from server')
      showVehicleList.value = true
      showVehicleDetailsPage.value = false
      loadingDetails.value = false
      return
    }

    vehicleDetails.value = payload || vehicle
    selectedVehicleUuid.value = id
    await refreshVehicleDocuments(id)

    // Show the full-page VehicleProfile (replace list), not the modal
    showVehicleList.value = false
    showVehicleDetailsPage.value = true
    showVehicleDetailsModal.value = false

    // Update URL to reflect details view for deep-linking (prefer registration if available)
    try {
      const currentId = route.params.id ?? route.query.id
      const pushId = vehicleDetails.value?.registration_number ?? id
      console.debug('[FleetMaster] current route id:', currentId, 'pushId:', pushId)
      if (!currentId || String(currentId) !== String(pushId)) {
        // Prefer a pretty, named route so we avoid hitting catch-all redirects and to
        // keep URLs readable (e.g. /bushman/assets/fleet-master/REG123).
        router.push({ name: 'bushman-fleet-master-details', params: { id: String(pushId) } }).catch((err: any) => {
          // If push fails (redundant navigation or unexpected), fall back to a safe replace
          // using a query param to avoid leaving the user on a non-existent route.
          if (err && err.name !== 'NavigationDuplicated') {
            console.warn('Route push failed, falling back to query replace', err)
            router.replace({ path: '/bushman/assets/fleet-master', query: { id: String(pushId) } }).catch((e: any) => {
              if (e && e.name !== 'NavigationDuplicated') console.warn('Failed to set details query param', e)
            })
          }
        })
      }
    } catch (e) {
      console.warn('Failed to update vehicle details route', e)
    }
  } catch (err: any) {
    console.error('[FleetMaster] Failed to load vehicle details', err)

    // On error, revert to list so user isn't stuck on an empty details page
    showVehicleList.value = true
    showVehicleDetailsPage.value = false
    vehicleDetails.value = null

    if (String(err?.message || '').toLowerCase().includes('timeout')) {
      const retry = await safeSwal.confirm({ title: 'Request timed out', text: 'Loading vehicle details timed out. Retry?', confirmButtonText: 'Retry', cancelButtonText: 'Cancel' })
      if (retry) {
        return await openVehicleDetails(vehicle)
      }
      safeToast('error', 'Request timed out while loading vehicle details')
    } else {
      safeToast('error', 'Failed to load vehicle details')
    }
  } finally {
    loadingDetails.value = false
  }
}

function closeVehicleDetailsModal() {
  showVehicleDetailsModal.value = false
  showVehicleList.value = true
  selectedVehicleUuid.value = null
  vehicleDetails.value = null
  vehicleDocuments.value = []
}

async function refreshVehicleDetails() {
  if (!vehicleDetails.value) return
  await openVehicleDetails(vehicleDetails.value)
}

function backToVehicleList() {
  showVehicleList.value = true
  showVehicleDetailsPage.value = false
  vehicleDetails.value = null
  vehicleDocuments.value = []
  selectedVehicleFile.value = null
  sanitizedFileName.value = null
}

function openSeatMap(data: any) {
  if (!data) {
    toast.info('No seat map assigned')
    return
  }
  // If seat map has an id, route to the seat-map page, otherwise show a toast with name
  if (data.id) {
    router.push(`/bushman/assets/seat-maps/${data.id}`)
    return
  }
  if (data.name || data.title) {
    toast.info(`Seat map: ${data.name || data.title}`)
    return
  }
  toast.info('Seat map data not available')
}

async function refreshVehicleDocuments(vehicleId: number) {
  try {
    // We link documents to vehicle by using code = vehicle-{id}
    const res = await documentsStore.listDocuments({ code: `vehicle-${vehicleId}` })
    console.debug('[FleetMaster] listDocuments response status/headers/data:', (res as any).status, (res as any).headers, (res as any).data)
    if ((res as any).request && (res as any).request.responseText) {
      console.debug('[FleetMaster] listDocuments raw response:', (res as any).request.responseText)
    }

    const list = Array.isArray((res as any).data)
      ? (res as any).data
      : Array.isArray((res as any).data?.data)
        ? (res as any).data.data
        : (res as any).data?.results || []

    console.debug('[FleetMaster] refreshVehicleDocuments fetched list length=', (list || []).length, list)
    console.info('[FleetMaster] refreshVehicleDocuments (info):', { length: (list || []).length, sample: (list || [])[0] })

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
    // Limit to the first 3 documents and stagger requests to avoid main-thread blocking
    ;(vehicleDocuments.value || []).slice(0, 3).forEach((doc: any, idx: number) => {
      const mime = (doc.mime_type || '').toString().toLowerCase()
      if (mime.startsWith('image')) {
        // Stagger by a small delay so we yield to the event loop between downloads
        setTimeout(() => { loadPreview(doc).catch((e) => console.warn('loadPreview failed', e)) }, idx * 200)
      }
    })
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

// Open/close helpers for documents modal — use functions to avoid inline assignment caching problems
function openDocuments() {
  console.debug('[FleetMaster] openDocuments called', { showDocumentsModal, showDocumentsModalFallback })
  try {
    // Prefer setting the ref.value if ref is intact
    if (showDocumentsModal && typeof (showDocumentsModal as any) === 'object' && 'value' in (showDocumentsModal as any)) {
      showDocumentsModal.value = true
      console.debug('[FleetMaster] showDocumentsModal.value set true')
    }
  } catch (err) {
    console.debug('[FleetMaster] openDocuments set failed on first ref', err)
  }
  // Always set the fallback so modal will open even if the ref got corrupted
  showDocumentsModalFallback.value = true
  console.debug('[FleetMaster] showDocumentsModalFallback set true')
}
function closeDocuments() {
  console.debug('[FleetMaster] closeDocuments called', { showDocumentsModal, showDocumentsModalFallback })
  try {
    if (showDocumentsModal && typeof (showDocumentsModal as any) === 'object' && 'value' in (showDocumentsModal as any)) {
      showDocumentsModal.value = false
      console.debug('[FleetMaster] showDocumentsModal.value set false')
    }
  } catch (err) {
    console.debug('[FleetMaster] closeDocuments failed to set primary ref', err)
  }
  showDocumentsModalFallback.value = false
  console.debug('[FleetMaster] showDocumentsModalFallback set false')
}

function handleDocumentUploaded() {
  toast.success('Document uploaded — refreshing list')
  if (vehicleDetails.value && vehicleDetails.value.id) refreshVehicleDocuments(vehicleDetails.value.id)
  closeDocuments()
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

function getFilenameFromHeader(headerValue: string | undefined, fallback: string) {
  if (!headerValue) return fallback
  const match = headerValue.match(/filename\*?=(?:UTF-8''|"|')?([^;"']+)/i)
  if (match && match[1]) return decodeURIComponent(match[1].replace(/"/g, '').trim())
  const simple = headerValue.match(/filename="?([^";]+)"?/)
  return simple?.[1] || fallback
}

async function downloadVehicleDocument(docOrId: any) {
  try {
    const id = typeof docOrId === 'object' ? docOrId.id : docOrId
    if (!id) {
      toast.error('Document id missing')
      return
    }

    const response = await documentsStore.downloadDocument(id)

    // Try to best-effort find filename
    const mime = (typeof docOrId === 'object' && docOrId.mime_type) ? docOrId.mime_type : response.headers['content-type']
    const filename = (typeof docOrId === 'object' && docOrId.name) ? docOrId.name : getFilenameFromHeader(response.headers['content-disposition'], `document-${id}`)

    const blob = new Blob([response.data], { type: mime })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('Download failed', err)
    const msg = err?.response?.data?.message || 'Failed to download file'
    toast.error(msg)
  }
}

// Document viewer modal state
const showDocumentViewer = ref(false)
const documentViewerUrl = ref<string | null>(null)
const documentViewerName = ref<string>('')
const documentViewerMimeType = ref<string>('')
const documentViewerLoading = ref(false)

async function viewVehicleDocument(doc: any) {
  try {
    documentViewerLoading.value = true
    documentViewerName.value = doc.name || doc.title || 'Document'
    showDocumentViewer.value = true

    // Validate document id or fallback to download_url if present
    if (!doc?.id) {
      if (doc?.download_url) {
        documentViewerUrl.value = doc.download_url
        // Try to set mime from available data if present
        documentViewerMimeType.value = doc.mime_type || ''
        return
      }
      throw new Error('Document id is missing')
    }

    // Use store helper which tries view -> download -> metadata
    const res = await documentsStore.getViewableUrl(doc.id)
    documentViewerUrl.value = res.url
    // Prefer explicit mime from response, fall back to doc.mime_type
    documentViewerMimeType.value = res.mimeType || doc.mime_type || ''

    // If mime still unknown, infer from filename extension
    if (!documentViewerMimeType.value && (doc.name || doc.file_name)) {
      documentViewerMimeType.value = inferMimeFromFilename(doc.name || doc.file_name)
    }
  } catch (err: any) {
    console.error('Failed to open document:', err)
    const serverMsg = err?.response?.data?.message || err?.message || 'Failed to open document'
    toast.error(serverMsg)
    showDocumentViewer.value = false
  } finally {
    documentViewerLoading.value = false
  }
}

function inferMimeFromFilename(name: string) {
  const n = name.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.gif')) return 'image/gif'
  return ''
}

function closeDocumentViewer() {
  if (documentViewerUrl.value) {
    try { window.URL.revokeObjectURL(documentViewerUrl.value) } catch (e) {}
  }
  documentViewerUrl.value = null
  documentViewerName.value = ''
  documentViewerMimeType.value = ''
  showDocumentViewer.value = false
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
    if (!doc?.id) {
      if (doc?.download_url) {
        previewImageUrl.value = doc.download_url
        showImagePreviewModal.value = true
        return
      }
      throw new Error('Document id is missing')
    }

    const res = await documentsStore.getViewableUrl(doc.id)
    previewImageUrl.value = res.url
    showImagePreviewModal.value = true
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Failed to load image preview'
    toast.error(msg)
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

  // Dev-only: clean up stray overlays/backdrops that can block interaction (helps when a modal/overlay
  // was left behind by HMR or a failed request). This runs only in development.
  if (import.meta.env.DEV) {
    setTimeout(() => {
      try {
        if (typeof document === 'undefined' || !document || !document.body) return

        // Be conservative: avoid removing swal containers which can break Swal use later.
        const selectors = ['.document-viewer-overlay', '.modal-backdrop', '.modal-backdrop.show']
        selectors.forEach((sel) => {
          try {
            Array.from(document.querySelectorAll(sel)).forEach((el) => {
              try {
                console.warn('[FleetMaster][dev-cleanup] Removing stray overlay:', sel, el)
                el.remove()
              } catch (e) {
                console.error('[FleetMaster][dev-cleanup] Failed to remove overlay', sel, e)
              }
            })
          } catch (e) {
            console.warn('[FleetMaster][dev-cleanup] query failed for selector', sel, e)
          }
        })

        // Report other fixed elements with very high z-index that may block interactions
        const problematic = Array.from(document.body.querySelectorAll('*')).filter((el: any) => {
          const st = getComputedStyle(el)
          const z = Number(st.zIndex) || 0
          return (st.position === 'fixed' || st.position === 'absolute') && z >= 1000 && el.offsetWidth > 0 && el.offsetHeight > 0
        })
        if (problematic.length) console.warn('[FleetMaster][dev-cleanup] High z-index fixed elements found:', problematic)
      } catch (e) {
        console.warn('[FleetMaster][dev-cleanup] aborted cleanup due to error', e)
      }
    }, 250)
  }

  // If the URL contains an id (either as a route param or a query param), attempt to open that vehicle for deep-linking.
  // Use local list first to avoid extra requests, then fall back to the existing lookup logic in openVehicleDetails.
  try {
    const initialId = (route.params.id ?? route.query.id) as string | undefined
    if (initialId) {
      const local = vehicles.value.find(v => String(v.id) === String(initialId) || String(v.registration_number) === String(initialId))
      if (local) {
        await openVehicleDetails(local)
      } else {
        // Trigger openVehicleDetails with a registration payload (it will try findByRegistration or direct fetch)
        await openVehicleDetails({ registration_number: initialId } as any)
      }
    }
  } catch (e) {
    console.warn('[FleetMaster] failed to auto-open vehicle from route/query id', e)
  }
})

// Dev-only helpers to inspect/remove pointer-blocking elements quickly from the console
if (import.meta.env.DEV) {
  try {
    ;(window as any).__fleetMasterDebug = {
      findBlockers: () => {
        const blockers = Array.from(document.body.querySelectorAll('*')).filter((el: any) => {
          const st = getComputedStyle(el)
          const z = Number(st.zIndex) || 0
          return (st.position === 'fixed' || st.position === 'absolute') && z >= 1000 && el.offsetWidth > 0 && el.offsetHeight > 0
        })
        console.info('[FleetMaster][debug] blockers:', blockers.map((el: any) => ({ tag: el.tagName, classes: el.className, z: getComputedStyle(el).zIndex, rect: el.getBoundingClientRect() })))
        return blockers
      },
      elementAtCenter: () => {
        const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
        console.info('[FleetMaster][debug] elementAtCenter:', el, { tag: el?.tagName, classes: el?.className })
        return el
      },
      removeBlockers: (selector?: string) => {
        let els: Element[] = []
        if (selector) els = Array.from(document.querySelectorAll(selector))
        else els = (window as any).__fleetMasterDebug.findBlockers()
        els.forEach((el: any) => {
          try { el.remove() } catch (e) { console.error('Failed to remove element', el, e) }
        })
        console.info('[FleetMaster][debug] removed elements count:', els.length)
        return els
      }
    }
  } catch (e) {
    console.warn('[FleetMaster][debug] could not expose debug helpers', e)
  }
}


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

.compact-tabs .nav-link {
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.compact-tabs-left {
  width: auto;
}

.compact-tabs-left .nav-item {
  flex: 0 0 auto;
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

/* Document Viewer Modal Styles */
.document-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.document-viewer-container {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.document-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.document-viewer-body {
  flex: 1;
  overflow: hidden;
  background: #f1f1f1;
}

.document-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.document-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  margin: auto;
}


/* Vehicle profile shell styles to ensure full-page, hero-like appearance */
.vehicle-profile-shell {
  padding: 18px 18px 36px 18px;
}

.vehicle-profile-shell :deep(.card-hero) {
  margin: 0;
  border-bottom: 1px solid rgba(0,0,0,0.03);
}

.vehicle-profile-shell :deep(.card) {
  border-radius: 10px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  overflow: visible;
}

.vehicle-profile-shell :deep(.card .card-header.p-0.border-bottom) {
  background: transparent;
  border-bottom: none;
  margin-top: 0;
}

.vehicle-profile-shell :deep(.card-header) {
  background: #f6f8fb;
  border: none;
}

</style>
