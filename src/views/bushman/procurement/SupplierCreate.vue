<template>
  <FormPageLayout
    icon="fa fa-building"
    :title="isEditMode ? 'Edit Supplier' : 'Create Supplier'"
    :breadcrumbs="[
      { label: 'PROCUREMENT', to: '/procurement' },
      { label: 'SUPPLIERS', to: '/procurement/suppliers' },
      isEditMode ? 'EDIT' : 'CREATE'
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
                @update:model-value="(val: any) => (supplierForm.type = val.value)"
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
                :reduce="(cat: any) => cat.id"
                placeholder="Select classification category"
              />
            </FormField>
          </FormSection>

          <template v-if="supplierForm.type !== 'INDIVIDUAL'">
            <FormSection :columns="1">
              <div class="mb-3">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="supplierForm.create_contact_person"
                    id="create_contact_person"
                  />
                  <label class="form-check-label" for="create_contact_person">
                    <strong>Create Contact Person</strong> (Creates a person entity linked to this supplier)
                  </label>
                </div>
              </div>
            </FormSection>
          </template>

          <template v-if="supplierForm.create_contact_person && supplierForm.type !== 'INDIVIDUAL'">
            <FormSection :columns="3">
              <FormField label="Contact Person Name" required>
                <input
                  v-model="supplierForm.contact_person.person_full_name"
                  type="text"
                  placeholder="Enter contact person full name"
                  required
                />
              </FormField>
              <FormField label="Contact Person Country">
                <Multiselect
                  v-model="supplierForm.contact_person.person_country_id"
                  :options="countries"
                  label="name"
                  track-by="id"
                  placeholder="Select country"
                />
              </FormField>
              <FormField label="Contact Person Nationality">
                <Multiselect
                  v-model="supplierForm.contact_person.person_nationality_id"
                  :options="nationalities"
                  label="name"
                  track-by="id"
                  placeholder="Select nationality"
                />
              </FormField>
            </FormSection>
            <FormSection :columns="1">
              <FormField label="Contact Person Notes" optional>
                <textarea
                  v-model="supplierForm.contact_person.person_notes"
                  rows="2"
                  placeholder="Notes about the contact person (e.g., role, department)"
                ></textarea>
              </FormField>
            </FormSection>
          </template>

          <template v-if="supplierForm.type === 'INDIVIDUAL'">
            <FormSection :columns="3">
              <FormField label="Date of Birth" optional>
                <input
                  type="date"
                  class="form-control"
                  v-model="supplierForm.individual_profile.date_of_birth"
                  placeholder="Select date of birth..."
                />
              </FormField>
              <FormField label="Gender" optional>
                <Multiselect
                  v-model="supplierForm.individual_profile.gender"
                  :options="['MALE', 'FEMALE', 'OTHER']"
                  placeholder="Select gender"
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

            <FormSection :columns="3">
              <FormField label="Email" optional>
                <input
                  v-model="supplierForm.individual_profile.email"
                  type="email"
                  placeholder="Enter email address"
                />
              </FormField>
              <FormField label="Phone" optional>
                <input
                  v-model="supplierForm.individual_profile.phone"
                  type="text"
                  placeholder="Enter phone number"
                />
              </FormField>
              <FormField label="Address" optional>
                <input
                  v-model="supplierForm.individual_profile.address"
                  type="text"
                  placeholder="Enter address"
                />
              </FormField>
            </FormSection>
          </template>
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
            <FormField v-if="supplierForm.type !== 'COMPANY'" label="Nationality">
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
            <FormField label="Notes">
              <textarea v-model="supplierForm.notes" rows="2" placeholder="Additional notes or comments"></textarea>
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
                <input
                  type="date"
                  class="form-control"
                  v-model="supplierForm.company_profile.incorporation_date"
                  placeholder="Select incorporation date..."
                />
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
            <FormField label="TIN" optional>
              <input
                v-model="supplierForm.company_profile.tin"
                type="text"
                :disabled="!supplierForm.company_profile.tax_residency_country_id"
                placeholder="Tax Identification Number (TIN) - select Tax Residency Country first"
              />
              <small v-if="!supplierForm.company_profile.tax_residency_country_id" class="text-muted">Select Tax Residency Country first to enter TIN</small>
            </FormField>
          </FormSection>
        </FormCard>

        <div class="sticky-footer">
          <FormActions
            :show-cancel="true"
            :show-submit="true"
            cancel-text="Cancel"
            :submit-text="isEditMode ? 'Update Supplier' : 'Create Supplier'"
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
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import Vueform from '@vueform/vueform'
import { DateElement } from '@vueform/vueform'

import handleErrors from '@/stores/bushman/errorHandler'
import { FormActions, FormCard, FormField, FormPageLayout, FormSection } from '@/components/forms'

const router = useRouter()
const route = useRoute()

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL
const countriesEndpoint = import.meta.env.VITE_APP_COUNTRIES_URL
const currenciesEndpoint = import.meta.env.VITE_APP_CURRENCIES_URL
const supplierMetadataEndpoint = 'supplier-metadata'

const saving = ref(false)
const loading = ref(false)
const metadataLoaded = ref(false)
const isEditMode = ref(false)
const supplierId = ref<number | null>(null)

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
    registration_no: '',
    tin: '',
    registration_country_id: '',
    incorporation_date: '',
    business_type: '',
    industry_code: '',
    tax_residency_country_id: null
  },
  individual_profile: {
    date_of_birth: '',
    gender: null,
    nationality_country_id: null,
    marital_status: null,
    email: '',
    phone: '',
    address: ''
  },
  create_contact_person: false,
  contact_person: {
    person_full_name: '',
    person_country_id: null,
    person_nationality_id: null,
    person_notes: ''
  }
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

    // Build contacts array - only include contact person if enabled
    const contactsPayload: any[] = []
    if (supplierForm.create_contact_person && supplierForm.contact_person.person_full_name) {
      contactsPayload.push({
        type: 'email',
        contact: '',
        contactable: true,
        create_as_entity: true,
        person_full_name: supplierForm.contact_person.person_full_name,
        person_country_id: resolveId(supplierForm.contact_person.person_country_id),
        person_nationality_id: resolveId(supplierForm.contact_person.person_nationality_id),
        person_notes: supplierForm.contact_person.person_notes || undefined
      })
    }

    // Get current user ID from localStorage
    const userData = localStorage.getItem('user')
    const currentUserId = userData ? JSON.parse(userData)?.id : null

    const payload: any = {
      full_name: supplierForm.full_name,
      trading_name: supplierForm.trading_name || undefined,
      code: supplierCode,
      type: supplierForm.type || 'COMPANY',
      status: 'ACTIVE',
      country_id: resolveId(supplierForm.country_id),
      nationality_id: resolveId(supplierForm.nationality_id),
      base_currency_id: resolveId(supplierForm.base_currency_id),
      user_id: currentUserId,
      notes: supplierForm.notes || undefined,
      categories: buildCategoryPayload(),
      contacts: contactsPayload.length > 0 ? contactsPayload : undefined
    }

    if (supplierForm.type === 'COMPANY') {
      payload.company_profile = {
        ...supplierForm.company_profile,
        tin: supplierForm.company_profile.tin || undefined,
        tax_residency_country_id: resolveId(supplierForm.company_profile.tax_residency_country_id)
      }
    }

    if (supplierForm.type === 'INDIVIDUAL') {
      payload.individual_profile = {
        ...supplierForm.individual_profile,
        nationality_country_id: resolveId(supplierForm.individual_profile.nationality_country_id)
      }

      // Build contacts array from individual profile contact fields
      const individualContacts: any[] = []
      if (supplierForm.individual_profile.email) {
        individualContacts.push({
          type: 'email',
          contact: supplierForm.individual_profile.email,
          contactable: true
        })
      }
      if (supplierForm.individual_profile.phone) {
        individualContacts.push({
          type: 'phone',
          contact: supplierForm.individual_profile.phone,
          contactable: true
        })
      }
      if (supplierForm.individual_profile.address) {
        individualContacts.push({
          type: 'address',
          contact: supplierForm.individual_profile.address,
          contactable: true
        })
      }
      if (individualContacts.length > 0) {
        payload.contacts = individualContacts
      }
    }

    if (isEditMode.value && supplierId.value) {
      await axios.put(`${apiBaseUrl}company-entities/${supplierId.value}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Supplier updated successfully' })
    } else {
      await axios.post(`${apiBaseUrl}company-entities`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      Swal.fire({ icon: 'success', title: 'Created', text: 'Supplier created successfully' })
    }
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
  // Fetch real nationalities from settings endpoint
  await fetchNationalities()
}

const fetchNationalities = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}settings/nationalities`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data || []
    nationalities.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Failed to load nationalities', error)
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

const loadSupplier = async () => {
  if (!supplierId.value) return
  
  loading.value = true
  try {
    const response = await axios.get(`${apiBaseUrl}suppliers/${supplierId.value}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    const data = response.data?.data || response.data
    
    // Populate form with loaded data
    supplierForm.full_name = data.full_name || ''
    supplierForm.trading_name = data.trading_name || ''
    supplierForm.code = data.code || ''
    supplierForm.type = data.type || 'COMPANY'
    supplierForm.status = data.status || 'ACTIVE'
    supplierForm.country_id = data.country_id || null
    supplierForm.nationality_id = data.nationality_id || null
    supplierForm.base_currency_id = data.base_currency_id || null
    supplierForm.notes = data.notes || ''
    
    // Load company profile if exists
    if (data.company_profile) {
      supplierForm.company_profile = {
        legal_name: data.company_profile.legal_name || '',
        registration_no: data.company_profile.registration_number || '',
        tin: data.company_profile.tin || '',
        registration_country_id: data.company_profile.registration_country_id || '',
        incorporation_date: data.company_profile.incorporation_date || '',
        business_type: data.company_profile.business_type || '',
        industry_code: data.company_profile.industry_code || '',
        tax_residency_country_id: data.company_profile.tax_residency_country_id || null
      }
    }
    
    // Load individual profile if exists
    if (data.individual_profile) {
      supplierForm.individual_profile = {
        date_of_birth: data.individual_profile.date_of_birth || '',
        gender: data.individual_profile.gender || null,
        nationality_country_id: data.individual_profile.nationality_country_id || null,
        marital_status: data.individual_profile.marital_status || null,
        email: '',
        phone: '',
        address: ''
      }
    }
    
    // Load category if exists
    if (data.entity_categories && data.entity_categories.length > 0) {
      const primaryCategory = data.entity_categories[0]
      supplierCategory.additional_category_id = primaryCategory.category_id
      supplierCategory.code = primaryCategory.code || ''
    }
  } catch (error: any) {
    console.error('Failed to load supplier:', error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load supplier details'
    })
    router.push({ name: 'procurement-suppliers' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'procurement-suppliers' })
}

onMounted(async () => {
  // Check if we're in edit mode
  const id = route.params.id
  if (id) {
    isEditMode.value = true
    supplierId.value = typeof id === 'string' ? parseInt(id) : (Array.isArray(id) ? parseInt(id[0]) : id)
  }
  
  // Load metadata first
  await fetchSupplierMetadata()
  
  // Then load supplier data if editing
  if (isEditMode.value) {
    await loadSupplier()
  }
})
</script>

<style scoped>
/* Fix required asterisk positioning */
:deep(.form-label) {
  display: inline-block;
}

:deep(.form-label .text-danger) {
  margin-left: 0 !important;
  padding-left: 0 !important;
}

:deep(.text-danger) {
  margin-left: 0 !important;
}

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
