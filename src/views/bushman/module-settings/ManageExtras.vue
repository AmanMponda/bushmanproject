<template>
  <div class="safari-extras-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item active">Safari Extra Services</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="mb-0">Safari Extra Services by Season</h2>
              <button v-if="!selectedSeason" class="btn btn-primary" @click="openAddModal(null)">
                <i class="fa fa-plus me-2"></i>Add Extra Service
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="loadingExtras || loadingSeasons" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Season Selection View -->
            <template v-else-if="!selectedSeason">
              <div v-if="seasonsWithExtras.length > 0">
                <h4 class="mb-4">Select a Season</h4>
                <div class="row g-4">
                  <div v-for="season in seasonsWithExtras" :key="season.id" class="col-md-4 col-sm-6">
                    <div
                      class="card season-card h-100 cursor-pointer shadow-sm"
                      :class="{ 'border-primary bg-light': selectedSeason?.id === season.id }"
                      @click="selectSeason(season)"
                    >
                      <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="d-flex align-items-center">
                            <i class="fa fa-calendar text-primary me-3" style="font-size: 2rem"></i>
                            <div>
                              <h5 class="card-title mb-1">{{ season.name }}</h5>
                              <p class="text-muted mb-0 small">
                                {{ season.start_at ? new Date(season.start_at).toLocaleDateString() : 'N/A' }} -
                                {{ season.end_at ? new Date(season.end_at).toLocaleDateString() : 'Ongoing' }}
                              </p>
                            </div>
                          </div>
                          <span class="badge bg-primary" style="font-size: 1rem; padding: 0.5rem 0.75rem">
                            {{ season.extras.length }} {{ season.extras.length === 1 ? 'Service' : 'Services' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No seasons message -->
              <div v-else class="text-center py-5 text-muted">
                <i class="fa fa-calendar-times fa-3x mb-3"></i>
                <p>No seasons with extra services found.</p>
                <button class="btn btn-primary" @click="openAddModal(null)">
                  <i class="fa fa-plus me-2"></i>Add Extra Service
                </button>
              </div>
            </template>

            <!-- Selected Season View -->
            <template v-else>
              <div class="mb-4">
                <button class="btn btn-outline-secondary mb-3" @click="clearSelection">
                  <i class="fa fa-arrow-left me-2"></i>Back to Seasons
                </button>
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 class="mb-1">
                      <i class="fa fa-calendar text-primary me-2"></i>
                      {{ selectedSeason.name }}
                    </h3>
                    <p class="text-muted mb-0">
                      {{ selectedSeason.start_at ? new Date(selectedSeason.start_at).toLocaleDateString() : 'N/A' }} -
                      {{ selectedSeason.end_at ? new Date(selectedSeason.end_at).toLocaleDateString() : 'Ongoing' }}
                    </p>
                  </div>
                  <button class="btn btn-success" @click="openAddModal(selectedSeason)">
                    <i class="fa fa-plus me-2"></i>Add Extra Service
                  </button>
                </div>
              </div>

              <!-- Extras Table -->
              <div v-if="selectedSeasonExtras && selectedSeasonExtras.length > 0" class="table-responsive">
                <StandardDataTable
                  :key="`table-${selectedSeason.id}-${selectedSeasonExtras.length}`"
                  :columns="columns"
                  :data="selectedSeasonExtras"
                  :loading="false"
                  :filters="{}"
                  :default-page-size="10"
                  :disable-pagination="selectedSeasonExtras.length <= 10"
                  :show-date-filters="false"
                  :disable-search="false"
                >
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #account="{ row }">
                    {{ (row as any).account?.name || (row as any).account_name || 'N/A' }}
                    <span v-if="(row as any).account?.code" class="text-muted ms-1">({{ (row as any).account.code }})</span>
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #hunting_area="{ row }">
                    {{ (row as any).hunting_area?.name || 'N/A' }}
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #amount="{ row }">
                    {{ (row as any).currency?.symbol || '' }} {{ (row as any).amount || '0.00' }}
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #charges_per="{ row }">
                    <span class="badge bg-secondary">{{ formatChargesPer((row as any).charges_per || '') }}</span>
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #description="{ row }">
                    {{ (row as any).description || 'N/A' }}
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      <button class="btn btn-warning btn-sm" title="Edit" @click="openEditModal(row as any)">
                        <i class="fa fa-edit"></i>
                      </button>
                      <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row as any)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </template>
                </StandardDataTable>
              </div>

              <!-- No extras for selected season -->
              <div v-else class="text-center py-5 text-muted">
                <i class="fa fa-inbox fa-3x mb-3"></i>
                <p>No extra services for this season.</p>
                <button class="btn btn-primary" @click="openAddModal(selectedSeason)">
                  <i class="fa fa-plus me-2"></i>Add Extra Service
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      class="modal fade"
      :class="{ show: showFormModal, 'd-block': showFormModal }"
      :style="{ display: showFormModal ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closeFormModal"
    >
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editMode ? 'Edit Extra Service' : 'Add Extra Service' }}</h5>
            <button type="button" class="btn-close" @click="closeFormModal"></button>
          </div>
          <div class="modal-body">
            <form ref="formRef" @submit.prevent="submitForm">
              <div class="row mb-3 trophy-fees-form-row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Account <span class="text-danger">*</span></label>
                    <select v-model="form.account_id" class="form-select" required>
                      <option :value="null">Select Account</option>
                      <option v-for="option in accountsOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Amount <span class="text-danger">*</span></label>
                    <input
                      v-model="form.amount"
                      type="number"
                      class="form-control"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="row mb-3 trophy-fees-form-row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Currency <span class="text-danger">*</span></label>
                    <select v-model="form.currency_id" class="form-select" required>
                      <option :value="null">Select Currency</option>
                      <option v-for="option in currenciesOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Hunting Area <span class="text-danger">*</span></label>
                    <select v-model="form.hunting_area_id" class="form-select" required>
                      <option :value="null">Select Hunting Area</option>
                      <option v-for="option in areasOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="row mb-3 trophy-fees-form-row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Season <span class="text-danger">*</span></label>
                    <select v-model="form.season_id" class="form-select" :disabled="!!preselectedSeason" required>
                      <option :value="null">Select Season</option>
                      <option v-for="option in seasonsOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Charges Per <span class="text-danger">*</span></label>
                    <select v-model="form.charges_per" class="form-select" required>
                      <option :value="null">Select charge type</option>
                      <option v-for="option in chargesPerOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-12">
                  <div class="form-group">
                    <label class="form-label">Description (Optional)</label>
                    <textarea
                      v-model="form.description"
                      class="form-control"
                      rows="3"
                      placeholder="Describe this extra service"
                    ></textarea>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeFormModal">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="savingSafariExtra" @click="submitForm">
              <span v-if="savingSafariExtra" class="spinner-border spinner-border-sm me-2"></span>
              {{ editMode ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showFormModal" class="modal-backdrop fade show" @click="closeFormModal"></div>

    <!-- Delete Confirmation Modal -->
    <div
      class="modal fade"
      :class="{ show: showDeleteModal, 'd-block': showDeleteModal }"
      :style="{ display: showDeleteModal ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="showDeleteModal = false"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to delete
              "<strong>{{ itemToDelete?.account?.name || itemToDelete?.account_name || itemToDelete?.description }}</strong>"?
            </p>
          </div>
              <p>
                Are you sure you want to delete
                "<strong>{{ itemToDelete?.account?.name || itemToDelete?.account_name || itemToDelete?.description }}</strong>"?
              </p>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
            <button type="button" class="btn btn-danger" :disabled="deleting" @click="deleteExtra">
              <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showDeleteModal" class="modal-backdrop fade show" @click="showDeleteModal = false"></div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable component doesn't provide TypeScript types for row parameter
import { ref, reactive, computed, onMounted } from 'vue'
import { useSettingsStore } from '../../../stores/bushman/settings-store'
import { useQuotaStore } from '../../../stores/bushman/quota-store'
import { useToast } from '@/composables/useToast'
import handleErrors from '../../../stores/bushman/errorHandler'
import axios from 'axios'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'

// Types
interface ExtraItem {
  id?: any
  account?: { id?: any; name?: string; code?: string }
  account_id?: any
  hunting_area?: { name?: string }
  currency?: { symbol?: string }
  amount?: number | string
  charges_per?: string
  description?: string
  season_id?: any
  season?: { id?: any }
  [key: string]: any
}

// Stores
const settingsStore = useSettingsStore()
const quotaStore = useQuotaStore()
const { init } = useToast()

// Constants
const columns = [
  { key: 'account', label: 'Account', visible: true },
  { key: 'description', label: 'Description', visible: true },
  { key: 'hunting_area', label: 'Hunting Area', visible: true },
  { key: 'amount', label: 'Amount', visible: true },
  { key: 'charges_per', label: 'Charges Per', visible: true },
  { key: 'actions', label: 'Actions', visible: true },
]

const chargesPerOptions = [
  { value: 'PER_DAY', text: 'Per Day' },
  { value: 'PER_PERSON', text: 'Per Person' },
  { value: 'PER_ROUND', text: 'Per Round' },
]

// Reactive state
const formRef = ref<HTMLFormElement | null>(null)
const form = reactive({
  id: null as any,
  account_id: null as any,
  amount: null as any,
  currency_id: null as any,
  season_id: null as any,
  hunting_area_id: null as any,
  charges_per: null as any,
  description: '',
})

const seasonsOptions = ref<any[]>([])
const currenciesOptions = ref<any[]>([])
const areasOptions = ref<any[]>([])
const accountsOptions = ref<any[]>([])
const allSeasons = ref<any[]>([])
const allExtras = ref<any[]>([])
const loadingSeasons = ref(false)
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const editMode = ref(false)
const preselectedSeason = ref<any>(null)
const itemToDelete = ref<any>(null)
const deleting = ref(false)
const selectedSeason = ref<any>(null)

// Computed properties
const loadingExtras = computed(() => settingsStore.loadingExtras)
const savingSafariExtra = computed(() => settingsStore.savingSafariExtra)

const seasonsWithExtras = computed((): any[] => {
  if (!allSeasons.value || !allExtras.value) {
    return []
  }

  const result = allSeasons.value.map((season: any) => {
    const seasonExtras = allExtras.value.filter((extra: any) => {
      // Handle both direct season_id and nested season.id
      const extraSeasonId = extra.season_id || extra.season?.id
      return extraSeasonId === season.id
    })

    // Create a new object with the extras array
    return {
      ...season,
      extras: Array.isArray(seasonExtras) ? seasonExtras : [],
    }
  })

  // Filter out seasons with no extras - only return seasons that actually have extras
  const seasonsWithExtrasOnly = result.filter(
    (season: any) => Array.isArray(season.extras) && season.extras.length > 0,
  )

  console.log(
    'Seasons with extras computed:',
    seasonsWithExtrasOnly.map((s) => ({
      id: s.id,
      name: s.name,
      extrasCount: s.extras?.length || 0,
      extrasIsArray: Array.isArray(s.extras),
    })),
  )

  return seasonsWithExtrasOnly
})

const selectedSeasonExtras = computed((): any[] => {
  if (!selectedSeason.value) {
    return []
  }
  return allExtras.value.filter((extra: any) => {
    const extraSeasonId = extra.season_id || extra.season?.id
    return extraSeasonId === selectedSeason.value.id
  })
})

// Methods
const loadData = async () => {
  await Promise.all([loadSeasons(), loadExtras(), loadCurrencies(), loadAreas(), loadAccounts()])
}

const loadSeasons = async () => {
  loadingSeasons.value = true
  try {
    const response = await settingsStore.getSeasons()
    allSeasons.value = response.data || []
    seasonsOptions.value = allSeasons.value.map((item: any) => ({
      value: item.id,
      text: item.name,
    }))
  } catch (error) {
    console.error('Error loading seasons:', error)
  } finally {
    loadingSeasons.value = false
  }
}

const loadExtras = async () => {
  const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SAFARY_EXTRAS_VSET_URL
  try {
    const response = await axios.get(url)
    // Handle both nested and flat response structures
    allExtras.value = response.data?.data || response.data || []
    console.log('Loaded extras:', JSON.parse(JSON.stringify(allExtras.value)))
    console.log('Extras count:', allExtras.value.length)
    if (allExtras.value.length > 0) {
      const firstExtra = JSON.parse(JSON.stringify(allExtras.value[0]))
      console.log('First extra sample (full):', firstExtra)
      console.log('First extra season_id:', firstExtra.season_id)
      console.log('First extra season object:', firstExtra.season)
      console.log('All extra keys:', Object.keys(firstExtra))
    }
  } catch (error) {
    console.error('Error loading extras:', error)
    allExtras.value = []
  }
}

const loadCurrencies = async () => {
  try {
    const response = await settingsStore.getCurrencies()
    currenciesOptions.value = response.data.map((item: any) => ({
      value: item.id,
      text: item.name,
    }))
  } catch (error) {
    console.error('Error loading currencies:', error)
  }
}

const loadAreas = async () => {
  try {
    const response = await quotaStore.getAreaList()
    areasOptions.value = response.data.map((item: any) => ({
      value: item.id,
      text: item.name,
    }))
  } catch (error) {
    console.error('Error loading areas:', error)
  }
}

const loadAccounts = async () => {
  try {
    // Call the accounts endpoint directly to avoid depending on store action availability
    const url = import.meta.env.VITE_APP_BASE_URL + 'settings/accounts'
    const response = await axios.get(url)
    accountsOptions.value = response.data?.data
      ? response.data.data.map((item: any) => ({ value: item.id, text: item.name }))
      : (settingsStore.accounts || []).map((a: any) => ({ value: a.value, text: a.text }))
  } catch (error) {
    console.error('Error loading accounts:', error)
    accountsOptions.value = []
  }
}

const selectSeason = (season: any) => {
  selectedSeason.value = season
}

const clearSelection = () => {
  selectedSeason.value = null
}

const formatChargesPer = (value: string): string => {
  const map: Record<string, string> = {
    PER_HOUR: 'Per Hour',
    PER_DAY: 'Per Day',
    PER_PERSON: 'Per Person',
    PER_ROUND: 'Per Round',
  }
  return map[value] || value
}

const openAddModal = (season: any) => {
  editMode.value = false
  preselectedSeason.value = season
  resetForm()

  if (season) {
    form.season_id = season.id
  }

  showFormModal.value = true
}

const openEditModal = (item: any) => {
  editMode.value = true
  preselectedSeason.value = null

  form.id = item.id
  form.amount = item.amount
  form.description = item.description || ''
  form.currency_id = item.currency ? item.currency.id : null
  form.season_id = item.season ? item.season.id : null
  form.hunting_area_id = item.hunting_area ? item.hunting_area.id : null
  form.charges_per = item.charges_per || null
  form.account_id = item.account?.id || item.account_id || null

  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  resetForm()
}

const resetForm = () => {
  form.id = null
  form.account_id = null
  form.amount = null
  form.currency_id = null
  form.season_id = null
  form.hunting_area_id = null
  form.charges_per = null
  form.description = ''
  preselectedSeason.value = null
}

const submitForm = async () => {
  if (!formRef.value?.checkValidity()) {
    formRef.value?.reportValidity()
    return
  }

  if (!form.account_id) {
    init({ message: 'Please select an account.', color: 'warning' })
    return
  }

  const payload = {
    account_id: form.account_id,
    amount: form.amount,
    currency_id: form.currency_id,
    season_id: form.season_id,
    hunting_area_id: form.hunting_area_id,
    charges_per: form.charges_per,
    description: form.description || '',
  }

  try {
    if (editMode.value) {
      await updateExtra(form.id, payload)
    } else {
      const response = await settingsStore.createSafariExtras(payload)
      if (response.status === 201) {
        init({ message: 'Extra service created successfully', color: 'success' })
      }
    }
    await loadExtras()
    closeFormModal()
  } catch (error: any) {
    console.error(error)
    const errors = handleErrors(error.response)
    init({
      message: errors.join(', '),
      color: 'danger',
    })
  }
}

const updateExtra = async (id: number, payload: any) => {
  const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SAFARY_EXTRAS_VSET_URL + id + '/'
  const response = await axios.put(url, payload)
  if (response.status === 200) {
    init({ message: 'Extra service updated successfully', color: 'success' })
  }
  return response
}

const confirmDelete = (item: any) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const deleteExtra = async () => {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    const url =
      import.meta.env.VITE_APP_BASE_URL +
      import.meta.env.VITE_APP_SAFARY_EXTRAS_VSET_URL +
      itemToDelete.value.id +
      '/'
    await axios.delete(url)
    init({ message: 'Extra service deleted successfully', color: 'success' })
    await loadExtras()
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (error: any) {
    console.error(error)
    init({ message: 'Failed to delete extra service', color: 'danger' })
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.safari-extras-page {
  padding: 0;
}

.trophy-fees-form-row {
  --bs-gutter-x: 6rem !important;
  margin-left: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
  margin-right: calc(-1 * var(--bs-gutter-x) * 0.5) !important;
}

.trophy-fees-form-row > [class*='col-'] {
  padding-left: calc(var(--bs-gutter-x) * 0.5) !important;
  padding-right: calc(var(--bs-gutter-x) * 0.5) !important;
}

.form-group {
  margin-bottom: 0.8rem;
}

.season-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid #e0e0e0;
}

.season-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-color: #0d6efd;
}

.season-card.border-primary {
  border-color: #0d6efd !important;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2) !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
