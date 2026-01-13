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

type RequisitionItem = {
  id: number
  description: string
  quantity: number
  rate: number
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
  fundDirection: FundDirection
  date: string
  requiredDate: string
  requestedBy: string
  handler: string
  remarks: string
  status: RequisitionStatus
  items: RequisitionItem[]
  approvals: ApprovalRecord[]
  currencySymbol?: string
}

const props = defineProps<{ id: number }>()
const router = useRouter()

const loading = ref(false)
const loadingAction = ref(false)
const errorMessage = ref('')
const requisition = ref<Requisition | null>(null)

const approvalLevels = [1, 2, 3]

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

const nextApprovalLevel = computed(() => {
  if (!requisition.value) return null
  const approvedCount = requisition.value.approvals.filter((a) => a.status === 'APPROVED').length
  const nextLevel = approvedCount + 1
  return nextLevel <= approvalLevels.length ? nextLevel : null
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
  return requisition.value.items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
})

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
          itemName: material.item?.name || '',
          unitName: material.unit_of_measurement?.name || '',
        })
      }
    }
  }
  return mapped
}

const mapRequisition = (req: any): Requisition => {
  return {
    id: req.id,
    code: req.code || req.reference || `REQ-${String(req.id).padStart(4, '0')}`,
    requisitionType:
      req.requisition_type?.name || req.requisition_type_name || `Type ${req.requisition_type_id || ''}`,
    fundDirection: req.fund_direction || 'WITHDRAW',
    date: req.date || req.created_at?.slice(0, 10) || '',
    requiredDate: req.required_date || '',
    requestedBy:
      userLabel(req.requested_by_user) ||
      userLabel(req.requested_by) ||
      userLabel(req.user) ||
      'Unknown',
    handler: userLabel(req.handler_user) || userLabel(req.handler) || 'Unknown',
    remarks: req.remarks || '',
    status: req.status || 'DRAFT',
    items: mapItems(req.items || []),
    approvals: (req.approvals || []).map(mapApproval),
    currencySymbol:
      req.items?.[0]?.currency?.symbol ||
      req.items?.[0]?.materials?.[0]?.currency?.symbol ||
      '',
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
        <div class="row mb-3">
          <div class="col-md-6">
            <table class="table table-sm table-borderless">
              <tr>
                <td class="text-muted">Type:</td>
                <td class="fw-semibold">{{ requisition.requisitionType }}</td>
              </tr>
              <tr>
                <td class="text-muted">Fund Direction:</td>
                <td>
                  <span class="badge" :class="requisition.fundDirection === 'WITHDRAW' ? 'bg-success' : 'bg-info'">
                    {{ requisition.fundDirection }}
                  </span>
                </td>
              </tr>
              <tr>
                <td class="text-muted">Date:</td>
                <td>{{ formatDisplayDate(requisition.date) }}</td>
              </tr>
              <tr>
                <td class="text-muted">Required Date:</td>
                <td>{{ formatDisplayDate(requisition.requiredDate) }}</td>
              </tr>
            </table>
          </div>
          <div class="col-md-6">
            <table class="table table-sm table-borderless">
              <tr>
                <td class="text-muted">Requested By:</td>
                <td>{{ requisition.requestedBy }}</td>
              </tr>
              <tr>
                <td class="text-muted">Handler:</td>
                <td>{{ requisition.handler }}</td>
              </tr>
              <tr>
                <td class="text-muted">Total Amount:</td>
                <td class="fw-bold text-primary">{{ formatMoney(totalAmount, requisition.currencySymbol) }}</td>
              </tr>
              <tr v-if="requisition.remarks">
                <td class="text-muted">Remarks:</td>
                <td>{{ requisition.remarks }}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="mb-4">
          <h6 class="border-bottom pb-2 mb-3">Items ({{ requisition.items.length }})</h6>
          <div class="table-responsive">
            <table class="table table-sm table-hover">
              <thead class="table-light">
                <tr>
                  <th>Description</th>
                  <th class="text-end">Qty</th>
                  <th class="text-end">Rate</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in requisition.items" :key="item.id">
                  <td>{{ item.itemName || item.description || '--' }}</td>
                  <td class="text-end">{{ item.quantity }}</td>
                  <td class="text-end">{{ formatMoney(item.rate, requisition.currencySymbol) }}</td>
                  <td class="text-end fw-semibold">{{ formatMoney(item.quantity * item.rate, requisition.currencySymbol) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h6 class="border-bottom pb-2 mb-3">Approval History</h6>
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
                  <strong>Level {{ approval.level }} - {{ approval.status }}</strong>
                  <span class="text-muted small">{{ formatDisplayDate(approval.date) }}</span>
                </div>
                <div class="text-muted small mb-1">
                  <i class="fa fa-user me-1"></i>{{ approval.handledBy }}
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
