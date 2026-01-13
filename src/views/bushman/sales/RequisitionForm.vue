<script setup lang="ts">
import { toRefs } from 'vue'

type Props = {
  isEditMode: boolean
  savingForm: boolean
  errorMessage: string
  requisitionTypes: any[]
  branches: any[]
  currencies: any[]
  itemsOptions: any[]
  unitsOptions: any[]
  accounts: any[]
  users: any[]
  dimensionTypes: any[]
  dimensionValues: any[]
  vatOptions: any[]
  formTabs: string[]
  materialsTotal: number
  accountsTotal: number
  grandTotal: number
  getTabIcon: (tab: string) => string
  getTabCount: (tab: string) => number
  getCurrencySymbol: () => string
  formatAmount: (value: number) => string
}

const props = defineProps<Props>()
const {
  isEditMode,
  savingForm,
  errorMessage,
  requisitionTypes,
  branches,
  currencies,
  itemsOptions,
  unitsOptions,
  accounts,
  users,
  dimensionTypes,
  dimensionValues,
  vatOptions,
  formTabs,
  materialsTotal,
  accountsTotal,
  grandTotal,
} = toRefs(props)

const getTabIcon = props.getTabIcon
const getTabCount = props.getTabCount
const getCurrencySymbol = props.getCurrencySymbol
const formatAmount = props.formatAmount

const form = defineModel<any>('form', { required: true })
const activeFormTab = defineModel<string>('activeFormTab', { required: true })

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'reset'): void
  (e: 'save', asDraft: boolean): void
  (e: 'clear-error'): void
  (e: 'add-material'): void
  (e: 'remove-material', key: string): void
  (e: 'add-account'): void
  (e: 'remove-account', key: string): void
  (e: 'add-dimension'): void
  (e: 'remove-dimension', key: string): void
}>()

const saveDraft = () => emit('save', true)
const submitForm = () => emit('save', false)
</script>

<template>
  <main class="content">
    <!-- Page Title Row -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="crumbs">
          <span class="crumb-icon"><i class="fa fa-file-text"></i></span>
          SALES / <span>REQUISITIONS</span>
        </div>
        <h1>{{ isEditMode ? 'Edit Requisition' : 'Create Requisition' }}</h1>
        <p class="subtitle">Fill in the requisition details and add line items for materials or expenses.</p>
      </div>

      <div class="head-actions">
        <button class="btn ghost" type="button" @click="emit('cancel')">
          <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
        </button>
        <button class="btn ghost" type="button" @click="emit('reset')">
          <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
        </button>
        <button class="btn secondary" type="button" @click="saveDraft" :disabled="savingForm">
          <span class="btn-icon"><i class="fa fa-save"></i></span> Save Draft
        </button>
        <button class="btn primary" type="button" @click="submitForm" :disabled="savingForm">
          <span v-if="savingForm" class="spinner-border spinner-border-sm me-1"></span>
          <span class="btn-icon" v-else><i class="fa fa-check"></i></span> {{ isEditMode ? 'Save Changes' : 'Submit' }}
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
      <i class="fa fa-exclamation-triangle me-2"></i>
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="emit('clear-error')"></button>
    </div>

    <!-- 2-column layout -->
    <section class="grid">
      <!-- LEFT: Requisition Details Form -->
      <aside class="panel left-panel">
        <div class="panel-header">
          <div class="panel-icon"><i class="fa fa-file-text"></i></div>
          <div class="panel-title-text">
            <h3>Requisition Details</h3>
            <p>Fill in the basic information</p>
          </div>
        </div>

        <div class="form">
          <!-- Identification Section -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon"><i class="fa fa-tag"></i></span>
              Identification
            </div>

            <label class="field">
              <span class="lbl">Type <span class="req">*</span></span>
              <div class="input-wrapper">
                <span class="input-icon"><i class="fa fa-list"></i></span>
                <select v-model="form.requisitionTypeId">
                  <option :value="null">Select type...</option>
                  <option v-for="type in requisitionTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                </select>
              </div>
            </label>

            <label class="field">
              <span class="lbl">Fund Direction <span class="req">*</span></span>
              <div class="input-wrapper">
                <span class="input-icon"><i class="fa fa-exchange"></i></span>
                <select v-model="form.fundDirection">
                  <option value="EXPENSE">Expense</option>
                  <option value="WITHDRAW">Withdraw</option>
                </select>
              </div>
            </label>

            <label class="field">
              <span class="lbl">Branch</span>
              <div class="input-wrapper">
                <span class="input-icon"><i class="fa fa-building"></i></span>
                <select v-model="form.branchId">
                  <option :value="null">Select branch...</option>
                  <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                    {{ branch.name }}
                  </option>
                </select>
              </div>
            </label>
          </div>

          <!-- Dates Section -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon"><i class="fa fa-calendar"></i></span>
              Dates
            </div>
            
            <div class="date-row">
              <label class="field">
                <span class="lbl">Requisition Date</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input type="date" v-model="form.date" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Required Date <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input type="date" v-model="form.requiredDate" />
                </div>
              </label>
            </div>
          </div>

          <!-- Currency & Tax Section -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon"><i class="fa fa-money"></i></span>
              Currency & Tax
            </div>
            
            <label class="field">
              <span class="lbl">Currency <span class="req">*</span></span>
              <div class="input-wrapper">
                <span class="input-icon"><i class="fa fa-dollar"></i></span>
                <select v-model="form.currencyId">
                  <option :value="null" disabled>Select currency...</option>
                  <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                    {{ currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name }}
                  </option>
                </select>
              </div>
            </label>

            <label class="field">
              <span class="lbl">Tax Method</span>
              <div class="input-wrapper">
                <span class="input-icon"><i class="fa fa-percent"></i></span>
                <select v-model="form.taxMethod">
                  <option value="EXCLUSIVE">Exclusive</option>
                  <option value="INCLUSIVE">Inclusive</option>
                  <option value="EXEMPT">Exempt</option>
                </select>
              </div>
            </label>

            <div class="discount-row" v-if="form.discountMethod">
              <label class="field">
                <span class="lbl">Discount</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-tag"></i></span>
                  <select v-model="form.discountMethod" class="discount-type">
                    <option :value="null">No discount</option>
                    <option value="PERCENT">Percentage</option>
                    <option value="LS">Lump Sum</option>
                  </select>
                </div>
              </label>
              <label class="field" v-if="form.discountMethod">
                <span class="lbl">Amount</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-dollar"></i></span>
                  <input type="number" v-model.number="form.discountAmount" min="0" step="0.01" placeholder="0.00" />
                </div>
              </label>
            </div>
          </div>

          <!-- Remarks Section -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon"><i class="fa fa-sticky-note"></i></span>
              Additional Info
            </div>
            
            <label class="field">
              <span class="lbl">Remarks</span>
              <div class="input-wrapper textarea-wrapper">
                <span class="input-icon"><i class="fa fa-comment"></i></span>
                <textarea v-model="form.remarks" rows="3" placeholder="Add any notes or special instructions..."></textarea>
              </div>
            </label>
          </div>

          <!-- Summary Section -->
          <div class="form-section summary-section">
            <div class="section-title">
              <span class="section-icon"><i class="fa fa-calculator"></i></span>
              Summary
            </div>
            
            <div class="summary-row">
              <span class="summary-label">Materials Total</span>
              <span class="summary-value">{{ getCurrencySymbol() }}{{ formatAmount(materialsTotal) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Accounts Total</span>
              <span class="summary-value">{{ getCurrencySymbol() }}{{ formatAmount(accountsTotal) }}</span>
            </div>
            <div class="summary-row total">
              <span class="summary-label">Grand Total</span>
              <span class="summary-value">{{ getCurrencySymbol() }}{{ formatAmount(grandTotal) }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- CENTER: Line Items -->
      <section class="panel center-panel">
        <div class="panel-header center-header">
          <div class="panel-icon"><i class="fa fa-list-alt"></i></div>
          <div class="panel-title-text">
            <h3>Line Items</h3>
            <p>Add materials, account allocations, or funding sources</p>
          </div>
        </div>

        <!-- Tabs Card -->
        <div class="inner-card tabs-card">
          <div class="tabs">
            <button
              v-for="tab in formTabs"
              :key="tab"
              class="tab"
              :class="{ active: activeFormTab === tab }"
              @click="activeFormTab = tab"
            >
              <span class="tab-icon">{{ getTabIcon(tab) }}</span>
              <span class="tab-text">{{ tab }}</span>
              <span class="tab-count" v-if="getTabCount(tab) > 0">{{ getTabCount(tab) }}</span>
            </button>
          </div>
        </div>

        <!-- MATERIALS TAB -->
        <div class="inner-card table-card" v-if="String(activeFormTab) === 'Materials'">
          <div class="table-header">
            <div class="lines-info">
              <h3>Material Items</h3>
              <span class="line-count">
                <span class="count-number">{{ form.materials.length }}</span> items
              </span>
            </div>
            <button class="btn btn-sm btn-primary" type="button" @click="emit('add-material')">
              <i class="fa fa-plus me-1"></i> Add Material
            </button>
          </div>

          <div class="table-responsive" v-if="form.materials.length > 0">
            <table class="rates-table">
              <thead>
                <tr>
                  <th style="width: 25%">Item <span class="req">*</span></th>
                  <th style="width: 15%">Unit <span class="req">*</span></th>
                  <th style="width: 10%">Qty <span class="req">*</span></th>
                  <th style="width: 20%">Amount</th>
                  <th style="width: 15%">Description</th>
                  <th style="width: 5%" class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in form.materials" :key="line._key" class="rate-row">
                  <td>
                    <select v-model="line.itemId" class="form-select form-select-sm">
                      <option :value="null">Select item...</option>
                      <option v-for="item in itemsOptions" :key="item.id" :value="item.id">
                        {{ item.code ? `${item.code} - ` : '' }}{{ item.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select v-model="line.unitId" class="form-select form-select-sm">
                      <option :value="null">Select unit...</option>
                      <option v-for="unit in unitsOptions" :key="unit.id" :value="unit.id">
                        {{ unit.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      v-model.number="line.quantity" 
                      min="0" 
                      step="1"
                      class="form-control form-control-sm text-end"
                    />
                  </td>
                  <td>
                    <div class="amount-input-group">
                      <span class="input-group-text">{{ getCurrencySymbol() }}</span>
                      <input 
                        type="number" 
                        v-model.number="line.amount" 
                        min="0" 
                        step="0.01"
                        class="form-control form-control-sm text-end"
                      />
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      v-model="line.description" 
                      class="form-control form-control-sm"
                      placeholder="Description..."
                    />
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="emit('remove-material', line._key)"
                      :disabled="form.materials.length <= 1"
                      title="Remove"
                    >
                      <i class="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" class="text-end fw-bold">Materials Total:</td>
                  <td class="text-end fw-bold">{{ getCurrencySymbol() }}{{ formatAmount(materialsTotal) }}</td>
                  <td colspan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-else class="empty-state">
            <div class="empty-illustration">
              <div class="empty-icon"><i class="fa fa-cube fa-3x"></i></div>
            </div>
            <div class="empty-content">
              <div class="empty-text">No materials added yet</div>
              <div class="empty-hint">Click "Add Material" to add items to your requisition</div>
              <button class="btn btn-add" type="button" @click="emit('add-material')">
                <span class="btn-icon"><i class="fa fa-plus"></i></span> Add Material
              </button>
            </div>
          </div>
        </div>

        <!-- ACCOUNTS TAB -->
        <div class="inner-card table-card" v-if="String(activeFormTab) === 'Accounts'">
          <div class="table-header">
            <div class="lines-info">
              <h3>Account Allocations</h3>
              <span class="line-count">
                <span class="count-number">{{ form.accounts.length }}</span> items
              </span>
            </div>
            <button class="btn btn-sm btn-primary" type="button" @click="emit('add-account')">
              <i class="fa fa-plus me-1"></i> Add Account
            </button>
          </div>

          <div class="table-responsive" v-if="form.accounts.length > 0">
            <table class="rates-table">
              <thead>
                <tr>
                  <th style="width: 35%">Account <span class="req">*</span></th>
                  <th style="width: 20%">Amount <span class="req">*</span></th>
                  <th style="width: 35%">Description</th>
                  <th style="width: 10%" class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in form.accounts" :key="line._key" class="rate-row">
                  <td>
                    <select v-model="line.accountId" class="form-select form-select-sm">
                      <option :value="null">Select account...</option>
                      <option v-for="account in accounts" :key="account.id" :value="account.id">
                        {{ account.code ? `${account.code} - ` : '' }}{{ account.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <div class="amount-input-group">
                      <span class="input-group-text">{{ getCurrencySymbol() }}</span>
                      <input 
                        type="number" 
                        v-model.number="line.amount" 
                        min="0" 
                        step="0.01"
                        class="form-control form-control-sm text-end"
                      />
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      v-model="line.description" 
                      class="form-control form-control-sm"
                      placeholder="Description..."
                    />
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="emit('remove-account', line._key)"
                      title="Remove"
                    >
                      <i class="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2" class="text-end fw-bold">Accounts Total:</td>
                  <td class="text-end fw-bold">{{ getCurrencySymbol() }}{{ formatAmount(accountsTotal) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-else class="empty-state">
            <div class="empty-illustration">
              <div class="empty-icon"><i class="fa fa-book fa-3x"></i></div>
            </div>
            <div class="empty-content">
              <div class="empty-text">No accounts added yet</div>
              <div class="empty-hint">Click "Add Account" to add account allocations</div>
              <button class="btn btn-add" type="button" @click="emit('add-account')">
                <span class="btn-icon"><i class="fa fa-plus"></i></span> Add Account
              </button>
            </div>
          </div>
        </div>

        <!-- Sources (center tab) - duplicate of left-panel funding inputs so they remain visible when tab is active -->
        <div class="inner-card form-card" v-if="String(activeFormTab) === 'Sources'">
          <div class="table-header">
            <div class="lines-info">
              <h3>Funding Source</h3>
              <span class="line-count">Enter a single shared funding source for the requisition</span>
            </div>
          </div>

          <div class="form">
            <div class="form-section">
              <label class="field">
                <span class="lbl">Source Type <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-money-bill"></i></span>
                  <select v-model="form.source.sourceType">
                    <option :value="null" disabled>Select source type...</option>
                    <option value="CASH">Cash</option>
                    <option value="STORE">Store</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="SERVICE_PROVIDER">Service Provider</option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Payee</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-user"></i></span>
                  <input v-model="form.source.payee" type="text" class="form-control" placeholder="Payee name..." />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Source Account</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-university"></i></span>
                  <select v-model="form.source.sourceAccountId">
                    <option :value="null">Select account...</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.code ? `${account.code} - ` : '' }}{{ account.name }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Payment Mode</span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-credit-card"></i></span>
                  <select v-model="form.source.modeOfPayment">
                    <option :value="null">Select...</option>
                    <option value="CASH">Cash</option>
                    <option value="TT">TT</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>
              </label>



              <label class="field">
                <span class="lbl">Description</span>
                <div class="input-wrapper textarea-wrapper">
                  <span class="input-icon"><i class="fa fa-align-left"></i></span>
                  <textarea v-model="form.source.description" rows="2" placeholder="Notes about this funding source..."></textarea>
                </div>
              </label> 
            </div>
          </div>
        </div>

        <!-- DIMENSIONS TAB (now part of line-items tabs) -->
          <div class="inner-card table-card dimensions-panel" v-if="String(activeFormTab) === 'Dimensions'">
            <div class="table-header">
              <div class="lines-info">
                <h3>Dimension Allocation</h3>
                <span class="line-count">
                  <span class="count-number">{{ form.dimensions.length }}</span> items
                </span>
              </div>
              <button class="btn btn-sm btn-primary" type="button" @click="emit('add-dimension')">
                <i class="fa fa-plus me-1"></i> Add Dimension
              </button>
            </div>

            <div class="table-responsive" v-if="form.dimensions.length > 0">
              <table class="rates-table compact">
                <thead>
                  <tr>
                    <th style="width: 30%">Type</th>
                    <th style="width: 30%">Value</th>
                    <th style="width: 20%">Amount</th>
                    <th style="width: 15%">%</th>
                    <th style="width: 5%" class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in form.dimensions" :key="line._key" class="rate-row">
                    <td>
                      <select v-model="line.dimensionTypeId" class="form-select form-select-sm" @change="line.dimensionValueId = null">
                        <option :value="null">Type...</option>
                        <option v-for="type in dimensionTypes" :key="type.id" :value="type.id">
                          {{ type.name }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <select v-model="line.dimensionValueId" class="form-select form-select-sm">
                        <option :value="null">Value...</option>
                        <option v-for="value in dimensionValues.filter(v => v.dimension_type_id === line.dimensionTypeId)" :key="value.id" :value="value.id">
                          {{ value.name }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <div class="amount-input-group">
                        <span class="input-group-text">{{ getCurrencySymbol() }}</span>
                        <input 
                          type="number" 
                          v-model.number="line.amount" 
                          min="0" 
                          step="0.01"
                          class="form-control form-control-sm text-end"
                        />
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        v-model.number="line.percentage" 
                        min="0" 
                        max="100"
                        step="0.01"
                        class="form-control form-control-sm text-end"
                      />
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="emit('remove-dimension', line._key)"
                        title="Remove"
                      >
                      <i class="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state compact">
            <div class="empty-content">
              <div class="empty-text">No dimensions added yet</div>
              <div class="empty-hint">Click "Add Dimension" to allocate amounts</div>
              <button class="btn btn-add" type="button" @click="emit('add-dimension')">
                <span class="btn-icon"><i class="fa fa-plus"></i></span> Add Dimension
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

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
  --purple: #7c3aed;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius: 12px;
  --radius-lg: 16px;
}

.requisition-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

/* Content */
.content {
  padding: 20px 24px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
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
  margin: 10px 0 6px;
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

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 30px;
  transition: all 0.3s ease;
}

.step.completed {
  background: var(--primary-light);
}

.step.completed .step-number {
  background: var(--primary);
  color: white;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.step.completed .step-label {
  color: var(--primary);
}

.step-connector {
  width: 60px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 8px;
  transition: all 0.3s ease;
}

.step-connector.active {
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
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
  padding: 18px 20px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.left-panel .panel-icon {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.center-panel .panel-icon {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.right-panel .panel-icon {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

/* Hide the standalone Dimensions panel on small screens to avoid duplicate/stacked view under the left panel */
@media (max-width: 1000px) {
  .dimensions-panel {
    display: none !important;
  }
}

.panel-title-text h3 {
  font-weight: 700;
  color: #0f172a;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

.center-panel {
  min-height: 600px;
}

/* Buttons - All Blue Theme */
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

.btn.full {
  width: 100%;
}

.btn-add {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  padding: 10px 18px;
  font-weight: 600;
}

.btn-add:hover:not(:disabled) {
  background: #1e40af;
}

/* Left Panel Form */
.form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafbfc;
}

.form-section {
  background: #ffffff;
  border-radius: var(--radius);
  padding: 18px;
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.section-icon {
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
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
  left: 12px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}

.input-wrapper input,
.input-wrapper select {
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
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
  background: #ffffff;
}

.input-wrapper input[type="date"] {
  padding-left: 38px;
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

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.date-row .field {
  min-width: 0;
  margin-bottom: 0;
}

/* Allow date picker popover to float above and outside the left panel */
.left-panel {
  overflow: visible !important;
}

/* Styles for the Vueform/flatpickr calendar to render as a floating card */
.vueform-date-wrapper :deep(.flatpickr-calendar) {
  position: absolute !important;
  z-index: 9999 !important;
  min-width: 260px !important;
  max-width: 360px !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12) !important;
  border-radius: 12px !important;
}

/* Keep inner containers sized appropriately */
.vueform-date-wrapper :deep(.flatpickr-innerContainer),
.vueform-date-wrapper :deep(.flatpickr-rContainer),
.vueform-date-wrapper :deep(.dayContainer) {
  width: auto !important;
  min-width: 260px !important;
  max-width: 360px !important;
}


.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--border);
  border-radius: 26px;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: var(--shadow-sm);
}

.switch input:checked + .slider {
  background: #2563eb;
}

.switch input:checked + .slider:before {
  transform: translateX(22px);
}

/* Inner Cards */
.inner-card {
  margin: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tabs-card {
  background: #ffffff;
  padding: 14px;
  border: 1px solid #e2e8f0;
}

.toolbar-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #ffffff;
}

.table-card {
  padding: 0;
  min-height: 500px;
  max-height: 600px;
  overflow-y: auto;
  background: #ffffff;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
  line-height: 1;
}

.tab-text {
  font-weight: 600;
}

.tab-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Package Selection Card */
.package-selection-card {
  background: #ffffff;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.package-selection-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.selection-icon {
  font-size: 24px;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
  line-height: 1;
}

.package-selection-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.selection-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.package-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.package-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
}

.package-btn:hover {
  background: #f0f9ff;
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.package-btn .pkg-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
}

.package-btn .pkg-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.package-btn .pkg-code {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
}

.package-btn .pkg-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.package-btn .add-icon {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
}

/* Rate Table Styles */
.table-header {
  padding: 16px 20px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-responsive {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.rates-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.rates-table thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.rates-table thead th {
  padding: 12px;
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-secondary);
  border-bottom: 2px solid #e2e8f0;
}

.rates-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}

.rates-table tbody tr:hover {
  background: #f8fafc;
}

.rates-table tbody td {
  padding: 12px;
  vertical-align: middle;
}

.name-cell {
  min-height: 38px;
  display: flex;
  align-items: center;
}

.name-display {
  padding: 6px 0;
}

.name-text {
  font-weight: 600;
  color: var(--text);
}

.amount-input-group {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.amount-input-group .input-group-text {
  background: #f8fafc;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.amount-input-group input {
  border: none;
  flex: 1;
  padding: 6px 10px;
  font-size: 14px;
}

.amount-input-group input:focus {
  outline: none;
  box-shadow: none;
}

/* Hide any per-row formatted amount display (we keep only the editable Amount input per line). Footer totals remain visible */
.rates-table tbody td.text-end.fw-semibold {
  display: none;
}

.custom-name-toggle input[type="checkbox"] {
  display: none;
}

.custom-name-toggle .toggle-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 16px;
  transition: all 0.2s ease;
}

.custom-name-toggle input:checked + .toggle-indicator {
  background: #dbeafe;
  color: #2563eb;
}

.custom-name-toggle:hover .toggle-indicator {
  background: #e2e8f0;
}

/* Search Row */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 14px;
  transition: all 0.2s ease;
}

.search-row:focus-within {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px #dbeafe;
}

.search-icon {
  font-size: 16px;
  color: var(--text-secondary);
}

.search-row input {
  border: 0;
  padding: 4px;
  background: transparent;
  flex: 1;
  font-size: 13px;
  outline: none;
}

.clear-search {
  background: var(--border);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: var(--danger);
  color: white;
}

/* Rate Lines Header */
.rate-lines-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.lines-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-lines-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.line-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #93c5fd;
}

.count-number {
  font-weight: 800;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
}

.data-table th.col-item { width: 35%; }
.data-table th.col-type { width: 15%; }
.data-table th.col-hunting { width: 20%; }
.data-table th.col-days { width: 15%; text-align: center; }
.data-table th.col-action { width: 50px; }

.data-table tbody tr {
  transition: all 0.15s ease;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: var(--border-light);
}

.data-table tbody tr.selected {
  background: #dbeafe;
  border-left: 4px solid #2563eb;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-light);
  vertical-align: middle;
}

.data-table .item-col .item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.data-table .item-col .code {
  font-weight: 700;
  color: var(--text);
  font-size: 13px;
}

.data-table .item-col .name {
  color: var(--text-secondary);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* Type Badges */
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

.type-badge.type-package {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.type-badge.type-trophy {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.type-badge.type-extra {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.type-badge.type-companion {
  background: #f3e8ff;
  color: #6b21a8;
  border: 1px solid #d8b4fe;
}

.type-badge.type-adjustment {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.detail-display {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.action-col {
  text-align: center;
}

.remove-btn {
  width: 30px;
  height: 30px;
  border: 2px solid #fecaca;
  background: #ffffff;
  border-radius: 8px;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #fef2f2;
  border-color: #dc2626;
  transform: scale(1.05);
}

/* Empty State */
.empty-state {
  padding: 48px 24px;
  text-align: center;
  background: #fafbfc;
}

.empty-illustration {
  position: relative;
  margin-bottom: 20px;
}

.empty-icon {
  font-size: 56px;
  opacity: 0.8;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* Details Card */
.details-card {
  padding: 0;
  border: 2px solid #2563eb;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.details-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 700;
  font-size: 14px;
  background: #eff6ff;
  color: #1e40af;
}

.details-icon {
  font-size: 14px;
}

.details-form {
  padding: 18px;
  background: #ffffff;
}

.edit-section {
  display: grid;
  gap: 16px;
}

/* Amount Field */
.amount-field .currency-hint {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 11px;
}

.amount-wrapper {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 12px;
  font-weight: 700;
  color: var(--primary);
  font-size: 12px;
}

.amount-input {
  padding-left: 50px !important;
  font-weight: 700;
  font-size: 16px !important;
  background: #f8fafc;
}

/* Package Builder Section */
.package-builder-section {
  background: #ffffff;
  border: 2px solid #2563eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.15);
}

.package-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #dbeafe;
}

.package-icon {
  font-size: 18px;
}

.package-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
}

.sales-packages-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sales-packages-label .lbl {
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 600;
}

.field-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

.sales-packages-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.package-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
}

.package-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}

.add-package-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  background: #2563eb;
  color: white;
  border: 2px solid #1e40af;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-package-btn:hover:not(:disabled) {
  background: #1e40af;
  transform: scale(1.05);
}

.add-package-btn:disabled {
  background: #cbd5e1;
  border-color: #94a3b8;
  cursor: not-allowed;
}

.selected-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.package-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dbeafe;
  border: 2px solid #3b82f6;
  color: #1e40af;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.package-tag-icon {
  font-size: 12px;
}

.remove-pkg-btn {
  background: none;
  border: none;
  color: #1e40af;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  transition: color 0.2s;
}

.remove-pkg-btn:hover {
  color: #dc2626;
}

.no-packages-hint {
  margin-top: 14px;
  padding: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed var(--border);
  text-align: center;
}

/* Right Panel - Preview */
.preview-content {
  padding: 20px;
  background: #fafbfc;
}

.preview-item-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.preview-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #dbeafe;
  border: 2px solid #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.preview-item-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
  word-break: break-word;
}

.preview-code {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.status-badge.inactive {
  background: #f1f5f9;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.preview-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #dbeafe;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.preview-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.preview-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.unit-badge {
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
  border: 1px solid var(--border);
}

.pricing-section {
  background: #eff6ff;
  border: 2px solid #2563eb;
}

.pricing-section .preview-section-title {
  color: #1e40af;
  border-bottom-color: #bfdbfe;
}

.preview-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px solid #bfdbfe;
}

.price-currency {
  font-size: 16px;
  font-weight: 700;
  color: #2563eb;
}

.price-amount {
  font-size: 32px;
  font-weight: 800;
  color: #1e40af;
  letter-spacing: -1px;
}

/* Empty Preview */
.empty-preview {
  padding: 60px 24px;
  text-align: center;
  background: #fafbfc;
}

.empty-preview-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-preview-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.empty-preview-hint {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 200px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Bottom Actions */
.bottom-actions {
  border-top: 2px solid #e2e8f0;
  padding: 18px 20px;
  display: grid;
  gap: 12px;
  background: #ffffff;
}

/* Text Utilities */
.text-danger {
  color: var(--danger);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

/* Source Select */
.source-new {
  background-color: #f0fdf4 !important;
  border-color: var(--success) !important;
  color: #15803d !important;
}

/* Responsive */
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
  
  .progress-steps {
    display: none;
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
</style>
