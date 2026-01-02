<template>
  <div class="price-structure-add-trophy-fee">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h3 class="page-title">
            <i class="fa fa-trophy me-2 text-primary"></i>Add Trophy Fee
          </h3>
          <p class="text-muted mb-0">Create a new trophy fee entry for the price structure</p>
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="back">
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
                    <option v-for="s in speciesOptions" :key="s.id" :value="s.id">
                      {{ s.name }}{{ s.scientific_name ? ` (${s.scientific_name})` : '' }}
                    </option>
                  </select>
                  <small class="form-text text-muted">Choose the species for this trophy fee</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label">
                    <i class="fa fa-map-marker-alt me-1"></i>Hunting Area <span class="text-danger">*</span>
                  </label>
                  <select v-model="form.area_id" class="form-select" :class="{ 'is-invalid': formError && !form.area_id }" required>
                    <option :value="null">Select Area</option>
                    <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
                  </select>
                  <small class="form-text text-muted">Select the hunting area</small>
                </div>
              </div>
            </div>

            <!-- Trophy Fee Item Section -->
            <div class="form-section mb-4">
              <h5 class="section-title">
                <i class="fa fa-tag me-2"></i>Trophy Fee Item
              </h5>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Item Type <span class="text-danger">*</span></label>
                  <div class="btn-group w-100 item-mode-toggle" role="group">
                    <input
                      id="item-mode-existing"
                      v-model="itemMode"
                      class="btn-check"
                      type="radio"
                      value="existing"
                      autocomplete="off"
                    />
                    <label class="btn btn-outline-primary" for="item-mode-existing">
                      <i class="fa fa-list me-2"></i>Use Existing Item
                    </label>

                    <input
                      id="item-mode-new"
                      v-model="itemMode"
                      class="btn-check"
                      type="radio"
                      value="new"
                      autocomplete="off"
                    />
                    <label class="btn btn-outline-primary" for="item-mode-new">
                      <i class="fa fa-plus me-2"></i>Create New Item
                    </label>
                  </div>
                </div>

                <div v-if="itemMode === 'existing'" class="col-12">
                  <label class="form-label">Select Trophy Fee Item <span class="text-danger">*</span></label>
                  <select v-model="form.item_id" class="form-select" :class="{ 'is-invalid': formError && !form.item_id }" required>
                    <option :value="null">Choose from existing items...</option>
                    <option v-for="i in trophyFeeItems" :key="i.id" :value="i.id">
                      {{ i.name }}
                    </option>
                  </select>
                  <small class="form-text text-muted">Select from previously created trophy fee items</small>
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
                        placeholder="Enter trophy fee item name"
                        required
                      />
                    </div>
                    <div>
                      <label class="form-label">Description <span class="text-muted">(Optional)</span></label>
                      <textarea
                        v-model="form.item_description"
                        class="form-control"
                        rows="3"
                        placeholder="Add a description for this trophy fee item..."
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
                    <i class="fa fa-calculator me-1"></i>Amount <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fa fa-dollar-sign"></i></span>
                    <input
                      v-model.number="form.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="form-control"
                      :class="{ 'is-invalid': formError && (form.amount === null || form.amount === undefined) }"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <small class="form-text text-muted">Enter the trophy fee amount</small>
                </div>
              </div>
            </div>

            <!-- Hunt Duration Section -->
            <div class="form-section mb-4">
              <h5 class="section-title">
                <i class="fa fa-clock me-2"></i>Hunt Durations
                <span class="badge bg-secondary ms-2">Optional</span>
              </h5>
              <p class="text-muted mb-3">
                <i class="fa fa-info-circle me-1"></i>
                Select which hunt lengths this trophy fee applies to. Leave all unchecked to apply to all durations.
              </p>
              <div class="durations-grid">
                <div v-for="huntLength in huntLengths" :key="huntLength.id" class="duration-item">
                  <input
                    :id="`hunt-length-${huntLength.id}`"
                    v-model="form.durations"
                    type="checkbox"
                    class="form-check-input"
                    :value="huntLength.id"
                  />
                  <label class="form-check-label" :for="`hunt-length-${huntLength.id}`">
                    <i class="fa fa-calendar-day me-1"></i>{{ getHuntLengthLabel(huntLength) }}
                  </label>
                </div>
              </div>
              <div v-if="form.durations.length > 0" class="mt-2">
                <small class="text-success">
                  <i class="fa fa-check-circle me-1"></i>
                  {{ form.durations.length }} duration{{ form.durations.length > 1 ? 's' : '' }} selected
                </small>
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
        <button type="button" class="btn btn-outline-secondary" @click="back" :disabled="saving">
          <i class="fa fa-times me-2"></i>Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSave" @click="submit">
          <span v-if="saving">
            <i class="fa fa-spinner fa-spin me-2"></i>Saving...
          </span>
          <span v-else>
            <i class="fa fa-check me-2"></i>Save Trophy Fee
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { useQuotaStore } from '@/stores/bushman/quota-store'
import { useToast } from '@/composables/useToast'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const store = usePriceStructuresStore()
const settingsStore = useSettingsStore()
const quotaStore = useQuotaStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const speciesOptions = ref<any[]>([])
const trophyFeeItems = ref<any[]>([])
const areaOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const huntLengths = ref<any[]>([])
const formError = ref('')
const itemMode = ref<'existing' | 'new'>('existing')

const form = ref<any>({
  species_id: null,
  item_id: null,
  item_name: '',
  item_description: '',
  area_id: null,
  currency_id: null,
  amount: null,
  price_structure_id: priceStructureId,
  durations: [] as number[]
})

onMounted(async () => {
  await Promise.all([
    store.getHuntLengths(),
    settingsStore.getCurrencies(),
    loadSpecies(),
    loadAreas(),
    loadTrophyFeeItems()
  ])
  huntLengths.value = store.huntLengths
  currencyOptions.value = settingsStore.currencies || []
})

const loadSpecies = async () => {
  try {
    const response = await quotaStore.getSpeciesList()
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || [])
    speciesOptions.value = list.map((item: any) => ({
      id: item.id,
      name: item.name,
      scientific_name: item.scientific_name || null
    }))
  } catch (error) {
    console.error('Failed to load species:', error)
  }
}

const loadAreas = async () => {
  try {
    const response = await quotaStore.getAreaList()
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || [])
    areaOptions.value = list.map((item: any) => {
      const location = item.location || {}
      const locationName = location.name || item.name || item.description || 'N/A'
      const locationCode = location.code ? ` (${location.code})` : ''
      return { id: item.id, name: `${locationName}${locationCode}` }
    })
  } catch (error) {
    console.error('Failed to load areas:', error)
  }
}

const loadTrophyFeeItems = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/item-groups-items`
    const response = await axios.get(url, { params: { name: 'Trophy Fees', is_active: true } })
    const list = response.data || []
    trophyFeeItems.value = list.map((item: any) => ({
      id: item.id,
      name: item.name || item.item_name || ''
    }))
  } catch (error) {
    console.error('Failed to load trophy fee items:', error)
  }
}

const getHuntLengthLabel = (h: any) => {
  const label = h?.label || h?.name || ''
  const days = h?.days || h?.hunt_length_days || null
  if (label && /\b\d+\s*day(s)?\b/i.test(label)) return label
  if (label) return label
  if (days) return `${days} days`
  return ''
}

const canSave = computed(() => {
  const f = form.value
  const hasItem = itemMode.value === 'existing' ? !!f.item_id : !!f.item_name
  return !!f.species_id && hasItem && !!f.area_id && !!f.currency_id && 
         f.amount !== null && f.amount !== undefined && 
         !isNaN(Number(f.amount)) && Number(f.amount) >= 0
})

const back = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'trophy-fees' } })
}

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    formError.value = 'Please fill required fields (Species, Trophy Fee Item, Area, Currency, Amount)'
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  saving.value = true
  try {
    const payload: any = {
      species_id: form.value.species_id,
      area_id: form.value.area_id,
      currency_id: form.value.currency_id,
      amount: Number(form.value.amount),
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

    // Add durations if selected
    if (form.value.durations && form.value.durations.length > 0) {
      payload.durations = form.value.durations.map((huntLengthId: number) => ({
        hunt_length_id: huntLengthId,
        is_allowed: true
      }))
    }

    const token = localStorage.getItem('token')
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees`
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    if (response.status === 201 || response.status === 200) {
      toast.init({ message: 'Trophy fee created successfully', color: 'success' })
      router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'trophy-fees' } })
    }
  } catch (err: any) {
    console.error('Failed to save trophy fee', err)
    formError.value = err?.response?.data?.message || err?.message || 'Failed to create trophy fee'
    toast.init({ message: formError.value, color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.price-structure-add-trophy-fee {
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

/* Durations Grid */
.durations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.duration-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 6px;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
  cursor: pointer;
}

.duration-item:hover {
  border-color: #007bff;
  background: #f0f7ff;
}

.duration-item input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.duration-item input[type="checkbox"]:checked {
  background-color: #007bff;
  border-color: #007bff;
}

.duration-item label {
  cursor: pointer;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  flex: 1;
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
  .price-structure-add-trophy-fee {
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

  .durations-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
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

