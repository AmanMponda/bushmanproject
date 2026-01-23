<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0 20px; margin-bottom: 20px;">
        <div class="page-head-left">
          <h1>New Voucher</h1>
        </div>
        <div class="page-head-right" style="display: flex; gap: 12px;">
          <button 
            type="button" 
            @click="$router.push({ name: 'journal-vouchers' })"
            style="background: white; border: 2px solid #2563eb; color: #2563eb; cursor: pointer; font-size: 14px; font-weight: 500; padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
            @mouseover="$event.currentTarget.style.background = '#eff6ff'; $event.currentTarget.style.borderColor = '#1d4ed8'; $event.currentTarget.style.color = '#1d4ed8'"
            @mouseout="$event.currentTarget.style.background = 'white'; $event.currentTarget.style.borderColor = '#2563eb'; $event.currentTarget.style.color = '#2563eb'"
          >
            <i class="fa fa-arrow-left"></i> Back to Vouchers
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; background: #f9fafb; padding: 0 20px;">
        <button 
          type="button" 
          @click="voucherTab = 'payment'"
          :style="{ borderBottom: voucherTab === 'payment' ? '3px solid #2563eb' : 'none', color: voucherTab === 'payment' ? '#2563eb' : '#6b7280' }"
          style="padding: 12px 20px; font-weight: 500; cursor: pointer; border: none; background: none; transition: all 0.2s;"
        >
          Payment
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Payment Tab Content -->
      <div v-show="voucherTab === 'payment'" style="padding: 24px;">

      <!-- Full-width layout -->
      <section>
      
        <!-- PAYMENT TAB FORM -->
        <div style="padding: 24px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 100%;">
          <!-- Header Row 1: Voucher No, Branch/Depot, Voucher Date -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Voucher No. <span style="color: #dc2626;">*</span></label>
              <select v-model="form.voucher_number" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                <option value="">-- Select --</option>
                <option value="AUTO">AUTO</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Branch/Depot <span style="color: #dc2626;">*</span></label>
              <select v-model="form.branch_id" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                <option value="">-- Select --</option>
                <option v-for="branch in branches" :key="branch.id" :value="String(branch.id)">{{ branch.name }}</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Voucher Date <span style="color: #dc2626;">*</span></label>
              <input v-model="form.posting_date" type="date" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
            </div>
          </div>

          <!-- Header Row 2: Branch, Currency, Exchange Rate -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Branch</label>
              <input v-model="form.branch_name" type="text" placeholder="Branch name" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Currency <span style="color: #dc2626;">*</span></label>
              <select v-model="form.currency_id" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                <option value="">-- Select --</option>
                <option v-for="currency in currencies" :key="currency.id" :value="String(currency.id)">{{ currency.name }} ({{ currency.code }})</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Exchange Rate</label>
              <input v-model.number="form.exchange_rate" type="number" step="0.01" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
            </div>
          </div>

          <!-- Remarks -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px;">Remarks</label>
            <textarea v-model="form.narration" placeholder="Narration, purpose, or reference" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 80px;" ></textarea>
          </div>

          <!-- PAYMENT FROM / TO Section -->
          <div style="background: #f0f0f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              
              <!-- FROM (Credit) Section -->
              <div>
                <h6 style="margin: 0 0 16px 0; font-weight: 600; color: #1f2937;">From (Credit) <span style="color: #dc2626;">*</span></h6>
                
                <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">From Account <span style="color: #dc2626;">*</span></label>
                  <select v-model="form.from_account_id" @change="onFromAccountChange" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                    <option value="">-- Select --</option>
                    <option v-for="account in bankCashAccounts" :key="account.id" :value="String(account.id)">{{ account.code }} - {{ account.name }}</option>
                  </select>
                </div>

                <div>
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Payment Method <span style="color: #dc2626;">*</span></label>
                  <select v-model="form.payment_method" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                    <option value="">-- Select --</option>
                    <option v-for="method in paymentMethods" :key="method" :value="method">{{ method }}</option>
                  </select>
                </div>
              </div>

              <!-- TO (Debit) Section -->
              <div>
                <h6 style="margin: 0 0 16px 0; font-weight: 600; color: #1f2937;">To (Debit) <span style="color: #dc2626;">*</span></h6>
                
                <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Payee <span style="color: #dc2626;">*</span></label>
                  <select v-model="form.payee_id" @change="onPayeeChange" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                    <option value="">-- Select --</option>
                    <option v-for="payee in payees" :key="payee.id" :value="String(payee.id)">{{ payee.name }}</option>
                  </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Account</label>
                    <input v-model="form.payee_account" type="text" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;" />
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Total Amount</label>
                    <input v-model.number="form.total_amount" type="number" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;" />
                  </div>
                </div>

                <div style="margin-top: 12px;">
                  <button type="button" @click="fetchEligibleRequisitions" :disabled="loadingRequisitions || !form.payee_id" :style="{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', opacity: loadingRequisitions || !form.payee_id ? 0.6 : 1, transition: 'opacity 0.2s' }">
                    <i :class="['fa', loadingRequisitions ? 'fa-spinner fa-spin' : 'fa-search']" style="margin-right: 6px;"></i> {{ loadingRequisitions ? 'Loading...' : 'Fetch Eligible Requisitions' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- PAYEE DETAILS Section -->
          <div style="margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h6 style="margin: 0; font-weight: 600; color: #1f2937; font-size: 15px;">PAYEE DETAILS</h6>
              <button type="button" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
                <i class="fa fa-list me-2"></i>Details
              </button>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 12px;">Showing Approved Direct Payment requisitions for selected From and To accounts</p>
            
            <div style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 6px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead style="background: #f3f4f6; border-bottom: 1px solid #d1d5db;">
                  <tr>
                    <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #e5e7eb;">No.</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #e5e7eb;">Requisition #</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #e5e7eb;">Description</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #e5e7eb;">Cost Center</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #e5e7eb;">Approved Amount</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #e5e7eb;">Amount to Pay</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #e5e7eb;">Balance Remaining</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="payeeRequisitions.length === 0" style="border-bottom: 1px solid #e5e7eb;">
                    <td colspan="7" style="padding: 24px; text-align: center; color: #9ca3af;">No requisitions available</td>
                  </tr>
                  <tr v-for="(req, idx) in payeeRequisitions" :key="idx" style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb;">{{ idx + 1 }}</td>
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb;"><strong>{{ req.requisition_number }}</strong></td>
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb;">{{ req.description }}</td>
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb;">
                      <span style="background: #bfdbfe; color: #1e40af; padding: 4px 8px; border-radius: 3px; font-size: 11px; font-weight: 500;">{{ req.cost_center }}</span>
                    </td>
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb; text-align: right;">{{ formatCurrency(req.total_amount || 0) }}</td>
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb; text-align: right;">
                      <input 
                        v-model.number="req.amount_to_pay" 
                        @input="onAmountToPay(idx)"
                        type="number" 
                        step="0.01"
                        :max="req.total_amount"
                        :min="0"
                        style="width: 120px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; text-align: right;" 
                      />
                    </td>
                    <td style="padding: 12px; border-right: 1px solid #e5e7eb; text-align: right;">{{ formatCurrency((req.balance_remaining || req.total_amount) - (req.amount_to_pay || 0)) }}</td>
                    <td style="padding: 12px; text-align: center;">
                      <button type="button" @click="removePayeeRequisition(idx)" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Total Amount Summary -->
            <div style="display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 12px; border-top: 2px solid #d1d5db;">
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 6px; padding: 16px 24px; text-align: right;">
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Total Amount to Pay</div>
                <div style="font-size: 24px; font-weight: 700; color: #059669;">{{ formatCurrency(totalAmountToPay) }}</div>
              </div>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <button type="button" @click="saveDraft" style="padding: 10px 24px; background: white; border: 1px solid #d1d5db; border-radius: 6px; font-weight: 500; cursor: pointer;">
              <i class="fa fa-save me-2"></i> Save Draft
            </button>
            <button type="button" @click="() => postVoucher()" style="padding: 10px 24px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
              <i class="fa fa-check me-2"></i> Post
            </button>
            <button type="button" @click="closeForm" style="padding: 10px 24px; background: white; border: 1px solid #d1d5db; border-radius: 6px; font-weight: 500; cursor: pointer;">
              <i class="fa fa-times me-2"></i> Close
            </button>
          </div>
        </div>
      </section>
      </div>
    </main>

    <!-- Requisition Search Modal -->
    <div v-if="showRequisitionModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
        <!-- Modal Header -->
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Select Requisition</h2>
          <button 
            @click="showRequisitionModal = false" 
            style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;"
          >
            <i class="fa fa-times"></i>
          </button>
        </div>

        <!-- Modal Body - Search and Results -->
        <div style="padding: 20px; overflow-y: auto; flex: 1;">
          <!-- Search Input -->
          <label style="display: block; margin-bottom: 16px;">
            <span style="display: block; font-weight: 500; margin-bottom: 6px;">Search Requisitions</span>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;"><i class="fa fa-search"></i></span>
              <input 
                v-model="requisitionSearchQuery" 
                @input="searchRequisitions"
                type="text"
                placeholder="Search by REQ #, date, or status..."
                style="width: 100%; padding: 10px 10px 10px 36px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
              />
            </div>
          </label>

          <!-- Loading State -->
          <div v-if="searchingRequisitions" style="text-align: center; padding: 32px;">
            <i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #2563eb;"></i>
            <p style="margin-top: 12px; color: #6b7280;">Searching...</p>
          </div>

          <!-- Results List -->
          <div v-else-if="filteredRequisitions.length > 0" style="display: grid; gap: 12px;">
            <div 
              v-for="req in filteredRequisitions"
              :key="req.id"
              @click="selectRequisitionFromSearch(req)"
              :style="{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }"
              @mouseover="($event.currentTarget as HTMLElement).style.background = '#f3f4f6'; ($event.currentTarget as HTMLElement).style.borderColor = '#2563eb';"
              @mouseout="($event.currentTarget as HTMLElement).style.background = 'white'; ($event.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';"
            >
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #1e40af;">{{ `REQ-${String(req.id).padStart(4, '0')}` }}</span>
                <span style="font-size: 12px; color: #6b7280;">{{ req.date?.split('T')[0] }}</span>
              </div>
              <div style="display: flex; gap: 12px; font-size: 13px; color: #6b7280;">
                <span>{{ req.requisition_type?.name || 'N/A' }}</span>
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 3px;">{{ req.status }}</span>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else style="text-align: center; padding: 32px; color: #6b7280;">
            <i class="fa fa-inbox" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
            <p>{{ requisitionSearchQuery ? 'No requisitions found' : 'Enter a search term to find requisitions' }}</p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div style="padding: 16px; border-top: 1px solid #e5e7eb; text-align: right;">
          <button 
            @click="showRequisitionModal = false"
            :style="{ padding: '8px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }"
            @mouseover="($event.target as HTMLElement).style.background = '#d1d5db'"
            @mouseout="($event.target as HTMLElement).style.background = '#e5e7eb'"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()
const appOptionStore = useAppOptionStore()

const isEdit = computed(() => !!route.params.id)
const voucherId = computed(() => route.params.id ? Number(route.params.id) : null)

const saving = ref(false)
const savingLink = ref(false)
const loadingRequisitions = ref(false)
const errorMessage = ref('')
const originalSidebarState = ref(false)
const sidebarMinifiedForCreate = ref(false)
const activeTab = ref('source')

// Voucher Tab State
const voucherTab = ref('payment')

// Workflow State
const sourceDocumentType = ref('')  // Step 1: REQUISITION, ORDER, CONTRACT, INVOICE, etc

// Form Data
const form = ref({
  document_type_id: '',
  currency_id: '',
  document_number: '',
  posting_date: new Date().toISOString().split('T')[0],
  reference_no: '',
  control_number: '',
  primary_account_id: '',
  exchange_rate: 1.0,
  status: 'DRAFT',
  narration: '',
  accounts: [] as any[],
  payments: [] as any[],
  
  // Payment Voucher Fields
  voucher_number: 'AUTO',
  branch_id: '',
  branch_name: '',
  from_account_id: '',
  payment_method: '',
  payee_id: '',
  payee_account: '',
  payee_account_id: null,
  payee_account_code: '',
  total_amount: 0
})

// Payee Requisitions
const payeeRequisitions = ref<any[]>([])

// Selected Requisitions (from Search Modal)
const selectedRequisitions = ref<any[]>([])

// Single Selected Requisition (for linking)
const selectedRequisition = ref<any>(null)

// Requisition Search
const showRequisitionModal = ref(false)
const showRequisitionDropdown = ref(false)
const requisitionSearchQuery = ref('')
const filteredRequisitions = ref<any[]>([])
const searchingRequisitions = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Invoice Search
const selectedInvoice = ref<any>(null)
const invoiceSearchQuery = ref('')
const filteredInvoices = ref<any[]>([])
const searchingInvoices = ref(false)
const showInvoiceDropdown = ref(false)
let invoiceSearchTimeout: ReturnType<typeof setTimeout> | null = null

// Linked Requisitions (for tracking linked items)
const linkedRequisitions = ref<any[]>([])

// Editing Account Lines (for inline form rows)
const editingAccountLines = ref<any[]>([])

// New Payment Input
const newPayment = ref({
  bank_account_id: '',
  instrument_type: '',
  instrument_number: '',
  instrument_date: '',
  amount: 0,
  payee: '',
  currency_id: ''
})

// Reference Data
const documentTypes = computed(() => accountingStore.documentTypes)
const currencies = computed(() => accountingStore.currencies)
const accounts = computed(() => accountingStore.accounts)
const requisitionsForLinking = computed(() => accountingStore.requisitionsForLinking)

// Payment Voucher Reference Data (from API)
const branches = ref<any[]>([])
const bankCashAccounts = ref<any[]>([])
const payees = ref<any[]>([])
const paymentMethods = ref<string[]>(['Bank', 'Cash', 'Cheque', 'Wire Transfer', 'Deposit', 'Mobile Money'])

// Balance Summary
const balanceSummary = computed(() => {
  const debits = form.value.accounts
    .filter(a => a.transaction_type === 'DR' || a.transaction_type === 'DEBIT')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const credits = form.value.accounts
    .filter(a => a.transaction_type === 'CR' || a.transaction_type === 'CREDIT')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const difference = debits - credits
  
  return {
    total_debit: debits,
    total_credit: credits,
    difference: difference,
    is_balanced: Math.abs(difference) < 0.01
  }
})

// Total Amount (sum of all lines)
const totalAmount = computed(() => {
  return form.value.accounts.reduce((sum, a) => sum + (a.amount || 0), 0)
})

// Total Amount to Pay (sum of all amount_to_pay in payee requisitions)
const totalAmountToPay = computed(() => {
  return payeeRequisitions.value.reduce((sum, r) => sum + (r.amount_to_pay || 0), 0)
})

// Methods

// Add new account line form row
function addNewAccountLine() {
  editingAccountLines.value.push({
    account_id: '',
    transaction_type: '',
    amount: 0,
    exchange_rate: 1.0
  })
}

// Confirm and add account line from editing row
function addAccountLine(idx: number) {
  const editLine = editingAccountLines.value[idx]
  
  if (!editLine.account_id || !editLine.transaction_type || !editLine.amount) {
    init({
      message: 'Please fill all required fields (Account, Type, Amount)',
      color: 'warning'
    })
    return
  }

  const selectedAccount = accounts.value.find((a: any) => String(a.id) === editLine.account_id)
  
  // Add to confirmed accounts array
  form.value.accounts.push({
    account_id: editLine.account_id,
    account_code: selectedAccount?.code,
    account_name: selectedAccount?.name,
    transaction_type: editLine.transaction_type,
    amount: editLine.amount,
    exchange_rate: editLine.exchange_rate || 1.0
  })

  // Remove from editing array
  editingAccountLines.value.splice(idx, 1)
  
  init({
    message: 'Account line added',
    color: 'success'
  })
}

// Cancel editing line without saving
function cancelEditingAccountLine(idx: number) {
  editingAccountLines.value.splice(idx, 1)
}

function removeLine(index: number) {
  form.value.accounts.splice(index, 1)
}

function addPayment() {
  if (!newPayment.value.instrument_type || !newPayment.value.amount) {
    init({
      message: 'Please fill required payment fields',
      color: 'warning'
    })
    return
  }

  form.value.payments.push({
    instrument_type: newPayment.value.instrument_type,
    instrument_number: newPayment.value.instrument_number || '',
    instrument_date: newPayment.value.instrument_date || '',
    payee: newPayment.value.payee || '',
    amount: newPayment.value.amount,
    currency_id: form.value.currency_id
  })

  // Reset form
  newPayment.value = {
    bank_account_id: '',
    instrument_type: '',
    instrument_number: '',
    instrument_date: '',
    amount: 0,
    payee: '',
    currency_id: ''
  }

  init({
    message: 'Payment details added',
    color: 'success'
  })
}

function removePayment(index: number) {
  form.value.payments.splice(index, 1)
}


// Search Requisitions
function searchRequisitions() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!requisitionSearchQuery.value.trim()) {
    filteredRequisitions.value = []
    return
  }

  searchTimeout = setTimeout(() => {
    searchingRequisitions.value = true
    try {
      // Use local search from store data
      const rawReqs = requisitionsForLinking.value || []
      const searchLower = requisitionSearchQuery.value.toLowerCase().trim()
      
      console.log('Searching requisitions:', {
        query: searchLower,
        totalAvailable: rawReqs.length,
        rawReqs: rawReqs
      })
      
      if (!rawReqs || rawReqs.length === 0) {
        console.warn('No requisitions available in store')
        filteredRequisitions.value = []
        searchingRequisitions.value = false
        return
      }
      
    const allReqs = rawReqs.filter((req: any) => req && req.status === 'APPROVED')
      
      // Generate requisition number format (REQ-0003) from ID
      const formatReqNumber = (id: number) => `REQ-${String(id).padStart(4, '0')}`
      
      // Search: REQ number (formatted), date, status, type, amount, requisition_number
      const results = allReqs
        .filter((req: any) => {
          const searchableText = [
            formatReqNumber(req.id),
            String(req.date || ''),
            String(req.status || ''),
            String(req.requisition_type?.name || ''),
            String(req.total_amount || ''),
            String(req.requisition_number || '')
          ]
            .map(v => v.toLowerCase())
            .join(' ')
          
          const matches = searchableText.includes(searchLower)
          if (matches) {
            console.log('Match found:', {
              id: req.id,
              reqNumber: formatReqNumber(req.id),
              searchableText
            })
          }
          return matches
        })
        .slice(0, 10)
      
      console.log('Search results:', results)
      filteredRequisitions.value = results
    } catch (error) {
      console.error('Search error:', error)
      filteredRequisitions.value = []
    } finally {
      searchingRequisitions.value = false
    }
  }, 300) // Debounce 300ms
}

function selectSingleRequisition(requisition: any) {
  console.log('Selecting requisition:', requisition)
  
  // Check if already selected
  if (selectedRequisitions.value.some(req => req.id === requisition.id)) {
    init({
      message: `REQ-${String(requisition.id).padStart(4, '0')} is already selected`,
      color: 'info'
    })
    return
  }
  
  nextTick(async () => {
    requisitionSearchQuery.value = ''
    filteredRequisitions.value = []
    showRequisitionDropdown.value = false
    console.log('Requisition selected')
    
    // Fetch full requisition details and auto-populate form
    await fetchFullRequisitionAndPopulate(requisition.id)
  })
}

// Fetch full requisition details from API
async function fetchFullRequisitionAndPopulate(requisitionId: number) {
  try {
    savingLink.value = true
    console.log('Fetching full requisition details for ID:', requisitionId)
    
    const response = await accountingStore.getRequisitionDetails(requisitionId)
    const fullRequisition = response.data.data || response.data
    
    console.log('Full requisition data:', fullRequisition)
    console.log('Requisition items:', fullRequisition.items || fullRequisition.line_items || fullRequisition.requisition_items || fullRequisition.lines)
    console.log('Calculated total:', calculateRequisitionTotal(fullRequisition))
    
    // Add to selectedRequisitions array
    selectedRequisitions.value.push(fullRequisition)
    
    // Auto-populate form with complete requisition data
    autoPopulateFromRequisition(fullRequisition)
  } catch (error: any) {
    console.error('Error fetching requisition details:', error)
    init({
      message: 'Failed to load complete requisition details',
      color: 'danger'
    })
  } finally {
    savingLink.value = false
  }
}

// Auto-populate form when requisition is selected
function autoPopulateFromRequisition(requisition: any) {
  if (!requisition) return
  
  console.log('Auto-populating form from requisition:', requisition)
  
  try {
    // Set posting date from requisition date
    if (requisition.date) {
      form.value.posting_date = requisition.date.split('T')[0]
    }
    
    // Store requisition reference in narration if empty
    if (!form.value.narration) {
      form.value.narration = `From Requisition ${requisition.requisition_number || `REQ-${String(requisition.id).padStart(4, '0')}`}`
    }
    
    // Clear existing accounts and populate from requisition items
    form.value.accounts = []
    
    const items = requisition.items || requisition.line_items || requisition.requisition_items || []
    console.log('Requisition items found:', items.length, items)
    
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        console.log('Processing requisition item:', item)
        
        // Calculate amount - try multiple property names
        let itemAmount = 0
        if (item.amount) {
          itemAmount = parseFloat(String(item.amount))
        } else if (item.total_amount) {
          itemAmount = parseFloat(String(item.total_amount))
        } else if (item.unit_price && item.quantity) {
          itemAmount = parseFloat(String(item.unit_price)) * parseFloat(String(item.quantity))
        } else if (item.price && item.qty) {
          itemAmount = parseFloat(String(item.price)) * parseFloat(String(item.qty))
        }
        
        console.log('Item amount calculated:', itemAmount, { 
          direct: item.amount, 
          total: item.total_amount, 
          calc: item.unit_price && item.quantity ? item.unit_price * item.quantity : null 
        })
        
        // Get GL accounts from the item
        const itemAccounts = item.accounts || item.gl_accounts || []
        
        console.log('Item accounts:', itemAccounts)
        
        if (itemAccounts && Array.isArray(itemAccounts) && itemAccounts.length > 0) {
          // Multiple accounts per item (pivot table structure)
          for (const account of itemAccounts) {
            console.log('Adding account from accounts array:', account)
            
            // The account object in items.accounts is a pivot table row
            // It has: id, account_id, amount, etc.
            const accountId = account.account_id || account.id
            const accountAmount = parseFloat(String(account.amount)) || itemAmount
            
            console.log('Account details - ID:', accountId, 'Amount:', accountAmount)
            
            // Need to fetch the full account details from the accounts list
            const fullAccount = accounts.value?.find((acc: any) => acc.id === accountId)
            
            form.value.accounts.push({
              account_id: accountId,
              account_code: fullAccount?.code || account.code || account.account_code || '',
              account_name: fullAccount?.name || account.name || account.account_name || '',
              transaction_type: 'DEBIT',
              amount: accountAmount,
              exchange_rate: requisition.exchange_rate || 1.0,
              from_requisition: true,
              requisition_item_id: item.id,
              dimensions: item.dimensions || []
            })
          }
        } else if (item.account_id) {
          // Single account per item
          console.log('Adding account from account_id:', item.account_id)
          
          const fullAccount = accounts.value?.find((acc: any) => acc.id === item.account_id)
          
          form.value.accounts.push({
            account_id: item.account_id,
            account_code: fullAccount?.code || item.account_code || '',
            account_name: fullAccount?.name || item.account_name || '',
            transaction_type: 'DEBIT',
            amount: itemAmount,
            exchange_rate: requisition.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
        } else if (item.account) {
          // Account object directly
          console.log('Adding account from account object:', item.account)
          
          const fullAccount = accounts.value?.find((acc: any) => acc.id === item.account.id)
          
          form.value.accounts.push({
            account_id: item.account.id,
            account_code: fullAccount?.code || item.account.code || '',
            account_name: fullAccount?.name || item.account.name || '',
            transaction_type: 'DEBIT',
            amount: itemAmount,
            exchange_rate: requisition.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
        } else {
          // No account found - still create line with amount for manual account selection
          console.log('No account found for item, creating placeholder')
          form.value.accounts.push({
            account_id: 0,
            account_code: '',
            account_name: '',
            transaction_type: 'DEBIT',
            amount: itemAmount,
            exchange_rate: requisition.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
        }
      }
    }
    
    console.log('Form populated with accounts:', form.value.accounts)
    
    init({
      message: `Requisition REQ-${String(requisition.id).padStart(4, '0')} loaded with ${form.value.accounts.length} account line(s)`,
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error auto-populating form:', error)
    init({
      message: 'Requisition selected but form auto-population encountered an issue. You may need to manually add account lines.',
      color: 'warning'
    })
  }
}

function clearRequisitionSearch() {
  requisitionSearchQuery.value = ''
  filteredRequisitions.value = []
  showRequisitionDropdown.value = false
}

function removeSelectedRequisition(requisitionId: number) {
  selectedRequisitions.value = selectedRequisitions.value.filter(req => req.id !== requisitionId)
  init({
    message: `REQ-${String(requisitionId).padStart(4, '0')} removed from selection`,
    color: 'success'
  })
}

function clearSelectedRequisition() {
  selectedRequisitions.value = []
  requisitionSearchQuery.value = ''
  filteredRequisitions.value = []
}

// ==================== INVOICE WORKFLOW METHODS ====================

// Search for approved invoices
function searchInvoices() {
  if (invoiceSearchTimeout) {
    clearTimeout(invoiceSearchTimeout)
  }

  if (!invoiceSearchQuery.value.trim()) {
    filteredInvoices.value = []
    return
  }

  invoiceSearchTimeout = setTimeout(async () => {
    searchingInvoices.value = true
    try {
      const searchLower = invoiceSearchQuery.value.toLowerCase().trim()
      
      console.log('Searching invoices:', searchLower)
      
      // Call the store's searchInvoices method
      const response = await accountingStore.searchInvoices(
        searchLower,
        'APPROVED'
      )
      
      const results = response.data.data || response.data || []
      console.log('Invoice search results:', results)
      
      filteredInvoices.value = Array.isArray(results) ? results.slice(0, 10) : []
    } catch (error) {
      console.error('Invoice search error:', error)
      filteredInvoices.value = []
    } finally {
      searchingInvoices.value = false
    }
  }, 300) // Debounce 300ms
}

// Select requisition from search results
function selectRequisitionFromSearch(req: any) {
  selectSingleRequisition(req)
}

// Select an invoice from search results
function selectInvoice(inv: any) {
  console.log('Selecting invoice:', inv)
  
  if (selectedInvoice.value && selectedInvoice.value.id === inv.id) {
    init({
      message: `Invoice ${inv.document_number} is already selected`,
      color: 'info'
    })
    return
  }

  // Clear search
  invoiceSearchQuery.value = ''
  filteredInvoices.value = []
  showInvoiceDropdown.value = false
  
  // Set selected invoice
  selectedInvoice.value = inv
  
  // Auto-populate form from invoice
  nextTick(async () => {
    await autoPopulateFromInvoice(inv)
  })
}

// Auto-populate JV form from invoice
async function autoPopulateFromInvoice(inv: any) {
  if (!inv) return
  
  console.log('Auto-populating from invoice:', inv)
  
  try {
    // Set posting date from invoice date
    if (inv.invoice_date) {
      form.value.posting_date = inv.invoice_date.split('T')[0]
    }
    
    // Set narration
    if (!form.value.narration) {
      form.value.narration = `Journal Voucher from Invoice ${inv.document_number}`
    }
    
    // Set currency
    if (inv.currency_id) {
      form.value.currency_id = String(inv.currency_id)
    }
    
    // Clear existing accounts and auto-generate from invoice type
    form.value.accounts = []
    
    const total = inv.total_amount || 0
    const invoiceType = inv.invoice_type  // 'AR' or 'AP'
    
    if (total > 0) {
      // For AR invoices (you bill them - receivables):
      // DR: Accounts Receivable, CR: Revenue
      // For AP invoices (they bill you - payables):
      // DR: Expense, CR: Accounts Payable
      
      if (invoiceType === 'AR') {
        // Debit Accounts Receivable
        form.value.accounts.push({
          account_id: 0,  // Will need to be manually selected
          account_code: '',
          account_name: '',
          transaction_type: 'DEBIT',
          amount: total,
          exchange_rate: inv.exchange_rate_to_base || 1.0,
          from_invoice: true,
          invoice_id: inv.id
        })
      } else if (invoiceType === 'AP') {
        // Credit Accounts Payable
        form.value.accounts.push({
          account_id: 0,  // Will need to be manually selected
          account_code: '',
          account_name: '',
          transaction_type: 'CREDIT',
          amount: total,
          exchange_rate: inv.exchange_rate_to_base || 1.0,
          from_invoice: true,
          invoice_id: inv.id
        })
      }
    }
    
    console.log('Form auto-populated from invoice:', form.value.accounts)
    
    init({
      message: `Invoice ${inv.document_number} loaded. Please review and configure account lines manually.`,
      color: 'info'
    })
  } catch (error: any) {
    console.error('Error auto-populating from invoice:', error)
    init({
      message: 'Invoice selected. Please manually configure account lines.',
      color: 'warning'
    })
  }
}

// Clear selected invoice
function clearSelectedInvoice() {
  selectedInvoice.value = null
  invoiceSearchQuery.value = ''
  filteredInvoices.value = []
  showInvoiceDropdown.value = false
}

function clearInvoiceSearch() {
  invoiceSearchQuery.value = ''
  filteredInvoices.value = []
  showInvoiceDropdown.value = false
}

// ==================== DOCUMENT TYPE CHANGE HANDLER ====================

// Step 1: Source Document Type Changed
function onSourceDocumentTypeChange() {
  // Reset both requisition and invoice selections when source type changes
  selectedRequisition.value = null
  selectedRequisitions.value = []
  selectedInvoice.value = null
  requisitionSearchQuery.value = ''
  invoiceSearchQuery.value = ''
  filteredRequisitions.value = []
  filteredInvoices.value = []
  showRequisitionDropdown.value = false
  showInvoiceDropdown.value = false
}

// Step 2: Requisition Selected (deprecated, kept for backward compatibility)
async function onRequisitionSelect() {
  // This is now handled by selectSingleRequisition
}

// Step 3: Auto-fetch and Auto-populate Account Lines from Requisition
async function fetchAndAutoPopulate() {
  if (!selectedRequisition.value) {
    init({
      message: 'Please select a requisition first',
      color: 'danger'
    })
    return
  }

  savingLink.value = true
  try {
    // Use the currently selected requisition data
    const requisitionData = selectedRequisition.value

    console.log('Auto-populating from requisition:', requisitionData)
    console.log('Requisition structure:', {
      items: requisitionData?.items,
      line_items: requisitionData?.line_items,
      requisition_items: requisitionData?.requisition_items
    })

    // Auto-populate account lines from requisition
    // Try different possible property names for items
    const items = requisitionData?.items || requisitionData?.line_items || requisitionData?.requisition_items || []
    
    if (items && Array.isArray(items) && items.length > 0) {
      form.value.accounts = []

      // Process each requisition item to create account entries
      for (const item of items) {
        console.log('Processing item:', item)
        console.log('Item keys:', Object.keys(item))
        console.log('Item structure - accounts:', item.accounts, 'gl_accounts:', item.gl_accounts, 'account_id:', item.account_id, 'account:', item.account)
        
        // Get GL accounts associated with this item - try multiple property names
        const itemAccounts = item.accounts || item.gl_accounts || []
        
        if (itemAccounts && Array.isArray(itemAccounts) && itemAccounts.length > 0) {
          console.log('Found accounts array with', itemAccounts.length, 'accounts')
          for (const account of itemAccounts) {
            // Determine transaction type based on source type or account category
            const transactionType = getTransactionType(requisitionData.source?.sourceType, account.type)
            
            form.value.accounts.push({
              account_id: account.id,
              account_code: account.code,
              account_name: account.name,
              transaction_type: transactionType,
              amount: item.amount || 0,
              exchange_rate: requisitionData.exchange_rate || 1.0,
              from_requisition: true,  // Flag to show this was auto-populated
              requisition_item_id: item.id,
              dimensions: item.dimensions || []
            })
            console.log('Added account:', account.code, account.name)
          }
        } else if (item.account_id) {
          // If item has a single account_id directly, create account line from it
          console.log('Item has direct account_id:', item.account_id)
          const transactionType = getTransactionType(requisitionData.source?.sourceType, item.account_type)
          
          form.value.accounts.push({
            account_id: item.account_id,
            account_code: item.account_code || '',
            account_name: item.account_name || '',
            transaction_type: transactionType,
            amount: item.amount || 0,
            exchange_rate: requisitionData.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
          console.log('Added single account from account_id')
        } else if (item.account) {
          // If item has an account object directly
          console.log('Item has account object:', item.account)
          const account = item.account
          const transactionType = getTransactionType(requisitionData.source?.sourceType, account.type)
          
          form.value.accounts.push({
            account_id: account.id,
            account_code: account.code,
            account_name: account.name,
            transaction_type: transactionType,
            amount: item.amount || 0,
            exchange_rate: requisitionData.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
          console.log('Added account from account object')
        } else {
          console.warn('Item has no accounts or account_id:', item)
        }
      }
    } else {
      console.warn('No items found in requisition. Items array:', items)
    }

    console.log('Final accounts populated:', form.value.accounts)

    // Auto-populate JV header fields from requisition
    if (requisitionData.currency_id) {
      form.value.currency_id = String(requisitionData.currency_id)
    }
    if (requisitionData.exchange_rate) {
      form.value.exchange_rate = requisitionData.exchange_rate
    }

    init({
      message: `Auto-populated ${form.value.accounts.length} account lines from requisition`,
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error auto-populating requisition:', error)
    init({
      message: error?.message || 'Failed to auto-populate requisition details. Please try again.',
      color: 'danger'
    })
  } finally {
    savingLink.value = false
  }
}

// Helper function to determine transaction type based on source and account
function getTransactionType(sourceType: string, accountType?: string): string {
  // This logic depends on your business rules
  // For now, simple logic: CASH/VENDOR payments -> Debit cash/vendor, Credit expense
  // You may need to enhance this based on actual GL structure
  
  if (sourceType === 'CASH') {
    return accountType === 'ASSET' ? 'CR' : 'DR'  // Credit cash asset, debit expense
  } else if (sourceType === 'VENDOR') {
    return accountType === 'LIABILITY' ? 'CR' : 'DR'  // Credit AP liability, debit expense
  } else if (sourceType === 'STORE') {
    return accountType === 'ASSET' ? 'CR' : 'DR'  // Credit inventory asset, debit expense
  }
  
  // Default: Assume it's a balanced entry
  return 'DR'
}





function unlinkRequisition(linkId: number) {
  linkedRequisitions.value = linkedRequisitions.value.filter(link => link.id !== linkId)
  init({
    message: 'Requisition unlinked',
    color: 'success'
  })
}

function getItemStatusClass(item: any): string {
  const remaining = (item.amount || 0) - (item.posted_amount || 0)
  if (remaining <= 0) return 'badge-success'
  if (remaining < (item.amount || 0) / 2) return 'badge-warning'
  return 'badge-info'
}

async function submit() {
  // Validation: Must have account lines
  if (form.value.accounts.length === 0) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please add at least one account line',
      confirmButtonColor: '#2563eb'
    })
    return
  }

  // Validation: Must be balanced
  if (!balanceSummary.value.is_balanced) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Journal voucher must be balanced (Debit = Credit)',
      confirmButtonColor: '#2563eb'
    })
    return
  }

  // Validation: Must have narration
  if (!form.value.narration || form.value.narration.trim() === '') {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please provide narration/description for the journal voucher',
      confirmButtonColor: '#2563eb'
    })
    return
  }

  // SweetAlert Confirmation
  Swal.fire({
    title: 'Confirm Submission',
    text: `Are you sure you want to ${isEdit.value ? 'update' : 'create'} this journal voucher?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Submit'
  }).then((result) => {
    if (result.isConfirmed) {
      submitJournalVoucher()
    }
  })
}

async function submitJournalVoucher() {
  saving.value = true
  try {
    const payload = {
      document_type_id: Number(form.value.document_type_id),
      currency_id: Number(form.value.currency_id),
      posting_date: form.value.posting_date,
      narration: form.value.narration || null,
      status: form.value.status,
      accounts: form.value.accounts.map(a => ({
        account_id: Number(a.account_id),
        transaction_type: a.transaction_type,
        amount: a.amount,
        exchange_rate: a.exchange_rate || 1.0
      })),
      payments: form.value.payments.length > 0 ? form.value.payments.map(p => ({
        instrument_type: p.instrument_type,
        instrument_number: p.instrument_number || null,
        instrument_date: p.instrument_date || null,
        payee: p.payee || null,
        amount: p.amount,
        currency_id: Number(p.currency_id)
      })) : []
    }

    let voucherResponse
    if (isEdit.value && voucherId.value) {
      await accountingStore.updateJournalVoucher(voucherId.value, payload)
      voucherResponse = await accountingStore.getJournalVoucher(voucherId.value)
    } else {
      voucherResponse = await accountingStore.createJournalVoucher(payload)
    }

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: isEdit.value ? 'Journal voucher updated successfully' : 'Journal voucher created successfully',
      timer: 2000,
      showConfirmButton: false
    })

    // Step 6: Create journal_voucher_account_links to link JV to source requisition
    if (voucherResponse?.data?.data) {
      const createdVoucher = voucherResponse.data.data
      const voucherId = createdVoucher.id

      // For each account line, create a link to the source requisition if available
      if (selectedRequisition.value && createdVoucher.accounts && createdVoucher.accounts.length > 0) {
        for (const account of createdVoucher.accounts) {
          try {
            // Create link: journal_voucher_account_links
            await fetch('/api/journal-voucher-account-links', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                journal_voucher_account_id: account.id,
                linkable_type: 'REQUISITION',
                linkable_id: Number(selectedRequisition.value.id)
              })
            })
          } catch (linkError) {
            console.warn('Warning: Could not create account link:', linkError)
            // Don't fail the entire operation if linking fails
          }
        }
      }
    }

    if (sidebarMinifiedForCreate.value && !isEdit.value) {
      appOptionStore.appSidebarMinified = originalSidebarState.value
      sidebarMinifiedForCreate.value = false
    }

    router.push({ name: 'journal-vouchers' })
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || error.message || 'Error saving journal voucher',
      confirmButtonColor: '#2563eb'
    })
  } finally {
    saving.value = false
  }
}

// ==================== PAYMENT VOUCHER METHODS ====================

async function fetchEligibleRequisitions() {
  // Validation: Payee must be selected
  if (!form.value.payee_id) {
    init({
      message: 'Please select a payee first',
      color: 'warning'
    })
    return
  }

  // Validation: From account must be selected
  if (!form.value.from_account_id) {
    init({
      message: 'Please select a From (Credit) account first',
      color: 'warning'
    })
    return
  }

  try {
    // Show loading state
    loadingRequisitions.value = true
    const originalList = [...payeeRequisitions.value]
    payeeRequisitions.value = []
    
    // Fetch approved requisitions for this payee from the backend
    const response = await accountingStore.getApprovedRequisitionsForPayee(
      Number(form.value.payee_id),
      Number(form.value.from_account_id)
    )
    
    const requisitions = response.data?.data || response.data || []
    
    if (!Array.isArray(requisitions)) {
      payeeRequisitions.value = originalList
      init({
        message: 'Invalid response from server',
        color: 'danger'
      })
      return
    }

    // Transform requisitions for the payment table
    payeeRequisitions.value = requisitions.map((req: any) => ({
      id: req.id,
      requisition_id: req.id,
      requisition_number: req.requisition_number || `REQ-${String(req.id).padStart(4, '0')}`,
      description: req.description || req.narrative || req.narration || 'General requisition',
      cost_center: req.cost_center || req.cost_center_code || 'N/A',
      total_amount: parseFloat(String(req.total_amount || req.amount || 0)),
      balance_remaining: parseFloat(String(req.balance_remaining || 0)),
      amount_to_pay: parseFloat(String(req.amount_to_pay || req.total_amount || req.amount || 0)),
      status: req.status || 'APPROVED',
      payee_id: req.payee_id || form.value.payee_id,
      posting_date: req.posting_date || new Date().toISOString().split('T')[0]
    }))

    // Update total amount from sum of requisitions
    form.value.total_amount = totalAmountToPay.value

    if (payeeRequisitions.value.length === 0) {
      init({
        message: `No approved requisitions found for the selected payee`,
        color: 'info'
      })
    } else {
      init({
        message: `Found ${payeeRequisitions.value.length} approved requisition(s)`,
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error fetching approved requisitions:', error)
    payeeRequisitions.value = []
    init({
      message: error?.response?.data?.message || 'Failed to fetch approved requisitions',
      color: 'danger'
    })
  } finally {
    loadingRequisitions.value = false
  }
}

function onAmountToPay(index: number) {
  // Clamp amount_to_pay between 0 and total_amount
  if (index >= 0 && index < payeeRequisitions.value.length) {
    const req = payeeRequisitions.value[index]
    const maxAmount = req.total_amount || 0
    
    // Clamp to range [0, maxAmount]
    if (req.amount_to_pay < 0) {
      req.amount_to_pay = 0
    } else if (req.amount_to_pay > maxAmount) {
      req.amount_to_pay = maxAmount
    }
    
    // Update form.total_amount to match the new sum
    form.value.total_amount = totalAmountToPay.value
  }
}

function removePayeeRequisition(index: number) {
  if (index >= 0 && index < payeeRequisitions.value.length) {
    const removed = payeeRequisitions.value[index]
    payeeRequisitions.value.splice(index, 1)
    // Update total amount after removal
    form.value.total_amount = totalAmountToPay.value
    init({
      message: `Requisition ${removed.requisition_number} removed`,
      color: 'success'
    })
  }
}

async function saveDraft() {
  // Validation: At least one requisition must be selected
  if (payeeRequisitions.value.length === 0) {
    init({
      message: 'Please fetch and select at least one requisition',
      color: 'warning'
    })
    return
  }

  // Validation: Required fields
  if (!form.value.from_account_id) {
    init({
      message: 'Please select a From (Credit) account',
      color: 'warning'
    })
    return
  }

  if (!form.value.payee_id) {
    init({
      message: 'Please select a payee',
      color: 'warning'
    })
    return
  }

  if (!form.value.currency_id) {
    init({
      message: 'Please select a currency',
      color: 'warning'
    })
    return
  }

  try {
    saving.value = true

    // Build payment voucher payload
    const payload = {
      voucher_type: 'PAYMENT',
      voucher_number: form.value.voucher_number,
      posting_date: form.value.posting_date,
      branch_id: form.value.branch_id || null,
      currency_id: Number(form.value.currency_id),
      exchange_rate: form.value.exchange_rate || 1.0,
      from_account_id: Number(form.value.from_account_id),
      payment_method: form.value.payment_method,
      payee_id: Number(form.value.payee_id),
      payee_account: form.value.payee_account,
      total_amount: form.value.total_amount || payeeRequisitions.value.reduce((sum, r) => sum + r.amount_to_pay, 0),
      narration: form.value.narration,
      status: 'DRAFT',
      requisitions: payeeRequisitions.value.map(r => ({
        requisition_id: r.requisition_id,
        amount: r.amount_to_pay
      }))
    }

    // Save to backend
    const response = await accountingStore.savePaymentVoucherDraft(payload)
    
    const savedVoucherId = response.data?.data?.id || response.data?.id
    
    init({
      message: 'Payment voucher saved as draft',
      color: 'success'
    })

    // Option to view or post the draft
    Swal.fire({
      title: 'Draft Saved',
      text: 'Payment voucher has been saved as draft. What would you like to do?',
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Post Now',
      cancelButtonText: 'Stay Here'
    }).then((result) => {
      if (result.isConfirmed && savedVoucherId) {
        postVoucher(savedVoucherId)
      }
    })
  } catch (error: any) {
    console.error('Error saving payment voucher draft:', error)
    init({
      message: error?.response?.data?.message || 'Failed to save payment voucher',
      color: 'danger'
    })
  } finally {
    saving.value = false
  }
}

async function postVoucher(voucherId?: number) {
  // If not provided, save first then post
  if (!voucherId) {
    // Validation: At least one requisition must be selected
    if (payeeRequisitions.value.length === 0) {
      init({
        message: 'Please fetch and select at least one requisition',
        color: 'warning'
      })
      return
    }

    // Validation: Required fields
    if (!form.value.from_account_id || !form.value.payee_id || !form.value.currency_id) {
      init({
        message: 'Please fill all required fields (From Account, Payee, Currency)',
        color: 'warning'
      })
      return
    }

    // Show confirmation
    const result = await Swal.fire({
      title: 'Confirm Payment Voucher',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Payee:</strong> ${form.value.payee_id}</p>
          <p><strong>Total Amount:</strong> ${formatCurrency(form.value.total_amount || payeeRequisitions.value.reduce((sum, r) => sum + r.amount_to_pay, 0))}</p>
          <p><strong>Requisitions:</strong> ${payeeRequisitions.value.length}</p>
          <p style="color: #dc2626; margin-top: 16px;"><strong>This action will create accounting entries and cannot be undone.</strong></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Post Voucher',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      saving.value = true

      // Build payload
      const payload = {
        voucher_type: 'PAYMENT',
        voucher_number: form.value.voucher_number,
        posting_date: form.value.posting_date,
        branch_id: form.value.branch_id || null,
        currency_id: Number(form.value.currency_id),
        exchange_rate: form.value.exchange_rate || 1.0,
        from_account_id: Number(form.value.from_account_id),
        payment_method: form.value.payment_method,
        payee_id: Number(form.value.payee_id),
        payee_account: form.value.payee_account,
        total_amount: form.value.total_amount || payeeRequisitions.value.reduce((sum, r) => sum + r.amount_to_pay, 0),
        narration: form.value.narration,
        status: 'POSTED',
        requisitions: payeeRequisitions.value.map(r => ({
          requisition_id: r.requisition_id,
          amount: r.amount_to_pay
        }))
      }

      // Save and post to backend
      const response = await accountingStore.postPaymentVoucher(payload)
      
      // Show success SweetAlert
      await Swal.fire({
        icon: 'success',
        title: 'Payment Voucher Created',
        text: 'Payment voucher has been successfully created and posted',
        confirmButtonColor: '#059669',
        confirmButtonText: 'OK'
      })

      // Redirect to vouchers list
      router.push({ name: 'payment-vouchers' })
    } catch (error: any) {
      console.error('Error posting payment voucher:', error)
      init({
        message: error?.response?.data?.message || 'Failed to post payment voucher',
        color: 'danger'
      })
    } finally {
      saving.value = false
    }
  } else {
    // Post existing draft voucher
    try {
      saving.value = true

      const response = await accountingStore.postPaymentVoucher({
        id: voucherId,
        status: 'POSTED'
      })

      init({
        message: 'Payment voucher posted successfully',
        color: 'success'
      })

      // Redirect to vouchers list
      setTimeout(() => {
        router.push({ name: 'payment-vouchers' })
      }, 1500)
    } catch (error: any) {
      console.error('Error posting payment voucher:', error)
      init({
        message: error?.response?.data?.message || 'Failed to post payment voucher',
        color: 'danger'
      })
    } finally {
      saving.value = false
    }
  }
}

function closeForm() {
  // Confirm close if there are unsaved changes
  if (payeeRequisitions.value.length > 0 || form.value.narration) {
    Swal.fire({
      title: 'Unsaved Changes',
      text: 'Are you sure you want to close without saving?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Close',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({ name: 'payment-vouchers' })
      }
    })
  } else {
    router.push({ name: 'payment-vouchers' })
  }
}

function goBack() {
  if (sidebarMinifiedForCreate.value) {
    appOptionStore.appSidebarMinified = originalSidebarState.value
    sidebarMinifiedForCreate.value = false
  }
  router.push({ name: 'journal-vouchers' })
}

function resetForm() {
  form.value = {
    document_type_id: '',
    currency_id: '',
    document_number: '',
    posting_date: new Date().toISOString().split('T')[0],
    primary_account_id: '',
    exchange_rate: 1.0,
    status: 'DRAFT',
    narration: '',
    accounts: [],
    payments: []
  } as any
  selectedRequisition.value = null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Calculate total amount from requisition items
function calculateRequisitionTotal(requisition: any): number {
  if (!requisition) return 0
  
  // Try direct total_amount property first
  if (requisition.total_amount && !isNaN(parseFloat(String(requisition.total_amount)))) {
    return parseFloat(String(requisition.total_amount))
  }
  
  // Calculate from items - try multiple field names
  const items = requisition.items || requisition.line_items || requisition.requisition_items || requisition.lines || []
  if (!Array.isArray(items) || items.length === 0) return 0
  
  return items.reduce((sum: number, item: any) => {
    let itemAmount = 0
    
    // First check if amount is directly on the item
    if (item.amount && !isNaN(parseFloat(String(item.amount)))) {
      itemAmount = parseFloat(String(item.amount))
    } else if (item.total_amount && !isNaN(parseFloat(String(item.total_amount)))) {
      itemAmount = parseFloat(String(item.total_amount))
    } else if (item.unit_price && item.quantity) {
      const price = parseFloat(String(item.unit_price)) || 0
      const qty = parseFloat(String(item.quantity)) || 0
      itemAmount = price * qty
    }
    // NEW: Check if amount is in the item's accounts array
    else if (item.accounts && Array.isArray(item.accounts)) {
      itemAmount = item.accounts.reduce((accSum: number, acc: any) => {
        if (acc.amount && !isNaN(parseFloat(String(acc.amount)))) {
          return accSum + parseFloat(String(acc.amount))
        }
        return accSum
      }, 0)
    }
    
    return sum + itemAmount
  }, 0)
}

// Get source type for requisition
function getRequisitionSourceType(requisition: any): string {
  if (!requisition) return 'N/A'
  
  // Try source property
  if (requisition.source?.sourceType) {
    return requisition.source.sourceType
  }
  
  // Try requisition_type
  if (requisition.requisition_type?.name) {
    return requisition.requisition_type.name
  }
  
  // Try source_type directly
  if (requisition.source_type) {
    return requisition.source_type
  }
  
  // Default
  return 'Requisition'
}

// ==================== PAYMENT VOUCHER DATA LOADING ====================

async function loadPaymentVoucherData() {
  try {
    // Fetch branches from API
    const branchesResponse = await accountingStore.fetchBranches()
    branches.value = branchesResponse.data?.data || branchesResponse.data || []
    
    // Fetch bank/cash accounts for the From Account dropdown
    const bankCashResponse = await accountingStore.getBankCashAccounts(accountingStore.companyId)
    bankCashAccounts.value = bankCashResponse.data?.data || bankCashResponse.data || []
    
    // Fetch all payees from API
    const payeesResponse = await accountingStore.fetchPayees(accountingStore.companyId)
    payees.value = payeesResponse.data?.data || payeesResponse.data || []
    
    console.log('Payment voucher data loaded:', {
      branches: branches.value.length,
      bankCashAccounts: bankCashAccounts.value.length,
      payees: payees.value.length
    })
  } catch (error: any) {
    console.error('Error loading payment voucher data:', error)
    init({
      message: 'Some dropdown data could not be loaded. Please try again.',
      color: 'warning'
    })
  }
}

// Handle From Account selection change
function onFromAccountChange() {
  console.log('From account changed to:', form.value.from_account_id)
  // Clear payee requisitions when account changes (they were for a different account)
  payeeRequisitions.value = []
}

// Handle Payee selection change
async function onPayeeChange() {
  console.log('Payee changed to:', form.value.payee_id)
  // Clear payee requisitions when payee changes
  payeeRequisitions.value = []

  // Auto-populate Account field based on payee
  if (form.value.payee_id) {
    try {
      const response = await accountingStore.fetchPayeeAccount(
        Number(form.value.payee_id),
        1
      )

      if (response.success && response.data) {
        // Auto-populate Account field
        form.value.payee_account_id = response.data.id
        form.value.payee_account_code = response.data.code
        form.value.payee_account = response.data.label || response.data.code
        console.log('Account auto-populated:', response.data.label)
      }
    } catch (error) {
      console.error('Error fetching payee account:', error)
      // Don't show error to user, field can be filled manually if needed
    }
  } else {
    // Clear account if payee is cleared
    form.value.payee_account_id = null
    form.value.payee_account_code = null
    form.value.payee_account = ''
  }
}

// Lifecycle
onMounted(async () => {
  // Minify sidebar for create mode (like Requisition page)
  if (!isEdit.value) {
    originalSidebarState.value = appOptionStore.appSidebarMinified
    appOptionStore.appSidebarMinified = true
    sidebarMinifiedForCreate.value = true
  }

  // Add click outside listener to close search dropdown
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.field')) {
      showRequisitionDropdown.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)

  try {
    await Promise.all([
      accountingStore.fetchDocumentTypes(),
      accountingStore.fetchCurrencies(),
      accountingStore.fetchAccounts(),
      accountingStore.fetchRequisitionsForLinking(),
      loadPaymentVoucherData() // Load payment voucher specific data
    ])
  } catch (error: any) {
    console.error('Error loading metadata:', error)
    init({
      message: 'Some form data could not be loaded. The form will still work, but some options may be limited.',
      color: 'warning'
    })
  }

  if (isEdit.value && voucherId.value) {
    try {
      const response = await accountingStore.getJournalVoucher(voucherId.value)
      const voucher = response.data.data
      form.value = {
        document_type_id: String(voucher.document_type_id),
        currency_id: String(voucher.currency_id),
        document_number: voucher.document_number || '',
        posting_date: voucher.posting_date,
        primary_account_id: String(voucher.primary_account_id || ''),
        exchange_rate: voucher.exchange_rate || 1.0,
        status: voucher.status || 'DRAFT',
        narration: voucher.narration || '',
        accounts: voucher.accounts || [],
        payments: voucher.payments || []
      } as any

      // Load linked requisitions if any (for future use)
      if (voucher.accounts && voucher.accounts.length > 0) {
        try {
          // This can be used to fetch and display linked documents if needed
          // const linkedDocsResponse = await accountingStore.getLinkedDocumentsForVoucher(voucherId.value, voucher.accounts[0].id)
        } catch (err) {
          // Silently fail if no linked documents
        }
      }
    } catch (error) {
      init({
        message: 'Failed to load journal voucher',
        color: 'danger'
      })
    }
  }

  // Store the event listener reference for cleanup
  ;(window as any).__jvFormClickOutside = handleClickOutside
})

// Restore sidebar on unmount
onUnmounted(() => {
  if (sidebarMinifiedForCreate.value) {
    appOptionStore.appSidebarMinified = originalSidebarState.value
    sidebarMinifiedForCreate.value = false
  }

  // Remove click outside listener
  const handleClickOutside = (window as any).__jvFormClickOutside
  if (handleClickOutside) {
    document.removeEventListener('click', handleClickOutside)
  }

  // Clear search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
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
  --purple: #7c3aed;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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

/* Grid Layout - 2 Column */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  align-items: start;
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
  padding: 12px 14px;
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

.left-panel {
  grid-column: 1;
}

.right-panel {
  grid-column: 2;
  min-height: 600px;
}

.panel-title-text h3 {
  margin: 0;
  font-weight: 700;
  font-size: 16px;
  color: #0f172a;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
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
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px 8px 32px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px #dbeafe;
}

/* Balance Status */
.balance-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius);
  border: 2px solid var(--border);
  margin-top: 8px;
}

.balance-status.balanced {
  background: #d1fae5;
  border-color: #10b981;
}

.balance-status.unbalanced {
  background: #fee2e2;
  border-color: #ef4444;
}

.status-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.balance-status.balanced .status-icon {
  color: #10b981;
}

.balance-status.unbalanced .status-icon {
  color: #ef4444;
}

.status-text {
  flex: 1;
}

.status-label {
  font-weight: 700;
  font-size: 13px;
  color: inherit;
}

.status-detail {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* Tabs */
.tabs-float {
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tabs {
  display: flex;
  gap: 4px;
  align-items: center;
}

.tab {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s ease;
}

.tab:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

/* Tab Content */
.tab-content {
  padding: 14px;
  min-height: 300px;
  background: #f8fafc;
}

.tab-pane {
  display: block;
}

.section-content {
  padding: 0;
}

/* Action Footer */
.action-footer {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border-top: 1px solid var(--border);
  justify-content: flex-end;
}

/* Tables */
.table-wrapper {
  margin-top: 12px;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: white;
  border-radius: var(--radius);
  overflow: visible;
  box-shadow: var(--shadow-sm);
  table-layout: fixed;
  margin: 0;
  padding: 0;
}

.data-table thead {
  background: #f1f5f9;
  border-bottom: 2px solid var(--border);
}

.data-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  box-sizing: border-box;
  word-wrap: break-word;
  margin: 0;
  vertical-align: middle;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  box-sizing: border-box;
  word-wrap: break-word;
  vertical-align: middle;
  margin: 0;
  overflow: hidden;
}

.data-table td > span,
.data-table td > button,
.data-table td > div {
  margin: 0;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

/* Column width distribution */
.data-table tr > :nth-child(1) {
  width: 8% !important;
  min-width: 8% !important;
  max-width: 8% !important;
  text-align: center !important;
}

.data-table tr > :nth-child(2) {
  width: 40% !important;
  min-width: 40% !important;
  max-width: 40% !important;
}

.data-table tr > :nth-child(3) {
  width: 15% !important;
  min-width: 15% !important;
  max-width: 15% !important;
  text-align: center !important;
}

.data-table tr > :nth-child(4) {
  width: 22% !important;
  min-width: 22% !important;
  max-width: 22% !important;
  text-align: right !important;
}

.data-table tr > :nth-child(5) {
  width: 15% !important;
  min-width: 15% !important;
  max-width: 15% !important;
  text-align: center !important;
}

.data-table tfoot {
  background: #f8fafc;
  border-top: 2px solid var(--border);
  font-weight: 700;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  background: #f8fafc;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.empty-state-icon {
  font-size: 32px;
  margin-bottom: 10px;
  color: var(--muted);
}

.empty-state-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.summary-card {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  text-align: center;
}

.card-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.card-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
}

.card-value.warning {
  color: var(--warning);
}

.card-value.success {
  color: var(--success);
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

.btn.primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.btn-primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.primary:hover:not(:disabled) {
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

.btn.success {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
}

.btn.success:hover:not(:disabled) {
  background: #1e40af;
}

.btn-outline-danger {
  background: white;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.btn-outline-danger:hover:not(:disabled) {
  background: #fee2e2;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form Row */
.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.form-row.g-2 > * {
  flex: 1;
  min-width: 150px;
}

.add-line-form {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.form-control {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px #dbeafe;
}

.form-control-sm {
  padding: 6px 8px;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .left-panel {
    grid-column: 1;
  }

  .right-panel {
    grid-column: 1;
  }
}

/* Search Results Dropdown */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-loading,
.search-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.search-loading {
  color: var(--primary);
}

.results-list {
  max-height: 280px;
  overflow-y: auto;
}

.result-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s ease;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8fafc;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.result-number {
  font-weight: 600;
  color: var(--text);
  font-size: 13px;
}

.result-amount {
  font-weight: 600;
  color: var(--primary);
  font-size: 13px;
}

.result-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.result-type {
  color: var(--text-secondary);
}

.result-status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-draft {
  background: #e0e7ff;
  color: #3730a3;
}

/* Selected Requisition Card */
.selected-requisition-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 12px;
}

.selected-requisition-card .card-header {
  background: #f1f5f9;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.selected-requisition-card .card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
}

.selected-requisition-card .card-title i {
  color: var(--success);
  font-size: 14px;
}

.selected-requisition-card .btn-icon-small {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  transition: color 0.2s ease;
}

.selected-requisition-card .btn-icon-small:hover {
  color: var(--danger);
}

.selected-requisition-card .card-body {
  padding: 12px 16px;
}

.selected-requisition-card .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.selected-requisition-card .info-row:last-of-type {
  border-bottom: none;
}

.selected-requisition-card .info-row .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.selected-requisition-card .info-row .value {
  color: var(--text);
  font-weight: 600;
}

.selected-requisition-card .info-row .badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.selected-requisition-card .card-footer {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

/* Input wrapper with clear button */
.input-wrapper {
  position: relative;
}

.btn-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  transition: color 0.2s ease;
}

.btn-clear:hover {
  color: var(--danger);
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }

  .head-actions {
    width: 100%;
  }

  .head-actions .btn {
    flex: 1;
  }

  .form-row {
    flex-direction: column;
  }

  .form-row > * {
    width: 100%;
  }

  .tabs {
    flex-wrap: wrap;
  }

  .tab {
    flex: 1;
    min-width: 120px;
  }
}
</style>