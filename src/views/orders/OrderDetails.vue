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
            <button @click="previewOrderPdf" :disabled="downloadingPdf" class="btn btn-outline-primary btn-sm">
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
        <button :class="['tab-btn', 'tab-first', { active: activeTab === 'overview' }]" @click="activeTab = 'overview'">
          <i class="fa fa-info-circle me-1"></i>
          <span>Overview</span>
        </button>
        <button :class="['tab-btn', 'tab-middle', { active: activeTab === 'payments' }]"
          @click="activeTab = 'payments'">
          <i class="fa fa-credit-card me-1"></i>
          <span>Payments</span>
        </button>
        <button :class="['tab-btn', 'tab-last', { active: activeTab === 'logistics' }]"
          @click="activeTab = 'logistics'">
          <i class="fa fa-truck me-1"></i>
          <span>Logistics</span>
        </button>
      </div>

      <!-- TAB CONTENT INSIDE CARD -->
      <div class="tab-content p-4" v-if="order && !loading && !error">
        <!-- OVERVIEW TAB -->
        <div id="overview" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }"
          style="margin-bottom: 20px;">
          <!-- Order Information -->
          <div class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-info-circle me-2 text-primary"></i>Order Information
            </h5>

            <!-- Row 1: Order Number | Status | Order Type | Order Date -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">Order Number</small>
                <strong>{{ order.order_number || '-' }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Status</small>
                <span :class="getStatusBadge(order.status)" class="badge" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">{{ order.status }}</span>
              </div>
              <div>
                <small class="text-muted d-block">Order Type</small>
                <strong>{{ order.type || '-' }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Order Date</small>
                <strong>{{ formatDate(order.date || order.order_date || order.orderDate || order.created_at) }}</strong>
              </div>
            </div>

            <!-- Row 2: Package | Hunting Type | Hunting Area | Currency -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">Package</small>
                <strong>{{ orderPackageName }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Hunting Type</small>
                <strong>{{ orderHuntingType }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Hunting Area</small>
                <strong>{{ orderHuntingArea }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Currency</small>
                <strong>{{ order.currency?.code || order.currency_code || 'USD' }}</strong>
              </div>
            </div>

            <!-- Row 3: VAT Rate | Created | Last Updated | (empty) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">VAT Rate</small>
                <strong>{{ order.vat || 0 }}%</strong>
              </div>
              <div>
                <small class="text-muted d-block">Created</small>
                <strong style="font-size: 13px;">{{ order.created_at ? formatDateTime(order.created_at) : '-' }}</strong>
              </div>
              <div>
                <small class="text-muted d-block">Last Updated</small>
                <strong style="font-size: 13px;">{{ order.updated_at ? formatDateTime(order.updated_at) : '-' }}</strong>
              </div>
              <div></div>
            </div>

            <!-- Row 3: Financial Summary | Parties | Expected Date | Remarks -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <small class="text-muted d-block">Financial Summary</small>
                <strong style="font-size: 14px; color: #059669;">Grand Total: {{ formatCurrency(orderFinancial.grandTotal) }}</strong>
              </div>
              <div v-for="party in partyCards" :key="'info-' + party.id">
                <small class="text-muted d-block">{{ getRoleLabel(party.role) }}</small>
                <strong>{{ party.entity?.full_name || party.entity?.name || party.entity_name || 'Unknown' }}</strong>
                <div v-if="party.contact_name && party.contact_name !== 'N/A'" style="font-size: 12px; color: #64748b;">{{ party.contact_name }}</div>
              </div>
              <div v-if="order.expected_date">
                <small class="text-muted d-block">Expected Date</small>
                <strong>{{ formatDate(order.expected_date) }}</strong>
              </div>
              <div v-if="order.remarks">
                <small class="text-muted d-block">Remarks</small>
                <strong style="font-size: 13px;">{{ order.remarks }}</strong>
              </div>
            </div>
          </div>

          <!-- Financial Summary -->
          <div class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-calculator me-2 text-success"></i>Financial Summary
            </h5>
            <div class="row g-4 mt-1">
              <div class="col-md-3">
                <div class="summary-card">
                  <small class="text-muted d-block mb-1">Subtotal</small>
                  <strong class="h5 mb-0">{{ formatCurrency(orderFinancial.subtotal) }}</strong>
                </div>
              </div>
              <div class="col-md-3">
                <div class="summary-card">
                  <small class="text-muted d-block mb-1">Logistics</small>
                  <strong class="h5 mb-0">{{ formatCurrency(orderFinancial.logisticsTotal) }}</strong>
                </div>
              </div>
              <div class="col-md-3">
                <div class="summary-card">
                  <small class="text-muted d-block mb-1">VAT + Expense</small>
                  <strong class="h5 mb-0">{{ formatCurrency(orderFinancial.vat + orderFinancial.expenseIncluded)
                    }}</strong>
                </div>
              </div>
              <div class="col-md-3">
                <div class="summary-card summary-card-highlight">
                  <small class="text-muted d-block mb-1">Grand Total</small>
                  <strong class="h5 mb-0 text-success">{{ formatCurrency(orderFinancial.grandTotal) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Logistics Summary (compact) -->
          <div v-if="logisticsTimeline.length > 0" class="mb-5">
            <div
              style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #2563eb;">
              <i class="fa fa-truck text-primary" style="font-size: 18px;"></i>
              <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
                <span><strong>{{ logisticsTimeline.length }}</strong> logistics item(s)</span>
                <span>Total: <strong class="text-primary">{{ logisticsSummary.totalCost }}</strong></span>
                <span class="text-success"><strong>{{ logisticsSummary.booked }}</strong> booked</span>
                <span class="text-warning"><strong>{{ logisticsSummary.pending }}</strong> pending</span>
              </div>
            </div>
          </div>

          <!-- Installment Snapshot -->
          <div v-if="installmentSnapshot.count > 0" class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-calendar-check me-2 text-info"></i>Installment Snapshot
            </h5>
            <div class="row g-4">
              <div class="col-md-3">
                <div class="summary-card">
                  <small class="text-muted d-block mb-1">Total Installments</small>
                  <strong class="h5 mb-0">{{ installmentSnapshot.count }}</strong>
                </div>
              </div>
              <div class="col-md-3">
                <div class="summary-card">
                  <small class="text-muted d-block mb-1">Pending</small>
                  <strong class="h5 mb-0 text-warning">{{ installmentSnapshot.pendingCount }}</strong>
                </div>
              </div>
              <div class="col-md-3">
                <div class="summary-card">
                  <small class="text-muted d-block mb-1">Next Due</small>
                  <strong class="h5 mb-0">{{ installmentSnapshot.nextDueDate ?
                    formatDate(installmentSnapshot.nextDueDate) : 'None' }}</strong>
                  <div v-if="installmentSnapshot.nextAmount" style="font-size: 12px; color: #64748b;">{{
                    formatCurrency(installmentSnapshot.nextAmount) }}</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="summary-card summary-card-highlight">
                  <small class="text-muted d-block mb-1">Total Paid</small>
                  <strong class="h5 mb-0 text-success">{{ formatCurrency(installmentSnapshot.totalPaid) }}</strong>
                </div>
              </div>
            </div>
          </div>


        </div>



        <!-- PAYMENTS TAB -->
        <div id="payments" class="tab-pane fade" :class="{ 'show active': activeTab === 'payments' }"
          style="margin-bottom: 20px;">
          <!-- Financial Summary -->
          <div class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-calculator me-2 text-success"></i>Financial Summary
            </h5>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
              <div style="text-align: center;">
                <i class="fa fa-shopping-cart fa-lg text-primary mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.subtotal) }}</div>
                <small class="text-muted">Subtotal</small>
              </div>
              <div style="text-align: center;">
                <i class="fa fa-truck fa-lg text-info mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.logisticsTotal) }}</div>
                <small class="text-muted">Logistics</small>
              </div>
              <div style="text-align: center;">
                <i class="fa fa-percent fa-lg text-warning mb-2"></i>
                <div class="h5 mb-1">{{ formatCurrency(orderFinancial.vat) }}</div>
                <small class="text-muted">VAT</small>
              </div>
              <div style="text-align: center;">
                <i class="fa fa-dollar-sign fa-lg text-success mb-2"></i>
                <div class="h5 mb-1" style="color: #059669; font-weight: 700;">{{ formatCurrency(orderFinancial.grandTotal) }}</div>
                <small class="text-muted">Grand Total</small>
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
                  <i class="fa fa-check-circle fa-lg text-success mb-2"></i>
                  <div class="h5 mb-1">{{ formatCurrency(paymentStatus.paidAmount) }}</div>
                  <small class="text-muted">Paid Amount</small>
                </div>
              </div>
              <div class="col-md-3">
                <div style="text-align: center;">
                  <i class="fa fa-exclamation-circle fa-lg text-warning mb-2"></i>
                  <div class="h5 mb-1">{{ formatCurrency(paymentStatus.balanceDue) }}</div>
                  <small class="text-muted">Outstanding Amount</small>
                </div>
              </div>
              <div class="col-md-3">
                <div style="text-align: center;">
                  <i class="fa fa-percent fa-lg text-info mb-2"></i>
                  <div class="h5 mb-1">{{ paymentStatus.percentage }}%</div>
                  <small class="text-muted">Progress</small>
                </div>
              </div>
            </div>

            <!-- Dynamic Progress Bar -->
            <div class="progress mb-2" style="height: 24px; border-radius: 12px; background: #e5e7eb;">
              <div class="progress-bar" :class="{
                'bg-danger': paymentStatus.percentage < 25,
                'bg-warning': paymentStatus.percentage >= 25 && paymentStatus.percentage < 50,
                'bg-info': paymentStatus.percentage >= 50 && paymentStatus.percentage < 75,
                'bg-success': paymentStatus.percentage >= 75
              }" :style="{ width: paymentStatus.percentage + '%' }" role="progressbar">
                {{ paymentStatus.percentage }}%
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
              <span>{{ formatCurrency(paymentStatus.paidAmount) }} paid</span>
              <span>{{ formatCurrency(paymentStatus.balanceDue) }} remaining</span>
            </div>
          </div>

          <!-- Installment Breakdown -->
          <div v-if="paymentSchedule.length > 0" class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-list-ol me-2 text-primary"></i>Installment Breakdown
            </h5>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="table-layout: fixed; width: 100%;">
                <thead class="table-light">
                  <tr>
                    <th style="width: 6%; text-align: center;">#</th>
                    <th style="width: 24%;">Description</th>
                    <th style="width: 16%; text-align: right;">Amount Due</th>
                    <th style="width: 16%;">Due Date</th>
                    <th style="width: 14%; text-align: center;">Status</th>
                    <th style="width: 24%; text-align: center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="inst in paymentSchedule" :key="inst.sequence">
                    <td style="text-align: center; color: #94a3b8;">{{ inst.sequence }}</td>
                    <td>
                      <strong style="font-size: 13px;">{{ inst.description || 'Installment ' + inst.sequence }}</strong>
                    </td>
                    <td class="text-end fw-bold">{{ formatCurrency(inst.amount_due) }}</td>
                    <td>
                      <span>{{ formatDate(inst.due_date) }}</span>
                      <span v-if="inst.overdue" class="badge bg-danger ms-1" style="font-size: 10px;">Overdue</span>
                    </td>
                    <td style="text-align: center;">
                      <span :class="getPaymentStatusBadge(inst.status)" class="badge">{{ inst.status }}</span>
                    </td>
                    <td style="text-align: center;">
                      <button v-if="inst.status !== 'PAID'" class="btn btn-outline-success btn-sm"
                        @click="recordPayment(inst)" style="font-size: 12px; padding: 4px 10px;">
                        <i class="fa fa-money-bill me-1"></i>Record Payment
                      </button>
                      <span v-else style="color: #10b981; font-size: 12px;">
                        <i class="fa fa-check-circle me-1"></i>Paid
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment History -->
          <div v-if="paymentHistory.length > 0" class="mb-5">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-history me-2 text-success"></i>Payment History
            </h5>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="table-layout: fixed; width: 100%;">
                <thead class="table-light">
                  <tr>
                    <th style="width: 6%; text-align: center;">#</th>
                    <th style="width: 20%;">Date</th>
                    <th style="width: 18%; text-align: right;">Amount</th>
                    <th style="width: 16%;">Method</th>
                    <th style="width: 20%;">Reference</th>
                    <th style="width: 20%;">Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in paymentHistory" :key="payment.id">
                    <td style="text-align: center; color: #94a3b8;">{{ payment.sequence }}</td>
                    <td>{{ formatDate(payment.date) }}</td>
                    <td class="text-end fw-bold text-success">{{ formatCurrency(payment.amount) }}</td>
                    <td>{{ payment.method }}</td>
                    <td style="font-size: 12px;">{{ payment.reference }}</td>
                    <td style="font-size: 12px;">{{ payment.recordedBy }}</td>
                  </tr>
                </tbody>
                <tfoot style="background: #f0fdf4; border-top: 2px solid #e2e8f0;">
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: 600; font-size: 13px; color: #334155;">
                      Total ({{ paymentHistory.length }} payments)
                    </td>
                    <td class="text-end">
                      <strong style="font-size: 15px; color: #16a34a;">{{ formatCurrency(paymentStatus.paidAmount)
                        }}</strong>
                    </td>
                    <td colspan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div v-else class="mb-5">
            <div class="alert alert-info" style="margin-bottom: 0;">
              <i class="fa fa-info-circle me-2"></i>No payments recorded yet
            </div>
          </div>
        </div>

        <!-- LOGISTICS TAB -->
        <div id="logistics" class="tab-pane fade" :class="{ 'show active': activeTab === 'logistics' }"
          style="margin-bottom: 20px;">
          <div v-if="logisticsTimeline.length > 0">
            <h5 class="mb-3" style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; font-weight: 600;">
              <i class="fa fa-truck me-2 text-primary"></i>Logistics & Accommodation
            </h5>
            <div class="table-responsive">
              <table class="table table-hover table-layout align-middle mb-0">
                <thead style="background: #f8fafc;">
                  <tr>
                    <th style="width: 5%; text-align: center;">#</th>
                    <th style="width: 12%;">Type</th>
                    <th style="width: 25%;">Details</th>
                    <th style="width: 20%;">Period</th>
                    <th style="width: 14%; text-align: right;">Cost</th>
                    <th style="width: 12%; text-align: center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(logistics, idx) in logisticsTimeline" :key="idx">
                    <td style="text-align: center; color: #94a3b8;">{{ (idx as number) + 1 }}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i :class="getLogisticsIcon(logistics.type)" style="color: #2563eb;"></i>
                        <span class="badge" :class="{
                          'bg-primary': logistics.type === 'HOTEL',
                          'bg-info': logistics.type === 'CHARTER',
                          'bg-warning text-dark': logistics.type === 'TRANSFER' || logistics.type === 'AIRPORT',
                          'bg-secondary': !['HOTEL', 'CHARTER', 'TRANSFER', 'AIRPORT'].includes(logistics.type)
                        }">{{ logistics.type || 'OTHER' }}</span>
                      </div>
                    </td>
                    <td>
                      <strong style="font-size: 13px;">{{ logistics.title || getLogisticsTypeLabel(logistics.type)
                        }}</strong>
                      <div v-if="logistics.details" style="font-size: 11px; color: #64748b; margin-top: 2px;">{{
                        logistics.details }}</div>
                      <div v-if="logistics.hotel_name" style="font-size: 11px; color: #64748b; margin-top: 2px;">{{
                        logistics.hotel_name }}</div>
                      <div v-if="logistics.rooms" style="font-size: 11px; color: #64748b;">{{ logistics.rooms }}
                        room(s), {{ logistics.nights }} night(s)</div>
                      <div v-if="logistics.from_airport" style="font-size: 11px; color: #64748b;">{{
                        logistics.from_airport }} → {{ logistics.to_airport }} ({{ logistics.seats }} seats)</div>
                      <div v-if="logistics.from_location" style="font-size: 11px; color: #64748b;">{{
                        logistics.from_location }} → {{ logistics.to_location }}</div>
                    </td>
                    <td>
                      <div v-if="logistics.start_date || logistics.end_date" style="font-size: 12px;">
                        <div v-if="logistics.start_date">{{ formatDate(logistics.start_date) }}</div>
                        <div v-if="logistics.end_date" style="color: #64748b;">→ {{ formatDate(logistics.end_date) }}
                        </div>
                      </div>
                      <span v-else style="color: #94a3b8; font-size: 12px;">—</span>
                    </td>
                    <td style="text-align: right;">
                      <strong style="font-size: 13px;">{{ formatCurrency(logistics.estimated_amount || 0) }}</strong>
                    </td>
                    <td style="text-align: center;">
                      <span :class="getLogisticsStatusBadge(logistics.status)" class="badge mb-1">{{ logistics.status
                        }}</span>
                      <div style="margin-top: 4px;">
                        <button v-if="logistics.status === 'PLANNED'" class="btn btn-outline-info btn-sm"
                          @click="updateLogisticsStatus(idx as number, 'BOOKED')" style="font-size: 10px; padding: 2px 8px;">
                          <i class="fa fa-arrow-right me-1"></i>Book
                        </button>
                        <button v-else-if="logistics.status === 'BOOKED'" class="btn btn-outline-success btn-sm"
                          @click="updateLogisticsStatus(idx as number, 'COMPLETED')" style="font-size: 10px; padding: 2px 8px;">
                          <i class="fa fa-check me-1"></i>Complete
                        </button>
                        <span v-else-if="logistics.status === 'COMPLETED'" style="color: #10b981; font-size: 11px;">
                          <i class="fa fa-check-circle"></i>
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot style="background: #f0fdf4; border-top: 2px solid #e2e8f0;">
                  <tr>
                    <td colspan="4" style="text-align: right; font-weight: 600; font-size: 13px; color: #334155;">
                      Total ({{ logisticsTimeline.length }} items) &mdash;
                      <span class="text-success">{{ logisticsSummary.booked }} booked</span>,
                      <span class="text-warning">{{ logisticsSummary.pending }} pending</span>
                    </td>
                    <td style="text-align: right;">
                      <strong style="font-size: 15px; color: #16a34a;">{{ logisticsSummary.totalCost }}</strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
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
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
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

// Enquiry data for package/hunting details
const enquiryData = ref<any>(null)

// Package, Hunting Type, Hunting Area computed
const extractPackageName = (e: any): string | null => {
  if (!e) return null
  return e.price_structure_detail?.name
    || e.package_details?.package_name
    || e.package_details?.name
    || e.pricings?.[0]?.price_structure_detail?.name
    || e.package_name
    || null
}

const extractHuntingType = (e: any): string | null => {
  if (!e) return null
  return e.package_details?.hunting_type_name
    || e.pricings?.[0]?.price_structure_detail?.hunting_type?.name
    || e.pricings?.[0]?.hunting_type
    || e.hunting_type_name
    || e.hunting_type
    || null
}

const extractHuntingArea = (e: any): string | null => {
  if (!e) return null
  return e.package_details?.area_name
    || e.pricings?.[0]?.price_structure_detail?.hunting_area?.name
    || e.hunting_area_name
    || e.hunting_area
    || null
}

const orderPackageName = computed(() => {
  const fromEnquiry = extractPackageName(enquiryData.value)
  if (fromEnquiry) return fromEnquiry
  const o = order.value as any
  if (!o) return '-'
  // Try nested enquiry from sales_details
  const sd = o.sales_details || o.sales_order_detail
  const sdObj = Array.isArray(sd) ? sd[0] : sd
  const nested = sdObj?.sales_enquiry || sdObj?.salesEnquiry || sdObj?.enquiry
  const fromNested = extractPackageName(nested)
  if (fromNested) return fromNested
  // Fallback to order items
  if (o.items?.length) {
    const pkgItem = o.items.find((i: any) => i.item_type === 'PACKAGE' || i.item?.item_type === 'PACKAGE')
    if (pkgItem) return pkgItem.description || pkgItem.name || pkgItem.item?.name || '-'
    return o.items[0]?.description || o.items[0]?.name || '-'
  }
  return '-'
})

const orderHuntingType = computed(() => {
  const fromEnquiry = extractHuntingType(enquiryData.value)
  if (fromEnquiry) return fromEnquiry
  const o = order.value as any
  if (!o) return '-'
  const sd = o.sales_details || o.sales_order_detail
  const sdObj = Array.isArray(sd) ? sd[0] : sd
  const nested = sdObj?.sales_enquiry || sdObj?.salesEnquiry || sdObj?.enquiry
  const fromNested = extractHuntingType(nested)
  if (fromNested) return fromNested
  return '-'
})

const orderHuntingArea = computed(() => {
  const fromEnquiry = extractHuntingArea(enquiryData.value)
  if (fromEnquiry) return fromEnquiry
  const o = order.value as any
  if (!o) return '-'
  const sd = o.sales_details || o.sales_order_detail
  const sdObj = Array.isArray(sd) ? sd[0] : sd
  const nested = sdObj?.sales_enquiry || sdObj?.salesEnquiry || sdObj?.enquiry
  const fromNested = extractHuntingArea(nested)
  if (fromNested) return fromNested
  return '-'
})

// Helper Methods
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
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
    return { subtotal: 0, expenseIncluded: 0, vat: 0, grandTotal: 0 }
  }

  const subtotal = order.value.items.reduce((sum: number, item: any) => {
    return sum + ((item.quantity || 0) * (item.rate || 0))
  }, 0)

  const logisticsTotal = (order.value.logistics || []).reduce((sum: number, l: any) => {
    return sum + (Number(l.estimated_amount) || 0)
  }, 0)

  const vat = subtotal * ((order.value.vat || 0) / 100)
  const expenseIncluded = Number(order.value.expense_included) || 0
  const grandTotal = subtotal + logisticsTotal + vat + expenseIncluded

  return { subtotal, logisticsTotal, expenseIncluded, vat, grandTotal }
})

// Payment Status — uses actual order_payments for accuracy
const paymentStatus = computed(() => {
  const payments = order.value?.order_payments || []
  const paidAmount = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
  const balanceDue = orderFinancial.value.grandTotal - paidAmount
  const percentage = orderFinancial.value.grandTotal > 0
    ? Math.min(100, Math.round((paidAmount / orderFinancial.value.grandTotal) * 100))
    : 0
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
  const raw = order.value?.logistics || []
  return raw.map((logistics: any) => ({
    type: logistics.logistics_type,
    title: logistics.hotel_name || logistics.description || logistics.notes || logistics.title,
    start_date: logistics.start_datetime || logistics.check_in_date || logistics.flight_date || logistics.transfer_date,
    end_date: logistics.end_datetime || logistics.check_out_date,
    status: logistics.status,
    details: logistics.description || logistics.notes || logistics.details,
    estimated_amount: Number(logistics.estimated_amount) || 0,
    hotel_name: logistics.hotel_name,
    rooms: logistics.logistics_type === 'HOTEL' ? logistics.rooms : null,
    nights: logistics.logistics_type === 'HOTEL' ? logistics.nights : null,
    from_airport: logistics.from_airport,
    to_airport: logistics.to_airport,
    seats: logistics.seats,
    from_location: logistics.from_location,
    to_location: logistics.to_location
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

// Installment Snapshot for Overview
const installmentSnapshot = computed(() => {
  const installments = paymentSchedule.value
  const count = installments.length
  const pending = installments
    .filter((i: any) => i.status !== 'PAID')
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const nextDue = pending.length > 0 ? pending[0] : null
  const totalPaid = paymentStatus.value.paidAmount
  return {
    count,
    nextDueDate: nextDue?.due_date,
    nextAmount: nextDue?.amount_due || 0,
    totalPaid,
    pendingCount: pending.length
  }
})

// Payment History from order_payments
const paymentHistory = computed(() => {
  return (order.value?.order_payments || []).map((p: any, idx: number) => ({
    id: p.id,
    sequence: idx + 1,
    date: p.payment_date || p.created_at,
    amount: Number(p.amount) || 0,
    method: p.payment_method || p.method || '-',
    reference: p.reference || p.transaction_reference || '-',
    recordedBy: p.recorded_by_name || p.created_by_name || '-'
  }))
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

// Record Payment for an installment
const recordPayment = (installment: any) => {
  Swal.fire({
    title: 'Record Payment',
    html: `
      <p>Installment #${installment.sequence}: <strong>${formatCurrency(installment.amount_due)}</strong></p>
      <p>Due: ${formatDate(installment.due_date)}</p>
    `,
    input: 'number',
    inputLabel: 'Payment Amount',
    inputValue: installment.amount_due,
    inputAttributes: { min: '0', step: '0.01' },
    showCancelButton: true,
    confirmButtonText: 'Record Payment',
    confirmButtonColor: '#10b981'
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      try {
        // TODO: Call API to record payment
        init({ message: `Payment of ${formatCurrency(Number(result.value))} recorded`, color: 'success' })
        // Refresh order data
        await orderStore.getOrder(Number(route.params.id))
      } catch (err: any) {
        init({ message: err?.message || 'Error recording payment', color: 'danger' })
      }
    }
  })
}

// Update Logistics Status (PLANNED → BOOKED → COMPLETED)
const updateLogisticsStatus = async (idx: number, newStatus: string) => {
  const logistics = order.value?.logistics?.[idx]
  if (!logistics) return

  const confirmed = await Swal.fire({
    title: `Update Status?`,
    text: `Change logistics status to ${newStatus}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: `Yes, mark ${newStatus}`,
    confirmButtonColor: newStatus === 'COMPLETED' ? '#10b981' : '#0ea5e9'
  })

  if (confirmed.isConfirmed) {
    try {
      // TODO: Call API to update logistics status
      logistics.status = newStatus
      init({ message: `Logistics status updated to ${newStatus}`, color: 'success' })
    } catch (err: any) {
      init({ message: err?.message || 'Error updating status', color: 'danger' })
    }
  }
}

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

// PDF Preview & Download
const previewOrderPdf = async () => {
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
      const pdfUrl = URL.createObjectURL(blob)
      window.open(pdfUrl, '_blank')
    } else {
      throw new Error(data?.message || 'Failed to generate PDF')
    }
  } catch (err) {
    console.error('Error previewing PDF:', err)
    Swal.fire('Error', 'Failed to load order PDF preview', 'error')
  } finally {
    downloadingPdf.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (route.params.id) {
    try {
      await orderStore.getOrder(Number(route.params.id))
      const o = orderStore.currentOrder as any
      if (o) {
        console.log('[OrderDetails] All keys:', Object.keys(o))
        console.log('[OrderDetails] sales_details:', o.sales_details)
        console.log('[OrderDetails] sales_order_detail:', o.sales_order_detail)
        console.log('[OrderDetails] preferences:', JSON.stringify(o.preferences))
        console.log('[OrderDetails] enquiry_id:', o.enquiry_id, '| sales_enquiry_id:', o.sales_enquiry_id)
        console.log('[OrderDetails] quotation_id:', o.quotation_id, '| sales_enquiry_pricing_id:', o.sales_enquiry_pricing_id)

        // Try to find enquiry from nested sales_details / sales_order_detail
        const sd = o.sales_details || o.sales_order_detail
        const sdObj = Array.isArray(sd) ? sd[0] : sd
        const nested = sdObj?.sales_enquiry || sdObj?.salesEnquiry || sdObj?.enquiry
        if (nested) {
          enquiryData.value = nested
          console.log('[OrderDetails] ✓ Got nested enquiry from sales_details')
        }

        // Try direct enquiry ID fields
        if (!enquiryData.value) {
          const enquiryId = sdObj?.sales_enquiry_id || sdObj?.enquiry_id
            || o.sales_enquiry_id || o.enquiry_id || o.inquiry_id
            || o.preferences?.sales_enquiry_id || o.preferences?.enquiry_id
          if (enquiryId) {
            try {
              const eRes = await salesEnquiryService.get(Number(enquiryId))
              enquiryData.value = eRes?.data || eRes
              console.log('[OrderDetails] ✓ Fetched enquiry by ID:', enquiryId)
            } catch { /* */ }
          }
        }

        // Try via pricing/quotation ID
        if (!enquiryData.value) {
          const pricingId = sdObj?.sales_enquiry_pricing_id || sdObj?.pricing_id
            || o.quotation_id || o.sales_enquiry_pricing_id
            || o.preferences?.quotation_id || o.preferences?.sales_enquiry_pricing_id
          if (pricingId) {
            console.log('[OrderDetails] Trying pricing ID:', pricingId)
            try {
              const pRes = await salesEnquiryService.getPricing(Number(pricingId))
              const pricing = pRes?.data || pRes
              console.log('[OrderDetails] Pricing response:', JSON.stringify(pricing))
              const eId = pricing?.sales_enquiry_id || pricing?.enquiry_id
              if (eId) {
                const eRes = await salesEnquiryService.get(Number(eId))
                enquiryData.value = eRes?.data || eRes
                console.log('[OrderDetails] ✓ Got enquiry via pricing:', eId)
              }
            } catch (err) {
              console.warn('[OrderDetails] Pricing lookup failed:', err)
            }
          }
        }

        // Last resort: find enquiry by customer entity_id
        if (!enquiryData.value) {
          const customerParty = o.parties?.find((p: any) => p.role === 'CUSTOMER' || p.is_primary)
          const entityId = customerParty?.entity_id || customerParty?.entity?.id
          if (entityId) {
            console.log('[OrderDetails] Searching enquiries by entity_id:', entityId)
            try {
              const listRes = await salesEnquiryService.list({ entity_id: entityId })
              const enquiries = listRes?.data || listRes
              if (Array.isArray(enquiries) && enquiries.length > 0) {
                // Pick the most recent enquiry with status QUOTED or latest
                const quoted = enquiries.find((e: any) => e.status === 'QUOTED') || enquiries[0]
                // Now fetch full details
                const eRes = await salesEnquiryService.get(Number(quoted.id))
                enquiryData.value = eRes?.data || eRes
                console.log('[OrderDetails] ✓ Found enquiry by customer entity:', quoted.id)
              }
            } catch (err) {
              console.warn('[OrderDetails] Entity search failed:', err)
            }
          }
        }

        if (!enquiryData.value) {
          console.warn('[OrderDetails] ✗ No enquiry link found on this order')
        }
      }
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
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
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

.bg-primary {
  background: #3b82f6 !important;
}

.bg-success {
  background: #10b981 !important;
}

.bg-warning {
  background: #f59e0b !important;
}

.bg-danger {
  background: #ef4444 !important;
}

.bg-info {
  background: #0ea5e9 !important;
}

.bg-secondary {
  background: #6b7280 !important;
}

.bg-light {
  background: #f9fafb !important;
}

.text-white {
  color: white !important;
}

.text-muted {
  color: #6b7280;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.text-danger {
  color: #ef4444;
}

.border-primary {
  border-left: 4px solid #3b82f6;
}

.border-success {
  border-left: 4px solid #10b981;
}

.border-warning {
  border-left: 4px solid #f59e0b;
}

.border-danger {
  border-left: 4px solid #ef4444;
}

.border-info {
  border-left: 4px solid #0ea5e9;
}

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

.g-2 {
  gap: 0.5rem;
}

.g-3 {
  gap: 1rem;
}

.w-100 {
  width: 100%;
}

.table-layout {
  table-layout: fixed;
  width: 100%;
}

/* .mb-0 { margin-bottom: 0; }
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
.pt-2 { padding-top: 0.5rem; } */

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

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-info {
  background: #0ea5e9;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

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
  justify-content: space-between;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 16px;
  background: #f8fafc;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.04);
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: white;
  font-weight: 600;
}

.tab-first {
  border-radius: 0;
}

.tab-middle {
  border-radius: 0;
}

.tab-last {
  border-radius: 0;
}

.tab-btn .badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 600;
}

/* Summary Cards */
.summary-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
  transition: all 0.2s;
}

.summary-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-card-highlight {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

/* Progress bar inside payment tab */
.progress {
  border-radius: 12px;
  background: #e5e7eb;
  height: 24px;
  overflow: hidden;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  color: white;
  transition: width 0.6s ease;
  border-radius: 12px;
}

/* Button outline variants */
.btn-outline-primary {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
}

.btn-outline-primary:hover {
  background: #3b82f6;
  color: white;
}

.btn-outline-success {
  background: transparent;
  border: 1px solid #10b981;
  color: #10b981;
}

.btn-outline-success:hover {
  background: #10b981;
  color: white;
}

.btn-outline-info {
  background: transparent;
  border: 1px solid #0ea5e9;
  color: #0ea5e9;
}

.btn-outline-info:hover {
  background: #0ea5e9;
  color: white;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid #6b7280;
  color: #6b7280;
}

.btn-outline-secondary:hover {
  background: #6b7280;
  color: white;
}
</style>
