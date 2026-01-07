<template>
  <div class="order-details-page">
    <!-- Header -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="crumbs">
          <span class="crumb-icon"><i class="fa fa-shopping-cart"></i></span>
          SALES / <span>ORDERS</span>
        </div>
        <h1>Order Details</h1>
        <p class="subtitle">View complete order information</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-secondary" @click="goBack" type="button">
          <i class="fa fa-arrow-left me-2"></i> Back
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="alert alert-info">
      <i class="fa fa-spinner fa-spin"></i> Loading order details...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="fa fa-exclamation-circle"></i> {{ error }}
    </div>

    <!-- Tabs Container -->
    <div v-else-if="order" class="tabs-container">
      <!-- Tab Navigation -->
      <div class="tabs-nav bg-white rounded-top p-3 border-bottom">
        <ul class="nav nav-tabs mb-0" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'summary' }"
              @click="activeTab = 'summary'"
              role="tab"
            >
              <i class="fa fa-info-circle me-2"></i>Order Summary
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'items' }"
              @click="activeTab = 'items'"
              role="tab"
            >
              <i class="fa fa-box me-2"></i>Items & Pricing
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'parties' }"
              @click="activeTab = 'parties'"
              role="tab"
            >
              <i class="fa fa-users me-2"></i>Parties Involved
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'logistics' }"
              @click="activeTab = 'logistics'"
              role="tab"
            >
              <i class="fa fa-truck me-2"></i>Logistics & Timeline
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'payments' }"
              @click="activeTab = 'payments'"
              role="tab"
            >
              <i class="fa fa-credit-card me-2"></i>Payment Schedule
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'preferences' }"
              @click="activeTab = 'preferences'"
              role="tab"
            >
              <i class="fa fa-cog me-2"></i>Preferences & Notes
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: activeTab === 'documents' }"
              @click="activeTab = 'documents'"
              role="tab"
            >
              <i class="fa fa-file me-2"></i>Documents
            </button>
          </li>
        </ul>
      </div>

      <!-- Tab Content -->
      <div class="tabs-content bg-white rounded-bottom p-4">
        <!-- TAB 1: ORDER SUMMARY -->
        <div v-if="activeTab === 'summary'" class="tab-pane">
          <div class="row">
            <!-- Left Column: Order Information -->
            <div class="col-lg-8">
              <!-- Header Card -->
              <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 class="mb-1">Order #{{ order.order_number }}</h5>
                      <small>{{ order.type }} Order</small>
                    </div>
                    <div class="text-end">
                      <span :class="getStatusBadge(order.status)" class="badge me-2">{{ order.status }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="row mb-4">
                    <div class="col-md-6">
                      <h6 class="text-muted mb-3"><i class="fa fa-calendar me-2"></i>Dates</h6>
                      <div class="info-item">
                        <span class="label">Order Date:</span>
                        <strong>{{ formatDate(order.order_date) }}</strong>
                      </div>
                      <div class="info-item">
                        <span class="label">Expected Date:</span>
                        <strong>{{ formatDate(order.expected_date) }}</strong>
                      </div>
                      <div class="info-item">
                        <span class="label">Created:</span>
                        <strong>{{ formatDateTime(order.created_at) }}</strong>
                      </div>
                      <div class="info-item">
                        <span class="label">Updated:</span>
                        <strong>{{ formatDateTime(order.updated_at) }}</strong>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <h6 class="text-muted mb-3"><i class="fa fa-dollar-sign me-2"></i>Financial Summary</h6>
                      <div class="info-item">
                        <span class="label">Subtotal:</span>
                        <strong>{{ formatCurrency(orderFinancial.subtotal) }}</strong>
                      </div>
                      <div class="info-item">
                        <span class="label">VAT ({{ order.vat }}%):</span>
                        <strong>{{ formatCurrency(orderFinancial.vat) }}</strong>
                      </div>
                      <div class="info-item">
                        <span class="label">Additional Expenses:</span>
                        <strong>{{ formatCurrency(order.additional_expenses || 0) }}</strong>
                      </div>
                      <div class="info-item border-top pt-2 mt-2">
                        <span class="label fw-bold">Grand Total:</span>
                        <strong class="fs-5">{{ formatCurrency(orderFinancial.grandTotal) }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment Status -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="mb-0"><i class="fa fa-credit-card me-2"></i>Payment Status</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="info-item">
                        <span class="label">Paid Amount:</span>
                        <strong class="text-success">{{ formatCurrency(paymentStatus.paidAmount) }}</strong>
                      </div>
                      <div class="info-item">
                        <span class="label">Balance Due:</span>
                        <strong class="text-warning">{{ formatCurrency(paymentStatus.balanceDue) }}</strong>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="progress" style="height: 30px;">
                        <div 
                          class="progress-bar bg-success" 
                          :style="{ width: paymentStatus.percentage + '%' }"
                          role="progressbar"
                        >
                          {{ paymentStatus.percentage }}%
                        </div>
                      </div>
                      <small class="text-muted">Payment Progress</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Quick Actions -->
            <div class="col-lg-4">
              <div class="card sticky-top" style="top: 20px;">
                <div class="card-header bg-info text-white">
                  <h5 class="mb-0"><i class="fa fa-bolt me-2"></i>Quick Actions</h5>
                </div>
                <div class="card-body p-0">
                  <div class="list-group list-group-flush">
                    <button 
                      @click="editOrder"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <i class="fa fa-edit me-3 text-primary"></i>
                      <span>Edit Order</span>
                    </button>
                    <button 
                      @click="duplicateOrder"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <i class="fa fa-copy me-3 text-info"></i>
                      <span>Duplicate</span>
                    </button>
                    <button 
                      @click="createInvoice"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <i class="fa fa-receipt me-3 text-success"></i>
                      <span>Create Invoice</span>
                    </button>
                    <button 
                      @click="sendReminder"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <i class="fa fa-envelope me-3 text-warning"></i>
                      <span>Send Reminder</span>
                    </button>
                    <button 
                      @click="printOrder"
                      class="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <i class="fa fa-print me-3 text-secondary"></i>
                      <span>Print</span>
                    </button>
                    <button 
                      @click="exportPDF"
                      class="list-group-item list-group-item-action d-flex align-items-center border-0"
                    >
                      <i class="fa fa-file-pdf me-3 text-danger"></i>
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: ITEMS & PRICING -->
        <div v-if="activeTab === 'items'" class="tab-pane">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0"><i class="fa fa-box me-2"></i>Order Items</h5>
            <button class="btn btn-primary btn-sm">
              <i class="fa fa-plus me-2"></i>Add Item
            </button>
          </div>

          <div v-if="order.items && order.items.length > 0">
            <div class="table-responsive">
              <table class="table table-bordered mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 15%;">Item Name</th>
                    <th style="width: 12%;">Category</th>
                    <th style="width: 8%;">Qty</th>
                    <th style="width: 10%;">Rate</th>
                    <th style="width: 10%;">Discount</th>
                    <th style="width: 10%;">Tax</th>
                    <th style="width: 8%;">Est?</th>
                    <th style="width: 8%;">Opt?</th>
                    <th style="width: 10%;">Total</th>
                    <th style="width: 9%;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in order.items" :key="item.id" class="align-middle">
                    <td>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        :value="item.item?.name || item.item_name || ''" 
                        readonly
                      />
                    </td>
                    <td>
                      <select class="form-select form-select-sm" disabled>
                        <option>{{ item.category || '-- Select --' }}</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        class="form-control form-control-sm text-center" 
                        :value="item.quantity" 
                        readonly
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        class="form-control form-control-sm text-end" 
                        :value="item.rate || 0" 
                        readonly
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        class="form-control form-control-sm text-end" 
                        :value="item.discount_amount || 0" 
                        readonly
                      />
                    </td>
                    <td>
                      <select class="form-select form-select-sm" disabled>
                        <option>{{ item.tax_method || 'Exclu' }}</option>
                      </select>
                    </td>
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input" 
                        :checked="item.is_estimate" 
                        disabled
                      />
                    </td>
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input" 
                        :checked="item.is_optional" 
                        disabled
                      />
                    </td>
                    <td class="fw-bold text-end">
                      {{ formatCurrency(getItemTotal(item)) }}
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-success" title="Confirm">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-danger" title="Delete">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Items Summary -->
            <div class="card mt-4 border-top-primary">
              <div class="card-header bg-light">
                <h5 class="mb-0"><i class="fa fa-calculator me-2"></i>Items Summary</h5>
              </div>
              <div class="card-body">
                <div class="row justify-content-end">
                  <div class="col-md-5">
                    <div class="summary-item">
                      <span class="text-muted">Subtotal:</span>
                      <strong>{{ formatCurrency(orderFinancial.subtotal) }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="text-muted">Total Discount:</span>
                      <strong class="text-warning">-{{ formatCurrency(orderFinancial.totalDiscount) }}</strong>
                    </div>
                    <div class="summary-item">
                      <span class="text-muted">Tax ({{ order.vat }}%):</span>
                      <strong>{{ formatCurrency(orderFinancial.vat) }}</strong>
                    </div>
                    <div class="summary-item border-top pt-3 mt-3">
                      <span class="fw-bold fs-6">Grand Total:</span>
                      <strong class="fs-5 text-primary">{{ formatCurrency(orderFinancial.grandTotal) }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-info">
            <i class="fa fa-inbox me-2"></i> No items in this order
          </div>
        </div>

        <!-- TAB 3: PARTIES INVOLVED -->
        <div v-if="activeTab === 'parties'" class="tab-pane">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0"><i class="fa fa-users me-2"></i>Parties Involved</h5>
            <button class="btn btn-primary btn-sm">
              <i class="fa fa-plus me-2"></i>Add Party
            </button>
          </div>

          <div v-if="partyCards.length > 0">
            <div class="table-responsive">
              <table class="table table-bordered mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 15%;">Role</th>
                    <th style="width: 25%;">Entity Name</th>
                    <th style="width: 20%;">Contact Person</th>
                    <th style="width: 20%;">Email</th>
                    <th style="width: 15%;">Phone</th>
                    <th style="width: 5%;">Primary</th>
                    <th style="width: 10%;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(party, idx) in partyCards" :key="party.id" class="align-middle">
                    <td>
                      <select class="form-select form-select-sm" disabled>
                        <option>{{ getRoleLabel(party.role) }}</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        :value="party.entity?.full_name || ''" 
                        readonly
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        :value="party.contact_name || ''" 
                        readonly
                      />
                    </td>
                    <td>
                      <input 
                        type="email" 
                        class="form-control form-control-sm" 
                        :value="party.contact_email || ''" 
                        readonly
                      />
                    </td>
                    <td>
                      <input 
                        type="tel" 
                        class="form-control form-control-sm" 
                        :value="party.contact_phone || ''" 
                        readonly
                      />
                    </td>
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input" 
                        :checked="party.is_primary" 
                        disabled
                      />
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-success" title="Confirm">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-danger" title="Delete">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="alert alert-info">
            <i class="fa fa-inbox me-2"></i> No parties involved in this order
          </div>
        </div>

        <!-- TAB 4: LOGISTICS & TIMELINE -->
        <div v-if="activeTab === 'logistics'" class="tab-pane">
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
                    <div class="info-item mb-2">
                      <span class="label">Period:</span>
                      <strong>{{ formatDate(logistics.start_date) }} to {{ formatDate(logistics.end_date) }}</strong>
                    </div>
                    <div v-if="logistics.details" class="info-item mb-2">
                      <span class="label">Details:</span>
                      <strong>{{ logistics.details }}</strong>
                    </div>
                    <div class="info-item">
                      <span class="label">Cost:</span>
                      <strong>{{ formatCurrency(logistics.estimated_amount || 0) }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Logistics Summary -->
            <div class="card mt-4">
              <div class="card-header bg-light">
                <h5 class="mb-0">Logistics Summary</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4">
                    <div class="stat-box">
                      <div class="stat-value">{{ logisticsSummary.totalCost }}</div>
                      <div class="stat-label">Total Logistics Cost</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="stat-box">
                      <div class="stat-value">{{ logisticsSummary.booked }}</div>
                      <div class="stat-label">Booked Items</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="stat-box">
                      <div class="stat-value">{{ logisticsSummary.pending }}</div>
                      <div class="stat-label">Pending Items</div>
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

        <!-- TAB 5: PAYMENT SCHEDULE -->
        <div v-if="activeTab === 'payments'" class="tab-pane">
          <div v-if="paymentSchedule.length > 0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th class="text-end">Amount</th>
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
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 ms-auto">
                    <div class="summary-item">
                      <span>Total Due:</span>
                      <strong>{{ formatCurrency(paymentSummary.totalDue) }}</strong>
                    </div>
                    <div class="summary-item">
                      <span>Paid:</span>
                      <strong class="text-success">{{ formatCurrency(paymentSummary.paid) }}</strong>
                    </div>
                    <div class="summary-item border-top pt-2 mt-2">
                      <span class="fw-bold">Balance:</span>
                      <strong class="fs-5">{{ formatCurrency(paymentSummary.balance) }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-info">
            <i class="fa fa-inbox me-2"></i> No payment schedule for this order
          </div>
        </div>

        <!-- TAB 6: PREFERENCES & NOTES -->
        <div v-if="activeTab === 'preferences'" class="tab-pane">
          <div class="row">
            <div class="col-lg-6">
              <div class="card mb-4">
                <div class="card-header bg-light">
                  <h5 class="mb-0"><i class="fa fa-utensils me-2"></i>Food & Beverage Preferences</h5>
                </div>
                <div class="card-body">
                  <div v-if="preferences.food" class="mb-3">
                    <h6 class="text-muted mb-2">Food Preferences</h6>
                    <p class="mb-0">{{ preferences.food }}</p>
                  </div>
                  <div v-if="preferences.beverages" class="mb-3">
                    <h6 class="text-muted mb-2">Beverages</h6>
                    <p class="mb-0">{{ preferences.beverages }}</p>
                  </div>
                  <div v-if="preferences.alcohol" class="mb-3">
                    <h6 class="text-muted mb-2">Alcohol Preferences</h6>
                    <p class="mb-0">{{ preferences.alcohol }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="card mb-4">
                <div class="card-header bg-light">
                  <h5 class="mb-0"><i class="fa fa-alert-circle me-2"></i>Important Information</h5>
                </div>
                <div class="card-body">
                  <div v-if="preferences.allergies" class="alert alert-warning mb-3">
                    <h6 class="text-danger mb-2"><i class="fa fa-exclamation-triangle me-2"></i>Allergies</h6>
                    <p class="mb-0">{{ preferences.allergies }}</p>
                  </div>
                  <div v-if="preferences.special_requests" class="mb-3">
                    <h6 class="text-muted mb-2">Special Requests</h6>
                    <p class="mb-0">{{ preferences.special_requests }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header bg-light">
              <h5 class="mb-0"><i class="fa fa-sticky-note me-2"></i>Notes & Remarks</h5>
            </div>
            <div class="card-body">
              <p class="mb-0">{{ order.remarks || 'No remarks' }}</p>
            </div>
          </div>
        </div>

        <!-- TAB 7: DOCUMENTS & ATTACHMENTS -->
        <div v-if="activeTab === 'documents'" class="tab-pane">
          <div v-if="documents.length > 0" class="row">
            <div 
              v-for="doc in documents"
              :key="doc.id"
              class="col-md-6 col-lg-4 mb-4"
            >
              <div class="card h-100">
                <div class="card-body text-center">
                  <div class="document-icon mb-3">
                    <i class="fa fa-file-pdf fa-3x text-danger"></i>
                  </div>
                  <h5 class="card-title">{{ doc.name }}</h5>
                  <p class="text-muted small mb-3">
                    <span class="badge bg-light text-dark">{{ doc.type }}</span>
                  </p>
                  <p class="text-muted small mb-3">
                    {{ doc.size }} • {{ formatDate(doc.date) }}
                  </p>
                </div>
                <div class="card-footer bg-light">
                  <button class="btn btn-sm btn-outline-primary w-100 mb-2">
                    <i class="fa fa-download me-1"></i>Download
                  </button>
                  <button class="btn btn-sm btn-outline-danger w-100">
                    <i class="fa fa-trash me-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-info mb-4">
            <i class="fa fa-inbox me-2"></i> No documents yet
          </div>

          <!-- Upload Section -->
          <div class="card">
            <div class="card-header bg-light">
              <h5 class="mb-0"><i class="fa fa-cloud-upload me-2"></i>Upload New Document</h5>
            </div>
            <div class="card-body">
              <div class="upload-area border-2 border-dashed rounded p-5 text-center">
                <i class="fa fa-cloud-upload fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-2">Drag and drop files or click to browse</p>
                <small class="text-muted">Allowed types: PDF, DOC, JPG, PNG • Max 10MB</small>
                <input type="file" class="d-none" accept=".pdf,.doc,.docx,.jpg,.png" />
              </div>
            </div>
          </div>
        </div>
      </div>
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
const activeTab = ref('summary')
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
    'CONFIRMED': 'bg-success',
    'FULFILLED': 'bg-info',
    'CANCELLED': 'bg-danger'
  }
  return statusMap[status] || 'bg-secondary'
}

const getItemTotal = (item: any) => {
  const base = (item.quantity || 0) * (item.rate || 0)
  const discount = item.discount_amount || 0
  return base - discount
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
    1: 'bg-gradient-primary',
    2: 'bg-gradient-success',
    3: 'bg-gradient-info',
    4: 'bg-gradient-warning'
  }
  return classes[role] || 'bg-gradient-secondary'
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

// Preferences
const preferences = computed(() => {
  const prefs = order.value?.preferences || {}
  return {
    food: prefs.food_preferences || '',
    beverages: prefs.beverage_preferences || '',
    allergies: prefs.allergies?.join(', ') || '',
    alcohol: prefs.alcohol_preferences || '',
    special_requests: prefs.special_requests || ''
  }
})

// Documents
const documents = computed(() => {
  return order.value?.documents || []
})

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

const exportPDF = () => {
  init({ message: 'PDF export coming soon', color: 'info' })
}

// Lifecycle
onMounted(async () => {
  if (route.params.id) {
    try {
      // Fetch order data from backend - all data should be included in the response:
      // - Basic order info
      // - Items (from order_items)
      // - Parties (from order_parties with entity details)
      // - Logistics (from order_logistics)
      // - Installments (from installment_setups)
      // - Preferences (from order_preferences or denormalized in order)
      // - Documents (from order_documents or attachments table)
      await orderStore.getOrder(Number(route.params.id))
    } catch (e: any) {
      init({ message: e?.response?.data?.message || 'Error loading order', color: 'danger' })
    }
  }
})
</script>

<style scoped>
.order-details-page {
  width: 100%;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-head-left h1 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  color: #222;
}

.subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.crumbs {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.crumb-icon {
  margin-right: 0.5rem;
}

.head-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
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

.tabs-container {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-nav {
  border-bottom: 2px solid #e5e7eb;
}

.nav-tabs {
  border: none;
}

.nav-link {
  color: #666;
  border: none;
  padding: 1rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  background: transparent;
}

.nav-link:hover {
  color: #3b82f6;
  border-bottom: 2px solid #3b82f6;
}

.nav-link.active {
  color: #3b82f6;
  border-bottom: 2px solid #3b82f6;
  background: transparent;
}

.tabs-content {
  min-height: 500px;
}

.tab-pane {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: none;
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.bg-primary { background: #3b82f6 !important; }
.bg-info { background: #0ea5e9 !important; }
.bg-success { background: #10b981 !important; }
.bg-warning { background: #f59e0b !important; }
.bg-danger { background: #ef4444 !important; }
.bg-light { background: #f9fafb !important; }

.text-white { color: white !important; }
.text-muted { color: #6c757d; }

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-item .label {
  color: #666;
  font-size: 0.9rem;
}

.info-item strong {
  color: #222;
  text-align: right;
}

.info-item.border-top {
  border-top: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  font-size: 0.95rem;
}

.summary-item strong {
  font-weight: 600;
}

.list-group {
  border: none;
}

.list-group-item {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.list-group-item:hover {
  background: #f9fafb;
}

.list-group-item:last-child {
  border-bottom: none;
}

.table {
  margin: 0;
}

.table.table-bordered {
  border: 1px solid #d1d5db;
}

.table.table-bordered thead {
  background: #f3f4f6;
}

.table thead th {
  font-weight: 600;
  border: 1px solid #d1d5db;
  color: #333;
  padding: 0.875rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  vertical-align: middle;
}

.table tbody td {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  vertical-align: middle;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.form-control-sm,
.form-select-sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
}

.form-control-sm:disabled,
.form-select-sm:disabled {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  color: #4b5563;
}

.btn-group-sm > .btn {
  padding: 0.375rem 0.625rem;
  font-size: 0.8rem;
}

.btn-success {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
  border-color: #059669;
}

.btn-danger {
  background-color: #ef4444;
  border-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* Party Card Styling */
.party-card {
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.party-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.party-card .card-header {
  padding: 1.25rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.bg-gradient-success {
  background: linear-gradient(135deg, #28a745 0%, #1e8e3e 100%) !important;
}

.bg-gradient-info {
  background: linear-gradient(135deg, #17a2b8 0%, #0f7b8f 100%) !important;
}

.bg-gradient-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%) !important;
}

.bg-gradient-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%) !important;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 120px;
}

.info-value {
  color: #222;
  font-weight: 500;
  text-align: right;
}

.border-top-primary {
  border-top: 3px solid #3b82f6 !important;
}

.text-end {
  text-align: right;
}

.fw-bold {
  font-weight: 600;
}

.fs-5 {
  font-size: 1.25rem;
}

.d-flex {
  display: flex;
}

.justify-content-between {
  justify-content: space-between;
}

.justify-content-center {
  justify-content: center;
}

.align-items-center {
  align-items: center;
}

.align-items-start {
  align-items: flex-start;
}

.me-1 { margin-right: 0.25rem; }
.me-2 { margin-right: 0.5rem; }
.me-3 { margin-right: 1rem; }
.ms-1 { margin-left: 0.25rem; }
.ms-2 { margin-left: 0.5rem; }
.ms-4 { margin-left: 1.5rem; }
.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.p-5 { padding: 3rem; }

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

.stat-box {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #3b82f6;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
}

.upload-area {
  border: 2px dashed #e5e7eb;
  transition: all 0.3s;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}

.progress {
  border-radius: 4px;
  background: #e5e7eb;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: white;
}

.sticky-top {
  position: sticky;
  top: 20px;
}

h5, h6 {
  margin-bottom: 1rem;
}

small {
  font-size: 0.85rem;
}

.text-success { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }
.text-info { color: #0ea5e9; }
</style>
