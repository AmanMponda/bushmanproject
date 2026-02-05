<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-file-invoice"></i></span>
            ACCOUNTING / <span>VIEW INVOICE</span>
          </div>
          <h1>Invoice #{{ invoice?.document_number || invoice?.id }}</h1>
          <p class="subtitle">
            <span :class="getStatusBadgeClass(invoice?.status)">
              {{ invoice?.status || 'LOADING' }}
            </span>
          </p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="goBack">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button 
            v-if="invoice?.status === 'DRAFT'"
            class="btn secondary" 
            type="button" 
            @click="editInvoice"
          >
            <span class="btn-icon"><i class="fa fa-edit"></i></span> Edit
          </button>
          <button 
            v-if="invoice?.status === 'DRAFT'"
            class="btn success" 
            type="button" 
            @click="approveInvoice"
            :disabled="processing"
          >
            <span class="btn-icon"><i class="fa fa-check"></i></span> 
            {{ processing ? 'Approving...' : 'Approve' }}
          </button>
          <button 
            v-if="invoice?.status === 'APPROVED'"
            class="btn primary" 
            type="button" 
            @click="postInvoice"
            :disabled="processing"
          >
            <span class="btn-icon"><i class="fa fa-paper-plane"></i></span> 
            {{ processing ? 'Posting...' : 'Post Invoice' }}
          </button>
          <button 
            v-if="invoice?.status === 'POSTED' || invoice?.status === 'PARTIALLY_PAID'"
            class="btn warning" 
            type="button" 
            @click="recordPayment"
          >
            <span class="btn-icon"><i class="fa fa-money-bill"></i></span> Record Payment
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading invoice...</p>
      </div>

      <!-- Invoice Content -->
      <div v-if="!loading && invoice" class="invoice-container">
        <!-- Invoice Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon"><i class="fa fa-file-invoice"></i></div>
            <div class="card-content">
              <div class="card-label">Invoice Number</div>
              <div class="card-value">{{ invoice.document_number || `INV-${invoice.id}` }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon"><i class="fa fa-calendar"></i></div>
            <div class="card-content">
              <div class="card-label">Invoice Date</div>
              <div class="card-value">{{ formatDate(invoice.invoice_date) }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon"><i class="fa fa-calendar-check"></i></div>
            <div class="card-content">
              <div class="card-label">Due Date</div>
              <div class="card-value">{{ formatDate(invoice.due_date) }}</div>
            </div>
          </div>
          <div class="summary-card primary">
            <div class="card-icon"><i class="fa fa-dollar-sign"></i></div>
            <div class="card-content">
              <div class="card-label">Total Amount</div>
              <div class="card-value">{{ formatCurrency(invoice.total_amount) }}</div>
            </div>
          </div>
          <div class="summary-card" :class="getBalanceClass(outstandingBalance)">
            <div class="card-icon"><i class="fa fa-balance-scale"></i></div>
            <div class="card-content">
              <div class="card-label">Outstanding Balance</div>
              <div class="card-value">{{ formatCurrency(outstandingBalance) }}</div>
            </div>
          </div>
        </div>

        <!-- 2-Column Grid Layout -->
        <section class="grid">
          <!-- LEFT PANEL: Invoice Details -->
          <aside class="panel left-panel">
            <div class="panel-header">
              <div class="panel-icon"><i class="fa fa-info-circle"></i></div>
              <div class="panel-title-text">
                <h3>Invoice Details</h3>
                <p>Basic information</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="detail-row">
                <span class="detail-label">Invoice Type</span>
                <span class="detail-value">
                  <span class="badge" :class="invoice.invoice_type === 'AR' ? 'badge-ar' : 'badge-ap'">
                    {{ invoice.invoice_type }}
                  </span>
                  {{ invoice.invoice_type === 'AR' ? 'Accounts Receivable' : 'Accounts Payable' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Party Role</span>
                <span class="detail-value">{{ invoice.party_role }}</span>
              </div>
              <div v-if="invoice.branch" class="detail-row">
                <span class="detail-label">Branch</span>
                <span class="detail-value">{{ invoice.branch?.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Document Type</span>
                <span class="detail-value">{{ invoice.document_type?.name }} ({{ invoice.document_type?.code }})</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Entity</span>
                <span class="detail-value">{{ invoice.entity?.full_name || invoice.entity?.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Party Role</span>
                <span class="detail-value">{{ invoice.party_role }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Invoice Type</span>
                <span class="detail-value">{{ invoice.invoice_type }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Currency</span>
                <span class="detail-value">{{ invoice.currency?.code }} - {{ invoice.currency?.name }}</span>
              </div>
              <div v-if="invoice.exchange_rate_to_base && invoice.exchange_rate_to_base !== 1" class="detail-row">
                <span class="detail-label">Exchange Rate</span>
                <span class="detail-value">{{ invoice.exchange_rate_to_base?.toFixed(6) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reference Number</span>
                <span class="detail-value">{{ invoice.reference_no || '—' }}</span>
              </div>
              <div v-if="invoice.journal_voucher_id" class="detail-row">
                <span class="detail-label">Journal Voucher</span>
                <span class="detail-value">
                  <a href="#" @click.prevent="viewJournalVoucher" class="link">
                    JV #{{ invoice.journal_voucher_id }}
                  </a>
                </span>
              </div>
              <div v-if="invoice.description" class="detail-row full-width">
                <span class="detail-label">Description</span>
                <span class="detail-value">{{ invoice.description }}</span>
              </div>
            </div>
          </aside>

          <!-- RIGHT PANEL: Line Items -->
          <section class="panel center-panel">
            <div class="panel-header">
              <div class="panel-icon"><i class="fa fa-list-alt"></i></div>
              <div class="panel-title-text">
                <h3>Line Items</h3>
                <p>{{ invoice.line_items?.length || 0 }} item(s)</p>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="line-items-container">
              <table v-if="invoice.line_items?.length" class="items-table">
                <thead>
                  <tr>
                    <th style="width: 3%">#</th>
                    <th style="width: 20%">Account</th>
                    <th style="width: 30%">Description</th>
                    <th style="width: 10%">Quantity</th>
                    <th style="width: 12%">Unit Price</th>
                    <th style="width: 8%">Tax %</th>
                    <th style="width: 10%">Tax Amount</th>
                    <th style="width: 12%">Line Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in invoice.line_items" :key="item.id" class="item-row">
                    <td class="row-number">{{ Number(index) + 1 }}</td>
                    <td class="item-account">{{ item.account?.account_code }} - {{ item.account?.account_name }}</td>
                    <td class="item-desc">{{ item.description }}</td>
                    <td class="item-qty">{{ formatNumber(item.quantity) }}</td>
                    <td class="item-price">{{ formatCurrency(item.unit_price) }}</td>
                    <td class="item-tax">{{ item.tax_rate || 0 }}%</td>
                    <td class="item-tax-amount">{{ formatCurrency(item.tax_amount || 0) }}</td>
                    <td class="item-amount"><strong>{{ formatCurrency(item.line_amount) }}</strong></td>
                  </tr>
                </tbody>
              </table>

              <!-- Items Summary -->
              <div class="items-summary">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <strong>{{ formatCurrency(subtotal) }}</strong>
                </div>
                <div class="summary-row">
                  <span>Total Tax</span>
                  <strong>{{ formatCurrency(totalTax) }}</strong>
                </div>
                <div class="summary-row total">
                  <span>Total Amount</span>
                  <strong>{{ formatCurrency(invoice.total_amount) }}</strong>
                </div>
              </div>
            </div>
          </section>
        </section>

        <!-- Payment/Settlement History -->
        <section v-if="invoice.settlements?.length" class="panel settlements-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-history"></i></div>
            <div class="panel-title-text">
              <h3>Payment History</h3>
              <p>{{ invoice.settlements.length }} payment(s) recorded</p>
            </div>
          </div>
          <div class="settlements-container">
            <table class="settlements-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment Reference</th>
                  <th>Amount Allocated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="settlement in invoice.settlements" :key="settlement.id">
                  <td>{{ formatDate(settlement.created_at) }}</td>
                  <td>Payment #{{ settlement.journal_voucher_payment_id }}</td>
                  <td><strong>{{ formatCurrency(settlement.allocated_amount) }}</strong></td>
                  <td>
                    <button class="btn-link" @click="viewPayment(settlement.journal_voucher_payment_id)">
                      View Payment
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()

const loading = ref(false)
const processing = ref(false)
const errorMessage = ref('')
const invoice = ref<any>(null)

const invoiceId = computed(() => Number(route.params.id))

// Computed Values
const subtotal = computed(() => {
  return invoice.value?.line_items?.reduce((sum: number, item: any) => {
    const lineSubtotal = item.quantity * item.unit_price
    return sum + lineSubtotal
  }, 0) || 0
})

const totalTax = computed(() => {
  return invoice.value?.line_items?.reduce((sum: number, item: any) => {
    return sum + (item.tax_amount || 0)
  }, 0) || 0
})

const outstandingBalance = computed(() => {
  const total = invoice.value?.total_amount || 0
  const paid = invoice.value?.settlements?.reduce((sum: number, s: any) => {
    return sum + (s.allocated_amount || 0)
  }, 0) || 0
  return total - paid
})

// Methods
function getStatusBadgeClass(status: string): string {
  const classes: { [key: string]: string } = {
    'DRAFT': 'status-badge draft',
    'APPROVED': 'status-badge approved',
    'POSTED': 'status-badge posted',
    'PARTIALLY_PAID': 'status-badge partially-paid',
    'PAID': 'status-badge paid',
    'CANCELLED': 'status-badge cancelled'
  }
  return classes[status] || 'status-badge'
}

function getBalanceClass(balance: number): string {
  if (balance === 0) return 'success'
  if (balance > 0) return 'warning'
  return 'danger'
}

function goBack() {
  router.push({ name: 'invoices' })
}

function editInvoice() {
  router.push({ name: 'invoice-edit', params: { id: invoiceId.value } })
}

async function approveInvoice() {
  const result = await Swal.fire({
    title: 'Approve Invoice?',
    text: `Are you sure you want to approve invoice #${invoice.value.document_number}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Approve!'
  })

  if (!result.isConfirmed) return

  processing.value = true
  try {
    await accountingStore.approveInvoice(invoiceId.value)
    init({ message: `Invoice #${invoice.value.document_number} approved successfully`, color: 'success' })
    await loadInvoice()
  } catch (error: any) {
    init({ message: error.response?.data?.message || 'Error approving invoice', color: 'danger' })
  } finally {
    processing.value = false
  }
}

async function postInvoice() {
  const result = await Swal.fire({
    title: 'Post Invoice?',
    html: `
      <p>Are you sure you want to post invoice <strong>#${invoice.value.document_number}</strong>?</p>
      <p>This will:</p>
      <ul style="text-align: left; margin: 10px auto; display: inline-block;">
        <li>Create a journal voucher</li>
        <li>Lock the invoice for editing</li>
        <li>Update account balances</li>
      </ul>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Post It!'
  })

  if (!result.isConfirmed) return

  processing.value = true
  try {
    await accountingStore.postInvoice(invoiceId.value)
    init({ message: `Invoice #${invoice.value.document_number} posted successfully`, color: 'success' })
    await loadInvoice()
  } catch (error: any) {
    init({ message: error.response?.data?.message || 'Error posting invoice', color: 'danger' })
  } finally {
    processing.value = false
  }
}

function recordPayment() {
  router.push({ name: 'invoice-payment', params: { id: invoiceId.value } })
}

function viewJournalVoucher() {
  if (invoice.value?.journal_voucher_id) {
    router.push({ name: 'journal-voucher-view', params: { id: invoice.value.journal_voucher_id } })
  }
}

function viewPayment(paymentId: number) {
  router.push({ name: 'payment-view', params: { id: paymentId } })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value || 0)
}

function formatDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

async function loadInvoice() {
  loading.value = true
  try {
    const response = await accountingStore.getInvoice(invoiceId.value)
    invoice.value = response.data.data || response.data
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Failed to load invoice'
    init({ message: errorMessage.value, color: 'danger' })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadInvoice()
})
</script>

<style scoped>
/* Modern Design System Variables */
:root {
  --bg: #f5f7fa;
  --card: #ffffff;
  --border: #e2e8f0;
  --text: #0f172a;
  --text-secondary: #475569;
  --primary: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
  --radius: 12px;
  --radius-lg: 16px;
}

/* Base Styles */
.ps-page {
  min-height: 100vh;
  background: var(--bg);
}

.content {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Page Header */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.page-head-left {
  flex: 1;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.crumb-icon {
  display: flex;
  align-items: center;
  color: var(--primary);
}

h1 {
  margin: 6px 0 8px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
}

.subtitle {
  margin: 0;
  font-size: 14px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.draft {
  background: #e5e7eb;
  color: #374151;
}

.status-badge.approved {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.posted {
  background: #ddd6fe;
  color: #5b21b6;
}

.status-badge.partially-paid {
  background: #fed7aa;
  color: #c2410c;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.badge-ar {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-right: 6px;
}

.badge-ap {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-right: 6px;
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  background: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.ghost {
  border-color: #cbd5e1;
  color: #475569;
}

.btn.secondary {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.btn.success {
  background: #10b981;
  border-color: #059669;
  color: white;
}

.btn.primary {
  background: #3b82f6;
  border-color: #2563eb;
  color: white;
}

.btn.warning {
  background: #f59e0b;
  border-color: #d97706;
  color: white;
}

.btn-icon {
  font-size: 14px;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: center;
  box-shadow: var(--shadow);
}

.summary-card.primary {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
}

.summary-card.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
}

.summary-card.warning {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  border-color: #f59e0b;
}

.summary-card.danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #ef4444;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--primary);
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
  align-items: start;
  margin-bottom: 14px;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Panel Base Styles */
.panel {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #dbeafe;
  color: #3b82f6;
}

.panel-title-text h3 {
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  font-size: 16px;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

.panel-body {
  padding: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.full-width {
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  text-align: right;
}

.detail-row.full-width .detail-value {
  text-align: left;
}

.link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 700;
}

.link:hover {
  text-decoration: underline;
}

/* Line Items */
.line-items-container {
  background: #f8fafc;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 13px;
}

.items-table thead {
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
}

.items-table th {
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.items-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
}

.items-table tbody tr:hover {
  background: #f8fafc;
}

.items-table td {
  padding: 12px 10px;
}

.row-number {
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
}

.item-desc {
  font-weight: 500;
  color: #0f172a;
}

.item-qty,
.item-price,
.item-tax,
.item-tax-amount,
.item-amount {
  text-align: right;
  font-weight: 500;
}

.item-amount {
  color: #3b82f6;
  font-weight: 600;
}

.items-summary {
  padding: 16px;
  background: white;
  border-top: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #f1f5f9;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row span {
  color: #475569;
  font-weight: 500;
}

.summary-row strong {
  color: #1e40af;
  font-weight: 600;
  font-size: 14px;
}

.summary-row.total {
  padding: 12px 0;
  border-top: 2px solid #e2e8f0;
}

.summary-row.total span {
  color: #0f172a;
  font-weight: 700;
  font-size: 14px;
}

.summary-row.total strong {
  color: #059669;
  font-size: 18px;
}

/* Settlements */
.settlements-panel {
  margin-top: 14px;
}

.settlements-container {
  padding: 16px;
  background: #f8fafc;
}

.settlements-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 13px;
}

.settlements-table thead {
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
}

.settlements-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.settlements-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
}

.settlements-table tbody tr:hover {
  background: #f8fafc;
}

.settlements-table td {
  padding: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
}

.btn-link:hover {
  color: #1e40af;
}

/* Alert */
.alert {
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 4px solid;
  margin-bottom: 16px;
}

.alert-danger {
  background: #fee2e2;
  border-color: #dc2626;
  color: #991b1b;
}

.alert-dismissible {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.btn-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
}

.mx-3 {
  margin-left: 1rem;
  margin-right: 1rem;
}

.me-2 {
  margin-right: 0.5rem;
}
</style>
