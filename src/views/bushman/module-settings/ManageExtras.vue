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
    <div v-if="!showFormPage" class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <!-- Header with Add Button -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="mb-0">Safari Extra Services by Season</h2>
              <button v-if="!selectedSeason && !showFormPage" class="btn btn-primary" @click="openAddForm(null)">
                <i class="fa fa-plus me-2"></i>Add Extra Service
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="loadingExtras" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Extras Table -->
            <template v-else>
              <!-- Season Selection View -->
              <div v-if="!selectedSeason">
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
                  <button class="btn btn-primary" @click="openAddForm(null)">
                    <i class="fa fa-plus me-2"></i>Add Extra Service
                  </button>
                </div>
              </div>

              <!-- Selected Season View -->
              <div v-else>
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
                  <button class="btn btn-success" @click="openAddForm(selectedSeason)">
                    <i class="fa fa-plus me-2"></i>Add Extra Service
                  </button>
                </div>
              </div>

              <!-- Extras Table -->
              <div v-if="selectedSeasonExtras && selectedSeasonExtras.length > 0" class="table-responsive">
                <StandardDataTable
                  :key="`table-${selectedSeasonExtras.length}`"
                  :columns="columns"
                  :data="selectedSeasonExtras"
                  :loading="false"
                  :filters="{}"
                  :default-page-size="10"
                  :disable-pagination="allExtras.length <= 10"
                  :show-date-filters="false"
                  :disable-search="false"
                >
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #account="{ row }">
                    {{ (row as any).account?.name || (row as any).account_name || 'N/A' }}
                    <span v-if="(row as any).account?.code" class="text-muted ms-1">({{ (row as any).account.code }})</span>
                  </template>
                  <template #description="{ row }">
                    {{ (row as any).description || 'N/A' }}
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #area="{ row }">
                    {{ (row as any).area?.name || 'All Areas' }}
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #amount="{ row }">
                    {{ (row as any).currency?.symbol || '' }} {{ (row as any).amount || '0.00' }}
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #charge_type="{ row }">
                    <span class="badge bg-secondary">{{ formatChargeType((row as any).charge_type || '') }}</span>
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #is_active="{ row }">
                    <span :class="['badge', (row as any).is_active ? 'bg-success' : 'bg-danger']">
                      {{ (row as any).is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </template>
                  <!-- @ts-ignore - StandardDataTable doesn't provide row type -->
                  <template #actions="{ row }">
                    <div class="d-flex gap-1">
                      <button class="btn btn-warning btn-sm" title="Edit" @click="openEditForm(row as any)">
                        <i class="fa fa-edit"></i>
                      </button>
                      <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(row as any)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </template>
                </StandardDataTable>
              </div>

              <!-- No extras message -->
              <div v-else class="text-center py-5 text-muted">
                <i class="fa fa-inbox fa-3x mb-3"></i>
                <p>No extra services for this season.</p>
                <button class="btn btn-primary" @click="openAddForm(selectedSeason)">
                  <i class="fa fa-plus me-2"></i>Add Extra Service
                </button>
              </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Form Page -->
    <template v-if="showFormPage">
      <div class="p-6">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button class="btn btn-secondary" @click="closeFormPage">
              <i class="fa fa-arrow-left me-2"></i>Go Back
            </button>
          </div>
          <h4 class="mb-0">{{ editMode ? 'Edit Extra Service' : 'Add Extra Service' }}</h4>
        </div>

        <div class="p-2">
          <form ref="formRef" @submit.prevent="submitForm">
            <!-- Row 1: Season and Hunting Area -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label">Season <span class="text-danger">*</span></label>
                <select v-model="form.season_id" class="form-select" :disabled="!!preselectedSeason" required>
                  <option :value="null">Select Season</option>
                  <option v-for="option in seasonsOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Hunting Area <span class="text-danger">*</span></label>
                <select v-model="form.hunting_area_id" class="form-select" required>
                  <option :value="null">Select Hunting Area</option>
                  <option v-for="option in areasOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Row 2: Description -->
            <div class="row g-3 mb-4">
              <div class="col-md-12">
                <label class="form-label">Description</label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="3"
                  placeholder="Enter description"
                ></textarea>
              </div>
            </div>

            <!-- Row 3: Extras Table Form -->
            <div class="row g-3 mb-4">
              <div class="col-md-12">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0 fw-bold">Extras</h6>
                  <button type="button" class="btn btn-sm btn-primary" @click="addExtraRow">
                    <i class="fa fa-plus me-1"></i>Add Extra
                  </button>
                </div>

                <div class="table-responsive">
                  <table class="table table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>Account <span class="text-danger">*</span></th>
                        <th>Amount <span class="text-danger">*</span></th>
                        <th>Currency <span class="text-danger">*</span></th>
                        <th>Charge Per <span class="text-danger">*</span></th>
                        <th style="width: 50px;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(extra, index) in extrasRows" :key="extra._id">
                        <td>
                          <select v-model="extra.account_id" class="form-select form-select-sm" required>
                            <option :value="null">Select Account</option>
                            <option v-for="option in accountsOptions" :key="option.value" :value="option.value">
                              {{ option.text }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <input
                            v-model.number="extra.amount"
                            type="number"
                            class="form-control form-control-sm"
                            placeholder="Enter amount"
                            required
                          />
                        </td>
                        <td>
                          <select v-model="extra.currency_id" class="form-select form-select-sm" required>
                            <option :value="null">Select Currency</option>
                            <option v-for="option in currenciesOptions" :key="option.value" :value="option.value">
                              {{ option.text }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <select v-model="extra.charges_per" class="form-select form-select-sm" required>
                            <option :value="null">Select charge type</option>
                            <option v-for="option in chargesPerOptions" :key="option.value" :value="option.value">
                              {{ option.text }}
                            </option>
                          </select>
                        </td>
                        <td class="text-center">
                          <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            @click="removeExtraRow(index)"
                            :disabled="extrasRows.length === 1"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <button
                class="btn btn-success"
                :disabled="savingSafariExtra || extrasRows.length === 0"
                type="submit"
              >
                <span v-if="savingSafariExtra" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="fa fa-check me-2"></i>{{ editMode ? 'Update Extra Service' : 'Create Extra Service' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>

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
  { key: 'area', label: 'Hunting Area', visible: true },
  { key: 'amount', label: 'Amount', visible: true },
  { key: 'charge_type', label: 'Charge Type', visible: true },
  { key: 'is_active', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true },
]

const chargeTypeOptions = [
  { value: 'PER_DAY', text: 'Per Day' },
  { value: 'PER_DAY_PERSON', text: 'Per Day Per Person' },
  { value: 'PER_ROUND', text: 'Per Round' },
  { value: 'FLAT', text: 'Flat Fee' },
]

// Reactive state
const formRef = ref<HTMLFormElement | null>(null)
const form = reactive({
  id: null as any,
  account_id: null as any,
  amount: null as any,
  currency_id: null as any,
  area_id: null as any,
  charge_type: null as any,
  description: '',
  is_active: true,
  season_id: null as any,
  hunting_area_id: null as any,
})

const currenciesOptions = ref<any[]>([])
const areasOptions = ref<any[]>([])
const accountsOptions = ref<any[]>([])
const allExtras = ref<any[]>([])
const loadingSeasons = ref(false)
const showFormPage = ref(false)
const showDeleteModal = ref(false)
const editMode = ref(false)
const itemToDelete = ref<any>(null)
const deleting = ref(false)
const loadingExtras = ref(false)
const selectedSeason = ref<any>(null)
const preselectedSeason = ref<any>(null)
const seasonsOptions = ref<any[]>([])
const chargesPerOptions = ref<any[]>([
  { value: 'PER_DAY', text: 'Per Day' },
  { value: 'PER_DAY_PERSON', text: 'Per Day Per Person' },
  { value: 'PER_ROUND', text: 'Per Round' },
  { value: 'FLAT', text: 'Flat Fee' },
])
const extrasRows = ref<any[]>([{ _id: 1, account_id: null, amount: null, currency_id: null, charges_per: null }])

// Computed properties
const savingSafariExtra = computed(() => settingsStore.savingSafariExtra)

// Methods
const loadData = async () => {
  await Promise.all([loadExtras(), loadCurrencies(), loadAreas(), loadAccounts(), loadSeasons()])
}

const loadExtras = async () => {
  loadingExtras.value = true
  const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SAFARI_EXTRAS_NEW_URL
  try {
    const response = await axios.get(url)
    // Handle both nested and flat response structures
    allExtras.value = response.data?.data || response.data || []
    console.log('Loaded safari extras:', JSON.parse(JSON.stringify(allExtras.value)))
    console.log('Extras count:', allExtras.value.length)
  } catch (error) {
    console.error('Error loading safari extras:', error)
    allExtras.value = []
  } finally {
    loadingExtras.value = false
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
    const response = await settingsStore.getAccounts('')
    accountsOptions.value = response.data?.data
      ? response.data.data.map((item: any) => ({ value: item.id, text: `${item.name} (${item.code || 'N/A'})` }))
      : settingsStore.accounts || []
  } catch (error) {
    console.error('Error loading accounts:', error)
    accountsOptions.value = []
  }
}

const formatChargeType = (value: string): string => {
  const map: Record<string, string> = {
    PER_DAY: 'Per Day',
    PER_DAY_PERSON: 'Per Day Per Person',
    PER_ROUND: 'Per Round',
    FLAT: 'Flat Fee',
  }
  return map[value] || value
}

const openAddForm = (season: any) => {
  editMode.value = false
  resetForm()

  if (season) {
    preselectedSeason.value = season
    form.season_id = season.id
  }

  showFormPage.value = true
}

const openEditForm = (item: any) => {
  editMode.value = true

  form.id = item.id
  form.description = item.description || ''
  form.currency_id = item.currency?.id || item.currency_id || null
  form.area_id = item.area?.id || item.area_id || null
  form.charge_type = item.charge_type || null
  form.account_id = item.account?.id || item.account_id || null
  form.is_active = item.is_active !== false
  form.season_id = item.season ? item.season.id : null
  form.hunting_area_id = item.hunting_area ? item.hunting_area.id : null

  // Populate extras rows with single item for edit
  extrasRows.value = [{
    _id: 1,
    account_id: item.account?.id || item.account_id || null,
    amount: item.amount || null,
    currency_id: item.currency ? item.currency.id : null,
    charges_per: item.charges_per || null,
  }]

  showFormPage.value = true
}

const closeFormPage = () => {
  showFormPage.value = false
  resetForm()
}

const addExtraRow = () => {
  const newId = Math.max(...extrasRows.value.map((r: any) => r._id || 0), 0) + 1
  extrasRows.value.push({
    _id: newId,
    account_id: null,
    amount: null,
    currency_id: null,
    charges_per: null,
  })
}

const removeExtraRow = (index: number) => {
  if (extrasRows.value.length > 1) {
    extrasRows.value.splice(index, 1)
  }
}

const resetForm = () => {
  form.id = null
  form.account_id = null
  form.amount = null
  form.currency_id = null
  form.area_id = null
  form.charge_type = null
  form.description = ''
  form.is_active = true
  form.season_id = null
  form.hunting_area_id = null
  preselectedSeason.value = null
  extrasRows.value = [{ _id: 1, account_id: null, amount: null, currency_id: null, charges_per: null }]
}

const selectSeason = (season: any) => {
  selectedSeason.value = season
}

const clearSelection = () => {
  selectedSeason.value = null
}

const loadSeasons = async () => {
  try {
    const response = await quotaStore.getSeasonList()
    seasonsOptions.value = response.data.map((item: any) => ({
      value: item.id,
      text: item.name,
    }))
  } catch (error) {
    console.error('Error loading seasons:', error)
  }
}

const seasonsWithExtras = computed(() => {
  // Group extras by season
  const seasonMap = new Map()
  allExtras.value.forEach((extra: any) => {
    const seasonId = extra.season?.id || extra.season_id
    if (seasonId) {
      if (!seasonMap.has(seasonId)) {
        seasonMap.set(seasonId, {
          id: seasonId,
          name: extra.season?.name || 'Unknown Season',
          start_at: extra.season?.start_at,
          end_at: extra.season?.end_at,
          extras: [],
        })
      }
      seasonMap.get(seasonId).extras.push(extra)
    }
  })
  return Array.from(seasonMap.values())
})

const selectedSeasonExtras = computed(() => {
  if (!selectedSeason.value) return []
  return allExtras.value.filter((extra: any) => {
    const seasonId = extra.season?.id || extra.season_id
    return seasonId === selectedSeason.value.id
  })
})

const submitForm = async () => {
  if (!formRef.value?.checkValidity()) {
    formRef.value?.reportValidity()
    return
  }

  // Validate extras rows
  const validExtras = extrasRows.value.filter((extra: any) => 
    extra.account_id && extra.amount && extra.currency_id && extra.charges_per
  )

  if (validExtras.length === 0) {
    init({ message: 'Please add at least one valid extra with all required fields.', color: 'warning' })
    return
  }

  try {
    const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SAFARI_EXTRAS_NEW_URL
    if (editMode.value) {
      // For edit mode, update the single extra
      const payload = {
        account_id: validExtras[0].account_id,
        amount: validExtras[0].amount,
        currency_id: validExtras[0].currency_id,
        season_id: form.season_id,
        hunting_area_id: form.hunting_area_id,
        charges_per: validExtras[0].charges_per,
        description: form.description || '',
      }
      await updateExtra(form.id, payload)
    } else {
      // For create mode, create multiple extras
      const promises = validExtras.map((extra: any) => {
        const payload = {
          account_id: extra.account_id,
          amount: extra.amount,
          currency_id: extra.currency_id,
          season_id: form.season_id,
          hunting_area_id: form.hunting_area_id,
          charges_per: extra.charges_per,
          description: form.description || '',
        }
        return settingsStore.createSafariExtras(payload)
      })

      const responses = await Promise.all(promises)
      const successCount = responses.filter((r: any) => r.status === 201).length
      init({ 
        message: `${successCount} extra service(s) created successfully`, 
        color: 'success' 
      })
    }
    await loadExtras()
    closeFormPage()
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
  const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SAFARI_EXTRAS_NEW_URL + id
  const response = await axios.put(url, payload)
  if (response.status === 200) {
    init({ message: 'Safari extra updated successfully', color: 'success' })
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
      import.meta.env.VITE_APP_SAFARI_EXTRAS_NEW_URL +
      itemToDelete.value.id
    await axios.delete(url)
    init({ message: 'Safari extra deleted successfully', color: 'success' })
    await loadExtras()
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (error: any) {
    console.error(error)
    init({ message: 'Failed to delete safari extra', color: 'danger' })
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
</style>