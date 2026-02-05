<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppOptionStore } from '@/stores/app-option'
import CurrencyInput from '@/components/CurrencyInput.vue'
import { requisitionService } from '@/stores/bushman/requisitionService'
import Swal from 'sweetalert2'

type RequisitionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED'

type FundDirection = 'WITHDRAW' | 'DIRECT_PAYMENT'
type SourceType = 'CASH' | 'STORE' | 'VENDOR' | 'SERVICE_PROVIDER'
type ModeOfPayment = 'CASH' | 'TT' | 'CREDIT'
type TaxMethod = 'EXCLUSIVE' | 'INCLUSIVE' | 'EXEMPT'
type DiscountMethod = 'PERCENT' | 'LS'

type Currency = {
  id: number
  name: string
  symbol: string
}

type Account = {
  id: number
  code: string
  name: string
}

type Branch = {
  id: number
  name: string
}

type Company = {
  id: number
  name?: string
}

type User = {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

type RequisitionType = {
  id: number
  code: string
  type: string
  name: string
  approval_chain_module?: any
}

type Entity = {
  id: number
  full_name: string
  nick_name?: string
  country_id?: number
  nationality_id?: number
  country_name?: string
  nationality_name?: string
}

type RequisitionSource = {
  id: number
  source_type: string
  payee: string
  source_id?: number
  account_id?: number
  account?: Account
  entity?: Entity
  location?: any
  mode_of_payment: ModeOfPayment
  currency_id: number
  currency?: Currency
  exchange_rate: string
  description?: string
}

type Item = {
  id: number
  name: string
  item_code?: string
  scientific_name?: string
  description?: string
}

type UnitOfMeasurement = {
  id: number
  name: string
  code: string
}

type Material = {
  id: number
  item_id: number
  item?: Item
  unit_of_measurement_id: number
  unit_of_measurement?: UnitOfMeasurement
  quantity: string
  rate: string
  currency_id: number
  currency?: Currency
  description?: string
}

type DimensionType = {
  id: number
  code: string
  name: string
  is_mandatory: number
  applies_to: string
  is_active: boolean
}

type DimensionValue = {
  id: number
  dimension_type_id: number
  code: string
  name: string
  parent_dimension_value_id?: number
  is_active: boolean
}

type ItemDimension = {
  id: number
  requisition_item_id: number
  dimension_type_id: number
  dimension_value_id: number
  dimension_type?: DimensionType
  dimension_value?: DimensionValue
  amount?: string
  percentage?: string
}

type ItemAccount = {
  id: number
  requisition_item_id: number
  account_id: number
  account?: Account
  currency_id: number
  currency?: Currency
  amount: string
  description?: string
}

type RequisitionItem = {
  id: number
  currency_id: number
  currency?: Currency
  value_added_tax_id?: number
  discount_amount?: string
  discount_method?: string
  tax_method?: TaxMethod
  remarks?: string
  materials: Material[]
  accounts: ItemAccount[]
  dimensions: ItemDimension[]
}

type ApprovalChainRole = {
  id: number
  name: string
  past: string
}

type ApprovalChainLevel = {
  id: number
  approval_chain_module_id: number
  can_change_source: boolean
  position_id: number
  approval_chain_role_id: number
  level_id: number
  is_active: boolean
  role?: ApprovalChainRole
}

type ApprovalRecord = {
  id: number
  approval_chain_level_id: number
  approval_chain_level?: ApprovalChainLevel
  approved_by: number
  approved_by_user?: User
  handled_by: number
  handled_by_user?: User
  status: 'APPROVED' | 'REJECTED'
  date: string
  remarks: string
}

// Per-item approval state
type ItemApprovalState = {
  selected: boolean
  approved: boolean | null // null = pending, true = approved, false = rejected
  editing: boolean
  remarks: string
  // Editable fields
  discount_method: DiscountMethod | null
  discount_amount: number
  materials: Array<{
    item_id: number
    unit_of_measurement_id: number
    quantity: number
    rate: number
    currency_id: number
    description: string
    _name?: string
    _code?: string
    _unit?: string
    _currencySymbol?: string
  }>
  accounts: Array<{
    account_id: number
    currency_id: number
    amount: number
    description: string
    _name?: string
    _code?: string
    _currencySymbol?: string
  }>
}

type ApprovalChainApiLevel = {
  id: number
  level_id: number
  role?: {
    id: number
    name: string
    past?: string
  }
  position?: {
    role_id?: number
    role_name?: string
    short?: string | null
  }
  can_change_source: boolean
  is_active: boolean
  approvers: Array<{
    id: number
    username?: string
    full_name?: string
    email?: string
  }>
  approval_status?: string
  approval?: {
    remarks?: string
    date?: string
    approved_by_user?: User
  } | null
  approval_history?: any[]
}

type ApprovalChainApiResponse = {
  requisition_id: number
  module?: {
    id: number
    name?: string
    description?: string
  }
  levels: ApprovalChainApiLevel[]
}

type ItemApprovalHistoryChange = {
  field: string
  original: any
  modified: any
  details?: string
}

type ItemApprovalSnapshot = {
  accounts: Array<{
    account_id?: number
    account_name?: string
    amount: number
  }>
  materials: Array<{
    item_id?: number
    item_name?: string
    quantity: number
    rate?: number
    total: number
    unit?: string
  }>
}

type ItemApprovalHistoryApproval = {
  approval_id?: number
  level_id?: number
  level_name?: string
  level_number: number
  status: 'APPROVED' | 'REJECTED' | 'PENDING'
  approved_by?: {
    id?: number
    name?: string
    username?: string
  } | null
  date?: string
  remarks?: string
  item_included: boolean
  item_data?: ItemApprovalSnapshot | null
  has_changes: boolean
  changes: ItemApprovalHistoryChange[]
}

type ItemApprovalHistoryItem = {
  item_id: number
  original_data?: any
  approval_history: ItemApprovalHistoryApproval[]
}

type ItemApprovalHistoryResponse = {
  summary: {
    requisition_id: number
    requisition_status: string
    total_items: number
    total_approval_levels: number
    approval_chain_levels: Array<{
      level_id: number
      role_name: string
    }>
  }
  items_history: ItemApprovalHistoryItem[]
}

type Requisition = {
  id: number
  company_id: number
  company?: Company
  branch_id: number
  branch?: Branch
  user_id: number
  user?: User
  requested_by?: number
  requested_by_user?: User
  handler?: number
  handler_user?: User
  requisition_type_id: number
  requisition_type?: RequisitionType
  form_behavior_json?: any
  fund_direction: FundDirection
  required_date: string
  date: string
  status: RequisitionStatus
  status_label?: string
  next_approver_position?: string
  is_closed: boolean
  is_printed: boolean
  remarks?: string
  created_at: string
  updated_at: string
  code?: string
  sources: RequisitionSource[]
  items: RequisitionItem[]
  approvals: ApprovalRecord[]
  payee?: string
  dimensions_grouped?: any[]
  original_items?: RequisitionItem[]
}

const props = defineProps<{ id: number }>()
const router = useRouter()
const authStore = useAuthStore()
const appOptionStore = useAppOptionStore()

const loading = ref(false)
const loadingAction = ref(false)
const requisition = ref<Requisition | null>(null)
const activeTab = ref<'response' | 'approval' | 'history'>('response')
const originalSidebarState = ref(false)
const actionRemarks = ref('')
const approvalChain = ref<ApprovalChainApiResponse | null>(null)
const itemApprovalHistory = ref<ItemApprovalHistoryResponse | null>(null)
const itemApprovalHistoryLoading = ref(false)
const itemApprovalHistoryError = ref('')

// Per-item approval tracking
const itemApprovalStates = ref<Map<number, ItemApprovalState>>(new Map())
const selectAllItems = ref(false)
const approvalMode = ref<'all' | 'selected'>('all')
const showApprovalPanel = ref(false)

// Initialize approval states for all items
const initializeItemApprovalStates = () => {
  if (!requisition.value) return

  const newStates = new Map<number, ItemApprovalState>()
  const history = itemApprovalHistory.value
  // Use nextApprovalLevel if available, otherwise default to 1.
  // Note: nextApprovalLevel logic relies on current approvals.
  // If user is L2, nextApprovalLevel should be 2.
  const currentLevel = nextApprovalLevel.value || 1

  for (const item of requisition.value.items) {
    let sourceData: any = null

    // Check if we should use previous level data
    if (history && currentLevel > 1) {
      const itemHistory = history.items_history.find(h => h.item_id === item.id)
      if (itemHistory) {
        const prevLevelNum = currentLevel - 1
        const prevApproval = itemHistory.approval_history.find(a => a.level_number === prevLevelNum)
        // STRICT RULE: Use previous data ONLY if approved and included
        if (prevApproval && prevApproval.status === 'APPROVED' && prevApproval.item_included && prevApproval.item_data) {
          sourceData = prevApproval.item_data
        }
      }
    }

    // Default to original item if no history source or L1
    const usingHistory = !!sourceData
    if (!sourceData) {
      sourceData = item
    }

    newStates.set(item.id, {
      selected: false, // Default unselected
      approved: null,
      editing: false,
      remarks: '',
      discount_method: (sourceData.discount_method as DiscountMethod) || null,
      discount_amount: Number(sourceData.discount_amount || 0),

      materials: (sourceData.materials || []).map((m: any, idx: number) => {
        // If coming from history, structure might be flat or nested
        // History example: { item_id, item_name, unit_of_measurement_id, quantity, rate, ... }
        // Original example: { item_id, item: { name, code... }, ... }

        // Try to find matching original material to fill gaps if needed (e.g. codes)
        // But rely on sourceData (history values) for critical numbers

        let name = m.item_name || m.item?.name || m.description || ''
        let code = m.item_code || m.item?.item_code || m.item?.scientific_name || ''
        let unit = m.unit_name || m.unit_of_measurement?.code || m.unit_of_measurement?.name || ''
        let symbol = m.currency_symbol || m.currency?.symbol || item.currency?.symbol || ''

        // Fallback: if name is missing but we have item_id, try to find it in original item.materials?
        // Only if structure matches or we scan all original items. But let's assume history provides enough or original provided enough.
        // If sourceData == item (original), m.item.name works.
        // If sourceData == item_data (history), m.item_name works.

        if (!name && !usingHistory && item.materials[idx]) {
          name = item.materials[idx].item?.name || ''
          code = item.materials[idx].item?.item_code || ''
        }

        return {
          item_id: m.item_id || m.id, // Handle potential ID structure diffs
          unit_of_measurement_id: m.unit_of_measurement_id,
          quantity: Number(m.quantity || 0),
          rate: Number(m.rate || 0),
          currency_id: m.currency_id,
          description: m.description || '',
          _name: name,
          _code: code,
          _unit: unit,
          _currencySymbol: symbol
        }
      }),

      accounts: (sourceData.accounts || []).map((a: any, idx: number) => {
        // History: { account_id, account_name, account_code, amount, ... }
        // Original: { account_id, account: { name, code }, amount ... }

        let name = a.account_name || a.account?.name || ''
        let code = a.account_code || a.account?.code || ''
        let symbol = a.currency_symbol || a.currency?.symbol || item.currency?.symbol || ''

        return {
          account_id: a.account_id,
          currency_id: a.currency_id,
          amount: Number(a.amount || 0),
          description: a.description || '',
          _name: name,
          _code: code,
          _currencySymbol: symbol
        }
      })
    })
  }

  itemApprovalStates.value = newStates
}

// Watch for select all changes
watch(selectAllItems, (newValue) => {
  if (!requisition.value) return
  for (const item of requisition.value.items) {
    // Only select items that are ready for approval
    if (!isItemReadyForApproval(item.id)) continue

    const state = itemApprovalStates.value.get(item.id)
    if (state) {
      state.selected = newValue
    }
  }
})

// Get selected items count
const selectedItemsCount = computed(() => {
  let count = 0
  itemApprovalStates.value.forEach((state, itemId) => {
    // Only count items that are ready for approval
    if (state.selected && isItemReadyForApproval(itemId)) count++
  })
  return count
})

const getItemState = (itemId: number) => itemApprovalStates.value.get(itemId)

// Get total selected amount
const selectedItemsTotal = computed(() => {
  if (!requisition.value) return 0
  let total = 0
  for (const item of requisition.value.items) {
    // Only include items that are ready for approval
    if (!isItemReadyForApproval(item.id)) continue

    const state = getItemState(item.id)
    if (!state?.selected) continue
    const lines = buildItemLines(item, state)
    total += lines.reduce((sum, line) => sum + line.amount, 0)
  }
  return total
})

// Toggle item selection
const toggleItemSelection = (itemId: number) => {
  const state = itemApprovalStates.value.get(itemId)
  if (state) {
    state.selected = !state.selected
  }
}

// Toggle item editing
const toggleItemEditing = (itemId: number) => {
  const state = itemApprovalStates.value.get(itemId)
  if (state) {
    state.editing = !state.editing
  }
}

// Save item changes
const saveItemChanges = (itemId: number) => {
  const state = itemApprovalStates.value.get(itemId)
  if (state) {
    state.editing = false
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Changes Saved',
      text: 'Item changes will be applied when you approve.',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    })
  }
}

// Check if any items have been modified
const hasModifications = (itemId: number) => {
  const state = itemApprovalStates.value.get(itemId)
  const item = requisition.value?.items.find(i => i.id === itemId)
  if (!state || !item) return false

  const stateRemarks = (state.remarks || '').trim()
  const itemRemarks = (item.remarks || '').trim()
  if (stateRemarks !== itemRemarks) return true

  // Check if discount changed
  if (state.discount_amount !== Number(item.discount_amount || 0)) return true
  if (state.discount_method !== item.discount_method) return true

  // Check materials
  for (let i = 0; i < state.materials.length; i++) {
    const orig = item.materials[i]
    const mod = state.materials[i]
    if (!orig) continue
    if (mod.quantity !== Number(orig.quantity || 0)) return true
    if (mod.rate !== Number(orig.rate || 0)) return true
  }

  // Check accounts
  for (let i = 0; i < state.accounts.length; i++) {
    const orig = item.accounts[i]
    const mod = state.accounts[i]
    if (!orig) continue
    if (mod.amount !== Number(orig.amount || 0)) return true
  }

  return false
}

const getOriginalItem = (itemId: number) => {
  return requisition.value?.original_items?.find((item) => item.id === itemId) || null
}

const linesSignature = (lines: any[]) => {
  return lines
    .map((line) => [
      line.type,
      line.name,
      line.unit,
      Number(line.quantity || 0),
      Number(line.rate || 0),
      Number(line.amount || 0)
    ].join('|'))
    .join('::')
}

const hasOriginalDiff = (itemId: number) => {
  const original = getOriginalItem(itemId)
  const current = requisition.value?.items.find((item) => item.id === itemId)
  if (!original || !current) return false
  return linesSignature(buildItemLines(original)) !== linesSignature(buildItemLines(current))
}

const getOriginalLines = (itemId: number) => {
  const original = getOriginalItem(itemId)
  return original ? buildItemLines(original) : []
}

//use permissions
// const permissions = computed(() => authStore.permissions);
// const canSubmitRequisition = computed(() => permissions.value.includes('CAN_SUBMIT_REQUISITION'));

const userLabel = (value: any): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return ''

  const firstName = value.first_name || ''
  const lastName = value.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return (
    fullName ||
    value.email ||
    value.username ||
    value.name ||
    value.full_name ||
    value.display_name ||
    ''
  )
}

const nextApprovalLevel = computed(() => {
  if (!requisition.value) return null
  const approvedCount = requisition.value.approvals.filter((a) => a.status === 'APPROVED').length
  const nextLevel = approvedCount + 1
  const maxLevel = Math.max(
    ...requisition.value.approvals.map(a => a.approval_chain_level?.level_id || 1),
    3
  )
  return nextLevel <= maxLevel ? nextLevel : null
})

const canEditDuringApproval = computed(() => {
  if (!requisition.value) return false
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return false
  const nextLevel = nextApprovalLevel.value
  if (!nextLevel) return false
  const nextApproval = requisition.value.approvals.find(
    (a) => a.approval_chain_level?.level_id === nextLevel
  )
  return !!nextApproval?.approval_chain_level?.can_change_source
})

const canEditRequisition = computed(() => {
  if (!requisition.value) return false
  return requisition.value.status === 'DRAFT' || canEditDuringApproval.value
})

const isCurrentUserNextApprover = computed(() => {
  if (!requisition.value) return false
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return false
  const nextLevel = nextApprovalLevel.value
  if (!nextLevel) return false
  const currentUserId = authStore.user?.id
  if (!currentUserId) return false
  const levelEntry = approvalChain.value?.levels?.find((level) => level.level_id === nextLevel)
  if (!levelEntry) return false
  return (levelEntry.approvers || []).some((approver) => approver.id === currentUserId)
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
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}


const formatMoney = (value: number, currencySymbol?: string) => {
  const symbol = currencySymbol ? String(currencySymbol).trim() : ''
  return symbol ? `${symbol}${formatAmount(value)}` : formatAmount(value)
}

const formatDisplayDate = (value: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const day = date.getDate()
  const getOrdinal = (n: number) => {
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 13) return 'th'
    switch (n % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  const monthName = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date)
  const year = date.getFullYear()
  return `${monthName} ${day}${getOrdinal(day)} ${year}`
}

const formatApprovalDate = (value: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }).format(date)
}

const sourceEntityLabel = (source: any) => {
  if (!source) return '--'
  return source.payee || source.entity?.full_name || source.entity?.name || '--'
}

const sourceNameLabel = (source: any) => {
  if (!source) return '--'
  if (source.source_type === 'CASH') {
    return source.account?.name || source.account?.code || 'Cash'
  }
  if (source.source_type === 'STORE') {
    return source.store?.name || source.store?.code || 'Store'
  }
  if (source.source_type === 'PARTIES' || source.source_type === 'VENDOR' || source.source_type === 'SERVICE_PROVIDER') {
    return source.entity?.full_name || source.entity?.name || source.payee || '--'
  }
  return source.account?.name || source.account?.code || source.payee || '--'
}

const getCurrencyName = () => {
  if (!requisition.value) return 'Currency'
  const source = requisition.value.sources?.[0]
  if (source?.currency?.name) return source.currency.name
  const item = requisition.value.items?.[0]
  if (item?.currency?.name) return item.currency.name
  return 'Currency'
}

const getCurrencySymbol = () => {
  if (!requisition.value) return ''
  const source = requisition.value.sources?.[0]
  if (source?.currency?.symbol) return source.currency.symbol
  const item = requisition.value.items?.[0]
  if (item?.currency?.symbol) return item.currency.symbol
  return ''
}

const getTaxMethodLabel = () => {
  if (!requisition.value) return 'Tax Exclusive'
  const item = requisition.value.items?.[0]
  if (item?.tax_method === 'EXCLUSIVE') return 'Exclusive'
  if (item?.tax_method === 'INCLUSIVE') return 'Inclusive'
  if (item?.tax_method === 'EXEMPT') return 'Exempt'
  return 'Exclusive'
}

const totalAmount = computed(() => {
  if (!requisition.value) return 0
  let total = 0
  for (const item of requisition.value.items) {
    const state = getItemState(item.id)
    const lines = buildItemLines(item, state)
    total += lines.reduce((sum, line) => sum + line.amount, 0)
  }
  return total
})

const dimensionGroups = computed(() => {
  const groups = requisition.value?.dimensions_grouped
  return Array.isArray(groups) ? groups : []
})

const buildItemLines = (item: RequisitionItem, state?: ItemApprovalState) => {
  const lines: Array<{
    type: 'Item' | 'Account'
    name: string
    code?: string
    unit?: string
    quantity?: number
    rate?: number
    amount: number
    currencySymbol?: string
  }> = []

  // Prioritize STATE data which reflects current approval view (original or modified from history)
  if (state) {
    for (const material of state.materials) {
      lines.push({
        type: 'Item',
        name: material._name || material.description || '--', // Use captured name or fallback
        code: material._code || '',
        unit: material._unit || '--',
        quantity: material.quantity,
        rate: material.rate,
        amount: material.quantity * material.rate,
        currencySymbol: material._currencySymbol || item.currency?.symbol || ''
      })
    }
    for (const account of state.accounts) {
      lines.push({
        type: 'Account',
        name: account._name || '--',
        code: account._code,
        unit: '1',
        quantity: 1,
        rate: account.amount,
        amount: account.amount,
        currencySymbol: account._currencySymbol || item.currency?.symbol || ''
      })
    }
    return lines // Return early if state used
  }

  // Fallback to Item Original Data if no state found
  for (let index = 0; index < (item.materials || []).length; index++) {
    const material = item.materials[index]
    lines.push({
      type: 'Item',
      name: material.item?.name || material.description || '--',
      code: material.item?.item_code || material.item?.scientific_name || '',
      unit: material.unit_of_measurement?.code || material.unit_of_measurement?.name || '--',
      quantity: Number(material.quantity || 0),
      rate: Number(material.rate || 0),
      amount: Number(material.quantity || 0) * Number(material.rate || 0),
      currencySymbol: material.currency?.symbol || item.currency?.symbol || '',
    })
  }

  for (let index = 0; index < (item.accounts || []).length; index++) {
    const account = item.accounts[index]
    lines.push({
      type: 'Account',
      name: account.account?.name || '--',
      code: account.account?.code,
      unit: '1',
      quantity: 1,
      rate: Number(account.amount || 0),
      amount: Number(account.amount || 0),
      currencySymbol: account.currency?.symbol || item.currency?.symbol || '',
    })
  }

  return lines
}

const getItemDisplayLabel = (itemId: number) => {
  const item = requisition.value?.items.find(i => i.id === itemId)
  if (!item) return `Item #${itemId}`
  const lines = buildItemLines(item)
  if (!lines.length) return `Item #${itemId}`
  const first = lines[0]
  return `${first.type}: ${first.name}`
}

// Expanded cost centers tracking
const expandedCostCenters = ref<Record<string, boolean>>({})

const toggleCostCenter = (key: string) => {
  expandedCostCenters.value[key] = !expandedCostCenters.value[key]
}

const isCostCenterExpanded = (key: string) => {
  // Default to expanded
  return expandedCostCenters.value[key] !== false
}

// Group items by cost center (dimension values)
type CostCenterGroup = {
  key: string
  dimensionTypeId?: number
  dimensionTypeName: string
  dimensionTypeCode?: string
  dimensionValueId?: number
  dimensionValueName: string
  dimensionValueCode?: string
  items: Array<{
    item: RequisitionItem
    itemIndex: number
    lines: ReturnType<typeof buildItemLines>
    dimensionAmount?: number
    dimensionPercentage?: number
  }>
  subtotal: number
  currencySymbol: string
}

const itemsByCostCenter = computed((): CostCenterGroup[] => {
  if (!requisition.value) return []

  const groups: Map<string, CostCenterGroup> = new Map()
  const unassignedKey = 'UNASSIGNED'

  for (let itemIndex = 0; itemIndex < requisition.value.items.length; itemIndex++) {
    const item = requisition.value.items[itemIndex]

    const lines = buildItemLines(item, getItemState(item.id))
    const itemTotal = lines.reduce((sum, line) => sum + line.amount, 0)
    const currencySymbol = item.currency?.symbol || lines[0]?.currencySymbol || ''

    // Check if item has dimensions (cost centers)
    if (item.dimensions && item.dimensions.length > 0) {
      for (const dim of item.dimensions) {
        const dimTypeId = dim.dimension_type_id
        const dimValueId = dim.dimension_value_id
        const key = `${dimTypeId}-${dimValueId}`

        const dimTypeName = dim.dimension_type?.name || 'Cost Center'
        const dimTypeCode = dim.dimension_type?.code || ''
        const dimValueName = dim.dimension_value?.name || `ID: ${dimValueId}`
        const dimValueCode = dim.dimension_value?.code || ''

        // Calculate allocated amount for this dimension
        let allocatedAmount = itemTotal
        if (dim.percentage) {
          allocatedAmount = itemTotal * (Number(dim.percentage) / 100)
        } else if (dim.amount) {
          allocatedAmount = Number(dim.amount)
        }

        if (!groups.has(key)) {
          groups.set(key, {
            key,
            dimensionTypeId: dimTypeId,
            dimensionTypeName: dimTypeName,
            dimensionTypeCode: dimTypeCode,
            dimensionValueId: dimValueId,
            dimensionValueName: dimValueName,
            dimensionValueCode: dimValueCode,
            items: [],
            subtotal: 0,
            currencySymbol,
          })
        }

        const group = groups.get(key)!
        group.items.push({
          item,
          itemIndex,
          lines,
          dimensionAmount: dim.amount ? Number(dim.amount) : undefined,
          dimensionPercentage: dim.percentage ? Number(dim.percentage) : undefined,
        })
        group.subtotal += allocatedAmount
      }
    } else {
      // No dimension assigned - add to unassigned group
      if (!groups.has(unassignedKey)) {
        groups.set(unassignedKey, {
          key: unassignedKey,
          dimensionTypeName: 'General',
          dimensionValueName: 'Unassigned',
          items: [],
          subtotal: 0,
          currencySymbol,
        })
      }

      const group = groups.get(unassignedKey)!
      group.items.push({
        item,
        itemIndex,
        lines,
      })
      group.subtotal += itemTotal
    }
  }

  // Sort: assigned first, then unassigned
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    if (a.key === unassignedKey) return 1
    if (b.key === unassignedKey) return -1
    return (a.dimensionTypeName + a.dimensionValueName).localeCompare(
      b.dimensionTypeName + b.dimensionValueName
    )
  })

  return sortedGroups
})

const hasCostCenters = computed(() => {
  return itemsByCostCenter.value.some(g => g.key !== 'UNASSIGNED')
})

const approvalSteps = computed(() => {
  if (!requisition.value) return []

  if (approvalChain.value?.levels?.length) {
    const sorted = [...approvalChain.value.levels].sort((a, b) => a.level_id - b.level_id)
    const total = sorted.length
    return sorted.map((level, index) => {
      let status = (level.approval_status || 'PENDING').toUpperCase()
      if (
        status === 'PENDING' &&
        level.level_id === nextApprovalLevel.value &&
        ['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value?.status || '')
      ) {
        status = 'CURRENT'
      }

      const approverNames = (level.approvers || [])
        .map((a) => a.full_name || a.username || a.email || '')
        .filter(Boolean)

      return {
        stepNumber: index + 1,
        totalSteps: total,
        roleName: level.role?.name || `Level ${level.level_id}`,
        status,
        date: level.approval?.date || '',
        approverName: approverNames.join(', '),
        remarks: level.approval?.remarks || '',
        id: level.id
      }
    })
  }

  // Try to get defined levels from the type definition
  // We assume requisition.requisition_type.approval_chain_module.approval_chain_levels exists and is sorted by level_id
  const definedLevels = requisition.value.requisition_type?.approval_chain_module?.approval_chain_levels || []

  // If we have defined levels, map them to steps
  if (Array.isArray(definedLevels) && definedLevels.length > 0) {
    const sortedLevels = [...definedLevels].sort((a: any, b: any) => a.level_id - b.level_id)

    return sortedLevels.map((level: any, index) => {
      // Find matching approval record
      const approval = requisition.value?.approvals.find(a =>
        (a.approval_chain_level_id === level.id) ||
        (a.approval_chain_level?.level_id === level.level_id)
      )

      let status = 'PENDING'
      let date = ''
      let approverName = ''
      let remarks = ''

      if (approval) {
        status = approval.status // APPROVED, REJECTED
        date = approval.date
        approverName = userLabel(approval.approved_by_user) || String(approval.approved_by)
        remarks = approval.remarks
      } else {
        if (level.level_id === nextApprovalLevel.value && ['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value?.status || '')) {
          status = 'CURRENT'
        }
      }

      return {
        stepNumber: index + 1,
        totalSteps: sortedLevels.length,
        roleName: level.role?.name || `Level ${level.level_id}`,
        status,
        date,
        approverName,
        remarks,
        id: level.id
      }
    })
  }

  // Fallback if no definitions: just show existing approvals
  return requisition.value.approvals.map((approval, index) => ({
    stepNumber: index + 1,
    totalSteps: requisition.value?.approvals.length || 0,
    roleName: approval.approval_chain_level?.role?.name || `Level ${approval.approval_chain_level?.level_id || index + 1}`,
    status: approval.status,
    date: approval.date,
    approverName: userLabel(approval.approved_by_user),
    remarks: approval.remarks,
    id: approval.id
  }))
})

const modifiedItemsCount = computed(() => {
  const items = itemApprovalHistory.value?.items_history || []
  let count = 0
  for (const item of items) {
    if (item.approval_history.some((approval) => approval.has_changes)) {
      count += 1
    }
  }
  return count
})

// Categorize items by approval status for display
const categorizedItems = computed(() => {
  if (!requisition.value) return { ready: [], skipped: [], rejected: [], notReviewed: [] }

  const ready: Array<{ item: RequisitionItem; index: number; status: ItemApprovalStatus }> = []
  const skipped: Array<{ item: RequisitionItem; index: number; status: ItemApprovalStatus }> = []
  const rejected: Array<{ item: RequisitionItem; index: number; status: ItemApprovalStatus }> = []
  const notReviewed: Array<{ item: RequisitionItem; index: number; status: ItemApprovalStatus }> = []

  requisition.value.items.forEach((item, index) => {
    const status = getItemApprovalStatus(item.id)
    const entry = { item, index, status }

    if (status.ready) {
      ready.push(entry)
    } else if (status.status === 'rejected') {
      rejected.push(entry)
    } else if (status.status === 'skipped') {
      skipped.push(entry)
    } else {
      notReviewed.push(entry)
    }
  })

  return { ready, skipped, rejected, notReviewed }
})

const readyItemsCount = computed(() => categorizedItems.value.ready.length)
const skippedItemsCount = computed(() => categorizedItems.value.skipped.length)
const rejectedItemsCount = computed(() => categorizedItems.value.rejected.length)
const notReviewedItemsCount = computed(() => categorizedItems.value.notReviewed.length)

// Get detailed item approval status for UI feedback
type ItemApprovalStatus = {
  ready: boolean           // Can be approved at current level
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'not_reviewed'
  previousLevel?: number
  previousApprover?: string
  previousRemarks?: string
  wasModified?: boolean
}

const getItemApprovalStatus = (itemId: number): ItemApprovalStatus => {
  const currentLevel = nextApprovalLevel.value || 1

  // Level 1 always allows all items
  if (currentLevel <= 1) {
    return { ready: true, status: 'pending' }
  }

  // If history isn't loaded yet
  if (!itemApprovalHistory.value) {
    return { ready: false, status: 'pending' }
  }

  const itemHistory = itemApprovalHistory.value.items_history.find(i => i.item_id === itemId)
  if (!itemHistory) {
    return { ready: false, status: 'not_reviewed' }
  }

  // Check previous level status
  const prevLevel = currentLevel - 1
  const prevApproval = itemHistory.approval_history.find(a => a.level_number === prevLevel)

  if (!prevApproval) {
    return { ready: false, status: 'not_reviewed', previousLevel: prevLevel }
  }

  const approverName = prevApproval.approved_by?.name || prevApproval.approved_by?.username || 'Unknown'

  if (prevApproval.status === 'REJECTED') {
    return {
      ready: false,
      status: 'rejected',
      previousLevel: prevLevel,
      previousApprover: approverName,
      previousRemarks: prevApproval.remarks
    }
  }

  if (!prevApproval.item_included) {
    return {
      ready: false,
      status: 'skipped',
      previousLevel: prevLevel,
      previousApprover: approverName,
      previousRemarks: prevApproval.remarks
    }
  }

  if (prevApproval.status === 'APPROVED' && prevApproval.item_included) {
    return {
      ready: true,
      status: 'approved',
      previousLevel: prevLevel,
      previousApprover: approverName,
      previousRemarks: prevApproval.remarks,
      wasModified: prevApproval.has_changes
    }
  }

  return { ready: false, status: 'pending' }
}

// Strict Approval Verification (simplified wrapper)
const isItemReadyForApproval = (itemId: number) => {
  return getItemApprovalStatus(itemId).ready
}

const mapRequisition = (req: any): Requisition => {
  return {
    id: req.id,
    company_id: req.company_id,
    company: req.company,
    branch_id: req.branch_id,
    branch: req.branch,
    user_id: req.user_id,
    user: req.user,
    requested_by: req.requested_by,
    requested_by_user: req.requested_by_user,
    handler: req.handler,
    handler_user: req.handler_user,
    requisition_type_id: req.requisition_type_id,
    requisition_type: req.requisition_type,
    form_behavior_json: req.form_behavior_json,
    fund_direction: req.fund_direction || 'DIRECT_PAYMENT',
    required_date: req.required_date || '',
    date: req.date || req.created_at?.slice(0, 10) || '',
    status: req.status || 'DRAFT',
    status_label: req.status_label || '',
    next_approver_position: req.next_approver_position || '',
    is_closed: req.is_closed || false,
    is_printed: req.is_printed || false,
    remarks: req.remarks,
    created_at: req.created_at || '',
    updated_at: req.updated_at || '',
    code: req.code || req.reference || `REQ-${String(req.id).padStart(4, '0')}`,
    sources: req.sources || [],
    items: req.items || [],
    approvals: req.approvals || [],
    payee: req.sources?.[0]?.payee || req.payee || '',
    dimensions_grouped: req.dimensions_grouped || [],
  }
}

const formatChangeValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

const buildApprovalItemSnapshots = (approval: any): Map<number, ItemApprovalSnapshot> => {
  const itemMap = new Map<number, ItemApprovalSnapshot>()
  const dimensions = approval?.dimensions || []

  dimensions.forEach((dim: any) => {
    const accountItems = dim.account_items || []
    accountItems.forEach((accItem: any) => {
      const itemId = accItem.requisition_item_id
      if (!itemId) return

      const entry = itemMap.get(itemId) || { accounts: [], materials: [] }
      entry.accounts.push({
        account_id: accItem.account_id,
        account_name: accItem.account_name || accItem.account?.name || '',
        amount: Number(accItem.total_amount ?? accItem.amount ?? 0)
      })
      itemMap.set(itemId, entry)
    })

    const materialItems = dim.material_items || []
    materialItems.forEach((matItem: any) => {
      const itemId = matItem.requisition_item_id
      if (!itemId) return

      const quantity = Number(matItem.total_quantity ?? matItem.quantity ?? 0)
      const total = Number(matItem.total_line_total ?? matItem.total ?? 0)
      const rawRate = Number(matItem.rate)
      const rate = Number.isFinite(rawRate) ? rawRate : quantity ? total / quantity : 0
      const entry = itemMap.get(itemId) || { accounts: [], materials: [] }
      entry.materials.push({
        item_id: matItem.item_id,
        item_name: matItem.item_name || matItem.item?.name || '',
        quantity,
        rate,
        total,
        unit: matItem.unit_of_measurement?.code || matItem.unit_of_measurement?.name || ''
      })
      itemMap.set(itemId, entry)
    })
  })

  return itemMap
}

const buildSnapshotChanges = (prev?: ItemApprovalSnapshot | null, curr?: ItemApprovalSnapshot | null) => {
  const changes: ItemApprovalHistoryChange[] = []
  const prevAccounts = new Map<string, ItemApprovalSnapshot['accounts'][number]>()
  const currAccounts = new Map<string, ItemApprovalSnapshot['accounts'][number]>()
  const prevMaterials = new Map<string, ItemApprovalSnapshot['materials'][number]>()
  const currMaterials = new Map<string, ItemApprovalSnapshot['materials'][number]>()

  ;(prev?.accounts || []).forEach((acc) => {
    const key = acc.account_id ? `account:${acc.account_id}` : `account:${acc.account_name || ''}`
    prevAccounts.set(key, acc)
  })
  ;(curr?.accounts || []).forEach((acc) => {
    const key = acc.account_id ? `account:${acc.account_id}` : `account:${acc.account_name || ''}`
    currAccounts.set(key, acc)
  })

  ;(prev?.materials || []).forEach((mat) => {
    const key = mat.item_id ? `material:${mat.item_id}` : `material:${mat.item_name || ''}`
    prevMaterials.set(key, mat)
  })
  ;(curr?.materials || []).forEach((mat) => {
    const key = mat.item_id ? `material:${mat.item_id}` : `material:${mat.item_name || ''}`
    currMaterials.set(key, mat)
  })

  const accountKeys = new Set([...prevAccounts.keys(), ...currAccounts.keys()])
  accountKeys.forEach((key) => {
    const prevAcc = prevAccounts.get(key)
    const currAcc = currAccounts.get(key)
    const label = prevAcc?.account_name || currAcc?.account_name || 'Account'
    const prevAmount = prevAcc ? Number(prevAcc.amount || 0) : null
    const currAmount = currAcc ? Number(currAcc.amount || 0) : null
    if (prevAcc && currAcc && prevAmount === currAmount) return

    changes.push({
      field: `Account: ${label} (amount)`,
      original: formatChangeValue(prevAmount),
      modified: formatChangeValue(currAmount)
    })
  })

  const materialKeys = new Set([...prevMaterials.keys(), ...currMaterials.keys()])
  materialKeys.forEach((key) => {
    const prevMat = prevMaterials.get(key)
    const currMat = currMaterials.get(key)
    const label = prevMat?.item_name || currMat?.item_name || 'Item'
    const prevQty = prevMat ? Number(prevMat.quantity || 0) : null
    const currQty = currMat ? Number(currMat.quantity || 0) : null
    const prevTotal = prevMat ? Number(prevMat.total || 0) : null
    const currTotal = currMat ? Number(currMat.total || 0) : null

    if (!(prevMat && currMat && prevQty === currQty)) {
      const unitLabel = currMat?.unit || prevMat?.unit || ''
      const qtyField = unitLabel ? `qty (${unitLabel})` : 'qty'
      changes.push({
        field: `Item: ${label} (${qtyField})`,
        original: formatChangeValue(prevQty),
        modified: formatChangeValue(currQty)
      })
    }

    if (!(prevMat && currMat && prevTotal === currTotal)) {
      changes.push({
        field: `Item: ${label} (total)`,
        original: formatChangeValue(prevTotal),
        modified: formatChangeValue(currTotal)
      })
    }
  })

  return changes
}

const buildItemApprovalHistoryFromStages = (approvalStages: any[]): ItemApprovalHistoryResponse => {
  const itemsMap = new Map<number, ItemApprovalHistoryItem>()
  const sortedStages = [...approvalStages].sort((a, b) => (a.level_id || 0) - (b.level_id || 0))

  sortedStages.forEach((stage: any) => {
    const levelId = stage.level_id || 0
    const levelName = stage.role?.name || stage.position?.role_name || `Level ${levelId}`
    const approvals = stage.approvals || []

    approvals.forEach((approval: any) => {
      const approvalStatus = approval.status || 'PENDING'
      const approvedBy = approval.approved_by || approval.handled_by
      const approvalId = approval.id || 0
      const approvalDate = approval.date || ''
      const approvalRemarks = approval.remarks || ''
      const snapshotMap = buildApprovalItemSnapshots(approval)

      snapshotMap.forEach((snapshot, itemId) => {
        if (!itemsMap.has(itemId)) {
          itemsMap.set(itemId, {
            item_id: itemId,
            approval_history: []
          })
        }

        const itemHistory = itemsMap.get(itemId)!
        const existingApproval = itemHistory.approval_history.find(a => a.level_number === levelId)

        if (!existingApproval) {
          itemHistory.approval_history.push({
            approval_id: approvalId,
            level_id: stage.id || levelId,
            level_name: levelName,
            level_number: levelId,
            status: approvalStatus,
            item_included: true,
            approved_by: approvedBy
              ? {
                  id: approvedBy.id,
                  name: approvedBy.full_name || approvedBy.username || '',
                  username: approvedBy.username || ''
                }
              : null,
            date: approvalDate,
            remarks: approvalRemarks,
            item_data: snapshot,
            has_changes: false,
            changes: []
          })
        }
      })
    })
  })

  itemsMap.forEach((itemHistory) => {
    itemHistory.approval_history.sort((a, b) => a.level_number - b.level_number)
    for (let i = 0; i < itemHistory.approval_history.length; i++) {
      const current = itemHistory.approval_history[i]
      const prev = i > 0 ? itemHistory.approval_history[i - 1] : null
      if (!prev) {
        current.changes = []
        current.has_changes = false
        continue
      }
      const changes = buildSnapshotChanges(prev.item_data, current.item_data)
      current.changes = changes
      current.has_changes = changes.length > 0
    }
  })

  return {
    items_history: Array.from(itemsMap.values())
  }
}

const normalizeMasterPayload = (payload: any) => {
  if (!payload?.requisition) return payload

  const requisition = payload.requisition || {}
  const sources = payload.sources || []
  const dimensions = payload.dimensions || []
  const approvalStages = payload.approval_stages || []
  const defaultCurrency = sources?.[0]?.currency || null

  const normalizeDimensionMeta = (dim: any) => {
    const typeValue = dim?.dimension_type
    const valueValue = dim?.dimension_value
    return {
      dimension_type_id: dim?.dimension_type_id,
      dimension_value_id: dim?.dimension_value_id,
      dimension_type: typeof typeValue === 'string' ? { name: typeValue, code: typeValue } : typeValue,
      dimension_value: typeof valueValue === 'string' ? { name: valueValue, code: valueValue } : valueValue
    }
  }

  const getLatestApprovedDimensions = (stages: any[]) => {
    const approvedStages = stages.filter((stage) =>
      (stage?.approvals || []).some((approval: any) => approval?.status === 'APPROVED')
    )
    if (!approvedStages.length) return null
    const latestStage = approvedStages.reduce((max, stage) =>
      (stage.level_id || 0) > (max.level_id || 0) ? stage : max
    )
    const approvals = (latestStage?.approvals || []).filter((approval: any) => approval?.status === 'APPROVED')
    if (!approvals.length) return null
    const latestApproval = approvals.reduce((latest: any, approval: any) => {
      const latestTime = new Date(latest?.date || 0).getTime()
      const approvalTime = new Date(approval?.date || 0).getTime()
      return approvalTime >= latestTime ? approval : latest
    })
    return latestApproval?.dimensions || null
  }

  const buildItemsFromDimensions = (sourceDimensions: any[]) => {
    let tempId = -1
    const builtItems: any[] = []

    sourceDimensions.forEach((dim: any) => {
      const accounts = dim?.accounts || []
      const accountLookup = new Map(accounts.map((acc: any) => [acc.account_id, acc]))
      const dimensionMeta = normalizeDimensionMeta(dim)

      ;(dim?.account_items || []).forEach((accItem: any) => {
        const accountDetail = accountLookup.get(accItem.account_id)
        const reqItemId = accItem.requisition_item_id || accountDetail?.requisition_item_id || null
        const currency = accountDetail?.currency || defaultCurrency || null
        const currencyId = accItem.currency_id || accountDetail?.currency_id || currency?.id || null

        builtItems.push({
          id: reqItemId || tempId--,
          currency_id: currencyId,
          currency,
          value_added_tax_id: null,
          discount_amount: null,
          discount_method: null,
          tax_method: null,
          remarks: null,
          materials: [],
          accounts: [
            {
              id: accountDetail?.id,
              requisition_item_id: reqItemId || undefined,
              account_id: accItem.account_id,
              currency_id: currencyId,
              amount: String(accItem.total_amount ?? accItem.amount ?? 0),
              description: null,
              account: accountDetail?.account || accountDetail?.account_id ? accountDetail?.account : accountDetail?.account,
              currency
            }
          ],
          dimensions: [dimensionMeta]
        })
      })

      ;(dim?.material_items || []).forEach((matItem: any) => {
        const reqItemId = matItem.requisition_item_id || null
        const quantity = Number(matItem.total_quantity ?? matItem.quantity ?? 0)
        const totalLine = Number(matItem.total_line_total ?? 0)
        const rawRate = Number(matItem.rate)
        const rate = Number.isFinite(rawRate) ? rawRate : quantity ? totalLine / quantity : 0
        const currency = defaultCurrency || null
        const currencyId = currency?.id || null

        builtItems.push({
          id: reqItemId || tempId--,
          currency_id: currencyId,
          currency,
          value_added_tax_id: null,
          discount_amount: null,
          discount_method: null,
          tax_method: null,
          remarks: null,
          materials: [
            {
              id: matItem.id,
              requisition_item_id: reqItemId || undefined,
              item_id: matItem.item_id,
              unit_of_measurement_id: matItem.unit_of_measurement?.id,
              quantity: String(quantity),
              rate: String(rate),
              currency_id: currencyId,
              description: null,
              item: matItem.item_id ? { id: matItem.item_id, name: matItem.item_name } : null,
              unit_of_measurement: matItem.unit_of_measurement || null,
              currency
            }
          ],
          accounts: [],
          dimensions: [dimensionMeta]
        })
      })
    })

    return builtItems
  }

  const latestApproved = Array.isArray(payload.latest_approved_dimensions)
    ? payload.latest_approved_dimensions
    : null
  const latestDimensions =
    (latestApproved && latestApproved.length ? latestApproved : null) ||
    getLatestApprovedDimensions(approvalStages) ||
    null
  const baseItems = buildItemsFromDimensions(dimensions)
  const latestItems = latestDimensions ? buildItemsFromDimensions(latestDimensions) : null
  const items = latestItems || baseItems
  const original_items = latestDimensions ? baseItems : []

  const approvals = approvalStages.flatMap((stage: any) => {
    const stageApprovals = stage?.approvals || []
    return stageApprovals.map((approval: any) => ({
      ...approval,
      approval_chain_level: {
        id: stage.id,
        level_id: stage.level_id,
        can_change_source: stage.can_change_source,
        role: stage.role || null
      }
    }))
  })

  return {
    ...requisition,
    sources,
    items,
    approvals,
    dimensions_grouped: latestDimensions || dimensions,
    original_items,
    approval_stages: approvalStages
  }
}

const fetchRequisition = async () => {
  loading.value = true
  // Clear cached history to ensure fresh data for approval logic
  itemApprovalHistory.value = null

  try {
    const response = await requisitionService.getMaster(props.id)
    const data = response?.data?.data || response?.data || response
    const normalized = normalizeMasterPayload(data)
    requisition.value = mapRequisition(normalized)

    // Build item approval history from approval_stages
    if (requisition.value.status !== 'DRAFT' && data.approval_stages) {
      itemApprovalHistory.value = buildItemApprovalHistoryFromStages(data.approval_stages)
    }

    await fetchApprovalChain()

    // Initialize states AFTER history is loaded so we can use previous level's data
    initializeItemApprovalStates()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to load requisition.',
      confirmButtonColor: '#2563eb',
    })
    requisition.value = null
  } finally {
    loading.value = false
  }
}

const fetchApprovalChain = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_BASE_URL}requisitions/${props.id}/approval-chain`
    const response = await axios.get(url)
    approvalChain.value = response?.data?.data || response?.data || null
  } catch {
    approvalChain.value = null
  }
}

const normalizeItemApprovalHistory = (payload: any): ItemApprovalHistoryResponse | null => {
  if (!payload) return null
  if (payload.items_history) return payload as ItemApprovalHistoryResponse
  if (payload.data?.items_history) return payload.data as ItemApprovalHistoryResponse
  if (payload.data?.data?.items_history) return payload.data.data as ItemApprovalHistoryResponse
  return null
}

const fetchItemApprovalHistory = async (force = false) => {
  // Rebuild from current requisition data if available
  if (requisition.value && (requisition.value as any).approval_stages) {
    itemApprovalHistory.value = buildItemApprovalHistoryFromStages((requisition.value as any).approval_stages)
    return
  }

  // Fallback to API call if needed
  if (!force && (itemApprovalHistory.value || itemApprovalHistoryLoading.value)) return
  itemApprovalHistoryLoading.value = true
  itemApprovalHistoryError.value = ''
  try {
    const response = await requisitionService.getMaster(props.id)
    const data = response?.data?.data || response?.data || response
    if (data.approval_stages) {
      itemApprovalHistory.value = buildItemApprovalHistoryFromStages(data.approval_stages)
    } else {
      itemApprovalHistory.value = null
    }
  } catch (error: any) {
    itemApprovalHistoryError.value =
      error?.response?.data?.message || 'Failed to load item approval history.'
    itemApprovalHistory.value = null
  } finally {
    itemApprovalHistoryLoading.value = false
  }
}

const buildApprovalItemPayload = (item: RequisitionItem, state?: ItemApprovalState) => {
  const discountMethod = state?.discount_method ?? (item.discount_method as DiscountMethod) ?? null
  const discountAmount = Number(state?.discount_amount ?? item.discount_amount ?? 0)
  const description = state?.remarks || item.remarks || ''

  const accountsSource = state?.accounts?.length ? state.accounts : (item.accounts || [])
  const materialsSource = state?.materials?.length ? state.materials : (item.materials || [])

  const accounts = accountsSource.map((acc: any) => ({
    account_id: acc.account_id,
    currency_id: acc.currency_id ?? item.currency_id,
    amount: Number(acc.amount || 0),
    description: acc.description || ''
  }))

  const materials = materialsSource.map((mat: any) => ({
    item_id: mat.item_id,
    unit_of_measurement_id: mat.unit_of_measurement_id,
    quantity: Number(mat.quantity || 0),
    rate: Number(mat.rate || 0),
    currency_id: mat.currency_id ?? item.currency_id,
    description: mat.description || ''
  }))

  return {
    requisition_item_id: item.id,
    currency_id: item.currency_id,
    discount_method: discountMethod,
    discount_amount: discountAmount,
    description,
    accounts,
    materials
  }
}

const buildApprovalItemsPayload = (selectedOnly: boolean) => {
  if (!requisition.value) return []
  const payloadItems: any[] = []
  for (const item of requisition.value.items) {
    // strict check
    if (!isItemReadyForApproval(item.id)) continue

    const state = itemApprovalStates.value.get(item.id)
    if (selectedOnly && !state?.selected) continue
    const includeState = state && hasModifications(item.id)
    payloadItems.push(buildApprovalItemPayload(item, includeState ? state : undefined))
  }
  return payloadItems
}

const submit = async () => {
  if (!requisition.value || requisition.value.status !== 'DRAFT') return
  loadingAction.value = true
  try {
    await requisitionService.submit(requisition.value.id)
    await fetchRequisition()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to submit requisition.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

const approve = async () => {
  if (!requisition.value) return
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return
  const currentUserId = authStore.user?.id
  if (!currentUserId) {
    await Swal.fire({
      icon: 'warning',
      title: 'Missing User',
      text: 'Please sign in again to continue.',
      confirmButtonColor: '#2563eb',
    })
    return
  }
  loadingAction.value = true
  try {
    const remarks = actionRemarks.value || `Approved at level ${nextApprovalLevel.value || 1}.`
    const items = buildApprovalItemsPayload(false)
    await requisitionService.approve(requisition.value.id, {
      user_id: Number(currentUserId),
      handled_by: Number(currentUserId),
      remarks,
      items
    })
    actionRemarks.value = '' // Clear after success
    showApprovalPanel.value = false
    await fetchRequisition()
    initializeItemApprovalStates()
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Requisition approved successfully!',
      confirmButtonColor: '#2563eb',
      timer: 2000,
      timerProgressBar: true
    })
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to approve requisition.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

// Approve selected items only (partial approval with modifications)
const approveSelectedItems = async () => {
  if (!requisition.value) return
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return
  const selectedItems = buildApprovalItemsPayload(true)

  if (selectedItems.length === 0) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Items Selected',
      text: 'Please select at least one item to approve.',
      confirmButtonColor: '#2563eb',
    })
    return
  }

  const currentUserId = authStore.user?.id
  if (!currentUserId) {
    await Swal.fire({
      icon: 'warning',
      title: 'Missing User',
      text: 'Please sign in again to continue.',
      confirmButtonColor: '#2563eb',
    })
    return
  }

  loadingAction.value = true
  try {
    const remarks = actionRemarks.value || `Approved ${selectedItems.length} item(s) at level ${nextApprovalLevel.value || 1}.`
    await requisitionService.approve(requisition.value.id, {
      user_id: Number(currentUserId),
      handled_by: Number(currentUserId),
      remarks,
      items: selectedItems
    })
    actionRemarks.value = ''
    showApprovalPanel.value = false
    await fetchRequisition()
    initializeItemApprovalStates()
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `${selectedItems.length} item(s) approved successfully!`,
      confirmButtonColor: '#2563eb',
      timer: 2000,
      timerProgressBar: true
    })
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to approve selected items.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

// Reject selected items
const rejectSelectedItems = async () => {
  if (!requisition.value) return
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return

  if (selectedItemsCount.value === 0) {
    await Swal.fire({
      icon: 'warning',
      title: 'No Items Selected',
      text: 'Please select at least one item to reject.',
      confirmButtonColor: '#2563eb',
    })
    return
  }

  const result = await Swal.fire({
    icon: 'warning',
    title: 'Reject Selected Items?',
    text: `Are you sure you want to reject ${selectedItemsCount.value} selected item(s)?`,
    input: 'textarea',
    inputPlaceholder: 'Enter rejection reason (required)...',
    inputValidator: (value) => {
      if (!value?.trim()) {
        return 'Please provide a reason for rejection'
      }
    },
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Reject Items'
  })

  if (!result.isConfirmed) return

  loadingAction.value = true
  try {
    const remarks = result.value || 'Items rejected'
    await requisitionService.reject(requisition.value.id, { remarks })
    actionRemarks.value = ''
    showApprovalPanel.value = false
    await fetchRequisition()
    initializeItemApprovalStates()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to reject items.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

const reject = async () => {
  if (!requisition.value) return
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return
  loadingAction.value = true
  try {
    const remarks = actionRemarks.value || 'Rejected.'
    await requisitionService.reject(requisition.value.id, { remarks })
    actionRemarks.value = ''
    await fetchRequisition()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to reject requisition.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

const cancel = async () => {
  if (!requisition.value) return
  if (!['DRAFT', 'SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return
  loadingAction.value = true
  try {
    await requisitionService.cancel(requisition.value.id, { remarks: 'Cancelled.' })
    await fetchRequisition()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to cancel requisition.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

const close = async () => {
  if (!requisition.value || requisition.value.status !== 'APPROVED') return
  loadingAction.value = true
  try {
    await requisitionService.close(requisition.value.id)
    await fetchRequisition()
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error?.response?.data?.message || 'Failed to close requisition.',
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loadingAction.value = false
  }
}

const goBack = () => router.push('/sales/requisitions')
const goEdit = () => {
  router.push(`/sales/requisitions/${props.id}/edit`)
}
const openPrintView = () => {
  if (!requisition.value) return
  const target = router.resolve({ name: 'sales-requisition-print', params: { id: requisition.value.id } })
  window.open(target.href, '_blank')
}

onMounted(() => {
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true
  fetchRequisition()
})

watch(activeTab, (tab) => {
  if (tab === 'history') {
    fetchItemApprovalHistory(true)
  }
})

onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})
</script>

<template>
  <div class="container-fluid">
    <div class="d-flex align-items-center justify-content-between mb-4 mt-2">
      <div>
        <div class="d-flex align-items-center text-muted small text-uppercase mb-1">
          <i class="fa fa-file-invoice me-2"></i>
          <span>REQUISITION / APPROVAL FORM</span>
        </div>
        <h2 class="mb-1 fw-bold">Requisition Approval</h2>
        <p class="text-muted mb-0">Review the requisition details and approve or reject the request.</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-white border" @click="goBack">
          <i class="fa fa-arrow-left me-1"></i> Back
        </button>

        <button v-if="requisition" class="btn btn-outline-primary" @click="openPrintView">
          <i class="fa fa-print me-1"></i> Print PDF
        </button>

        <button v-if="requisition?.status === 'DRAFT'" class="btn btn-primary text-white" @click="goEdit">
          <i class="fa fa-edit me-1"></i> Edit
        </button>

        <button v-else-if="canEditRequisition" class="btn btn-white border text-primary" @click="goEdit">
          <i class="fa fa-comment-dots me-1"></i> Request Changes
        </button>

        <template v-if="requisition">
          <button v-if="requisition.status === 'DRAFT'" class="btn btn-success text-white" :disabled="loadingAction"
            @click="submit">
            <i class="fa fa-paper-plane me-1"></i> Submit
          </button>

          <button v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover"
            class="btn btn-success text-white" :disabled="loadingAction" @click="approve">
            <i class="fa fa-thumbs-up me-1"></i> Approve
          </button>

          <button v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover"
            class="btn btn-danger text-white" :disabled="loadingAction" @click="reject">
            <i class="fa fa-thumbs-down me-1"></i> Reject
          </button>

          <button
            v-if="requisition.status === 'DRAFT' || (['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover)"
            class="btn btn-dark text-white" :disabled="loadingAction" @click="cancel">
            <i class="fa fa-ban me-1"></i> Cancel
          </button>

          <button v-if="requisition.status === 'APPROVED'" class="btn btn-primary text-white" :disabled="loadingAction"
            @click="close">
            <i class="fa fa-check-circle me-1"></i> Close
          </button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="requisition" class="row">
      <!-- Left Panel: Requisition Details Sidebar -->
      <div class="col-lg-3 col-md-4 mb-3">
        <div class="card h-100 sidebar-card">
          <div class="card-body p-0">
            <!-- Header -->
            <div class="sidebar-header">
              <i class="fa fa-file-text"></i>
              <span>REQUISITION DETAILS</span>
            </div>

            <!-- Requisition Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-file"></i>
              </div>
              <div class="item-content">
                <div class="item-title">Requisition # {{ requisition.code }}</div>
                <div class="item-subtitle">Date submitted: {{ formatDisplayDate(requisition.date) }}</div>
              </div>
            </div>

            <!-- Registerer Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <img v-if="requisition.requested_by_user?.avatar" :src="requisition.requested_by_user.avatar"
                  class="avatar" :alt="userLabel(requisition.requested_by_user)" />
                <div v-else class="avatar-placeholder">
                  <i class="fa fa-user"></i>
                </div>
              </div>
              <div class="item-content">
                <div class="item-title">Registerer: {{ userLabel(requisition.requested_by_user || requisition.user) ||
                  '--' }}</div>
                <div class="item-subtitle">Last updated: {{ formatDisplayDate(requisition.updated_at ||
                  requisition.created_at) }}</div>
              </div>
            </div>

            <!-- Type Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-tag"></i>
              </div>
              <div class="item-content">
                <div class="item-label">Type</div>
                <div class="item-value">{{ requisition.requisition_type?.name || 'GENERAL REQUISITION' }}</div>
              </div>
            </div>

            <!-- Fund Direction Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-arrow-right"></i>
              </div>
              <div class="item-content">
                <div class="item-label">Fund Direction</div>
                <div class="item-value">{{ requisition.fund_direction === 'DIRECT_PAYMENT' ? 'Direct Payment' : 'Withdraw' }}
                </div>
                <div class="item-hint" v-if="requisition.fund_direction === 'DIRECT_PAYMENT'">
                  The payment will be made directly to the vendor/payee.
                </div>
                <div class="item-hint" v-else>
                  Internal fund withdrawal request.
                </div>
              </div>
            </div>

            <!-- Funding Source Section Header -->
            <div class="sidebar-section-header">
              <i class="fa fa-wallet"></i>
              <span>FUNDING SOURCE</span>
            </div>

            <div v-if="requisition.sources?.length">
              <div v-for="source in requisition.sources" :key="`source-${source.id}`" class="sidebar-item">
                <div class="item-icon">
                  <i class="fa fa-money-check-alt"></i>
                </div>
                <div class="item-content">
                  <div class="item-label">{{ source.source_type || 'SOURCE' }}</div>
                  <div class="item-value">{{ sourceNameLabel(source) }}</div>
                  <div class="item-subtitle">
                    Payee: {{ sourceEntityLabel(source) }}
                  </div>
                  <div class="item-subtitle">
                    Mode: {{ source.mode_of_payment || '--' }} | Currency: {{ source.currency?.code ||source.currency?.name || '--' }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-money-check-alt"></i>
              </div>
              <div class="item-content">
                <div class="item-value">--</div>
                <div class="item-subtitle">No funding source provided</div>
              </div>
            </div>

            <!-- Required Date Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-calendar"></i>
              </div>
              <div class="item-content">
                <div class="item-label">Required Date</div>
                <div class="item-value">{{ formatDisplayDate(requisition.required_date) }}</div>
              </div>
            </div>

            <!-- Currency & Tax Section Header -->
            <div class="sidebar-section-header">
              <i class="fa fa-money-bill"></i>
              <span>CURRENCY & TAX</span>
            </div>

            <!-- Currency Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-coins"></i>
              </div>
              <div class="item-content">
                <div class="item-value fw-600">{{ getCurrencyName() }}</div>
              </div>
            </div>

            <!-- Tax Method Item -->
            <div class="sidebar-item">
              <div class="item-icon">
                <i class="fa fa-percent"></i>
              </div>
              <div class="item-content">
                <div class="item-value">{{ getTaxMethodLabel() }}</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Middle Panel: Content -->
      <div class="col-lg-9 col-md-8">
        <div class="card h-100">
          <div class="card-body">
            <div class="approval-tabs mb-4">
              <button class="approval-tab" :class="{ active: activeTab === 'response' }" type="button"
                @click="activeTab = 'response'">
                MY RESPONSE
              </button>
              <button class="approval-tab" :class="{ active: activeTab === 'approval' }" type="button"
                @click="activeTab = 'approval'">
                CHAIN OF APPROVAL
              </button>
              <button class="approval-tab" :class="{ active: activeTab === 'history' }" type="button"
                @click="activeTab = 'history'">
                ITEM CHANGES
                <span v-if="modifiedItemsCount > 0">({{ modifiedItemsCount }})</span>
              </button>
            </div>

            <div v-show="activeTab === 'response'">
              <!-- Status Summary Banner -->
              <div v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && (nextApprovalLevel || 0) > 1"
                class="mb-3">
                <div class="row g-2">
                  <div v-if="skippedItemsCount > 0" class="col-auto">
                    <div class="status-pill bg-secondary-subtle text-secondary border border-secondary-subtle">
                      <i class="fa fa-forward me-1"></i>
                      <strong>{{ skippedItemsCount }}</strong> Skipped
                    </div>
                  </div>
                  <div v-if="rejectedItemsCount > 0" class="col-auto">
                    <div class="status-pill bg-danger-subtle text-danger border border-danger-subtle">
                      <i class="fa fa-times-circle me-1"></i>
                      <strong>{{ rejectedItemsCount }}</strong> Rejected
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rejected Items Warning -->
              <div v-if="rejectedItemsCount > 0" class="alert alert-danger d-flex align-items-start gap-2 mb-3">
                <i class="fa fa-exclamation-triangle mt-1"></i>
                <div>
                  <strong>⛔ {{ rejectedItemsCount }} Item(s) Rejected at Previous Level</strong>
                  <div class="small mt-1">
                    <div v-for="{ item, status } in categorizedItems.rejected" :key="item.id" class="mt-1">
                      • Item #{{ item.id }} - Rejected by {{ status.previousApprover }}
                      <span v-if="status.previousRemarks" class="text-muted">: {{ status.previousRemarks }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Skipped Items Info -->
              <div v-if="skippedItemsCount > 0" class="alert alert-secondary d-flex align-items-start gap-2 mb-3">
                <i class="fa fa-forward mt-1"></i>
                <div>
                  <strong>{{ skippedItemsCount }} Item(s) Were not approved at Previous Level</strong>
                </div>
              </div>

              <!-- Per-Item Approval Controls -->
              <div
                v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover && readyItemsCount > 0"
                class="mb-3">
                <div class="alert alert-info d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-2">
                    <input type="checkbox" class="form-check-input m-0" v-model="selectAllItems"
                      style="width: 18px; height: 18px;" />
                    <span class="fw-bold">
                      <i class="fa fa-check-circle me-1"></i>
                      {{ selectedItemsCount }} of {{ readyItemsCount }} items selected
                    </span>
                  </div>
                  <div class="d-flex gap-2">
                    <button v-if="selectedItemsCount > 0" class="btn btn-sm btn-success text-white"
                      @click="approveSelectedItems" :disabled="loadingAction">
                      <i class="fa fa-thumbs-up me-1"></i>
                      Approve Selected ({{ selectedItemsCount }})
                    </button>
                    <button v-if="selectedItemsCount > 0" class="btn btn-sm btn-danger text-white"
                      @click="rejectSelectedItems" :disabled="loadingAction">
                      <i class="fa fa-thumbs-down me-1"></i>
                      Reject Selected
                    </button>
                  </div>
                </div>
              </div>

              <!-- No Items Ready Message -->
              <div
                v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover && readyItemsCount === 0 && (nextApprovalLevel || 0) > 1 && notReviewedItemsCount === 0 && (skippedItemsCount + rejectedItemsCount) === requisition.items.length"
                class="alert alert-warning text-center">
                <i class="fa fa-info-circle me-1"></i>
                No items are ready for approval at this level. All items were either skipped or rejected by the previous
                approver.
              </div>

              <!-- Items Section with Per-Item Approval -->
              <div class="mb-3">
                <!-- Cost Center Grouped View -->
                <template v-if="hasCostCenters">
                  <div v-for="group in itemsByCostCenter" :key="`details-${group.key}`" class="item-approval-card mb-3">
                    <!-- Cost Center Header -->
                    <div class="cost-center-card-header">
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary">{{ group.dimensionTypeName }}</span>
                        <span class="fw-bold">{{ group.dimensionValueCode ? `${group.dimensionValueCode} - ` : '' }}{{
                          group.dimensionValueName }}</span>
                      </div>
                      <span class="fw-bold text-primary">{{ formatMoney(group.subtotal, group.currencySymbol) }}</span>
                    </div>

                    <!-- All Items in this cost center (Filtered by Approval Readiness) -->
                    <div class="cost-center-items-wrapper">
                      <template v-for="({ item, itemIndex, lines }, idx) in group.items" :key="`item-${item.id}`">
                        <div class="item-row" :class="{ 'border-bottom': idx < group.items.length - 1 }">
                          <!-- Previous Approver Badge -->
                          <div v-if="getItemApprovalStatus(item.id).wasModified" class="previous-level-badge">
                            <i class="fa fa-pencil-alt me-1"></i>
                            Modified by L{{ getItemApprovalStatus(item.id).previousLevel }} ({{
                              getItemApprovalStatus(item.id).previousApprover }})
                          </div>

                          <!-- Item Header -->
                          <div class="item-row-header">
                            <div class="d-flex align-items-center gap-2 flex-grow-1">
                              <input v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status)"
                                type="checkbox" class="form-check-input m-0"
                                :checked="itemApprovalStates.get(item.id)?.selected"
                                :disabled="!isItemReadyForApproval(item.id)"
                                @change="toggleItemSelection(item.id)" style="width: 18px; height: 18px;" />
                              <div class="item-number-badge-small">{{ itemIndex + 1 }}</div>
                              <div class="flex-grow-1">
                                <div class="fw-semibold small text-dark">Item {{ itemIndex + 1 }}</div>
                                <div class="small text-muted" style="font-size: 0.75rem;">{{ item.remarks || 'No description' }}</div>
                              </div>
                              <div v-if="hasModifications(item.id)" class="badge bg-warning text-dark"
                                style="font-size: 0.65rem;">
                                <i class="fa fa-edit me-1"></i>Modified
                              </div>
                            </div>
                            <div v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover"
                              class="d-flex gap-2">
                              <button v-if="itemApprovalStates.get(item.id)?.editing" class="btn btn-sm btn-success"
                                style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="saveItemChanges(item.id)">
                                <i class="fa fa-xs fa-check"></i>
                                Save
                              </button>
                              <button class="btn btn-sm btn-outline-primary"
                                style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
                                @click="toggleItemEditing(item.id)">
                                <i class="fa fa-xs"
                                  :class="itemApprovalStates.get(item.id)?.editing ? 'fa-times' : 'fa-edit'"></i>
                                {{ itemApprovalStates.get(item.id)?.editing ? 'Cancel' : 'Change' }}
                              </button>
                            </div>
                          </div>

                          <!-- Item Details (Read-only or Editable) -->
                          <div class="item-row-body">
                            <template v-if="!itemApprovalStates.get(item.id)?.editing">
                              <!-- Read-only view -->
                              <div class="table-responsive">
                                <table class="table table-sm table-borderless mb-0">
                                  <thead class="table-light">
                                    <tr class="small text-muted text-uppercase">
                                      <th>Type</th>
                                      <th>Description</th>
                                      <th>Unit</th>
                                      <th class="text-end">Qty</th>
                                      <th class="text-end">Rate</th>
                                      <th class="text-end">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-for="(line, idx) in lines" :key="`line-${idx}`">
                                      <td>
                                        <i class="fa"
                                          :class="line.type === 'Item' ? 'fa-box text-info' : 'fa-file-invoice text-success'"></i>
                                      </td>
                                      <td class="fw-medium">{{ line.name }}</td>
                                      <td>{{ line.unit || '--' }}</td>
                                      <td class="text-end">{{ line.quantity || '--' }}</td>
                                      <td class="text-end">{{ line.rate ? formatMoney(line.rate, line.currencySymbol) :
                                        '--' }}</td>
                                      <td class="text-end fw-bold text-primary">{{ formatMoney(line.amount,
                                        line.currencySymbol) }}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <div v-if="hasOriginalDiff(item.id)" class="mt-2 original-lines">
                                <div class="small text-muted fw-semibold mb-1">Original items</div>
                                <div class="table-responsive">
                                  <table class="table table-sm table-borderless mb-0">
                                    <thead class="table-light">
                                      <tr class="small text-muted text-uppercase">
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Unit</th>
                                        <th class="text-end">Qty</th>
                                        <th class="text-end">Rate</th>
                                        <th class="text-end">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr v-for="(line, idx) in getOriginalLines(item.id)" :key="`orig-${idx}`">
                                        <td>
                                          <i class="fa"
                                            :class="line.type === 'Item' ? 'fa-box text-muted' : 'fa-file-invoice text-muted'"></i>
                                        </td>
                                        <td class="text-muted">{{ line.name }}</td>
                                        <td class="text-muted">{{ line.unit || '--' }}</td>
                                        <td class="text-end text-muted">{{ line.quantity || '--' }}</td>
                                        <td class="text-end text-muted">
                                          {{ line.rate ? formatMoney(line.rate, line.currencySymbol) : '--' }}
                                        </td>
                                        <td class="text-end text-muted">
                                          {{ formatMoney(line.amount, line.currencySymbol) }}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </template>
                            <template v-else>
                              <!-- Editable view -->
                              <div class="table-responsive">
                                <table class="table table-sm mb-0">
                                  <thead class="table-light">
                                    <tr class="small text-muted text-uppercase">
                                      <th>Type</th>
                                      <th>Description</th>
                                      <th>Unit</th>
                                      <th class="text-end" style="width: 120px">Qty</th>
                                      <th class="text-end" style="width: 150px">Rate</th>
                                      <th class="text-end" style="width: 150px">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <template v-for="(line, idx) in lines" :key="`line-${idx}`">
                                      <tr v-if="line.type === 'Item'">
                                        <td>
                                          <i class="fa fa-box text-info"></i>
                                        </td>
                                        <td class="fw-medium">{{ line.name }}</td>
                                        <td>{{ line.unit || '--' }}</td>
                                        <td class="text-end">
                                          <input type="number" class="form-control form-control-sm text-end"
                                            v-model.number="itemApprovalStates.get(item.id)!.materials[idx].quantity"
                                            step="0.01" style="width: 100px; display: inline-block;" />
                                        </td>
                                        <td class="text-end">
                                          <CurrencyInput v-model="itemApprovalStates.get(item.id)!.materials[idx].rate"
                                            class="text-end" style="width: 130px; display: inline-block;" />
                                        </td>
                                        <td class="text-end fw-bold text-primary">
                                          {{ formatMoney((itemApprovalStates.get(item.id)!.materials[idx].quantity || 0)
                                            * (itemApprovalStates.get(item.id)!.materials[idx].rate || 0),
                                            line.currencySymbol) }}
                                        </td>
                                      </tr>
                                      <tr v-else>
                                        <td>
                                          <i class="fa fa-file-invoice text-success"></i>
                                        </td>
                                        <td class="fw-medium">{{ line.name }}</td>
                                        <td>--</td>
                                        <td class="text-end">1</td>
                                        <td class="text-end">
                                          <CurrencyInput
                                            v-model="itemApprovalStates.get(item.id)!.accounts[idx - itemApprovalStates.get(item.id)!.materials.length].amount"
                                            class="text-end" style="width: 130px; display: inline-block;" />
                                        </td>
                                        <td class="text-end fw-bold text-primary">
                                          {{ formatMoney(itemApprovalStates.get(item.id)!.accounts[idx -
                                            itemApprovalStates.get(item.id)!.materials.length].amount || 0,
                                            line.currencySymbol) }}
                                        </td>
                                      </tr>
                                    </template>
                                  </tbody>
                                </table>
                              </div>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>

                <!-- Flat View (No Cost Centers) -->
                <template v-else>
                  <div class="item-approval-card mb-3">
                    <template v-for="(item, itemIndex) in requisition.items" :key="`item-${item.id}`">
                      <div class="item-row" :class="{ 'border-bottom': itemIndex < requisition.items.length - 1 }">
                        <!-- Previous Approver Badge -->
                        <div v-if="getItemApprovalStatus(item.id).wasModified" class="previous-level-badge">
                          <i class="fa fa-pencil-alt me-1"></i>
                          Modified by L{{ getItemApprovalStatus(item.id).previousLevel }} ({{
                            getItemApprovalStatus(item.id).previousApprover }})
                        </div>

                        <!-- Item Header -->
                        <div class="item-row-header">
                          <div class="d-flex align-items-center gap-2 flex-grow-1">
                            <input v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status)" type="checkbox"
                              class="form-check-input m-0" :checked="itemApprovalStates.get(item.id)?.selected"
                              :disabled="!isItemReadyForApproval(item.id)"
                              @change="toggleItemSelection(item.id)" style="width: 18px; height: 18px;" />
                            <div class="item-number-badge-small">{{ itemIndex + 1 }}</div>
                            <div class="flex-grow-1">
                              <div class="fw-semibold small text-dark">Item {{ itemIndex + 1 }}</div>
                              <div class="small text-muted" style="font-size: 0.75rem;">{{ item.remarks || 'No description' }}</div>
                            </div>
                            <div v-if="hasModifications(item.id)" class="badge bg-warning text-dark"
                              style="font-size: 0.65rem;">
                              <i class="fa fa-edit me-1"></i>Modified
                            </div>
                          </div>
                          <div v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover"
                            class="d-flex gap-2">
                            <button v-if="itemApprovalStates.get(item.id)?.editing" class="btn btn-sm btn-success"
                              style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="saveItemChanges(item.id)">
                              <i class="fa fa-xs fa-check"></i>
                              Save
                            </button>
                            <button class="btn btn-sm btn-outline-primary"
                              style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="toggleItemEditing(item.id)">
                              <i class="fa fa-xs"
                                :class="itemApprovalStates.get(item.id)?.editing ? 'fa-times' : 'fa-edit'"></i>
                              {{ itemApprovalStates.get(item.id)?.editing ? 'Cancel' : 'Change' }}
                            </button>
                          </div>
                        </div>

                        <!-- Item Details -->
                        <div class="item-row-body">
                          <template v-if="!itemApprovalStates.get(item.id)?.editing">
                            <div class="table-responsive">
                              <table class="table table-sm table-borderless mb-0">
                                <thead class="table-light">
                                  <tr class="small text-muted text-uppercase">
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Unit</th>
                                    <th class="text-end">Qty</th>
                                    <th class="text-end">Rate</th>
                                    <th class="text-end">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="(line, idx) in buildItemLines(item, getItemState(item.id))"
                                    :key="`line-${idx}`">
                                    <td>
                                      <i class="fa"
                                        :class="line.type === 'Item' ? 'fa-box text-info' : 'fa-file-invoice text-success'"></i>
                                    </td>
                                    <td class="fw-medium">{{ line.name }}</td>
                                    <td>{{ line.unit || '--' }}</td>
                                    <td class="text-end">{{ line.quantity || '--' }}</td>
                                    <td class="text-end">{{ line.rate ? formatMoney(line.rate, line.currencySymbol) :
                                      '--' }}</td>
                                    <td class="text-end fw-bold text-primary">{{ formatMoney(line.amount,
                                      line.currencySymbol) }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div v-if="hasOriginalDiff(item.id)" class="mt-2 original-lines">
                              <div class="small text-muted fw-semibold mb-1">Original items</div>
                              <div class="table-responsive">
                                <table class="table table-sm table-borderless mb-0">
                                  <thead class="table-light">
                                    <tr class="small text-muted text-uppercase">
                                      <th>Type</th>
                                      <th>Description</th>
                                      <th>Unit</th>
                                      <th class="text-end">Qty</th>
                                      <th class="text-end">Rate</th>
                                      <th class="text-end">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-for="(line, idx) in getOriginalLines(item.id)" :key="`orig-${idx}`">
                                      <td>
                                        <i class="fa"
                                          :class="line.type === 'Item' ? 'fa-box text-muted' : 'fa-file-invoice text-muted'"></i>
                                      </td>
                                      <td class="text-muted">{{ line.name }}</td>
                                      <td class="text-muted">{{ line.unit || '--' }}</td>
                                      <td class="text-end text-muted">{{ line.quantity || '--' }}</td>
                                      <td class="text-end text-muted">
                                        {{ line.rate ? formatMoney(line.rate, line.currencySymbol) : '--' }}
                                      </td>
                                      <td class="text-end text-muted">
                                        {{ formatMoney(line.amount, line.currencySymbol) }}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </template>
                          <template v-else>
                            <div class="table-responsive">
                              <table class="table table-sm mb-0">
                                <thead class="table-light">
                                  <tr class="small text-muted text-uppercase">
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Unit</th>
                                    <th class="text-end" style="width: 120px">Qty</th>
                                    <th class="text-end" style="width: 150px">Rate</th>
                                    <th class="text-end" style="width: 150px">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <template v-for="(line, idx) in buildItemLines(item, getItemState(item.id))"
                                    :key="`line-${idx}`">
                                    <tr v-if="line.type === 'Item'">
                                      <td>
                                        <i class="fa fa-box text-info"></i>
                                      </td>
                                      <td class="fw-medium">{{ line.name }}</td>
                                      <td>{{ line.unit || '--' }}</td>
                                      <td class="text-end">
                                        <input type="number" class="form-control form-control-sm text-end"
                                          v-model.number="itemApprovalStates.get(item.id)!.materials[idx].quantity"
                                          step="0.01" style="width: 100px; display: inline-block;" />
                                      </td>
                                      <td class="text-end">
                                        <CurrencyInput v-model="itemApprovalStates.get(item.id)!.materials[idx].rate"
                                          class="text-end" style="width: 130px; display: inline-block;" />
                                      </td>
                                      <td class="text-end fw-bold text-primary">
                                        {{ formatMoney((itemApprovalStates.get(item.id)!.materials[idx].quantity || 0) *
                                          (itemApprovalStates.get(item.id)!.materials[idx].rate || 0),
                                          line.currencySymbol) }}
                                      </td>
                                    </tr>
                                    <tr v-else>
                                      <td>
                                        <i class="fa fa-file-invoice text-success"></i>
                                      </td>
                                      <td class="fw-medium">{{ line.name }}</td>
                                      <td>--</td>
                                      <td class="text-end">1</td>
                                      <td class="text-end">
                                        <CurrencyInput
                                          v-model="itemApprovalStates.get(item.id)!.accounts[idx - itemApprovalStates.get(item.id)!.materials.length].amount"
                                          class="text-end" style="width: 130px; display: inline-block;" />
                                      </td>
                                      <td class="text-end fw-bold text-primary">
                                        {{ formatMoney(itemApprovalStates.get(item.id)!.accounts[idx -
                                          itemApprovalStates.get(item.id)!.materials.length].amount || 0,
                                          line.currencySymbol) }}
                                      </td>
                                    </tr>
                                  </template>
                                </tbody>
                              </table>
                            </div>
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </div>

              <!-- Totals Section -->
              <div class="totals-card-compact">
                <div class="totals-row-compact">
                  <span class="text-muted small">Subtotal</span>
                  <span class="fw-semibold small">{{ formatMoney(totalAmount, getCurrencySymbol()) }}</span>
                </div>
                <div class="totals-row-compact" v-if="selectedItemsCount > 0">
                  <span class="text-muted small">
                    <span class="badge bg-info me-1" style="font-size: 0.65rem;">
                      {{ selectedItemsCount }} selected
                    </span>
                    Selected Total
                  </span>
                  <span class="fw-semibold small text-info">{{ formatMoney(selectedItemsTotal, getCurrencySymbol())
                  }}</span>
                </div>
                <div class="totals-row-compact border-top pt-2 mt-1">
                  <span class="fw-bold">Grand Total</span>
                  <span class="fw-bold text-primary">{{ formatMoney(totalAmount, getCurrencySymbol()) }}</span>
                </div>
              </div>

              <!-- Action Section -->
              <div v-if="['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) && isCurrentUserNextApprover"
                class="action-section-compact mt-3">
                <div class="mb-2">
                  <label class="form-label small fw-bold text-muted"
                    style="font-size: 0.75rem; margin-bottom: 0.25rem;">Approval Remarks</label>
                  <textarea v-model="actionRemarks" class="form-control form-control-sm" rows="2"
                    placeholder="Enter your comments or reasons for approval/rejection..."
                    style="font-size: 0.875rem;"></textarea>
                </div>
                <div class="d-flex gap-2 justify-content-end">
                  <button class="btn btn-sm btn-outline-secondary" @click="actionRemarks = ''"
                    style="font-size: 0.8rem;">
                    <i class="fa fa-eraser me-1"></i> Clear
                  </button>
                  <button class="btn btn-sm btn-success text-white" @click="approve" :disabled="loadingAction"
                    style="font-size: 0.8rem;">
                    <i class="fa fa-thumbs-up me-1"></i> Approve All
                  </button>
                  <button class="btn btn-sm btn-danger text-white" @click="reject" :disabled="loadingAction"
                    style="font-size: 0.8rem;">
                    <i class="fa fa-thumbs-down me-1"></i> Reject
                  </button>
                </div>
              </div>

            </div>

            <div v-show="activeTab === 'approval'">
              <div class="row">
                <div class="col-12">
                  <h6 class="fw-bold mb-4 text-uppercase small text-muted border-bottom pb-2">Approval Chain</h6>

                  <!-- Stepper -->
                  <div class="approval-stepper mb-5 ps-2">
                    <div v-if="approvalSteps.length === 0" class="text-muted fst-italic">No approval steps defined.
                    </div>
                    <div v-for="step in approvalSteps" :key="step.stepNumber"
                      class="position-relative d-flex gap-3 mb-4 last:mb-0">
                      <!-- Step Icon/connector -->
                      <div class="step-indicator d-flex flex-column align-items-center"
                        style="width: 40px; min-width: 40px;">
                        <div
                          class="step-circle rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          :class="{
                            'bg-success': step.status === 'APPROVED',
                            'bg-danger': step.status === 'REJECTED',
                            'bg-primary': step.status === 'CURRENT',
                            'bg-secondary bg-opacity-25 text-muted': step.status === 'PENDING'
                          }" style="width: 32px; height: 32px; font-size: 0.8rem; z-index: 2;">
                          <i v-if="step.status === 'APPROVED'" class="fa fa-check"></i>
                          <i v-else-if="step.status === 'REJECTED'" class="fa fa-times"></i>
                          <span v-else>{{ step.stepNumber }}</span>
                        </div>
                        <div v-if="step.stepNumber !== approvalSteps.length"
                          class="step-line bg-secondary bg-opacity-25 position-absolute"
                          style="width: 2px; top: 32px; bottom: -24px; left: 19px; z-index: 1;"></div>
                      </div>

                      <!-- Step Content -->
                      <div class="step-content pb-2 w-100">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <h6 class="mb-0 fw-bold text-dark">{{ step.roleName }}</h6>
                          <span class="badge rounded-pill border" :class="{
                            'bg-success-subtle text-success border-success-subtle': step.status === 'APPROVED',
                            'bg-danger-subtle text-danger border-danger-subtle': step.status === 'REJECTED',
                            'bg-primary-subtle text-primary border-primary-subtle': step.status === 'CURRENT',
                            'bg-light text-muted': step.status === 'PENDING'
                          }">
                            STEP {{ step.stepNumber }} OF {{ step.totalSteps }}
                          </span>
                        </div>

                        <div v-if="step.status === 'APPROVED' || step.status === 'REJECTED'" class="mb-1">
                          <div class="d-flex align-items-center text-muted small mb-1">
                            <i class="fa fa-user-circle me-1"></i>
                            <span class="me-1">{{ step.status === 'APPROVED' ? 'Approved by' : 'Rejected by' }}</span>
                            <span class="fw-bold text-dark">{{ step.approverName }}</span>
                            <span class="mx-2">-</span>
                            <span>{{ formatApprovalDate(step.date) }}</span>
                          </div>
                          <div v-if="step.remarks" class="text-muted small">
                            <i class="fa fa-comment-dots me-1"></i>
                            <span class="fw-semibold text-dark">Comment:</span>
                            <span class="ms-1">{{ step.remarks }}</span>
                          </div>
                        </div>

                        <div v-else-if="step.status === 'CURRENT'" class="text-primary small fw-medium">
                          <i class="fa fa-clock me-1"></i> Awaiting Approval
                        </div>
                        <div v-else class="text-muted small">
                          <i class="fa fa-hourglass-start me-1"></i> Pending
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'history'">
              <div class="row">
                <div class="col-12">
                  <h6 class="fw-bold mb-3 text-uppercase small text-muted border-bottom pb-2">Item Approval History</h6>

                  <div v-if="itemApprovalHistoryLoading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                  </div>

                  <div v-else-if="itemApprovalHistoryError"
                    class="alert alert-warning d-flex align-items-center justify-content-between">
                    <span>{{ itemApprovalHistoryError }}</span>
                    <button class="btn btn-sm btn-outline-primary" type="button"
                      @click="fetchItemApprovalHistory(true)">
                      Retry
                    </button>
                  </div>

                  <div v-else-if="!itemApprovalHistory || !itemApprovalHistory.items_history?.length"
                    class="text-muted text-center py-4">
                    No item approval history available.
                  </div>

                  <div v-else>
                    <!-- Compact Timeline Card -->
                    <div class="card shadow-sm border-0">
                      <div class="list-group list-group-flush">
                        <div v-for="item in itemApprovalHistory.items_history" :key="item.item_id"
                          class="list-group-item p-3">
                          <div class="item-history-header">
                            <div>
                              <div class="fw-bold text-dark">Item #{{ item.item_id }}</div>
                              <div class="text-muted small">{{ getItemDisplayLabel(item.item_id) }}</div>
                            </div>
                            <div class="d-flex align-items-center flex-wrap gap-1">
                              <div v-for="app in item.approval_history" :key="app.approval_id || app.level_number"
                                :title="`${app.level_name || `Level ${app.level_number}`} by ${app.approved_by?.name || 'Unknown'}`">
                                <span class="badge rounded-pill"
                                  :class="app.status === 'APPROVED' ? 'bg-success' : 'bg-danger'"
                                  style="font-size: 0.7rem; padding: 0.35rem 0.6rem;">
                                  L{{ app.level_number }}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div class="history-approvals">
                            <div v-for="app in item.approval_history"
                              :key="`${item.item_id}-${app.level_number}`" class="history-approval-card">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <div class="fw-semibold small text-dark">
                                  {{ app.level_name || `Level ${app.level_number}` }}
                                </div>
                                <span class="badge rounded-pill"
                                  :class="app.status === 'APPROVED' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
                                  {{ app.status }}
                                </span>
                              </div>

                              <div class="text-muted small">
                                <i class="fa fa-user-circle me-1"></i>
                                <span>{{ app.approved_by?.name || 'Unknown' }}</span>
                                <span v-if="app.date" class="ms-2">• {{ formatApprovalDate(app.date) }}</span>
                              </div>

                              <div v-if="app.remarks" class="text-muted small mt-1">
                                <i class="fa fa-comment-dots me-1"></i>
                                <span>{{ app.remarks }}</span>
                              </div>

                              <div v-if="app.has_changes && app.changes.length" class="history-changes mt-2">
                                <div v-for="(change, idx) in app.changes" :key="idx" class="change-row">
                                  <div class="change-field">{{ change.field }}</div>
                                  <div class="change-values">
                                    <span class="text-decoration-line-through text-muted">{{ change.original }}</span>
                                    <i class="fa fa-long-arrow-right mx-1 text-muted"></i>
                                    <span class="fw-semibold text-success">{{ change.modified }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
        /* Sidebar Card Styles */
        .sidebar-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          overflow: hidden;
          background: #ffffff;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-bottom: 2px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-weight: 700;
          font-size: 11px;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-header i {
          font-size: 14px;
          color: #2563eb;
        }

        .sidebar-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 12px;
          border-bottom: 1px solid #f0f4f8;
          transition: all 0.2s ease;
        }

        .sidebar-item:last-child {
          border-bottom: none;
        }

        .sidebar-item:hover {
          background: #f8fafc;
        }

        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 6px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 14px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .item-content {
          flex: 1;
          min-width: 0;
        }

        .item-title {
          font-weight: 600;
          font-size: 13px;
          color: #0f172a;
          word-break: break-word;
        }

        .item-label {
          font-weight: 700;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
        }

        .item-value {
          font-weight: 600;
          font-size: 13px;
          color: #0f172a;
        }

        .fw-600 {
          font-weight: 600;
        }

        .item-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .item-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          line-height: 1.4;
        }

        .sidebar-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-bottom: 2px solid #e2e8f0;
          background: linear-gradient(135deg, #f1f5f9 0%, #e8ecf0 100%);
          font-weight: 700;
          font-size: 11px;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 6px;
        }

        .sidebar-section-header i {
          font-size: 14px;
          color: #059669;
        }

        /* Item Approval Cards */
        .item-approval-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .item-approval-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        /* Cost Center Card Header */
        .cost-center-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-bottom: 1px solid #93c5fd;
        }

        /* Cost Center Items Wrapper */
        .cost-center-items-wrapper {
          background: #ffffff;
        }

        /* Item Row (within grouped card) */
        .item-row {
          padding: 0.75rem 1rem;
        }

        .item-row.border-bottom {
          border-bottom: 1px solid #f1f5f9;
        }

        /* Item Row Header */
        .item-row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        /* Item Row Body */
        .item-row-body {
          padding-left: 0;
        }

        /* Small Item Number Badge */
        .item-number-badge-small {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border-radius: 5px;
          font-weight: 700;
          font-size: 0.7rem;
          box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
          flex-shrink: 0;
        }

        .item-card-body {
          padding: 0.875rem;
        }

        .edit-section {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px dashed #cbd5e1;
        }

        /* Totals Card */
        .totals-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1.5rem;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        /* Compact Totals Card */
        .totals-card-compact {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin-top: 1rem;
        }

        .totals-row-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.35rem 0;
        }

        /* Approval History Preview */
        .approval-history-preview {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .item-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .history-approvals {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .history-approval-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
        }

        .history-changes {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
        }

        .change-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
          padding: 0.25rem 0;
          border-bottom: 1px dashed #fde68a;
        }

        .change-row:last-child {
          border-bottom: none;
        }

        .change-field {
          font-weight: 600;
          color: #92400e;
        }

        .change-values {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
        }

        .approval-history-item {
          padding: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .approval-history-item:last-child {
          border-bottom: none;
        }

        .approval-status-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
        }

        /* Action Section */
        .action-section {
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 1rem;
        }

        /* Compact Action Section */
        .action-section-compact {
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 0.75rem 1rem;
        }

        .approval-tabs {
          display: inline-flex;
          gap: 0.25rem;
          background: #f1f3f5;
          padding: 0.35rem;
          border-radius: 10px;
          border: 1px solid #e2e6ea;
        }

        .approval-tab {
          border: none;
          background: transparent;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-weight: 600;
          color: #6c757d;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .approval-tab:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .approval-tab.active {
          background: #ffffff;
          color: #2f3a44;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        /* Timeline for approval stepper */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .timeline-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          font-size: 0.875rem;
        }

        .timeline-content {
          flex: 1;
          background: #f8f9fa;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          border-left: 3px solid #dee2e6;
        }

        .requisition-summary {
          border: 1px solid #e2e6ea;
          border-radius: 6px;
          overflow: hidden;
          background: #ffffff;
        }

        .summary-row {
          display: grid;
          grid-template-columns: 160px 1fr 160px 1fr;
          border-bottom: 1px solid #e2e6ea;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-cell {
          padding: 0.6rem 0.9rem;
          border-right: 1px solid #e2e6ea;
        }

        .summary-cell:last-child {
          border-right: none;
        }

        .summary-cell.label {
          background: #f1f3f5;
          color: #6c757d;
          font-weight: 600;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .summary-cell.value {
          color: #2f3a44;
          font-weight: 600;
        }

        .source-bar {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .source-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          border: 1px solid #e2e6ea;
          background: #f8f9fa;
          font-size: 0.75rem;
        }

        .source-pill .label {
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-weight: 600;
          font-size: 0.7rem;
        }

        .source-pill .value {
          color: #2f3a44;
          font-weight: 600;
        }

        .dimension-group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e6ea;
          border-radius: 6px;
          background: #f8f9fa;
          margin-bottom: 0.75rem;
        }

        /* Cost Center Summary Cards */
        .cost-center-summary {
          margin-bottom: 1.5rem;
        }

        .cost-center-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          min-height: 120px;
        }

        .cost-center-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
        }

        .cost-center-card.unassigned {
          background: linear-gradient(135deg, #868e96 0%, #495057 100%);
        }

        .cost-center-card .cc-badge {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .cost-center-card .cc-name {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .cost-center-card .cc-amount {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .cost-center-card .cc-items {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .cost-center-card .cc-expand-icon {
          position: absolute;
          bottom: 0.75rem;
          right: 0.75rem;
          opacity: 0.7;
        }

        /* Cost Center Headers and Items */
        .cost-center-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%);
          border: 1px solid #e2e6ea;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cost-center-header:hover {
          background: linear-gradient(90deg, #e9ecef 0%, #f8f9fa 100%);
        }

        .cost-center-header.collapsed {
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .cost-center-header.unassigned {
          background: linear-gradient(90deg, #fff3cd 0%, #ffffff 100%);
          border-color: #ffc107;
        }

        .cost-center-header .cc-type-badge {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #495057;
        }

        .cost-center-header .cc-subtotal {
          font-size: 1rem;
          font-weight: 700;
          color: #2563eb;
        }

        .cost-center-header .cc-item-count {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .cost-center-items {
          border: 1px solid #e2e6ea;
          border-top: none;
          border-radius: 0 0 8px 8px;
          background: #fff;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .item-block {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .item-block:last-child {
          margin-bottom: 0;
        }

        .item-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px dashed #dee2e6;
        }

        .item-block-header .item-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #2563eb;
          color: #fff;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .item-block .table {
          background: #fff;
          border-radius: 4px;
          overflow: hidden;
        }

        .item-block .table thead {
          background: #e9ecef;
        }

        .item-block .table th {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #495057;
          font-weight: 600;
          padding: 0.5rem;
        }

        .item-block .table td {
          padding: 0.5rem;
          vertical-align: middle;
        }

        .item-block .table .fw-medium {
          font-weight: 500;
        }

        .original-lines {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          padding: 0.5rem;
        }

        @media (max-width: 992px) {
          .summary-row {
            grid-template-columns: 140px 1fr;
          }

          .summary-cell {
            border-right: none;
            border-bottom: 1px solid #e2e6ea;
          }

          .summary-row .summary-cell:nth-child(2n) {
            border-bottom: 1px solid #e2e6ea;
          }

          .summary-row:last-child .summary-cell:last-child {
            border-bottom: none;
          }

          .cost-center-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .cost-center-header>div:last-child {
            width: 100%;
            justify-content: space-between;
          }
        }

        @media (max-width: 576px) {
          .cost-center-card {
            min-height: auto;
            padding: 0.75rem;
          }

          .cost-center-card .cc-amount {
            font-size: 1rem;
          }

          .item-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .item-number-badge {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }
        }

        /* Status Pills */
        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Previous Level Badge */
        .previous-level-badge {
          background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
          border: 1px solid #f59e0b;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          color: #92400e;
          margin-bottom: 0.5rem;
          display: inline-flex;
          align-items: center;
        }
      </style>
