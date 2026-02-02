<template>
  <StandardModal
    :id="id"
    ref="modalRef"
    :title="title"
    size="xl"
    :scrollable="true"
    :show-footer="false"
    @close="emit('close')"
    @hidden="emit('hidden')"
  >
    <div class="mb-2 text-muted small">
      {{ subtitle }}
    </div>
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
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" @click="emit('save')" :disabled="savingVehicle">
        <span v-if="savingVehicle" class="spinner-border spinner-border-sm me-1"></span>
        {{ title.includes('Edit') ? 'Update' : 'Create' }}
      </button>
    </div>
  </StandardModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StandardModal from '@/components/plugins/StandardModal.vue'

defineProps<{
  id: string
  title: string
  subtitle: string
  vehicleForm: any
  vehicleModels: any[]
  fuelItems: any[]
  vehicleFormError: string
  savingVehicle: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'close'): void
  (e: 'hidden'): void
}>()

const modalRef = ref<{ show: () => void; hide: () => void } | null>(null)

const show = () => modalRef.value?.show()
const hide = () => modalRef.value?.hide()

defineExpose({ show, hide })
</script>
