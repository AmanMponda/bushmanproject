<template>
  <div class="ps-page chart-of-accounts-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-list"></i></span>
            ACCOUNTING / <span>CHART OF ACCOUNTS</span>
          </div>
          <h1>Chart of Accounts</h1>
          <p class="subtitle">Browse and manage accounts hierarchy</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="exportToPDF">
            <span class="btn-icon"><i class="fa fa-file-pdf"></i></span> PDF
          </button>
          <button class="btn ghost" type="button" @click="exportToExcel">
            <span class="btn-icon"><i class="fa fa-file-excel"></i></span> Excel
          </button>
          <button class="btn ghost" type="button" @click="goBack">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="row layout-top-spacing">
        <div class="col-xl-12">
          <div class="panel">
            <!-- Header Section -->
            <div class="panel-header">
              <div class="panel-title">
                <h5>Account Tree View</h5>
                <p>Select an account to view details</p>
              </div>
              <button class="btn btn-sm btn-add-account" type="button" @click="toggleAddAccountForm">
                <span class="btn-icon"><i class="fa fa-plus"></i></span> Add Account
              </button>
            </div>

            <!-- Content Section -->
            <div class="panel-body">
              <!-- Loading State -->
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading accounts...</p>
              </div>

              <!-- Error State -->
              <div v-else-if="error" class="alert alert-danger" role="alert">
                <i class="fa fa-exclamation-circle me-2"></i>
                <strong>Error loading accounts:</strong> {{ error }}
              </div>

              <!-- Add Account Form (Inline) -->
              <div v-if="showAddAccountForm" class="add-account-form-wrapper">
                <div class="add-account-form-row">
                  <div class="form-group">
                    <label>Account Name</label>
                    <input v-model="newAccountForm.name" type="text" class="form-control" placeholder="Enter account name" />
                  </div>
                  <div class="form-group">
                    <label>Account Code</label>
                    <input v-model="newAccountForm.code" type="text" class="form-control" placeholder="Enter account code" />
                  </div>
                  <div class="form-group">
                    <label>Account Group</label>
                    <select v-model="newAccountForm.account_group_id" class="form-control">
                      <option value="">Select account group</option>
                      <option v-for="group in accountGroups" :key="group.id" :value="group.id">
                        {{ group.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Parent Account</label>
                    <select v-model="newAccountForm.parent_account_id" class="form-control" :disabled="!newAccountForm.account_group_id">
                      <option :value="null">{{ newAccountForm.account_group_id ? 'No parent (Root account)' : 'Select account group first' }}</option>
                      <option v-for="account in selectableAccounts" :key="account.id" :value="account.id">
                        {{ account.code }} - {{ account.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn btn-add" @click="handleCreateAccountInline">
                      <i class="fa fa-check"></i> Add
                    </button>
                    <button type="button" class="btn btn-cancel" @click="toggleAddAccountForm">
                      <i class="fa fa-times"></i> Cancel
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tree View -->
              <div v-if="!loading && !error" class="account-tree-wrapper">
                <div v-if="accountTree.length > 0" class="tree-panel">
                  <!-- @ts-expect-error: AccountTreeSearch component -->
                  <AccountTreeSearch
                    :accounts="accountTree"
                    @select="selectAccount"
                  />
                </div>
                <div v-else class="alert alert-info">
                  No accounts available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AccountTreeSearch from '@/components/AccountTreeSearch.vue'
import { accountService } from '@/services/accountService'
import Swal from 'sweetalert2'

interface Account {
  id: number | string
  code: string
  name: string
  parent_account_id: number | string | null
  children?: Account[]
}

interface AccountGroup {
  id: number
  name: string
}

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const accountTree = ref<Account[]>([])
const accountGroups = ref<AccountGroup[]>([])
const selectedAccount = ref<Account | null>(null)
const showAddAccountForm = ref(false)
const exportLoading = ref(false)
const creatingAccount = ref(false)

// Form data for inline add account
const newAccountForm = ref({
  name: '',
  code: '',
  parent_account_id: null as number | null,
  account_group_id: '' as string | number
})

// Accounts filtered by selected account group
const accountsByGroup = ref<Account[]>([])
const loadingGroupAccounts = ref(false)

// Computed property for company_id
const companyId = computed(() => {
  const activeService = authStore.getActiveService()
  if (activeService?.company_id) return activeService.company_id
  return authStore.companiesIds?.abs_id || 1
})

// Flatten account tree for parent dropdown (filtered by selected account group)
const selectableAccounts = computed(() => {
  // ONLY show accounts from the selected group - no fallback to all accounts
  // This ensures data integrity and forces proper filtering
  const sourcAccounts = newAccountForm.value.account_group_id ? accountsByGroup.value : []
  
  const flattenAccounts = (accounts: Account[]): Account[] => {
    let result: Account[] = []
    for (const account of accounts) {
      result.push(account)
      if (account.children && account.children.length > 0) {
        result = result.concat(flattenAccounts(account.children))
      }
    }
    return result
  }
  return flattenAccounts(sourcAccounts)
})

// Methods
const fetchAccounts = async () => {
  loading.value = true
  error.value = null

  try {
    // Build URL without company_id parameter
    const baseUrl = (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8000/api/v1.0/').replace(/\/$/, '')
    const url = new URL(`${baseUrl}/chart-of-accounts/tree`)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    // Handle both direct array and nested response structure
    accountTree.value = Array.isArray(data) ? data : data.data || []
    
    if (accountTree.value.length === 0) {
      error.value = 'No accounts found for this company'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load accounts'
    console.error('Error fetching accounts:', err)
  } finally {
    loading.value = false
  }
}

const fetchAccountGroups = async () => {
  try {
    accountGroups.value = await accountService.fetchAccountGroups()
  } catch (err) {
    console.error('Error fetching account groups:', err)
  }
}

const fetchAccountsByGroup = async (accountGroupId: number | string) => {
  if (!accountGroupId) {
    accountsByGroup.value = []
    return
  }

  loadingGroupAccounts.value = true
  try {
    const baseUrl = (import.meta.env.VITE_APP_BASE_URL || 'http://localhost:8000/api/v1.0/').replace(/\/$/, '')
    const url = new URL(`${baseUrl}/account-groups/${accountGroupId}/accounts`)

    console.log('📡 Calling API:', url.toString())
    const response = await fetch(url.toString())
    
    const data = await response.json()
    console.log('📥 API Response:', data)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Backend returns { group: {...}, accounts: [...] }
    accountsByGroup.value = Array.isArray(data) ? data : (data.accounts || [])
    console.log('✅ Filtered accounts stored:', accountsByGroup.value)
  } catch (err) {
    console.error('❌ Error fetching accounts by group:', err)
    accountsByGroup.value = []
  } finally {
    loadingGroupAccounts.value = false
  }
}

const selectAccount = (account: Account) => {
  selectedAccount.value = account
}

const toggleAddAccountForm = () => {
  showAddAccountForm.value = !showAddAccountForm.value
  // Reset form when toggling
  if (!showAddAccountForm.value) {
    newAccountForm.value = {
      name: '',
      code: '',
      parent_account_id: null,
      account_group_id: ''
    }
  }
}

const handleCreateAccountInline = async () => {
  try {
    // Validate form
    if (!newAccountForm.value.name || !newAccountForm.value.code || !newAccountForm.value.account_group_id) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields (Name, Code, Account Group)',
        confirmButtonColor: '#2563eb'
      })
      return
    }

    creatingAccount.value = true
    const payload = {
      name: newAccountForm.value.name,
      code: newAccountForm.value.code,
      parent_account_id: newAccountForm.value.parent_account_id,
      account_group_id: Number(newAccountForm.value.account_group_id),
      company_id: companyId.value
    }

    await accountService.createAccount(payload)
    
    // Refresh the tree
    await fetchAccounts()

    // Close form and reset
    showAddAccountForm.value = false
    const accountName = newAccountForm.value.name
    const accountCode = newAccountForm.value.code
    newAccountForm.value = {
      name: '',
      code: '',
      parent_account_id: null,
      account_group_id: ''
    }

    // Show success alert
    await Swal.fire({
      icon: 'success',
      title: 'Account Created!',
      text: `Account "${accountCode} - ${accountName}" has been created successfully.`,
      confirmButtonColor: '#2563eb',
      timer: 3000,
      timerProgressBar: true
    })

    error.value = null
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create account'
    error.value = errorMessage
    
    // Show error alert
    await Swal.fire({
      icon: 'error',
      title: 'Error Creating Account',
      text: errorMessage,
      confirmButtonColor: '#2563eb'
    })
    
    console.error('Error creating account:', err)
  } finally {
    creatingAccount.value = false
  }
}

const openAddAccountModal = () => {
  // Deprecated - using inline form now
}

const handleCreateAccount = async () => {
  // Deprecated - using inline form now
}

const exportToPDF = async () => {
  try {
    exportLoading.value = true
    await accountService.exportPDF(companyId.value as number)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export PDF'
    console.error('Error exporting PDF:', err)
  } finally {
    exportLoading.value = false
  }
}

const exportToExcel = async () => {
  try {
    exportLoading.value = true
    await accountService.exportExcel(companyId.value as number)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export Excel'
    console.error('Error exporting Excel:', err)
  } finally {
    exportLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

// Watch for account group changes to filter parent accounts
watch(() => newAccountForm.value.account_group_id, async (newGroupId) => {
  if (newGroupId) {
    await fetchAccountsByGroup(newGroupId)
    // Reset parent account when group changes
    newAccountForm.value.parent_account_id = null
  } else {
    accountsByGroup.value = []
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAccounts(),
    fetchAccountGroups()
  ])
})
</script>

<style scoped>
.chart-of-accounts-page {
  padding: 1.5rem 0;
}

/* Page Header Styles */
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
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
  margin-bottom: 8px;
}

.crumbs span {
  font-weight: 700;
  color: #2563eb;
}

.crumb-icon {
  font-size: 14px;
}

h1 {
  margin: 6px 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #475569;
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
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid #d0d0d0;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover {
  background: #f5f7fa;
  border-color: #999;
}

.btn.ghost {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border: none;
  color: white;
  padding: 10px 18px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn.ghost:hover {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.5);
  transform: translateY(-2px);
}

.btn.ghost:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.btn-add-account {
  background: #2563eb;
  border: none;
  color: white;
  padding: 8px 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-add-account:hover {
  background: #1e40af;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.5);
  transform: translateY(-2px);
}

/* Panel Styles */
.panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.panel-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.panel-body {
  padding: 20px;
}

/* Tree View */
.account-tree-wrapper {
  max-height: 600px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

/* Add Account Form */
.add-account-form-wrapper {
  background: #f8fafc;
  border: 2px solid #dbeafe;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.add-account-form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  align-items: flex-end;
}

.add-account-form-row .form-group {
  display: flex;
  flex-direction: column;
}

.add-account-form-row label {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.add-account-form-row .form-control {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.add-account-form-row .form-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding-top: 8px;
}

.btn-add {
  background: #2563eb;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add:hover {
  background: #1e40af;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.5);
  transform: translateY(-2px);
}

.btn-add:active {
  transform: translateY(0);
}

.btn-cancel {
  background: #e5e7eb;
  border: none;
  color: #374151;
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-cancel:hover {
  background: #d1d5db;
}

.tree-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-container {
  padding: 0;
  border-collapse: collapse;
}

/* Loading & Error States */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

.alert {
  margin: 0;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
}

.alert-danger {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-info {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

/* Details Section */
.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.bg-success {
  background: #d1fae5;
  color: #065f46;
}

.bg-secondary {
  background: #e5e7eb;
  color: #374151;
}

/* Scrollbar */
.account-tree-wrapper::-webkit-scrollbar {
  width: 8px;
}

.account-tree-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.account-tree-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.account-tree-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  h1 {
    font-size: 24px;
  }

  .account-tree-wrapper {
    max-height: 400px;
  }
}
</style>
