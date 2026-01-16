
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { requisitionService } from '@/stores/bushman/requisitionService'
import StandardDataTable from '@/components/bootstrap/StandardDataTable.vue'
import RequisitionForm from '@/views/bushman/sales/RequisitionForm.vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'
import Swal from 'sweetalert2'

type RequisitionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED'

type FundDirection = 'WITHDRAW' | 'EXPENSE'
type SourceType = 'CASH' | 'STORE' | 'PARTIES' | 'VENDOR' | 'SERVICE_PROVIDER'
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

type RequisitionItemForm = {
  _key: string
  currencyId: number | null
  vatId: number | null
  discountAmount: number
  discountMethod: DiscountMethod | null
  taxMethod: TaxMethod | null
  remarks: string
  materials: MaterialLine[]
  accounts: AccountLine[]
  dimensions: DimensionLine[]
  _materialsExpanded?: boolean
  _accountsExpanded?: boolean
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
  statusLabel?: string
  items: RequisitionItem[]
  approvals: ApprovalRecord[]
  currencyId: number | null
  currencySymbol?: string
  payee?: string
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
  rate: number
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
  sourceId: number | null
  accountId: number | null
  payee: string
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
const locations = ref<OptionItem[]>([])
const entities = ref<OptionItem[]>([])
const dimensionTypes = ref<DimensionType[]>([])
const dimensionValues = ref<DimensionValue[]>([])
const vatOptions = ref<OptionItem[]>([])

// Form tabs
type FormTab = 'sources' | 'items'
const activeFormTab = ref<FormTab>('sources')

const generateKey = () => crypto.randomUUID()

const createEmptyItem = (): RequisitionItemForm => ({
  _key: generateKey(),
  currencyId: form.currencyId,
  vatId: null,
  discountAmount: 0,
  discountMethod: null,
  taxMethod: 'EXCLUSIVE',
  remarks: '',
  materials: [
    {
      _key: generateKey(),
      itemId: null,
      unitId: null,
      quantity: 1,
      rate: 0,
      currencyId: form.currencyId,
      description: '',
    },
  ],
  accounts: [
    {
      _key: generateKey(),
      accountId: null,
      currencyId: form.currencyId,
      amount: 0,
      description: '',
    },
  ],
  dimensions: [
    {
      _key: generateKey(),
      dimensionTypeId: null,
      dimensionValueId: null,
      amount: null,
      percentage: null,
    },
  ],
  _materialsExpanded: true,
  _accountsExpanded: false,
})

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
  taxMethod: 'EXCLUSIVE' as TaxMethod,

  // Single shared source for the whole requisition
  source: {
    _key: '',
    sourceType: null,
    sourceId: null,
    accountId: null,
    payee: '',
    modeOfPayment: null,
    currencyId: null,
    exchangeRate: 1,
    description: '',
  } as SourceLine,

  // Requisition items (each manages its own materials/accounts/dimensions)
  items: [] as RequisitionItemForm[],
})

// Avoid v-model assignment to a const reactive object (Vue compiler generates `form = $event` otherwise).
const formModel = computed({
  get: () => form,
  set: (value) => Object.assign(form, value),
})

// Computed values
const materialsTotal = computed(() => {
  return form.items.reduce((sum, item) => {
    const itemMaterialsTotal = (item.materials || []).reduce((subSum, line) => {
      const lineAmount =
        Number((line as any).quantity || 0) * Number((line as any).rate || 0)
      return subSum + lineAmount
    }, 0)
    return sum + itemMaterialsTotal
  }, 0)
})

const accountsTotal = computed(() => {
  return form.items.reduce((sum, item) => {
    const itemAccountsTotal = (item.accounts || []).reduce((subSum, line) => subSum + (line.amount || 0), 0)
    return sum + itemAccountsTotal
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

const findItemOrThrow = (itemKey: string) => {
  const item = form.items.find((i) => i._key === itemKey)
  if (!item) throw new Error('Item not found')
  return item
}

const addItem = () => {
  form.items.push(createEmptyItem())
}

const removeItem = (itemKey: string) => {
  if (form.items.length <= 1) return
  const index = form.items.findIndex((i) => i._key === itemKey)
  if (index >= 0) form.items.splice(index, 1)
}

const addMaterialLine = (itemKey: string) => {
  const item = findItemOrThrow(itemKey)
  item.materials.push({
    _key: generateKey(),
    itemId: null,
    unitId: null,
    quantity: 1,
    rate: 0,
    currencyId: item.currencyId ?? form.currencyId,
    description: '',
  })
}

const removeMaterialLine = (itemKey: string, materialKey: string) => {
  const item = findItemOrThrow(itemKey)
  if (item.materials.length <= 1) return
  const index = item.materials.findIndex((l) => l._key === materialKey)
  if (index >= 0) item.materials.splice(index, 1)
}

const addAccountLine = (itemKey: string) => {
  const item = findItemOrThrow(itemKey)
  if (item.accounts.length > 0) return
  item.accounts.push({
    _key: generateKey(),
    accountId: null,
    currencyId: item.currencyId ?? form.currencyId,
    amount: 0,
    description: '',
  })
}

const removeAccountLine = (itemKey: string, accountKey: string) => {
  const item = findItemOrThrow(itemKey)
  const index = item.accounts.findIndex((l) => l._key === accountKey)
  if (index >= 0) item.accounts.splice(index, 1)
}

const addDimensionLine = (itemKey: string) => {
  const item = findItemOrThrow(itemKey)
  if (item.dimensions.length > 0) return
  item.dimensions.push({
    _key: generateKey(),
    dimensionTypeId: null,
    dimensionValueId: null,
    amount: null,
    percentage: null,
  })
}

const removeDimensionLine = (itemKey: string, dimensionKey: string) => {
  const item = findItemOrThrow(itemKey)
  const index = item.dimensions.findIndex((l) => l._key === dimensionKey)
  if (index >= 0) item.dimensions.splice(index, 1)
}

// Watch currency changes to update line items
watch(() => form.currencyId, (newCurrencyId) => {
  form.items.forEach((item) => {
    item.currencyId = newCurrencyId
    item.materials.forEach((line) => {
      line.currencyId = item.currencyId ?? newCurrencyId
    })
    item.accounts.forEach((line) => {
      line.currencyId = item.currencyId ?? newCurrencyId
    })
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

const formatDisplayDate = (value: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

const getTotal = (req: Requisition) => {
  return req.items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
}

const columns = [
  { key: 'code', label: 'REQNO.', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'requiredDate', label: 'Required', sortable: true },
  { key: 'requisitionType', label: 'Request For', sortable: true },
  { key: 'requestedBy', label: 'Created By', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
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

  // Reset items
  form.items = []
  form.source = {
    _key: generateKey(),
    sourceType: null,
    sourceId: null,
    accountId: null,
    payee: '',
    modeOfPayment: null,
    currencyId: form.currencyId,
    exchangeRate: 1,
    description: '',
  }

  // Shared cost centers
  form.costCenters = []


  // Ensure at least one item exists
  addItem()

  // Reset active tab to Sources so funding inputs are visible on open
  activeFormTab.value = 'sources'
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
    statusLabel: req.status_label || req.statusLabel || req.status || 'DRAFT',
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
    payee: req.sources?.[0]?.payee || req.payee || ''
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

    // Map locations and entities if provided
    const locs = metadata.locations || []
    locations.value = (Array.isArray(locs) ? locs : []).map((location: any) => ({
      id: location.id,
      name: location.name || location.code || `Location ${location.id}`,
    }))

    const ents = metadata.entities || []
    entities.value = (Array.isArray(ents) ? ents : []).map((entity: any) => ({
      id: entity.id,
      name: entity.full_name || entity.name || entity.nick_name || `Entity ${entity.id}`,
    }))
    
    // Map dimension types and values if available
    const dimTypes = metadata.dimension_types || metadata.accounting_dimension_types || []
    const mappedDimTypes = (Array.isArray(dimTypes) ? dimTypes : []).map((dt: any) => ({
      id: dt.id,
      code: dt.code || '',
      name: dt.name || `Dimension ${dt.id}`,
    }))
    
    const dimValues = metadata.dimension_values || metadata.accounting_dimension_values || []
    const mappedDimValues = (Array.isArray(dimValues) ? dimValues : []).map((dv: any) => ({
      id: dv.id,
      dimension_type_id: dv.dimension_type_id,
      code: dv.code || '',
      name: dv.name || `Value ${dv.id}`,
    }))

    dimensionTypes.value = mappedDimTypes
    dimensionValues.value = mappedDimValues

    // Fallback: if metadata does not include dimensions, load directly from endpoints
    if (dimensionTypes.value.length === 0 || dimensionValues.value.length === 0) {
      try {
        const [typesRes, valuesRes] = await Promise.all([
          requisitionService.listDimensionTypes({ active_only: true }),
          requisitionService.listDimensionValues({ active_only: true }),
        ])
        const rawTypes = (typesRes as any)?.data || typesRes || []
        const rawValues = (valuesRes as any)?.data || valuesRes || []

        dimensionTypes.value = (Array.isArray(rawTypes) ? rawTypes : []).map((dt: any) => ({
          id: dt.id,
          code: dt.code || '',
          name: dt.name || `Dimension ${dt.id}`,
        }))
        dimensionValues.value = (Array.isArray(rawValues) ? rawValues : []).map((dv: any) => ({
          id: dv.id,
          dimension_type_id: dv.dimension_type_id,
          code: dv.code || '',
          name: dv.name || `Value ${dv.id}`,
        }))
      } catch (dimError) {
        console.error('Failed to load accounting dimensions:', dimError)
      }
    }
    
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
    locations.value = []
    entities.value = []
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

  // Map legacy API items into per-item structures (1 requisition-item per legacy line)
  form.items = (req.items || []).map((line) => ({
    _key: generateKey(),
    currencyId: form.currencyId,
    vatId: null,
    discountAmount: 0,
    discountMethod: null,
    taxMethod: 'EXCLUSIVE',
    remarks: '',
    materials: [
      {
        _key: generateKey(),
        itemId: line.itemId,
        unitId: line.unitId,
        quantity: line.quantity || 1,
        rate: Number(line.rate || 0),
        currencyId: form.currencyId,
        description: line.description || '',
      },
    ],
    accounts: [],
    dimensions: [],
    _materialsExpanded: true,
    _accountsExpanded: false,
  }))

  if (form.items.length === 0) addItem()
  
  // Map existing single source (if any) into the shared form.source
  const existingSource = (req as any).sources && (req as any).sources.length > 0 ? (req as any).sources[0] : null
  if (existingSource) {
    form.source = {
      _key: generateKey(),
      sourceType: existingSource.source_type || null,
      sourceId: existingSource.source_id || null,
      accountId: existingSource.account_id || existingSource.source_id || null,
      payee: existingSource.payee || '',
      modeOfPayment: existingSource.mode_of_payment || null,
      currencyId: form.currencyId,
      // Requisition currency is authoritative; always set exchangeRate to 1 unless provided
      exchangeRate: Number(existingSource.exchange_rate || 1),
      description: existingSource.description || '',
    }
  } else {
    form.source = {
      _key: generateKey(),
      sourceType: null,
      sourceId: null,
      accountId: null,
      payee: '',
      modeOfPayment: null,
      currencyId: form.currencyId,
      exchangeRate: 1,
      description: '',
    }
  }

  // Reconstruct cost centers with nested items from API items
  const costCenterMap = new Map()
  for (const line of req.items || []) {
    const costCenterId = line.cost_center_id || (line.materials && line.materials[0]?.cost_center_id) || null
    if (!costCenterId) continue
    
    if (!costCenterMap.has(costCenterId)) {
      costCenterMap.set(costCenterId, {
        _key: generateKey(),
        costCenterId: costCenterId,
        items: []
      })
    }
    
    const material = line.materials && line.materials[0] || {}
    const account = line.accounts && line.accounts[0] || {}
    costCenterMap.get(costCenterId).items.push({
      _key: generateKey(),
      itemId: material.item_id || null,
      unitId: material.unit_of_measurement_id || null,
      quantity: material.quantity || 1,
      rate: Number(material.rate || 0),
      accountId: account.account_id || null,
      remarks: material.description || '',
    })
  }
  
  form.costCenters = Array.from(costCenterMap.values())

  showForm.value = true
  isEditMode.value = true
}

const validateForm = async () => {
  errorMessage.value = ''
  
  if (!form.requisitionTypeId) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Select a requisition type.',
      confirmButtonColor: '#2563eb'
    })
    return false
  }
  if (!form.fundDirection) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Select fund direction.',
      confirmButtonColor: '#2563eb'
    })
    return false
  }
  if (!form.requiredDate) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Required date is required.',
      confirmButtonColor: '#2563eb'
    })
    return false
  }
  if (!form.currencyId) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Currency is required.',
      confirmButtonColor: '#2563eb'
    })
    return false
  }
  const inferredSourceType = form.source?.sourceType || (form.source?.payee ? 'VENDOR' : null)
  if (inferredSourceType) {
    if (inferredSourceType === 'CASH' && !form.source.accountId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Select an account for CASH source type.',
        confirmButtonColor: '#2563eb'
      })
      return false
    }
    if (inferredSourceType === 'STORE' && !form.source.sourceId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Select a location for STORE source type.',
        confirmButtonColor: '#2563eb'
      })
      return false
    }
    if (inferredSourceType === 'PARTIES' && !form.source.sourceId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Select an entity for PARTIES source type.',
        confirmButtonColor: '#2563eb'
      })
      return false
    }
    if ((inferredSourceType === 'VENDOR' || inferredSourceType === 'SERVICE_PROVIDER') && !form.source.payee) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Enter a payee for VENDOR or SERVICE PROVIDER source type.',
        confirmButtonColor: '#2563eb'
      })
      return false
    }
  }

  const itemHasValidLines = (item: RequisitionItemForm) => {
    const hasValidMaterials = (item.materials || []).some((m) => m.itemId && m.unitId && Number(m.quantity || 0) > 0 && Number(m.rate || 0) > 0)
    const hasValidAccounts = (item.accounts || []).some((a) => a.accountId && a.amount > 0)
    return hasValidMaterials || hasValidAccounts
  }

  const costCenterHasValidItems = (cc: any) => {
    return (cc.items || []).some((it: any) => it.itemId && it.unitId && Number(it.quantity || 0) > 0 && Number(it.rate || 0) > 0 && it.accountId)
  }

  const anyValidLines = (form.items && form.items.some(itemHasValidLines)) || ((form as any).costCenters && (form as any).costCenters.some(costCenterHasValidItems))

  if (!anyValidLines) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Add at least one item with a valid material or account line.',
      confirmButtonColor: '#2563eb'
    })
    return false
  }

  // Validate legacy form.items
  for (const [index, item] of form.items.entries()) {
    // Validate each material line that has data
    for (const material of item.materials || []) {
      if (material.rate || material.itemId || material.unitId || material.quantity) {
        if (!material.itemId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: please select a material item.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (!material.unitId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: please select a unit for all material lines.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (Number(material.quantity || 0) <= 0) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: material quantity must be greater than zero.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (Number(material.rate || 0) <= 0) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: material rate must be greater than zero.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
      }
    }

    // Validate each account line that has data
    for (const account of item.accounts || []) {
      if (account.accountId || account.amount > 0) {
        if (!account.accountId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: please select an account for all account lines.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (account.amount <= 0) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: account amount must be greater than zero.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
      }
    }

    // Validate each dimension line that has data
    for (const dim of item.dimensions || []) {
      if (dim.dimensionTypeId || dim.dimensionValueId || dim.amount !== null || dim.percentage !== null) {
        if (!dim.dimensionValueId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Item ${index + 1}: please select a dimension value.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
      }
    }
  }

  // Validate cost center items
  if ((form as any).costCenters) {
    for (const [ccIndex, cc] of ((form as any).costCenters || []).entries()) {
      for (const [itIndex, it] of (cc.items || []).entries()) {
        if (!it.accountId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Cost center ${ccIndex + 1}, item ${itIndex + 1}: please select an account.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (!it.itemId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Cost center ${ccIndex + 1}, item ${itIndex + 1}: please select an item.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (!it.unitId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Cost center ${ccIndex + 1}, item ${itIndex + 1}: please select a unit.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (Number(it.quantity || 0) <= 0) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Cost center ${ccIndex + 1}, item ${itIndex + 1}: quantity must be greater than zero.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
        if (Number(it.rate || 0) <= 0) {
          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: `Cost center ${ccIndex + 1}, item ${itIndex + 1}: rate must be greater than zero.`,
            confirmButtonColor: '#2563eb'
          })
          return false
        }
      }
    }
  }

  return true
}

const saveForm = async (asDraft = false) => {
  if (!asDraft && !(await validateForm())) return
  
  savingForm.value = true
  errorMessage.value = ''
  
  try {
    // Single shared source - include it when a source is selected or payee is provided
    const validSources = form.source && (form.source.sourceType || form.source.payee) ? [form.source] : []

    const validItems = form.items
      .map((item: any) => {
        const materials = (item.materials || []).filter((m: any) => m.itemId && m.unitId && Number(m.quantity || 0) > 0 && Number(m.rate || 0) > 0)
        const accounts = (item.accounts || []).filter((a: any) => a.accountId && a.amount > 0)
        const dimensions = (item.dimensions || []).filter((d: any) => d.dimensionValueId)

        // If there are absolutely no entries and no main item selected, skip
        if (materials.length === 0 && accounts.length === 0 && !item.itemId) return null

        // If no child materials exist but main item is present, derive a material from the main item
        const materialsFinal = materials.length > 0
          ? materials
          : (item.itemId ? [{
              itemId: item.itemId,
              unitId: item.unitId,
              quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
              rate: item.rate || 0,
              description: item.description || '',
            }] : [])

        return {
          currency_id: form.currencyId,
          value_added_tax_id: item.vatId,
          discount_amount: item.discountAmount || null,
          discount_method: item.discountMethod,
          tax_method: form.taxMethod,
          remarks: item.remarks,
          materials: materialsFinal.map((m: any) => ({
            item_id: m.itemId,
            unit_of_measurement_id: m.unitId,
            quantity: m.quantity && m.quantity > 0 ? m.quantity : 1,
            rate: m.rate || 0,
            currency_id: form.currencyId,
            description: m.description || '' ,
          })),
          accounts: accounts.map((a: any) => ({
            account_id: a.accountId,
            currency_id: form.currencyId,
            amount: a.amount,
            description: a.description,
          })),
          dimensions: dimensions.map((d: any) => ({
            dimension_type_id: d.dimensionTypeId,
            dimension_value_id: d.dimensionValueId,
            amount: d.amount,
            percentage: d.percentage,
          })),
        }
      })
      .filter(Boolean)
     
    // Flatten cost center items into validItems with cost_center_id
    const allCostCenterItems = (form.costCenters || []).flatMap((cc: any) =>
      (cc.items || []).map((item: any) => {
        const materials = item.itemId && item.unitId ? [{
          item_id: item.itemId,
          unit_of_measurement_id: item.unitId,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
          rate: item.rate || 0,
          currency_id: form.currencyId,
          description: item.remarks || '',
        }] : []

        const accounts = item.accountId ? [{
          account_id: item.accountId,
          currency_id: form.currencyId,
          amount: (item.quantity || 0) * (item.rate || 0),
          description: item.remarks || '',
        }] : []

        return {
          currency_id: form.currencyId,
          cost_center_id: cc.costCenterId,
          materials,
          accounts,
          dimensions: [],
        }
      })
    ).filter((item: any) => item.materials.length > 0 || item.accounts.length > 0)
     
    if (allCostCenterItems.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'At least one item is required.',
        confirmButtonColor: '#2563eb'
      })
      return
    }

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
      
      items: allCostCenterItems,
      
      // Requisition sources
      sources: validSources.map((s) => {
        const sourceType = s.sourceType || (s.payee ? 'VENDOR' : null)
        return {
          source_type: sourceType,
          source_id: sourceType === 'STORE' || sourceType === 'PARTIES' ? s.sourceId : (sourceType === 'CASH' ? s.accountId : null),
          account_id: sourceType === 'CASH' ? s.accountId : null,
          payee: s.payee || null,
          mode_of_payment: s.modeOfPayment,
          currency_id: s.currencyId || form.currencyId,
          exchange_rate: s.exchangeRate,
          description: s.description,
        }
      }),

    }

    if (isEditMode.value) {
      await requisitionService.update(form.id, payload)
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Requisition updated successfully',
        timer: 2000,
        showConfirmButton: false
      })
    } else {
      await requisitionService.create(payload)
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: asDraft ? 'Draft saved successfully' : 'Requisition created successfully',
        timer: 2000,
        showConfirmButton: false
      })
    }

    showForm.value = false
    resetForm()

    if (sidebarMinifiedForCreate.value && !isEditMode.value) {
      appOptionStore.appSidebarMinified = originalSidebarState.value
      sidebarMinifiedForCreate.value = false
    }

    await loadRequisitions()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to save requisition.',
      confirmButtonColor: '#2563eb'
    })
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

// Item add/remove handled via itemKey helpers above.

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
      v-model:form="formModel"
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
      :locations="locations"
      :entities="entities"
      :dimension-types="dimensionTypes"
      :dimension-values="dimensionValues"
      :vat-options="vatOptions"
      :grand-total="grandTotal"
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
      @add-item="addItem"
      @remove-item="removeItem"
    />

    <!-- LIST VIEW -->
    <template v-else>
      <div class="container-fluid">
        <!-- Breadcrumb -->
        <div class="breadcrumb-section mb-3">
          <!-- <span class="breadcrumb-item">SALES</span>
          <span class="breadcrumb-separator">/</span> -->
          <span class="breadcrumb-item active">REQUISITIONS</span>
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
                  :default-page-size=100
                  :disable-pagination="false"
                  :show-date-filters="false"
                  :custom-filters="customFilters"
                  @update:filters="handleFiltersUpdate"
                >
                  <template #status="{ row }">
                    <span :class="statusBadgeClass((row as any).status)">
                      {{ (row as any).statusLabel || (row as any).status }}
                    </span>
                  </template>
                  <template #date="{ row }">
                    {{ formatDisplayDate((row as any).date) }}
                  </template>
                  <template #requiredDate="{ row }">
                    {{ formatDisplayDate((row as any).requiredDate) }}
                  </template>
                  <template #requestedBy="{ row }">
                    {{ (row as any).requestedBy || '--' }}
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
