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

          <!-- SECTION 4: ORDER CHARGES -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">💰</span>
              Order Charges
            </div>

            <div class="financial-grid">
              <label class="field">
                <span class="lbl">VAT (%)</span>
                <div class="input-wrapper">
                  <span class="input-icon">%</span>
                  <input v-model.number="form.vat" type="number" placeholder="0" step="0.1" min="0" max="100" />
                </div>
                <span v-if="form.vat > 0" style="font-size: 10px; color: #64748b; margin-top: 2px;">= {{ formatCurrency(vatAmount) }} (on items only)</span>
              </label>
            </div>

            <!-- Grand Total Display -->
            <div v-if="form.vat > 0" style="margin-top: 12px; padding: 14px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 8px; border-left: 4px solid #2e7d32;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="font-size: 12px; color: #555;">
                  <div>Items Subtotal: <strong>{{ formatCurrency(itemsSubtotal) }}</strong></div>
                  <div>Logistics Total: <strong>{{ formatCurrency(logisticsTotal) }}</strong></div>
                  <div>VAT ({{ form.vat }}% on items): <strong>+{{ formatCurrency(vatAmount) }}</strong></div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 11px; color: #2e7d32; font-weight: 600; text-transform: uppercase;">Grand Total</div>
                  <div style="font-size: 22px; font-weight: 800; color: #1b5e20;">{{ formatCurrency(orderGrandTotal) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 5: ADDITIONAL INFO -->
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
          <!-- PDF Preview: simple button for single order, dropdown for multi-order -->
          <div v-if="!willCreateMultipleOrders" style="margin-left: auto;">
            <button class="btn btn-outline-primary btn-sm" type="button" @click="downloadPreviewPdf('all')" :disabled="generatingPdf" style="white-space: nowrap;">
              <span v-if="generatingPdf" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              <i class="fa fa-file-pdf me-1"></i>
              {{ generatingPdf ? 'Generating...' : 'Preview Order PDF' }}
            </button>
          </div>
          <div v-else style="margin-left: auto; position: relative;">
            <button class="btn btn-outline-primary btn-sm" type="button" @click="showPdfDropdown = !showPdfDropdown" :disabled="generatingPdf" style="white-space: nowrap;">
              <span v-if="generatingPdf" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              <i class="fa fa-file-pdf me-1"></i>
              {{ generatingPdf ? 'Generating...' : 'Preview Order PDF' }}
              <i class="fas fa-chevron-down ms-1" style="font-size: 10px;"></i>
            </button>
            <div v-if="showPdfDropdown" @click="showPdfDropdown = false" style="position: fixed; inset: 0; z-index: 998;"></div>
            <div v-if="showPdfDropdown" style="position: absolute; right: 0; top: 100%; margin-top: 4px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 999; min-width: 220px; overflow: hidden;">
              <button @click="downloadPreviewPdf('all'); showPdfDropdown = false" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; color: #334155; text-align: left; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                <i class="fas fa-users" style="color: #6366f1; width: 16px;"></i>
                <span><strong>All Orders</strong> (Combined Preview)</span>
              </button>
              <div style="height: 1px; background: #e2e8f0;"></div>
              <button v-for="g in orderGroups" :key="'pdf-' + getParticipantKey(g.primary)"
                @click="downloadPreviewPdf(getParticipantKey(g.primary)); showPdfDropdown = false"
                style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; color: #334155; text-align: left; transition: background 0.15s;"
                onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                <i class="fas fa-user" style="color: #3b82f6; width: 16px;"></i>
                <span>{{ getParticipantName(getParticipantKey(g.primary)) }}</span>
              </button>
            </div>
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
            <!-- Combined Items & Parties Form Section -->
            <div class="combined-form-section">
              <div class="form-section-header">
                <h3>📦 Items & Parties Information</h3>
                <p>Manage order items and involved parties in one place</p>
              </div>

              <!-- Two-Column Layout -->
              <div class="items-parties-grid">
                <!-- Left: Order Items -->
                <div class="grid-section">
                  <div class="subsection-header">
                    <h4>📦 Order Items</h4>
                  </div>
                  <div class="table-wrapper">
                    <table class="data-table items-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Qty</th>
                          <th>Unit Amount</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in form.items" :key="idx" :class="{ 'table-row-invalid': itemErrors[idx] }">
                          <td>
                            {{ item.name }}
                            <div v-if="itemErrors[idx]" class="item-error">{{ itemErrors[idx] }}</div>
                          </td>
                          <td>{{ item.category }}</td>
                          <td>{{ item.quantity }}</td>
                          <td>{{ formatCurrency(item.rate) }}</td>
                          <td>
                            <span class="badge bg-info">{{ formatCurrency((Number(item.quantity) || 0) * (Number(item.rate) || 0) - (Number(item.discount) || 0)) }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-if="form.items.length === 0" class="empty-state">No items from quotation</div>
                  </div>
                </div>

                <!-- Right: Parties -->
                <div class="grid-section">
                  <div class="subsection-header">
                    <h4>👥 Parties</h4>
                  </div>
                  <!-- Multi-order split banner -->
                  <div v-if="willCreateMultipleOrders" class="alert alert-info d-flex align-items-center py-2 px-3 mb-2" style="font-size:0.85rem;">
                    <i class="fas fa-info-circle me-2"></i>
                    <span>
                      <strong>{{ orderGroups.length }} separate orders</strong> will be created — one per independent participant.
                      <span v-for="(g, gi) in orderGroups" :key="gi" class="ms-1">
                        <span class="badge bg-primary me-1">{{ g.party?.entity_name || 'Unknown' }}</span>
                      </span>
                    </span>
                  </div>
                  <div class="table-wrapper">
                    <table class="data-table parties-data-table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Entity Name</th>
                          <th>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(party, idx) in form.parties" :key="idx">
                          <td>
                            <span class="badge" :class="party.role === 'client' ? 'bg-primary' : party.role === 'supplier' ? 'bg-success' : 'bg-secondary'">
                              {{ party.role || '-' }}
                            </span>
                          </td>
                          <td>{{ party.entity?.full_name || party.entity_name || party.entity || '-' }}</td>
                          <td>{{ party.contact_phone || '-' }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-if="form.parties.length === 0" class="empty-state">No parties from quotation</div>
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

          <!-- LOGISTICS & MORE SECTION -->
          <div v-if="showSections.logistics" class="expandable-section">
            <!-- Participant Tabs (only when multi-order) -->
            <div v-if="willCreateMultipleOrders" class="participant-tab-bar mb-3">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <i class="fas fa-users" style="color: #6366f1; font-size: 13px;"></i>
                <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Logistics per participant</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button type="button"
                  style="border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;"
                  :style="activeParticipantTab.logistics === 'shared' ? 'background: #10b981; color: #fff; box-shadow: 0 2px 6px rgba(16,185,129,0.3);' : 'background: #f1f5f9; color: #64748b;'"
                  @click="switchToParticipantTab('logistics', 'shared')">
                  <i class="fas fa-link" style="font-size: 10px;"></i> Shared
                </button>
                <button v-for="g in orderGroups" :key="getParticipantKey(g.primary)"
                  type="button"
                  style="border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;"
                  :style="activeParticipantTab.logistics === getParticipantKey(g.primary) ? 'background: #3b82f6; color: #fff; box-shadow: 0 2px 6px rgba(59,130,246,0.3);' : 'background: #f1f5f9; color: #64748b;'"
                  @click="switchToParticipantTab('logistics', getParticipantKey(g.primary))">
                  <i class="fas fa-user" style="font-size: 10px;"></i> {{ getParticipantName(getParticipantKey(g.primary)) }}
                </button>
              </div>
            </div>

            <!-- Shared or single-participant logistics (original form) -->
            <div v-if="!willCreateMultipleOrders || activeParticipantTab.logistics === 'shared'" class="subsection">
              <div class="subsection-header">
                <h4>Logistics & Accommodation</h4>
                <button @click="addNewLogistic" class="btn btn-sm btn-primary" type="button">
                  <i class="fas fa-plus me-1"></i>Add Logistics
                </button>
              </div>
              <!-- Logistics List -->
              <div class="table-wrapper mt-3">
                <table class="data-table" style="table-layout: fixed; width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 10%;">Type</th>
                      <th style="width: 30%;">Details</th>
                      <th style="width: 18%;">Dates</th>
                      <th style="width: 14%; text-align: right;">Amount</th>
                      <th style="width: 12%; text-align: center;">Status</th>
                      <th style="width: 10%; text-align: center;">Actions</th>
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
                          <div style="display: flex; gap: 8px; align-items: end;">
                            <input v-model="editLogistics.room_type" placeholder="Room type" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <div style="display: flex; flex-direction: column; width: 70px;">
                              <label style="font-size: 10px; color: #666; margin-bottom: 2px; font-weight: 600;">Rooms</label>
                              <input v-model.number="editLogistics.rooms" type="number" placeholder="0" min="1" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            </div>
                            <div style="display: flex; flex-direction: column; width: 70px;">
                              <label style="font-size: 10px; color: #666; margin-bottom: 2px; font-weight: 600;">Nights</label>
                              <input v-model.number="editLogistics.nights" type="number" placeholder="0" min="1" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            </div>
                          </div>
                        </div>

                        <!-- CHARTER Fields -->
                        <div v-else-if="editLogistics.logistics_type === 'CHARTER'" style="display: flex; gap: 8px; flex-direction: column;">
                          <div style="display: flex; gap: 8px; align-items: end;">
                            <input v-model="editLogistics.from_airport" placeholder="From (e.g., DAR)" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <input v-model="editLogistics.to_airport" placeholder="To (e.g., ARK)" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <div style="display: flex; flex-direction: column; width: 70px;">
                              <label style="font-size: 10px; color: #666; margin-bottom: 2px; font-weight: 600;">Seats</label>
                              <input v-model.number="editLogistics.seats" type="number" placeholder="0" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            </div>
                          </div>
                        </div>

                        <!-- TRANSFER/AIRPORT Fields -->
                        <div v-else-if="['TRANSFER', 'AIRPORT'].includes(editLogistics.logistics_type)" style="display: flex; gap: 8px; flex-direction: column;">
                          <div style="display: flex; gap: 8px;">
                            <input v-model="editLogistics.from_location" placeholder="From" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <input v-model="editLogistics.to_location" placeholder="To" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                          </div>
                        </div>

                        <!-- OTHER/Default -->
                        <div v-else>
                          <input v-model="editLogistics.description" placeholder="Description" class="form-input" style="margin: 0; font-size: 12px;" />
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                          <input v-model="editLogistics.start_datetime" type="date" class="form-input" style="margin: 0; font-size: 12px;" />
                          <input v-model="editLogistics.end_datetime" type="date" class="form-input" style="margin: 0; font-size: 12px;" />
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
                      <td style="vertical-align: middle;">
                        <span class="badge" :class="{'bg-primary': logistics.logistics_type === 'HOTEL', 'bg-info': logistics.logistics_type === 'CHARTER', 'bg-warning': logistics.logistics_type === 'TRANSFER', 'bg-secondary': !logistics.logistics_type}">
                          {{ logistics.logistics_type || 'OTHER' }}
                        </span>
                      </td>
                      <td style="vertical-align: middle;">
                        <strong v-if="logistics.hotel_name">{{ logistics.hotel_name }}</strong>
                        <strong v-else-if="logistics.from_location">{{ logistics.from_location }} → {{ logistics.to_location }}</strong>
                        <strong v-else-if="logistics.from_airport">{{ logistics.from_airport }} → {{ logistics.to_airport }}</strong>
                        <strong v-else>{{ logistics.description || '-' }}</strong>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                          <span v-if="logistics.rooms">{{ logistics.rooms }} room(s), {{ logistics.nights }} night(s)</span>
                          <span v-else-if="logistics.seats">{{ logistics.seats }} seats</span>
                        </div>
                      </td>
                      <td style="vertical-align: middle;">
                        <div style="font-size: 11px;">
                          <div v-if="logistics.start_datetime">{{ new Date(logistics.start_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</div>
                          <div v-if="logistics.end_datetime">→ {{ new Date(logistics.end_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</div>
                        </div>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(logistics.estimated_amount || 0) }}</span>
                      </td>
                      <td style="text-align: center; vertical-align: middle;">
                        <span class="badge" :class="{'bg-success': logistics.status === 'BOOKED', 'bg-warning': logistics.status === 'PLANNED', 'bg-info': logistics.status === 'COSTED'}">
                          {{ logistics.status }}
                        </span>
                      </td>
                      <td style="text-align: center; vertical-align: middle;">
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

            <!-- Multi-participant: per-participant logistics -->
            <div v-for="g in orderGroups" :key="'log-' + getParticipantKey(g.primary)"
                 v-show="willCreateMultipleOrders && activeParticipantTab.logistics !== 'shared' && activeParticipantTab.logistics === getParticipantKey(g.primary)"
                 class="subsection">
              <div class="subsection-header">
                <h4>Logistics for {{ getParticipantName(getParticipantKey(g.primary)) }}</h4>
                <button @click="addNewLogisticForParticipant(getParticipantKey(g.primary))" class="btn btn-sm btn-primary" type="button">
                  <i class="fas fa-plus me-1"></i>Add Logistics
                </button>
              </div>
              <div class="table-wrapper mt-3">
                <table class="data-table" style="table-layout: fixed; width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 10%;">Type</th>
                      <th style="width: 30%;">Details</th>
                      <th style="width: 18%;">Dates</th>
                      <th style="width: 14%; text-align: right;">Amount</th>
                      <th style="width: 12%; text-align: center;">Status</th>
                      <th style="width: 10%; text-align: center;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Add form rows for this participant -->
                    <tr v-for="(editLog, eIdx) in perParticipantData[getParticipantKey(g.primary)]?.editingLogistics || []" :key="'pe-' + eIdx" class="form-row">
                      <td>
                        <select v-model="editLog.logistics_type" class="form-select" style="margin: 0;">
                          <option value="">-- Select Type --</option>
                          <option v-for="type in logisticsTypes" :key="type.id || type.key" :value="type.key || type.name || type.id">
                            {{ type.key || type.name || type.id }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <div v-if="editLog.logistics_type === 'HOTEL'" style="display: flex; gap: 8px; flex-direction: column;">
                          <input v-model="editLog.hotel_name" placeholder="Hotel name" class="form-input" style="margin: 0; font-size: 12px;" />
                          <div style="display: flex; gap: 8px; align-items: end;">
                            <input v-model="editLog.room_type" placeholder="Room type" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                            <div style="display: flex; flex-direction: column; width: 70px;">
                              <label style="font-size: 10px; color: #666; margin-bottom: 2px; font-weight: 600;">Rooms</label>
                              <input v-model.number="editLog.rooms" type="number" placeholder="0" min="1" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            </div>
                            <div style="display: flex; flex-direction: column; width: 70px;">
                              <label style="font-size: 10px; color: #666; margin-bottom: 2px; font-weight: 600;">Nights</label>
                              <input v-model.number="editLog.nights" type="number" placeholder="0" min="1" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                            </div>
                          </div>
                        </div>
                        <div v-else-if="editLog.logistics_type === 'CHARTER'" style="display: flex; gap: 8px; align-items: end;">
                          <input v-model="editLog.from_airport" placeholder="From" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                          <input v-model="editLog.to_airport" placeholder="To" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                          <div style="display: flex; flex-direction: column; width: 70px;">
                            <label style="font-size: 10px; color: #666; margin-bottom: 2px; font-weight: 600;">Seats</label>
                            <input v-model.number="editLog.seats" type="number" placeholder="0" min="0" class="form-input" style="margin: 0; width: 70px; font-size: 12px;" />
                          </div>
                        </div>
                        <div v-else-if="['TRANSFER', 'AIRPORT'].includes(editLog.logistics_type)" style="display: flex; gap: 8px;">
                          <input v-model="editLog.from_location" placeholder="From" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                          <input v-model="editLog.to_location" placeholder="To" class="form-input" style="margin: 0; flex: 1; font-size: 12px;" />
                        </div>
                        <div v-else>
                          <input v-model="editLog.description" placeholder="Description" class="form-input" style="margin: 0; font-size: 12px;" />
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                          <input v-model="editLog.start_datetime" type="date" class="form-input" style="margin: 0; font-size: 12px;" />
                          <input v-model="editLog.end_datetime" type="date" class="form-input" style="margin: 0; font-size: 12px;" />
                        </div>
                      </td>
                      <td><input v-model.number="editLog.estimated_amount" type="number" placeholder="Amount" min="0" step="0.01" class="form-input" style="margin: 0; font-size: 12px;" /></td>
                      <td>
                        <select v-model="editLog.status" class="form-select" style="margin: 0; font-size: 12px;">
                          <option value="">-- Status --</option>
                          <option v-for="status in logisticsStatuses" :key="status.id || status.key" :value="status.key || status.name || status.id">{{ status.key || status.name || status.id }}</option>
                        </select>
                      </td>
                      <td style="text-align: center;">
                        <button @click="addLogisticsForParticipant(getParticipantKey(g.primary), eIdx)" class="btn btn-xs btn-success me-2" type="button"><i class="fas fa-check"></i></button>
                        <button @click="cancelEditingLogisticsForParticipant(getParticipantKey(g.primary), eIdx)" class="btn btn-xs btn-danger" type="button"><i class="fas fa-times"></i></button>
                      </td>
                    </tr>
                    <!-- Existing logistics for this participant -->
                    <tr v-for="(logistics, idx) in perParticipantData[getParticipantKey(g.primary)]?.logistics || []" :key="'pl-' + idx">
                      <td style="vertical-align: middle;">
                        <span class="badge" :class="{'bg-primary': logistics.logistics_type === 'HOTEL', 'bg-info': logistics.logistics_type === 'CHARTER', 'bg-warning': logistics.logistics_type === 'TRANSFER', 'bg-secondary': !logistics.logistics_type}">
                          {{ logistics.logistics_type || 'OTHER' }}
                        </span>
                      </td>
                      <td style="vertical-align: middle;">
                        <strong v-if="logistics.hotel_name">{{ logistics.hotel_name }}</strong>
                        <strong v-else-if="logistics.from_location">{{ logistics.from_location }} → {{ logistics.to_location }}</strong>
                        <strong v-else-if="logistics.from_airport">{{ logistics.from_airport }} → {{ logistics.to_airport }}</strong>
                        <strong v-else>{{ logistics.description || '-' }}</strong>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                          <span v-if="logistics.rooms">{{ logistics.rooms }} room(s), {{ logistics.nights }} night(s)</span>
                          <span v-else-if="logistics.seats">{{ logistics.seats }} seats</span>
                        </div>
                      </td>
                      <td style="vertical-align: middle;">
                        <div style="font-size: 11px;">
                          <div v-if="logistics.start_datetime">{{ new Date(logistics.start_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</div>
                          <div v-if="logistics.end_datetime">→ {{ new Date(logistics.end_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</div>
                        </div>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(logistics.estimated_amount || 0) }}</span>
                      </td>
                      <td style="text-align: center; vertical-align: middle;">
                        <span class="badge" :class="{'bg-success': logistics.status === 'BOOKED', 'bg-warning': logistics.status === 'PLANNED', 'bg-info': logistics.status === 'COSTED'}">{{ logistics.status }}</span>
                      </td>
                      <td style="text-align: center; vertical-align: middle;">
                        <button @click="removeLogisticsForParticipant(getParticipantKey(g.primary), idx)" class="btn btn-xs btn-danger" type="button"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="(perParticipantData[getParticipantKey(g.primary)]?.logistics || []).length === 0 && (perParticipantData[getParticipantKey(g.primary)]?.editingLogistics || []).length === 0" class="empty-state mt-3">
                No logistics added for {{ getParticipantName(getParticipantKey(g.primary)) }}
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

          <!-- PAYMENT PLAN SECTION -->
          <div v-if="showSections.payment" class="expandable-section">
            <!-- Participant Tabs (only when multi-order) -->
            <div v-if="willCreateMultipleOrders" class="participant-tab-bar mb-3">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <i class="fas fa-users" style="color: #6366f1; font-size: 13px;"></i>
                <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Payment plan per participant</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button type="button"
                  style="border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;"
                  :style="activeParticipantTab.payment === 'shared' ? 'background: #10b981; color: #fff; box-shadow: 0 2px 6px rgba(16,185,129,0.3);' : 'background: #f1f5f9; color: #64748b;'"
                  @click="switchToParticipantTab('payment', 'shared')">
                  <i class="fas fa-link" style="font-size: 10px;"></i> Shared
                </button>
                <button v-for="g in orderGroups" :key="'pay-' + getParticipantKey(g.primary)"
                  type="button"
                  style="border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;"
                  :style="activeParticipantTab.payment === getParticipantKey(g.primary) ? 'background: #3b82f6; color: #fff; box-shadow: 0 2px 6px rgba(59,130,246,0.3);' : 'background: #f1f5f9; color: #64748b;'"
                  @click="switchToParticipantTab('payment', getParticipantKey(g.primary))">
                  <i class="fas fa-user" style="font-size: 10px;"></i> {{ getParticipantName(getParticipantKey(g.primary)) }}
                </button>
              </div>
            </div>

            <!-- Per-participant installments (multi-order mode) -->
            <template v-if="willCreateMultipleOrders && activeParticipantTab.payment !== 'shared'">
              <div v-for="g in orderGroups" :key="'payc-' + getParticipantKey(g.primary)"
                   v-show="activeParticipantTab.payment !== 'shared' && activeParticipantTab.payment === getParticipantKey(g.primary)">
                <div class="subsection">
                  <!-- Payment Plan Template Selector for this participant -->
                  <div style="margin-bottom: 16px; padding: 14px; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px;">
                    <h5 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1e40af;">
                      <i class="fas fa-file-invoice-dollar" style="margin-right: 8px;"></i>Payment Plan for {{ getParticipantName(getParticipantKey(g.primary)) }}
                    </h5>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #1e3a8a;">Choose a template or add custom installments.</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                      <div v-for="template in availablePaymentPlanTemplates" :key="'pt-' + template.id"
                           @click="applyPaymentPlanTemplateForParticipant(getParticipantKey(g.primary), template)"
                           style="padding: 12px; background: white; border: 2px solid #dbeafe; border-radius: 4px; cursor: pointer; transition: all 0.2s; user-select: none;"
                           @mouseenter="$event.currentTarget.style.borderColor = '#60a5fa'"
                           @mouseleave="$event.currentTarget.style.borderColor = '#dbeafe'">
                        <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">{{ template.name }}</div>
                        <div style="font-size: 12px; color: #475569;">{{ template.stages.length }} stages</div>
                      </div>
                    </div>
                  </div>

                  <!-- Grand Total Banner -->
                  <div style="margin-bottom: 12px; padding: 10px 14px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: #2e7d32; font-weight: 500;">Order Grand Total:</span>
                    <span style="font-size: 18px; font-weight: 800; color: #1b5e20;">{{ formatCurrency(orderGrandTotal) }}</span>
                  </div>

                  <div class="subsection-header">
                    <h4>Installments</h4>
                    <button @click="perParticipantData[getParticipantKey(g.primary)].showInstallmentForm = true" class="btn btn-sm btn-primary" type="button">
                      <i class="fas fa-plus me-1"></i>Add Installment
                    </button>
                  </div>

                  <div class="table-wrapper mt-3">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th style="min-width: 50px">#</th>
                          <th style="min-width: 140px">Name</th>
                          <th style="min-width: 80px">%</th>
                          <th style="min-width: 120px">Amount</th>
                          <th style="min-width: 80px">Due Days</th>
                          <th style="min-width: 130px">Due Type</th>
                          <th style="min-width: 70px">Deposit</th>
                          <th style="min-width: 80px">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Add form row -->
                        <tr v-if="perParticipantData[getParticipantKey(g.primary)]?.showInstallmentForm" class="form-row">
                          <td class="text-center"><span class="badge bg-secondary">{{ (perParticipantData[getParticipantKey(g.primary)]?.installments || []).length + 1 }}</span></td>
                          <td><input v-model="newInstallment.name" type="text" placeholder="e.g. Deposit" class="form-input" style="font-size: 12px;" /></td>
                          <td><input v-model.number="newInstallment.percentage" type="number" placeholder="%" step="0.1" min="0" max="100" class="form-input" style="max-width: 80px;" /></td>
                          <td class="text-center"><span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(Math.round(((newInstallment.percentage || 0) / 100 * orderGrandTotal) * 100) / 100) }}</span></td>
                          <td><input v-model.number="newInstallment.dueDays" type="number" placeholder="Days" min="0" class="form-input" style="max-width: 80px;" /></td>
                          <td>
                            <select v-model="newInstallment.dueDaysType" class="form-select">
                              <option :value="null">Select...</option>
                              <option v-for="type in installmentDaysTypes" :key="type.value || type.id" :value="type.value || type.id">{{ type.label || type.name }}</option>
                            </select>
                          </td>
                          <td class="text-center"><input v-model="newInstallment.isDeposit" type="checkbox" class="form-checkbox" /></td>
                          <td class="text-center">
                            <button @click="addInstallmentForParticipant(getParticipantKey(g.primary), newInstallment); resetInstallmentForm()" class="btn btn-xs btn-success me-2" type="button"><i class="fas fa-check"></i></button>
                            <button @click="perParticipantData[getParticipantKey(g.primary)].showInstallmentForm = false; resetInstallmentForm()" class="btn btn-xs btn-danger" type="button"><i class="fas fa-times"></i></button>
                          </td>
                        </tr>
                        <!-- Existing installments -->
                        <tr v-for="(inst, idx) in perParticipantData[getParticipantKey(g.primary)]?.installments || []" :key="'pi-' + idx">
                          <td class="text-center"><span class="badge bg-primary">{{ inst.sequenceNo }}</span></td>
                          <td>{{ inst.name || inst.narration || `Installment ${inst.sequenceNo}` }}</td>
                          <td class="text-center"><span class="badge bg-warning" style="font-size: 12px;">{{ inst.percentage }}%</span></td>
                          <td class="text-center"><span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(inst.calculatedAmount || Math.round(((inst.percentage || 0) / 100 * orderGrandTotal) * 100) / 100) }}</span></td>
                          <td class="text-center">{{ inst.dueDays }}</td>
                          <td>{{ inst.dueDaysType }}</td>
                          <td class="text-center">
                            <i v-if="inst.isDeposit" class="fas fa-check text-success"></i>
                            <i v-else class="fas fa-times text-muted"></i>
                          </td>
                          <td class="text-center">
                            <button @click="removeInstallmentForParticipant(getParticipantKey(g.primary), idx)" class="btn btn-xs btn-danger" type="button"><i class="fas fa-trash"></i></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-if="(perParticipantData[getParticipantKey(g.primary)]?.installments || []).length === 0" class="empty-state mt-3">
                    No installments for {{ getParticipantName(getParticipantKey(g.primary)) }}
                  </div>
                </div>
              </div>
            </template>

            <!-- Shared or single-participant (original) -->
            <div v-if="!willCreateMultipleOrders || activeParticipantTab.payment === 'shared'" class="subsection">
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

              <!-- Grand Total Reference Banner -->
              <div style="margin-bottom: 12px; padding: 10px 14px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; color: #2e7d32; font-weight: 500;">Order Grand Total:</span>
                <span style="font-size: 18px; font-weight: 800; color: #1b5e20;">{{ formatCurrency(orderGrandTotal) }}</span>
              </div>

              <!-- Warning if payments exist -->
              <div v-if="hasExistingPayments" style="margin-bottom: 12px; padding: 10px 14px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #e65100; font-weight: 500;">
                  ⚠️ Payments have already been recorded. Installment amounts will <strong>not</strong> auto-recalculate to preserve accounting integrity.
                </p>
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
                      <th style="min-width: 50px">#</th>
                      <th style="min-width: 140px">Name</th>
                      <th style="min-width: 80px">%</th>
                      <th style="min-width: 120px">Calculated Amount</th>
                      <th style="min-width: 80px">Due Days</th>
                      <th style="min-width: 130px">Due Type</th>
                      <th style="min-width: 70px">Deposit</th>
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
                        <input v-model="newInstallment.name" type="text" placeholder="e.g. Deposit" class="form-input" style="font-size: 12px;" />
                      </td>
                      <td>
                        <input v-model.number="newInstallment.percentage" type="number" placeholder="%" step="0.1" min="0" max="100" class="form-input" style="max-width: 80px;" />
                      </td>
                      <td class="text-center">
                        <span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(Math.round(((newInstallment.percentage || 0) / 100 * orderGrandTotal) * 100) / 100) }}</span>
                      </td>
                      <td>
                        <input v-model.number="newInstallment.dueDays" type="number" placeholder="Days" min="0" class="form-input" style="max-width: 80px;" />
                      </td>
                      <td>
                        <select v-model="newInstallment.dueDaysType" class="form-select">
                          <option :value="null">Select...</option>
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

                    <!-- Existing Installments (use computedInstallments for live amounts) -->
                    <tr v-for="(inst, idx) in computedInstallments" :key="idx">
                      <td class="text-center">
                        <span class="badge bg-primary">{{ inst.sequenceNo }}</span>
                      </td>
                      <td>{{ inst.name || inst.narration || `Installment ${inst.sequenceNo}` }}</td>
                      <td class="text-center">
                        <span class="badge bg-warning" style="font-size: 12px;">{{ inst.percentage }}%</span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-info" style="font-size: 12px;">{{ formatCurrency(inst.calculatedAmount) }}</span>
                      </td>
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

                  <div style="padding: 12px; background: white; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Total Percentage</div>
                    <div style="font-size: 18px; font-weight: 700;" :style="{ color: installmentPercentageValid ? '#8b5cf6' : '#ef4444' }">
                      {{ totalInstallmentPercentage.toFixed(1) }}%
                    </div>
                    <div v-if="!installmentPercentageValid && form.installments.length > 0" style="font-size: 10px; color: #ef4444; margin-top: 2px;">
                      Must equal 100%
                    </div>
                  </div>

                  <div style="padding: 12px; background: white; border-radius: 4px; border: 1px solid #cbd5e1;">
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
                      <div style="text-align: right;">
                        <div style="font-weight: 600; color: #8b5cf6;">{{ inst.percentage }}%</div>
                        <div style="font-weight: 600; color: #10b981; font-size: 11px;">{{ formatCurrency(inst.calculatedAmount) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PAYMENT TRACKING SECTION (Only shown when editing existing order) -->
            <div v-if="isEdit && paymentSummary" style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <h5 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 600; color: #0c4a6e;">
                <i class="fas fa-credit-card" style="margin-right: 8px;"></i>Payment Status & Recording
              </h5>
              
              <div v-if="paymentSummary.installment_count > 0" class="installment-payments-list">
                <div v-for="(inst, idx) in paymentSummary.installments || []" :key="idx" class="payment-item">
                  <div class="payment-header">
                    <div class="payment-title">
                      {{ inst.narration }}
                      <span v-if="inst.is_fully_paid" class="payment-badge completed">PAID</span>
                      <span v-else-if="inst.status === 'PARTIALLY_PAID'" class="payment-badge partial">{{ inst.payment_percentage }}% PAID</span>
                      <span v-else class="payment-badge notstarted">NOT PAID</span>
                    </div>
                  </div>
                  
                  <div class="payment-details">
                    <div class="detail">
                      <span class="detail-label">Due:</span>
                      <span class="detail-value">{{ formatCurrency(inst.amount_due) }}</span>
                    </div>
                    <div class="detail">
                      <span class="detail-label">Paid:</span>
                      <span class="detail-value">{{ formatCurrency(inst.amount_paid) }}</span>
                    </div>
                    <div class="detail">
                      <span class="detail-label">Remaining:</span>
                      <span class="detail-value">{{ formatCurrency(inst.remaining_balance) }}</span>
                    </div>
                  </div>
                  
                  <div class="payment-progress">
                    <div class="progress-bar">
                      <div class="progress" :style="{ width: inst.payment_percentage + '%', backgroundColor: getStatusColor(inst.status) }"></div>
                    </div>
                    <div class="progress-label">{{ inst.payment_percentage }}% Paid</div>
                  </div>
                  
                  <div class="payment-actions">
                    <button 
                      @click="openPaymentModal(inst)"
                      :disabled="inst.is_fully_paid"
                      class="btn btn-primary btn-sm"
                      type="button"
                    >
                      <i class="fas fa-plus"></i> Record Payment
                    </button>
                    <button 
                      v-if="inst.payment_count > 0"
                      @click="openPaymentHistory(inst)"
                      class="btn btn-secondary btn-sm"
                      type="button"
                    >
                      <i class="fas fa-history"></i> History ({{ inst.payment_count }})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="section-navigation mt-4">
              <button @click="goToPreviousSection" class="btn btn-secondary" type="button" :disabled="getCurrentSectionIndex() === 0">
                <i class="fas fa-arrow-left me-2"></i>Previous
              </button>
              <button @click="submit" class="btn btn-success" type="button" :disabled="saving">
                <i class="fas fa-save me-2"></i>{{ saving ? 'Saving...' : isEdit ? 'Update Order' : 'Save Order' }}
              </button>
            </div>
          </div>

          <!-- ADDITIONAL DETAILS SECTION -->
          <div v-if="showSections.preferences" class="expandable-section">
            <div class="section-inner-header">
              <h4>Additional Details</h4>
            </div>

            <!-- Participant Tabs (only when multi-order) -->
            <div v-if="willCreateMultipleOrders" class="participant-tab-bar mb-3">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <i class="fas fa-users" style="color: #6366f1; font-size: 13px;"></i>
                <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Preferences per participant</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button type="button"
                  style="border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;"
                  :style="activeParticipantTab.preferences === 'shared' ? 'background: #10b981; color: #fff; box-shadow: 0 2px 6px rgba(16,185,129,0.3);' : 'background: #f1f5f9; color: #64748b;'"
                  @click="switchToParticipantTab('preferences', 'shared')">
                  <i class="fas fa-link" style="font-size: 10px;"></i> Shared
                </button>
                <button v-for="g in orderGroups" :key="'pref-' + getParticipantKey(g.primary)"
                  type="button"
                  style="border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px;"
                  :style="activeParticipantTab.preferences === getParticipantKey(g.primary) ? 'background: #3b82f6; color: #fff; box-shadow: 0 2px 6px rgba(59,130,246,0.3);' : 'background: #f1f5f9; color: #64748b;'"
                  @click="switchToParticipantTab('preferences', getParticipantKey(g.primary))">
                  <i class="fas fa-user" style="font-size: 10px;"></i> {{ getParticipantName(getParticipantKey(g.primary)) }}
                </button>
              </div>
            </div>

            <!-- Per-participant preferences (multi-order mode) -->
            <template v-if="willCreateMultipleOrders && activeParticipantTab.preferences !== 'shared'">
              <div v-for="g in orderGroups" :key="'prefc-' + getParticipantKey(g.primary)"
                   v-show="activeParticipantTab.preferences !== 'shared' && activeParticipantTab.preferences === getParticipantKey(g.primary)" class="subsection">
                <div class="subsection-group">
                  <h5 style="display: flex; align-items: center; gap: 0.5rem; color: #333; margin-bottom: 1.2rem; font-size: 0.95rem; font-weight: 600;">
                    <i class="fas fa-utensils" style="color: #ff6b35;"></i>
                    Dietary & Beverage Preferences for {{ getParticipantName(getParticipantKey(g.primary)) }}
                  </h5>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <div class="form-section" style="display: flex; flex-direction: column; height: 100px;">
                      <label class="form-label">Food Preferences</label>
                      <textarea v-model="perParticipantData[getParticipantKey(g.primary)].preferences.food_preferences" @input="formatBulletTextForParticipant(getParticipantKey(g.primary), 'food')" placeholder="Enter each preference on a new line..." class="form-textarea" rows="2" style="flex: 1; resize: none; background: white; position: relative; z-index: 2;"></textarea>
                    </div>
                    <div class="form-section" style="display: flex; flex-direction: column; height: 100px;">
                      <label class="form-label">Beverage Preferences</label>
                      <textarea v-model="perParticipantData[getParticipantKey(g.primary)].preferences.beverage_preferences" @input="formatBulletTextForParticipant(getParticipantKey(g.primary), 'beverage')" placeholder="Enter each preference on a new line..." class="form-textarea" rows="2" style="flex: 1; resize: none; background: white; position: relative; z-index: 2;"></textarea>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 0;">
                    <div class="form-section" style="display: flex; flex-direction: column; height: 100px;">
                      <label class="form-label">Alcohol Preference</label>
                      <textarea v-model="perParticipantData[getParticipantKey(g.primary)].preferences.alcohol_preferences" @input="formatBulletTextForParticipant(getParticipantKey(g.primary), 'alcohol')" placeholder="Enter each preference on a new line..." class="form-textarea" rows="2" style="flex: 1; resize: none; background: white; position: relative; z-index: 2;"></textarea>
                    </div>
                    <div class="form-section" style="display: flex; flex-direction: column;">
                      <label class="form-label" style="margin-bottom: 0.6rem; font-weight: 500; color: #555;">⚠️ Allergies</label>
                      <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.8rem;">
                        <input v-model="perParticipantData[getParticipantKey(g.primary)].newAllergy" type="text" placeholder="e.g., Peanuts, Dairy..." class="form-input" style="flex: 1; padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;" />
                        <button @click="addAllergyForParticipant(getParticipantKey(g.primary))" class="btn btn-primary" type="button" style="padding: 0.65rem 1rem; flex-shrink: 0; height: auto; border-radius: 4px;">
                          <i class="fas fa-plus"></i> Add
                        </button>
                      </div>
                      <div v-if="perParticipantData[getParticipantKey(g.primary)]?.preferences?.allergies?.length > 0" style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
                        <span v-for="(allergy, aidx) in perParticipantData[getParticipantKey(g.primary)].preferences.allergies" :key="aidx" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.8rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 20px; font-size: 0.85rem; color: #856404;">
                          {{ allergy }}
                          <button @click="removeAllergyForParticipant(getParticipantKey(g.primary), aidx)" type="button" style="background: none; border: none; color: #856404; cursor: pointer; font-size: 1.1rem; padding: 0; line-height: 1;">&times;</button>
                        </span>
                      </div>
                      <div v-else class="text-muted" style="font-size: 0.85rem; color: #999;">No allergies added</div>
                    </div>
                  </div>
                </div>
                <div class="subsection-group">
                  <h5 style="display: flex; align-items: center; gap: 0.5rem; color: #333; margin: 0 0 0.8rem 0; font-size: 0.95rem; font-weight: 600;">
                    <i class="fas fa-sticky-note" style="color: #3498db;"></i>
                    Special Requests for {{ getParticipantName(getParticipantKey(g.primary)) }}
                  </h5>
                  <div class="form-section" style="margin-bottom: 0;">
                    <textarea v-model="perParticipantData[getParticipantKey(g.primary)].preferences.special_requests" placeholder="Add special requests..." class="form-textarea" rows="2"></textarea>
                  </div>
                </div>
              </div>
            </template>

            <!-- Shared or single-participant preferences (original) -->
            <div v-if="!willCreateMultipleOrders || activeParticipantTab.preferences === 'shared'" class="subsection">
              <!-- DIETARY PREFERENCES SUBSECTION -->
              <div class="subsection-group">
                <h5 style="display: flex; align-items: center; gap: 0.5rem; color: #333; margin-bottom: 1.2rem; font-size: 0.95rem; font-weight: 600;">
                  <i class="fas fa-utensils" style="color: #ff6b35;"></i>
                  Dietary & Beverage Preferences
                </h5>

                <!-- Row 1: Food & Beverage in horizontal layout -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div class="form-section" style="display: flex; flex-direction: column; height: 100px; position: relative;">
                    <label class="form-label">Food Preferences</label>
                    <div style="position: relative; flex: 1; display: flex;">
                      <textarea v-model="form.preferences.food_preferences" @input="formatBulletText('food')" placeholder="Enter each preference on a new line..." class="form-textarea" rows="2" style="flex: 1; resize: none; background: white; position: relative; z-index: 2;"></textarea>
                    </div>
                  </div>
                  <div class="form-section" style="display: flex; flex-direction: column; height: 100px; position: relative;">
                    <label class="form-label">Beverage Preferences</label>
                    <div style="position: relative; flex: 1; display: flex;">
                      <textarea v-model="form.preferences.beverage_preferences" @input="formatBulletText('beverage')" placeholder="Enter each preference on a new line..." class="form-textarea" rows="2" style="flex: 1; resize: none; background: white; position: relative; z-index: 2;"></textarea>
                    </div>
                  </div>
                </div>

                <!-- Row 2: Alcohol Preference & Allergies Input in horizontal layout -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 0;">
                  <div class="form-section" style="display: flex; flex-direction: column; height: 100px; position: relative;">
                    <label class="form-label">Alcohol Preference</label>
                    <div style="position: relative; flex: 1; display: flex;">
                      <textarea v-model="form.preferences.alcohol_preferences" @input="formatBulletText('alcohol')" placeholder="Enter each preference on a new line..." class="form-textarea" rows="2" style="flex: 1; resize: none; background: white; position: relative; z-index: 2;"></textarea>
                    </div>
                  </div>

                  <!-- Allergies Input -->
                  <div class="form-section" style="display: flex; flex-direction: column;">
                    <label class="form-label" style="margin-bottom: 0.6rem; font-weight: 500; color: #555;">
                      ⚠️ Allergies
                    </label>
                    <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.8rem;">
                      <input 
                        v-model="newAllergy" 
                        type="text" 
                        placeholder="e.g., Peanuts, Dairy, Shellfish..." 
                        class="form-input" 
                        style="flex: 1; padding: 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;" />
                      <button 
                        @click="addAllergy" 
                        class="btn btn-primary" 
                        type="button" 
                        style="padding: 0.65rem 1rem; flex-shrink: 0; height: auto; border-radius: 4px;">
                        <i class="fas fa-plus"></i> Add
                      </button>
                    </div>
                    <div v-if="form.preferences.allergies && form.preferences.allergies.length > 0" class="allergy-tags" style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
                      <span v-for="(allergy, idx) in form.preferences.allergies" :key="idx" class="tag" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.8rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 20px; font-size: 0.85rem; color: #856404;">
                        {{ allergy }}
                        <button @click="removeAllergy(idx)" class="tag-remove" type="button" style="background: none; border: none; color: #856404; cursor: pointer; font-size: 1.1rem; padding: 0; line-height: 1;">&times;</button>
                      </span>
                    </div>
                    <div v-else class="text-muted" style="font-size: 0.85rem; color: #999; margin-top: 0.3rem;">No allergies added</div>
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
              <button @click="goToNextSection" class="btn btn-primary" type="button" :disabled="getCurrentSectionIndex() === sectionOrder.length - 1">
                Next<i class="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <!-- PAYMENT MODAL -->
    <div v-if="showPaymentModal" class="modal-overlay" @click="closePaymentModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Record Payment</h3>
          <button class="btn-close" @click="closePaymentModal" type="button">✕</button>
        </div>
        
        <div class="modal-body" v-if="selectedInstallmentForPayment">
          <!-- Installment Info -->
          <div class="info-section">
            <div class="info-row">
              <span class="label">Installment:</span>
              <span class="value">{{ selectedInstallmentForPayment.narration }}</span>
            </div>
            <div class="info-row">
              <span class="label">Amount Due:</span>
              <span class="value">{{ formatCurrency(selectedInstallmentForPayment.amount_due) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Amount Paid:</span>
              <span class="value">{{ formatCurrency(selectedInstallmentForPayment.amount_paid) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Remaining Balance:</span>
              <span class="value" style="color: #dc3545;">{{ formatCurrency(selectedInstallmentForPayment.remaining_balance) }}</span>
            </div>
          </div>

          <!-- Payment Form -->
          <div class="form-group">
            <label>Amount Paid <span class="req">*</span></label>
            <input 
              v-model.number="newPayment.amount_paid"
              type="number" 
              placeholder="Enter amount to pay"
              step="0.01"
              :max="selectedInstallmentForPayment.remaining_balance"
              min="0"
              class="form-input"
            />
            <small>Max: {{ formatCurrency(selectedInstallmentForPayment.remaining_balance) }}</small>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Journal Voucher ID <span class="req">*</span></label>
              <input 
                v-model.number="newPayment.journal_voucher_id"
                type="number"
                placeholder="Enter voucher ID"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Bank Account <span class="req">*</span></label>
              <input 
                v-model.number="newPayment.account_id"
                type="number"
                placeholder="Enter account ID"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Narration</label>
            <textarea 
              v-model="newPayment.narration"
              placeholder="Payment description"
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>

          <div class="form-section-title">Payment Method</div>

          <div class="form-grid">
            <div class="form-group">
              <label>Instrument Type <span class="req">*</span></label>
              <select v-model="newPayment.instrument_type" class="form-input">
                <option :value="null">Select...</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            <div class="form-group">
              <label>Reference/Check Number</label>
              <input 
                v-model="newPayment.instrument_number"
                type="text"
                placeholder="e.g., CHK-001, TXN-123"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Payment Date</label>
              <input 
                v-model="newPayment.instrument_date"
                type="date"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Payee Name</label>
              <input 
                v-model="newPayment.payee"
                type="text"
                placeholder="Who made the payment?"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group" v-if="newPayment.instrument_type === 'BANK_TRANSFER'">
            <label>Bank ID</label>
            <input 
              v-model.number="newPayment.bank_id"
              type="number"
              placeholder="Enter bank ID"
              class="form-input"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closePaymentModal" type="button" class="btn btn-secondary">Cancel</button>
          <button @click="recordPayment" type="button" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Recording...' : 'Record Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- PAYMENT HISTORY MODAL -->
    <div v-if="showPaymentHistory" class="modal-overlay" @click="showPaymentHistory = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Payment History</h3>
          <button class="btn-close" @click="showPaymentHistory = false" type="button">✕</button>
        </div>
        
        <div class="modal-body">
          <div v-if="paymentHistory.length === 0" class="empty-state">
            <p>No payments recorded yet</p>
          </div>
          <div v-else class="history-list">
            <div v-for="(payment, idx) in paymentHistory" :key="idx" class="history-item">
              <div class="history-date">{{ new Date(payment.date).toLocaleDateString() }}</div>
              <div class="history-details">
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">{{ formatCurrency(payment.amount) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Method:</span>
                  <span class="value">{{ payment.instrument_type }}</span>
                </div>
                <div v-if="payment.instrument_number" class="detail-row">
                  <span class="label">Reference:</span>
                  <span class="value">{{ payment.instrument_number }}</span>
                </div>
                <div v-if="payment.narration" class="detail-row">
                  <span class="label">Narration:</span>
                  <span class="value">{{ payment.narration }}</span>
                </div>
                <div v-if="payment.payee" class="detail-row">
                  <span class="label">Payee:</span>
                  <span class="value">{{ payment.payee }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showPaymentHistory = false" type="button" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrderStore } from '@/stores/bushman/order-store'
import { useAppOptionStore } from '@/stores/app-option'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import Swal from 'sweetalert2'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const appOptionStore = useAppOptionStore()
const toast = useToast()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

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

// PDF generation state
const generatingPdf = ref(false)
const showPdfDropdown = ref(false)

// Enquiry participants raw data — used to detect independent participants and split orders
const enquiryParticipantsRaw = ref<any[]>([])

// Computed: order groups based on independent participants
// Each independent participant gets their own order.
// Dependent participants are attached to the participant they depend on.
// Helper: get a stable key for a participant (entity_id preferred, falls back to participant id)
const getParticipantKey = (participant: any): string => {
  if (participant.entity_id) return String(participant.entity_id)
  return `pid-${participant.id}`
}

const orderGroups = computed(() => {
  const participants = enquiryParticipantsRaw.value
  if (participants.length <= 1) return [] // No split needed for 0 or 1 participant
  
  const independents = participants.filter((p: any) => p.is_independent)
  if (independents.length <= 1) return [] // Only 1 independent → no split
  
  // Build groups: each independent participant + their dependents
  const groups: Array<{ primary: any; dependents: any[]; party: any }> = []
  for (const indep of independents) {
    const dependents = participants.filter(
      (p: any) => !p.is_independent && p.dependent_on_participant_id === indep.id
    )
    // Find the matching party in form.parties by entity_id (only if entity_id exists)
    const matchingParty = indep.entity_id
      ? form.parties.find((p: any) => String(p.entity) === String(indep.entity_id))
      : null
    // Build a fallback party — for participants without entity_id, display as "Unknown"
    const fallbackParty = matchingParty || {
      role: 'CUSTOMER',
      entity: indep.entity_id ? String(indep.entity_id) : '',
      entity_name: indep.entity?.full_name || indep.entity?.name || indep.entity_name || indep.name || 'Unknown',
      contact_person: indep.contact_name || '',
      contact_phone: indep.contact_phone || '',
      email: indep.contact_email || '',
    }
    groups.push({
      primary: indep,
      dependents,
      party: fallbackParty
    })
  }
  return groups
})

const willCreateMultipleOrders = computed(() => orderGroups.value.length > 1)

// ─── Per-Participant Data (for multi-order split) ───
// When multiple independent participants exist, each gets their own logistics,
// installments, and preferences. Keyed by entity_id string.
const perParticipantData = reactive<Record<string, {
  logistics: any[]
  installments: any[]
  preferences: {
    food_preferences: string
    beverage_preferences: string
    allergies: string[]
    alcohol_preferences: string
    special_requests: string
  }
  editingLogistics: any[]
  showInstallmentForm: boolean
  newAllergy: string
}>>({})

// Active participant tab for each section — 'shared' means all participants use the same data
const activeParticipantTab = reactive<Record<string, string>>({
  logistics: 'shared',
  payment: 'shared',
  preferences: 'shared',
})

// Track which participants have been individually customized
const customizedParticipants = reactive<Record<string, Set<string>>>({
  logistics: new Set(),
  payment: new Set(),
  preferences: new Set(),
})

// Initialize per-participant data when order groups change
watch(orderGroups, (groups) => {
  if (groups.length <= 1) return
  for (const g of groups) {
    const key = getParticipantKey(g.primary)
    if (!perParticipantData[key]) {
      // Start empty — will be populated when user switches to individual tab
      perParticipantData[key] = {
        logistics: [],
        installments: [],
        preferences: { food_preferences: '', beverage_preferences: '', allergies: [], alcohol_preferences: '', special_requests: '' },
        editingLogistics: [],
        showInstallmentForm: false,
        newAllergy: '',
      }
    }
  }
}, { immediate: true })

// When switching from shared to individual tab, copy shared data as starting point
const switchToParticipantTab = (section: string, entityId: string) => {
  activeParticipantTab[section] = entityId
  if (entityId === 'shared') return
  const data = perParticipantData[entityId]
  if (!data) return
  // Only copy shared data the first time user switches to this participant
  if (!customizedParticipants[section]?.has(entityId)) {
    if (section === 'logistics') {
      data.logistics = JSON.parse(JSON.stringify(form.logistics))
    } else if (section === 'payment') {
      data.installments = JSON.parse(JSON.stringify(form.installments))
    } else if (section === 'preferences') {
      data.preferences = JSON.parse(JSON.stringify(form.preferences))
    }
    customizedParticipants[section]?.add(entityId)
  }
}

// Helper: get current participant's data for a section, or the shared form data
const getParticipantLogistics = (entityId: string) => perParticipantData[entityId]?.logistics || form.logistics
const getParticipantInstallments = (entityId: string) => perParticipantData[entityId]?.installments || form.installments
const getParticipantPreferences = (entityId: string) => perParticipantData[entityId]?.preferences || form.preferences

// Helper: get entity name for a participant tab
const getParticipantName = (key: string): string => {
  if (!key || key === 'null' || key === 'undefined') return 'Unknown'
  // 1) Check form.parties (by entity_id)
  const party = form.parties.find((p: any) => String(p.entity) === key)
  if (party?.entity_name) return party.entity_name
  // 2) Fallback: check raw enquiry participants (by entity_id OR participant id via pid- prefix)
  let rawPart: any = null
  if (key.startsWith('pid-')) {
    const pid = key.replace('pid-', '')
    rawPart = enquiryParticipantsRaw.value.find((p: any) => String(p.id) === pid)
  } else {
    rawPart = enquiryParticipantsRaw.value.find((p: any) => String(p.entity_id) === key)
  }
  if (rawPart) {
    const name = rawPart.entity?.full_name || rawPart.entity?.name || rawPart.entity_name || rawPart.name
    if (name) return name
  }
  // 3) Check orderGroups which may have resolved the party
  const group = orderGroups.value.find((g: any) => getParticipantKey(g.primary) === key)
  if (group?.party?.entity_name) return group.party.entity_name
  return 'Unknown'
}

// Per-participant logistics helpers
const addNewLogisticForParticipant = (entityId: string) => {
  const data = perParticipantData[entityId]
  if (!data) return
  data.editingLogistics.push({
    logistics_type: '',
    hotel_name: '',
    room_type: '',
    rooms: 0,
    nights: 0,
    from_airport: '',
    to_airport: '',
    flight_date: '',
    seats: 0,
    from_location: '',
    to_location: '',
    transfer_date: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    estimated_amount: 0,
    status: 'PLANNED',
    notes: ''
  })
}

const addLogisticsForParticipant = (entityId: string, eIdx: number) => {
  const data = perParticipantData[entityId]
  if (!data) return
  const editItem = data.editingLogistics[eIdx]
  if (!editItem || !editItem.logistics_type) return
  data.logistics.push({ ...editItem })
  data.editingLogistics.splice(eIdx, 1)
}

const cancelEditingLogisticsForParticipant = (entityId: string, eIdx: number) => {
  const data = perParticipantData[entityId]
  if (!data) return
  data.editingLogistics.splice(eIdx, 1)
}

const removeLogisticsForParticipant = (entityId: string, idx: number) => {
  const data = perParticipantData[entityId]
  if (!data) return
  data.logistics.splice(idx, 1)
}

// Per-participant installment helpers
const addInstallmentForParticipant = (entityId: string, newInst: any) => {
  const data = perParticipantData[entityId]
  if (!data) return
  data.installments.push({
    sequenceNo: data.installments.length + 1,
    name: newInst.name || `Installment ${data.installments.length + 1}`,
    narration: newInst.name || `Installment ${data.installments.length + 1}`,
    percentage: newInst.percentage || 0,
    calculatedAmount: Math.round(((newInst.percentage || 0) / 100 * orderGrandTotal.value) * 100) / 100,
    dueDays: newInst.dueDays || 0,
    dueDaysType: newInst.dueDaysType || null,
    isDeposit: newInst.isDeposit || false,
  })
  data.showInstallmentForm = false
}

const removeInstallmentForParticipant = (entityId: string, idx: number) => {
  const data = perParticipantData[entityId]
  if (!data) return
  data.installments.splice(idx, 1)
  // Resequence
  data.installments.forEach((inst: any, i: number) => { inst.sequenceNo = i + 1 })
}

// Per-participant allergy helpers
const addAllergyForParticipant = (entityId: string) => {
  const data = perParticipantData[entityId]
  if (!data || !data.newAllergy.trim()) return
  if (!data.preferences.allergies.includes(data.newAllergy.trim())) {
    data.preferences.allergies.push(data.newAllergy.trim())
  }
  data.newAllergy = ''
}

const removeAllergyForParticipant = (entityId: string, idx: number) => {
  const data = perParticipantData[entityId]
  if (!data) return
  data.preferences.allergies.splice(idx, 1)
}

// Item-level validation errors (keyed by item index)
const itemErrors = ref<Record<number, string>>({})

// Payment Management State
const paymentSummary = ref<any>(null)
const paymentHistory = ref<any[]>([])
const showPaymentModal = ref(false)
const selectedInstallmentForPayment = ref<any>(null)
const showPaymentHistory = ref(false)
const loadingPayments = ref(false)

const newPayment = reactive({
  amount_paid: 0,
  journal_voucher_id: null,
  account_id: null,
  narration: '',
  reference_number: '',
  instrument_type: 'CASH',
  instrument_number: '',
  instrument_date: new Date().toISOString().split('T')[0],
  payee: '',
  bank_id: null,
})

const showSections = reactive({
  items: false,
  logistics: false,
  payment: false,
  preferences: false,
})

const form = reactive({
  // BASIC INFO
  orderNumber: '',
  orderType: '', // Will be populated from backend
  status: '', // Will be populated from backend
  orderDate: new Date().toISOString().split('T')[0],
  currency: '', // Will be populated from backend
  exchangeRate: 1.0,
  vat: 0,
  expenseIncluded: 0,
  
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
  status: '', // Will be populated from backend
  notes: '',
})

const newInstallment = reactive({
  sequenceNo: 1,
  percentage: 0,
  dueDaysType: '', // Will be populated from backend
  dueDays: 0,
  isDeposit: false,
  name: '',
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
  
  // If backend returns data, use mapped values; otherwise return empty
  if (mapped.length > 0) {
    return mapped
  }
  
  return [] // No hardcoded fallback - must fetch from backend
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
  
  // If backend returns data, use mapped values; otherwise return empty
  if (mapped.length > 0) {
    return mapped
  }
  
  return [] // No hardcoded fallback - must fetch from backend
})
const participantTypes = computed(() => 
  orderStore.participantTypes && orderStore.participantTypes.length > 0 
    ? orderStore.participantTypes.map((p: any) => p.id || p.code || p)
    : [] // No hardcoded fallback - must fetch from backend
)
const installmentAmountTypes = computed(() => orderStore.installmentAmountTypes || [])
const installmentDaysTypes = computed(() => orderStore.installmentDaysTypes || [])

// Available payment plan templates for quick setup
const availablePaymentPlanTemplates = computed(() => orderStore.getPaymentPlanTemplates())

// ─── Dynamic Grand Total Calculation ───
const itemsSubtotal = computed((): number => {
  return form.items.reduce((sum: number, item: any) => {
    const qty = Number(item.quantity) || 0
    const rate = Number(item.rate) || 0
    const disc = Number(item.discount) || 0
    const lineTotal = qty * rate - disc
    return sum + lineTotal
  }, 0)
})

const logisticsTotal = computed((): number => {
  return form.logistics.reduce((sum: number, l: any) => {
    return sum + (Number(l.estimated_amount) || 0)
  }, 0)
})

/** VAT amount calculated on items subtotal only */
const vatAmount = computed((): number => {
  const pct = Number(form.vat) || 0
  return Math.round((pct / 100) * itemsSubtotal.value * 100) / 100
})

const orderGrandTotal = computed((): number => {
  const total = itemsSubtotal.value + logisticsTotal.value + vatAmount.value + (Number(form.expenseIncluded) || 0)
  return Math.round(total * 100) / 100
})

/** Whether ANY payment has been recorded against this order (edit mode only) */
const hasExistingPayments = computed((): boolean => {
  if (!paymentSummary.value) return false
  return Number(paymentSummary.value.total_paid) > 0
})

/** Compute the calculated amount for each installment from its percentage */
const computedInstallments = computed(() => {
  return form.installments.map((inst: any) => {
    const pct = Number(inst.percentage) || 0
    const calculatedAmount = Math.round(((pct / 100) * orderGrandTotal.value) * 100) / 100
    return { ...inst, calculatedAmount }
  })
})

const totalInstallmentPercentage = computed((): number => {
  return form.installments.reduce((sum: number, inst: any) => sum + (Number(inst.percentage) || 0), 0)
})

const installmentPercentageValid = computed((): boolean => {
  if (form.installments.length === 0) return true
  return Math.abs(totalInstallmentPercentage.value - 100) < 0.01
})

// Calculate total order amount (legacy helper used by store)
const calculateTotalOrderAmount = (): number => {
  return orderGrandTotal.value
}

const filteredQuotations = computed(() => {
  if (!form.enquiryId) return []
  return quotations.value.filter((q: any) =>
    (q.enquiry_id === parseInt(form.enquiryId) ||
    q.sales_enquiry_id === parseInt(form.enquiryId)) &&
    (q.status === 'LOCKED' || q.status === 'locked')
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

// Installment summary computed properties (kept for template compatibility)
const hasPercentageInstallments = computed(() => form.installments.length > 0)
const hasFixedInstallments = computed(() => false) // all are percentage-based now

const getTotalInstallmentPercentage = (): number => totalInstallmentPercentage.value

const getTotalFixedInstallmentAmount = (): number => {
  return computedInstallments.value.reduce((sum: number, inst: any) => sum + (inst.calculatedAmount || 0), 0)
}

const sortedInstallmentsByDueDays = computed(() => {
  return [...computedInstallments.value].sort((a: any, b: any) => (a.dueDays || 0) - (b.dueDays || 0))
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
    // Ensure rooms & nights are at least 1
    item.rooms = Number(item.rooms) >= 1 ? Number(item.rooms) : 1
    item.nights = Number(item.nights) >= 1 ? Number(item.nights) : 1
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
  if (!newInstallment.percentage || newInstallment.percentage <= 0) {
    toast.warning('Please enter a valid percentage (> 0)')
    return
  }
  // Check if adding this would exceed 100%
  const currentTotal = totalInstallmentPercentage.value
  if (currentTotal + newInstallment.percentage > 100.01) {
    toast.warning(`Adding ${newInstallment.percentage}% would exceed 100% (current: ${currentTotal.toFixed(1)}%)`)
    return
  }
  newInstallment.sequenceNo = form.installments.length + 1
  form.installments.push({
    sequenceNo: newInstallment.sequenceNo,
    name: newInstallment.name || `Installment ${newInstallment.sequenceNo}`,
    percentage: newInstallment.percentage,
    calculatedAmount: Math.round(((newInstallment.percentage / 100) * orderGrandTotal.value) * 100) / 100,
    dueDays: newInstallment.dueDays,
    dueDaysType: newInstallment.dueDaysType,
    isDeposit: newInstallment.isDeposit,
  })
  resetInstallmentForm()
  showInstallmentForm.value = false
  toast.success('Installment added')
}

const applyPaymentPlanTemplateToForm = (template: any) => {
  const gt = orderGrandTotal.value
  const newInstallments = template.stages.map((stage: any) => {
    const pct = Number(stage.amountDue) || 0 // templates store percentage in amountDue
    return {
      sequenceNo: stage.sequenceNo,
      name: stage.name,
      narration: stage.narration || stage.name,
      percentage: pct,
      calculatedAmount: Math.round(((pct / 100) * gt) * 100) / 100,
      dueDays: stage.dueDays,
      dueDaysType: stage.dueDaysType,
      isDeposit: stage.isDeposit,
      description: stage.description || ''
    }
  })

  form.installments = newInstallments
  toast.success(`${template.name} applied! ${form.installments.length} installments (Grand Total: ${formatCurrency(gt)})`)
  showInstallmentForm.value = false
  resetInstallmentForm()
}

// Per-participant payment plan template
const applyPaymentPlanTemplateForParticipant = (entityId: string, template: any) => {
  const data = perParticipantData[entityId]
  if (!data) return
  const gt = orderGrandTotal.value
  data.installments = template.stages.map((stage: any) => {
    const pct = Number(stage.amountDue) || 0
    return {
      sequenceNo: stage.sequenceNo,
      name: stage.name,
      narration: stage.narration || stage.name,
      percentage: pct,
      calculatedAmount: Math.round(((pct / 100) * gt) * 100) / 100,
      dueDays: stage.dueDays,
      dueDaysType: stage.dueDaysType,
      isDeposit: stage.isDeposit,
      description: stage.description || ''
    }
  })
  data.showInstallmentForm = false
  toast.success(`${template.name} applied for ${getParticipantName(entityId)}!`)
}

const resetInstallmentForm = () => {
  newInstallment.percentage = 0
  newInstallment.name = ''
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

// Payment Management Methods
const loadPaymentSummary = async () => {
  if (!isEdit.value) return
  
  try {
    loadingPayments.value = true
    const response = await fetch(`/api/v1.0/orders/${id.value}/payment-summary`)
    
    if (!response.ok) throw new Error('Failed to load payment summary')
    
    const data = await response.json()
    if (data.success) {
      paymentSummary.value = data.data
    }
  } catch (error) {
    console.error('Error loading payment summary:', error)
  } finally {
    loadingPayments.value = false
  }
}

const loadInstallmentPaymentHistory = async (installmentId: number) => {
  if (!isEdit.value) return
  
  try {
    loadingPayments.value = true
    const response = await fetch(`/api/v1.0/orders/${id.value}/installments/${installmentId}/payments`)
    
    if (!response.ok) throw new Error('Failed to load payment history')
    
    const data = await response.json()
    if (data.success) {
      paymentHistory.value = data.data || []
    }
  } catch (error) {
    console.error('Error loading payment history:', error)
    paymentHistory.value = []
  } finally {
    loadingPayments.value = false
  }
}

const openPaymentModal = (installment: any) => {
  selectedInstallmentForPayment.value = installment
  newPayment.amount_paid = 0
  newPayment.narration = installment.narration || ''
  newPayment.reference_number = ''
  newPayment.instrument_number = ''
  newPayment.instrument_date = new Date().toISOString().split('T')[0]
  newPayment.payee = ''
  newPayment.journal_voucher_id = null
  newPayment.account_id = null
  newPayment.bank_id = null
  newPayment.instrument_type = 'CASH'
  showPaymentModal.value = true
}

const recordPayment = async () => {
  if (!selectedInstallmentForPayment.value) return
  
  // Validate payment amount
  const remaining = selectedInstallmentForPayment.value.remaining_balance
  if (newPayment.amount_paid <= 0 || newPayment.amount_paid > remaining) {
    toast.error(`Please enter amount between 1 and ${remaining}`)
    return
  }
  
  if (!newPayment.journal_voucher_id || !newPayment.account_id) {
    toast.error('Please fill in Journal Voucher and Account')
    return
  }
  
  try {
    saving.value = true
    const response = await fetch(
      `/api/v1.0/orders/${id.value}/installments/${selectedInstallmentForPayment.value.installment_id}/pay`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: newPayment.amount_paid,
          journal_voucher_id: newPayment.journal_voucher_id,
          account_id: newPayment.account_id,
          narration: newPayment.narration,
          reference_number: newPayment.reference_number,
          instrument_type: newPayment.instrument_type,
          instrument_number: newPayment.instrument_number,
          instrument_date: newPayment.instrument_date,
          payee: newPayment.payee,
          bank_id: newPayment.bank_id,
        }),
      }
    )
    
    if (!response.ok) throw new Error('Failed to record payment')
    
    const data = await response.json()
    if (data.success) {
      toast.success('Payment recorded successfully')
      showPaymentModal.value = false
      // Refresh payment data
      await loadPaymentSummary()
      await loadInstallmentPaymentHistory(selectedInstallmentForPayment.value.installment_id)
    }
  } catch (error) {
    console.error('Error recording payment:', error)
    toast.error('Failed to record payment')
  } finally {
    saving.value = false
  }
}

const openPaymentHistory = async (installment: any) => {
  selectedInstallmentForPayment.value = installment
  await loadInstallmentPaymentHistory(installment.installment_id)
  showPaymentHistory.value = true
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  selectedInstallmentForPayment.value = null
}

const getStatusColor = (status: string): string => {
  const colors: any = {
    'NOT_STARTED': '#dc3545',
    'PARTIALLY_PAID': '#ffc107',
    'COMPLETED': '#28a745',
    'OVERDUE': '#ff6b6b',
  }
  return colors[status] || '#6c757d'
}

const getStatusLabel = (status: string): string => {
  const labels: any = {
    'NOT_STARTED': 'Not Started',
    'PARTIALLY_PAID': 'Partial',
    'COMPLETED': 'Completed',
    'OVERDUE': 'Overdue',
  }
  return labels[status] || status
}

const applyBulletFormatting = (text: string): string => {
  const lines = text.split('\n')
  const formattedLines = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('•')) return trimmed
    return '• ' + trimmed
  })
  return formattedLines.join('\n')
}

const formatBulletText = (type: 'food' | 'beverage' | 'alcohol') => {
  let text = ''
  
  if (type === 'food') {
    text = form.preferences.food_preferences
  } else if (type === 'beverage') {
    text = form.preferences.beverage_preferences
  } else if (type === 'alcohol') {
    text = form.preferences.alcohol_preferences
  }
  
  const formatted = applyBulletFormatting(text)
  
  if (formatted !== text) {
    if (type === 'food') {
      form.preferences.food_preferences = formatted
    } else if (type === 'beverage') {
      form.preferences.beverage_preferences = formatted
    } else if (type === 'alcohol') {
      form.preferences.alcohol_preferences = formatted
    }
  }
}

const formatBulletTextForParticipant = (entityId: string, type: 'food' | 'beverage' | 'alcohol') => {
  const pData = perParticipantData[entityId]
  if (!pData?.preferences) return
  
  let text = ''
  if (type === 'food') {
    text = pData.preferences.food_preferences
  } else if (type === 'beverage') {
    text = pData.preferences.beverage_preferences
  } else if (type === 'alcohol') {
    text = pData.preferences.alcohol_preferences
  }
  
  const formatted = applyBulletFormatting(text)
  
  if (formatted !== text) {
    if (type === 'food') {
      pData.preferences.food_preferences = formatted
    } else if (type === 'beverage') {
      pData.preferences.beverage_preferences = formatted
    } else if (type === 'alcohol') {
      pData.preferences.alcohol_preferences = formatted
    }
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

// ─── PDF Preview / Download ───
const fmtPdfCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount)
  if (!Number.isFinite(num)) return '-'
  return formatCurrency(num)
}

const displayOrDash = (val: any): string => {
  if (val === null || val === undefined || val === '') return '-'
  return String(val)
}

const downloadPreviewPdf = async (target: string = 'all') => {
  generatingPdf.value = true
  try {
    // Determine which participant(s) to include
    const isMulti = willCreateMultipleOrders.value && orderGroups.value.length > 1
    const isSingleParticipant = isMulti && target !== 'all'
    const targetGroup = isSingleParticipant ? orderGroups.value.find(g => getParticipantKey(g.primary) === target) : null
    const targetName = targetGroup ? getParticipantName(target) : ''
    const groupsToRender = isSingleParticipant && targetGroup ? [targetGroup] : (isMulti ? orderGroups.value : [])

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 36
    let cursorY = 40

    // ── Header ──
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    const headerTitle = isSingleParticipant ? `ORDER PREVIEW — ${targetName}` : 'ORDER PREVIEW'
    pdf.text(headerTitle, pageWidth / 2, cursorY, { align: 'center' })
    cursorY += 20
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 14

    // ── Order Meta ──
    const selectedEnq = enquiries.value.find((e: any) => String(e.id) === String(form.enquiryId))
    const selectedQuot = quotations.value.find((q: any) => String(q.id) === String(form.quotationId))

    const metaRows = [
      ['Order Number:', displayOrDash(form.orderNumber || '(New)'),           'Order Date:', displayOrDash(form.orderDate)],
      ['Enquiry:',      displayOrDash(selectedEnq ? (selectedEnq.code || `#${selectedEnq.id}`) : form.enquiryId),
       'Quotation:',    displayOrDash(selectedQuot ? (selectedQuot.code || selectedQuot.name || `#${selectedQuot.id}`) : form.quotationId)],
      ['Status:',       displayOrDash(form.status || 'NEW'),                  'Currency:',   displayOrDash((() => { const c = currencies.value.find((c: any) => c.id === form.currency); return c ? `${c.symbol || ''} ${c.name || ''}`.trim() : form.currency || '-'; })())]
    ]
    autoTable(pdf, {
      startY: cursorY,
      body: metaRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 90, fontStyle: 'bold', fillColor: [245, 245, 245] },
        1: { cellWidth: (pageWidth - margin * 2) / 2 - 90 },
        2: { cellWidth: 90, fontStyle: 'bold', fillColor: [245, 245, 245] },
        3: { cellWidth: (pageWidth - margin * 2) / 2 - 90 }
      }
    })
    cursorY = (pdf as any).lastAutoTable.finalY + 16

    // ── Order Items ──
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Order Items (${form.items.length})`, margin, cursorY)
    cursorY += 8
    if (form.items.length > 0) {
      const itemRows = form.items.map((it: any, idx: number) => [
        String(idx + 1),
        it.name || it.description || '-',
        it.category || '-',
        String(it.quantity || 0),
        fmtPdfCurrency(it.rate),
        fmtPdfCurrency(it.discount || 0),
        fmtPdfCurrency(it.amount || (it.quantity * it.rate))
      ])
      autoTable(pdf, {
        startY: cursorY,
        head: [['#', 'Name', 'Category', 'Qty', 'Unit Price', 'Discount', 'Total']],
        body: itemRows,
        theme: 'grid',
        tableWidth: pageWidth - margin * 2,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 26, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 70 },
          3: { cellWidth: 36, halign: 'center' },
          4: { cellWidth: 80, halign: 'right' },
          5: { cellWidth: 65, halign: 'right' },
          6: { cellWidth: 80, halign: 'right' }
        }
      })
      // Items total row
      const itemsTotal = form.items.reduce((sum: number, it: any) => sum + Number(it.amount || (it.quantity * it.rate) || 0), 0)
      cursorY = (pdf as any).lastAutoTable.finalY
      autoTable(pdf, {
        startY: cursorY,
        body: [['', '', '', '', '', 'TOTAL:', fmtPdfCurrency(itemsTotal)]],
        theme: 'grid',
        tableWidth: pageWidth - margin * 2,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 26 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 70 },
          3: { cellWidth: 36 }, 4: { cellWidth: 80 },
          5: { cellWidth: 65, halign: 'right', fillColor: [245, 245, 245] },
          6: { cellWidth: 80, halign: 'right', fillColor: [245, 245, 245] }
        }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 16
    } else {
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      pdf.text('No items added.', margin, cursorY + 6)
      cursorY += 20
    }

    // ── Parties ──
    // For single-participant preview, filter parties to the target participant + dependents
    let displayParties = form.parties
    if (isSingleParticipant && targetGroup) {
      const targetEntityIds = new Set<string>()
      if (targetGroup.primary.entity_id) targetEntityIds.add(String(targetGroup.primary.entity_id))
      if (targetGroup.dependents) {
        targetGroup.dependents.forEach((d: any) => { if (d.entity_id) targetEntityIds.add(String(d.entity_id)) })
      }
      displayParties = form.parties.filter((p: any) => {
        const eid = String(p.entity_id || p.entity?.id || p.entity || '')
        return targetEntityIds.has(eid)
      })
    }
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Parties (${displayParties.length})`, margin, cursorY)
    cursorY += 8
    if (displayParties.length > 0) {
      const partyRows = displayParties.map((p: any) => [
        (p.role || '-').toUpperCase(),
        p.entity?.full_name || p.entity_name || p.entity || '-',
        p.contact_person || '-',
        p.contact_phone || '-',
        p.email || '-'
      ])
      autoTable(pdf, {
        startY: cursorY,
        head: [['Role', 'Entity Name', 'Contact Person', 'Phone', 'Email']],
        body: partyRows,
        theme: 'grid',
        tableWidth: pageWidth - margin * 2,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 100 },
          3: { cellWidth: 90 },
          4: { cellWidth: 120 }
        }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 16
    } else {
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      pdf.text('No parties added.', margin, cursorY + 6)
      cursorY += 20
    }

    // ── Grand Total Breakdown ──
    if (cursorY > pdf.internal.pageSize.getHeight() - 120) { pdf.addPage(); cursorY = 40 }
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Order Total Summary', margin, cursorY)
    cursorY += 8
    const totalRows: string[][] = [
      ['Items Subtotal', fmtPdfCurrency(itemsSubtotal.value)],
      ['Logistics Total', fmtPdfCurrency(logisticsTotal.value)],
    ]
    if (Number(form.vat) > 0) totalRows.push([`VAT (${form.vat}% on items)`, `+ ${fmtPdfCurrency(vatAmount.value)}`])
    if (Number(form.expenseIncluded) > 0) totalRows.push(['Expense Included', `+ ${fmtPdfCurrency(form.expenseIncluded)}`])
    totalRows.push(['GRAND TOTAL', fmtPdfCurrency(orderGrandTotal.value)])
    autoTable(pdf, {
      startY: cursorY,
      body: totalRows.map(r => ({ label: r[0], amount: r[1] })),
      theme: 'grid',
      styles: { fontSize: 10 },
      columns: [{ header: '', dataKey: 'label' }, { header: '', dataKey: 'amount' }],
      columnStyles: {
        0: { cellWidth: 300, fontStyle: 'bold' },
        1: { cellWidth: pageWidth - margin * 2 - 300, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data: any) => {
        if (data.row.index === totalRows.length - 1) {
          data.cell.styles.fillColor = [245, 245, 245]
          data.cell.styles.textColor = 50
          data.cell.styles.fontSize = 12
        }
      }
    })
    cursorY = (pdf as any).lastAutoTable.finalY + 16

    // ── Helper: render logistics table for a list ──
    const renderLogisticsTable = (logisticsList: any[], label: string) => {
      if (cursorY > pdf.internal.pageSize.getHeight() - 100) { pdf.addPage(); cursorY = 40 }
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, margin, cursorY)
      cursorY += 8
      if (logisticsList.length > 0) {
        const logisticsRows = logisticsList.map((l: any) => {
          let details = ''
          if (l.logistics_type === 'HOTEL') {
            details = `${l.hotel_name || '-'} (${l.room_type || '-'}), ${l.rooms || 0} room(s), ${l.nights || 0} night(s)`
          } else if (l.logistics_type === 'CHARTER') {
            details = `${l.from_airport || '-'} → ${l.to_airport || '-'}, ${l.seats || 0} seat(s)`
          } else if (l.logistics_type === 'TRANSFER' || l.logistics_type === 'AIRPORT') {
            details = `${l.from_location || '-'} → ${l.to_location || '-'}`
            if (l.passengers_hunters || l.passengers_observers) {
              details += ` (Hunters: ${l.passengers_hunters || 0}, Observers: ${l.passengers_observers || 0})`
            }
          } else {
            details = l.description || l.notes || l.item_name || '-'
          }
          const dateRange = [
            l.start_datetime ? new Date(l.start_datetime).toLocaleDateString() : '',
            l.end_datetime ? new Date(l.end_datetime).toLocaleDateString() : ''
          ].filter(Boolean).join(' → ') || '-'
          return [l.logistics_type || 'OTHER', details, dateRange, fmtPdfCurrency(l.estimated_amount), l.status || '-']
        })
        autoTable(pdf, {
          startY: cursorY,
          head: [['Type', 'Details', 'Dates', 'Amount', 'Status']],
          body: logisticsRows,
          theme: 'grid',
          tableWidth: pageWidth - margin * 2,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, overflow: 'linebreak' },
          headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 100 }, 3: { cellWidth: 80, halign: 'right' }, 4: { cellWidth: 60, halign: 'center' } }
        })
        cursorY = (pdf as any).lastAutoTable.finalY + 12
      } else {
        pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
        pdf.text('No logistics added.', margin, cursorY + 6)
        cursorY += 20
      }
    }

    // ── Helper: render installments table for a list ──
    const renderInstallmentsTable = (instList: any[], label: string) => {
      if (cursorY > pdf.internal.pageSize.getHeight() - 100) { pdf.addPage(); cursorY = 40 }
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, margin, cursorY)
      cursorY += 8
      if (instList.length > 0) {
        const sorted = [...instList].sort((a: any, b: any) => (a.sequenceNo || 0) - (b.sequenceNo || 0))
        const instRows = sorted.map((inst: any) => [
          String(inst.sequenceNo || '-'),
          inst.name || inst.narration || `Installment ${inst.sequenceNo}`,
          `${inst.percentage}%`,
          fmtPdfCurrency(inst.calculatedAmount),
          `${inst.dueDays || 0} days (${inst.dueDaysType || '-'})`,
          inst.isDeposit ? 'Yes' : 'No'
        ])
        autoTable(pdf, {
          startY: cursorY,
          head: [['#', 'Description', 'Percentage', 'Amount', 'Due', 'Deposit']],
          body: instRows,
          theme: 'grid',
          tableWidth: pageWidth - margin * 2,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 26, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 70, halign: 'center' }, 3: { cellWidth: 90, halign: 'right' }, 4: { cellWidth: 110 }, 5: { cellWidth: 50, halign: 'center' } }
        })
        cursorY = (pdf as any).lastAutoTable.finalY + 12
      } else {
        pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
        pdf.text('No payment plan configured.', margin, cursorY + 6)
        cursorY += 20
      }
    }

    // ── Helper: render preferences for a prefs object ──
    const renderPreferencesTable = (prefs: any, label: string) => {
      const hasPrefs = prefs.food_preferences || prefs.beverage_preferences || prefs.alcohol_preferences || (prefs.allergies && prefs.allergies.length > 0) || prefs.special_requests
      if (!hasPrefs) return
      if (cursorY > pdf.internal.pageSize.getHeight() - 100) { pdf.addPage(); cursorY = 40 }
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, margin, cursorY)
      cursorY += 8
      const prefRows: string[][] = []
      if (prefs.food_preferences) prefRows.push(['Food Preferences:', prefs.food_preferences])
      if (prefs.beverage_preferences) prefRows.push(['Beverage Preferences:', prefs.beverage_preferences])
      if (prefs.alcohol_preferences) prefRows.push(['Alcohol Preferences:', prefs.alcohol_preferences])
      if (prefs.allergies && prefs.allergies.length > 0) prefRows.push(['Allergies:', prefs.allergies.join(', ')])
      if (prefs.special_requests) prefRows.push(['Special Requests:', prefs.special_requests])
      autoTable(pdf, {
        startY: cursorY,
        head: [['Field', 'Details']],
        body: prefRows.map(r => ({ k: r[0], v: r[1] })),
        theme: 'grid',
        tableWidth: pageWidth - margin * 2,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        columns: [{ header: 'Field', dataKey: 'k' }, { header: 'Details', dataKey: 'v' }],
        columnStyles: { 0: { cellWidth: 140, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 140, overflow: 'linebreak' } }
      })
      cursorY = (pdf as any).lastAutoTable.finalY + 12
    }

    // ── Render Logistics / Payment / Preferences — per participant or shared ──
    if (groupsToRender.length > 0) {
      // Per-participant sections
      for (let gi = 0; gi < groupsToRender.length; gi++) {
        const group = groupsToRender[gi]
        const entityKey = getParticipantKey(group.primary)
        const participantName = getParticipantName(entityKey)
        const pData = perParticipantData[entityKey]

        // Page break check
        if (cursorY > pdf.internal.pageSize.getHeight() - 80) { pdf.addPage(); cursorY = 40 }

        // ── Participant Header (gray bar, same style as other section headers) ──
        if (!isSingleParticipant) {
          pdf.setFillColor(245, 245, 245)
          pdf.setDrawColor(220, 220, 220)
          pdf.roundedRect(margin, cursorY - 2, pageWidth - margin * 2, 20, 3, 3, 'FD')
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(50)
          pdf.text(participantName, margin + 10, cursorY + 11)
          pdf.setTextColor(0)
          cursorY += 28
        }

        // Determine data sources per section (customized or shared)
        const useCustomLogs = customizedParticipants.logistics.has(entityKey)
        const useCustomPay = customizedParticipants.payment.has(entityKey)
        const useCustomPrefs = customizedParticipants.preferences.has(entityKey)

        const logData = useCustomLogs ? (pData?.logistics || []) : (form.logistics || [])
        const instData = useCustomPay ? (pData?.installments || []) : (form.installments || [])
        const prefData = useCustomPrefs ? (pData?.preferences || form.preferences) : form.preferences

        // Single-participant: no need to repeat name (already in header); combined: include name
        const logLabel = isSingleParticipant ? `Logistics (${logData.length})` : `Logistics — ${participantName} (${logData.length})`
        const instLabel = isSingleParticipant ? `Payment Plan (${instData.length})` : `Payment Plan — ${participantName} (${instData.length})`
        const prefLabel = isSingleParticipant ? 'Preferences & Special Requests' : `Preferences — ${participantName}`

        renderLogisticsTable(logData, logLabel)
        renderInstallmentsTable(instData, instLabel)
        renderPreferencesTable(prefData, prefLabel)

        // Separator between participants (only for combined preview)
        if (!isSingleParticipant && gi < groupsToRender.length - 1) {
          if (cursorY > pdf.internal.pageSize.getHeight() - 30) { pdf.addPage(); cursorY = 40 }
          pdf.setDrawColor(200, 200, 200)
          pdf.setLineWidth(0.3)
          pdf.line(margin, cursorY, pageWidth - margin, cursorY)
          cursorY += 12
        }
      }
    } else {
      // Single-order mode: original flat layout
      renderLogisticsTable(form.logistics, `Logistics (${form.logistics.length})`)
      renderInstallmentsTable(form.installments, `Payment Plan (${form.installments.length} installments)`)
      renderPreferencesTable(form.preferences, 'Preferences & Special Requests')
    }

    // ── Remarks & Notes ──
    const hasRemarks = form.remarks || form.notes
    if (hasRemarks) {
      if (cursorY > pdf.internal.pageSize.getHeight() - 80) {
        pdf.addPage()
        cursorY = 40
      }
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Remarks & Notes', margin, cursorY)
      cursorY += 12
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      if (form.remarks) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Remarks:', margin, cursorY)
        pdf.setFont('helvetica', 'normal')
        cursorY += 12
        pdf.text(form.remarks, margin + 8, cursorY, { maxWidth: pageWidth - margin * 2 - 8 })
        cursorY += Math.ceil(form.remarks.length / 80) * 12 + 10
      }
      if (form.notes) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Notes:', margin, cursorY)
        pdf.setFont('helvetica', 'normal')
        cursorY += 12
        pdf.text(form.notes, margin + 8, cursorY, { maxWidth: pageWidth - margin * 2 - 8 })
      }
    }

    // ── Footer ──
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(150)
      pdf.text(
        `Generated on ${new Date().toLocaleString()} — Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 20,
        { align: 'center' }
      )
      pdf.setTextColor(0)
    }

    // preview in browser tab
    const pdfBlob = pdf.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
    toast.success('Preview PDF opened in new tab')
  } catch (err) {
    console.error('Error generating order preview PDF:', err)
    toast.error('Failed to generate preview PDF')
  } finally {
    generatingPdf.value = false
  }
}

const validateOrderItems = (): boolean => {
  itemErrors.value = {}
  let ok = true
  form.items.forEach((it: any, idx: number) => {
    const rawId = it.item_id ?? it.id
    const idNum = rawId != null ? Number(rawId) : null

    // If item_id is provided, it must be a positive integer matching a catalogue item
    if (rawId != null && (!Number.isFinite(idNum) || idNum <= 0)) {
      itemErrors.value[idx] = 'Invalid item_id — select a valid catalogue/pricing item.'
      ok = false
      return
    }

    // If no item_id (custom/manual line), require a description
    if (rawId == null && !(it.name || it.description)) {
      itemErrors.value[idx] = 'This item requires either a catalogue item or a description.'
      ok = false
      return
    }

    if (!it.quantity || Number(it.quantity) <= 0) {
      itemErrors.value[idx] = 'Quantity must be ≥ 1.'
      ok = false
      return
    }
  })
  return ok
}

const submit = async () => {
  const multiOrderCount = willCreateMultipleOrders.value ? orderGroups.value.length : 0
  const confirmText = isEdit.value
    ? 'Are you sure you want to update this order?'
    : multiOrderCount > 1
      ? `${multiOrderCount} independent participants detected. ${multiOrderCount} separate orders will be created and submitted. Continue?`
      : 'Are you sure you want to create this order?'

  const confirmation = await Swal.fire({
    title: isEdit.value ? 'Update Order?' : multiOrderCount > 1 ? `Create ${multiOrderCount} Orders?` : 'Create Order?',
    text: confirmText,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: isEdit.value ? 'Yes, update!' : multiOrderCount > 1 ? `Yes, create ${multiOrderCount} orders!` : 'Yes, create!',
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

  // Strict item validation (block submit if any invalid)
  if (!validateOrderItems()) {
    // Open items section and focus
    showSections.items = true
    Swal.fire('Fix items', 'One or more items are invalid. Please correct highlighted rows before submitting.', 'warning')
    return
  }

  // Validate installment percentages total 100%
  if (form.installments.length > 0 && !installmentPercentageValid.value) {
    showSections.payment = true
    Swal.fire(
      'Invalid Payment Plan',
      `Installment percentages must total exactly 100%. Current total: ${totalInstallmentPercentage.value.toFixed(1)}%`,
      'warning'
    )
    return
  }

  saving.value = true
  try {
    const participantsData = form.participants.filter(p => p.count > 0)
    const logisticsData = form.logistics.filter(l => l.logistics_type)

    // Client-side validations / normalization to avoid 422 from server
    // 1) Ensure created_by is provided
    if (!currentUserId.value) {
      Swal.fire('Error', 'Cannot determine current user (created_by missing). Please login again.', 'error')
      saving.value = false
      return
    }

    // 2) Normalize items: ensure item_id is numeric when present, otherwise null
    const normalizedItems = form.items.map((item: any) => {
      const idVal = item.item_id != null ? Number(item.item_id) : (item.id != null ? Number(item.id) : null)
      return {
        item_id: Number.isFinite(idVal) && idVal > 0 ? idVal : null,
        description: item.name || item.description || '',
        item_category_id: item.category ? parseInt(item.category as string) : null,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        discount_amount: Number(item.discount) || 0,
        line_total: (Number(item.quantity) || 0) * (Number(item.rate) || 0) - (Number(item.discount) || 0),
      }
    })

    // 3) Normalize logistics: ensure ALL entries have rooms & nights >= 1 (backend requires min 1)
    const normalizedLogistics = logisticsData.map((log: any) => {
      const l = { ...log }
      l.rooms = Number(l.rooms) >= 1 ? Number(l.rooms) : 1
      l.nights = Number(l.nights) >= 1 ? Number(l.nights) : 1
      return l
    })

    const payload = {
      created_by: Number(currentUserId.value),
      order_type: form.orderType,
      status: form.status,
      order_date: form.orderDate,
      currency_id: form.currency ? parseInt(form.currency as string) : null,
      exchange_rate: form.exchangeRate,
      vat: form.vat,
      expense_included: Number(form.expenseIncluded) || 0,
      grand_total: orderGrandTotal.value,
      total_amount: orderGrandTotal.value,
      remarks: form.remarks || null,
      notes: form.notes || null,
      enquiry_id: form.enquiryId ? parseInt(form.enquiryId as string) : null,
      quotation_id: form.quotationId ? parseInt(form.quotationId as string) : null,
      sales_enquiry_id: form.enquiryId ? parseInt(form.enquiryId as string) : null,
      sales_enquiry_pricing_id: form.quotationId ? parseInt(form.quotationId as string) : null,
      items: normalizedItems,
      parties: form.parties.map(party => ({
        role: (party.role || 'CUSTOMER').toUpperCase(),
        entity_id: party.entity ? parseInt(party.entity as string) : null,
        entity_name: party.entity_name || null,
        contact_name: party.contact_person || party.contact || null,
        contact_phone: party.contact_phone || null,
        contact_email: party.email || party.contact_email || null,
      })),
      participants: participantsData,
      logistics: normalizedLogistics.map(log => ({
        logistics_type: log.logistics_type,
        hotel_name: log.hotel_name || null,
        location: log.location || null,
        check_in_date: log.start_datetime || log.check_in_date || null,
        check_out_date: log.end_datetime || log.check_out_date || null,
        start_datetime: log.start_datetime ? (log.start_datetime.length === 10 ? log.start_datetime + ' 00:00:00' : log.start_datetime) : null,
        end_datetime: log.end_datetime ? (log.end_datetime.length === 10 ? log.end_datetime + ' 00:00:00' : log.end_datetime) : null,
        nights: Number(log.nights) >= 1 ? Number(log.nights) : 1,
        rooms: Number(log.rooms) >= 1 ? Number(log.rooms) : 1,
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
        notes: log.description || log.notes || null
      })),
      preferences: form.preferences,
      installments: computedInstallments.value.map(inst => ({
        sequence_no: inst.sequenceNo,
        percentage: inst.percentage,
        amount_due: inst.calculatedAmount,
        amount_due_type: 'PERCENTAGE',
        due_days: inst.dueDays,
        due_days_type: inst.dueDaysType,
        is_deposit: inst.isDeposit ? 1 : 0,
        currency_id: form.currency ? parseInt(form.currency as string) : null,
        name: inst.name || inst.narration || `Installment ${inst.sequenceNo}`,
        narration: inst.narration || inst.name || `Installment ${inst.sequenceNo}`,
      })),
    }

    if (isEdit.value) {
      await orderStore.updateOrder(id.value, payload)
      Swal.fire('Success!', 'Order updated successfully', 'success').then(() => {
        router.push('/orders')
      })
    } else if (willCreateMultipleOrders.value) {
      // ─── MULTI-ORDER SPLIT: create one order per independent participant ───
      const groups = orderGroups.value
      const createdOrders: Array<{ id: number; orderNumber: string; entityName: string }> = []
      const failedOrders: Array<{ entityName: string; error: string }> = []

      for (const group of groups) {
        try {
          // Build per-participant party list: primary + their dependents
          const groupParties: any[] = []

          // Add the independent participant as CUSTOMER
          if (group.party) {
            groupParties.push({
              role: 'CUSTOMER',
              entity_id: group.party.entity ? parseInt(group.party.entity as string) : null,
              entity_name: group.party.entity_name || null,
              contact_name: group.party.contact_person || group.party.contact || null,
              contact_phone: group.party.contact_phone || null,
              contact_email: group.party.email || group.party.contact_email || null,
            })
          }

          // Add dependents — these are people whose costs are covered by
          // the independent participant. They are still CUSTOMERs on this order,
          // NOT companions (companions are independent and pay for themselves).
          for (const dep of group.dependents) {
            const depParty = form.parties.find(
              (p: any) => String(p.entity) === String(dep.entity_id)
            )
            if (depParty) {
              groupParties.push({
                role: 'CUSTOMER',
                entity_id: depParty.entity ? parseInt(depParty.entity as string) : null,
                entity_name: depParty.entity_name || null,
                contact_name: depParty.contact_person || depParty.contact || null,
                contact_phone: depParty.contact_phone || null,
                contact_email: depParty.email || depParty.contact_email || null,
              })
            }
          }

          // Clone the base payload but replace parties, logistics, installments, preferences
          // with this participant's own data (or shared form data if not individually customized)
          const entityKey = getParticipantKey(group.primary)
          const pData = perParticipantData[entityKey]

          // Determine which data source to use per section:
          // If participant was individually customized, use their perParticipantData;
          // otherwise, use the shared form data (user stayed on "Shared" tab)
          const useCustomLogistics = customizedParticipants.logistics.has(entityKey)
          const useCustomPayment = customizedParticipants.payment.has(entityKey)
          const useCustomPreferences = customizedParticipants.preferences.has(entityKey)

          const rawLogistics = useCustomLogistics ? (pData?.logistics || []) : (form.logistics || [])
          const rawInstallments = useCustomPayment ? (pData?.installments || []) : (form.installments || [])
          const rawPreferences = useCustomPreferences ? (pData?.preferences || form.preferences) : form.preferences

          // Normalize per-participant logistics
          const participantLogistics = rawLogistics.filter((l: any) => l.logistics_type)
          const normalizedParticipantLogistics = participantLogistics.map((log: any) => {
            const l = { ...log }
            l.rooms = Number(l.rooms) >= 1 ? Number(l.rooms) : 1
            l.nights = Number(l.nights) >= 1 ? Number(l.nights) : 1
            return {
              logistics_type: l.logistics_type,
              hotel_name: l.hotel_name || null,
              location: l.location || null,
              check_in_date: l.start_datetime || l.check_in_date || null,
              check_out_date: l.end_datetime || l.check_out_date || null,
              start_datetime: l.start_datetime ? (l.start_datetime.length === 10 ? l.start_datetime + ' 00:00:00' : l.start_datetime) : null,
              end_datetime: l.end_datetime ? (l.end_datetime.length === 10 ? l.end_datetime + ' 00:00:00' : l.end_datetime) : null,
              nights: Number(l.nights) >= 1 ? Number(l.nights) : 1,
              rooms: Number(l.rooms) >= 1 ? Number(l.rooms) : 1,
              from_airport: l.from_airport || null,
              to_airport: l.to_airport || null,
              flight_date: l.flight_date || null,
              seats: l.seats || 0,
              from_location: l.from_location || null,
              to_location: l.to_location || null,
              transfer_date: l.transfer_date || null,
              vehicle_type: l.vehicle_type || null,
              estimated_amount: l.estimated_amount || 0,
              status: l.status || 'PLANNED',
              notes: l.description || l.notes || null
            }
          })

          // Per-participant installments
          const participantInstallments = (rawInstallments || []).map((inst: any) => ({
            sequence_no: inst.sequenceNo,
            percentage: inst.percentage,
            amount_due: inst.calculatedAmount || Math.round(((inst.percentage || 0) / 100 * orderGrandTotal.value) * 100) / 100,
            amount_due_type: 'PERCENTAGE',
            due_days: inst.dueDays,
            due_days_type: inst.dueDaysType,
            is_deposit: inst.isDeposit ? 1 : 0,
            currency_id: form.currency ? parseInt(form.currency as string) : null,
            name: inst.name || inst.narration || `Installment ${inst.sequenceNo}`,
            narration: inst.narration || inst.name || `Installment ${inst.sequenceNo}`,
          }))

          // Per-participant preferences
          const participantPreferences = rawPreferences

          const groupPayload = {
            ...payload,
            // Set top-level entity info so backend stores it on the order itself
            entity_id: group.party?.entity ? parseInt(group.party.entity as string) : null,
            entity_name: group.party?.entity_name || 'Unknown',
            parties: groupParties,
            logistics: normalizedParticipantLogistics,
            installments: participantInstallments,
            preferences: participantPreferences,
          }

          const createResp = await orderStore.createOrder(groupPayload)
          const newId = createResp.data.data?.id || createResp.data?.id
          const orderNum = createResp.data.data?.order_number || createResp.data?.order_number || `#${newId}`
          const entityName = group.party?.entity_name || 'Unknown'

          // Auto-submit
          if (newId) {
            try {
              await orderStore.submitOrder(newId)
            } catch (submitErr) {
              // Creation succeeded, submit failed — still track as created
            }
          }

          createdOrders.push({ id: newId, orderNumber: orderNum, entityName })
        } catch (err: any) {
          failedOrders.push({
            entityName: group.party?.entity_name || 'Unknown',
            error: err?.response?.data?.message || err.message || 'Unknown error',
          })
        }
      }

      // Refresh orders list
      await orderStore.listOrders()

      // Show summary
      if (failedOrders.length === 0) {
        const orderList = createdOrders
          .map(o => `<li><strong>${o.orderNumber}</strong> — ${o.entityName}</li>`)
          .join('')
        Swal.fire({
          title: `${createdOrders.length} Orders Created!`,
          html: `<p>Separate orders were created and submitted for each independent participant:</p><ul style="text-align:left;">${orderList}</ul>`,
          icon: 'success',
        }).then(() => router.push('/orders'))
      } else if (createdOrders.length > 0) {
        const okList = createdOrders.map(o => `<li>✅ ${o.orderNumber} — ${o.entityName}</li>`).join('')
        const failList = failedOrders.map(f => `<li>❌ ${f.entityName}: ${f.error}</li>`).join('')
        Swal.fire({
          title: 'Partial Success',
          html: `<ul style="text-align:left;">${okList}${failList}</ul>`,
          icon: 'warning',
        }).then(() => router.push('/orders'))
      } else {
        Swal.fire('Error', 'All order creations failed. Please try again.', 'error')
      }
    } else {
      const createResponse = await orderStore.createOrder(payload)
      const newOrderId = createResponse.data.data?.id || createResponse.data?.id
      
      // Auto-submit the order after creation
      if (newOrderId) {
        try {
          await orderStore.submitOrder(newOrderId)
          // Refresh orders list to ensure new order is displayed with updated status
          await orderStore.listOrders()
          Swal.fire('Success!', 'Order created and submitted successfully', 'success').then(() => {
            router.push('/orders')
          })
        } catch (submitError: any) {
          // If submit fails, still show success for creation but warn about submit failure
          await orderStore.listOrders()
          Swal.fire('Partial Success!', 'Order created but submission failed. Please submit manually.', 'warning').then(() => {
            router.push('/orders')
          })
        }
      } else {
        // Refresh orders list to ensure new order is displayed with all data
        await orderStore.listOrders()
        Swal.fire('Success!', 'Order created successfully', 'success').then(() => {
          router.push('/orders')
        })
      }
    }
  } catch (error: any) {
    // Improve display for validation (422) errors returned from server
    const resp = error?.response?.data
    if (resp && resp.errors) {
      const msgs: string[] = []
      for (const k of Object.keys(resp.errors)) {
        const v = resp.errors[k]
        if (Array.isArray(v)) msgs.push(`${k}: ${v.join(', ')}`)
        else msgs.push(`${k}: ${String(v)}`)
      }
      Swal.fire('Validation failed', msgs.join('<br/>'), 'error')
    } else {
      Swal.fire('Error!', error.message || 'An error occurred', 'error')
    }
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
  form.expenseIncluded = 0
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
  enquiryParticipantsRaw.value = []
  // Clear per-participant data
  Object.keys(perParticipantData).forEach(k => delete perParticipantData[k])
  activeParticipantTab.logistics = 'shared'
  activeParticipantTab.payment = 'shared'
  activeParticipantTab.preferences = 'shared'
  // Reset customization tracking
  customizedParticipants.logistics.clear()
  customizedParticipants.payment.clear()
  customizedParticipants.preferences.clear()
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
      form.expenseIncluded = Number(order.expense_included || order.expenseIncluded || 0)

      form.enquiryId = order.enquiryId
      form.quotationId = order.quotationId
      form.remarks = order.remarks || ''
      form.notes = order.notes || ''
      form.items = order.items || []
      form.parties = order.parties || []
      form.participants = order.participants || []
      form.logistics = (order.logistics || []).map((log: any) => ({
        ...log,
        description: log.description || log.notes || '',
        start_datetime: log.start_datetime || '',
        end_datetime: log.end_datetime || '',
      }))
      form.preferences = order.preferences || { food_preferences: '', beverage_preferences: '', allergies: [], alcohol_preferences: '', special_requests: '' }
      // Map installments: normalize to percentage-based structure
      form.installments = (order.installments || []).map((inst: any, idx: number) => ({
        sequenceNo: inst.sequenceNo || inst.sequence_no || idx + 1,
        name: inst.name || inst.narration || `Installment ${idx + 1}`,
        percentage: inst.percentage || (inst.amountDueType === 'PERCENTAGE' ? inst.amountDue : inst.amount_due_type === 'PERCENTAGE' ? inst.amount_due : 0),
        calculatedAmount: inst.calculatedAmount || inst.calculated_amount || inst.amount_due || 0,
        dueDays: inst.dueDays || inst.due_days || 0,
        dueDaysType: inst.dueDaysType || inst.due_days_type || 'AFTER_CONFIRMATION',
        isDeposit: !!(inst.isDeposit || inst.is_deposit),
        description: inst.description || '',
        narration: inst.narration || inst.name || '',
      }))
    }
  } catch (error) {
    toast.error('Error loading order')
  } finally {
    loading.value = false
  }
}

// Watch for both enquiry and quotation changes to update status and fetch pricing items & parties
// ─── Auto-recalculate installment amounts when grand total changes ───
watch(orderGrandTotal, (newGT) => {
  if (form.installments.length === 0) return
  // Do NOT recalculate if payments already exist (accounting integrity)
  if (hasExistingPayments.value) return
  // Recalculate each installment's amount from its percentage
  form.installments.forEach((inst: any) => {
    const pct = Number(inst.percentage) || 0
    inst.calculatedAmount = Math.round(((pct / 100) * newGT) * 100) / 100
  })
})

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
          const qty = pItem.quantity || pItem.qty || pItem.line_qty || 1
          
          // The quotation's amount is the authoritative total for each item
          const quotationAmount = pItem.amount || pItem.total || pItem.line_total || pItem.total_amount || 0
          
          // Get catalog rate as fallback
          let unitRate = pItem.rate || pItem.unit_price || pItem.unit_rate || pItem.rate_amount || pItem.price || pItem.unit_cost || 0
          
          // If quotation provides an amount, derive rate from it (amount may include bundled pricing)
          // This ensures rate * qty = quotation amount, so backend stores the correct total
          if (quotationAmount > 0 && qty > 0) {
            unitRate = Math.round((quotationAmount / qty) * 100) / 100
          }
          
          const discount = pItem.discount || pItem.discount_amount || pItem.line_discount || 0
          
          // For Companion Hunters, don't display category
          const description = pItem.item_name || pItem.description || ''
          let category = pItem.item_type || pItem.category || ''
          if (description.toLowerCase().includes('companion')) {
            category = '' // Leave category empty for Companion Hunters
          }
          
          return {
            // Use explicit catalog item_id when provided by pricing; do NOT fall back to pricing-line id
            item_id: pItem.item_id ?? null,
            name: description,
            category: category,
            quantity: qty,
            rate: unitRate,
            discount: discount
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
        
        // ===== MERGE ENQUIRY PARTICIPANTS AS ADDITIONAL PARTIES =====
        // The pricing parties only return the client-level party (e.g. CUSTOMER).
        // The enquiry may have additional named participants (hunters) that should
        // also appear as order parties with the same CUSTOMER role.
        if (form.enquiryId) {
          try {
            const baseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
            const token = localStorage.getItem('token')
            const authHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }

            // Step 1: Fetch enquiry participants to get entity_ids
            const enquiryResp = await fetch(
              `${baseUrl}/sales/sales-inquiries/${form.enquiryId}`,
              { headers: authHeaders }
            )
            if (enquiryResp.ok) {
              const enquiryJson = await enquiryResp.json()
              const enquiryData = enquiryJson?.data || enquiryJson
              const enquiryParticipants = enquiryData?.participants || []
              
              // Store raw participant data for order-split logic
              enquiryParticipantsRaw.value = enquiryParticipants
              
              // Collect entity_ids already present in order parties to avoid duplicates
              const existingEntityIds = new Set(
                form.parties
                  .filter((p: any) => p.entity)
                  .map((p: any) => String(p.entity))
              )
              
              // Step 2: For each participant not already in parties, fetch entity name by ID
              for (const participant of enquiryParticipants) {
                const entityId = participant.entity_id
                if (!entityId) continue
                if (existingEntityIds.has(String(entityId))) continue
                
                // Try to resolve entity name from the participant data first
                let entityName = participant.entity?.full_name
                  || participant.entity?.name
                  || participant.entity_name
                  || participant.name
                  || ''
                
                // If no name resolved, fetch entity directly by ID
                if (!entityName) {
                  try {
                    const entResp = await fetch(`${baseUrl}/entities/${entityId}`, { headers: authHeaders })
                    if (entResp.ok) {
                      const entJson = await entResp.json()
                      const entData = entJson?.data || entJson
                      entityName = entData?.full_name || entData?.name || ''
                    }
                  } catch (e) {
                    console.warn(`Could not fetch entity ${entityId}:`, e)
                  }
                }
                
                form.parties.push({
                  role: 'CUSTOMER',
                  entity: entityId.toString(),
                  entity_name: entityName,
                  contact_person: participant.contact_name || '',
                  contact_phone: participant.contact_phone || '',
                  email: participant.contact_email || ''
                })
                
                existingEntityIds.add(String(entityId))
              }
            }
          } catch (err) {
            // Silently fail — order parties from pricing are still populated
            console.warn('Could not fetch enquiry participants for party merge:', err)
          }
        }
        
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

  // Pre-fill enquiry from query params (e.g. from pipeline)
  const queryEnquiryId = route.query.enquiry_id as string
  if (queryEnquiryId && !isEdit.value) {
    form.enquiryId = queryEnquiryId
  }
  
  // Load payment data if editing existing order
  if (isEdit.value) {
    loadPaymentSummary()
  }
})
</script>

<style scoped>
/* Textarea with bullet points styling */
.form-textarea {
  line-height: 1.6;
  font-family: inherit;
}

/* Payment Summary Banner */
.payment-summary-banner {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #3b82f6;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.summary-value.paid {
  color: #10b981;
}

.summary-value.remaining {
  color: #dc3545;
}

.summary-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  justify-content: flex-end;
}

.info-section {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.info-row .label {
  font-weight: 500;
  color: #64748b;
}

.info-row .value {
  color: #1e293b;
  font-weight: 600;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.form-group small {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 12px 0 8px 0;
  padding: 0;
}

.req {
  color: #dc3545;
  font-weight: 600;
}

/* Payment Items List */
.installment-payments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-item {
  background: white;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.payment-item:hover {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.payment-header {
  margin-bottom: 8px;
}

.payment-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.payment-badge.completed {
  background: #10b981;
}

.payment-badge.partial {
  background: #f59e0b;
}

.payment-badge.notstarted {
  background: #ef4444;
}

.payment-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.detail {
  display: flex;
  justify-content: space-between;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #1e293b;
  font-weight: 600;
}

.payment-progress {
  margin-bottom: 8px;
}

.progress-label {
  font-size: 11px;
  color: #64748b;
  text-align: right;
  margin-top: 2px;
}

.payment-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.history-date {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-row .label {
  color: #64748b;
  font-weight: 500;
}

.detail-row .value {
  color: #1e293b;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #64748b;
  font-size: 14px;
}

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

.btn.btn-outline-primary {
  border: 2px solid #2563eb;
  background: #ffffff;
  color: #2563eb;
}

.btn.btn-outline-primary:hover {
  background: #2563eb;
  color: #ffffff;
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

.data-table.parties-table {
  table-layout: fixed;
}

.data-table.parties-table th,
.data-table.parties-table td {
  width: 33.3333%;
}

/* ── Items Table (5 columns) ── */
.data-table.items-table {
  table-layout: fixed;
  width: 100%;
}

.data-table.items-table th:nth-child(1),
.data-table.items-table td:nth-child(1) {
  width: 30%;
  text-align: left;
}

.data-table.items-table th:nth-child(2),
.data-table.items-table td:nth-child(2) {
  width: 16%;
  text-align: center;
}

.data-table.items-table th:nth-child(3),
.data-table.items-table td:nth-child(3) {
  width: 10%;
  text-align: center;
}

.data-table.items-table th:nth-child(4),
.data-table.items-table td:nth-child(4) {
  width: 22%;
  text-align: right;
}

.data-table.items-table th:nth-child(5),
.data-table.items-table td:nth-child(5) {
  width: 22%;
  text-align: right;
}

/* ── Parties Table (3 columns) ── */
.data-table.parties-data-table {
  table-layout: fixed;
  width: 100%;
}

.data-table.parties-data-table th:nth-child(1),
.data-table.parties-data-table td:nth-child(1) {
  width: 20%;
  text-align: left;
}

.data-table.parties-data-table th:nth-child(2),
.data-table.parties-data-table td:nth-child(2) {
  width: 50%;
  text-align: left;
}

.data-table.parties-data-table th:nth-child(3),
.data-table.parties-data-table td:nth-child(3) {
  width: 30%;
  text-align: left;
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

/* Validation styles for Order items */
.table-row-invalid {
  background-color: #fff5f5;
  border-left: 4px solid #ef5350;
}
.item-error {
  color: #b00020;
  font-size: 12px;
  margin-top: 4px;
}

</style>
