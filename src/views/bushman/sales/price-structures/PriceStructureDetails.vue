<template>
  <div class="price-structure-details">
    <div class="container-fluid px-2 py-2">
      <!-- Header Section -->
      <div class="header-card" v-if="structure">
        <div class="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 class="structure-title mb-2">{{ structure.location_name || structure.area_name || structure.area?.name || structure.area || 'Price Structure' }}</h2>
            <div class="date-range">
              <i class="fa fa-calendar me-2"></i>
              <span>{{ formatDateShort(structure.start_date) }} - {{ formatDateShort(structure.end_date) }}</span>
            </div>
          </div>
        <div class="header-actions">
          <button 
            class="btn btn-outline-primary" 
            @click="downloadPdf" 
            :disabled="downloadingPdf"
          >
            <i class="fa fa-file-pdf me-2"></i>
            {{ downloadingPdf ? 'Downloading...' : 'Download PDF' }}
          </button>
          <button class="btn btn-outline-success" @click="$emit('edit', props.id)">
            <i class="fa fa-edit me-2"></i>
            Edit Price Structure
          </button>
          <button class="btn btn-outline-secondary" @click="$emit('go-back')">
            <i class="fa fa-arrow-left me-2"></i> Back to List
          </button>
        </div>
      </div>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button 
            :class="['tab-btn', { active: activeView === 'items' }]"
            @click="activeView = 'items'"
          >
            <i class="fa fa-box"></i>
            <span>Price Items</span>
            <span class="badge">{{ filteredItems.length }}</span>
          </button>
          <button 
            :class="['tab-btn', { active: activeView === 'prices' }]"
            @click="activeView = 'prices'"
          >
            <i class="fa fa-users"></i>
            <span>Companion Prices</span>
            <span class="badge">{{ filteredPrices.length }}</span>
          </button>
          <button 
            :class="['tab-btn', { active: activeView === 'safari-extras' }]"
            @click="activeView = 'safari-extras'"
          >
            <i class="fa fa-briefcase"></i>
            <span>Safari Extras</span>
            <span class="badge">{{ filteredSafariExtras.length }}</span>
          </button>
          <button 
            :class="['tab-btn', { active: activeView === 'trophy-fees' }]"
            @click="activeView = 'trophy-fees'"
          >
            <i class="fa fa-trophy"></i>
            <span>Trophy Fees</span>
            <span class="badge">{{ filteredTrophyFees.length }}</span>
          </button>
          <button 
            :class="['tab-btn', { active: activeView === 'upgrade-fees' }]"
            @click="activeView = 'upgrade-fees'"
          >
            <i class="fa fa-arrow-up"></i>
            <span>Upgrade Fees</span>
            <span class="badge">{{ filteredUpgradeFees.length }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading price structure...</p>
      </div>

      <!-- Content Section -->
      <div v-else-if="structure" class="content-card">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="search-box">
            <i class="fa fa-search"></i>
            <input 
              v-model="searchTerm" 
              type="text" 
              placeholder="Search..." 
            />
          </div>
          <div v-if="activeView === 'upgrade-fees'" class="action-buttons">
            <button class="btn-add" @click="goToAddUpgradeFee">
              <i class="fa fa-plus"></i>
              Add Upgrade Fee
            </button>
          </div>

        </div>

        <!-- Data Tables -->
        <div class="table-container">
          <!-- Items Table -->
          <table v-if="activeView === 'items'" class="modern-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Hunt Length</th>
                <th>Hunting Type</th>
                <th>Species Count</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id">
                <td>
                  <div class="item-name">{{ item.name }}</div>
                </td>
                <td>
                  <span class="badge-info">{{ item.hunt_length_label || (item.hunt_length_days ? `${item.hunt_length_days} days` : '-') }}</span>
                </td>
                <td>{{ item.hunting_type_name }}</td>
                <td>{{ item.species_count || 0 }}</td>
                <td class="text-end">
                  <span class="amount">{{ item.currency_symbol }}{{ item.amount }}</span>
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-danger" @click="deleteItem(item)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredItems.length === 0">
                <td colspan="6" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No items found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Prices Table (Companion Only) -->
          <table v-else-if="activeView === 'prices'" class="modern-table">
            <thead>
              <tr>
                <th>Hunt Length</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="price in filteredPrices" :key="price.uniqueKey">
                <td>
                  <span class="badge-info">{{ price.hunt_length_label || (price.hunt_length_days ? `${price.hunt_length_days} days` : '') }}</span>
                </td>
                <td class="text-end">
                  <span class="amount">{{ price.currency_symbol }}{{ price.amount }}</span>
                </td>
                <td class="text-center">
                  <button 
                    class="btn-icon btn-danger" 
                    @click="deleteCompanion(price)"
                    title="Delete"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPrices.length === 0">
                <td colspan="3" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No companion prices found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Trophy Fees Table -->
          <table v-else-if="activeView === 'trophy-fees'" class="modern-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Location</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fee in filteredTrophyFees" :key="fee.id">
                <td>
                  <div class="item-name">{{ fee.name || 'N/A' }}</div>
                </td>
                <td class="text-muted">{{ fee.location_name || '-' }}</td>
                <td class="text-end">
                  <span class="amount">{{ fee.formatted_amount || (fee.currency || '$') + ' ' + fee.amount }}</span>
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-danger" @click="deleteTrophyFee(fee)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredTrophyFees.length === 0">
                <td colspan="4" class="empty-state">
                  <i class="fa fa-trophy"></i>
                  <p>No trophy fees found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Upgrade Fees Table -->
          <table v-else-if="activeView === 'upgrade-fees'" class="modern-table">
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Species</th>
                <th>Trigger Condition</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fee in filteredUpgradeFees" :key="fee.id">
                <td>
                  <div class="item-name">{{ resolveUpgradeFeePackageName(fee) }}</div>
                </td>
                <td>
                  <div class="item-name">{{ fee.species?.name || fee.species_name || 'N/A' }}</div>
                </td>
                <td class="text-muted">{{ fee.trigger_condition || '-' }}</td>
                <td class="text-end">
                  <span class="amount">{{ formatUpgradeFeeAmount(fee) }}</span>
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-danger" @click="deleteUpgradeFee(fee)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredUpgradeFees.length === 0">
                <td colspan="5" class="empty-state">
                  <i class="fa fa-arrow-up"></i>
                  <p>No upgrade fees found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Safari Extras Table -->
          <table v-else-if="activeView === 'safari-extras'" class="modern-table">
            <thead>
              <tr>
                <th>Extra Name</th>
                <th>Pricing Unit</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="extra in filteredSafariExtras" :key="extra.id">
                <td>
                  <div class="item-name">{{ extra.name }}</div>
                </td>
                <td>{{ formatPricingUnit(extra.pricing_unit) }}</td>
                <td class="text-end">
                  <span class="amount">{{ extra.currency_symbol }}{{ extra.amount }}</span>
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-danger" @click="deleteSafariExtra(extra)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredSafariExtras.length === 0">
                <td colspan="4" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No safari extras found</p>
                </td>
              </tr>
            </tbody>
          </table>
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

const props = withDefaults(
  defineProps<{ 
    id: number
    initialView: 'items' | 'prices' | 'trophy-fees' | 'upgrade-fees' | 'safari-extras' 
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
const activeView = ref<'items' | 'prices' | 'trophy-fees' | 'upgrade-fees' | 'safari-extras'>(props.initialView)
const searchTerm = ref('')

const baseItems = computed(() => structure.value?.items || [])

const safariExtras = computed(() => structure.value?.safari_extras || [])

const trophyFees = computed(() => structure.value?.trophy_fees || [])

const upgradeFees = computed(() => structure.value?.upgrade_fees || [])

const filteredItems = computed(() => {
  const items = baseItems.value || []
  if (!searchTerm.value) return items
  
  const term = searchTerm.value.toLowerCase()
  return items.filter((item: any) =>
    item.name?.toLowerCase().includes(term) ||
    item.hunting_type_name?.toLowerCase().includes(term) ||
    item.hunt_length_label?.toLowerCase().includes(term) ||
    item.hunt_length_days?.toString().includes(term) ||
    item.species_count?.toString().includes(term)
  )
})

const filteredPrices = computed(() => {
  const prices = [
    ...(structure.value?.companion_hunter_prices || []).map((c: any) => ({
      ...c,
      type: 'companion',
      uniqueKey: `comp-${c.id}`
    }))
  ]

  if (!searchTerm.value) return prices
  
  const term = searchTerm.value.toLowerCase()
  return prices.filter((p) =>
    p.hunt_length_days?.toString().includes(term) ||
    p.amount?.toString().includes(term)
  )
})

const filteredSafariExtras = computed(() => {
  const items = safariExtras.value || []
  if (!searchTerm.value) return items

  const term = searchTerm.value.toLowerCase()
  return items.filter((extra: any) =>
    extra.name?.toLowerCase().includes(term) ||
    extra.pricing_unit?.toLowerCase().includes(term) ||
    extra.amount?.toString().includes(term)
  )
})

const filteredTrophyFees = computed(() => {
  const fees = trophyFees.value || []
  if (!searchTerm.value) return fees

  const term = searchTerm.value.toLowerCase()
  return fees.filter((fee: any) =>
    fee.name?.toLowerCase().includes(term) ||
    fee.location_name?.toLowerCase().includes(term) ||
    fee.amount?.toString().includes(term)
  )
})

const filteredUpgradeFees = computed(() => {
  const fees = upgradeFees.value || []
  if (!searchTerm.value) return fees

  const term = searchTerm.value.toLowerCase()
  return fees.filter((fee: any) =>
    resolveUpgradeFeePackageName(fee).toLowerCase().includes(term) ||
    fee.species?.name?.toLowerCase().includes(term) ||
    fee.species_name?.toLowerCase().includes(term) ||
    fee.trigger_condition?.toLowerCase().includes(term) ||
    fee.notes?.toLowerCase().includes(term) ||
    fee.fee_amount?.toString().includes(term) ||
    fee.amount?.toString().includes(term) ||
    fee.currency?.toLowerCase()?.includes(term) ||
    fee.currency?.code?.toLowerCase().includes(term) ||
    fee.currency?.name?.toLowerCase().includes(term)
  )
})

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
  } catch (error) {
    toast.init({ message: 'Failed to load structure', color: 'danger' })
    if (structure.value) {
      structure.value.upgrade_fees = []
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
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-items/${item.id}`
    await fetch(url, { method: 'DELETE' })
    toast.init({ message: 'Item deleted', color: 'success' })
    await refresh()
  } catch {
    toast.init({ message: 'Failed to delete item', color: 'danger' })
  }
}

const deleteCompanion = async (c: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structures/${props.id}/companion-hunter-prices/${c.id}`
    await fetch(url, { method: 'DELETE' })
    toast.init({ message: 'Companion price deleted', color: 'success' })
    await refresh()
  } catch {
    toast.init({ message: 'Failed to delete companion price', color: 'danger' })
  }
}

const deleteSafariExtra = async (extra: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structure-items/${extra.id}`
    await fetch(url, { method: 'DELETE' })
    toast.init({ message: 'Safari extra deleted', color: 'success' })
    await refresh()
  } catch {
    toast.init({ message: 'Failed to delete safari extra', color: 'danger' })
  }
}

const deleteTrophyFee = async (fee: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees/${fee.id}`
    await fetch(url, { method: 'DELETE' })
    toast.init({ message: 'Trophy fee deleted', color: 'success' })
    await refresh()
  } catch {
    toast.init({ message: 'Failed to delete trophy fee', color: 'danger' })
  }
}

const deleteUpgradeFee = async (fee: any) => {
  try {
    // Prefer the backend's detail id if available, fallback to generic id
    const idToDelete = fee.price_structure_detail_id ?? fee.id
    if (!idToDelete) {
      toast.init({ message: 'Cannot determine upgrade fee id', color: 'warning' })
      return
    }
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees/${idToDelete}`
    await fetch(url, { method: 'DELETE' })
    toast.init({ message: 'Upgrade fee deleted', color: 'success' })
    await refresh()
  } catch {
    toast.init({ message: 'Failed to delete upgrade fee', color: 'danger' })
  }
}

const goToAddUpgradeFee = () => {
  router.push({ name: 'price-structure-upgrade-fee-create', params: { id: props.id } })
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
}

/* Header Card */
.header-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.structure-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.date-range {
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 14px;
}

.date-range i {
  color: #0d6efd;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e9ecef;
  margin-top: 24px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.tab-btn i {
  font-size: 16px;
}

.tab-btn:hover {
  color: #0d6efd;
  background: #f8f9fa;
}

.tab-btn.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
}

.tab-btn .badge {
  background: #e9ecef;
  color: #6c757d;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.tab-btn.active .badge {
  background: #0d6efd;
  color: white;
}

/* Content Card */
.content-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-box input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background: #0b5ed7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

/* Table Container */
.table-container {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.modern-table thead tr {
  background: #f8f9fa;
}

.modern-table th {
  padding: 16px 24px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9ecef;
}

.modern-table tbody tr {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f1f3f5;
}

.modern-table tbody tr:hover {
  background: #f8f9fa;
}

.modern-table td {
  padding: 20px 24px;
  color: #495057;
  font-size: 14px;
}

/* Badges and Pills */
.badge-info {
  display: inline-block;
  padding: 6px 12px;
  background: #e7f1ff;
  color: #0d6efd;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.badge-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.badge-type.observer {
  background: #fff3cd;
  color: #856404;
}

.badge-type.companion {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-currency {
  display: inline-block;
  padding: 4px 10px;
  background: #f8f9fa;
  color: #495057;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

.condition-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #f8f9fa;
  color: #495057;
  border-radius: 8px;
  font-size: 13px;
}

.amount {
  font-size: 16px;
  font-weight: 700;
  color: #198754;
}

.item-name,
.species-name {
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

/* Icon Buttons */
.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.btn-danger {
  background: #fff5f5;
  color: #dc3545;
}

.btn-icon.btn-danger:hover {
  background: #dc3545;
  color: white;
  transform: scale(1.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px !important;
  color: #adb5bd;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .header-card {
    padding: 20px;
  }

  .structure-title {
    font-size: 18px;
  }

  .tab-navigation {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tab-btn span:not(.badge) {
    display: none;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .action-buttons {
    justify-content: stretch;
  }

  .btn-add {
    flex: 1;
    justify-content: center;
  }

  .modern-table th,
  .modern-table td {
    padding: 12px 16px;
  }
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
  border-radius: 16px;
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
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>

