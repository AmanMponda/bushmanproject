<template>
  <div class="vendor-management-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Procurement</a></li>
          <li class="breadcrumb-item active">Vendor Management</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <!-- Header with Add Button -->
            <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h5 class="mb-0">Vendor List</h5>
              <button class="btn btn-primary" @click="showCreateForm">
                <i class="fa fa-plus me-1"></i>Add New Vendor
              </button>
            </div>
            <div class="custom-table p-3">
              <StandardDataTable 
                :columns="columns" 
                :data="items" 
                :loading="loading" 
                :disable-search="false"
                :disable-pagination="false">
                <template #name="slotProps">
                  {{ (slotProps.row as any)?.name || 'N/A' }}
                </template>
                <template #entity_type="slotProps">
                  <span class="badge" :class="getEntityTypeClass((slotProps.row as any)?.entity_type)">
                    {{ (slotProps.row as any)?.entity_type || 'N/A' }}
                  </span>
                </template>
                <template #vendor_category="slotProps">
                  <span class="badge bg-secondary">
                    {{ getCategoryName((slotProps.row as any)?.categories?.[0]?.category_id) }}
                  </span>
                </template>
                <template #country="slotProps">
                  {{ getCountryName((slotProps.row as any)?.country_id) }}
                </template>
                <template #status="slotProps">
                  <span class="badge" :class="getStatusClass((slotProps.row as any)?.status)">
                    {{ (slotProps.row as any)?.status || 'ACTIVE' }}
                  </span>
                </template>
                <template #actions="slotProps">
                  <div class="d-flex gap-1">
                    <button class="btn btn-info btn-sm" title="Edit" @click="editItem(slotProps.row)">
                      <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" title="Delete" @click="confirmDelete(slotProps.row)">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create/Edit Form - V1 MVP (Minimal Fields) -->
    <template v-else>
      <div class="p-2">
        <form @submit.prevent="onSubmit" novalidate>
          <div class="card">
            <div class="card-header">
              <h3 class="fw-bold mb-0">{{ editMode ? 'Edit Vendor' : 'Register New Vendor' }}</h3>
            </div>
            <div class="card-body">
              
              <!-- SECTION 1: BASIC ENTITY INFORMATION (Required Fields) -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3 pb-2 border-bottom">
                  <i class="fa fa-info-circle me-2 text-primary"></i>Basic Entity Information
                </h5>
                
                <div class="row g-3">
                  <!-- Entity Type -->
                  <div class="col-md-6">
                    <label class="form-label">Entity Type <span class="text-danger">*</span></label>
                    <select v-model="form.entity_type" class="form-select" required>
                      <option value="">Select Entity Type</option>
                      <option value="COMPANY">Company</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </select>
                  </div>

                  <!-- Name -->
                  <div class="col-md-6">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.name" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter vendor name" 
                      required 
                    />
                  </div>

                  <!-- Trading Name -->
                  <div class="col-md-6">
                    <label class="form-label">Trading Name</label>
                    <input 
                      v-model="form.trading_name" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter trading name" 
                    />
                  </div>

                  <!-- Entity Code -->
                  <div class="col-md-6">
                    <label class="form-label">Entity Code</label>
                    <input 
                      v-model="form.code" 
                      type="text" 
                      class="form-control bg-light" 
                      placeholder="Auto-generated"
                      readonly
                      disabled
                    />
                  </div>

                  <!-- Country -->
                  <div class="col-md-6">
                    <label class="form-label">Country</label>
                    <select v-model="form.country_id" class="form-select">
                      <option :value="null">Select Country</option>
                      <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                        {{ country.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Base Currency -->
                  <div class="col-md-6">
                    <label class="form-label">Base Currency</label>
                    <select v-model="form.base_currency_id" class="form-select">
                      <option :value="null">Select Currency</option>
                      <option v-for="currency in currencyOptions" :key="currency.id" :value="currency.id">
                        {{ currency.code }} - {{ currency.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Notes -->
                  <div class="col-md-12">
                    <label class="form-label">Notes</label>
                    <textarea 
                      v-model="form.notes" 
                      class="form-control" 
                      rows="3" 
                      placeholder="Enter any additional notes"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- SECTION 2: VENDOR CATEGORY ASSIGNMENT (Required) -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3 pb-2 border-bottom">
                  <i class="fa fa-tag me-2 text-success"></i>Vendor Category Assignment
                </h5>
                
                <div class="row g-3">
                  <!-- Vendor Category -->
                  <div class="col-md-6">
                    <label class="form-label">Vendor Category <span class="text-danger">*</span></label>
                    <select v-model="form.category_id" class="form-select" required>
                      <option :value="null">Select Vendor Category</option>
                      <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Default Payable Account -->
                  <div class="col-md-6">
                    <label class="form-label">Default Payable Account</label>
                    <select v-model="form.default_payable_account_id" class="form-select">
                      <option :value="null">Select Payable Account</option>
                      <option v-for="account in accountOptions" :key="account.id" :value="account.id">
                        {{ account.code }} - {{ account.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
            <div class="card-footer">
              <div class="d-flex gap-2 justify-content-end">
                <button type="submit" class="btn btn-primary" :disabled="saving || !isFormValid">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="fa fa-save me-1"></i>
                  {{ editMode ? 'Update Vendor' : 'Register Vendor' }}
                </button>
                <button type="button" class="btn btn-secondary" @click="cancelForm">
                  <i class="fa fa-times me-1"></i>Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - StandardDataTable slot types not fully defined
import { ref, reactive, computed, onMounted } from 'vue'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import { useVendorStore } from '@/stores/bushman/vendor-store'
import { useToast } from '@/composables/useToast'
import handleErrors from '@/stores/bushman/errorHandler'
import Swal from 'sweetalert2'

const vendorStore = useVendorStore()
const toast = useToast()

// State
const items = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showList = ref(true)
const editMode = ref(false)
const currentVendorId = ref<number | null>(null)

const countryOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const identityTypeOptions = ref<any[]>([])
const categoryOptions = ref<any[]>([])
const accountOptions = ref<any[]>([])

// Group by category for better organization
const groupByCategory = ref('vendor_category')

// Initial form state
const initialFormState = () => ({
  // Basic Entity Information (Required/Optional)
  entity_type: '', // Required: COMPANY or INDIVIDUAL
  name: '', // Required
  trading_name: '', // Optional
  country_id: null, // Optional
  base_currency_id: null, // Optional
  code: '', // Auto-generated
  notes: '', // Optional
  
  // System defaults (not visible to user)
  status: 'ACTIVE',
  is_group: 0,
  parent_entity_id: null,
  
  // Vendor Category (Required)
  category_id: null, // Required
  default_payable_account_id: null, // Optional
  
  // Optional sections (can be added later)
  contact: {
    name: '',
    phone: '',
    email: ''
  },
  identity: {
    identity_type_id: null,
    identity_number: '',
    issuing_country_id: null,
    issued_date: '',
    expiry_date: '',
    issuing_authority: ''
  },
  address: {
    address_line_1: '',
    city: '',
    country_id: null,
    purpose: 'REGISTERED'
  }
})

const form = reactive(initialFormState())

// Table columns
const columns = ref([
  { key: 'name', label: 'Vendor Name', sortable: true, visible: true },
  { key: 'entity_type', label: 'Type', sortable: true, visible: true },
  { key: 'vendor_category', label: 'Category', sortable: true, visible: true },
  { key: 'country', label: 'Country', sortable: false, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true }
])

// Page actions
const pageActions = computed(() => [
  {
    text: 'Add New Vendor',
    variant: 'primary',
    icon: 'fa fa-plus',
    action: showCreateForm
  }
])

// Form validation
const isFormValid = computed(() => {
  // Only validate required fields for V1 MVP
  return form.entity_type && form.name && form.category_id
})

// Helper functions
function getEntityTypeClass(type: string) {
  const classes: Record<string, string> = {
    COMPANY: 'bg-primary',
    INDIVIDUAL: 'bg-info'
  }
  return classes[type] || 'bg-secondary'
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    ACTIVE: 'bg-success',
    INACTIVE: 'bg-warning',
    BLOCKED: 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

function getCategoryName(categoryId: number | undefined) {
  if (!categoryId) return 'N/A'
  const category = categoryOptions.value.find((c: any) => c.id === categoryId)
  return category?.name || 'Unknown'
}

function getCountryName(countryId: number | undefined | null) {
  if (!countryId) return '-'
  const country = countryOptions.value.find((c: any) => c.id === countryId)
  return country?.name || '-'
}

// CRUD Operations
function showCreateForm() {
  editMode.value = false
  currentVendorId.value = null
  Object.assign(form, initialFormState())
  showList.value = false
}

function editItem(vendor: any) {
  editMode.value = true
  currentVendorId.value = vendor.id
  
  // Map vendor data to form
  form.entity_type = vendor.entity_type || ''
  form.name = vendor.name || ''
  form.trading_name = vendor.trading_name || ''
  form.country_id = vendor.country_id || null
  form.base_currency_id = vendor.base_currency_id || null
  form.code = vendor.code || ''
  form.notes = vendor.notes || ''
  form.status = vendor.status || 'ACTIVE'
  
  // Category mapping
  if (vendor.categories && vendor.categories.length > 0) {
    form.category_id = vendor.categories[0].category_id
    form.default_payable_account_id = vendor.categories[0].default_payable_account_id || null
  }
  
  // Optional contact info
  if (vendor.contacts && vendor.contacts.length > 0) {
    const contact = vendor.contacts[0]
    form.contact.name = contact.name || ''
    form.contact.phone = contact.phone || ''
    form.contact.email = contact.email || ''
  }
  
  // Optional identity info
  if (vendor.identities && vendor.identities.length > 0) {
    const identity = vendor.identities[0]
    form.identity.identity_type_id = identity.identity_type_id || null
    form.identity.identity_number = identity.identity_number || ''
    form.identity.issuing_country_id = identity.issuing_country_id || null
    form.identity.issued_date = identity.issued_date || ''
    form.identity.expiry_date = identity.expiry_date || ''
    form.identity.issuing_authority = identity.issuing_authority || ''
  }
  
  // Optional address info
  if (vendor.addresses && vendor.addresses.length > 0) {
    const address = vendor.addresses[0]
    form.address.address_line_1 = address.line1 || ''
    form.address.city = address.city || ''
    form.address.country_id = address.country_id || null
  }
  
  showList.value = false
}

async function onSubmit() {
  if (!isFormValid.value) {
    toast.warning('Please fill in all required fields')
    return
  }

  saving.value = true

  try {
    // Prepare payload according to V1 MVP specs
    const userData = localStorage.getItem('user')
    const currentUserId = userData ? JSON.parse(userData)?.id : null

    const payload: any = {
      // Basic entity info
      type: form.entity_type,
      name: form.name,
      trading_name: form.trading_name || null,
      country_id: form.country_id,
      base_currency_id: form.base_currency_id,
      code: form.code || null, // Will be auto-generated if null
      notes: form.notes || null,
      status: form.status,
      is_group: form.is_group,
      parent_entity_id: form.parent_entity_id,
      user_id: currentUserId,
      
      // Category assignment
      categories: [
        {
          category_id: form.category_id,
          default_payable_account_id: form.default_payable_account_id,
          is_active: 1,
          effective_from: new Date().toISOString().split('T')[0]
        }
      ]
    }

    // Add optional contact if provided
    if (form.contact.name || form.contact.phone || form.contact.email) {
      payload.contacts = [
        {
          name: form.contact.name,
          phone: form.contact.phone,
          email: form.contact.email,
          is_primary: 1
        }
      ]
    }

    // Add optional identity if provided
    if (form.identity.identity_type_id && form.identity.identity_number) {
      payload.identities = [
        {
          identity_type_id: form.identity.identity_type_id,
          identity_number: form.identity.identity_number,
          issuing_country_id: form.identity.issuing_country_id,
          issued_date: form.identity.issued_date || null,
          expiry_date: form.identity.expiry_date || null,
          issuing_authority: form.identity.issuing_authority || null
        }
      ]
    }

    // Add optional address if provided
    if (form.address.address_line_1 || form.address.city) {
      payload.addresses = [
        {
          line1: form.address.address_line_1,
          city: form.address.city,
          country_id: form.address.country_id,
          purpose: form.address.purpose
        }
      ]
    }

    let response
    if (editMode.value && currentVendorId.value) {
      response = await vendorStore.updateVendor(currentVendorId.value, payload)
      toast.success('Vendor updated successfully')
    } else {
      response = await vendorStore.createVendor(payload)
      toast.success('Vendor registered successfully')
    }

    // Refresh list
    await loadVendors()
    cancelForm()
  } catch (error: any) {
    console.error('Error saving vendor:', error)
    handleErrors(error)
    toast.error(error.message || 'Failed to save vendor')
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  Object.assign(form, initialFormState())
  showList.value = true
  editMode.value = false
  currentVendorId.value = null
}

async function confirmDelete(vendor: any) {
  const result = await Swal.fire({
    title: 'Delete Vendor?',
    text: `Are you sure you want to delete "${vendor.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  })

  if (result.isConfirmed) {
    try {
      await vendorStore.deleteVendor(vendor.id)
      toast.success('Vendor deleted successfully')
      await loadVendors()
    } catch (error: any) {
      console.error('Error deleting vendor:', error)
      handleErrors(error)
      toast.error('Failed to delete vendor')
    }
  }
}

// Data loading
async function loadVendors() {
  loading.value = true
  try {
    await vendorStore.getVendors()
    items.value = vendorStore.vendors
  } catch (error: any) {
    console.error('Error loading vendors:', error)
    handleErrors(error)
    toast.error('Failed to load vendors')
  } finally {
    loading.value = false
  }
}

async function loadDropdowns() {
  try {
    // Load countries
    await vendorStore.getCountries()
    countryOptions.value = vendorStore.countries

    // Load currencies
    await vendorStore.getCurrencies()
    currencyOptions.value = vendorStore.currencies

    // Load identity types
    await vendorStore.getIdentityTypes()
    identityTypeOptions.value = vendorStore.identityTypes

    // Load entity categories (filtered for VENDOR type)
    await vendorStore.getEntityCategories()
    // Filter only vendor categories
    categoryOptions.value = vendorStore.entityCategories.filter(
      (cat: any) => cat.type === 'VENDOR' || cat.name?.toLowerCase().includes('vendor')
    )

    // Load accounts
    const accountsResponse = await vendorStore.getAccounts()
    if (accountsResponse.status === 200) {
      accountOptions.value = accountsResponse.data
    }
  } catch (error: any) {
    console.error('Error loading dropdown data:', error)
    handleErrors(error)
  }
}

// Lifecycle
onMounted(async () => {
  await loadVendors()
  await loadDropdowns()
})
</script>

<style scoped>
.vendor-management-page {
  padding: 1rem;
}

.form-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.section-title {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-label small {
  font-weight: 400;
  font-size: 0.85rem;
}

.accordion-button:not(.collapsed) {
  background-color: #e7f3ff;
  color: #0066cc;
}

.accordion-body {
  background-color: #f8f9fa;
}

.badge {
  padding: 0.35rem 0.65rem;
  font-size: 0.85rem;
}

.bg-light {
  background-color: #e9ecef !important;
}
</style>
