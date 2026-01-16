<template>
  <div class="order-details">
    <!-- Header Section with Tabs and Content All in One Card -->
    <div class="header-card mb-4" v-if="order">
      <div class="p-4">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 class="mb-2" style="font-size: 24px; font-weight: 700; color: #0f172a;">
              {{ order.order_number || 'Order' }}
            </h2>
          </div>
          <!-- Quick Actions on the Right -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
            <button @click="downloadOrderPdf" :disabled="downloadingPdf" class="btn btn-outline-primary btn-sm">
              <span v-if="downloadingPdf" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-file-pdf me-1"></i> 
              {{ downloadingPdf ? 'Downloading...' : 'Download PDF' }}
            </button>
            <button v-if="order.status !== 'APPROVED'" @click="editOrder" class="btn btn-outline-success btn-sm">
              <i class="fa fa-edit me-1"></i> Edit Order
            </button>
            <button v-if="order.status !== 'APPROVED'" @click="approveOrder" class="btn btn-success btn-sm">
              <i class="fa fa-check-circle me-1"></i> Approve Order
            </button>
            <button @click="goBack" class="btn btn-outline-secondary btn-sm">
              <i class="fa fa-arrow-left me-1"></i> Back to List
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          :class="['tab-btn', { active: activeTab === 'overview' }]"
          @click="activeTab = 'overview'"
        >
          <i class="fa fa-info-circle me-1"></i>
          <span>Overview</span>
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'payments' }]"
          @click="activeTab = 'payments'"
        >
          <i class="fa fa-credit-card me-1"></i>
          <span>Payments</span>
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'logistics' }]"
          @click="activeTab = 'logistics'"
        >
          <i class="fa fa-truck me-1"></i>
          <span>Logistics</span>
        </button>
      </div>

      <!-- TAB CONTENT INSIDE CARD -->
      <div class="tab-content p-4" v-if="order && !loading && !error">
      <!-- OVERVIEW TAB -->
      <div id="overview" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }" style="margin-bottom: 20px;">
        <!-- Key Information -->
        <div class="row g-4 mb-5">
          <div class="col-md-3">
            <div style="text-align: center;">
              <i class="fa fa-receipt fa-2x text-primary mb-2"></i>
              <div class="h5 mb-1">{{ order.order_number || 'N/A' }}</div>
              <small class="text-muted">Order Number</small>
            </div>
          </div>
          <div class="col-md-3">
            <div style="text-align: center;">
              <i class="fa fa-dollar-sign fa-2x text-success mb-2"></i>
              <div class="h5 mb-1">{{ formatCurrency(orderFinancial.grandTotal) }}</div>
              <small class="text-muted">Grand Total</small>
            </div>
          </div>
          <div class="col-md-3">
            <div style="text-align: center;">
              <i class="fa fa-calendar fa-2x text-warning mb-2"></i>
              <div class="h5 mb-1">{{ formatDate(order.order_date) }}</div>
              <small class="text-muted">Order Date</small>
            </div>
          </div>
          <div class="col-md-3">
            <div style="text-align: center;">
              <i class="fa fa-tag fa-2x text-info mb-2"></i>
              <span :class="getStatusBadge(order.status)" class="badge">{{ order.status }}</span>
              <small class="text-muted d-block mt-2">Status</small>
            </div>
          </div>
        </div>

        <!-- Order Information & Parties Combined -->
        <div class="mb-5">
          <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
            <i class="fa fa-info-circle me-2 text-primary"></i>Order Information & Parties
          </h5>
          
          <!-- First Row: Order Type, VAT, and Parties -->
          <div class="row g-3 mb-4">
            <!-- Order Type -->
            <div v-if="order.type && order.type !== 'N/A'" class="col-md-3">
              <small class="text-muted d-block">Order Type</small>
              <strong>{{ order.type }}</strong>
            </div>
            <!-- VAT Rate -->
            <div v-if="order.vat && order.vat !== 0" class="col-md-3">
              <small class="text-muted d-block">VAT Rate</small>
              <strong>{{ order.vat }}%</strong>
            </div>
            <!-- Parties in same row -->
            <div v-for="party in partyCards" :key="party.id" class="col-md-3">
              <div>
                <strong style="font-size: 13px;">{{ getRoleLabel(party.role) }}</strong>
                <div v-if="party.entity?.full_name || party.entity?.name" style="font-weight: 500; font-size: 13px; margin-bottom: 6px;">{{ party.entity?.full_name || party.entity?.name }}</div>
                <div class="small" style="font-size: 12px;">
                  <div v-if="party.contact_name && party.contact_name !== 'N/A'" class="mb-1"><strong>Contact:</strong> {{ party.contact_name }}</div>
                  <div v-if="party.contact_phone && party.contact_phone !== 'N/A'" class="mb-1"><strong>Phone:</strong> {{ party.contact_phone }}</div>
                  <div v-if="party.contact_email && party.contact_email !== 'N/A'" class="mb-1"><strong>Email:</strong> {{ party.contact_email }}</div>
                  <div v-if="party.commission_rate"><strong>Commission:</strong> {{ party.commission_rate }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Second Row: Other details -->
          <div class="row g-3">
            <div v-if="order.expected_date && order.expected_date !== 'N/A'" class="col-md-3">
              <small class="text-muted d-block">Expected Date</small>
              <strong>{{ formatDate(order.expected_date) }}</strong>
            </div>
            <div v-if="order.created_at" class="col-md-3">
              <small class="text-muted d-block">Created</small>
              <strong style="font-size: 13px;">{{ formatDateTime(order.created_at) }}</strong>
            </div>
            <div v-if="order.updated_at" class="col-md-3">
              <small class="text-muted d-block">Updated</small>
              <strong style="font-size: 13px;">{{ formatDateTime(order.updated_at) }}</strong>
            </div>
          </div>
        </div>
      </div>



      <!-- PAYMENTS TAB -->
      <div id="payments" class="tab-pane fade" :class="{ 'show active': activeTab === 'payments' }" style="margin-bottom: 20px;">
        <!-- Financial Summary -->
        <div class="mb-5">
          <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
            <i class="fa fa-calculator me-2 text-success"></i>Financial Summary
          </h5>
          <div class="row g-4">
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-shopping-cart fa-2x text-primary mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.subtotal) }}</div>
                <small class="text-muted">Subtotal</small>
              </div>
            </div>
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-percent fa-2x text-warning mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.vat) }}</div>
                <small class="text-muted">VAT</small>
              </div>
            </div>
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-tag fa-2x text-info mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.totalDiscount) }}</div>
                <small class="text-muted">Discount</small>
              </div>
            </div>
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-dollar-sign fa-2x text-success mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.grandTotal) }}</div>
                <small class="text-muted">Grand Total</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Status -->
        <div class="mb-5">
          <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
            <i class="fa fa-credit-card me-2 text-info"></i>Payment Status
          </h5>
          <div class="row g-4 mb-4">
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-check-circle fa-2x text-success mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(paymentStatus.paidAmount) }}</div>
                <small class="text-muted">Paid Amount</small>
              </div>
            </div>
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-exclamation-circle fa-2x text-warning mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(paymentStatus.balanceDue) }}</div>
                <small class="text-muted">Balance Due</small>
              </div>
            </div>
            <div class="col-md-3">
              <div style="text-align: center;">
                <i class="fa fa-percent fa-2x text-info mb-2"></i>
                <div class="h5 mb-1">{{ paymentStatus.percentage }}%</div>
                <small class="text-muted">Progress</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Schedule -->
        <div v-if="paymentSchedule.length > 0">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th class="text-end">Amount Due</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in paymentSchedule" :key="payment.sequence">
                  <td><strong>{{ payment.sequence }}</strong></td>
                  <td>{{ payment.description || 'Payment' }}</td>
                  <td class="text-end fw-bold">{{ formatCurrency(payment.amount_due) }}</td>
                  <td>{{ formatDate(payment.due_date) }}</td>
                  <td>
                    <span :class="getPaymentStatusBadge(payment.status)" class="badge">
                      {{ payment.status }}
                    </span>
                    <span v-if="payment.overdue" class="badge bg-danger ms-1">Overdue</span>
                  </td>
                  <td>{{ payment.payment_date ? formatDate(payment.payment_date) : '-' }}</td>
                  <td>{{ payment.payment_method || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payment Summary -->
          <div class="card mt-4">
            <div class="card-header bg-light">
              <h6 class="mb-0">Payment Summary</h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <div class="card border-primary">
                    <div class="card-body text-center">
                      <i class="fa fa-money-bill fa-2x text-primary mb-2"></i>
                      <div class="h4 mb-0">{{ formatCurrency(paymentSummary.totalDue) }}</div>
                      <small class="text-muted">Total Due</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card border-success">
                    <div class="card-body text-center">
                      <i class="fa fa-check-circle fa-2x text-success mb-2"></i>
                      <div class="h4 mb-0">{{ formatCurrency(paymentSummary.paid) }}</div>
                      <small class="text-muted">Paid</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card border-warning">
                    <div class="card-body text-center">
                      <i class="fa fa-exclamation-circle fa-2x text-warning mb-2"></i>
                      <div class="h4 mb-0">{{ formatCurrency(paymentSummary.balance) }}</div>
                      <small class="text-muted">Balance</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LOGISTICS TAB -->
      <div id="logistics" class="tab-pane fade" :class="{ 'show active': activeTab === 'logistics' }" style="margin-bottom: 20px;">
        <div v-if="logisticsTimeline.length > 0">
          <div class="timeline">
            <div v-for="(logistics, idx) in logisticsTimeline" :key="idx" class="timeline-item">
              <div class="timeline-marker" :class="getLogisticsStatusClass(logistics.status)"></div>
              <div class="card ms-4">
                <div class="card-header">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="mb-1">
                        <i :class="getLogisticsIcon(logistics.type)" class="me-2"></i>
                        {{ logistics.title || getLogisticsTypeLabel(logistics.type) }}
                      </h5>
                      <small class="text-muted">{{ getLogisticsTypeLabel(logistics.type) }}</small>
                    </div>
                    <span :class="getLogisticsStatusBadge(logistics.status)" class="badge">
                      {{ logistics.status }}
                    </span>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <strong>Period:</strong>
                      <div>{{ formatDate(logistics.start_date) }} to {{ formatDate(logistics.end_date) }}</div>
                    </div>
                    <div class="col-md-4">
                      <strong>Details:</strong>
                      <div>{{ logistics.details || 'N/A' }}</div>
                    </div>
                    <div class="col-md-4">
                      <strong>Cost:</strong>
                      <div>{{ formatCurrency(logistics.estimated_amount || 0) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Logistics Summary -->
          <div class="card mt-4">
            <div class="card-header bg-light">
              <h6 class="mb-0">Logistics Summary</h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="card border-primary">
                    <div class="card-body text-center">
                      <i class="fa fa-money-bill fa-2x text-primary mb-2"></i>
                      <div class="h4 mb-0">{{ logisticsSummary.totalCost }}</div>
                      <small class="text-muted">Total Cost</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-success">
                    <div class="card-body text-center">
                      <i class="fa fa-check-circle fa-2x text-success mb-2"></i>
                      <div class="h4 mb-0">{{ logisticsSummary.booked }}</div>
                      <small class="text-muted">Booked</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-warning">
                    <div class="card-body text-center">
                      <i class="fa fa-clock fa-2x text-warning mb-2"></i>
                      <div class="h4 mb-0">{{ logisticsSummary.pending }}</div>
                      <small class="text-muted">Pending</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="alert alert-info">
          <i class="fa fa-inbox me-2"></i> No logistics records for this order
        </div>
      </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="alert alert-info p-4">
      <i class="fa fa-spinner fa-spin"></i> Loading order details...
    </div>

    <!-- Error State -->
    <div v-if="error" class="alert alert-danger p-4">
      <i class="fa fa-exclamation-circle"></i> {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/bushman/order-store'
import { useToast } from '@/composables/useToast'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const { init } = useToast()
const orderStore = useOrderStore()

// State
const activeTab = ref('overview')
const downloadingPdf = ref(false)
const loading = computed(() => orderStore.loading)
const error = computed(() => orderStore.error)
const order = computed(() => orderStore.currentOrder)

// Helper Methods
const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const getStatusBadge = (status: string) => {
  const statusMap: any = {
    'DRAFT': 'bg-secondary',
    'PENDING': 'bg-warning',
    'SUBMITTED': 'bg-info',
    'APPROVED': 'bg-success',
    'CONFIRMED': 'bg-success',
    'FULFILLED': 'bg-primary',
    'CANCELLED': 'bg-danger'
  }
  return statusMap[status] || 'bg-secondary'
}

// Financial Summary
const orderFinancial = computed(() => {
  if (!order.value?.items) {
    return { subtotal: 0, totalDiscount: 0, vat: 0, grandTotal: 0 }
  }

  const subtotal = order.value.items.reduce((sum: number, item: any) => {
    return sum + ((item.quantity || 0) * (item.rate || 0))
  }, 0)

  const totalDiscount = order.value.items.reduce((sum: number, item: any) => {
    return sum + (item.discount_amount || 0)
  }, 0)

  const afterDiscount = subtotal - totalDiscount
  const vat = afterDiscount * ((order.value.vat || 0) / 100)
  const grandTotal = afterDiscount + vat + (order.value.additional_expenses || 0)

  return { subtotal, totalDiscount, vat, grandTotal }
})

// Payment Status
const paymentStatus = computed(() => {
  // Calculate paid amount from payment schedule
  const paidAmount = paymentSchedule.value.reduce((sum: number, p: any) => {
    return p.status === 'PAID' ? sum + (p.amount_due || 0) : sum
  }, 0)
  const balanceDue = orderFinancial.value.grandTotal - paidAmount
  const percentage = orderFinancial.value.grandTotal > 0 ? Math.round((paidAmount / orderFinancial.value.grandTotal) * 100) : 0
  
  return { paidAmount, balanceDue, percentage }
})

// Party Cards
const partyCards = computed(() => {
  return (order.value?.parties || []).map((party: any) => ({
    id: party.id,
    role: party.party_role_id,
    entity: party.entity,
    contact_name: party.contact_name,
    contact_phone: party.contact_phone,
    contact_email: party.contact_email,
    is_primary: party.is_primary,
    commission_rate: party.commission_rate
  }))
})

const getRoleLabel = (role: any) => {
  const roles: any = { 1: 'Customer', 2: 'Agent', 3: 'Supplier', 4: 'Partner' }
  return roles[role] || 'Party'
}

const getRoleIcon = (role: any) => {
  const icons: any = { 1: 'fa fa-user', 2: 'fa fa-handshake', 3: 'fa fa-factory', 4: 'fa fa-network-wired' }
  return icons[role] || 'fa fa-user'
}

const getRoleClass = (role: any) => {
  const classes: any = {
    1: 'bg-primary',
    2: 'bg-success',
    3: 'bg-info',
    4: 'bg-warning'
  }
  return classes[role] || 'bg-secondary'
}

// Logistics Timeline
const logisticsTimeline = computed(() => {
  return (order.value?.logistics || []).map((logistics: any) => ({
    type: logistics.logistics_type,
    title: logistics.title,
    start_date: logistics.start_datetime,
    end_date: logistics.end_datetime,
    status: logistics.status,
    details: logistics.details,
    estimated_amount: logistics.estimated_amount
  }))
})

const logisticsSummary = computed(() => {
  const logistics = logisticsTimeline.value
  const totalCost = formatCurrency(logistics.reduce((sum: number, l: any) => sum + (l.estimated_amount || 0), 0))
  const booked = logistics.filter((l: any) => l.status === 'BOOKED').length
  const pending = logistics.filter((l: any) => l.status === 'PLANNED').length
  
  return { totalCost, booked, pending }
})

const getLogisticsIcon = (type: string) => {
  const icons: any = {
    'HOTEL': 'fa fa-hotel',
    'CHARTER': 'fa fa-plane',
    'TRANSFER': 'fa fa-car',
    'AIRPORT': 'fa fa-map-pin'
  }
  return icons[type] || 'fa fa-truck'
}

const getLogisticsTypeLabel = (type: string) => {
  const labels: any = {
    'HOTEL': 'Accommodation',
    'CHARTER': 'Flight Charter',
    'TRANSFER': 'Ground Transfer',
    'AIRPORT': 'Airport Transfer'
  }
  return labels[type] || type
}

const getLogisticsStatusClass = (status: string) => {
  const classes: any = {
    'BOOKED': 'bg-success',
    'CONFIRMED': 'bg-info',
    'PLANNED': 'bg-warning',
    'CANCELLED': 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

const getLogisticsStatusBadge = (status: string) => {
  const badges: any = {
    'BOOKED': 'bg-success',
    'CONFIRMED': 'bg-info',
    'PLANNED': 'bg-warning',
    'CANCELLED': 'bg-danger'
  }
  return badges[status] || 'bg-secondary'
}

// Payment Schedule
const paymentSchedule = computed(() => {
  return (order.value?.installments || []).map((inst: any) => ({
    sequence: inst.sequence_no,
    description: inst.narration,
    amount_due: inst.amount_due,
    due_date: inst.due_date,
    status: inst.status || 'PENDING',
    payment_date: inst.payment_date,
    payment_method: inst.payment_method,
    overdue: new Date(inst.due_date) < new Date() && inst.status !== 'PAID'
  }))
})

const paymentSummary = computed(() => {
  const schedule = paymentSchedule.value
  const totalDue = schedule.reduce((sum: number, p: any) => sum + (p.amount_due || 0), 0)
  const paid = schedule.filter((p: any) => p.status === 'PAID').reduce((sum: number, p: any) => sum + (p.amount_due || 0), 0)
  const balance = totalDue - paid
  
  return { totalDue, paid, balance }
})

const getPaymentStatusBadge = (status: string) => {
  const badges: any = {
    'PAID': 'bg-success',
    'PENDING': 'bg-warning',
    'OVERDUE': 'bg-danger',
    'PARTIAL': 'bg-info'
  }
  return badges[status] || 'bg-secondary'
}

// Actions
const editOrder = () => {
  router.push({ name: 'orders-edit', params: { id: order.value?.id } })
}

const goBack = () => {
  router.push({ name: 'orders' })
}

const duplicateOrder = () => {
  Swal.fire({
    title: 'Duplicate Order?',
    text: `Create a copy of order #${order.value?.order_number}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, duplicate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      init({ message: 'Order duplicated successfully', color: 'success' })
    }
  })
}

const createInvoice = () => {
  init({ message: 'Invoice creation coming soon', color: 'info' })
}

const sendReminder = () => {
  init({ message: 'Reminder email sent', color: 'success' })
}

const printOrder = () => {
  window.print()
}
const exportPDF = downloadOrderPdf

// Status Management
const approveOrder = () => {
  Swal.fire({
    title: 'Approve Order?',
    text: `Move order #${order.value?.order_number} from SUBMITTED to APPROVED?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, approve it!',
    confirmButtonColor: '#28a745'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await orderStore.approveOrder(order.value?.id)
        init({ message: 'Order approved successfully', color: 'success' })
      } catch (error: any) {
        init({ message: error.message || 'Error approving order', color: 'danger' })
      }
    }
  })
}

const createContractFromOrder = () => {
  Swal.fire({
    title: 'Create Contract?',
    text: `Create a new contract from approved order #${order.value?.order_number}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, create contract!',
    confirmButtonColor: '#17a2b8'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await orderStore.createContractFromOrder(order.value?.id)
        const contractId = response.data.data?.id || response.data?.id
        
        init({ message: 'Contract created successfully', color: 'success' })
        
        // Navigate to contract details/form
        setTimeout(() => {
          router.push({
            name: 'contracts-details',
            params: { id: contractId }
          })
        }, 1000)
      } catch (error: any) {
        init({ message: error.message || 'Error creating contract', color: 'danger' })
      }
    }
  })
}

// PDF Download
const downloadOrderPdf = async () => {
  const orderId = route.params.id
  if (!orderId) return

  downloadingPdf.value = true
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}orders/${orderId}/order-pdf`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const data = await response.json()
    if (data?.success && data?.pdf) {
      const byteCharacters = atob(data.pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `order-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      Swal.fire('Error', data?.message || 'Failed to generate order PDF', 'error')
    }
  } catch (error) {
    console.error('Error downloading order PDF:', error)
    Swal.fire('Error', 'Failed to download order PDF', 'error')
  } finally {
    downloadingPdf.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (route.params.id) {
    try {
      await orderStore.getOrder(Number(route.params.id))
    } catch (e: any) {
      init({ message: e?.response?.data?.message || 'Error loading order', color: 'danger' })
    }
  }
})
</script>

<style scoped>
.order-details {
  padding: 1rem;
}

.card-header {
  border-bottom: 2px solid #e5e7eb;
}

.nav-tabs {
  gap: 0;
  border: none;
}

.nav-link {
  color: #666;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.nav-link.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: transparent;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
}

.card-body {
  padding: 1.5rem;
}

.table-responsive {
  border-radius: 6px;
  overflow: hidden;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  border-color: #d1d5db;
  background: #f3f4f6;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #333;
  padding: 0.875rem;
}

.table tbody td {
  border-color: #e5e7eb;
  padding: 0.75rem;
  vertical-align: middle;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.bg-primary { background: #3b82f6 !important; }
.bg-success { background: #10b981 !important; }
.bg-warning { background: #f59e0b !important; }
.bg-danger { background: #ef4444 !important; }
.bg-info { background: #0ea5e9 !important; }
.bg-secondary { background: #6b7280 !important; }
.bg-light { background: #f9fafb !important; }

.text-white { color: white !important; }
.text-muted { color: #6b7280; }
.text-success { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }

.border-primary { border-left: 4px solid #3b82f6; }
.border-success { border-left: 4px solid #10b981; }
.border-warning { border-left: 4px solid #f59e0b; }
.border-danger { border-left: 4px solid #ef4444; }
.border-info { border-left: 4px solid #0ea5e9; }

.progress {
  border-radius: 4px;
  background: #e5e7eb;
  height: 30px;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: white;
}

.timeline {
  position: relative;
  padding-left: 0;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  padding-left: 50px;
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 3px currentColor;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 24px;
  width: 2px;
  height: calc(100% + 2rem);
  background: #e5e7eb;
}

.timeline-item:last-child::before {
  display: none;
}

.h4 {
  font-size: 1.5rem;
  font-weight: 600;
}

.h5 {
  font-size: 1.25rem;
  font-weight: 600;
}

.h6 {
  font-size: 1rem;
  font-weight: 600;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -0.5rem;
  margin-left: -0.5rem;
}

.col-md-2 {
  flex: 0 0 calc(16.6666% - 1rem);
  margin: 0.5rem;
}

.col-md-3 {
  flex: 0 0 calc(25% - 1rem);
  margin: 0.5rem;
}

.col-md-4 {
  flex: 0 0 calc(33.3333% - 1rem);
  margin: 0.5rem;
}

.col-md-6 {
  flex: 0 0 calc(50% - 1rem);
  margin: 0.5rem;
}

.g-2 { gap: 0.5rem; }
.g-3 { gap: 1rem; }

.w-100 {
  width: 100%;
}

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.me-1 { margin-right: 0.25rem; }
.me-2 { margin-right: 0.5rem; }
.me-3 { margin-right: 1rem; }
.ms-1 { margin-left: 0.25rem; }
.ms-4 { margin-left: 1.5rem; }
.pt-2 { padding-top: 0.5rem; }

.btn {
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary { background: #3b82f6; color: white; }
.btn-success { background: #10b981; color: white; }
.btn-warning { background: #f59e0b; color: white; }
.btn-danger { background: #ef4444; color: white; }
.btn-info { background: #0ea5e9; color: white; }
.btn-secondary { background: #6b7280; color: white; }

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 0.375rem 0.625rem;
  font-size: 0.85rem;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  border: none;
  margin-bottom: 1rem;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
}

.alert-danger {
  background: #f8d7da;
  color: #721c24;
}

.fw-bold {
  font-weight: 600;
}

.text-center {
  text-align: center;
}

.text-end {
  text-align: right;
}

/* Header Card Styles */
.header-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Tab Navigation Styles */
.tab-navigation {
  display: flex;
  gap: 0;
  border-top: 2px solid #e2e8f0;
  padding: 0;
  background: white;
  overflow-x: auto;
  flex-wrap: nowrap;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: white;
  border: none;
  border-bottom: 3px solid transparent;
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #2563eb;
  background: #f8fafc;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: #eff6ff;
}

.tab-btn .badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 600;
}

</style>
