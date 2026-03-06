<template>
  <div class="pricing-section">
    <div class="d-flex align-items-center mb-3">
      <div>
        <h5 class="page-header mb-0">Quotations</h5>
      </div>
      <div class="ms-auto d-flex flex-wrap gap-2">
        <button v-if="canAddPricing" class="btn btn-outline-theme" @click="generateQuotation">
          <i class="fa fa-magic fa-fw me-1"></i> Generate Quotation
        </button>
      </div>
    </div>

    <!-- Pricing Table -->
    <card v-if="pricings.length > 0">
      <div class="tab-content p-4">
        <div class="tab-pane fade show active">
          <div class="table-responsive">
            <table class="table table-hover text-nowrap">
              <thead>
                <tr>
                  <th class="border-top-0 pt-0 pb-2">Status</th>
                  <th class="border-top-0 pt-0 pb-2">Quotation</th>
                  <th class="border-top-0 pt-0 pb-2">Package</th>
                  <th class="border-top-0 pt-0 pb-2">Hunt Length</th>
                  <th class="border-top-0 pt-0 pb-2">Currency</th>
                  <th class="border-top-0 pt-0 pb-2 text-center">Items</th>
                  <th class="border-top-0 pt-0 pb-2 text-end">Total Amount</th>
                  <th class="border-top-0 pt-0 pb-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pricing, index) in pricings" :key="pricing.id">
                  <td class="py-1 align-middle">
                    <span class="badge px-2 pt-5px pb-5px rounded fs-12px d-inline-flex align-items-center"
                      :class="pricing.status === 'LOCKED' 
                        ? 'bg-teal text-teal-800 bg-opacity-25' 
                        : 'bg-orange bg-opacity-20 text-orange'">
                      <i class="fa fa-circle fs-9px fa-fw me-5px" :class="pricing.status === 'LOCKED' ? 'text-teal' : ''"></i>
                      {{ pricing.status === 'LOCKED' ? 'Locked' : 'Draft' }}
                    </span>
                  </td>
                  <td class="align-middle">
                    <a href="#" @click.prevent="navigateToEditQuotation(pricing)" class="text-decoration-none">
                      <strong>Quotation #{{ index + 1 }}</strong>
                    </a>
                    <div><small class="text-muted">ID: {{ pricing.id }}</small></div>
                  </td>
                  <td class="align-middle">
                    <div>{{ pricing.price_structure_detail?.name || 'N/A' }}</div>
                    <small class="text-muted">{{ pricing.hunting_type || '' }}</small>
                  </td>
                  <td class="align-middle">{{ (pricing.price_structure_detail?.hunt_length as any)?.label || pricing.price_structure_detail?.hunt_length || 'N/A' }}</td>
                  <td class="align-middle">{{ typeof pricing.currency === 'string' ? pricing.currency : (pricing.currency as any)?.name || 'USD' }}</td>
                  <td class="text-center align-middle">
                    <span class="badge bg-gray-100 text-black text-opacity-50 px-2 pt-5px pb-5px rounded fs-12px">{{ getItemsCount(pricing) }}</span>
                  </td>
                  <td class="text-end align-middle">
                    <strong class="text-success">
                      {{ typeof pricing.currency === 'string' ? '$' : ((pricing.currency as any)?.symbol || '$') }}{{ formatCurrency(getTotalExcludingTrophy(pricing)) }}
                    </strong>
                  </td>
                  <td class="text-center align-middle">
                    <div class="btn-group btn-group-sm" role="group">
                      <button class="btn btn-info btn-sm me-1" @click="navigateToEditQuotation(pricing)" title="View and Edit">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button v-if="pricing.status !== 'LOCKED'" class="btn btn-success btn-sm me-1" @click="confirmLockPricing(pricing)" title="Lock">
                        <i class="fa fa-lock"></i>
                      </button>
                      <button v-if="pricing.status !== 'LOCKED'" class="btn btn-danger btn-sm" @click="confirmDeletePricing(pricing)" title="Delete">
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </card>

    <!-- Loading State -->
    <card v-else-if="loadingPricings">
      <div class="tab-content p-4">
        <div class="text-center py-5">
          <span class="spinner-border spinner-border-sm me-2"></span>
          <span class="text-muted">Loading quotations...</span>
        </div>
      </div>
    </card>

    <!-- Empty State -->
    <card v-else>
      <div class="tab-content p-4">
        <div class="tab-pane fade show active">
          <div class="text-center py-5">
            <i class="fa fa-file-invoice fa-4x text-muted mb-3"></i>
            <h5 class="text-muted">No Quotations Yet</h5>
            <p class="text-muted mb-3">Create a new quotation to get started.</p>
            <div class="d-flex justify-content-center flex-wrap gap-2">
              <button v-if="canAddPricing" class="btn btn-outline-theme" @click="generateQuotation">
                <i class="fa fa-magic fa-fw me-1"></i> Generate Quotation
              </button>
            </div>
          </div>
        </div>
      </div>
    </card>

    <!-- Add/Edit Pricing Modal -->
    <div class="modal fade" :class="{ show: showAddPricingModal }"
      :style="{ display: showAddPricingModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-secondary text-dark">
            <h5 class="modal-title">
              <i class="fa fa-file-invoice-dollar me-2"></i>
              {{ editingPricing ? 'Edit Quotation' : 'Generate Quotation' }}
            </h5>
            <button type="button" class="btn-close" @click="closeAddPricingModal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <!-- Enquiry Info Summary -->
            <div v-if="!editingPricing && props.enquiryData" class="alert alert-light border">
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
                  <strong>{{ props.enquiryData.preference?.no_of_days || 'N/A' }} days</strong>
                </div>
              </div>
            </div>

            <div v-if="loadingPreview" class="text-center py-5">
              <span class="spinner-border spinner-border-lg me-2"></span>
              <div class="mt-2">Loading priceable items...</div>
            </div>

            <div v-else-if="availablePriceableItems.length > 0">
              <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                <h6 class="mb-0">
                  <i class="fa fa-list-check me-2 text-primary"></i>
                 Items enquired by the client
                </h6>
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-outline-primary btn-sm" type="button" @click="selectAllSystemItems">
                    <i class="fa fa-check-double me-1"></i> Select All
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" type="button" @click="clearSelection">
                    <i class="fa fa-eraser me-1"></i> Clear
                  </button>
                </div>
              </div>

              <div class="card bg-light border mb-4">
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-lg-5">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <i class="fa fa-briefcase text-primary"></i>
                        <strong>Package Snapshot</strong>
                      </div>
                      <div class="fw-semibold">{{ previewPackageDetail?.name || 'N/A' }}</div>
                      <div class="text-muted small">
                        {{ previewPackageDetail?.hunt_length || `${previewDays} Days` }} ·
                        {{ previewPackageDetail?.hunting_type || enquiryHuntingType }}
                      </div>
                      <div class="text-muted small">
                        {{ previewPackageDetail?.currency_code || '$' }} {{ formatCurrency(previewPackageDetail?.amount || 0) }}
                      </div>
                    </div>
                    <div class="col-lg-4">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <i class="fa fa-map-marker-alt text-success"></i>
                        <strong>Price Structure</strong>
                      </div>
                      <div class="fw-semibold">{{ previewStructure?.name || 'N/A' }}</div>
                      <div class="text-muted small">{{ previewStructure?.location_name || 'N/A' }}</div>
                      <div class="text-muted small">
                        {{ formatDate(previewStructure?.start_date) }} - {{ formatDate(previewStructure?.end_date) }}
                      </div>
                    </div>
                    <div class="col-lg-3">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <i class="fa fa-chart-pie text-info"></i>
                        <strong>Preview Totals</strong>
                      </div>
                      <div class="d-flex flex-column gap-2">
                        <span class="badge bg-primary">Species {{ previewSummary?.species_count || 0 }}</span>
                        <span class="badge bg-info">Extras {{ previewSummary?.safari_extras_count || 0 }}</span>
                        <span class="badge bg-warning text-dark">Trophy Fees {{ previewSummary?.trophy_fees_count || 0 }}</span>
                        <span class="badge bg-secondary">Companion Hunters {{ previewSummary?.companion_costs_count || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Priceable Items as Checkboxes with Price Inputs -->
              <div v-for="category in availablePriceableItems" :key="category.category" class="mb-4">
                <h6 class="bg-light p-2 rounded mb-3">
                  <i class="fa fa-tag me-2"></i>
                  {{ category.category }}
                </h6>

                <div class="table-responsive">
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 50px;">
                          <input type="checkbox" class="form-check-input" @change="toggleCategorySelection(category)"
                            :checked="isCategorySelected(category)">
                        </th>
                        <th>Item</th>
                        <th style="width: 100px;" class="text-center">Qty</th>
                        <th v-if="category.category === 'Safari Extras'" style="width: 110px;" class="text-center">Dur (days)</th>
                        <th style="width: 150px;" class="text-end">Unit Price</th>
                        <th style="width: 150px;" class="text-end">Total</th>
                        <th style="width: 100px;" class="text-center">Optional</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in category.items" :key="item.id">
                        <td class="text-center">
                          <input type="checkbox" class="form-check-input"
                            v-model="selectedItems[`${category.category}_${item.id}`]"
                            @change="initializeItemPrice(category.category, item)">
                        </td>
                        <td>
                          <div>
                            <strong>{{ cleanItemName(item.name) }}</strong>
                            <span v-if="item.type !== 'LOGISTICS'" class="badge ms-2" :class="getItemTypeBadgeClass(item.type)">{{
                              formatItemType(item.type) }}</span>
                          </div>
                          <small v-if="item.priority" class="text-muted d-block">{{ formatPriority(item.priority)
                            }}</small>
                        </td>
                        <td class="text-center">
                          <input v-if="selectedItems[`${category.category}_${item.id}`]" type="number"
                            class="form-control form-control-sm text-center"
                            v-model.number="ensureItemPrice(category.category, item).quantity" min="1"
                            @input="updateItemTotal(category.category, item.id)">
                          <span v-else class="text-muted">{{ item._base_quantity ?? item.quantity }}</span>
                        </td>
                        <td class="text-center" v-if="category.category === 'Safari Extras'">
                          <div v-if="item._duration_applied">
                            <input v-if="selectedItems[`${category.category}_${item.id}`]" type="number"
                              class="form-control form-control-sm text-center"
                              :value="ensureItemPrice(category.category, item).item_durations"
                              @input="handleInitItemDuration($event, category.category, item.id)"
                              min="1"
                              placeholder=""
                              title="Leave blank to inherit hunting length"
                              style="width: 110px" />
                            <span v-else class="text-muted">
                              {{ item.effective_duration ?? '-' }}
                            </span>
                          </div>
                          <div v-else>
                            <span class="text-muted">-</span>
                          </div>
                        </td>
                        <td>
                          <input v-if="selectedItems[`${category.category}_${item.id}`]" type="number"
                            class="form-control form-control-sm text-end"
                            v-model.number="ensureItemPrice(category.category, item).unit_amount" step="0.01"
                            min="0" @input="updateItemTotal(category.category, item.id)">
                          <span v-else class="text-muted text-end d-block">{{ formatCurrency(item.suggested_price)
                            }}</span>
                        </td>
                        <td class="text-end">
                          <strong v-if="selectedItems[`${category.category}_${item.id}`]" class="text-success">
                            {{ formatCurrency(itemPrices[`${category.category}_${item.id}`]?.total_amount || 0) }}
                          </strong>
                          <span v-else class="text-muted">{{ formatCurrency((item.quantity * item.suggested_price) * (item._duration_applied ? (item.effective_duration ?? 1) : 1))
                            }}</span>
                        </td>
                        <td class="text-center">
                          <input v-if="selectedItems[`${category.category}_${item.id}`]" type="checkbox"
                            class="form-check-input"
                            v-model="ensureItemPrice(category.category, item).is_optional">
                          <span v-else class="text-muted">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Auto‑assign overflow toggle -->
              <div class="form-check form-switch mb-3 d-flex align-items-start gap-3">
                <div style="flex:0 0 auto;">
                  <input class="form-check-input" type="checkbox" id="autoAssignOverflowToggle" v-model="autoAssignOverflow" />
                </div>
                <div style="flex:1 1 auto;">
                  <label class="form-check-label small" for="autoAssignOverflowToggle"><strong>Auto‑assign overflow to other licences</strong></label>
                  <div class="small text-muted">When selected, quantities that exceed the package licence will be suggested for allocation to other available licences; you will be prompted to confirm per species.</div>
                </div>
              </div>

              <!-- Summary -->
              <div class="card bg-light mt-4">
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>Selected Items: {{ selectedItemsCount }}</h6>
                    </div>
                    <div class="col-md-6 text-end">
                      <h5 class="mb-0 text-success">
                        Total: {{ formatCurrency(quotationTotal) }}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="alert alert-warning">
              <i class="fa fa-exclamation-triangle me-2"></i>
              No priceable items found. Make sure species, extras, or participants are filled in the enquiry.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddPricingModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="savePricingWithItems"
              :disabled="savingPricing || selectedItemsCount === 0">
              <span v-if="savingPricing" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fa fa-save me-1"></i>
              Create Quotation with {{ selectedItemsCount }} Items
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAddPricingModal" class="modal-backdrop fade show"></div>

    <!-- Add/Edit Pricing Item Modal -->
    <div class="modal fade" :class="{ show: showItemModal }" :style="{ display: showItemModal ? 'block' : 'none' }"
      tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-list me-2"></i>
              {{ editingItem ? 'Edit Line Item' : 'Add Line Item' }}
            </h5>
            <button type="button" class="btn-close" @click="closeItemModal"></button>
          </div>
          <div class="modal-body">
            <!-- Priceable Items from Enquiry (shown when creating quotation) -->
            <div v-if="!editingItem && availablePriceableItems.length > 0" class="mb-4">
              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Quick Add:</strong> Click on items below to add them to the quotation with suggested prices
              </div>

              <div v-if="loadingPreview" class="text-center py-3">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Loading priceable items...
              </div>

              <div v-else v-for="category in availablePriceableItems" :key="category.category" class="mb-3">
                <h6 class="text-muted mb-2">
                  <i class="fa fa-tag me-1"></i>
                  {{ category.category }}
                </h6>
                <div class="list-group">
                  <button v-for="item in category.items" :key="item.id" type="button"
                    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    @click="addItemFromPreview(item)">
                    <div>
                      <strong>{{ item.name }}</strong>
                      <span class="badge bg-secondary ms-2">{{ item.type }}</span>
                      <small class="text-muted ms-2">Qty: {{ item.quantity }}</small>
                    </div>
                    <div class="text-end">
                      <div class="text-success fw-bold">
                        {{ formatCurrency(item.suggested_price) }}
                      </div>
                      <small class="text-muted">Suggested price</small>
                    </div>
                  </button>
                </div>
              </div>

              <hr class="my-4">
              <h6 class="text-muted mb-3">
                <i class="fa fa-edit me-1"></i>
                Or add item manually:
              </h6>
            </div>

            <form @submit.prevent="saveItem">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Item Type <span class="text-danger">*</span></label>
                  <select v-model="itemForm.item_type" class="form-select" required>
                    <option value="">Select Type</option>
                    <option value="PACKAGE">Hunting Package</option>
                    <option value="TROPHY">Trophy Fee</option>
                    <option value="EXTRA">Safari Extra</option>
                    <option value="LOGISTICS">Accommodation & Transport</option>
                    <option value="ADJUSTMENT">Price Adjustment</option>
                  </select>
                </div>

                <!-- Overflow allocation modal (prompt user to allocate overflow to other licences) -->
                <div class="modal fade" :class="{ show: showOverflowAllocationModal }" :style="{ display: showOverflowAllocationModal ? 'block' : 'none' }" tabindex="-1">
                  <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title"><i class="fa fa-exchange-alt me-2"></i>Allocate overflow to other licences</h5>
                        <button type="button" class="btn-close" @click="closeOverflowAllocationModal"></button>
                      </div>
                      <div class="modal-body" style="max-height:60vh; overflow:auto;">
                        <p class="small text-muted">Distribute the quantities that exceed the base package licence across other available licences. Suggested allocations are prefilled — adjust as needed.</p>

                        <div v-if="overflowAllocations.length === 0" class="alert alert-warning">No allocation candidates found for the selected overflow items.</div>

                        <div v-for="alloc in overflowAllocations" :key="alloc.speciesId" class="mb-4 border rounded p-2">
                          <div class="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{{ alloc.name }}</strong>
                              <div class="small text-muted">Requested: {{ alloc.requestedQty }} · Licence limit: {{ alloc.regLimit }} · Exceeds by: {{ alloc.overflowQty }}</div>
                            </div>
                            <div class="text-end">
                              <button type="button" class="btn btn-sm btn-outline-secondary me-2" @click="() => fillSuggestedAlloc(alloc)">Use suggested</button>
                              <button type="button" class="btn btn-sm btn-outline-info" @click="() => clearAllocations(alloc)">Clear</button>
                            </div>
                          </div>

                          <div class="mt-2">
                            <table class="table table-sm">
                              <thead>
                                <tr>
                                  <th>Package</th>
                                  <th class="text-center">Licence Qty</th>
                                  <th class="text-center">Unit Price</th>
                                  <th class="text-center">Assign Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(c, idx) in alloc.userAllocations" :key="c.packageId">
                                  <td>{{ c.packageName }}</td>
                                  <td class="text-center">{{ c.maxQty }}</td>
                                  <td class="text-center">{{ formatCurrency(c.unitPrice || 0) }}</td>
                                  <td class="text-center" style="width:120px">
                                    <input type="number" class="form-control form-control-sm text-center" v-model.number="alloc.userAllocations[idx].allocatedQty" :min="0" :max="c.maxQty" style="width:80px; margin:0 auto;" />
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <div class="text-end small text-muted">Total assigned: {{ allocationAssignedTotal(alloc) }} / {{ alloc.overflowQty }}</div>
                          </div>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeOverflowAllocationModal">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="applyAllocationsAndContinue">Apply allocations and continue</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Linked Species</label>
                  <select v-model="itemForm.linked_species_item_id" class="form-select">
                    <option value="">None</option>
                    <option v-for="species in speciesList" :key="species.id" :value="species.id">
                      {{ species.name }}
                    </option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Description <span class="text-danger">*</span></label>
                  <input v-model="itemForm.description" type="text" class="form-control" required
                    placeholder="Enter item description">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Quantity</label>
                  <input v-model.number="itemForm.quantity" type="number" class="form-control" min="1" placeholder="1">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Unit Amount</label>
                  <input v-model.number="itemForm.unit_amount" type="number" class="form-control" step="0.01" min="0"
                    placeholder="0.00">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Total Amount</label>
                  <input v-model.number="itemForm.total_amount" type="number" class="form-control" step="0.01" min="0"
                    :placeholder="calculatedTotal">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Rate Direction</label>
                  <select v-model="itemForm.rate_direction" class="form-select">
                    <option :value="null">Select...</option>
                    <option value="INCREASE">Increase (+)</option>
                    <option value="DECREASE">Decrease (-)</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Amount Source</label>
                  <select v-model="itemForm.amount_source" class="form-select">
                    <option :value="null">Select...</option>
                    <option value="MANUAL">Manual</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <div class="form-check mt-4">
                    <input v-model="itemForm.is_optional" type="checkbox" class="form-check-input" id="isOptional">
                    <label class="form-check-label" for="isOptional">Optional Item</label>
                  </div>
                  <div class="form-check">
                    <input v-model="itemForm.is_estimate" type="checkbox" class="form-check-input" id="isEstimate">
                    <label class="form-check-label" for="isEstimate">Estimate</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeItemModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveItem" :disabled="savingItem">
              <span v-if="savingItem" class="spinner-border spinner-border-sm me-1"></span>
              {{ editingItem ? 'Update' : 'Add' }} Item
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showItemModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesInquiriesStore } from '@/stores/bushman/sales-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useSpeciesStore } from '@/stores/bushman/species-store'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import Swal from 'sweetalert2'
import type { Pricing, PricingItem, PricingStatus, ItemType, RateDirection, AmountSource } from '@/stores/bushman/salesEnquiry'

const props = defineProps<{
  enquiryId: number
  initialPricings?: Pricing[]
  enquiryData?: any // Full enquiry data with species, extras, participants
}>()

const emit = defineEmits<{
  (e: 'update'): void
}>()

const router = useRouter()
const salesStore = useSalesInquiriesStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const speciesStore = useSpeciesStore()

// State
const pricings = ref<Pricing[]>([])
const expandedPricings = ref<number[]>([])
const loadingPricings = ref(false)
const loadingPricingDetails = ref<number | null>(null)
const showAddPricingModal = ref(false)
const showItemModal = ref(false)
const savingPricing = ref(false)
const savingItem = ref(false)
const duplicatingPricingId = ref<number | null>(null)
const generatingQuotation = ref(false)
const editingPricing = ref<Pricing | null>(null)
const editingItem = ref<PricingItem | null>(null)
const currentPricingForItem = ref<Pricing | null>(null)

// Pending save state used when allocation modal is shown
const pendingSaveItems = ref<any[] | null>(null)
const pendingSaveCallback = ref<Function | null>(null)

// Reference data
const priceStructures = ref<any[]>([])
const huntingTypes = ref<any[]>([])
const currencies = ref<any[]>([])
const speciesList = ref<any[]>([])
const pricePreviewData = ref<any>(null)
const loadingPreview = ref(false)

// Overflow auto‑assign toggle + allocation state
const autoAssignOverflow = ref(true) // default ON for convenience
const showOverflowAllocationModal = ref(false)
const overflowAllocations = ref<any[]>([])
const allPackagesList = ref<any[]>([])
const packageItemsCache = ref<Record<number, any[]>>({})
const fullPackageSpeciesCache = ref<Record<number, any[]>>({}) // cache: salesPackageSetId -> full species list
const loadingPackages = ref(false)

// Selection state for quotation items
const selectedItems = ref<Record<string, boolean>>({})
const itemPrices = ref<Record<string, any>>({})

// Forms
const pricingForm = ref({
  price_structure_detail_id: '',
  hunting_type_id: '',
  currency_id: '',
  status: 'DRAFT' as PricingStatus,
})

const itemForm = ref({
  item_type: '' as ItemType | '',
  item_id: null as number | null,
  linked_species_item_id: '' as number | '',
  description: '',
  quantity: 1,
  unit_amount: 0,
  total_amount: 0,
  rate_direction: 'INCREASE' as RateDirection,
  amount_source: 'MANUAL' as AmountSource,
  is_estimate: false,
  is_optional: false,
})

// Computed
const canAddPricing = computed(() => {
  // Don't show while loading or if a quotation already exists
  if (loadingPricings.value) return false
  if (pricings.value.length > 0) return false
  return props.enquiryId > 0
})

const totalAmount = computed(() => {
  return pricings.value.reduce((sum, p) => sum + (p.total_amount || 0), 0)
})

const lockedCount = computed(() => {
  return pricings.value.filter(p => p.status === 'LOCKED').length
})

const calculatedTotal = computed(() => {
  return (itemForm.value.quantity * itemForm.value.unit_amount).toFixed(2)
})

const previewPackageDetail = computed(() => {
  return pricePreviewData.value?.price_structure_detail || props.enquiryData?.price_structure_detail || null
})

const previewStructure = computed(() => {
  return pricePreviewData.value?.price_structure || null
})

const previewSummary = computed(() => {
  return pricePreviewData.value?.summary || null
})

const previewDays = computed(() => {
  return previewPackageDetail.value?.hunt_length_days || props.enquiryData?.preference?.no_of_days || 0
})

// Map species → regulatory licence qty from the enquiry's preview (base package)
const baseSpeciesQtyMap = computed(() => {
  const map = new Map<number, number>()
  const pd = pricePreviewData.value || props.enquiryData
  if (!pd) return map

  // Prefer regulatory_package.species_by_category when present
  if (pd?.regulatory_package?.species_by_category && Array.isArray(pd.regulatory_package.species_by_category)) {
    pd.regulatory_package.species_by_category.forEach((catGroup: any) => {
      ;(catGroup.species || []).forEach((sp: any) => {
        const id = sp.id || sp.item_id
        const qty = Number(sp.quantity) || 0
        if (id && qty > 0) map.set(Number(id), qty)
      })
    })
    if (map.size > 0) return map
  }

  // Fallback to preview species array
  if (Array.isArray(pd.species)) {
    pd.species.forEach((sp: any) => {
      const id = sp.item_id || sp.id
      const qty = Number(sp.quantity) || 0
      if (id && qty > 0) map.set(Number(id), qty)
    })
  }
  return map
})

// Get all sales packages (creation-metadata) — used to find candidate licences for overflow allocations
const loadAllPackagesList = async () => {
  if (allPackagesList.value.length > 0) return
  loadingPackages.value = true
  try {
    const apiBase = String(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/\/+$/, '')
    const resp = await salesStore.getCreationMetadata ? await salesStore.getCreationMetadata() : await salesStore.loadCreationMetadata?.()
    // fallback: fetch directly if store helper not available
    let data = resp?.data || resp
    if (!data || !data.price_structures) {
      const r = await fetch(`${apiBase}/sales-enquiries/creation-metadata`)
      data = (await r.json())?.data || (await r.json())
    }

    const packages: any[] = []
    if (Array.isArray(data.price_structures)) {
      data.price_structures.forEach((ps: any) => {
        if (Array.isArray(ps.details)) {
          ps.details.forEach((detail: any) => {
            const salesPkg = detail.sales_packages && detail.sales_packages.length > 0 ? detail.sales_packages[0] : null
            packages.push({
              id: detail.id,
              name: detail.name || `${ps.name} - ${detail.hunt_length || ''}`,
              sales_package: salesPkg,
              regulatory_package: salesPkg?.regulatory_package || null,
            })
          })
        }
      })
    }
    allPackagesList.value = packages
  } catch (err) {
    console.error('loadAllPackagesList error:', err)
  } finally {
    loadingPackages.value = false
  }
}

// Load package items (cached) — same shape as CreateQuotation.vue's helper
const loadPackageItemsForPackage = async (packageId: number): Promise<any[]> => {
  if (packageItemsCache.value[packageId]) return packageItemsCache.value[packageId]
  try {
    const response = await salesStore.previewPriceItems(packageId)
    const data = response?.data || response
    const items: any[] = []
    const existingTrophyIds = new Set((props.enquiryData?.pricings?.[0]?.items_by_type?.TROPHY || []).map((t: any) => t.item_id))

    // Build species qty map from package regulatory_package (if present)
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

    if (Array.isArray(data.trophy_fees)) {
      data.trophy_fees.forEach((tf: any) => {
        const itemId = tf.item_id || tf.species_id || tf.id
        const itemName = tf.item_name || tf.species_name || tf.name || 'Unknown'
        const regulatoryQty = speciesQtyMap.get(Number(itemId)) || 0
        items.push({ id: itemId, name: itemName, unit_price: parseFloat(tf.amount) || 0, regulatory_qty: regulatoryQty, _alreadyInQuotation: existingTrophyIds.has(itemId) })
      })
    }

    packageItemsCache.value[packageId] = items
    return items
  } catch (err) {
    console.error('loadPackageItemsForPackage error:', err)
    return []
  }
}

// Load ALL species (Main + Normal) from a sales-package-set
const loadFullPackageSpecies = async (salesPackageSetId: number) => {
  if (fullPackageSpeciesCache.value[salesPackageSetId]) return fullPackageSpeciesCache.value[salesPackageSetId]
  try {
    const apiBase = String(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
    const resp = await fetch(`${apiBase}/settings/sales-package-sets/${salesPackageSetId}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await resp.json()
    const fullPkgData = json?.data || json
    if (fullPkgData?.species && Array.isArray(fullPkgData.species)) {
      fullPackageSpeciesCache.value[salesPackageSetId] = fullPkgData.species.map((item: any) => ({
        id: item.id,
        species_id: item.species?.id || item.species_id,
        name: item.species?.name || item.name,
        subtype: item.species?.subtype || item.subtype || 'MAIN_SPECIE',
        quantity: item.quantity || 1,
      }))
    } else {
      fullPackageSpeciesCache.value[salesPackageSetId] = []
    }
  } catch (error) {
    console.error('loadFullPackageSpecies error:', error)
    fullPackageSpeciesCache.value[salesPackageSetId] = []
  }
  return fullPackageSpeciesCache.value[salesPackageSetId]
}

// All species from the current package (MAIN + NORMAL)
const currentFullPackageSpecies = computed(() => {
  const detailId = props.enquiryData?.price_structure_detail?.id
    || props.enquiryData?.price_structure_detail_id
  const pkg = detailId ? allPackagesList.value.find((p: any) => p.id === detailId) : null
  const spSetId = pkg?.sales_package?.id
  if (!spSetId) return []
  return fullPackageSpeciesCache.value[spSetId] || []
})

// Prepare overflow allocation suggestions for selected items (returns array of allocations)
const prepareOverflowAllocations = async (itemsToCheck: any[]) => {
  // Ensure packages loaded
  await loadAllPackagesList()

  const allocations: any[] = []
  // iterate selected items and detect overflow for TROPHY items
  for (const priceKey in itemPrices.value) {
    const price = itemPrices.value[priceKey]
    if (!price || price.item_type !== 'TROPHY') continue
    const speciesId = price.item_id
    if (!speciesId) continue
    const requestedQty = Number(price.quantity || 1)
    const regLimit = baseSpeciesQtyMap.value.get(Number(speciesId)) || 0
    if (regLimit > 0 && requestedQty > regLimit) {
      const overflowQty = requestedQty - regLimit
      // find candidate packages (exclude enquiry's base price_structure_detail)
      const candidates: any[] = []
      const currentDetailId = props.enquiryData?.price_structure_detail?.id || null
      for (const pkg of allPackagesList.value) {
        if (!pkg.regulatory_package) continue
        if (pkg.id === currentDetailId) continue
        // find species in regulatory_package
        for (const cg of pkg.regulatory_package.species_by_category || []) {
          const sp = (cg.species || []).find((s: any) => Number(s.id) === Number(speciesId))
          if (sp) {
            // load package items to get unit price
            const pkgItems = await loadPackageItemsForPackage(pkg.id)
            const match = pkgItems.find((it: any) => Number(it.id) === Number(speciesId))
            candidates.push({ packageId: pkg.id, packageName: pkg.name || '', regQty: Number(sp.quantity) || 0, unitPrice: match?.unit_price ?? 0 })
            break
          }
        }
      }

      // Suggest allocation: try to fill across candidates in order (by regQty desc)
      candidates.sort((a: any, b: any) => b.regQty - a.regQty)
      const suggested: any[] = []
      let remaining = overflowQty
      for (const c of candidates) {
        if (remaining <= 0) break
        const take = Math.min(remaining, c.regQty || remaining)
        if (take > 0) {
          suggested.push({ packageId: c.packageId, packageName: c.packageName, maxQty: c.regQty, unitPrice: c.unitPrice, allocatedQty: take })
          remaining -= take
        }
      }

      allocations.push({ priceKey, speciesId, name: price.description || price.linked_species_item_id || 'Species', requestedQty, regLimit, overflowQty, candidates, suggested })
    }
  }
  return allocations
}

// Apply allocations (mutates items array to split base + extra items)
const applyAllocationsToItems = (items: any[], allocationsToApply: any[]) => {
  // For each allocation entry, reduce the base item qty to regLimit and push new item lines for allocations
  for (const alloc of allocationsToApply) {
    const priceKey = alloc.priceKey
    const originalPrice = itemPrices.value[priceKey]
    if (!originalPrice) continue

    const speciesId = alloc.speciesId
    const baseQty = Math.min(Number(originalPrice.quantity || 1), Number(alloc.regLimit || 0))
    const overflow = alloc.overflowQty

    // Update base item quantity (cap to licence)
    originalPrice.quantity = baseQty
    originalPrice.total_amount = (originalPrice.quantity || 1) * (originalPrice.unit_amount || 0) * ((originalPrice.item_durations ?? 1))

    // For each allocation candidate with allocatedQty > 0, append a new price object to items
    for (const cand of alloc.userAllocations || alloc.suggested || []) {
      const q = Number(cand.allocatedQty || 0)
      if (!q || q <= 0) continue
      const newPrice = {
        item_type: 'TROPHY',
        item_id: speciesId,
        linked_species_item_id: speciesId,
        description: `${alloc.name} (Licence: ${cand.packageName})`,
        quantity: q,
        unit_amount: Number(cand.unitPrice || originalPrice.unit_amount || 0),
        total_amount: q * Number(cand.unitPrice || originalPrice.unit_amount || 0),
        rate_direction: 'INCREASE',
        amount_source: 'SYSTEM',
        is_estimate: false,
        is_optional: false,
      }
      items.push(newPrice)
    }
  }
}

// Small helper to validate allocations sum == overflow
const validateAllocations = (alloc: any) => {
  const sum = (alloc.userAllocations || alloc.suggested || []).reduce((s: number, a: any) => s + Number(a.allocatedQty || 0), 0)
  return sum === Number(alloc.overflowQty || 0)
}

// Get available candidate packages for a species (used by UI)
const getCandidatesForSpecies = (speciesId: number) => {
  const alloc = overflowAllocations.value.find((a: any) => Number(a.speciesId) === Number(speciesId))
  return alloc ? alloc.candidates || [] : []
}

// Show allocation modal and prefill userAllocations from suggested
const openOverflowAllocationModal = (allocs: any[]) => {
  overflowAllocations.value = allocs.map((a: any) => {
    // ensure userAllocations is always present and editable in the modal
    if (a.suggested && a.suggested.length) {
      return { ...a, userAllocations: a.suggested.map((s: any) => ({ ...s })) }
    }
    // start with candidates (allocatedQty default 0)
    const fromCandidates = (a.candidates || []).map((c: any) => ({ ...c, allocatedQty: 0 }))
    return { ...a, userAllocations: fromCandidates }
  })
  showOverflowAllocationModal.value = true
}

// Close allocation modal
const closeOverflowAllocationModal = () => {
  showOverflowAllocationModal.value = false
  overflowAllocations.value = []
}

// When user confirms allocations, apply to outgoing items and continue save flow
const confirmAndApplyAllocations = (items: any[], proceedSaveCallback: Function) => {
  // Validate every allocation
  for (const alloc of overflowAllocations.value) {
    if (!validateAllocations(alloc)) {
      Swal.fire({ title: 'Invalid allocation', text: `Allocated quantities for "${alloc.name}" do not sum to the overflow (${alloc.overflowQty}).`, icon: 'warning' })
      return
    }
  }

  // Apply allocations
  applyAllocationsToItems(items, overflowAllocations.value)
  closeOverflowAllocationModal()
  // Continue save flow
  proceedSaveCallback()
}

// Fill suggested allocations for a single allocation entry (used by UI)
const fillSuggestedAlloc = (alloc: any) => {
  alloc.userAllocations = (alloc.candidates || []).map((c: any) => ({ ...c, allocatedQty: Math.min(c.maxQty || 0, alloc.overflowQty) }))
}

const allocationAssignedTotal = (alloc: any) => {
  const arr = alloc.userAllocations && alloc.userAllocations.length ? alloc.userAllocations : (alloc.suggested && alloc.suggested.length ? alloc.suggested : alloc.candidates || [])
  return arr.reduce((s: number, a: any) => s + Number(a.allocatedQty || 0), 0)
}

const applyAllocationsAndContinue = () => {
  confirmAndApplyAllocations(pendingSaveItems.value || [], pendingSaveCallback.value || (() => {}))
}

const clearAllocations = (alloc: any) => {
  alloc.userAllocations = (alloc.candidates || []).map((c: any) => ({ ...c, allocatedQty: 0 }))
}
// Get available priceable items (existing code continues...)

// Get enquiry items (species, extras, participants)
const enquirySpecies = computed(() => {
  return props.enquiryData?.item_preferences || []
})

const enquirySafariExtras = computed(() => {
  return props.enquiryData?.safari_extras || []
})

const enquiryParticipants = computed(() => {
  const pref = props.enquiryData?.preference
  if (!pref) return []

  const participants = []

  // Handle companion hunters
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

  // Handle general participants (treated as companion hunters if specific counts are missing)
  if (pref.no_of_participants > 0 && participants.length === 0) {
    participants.push({
      type: 'COMPANION',
      count: pref.no_of_participants,
      label: `Companion Hunters (${pref.no_of_participants})`,
    })
  }

  return participants
})

const availablePriceableItems = computed(() => {
  const items = []
  const packageDetail = previewPackageDetail.value

  // Add Package as the first priceable item (total package amount for all days, not per-day)
  if (packageDetail) {
    const packageAmount = parseFloat(packageDetail.amount) || 0
    const noOfDays = packageDetail.hunt_length_days || props.enquiryData?.preference?.no_of_days
    items.push({
      category: 'Package',
      items: [{
        id: 'package_base',
        name: `${packageDetail.name || 'Hunting Package'} (${noOfDays} days)`,
        code: packageDetail.code || '',
        quantity: 1,
        type: 'PACKAGE',
        suggested_price: packageAmount,
      }]
    })
  }

  // Add species — merge enquiry preferences with ALL package species (Main + Normal)
  const previewSpecies = pricePreviewData.value?.species || []
  const enquirySpeciesIds = new Set(enquirySpecies.value.map((sp: any) => String(sp.item_id)))

  // Start with enquiry preferences
  const allSpecies: any[] = [...enquirySpecies.value]
  // Add any package species not already in preferences
  for (const pkgSp of currentFullPackageSpecies.value) {
    const specId = String(pkgSp.species_id || pkgSp.id)
    if (!enquirySpeciesIds.has(specId)) {
      allSpecies.push({
        item_id: pkgSp.species_id || pkgSp.id,
        item_name: pkgSp.name,
        desired_quantity: pkgSp.quantity || 1,
        priority: 'NICE_TO_HAVE',
      })
    }
  }

  const speciesItems = allSpecies.map((sp: any) => {
    // Look up pricing from preview data
    const previewMatch = previewSpecies.find((ps: any) => String(ps.item_id) === String(sp.item_id))
    const trophyFee = pricePreviewData.value?.trophy_fees?.find(
      (tf: any) => String(tf.item_id) === String(sp.item_id) || String(tf.species_id) === String(sp.item_id)
    )
    return {
      id: sp.item_id,
      name: cleanItemName(previewMatch?.item_name || sp.item_name || sp.species_name || 'Unknown Species'),
      code: previewMatch?.item_code || '',
      quantity: sp.desired_quantity || previewMatch?.quantity || 1,
      type: 'TROPHY',
      suggested_price: parseFloat(trophyFee?.amount) || 0,
      priority: sp.priority || 'NICE_TO_HAVE',
    }
  })

  if (speciesItems.length > 0) {
    items.push({
      category: 'Species (Trophy Fees)',
      items: speciesItems,
    })
  }

  // Add safari extras — only the ones the client chose in the enquiry, with prices from preview data
  const previewExtras = pricePreviewData.value?.safari_extras || []
  const hasObserverParticipants = enquiryParticipants.value.some((part: any) => part.type === 'OBSERVER')
  const extrasItems = enquirySafariExtras.value
    .filter((extra: any) => {
      if (!hasObserverParticipants) return true
      const name = String(extra.item_name || '').toLowerCase()
      return !name.includes('observer')
    })
    .map((extra: any) => {
      // Look up pricing from preview data
      const previewMatch = previewExtras.find((pe: any) => String(pe.item_id || pe.id) === String(extra.item_id))
      const baseQuantity = extra.desired_quantity ?? 1
      const effective = (extra.item_durations != null)
        ? extra.item_durations
        : (previewMatch?.effective_duration ?? previewMatch?.item_durations ?? previewDays.value ?? 1)
      const shouldMultiply = isDurationRelevant(previewMatch) || isDurationRelevant(extra)
      const qty = shouldMultiply ? baseQuantity * (effective ?? 1) : baseQuantity
      return {
        id: extra.item_id,
        name: cleanItemName(previewMatch?.item_name || extra.item_name || 'Extra'),
        code: previewMatch?.item_code || '',
        quantity: baseQuantity,
        _calc_quantity: qty,
        _base_quantity: baseQuantity,
        type: 'EXTRA',
        suggested_price: parseFloat(previewMatch?.amount) || 0,
        effective_duration: effective,
        _enquiry_quantity: extra.desired_quantity ?? null,
        _enquiry_item_durations: extra.item_durations ?? null,
        _duration_applied: shouldMultiply,
      }
    })

  if (extrasItems.length > 0) {
    items.push({
      category: 'Safari Extras',
      items: extrasItems,
    })
  }

  // Add participants (companions/observers/general) as LOGISTICS costs
  if (enquiryParticipants.value.length > 0) {
    items.push({
      category: 'Participants',
      items: enquiryParticipants.value.map((part: any) => {
        let cost = 0
        let quantity = part.count
        if (part.type === 'COMPANION') {
          cost = getCompanionCostAmount()
        } else if (part.type === 'OBSERVER') {
          const observerExtra = getObserverExtra()
          cost = parseFloat(observerExtra?.amount) || 0
          quantity = getPerDayQuantity(observerExtra?.pricing_unit, part.count, observerExtra?.effective_duration ?? observerExtra?.item_durations)
        } else {
          cost = getCompanionCostAmount()
        }

        return {
          id: `participant_${part.type}`,
          name: part.type === 'COMPANION' ? getCompanionCostLabel(part.label) : part.label,
          code: '',
          quantity: quantity,
          type: 'LOGISTICS',
          suggested_price: cost,
        }
      })
    })
  }

  return items
})

// Get enquiry package/hunting/currency info
const enquiryPackageName = computed(() => {
  const existingPricing = pricings.value?.[0]
  return props.enquiryData?.price_structure_detail?.name ||
    existingPricing?.price_structure_detail?.name ||
    props.enquiryData?.pricings?.[0]?.price_structure_detail?.name ||
    props.enquiryData?.package_name || 'N/A'
})

const enquiryHuntingType = computed(() => {
  const existingPricing = pricings.value?.[0]
  return props.enquiryData?.hunting_type_name ||
    existingPricing?.hunting_type ||
    props.enquiryData?.pricings?.[0]?.hunting_type ||
    props.enquiryData?.hunting_type || 'N/A'
})

const enquiryCurrency = computed(() => {
  const existingPricing = pricings.value?.[0]
  return props.enquiryData?.currency ||
    existingPricing?.currency ||
    props.enquiryData?.pricings?.[0]?.currency ||
    props.enquiryData?.currency_code || 'USD'
})

const enquiryPriceStructureDetailId = computed(() => {
  const existingPricing = pricings.value?.[0]
  return props.enquiryData?.price_structure_detail_id ||
    existingPricing?.price_structure_detail_id ||
    props.enquiryData?.pricings?.[0]?.price_structure_detail_id ||
    null
})

const enquiryHuntingTypeId = computed(() => {
  const existingPricing = pricings.value?.[0]
  return props.enquiryData?.hunting_type_id ||
    existingPricing?.hunting_type_id ||
    props.enquiryData?.pricings?.[0]?.hunting_type_id ||
    null
})

const enquiryCurrencyId = computed(() => {
  const existingPricing = pricings.value?.[0]
  return props.enquiryData?.currency_id ||
    existingPricing?.currency_id ||
    props.enquiryData?.pricings?.[0]?.currency_id ||
    1
})

// Selected items count and total
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

const getItemsCount = (pricing: Pricing) => {
  if (pricing.items && pricing.items.length > 0) {
    // Exclude TROPHY items from count — they are informational only
    return pricing.items.filter((i: any) => i.item_type !== 'TROPHY').length
  }
  const summary = (pricing as any).summary
  if (summary) {
    const totalItems = summary.total_items || 0
    // Compute trophy count from actual items since server may not provide trophy_fees_count
    const trophyCount = ((pricing as any).items_by_type?.TROPHY || []).length
    return totalItems - trophyCount
  }
  return 0
}

// Get total amount excluding trophy fees (trophy fees are informational only)
const getTotalExcludingTrophy = (pricing: Pricing) => {
  const summary = (pricing as any).summary
  if (summary) {
    const subtotal = summary.subtotal || 0
    const trophyTotal = summary.trophy_total || 0
    return subtotal - trophyTotal
  }
  // Fallback: subtract trophy items manually if summary not available
  const total = pricing.total_amount || 0
  if (pricing.items && pricing.items.length > 0) {
    const trophySum = pricing.items
      .filter((i: any) => i.item_type === 'TROPHY')
      .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0)
    return total - trophySum
  }
  return total
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

const formatItemType = (type: string) => {
  const types: Record<string, string> = {
    PACKAGE: 'Hunting Package',
    TROPHY: 'Trophy Fee',
    EXTRA: 'Safari Extra',
    LOGISTICS: 'Companion Hunter',
    ADJUSTMENT: 'Price Adjustment',
  }
  return types[type] || type
}

const cleanItemName = (name: string) => {
  if (!name) return name
  // Remove patterns like (SPC-002), (EXT-...), etc.
  return name.replace(/\s*\([A-Z]+-[A-Z0-9-]+\)\s*/g, '').trim()
}

const formatPriority = (priority: string) => {
  const priorities: Record<string, string> = {
    MUST_HAVE: 'Must Have',
    NICE_TO_HAVE: 'Nice to Have',
  }
  return priorities[priority] || priority
}

const getPerDayQuantity = (pricingUnit: string | undefined, baseQuantity: number, daysOverride?: number) => {
  if (!pricingUnit) return baseQuantity
  if (pricingUnit.toLowerCase().includes('per_day')) {
    const days = daysOverride ?? previewDays.value ?? 1
    return baseQuantity * days
  }
  return baseQuantity
}

// Determine if an item should apply duration when calculating quantity (based on name or pricing unit)
const durationRelevantByName = (name: string | undefined) => {
  if (!name) return false
  const n = name.toLowerCase()
  // Explicit NO-duration items
  if (n.includes('additional gun permit') || n.includes('gun permit') || n.includes('ammo')) return false
  // Explicit duration-relevant items
  if (
    n.includes('firearm') ||
    n.includes('baiting') ||
    n.includes('photographic') ||
    n.includes('camera') ||
    n.includes('cameraman') ||
    n.includes('observer')
  ) return true
  return false
}

const isDurationRelevant = (item: any) => {
  const name = item?.item_name || item?.name || item?.description || ''
  if (durationRelevantByName(name)) return true
  if (item?.pricing_unit && String(item.pricing_unit).toLowerCase().includes('per_day')) return true
  return false
} 

const getCompanionCostAmount = () => {
  const costs = pricePreviewData.value?.companion_costs || []
  if (!costs.length) return 0
  const days = previewDays.value
  const matched = costs.find((cost: any) => Number(cost.hunt_length_days) === Number(days))
  const amount = matched?.amount || costs[0]?.amount || 0
  return parseFloat(amount) || 0
}

const getCompanionCostLabel = (fallbackLabel: string) => {
  const costs = pricePreviewData.value?.companion_costs || []
  if (!costs.length) return fallbackLabel
  const days = previewDays.value
  const matched = costs.find((cost: any) => Number(cost.hunt_length_days) === Number(days))
  return matched?.item_name || fallbackLabel
}

const getObserverExtra = () => {
  const extras = pricePreviewData.value?.safari_extras || []
  return extras.find((extra: any) => {
    const name = String(extra.item_name || '').toLowerCase()
    const code = String(extra.item_code || '').toLowerCase()
    return name.includes('observer') || code.includes('observer')
  }) || null
}

const getOptionalAmount = (pricing: Pricing) => {
  if (!pricing.items) return 0
  return pricing.items
    .filter(i => i.is_optional)
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)
}

const getRequiredAmount = (pricing: Pricing) => {
  if (!pricing.items) return 0
  return pricing.items
    .filter(i => !i.is_optional)
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)
}

const togglePricingDetails = async (pricingId: number) => {
  const index = expandedPricings.value.indexOf(pricingId)
  if (index > -1) {
    expandedPricings.value.splice(index, 1)
  } else {
    expandedPricings.value.push(pricingId)

    // Fetch enriched pricing data with items
    await loadEnrichedPricingData(pricingId)
  }
}

const loadEnrichedPricingData = async (pricingId: number) => {
  loadingPricingDetails.value = pricingId
  try {
    const response = await salesEnquiryService.getPricing(pricingId)
    if (response.success && response.data) {
      // Update the pricing in the list with enriched data
      const idx = pricings.value.findIndex(p => p.id === pricingId)
      if (idx !== -1) {
        const summary = response.data.summary || {}
        const subtotal = summary.subtotal || 0
        const trophyTotal = summary.trophy_total || 0
        const enrichedPricing = {
          ...pricings.value[idx],
          items: response.data.items || [],
          total_amount: subtotal - trophyTotal,
        } as any
        if (response.data.summary) {
          enrichedPricing.summary = response.data.summary
        }
        pricings.value[idx] = enrichedPricing
      }
    }
  } catch (error) {
    console.error('Error loading pricing details:', error)
  } finally {
    loadingPricingDetails.value = null
  }
}

const generateQuotation = () => {
  // Cache enquiry data + resolved IDs so the Create Quotation page can use them
  if (props.enquiryData) {
    try {
      const dataToCache = {
        ...props.enquiryData,
        _resolved_price_structure_detail_id: enquiryPriceStructureDetailId.value,
        _resolved_hunting_type_id: enquiryHuntingTypeId.value,
        _resolved_currency_id: enquiryCurrencyId.value,
      }
      sessionStorage.setItem('createQuotationEnquiryData', JSON.stringify(dataToCache))
    } catch (e) { /* ignore */ }
  }
  router.push(`/sales/enquiries/${props.enquiryId}/create-quotation`)
}

const navigateToEditQuotation = (pricing: Pricing) => {
  // Navigate to the edit quotation page with the pricing id
  router.push(`/sales/enquiries/${props.enquiryId}/quotation/${pricing.id}`)
}



const duplicatePricing = async (pricing: Pricing) => {
  const result = await Swal.fire({
    title: 'Duplicate Quotation?',
    text: 'This will create a new draft with the same line items.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, duplicate',
  })

  if (!result.isConfirmed) return

  duplicatingPricingId.value = pricing.id
  try {
    let sourceItems = pricing.items || []
    if (!sourceItems.length) {
      const pricingResponse = await salesEnquiryService.getPricing(pricing.id)
      if (pricingResponse?.success && pricingResponse?.data?.items) {
        sourceItems = pricingResponse.data.items
      }
    }

    const items = sourceItems.map((item: any) => ({
      item_type: item.item_type,
      item_id: typeof item.item_id === 'number' ? item.item_id : null,
      linked_species_item_id: typeof item.linked_species_item_id === 'number' ? item.linked_species_item_id : null,
      description: item.description || item.item_name || '',
      quantity: item.quantity || 1,
      unit_amount: item.unit_amount || 0,
      total_amount: item.total_amount || (item.quantity || 1) * (item.unit_amount || 0),
      rate_direction: item.rate_direction || 'INCREASE',
      amount_source: item.amount_source || 'MANUAL',
      is_estimate: !!item.is_estimate,
      is_optional: !!item.is_optional,
    }))

    const payload = {
      price_structure_detail_id: pricing.price_structure_detail_id,
      hunting_type_id: pricing.hunting_type_id,
      currency_id: pricing.currency_id,
      status: 'DRAFT',
      items,
    }

    const response = await salesStore.addPricing(props.enquiryId, payload)

    if (response.status === 200 || response.status === 201) {
      // Update enquiry status to IN_PROGRESS after creating/duplicating a quotation
      try {
        await salesEnquiryService.update(props.enquiryId, { status: 'IN_PROGRESS' })
      } catch (e) {
        console.warn('Could not update enquiry status:', e)
      }

      Swal.fire({
        title: 'Quotation Duplicated',
        text: `Created a new quotation with ${items.length} item${items.length === 1 ? '' : 's'}.`,
        icon: 'success',
        timer: 2000,
      })
      await loadPricings()
      emit('update')
    }
  } catch (error: any) {
    console.error('Error duplicating quotation:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || 'Failed to duplicate quotation',
      icon: 'error',
    })
  } finally {
    duplicatingPricingId.value = null
  }
}

const loadPricings = async (forceRemote = false) => {
  if (props.initialPricings && !forceRemote) {
    pricings.value = props.initialPricings
    return
  }

  if (props.enquiryId) {
    loadingPricings.value = true
    try {
      const response = await salesStore.getEnquiryPricings(props.enquiryId)
      if (response.status === 200 && response.data) {
        pricings.value = response.data.pricings || []
      }
    } catch (error) {
      console.error('Error loading pricings:', error)
    } finally {
      loadingPricings.value = false
    }
  }
}

const loadReferenceData = async () => {
  try {
    // Load price structures from price-list store
    const priceStructuresRes = await priceListStore.getPriceStructures()
    if (priceStructuresRes?.status === 200) {
      priceStructures.value = priceStructuresRes.data || []
    }

    // Load hunting types
    const huntingTypesRes = await settingsStore.getHuntingsTypes()
    if (huntingTypesRes?.status === 200) {
      huntingTypes.value = huntingTypesRes.data || []
    }

    // Load currencies
    const currenciesRes = await settingsStore.getCurrencies()
    if (currenciesRes?.status === 200) {
      currencies.value = currenciesRes.data || []
    }

    // Load species
    const speciesRes = await speciesStore.getSpecies()
    if (speciesRes?.status === 200) {
      speciesList.value = speciesRes.data || []
    }
  } catch (error) {
    console.error('Error loading reference data:', error)
  }
}

const loadPricePreview = async (priceStructureDetailId: number) => {
  if (!priceStructureDetailId) {
    pricePreviewData.value = null
    return
  }

  loadingPreview.value = true
  try {
    const response = await salesStore.previewPriceItems(priceStructureDetailId)
    if (response.status === 200 && response.data) {
      pricePreviewData.value = response.data?.data || response.data
    }
  } catch (error) {
    console.error('Error loading price preview:', error)
  } finally {
    loadingPreview.value = false
  }
}

// Pricing CRUD
const editPricing = (pricing: Pricing) => {
  editingPricing.value = pricing
  pricingForm.value = {
    price_structure_detail_id: String(pricing.price_structure_detail_id),
    hunting_type_id: String(pricing.hunting_type_id),
    currency_id: String(pricing.currency_id),
    status: pricing.status,
  }
  showAddPricingModal.value = true
}

const openAddPricingModal = () => {
  editingPricing.value = null
  pricingForm.value = {
    price_structure_detail_id: '',
    hunting_type_id: '',
    currency_id: '',
    status: 'DRAFT',
  }
  selectedItems.value = {}
  itemPrices.value = {}
  showAddPricingModal.value = true
}

const closeAddPricingModal = () => {
  showAddPricingModal.value = false
  editingPricing.value = null
  pricingForm.value = {
    price_structure_detail_id: '',
    hunting_type_id: '',
    currency_id: '',
    status: 'DRAFT',
  }
  selectedItems.value = {}
  itemPrices.value = {}
}

const ensureItemPrice = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (!itemPrices.value[key]) {
    const unitAmount = Number(item.suggested_price) || 0
    const quantity = Number(item.quantity) || 1
    itemPrices.value[key] = {
      item_type: item.type,
      item_id: typeof item.id === 'string' ? null : item.id,
      linked_species_item_id: item.type === 'TROPHY' ? item.id : null,
      description: item.name,
      quantity,
      unit_amount: unitAmount,
      total_amount: quantity * unitAmount,
      rate_direction: 'INCREASE',
      amount_source: 'SYSTEM',
      is_estimate: false,
      is_optional: false,
    }
  }
  return itemPrices.value[key]
}

const initializeItemPrice = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (selectedItems.value[key]) {
    const unitAmount = Number(item.suggested_price) || 0
    const quantity = Number(item.quantity) || 1
    const duration = (item._enquiry_item_durations != null) ? item._enquiry_item_durations : (item.effective_duration != null && item._duration_applied ? item.effective_duration : null)
    const daysMultiplier = (item._duration_applied && duration != null) ? duration : 1

    itemPrices.value[key] = {
      item_type: item.type,
      item_id: typeof item.id === 'string' ? null : item.id,
      linked_species_item_id: item.type === 'TROPHY' ? item.id : null,
      description: item.name,
      quantity: quantity,
      unit_amount: unitAmount,
      total_amount: quantity * unitAmount * daysMultiplier,
      rate_direction: 'INCREASE',
      amount_source: 'SYSTEM',
      is_estimate: false,
      is_optional: false,
      item_durations: duration,
    }
  }
}

const updateItemTotal = (category: string, itemId: any) => {
  const key = `${category}_${itemId}`
  if (itemPrices.value[key]) {
    const qty = itemPrices.value[key].quantity || 1
    const unit = itemPrices.value[key].unit_amount || 0
    // Determine days multiplier: prefer explicit itemPrices value, otherwise inspect original item
    let days = 1
    if (itemPrices.value[key].item_durations != null) {
      days = itemPrices.value[key].item_durations
    } else {
      const cat = availablePriceableItems.value.find((c: any) => c.category === category)
      const srcItem = cat?.items?.find((it: any) => String(it.id) === String(itemId))
      if (srcItem && srcItem._duration_applied) days = srcItem.effective_duration ?? 1
    }
    itemPrices.value[key].total_amount = qty * unit * days
  }
}

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

const selectAllSystemItems = () => {
  availablePriceableItems.value.forEach((category: any) => {
    category.items.forEach((item: any) => {
      const key = `${category.category}_${item.id}`
      if (!selectedItems.value[key]) {
        selectedItems.value[key] = true
        initializeItemPrice(category.category, item)
      }
    })
  })
}

const clearSelection = () => {
  selectedItems.value = {}
  itemPrices.value = {}
}

const savePricingWithItems = async () => {
  if (selectedItemsCount.value === 0) {
    Swal.fire({
      title: 'No Items Selected',
      text: 'Please select at least one item to include in the quotation',
      icon: 'warning',
    })
    return
  }

  savingPricing.value = true
  try {
    // Prepare items array
    let items: any[] = []
    const missingDescriptions: string[] = []

    for (const key in selectedItems.value) {
      if (!selectedItems.value[key]) continue

      // Ensure we have a backing price object for the selected item.
      let price = itemPrices.value[key]
      if (!price) {
        // Try to reconstruct from available priceable items using the key (category_id)
        const parts = key.split('_')
        const categoryName = parts.slice(0, parts.length - 1).join('_')
        const id = parts[parts.length - 1]
        const cat = availablePriceableItems.value.find((c: any) => c.category === categoryName)
        const srcItem = cat?.items?.find((it: any) => String(it.id) === String(id))
        price = ensureItemPrice(categoryName, srcItem || { id, name: '', quantity: 1, suggested_price: 0, type: 'ADJUSTMENT' })
      }

      // Ensure description is present; try to populate from preview/original item if missing
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
        text: 'Some selected items do not have descriptions. Please ensure each item has a description before creating the quotation.',
        icon: 'warning',
      })
      savingPricing.value = false
      return
    }

    // Always include all trophy fee items from the package (informational, not in grand total)
    const trophyCat = availablePriceableItems.value.find((c: any) => c.category === 'Species (Trophy Fees)')
    if (trophyCat) {
      const existingTrophyItemIds = new Set(items.filter((i: any) => i.item_type === 'TROPHY').map((i: any) => String(i.item_id)))
      for (const tItem of trophyCat.items) {
        if (existingTrophyItemIds.has(String(tItem.id))) continue
        items.push({
          item_type: 'TROPHY',
          item_id: tItem.id,
          description: tItem.name || '',
          quantity: tItem.quantity || 1,
          unit_amount: tItem.suggested_price || 0,
          total_amount: (tItem.quantity || 1) * (tItem.suggested_price || 0),
          rate_direction: 'INCREASE',
          amount_source: 'SYSTEM',
          is_estimate: false,
          is_optional: false,
        })
      }
    }

    // Final dedup: ensure no duplicate TROPHY items by item_id
    const seenTrophyIds = new Set<string>()
    items = items.filter((i: any) => {
      if (i.item_type !== 'TROPHY') return true
      const tid = String(i.item_id)
      if (seenTrophyIds.has(tid)) return false
      seenTrophyIds.add(tid)
      return true
    })

    // Helper to finalize creation (shared so we can defer when allocations are required)
    const doCreate = async (itemsToCreate: any[]) => {
      try {
        const payload = {
          price_structure_detail_id: enquiryPriceStructureDetailId.value,
          hunting_type_id: enquiryHuntingTypeId.value,
          currency_id: enquiryCurrencyId.value,
          status: 'DRAFT',
          items: itemsToCreate,
        }

        const response = await salesStore.addPricing(props.enquiryId, payload)

        if (response.status === 200 || response.status === 201) {
          // Update enquiry status to IN_PROGRESS after creating a quotation
          try {
            await salesEnquiryService.update(props.enquiryId, { status: 'IN_PROGRESS' })
          } catch (e) {
            console.warn('Could not update enquiry status:', e)
          }

          const nonTrophyCount = itemsToCreate.filter((i: any) => i.item_type !== 'TROPHY').length
          Swal.fire({ title: 'Success!', text: `Quotation created with ${nonTrophyCount} items`, icon: 'success', timer: 2000 })
          closeAddPricingModal()
          await loadPricings(true)
          emit('update')
        }
      } catch (err: any) {
        console.error('Error saving pricing (deferred):', err)
        Swal.fire({ title: 'Error', text: err.response?.data?.message || 'Failed to save quotation', icon: 'error' })
      } finally {
        savingPricing.value = false
      }
    }

    // --- Regulatory overflow handling ---
    // Detect trophy items that exceed the base package licence
    const overflowEntries: any[] = []
    items.forEach((it: any) => {
      if (it.item_type === 'TROPHY' && it.item_id) {
        const regLimit = baseSpeciesQtyMap.value.get(Number(it.item_id)) || 0
        if (regLimit > 0 && (it.quantity || 1) > regLimit) {
          overflowEntries.push({ item: it, overflowQty: (it.quantity || 1) - regLimit })
        }
      }
    })

    if (overflowEntries.length > 0 && autoAssignOverflow.value) {
      // Prepare allocations (suggestions). If suggestions exist, prompt user to confirm/split.
      const allocs = await prepareOverflowAllocations(items)
      if (allocs.length > 0) {
        // Store pending save and show allocation modal for user confirmation
        pendingSaveItems.value = items
        pendingSaveCallback.value = async () => await doCreate(pendingSaveItems.value || [])
        openOverflowAllocationModal(allocs)
        // waiting for user to confirm allocations (modal will call confirmAndApplyAllocations which calls pendingSaveCallback)
        return
      }
      // fall through to regular warning if no candidate packages found
    }

    // If overflow exists and user didn't auto-assign, warn and confirm (same behaviour as before)
    const regViolations: string[] = []
    for (const itm of items) {
      if (itm.item_type !== 'TROPHY' || !itm.item_id) continue
      const regLimit = baseSpeciesQtyMap.value.get(Number(itm.item_id)) || 0
      if (regLimit > 0 && (itm.quantity || 1) > regLimit) {
        regViolations.push(`<li><strong>${itm.description || itm.item_id}</strong>: qty ${itm.quantity} exceeds licence limit of ${regLimit} (exceeded by <strong>${(itm.quantity || 1) - regLimit}</strong>)</li>`)
      }
    }

    if (regViolations.length > 0) {
      const confirmed = await Swal.fire({
        title: '<i class="fa fa-exclamation-triangle text-danger"></i> Regulatory Limit Exceeded',
        html: `<p>The following species <strong>exceed their regulatory licence limits</strong>. This can lead to <strong>fines</strong>:</p><ul class="text-start">${regViolations.join('')}</ul><p class="mb-0">Do you want to proceed anyway?</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Create anyway',
        cancelButtonText: 'Go back and fix',
        width: 550,
      })
      if (!confirmed.isConfirmed) {
        savingPricing.value = false
        return
      }
    }

    // No regulatory blocking or user confirmed — create the quotation
    await doCreate(items)
  } catch (error: any) {
    console.error('Error saving pricing:', error)
    Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Failed to save quotation', icon: 'error' })
  } finally {
    // finalization handled in doCreate for deferred case; ensure saving flag cleared
    // savingPricing.value = false // doCreate already clears it
  }
}

const savePricing = async () => {
  if (!pricingForm.value.price_structure_detail_id || !pricingForm.value.hunting_type_id || !pricingForm.value.currency_id) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please fill in all required fields',
      icon: 'warning',
    })
    return
  }

  savingPricing.value = true
  try {
    const payload = {
      price_structure_detail_id: Number(pricingForm.value.price_structure_detail_id),
      hunting_type_id: Number(pricingForm.value.hunting_type_id),
      currency_id: Number(pricingForm.value.currency_id),
      status: pricingForm.value.status,
    }

    let response
    if (editingPricing.value) {
      response = await salesStore.updatePricing(editingPricing.value.id, payload)
    } else {
      response = await salesStore.addPricing(props.enquiryId, payload)
    }

    if (response.status === 200 || response.status === 201) {
      // Update enquiry status to IN_PROGRESS when creating a quotation
      if (!editingPricing.value) {
        try {
          await salesEnquiryService.update(props.enquiryId, { status: 'IN_PROGRESS' })
        } catch (e) {
          console.warn('Could not update enquiry status:', e)
        }
      }

      Swal.fire({
        title: 'Success!',
        text: `Quotation ${editingPricing.value ? 'updated' : 'created'} successfully`,
        icon: 'success',
        timer: 1500,
      })
      closeAddPricingModal()
      await loadPricings()
      emit('update')
    }
  } catch (error: any) {
    console.error('Error saving pricing:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || 'Failed to save quotation',
      icon: 'error',
    })
  } finally {
    savingPricing.value = false
  }
}

const confirmDeletePricing = (pricing: Pricing) => {
  Swal.fire({
    title: 'Delete Quotation?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await salesStore.deletePricing(pricing.id)
        if (response.status === 200 || response.status === 204) {
          pricings.value = pricings.value.filter((item) => item.id !== pricing.id)
          expandedPricings.value = expandedPricings.value.filter((id) => id !== pricing.id)
          Swal.fire('Deleted!', 'Quotation has been deleted.', 'success')
          await loadPricings(true)

          // If no quotations remain, revert enquiry status to NEW
          if (pricings.value.length === 0) {
            try {
              await salesEnquiryService.update(props.enquiryId, { status: 'NEW' })
            } catch (e) {
              console.error('Failed to revert enquiry status:', e)
            }
          }

          emit('update')
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete quotation', 'error')
      }
    }
  })
}

const confirmLockPricing = (pricing: Pricing) => {
  Swal.fire({
    title: 'Lock Quotation?',
    text: 'Once locked, this quotation cannot be edited or deleted.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    confirmButtonText: 'Yes, lock it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await salesStore.lockPricing(pricing.id)
        if (response.status === 200) {
          // Update enquiry status to QUOTED after locking a quotation
          try {
            await salesEnquiryService.update(props.enquiryId, { status: 'QUOTED' })
          } catch (e) {
            console.warn('Could not update enquiry status:', e)
          }

          Swal.fire('Locked!', 'Quotation has been locked.', 'success')
          await loadPricings()
          emit('update')
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to lock quotation', 'error')
      }
    }
  })
}

// Pricing Item CRUD
const showAddItemModal = (pricing: Pricing) => {
  currentPricingForItem.value = pricing
  editingItem.value = null
  resetItemForm()
  showItemModal.value = true
}

const editPricingItem = (pricing: Pricing, item: PricingItem) => {
  currentPricingForItem.value = pricing
  editingItem.value = item
  itemForm.value = {
    item_type: item.item_type,
    item_id: item.item_id || null,
    linked_species_item_id: item.linked_species_item_id || '',
    description: item.description,
    quantity: item.quantity,
    unit_amount: item.unit_amount,
    total_amount: item.total_amount,
    rate_direction: item.rate_direction,
    amount_source: item.amount_source,
    is_estimate: item.is_estimate,
    is_optional: item.is_optional,
  }
  showItemModal.value = true
}

const closeItemModal = () => {
  showItemModal.value = false
  currentPricingForItem.value = null
  editingItem.value = null
  resetItemForm()
}

const resetItemForm = () => {
  itemForm.value = {
    item_type: '',
    item_id: null,
    linked_species_item_id: '',
    description: '',
    quantity: 1,
    unit_amount: 0,
    total_amount: 0,
    rate_direction: 'INCREASE',
    amount_source: 'MANUAL',
    is_estimate: false,
    is_optional: false,
  }
}

const saveItem = async () => {
  if (!itemForm.value.item_type || !itemForm.value.description) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please fill in all required fields',
      icon: 'warning',
    })
    return
  }

  savingItem.value = true
  try {
    const payload = {
      item_type: itemForm.value.item_type,
      item_id: itemForm.value.item_id,
      linked_species_item_id: itemForm.value.linked_species_item_id || null,
      description: itemForm.value.description,
      quantity: itemForm.value.quantity || 1,
      unit_amount: itemForm.value.unit_amount || 0,
      total_amount: itemForm.value.total_amount || (itemForm.value.quantity * itemForm.value.unit_amount),
      rate_direction: itemForm.value.rate_direction,
      amount_source: itemForm.value.amount_source,
      is_estimate: itemForm.value.is_estimate,
      is_optional: itemForm.value.is_optional,
    }

    let response
    if (editingItem.value) {
      response = await salesStore.updatePricingItem(editingItem.value.id, payload)
    } else if (currentPricingForItem.value) {
      response = await salesStore.addPricingItem(currentPricingForItem.value.id, payload)
    }

    if (response && (response.status === 200 || response.status === 201)) {
      Swal.fire({
        title: 'Success!',
        text: `Item ${editingItem.value ? 'updated' : 'added'} successfully`,
        icon: 'success',
        timer: 1500,
      })
      closeItemModal()
      await loadPricings()
      emit('update')
    }
  } catch (error: any) {
    console.error('Error saving item:', error)
    Swal.fire({
      title: 'Error',
      text: error.response?.data?.message || 'Failed to save item',
      icon: 'error',
    })
  } finally {
    savingItem.value = false
  }
}

const handleInitItemDuration = (event: Event, category: string, itemId: any) => {
  const target = event.target as HTMLInputElement
  const value = target.value ? Number(target.value) : null
  const key = `${category}_${itemId}`
  if (itemPrices.value[key]) {
    itemPrices.value[key].item_durations = value
    updateItemTotal(category, itemId)
  }
}

const addItemFromPreview = (previewItem: any) => {
  const unitAmount = Number(previewItem.suggested_price) || 0
  const quantity = Number(previewItem.quantity) || 1
  itemForm.value = {
    item_type: previewItem.type,
    item_id: previewItem.id,
    linked_species_item_id: previewItem.type === 'TROPHY' ? previewItem.id : '',
    description: previewItem.name,
    quantity: quantity,
    unit_amount: unitAmount,
    total_amount: quantity * unitAmount,
    rate_direction: 'INCREASE',
    amount_source: 'SYSTEM',
    is_estimate: false,
    is_optional: false,
  }
}

const confirmDeleteItem = (pricing: Pricing, item: PricingItem) => {
  Swal.fire({
    title: 'Delete Item?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, delete it!',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await salesStore.deletePricingItem(item.id)
        if (response.status === 200 || response.status === 204) {
          Swal.fire('Deleted!', 'Item has been deleted.', 'success')
          await loadPricings()
          emit('update')
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete item', 'error')
      }
    }
  })
}

// Watch for prop changes
watch(() => props.initialPricings, (newVal) => {
  if (newVal) {
    pricings.value = newVal
  }
}, { deep: true })

watch(() => props.enquiryId, () => {
  loadPricings()
})

// Watch for modal opening to load preview + full package species
watch(() => showAddPricingModal.value, async (newVal) => {
  if (newVal && !editingPricing.value && enquiryPriceStructureDetailId.value) {
    loadPricePreview(Number(enquiryPriceStructureDetailId.value))
    // Pre-fetch full package species (Main + Normal) for trophy fees
    await loadAllPackagesList()
    const detailId = props.enquiryData?.price_structure_detail?.id
      || props.enquiryData?.price_structure_detail_id
    const pkg = detailId ? allPackagesList.value.find((p: any) => p.id === detailId) : null
    const spSetId = pkg?.sales_package?.id
    if (spSetId) loadFullPackageSpecies(spSetId)
  }
})

// Auto-calculate total when quantity or unit amount changes
watch([() => itemForm.value.quantity, () => itemForm.value.unit_amount], () => {
  if (!itemForm.value.total_amount || itemForm.value.total_amount === 0) {
    itemForm.value.total_amount = itemForm.value.quantity * itemForm.value.unit_amount
  }
})

// Watch for route changes to reload pricing when returning from create/edit quotation page
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  if (!oldPath) return
  // Returning from create-quotation or edit-quotation (quotation/:pricingId) to the enquiry detail page
  const comingFromQuotationPage = oldPath.includes('/create-quotation') || oldPath.includes('/quotation/')
  const landingOnEnquiryDetail = newPath.includes('/sales/enquiries/') && !newPath.includes('/quotation/') && !newPath.includes('/create-quotation')
  if (comingFromQuotationPage && landingOnEnquiryDetail) {
    loadPricings(true) // force remote to get fresh data including newly created quotations
  }
})

onMounted(async () => {
  // Always force remote reload to get fresh data (avoids stale initialPricings from sessionStorage cache)
  await loadPricings(true)
  loadReferenceData()

  // Auto-expand the first pricing and load its items
  if (pricings.value.length > 0) {
    const firstPricing = pricings.value[0]
    expandedPricings.value.push(firstPricing.id)
    await loadEnrichedPricingData(firstPricing.id)
  }
})
</script>

<style scoped>
.pricing-section {
  padding: 1.25rem;
  background: #f8f9fb;
  border-radius: 0.75rem;
}

.quotation-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.quotation-summary .summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.summary-card--primary {
  border-left: 4px solid #0d6efd;
}

.summary-card--success {
  border-left: 4px solid #198754;
}

.summary-card--info {
  border-left: 4px solid #0dcaf0;
}

.summary-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6c757d;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

.summary-sub {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.35rem;
}

/* Table-based quotation layout */
.quotation-table-card {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.quotation-table {
  margin: 0;
}

.quotation-table thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  padding: 0.875rem 0.75rem;
  white-space: nowrap;
  background-color: #f8f9fa;
}

.quotation-table tbody td {
  padding: 0.875rem 0.75rem;
  vertical-align: middle;
  border-bottom: 1px solid #eef0f3;
}

.quotation-row {
  transition: background-color 0.15s ease;
}

.quotation-row:hover {
  background-color: #f8f9fa;
}

.quotation-row--locked {
  background-color: #f0fff4;
}

.quotation-row--locked:hover {
  background-color: #e6f7ec;
}

.quotation-details-row {
  background-color: #fafbfc;
}

.quotation-details-row td {
  border-bottom: 2px solid #e5e7eb;
}

.quotation-details-content {
  padding: 1.25rem;
  border-left: 3px solid #0d6efd;
  margin: 0.5rem 1rem 1rem 2rem;
  background: #ffffff;
  border-radius: 0 0.5rem 0.5rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-group-sm>.btn {
  padding: 0.25rem 0.5rem;
}

/* Keep old card styles for backward compatibility but they're no longer used */
.quotation-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quotation-card {
  border: 1px solid #e5e7eb;
  border-left: 4px solid #0d6efd;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 1rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.quotation-card--locked {
  border-left-color: #198754;
}

.quotation-card:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}

.page-header {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0;
}

.modal.show {
  display: block !important;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>
