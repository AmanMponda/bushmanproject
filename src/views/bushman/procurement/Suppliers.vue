<template>
  <div class="supplier-management-page">
    <div class="d-flex align-items-center mb-3">
      <div>
        <ul class="breadcrumb">
          <li class="breadcrumb-item"><a href="#">Procurement</a></li>
          <li class="breadcrumb-item active">Suppliers</li>
        </ul>
      </div>
    </div>

    <div class="row layout-top-spacing bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="mb-0">Supplier Management</h2>
              </div>
              <!-- Actions moved into table toolbar -->
            </div>

            <StandardDataTable :columns="columns" :data="suppliers" :loading="loading" :filters="tableFilters"
              :custom-filters="customFilters" :actionButtons="supplierActionButtons" :show-date-filters="false"
              :server-side="true" :pagination="pagination" :page-size-options="[10, 15, 25, 50]"
              :default-page-size="tableFilters.limit" @update:filters="handleFiltersUpdate"
              @page-change="handlePageChange">
              <template #code="{ row }">
                <span class="badge bg-warning bg-opacity-20 fs-14px fw-bold text-danger cursor-pointer">
                  <i class="fa fa-hashtag me-1"></i>
                  {{ row.code || '-' }}
                </span>
              </template>
              <template #full_name="{ row }">
                <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-info cursor-pointer">
                  <i class="fa fa-building me-1"></i>
                  {{ row.full_name || row.trading_name || '-' }}
                </span>
              </template>
              <template #business_type="{ row }">
                <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-muted">
                  {{ row.business_type || row.company_profile?.business_type || '-' }}
                </span>
              </template>
              <template #status="{ row }">
                <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold" :class="getStatusTextColor(row.status)">
                  {{ row.status || 'DRAFT' }}
                </span>
              </template>
              <template #contact="{ row }">
                <span class="badge bg-secondary bg-opacity-20 fs-14px fw-bold text-primary">
                  <i class="fa fa-envelope me-1"></i>
                  {{ primaryContact(row) }}
                </span>
              </template>
              <template #actions="{ row }">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary btn-sm" @click="openSupplierModal(row)" title="View Details">
                    <i class="fa fa-eye"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Supplier Modal -->
    <StandardModal ref="supplierModalRef" id="supplier-modal"
      :title="editingSupplier ? 'Edit Supplier' : 'New Supplier'" size="lg" :scrollable="true" :backdrop="'static'"
      :keyboard="false" @hidden="handleSupplierModalHidden">
      <template #header>
        <i class="fa fa-building me-2"></i> {{ editingSupplier ? 'Edit Supplier' : 'New Supplier' }}
      </template>

      <form id="supplier-form" @submit.prevent="saveSupplier">
        <!-- Basic Information -->
        <div class="border-bottom pb-3 mb-4">
          <h6 class="text-primary mb-3"><i class="fa fa-info-circle me-2"></i>Basic Information</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Supplier Code</label>
              <input v-model="supplierForm.code" type="text" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Full Name <span class="text-danger">*</span></label>
              <input v-model="supplierForm.full_name" type="text" class="form-control"
                placeholder="Enter full legal name" required />
            </div>
            <div class="col-md-4">
              <label class="form-label">Trading Name</label>
              <input v-model="supplierForm.trading_name" type="text" class="form-control"
                placeholder="Enter trading name" />
            </div>

            <div class="col-md-12">
              <label class="form-label">Classification Categories <span class="text-danger">*</span></label>
              <Multiselect v-model="supplierCategory.additional_category_ids" :options="classificationCategoryOptions"
                :multiple="true" :close-on-select="false" :custom-label="classificationCategoryLabel"
                placeholder="Select classification categories" />
              <small class="text-muted">Choose at least one classification category for the supplier.</small>
            </div>
          </div>
        </div>

        <!-- Location & Currency -->
        <div class="border-bottom pb-3 mb-4">
          <h6 class="text-primary mb-3"><i class="fa fa-globe me-2"></i>Location & Currency</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Country</label>
              <Multiselect v-model="supplierForm.country_id" :options="countries" label="name" track-by="id"
                placeholder="Select country" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Nationality</label>
              <Multiselect v-model="supplierForm.nationality_id" :options="nationalities" label="name" track-by="id"
                placeholder="Select nationality" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Base Currency</label>
              <Multiselect v-model="supplierForm.base_currency_id" :options="currencies" label="name" track-by="id"
                :custom-label="currencyLabel" placeholder="Select currency" />
            </div>
            <div class="col-md-12">
              <label class="form-label">Notes</label>
              <textarea v-model="supplierForm.notes" rows="2" class="form-control"
                placeholder="Additional notes or comments"></textarea>
            </div>
          </div>
        </div>

        <!-- Company Profile -->
        <div class="border-bottom pb-3 mb-4" v-if="supplierForm.type === 'COMPANY'">
          <h6 class="text-primary mb-3"><i class="fa fa-building me-2"></i>Company Profile</h6>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Legal Name</label>
              <input v-model="supplierForm.company_profile.legal_name" type="text" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Trading Name</label>
              <input v-model="supplierForm.company_profile.trading_name" type="text" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Registration Number</label>
              <input v-model="supplierForm.company_profile.registration_no" type="text" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Registration Country</label>
              <Multiselect v-model="supplierForm.company_profile.registration_country_id" :options="countries"
                label="name" track-by="id" placeholder="Select country" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Incorporation Date</label>
              <input v-model="supplierForm.company_profile.incorporation_date" type="date" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Business Type</label>
              <input v-model="supplierForm.company_profile.business_type" type="text" class="form-control"
                placeholder="e.g., Limited, Sole Proprietor" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Industry Code</label>
              <input v-model="supplierForm.company_profile.industry_code" type="text" class="form-control"
                placeholder="ISIC/NAICS code" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Tax Residency Country</label>
              <Multiselect v-model="supplierForm.company_profile.tax_residency_country_id" :options="countries"
                label="name" track-by="id" placeholder="Select country" />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" @click="closeSupplierModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving" form="supplier-form">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingSupplier ? 'Update Supplier' : 'Create Supplier' }}
          </button>
        </div>
      </template>
    </StandardModal>

    <!-- Supplier Details Modal -->
    <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }"
      tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title">Supplier Details</h5>
              <div class="text-muted small">{{ viewSupplier?.full_name || '-' }}</div>
            </div>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body">
            <ul class="nav nav-tabs mb-3" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">Basic
                  Info</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: activeTab === 'contacts' }"
                  @click="activeTab = 'contacts'">Contacts</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: activeTab === 'identities' }"
                  @click="activeTab = 'identities'">Identities</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: activeTab === 'categories' }"
                  @click="activeTab = 'categories'">Categories</button>
              </li>
            </ul>

            <div v-if="activeTab === 'basic'">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Code</label>
                  <div class="fw-semibold">{{ viewSupplier?.code || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Status</label>
                  <div>
                    <span class="badge" :class="statusBadge(viewSupplier?.status)">
                      {{ viewSupplier?.status || 'DRAFT' }}
                    </span>
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Type</label>
                  <div class="fw-semibold">{{ viewSupplier?.type || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Full Name</label>
                  <div class="fw-semibold">{{ viewSupplier?.full_name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Trading Name</label>
                  <div class="fw-semibold">{{ viewSupplier?.trading_name || '-' }}</div>
                </div>
                <div class="col-md-6" v-if="viewSupplier?.company_profile">
                  <label class="form-label text-muted">Business Type</label>
                  <div class="fw-semibold">{{ viewSupplier?.company_profile?.business_type || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Country</label>
                  <div class="fw-semibold">{{ viewSupplier?.country?.name || '-' }}</div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'contacts'">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Contacts</h6>
                <button class="btn btn-outline-primary btn-sm" @click="addContactToView">
                  <i class="fa fa-plus me-1"></i>Add Contact
                </button>
              </div>
              <div v-for="(contact, index) in viewContacts" :key="index" class="row g-2 align-items-end mb-2">
                <div class="col-md-3">
                  <label class="form-label">Type</label>
                  <Multiselect v-model="contact.type" :options="contactTypeValues" :custom-label="contactTypeLabel"
                    placeholder="Select type" />
                </div>
                <div class="col-md-8">
                  <label class="form-label">Contact</label>
                  <input v-model="contact.contact" type="text" class="form-control" />
                </div>
                <div class="col-md-1 d-flex">
                  <button class="btn btn-outline-danger btn-sm" @click="removeViewContact(index)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="d-flex justify-content-end mt-3">
                <button class="btn btn-primary" @click="saveContacts" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  Save Contacts
                </button>
              </div>
            </div>

            <div v-else-if="activeTab === 'identities'">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Identity Documents</h6>
                <button class="btn btn-outline-primary btn-sm" @click="addIdentityRow">
                  <i class="fa fa-plus me-1"></i>Add Identity
                </button>
              </div>
              <div v-for="(identity, index) in viewIdentities" :key="index" class="row g-2 align-items-end mb-2">
                <div class="col-md-3">
                  <label class="form-label">Type</label>
                  <Multiselect v-if="identityTypeOptions.length" v-model="identity.identity_type_id"
                    :options="identityTypeValues" :custom-label="identityTypeLabel" placeholder="Select type" />
                  <input v-else v-model="identity.identity_type_id" type="number" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Number</label>
                  <input v-model="identity.identity_number" type="text" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Issued Date</label>
                  <input v-model="identity.issued_date" type="date" class="form-control" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Expiry</label>
                  <input v-model="identity.dates.expire_date" type="date" class="form-control" />
                </div>
                <div class="col-md-1 d-flex">
                  <button class="btn btn-outline-danger btn-sm" @click="removeIdentityRow(index, identity)">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="d-flex justify-content-end mt-3">
                <button class="btn btn-primary" @click="saveIdentities" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  Save Identities
                </button>
              </div>
            </div>

            <div v-else-if="activeTab === 'categories'">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Categories</h6>
                <button class="btn btn-outline-primary btn-sm" @click="openCategoryAssignModal">
                  <i class="fa fa-plus me-1"></i>Add Category
                </button>
              </div>
              <StandardDataTable :columns="categoryColumns" :data="viewCategories" :loading="false"
                :disable-search="true" :show-date-filters="false">
                <template #display_name="{ row }">
                  <span class="badge bg-secondary bg-opacity-20 text-dark">
                    <i class="fa fa-tag me-1"></i>{{ row.display_name || row.name }}
                  </span>
                </template>
                <template #parent_category="{ row }">
                  <span v-if="row.parent_id" class="badge bg-info bg-opacity-20 text-info">
                    <i class="fa fa-level-up-alt me-1"></i>
                    {{categories.find((c: any) => c.id === row.parent_id)?.display_name || '--'}}
                  </span>
                  <span v-else class="text-muted">-- Root --</span>
                </template>
                <template #actions="{ row }">
                  <button v-if="row.name !== 'SUPPLIER'" class="btn btn-outline-danger btn-sm" title="Remove"
                    @click="removeCategory(row)">
                    <i class="fa fa-trash"></i>
                  </button>
                </template>
              </StandardDataTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Category Modal -->
    <div class="modal fade" :class="{ show: showAssignCategoryModal }"
      :style="{ display: showAssignCategoryModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assign Category</h5>
            <button type="button" class="btn-close" @click="closeCategoryAssignModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="assignCategory">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Category</label>
                  <Multiselect v-model="assignCategoryForm.category_id" :options="assignableCategoryOptions"
                    :custom-label="assignableCategoryLabel" placeholder="Select category" />
                  <small class="text-muted">Select a supplier category (e.g., Food Suppliers, Spare Parts)</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category Code</label>
                  <input v-model="assignCategoryForm.code" type="text" class="form-control" placeholder="SUPP-001" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Default Payable Account</label>
                  <Multiselect v-model="assignCategoryForm.default_payable_account_id" :options="accountOptions"
                    :custom-label="accountLabel" placeholder="Select account" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Default Receivable Account</label>
                  <Multiselect v-model="assignCategoryForm.default_receivable_account_id" :options="accountOptions"
                    :custom-label="accountLabel" placeholder="Select account" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Effective From</label>
                  <input v-model="assignCategoryForm.effective_from" type="date" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Effective To</label>
                  <input v-model="assignCategoryForm.effective_to" type="date" class="form-control" />
                </div>
                <div class="col-md-6 d-flex align-items-center">
                  <div class="form-check mt-4">
                    <input v-model="assignCategoryForm.is_active" type="checkbox" class="form-check-input"
                      id="assignCategoryActive" />
                    <label class="form-check-label" for="assignCategoryActive">Is Active</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2"
                  @click="closeCategoryAssignModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="assigning">
                  <span v-if="assigning" class="spinner-border spinner-border-sm me-2"></span>
                  Assign Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="(showSupplierModal || showViewModal || showAssignCategoryModal) && !showSupplierModal"
      class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import StandardModal from '@/components/plugins/StandardModal.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
const accountsBaseUrl = import.meta.env.VITE_APP_ACCOUNTS_BASE_URL || apiBaseUrl
const accountsEndpoint = import.meta.env.VITE_APP_ACCOUNTS_COMPANY_VSET_URL
const countriesEndpoint = import.meta.env.VITE_APP_COUNTRIES_URL
const currenciesEndpoint = import.meta.env.VITE_APP_CURRENCIES_URL
const supplierMetadataEndpoint = 'supplier-metadata'

const loading = ref(false)
const saving = ref(false)
const assigning = ref(false)
const metadataLoaded = ref(false)

const suppliers = ref<any[]>([])
const pagination = ref<any>({ current_page: 1, per_page: 15, total: 0, last_page: 1 })

const countries = ref<any[]>([])
const nationalities = ref<any[]>([])
const currencies = ref<any[]>([])
const categories = ref<any[]>([])
const classificationCategories = ref<any[]>([])
const accounts = ref<any[]>([])
const contactTypes = ref<any[]>([])
const identityTypes = ref<any[]>([])
const entityTypes = ref<any[]>([])
const entityStatuses = ref<any[]>([])

const tableFilters = ref<any>({
  search: '',
  status: '',
  country_id: '',
  business_type: '',
  active_only: false,
  limit: 15,
  page: 1
})

const columns = [
  { key: 'code', label: 'CODE', sortable: true, visible: true },
  { key: 'full_name', label: 'SUPPLIER NAME', sortable: true, visible: true },
  { key: 'business_type', label: 'BUSINESS TYPE', sortable: false, visible: true },
  { key: 'status', label: 'STATUS', sortable: false, visible: true },
  { key: 'contact', label: 'CONTACT', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const formatLabel = (value: string) => {
  if (!value) return ''
  return value
    .split('_')
    .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1).toLowerCase() : ''))
    .join(' ')
}

const resolveId = (value: any) => {
  if (!value) return undefined
  return typeof value === 'object' ? value.id : value
}

const findById = (list: any[], value: any) => {
  if (!value) return null
  if (typeof value === 'object') return value
  return list.find((item) => item?.id === value) || null
}

const currencyLabel = (option: any) => {
  if (!option) return ''
  const name = option.name || option.code || ''
  return option.symbol ? `${name} (${option.symbol})` : name
}

const contactTypeOptions = computed(() => {
  if (contactTypes.value.length) {
    return contactTypes.value.map((type: any) => ({
      value: type.name,
      label: type.display_name || formatLabel(type.name || '')
    }))
  }
  return [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'fax', label: 'Fax' },
    { value: 'website', label: 'Website' },
    { value: 'address', label: 'Address' }
  ]
})

const entityTypeOptions = computed(() => {
  if (entityTypes.value.length) {
    return entityTypes.value.map((type: any) => {
      const value = type?.value ?? type?.name ?? type?.code ?? type
      const label = type?.label ?? type?.display_name ?? formatLabel(String(value || ''))
      return { value, label }
    })
  }
  return [
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'COMPANY', label: 'Company' },
    { value: 'ESTATE', label: 'Estate' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'NGO', label: 'NGO' }
  ]
})

const entityStatusOptions = computed(() => {
  if (entityStatuses.value.length) return entityStatuses.value
  return [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_KYC', label: 'Pending KYC' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'BLACKLISTED', label: 'Blacklisted' },
    { value: 'CLOSED', label: 'Closed' }
  ]
})

const identityTypeOptions = computed(() => {
  if (!identityTypes.value.length) return []
  return identityTypes.value.map((type: any) => ({
    value: type.id,
    label: type.description || formatLabel(type.name || '')
  }))
})

const entityTypeValues = computed(() => entityTypeOptions.value.map((type: any) => type.value))
const contactTypeValues = computed(() => contactTypeOptions.value.map((type: any) => type.value))
const identityTypeValues = computed(() => identityTypeOptions.value.map((type: any) => type.value))

const entityTypeLabelMap = computed(() =>
  Object.fromEntries(entityTypeOptions.value.map((type: any) => [type.value, type.label]))
)
const contactTypeLabelMap = computed(() =>
  Object.fromEntries(contactTypeOptions.value.map((type: any) => [type.value, type.label]))
)
const identityTypeLabelMap = computed(() =>
  Object.fromEntries(identityTypeOptions.value.map((type: any) => [type.value, type.label]))
)

const entityTypeLabel = (value: any) =>
  entityTypeLabelMap.value[value] || formatLabel(String(value || ''))
const contactTypeLabel = (value: any) =>
  contactTypeLabelMap.value[value] || formatLabel(String(value || ''))
const identityTypeLabel = (value: any) =>
  identityTypeLabelMap.value[value] || formatLabel(String(value || ''))

const accountOptions = computed(() => accounts.value.map((account: any) => account.id))
const accountLabelMap = computed(() =>
  Object.fromEntries(
    accounts.value.map((account: any) => [
      account.id,
      `${account.name} (${account.code || account.account_number || '-'})`
    ])
  )
)
const accountLabel = (value: any) => accountLabelMap.value[value] || ''

const statusFilterOptions = computed(() => {
  if (entityStatuses.value.length) {
    return [{ label: 'All Statuses', value: '' }, ...entityStatuses.value]
  }
  return [
    { label: 'All Statuses', value: '' },
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'PENDING_KYC', value: 'PENDING_KYC' },
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'SUSPENDED', value: 'SUSPENDED' },
    { label: 'BLACKLISTED', value: 'BLACKLISTED' },
    { label: 'CLOSED', value: 'CLOSED' }
  ]
})

const customFilters = computed(() => [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: statusFilterOptions.value
  },
  {
    key: 'country_id',
    label: 'Country',
    type: 'select',
    options: countries.value.map((c: any) => ({ label: c.name, value: c.id }))
  },
  {
    key: 'business_type',
    label: 'Business Type',
    type: 'select',
    options: businessTypes.value.map((b: string) => ({ label: b, value: b }))
  },
  {
    key: 'active_only',
    label: 'Active Only',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: true }
    ]
  }
])

// Table action buttons (appear next to Filters in StandardDataTable)
const supplierActionButtons = [
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn-outline-secondary',
    method: () => fetchSuppliers()
  },
  {
    label: 'Add Supplier',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openSupplierModal()
  }
]

const showSupplierModal = ref(false)
const showViewModal = ref(false)
const showAssignCategoryModal = ref(false)
const supplierModalRef = ref<any>(null)

const editingSupplier = ref<any>(null)
const viewSupplier = ref<any>(null)
const activeTab = ref('basic')

const supplierForm = reactive<any>({
  full_name: '',
  trading_name: '',
  code: '',
  type: 'COMPANY',
  status: 'ACTIVE',
  country_id: null,
  nationality_id: null,
  base_currency_id: null,
  notes: '',
  company_profile: {
    legal_name: '',
    trading_name: '',
    registration_no: '',
    registration_country_id: '',
    incorporation_date: '',
    business_type: '',
    industry_code: '',
    tax_residency_country_id: null
  },
  contacts: [] as Array<{ type: string; contact: string }>
})

const supplierCategory = reactive<any>({
  default_payable_account_id: '',
  default_receivable_account_id: '',
  code: '',
  additional_category_ids: [] as number[]
})

const viewContacts = ref<any[]>([])
const viewIdentities = ref<any[]>([])
const viewCategories = ref<any[]>([])

const categoryColumns = [
  { key: 'display_name', label: 'CATEGORY', sortable: true, visible: true },
  { key: 'parent_category', label: 'PARENT CATEGORY', sortable: true, visible: true },
  { key: 'pivot.code', label: 'CODE', sortable: false, visible: true },
  { key: 'pivot.effective_from', label: 'EFFECTIVE FROM', sortable: false, visible: true },
  { key: 'pivot.effective_to', label: 'EFFECTIVE TO', sortable: false, visible: true },
  { key: 'actions', label: 'ACTIONS', sortable: false, visible: true }
]

const assignCategoryForm = reactive<any>({
  category_id: '',
  default_payable_account_id: '',
  default_receivable_account_id: '',
  effective_from: '',
  effective_to: '',
  code: '',
  is_active: true
})

const businessTypes = computed(() => {
  const set = new Set<string>()
  suppliers.value.forEach((supplier: any) => {
    const type = supplier.company_profile?.business_type
    if (type) set.add(type)
  })
  return Array.from(set).sort()
})

const supplierCategoryId = computed(() => {
  const preferred = categories.value.find(
    (c: any) =>
      c.name === 'Suppliers' ||
      c.display_name === 'Suppliers' ||
      c.name === 'SUPPLIERS' ||
      c.display_name === 'SUPPLIERS'
  )
  if (preferred?.id) return preferred.id

  const fallback = categories.value.find(
    (c: any) => c.code === 'SUPP' || c.category_code === 'SUPP' || c.name === 'SUPPLIER'
  )
  return fallback?.id || 1
})

const additionalCategories = computed(() =>
  categories.value.filter((c: any) => c.id !== supplierCategoryId.value)
)

const flatClassificationCategories = computed(() => {
  if (!classificationCategories.value.length) return additionalCategories.value
  const flattened: any[] = []
  const walk = (items: any[]) => {
    items.forEach((item: any) => {
      flattened.push(item)
      if (Array.isArray(item.children) && item.children.length) {
        walk(item.children)
      }
    })
  }
  walk(classificationCategories.value)
  return flattened
})

const classificationCategoryOptions = computed(() =>
  flatClassificationCategories.value.map((category: any) => category.id)
)
const assignableCategoryOptions = computed(() =>
  additionalCategories.value.map((category: any) => category.id)
)

const categoryLabelFromList = (value: any, list: any[]) => {
  const category = list.find((item: any) => item.id === value)
  if (!category) return ''
  const name = category.display_name || category.name || ''
  const parentId = category.parent_id || category.parent?.id
  if (!parentId) return name
  const parent =
    list.find((item: any) => item.id === parentId) ||
    categories.value.find((item: any) => item.id === parentId)
  const parentName = parent?.display_name || parent?.name
  return parentName ? `${parentName} > ${name}` : name
}

const classificationCategoryLabel = (value: any) =>
  categoryLabelFromList(value, flatClassificationCategories.value)
const assignableCategoryLabel = (value: any) =>
  categoryLabelFromList(value, additionalCategories.value)

// Build hierarchical category structure for display
const hierarchicalCategories = computed(() => {
  const cats = additionalCategories.value
  const buildTree = (parentId: number | null = null): any[] => {
    return cats
      .filter((cat: any) => cat.parent_id === parentId)
      .map((cat: any) => ({
        ...cat,
        children: buildTree(cat.id)
      }))
  }
  return buildTree(null)
})

// Get root supplier categories (e.g., Food Suppliers, Spare Parts, Fuel)
const rootSupplierCategories = computed(() => {
  return additionalCategories.value.filter((c: any) => !c.parent_id ||
    !additionalCategories.value.some((p: any) => p.id === c.parent_id))
})

// Get child categories for a given parent
const getChildCategories = (parentId: number) => {
  return additionalCategories.value.filter((c: any) => c.parent_id === parentId)
}

function getStatusTextColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-success',
    SUSPENDED: 'text-warning',
    BLACKLISTED: 'text-danger',
    CLOSED: 'text-secondary'
  }
  return map[status] || 'text-info'
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success'
    case 'SUSPENDED':
      return 'bg-warning'
    case 'BLACKLISTED':
      return 'bg-danger'
    case 'CLOSED':
      return 'bg-secondary'
    default:
      return 'bg-info'
  }
}

const primaryContact = (supplier: any) => {
  const contacts = supplier.contacts || []
  const email = contacts.find((c: any) => c.type === 'email')
  const phone = contacts.find((c: any) => c.type === 'phone' || c.type === 'mobile')
  return email?.contact || phone?.contact || '-'
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
}

const normalizeSuppliersResponse = (payload: any) => {
  const paged = payload?.data || payload
  const items = Array.isArray(paged?.data) ? paged.data : Array.isArray(paged) ? paged : []
  const mapped = items.map((item: any) => ({
    id: item.id,
    code: item.code || item.supplier_code || item.supplierCode || '',
    full_name: item.full_name || item.supplier_name || item.name || '',
    trading_name: item.trading_name || '',
    business_type: item.business_type || '',
    status: item.status || 'DRAFT',
    contact: item.contact || '-'
  }))

  suppliers.value = mapped
  pagination.value = {
    current_page: paged?.current_page || 1,
    per_page: paged?.per_page || mapped.length || tableFilters.value.limit,
    total: paged?.total || mapped.length,
    last_page: paged?.last_page || 1
  }
}

const fetchSuppliers = async () => {
  loading.value = true
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}suppliers/table-view`
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })

    const data = response.data?.data || response.data
    normalizeSuppliersResponse(data)
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load suppliers' })
  } finally {
    loading.value = false
  }
}

const fetchSupplierMetadata = async () => {
  if (metadataLoaded.value) return
  try {
    const response = await axios.get(`${apiBaseUrl}${supplierMetadataEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || {}

    countries.value = Array.isArray(data.countries) ? data.countries : []
    nationalities.value = Array.isArray(data.nationalities) ? data.nationalities : []
    currencies.value = Array.isArray(data.currencies) ? data.currencies : []
    categories.value = Array.isArray(data.categories) ? data.categories : []
    classificationCategories.value = Array.isArray(data.classification_categories)
      ? data.classification_categories
      : []
    accounts.value = Array.isArray(data.accounts) ? data.accounts : []
    contactTypes.value = Array.isArray(data.contact_types) ? data.contact_types : []
    identityTypes.value = Array.isArray(data.identity_types) ? data.identity_types : []
    entityTypes.value = Array.isArray(data.entity_types) ? data.entity_types : []
    entityStatuses.value = Array.isArray(data.entity_statuses) ? data.entity_statuses : []
  } catch (error: any) {
    console.error('Failed to load supplier metadata', error)
  } finally {
    metadataLoaded.value = true
  }

  if (!countries.value.length && countriesEndpoint) {
    await fetchCountries()
  }
  if (!currencies.value.length && currenciesEndpoint) {
    await fetchCurrencies()
  }
  if (!categories.value.length) {
    await fetchCategories()
  }
  if (!accounts.value.length) {
    await fetchAccounts()
  }
}

const fetchCountries = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}${countriesEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    countries.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load countries', error)
  }
}

const fetchCurrencies = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}${currenciesEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    currencies.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load currencies', error)
  }
}

const fetchCategories = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}categories`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    categories.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load categories', error)
  }
}

const fetchAccounts = async () => {
  if (!accountsEndpoint) return
  try {
    const response = await axios.get(`${accountsBaseUrl}${accountsEndpoint}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    accounts.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load accounts', error)
  }
}

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
  fetchSuppliers()
}

const handlePageChange = (page: number) => {
  tableFilters.value.page = page
  fetchSuppliers()
}

const resetSupplierForm = () => {
  supplierForm.full_name = ''
  supplierForm.trading_name = ''
  supplierForm.code = ''
  supplierForm.type = 'COMPANY'
  supplierForm.status = 'ACTIVE'
  supplierForm.country_id = null
  supplierForm.nationality_id = null
  supplierForm.base_currency_id = null
  supplierForm.notes = ''
  supplierForm.company_profile = {
    legal_name: '',
    trading_name: '',
    registration_no: '',
    registration_country_id: '',
    incorporation_date: '',
    business_type: '',
    industry_code: '',
    tax_residency_country_id: null
  }
  supplierForm.contacts = []

  supplierCategory.default_payable_account_id = ''
  supplierCategory.default_receivable_account_id = ''
  supplierCategory.code = ''
  supplierCategory.additional_category_ids = []
}

const openSupplierModal = (supplier?: any) => {
  resetSupplierForm()
  editingSupplier.value = supplier || null

  if (supplier) {
    supplierForm.full_name = supplier.full_name || ''
    supplierForm.trading_name = supplier.trading_name || ''
    supplierForm.code = supplier.code || ''
    // Always keep status as ACTIVE for supplier form
    supplierForm.type = supplier.type || 'COMPANY'
    supplierForm.status = 'ACTIVE'
    supplier.company_profile?.tax_residency_country_id ?? supplier.company_profile?.tax_residency_country?.id

    supplierForm.country_id = findById(countries.value, countryId) || null
    supplierForm.nationality_id = findById(nationalities.value, nationalityId) || null
    supplierForm.base_currency_id = findById(currencies.value, currencyId) || null
    supplierForm.notes = supplier.notes || ''
    supplierForm.company_profile = {
      legal_name: supplier.company_profile?.legal_name || '',
      trading_name: supplier.company_profile?.trading_name || '',
      registration_no: supplier.company_profile?.registration_no || '',
      registration_country_id: supplier.company_profile?.registration_country_id || '',
      incorporation_date: supplier.company_profile?.incorporation_date || '',
      business_type: supplier.company_profile?.business_type || '',
      industry_code: supplier.company_profile?.industry_code || '',
      tax_residency_country_id: findById(countries.value, taxResidencyId) || null
    }
    supplierForm.contacts = (supplier.contacts || []).map((c: any) => ({ type: c.type, contact: c.contact }))

    const supplierCat = (supplier.categories || []).find((c: any) => c.id === supplierCategoryId.value)
    supplierCategory.default_payable_account_id = supplierCat?.pivot?.default_payable_account_id || ''
    supplierCategory.default_receivable_account_id = supplierCat?.pivot?.default_receivable_account_id || ''
    supplierCategory.code = supplierCat?.pivot?.code || ''
    supplierCategory.additional_category_ids = (supplier.categories || [])
      .filter((c: any) => c.id !== supplierCategoryId.value)
      .map((c: any) => c.id)
  }

  showSupplierModal.value = true
  nextTick(() => {
    supplierModalRef.value?.show()
  })
}

const closeSupplierModal = () => {
  supplierModalRef.value?.hide()
}

const handleSupplierModalHidden = () => {
  showSupplierModal.value = false
  editingSupplier.value = null
}

const buildCategoryPayload = () => {
  const basePayload: any[] = [
    {
      category_id: supplierCategoryId.value,
      default_payable_account_id: supplierCategory.default_payable_account_id || undefined,
      default_receivable_account_id: supplierCategory.default_receivable_account_id || undefined,
      is_active: true,
      code: supplierCategory.code || undefined
    }
  ]

  supplierCategory.additional_category_ids.forEach((id: number) => {
    basePayload.push({ category_id: id, is_active: true })
  })

  return basePayload
}

const saveSupplier = async () => {
  if (classificationCategories.value.length && !supplierCategory.additional_category_ids.length) {
    Swal.fire({
      icon: 'warning',
      title: 'Classification Required',
      text: 'Please select at least one classification category.'
    })
    return
  }

  saving.value = true
  try {
    const payload: any = {
      full_name: supplierForm.full_name,
      trading_name: supplierForm.trading_name || undefined,
      code: supplierForm.code || undefined,
      type: supplierForm.type || 'COMPANY',
      status: 'ACTIVE',
      country_id: resolveId(supplierForm.country_id),
      nationality_id: resolveId(supplierForm.nationality_id),
      base_currency_id: resolveId(supplierForm.base_currency_id),
      notes: supplierForm.notes || undefined,
      categories: buildCategoryPayload(),
      contacts: supplierForm.contacts.filter((c: any) => c.contact)
    }

    if (supplierForm.type === 'COMPANY') {
      payload.company_profile = {
        ...supplierForm.company_profile,
        tax_residency_country_id: resolveId(supplierForm.company_profile.tax_residency_country_id)
      }
    }

    if (editingSupplier.value?.id) {
      await axios.put(`${apiBaseUrl}company-entities/${editingSupplier.value.id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Supplier updated successfully' })
    } else {
      await axios.post(`${apiBaseUrl}company-entities`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Supplier created successfully' })
    }

    closeSupplierModal()
    fetchSuppliers()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save supplier' })
  } finally {
    saving.value = false
  }
}

const openViewModal = async (supplier: any) => {
  showViewModal.value = true
  activeTab.value = 'basic'
  try {
    const response = await axios.get(`${apiBaseUrl}company-entities/${supplier.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    viewSupplier.value = response.data?.data || response.data || supplier
    viewContacts.value = (viewSupplier.value.contacts || []).map((c: any) => ({ ...c }))
    viewIdentities.value = (viewSupplier.value.identities || []).map((i: any) => ({
      ...i,
      dates: i.dates || {}
    }))
    viewCategories.value = viewSupplier.value.categories || []
  } catch (error: any) {
    console.error('Failed to load supplier details', error)
    viewSupplier.value = supplier
    viewContacts.value = supplier.contacts || []
    viewIdentities.value = supplier.identities || []
    viewCategories.value = supplier.categories || []
  }
}

const closeViewModal = () => {
  showViewModal.value = false
  viewSupplier.value = null
  viewContacts.value = []
  viewIdentities.value = []
  viewCategories.value = []
}

const addContact = () => {
  const fallbackType = contactTypeOptions.value[0]?.value || 'email'
  supplierForm.contacts.push({ type: fallbackType, contact: '' })
}

const removeContact = (index: number) => {
  supplierForm.contacts.splice(index, 1)
}

const addContactToView = () => {
  const fallbackType = contactTypeOptions.value[0]?.value || 'email'
  viewContacts.value.push({ type: fallbackType, contact: '' })
}

const removeViewContact = (index: number) => {
  viewContacts.value.splice(index, 1)
}

const saveContacts = async () => {
  if (!viewSupplier.value?.id) return
  saving.value = true
  try {
    const payload = {
      contacts: viewContacts.value.filter((c: any) => c.contact)
    }
    await axios.put(`${apiBaseUrl}company-entities/${viewSupplier.value.id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Contacts updated' })
    fetchSuppliers()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to update contacts' })
  } finally {
    saving.value = false
  }
}

const addIdentityRow = () => {
  viewIdentities.value.push({
    identity_type_id: '',
    identity_number: '',
    issued_date: '',
    dates: { expire_date: '', issuing_country_id: '', issuing_authority: '' }
  })
}

const removeIdentityRow = async (index: number, identity: any) => {
  if (identity?.id && viewSupplier.value?.id) {
    try {
      await axios.delete(`${apiBaseUrl}company-entities/${viewSupplier.value.id}/identities/${identity.id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Removed', text: 'Identity removed' })
    } catch (error: any) {
      const errors = handleErrors(error?.response?.data || error)
      Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove identity' })
      return
    }
  }
  viewIdentities.value.splice(index, 1)
}

const saveIdentities = async () => {
  if (!viewSupplier.value?.id) return
  saving.value = true
  try {
    const createPromises = viewIdentities.value
      .filter((i: any) => !i.id && i.identity_number)
      .map((identity: any) =>
        axios.post(`${apiBaseUrl}company-entities/${viewSupplier.value.id}/identities`, identity, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        })
      )
    await Promise.all(createPromises)
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Identities updated' })
    openViewModal(viewSupplier.value)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to update identities' })
  } finally {
    saving.value = false
  }
}

const openCategoryAssignModal = () => {
  assignCategoryForm.category_id = ''
  assignCategoryForm.default_payable_account_id = ''
  assignCategoryForm.default_receivable_account_id = ''
  assignCategoryForm.effective_from = ''
  assignCategoryForm.effective_to = ''
  assignCategoryForm.code = ''
  assignCategoryForm.is_active = true
  showAssignCategoryModal.value = true
}

const closeCategoryAssignModal = () => {
  showAssignCategoryModal.value = false
}

const assignCategory = async () => {
  if (!viewSupplier.value?.id || !assignCategoryForm.category_id) return
  assigning.value = true
  try {
    await axios.post(`${apiBaseUrl}company-entities/${viewSupplier.value.id}/categories`, assignCategoryForm, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Assigned', text: 'Category assigned' })
    closeCategoryAssignModal()
    openViewModal(viewSupplier.value)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to assign category' })
  } finally {
    assigning.value = false
  }
}

const removeCategory = async (category: any) => {
  if (!viewSupplier.value?.id) return
  try {
    await axios.delete(`${apiBaseUrl}company-entities/${viewSupplier.value.id}/categories/${category.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Removed', text: 'Category removed' })
    openViewModal(viewSupplier.value)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to remove category' })
  }
}

const toggleStatus = async (supplier: any) => {
  const nextStatus = supplier.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  const result = await Swal.fire({
    title: 'Update Status?',
    text: `Change status to ${nextStatus}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel'
  })

  if (!result.isConfirmed) return

  try {
    await axios.patch(`${apiBaseUrl}company-entities/${supplier.id}/status`, { status: nextStatus }, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Status updated' })
    fetchSuppliers()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to update status' })
  }
}

watch(
  () => tableFilters.value.limit,
  () => {
    tableFilters.value.page = 1
  }
)

onMounted(() => {
  fetchSupplierMetadata()
  fetchSuppliers()
})
</script>

<style scoped>
.supplier-management-page .panel {
  border-radius: 12px;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.nav-tabs .nav-link {
  cursor: pointer;
}

/* Table badge hover effects */
.badge.cursor-pointer {
  transition: all 0.2s ease;
}

.badge.cursor-pointer:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  opacity: 0.9;
}

/* Table row hover */
:deep(tbody tr) {
  transition: background-color 0.2s ease;
}

:deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Action button hover */
:deep(.btn-outline-primary:hover) {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
</style>
