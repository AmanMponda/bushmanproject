<template>
  <div
    class="offcanvas offcanvas-end"
    v-show="isOpen"
    :class="{ show: isOpen }"
    tabindex="-1"
    :style="{ visibility: isOpen ? 'visible' : 'hidden', width: '500px' }"
  >
    <div class="offcanvas-header border-bottom">
      <h5 class="offcanvas-title">
        <i class="fa fa-car me-2 text-primary"></i>
        {{ isEditMode ? 'Edit Vehicle Model' : 'Create Vehicle Model' }}
      </h5>
      <button type="button" class="btn-close" @click="closeOffcanvas"></button>
    </div>

    <form @submit.prevent="handleSubmit" class="offcanvas-body model-offcanvas-body">
        <div v-if="error" class="alert alert-danger">
          <i class="fa fa-exclamation-circle me-2"></i>{{ error }}
        </div>

        <!-- Make -->
        <div class="mb-3">
          <label class="form-label">Make <span class="text-danger">*</span></label>
          <input
            v-model="form.make"
            type="text"
            class="form-control"
            placeholder="e.g., Toyota, Ford, Mercedes-Benz"
            maxlength="100"
            required
          />
        </div>

        <!-- Model -->
        <div class="mb-3">
          <label class="form-label">Model <span class="text-danger">*</span></label>
          <input
            v-model="form.model"
            type="text"
            class="form-control"
            placeholder="e.g., Land Cruiser, Hilux"
            maxlength="100"
            required
          />
        </div>

        <!-- Variant -->
        <div class="mb-3">
          <label class="form-label">Variant</label>
          <input
            v-model="form.variant"
            type="text"
            class="form-control"
            placeholder="e.g., V8, 4x4, Double Cab (optional)"
            maxlength="100"
          />
        </div>

        <!-- Type -->
        <div class="mb-3">
          <label class="form-label">Vehicle Type <span class="text-danger">*</span></label>
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

        <!-- Description -->
        <div class="mb-3">
          <label class="form-label">Description</label>
          <textarea
            v-model="form.description"
            class="form-control"
            rows="3"
            placeholder="Additional details about this model..."
          ></textarea>
        </div>

        <!-- Buttons -->
        <div class="offcanvas-footer border-top pt-3 mt-auto model-offcanvas-footer">
          <div class="d-flex gap-2">
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
import vehicleModelService, { type VehicleModel } from '@/services/vehicleModelService'

const toast = useToast()

const props = defineProps<{
  isOpen: boolean
  modelToEdit?: VehicleModel | null
}>()

const emit = defineEmits<{
  close: []
  save: [payload: Partial<VehicleModel>]
}>()

const saving = ref(false)
const error = ref('')

const form = ref<Partial<VehicleModel>>({
  make: '',
  model: '',
  variant: '',
  type: 'CAR',
  description: ''
})

const isEditMode = computed(() => !!props.modelToEdit?.id)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.modelToEdit) {
        form.value = { ...props.modelToEdit }
      } else {
        resetForm()
      }
      error.value = ''
    }
  }
)

function resetForm() {
  form.value = {
    make: '',
    model: '',
    variant: '',
    type: 'CAR',
    description: ''
  }
}

function closeOffcanvas() {
  resetForm()
  emit('close')
}

async function handleSubmit() {
  error.value = ''

  if (!form.value.make?.trim() || !form.value.model?.trim() || !form.value.type) {
    error.value = 'Make, Model, and Type are required'
    return
  }

  saving.value = true

  const payload: Partial<VehicleModel> = {
    make: form.value.make.trim(),
    model: form.value.model.trim(),
    variant: form.value.variant?.trim() || null,
    type: form.value.type as any,
    description: form.value.description?.trim() || null
  }

  try {
    if (isEditMode.value && props.modelToEdit?.id) {
      await vehicleModelService.updateVehicleModel(props.modelToEdit.id, payload)
      toast.success('Vehicle model updated successfully')
    } else {
      await vehicleModelService.createVehicleModel(payload)
      toast.success('Vehicle model created successfully')
    }

    emit('save', payload)
    resetForm()
  } catch (err: any) {
    let errorMsg = 'Failed to save vehicle model'

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

.model-offcanvas-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.model-offcanvas-footer {
  background: var(--bs-body-bg, #fff);
  position: sticky;
  bottom: 0;
}
</style>
