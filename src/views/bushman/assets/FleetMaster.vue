<template>
  <div class="fleet-master-page">
    <!-- Header -->
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

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'vehicles' }"
          href="#"
          @click.prevent="activeTab = 'vehicles'"
        >
          <i class="fa fa-car me-2"></i>Vehicles
          <span class="badge bg-primary ms-2">{{ vehiclesCount }}</span>
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'models' }"
          href="#"
          @click.prevent="activeTab = 'models'"
        >
          <i class="fa fa-list me-2"></i>Vehicle Models
          <span class="badge bg-secondary ms-2">{{ modelsCount }}</span>
        </a>
      </li>
    </ul>

    <!-- VEHICLES TAB -->
    <div v-if="activeTab === 'vehicles'">
      <card>
        <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
          <i class="fa fa-car me-2"></i>Vehicles
        </card-header>
        <card-body>
          <StandardDataTable
            :columns="vehicleColumns"
            :data="vehicles"
            :loading="loadingVehicles"
            :filters="vehicleFilters"
            :actionButtons="vehicleActionButtons"
            :pageSizeOptions="[10, 25, 50]"
            :defaultPageSize="10"
            @update:filters="handleVehicleFiltersUpdate"
          >
            <template #registration="{ row }">
              <span class="badge bg-warning bg-opacity-20 fs-14px fw-bold text-danger cursor-pointer">
                <i class="fa fa-car me-1"></i>
                {{ row.registration_number || row.motor_vehicle?.registration_number || '-' }}
              </span>
            </template>
            <template #make="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info cursor-pointer">
                {{ row.make || row.motor_vehicle?.vehicle_model?.make || '-' }}
              </span>
            </template>
            <template #model="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info cursor-pointer">
                {{ row.model || row.motor_vehicle?.vehicle_model?.model || '-' }}
              </span>
            </template>
            <template #manufacture_year="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-primary">
                {{ row.manufacture_year || row.motor_vehicle?.manufacture_year || '-' }}
              </span>
            </template>
            <template #registration_date="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-success">
                {{ formatLongDate(row.registration_date) }}
              </span>
            </template>
            <template #chassis="{ row }">
              <code class="small">{{ row.chassis_number || row.motor_vehicle?.chassis_number || '-' }}</code>
            </template>
          </StandardDataTable>
        </card-body>
      </card>
    </div>

    <!-- MODELS TAB -->
    <div v-if="activeTab === 'models'">
      <card>
        <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
          <i class="fa fa-list me-2"></i>Vehicle Models
        </card-header>
        <card-body>
          <StandardDataTable
            :columns="modelColumns"
            :data="models"
            :loading="loadingModels"
            :filters="modelFilters"
            :actionButtons="modelActionButtons"
            :pageSizeOptions="[10, 25, 50]"
            :defaultPageSize="10"
            @update:filters="handleModelFiltersUpdate"
          >
            <template #make="{ row }">
              <span class="badge bg-warning bg-opacity-20 fs-14px fw-bold text-danger cursor-pointer">
                <i class="fa fa-industry me-1"></i>
                {{ row.make }}
              </span>
            </template>
            <template #model="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info cursor-pointer">
                {{ row.model }}
                <span v-if="row.variant" class="text-muted"> - {{ row.variant }}</span>
              </span>
            </template>
            <template #type="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-primary">
                <i :class="getTypeIcon(row.type)" class="me-1"></i>
                {{ row.type }}
              </span>
            </template>
            <template #vehicles_count="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-success">
                {{ row.motor_vehicles?.length || 0 }}
              </span>
            </template>
            <template #actions="{ row }">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-sm" @click="openModelForm(row)" title="View Details">
                  <i class="fa fa-eye"></i>
                </button>
              </div>
            </template>
          </StandardDataTable>
        </card-body>
      </card>
    </div>

    <!-- Vehicle Offcanvas -->
    <VehicleAssetOffcanvas
      :is-open="showVehicleOffcanvas"
      :vehicle-to-edit="selectedVehicle"
      :vehicle-models="vehicleModels"
      :fuel-items="fuelItems"
      @close="closeVehicleOffcanvas"
      @save="handleVehicleSave"
    />

    <!-- Model Offcanvas -->
    <VehicleModelOffcanvas
      :is-open="showModelOffcanvas"
      :model-to-edit="selectedModel"
      @close="closeModelOffcanvas"
      @save="handleModelSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import vehicleAssetService, { type VehicleAsset } from '@/services/vehicleAssetService'
import vehicleModelService, { type VehicleModel } from '@/services/vehicleModelService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import VehicleAssetOffcanvas from '@/components/VehicleAssetOffcanvas.vue'
import VehicleModelOffcanvas from '@/components/VehicleModelOffcanvas.vue'

const toast = useToast()
const swal = useSwal()

// State
const activeTab = ref<'vehicles' | 'models'>('vehicles')
const loadingVehicles = ref(false)
const loadingModels = ref(false)
const vehicles = ref<VehicleAsset[]>([])
const models = ref<VehicleModel[]>([])
const makes = ref<string[]>([])
const vehicleModels = ref<any[]>([])
const fuelItems = ref<any[]>([])
const summary = ref<any>({})

const vehicleFilters = ref({
  search: '',
  status: '',
  ownership: '',
  vehicle_model_id: ''
})

const modelFilters = ref({
  search: '',
  type: '',
  make: ''
})

// Offcanvas
const showVehicleOffcanvas = ref(false)
const selectedVehicle = ref<VehicleAsset | null>(null)
const showModelOffcanvas = ref(false)
const selectedModel = ref<VehicleModel | null>(null)

// Computed
const vehiclesCount = computed(() => vehicles.value.length)
const modelsCount = computed(() => models.value.length)

// Tables
const vehicleColumns = [
  { key: 'registration', label: 'Registration', sortable: true, visible: true },
  { key: 'make', label: 'Make', sortable: true, visible: true },
  { key: 'model', label: 'Model', sortable: true, visible: true },
  { key: 'manufacture_year', label: 'Year', sortable: true, visible: true },
  { key: 'registration_date', label: 'Registration Date', sortable: true, visible: true },
  { key: 'chassis', label: 'Chassis', sortable: false, visible: true }
]

const modelColumns = [
  { key: 'make', label: 'Make', sortable: true, visible: true },
  { key: 'model', label: 'Model', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
  { key: 'vehicles_count', label: 'Vehicles', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
]

// Action Buttons
const vehicleActionButtons = [
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn-outline-secondary',
    method: () => fetchVehicles()
  },
  {
    label: 'Print PDF',
    icon: 'fa fa-print',
    class: 'btn-outline-secondary',
    method: () => openFleetMasterPdf()
  },
  {
    label: 'Add Vehicle',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openVehicleForm()
  }
]

const modelActionButtons = [
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn-outline-secondary',
    method: () => fetchModels()
  },
  {
    label: 'Add Model',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openModelForm()
  }
]

// Methods
let vehicleTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedFetchVehicles() {
  if (vehicleTimeout) clearTimeout(vehicleTimeout)
  vehicleTimeout = setTimeout(() => fetchVehicles(), 300)
}

let modelTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedFetchModels() {
  if (modelTimeout) clearTimeout(modelTimeout)
  modelTimeout = setTimeout(() => fetchModels(), 300)
}

function handleVehicleFiltersUpdate(newFilters: any) {
  vehicleFilters.value = { ...vehicleFilters.value, ...newFilters }
}

function handleModelFiltersUpdate(newFilters: any) {
  modelFilters.value = { ...modelFilters.value, ...newFilters }
}

async function fetchVehicles() {
  loadingVehicles.value = true
  try {
    const res = await vehicleAssetService.listVehicleAssetsDisplay(vehicleFilters.value)
    vehicles.value = res.data.data || res.data || []
  } catch (err) {
    toast.error('Failed to load vehicles')
  } finally {
    loadingVehicles.value = false
  }
}

async function fetchModels() {
  loadingModels.value = true
  try {
    const res = await vehicleModelService.listVehicleModels(modelFilters.value)
    models.value = res.data.data || res.data || []
  } catch (err) {
    toast.error('Failed to load models')
  } finally {
    loadingModels.value = false
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
    fuelItems.value = data.fuel_items || []
  } catch (err) {
    toast.error('Failed to load metadata')
  }
}

async function fetchMakes() {
  try {
    const res = await vehicleModelService.getMakes()
    makes.value = res.data.data || res.data || []
  } catch (err) {
    console.error('Failed to load makes')
  }
}

function openVehicleForm(vehicle?: VehicleAsset) {
  selectedVehicle.value = vehicle || null
  showVehicleOffcanvas.value = true
}

function closeVehicleOffcanvas() {
  showVehicleOffcanvas.value = false
  selectedVehicle.value = null
}

async function handleVehicleSave() {
  closeVehicleOffcanvas()
  await Promise.all([fetchVehicles(), fetchSummary(), fetchMetadata()])
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

function openModelForm(model?: VehicleModel) {
  selectedModel.value = model || null
  showModelOffcanvas.value = true
}

function closeModelOffcanvas() {
  showModelOffcanvas.value = false
  selectedModel.value = null
}

function openFleetMasterPdf() {
  window.open('/#/bushman/assets/fleet-master/print', '_blank')
}

async function handleModelSave() {
  closeModelOffcanvas()
  await Promise.all([fetchModels(), fetchMakes(), fetchMetadata()])
}

async function confirmDeleteModel(model: VehicleModel) {
  const confirmed = await swal.confirm({
    title: 'Delete Vehicle Model',
    text: `Are you sure you want to delete "${model.make} ${model.model}"? This can only be done if no vehicles use this model.`,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })

  if (!confirmed) return

  try {
    await vehicleModelService.deleteVehicleModel(model.id!)
    toast.success('Vehicle model deleted successfully')
    await fetchModels()
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to delete model'
    toast.error(msg)
  }
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

onMounted(async () => {
  await Promise.all([
    fetchVehicles(),
    fetchModels(),
    fetchSummary(),
    fetchMetadata(),
    fetchMakes()
  ])
})
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
</style>
