<template>
  <div class="order-form-page">
    <!-- Page Title Row -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="crumbs">
          <span class="crumb-icon">📋</span>
          ORDERS / <span>{{ isEdit ? 'EDIT' : 'CREATE' }}</span>
        </div>
        <h1>{{ isEdit ? 'Edit Order' : 'Create Order' }}</h1>
        <p class="subtitle">{{ isEdit ? 'Update order details and related information' : 'Configure your order with items, parties, logistics and payment terms' }}</p>
      </div>

      <div class="head-actions">
        <button class="btn ghost" type="button" @click="goBack">
          <span class="btn-icon">←</span> Back
        </button>
        <button class="btn ghost" type="button" @click="resetForm">
          <span class="btn-icon">⟲</span> Reset
        </button>
        <button class="btn primary" type="button" @click="submit" :disabled="saving">
          <span class="btn-icon">✓</span> {{ saving ? 'Saving...' : isEdit ? 'Update Order' : 'Create Order' }}
        </button>
      </div>
    </div>

    <!-- 2-Column Grid Layout -->
    <section class="grid">
      <!-- LEFT PANEL: Order Details -->
      <aside class="panel left-panel">
        <div class="panel-header">
          <div class="panel-icon">📝</div>
          <div class="panel-title-text">
            <h3>{{ isEdit ? 'Edit Details' : 'Order Details' }}</h3>
            <p>Fill in the order information</p>
          </div>
        </div>

        <div class="form">
          <!-- SECTION 1: REFERENCES & LINKS (MOVED TO TOP) -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">🔗</span>
              Links & References
            </div>

            <!-- QUOTATION WORKFLOW GUIDANCE -->
            <div v-if="!form.quotationId" style="margin-bottom: 16px; padding: 12px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #1565c0; font-weight: 500;">
                💡 <strong>Quick Start:</strong> Select a Quotation below to auto-populate items, parties, and pricing information.
              </p>
            </div>

            <div class="financial-grid">
              <label class="field">
                <span class="lbl">Sales Enquiry</span>
                <div class="input-wrapper">
                  <span class="input-icon">💬</span>
                  <select v-model="form.enquiryId" @change="onEnquiryChange">
                    <option value="">-- Select Enquiry --</option>
                    <option v-for="enq in filteredEnquiries" :key="enq.id" :value="String(enq.id)">
                      {{ enq.code }} - {{ enq.entity?.full_name || 'N/A' }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Quotation / Pricing <span v-if="!form.quotationId" style="color: #f44336;">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon">💼</span>
                  <select v-model="form.quotationId" :disabled="!form.enquiryId" :style="{ borderColor: !form.quotationId && form.items.length === 0 ? '#f44336' : '' }">
                    <option value="">{{ form.enquiryId ? '-- Select Quotation --' : '(Select Enquiry first)' }}</option>
                    <option v-for="quote in filteredQuotations" :key="quote.id" :value="String(quote.id)">
                      {{ quote.code || quote.name || `Quote #${quote.id}` }}
                    </option>
                  </select>
                </div>
              </label>
            </div>

            <!-- SUCCESS MESSAGE WHEN QUOTATION SELECTED -->
            <div v-if="form.quotationId && form.items.length > 0" style="margin-top: 12px; padding: 12px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #2e7d32; font-weight: 500;">
                ✓ Quotation loaded! {{ form.items.length }} items auto-populated. Ready to create order.
              </p>
            </div>
          </div>

          <!-- SECTION 2: BASIC ORDER INFORMATION (Only show when editing existing orders) -->
          <div v-if="isEdit.value" class="form-section">
            <div class="section-title">
              <span class="section-icon">🏷️</span>
              Basic Information
            </div>

            <label class="field">
              <span class="lbl">Status <span class="req">*</span></span>
              <div class="input-wrapper">
                <span class="input-icon">📊</span>
                <select v-model="form.status" required disabled>
                  <option value="">-- Select Status --</option>
                  <option v-for="status in orderStatuses" :key="status.id || status.code" :value="status.id || status.code">
                    {{ status.name || status }}
                  </option>
                </select>
              </div>
            </label>

            <label class="field">
              <span class="lbl">Order Date <span class="req">*</span></span>
              <div class="input-wrapper">
                <span class="input-icon">📅</span>
                <input v-model="form.orderDate" type="date" required disabled />
              </div>
            </label>
          </div>

          <!-- SECTION 3: FINANCIAL INFORMATION (Only show when editing existing orders) -->
          <div v-if="isEdit.value" class="form-section">
            <div class="section-title">
              <span class="section-icon">💰</span>
              Financial Information
            </div>

            <div class="financial-grid">
              <label class="field">
                <span class="lbl">Currency <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon">💵</span>
                  <select v-model="form.currency" required disabled>
                    <option value="">-- Select Currency --</option>
                    <option v-for="curr in currencies" :key="curr.id" :value="curr.id">
                      {{ curr.label || `${curr.symbol} - ${curr.name}` }}
                    </option>
                  </select>
                </div>
              </label>

              <label class="field">
                <span class="lbl">Exchange Rate</span>
                <div class="input-wrapper">
                  <span class="input-icon">📈</span>
                  <input v-model.number="form.exchangeRate" type="number" placeholder="1.0" step="0.01" />
                </div>
              </label>

              <label class="field">
                <span class="lbl">VAT (%)</span>
                <div class="input-wrapper">
                  <span class="input-icon">🧾</span>
                  <input v-model.number="form.vat" type="number" placeholder="0" step="0.01" />
                </div>
              </label>
            </div>
          </div>

          <!-- SECTION 4: ADDITIONAL INFO -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">📝</span>
              Additional Information
            </div>

            <label class="field">
              <span class="lbl">Remarks</span>
              <textarea v-model="form.remarks" class="textarea" rows="2" placeholder="Add any remarks..."></textarea>
            </label>

            <label class="field">
              <span class="lbl">Order Notes</span>
              <textarea v-model="form.notes" class="textarea" rows="2" placeholder="Add any relevant notes..."></textarea>
            </label>
          </div>
        </div>
      </aside>

      <!-- RIGHT PANEL: Additional Sections -->
      <aside class="panel right-panel">
        <div class="panel-header">
          <div class="panel-icon">📋</div>
          <div class="panel-title-text">
            <h3>Order Configuration</h3>
            <p>Set up items, parties, logistics and payment terms</p>
          </div>
        </div>

        <!-- Horizontal Tabs -->
        <div class="tabs-card">
          <div class="tabs">
            <button
              @click="toggleSection('items')"
              :class="['tab', { active: showSections.items }]"
              type="button"
            >
              <span class="tab-icon">📦</span>
              <span class="tab-text">Items & Parties</span>
            </button>
            <button
              @click="toggleSection('logistics')"
              :class="['tab', { active: showSections.logistics }]"
              type="button"
            >
              <span class="tab-icon">🚚</span>
              <span class="tab-text">Logistics & More</span>
            </button>
            <button
              @click="toggleSection('preferences')"
              :class="['tab', { active: showSections.preferences }]"
              type="button"
            >
              <span class="tab-icon">⚙️</span>
              <span class="tab-text">Additional Details</span>
            </button>
            <button
              @click="toggleSection('payment')"
              :class="['tab', { active: showSections.payment }]"
              type="button"
            >
              <span class="tab-icon">💳</span>
              <span class="tab-text">Payment Plan</span>
            </button>
          </div>
        </div>

        <!-- Section Content -->
        <div class="section-content">
          <!-- ITEMS & PARTIES SECTION -->
          <div v-if="showSections.items" class="expandable-section">
            <!-- Items Subsection -->
            <div class="subsection">
              <div class="subsection-header">
                <h4>Order Items</h4>
              </div>

              <!-- Items Table -->
              <div class="table-wrapper mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="min-width: 200px">Name</th>
                      <th style="min-width: 120px">Category</th>
                      <th style="min-width: 100px">Quantity</th>
                      <th style="min-width: 130px">Unit Amount</th>
                      <th style="min-width: 130px">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Items from Quotation -->
                    <tr v-for="(item, idx) in form.items" :key="idx">
                      <td>{{ item.name }}</td>
                      <td>{{ item.category }}</td>
                      <td class="text-center">{{ item.quantity }}</td>
                      <td>{{ formatCurrency(item.rate) }}</td>
                      <td class="text-center">
                        <span class="badge bg-info">{{ formatCurrency(item.amount || (item.quantity * item.rate)) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="form.items.length === 0" class="empty-state mt-3">No items from quotation</div>
            </div>

            <!-- Parties Subsection -->
            <div class="subsection">
              <div class="subsection-header">
                <h4>Parties</h4>
              </div>

              <!-- Parties Table -->
              <div class="table-wrapper mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="min-width: 100px">Role</th>
                      <th style="min-width: 150px">Entity Name</th>
                      <th style="min-width: 140px">Contact Person</th>
                      <th style="min-width: 130px">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Parties from Quotation -->
                    <tr v-for="(party, idx) in form.parties" :key="idx">
                      <td>
                        <span class="badge" :class="party.role === 'client' ? 'bg-primary' : party.role === 'supplier' ? 'bg-success' : 'bg-secondary'">
                          {{ party.role || '-' }}
                        </span>
                      </td>
                      <td>{{ party.entity?.full_name || party.entity_name || party.entity || '-' }}</td>
                      <td>{{ party.contact_person || '-' }}</td>
                      <td>{{ party.contact_phone || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="form.parties.length === 0" class="empty-state mt-3">No parties from quotation</div>
            </div>

            <!-- Navigation Buttons -->
            <div class="section-navigation mt-4">
              <button @click="goToPreviousSection" class="btn btn-secondary" type="button" :disabled="getCurrentSectionIndex() === 0">
                <i class="fas fa-arrow-left me-2"></i>Previous
              </button>
              <button @click="goToNextSection" class="btn btn-primary" type="button" :disabled="getCurrentSectionIndex() === sectionOrder.length - 1">
                Next<i class="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>

          <!-- LOGISTICS & MORE SECTION -->
          <div v-if="showSections.logistics" class="expandable-section">
            <!-- Logistics -->
            <div class="subsection">
              <div class="subsection-header">
                <h4>Logistics & Accommodation</h4>
                <button @click="addNewLogistic" class="btn btn-sm btn-primary" type="button">
                  <i class="fas fa-plus me-1"></i>Add Logistics
                </button>
              </div>
              <!-- Logistics List -->
              <div class="table-wrapper mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="min-width: 150px">Type</th>
                      <th style="min-width: 200px">Details</th>
                      <th style="min-width: 100px">Dates</th>
                      <th style="min-width: 120px">Amount</th>
                      <th style="min-width: 80px">Status</th>
                      <th style="min-width: 100px">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Add Logistics Form Rows - Multiple rows can be added -->
                    <tr v-for="(editLogistics, eIdx) in editingLogistics" :key="`editing-${eIdx}`" class="form-row">
                      <td>
                        <select v-model="editLogistics.logistics_type" class="form-select" style="margin: 0;">
                          <option value="">-- Select Type --</option>
                          <option v-for="type in logisticsTypes" :key="type.id || type.key" :value="type.key || type.name || type.id">
                            {{ type.key || type.name || type.id }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <!-- HOTEL Fields -->
                        <div v-if="editLogistics.logistics_type === 'HOTEL'" style="display: flex; gap: 8px; flex-direction: column;">
                          <input v-model="editLogistics.hotel_name" placeholder="Enter hotel name" class="form-input" style="margin: 0; font-size: 12px;" />
                          <div style="display: flex; gap: 8px;">
                            <input v-model="editLogistics.room_type" placeholder="Room type" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <input v-model.number="editLogistics.rooms" type="number" placeholder="Rooms" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            <input v-model.number="editLogistics.nights" type="number" placeholder="Nights" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                          </div>
                        </div>

                        <!-- CHARTER Fields -->
                        <div v-else-if="editLogistics.logistics_type === 'CHARTER'" style="display: flex; gap: 8px; flex-direction: column;">
                          <div style="display: flex; gap: 8px;">
                            <input v-model="editLogistics.from_airport" placeholder="From (e.g., DAR)" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <input v-model="editLogistics.to_airport" placeholder="To (e.g., ARK)" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <input v-model.number="editLogistics.seats" type="number" placeholder="Seats" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                          </div>
                        </div>

                        <!-- TRANSFER/AIRPORT Fields -->
                        <div v-else-if="['TRANSFER', 'AIRPORT'].includes(editLogistics.logistics_type)" style="display: flex; gap: 8px; flex-direction: column;">
                          <div style="display: flex; gap: 8px;">
                            <input v-model="editLogistics.from_location" placeholder="From" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <input v-model="editLogistics.to_location" placeholder="To" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                          </div>
                          <div style="display: flex; gap: 8px;">
                            <input v-model.number="editLogistics.passengers_hunters" type="number" placeholder="Hunters" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            <input v-model.number="editLogistics.passengers_observers" type="number" placeholder="Observers" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                          </div>
                        </div>

                        <!-- OTHER/Default -->
                        <div v-else>
                          <input v-model="editLogistics.description" placeholder="Description" class="form-input" style="margin: 0; font-size: 12px;" />
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                          <input v-model="editLogistics.start_datetime" type="datetime-local" class="form-input" style="margin: 0; font-size: 11px;" />
                          <input v-model="editLogistics.end_datetime" type="datetime-local" class="form-input" style="margin: 0; font-size: 11px;" />
                        </div>
                      </td>
                      <td>
                        <input v-model.number="editLogistics.estimated_amount" type="number" placeholder="Amount" min="0" step="0.01" class="form-input" style="margin: 0; font-size: 12px;" />
                      </td>
                      <td>
                        <select v-model="editLogistics.status" class="form-select" style="margin: 0; font-size: 12px;">
                          <option value="">-- Select Status --</option>
                          <option v-for="status in logisticsStatuses" :key="status.id || status.key" :value="status.key || status.name || status.id">
                            {{ status.key || status.name || status.id }}
                          </option>
                        </select>
                      </td>
                      <td style="text-align: center;">
                        <button @click="addLogistics(eIdx)" class="btn btn-xs btn-success me-2" type="button" title="Add">
                          <i class="fas fa-check"></i>
                        </button>
                        <button @click="cancelEditingLogistics(eIdx)" class="btn btn-xs btn-danger" type="button" title="Cancel">
                          <i class="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>

                    <!-- Existing Logistics Items -->
                    <tr v-for="(logistics, idx) in form.logistics" :key="idx">
                      <td>
                        <span class="badge" :class="{'bg-primary': logistics.logistics_type === 'HOTEL', 'bg-info': logistics.logistics_type === 'CHARTER', 'bg-warning': logistics.logistics_type === 'TRANSFER', 'bg-secondary': !logistics.logistics_type}">
                          {{ logistics.logistics_type || 'OTHER' }}
                        </span>
                      </td>
                      <td>
                        <strong v-if="logistics.hotel_name">{{ logistics.hotel_name }}</strong>
                        <strong v-else-if="logistics.from_location">{{ logistics.from_location }} → {{ logistics.to_location }}</strong>
                        <strong v-else-if="logistics.from_airport">{{ logistics.from_airport }} → {{ logistics.to_airport }}</strong>
                        <strong v-else>{{ logistics.description || '-' }}</strong>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                          <span v-if="logistics.rooms">{{ logistics.rooms }} room(s), {{ logistics.nights }} night(s)</span>
                          <span v-else-if="logistics.seats">{{ logistics.seats }} seats</span>
                          <span v-else-if="logistics.passengers_hunters">{{ logistics.passengers_hunters }} hunter(s), {{ logistics.passengers_observers }} observer(s)</span>
                        </div>
                      </td>
                      <td>
                        <div style="font-size: 11px;">
                          <div v-if="logistics.start_datetime">{{ new Date(logistics.start_datetime).toLocaleDateString() }}</div>
                          <div v-if="logistics.end_datetime">→ {{ new Date(logistics.end_datetime).toLocaleDateString() }}</div>
                        </div>
                      </td>
                      <td style="text-align: right;">
                        <span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(logistics.estimated_amount || 0) }}</span>
                      </td>
                      <td>
                        <span class="badge" :class="{'bg-success': logistics.status === 'BOOKED', 'bg-warning': logistics.status === 'PLANNED', 'bg-info': logistics.status === 'COSTED'}">
                          {{ logistics.status }}
                        </span>
                      </td>
                      <td style="text-align: center;">
                        <button @click="removeLogistics(idx)" class="btn btn-xs btn-danger" type="button" title="Delete">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="form.logistics.length === 0 && editingLogistics.length === 0" class="empty-state mt-3">No logistics added yet</div>
            </div>

            <!-- Navigation Buttons -->
            <div class="section-navigation mt-4">
              <button @click="goToPreviousSection" class="btn btn-secondary" type="button" :disabled="getCurrentSectionIndex() === 0">
                <i class="fas fa-arrow-left me-2"></i>Previous
              </button>
              <button @click="goToNextSection" class="btn btn-primary" type="button" :disabled="getCurrentSectionIndex() === sectionOrder.length - 1">
                Next<i class="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>

          <!-- PAYMENT PLAN SECTION -->
          <div v-if="showSections.payment" class="expandable-section">
            <div class="subsection">
              <!-- PAYMENT PLAN TEMPLATE SELECTOR -->
              <div style="margin-bottom: 16px; padding: 14px; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px;">
                <h5 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1e40af;">
                  <i class="fas fa-file-invoice-dollar" style="margin-right: 8px;"></i>Quick Setup: Select a Payment Plan Template
                </h5>
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #1e3a8a;">Choose a pre-configured payment plan template to auto-populate installments, or add custom installments manually.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                  <div v-for="template in availablePaymentPlanTemplates" :key="template.id" 
                       @click="applyPaymentPlanTemplateToForm(template)" 
                       style="padding: 12px; background: white; border: 2px solid #dbeafe; border-radius: 4px; cursor: pointer; transition: all 0.2s; user-select: none;"
                       @mouseenter="$event.currentTarget.style.borderColor = '#60a5fa'"
                       @mouseleave="$event.currentTarget.style.borderColor = '#dbeafe'">
                    <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">{{ template.name }}</div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">{{ template.description }}</div>
                    <div style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 6px; border-radius: 3px;">
                      {{ template.stages.length }} stages
                    </div>
                  </div>
                </div>
              </div>

              <div class="subsection-header">
                <h4>Installment Plan Details</h4>
                <button @click="showInstallmentForm = !showInstallmentForm" class="btn btn-sm btn-primary" type="button">
                  <i class="fas fa-plus me-1"></i>Add Installment
                </button>
              </div>

              <!-- Installments Table -->
              <div class="table-wrapper mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="min-width: 80px">#</th>
                      <th style="min-width: 120px">Amount Due</th>
                      <th style="min-width: 100px">Type</th>
                      <th style="min-width: 80px">Due Days</th>
                      <th style="min-width: 140px">Due Type</th>
                      <th style="min-width: 90px">Deposit</th>
                      <th style="min-width: 80px">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Add Form Row -->
                    <tr v-if="showInstallmentForm" class="form-row">
                      <td class="text-center">
                        <span class="badge bg-secondary">{{ form.installments.length + 1 }}</span>
                      </td>
                      <td>
                        <input v-model.number="newInstallment.amountDue" type="number" placeholder="Amount" step="0.01" class="form-input" style="max-width: 120px;" />
                      </td>
                      <td>
                        <select v-model="newInstallment.amountDueType" class="form-select">
                          <option v-for="type in installmentAmountTypes" :key="type.value || type.id" :value="type.value || type.id">
                            {{ type.label || type.name }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <input v-model.number="newInstallment.dueDays" type="number" placeholder="Days" min="0" class="form-input" style="max-width: 80px;" />
                      </td>
                      <td>
                        <select v-model="newInstallment.dueDaysType" class="form-select">
                          <option v-for="type in installmentDaysTypes" :key="type.value || type.id" :value="type.value || type.id">
                            {{ type.label || type.name }}
                          </option>
                        </select>
                      </td>
                      <td class="text-center">
                        <div class="form-checkbox-wrapper justify-center">
                          <input v-model="newInstallment.isDeposit" type="checkbox" id="isDeposit" class="form-checkbox" />
                        </div>
                      </td>
                      <td class="text-center">
                        <button @click="addInstallment" class="btn btn-xs btn-success me-2" type="button" title="Add">
                          <i class="fas fa-check"></i>
                        </button>
                        <button @click="showInstallmentForm = false; resetInstallmentForm()" class="btn btn-xs btn-danger" type="button" title="Clear">
                          <i class="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>

                    <!-- Existing Installments -->
                    <tr v-for="(inst, idx) in form.installments" :key="idx">
                      <td class="text-center">
                        <span class="badge bg-primary">{{ inst.sequenceNo }}</span>
                      </td>
                      <td>
                        <span v-if="inst.amountDueType === 'FIXED'" class="badge bg-info">{{ formatCurrency(inst.amountDue) }}</span>
                        <span v-else class="badge bg-warning">{{ inst.amountDue }}%</span>
                      </td>
                      <td>{{ inst.amountDueType }}</td>
                      <td class="text-center">{{ inst.dueDays }}</td>
                      <td>{{ inst.dueDaysType }}</td>
                      <td class="text-center">
                        <i v-if="inst.isDeposit" class="fas fa-check text-success"></i>
                        <i v-else class="fas fa-times text-muted"></i>
                      </td>
                      <td class="text-center">
                        <button @click="removeInstallment(idx)" class="btn btn-xs btn-danger" type="button" title="Delete">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="form.installments.length === 0 && !showInstallmentForm" class="empty-state mt-3">No installments added</div>

              <!-- INSTALLMENT SUMMARY -->
              <div v-if="form.installments.length > 0" style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                <h5 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 600; color: #0c4a6e;">
                  <i class="fas fa-chart-bar" style="margin-right: 8px;"></i>Payment Plan Summary
                </h5>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                  <!-- Summary by deposit vs. regular -->
                  <div style="padding: 12px; background: white; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Deposit Installments</div>
                    <div style="font-size: 18px; font-weight: 700; color: #e74c3c;">
                      {{ form.installments.filter(i => i.isDeposit).length }}
                    </div>
                  </div>
                  
                  <div style="padding: 12px; background: white; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Regular Installments</div>
                    <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">
                      {{ form.installments.filter(i => !i.isDeposit).length }}
                    </div>
                  </div>

                  <div v-if="hasPercentageInstallments" style="padding: 12px; background: white; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Total Percentage</div>
                    <div style="font-size: 18px; font-weight: 700; color: #8b5cf6;">
                      {{ getTotalInstallmentPercentage() }}%
                    </div>
                  </div>

                  <div v-if="hasFixedInstallments" style="padding: 12px; background: white; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Total Amount</div>
                    <div style="font-size: 18px; font-weight: 700; color: #10b981;">
                      {{ formatCurrency(getTotalFixedInstallmentAmount()) }}
                    </div>
                  </div>
                </div>

                <!-- Timeline view -->
                <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #cbd5e1;">
                  <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 10px;">Payment Timeline:</div>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div v-for="(inst, idx) in sortedInstallmentsByDueDays" :key="idx" style="padding: 8px; background: white; border-radius: 3px; border-left: 3px solid; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                      <div style="flex: 1;">
                        <span style="font-weight: 600; color: #1e293b;">{{ inst.name || inst.narration || `Installment ${inst.sequenceNo}` }}</span>
                        <span v-if="inst.isDeposit" style="margin-left: 8px; padding: 2px 6px; background: #fef3c7; color: #92400e; border-radius: 3px; font-size: 10px; font-weight: 600;">DEPOSIT</span>
                        <div style="color: #64748b; margin-top: 2px;">Due in {{ inst.dueDays }} days ({{ inst.dueDaysType }})</div>
                      </div>
                      <div style="text-align: right; font-weight: 600;">
                        <div v-if="inst.amountDueType === 'PERCENTAGE'" style="color: #8b5cf6;">{{ inst.amountDue }}%</div>
                        <div v-else style="color: #10b981;">{{ formatCurrency(inst.amountDue) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="section-navigation mt-4">
              <button @click="goToPreviousSection" class="btn btn-secondary" type="button" :disabled="getCurrentSectionIndex() === 0">
                <i class="fas fa-arrow-left me-2"></i>Previous
              </button>
              <button @click="goToNextSection" class="btn btn-primary" type="button" :disabled="getCurrentSectionIndex() === sectionOrder.length - 1">
                Next<i class="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>

          <!-- ADDITIONAL DETAILS SECTION -->
          <div v-if="showSections.preferences" class="expandable-section">
            <div class="section-inner-header">
              <h4>Additional Details</h4>
            </div>

            <div class="subsection">
              <!-- DIETARY PREFERENCES SUBSECTION -->
              <div class="subsection-group">
                <h5 style="display: flex; align-items: center; gap: 0.5rem; color: #333; margin-bottom: 0.8rem; font-size: 0.95rem; font-weight: 600;">
                  <i class="fas fa-utensils" style="color: #ff6b35;"></i>
                  Dietary & Beverage Preferences
                </h5>

                <!-- Row 1: Food & Beverage in horizontal layout -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div class="form-section" style="display: flex; flex-direction: column; height: 100px;">
                    <label class="form-label">Food Preferences</label>
                    <textarea v-model="form.preferences.food_preferences" placeholder="Food preferences, restrictions..." class="form-textarea" rows="2" style="flex: 1; resize: none;"></textarea>
                  </div>
                  <div class="form-section" style="display: flex; flex-direction: column; height: 100px;">
                    <label class="form-label">Beverage Preferences</label>
                    <textarea v-model="form.preferences.beverage_preferences" placeholder="Beverage preferences..." class="form-textarea" rows="2" style="flex: 1; resize: none;"></textarea>
                  </div>
                </div>

                <!-- Row 2: Alcohol Preference & Allergies Input in horizontal layout -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 0;">
                  <div class="form-section" style="display: flex; flex-direction: column; height: 100px;">
                    <label class="form-label">Alcohol Preference</label>
                    <textarea v-model="form.preferences.alcohol_preferences" placeholder="Alcohol preferences, restrictions..." class="form-textarea" rows="2" style="flex: 1; resize: none;"></textarea>
                  </div>
                  <div class="form-section" style="display: flex; flex-direction: column; height: 120px;">
                    <label class="form-label">Allergies</label>
                    <div style="display: flex; gap: 4px; align-items: flex-start; flex: 1; flex-direction: column;">
                      <div style="display: flex; gap: 4px; width: 100%;">
                        <input v-model="newAllergy" type="text" placeholder="e.g., Peanuts, Dairy..." class="form-input" style="flex: 1;" />
                        <button @click="addAllergy" class="btn btn-xs btn-primary" type="button" style="padding: 3px 10px; flex-shrink: 0; height: 40px;">
                          <i class="fas fa-plus"></i>
                        </button>
                      </div>
                      <div style="flex: 1; width: 100%;">
                        <div v-if="form.preferences.allergies && form.preferences.allergies.length > 0" class="allergy-tags" style="margin-top: 0.5rem;">
                          <span v-for="(allergy, idx) in form.preferences.allergies" :key="idx" class="tag">
                            {{ allergy }}
                            <button @click="removeAllergy(idx)" class="tag-remove" type="button">&times;</button>
                          </span>
                        </div>
                        <div v-else class="text-muted" style="font-size: 0.8rem; margin-top: 0.3rem;">No allergies</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SPECIAL REQUESTS SUBSECTION -->
              <div class="subsection-group">
                <h5 style="display: flex; align-items: center; gap: 0.5rem; color: #333; margin: 0 0 0.8rem 0; font-size: 0.95rem; font-weight: 600;">
                  <i class="fas fa-sticky-note" style="color: #3498db;"></i>
                  Special Requests & Notes
                </h5>

                <div class="form-section" style="margin-bottom: 0;">
                  <label class="form-label">Special Requests</label>
                  <textarea v-model="form.preferences.special_requests" placeholder="Add any special requests, accommodations, preferences, or important notes..." class="form-textarea" rows="2"></textarea>
                  <small class="text-muted" style="display: block; margin-top: 0.5rem;">This information will be shared with all relevant parties</small>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="section-navigation mt-4">
              <button @click="goToPreviousSection" class="btn btn-secondary" type="button" :disabled="getCurrentSectionIndex() === 0">
                <i class="fas fa-arrow-left me-2"></i>Previous
              </button>
              <button @click="submit" class="btn btn-success" type="button">
                <i class="fas fa-save me-2"></i>Save Order
              </button>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrderStore } from '@/stores/bushman/order-store'
import { useAppOptionStore } from '@/stores/app-option'
import { useToast } from '@/composables/useToast'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const appOptionStore = useAppOptionStore()
const toast = useToast()

// State
const loading = ref(false)
const saving = ref(false)
const showItemForm = ref(false)
const editItemIdx = ref<number | null>(null)
const showPartyForm = ref(false)
const editPartyIdx = ref<number | null>(null)
const editingLogistics = ref<any[]>([])
const showInstallmentForm = ref(false)
const newAllergy = ref('')
const originalSidebarState = ref(false)

const showSections = reactive({
  items: false,
  logistics: false,
  payment: false,
  preferences: false,
})

const form = reactive({
  // BASIC INFO
  orderNumber: '',
  orderType: 'SALES', // Default to SALES orders
  status: 'DRAFT', // Default to DRAFT status
  orderDate: new Date().toISOString().split('T')[0],
  currency: '1', // Default currency (adjust if needed)
  exchangeRate: 1.0,
  vat: 0,
  
  // REFERENCES
  enquiryId: '',
  quotationId: '',
  remarks: '',
  notes: '',
  
  // ITEMS
  items: [] as Array<any>,
  
  // PARTIES
  parties: [] as Array<any>,
  
  // PARTICIPANTS
  participants: [] as Array<{ party_type: string; count: number }>,
  
  // LOGISTICS
  logistics: [] as Array<any>,
  
  // PREFERENCES
  preferences: {
    food_preferences: '',
    beverage_preferences: '',
    allergies: [] as string[],
    alcohol_preferences: '',
    special_requests: '',
  },
  
  // PAYMENT
  installments: [] as Array<any>,
})

const newItem = reactive({
  name: '',
  category: '',
  quantity: 1,
  rate: 0,
  discount: 0,
  description: '',
})

const newParty = reactive({
  role: '',
  entity: '',
  contact_person: '',
  contact_phone: '',
  email: '',
})

const newLogistics = reactive({
  logistics_type: '', // HOTEL, CHARTER, TRANSFER, AIRPORT, OTHER
  item_id: null,
  description: '',
  // HOTEL fields
  hotel_name: '',
  room_type: '',
  rooms: 0,
  nights: 0,
  // CHARTER fields
  from_airport: '',
  to_airport: '',
  seats: 0,
  // TRANSFER/AIRPORT fields
  from_location: '',
  to_location: '',
  passengers_hunters: 0,
  passengers_observers: 0,
  // Date/Time fields
  start_datetime: '',
  end_datetime: '',
  // Amount fields
  estimated_amount: 0,
  actual_amount: 0,
  // Status & Notes
  status: 'PLANNED',
  notes: '',
})

const newInstallment = reactive({
  sequenceNo: 1,
  amountDue: 0,
  amountDueType: 'FIXED',
  dueDaysType: 'AFTER_CONFIRMATION',
  dueDays: 0,
  isDeposit: false,
})

// Computed
const id = computed(() => route.params.id as string)
const isEdit = computed(() => !!id.value)

const orderTypes = computed(() => orderStore.orderTypes)
const orderStatuses = computed(() => orderStore.orderStatuses)
const currencies = computed(() => orderStore.currencies)
const enquiries = computed(() => orderStore.enquiries)
const quotations = computed(() => orderStore.quotations)
const partyRoles = computed(() => orderStore.partyRoles)
const itemCategories = computed(() => orderStore.itemCategories || [])
const entities = computed(() => orderStore.entities || [])
const logisticsTypes = computed(() => {
  const types = orderStore.logisticsTypes || []
  
  // Mapping of backend labels to enum values
  const labelToEnum: any = {
    'Airport Transfer': 'AIRPORT',
    'AIRPORT': 'AIRPORT',
    'Charter Flight': 'CHARTER',
    'CHARTER': 'CHARTER',
    'Hotel Accommodation': 'HOTEL',
    'HOTEL': 'HOTEL',
    'Ground Transfer': 'TRANSFER',
    'TRANSFER': 'TRANSFER',
    'Other': 'OTHER',
    'OTHER': 'OTHER',
  }
  
  // Map backend data to enum values
  const mapped = types.map((type: any) => {
    const label = type.name || type.label || type.key || ''
    const enumValue = labelToEnum[label] || label
    return {
      id: type.id,
      key: enumValue,
      name: enumValue
    }
  })
  
  // If backend returns data, use mapped values; otherwise use fallback
  if (mapped.length > 0) {
    return mapped
  }
  
  return [
    { id: 1, key: 'AIRPORT', name: 'AIRPORT' },
    { id: 2, key: 'CHARTER', name: 'CHARTER' },
    { id: 3, key: 'HOTEL', name: 'HOTEL' },
    { id: 4, key: 'TRANSFER', name: 'TRANSFER' },
    { id: 5, key: 'OTHER', name: 'OTHER' },
  ]
})

const logisticsStatuses = computed(() => {
  const statuses = orderStore.logisticsStatuses || []
  
  // Mapping of backend labels to enum values
  const labelToEnum: any = {
    'Planned': 'PLANNED',
    'PLANNED': 'PLANNED',
    'Booked': 'BOOKED',
    'BOOKED': 'BOOKED',
    'Costed': 'COSTED',
    'COSTED': 'COSTED',
  }
  
  // Map backend data to enum values
  const mapped = statuses.map((status: any) => {
    const label = status.name || status.label || status.key || ''
    const enumValue = labelToEnum[label] || label
    return {
      id: status.id,
      key: enumValue,
      name: enumValue
    }
  })
  
  // If backend returns data, use mapped values; otherwise use fallback
  if (mapped.length > 0) {
    return mapped
  }
  
  return [
    { id: 1, key: 'PLANNED', name: 'PLANNED' },
    { id: 2, key: 'BOOKED', name: 'BOOKED' },
    { id: 3, key: 'COSTED', name: 'COSTED' },
  ]
})
const participantTypes = computed(() => 
  orderStore.participantTypes && orderStore.participantTypes.length > 0 
    ? orderStore.participantTypes.map((p: any) => p.id || p.code || p)
    : ['HUNTER', 'OBSERVER', 'COMPANION', 'STAFF']
)
const installmentAmountTypes = computed(() => orderStore.installmentAmountTypes || [])
const installmentDaysTypes = computed(() => orderStore.installmentDaysTypes || [])

// Available payment plan templates for quick setup
const availablePaymentPlanTemplates = computed(() => orderStore.getPaymentPlanTemplates())

// Calculate total order amount (for percentage-based installments)
const calculateTotalOrderAmount = (): number => {
  return orderStore.calculateOrderTotal(form.items)
}

const filteredQuotations = computed(() => {
  if (!form.enquiryId) return []
  return quotations.value.filter((q: any) =>
    q.enquiry_id === parseInt(form.enquiryId) ||
    q.sales_enquiry_id === parseInt(form.enquiryId)
  )
})

const filteredEnquiries = computed(() => {
  // Only show enquiries that have at least one LOCKED quotation
  const enquiryIdsWithLockedQuotations = new Set(
    quotations.value
      .filter((q: any) => q.status === 'LOCKED' || q.status === 'locked')
      .map((q: any) => q.enquiry_id || q.sales_enquiry_id)
  )
  return enquiries.value.filter((e: any) => enquiryIdsWithLockedQuotations.has(e.id))
})

const totalParticipants = computed(() => {
  return form.participants.reduce((sum, p) => sum + p.count, 0)
})

const selectedQuotation = computed(() => {
  if (!form.quotationId) return null
  return quotations.value.find((q: any) => q.id === parseInt(form.quotationId as string))
})

const isQuotationLocked = computed(() => {
  if (!selectedQuotation.value) return false
  // Check if quotation status is LOCKED
  const status = selectedQuotation.value.status
  return status === 'LOCKED'
})

// Installment summary computed properties
const hasPercentageInstallments = computed(() => {
  return form.installments.some((inst) => inst.amountDueType === 'PERCENTAGE')
})

const hasFixedInstallments = computed(() => {
  return form.installments.some((inst) => inst.amountDueType === 'FIXED')
})

const getTotalInstallmentPercentage = (): number => {
  return orderStore.getTotalInstallmentPercentage(form.installments)
}

const getTotalFixedInstallmentAmount = (): number => {
  return orderStore.getTotalFixedInstallmentAmount(form.installments)
}

const sortedInstallmentsByDueDays = computed(() => {
  return orderStore.sortInstallmentsByDueDays(form.installments)
})

// Methods
const toggleSection = (section: keyof typeof showSections) => {
  // Close all sections first
  Object.keys(showSections).forEach((key) => {
    showSections[key as keyof typeof showSections] = false
  })
  // Open only the selected section
  showSections[section] = true
}

const sectionOrder = ['items', 'logistics', 'preferences', 'payment']

const getCurrentSectionIndex = (): number => {
  for (let i = 0; i < sectionOrder.length; i++) {
    if (showSections[sectionOrder[i] as keyof typeof showSections]) {
      return i
    }
  }
  return 0
}

const goToNextSection = () => {
  const currentIndex = getCurrentSectionIndex()
  if (currentIndex < sectionOrder.length - 1) {
    const nextSection = sectionOrder[currentIndex + 1] as keyof typeof showSections
    toggleSection(nextSection)
  }
}

const goToPreviousSection = () => {
  const currentIndex = getCurrentSectionIndex()
  if (currentIndex > 0) {
    const previousSection = sectionOrder[currentIndex - 1] as keyof typeof showSections
    toggleSection(previousSection)
  }
}

const getParticipantCount = (partyType: string): number => {
  const participant = form.participants.find(p => p.party_type === partyType)
  return participant ? participant.count : 0
}

const setParticipantCount = (partyType: string, event: any) => {
  const count = parseInt(event.target.value) || 0
  const existingIndex = form.participants.findIndex(p => p.party_type === partyType)
  
  if (existingIndex >= 0) {
    form.participants[existingIndex].count = count
  } else {
    form.participants.push({ party_type: partyType, count })
  }
}

const incrementParticipant = (partyType: string) => {
  const existingIndex = form.participants.findIndex(p => p.party_type === partyType)
  
  if (existingIndex >= 0) {
    form.participants[existingIndex].count++
  } else {
    form.participants.push({ party_type: partyType, count: 1 })
  }
}

const decrementParticipant = (partyType: string) => {
  const existingIndex = form.participants.findIndex(p => p.party_type === partyType)
  
  if (existingIndex >= 0 && form.participants[existingIndex].count > 0) {
    form.participants[existingIndex].count--
  }
}

const addItem = () => {
  if (!newItem.name || !newItem.rate) {
    toast.warning('Please fill required fields')
    return
  }
  
  // If editing, update the existing item
  if (editItemIdx.value !== null) {
    form.items[editItemIdx.value] = { ...form.items[editItemIdx.value], ...newItem }
    editItemIdx.value = null
    toast.success('Item updated')
  } else {
    // Otherwise, add a new item
    form.items.push({ ...newItem })
    toast.success('Item added')
  }
  
  showItemForm.value = false
  resetItemForm()
}

const editItem = (idx: number) => {
  editItemIdx.value = idx
  newItem.name = form.items[idx].name
  newItem.category = form.items[idx].category
  newItem.quantity = form.items[idx].quantity
  newItem.rate = form.items[idx].rate
  newItem.discount = form.items[idx].discount || 0
  newItem.description = form.items[idx].description || ''
  showItemForm.value = true
}

const resetItemForm = () => {
  newItem.name = ''
  newItem.category = ''
  newItem.quantity = 1
  newItem.rate = 0
  newItem.discount = 0
  newItem.description = ''
  editItemIdx.value = null
}

const removeItem = (idx: number) => {
  form.items.splice(idx, 1)
  toast.success('Item removed')
}

const addParty = () => {
  if (!newParty.role || !newParty.entity) {
    toast.warning('Please fill required fields')
    return
  }
  
  // If editing, update the existing party
  if (editPartyIdx.value !== null) {
    form.parties[editPartyIdx.value] = { ...form.parties[editPartyIdx.value], ...newParty }
    editPartyIdx.value = null
    toast.success('Party updated')
  } else {
    // Otherwise, add a new party
    form.parties.push({ ...newParty })
    toast.success('Party added')
  }
  
  showPartyForm.value = false
  resetPartyForm()
}

const editParty = (idx: number) => {
  editPartyIdx.value = idx
  newParty.role = form.parties[idx].role
  newParty.entity = form.parties[idx].entity
  newParty.contact_person = form.parties[idx].contact_person
  newParty.contact_phone = form.parties[idx].contact_phone
  newParty.email = form.parties[idx].email
  showPartyForm.value = true
}

const resetPartyForm = () => {
  newParty.role = ''
  newParty.entity = ''
  newParty.contact_person = ''
  newParty.contact_phone = ''
  newParty.email = ''
  editPartyIdx.value = null
}

const removeParty = (idx: number) => {
  form.parties.splice(idx, 1)
  toast.success('Party removed')
}

const addLogistics = (idx: number) => {
  const item = editingLogistics.value[idx]
  let isValid: boolean = false
  
  if (item.logistics_type === 'HOTEL') {
    isValid = !!(item.hotel_name && item.room_type && item.rooms && item.nights)
  } else if (item.logistics_type === 'CHARTER') {
    isValid = !!(item.from_airport && item.to_airport && item.seats)
  } else if (item.logistics_type === 'TRANSFER' || item.logistics_type === 'AIRPORT') {
    isValid = !!(item.from_location && item.to_location)
  } else if (item.logistics_type === 'OTHER') {
    isValid = !!item.description
  } else {
    toast.warning('Please select logistics type')
    return
  }
  
  if (!isValid) {
    toast.warning('Please fill all required fields for this logistics item')
    return
  }
  
  // Move from editing to permanent logistics
  form.logistics.push({ ...item })
  // Remove from editing array
  editingLogistics.value.splice(idx, 1)
  toast.success('Logistics added')
}

const cancelEditingLogistics = (idx: number) => {
  editingLogistics.value.splice(idx, 1)
}

const resetLogisticsForm = () => {
  newLogistics.logistics_type = ''
  newLogistics.item_id = null
  newLogistics.description = ''
  newLogistics.hotel_name = ''
  newLogistics.room_type = ''
  newLogistics.rooms = ''
  newLogistics.nights = ''
  newLogistics.from_airport = ''
  newLogistics.to_airport = ''
  newLogistics.seats = ''
  newLogistics.from_location = ''
  newLogistics.to_location = ''
  newLogistics.passengers_hunters = ''
  newLogistics.passengers_observers = ''
  newLogistics.start_datetime = ''
  newLogistics.end_datetime = ''
  newLogistics.estimated_amount = ''
  newLogistics.actual_amount = ''
  newLogistics.status = 'PLANNED'
  newLogistics.notes = ''
}

const removeLogistics = (idx: number) => {
  form.logistics.splice(idx, 1)
  toast.success('Logistics removed')
}

const addNewLogistic = () => {
  // Add new empty logistics form to editing array
  editingLogistics.value.push({
    logistics_type: '',
    item_id: null,
    description: '',
    hotel_name: '',
    room_type: '',
    rooms: '',
    nights: '',
    from_airport: '',
    to_airport: '',
    seats: '',
    from_location: '',
    to_location: '',
    passengers_hunters: '',
    passengers_observers: '',
    start_datetime: '',
    end_datetime: '',
    estimated_amount: '',
    actual_amount: '',
    status: 'PLANNED',
    notes: '',
  })
}

const addInstallment = () => {
  if (!newInstallment.amountDue) {
    toast.warning('Please enter amount')
    return
  }
  newInstallment.sequenceNo = form.installments.length + 1
  form.installments.push({ ...newInstallment })
  resetInstallmentForm()
  showInstallmentForm.value = false
  toast.success('Installment added')
}

const applyPaymentPlanTemplateToForm = (template: any) => {
  // Get the template stages directly (don't calculate, just apply percentages as-is)
  const newInstallments = template.stages.map((stage: any) => ({
    sequenceNo: stage.sequenceNo,
    name: stage.name,
    narration: stage.narration || stage.name,
    amountDue: stage.amountDue, // Keep original amount (percentage or fixed)
    amountDueType: stage.amountDueType,
    dueDays: stage.dueDays,
    dueDaysType: stage.dueDaysType,
    isDeposit: stage.isDeposit,
    description: stage.description || ''
  }))
  
  // Replace existing installments with template installments
  form.installments = newInstallments
  
  // Show success message
  toast.success(`${template.name} applied successfully! ${form.installments.length} installments created.`)
  
  // Close the form
  showInstallmentForm.value = false
  resetInstallmentForm()
}

const resetInstallmentForm = () => {
  newInstallment.amountDue = 0
  newInstallment.amountDueType = 'FIXED'
  newInstallment.dueDaysType = 'AFTER_CONFIRMATION'
  newInstallment.dueDays = 0
  newInstallment.isDeposit = false
}

const removeInstallment = (idx: number) => {
  form.installments.splice(idx, 1)
  form.installments.forEach((inst, i) => {
    inst.sequenceNo = i + 1
  })
  toast.success('Installment removed')
}

const addAllergy = () => {
  if (newAllergy.value.trim()) {
    if (!form.preferences.allergies) {
      form.preferences.allergies = []
    }
    form.preferences.allergies.push(newAllergy.value.trim())
    newAllergy.value = ''
    toast.success('Allergy added')
  }
}

const removeAllergy = (idx: number) => {
  if (form.preferences.allergies) {
    form.preferences.allergies.splice(idx, 1)
    toast.success('Allergy removed')
  }
}

const formatCurrency = (amount: number) => {
  try {
    let currencyCode = 'USD'
    if (form.currency) {
      const selectedCurrency = currencies.value.find((c: any) => c.id === form.currency)
      if (selectedCurrency) {
        currencyCode = selectedCurrency.name
      }
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  } catch (error) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }
}

const submit = async () => {
  const confirmation = await Swal.fire({
    title: isEdit.value ? 'Update Order?' : 'Create Order?',
    text: isEdit.value ? 'Are you sure you want to update this order?' : 'Are you sure you want to create this order?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: isEdit.value ? 'Yes, update!' : 'Yes, create!',
  })

  if (!confirmation.isConfirmed) return

  // Validate required fields
  const missingFields = []
  if (!form.orderDate) missingFields.push('Order Date')
  if (!form.currency) missingFields.push('Currency')
  if (!isEdit.value && form.items.length === 0 && !form.quotationId) missingFields.push('Items (select a Quotation or add items manually)')

  if (missingFields.length > 0) {
    Swal.fire({
      title: 'Missing Required Fields',
      html: `<div style="text-align: left;">
        <p>Please fill the following required fields:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${missingFields.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>`,
      icon: 'warning',
    })
    return
  }

  saving.value = true
  try {
    const participantsData = form.participants.filter(p => p.count > 0)
    const logisticsData = form.logistics.filter(l => l.logistics_type)

    const payload = {
      order_type: form.orderType,
      status: form.status,
      order_date: form.orderDate,
      currency_id: form.currency ? parseInt(form.currency as string) : null,
      exchange_rate: form.exchangeRate,
      vat: form.vat,
      remarks: form.remarks || null,
      notes: form.notes || null,
      enquiry_id: form.enquiryId ? parseInt(form.enquiryId as string) : null,
      quotation_id: form.quotationId ? parseInt(form.quotationId as string) : null,
      items: form.items.map(item => ({
        item_id: item.item_id || item.id,
        description: item.name,
        item_category_id: item.category ? parseInt(item.category as string) : null,
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount || 0,
        discount_amount: item.discount || 0,
        line_total: (item.quantity * item.rate) - (item.discount || 0),
      })),
      parties: form.parties.map(party => ({
        role: (party.role || 'CUSTOMER').toUpperCase(),
        entity_id: party.entity ? parseInt(party.entity as string) : null,
        entity_name: party.entity_name || null,
        contact_name: party.contact_person || party.contact || null,
        contact_phone: party.contact_phone || null,
        contact_email: party.email || party.contact_email || null,
      })),
      participants: participantsData,
      logistics: logisticsData.map(log => ({
        logistics_type: log.logistics_type,
        location: log.location || null,
        check_in_date: log.check_in_date || null,
        nights: log.nights || 0,
        rooms: log.rooms || 0,
        from_airport: log.from_airport || null,
        to_airport: log.to_airport || null,
        flight_date: log.flight_date || null,
        seats: log.seats || 0,
        from_location: log.from_location || null,
        to_location: log.to_location || null,
        transfer_date: log.transfer_date || null,
        vehicle_type: log.vehicle_type || null,
        estimated_amount: log.estimated_amount || 0,
        status: log.status || 'PLANNED',
        description: log.description || null
      })),
      preferences: form.preferences,
      installments: form.installments.map(inst => ({
        sequence_no: inst.sequenceNo,
        amount_due: inst.amountDue,
        amount_due_type: inst.amountDueType,
        due_days: inst.dueDays,
        due_days_type: inst.dueDaysType,
        is_deposit: inst.isDeposit ? 1 : 0,
        currency_id: form.currency ? parseInt(form.currency as string) : null,
      })),
    }

    if (isEdit.value) {
      await orderStore.updateOrder(id.value, payload)
      Swal.fire('Success!', 'Order updated successfully', 'success').then(() => {
        router.push('/orders')
      })
    } else {
      await orderStore.createOrder(payload)
      // Refresh orders list to ensure new order is displayed with all data
      await orderStore.listOrders()
      Swal.fire('Success!', 'Order created successfully', 'success').then(() => {
        router.push('/orders')
      })
    }
  } catch (error: any) {
    Swal.fire('Error!', error.message || 'An error occurred', 'error')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  form.orderType = ''
  form.status = ''
  form.orderDate = new Date().toISOString().split('T')[0]
  form.currency = ''
  form.exchangeRate = 1.0
  form.vat = 0
  form.enquiryId = ''
  form.quotationId = ''
  form.remarks = ''
  form.notes = ''
  form.items = []
  form.parties = []
  form.participants = []
  form.logistics = []
  form.preferences = { food_preferences: '', beverage_preferences: '', allergies: [], alcohol_preferences: '', special_requests: '' }
  form.installments = []
  toast.info('Form reset')
}

const onEnquiryChange = () => {
  form.quotationId = ''
}

const onLogisticsTypeChange = () => {
  // Reset type-specific fields when logistics type changes
  newLogistics.location = ''
  newLogistics.check_in_date = ''
  newLogistics.nights = 0
  newLogistics.rooms = 0
  newLogistics.from_airport = ''
  newLogistics.to_airport = ''
  newLogistics.flight_date = ''
  newLogistics.seats = 0
  newLogistics.from_location = ''
  newLogistics.to_location = ''
}

const goBack = () => {
  router.push('/orders')
}

const loadDropdownData = async () => {
  loading.value = true
  try {
    await Promise.all([
      orderStore.fetchOrderTypes(),
      orderStore.fetchOrderStatuses(),
      orderStore.fetchCurrencies(),
      orderStore.fetchEnquiries(),
      orderStore.fetchQuotations(),
      orderStore.fetchEntities(),
      orderStore.fetchPartyRoles(),
      orderStore.fetchParticipantTypes(),
      orderStore.fetchItemCategories(),
      orderStore.fetchLogisticsTypes(),
      orderStore.fetchLogisticsStatuses(),
      orderStore.fetchInstallmentDaysTypes(),
      orderStore.fetchInstallmentAmountTypes(),
    ])
  } catch (error) {
    // Silently fail - use empty data
  } finally {
    loading.value = false
  }
}

const loadExistingOrder = async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const order = await orderStore.getOrder(id.value)
    if (order) {
      form.orderNumber = order.orderNumber
      form.orderType = order.orderType
      form.status = order.status
      form.orderDate = order.orderDate
      form.currency = order.currency
      form.exchangeRate = order.exchangeRate || 1.0
      form.vat = order.vat || 0
      form.enquiryId = order.enquiryId
      form.quotationId = order.quotationId
      form.remarks = order.remarks || ''
      form.notes = order.notes || ''
      form.items = order.items || []
      form.parties = order.parties || []
      form.participants = order.participants || []
      form.logistics = order.logistics || []
      form.preferences = order.preferences || { food_preferences: '', beverage_preferences: '', allergies: [], alcohol_preferences: '', special_requests: '' }
      form.installments = order.installments || []
    }
  } catch (error) {
    toast.error('Error loading order')
  } finally {
    loading.value = false
  }
}

// Watch for both enquiry and quotation changes to update status and fetch pricing items & parties
watch(
  () => [form.enquiryId, form.quotationId],
  async (newVal, oldVal) => {
    if (form.enquiryId && !form.quotationId) {
      // Only enquiry selected: set to DRAFT
      const draftStatus = orderStatuses.value.find((s: any) => s.name?.toUpperCase() === 'DRAFT')
      if (draftStatus) {
        form.status = draftStatus.id
      }
    }
    
    // When quotation is selected: fetch and auto-populate items & parties
    if (form.quotationId) {
      try {
        const pricingId = parseInt(form.quotationId as string)
        
        // ===== AUTO-POPULATE ITEMS =====
        // First try to get items from the already-loaded quotation object
        const quotationObj = quotations.value.find((q: any) => q.id === pricingId)
        
        let pricingItems: any[] = []
        
        // Check if quotation already has items embedded
        if (quotationObj?.items || quotationObj?.pricing_items) {
          pricingItems = quotationObj.items || quotationObj.pricing_items
        } else if (quotationObj?.items_by_type) {
          // Items might be grouped by type
          const itemsByType = quotationObj.items_by_type
          // Flatten all items from all types
          Object.values(itemsByType).forEach((typeItems: any) => {
            pricingItems.push(...(Array.isArray(typeItems) ? typeItems : []))
          })
        } else {
          // If not embedded, fetch from API
          pricingItems = await orderStore.fetchPricingItems(pricingId)
        }
        
        // Log the first item to see all available fields
        // Transform pricing items to order items format - extract quantity and rate from line items
        form.items = pricingItems.map((pItem: any) => {
          // Try multiple possible field names for rate
          let unitRate = pItem.rate || pItem.unit_price || pItem.unit_rate || pItem.rate_amount || pItem.price || pItem.unit_cost || 0
          const qty = pItem.quantity || pItem.qty || pItem.line_qty || 1
          const totalAmount = pItem.amount || pItem.total || pItem.line_total || pItem.total_amount || (qty * unitRate)
          
          // If rate is 0 but we have amount, calculate rate from amount/quantity
          if (unitRate === 0 && totalAmount > 0 && qty > 0) {
            unitRate = totalAmount / qty
          }
          
          const discount = pItem.discount || pItem.discount_amount || pItem.line_discount || 0
          
          // For Companion Hunters, don't display category
          const description = pItem.item_name || pItem.description || ''
          let category = pItem.item_type || pItem.category || ''
          if (description.toLowerCase().includes('companion')) {
            category = '' // Leave category empty for Companion Hunters
          }
          
          return {
            item_id: pItem.item_id || pItem.id,
            name: description,
            category: category,
            quantity: qty,
            rate: unitRate,
            discount: discount,
            amount: totalAmount
          }
        })
        
        // ===== AUTO-POPULATE PARTIES =====
        const pricingParties = await orderStore.fetchPricingParties(pricingId)
        
        // Transform pricing parties to order parties format
        form.parties = pricingParties.map((party: any) => {
          // Map role to valid ENUM values: CUSTOMER, SUPPLIER, AGENT, BROKER, CONTACT, BILL_TO, SHIP_TO
          let mappedRole = party.role || 'CUSTOMER'
          if (mappedRole.toUpperCase() === 'CLIENT') {
            mappedRole = 'CUSTOMER'
          }
          
          return {
            role: mappedRole.toUpperCase(),
            entity: party.entity_id?.toString() || '',
            entity_name: party.entity_name || party.name || party.entity || '',
            contact_person: party.contact_person || party.contact || '',
            contact_phone: party.phone || party.contact_phone || party.telephone || '',
            email: party.email || party.contact_email || ''
          }
        })
        
        // ===== AUTO-POPULATE LOGISTICS & PARTICIPANTS =====
        // Use the new smart endpoint that extracts all data from quotation
        
        try {
          // Try the new endpoint first - returns intelligently parsed data
          const baseUrl = import.meta.env.VITE_APP_BASE_URL || ''
          const response = await fetch(`${baseUrl}orders/load-from-quotation/${pricingId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const quotationData = await response.json()
            const data = quotationData.data || quotationData
            
            // Auto-populate Order Type and Status from quotation
            if (data.order_type) {
              // Find the order type ID that matches the returned order_type value
              const orderTypeObj = orderTypes.value.find((ot: any) => 
                ot.id === data.order_type || ot.name?.toUpperCase() === data.order_type?.toUpperCase() || ot.value === data.order_type
              )
              if (orderTypeObj) {
                form.orderType = orderTypeObj.id || orderTypeObj.value
              } else {
                // If no exact match, try to use the value directly
                form.orderType = data.order_type
              }
            }
            if (data.order_status) {
              const statusObj = orderStatuses.value.find((s: any) => 
                s.id === data.order_status || s.name?.toUpperCase() === data.order_status?.toUpperCase()
              )
              if (statusObj) {
                form.status = statusObj.id
              }
            }

            // Auto-populate currency from quotation
            const currencyField = data.currency || data.currency_id || data.currencyId
            if (currencyField) {
              const currencyObj = currencies.value.find((c: any) => 
                c.id === currencyField || c.code?.toUpperCase() === currencyField?.toString()?.toUpperCase() || c.symbol === currencyField
              )
              if (currencyObj) {
                form.currency = currencyObj.id
              } else {
                form.currency = currencyField
              }
            }

            // Auto-populate order date from quotation
            if (data.order_date) {
              form.orderDate = data.order_date
            }
            
            // Auto-populate participants from intelligent extraction
            if (data.participants && Array.isArray(data.participants)) {
              form.participants = data.participants.map((p: any) => ({
                party_type: p.type || p.party_type,
                count: p.count || 0
              }))
            }
            
            // Auto-populate logistics from intelligent extraction
            if (data.logistics && Array.isArray(data.logistics)) {
              form.logistics = data.logistics
                .filter((logItem: any) => {
                  // Filter out items that are already in the items array
                  // Don't include Companion Hunters or other items that have already been added
                  const description = logItem.description || logItem.item_name || ''
                  const descLower = description.toLowerCase()
                  
                  // Exclude if it matches any item already in form.items
                  const isInItems = form.items.some((item: any) => 
                    item.name.toLowerCase() === descLower
                  )
                  
                  return !isInItems
                })
                .map((logItem: any) => {
                  // Extract fields using new pricing structure
                  const description = logItem.description || logItem.item_name || logItem.remarks || ''
                  const quantity = logItem.quantity || logItem.qty || logItem.line_qty || 0
                  const unitAmount = logItem.unit_amount || logItem.rate || logItem.unit_price || logItem.unit_cost || 0
                  const totalAmount = logItem.total_amount || logItem.amount || logItem.total || logItem.line_total || (quantity * unitAmount) || 0
                  
                  return {
                    description: description,
                    quantity: quantity,
                    unit_amount: unitAmount,
                    total_amount: totalAmount,
                    is_estimate: logItem.is_estimate || false,
                    is_optional: logItem.is_optional || false
                  }
                })
            }
          } else {
            // Fallback to old method if new endpoint not available
            const pricingLogistics = await orderStore.fetchPricingLogistics(pricingId)
            
            // Auto-populate participants counts from legacy endpoint
            if (pricingLogistics.participants) {
              const participants = pricingLogistics.participants
              form.participants = []
              
              // Add hunter participants
              if (participants.hunter > 0) {
                form.participants.push({ party_type: 'HUNTER', count: participants.hunter })
              }
              // Add observer participants
              if (participants.observer > 0) {
                form.participants.push({ party_type: 'OBSERVER', count: participants.observer })
              }
              // Add companion participants
              if (participants.companion > 0) {
                form.participants.push({ party_type: 'COMPANION', count: participants.companion })
              }
            }
            
            // Auto-populate logistics items from legacy endpoint
            if (pricingLogistics.logistics && Array.isArray(pricingLogistics.logistics)) {
              form.logistics = pricingLogistics.logistics.map((logItem: any) => ({
                description: logItem.description || logItem.item_name || logItem.remarks || '',
                quantity: logItem.quantity || logItem.qty || logItem.line_qty || 0,
                unit_amount: logItem.unit_amount || logItem.rate || logItem.unit_price || logItem.unit_cost || 0,
                total_amount: logItem.total_amount || logItem.amount || logItem.total || logItem.line_total || 0,
                is_estimate: logItem.is_estimate || false,
                is_optional: logItem.is_optional || false
              }))
            }
          }
        } catch (err: any) {
          // Silently fail - form will remain with partially populated data
        }
        
        // Auto-open Items & Parties section after quotation data is loaded
        if (form.items.length > 0 || form.parties.length > 0) {
          showSections.items = true
          // Close other sections to focus on items
          showSections.logistics = false
          showSections.preferences = false
          showSections.payment = false
        }
      } catch (err: any) {
        // Silently fail - form will remain with partially populated data
      }
    }
  },
  { immediate: false }
)

// Restore sidebar state when leaving the page
onUnmounted(() => {
  appOptionStore.appSidebarMinified = originalSidebarState.value
})

onMounted(() => {
  // Save original sidebar state and collapse it
  originalSidebarState.value = appOptionStore.appSidebarMinified
  appOptionStore.appSidebarMinified = true

  loadDropdownData()
  loadExistingOrder()
})
</script>

<style scoped>
/* Layout */
.order-form-page {
  padding: 12px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.page-head-left {
  flex: 1;
}

.crumbs {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 8px;
}

.crumb-icon {
  font-size: 16px;
  margin-right: 6px;
}

.page-head h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 14px;
  align-items: start;
}

/* Panel */
.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.panel-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  border-radius: 10px;
}

.panel-title-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.panel-title-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

/* Left Panel - Form */
.left-panel {
  display: flex;
  flex-direction: column;
}

.form {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fafbfc;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-sizing: border-box;
}

.financial-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.financial-grid .field {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #dbeafe;
  overflow: hidden;
  word-break: break-word;
  width: 100%;
}

.section-icon {
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.field:last-child {
  margin-bottom: 0;
}

.lbl {
  font-size: 11px;
  color: #0f172a;
  font-weight: 600;
}

.req {
  color: #dc2626;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  transition: all 0.2s;
  min-height: 28px;
  width: 100%;
  max-width: 100%;
}

/* Form Input Placeholder Styling */
.form-input::placeholder {
  color: #94a3b8;
  opacity: 1;
}

.input-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.input-icon {
  position: absolute;
  left: 8px;
  font-size: 12px;
}

.input-wrapper input,
.input-wrapper select {
  border: none;
  background: transparent;
  padding: 4px 22px 4px 22px;
  font-size: 10px;
  flex: 1;
  outline: none;
  min-width: 0;
}

.input-wrapper select {
  appearance: none;
  padding-right: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M1.5 4.5L6 9l4.5-4.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 2px center;
}

.input-wrapper select:disabled {
  background-image: none;
  padding-right: 4px;
}

.textarea {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

/* Right Panel - Additional Sections */
.right-panel {
  /* No scrolling - content fits */
  grid-column: 2;
}

/* Tabs Card */
.tabs-card {
  padding: 12px 14px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.tab:hover:not(.active) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.tab.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.tab-icon {
  font-size: 16px;
}

.tab-text {
  font-size: 13px;
  font-weight: 600;
}

/* Subsection */
.subsection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.subsection-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.subsection {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.subsection:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.subsection-group {
  background: #f9fafb;
  border-left: 4px solid #e2e8f0;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.subsection-group:last-child {
  margin-bottom: 0;
}

.subsection-group h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subsection-group .form-section {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.subsection-group .form-section:last-child {
  margin-bottom: 0;
}

.btn-count {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.btn-arrow {
  font-size: 12px;
  color: #94a3b8;
}

.section-content {
  padding: 8px;
  background: #fafbfc;
}

.expandable-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.section-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.section-inner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-inner-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.subsection {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.subsection:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.subsection h5 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  text-transform: uppercase;
}

/* Forms */
.item-form,
.party-form,
.installment-form {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  outline: none;
}

.form-input:focus,
.form-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
  display: flex;
  gap: 6px;
}

/* Lists */
.items-list,
.parties-list,
.logistics-list,
.installments-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.items-list.horizontal {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.item-card-header .item-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.item-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-detail {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.item-detail .label {
  color: #64748b;
  font-weight: 600;
}

.item-detail .value {
  color: #0f172a;
  font-weight: 600;
}

.item-detail.total {
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
  color: #2563eb;
}

.item-row,
.party-row,
.logistics-row,
.installment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
}

.item-info,
.party-info,
.logistics-info,
.inst-info {
  flex: 1;
}

.party-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.party-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.party-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.party-header .party-role {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.party-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.party-entity {
  font-weight: 600;
  color: #0f172a;
}

.party-contact,
.party-email {
  color: #64748b;
}

.parties-list.horizontal {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.item-name,
.party-role,
.logistics-type,
.inst-num {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.item-details,
.party-entity,
.logistics-details {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.item-total,
.logistics-amount {
  font-weight: 600;
  color: #0f172a;
  margin: 0 12px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}

/* Participants */
.participant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.participant-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.participant-item label {
  font-size: 11px;
  font-weight: 600;
  color: #0f172a;
  text-transform: uppercase;
}

.input-group {
  display: flex;
  gap: 2px;
}

.input-group button {
  flex: 0.3;
  padding: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.input-group input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 6px 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.total-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 8px;
  background: #eff6ff;
  border-radius: 6px;
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  background: #2563eb;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge.bg-primary {
  background: #2563eb;
}

.badge.bg-secondary {
  background: #64748b;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.btn.primary {
  background: #2563eb;
  color: white;
  border-color: #1e40af;
}

.btn.primary:hover:not(:disabled) {
  background: #1e40af;
}

.btn.ghost {
  background: white;
  color: #475569;
  border-color: #cbd5e1;
}

.btn.ghost:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn.btn-sm {
  padding: 6px 10px;
  font-size: 11px;
}

.btn.btn-success {
  background: #16a34a;
  color: white;
}

.btn.btn-success:hover {
  background: #15803d;
}

.btn.btn-secondary {
  background: #64748b;
  color: white;
}

.btn.btn-secondary:hover {
  background: #475569;
}

.btn.btn-danger {
  background: #dc2626;
  color: white;
}

.btn.btn-danger:hover {
  background: #b91c1c;
}

.btn.btn-primary {
  background: #2563eb;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.allergy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dbeafe;
  color: #1e40af;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
  margin-left: 4px;
}

.tag-remove:hover {
  opacity: 0.7;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
  color: #334155;
  font-size: 13px;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.table-wrapper {
  overflow-x: visible;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table thead {
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
}

.data-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.data-table .form-row {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.data-table .form-row td {
  padding: 6px 10px;
  vertical-align: middle;
}

.data-table .form-row input,
.data-table .form-row select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
}

.data-table .form-row input:focus,
.data-table .form-row select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.data-table .text-center {
  text-align: center;
}

.data-table .text-success {
  color: #16a34a;
}

.data-table .text-muted {
  color: #cbd5e1;
}

.text-muted {
  color: #64748b;
  font-size: 12px;
}

.justify-center {
  justify-content: center;
}

.btn-xs {
  padding: 3px 6px;
  font-size: 10px;
  height: 26px;
  min-height: 26px;
}

.form-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
}

.checkbox-label {
  font-size: 13px;
  cursor: pointer;
  margin: 0;
}

.flex-align-end {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.bg-primary {
  background: #dbeafe;
  color: #1e40af;
}

.bg-secondary {
  background: #f3f4f6;
  color: #374151;
}

.bg-info {
  background: #cffafe;
  color: #0c4a6e;
}

.bg-warning {
  background: #fef3c7;
  color: #92400e;
}

.bg-success {
  background: #dcfce7;
  color: #166534;
}

.me-2 {
  margin-right: 8px;
}

.small {
  font-size: 12px;
}

.mt-3 {
  margin-top: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}

.pt-2 {
  padding-top: 8px;
}

.border-top {
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .right-panel {
    max-height: none;
  }

  .items-list.horizontal,
  .parties-list.horizontal {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .order-form-page {
    padding: 12px;
  }

  .page-head {
    flex-direction: column;
    gap: 12px;
  }

  .page-head h1 {
    font-size: 22px;
  }

  .subtitle {
    font-size: 12px;
  }

  .head-actions {
    width: 100%;
  }

  .head-actions button {
    flex: 1;
    font-size: 12px;
  }

  .form-section {
    padding: 12px;
    margin-bottom: 8px;
    overflow: visible;
  }

  .section-title {
    font-size: 10px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    width: 100%;
    overflow: visible;
  }

  .section-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .financial-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .field {
    margin-bottom: 4px;
  }

  .lbl {
    font-size: 11px;
  }

  .input-wrapper input,
  .input-wrapper select {
    padding: 6px 22px 6px 22px;
    font-size: 11px;
  }

  .textarea {
    padding: 8px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .order-form-page {
    padding: 8px;
  }

  .page-head h1 {
    font-size: 18px;
  }

  .crumbs {
    font-size: 11px;
  }

  .head-actions {
    flex-wrap: wrap;
  }

  .head-actions button {
    min-width: 100%;
    margin-bottom: 4px;
    font-size: 11px;
  }

  .form-section {
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 8px;
    overflow: visible;
  }

  .section-title {
    font-size: 10px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    overflow: visible;
    flex-wrap: wrap;
  }

  .section-icon {
    font-size: 11px;
    flex-shrink: 0;
  }

  .form {
    padding: 8px;
    gap: 8px;
  }

  .input-wrapper {
    min-height: 28px;
    border-radius: 4px;
  }

  .input-wrapper input,
  .input-wrapper select {
    padding: 5px 20px 5px 20px;
    font-size: 10px;
  }

  .input-icon {
    left: 6px;
    font-size: 11px;
  }

  .field {
    gap: 2px;
    margin-bottom: 4px;
  }

  .lbl {
    font-size: 10px;
  }

  .financial-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
