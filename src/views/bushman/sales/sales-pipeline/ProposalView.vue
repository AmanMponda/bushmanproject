<template>
  <div class="proposal-view">
    <!-- TABS -->
    <div class="card-header p-0 border-bottom bg-white mb-0">
      <ul class="nav nav-tabs w-100 overflow-auto flex-nowrap mt-2">
        <li v-for="tab in tabs" :key="tab.key" class="nav-item flex-fill text-center">
          <a
            :href="'#' + tab.key"
            class="nav-link"
            :class="{ active: activeTab === tab.key }"
            data-bs-toggle="tab"
            @click.prevent="onTabClick(tab)"
          >
            <i :class="tab.icon"></i> {{ tab.label }}
          </a>
        </li>
      </ul>
    </div>

    <!-- TAB CONTENT -->
    <div class="tab-content p-4">
      <!-- Overview Tab -->
      <div id="overview" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }">
        <!-- Stage Indicator -->
        <div class="mb-4">
          <StageIndicator v-if="proposal.status" :current-stage="proposal.status" :installments="paymentInstallments" />
        </div>

        <!-- Key Information Cards -->
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="card border-primary">
              <div class="card-body text-center">
                <i class="fa fa-dollar-sign fa-2x text-primary mb-2"></i>
                <div class="h4 mb-0">{{ formatCurrency(proposal.pricing?.total_amount || 0) }}</div>
                <small class="text-muted">Total Amount</small>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-success">
              <div class="card-body text-center">
                <i class="fa fa-calendar fa-2x text-success mb-2"></i>
                <div class="h4 mb-0">
                  {{ proposal.hunting_trip?.no_of_days || proposal.hunting_trip?.duration || 'N/A' }}
                </div>
                <small class="text-muted">Days Duration</small>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-warning">
              <div class="card-body text-center">
                <i class="fa fa-users fa-2x text-warning mb-2"></i>
                <div class="h6 mb-0">{{ proposal.trip_details?.no_of_hunters || 0 }} Hunters</div>
                <small class="text-muted">Trip Details</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Sales Agent & Client Info -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="card border-primary">
              <div class="card-header bg-white">
                <h6 class="mb-0">
                  <i class="fa fa-user-tie me-2 text-primary"></i>
                  Sales Agent
                </h6>
              </div>
              <div class="card-body">
                <div class="mb-2"><strong>Name:</strong> {{ proposal.sales_agent?.name || 'N/A' }}</div>
                <div class="mb-0"><strong>Email:</strong> {{ proposal.sales_agent?.email || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card border-success">
              <div class="card-header bg-white">
                <h6 class="mb-0">
                  <i class="fa fa-user me-2 text-success"></i>
                  Client Information
                </h6>
              </div>
              <div class="card-body">
                <div class="mb-2"><strong>Name:</strong> {{ proposal.client?.full_name || 'N/A' }}</div>
                <div v-if="proposal.client?.nick_name" class="mb-2">
                  <strong>Nick Name:</strong> {{ proposal.client.nick_name }}
                </div>
                <div class="mb-2"><strong>Country:</strong> {{ proposal.client?.country || 'N/A' }}</div>
                <div class="mb-2"><strong>Nationality:</strong> {{ proposal.client?.nationality || 'N/A' }}</div>
                <div class="mb-2"><strong>Address:</strong> {{ proposal.client?.address || 'N/A' }}</div>
                <div class="mb-2"><strong>Home Tel:</strong> {{ proposal.client?.home_tel || 'N/A' }}</div>
                <div v-if="proposal.client?.work_tel" class="mb-2">
                  <strong>Work Tel:</strong> {{ proposal.client.work_tel }}
                </div>
                <div v-if="proposal.client?.cell" class="mb-2"><strong>Cell:</strong> {{ proposal.client.cell }}</div>
                <div class="mb-0"><strong>Email:</strong> {{ proposal.client?.email || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Information -->
        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title">Important Information</h6>
            <p class="text-muted small mb-0">
              All hunts confirmation is subject to quota availability. Other safari packages are available on request
              and can be customized depending on client requirements.
            </p>
          </div>
        </div>
      </div>

      <!-- Details Tab -->
      <div id="details" class="tab-pane fade" :class="{ 'show active': activeTab === 'details' }">
        <!-- Confirmation Information -->
        <div class="card mb-4 border-primary">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-file-contract me-2 text-primary"></i>
              Confirmation Information
            </h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4 mb-3">
                <strong>Confirmation Date:</strong>
                <div>{{ proposal.confirmation_date_formatted || formatDate(proposal.confirmation_date) || 'N/A' }}</div>
              </div>
              <div class="col-md-4 mb-3">
                <strong>Proposal ID:</strong>
                <div class="font-mono">#{{ proposal.id }}</div>
              </div>
              <div class="col-md-4 mb-3">
                <strong>Status:</strong>
                <div>
                  <span :class="'badge bg-' + getStatusColor(proposal.status)">
                    {{ formatStatus(proposal.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hunting Trip Details -->
        <div class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-map-marker-alt me-2 text-primary"></i>
              Hunting Trip Details
            </h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <strong>Type of Safari:</strong>
                <div>{{ proposal.hunting_trip?.type || 'N/A' }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Hunting Area:</strong>
                <div>
                  <template
                    v-if="proposal.hunting_trip?.hunting_areas && proposal.hunting_trip.hunting_areas.length > 0"
                  >
                    <div v-for="area in proposal.hunting_trip.hunting_areas" :key="area.id" class="mb-1">
                      {{ area.name }}
                      <small v-if="area.location" class="text-muted">({{ area.location }})</small>
                    </div>
                  </template>
                  <span v-else>{{ proposal.hunting_trip?.hunting_area || 'N/A' }}</span>
                </div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Outfitter:</strong>
                <div>{{ proposal.hunting_trip?.outfitter || 'Bushman Safari Trackers Limited' }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Number of Days:</strong>
                <div>{{ proposal.hunting_trip?.no_of_days || 'N/A' }}</div>
              </div>
              <div class="col-md-6 mb-3">
                <strong>Dates:</strong>
                <div>
                  {{
                    proposal.hunting_trip?.dates ||
                    formatDate(proposal.hunting_trip?.start_date) +
                      ' - ' +
                      formatDate(proposal.hunting_trip?.end_date) ||
                    'N/A'
                  }}
                </div>
                <small v-if="proposal.hunting_trip?.start_date && proposal.hunting_trip?.end_date" class="text-muted">
                  From {{ formatDate(proposal.hunting_trip.start_date) }} to
                  {{ formatDate(proposal.hunting_trip.end_date) }}
                </small>
              </div>
            </div>
            <div
              v-if="proposal.hunting_trip?.hunting_areas && proposal.hunting_trip.hunting_areas.length > 1"
              class="mt-3"
            >
              <strong>All Hunting Areas:</strong>
              <div class="mt-2">
                <span
                  v-for="area in proposal.hunting_trip.hunting_areas"
                  :key="area.id"
                  class="badge bg-primary me-2 mb-2"
                >
                  {{ area.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Details of Trip -->
        <div class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-users me-2 text-primary"></i>
              Details of Trip
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-3">
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <div class="h4 mb-0 text-primary">
                      {{ proposal.trip_details?.no_of_hunters || proposal.companion_observer?.no_of_hunters || 0 }}
                    </div>
                    <div class="text-muted">Hunters</div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <div class="h4 mb-0 text-success">
                      {{ proposal.trip_details?.no_of_observers || proposal.companion_observer?.no_of_observers || 0 }}
                    </div>
                    <div class="text-muted">Observers</div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <div class="h4 mb-0 text-warning">
                      {{
                        proposal.trip_details?.no_of_companions || proposal.companion_observer?.no_of_companions || 0
                      }}
                    </div>
                    <div class="text-muted">Companions</div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <div class="h4 mb-0 text-info">
                      {{
                        (proposal.trip_details?.no_of_hunters || 0) +
                        (proposal.trip_details?.no_of_observers || 0) +
                        (proposal.trip_details?.no_of_companions || 0)
                      }}
                    </div>
                    <div class="text-muted">Total People</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="proposal.trip_details?.special_requests" class="row mt-3">
              <div class="col-12">
                <strong>Special Requests:</strong>
                <div class="mt-2 p-3 bg-light rounded">{{ proposal.trip_details.special_requests }}</div>
              </div>
            </div>
            <div v-if="proposal.trip_details?.prev_experience" class="row mt-3">
              <div class="col-12">
                <strong>Previous Experience:</strong>
                <div class="mt-2 p-3 bg-light rounded">{{ proposal.trip_details.prev_experience }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sales Inquiry Reference -->
        <div class="card mb-4 bg-light">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-link me-2 text-info"></i>
              Linked Sales Inquiry
            </h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <strong>Inquiry ID:</strong>
                <div class="font-mono">#{{ proposal.sales_inquiry?.id || 'N/A' }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Inquiry Code:</strong>
                <div class="font-mono">{{ proposal.sales_inquiry?.code || 'N/A' }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Created Date:</strong>
                <div>
                  {{
                    formatDate(proposal.sales_inquiry?.created_date) || proposal.sales_inquiry?.created_date || 'N/A'
                  }}
                </div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Season:</strong>
                <div>{{ proposal.sales_inquiry?.season || 'N/A' }}</div>
              </div>
              <div class="col-md-3 mb-3">
                <strong>Hunting License:</strong>
                <div>{{ proposal.hunting_license || 'Not provided' }}</div>
              </div>
              <div v-if="proposal.regulatory_package" class="col-md-3 mb-3">
                <strong>Regulatory Package:</strong>
                <div>{{ proposal.regulatory_package.name || proposal.regulatory_package.code || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="proposal.remarks" class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-sticky-note me-2 text-primary"></i>
              Remarks
            </h6>
          </div>
          <div class="card-body">
            <p class="mb-0">{{ proposal.remarks }}</p>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="card mb-4">
          <div class="card-header bg-white">
            <h6 class="mb-0">
              <i class="fa fa-info-circle me-2 text-primary"></i>
              Additional Information
            </h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <strong>Created Date:</strong>
                <div>{{ formatDate(proposal.created_date) || proposal.created_date || 'N/A' }}</div>
              </div>
              <div class="col-md-6 mb-3">
                <strong>Last Updated:</strong>
                <div>{{ formatDate(proposal.updated_date) || proposal.updated_date || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Species Tab -->
      <div id="species" class="tab-pane fade" :class="{ 'show active': activeTab === 'species' }">
        <div class="card">
          <div class="card-body">
            <div v-if="proposal.hunt_combination && proposal.hunt_combination.length > 0">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Species</th>
                      <th>Scientific Name</th>
                      <th class="text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="species in proposal.hunt_combination" :key="species.id">
                      <td class="fw-semibold">{{ species.species_name || 'N/A' }}</td>
                      <td class="text-muted fst-italic">{{ species.scientific_name || 'N/A' }}</td>
                      <td class="text-center">
                        <span :class="species.quantity > 0 ? 'badge bg-success' : 'badge bg-danger'">
                          {{ species.quantity || 0 }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-center py-5">
              <i class="fa fa-info-circle fa-3x text-muted mb-3"></i>
              <p class="text-muted">No species available for this proposal</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payments Tab -->
      <div id="payments" class="tab-pane fade" :class="{ 'show active': activeTab === 'payments' }">
        <PaymentTable
          :installments="paymentInstallments"
          :summary="paymentSummary"
          :total-amount="proposal.pricing?.total_amount || 0"
          :loading="loadingPayments"
          :allow-unpay="true"
          @record-payment="openPaymentModal"
          @unpay="handleUnpay"
        />
      </div>
    </div>

    <!-- Payment Modal -->
    <PaymentModal
      v-model="showPaymentModal"
      :installment="selectedInstallment"
      :loading="savingPayment"
      @submit="handlePaymentSubmit"
    />

    <!-- Status Change Modal -->
    <div v-if="showStatusModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Change Proposal Status</h5>
            <button type="button" class="btn-close" @click="showStatusModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Select New Status</label>
              <select v-model="newStatus" class="form-select">
                <option :value="null" disabled>Select status...</option>
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.text }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showStatusModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="changeStatus" :disabled="!newStatus">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/bushman/settings-store.ts'
import { useProposalStore } from '@/stores/bushman/proposal-store.ts'
import StageIndicator from './StageIndicator.vue'
import PaymentTable from './PaymentTable.vue'
import PaymentModal from './PaymentModal.vue'
import type { Installment } from './PaymentTable.vue'

const props = defineProps<{
  proposal: any
}>()

const emit = defineEmits<{
  edit: []
  statusChange: [data: { id: any; status: string }]
  paymentRecorded: [data: any]
}>()

// Stores
const settingsStore = useSettingsStore()
const proposalStore = useProposalStore()

// Refs
const activeTab = ref('overview')
const showStatusModal = ref(false)
const showPaymentModal = ref(false)
const selectedInstallment = ref<Installment | null>(null)
const newStatus = ref<string | null>(null)
const loadingPayments = ref(false)
const savingPayment = ref(false)

const statusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'provision_sales', text: 'Provisional Sale' },
  { value: 'confirmed', text: 'Confirmed' },
  { value: 'declined', text: 'Declined' },
  { value: 'cancelled', text: 'Cancelled' },
  { value: 'completed', text: 'Completed' },
]

// Computed
const logoUrl = computed(() => settingsStore.logo || null)

const canBeCancelled = computed(() => {
  const status = props.proposal.status
  return status === 'pending' || status === 'provision_sales' || status === 'confirmed'
})

const tabs = computed(() => {
  const tabList = [
    {
      key: 'overview',
      label: 'Overview',
      icon: 'fa fa-info-circle',
    },
    {
      key: 'details',
      label: 'Details',
      icon: 'fa fa-file-invoice',
    },
  ]

  if (props.proposal.hunt_combination && props.proposal.hunt_combination.length > 0) {
    tabList.push({
      key: 'species',
      label: `Species (${props.proposal.hunt_combination.length})`,
      icon: 'fa fa-paw',
    })
  }

  if (paymentInstallments.value && paymentInstallments.value.length > 0) {
    tabList.push({
      key: 'payments',
      label: `Payments (${paymentInstallments.value.length})`,
      icon: 'fa fa-credit-card',
    })
  }

  return tabList
})

const paymentInstallments = computed((): Installment[] => {
  if (proposalStore.paymentStatus?.installments) {
    return proposalStore.paymentStatus.installments as unknown as Installment[]
  }
  return (props.proposal.pricing?.installments || []).map(
    (inst: any): Installment => ({
      id: inst.id,
      narration: inst.narration,
      amount_due: inst.amount_due,
      installment_type: inst.installment_type,
      triggers_stage: inst.triggers_stage ?? null,
      is_paid: inst.is_paid || false,
      payment_status: inst.payment_status,
      paid_at: inst.paid_at ?? null,
      amount_paid: inst.amount_paid ?? null,
      remaining_balance: inst.remaining_balance ?? null,
      payment_reference: inst.payment_reference ?? null,
      paid_by: inst.paid_by ?? null,
      payments: inst.payments?.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_reference: p.payment_reference ?? undefined,
        payment_method: p.payment_method,
        paid_at: p.paid_at,
      })),
    }),
  ) as Installment[]
})

const paymentSummary = computed(() => {
  if (proposalStore.paymentStatus?.summary) {
    return proposalStore.paymentStatus.summary
  }
  const installments = paymentInstallments.value
  const total_due = installments.reduce((sum: number, i: Installment) => sum + (i.amount_due || 0), 0)
  const total_paid = installments.reduce(
    (sum: number, i: Installment) => sum + (i.is_paid ? i.amount_paid || i.amount_due : 0),
    0,
  )
  const paid_count = installments.filter((i: Installment) => i.is_paid).length
  return {
    total_due,
    total_paid,
    total_unpaid: total_due - total_paid,
    paid_count,
    unpaid_count: installments.length - paid_count,
  }
})

// Watchers
watch(() => props.proposal.id, () => {
  loadPaymentStatus()
})

// Lifecycle
onMounted(() => {
  loadPaymentStatus()
})

// Methods
const onTabClick = (tab: any) => {
  activeTab.value = tab.key
  if (tab.action) {
    tab.action()
  }
}

const loadPaymentStatus = async () => {
  if (!props.proposal?.id) return
  loadingPayments.value = true
  try {
    await proposalStore.fetchPayments(props.proposal.id)
  } catch (error) {
    console.error('Error loading payment status:', error)
  } finally {
    loadingPayments.value = false
  }
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const formatCurrency = (amount: number | undefined): string => {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'warning',
    provision_sales: 'info',
    confirmed: 'success',
    declined: 'danger',
    cancelled: 'secondary',
    completed: 'primary',
  }
  return colors[status] || 'secondary'
}

const formatStatus = (status: string): string => {
  if (!status) return 'N/A'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const changeToStage = (stage: string) => {
  emit('statusChange', {
    id: props.proposal.id,
    status: stage,
  })
}

const changeStatus = () => {
  if (newStatus.value) {
    emit('statusChange', {
      id: props.proposal.id,
      status: newStatus.value,
    })
    showStatusModal.value = false
    newStatus.value = null
  }
}

const openPaymentModal = (installment: Installment) => {
  selectedInstallment.value = installment
  showPaymentModal.value = true
}

const handlePaymentSubmit = async (payload: {
  installment_id: number
  amount_paid: number
  payment_reference?: string
  paid_at?: string
}) => {
  savingPayment.value = true
  try {
    const result = await proposalStore.recordPayment(payload.installment_id, {
      amount_paid: payload.amount_paid,
      payment_reference: payload.payment_reference,
      paid_at: payload.paid_at,
    })

    showPaymentModal.value = false
    selectedInstallment.value = null

    let message = 'Payment recorded successfully'
    if (result.stage_changed) {
      message = result.message || `Payment recorded. Stage updated to ${formatStatus(result.new_stage || '')}`
    } else if (result.data?.payment_status === 'partial') {
      const remaining = formatCurrency(result.data.remaining_balance)
      message = `Partial payment recorded. Remaining balance: ${remaining}`
    }

    // Show toast - you might want to use a toast library or component here
    console.log('Toast:', message)

    emit('paymentRecorded', result)
    await loadPaymentStatus()
  } catch (error: any) {
    console.error('Payment error:', error)
    // Show error toast
    const errorMessage = error.response?.data?.message || 'Failed to record payment'
    console.error('Error toast:', errorMessage)
  } finally {
    savingPayment.value = false
  }
}

const handleUnpay = async (installment: Installment) => {
  if (!confirm(`Are you sure you want to reverse the payment for "${installment.narration}"?`)) {
    return
  }

  savingPayment.value = true
  try {
    await proposalStore.unpayInstallment(installment.id)

    // Show success toast
    console.log('Toast: Payment reversed successfully')

    await loadPaymentStatus()
  } catch (error: any) {
    console.error('Unpay error:', error)
    // Show error toast
    const errorMessage = error.response?.data?.message || 'Failed to reverse payment'
    console.error('Error toast:', errorMessage)
  } finally {
    savingPayment.value = false
  }
}
</script>

<style scoped>
.proposal-view {
  max-width: 100%;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
  color: #495057;
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  font-weight: 600;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.table tbody tr {
  transition: background-color 0.2s ease;
}

.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.card {
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modal {
  backdrop-filter: blur(2px);
}
</style>