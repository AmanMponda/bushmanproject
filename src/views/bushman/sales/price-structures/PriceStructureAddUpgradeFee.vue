<template>
  <div class="price-structure-add-upgrade-fee p-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>Add Upgrade Fee</h4>
      <div>
        <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="cancel">
          <i class="fa fa-arrow-left me-1"></i> Back
        </button>
      </div>
    </div>

    <div class="form-container">
      <!-- Single Entry Form -->
      <form @submit.prevent="submit">
        <div class="row g-3">
          <!-- Row 1: Species | Trigger Condition -->
          <div class="col-md-6 col-12">
            <label class="form-label">Species</label>
            <select v-model="form.species_id" class="form-select" required>
              <option :value="null">Select Species</option>
              <option v-for="s in speciesOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="col-md-6 col-12">
            <label class="form-label">Upgrade Fee Item <span class="text-danger">*</span></label>
            <div class="d-flex gap-2 align-items-center mb-2">
              <div class="form-check">
                <input
                  id="upgrade-item-mode-existing"
                  v-model="itemMode"
                  class="form-check-input"
                  type="radio"
                  value="existing"
                />
                <label class="form-check-label" for="upgrade-item-mode-existing">Existing</label>
              </div>
              <div class="form-check">
                <input
                  id="upgrade-item-mode-new"
                  v-model="itemMode"
                  class="form-check-input"
                  type="radio"
                  value="new"
                />
                <label class="form-check-label" for="upgrade-item-mode-new">New</label>
              </div>
            </div>
            <div v-if="itemMode === 'existing'">
              <select v-model="form.item_id" class="form-select" required>
                <option :value="null">Select Upgrade Fee Item</option>
                <option v-for="i in upgradeFeeItems" :key="i.id" :value="i.id">
                  {{ i.name }}
                </option>
              </select>
            </div>
            <div v-else class="border rounded p-2">
              <input
                v-model="form.item_name"
                type="text"
                class="form-control mb-2"
                placeholder="New upgrade fee item name"
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

          <div class="col-md-6 col-12">
            <label class="form-label">Trigger Condition</label>
            <input v-model="form.trigger_condition" class="form-control" placeholder="e.g., Over Trophy Size" required />
          </div>

          <!-- Row 2: Currency | Fee Amount -->
          <div class="col-md-6 col-12">
            <label class="form-label">Currency</label>
            <select v-model="form.currency_id" class="form-select" required>
              <option :value="null">Select Currency</option>
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
            </select>
          </div>

          <div class="col-md-6 col-12">
            <label class="form-label">Fee Amount</label>
            <input v-model="form.fee_amount" type="number" step="0.01" class="form-control" required />
          </div>

          <!-- Row 3: Area (optional) -->
          <div class="col-md-6 col-12">
            <label class="form-label">Area (optional)</label>
            <select v-model="form.area_id" class="form-select">
              <option :value="null">none</option>
              <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>

          <div class="col-md-6 col-12"></div>

          <!-- Row 4: Notes full width -->
          <div class="col-12">
            <label class="form-label">Notes</label>
            <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Optional notes..."></textarea>
          </div>
        </div>
      </form>
      
      <div class="page-footer d-flex justify-content-end">
        <button class="btn btn-primary ms-2" :disabled="saving" @click="submit">Save</button>
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
  const hasItem = itemMode.value === 'existing' ? !!form.value.item_id : !!form.value.item_name
  if (!form.value.species_id || !hasItem || !form.value.trigger_condition || !form.value.fee_amount || !form.value.currency_id) {
    toast.init({ message: 'Please fill required fields (Species, Upgrade Fee Item, Trigger Condition, Fee Amount, Currency)', color: 'warning' })
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
    toast.init({ message: err?.response?.data?.message || err?.message || 'Failed to create upgrade fee', color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.price-structure-add-upgrade-fee {
  background-color: #f9f9f9;
  border-radius: 8px;
}

.price-structure-add-upgrade-fee h4 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.price-structure-add-upgrade-fee .form-container {
  padding: 1.5rem;
}

.price-structure-add-upgrade-fee .form-label {
  font-weight: 600;
  color: #555;
}

.price-structure-add-upgrade-fee .form-control {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s;
  background: #fff;
}

.price-structure-add-upgrade-fee .form-select {
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

.price-structure-add-upgrade-fee .form-control:focus,
.price-structure-add-upgrade-fee .form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.12);
}

.price-structure-add-upgrade-fee .btn {
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
}

.price-structure-add-upgrade-fee .btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.price-structure-add-upgrade-fee .btn-primary:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.price-structure-add-upgrade-fee .page-footer {
  position: sticky;
  bottom: 0;
  padding: 0.75rem 1rem;
  z-index: 10;
  background: transparent;
  border-top: 1px solid rgba(0,0,0,0.04);
}

@media (max-width: 576px) {
  .price-structure-add-upgrade-fee .page-footer { padding: 0.5rem; }
}
</style>
