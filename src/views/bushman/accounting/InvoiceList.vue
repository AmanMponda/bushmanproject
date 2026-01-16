<template>
  <div class="accounting-page invoices-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Accounting</a></li>
          <li class="breadcrumb-item active">Invoices</li>
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
              :data="(invoices as any)"
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
              <template #invoice_date="{ row }">
                {{ formatDate((row as any).invoice_date) }}
              </template>
              <template #entity_name="{ row }">
                {{ getEntityName((row as any)) }}
              </template>
              <template #total_amount="{ row }">
                {{ formatCurrency((row as any).total_amount) }}
              </template>
              <template #outstanding_amount="{ row }">
                <span :style="{ color: getOutstandingColor((row as any).outstanding_amount) }">
                  {{ formatCurrency((row as any).outstanding_amount || calculateOutstanding((row as any))) }}
                </span>
              </template>
              <template #actions="{ row }">
                <div class="d-flex gap-1">
                  <button class="btn btn-info btn-sm" title="View" @click="viewInvoice(row)">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button 
                    v-if="(row as any).status === 'DRAFT'"
                    class="btn btn-success btn-sm" 
                    title="Approve" 
                    @click="approveInvoice(row)"
                  >
                    <i class="fa fa-check"></i>
                  </button>
                  <button 
                    v-if="(row as any).status === 'APPROVED'"
                    class="btn btn-primary btn-sm" 
                    title="Post" 
                    @click="postInvoice(row)"
                  >
                    <i class="fa fa-share"></i>
                  </button>
                  <button 
                    v-if="(row as any).status === 'POSTED' || (row as any).status === 'PARTIALLY_PAID'"
                    class="btn btn-warning btn-sm" 
                    title="Record Payment" 
                    @click="recordPayment(row)"
                  >
                    <i class="fa fa-money"></i>
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

interface Invoice {
  id: string | number
  document_number: string
  status: string
  invoice_date: string | null
  entity: any
  total_amount: number
  outstanding_amount?: number
  [key: string]: any
}

const router = useRouter()
const { init } = useToast()
const accountingStore = useAccountingStore()

// Computed state from store
const invoices = computed((): Invoice[] => accountingStore.invoices)
const loading = computed(() => accountingStore.loading)
const invoiceStatuses = computed(() => accountingStore.invoiceStatuses)

// Table filters state
const tableFilters = reactive({
  pageSize: 15,
  currentPage: 1,
  status: ''
})

// Columns Definition
const columns = computed(() => [
  { key: 'document_number', label: 'Invoice #', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'invoice_date', label: 'Invoice Date', sortable: true, visible: true },
  { key: 'entity_name', label: 'Entity Name', sortable: true, visible: true },
  { key: 'total_amount', label: 'Total Amount', sortable: true, visible: true },
  { key: 'outstanding_amount', label: 'Outstanding', sortable: true, visible: true },
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
      ...invoiceStatuses.value.map((s: any) => ({ label: s.name || s.status, value: s.code || s.id }))
    ]
  }
])

// Page Actions
const pageActions = computed(() => [
  { label: 'Create Invoice', icon: 'fa fa-plus', class: 'btn btn-primary', method: () => createInvoice() }
])

// Methods
function createInvoice() {
  router.push({ name: 'invoice-create' })
}

function viewInvoice(invoice: Invoice) {
  router.push({ name: 'invoice-view', params: { id: invoice.id } })
}

function approveInvoice(invoice: Invoice) {
  Swal.fire({
    title: 'Approve Invoice?',
    text: `Are you sure you want to approve invoice #${invoice.document_number}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, approve it!'
  }).then((result) => {
    if (result.isConfirmed) {
      accountingStore.approveInvoice(invoice.id as number)
        .then(() => {
          init({
            title: 'Success',
            message: `Invoice #${invoice.document_number} has been approved`,
            type: 'success'
          })
          fetchInvoices()
        })
        .catch(err => {
          init({
            title: 'Error',
            message: err.response?.data?.message || 'Error approving invoice',
            type: 'danger'
          })
        })
    }
  })
}

function postInvoice(invoice: Invoice) {
  Swal.fire({
    title: 'Post Invoice?',
    text: `Are you sure you want to post invoice #${invoice.document_number}? This will create a journal voucher.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, post it!'
  }).then((result) => {
    if (result.isConfirmed) {
      accountingStore.postInvoice(invoice.id as number)
        .then(() => {
          init({
            title: 'Success',
            message: `Invoice #${invoice.document_number} has been posted`,
            type: 'success'
          })
          fetchInvoices()
        })
        .catch(err => {
          init({
            title: 'Error',
            message: err.response?.data?.message || 'Error posting invoice',
            type: 'danger'
          })
        })
    }
  })
}

function recordPayment(invoice: Invoice) {
  router.push({ name: 'invoice-payment', params: { id: invoice.id } })
}

function confirmDelete(invoice: Invoice) {
  Swal.fire({
    title: 'Delete Invoice?',
    text: `Are you sure you want to delete invoice #${invoice.document_number}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      accountingStore.deleteInvoice(invoice.id as number)
        .then(() => {
          init({
            title: 'Success',
            message: `Invoice #${invoice.document_number} has been deleted`,
            type: 'success'
          })
          fetchInvoices()
        })
        .catch(err => {
          init({
            title: 'Error',
            message: err.response?.data?.message || 'Error deleting invoice',
            type: 'danger'
          })
        })
    }
  })
}

function handleFiltersUpdate(filters: any) {
  tableFilters.pageSize = filters.pageSize
  tableFilters.currentPage = filters.currentPage
  tableFilters.status = filters.status
  fetchInvoices()
}

function getStatusClass(status: string): string {
  const statusClasses: { [key: string]: string } = {
    'DRAFT': 'badge bg-secondary',
    'APPROVED': 'badge bg-info',
    'POSTED': 'badge bg-primary',
    'PARTIALLY_PAID': 'badge bg-warning',
    'PAID': 'badge bg-success',
    'CANCELLED': 'badge bg-danger',
    'VOID': 'badge bg-dark'
  }
  return statusClasses[status] || 'badge bg-light'
}

function getEntityName(invoice: Invoice): string {
  return invoice.entity?.full_name || invoice.entity?.name || 'N/A'
}

function calculateOutstanding(invoice: Invoice): number {
  const total = invoice.total_amount || 0
  const paid = invoice.settlements?.reduce((sum: number, s: any) => sum + (s.allocated_amount || 0), 0) || 0
  return total - paid
}

function getOutstandingColor(amount: number): string {
  if (!amount || amount === 0) return '#28a745'
  if (amount < 0) return '#dc3545'
  return '#ffc107'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

function formatDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function fetchInvoices() {
  accountingStore.listInvoices({
    page: tableFilters.currentPage,
    per_page: tableFilters.pageSize,
    status: tableFilters.status || undefined
  })
}

// Lifecycle
onMounted(() => {
  accountingStore.fetchInvoiceStatuses()
  fetchInvoices()
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
