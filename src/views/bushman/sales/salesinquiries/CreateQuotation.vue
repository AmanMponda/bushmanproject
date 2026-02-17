<template>
  <div class="create-quotation-page">
    <!-- Header -->
    <div class="d-flex align-items-center mb-3">
      <div>
        <h1 class="page-header mb-0">{{ isCreateMode ? 'Create Quotation' : (isLocked ? 'View Quotation' : 'Edit Quotation') }}</h1>
        <div v-if="!isCreateMode" class="quotation-meta mt-2">
          <span
            v-if="existingPricing"
            class="badge px-2 pt-5px pb-5px rounded fs-12px d-inline-flex align-items-center"
            :class="existingPricing.status === 'LOCKED' 
              ? 'bg-teal text-teal-800 bg-opacity-25' 
              : 'bg-orange bg-opacity-20 text-orange'"
          >
            <i class="fa fa-circle fs-9px fa-fw me-5px" :class="existingPricing.status === 'LOCKED' ? 'text-teal' : ''"></i>
            {{ existingPricing.status === 'LOCKED' ? 'Locked' : 'Draft' }}
          </span>
          <span class="text-muted small ms-2">
            Quotation ID: {{ existingPricing?.id || 'N/A' }}
          </span>
          <span class="text-muted small ms-2">
            Updated: {{ formatDate(existingPricing?.updated_at) }}
          </span>
        </div>
      </div>
      <div class="ms-auto">
        <button class="btn btn-theme" @click="goBack">
          <i class="fa fa-arrow-left fa-fw me-1"></i> Back
        </button>
        <button class="btn btn-outline-theme ms-2" :disabled="!existingPricing || printingPdf" @click="downloadQuotationPdf">
          <span v-if="printingPdf" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="fa fa-print fa-fw me-1"></i> Print PDF
        </button>
      </div>
    </div>

    <div class="container-fluid">
      <!-- Enquiry Info Summary -->
      <card class="mb-3">
        <div class="p-3 bg-light border-bottom">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h6 class="mb-0 fw-semibold">Enquiry Details</h6>
            <div class="d-flex flex-wrap gap-2">
              <span v-if="!existingPricing && !isCreateMode" class="badge bg-orange bg-opacity-20 text-orange px-2 pt-5px pb-5px rounded fs-12px">
                <i class="fa fa-circle fs-9px fa-fw me-5px"></i>No Pricing Record
              </span>
              <span v-if="loadingPreview" class="badge bg-primary bg-opacity-20 text-primary px-2 pt-5px pb-5px rounded fs-12px">
                <i class="fa fa-circle text-primary text-opacity-80 fs-9px fa-fw me-5px"></i>Loading Package Data
              </span>
            </div>
          </div>
        </div>
        <div class="p-3">
          <div class="row">
            <div class="col-md-3">
              <small class="text-muted d-block">Package</small>
              <strong>{{ enquiryPackageName || 'N/A' }}</strong>
            </div>
            <div class="col-md-3">
              <small class="text-muted d-block">Hunting Type</small>
              <strong>{{ enquiryHuntingType || 'N/A' }}</strong>
            </div>
            <div class="col-md-3">
              <small class="text-muted d-block">Currency</small>
              <strong>{{ enquiryCurrency || 'USD' }}</strong>
            </div>
            <div class="col-md-3">
              <small class="text-muted d-block">Duration</small>
              <strong>{{ enquiryDaysDisplay }}</strong>
            </div>
          </div>
        </div>
      </card>

      <!-- Loading State -->
      <div v-if="loadingEnquiry" class="text-center py-5">
        <span class="spinner-border spinner-border-lg me-2"></span>
        <div class="mt-2">Loading quotation data...</div>
      </div>

      <!-- No Pricing Record Warning -->
      <div v-else-if="!existingPricing && enquiryData && !isCreateMode" class="alert alert-warning">
        <i class="fa fa-exclamation-triangle me-2"></i>
        <strong>No Quotation Found</strong>
        <p class="mb-0">This enquiry doesn't have an existing quotation. The quotation should have been automatically created with the enquiry. Make sure the enquiry has a price structure detail assigned.</p>
      </div>

      <!-- Main Content - Existing Items + Add New Items -->
      <div v-else-if="existingPricing || isCreateMode">
        <!-- Summary Card - Create Mode (auto-calculated from enquiry items) -->
        <div v-if="isCreateMode && !loadingPreview" class="card mb-4 quotation-summary-card text-white">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-3">
                <h3 class="mb-0">{{ enquiryTotalItems }}</h3>
                <small>Total Items</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ currencySymbol }} {{ formatCurrency(enquiryTrophyTotal) }}</h3>
                <small>Trophy Fees</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ currencySymbol }} {{ formatCurrency(enquiryExtrasTotal) }}</h3>
                <small>Extras</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ currencySymbol }} {{ formatCurrency(enquiryGrandTotal) }}</h3>
                <small>Grand Total</small>
              </div>
            </div>
          </div>
        </div>
        <!-- Summary Card - Edit Mode -->
        <div v-if="!isCreateMode" class="card mb-4 quotation-summary-card text-white">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-3">
                <h3 class="mb-0">{{ pricingSummary.total_items || 0 }}</h3>
                <small>Total Items</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ currencySymbol }} {{ formatCurrency(pricingSummary.trophy_total || 0) }}</h3>
                <small>Trophy Fees</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ currencySymbol }} {{ formatCurrency(pricingSummary.extra_total || 0) }}</h3>
                <small>Extras</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ currencySymbol }} {{ formatCurrency(pricingSummary.subtotal || 0) }}</h3>
                <small>Grand Total</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Existing Items by Type -->
        <div v-for="(items, itemType) in existingItemsByType" :key="itemType" class="card mb-4">
          <div class="card-header bg-white d-flex justify-content-between align-items-center quotation-section-header">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge" :class="getItemTypeBadgeClass(itemType)">
                {{ formatItemType(itemType) }}
              </span>
              <span class="fw-semibold">{{ getItemTypeLabel(itemType) }}</span>
              <span class="badge bg-light text-dark">{{ items.length }} items</span>
            </div>
            <button
              v-if="(itemType === 'TROPHY' || itemType === 'EXTRA') && !isLocked"
              class="btn btn-sm btn-outline-primary"
              @click="openInlineAdd(itemType as string)"
              :disabled="addingInlineType === itemType"
            >
              <i class="fa fa-plus me-1"></i> Add
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover text-nowrap mb-0">
                <thead>
                  <tr>
                    <th class="border-top-0 pt-0 pb-2">Item</th>
                    <th class="border-top-0 pt-0 pb-2 text-center" style="width: 100px;">Qty</th>
                    <th v-if="itemType === 'EXTRA'" class="border-top-0 pt-0 pb-2 text-center" style="width: 110px;">Duration (days)</th>
                    <th class="border-top-0 pt-0 pb-2 text-end" style="width: 150px;">Unit Price</th>
                    <th class="border-top-0 pt-0 pb-2 text-end" style="width: 150px;">Total</th>
                    <th class="border-top-0 pt-0 pb-2 text-center" style="width: 100px;">Optional</th>
                    <th v-if="!isLocked" class="border-top-0 pt-0 pb-2 text-center" style="width: 80px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="align-middle">
                      <div>
                        <strong>{{ item.item_name || item.description }}</strong>
                        <span v-if="item.item_code" class="text-muted small ms-2">({{ item.item_code }})</span>
                      </div>
                      <small class="text-muted">{{ item.description }}</small>
                    </td>
                    <td class="text-center align-middle">
                      {{ item.quantity }}
                    </td>
                    <td v-if="itemType === 'EXTRA'" class="text-center align-middle">
                      <div v-if="isDurationRelevantForItem(item)">
                        {{ computeEffectiveDuration(item) ?? '-' }}
                      </div>
                      <div v-else>
                        <span class="text-muted">-</span>
                      </div>
                    </td>
                    <td class="text-end align-middle">{{ formatCurrency(item.unit_amount) }}</td>
                    <td class="text-end align-middle">
                      <strong class="text-success">{{ formatCurrency(item.total_amount) }}</strong>
                    </td>
                    <td class="text-center align-middle py-1">
                      <span v-if="item.is_optional" class="badge bg-primary bg-opacity-20 text-primary px-2 pt-5px pb-5px rounded fs-12px">Optional</span>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td v-if="!isLocked" class="text-center align-middle">
                      <button class="btn btn-danger btn-sm" @click="removeItem(item)" :disabled="removingItem === item.id">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <!-- Inline Add Row -->
                  <tr v-if="addingInlineType === itemType" class="table-info">
                    <td class="align-middle">
                      <select
                        class="form-select form-select-sm"
                        v-model="inlineAddSelectedId"
                        @change="onInlineItemSelected"
                      >
                        <option value="">-- Select {{ itemType === 'TROPHY' ? 'Species' : 'Extra' }} --</option>
                        <option
                          v-for="opt in inlineAddOptions"
                          :key="opt.id"
                          :value="opt.id"
                        >
                          {{ opt.name }} {{ opt.amount ? `(${formatCurrency(opt.amount)})` : '' }}
                        </option>
                      </select>
                      <small v-if="inlineAddWarning" class="text-danger d-block mt-1">
                        <i class="fa fa-exclamation-triangle me-1"></i>{{ inlineAddWarning }}
                      </small>
                    </td>
                    <td class="text-center align-middle">
                      <input
                        type="number"
                        class="form-control form-control-sm text-center"
                        v-model.number="inlineAddQty"
                        min="1"
                        @input="recalcInlineTotal"
                      >
                    </td>
                    <td v-if="itemType === 'EXTRA'" class="text-center align-middle">
                      <input
                        v-if="inlineAddShowDuration"
                        type="number"
                        class="form-control form-control-sm text-center"
                        v-model.number="inlineAddDuration"
                        min="1"
                        @input="recalcInlineTotal"
                      >
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td class="text-end align-middle">
                      {{ formatCurrency(inlineAddUnitPrice) }}
                    </td>
                    <td class="text-end align-middle">
                      <strong class="text-success">{{ formatCurrency(inlineAddTotal) }}</strong>
                    </td>
                    <td class="text-center align-middle">
                      <input type="checkbox" class="form-check-input" v-model="inlineAddOptional">
                    </td>
                    <td class="text-center align-middle">
                      <div class="d-flex gap-1 justify-content-center">
                        <button
                          class="btn btn-success btn-sm"
                          @click="confirmInlineAdd"
                          :disabled="!inlineAddSelectedId || !!inlineAddWarning || savingInlineAdd"
                          title="Add item"
                        >
                          <span v-if="savingInlineAdd" class="spinner-border spinner-border-sm"></span>
                          <i v-else class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" @click="cancelInlineAdd" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No items message -->
        <div v-if="Object.keys(existingItemsByType).length === 0 && !isCreateMode" class="alert alert-info">
          <i class="fa fa-info-circle me-2"></i>
          No items have been added to this quotation yet. Use the form below to add items.
        </div>

        <!-- Customized Package Section -->
        <div class="card mb-4">
          <div class="card-header bg-white quotation-section-header">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-info bg-opacity-25 text-info">CUSTOMIZED</span>
                <span class="fw-semibold">Customized Line</span>
                <span v-if="allCustomizedItems.length > 0" class="badge bg-light text-dark">{{ allCustomizedItems.length }} items</span>
                <span v-if="pendingLicenceCount > 0" class="badge bg-warning text-dark ms-1">
                  <i class="fa fa-clock-o me-1"></i>{{ pendingLicenceCount }} pending
                </span>
              </div>
            </div>
          </div>

          <!-- Saved Customized Items -->
          <div v-if="allCustomizedItems.length > 0" class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover text-nowrap mb-0">
                <thead>
                  <tr>
                    <th class="border-top-0 pt-0 pb-2">Item</th>
                    <th class="border-top-0 pt-0 pb-2 text-center" style="width: 100px;">Qty</th>
                    <th class="border-top-0 pt-0 pb-2 text-end" style="width: 150px;">Unit Price</th>
                    <th class="border-top-0 pt-0 pb-2 text-end" style="width: 150px;">Total</th>
                    <th class="border-top-0 pt-0 pb-2 text-center" style="width: 100px;">Flag</th>
                    <th v-if="!isLocked" class="border-top-0 pt-0 pb-2 text-center" style="width: 80px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in allCustomizedItems" :key="item.id || item._uid">
                    <td class="align-middle">
                      <div>
                        <strong>{{ item.item_name || item.description }}</strong>
                        <span v-if="item.item_code" class="text-muted small ms-2">({{ item.item_code }})</span>
                        <span class="badge bg-secondary ms-2">Customized</span>
                      </div>
                      <small class="text-muted">{{ item.description }}</small>
                    </td>
                    <td class="text-center align-middle">{{ item.quantity }}</td>
                    <td class="text-end align-middle">{{ formatCurrency(item.unit_amount || item.unitPrice || 0) }}</td>
                    <td class="text-end align-middle">
                      <strong class="text-success">{{ formatCurrency(item.total_amount || item.total || 0) }}</strong>
                    </td>
                    <td class="text-center align-middle">
                      <span v-if="item.pending_licence || item.amount_source === 'PENDING_REGULATORY'" class="badge bg-warning text-dark bg-opacity-25 px-2 pt-5px pb-5px rounded fs-12px">
                        <i class="fa fa-clock-o fa-fw me-1"></i>Pending Licence
                      </span>
                      <span v-else-if="item.is_optional" class="badge bg-info bg-opacity-20 text-info px-2 pt-5px pb-5px rounded fs-12px">Optional / Customized</span>
                      <span v-else class="badge bg-secondary bg-opacity-15 text-secondary px-2 pt-5px pb-5px rounded fs-12px">Customized</span>
                    </td>
                    <td v-if="!isLocked" class="text-center align-middle">
                      <button class="btn btn-danger btn-sm" @click="item._isLocal ? removeLocalCustomItem(idx) : removeItem(item)" :disabled="removingItem === item.id">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty state when no auto-split items -->
          <div v-if="allCustomizedItems.length === 0" class="card-body text-center py-3 text-muted">
            <small><i class="fa fa-info-circle me-1"></i>Auto-split items will appear here when species exceed their licence limits.</small>
          </div>
        </div>

        <!-- Add New Items Section (hidden when locked) -->
        <div v-if="!isLocked" class="card mb-4">
          <div class="card-header bg-white quotation-section-header">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <h6 class="mb-1">
                  <i class="fa fa-bolt me-2 text-primary"></i>
                  Items enquired by the client
                </h6>
                <small class="text-muted">Based on package data and enquiry preferences.</small>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="selectAllSystemItems"
                  :disabled="loadingPreview || availablePriceableItems.length === 0"
                >
                  <i class="fa fa-refresh me-1"></i> Re-select All
                </button>
                <button
                  class="btn btn-outline-secondary btn-sm"
                  @click="clearSelection"
                  :disabled="selectedItemsCount === 0"
                >
                  <i class="fa fa-eraser me-1"></i> Clear Selection
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loadingPreview" class="text-center py-4">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Loading package rates...
            </div>
            <div v-else-if="availablePriceableItems.length > 0">
              <div v-for="category in availablePriceableItems" :key="category.category" class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="text-muted mb-0">
                    <i class="fa fa-tag me-1"></i>
                    {{ category.category }}
                  </h6>
                  <div class="form-check">
                    <input 
                      type="checkbox" 
                      class="form-check-input"
                      @change="toggleCategorySelection(category)"
                      :checked="isCategorySelected(category)"
                      :id="`select-all-${category.category}`"
                    >
                    <label class="form-check-label small" :for="`select-all-${category.category}`">
                      Select All
                    </label>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered mb-0">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 40px;"></th>
                        <th>Item</th>
                        <th style="width: 100px;" class="text-center">Qty</th>
                        <th v-if="category.category === 'Safari Extras'" style="width: 110px;" class="text-center">Duration (days)</th>
                        <th style="width: 170px;" class="text-end">Unit Price</th>
                        <th style="width: 140px;" class="text-end">Total</th>
                        <th style="width: 80px;" class="text-center">Optional</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in category.items" :key="item.id" :class="{'table-success': selectedItems[`${category.category}_${item.id}`]}">
                        <td class="text-center">
                          <input 
                            type="checkbox" 
                            class="form-check-input"
                            v-model="selectedItems[`${category.category}_${item.id}`]"
                            @change="initializeItemPrice(category.category, item)"
                          >
                        </td>
                        <td>
                          <div>
                            <strong>{{ cleanItemName(item.name) }}</strong>
                            <span class="badge ms-2 small" :class="getItemTypeBadgeClass(item.type)">{{ formatItemType(item.type) }}</span>

                            <!-- allocation / source / pending badges for selected items -->
                            <template v-if="selectedItems[`${category.category}_${item.id}`]">
                              <span v-if="ensureItemPrice(category.category, item)._isOriginal" class="badge bg-info ms-2" title="Capped to licence limit; overflow split to other licences">
                                <i class="fa fa-id-card-o me-1"></i>Original (capped)
                              </span>
                              <span v-else-if="ensureItemPrice(category.category, item)._isCustomized || ensureItemPrice(category.category, item).source_package" class="badge bg-secondary ms-2">Customized</span>
                              <span v-else-if="ensureItemPrice(category.category, item)._pending_regulatory || ensureItemPrice(category.category, item).pending_licence" class="badge bg-warning text-dark ms-2">Pending licence</span>
                            </template>
                          </div>
                          <small v-if="item.priority" class="text-muted">{{ formatPriority(item.priority) }}</small>
                        </td>
                        <td class="text-center">
                          <template v-if="selectedItems[`${category.category}_${item.id}`]">
                            <input 
                              v-if="item.type !== 'PACKAGE'"
                              type="number" 
                              class="form-control form-control-sm text-center"
                              :class="{ 'border-danger': item.regulatory_qty > 0 && ensureItemPrice(category.category, item).quantity > item.regulatory_qty }"
                              v-model.number="ensureItemPrice(category.category, item).quantity"
                              min="1"
                              :max="item.regulatory_qty > 0 ? item.regulatory_qty : undefined"
                              @input="updateItemTotal(category.category, item.id)"
                            >
                            <span v-else>{{ ensureItemPrice(category.category, item).quantity }}</span>
                          </template>
                          <span v-else class="text-muted">{{ item.quantity }}</span>
                          <!-- Regulatory licence warning – only shown when qty exceeds limit -->
                          <div v-if="item.type === 'TROPHY' && item.regulatory_qty > 0
                            && (selectedItems[`${category.category}_${item.id}`]
                              ? ensureItemPrice(category.category, item).quantity
                              : item.quantity) > item.regulatory_qty"
                            class="mt-1"
                          >
                            <small class="text-danger fw-semibold"
                              :title="'Package licence allows max ' + item.regulatory_qty"
                            >
                              <i class="fa fa-id-card-o fa-fw"></i> Licence: {{ item.regulatory_qty }}
                              <span class="ms-1">
                                <i class="fa fa-exclamation-triangle"></i> Exceeded by {{ (selectedItems[`${category.category}_${item.id}`]
                                  ? ensureItemPrice(category.category, item).quantity
                                  : item.quantity) - item.regulatory_qty }}!
                              </span>
                            </small>
                          </div>
                        </td>
                        <td class="text-center" v-if="category.category === 'Safari Extras'">
                          <div v-if="isDurationRelevantForItem(item)">
                            <input
                              v-if="selectedItems[`${category.category}_${item.id}`]"
                              type="number"
                              class="form-control form-control-sm text-center"
                              :value="ensureItemPrice(category.category, item).item_durations"
                              @input="handleInitItemDuration($event, category.category, item.id)"
                              min="1"
                              placeholder=""
                              title="Leave blank to inherit hunting length"
                              style="width: 110px"
                            />
                            <span v-else class="text-muted">
                              {{ computeEffectiveDuration(item) ?? '-' }}
                            </span>
                          </div>
                          <div v-else>
                            <span class="text-muted">-</span>
                          </div>
                        </td>                        <td>
                          <div v-if="selectedItems[`${category.category}_${item.id}`]" class="d-flex align-items-center justify-content-end gap-1">
                            <input 
                              v-if="discountItems[`${category.category}_${item.id}`] && item.type !== 'PACKAGE'"
                              type="number" 
                              class="form-control form-control-sm text-end"
                              v-model.number="ensureItemPrice(category.category, item).unit_amount"
                              step="0.01"
                              min="0"
                              @input="updateItemTotal(category.category, item.id)"
                              style="width: 110px"
                            >
                            <span v-else class="text-end">{{ formatCurrency(ensureItemPrice(category.category, item).unit_amount) }}</span>
                            <button 
                              v-if="item.type !== 'PACKAGE'"
                              class="btn btn-sm btn-outline-warning p-0 px-1"
                              @click="discountItems[`${category.category}_${item.id}`] = !discountItems[`${category.category}_${item.id}`]"
                              :title="discountItems[`${category.category}_${item.id}`] ? 'Lock price' : 'Apply discount'"
                            >
                              <i class="fa fa-sm" :class="discountItems[`${category.category}_${item.id}`] ? 'fa-lock' : 'fa-percent'"></i>
                            </button>
                          </div>
                          <span v-else class="text-muted text-end d-block">{{ formatCurrency(item.suggested_price) }}</span>
                        </td>
                        <td class="text-end">
                          <strong v-if="selectedItems[`${category.category}_${item.id}`]" class="text-success">
                            {{ formatCurrency(itemPrices[`${category.category}_${item.id}`]?.total_amount || 0) }}
                          </strong>
                          <span v-else class="text-muted">{{ formatCurrency(item.quantity * item.suggested_price * (category.category === 'Safari Extras' && item.item_durations ? item.item_durations : 1)) }}</span>
                        </td>
                        <td class="text-center">
                          <input 
                            v-if="selectedItems[`${category.category}_${item.id}`]"
                            type="checkbox" 
                            class="form-check-input"
                            v-model="ensureItemPrice(category.category, item).is_optional"
                          >
                          <span v-else class="text-muted">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Add Items Button -->
              <div v-if="selectedItemsCount > 0" class="card bg-light mt-3 sticky-bottom quotation-selection-bar">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col-md-4">
                      <h6 class="mb-0">
                        <i class="fa fa-check-circle me-2 text-success"></i>
                        Selected: <strong>{{ selectedItemsCount }}</strong> items
                      </h6>
                    </div>
                    <div class="col-md-4 text-center">
                      <h5 class="mb-0 text-success">
                        <span v-if="previewPricing">Preview: {{ formatCurrency(previewPricing.total_amount) }}</span>
                        <span v-else>{{ formatCurrency(quotationTotal) }}</span>
                      </h5>
                    </div>
                    <div class="col-md-4 text-end">
                      <button 
                        class="btn btn-primary" 
                        @click="isCreateMode ? createPricingWithItems() : saveQuotation()" 
                        :disabled="saving"
                      >
                        <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="fa fa-save me-2"></i>
                        {{ isCreateMode ? `Create Quotation with ${selectedItemsCount} Items` : 'Add Selected Items' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              <i class="fa fa-check-circle fa-2x mb-2 text-success"></i>
              <p class="mb-0">All system-generated items are already included in the quotation.</p>
            </div>
          </div>
        </div>

        <!-- Edit-mode action bar (always visible when viewing an existing quotation) -->
        <div v-if="!isCreateMode && !isLocked" class="card bg-light sticky-bottom quotation-selection-bar">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-4">
                <h6 class="mb-0">
                  <i class="fa fa-file-text-o me-2 text-primary"></i>
                  Total Items: <strong>{{ existingItemsCount }}</strong>
                  <span v-if="localDeletedItemIds.size > 0 || localAddedItems.length > 0" class="ms-2 badge bg-warning text-dark fs-11px">
                    <i class="fa fa-pencil me-1"></i>
                    {{ localDeletedItemIds.size > 0 ? `-${localDeletedItemIds.size}` : '' }}{{ localDeletedItemIds.size > 0 && localAddedItems.length > 0 ? ' / ' : '' }}{{ localAddedItems.length > 0 ? `+${localAddedItems.length}` : '' }} unsaved
                  </span>
                </h6>
              </div>
              <div class="col-md-4 text-center">
                <h5 class="mb-0 text-success">{{ formatCurrency(existingGrandTotal) }}</h5>
              </div>
              <div class="col-md-4 text-end d-flex justify-content-end gap-2">
                <button class="btn btn-outline-secondary" @click="goBack">
                  <i class="fa fa-arrow-left me-1"></i> Back
                </button>
                <button class="btn btn-success" @click="saveQuotationChanges" :disabled="saving || !hasLocalChanges">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="fa fa-save me-1"></i> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State - No Pricing -->
      <div v-else class="card">
        <div class="card-body text-center py-5">
          <i class="fa fa-exclamation-triangle fa-4x text-warning mb-3"></i>
          <h5>No Quotation Data</h5>
          <p class="text-muted">Unable to load quotation data.</p>
          <button class="btn btn-primary" @click="goBack">
            <i class="fa fa-arrow-left me-1"></i> Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Edit Quotation Component
 * 
 * Edits the EXISTING quotation (sales_enquiry_pricing) by managing its items (sales_enquiry_pricing_items).
 * 
 * IMPORTANT: The quotation (pricing record) is automatically created when the enquiry is created.
 * We are NOT creating a new quotation - we're adding/editing items in the existing one.
 * 
 * Workflow:
 * 1. Load Pricing: GET /api/sales-enquiries/pricing/{pricingId} - enriched with enquiry data
 * 2. Display existing items from items_by_type
 * 3. Show items from enquiry preferences that haven't been added yet
 * 4. Add Items: POST /api/sales-enquiries/pricing/{pricingId}/items
 * 5. Delete Items: DELETE /api/sales-enquiries/pricing-items/{itemId}
 * 
 * Item Types:
 * - TROPHY: Trophy fees for species
 * - EXTRA: Safari extras (accommodation, transport, etc.) + Hunting Days
 * - LOGISTICS: Logistics costs (participants)
 * - ADJUSTMENT: Discounts or surcharges
 */
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesInquiriesStore } from '@/stores/bushman/sales-store'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import { downloadQuotationPdf as downloadQuotationPdfService } from '@/services/pdfService'
import axios from 'axios'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const salesStore = useSalesInquiriesStore()

const enquiryId = computed(() => Number(route.params.id))
const pricingIdFromRoute = computed(() => route.params.pricingId ? Number(route.params.pricingId) : null)
const isCreateMode = computed(() => !pricingIdFromRoute.value)
const isLocked = computed(() => existingPricing.value?.status === 'LOCKED')
const enquiryData = ref<any>(null)
const loadingEnquiry = ref(false)
const saving = ref(false)
const removingItem = ref<number | null>(null)
const existingPricing = ref<any>(null) // The pricing record with all data

// ---- Local-only edit tracking (edit mode) ----
// Items marked for removal (by pricing-item id) – not sent to server until "Save as New"
const localDeletedItemIds = ref<Set<number>>(new Set())
// Items added via "+Add" in edit mode – kept in memory only
const localAddedItems = ref<any[]>([])
const pricePreviewData = ref<any>(null)

// Expose a consistent previewPackageDetail (used elsewhere in the component)
const previewPackageDetail = computed(() => {
  return pricePreviewData.value?.price_structure_detail || existingPricing.value?.price_structure_detail || null
})
const loadingPreview = ref(false)
const previewPricing = ref<any | null>(null)
const printingPdf = ref(false)

// Ensure we don't trigger pricing recalculation while the component is initializing.
// Only allow server-side updates after we have loaded the existing pricing data.
const initialLoadComplete = ref(false)

const selectedItems = ref<Record<string, boolean>>({})
const itemPrices = ref<Record<string, any>>({})
const discountItems = ref<Record<string, boolean>>({})

// ---- Inline Add state for existing quotation sections ----
const addingInlineType = ref<string | null>(null) // 'TROPHY' | 'EXTRA' | null
const inlineAddSelectedId = ref<number | string>('')
const inlineAddQty = ref(1)
const inlineAddDuration = ref<number | null>(null)
const inlineAddUnitPrice = ref(0)
const inlineAddOptional = ref(false)
const inlineAddTotal = ref(0)
const inlineAddWarning = ref('')
const inlineAddShowDuration = ref(false)
const savingInlineAdd = ref(false)

// ---- Customized Package state ----
const loadingCustomPackages = ref(false)
const allPackagesList = ref<any[]>([]) // all packages from creation-metadata
const packageItemsCache = ref<Record<number, any[]>>({}) // cache: packageId -> items
let customRowUid = 0
const customRows = ref<any[]>([]) // each row: { _uid, packageId, itemId, quantity, unitPrice, total, isOptional, ... }
const localSavedCustomItems = ref<any[]>([]) // items saved locally in create mode (before quotation exists)

// Explicitly track pricing-item IDs added via the Customized Package section.
// Needed because a species can exist in both base and other packages (same item_id),
// so we can't always auto-detect whether it's customized just from the item_id.
const _customStorageKey = computed(() => {
  const pid = pricingIdFromRoute.value
  return pid ? `customPkgItemIds_${pid}` : ''
})
// Map: pricingItemId → { packageName } — tracks which package each custom item came from
const customItemIds = ref<Map<number, { packageName: string }>>(new Map())

const loadCustomItemIds = () => {
  const key = _customStorageKey.value
  if (!key) { customItemIds.value = new Map(); return }
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Support legacy format (plain array of numbers) and new format (array of [id, meta] tuples)
      if (Array.isArray(parsed)) {
        const map = new Map<number, { packageName: string }>()
        for (const entry of parsed) {
          if (Array.isArray(entry) && entry.length >= 2) {
            // New format: [id, { packageName }]
            map.set(Number(entry[0]), entry[1])
          } else {
            // Legacy format: plain number
            map.set(Number(entry), { packageName: '' })
          }
        }
        customItemIds.value = map
      } else {
        customItemIds.value = new Map()
      }
    } else {
      customItemIds.value = new Map()
    }
  } catch { customItemIds.value = new Map() }
}

const persistCustomItemIds = () => {
  const key = _customStorageKey.value
  if (!key) return
  // Store as array of [id, meta] tuples
  sessionStorage.setItem(key, JSON.stringify([...customItemIds.value.entries()]))
}

const addCustomItemId = (id: number, packageName: string = '') => {
  customItemIds.value.set(id, { packageName })
  persistCustomItemIds()
}

const removeCustomItemId = (id: number) => {
  customItemIds.value.delete(id)
  persistCustomItemIds()
}

// Get summary from pricing API
const pricingSummary = computed(() => {
  return existingPricing.value?.summary || {
    total_items: 0,
    trophy_total: 0,
    extra_total: 0,
    logistics_total: 0,
    subtotal: 0,
  }
})

// Get existing items grouped by type
// Build a set of trophy-fee item_ids from the BASE package (pricePreviewData)
const basePackageTrophyItemIds = computed(() => {
  const ids = new Set<number>()
  const pd = pricePreviewData.value
  if (!pd) return ids
  if (Array.isArray(pd.trophy_fees)) {
    pd.trophy_fees.forEach((tf: any) => {
      const id = tf.item_id || tf.species_id || tf.id
      if (id) ids.add(Number(id))
    })
  }
  return ids
})

// Map species item_id → regulatory licence quantity from the BASE package's regulatory_package
// Falls back to pricePreviewData.species if regulatory_package is not available
const baseSpeciesQtyMap = computed(() => {
  const map = new Map<number, number>()

  // 1st priority: regulatory_package.species_by_category from the base package in allPackagesList
  const currentId = currentPriceStructureDetailId.value
  if (currentId) {
    const basePkg = allPackagesList.value.find((p: any) => p.id === currentId)
    const regPkg = basePkg?.regulatory_package
    if (regPkg?.species_by_category && Array.isArray(regPkg.species_by_category)) {
      regPkg.species_by_category.forEach((catGroup: any) => {
        const speciesList = catGroup.species || []
        speciesList.forEach((sp: any) => {
          const id = sp.id || sp.item_id
          const qty = Number(sp.quantity) || 0
          if (id && qty > 0) map.set(Number(id), qty)
        })
      })
      if (map.size > 0) return map
    }
  }

  // 2nd priority: fallback to pricePreviewData.species (if regulatory_package not available)
  const pd = pricePreviewData.value
  if (!pd) return map
  if (Array.isArray(pd.species)) {
    pd.species.forEach((sp: any) => {
      const id = sp.item_id || sp.id
      const qty = Number(sp.quantity) || 0
      if (id && qty > 0) map.set(Number(id), qty)
    })
  }
  return map
})

// TROPHY items that are customized (from other packages):
// An item is customized if ANY of:
//   a) Its pricing-item ID is explicitly tracked (added via Customized section this session)
//   b) Its item_id is NOT in the base package at all (auto-detected)
//   c) Its item_id IS in base but appears more than once → regulatory overflow (extra occurrences)
const customizedSavedItems = computed(() => {
  const trophies = (existingPricing.value?.items_by_type?.TROPHY || [])
    .filter((item: any) => !localDeletedItemIds.value.has(item.id))
  const baseTrophyIds = basePackageTrophyItemIds.value
  const trackedIds = customItemIds.value

  // If no preview data yet and no tracked IDs, don't split
  if (baseTrophyIds.size === 0 && trackedIds.size === 0) return []

  // Helper: try to resolve source package name from cache when not stored
  const resolvePackageName = (speciesItemId: number): string => {
    const cache = packageItemsCache.value
    for (const [pkgId, items] of Object.entries(cache)) {
      if (Array.isArray(items) && items.some((it: any) => it.id === speciesItemId)) {
        const pkg = allPackagesList.value.find((p: any) => p.id === Number(pkgId))
        return pkg?.name || ''
      }
    }
    return ''
  }

  // First pass: explicitly tracked items are always customized
  // Second pass: auto-detect non-base and regulatory overflow
  const seenBaseItemIds = new Set<number>()
  const customized: any[] = []
  const customizedPricingIds = new Set<number>()

  for (const item of trophies) {
    const itemId = Number(item.item_id)
    const pricingId = Number(item.id)

    // Explicitly tracked → always customized (with source package from storage)
    if (trackedIds.has(pricingId)) {
      const meta = trackedIds.get(pricingId)
      let pkgName = meta?.packageName || ''
      // Fallback: try to resolve from cache if package name is missing (legacy data)
      if (!pkgName && itemId) pkgName = resolvePackageName(itemId)
      // Backfill storage so it persists next time
      if (pkgName && (!meta?.packageName)) {
        customItemIds.value.set(pricingId, { packageName: pkgName })
        persistCustomItemIds()
      }
      customized.push({ ...item, _originalType: 'TROPHY', _sourcePackage: pkgName })
      customizedPricingIds.add(pricingId)
      continue
    }

    if (!itemId) continue

    if (baseTrophyIds.size > 0 && !baseTrophyIds.has(itemId) && item.amount_source === 'CUSTOMIZED') {
      // item_id not in base package AND explicitly marked as customized → customized
      const pkgName = resolvePackageName(itemId)
      customized.push({ ...item, _originalType: 'TROPHY', _sourcePackage: pkgName })
      customizedPricingIds.add(pricingId)
    } else if (baseTrophyIds.size > 0 && seenBaseItemIds.has(itemId)) {
      // Duplicate of base-package species → regulatory overflow → customized
      const pkgName = resolvePackageName(itemId)
      customized.push({ ...item, _originalType: 'TROPHY', _sourcePackage: pkgName })
      customizedPricingIds.add(pricingId)
    } else {
      // First occurrence of base-package species → regular
      seenBaseItemIds.add(itemId)
    }
  }

  return customized
})

// Set of customized trophy pricing-item IDs for fast lookup
const customizedItemIdSet = computed(() => {
  return new Set(customizedSavedItems.value.map((it: any) => it.id))
})

// Get the regulatory licence quantity for a species from the base package
const getSpeciesLicenceQty = (itemId: number | undefined): number => {
  if (!itemId) return 0
  return baseSpeciesQtyMap.value.get(Number(itemId)) || 0
}

const existingItemsByType = computed(() => {
  const itemsByType = existingPricing.value?.items_by_type || {}
  const customIds = customizedItemIdSet.value
  const deletedIds = localDeletedItemIds.value
  const result: Record<string, any[]> = {}
  
  for (const [type, items] of Object.entries(itemsByType)) {
    if (!Array.isArray(items) || items.length === 0) continue
    let filtered = items as any[]
    // Exclude locally-deleted items (edit mode)
    if (deletedIds.size > 0) {
      filtered = filtered.filter((item: any) => !deletedIds.has(item.id))
    }
    // For TROPHY only, filter out customized items (extras always stay in regular)
    if (type === 'TROPHY' && customIds.size > 0) {
      filtered = filtered.filter((item: any) => !customIds.has(item.id))
    }
    if (filtered.length > 0) {
      result[type] = filtered
    }
  }

  // Merge locally-added items (edit mode) into their respective type groups
  for (const item of localAddedItems.value) {
    const type = item.item_type || 'EXTRA'
    if (!result[type]) result[type] = []
    result[type].push(item)
  }
  
  return result
})

// Totals for the existing (saved) pricing in edit mode
const existingItemsCount = computed(() => {
  let count = 0
  for (const items of Object.values(existingItemsByType.value)) {
    count += (items as any[]).length
  }
  count += allCustomizedItems.value.length
  return count
})

const existingGrandTotal = computed(() => {
  let total = 0
  for (const items of Object.values(existingItemsByType.value)) {
    for (const item of items as any[]) {
      total += Number(item.total_amount) || 0
    }
  }
  for (const item of allCustomizedItems.value) {
    total += Number(item.total_amount || item.total) || 0
  }
  return total
})

// Get item type label for display
const getItemTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'PACKAGE': 'Package',
    'TROPHY': 'Trophy Fees',
    'EXTRA': 'Safari Extras & Daily Rate',
    'LOGISTICS': 'Companion Hunters',
    'ADJUSTMENT': 'Adjustments',
  }
  return labels[type] || type
}

// Get items from enquiry preferences that haven't been added yet
const enquirySpecies = computed(() => {
  const prefs = enquiryData.value?.species_preferences || enquiryData.value?.item_preferences || []
  const existingTrophies = existingPricing.value?.items_by_type?.TROPHY || []
  // Exclude locally-deleted items so they reappear as available
  const deletedIds = localDeletedItemIds.value
  const activeTrophies = deletedIds.size > 0
    ? existingTrophies.filter((t: any) => !deletedIds.has(t.id))
    : existingTrophies
  const existingItemIds = new Set(activeTrophies.map((t: any) => t.item_id))
  
  // Filter out already added species
  return prefs.filter((sp: any) => !existingItemIds.has(sp.item_id))
})

const enquirySafariExtras = computed(() => {
  const prefs = enquiryData.value?.safari_extras_preferences || enquiryData.value?.safari_extras || []
  const existingExtras = existingPricing.value?.items_by_type?.EXTRA || []
  // Exclude locally-deleted items so they reappear as available
  const deletedIds = localDeletedItemIds.value
  const activeExtras = deletedIds.size > 0
    ? existingExtras.filter((e: any) => !deletedIds.has(e.id))
    : existingExtras
  const existingItemIds = new Set(activeExtras.map((e: any) => e.item_id))
  
  // Filter out already added extras
  return prefs.filter((extra: any) => !existingItemIds.has(extra.item_id))
})

const enquiryParticipants = computed(() => {
  const pref = enquiryData.value?.hunter_preferences || enquiryData.value?.preference
  if (!pref) return []
  
  // Check if participants already added (excluding locally-deleted items)
  const existingLogistics = existingPricing.value?.items_by_type?.LOGISTICS || []
  const deletedIds = localDeletedItemIds.value
  const activeLogistics = deletedIds.size > 0
    ? existingLogistics.filter((l: any) => !deletedIds.has(l.id))
    : existingLogistics
  const hasParticipants = activeLogistics.length > 0 || activeLogistics.some((l: any) => {
    const desc = String(l.description || l.item_name || '').toLowerCase()
    return desc.includes('participant') || desc.includes('companion') || desc.includes('observer')
  })
  
  if (hasParticipants) return []
  
  const participants = []
  
  // Handle general participants
  if (pref.no_of_participants > 0) {
    participants.push({
      type: 'COMPANION',
      count: pref.no_of_participants,
      label: `Companion Hunters (${pref.no_of_participants})`,
    })
  }
  
  // Handle companions
  if (pref.no_of_companions > 0) {
    participants.push({
      type: 'COMPANION',
      count: pref.no_of_companions,
      label: `Companion Hunters (${pref.no_of_companions})`,
    })
  }
  
  // Handle observers
  if (pref.no_of_observers > 0) {
    participants.push({
      type: 'OBSERVER',
      count: pref.no_of_observers,
      label: `Observers (${pref.no_of_observers})`,
    })
  }
  
  return participants
})

// --- Steps & status helpers (auto + manual) ---
const speciesStepStatuses = computed(() => {
  const prefs = enquiryData.value?.species_preferences || enquiryData.value?.item_preferences || []
  return (prefs || []).map((sp: any) => {
    const id = sp.item_id || sp.species_id || sp.id
    const name = sp.species_name || sp.item_name || sp.name || ''
    const requestedQty = Number(sp.desired_quantity || sp.quantity || sp.desired_quantity || 1)
    const licenceQty = getSpeciesLicenceQty(id)
    const overflow = licenceQty > 0 && requestedQty > licenceQty ? requestedQty - licenceQty : 0
    const candidates = allPackagesList.value.filter((pkg: any) => {
      if (!pkg.regulatory_package) return false
      return (pkg.regulatory_package.species_by_category || []).some((cat: any) => (cat.species || []).some((s: any) => Number(s.id) === Number(id)))
    })
    return { id, name, requestedQty, licenceQty, overflow, allocatable: candidates.length > 0, candidateCount: candidates.length }
  })
})

const quotationAutoSteps = computed(() => {
  const overCount = speciesStepStatuses.value.filter((s: any) => s.overflow > 0).length
  return [
    'Validate enquiry fields (season, area, participants).',
    'Load package & regulatory quotas (licence limits).',
    `Validate species quantities against licences${overCount ? ' — ' + overCount + ' exceed limit' : ''}.`,
    'Detect regulatory overflow and suggest allocations to other licences (when available).',
    'Create quotation with final split line items on server.'
  ]
})

const quotationManualSteps = computed(() => [
  'Edit quantities directly in the Items table.',
  'Add species / trophy fees or safari extras using the Add buttons or custom rows.',
  'Manually add/assign overflow to other licences using Customized Package or Custom Rows.',
  'Proceed anyway to save despite regulatory warnings (may incur fines).'
])

const allocationCandidateCount = (speciesId: number) => {
  return allPackagesList.value.filter((pkg: any) => {
    if (!pkg.regulatory_package) return false
    return (pkg.regulatory_package.species_by_category || []).some((cat: any) => (cat.species || []).some((s: any) => Number(s.id) === Number(speciesId)))
  }).length
}

const allocationCandidatesForSpecies = (speciesId: number) => {
  return allPackagesList.value.filter((pkg: any) => {
    if (!pkg.regulatory_package) return false
    return (pkg.regulatory_package.species_by_category || []).some((cat: any) => (cat.species || []).some((s: any) => Number(s.id) === Number(speciesId)))
  })
}

const allocationAssignedTotal = (alloc: any) => {
  const arr = alloc.userAllocations || alloc.suggested || alloc.candidates || []
  return arr.reduce((s: number, a: any) => s + Number(a.allocatedQty || 0), 0)
}

const fillSuggestedAlloc = (alloc: any) => {
  alloc.userAllocations = (alloc.suggested && alloc.suggested.length) ? alloc.suggested.map((s: any) => ({ ...s })) : (alloc.candidates || []).map((c: any) => ({ ...c, allocatedQty: 0 }))
}

// Check if hunting days need to be added
const needsHuntingDays = computed(() => {
  const existingExtras = existingPricing.value?.items_by_type?.EXTRA || []
  const existingPackageItems = existingPricing.value?.items_by_type?.PACKAGE || []
  const deletedIds = localDeletedItemIds.value
  const activeExtras = deletedIds.size > 0
    ? existingExtras.filter((e: any) => !deletedIds.has(e.id))
    : existingExtras
  const activePackageItems = deletedIds.size > 0
    ? existingPackageItems.filter((p: any) => !deletedIds.has(p.id))
    : existingPackageItems
  const hasHuntingDays = activeExtras.some((e: any) => 
    e.description?.toLowerCase().includes('hunting days') || 
    e.description?.toLowerCase().includes('daily rate')
  ) || activePackageItems.length > 0
  return !hasHuntingDays
})

const durationRelevantByNameLocal = (name: string | undefined) => {
  if (!name) return false
  const n = name.toLowerCase()
  if (n.includes('additional gun permit') || n.includes('gun permit') || n.includes('ammo')) return false
  if (n.includes('per day') || n.includes('perday')) return true
  if (n.includes('firearm') || n.includes('baiting') || n.includes('photographic') || n.includes('camera') || n.includes('cameraman') || n.includes('observer')) return true
  return false
}

const availablePriceableItems = computed(() => {
  const items = []

  // Add hunting days as a package subtype if not already added
  const hunterPref = enquiryData.value?.hunter_preferences || enquiryData.value?.preference
  const packageDetail = pricePreviewData.value?.price_structure_detail || existingPricing.value?.price_structure_detail
  const noOfDays = packageDetail?.hunt_length_days || hunterPref?.no_of_days
  if (needsHuntingDays.value && noOfDays && noOfDays > 0) {
    const packageAmount = parseFloat(packageDetail?.amount) || 0
    items.push({
      category: 'Package',
      items: [{
        id: 'hunting_days',
        name: `Hunting Days (${noOfDays} days)`,
        code: '',
        quantity: 1, // Quantity is 1 because package amount is for ALL days
        type: 'PACKAGE',
        suggested_price: packageAmount, // This is the TOTAL package amount, not per-day
      }]
    })
  }

  // Add species from enquiry preferences (TROPHY fees)
  if (enquirySpecies.value.length > 0) {
    items.push({
      category: 'Species (Trophy Fees)',
      items: enquirySpecies.value.map((sp: any) => {
        const trophyFee = pricePreviewData.value?.trophy_fees?.find(
          (tf: any) => tf.item_id === sp.item_id || tf.species_id === sp.item_id
        )
        const regQty = baseSpeciesQtyMap.value.get(Number(sp.item_id)) || 0
        return {
          id: sp.item_id,
          name: cleanItemName(sp.item_name || sp.species_name || 'Unknown Species'),
          code: '',
          quantity: sp.desired_quantity || 1,
          type: 'TROPHY',
          suggested_price: parseFloat(trophyFee?.amount) || 0,
          priority: sp.priority || 'NICE_TO_HAVE',
          regulatory_qty: regQty,
        }
      })
    })
  }

  // Add safari extras from enquiry
  if (enquirySafariExtras.value.length > 0) {
    items.push({
      category: 'Safari Extras',
      items: enquirySafariExtras.value.map((extra: any, idx: number) => {
        const safariExtra = pricePreviewData.value?.safari_extras?.find(
          (se: any) => se.id === extra.item_id || se.item_id === extra.item_id || se.safari_extra_id === extra.item_id
        )
        const itemName = cleanItemName(extra.item_name || 'Extra')

        // Default duration to enquiry hunting length for per-day items when not explicitly set
        const rawDuration = extra.item_durations
        let duration = (rawDuration != null && Number(rawDuration) > 0) ? Number(rawDuration) : null
        if (duration == null) {
          const isByDay = durationRelevantByNameLocal(itemName)
            || String(safariExtra?.pricing_unit || '').toLowerCase().includes('per_day')
            || itemName.toLowerCase().includes('per day')
            || itemName.toLowerCase().includes('perday')
          if (isByDay && enquiryDays.value) {
            duration = enquiryDays.value
          }
        }

        // Use a unique composite id so duplicate extras (same item_id, different qty/duration)
        // each get their own key in selectedItems / itemPrices
        return {
          id: `extra_${extra.item_id}_${idx}`,
          _realItemId: extra.item_id,
          name: itemName,
          code: '',
          quantity: extra.desired_quantity || 1,
          type: 'EXTRA',
          suggested_price: parseFloat(safariExtra?.amount) || 0,
          item_durations: duration,
        }
      })
    })
  }

  // Add participants as LOGISTICS costs
  if (enquiryParticipants.value.length > 0) {
    items.push({
      category: 'Companion Hunters',
      items: enquiryParticipants.value.map((part: any) => {
        let cost = 0
        if (part.type === 'COMPANION') {
          cost = parseFloat(pricePreviewData.value?.companion_costs?.[0]?.amount) || 0
        } else if (part.type === 'OBSERVER') {
          cost = parseFloat(pricePreviewData.value?.observer_costs?.[0]?.amount) || 0
        }
        return {
          id: `participant_${part.type}`,
          name: part.label,
          code: '',
          quantity: part.count,
          type: 'LOGISTICS',
          suggested_price: cost,
        }
      })
    })
  }

  return items
})

const enquiryPackageName = computed(() => {
  return pricePreviewData.value?.price_structure_detail?.name ||
    existingPricing.value?.price_structure_detail?.name ||
    enquiryData.value?.price_structure_detail?.name ||
    enquiryData.value?.package_name || 'N/A'
})

const enquiryHuntingType = computed(() => {
  return pricePreviewData.value?.price_structure_detail?.hunting_type ||
    existingPricing.value?.price_structure_detail?.hunting_type?.name ||
    enquiryData.value?.hunting_type_name ||
    enquiryData.value?.hunting_type || 'N/A'
})

const enquiryCurrency = computed(() => {
  return existingPricing.value?.currency?.code || 
         existingPricing.value?.currency?.name ||
         pricePreviewData.value?.price_structure_detail?.currency_code ||
         enquiryData.value?.currency ||
         enquiryData.value?.currency_code || 'USD'
})

const currencySymbol = computed(() => {
  return existingPricing.value?.currency?.symbol ||
    pricePreviewData.value?.price_structure_detail?.currency_code ||
    enquiryData.value?.currency_symbol ||
    '$'
})

const enquiryDays = computed(() => {
  const packageDetail = pricePreviewData.value?.price_structure_detail || existingPricing.value?.price_structure_detail
  const hunterPref = enquiryData.value?.hunter_preferences || enquiryData.value?.preference
  const days = packageDetail?.hunt_length_days
    || hunterPref?.no_of_days
    || packageDetail?.no_of_days
    || null
  return typeof days === 'number' && days > 0 ? days : (Number(days) > 0 ? Number(days) : null)
})

// Display-only version for the UI
const enquiryDaysDisplay = computed(() => {
  return enquiryDays.value != null ? `${enquiryDays.value} days` : 'N/A'
})

const selectedItemsCount = computed(() => {
  return Object.values(selectedItems.value).filter(v => v).length
})

const quotationTotal = computed(() => {
  let total = 0
  for (const key in selectedItems.value) {
    if (selectedItems.value[key] && itemPrices.value[key]) {
      total += itemPrices.value[key].total_amount || 0
    }
  }
  return total
})

// Helper: get the live total for an item (uses edited itemPrices when selected, otherwise suggested)
const getLiveItemTotal = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (selectedItems.value[key] && itemPrices.value[key]) {
    return itemPrices.value[key].total_amount || 0
  }
  // Fallback to suggested price calculation
  const qty = item.quantity || 1
  const price = item.suggested_price || 0
  const duration = (category === 'Safari Extras' && item.item_durations) ? item.item_durations : 1
  return qty * price * duration
}

// Auto-calculated totals from all enquiry items (for create mode summary)
// These use live edited values so the summary card stays in sync with the items table
const enquiryTotalItems = computed(() => {
  return availablePriceableItems.value.reduce((sum: number, cat: any) => sum + cat.items.length, 0) + allCustomizedItems.value.length
})

const enquiryTrophyTotal = computed(() => {
  const trophyCat = availablePriceableItems.value.find((c: any) => c.category === 'Species (Trophy Fees)')
  let total = trophyCat ? trophyCat.items.reduce((sum: number, item: any) => {
    return sum + getLiveItemTotal('Species (Trophy Fees)', item)
  }, 0) : 0
  // Customized items are trophy species — include them
  for (const item of allCustomizedItems.value) {
    total += Number(item.total_amount || item.total || 0)
  }
  return total
})

const enquiryExtrasTotal = computed(() => {
  const extrasCat = availablePriceableItems.value.find((c: any) => c.category === 'Safari Extras')
  if (!extrasCat) return 0
  return extrasCat.items.reduce((sum: number, item: any) => {
    return sum + getLiveItemTotal('Safari Extras', item)
  }, 0)
})

const enquiryGrandTotal = computed(() => {
  let total = 0
  for (const cat of availablePriceableItems.value) {
    for (const item of cat.items) {
      total += getLiveItemTotal(cat.category, item)
    }
  }
  // Include customized package items in the grand total
  for (const item of allCustomizedItems.value) {
    total += Number(item.total_amount || item.total || 0)
  }
  return total
})

// Methods
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

const formatDate = (dateValue?: string) => {
  if (!dateValue) return 'N/A'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString()
}

const downloadQuotationPdf = async () => {
  const pricingId = existingPricing.value?.id || pricingIdFromRoute.value
  if (!pricingId) return

  printingPdf.value = true
  try {
    await downloadQuotationPdfService(pricingId)
  } catch (error) {
    Swal.fire('Error', 'Failed to download quotation PDF', 'error')
  } finally {
    printingPdf.value = false
  }
}

const cleanItemName = (name: string) => {
  if (!name) return name
  // Remove patterns like (SPC-002), (EXT-...), etc.
  return name.replace(/\s*\([A-Z]+-[A-Z0-9-]+\)\s*/g, '').trim()
}

const formatItemType = (type: string) => {
  const types: Record<string, string> = {
    PACKAGE: 'Hunting Package',
    TROPHY: 'Trophy Fee',
    EXTRA: 'Safari Extra',
    LOGISTICS: 'Accommodation & Transport',
    ADJUSTMENT: 'Price Adjustment',
  }
  return types[type] || type
}

const getItemTypeBadgeClass = (type: string) => {
  const classes: Record<string, string> = {
    PACKAGE: 'bg-primary',
    TROPHY: 'bg-warning text-dark',
    EXTRA: 'bg-info',
    LOGISTICS: 'bg-secondary',
    ADJUSTMENT: 'bg-danger',
  }
  return classes[type] || 'bg-secondary'
}

const formatPriority = (priority: string) => {
  const priorities: Record<string, string> = {
    MUST_HAVE: 'Must Have',
    NICE_TO_HAVE: 'Nice to Have',
  }
  return priorities[priority] || priority
}

const ensureItemPrice = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (!itemPrices.value[key]) {
    const unitAmount = Number(item?.suggested_price) || 0
    const quantity = Number(item?.quantity) || 1
    const duration = item?.item_durations ?? null

    // Calculate initial total (factor in duration for Safari Extras)
    const daysMultiplier = (category === 'Safari Extras' && duration != null) ? duration : 1

    // Resolve the real numeric item_id (_realItemId for extras with composite unique id)
    const resolvedItemId = item?._realItemId ?? (typeof (item?.id) === 'string' ? null : item?.id)
    
    itemPrices.value[key] = {
      item_type: item?.type || 'ADJUSTMENT',
      item_id: resolvedItemId,
      description: item?.name || '',
      quantity,
      unit_amount: unitAmount,
      total_amount: quantity * unitAmount * daysMultiplier,
      rate_direction: 'INCREASE',
      amount_source: 'SYSTEM',
      is_estimate: false,
      is_optional: false,
      item_durations: duration,
    }
  }
  return itemPrices.value[key]
}

// Compute the effective duration to display for an item (explicit or inherited)
const computeEffectiveDuration = (item: any) => {
  if (!item) return null
  if (!isDurationRelevantForItem(item)) return null
  const raw = item?.item_durations
  const n = (raw != null && Number(raw) > 0) ? Number(raw) : null
  if (n != null) return n
  // Fallback to enquiry days when available
  return enquiryDays.value ?? null
}

// Returns true when an item should have a duration (per day/per person style)
const isDurationRelevantForItem = (item: any) => {
  if (!item) return false
  const name = String(item?.name || item?.description || '').toLowerCase()
  const pricingUnit = String(item?.pricing_unit || '').toLowerCase()
  if (name.includes('additional gun permit') || name.includes('gun permit') || name.includes('ammo')) return false
  if (name.includes('per day') || name.includes('perday')) return true
  if (pricingUnit.includes('per_day')) return true
  if (name.includes('firearm') || name.includes('baiting') || name.includes('photographic') || name.includes('camera') || name.includes('cameraman') || name.includes('observer')) return true
  return false
}

const categoryHasDuration = (category: any) => {
  if (!category || !Array.isArray(category.items)) return false
  return category.items.some((it: any) => isDurationRelevantForItem(it))
}

const initializeItemPrice = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (selectedItems.value[key]) {
    // ensure it exists (keeps previous behaviour but uses ensure helper)
    ensureItemPrice(category, item)
  }
}

const updateItemTotal = (category: string, itemId: any) => {
  const key = `${category}_${itemId}`
  if (itemPrices.value[key]) {
    const qty = itemPrices.value[key].quantity || 1
    const unit = itemPrices.value[key].unit_amount || 0
    // If this is an EXTRA, consider duration override for client-side total preview
    if (itemPrices.value[key].item_type === 'EXTRA') {
      const desc = itemPrices.value[key].description || ''
      const pricingUnit = itemPrices.value[key].pricing_unit || ''
      const shouldMultiply = durationRelevantByNameLocal(desc) || (String(pricingUnit).toLowerCase().includes('per_day'))
      const days = shouldMultiply ? (itemPrices.value[key].item_durations ?? enquiryDays.value ?? 1) : 1
      itemPrices.value[key].total_amount = (unit || 0) * qty * days
    } else {
      itemPrices.value[key].total_amount = qty * unit
    }
  }
}

// Handle duration input for add-items table
const handleInitItemDuration = (e: any, category: string, itemId: any) => {
  const key = `${category}_${itemId}`
  if (!itemPrices.value[key]) return
  const v = e.target.value
  if (v === '' || v === null) {
    itemPrices.value[key].item_durations = null
  } else {
    const n = Math.floor(Number(v) || 0)
    itemPrices.value[key].item_durations = n >= 1 ? n : 1
  }
  updateItemTotal(category, itemId)
}

// Debounced server-side pricing recalculation when item overrides or hunt length change
let pricingRecalcTimeout: any = null

// Compute a client-side preview for pricing changes (non-destructive)
const computeLocalPricingPreview = (overrides: any[]) => {
  // Return a summary object: { total, items: [{...}] }
  const preview = { total_amount: 0, items: [] as any[] }
  overrides.forEach((p: any) => {
    const qty = Number(p.quantity) || 1
    const unit = Number(p.unit_amount) || 0
    // Determine days multiplier (if an EXTRA)
    let days = 1
    if (p.item_durations != null && p.item_durations !== '') days = Number(p.item_durations)
    else {
      // try to find the source item to infer effective duration
      const srcCat = availablePriceableItems.value.find((c: any) => c.category === p.description?.category)
      // p may not carry the category; best-effort: no change
    }
    const itemTotal = (p.item_type === 'EXTRA') ? unit * qty * days : unit * qty
    preview.items.push({ ...p, item_total: itemTotal })
    preview.total_amount += itemTotal
  })
  return preview
}

// Helper to perform the actual pricing update to the server (used only for persistent updates).
// If replaceItems is true we will send an empty items array (intentional user action) and
// include the `replace_items: true` flag so the backend can differentiate intent.
const performPricingRecalc = async (replaceItems = false, persist = true) => {
  if (!existingPricing.value || !existingPricing.value.id) return

  try {
    const items: any[] = []
    for (const key in itemPrices.value) {
      const p = itemPrices.value[key]

      // Ensure we always send a non-empty description (backend requires it)
      let description = p.description && String(p.description).trim() ? p.description : null
      if (!description) {
        // Try to find a friendly name from the available items list
        const parts = key.split('_')
        const categoryName = parts.slice(0, parts.length - 1).join('_')
        const id = parts[parts.length - 1]
        const cat = availablePriceableItems.value.find((c: any) => c.category === categoryName)
        const srcItem = cat?.items?.find((it: any) => String(it.id) === String(id))
        description = (srcItem?.name && String(srcItem.name).trim()) || `${p.item_type || 'Item'}`
      }

      items.push({
        item_type: p.item_type,
        item_id: p.item_id,
        description,
        quantity: p.quantity,
        unit_amount: p.unit_amount,
        ...(p.item_durations != null ? { item_durations: p.item_durations } : {})
      })
    }

    const payload: any = { items }
    if (replaceItems) payload.replace_items = true

    if (!persist) {
      // Non-persistent preview: compute locally and set preview object
      const preview = computeLocalPricingPreview(items)
      previewPricing.value = preview
      // Also set a temporary client-side itemPrices totals so UI shows updated totals while previewing
      preview.items.forEach((pi: any) => {
        // find matching key in itemPrices and update total_amount if present
        for (const key in itemPrices.value) {
          const p = itemPrices.value[key]
          if (p.item_id === pi.item_id && p.item_type === pi.item_type) {
            p.total_amount = pi.item_total
          }
        }
      })
      return preview
    }

    // Persisting: update server and reload
    const response = await salesEnquiryService.updatePricing(existingPricing.value.id, payload)
    if (response?.success && response.data) {
      existingPricing.value = response.data
      // reload the fresh pricing data
      await loadPricing()
      previewPricing.value = null
    }
  } catch (err) {
    console.error('Error recalculating pricing:', err)
  }
}

const schedulePricingRecalc = (force = false) => {
  if (pricingRecalcTimeout) clearTimeout(pricingRecalcTimeout)

  // Do not trigger recalculation during initial load unless forced explicitly.
  if (!initialLoadComplete.value && !force) return

  // If there are no item overrides present, do not trigger a server-side recalculation.
  // This prevents accidental clearing of an existing quotation when the component first loads
  if (Object.keys(itemPrices.value).length === 0) return

  // Compute a non-destructive preview (client-side) to avoid replacing existing pricing while the user is selecting items
  pricingRecalcTimeout = setTimeout(() => performPricingRecalc(false, false), 600)
} 

// Watch item price overrides and enquiry days to trigger server recalculation
watch(itemPrices, () => {
  // When the user is making changes to item overrides, compute a non-destructive preview rather than persisting immediately
  schedulePricingRecalc()
}, { deep: true })

watch(() => enquiryDays.value, () => {
  schedulePricingRecalc()
})

const toggleCategorySelection = (category: any) => {
  const isSelected = isCategorySelected(category)
  category.items.forEach((item: any) => {
    const key = `${category.category}_${item.id}`
    selectedItems.value[key] = !isSelected
    if (!isSelected) {
      initializeItemPrice(category.category, item)
    }
  })
}

const isCategorySelected = (category: any) => {
  return category.items.every((item: any) => {
    const key = `${category.category}_${item.id}`
    return selectedItems.value[key]
  })
}

const selectAllSystemItems = async () => {
  // Select all system items first
  availablePriceableItems.value.forEach((category: any) => {
    category.items.forEach((item: any) => {
      const key = `${category.category}_${item.id}`
      if (!selectedItems.value[key]) {
        selectedItems.value[key] = true
        initializeItemPrice(category.category, item)
      }
    })
  })

  // ── Regulatory-aware auto-split ──
  // Collect TROPHY items that exceed their regulatory licence limits
  const overflowSpecies: { item: any; category: string; key: string; requested: number; limit: number }[] = []
  availablePriceableItems.value.forEach((category: any) => {
    category.items.forEach((item: any) => {
      if (item.type !== 'TROPHY' || !item.regulatory_qty || item.regulatory_qty <= 0) return
      const key = `${category.category}_${item.id}`
      const price = itemPrices.value[key]
      const qty = price?.quantity ?? item.quantity ?? 1
      if (qty > item.regulatory_qty) {
        overflowSpecies.push({ item, category: category.category, key, requested: qty, limit: item.regulatory_qty })
      }
    })
  })

  if (overflowSpecies.length === 0) return // All within limits — nothing to split

  // Build temporary item array for the overflow species only (to pass to assignExcessSpecies)
  const itemsToSplit = overflowSpecies.map(os => {
    const price = itemPrices.value[os.key]
    return {
      item_type: 'TROPHY',
      item_id: os.item.id,
      description: price?.description || os.item.name || '',
      quantity: os.requested,
      unit_amount: price?.unit_amount ?? os.item.suggested_price ?? 0,
      total_amount: (price?.unit_amount ?? os.item.suggested_price ?? 0) * os.requested,
      rate_direction: 'INCREASE',
      amount_source: 'SYSTEM',
      is_estimate: false,
      is_optional: false,
    }
  })

  // Run the splitting algorithm (may involve async package-item lookups)
  const { items: splitItems, pending } = await assignExcessSpecies(itemsToSplit)

  // Apply the split back:
  // 1. Cap original items to their licence limit
  // 2. Add Customized / Pending lines to localSavedCustomItems
  const summaryLines: string[] = []

  for (const os of overflowSpecies) {
    const price = itemPrices.value[os.key]
    if (price) {
      price.quantity = os.limit
      price._isOriginal = true
      price.total_amount = os.limit * (price.unit_amount || 0)
    }
  }

  // Collect customized & pending lines produced by the splitter
  for (const si of splitItems) {
    if (si._isOriginal) continue // already handled above (capped in itemPrices)

    if (si._isCustomized || si.amount_source === 'CUSTOMIZED') {
      const pkgName = si.source_package || ''
      localSavedCustomItems.value.push({
        _uid: ++customRowUid,
        _isLocal: true,
        _sourcePackage: pkgName,
        item_type: 'TROPHY',
        item_id: si.item_id,
        item_name: si.description?.replace(/\s*\(Licence:.*?\)\s*/, '') || '',
        description: si.description || '',
        quantity: si.quantity || 1,
        unit_amount: si.unit_amount || 0,
        unitPrice: si.unit_amount || 0,
        total_amount: si.total_amount || 0,
        total: si.total_amount || 0,
        is_optional: !!si.is_optional,
        source_package_id: si.source_package_id || null,
        amount_source: 'CUSTOMIZED',
      })
      summaryLines.push(`<li><strong>${si.description}</strong>: ${si.quantity} → <span class="badge bg-secondary">Customized</span> (${pkgName})</li>`)
    } else if (si._pending_regulatory || si.amount_source === 'PENDING_REGULATORY' || si.pending_licence) {
      localSavedCustomItems.value.push({
        _uid: ++customRowUid,
        _isLocal: true,
        _sourcePackage: '',
        item_type: 'TROPHY',
        item_id: si.item_id,
        item_name: si.description?.replace(/\s*\(Pending.*?\)\s*/, '') || '',
        description: si.description || '',
        quantity: si.quantity || 1,
        unit_amount: si.unit_amount || 0,
        unitPrice: si.unit_amount || 0,
        total_amount: si.total_amount || 0,
        total: si.total_amount || 0,
        is_optional: true,
        amount_source: 'PENDING_REGULATORY',
        pending_licence: true,
      })
      summaryLines.push(`<li><strong>${si.description}</strong>: ${si.quantity} → <span class="badge bg-warning text-dark">Pending Licence</span></li>`)
    }
  }

  // Show summary dialog
  const cappedLines = overflowSpecies.map(os =>
    `<li><strong>${os.item.name}</strong>: qty ${os.requested} capped to <strong>${os.limit}</strong> (licence limit)</li>`
  )

  await Swal.fire({
    title: '<i class="fa fa-id-card-o text-info"></i> Regulatory Auto-Split Applied',
    html: `
      <p>Some species exceeded their regulatory licence limits and have been <strong>automatically split</strong>:</p>
      <h6 class="text-start mt-3 mb-1">Capped Original Items:</h6>
      <ul class="text-start mb-2">${cappedLines.join('')}</ul>
      ${summaryLines.length > 0 ? `<h6 class="text-start mt-2 mb-1">Split Lines Created:</h6><ul class="text-start mb-2">${summaryLines.join('')}</ul>` : ''}
      ${pending.length > 0 ? `<div class="alert alert-warning text-start mt-2 mb-0"><i class="fa fa-exclamation-triangle me-1"></i> <strong>${pending.length} species</strong> have remaining quantity that could not be allocated to any available licence. These are marked as <strong>Pending Licence</strong> (optional) and will not block quotation creation.</div>` : ''}
    `,
    icon: 'info',
    confirmButtonText: 'OK, Continue',
    width: 600,
  })
}

const clearSelection = async () => {
  // Confirm with the user before performing a destructive server-side clear of overrides
  const result = await Swal.fire({
    title: 'Clear Overrides?',
    text: 'This will clear all item price overrides in the UI. Do you also want to replace the server-side pricing items with an empty set? (This action cannot be undone)',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Clear on server',
    cancelButtonText: 'Only clear locally',
  })

  // Always clear locally
  selectedItems.value = {}
  itemPrices.value = {}
  discountItems.value = {}

  if (result.isConfirmed) {
    // Send explicit replace request to backend so it knows this was an intentional user action
    await performPricingRecalc(true)
  }
} 

const removeItem = async (item: any) => {
  const result = await Swal.fire({
    title: 'Remove Item?',
    text: `Are you sure you want to remove "${item.item_name || item.description}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, remove it',
  })
  
  if (result.isConfirmed) {
    // --- Edit mode: track deletion locally (don't touch the server) ---
    if (!isCreateMode.value) {
      // Check if this is a locally-added item first
      const localIdx = localAddedItems.value.findIndex((li: any) => li._localId === item._localId && item._localId)
      if (localIdx !== -1) {
        localAddedItems.value.splice(localIdx, 1)
      } else {
        localDeletedItemIds.value.add(item.id)
      }
      removeCustomItemId(item.id)
      Swal.fire({ title: 'Removed!', text: 'Item marked for removal. Click Save Changes to finalize.', icon: 'success', timer: 1500 })
      return
    }

    // --- Create mode: delete directly on the server ---
    removingItem.value = item.id
    try {
      const response = await salesEnquiryService.deletePricingItem(item.id)
      if (response.success) {
        // Remove from custom tracking if applicable
        removeCustomItemId(item.id)
        // Clear custom package cache so duplicate checks refresh
        packageItemsCache.value = {}
        // Reload pricing data
        await loadPricing()
        Swal.fire({
          title: 'Removed!',
          text: 'Item has been removed from the quotation.',
          icon: 'success',
          timer: 1500,
        })
      }
    } catch (error: any) {
      console.error('Error removing item:', error)
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to remove item',
        icon: 'error',
      })
    } finally {
      removingItem.value = null
    }
  }
}

const loadPricePreview = async (priceStructureDetailId: number) => {
  if (!priceStructureDetailId) {
    pricePreviewData.value = null
    return
  }

  loadingPreview.value = true
  try {
    const response = await salesEnquiryService.previewPriceItems(priceStructureDetailId)
    if (response?.success && response?.data) {
      pricePreviewData.value = response.data
    } else if (response?.data) {
      pricePreviewData.value = response.data
    }
  } catch (error) {
    console.error('Error loading price preview:', error)
  } finally {
    loadingPreview.value = false
  }
}

const loadPricing = async () => {
  loadingEnquiry.value = true
  // Mark as not-yet-ready for recalculations
  initialLoadComplete.value = false
  try {
    if (!pricingIdFromRoute.value) {
      // CREATE MODE: Load enquiry data from sessionStorage or fetch from API
      try {
        const cached = sessionStorage.getItem('createQuotationEnquiryData')
        if (cached) {
          const parsedEnquiry = JSON.parse(cached)
          enquiryData.value = {
            ...parsedEnquiry,
            species_preferences: parsedEnquiry.item_preferences || parsedEnquiry.species_preferences || [],
            item_preferences: parsedEnquiry.item_preferences || parsedEnquiry.species_preferences || [],
            safari_extras_preferences: parsedEnquiry.safari_extras || parsedEnquiry.safari_extras_preferences || [],
            safari_extras: parsedEnquiry.safari_extras || parsedEnquiry.safari_extras_preferences || [],
            hunter_preferences: parsedEnquiry.preference || parsedEnquiry.hunter_preferences || {},
            preference: parsedEnquiry.preference || parsedEnquiry.hunter_preferences || {},
          }
          sessionStorage.removeItem('createQuotationEnquiryData')
        } else {
          // Fetch enquiry data from API
          const enquiryResponse = await salesEnquiryService.get(enquiryId.value)
          if (enquiryResponse?.data) {
            const fetched = (enquiryResponse.data as any)?.data || enquiryResponse.data
            enquiryData.value = {
              ...fetched,
              species_preferences: fetched.item_preferences || fetched.species_preferences || [],
              item_preferences: fetched.item_preferences || fetched.species_preferences || [],
              safari_extras_preferences: fetched.safari_extras || fetched.safari_extras_preferences || [],
              safari_extras: fetched.safari_extras || fetched.safari_extras_preferences || [],
              hunter_preferences: fetched.preference || fetched.hunter_preferences || {},
              preference: fetched.preference || fetched.hunter_preferences || {},
            }
          }
        }

        // Load price preview using the enquiry's price structure detail
        const previewId = enquiryData.value?._resolved_price_structure_detail_id
          || enquiryData.value?.price_structure_detail_id
          || enquiryData.value?.price_structure_detail?.id
          || enquiryData.value?.pricings?.[0]?.price_structure_detail_id
        if (previewId) {
          await loadPricePreview(Number(previewId))
        } else {
          console.warn('No price_structure_detail_id found in enquiry data')
        }

        // Load packages list early so regulatory_package data is available for baseSpeciesQtyMap
        await loadCustomPackagesList()

        initialLoadComplete.value = true

        // Auto-select all items & run regulatory auto-split immediately
        // (eliminates the extra "Generate Quotation" click the user had to do)
        await nextTick()      // let computed refs (availablePriceableItems) recompute
        await selectAllSystemItems()
      } catch (error) {
        console.error('Error loading enquiry data for create mode:', error)
        Swal.fire({
          title: 'Error',
          text: 'Failed to load enquiry data',
          icon: 'error',
        }).then(() => goBack())
      } finally {
        loadingEnquiry.value = false
      }
      return
    }
    
    const pricingResponse = await salesEnquiryService.getPricing(pricingIdFromRoute.value)
    
    if (pricingResponse.success && pricingResponse.data) {
      const pricingData = pricingResponse.data
      
      // Set existing pricing with all data
      existingPricing.value = pricingData
      
      // Map enquiry data from pricing response
      enquiryData.value = {
        ...pricingData.enquiry,
        species_preferences: pricingData.enquiry?.species_preferences || [],
        item_preferences: pricingData.enquiry?.species_preferences || [],
        safari_extras_preferences: pricingData.enquiry?.safari_extras_preferences || [],
        safari_extras: pricingData.enquiry?.safari_extras_preferences || [],
        hunter_preferences: pricingData.enquiry?.hunter_preferences || {},
        preference: pricingData.enquiry?.hunter_preferences || {},
      }

      const previewId = pricingData.price_structure_detail_id || pricingData.price_structure_detail?.id
      if (previewId) {
        await loadPricePreview(Number(previewId))
      }

      // Load packages list early so regulatory_package data is available for baseSpeciesQtyMap
      await loadCustomPackagesList()

      // Mark load complete; now user-driven changes can trigger server recalculation
      initialLoadComplete.value = true
    } else {
      throw new Error('Failed to load pricing data')
    }
  } catch (error) {
    console.error('Error loading pricing:', error)
    Swal.fire({
      title: 'Error',
      text: 'Failed to load quotation data',
      icon: 'error',
    }).then(() => {
      goBack()
    })
  } finally {
    loadingEnquiry.value = false
  }
}

const saveQuotation = async () => {
  if (selectedItemsCount.value === 0) {
    Swal.fire({
      title: 'No Items Selected',
      text: 'Please select at least one item to add',
      icon: 'warning',
    })
    return
  }

  if (!existingPricing.value) {
    Swal.fire({
      title: 'Error',
      text: 'No pricing record found.',
      icon: 'error',
    })
    return
  }

  // Regulatory limit advisory (non-blocking — overflow handled via auto-split or customized items)
  const regViolations: string[] = []
  for (const key in selectedItems.value) {
    if (!selectedItems.value[key]) continue
    const price = itemPrices.value[key]
    if (!price || price.item_type !== 'TROPHY') continue
    const itemId = price.item_id
    if (!itemId) continue
    const regLimit = baseSpeciesQtyMap.value.get(Number(itemId)) || 0
    if (regLimit > 0 && (price.quantity || 1) > regLimit) {
      regViolations.push(`<li><strong>${price.description || 'Unknown'}</strong>: qty ${price.quantity} exceeds licence limit of ${regLimit} (exceeded by <strong>${(price.quantity || 1) - regLimit}</strong>)</li>`)
    }
  }
  if (regViolations.length > 0) {
    const confirmed = await Swal.fire({
      title: '<i class="fa fa-exclamation-triangle text-warning"></i> Regulatory Limits Exceeded',
      html: `<p>The following species still exceed their licence limits:</p><ul class="text-start">${regViolations.join('')}</ul><p class="mb-0">Items marked as <strong>Pending Licence</strong> will be saved as optional. Do you want to proceed?</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Save anyway',
      cancelButtonText: 'Go back and adjust',
      width: 550,
    })
    if (!confirmed.isConfirmed) return
  }

  saving.value = true
  try {
    // Collect items to add, ensuring we have backing price objects and descriptions
    const items: any[] = []
    const missingDescriptions: string[] = []

    for (const key in selectedItems.value) {
      if (!selectedItems.value[key]) continue

      let price = itemPrices.value[key]
      if (!price) {
        // Reconstruct from available priceable items
        const parts = key.split('_')
        const categoryName = parts.slice(0, parts.length - 1).join('_')
        const id = parts[parts.length - 1]
        const cat = availablePriceableItems.value.find((c: any) => c.category === categoryName)
        const srcItem = cat?.items?.find((it: any) => String(it.id) === String(id))
        price = ensureItemPrice(categoryName, srcItem || { id, name: '', quantity: 1, suggested_price: 0, type: 'ADJUSTMENT' })
      }

      // Ensure description exists
      if (!price.description || String(price.description).trim() === '') {
        const parts = key.split('_')
        const categoryName = parts.slice(0, parts.length - 1).join('_')
        const id = parts[parts.length - 1]
        const cat = availablePriceableItems.value.find((c: any) => c.category === categoryName)
        const srcItem = cat?.items?.find((it: any) => String(it.id) === String(id))
        price.description = (srcItem?.name && String(srcItem.name).trim()) || `${price.item_type || 'Item'}`
      }

      if (!price.description || String(price.description).trim() === '') {
        missingDescriptions.push(key)
      }

      items.push(price)
    }

    if (missingDescriptions.length > 0) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Some selected items are missing descriptions. Please ensure each item has a description before adding to the quotation.',
        icon: 'warning',
      })
      saving.value = false
      return
    }

    // Add each item individually to the existing pricing record
    const pricingId = existingPricing.value.id
    const addedItems = []
    
    for (const item of items) {
      try {
        const response = await salesEnquiryService.addPricingItem(pricingId, item)
        if (response.success) {
          addedItems.push(response.data)
        }
      } catch (itemError: any) {
        console.error(`Error adding item ${item.description}:`, itemError)
      }
    }

    if (addedItems.length > 0) {
      // Clear selections
      selectedItems.value = {}
      itemPrices.value = {}
      
      // Reload pricing to show new items
      await loadPricing()
      
      Swal.fire({
        title: 'Success!',
        text: `${addedItems.length} item${addedItems.length > 1 ? 's' : ''} added to quotation`,
        icon: 'success',
        timer: 2000,
      })
    } else {
      throw new Error('No items were successfully added')
    }
  } catch (error: any) {
    console.error('Error saving pricing:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || error.message || 'Failed to save quotation',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}

const createPricingWithItems = async () => {
  if (selectedItemsCount.value === 0) {
    Swal.fire({
      title: 'No Items Selected',
      text: 'Please select at least one item to include in the quotation',
      icon: 'warning',
    })
    return
  }

  // Regulatory limit advisory (non-blocking — pending items are handled via auto-split)
  const regViolations: string[] = []
  for (const key in selectedItems.value) {
    if (!selectedItems.value[key]) continue
    const price = itemPrices.value[key]
    if (!price || price.item_type !== 'TROPHY') continue
    const itemId = price.item_id
    if (!itemId) continue
    const regLimit = baseSpeciesQtyMap.value.get(Number(itemId)) || 0
    if (regLimit > 0 && (price.quantity || 1) > regLimit) {
      regViolations.push(`<li><strong>${price.description || 'Unknown'}</strong>: qty ${price.quantity} exceeds licence limit of ${regLimit} (exceeded by <strong>${(price.quantity || 1) - regLimit}</strong>)</li>`)
    }
  }
  if (regViolations.length > 0) {
    const confirmed = await Swal.fire({
      title: '<i class="fa fa-exclamation-triangle text-warning"></i> Regulatory Limits Exceeded',
      html: `<p>The following species still exceed their licence limits:</p><ul class="text-start">${regViolations.join('')}</ul><p class="mb-0">Items marked as <strong>Pending Licence</strong> will be saved as optional. Do you want to proceed?</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Create anyway',
      cancelButtonText: 'Go back and adjust',
      width: 550,
    })
    if (!confirmed.isConfirmed) return
  }

  saving.value = true
  try {
    let items: any[] = []
    for (const key in selectedItems.value) {
      if (!selectedItems.value[key]) continue

      let price = itemPrices.value[key]
      if (!price) {
        const parts = key.split('_')
        const categoryName = parts.slice(0, parts.length - 1).join('_')
        const id = parts[parts.length - 1]
        const cat = availablePriceableItems.value.find((c: any) => c.category === categoryName)
        const srcItem = cat?.items?.find((it: any) => String(it.id) === String(id))
        price = ensureItemPrice(categoryName, srcItem || { id, name: '', quantity: 1, suggested_price: 0, type: 'ADJUSTMENT' })
      }

      if (!price.description || String(price.description).trim() === '') {
        const parts = key.split('_')
        const categoryName = parts.slice(0, parts.length - 1).join('_')
        const id = parts[parts.length - 1]
        const cat = availablePriceableItems.value.find((c: any) => c.category === categoryName)
        const srcItem = cat?.items?.find((it: any) => String(it.id) === String(id))
        price.description = (srcItem?.name && String(srcItem.name).trim()) || `${price.item_type || 'Item'}`
      }

      items.push(price)
    }

    // Include locally-saved customized items (from + Add in Customized Package section)
    for (const localItem of localSavedCustomItems.value) {
      items.push({
        item_type: localItem.item_type || 'TROPHY',
        item_id: localItem.item_id,
        description: localItem.description || localItem.item_name || '',
        quantity: localItem.quantity || 1,
        unit_amount: localItem.unit_amount || localItem.unitPrice || 0,
        total_amount: localItem.total_amount || localItem.total || 0,
        rate_direction: 'INCREASE',
        amount_source: 'MANUAL',
        is_estimate: false,
        is_optional: localItem.is_optional || false,
      })
    }

  const priceStructureDetailId = enquiryData.value?._resolved_price_structure_detail_id
      || enquiryData.value?.price_structure_detail_id
      || enquiryData.value?.price_structure_detail?.id
      || enquiryData.value?.pricings?.[0]?.price_structure_detail_id
      || pricePreviewData.value?.price_structure_detail?.id
    const huntingTypeId = enquiryData.value?._resolved_hunting_type_id
      || enquiryData.value?.hunting_type_id
      || enquiryData.value?.pricings?.[0]?.hunting_type_id
    const currencyId = enquiryData.value?._resolved_currency_id
      || enquiryData.value?.currency_id
      || enquiryData.value?.pricings?.[0]?.currency_id
      || 1

    const payload = {
      price_structure_detail_id: priceStructureDetailId,
      hunting_type_id: huntingTypeId,
      currency_id: currencyId,
      status: 'DRAFT',
      items: items.map((it: any) => {
        const clean: any = {
          item_type: it.item_type,
          item_id: it.item_id ?? null,
          linked_species_item_id: it.linked_species_item_id ?? null,
          description: it.description || '',
          quantity: it.quantity || 1,
          unit_amount: it.unit_amount || 0,
          total_amount: it.total_amount || (it.quantity || 1) * (it.unit_amount || 0),
          rate_direction: it.rate_direction || 'INCREASE',
          amount_source: it.amount_source === 'CUSTOMIZED' || it.amount_source === 'PENDING_REGULATORY' ? 'MANUAL' : (it.amount_source || 'MANUAL'),
          is_estimate: !!it.is_estimate,
          is_optional: !!it.is_optional,
        }
        // Only include source_package_id when backend supports it and it's a real numeric ID
        // NOTE: Uncomment this once the backend adds the source_package_id column
        // if (it.source_package_id && typeof it.source_package_id === 'number') {
        //   clean.source_package_id = it.source_package_id
        // }
        // Only include pending_licence when backend supports it
        // if (it.pending_licence) {
        //   clean.pending_licence = true
        // }
        // Include item_durations if present (Safari Extras)
        if (it.item_durations) {
          clean.item_durations = it.item_durations
        }
        return clean
      }),
    }

    const response = await salesStore.addPricing(enquiryId.value, payload)
    if (response.status === 200 || response.status === 201) {
      const newPricing = response.data?.data || response.data?.pricing || response.data
      const newPricingId = newPricing?.id || newPricing?.pricing?.id

      Swal.fire({
        title: 'Success!',
        text: `Quotation created with ${items.length} items`,
        icon: 'success',
        timer: 2000,
      })

      // Navigate back to the enquiry's quotations tab
      router.push(`/sales/enquiries/${enquiryId.value}?tab=quotations`)
    }
  } catch (error: any) {
    console.error('Error creating pricing:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || 'Failed to create quotation',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}

// ---- Customized Package helpers ----

// The current enquiry's price_structure_detail_id (to exclude from dropdown)
const currentPriceStructureDetailId = computed(() => {
  return existingPricing.value?.price_structure_detail_id
    || pricePreviewData.value?.price_structure_detail?.id
    || enquiryData.value?.price_structure_detail_id
    || enquiryData.value?.price_structure_detail?.id
    || null
})

// Filter packages: exclude the one already assigned to this enquiry
// Species that currently exceed their regulatory licence limits (item_id → overflow qty)
const exceededSpeciesMap = computed(() => {
  const map = new Map<number, { name: string; overflow: number; baseLimit: number }>()
  // Check from preview items (pre-creation)
  availablePriceableItems.value.forEach((category: any) => {
    category.items.forEach((item: any) => {
      if (item.type !== 'TROPHY' || !item.regulatory_qty || item.regulatory_qty <= 0) return
      const currentQty = selectedItems.value[`${category.category}_${item.id}`]
        ? (ensureItemPrice(category.category, item).quantity || item.quantity)
        : item.quantity
      if (currentQty > item.regulatory_qty) {
        map.set(Number(item.id), {
          name: item.name || 'Unknown',
          overflow: currentQty - item.regulatory_qty,
          baseLimit: item.regulatory_qty,
        })
      }
    })
  })
  // Also check from existing pricing items (edit mode)
  if (map.size === 0) {
    const trophies = existingPricing.value?.items_by_type?.TROPHY || []
    trophies.forEach((item: any) => {
      const itemId = Number(item.item_id)
      const regLimit = baseSpeciesQtyMap.value.get(itemId) || 0
      if (regLimit > 0 && (item.quantity || 0) > regLimit) {
        map.set(itemId, {
          name: item.item_name || item.description || 'Unknown',
          overflow: (item.quantity || 0) - regLimit,
          baseLimit: regLimit,
        })
      }
    })
  }
  return map
})

const filteredCustomPackages = computed(() => {
  const currentId = currentPriceStructureDetailId.value
  const currentName = enquiryPackageName.value?.toLowerCase()?.trim()
  const exceeded = exceededSpeciesMap.value

  // Deduplicate by name (some packages appear under multiple price structures)
  const seenNames = new Set<string>()

  return allPackagesList.value.filter((pkg: any) => {
    // Exclude the current enquiry's base package by ID or name
    if (currentId && pkg.id === currentId) return false
    const pkgName = (pkg.name || '').toLowerCase().trim()
    if (currentName && pkgName && pkgName === currentName) return false

    // Deduplicate by name
    if (seenNames.has(pkgName)) return false
    seenNames.add(pkgName)

    // Must have a regulatory_package
    if (!pkg.regulatory_package?.species_by_category) return false

    // Only include packages that have at least one exceeded species
    if (exceeded.size === 0) return true // If nothing exceeded, show all (for manual adds)
    const pkgSpeciesIds = new Set<number>()
    ;(pkg.regulatory_package.species_by_category || []).forEach((cg: any) => {
      ;(cg.species || []).forEach((sp: any) => {
        pkgSpeciesIds.add(Number(sp.id || sp.item_id))
      })
    })
    // Package must contain at least one of the exceeded species
    for (const [speciesId] of exceeded) {
      if (pkgSpeciesIds.has(speciesId)) return true
    }
    return false
  })
})

// Load all packages from creation-metadata (called once, then cached)
const loadCustomPackagesList = async () => {
  if (allPackagesList.value.length > 0) return
  loadingCustomPackages.value = true
  try {
    const apiBase = String(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
    const response = await axios.get(`${apiBase}/sales-enquiries/creation-metadata`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const data = response.data?.data || response.data || {}
    const packages: any[] = []
    if (Array.isArray(data.price_structures)) {
      data.price_structures.forEach((ps: any) => {
        if (Array.isArray(ps.details)) {
          ps.details.forEach((detail: any) => {
            const salesPkg = detail.sales_packages && detail.sales_packages.length > 0
              ? detail.sales_packages[0]
              : null
            packages.push({
              id: detail.id,
              name: detail.name || `${ps.name} - ${detail.hunt_length || ''}`,
              hunt_length: detail.hunt_length || (detail.hunt_length_days ? `${detail.hunt_length_days} days` : ''),
              amount: detail.amount,
              currency_symbol: detail.currency_symbol || '$',
              hunting_type: detail.hunting_type || '',
              price_structure_name: ps.name,
              sales_package: salesPkg,
              regulatory_package: salesPkg?.regulatory_package || null,
            })
          })
        }
      })
    }
    allPackagesList.value = packages
  } catch (error) {
    console.error('Error loading packages:', error)
    Swal.fire({ title: 'Error', text: 'Failed to load available packages', icon: 'error' })
  } finally {
    loadingCustomPackages.value = false
  }
}

// Load items for a specific package (with caching)
const loadPackageItems = async (packageId: number): Promise<any[]> => {
  if (packageItemsCache.value[packageId]) return packageItemsCache.value[packageId]

  try {
    const response = await salesEnquiryService.previewPriceItems(packageId)
    const data = response?.data || (response as any)?.data?.data || {}
    const items: any[] = []

    // Collect existing item_ids for info labels
    const existingTrophyIds = new Set((existingPricing.value?.items_by_type?.TROPHY || []).map((t: any) => t.item_id))

    // Build a species_id → regulatory quantity map from the package's regulatory_package
    // Priority: regulatory_package.species_by_category > preview species list
    const speciesQtyMap = new Map<number, number>()
    const pkgEntry = allPackagesList.value.find((p: any) => p.id === packageId)
    const regPkg = pkgEntry?.regulatory_package
    if (regPkg?.species_by_category && Array.isArray(regPkg.species_by_category)) {
      regPkg.species_by_category.forEach((catGroup: any) => {
        (catGroup.species || []).forEach((sp: any) => {
          const sid = sp.id || sp.item_id
          const qty = Number(sp.quantity) || 0
          if (sid && qty > 0) speciesQtyMap.set(Number(sid), qty)
        })
      })
    }
    // Fallback to preview species list if regulatory_package not available
    if (speciesQtyMap.size === 0 && Array.isArray(data.species)) {
      data.species.forEach((sp: any) => {
        const sid = sp.item_id || sp.id
        const qty = Number(sp.quantity) || 0
        if (sid && qty > 0) speciesQtyMap.set(Number(sid), qty)
      })
    }

    // Trophy fees only — customized package section only deals with trophies
    if (Array.isArray(data.trophy_fees)) {
      data.trophy_fees.forEach((tf: any) => {
        const itemId = tf.item_id || tf.species_id || tf.id
        const itemName = cleanItemName(tf.item_name || tf.species_name || tf.name || 'Unknown')
        const alreadyInQuotation = existingTrophyIds.has(itemId)
        const regulatoryQty = speciesQtyMap.get(Number(itemId)) || 0
        items.push({
          id: itemId,
          name: itemName,
          type: 'TROPHY',
          unit_price: parseFloat(tf.amount) || 0,
          regulatory_qty: regulatoryQty,
          _alreadyInQuotation: alreadyInQuotation,
        })
      })
    }

    packageItemsCache.value[packageId] = items
    return items
  } catch (error) {
    console.error('Error loading package items:', error)
    return []
  }
}

// Assign excess species quantities to other licences (splits original + creates customized/pending lines)
const assignExcessSpecies = async (items: any[]): Promise<{items:any[], pending:any[]}> => {
  const resultItems: any[] = [...items]
  const pending: any[] = []

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!it || it.item_type !== 'TROPHY' || !it.item_id) continue

    const speciesId = Number(it.item_id)
    const requested = Number(it.quantity || 1)
    const baseLimit = baseSpeciesQtyMap.value.get(speciesId) || 0

    // Nothing to do if no regulatory base limit or request within limit
    if (!baseLimit || requested <= baseLimit) continue

    let remaining = requested - baseLimit

    // Cap the original item to the licence limit
    const originalIndex = resultItems.findIndex((r: any) => r === it)
    if (originalIndex !== -1) {
      resultItems[originalIndex].quantity = baseLimit
      resultItems[originalIndex]._isOriginal = true
      const pkgDetail = previewPackageDetail.value as any
      resultItems[originalIndex].source_package = pkgDetail?.name || enquiryPackageName || 'Base package'
      resultItems[originalIndex].source_package_id = pkgDetail?.id || enquiryData.value?.price_structure_detail_id || null
    }

    // Find candidate packages (exclude enquiry's base price detail)
    const currentDetailId = enquiryData.value?._resolved_price_structure_detail_id || enquiryData.value?.price_structure_detail_id || null
    const candidates = allPackagesList.value.filter((pkg: any) => {
      if (!pkg.regulatory_package) return false
      if (pkg.id === currentDetailId) return false
      return (pkg.regulatory_package.species_by_category || []).some((cg: any) => (cg.species || []).some((s: any) => Number(s.id) === speciesId))
    })

    // Allocate across candidates
    for (const pkg of candidates) {
      if (remaining <= 0) break
      // find licence quantity available for this species in pkg
      const catGroup = (pkg.regulatory_package?.species_by_category || []).find((cg: any) => (cg.species || []).some((s: any) => Number(s.id) === speciesId))
      const spEntry = (catGroup?.species || []).find((s: any) => Number(s.id) === speciesId)
      const allowed = Number(spEntry?.quantity || 0)
      if (!allowed || allowed <= 0) continue

      const take = Math.min(remaining, allowed)
      if (take <= 0) continue

      // lookup unit price from package preview (best effort)
      let unit = it.unit_amount || 0
      try {
        const pkgItems = await loadPackageItems(pkg.id)
        const match = pkgItems.find((pi: any) => Number(pi.id) === speciesId)
        if (match) unit = match.unit_price || unit
      } catch (err) { /* ignore pricing lookup errors */ }

      const newLine = {
        item_type: 'TROPHY',
        item_id: speciesId,
        linked_species_item_id: speciesId,
        description: `${it.description} (Licence: ${pkg.name})`,
        quantity: take,
        unit_amount: unit,
        total_amount: take * unit,
        rate_direction: 'INCREASE',
        amount_source: 'CUSTOMIZED',
        is_estimate: false,
        is_optional: false,
        _isCustomized: true,
        source_package: pkg.name,
        source_package_id: pkg.id,
      }
      resultItems.push(newLine)
      remaining -= take
    }

    if (remaining > 0) {
      // Still unallocated — add a pending approval line
      const pendingLine = {
        item_type: 'TROPHY',
        item_id: speciesId,
        linked_species_item_id: speciesId,
        description: `${it.description} (Pending licence / approval)`,
        quantity: remaining,
        unit_amount: it.unit_amount || 0,
        total_amount: remaining * (it.unit_amount || 0),
        rate_direction: 'INCREASE',
        amount_source: 'PENDING_REGULATORY',
        is_estimate: false,
        is_optional: true,
        _pending_regulatory: true,
        pending_licence: true,
      }
      resultItems.push(pendingLine)
      pending.push({ name: it.description || speciesId, remaining })
    }
  }

  return { items: resultItems, pending }
}

// ---- Customized package helpers: add / remove / package/item change handlers ----
const addCustomRow = () => {
  customRowUid += 1
  customRows.value.push({
    _uid: customRowUid,
    packageId: null,
    itemId: null,
    availableItems: [],
    loadingItems: false,
    quantity: 1,
    unitPrice: 0,
    total: 0,
    isOptional: false,
    infoNote: '',
    maxQty: 0,
    saving: false,
    selectedItemData: null,
  })
}

const removeCustomRow = (idx: number) => {
  if (idx >= 0 && idx < customRows.value.length) customRows.value.splice(idx, 1)
}

const onCustomRowPackageChange = async (row: any) => {
  row.availableItems = []
  row.itemId = null
  row.selectedItemData = null
  row.loadingItems = true
  try {
    if (!row.packageId) return
    const items = await loadPackageItems(row.packageId)
    const exceeded = exceededSpeciesMap.value
    if (exceeded.size > 0) {
      // Only show items that correspond to exceeded species
      row.availableItems = items.filter((it: any) => exceeded.has(Number(it.id)))
    } else {
      row.availableItems = items
    }
  } catch (err) {
    console.error('Failed to load package items for custom row:', err)
  } finally {
    row.loadingItems = false
  }
}

const onCustomRowItemChange = (row: any) => {
  const selected = (row.availableItems || []).find((a: any) => String(a.id) === String(row.itemId)) || null
  row.selectedItemData = selected
  if (!selected) {
    row.maxQty = 0
    row.infoNote = ''
    row.quantity = 1
    row.unitPrice = 0
    row.total = 0
    return
  }

  // Set regulatory licence quantity from the source package
  const regQty = selected.regulatory_qty || 0
  row.maxQty = regQty

  // Show info note if species already exists in quotation (regulatory extra)
  if (selected._alreadyInQuotation) {
    row.infoNote = `This species is already in the base package — adding as regulatory extra.${regQty ? ' Licence allows max ' + regQty + '.' : ''}`
  } else if (regQty) {
    row.infoNote = `Licence allows max ${regQty} for this species.`
  }

  // Auto-fill qty to overflow amount (what's exceeded), capped by this package's regulatory limit
  const exceeded = exceededSpeciesMap.value.get(Number(selected.id))
  const overflowQty = exceeded?.overflow || 0
  if (overflowQty > 0 && regQty > 0) {
    row.quantity = Math.min(overflowQty, regQty)
  } else if (regQty > 0) {
    row.quantity = regQty
  } else {
    row.quantity = 1
  }
  row.unitPrice = selected.unit_price || 0
  row.total = (row.quantity || 1) * row.unitPrice
}

const recalcCustomRowTotal = (row: any) => {
  // Enforce regulatory qty limit if known
  if (row.maxQty > 0 && row.quantity > row.maxQty) {
    row.quantity = row.maxQty
  }
  if (row.quantity < 1) row.quantity = 1
  row.total = (row.quantity || 1) * (row.unitPrice || 0)
}

const saveCustomRow = async (row: any, idx: number) => {
  if (!row.itemId || !row.selectedItemData) return

  // Validate qty against regulatory limit
  if (row.maxQty > 0 && (row.quantity || 1) > row.maxQty) {
    const confirmed = await Swal.fire({
      title: 'Regulatory Limit Exceeded',
      html: `Quantity <strong>${row.quantity}</strong> exceeds the licence limit of <strong>${row.maxQty}</strong> for "${row.selectedItemData.name}".<br>Do you want to proceed anyway?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Save anyway',
      cancelButtonText: 'Cancel',
    })
    if (!confirmed.isConfirmed) return
  }

  // --- CREATE MODE: save locally (no pricing exists yet) ---
  if (isCreateMode.value || !existingPricing.value?.id) {
    const pkg = allPackagesList.value.find((p: any) => p.id === row.packageId)
    const pkgName = pkg?.name || ''
    localSavedCustomItems.value.push({
      _uid: row._uid,
      _isLocal: true,
      _sourcePackage: pkgName,
      item_type: 'TROPHY',
      item_id: row.selectedItemData.id,
      item_name: row.selectedItemData.name,
      description: row.selectedItemData.name,
      quantity: row.quantity || 1,
      unit_amount: row.unitPrice || 0,
      unitPrice: row.unitPrice || 0,
      total_amount: row.total || 0,
      total: row.total || 0,
      is_optional: row.isOptional || false,
      source_package_id: row.packageId,
      amount_source: 'CUSTOMIZED',
    })
    customRows.value.splice(idx, 1)
    Swal.fire({ title: 'Added!', text: `"${row.selectedItemData.name}" added to customized items.`, icon: 'success', timer: 1500, showConfirmButton: false })
    return
  }

  // --- EDIT MODE: save via API ---
  row.saving = true
  try {
    const payload = {
      item_type: row.selectedItemData.type,
      item_id: row.selectedItemData.id,
      description: row.selectedItemData.name,
      quantity: row.quantity || 1,
      unit_amount: row.unitPrice || 0,
      is_optional: row.isOptional || false,
    }

    const resp = await salesEnquiryService.addPricingItem(existingPricing.value.id, payload)
    if (resp.success) {
      const newItem = resp.data
      if (newItem?.id) {
        const pkg = allPackagesList.value.find((p: any) => p.id === row.packageId)
        const pkgName = pkg?.name || ''
        addCustomItemId(newItem.id, pkgName)
      }
      customRows.value.splice(idx, 1)
      packageItemsCache.value = {}
      await loadPricing()
      Swal.fire({ title: 'Added!', text: `"${row.selectedItemData.name}" added to quotation.`, icon: 'success', timer: 1500, showConfirmButton: false })
    }
  } catch (error: any) {
    console.error('Error saving custom row:', error)
    Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Failed to add item', icon: 'error' })
  } finally {
    row.saving = false
  }
}

const removeLocalCustomItem = (idx: number) => {
  localSavedCustomItems.value.splice(idx, 1)
}

// Combined list: local (create mode) + server (edit mode)
const allCustomizedItems = computed(() => {
  return [...localSavedCustomItems.value, ...customizedSavedItems.value]
})

// Count of items with pending licence status
const pendingLicenceCount = computed(() => {
  return allCustomizedItems.value.filter((item: any) =>
    item.pending_licence || item.amount_source === 'PENDING_REGULATORY'
  ).length
})

// ---- Inline Add helpers ----

// Returns true if an item name is duplicatable (observer/cameraman)
const isDuplicateAllowed = (name: string) => {
  if (!name) return false
  const n = name.toLowerCase()
  return n.includes('observer') || n.includes('cameraman') || n.includes('camera man')
}

// Build dropdown options for inline add based on type (excludes items already in quotation)
const inlineAddOptions = computed(() => {
  if (!addingInlineType.value) return []

  // Collect IDs of items already in the quotation (server items + locally added)
  const existingIds = new Set<number | string>()
  const serverItems = existingItemsByType.value[addingInlineType.value!] || []
  for (const ei of serverItems) {
    if (ei.item_id) existingIds.add(ei.item_id)
  }
  for (const la of localAddedItems.value) {
    if (la.item_type === addingInlineType.value && la.item_id) existingIds.add(la.item_id)
  }

  if (addingInlineType.value === 'TROPHY') {
    const allTrophies = pricePreviewData.value?.trophy_fees || []
    return allTrophies
      .map((tf: any) => ({
        id: tf.item_id || tf.species_id || tf.id,
        name: cleanItemName(tf.item_name || tf.species_name || tf.name || 'Unknown'),
        amount: parseFloat(tf.amount) || 0,
        type: 'TROPHY',
      }))
      .filter((opt: any) => isDuplicateAllowed(opt.name) || !existingIds.has(opt.id))
  }

  if (addingInlineType.value === 'EXTRA') {
    const allExtras = pricePreviewData.value?.safari_extras || []
    return allExtras
      .map((se: any) => ({
        id: se.item_id || se.safari_extra_id || se.id,
        name: cleanItemName(se.item_name || se.name || 'Extra'),
        amount: parseFloat(se.amount) || 0,
        type: 'EXTRA',
        pricing_unit: se.pricing_unit || '',
      }))
      .filter((opt: any) => isDuplicateAllowed(opt.name) || !existingIds.has(opt.id))
  }

  return []
})

const openInlineAdd = (type: string) => {
  addingInlineType.value = type
  inlineAddSelectedId.value = ''
  inlineAddQty.value = 1
  inlineAddDuration.value = null
  inlineAddUnitPrice.value = 0
  inlineAddOptional.value = false
  inlineAddTotal.value = 0
  inlineAddWarning.value = ''
  inlineAddShowDuration.value = false
}

const cancelInlineAdd = () => {
  addingInlineType.value = null
  inlineAddWarning.value = ''
}

const onInlineItemSelected = () => {
  inlineAddWarning.value = ''
  const selectedOpt = inlineAddOptions.value.find((o: any) => o.id === inlineAddSelectedId.value)
  if (!selectedOpt) {
    inlineAddUnitPrice.value = 0
    inlineAddTotal.value = 0
    inlineAddShowDuration.value = false
    return
  }

  // Check regulatory limit for trophy fees (compare with desired_quantity from enquiry preferences)
  if (addingInlineType.value === 'TROPHY') {
    const allPrefs = enquiryData.value?.species_preferences || enquiryData.value?.item_preferences || []
    const pref = allPrefs.find((p: any) => p.item_id === selectedOpt.id)
    if (pref) {
      const existingTrophies = existingPricing.value?.items_by_type?.TROPHY || []
      const current = existingTrophies.filter((t: any) => t.item_id === selectedOpt.id)
      const currentQty = current.reduce((s: number, t: any) => s + (t.quantity || 0), 0)
      const desired = pref.desired_quantity || 1
      if (currentQty >= desired && !inlineAddWarning.value) {
        inlineAddWarning.value = `Regulatory warning: Already have ${currentQty} of desired ${desired} for "${selectedOpt.name}".`
      }
    }
  }

  // Set price and duration
  inlineAddUnitPrice.value = selectedOpt.amount || 0
  const nameForDuration = selectedOpt.name || ''
  const pricingUnit = (selectedOpt as any).pricing_unit || ''
  inlineAddShowDuration.value = addingInlineType.value === 'EXTRA' && (
    durationRelevantByNameLocal(nameForDuration)
    || String(pricingUnit).toLowerCase().includes('per_day')
  )
  if (inlineAddShowDuration.value) {
    inlineAddDuration.value = enquiryDays.value || 1
  } else {
    inlineAddDuration.value = null
  }
  recalcInlineTotal()
}

const recalcInlineTotal = () => {
  const qty = inlineAddQty.value || 1
  const unit = inlineAddUnitPrice.value || 0
  const days = (inlineAddShowDuration.value && inlineAddDuration.value) ? inlineAddDuration.value : 1
  inlineAddTotal.value = qty * unit * days
}

const confirmInlineAdd = async () => {
  if (!inlineAddSelectedId.value || !existingPricing.value?.id) return
  if (inlineAddWarning.value) return

  const selectedOpt = inlineAddOptions.value.find((o: any) => o.id === inlineAddSelectedId.value)
  if (!selectedOpt) return

  // Final regulatory check for trophy quantity
  if (addingInlineType.value === 'TROPHY') {
    const allPrefs = enquiryData.value?.species_preferences || enquiryData.value?.item_preferences || []
    const pref = allPrefs.find((p: any) => p.item_id === selectedOpt.id)
    if (pref) {
      const existingTrophies = existingPricing.value?.items_by_type?.TROPHY || []
      const currentQty = existingTrophies.filter((t: any) => t.item_id === selectedOpt.id).reduce((s: number, t: any) => s + (t.quantity || 0), 0)
      const desired = pref.desired_quantity || 1
      if (currentQty + (inlineAddQty.value || 1) > desired) {
        const confirmed = await Swal.fire({
          title: 'Regulatory Warning',
          html: `Adding <strong>${inlineAddQty.value}</strong> x "${selectedOpt.name}" would exceed the desired quantity of <strong>${desired}</strong> (currently ${currentQty} in quotation).<br>Do you want to proceed?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Add anyway',
          cancelButtonText: 'Cancel',
        })
        if (!confirmed.isConfirmed) return
      }
    }
  }

  // Final regulatory check for extras quantity
  if (addingInlineType.value === 'EXTRA') {
    const allExtraPrefs = enquiryData.value?.safari_extras_preferences || enquiryData.value?.safari_extras || []
    const pref = allExtraPrefs.find((p: any) => p.item_id === selectedOpt.id)
    if (pref) {
      const existingExtras = existingPricing.value?.items_by_type?.EXTRA || []
      const currentQty = existingExtras.filter((e: any) => e.item_id === selectedOpt.id).reduce((s: number, e: any) => s + (e.quantity || 0), 0)
      const desired = pref.desired_quantity || 1
      if (!isDuplicateAllowed(selectedOpt.name) && currentQty + (inlineAddQty.value || 1) > desired) {
        const confirmed = await Swal.fire({
          title: 'Regulatory Warning',
          html: `Adding <strong>${inlineAddQty.value}</strong> x "${selectedOpt.name}" would exceed the desired quantity of <strong>${desired}</strong> (currently ${currentQty} in quotation).<br>Do you want to proceed?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Add anyway',
          cancelButtonText: 'Cancel',
        })
        if (!confirmed.isConfirmed) return
      }
    }
  }

  savingInlineAdd.value = true
  try {
    const payload: any = {
      item_type: addingInlineType.value,
      item_id: selectedOpt.id,
      description: selectedOpt.name,
      quantity: inlineAddQty.value || 1,
      unit_amount: inlineAddUnitPrice.value || 0,
      is_optional: inlineAddOptional.value,
    }
    if (inlineAddDuration.value != null && inlineAddShowDuration.value) {
      payload.item_durations = inlineAddDuration.value
    }

    // --- Edit mode: keep addition local (don't touch the server) ---
    if (!isCreateMode.value) {
      const totalAmount = (payload.quantity || 1) * (payload.unit_amount || 0) * (payload.item_durations || 1)
      localAddedItems.value.push({
        ...payload,
        _localId: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        item_name: selectedOpt.name,
        total_amount: totalAmount,
        rate_direction: 'INCREASE',
        amount_source: 'MANUAL',
        is_estimate: false,
      })
      cancelInlineAdd()
      Swal.fire({ title: 'Added!', text: `"${selectedOpt.name}" added locally. Click Save Changes to finalize.`, icon: 'success', timer: 1500 })
      return
    }

    // --- Create mode: add directly on the server ---
    const response = await salesEnquiryService.addPricingItem(existingPricing.value.id, payload)
    if (response.success) {
      cancelInlineAdd()
      await loadPricing()
      Swal.fire({ title: 'Added!', text: `"${selectedOpt.name}" added to the quotation.`, icon: 'success', timer: 1500 })
    }
  } catch (error: any) {
    console.error('Error adding inline item:', error)
    Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Failed to add item', icon: 'error' })
  } finally {
    savingInlineAdd.value = false
  }
}

const goBack = async () => {
  // Warn if there are unsaved local changes
  if (hasLocalChanges.value) {
    const confirm = await Swal.fire({
      title: 'Unsaved Changes',
      text: 'You have unsaved changes. Going back will discard them. Continue?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Discard & Go Back',
      cancelButtonText: 'Stay',
    })
    if (!confirm.isConfirmed) return
    // Reset local state
    localDeletedItemIds.value = new Set()
    localAddedItems.value = []
  }

  const routeId = Number(route.params.id)
  const pricingEnquiryId = existingPricing.value?.enquiry?.id || existingPricing.value?.enquiry_id
  const fallbackId = enquiryData.value?.id
  const targetId = Number.isFinite(routeId) && routeId > 0 ? routeId
    : Number.isFinite(Number(pricingEnquiryId)) ? Number(pricingEnquiryId)
    : Number.isFinite(Number(fallbackId)) ? Number(fallbackId)
    : null

  if (targetId) {
    // Store enquiry data and tab in sessionStorage so SalesInquiries page auto-opens the detail view instantly
    sessionStorage.setItem('openEnquiryId', String(targetId))
    sessionStorage.setItem('openEnquiryTab', 'quotations')
    // Pass full enquiry data so the detail view opens instantly (no API delay flash)
    const dataToStore = enquiryData.value || existingPricing.value?.enquiry || null
    if (dataToStore) {
      try { sessionStorage.setItem('openEnquiryData', JSON.stringify(dataToStore)) } catch (e) { /* ignore */ }
    }
  }

  router.push('/sales/sales-inquiry').then(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// Save current items as a NEW quotation (duplicate) and navigate back to the list
// Computed: whether there are unsaved local changes
const hasLocalChanges = computed(() => {
  return localDeletedItemIds.value.size > 0 || localAddedItems.value.length > 0
})

// Save local changes (deletions + additions) to the EXISTING draft quotation
const saveQuotationChanges = async () => {
  if (!hasLocalChanges.value) {
    Swal.fire({ title: 'No Changes', text: 'There are no changes to save.', icon: 'info' })
    return
  }

  if (!existingPricing.value?.id) {
    Swal.fire({ title: 'Error', text: 'No pricing record found.', icon: 'error' })
    return
  }

  const pricingId = existingPricing.value.id
  const deletions = Array.from(localDeletedItemIds.value)
  const additions = [...localAddedItems.value]

  const confirm = await Swal.fire({
    title: 'Save Changes?',
    html: `This will update the existing draft quotation:<br>` +
      (deletions.length > 0 ? `<strong>${deletions.length}</strong> item(s) removed<br>` : '') +
      (additions.length > 0 ? `<strong>${additions.length}</strong> item(s) added` : ''),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
  })
  if (!confirm.isConfirmed) return

  saving.value = true
  try {
    let errors = 0

    // 1. Delete removed items on the server
    for (const itemId of deletions) {
      try {
        await salesEnquiryService.deletePricingItem(itemId)
      } catch (e: any) {
        console.error(`Error deleting item ${itemId}:`, e)
        errors++
      }
    }

    // 2. Add new items on the server
    for (const item of additions) {
      try {
        const payload: any = {
          item_type: item.item_type,
          item_id: item.item_id ?? null,
          description: item.description || item.item_name || '',
          quantity: item.quantity || 1,
          unit_amount: item.unit_amount || 0,
          is_optional: !!item.is_optional,
        }
        if (item.item_durations) {
          payload.item_durations = item.item_durations
        }
        await salesEnquiryService.addPricingItem(pricingId, payload)
      } catch (e: any) {
        console.error(`Error adding item ${item.description}:`, e)
        errors++
      }
    }

    // 3. Reset local tracking state
    localDeletedItemIds.value = new Set()
    localAddedItems.value = []

    if (errors > 0) {
      Swal.fire({ title: 'Partial Save', text: `Changes saved with ${errors} error(s). Please review the quotation.`, icon: 'warning' })
    } else {
      await Swal.fire({ title: 'Saved!', text: 'Quotation updated successfully.', icon: 'success', timer: 1500 })
      // Navigate back to the enquiry detail page (Quotations tab)
      goBack()
    }
  } catch (error: any) {
    console.error('Error saving quotation changes:', error)
    Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Failed to save changes', icon: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCustomItemIds()
  loadPricing()
  // Load package list so licence candidate info is available in the steps panel
  loadCustomPackagesList()
})
</script>

<style scoped>
.create-quotation-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0;
}

.quotation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.quotation-summary-card {
  background: var(--bs-secondary, #6c757d);
  border: none;
}

.quotation-section-header {
  border-bottom: 1px solid #eef0f3;
  padding: 0.75rem 1rem;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 99;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.quotation-selection-bar {
  border: 1px solid #e5e7eb;
}

/* Steps panel */
.steps-card {
  border: 1px solid #e9eef3;
  background: #ffffff;
}
.steps-card .card-body { background: transparent; }
</style>
