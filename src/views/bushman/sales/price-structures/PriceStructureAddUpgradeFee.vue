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

    <!-- Tabs: CSV Import | Single Form -->
    <div class="mb-3">
      <ul class="nav nav-tabs border-bottom">
        <li class="nav-item">
          <button
            type="button"
            class="nav-link"
            :class="{ active: inputMode === 'csv' }"
            @click="inputMode = 'csv'"
          >
            <i class="fa fa-file-csv me-2"></i> Import CSV
          </button>
        </li>
        <li class="nav-item">
          <button
            type="button"
            class="nav-link"
            :class="{ active: inputMode === 'single' }"
            @click="inputMode = 'single'"
          >
            <i class="fa fa-edit me-2"></i> Single Entry
          </button>
        </li>
      </ul>
    </div>

    <div class="form-container">
      <!-- Single Entry Form -->
      <form v-if="inputMode === 'single'" @submit.prevent="submit">
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

      <!-- CSV Import Section -->
      <div v-else-if="inputMode === 'csv'" class="csv-import-section">
        <h6 class="mb-3 d-flex align-items-center gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="fa fa-file-csv text-success"></i>
            <span>Bulk Import Upgrade Fees</span>
          </div>
          <button type="button" class="btn btn-sm btn-outline-success ms-auto" @click="downloadUpgradeFeeTemplate">
            <i class="fa fa-download me-1"></i>
            Download Template
          </button>
        </h6>

        <!-- Currency and Area Selection -->
        <div class="row g-3 mb-3">
          <div class="col-md-6 col-12">
            <label class="form-label">Currency</label>
            <select v-model="csvFormDefaults.currency_id" class="form-select" required>
              <option :value="null">Select Currency</option>
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
            </select>
            <small v-if="!currencyOptions || currencyOptions.length === 0" class="text-muted">No currencies loaded</small>
          </div>

          <div class="col-md-6 col-12">
            <label class="form-label">Area (optional)</label>
            <select v-model="csvFormDefaults.area_id" class="form-select">
              <option :value="null">none</option>
              <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
            <small v-if="!areaOptions || areaOptions.length === 0" class="text-muted">No areas loaded</small>
          </div>
        </div>

        <UpgradeFeesCSVInput
          ref="csvInputRef"
          @rows-loaded="handleCsvImport"
        />

        <!-- Import Progress -->
        <div v-if="savingCsv" class="mt-3">
          <div class="progress" style="height: 22px;">
            <div
              class="progress-bar"
              role="progressbar"
              :style="{ width: csvProgressPercent + '%' }"
              :aria-valuenow="csvProgressPercent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {{ csvProgress.processed }} / {{ csvProgress.total }}
            </div>
          </div>
          <div class="mt-2 small text-muted">
            <span class="me-3">Success: {{ csvProgress.success }}</span>
            <span>Failed: {{ csvProgress.failed }}</span>
          </div>
        </div>
      </div>
      
      <div class="page-footer d-flex justify-content-end">
        <button v-if="inputMode === 'single'" class="btn btn-primary ms-2" :disabled="saving" @click="submit">Save</button>
        <button v-else-if="inputMode === 'csv' && csvInputRef?.csvRows?.length > 0" class="btn btn-primary ms-2" :disabled="savingCsv" @click="submitCsvImport">Import Selected</button>
        <button v-else-if="inputMode === 'csv'" class="btn btn-primary ms-2" disabled>No rows loaded</button>
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
import UpgradeFeesCSVInput from './UpgradeFeesCSVInput.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = usePriceStructuresStore()
const settingsStore = useSettingsStore()
const quotaStore = useQuotaStore()

const priceStructureId = Number(route.params.id)

const saving = ref(false)
const savingCsv = ref(false)
const inputMode = ref<'single' | 'csv'>('csv')

const speciesOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const areaOptions = ref<any[]>([])
const priceStructureArea = ref<any>(null)

const form = ref<any>({
  species_id: null,
  trigger_condition: '',
  fee_amount: null,
  currency_id: null,
  area_id: null,
  notes: ''
})

const csvImportedFees = ref<any[]>([])
const csvInputRef = ref<any>(null)

const csvFormDefaults = ref<any>({
  currency_id: null,
  area_id: null
})

const csvProgress = ref({ total: 0, processed: 0, success: 0, failed: 0 })
const csvProgressPercent = computed(() => csvProgress.value.total ? Math.round((csvProgress.value.processed / csvProgress.value.total) * 100) : 0)

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

    // Load price structure to get its area
    await store.get(priceStructureId)
    priceStructureArea.value = store.current?.area_id || null

    // Prefill defaults
    form.value.currency_id = currencyOptions.value?.[0]?.value ?? null
    form.value.area_id = priceStructureArea.value ?? null
    csvFormDefaults.value.currency_id = form.value.currency_id
    csvFormDefaults.value.area_id = form.value.area_id
  } catch (err) {
    console.error('Error loading upgrade fee form data:', err)
    toast.init({ message: 'Failed to load form data', color: 'danger' })
  }
})

const cancel = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
}

const submit = async () => {
  if (!form.value.species_id || !form.value.trigger_condition || !form.value.fee_amount || !form.value.currency_id) {
    toast.init({ message: 'Please fill required fields (Species, Trigger Condition, Fee Amount, Currency)', color: 'warning' })
    return
  }

  saving.value = true

  const payload = {
    species_id: form.value.species_id,
    trigger_condition: form.value.trigger_condition,
    fee_amount: Number(form.value.fee_amount),
    currency_id: form.value.currency_id,
    area_id: form.value.area_id || priceStructureArea.value || null,
    notes: form.value.notes || ''
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
    toast.init({ message: err?.message || 'Failed to create upgrade fee', color: 'danger' })
  } finally {
    saving.value = false
  }
}

const handleCsvImport = (rows: any[]) => {
  csvImportedFees.value = rows
  console.log('CSV rows ready:', rows)
}

const submitCsvImport = async () => {
  const selectedRows = csvInputRef.value?.getSelectedRows() || []
  if (selectedRows.length === 0) {
    toast.init({ message: 'No rows selected for import', color: 'warning' })
    return
  }

  // Validate that currency is selected for CSV import
  if (!csvFormDefaults.value.currency_id) {
    toast.init({ message: 'Please select a currency for CSV import', color: 'warning' })
    return
  }

  savingCsv.value = true

  // Initialize progress
  csvProgress.value.total = selectedRows.length
  csvProgress.value.processed = 0
  csvProgress.value.success = 0
  csvProgress.value.failed = 0

  try {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL + `settings/upgrade-fees/`
    let successCount = 0
    let failedCount = 0

    for (const row of selectedRows) {
      try {
        const payload = {
          species_id: Number(row.species_id),
          trigger_condition: String(row.trigger_condition || '').trim(),
          fee_amount: Number(row.fee_amount),
          currency_id: csvFormDefaults.value.currency_id,
          area_id: csvFormDefaults.value.area_id || priceStructureArea.value || null,
          notes: String(row.notes || '').trim(),
          price_structure_id: priceStructureId
        }

        // Validate required fields including currency_id
        if (!payload.species_id || !payload.trigger_condition || !payload.fee_amount || !payload.currency_id) {
          console.warn('Skipping invalid row (missing required fields):', row, 'payload:', payload)
          failedCount++
          csvProgress.value.failed = failedCount
          csvProgress.value.processed++
          continue
        }

        console.log('Submitting payload:', payload)
        const token = localStorage.getItem('token')
        await axios.post(baseUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        successCount++
        csvProgress.value.success = successCount
        csvProgress.value.processed++
      } catch (rowErr: any) {
        console.error('Error importing row:', row)
        console.error('Payload was:', { species_id: Number(row.species_id), trigger_condition: row.trigger_condition, fee_amount: Number(row.fee_amount), currency_id: csvFormDefaults.value.currency_id, area_id: csvFormDefaults.value.area_id || priceStructureArea.value, notes: row.notes, price_structure_id: priceStructureId })
        console.error('Response status:', rowErr.response?.status)
        console.error('Response data:', rowErr.response?.data)
        failedCount++
        csvProgress.value.failed = failedCount
        csvProgress.value.processed++
      }
    }

    const message = `Imported ${successCount} upgrade fees${failedCount > 0 ? `, ${failedCount} failed` : ''}`
    toast.init({ message, color: successCount > 0 ? 'success' : 'danger' })

    if (successCount > 0) {
      // Clear CSV input and reset
      csvInputRef.value?.clearCsvFile()
      router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'upgrade-fees' } })
    }
  } catch (err: any) {
    console.error('Failed to import CSV:', err)
    toast.init({ message: 'Failed to import CSV data', color: 'danger' })
  } finally {
    savingCsv.value = false
  }
}

const downloadUpgradeFeeTemplate = () => {
  if (!speciesOptions.value || speciesOptions.value.length === 0) {
    toast.init({ message: 'No species available. Please wait for species to load.', color: 'warning' })
    return
  }

  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    return '"' + str.replace(/"/g, '""') + '"'
  }

  const rows = speciesOptions.value.map((opt: any) => {
    const id = opt.id || ''
    const name = opt.name || ''
    const triggerCondition = '' // Empty for template
    const feeAmount = '' // Empty for template
    const notes = '' // Empty for template
    return `${escapeCsv(id)},${escapeCsv(name)},${escapeCsv(triggerCondition)},${escapeCsv(feeAmount)},${escapeCsv(notes)}`
  })

  const header = 'Species ID,Species Name,trigger_condition,fee_amount,notes'
  const csvContent = [header].concat(rows).join('\n')

  const filename = 'upgrade_fees_template.csv'

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  
  toast.init({ message: 'Upgrade fee template downloaded successfully', color: 'success' })
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
