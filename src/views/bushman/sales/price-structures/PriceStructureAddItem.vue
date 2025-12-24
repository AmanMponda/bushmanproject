<template>
  <div class="price-structure-add-item p-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>Add Price Item</h4>
      <div>
        <button class="btn btn-outline-secondary text-nowrap btn-sm px-3 rounded-pill" @click="cancel">
          <i class="fa fa-arrow-left me-1"></i> Back
        </button>
      </div>
    </div>

    <div class="form-container">
      <form @submit.prevent="submit">
        <div class="row g-3">
          <!-- First row: Sales Package picker + Name -->
          <div class="col-md-6">
            <label class="form-label">Sales Packages</label>
            <div class="input-group">
              <select v-model="packagePickerId" class="form-select">
                <option :value="null">Select Sales Package</option>
                <option v-for="sp in salesPackageOptions" :key="sp.id" :value="sp.id">{{ sp.name }}</option>
              </select>
              <button class="btn btn-success" type="button" @click="addPackageFromPicker"><i class="fa fa-plus"></i></button>
            </div>
            <small class="text-muted">Select a package and click + to add.</small>
          </div>

          <div class="col-md-6">
            <label class="form-label">Name</label>
            <input v-model="form.name" class="form-control" required />
          </div>

          <!-- Added packages (still full-width below first row) -->
          <div class="col-12" v-if="form.additional_sales_package_ids && form.additional_sales_package_ids.length > 0">
            <label class="form-label">Added Packages</label>
            <div>
              <span v-for="id in form.additional_sales_package_ids" :key="id" class="badge bg-light text-dark me-2">
                {{ getSalesPackageName(id) }}
                <button type="button" class="btn btn-sm btn-link text-danger ms-2 p-0" @click="removeAdditionalPackage(id)">✕</button>
              </span>
            </div>
          </div>

          <!-- Second row: Hunt Length | Hunting Type (two per row) -->
          <div class="col-md-6 col-12">
            <label class="form-label">Hunt Length</label>
            <select v-model="form.hunt_length_id" class="form-select" required>
              <option :value="null">Select Hunt Length</option>
              <option v-for="h in huntLengths" :key="h.id" :value="h.id">{{ getHuntLengthLabel(h) }}</option>
            </select>
          </div>

          <div class="col-md-6 col-12">
            <label class="form-label">Hunting Type</label>
            <select v-model="form.hunting_type_id" class="form-select">
              <option :value="null">Select Hunting Type</option>
              <option v-for="ht in huntingTypes" :key="ht.id" :value="ht.id">{{ ht.name || ht.label || ht.text }}</option>
            </select>
          </div>

          <!-- Third row: Currency | Amount (two per row) -->
          <div class="col-md-6 col-12">
            <label class="form-label">Currency</label>
            <select v-model="form.currency_id" class="form-select">
              <option :value="null">Select Currency</option>
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
            </select>
          </div>

          <div class="col-md-6 col-12">
            <label class="form-label">Amount</label>
            <input v-model="form.amount" type="number" step="0.01" class="form-control" required />
          </div>

          <!-- Description stays full-width at the bottom -->
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-control" rows="2"></textarea>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = usePriceStructuresStore()
const priceListStore = usePriceListStore()
const settingsStore = useSettingsStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const huntLengths = ref<any[]>([])
const huntingTypes = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const salesPackageOptions = ref<any[]>([])

const form = ref<any>({
  name: '',
  hunting_type_id: null,
  hunt_length_id: null,
  currency_id: null,
  amount: null,
  description: '',
  sales_package_id: null,
  additional_sales_package_ids: []
})

const packagePickerId = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([
    store.getHuntLengths(),
    settingsStore.getHuntingsTypes(),
    settingsStore.getCurrencies(),
    priceListStore.getSalesPackageList(false)
  ])
  huntLengths.value = store.huntLengths
  const htRes = await settingsStore.getHuntingsTypes()
  huntingTypes.value = htRes.data?.data || htRes.data || []
  currencyOptions.value = settingsStore.currencies || []
  // Populate sales package options from priceListStore.salesPackages
  salesPackageOptions.value = priceListStore.salesPackages || []
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

// Note: hunt length days are shown inside the select label via `getHuntLengthLabel` — no separate days field needed

// Helpers for managing additional packages
const addPackageFromPicker = () => {
  const id = Number(packagePickerId.value)
  if (!id) {
    toast.init({ message: 'Select a package to add', color: 'warning' })
    return
  }
  const found = salesPackageOptions.value.find(sp => Number(sp.id) === id)
  if (!found) {
    toast.init({ message: 'No matching package found', color: 'warning' })
    return
  }
  if (!Array.isArray(form.value.additional_sales_package_ids)) form.value.additional_sales_package_ids = []
  if (!form.value.additional_sales_package_ids.includes(id)) {
    form.value.additional_sales_package_ids.push(id)
    packagePickerId.value = null
    toast.init({ message: `${found.name} added`, color: 'success' })
  } else {
    toast.init({ message: 'Package already added', color: 'info' })
  }
}

const removeAdditionalPackage = (id: number) => {
  form.value.additional_sales_package_ids = (form.value.additional_sales_package_ids || []).filter((x: number) => x !== id)
}

const getSalesPackageName = (id: number) => {
  const p = salesPackageOptions.value.find(sp => Number(sp.id) === Number(id))
  return p ? p.name : `#${id}`
}

const cancel = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'items' } })
} 

const submit = async () => {
  if (!form.value.name || !form.value.amount || !form.value.hunt_length_id) {
    toast.init({ message: 'Please fill required fields (Name, Amount, Hunt Length)', color: 'warning' })
    return
  }

  saving.value = true

  const salesPackages: number[] = Array.isArray(form.value.additional_sales_package_ids)
    ? Array.from(new Set(form.value.additional_sales_package_ids.map((n: any) => Number(n)).filter((n: number) => !isNaN(n))))
    : []

  const payload = {
    name: form.value.name,
    hunting_type_id: form.value.hunting_type_id || null,
    hunt_length_id: form.value.hunt_length_id || null,
    currency_id: form.value.currency_id || null,
    amount: form.value.amount !== null && form.value.amount !== undefined ? Number(form.value.amount) : null,
    description: form.value.description || '',
    sales_package_ids: salesPackages
  }

  try {
    await store.createItem(priceStructureId, payload)
    toast.init({ message: 'Item created', color: 'success' })
    router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'items' } })
  } catch (err: any) {
    console.error('Failed to create item:', err)
    toast.init({ message: err?.message || 'Failed to create item', color: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.price-structure-add-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  /* keep the outer rounded container but inputs will float on this background */
}

.price-structure-add-item h4 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

/* New: simple container replacing bootstrap card */
.price-structure-add-item .form-container {
  padding: 1.5rem;
}

.price-structure-add-item .form-label {
  font-weight: 600;
  color: #555;
}

.price-structure-add-item .form-control {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s;
  background: #fff; /* inputs remain white to keep contrast */
}

.price-structure-add-item .form-select {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s;
  background: #fff;
  /* Show a custom caret for select controls */
  padding-right: 2.25rem; /* leave space for caret */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'><path d='M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 1 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/></svg>");
  background-repeat: no-repeat;
  background-position: calc(100% - 2.25rem) center;
  background-size: 0.9rem;
  cursor: pointer;
}

.price-structure-add-item .form-control:focus,
.price-structure-add-item .form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.12);
}

.price-structure-add-item .btn {
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
}

.price-structure-add-item .btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.price-structure-add-item .btn-primary:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.price-structure-add-item .badge {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
}

.price-structure-add-item .badge button {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 0.75rem;
  margin-left: 0.5rem;
  cursor: pointer;
}

.price-structure-add-item .badge button:hover {
  color: #a71d2a;
}
/* Sticky footer for forms — transparent so inputs float on background */
.price-structure-add-item .page-footer {
  position: sticky;
  bottom: 0;
  padding: 0.75rem 1rem;
  z-index: 10;
  background: transparent;
  border-top: 1px solid rgba(0,0,0,0.04);
}

@media (max-width: 576px) {
  .price-structure-add-item .page-footer { padding: 0.5rem; }
}</style>