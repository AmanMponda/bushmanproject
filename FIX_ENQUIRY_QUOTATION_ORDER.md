# Enquiry-Quotation-Order Integration - Implementation Plan

## Overview
This document provides step-by-step instructions to fix the integration between Enquiries, Quotations, and Orders to create a seamless workflow.

---

## Fix 1: Add Quotation Loading to OrderForm.vue

### Location
[src/views/orders/OrderForm.vue](src/views/orders/OrderForm.vue) - onMounted hook (around line 1100)

### Current Code (Broken)
```typescript
onMounted(async () => {
  try {
    loading.value = true
    
    // Load dropdown data
    await Promise.all([
      orderStore.fetchOrderTypes(),
      orderStore.fetchOrderStatuses(),
      orderStore.fetchCurrencies(),
      // ... other fetches
    ])
    
    // If editing existing order
    if (isEdit.value) {
      await orderStore.getOrder(parseInt(id.value))
      // ... populate form from currentOrder
    }
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error('Failed to load form data')
  } finally {
    loading.value = false
  }
})
```

### What to Add
After loading order data, add this block:

```typescript
// If order came from quotation, load quotation context
if (orderStore.currentOrder?.sales_enquiry_pricing_id) {
  try {
    const quotationId = orderStore.currentOrder.sales_enquiry_pricing_id
    const enquiryId = orderStore.currentOrder.sales_enquiry_id
    
    if (enquiryId) {
      // Fetch enquiry with quotations
      const enquiry = await orderStore.fetchEnquiryWithQuotations(enquiryId)
      
      // Find the quotation
      const quotation = enquiry.pricings?.find(
        (p: any) => p.id === quotationId
      )
      
      if (quotation) {
        form.enquiryId = enquiryId.toString()
        form.quotationId = quotationId.toString()
        
        // This is the key: auto-populate items from quotation
        if (quotation.items && quotation.items.length > 0) {
          form.items = quotation.items.map((item: any) => ({
            name: item.name || item.description,
            category: item.type || 'Service',
            unitPrice: item.price || 0,
            quantity: 1,
            rate: item.price || 0
          }))
        }
      }
    }
  } catch (error) {
    console.error('Error loading quotation context:', error)
    // Don't fail, just continue with manual entry
  }
}
```

---

## Fix 2: Update SalesEnquiryDetail.vue Navigation

### Location
[src/views/orders/SalesEnquiryDetail.vue](src/views/orders/SalesEnquiryDetail.vue) - convertToOrder method (around line 280)

### Current Code (Incomplete)
```typescript
const convertToOrder = async () => {
  if (!selectedQuotationId.value) return

  try {
    converting.value = true
    
    const selectedQuotation = quotations.value.find(q => q.id === selectedQuotationId.value)
    
    const orderPayload = {
      // ... payload construction
    }

    const response = await fetch(...)
    const result = await response.json()
    const orderId = result.data.id

    // INCOMPLETE: Missing quotation context
    router.push({
      name: 'EditOrder',
      params: { id: orderId }
    })
  }
}
```

### What to Change
Replace the router.push with:

```typescript
// Pass quotation and enquiry context
router.push({
  name: 'EditOrder',
  params: { id: orderId },
  query: {
    quotationId: selectedQuotationId.value.toString(),
    enquiryId: enquiry.value.id.toString(),
    fromEnquiry: 'true' // Flag for UI to show source info
  }
})
```

---

## Fix 3: Add Quotation Context Display in OrderForm.vue

### Location
[src/views/orders/OrderForm.vue](src/views/orders/OrderForm.vue) - Template section (top of tab 1)

### Add This HTML Block
Add this **before** the "Basic Information" section:

```vue
<!-- Source Quotation & Enquiry Info Banner -->
<div v-if="form.enquiryId && form.quotationId" class="alert alert-info mb-4 d-flex align-items-center justify-content-between">
  <div>
    <i class="fas fa-info-circle me-2"></i>
    <strong>Source Information:</strong>
    <span class="ms-2">
      Enquiry: <span class="badge bg-secondary">{{ form.enquiryId }}</span>
      Quotation: <span class="badge bg-primary">{{ form.quotationId }}</span>
    </span>
  </div>
  <button 
    @click="goToSourceQuotation" 
    class="btn btn-sm btn-outline-info"
    v-if="isEdit"
  >
    <i class="fas fa-arrow-left me-1"></i>View Source
  </button>
</div>
```

### Add This Method to Script
```typescript
const goToSourceQuotation = () => {
  if (form.enquiryId) {
    router.push({
      name: 'SalesEnquiryDetail',
      params: { id: form.enquiryId }
    })
  }
}
```

---

## Fix 4: Handle Existing Order Items on Load

### Location
[src/views/orders/OrderForm.vue](src/views/orders/OrderForm.vue) - Inside the isEdit block of onMounted

### Add This Logic
After loading the order with `orderStore.getOrder(...)`:

```typescript
if (isEdit.value && orderStore.currentOrder) {
  const order = orderStore.currentOrder
  
  // Populate form from order
  form.orderNumber = order.order_number || ''
  form.orderType = order.order_type_id || order.type || ''
  form.status = order.status_id || order.status || ''
  form.orderDate = order.order_date || ''
  form.currency = order.currency_id || order.currency || ''
  // ... other fields
  
  // IMPORTANT: Load existing items from order
  if (order.items && Array.isArray(order.items)) {
    form.items = order.items.map((item: any) => ({
      name: item.description || item.name || '',
      category: item.item_category_id || item.category || '',
      unitPrice: item.unit_price || item.price || 0,
      quantity: item.quantity || 1,
      rate: item.unit_price || item.rate || 0
    }))
  }
  
  // Load parties
  if (order.parties && Array.isArray(order.parties)) {
    form.parties = order.parties.map((party: any) => ({
      role: party.party_role_id || party.role || '',
      entity: party.entity_id || party.entity || '',
      contact: party.contact_person || party.contact || '',
      email: party.email || ''
    }))
  }
}
```

---

## Fix 5: Update OrderDetails.vue to Show Source

### Location
[src/views/orders/OrderDetails.vue](src/views/orders/OrderDetails.vue) - Top of template (if it exists)

### Add Source Information Section
```vue
<template>
  <div class="page-wrapper">
    <!-- Header with back button -->
    <div class="page-header">
      <div class="row align-items-center">
        <div class="col">
          <h3 class="page-title">Order Details</h3>
        </div>
      </div>
    </div>

    <!-- ADD THIS: Source Information Card -->
    <div v-if="order.sales_enquiry_id && order.sales_enquiry_pricing_id" class="card mb-4 border-info">
      <div class="card-header bg-light">
        <h6 class="mb-0">
          <i class="fas fa-link me-2 text-info"></i>Order Traceability
        </h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <p>
              <strong>Source Enquiry:</strong>
              <span class="badge bg-secondary ms-2">{{ order.sales_enquiry_id }}</span>
            </p>
            <p v-if="sourceEnquiry">
              <small class="text-muted">Customer: {{ sourceEnquiry.entity?.full_name }}</small>
            </p>
          </div>
          <div class="col-md-6">
            <p>
              <strong>Source Quotation:</strong>
              <span class="badge bg-primary ms-2">{{ order.sales_enquiry_pricing_id }}</span>
            </p>
            <p v-if="sourceQuotation">
              <small class="text-muted">Amount: {{ formatCurrency(sourceQuotation.total_price) }}</small>
            </p>
          </div>
        </div>
        <div class="mt-3">
          <RouterLink 
            :to="`/orders/enquiry/${order.sales_enquiry_id}`"
            class="btn btn-sm btn-outline-info"
          >
            <i class="fas fa-arrow-left me-1"></i>View Source Enquiry
          </RouterLink>
        </div>
      </div>
    </div>
    
    <!-- Rest of order details template -->
    ...
  </div>
</template>

<script setup lang="ts">
const order = computed(() => orderStore.currentOrder)

const sourceEnquiry = computed(() => {
  if (!order.value?.sales_enquiry_id) return null
  return orderStore.enquiries.find(e => e.id === order.value.sales_enquiry_id)
})

const sourceQuotation = computed(() => {
  if (!order.value?.sales_enquiry_pricing_id) return null
  return orderStore.quotations.find(q => q.id === order.value.sales_enquiry_pricing_id)
})
</script>
```

---

## Fix 6: Add Validation in OrderForm Submit

### Location
[src/views/orders/OrderForm.vue](src/views/orders/OrderForm.vue) - submit method

### Current Issue
When user edits an order that came from a quotation, they might accidentally clear the items.

### Add This Validation
```typescript
const submit = async () => {
  // Validate form data
  if (!form.orderNumber && !isEdit.value) {
    toast.error('Order number is required')
    return
  }
  
  if (!form.orderType) {
    toast.error('Order type is required')
    return
  }
  
  if (!form.currency) {
    toast.error('Currency is required')
    return
  }
  
  // NEW: If order came from quotation, warn if items are removed
  if (isEdit.value && form.quotationId && form.items.length === 0) {
    const confirmed = await Swal.fire({
      title: 'No Items in Order?',
      text: 'This order was created from quotation but has no items. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, save anyway',
      cancelButtonText: 'Cancel'
    })
    
    if (!confirmed.isConfirmed) return
  }
  
  // ... proceed with save
}
```

---

## Fix 7: Update order-store.ts to Ensure Proper Linking

### Location
[src/stores/bushman/order-store.ts](src/stores/bushman/order-store.ts) - createOrderFromQuotation method

### Current Issue
The method doesn't properly store the enquiry relationship

### What to Ensure
The POST payload MUST include both IDs:

```typescript
async createOrderFromQuotation(payload: {...}): Promise<any> {
  // Ensure both IDs are included
  const orderPayload = {
    type: 'SALES',
    order_type_id: payload.order_type_id || 1,
    status_id: payload.status_id || 1,
    entity_id: payload.entity_id,
    order_date: new Date().toISOString().split('T')[0],
    currency_id: payload.currency_id || 1,
    
    // CRITICAL: Both IDs must be sent
    sales_enquiry_id: payload.sales_enquiry_id,          // ← Original enquiry
    sales_enquiry_pricing_id: payload.sales_enquiry_pricing_id, // ← Selected quotation
    
    ...payload
  }
  
  // ... rest of method
}
```

---

## Testing Checklist

After implementing these fixes, test the following:

### Test 1: Create Order from Quotation
- [ ] Navigate to Sales → Enquiries
- [ ] Click on an enquiry with quotations
- [ ] Select a quotation
- [ ] Click "Convert to Order"
- [ ] Verify you're directed to OrderForm with quotation info
- [ ] Verify items are auto-populated from quotation
- [ ] Verify source quotation badge is visible
- [ ] Edit order, save it
- [ ] Verify order was created correctly

### Test 2: Edit Order from Quotation
- [ ] Navigate back to the created order (OrderDetails)
- [ ] Verify "Source Information" card shows enquiry + quotation IDs
- [ ] Click "View Source Enquiry" button
- [ ] Verify you're back in SalesEnquiryDetail
- [ ] Verify quotation is still selected

### Test 3: Manual Order Creation
- [ ] Create order manually (without quotation)
- [ ] Verify source info card is NOT shown
- [ ] Add items manually
- [ ] Save order
- [ ] Verify order saves correctly

### Test 4: Data Consistency
- [ ] Create order from quotation with 3 items
- [ ] Edit order and verify 3 items are still there
- [ ] Add another item, save
- [ ] Reload order, verify 4 items are there
- [ ] Verify quotation was not modified

### Test 5: Quotation Comparison
- [ ] Create order from Quotation A
- [ ] Navigate back to enquiry detail
- [ ] Select Quotation B (different)
- [ ] Note the prices are different
- [ ] Verify order was from Quotation A (check badge)

---

## Database Impact

These changes are **frontend-only** and require:
- ✅ No database migrations
- ✅ No backend API changes
- ✅ No new API endpoints
- ✅ Only data field usage is changing

---

## Summary of Changes

| File | Lines | Change Type | Priority |
|------|-------|-------------|----------|
| OrderForm.vue | 1100-1150 | Add quotation loading in onMounted | 🔴 Critical |
| OrderForm.vue | 150-200 | Add source info banner in template | 🟡 Important |
| OrderForm.vue | 1300-1350 | Add goToSourceQuotation method | 🟡 Important |
| SalesEnquiryDetail.vue | 280-290 | Update router.push with query params | 🔴 Critical |
| OrderDetails.vue | 1-50 | Add source information card | 🟡 Important |
| OrderDetails.vue | Script section | Add computed properties for source | 🟡 Important |
| order-store.ts | 750-770 | Ensure sales_enquiry_id in payload | 🔴 Critical |

---

## Estimated Implementation Time
- **Fix 1:** 20 minutes
- **Fix 2:** 5 minutes
- **Fix 3:** 15 minutes
- **Fix 4:** 15 minutes
- **Fix 5:** 20 minutes
- **Fix 6:** 15 minutes
- **Fix 7:** 5 minutes
- **Testing:** 30 minutes

**Total: ~2 hours**

---

## Notes
- All changes maintain backward compatibility
- No existing functionality is broken
- The workflow becomes 100% functional after these fixes
