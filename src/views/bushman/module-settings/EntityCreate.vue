<template>
  <FormPageLayout
    icon="fa fa-users"
    :title="isEditMode ? 'Edit Entity' : 'Create Entity'"
    :breadcrumbs="[
      { label: 'SYSTEM CONFIGURATION', to: '/module-settings' },
      { label: 'ENTITY MANAGEMENT', to: '/module-settings/entities' },
      isEditMode ? 'EDIT' : 'CREATE'
    ]"
    layout="single"
  >
    <template #header-actions>
      <button type="button" class="btn btn-outline-secondary" @click="goBack">
        <i class="fa fa-arrow-left me-2"></i>
        Back to Entities
      </button>
    </template>

    <template #center>
      <form @submit.prevent="saveEntity">
        <FormCard title="Basic Information" icon="fa fa-info-circle" icon-variant="info" variant="bordered">
          <FormSection :columns="3">
            <FormField label="Entity Type" required>
              <Multiselect
                :model-value="entityTypes.find((t) => t.value === entityForm.type)"
                :options="entityTypes"
                label="label"
                track-by="value"
                :searchable="false"
                :allow-empty="false"
                placeholder="Select type"
                @update:model-value="(val: any) => (entityForm.type = val.value)"
              />
            </FormField>
            <FormField label="Full Name" required>
              <input v-model="entityForm.full_name" type="text" placeholder="Enter full legal name" required />
            </FormField>
            <FormField label="Trading Name" optional>
              <input v-model="entityForm.trading_name" type="text" placeholder="Enter trading name" />
            </FormField>
          </FormSection>

          <FormSection :columns="3">
            <FormField label="Nick Name" optional>
              <input v-model="entityForm.nick_name" type="text" placeholder="Enter short name" />
            </FormField>
            <FormField label="Entity Code" optional>
              <input v-model="entityForm.code" type="text" placeholder="Enter code" />
            </FormField>
            <FormField label="Status" required>
              <Multiselect
                :model-value="statusOptions.find((s) => s.value === entityForm.status)"
                :options="statusOptions"
                label="label"
                track-by="value"
                :searchable="false"
                :allow-empty="false"
                placeholder="Select status"
                @update:model-value="(val: any) => (entityForm.status = val.value)"
              />
            </FormField>
          </FormSection>

          <FormSection :columns="1">
            <FormField
              label="Entity Categories"
              optional
              hint="Choose one or more categories for the entity."
            >
              <Multiselect
                v-model="selectedCategories"
                :options="flatCategories"
                :multiple="true"
                :close-on-select="false"
                label="display_name"
                track-by="id"
                placeholder="Select categories"
              />
            </FormField>
          </FormSection>

          <template v-if="entityForm.type === 'INDIVIDUAL'">
            <FormSection :columns="3">
              <FormField label="Date of Birth" required>
                <div class="vueform-date-wrapper">
                  <Vueform size="sm" :display-errors="false" :endpoint="false">
                    <DateElement
                      name="dob"
                      v-model="entityForm.individual_profile.date_of_birth"
                      @change="entityForm.individual_profile.date_of_birth = $event"
                      :display-format="'MMM D, YYYY'"
                      :value-format="'YYYY-MM-DD'"
                      placeholder="Select date of birth..."
                      :add-class="{ DateElement: { input: 'form-control' } }"
                    />
                  </Vueform>
                </div>
              </FormField>
              <FormField label="Gender" optional>
                <Multiselect
                  v-model="entityForm.individual_profile.gender"
                  :options="['MALE', 'FEMALE', 'OTHER']"
                  placeholder="Select gender"
                />
              </FormField>
              <FormField label="Marital Status" optional>
                <Multiselect
                  v-model="entityForm.individual_profile.marital_status"
                  :options="['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']"
                  placeholder="Select status"
                />
              </FormField>
            </FormSection>
          </template>
        </FormCard>

        <FormCard title="Location & Currency" icon="fa fa-globe" icon-variant="info" variant="bordered">
          <FormSection :columns="3">
            <FormField label="Country">
              <Multiselect
                v-model="entityForm.country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
            <FormField v-if="entityForm.type !== 'COMPANY'" label="Nationality">
              <Multiselect
                v-model="entityForm.nationality_id"
                :options="nationalities"
                label="name"
                track-by="id"
                placeholder="Select nationality"
              />
            </FormField>
            <FormField label="Base Currency">
              <Multiselect
                v-model="entityForm.base_currency_id"
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
              <textarea v-model="entityForm.notes" rows="2" placeholder="Additional notes or comments"></textarea>
            </FormField>
          </FormSection>
        </FormCard>

        <FormCard title="Hierarchy" icon="fa fa-sitemap" icon-variant="info" variant="bordered">
          <FormSection :columns="2">
            <FormField label="Is Parent/Group Entity" optional>
              <div class="form-check">
                <input v-model="entityForm.is_group" type="checkbox" class="form-check-input" id="isGroupCheck" />
                <label class="form-check-label" for="isGroupCheck">Check if this entity will have child entities</label>
              </div>
            </FormField>
            <FormField v-if="!entityForm.is_group" label="Parent Entity" optional>
              <Multiselect
                v-model="entityForm.parent_entity_id"
                :options="parentEntityOptions"
                label="full_name"
                track-by="id"
                placeholder="Select parent entity"
                :searchable="true"
                :allow-empty="true"
              />
            </FormField>
          </FormSection>
        </FormCard>

        <FormCard
          v-if="entityForm.type === 'COMPANY'"
          title="Company Profile"
          icon="fa fa-building"
          icon-variant="info"
          variant="bordered"
        >
          <FormSection :columns="2">
            <FormField label="Legal Name" optional>
              <input v-model="entityForm.company_profile.legal_name" type="text" />
            </FormField>
            <FormField label="Registration Number" optional>
              <input v-model="entityForm.company_profile.registration_no" type="text" />
            </FormField>
            <FormField label="Registration Country" optional>
              <Multiselect
                v-model="entityForm.company_profile.registration_country_id"
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
                    v-model="entityForm.company_profile.incorporation_date"
                    @change="entityForm.company_profile.incorporation_date = $event"
                    :display-format="'MMM D, YYYY'"
                    :value-format="'YYYY-MM-DD'"
                    placeholder="Select incorporation date..."
                    :add-class="{ DateElement: { input: 'form-control' } }"
                  />
                </Vueform>
              </div>
            </FormField>
            <FormField label="Business Type" optional>
              <input v-model="entityForm.company_profile.business_type" type="text" placeholder="e.g., Limited" />
            </FormField>
            <FormField label="Industry Code" optional>
              <input v-model="entityForm.company_profile.industry_code" type="text" placeholder="ISIC/NAICS code" />
            </FormField>
            <FormField label="Tax Residency Country" optional>
              <Multiselect
                v-model="entityForm.company_profile.tax_residency_country_id"
                :options="countries"
                label="name"
                track-by="id"
                placeholder="Select country"
              />
            </FormField>
          </FormSection>
        </FormCard>

        <div class="sticky-footer">
          <FormActions
            :show-cancel="true"
            :show-submit="true"
            cancel-text="Cancel"
            :submit-text="isEditMode ? 'Update Entity' : 'Create Entity'"
            :loading="saving"
            :submit-loading="saving"
            :submit-disabled="saving"
            @cancel="goBack"
            @submit="saveEntity"
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
import entityService from '@/services/entityService'

const router = useRouter()
const route = useRoute()

const apiBaseUrl = import.meta.env.VITE_APP_BASE_URL

const saving = ref(false)
const loading = ref(false)
const metadataLoaded = ref(false)
const isEditMode = ref(false)
const entityId = ref<number | null>(null)

const countries = ref<any[]>([])
const nationalities = ref<any[]>([])
const currencies = ref<any[]>([])
const categories = ref<any[]>([])
const entityTypes = ref<any[]>([])
const contactTypes = ref<any[]>([])
const identityTypes = ref<any[]>([])
const entityStatuses = ref<any[]>([])
const parentEntityOptions = ref<any[]>([])
const selectedCategories = ref<any[]>([])

const entityForm = reactive<any>({
  code: '',
  full_name: '',
  trading_name: '',
  nick_name: '',
  type: 'COMPANY',
  status: 'DRAFT',
  country_id: null,
  nationality_id: null,
  base_currency_id: null,
  is_group: false,
  parent_entity_id: null,
  notes: '',
  company_profile: {
    legal_name: '',
    trading_name: '',
    registration_no: '',
    registration_country_id: null,
    incorporation_date: '',
    business_type: '',
    industry_code: '',
    tax_residency_country_id: null
  },
  individual_profile: {
    date_of_birth: '',
    gender: null,
    nationality_country_id: null,
    marital_status: null
  }
})

const statusOptions = computed(() => [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' }
])

const flatCategories = computed(() => {
  if (!categories.value.length) return []
  const flattened: any[] = []
  const walk = (items: any[]) => {
    items.forEach((item: any) => {
      flattened.push(item)
      if (Array.isArray(item.children) && item.children.length) {
        walk(item.children)
      }
    })
  }
  walk(categories.value)
  return flattened
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

const buildCategoryPayload = () => {
  const basePayload: any[] = []

  if (selectedCategories.value && selectedCategories.value.length > 0) {
    selectedCategories.value.forEach((category: any) => {
      const categoryId = typeof category === 'object' && category !== null ? category.id : category

      if (categoryId) {
        basePayload.push({
          category_id: categoryId,
          effective_from: effectiveFromNow(),
          is_active: true
        })
      }
    })
  }

  return basePayload
}

const saveEntity = async () => {
  saving.value = true
  try {
    // Generate unique code if not provided
    let entityCode = entityForm.code?.trim() || ''
    if (!entityCode) {
      const baseName = (entityForm.trading_name || entityForm.full_name || 'ENT').toUpperCase()
      const prefix = baseName.substring(0, 4).replace(/[^A-Z0-9]/g, '')
      const timestamp = Date.now().toString().slice(-6)
      entityCode = `${prefix}-${timestamp}`
    }

    const payload: any = {
      full_name: entityForm.full_name,
      trading_name: entityForm.trading_name || undefined,
      nick_name: entityForm.nick_name || undefined,
      code: entityCode,
      type: entityForm.type || 'COMPANY',
      status: entityForm.status || 'DRAFT',
      country_id: resolveId(entityForm.country_id),
      nationality_id: resolveId(entityForm.nationality_id),
      base_currency_id: resolveId(entityForm.base_currency_id),
      is_group: entityForm.is_group || false,
      parent_entity_id: resolveId(entityForm.parent_entity_id),
      notes: entityForm.notes || undefined,
      categories: buildCategoryPayload()
    }

    if (entityForm.type === 'COMPANY') {
      payload.company_profile = {
        ...entityForm.company_profile,
        registration_country_id: resolveId(entityForm.company_profile.registration_country_id),
        tax_residency_country_id: resolveId(entityForm.company_profile.tax_residency_country_id)
      }
    }

    if (entityForm.type === 'INDIVIDUAL') {
      payload.individual_profile = {
        ...entityForm.individual_profile,
        nationality_country_id: resolveId(entityForm.individual_profile.nationality_country_id)
      }
    }

    if (isEditMode.value && entityId.value) {
      await entityService.update(entityId.value, payload)
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Entity updated successfully' })
    } else {
      await entityService.create(payload)
      Swal.fire({ icon: 'success', title: 'Created', text: 'Entity created successfully' })
    }
    router.push({ name: 'module-settings-entities' })
  } catch (error: any) {
    const errors = handleErrors(error?.response?.data || error)
    Swal.fire({ icon: 'error', title: 'Error', text: errors?.[0] || 'Failed to save entity' })
  } finally {
    saving.value = false
  }
}

const fetchMetadata = async () => {
  if (metadataLoaded.value) return
  try {
    const token = localStorage.getItem('token')
    const headers = { Authorization: token ? `Bearer ${token}` : '' }
    const response = await axios.get(`${apiBaseUrl}entities/creation-metadata`, { headers })
    const data = response.data?.data || response.data || {}

    categories.value = Array.isArray(data.categories) ? data.categories : []
    countries.value = Array.isArray(data.countries) ? data.countries : []
    currencies.value = Array.isArray(data.currencies) ? data.currencies : []
    nationalities.value = Array.isArray(data.nationalities) ? data.nationalities : []
    contactTypes.value = Array.isArray(data.contact_types) ? data.contact_types : []
    identityTypes.value = Array.isArray(data.identity_types) ? data.identity_types : []
    entityStatuses.value = Array.isArray(data.entity_statuses) ? data.entity_statuses : []
    
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
    console.error('Failed to load metadata', error)
  } finally {
    metadataLoaded.value = true
  }
}

const fetchParentEntities = async () => {
  try {
    const response = await entityService.list({ is_group: true, per_page: 100 })
    parentEntityOptions.value = response.data || []
  } catch (error: any) {
    console.error('Failed to load parent entities', error)
  }
}

const loadEntity = async () => {
  if (!entityId.value) return

  loading.value = true
  try {
    const response = await entityService.get(entityId.value)
    const data = response.data

    // Populate form with loaded data
    entityForm.full_name = data.full_name || ''
    entityForm.trading_name = data.trading_name || ''
    entityForm.nick_name = data.nick_name || ''
    entityForm.code = data.code || ''
    entityForm.type = data.type || 'COMPANY'
    entityForm.status = data.status || 'DRAFT'
    entityForm.country_id = data.country_id || null
    entityForm.nationality_id = data.nationality_id || null
    entityForm.base_currency_id = data.base_currency_id || null
    entityForm.is_group = data.is_group || false
    entityForm.parent_entity_id = data.parent_entity_id || null
    entityForm.notes = data.notes || ''

    // Load company profile if exists
    if (data.company_profile) {
      entityForm.company_profile = {
        legal_name: data.company_profile.legal_name || '',
        trading_name: data.company_profile.trading_name || '',
        registration_no: data.company_profile.registration_no || '',
        registration_country_id: data.company_profile.registration_country_id || null,
        incorporation_date: data.company_profile.incorporation_date || '',
        business_type: data.company_profile.business_type || '',
        industry_code: data.company_profile.industry_code || '',
        tax_residency_country_id: data.company_profile.tax_residency_country_id || null
      }
    }

    // Load individual profile if exists
    if (data.individual_profile) {
      entityForm.individual_profile = {
        date_of_birth: data.individual_profile.date_of_birth || '',
        gender: data.individual_profile.gender || null,
        nationality_country_id: data.individual_profile.nationality_country_id || null,
        marital_status: data.individual_profile.marital_status || null
      }
    }

    // Load categories if exists
    if (data.categories && data.categories.length > 0) {
      selectedCategories.value = data.categories.map((cat: any) => cat.id || cat.category_id)
    }
  } catch (error: any) {
    console.error('Failed to load entity:', error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load entity details'
    })
    router.push({ name: 'module-settings-entities' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'module-settings-entities' })
}

onMounted(async () => {
  // Check if we're in edit mode
  const id = route.params.id
  if (id) {
    isEditMode.value = true
    entityId.value = typeof id === 'string' ? parseInt(id) : (Array.isArray(id) ? parseInt(id[0]) : id)
  }

  // Load metadata first
  await fetchMetadata()
  await fetchParentEntities()

  // Then load entity data if editing
  if (isEditMode.value) {
    await loadEntity()
  }
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
