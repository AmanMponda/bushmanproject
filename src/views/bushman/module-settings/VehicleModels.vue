<template>
  <div class="vehicle-models-page">
    <div class="d-sm-flex align-items-center mb-3">
      <div>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/bushman/dashboard">Home</router-link></li>
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Vehicle Models</li>
        </ol>
        <h1 class="page-header mb-0">Vehicle Models</h1>
      </div>
    </div>

    <!-- LIST VIEW -->
    <template v-if="showModelList">
      <div class="vehicle-models-list">
        <card>
          <!-- <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
            <i class="fa fa-list me-2"></i>Vehicle Models
          </card-header> -->
          <card-body>
            <StandardDataTable
              :columns="modelColumns"
              :data="models"
              :loading="loading"
              :filters="filters"
              :actionButtons="actionButtons"
              :pageSizeOptions="[10,25,50]"
              :defaultPageSize="10"
              @update:filters="handleFiltersUpdate"
            >
            <template #make="{ row }">
              <span class="badge bg-warning bg-opacity-20 fs-14px fw-bold text-danger">
                <i class="fa fa-industry me-1"></i>
                {{ row.make }}
              </span>
            </template>

            <template #model="{ row }">
              <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info">
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
                <button class="btn btn-outline-primary btn-sm" @click="openEditModelForm(row)" title="Edit">
                  <i class="fa fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" @click="confirmDeleteModel(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </template>
          </StandardDataTable>
        </card-body>
      </card>
      </div>
    </template>

    <!-- FORM VIEW -->
    <template v-else>
      <div class="card">
        <div class="card-header bg-white">
          <div>
            <h5 class="mb-0">
              <i :class="editingId ? 'fa fa-edit text-warning' : 'fa fa-plus-circle text-primary'" class="me-2"></i>
              {{ editingId ? 'Edit Vehicle Model' : 'Add New Vehicle Model' }}
            </h5>
            <small class="text-muted">{{ editingId ? 'Update model details' : 'Register a new vehicle model' }}</small>
          </div>
        </div>
        <div class="card-body">
          <div v-if="error" class="alert alert-danger">
            <i class="fa fa-exclamation-circle me-2"></i>{{ error }}
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Make <span class="text-danger">*</span></label>
              <input v-model="form.make" type="text" class="form-control" placeholder="e.g., Toyota" maxlength="100" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Model <span class="text-danger">*</span></label>
              <input v-model="form.model" type="text" class="form-control" placeholder="e.g., Hilux" maxlength="100" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Variant</label>
              <input v-model="form.variant" type="text" class="form-control" placeholder="Optional" maxlength="100" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Type <span class="text-danger">*</span></label>
              <select v-model="form.type" class="form-select" required>
                <option value="">-- Select Type --</option>
                <option value="CAR">Car</option>
                <option value="TRUCK">Truck</option>
                <option value="BUS">Bus</option>
                <option value="MOTORBIKE">Motorbike</option>
                <option value="TRACTOR">Tractor</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label">Description</label>
              <textarea v-model="form.description" class="form-control" rows="2" placeholder="Optional"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeForm">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" :disabled="saving" @click="saveModel">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingId ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import vehicleModelService, { type VehicleModel } from '@/services/vehicleModelService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue' 

const toast = useToast()
const swal = useSwal()

const loading = ref(false)
const models = ref<VehicleModel[]>([])
const filters = ref({ search: '', type: '', make: '' })

const showModelList = ref(true)
const selectedModel = ref<VehicleModel | null>(null)
const editingId = ref<number | null>(null)
const saving = ref(false)
const error = ref('')
const form = ref<Partial<VehicleModel>>({
  make: '',
  model: '',
  variant: '',
  type: 'CAR',
  description: ''
})

const modelColumns = [
  { key: 'make', label: 'Make', sortable: true, visible: true },
  { key: 'model', label: 'Model', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
  { key: 'vehicles_count', label: 'Vehicles', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
]

const actionButtons = [
  { label: 'Refresh', icon: 'fa fa-sync-alt', class: 'btn-outline-secondary', method: () => loadModels() },
  { label: 'Add Model', icon: 'fa fa-plus', class: 'btn-primary', method: () => openAddModelForm() }
]

function handleFiltersUpdate(newFilters: any) {
  filters.value = { ...filters.value, ...newFilters }
}

async function loadModels() {
  loading.value = true
  try {
    const res = await vehicleModelService.listVehicleModels(filters.value)
    models.value = res.data?.data || res.data || []
  } catch (err) {
    toast.error('Failed to load vehicle models')
  } finally {
    loading.value = false
  }
}

function openAddModelForm() {
  selectedModel.value = null
  editingId.value = null
  form.value = { make: '', model: '', variant: '', type: 'CAR', description: '' }
  error.value = ''
  showModelList.value = false
}

function openEditModelForm(model: VehicleModel) {
  selectedModel.value = model
  editingId.value = model?.id ?? null
  form.value = { ...model }
  error.value = ''
  showModelList.value = false
}

function closeForm() {
  showModelList.value = true
  selectedModel.value = null
  editingId.value = null
  form.value = { make: '', model: '', variant: '', type: 'CAR', description: '' }
  error.value = ''
}

async function saveModel() {
  error.value = ''
  if (!form.value.make?.trim() || !form.value.model?.trim() || !form.value.type) {
    error.value = 'Make, Model, and Type are required'
    return
  }

  saving.value = true
  const payload: Partial<VehicleModel> = {
    make: form.value.make!.trim(),
    model: form.value.model!.trim(),
    variant: form.value.variant?.trim() || null,
    type: form.value.type as any,
    description: form.value.description?.trim() || null
  }

  try {
    if (editingId.value) {
      await vehicleModelService.updateVehicleModel(editingId.value, payload)
      toast.success('Vehicle model updated successfully')
    } else {
      await vehicleModelService.createVehicleModel(payload)
      toast.success('Vehicle model created successfully')
    }
    closeForm()
    await loadModels()
  } catch (err: any) {
    let errorMsg = 'Failed to save vehicle model'
    if (err.response) {
      if (err.response.status === 422) {
        const errors = err.response.data?.errors
        if (errors) errorMsg = Object.values(errors).flat().join(', ')
        else errorMsg = err.response.data?.message || 'Validation error'
      } else if (err.response.data?.message) {
        errorMsg = err.response.data.message
      }
    }
    error.value = errorMsg
    toast.error(errorMsg)
  } finally {
    saving.value = false
  }
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
    await loadModels()
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to delete model'
    toast.error(msg)
  }
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

onMounted(async () => {
  await loadModels()
})
</script>

<style scoped>
.page-header { 
  font-size: 1.5rem; 
  font-weight: 600 
}

/* Remove hover effects from list view - target card and StandardDataTable */
.vehicle-models-list :deep(card) {
  pointer-events: auto;
}

.vehicle-models-list :deep(table.table tbody tr:hover),
.vehicle-models-list :deep(table tbody tr:hover),
.vehicle-models-list table.table tbody tr:hover,
.vehicle-models-list table tbody tr:hover {
  background-color: transparent !important;
}

.vehicle-models-list :deep(table.table tbody tr:hover td),
.vehicle-models-list :deep(table tbody tr:hover td),
.vehicle-models-list table tbody tr:hover td {
  background-color: white !important;
}

.vehicle-models-list :deep(table.table thead th.sortable:hover),
.vehicle-models-list :deep(table thead th.sortable:hover),
.vehicle-models-list table.table thead th.sortable:hover {
  background-color: transparent !important;
}

.vehicle-models-list :deep(table.table tbody tr),
.vehicle-models-list :deep(table tbody tr),
.vehicle-models-list table tbody tr {
  cursor: default !important;
}

.vehicle-models-list :deep(table.table tbody tr td),
.vehicle-models-list :deep(table tbody tr td),
.vehicle-models-list table tbody tr td {
  transition: none !important;
  background-color: inherit !important;
}

.vehicle-models-list :deep(.badge),
.vehicle-models-list .badge {
  cursor: default !important;
}

.vehicle-models-list :deep(.badge:hover),
.vehicle-models-list .badge:hover {
  transform: none !important;
  opacity: 1 !important;
  background-color: inherit !important;
}

.vehicle-models-list :deep(.btn-outline-primary:hover),
.vehicle-models-list :deep(.btn-danger:hover),
.vehicle-models-list :deep(.btn:hover),
.vehicle-models-list .btn-outline-primary:hover,
.vehicle-models-list .btn-danger:hover,
.vehicle-models-list .btn:hover {
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
}
</style>