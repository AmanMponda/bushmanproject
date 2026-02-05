<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-file-invoice"></i></span>
            ACCOUNTING / <span>{{ isEdit ? 'EDIT' : 'CREATE' }}</span>
          </div>
          <h1>{{ isEdit ? 'Edit Invoice' : 'Create Invoice' }}</h1>
          <p class="subtitle">{{ isEdit ? 'Update invoice details and line items' : 'Create a new invoice with line items and tax' }}</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="goBack">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn ghost" type="button" @click="resetForm">
            <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
          </button>
          <button 
            v-if="isEdit && invoice?.status === 'APPROVED' && !invoice?.journal_voucher_id"
            class="btn primary" 
            type="button" 
            @click="createJournalVoucher"
            :disabled="savingJV"
          >
            <span class="btn-icon"><i class="fa fa-file-alt"></i></span> {{ savingJV ? 'Creating JV...' : 'Create Journal Voucher' }}
          </button>
          <button 
            v-if="isEdit && invoice?.journal_voucher_id"
            class="btn success" 
            type="button" 
            @click="viewJournalVoucher"
            disabled
          >
            <span class="btn-icon"><i class="fa fa-check"></i></span> JV Created (#{{ invoice.journal_voucher_id }})
          </button>
          <button class="btn secondary" type="button" @click="submit" :disabled="saving">
            <span class="btn-icon"><i class="fa fa-save"></i></span> {{ saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice' }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Invoice Summary -->
      <div v-if="invoiceSummary" class="balance-summary">
        <div class="summary-item">
          <div class="summary-label">Subtotal</div>
          <div class="summary-value">{{ formatCurrency(invoiceSummary.subtotal) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Tax</div>
          <div class="summary-value">{{ formatCurrency(invoiceSummary.tax) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total</div>
          <div class="summary-value total">{{ formatCurrency(invoiceSummary.total) }}</div>
        </div>
      </div>

      <!-- 2-Column Grid Layout -->
      <section class="grid">
        <!-- LEFT PANEL: Invoice Details -->
        <aside class="panel left-panel">
          <div class="form">
            <!-- SECTION 1: SOURCE -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-link"></i></span>
                Source
              </div>

              <label class="field">
                <span class="lbl">Select Requisition (Optional)</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-file-text"></i></span>
                  <select v-model="selectedRequisitionId" @change="onRequisitionSelect">
                    <option value="">-- None --</option>
                    <option v-for="req in requisitionsForLinking" :key="req.id" :value="String(req.id)">
                      {{ req.requisition_number || `REQ-${req.id}` }} - {{ req.requisition_type?.name }}
                    </option>
                  </select>
                </div>
              </label>
            </div>

            <!-- SECTION 2: BASIC INFO -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-info-circle"></i></span>
                Basic Info
              </div>

              <label class="field">
                <span class="lbl">Invoice Type <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-exchange-alt"></i></span>
                  <select v-model="form.invoice_type" required :disabled="isFormDisabled">
                    <option value="AR">AR - Accounts Receivable</option>
                    <option value="AP">AP - Accounts Payable</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Entity (Customer/Supplier) <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-users"></i></span>
                  <select v-model="form.entity_id" required :disabled="isFormDisabled">
                    <option value="">-- Select Entity --</option>
                    <option v-for="entity in entities" :key="entity.id" :value="String(entity.id)">
                      {{ entity.full_name || entity.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Invoice Date <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input v-model="form.invoice_date" type="date" required :disabled="isFormDisabled" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Due Date <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input v-model="form.due_date" type="date" required :disabled="isFormDisabled" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Currency <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-dollar"></i></span>
                  <select v-model="form.currency_id" required :disabled="isFormDisabled">
                    <option value="">-- Select Currency --</option>
                    <option v-for="currency in currencies" :key="currency.id" :value="String(currency.id)">
                      {{ currency.code }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Exchange Rate</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-percentage"></i></span>
                  <input 
                    v-model.number="form.exchange_rate_to_base" 
                    type="number" 
                    step="0.000001"
                    min="0"
                    readonly
                    :disabled="isFormDisabled" 
                    placeholder="1.000000"
                  />
                </div>
              </label>
            </div>

            <!-- SECTION 5: NOTES -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-align-left"></i></span>
                Notes
              </div>

              <label class="field">
                <span class="lbl">Memo</span>
                <div class="input-wrapper textarea-wrapper">
                  <span class="input-icon"><i class="fa fa-align-left"></i></span>
                  <textarea 
                    v-model="form.memo" 
                    rows="3"
                    placeholder="Additional notes"
                    :disabled="isFormDisabled"
                  ></textarea>
                </div>
              </label>
            </div>
          </div>
        </aside>

        <!-- RIGHT PANEL: Line Items -->
        <section class="panel center-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-list-alt"></i></div>
            <div class="panel-title-text">
              <h3>Line Items</h3>
              <p>Invoice items and amounts</p>
            </div>
            <button class="btn btn-primary btn-sm ms-auto" @click="addLineItem" v-if="!isAddingNewLine && !isFormDisabled" :disabled="isFormDisabled">
              <i class="fa fa-plus"></i> Add Item
            </button>
          </div>

          <!-- Line Items Table with Inline Adding -->
          <div class="line-items-container">
            <!-- No Items Empty State -->
            <div v-if="form.line_items.length === 0 && !isAddingNewLine" class="empty-state">
              <i class="fa fa-inbox"></i>
              <p>No items added yet</p>
              <small>Click "Add Item" to start</small>
            </div>

            <!-- Items List as Cards -->
            <div v-if="form.line_items.length > 0" class="items-list">
              <div v-for="(item, index) in form.line_items" :key="index" class="item-card">
                <div class="item-card-header">
                  <span class="item-number">#{{ index + 1 }}</span>
                  <button 
                    type="button" 
                    class="btn-delete" 
                    @click="removeLineItem(index)" 
                    :disabled="isFormDisabled" 
                    title="Delete"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
                <div class="item-card-body">
                  <div class="item-field">
                    <label>Description</label>
                    <div class="item-value">{{ item.description }}</div>
                  </div>
                  <div class="item-row-fields">
                    <div class="item-field">
                      <label>Quantity</label>
                      <div class="item-value">{{ item.quantity }}</div>
                    </div>
                    <div class="item-field">
                      <label>Unit Price</label>
                      <div class="item-value">{{ formatCurrency(item.unit_price) }}</div>
                    </div>
                    <div class="item-field">
                      <label>Tax Rate</label>
                      <div class="item-value">{{ item.tax_rate || 0 }}%</div>
                    </div>
                    <div class="item-field">
                      <label>Amount</label>
                      <div class="item-value amount">{{ formatCurrency(calculateLineAmount(item)) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add New Item Form (Inline) -->
            <div v-if="isAddingNewLine" class="add-item-form">
              <div class="form-row">
                <div class="form-group" style="flex: 2">
                  <label>Description <span class="req">*</span></label>
                  <input 
                    v-model="newLine.description" 
                    type="text" 
                    placeholder="Item description" 
                    class="form-input"
                    required 
                  />
                </div>
                <div class="form-group">
                  <label>Qty <span class="req">*</span></label>
                  <input 
                    v-model.number="newLine.quantity" 
                    type="number" 
                    step="0.01" 
                    placeholder="1" 
                    class="form-input"
                    required 
                  />
                </div>
                <div class="form-group">
                  <label>Price <span class="req">*</span></label>
                  <input 
                    v-model.number="newLine.unit_price" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    class="form-input"
                    required 
                  />
                </div>
                <div class="form-group">
                  <label>Tax %</label>
                  <input 
                    v-model.number="newLine.tax_rate" 
                    type="number" 
                    step="0.01" 
                    placeholder="0" 
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-success" @click="confirmAddLineItem">
                  <i class="fa fa-check"></i> Add
                </button>
                <button class="btn btn-secondary" @click="cancelAddLineItem">
                  <i class="fa fa-times"></i> Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 4: SUMMARY (readonly) -->
          <div v-if="form.line_items.length > 0" class="items-summary">
            <div class="summary-header">Summary</div>
            <div class="summary-row">
              <span>Subtotal:</span>
              <strong>{{ formatCurrency(invoiceSummary?.subtotal || 0) }}</strong>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <strong>{{ formatCurrency(invoiceSummary?.tax || 0) }}</strong>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <strong>{{ formatCurrency(invoiceSummary?.total || 0) }}</strong>
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
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()

const isEdit = computed(() => !!route.params.id)
const invoiceId = computed(() => route.params.id ? Number(route.params.id) : null)

const saving = ref(false)
const savingLink = ref(false)
const savingJV = ref(false)
const errorMessage = ref('')
const invoice = ref<any>(null)  // To store loaded invoice
const isAddingNewLine = ref(false)

// Computed property to check if form should be disabled
const isFormDisabled = computed(() => {
  return isEdit.value && invoice.value && invoice.value.status !== 'DRAFT'
})

// Requisition Linking
const selectedRequisitionId = ref('')
const linkedRequisitions = ref([] as any[])

// Form Data
const form = ref({
  entity_id: '',
  invoice_type: 'AR', // AR = Accounts Receivable, AP = Accounts Payable
  currency_id: '',
  exchange_rate_to_base: 1.0,
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  memo: '',
  line_items: [] as any[]
})

// New Line Input
const newLine = ref({
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 0
})

// Reference Data
const currencies = computed(() => accountingStore.currencies)
const entities = computed(() => accountingStore.entities)
const requisitionsForLinking = computed(() => accountingStore.requisitionsForLinking)

// Invoice Summary
const invoiceSummary = computed(() => {
  const subtotal = form.value.line_items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price)
  }, 0)

  const tax = form.value.line_items.reduce((sum, item) => {
    const lineAmount = item.quantity * item.unit_price
    return sum + (lineAmount * (item.tax_rate || 0) / 100)
  }, 0)

  return {
    subtotal,
    tax,
    total: subtotal + tax
  }
})

// Methods
function calculateLineAmount(item: any): number {
  const subtotal = item.quantity * item.unit_price
  const tax = subtotal * (item.tax_rate || 0) / 100
  return subtotal + tax
}

function addLineItem() {
  isAddingNewLine.value = true
}

function confirmAddLineItem() {
  if (!newLine.value.description || !newLine.value.quantity || newLine.value.unit_price === undefined) {
    init({ message: 'Validation Error: Please fill all required fields (Description, Quantity, Price)', color: 'warning' })
    return
  }

  form.value.line_items.push({
    ...newLine.value
  })

  // Reset form
  newLine.value = {
    description: '',
    quantity: 1,
    unit_price: 0,
    tax_rate: 0
  }
  
  isAddingNewLine.value = false
  
  init({
    title: 'Success',
    message: 'Line item added',
    type: 'success'
  })
}

function cancelAddLineItem() {
  newLine.value = {
    description: '',
    quantity: 1,
    unit_price: 0,
    tax_rate: 0
  }
  isAddingNewLine.value = false
}

function removeLineItem(index: number) {
  form.value.line_items.splice(index, 1)
}

// Requisition Linking Methods
async function onRequisitionSelect() {
  if (!selectedRequisitionId.value) {
    form.value.line_items = []
    return
  }
  
  try {
    const response = await accountingStore.getRequisitionDetails(Number(selectedRequisitionId.value))
    const requisition = response?.data?.data || response?.data || accountingStore.currentLinkedRequisition// Debug
    
    // Try different possible paths for items
    const items = requisition?.requisition_items || requisition?.items || requisition?.requisitionItems || []// Debug
    
    if (items && items.length > 0) {
      // Auto-populate line items from requisition
      form.value.line_items = items.map((reqItem: any) => { // Debug full item structure
        
        // Check if item has materials or accounts
        const hasMaterials = reqItem.materials && reqItem.materials.length > 0
        const hasAccounts = reqItem.accounts && reqItem.accounts.length > 0
        
        let description = 'Item'
        let quantity = 1
        let unit_price = 0
        let tax_rate = 0
        
        if (hasMaterials) {
          // Get data from first material
          const material = reqItem.materials[0]
          description = material.item?.name || material.description || 'Item'
          quantity = parseFloat(material.quantity) || 1
          unit_price = parseFloat(material.rate) || 0
        } else if (hasAccounts) {
          // Get data from first account
          const account = reqItem.accounts[0]
          description = account.account?.name || account.description || 'Account Item'
          quantity = 1
          unit_price = parseFloat(account.amount) || 0
        }
        
        // Try to get tax rate
        tax_rate = reqItem.tax_rate || 
                  reqItem.taxRate ||
                  reqItem.tax ||
                  reqItem.vat_rate ||
                  reqItem.vatRate ||
                  0// Debug extracted values
        
        return {
          description,
          quantity,
          unit_price,
          tax_rate
        }
      })// Debug result
      
      init({ 
        message: `Success: ${items.length} line items loaded from requisition`, 
        color: 'success' 
      })
    } else {
      form.value.line_items = []
      init({ 
        message: 'Info: Selected requisition has no line items', 
        color: 'info' 
      })
    }
  } catch (error: any) {
    console.error('Error loading requisition:', error) // Debug
    init({
      message: 'Error: ' + (error.response?.data?.message || error.message || 'Failed to load requisition details'),
      color: 'danger'
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
  if (form.value.line_items.length === 0) {
    init({
      title: 'Validation Error',
      message: 'Please add at least one line item',
      type: 'danger'
    })
    return
  }

  saving.value = true
  try {
    const payload = {
      entity_id: Number(form.value.entity_id),
      invoice_type: form.value.invoice_type,
      currency_id: Number(form.value.currency_id),
      exchange_rate_to_base: form.value.exchange_rate_to_base,
      invoice_date: form.value.invoice_date,
      due_date: form.value.due_date,
      description: form.value.memo,
      line_items: form.value.line_items.map((item, index) => ({
        line_no: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0
      }))
    }

    if (isEdit.value && invoiceId.value) {
      await accountingStore.updateInvoice(invoiceId.value, payload)
      init({
        title: 'Success',
        message: 'Invoice updated successfully',
        type: 'success'
      })
    } else {
      await accountingStore.createInvoice(payload)
      init({
        title: 'Success',
        message: 'Invoice created successfully',
        type: 'success'
      })
    }

    router.push({ name: 'invoices' })
  } catch (error: any) {
    init({
      title: 'Error',
      message: error.response?.data?.message || 'Error saving invoice',
      type: 'danger'
    })
  } finally {
    saving.value = false
  }
}

// Create Journal Voucher from Invoice
async function createJournalVoucher() {
  if (!invoice.value) {
    init({
      title: 'Error',
      message: 'Invoice data not found',
      type: 'danger'
    })
    return
  }

  if (invoice.value.status !== 'APPROVED') {
    init({
      title: 'Error',
      message: 'Invoice must be APPROVED to create a journal voucher',
      type: 'danger'
    })
    return
  }

  const confirmResult = await Swal.fire({
    title: 'Create Journal Voucher?',
    text: `Create a journal voucher for invoice ${invoice.value.document_number}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Create JV'
  })

  if (!confirmResult.isConfirmed) {
    return
  }

  savingJV.value = true
  try {const response = await accountingStore.createJournalVoucherFromInvoice(
      invoice.value.id,
      {
        posting_date: new Date().toISOString().split('T')[0],
        narration: `Journal Voucher from Invoice ${invoice.value.document_number}`
      }
    )

    const createdJV = response.data.data || response.data// Update invoice with journal_voucher_id
    invoice.value.journal_voucher_id = createdJV.id
    
    init({
      title: 'Success',
      message: `Journal Voucher #${createdJV.document_number || createdJV.id} created successfully`,
      type: 'success'
    })

    // Optionally navigate to JV after a delay
    setTimeout(() => {
      router.push({ name: 'journal-voucher-view', params: { id: createdJV.id } })
    }, 1500)
  } catch (error: any) {
    console.error('Error creating JV:', error)
    init({
      title: 'Error',
      message: error?.response?.data?.message || 'Failed to create journal voucher',
      type: 'danger'
    })
  } finally {
    savingJV.value = false
  }
}

function viewJournalVoucher() {
  if (invoice.value?.journal_voucher_id) {
    router.push({ name: 'journal-voucher-view', params: { id: invoice.value.journal_voucher_id } })
  }
}

function goBack() {
  router.push({ name: 'invoices' })
}

function resetForm() {
  form.value = {
    entity_id: '',
    invoice_type: 'AR',
    currency_id: '',
    exchange_rate_to_base: 1.0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    memo: '',
    line_items: []
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Watch invoice type to auto-set party role
// Lifecycle
onMounted(async () => {
  await Promise.all([
    accountingStore.fetchCurrencies(),
    accountingStore.fetchEntities(),
    accountingStore.fetchRequisitionsForLinking()
  ])

  if (isEdit.value && invoiceId.value) {
    try {
      const response = await accountingStore.getInvoice(invoiceId.value)
      const invoiceData = response.data.data
      invoice.value = invoiceData  // Store the full invoice
      form.value = {
        entity_id: String(invoiceData.entity_id),
        invoice_type: invoiceData.invoice_type || 'AR',
        currency_id: String(invoiceData.currency_id),
        exchange_rate_to_base: invoiceData.exchange_rate_to_base || 1.0,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        memo: invoiceData.description || invoiceData.memo || '',
        line_items: invoiceData.line_items || []
      }
    } catch (error) {
      init({
        title: 'Error',
        message: 'Failed to load invoice',
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

.summary-value.total {
  color: #059669;
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

.fade {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* LINE ITEMS STYLES */
.line-items-container {
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-state i {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
  opacity: 0.6;
}

.empty-state p {
  margin: 8px 0;
  font-weight: 600;
}

.empty-state small {
  font-size: 12px;
  color: #cbd5e1;
}

/* Items List Cards */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.item-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.item-number {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-delete {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-delete:hover:not(:disabled) {
  color: #dc2626;
  background: #fee2e2;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-card-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-field label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-field .item-value {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.item-field .item-value.amount {
  color: #2563eb;
  font-weight: 700;
  font-size: 15px;
  background: #dbeafe;
  border-color: #bfdbfe;
}

.item-row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.2fr;
  gap: 12px;
}

.btn-icon {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  transition: color 0.2s ease;
}

.btn-icon:hover {
  color: #dc2626;
}

.add-item-form {
  background: white;
  border: 2px dashed #2563eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-success,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.items-summary {
  padding: 16px;
  background: white;
  border-top: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-header {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding-top: 12px;
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
}

.summary-row.total span {
  color: #0f172a;
  font-weight: 600;
}

.summary-row.total strong {
  color: #059669;
  font-size: 16px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
}

.ms-auto {
  margin-left: auto;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
