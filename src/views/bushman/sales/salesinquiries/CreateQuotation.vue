<template>
  <div class="create-quotation-page">
    <!-- Header -->
    <div class="page-header bg-white border-bottom mb-4 p-3">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4 class="mb-1">
            <i class="fa fa-file-invoice-dollar me-2 text-primary"></i>
            Edit Quotation
          </h4>
          <p class="text-muted mb-0 small">Manage pricing items for this quotation</p>
        </div>
        <button class="btn btn-outline-secondary" @click="goBack">
          <i class="fa fa-arrow-left me-1"></i> Back to Enquiry
        </button>
      </div>
    </div>

    <div class="container-fluid">
      <!-- Enquiry Info Summary -->
      <div class="card mb-4">
        <div class="card-body">
          <h6 class="card-title mb-3">
            <i class="fa fa-info-circle me-2"></i>
            Enquiry Details
            <span v-if="existingPricing" class="badge bg-success ms-2">
              <i class="fa fa-check-circle me-1"></i>Pricing Record Ready
            </span>
            <span v-else class="badge bg-warning ms-2">
              <i class="fa fa-exclamation-triangle me-1"></i>No Pricing Record
            </span>
          </h6>
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
              <strong>{{ enquiryDays }} days</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingEnquiry" class="text-center py-5">
        <span class="spinner-border spinner-border-lg me-2"></span>
        <div class="mt-2">Loading quotation data...</div>
      </div>

      <!-- No Pricing Record Warning -->
      <div v-else-if="!existingPricing && enquiryData" class="alert alert-warning">
        <i class="fa fa-exclamation-triangle me-2"></i>
        <strong>No Quotation Found</strong>
        <p class="mb-0">This enquiry doesn't have an existing quotation. The quotation should have been automatically created with the enquiry. Make sure the enquiry has a price structure detail assigned.</p>
      </div>

      <!-- Main Content - Existing Items + Add New Items -->
      <div v-else-if="existingPricing">
        <!-- Summary Card -->
        <div class="card mb-4 bg-primary text-white">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-3">
                <h3 class="mb-0">{{ pricingSummary.total_items || 0 }}</h3>
                <small>Total Items</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ formatCurrency(pricingSummary.trophy_total || 0) }}</h3>
                <small>Trophy Fees</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ formatCurrency(pricingSummary.extra_total || 0) }}</h3>
                <small>Extras</small>
              </div>
              <div class="col-md-3">
                <h3 class="mb-0">{{ formatCurrency(pricingSummary.subtotal || 0) }}</h3>
                <small>Grand Total</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Existing Items by Type -->
        <div v-for="(items, itemType) in existingItemsByType" :key="itemType" class="card mb-4">
          <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="fa fa-check-circle me-2"></i>
              {{ getItemTypeLabel(itemType) }}
              <span class="badge bg-light text-dark ms-2">{{ items.length }} items</span>
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Item</th>
                    <th style="width: 100px;" class="text-center">Qty</th>
                    <th style="width: 150px;" class="text-end">Unit Price</th>
                    <th style="width: 150px;" class="text-end">Total</th>
                    <th style="width: 100px;" class="text-center">Optional</th>
                    <th style="width: 80px;" class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td>
                      <div>
                        <strong>{{ item.item_name || item.description }}</strong>
                        <span v-if="item.item_code" class="text-muted small ms-2">({{ item.item_code }})</span>
                      </div>
                      <small class="text-muted">{{ item.description }}</small>
                    </td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">{{ formatCurrency(item.unit_amount) }}</td>
                    <td class="text-end">
                      <strong class="text-success">{{ formatCurrency(item.total_amount) }}</strong>
                    </td>
                    <td class="text-center">
                      <span v-if="item.is_optional" class="badge bg-info">Optional</span>
                      <span v-else>-</span>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-outline-danger" @click="removeItem(item)" :disabled="removingItem === item.id">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No items message -->
        <div v-if="Object.keys(existingItemsByType).length === 0" class="alert alert-info">
          <i class="fa fa-info-circle me-2"></i>
          No items have been added to this quotation yet. Use the form below to add items.
        </div>

        <!-- Add New Items Section -->
        <div class="card mb-4">
          <div class="card-header bg-light">
            <h6 class="mb-0">
              <i class="fa fa-plus-circle me-2 text-primary"></i>
              Add Items from Enquiry Preferences
            </h6>
          </div>
          <div class="card-body">
            <div v-if="availablePriceableItems.length > 0">
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
                        <th style="width: 140px;" class="text-end">Unit Price</th>
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
                          </div>
                          <small v-if="item.priority" class="text-muted">{{ formatPriority(item.priority) }}</small>
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

              <!-- Add Items Button -->
              <div v-if="selectedItemsCount > 0" class="card bg-light mt-3">
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
                        {{ formatCurrency(quotationTotal) }}
                      </h5>
                    </div>
                    <div class="col-md-4 text-end">
                      <button 
                        class="btn btn-primary" 
                        @click="saveQuotation" 
                        :disabled="saving"
                      >
                        <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="fa fa-plus me-2"></i>
                        Add Selected Items
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              <i class="fa fa-check-circle fa-2x mb-2 text-success"></i>
              <p class="mb-0">All items from enquiry preferences have been added to the quotation.</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesInquiriesStore } from '@/stores/bushman/sales-store'
import { salesEnquiryService } from '@/stores/bushman/salesEnquiryService'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const salesStore = useSalesInquiriesStore()

const enquiryId = computed(() => Number(route.params.id))
const pricingIdFromRoute = computed(() => route.params.pricingId ? Number(route.params.pricingId) : null)
const enquiryData = ref<any>(null)
const loadingEnquiry = ref(false)
const saving = ref(false)
const removingItem = ref<number | null>(null)
const existingPricing = ref<any>(null) // The pricing record with all data

const selectedItems = ref<Record<string, boolean>>({})
const itemPrices = ref<Record<string, any>>({})

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
const existingItemsByType = computed(() => {
  const itemsByType = existingPricing.value?.items_by_type || {}
  const result: Record<string, any[]> = {}
  
  // Filter out empty categories
  for (const [type, items] of Object.entries(itemsByType)) {
    if (Array.isArray(items) && items.length > 0) {
      result[type] = items
    }
  }
  
  return result
})

// Get item type label for display
const getItemTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'PACKAGE': 'Package',
    'TROPHY': 'Trophy Fees',
    'EXTRA': 'Safari Extras & Daily Rate',
    'LOGISTICS': 'Participants',
    'ADJUSTMENT': 'Adjustments',
  }
  return labels[type] || type
}

// Get items from enquiry preferences that haven't been added yet
const enquirySpecies = computed(() => {
  const prefs = enquiryData.value?.species_preferences || enquiryData.value?.item_preferences || []
  const existingTrophies = existingPricing.value?.items_by_type?.TROPHY || []
  const existingItemIds = new Set(existingTrophies.map((t: any) => t.item_id))
  
  // Filter out already added species
  return prefs.filter((sp: any) => !existingItemIds.has(sp.item_id))
})

const enquirySafariExtras = computed(() => {
  const prefs = enquiryData.value?.safari_extras_preferences || enquiryData.value?.safari_extras || []
  const existingExtras = existingPricing.value?.items_by_type?.EXTRA || []
  const existingItemIds = new Set(existingExtras.map((e: any) => e.item_id))
  
  // Filter out already added extras
  return prefs.filter((extra: any) => !existingItemIds.has(extra.item_id))
})

const enquiryParticipants = computed(() => {
  const pref = enquiryData.value?.hunter_preferences || enquiryData.value?.preference
  if (!pref) return []
  
  // Check if participants already added
  const existingLogistics = existingPricing.value?.items_by_type?.LOGISTICS || []
  const hasParticipants = existingLogistics.some((l: any) => 
    l.description?.toLowerCase().includes('participant')
  )
  
  if (hasParticipants) return []
  
  const participants = []
  
  // Handle general participants
  if (pref.no_of_participants > 0) {
    participants.push({
      type: 'PARTICIPANT',
      count: pref.no_of_participants,
      label: `Participants (${pref.no_of_participants})`,
    })
  }
  
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
  
  return participants
})

// Check if hunting days need to be added
const needsHuntingDays = computed(() => {
  const existingExtras = existingPricing.value?.items_by_type?.EXTRA || []
  const hasHuntingDays = existingExtras.some((e: any) => 
    e.description?.toLowerCase().includes('hunting days') || 
    e.description?.toLowerCase().includes('daily rate')
  )
  return !hasHuntingDays
})

const availablePriceableItems = computed(() => {
  const items = []
  
  // Add hunting days if not already added
  const hunterPref = enquiryData.value?.hunter_preferences || enquiryData.value?.preference
  const noOfDays = hunterPref?.no_of_days
  if (needsHuntingDays.value && noOfDays && noOfDays > 0) {
    const packageAmount = existingPricing.value?.price_structure_detail?.amount || 0
    items.push({
      category: 'Hunting Days',
      items: [{
        id: 'hunting_days',
        name: `Hunting Days (${noOfDays} days)`,
        code: '',
        quantity: 1, // Quantity is 1 because package amount is for ALL days
        type: 'EXTRA',
        suggested_price: packageAmount, // This is the TOTAL package amount, not per-day
      }]
    })
  }
  
  // Add species from enquiry preferences (TROPHY fees)
  if (enquirySpecies.value.length > 0) {
    items.push({
      category: 'Species (Trophy Fees)',
      items: enquirySpecies.value.map((sp: any) => ({
        id: sp.item_id,
        name: cleanItemName(sp.item_name || sp.species_name || 'Unknown Species'),
        code: '',
        quantity: sp.desired_quantity || 1,
        type: 'TROPHY',
        suggested_price: 0, // Will be set from price structure
        priority: sp.priority || 'NICE_TO_HAVE',
      }))
    })
  }
  
  // Add safari extras from enquiry
  if (enquirySafariExtras.value.length > 0) {
    items.push({
      category: 'Safari Extras',
      items: enquirySafariExtras.value.map((extra: any) => ({
        id: extra.item_id,
        name: cleanItemName(extra.item_name || 'Extra'),
        code: '',
        quantity: extra.desired_quantity || 1,
        type: 'EXTRA',
        suggested_price: 0,
      }))
    })
  }
  
  // Add participants as LOGISTICS costs
  if (enquiryParticipants.value.length > 0) {
    items.push({
      category: 'Participants',
      items: enquiryParticipants.value.map((part: any) => ({
        id: `participant_${part.type}`,
        name: part.label,
        code: '',
        quantity: part.count,
        type: 'LOGISTICS',
        suggested_price: 0,
      }))
    })
  }
  
  return items
})

const enquiryPackageName = computed(() => {
  return existingPricing.value?.price_structure_detail?.name || 'N/A'
})

const enquiryHuntingType = computed(() => {
  return existingPricing.value?.price_structure_detail?.hunting_type?.name || 'N/A'
})

const enquiryCurrency = computed(() => {
  return existingPricing.value?.currency?.code || 
         existingPricing.value?.currency?.name || 'USD'
})

const enquiryDays = computed(() => {
  return enquiryData.value?.hunter_preferences?.no_of_days || 
         enquiryData.value?.preference?.no_of_days || 'N/A'
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

// Methods
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
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

const initializeItemPrice = (category: string, item: any) => {
  const key = `${category}_${item.id}`
  if (selectedItems.value[key]) {
    itemPrices.value[key] = {
      item_type: item.type,
      item_id: typeof item.id === 'string' ? null : item.id,
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
    removingItem.value = item.id
    try {
      const response = await salesEnquiryService.deletePricingItem(item.id)
      if (response.success) {
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

const loadPricing = async () => {
  loadingEnquiry.value = true
  try {
    if (!pricingIdFromRoute.value) {
      console.warn('⚠️ No pricing ID in route')
      goBack()
      return
    }
    
    console.log('📋 Loading pricing details for ID:', pricingIdFromRoute.value)
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
      
      console.log('✅ Pricing loaded:', existingPricing.value.id)
      console.log('✅ Existing items:', existingPricing.value.items?.length || 0)
      console.log('✅ Summary:', pricingSummary.value)
      console.log('✅ Species preferences:', enquiryData.value.species_preferences?.length || 0)
      console.log('✅ Safari extras:', enquiryData.value.safari_extras_preferences?.length || 0)
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

  saving.value = true
  try {
    // Collect items to add
    const items = []
    for (const key in selectedItems.value) {
      if (selectedItems.value[key] && itemPrices.value[key]) {
        items.push(itemPrices.value[key])
      }
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

const goBack = () => {
  const routeId = Number(route.params.id)
  const pricingEnquiryId = existingPricing.value?.enquiry?.id || existingPricing.value?.enquiry_id
  const fallbackId = enquiryData.value?.id
  const targetId = Number.isFinite(routeId) && routeId > 0 ? routeId
    : Number.isFinite(Number(pricingEnquiryId)) ? Number(pricingEnquiryId)
    : Number.isFinite(Number(fallbackId)) ? Number(fallbackId)
    : null

  if (targetId) {
    router.push(`/sales/enquiries/${targetId}`)
    return
  }

  router.push('/sales/sales-inquiry')
}

onMounted(() => {
  loadPricing()
})
</script>

<style scoped>
.create-quotation-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 99;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
</style>
