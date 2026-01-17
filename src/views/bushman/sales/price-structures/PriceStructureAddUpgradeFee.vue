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
        <div class="row g-2 mb-2">
          <div class="col-md-12">
            <label class="form-label">Sales Package</label>
            <div class="package-input-row">
              <div class="input-with-icon package-input">
                <span class="input-icon"><i class="fa fa-box"></i></span>
                <select 
                  v-model="selectedPackageId" 
                  class="form-control"
                >
                  <option :value="null">Select package...</option>
                  <option
                    v-for="pkg in availablePackages"
                    :key="pkg.id"
                    :value="pkg.id"
                  >
                    {{ pkg.name }} ({{ pkg.price_structure_detail_count }})
                  </option>
                </select>
              </div>
              <button
                type="button"
                class="btn package-add-btn"
                :disabled="!selectedPackageId"
                @click="addSelectedPackage"
                aria-label="Add package"
              >
                <i class="fa fa-plus"></i>
              </button>
            </div>
            <div v-if="selectedPackages.length" class="package-selected">
              <div
                v-for="pkg in selectedPackages"
                :key="pkg.id"
                class="package-pill"
              >
                <span class="package-pill__name">{{ pkg.name }}</span>
                <span class="package-pill__count">{{ pkg.price_structure_detail_count }}</span>
                <button
                  type="button"
                  class="package-pill__remove"
                  @click="removeSelectedPackage(pkg.id)"
                  aria-label="Remove package"
                >
                  <i class="fa fa-times"></i>
                </button>
              </div>
            </div>
            <div class="form-text">
              Optional: select one or more packages to create one fee per package detail.
              <span v-if="selectedPackages.length">({{ selectedPackages.length }} selected)</span>
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
        <div class="d-flex justify-content-end gap-1">
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            @click="cancel"
            :disabled="saving"
          >
            <i class="fa fa-times me-1"></i>Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary btn-sm" 
            :disabled="saving || !canSave"
          >
            <i class="fa" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'" :style="{ marginRight: '0.35rem' }"></i>
            {{ saving ? 'Saving...' : 'Save' }}
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
const selectedPackageId = ref<number | null>(null)

const form = ref<any>({
  species_id: null,
  trigger_condition: '',
  fee_amount: null,
  currency_id: null,
  sales_package_ids: [],
  notes: ''
})

const canSave = computed(() => {
  const f = form.value
  return !!f.species_id && !!f.trigger_condition && 
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

const availablePackages = computed(() => {
  const selectedIds = new Set(form.value.sales_package_ids || [])
  return (salesPackageOptions.value || []).filter((pkg: any) => !selectedIds.has(pkg.id))
})

const selectedPackages = computed(() => {
  const selectedIds = new Set(form.value.sales_package_ids || [])
  return (salesPackageOptions.value || []).filter((pkg: any) => selectedIds.has(pkg.id))
})

const addSelectedPackage = () => {
  const id = Number(selectedPackageId.value)
  if (!id) return
  const ids = Array.isArray(form.value.sales_package_ids) ? form.value.sales_package_ids : []
  if (!ids.includes(id)) {
    form.value.sales_package_ids = [...ids, id]
  }
  selectedPackageId.value = null
}

const removeSelectedPackage = (id: number) => {
  const ids = Array.isArray(form.value.sales_package_ids) ? form.value.sales_package_ids : []
  form.value.sales_package_ids = ids.filter((pkgId: number) => pkgId !== id)
}

const cancel = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
}

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    formError.value = 'Please fill required fields (Species, Trigger Condition, Fee Amount, Currency)'
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
  }
  const packageIds = Array.isArray(form.value.sales_package_ids) ? form.value.sales_package_ids : []
  if (packageIds.length > 0) {
    payload.sales_package_ids = packageIds
  }
  if (packageIds.length === 1) {
    payload.sales_package_id = packageIds[0]
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
    const data = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []
    const count = result?.count || (data.length > 0 ? data.length : 1)
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
  min-height: auto;
  padding: 0.5rem;
}

/* Compact Header */
.page-header-compact {
  background: white;
  padding: 0.6rem 0.9rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.page-header-compact h5 {
  color: #2c3e50;
  font-weight: 600;
}

/* Form Wrapper */
.form-compact-wrapper {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Form Labels */
.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
  font-size: 0.8125rem;
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
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  background-color: transparent;
  border-right: 1px solid #e9ecef;
  z-index: 2;
  pointer-events: none;
}

.input-with-icon .form-control,
.input-with-icon select.form-control {
  padding-left: 44px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  font-size: 0.875rem;
  transition: all 0.14s ease;
}

.input-with-icon textarea.form-control {
  padding-left: 44px;
  padding-top: 0.5rem;
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

/* Package selector with add button */
.package-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.package-input {
  flex: 1;
}

.package-add-btn {
  width: 36px;
  border-radius: 4px;
  background: #2f3a44;
  color: #ffffff;
  border: 1px solid #2f3a44;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.package-add-btn:hover:not(:disabled) {
  background: #1f2830;
  border-color: #1f2830;
}

.package-add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.package-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.package-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: #eef2f7;
  color: #2c3e50;
  border: 1px solid #d7dee8;
}

.package-pill__name {
  font-weight: 600;
  font-size: 0.8rem;
}

.package-pill__count {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.08rem 0.3rem;
  border-radius: 999px;
  background: #d9e7ff;
  color: #1b5fbf;
}

.package-pill__remove {
  border: none;
  background: transparent;
  color: #6c757d;
  padding: 0;
  line-height: 1;
}

.package-pill__remove:hover {
  color: #2f3a44;
}

/* Buttons */
.btn {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.14s ease;
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
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 4px;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

/* Responsive */
@media (max-width: 768px) {
  .upgrade-fee-form-compact {
    padding: 0.25rem;
  }
  
  .form-compact-wrapper {
    padding: 0.6rem;
  }
}
</style>
