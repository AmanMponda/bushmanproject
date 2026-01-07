<template>
  <div class="page-wrapper">
    <!-- Page Header -->
    <div class="page-header">
      <div class="row align-items-center">
        <div class="col">
          <h3 class="page-title">
            <i class="fas fa-search me-2"></i>Sales Enquiry to Order
          </h3>
          <p class="text-muted">Review enquiry details and select a quotation to create order</p>
        </div>
        <div class="col-auto">
          <button @click="goBack" class="btn btn-secondary">
            <i class="fas fa-chevron-left me-2"></i>Back to Enquiries
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card">
      <div class="card-body text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading enquiry details...</p>
      </div>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Enquiry Summary Card -->
      <div class="card mb-4">
        <div class="card-header bg-light">
          <div class="row align-items-center">
            <div class="col">
              <h5 class="mb-0">{{ enquiry.code }}</h5>
              <small class="text-muted">{{ enquiry.entity?.full_name || 'Unknown Customer' }}</small>
            </div>
            <div class="col-auto">
              <span :class="['badge', getStatusBadge(enquiry.status)]">
                {{ enquiry.status }}
              </span>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <label class="form-label text-muted small text-uppercase fw-bold">Enquiry Date</label>
              <p class="mb-0">{{ formatDate(enquiry.date) }}</p>
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small text-uppercase fw-bold">Customer</label>
              <p class="mb-0">{{ enquiry.entity?.full_name || 'N/A' }}</p>
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small text-uppercase fw-bold">Status</label>
              <p class="mb-0">{{ enquiry.status }}</p>
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small text-uppercase fw-bold">Remarks</label>
              <p class="mb-0">{{ enquiry.remarks || 'None' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quotations Section -->
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0">
            <i class="fas fa-file-invoice-dollar me-2"></i>Available Quotations
            <span class="badge bg-primary ms-2">{{ quotations.length }}</span>
          </h6>
        </div>
        <div class="card-body">
          <!-- Empty State -->
          <div v-if="quotations.length === 0" class="text-center py-5">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p class="text-muted">No quotations available for this enquiry</p>
          </div>

          <!-- Quotations Grid -->
          <div v-else class="row g-3">
            <div v-for="pricing in quotations" :key="pricing.id" class="col-lg-6">
              <div class="quotation-card border rounded-3 p-4" :class="{ 'border-primary': selectedQuotationId === pricing.id }">
                <!-- Quotation Header -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 class="mb-1">{{ pricing.code }}</h6>
                    <small class="text-muted">Status: {{ pricing.status }}</small>
                  </div>
                  <span class="badge bg-success">{{ pricing.currency || 'USD' }}</span>
                </div>

                <!-- Line Items Table -->
                <div class="table-responsive mb-3">
                  <table class="table table-sm mb-0 border-top">
                    <thead class="table-light">
                      <tr>
                        <th>Item Type</th>
                        <th class="text-end">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in pricing.items" :key="item.id">
                        <td>
                          <small>
                            <span class="badge bg-light text-dark">{{ item.type }}</span>
                            {{ item.name }}
                          </small>
                        </td>
                        <td class="text-end">
                          <small>{{ formatCurrency(item.price) }}</small>
                        </td>
                      </tr>
                      <tr class="fw-bold border-top">
                        <td>TOTAL</td>
                        <td class="text-end text-primary fw-bold">
                          {{ formatCurrency(pricing.total_price) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Pricing Breakdown -->
                <div class="pricing-breakdown mb-3 p-2 bg-light rounded">
                  <small class="d-block mb-1">
                    <span class="text-muted">Currency:</span> <span class="fw-500">{{ pricing.currency || 'USD' }}</span>
                  </small>
                  <small class="d-block">
                    <span class="text-muted">Total Amount:</span> 
                    <span class="fw-bold text-success">{{ formatCurrency(pricing.total_price) }}</span>
                  </small>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex gap-2">
                  <button
                    @click="selectQuotation(pricing)"
                    :class="['btn flex-grow-1', selectedQuotationId === pricing.id ? 'btn-primary' : 'btn-outline-primary']"
                  >
                    <i :class="['fas me-2', selectedQuotationId === pricing.id ? 'fa-check-circle' : 'fa-circle']"></i>
                    {{ selectedQuotationId === pricing.id ? 'Selected' : 'Select' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="card-footer bg-light d-flex justify-content-between">
          <button @click="goBack" class="btn btn-secondary">
            <i class="fas fa-times me-2"></i>Cancel
          </button>
          <button
            @click="convertToOrder"
            :disabled="!selectedQuotationId || converting"
            class="btn btn-primary"
          >
            <span v-if="converting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-arrow-right me-2"></i>
            {{ converting ? 'Creating Order...' : 'Convert to Order' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrderStore } from '@/stores/bushman/order-store'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()

const enquiry = ref<any>(null)
const quotations = ref<any[]>([])
const selectedQuotationId = ref<number | null>(null)
const loading = ref(true)
const converting = ref(false)

const enquiryId = ref<number>(parseInt(route.params.id as string))

// Format utilities
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, string> = {
    'NEW': 'bg-info',
    'IN_PROGRESS': 'bg-warning',
    'QUOTED': 'bg-primary',
    'ORDERED': 'bg-success',
    'CLOSED': 'bg-secondary'
  }
  return statusMap[status] || 'bg-secondary'
}

// Load enquiry with quotations
const loadEnquiryDetails = async () => {
  try {
    loading.value = true
    // Fetch enquiry with eager loading for pricings and items
    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}sales/sales-inquiries/${enquiryId.value}?include=pricings,pricings.items`
    )
    
    if (!response.ok) throw new Error('Failed to load enquiry')
    
    const data = await response.json()
    enquiry.value = data.data
    quotations.value = data.data.pricings || []
  } catch (error) {
    console.error('Error loading enquiry:', error)
    // Fallback: Try to load from store
    enquiry.value = orderStore.enquiries.find((e: any) => e.id === enquiryId.value)
  } finally {
    loading.value = false
  }
}

// Select quotation
const selectQuotation = (quotation: any) => {
  selectedQuotationId.value = selectedQuotationId.value === quotation.id ? null : quotation.id
}

// Convert quotation to order
const convertToOrder = async () => {
  if (!selectedQuotationId.value) return

  try {
    converting.value = true
    
    const selectedQuotation = quotations.value.find(q => q.id === selectedQuotationId.value)
    
    // Create order with quotation link
    const orderPayload = {
      type: 'SALES',
      order_type_id: 1, // Default to SALES order type
      status_id: 1, // Default to DRAFT status
      entity_id: enquiry.value.entity_id,
      order_date: new Date().toISOString().split('T')[0],
      currency_id: 1, // Will be updated from quotation
      sales_enquiry_pricing_id: selectedQuotationId.value,
      notes: `Converted from enquiry ${enquiry.value.code}`,
      
      // Pre-populate items from quotation
      items: (selectedQuotation.items || []).map((item: any) => ({
        item_category_id: 1, // Default - will need mapping from quotation
        description: item.name,
        quantity: 1,
        unit_price: item.price
      })),
      
      // Add customer as party
      parties: [{
        entity_id: enquiry.value.entity_id,
        party_role_id: 1 // CUSTOMER role
      }]
    }

    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}orders`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create order')
    }

    const result = await response.json()
    const orderId = result.data.id

    // Navigate to edit order form with created order
    // FIXED: Pass quotationId and enquiryId context
    router.push({
      name: 'EditOrder',
      params: { id: orderId },
      query: {
        quotationId: selectedQuotationId.value?.toString(),
        enquiryId: enquiry.value?.id?.toString(),
        fromEnquiry: 'true'
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    alert(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    converting.value = false
  }
}

// Go back
const goBack = () => {
  router.back()
}

// Initialize
onMounted(() => {
  loadEnquiryDetails()
})
</script>

<style scoped lang="scss">
.quotation-card {
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  
  &.border-primary {
    background-color: rgba(13, 110, 253, 0.05);
    border-width: 2px !important;
  }
}

.table-responsive {
  border-radius: 0.5rem;
}

.pricing-breakdown {
  font-size: 0.875rem;
}
</style>
