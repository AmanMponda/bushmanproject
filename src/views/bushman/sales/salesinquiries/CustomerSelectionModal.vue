<template>
  <div class="customer-selection-page">
    <main class="content">
      <!-- Page Header -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-clipboard-list"></i></span>
            SALES / <span>NEW INQUIRY</span>
          </div>
          <h1>Customer Information</h1>
          <p class="subtitle">Select an existing customer or enter new customer details to proceed with the inquiry.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" type="button" @click="$emit('cancel')">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <section class="grid single">
        <section class="panel center-panel">
          <div class="panel-header center-header">
            <div class="panel-icon"><i class="fa fa-user-plus"></i></div>
            <div class="panel-title-text">
              <h3>Customer Details</h3>
              <p>Choose how you want to proceed with customer information.</p>
            </div>
          </div>

          <div class="inner-card">
          <!-- Customer Type Toggle -->
          <div class="customer-type-section">
            <div class="type-tabs">
              <button 
                class="type-tab" 
                :class="{ active: customerType === 'new' }"
                @click="onCustomerTypeChange('new')"
              >
                <i class="fa fa-user-plus me-2"></i>
                New Customer
              </button>
              <button 
                class="type-tab" 
                :class="{ active: customerType === 'existing' }"
                @click="onCustomerTypeChange('existing')"
              >
                <i class="fa fa-users me-2"></i>
                Existing Customer
              </button>
            </div>
          </div>

          <!-- Existing Customer Selection -->
          <div v-if="customerType === 'existing'" class="existing-customer-section">
            <div class="form-group">
              <label class="form-label">
                <i class="fa fa-search me-1"></i>
                Search & Select Customer
              </label>
              <select 
                v-model="selectedExistingCustomer" 
                class="form-select form-select-lg"
                :disabled="loadingCustomers"
                @change="onExistingCustomerSelect"
              >
                <option :value="null">-- Select an existing customer --</option>
                <option 
                  v-for="customer in existingCustomersOptions" 
                  :key="customer.value" 
                  :value="customer.value"
                >
                  {{ customer.text }} - {{ customer.selfItem?.email || 'No Email' }} • {{ customer.selfItem?.country || 'Unknown Country' }}
                </option>
              </select>
              <div v-if="loadingCustomers" class="loading-indicator">
                <i class="fa fa-spinner fa-spin me-2"></i>Loading customers...
              </div>
            </div>

            <!-- Selected Customer Preview -->
            <div v-if="selectedCustomerData" class="customer-preview">
              <div class="preview-header">
                <i class="fa fa-user-check text-success me-2"></i>
                <strong>Selected Customer Details</strong>
              </div>
              <div class="preview-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="preview-item">
                      <span class="label">Full Name:</span>
                      <span class="value">{{ form.full_name || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="preview-item">
                      <span class="label">Email:</span>
                      <span class="value">{{ form.email || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="preview-item">
                      <span class="label">Phone:</span>
                      <span class="value">{{ form.phone || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="preview-item">
                      <span class="label">Country:</span>
                      <span class="value">{{ getCountryName(form.country) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- New Customer Form -->
          <div v-if="customerType === 'new'" class="new-customer-form">
            <!-- Basic Information -->
            <div class="form-section">
              <div class="section-header">
                <i class="fa fa-id-card text-primary me-2"></i>
                <h5>Basic Information</h5>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label required">Full Name</label>
                  <input 
                    v-model="form.full_name" 
                    type="text" 
                    class="form-control" 
                    placeholder="Enter full name"
                    :class="{ 'is-invalid': errors.full_name }"
                  />
                  <div v-if="errors.full_name" class="invalid-feedback">{{ errors.full_name }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label required">Country</label>
                  <select 
                    v-model="form.country" 
                    class="form-select"
                    :class="{ 'is-invalid': errors.country }"
                  >
                    <option :value="null">-- Select Country --</option>
                    <option v-for="country in countries" :key="country.value" :value="country.value">
                      {{ country.text }}
                    </option>
                  </select>
                  <div v-if="errors.country" class="invalid-feedback">{{ errors.country }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label required">Nationality</label>
                  <select 
                    v-model="form.nationality" 
                    class="form-select"
                    :class="{ 'is-invalid': errors.nationality }"
                  >
                    <option :value="null">-- Select Nationality --</option>
                    <option v-for="nat in nationalities" :key="nat.value" :value="nat.value">
                      {{ nat.text }}
                    </option>
                  </select>
                  <div v-if="errors.nationality" class="invalid-feedback">{{ errors.nationality }}</div>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="form-section mt-4">
              <div class="section-header">
                <i class="fa fa-envelope text-primary me-2"></i>
                <h5>Contact Information</h5>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label required">Email</label>
                  <input 
                    v-model="form.email" 
                    type="email" 
                    class="form-control" 
                    placeholder="Enter email address"
                    :class="{ 'is-invalid': errors.email }"
                  />
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label required">Primary Phone</label>
                  <div class="phone-input-wrapper">
                    <div class="country-code-wrapper">
                      <country-flag :country="selectedPhoneCountry.iso" size="normal" class="selected-flag" />
                      <select 
                        v-model="form.phone_country_code" 
                        class="country-code-select"
                      >
                        <option v-for="(cc, idx) in countryCodes" :key="idx" :value="cc.code">
                          {{ cc.country }} {{ cc.code }}
                        </option>
                      </select>
                      <span class="selected-code">{{ form.phone_country_code }}</span>
                      <i class="fa fa-caret-down dropdown-icon"></i>
                    </div>
                    <input 
                      v-model="form.phone" 
                      type="text" 
                      class="form-control phone-number-input" 
                      placeholder="201-555-5555"
                      :class="{ 'is-invalid': errors.phone }"
                    />
                  </div>
                  <div v-if="errors.phone" class="invalid-feedback d-block">{{ errors.phone }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Additional Phone</label>
                  <div class="phone-input-wrapper">
                    <div class="country-code-wrapper">
                      <country-flag :country="selectedPhoneAdditionalCountry.iso" size="normal" class="selected-flag" />
                      <select 
                        v-model="form.phone_additional_country_code" 
                        class="country-code-select"
                      >
                        <option v-for="(cc, idx) in countryCodes" :key="idx" :value="cc.code">
                          {{ cc.country }} {{ cc.code }}
                        </option>
                      </select>
                      <span class="selected-code">{{ form.phone_additional_country_code }}</span>
                      <i class="fa fa-caret-down dropdown-icon"></i>
                    </div>
                    <input 
                      v-model="form.phone_additional" 
                      type="text" 
                      class="form-control phone-number-input" 
                      placeholder="201-555-5555 (Optional)"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label required">Address</label>
                  <input 
                    v-model="form.address" 
                    type="text" 
                    class="form-control" 
                    placeholder="Enter address"
                    :class="{ 'is-invalid': errors.address }"
                  />
                  <div v-if="errors.address" class="invalid-feedback">{{ errors.address }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="page-footer">
            <button class="btn btn-outline-secondary" type="button" @click="$emit('cancel')">
              <i class="fa fa-times me-1"></i> Cancel
            </button>
            <button 
              class="btn btn-primary" 
              type="button" 
              :disabled="!canProceed"
              @click="handleProceed"
            >
              <i class="fa fa-arrow-right me-1"></i> Continue to Inquiry Wizard
            </button>
          </div>
          </div> <!-- end inner-card -->
        </section> <!-- end panel -->
      </section> <!-- end grid -->
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import CountryFlag from 'vue-country-flag-next'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ 
  editData?: any | null 
}>()

const emit = defineEmits<{ 
  (e: 'cancel'): void
  (e: 'proceed', customerData: any): void
}>()

const { init } = useToast()

// Form state
const form = reactive({
  full_name: '',
  nick_name: '',
  country: null as any,
  nationality: null as any,
  email: '',
  phone_country_code: '+1',
  phone: '',
  phone_additional_country_code: '+1',
  phone_additional: '',
  address: '',
})

// Get selected country info for display
const selectedPhoneCountry = computed(() => {
  return countryCodes.find(cc => cc.code === form.phone_country_code) || countryCodes[0]
})
const selectedPhoneAdditionalCountry = computed(() => {
  return countryCodes.find(cc => cc.code === form.phone_additional_country_code) || countryCodes[0]
})

const errors = reactive({
  full_name: '',
  country: '',
  nationality: '',
  email: '',
  phone: '',
  address: '',
})

// Customer selection
const customerType = ref<'new' | 'existing'>('new')
const selectedExistingCustomer = ref<any>(null)
const selectedCustomerData = ref<any>(null)

// Data sources
const countries = ref<any[]>([])
const nationalities = ref<any[]>([])
const existingCustomersOptions = ref<any[]>([])
const loadingCustomers = ref(false)

// Country codes for phone numbers - comprehensive world list
const countryCodes = [
  { code: '+93', country: 'Afghanistan', iso: 'AF' },
  { code: '+213', country: 'Algeria', iso: 'DZ' },
  { code: '+244', country: 'Angola', iso: 'AO' },
  { code: '+54', country: 'Argentina', iso: 'AR' },
  { code: '+61', country: 'Australia', iso: 'AU' },
  { code: '+43', country: 'Austria', iso: 'AT' },
  { code: '+1242', country: 'Bahamas', iso: 'BS' },
  { code: '+973', country: 'Bahrain', iso: 'BH' },
  { code: '+880', country: 'Bangladesh', iso: 'BD' },
  { code: '+1246', country: 'Barbados', iso: 'BB' },
  { code: '+32', country: 'Belgium', iso: 'BE' },
  { code: '+591', country: 'Bolivia', iso: 'BO' },
  { code: '+267', country: 'Botswana', iso: 'BW' },
  { code: '+55', country: 'Brazil', iso: 'BR' },
  { code: '+359', country: 'Bulgaria', iso: 'BG' },
  { code: '+855', country: 'Cambodia', iso: 'KH' },
  { code: '+237', country: 'Cameroon', iso: 'CM' },
  { code: '+1', country: 'Canada', iso: 'CA' },
  { code: '+56', country: 'Chile', iso: 'CL' },
  { code: '+86', country: 'China', iso: 'CN' },
  { code: '+57', country: 'Colombia', iso: 'CO' },
  { code: '+506', country: 'Costa Rica', iso: 'CR' },
  { code: '+385', country: 'Croatia', iso: 'HR' },
  { code: '+53', country: 'Cuba', iso: 'CU' },
  { code: '+420', country: 'Czech Republic', iso: 'CZ' },
  { code: '+45', country: 'Denmark', iso: 'DK' },
  { code: '+1809', country: 'Dominican Republic', iso: 'DO' },
  { code: '+243', country: 'DR Congo', iso: 'CD' },
  { code: '+593', country: 'Ecuador', iso: 'EC' },
  { code: '+20', country: 'Egypt', iso: 'EG' },
  { code: '+503', country: 'El Salvador', iso: 'SV' },
  { code: '+372', country: 'Estonia', iso: 'EE' },
  { code: '+268', country: 'Eswatini', iso: 'SZ' },
  { code: '+251', country: 'Ethiopia', iso: 'ET' },
  { code: '+679', country: 'Fiji', iso: 'FJ' },
  { code: '+358', country: 'Finland', iso: 'FI' },
  { code: '+33', country: 'France', iso: 'FR' },
  { code: '+49', country: 'Germany', iso: 'DE' },
  { code: '+233', country: 'Ghana', iso: 'GH' },
  { code: '+30', country: 'Greece', iso: 'GR' },
  { code: '+502', country: 'Guatemala', iso: 'GT' },
  { code: '+509', country: 'Haiti', iso: 'HT' },
  { code: '+504', country: 'Honduras', iso: 'HN' },
  { code: '+852', country: 'Hong Kong', iso: 'HK' },
  { code: '+36', country: 'Hungary', iso: 'HU' },
  { code: '+354', country: 'Iceland', iso: 'IS' },
  { code: '+91', country: 'India', iso: 'IN' },
  { code: '+62', country: 'Indonesia', iso: 'ID' },
  { code: '+98', country: 'Iran', iso: 'IR' },
  { code: '+964', country: 'Iraq', iso: 'IQ' },
  { code: '+353', country: 'Ireland', iso: 'IE' },
  { code: '+972', country: 'Israel', iso: 'IL' },
  { code: '+39', country: 'Italy', iso: 'IT' },
  { code: '+225', country: 'Ivory Coast', iso: 'CI' },
  { code: '+1876', country: 'Jamaica', iso: 'JM' },
  { code: '+81', country: 'Japan', iso: 'JP' },
  { code: '+962', country: 'Jordan', iso: 'JO' },
  { code: '+7', country: 'Kazakhstan', iso: 'KZ' },
  { code: '+254', country: 'Kenya', iso: 'KE' },
  { code: '+965', country: 'Kuwait', iso: 'KW' },
  { code: '+856', country: 'Laos', iso: 'LA' },
  { code: '+371', country: 'Latvia', iso: 'LV' },
  { code: '+961', country: 'Lebanon', iso: 'LB' },
  { code: '+266', country: 'Lesotho', iso: 'LS' },
  { code: '+218', country: 'Libya', iso: 'LY' },
  { code: '+370', country: 'Lithuania', iso: 'LT' },
  { code: '+853', country: 'Macau', iso: 'MO' },
  { code: '+60', country: 'Malaysia', iso: 'MY' },
  { code: '+230', country: 'Mauritius', iso: 'MU' },
  { code: '+52', country: 'Mexico', iso: 'MX' },
  { code: '+212', country: 'Morocco', iso: 'MA' },
  { code: '+258', country: 'Mozambique', iso: 'MZ' },
  { code: '+95', country: 'Myanmar', iso: 'MM' },
  { code: '+264', country: 'Namibia', iso: 'NA' },
  { code: '+977', country: 'Nepal', iso: 'NP' },
  { code: '+31', country: 'Netherlands', iso: 'NL' },
  { code: '+64', country: 'New Zealand', iso: 'NZ' },
  { code: '+505', country: 'Nicaragua', iso: 'NI' },
  { code: '+234', country: 'Nigeria', iso: 'NG' },
  { code: '+47', country: 'Norway', iso: 'NO' },
  { code: '+968', country: 'Oman', iso: 'OM' },
  { code: '+92', country: 'Pakistan', iso: 'PK' },
  { code: '+507', country: 'Panama', iso: 'PA' },
  { code: '+675', country: 'Papua New Guinea', iso: 'PG' },
  { code: '+595', country: 'Paraguay', iso: 'PY' },
  { code: '+51', country: 'Peru', iso: 'PE' },
  { code: '+63', country: 'Philippines', iso: 'PH' },
  { code: '+48', country: 'Poland', iso: 'PL' },
  { code: '+351', country: 'Portugal', iso: 'PT' },
  { code: '+1787', country: 'Puerto Rico', iso: 'PR' },
  { code: '+974', country: 'Qatar', iso: 'QA' },
  { code: '+40', country: 'Romania', iso: 'RO' },
  { code: '+7', country: 'Russia', iso: 'RU' },
  { code: '+250', country: 'Rwanda', iso: 'RW' },
  { code: '+966', country: 'Saudi Arabia', iso: 'SA' },
  { code: '+221', country: 'Senegal', iso: 'SN' },
  { code: '+381', country: 'Serbia', iso: 'RS' },
  { code: '+65', country: 'Singapore', iso: 'SG' },
  { code: '+421', country: 'Slovakia', iso: 'SK' },
  { code: '+386', country: 'Slovenia', iso: 'SI' },
  { code: '+27', country: 'South Africa', iso: 'ZA' },
  { code: '+82', country: 'South Korea', iso: 'KR' },
  { code: '+34', country: 'Spain', iso: 'ES' },
  { code: '+94', country: 'Sri Lanka', iso: 'LK' },
  { code: '+46', country: 'Sweden', iso: 'SE' },
  { code: '+41', country: 'Switzerland', iso: 'CH' },
  { code: '+963', country: 'Syria', iso: 'SY' },
  { code: '+886', country: 'Taiwan', iso: 'TW' },
  { code: '+255', country: 'Tanzania', iso: 'TZ' },
  { code: '+66', country: 'Thailand', iso: 'TH' },
  { code: '+1868', country: 'Trinidad & Tobago', iso: 'TT' },
  { code: '+216', country: 'Tunisia', iso: 'TN' },
  { code: '+90', country: 'Turkey', iso: 'TR' },
  { code: '+971', country: 'UAE', iso: 'AE' },
  { code: '+256', country: 'Uganda', iso: 'UG' },
  { code: '+380', country: 'Ukraine', iso: 'UA' },
  { code: '+44', country: 'United Kingdom', iso: 'GB' },
  { code: '+1', country: 'United States', iso: 'US' },
  { code: '+598', country: 'Uruguay', iso: 'UY' },
  { code: '+998', country: 'Uzbekistan', iso: 'UZ' },
  { code: '+58', country: 'Venezuela', iso: 'VE' },
  { code: '+84', country: 'Vietnam', iso: 'VN' },
  { code: '+967', country: 'Yemen', iso: 'YE' },
  { code: '+260', country: 'Zambia', iso: 'ZM' },
  { code: '+263', country: 'Zimbabwe', iso: 'ZW' },
]

const getFlagEmoji = (iso?: string) => {
  if (!iso || iso.length !== 2) return ''
  const codePoints = iso
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// API base URL
const apiBaseUrl = (() => {
  const base = import.meta.env.VITE_APP_BASE_URL || ''
  return base.replace(/\/+$/, '')
})()

// Computed
const canProceed = computed(() => {
  if (customerType.value === 'existing') {
    return !!selectedExistingCustomer.value
  } else {
    return !!(
      form.full_name?.trim() &&
      form.country &&
      form.nationality &&
      form.email?.trim() &&
      form.phone?.trim() &&
      form.address?.trim()
    )
  }
})

// Methods
const onCustomerTypeChange = (type: 'new' | 'existing') => {
  customerType.value = type
  if (type === 'new') {
    selectedExistingCustomer.value = null
    selectedCustomerData.value = null
  } else {
    clearForm()
  }
}

const clearForm = () => {
  form.full_name = ''
  form.nick_name = ''
  form.country = null
  form.nationality = null
  form.email = ''
  form.phone = ''
  form.phone_additional = ''
  form.address = ''
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

const onExistingCustomerSelect = () => {
  if (!selectedExistingCustomer.value) {
    selectedCustomerData.value = null
    clearForm()
    return
  }

  const customer = existingCustomersOptions.value.find(
    (c: any) => c.value === selectedExistingCustomer.value
  )

  if (customer?.selfItem) {
    selectedCustomerData.value = customer.selfItem
    populateFormFromCustomer(customer)
  }
}

const populateFormFromCustomer = (customer: any) => {
  if (!customer?.selfItem) return
  const entity = customer.selfItem

  form.full_name = entity.full_name || ''
  form.email = entity.email || ''
  form.address = entity.address || ''
  
  // Split phone number into country code and number
  if (entity.phone) {
    const match = entity.phone.match(/^(\+\d+)(\d+)$/)
    if (match) {
      form.phone_country_code = match[1] // e.g., "+255"
      form.phone = match[2] // e.g., "627380744"
    } else {
      // If format doesn't match, store as-is
      form.phone = entity.phone
    }
  } else {
    form.phone = ''
  }

  // Find country
  const countryId = entity.country_id
  if (countryId) {
    const countryOption = countries.value.find((c: any) => c.value === countryId)
    if (countryOption) form.country = countryOption.value
  } else if (entity.country) {
    const countryOption = countries.value.find((c: any) => c.text === entity.country)
    if (countryOption) form.country = countryOption.value
  }

  // Find nationality
  const nationalityId = entity.nationality_id
  if (nationalityId) {
    const natOption = nationalities.value.find((n: any) => n.value === nationalityId)
    if (natOption) form.nationality = natOption.value
  } else if (entity.nationality) {
    const natOption = nationalities.value.find((n: any) => n.text === entity.nationality)
    if (natOption) form.nationality = natOption.value
  }
}

const getCountryName = (countryId: any) => {
  if (!countryId) return 'N/A'
  const country = countries.value.find((c: any) => c.value === countryId)
  return country?.text || 'N/A'
}

const validateForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  if (customerType.value === 'new') {
    if (!form.full_name?.trim()) {
      errors.full_name = 'Full name is required'
      isValid = false
    }
    if (!form.country) {
      errors.country = 'Country is required'
      isValid = false
    }
    if (!form.nationality) {
      errors.nationality = 'Nationality is required'
      isValid = false
    }
    if (!form.email?.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }
    if (!form.phone?.trim()) {
      errors.phone = 'Phone number is required'
      isValid = false
    }
    if (!form.address?.trim()) {
      errors.address = 'Address is required'
      isValid = false
    }
  }

  return isValid
}

const handleProceed = async () => {
  if (customerType.value === 'new' && !validateForm()) {
    init({ message: 'Please fill all required fields correctly.', color: 'warning' })
    return
  }

  let entityId = null

  // If creating a new customer, save to database first
  if (customerType.value === 'new') {
    try {
      init({ message: 'Creating customer...', color: 'info' })
      
      // Build contacts array with country codes (codes already include +)
      const contacts: any[] = []
      if (form.email) contacts.push({ type: 'email', contact: form.email })
      if (form.phone) {
        const fullPhone = form.phone_country_code.startsWith('+') 
          ? `${form.phone_country_code}${form.phone}` 
          : `+${form.phone_country_code}${form.phone}`
        contacts.push({ type: 'phone_number', contact: fullPhone })
      }
      if (form.phone_additional) {
        const fullPhoneAdditional = form.phone_additional_country_code.startsWith('+')
          ? `${form.phone_additional_country_code}${form.phone_additional}`
          : `+${form.phone_additional_country_code}${form.phone_additional}`
        contacts.push({ type: 'phone_number', contact: fullPhoneAdditional })
      }
      if (form.address) contacts.push({ type: 'address', contact: form.address })

      // Create entity payload
      const entityPayload = {
        full_name: form.full_name,
        nick_name: form.nick_name || null,
        country_id: form.country,
        nationality_id: form.nationality,
        contacts: contacts
      }

      // Save to database
      const response = await axios.post(
        import.meta.env.VITE_APP_BASE_URL + 'entities',
        entityPayload,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (response.data && response.data.success && response.data.data) {
        entityId = response.data.data.id
        init({ message: 'Customer created successfully!', color: 'success' })
      } else {
        console.error('Entity creation failed:', response.data)
        init({ message: response.data?.message || 'Failed to create customer. Please try again.', color: 'danger' })
        return
      }
    } catch (error: any) {
      console.error('Error creating customer:', error)
      const errorMessage = error.response?.data?.message || 'An error occurred while creating the customer.'
      
      // Check if error is related to duplicate email
      if (errorMessage.toLowerCase().includes('email') && 
          (errorMessage.toLowerCase().includes('exist') || 
           errorMessage.toLowerCase().includes('taken') ||
           errorMessage.toLowerCase().includes('duplicate') ||
           errorMessage.toLowerCase().includes('unique'))) {
        errors.email = 'Email already exists'
      }
      
      init({ message: errorMessage, color: 'danger' })
      return
    }
  } else {
    entityId = selectedExistingCustomer.value
  }

  // Build full phone numbers (only for passing to wizard, not saving again)
  const fullPhone = form.phone ? `${form.phone_country_code}${form.phone}` : ''
  const fullPhoneAdditional = form.phone_additional ? `${form.phone_additional_country_code}${form.phone_additional}` : ''

  const customerData = {
    customerType: customerType.value,
    entity_id: entityId,
    full_name: form.full_name,
    nick_name: form.nick_name,
    country: form.country,
    nationality: form.nationality,
    email: form.email,
    phone: fullPhone,
    phone_additional: fullPhoneAdditional,
    address: form.address,
  }
  
  emit('proceed', customerData)
}

// Data fetching
const getCountries = async () => {
  try {
    const response = await axios.get(
      import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_COUNTRIES_URL,
      { headers: { 'Content-Type': 'application/json' } }
    )
    if (response.status === 200) {
      countries.value = response.data.map((country: any) => ({ 
        value: country.id, 
        text: country.name 
      }))
    }
  } catch (error) {
    console.error('Error loading countries:', error)
  }
}

const getNationalities = async () => {
  try {
    const response = await axios.get(
      import.meta.env.VITE_APP_BASE_URL + import.meta.env.VITE_APP_NATIONALITIES_URL,
      { headers: { 'Content-Type': 'application/json' } }
    )
    if (response.status === 200) {
      nationalities.value = response.data.map((nat: any) => ({ 
        value: nat.id, 
        text: nat.name 
      }))
    }
  } catch (error) {
    console.error('Error loading nationalities:', error)
  }
}

const getExistingCustomers = async () => {
  loadingCustomers.value = true
  try {
    const response = await axios.get(
      import.meta.env.VITE_APP_BASE_URL + 'entities',
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    if (response.data) {
      const dataArray = Array.isArray(response.data.data) ? response.data.data : 
                        Array.isArray(response.data) ? response.data : []
      
      existingCustomersOptions.value = dataArray.map((entity: any) => {
        let email = ''
        let phone = ''
        let address = ''
        let countryName = 'N/A'
        let nationalityName = 'N/A'

        if (entity.contacts && Array.isArray(entity.contacts)) {
          entity.contacts.forEach((contact: any) => {
            const contactType = String(contact.type || '').toLowerCase()
            if (contactType === 'email' || contact.contact_type_id === 1) {
              email = contact.contact || ''
            } else if (contactType === 'phone_number' || contactType === 'phone' || contact.contact_type_id === 2) {
              phone = phone || contact.contact || ''
            } else if (contactType === 'address' || contact.contact_type_id === 3) {
              address = contact.contact || ''
            }
          })
        }

        // Extract country name - handle object or string
        if (typeof entity.country === 'object' && entity.country !== null) {
          countryName = entity.country.name || entity.country.text || 'N/A'
        } else if (typeof entity.country === 'string') {
          countryName = entity.country
        } else if (entity.country_name) {
          countryName = entity.country_name
        }

        // Extract nationality name - handle object or string
        if (typeof entity.nationality === 'object' && entity.nationality !== null) {
          nationalityName = entity.nationality.name || entity.nationality.text || 'N/A'
        } else if (typeof entity.nationality === 'string') {
          nationalityName = entity.nationality
        } else if (entity.nationality_name) {
          nationalityName = entity.nationality_name
        }

        return {
          value: entity.id,
          text: entity.full_name || 'Unknown',
          selfItem: {
            ...entity,
            email,
            phone,
            address,
            country: countryName,
            nationality: nationalityName,
          },
        }
      })
    }
  } catch (error) {
    console.error('Error loading existing customers:', error)
  } finally {
    loadingCustomers.value = false
  }
}

// Handle edit mode - pre-populate form if editing
const loadEditData = () => {
  if (!props.editData) return

  const item = props.editData.selfitem || props.editData
  
  // Set as existing customer mode
  customerType.value = 'existing'
  
  if (item.entity_id) {
    selectedExistingCustomer.value = item.entity_id
  }

  // Load entity/client information
  form.full_name = item.entity?.full_name || props.editData.name || ''
  form.nick_name = item.entity?.nick_name || ''

  // Load country
  const countryId = item.entity?.country_id
  if (countryId) {
    form.country = countryId
  }

  // Load nationality
  const nationalityId = item.entity?.nationality_id
  if (nationalityId) {
    form.nationality = nationalityId
  }

  // Load contacts
  if (item.entity?.contacts && Array.isArray(item.entity.contacts)) {
    let phoneFound = false
    item.entity.contacts.forEach((contact: any) => {
      const contactTypeId = contact.contact_type_id
      
      if (contactTypeId === 1) {
        form.email = contact.contact || ''
      } else if (contactTypeId === 2) {
        const fullPhone = contact.contact || ''
        if (fullPhone) {
          // Split phone number into country code and number
          const match = fullPhone.match(/^(\+\d+)(\d+)$/)
          if (match) {
            if (!phoneFound) {
              form.phone_country_code = match[1] // e.g., "+255"
              form.phone = match[2] // e.g., "627380744"
              phoneFound = true
            } else {
              form.phone_additional_country_code = match[1]
              form.phone_additional = match[2]
            }
          } else {
            // If format doesn't match, store as-is
            if (!phoneFound) {
              form.phone = fullPhone
              phoneFound = true
            } else {
              form.phone_additional = fullPhone
            }
          }
        }
      } else if (contactTypeId === 3) {
        form.address = contact.contact || ''
      }
    })
  }
}

watch(() => props.editData, () => {
  loadEditData()
}, { immediate: true })

onMounted(async () => {
  await Promise.all([
    getCountries(),
    getNationalities(),
    getExistingCustomers(),
  ])
  loadEditData()
})
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --text: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --card: #ffffff;
  --radius: 14px;
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.customer-selection-page {
  min-height: 100%;
  background: #f5f7fb;
}

.content {
  padding: 22px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-head-left h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.crumbs {
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.crumb-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: #eff6ff;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.head-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: 2px solid transparent;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn .btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.btn.ghost {
  border-color: var(--border);
  background: #ffffff;
  color: var(--text);
}

.btn.ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn.btn-primary {
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
}

.btn.btn-primary:hover:not(:disabled) {
  background: #1e40af !important;
}

.btn.btn-primary:disabled {
  background: #2563eb !important;
  border-color: #1e40af !important;
  color: #ffffff !important;
  opacity: 1 !important;
  cursor: not-allowed;
  pointer-events: none;
}

.btn.btn-outline-secondary {
  border-color: var(--border);
  background: #ffffff;
  color: #475569;
}

.btn.btn-outline-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.panel-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #eff6ff;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.panel-title-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.inner-card {
  margin: 16px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}

/* Customer Type Tabs */
.customer-type-section {
  margin-bottom: 1.5rem;
}

.type-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
}

.type-tab {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.type-tab:hover {
  color: #1e293b;
}

.type-tab.active {
  background: #fff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Existing Customer Section */
.existing-customer-section {
  animation: fadeIn 0.3s ease;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.loading-indicator {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

/* Customer Preview */
.customer-preview {
  margin-top: 1rem;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  overflow: hidden;
  background: #ecfdf5;
}

.preview-header {
  padding: 0.75rem 1rem;
  background: #d1fae5;
  border-bottom: 1px solid #a7f3d0;
}

.preview-body {
  padding: 1rem;
}

.preview-item {
  display: flex;
  flex-direction: column;
}

.preview-item .label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.preview-item .value {
  font-weight: 500;
  color: #1f2937;
}

/* New Customer Form */
.new-customer-form {
  animation: fadeIn 0.3s ease;
}

.form-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-control,
.form-select {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  transition: all 0.2s;
  width: 100%;
}

/* Phone input group - inline layout */
.phone-input-wrapper {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.phone-input-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.country-code-wrapper {
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #f9fafb;
  border-right: 1px solid #d1d5db;
  position: relative;
  cursor: pointer;
  min-width: 85px;
}

.country-code-wrapper .selected-flag {
  display: inline-flex;
  align-items: center;
  width: 24px;
  height: 18px;
  margin-right: 8px;
  border-radius: 2px;
  overflow: hidden;
}

.country-code-wrapper .selected-flag img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.country-code-wrapper .selected-code {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.country-code-wrapper .dropdown-icon {
  margin-left: 6px;
  font-size: 10px;
  color: #6b7280;
}

.country-code-wrapper .country-code-select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  font-size: 14px;
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
}

.country-code-wrapper .country-code-select option {
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
}

.phone-input-wrapper .phone-number-input {
  flex: 1;
  border: none;
  border-radius: 0;
  padding: 0.625rem 0.875rem;
}

.phone-input-wrapper .phone-number-input:focus {
  box-shadow: none;
  outline: none;
}

.phone-input-wrapper .phone-number-input::placeholder {
  color: #9ca3af;
}

.form-control:focus,
.form-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #dc2626;
}

.invalid-feedback {
  display: block;
  font-size: 0.8125rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

/* Page Footer */
.page-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 0;
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .content {
    padding: 16px;
  }
}
</style>
