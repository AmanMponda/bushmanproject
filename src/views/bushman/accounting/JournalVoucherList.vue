<template>
  <div class="accounting-page journal-vouchers-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Accounting</a></li>
          <li class="breadcrumb-item active">Payment Vouchers</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <!-- @ts-expect-error: StandardDataTable uses non-typed props -->
            <StandardDataTable
              :columns="columns"
              :data="(journalVouchers as any)"
              :loading="loading"
              :filters="tableFilters"
              :default-page-size="tableFilters.pageSize"
              :disable-pagination="false"
              :show-date-filters="false"
              :action-buttons="pageActions"
              :custom-filters="customFilters"
              @update:filters="handleFiltersUpdate"
            >
              <template #document_number="{ row }">
                <strong>{{ (row as any).document_number || (row as any).id }}</strong>
              </template>
              <template #status="{ row }">
                <span :class="getStatusClass((row as any).status)">{{ (row as any).status }}</span>
              </template>
              <template #posting_date="{ row }">
                {{ formatDate((row as any).posting_date) }}
              </template>
              <template #currency_code="{ row }">
                {{ (row as any).currency?.code || (row as any).currency?.name || 'TZS' }}
              </template>
              <template #total_debit="{ row }">
                {{ formatCurrency(calculateTotalDebit((row as any)), (row as any).currency?.code || 'TZS') }}
              </template>
              <template #narration="{ row }">
                {{ truncateText((row as any).narration, 50) }}
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-info btn-sm" title="View" @click="viewVoucher(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button 
                    v-if="(row as any).status === 'DRAFT'"
                    class="btn btn-success btn-sm" 
                    title="Post" 
                    @click="postVoucher(row)"
                  >
                    <i class="fa fa-check"></i>
                  </button>
                  <button 
                    v-if="(row as any).status === 'POSTED'"
                    class="btn btn-warning btn-sm" 
                    title="Reverse" 
                    @click="reverseVoucher(row)"
                  >
                    <i class="fa fa-undo"></i>
                  </button>
                  <button 
                    v-if="(row as any).status === 'DRAFT'"
                    class="btn btn-danger btn-sm" 
                    title="Delete" 
                    @click="confirmDelete(row)"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Swal from 'sweetalert2'

interface JournalVoucher {
  id: string | number
  document_number: string
  status: string
  posting_date: string | null
  currency: any
  currency_id?: number
  total_amount?: number
  amount?: number
  narration: string
  accounts: any[]
  [key: string]: any
}

const router = useRouter()
const { init } = useToast()
const accountingStore = useAccountingStore()

// Computed state from store
const journalVouchers = computed((): JournalVoucher[] => accountingStore.journalVouchers)
const loading = computed(() => accountingStore.loading)
const voucherStatuses = computed(() => accountingStore.journalVoucherStatuses)

// Table filters state
const tableFilters = reactive({
  pageSize: 15,
  currentPage: 1,
  status: ''
})

// Columns Definition
const columns = computed(() => [
  { key: 'document_number', label: 'Voucher #', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'posting_date', label: 'Posting Date', sortable: true, visible: true },
  { key: 'currency_code', label: 'Currency', sortable: true, visible: true },
  { key: 'total_debit', label: 'Total Amount', sortable: true, visible: true },
  { key: 'narration', label: 'Narration', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

// Custom Filters
const customFilters = computed(() => [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All Status', value: '' },
      ...voucherStatuses.value.map((s: any) => ({ label: s.name || s.status, value: s.code || s.id }))
    ]
  }
])

// Page Actions
const pageActions = computed(() => [
  { label: 'Create Voucher', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => createVoucher() }
])

// Methods
function createVoucher() {
  router.push({ name: 'journal-voucher-create' })
}

function viewVoucher(voucher: JournalVoucher) {
  router.push({ name: 'journal-voucher-view', params: { id: voucher.id } })
}

function postVoucher(voucher: JournalVoucher) {
  Swal.fire({
    title: 'Post Journal Voucher?',
    text: `Are you sure you want to post voucher #${voucher.document_number}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, post it!'
  }).then((result) => {
    if (result.isConfirmed) {
      accountingStore.postJournalVoucher(voucher.id as number)
        .then(() => {
          init({
            message: `Voucher #${voucher.document_number} has been posted`,
            color: 'success'
          })
          fetchVouchers()
        })
        .catch((err: any) => {
          init({
            message: err.response?.data?.message || 'Error posting voucher',
            color: 'danger'
          })
        })
    }
  })
}

function reverseVoucher(voucher: JournalVoucher) {
  Swal.fire({
    title: 'Reverse Journal Voucher?',
    text: `Are you sure you want to reverse voucher #${voucher.document_number}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, reverse it!'
  }).then((result) => {
    if (result.isConfirmed) {
      accountingStore.reverseJournalVoucher(voucher.id as number)
        .then(() => {
          init({
            message: `Voucher #${voucher.document_number} has been reversed`,
            color: 'success'
          })
          fetchVouchers()
        })
        .catch((err: any) => {
          init({
            message: err.response?.data?.message || 'Error reversing voucher',
            color: 'danger'
          })
        })
    }
  })
}

function confirmDelete(voucher: JournalVoucher) {
  Swal.fire({
    title: 'Delete Journal Voucher?',
    text: `Are you sure you want to delete voucher #${voucher.document_number}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      accountingStore.deleteJournalVoucher(voucher.id as number)
        .then(() => {
          init({
            message: `Voucher #${voucher.document_number} has been deleted`,
            color: 'success'
          })
          fetchVouchers()
        })
        .catch((err: any) => {
          init({
            message: err.response?.data?.message || 'Error deleting voucher',
            color: 'danger'
          })
        })
    }
  })
}

function handleFiltersUpdate(filters: any) {
  tableFilters.pageSize = filters.pageSize
  tableFilters.currentPage = filters.currentPage
  tableFilters.status = filters.status
  fetchVouchers()
}

function getStatusClass(status: string): string {
  const statusClasses: { [key: string]: string } = {
    'DRAFT': 'badge bg-secondary',
    'SUBMITTED': 'badge bg-info',
    'POSTED': 'badge bg-success',
    'REVERSED': 'badge bg-danger',
    'VOID': 'badge bg-dark'
  }
  return statusClasses[status] || 'badge bg-light'
}

function calculateTotalDebit(voucher: JournalVoucher): number {
  console.log('Voucher:', voucher.document_number, 'Accounts:', voucher.accounts)
  
  // Use the same logic as the view page: get amount from DR account in accounts array
  if (voucher.accounts && voucher.accounts.length > 0) {
    console.log('Found accounts array with length:', voucher.accounts.length)
    const drAccount = voucher.accounts.find((a: any) => a.transaction_type === 'DR' || a.transaction_type === 'DEBIT')
    console.log('DR Account found:', drAccount)
    if (drAccount && drAccount.amount) {
      console.log('Amount from DR account:', drAccount.amount)
      return parseFloat(String(drAccount.amount))
    }
  }
  
  // Fallback to total_amount if accounts not loaded
  if (voucher.total_amount) {
    console.log('Using total_amount:', voucher.total_amount)
    return parseFloat(String(voucher.total_amount))
  }
  if ((voucher as any).amount) {
    console.log('Using amount:', (voucher as any).amount)
    return parseFloat(String((voucher as any).amount))
  }
  
  console.log('No amount found, returning 0')
  return 0
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

function formatDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function truncateText(text: string, length: number): string {
  if (!text) return '—'
  return text.length > length ? text.substring(0, length) + '...' : text
}

function fetchVouchers() {
  accountingStore.listJournalVouchers({
    page: tableFilters.currentPage,
    per_page: tableFilters.pageSize,
    status: tableFilters.status || undefined
  })
}

// Lifecycle
onMounted(() => {
  accountingStore.fetchJournalVoucherStatuses()
  fetchVouchers()
})
</script>

<style scoped>
.accounting-page {
  padding: 1.5rem 0;
}

.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin-bottom: 1.5rem;
}

.panel {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.badge {
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.btn-sm {
  padding: 0.35rem 0.6rem;
  margin: 0 0.15rem;
}
</style>
