<template>
  <FormPageLayout
    title="Create Client"
    icon="fa fa-user"
    :breadcrumbs="[
      { label: 'SALES', to: '/sales' },
      { label: 'CLIENTS', to: '/sales/clients' },
      'CREATE'
    ]"
    layout="single"
  >
    <template #header-actions>
      <button type="button" class="btn btn-outline-secondary" @click="goBack">
        <i class="fa fa-arrow-left me-2"></i>
        Back to Clients
      </button>
    </template>

    <template #center>
      <form @submit.prevent="saveClient">
        <FormCard title="Client Information" icon="fa fa-user" icon-variant="info" variant="bordered">
          <FormSection :columns="3">
            <FormField label="Full Name" required>
              <input v-model="clientForm.full_name" type="text" placeholder="Enter full legal name" required />
            </FormField>
            <FormField label="Country" required>
              <Multiselect
                v-model="clientForm.country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
            <FormField label="Nationality" required>
              <Multiselect
                v-model="clientForm.nationality_id"
                :options="nationalities"
                label="name"
                track-by="id"
                placeholder="Select nationality"
              />
            </FormField>
          </FormSection>

          <FormSection :columns="2">
            <FormField label="Date of Birth" required>
              <div class="vueform-date-wrapper">
                <Vueform size="sm" :display-errors="false" :endpoint="false">
                  <DateElement
                    name="dob"
                    v-model="clientForm.individual_profile.date_of_birth"
                    @change="clientForm.individual_profile.date_of_birth = $event"
                    :display-format="'MMM D, YYYY'"
                    :value-format="'YYYY-MM-DD'"
                    placeholder="Select date of birth..."
                    :add-class="{ DateElement: { input: 'form-control' } }"
                  />
                </Vueform>
              </div>
            </FormField>
            <FormField label="Gender" required>
              <Multiselect
                v-model="clientForm.individual_profile.gender"
                :options="['MALE', 'FEMALE', 'OTHER']"
                placeholder="Select gender"
              />
            </FormField>
            <FormField label="Marital Status" optional>
              <Multiselect
                v-model="clientForm.individual_profile.marital_status"
                :options="['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']"
                placeholder="Select status"
              />
            </FormField>
            <FormField label="Email" optional>
              <input v-model="clientForm.individual_profile.email" type="email" placeholder="Enter email address" />
            </FormField>
            <FormField label="Phone" optional>
              <input v-model="clientForm.individual_profile.phone" type="tel" placeholder="Enter phone number" />
            </FormField>
            <FormField label="Address" optional>
              <input v-model="clientForm.individual_profile.address" type="text" placeholder="Enter address" />
            </FormField>
          </FormSection>
        </FormCard>



        <div class="sticky-footer">
          <FormActions
            :show-cancel="true"
            :show-submit="true"
            cancel-text="Cancel"
            submit-text="Create Client"
            :loading="saving"
            :submit-loading="saving"
            :submit-disabled="saving"
            @cancel="goBack"
            @submit="saveClient"
          />
        </div>
      </form>
    </template>
  </FormPageLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

import handleErrors from '@/stores/bushman/errorHandler'
import { FormActions, FormCard, FormField, FormPageLayout, FormSection } from '@/components/forms'

const router = useRouter()

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
const countriesEndpoint = import.meta.env.VITE_APP_COUNTRIES_URL
const currenciesEndpoint = import.meta.env.VITE_APP_CURRENCIES_URL
const clientMetadataEndpoint = 'client-metadata'

const saving = ref(false)
const metadataLoaded = ref(false)

const countries = ref<any[]>([]) 
const nationalities = ref<any[]>([])
const currencies = ref<any[]>([])
const categories = ref<any[]>([])
const classificationCategories = ref<any[]>([])




const clientForm = reactive<any>({
  full_name: '',
  code: '',
  type: 'INDIVIDUAL',
  status: 'ACTIVE',
  country_id: null,
  nationality_id: null,
  individual_profile: {
    date_of_birth: '',
    gender: 'MALE',
    marital_status: null,
    email: '',
    phone: '',
    address: ''
  }
})

const clientCategory = reactive<any>({
  default_payable_account_id: '',
  default_receivable_account_id: '',
  code: '',
  additional_category_id: null
})

const resolveId = (value: any) => {
  if (!value) return undefined
  return typeof value === 'object' ? value.id : value
}

const currencyLabel = (option: any) => { 
  if (!option) return ''
  const name = option.name || option.code || ''
  return option.symbol ? `${name} (${option.symbol})` : name
}



const effectiveFromNow = () => {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  const seconds = pad(d.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const clientCategoryId = computed(() => {
  const preferred = categories.value.find(
    (c: any) =>
      c.name === 'Clients' ||
      c.display_name === 'Clients' ||
      c.name === 'CLIENTS' ||
      c.display_name === 'CLIENTS' ||
      c.name === 'Customers' ||
      c.display_name === 'Customers' ||
      c.name === 'CUSTOMERS' ||
      c.display_name === 'CUSTOMERS' ||
      c.name === 'CLIENT' ||
      c.name === 'CUSTOMER'
  )
  if (preferred?.id) return preferred.id

  const fallback = categories.value.find(
    (c: any) => c.code === 'CLI' || c.category_code === 'CLI' || c.code === 'CUST' || c.category_code === 'CUST'
  )
  return fallback?.id || 2
})

const additionalCategories = computed(() =>
  categories.value.filter((c: any) => c.id !== clientCategoryId.value)
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

const classificationCategoryLabel = (value: any) => {
  const category = flatClassificationCategories.value.find((item: any) => item.id === value)
  return category?.display_name || category?.name || ''
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
}

const buildCategoryPayload = () => {
  const basePayload: any[] = [
    {
      category_id: clientCategoryId.value,
      default_payable_account_id: clientCategory.default_payable_account_id || undefined,
      default_receivable_account_id: clientCategory.default_receivable_account_id || undefined,
      effective_from: effectiveFromNow(),
      is_active: true
    }
  ]

  if (clientCategory.additional_category_id) {
    basePayload.push({ category_id: clientCategory.additional_category_id, effective_from: effectiveFromNow(), is_active: true })
  }

  return basePayload
}

const saveClient = async () => {






  saving.value = true
  try {
    const contacts: any[] = []
    
    // Build contacts from individual profile or contact person
    if (clientForm.individual_profile.email) {
      contacts.push({ type: 'email', contact: clientForm.individual_profile.email, contactable: true })
    }
    if (clientForm.individual_profile.phone) {
      contacts.push({ type: 'phone', contact: clientForm.individual_profile.phone, contactable: true })
    }
    if (clientForm.individual_profile.address) {
      contacts.push({ type: 'address', contact: clientForm.individual_profile.address, contactable: false })
    }

    const payload: any = {
      full_name: clientForm.full_name,
      type: 'INDIVIDUAL',
      status: 'ACTIVE',
      country_id: resolveId(clientForm.country_id),
      nationality_id: resolveId(clientForm.nationality_id),
      contacts: contacts
    }

    // Add individual profile if present
    const { email, phone, address, ...individualProfile } = clientForm.individual_profile
    if (Object.keys(individualProfile).length || email || phone || address) {
      payload.individual_profile = {
        ...individualProfile,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined
      }
    }



    await axios.post(`${apiBaseUrl}company-entities`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Created', text: 'Client created successfully' })
    router.push({ name: 'sales-clients' })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save client' })
  } finally {
    saving.value = false
  }
}

const fetchClientMetadata = async () => {
  if (metadataLoaded.value) return
  try {
    // Try client-metadata first, fallback to supplier-metadata
    let response
    try {
      response = await axios.get(`${apiBaseUrl}${clientMetadataEndpoint}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
    } catch (e) {
      response = await axios.get(`${apiBaseUrl}supplier-metadata`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
    }
    const data = response.data?.data || response.data || {}

    countries.value = Array.isArray(data.countries) ? data.countries : []
    nationalities.value = Array.isArray(data.nationalities) ? data.nationalities : []
    currencies.value = Array.isArray(data.currencies) ? data.currencies : []
    categories.value = Array.isArray(data.categories) ? data.categories : []
    classificationCategories.value = Array.isArray(data.classification_categories)
      ? data.classification_categories
      : []

  } catch (error: any) {
    console.error('Failed to load client metadata', error)
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

const goBack = () => {
  router.push({ name: 'sales-clients' })
}

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidPhone = (phone: string) => {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  return /^\d{7,15}$/.test(cleaned)
}

onMounted(() => {
  fetchClientMetadata()
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.vueform-date-wrapper :deep(.flatpickr-calendar) {
  position: absolute !important;
  z-index: 9999 !important;
  min-width: 260px !important;
  max-width: 360px !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12) !important;
  border-radius: 12px !important;
}

.vueform-date-wrapper :deep(.flatpickr-innerContainer),
.vueform-date-wrapper :deep(.flatpickr-rContainer),
.vueform-date-wrapper :deep(.dayContainer) {
  width: auto !important;
  min-width: 260px !important;
  max-width: 360px !important;
}

:deep(.multiselect__tags) {
  display: flex !important;
  align-items: center !important;
}

:deep(.multiselect__single) {
  margin-bottom: 0 !important;
}

:deep(.multiselect__placeholder) {
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}

:deep(.multiselect) {
  position: relative !important;
}

:deep(.multiselect__select) {
  position: absolute !important;
  right: 1px !important;
  top: 1px !important;
  bottom: 1px !important;
  width: 40px !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 10 !important;
}

:deep(.multiselect__select::before) {
  position: relative !important;
  top: 0 !important;
  margin-top: 0 !important;
  right: 0 !important;
  border-width: 5px 5px 0 5px !important;
  border-color: #999 transparent transparent transparent !important;
}

:deep(.multiselect__input) {
  margin-bottom: 0 !important;
  padding: 0 !important;
  min-height: auto !important;
}

/* Improved multiselect dropdown styling */
:deep(.multiselect) {
  position: relative !important;
  width: 100% !important;
  font-size: 14px !important;
}

:deep(.multiselect__single) {
  padding: 8px 44px 8px 12px !important;
  font-size: 14px !important;
  line-height: 1.2 !important;
  min-height: 40px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.multiselect__placeholder) {
  color: #6c757d !important;
  font-size: 14px !important;
}

:deep(.multiselect__content) {
  width: 100% !important;
  min-width: 0 !important;
  left: 0 !important;
  right: 0 !important;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12) !important;
  border-radius: 8px !important;
  max-height: 260px !important;
  overflow: auto !important;
  z-index: 9999 !important;
  padding: 4px 0 !important;
}

:deep(.multiselect__option) {
  padding: 10px 12px !important;
  font-size: 14px !important;
}

:deep(.multiselect__option--highlight) {
  background-color: var(--bs-primary, #0d6efd) !important;
  color: #fff !important;
}

:deep(.multiselect__select) {
  right: 8px !important;
  width: 36px !important;
  height: 36px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

:deep(.multiselect__select::before) {
  border-color: #999 transparent transparent transparent !important;
}

.sticky-footer {
  position: sticky;
  bottom: 0;
  background-color: var(--bs-card-bg, #fff);
  padding: 1rem 0;
  z-index: 100;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
  margin-top: 1rem;
}
</style>
