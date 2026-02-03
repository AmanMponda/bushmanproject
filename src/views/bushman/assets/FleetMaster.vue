<template>
  <div class="fleet-master-page">


    <!-- VEHICLE LIST VIEW -->
    <template v-if="showVehicleList">
      <div class="fleet-master-list">
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
              >
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
      />
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
import { useDocumentsStore } from '@/stores/bushman/documents-store'
const toast = useToast()
const swal = useSwal()

// State
const showVehicleList = ref(true)
const showVehicleDetailsPage = ref(false)
const showVehicleDetailsModal = ref(false)
const selectedVehicleUuid = ref(null)
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
  { key: 'model', label: 'Model', sortable: true, visible: true, filter: { type: 'text', placeholder: 'Filter by model' } },
  { key: 'make', label: 'Make', sortable: true, visible: true, filter: { type: 'text', placeholder: 'Filter by make' } },
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
      id = (found as any)?.id ?? (found as any)?.asset_id ?? (found as any)?.pk ?? null} catch (err) {
      console.warn('Failed to resolve vehicle by registration', vehicle.registration_number)
    }
  }
  if (!id) {
    toast.error('Vehicle id missing; cannot load details')
    return
  }
  try {
    // Fetch the full asset details
    const res = await vehicleAssetService.getVehicleAsset(id)
    vehicleDetails.value = res.data?.data || res.data || vehicle
    selectedVehicleUuid.value = id
    await refreshVehicleDocuments(id)
    showVehicleList.value = false
    showVehicleDetailsModal.value = true
  } catch (err) {
    toast.error('Failed to load vehicle details')
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
    documentViewerMimeType.value = doc.mime_type || ''
    showDocumentViewer.value = true
    
    // Fetch the document and create a blob URL for viewing (inline to avoid HMR issues)
    const response = await documentsStore.downloadDocument(doc.id)
    const blob = response.data
    const mimeType = doc.mime_type || response.headers['content-type'] || 'application/octet-stream'
    const viewableBlob = new Blob([blob], { type: mimeType })
    documentViewerUrl.value = window.URL.createObjectURL(viewableBlob)
  } catch (err) {
    console.error('Failed to open document:', err)
    toast.error('Failed to open document')
    showDocumentViewer.value = false
  } finally {
    documentViewerLoading.value = false
  }
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

</style>
