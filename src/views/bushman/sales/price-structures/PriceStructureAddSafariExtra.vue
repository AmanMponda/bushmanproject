<template>
  <div class="price-structure-add-safari-extra p-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>Add Safari Extra</h4>
      <div>
        <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="back">
          <i class="fa fa-arrow-left me-1"></i> Back
        </button>
      </div>
    </div>

    <div class="form-container">
      <form @submit.prevent="submit">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Name</label>
            <input v-model="form.name" class="form-control" required />
          </div>

          <div class="col-md-6">
            <label class="form-label">Pricing Unit</label>
            <select v-model="form.pricing_unit" class="form-select" required>
              <option :value="null">Select Pricing Unit</option>
              <option value="FLAT">Flat</option>
              <option value="PER_DAY">Per Day</option>
              <option value="PER_NIGHT">Per Night</option>
              <option value="PER_PERSON_PER_DAY">Per Person/Day</option>
              <option value="PER_ITEM">Per Item</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Currency</label>
            <select v-model="form.currency_id" class="form-select" required>
              <option :value="null">Select Currency</option>
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Amount</label>
            <input v-model.number="form.amount" type="number" step="0.01" class="form-control" required />
          </div>

          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-control" rows="2"></textarea>
          </div>

          <div class="col-12">
            <label class="form-label">Notes</label>
            <textarea v-model="form.notes" class="form-control" rows="2"></textarea>
          </div>

          <div class="col-12">
            <div v-if="formError" class="alert alert-danger small py-2">{{ formError }}</div>
          </div>
        </div>
      </form>

      <div class="page-footer d-flex justify-content-end">
        <button class="btn btn-primary ms-2" :disabled="saving || !canSave" @click="submit">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { useToast } from '@/composables/useToast'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const settingsStore = useSettingsStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const currencyOptions = ref<any[]>([])
const formError = ref('')

const form = ref<any>({
  name: '',
  pricing_unit: null,
  currency_id: null,
  amount: null,
  description: '',
  notes: ''
})

onMounted(async () => {
  await settingsStore.getCurrencies()
  currencyOptions.value = settingsStore.currencies || []
})

const canSave = computed(() => {
  const f = form.value
  return !!f.name && !!f.pricing_unit && !!f.currency_id && f.amount !== null && f.amount !== undefined && !isNaN(Number(f.amount))
})

const back = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'safari-extras' } })
}

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    formError.value = 'Please fill required fields (Name, Pricing Unit, Currency, Amount)'
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  saving.value = true
  try {
    const payload = {
      price_structure_id: priceStructureId,
      name: form.value.name,
      pricing_unit: form.value.pricing_unit,
      currency_id: form.value.currency_id,
      amount: Number(form.value.amount),
      description: form.value.description || '',
      notes: form.value.notes || ''
    }

    const url = import.meta.env.VITE_APP_BASE_URL + 'settings/price-structure-safari-extras'
    await axios.post(url, payload)

    toast.init({ message: 'Safari extra created', color: 'success' })
    router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'safari-extras' } })
  } catch (err: any) {
    console.error('Failed to create safari extra:', err)
    formError.value = err?.response?.data?.message || err?.message || 'Failed to create safari extra'
    toast.init({ message: formError.value, color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.price-structure-add-safari-extra {
  background-color: #f9f9f9;
  border-radius: 8px;
}

.price-structure-add-safari-extra h4 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.price-structure-add-safari-extra .form-container {
  padding: 1.5rem;
}

.price-structure-add-safari-extra .form-label {
  font-weight: 600;
  color: #555;
}

.price-structure-add-safari-extra .form-control {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s;
  background: #fff;
}

.price-structure-add-safari-extra .form-select {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s;
  background: #fff;
  padding-right: 2.25rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'><path d='M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 1 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/></svg>");
  background-repeat: no-repeat;
  background-position: calc(100% - 2.25rem) center;
  background-size: 0.9rem;
  cursor: pointer;
}

.price-structure-add-safari-extra .form-control:focus,
.price-structure-add-safari-extra .form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.12);
}

.price-structure-add-safari-extra .page-footer {
  position: sticky;
  bottom: 0;
  padding: 0.75rem 1rem;
  z-index: 10;
  background: transparent;
  border-top: 1px solid rgba(0,0,0,0.04);
}

@media (max-width: 576px) {
  .price-structure-add-safari-extra .page-footer { padding: 0.5rem; }
}
</style>
