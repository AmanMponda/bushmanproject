<template>
  <div
    class="offcanvas offcanvas-end"
    v-show="isOpen"
    :class="{ show: isOpen }"
    tabindex="-1"
    :style="{ visibility: isOpen ? 'visible' : 'hidden', width: '600px' }"
  >
    <div class="offcanvas-header border-bottom">
      <h5 class="offcanvas-title">
        <i class="fa fa-car me-2 text-primary"></i>
        {{ isEditMode ? 'Edit Vehicle' : 'Register Vehicle' }}
      </h5>
      <button type="button" class="btn-close" @click="closeOffcanvas"></button>
    </div>

    <form @submit.prevent="handleSubmit" class="offcanvas-body asset-offcanvas-body">
        <div v-if="error" class="alert alert-danger">
          <i class="fa fa-exclamation-circle me-2"></i>{{ error }}
        </div>

        <!-- Vehicle Details -->
        <div class="card mb-3">
          <div class="card-header bg-light py-2">
            <h6 class="mb-0"><i class="fa fa-car me-2"></i>Vehicle Details</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Vehicle Model <span class="text-danger">*</span></label>
                <select v-model="form.vehicle_model_id" class="form-select" required>
                  <option value="">-- Select Model --</option>
                  <option v-for="model in vehicleModels" :key="model.id" :value="model.id">
                    {{ model.full_name || `${model.make} ${model.model} ${model.variant || ''}`.trim() }}
                  </option>
                </select>
                <small class="text-muted">Select from pre-defined models or create a new one in Models tab</small>
              </div>
              <div class="col-md-6">
                <label class="form-label">Registration Number</label>
                <input v-model="form.registration_number" type="text" class="form-control" placeholder="KAA 100A" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Chassis/VIN Number</label>
                <input v-model="form.chassis_number" type="text" class="form-control" placeholder="VIN123456789" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Engine Number</label>
                <input v-model="form.engine_number" type="text" class="form-control" placeholder="ENG789012" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacture Year</label>
                <input v-model.number="form.manufacture_year" type="number" class="form-control" min="1900" :max="new Date().getFullYear() + 1" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Color</label>
                <input v-model="form.color" type="text" class="form-control" placeholder="White" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Fuel Type</label>
                <select v-model="form.fuel_used_id" class="form-select">
                  <option :value="null">-- Select Fuel --</option>
                  <option v-for="fuel in fuelItems" :key="fuel.id" :value="fuel.id">
                    {{ fuel.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Specs -->
        <div class="card mb-3">
          <div class="card-header bg-light py-2">
            <h6 class="mb-0"><i class="fa fa-cogs me-2"></i>Technical Specifications</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Engine Capacity (cc)</label>
                <input v-model.number="form.engine_capacity_cc" type="number" class="form-control" placeholder="4500" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tank Capacity (liters)</label>
                <input v-model.number="form.tank_capacity_liters" type="number" class="form-control" placeholder="138" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Axle Count</label>
                <input v-model.number="form.axle_count" type="number" class="form-control" min="1" max="10" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Gross Weight (kg)</label>
                <input v-model.number="form.gross_weight" type="number" class="form-control" placeholder="3500" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Tare Weight (kg)</label>
                <input v-model.number="form.tare_weight" type="number" class="form-control" placeholder="2400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Info -->
        <div class="card mb-3">
          <div class="card-header bg-light py-2">
            <h6 class="mb-0"><i class="fa fa-dollar-sign me-2"></i>Financial Information</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Acquisition Date <span class="text-danger">*</span></label>
                <input v-model="form.acquisition_date" type="date" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Available for Use Date</label>
                <input v-model="form.available_for_use_date" type="date" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Acquisition Cost <span class="text-danger">*</span></label>
                <input v-model.number="form.acquisition_cost" type="number" class="form-control" step="0.01" min="0" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Salvage Value</label>
                <input v-model.number="form.salvage_value" type="number" class="form-control" step="0.01" min="0" />
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mb-3">
          <label class="form-label">Description</label>
          <textarea v-model="form.description" class="form-control" rows="2" placeholder="Additional notes..."></textarea>
        </div>

        <!-- Active Status -->
        <div class="form-check mb-3">
          <input v-model="form.is_active" type="checkbox" class="form-check-input" id="is_active" />
          <label class="form-check-label" for="is_active">Active</label>
        </div>

        <!-- Buttons -->
        <div class="offcanvas-footer border-top pt-3 mt-auto asset-offcanvas-footer">
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" class="btn btn-outline-secondary" @click="closeOffcanvas">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fa fa-save me-2"></i>
              {{ saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import vehicleAssetService, { type VehicleAsset } from '@/services/vehicleAssetService'

const toast = useToast()

const props = defineProps<{
  isOpen: boolean
  vehicleToEdit?: VehicleAsset | null
  vehicleModels: any[]
  fuelItems: any[]
}>()

const emit = defineEmits<{
  close: []
  save: []
}>()

const saving = ref(false)
const error = ref('')

const form = ref<any>({
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

const isEditMode = computed(() => !!props.vehicleToEdit?.id)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.vehicleToEdit) {
        const v = props.vehicleToEdit
        const mv = v.motor_vehicle
        form.value = {
          code: v.code || generateCode(),
          vehicle_model_id: mv?.vehicle_model_id || '',
          registration_number: mv?.registration_number || '',
          chassis_number: mv?.chassis_number || '',
          engine_number: mv?.engine_number || '',
          manufacture_year: mv?.manufacture_year || null,
          color: mv?.color || '',
          fuel_used_id: mv?.fuel_used_id || null,
          engine_capacity_cc: mv?.engine_capacity_cc || null,
          tank_capacity_liters: mv?.tank_capacity_liters || null,
          axle_count: mv?.axle_count || null,
          gross_weight: mv?.gross_weight || null,
          tare_weight: mv?.tare_weight || null,
          acquisition_date: v.acquisition_date?.split('T')[0] || '',
          available_for_use_date: v.available_for_use_date?.split('T')[0] || '',
          acquisition_cost: v.acquisition_cost || 0,
          salvage_value: v.salvage_value || 0,
          description: v.description || '',
          is_active: v.is_active !== false
        }
      } else {
        resetForm()
      }
      error.value = ''
    }
  }
)

function generateCode() {
  const timestamp = Date.now().toString().slice(-6)
  return `VEH-${timestamp}`
}

function resetForm() {
  form.value = {
    code: generateCode(),
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

function closeOffcanvas() {
  resetForm()
  emit('close')
}

async function handleSubmit() {
  error.value = ''
  saving.value = true

  // Force status and ownership, and derive vehicle name from selected model (make + model + variant)
  form.value.status = 'ACTIVE'
  form.value.ownership = 'OWNED'
  const selectedModel = props.vehicleModels.find((m: any) => m.id === form.value.vehicle_model_id)
  form.value.name = selectedModel?.full_name || [selectedModel?.make, selectedModel?.model, selectedModel?.variant].filter(Boolean).join(' ')

  try {
    if (isEditMode.value && props.vehicleToEdit?.id) {
      await vehicleAssetService.updateVehicleAsset(props.vehicleToEdit.id, form.value)
      toast.success('Vehicle updated successfully')
    } else {
      await vehicleAssetService.createVehicleAsset(form.value)
      toast.success('Vehicle created successfully')
    }

    emit('save')
    resetForm()
  } catch (err: any) {
    let errorMsg = 'Failed to save vehicle'

    if (err.response) {
      if (err.response.status === 422) {
        const errors = err.response.data?.errors
        if (errors) {
          errorMsg = Object.values(errors).flat().join(', ')
        } else {
          errorMsg = err.response.data?.message || 'Validation error'
        }
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

defineExpose({ resetForm })
</script>

<style scoped>
:deep(.offcanvas) {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.asset-offcanvas-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.asset-offcanvas-footer {
  background: var(--bs-body-bg, #fff);
  position: sticky;
  bottom: 0;
}
</style>
