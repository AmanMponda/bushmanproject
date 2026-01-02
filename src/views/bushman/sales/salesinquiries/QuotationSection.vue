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
      <button 
        class="btn btn-primary btn-sm"
        @click="showAddPricingModal = true"
        :disabled="!canAddPricing"
      >
        <i class="fa fa-plus me-1"></i> Add Quotation
      </button>
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
              {{ pricing.status }}
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
              class="btn btn-outline-primary btn-sm"
              @click="editPricing(pricing)"
              title="Edit Quotation"
            >
              <i class="fa fa-edit"></i>
            </button>
            <button 
              v-if="pricing.status !== 'LOCKED'"
              class="btn btn-outline-success btn-sm"
              @click="confirmLockPricing(pricing)"
              title="Lock Quotation"
            >
              <i class="fa fa-lock"></i>
            </button>
            <button 
              v-if="pricing.status !== 'LOCKED'"
              class="btn btn-outline-danger btn-sm"
              @click="confirmDeletePricing(pricing)"
              title="Delete Quotation"
            >
              <i class="fa fa-trash"></i>
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
              <span>{{ pricing.price_structure_detail?.hunt_length || 'N/A' }}</span>
            </div>
            <div class="col-md-3">
              <small class="text-muted d-block">Currency</small>
              <span>{{ pricing.currency || 'USD' }}</span>
            </div>
            <div class="col-md-3 text-end">
              <small class="text-muted d-block">Total Amount</small>
              <span class="h5 text-success mb-0">{{ pricing.currency || '$' }} {{ formatCurrency(pricing.total_amount || 0) }}</span>
            </div>
          </div>

          <!-- Expanded Details: Pricing Items -->
          <div v-if="expandedPricings.includes(pricing.id)" class="mt-3 pt-3 border-top">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0">
                <i class="fa fa-list me-2 text-primary"></i>
                Line Items
              </h6>
              <button 
                v-if="pricing.status !== 'LOCKED'"
                class="btn btn-outline-primary btn-sm"
                @click="showAddItemModal(pricing)"
              >
                <i class="fa fa-plus me-1"></i> Add Item
              </button>
            </div>

            <div v-if="pricing.items && pricing.items.length > 0" class="table-responsive">
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
                        {{ item.item_type }}
                      </span>
                    </td>
                    <td>
                      <div>{{ item.description }}</div>
                      <small v-if="item.linked_species_name" class="text-muted">
                        Species: {{ item.linked_species_name }}
                      </small>
                    </td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">{{ formatCurrency(item.unit_amount) }}</td>
                    <td class="text-end fw-semibold">{{ formatCurrency(item.total_amount) }}</td>
                    <td class="text-center">
                      <span v-if="item.is_optional" class="badge bg-info">Optional</span>
                      <span v-else class="badge bg-secondary">Required</span>
                    </td>
                    <td v-if="pricing.status !== 'LOCKED'" class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" @click="editPricingItem(pricing, item)">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" @click="confirmDeleteItem(pricing, item)">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr v-if="getOptionalAmount(pricing) > 0">
                    <td colspan="4" class="text-end fw-semibold">Optional Total:</td>
                    <td class="text-end text-info">{{ formatCurrency(getOptionalAmount(pricing)) }}</td>
                    <td colspan="2"></td>
                  </tr>
                  <tr>
                    <td colspan="4" class="text-end fw-bold">Required Total:</td>
                    <td class="text-end fw-bold text-success">{{ formatCurrency(getRequiredAmount(pricing)) }}</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-else class="text-center py-4 text-muted">
              <i class="fa fa-inbox fa-2x mb-2"></i>
              <p class="mb-0">No line items added yet</p>
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
        @click="showAddPricingModal = true"
        :disabled="!canAddPricing"
      >
        <i class="fa fa-plus me-1"></i> Create Quotation
      </button>
    </div>

    <!-- Add/Edit Pricing Modal -->
    <div class="modal fade" :class="{ show: showAddPricingModal }" :style="{ display: showAddPricingModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa fa-file-invoice-dollar me-2"></i>
              {{ editingPricing ? 'Edit Quotation' : 'Create New Quotation' }}
            </h5>
            <button type="button" class="btn-close" @click="closeAddPricingModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="savePricing">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Price Structure / Package <span class="text-danger">*</span></label>
                  <select v-model="pricingForm.price_structure_detail_id" class="form-select" required>
                    <option value="">Select Package</option>
                    <option v-for="pkg in priceStructures" :key="pkg.id" :value="pkg.id">
                      {{ pkg.name }} - {{ pkg.hunt_length || 'N/A' }} days
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Hunting Type <span class="text-danger">*</span></label>
                  <select v-model="pricingForm.hunting_type_id" class="form-select" required>
                    <option value="">Select Hunting Type</option>
                    <option v-for="ht in huntingTypes" :key="ht.id" :value="ht.id">
                      {{ ht.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Currency <span class="text-danger">*</span></label>
                  <select v-model="pricingForm.currency_id" class="form-select" required>
                    <option value="">Select Currency</option>
                    <option v-for="curr in currencies" :key="curr.id" :value="curr.id">
                      {{ curr.code }} - {{ curr.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select v-model="pricingForm.status" class="form-select">
                    <option value="DRAFT">Draft</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddPricingModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="savePricing" :disabled="savingPricing">
              <span v-if="savingPricing" class="spinner-border spinner-border-sm me-1"></span>
              {{ editingPricing ? 'Update' : 'Create' }} Quotation
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
            <form @submit.prevent="saveItem">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Item Type <span class="text-danger">*</span></label>
                  <select v-model="itemForm.item_type" class="form-select" required>
                    <option value="">Select Type</option>
                    <option value="PACKAGE">Package</option>
                    <option value="TROPHY">Trophy</option>
                    <option value="EXTRA">Extra</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="ADJUSTMENT">Adjustment</option>
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
import { useSalesInquiriesStore } from '@/stores/bushman/sales-store'
import { useSettingsStore } from '@/stores/bushman/settings-store'
import { usePriceListStore } from '@/stores/bushman/price-list-store'
import { useSpeciesStore } from '@/stores/bushman/species-store'
import Swal from 'sweetalert2'
import type { Pricing, PricingItem, PricingStatus, ItemType, RateDirection, AmountSource } from '@/stores/bushman/salesEnquiry'

const props = defineProps<{
  enquiryId: number
  initialPricings?: Pricing[]
}>()

const emit = defineEmits<{
  (e: 'update'): void
}>()

const salesStore = useSalesInquiriesStore()
const settingsStore = useSettingsStore()
const priceListStore = usePriceListStore()
const speciesStore = useSpeciesStore()

// State
const pricings = ref<Pricing[]>([])
const expandedPricings = ref<number[]>([])
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

const togglePricingDetails = (pricingId: number) => {
  const index = expandedPricings.value.indexOf(pricingId)
  if (index > -1) {
    expandedPricings.value.splice(index, 1)
  } else {
    expandedPricings.value.push(pricingId)
  }
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

// Auto-calculate total when quantity or unit amount changes
watch([() => itemForm.value.quantity, () => itemForm.value.unit_amount], () => {
  if (!itemForm.value.total_amount || itemForm.value.total_amount === 0) {
    itemForm.value.total_amount = itemForm.value.quantity * itemForm.value.unit_amount
  }
})

onMounted(() => {
  loadPricings()
  loadReferenceData()
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
