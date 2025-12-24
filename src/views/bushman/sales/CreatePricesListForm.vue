<template>
  <div class="price-list-form-page">
    <!-- Form Container -->
    <div class="form-price-list-container">
      <div v-if="!savingPriceList" class="card bg-transparent border-0 shadow-none">
        <div class="card-header bg-transparent border-bottom">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-secondary btn-sm" @click="$emit('go-back')">
                <i class="fa fa-arrow-left me-1"></i> Back
              </button>

              <i class="fa fa-edit text-primary fs-5"></i>
              <h2 class="h5 mb-0">
                {{ editMode ? 'Edit Price List' : 'Create New Price List' }}
              </h2>
            </div>
          </div>
        </div>
        <div class="card-body">
          <form ref="formRef" @submit.prevent="submit">
            <div class="row mb-4">
                <div v-if="!props.structureOnly" class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Package <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <select v-model="form.package" class="form-select" required @change="onChangePackage">
                      <option :value="null">Select Package</option>
                      <option v-for="option in packageOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                    <button type="button" class="btn btn-outline-secondary" title="Add New Package" @click="_showModal()">
                      <i class="fa fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="!props.structureOnly" class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="form.name" type="text" class="form-control" placeholder="Enter Name" required />
                </div>
              </div>

              <div v-if="!props.structureOnly" class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Hunting Type <span class="text-danger">*</span></label>
                  <select v-model="form.hunting_type_id" class="form-select" required>
                    <option :value="null">Select Hunting Type</option>
                    <option v-for="option in huntingTypesOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="!props.structureOnly" class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Area <span class="text-danger">*</span></label>
                  <select v-model="form.area_id" class="form-select" required>
                    <option :value="null">Select Area</option>
                    <option v-for="opt in areasOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Structure-only layout: Area, Start Date and End Date on same row -->
            <div v-if="props.structureOnly" class="row mb-5">
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Area <span class="text-danger">*</span></label>
                  <select v-model="form.area_id" class="form-select" required>
                    <option :value="null">Select Area</option>
                    <option v-for="opt in areasOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Start Date <span class="text-danger">*</span></label>
                  <input v-model="form.start_date" type="date" class="form-control" required />
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label class="form-label">End Date <span class="text-danger">*</span></label>
                  <input v-model="form.end_date" type="date" class="form-control" :aria-invalid="form.start_date && form.end_date && !hasValidDates" required />
                  <small v-if="form.start_date && form.end_date && !hasValidDates" class="text-danger mt-1 d-block">Start date must be before or equal to End date.</small>
                </div>
              </div>
            </div>

            <div class="row mb-5">
              <div v-if="!props.structureOnly" class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Duration (days) <span class="text-danger">*</span></label>
                  <select v-model="form.duration" class="form-select" required>
                    <option :value="null">Enter Duration eg: 21 days</option>
                    <option v-for="option in durationsOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="!props.structureOnly" class="col-md-4">
                <div class="form-group">
                  <label class="form-label">Start Date <span class="text-danger">*</span></label>
                  <input v-model="form.start_date" type="date" class="form-control" required />
                </div>
              </div>

              <div v-if="!props.structureOnly" class="col-md-4">
                <div class="form-group">
                  <label class="form-label">End Date <span class="text-danger">*</span></label>
                  <input v-model="form.end_date" type="date" class="form-control" :aria-invalid="form.start_date && form.end_date && !hasValidDates" required />
                  <small v-if="form.start_date && form.end_date && !hasValidDates" class="text-danger mt-1 d-block">Start date must be before or equal to End date.</small>
                </div>
              </div>
            </div>

            <div v-if="!props.structureOnly" class="row mb-5">
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-label">Amount <span class="text-danger">*</span></label>
                  <input v-model="form.amount" type="text" class="form-control" placeholder="Enter Amount" required />
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-label">Currency <span class="text-danger">*</span></label>
                  <select v-model="form.currency" class="form-select" required>
                    <option :value="null">Select Currency</option>
                    <option v-for="option in currencyOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="!props.structureOnly" class="row mb-5">
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Companion Cost</label>
                  <input v-model="form.companion_amount" type="number" class="form-control" placeholder="Enter Amount" />
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Companion Days</label>
                  <select v-model="form.companion_days" class="form-select">
                    <option :value="null">Select Days</option>
                    <option v-for="option in durationsOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Observer Cost</label>
                  <input v-model="form.observer_amount" type="number" class="form-control" placeholder="Enter Amount" />
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label class="form-label">Observer Days</label>
                  <select v-model="form.observer_days" class="form-select">
                    <option :value="null">Select Days</option>
                    <option v-for="option in durationsOptions" :key="option.value" :value="option.value">
                      {{ option.text }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Upgrade Fees Section (Optional) -->
            <div v-if="!props.structureOnly" class="card mb-2">
              <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="fa fa-arrow-up text-primary me-2"></i>Upgrade Fees (Optional)</h6>
                <button type="button" class="btn btn-primary btn-sm" @click="addUpgradeFee">
                  <i class="fa fa-plus me-1"></i> Add Fee
                </button>
              </div>
              <div class="card-body py-2">
                <p class="text-muted small mb-2">
                  Add upgrade fees for additional species that can be hunted beyond the standard package.
                </p>

                <MultiRowTableInput
                  v-model="upgradeFees"
                  :fields="multiRowFields"
                  add-button-label="Add Fee"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Save Button -->
      <div class="d-flex justify-content-end align-items-center mt-4 mb-3">
        <button type="button" class="btn btn-primary" :disabled="savingPriceList || !canSubmit" @click="submit">
          <i class="fa fa-save me-1"></i>
          <span v-if="savingPriceList" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ props.structureOnly ? (editMode ? 'Update Price Structure' : 'Save Price Structure') : (editMode ? 'Update Price List' : 'Save Price List') }}
        </button>
      </div>

      <!-- Fetched Price List (edit/view) -->
      <div v-if="loadingPriceList" class="card mt-3">
        <div class="card-body text-center">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          <span>Loading price list details...</span>
        </div>
      </div>

      <div v-if="priceListError" class="card mt-3 border-danger">
        <div class="card-body bg-light">
          <div class="alert alert-danger mb-0">
            <i class="fa fa-exclamation-triangle me-2"></i>
            {{ priceListError }}
          </div>
        </div>
      </div>

      <div v-if="priceList && !loadingPriceList" class="card mt-3">
        <div class="card-body">
          <h5 class="card-title">Viewing Price List #{{ priceList.id }}</h5>
          <p class="mb-1">Area: {{ priceList.area_name }} (ID: {{ priceList.area_id }})</p>
          <p class="mb-1">Start: {{ priceList.start_date }} — End: {{ priceList.end_date }}</p>
          <h6 class="mt-2">Items</h6>
          <ul>
            <li v-for="it in priceList.items || []" :key="it.id">{{ it.name }} — {{ it.currency_symbol }}{{ it.amount }}</li>
          </ul>
          <h6 class="mt-2">Companion Prices</h6>
          <ul>
            <li v-for="c in priceList.companion_hunter_prices || []" :key="c.id">{{ c.hunt_length_label }} — {{ c.currency_symbol }}{{ c.amount }}</li>
          </ul>
          <h6 class="mt-2">Observer Prices</h6>
          <ul>
            <li v-for="o in priceList.observer_hunter_prices || []" :key="o.id">{{ o.hunt_length_label }} — {{ o.currency_symbol }}{{ o.amount }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="savingPriceList"
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style="background: rgba(0, 0, 0, 0.5); z-index: 9999">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Create New Package Modal -->
    <div v-if="showModal" class="modal fade show d-block" style="z-index: 1050; display: block !important;" tabindex="-1"
      role="dialog" @click.self="showModal = false">
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Package</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
            <SalesPackageForm @go-back="showModal = false" @saved="handlePackageSaved" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show" style="z-index: 1040;" @click="showModal = false"></div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch, nextTick } from 'vue'
import Swal from '../../../utils/sweetalert2'
import axios from 'axios'
import handleErrors from '../../../stores/bushman/errorHandler.ts'
import { useToast } from '@/composables/useToast'
import { useQuotaStore } from '../../../stores/bushman/quota-store.ts'
import { useSettingsStore } from '../../../stores/bushman/settings-store.ts'
import { usePriceListStore } from '../../../stores/bushman/price-list-store.ts'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import SalesPackageForm from '../../bushman/module-settings/SalesPackageForm.vue'
import MultiRowTableInput from '@/views/bushman/reusables/MultiRowTableInput.vue'

// Props & Emits
const props = withDefaults(defineProps<{ editMode?: boolean; editItem?: any; structureOnly?: boolean }>(), {
  editMode: false,
  editItem: null,
  structureOnly: false,
})
const emit = defineEmits<{ saved: []; 'go-back': []; goBack: [] }>()

// Stores
const quotaStore = useQuotaStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const priceStructuresStore = usePriceStructuresStore()
const { init } = useToast()

// Refs
const formRef = ref<HTMLFormElement>()
const form = reactive({
  id: null as any,
  name: null as any,
  hunting_type_id: null as any,
  package: null as any,
  area_id: null as any,
  amount: null as any,
  currency: null as any,
  duration: null as any,
  season: null as any,
  start_date: null as any,
  end_date: null as any,
  species: null as any,
  quantity: null as any,
  companion_days: null as any,
  companion_amount: null as any,
  observer_days: null as any,
  observer_amount: null as any,
})

// State
const savingPriceList = ref(false)
const speciesOptions = ref<any[]>([])
const speciesObjects = ref<any[]>([])
const areasOptions = ref<any[]>([])
const huntingTypesOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const durationsOptions = ref<any[]>([])
const seasonsOptions = ref<any[]>([])
// Season selection removed - users can enter dates manually
// const selectedSeasonId = ref<any>(null)
const upgradeFees = ref<any[]>([])
const originalFormData = ref<any>(null)
const originalUpgradeFees = ref<any[]>([])
const priceList = ref<any>(null)
const loadingPriceList = ref(false)
const priceListError = ref<string | null>(null)

// Computed
const showModal = computed({
  get: () => priceListStore.showModal,
  set: (val) => (priceListStore.showModal = val),
})
const packageOptions = computed(() => priceListStore.packageOptions)
const canSubmit = computed(() => {
  if (props.editMode) return hasFormChanged.value

  // When creating only a Price Structure, require only area and valid dates
  if (props.structureOnly) {
    const hasArea = !!form.area_id
    const hasDates = !!form.start_date && !!form.end_date
    return hasArea && hasDates && hasValidDates.value
  }

  const hasPackage = !!form.package
  const hasHuntType = !!form.hunting_type_id
  // season is optional now - users fill dates manually
  // const hasSeason = !!form.season || !!selectedSeasonId.value
  const hasArea = !!form.area_id
  const hasAmount = form.amount !== null && form.amount !== undefined && String(form.amount).trim() !== ''
  const hasCurrency = !!form.currency || form.currency === 0 || typeof form.currency === 'number' || (form.currency && typeof form.currency === 'object')
  const hasDuration = !!form.duration

  // season removed from required checks; users can select start/end dates manually
  // require valid start/end dates when both are set
  const hasDatesValid = hasValidDates.value

  return hasPackage && hasHuntType && hasArea && hasAmount && hasCurrency && hasDuration && hasDatesValid
})
const hasFormChanged = computed(() => {
  if (!props.editMode || !originalFormData.value) return true
  return JSON.stringify(form) !== JSON.stringify(originalFormData.value) ||
    JSON.stringify(upgradeFees.value) !== JSON.stringify(originalUpgradeFees.value)
})

// Date validation: start_date must be <= end_date when both are present
const hasValidDates = computed(() => {
  if (!form.start_date || !form.end_date) return true // treat missing dates as valid for now
  try {
    const sd = new Date(form.start_date)
    const ed = new Date(form.end_date)
    return sd.getTime() <= ed.getTime()
  } catch (e) {
    return false
  }
})

const multiRowFields = computed<any>(() => [
  { key: 'species_id', label: 'Species', type: 'select', required: true, options: speciesOptions.value },
  { key: 'trigger_condition', label: 'Trigger Condition', type: 'text', required: true, placeholder: 'e.g., Trophy size > 9 feet' },
  { key: 'fee_amount', label: 'Fee Amount', type: 'number', required: true },
  { key: 'currency_id', label: 'Currency', type: 'select', required: true, options: currencyOptions.value },
  { key: 'notes', label: 'Notes', type: 'text' },
])

// Methods
const getData = async (fetcher: () => Promise<any>, mapper: (d: any) => any) => {
  try { return (await fetcher()).data.map(mapper) } catch (e) { console.log(e); return [] }
}
const getAreas = async () => { areasOptions.value = await getData(() => quotaStore.getAreaList(), (item: any) => ({ value: item.id, text: item.name })) }
const getHuntingTypes = async () => { huntingTypesOptions.value = await getData(() => settingsStore.getHuntingsTypes(), (item: any) => ({ value: item.id, text: item.name })) }
const getCurrencyList = async () => { currencyOptions.value = await getData(() => settingsStore.getCurrencies(), (item: any) => ({ value: item.id, text: item.name })) }
// getSeasonList removed - season selection removed from the form
const getSpeciesItems = async () => { speciesOptions.value = await getData(() => quotaStore.getSpeciesList(), (item: any) => ({ value: item.id, text: item.name })) }
const getHuntLengthsList = async () => {
  try {
    const response = await priceListStore.getHuntLengths()
    const data = response.data?.data || response.data || []
    durationsOptions.value = data.filter((item: any) => item.is_active).map((item: any) => ({
      value: item.id, text: item.label, days: item.days,
    }))
  } catch (error) { console.log('Error fetching hunt lengths:', error) }
}
const getSalesPackages = async () => { await priceListStore.getSalesPackageList(true) }
const getQuotaList = async () => {
  try {
    const response = await quotaStore.getQuotas(null)
    const data = response?.data?.data || response?.data || []
  } catch (error) { console.log(error) }
}

const populateFormForEdit = (editItem: any) => {
  if (!editItem) return
  const priceListType = editItem.price_list_type || editItem
  form.name = priceListType.name || editItem.name || form.name
  form.area_id = priceListType.area_id || editItem.area_id || form.area_id
  if (priceListType.amount) form.amount = String(priceListType.amount).replace('$', '').replace(',', '')
  const huntLengthId = priceListType.hunt_length_id || editItem.hunt_length_id
  if (huntLengthId) form.duration = huntLengthId
  else if (priceListType.duration) {
    const foundDuration = durationsOptions.value.find((d: any) => d.days === priceListType.duration)
    form.duration = foundDuration?.value || null
  }
  const huntingTypeName = priceListType.hunting_type?.name || editItem.hunting_type
  if (huntingTypeName) {
    const foundHuntingType = huntingTypesOptions.value.find((h: any) => h.text === huntingTypeName)
    form.hunting_type_id = foundHuntingType?.value || null
  }
  const startDate = priceListType.price_list?.start_date
  const endDate = priceListType.price_list?.end_date
  if (startDate && endDate) {
    // Populate explicit start_date and end_date fields
    form.start_date = startDate
    form.end_date = endDate
    // Also find and set the matching season object (not required)
    form.season = seasonsOptions.value.find((s: any) => s.value?.start_at === startDate && s.value?.end_at === endDate)
    if (!form.season) {
      const year = new Date(startDate).getFullYear()
      form.season = seasonsOptions.value.find((s: any) => s.text?.includes(String(year)))
    }
    // Note: we no longer use selectedSeasonId as season selection was removed
  }
  const currencyName = priceListType.currency?.name
  if (currencyName) form.currency = currencyOptions.value.find((c: any) => c.text === currencyName)
  if (!form.currency) form.currency = currencyOptions.value.find((c: any) => c.text === 'USD') || currencyOptions.value[0]
  
  const companionCosts = editItem.companion_hunter_costs || priceListType.companion_hunter_costs
  if (companionCosts?.length > 0) {
    const firstCompanion = companionCosts[0]
    form.companion_amount = firstCompanion.amount || null
    if (firstCompanion.hunt_length_id) form.companion_days = firstCompanion.hunt_length_id
    else if (firstCompanion.days) {
      const foundDuration = durationsOptions.value.find((d: any) => d.days === firstCompanion.days)
      form.companion_days = foundDuration?.value || null
    }
  } else {
    form.companion_amount = editItem.companion_amount || null
    if (editItem.companion_hunt_length_id) form.companion_days = editItem.companion_hunt_length_id
    else if (editItem.companion_days) {
      const foundDuration = durationsOptions.value.find((d: any) => d.days === editItem.companion_days)
      form.companion_days = foundDuration?.value || null
    }
  }
  
  const observerCosts = editItem.observer_hunter_costs || priceListType.observer_hunter_costs
  if (observerCosts?.length > 0) {
    const firstObserver = observerCosts[0]
    form.observer_amount = firstObserver.amount || null
    if (firstObserver.hunt_length_id) form.observer_days = firstObserver.hunt_length_id
    else if (firstObserver.days) {
      const foundDuration = durationsOptions.value.find((d: any) => d.days === firstObserver.days)
      form.observer_days = foundDuration?.value || null
    }
  } else {
    form.observer_amount = editItem.observer_amount || null
    if (editItem.observer_hunt_length_id) form.observer_days = editItem.observer_hunt_length_id
    else if (editItem.observer_days) {
      const foundDuration = durationsOptions.value.find((d: any) => d.days === editItem.observer_days)
      form.observer_days = foundDuration?.value || null
    }
  }

  if (editItem.sales_package) form.package = editItem.sales_package.id
  else if (editItem.packages?.length > 0) form.package = editItem.packages[0].id
  
  const upgradeFeesList = editItem.upgrade_fees || priceListType.upgrade_fees
  if (upgradeFeesList?.length > 0) {
    upgradeFees.value = upgradeFeesList.map((fee: any, idx: number) => ({
      _id: fee.id || idx + 1,
      id: fee.id || null,
      species_id: fee.species_id ?? fee.species?.id ?? null,
      trigger_condition: fee.trigger_condition || '',
      fee_amount: fee.fee_amount ? String(fee.fee_amount) : null,
      currency_id: fee.currency_id ?? fee.currency?.id ?? null,
      notes: fee.notes || '',
    }))
  }
  originalFormData.value = JSON.parse(JSON.stringify(form))
  originalUpgradeFees.value = JSON.parse(JSON.stringify(upgradeFees.value))
}

// seasonStart and seasonEnd placeholders (if seasonsOptions contain date ranges, map accordingly)
// Season helpers removed - users will fill dates manually
// const seasonStart = computed(() => { ... })
// const seasonEnd = computed(() => { ... })
// const onSeasonChange = () => { ... }
const onChangePackage = () => console.log('Selected package:', form.package)
const addUpgradeFee = () => {
  const newId = upgradeFees.value.length ? Math.max(...upgradeFees.value.map((r: any) => r._id || 0)) + 1 : 1
  upgradeFees.value = [{ _id: newId, species_id: null, trigger_condition: '', fee_amount: null, currency_id: null, notes: '' }, ...upgradeFees.value]
}
const removeUpgradeFee = (index: number) => upgradeFees.value.splice(index, 1)
const _showModal = () => { showModal.value = true }
const handlePackageSaved = async () => { await getSalesPackages(); showModal.value = false }

const submit = async () => {
  if (formRef.value && !formRef.value.checkValidity()) { formRef.value.reportValidity(); return }
  savingPriceList.value = true

  // If creating/editing a Price Structure only, send minimal payload
  if (props.structureOnly) {
    try {
      // Validate dates
      if (form.start_date && form.end_date) {
        const sd = new Date(form.start_date)
        const ed = new Date(form.end_date)
        if (sd.getTime() > ed.getTime()) {
          init({ message: 'Start date must be before or equal to End date', color: 'danger' })
          savingPriceList.value = false
          return
        }
      } else {
        init({ message: 'Start date and End date are required', color: 'danger' })
        savingPriceList.value = false
        return
      }

      const payload: any = {
        area_id: form.area_id,
        start_at: form.start_date,
        start_date: form.start_date,
        end_at: form.end_date,
        end_date: form.end_date,
        is_active: 1,
      }

      let response: any
      if (props.editMode && props.editItem && props.editItem.id) {
        response = await priceStructuresStore.update(props.editItem.id, payload)
      } else {
        response = await priceStructuresStore.create(payload)
      }

      if (response && (response.status === 201 || response.status === 200)) {
        init({ message: response.data?.message || 'Price structure saved', color: 'success' })
        savingPriceList.value = false
        // Reset minimal fields
        form.area_id = null
        form.start_date = null
        form.end_date = null
        // Inform parent and go back
        emit('saved')
        emit('go-back')
        emit('goBack')
      } else {
        savingPriceList.value = false
        init({ message: 'Failed to save price structure', color: 'danger' })
      }
    } catch (error: any) {
      savingPriceList.value = false
      console.error('Structure create error:', error)
      handleErrors(error.response)
      init({ message: error.message || 'Failed to save price structure', color: 'danger' })
    }

    return
  }

  const validUpgradeFees = upgradeFees.value.filter((fee: any) => fee.species_id && fee.fee_amount && fee.currency_id && fee.trigger_condition).map((fee: any) => ({
    species_id: fee.species_id,
    trigger_condition: fee.trigger_condition,
    fee_amount: parseFloat(String(fee.fee_amount)),
    currency_id: fee.currency_id,
    notes: fee.notes || '',
    ...(fee.id && { id: fee.id }),
  }))
  
  const salesPackageIds = form.package ? [form.package] : []
  const huntLengthId = form.duration || null
  const companionHuntLengthId = form.companion_days || null
  const observerHuntLengthId = form.observer_days || null
  const currencyId = typeof form.currency === 'object' && form.currency !== null && 'value' in form.currency ? form.currency.value : form.currency

  // Build `items` array: main item from form (upgrade fees are separate entity)
  const items: any[] = []
  // Always push main item using form fields
  items.push({
    name: form.name,
    description: '',
    hunting_type_id: form.hunting_type_id,
    hunt_length_id: huntLengthId,
    currency_id: currencyId,
    amount: form.amount ? parseFloat(String(form.amount).replace(/[^0-9.-]+/g, '')) : null,
    is_active: 1,
  })

  const requestdata = {
      // Required fields per PRICE_STRUCTURE_API.md
      area_id: form.area_id,
      start_at: form.start_date,  // API accepts both start_at and start_date
      start_date: form.start_date,
      end_at: form.end_date,      // API accepts both end_at and end_date
      end_date: form.end_date,
      is_active: 1,
      // Link to sales packages
      sales_package_ids: salesPackageIds,
      // Required items array (min:1)
      items: items,
      // Optional: Companion hunter prices
      companion_hunter_prices: form.companion_amount ? [
        {
          hunt_length_id: companionHuntLengthId,
          currency_id: currencyId,
          amount: parseFloat(String(form.companion_amount)),
        },
      ] : undefined,
      // Optional: Observer hunter prices
      observer_hunter_prices: form.observer_amount ? [
        {
          hunt_length_id: observerHuntLengthId,
          currency_id: currencyId,
          amount: parseFloat(String(form.observer_amount)),
        },
      ] : undefined,
      // Optional: Upgrade fees (separate entity with trigger_condition)
      upgrade_fees: validUpgradeFees.length > 0 ? validUpgradeFees.map((f: any) => ({
        species_id: f.species_id,
        trigger_condition: f.trigger_condition,
        fee_amount: parseFloat(String(f.fee_amount)),
        currency_id: f.currency_id,
        notes: f.notes || '',
      })) : undefined,
    }

  console.log('Submitting Price List Payload:', JSON.stringify(requestdata, null, 2))

  try {
    let response: any
    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_PRICE_STRUCTURES_URL
    
    if (props.editMode && props.editItem) {
      // Direct axios PUT for update
      response = await axios.put(`${baseUrl}${props.editItem.id}`, requestdata, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.status === 200) {
        init({ message: 'Price list updated successfully', color: 'success' })
        savingPriceList.value = false
        emit('saved')
      }
    } else {
      // Validate dates before sending POST
      if (form.start_date && form.end_date) {
        const sd = new Date(form.start_date)
        const ed = new Date(form.end_date)
        if (sd.getTime() > ed.getTime()) {
          init({ message: 'Start date must be before or equal to End date', color: 'danger' })
          savingPriceList.value = false
          return
        }
      }

      // Direct axios POST for create
      console.log('Sending direct POST to:', baseUrl)
      console.log('Request body:', requestdata)
      response = await axios.post(baseUrl, requestdata, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)
      if (response.status === 201) {
        init({ message: response.data.message, color: 'success' })
        // Reset local form state and notify parent immediately so parent can switch view
        form.package = null; form.hunting_type_id = null; form.season = null; // season removed; users set dates manually
        form.amount = null; form.currency = null; form.duration = null
        form.companion_amount = null; form.companion_days = null
        form.observer_amount = null; form.observer_days = null
        speciesObjects.value = []; upgradeFees.value = []; savingPriceList.value = false
        if (formRef.value) formRef.value.reset()
        // Emit events before showing the modal so the parent can react immediately
        emit('saved')
        emit('go-back')
        emit('goBack')
        console.log('CreatePricesListForm: emitted saved and go-back events')
        try {
          await Swal.fire({
            title: 'Price list created.',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'btn btn-primary' },
            buttonsStyling: false,
          })
        } catch (e) {
          // ignore popup errors
        }
      }
    }
  } catch (error: any) {
    savingPriceList.value = false
    console.error('API Error full:', error)
    console.error('API Error response.data:', error.response?.data)
    console.error('API Error status:', error.response?.status)
    console.error('API Error headers:', error.response?.headers)
    handleErrors(error.response)
    init({ message: error.message, color: 'danger' })
  }
}

// Fetch a single price list by id (handles responses with { success, data } or raw data)
async function fetchPriceListById(id: number) {
  loadingPriceList.value = true
  priceListError.value = null
  const token = localStorage.getItem('token')
  const base = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_PRICE_STRUCTURES_URL
  const url = `${base}${id}`
  
  // Create abort controller with 10 second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  
  try {
    console.log('Fetching price list from:', url)
    const res = await axios.get(url, {
      signal: controller.signal,
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    })
    clearTimeout(timeoutId)
    const payload = res.data?.data ?? res.data
    priceList.value = payload
    console.log('Successfully fetched price list:', priceList.value)
    return priceList.value
  } catch (err: any) {
    clearTimeout(timeoutId)
    loadingPriceList.value = false
    
    if (err.code === 'ECONNABORTED') {
      const msg = 'Request timeout (10s) - API server may be unresponsive'
      console.error('Fetch timeout:', msg)
      priceListError.value = msg
    } else {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to fetch price list'
      console.error('Fetch price list error:', err?.response?.data || err?.message)
      priceListError.value = errMsg
    }
    return null
  } finally {
    loadingPriceList.value = false
  }
}

// Watchers & Lifecycle
watch(() => props.editItem, (newVal) => {
  if (props.editMode && newVal) {
    nextTick(() => setTimeout(() => populateFormForEdit(newVal), 100))
  }
}, { immediate: true, deep: true })

onMounted(async () => {
  showModal.value = false
    await Promise.all([getAreas(), getHuntingTypes(), getQuotaList(), getCurrencyList(), getSalesPackages(), getSpeciesItems(), getHuntLengthsList()])
  if (props.editMode && props.editItem) {
    populateFormForEdit(props.editItem)
    if (props.editItem.id) await fetchPriceListById(props.editItem.id)
  }
})
</script>

<style scoped>
.price-list-form-page {
  background-color: transparent;
  position: relative;
}

.form-price-list-container {
  position: relative;
}

.form-price-list-container .card-body {
  padding-bottom: 1rem;
}

.card-header {
  padding: 0.5rem 1rem;
}

.card-body {
  padding: 1.5rem;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  display: block;
}

.form-group {
  margin-bottom: 0;
}

form .row {
  margin-bottom: 2rem !important;
  --bs-gutter-x: 3rem !important;
  margin-left: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
  margin-right: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
}

form .row>[class*='col-'] {
  padding-left: calc(var(--bs-gutter-x) * 0.5) !important;
  padding-right: calc(var(--bs-gutter-x) * 0.5) !important;
}

.card.mb-2 {
  margin-bottom: 0.5rem !important;
}
</style>
