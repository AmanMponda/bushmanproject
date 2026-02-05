// Entity Types and Interfaces based on entity-management-vue-page.md specification

export enum EntityType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  ESTATE = 'ESTATE',
  GOVERNMENT = 'GOVERNMENT',
  NGO = 'NGO'
}

export enum EntityStatus {
  DRAFT = 'DRAFT',
  PENDING_KYC = 'PENDING_KYC',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLACKLISTED = 'BLACKLISTED',
  CLOSED = 'CLOSED'
}

export interface Country {
  id: number
  name: string
  code?: string
}

export interface Currency {
  id: number
  name: string
  code?: string
  symbol?: string
}

export interface Nationality {
  id: number
  name: string
}

export interface ContactType {
  id: number
  name: string
}

export interface IdentityType {
  id: number
  name: string
  description?: string
}

export interface Account {
  id: number
  name: string
  code?: string
  account_number?: string
}

export interface CompanyProfile {
  entity_id: number
  legal_name?: string
  trading_name?: string
  registration_no?: string
  registration_country_id?: number
  incorporation_date?: string
  business_type?: string
  industry_code?: string
  tax_residency_country_id?: number
  registration_country?: Country
  tax_residency_country?: Country
}

export interface IndividualProfile {
  entity_id: number
  date_of_birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  nationality_country_id?: number
  marital_status?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
  nationality_country?: Country
}

export interface Contact {
  id?: number
  entity_id?: number
  contact_type_id: number
  contact: string
  contactable?: boolean
  contact_type?: ContactType
}

export interface CategoryPivot {
  entity_id: number
  category_id: number
  default_payable_account_id?: number | null
  default_receivable_account_id?: number | null
  effective_from?: string | null
  effective_to?: string | null
  is_active?: boolean
  code?: string | null
}

export interface Category {
  id: number
  parent_id?: number | null
  name: string
  display_name?: string
  category_code?: string
  keyword?: string
  pivot?: CategoryPivot
}

export interface IdentityDate {
  id?: number
  identity_id?: number
  issuing_country_id?: number | null
  issuing_authority?: string | null
  expire_date?: string | null
  is_active?: boolean
  is_verified?: boolean
  document_front?: string | null
  document_back?: string | null
  verified_at?: string | null
  verified_by_user_id?: number | null
  issuing_country?: Country
}

export interface Identity {
  id?: number
  identifiable_type?: string
  identifiable_id?: number
  identity_type_id: number
  identity_number: string
  issued_date?: string | null
  is_active?: boolean
  entity_user_id?: number | null
  identity_type?: IdentityType
  identity_dates?: IdentityDate[]
  dates?: Partial<IdentityDate>
}

export interface Entity {
  id: number
  full_name: string
  trading_name?: string | null
  nick_name?: string | null
  country_id?: number | null
  base_currency_id?: number | null
  nationality_id?: number | null
  user_id?: number | null
  type: EntityType
  code?: string | null
  status: EntityStatus
  is_group?: boolean
  parent_entity_id?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null

  // Computed/joined fields
  country_name?: string
  nationality_name?: string

  // Relationships
  country?: Country
  nationality?: Nationality
  base_currency?: Currency
  company_profile?: CompanyProfile
  individual_profile?: IndividualProfile
  parent_entity?: Entity
  child_entities?: Entity[]
  categories?: Category[]
  contacts?: Contact[]
  identities?: Identity[]
}

// Request interfaces
export interface CreateEntityRequest {
  full_name: string
  trading_name?: string
  nick_name?: string
  country_id?: number
  base_currency_id?: number
  nationality_id?: number
  code?: string
  type?: EntityType
  status?: EntityStatus
  is_group?: boolean
  parent_entity_id?: number | null
  notes?: string

  company_profile?: Partial<CompanyProfile>
  individual_profile?: Partial<IndividualProfile>

  categories?: Array<{
    category_id: number
    default_payable_account_id?: number
    default_receivable_account_id?: number
    effective_from?: string
    effective_to?: string
    is_active?: boolean
    code?: string
  }>

  contacts?: Array<{
    type?: string
    contact_type_id?: number
    contact: string
    contactable?: boolean
  }>

  identities?: Array<{
    identity_type_id: number
    identity_number: string
    issued_date?: string
    is_active?: boolean
    dates?: {
      issuing_country_id?: number
      issuing_authority?: string
      expire_date?: string
    }
  }>
}

export interface UpdateEntityRequest extends Partial<CreateEntityRequest> {
  id?: number
}

export interface EntityListParams {
  search?: string
  type?: EntityType | string
  status?: EntityStatus | string
  category_id?: number
  category_code?: string
  country_id?: number
  active_only?: boolean
  is_group?: boolean
  parent_entity_id?: number
  paginate?: boolean
  per_page?: number
  limit?: number
  page?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from?: number
    to?: number
  }
  links?: {
    first?: string
    last?: string
    prev?: string | null
    next?: string | null
  }
}

// UI Helper constants
export const entityTypeOptions = [
  { value: EntityType.COMPANY, label: 'Company', icon: 'fa-building' },
  { value: EntityType.INDIVIDUAL, label: 'Individual', icon: 'fa-user' },
  { value: EntityType.ESTATE, label: 'Estate', icon: 'fa-home' },
  { value: EntityType.GOVERNMENT, label: 'Government', icon: 'fa-landmark' },
  { value: EntityType.NGO, label: 'NGO', icon: 'fa-heart' }
]

export const entityStatusOptions = [
  { value: EntityStatus.DRAFT, label: 'Draft', color: 'secondary' },
  { value: EntityStatus.PENDING_KYC, label: 'Pending KYC', color: 'warning' },
  { value: EntityStatus.ACTIVE, label: 'Active', color: 'success' },
  { value: EntityStatus.SUSPENDED, label: 'Suspended', color: 'orange' },
  { value: EntityStatus.BLACKLISTED, label: 'Blacklisted', color: 'danger' },
  { value: EntityStatus.CLOSED, label: 'Closed', color: 'dark' }
]

export const getStatusColor = (status: EntityStatus | string | undefined): string => {
  if (!status) return 'secondary'
  const statusOption = entityStatusOptions.find(s => s.value === status)
  return statusOption?.color || 'secondary'
}

export const getTypeIcon = (type: EntityType | string | undefined): string => {
  if (!type) return 'fa-building'
  const typeOption = entityTypeOptions.find(t => t.value === type)
  return typeOption?.icon || 'fa-building'
}
