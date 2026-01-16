<template>
  <div class="manage-installment-setups-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Installment Setups</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Installment Setups</h2>
                <p class="text-muted mb-0 small">
                  Create and manage payment installment schedules across orders, proposals, and other entities.
                </p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" @click="refresh">
                  <i class="fa fa-refresh me-2"></i>Refresh
                </button>
                <button class="btn btn-primary" @click="openModal()">
                  <i class="fa fa-plus me-2"></i>Add Installment
                </button>
              </div>
            </div>

            <StandardDataTable
              :columns="columns"
              :data="rows"
              :loading="loading"
              :filters="tableFilters"
              :custom-filters="customFilters"
              :disable-pagination="false"
              :disable-search="false"
              :show-date-filters="false"
              :server-side="true"
              :pagination="pagination"
              @update:filters="handleFiltersUpdate"
              @page-change="handlePageChange"
            >
              <template #entity="{ row }">
                <div class="d-flex flex-column">
                  <span class="fw-semibold">{{ row.entity_label }}</span>
                  <small class="text-muted">{{ row.installmentable_type }}</small>
                </div>
              </template>

              <template #amount_due="{ row }">
                <span class="text-nowrap">{{ row.amount_due_display }}</span>
              </template>

              <template #amount_due_type="{ row }">
                <span class="badge" :class="row.amount_due_type === 'FIXED' ? 'bg-primary' : 'bg-secondary'">
                  {{ row.amount_due_type }}
                </span>
              </template>

              <template #due_days_type="{ row }">
                {{ dueDaysTypeLabel(row.due_days_type) }}
              </template>

              <template #is_deposit="{ row }">
                <span class="badge" :class="row.is_deposit ? 'bg-success' : 'bg-secondary'">
                  {{ row.is_deposit ? 'Yes' : 'No' }}
                </span>
              </template>

              <template #is_paid="{ row }">
                <span class="badge" :class="row.is_paid ? 'bg-success' : 'bg-warning text-dark'">
                  {{ row.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </template>

              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-secondary btn-sm" title="Edit" @click="openModal(row)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" title="Delete" @click="confirmDelete(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-layer-group me-2"></i>
              {{ editingItem ? 'Edit Installment Setup' : 'Add Installment Setup' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveItem">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Installmentable Type <span class="text-danger">*</span></label>
                  <input
                    v-model="form.installmentable_type"
                    type="text"
                    class="form-control"
                    placeholder="e.g., App\\Models\\Order"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Installmentable ID <span class="text-danger">*</span></label>
                  <input v-model.number="form.installmentable_id" type="number" min="1" class="form-control" required />
                </div>

                <div class="col-md-4">
                  <label class="form-label">Currency <span class="text-danger">*</span></label>
                  <select v-model="form.currency_id" class="form-select" required>
                    <option :value="null">Select Currency</option>
                    <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Sequence No <span class="text-danger">*</span></label>
                  <input v-model.number="form.sequence_no" type="number" min="1" class="form-control" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Due Days <span class="text-danger">*</span></label>
                  <input v-model.number="form.due_days" type="number" min="0" class="form-control" required />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Amount Due <span class="text-danger">*</span></label>
                  <input v-model.number="form.amount_due" type="number" min="0" step="0.01" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Amount Type <span class="text-danger">*</span></label>
                  <select v-model="form.amount_due_type" class="form-select" required>
                    <option v-for="t in amountTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Due Days Type <span class="text-danger">*</span></label>
                  <select v-model="form.due_days_type" class="form-select" required>
                    <option v-for="t in dueDaysTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-check mt-4">
                    <input v-model="form.is_deposit" type="checkbox" class="form-check-input" id="isDeposit" />
                    <label class="form-check-label" for="isDeposit">Is Deposit</label>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label">Narration</label>
                  <input v-model="form.narration" type="text" class="form-control" placeholder="Optional notes" />
                </div>

                <template v-if="editingItem">
                  <div class="col-md-4 d-flex align-items-center">
                    <div class="form-check mt-4">
                      <input v-model="form.is_paid" type="checkbox" class="form-check-input" id="isPaid" />
                      <label class="form-check-label" for="isPaid">Mark as Paid</label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Amount Paid</label>
                    <input v-model.number="form.amount_paid" type="number" min="0" step="0.01" class="form-control" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Paid At</label>
                    <input v-model="form.paid_at" type="datetime-local" class="form-control" />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Payment Reference</label>
                    <input v-model="form.payment_reference" type="text" class="form-control" />
                  </div>
                </template>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveItem" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              {{ saving ? 'Saving...' : (editingItem ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useSettingsStore } from '@/stores/bushman/settings-store'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL || ''
const installmentBase = `${apiBaseUrl}installment-setups`

const settingsStore = useSettingsStore()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingItem = ref<any>(null)

const rows = ref<any[]>([])
const pagination = ref<any>(null)

const amountTypes = ref<any[]>([])
const dueDaysTypes = ref<any[]>([])
const currencyOptions = ref<{ value: number; label: string; symbol?: string }[]>([])

const tableFilters = ref({
  search: '',
  page: 1,
  limit: 15,
  sortField: '',
  sortDirection: 'asc',
  installmentable_type: '',
  installmentable_id: '',
  is_deposit: '',
  is_paid: '',
  currency_id: '',
})

const columns = [
  { key: 'id', label: 'ID', sortable: true, visible: true },
  { key: 'entity', label: 'Entity', sortable: false, visible: true },
  { key: 'sequence_no', label: 'Seq', sortable: true, visible: true },
  { key: 'amount_due', label: 'Amount Due', sortable: true, visible: true },
  { key: 'amount_due_type', label: 'Amount Type', sortable: true, visible: true },
  { key: 'due_days', label: 'Due Days', sortable: true, visible: true },
  { key: 'due_days_type', label: 'Due Days Type', sortable: true, visible: true },
  { key: 'is_deposit', label: 'Deposit', sortable: true, visible: true },
  { key: 'is_paid', label: 'Paid', sortable: true, visible: true },
  { key: 'narration', label: 'Narration', sortable: false, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true, width: 130 },
] as any

const customFilters = computed(() => [
  {
    key: 'installmentable_type',
    label: 'Installmentable Type',
    type: 'text',
    placeholder: 'App\\Models\\Order',
    defaultValue: '',
  },
  {
    key: 'installmentable_id',
    label: 'Installmentable ID',
    type: 'number',
    placeholder: 'Entity ID',
    defaultValue: '',
  },
  {
    key: 'currency_id',
    label: 'Currency',
    type: 'select',
    placeholder: 'All Currencies',
    options: currencyOptions.value.map((c) => ({ value: c.value, label: c.label })),
    defaultValue: '',
  },
  {
    key: 'is_deposit',
    label: 'Deposit',
    type: 'select',
    placeholder: 'All',
    options: [
      { value: 'true', label: 'Deposit' },
      { value: 'false', label: 'Regular' },
    ],
    defaultValue: '',
  },
  {
    key: 'is_paid',
    label: 'Payment Status',
    type: 'select',
    placeholder: 'All',
    options: [
      { value: 'true', label: 'Paid' },
      { value: 'false', label: 'Unpaid' },
    ],
    defaultValue: '',
  },
])

const form = ref({
  installmentable_id: null as number | null,
  installmentable_type: '',
  currency_id: null as number | null,
  sequence_no: 1,
  narration: '',
  amount_due: null as number | null,
  amount_due_type: 'FIXED',
  due_days: 0,
  due_days_type: 'AFTER_INVOICE',
  is_deposit: false,
  is_paid: false,
  amount_paid: null as number | null,
  paid_at: '',
  payment_reference: '',
})

const amountTypeOptions = computed(() => {
  if (amountTypes.value.length > 0) {
    return amountTypes.value.map((t: any) => ({
      value: t.code || t.value,
      label: t.name || t.label || t.code,
    }))
  }
  return [
    { value: 'FIXED', label: 'Fixed Amount' },
    { value: 'PERCENTAGE', label: 'Percentage' },
  ]
})

const dueDaysTypeOptions = computed(() => {
  if (dueDaysTypes.value.length > 0) {
    return dueDaysTypes.value.map((t: any) => ({
      value: t.code || t.value,
      label: t.name || t.label || t.code,
    }))
  }
  return [
    { value: 'AFTER_INVOICE', label: 'After Invoice' },
    { value: 'AFTER_DELIVERY', label: 'After Delivery' },
    { value: 'AFTER_CONFIRMATION', label: 'After Confirmation' },
  ]
})

const dueDaysTypeLabel = (code: string) => {
  return dueDaysTypeOptions.value.find((t) => t.value === code)?.label || code || '-'
}

const normalizeEntityType = (entityType: string) => {
  if (!entityType) return '-'
  const parts = entityType.split('\\')
  return parts[parts.length - 1] || entityType
}

const formatAmount = (amount: number | null | undefined, currency?: string) => {
  const safeAmount = Number(amount ?? 0)
  if (currency) {
    return `${currency}${currency.length === 1 ? '' : ' '}${safeAmount.toFixed(2)}`
  }
  return safeAmount.toFixed(2)
}

const toDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

const normalizeBooleanFilter = (value: any) => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

const buildListParams = (filters: any) => {
  const params: any = {}
  if (filters.search) params.search = filters.search
  if (filters.installmentable_type) params.installmentable_type = filters.installmentable_type
  if (filters.installmentable_id) params.installmentable_id = Number(filters.installmentable_id)
  if (filters.currency_id) params.currency_id = Number(filters.currency_id)
  const isDeposit = normalizeBooleanFilter(filters.is_deposit)
  if (isDeposit !== undefined) params.is_deposit = isDeposit
  const isPaid = normalizeBooleanFilter(filters.is_paid)
  if (isPaid !== undefined) params.is_paid = isPaid
  params.page = filters.page || 1
  params.per_page = filters.limit || 15
  return params
}

const fetchInstallmentSetups = async (filters = tableFilters.value) => {
  loading.value = true
  try {
    const response = await axios.get(installmentBase, { params: buildListParams(filters) })
    const data = response.data?.data || response.data || []
    const paginationData = response.data?.pagination || null
    pagination.value = paginationData
    rows.value = (Array.isArray(data) ? data : []).map((item: any) => {
      const currency = item.currency || {}
      const currencyLabel = currency.symbol || currency.code || currency.name || ''
      return {
        id: item.id,
        installmentable_id: item.installmentable_id,
        installmentable_type: item.installmentable_type,
        entity_label: `${normalizeEntityType(item.installmentable_type)} #${item.installmentable_id}`,
        currency_id: item.currency_id,
        currency_label: currencyLabel,
        sequence_no: item.sequence_no,
        narration: item.narration || '',
        amount_due: Number(item.amount_due ?? 0),
        amount_due_type: item.amount_due_type || '-',
        amount_due_display: formatAmount(item.amount_due, currencyLabel),
        due_days: item.due_days ?? 0,
        due_days_type: item.due_days_type || '-',
        is_deposit: !!item.is_deposit,
        is_paid: !!item.is_paid,
        amount_paid: item.amount_paid ?? null,
        paid_at: item.paid_at,
        payment_reference: item.payment_reference || '',
        raw: item,
      }
    })
  } catch (error: any) {
    rows.value = []
    pagination.value = null
    Swal.fire('Error', error?.response?.data?.message || 'Failed to load installment setups', 'error')
  } finally {
    loading.value = false
  }
}

const fetchAmountTypes = async () => {
  try {
    const response = await axios.get(`${installmentBase}/amount-types`)
    amountTypes.value = response.data?.data || response.data || []
  } catch {
    amountTypes.value = []
  }
}

const fetchDueDaysTypes = async () => {
  try {
    const response = await axios.get(`${installmentBase}/due-days-types`)
    dueDaysTypes.value = response.data?.data || response.data || []
  } catch {
    dueDaysTypes.value = []
  }
}

const loadCurrencies = async () => {
  try {
    const response = await settingsStore.getCurrencies()
    const data = response?.data || settingsStore.currencies || []
    currencyOptions.value = (Array.isArray(data) ? data : []).map((item: any) => ({
      value: item.value ?? item.id,
      label: item.text ?? item.name ?? item.code ?? `CUR-${item.id}`,
      symbol: item.symbol,
    }))
  } catch {
    currencyOptions.value = []
  }
}

const refresh = async () => {
  await fetchInstallmentSetups()
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters, page: 1 }
  fetchInstallmentSetups(tableFilters.value)
}

const handlePageChange = (page: number) => {
  tableFilters.value = { ...tableFilters.value, page }
  fetchInstallmentSetups(tableFilters.value)
}

const resetForm = () => {
  form.value = {
    installmentable_id: null,
    installmentable_type: '',
    currency_id: null,
    sequence_no: 1,
    narration: '',
    amount_due: null,
    amount_due_type: 'FIXED',
    due_days: 0,
    due_days_type: 'AFTER_INVOICE',
    is_deposit: false,
    is_paid: false,
    amount_paid: null,
    paid_at: '',
    payment_reference: '',
  }
}

const openModal = (item?: any) => {
  editingItem.value = item || null
  if (item?.raw) {
    const raw = item.raw
    form.value = {
      installmentable_id: raw.installmentable_id,
      installmentable_type: raw.installmentable_type || '',
      currency_id: raw.currency_id || raw.currency?.id || null,
      sequence_no: raw.sequence_no || 1,
      narration: raw.narration || '',
      amount_due: raw.amount_due ?? null,
      amount_due_type: raw.amount_due_type || 'FIXED',
      due_days: raw.due_days ?? 0,
      due_days_type: raw.due_days_type || 'AFTER_INVOICE',
      is_deposit: !!raw.is_deposit,
      is_paid: !!raw.is_paid,
      amount_paid: raw.amount_paid ?? null,
      paid_at: toDateTimeLocal(raw.paid_at),
      payment_reference: raw.payment_reference || '',
    }
  } else {
    resetForm()
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const saveItem = async () => {
  if (!form.value.installmentable_type || !form.value.installmentable_id || !form.value.currency_id) {
    Swal.fire('Validation Error', 'Installmentable type, ID, and currency are required.', 'warning')
    return
  }
  if (form.value.sequence_no < 1 || form.value.amount_due === null || form.value.due_days < 0) {
    Swal.fire('Validation Error', 'Sequence, amount due, and due days must be valid values.', 'warning')
    return
  }

  const isEditing = !!editingItem.value
  saving.value = true
  try {
    const payload: any = {
      installmentable_id: Number(form.value.installmentable_id),
      installmentable_type: form.value.installmentable_type,
      currency_id: Number(form.value.currency_id),
      sequence_no: Number(form.value.sequence_no),
      narration: form.value.narration || null,
      amount_due: Number(form.value.amount_due),
      amount_due_type: form.value.amount_due_type,
      due_days: Number(form.value.due_days),
      due_days_type: form.value.due_days_type,
      is_deposit: !!form.value.is_deposit,
    }

    if (editingItem.value?.id) {
      payload.is_paid = !!form.value.is_paid
      if (form.value.amount_paid !== null && form.value.amount_paid !== undefined) {
        payload.amount_paid = Number(form.value.amount_paid)
      }
      if (form.value.payment_reference) {
        payload.payment_reference = form.value.payment_reference
      }
      if (form.value.paid_at) {
        payload.paid_at = new Date(form.value.paid_at).toISOString()
      }
      await axios.put(`${installmentBase}/${editingItem.value.id}`, payload)
    } else {
      await axios.post(installmentBase, payload)
    }

    await fetchInstallmentSetups(tableFilters.value)
    closeModal()
    resetForm()
    Swal.fire('Success', `Installment setup ${isEditing ? 'updated' : 'created'} successfully`, 'success')
  } catch (error: any) {
    Swal.fire('Error', error?.response?.data?.message || 'Failed to save installment setup', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: any) => {
  if (item.is_paid) {
    Swal.fire('Not Allowed', 'Cannot delete a paid installment.', 'warning')
    return
  }

  const result = await Swal.fire({
    title: 'Delete Installment?',
    text: `Delete installment #${item.sequence_no} for ${item.entity_label}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  })
  if (!result.isConfirmed) return

  try {
    await axios.delete(`${installmentBase}/${item.id}`)
    await fetchInstallmentSetups(tableFilters.value)
    Swal.fire('Deleted!', 'Installment setup has been deleted.', 'success')
  } catch (error: any) {
    Swal.fire('Error', error?.response?.data?.message || 'Failed to delete installment setup', 'error')
  }
}

onMounted(async () => {
  await Promise.all([fetchAmountTypes(), fetchDueDaysTypes(), loadCurrencies(), fetchInstallmentSetups()])
})
</script>

<style scoped>
.manage-installment-setups-page {
  padding: 1rem;
}

.breadcrumb {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.breadcrumb-item {
  margin-right: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '/';
  margin-right: 0.5rem;
  color: #6c757d;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.breadcrumb-item a {
  color: #0d6efd;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.modal.show {
  display: block !important;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>
