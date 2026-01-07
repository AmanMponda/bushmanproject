# Sales Enquiry → Quotation → Order Workflow - Implementation Guide

## Overview

This document describes the complete workflow for converting sales enquiries to quotations to orders. The system supports comparison of multiple quotations and intelligent auto-filling of order data from selected quotations.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ SALES ENQUIRY (SalesEnquiry)                                 │
│ - Single enquiry per customer request                        │
│ - Contains: customer, hunting dates, requirements            │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ QUOTATIONS (SalesEnquiryPricing)                            │
│ - Multiple quotations per enquiry                            │
│ - Each quotation has line items (package, trophy, logistics) │
│ - Contains: pricing, currency, total_price, status           │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ ORDER (SalesOrder)                                           │
│ - Created from selected quotation                            │
│ - Linked to source quotation via sales_enquiry_pricing_id    │
│ - Contains: items, parties, logistics, preferences, payments │
└──────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. SalesEnquiryDetail.vue (NEW)

**Location:** `src/views/orders/SalesEnquiryDetail.vue`

**Purpose:** Display enquiry with all quotations and allow user to select/compare before creating order

**Key Features:**
- Display enquiry summary (code, customer, status, date)
- Show all quotations in card layout
- Display quotation line items with pricing breakdown
- Visual selection indicator for chosen quotation
- One-click "Convert to Order" action
- Auto-navigate to OrderForm after order creation

**Props:** None (uses route params)

**Route:** `/orders/enquiry/:id`

**Data Flow:**
```
User clicks enquiry → Load SalesEnquiryDetail
                   → API: GET /sales/sales-inquiries/{id}?include=pricings,pricings.items
                   → Display quotations
                   → User selects quotation
                   → Click "Convert to Order"
                   → API: POST /orders (with sales_enquiry_pricing_id)
                   → Navigate to OrderForm for editing
```

**Key Methods:**
- `loadEnquiryDetails()` - Fetch enquiry with eager loading
- `selectQuotation(quotation)` - Toggle quotation selection
- `convertToOrder()` - Create order from quotation
- `formatCurrency(amount)` - Format prices
- `getStatusBadge(status)` - Color-code status

**Template Structure:**
```
Page Header (Back button)
├─ Loading spinner
├─ Enquiry Summary Card
│  ├─ Code, Customer, Status
│  └─ Date, Remarks
├─ Quotations Section
│  ├─ Empty state (if no quotations)
│  └─ Grid of Quotation Cards
│     ├─ Quotation Header (Code, Status)
│     ├─ Line Items Table
│     ├─ Pricing Breakdown
│     └─ Select/Selected Button
└─ Footer Actions (Cancel, Convert to Order)
```

---

### 2. OrderForm.vue (UPDATED)

**Location:** `src/views/orders/OrderForm.vue`

**Updated Features:**
- Accept `quotationId` from route params
- Auto-populate fields from quotation on load
- Pre-fill items table from quotation items
- Add customer as party from enquiry
- Display "Source Quotation" badge/link
- Show link back to source enquiry

**New computed property:**
```typescript
sourceQuotation() {
  return this.quotations.find(q => q.id === this.form.quotationId)
}
```

**On-mount enhancement:**
```typescript
if (route.query.quotationId) {
  // Load quotation and auto-populate fields
  const quotation = await orderStore.fetchEnquiryWithQuotations(...)
  this.populateFromQuotation(quotation)
}
```

---

### 3. order-store.ts (EXTENDED)

**Location:** `src/stores/bushman/order-store.ts`

**New Methods:**

#### `fetchEnquiryWithQuotations(enquiryId)`
```typescript
/**
 * Load sales enquiry with all quotations and line items
 * @param enquiryId - The sales enquiry ID
 * @returns Enquiry with nested pricings.items
 */
async fetchEnquiryWithQuotations(enquiryId: number): Promise<any>
```

**API Call:**
```
GET /sales/sales-inquiries/{enquiryId}?include=pricings,pricings.items
```

**Response Structure:**
```json
{
  "data": {
    "id": 4,
    "code": "ENQ-202601-0001",
    "entity_id": 2,
    "entity": {
      "full_name": "amani mponda"
    },
    "pricings": [
      {
        "id": 10,
        "code": "QUOTE-001",
        "total_price": 45000,
        "items": [
          { "id": 1, "type": "Package", "name": "Hunt", "price": 25000 },
          { "id": 2, "type": "Trophy", "name": "Permit", "price": 15000 }
        ]
      }
    ]
  }
}
```

#### `createOrderFromQuotation(payload)`
```typescript
/**
 * Create order from selected quotation
 * @param payload - Order creation payload with sales_enquiry_pricing_id
 * @returns Created order with order_number
 */
async createOrderFromQuotation(payload: {
  sales_enquiry_pricing_id: number
  entity_id: number
  items?: any[]
  parties?: any[]
}): Promise<any>
```

**Payload Structure:**
```json
{
  "type": "SALES",
  "order_type_id": 1,
  "status_id": 1,
  "entity_id": 2,
  "order_date": "2026-01-07",
  "currency_id": 1,
  "sales_enquiry_pricing_id": 10,
  "notes": "Converted from enquiry ENQ-202601-0001",
  "items": [
    {
      "item_category_id": 1,
      "description": "Premium Hunt Package",
      "quantity": 1,
      "unit_price": 25000
    }
  ],
  "parties": [
    {
      "entity_id": 2,
      "party_role_id": 1
    }
  ]
}
```

**Returns:**
```json
{
  "data": {
    "id": 25,
    "order_number": "ORD-2026-0025",
    "sales_enquiry_pricing_id": 10,
    "entity_id": 2,
    "items": [...],
    "parties": [...]
  }
}
```

#### `linkQuotationToOrder(orderId, quotationId)`
```typescript
/**
 * Link quotation to existing order
 * @param orderId - The order ID
 * @param quotationId - The quotation/pricing ID
 * @returns Updated order
 */
async linkQuotationToOrder(orderId: number, quotationId: number): Promise<any>
```

**API Call:**
```
PUT /orders/{orderId}
{
  "sales_enquiry_pricing_id": {quotationId}
}
```

---

## User Journey - Step by Step

### Step 1: View Sales Enquiries List
```
User navigates to Sales module
→ Clicks on an enquiry in the list
→ Routed to /orders/enquiry/{enquiryId}
```

### Step 2: Review Enquiry & Quotations
```
SalesEnquiryDetail component loads
→ API: GET /sales/sales-inquiries/{id}?include=pricings,pricings.items
→ Display enquiry summary (customer, date, status)
→ Show all quotations in grid layout
→ Display line items and pricing for each quotation
```

### Step 3: Compare & Select Quotation
```
User reviews quotations side-by-side
→ User clicks "Select" button on preferred quotation
→ Visual indicator shows selection
→ Other quotations still visible for comparison
→ User can change selection anytime
```

### Step 4: Create Order
```
User clicks "Convert to Order"
→ API: POST /orders {
  "type": "SALES",
  "sales_enquiry_pricing_id": 10,
  "entity_id": 2,
  "items": [...from quotation],
  "parties": [{...customer}]
}
→ Backend creates order with auto-filled data
→ Order number auto-generated (e.g., ORD-2026-0025)
```

### Step 5: Edit & Finalize
```
Navigate to OrderForm in EDIT mode
→ Show created order with pre-filled data
→ User can:
  ├─ Modify items (add/remove/update)
  ├─ Adjust pricing
  ├─ Add logistics/participants
  ├─ Configure payment plan
  └─ Add notes
→ Click "Save Order"
→ Order saved successfully
```

### Step 6: Return & Re-select
```
If user wants different quotation:
→ Click "Back to Enquiry"
→ Return to SalesEnquiryDetail
→ Can select different quotation
→ Convert again (creates another order)
```

---

## API Endpoints Required

### Backend Implementation Checklist

- [ ] **SalesEnquiry Endpoint with Eager Loading**
  ```
  GET /api/v1.0/sales-inquiries/{id}?include=pricings,pricings.items
  
  Returns: Enquiry with all quotations and their line items
  Must include: pricings.items nested data
  Priority: HIGH (blocks workflow)
  ```

- [ ] **Order Creation Accepts Quotation Link**
  ```
  POST /api/v1.0/orders
  Payload: { sales_enquiry_pricing_id, entity_id, items, parties }
  
  Auto-populate from quotation if ID provided
  Priority: HIGH (core to workflow)
  ```

- [ ] **Order Update with Quotation Link**
  ```
  PUT /api/v1.0/orders/{id}
  Payload: { sales_enquiry_pricing_id }
  
  Link existing order to quotation
  Priority: MEDIUM (utility function)
  ```

---

## Integration Points

### 1. OrderList Page
Add link to view enquiry details:
```vue
<router-link 
  :to="{ name: 'SalesEnquiryDetail', params: { id: order.sales_enquiry_id } }"
  class="btn btn-sm btn-outline-primary"
>
  View Enquiry
</router-link>
```

### 2. OrderForm Template
Update Tab 1 to show source quotation:
```vue
<!-- Optional: Display source quotation if linked -->
<div v-if="form.sales_enquiry_pricing_id" class="alert alert-info">
  <i class="fas fa-info-circle me-2"></i>
  This order is linked to quotation: {{ sourceQuotation?.code }}
  <router-link :to="{ name: 'SalesEnquiryDetail', params: { id: form.enquiry_id } }">
    View Enquiry →
  </router-link>
</div>
```

### 3. Router Configuration
Add route for SalesEnquiryDetail:
```typescript
{
  path: '/orders/enquiry/:id',
  name: 'SalesEnquiryDetail',
  component: () => import('@/views/orders/SalesEnquiryDetail.vue'),
  meta: { 
    title: 'Sales Enquiry Detail',
    breadcrumb: 'Enquiry Details'
  }
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: SalesEnquiryDetail.vue                                │
└─────────────────────────────────────────────────────────────────┘
                           ↓
        loadEnquiryDetails() - On Mount
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: GET /sales/sales-inquiries/{id}?include=pricings,items     │
├─────────────────────────────────────────────────────────────────┤
│ orderStore.fetchEnquiryWithQuotations(enquiryId)               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
        ✅ Render quotations grid with items
                           ↓
        User selects quotation
                           ↓
        selectQuotation(pricing)
                           ↓
        User clicks "Convert to Order"
                           ↓
        convertToOrder()
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: POST /orders                                               │
│ Payload: {                                                       │
│   type: 'SALES',                                                │
│   sales_enquiry_pricing_id: 10,                                │
│   entity_id: 2,                                                │
│   items: [...],                                                │
│   parties: [...]                                               │
│ }                                                               │
├─────────────────────────────────────────────────────────────────┤
│ orderStore.createOrderFromQuotation(payload)                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
        ✅ Order created: ORD-2026-0025
                           ↓
        Navigate to OrderForm (EDIT mode)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: OrderForm.vue                                          │
│ - Show pre-filled order data                                    │
│ - Allow further editing                                         │
│ - Show source quotation link                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Failed Enquiry Load
```typescript
if (!response.ok) {
  // Fallback: Load from store if API fails
  enquiry.value = orderStore.enquiries.find(e => e.id === enquiryId.value)
}
```

### Failed Order Creation
```typescript
try {
  const response = await fetch(...)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }
} catch (error) {
  console.error('Error creating order:', error)
  alert(`Failed to create order: ${error.message}`)
}
```

---

## Testing Checklist

### Manual Testing Steps

- [ ] **Load Enquiry Detail**
  - Navigate to `/orders/enquiry/4`
  - Verify enquiry summary displays
  - Verify all quotations load
  - Verify line items display with pricing

- [ ] **Select Quotation**
  - Click "Select" on first quotation
  - Verify visual highlight appears
  - Click another quotation
  - Verify previous selection cleared
  - Click "Selected" button to deselect

- [ ] **Create Order**
  - Click "Convert to Order"
  - Verify loading spinner appears
  - Verify order created in backend
  - Verify order number displayed
  - Verify navigation to OrderForm

- [ ] **Edit Created Order**
  - Verify order details pre-filled
  - Verify items from quotation loaded
  - Verify customer added as party
  - Verify able to add more items
  - Verify able to save changes

- [ ] **Return to Enquiry**
  - Click "Back to Enquiry"
  - Verify navigation back to SalesEnquiryDetail
  - Verify can select different quotation
  - Verify can create another order from same enquiry

### Browser DevTools Testing

```javascript
// Check API calls in Network tab
// 1. GET /sales/sales-inquiries/4?include=pricings,pricings.items
// 2. POST /orders (with sales_enquiry_pricing_id)
// 3. GET /orders/25 (fetch created order)

// Check console for errors
// Should see: 0 errors, 0 warnings
```

---

## Performance Considerations

### API Optimization
- ✅ **Eager Loading:** Single API call gets all related data
- ✅ **Reduced Requests:** No N+1 problem for quotations/items
- ✅ **Network Efficient:** Combine data in one response

### Frontend Optimization
- ✅ **Lazy Loading:** Component only loads when needed
- ✅ **Loading States:** Show spinner during API calls
- ✅ **Error Boundaries:** Graceful fallback if API fails

### Data Efficiency
```typescript
// ✅ GOOD: Single call with eager loading
const enquiry = await api.get(`/sales-inquiries/{id}?include=pricings,pricings.items`)

// ❌ BAD: Multiple sequential calls
const enquiry = await api.get(`/sales-inquiries/{id}`)
const pricings = await api.get(`/sales-inquiries/{id}/pricings`)
for (let pricing of pricings) {
  const items = await api.get(`/pricings/${pricing.id}/items`)
}
```

---

## Future Enhancements

1. **Quotation Comparison UI**
   - Side-by-side comparison view
   - Highlight differences in pricing
   - Discount preview

2. **Batch Order Creation**
   - Create multiple orders from single enquiry
   - Select all quotations at once
   - Generate orders in bulk

3. **Quotation History**
   - Show which quotations were converted to orders
   - Track quotation performance
   - Link orders back to source quotation

4. **Auto-fill Intelligence**
   - Remember user preferences
   - Suggest best quotation based on history
   - Auto-fill parties and logistics

5. **Quotation Approval Workflow**
   - Customer approval before order creation
   - Email notification to customer
   - Track approval status

---

## Related Documentation

- [Order Form Implementation](./OrderForm.md)
- [Order Store (Pinia)](./order-store.md)
- [Backend API Endpoints](./API_ENDPOINTS.md)
- [Database Schema](./DATABASE_SCHEMA.md)

---

**Last Updated:** January 7, 2026  
**Status:** Ready for Implementation  
**Priority:** HIGH - Critical workflow feature
