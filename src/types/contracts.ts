/**
 * Contract-related TypeScript interfaces
 * Corresponds to SQL database schema for contract management
 */

export enum ContractTypeEnum {
  SALE_HUNTERS = 'SALE_HUNTERS',
  COMPANION_HUNTERS = 'COMPANION_HUNTERS',
  OBSERVER_HUNTERS = 'OBSERVER_HUNTERS'
}

export enum ContractStatusEnum {
  DRAFT = 'DRAFT',
  NEGOTIATION = 'NEGOTIATION',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED'
}

export enum ContractVersionStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  SIGNED = 'SIGNED',
  SUPERSEDED = 'SUPERSEDED'
}

export enum PartyRoleEnum {
  HUNTERS = 'HUNTERS',
  COMPANION_HUNTERS = 'COMPANION_HUNTERS',
  OBSERVER_HUNTERS = 'OBSERVER_HUNTERS',
  CARRIER = 'CARRIER',
  AGENT = 'AGENT',
  BROKER = 'BROKER',
  GUARANTOR = 'GUARANTOR',
  OTHER = 'OTHER'
}

export enum ContractLinkObjectTypeEnum {
  ORDER = 'ORDER',
  OTHER = 'OTHER'
}

export enum ContractLinkRelationTypeEnum {
  GOVERNS = 'GOVERNS',
  CREATED_FROM = 'CREATED_FROM',
  RELATED = 'RELATED'
}

export enum BillingScheduleTypeEnum {
  MILESTONE = 'MILESTONE',
  PERIODIC = 'PERIODIC',
  USAGE = 'USAGE'
}

export enum AmountTypeEnum {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE'
}

export enum BaseOnEnum {
  CONTRACT_TOTAL = 'CONTRACT_TOTAL',
  LINE_TOTAL = 'LINE_TOTAL',
  CUSTOM = 'CUSTOM'
}

export enum DueDaysTypeEnum {
  AFTER_CONTRACT_START = 'AFTER_CONTRACT_START',
  AFTER_SIGNATURE = 'AFTER_SIGNATURE',
  AFTER_ARRIVAL = 'AFTER_ARRIVAL',
  AFTER_DELIVERY = 'AFTER_DELIVERY',
  AFTER_INVOICE = 'AFTER_INVOICE'
}

/**
 * Contract Type master data
 */
export interface IContractType {
  id: number
  name: ContractTypeEnum
  createdAt?: string
  updatedAt?: string
}

/**
 * Main Contract entity
 */
export interface IContract {
  id: number
  companyId: number
  contractNumber: string
  contractTypeId: number
  status: ContractStatusEnum
  title?: string
  referenceExternal?: string
  startDate?: string
  endDate?: string
  signedDate?: string
  autoRenew: boolean
  renewalTermMonths?: number
  governingLaw?: string
  jurisdiction?: string
  financialSummary?: string
  specialTerms?: string
  additionalNote?: string
  createdBy?: number
  createdAt: string
  updatedBy?: number
  updatedAt: string
  // Relations
  contractType?: IContractType
  parties?: IContractParty[]
  versions?: IContractVersion[]
  billingSchedules?: IContractBillingSchedule[]
  links?: IContractLink[]
}

/**
 * Contract Version - represents a specific version of the contract
 */
export interface IContractVersion {
  id: number
  contractId: number
  versionNo: number
  status: ContractVersionStatusEnum
  templateName?: string
  filePath?: string
  generatedAt: string
  signedAt?: string
  createdBy?: number
  createdAt: string
  updatedAt: string
  // Relation
  contract?: IContract
}

/**
 * Contract Party - represents entities involved in the contract
 */
export interface IContractParty {
  id: number
  contractId: number
  entityId: number
  role: PartyRoleEnum
  isPrimary: boolean
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  addressId?: number
  createdAt: string
  updatedAt: string
  // Relations
  contract?: IContract
  entity?: IEntity
  address?: IAddress
}

/**
 * Contract Link - connects contract to related objects (orders, etc)
 */
export interface IContractLink {
  id: number
  contractId: number
  objectType: ContractLinkObjectTypeEnum
  objectId: number
  relationType: ContractLinkRelationTypeEnum
  createdAt: string
  // Relation
  contract?: IContract
}

/**
 * Contract Billing Schedule - defines payment terms
 */
export interface IContractBillingSchedule {
  id: number
  contractId: number
  label?: string
  scheduleType: BillingScheduleTypeEnum
  amountType: AmountTypeEnum
  amount: number
  currencyId: number
  baseOn: BaseOnEnum
  dueDays: number
  dueDaysType: DueDaysTypeEnum
  isDeposit: boolean
  sequenceNo: number
  createdAt: string
  updatedAt: string
  // Relations
  contract?: IContract
  currency?: ICurrency
}

/**
 * Supporting interfaces referenced by contracts
 */

export interface IEntity {
  id: number
  fullName: string
  shortName?: string
  email?: string
  phone?: string
  [key: string]: any
}

export interface IAddress {
  id: number
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  [key: string]: any
}

export interface ICurrency {
  id: number
  code: string
  name: string
  symbol: string
  [key: string]: any
}

/**
 * Contract DTO for API operations
 */
export interface IContractCreatePayload {
  company_id?: number
  contract_number: string
  contract_type_id: number
  status?: ContractStatusEnum
  title: string
  reference_external?: string
  start_date: string
  end_date?: string
  signed_date?: string
  auto_renew?: boolean
  renewal_term_months?: number
  governing_law?: string
  jurisdiction?: string
  financial_summary?: string
  special_terms?: string
  additional_note?: string
  parties?: Partial<IContractParty>[]
  versions?: Partial<IContractVersion>[]
  billing_schedules?: Partial<IContractBillingSchedule>[]
  links?: Partial<IContractLink>[]
}

export interface IContractUpdatePayload extends Partial<IContractCreatePayload> {
  id: number
}

/**
 * Contract List response from API
 */
export interface IContractListResponse {
  data: IContract[]
  meta?: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

/**
 * Contract detail response from API
 */
export interface IContractDetailResponse {
  data: IContract
}
