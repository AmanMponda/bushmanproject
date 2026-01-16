<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-book"></i></span>
            ACCOUNTING / <span>{{ isEdit ? 'EDIT' : 'CREATE' }}</span>
          </div>
          <h1>{{ isEdit ? 'Edit Journal Voucher' : 'Create Journal Voucher' }}</h1>
          <p class="subtitle">{{ isEdit ? 'Update voucher details and account entries' : 'Create a new journal entry with balanced debits and credits' }}</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="goBack">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn ghost" type="button" @click="resetForm">
            <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
          </button>
          <button class="btn secondary" type="button" @click="submit" :disabled="saving">
            <span class="btn-icon"><i class="fa fa-save"></i></span> {{ saving ? 'Saving...' : isEdit ? 'Update Voucher' : 'Create Voucher' }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Balance Summary -->
      <div v-if="balanceSummary" class="balance-summary">
        <div class="summary-item">
          <div class="summary-label">Total Debits</div>
          <div class="summary-value">{{ formatCurrency(balanceSummary.total_debit) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Credits</div>
          <div class="summary-value">{{ formatCurrency(balanceSummary.total_credit) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Balance</div>
          <div :class="['summary-value', balanceSummary.is_balanced ? 'balanced' : 'unbalanced']">
            {{ formatCurrency(balanceSummary.difference) }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-badge" :style="{ backgroundColor: balanceSummary.is_balanced ? '#10b981' : '#ef4444' }">
            {{ balanceSummary.is_balanced ? '✓ Balanced' : '✗ Unbalanced' }}
          </div>
        </div>
      </div>

      <!-- 2-Column Grid Layout -->
      <section class="grid">
        <!-- LEFT PANEL: Voucher Details -->
        <aside class="panel left-panel">
          <div class="form">
            <!-- SECTION 0: LINK SOURCE DOCUMENTS -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-link"></i></span>
                Link Source Documents
              </div>

              <label class="field">
                <span class="lbl">Select Requisition to Link</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-file-text"></i></span>
                  <select v-model="selectedRequisitionId" @change="onRequisitionSelect">
                    <option value="">-- Select Requisition --</option>
                    <option v-for="req in requisitionsForLinking" :key="req.id" :value="String(req.id)">
                      {{ req.requisition_number || `REQ-${req.id}` }} - {{ req.requisition_type?.name }}
                    </option>
                  </select>
                </div>
              </label>

              <button 
                v-if="selectedRequisitionId" 
                class="btn btn-primary full-width" 
                @click="linkRequisition"
                :disabled="savingLink"
              >
                <i class="fa fa-link me-1"></i> {{ savingLink ? 'Linking...' : 'Link Requisition' }}
              </button>

              <div v-if="linkedRequisitions.length > 0" class="mt-4">
                <div class="section-header">
                  <h5>Linked Requisitions</h5>
                  <span class="badge-count">{{ linkedRequisitions.length }}</span>
                </div>
                <div class="linked-items-list">
                  <div v-for="link in linkedRequisitions" :key="link.id" class="linked-item">
                    <div class="linked-item-info">
                      <span class="linked-item-icon">📋</span>
                      <div>
                        <div class="linked-item-title">{{ link.requisition?.requisition_number || `REQ-${link.linkable_id}` }}</div>
                        <div class="linked-item-meta">{{ link.requisition?.requisition_type?.name }}</div>
                      </div>
                    </div>
                    <button type="button" class="btn-add-section" @click="unlinkRequisition(link.id)" title="Unlink">
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 1: BASIC INFORMATION -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-info-circle"></i></span>
                Basic Information
              </div>

              <label class="field">
                <span class="lbl">Document Type <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-file-text"></i></span>
                  <select v-model="form.document_type_id" required>
                    <option value="">-- Select Document Type --</option>
                    <option v-for="docType in documentTypes" :key="docType.id" :value="String(docType.id)">
                      {{ docType.name }} ({{ docType.code }})
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Currency <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-dollar"></i></span>
                  <select v-model="form.currency_id" required>
                    <option value="">-- Select Currency --</option>
                    <option v-for="currency in currencies" :key="currency.id" :value="String(currency.id)">
                      {{ currency.code }} - {{ currency.name }}
                    </option>
                  </select>
                </div>
              </label>
            </div>

            <!-- SECTION 2: DATES & DETAILS -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-calendar"></i></span>
                Dates & Details
              </div>

              <label class="field">
                <span class="lbl">Posting Date <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input v-model="form.posting_date" type="date" required />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Narration</span>
                <div class="input-wrapper textarea-wrapper">
                  <span class="input-icon"><i class="fa fa-align-left"></i></span>
                  <textarea 
                    v-model="form.narration" 
                    rows="3"
                    placeholder="Enter narration or description"
                  ></textarea>
                </div>
              </label>
            </div>
          </div>
        </aside>

        <!-- RIGHT PANEL: Account Lines & Linking -->
        <section class="panel center-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-list-alt"></i></div>
            <div class="panel-title-text">
              <h3>Account Lines</h3>
              <p>Add debits and credits</p>
            </div>
          </div>

          <!-- Add Account Line Form -->
          <div class="form">
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-plus"></i></span>
                Add Account Line
              </div>

              <label class="field">
                <span class="lbl">Account <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-credit-card"></i></span>
                  <select v-model="newLine.account_id" required>
                    <option value="">-- Select Account --</option>
                    <option v-for="account in accounts" :key="account.id" :value="String(account.id)">
                      {{ account.code }} - {{ account.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Type <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-exchange"></i></span>
                  <select v-model="newLine.transaction_type" required>
                    <option value="">-- Select Type --</option>
                    <option value="DR">Debit (DR)</option>
                    <option value="CR">Credit (CR)</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Amount <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-dollar"></i></span>
                  <input v-model.number="newLine.amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Exchange Rate</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-percent"></i></span>
                  <input v-model.number="newLine.exchange_rate" type="number" step="0.0001" placeholder="1.00" />
                </div>
              </label>

              <button class="btn btn-primary full-width" @click="addAccountLine">
                <i class="fa fa-plus me-1"></i> Add Line
              </button>
            </div>
          </div>

          <!-- Account Lines Table -->
          <div v-if="form.accounts.length > 0" class="form">
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-table"></i></span>
                Lines ({{ form.accounts.length }})
              </div>

              <div class="table-responsive">
                <table class="compact-table">
                  <thead>
                    <tr>
                      <th style="width: 5%">#</th>
                      <th style="width: 45%">Account</th>
                      <th style="width: 12%">Type</th>
                      <th style="width: 20%">Amount</th>
                      <th style="width: 6%"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, index) in form.accounts" :key="index">
                      <td class="text-center"><strong>{{ index + 1 }}</strong></td>
                      <td>{{ line.account_code }} - {{ line.account_name }}</td>
                      <td>
                        <span :class="['type-badge', line.transaction_type === 'DR' ? 'badge-debit' : 'badge-credit']">
                          {{ line.transaction_type }}
                        </span>
                      </td>
                      <td class="text-end">{{ formatCurrency(line.amount) }}</td>
                      <td class="text-center">
                        <button type="button" class="remove-btn" @click="removeLine(index)">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>


        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()

const isEdit = computed(() => !!route.params.id)
const voucherId = computed(() => route.params.id ? Number(route.params.id) : null)

const saving = ref(false)
const savingLink = ref(false)

// Requisition Linking
const selectedRequisitionId = ref('')
const linkedRequisitions = ref([] as any[])

// Form Data
const form = ref({
  document_type_id: '',
  currency_id: '',
  posting_date: new Date().toISOString().split('T')[0],
  narration: '',
  accounts: [] as any[]
})

// New Line Input
const newLine = ref({
  account_id: '',
  transaction_type: '',
  amount: 0,
  exchange_rate: 1.0
})

// Reference Data
const documentTypes = computed(() => accountingStore.documentTypes)
const currencies = computed(() => accountingStore.currencies)
const accounts = computed(() => accountingStore.accounts)
const requisitionsForLinking = computed(() => accountingStore.requisitionsForLinking)

// Balance Summary
const balanceSummary = computed(() => {
  const debits = form.value.accounts
    .filter(a => a.transaction_type === 'DR')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const credits = form.value.accounts
    .filter(a => a.transaction_type === 'CR')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const difference = debits - credits
  
  return {
    total_debit: debits,
    total_credit: credits,
    difference: difference,
    is_balanced: Math.abs(difference) < 0.01
  }
})

// Methods
function addAccountLine() {
  if (!newLine.value.account_id || !newLine.value.transaction_type || !newLine.value.amount) {
    init({
      title: 'Validation Error',
      message: 'Please fill all required fields',
      type: 'warning'
    })
    return
  }

  const selectedAccount = accounts.value.find(a => String(a.id) === newLine.value.account_id)
  
  form.value.accounts.push({
    account_id: newLine.value.account_id,
    account_code: selectedAccount?.code,
    account_name: selectedAccount?.name,
    transaction_type: newLine.value.transaction_type,
    amount: newLine.value.amount,
    exchange_rate: newLine.value.exchange_rate || 1.0
  })

  // Reset form
  newLine.value = {
    account_id: '',
    transaction_type: '',
    amount: 0,
    exchange_rate: 1.0
  }
}

function removeLine(index: number) {
  form.value.accounts.splice(index, 1)
}

// Requisition Linking Methods
async function onRequisitionSelect() {
  if (!selectedRequisitionId.value) return
  try {
    await accountingStore.getRequisitionDetails(Number(selectedRequisitionId.value))
  } catch (error) {
    init({
      title: 'Error',
      message: 'Failed to load requisition details',
      type: 'danger'
    })
  }
}

async function linkRequisition() {
  if (!selectedRequisitionId.value) {
    init({
      title: 'Validation Error',
      message: 'Please select a requisition',
      type: 'warning'
    })
    return
  }

  savingLink.value = true
  try {
    // Find the first account line to link with (primary line)
    if (form.value.accounts.length === 0) {
      init({
        title: 'Validation Error',
        message: 'Please add account lines before linking a requisition',
        type: 'warning'
      })
      return
    }

    const firstAccountLine = form.value.accounts[0]
    const newLink = {
      id: Date.now(), // temporary ID
      linkable_type: 'REQUISITION',
      linkable_id: Number(selectedRequisitionId.value),
      requisition: accountingStore.currentLinkedRequisition,
      role: 'SOURCE'
    }

    linkedRequisitions.value.push(newLink)
    selectedRequisitionId.value = ''

    init({
      title: 'Success',
      message: 'Requisition linked successfully',
      type: 'success'
    })
  } catch (error: any) {
    init({
      title: 'Error',
      message: error?.message || 'Failed to link requisition',
      type: 'danger'
    })
  } finally {
    savingLink.value = false
  }
}

async function unlinkRequisition(linkId: number) {
  linkedRequisitions.value = linkedRequisitions.value.filter(link => link.id !== linkId)
  init({
    title: 'Success',
    message: 'Requisition unlinked',
    type: 'success'
  })
}

async function submit() {
  if (!balanceSummary.value.is_balanced) {
    init({
      title: 'Validation Error',
      message: 'Journal voucher must be balanced (DR = CR)',
      type: 'danger'
    })
    return
  }

  saving.value = true
  try {
    const payload = {
      document_type_id: Number(form.value.document_type_id),
      currency_id: Number(form.value.currency_id),
      posting_date: form.value.posting_date,
      narration: form.value.narration,
      accounts: form.value.accounts.map(a => ({
        account_id: Number(a.account_id),
        transaction_type: a.transaction_type,
        amount: a.amount,
        exchange_rate: a.exchange_rate || 1.0
      }))
    }

    if (isEdit.value && voucherId.value) {
      await accountingStore.updateJournalVoucher(voucherId.value, payload)
      init({
        title: 'Success',
        message: 'Journal voucher updated successfully',
        type: 'success'
      })
    } else {
      await accountingStore.createJournalVoucher(payload)
      init({
        title: 'Success',
        message: 'Journal voucher created successfully',
        type: 'success'
      })
    }

    router.push({ name: 'journal-vouchers' })
  } catch (error: any) {
    init({
      title: 'Error',
      message: error.response?.data?.message || 'Error saving journal voucher',
      type: 'danger'
    })
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'journal-vouchers' })
}

function resetForm() {
  form.value = {
    document_type_id: '',
    currency_id: '',
    posting_date: new Date().toISOString().split('T')[0],
    narration: '',
    accounts: []
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    accountingStore.fetchDocumentTypes(),
    accountingStore.fetchCurrencies(),
    accountingStore.fetchAccounts(),
    accountingStore.fetchRequisitionsForLinking()
  ])

  if (isEdit.value && voucherId.value) {
    try {
      const response = await accountingStore.getJournalVoucher(voucherId.value)
      const voucher = response.data.data
      form.value = {
        document_type_id: String(voucher.document_type_id),
        currency_id: String(voucher.currency_id),
        posting_date: voucher.posting_date,
        narration: voucher.narration,
        accounts: voucher.accounts || []
      }

      // Load linked requisitions if any
      if (voucher.accounts && voucher.accounts.length > 0) {
        try {
          const linkedDocsResponse = await accountingStore.getLinkedDocumentsForVoucher(voucherId.value, voucher.accounts[0].id)
          const linkedReqs = linkedDocsResponse.data?.data?.filter((link: any) => link.linkable_type === 'REQUISITION') || []
          linkedRequisitions.value = linkedReqs
        } catch (err) {
          // Silently fail if no linked documents
        }
      }
    } catch (error) {
      init({
        title: 'Error',
        message: 'Failed to load journal voucher',
        type: 'danger'
      })
    }
  }
})
</script>

<style scoped>
/* Modern Design System Variables */
:root {
  --bg: #f5f7fa;
  --bg-secondary: #e8ecf0;
  --card: #ffffff;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --muted: #94a3b8;
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #059669;
  --success-light: #d1fae5;
  --warning: #d97706;
  --danger: #dc2626;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --radius: 12px;
  --radius-lg: 16px;
}

.ps-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.content {
  padding: 14px 16px 20px;
  max-width: 1800px;
  margin: 0 auto;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.page-head-left {
  flex: 1;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-weight: 600;
}

.crumbs span {
  font-weight: 700;
  color: var(--primary);
}

.crumb-icon {
  font-size: 14px;
}

h1 {
  margin: 6px 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
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
  border: 1px solid var(--primary);
  background: var(--card);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  color: var(--primary);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
}

.btn.btn-primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.btn-primary:hover:not(:disabled) {
  background: #1e40af;
}

.btn.secondary {
  background: #dbeafe;
  border-color: #2563eb;
  color: #1e40af;
}

.btn.secondary:hover:not(:disabled) {
  background: #bfdbfe;
}

.btn.ghost {
  background: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.btn.ghost:hover:not(:disabled) {
  background: #eff6ff;
}

.btn.full-width {
  width: 100%;
  justify-content: center;
  margin-top: 1rem;
}

/* Balance Summary */
.balance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 14px 0;
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

.summary-value.balanced {
  color: #10b981;
}

.summary-value.unbalanced {
  color: #ef4444;
}

.summary-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 1400px) {
  .grid {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 280px 1fr;
    gap: 16px;
  }
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .center-panel {
    order: -1;
  }

  .content {
    padding: 16px;
  }
}

/* Panel Base Styles */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.panel-title-text h3 {
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  font-size: 15px;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

.center-panel {
  min-height: 600px;
}

/* Form Styles */
.form {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbfc;
}

.form-section {
  background: #ffffff;
  border-radius: var(--radius);
  padding: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #dbeafe;
}

.section-icon {
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field:last-child {
  margin-bottom: 0;
}

.lbl {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
}

.req {
  color: var(--danger);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 10px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
  color: #64748b;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  padding-left: 32px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.input-wrapper.textarea-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.input-wrapper.textarea-wrapper .input-icon {
  position: absolute;
  left: 12px;
  top: 12px;
}

.input-wrapper.textarea-wrapper textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  padding-left: 38px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
  resize: vertical;
  font-family: inherit;
}

.input-wrapper.textarea-wrapper textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

/* Table Styles */
.table-responsive {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.compact-table thead {
  background: #f1f5f9;
}

.compact-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  font-size: 11px;
  text-transform: uppercase;
}

.compact-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.compact-table tbody tr:hover {
  background: #f8fafc;
}

.compact-table .form-select,
.compact-table .form-control {
  font-size: 13px;
  padding: 4px 8px;
}

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-radius: 6px;
  text-align: center;
}

.type-badge.badge-debit {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.type-badge.badge-credit {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.text-center {
  text-align: center;
}

.text-end {
  text-align: right;
}

.remove-btn {
  color: #ef4444;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Linked Items */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.section-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 11px;
  font-size: 11px;
  font-weight: 700;
}

.linked-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.linked-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #d1fae5;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.linked-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.linked-item-icon {
  font-size: 20px;
}

.linked-item-title {
  font-weight: 600;
  color: #065f46;
  font-size: 13px;
}

.linked-item-meta {
  font-size: 11px;
  color: #047857;
  margin-top: 2px;
}

.btn-add-section {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-section:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.mt-4 {
  margin-top: 16px;
}

/* Responsive */
.mx-3 {
  margin-left: 1rem !important;
  margin-right: 1rem !important;
}

.me-1 {
  margin-right: 0.25rem !important;
}

.alert {
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 4px solid;
  margin-bottom: 0;
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
</style>
