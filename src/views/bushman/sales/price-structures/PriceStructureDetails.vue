<template>
  <div class="price-structure-details">
    <div class="container-fluid px-3 py-3">
      <!-- Breadcrumb -->
      <div class="d-flex align-items-center mb-3">
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#" @click.prevent="$emit('go-back')">Price Structures</a></li>
          <li class="breadcrumb-item active">Details</li>
        </ul>
      </div>

      <!-- Header Section -->
      <div class="card mb-4" v-if="structure">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h1 class="page-header mb-2">
                {{ structure.location_name || structure.area_name || structure.area?.name || structure.area || 'Price Structure' }}
              </h1>
              <div class="text-muted d-flex align-items-center">
                <i class="fa fa-calendar me-2"></i>
                <span>{{ formatDateShort(structure.start_date) }} - {{ formatDateShort(structure.end_date) }}</span>
              </div>
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <button 
                class="btn btn-outline-primary" 
                @click="downloadPdf" 
                :disabled="downloadingPdf"
              >
                <i class="fa fa-file-pdf me-2"></i>
                {{ downloadingPdf ? 'Downloading...' : 'Download PDF' }}
              </button>
              <button class="btn btn-primary" @click="$emit('edit', props.id)">
                <i class="fa fa-edit me-2"></i>
                Edit
              </button>
              <button class="btn btn-outline-secondary" @click="$emit('go-back')">
                <i class="fa fa-arrow-left me-2"></i>
                Back
              </button>
            </div>
            </div>

          <!-- Tab Navigation -->
          <ul class="nav nav-tabs mt-4">
            <li class="nav-item">
              <a 
                :class="['nav-link', { active: activeView === 'items' }]"
                href="#"
                @click.prevent="activeView = 'items'"
              >
                <i class="fa fa-box me-2"></i>
                Price Items
                <span class="badge bg-secondary ms-2">{{ filteredItems.length }}</span>
              </a>
            </li>
            <li class="nav-item">
              <a 
                :class="['nav-link', { active: activeView === 'prices' }]"
                href="#"
                @click.prevent="activeView = 'prices'"
              >
                <i class="fa fa-users me-2"></i>
                Companion Prices
                <span class="badge bg-secondary ms-2">{{ filteredPrices.length }}</span>
              </a>
            </li>
            <li class="nav-item">
              <a 
                :class="['nav-link', { active: activeView === 'safari-extras' }]"
                href="#"
                @click.prevent="activeView = 'safari-extras'"
              >
                <i class="fa fa-briefcase me-2"></i>
                Safari Extras
                <span class="badge bg-secondary ms-2">{{ filteredSafariExtras.length }}</span>
              </a>
            </li>
            <li class="nav-item">
              <a 
                :class="['nav-link', { active: activeView === 'trophy-fees' }]"
                href="#"
                @click.prevent="activeView = 'trophy-fees'"
              >
                <i class="fa fa-trophy me-2"></i>
                Trophy Fees
                <span class="badge bg-secondary ms-2">{{ filteredTrophyFees.length }}</span>
              </a>
            </li>
            <li class="nav-item">
              <a 
                :class="['nav-link', { active: activeView === 'upgrade-fees' }]"
                href="#"
                @click.prevent="activeView = 'upgrade-fees'"
              >
                <i class="fa fa-arrow-up me-2"></i>
                Upgrade Fees
                <span class="badge bg-secondary ms-2">{{ filteredUpgradeFees.length }}</span>
              </a>
            </li>
            <li class="nav-item">
              <a 
                :class="['nav-link', { active: activeView === 'deposit-fees' }]"
                href="#"
                @click.prevent="activeView = 'deposit-fees'"
              >
                <i class="fa fa-money-bill me-2"></i>
                Deposit Fees
                <span class="badge bg-secondary ms-2">{{ filteredDepositFees.length }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <div class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading price structure...</p>
        </div>
      </div>

      <!-- Content Section -->
      <div v-else-if="structure" class="card">
        <div class="card-body">
          <!-- Items Table -->
          <div v-if="activeView === 'items'">
            <StandardDataTable
              :columns="itemsColumns"
              :data="filteredItems"
              :loading="loading"
              :disable-pagination="false"
              :default-page-size="25"
            >
              <template #hunt_length="{ row }">
                <span class="badge bg-info">
                  {{ row.hunt_length_label || (row.hunt_length_days ? `${row.hunt_length_days} days` : '-') }}
                </span>
              </template>
              <template #amount="{ row }">
                <span class="text-success fw-bold">{{ row.currency_symbol }}{{ row.amount }}</span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-sm btn-outline-danger" @click="deleteItem(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>

          <!-- Companion Prices Table -->
          <div v-else-if="activeView === 'prices'">
            <StandardDataTable
              :columns="pricesColumns"
              :data="filteredPrices"
              :loading="loading"
              :disable-pagination="false"
              :default-page-size="25"
            >
              <template #hunt_length="{ row }">
                <span class="badge bg-info">
                  {{ row.hunt_length_label || (row.hunt_length_days ? `${row.hunt_length_days} days` : '') }}
                </span>
              </template>
              <template #amount="{ row }">
                <span class="text-success fw-bold">{{ row.currency_symbol }}{{ row.amount }}</span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-sm btn-outline-danger" @click="deleteCompanion(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>

          <!-- Safari Extras Table -->
          <div v-else-if="activeView === 'safari-extras'">
            <StandardDataTable
              :columns="safariExtrasColumns"
              :data="filteredSafariExtras"
              :loading="loading"
              :disable-pagination="false"
              :default-page-size="25"
            >
              <template #pricing_unit="{ row }">
                {{ formatPricingUnit(row.pricing_unit) }}
              </template>
              <template #amount="{ row }">
                <span class="text-success fw-bold">{{ row.currency_symbol }}{{ row.amount }}</span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-sm btn-outline-danger" @click="deleteSafariExtra(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>

          <!-- Trophy Fees Table -->
          <div v-else-if="activeView === 'trophy-fees'">
            <StandardDataTable
              :columns="trophyFeesColumns"
              :data="filteredTrophyFees"
              :loading="loading"
              :disable-pagination="false"
              :default-page-size="25"
            >
              <template #amount="{ row }">
                <span class="text-success fw-bold">
                  {{ row.formatted_amount || (row.currency || '$') + ' ' + row.amount }}
                </span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-sm btn-outline-danger" @click="deleteTrophyFee(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>

          <!-- Upgrade Fees Table -->
          <div v-else-if="activeView === 'upgrade-fees'">
            <StandardDataTable
              :columns="upgradeFeesColumns"
              :data="filteredUpgradeFees"
              :action-buttons="upgradeFeeActions"
              :loading="loading"
              :disable-pagination="false"
              :default-page-size="25"
            >
              <template #package_name="{ row }">
                {{ resolveUpgradeFeePackageName(row) }}
              </template>
              <template #species="{ row }">
                {{ row.species?.name || row.species_name || 'N/A' }}
              </template>
              <template #amount="{ row }">
                <span class="text-success fw-bold">{{ formatUpgradeFeeAmount(row) }}</span>
              </template>
              <template #actions="{ row }">
                <button class="btn btn-sm btn-outline-danger" @click="deleteUpgradeFee(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
          </div>
             <div v-else-if="activeView === 'deposit-fees'">
            <StandardDataTable
              :columns="depositFeesColumns"
              :action-buttons="depositFeeActions"
              :data="filteredDepositFees"
              :loading="loading"
              :disable-pagination="false"
              :default-page-size="25"
            >
              <template #duration="{ row }">
                <span class="badge bg-info">{{ formatDepositRange(row) }}</span>
              </template>
              <template #amount="{ row }">
                <span class="text-success fw-bold">{{ formatDepositAmount(row) }}</span>
              </template>
              <template #status="{ row }">
                <span :class="['badge', row.is_active ? 'bg-success' : 'bg-secondary']">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
              </template>
              <template #notes="{ row }">
                {{ row.notes || '-' }}
              </template>
              <template #actions="{ row }">
                <button class="btn btn-sm btn-outline-primary me-1" @click="openDepositFeeModal(row)" title="Edit">
                  <i class="fa fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteDepositFee(row)" title="Delete">
                  <i class="fa fa-trash"></i>
                </button>
              </template>
            </StandardDataTable>
            </div>
          </div>

          <!-- Deposit Fee Modal -->
          <div v-if="showDepositFeeModal" class="modal-overlay" @click.self="closeDepositFeeModal">
            <div class="modal-container">
              <div class="modal-header">
                <h3>{{ depositForm.id ? 'Edit Deposit Fee' : 'Add Deposit Fee' }}</h3>
                <button class="btn-close" @click="closeDepositFeeModal">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Min Days</label>
                    <input v-model.number="depositForm.min_days" type="number" min="1" class="form-control" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Max Days</label>
                    <input v-model.number="depositForm.max_days" type="number" min="1" class="form-control" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Amount</label>
                    <input v-model.number="depositForm.deposit_amount" type="number" min="0" step="0.01" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Currency</label>
                    <select v-model.number="depositForm.currency_id" class="form-select">
                      <option value="">Select currency</option>
                      <option v-for="c in settingsStore.currencies" :key="c.value" :value="c.value">
                        {{ c.text }}
                      </option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Notes</label>
                    <textarea v-model="depositForm.notes" rows="2" class="form-control"></textarea>
                  </div>
                  <div class="col-12">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="depositForm.is_active" id="depositFeeActive">
                      <label class="form-check-label" for="depositFeeActive">
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-content-end gap-2 mt-4">
                  <button class="btn btn-outline-secondary" @click="closeDepositFeeModal">Cancel</button>
                  <button class="btn btn-primary" :disabled="savingDepositFee" @click="saveDepositFee">
                    {{ savingDepositFee ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceStructuresStore } from '@/stores/bushman/price-structures-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { useToast } from '@/composables/useToast'
import Swal from '@/utils/sweetalert2'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

const props = withDefaults(
  defineProps<{ 
    id: number
    initialView: 'items' | 'prices' | 'trophy-fees' | 'upgrade-fees' | 'deposit-fees' | 'safari-extras' 
  }>(), 
  { 
    id: 0, 
    initialView: 'items' 
  }
)

const emit = defineEmits<{
  'go-back': []
  'edit': [id: number]
}>()

const router = useRouter()
const store = usePriceStructuresStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const loading = ref(false)
const downloadingPdf = ref(false)
const structure = ref<any | null>(null)
const activeView = ref<'items' | 'prices' | 'trophy-fees' | 'upgrade-fees' | 'deposit-fees' | 'safari-extras'>(props.initialView)

// Column Definitions
const itemsColumns = [
  { key: 'name', label: 'Item Name', sortable: true },
  { key: 'hunt_length', label: 'Hunt Length', sortable: false },
  { key: 'hunting_type_name', label: 'Hunting Type', sortable: true },
  { key: 'species_count', label: 'Species Count', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]

const pricesColumns = [
  { key: 'hunt_length', label: 'Hunt Length', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]

const safariExtrasColumns = [
  { key: 'name', label: 'Extra Name', sortable: true },
  { key: 'pricing_unit', label: 'Pricing Unit', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]

const trophyFeesColumns = [
  { key: 'name', label: 'Species', sortable: true },
  { key: 'location_name', label: 'Location', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]

const upgradeFeesColumns = [
  { key: 'package_name', label: 'Package Name', sortable: true },
  { key: 'species', label: 'Species', sortable: true },
  { key: 'notes', label: 'Notes', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]

const upgradeFeeActions = [
  {
    label: 'Add Upgrade Fee',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => goToAddUpgradeFee(),
  },
]

const depositFeesColumns = [
  { key: 'duration', label: 'Duration (Days)', sortable: false },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'notes', label: 'Notes', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false },
]

const depositFeeActions = [
  {
    label: 'Add Deposit Fee',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openDepositFeeModal(),
  },
]

const baseItems = computed(() => structure.value?.items || [])
const safariExtras = computed(() => structure.value?.safari_extras || [])
const trophyFees = computed(() => structure.value?.trophy_fees || [])
const upgradeFees = computed(() => structure.value?.upgrade_fees || [])
const depositFees = computed(() => structure.value?.deposit_fees || [])

const showDepositFeeModal = ref(false)
const savingDepositFee = ref(false)
const depositForm = ref({
  id: null as number | null,
  min_days: null as number | null,
  max_days: null as number | null,
  deposit_amount: null as number | null,
  currency_id: null as number | null,
  notes: '',
  is_active: true,
})

const filteredItems = computed(() => baseItems.value || [])

const filteredPrices = computed(() => {
  return [
    ...(structure.value?.companion_hunter_prices || []).map((c: any) => ({
      ...c,
      type: 'companion',
      uniqueKey: `comp-${c.id}`
    }))
  ]
})

const filteredSafariExtras = computed(() => safariExtras.value || [])
const filteredTrophyFees = computed(() => trophyFees.value || [])
const filteredUpgradeFees = computed(() => upgradeFees.value || [])
const filteredDepositFees = computed(() => depositFees.value || [])

const refresh = async () => {
  loading.value = true
  try {
    await store.get(props.id)
    structure.value = store.current
    const upgradeFeesResponse = await store.listUpgradeFees({
      price_structure_id: props.id,
      per_page: 1000
    })

    // Normalize response: support paginated { data: { data: [...] } } and plain arrays
    const raw = upgradeFeesResponse.data?.data ?? upgradeFeesResponse.data ?? []
    let entries: any[] = []
    if (Array.isArray(raw)) {
      entries = raw
    } else if (Array.isArray(raw.data)) {
      entries = raw.data
    } else {
      entries = []
    }

    // Flatten groups (grouped by sales package) into individual fee rows
    const flattened: any[] = []
    entries.forEach((group: any) => {
      // If group contains upgrade_rows (grouped response), flatten each row
      if (Array.isArray(group.upgrade_rows) && group.upgrade_rows.length > 0) {
        group.upgrade_rows.forEach((row: any, idx: number) => {
          const normalized: any = {
            // Preserve backend-provided fields and add package-level context
            ...row,
            id: row.id ?? row.price_structure_detail_id ?? `${group.id}_${idx}`,
            package_id: row.package_id ?? group.id,
            package_name: row.package_name ?? group.name
          }

          // Normalize species: backend may send species as a string or object
          if (typeof row.species === 'string') {
            normalized.species_name = row.species
            normalized.species = { name: row.species }
          } else if (row.species && typeof row.species === 'object') {
            normalized.species_name = row.species.name ?? row.species_name ?? ''
            // ensure species is an object with name
            normalized.species = { name: row.species.name ?? row.species_name ?? '' }
          } else {
            normalized.species_name = row.species_name ?? ''
          }

          flattened.push(normalized)
        })
      } else {
        // If group already looks like a single fee row, include it
        if (group.species_id || group.amount || group.fee_amount) {
          const normalizedGroup: any = {
            ...group,
            id: group.id ?? group.price_structure_detail_id ?? group.id
          }

          if (typeof group.species === 'string') {
            normalizedGroup.species_name = group.species
            normalizedGroup.species = { name: group.species }
          } else if (group.species && typeof group.species === 'object') {
            normalizedGroup.species_name = group.species.name ?? group.species_name ?? ''
            normalizedGroup.species = { name: group.species.name ?? group.species_name ?? '' }
          } else {
            normalizedGroup.species_name = group.species_name ?? ''
          }

          flattened.push(normalizedGroup)
        }
      }
    })

    if (structure.value) {
      structure.value.upgrade_fees = flattened
    }

    await fetchDepositFees()
  } catch (error) {
    toast.init({ message: 'Failed to load structure', color: 'danger' })
    if (structure.value) {
      structure.value.upgrade_fees = []
      structure.value.deposit_fees = []
    }
  } finally {
    loading.value = false
  }
}

const formatDateShort = (isoDate: string | null) => {
  if (!isoDate) return ''
  try {
    return new Date(isoDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch {
    return isoDate
  }
}

const formatPricingUnit = (unit: string | null) => {
  if (!unit) return ''
  return unit.replace(/_/g, ' ').toLowerCase().replace(/(^|\\s)\\S/g, (t) => t.toUpperCase())
}

const getSequenceLabel = (sequence: number | string | null) => {
  if (!sequence) return 'N/A'
  const seq = Number(sequence)
  if (seq === 1) return '1st'
  if (seq === 2) return '2nd'
  if (seq === 3) return '3rd'
  return `${seq}th`
}

function resolveUpgradeFeePackageName(fee: any) {
  return (
    fee.price_structure_detail?.sales_package?.name ||
    fee.sales_package?.name ||
    fee.price_structure_detail?.name ||
    fee.package_name ||
    '-'
  )
}

function formatUpgradeFeeAmount(fee: any) {
  // Prefer formatted amount from backend when present
  if (fee.amount_formatted) return fee.amount_formatted

  const amount = Number(fee.fee_amount ?? fee.amount ?? 0)

  // Currency can be an object or a simple symbol/code string
  const rawCurrency = fee.currency
  const currencySymbol = typeof rawCurrency === 'object' ? (rawCurrency?.symbol || rawCurrency?.code || rawCurrency?.name || '') : (rawCurrency || '')

  if (!currencySymbol) return amount.toFixed(2)

  // If currencySymbol looks like a symbol (non-alphanumeric), attach without space
  if (/^[^A-Za-z0-9\s]+$/.test(currencySymbol)) {
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  return `${currencySymbol} ${amount.toFixed(2)}`
}

const formatDepositRange = (fee: any) => {
  const minDays = fee.min_days ?? ''
  const maxDays = fee.max_days
  if (!maxDays && maxDays !== 0) {
    return `${minDays} +`
  }
  return `${minDays} - ${maxDays}`
}

const formatDepositAmount = (fee: any) => {
  const amount = Number(fee.deposit_amount ?? fee.amount ?? 0)
  const currency = fee.currency
  const symbol = typeof currency === 'object'
    ? (currency?.symbol || currency?.code || currency?.name || '')
    : (currency || '')

  if (!symbol) return amount.toFixed(2)
  if (/^[^A-Za-z0-9\s]+$/.test(symbol)) {
    return `${symbol}${amount.toFixed(2)}`
  }
  return `${symbol} ${amount.toFixed(2)}`
}

const resetDepositFeeForm = () => {
  depositForm.value = {
    id: null,
    min_days: null,
    max_days: null,
    deposit_amount: null,
    currency_id: null,
    notes: '',
    is_active: true,
  }
}

const openDepositFeeModal = (fee: any = null) => {
  if (fee) {
    depositForm.value = {
      id: fee.id ?? null,
      min_days: fee.min_days ?? null,
      max_days: fee.max_days ?? null,
      deposit_amount: fee.deposit_amount ?? null,
      currency_id: fee.currency_id ?? fee.currency?.id ?? null,
      notes: fee.notes ?? '',
      is_active: fee.is_active ?? true,
    }
  } else {
    resetDepositFeeForm()
  }
  showDepositFeeModal.value = true
}

const closeDepositFeeModal = () => {
  showDepositFeeModal.value = false
  resetDepositFeeForm()
}

const fetchDepositFees = async () => {
  if (!structure.value) return
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/deposit-fees`
    const response = await fetch(`${url}?price_structure_id=${props.id}&per_page=1000`)
    const data = await response.json()
    const rows = data?.data?.data ?? data?.data ?? []
    structure.value.deposit_fees = Array.isArray(rows) ? rows : []
  } catch {
    structure.value.deposit_fees = []
  }
}

const confirmDelete = async (label: string) => {
  const result = await Swal.fire({
    title: `Delete ${label}?`,
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  })
  return result.isConfirmed
}

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data?.message || data?.error || fallback
    }
    const text = await response.text()
    return text || fallback
  } catch {
    return fallback
  }
}

const saveDepositFee = async () => {
  if (!depositForm.value.min_days || !depositForm.value.deposit_amount || !depositForm.value.currency_id) {
    toast.init({ message: 'Please fill required fields', color: 'warning' })
    return
  }

  savingDepositFee.value = true
  try {
    const payload = {
      price_structure_id: props.id,
      min_days: Number(depositForm.value.min_days),
      max_days: depositForm.value.max_days ? Number(depositForm.value.max_days) : null,
      deposit_amount: Number(depositForm.value.deposit_amount),
      currency_id: Number(depositForm.value.currency_id),
      notes: depositForm.value.notes || null,
      is_active: !!depositForm.value.is_active,
    }

    const baseUrl = `${import.meta.env.VITE_APP_BASE_URL}settings/deposit-fees`
    const hasId = !!depositForm.value.id
    const url = hasId ? `${baseUrl}/${depositForm.value.id}` : baseUrl
    const method = hasId ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Failed to save deposit fee')
    }

    toast.init({ message: hasId ? 'Deposit fee updated' : 'Deposit fee created', color: 'success' })
    closeDepositFeeModal()
    await fetchDepositFees()
  } catch {
    toast.init({ message: 'Failed to save deposit fee', color: 'danger' })
  } finally {
    savingDepositFee.value = false
  }
}

const deleteDepositFee = async (fee: any) => {
  const ok = await confirmDelete('deposit fee')
  if (!ok) return
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/deposit-fees/${fee.id}`
    const response = await fetch(url, { method: 'DELETE' })
    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to delete deposit fee')
      throw new Error(message)
    }
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Deposit fee deleted' })
    await fetchDepositFees()
  } catch (error: any) {
    await Swal.fire({ icon: 'error', title: 'Delete failed', text: error?.message || 'Failed to delete deposit fee' })
  }
}

const downloadPdf = async () => {
  if (downloadingPdf.value) return
  downloadingPdf.value = true
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structures/${props.id}/pdf`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch PDF')

    let base64 = ''
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      base64 = data?.data || data?.pdf || data?.base64 || ''
    } else {
      base64 = (await response.text()).trim()
    }

    if (base64.startsWith('data:')) {
      const parts = base64.split(',')
      base64 = parts[1] || ''
    }

    if (!base64) throw new Error('Empty PDF payload')

    const byteString = atob(base64)
    const bytes = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i += 1) {
      bytes[i] = byteString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `price-structure-${props.id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)
    toast.init({ message: 'PDF downloaded', color: 'success' })
  } catch (error) {
    toast.init({ message: 'Failed to download PDF', color: 'danger' })
  } finally {
    downloadingPdf.value = false
  }
}

const deleteItem = async (item: any) => {
  const ok = await confirmDelete('item')
  if (!ok) return
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-items/${item.id}`
    const response = await fetch(url, { method: 'DELETE' })
    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to delete item')
      throw new Error(message)
    }
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Item deleted' })
    await refresh()
  } catch (error: any) {
    await Swal.fire({ icon: 'error', title: 'Delete failed', text: error?.message || 'Failed to delete item' })
  }
}

const deleteCompanion = async (c: any) => {
  const ok = await confirmDelete('companion price')
  if (!ok) return
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structures/${props.id}/companion-hunter-prices/${c.id}`
    const response = await fetch(url, { method: 'DELETE' })
    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to delete companion price')
      throw new Error(message)
    }
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Companion price deleted' })
    await refresh()
  } catch (error: any) {
    await Swal.fire({ icon: 'error', title: 'Delete failed', text: error?.message || 'Failed to delete companion price' })
  }
}

const deleteSafariExtra = async (extra: any) => {
  const ok = await confirmDelete('safari extra')
  if (!ok) return
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structure-items/${extra.id}`
    const response = await fetch(url, { method: 'DELETE' })
    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to delete safari extra')
      throw new Error(message)
    }
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Safari extra deleted' })
    await refresh()
  } catch (error: any) {
    await Swal.fire({ icon: 'error', title: 'Delete failed', text: error?.message || 'Failed to delete safari extra' })
  }
}

const deleteTrophyFee = async (fee: any) => {
  const ok = await confirmDelete('trophy fee')
  if (!ok) return
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees/${fee.id}`
    const response = await fetch(url, { method: 'DELETE' })
    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to delete trophy fee')
      throw new Error(message)
    }
    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Trophy fee deleted' })
    await refresh()
  } catch (error: any) {
    await Swal.fire({ icon: 'error', title: 'Delete failed', text: error?.message || 'Failed to delete trophy fee' })
  }
}

const deleteUpgradeFee = async (fee: any) => {
  const ok = await confirmDelete('upgrade fee')
  if (!ok) return

  try {
    const salesPackageId = fee.package_id ?? fee.sales_package_id
    const priceStructureId = props.id

    let url = ''
    if (salesPackageId && priceStructureId) {
      url = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees/by-package/${salesPackageId}/${priceStructureId}`
    } else {
      // Fallback: delete a single upgrade fee
      const idToDelete = fee.id ?? fee.price_structure_detail_id
      if (!idToDelete) {
        await Swal.fire({ icon: 'warning', title: 'Missing ID', text: 'Cannot determine upgrade fee id' })
        return
      }
      url = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees/${idToDelete}`
    }

    const response = await fetch(url, { method: 'DELETE' })
    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to delete upgrade fee')
      throw new Error(message)
    }

    await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Upgrade fee deleted' })
    await refresh()
  } catch (error: any) {
    await Swal.fire({ icon: 'error', title: 'Delete failed', text: error?.message || 'Failed to delete upgrade fee' })
  }
}


const goToAddUpgradeFee = () => {
  router.push({ name: 'price-structure-upgrade-fee-create', params: { id: props.id } })
}


const goToAddDepositFee = () => {
  router.push({ name: 'price-structure-deposit-fee-create', params: { id: props.id } })
}

onMounted(async () => {
  await Promise.all([
    refresh(),
    settingsStore.getCurrencies()
  ])
})
</script>

<style scoped>
.price-structure-details {
  background: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.page-header {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

/* Bootstrap Nav Tabs Enhancement */
.nav-tabs {
  border-bottom: 2px solid #dee2e6;
}

.nav-tabs .nav-link {
  color: #6c757d;
  font-weight: 500;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.25rem;
  margin-bottom: -2px;
  transition: all 0.2s ease;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
  background: #f8f9fa;
  border-color: transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  background: transparent;
  border-color: transparent transparent #0d6efd transparent;
}

.nav-tabs .nav-link .badge {
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-tabs .nav-link:not(.active) .badge {
  background-color: #e9ecef !important;
  color: #6c757d !important;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
}

.modal-container {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  line-height: 1;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    font-size: 1.5rem;
  }

  .nav-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .nav-tabs .nav-link {
    white-space: nowrap;
  }

  .nav-tabs .nav-link i {
    display: none;
  }
}
</style>

