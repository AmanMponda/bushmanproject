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
      <div v-if="inputMode === 'single'" class="card">
        <div class="card-body">
          <form @submit.prevent="submit">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Species <span class="text-danger">*</span></label>
                <select v-model="form.species_id" class="form-select" required>
                  <option :value="null">Select Species</option>
                  <option v-for="s in speciesOptions" :key="s.id" :value="s.id">
                    {{ s.name }}{{ s.swahili_name ? ` (${s.swahili_name})` : '' }}
                  </option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">Hunting Area <span class="text-danger">*</span></label>
                <select v-model="form.area_id" class="form-select" required>
                  <option :value="null">Select Area</option>
                  <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">Amount <span class="text-danger">*</span></label>
                <input v-model.number="form.amount" type="number" step="0.01" class="form-control" required />
              </div>

              <div class="col-md-6">
                <label class="form-label">Currency <span class="text-danger">*</span></label>
                <select v-model="form.currency_id" class="form-select" required>
                  <option :value="null">Select Currency</option>
                  <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
                </select>
              </div>

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

      <!-- CSV Import Section -->
      <div v-else-if="inputMode === 'csv'" class="csv-import-section">
        <h6 class="mb-3 d-flex align-items-center gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="fa fa-file-csv text-success"></i>
            <span>Bulk Import Trophy Fees</span>
          </div>
          <button type="button" class="btn btn-sm btn-outline-success ms-auto" @click="downloadTrophyFeeTemplate">
            <i class="fa fa-download me-1"></i>
            Download Template
          </button>
        </h6>

        <!-- Area and Currency Selection -->
        <div class="row g-3 mb-3">
          <div class="col-md-6 col-12">
            <label class="form-label">Hunting Area <span class="text-danger">*</span></label>
            <select v-model="csvFormDefaults.area_id" class="form-select" required>
              <option :value="null">Select Area</option>
              <option v-for="a in areaOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
            <small v-if="!areaOptions || areaOptions.length === 0" class="text-muted">No areas loaded</small>
          </div>

          <div class="col-md-6 col-12">
            <label class="form-label">Currency <span class="text-danger">*</span></label>
            <select v-model="csvFormDefaults.currency_id" class="form-select" required>
              <option :value="null">Select Currency</option>
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.text }}</option>
            </select>
            <small v-if="!currencyOptions || currencyOptions.length === 0" class="text-muted">No currencies loaded</small>
          </div>
        </div>

        <!-- Duration Selection -->
        <div class="row g-3 mb-3">
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
                      :id="`csv-hunt-length-${huntLength.id}`"
                      v-model="csvFormDefaults.hunt_length_ids"
                      type="checkbox"
                      class="form-check-input"
                      :value="huntLength.id"
                    />
                    <label class="form-check-label" :for="`csv-hunt-length-${huntLength.id}`">
                      {{ getHuntLengthLabel(huntLength) }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TrophyFeesCSVInput
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
        <button v-if="inputMode === 'single'" class="btn btn-primary ms-2" :disabled="saving || !canSave" @click="submit">Save</button>
        <button v-else-if="inputMode === 'csv' && csvInputRef?.csvRows?.length > 0" class="btn btn-primary ms-2" :disabled="savingCsv" @click="submitCsvImport">Import Selected</button>
        <button v-else-if="inputMode === 'csv'" class="btn btn-primary ms-2" disabled>No rows loaded</button>
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
import TrophyFeesCSVInput from './TrophyFeesCSVInput.vue'
import axios from 'axios'

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
const areaOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const huntLengths = ref<any[]>([])
const formError = ref('')
const csvInputRef = ref<any>(null)

const csvFormDefaults = ref<any>({
  area_id: null,
  currency_id: null,
  hunt_length_ids: [] as number[]
})

const csvProgress = ref({ total: 0, processed: 0, success: 0, failed: 0 })
const csvProgressPercent = computed(() => csvProgress.value.total ? Math.round((csvProgress.value.processed / csvProgress.value.total) * 100) : 0)

const form = ref<any>({
  species_id: null,
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
    loadAreas()
  ])
  huntLengths.value = store.huntLengths
  currencyOptions.value = settingsStore.currencies || []
  
  // Prefill defaults
  if (currencyOptions.value.length > 0) {
    csvFormDefaults.value.currency_id = currencyOptions.value[0]?.value ?? null
  }
})

const loadSpecies = async () => {
  try {
    const response = await quotaStore.getSpeciesList()
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || [])
    speciesOptions.value = list.map((item: any) => ({
      id: item.id,
      name: item.name,
      swahili_name: item.swahili_name || null
    }))
  } catch (error) {
    console.error('Failed to load species:', error)
  }
}

const loadAreas = async () => {
  try {
    const response = await quotaStore.getAreaList()
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || [])
    areaOptions.value = list.map((item: any) => ({
      id: item.id,
      name: item.name
    }))
  } catch (error) {
    console.error('Failed to load areas:', error)
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
  return !!f.species_id && !!f.area_id && !!f.currency_id && 
         f.amount !== null && f.amount !== undefined && 
         !isNaN(Number(f.amount)) && Number(f.amount) >= 0
})

const back = () => {
  router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'trophy-fees' } })
}

const submit = async () => {
  formError.value = ''
  if (!canSave.value) {
    formError.value = 'Please fill required fields (Species, Area, Currency, Amount)'
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

const handleCsvImport = (rows: any[]) => {
  console.log('CSV rows ready:', rows)
}

const submitCsvImport = async () => {
  const selectedRows = csvInputRef.value?.getSelectedRows() || []
  if (selectedRows.length === 0) {
    toast.init({ message: 'No rows selected for import', color: 'warning' })
    return
  }

  // Validate required fields
  if (!csvFormDefaults.value.area_id) {
    toast.init({ message: 'Please select a hunting area for CSV import', color: 'warning' })
    return
  }

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
    const baseUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees`
    const token = localStorage.getItem('token')
    let successCount = 0
    let failedCount = 0

    for (const row of selectedRows) {
      try {
        const payload: any = {
          species_id: Number(row.species_id),
          area_id: csvFormDefaults.value.area_id,
          currency_id: csvFormDefaults.value.currency_id,
          amount: Number(row.amount),
          price_structure_id: priceStructureId
        }

        // Add durations if selected
        if (csvFormDefaults.value.hunt_length_ids && csvFormDefaults.value.hunt_length_ids.length > 0) {
          payload.durations = csvFormDefaults.value.hunt_length_ids.map((huntLengthId: number) => ({
            hunt_length_id: huntLengthId,
            is_allowed: true
          }))
        }

        // Validate required fields
        if (!payload.species_id || !payload.area_id || !payload.currency_id || !payload.amount) {
          console.warn('Skipping invalid row (missing required fields):', row)
          failedCount++
          csvProgress.value.failed = failedCount
          csvProgress.value.processed++
          continue
        }

        const response = await axios.post(baseUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })

        if (response.status === 201 || response.status === 200) {
          successCount++
          csvProgress.value.success = successCount
        } else {
          failedCount++
          csvProgress.value.failed = failedCount
        }
        csvProgress.value.processed++
      } catch (rowErr: any) {
        console.error('Error importing row:', row)
        console.error('Error details:', rowErr.response?.data || rowErr.message)
        failedCount++
        csvProgress.value.failed = failedCount
        csvProgress.value.processed++
      }
    }

    const message = `Imported ${successCount} trophy fees${failedCount > 0 ? `, ${failedCount} failed` : ''}`
    toast.init({ message, color: successCount > 0 ? 'success' : 'danger' })

    if (successCount > 0) {
      // Clear CSV input and reset
      csvInputRef.value?.clearCsvFile()
      router.push({ name: 'sales-price-list', query: { structureId: String(priceStructureId), view: 'trophy-fees' } })
    }
  } catch (err: any) {
    console.error('Failed to import CSV:', err)
    toast.init({ message: 'Failed to import CSV data', color: 'danger' })
  } finally {
    savingCsv.value = false
  }
}

const downloadTrophyFeeTemplate = () => {
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
    const amount = '' // Empty for template
    return `${escapeCsv(id)},${escapeCsv(name)},${escapeCsv(amount)}`
  })

  const header = 'Species ID,Species Name,Amount'
  const csvContent = [header].concat(rows).join('\n')

  const filename = 'trophy_fees_template.csv'

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  
  toast.init({ message: 'Trophy fee template downloaded successfully', color: 'success' })
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

