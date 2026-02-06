<template>
  <div class="vehicle-models-page">
    <div class="d-sm-flex align-items-center mb-3">
      <div>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/bushman/dashboard">Home</router-link></li>
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Vehicle Models</li>
        </ol>
      </div>
    </div>

    <!-- LIST VIEW -->
    <template v-if="showModelList">
      <div class="vehicle-models-list">
        <card>
          <card-body>
            <StandardDataTable
              :columns="modelColumns"
              :data="models"
              :loading="loading"
              :filters="filters"
              :actionButtons="actionButtons"
              :pageSizeOptions="[10,25,50,100]"
              :defaultPageSize="100"
              @update:filters="handleFiltersUpdate"
            >
            <template #make="{ row }">
              {{ row.make }}
            </template>

            <template #model="{ row }">
              {{ row.model }}<span v-if="row.variant" class="text-muted"> - {{ row.variant }}</span>
            </template>

            <template #type="{ row }">
              <i :class="getTypeIcon(row.type)" class="me-1"></i>{{ row.type }}
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

    <!-- VEHICLE MODEL MODAL -->
    <StandardModal
      id="vehicleModelModal"
      ref="vehicleModelModalRef"
      :title="editingId ? 'Edit Vehicle Model' : 'Add Vehicle Model'"
      size="lg"
      :scrollable="true"
      :show-footer="false"
      @close="handleModelFormClose"
      @hidden="handleModelFormHidden"
    >
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Make <span class="text-danger">*</span></label>
          <input v-model="form.make" type="text" class="form-control" placeholder="Toyota" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Model <span class="text-danger">*</span></label>
          <input v-model="form.model" type="text" class="form-control" placeholder="Hiace" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Variant</label>
          <input v-model="form.variant" type="text" class="form-control" placeholder="2.5L" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Type <span class="text-danger">*</span></label>
          <select v-model="form.type" class="form-select">
            <option value="">-- Select Type --</option>
            <option value="CAR">Car</option>
            <option value="TRUCK">Truck</option>
            <option value="BUS">Bus</option>
            <option value="MOTORBIKE">Motorbike</option>
            <option value="TRACTOR">Tractor</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div class="col-md-8">
          <label class="form-label">Description</label>
          <input v-model="form.description" type="text" class="form-control" placeholder="Optional description" />
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeModelForm">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" @click="saveModel" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
          {{ editingId ? 'Update' : 'Create' }}
        </button>
      </div>
    </StandardModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSwal } from '@/composables/useSwal'
import vehicleModelService, { type VehicleModel } from '@/services/vehicleModelService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import StandardModal from '@/components/plugins/StandardModal.vue' 

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
const vehicleModelModalRef = ref<{ show: () => void; hide: () => void } | null>(null)
const form = ref<any>({
  make: '',
  model: '',
  variant: '',
  type: '',
  description: ''
})

const modelColumns = [
   { key: 'model', label: 'Model', sortable: true, visible: true },
  { key: 'make', label: 'Make', sortable: true, visible: true },
  { key: 'type', label: 'Type', sortable: true, visible: true },
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

function resetModelForm() {
  form.value = {
    make: '',
    model: '',
    variant: '',
    type: '',
    description: ''
  }
  error.value = ''
}

function openAddModelForm() {
  editingId.value = null
  resetModelForm()
  vehicleModelModalRef.value?.show()
}

function openEditModelForm(model: VehicleModel) {
  editingId.value = model.id ?? null
  form.value = {
    make: model.make || '',
    model: model.model || '',
    variant: model.variant || '',
    type: model.type || '',
    description: model.description || ''
  }
  error.value = ''
  vehicleModelModalRef.value?.show()
}

function closeModelForm() {
  vehicleModelModalRef.value?.hide()
  resetModelForm()
  editingId.value = null
}

function handleModelFormClose() {
  resetModelForm()
  editingId.value = null
}

function handleModelFormHidden() {
  resetModelForm()
  editingId.value = null
}

async function saveModel() {
  error.value = ''
  if (!form.value.make || !form.value.model || !form.value.type) {
    error.value = 'Make, Model and Type are required'
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await vehicleModelService.updateVehicleModel(editingId.value, form.value)
      toast.success('Vehicle model updated successfully')
    } else {
      await vehicleModelService.createVehicleModel(form.value)
      toast.success('Vehicle model created successfully')
    }
    closeModelForm()
    await loadModels()
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Failed to save vehicle model'
    toast.error(message)
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