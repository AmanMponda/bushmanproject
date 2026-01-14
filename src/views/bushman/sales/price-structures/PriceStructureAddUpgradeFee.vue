<template>
  <div class="upgrade-fee-form-compact">
    <!-- Header -->
    <div class="page-header-compact">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="fa fa-arrow-up me-2"></i>Add Upgrade Fee
        </h5>
        <button class="btn btn-sm btn-outline-secondary" @click="cancel">
          <i class="fa fa-arrow-left me-1"></i>Back
        </button>
      </div>
    </div>

    <!-- Compact Form -->
    <div class="form-compact-wrapper">
      <form @submit.prevent="submit">
        <!-- Form Fields with Icons -->
        <div class="row g-3 mb-3">
          <div class="col-md-12">
            <label class="form-label">Sales Package <span class="text-danger">*</span></label>
            <div class="input-with-icon">
              <span class="input-icon"><i class="fa fa-box"></i></span>
              <select 
                v-model="form.sales_package_id" 
                class="form-control"
                :class="{ 'is-invalid': formError && !form.sales_package_id }"
              >
                <option :value="null">Select package...</option>
                <option v-for="pkg in salesPackageOptions" :key="pkg.id" :value="pkg.id">
                  {{ pkg.name }} ({{ pkg.price_structure_detail_count }})
                </option>
              </select>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Species <span class="text-danger">*</span></label>
            <div class="input-with-icon">
              <span class="input-icon"><i class="fa fa-paw"></i></span>
              <select 
                v-model="form.species_id" 
                class="form-control"
                :class="{ 'is-invalid': formError && !form.species_id }"
              >
                <option :value="null">Select species...</option>
                <option v-for="s in speciesOptions" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Currency <span class="text-danger">*</span></label>
            <div class="input-with-icon">
              <span class="input-icon"><i class="fa fa-dollar-sign"></i></span>
              <select 
                v-model="form.currency_id" 
                class="form-control"
                :class="{ 'is-invalid': formError && !form.currency_id }"
              >
                <option :value="null">Select currency...</option>
                <option v-for="c in currencyOptions" :key="c.value" :value="c.value">
                  {{ c.text }}
                </option>
              </select>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Fee Amount <span class="text-danger">*</span></label>
            <div class="input-with-icon">
              <span class="input-icon"><i class="fa fa-calculator"></i></span>
              <input
                v-model.number="form.fee_amount"
                type="number"
                step="0.01"
                min="0"
                class="form-control text-end"
                :class="{ 'is-invalid': formError && (form.fee_amount === null || form.fee_amount === undefined) }"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Trigger Condition <span class="text-danger">*</span></label>
            <div class="input-with-icon">
              <span class="input-icon"><i class="fa fa-exclamation-circle"></i></span>
              <input
                v-model="form.trigger_condition"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formError && !form.trigger_condition }"
                placeholder="e.g., Trophy upgrade"
              />
            </div>
          </div>

          <div class="col-md-12">
            <label class="form-label">Notes</label>
            <div class="input-with-icon">
              <span class="input-icon"><i class="fa fa-align-left"></i></span>
              <textarea
                v-model="form.notes"
                class="form-control"
                rows="3"
                placeholder="Notes about this upgrade fee..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="formError" class="alert alert-danger alert-sm mb-3" role="alert">
          <i class="fa fa-exclamation-triangle me-2"></i>{{ formError }}
        </div>

        <!-- Action Buttons -->
        <div class="d-flex justify-content-end gap-2">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="cancel"
            :disabled="saving"
          >
            <i class="fa fa-times me-1"></i>Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="saving || !canSave"
          >
            <i class="fa" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'" :style="{ marginRight: '0.5rem' }"></i>
            {{ saving ? 'Saving...' : 'Save Upgrade Fee' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = usePriceStructuresStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const formError = ref('')

const speciesOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const salesPackageOptions = ref<any[]>([])

const form = ref<any>({
  species_id: null,
  trigger_condition: '',
  fee_amount: null,
  currency_id: null,
  sales_package_id: null,
  notes: ''
})

const canSave = computed(() => {
  const f = form.value
  return !!f.sales_package_id && !!f.species_id && !!f.trigger_condition && 
         f.fee_amount !== null && f.fee_amount !== undefined && 
         !isNaN(Number(f.fee_amount)) && Number(f.fee_amount) >= 0 && 
         !!f.currency_id
})

onMounted(async () => {
  try {
    const metadataUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees/creation-metadata`
    const metadataResp = await axios.get(metadataUrl, { params: { price_structure_id: priceStructureId } })
    const metadata = metadataResp?.data?.data || {}

    // Species - now simplified with only id and name
    const speciesList = Array.isArray(metadata.species) ? metadata.species : []
    speciesOptions.value = speciesList.map((item: any) => ({ id: item.id, name: item.name }))

    // Sales Packages - new field
    const packagesList = Array.isArray(metadata.sales_packages) ? metadata.sales_packages : []
    salesPackageOptions.value = packagesList.map((item: any) => ({
      id: item.id,
      name: item.name || item.description || `Package ${item.id}`,
      price_structure_detail_count: item.price_structure_detail_count || 0
    }))

    // Currencies
    const currencyList = Array.isArray(metadata.currencies) ? metadata.currencies : []
    currencyOptions.value = currencyList.map((item: any) => {
      const labelParts = []
      if (item.code) labelParts.push(item.code)
      if (item.name) labelParts.push(item.name)
      const text = labelParts.length > 0 ? labelParts.join(' - ') : (item.symbol || String(item.id))
      return { value: item.id, text }
    })

    // Prefill default currency
    form.value.currency_id = currencyOptions.value?.[0]?.value ?? null

  } catch (err) {
    console.error('Error loading upgrade fee form data:', err)
    toast.init({ message: 'Failed to load form data', color: 'danger' })
  }
})

const cancel = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
}

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    formError.value = 'Please fill required fields (Sales Package, Species, Trigger Condition, Fee Amount, Currency)'
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  saving.value = true

  const payload: any = {
    species_id: form.value.species_id,
    trigger_condition: form.value.trigger_condition,
    fee_amount: Number(form.value.fee_amount),
    currency_id: form.value.currency_id,
    notes: form.value.notes || '',
    price_structure_id: priceStructureId,
    sales_package_id: form.value.sales_package_id
  }

  try {
    const token = localStorage.getItem('token')
    const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees`
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    
    // Handle bulk creation response
    const result = response.data
    const count = result.count || (Array.isArray(result.data) ? result.data.length : 1)
    toast.init({ 
      message: `${count} upgrade fee${count > 1 ? 's' : ''} created successfully`, 
      color: 'success' 
    })
    
    router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
  } catch (err: any) {
    console.error('Failed to create upgrade fee:', err)
    formError.value = err?.response?.data?.message || err?.message || 'Failed to create upgrade fee'
    toast.init({ message: formError.value, color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.upgrade-fee-form-compact {
  background: #f8f9fa;
  min-height: 100vh;
  padding: 1rem;
}

/* Compact Header */
.page-header-compact {
  background: white;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.page-header-compact h5 {
  color: #2c3e50;
  font-weight: 600;
}

/* Form Wrapper */
.form-compact-wrapper {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Form Labels */
.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

/* Input with Icon Container */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: stretch;
}

.input-icon {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  background-color: transparent;
  border-right: 1px solid #dee2e6;
  z-index: 2;
  pointer-events: none;
}

.input-with-icon .form-control,
.input-with-icon select.form-control {
  padding-left: 50px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.input-with-icon textarea.form-control {
  padding-left: 50px;
  padding-top: 0.75rem;
}

.input-with-icon .form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
  outline: none;
}

.input-with-icon .form-control.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #004085;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
  border-color: #545b62;
}

/* Alert */
.alert-sm {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

/* Responsive */
@media (max-width: 768px) {
  .upgrade-fee-form-compact {
    padding: 0.5rem;
  }
  
  .form-compact-wrapper {
    padding: 1rem;
  }
}
</style>
