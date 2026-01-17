<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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

type FundDirection = 'WITHDRAW' | 'EXPENSE'
type SourceType = 'CASH' | 'STORE' | 'VENDOR' | 'SERVICE_PROVIDER'
type ModeOfPayment = 'CASH' | 'TT' | 'CREDIT'
type TaxMethod = 'EXCLUSIVE' | 'INCLUSIVE' | 'EXEMPT'

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
}

const props = defineProps<{ id: number }>()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const loadingAction = ref(false)
const requisition = ref<Requisition | null>(null)
const activeTab = ref<'response' | 'approval'>('response')

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
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

const totalAmount = computed(() => {
  if (!requisition.value) return 0
  let total = 0
  for (const item of requisition.value.items) {
    for (const material of item.materials || []) {
      total += Number(material.quantity || 0) * Number(material.rate || 0)
    }
    for (const account of item.accounts || []) {
      total += Number(account.amount || 0)
    }
  }
  return total
})

const dimensionGroups = computed(() => {
  const groups = requisition.value?.dimensions_grouped
  return Array.isArray(groups) ? groups : []
})

const buildItemLines = (item: RequisitionItem) => {
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

  for (const material of item.materials || []) {
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

  for (const account of item.accounts || []) {
    lines.push({
      type: 'Account',
      name: account.account?.name ,
      code: account.account?.code ,
      unit: 1,
      quantity: 1,
      rate: Number(account.amount || 0),
      amount: Number(account.amount || 0),
      currencySymbol: account.currency?.symbol || item.currency?.symbol || '',
    })
  }

  return lines
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
    const lines = buildItemLines(item)
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
    fund_direction: req.fund_direction || 'EXPENSE',
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

const fetchRequisition = async () => {
  loading.value = true
  try {
    const response = await requisitionService.get(props.id)
    const data = response?.data || response
    requisition.value = mapRequisition(data)
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
    await requisitionService.approve(requisition.value.id, {
      remarks: `Approved at level ${nextApprovalLevel.value || 1}.`,
    })
    await fetchRequisition()
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

const reject = async () => {
  if (!requisition.value) return
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return
  loadingAction.value = true
  try {
    await requisitionService.reject(requisition.value.id, { remarks: 'Rejected.' })
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
const goEdit = () => router.push({ path: '/sales/requisitions', query: { editId: String(props.id) } })

onMounted(fetchRequisition)
</script>

<template>
  <div class="container-fluid">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <ul class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#">Sales</a></li>
          <li class="breadcrumb-item"><a href="#/sales/requisitions" @click.prevent="goBack">Requisitions</a></li>
          <li class="breadcrumb-item active">Details</li>
        </ul>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="goBack">
          <i class="fa fa-arrow-left me-1"></i>Back
        </button>
        <button class="btn btn-outline-primary" :disabled="!canEditRequisition" @click="goEdit">
          <i class="fa fa-edit me-1"></i>Edit
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="requisition" class="card">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <div>
          <h4 class="mb-1">{{ requisition.code }}</h4>
          <span :class="statusBadgeClass(requisition.status)">{{ requisition.status }}</span>
          <span v-if="nextApprovalLevel" class="ms-2 text-muted">Next approval: Level {{ nextApprovalLevel }}</span>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-sm btn-info" :disabled="requisition.status !== 'DRAFT' || loadingAction" @click="submit">
            <i class="fa fa-paper-plane me-1"></i>Submit
          </button>
          <button
            class="btn btn-sm btn-success"
            :disabled="!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) || loadingAction"
            @click="approve"
          >
            <i class="fa fa-check me-1"></i>Approve
          </button>
          <button
            class="btn btn-sm btn-danger"
            :disabled="!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) || loadingAction"
            @click="reject"
          >
            <i class="fa fa-times me-1"></i>Reject
          </button>
          <button
            class="btn btn-sm btn-dark"
            :disabled="!['DRAFT', 'SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.status) || loadingAction"
            @click="cancel"
          >
            <i class="fa fa-ban me-1"></i>Cancel
          </button>
          <button class="btn btn-sm btn-primary" :disabled="requisition.status !== 'APPROVED' || loadingAction" @click="close">
            <i class="fa fa-check-circle me-1"></i>Close
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="approval-tabs mb-4">
          <button
            class="approval-tab"
            :class="{ active: activeTab === 'response' }"
            type="button"
            @click="activeTab = 'response'"
          >
            My Response
          </button>
          <button
            class="approval-tab"
            :class="{ active: activeTab === 'approval' }"
            type="button"
            @click="activeTab = 'approval'"
          >
            Chain of Approval
          </button>
        </div>

        <div v-show="activeTab === 'response'">
        <div class="requisition-summary mb-4">
          <div class="summary-row">
            <div class="summary-cell label">No.</div>
            <div class="summary-cell value">{{ requisition.code }}</div>
            <div class="summary-cell label">Initiator</div>
            <div class="summary-cell value">{{ userLabel(requisition.requested_by_user || requisition.user) || '--' }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-cell label">Requested On</div>
            <div class="summary-cell value">{{ formatDisplayDate(requisition.date) }}</div>
            <div class="summary-cell label">Required On</div>
            <div class="summary-cell value">{{ formatDisplayDate(requisition.required_date) }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-cell label">Uses</div>
            <div class="summary-cell value">{{ requisition.requisition_type?.name || '--' }}</div>
            <div class="summary-cell label">Fund Direction</div>
            <div class="summary-cell value">
              <span class="badge" :class="requisition.fund_direction === 'WITHDRAW' ? 'bg-success' : 'bg-info'">
                {{ requisition.fund_direction }}
              </span>
            </div>
          </div>
          <div class="summary-row">
            <div class="summary-cell label">Status</div>
            <div class="summary-cell value">
              <span :class="statusBadgeClass(requisition.status)">
                {{ requisition.status_label || requisition.status }}
              </span>
            </div>
            <div class="summary-cell label">Initiator Remark</div>
            <div class="summary-cell value">{{ requisition.remarks || '--' }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-cell label">Source</div>
            <div class="summary-cell value">{{ requisition.sources?.[0]?.source_type || '--' }}</div>
            <div class="summary-cell label">Payee</div>
            <div class="summary-cell value">{{ sourceEntityLabel(requisition.sources?.[0]) }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-cell label">Source Name</div>
            <div class="summary-cell value">{{ sourceNameLabel(requisition.sources?.[0]) }}</div>
            <div class="summary-cell label">Payment Mode</div>
            <div class="summary-cell value">{{ requisition.sources?.[0]?.mode_of_payment || '--' }}</div>
          </div>
        </div>

        <!-- Items Section -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">
            Request Lines ({{ requisition.items.length }})
            <span class="float-end fw-bold text-primary">
              Total: {{ formatMoney(totalAmount, requisition.items[0]?.currency?.symbol || '') }}
            </span>
          </h6>

          <!-- Cost Center Grouped View -->
          <template v-if="hasCostCenters">

            <!-- Expanded Cost Center Details -->
            <div v-for="group in itemsByCostCenter" :key="`details-${group.key}`" class="mb-4">
              <div
                class="cost-center-header"
                :class="{ 'unassigned': group.key === 'UNASSIGNED', 'collapsed': !isCostCenterExpanded(group.key) }"
                @click="toggleCostCenter(group.key)"
              >
                <div class="d-flex align-items-center gap-2">
                  <i class="fa fa-folder-open text-primary" v-if="isCostCenterExpanded(group.key)"></i>
                  <i class="fa fa-folder text-secondary" v-else></i>
                  <span class="cc-type-badge">{{ group.dimensionTypeName }}</span>
                  <strong>{{ group.dimensionValueCode ? `${group.dimensionValueCode} - ` : '' }}{{ group.dimensionValueName }}</strong>
                </div>
                <div class="d-flex align-items-center gap-3">
                  <span class="cc-subtotal">{{ formatMoney(group.subtotal, group.currencySymbol) }}</span>
                  <span class="cc-item-count">{{ group.items.length }} item(s)</span>
                  <i :class="isCostCenterExpanded(group.key) ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"></i>
                </div>
              </div>

              <div v-show="isCostCenterExpanded(group.key)" class="cost-center-items">
                <div v-for="({ item, itemIndex, lines, dimensionAmount, dimensionPercentage }, idx) in group.items" :key="`${group.key}-${item.id}`" class="item-block">
                  <div class="table-responsive">
                    <table class="table table-sm table-bordered mb-0">
                      <thead class="table-light">
                        <tr>
                          <th style="width: 8%">Type</th>
                          <th>Item/Account</th>
                          <th style="width: 10%">Unit</th>
                          <th class="text-end" style="width: 10%">Qty</th>
                          <th class="text-end" style="width: 12%">Rate</th>
                          <th class="text-end" style="width: 12%">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(line, lineIndex) in lines" :key="`${item.id}-${lineIndex}`">
                          <td>
                            <span class="badge" :class="line.type === 'Item' ? 'bg-primary' : 'bg-secondary'">
                              {{ line.type }}
                            </span>
                          </td>
                          <td>
                            <div class="fw-medium">{{ line.name }}</div>
                            <small v-if="line.code" class="text-muted">{{ line.code }}</small>
                          </td>
                          <td>{{ line.unit || '--' }}</td>
                          <td class="text-end">{{ line.quantity ?? '--' }}</td>
                          <td class="text-end">{{ line.rate !== undefined ? formatMoney(line.rate, line.currencySymbol) : '--' }}</td>
                          <td class="text-end fw-semibold">{{ formatMoney(line.amount, line.currencySymbol) }}</td>
                        </tr>
                        <tr v-if="lines.length === 0">
                          <td colspan="6" class="text-center text-muted py-3">No item or account lines.</td>
                        </tr>
                      </tbody>
                      <tfoot v-if="lines.length > 0" class="table-light">
                        <tr>
                          <td colspan="5" class="text-end fw-semibold">Item Subtotal:</td>
                          <td class="text-end fw-bold">
                            {{ formatMoney(lines.reduce((sum, l) => sum + l.amount, 0), lines[0]?.currencySymbol || '') }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Flat View (No Cost Centers) -->
          <template v-else>
            <div class="alert alert-warning mb-3">ℹ Flat View: No cost centers assigned</div>
            <div v-for="(item, itemIndex) in requisition.items" :key="item.id" class="mb-4">
              <div class="bg-light p-3 rounded mb-2">
                <div class="row">
                  <div class="col-md-6">
                    <small class="text-muted">Item #{{ itemIndex + 1 }}</small>
                    <div><strong>Currency:</strong> {{ item.currency?.symbol || item.currency?.name || '--' }}</div>
                    <div><strong>Tax Method:</strong> <span class="badge bg-info">{{ item.tax_method }}</span></div>
                  </div>
                  <div class="col-md-6">
                    <div v-if="item.discount_amount">
                      <strong>Discount:</strong> {{ item.discount_amount }}
                      <span v-if="item.discount_method" class="badge bg-warning text-dark">{{ item.discount_method }}</span>
                    </div>
                    <div v-if="item.remarks"><strong>Remarks:</strong> {{ item.remarks }}</div>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-sm table-bordered">
                  <thead class="table-secondary">
                    <tr>
                      <th style="width: 10%">Type</th>
                      <th>Item/Account</th>
                      <th style="width: 12%">Unit</th>
                      <th class="text-end" style="width: 10%">Qty</th>
                      <th class="text-end" style="width: 12%">Rate</th>
                      <th class="text-end" style="width: 12%">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, lineIndex) in buildItemLines(item)" :key="`${item.id}-${lineIndex}`">
                      <td><span class="badge bg-secondary">{{ line.type }}</span></td>
                      <td>
                        <div>{{ line.code ? `${line.code} - ` : '' }}{{ line.name }}</div>
                      </td>
                      <td>{{ line.unit || '--' }}</td>
                      <td class="text-end">{{ line.quantity ?? '--' }}</td>
                      <td class="text-end">{{ line.rate !== undefined ? formatMoney(line.rate, line.currencySymbol) : '--' }}</td>
                      <td class="text-end fw-semibold">{{ formatMoney(line.amount, line.currencySymbol) }}</td>
                    </tr>
                    <tr v-if="buildItemLines(item).length === 0">
                      <td colspan="6" class="text-center text-muted">No item or account lines.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
        </div>

        <!-- Approval History -->
        <div v-show="activeTab === 'approval'">
          <h6 class="border-bottom pb-2 mb-3">Chain of Approval ({{ requisition.approvals.length }})</h6>
          <div v-if="requisition.approvals.length === 0" class="text-muted fst-italic">
            No approvals yet.
          </div>
          <div v-else class="timeline">
            <div v-for="approval in requisition.approvals" :key="approval.id" class="timeline-item">
              <div class="timeline-badge" :class="approval.status === 'APPROVED' ? 'bg-success' : 'bg-danger'">
                <i :class="approval.status === 'APPROVED' ? 'fa fa-check' : 'fa fa-times'"></i>
              </div>
              <div class="timeline-content">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <strong>Level {{ approval.approval_chain_level?.level_id || 1 }} - {{ approval.status }}</strong>
                    <span v-if="approval.approval_chain_level?.role" class="badge bg-secondary ms-2">
                      {{ approval.approval_chain_level.role.name }}
                    </span>
                  </div>
                  <span class="text-muted small">{{ formatDisplayDate(approval.date) }}</span>
                </div>
                <div class="text-muted small mb-1">
                  <i class="fa fa-user me-1"></i>
                  <strong>Approved by:</strong> {{ userLabel(approval.approved_by_user) || approval.approved_by || '--' }}
                </div>
                <div v-if="approval.handled_by_user" class="text-muted small mb-1">
                  <i class="fa fa-user-check me-1"></i>
                  <strong>Handled by:</strong> {{ userLabel(approval.handled_by_user) || approval.handled_by || '--' }}
                </div>
                <p class="mb-0 small">{{ approval.remarks }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
}

.approval-tab.active {
  background: #ffffff;
  color: #2f3a44;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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

  .cost-center-header > div:last-child {
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
}
</style>
