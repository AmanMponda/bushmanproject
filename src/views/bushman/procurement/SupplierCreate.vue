<template>
  <FormPageLayout
    icon="fa fa-building"
    :breadcrumbs="[
      { label: 'PROCUREMENT', to: '/procurement' },
      { label: 'SUPPLIERS', to: '/procurement/suppliers' },
      'CREATE'
    ]"
    layout="single"
  >
    <template #header-actions>
      <button type="button" class="btn btn-outline-secondary" @click="goBack">
        <i class="fa fa-arrow-left me-2"></i>
        Back to Suppliers
      </button>
    </template>

    <template #center>
      <form @submit.prevent="saveSupplier">
        <FormCard title="Basic Information" icon="fa fa-info-circle" icon-variant="info" variant="bordered">
          <FormSection :columns="3">
            <FormField label="Supplier Type" required>
              <Multiselect
                :model-value="entityTypes.find((t) => t.value === supplierForm.type)"
                :options="entityTypes"
                label="label"
                track-by="value"
                :searchable="false"
                :allow-empty="false"
                placeholder="Select type"
                @update:model-value="(val) => (supplierForm.type = val.value)"
              />
            </FormField>
            <FormField label="Full Name" required>
              <input v-model="supplierForm.full_name" type="text" placeholder="Enter full legal name" required />
            </FormField>
            <FormField label="Trading Name" optional>
              <input v-model="supplierForm.trading_name" type="text" placeholder="Enter trading name" />
            </FormField>
          </FormSection>

          <FormSection :columns="1">
            <FormField
              label="Classification Category"
              required
              hint="Choose a classification category for the supplier."
            >
              <Multiselect
                v-model="supplierCategory.additional_category_id"
                :options="flatClassificationCategories"
                :multiple="false"
                :close-on-select="true"
                label="display_name"
                track-by="id"
                :reduce="(cat) => cat.id"
                placeholder="Select classification category"
              />
            </FormField>
          </FormSection>
        </FormCard>

        <FormCard title="Location & Currency" icon="fa fa-globe" icon-variant="info" variant="bordered">
          <FormSection :columns="3">
            <FormField label="Country">
              <Multiselect
                v-model="supplierForm.country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
            <FormField label="Nationality">
              <Multiselect
                v-model="supplierForm.nationality_id"
                :options="nationalities"
                label="name"
                track-by="id"
                placeholder="Select nationality"
              />
            </FormField>
            <FormField label="Base Currency">
              <Multiselect
                v-model="supplierForm.base_currency_id"
                :options="currencies"
                label="name"
                track-by="id"
                :custom-label="currencyLabel"
                placeholder="Select currency"
              />
            </FormField>
          </FormSection>

          <FormSection :columns="1">
            <FormField label="Notes" optional>
              <textarea v-model="supplierForm.notes" rows="2" placeholder="Additional notes or comments"></textarea>
            </FormField>
          </FormSection>
        </FormCard>

        <FormCard
          v-if="supplierForm.type === 'INDIVIDUAL'"
          title="Individual Profile"
          icon="fa fa-user"
          icon-variant="info"
          variant="bordered"
        >
          <FormSection :columns="2">
            <FormField label="Date of Birth" required>
              <div class="vueform-date-wrapper">
                <Vueform size="sm" :display-errors="false" :endpoint="false">
                  <DateElement
                    name="dob"
                    v-model="supplierForm.individual_profile.date_of_birth"
                    @change="supplierForm.individual_profile.date_of_birth = $event"
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
                v-model="supplierForm.individual_profile.gender"
                :options="['MALE', 'FEMALE', 'OTHER']"
                placeholder="Select gender"
              />
            </FormField>
            <FormField label="Nationality Country" required>
              <Multiselect
                v-model="supplierForm.individual_profile.nationality_country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
            <FormField label="Marital Status" optional>
              <Multiselect
                v-model="supplierForm.individual_profile.marital_status"
                :options="['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']"
                placeholder="Select status"
              />
            </FormField>
          </FormSection>
        </FormCard>

        <FormCard
          v-if="supplierForm.type === 'COMPANY'"
          title="Company Profile"
          icon="fa fa-building"
          icon-variant="info"
          variant="bordered"
        >
          <FormSection :columns="2">
            <FormField label="Legal Name" optional>
              <input v-model="supplierForm.company_profile.legal_name" type="text" />
            </FormField>
            <FormField label="Trading Name" optional>
              <input v-model="supplierForm.company_profile.trading_name" type="text" />
            </FormField>
            <FormField label="Registration Number" optional>
              <input v-model="supplierForm.company_profile.registration_no" type="text" />
            </FormField>
            <FormField label="Registration Country" optional>
              <Multiselect
                v-model="supplierForm.company_profile.registration_country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
            <FormField label="Incorporation Date" optional>
              <div class="vueform-date-wrapper">
                <Vueform size="sm" :display-errors="false" :endpoint="false">
                  <DateElement
                    name="incorporation_date"
                    v-model="supplierForm.company_profile.incorporation_date"
                    @change="supplierForm.company_profile.incorporation_date = $event"
                    :display-format="'MMM D, YYYY'"
                    :value-format="'YYYY-MM-DD'"
                    placeholder="Select incorporation date..."
                    :add-class="{ DateElement: { input: 'form-control' } }"
                  />
                </Vueform>
              </div>
            </FormField>
            <FormField label="Business Type" optional>
              <input v-model="supplierForm.company_profile.business_type" type="text" placeholder="e.g., Limited" />
            </FormField>
            <FormField label="Industry Code" optional>
              <input v-model="supplierForm.company_profile.industry_code" type="text" placeholder="ISIC/NAICS code" />
            </FormField>
            <FormField label="Tax Residency Country" optional>
              <Multiselect
                v-model="supplierForm.company_profile.tax_residency_country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
          </FormSection>
        </FormCard>

        <FormCard title="Contacts" icon="fa fa-address-book" icon-variant="info" variant="bordered">
          <FormSection v-for="(contact, index) in supplierForm.contacts" :key="index" :columns="3">
            <FormField label="Type" required>
              <Multiselect
                :model-value="contactTypes.find((t) => t.name === contact.type)"
                :options="contactTypes"
                label="name"
                track-by="name"
                :searchable="false"
                :allow-empty="false"
                placeholder="Select type"
                :preselect-first="true"
                @update:model-value="(val) => (contact.type = val.name)"
              />
            </FormField>
            <FormField label="Contact Detail" required>
              <div class="d-flex gap-2">
                <input
                  v-model="contact.contact"
                  type="text"
                  placeholder="Email, Phone, Address, etc."
                  class="form-control"
                  required
                />
              </div>
            </FormField>
            <div class="d-flex align-items-end mb-3">
              <div class="form-check me-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="contact.contactable"
                  :id="`contactable-${index}`"
                />
                <label class="form-check-label" :for="`contactable-${index}`"> Contactable </label>
              </div>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm ms-auto"
                @click="removeContact(index)"
                v-if="supplierForm.contacts.length > 1"
              >
                <i class="fa fa-trash"></i>
              </button>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm ms-2"
                @click="addContact"
                v-if="index === supplierForm.contacts.length - 1"
              >
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </FormSection>
          <div v-if="supplierForm.contacts.length === 0" class="text-center p-3">
            <button type="button" class="btn btn-outline-primary btn-sm" @click="addContact">
              <i class="fa fa-plus me-1"></i> Add Contact
            </button>
          </div>
        </FormCard>

        <div class="sticky-footer">
          <FormActions
            :show-cancel="true"
            :show-submit="true"
            cancel-text="Cancel"
            submit-text="Create Supplier"
            :loading="saving"
            :submit-loading="saving"
            :submit-disabled="saving"
            @cancel="goBack"
            @submit="saveSupplier"
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
const supplierMetadataEndpoint = 'supplier-metadata'

const saving = ref(false)
const metadataLoaded = ref(false)

const countries = ref<any[]>([])
const nationalities = ref<any[]>([])
const currencies = ref<any[]>([])
const categories = ref<any[]>([])
const classificationCategories = ref<any[]>([])
const entityTypes = ref<any[]>([])
const contactTypes = ref<any[]>([])


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
  individual_profile: {
    date_of_birth: '',
    gender: 'MALE',
    nationality_country_id: null,
    marital_status: null
  },
  contacts: [{ type: '', contact: '', contactable: true }] as Array<{
    type: string
    contact: string
    contactable: boolean
  }>
})

const supplierCategory = reactive<any>({
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
  // return format 'YYYY-MM-DD HH:mm:ss' which MySQL accepts
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

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
  const basePayload: any[] = []

  // Extract ID if it's an object, otherwise use the value directly
  if (supplierCategory.additional_category_id) {
    const categoryId = typeof supplierCategory.additional_category_id === 'object' && supplierCategory.additional_category_id !== null
      ? supplierCategory.additional_category_id.id
      : supplierCategory.additional_category_id
    
    if (categoryId) {
      basePayload.push({ 
        category_id: categoryId, 
        effective_from: effectiveFromNow(), 
        is_active: true 
      })
    }
  }

  return basePayload
}

const saveSupplier = async () => {
  if (classificationCategories.value.length && !supplierCategory.additional_category_id) {
    Swal.fire({
      icon: 'warning',
      title: 'Classification Required',
      text: 'Please select a classification category.'
    })
    return
  }

  const contactErrors: string[] = []
  supplierForm.contacts.forEach((contact: any, index: number) => {
    if (!contact.type) {
      contactErrors.push(`Contact ${index + 1}: Type is required`)
    }
    if (!contact.contact || contact.contact.trim() === '') {
      contactErrors.push(`Contact ${index + 1}: Value is required`)
    }
    if (contact.type === 'email' && !isValidEmail(contact.contact)) {
      contactErrors.push(`Contact ${index + 1}: Invalid email format`)
    }
    if ((contact.type === 'phone' || contact.type === 'mobile') && !isValidPhone(contact.contact)) {
      contactErrors.push(`Contact ${index + 1}: Invalid phone format`)
    }
  })

  if (contactErrors.length) {
    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      html: contactErrors.join('<br>')
    })
    return
  }

  saving.value = true
  try {
    // Generate unique code if not provided
    let supplierCode = supplierForm.code?.trim() || ''
    if (!supplierCode) {
      // Generate code from trading_name or full_name + timestamp
      const baseName = (supplierForm.trading_name || supplierForm.full_name || 'SUPP').toUpperCase()
      const prefix = baseName.substring(0, 4).replace(/[^A-Z0-9]/g, '')
      const timestamp = Date.now().toString().slice(-6)
      supplierCode = `${prefix}-${timestamp}`
    }

    const payload: any = {
      full_name: supplierForm.full_name,
      trading_name: supplierForm.trading_name || undefined,
      code: supplierCode,
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

    if (supplierForm.type === 'INDIVIDUAL') {
      payload.individual_profile = {
        ...supplierForm.individual_profile,
        nationality_country_id: resolveId(supplierForm.individual_profile.nationality_country_id)
      }
    }

    await axios.post(`${apiBaseUrl}company-entities`, payload, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    Swal.fire({ icon: 'success', title: 'Created', text: 'Supplier created successfully' })
    router.push({ name: 'procurement-suppliers' })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save supplier' })
  } finally {
    saving.value = false
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
    contactTypes.value = Array.isArray(data.contact_types) 
      ? data.contact_types.filter((ct: any) => ct.name !== 'phone_number') 
      : []
    entityTypes.value = Array.isArray(data.entity_types)
      ? data.entity_types
      : [
          { value: 'INDIVIDUAL', label: 'Individual' },
          { value: 'COMPANY', label: 'Company' },
          { value: 'ESTATE', label: 'Estate' },
          { value: 'GOVERNMENT', label: 'Government' },
          { value: 'NGO', label: 'NGO' }
        ]
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
  router.push({ name: 'procurement-suppliers' })
}

const addContact = () => {
  supplierForm.contacts.push({ type: '', contact: '', contactable: true })
}

const removeContact = (index: number) => {
  supplierForm.contacts.splice(index, 1)
}

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidPhone = (phone: string) => {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  return /^\d{7,15}$/.test(cleaned)
}

onMounted(() => {
  fetchSupplierMetadata()
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
  /* min-height: 40px !important; */
  display: flex !important;
  align-items: center !important;
  /* padding-top: 6px !important; */
  /* padding-bottom: 6px !important; */
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
