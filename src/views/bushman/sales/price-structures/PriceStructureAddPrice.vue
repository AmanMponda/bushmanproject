<template>
  <div class="price-structure-add-price p-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>{{ title }}</h4>
      <div>
        <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="back"> <i class="fa fa-arrow-left me-1"></i> Back</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Hunt Length (days)</label>
              <select v-model="form.hunt_length_id" class="form-select" required>
                <option :value="null">Select Hunt Length</option>
                <option v-for="h in huntLengths" :key="h.id" :value="h.id">{{ getHuntLengthLabel(h) }}</option>
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
              <div v-if="formError" class="alert alert-danger small py-2">{{ formError }}</div>
            </div>
          </div>
        </form>
      </div>
      <div class="card-footer page-footer bg-white border-top d-flex justify-content-end">
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
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const store = usePriceStructuresStore()
const settingsStore = useSettingsStore()

const priceStructureId = Number(route.params.id)
// mode prop passed via route props
const mode = (route.params.mode as string) || (route.name === 'price-structure-companion-create' ? 'companion' : 'observer')

const title = mode === 'companion' ? 'Add Companion Price' : 'Add Observer Price'

const saving = ref(false)
const huntLengths = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const formError = ref('')

const form = ref<any>({ hunt_length_id: null, currency_id: null, amount: null })

onMounted(async () => {
  await Promise.all([store.getHuntLengths(), settingsStore.getCurrencies()])
  huntLengths.value = store.huntLengths
  currencyOptions.value = settingsStore.currencies || []
})

// Helper: render hunt length label without duplicating "days" when label already contains unit
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
  return !!f.hunt_length_id && !!f.currency_id && f.amount !== null && f.amount !== undefined && !isNaN(Number(f.amount)) && Number(f.amount) >= 0
})

const back = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'prices' } })
}

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    formError.value = 'Please fill required fields (Hunt length, Currency, Amount)'
    toast.init({ message: formError.value, color: 'warning' })
    return
  }

  saving.value = true
  try {
    const payload = { hunt_length_id: form.value.hunt_length_id, currency_id: form.value.currency_id, amount: Number(form.value.amount) }
    if (mode === 'companion') await store.createCompanionPrice(priceStructureId, payload)
    else await store.createObserverPrice(priceStructureId, payload)
    toast.init({ message: 'Price created', color: 'success' })
    router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'prices' } })
  } catch (err: any) {
    console.error('Failed to save price', err)
    formError.value = err?.response?.data?.message || err?.message || 'Failed to create price'
    toast.init({ message: formError.value, color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.price-structure-add-price { }
.price-structure-add-price .form-label { font-weight: 600 }

/* Sticky footer for forms */
.price-structure-add-price .page-footer {
  position: sticky;
  bottom: 0;
  padding: 0.75rem 1rem;
  z-index: 10;
  background: #fff;
}

@media (max-width: 576px) {
  .price-structure-add-price .page-footer { padding: 0.5rem; }
}
</style>