<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { requisitionService } from '@/stores/bushman/requisitionService'

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

type RequisitionSource = {
  id: number
  source_type: SourceType
  payee: string
  source_account_id: number
  source_account?: Account
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

type RequisitionItem = {
  id: number
  currency_id: number
  currency?: Currency
  value_added_tax_id?: number
  discount_amount?: string
  discount_method?: string
  tax_method: TaxMethod
  remarks?: string
  materials: Material[]
  accounts: any[]
  dimensions: any[]
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
  is_closed: boolean
  is_printed: boolean
  remarks?: string
  created_at: string
  updated_at: string
  code?: string
  sources: RequisitionSource[]
  items: RequisitionItem[]
  approvals: ApprovalRecord[]
}

const props = defineProps<{ id: number }>()
const router = useRouter()

const loading = ref(false)
const loadingAction = ref(false)
const errorMessage = ref('')
const requisition = ref<Requisition | null>(null)

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

const totalAmount = computed(() => {
  if (!requisition.value) return 0
  let total = 0
  for (const item of requisition.value.items) {
    for (const material of item.materials || []) {
      total += Number(material.quantity || 0) * Number(material.rate || 0)
    }
  }
  return total
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
    is_closed: req.is_closed || false,
    is_printed: req.is_printed || false,
    remarks: req.remarks,
    created_at: req.created_at || '',
    updated_at: req.updated_at || '',
    code: req.code || req.reference || `REQ-${String(req.id).padStart(4, '0')}`,
    sources: req.sources || [],
    items: req.items || [],
    approvals: req.approvals || [],
  }
}

const fetchRequisition = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await requisitionService.get(props.id)
    const data = response?.data || response
    requisition.value = mapRequisition(data)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to load requisition.'
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
    errorMessage.value = error?.response?.data?.message || 'Failed to submit requisition.'
  } finally {
    loadingAction.value = false
  }
}

const approve = async () => {
  if (!requisition.value) return
  if (!['SUBMITTED', 'APPROVAL_PENDING'].includes(requisition.value.status)) return
  loadingAction.value = true
  try {
    await requisitionService.approve(requisition.value.id, {
      approved_by: 1,
      handled_by: 1,
      remarks: `Approved at level ${nextApprovalLevel.value || 1}.`,
    })
    await fetchRequisition()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'Failed to approve requisition.'
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
    errorMessage.value = error?.response?.data?.message || 'Failed to reject requisition.'
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
    errorMessage.value = error?.response?.data?.message || 'Failed to cancel requisition.'
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
    errorMessage.value = error?.response?.data?.message || 'Failed to close requisition.'
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
        <button class="btn btn-outline-primary" :disabled="!requisition || requisition.status !== 'DRAFT'" @click="goEdit">
          <i class="fa fa-edit me-1"></i>Edit
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
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
        <div class="row mb-4">
          <div class="col-md-6">
            <h6 class="text-muted border-bottom pb-2 mb-3">Basic Information</h6>
            <table class="table table-sm table-borderless">
              <tr>
                <td class="text-muted" style="width: 160px;">Type:</td>
                <td class="fw-semibold">{{ requisition.requisition_type?.name || '--' }}</td>
              </tr>
              <tr>
                <td class="text-muted">Type Code:</td>
                <td>{{ requisition.requisition_type?.code || '--' }}</td>
              </tr>
              <tr>
                <td class="text-muted">Fund Direction:</td>
                <td>
                  <span class="badge" :class="requisition.fund_direction === 'WITHDRAW' ? 'bg-success' : 'bg-info'">
                    {{ requisition.fund_direction }}
                  </span>
                </td>
              </tr>
              <tr>
                <td class="text-muted">Date:</td>
                <td>{{ formatDisplayDate(requisition.date) }}</td>
              </tr>
              <tr>
                <td class="text-muted">Required Date:</td>
                <td>{{ formatDisplayDate(requisition.required_date) }}</td>
              </tr>
              <tr>
                <td class="text-muted">Created:</td>
                <td>{{ formatDisplayDate(requisition.created_at) }}</td>
              </tr>
              <tr>
                <td class="text-muted">Last Updated:</td>
                <td>{{ formatDisplayDate(requisition.updated_at) }}</td>
              </tr>
            </table>
          </div>
          <div class="col-md-6">
            <h6 class="text-muted border-bottom pb-2 mb-3">People & Status</h6>
            <table class="table table-sm table-borderless">
              <tr>
                <td class="text-muted" style="width: 160px;">Created By:</td>
                <td>{{ userLabel(requisition.user) || '--' }}</td>
              </tr>
              <tr>
                <td class="text-muted">Requested By:</td>
                <td>{{ userLabel(requisition.requested_by_user) || '--' }}</td>
              </tr>
              <tr>
                <td class="text-muted">Handler:</td>
                <td>{{ userLabel(requisition.handler_user) || '--' }}</td>
              </tr>
              <tr>
                <td class="text-muted">Branch:</td>
                <td>{{ requisition.branch?.name || '--' }}</td>
              </tr>
              <tr>
                <td class="text-muted">Is Closed:</td>
                <td>
                  <span :class="requisition.is_closed ? 'badge bg-danger' : 'badge bg-success'">
                    {{ requisition.is_closed ? 'Yes' : 'No' }}
                  </span>
                </td>
              </tr>
              <tr>
                <td class="text-muted">Is Printed:</td>
                <td>
                  <span :class="requisition.is_printed ? 'badge bg-info' : 'badge bg-secondary'">
                    {{ requisition.is_printed ? 'Yes' : 'No' }}
                  </span>
                </td>
              </tr>
              <tr v-if="requisition.remarks">
                <td class="text-muted">Remarks:</td>
                <td>{{ requisition.remarks }}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Sources Section -->
        <div v-if="requisition.sources && requisition.sources.length > 0" class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">Sources ({{ requisition.sources.length }})</h6>
          <div class="table-responsive">
            <table class="table table-sm table-hover">
              <thead class="table-light">
                <tr>
                  <th>Type</th>
                  <th>Payee</th>
                  <th>Account</th>
                  <th>Payment Mode</th>
                  <th>Currency</th>
                  <th class="text-end">Exchange Rate</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="source in requisition.sources" :key="source.id">
                  <td>
                    <span class="badge bg-primary">{{ source.source_type }}</span>
                  </td>
                  <td>{{ source.payee }}</td>
                  <td>{{ source.source_account?.code }} - {{ source.source_account?.name }}</td>
                  <td>
                    <span class="badge bg-secondary">{{ source.mode_of_payment }}</span>
                  </td>
                  <td>{{ source.currency?.symbol || source.currency?.name || '--' }}</td>
                  <td class="text-end">{{ source.exchange_rate }}</td>
                  <td>{{ source.description || '--' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Items Section -->
        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">
            Items ({{ requisition.items.length }})
            <span class="float-end fw-bold text-primary">
              Total: {{ formatMoney(totalAmount, requisition.items[0]?.currency?.symbol || '') }}
            </span>
          </h6>
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
            
            <!-- Materials -->
            <div v-if="item.materials && item.materials.length > 0" class="table-responsive">
              <table class="table table-sm table-bordered">
                <thead class="table-secondary">
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th class="text-end">Qty</th>
                    <th class="text-end">Rate</th>
                    <th class="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="material in item.materials" :key="material.id">
                    <td>{{ material.item?.item_code || '--' }}</td>
                    <td>{{ material.item?.name || '--' }}</td>
                    <td>{{ material.item?.description || material.description || '--' }}</td>
                    <td>{{ material.unit_of_measurement?.code || material.unit_of_measurement?.name || '--' }}</td>
                    <td class="text-end">{{ material.quantity }}</td>
                    <td class="text-end">{{ formatMoney(Number(material.rate), material.currency?.symbol || '') }}</td>
                    <td class="text-end fw-semibold">
                      {{ formatMoney(Number(material.quantity) * Number(material.rate), material.currency?.symbol || '') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Accounts (if any) -->
            <div v-if="item.accounts && item.accounts.length > 0" class="mt-2">
              <strong>Accounts:</strong>
              <div class="ms-3">
                <div v-for="account in item.accounts" :key="account.id" class="text-muted small">
                  {{ account.code }} - {{ account.name }}
                </div>
              </div>
            </div>

            <!-- Dimensions (if any) -->
            <div v-if="item.dimensions && item.dimensions.length > 0" class="mt-2">
              <strong>Dimensions:</strong>
              <div class="ms-3">
                <div v-for="dimension in item.dimensions" :key="dimension.id" class="text-muted small">
                  {{ dimension.name }}: {{ dimension.value }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Approval History -->
        <div>
          <h6 class="border-bottom pb-2 mb-3">Approval History ({{ requisition.approvals.length }})</h6>
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
</style>
