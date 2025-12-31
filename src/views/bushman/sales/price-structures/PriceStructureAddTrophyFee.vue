<template>
  <div class="price-structure-add-trophy-fee p-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>Add Trophy Fee</h4>
      <div>
        <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="back">
          <i class="fa fa-arrow-left me-1"></i> Back
        </button>
      </div>
    </div>

    <div class="form-container">
      <!-- Single Entry Form -->
      <div class="card">
        <div class="card-body">
          <form @submit.prevent="submit">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Species <span class="text-danger">*</span></label>
                <select v-model="form.species_id" class="form-select" required>
                  <option :value="null">Select Species</option>
                  <option v-for="s in speciesOptions" :key="s.id" :value="s.id">
                    {{ s.name }}{{ s.scientific_name ? ` (${s.scientific_name})` : '' }}
                  </option>
                </select>
              </div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Trophy Fee Item <span class="text-danger">*</span></label>
                <div class="d-flex gap-2 align-items-center mb-2">
                  <div class="form-check">
                    <input
                      id="item-mode-existing"
                      v-model="itemMode"
                      class="form-check-input"
                      type="radio"
                      value="existing"
                    />
                    <label class="form-check-label" for="item-mode-existing">Existing</label>
                  </div>
                  <div class="form-check">
                    <input
                      id="item-mode-new"
                      v-model="itemMode"
                      class="form-check-input"
                      type="radio"
                      value="new"
                    />
                    <label class="form-check-label" for="item-mode-new">New</label>
                  </div>
                </div>
                <div v-if="itemMode === 'existing'">
                  <select v-model="form.item_id" class="form-select" required>
                    <option :value="null">Select Trophy Fee Item</option>
                    <option v-for="i in trophyFeeItems" :key="i.id" :value="i.id">
                      {{ i.name }}
                    </option>
                  </select>
                </div>
                <div v-else class="border rounded p-2">
                  <input
                    v-model="form.item_name"
                    type="text"
                    class="form-control mb-2"
                    placeholder="New trophy fee item name"
                    required
                  />
                  <textarea
                    v-model="form.item_description"
                    class="form-control"
                    rows="2"
                    placeholder="Description (optional)"
                  ></textarea>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Hunting Area <span class="text-danger">*</span></label>
                <select v-model="form.area_id" class="form-select" required>
                  <option :value="null">Select Area</option>
                  <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>

              <div class="col-md-6">
              <label class="form-label">Currency <span class="text-danger">*</span></label>
              <select v-model="form.currency_id" class="form-select" required>
                <option :value="null">Select Currency</option>
                <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Amount <span class="text-danger">*</span></label>
              <input v-model.number="form.amount" type="number" step="0.01" class="form-control" required />

              <!-- Hunt Length Durations -->
              <div class="col-12">
                <label class="form-label">Available Hunt Durations <small class="text-muted">(Optional)</small></label>
                <small class="d-block text-muted mb-2">
                  Select which hunt lengths this trophy fee applies to. Leave all unchecked to apply to all durations.
                </small>
                <div class="border rounded p-3">
                  <div class="row">
                    <div v-for="huntLength in huntLengths" :key="huntLength.id" class="col-md-4 mb-2">
                      <div class="form-check">
                        <input
                          :id="`hunt-length-${huntLength.id}`"
                          v-model="form.durations"
                          type="checkbox"
                          class="form-check-input"
                          :value="huntLength.id"
                        />
                        <label class="form-check-label" :for="`hunt-length-${huntLength.id}`">
                          {{ getHuntLengthLabel(huntLength) }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div v-if="formError" class="alert alert-danger small py-2">{{ formError }}</div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <div class="page-footer d-flex justify-content-end">
        <button class="btn btn-primary ms-2" :disabled="saving || !canSave" @click="submit">Save</button>
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
  background-color: #f9f9f9;
  border-radius: 8px;
}

.price-structure-add-trophy-fee h4 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.price-structure-add-trophy-fee .form-container {
  padding: 1.5rem;
}

.price-structure-add-trophy-fee .form-label {
  font-weight: 600;
  color: #555;
}

.price-structure-add-trophy-fee .form-control {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s;
  background: #fff;
}

.price-structure-add-trophy-fee .form-select {
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
  background-position: calc(100% - 0.75rem) center;
  background-size: 0.9rem;
  cursor: pointer;
}

.price-structure-add-trophy-fee .form-control:focus,
.price-structure-add-trophy-fee .form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.12);
}

.price-structure-add-trophy-fee .btn {
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
}

.price-structure-add-trophy-fee .btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.price-structure-add-trophy-fee .btn-primary:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.price-structure-add-trophy-fee .page-footer {
  position: sticky;
  bottom: 0;
  padding: 0.75rem 1rem;
  z-index: 10;
  background: transparent;
  border-top: 1px solid rgba(0,0,0,0.04);
}

@media (max-width: 576px) {
  .price-structure-add-trophy-fee .page-footer { padding: 0.5rem; }
}
</style>

