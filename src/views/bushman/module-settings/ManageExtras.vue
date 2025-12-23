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
            <!-- Header with Add Button -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="mb-0">Safari Extra Services</h2>
              <button class="btn btn-primary" @click="openAddModal()">
                <i class="fa fa-plus me-2"></i>Add Safari Extra
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
              <div v-if="allExtras && allExtras.length > 0" class="table-responsive">
                <StandardDataTable
                  :key="`table-${allExtras.length}`"
                  :columns="columns"
                  :data="allExtras"
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

              <!-- No extras message -->
              <div v-else class="text-center py-5 text-muted">
                <i class="fa fa-inbox fa-3x mb-3"></i>
                <p>No safari extras found.</p>
                <button class="btn btn-primary" @click="openAddModal()">
                  <i class="fa fa-plus me-2"></i>Add Safari Extra
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
            <h5 class="modal-title">{{ editMode ? 'Edit Safari Extra' : 'Add Safari Extra' }}</h5>
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
                    <label class="form-label">Hunting Area (Optional)</label>
                    <select v-model="form.area_id" class="form-select">
                      <option :value="null">All Areas</option>
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
                    <label class="form-label">Charge Type <span class="text-danger">*</span></label>
                    <select v-model="form.charge_type" class="form-select" required>
                      <option :value="null">Select charge type</option>
                      <option v-for="option in chargeTypeOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Status</label>
                    <div class="form-check form-switch mt-2">
                      <input v-model="form.is_active" class="form-check-input" type="checkbox" id="isActiveSwitch">
                      <label class="form-check-label" for="isActiveSwitch">{{ form.is_active ? 'Active' : 'Inactive' }}</label>
                    </div>
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
})

const currenciesOptions = ref<any[]>([])
const areasOptions = ref<any[]>([])
const accountsOptions = ref<any[]>([])
const allExtras = ref<any[]>([])
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const editMode = ref(false)
const itemToDelete = ref<any>(null)
const deleting = ref(false)
const loadingExtras = ref(false)

// Computed properties
const savingSafariExtra = computed(() => settingsStore.savingSafariExtra)

// Methods
const loadData = async () => {
  await Promise.all([loadExtras(), loadCurrencies(), loadAreas(), loadAccounts()])
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

const openAddModal = () => {
  editMode.value = false
  resetForm()
  showFormModal.value = true
}

const openEditModal = (item: any) => {
  editMode.value = true

  form.id = item.id
  form.amount = item.amount
  form.description = item.description || ''
  form.currency_id = item.currency?.id || item.currency_id || null
  form.area_id = item.area?.id || item.area_id || null
  form.charge_type = item.charge_type || null
  form.account_id = item.account?.id || item.account_id || null
  form.is_active = item.is_active !== false

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
  form.area_id = null
  form.charge_type = null
  form.description = ''
  form.is_active = true
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
    amount: parseFloat(form.amount),
    currency_id: form.currency_id,
    area_id: form.area_id,
    charge_type: form.charge_type,
    description: form.description || '',
    is_active: form.is_active,
  }

  try {
    const url = import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_SAFARI_EXTRAS_NEW_URL
    if (editMode.value) {
      await updateExtra(form.id, payload)
    } else {
      const response = await axios.post(url, payload)
      if (response.status === 201) {
        init({ message: 'Safari extra created successfully', color: 'success' })
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
