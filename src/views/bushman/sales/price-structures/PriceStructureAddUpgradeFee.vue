<template>
  <div class="price-structure-add-upgrade-fee">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h3 class="page-title">
            <i class="fa fa-level-up-alt me-2 text-primary"></i>Add Upgrade Fee
          </h3>
          <p class="text-muted mb-0">Create a new upgrade fee entry for the price structure</p>
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="cancel">
          <i class="fa fa-arrow-left me-2"></i>Back to List
        </button>
      </div>
    </div>

    <!-- Form Content -->
    <div class="form-wrapper">
      <div class="card shadow-sm border-0">
        <div class="card-body p-4">
          <form @submit.prevent="submit">
            <!-- Basic Information Section -->
            <div class="form-section mb-4">
              <h5 class="section-title">
                <i class="fa fa-info-circle me-2"></i>Basic Information
              </h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">
                    <i class="fa fa-paw me-1"></i>Species <span class="text-danger">*</span>
                  </label>
                  <select v-model="form.species_id" class="form-select" :class="{ 'is-invalid': formError && !form.species_id }" required>
                    <option :value="null">Select Species</option>
                    <option v-for="s in speciesOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <small class="form-text text-muted">Choose the species for this upgrade fee</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label">
                    <i class="fa fa-exclamation-circle me-1"></i>Trigger Condition <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="form.trigger_condition"
                    class="form-control"
                    :class="{ 'is-invalid': formError && !form.trigger_condition }"
                    placeholder="e.g., Over Trophy Size"
                    required
                  />
                  <small class="form-text text-muted">Specify the condition that triggers this fee</small>
                </div>
              </div>
            </div>

            <!-- Upgrade Fee Item Section -->
            <div class="form-section mb-4">
              <h5 class="section-title">
                <i class="fa fa-tag me-2"></i>Upgrade Fee Item
              </h5>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Item Type <span class="text-danger">*</span></label>
                  <div class="btn-group w-100 item-mode-toggle" role="group">
                    <input
                      id="upgrade-item-mode-existing"
                      v-model="itemMode"
                      class="btn-check"
                      type="radio"
                      value="existing"
                      autocomplete="off"
                    />
                    <label class="btn btn-outline-primary" for="upgrade-item-mode-existing">
                      <i class="fa fa-list me-2"></i>Use Existing Item
                    </label>

                    <input
                      id="upgrade-item-mode-new"
                      v-model="itemMode"
                      class="btn-check"
                      type="radio"
                      value="new"
                      autocomplete="off"
                    />
                    <label class="btn btn-outline-primary" for="upgrade-item-mode-new">
                      <i class="fa fa-plus me-2"></i>Create New Item
                    </label>
                  </div>
                </div>

                <div v-if="itemMode === 'existing'" class="col-12">
                  <label class="form-label">Select Upgrade Fee Item <span class="text-danger">*</span></label>
                  <select v-model="form.item_id" class="form-select" :class="{ 'is-invalid': formError && !form.item_id }" required>
                    <option :value="null">Choose from existing items...</option>
                    <option v-for="i in upgradeFeeItems" :key="i.id" :value="i.id">
                      {{ i.name }}
                    </option>
                  </select>
                  <small class="form-text text-muted">Select from previously created upgrade fee items</small>
                </div>

                <div v-else class="col-12">
                  <div class="new-item-card">
                    <div class="mb-3">
                      <label class="form-label">Item Name <span class="text-danger">*</span></label>
                      <input
                        v-model="form.item_name"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': formError && !form.item_name }"
                        placeholder="Enter upgrade fee item name"
                        required
                      />
                    </div>
                    <div>
                      <label class="form-label">Description <span class="text-muted">(Optional)</span></label>
                      <textarea
                        v-model="form.item_description"
                        class="form-control"
                        rows="3"
                        placeholder="Add a description for this upgrade fee item..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pricing Information Section -->
            <div class="form-section mb-4">
              <h5 class="section-title">
                <i class="fa fa-dollar-sign me-2"></i>Pricing Information
              </h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">
                    <i class="fa fa-money-bill-wave me-1"></i>Currency <span class="text-danger">*</span>
                  </label>
                  <select v-model="form.currency_id" class="form-select" :class="{ 'is-invalid': formError && !form.currency_id }" required>
                    <option :value="null">Select Currency</option>
                    <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">
                    <i class="fa fa-calculator me-1"></i>Fee Amount <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fa fa-dollar-sign"></i></span>
                    <input
                      v-model.number="form.fee_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="form-control"
                      :class="{ 'is-invalid': formError && (form.fee_amount === null || form.fee_amount === undefined) }"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <small class="form-text text-muted">Enter the upgrade fee amount</small>
                </div>
              </div>
            </div>

            <!-- Additional Details Section -->
            <div class="form-section mb-4">
              <h5 class="section-title">
                <i class="fa fa-clipboard me-2"></i>Additional Details
                <span class="badge bg-secondary ms-2">Optional</span>
              </h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">
                    <i class="fa fa-map-marker-alt me-1"></i>Area
                  </label>
                  <select v-model="form.area_id" class="form-select">
                    <option :value="null">None (use default)</option>
                    <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
                  </select>
                  <small class="form-text text-muted">Optionally specify a hunting area</small>
                </div>

                <div class="col-12">
                  <label class="form-label">
                    <i class="fa fa-sticky-note me-1"></i>Notes
                  </label>
                  <textarea
                    v-model="form.notes"
                    class="form-control"
                    rows="3"
                    placeholder="Add any additional notes or information..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="formError" class="alert alert-danger d-flex align-items-center" role="alert">
              <i class="fa fa-exclamation-triangle me-2"></i>
              <div>{{ formError }}</div>
            </div>
          </form>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-footer">
        <button type="button" class="btn btn-outline-secondary" @click="cancel" :disabled="saving">
          <i class="fa fa-times me-2"></i>Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSave" @click="submit">
          <span v-if="saving">
            <i class="fa fa-spinner fa-spin me-2"></i>Saving...
          </span>
          <span v-else>
            <i class="fa fa-check me-2"></i>Save Upgrade Fee
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { useQuotaStore } from '@/stores/bushman/quota-store'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = usePriceStructuresStore()
const settingsStore = useSettingsStore()
const quotaStore = useQuotaStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const formError = ref('')

const speciesOptions = ref<any[]>([])
const upgradeFeeItems = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const areaOptions = ref<any[]>([])
const priceStructureArea = ref<any>(null)
const itemMode = ref<'existing' | 'new'>('existing')

const form = ref<any>({
  species_id: null,
  item_id: null,
  item_name: '',
  item_description: '',
  trigger_condition: '',
  fee_amount: null,
  currency_id: null,
  area_id: null,
  notes: ''
})

const canSave = computed(() => {
  const f = form.value
  const hasItem = itemMode.value === 'existing' ? !!f.item_id : !!f.item_name
  return !!f.species_id && hasItem && !!f.trigger_condition && 
         f.fee_amount !== null && f.fee_amount !== undefined && 
         !isNaN(Number(f.fee_amount)) && Number(f.fee_amount) >= 0 && 
         !!f.currency_id
})

onMounted(async () => {
  try {
    // Load species and areas from quota store, currencies from settings
    const [speciesResp, areasResp] = await Promise.all([
      quotaStore.getSpeciesList(),
      quotaStore.getAreaList(),
    ])
    await settingsStore.getCurrencies()

    // Map to { id, name } for local selects
    const speciesList = Array.isArray(speciesResp?.data) ? speciesResp.data : (speciesResp?.data?.data || [])
    speciesOptions.value = speciesList.map((item: any) => ({ id: item.id, name: item.name }))

    const areasList = Array.isArray(areasResp?.data) ? areasResp.data : (areasResp?.data?.data || [])
    areaOptions.value = areasList.map((item: any) => {
      const location = item.location || {}
      const locationName = location.name || item.name || item.description || 'N/A'
      const locationCode = location.code ? ` (${location.code})` : ''
      return { id: item.id, name: `${locationName}${locationCode}` }
    })

    // currencies already shaped as { value, text }
    currencyOptions.value = settingsStore.currencies || []

    // Fallback fetch if currencies not loaded via store
    if (!currencyOptions.value || currencyOptions.value.length === 0) {
      try {
        const res = await fetch(import.meta.env.VITE_APP_BASE_URL + 'settings/currencies')
        const data = await res.json()
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        currencyOptions.value = list.map((item: any) => ({ value: item.id, text: item.name }))
      } catch (e) {
        console.warn('Fallback currencies fetch failed')
      }
    }

    // Fallback fetch if areas not loaded via quota store
    if (!areaOptions.value || areaOptions.value.length === 0) {
      try {
        const res = await fetch(import.meta.env.VITE_APP_BASE_URL + 'settings/hunting-areas')
        const data = await res.json()
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        areaOptions.value = list.map((item: any) => {
          const location = item.location || {}
          const locationName = location.name || item.name || item.description || 'N/A'
          const locationCode = location.code ? ` (${location.code})` : ''
          return { id: item.id, name: `${locationName}${locationCode}` }
        })
      } catch (e) {
        console.warn('Fallback areas fetch failed')
      }
    }

    // Load upgrade fee items
    try {
      const url = `${import.meta.env.VITE_APP_BASE_URL}settings/item-groups-items`
      const resp = await axios.get(url, { params: { name: 'Upgrade Fees', is_active: true } })
      const list = resp.data || []
      upgradeFeeItems.value = list.map((item: any) => ({
        id: item.id,
        name: item.name || item.item_name || ''
      }))
    } catch (e) {
      console.warn('Failed to load upgrade fee items')
    }

    // Load price structure to get its area
    await store.get(priceStructureId)
    priceStructureArea.value = store.current?.area_id || null

    // Prefill defaults
    form.value.currency_id = currencyOptions.value?.[0]?.value ?? null
    form.value.area_id = priceStructureArea.value ?? null

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
    formError.value = 'Please fill required fields (Species, Upgrade Fee Item, Trigger Condition, Fee Amount, Currency)'
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  saving.value = true

  const payload: any = {
    species_id: form.value.species_id,
    trigger_condition: form.value.trigger_condition,
    fee_amount: Number(form.value.fee_amount),
    currency_id: form.value.currency_id,
    area_id: form.value.area_id || priceStructureArea.value || null,
    notes: form.value.notes || '',
    price_structure_id: priceStructureId
  }

  if (itemMode.value === 'existing') {
    payload.item_id = form.value.item_id
  } else {
    payload.item_name = form.value.item_name
    if (form.value.item_description) {
      payload.item_description = form.value.item_description
    }
  }

  try {
    const token = localStorage.getItem('token')
    const url = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees/`
    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    toast.init({ message: 'Upgrade fee created', color: 'success' })
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
.price-structure-add-upgrade-fee {
  padding: 0;
}

/* Header Styles */
.page-header {
  background: white;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

/* Form Wrapper */
.form-wrapper {
  padding: 0 1.5rem 1.5rem;
}

.card {
  border-radius: 8px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* Form Sections */
.form-section {
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f2f5;
}

.form-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.section-title i {
  color: #007bff;
}

/* Form Elements */
.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.form-label i {
  color: #6c757d;
}

.form-control,
.form-select {
  border-radius: 8px;
  border: 2px solid #e0e6ed;
  padding: 0.625rem 1rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background-color: #fff;
}

.form-control:focus,
.form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
  background-color: #fff;
}

.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #dc3545;
}

.form-text {
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.input-group-text {
  background-color: #f8f9fa;
  border: 2px solid #e0e6ed;
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: #6c757d;
}

.input-group .form-control {
  border-left: none;
  border-radius: 0 8px 8px 0;
}

/* Item Mode Toggle */
.item-mode-toggle {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.item-mode-toggle .btn-outline-primary {
  border: 2px solid #007bff;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
}

.item-mode-toggle .btn-check:checked + .btn-outline-primary {
  background-color: #007bff;
  color: white;
}

/* New Item Card */
.new-item-card {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

/* Alert */
.alert {
  border-radius: 8px;
  border: none;
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
}

.alert-danger {
  background-color: #fff5f5;
  color: #c53030;
  border-left: 4px solid #dc3545;
}

/* Action Footer */
.action-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border-top: 1px solid #e9ecef;
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin: 0 -1.5rem -1.5rem;
}

.btn {
  border-radius: 8px;
  padding: 0.625rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  border: none;
  font-size: 0.95rem;
}

.btn i {
  font-size: 0.9rem;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #6c757d;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-outline-secondary {
  background: white;
  color: #6c757d;
  border: 2px solid #dee2e6;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #6c757d;
  color: #495057;
  transform: translateY(-1px);
}

.badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.65rem;
  font-weight: 600;
  border-radius: 6px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .price-structure-add-upgrade-fee {
    padding: 0;
  }

  .page-header {
    padding: 1rem 1rem;
    margin-bottom: 1rem;
  }

  .form-wrapper {
    padding: 0 1rem 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.35rem;
  }

  .card-body {
    padding: 1.5rem !important;
  }

  .action-footer {
    flex-direction: column;
    padding: 1rem;
    margin: 0 -1rem -1rem;
  }

  .action-footer .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .item-mode-toggle .btn-outline-primary {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }

  .section-title {
    font-size: 1rem;
  }
}
</style>
