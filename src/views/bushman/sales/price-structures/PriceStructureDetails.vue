<template>
  <div class="price-structure-details">
    <div class="container-fluid px-2 py-2">
      <!-- Header Section -->
      <div class="header-card" v-if="structure">
        <div class="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 class="structure-title mb-2">{{ structure.area_name || 'Price Structure' }}</h2>
            <div class="date-range">
              <i class="fa fa-calendar me-2"></i>
              <span>{{ formatDateShort(structure.start_date) }} — {{ formatDateShort(structure.end_date) }}</span>
            </div>
          </div>
          <button class="btn btn-outline-secondary" @click="$emit('go-back')">
            <i class="fa fa-arrow-left me-2"></i> Back to List
          </button>
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
            <span>Observer & Companion</span>
            <span class="badge">{{ filteredPrices.length }}</span>
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

          <div class="action-buttons">
            <button class="btn-add" @click="goToAddItem" v-if="activeView === 'items'">
              <i class="fa fa-plus"></i> Add Item
            </button>
            <button class="btn-add" @click="openAddObserver" v-if="activeView === 'prices'">
              <i class="fa fa-plus"></i> Add Observer
            </button>
            <button class="btn-add" @click="openAddCompanion" v-if="activeView === 'prices'">
              <i class="fa fa-plus"></i> Add Companion
            </button>
            <button class="btn-add" @click="goToAddTrophyFee" v-if="activeView === 'trophy-fees'">
              <i class="fa fa-plus"></i> Add Trophy Fee
            </button>
            <button class="btn-add" @click="goToAddUpgradeFee" v-if="activeView === 'upgrade-fees'">
              <i class="fa fa-plus"></i> Add Upgrade Fee
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
                  <span class="badge-info">{{ item.hunt_length_label }}</span>
                </td>
                <td>{{ item.hunting_type_name }}</td>
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
                <td colspan="5" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No items found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Prices Table -->
          <table v-else-if="activeView === 'prices'" class="modern-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Hunt Length</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="price in filteredPrices" :key="price.uniqueKey">
                <td>
                  <span :class="['badge-type', price.type === 'observer' ? 'observer' : 'companion']">
                    <i :class="['fa', price.type === 'observer' ? 'fa-eye' : 'fa-user-friends']"></i>
                    {{ price.type === 'observer' ? 'Observer' : 'Companion' }}
                  </span>
                </td>
                <td>
                  <span class="badge-info">{{ price.hunt_length_label }}</span>
                </td>
                <td class="text-end">
                  <span class="amount">{{ price.currency_symbol }}{{ price.amount }}</span>
                </td>
                <td class="text-center">
                  <button 
                    class="btn-icon btn-danger" 
                    @click="price.type === 'observer' ? deleteObserver(price) : deleteCompanion(price)"
                    title="Delete"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPrices.length === 0">
                <td colspan="4" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No prices found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Trophy Fees Table -->
          <table v-else-if="activeView === 'trophy-fees'" class="modern-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Area</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fee in filteredTrophyFees" :key="fee.id">
                <td>
                  <div class="species-name">
                    <i class="fa fa-paw me-2"></i>
                    <div>
                      <div>{{ fee.species?.name || fee.species_name || `ID: ${fee.species_id}` }}</div>
                      <small v-if="fee.species?.swahili_name" class="text-muted d-block">
                        {{ fee.species.swahili_name }}
                      </small>
                    </div>
                  </div>
                </td>
                <td>{{ fee.area?.name || fee.area_name || (fee.area_id ? `ID: ${fee.area_id}` : 'N/A') }}</td>
                <td class="text-end">
                  <div>
                    <span class="amount">{{ fee.currency?.symbol || fee.currency_symbol || '$' }}{{ fee.amount }}</span>
                    <div v-if="fee.durations && fee.durations.length > 0" class="mt-1">
                      <small class="text-muted">
                        Durations: {{ fee.durations.filter((d: any) => d.is_allowed).map((d: any) => d.hunt_length?.label || `${d.hunt_length?.days || d.hunt_length_id} days`).join(', ') || 'All' }}
                      </small>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-danger" @click="deleteTrophyFee(fee)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredTrophyFees.length === 0">
                <td colspan="4" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No trophy fees found</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Upgrade Fees Table -->
          <table v-else-if="activeView === 'upgrade-fees'" class="modern-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Trigger Condition</th>
                <th class="text-end">Fee Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fee in filteredUpgradeFees" :key="fee.id">
                <td>
                  <div class="species-name">
                    <i class="fa fa-paw me-2"></i>
                    {{ fee.species_name }}
                  </div>
                </td>
                <td>
                  <span class="condition-badge">{{ fee.trigger_condition }}</span>
                </td>
                <td class="text-end">
                  <span class="amount">{{ fee.currency_symbol }}{{ fee.fee_amount }}</span>
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-danger" @click="deleteUpgradeFee(fee)" title="Delete">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredUpgradeFees.length === 0">
                <td colspan="4" class="empty-state">
                  <i class="fa fa-inbox"></i>
                  <p>No upgrade fees found</p>
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
    initialView?: 'items' | 'prices' | 'trophy-fees' | 'upgrade-fees' 
  }>(), 
  { 
    id: 0, 
    initialView: 'items' 
  }
)

const emit = defineEmits<{
  'go-back': []
}>()

const router = useRouter()
const store = usePriceStructuresStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const loading = ref(false)
const structure = ref<any | null>(null)
const trophyFees = ref<any[]>([])
const activeView = ref<'items' | 'prices' | 'trophy-fees' | 'upgrade-fees'>(props.initialView)
const searchTerm = ref('')

const filteredItems = computed(() => {
  if (!structure.value?.items) return []
  if (!searchTerm.value) return structure.value.items
  
  const term = searchTerm.value.toLowerCase()
  return structure.value.items.filter((item: any) =>
    item.name?.toLowerCase().includes(term) ||
    item.hunting_type_name?.toLowerCase().includes(term) ||
    item.hunt_length_days?.toString().includes(term)
  )
})

const filteredPrices = computed(() => {
  const prices = [
    ...(structure.value?.observer_hunter_prices || []).map((o: any) => ({
      ...o,
      type: 'observer',
      uniqueKey: `obs-${o.id}`
    })),
    ...(structure.value?.companion_hunter_prices || []).map((c: any) => ({
      ...c,
      type: 'companion',
      uniqueKey: `comp-${c.id}`
    }))
  ]

  if (!searchTerm.value) return prices
  
  const term = searchTerm.value.toLowerCase()
  return prices.filter((p) =>
    p.type.includes(term) ||
    p.hunt_length_days?.toString().includes(term) ||
    p.amount?.toString().includes(term)
  )
})

const filteredUpgradeFees = computed(() => {
  if (!structure.value?.upgrade_fees) return []
  if (!searchTerm.value) return structure.value.upgrade_fees
  
  const term = searchTerm.value.toLowerCase()
  return structure.value.upgrade_fees.filter((fee: any) =>
    fee.trigger_condition?.toLowerCase().includes(term) ||
    fee.species_name?.toLowerCase().includes(term) ||
    fee.fee_amount?.toString().includes(term)
  )
})

const filteredTrophyFees = computed(() => {
  if (!trophyFees.value) return []
  if (!searchTerm.value) return trophyFees.value
  
  const term = searchTerm.value.toLowerCase()
  return trophyFees.value.filter((fee: any) =>
    fee.species_name?.toLowerCase().includes(term) ||
    fee.area_name?.toLowerCase().includes(term) ||
    fee.amount?.toString().includes(term)
  )
})

const fetchTrophyFees = async () => {
  try {
    // Try to get from price structure first (if it includes trophyFees relation)
    if (structure.value?.trophy_fees && Array.isArray(structure.value.trophy_fees)) {
      trophyFees.value = structure.value.trophy_fees
      return
    }
    
    // Fallback: fetch from dedicated endpoint
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees?price_structure_id=${props.id}`
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      trophyFees.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    }
  } catch (error) {
    console.warn('Failed to load trophy fees:', error)
    trophyFees.value = []
  }
}

const refresh = async () => {
  loading.value = true
  try {
    await store.get(props.id)
    structure.value = store.current
    // Fetch trophy fees after structure is loaded
    await fetchTrophyFees()
  } catch (error) {
    toast?.init({ message: 'Failed to load structure', color: 'danger' })
  } finally {
    loading.value = false
  }
}

const formatDateShort = (isoDate?: string | null) => {
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

const goToAddItem = () => {
  router.push({ name: 'price-structure-item-create', params: { id: props.id } })
}

const openAddCompanion = () => {
  router.push({ name: 'price-structure-companion-create', params: { id: props.id } })
}

const openAddObserver = () => {
  router.push({ name: 'price-structure-observer-create', params: { id: props.id } })
}

const goToAddUpgradeFee = () => {
  router.push({ name: 'price-structure-upgrade-fee-create', params: { id: props.id } })
}

const goToAddTrophyFee = () => {
  router.push({ name: 'price-structure-trophy-fee-create', params: { id: props.id } })
}

const deleteItem = async (item: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structures/${props.id}/items/${item.id}`
    await fetch(url, { method: 'DELETE' })
    toast?.init({ message: 'Item deleted', color: 'success' })
    await refresh()
  } catch {
    toast?.init({ message: 'Failed to delete item', color: 'danger' })
  }
}

const deleteCompanion = async (c: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structures/${props.id}/companion-hunter-prices/${c.id}`
    await fetch(url, { method: 'DELETE' })
    toast?.init({ message: 'Companion price deleted', color: 'success' })
    await refresh()
  } catch {
    toast?.init({ message: 'Failed to delete companion price', color: 'danger' })
  }
}

const deleteObserver = async (o: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/price-structures/${props.id}/observer-hunter-prices/${o.id}`
    await fetch(url, { method: 'DELETE' })
    toast?.init({ message: 'Observer price deleted', color: 'success' })
    await refresh()
  } catch {
    toast?.init({ message: 'Failed to delete observer price', color: 'danger' })
  }
}

const deleteUpgradeFee = async (fee: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/upgrade-fees/${fee.id}`
    await fetch(url, { method: 'DELETE' })
    toast?.init({ message: 'Upgrade fee deleted', color: 'success' })
    await refresh()
  } catch {
    toast?.init({ message: 'Failed to delete upgrade fee', color: 'danger' })
  }
}

const deleteTrophyFee = async (fee: any) => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}settings/trophy-fees/${fee.id}`
    await fetch(url, { method: 'DELETE' })
    toast?.init({ message: 'Trophy fee deleted', color: 'success' })
    await refresh()
  } catch {
    toast?.init({ message: 'Failed to delete trophy fee', color: 'danger' })
  }
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
</style>