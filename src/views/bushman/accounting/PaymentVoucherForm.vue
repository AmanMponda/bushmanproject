<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-money-check-alt"></i></span>
            ACCOUNTING / <span>PAYMENT VOUCHER</span>
          </div>
          <h1>{{ isEdit ? 'Edit Payment Voucher' : 'Create Payment Voucher' }}</h1>
          <p class="subtitle">Record payments and allocate to invoices</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="goBack">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn ghost" type="button" @click="resetForm">
            <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
          </button>
          <button class="btn primary" type="button" @click="submit" :disabled="saving">
            <span class="btn-icon"><i class="fa fa-save"></i></span> 
            {{ saving ? 'Processing...' : 'Post Payment' }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Payment Summary -->
      <div v-if="paymentSummary.totalAllocated > 0" class="balance-summary">
        <div class="summary-item">
          <div class="summary-label">Payment Amount</div>
          <div class="summary-value">{{ formatCurrency(form.payment_amount) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Allocated</div>
          <div class="summary-value">{{ formatCurrency(paymentSummary.totalAllocated) }}</div>
        </div>
        <div class="summary-item" :class="{ 'warning': paymentSummary.unallocated !== 0 }">
          <div class="summary-label">Unallocated</div>
          <div class="summary-value">{{ formatCurrency(paymentSummary.unallocated) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Invoice Count</div>
          <div class="summary-value">{{ paymentSummary.invoiceCount }}</div>
        </div>
      </div>

      <!-- 2-Column Grid Layout -->
      <section class="grid">
        <!-- LEFT PANEL: Payment Details -->
        <aside class="panel left-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-info-circle"></i></div>
            <div class="panel-title-text">
              <h3>Payment Details</h3>
              <p>Basic payment information</p>
            </div>
          </div>
          <div class="form">
            <!-- SECTION 1: BASIC INFORMATION -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-building"></i></span>
                Payment Account
              </div>

              <label class="field">
                <span class="lbl">Payment From (Cash/Bank Account) <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-university"></i></span>
                  <select v-model="form.from_account_id" required @change="onAccountChange">
                    <option value="">-- Select Account --</option>
                    <option v-for="account in bankCashAccounts" :key="account.id" :value="String(account.id)">
                      {{ account.account_code }} - {{ account.account_name }}
                      <span v-if="account.current_balance">(Balance: {{ formatCurrency(account.current_balance) }})</span>
                    </option>
                  </select>
                </div>
              </label>

              <div v-if="accountBalance !== null" class="info-box">
                <i class="fa fa-info-circle"></i>
                <div>
                  <strong>Available Balance:</strong> {{ formatCurrency(accountBalance) }}
                </div>
              </div>
            </div>

            <!-- SECTION 2: PAYEE SELECTION -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-user"></i></span>
                Payee Information
              </div>

              <label class="field">
                <span class="lbl">Payee (Vendor/Customer) <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-users"></i></span>
                  <select v-model="form.entity_id" required @change="onPayeeSelect">
                    <option value="">-- Select Payee --</option>
                    <option v-for="entity in entities" :key="entity.id" :value="String(entity.id)">
                      {{ entity.full_name || entity.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Payment Amount <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-dollar-sign"></i></span>
                  <input 
                    v-model.number="form.payment_amount" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required 
                    placeholder="0.00"
                    @blur="validatePaymentAmount"
                  />
                </div>
              </label>
            </div>

            <!-- SECTION 3: DATES & REFERENCE -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-calendar"></i></span>
                Dates & Reference
              </div>

              <label class="field">
                <span class="lbl">Payment Date <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input v-model="form.payment_date" type="date" required />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Payment Method</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-credit-card"></i></span>
                  <select v-model="form.payment_method">
                    <option value="">-- Select Method --</option>
                    <option v-for="method in paymentMethods" :key="method.code || method.id" :value="method.code || method.name">
                      {{ method.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Reference Number</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-hashtag"></i></span>
                  <input v-model="form.reference_number" type="text" placeholder="Check #, Transaction ID, etc." />
                </div>
              </label>
            </div>

            <!-- SECTION 4: NOTES -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-align-left"></i></span>
                Notes
              </div>

              <label class="field">
                <span class="lbl">Memo/Description</span>
                <div class="input-wrapper textarea-wrapper">
                  <span class="input-icon"><i class="fa fa-align-left"></i></span>
                  <textarea 
                    v-model="form.memo" 
                    rows="3"
                    placeholder="Enter any additional notes"
                  ></textarea>
                </div>
              </label>
            </div>
          </div>
        </aside>

        <!-- RIGHT PANEL: Invoice Selection & Allocation -->
        <section class="panel center-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-file-invoice-dollar"></i></div>
            <div class="panel-title-text">
              <h3>Invoice Allocation</h3>
              <p>Select and allocate payment to invoices</p>
            </div>
          </div>

          <div class="invoice-allocation-container">
            <!-- Loading State -->
            <div v-if="loadingInvoices" class="loading-state">
              <div class="spinner"></div>
              <p>Loading invoices...</p>
            </div>

            <!-- No Payee Selected -->
            <div v-else-if="!form.entity_id" class="empty-state">
              <i class="fa fa-user-times"></i>
              <p>Select a payee to view open invoices</p>
            </div>

            <!-- No Invoices Found -->
            <div v-else-if="openInvoices.length === 0" class="empty-state">
              <i class="fa fa-inbox"></i>
              <p>No open invoices found for this payee</p>
              <small>All invoices have been fully paid or no invoices exist</small>
            </div>

            <!-- Invoice Selection Table -->
            <div v-else>
              <div class="table-header">
                <h4>Open Invoices</h4>
                <span class="badge">{{ openInvoices.length }} invoice(s)</span>
              </div>

              <table class="invoices-table">
                <thead>
                  <tr>
                    <th style="width: 5%">
                      <input 
                        type="checkbox" 
                        @change="toggleAllInvoices" 
                        :checked="allInvoicesSelected"
                      />
                    </th>
                    <th style="width: 20%">Invoice #</th>
                    <th style="width: 15%">Date</th>
                    <th style="width: 15%">Total</th>
                    <th style="width: 15%">Balance</th>
                    <th style="width: 30%">Payment Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="invoice in openInvoices" :key="invoice.id" :class="{ 'selected': isInvoiceSelected(invoice.id) }">
                    <td>
                      <input 
                        type="checkbox" 
                        :checked="isInvoiceSelected(invoice.id)"
                        @change="toggleInvoice(invoice)"
                      />
                    </td>
                    <td>
                      <strong>{{ invoice.document_number }}</strong>
                      <br>
                      <small class="text-muted">{{ invoice.invoice_type }}</small>
                    </td>
                    <td>{{ formatDate(invoice.invoice_date) }}</td>
                    <td>{{ formatCurrency(invoice.total_amount) }}</td>
                    <td>
                      <strong class="text-warning">{{ formatCurrency(getInvoiceBalance(invoice)) }}</strong>
                    </td>
                    <td>
                      <div class="payment-input-wrapper">
                        <span class="currency-symbol">$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          :max="getInvoiceBalance(invoice)"
                          class="payment-amount-input"
                          :value="getAllocationAmount(invoice.id)"
                          @input="updateAllocation(invoice, $event)"
                          @focus="ensureInvoiceSelected(invoice)"
                          placeholder="0.00"
                        />
                        <button 
                          v-if="isInvoiceSelected(invoice.id)"
                          class="btn-full" 
                          @click="allocateFullBalance(invoice)"
                          title="Pay full balance"
                        >
                          <i class="fa fa-check-double"></i>
                        </button>
                      </div>
                      <div v-if="getAllocationError(invoice.id)" class="error-text">
                        {{ getAllocationError(invoice.id) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Allocation Summary -->
              <div class="allocation-summary">
                <div class="summary-line">
                  <span>Total Payment:</span>
                  <strong>{{ formatCurrency(form.payment_amount) }}</strong>
                </div>
                <div class="summary-line">
                  <span>Allocated to Invoices:</span>
                  <strong>{{ formatCurrency(paymentSummary.totalAllocated) }}</strong>
                </div>
                <div class="summary-line" :class="paymentSummary.unallocated < 0 ? 'error' : ''">
                  <span>Unallocated Amount:</span>
                  <strong>{{ formatCurrency(paymentSummary.unallocated) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()

const isEdit = computed(() => !!route.params.id)
const paymentId = computed(() => route.params.id ? Number(route.params.id) : null)

const saving = ref(false)
const loadingInvoices = ref(false)
const errorMessage = ref('')
const accountBalance = ref<number | null>(null)

// Open invoices for selected payee
const openInvoices = ref<any[]>([])

// Invoice allocations: Map<invoiceId, amount>
const allocations = ref<Map<number, number>>(new Map())
const allocationErrors = ref<Map<number, string>>(new Map())

// Form Data
const form = ref({
  from_account_id: '',
  entity_id: '',
  payment_amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  reference_number: '',
  memo: ''
})

// Reference Data
const bankCashAccounts = computed(() => accountingStore.bankCashAccounts)
const entities = computed(() => accountingStore.entities)
const paymentMethods = computed(() => {
  // If payment instruments are available from backend, use them
  if (accountingStore.paymentInstruments && accountingStore.paymentInstruments.length > 0) {
    return accountingStore.paymentInstruments
  }
  // Fallback to common payment methods if backend doesn't provide them
  return [
    { code: 'CASH', name: 'Cash' },
    { code: 'CHECK', name: 'Check' },
    { code: 'BANK_TRANSFER', name: 'Bank Transfer' },
    { code: 'MOBILE_MONEY', name: 'Mobile Money' },
    { code: 'CARD', name: 'Card' },
    { code: 'EFT', name: 'Electronic Funds Transfer' }
  ]
})

// Computed Properties
const allInvoicesSelected = computed(() => {
  if (openInvoices.value.length === 0) return false
  return openInvoices.value.every(inv => allocations.value.has(inv.id))
})

const paymentSummary = computed(() => {
  const totalAllocated = Array.from(allocations.value.values()).reduce((sum, amount) => sum + amount, 0)
  const unallocated = form.value.payment_amount - totalAllocated
  const invoiceCount = allocations.value.size

  return {
    totalAllocated,
    unallocated,
    invoiceCount
  }
})

// Methods
function getInvoiceBalance(invoice: any): number {
  const total = invoice.total_amount || 0
  const paid = invoice.settlements?.reduce((sum: number, s: any) => sum + (s.allocated_amount || 0), 0) || 0
  return total - paid
}

function isInvoiceSelected(invoiceId: number): boolean {
  return allocations.value.has(invoiceId)
}

function getAllocationAmount(invoiceId: number): number {
  return allocations.value.get(invoiceId) || 0
}

function getAllocationError(invoiceId: number): string {
  return allocationErrors.value.get(invoiceId) || ''
}

function toggleInvoice(invoice: any) {
  if (allocations.value.has(invoice.id)) {
    allocations.value.delete(invoice.id)
    allocationErrors.value.delete(invoice.id)
  } else {
    allocations.value.set(invoice.id, 0)
  }
}

function ensureInvoiceSelected(invoice: any) {
  if (!allocations.value.has(invoice.id)) {
    allocations.value.set(invoice.id, 0)
  }
}

function toggleAllInvoices(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  
  if (checked) {
    openInvoices.value.forEach(invoice => {
      if (!allocations.value.has(invoice.id)) {
        allocations.value.set(invoice.id, 0)
      }
    })
  } else {
    allocations.value.clear()
    allocationErrors.value.clear()
  }
}

function updateAllocation(invoice: any, event: Event) {
  const input = event.target as HTMLInputElement
  const amount = parseFloat(input.value) || 0
  const balance = getInvoiceBalance(invoice)

  // Clear previous error
  allocationErrors.value.delete(invoice.id)

  // Validate amount
  if (amount < 0) {
    allocationErrors.value.set(invoice.id, 'Amount cannot be negative')
    return
  }

  if (amount > balance) {
    allocationErrors.value.set(invoice.id, `Amount exceeds invoice balance (${formatCurrency(balance)})`)
    allocations.value.set(invoice.id, balance)
    input.value = balance.toString()
    return
  }

  if (amount > 0) {
    allocations.value.set(invoice.id, amount)
  } else {
    allocations.value.delete(invoice.id)
  }
}

function allocateFullBalance(invoice: any) {
  const balance = getInvoiceBalance(invoice)
  allocations.value.set(invoice.id, balance)
  allocationErrors.value.delete(invoice.id)
}

async function onAccountChange() {
  if (!form.value.from_account_id) {
    accountBalance.value = null
    return
  }

  // Fetch account balance
  try {
    const account = bankCashAccounts.value.find((acc: any) => acc.id === Number(form.value.from_account_id))
    if (account) {
      accountBalance.value = account.current_balance || 0
    }
  } catch (error) {
    console.error('Error loading account balance:', error)
  }
}

async function onPayeeSelect() {
  if (!form.value.entity_id) {
    openInvoices.value = []
    allocations.value.clear()
    allocationErrors.value.clear()
    return
  }

  // Fetch open invoices for the selected payee
  loadingInvoices.value = true
  try {
    const response = await accountingStore.searchInvoices('', 'POSTED,PARTIALLY_PAID', {
      entity_id: form.value.entity_id,
      has_balance: true
    })
    
    const invoices = response.data?.data || response.data || []
    openInvoices.value = invoices.filter((inv: any) => {
      const balance = getInvoiceBalance(inv)
      return balance > 0
    })

    // Clear existing allocations when payee changes
    allocations.value.clear()
    allocationErrors.value.clear()
  } catch (error: any) {
    console.error('Error loading invoices:', error)
    init({ message: error.response?.data?.message || 'Error loading invoices', color: 'danger' })
    openInvoices.value = []
  } finally {
    loadingInvoices.value = false
  }
}

function validatePaymentAmount() {
  if (form.value.payment_amount <= 0) {
    errorMessage.value = 'Payment amount must be greater than zero'
    return false
  }

  if (accountBalance.value !== null && form.value.payment_amount > accountBalance.value) {
    errorMessage.value = `Payment amount (${formatCurrency(form.value.payment_amount)}) exceeds available balance (${formatCurrency(accountBalance.value)})`
    return false
  }

  errorMessage.value = ''
  return true
}

async function submit() {
  // Validation
  if (!form.value.from_account_id || !form.value.entity_id || !form.value.payment_amount) {
    init({ message: 'Please fill all required fields', color: 'warning' })
    return
  }

  if (!validatePaymentAmount()) {
    return
  }

  if (allocations.value.size === 0) {
    const result = await Swal.fire({
      title: 'No Invoice Allocations',
      text: 'You have not allocated this payment to any invoices. Continue anyway?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Continue'
    })

    if (!result.isConfirmed) return
  }

  if (paymentSummary.value.unallocated < 0) {
    init({ message: 'Total allocated amount exceeds payment amount', color: 'danger' })
    return
  }

  // Confirm submission
  const result = await Swal.fire({
    title: 'Post Payment?',
    html: `
      <p><strong>Payment Amount:</strong> ${formatCurrency(form.value.payment_amount)}</p>
      <p><strong>Allocated to Invoices:</strong> ${formatCurrency(paymentSummary.value.totalAllocated)}</p>
      <p><strong>Unallocated:</strong> ${formatCurrency(paymentSummary.value.unallocated)}</p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Post Payment'
  })

  if (!result.isConfirmed) return

  saving.value = true
  try {
    const payload = {
      from_account_id: Number(form.value.from_account_id),
      entity_id: Number(form.value.entity_id),
      payment_amount: form.value.payment_amount,
      payment_date: form.value.payment_date,
      payment_method: form.value.payment_method,
      reference_number: form.value.reference_number,
      memo: form.value.memo,
      invoice_allocations: Array.from(allocations.value.entries()).map(([invoiceId, amount]) => ({
        invoice_id: invoiceId,
        allocated_amount: amount
      }))
    }

    await accountingStore.postPaymentVoucher(payload)
    
    init({ message: 'Payment posted successfully', color: 'success' })
    
    setTimeout(() => {
      router.push({ name: 'payments' })
    }, 1500)
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Error posting payment'
    init({ message: errorMsg, color: 'danger' })
    errorMessage.value = errorMsg
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'payments' })
}

function resetForm() {
  form.value = {
    from_account_id: '',
    entity_id: '',
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    memo: ''
  }
  allocations.value.clear()
  allocationErrors.value.clear()
  openInvoices.value = []
  accountBalance.value = null
  errorMessage.value = ''
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

// Lifecycle
onMounted(async () => {
  await Promise.all([
    accountingStore.getBankCashAccounts(),
    accountingStore.fetchEntities(),
    accountingStore.fetchPaymentInstruments().catch(() => {
      // Silently fail if payment instruments endpoint doesn't exist
      console.log('Using fallback payment methods')
    })
  ])
})

// Watch payment amount changes to validate
watch(() => form.value.payment_amount, () => {
  if (form.value.payment_amount > 0 && paymentSummary.value.totalAllocated > form.value.payment_amount) {
    errorMessage.value = 'Total allocated amount exceeds payment amount'
  } else {
    errorMessage.value = ''
  }
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
  color: var(--primary);
}

h1 {
  margin: 6px 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
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

.btn.primary {
  background: #3b82f6;
  border-color: #2563eb;
  color: white;
}

.btn-icon {
  font-size: 14px;
}

/* Balance Summary */
.balance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: var(--radius);
  border: 2px solid #bfdbfe;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item.warning {
  background: #fef3c7;
  padding: 8px;
  border-radius: 8px;
}

.summary-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 18px;
  font-weight: 800;
  color: #1e40af;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
  align-items: start;
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

/* Form Styles */
.form {
  padding: 16px;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #dbeafe;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.field {
  margin-bottom: 16px;
  display: block;
}

.lbl {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.req {
  color: #ef4444;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  font-size: 14px;
  pointer-events: none;
}

.input-wrapper select,
.input-wrapper input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.input-wrapper select:focus,
.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px #dbeafe;
}

.textarea-wrapper textarea {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

.info-box {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #dbeafe;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  font-size: 13px;
  margin-top: 12px;
}

.info-box i {
  color: #3b82f6;
}

/* Invoice Allocation */
.invoice-allocation-container {
  background: #f8fafc;
  padding: 16px;
  min-height: 300px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
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

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border);
}

.table-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.invoices-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 13px;
  border-radius: 8px;
  overflow: hidden;
}

.invoices-table thead {
  background: #f1f5f9;
}

.invoices-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.invoices-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s ease;
}

.invoices-table tbody tr:hover {
  background: #f8fafc;
}

.invoices-table tbody tr.selected {
  background: #eff6ff;
}

.invoices-table td {
  padding: 12px;
}

.text-muted {
  color: #94a3b8;
  font-size: 11px;
}

.text-warning {
  color: #f59e0b;
}

.payment-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 10px;
  color: #94a3b8;
  font-weight: 600;
}

.payment-amount-input {
  flex: 1;
  padding: 8px 10px 8px 24px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.payment-amount-input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn-full {
  background: #10b981;
  border: none;
  color: white;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-full:hover {
  background: #059669;
}

.error-text {
  color: var(--danger);
  font-size: 11px;
  margin-top: 4px;
}

.allocation-summary {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.summary-line:last-child {
  border-bottom: none;
  padding-top: 12px;
  border-top: 2px solid #e2e8f0;
}

.summary-line.error {
  color: var(--danger);
}

.summary-line strong {
  font-weight: 700;
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
