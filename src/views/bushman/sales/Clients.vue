<template>
  <div class="client-management-page">
    <div class="d-flex align-items-center breadcrumb-row">
      <div>
        <ul class="breadcrumb breadcrumbs-uppercase">
          <li class="breadcrumb-item active">CLIENTS</li>
        </ul>
      </div>
    </div>

    <div class="row bg-white rounded">
      <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
        <div class="panel br-6 p-0">
          <div class="custom-table p-3">

            <StandardDataTable :columns="columns" :data="clients" :loading="loading" :filters="tableFilters"
              :custom-filters="customFilters" :actionButtons="clientActionButtons" :show-date-filters="false"
              :server-side="true" :pagination="pagination" :page-size-options="[10, 15, 25, 50, 100]"
              :default-page-size="tableFilters.limit" @update:filters="handleFiltersUpdate"
              @page-change="handlePageChange">
              <template #full_name="{ row }">
                <div>
                  <span class="fw-semibold">{{ toTitleCase(row.full_name) || toTitleCase(row.trading_name) || '-' }}</span>
                  <div v-if="row.nick_name" class="small text-muted">{{ toTitleCase(row.nick_name) }}</div>
                </div>
              </template>
              <template #country="{ row }">
                <span>{{ row.country?.name || '-' }}</span>
              </template>
              <template #contact="{ row }">
                <span class="text-truncate d-inline-block" style="max-width: 160px;">
                  {{ primaryContact(row) }}
                </span>
              </template>
              <template #actions="{ row }">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-info btn-sm" @click="viewClientPage(row)" title="View Details">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary btn-sm" @click="editClientPage(row)" title="Edit Client">
                    <i class="fa fa-edit"></i>
                  </button>
                </div>
              </template>
            </StandardDataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Client Details Modal -->
    <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }"
      tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title">Client Details</h5>
              <div class="text-muted small">{{ viewClient?.full_name || '-' }}</div>
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
            </ul>

            <div v-if="activeTab === 'basic'">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label text-muted">Code</label>
                  <div class="fw-semibold">{{ viewClient?.code || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-muted">Status</label>
                  <div>
                    <span class="badge" :class="statusBadge(viewClient?.status)">
                      {{ viewClient?.status || 'DRAFT' }}
                    </span>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Full Name</label>
                  <div class="fw-semibold">{{ viewClient?.full_name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Nick Name</label>
                  <div class="fw-semibold">{{ viewClient?.nick_name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Country</label>
                  <div class="fw-semibold">{{ viewClient?.country?.name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Nationality</label>
                  <div class="fw-semibold">{{ viewClient?.nationality?.name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Currency</label>
                  <div class="fw-semibold">{{ viewClient?.base_currency?.name || '-' }}</div>
                </div>
                <div v-if="viewClient?.notes" class="col-md-12">
                  <label class="form-label text-muted">Notes</label>
                  <div class="fw-semibold">{{ viewClient?.notes }}</div>
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
                  <select v-model="contact.type" class="form-select">
                    <option v-for="type in contactTypeOptions" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
                <div class="col-md-7">
                  <label class="form-label">Contact</label>
                  <input v-model="contact.contact" type="text" class="form-control" />
                </div>
                <div class="col-md-1">
                  <div class="form-check">
                    <input v-model="contact.contactable" type="checkbox" class="form-check-input" :id="`contactable-${index}`" />
                    <label class="form-check-label" :for="`contactable-${index}`">Active</label>
                  </div>
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
                  <select v-if="identityTypeOptions.length" v-model="identity.identity_type_id" class="form-select">
                    <option v-for="type in identityTypeOptions" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                  <input v-else v-model="identity.identity_type_id" type="number" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Number</label>
                  <input v-model="identity.identity_number" type="text" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Issued Date</label>
                  <Datepicker v-model="identity.issued_date" placeholder="Select date" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Expiry</label>
                  <Datepicker v-model="identity.expire_date" placeholder="Select date" />
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
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Client Modal -->
    <div class="modal fade" :class="{ show: showEditModal }" :style="{ display: showEditModal ? 'block' : 'none' }"
      tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingClient ? 'Edit Client' : 'Add Client' }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveClient">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Full Name <span class="text-danger">*</span></label>
                  <input v-model="clientForm.full_name" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nick Name</label>
                  <input v-model="clientForm.nick_name" type="text" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Client Code</label>
                  <input v-model="clientForm.code" type="text" class="form-control" />
                </div>
                <!-- Type hidden - always INDIVIDUAL for clients -->
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select v-model="clientForm.status" class="form-select">
                    <option v-for="opt in entityStatusOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Country <span class="text-danger">*</span></label>
                  <Multiselect v-model="clientForm.country_id" :options="countryOptions"
                    :custom-label="countryLabel" placeholder="Select Country" :searchable="true"
                    :allow-empty="false" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nationality <span class="text-danger">*</span></label>
                  <Multiselect v-model="clientForm.nationality_id" :options="nationalityOptions"
                    :custom-label="nationalityLabel" placeholder="Select Nationality" :searchable="true"
                    :allow-empty="false" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Base Currency</label>
                  <Multiselect v-model="clientForm.base_currency_id" :options="currencyOptions"
                    :custom-label="currencyLabel" placeholder="Select Currency" :searchable="true" />
                </div>
                <div class="col-md-12">
                  <label class="form-label">Notes</label>
                  <textarea v-model="clientForm.notes" class="form-control" rows="3"></textarea>
                </div>

                <!-- Contacts Section -->
                <div class="col-md-12">
                  <hr>
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Contacts</h6>
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="addContactToForm">
                      <i class="fa fa-plus me-1"></i>Add Contact
                    </button>
                  </div>
                  <div v-for="(contact, index) in clientForm.contacts" :key="index" class="row g-2 align-items-end mb-2">
                    <div class="col-md-3">
                      <label class="form-label">Type</label>
                      <select v-model="contact.type" class="form-select">
                        <option v-for="type in contactTypeOptions" :key="type.value" :value="type.value">
                          {{ type.label }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-7">
                      <label class="form-label">Contact</label>
                      <input v-model="contact.contact" type="text" class="form-control" />
                    </div>
                    <div class="col-md-1">
                      <div class="form-check">
                        <input v-model="contact.contactable" type="checkbox" class="form-check-input" :id="`form-contactable-${index}`" />
                        <label class="form-check-label" :for="`form-contactable-${index}`">Active</label>
                      </div>
                    </div>
                    <div class="col-md-1 d-flex">
                      <button type="button" class="btn btn-outline-danger btn-sm" @click="removeFormContact(index)">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2" @click="closeEditModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ editingClient ? 'Update Client' : 'Create Client' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="(showViewModal || showEditModal)" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import handleErrors from '@/stores/bushman/errorHandler'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import Datepicker from '@/components/plugins/Datepicker.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { toTitleCase } from '@/utils/stringUtils'

const router = useRouter()
const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL

const loading = ref(false)
const saving = ref(false)
const metadataLoaded = ref(false)

const clients = ref<any[]>([])
const pagination = ref<any>({ current_page: 1, per_page: 100, total: 0, last_page: 1 })

const countries = ref<any[]>([])
const nationalities = ref<any[]>([])
const currencies = ref<any[]>([])
const contactTypes = ref<any[]>([])
const identityTypes = ref<any[]>([])
const entityTypes = ref<any[]>([])
const entityStatuses = ref<any[]>([])
const clientCategoryId = ref<number | null>(null)

const tableFilters = ref<any>({
  search: '',
  status: '',
  country_id: '',
  type: '',
  limit: 100,
  page: 1
})

const columns = [
  { key: 'full_name', label: 'CLIENT NAME', sortable: true, visible: true },
  { key: 'country', label: 'COUNTRY', sortable: false, visible: true },
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

const contactTypeOptions = computed(() => {
  if (contactTypes.value.length) {
    return contactTypes.value.map((type: any) => ({
      value: type.name,
      label: type.display_name || formatLabel(type.name || '')
    }))
  }
  return [
    { value: 'Email', label: 'Email' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Fax', label: 'Fax' },
    { value: 'Website', label: 'Website' }
  ]
})

const entityTypeOptions = computed(() => {
  // Restrict to INDIVIDUAL only for clients
  return [
    { value: 'INDIVIDUAL', label: 'Individual' }
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

// Multiselect options and label functions
const countryOptions = computed(() => countries.value.map((c: any) => c.id))
const countryLabelMap = computed(() =>
  Object.fromEntries(countries.value.map((c: any) => [c.id, c.name]))
)
const countryLabel = (value: any) => countryLabelMap.value[value] || ''

const nationalityOptions = computed(() => nationalities.value.map((n: any) => n.id))
const nationalityLabelMap = computed(() =>
  Object.fromEntries(nationalities.value.map((n: any) => [n.id, n.name]))
)
const nationalityLabel = (value: any) => nationalityLabelMap.value[value] || ''

const currencyOptions = computed(() => currencies.value.map((c: any) => c.id))
const currencyLabelMap = computed(() =>
  Object.fromEntries(
    currencies.value.map((c: any) => [c.id, c.symbol ? `${c.name} (${c.symbol})` : c.name])
  )
)
const currencyLabel = (value: any) => currencyLabelMap.value[value] || ''

const statusFilterOptions = computed(() => {
  return [
    { label: 'All Statuses', value: '' },
    ...entityStatusOptions.value
  ]
})

const typeFilterOptions = computed(() => {
  return [
    { label: 'All Types', value: '' },
    ...entityTypeOptions.value
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
    options: [
      { label: 'All Countries', value: '' },
      ...countries.value.map((c: any) => ({ label: c.name, value: c.id }))
    ]
  }
])

const openCreateClientPage = () => {
  router.push({ name: 'sales-clients-create' })
}

const viewClientPage = (client: any) => {
  router.push({ name: 'sales-clients-view', params: { id: client.id } })
}

const editClientPage = (client: any) => {
  router.push({ name: 'sales-clients-edit', params: { id: client.id } })
}

const clientActionButtons = [
  {
    label: 'Refresh',
    icon: 'fa fa-sync-alt',
    class: 'btn-outline-secondary',
    method: () => fetchClients()
  },
  {
    label: 'Add Client',
    icon: 'fa fa-plus',
    class: 'btn-primary',
    method: () => openCreateClientPage()
  }
]

const showViewModal = ref(false)
const showEditModal = ref(false)
const viewClient = ref<any>(null)
const editingClient = ref<any>(null)
const activeTab = ref('basic')

const viewContacts = ref<any[]>([])
const viewIdentities = ref<any[]>([])

const clientForm = ref<any>({
  full_name: '',
  nick_name: '',
  code: '',
  type: 'INDIVIDUAL',
  status: 'DRAFT',
  country_id: null,
  nationality_id: null,
  base_currency_id: null,
  notes: '',
  contacts: []
})

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

const primaryContact = (client: any) => {
  const contacts = client.contacts || []
  const getType = (c: any) => (c.contact_type?.name || c.type || '').toLowerCase()

  // Prefer phone numbers (accepts 'phone', 'phone_number', 'mobile')
  const phone = contacts.find((c: any) => /phone|mobile/i.test(getType(c)) || (typeof c.contact === 'string' && c.contact.replace(/\D/g, '').length >= 7))
  const email = contacts.find((c: any) => /email/i.test(getType(c)))

  return phone?.contact || email?.contact || contacts[0]?.contact || '-'
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
}

const fetchClients = async () => {
  loading.value = true
  try {
    const params: any = { ...tableFilters.value, type: 'INDIVIDUAL' }
    const response = await axios.get(`${apiBaseUrl}entities`, {
      params,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })

    const data = response.data?.data || response.data
    const paged = Array.isArray(data) ? { data } : data
    const allItems = Array.isArray(paged?.data) ? paged.data : Array.isArray(paged) ? paged : []
    
    // Filter to only show INDIVIDUAL type entities (clients), excluding suppliers/companies
    const items = allItems.filter((item: any) => item.type === 'INDIVIDUAL')

    clients.value = items
    pagination.value = {
      current_page: paged?.current_page || 1,
      per_page: paged?.per_page || items.length || tableFilters.value.limit,
      total: paged?.total || items.length,
      last_page: paged?.last_page || 1
    }
  } catch (error: any) {
    handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load clients' })
  } finally {
    loading.value = false
  }
}

const fetchMetadata = async () => {
  if (metadataLoaded.value) return
  try {
    const response = await axios.get(`${apiBaseUrl}entities/creation-metadata`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || {}

    countries.value = Array.isArray(data.countries) ? data.countries : []
    nationalities.value = Array.isArray(data.nationalities) ? data.nationalities : []
    currencies.value = Array.isArray(data.currencies) ? data.currencies : []
    contactTypes.value = Array.isArray(data.contact_types) ? data.contact_types : []
    identityTypes.value = Array.isArray(data.identity_types) ? data.identity_types : []
    entityTypes.value = Array.isArray(data.entity_types) ? data.entity_types : []
    entityStatuses.value = Array.isArray(data.entity_statuses) ? data.entity_statuses : []

    // Find CLIENT category
    const categories = Array.isArray(data.categories) ? data.categories : []
    const clientCategory = categories.find((c: any) => c.category_code === 'CLIENT' || c.code === 'CLIENT')
    clientCategoryId.value = clientCategory?.id || null

    metadataLoaded.value = true
  } catch (error: any) {
    console.error('Failed to load metadata', error)
  }
}

const handleFiltersUpdate = (filters: any) => {
  const merged = { ...tableFilters.value, ...filters }
  const customKeys = customFilters.value.map((f: any) => f.key)
  customKeys.forEach((k: string) => {
    if (!(k in filters)) {
      merged[k] = ''
    }
  })
  if (!('search' in filters)) merged.search = ''
  tableFilters.value = merged
  fetchClients()
}

const handlePageChange = (page: number) => {
  tableFilters.value.page = page
  fetchClients()
}

const openViewModal = async (client: any) => {
  showViewModal.value = true
  activeTab.value = 'basic'
  try {
    const response = await axios.get(`${apiBaseUrl}entities/${client.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    viewClient.value = response.data?.data || response.data || client
    viewContacts.value = viewClient.value.contacts || []
    viewIdentities.value = viewClient.value.identities || []
  } catch (error: any) {
    console.error('Failed to load client details', error)
    viewClient.value = client
    viewContacts.value = client.contacts || []
    viewIdentities.value = client.identities || []
  }
}

const closeViewModal = () => {
  showViewModal.value = false
  viewClient.value = null
  viewContacts.value = []
  viewIdentities.value = []
}

const openCreateModal = () => {
  editingClient.value = null
  clientForm.value = {
    full_name: '',
    nick_name: '',
    code: '',
    type: 'INDIVIDUAL',
    status: 'DRAFT',
    country_id: null,
    nationality_id: null,
    base_currency_id: null,
    notes: '',
    contacts: []
  }
  showEditModal.value = true
}

const openEditModal = async (client: any) => {
  editingClient.value = client
  try {
    const response = await axios.get(`${apiBaseUrl}entities/${client.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || client
    clientForm.value = {
      full_name: data.full_name || '',
      nick_name: data.nick_name || '',
      code: data.code || '',
      type: 'INDIVIDUAL',
      status: data.status || 'DRAFT',
      country_id: data.country_id || data.country?.id || null,
      nationality_id: data.nationality_id || data.nationality?.id || null,
      base_currency_id: data.base_currency_id || data.base_currency?.id || null,
      notes: data.notes || '',
      contacts: (data.contacts || []).map((c: any) => ({
        type: c.type || c.contact_type?.name || 'Email',
        contact: c.contact || '',
        contactable: c.contactable ?? true
      }))
    }
    showEditModal.value = true
  } catch (error: any) {
    console.error('Failed to load client for editing', error)
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load client details' })
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editingClient.value = null
}

const saveClient = async () => {
  saving.value = true
  try {
    const payload = {
      ...clientForm.value,
      category_id: clientCategoryId.value
    }

    if (editingClient.value) {
      await axios.put(`${apiBaseUrl}entities/${editingClient.value.id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Client updated successfully' })
    } else {
      await axios.post(`${apiBaseUrl}entities`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Client created successfully' })
    }

    closeEditModal()
    fetchClients()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save client' })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (client: any) => {
  const result = await Swal.fire({
    title: 'Delete Client?',
    text: `Are you sure you want to delete ${client.full_name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc3545'
  })

  if (!result.isConfirmed) return

  try {
    await axios.delete(`${apiBaseUrl}entities/${client.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Client deleted successfully' })
    fetchClients()
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to delete client' })
  }
}

const addContactToView = () => {
  const fallbackType = contactTypeOptions.value[0]?.value || 'Email'
  viewContacts.value.push({ type: fallbackType, contact: '', contactable: true })
}

const removeViewContact = (index: number) => {
  viewContacts.value.splice(index, 1)
}

const saveContacts = async () => {
  if (!viewClient.value?.id) return
  saving.value = true
  try {
    const payload = {
      contacts: viewContacts.value.filter((c: any) => c.contact)
    }
    await axios.put(`${apiBaseUrl}entities/${viewClient.value.id}`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Contacts updated' })
    fetchClients()
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
    expire_date: ''
  })
}

const removeIdentityRow = async (index: number, identity: any) => {
  if (identity?.id && viewClient.value?.id) {
    try {
      await axios.delete(`${apiBaseUrl}entities/${viewClient.value.id}/identities/${identity.id}`, {
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
  if (!viewClient.value?.id) return
  saving.value = true
  try {
    const createPromises = viewIdentities.value
      .filter((i: any) => !i.id && i.identity_number)
      .map((identity: any) =>
        axios.post(`${apiBaseUrl}entities/${viewClient.value.id}/identities`, identity, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        })
      )
    await Promise.all(createPromises)
    Swal.fire({ icon: 'success', title: 'Updated', text: 'Identities updated' })
    openViewModal(viewClient.value)
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to update identities' })
  } finally {
    saving.value = false
  }
}

const addContactToForm = () => {
  const fallbackType = contactTypeOptions.value[0]?.value || 'Email'
  clientForm.value.contacts.push({ type: fallbackType, contact: '', contactable: true })
}

const removeFormContact = (index: number | string) => {
  const idx = typeof index === 'string' ? parseInt(index, 10) : index
  if (Number.isNaN(idx)) return
  clientForm.value.contacts.splice(idx, 1)
}

onMounted(() => {
  fetchMetadata()
  fetchClients()
})
</script>

<style scoped>
.client-management-page .panel {
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

:deep(.btn-outline-primary:hover) {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Breadcrumb uppercase and spacing */
.breadcrumbs-uppercase,
.breadcrumbs-uppercase .breadcrumb-item,
.breadcrumbs-uppercase a {
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-weight: 600;
}

.breadcrumb-row {
  margin-top: 0.25rem;
  margin-bottom: 0.4rem;
  padding-top: 0;
}
</style>
