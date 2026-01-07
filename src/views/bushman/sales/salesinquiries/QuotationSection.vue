<template>
  <div class="pricing-section">
    <!-- Header with Add Button -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="mb-1">
          <i class="fa fa-file-invoice-dollar me-2 text-primary"></i>
          Quotations / Pricing
        </h5>
        <p class="text-muted mb-0 small">
          Manage pricing options for this enquiry
        </p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="pricings.length > 0" class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-primary h-100">
          <div class="card-body text-center py-3">
            <i class="fa fa-file-alt fa-2x text-primary mb-2"></i>
            <div class="h4 mb-0">{{ pricings.length }}</div>
            <small class="text-muted">Total Quotations</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-success h-100">
          <div class="card-body text-center py-3">
            <i class="fa fa-dollar-sign fa-2x text-success mb-2"></i>
            <div class="h4 mb-0">{{ formatCurrency(totalAmount) }}</div>
            <small class="text-muted">Total Amount</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-info h-100">
          <div class="card-body text-center py-3">
            <i class="fa fa-lock fa-2x text-info mb-2"></i>
            <div class="h4 mb-0">{{ lockedCount }}</div>
            <small class="text-muted">Locked Quotations</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing List -->
    <div v-if="pricings.length > 0" class="pricing-list">
      <div 
        v-for="(pricing, index) in pricings" 
        :key="pricing.id" 
        class="card mb-3"
        :class="{ 'border-success': pricing.status === 'LOCKED' }"
      >
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <span class="badge" :class="pricing.status === 'LOCKED' ? 'bg-success' : 'bg-warning'">
              <i :class="pricing.status === 'LOCKED' ? 'fa fa-lock' : 'fa fa-edit'" class="me-1"></i>
              {{ pricing.status === 'LOCKED' ? 'Locked' : 'Draft' }}
            </span>
            <span class="fw-semibold">
              Quotation #{{ index + 1 }}
            </span>
            <span class="text-muted small">
              - {{ pricing.hunting_type || 'N/A' }}
            </span>
          </div>
          <div class="d-flex gap-2">
            <button 
              v-if="pricing.status !== 'LOCKED'"
              class="btn btn-outline-success btn-sm"
              @click="confirmLockPricing(pricing)"
              title="Lock Quotation"
            >
              <i class="fa fa-lock"></i>
            </button>
            <button 
              class="btn btn-outline-secondary btn-sm"
              @click="togglePricingDetails(pricing.id)"
            >
              <i :class="expandedPricings.includes(pricing.id) ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"></i>
            </button>
          </div>
        </div>
        
        <div class="card-body">
          <!-- Pricing Summary Row -->
          <div class="row mb-3">
            <div class="col-md-3">
              <small class="text-muted d-block">Package</small>
              <span class="fw-semibold">{{ pricing.price_structure_detail?.name || 'N/A' }}</span>
            </div>
            <div class="col-md-3">
              <small class="text-muted d-block">Hunt Length</small>
              <span>{{ pricing.price_structure_detail?.hunt_length?.label || pricing.price_structure_detail?.hunt_length || 'N/A' }}</span>
            </div>
            <div class="col-md-3">
              <small class="text-muted d-block">Currency</small>
              <span>{{ pricing.currency?.name || pricing.currency || 'USD' }}</span>
            </div>
            <div class="col-md-3 text-end">
              <small class="text-muted d-block">Total Amount</small>
              <span class="h5 text-success mb-0">{{ pricing.currency?.symbol || '$' }} {{ formatCurrency(pricing.total_amount || pricing.summary?.subtotal || 0) }}</span>
            </div>
          </div>

          <!-- Expanded Details: Pricing Items -->
          <div v-if="expandedPricings.includes(pricing.id)" class="mt-3 pt-3 border-top">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0">
                <i class="fa fa-list me-2 text-primary"></i>
                Line Items
                <span v-if="pricing.items?.length" class="badge bg-primary ms-2">{{ pricing.items.length }}</span>
              </h6>
              <button 
                v-if="pricing.status !== 'LOCKED'"
                class="btn btn-outline-primary btn-sm"
                @click="navigateToEditQuotation(pricing)"
              >
                <i class="fa fa-plus me-1"></i> Add Item
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="loadingPricingDetails === pricing.id" class="text-center py-4">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Loading items...
            </div>

            <div v-else-if="pricing.items && pricing.items.length > 0" class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th class="text-center">Qty</th>
                    <th class="text-end">Unit Price</th>
                    <th class="text-end">Total</th>
                    <th class="text-center">Optional</th>
                    <th v-if="pricing.status !== 'LOCKED'" class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in pricing.items" :key="item.id">
                    <td>
                      <span class="badge" :class="getItemTypeBadgeClass(item.item_type)">
                        {{ formatItemType(item.item_type) }}
                      </span>
                    </td>
                    <td>
                      <div>{{ item.item_name || item.description }}</div>
                    </td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">{{ formatCurrency(item.unit_amount) }}</td>
                    <td class="text-end fw-semibold">{{ formatCurrency(item.total_amount) }}</td>
                    <td class="text-center">
                      <span v-if="item.is_optional" class="badge bg-info">Optional</span>
                      <span v-else class="badge bg-secondary">Required</span>
                    </td>
                    <td v-if="pricing.status !== 'LOCKED'" class="text-center">
                      <button class="btn btn-outline-secondary btn-sm" @click="editPricingItem(pricing, item)">
                        <i class="fa fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr v-if="getOptionalAmount(pricing) > 0">
                    <td colspan="5" class="text-end fw-semibold">Optional Total:</td>
                    <td class="text-end text-info">{{ formatCurrency(getOptionalAmount(pricing)) }}</td>
                    <td v-if="pricing.status !== 'LOCKED'"></td>
                  </tr>
                  <tr>
                    <td colspan="5" class="text-end fw-bold">Required Total:</td>
                    <td class="text-end fw-bold text-success">{{ formatCurrency(getRequiredAmount(pricing)) }}</td>
                    <td v-if="pricing.status !== 'LOCKED'"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-else class="text-center py-4 text-muted">
              <i class="fa fa-inbox fa-2x mb-2"></i>
              <p class="mb-0">No line items added yet</p>
              <button 
                v-if="pricing.status !== 'LOCKED'"
                class="btn btn-primary btn-sm mt-2"
                @click="navigateToEditQuotation(pricing)"
              >
                <i class="fa fa-plus me-1"></i> Add Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-5">
      <i class="fa fa-file-invoice fa-4x text-muted mb-3"></i>
      <h5 class="text-muted">No Quotations Yet</h5>
      <p class="text-muted mb-3">Create your first quotation for this enquiry</p>
      <button 
        class="btn btn-primary"
        @click="navigateToCreateQuotation"
        :disabled="!canAddPricing"
      >
        <i class="fa fa-plus me-1"></i> Create Quotation
      </button>
    </div>

    <!-- Add/Edit Pricing Modal -->
    <div class="modal fade" :class="{ show: showAddPricingModal }" :style="{ display: showAddPricingModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fa fa-file-invoice-dollar me-2"></i>
              {{ editingPricing ? 'Edit Quotation' : 'Create New Quotation' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeAddPricingModal"></button>
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
              <h6 class="mb-3">
                <i class="fa fa-list-check me-2 text-primary"></i>
                Select Items to Include in Quotation
              </h6>
              
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
                          <input 
                            type="checkbox" 
                            class="form-check-input"
                            @change="toggleCategorySelection(category)"
                            :checked="isCategorySelected(category)"
                          >
                        </th>
                        <th>Item</th>
                        <th style="width: 100px;" class="text-center">Qty</th>
                        <th style="width: 150px;" class="text-end">Unit Price</th>
                        <th style="width: 150px;" class="text-end">Total</th>
                        <th style="width: 100px;" class="text-center">Optional</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in category.items" :key="item.id">
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
                            <span class="badge ms-2" :class="getItemTypeBadgeClass(item.type)">{{ formatItemType(item.type) }}</span>
                          </div>
                          <small v-if="item.priority" class="text-muted d-block">{{ formatPriority(item.priority) }}</small>
                        </td>
                        <td class="text-center">
                          <input 
                            v-if="selectedItems[`${category.category}_${item.id}`]"
                            type="number" 
                            class="form-control form-control-sm text-center"
                            v-model.number="itemPrices[`${category.category}_${item.id}`].quantity"
                            min="1"
                            @input="updateItemTotal(category.category, item.id)"
                          >
                          <span v-else class="text-muted">{{ item.quantity }}</span>
                        </td>
                        <td>
                          <input 
                            v-if="selectedItems[`${category.category}_${item.id}`]"
                            type="number" 
                            class="form-control form-control-sm text-end"
                            v-model.number="itemPrices[`${category.category}_${item.id}`].unit_amount"
                            step="0.01"
                            min="0"
                            @input="updateItemTotal(category.category, item.id)"
                          >
                          <span v-else class="text-muted text-end d-block">{{ formatCurrency(item.suggested_price) }}</span>
                        </td>
                        <td class="text-end">
                          <strong v-if="selectedItems[`${category.category}_${item.id}`]" class="text-success">
                            {{ formatCurrency(itemPrices[`${category.category}_${item.id}`]?.total_amount || 0) }}
                          </strong>
                          <span v-else class="text-muted">{{ formatCurrency(item.quantity * item.suggested_price) }}</span>
                        </td>
                        <td class="text-center">
                          <input 
                            v-if="selectedItems[`${category.category}_${item.id}`]"
                            type="checkbox" 
                            class="form-check-input"
                            v-model="itemPrices[`${category.category}_${item.id}`].is_optional"
                          >
                          <span v-else class="text-muted">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="savePricingWithItems" 
              :disabled="savingPricing || selectedItemsCount === 0"
            >
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
    <div class="modal fade" :class="{ show: showItemModal }" :style="{ display: showItemModal ? 'block' : 'none' }" tabindex="-1">
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
                  <button
                    v-for="item in category.items"
                    :key="item.id"
                    type="button"
                    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    @click="addItemFromPreview(item)"
                  >
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
                  <input v-model="itemForm.description" type="text" class="form-control" required placeholder="Enter item description">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Quantity</label>
                  <input v-model.number="itemForm.quantity" type="number" class="form-control" min="1" placeholder="1">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Unit Amount</label>
                  <input v-model.number="itemForm.unit_amount" type="number" class="form-control" step="0.01" min="0" placeholder="0.00">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Total Amount</label>
                  <input v-model.number="itemForm.total_amount" type="number" class="form-control" step="0.01" min="0" :placeholder="calculatedTotal">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Rate Direction</label>
                  <select v-model="itemForm.rate_direction" class="form-select">
                    <option value="INCREASE">Increase (+)</option>
                    <option value="DECREASE">Decrease (-)</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Amount Source</label>
                  <select v-model="itemForm.amount_source" class="form-select">
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
const loadingPricingDetails = ref<number | null>(null)
const showAddPricingModal = ref(false)
const showItemModal = ref(false)
const savingPricing = ref(false)
const savingItem = ref(false)
const editingPricing = ref<Pricing | null>(null)
const editingItem = ref<PricingItem | null>(null)
const currentPricingForItem = ref<Pricing | null>(null)

// Reference data
const priceStructures = ref<any[]>([])
const huntingTypes = ref<any[]>([])
const currencies = ref<any[]>([])
const speciesList = ref<any[]>([])
const pricePreviewData = ref<any>(null)
const loadingPreview = ref(false)

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
  
  // Handle companions
  if (pref.no_of_companions > 0) {
    participants.push({
      type: 'COMPANION',
      count: pref.no_of_companions,
      label: `Companions (${pref.no_of_companions})`,
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
  
  // Handle general participants (if no_of_companions/observers not specified)
  if (pref.no_of_participants > 0 && participants.length === 0) {
    participants.push({
      type: 'PARTICIPANT',
      count: pref.no_of_participants,
      label: `Participants (${pref.no_of_participants})`,
    })
  }
  
  return participants
})

const availablePriceableItems = computed(() => {
  const items = []
  
  // Add Package as the first priceable item (total package amount for all days, not per-day)
  const packageDetail = pricePreviewData.value?.price_structure_detail || props.enquiryData?.price_structure_detail
  if (packageDetail) {
    const packageAmount = parseFloat(packageDetail.amount) || 0
    const noOfDays = packageDetail.hunt_length_days || props.enquiryData?.preference?.no_of_days
    items.push({
      category: 'Package',
      items: [{
        id: 'package_base',
        name: `${packageDetail.name || 'Hunting Package'} (${noOfDays} days)`,
        code: packageDetail.code || '',
        quantity: 1, // Quantity is 1 because package amount is for ALL days
        type: 'PACKAGE',
        suggested_price: packageAmount, // This is the TOTAL package amount, not per-day
      }]
    })
  }
  
  // Add species from enquiry item_preferences (TROPHY fees)
  if (enquirySpecies.value.length > 0) {
    items.push({
      category: 'Species (Trophy Fees)',
      items: enquirySpecies.value.map((sp: any) => {
        // Try to find trophy fee from preview data
        const trophyFee = pricePreviewData.value?.trophy_fees?.find(
          (tf: any) => tf.item_id === sp.item_id || tf.species_id === sp.item_id
        )
        return {
          id: sp.item_id,
          name: cleanItemName(sp.item_name || sp.species_name || 'Unknown Species'),
          code: '',
          quantity: sp.desired_quantity || 1,
          type: 'TROPHY',
          suggested_price: trophyFee?.amount || 0,
          priority: sp.priority || 'NICE_TO_HAVE',
        }
      })
    })
  }
  
  // Add safari extras from enquiry
  if (enquirySafariExtras.value.length > 0) {
    items.push({
      category: 'Safari Extras',
      items: enquirySafariExtras.value.map((extra: any) => {
        const safariExtra = pricePreviewData.value?.safari_extras?.find(
          (se: any) => se.id === extra.item_id || se.item_id === extra.item_id
        )
        return {
          id: extra.item_id,
          name: cleanItemName(extra.item_name || 'Extra'),
          code: '',
          quantity: extra.desired_quantity || 1,
          type: 'EXTRA',
          suggested_price: safariExtra?.amount || 0,
        }
      })
    })
  }
  
  // Add participants (companions/observers/general) as LOGISTICS costs
  if (enquiryParticipants.value.length > 0) {
    items.push({
      category: 'Participants',
      items: enquiryParticipants.value.map((part: any) => {
        let cost = 0
        if (part.type === 'COMPANION') {
          cost = pricePreviewData.value?.companion_costs?.[0]?.amount || 0
        } else if (part.type === 'OBSERVER') {
          cost = pricePreviewData.value?.observer_costs?.[0]?.amount || 0
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
    LOGISTICS: 'Accommodation & Transport',
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
        pricings.value[idx] = {
          ...pricings.value[idx],
          items: response.data.items || [],
          items_by_type: response.data.items_by_type || {},
          summary: response.data.summary || {},
          total_amount: response.data.summary?.subtotal || 0,
        }
      }
    }
  } catch (error) {
    console.error('Error loading pricing details:', error)
  } finally {
    loadingPricingDetails.value = null
  }
}

const navigateToCreateQuotation = () => {
  router.push(`/sales/enquiries/${props.enquiryId}/create-quotation`)
}

const navigateToEditQuotation = (pricing: Pricing) => {
  // Navigate to the edit quotation page with the pricing id
  router.push(`/sales/enquiries/${props.enquiryId}/quotation/${pricing.id}`)
}

const loadPricings = async () => {
  if (props.initialPricings) {
    pricings.value = props.initialPricings
  } else if (props.enquiryId) {
    try {
      const response = await salesStore.getEnquiryPricings(props.enquiryId)
      if (response.status === 200 && response.data) {
        pricings.value = response.data.pricings || []
      }
    } catch (error) {
      console.error('Error loading pricings:', error)
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
      pricePreviewData.value = response.data
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

const initializeItemPrice = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (selectedItems.value[key]) {
    itemPrices.value[key] = {
      item_type: item.type,
      item_id: typeof item.id === 'string' ? null : item.id,
      linked_species_item_id: item.type === 'TROPHY' ? item.id : null,
      description: item.name,
      quantity: item.quantity || 1,
      unit_amount: item.suggested_price || 0,
      total_amount: (item.quantity || 1) * (item.suggested_price || 0),
      rate_direction: 'INCREASE',
      amount_source: 'SYSTEM',
      is_estimate: false,
      is_optional: false,
    }
  }
}

const updateItemTotal = (category: string, itemId: any) => {
  const key = `${category}_${itemId}`
  if (itemPrices.value[key]) {
    const qty = itemPrices.value[key].quantity || 1
    const unit = itemPrices.value[key].unit_amount || 0
    itemPrices.value[key].total_amount = qty * unit
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
    const items = []
    for (const key in selectedItems.value) {
      if (selectedItems.value[key] && itemPrices.value[key]) {
        items.push(itemPrices.value[key])
      }
    }

    const payload = {
      price_structure_detail_id: enquiryPriceStructureDetailId.value,
      hunting_type_id: enquiryHuntingTypeId.value,
      currency_id: enquiryCurrencyId.value,
      status: 'DRAFT',
      items: items,
    }

    console.log('Creating quotation with payload:', payload)

    const response = await salesStore.addPricing(props.enquiryId, payload)

    if (response.status === 200 || response.status === 201) {
      Swal.fire({
        title: 'Success!',
        text: `Quotation created with ${items.length} items`,
        icon: 'success',
        timer: 2000,
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
          Swal.fire('Deleted!', 'Quotation has been deleted.', 'success')
          await loadPricings()
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

const addItemFromPreview = (previewItem: any) => {
  itemForm.value = {
    item_type: previewItem.type,
    item_id: previewItem.id,
    linked_species_item_id: previewItem.type === 'TROPHY' ? previewItem.id : '',
    description: previewItem.name,
    quantity: previewItem.quantity || 1,
    unit_amount: previewItem.suggested_price || 0,
    total_amount: (previewItem.quantity || 1) * (previewItem.suggested_price || 0),
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

// Watch for modal opening to load preview
watch(() => showAddPricingModal.value, (newVal) => {
  if (newVal && !editingPricing.value && enquiryPriceStructureDetailId.value) {
    loadPricePreview(Number(enquiryPriceStructureDetailId.value))
  }
})

// Auto-calculate total when quantity or unit amount changes
watch([() => itemForm.value.quantity, () => itemForm.value.unit_amount], () => {
  if (!itemForm.value.total_amount || itemForm.value.total_amount === 0) {
    itemForm.value.total_amount = itemForm.value.quantity * itemForm.value.unit_amount
  }
})

// Watch for route changes to reload pricing when returning from edit page
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  // If we're returning to this enquiry view from the quotation edit page
  if (newPath.includes('sales/sales-inquiry') && oldPath?.includes('/quotation/')) {
    console.log('🔄 Reloading pricings after editing quotation')
    loadPricings()
  }
})

onMounted(async () => {
  await loadPricings()
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
  padding: 1rem;
}

.pricing-list .card {
  transition: all 0.2s ease;
}

.pricing-list .card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
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
