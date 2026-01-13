
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { requisitionService } from '@/stores/bushman/requisitionService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import RequisitionForm from '@/views/bushman/sales/RequisitionForm.vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'

type RequisitionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED'

type FundDirection = 'WITHDRAW' | 'EXPENSE'
type SourceType = 'CASH' | 'STORE' | 'VENDOR' | 'SERVICE_PROVIDER'
type ModeOfPayment = 'CASH' | 'TT' | 'CREDIT'
type TaxMethod = 'EXCLUSIVE' | 'INCLUSIVE' | 'EXEMPT'
type DiscountMethod = 'PERCENT' | 'LS'

type RequisitionItem = {
  id: number
  description: string
  quantity: number
  rate: number
  itemId: number | null
  unitId: number | null
  itemName?: string
  unitName?: string
}

type ApprovalRecord = {
  id: number
  level: number
  status: 'APPROVED' | 'REJECTED'
  date: string
  remarks: string
  handledBy: string
}

type Requisition = {
  id: number
  code: string
  requisitionType: string
  requisitionTypeId: number | null
  fundDirection: FundDirection
  date: string
  requiredDate: string
  requestedBy: string
  handler: string
  remarks: string
  status: RequisitionStatus
  items: RequisitionItem[]
  approvals: ApprovalRecord[]
  currencyId: number | null
  currencySymbol?: string
}

type RequisitionTypeOption = {
  id: number
  name: string
  code?: string
  type?: string
}

type OptionItem = {
  id: number
  name: string
  code?: string
  symbol?: string
}

type AccountOption = {
  id: number
  name: string
  code?: string
  account_number?: string
}

type BranchOption = {
  id: number
  name: string
}

type UserOption = {
  id: number
  name: string
  email?: string
}

type DimensionType = {
  id: number
  code: string
  name: string
}

type DimensionValue = {
  id: number
  dimension_type_id: number
  code: string
  name: string
}

// Material line item
type MaterialLine = {
  _key: string
  itemId: number | null
  unitId: number | null
  quantity: number
  // We now capture the total amount per line directly for space efficiency
  amount: number
  currencyId: number | null
  description: string
} 

// Account line item
type AccountLine = {
  _key: string
  accountId: number | null
  currencyId: number | null
  amount: number
  description: string
}

// Dimension allocation
type DimensionLine = {
  _key: string
  dimensionTypeId: number | null
  dimensionValueId: number | null
  amount: number | null
  percentage: number | null
}

// Source record for requisition
type SourceLine = {
  _key: string
  sourceType: SourceType | null
  payee: string
  sourceAccountId: number | null
  modeOfPayment: ModeOfPayment | null
  currencyId: number | null
  exchangeRate: number
  description: string
}

const apiBase = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
const toast = useToast()

const requisitions = ref<Requisition[]>([])
const router = useRouter()
const route = useRoute()
const appOptionStore = useAppOptionStore()
const originalSidebarState = ref(false)
const sidebarMinifiedForCreate = ref(false)
const showForm = ref(false)
const isEditMode = ref(false)
const loadingList = ref(false)
const loadingForm = ref(false)
const loadingAction = ref(false)
const savingForm = ref(false)
const errorMessage = ref('')

// Lookups
const requisitionTypes = ref<RequisitionTypeOption[]>([])
const itemsOptions = ref<OptionItem[]>([])
const unitsOptions = ref<OptionItem[]>([])
const currencies = ref<OptionItem[]>([])
const accounts = ref<AccountOption[]>([])
const branches = ref<BranchOption[]>([])
const users = ref<UserOption[]>([])
const dimensionTypes = ref<DimensionType[]>([])
const dimensionValues = ref<DimensionValue[]>([])
const vatOptions = ref<OptionItem[]>([])

// Form tabs
const formTabs = ['Sources','Materials', 'Accounts', 'Dimensions'] as string[]
type FormTab = 'Sources' | 'Materials' | 'Accounts' | 'Dimensions'
const activeFormTab = ref<FormTab>('Sources')

const userLabel = (value: any): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return ''

  return (
    value.email ||
    value.username ||
    value.name ||
    value.full_name ||
    value.display_name ||
    ''
  )
}

const requisitionItemAllowedSubtypes = new Set([
  'SPARE_PART',
  'LUBRICANT',
  'TOOL',
  'JOB_SERVICE',
  'ACCOMMODATION',
  'TRANSPORT',
  'FEE',
  'OTHER',
])

// Comprehensive form structure
const form = reactive({
  // Header information
  id: 0,
  requisitionTypeId: null as number | null,
  fundDirection: 'EXPENSE' as FundDirection,
  currencyId: null as number | null,
  branchId: null as number | null,
  date: new Date().toISOString().slice(0, 10),
  requiredDate: '',
  remarks: '',
  
  // Item-level settings (applied to requisition_items)
  taxMethod: 'EXCLUSIVE' as TaxMethod,
  discountMethod: null as DiscountMethod | null,
  discountAmount: 0,
  vatId: null as number | null,
  
  // Line items
  materials: [] as MaterialLine[],
  accounts: [] as AccountLine[],
  // Single shared source for the whole requisition
  source: {
    _key: '',
    sourceType: null,
    payee: '',
    sourceAccountId: null,
    modeOfPayment: null,
    currencyId: null,
    exchangeRate: 1,
    description: '',
  } as SourceLine,
  dimensions: [] as DimensionLine[],
  
  // Legacy - kept for backwards compatibility
  items: [
    {
      id: 1,
      description: '',
      quantity: 1,
      rate: 0,
      itemId: null,
      unitId: null,
    },
  ] as RequisitionItem[],
})

// Initialize form with default lines
const initializeFormLines = () => {
  if (form.materials.length === 0) {
    addMaterialLine()
  }
}

// Computed values
const materialsTotal = computed(() => {
  return form.materials.reduce((sum, line) => {
    // Prefer explicit line.amount; fallback to quantity*rate if older data exists
    const lineAmount = (line as any).amount !== undefined ? Number((line as any).amount || 0) : Number((line as any).quantity || 0) * Number((line as any).rate || 0)
    return sum + lineAmount
  }, 0)
})

const accountsTotal = computed(() => {
  return form.accounts.reduce((sum, line) => {
    return sum + (line.amount || 0)
  }, 0)
})

const grandTotal = computed(() => {
  return materialsTotal.value + accountsTotal.value
})

const getCurrencySymbol = () => {
  if (!form.currencyId) return ''
  const currency = currencies.value.find(c => c.id === form.currencyId)
  return currency?.symbol || currency?.code || ''
}

// Line item management
const generateKey = () => crypto.randomUUID()

const addMaterialLine = () => {
  form.materials.push({
    _key: generateKey(),
    itemId: null,
    unitId: null,
    quantity: 1,
    amount: 0,
    currencyId: form.currencyId,
    description: '',
  })
} 

const removeMaterialLine = (key: string) => {
  if (form.materials.length <= 1) return
  const index = form.materials.findIndex(l => l._key === key)
  if (index >= 0) form.materials.splice(index, 1)
}

const addAccountLine = () => {
  form.accounts.push({
    _key: generateKey(),
    accountId: null,
    currencyId: form.currencyId,
    amount: 0,
    description: '',
  })
}

const removeAccountLine = (key: string) => {
  const index = form.accounts.findIndex(l => l._key === key)
  if (index >= 0) form.accounts.splice(index, 1)
}

// Sources are now a single shared source stored in form.source. Remove multi-source helpers.
// (Left in place for reference; no-op add/remove removed.)

const addDimensionLine = () => {
  form.dimensions.push({
    _key: generateKey(),
    dimensionTypeId: null,
    dimensionValueId: null,
    amount: null,
    percentage: null,
  })
}

const removeDimensionLine = (key: string) => {
  const index = form.dimensions.findIndex(l => l._key === key)
  if (index >= 0) form.dimensions.splice(index, 1)
}

// Get filtered dimension values based on selected type
const getFilteredDimensionValues = (typeId: number | null) => {
  if (!typeId) return []
  return dimensionValues.value.filter(v => v.dimension_type_id === typeId)
}

// Tab icon mapping
const getTabIcon = (tab: string) => {
  switch (tab as FormTab) {
    case 'Materials': return '📦'
    case 'Accounts': return '📊'
    case 'Sources': return '💳'
    default: return '📋'
  }
}

const getTabCount = (tab: string) => {
  switch (tab as FormTab) {
    case 'Materials': return form.materials.length
    case 'Accounts': return form.accounts.length
    case 'Sources': return form.source && form.source.sourceType ? 1 : 0
    default: return 0
  }
}

// Watch currency changes to update line items
watch(() => form.currencyId, (newCurrencyId) => {
  form.materials.forEach(line => {
    line.currencyId = newCurrencyId
  })
  form.accounts.forEach(line => {
    line.currencyId = newCurrencyId
  })
  // Force single shared source currency to the requisition currency and reset exchange rate to 1
  if (form.source) {
    form.source.currencyId = newCurrencyId
    form.source.exchangeRate = 1
  }
})

const tableFilters = ref({
  search: '',
  pageSize: 10,
  currentPage: 1,
  sortField: '',
  sortDirection: 'asc',
  status: '',
})

const filteredRequisitions = computed(() => {
  const status = tableFilters.value.status
  if (!status) {
    return requisitions.value
  }
  return requisitions.value.filter((req) => req.status === status)
})

const statusBadgeClass = (status: RequisitionStatus) => {
  switch (status) {
    case 'DRAFT':
      return 'badge bg-secondary'
    case 'SUBMITTED':
      return 'badge bg-info'
    case 'APPROVAL_PENDING':
      return 'badge bg-warning text-dark'
    case 'APPROVED':
      return 'badge bg-success'
    case 'REJECTED':
      return 'badge bg-danger'
    case 'CANCELLED':
      return 'badge bg-dark'
    case 'CLOSED':
      return 'badge bg-primary'
    default:
      return 'badge bg-secondary'
  }
}

const formatAmount = (value: number) => {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatMoney = (value: number, currencySymbol?: string) => {
  const symbol = currencySymbol ? String(currencySymbol).trim() : ''
  return symbol ? `${symbol}${formatAmount(value)}` : formatAmount(value)
}

const getTotal = (req: Requisition) => {
  return req.items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
}

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'requisitionType', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'actions', label: 'Actions', width: 120 },
]


const customFilters = computed(() => {
  return [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'APPROVAL_PENDING', label: 'Approval Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'CLOSED', label: 'Closed' },
      ],
      defaultValue: '',
    },
  ]
})

// Action buttons to display in the table header (delegated to StandardDataTable)
const tableActionButtons = ref([
  {
    label: 'Add Requisition',
    icon: 'fa fa-plus',
    class: 'btn btn-primary',
    tooltip: 'Create a new requisition',
    method: () => openCreateForm(),
  },
  {
    label: '',
    icon: 'fa fa-th',
    class: 'btn btn-outline-secondary',
    tooltip: 'Toggle grid',
    method: () => {},
  },
])

const handleFiltersUpdate = (filters: any) => {
  tableFilters.value = { ...tableFilters.value, ...filters }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const resetForm = () => {
  form.id = 0
  form.requisitionTypeId = requisitionTypes.value[0]?.id || null
  form.fundDirection = 'EXPENSE'
  form.currencyId = currencies.value[0]?.id || null
  form.branchId = branches.value[0]?.id || null
  form.date = new Date().toISOString().slice(0, 10)
  form.requiredDate = ''
  form.remarks = ''
  form.taxMethod = 'EXCLUSIVE'
  form.discountMethod = null
  form.discountAmount = 0
  form.vatId = null
  
  // Reset line items
  form.materials = []
  form.accounts = []
  form.dimensions = []
  form.source = {
    _key: generateKey(),
    sourceType: null,
    payee: '',
    sourceAccountId: null,
    modeOfPayment: null,
    currencyId: form.currencyId,
    exchangeRate: 1,
    description: '',
  }
  
  // Add initial material line
  addMaterialLine()
  
  // Reset active tab to Sources so funding inputs are visible on open
  activeFormTab.value = 'Sources'
  
  // Legacy
  form.items = [
    {
      id: 1,
      description: '',
      quantity: 1,
      rate: 0,
      itemId: null,
      unitId: null,
    },
  ]
}

const mapApproval = (approval: any): ApprovalRecord => {
  return {
    id: approval.id || Date.now(),
    level:
      approval?.approval_chain_level?.level_id ||
      approval?.approval_chain_level_id ||
      approval?.level ||
      1,
    status: approval.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
    date: approval.date || approval.created_at || new Date().toISOString(),
    remarks: approval.remarks || '',
    handledBy:
      userLabel(approval?.handled_by_user) ||
      userLabel(approval?.approved_by_user) ||
      userLabel(approval?.handled_by) ||
      userLabel(approval?.approved_by) ||
      'Unknown',
  }
}

const mapItems = (items: any[]): RequisitionItem[] => {
  const mapped: RequisitionItem[] = []
  for (const item of items || []) {
    if (Array.isArray(item.materials) && item.materials.length > 0) {
      for (const material of item.materials) {
        mapped.push({
          id: material.id || item.id,
          description: material.description || material.item?.name || item.remarks || '',
          quantity: Number(material.quantity || 0),
          rate: Number(material.rate || 0),
          itemId: material.item_id || material.item?.id || null,
          unitId: material.unit_of_measurement_id || material.unit_of_measurement?.id || null,
          itemName: material.item?.name || '',
          unitName: material.unit_of_measurement?.name || '',
        })
      }
    } else {
      mapped.push({
        id: item.id,
        description: item.remarks || '',
        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        itemId: null,
        unitId: null,
      })
    }
  }
  return mapped.length
    ? mapped
    : [
        {
          id: 1,
          description: '',
          quantity: 0,
          rate: 0,
          itemId: null,
          unitId: null,
        },
      ]
}
const mapRequisition = (req: any): Requisition => {
  return {
    id: req.id,
    code: req.code || req.reference || `REQ-${String(req.id).padStart(4, '0')}`,
    requisitionType:
      req.requisition_type?.name ||
      req.requisition_type_name ||
      `Type ${req.requisition_type_id || ''}`,
    requisitionTypeId: req.requisition_type?.id || req.requisition_type_id || null,
    fundDirection: req.fund_direction || 'WITHDRAW',
    date: req.date || req.created_at?.slice(0, 10) || '',
    requiredDate: req.required_date || '',
    requestedBy:
      userLabel(req.requested_by_user) ||
      userLabel(req.requested_by) ||
      userLabel(req.user) ||
      'Unknown',
    handler:
      userLabel(req.handler_user) ||
      userLabel(req.handler) ||
      'Unknown',
    remarks: req.remarks || '',
    status: req.status || 'DRAFT',
    items: mapItems(req.items || []),
    approvals: (req.approvals || []).map(mapApproval),
    currencyId:
      req.items?.[0]?.currency_id ||
      req.items?.[0]?.materials?.[0]?.currency_id ||
      null,
    currencySymbol:
      req.items?.[0]?.currency?.symbol ||
      req.items?.[0]?.materials?.[0]?.currency?.symbol ||
      req.items?.[0]?.materials?.[0]?.item?.currency?.symbol ||
      '',
  }
}

// Load all metadata from a single endpoint for efficiency
const loadMetadata = async () => {
  try {
    const response = await axios.get(`${apiBase}/requisitions/creation-metadata`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
    const metadata = response.data?.data || {}

    // Map requisition types
    const types = metadata.requisition_types || []
    requisitionTypes.value = (Array.isArray(types) ? types : []).map((type: any) => ({
      id: type.id,
      name: type.name || type.type || `Type ${type.id}`,
      code: type.code,
      type: type.type,
    }))

    // Map items
    const items = metadata.items || []
    const rawItems = Array.isArray(items) ? items : []
    const hasFilterFields = rawItems.some(
      (item: any) => item && (item.subtype !== undefined || item.is_active !== undefined || item.is_purchasable !== undefined),
    )
    const filteredItems = hasFilterFields
      ? rawItems.filter((item: any) => {
          if (!item) return false
          const subtype = String(item.subtype || '').trim()
          const isActive =
            item.is_active === undefined ? true : Boolean(Number(item.is_active))
          const isPurchasable =
            item.is_purchasable === undefined ? false : Boolean(Number(item.is_purchasable))
          return (
            isActive &&
            isPurchasable &&
            requisitionItemAllowedSubtypes.has(subtype)
          )
        })
      : rawItems

    itemsOptions.value = filteredItems.map((item: any) => ({
      id: item.id,
      name: item.name || `Item ${item.id}`,
      code: item.code,
    }))

    // Map units of measurement
    const units = metadata.unit_of_measurements || []
    unitsOptions.value = (Array.isArray(units) ? units : []).map((unit: any) => ({
      id: unit.id,
      name: unit.name || unit.code || `Unit ${unit.id}`,
      code: unit.code,
    }))

    // Map currencies
    const curs = metadata.currencies || []
    currencies.value = (Array.isArray(curs) ? curs : []).map((currency: any) => ({
      id: currency.id,
      name: currency.name || currency.code || `Currency ${currency.id}`,
      code: currency.code,
      symbol: currency.symbol,
    }))
    
    // Map accounts
    const accts = metadata.accounts || []
    accounts.value = (Array.isArray(accts) ? accts : []).map((account: any) => ({
      id: account.id,
      name: account.name || account.account_name || `Account ${account.id}`,
      code: account.code || account.account_number,
      account_number: account.account_number,
    }))
    
    // Map branches
    const brnchs = metadata.branches || []
    branches.value = (Array.isArray(brnchs) ? brnchs : []).map((branch: any) => ({
      id: branch.id,
      name: branch.name || `Branch ${branch.id}`,
    }))
    
    // Map users
    const usrs = metadata.users || []
    users.value = (Array.isArray(usrs) ? usrs : []).map((user: any) => ({
      id: user.id,
      name: user.name || user.full_name || user.email || `User ${user.id}`,
      email: user.email,
    }))
    
    // Map dimension types and values if available
    const dimTypes = metadata.dimension_types || metadata.accounting_dimension_types || []
    dimensionTypes.value = (Array.isArray(dimTypes) ? dimTypes : []).map((dt: any) => ({
      id: dt.id,
      code: dt.code || '',
      name: dt.name || `Dimension ${dt.id}`,
    }))
    
    const dimValues = metadata.dimension_values || metadata.accounting_dimension_values || []
    dimensionValues.value = (Array.isArray(dimValues) ? dimValues : []).map((dv: any) => ({
      id: dv.id,
      dimension_type_id: dv.dimension_type_id,
      code: dv.code || '',
      name: dv.name || `Value ${dv.id}`,
    }))
    
    // Map VAT options if available
    const vats = metadata.value_added_taxes || metadata.vat || []
    vatOptions.value = (Array.isArray(vats) ? vats : []).map((vat: any) => ({
      id: vat.id,
      name: vat.name || `${vat.rate || 0}%`,
      code: vat.code,
    }))
    
  } catch (error) {
    console.error('Failed to load requisition metadata:', error)
    // Initialize empty arrays on error
    requisitionTypes.value = []
    itemsOptions.value = []
    unitsOptions.value = []
    currencies.value = []
    accounts.value = []
    branches.value = []
    users.value = []
    dimensionTypes.value = []
    dimensionValues.value = []
    vatOptions.value = []
  }
}

const loadRequisitions = async () => {
  loadingList.value = true
  errorMessage.value = ''
  try {
    const response = await requisitionService.list()
    const data = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : []
    requisitions.value = data.map(mapRequisition)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to load requisitions.'
  } finally {
    loadingList.value = false
  }
}

// Individual load functions removed - now using consolidated loadMetadata()

const openCreateForm = () => {
  // Only "Add Requisition" should minify the sidebar
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true
  sidebarMinifiedForCreate.value = true

  resetForm()
  showForm.value = true
  isEditMode.value = false
}

const openEditForm = (req: Requisition) => {
  resetForm() // Reset first to clear any previous data
  
  form.id = req.id
  form.requisitionTypeId = req.requisitionTypeId
  form.fundDirection = req.fundDirection
  form.currencyId = req.currencyId ?? currencies.value[0]?.id ?? null
  form.date = req.date
  form.requiredDate = req.requiredDate
  form.remarks = req.remarks
  
  // Map items to materials for edit
  form.materials = req.items.map((item) => ({
    _key: generateKey(),
    itemId: item.itemId,
    unitId: item.unitId,
    quantity: item.quantity,
    // Calculate existing line total (quantity * rate) into amount so users edit totals directly
    amount: Number(item.quantity || 1) * Number(item.rate || 0),
    currencyId: form.currencyId,
    description: item.description,
  }))
  
  // Ensure at least one material line
  if (form.materials.length === 0) {
    addMaterialLine()
  }
  
  // Legacy items for backwards compatibility
  form.items = req.items.map((item, index) => ({
    id: index + 1,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    itemId: item.itemId,
    unitId: item.unitId,
  }))
  
  // Map existing single source (if any) into the shared form.source
  const existingSource = (req as any).sources && (req as any).sources.length > 0 ? (req as any).sources[0] : null
  if (existingSource) {
    form.source = {
      _key: generateKey(),
      sourceType: existingSource.source_type || null,
      payee: existingSource.payee || '',
      sourceAccountId: existingSource.source_account_id || null,
      modeOfPayment: existingSource.mode_of_payment || null,
      currencyId: form.currencyId,
      // Requisition currency is authoritative; always set exchangeRate to 1
      exchangeRate: 1,
      description: existingSource.description || '',
    }
  } else {
    form.source = {
      _key: generateKey(),
      sourceType: null,
      payee: '',
      sourceAccountId: null,
      modeOfPayment: null,
      currencyId: form.currencyId,
      exchangeRate: 1,
      description: '',
    }
  }

  showForm.value = true
  isEditMode.value = true
}

const validateForm = () => {
  errorMessage.value = ''
  
  if (!form.requisitionTypeId) {
    errorMessage.value = 'Select a requisition type.'
    return false
  }
  if (!form.fundDirection) {
    errorMessage.value = 'Select fund direction.'
    return false
  }
  if (!form.requiredDate) {
    errorMessage.value = 'Required date is required.'
    return false
  }
  if (!form.currencyId) {
    errorMessage.value = 'Currency is required.'
    return false
  }
  
  // Validate materials
  const hasValidMaterials = form.materials.some(m => m.itemId && (Number((m as any).amount || 0) > 0))
  const hasValidAccounts = form.accounts.some(a => a.accountId && a.amount > 0)
  
  if (!hasValidMaterials && !hasValidAccounts) {
    errorMessage.value = 'Add at least one material or account line with valid data.'
    return false
  }
  
  // Validate each material line that has data
  for (const material of form.materials) {
    if ((material as any).amount || material.itemId) {
      if (!material.itemId) {
        errorMessage.value = 'Please select an item for all material lines.'
        return false
      }
      if (!material.unitId) {
        errorMessage.value = 'Please select a unit for all material lines.'
        return false
      }
      if (Number((material as any).amount || 0) <= 0) {
        errorMessage.value = 'Amount must be greater than zero for each material line.'
        return false
      }
    }
  }
  
  // Validate each account line that has data
  for (const account of form.accounts) {
    if (account.accountId || account.amount > 0) {
      if (!account.accountId) {
        errorMessage.value = 'Please select an account for all account lines.'
        return false
      }
      if (account.amount <= 0) {
        errorMessage.value = 'Amount must be greater than zero.'
        return false
      }
    }
  }
  
  return true
}

const saveForm = async (asDraft = false) => {
  if (!asDraft && !validateForm()) return
  
  savingForm.value = true
  errorMessage.value = ''
  
  try {
    // Filter out empty material lines
    const validMaterials = form.materials.filter(m => m.itemId && m.unitId && m.quantity > 0)
    const validAccounts = form.accounts.filter(a => a.accountId && a.amount > 0)
    // Single shared source - include it only if it has a type
    const validSources = form.source && form.source.sourceType ? [form.source] : []
    
    const payload = {
      company_id: 1,
      branch_id: form.branchId || 1,
      user_id: 1,
      requisition_type_id: form.requisitionTypeId,
      fund_direction: form.fundDirection,
      required_date: form.requiredDate,
      date: form.date,
      remarks: form.remarks,
      status: asDraft ? 'DRAFT' : 'SUBMITTED',
      
      // Requisition items with materials and accounts
      items: validMaterials.length > 0 ? [{
        currency_id: form.currencyId,
        value_added_tax_id: form.vatId,
        discount_amount: form.discountAmount || null,
        discount_method: form.discountMethod,
        tax_method: form.taxMethod,
        remarks: form.remarks,
        materials: validMaterials.map((m) => ({
          item_id: m.itemId,
          unit_of_measurement_id: m.unitId,
          // Derive rate from total amount (rate = amount / quantity) and ensure quantity is at least 1
          quantity: m.quantity && m.quantity > 0 ? m.quantity : 1,
          rate: (Number(m.amount || 0) || 0) / (m.quantity && m.quantity > 0 ? m.quantity : 1),
          currency_id: m.currencyId || form.currencyId,
          description: m.description,
        })),

        accounts: validAccounts.map((a) => ({
          account_id: a.accountId,
          currency_id: a.currencyId || form.currencyId,
          amount: a.amount,
          description: a.description,
        })),
      }] : validAccounts.length > 0 ? [{
        currency_id: form.currencyId,
        value_added_tax_id: form.vatId,
        discount_amount: form.discountAmount || null,
        discount_method: form.discountMethod,
        tax_method: form.taxMethod,
        remarks: form.remarks,
        accounts: validAccounts.map((a) => ({
          account_id: a.accountId,
          currency_id: a.currencyId || form.currencyId,
          amount: a.amount,
          description: a.description,
        })),
      }] : [],
      
      // Requisition sources
      sources: validSources.map((s) => ({
        source_type: s.sourceType,
        payee: s.payee,
        source_account_id: s.sourceAccountId,
        mode_of_payment: s.modeOfPayment,
        currency_id: s.currencyId || form.currencyId,
        exchange_rate: s.exchangeRate,
        description: s.description,
      })),
    }

    if (isEditMode.value) {
      await requisitionService.update(form.id, payload)
      toast.init({ message: 'Requisition updated successfully', color: 'success' })
    } else {
      await requisitionService.create(payload)
      toast.init({ message: asDraft ? 'Draft saved successfully' : 'Requisition created successfully', color: 'success' })
    }

    showForm.value = false
    resetForm()

    if (sidebarMinifiedForCreate.value && !isEditMode.value) {
      appOptionStore.appSidebarMinified = originalSidebarState.value
      sidebarMinifiedForCreate.value = false
    }

    await loadRequisitions()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to save requisition.'
    toast.init({ message: errorMessage.value, color: 'danger' })
  } finally {
    savingForm.value = false
  }
}

const cancelForm = () => {
  if (sidebarMinifiedForCreate.value) {
    appOptionStore.appSidebarMinified = originalSidebarState.value
    sidebarMinifiedForCreate.value = false
  }
  showForm.value = false
  resetForm()
}

const removeItem = (index: number) => {
  if (form.items.length === 1) return
  form.items.splice(index, 1)
}

const addItem = () => {
  const nextId = form.items.length
    ? Math.max(...form.items.map((item) => item.id)) + 1
    : 1
  form.items.push({
    id: nextId,
    description: '',
    quantity: 1,
    rate: 0,
    itemId: null,
    unitId: null,
  })
}

const viewRequisition = (req: any) => {
  const id = Number(req?.id)
  if (!id) return
  router.push(`/sales/requisitions/${id}`)
}

const handleRouteQuery = async (query: any) => {
  const editId = query?.editId
  if (!editId) return

  const id = Number(editId)
  if (!id) return

  try {
    const response = await requisitionService.get(id)
    const data = response?.data || response
    const mapped = mapRequisition(data)
    openEditForm(mapped)
  } catch {
    // ignore
  } finally {
    const { editId: _ignore, ...rest } = query
    router.replace({ query: rest })
  }
}

onMounted(async () => {
  await Promise.all([
    loadRequisitions(),
    loadMetadata(),
  ])
  if (!form.requisitionTypeId && requisitionTypes.value.length) {
    form.requisitionTypeId = requisitionTypes.value[0].id
  }
  await handleRouteQuery(route.query)
})

onUnmounted(() => {
  // Restore sidebar state if we minified it for the create form
  if (sidebarMinifiedForCreate.value) {
    appOptionStore.appSidebarMinified = originalSidebarState.value
    sidebarMinifiedForCreate.value = false
  }
})
</script>
<template>
  <div class="requisition-page">
    <!-- CREATE/EDIT FORM VIEW -->
    <RequisitionForm
      v-if="showForm"
      v-model:form="form"
      v-model:activeFormTab="activeFormTab"
      :is-edit-mode="isEditMode"
      :saving-form="savingForm"
      :error-message="errorMessage"
      :requisition-types="requisitionTypes"
      :branches="branches"
      :currencies="currencies"
      :items-options="itemsOptions"
      :units-options="unitsOptions"
      :accounts="accounts"
      :users="users"
      :dimension-types="dimensionTypes"
      :dimension-values="dimensionValues"
      :vat-options="vatOptions"
      :form-tabs="formTabs"
      :materials-total="materialsTotal"
      :accounts-total="accountsTotal"
      :grand-total="grandTotal"
      :get-tab-icon="getTabIcon"
      :get-tab-count="getTabCount"
      :get-currency-symbol="getCurrencySymbol"
      :format-amount="formatAmount"
      @cancel="cancelForm"
      @reset="resetForm"
      @save="saveForm"
      @clear-error="errorMessage = ''"
      @add-material="addMaterialLine"
      @remove-material="removeMaterialLine"
      @add-account="addAccountLine"
      @remove-account="removeAccountLine"
      @add-dimension="addDimensionLine"
      @remove-dimension="removeDimensionLine"
    />

    <!-- LIST VIEW -->
    <template v-else>
      <div class="container-fluid">
        <!-- Breadcrumb -->
        <div class="breadcrumb-section mb-3">
          <span class="breadcrumb-item">SALES</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item active">REQUISITIONS</span>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fa fa-exclamation-triangle me-2"></i>
          {{ errorMessage }}
          <button type="button" class="btn-close" @click="errorMessage = ''"></button>
        </div>

        <!-- Main Table -->
        <div class="row layout-top-spacing bg-white rounded">
          <div class="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
            <div class="panel br-6 p-0">
              <div class="custom-table p-3">
                <StandardDataTable
                  :columns="columns"
                  :data="filteredRequisitions"
                  :loading="loadingList"
                  :filters="tableFilters"
                  :action-buttons="tableActionButtons"
                  :default-page-size="tableFilters.pageSize"
                  :disable-pagination="false"
                  :show-date-filters="false"
                  :custom-filters="customFilters"
                  @update:filters="handleFiltersUpdate"
                >
                  <template #status="{ row }">
                    <span :class="statusBadgeClass((row as any).status)">
                      {{ (row as any).status }}
                    </span>
                  </template>
                  <template #total="{ row }">
                    {{ formatMoney(getTotal(row as any), (row as any).currencySymbol) }}
                  </template>
                  <template #actions="{ row }">
                    <button
                      class="btn btn-info btn-sm me-1"
                      title="View Details"
                      @click="viewRequisition(row as any)"
                    >
                      <i class="fa fa-eye"></i>
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      title="Delete"
                      :disabled="(row as any).status !== 'DRAFT'"
                    >
                      <i class="fa fa-trash"></i>
                    </button>
                  </template>
                </StandardDataTable>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
/* ========================================
   REQUISITION PAGE STYLES
   Following CreatePricesListForm pattern
   ======================================== */

/* Page Layout */
.requisition-page {
  min-height: 100vh;
  background: var(--bg);
}

/* ========================================
   LIST VIEW STYLES (Existing)
   ======================================== */
/* Breadcrumb */
.breadcrumb-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 1rem 0;
}

.breadcrumb-item {
  color: #6c757d;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.breadcrumb-item.active {
  color: #212529;
}

.breadcrumb-separator {
  color: #6c757d;
}

/* Cards */
.card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 1.5rem;
}

/* Badges */
.badge {
  padding: 0.35rem 0.65rem;
  font-weight: 500;
  font-size: 0.75rem;
  border-radius: 4px;
}

/* Alert */
.alert {
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
