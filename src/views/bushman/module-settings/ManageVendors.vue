<template>
  <div class="vendor-management-page">
    <!-- Breadcrumb -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Module Settings</a></li>
          <li class="breadcrumb-item active">Vendor Management</li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <template v-if="showList">
      <div class="row layout-top-spacing bg-white rounded">
        <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div class="panel br-6 p-0">
            <div class="custom-table p-3">
              <StandardDataTable 
                :columns="columns" 
                :data="items" 
                :loading="loading" 
                :disable-search="false"
                :disable-pagination="false" 
                :action-buttons="pageActions">
                <template #name="slotProps">
                  {{ (slotProps.row as any)?.name || 'N/A' }}
                </template>
                <template #trading_name="slotProps">
                  {{ (slotProps.row as any)?.trading_name || '-' }}
                </template>
                <template #entity_type="slotProps">
                  <span class="badge" :class="getEntityTypeClass((slotProps.row as any)?.entity_type)">
                    {{ (slotProps.row as any)?.entity_type || 'N/A' }}
                  </span>
                </template>
                <template #country="slotProps">
                  {{ (slotProps.row as any)?.country?.name || '-' }}
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

    <!-- Create/Edit Form -->
    <template v-else>
      <div class="p-2">
        <form @submit.prevent="onSubmit" novalidate>
          <div class="card">
            <div class="card-header">
              <h3 class="fw-bold mb-0">{{ editMode ? 'Edit Vendor' : 'Create New Vendor' }}</h3>
            </div>
            <div class="card-body">
              
              <!-- SECTION 1: BASIC ENTITY INFORMATION -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3">
                  <i class="fa fa-info-circle me-2"></i>Basic Entity Information
                </h5>
                
                <div class="row g-3">
                  <!-- Entity Type -->
                  <div class="col-md-4">
                    <label class="form-label">Entity Type <span class="text-danger">*</span></label>
                    <select v-model="form.entity_type" class="form-select" required @change="onEntityTypeChange">
                      <option value="">Select Entity Type</option>
                      <option value="COMPANY">COMPANY</option>
                      <option value="INDIVIDUAL">INDIVIDUAL</option>
                    </select>
                  </div>

                  <!-- Name -->
                  <div class="col-md-4">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.name" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter entity name" 
                      required 
                    />
                  </div>

                  <!-- Trading Name -->
                  <div class="col-md-4">
                    <label class="form-label">Trading Name</label>
                    <input 
                      v-model="form.trading_name" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter trading name (optional)" 
                    />
                  </div>

                  <!-- Country -->
                  <div class="col-md-4">
                    <label class="form-label">Country <span class="text-danger">*</span></label>
                    <select v-model="form.country_id" class="form-select" required>
                      <option :value="null">Select Country</option>
                      <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                        {{ country.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Base Currency -->
                  <div class="col-md-4">
                    <label class="form-label">Base Currency <span class="text-danger">*</span></label>
                    <select v-model="form.base_currency_id" class="form-select" required>
                      <option :value="null">Select Currency</option>
                      <option v-for="currency in currencyOptions" :key="currency.id" :value="currency.id">
                        {{ currency.code }} - {{ currency.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Entity Code (auto-generated, read-only) -->
                  <div class="col-md-4">
                    <label class="form-label">Entity Code</label>
                    <input 
                      v-model="form.code" 
                      type="text" 
                      class="form-control" 
                      placeholder="Auto-generated"
                      readonly
                      disabled
                    />
                    <small class="form-text text-muted">This will be auto-generated by the system</small>
                  </div>

                  <!-- Notes -->
                  <div class="col-md-12">
                    <label class="form-label">Notes</label>
                    <textarea 
                      v-model="form.notes" 
                      class="form-control" 
                      rows="3" 
                      placeholder="Enter any additional notes (optional)"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- SECTION 2: VENDOR CATEGORY ASSIGNMENT -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3">
                  <i class="fa fa-tag me-2"></i>Vendor Category
                </h5>
                
                <div class="row g-3">
                  <!-- Default Payable Account -->
                  <div class="col-md-12">
                    <label class="form-label">Default Payable Account <span class="text-danger">*</span></label>
                    <select v-model="form.default_payable_account_id" class="form-select" required>
                      <option :value="null">Select Default Payable Account</option>
                      <option v-for="account in accountOptions" :key="account.id" :value="account.id">
                        {{ account.code }} - {{ account.name }}
                      </option>
                    </select>
                    <small class="form-text text-muted">Select the account for vendor payables</small>
                  </div>
                </div>
              </div>

              <!-- SECTION 3: CONDITIONAL PROFILE SECTION -->
              <template v-if="form.entity_type">
                <div class="form-section mb-4">
                  <h5 class="section-title mb-3">
                    <i class="fa fa-building me-2"></i>{{ form.entity_type === 'COMPANY' ? 'Company Profile' : 'Individual Profile' }}
                  </h5>
                  
                  <!-- Company Profile -->
                  <template v-if="form.entity_type === 'COMPANY'">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label">Registration Number <span class="text-danger">*</span></label>
                        <input 
                          v-model="form.company_profile.registration_no" 
                          type="text" 
                          class="form-control" 
                          placeholder="Enter registration number" 
                          required 
                        />
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Registration Country <span class="text-danger">*</span></label>
                        <select v-model="form.company_profile.registration_country_id" class="form-select" required>
                          <option :value="null">Select Country</option>
                          <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                            {{ country.name }}
                          </option>
                        </select>
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Legal Name</label>
                        <input 
                          v-model="form.company_profile.legal_name" 
                          type="text" 
                          class="form-control" 
                          placeholder="Enter legal name (optional)" 
                        />
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Incorporation Date</label>
                        <input 
                          v-model="form.company_profile.incorporation_date" 
                          type="date" 
                          class="form-control" 
                        />
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Business Type</label>
                        <input 
                          v-model="form.company_profile.business_type" 
                          type="text" 
                          class="form-control" 
                          placeholder="e.g., LLC, Corporation (optional)" 
                        />
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Tax Residency Country</label>
                        <select v-model="form.company_profile.tax_residency_country_id" class="form-select">
                          <option :value="null">Select Country (optional)</option>
                          <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                            {{ country.name }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </template>

                  <!-- Individual Profile -->
                  <template v-if="form.entity_type === 'INDIVIDUAL'">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label">Date of Birth <span class="text-danger">*</span></label>
                        <input 
                          v-model="form.individual_profile.date_of_birth" 
                          type="date" 
                          class="form-control" 
                          required 
                        />
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Gender <span class="text-danger">*</span></label>
                        <select v-model="form.individual_profile.gender" class="form-select" required>
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Nationality <span class="text-danger">*</span></label>
                        <select v-model="form.individual_profile.nationality_country_id" class="form-select" required>
                          <option :value="null">Select Nationality</option>
                          <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                            {{ country.name }}
                          </option>
                        </select>
                      </div>

                      <div class="col-md-4">
                        <label class="form-label">Marital Status</label>
                        <select v-model="form.individual_profile.marital_status" class="form-select">
                          <option value="">Select Marital Status (optional)</option>
                          <option value="SINGLE">Single</option>
                          <option value="MARRIED">Married</option>
                          <option value="DIVORCED">Divorced</option>
                          <option value="WIDOWED">Widowed</option>
                        </select>
                      </div>
                    </div>
                  </template>
                </div>
              </template>

              <!-- SECTION 4: PRIMARY CONTACT DETAILS -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3">
                  <i class="fa fa-user me-2"></i>Primary Contact
                </h5>
                
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Contact Person Name <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.contact.name" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter contact person name" 
                      required 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Phone Number <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.contact.phone" 
                      type="tel" 
                      class="form-control" 
                      placeholder="Enter phone number" 
                      required 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Email Address <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.contact.email" 
                      type="email" 
                      class="form-control" 
                      placeholder="Enter email address" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <!-- SECTION 5: IDENTIFICATION (LIGHT KYC) -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3">
                  <i class="fa fa-id-card me-2"></i>Identification (Light KYC)
                </h5>
                
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Identity Type <span class="text-danger">*</span></label>
                    <select v-model="form.identity.identity_type_id" class="form-select" required>
                      <option :value="null">Select Identity Type</option>
                      <option v-for="idType in identityTypeOptions" :key="idType.id" :value="idType.id">
                        {{ idType.name }}
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Identity Number <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.identity.identity_number" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter identity number" 
                      required 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Issuing Country <span class="text-danger">*</span></label>
                    <select v-model="form.identity.issuing_country_id" class="form-select" required>
                      <option :value="null">Select Country</option>
                      <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                        {{ country.name }}
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Issued Date</label>
                    <input 
                      v-model="form.identity.issued_date" 
                      type="date" 
                      class="form-control" 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Expiry Date</label>
                    <input 
                      v-model="form.identity.expiry_date" 
                      type="date" 
                      class="form-control" 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Issuing Authority</label>
                    <input 
                      v-model="form.identity.issuing_authority" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter issuing authority (optional)" 
                    />
                  </div>
                </div>
              </div>

              <!-- SECTION 6: ADDRESS -->
              <div class="form-section mb-4">
                <h5 class="section-title mb-3">
                  <i class="fa fa-map-marker-alt me-2"></i>Registered Address
                </h5>
                
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Address Line 1 <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.address.address_line_1" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter address line 1" 
                      required 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">City <span class="text-danger">*</span></label>
                    <input 
                      v-model="form.address.city" 
                      type="text" 
                      class="form-control" 
                      placeholder="Enter city" 
                      required 
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Country <span class="text-danger">*</span></label>
                    <select v-model="form.address.country_id" class="form-select" required>
                      <option :value="null">Select Country</option>
                      <option v-for="country in countryOptions" :key="country.id" :value="country.id">
                        {{ country.name }}
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
                  {{ editMode ? 'Update Vendor' : 'Create Vendor' }}
                </button>
                <button type="button" class="btn btn-secondary" @click="cancelForm">Cancel</button>
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

const countryOptions = ref<any[]>([])
const currencyOptions = ref<any[]>([])
const identityTypeOptions = ref<any[]>([])
const accountOptions = ref<any[]>([])

// Table columns
const columns = ref([
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'trading_name', label: 'Trading Name', sortable: true, visible: true },
  { key: 'entity_type', label: 'Type', sortable: true, visible: true },
  { key: 'country', label: 'Country', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'actions', label: 'Actions', sortable: false, visible: true },
])

// Form data
const form = reactive({
  id: null as number | null,
  entity_type: '',
  name: '',
  trading_name: '',
  country_id: null as number | null,
  base_currency_id: null as number | null,
  code: '',
  notes: '',
  default_payable_account_id: null as number | null,
  company_profile: {
    registration_no: '',
    registration_country_id: null as number | null,
    legal_name: '',
    incorporation_date: '',
    business_type: '',
    tax_residency_country_id: null as number | null,
  },
  individual_profile: {
    date_of_birth: '',
    gender: '',
    nationality_country_id: null as number | null,
    marital_status: '',
  },
  contact: {
    name: '',
    phone: '',
    email: '',
  },
  identity: {
    identity_type_id: null as number | null,
    identity_number: '',
    issuing_country_id: null as number | null,
    issued_date: '',
    expiry_date: '',
    issuing_authority: '',
  },
  address: {
    address_line_1: '',
    city: '',
    country_id: null as number | null,
  },
})

// Computed
const pageActions = computed(() => {
  const actions = []
  if (showList.value) {
    actions.push({
      label: 'Add New Vendor',
      icon: 'fa fa-plus',
      class: 'btn btn-primary',
      method: () => showCreateForm(),
    })
  }
  return actions
})

const isFormValid = computed(() => {
  // Basic fields
  if (!form.entity_type || !form.name || !form.country_id || !form.base_currency_id) {
    return false
  }
  
  // Vendor category
  if (!form.default_payable_account_id) {
    return false
  }

  // Profile validation
  if (form.entity_type === 'COMPANY') {
    if (!form.company_profile.registration_no || !form.company_profile.registration_country_id) {
      return false
    }
  } else if (form.entity_type === 'INDIVIDUAL') {
    if (!form.individual_profile.date_of_birth || !form.individual_profile.gender || !form.individual_profile.nationality_country_id) {
      return false
    }
  }

  // Contact validation
  if (!form.contact.name || !form.contact.phone || !form.contact.email) {
    return false
  }

  // Identity validation
  if (!form.identity.identity_type_id || !form.identity.identity_number || !form.identity.issuing_country_id) {
    return false
  }

  // Address validation
  if (!form.address.address_line_1 || !form.address.city || !form.address.country_id) {
    return false
  }

  return true
})

// Methods
onMounted(async () => {
  await loadVendors()
  await loadDropdownData()
})

async function loadVendors() {
  loading.value = true
  try {
    const response = await vendorStore.getVendors()
    if (response.status === 200) {
      items.value = response.data
    }
  } catch (error) {
    console.error('Failed to load vendors', error)
    toast.init({
      message: 'Failed to load vendors',
      color: 'danger',
    })
  } finally {
    loading.value = false
  }
}

async function loadDropdownData() {
  try {
    // Load countries
    const countriesResponse = await vendorStore.getCountries()
    if (countriesResponse.status === 200) {
      countryOptions.value = countriesResponse.data
    }

    // Load currencies
    const currenciesResponse = await vendorStore.getCurrencies()
    if (currenciesResponse.status === 200) {
      currencyOptions.value = currenciesResponse.data
    }

    // Load identity types
    const identityTypesResponse = await vendorStore.getIdentityTypes()
    if (identityTypesResponse.status === 200) {
      identityTypeOptions.value = identityTypesResponse.data
    }

    // Load accounts
    const accountsResponse = await vendorStore.getAccounts()
    if (accountsResponse.status === 200) {
      accountOptions.value = accountsResponse.data?.data || accountsResponse.data || []
    }
  } catch (error) {
    console.error('Failed to load dropdown data', error)
  }
}

function showCreateForm() {
  editMode.value = false
  resetForm()
  showList.value = false
}

function editItem(rowData: any) {
  editMode.value = true
  form.id = rowData.id
  form.entity_type = rowData.entity_type || ''
  form.name = rowData.name || ''
  form.trading_name = rowData.trading_name || ''
  form.country_id = rowData.country_id
  form.base_currency_id = rowData.base_currency_id
  form.code = rowData.code || ''
  form.notes = rowData.notes || ''
  
  // Load additional data if needed
  // This is simplified - you'd need to fetch full entity details
  showList.value = false
}

function resetForm() {
  form.id = null
  form.entity_type = ''
  form.name = ''
  form.trading_name = ''
  form.country_id = null
  form.base_currency_id = null
  form.code = ''
  form.notes = ''
  form.default_payable_account_id = null
  
  form.company_profile = {
    registration_no: '',
    registration_country_id: null,
    legal_name: '',
    incorporation_date: '',
    business_type: '',
    tax_residency_country_id: null,
  }
  
  form.individual_profile = {
    date_of_birth: '',
    gender: '',
    nationality_country_id: null,
    marital_status: '',
  }
  
  form.contact = {
    name: '',
    phone: '',
    email: '',
  }
  
  form.identity = {
    identity_type_id: null,
    identity_number: '',
    issuing_country_id: null,
    issued_date: '',
    expiry_date: '',
    issuing_authority: '',
  }
  
  form.address = {
    address_line_1: '',
    city: '',
    country_id: null,
  }
}

function onEntityTypeChange() {
  // Clear opposite profile when entity type changes
  if (form.entity_type === 'COMPANY') {
    form.individual_profile = {
      date_of_birth: '',
      gender: '',
      nationality_country_id: null,
      marital_status: '',
    }
  } else if (form.entity_type === 'INDIVIDUAL') {
    form.company_profile = {
      registration_no: '',
      registration_country_id: null,
      legal_name: '',
      incorporation_date: '',
      business_type: '',
      tax_residency_country_id: null,
    }
  }
}

async function onSubmit() {
  if (!isFormValid.value) {
    toast.init({
      message: 'Please fill all required fields',
      color: 'warning',
    })
    return
  }

  if (editMode.value) {
    await updateVendor()
  } else {
    await createVendor()
  }
}

async function createVendor() {
  saving.value = true
  try {
    const payload = buildPayload()
    const response = await vendorStore.createVendor(payload)
    
    if (response.status === 201 || response.status === 200) {
      toast.init({
        message: 'Vendor created successfully',
        color: 'success',
      })
      resetForm()
      showList.value = true
      await loadVendors()
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to create vendor'
    const errors = handleErrors(error)
    toast.init({
      message: errorMessage + (errors.length > 0 ? '\n' + errors.map((err, index) => `${index + 1}. ${err}`).join('\n') : ''),
      color: 'danger',
    })
  } finally {
    saving.value = false
  }
}

async function updateVendor() {
  saving.value = true
  try {
    const payload = buildPayload()
    const response = await vendorStore.updateVendor(form.id!, payload)
    
    if (response.status === 200) {
      toast.init({
        message: 'Vendor updated successfully',
        color: 'success',
      })
      resetForm()
      showList.value = true
      await loadVendors()
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to update vendor'
    const errors = handleErrors(error)
    toast.init({
      message: errorMessage + (errors.length > 0 ? '\n' + errors.map((err, index) => `${index + 1}. ${err}`).join('\n') : ''),
      color: 'danger',
    })
  } finally {
    saving.value = false
  }
}

function buildPayload() {
  const payload: any = {
    entity_type: form.entity_type,
    name: form.name,
    trading_name: form.trading_name || null,
    country_id: form.country_id,
    base_currency_id: form.base_currency_id,
    notes: form.notes || null,
    status: 'ACTIVE',
    is_group: 0,
    parent_entity_id: null,
    
    // Entity category assignment
    entity_categories: [
      {
        category: 'VENDOR',
        default_payable_account_id: form.default_payable_account_id,
        effective_from: new Date().toISOString().split('T')[0],
        is_active: 1,
      },
    ],
    
    // Contact
    contacts: [
      {
        name: form.contact.name,
        phone: form.contact.phone,
        email: form.contact.email,
        is_primary: true,
      },
    ],
    
    // Identity
    identities: [
      {
        identity_type_id: form.identity.identity_type_id,
        identity_number: form.identity.identity_number,
        issued_date: form.identity.issued_date || null,
        identifiable_type: 'ENTITY',
        is_active: 1,
        identity_dates: {
          issuing_country_id: form.identity.issuing_country_id,
          issuing_authority: form.identity.issuing_authority || null,
          expiry_date: form.identity.expiry_date || null,
          is_verified: 0,
        },
      },
    ],
    
    // Address
    addresses: [
      {
        address_line_1: form.address.address_line_1,
        city: form.address.city,
        country_id: form.address.country_id,
        address_purpose: 'REGISTERED',
      },
    ],
  }

  // Add profile based on entity type
  if (form.entity_type === 'COMPANY') {
    payload.company_profile = {
      registration_no: form.company_profile.registration_no,
      registration_country_id: form.company_profile.registration_country_id,
      legal_name: form.company_profile.legal_name || null,
      incorporation_date: form.company_profile.incorporation_date || null,
      business_type: form.company_profile.business_type || null,
      tax_residency_country_id: form.company_profile.tax_residency_country_id || null,
    }
  } else if (form.entity_type === 'INDIVIDUAL') {
    payload.individual_profile = {
      date_of_birth: form.individual_profile.date_of_birth,
      gender: form.individual_profile.gender,
      nationality_country_id: form.individual_profile.nationality_country_id,
      marital_status: form.individual_profile.marital_status || null,
    }
  }

  return payload
}

function cancelForm() {
  resetForm()
  showList.value = true
}

async function confirmDelete(rowData: any) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete vendor "${rowData.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
  })

  if (result.isConfirmed) {
    await deleteVendor(rowData.id)
  }
}

async function deleteVendor(id: number) {
  try {
    const response = await vendorStore.deleteVendor(id)
    if (response.status === 200 || response.status === 204) {
      toast.init({
        message: 'Vendor deleted successfully',
        color: 'success',
      })
      await loadVendors()
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to delete vendor'
    const errors = handleErrors(error)
    toast.init({
      message: errorMessage + (errors.length > 0 ? '\n' + errors.map((err, index) => `${index + 1}. ${err}`).join('\n') : ''),
      color: 'danger',
    })
  }
}

function getEntityTypeClass(type: string) {
  return type === 'COMPANY' ? 'bg-primary' : 'bg-info'
}

function getStatusClass(status: string) {
  return status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'
}
</script>

<style scoped>
.form-section {
  border-left: 3px solid #4169E1;
  padding-left: 1rem;
}

.section-title {
  color: #4169E1;
  font-weight: 600;
}
</style>
