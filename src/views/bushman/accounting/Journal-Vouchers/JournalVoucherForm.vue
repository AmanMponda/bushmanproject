<template>
  <div class="ps-page">
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0 20px; margin-bottom: 20px;">
        <div class="page-head-left">
          <h1>New Voucher</h1>
        </div>
        <div class="page-head-right" style="display: flex; gap: 12px;">
          <button 
            type="button" 
            @click="() => router.push({ name: 'journal-vouchers' })"
            style="background: white; border: 2px solid #2563eb; color: #2563eb; cursor: pointer; font-size: 14px; font-weight: 500; padding: 8px 16px; border-radius: 6px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
          >
            <i class="fa fa-arrow-left"></i> Back to Vouchers
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; background: #f9fafb; padding: 0 20px;">
        <button 
          type="button" 
          @click="voucherTab = 'payment'"
          :style="{ borderBottom: voucherTab === 'payment' ? '3px solid #2563eb' : 'none', color: voucherTab === 'payment' ? '#2563eb' : '#6b7280' }"
          style="padding: 12px 20px; font-weight: 500; cursor: pointer; border: none; background: none; transition: all 0.2s;"
        >
          Payment
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mx-3" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ errorMessage }}
        <button type="button" class="btn-close" @click="errorMessage = ''"></button>
      </div>

      <!-- Payment Tab Content -->
      <div v-show="voucherTab === 'payment'" style="padding: 20px;">
        <div style="max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- VOUCHER DETAILS -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1.2fr 1.2fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Voucher No. <span style="color: #dc2626;">*</span></label>
              <Multiselect 
                ref="voucherNumberSelect" 
                v-model="voucherNumberSelection"
                class="v-select-field" 
                :options="voucherNumberOptions"
                label="label" 
                track-by="value" 
                :allow-empty="true" 
                :multiple="false"
                :close-on-select="true"
                :searchable="false"
                placeholder="Select voucher number...">
              </Multiselect>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Date <span style="color: #dc2626;">*</span></label>
              <input v-model="form.posting_date" type="date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Branch <span style="color: #dc2626;">*</span></label>
              <Multiselect 
                ref="branchSelect" 
                v-model="branchSelection"
                class="v-select-field" 
                :options="branchOptions"
                label="label" 
                track-by="value" 
                :allow-empty="true" 
                :multiple="false"
                :close-on-select="true"
                :searchable="true"
                placeholder="Search or select branch...">
              </Multiselect>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Currency <span style="color: #dc2626;">*</span></label>
              <select v-model="form.currency_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <option value="">-- Select --</option>
                <option v-for="currency in currencies" :key="currency.id" :value="String(currency.id)">{{ currency.name }}</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Exchange Rate</label>
              <input v-model.number="form.exchange_rate" type="number" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;" />
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <!-- NOTES -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Notes</label>
            <textarea v-model="form.narration" placeholder="Enter notes..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; min-height: 100px; font-family: inherit;"></textarea>
          </div>

          <!-- PAYMENT DETAILS - MULTI ROW LAYOUT -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
            <!-- LEFT SIDE: PAYMENT FROM (CREDIT) -->
            <div>
              <h3 style="font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #dbeafe;">PAYMENT FROM (Credit)</h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">From Account <span style="color: #dc2626;">*</span></label>
                  <Multiselect 
                    ref="fromAccountSelect" 
                    v-model="fromAccountSelection"
                    class="v-select-field v-select-grouped" 
                    :options="groupedBankCashAccountOptions"
                    label="label" 
                    track-by="value" 
                    :allow-empty="true" 
                    :multiple="false"
                    :close-on-select="true" 
                    :group-select="false"
                    :option-height="28" 
                    :max-height="300"
                    :selectable="(option: any) => !option.isHeader && !option.isParentHeader && !option.$isDisabled"
                    :append-to-body="true" 
                    placeholder="Search or select account..."
                    :searchable="true" 
                    :internal-search="true" 
                    :options-limit="300"
                    @select="onFromAccountChange">
                    <template #option="{ option }">
                      <div :class="{ 
                        'source-header': option.isHeader || option.isParentHeader, 
                        'source-option': !option.isHeader && !option.isParentHeader,
                        'ps-3': option.isChild 
                      }">
                        {{ option.label }}
                      </div>
                    </template>
                  </Multiselect>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Fund Direction <span style="color: #dc2626;">*</span></label>
                  <Multiselect 
                    ref="fundDirectionSelect" 
                    v-model="fundDirectionSelection"
                    class="v-select-field" 
                    :options="fundDirectionOptions"
                    label="label" 
                    track-by="value" 
                    :allow-empty="true" 
                    :multiple="false"
                    :close-on-select="true"
                    :searchable="false"
                    placeholder="Select fund direction...">
                  </Multiselect>
                </div>
              </div>
            </div>

            <!-- RIGHT SIDE: TO (DEBIT) -->
            <div>
              <h3 style="font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #fee2e2;">TO (Debit)</h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div v-if="form.fund_direction === 'EXPENSE'">
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Payee</label>
                  <Multiselect 
                    ref="payeeSelect" 
                    v-model="payeeSelection"
                    class="v-select-field" 
                    :options="payeeOptions"
                    label="label" 
                    track-by="value" 
                    :allow-empty="true" 
                    :multiple="false"
                    :close-on-select="true"
                    :searchable="true"
                    placeholder="Search or select payee...">
                  </Multiselect>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px;">Requisition Numbers</label>
                  <div style="display: flex; gap: 8px;">
                    <input v-model="requisitionNumbersInput" type="text" placeholder="No requisitions fetched" style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; background: #f9fafb; color: #6b7280;" />
                    <button type="button" @click="fetchEligibleRequisitions" :disabled="loadingRequisitions || !form.from_account_id" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; font-weight: 500; font-size: 12px; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px;" :style="{ opacity: loadingRequisitions || !form.from_account_id ? 0.5 : 1, cursor: loadingRequisitions || !form.from_account_id ? 'not-allowed' : 'pointer' }">
                      <i :class="['fa', loadingRequisitions ? 'fa-spinner fa-spin' : 'fa-search']"></i> Fetch Eligible Requisitions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <!-- REQUISITIONS TABLE -->
          <div style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 4px; max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead style="background: #f3f4f6; border-bottom: 1px solid #d1d5db; position: sticky; top: 0;">
                <tr>
                  <th style="padding: 8px; text-align: center; font-weight: 600; width: 40px;">No.</th>
                  <th style="padding: 8px; text-align: left; font-weight: 600; min-width: 80px;">Req #</th>
                  <th style="padding: 8px; text-align: left; font-weight: 600;">Description</th>
                  <th style="padding: 8px; text-align: center; font-weight: 600; width: 70px;">Cost Ctr</th>
                  <th style="padding: 8px; text-align: right; font-weight: 600; width: 80px;">Amount</th>
                  <th style="padding: 8px; text-align: right; font-weight: 600; width: 90px;">Pay Amount</th>
                  <th style="padding: 8px; text-align: right; font-weight: 600; width: 80px;">Balance</th>
                  <th style="padding: 8px; text-align: center; font-weight: 600; width: 45px;">Act</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="payeeRequisitions.length === 0" style="border-bottom: 1px solid #e5e7eb;">
                  <td colspan="8" style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">No requisitions</td>
                </tr>
                <tr v-for="(req, idx) in payeeRequisitions" :key="idx" style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; text-align: center; color: #6b7280;">{{ idx + 1 }}</td>
                  <td style="padding: 8px; font-weight: 500; color: #1f2937; font-size: 11px;">{{ req.requisition_number }}</td>
                  <td style="padding: 8px; color: #6b7280; font-size: 11px;">{{ req.description }}</td>
                  <td style="padding: 8px; text-align: center; font-size: 10px;">
                    <span v-if="req._loadingDetails" style="color:#2563eb;"><i class="fa fa-spinner fa-spin"></i></span>
                    <span v-else style="background: #bfdbfe; color: #1e40af; padding: 2px 4px; border-radius: 3px; font-weight: 500;">
              {{ req.cost_center }}
              <span v-if="req.cost_center==='Multiple'" style="font-size:10px;color:#475569;margin-left:4px;"></span>
            </span>
                  </td>
                  <td style="padding: 8px; text-align: right; font-weight: 500; color: #1f2937; font-size: 11px;">
                    {{ formatCurrency(req.total_amount || 0) }}
                    <div v-if="req.prior_paid > 0" style="font-size: 9px; color: #f59e0b; font-weight: 600;">
                      Paid: {{ formatCurrency(req.prior_paid) }}
                    </div>
                  </td>
                  <td style="padding: 8px; text-align: right;">
                    <input 
                      v-model.number="req.amount_to_pay" 
                      @input="onAmountToPay(idx)"
                      type="number" 
                      step="0.01"
                      :max="req.balance_remaining || req.total_amount"
                      :min="0"
                      style="width: 100%; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; text-align: right;" 
                    />
                  </td>
                  <td style="padding: 8px; text-align: right; font-weight: 500; font-size: 11px;"
                      :style="{ color: (req.balance_remaining || req.total_amount) - (req.amount_to_pay || 0) <= 0 ? '#dc2626' : '#059669' }">
                    {{ formatCurrency((req.balance_remaining || req.total_amount) - (req.amount_to_pay || 0)) }}
                  </td>
                  <td style="padding: 8px; text-align: center; display: flex; gap:4px; justify-content:center;">
                    <button type="button" @click="viewRequisitionDetails(req, idx)" title="View items" style="background: #edf2ff; color: #3b82f6; border: 1px solid #93c5fd; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;" onmouseover="this.style.background='#e0e7ff'" onmouseout="this.style.background='#edf2ff'">
                      <i class="fa fa-eye"></i>
                    </button>
                    <button type="button" @click="removePayeeRequisition(idx)" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">
                      <i class="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- SUMMARY & ACTIONS -->
          <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <div style="display: flex; flex-direction: column; gap: 15px; align-items: flex-end;">
              <!-- TOTAL AMOUNT BOX -->
              <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 12px 16px; border-radius: 6px; min-width: 250px; text-align: right;">
                <div style="font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">Total Amount</div>
                <div style="font-size: 18px; font-weight: 700; color: #059669;">{{ formatCurrency(totalAmountToPay) }}</div>
              </div>

              <!-- BUTTONS -->
              <div style="display: flex; gap: 12px;">
                <button type="button" @click="saveDraft" style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 4px; font-weight: 500; cursor: pointer; font-size: 12px; color: #6b7280;">
                  <i class="fa fa-save me-1"></i>Save Draft
                </button>
                <button type="button" @click="() => postVoucher()" :disabled="submittingVoucher" style="padding: 10px 20px; background: #059669; border: none; border-radius: 4px; font-weight: 500; color: white; cursor: pointer; font-size: 12px;">
                  <i :class="['fa', submittingVoucher ? 'fa-spinner fa-spin' : 'fa-check']" style="margin-right: 4px;"></i>{{ submittingVoucher ? 'Processing' : 'Post' }}
                </button>
                <button type="button" @click="closeForm" style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 4px; font-weight: 500; color: #6b7280; cursor: pointer; font-size: 12px;">
                  <i class="fa fa-times me-1"></i>Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
              :style="{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }"
              @mouseover="($event.currentTarget as HTMLElement).style.background = '#f3f4f6'; ($event.currentTarget as HTMLElement).style.borderColor = '#2563eb';"
              @mouseout="($event.currentTarget as HTMLElement).style.background = 'white'; ($event.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';"
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
            :style="{ padding: '8px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }"
            @mouseover="($event.target as HTMLElement).style.background = '#d1d5db'"
            @mouseout="($event.target as HTMLElement).style.background = '#e5e7eb'"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════ Requisition Details Modal ═══════ -->
  <div v-if="showRequisitionDetailsModal" class="req-modal-backdrop" @click.self="showRequisitionDetailsModal = false">
    <div class="req-modal-container">
      <!-- Header -->
      <div class="req-modal-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;">
            <i class="fa fa-file-invoice" style="color:#2563eb;font-size:16px;"></i>
          </div>
          <div>
            <h2 style="margin:0;font-size:16px;font-weight:700;color:#111827;">Requisition Details</h2>
            <p style="margin:0;font-size:12px;color:#6b7280;" v-if="selectedRequisitionDetails">{{ selectedRequisitionDetails.requisition_number }}</p>
          </div>
        </div>
        <button @click="showRequisitionDetailsModal = false" class="req-modal-close-btn">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="req-modal-body">
        <!-- Loading -->
        <div v-if="loadingRequisitionDetails" style="text-align:center;padding:60px 20px;">
          <i class="fa fa-spinner fa-spin" style="font-size:28px;color:#2563eb;"></i>
          <p style="color:#6b7280;margin-top:14px;font-size:13px;">Loading requisition details...</p>
        </div>

        <div v-else-if="selectedRequisitionDetails">
          <!-- Info Cards Row -->
          <div class="req-info-grid">
            <div class="req-info-card">
              <div class="req-info-label"><i class="fa fa-align-left" style="margin-right:6px;font-size:11px;"></i>Description</div>
              <div class="req-info-value">{{ selectedRequisitionDetails.description || '—' }}</div>
            </div>
            <div class="req-info-card">
              <div class="req-info-label"><i class="fa fa-dollar-sign" style="margin-right:6px;font-size:11px;"></i>Total Amount</div>
              <div class="req-info-value" style="color:#059669;font-weight:700;">{{ formatCurrency(selectedRequisitionDetails.total_amount) }}</div>
            </div>
            <div class="req-info-card">
              <div class="req-info-label"><i class="fa fa-money-bill-wave" style="margin-right:6px;font-size:11px;"></i>Amount to Pay</div>
              <div class="req-info-value" style="color:#2563eb;font-weight:700;">{{ formatCurrency(selectedRequisitionDetails.amount_to_pay) }}</div>
            </div>
          </div>

          <!-- Cost Centers -->
          <div class="req-cost-center-section">
            <div class="req-section-title"><i class="fa fa-sitemap" style="margin-right:6px;"></i>Cost Center{{ selectedRequisitionDetails.cost_centers && selectedRequisitionDetails.cost_centers.length > 1 ? 's' : '' }}</div>
            <div v-if="selectedRequisitionDetails.cost_centers && selectedRequisitionDetails.cost_centers.length > 0" class="req-cc-tags">
              <span v-for="(cc, i) in selectedRequisitionDetails.cost_centers" :key="i" class="req-cc-tag">
                <i class="fa fa-circle" style="font-size:6px;margin-right:6px;opacity:0.5;"></i>{{ cc }}
              </span>
            </div>
            <div v-else style="color:#9ca3af;font-size:13px;padding:4px 0;">No cost centers assigned</div>
          </div>

          <!-- Items Table -->
          <div class="req-items-section">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div class="req-section-title" style="margin-bottom:0;"><i class="fa fa-list" style="margin-right:6px;"></i>Line Items</div>
              <span style="font-size:11px;color:#6b7280;background:#f3f4f6;padding:3px 8px;border-radius:10px;">{{ selectedRequisitionDetails.items.filter((i: any) => i.selected).length }} / {{ selectedRequisitionDetails.items.length }} selected</span>
            </div>
            <div class="req-items-table-wrapper">
              <table class="req-items-table">
                <thead>
                  <tr>
                    <th style="width:36px;text-align:center;">
                      <input type="checkbox"
                        @change="(e: Event) => { selectedRequisitionDetails.items.forEach((i: any) => i.selected = (e.target as HTMLInputElement).checked) }"
                        :checked="selectedRequisitionDetails.items.every((i: any) => i.selected)"
                        style="cursor:pointer;width:15px;height:15px;accent-color:#2563eb;" />
                    </th>
                    <th style="text-align:left;">Description</th>
                    <th style="text-align:center;width:60px;">Qty</th>
                    <th style="text-align:right;width:100px;">Unit Price</th>
                    <th style="text-align:right;width:110px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in selectedRequisitionDetails.items" :key="i" :class="{ 'req-row-deselected': !item.selected }">
                    <td style="text-align:center;">
                      <input type="checkbox" v-model="item.selected" style="cursor:pointer;width:15px;height:15px;accent-color:#2563eb;" />
                    </td>
                    <td>{{ item.description }}</td>
                    <td style="text-align:center;">{{ item.quantity }}</td>
                    <td style="text-align:right;">{{ formatCurrency(item.unit_price) }}</td>
                    <td style="text-align:right;font-weight:600;">{{ formatCurrency(item.amount) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="req-items-total-row">
                    <td colspan="4" style="text-align:right;font-weight:700;">Selected Total</td>
                    <td style="text-align:right;font-weight:700;color:#059669;">
                      {{ formatCurrency(selectedRequisitionDetails.items.filter((i: any) => i.selected).reduce((s: number, i: any) => s + (i.amount || 0), 0)) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="req-modal-footer">
        <button @click="showRequisitionDetailsModal = false" class="req-btn-secondary">
          <i class="fa fa-times" style="margin-right:4px;"></i> Close
        </button>
        <button @click="confirmRequisitionDetails" class="req-btn-primary">
          <i class="fa fa-check" style="margin-right:4px;"></i> Apply Selection
        </button>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountingStore } from '@/stores/bushman/accounting-store'
import { useToast } from '@/composables/useToast'
import { useAppOptionStore } from '@/stores/app-option'
import Swal from 'sweetalert2'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

const router = useRouter()
const route = useRoute()
const { init } = useToast()
const accountingStore = useAccountingStore()
const appOptionStore = useAppOptionStore()

const isEdit = computed(() => !!route.params.id)
const voucherId = computed(() => route.params.id ? Number(route.params.id) : null)

const saving = ref(false)
const savingLink = ref(false)
const loadingRequisitions = ref(false)
const submittingVoucher = ref(false)
const errorMessage = ref('')
const originalSidebarState = ref(false)
const sidebarMinifiedForCreate = ref(false)
const activeTab = ref('source')

// Voucher Tab State
const voucherTab = ref('payment')

// Workflow State
const sourceDocumentType = ref('')  // Step 1: REQUISITION, ORDER, CONTRACT, INVOICE, etc

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
  payments: [] as any[],
  
  // Payment Voucher Fields
  voucher_number: 'AUTO',
  branch_id: '',
  branch_name: '',
  from_account_id: '',
  payment_method: '',
  payee_id: '',
  payee_account: '',
  payee_account_id: null as number | null,
  payee_account_code: '',
  fund_direction: '',
  total_amount: 0
})

// Payee Requisitions
const payeeRequisitions = ref<any[]>([])

// Selected Requisitions (from Search Modal)
const selectedRequisitions = ref<any[]>([])

// Single Selected Requisition (for linking)
const selectedRequisition = ref<any>(null)

// ──────────────────────────────────────────────────────────
// Partial-payment tracking  (localStorage-backed)
// ──────────────────────────────────────────────────────────
const PAID_STORAGE_KEY = 'bushman_paid_requisitions'
const PAID_MAX_AGE_MS  = 30 * 24 * 60 * 60 * 1000 // auto-purge entries older than 30 days

interface PaidEntry {
  id: number        // requisition_id
  amount: number    // amount paid in this voucher
  total: number     // requisition total at time of payment
  ts: number        // timestamp
  voucher?: string  // voucher number
}

// Map: requisition_id → cumulative amount paid so far
const paidAmounts = ref<Map<number, number>>(new Map())
let   paidEntries: PaidEntry[] = []

function loadPaidRequisitions() {
  try {
    const raw = localStorage.getItem(PAID_STORAGE_KEY)
    if (raw) {
      const parsed: PaidEntry[] = JSON.parse(raw)
      const now = Date.now()
      // purge stale entries (older than 30 days)
      paidEntries = parsed.filter(e => now - (e.ts || 0) < PAID_MAX_AGE_MS)
      // Build cumulative amounts per requisition
      const map = new Map<number, number>()
      paidEntries.forEach(e => {
        const id = Number(e.id)
        map.set(id, (map.get(id) || 0) + (e.amount || 0))
      })
      paidAmounts.value = map
      localStorage.setItem(PAID_STORAGE_KEY, JSON.stringify(paidEntries))
    }
  } catch { /* ignore corrupt data */ }
}

function savePaidRequisitions() {
  try {
    localStorage.setItem(PAID_STORAGE_KEY, JSON.stringify(paidEntries))
  } catch { /* ignore */ }
}

/**
 * Record amounts paid against requisitions.
 * @param items Array of { id, amount, total } for each requisition in the voucher
 */
function markRequisitionsAsPaid(items: { id: number | string; amount: number; total: number }[], voucherNumber?: string) {
  const ts = Date.now()
  items.forEach(item => {
    const id = Number(item.id)
    if (!id || !item.amount) return
    paidEntries.push({ id, amount: item.amount, total: item.total, ts, voucher: voucherNumber })
    paidAmounts.value.set(id, (paidAmounts.value.get(id) || 0) + item.amount)
  })
  savePaidRequisitions()
}

/** Get the cumulative amount already paid for a requisition */
function getAmountAlreadyPaid(reqId: number | string): number {
  return paidAmounts.value.get(Number(reqId)) || 0
}

/** Check if a requisition is FULLY paid (paid >= total) */
function isRequisitionFullyPaid(reqId: number | string, reqTotal: number): boolean {
  const paid = getAmountAlreadyPaid(reqId)
  return paid > 0 && paid >= reqTotal
}

/** Get the remaining payable balance for a requisition */
function getRemainingBalance(reqId: number | string, reqTotal: number): number {
  const paid = getAmountAlreadyPaid(reqId)
  return Math.max(0, reqTotal - paid)
}

loadPaidRequisitions()

// helper to normalise cost center information (may come as string, code, array, or embedded in items)
function parseCostCenters(req: any) {
  // The API may return { requisition: {...}, items: [...] } or { items: [...] }
  const inner = req.requisition || req
  const set = new Set<string>()

  // Top-level cost center fields (check both wrapper and inner)
  for (const src of [req, inner]) {
    if (src?.cost_center) set.add(String(src.cost_center))
    if (src?.cost_center_code) set.add(String(src.cost_center_code))
    if (src?.cost_center_name) set.add(String(src.cost_center_name))
  }

  // Find items: could be req.items, inner.items, or req.requisition_items
  const itemsArr = req.items || inner.items || req.requisition_items || inner.requisition_items || []

  // Walk items
  if (Array.isArray(itemsArr)) {
    itemsArr.forEach((item: any) => {
      // items[].cost_centers[] – the primary nested structure
      if (Array.isArray(item.cost_centers)) {
        item.cost_centers.forEach((cc: any) => {
          // prefer human-readable name, fall back to code
          const label = cc.cost_center_name || cc.name || cc.cost_center || cc.code || cc.activity_type_name || ''
          if (label) set.add(String(label))
        })
      }
      // item-level flat fields
      if (item.cost_center) set.add(String(item.cost_center))
      if (item.cost_center_name) set.add(String(item.cost_center_name))
      if (item.cost_center_code) set.add(String(item.cost_center_code))
      if (item.activity_type_name) set.add(String(item.activity_type_name))
      if (item.activity_type) set.add(String(item.activity_type))

      // dimensions that encode cost centres
      if (Array.isArray(item.dimensions)) {
        item.dimensions.forEach((dim: any) => {
          // dimension_type can be a string ("Activity Type") or an object ({ code, name })
          const typeStr = typeof dim.dimension_type === 'string'
            ? dim.dimension_type.toLowerCase()
            : String(dim.dimension_type?.code || dim.dimension_type?.name || '').toLowerCase()
          if (typeStr.includes('cost') || typeStr.includes('activity')) {
            // dimension_value can be a string ("Maintenance") or an object ({ name, code })
            const val = typeof dim.dimension_value === 'string'
              ? dim.dimension_value
              : (dim.dimension_value?.name || dim.dimension_value?.code || '')
            if (val) set.add(String(val))
          }
        })
      }
    })
  }

  // Also check top-level dimensions array (the getRequisitionDetails response puts it here)
  const dimsArr = req.dimensions || inner.dimensions || []
  if (Array.isArray(dimsArr)) {
    dimsArr.forEach((dim: any) => {
      // dimension_type can be a string ("Activity Type") or an object ({ code, name })
      const typeStr = typeof dim.dimension_type === 'string'
        ? dim.dimension_type.toLowerCase()
        : String(dim.dimension_type?.code || dim.dimension_type?.name || '').toLowerCase()
      if (typeStr.includes('cost') || typeStr.includes('activity')) {
        // dimension_value can be a string ("Maintenance") or an object ({ name, code })
        const val = typeof dim.dimension_value === 'string'
          ? dim.dimension_value
          : (dim.dimension_value?.name || dim.dimension_value?.code || '')
        if (val) set.add(String(val))
      }
    })
  }

  const list = Array.from(set).filter(Boolean)
  const display = list.length > 1 ? 'Multiple' : (list[0] || 'N/A')
  return { display, list }
}

// helper that mirrors the logic used in the details modal to flatten a requisition's
// line items into a uniform structure with `amount` values. Used when computing
// row totals during background fetch.
function flattenRequisitionItems(req: any): Array<any> {
  // The API may return { requisition: {...}, items: [...] } — items as sibling
  const inner = req.requisition || req
  const items = req.items || inner.items || req.requisition_items || inner.requisition_items || []
  const allItems: any[] = []

  function pushMaterial(material: any) {
    allItems.push({
      description: material.description || material.material_description || material.item_name || material.material_name || material.name || material.item?.name || material.code || 'Material',
      quantity: parseFloat(material.quantity || material.qty || 0),
      unit_price: parseFloat(material.rate || material.unit_price || material.price || 0),
      amount: parseFloat(material.line_total || material.amount || material.total || (parseFloat(material.quantity || 0) * parseFloat(material.rate || material.unit_price || 0)) || 0),
      selected: true
    })
  }

  function pushAccount(account: any) {
    allItems.push({
      description: account.description || account.account_description || account.account_name || account.account?.name || account.account?.code || account.name || account.code || 'Account',
      quantity: 1,
      unit_price: parseFloat(account.amount || account.total || account.debit || account.credit || 0),
      amount: parseFloat(account.amount || account.total || account.debit || account.credit || 0),
      selected: true
    })
  }

  items.forEach((item: any) => {
    let handledViaCostCenters = false

    // ── First, walk cost_centers[].accounts[] / cost_centers[].materials[] ──
    if (Array.isArray(item.cost_centers) && item.cost_centers.length > 0) {
      item.cost_centers.forEach((cc: any) => {
        if (Array.isArray(cc.materials) && cc.materials.length > 0) {
          cc.materials.forEach(pushMaterial)
          handledViaCostCenters = true
        }
        if (Array.isArray(cc.accounts) && cc.accounts.length > 0) {
          cc.accounts.forEach(pushAccount)
          handledViaCostCenters = true
        }
      })
    }

    if (handledViaCostCenters) return // already captured all items from nested cost_centers

    // ── Fallback: materials / accounts directly on the item ──
    if (item.materials && Array.isArray(item.materials) && item.materials.length > 0) {
      item.materials.forEach(pushMaterial)
    } else if (item.accounts && Array.isArray(item.accounts) && item.accounts.length > 0) {
      item.accounts.forEach(pushAccount)
    } else {
      // last resort: use item-level properties
      allItems.push({
        description: item.description || item.item_description || item.narration || item.remarks || item.name || item.code || `Item`,
        quantity: parseFloat(item.quantity || item.qty || 0),
        unit_price: parseFloat(item.rate || item.unit_price || item.price || 0),
        amount: parseFloat(item.line_total || item.amount || item.total || (parseFloat(item.quantity || 0) * parseFloat(item.rate || item.unit_price || 0)) || 0),
        selected: true
      })
    }
  })
  return allItems
}


// Requisition Details Modal
const loadingRequisitionDetails = ref(false)
const showRequisitionDetailsModal = ref(false)
const selectedRequisitionDetails = ref<any>(null)
const currentViewedRequisitionIndex = ref<number|null>(null)

// Loaded Voucher (for edit mode)
const loadedVoucher = ref<any>(null)

// Requisition Search
const showRequisitionModal = ref(false)
const showRequisitionDropdown = ref(false)
const requisitionSearchQuery = ref('')
const filteredRequisitions = ref<any[]>([])
const searchingRequisitions = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Invoice Search
const selectedInvoice = ref<any>(null)
const invoiceSearchQuery = ref('')
const filteredInvoices = ref<any[]>([])
const searchingInvoices = ref(false)
const showInvoiceDropdown = ref(false)
let invoiceSearchTimeout: ReturnType<typeof setTimeout> | null = null

// Linked Requisitions (for tracking linked items)
const linkedRequisitions = ref<any[]>([])

// Editing Account Lines (for inline form rows)
const editingAccountLines = ref<any[]>([])

// Refs for multiselect dropdowns
const fromAccountSelect = ref<any>(null)
const payeeAccountSelect = ref<any>(null)
const accountLineSelect = ref<any>(null)
const voucherNumberSelect = ref<any>(null)
const branchSelect = ref<any>(null)
const fundDirectionSelect = ref<any>(null)
const payeeSelect = ref<any>(null)

// Helper function to flatten account hierarchy with parent grouping
// Returns options with parent headers (non-selectable) and child accounts (selectable)
const flattenAccountsWithGroups = (accountList: any[]): any[] => {
  const options: any[] = []
  
  accountList.forEach((acc: any) => {
    if (acc.children && acc.children.length > 0) {
      // This is a parent account - add as header, then add children
      options.push({
        label: acc.label || `${acc.code} - ${acc.name}`,
        value: null,
        $isDisabled: true,
        isHeader: true,
        isParentHeader: true
      })
      // Add children under this parent
      acc.children.forEach((child: any) => {
        const displayLabel = child.label || (child.code ? `${child.code} - ${child.name}` : child.name)
        options.push({
          label: displayLabel,
          value: child.id,
          code: child.code || null,
          name: child.name,
          parentName: acc.name,
          isChild: true,
          searchText: `${child.name} ${child.code || ''} ${acc.name}`
        })
      })
    } else {
      // This is a standalone leaf account (no children) - add directly
      const displayLabel = acc.label || (acc.code ? `${acc.code} - ${acc.name}` : acc.name)
      options.push({
        label: displayLabel,
        value: acc.id,
        code: acc.code || null,
        name: acc.name,
        isChild: false,
        searchText: `${acc.name} ${acc.code || ''}`
      })
    }
  })
  
  return options
}

// Flatten accounts for lookup by ID
const flatBankCashAccounts = computed(() => {
  const flattened: any[] = []
  const flatten = (acc: any) => {
    flattened.push(acc)
    if (acc.children && acc.children.length > 0) {
      acc.children.forEach((child: any) => flatten(child))
    }
  }
  ;(bankCashAccounts.value || []).forEach(flatten)
  return flattened
})

// Grouped account options for dropdowns
const groupedBankCashAccountOptions = computed(() => flattenAccountsWithGroups(bankCashAccounts.value || []))

// Multiselect selection computed properties
const fromAccountSelection = computed({
  get() {
    const accountId = form.value.from_account_id
    if (!accountId) return null
    return groupedBankCashAccountOptions.value.find((opt: any) => opt.value === Number(accountId)) || null
  },
  set(selected: any) {
    form.value.from_account_id = selected?.value ? String(selected.value) : ''
  }
})



// Voucher Number options
const voucherNumberOptions = [
  { label: 'AUTO', value: 'AUTO' },
  { label: 'MANUAL', value: 'MANUAL' }
]

const voucherNumberSelection = computed({
  get() {
    return voucherNumberOptions.find((opt: any) => opt.value === form.value.voucher_number) || null
  },
  set(selected: any) {
    form.value.voucher_number = selected?.value || ''
  }
})

// Branch options and selection
const branchOptions = computed(() => {
  return (branches.value || []).map((branch: any) => ({
    label: branch.name,
    value: branch.id,
    ...branch
  }))
})

const branchSelection = computed({
  get() {
    if (!form.value.branch_id) return null
    return branchOptions.value.find((opt: any) => opt.value === Number(form.value.branch_id)) || null
  },
  set(selected: any) {
    form.value.branch_id = selected?.value ? String(selected.value) : ''
  }
})

// Currency uses native <select> binding via `form.currency_id` in the template

// Fund Direction options
const fundDirectionOptions = [
  { label: 'Direct Payment', value: 'EXPENSE' },
  { label: 'Withdraw', value: 'WITHDRAW' }
]

const fundDirectionSelection = computed({
  get() {
    return fundDirectionOptions.find((opt: any) => opt.value === form.value.fund_direction) || null
  },
  set(selected: any) {
    form.value.fund_direction = selected?.value || ''
  }
})

// Payee options and selection
const payeeOptions = computed(() => {
  return (payees.value || []).map((payee: any) => ({
    label: payee.name,
    value: payee.id,
    ...payee
  }))
})

const payeeSelection = computed({
  get() {
    if (!form.value.payee_id) return null
    return payeeOptions.value.find((opt: any) => opt.value === Number(form.value.payee_id)) || null
  },
  set(selected: any) {
    form.value.payee_id = selected?.value ? String(selected.value) : ''
    if (selected?.value) {
      onPayeeChange()
    }
  }
})

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

// Payment Voucher Reference Data (from API)
const branches = ref<any[]>([])
const bankCashAccounts = ref<any[]>([])
const payees = ref<any[]>([])
const paymentMethods = ref<string[]>(['Bank', 'Cash', 'Cheque', 'Wire Transfer', 'Deposit', 'Mobile Money'])

// Balance Summary
const balanceSummary = computed(() => {
  const debits = form.value.accounts
    .filter(a => a.transaction_type === 'DR' || a.transaction_type === 'DEBIT')
    .reduce((sum, a) => sum + (a.amount || 0), 0)
  
  const credits = form.value.accounts
    .filter(a => a.transaction_type === 'CR' || a.transaction_type === 'CREDIT')
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

// Total Amount to Pay (sum of all amount_to_pay in payee requisitions)
const totalAmountToPay = computed(() => {
  return payeeRequisitions.value.reduce((sum, r) => sum + (r.amount_to_pay || 0), 0)
})

// Requisition Numbers Input (writable by user). Keeps in-sync with fetched payee requisitions.
const requisitionNumbersInput = ref('')

// Keep the input updated when payeeRequisitions changes (e.g., after a fetch)
watch(payeeRequisitions, (newVal) => {
  if (!newVal || newVal.length === 0) {
    requisitionNumbersInput.value = ''
  } else {
    requisitionNumbersInput.value = newVal.map((r: any) => r.requisition_number).join(', ')
  }
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
      message: 'Please fill all required fields (Account, Type, Amount)',
      color: 'warning'
    })
    return
  }

  const selectedAccount = accounts.value.find((a: any) => String(a.id) === editLine.account_id)
  
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
    message: 'Account line added',
    color: 'success'
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
      message: 'Please fill required payment fields',
      color: 'warning'
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
    message: 'Payment details added',
    color: 'success'
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
      if (!rawReqs || rawReqs.length === 0) {
        console.warn('No requisitions available in store')
        filteredRequisitions.value = []
        searchingRequisitions.value = false
        return
      }
      
    const allReqs = rawReqs.filter((req: any) => req && req.status === 'APPROVED')
      
      // Generate requisition number format (REQ-0003) from ID
      const formatReqNumber = (id: number) => `REQ-${String(id).padStart(4, '0')}`
      
      // Search: REQ number (formatted), date, status, type, amount, requisition_number
      const results = allReqs
        .filter((req: any) => {
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
          return matches
        })
        .slice(0, 10)
      filteredRequisitions.value = results
    } catch (error) {
      console.error('Search error:', error)
      filteredRequisitions.value = []
    } finally {
      searchingRequisitions.value = false
    }
  }, 300) // Debounce 300ms
}

function selectSingleRequisition(requisition: any) {// Check if already selected
  if (selectedRequisitions.value.some(req => req.id === requisition.id)) {
    init({
      message: `REQ-${String(requisition.id).padStart(4, '0')} is already selected`,
      color: 'info'
    })
    return
  }
  
  nextTick(async () => {
    requisitionSearchQuery.value = ''
    filteredRequisitions.value = []
    showRequisitionDropdown.value = false// Fetch full requisition details and auto-populate form
    await fetchFullRequisitionAndPopulate(requisition.id)
  })
}

// Fetch full requisition details from API
async function fetchFullRequisitionAndPopulate(requisitionId: number) {
  try {
    savingLink.value = true
    const response = await accountingStore.getRequisitionDetails(requisitionId)
    const fullRequisition = response.data.data || response.data

    // Add to selectedRequisitions array
    selectedRequisitions.value.push(fullRequisition)

    // Auto-populate form with complete requisition data
    autoPopulateFromRequisition(fullRequisition)
  } catch (error: any) {
    console.error('Error fetching requisition details:', error)
    init({
      message: 'Failed to load complete requisition details',
      color: 'danger'
    })
  } finally {
    savingLink.value = false
  }
}

// Auto-populate form when requisition is selected
function autoPopulateFromRequisition(requisition: any) {
  if (!requisition) return
  try {
    // Set posting date from requisition date
    if (requisition.date) {
      form.value.posting_date = requisition.date.split('T')[0]
    }

    // Store requisition reference in narration if empty
    if (!form.value.narration) {
      form.value.narration = `From Requisition ${requisition.requisition_number || `REQ-${String(requisition.id).padStart(4, '0')}`}`
    }

    // Clear existing accounts and populate from requisition items
    form.value.accounts = []

    const items = requisition.items || requisition.line_items || requisition.requisition_items || []
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {// Calculate amount - try multiple property names
        let itemAmount = 0
        if (item.amount) {
          itemAmount = parseFloat(String(item.amount))
        } else if (item.total_amount) {
          itemAmount = parseFloat(String(item.total_amount))
        } else if (item.unit_price && item.quantity) {
          itemAmount = parseFloat(String(item.unit_price)) * parseFloat(String(item.quantity))
        } else if (item.price && item.qty) {
          itemAmount = parseFloat(String(item.price)) * parseFloat(String(item.qty))
        }

        // Get GL accounts from the item
        const itemAccounts = item.accounts || item.gl_accounts || []
        if (itemAccounts && Array.isArray(itemAccounts) && itemAccounts.length > 0) {
          // Multiple accounts per item (pivot table structure)
          for (const account of itemAccounts) {
            // The account object in items.accounts is a pivot table row
            // It has: id, account_id, amount, etc.
            const accountId = account.account_id || account.id
            const accountAmount = parseFloat(String(account.amount)) || itemAmount// Need to fetch the full account details from the accounts list
            const fullAccount = accounts.value?.find((acc: any) => acc.id === accountId)
            
            form.value.accounts.push({
              account_id: accountId,
              account_code: fullAccount?.code || account.code || account.account_code || '',
              account_name: fullAccount?.name || account.name || account.account_name || '',
              transaction_type: 'DEBIT',
              amount: accountAmount,
              exchange_rate: requisition.exchange_rate || 1.0,
              from_requisition: true,
              requisition_item_id: item.id,
              dimensions: item.dimensions || []
            })
          }
        } else if (item.account_id) {
          // Single account per item
          const fullAccount = accounts.value?.find((acc: any) => acc.id === item.account_id)
          
          form.value.accounts.push({
            account_id: item.account_id,
            account_code: fullAccount?.code || item.account_code || '',
            account_name: fullAccount?.name || item.account_name || '',
            transaction_type: 'DEBIT',
            amount: itemAmount,
            exchange_rate: requisition.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
        } else if (item.account) {
          // Account object directly
          const fullAccount = accounts.value?.find((acc: any) => acc.id === item.account.id)
          
          form.value.accounts.push({
            account_id: item.account.id,
            account_code: fullAccount?.code || item.account.code || '',
            account_name: fullAccount?.name || item.account.name || '',
            transaction_type: 'DEBIT',
            amount: itemAmount,
            exchange_rate: requisition.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
        } else {
          // No account found - still create line with amount for manual account selection
          form.value.accounts.push({
            account_id: 0,
            account_code: '',
            account_name: '',
            transaction_type: 'DEBIT',
            amount: itemAmount,
            exchange_rate: requisition.exchange_rate || 1.0,
            from_requisition: true,
            requisition_item_id: item.id,
            dimensions: item.dimensions || []
          })
        }
      }
    }init({
      message: `Requisition REQ-${String(requisition.id).padStart(4, '0')} loaded with ${form.value.accounts.length} account line(s)`,
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error auto-populating form:', error)
    init({
      message: 'Requisition selected but form auto-population encountered an issue. You may need to manually add account lines.',
      color: 'warning'
    })
  }
}

function clearRequisitionSearch() {
  requisitionSearchQuery.value = ''
  filteredRequisitions.value = []
  showRequisitionDropdown.value = false
}

function removeSelectedRequisition(requisitionId: number) {
  selectedRequisitions.value = selectedRequisitions.value.filter(req => req.id !== requisitionId)
  init({
    message: `REQ-${String(requisitionId).padStart(4, '0')} removed from selection`,
    color: 'success'
  })
}

function clearSelectedRequisition() {
  selectedRequisitions.value = []
  requisitionSearchQuery.value = ''
  filteredRequisitions.value = []
}

// ==================== INVOICE WORKFLOW METHODS ====================

// Search for approved invoices
function searchInvoices() {
  if (invoiceSearchTimeout) {
    clearTimeout(invoiceSearchTimeout)
  }

  if (!invoiceSearchQuery.value.trim()) {
    filteredInvoices.value = []
    return
  }

  invoiceSearchTimeout = setTimeout(async () => {
    searchingInvoices.value = true
    try {
      const searchLower = invoiceSearchQuery.value.toLowerCase().trim()// Call the store's searchInvoices method
      const response = await accountingStore.searchInvoices(
        searchLower,
        'APPROVED'
      )
      
      const results = response.data.data || response.data || []
      filteredInvoices.value = Array.isArray(results) ? results.slice(0, 10) : []
    } catch (error) {
      console.error('Invoice search error:', error)
      filteredInvoices.value = []
    } finally {
      searchingInvoices.value = false
    }
  }, 300) // Debounce 300ms
}

// Select requisition from search results
function selectRequisitionFromSearch(req: any) {
  selectSingleRequisition(req)
}

// Select an invoice from search results
function selectInvoice(inv: any) {if (selectedInvoice.value && selectedInvoice.value.id === inv.id) {
    init({
      message: `Invoice ${inv.document_number} is already selected`,
      color: 'info'
    })
    return
  }

  // Clear search
  invoiceSearchQuery.value = ''
  filteredInvoices.value = []
  showInvoiceDropdown.value = false
  
  // Set selected invoice
  selectedInvoice.value = inv
  
  // Auto-populate form from invoice
  nextTick(async () => {
    await autoPopulateFromInvoice(inv)
  })
}

// Auto-populate JV form from invoice
async function autoPopulateFromInvoice(inv: any) {
  if (!inv) return
  try {
    // Set posting date from invoice date
    if (inv.invoice_date) {
      form.value.posting_date = inv.invoice_date.split('T')[0]
    }
    
    // Set narration
    if (!form.value.narration) {
      form.value.narration = `Journal Voucher from Invoice ${inv.document_number}`
    }
    
    // Set currency
    if (inv.currency_id) {
      form.value.currency_id = String(inv.currency_id)
    }
    
    // Clear existing accounts and auto-generate from invoice type
    form.value.accounts = []
    
    const total = inv.total_amount || 0
    const invoiceType = inv.invoice_type  // 'AR' or 'AP'
    
    if (total > 0) {
      // For AR invoices (you bill them - receivables):
      // DR: Accounts Receivable, CR: Revenue
      // For AP invoices (they bill you - payables):
      // DR: Expense, CR: Accounts Payable
      
      if (invoiceType === 'AR') {
        // Debit Accounts Receivable
        form.value.accounts.push({
          account_id: 0,  // Will need to be manually selected
          account_code: '',
          account_name: '',
          transaction_type: 'DEBIT',
          amount: total,
          exchange_rate: inv.exchange_rate_to_base || 1.0,
          from_invoice: true,
          invoice_id: inv.id
        })
      } else if (invoiceType === 'AP') {
        // Credit Accounts Payable
        form.value.accounts.push({
          account_id: 0,  // Will need to be manually selected
          account_code: '',
          account_name: '',
          transaction_type: 'CREDIT',
          amount: total,
          exchange_rate: inv.exchange_rate_to_base || 1.0,
          from_invoice: true,
          invoice_id: inv.id
        })
      }
    }init({
      message: `Invoice ${inv.document_number} loaded. Please review and configure account lines manually.`,
      color: 'info'
    })
  } catch (error: any) {
    console.error('Error auto-populating from invoice:', error)
    init({
      message: 'Invoice selected. Please manually configure account lines.',
      color: 'warning'
    })
  }
}

// Clear selected invoice
function clearSelectedInvoice() {
  selectedInvoice.value = null
  invoiceSearchQuery.value = ''
  filteredInvoices.value = []
  showInvoiceDropdown.value = false
}

function clearInvoiceSearch() {
  invoiceSearchQuery.value = ''
  filteredInvoices.value = []
  showInvoiceDropdown.value = false
}

// ==================== DOCUMENT TYPE CHANGE HANDLER ====================

// Step 1: Source Document Type Changed
function onSourceDocumentTypeChange() {
  // Reset both requisition and invoice selections when source type changes
  selectedRequisition.value = null
  selectedRequisitions.value = []
  selectedInvoice.value = null
  requisitionSearchQuery.value = ''
  invoiceSearchQuery.value = ''
  filteredRequisitions.value = []
  filteredInvoices.value = []
  showRequisitionDropdown.value = false
  showInvoiceDropdown.value = false
}

// Step 2: Requisition Selected (deprecated, kept for backward compatibility)
async function onRequisitionSelect() {
  // This is now handled by selectSingleRequisition
}

// Step 3: Auto-fetch and Auto-populate Account Lines from Requisition
async function fetchAndAutoPopulate() {
  if (!selectedRequisition.value) {
    init({
      message: 'Please select a requisition first',
      color: 'danger'
    })
    return
  }

  savingLink.value = true
  try {
    // Use the currently selected requisition data
    const requisitionData = selectedRequisition.value
    
    // Auto-populate account lines from requisition
    // Try different possible property names for items
    const items = requisitionData?.items || requisitionData?.line_items || requisitionData?.requisition_items || []
    
    if (items && Array.isArray(items) && items.length > 0) {
      form.value.accounts = []

      // Process each requisition item to create account entries
      for (const item of items) {
        // Get GL accounts associated with this item - try multiple property names
        const itemAccounts = item.accounts || item.gl_accounts || []

        if (itemAccounts && Array.isArray(itemAccounts) && itemAccounts.length > 0) {
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
          }
        } else if (item.account_id) {
          // If item has a single account_id directly, create account line from it
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
        } else if (item.account) {
          // If item has an account object directly
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
        } else {
          console.warn('Item has no accounts or account_id:', item)
        }
      }
    } else {
      console.warn('No items found in requisition. Items array:', items)
    }
    
    // Auto-populate JV header fields from requisition
    if (requisitionData.currency_id) {
      form.value.currency_id = String(requisitionData.currency_id)
    }
    if (requisitionData.exchange_rate) {
      form.value.exchange_rate = requisitionData.exchange_rate
    }

    init({
      message: `Auto-populated ${form.value.accounts.length} account lines from requisition`,
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error auto-populating requisition:', error)
    init({
      message: error?.message || 'Failed to auto-populate requisition details. Please try again.',
      color: 'danger'
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
    message: 'Requisition unlinked',
    color: 'success'
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
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please add at least one account line',
      confirmButtonColor: '#2563eb'
    })
    return
  }

  // Validation: Must be balanced
  if (!balanceSummary.value.is_balanced) {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Journal voucher must be balanced (Debit = Credit)',
      confirmButtonColor: '#2563eb'
    })
    return
  }

  // Validation: Must have narration
  if (!form.value.narration || form.value.narration.trim() === '') {
    await Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please provide narration/description for the journal voucher',
      confirmButtonColor: '#2563eb'
    })
    return
  }

  // SweetAlert Confirmation
  Swal.fire({
    title: 'Confirm Submission',
    text: `Are you sure you want to ${isEdit.value ? 'update' : 'create'} this journal voucher?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Submit'
  }).then((result) => {
    if (result.isConfirmed) {
      submitJournalVoucher()
    }
  })
}

async function submitJournalVoucher() {
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
    } else {
      voucherResponse = await accountingStore.createJournalVoucher(payload)
    }

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: isEdit.value ? 'Journal voucher updated successfully' : 'Journal voucher created successfully',
      timer: 2000,
      showConfirmButton: false
    })

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
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || error.message || 'Error saving journal voucher',
      confirmButtonColor: '#2563eb'
    })
  } finally {
    saving.value = false
  }
}

// ==================== PAYMENT VOUCHER METHODS ====================

async function fetchEligibleRequisitions() {
  // Validation: Payee must be selected for expense vouchers
  if (form.value.fund_direction === 'EXPENSE' && !form.value.payee_id) {
    init({
      message: 'Please select a payee first',
      color: 'warning'
    })
    return
  }

  try {
    // Show loading state
    loadingRequisitions.value = true
    const originalList = [...payeeRequisitions.value]
    payeeRequisitions.value = []

      // If user has manually entered requisition numbers/ids in the input, try to resolve them first
      const manualInput = String(requisitionNumbersInput.value || '').trim()
      if (manualInput) {
        const tokens = manualInput.split(/[,;\s]+/).map((t: string) => t.trim()).filter(Boolean)
        const resolved: any[] = []

        for (const token of tokens) {
          // Check if this requisition was already paid
          const numericCheck = Number(token.replace(/\D/g, ''))
          // We can't check fully-paid here without knowing the total, so skip
          // The full check happens after we fetch the requisition details below

          // Try local store first (requisitionsForLinking)
          const localMatch = (requisitionsForLinking.value || []).find((r: any) => {
            if (!r) return false
            const reqNum = String(r.requisition_number || '').toLowerCase()
            if (reqNum && reqNum === token.toLowerCase()) return true
            if (String(r.id) === token) return true
            // support formats like REQ-0004
            const digits = token.replace(/\D/g, '')
            if (digits && String(r.id) === digits) return true
            return false
          })

          if (localMatch) {
            resolved.push(localMatch)
            continue
          }

          // Try parsing numeric id and fetch from server using the new endpoint
          const numeric = Number(token.replace(/\D/g, ''))
          if (numeric) {
            try {
              // Use the new eligible-requisitions endpoint with requisition_id filter
              // Include fund_direction if selected to ensure filtering
              const filters: { requisition_id: number; fund_direction?: string } = {
                requisition_id: numeric
              }
              if (form.value.fund_direction) {
                filters.fund_direction = form.value.fund_direction
              }
              
              const resp = await accountingStore.getEligibleRequisitions(
                Number(form.value.from_account_id),
                filters
              )
              
              const requisitions = resp.data?.data || resp.data || []
              
              // The endpoint already filters by APPROVED status
              // If we get a result, it's approved and has a funding account
              if (Array.isArray(requisitions) && requisitions.length > 0) {
                const req = requisitions[0] // Should only be one result
                
                // Check if fully paid (partial payments still allowed)
                const reqTotal = parseFloat(String(req.total_amount || 0))
                if (isRequisitionFullyPaid(Number(req.requisition_id), reqTotal)) {
                  const priorPaid = getAmountAlreadyPaid(req.requisition_id)
                  init({ message: `Requisition ${req.requisition_number || token} has already been fully paid (${formatCurrency(priorPaid)} of ${formatCurrency(reqTotal)})`, color: 'warning' })
                  continue
                }
                
                // Get first source for payee info and funding account
                const source = req.sources?.[0] || {}
                
                // Get cost center from items.cost_centers if available
                // determine cost centre(s) for display
                const ccInfo = parseCostCenters(req)
                
                resolved.push({
                  requisition_id: req.requisition_id,
                  id: req.requisition_id,
                  requisition_number: req.requisition_number,
                  total_amount: parseFloat(String(req.total_amount || 0)),
                  cost_center: ccInfo.display,
                  cost_center_list: ccInfo.list,
                  status: 'APPROVED',
                  payee_name: source.payee || '',
                  funding_account_id: source.funding_account_id,
                  funding_account_code: source.funding_account_code,
                  funding_account_name: source.funding_account_name,
                  currency_id: source.currency_id,
                  fund_direction: req.fund_direction,
                  description: req.items?.[0]?.remarks || source.payee || 'General requisition',
                  sources: req.sources || [],
                  items: req.items || []
                })
              } else {
                console.warn(`Requisition ${numeric} not found or not eligible (not APPROVED or missing funding account)`)
              }
              continue
            } catch (err) {
              // ignore single failures and continue
              console.warn('No requisition found for token:', token, err)
            }
          }
          // If not found, continue to next token
        }

        if (resolved.length === 0) {
          init({ message: 'No matching requisitions found or requisitions are not approved', color: 'info' })
          loadingRequisitions.value = false
          return
        }

        // Map resolved requisitions into payeeRequisitions (same mapping as API response)
        payeeRequisitions.value = resolved.map((req: any) => ({
          id: req.id,
          requisition_id: req.id,
          requisition_number: req.requisition_number || `REQ-${String(req.id).padStart(4, '0')}`,
          description: req.description || req.narrative || req.narration || req.remarks || 'General requisition',
          // determine cost center display and list
          cost_center_list: Array.isArray(req.cost_center_list) ? req.cost_center_list : (req.cost_center_list ? [req.cost_center_list] : []),
          cost_center: (() => {
            const list = Array.isArray(req.cost_center_list) ? req.cost_center_list : (req.cost_center_list ? [req.cost_center_list] : [])
            if (list.length > 1) return 'Multiple'
            return list[0] || 'N/A'
          })(),
          // compute amounts from flattened items (handles nested cost_centers structure)
          total_amount: (() => {
            const flat = flattenRequisitionItems(req)
            if (flat.length > 0) {
              const sum = flat.reduce((s: number, i: any) => s + (i.amount || 0), 0)
              if (sum > 0) return sum
            }
            return parseFloat(String(req.total_amount || req.total || 0))
          })(),
          balance_remaining: (() => {
            const flat = flattenRequisitionItems(req)
            if (flat.length > 0) {
              const sum = flat.reduce((s: number, i: any) => s + (i.amount || 0), 0)
              if (sum > 0) return sum
            }
            if (typeof req.balance_remaining === 'number') return req.balance_remaining
            return parseFloat(String(req.total_amount || req.total || 0))
          })(),
          amount_to_pay: (() => {
            if (typeof req.amount_to_pay === 'number') return req.amount_to_pay
            const flat = flattenRequisitionItems(req)
            if (flat.length > 0) {
              const sum = flat.reduce((s: number, i: any) => s + (i.amount || 0), 0)
              if (sum > 0) return sum
            }
            return parseFloat(String(req.total_amount || req.total || 0))
          })(),
          status: req.status || 'APPROVED',
          payee_id: req.payee_id || form.value.payee_id,
          posting_date: req.posting_date || req.date || new Date().toISOString().split('T')[0]
        }))

        // Update total amount
        form.value.total_amount = totalAmountToPay.value

        // fetch full details for each row so cost centres/amounts are accurate
        await Promise.all(payeeRequisitions.value.map(async (row: any) => {
          try {
            const respDtl = await accountingStore.getRequisitionDetails(row.requisition_id)
            const full = respDtl.data?.data || respDtl.data || {}
            const ccInfo = parseCostCenters(full)
            row.cost_center_list = ccInfo.list
            row.cost_center = ccInfo.display
            // try to compute total by flattening items with fallback
            const all = flattenRequisitionItems(full)
            if (all.length > 0) {
              const sum = all.reduce((s, i) => s + (i.amount || 0), 0)
              if (sum > 0) {
                row.total_amount = sum
                row.amount_to_pay = sum
                row.balance_remaining = sum
              }
            } else if (Array.isArray(full.items) && full.items.length > 0) {
              // as a last resort use any top-level amounts
              const sum2 = full.items.reduce((s: number, i: any) => {
                return s + (parseFloat(String(i.amount || i.line_total || i.total || 0)) || 0)
              }, 0)
              if (sum2 > 0) {
                row.total_amount = sum2
                row.amount_to_pay = sum2
                row.balance_remaining = sum2
              }
            }
          } catch (__) {
            // ignore, original row values stay
          } finally {
            row._loadingDetails = false
          }
        }))

        init({ message: `Found ${payeeRequisitions.value.length} requisition(s)`, color: 'success' })
        loadingRequisitions.value = false
        return
      }

      // If no manual input, use the new eligible-requisitions endpoint
      // This endpoint returns APPROVED requisitions with funding accounts
      const filters: { payee?: string; fund_direction?: string } = {}
      if (form.value.payee_id) {
        // Get payee name for filtering if available
        const payeeOption = payeeOptions.value.find((p: any) => p.value === form.value.payee_id)
        if (payeeOption?.label) filters.payee = payeeOption.label
      }
      if (form.value.fund_direction) filters.fund_direction = form.value.fund_direction

      const response = await accountingStore.getEligibleRequisitions(
        Number(form.value.from_account_id),
        filters
      )
      
      const requisitions = response.data?.data || response.data || []
    
    if (!Array.isArray(requisitions)) {
      payeeRequisitions.value = originalList
      init({
        message: 'Invalid response from server',
        color: 'danger'
      })
      return
    }

    // Filter out FULLY-paid requisitions; partially-paid ones stay with reduced balance
    const totalFromApi = requisitions.length
    const eligibleReqs = requisitions.filter((req: any) => {
      const flat = flattenRequisitionItems(req)
      const computedTotal = flat.length > 0 ? flat.reduce((s: number, i: any) => s + (i.amount || 0), 0) : 0
      const reqTotal = computedTotal > 0 ? computedTotal : parseFloat(String(req.total_amount || 0))
      return !isRequisitionFullyPaid(Number(req.requisition_id), reqTotal)
    })
    const skippedCount = totalFromApi - eligibleReqs.length

    if (skippedCount > 0 && eligibleReqs.length > 0) {
      init({ message: `${skippedCount} requisition(s) skipped — already fully paid`, color: 'info' })
    }

    // ALL returned requisitions have been fully paid → block
    if (totalFromApi > 0 && eligibleReqs.length === 0) {
      payeeRequisitions.value = []
      init({
        message: `All ${totalFromApi} requisition(s) returned have already been fully paid.`,
        color: 'warning'
      })
      loadingRequisitions.value = false
      return
    }

    // Transform requisitions for the payment table
    payeeRequisitions.value = eligibleReqs.map((req: any) => {
      // Get first source for payee info and funding account
      const source = req.sources?.[0] || {}
      
      // Get cost center(s) from items using parseCostCenters helper
      const ccInfo = parseCostCenters(req)

      // Compute accurate total from nested items (cost_centers[].accounts[]/materials[])
      const flat = flattenRequisitionItems(req)
      const computedTotal = flat.length > 0 ? flat.reduce((s: number, i: any) => s + (i.amount || 0), 0) : 0
      const finalTotal = computedTotal > 0 ? computedTotal : parseFloat(String(req.total_amount || 0))

      return {
        id: req.requisition_id,
        requisition_id: req.requisition_id,
        requisition_number: req.requisition_number || `REQ-${String(req.requisition_id).padStart(4, '0')}`,
        description: req.items?.[0]?.remarks || source.payee || 'General requisition',
        cost_center: ccInfo.display,
        cost_center_list: ccInfo.list,
        total_amount: finalTotal,
        prior_paid: getAmountAlreadyPaid(req.requisition_id),
        balance_remaining: getRemainingBalance(req.requisition_id, finalTotal),
        amount_to_pay: getRemainingBalance(req.requisition_id, finalTotal),
        status: 'APPROVED',
        payee_id: source.entity_id || form.value.payee_id,
        payee_name: source.payee || '',
        funding_account_id: source.funding_account_id,
        funding_account_code: source.funding_account_code,
        funding_account_name: source.funding_account_name,
        currency_id: source.currency_id,
        fund_direction: req.fund_direction,
        posting_date: req.requisition_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        // Store full source and items for journal entry creation
        sources: req.sources || [],
        items: req.items || []
      }
    })

    // Update total amount from sum of requisitions
    form.value.total_amount = totalAmountToPay.value

    if (payeeRequisitions.value.length === 0) {
      // Only show this if the API itself returned nothing (paid ones handled above)
      init({
        message: 'No approved requisitions found for the selected payee',
        color: 'info'
      })
    } else {
      init({
        message: `Found ${payeeRequisitions.value.length} approved requisition(s)`,
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error fetching approved requisitions:', error)
    payeeRequisitions.value = []
    init({
      message: error?.response?.data?.message || 'Failed to fetch approved requisitions',
      color: 'danger'
    })
  } finally {
    loadingRequisitions.value = false
  }
}

function onAmountToPay(index: number) {
  // Clamp amount_to_pay between 0 and remaining balance (accounts for prior partial payments)
  if (index >= 0 && index < payeeRequisitions.value.length) {
    const req = payeeRequisitions.value[index]
    const maxAmount = req.balance_remaining || req.total_amount || 0
    
    // Clamp to range [0, maxAmount]
    if (req.amount_to_pay < 0) {
      req.amount_to_pay = 0
    } else if (req.amount_to_pay > maxAmount) {
      req.amount_to_pay = maxAmount
    }
    
    // Update form.total_amount to match the new sum
    form.value.total_amount = totalAmountToPay.value
  }
}

function removePayeeRequisition(index: number) {
  if (index >= 0 && index < payeeRequisitions.value.length) {
    const removed = payeeRequisitions.value[index]
    payeeRequisitions.value.splice(index, 1)
    // Update total amount after removal
    form.value.total_amount = totalAmountToPay.value
    init({
      message: `Requisition ${removed.requisition_number} removed`,
      color: 'success'
    })
  }
}

async function viewRequisitionDetails(requisition: any, index: number) {
  // remember which row we are showing
  currentViewedRequisitionIndex.value = index
  try {
    loadingRequisitionDetails.value = true
    showRequisitionDetailsModal.value = true
    selectedRequisitionDetails.value = null

    // Fetch full requisition details from backend
    const response = await accountingStore.getRequisitionDetails(requisition.requisition_id || requisition.id)
    
    const reqData = response.data?.data || response.data

    // Use the same flattenRequisitionItems helper that now handles nested
    // item.cost_centers[].accounts[] and item.cost_centers[].materials[]
    let allItems = flattenRequisitionItems(reqData)
    const ccInfo = parseCostCenters(reqData)
    selectedRequisitionDetails.value = {
      requisition_number: requisition.requisition_number,
      cost_centers: ccInfo.list,
      description: requisition.description,
      total_amount: requisition.total_amount,
      amount_to_pay: requisition.amount_to_pay,
      items: allItems
    }} catch (error: any) {
    console.error('Error fetching requisition details:', error)
    init({
      message: 'Failed to load requisition details',
      color: 'danger'
    })
    showRequisitionDetailsModal.value = false
  } finally {
    loadingRequisitionDetails.value = false
  }
}

function confirmRequisitionDetails() {
  // apply selected items back to row
  if (currentViewedRequisitionIndex.value === null) return
  const idx = currentViewedRequisitionIndex.value
  const reqRow = payeeRequisitions.value[idx]
  if (!reqRow || !selectedRequisitionDetails.value) return

  const selectedItems = selectedRequisitionDetails.value.items.filter((i: any) => i.selected)
  // compute new total from chosen lines
  const total = selectedItems.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
  reqRow.amount_to_pay = total
  reqRow.total_amount = total
  // update balance (assuming nothing paid yet)
  reqRow.balance_remaining = total - (reqRow.amount_to_pay || 0)
  // update cost centres on the row as well
  const ccs = selectedRequisitionDetails.value.cost_centers || []
  reqRow.cost_center_list = ccs
  reqRow.cost_center = ccs.length > 1 ? 'Multiple' : (ccs[0] || 'N/A')

  // store items if needed for later reference
  reqRow.selected_items = selectedItems

  // update overall total
  form.value.total_amount = totalAmountToPay.value
  showRequisitionDetailsModal.value = false
}

async function saveDraft() {
  // Validation: At least one requisition must be selected
  if (payeeRequisitions.value.length === 0) {
    init({
      message: 'Please fetch and select at least one requisition',
      color: 'warning'
    })
    return
  }

  // Validation: Required fields
  if (!form.value.from_account_id) {
    init({
      message: 'Please select a From (Credit) account',
      color: 'warning'
    })
    return
  }

  // payee not required for withdraw (backend will default debit account to from_account)
  if (form.value.fund_direction === 'EXPENSE' && !form.value.payee_id) {
    init({
      message: 'Please select a payee',
      color: 'warning'
    })
    return
  }

  if (!form.value.currency_id) {
    init({
      message: 'Please select a currency',
      color: 'warning'
    })
    return
  }

  try {
    saving.value = true

    // Build payment voucher payload
    const payload = {
      voucher_type: 'PAYMENT',
      voucher_number: form.value.voucher_number,
      posting_date: form.value.posting_date,
      branch_id: form.value.branch_id || null,
      currency_id: Number(form.value.currency_id),
      exchange_rate: form.value.exchange_rate || 1.0,
      from_account_id: Number(form.value.from_account_id),
      payment_method: form.value.payment_method,
      // when withdrawing there might be no payee; backend will fill
      payee_id: form.value.payee_id ? Number(form.value.payee_id) : null,
      payee_account: form.value.payee_account || (form.value.fund_direction === 'WITHDRAW' ? String(form.value.from_account_id) : ''),
      total_amount: form.value.total_amount || payeeRequisitions.value.reduce((sum, r) => sum + r.amount_to_pay, 0),
      narration: form.value.narration,
      status: 'DRAFT',
      requisitions: payeeRequisitions.value.map(r => ({
        requisition_id: r.requisition_id,
        amount: r.amount_to_pay
      }))
    }

    // Save to backend
    const response = await accountingStore.savePaymentVoucherDraft(payload)
    
    const savedVoucherId = response.data?.data?.id || response.data?.id
    
    init({
      message: 'Payment voucher saved as draft',
      color: 'success'
    })

    // Option to view or post the draft
    Swal.fire({
      title: 'Draft Saved',
      text: 'Payment voucher has been saved as draft. What would you like to do?',
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Post Now',
      cancelButtonText: 'Stay Here'
    }).then((result) => {
      if (result.isConfirmed && savedVoucherId) {
        postVoucher(savedVoucherId)
      }
    })
  } catch (error: any) {
    console.error('Error saving payment voucher draft:', error)
    init({
      message: error?.response?.data?.message || 'Failed to save payment voucher',
      color: 'danger'
    })
  } finally {
    saving.value = false
  }
}

async function postVoucher(voucherId?: number) {
  // If not provided, save first then post
  if (!voucherId) {
    // Validation: At least one requisition must be selected
    if (payeeRequisitions.value.length === 0) {
      init({
        message: 'Please fetch and select at least one requisition',
        color: 'warning'
      })
      return
    }

    // Validation: Required fields
    // required fields: payee is only mandatory for expense-type vouchers
  if (!form.value.from_account_id || !form.value.currency_id ||
      (form.value.fund_direction === 'EXPENSE' && !form.value.payee_id)) {
      init({
        message: 'Please fill all required fields (From Account, Currency' +
                 (form.value.fund_direction === 'EXPENSE' ? ', Payee' : '') + ')',
        color: 'warning'
      })
      return
    }

    // Show confirmation — include partial payment info
    const partialReqs = payeeRequisitions.value.filter(r => (r.prior_paid || 0) > 0)
    const partialNote = partialReqs.length > 0
      ? `<p style="color: #f59e0b; margin-top: 8px;"><strong>${partialReqs.length} requisition(s) have prior partial payments.</strong></p>`
      : ''
    const result = await Swal.fire({
      title: 'Confirm Payment Voucher',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Payee:</strong> ${form.value.payee_id || '(none)'}${form.value.fund_direction === 'WITHDRAW' ? ' (withdrawal)' : ''}</p>
          <p><strong>Total Amount:</strong> ${formatCurrency(form.value.total_amount || payeeRequisitions.value.reduce((sum, r) => sum + r.amount_to_pay, 0))}</p>
          <p><strong>Requisitions:</strong> ${payeeRequisitions.value.length}</p>
          ${partialNote}
          <p style="color: #dc2626; margin-top: 16px;"><strong>This action will create accounting entries and cannot be undone.</strong></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Post Voucher',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    // ── Last-line guard: re-check that no requisition exceeds its remaining balance ──
    const overPaid: string[] = []
    for (const r of payeeRequisitions.value) {
      const remaining = getRemainingBalance(r.requisition_id, r.total_amount)
      if (remaining <= 0) {
        overPaid.push(`${r.requisition_number || r.requisition_id} (fully paid)`)
      } else if ((r.amount_to_pay || 0) > remaining + 0.01) {
        overPaid.push(`${r.requisition_number || r.requisition_id} (paying ${formatCurrency(r.amount_to_pay)} but only ${formatCurrency(remaining)} remaining)`)
      }
    }
    if (overPaid.length > 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Payment Exceeds Balance',
        html: `<p>The following requisition(s) cannot be paid as requested:</p><ul style="text-align:left;color:#dc2626;font-weight:600">${overPaid.map(s => `<li>${s}</li>`).join('')}</ul><p>Please adjust the pay amounts or remove them.</p>`,
        confirmButtonColor: '#dc2626'
      })
      return
    }

    try {
      saving.value = true

      // Build payload
      const payload = {
        voucher_type: 'PAYMENT',
        voucher_number: form.value.voucher_number,
        posting_date: form.value.posting_date,
        branch_id: form.value.branch_id || null,
        currency_id: Number(form.value.currency_id),
        exchange_rate: form.value.exchange_rate || 1.0,
        from_account_id: Number(form.value.from_account_id),
        payment_method: form.value.payment_method,
        payee_id: Number(form.value.payee_id),
        payee_account: form.value.payee_account,
        total_amount: form.value.total_amount || payeeRequisitions.value.reduce((sum, r) => sum + r.amount_to_pay, 0),
        narration: form.value.narration,
        status: 'POSTED',
        requisitions: payeeRequisitions.value.map(r => ({
          requisition_id: r.requisition_id,
          amount: r.amount_to_pay
        }))
      }

      // Save and post to backend
      const response = await accountingStore.postPaymentVoucher(payload)
      
      // Record amounts paid per requisition to track partial/full payments
      const postedVoucherNum = response.data?.voucher_number || response.data?.data?.voucher_number || payload.voucher_number || ''
      markRequisitionsAsPaid(
        payeeRequisitions.value.map(r => ({
          id: Number(r.requisition_id),
          amount: r.amount_to_pay || 0,
          total: r.total_amount || 0
        })),
        postedVoucherNum
      )

      // Show success SweetAlert
      await Swal.fire({
        icon: 'success',
        title: 'Payment Voucher Created',
        text: 'Payment voucher has been successfully created and posted',
        confirmButtonColor: '#059669',
        confirmButtonText: 'OK'
      })

      // Redirect to vouchers list
      router.push({ name: 'journal-vouchers' })
    } catch (error: any) {
      console.error('Error posting payment voucher:', error)
      init({
        message: error?.response?.data?.message || 'Failed to post payment voucher',
        color: 'danger'
      })
    } finally {
      saving.value = false
    }
  } else {
    // Post existing draft voucher
    try {
      saving.value = true

      const response = await accountingStore.postPaymentVoucher({
        id: voucherId,
        status: 'POSTED'
      })

      // Record amounts paid per requisition to track partial/full payments
      const draftVoucherNum = response.data?.voucher_number || response.data?.data?.voucher_number || ''
      markRequisitionsAsPaid(
        payeeRequisitions.value.map(r => ({
          id: Number(r.requisition_id),
          amount: r.amount_to_pay || 0,
          total: r.total_amount || 0
        })),
        draftVoucherNum
      )

      init({
        message: 'Payment voucher posted successfully',
        color: 'success'
      })

      // Redirect to vouchers list
      setTimeout(() => {
        router.push({ name: 'journal-vouchers' })
      }, 1500)
    } catch (error: any) {
      console.error('Error posting payment voucher:', error)
      init({
        message: error?.response?.data?.message || 'Failed to post payment voucher',
        color: 'danger'
      })
    } finally {
      saving.value = false
    }
  }
}

function closeForm() {
  // Confirm close if there are unsaved changes
  if (payeeRequisitions.value.length > 0 || form.value.narration) {
    Swal.fire({
      title: 'Unsaved Changes',
      text: 'Are you sure you want to close without saving?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Close',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({ name: 'journal-vouchers' })
      }
    })
  } else {
    router.push({ name: 'journal-vouchers' })
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
  } as any
  selectedRequisition.value = null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Calculate total amount from requisition items
function calculateRequisitionTotal(requisition: any): number {
  if (!requisition) return 0
  
  // Try direct total_amount property first
  if (requisition.total_amount && !isNaN(parseFloat(String(requisition.total_amount)))) {
    return parseFloat(String(requisition.total_amount))
  }
  
  // Calculate from items - try multiple field names
  const items = requisition.items || requisition.line_items || requisition.requisition_items || requisition.lines || []
  if (!Array.isArray(items) || items.length === 0) return 0
  
  return items.reduce((sum: number, item: any) => {
    let itemAmount = 0
    
    // First check if amount is directly on the item
    if (item.amount && !isNaN(parseFloat(String(item.amount)))) {
      itemAmount = parseFloat(String(item.amount))
    } else if (item.total_amount && !isNaN(parseFloat(String(item.total_amount)))) {
      itemAmount = parseFloat(String(item.total_amount))
    } else if (item.unit_price && item.quantity) {
      const price = parseFloat(String(item.unit_price)) || 0
      const qty = parseFloat(String(item.quantity)) || 0
      itemAmount = price * qty
    }
    // NEW: Check if amount is in the item's accounts array
    else if (item.accounts && Array.isArray(item.accounts)) {
      itemAmount = item.accounts.reduce((accSum: number, acc: any) => {
        if (acc.amount && !isNaN(parseFloat(String(acc.amount)))) {
          return accSum + parseFloat(String(acc.amount))
        }
        return accSum
      }, 0)
    }
    
    return sum + itemAmount
  }, 0)
}

// Get source type for requisition
function getRequisitionSourceType(requisition: any): string {
  if (!requisition) return 'N/A'
  
  // Try source property
  if (requisition.source?.sourceType) {
    return requisition.source.sourceType
  }
  
  // Try requisition_type
  if (requisition.requisition_type?.name) {
    return requisition.requisition_type.name
  }
  
  // Try source_type directly
  if (requisition.source_type) {
    return requisition.source_type
  }
  
  // Default
  return 'Requisition'
}

// ==================== PAYMENT VOUCHER DATA LOADING ====================

async function loadPaymentVoucherData() {
  try {
    // Fetch branches from API
    const branchesResponse = await accountingStore.fetchBranches()
    branches.value = branchesResponse.data?.data || branchesResponse.data || []
    
    // Fetch bank/cash accounts for the From Account dropdown
    const bankCashResponse = await accountingStore.getBankCashAccounts()
    bankCashAccounts.value = bankCashResponse.data?.data || bankCashResponse.data || []
    
    // Fetch all payees from API
    const payeesResponse = await accountingStore.fetchPayees(accountingStore.companyId)
    payees.value = payeesResponse.data?.data || payeesResponse.data || []
    
  } catch (error: any) {
    console.error('Error loading payment voucher data:', error)
    init({
      message: 'Some dropdown data could not be loaded. Please try again.',
      color: 'warning'
    })
  }
}

// Handle From Account selection change
function onFromAccountChange() {// Clear payee requisitions when account changes (they were for a different account)
  payeeRequisitions.value = []
}

// Handle Payee selection change
async function onPayeeChange() {
  // Clear payee requisitions when payee changes
  payeeRequisitions.value = []
}

// Lifecycle
onMounted(async () => {
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
      accountingStore.fetchRequisitionsForLinking(),
      loadPaymentVoucherData() // Load payment voucher specific data
    ])
  } catch (error: any) {
    console.error('Error loading metadata:', error)
    init({
      message: 'Some form data could not be loaded. The form will still work, but some options may be limited.',
      color: 'warning'
    })
  }

  if (isEdit.value && voucherId.value) {
    try {
      const response = await accountingStore.getJournalVoucher(voucherId.value)
      const voucher = response.data.data || response.data
      
      // Debug: Log the full voucher structure)// Store the full voucher for display
      loadedVoucher.value = voucher
      
      // Check if this is a payment voucher by document type
      const isPaymentVoucher = voucher.document_type?.code === 'PV' || voucher.document_type?.name?.includes('Payment')
      
      if (isPaymentVoucher && voucher.accounts && voucher.accounts.length >= 2) {// Extract payment details from accounts
        // CR account is the source (from_account), DR account is the destination (payee_account)
        const creditAccount = voucher.accounts.find((a: any) => a.transaction_type === 'CR')
        const debitAccount = voucher.accounts.find((a: any) => a.transaction_type === 'DR')
        
        // Extract payment method from narration (e.g., "Payment from CASH-IN-HAND via Cash")
        const paymentMethodMatch = creditAccount?.narration?.match(/via (\w+)/)
        const paymentMethod = paymentMethodMatch ? paymentMethodMatch[1] : ''
        
        // Load payment voucher data
        form.value = {
          ...form.value,
          voucher_number: voucher.document_number || '',
          posting_date: voucher.posting_date?.split('T')[0],
          branch_id: String(voucher.branch_id || ''),
          currency_id: String(voucher.currency_id || ''),
          exchange_rate: 1.0,
          from_account_id: String(creditAccount?.account_id || ''),
          payment_method: paymentMethod,
          payee_account: String(debitAccount?.account_id || ''),
          total_amount: parseFloat(creditAccount?.amount || debitAccount?.amount || 0),
          narration: voucher.narration || '',
          status: voucher.status || 'DRAFT'
        } as any} else {
        // Load standard journal voucher data
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
        } as any
      }

      // Check for requisitions in the voucher response
      // They might be under 'requisitions', 'payment_requisitions', or nested in accounts
      const requisitionsData = voucher.requisitions || voucher.payment_requisitions || []
      
      if (requisitionsData && requisitionsData.length > 0) {
        payeeRequisitions.value = requisitionsData.map((req: any) => ({
          requisition_id: req.requisition_id || req.id,
          requisition_number: req.requisition_number || req.number || `REQ-${String(req.requisition_id || req.id || '').padStart(4, '0')}`,
          description: req.description || req.narration || 'Payment requisition',
          cost_center_code: req.cost_center?.code || req.cost_center_code || 'N/A',
          cost_center: req.cost_center?.code || req.cost_center_code || 'N/A',
          amount: req.total_amount || req.amount || 0,
          amount_to_pay: req.amount || req.paid_amount || req.amount_to_pay || 0,
          total_amount: req.total_amount || req.amount || 0
        }))} else {}
    } catch (error) {
      init({
        message: 'Failed to load journal voucher',
        color: 'danger'
      })
    }
  }

  // Store the event listener reference for cleanup
  ;(window as any).__jvFormClickOutside = handleClickOutside
})

// watch for fund_direction changes so UI and payload behave correctly
watch(() => form.value.fund_direction, (newDir) => {
  if (newDir === 'WITHDRAW') {
    // clear any selected payee, backend doesn't require one
    form.value.payee_id = ''
    // default the debit account to the same as the credit
    if (form.value.from_account_id) {
      form.value.payee_account = String(form.value.from_account_id)
      form.value.payee_account_id = Number(form.value.from_account_id)
      // try to preserve code from the grouped options
      const match = groupedBankCashAccountOptions.value.find((opt: any) => opt.value === Number(form.value.from_account_id))
      form.value.payee_account_code = match?.code || ''
    }
  }
})

// ensure payee_account follows from_account when withdrawing
watch(() => form.value.from_account_id, (newId) => {
  if (form.value.fund_direction === 'WITHDRAW') {
    form.value.payee_account = newId ? String(newId) : ''
    form.value.payee_account_id = newId ? Number(newId) : null
    const match = groupedBankCashAccountOptions.value.find((opt: any) => opt.value === Number(newId))
    form.value.payee_account_code = match?.code || ''
  }
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
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: white;
  border-radius: var(--radius);
  overflow: visible;
  box-shadow: var(--shadow-sm);
  table-layout: fixed;
  margin: 0;
  padding: 0;
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
  box-sizing: border-box;
  word-wrap: break-word;
  margin: 0;
  vertical-align: middle;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  box-sizing: border-box;
  word-wrap: break-word;
  vertical-align: middle;
  margin: 0;
  overflow: hidden;
}

.data-table td > span,
.data-table td > button,
.data-table td > div {
  margin: 0;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

/* Column width distribution */
.data-table tr > :nth-child(1) {
  width: 8% !important;
  min-width: 8% !important;
  max-width: 8% !important;
  text-align: center !important;
}

.data-table tr > :nth-child(2) {
  width: 40% !important;
  min-width: 40% !important;
  max-width: 40% !important;
}

.data-table tr > :nth-child(3) {
  width: 15% !important;
  min-width: 15% !important;
  max-width: 15% !important;
  text-align: center !important;
}

.data-table tr > :nth-child(4) {
  width: 22% !important;
  min-width: 22% !important;
  max-width: 22% !important;
  text-align: right !important;
}

.data-table tr > :nth-child(5) {
  width: 15% !important;
  min-width: 15% !important;
  max-width: 15% !important;
  text-align: center !important;
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

/* Vue Multiselect Customization */
.v-select-field {
  width: 100%;
  font-size: 12px;
}

.v-select-field .multiselect__tags {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  min-height: 36px;
  padding: 4px 40px 0 8px;
}

.v-select-field .multiselect__single {
  font-size: 12px;
  margin-bottom: 4px;
  color: #1f2937;
}

.v-select-field .multiselect__placeholder {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
  padding-top: 0;
}

.v-select-field .multiselect__select {
  height: 36px;
}

.v-select-field .multiselect__input {
  font-size: 12px;
  padding: 0;
  margin-bottom: 4px;
}

.v-select-field .multiselect__option {
  font-size: 12px;
  padding: 8px 12px;
  min-height: 28px;
  line-height: 1.4;
}

.v-select-field .multiselect__option--highlight {
  background: #dbeafe;
  color: #1e40af;
}

.v-select-field .multiselect__option--selected {
  background: #2563eb;
  color: white;
  font-weight: 500;
}

.v-select-field .multiselect__option--selected.multiselect__option--highlight {
  background: #1d4ed8;
  color: white;
}

/* Grouped multiselect styles */
.v-select-grouped .source-header {
  background: #f3f4f6;
  color: #374151;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  padding: 6px 12px !important;
  cursor: default;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.v-select-grouped .source-option {
  color: #1f2937;
}

.v-select-grouped .ps-3 {
  padding-left: 24px !important;
}

.multiselect__content-wrapper {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.multiselect__content {
  width: 100%;
}

/* ═══════ Requisition Details Modal ═══════ */
.req-modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  animation: reqFadeIn 0.2s ease;
}
@keyframes reqFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes reqSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.req-modal-container {
  background: #fff;
  border-radius: 12px;
  width: 95%; max-width: 820px; max-height: 88vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
  animation: reqSlideUp 0.25s ease;
}

.req-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex; justify-content: space-between; align-items: center;
  background: linear-gradient(to bottom, #fafbfc, #fff);
}

.req-modal-close-btn {
  width: 32px; height: 32px;
  border-radius: 8px; border: 1px solid #e5e7eb;
  background: #fff; color: #6b7280;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all 0.15s;
}
.req-modal-close-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

.req-modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.req-info-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.req-info-card {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 12px;
}
.req-info-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 4px;
}
.req-info-value {
  font-size: 14px;
  color: #111827;
}

.req-cost-center-section {
  margin-bottom: 16px;
  padding: 14px;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 8px;
}
.req-section-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}
.req-cc-tags {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.req-cc-tag {
  display: inline-flex; align-items: center;
  background: #fff; border: 1px solid #fde68a;
  color: #92400e; font-size: 12px; font-weight: 500;
  padding: 4px 10px; border-radius: 6px;
}

.req-items-section {
  margin-top: 4px;
}
.req-items-table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.req-items-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.req-items-table thead tr {
  background: #f9fafb;
}
.req-items-table th {
  padding: 10px 12px;
  font-size: 11px; font-weight: 700;
  color: #6b7280;
  text-transform: uppercase; letter-spacing: 0.04em;
  border-bottom: 1px solid #e5e7eb;
}
.req-items-table td {
  padding: 10px 12px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}
.req-items-table tbody tr:hover { background: #f9fafb; }
.req-items-table tbody tr.req-row-deselected {
  opacity: 0.45;
  text-decoration: line-through;
  background: #fafafa;
}
.req-items-total-row td {
  padding: 12px;
  background: #f0fdf4;
  border-top: 2px solid #d1fae5;
  border-bottom: none;
}

.req-modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex; justify-content: flex-end; gap: 8px;
  background: #fafbfc;
}
.req-btn-secondary {
  padding: 8px 18px;
  background: #fff; color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px; cursor: pointer;
  font-weight: 500; font-size: 13px;
  transition: all 0.15s;
}
.req-btn-secondary:hover { background: #f3f4f6; }
.req-btn-primary {
  padding: 8px 18px;
  background: #2563eb; color: #fff;
  border: none; border-radius: 8px;
  cursor: pointer; font-weight: 600; font-size: 13px;
  box-shadow: 0 1px 3px rgba(37,99,235,0.3);
  transition: all 0.15s;
}
.req-btn-primary:hover { background: #1d4ed8; box-shadow: 0 2px 6px rgba(37,99,235,0.4); }
</style>