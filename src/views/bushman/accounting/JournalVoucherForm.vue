<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div class="page-head-left">
          <div class="crumbs">
            <span class="crumb-icon"><i class="fa fa-file-alt"></i></span>
            ACCOUNTING / <span>JOURNAL VOUCHER</span>
          </div>
          <h1>{{ isEdit ? 'Edit Journal Voucher' : 'Create Journal Voucher' }}</h1>
          <p class="subtitle">{{ isEdit ? 'Update voucher details and account entries' : 'Create a balanced journal entry with account lines and optional requisition linking' }}</p>
        </div>

        <div class="head-actions">
          <button class="btn btn-secondary" type="button" @click="goBack">
            <span class="btn-icon"><i class="fa fa-arrow-left"></i></span> Back
          </button>
          <button class="btn btn-secondary" type="button" @click="resetForm">
            <span class="btn-icon"><i class="fa fa-refresh"></i></span> Reset
          </button>
          <button class="btn btn-success" type="button" @click="submit" :disabled="saving || !balanceSummary.is_balanced">
            <span class="btn-icon"><i class="fa fa-check"></i></span> {{ saving ? 'Saving...' : isEdit ? 'Update Voucher' : 'Submit Entry' }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- 2-column layout -->
      <section class="grid">
        <!-- LEFT: Source Selection & JV Header -->
        <aside class="panel left-panel">
          <div class="form">
            <!-- Source Document Selection -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-file-import"></i></span>
                Source Document
              </div>

              <label class="field">
                <span class="lbl">Document Type <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-list"></i></span>
                  <select v-model="sourceDocumentType" @change="onSourceDocumentTypeChange" required>
                    <option value="">-- Select Document Type --</option>
                    <option value="REQUISITION">Requisition</option>
                    <option value="ORDER">Order</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="STOCK_ENTRY">Stock Entry</option>
                  </select>
                </div>
              </label>
            </div>

            <!-- Select Specific Requisition (Optional) -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-search"></i></span>
                Link to Requisition
              </div>

              <!-- Search Input -->
              <label class="field">
                <span class="lbl">Search & Select</span>
                <div style="position: relative;">
                  <div class="input-wrapper">
                    <span class="input-icon"><i class="fa fa-search"></i></span>
                    <input 
                      v-model="requisitionSearchQuery" 
                      @input="searchRequisitions"
                      @focus="showRequisitionDropdown = true"
                      type="text"
                      placeholder="Type REQ number..."
                      class="form-control"
                    />
                    <button 
                      v-if="requisitionSearchQuery && !selectedRequisition"
                      type="button" 
                      @click="clearRequisitionSearch"
                      class="btn-clear"
                    >
                      <i class="fa fa-times"></i>
                    </button>
                  </div>

                  <!-- Search Results Dropdown -->
                  <div v-if="requisitionSearchQuery && showRequisitionDropdown && filteredRequisitions.length > 0" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 250px; overflow-y: auto; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div 
                      v-for="req in filteredRequisitions.slice(0, 5)"
                      :key="req.id"
                      @click="selectSingleRequisition(req)"
                      style="padding: 10px 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;"
                      @mouseover="$event.target.style.background = '#f5f5f5'"
                      @mouseout="$event.target.style.background = 'white'"
                    >
                      <div style="font-weight: 600; color: #1e40af;">{{ `REQ-${String(req.id).padStart(4, '0')}` }}</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">{{ req.date?.split('T')[0] }} • {{ req.requisition_type?.name }}</div>
                    </div>
                  </div>
                </div>
              </label>

              <!-- Selected Requisition Display -->
              <div v-if="selectedRequisition" style="margin-top: 16px; padding: 12px; background: #f0f8ff; border: 2px solid #2563eb; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <div style="font-weight: 600; color: #1e40af; font-size: 15px;">{{ `REQ-${String(selectedRequisition.id).padStart(4, '0')}` }}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">{{ selectedRequisition.date?.split('T')[0] }} | {{ selectedRequisition.requisition_type?.name }} | {{ selectedRequisition.status }}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Total: {{ formatCurrency(selectedRequisition.total_amount) }}</div>
                  </div>
                  <button 
                    @click="clearSelectedRequisition"
                    style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;"
                    @mouseover="$event.target.style.background = '#b91c1c'"
                    @mouseout="$event.target.style.background = '#dc2626'"
                  >
                    <i class="fa fa-trash"></i> Clear
                  </button>
                </div>
                
                <!-- Auto-Populate Button -->
                <button 
                  type="button"
                  class="btn btn-info btn-sm w-100" 
                  @click="fetchAndAutoPopulate"
                  :disabled="savingLink"
                  style="margin-top: 10px; padding: 8px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 13px;"
                >
                  <i class="fa fa-download me-1"></i> {{ savingLink ? 'Loading...' : 'Load & Auto-Populate Accounts' }}
                </button>
              </div>
            </div>

            <!-- JV Header Details -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-file-alt"></i></span>
                JV Header Details
              </div>

              <label class="field">
                <span class="lbl">Posting Date <span class="req">*</span></span>
                <div class="input-wrapper">
                  <span class="input-icon"><i class="fa fa-calendar"></i></span>
                  <input v-model="form.posting_date" type="date" required />
                </div>
              </label>

              <label class="field">
                <span class="lbl">Narration / Description</span>
                <textarea 
                  v-model="form.narration" 
                  rows="2"
                  class="textarea" 
                  placeholder="Add any notes or remarks..."
                ></textarea>
              </label>
            </div>

            <!-- Linked Requisition Details -->
            <div v-if="selectedRequisition" class="form-section">
              <div class="section-title">
                <span class="section-icon"><i class="fa fa-check-circle"></i></span>
                Linked Requisition
              </div>

              <div style="padding: 12px; background: #f9fafb; border-radius: 6px;">
                <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">{{ `REQ-${String(selectedRequisition.id).padStart(4, '0')}` }}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                  <div><span style="color: #6b7280;">Date:</span> <span style="font-weight: 500;">{{ selectedRequisition.date?.split('T')[0] }}</span></div>
                  <div><span style="color: #6b7280;">Type:</span> <span style="font-weight: 500;">{{ selectedRequisition.requisition_type?.name }}</span></div>
                  <div><span style="color: #6b7280;">Status:</span> <span style="font-weight: 500;">{{ selectedRequisition.status }}</span></div>
                  <div v-if="selectedRequisition.total_amount"><span style="color: #6b7280;">Amount:</span> <span style="font-weight: 500;">{{ formatCurrency(selectedRequisition.total_amount) }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT: Account Lines & Review -->
        <section class="panel right-panel">
          <div class="panel-header">
            <div class="panel-icon"><i class="fa fa-list-alt"></i></div>
            <div class="panel-title-text">
              <h3>Account Lines & Review</h3>
              <p>Add account lines and review entries before submitting</p>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="tabs-float">
            <div class="tabs">
              <button type="button" class="tab" :class="{ active: activeTab === 'source' }" @click="activeTab = 'source'">
                <span class="tab-icon"><i class="fa fa-file-import"></i></span>
                <span class="tab-text">Sources </span>
              </button>
              <button type="button" class="tab" :class="{ active: activeTab === 'lines' }" @click="activeTab = 'lines'">
                <span class="tab-icon"><i class="fa fa-list"></i></span>
                <span class="tab-text">Account Lines</span>
                <span class="tab-count" v-if="form.accounts.length > 0">{{ form.accounts.length }}</span>
              </button>
            </div>
          </div>

          <!-- TAB CONTENT -->
          <div class="tab-content">
            <!-- SOURCE INFO TAB -->
            <div v-show="activeTab === 'source'" class="tab-pane">
              <div class="section-content">
                <div v-if="selectedRequisition">
                  <h6 style="margin: 0 0 16px 0; font-weight: 600;"><i class="fa fa-file-alt me-2"></i>Requisition Details</h6>
                  
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                    <div>
                      <span style="color: #6b7280; font-weight: 500; font-size: 12px;">REQ #</span>
                      <div style="font-weight: 600; margin-top: 4px; color: #1e40af;">{{ `REQ-${String(selectedRequisition.id).padStart(4, '0')}` }}</div>
                    </div>
                    <div>
                      <span style="color: #6b7280; font-weight: 500; font-size: 12px;">Date</span>
                      <div style="font-weight: 600; margin-top: 4px;">{{ selectedRequisition.date?.split('T')[0] }}</div>
                    </div>
                    <div>
                      <span style="color: #6b7280; font-weight: 500; font-size: 12px;">Type</span>
                      <div style="font-weight: 600; margin-top: 4px;">{{ selectedRequisition.requisition_type?.name || 'N/A' }}</div>
                    </div>
                    <div>
                      <span style="color: #6b7280; font-weight: 500; font-size: 12px;">Status</span>
                      <div style="font-weight: 600; margin-top: 4px;">{{ selectedRequisition.status }}</div>
                    </div>
                    <div>
                      <span style="color: #6b7280; font-weight: 500; font-size: 12px;">Total Amount</span>
                      <div style="font-weight: 600; margin-top: 4px;">{{ formatCurrency(selectedRequisition.total_amount) }}</div>
                    </div>
                    <div>
                      <span style="color: #6b7280; font-weight: 500; font-size: 12px;">Source Type</span>
                      <div style="font-weight: 600; margin-top: 4px;">{{ selectedRequisition.source?.sourceType || 'N/A' }}</div>
                    </div>
                  </div>

                  <!-- Requisition Items Table -->
                  <div v-if="selectedRequisition.items && selectedRequisition.items.length">
                    <h6 style="margin: 0 0 12px 0; font-weight: 600; font-size: 14px;"><i class="fa fa-list me-2"></i>Line Items</h6>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                      <thead>
                        <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                          <th style="padding: 8px; text-align: left; font-weight: 600;">#</th>
                          <th style="padding: 8px; text-align: left; font-weight: 600;">Description</th>
                          <th style="padding: 8px; text-align: right; font-weight: 600;">Amount</th>
                          <th style="padding: 8px; text-align: left; font-weight: 600;">Accounts</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in selectedRequisition.items" :key="idx" style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 8px;">{{ idx + 1 }}</td>
                          <td style="padding: 8px;">{{ item.description || 'N/A' }}</td>
                          <td style="padding: 8px; text-align: right;">{{ formatCurrency(item.amount) }}</td>
                          <td style="padding: 8px;">{{ item.accounts?.map((a: any) => a.code).join(', ') || 'N/A' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- ACCOUNT LINES TAB (Auto-populated from Requisition) -->
            <div v-show="activeTab === 'lines'" class="tab-pane">
              <div class="section-content">
                <div v-if="form.accounts.length === 0 && !selectedRequisition" class="empty-state">
                  <div class="empty-state-icon"><i class="fa fa-list"></i></div>
                  <div class="empty-state-text">No account lines added yet. Link a requisition and click "Load & Auto-Populate" or manually add lines.</div>
                </div>

                <div v-else>
                  <!-- Account Lines List -->
                  <div>
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                      <h5 style="margin: 0; font-weight: 600;">Account Lines</h5>
                    </div>

                    <!-- Auto-Populated Note -->
                    <div class="info-box mb-3" v-if="selectedRequisition">
                      <i class="fa fa-info-circle"></i>
                      <span><strong>From Requisition:</strong> {{ `REQ-${String(selectedRequisition.id).padStart(4, '0')}` }}</span>
                    </div>

                    <!-- Add Line Button -->
                    <button type="button" class="btn btn-primary btn-sm" @click="addNewAccountLine" style="margin-bottom: 12px; padding: 6px 16px; font-size: 12px;">
                      <i class="fa fa-plus me-2"></i> Add New Account Line
                    </button>

                    <!-- Account Lines Table -->
                      <div class="table-wrapper">
                        <table class="data-table">
                          <thead>
                            <tr>
                              <th style="width: 8%">#</th>
                              <th style="width: 40%">Account</th>
                              <th style="width: 15%">Type</th>
                              <th style="width: 22%">Amount</th>
                              <th style="width: 15%">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            <!-- Confirmed Rows Only -->
                            <tr v-for="(line, index) in form.accounts" :key="`confirmed-${index}`" :class="{ 'auto-populated': line.from_requisition }">
                              <td class="text-center"><strong>{{ index + 1 }}</strong></td>
                              <td>
                                {{ line.account_code }} - {{ line.account_name }}
                                <span v-if="line.from_requisition" class="badge bg-info ms-1">Auto</span>
                              </td>
                              <td class="text-center">
                                <span :class="['badge', line.transaction_type === 'DR' ? 'bg-danger' : 'bg-success']">
                                  {{ line.transaction_type }}
                                </span>
                              </td>
                              <td class="text-end">{{ formatCurrency(line.amount) }}</td>
                              <td class="text-center">
                                <button type="button" class="btn btn-sm btn-outline-danger" @click="removeLine(index)" title="Remove">
                                  <i class="fa fa-trash"></i>
                                </button>
                              </td>
                            </tr>

                            <!-- Add New Account Line - Form Row in Table -->
                            <tr v-for="(editLine, eIdx) in editingAccountLines" :key="`editing-${eIdx}`" style="background: #f9fafb;">
                              <td colspan="5" style="padding: 16px !important;">
                                <div style="display: grid; grid-template-columns: 0.5fr 2.5fr 1fr 1.5fr 1.2fr; gap: 12px; align-items: flex-end;">
                                  <!-- Row Number -->
                                  <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <label class="form-label small" style="font-weight: 500; font-size: 11px;">#</label>
                                    <div style="padding: 8px; text-align: center; color: #6b7280;">{{ form.accounts.length + eIdx + 1 }}</div>
                                  </div>

                                  <!-- Account -->
                                  <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <label class="form-label small" style="font-weight: 500; font-size: 11px;">Account <span class="text-danger">*</span></label>
                                    <select v-model="editLine.account_id" class="form-select" style="font-size: 12px; padding: 6px 8px;">
                                      <option value="">-- Select --</option>
                                      <option v-for="account in accounts" :key="account.id" :value="String(account.id)">
                                        {{ account.code }} - {{ account.name }}
                                      </option>
                                    </select>
                                  </div>

                                  <!-- Type -->
                                  <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <label class="form-label small" style="font-weight: 500; font-size: 11px;">Type <span class="text-danger">*</span></label>
                                    <select v-model="editLine.transaction_type" class="form-select" style="font-size: 12px; padding: 6px 8px;">
                                      <option value="">-- --</option>
                                      <option value="DR">DR</option>
                                      <option value="CR">CR</option>
                                    </select>
                                  </div>

                                  <!-- Amount -->
                                  <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <label class="form-label small" style="font-weight: 500; font-size: 11px;">Amount <span class="text-danger">*</span></label>
                                    <input v-model.number="editLine.amount" type="number" step="0.01" placeholder="0.00" class="form-control form-control-sm" style="font-size: 12px; padding: 6px 8px;" />
                                  </div>

                                  <!-- Action Buttons -->
                                  <div style="display: flex; gap: 6px; justify-content: flex-end;">
                                    <button @click="addAccountLine(eIdx)" class="btn btn-success btn-sm" type="button" style="font-size: 11px; padding: 6px 10px; white-space: nowrap;">
                                      <i class="fa fa-check me-1"></i> Add
                                    </button>
                                    <button @click="cancelEditingAccountLine(eIdx)" class="btn btn-secondary btn-sm" type="button" style="font-size: 11px; padding: 6px 10px; white-space: nowrap;">
                                      <i class="fa fa-times me-1"></i> Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- Summary Row -->
                      <div v-if="form.accounts.length > 0" class="summary-box mt-3">
                        <div class="row">
                          <div class="col-md-6"></div>
                          <div class="col-md-3">
                            <div class="summary-item">
                              <span class="label">Total Debit:</span>
                              <span class="value text-danger">{{ formatCurrency(balanceSummary.total_debit) }}</span>
                            </div>
                          </div>
                          <div class="col-md-3">
                            <div class="summary-item">
                              <span class="label">Total Credit:</span>
                              <span class="value text-success">{{ formatCurrency(balanceSummary.total_credit) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="action-footer">
              <button type="button" class="btn ghost" @click="goBack">
                <span class="btn-icon"><i class="fa fa-times"></i></span> Cancel
              </button>
              <button type="button" class="btn primary" @click="submit" :disabled="saving || !balanceSummary.is_balanced">
                <span class="btn-icon"><i class="fa fa-check"></i></span> {{ saving ? 'Saving...' : 'Submit Journal Voucher' }}
              </button>
            </div>
        </section>
      </section>
    </main>

    <!-- Requisition Search Modal -->
    <div v-if="showRequisitionModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
        <!-- Modal Header -->
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Select Requisition</h2>
          <button 
            @click="showRequisitionModal = false" 
            style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;"
          >
            <i class="fa fa-times"></i>
          </button>
        </div>

        <!-- Modal Body - Search and Results -->
        <div style="padding: 20px; overflow-y: auto; flex: 1;">
          <!-- Search Input -->
          <label style="display: block; margin-bottom: 16px;">
            <span style="display: block; font-weight: 500; margin-bottom: 6px;">Search Requisitions</span>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;"><i class="fa fa-search"></i></span>
              <input 
                v-model="requisitionSearchQuery" 
                @input="searchRequisitions"
                type="text"
                placeholder="Search by REQ #, date, or status..."
                style="width: 100%; padding: 10px 10px 10px 36px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
              />
            </div>
          </label>

          <!-- Loading State -->
          <div v-if="searchingRequisitions" style="text-align: center; padding: 32px;">
            <i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #2563eb;"></i>
            <p style="margin-top: 12px; color: #6b7280;">Searching...</p>
          </div>

          <!-- Results List -->
          <div v-else-if="filteredRequisitions.length > 0" style="display: grid; gap: 12px;">
            <div 
              v-for="req in filteredRequisitions"
              :key="req.id"
              @click="selectRequisitionFromSearch(req)"
              style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s; background: white;"
              @mouseover="$event.currentTarget.style.background = '#f3f4f6'; $event.currentTarget.style.borderColor = '#2563eb';"
              @mouseout="$event.currentTarget.style.background = 'white'; $event.currentTarget.style.borderColor = '#e5e7eb';"
            >
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #1e40af;">{{ `REQ-${String(req.id).padStart(4, '0')}` }}</span>
                <span style="font-size: 12px; color: #6b7280;">{{ req.date?.split('T')[0] }}</span>
              </div>
              <div style="display: flex; gap: 12px; font-size: 13px; color: #6b7280;">
                <span>{{ req.requisition_type?.name || 'N/A' }}</span>
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 3px;">{{ req.status }}</span>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else style="text-align: center; padding: 32px; color: #6b7280;">
            <i class="fa fa-inbox" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
            <p>{{ requisitionSearchQuery ? 'No requisitions found' : 'Enter a search term to find requisitions' }}</p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div style="padding: 16px; border-top: 1px solid #e5e7eb; text-align: right;">
          <button 
            @click="showRequisitionModal = false"
            style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s;"
            @mouseover="$event.target.style.background = '#d1d5db'"
            @mouseout="$event.target.style.background = '#e5e7eb'"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()
const appOptionStore = useAppOptionStore()

const isEdit = computed(() => !!route.params.id)
const voucherId = computed(() => route.params.id ? Number(route.params.id) : null)

const saving = ref(false)
const savingLink = ref(false)
const originalSidebarState = ref(false)
const sidebarMinifiedForCreate = ref(false)
const activeTab = ref('source')

// Workflow State
const sourceDocumentType = ref('')  // Step 1: REQUISITION, ORDER, CONTRACT, etc

// Requisition Linking - Search
const requisitionSearchQuery = ref('')
const searchingRequisitions = ref(false)
const showRequisitionDropdown = ref(false)
const showRequisitionModal = ref(false)
const filteredRequisitions = ref([] as any[])
const selectedRequisition = ref(null as any)  // Single requisition only
const errorMessage = ref('')
let searchTimeout: NodeJS.Timeout | null = null

// Form Data
const form = ref({
  document_type_id: '',
  currency_id: '',
  document_number: '',
  posting_date: new Date().toISOString().split('T')[0],
  reference_no: '',
  control_number: '',
  primary_account_id: '',
  exchange_rate: 1.0,
  status: 'DRAFT',
  narration: '',
  accounts: [] as any[],
  payments: [] as any[]
})

// Editing Account Lines (for inline form rows)
const editingAccountLines = ref<any[]>([])

// New Payment Input
const newPayment = ref({
  bank_account_id: '',
  instrument_type: '',
  instrument_number: '',
  instrument_date: '',
  amount: 0,
  payee: '',
  currency_id: ''
})

// Reference Data
const documentTypes = computed(() => accountingStore.documentTypes)
const currencies = computed(() => accountingStore.currencies)
const accounts = computed(() => accountingStore.accounts)
const requisitionsForLinking = computed(() => accountingStore.requisitionsForLinking)

// Balance Summary
const balanceSummary = computed(() => {
  const debits = form.value.accounts
    .filter(a => a.transaction_type === 'DR')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const credits = form.value.accounts
    .filter(a => a.transaction_type === 'CR')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const difference = debits - credits
  
  return {
    total_debit: debits,
    total_credit: credits,
    difference: difference,
    is_balanced: Math.abs(difference) < 0.01
  }
})

// Total Amount (sum of all lines)
const totalAmount = computed(() => {
  return form.value.accounts.reduce((sum, a) => sum + (a.amount || 0), 0)
})

// Methods

// Add new account line form row
function addNewAccountLine() {
  editingAccountLines.value.push({
    account_id: '',
    transaction_type: '',
    amount: 0,
    exchange_rate: 1.0
  })
}

// Confirm and add account line from editing row
function addAccountLine(idx: number) {
  const editLine = editingAccountLines.value[idx]
  
  if (!editLine.account_id || !editLine.transaction_type || !editLine.amount) {
    init({
      title: 'Validation Error',
      message: 'Please fill all required fields (Account, Type, Amount)',
      type: 'warning'
    })
    return
  }

  const selectedAccount = accounts.value.find(a => String(a.id) === editLine.account_id)
  
  // Add to confirmed accounts array
  form.value.accounts.push({
    account_id: editLine.account_id,
    account_code: selectedAccount?.code,
    account_name: selectedAccount?.name,
    transaction_type: editLine.transaction_type,
    amount: editLine.amount,
    exchange_rate: editLine.exchange_rate || 1.0
  })

  // Remove from editing array
  editingAccountLines.value.splice(idx, 1)
  
  init({
    title: 'Success',
    message: 'Account line added',
    type: 'success'
  })
}

// Cancel editing line without saving
function cancelEditingAccountLine(idx: number) {
  editingAccountLines.value.splice(idx, 1)
}

function removeLine(index: number) {
  form.value.accounts.splice(index, 1)
}

function addPayment() {
  if (!newPayment.value.instrument_type || !newPayment.value.amount) {
    init({
      title: 'Validation Error',
      message: 'Please fill required payment fields',
      type: 'warning'
    })
    return
  }

  form.value.payments.push({
    instrument_type: newPayment.value.instrument_type,
    instrument_number: newPayment.value.instrument_number || '',
    instrument_date: newPayment.value.instrument_date || '',
    payee: newPayment.value.payee || '',
    amount: newPayment.value.amount,
    currency_id: form.value.currency_id
  })

  // Reset form
  newPayment.value = {
    bank_account_id: '',
    instrument_type: '',
    instrument_number: '',
    instrument_date: '',
    amount: 0,
    payee: '',
    currency_id: ''
  }

  init({
    title: 'Success',
    message: 'Payment details added',
    type: 'success'
  })
}

function removePayment(index: number) {
  form.value.payments.splice(index, 1)
}


// Search Requisitions
function searchRequisitions() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!requisitionSearchQuery.value.trim()) {
    filteredRequisitions.value = []
    return
  }

  searchTimeout = setTimeout(() => {
    searchingRequisitions.value = true
    try {
      // Use local search from store data
      const rawReqs = requisitionsForLinking.value || []
      const searchLower = requisitionSearchQuery.value.toLowerCase().trim()
      
      console.log('Searching requisitions:', {
        query: searchLower,
        totalAvailable: rawReqs.length,
        rawReqs: rawReqs
      })
      
      if (!rawReqs || rawReqs.length === 0) {
        console.warn('No requisitions available in store')
        filteredRequisitions.value = []
        searchingRequisitions.value = false
        return
      }
      
      const allReqs = rawReqs.filter((req: any) => req)
      
      // Generate requisition number format (REQ-0003) from ID
      const formatReqNumber = (id: number) => `REQ-${String(id).padStart(4, '0')}`
      
      // Search: REQ number (formatted), date, status, type, amount, requisition_number
      const results = allReqs
        .filter(req => {
          const searchableText = [
            formatReqNumber(req.id),
            String(req.date || ''),
            String(req.status || ''),
            String(req.requisition_type?.name || ''),
            String(req.total_amount || ''),
            String(req.requisition_number || '')
          ]
            .map(v => v.toLowerCase())
            .join(' ')
          
          const matches = searchableText.includes(searchLower)
          if (matches) {
            console.log('Match found:', {
              id: req.id,
              reqNumber: formatReqNumber(req.id),
              searchableText
            })
          }
          return matches
        })
        .slice(0, 10)
      
      console.log('Search results:', results)
      filteredRequisitions.value = results
    } catch (error) {
      console.error('Search error:', error)
      filteredRequisitions.value = []
    } finally {
      searchingRequisitions.value = false
    }
  }, 300) // Debounce 300ms
}

function selectSingleRequisition(requisition: any) {
  console.log('Selecting requisition:', requisition)
  selectedRequisition.value = requisition
  
  nextTick(() => {
    requisitionSearchQuery.value = ''
    filteredRequisitions.value = []
    showRequisitionDropdown.value = false
    console.log('Requisition selected')
  })
}

function clearRequisitionSearch() {
  requisitionSearchQuery.value = ''
  filteredRequisitions.value = []
  showRequisitionDropdown.value = false
}

function clearSelectedRequisition() {
  selectedRequisition.value = null
  requisitionSearchQuery.value = ''
  filteredRequisitions.value = []
}

// Step 1: Source Document Type Changed
function onSourceDocumentTypeChange() {
  // Reset requisition selection when source type changes
  selectedRequisition.value = null
}

// Step 2: Requisition Selected (deprecated, kept for backward compatibility)
async function onRequisitionSelect() {
  // This is now handled by selectSingleRequisition
}

// Step 3: Auto-fetch and Auto-populate Account Lines from Requisition
async function fetchAndAutoPopulate() {
  if (!selectedRequisition.value) {
    init({
      title: 'Error',
      message: 'Please select a requisition first',
      type: 'danger'
    })
    return
  }

  savingLink.value = true
  try {
    // Use the currently selected requisition data
    const requisitionData = selectedRequisition.value

    console.log('Auto-populating from requisition:', requisitionData)
    console.log('Requisition structure:', {
      items: requisitionData?.items,
      line_items: requisitionData?.line_items,
      requisition_items: requisitionData?.requisition_items
    })

    // Auto-populate account lines from requisition
    // Try different possible property names for items
    const items = requisitionData?.items || requisitionData?.line_items || requisitionData?.requisition_items || []
    
    if (items && Array.isArray(items) && items.length > 0) {
      form.value.accounts = []

      // Process each requisition item to create account entries
      for (const item of items) {
        console.log('Processing item:', item)
        console.log('Item keys:', Object.keys(item))
        console.log('Item structure - accounts:', item.accounts, 'gl_accounts:', item.gl_accounts, 'account_id:', item.account_id, 'account:', item.account)
        
        // Get GL accounts associated with this item - try multiple property names
        const itemAccounts = item.accounts || item.gl_accounts || []
        
        if (itemAccounts && Array.isArray(itemAccounts) && itemAccounts.length > 0) {
          console.log('Found accounts array with', itemAccounts.length, 'accounts')
          for (const account of itemAccounts) {
            // Determine transaction type based on source type or account category
            const transactionType = getTransactionType(requisitionData.source?.sourceType, account.type)
            
            form.value.accounts.push({
              account_id: account.id,
              account_code: account.code,
              account_name: account.name,
              transaction_type: transactionType,
              amount: item.amount || 0,
              exchange_rate: requisitionData.exchange_rate || 1.0,
              from_requisition: true,  // Flag to show this was auto-populated
              requisition_item_id: item.id,
              dimensions: item.dimensions || []
            })
            console.log('Added account:', account.code, account.name)
          }
        } else if (item.account_id) {
          // If item has a single account_id directly, create account line from it
          console.log('Item has direct account_id:', item.account_id)
          const transactionType = getTransactionType(requisitionData.source?.sourceType, item.account_type)
          
          form.value.accounts.push({
            account_id: item.account_id,
            account_code: item.account_code || '',
            account_name: item.account_name || '',
            transaction_type: transactionType,
            amount: item.amount || 0,
            exchange_rate: requisitionData.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
          console.log('Added single account from account_id')
        } else if (item.account) {
          // If item has an account object directly
          console.log('Item has account object:', item.account)
          const account = item.account
          const transactionType = getTransactionType(requisitionData.source?.sourceType, account.type)
          
          form.value.accounts.push({
            account_id: account.id,
            account_code: account.code,
            account_name: account.name,
            transaction_type: transactionType,
            amount: item.amount || 0,
            exchange_rate: requisitionData.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
          console.log('Added account from account object')
        } else {
          console.warn('Item has no accounts or account_id:', item)
        }
      }
    } else {
      console.warn('No items found in requisition. Items array:', items)
    }

    console.log('Final accounts populated:', form.value.accounts)

    // Auto-populate JV header fields from requisition
    if (requisitionData.currency_id) {
      form.value.currency_id = String(requisitionData.currency_id)
    }
    if (requisitionData.exchange_rate) {
      form.value.exchange_rate = requisitionData.exchange_rate
    }

    init({
      title: 'Success',
      message: `Auto-populated ${form.value.accounts.length} account lines from requisition`,
      type: 'success'
    })
  } catch (error: any) {
    console.error('Error auto-populating requisition:', error)
    init({
      title: 'Error',
      message: error?.message || 'Failed to auto-populate requisition details. Please try again.',
      type: 'danger'
    })
  } finally {
    savingLink.value = false
  }
}

// Helper function to determine transaction type based on source and account
function getTransactionType(sourceType: string, accountType?: string): string {
  // This logic depends on your business rules
  // For now, simple logic: CASH/VENDOR payments -> Debit cash/vendor, Credit expense
  // You may need to enhance this based on actual GL structure
  
  if (sourceType === 'CASH') {
    return accountType === 'ASSET' ? 'CR' : 'DR'  // Credit cash asset, debit expense
  } else if (sourceType === 'VENDOR') {
    return accountType === 'LIABILITY' ? 'CR' : 'DR'  // Credit AP liability, debit expense
  } else if (sourceType === 'STORE') {
    return accountType === 'ASSET' ? 'CR' : 'DR'  // Credit inventory asset, debit expense
  }
  
  // Default: Assume it's a balanced entry
  return 'DR'
}





function unlinkRequisition(linkId: number) {
  linkedRequisitions.value = linkedRequisitions.value.filter(link => link.id !== linkId)
  init({
    title: 'Success',
    message: 'Requisition unlinked',
    type: 'success'
  })
}

function getItemStatusClass(item: any): string {
  const remaining = (item.amount || 0) - (item.posted_amount || 0)
  if (remaining <= 0) return 'badge-success'
  if (remaining < (item.amount || 0) / 2) return 'badge-warning'
  return 'badge-info'
}

async function submit() {
  // Validation: Must have account lines
  if (form.value.accounts.length === 0) {
    init({
      title: 'Validation Error',
      message: 'Please add at least one account line',
      type: 'danger'
    })
    return
  }

  // Validation: Must be balanced
  if (!balanceSummary.value.is_balanced) {
    init({
      title: 'Validation Error',
      message: 'Journal voucher must be balanced (Debit = Credit)',
      type: 'danger'
    })
    return
  }

  // Validation: Must have narration
  if (!form.value.narration || form.value.narration.trim() === '') {
    init({
      title: 'Validation Error',
      message: 'Please provide narration/description for the journal voucher',
      type: 'danger'
    })
    return
  }

  saving.value = true
  try {
    const payload = {
      document_type_id: Number(form.value.document_type_id),
      currency_id: Number(form.value.currency_id),
      posting_date: form.value.posting_date,
      narration: form.value.narration || null,
      status: form.value.status,
      accounts: form.value.accounts.map(a => ({
        account_id: Number(a.account_id),
        transaction_type: a.transaction_type,
        amount: a.amount,
        exchange_rate: a.exchange_rate || 1.0
      })),
      payments: form.value.payments.length > 0 ? form.value.payments.map(p => ({
        instrument_type: p.instrument_type,
        instrument_number: p.instrument_number || null,
        instrument_date: p.instrument_date || null,
        payee: p.payee || null,
        amount: p.amount,
        currency_id: Number(p.currency_id)
      })) : []
    }

    let voucherResponse
    if (isEdit.value && voucherId.value) {
      await accountingStore.updateJournalVoucher(voucherId.value, payload)
      voucherResponse = await accountingStore.getJournalVoucher(voucherId.value)
      init({
        title: 'Success',
        message: 'Journal voucher updated successfully',
        type: 'success'
      })
    } else {
      voucherResponse = await accountingStore.createJournalVoucher(payload)
      init({
        title: 'Success',
        message: 'Journal voucher created successfully',
        type: 'success'
      })
    }

    // Step 6: Create journal_voucher_account_links to link JV to source requisition
    if (voucherResponse?.data?.data) {
      const createdVoucher = voucherResponse.data.data
      const voucherId = createdVoucher.id

      // For each account line, create a link to the source requisition if available
      if (selectedRequisition.value && createdVoucher.accounts && createdVoucher.accounts.length > 0) {
        for (const account of createdVoucher.accounts) {
          try {
            // Create link: journal_voucher_account_links
            await fetch('/api/journal-voucher-account-links', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                journal_voucher_account_id: account.id,
                linkable_type: 'REQUISITION',
                linkable_id: Number(selectedRequisition.value.id)
              })
            })
          } catch (linkError) {
            console.warn('Warning: Could not create account link:', linkError)
            // Don't fail the entire operation if linking fails
          }
        }
      }
    }

    if (sidebarMinifiedForCreate.value && !isEdit.value) {
      appOptionStore.appSidebarMinified = originalSidebarState.value
      sidebarMinifiedForCreate.value = false
    }

    router.push({ name: 'journal-vouchers' })
  } catch (error: any) {
    init({
      title: 'Error',
      message: error.response?.data?.message || error.message || 'Error saving journal voucher',
      type: 'danger'
    })
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (sidebarMinifiedForCreate.value) {
    appOptionStore.appSidebarMinified = originalSidebarState.value
    sidebarMinifiedForCreate.value = false
  }
  router.push({ name: 'journal-vouchers' })
}

function resetForm() {
  form.value = {
    document_type_id: '',
    currency_id: '',
    document_number: '',
    posting_date: new Date().toISOString().split('T')[0],
    primary_account_id: '',
    exchange_rate: 1.0,
    status: 'DRAFT',
    narration: '',
    accounts: [],
    payments: []
  }
  selectedRequisition.value = null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Lifecycle
onMounted(async () => {
  // Minify sidebar for create mode (like Requisition page)
  if (!isEdit.value) {
    originalSidebarState.value = appOptionStore.appSidebarMinified
    appOptionStore.appSidebarMinified = true
    sidebarMinifiedForCreate.value = true
  }

  // Add click outside listener to close search dropdown
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.field')) {
      showRequisitionDropdown.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)

  try {
    await Promise.all([
      accountingStore.fetchDocumentTypes(),
      accountingStore.fetchCurrencies(),
      accountingStore.fetchAccounts(),
      accountingStore.fetchRequisitionsForLinking()
    ])
  } catch (error: any) {
    console.error('Error loading metadata:', error)
    init({
      title: 'Warning',
      message: 'Some form data could not be loaded. The form will still work, but some options may be limited.',
      type: 'warning'
    })
  }

  if (isEdit.value && voucherId.value) {
    try {
      const response = await accountingStore.getJournalVoucher(voucherId.value)
      const voucher = response.data.data
      form.value = {
        document_type_id: String(voucher.document_type_id),
        currency_id: String(voucher.currency_id),
        document_number: voucher.document_number || '',
        posting_date: voucher.posting_date,
        primary_account_id: String(voucher.primary_account_id || ''),
        exchange_rate: voucher.exchange_rate || 1.0,
        status: voucher.status || 'DRAFT',
        narration: voucher.narration || '',
        accounts: voucher.accounts || [],
        payments: voucher.payments || []
      }

      // Load linked requisitions if any (for future use)
      if (voucher.accounts && voucher.accounts.length > 0) {
        try {
          // This can be used to fetch and display linked documents if needed
          // const linkedDocsResponse = await accountingStore.getLinkedDocumentsForVoucher(voucherId.value, voucher.accounts[0].id)
        } catch (err) {
          // Silently fail if no linked documents
        }
      }
    } catch (error) {
      init({
        title: 'Error',
        message: 'Failed to load journal voucher',
        type: 'danger'
      })
    }
  }

  // Store the event listener reference for cleanup
  ;(window as any).__jvFormClickOutside = handleClickOutside
})

// Restore sidebar on unmount
onUnmounted(() => {
  if (sidebarMinifiedForCreate.value) {
    appOptionStore.appSidebarMinified = originalSidebarState.value
    sidebarMinifiedForCreate.value = false
  }

  // Remove click outside listener
  const handleClickOutside = (window as any).__jvFormClickOutside
  if (handleClickOutside) {
    document.removeEventListener('click', handleClickOutside)
  }

  // Clear search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
:root {
  --bg: #f5f7fa;
  --bg-secondary: #e8ecf0;
  --card: #ffffff;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --muted: #94a3b8;
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #059669;
  --success-light: #d1fae5;
  --warning: #d97706;
  --danger: #dc2626;
  --purple: #7c3aed;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius: 12px;
  --radius-lg: 16px;
}

.ps-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.content {
  padding: 14px 16px 20px;
  max-width: 1800px;
  margin: 0 auto;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.page-head-left {
  flex: 1;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-weight: 600;
}

.crumbs span {
  font-weight: 700;
  color: var(--primary);
}

.crumb-icon {
  font-size: 14px;
}

h1 {
  margin: 6px 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Grid Layout - 2 Column */
.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  align-items: start;
}

/* Panel Base Styles */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
}

.panel-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.left-panel {
  grid-column: 1;
}

.right-panel {
  grid-column: 2;
  min-height: 600px;
}

.panel-title-text h3 {
  margin: 0;
  font-weight: 700;
  font-size: 16px;
  color: #0f172a;
}

.panel-title-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

/* Form Styles */
.form {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbfc;
}

.form-section {
  background: #ffffff;
  border-radius: var(--radius);
  padding: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #dbeafe;
}

.section-icon {
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field:last-child {
  margin-bottom: 0;
}

.lbl {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
}

.req {
  color: var(--danger);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 10px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px 8px 32px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px #dbeafe;
}

/* Balance Status */
.balance-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius);
  border: 2px solid var(--border);
  margin-top: 8px;
}

.balance-status.balanced {
  background: #d1fae5;
  border-color: #10b981;
}

.balance-status.unbalanced {
  background: #fee2e2;
  border-color: #ef4444;
}

.status-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.balance-status.balanced .status-icon {
  color: #10b981;
}

.balance-status.unbalanced .status-icon {
  color: #ef4444;
}

.status-text {
  flex: 1;
}

.status-label {
  font-weight: 700;
  font-size: 13px;
  color: inherit;
}

.status-detail {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* Tabs */
.tabs-float {
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tabs {
  display: flex;
  gap: 4px;
  align-items: center;
}

.tab {
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s ease;
}

.tab:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.tab.active {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.tab-icon {
  font-size: 14px;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

/* Tab Content */
.tab-content {
  padding: 14px;
  min-height: 300px;
  background: #f8fafc;
}

.tab-pane {
  display: block;
}

.section-content {
  padding: 0;
}

/* Action Footer */
.action-footer {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border-top: 1px solid var(--border);
  justify-content: flex-end;
}

/* Tables */
.table-wrapper {
  margin-top: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: white;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.data-table thead {
  background: #f1f5f9;
  border-bottom: 2px solid var(--border);
}

.data-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.data-table tfoot {
  background: #f8fafc;
  border-top: 2px solid var(--border);
  font-weight: 700;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  background: #f8fafc;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.empty-state-icon {
  font-size: 32px;
  margin-bottom: 10px;
  color: var(--muted);
}

.empty-state-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.summary-card {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  text-align: center;
}

.card-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.card-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
}

.card-value.warning {
  color: var(--warning);
}

.card-value.success {
  color: var(--success);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--primary);
  background: var(--card);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  color: var(--primary);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
}

.btn.primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.btn-primary {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
  font-weight: 600;
}

.btn.primary:hover:not(:disabled) {
  background: #1e40af;
}

.btn.secondary {
  background: #dbeafe;
  border-color: #2563eb;
  color: #1e40af;
}

.btn.secondary:hover:not(:disabled) {
  background: #bfdbfe;
}

.btn.ghost {
  background: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.btn.ghost:hover:not(:disabled) {
  background: #eff6ff;
}

.btn.success {
  background: #2563eb;
  border-color: #1e40af;
  color: white;
}

.btn.success:hover:not(:disabled) {
  background: #1e40af;
}

.btn-outline-danger {
  background: white;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.btn-outline-danger:hover:not(:disabled) {
  background: #fee2e2;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form Row */
.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.form-row.g-2 > * {
  flex: 1;
  min-width: 150px;
}

.add-line-form {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.form-control {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px #dbeafe;
}

.form-control-sm {
  padding: 6px 8px;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .left-panel {
    grid-column: 1;
  }

  .right-panel {
    grid-column: 1;
  }
}

/* Search Results Dropdown */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-loading,
.search-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.search-loading {
  color: var(--primary);
}

.results-list {
  max-height: 280px;
  overflow-y: auto;
}

.result-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s ease;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8fafc;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.result-number {
  font-weight: 600;
  color: var(--text);
  font-size: 13px;
}

.result-amount {
  font-weight: 600;
  color: var(--primary);
  font-size: 13px;
}

.result-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.result-type {
  color: var(--text-secondary);
}

.result-status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-draft {
  background: #e0e7ff;
  color: #3730a3;
}

/* Selected Requisition Card */
.selected-requisition-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 12px;
}

.selected-requisition-card .card-header {
  background: #f1f5f9;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.selected-requisition-card .card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
}

.selected-requisition-card .card-title i {
  color: var(--success);
  font-size: 14px;
}

.selected-requisition-card .btn-icon-small {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  transition: color 0.2s ease;
}

.selected-requisition-card .btn-icon-small:hover {
  color: var(--danger);
}

.selected-requisition-card .card-body {
  padding: 12px 16px;
}

.selected-requisition-card .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.selected-requisition-card .info-row:last-of-type {
  border-bottom: none;
}

.selected-requisition-card .info-row .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.selected-requisition-card .info-row .value {
  color: var(--text);
  font-weight: 600;
}

.selected-requisition-card .info-row .badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.selected-requisition-card .card-footer {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

/* Input wrapper with clear button */
.input-wrapper {
  position: relative;
}

.btn-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  transition: color 0.2s ease;
}

.btn-clear:hover {
  color: var(--danger);
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }

  .head-actions {
    width: 100%;
  }

  .head-actions .btn {
    flex: 1;
  }

  .form-row {
    flex-direction: column;
  }

  .form-row > * {
    width: 100%;
  }

  .tabs {
    flex-wrap: wrap;
  }

  .tab {
    flex: 1;
    min-width: 120px;
  }
}
</style>