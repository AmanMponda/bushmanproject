# QUICK ACTION SUMMARY: Make Enquiry-Quotation-Order Work Perfectly

## What We Need to Do (One Page)

### The Goal
✅ Make all the ❌ problems into ✅ solutions

### The Plan
**7 code changes across 4 files = 2-3 hours work**

### Files to Change

#### 1. `src/views/orders/SalesEnquiryDetail.vue` ← 1 change (5 min)
**Around line 280 in `convertToOrder()` method**

Change this:
```javascript
router.push({ name: 'EditOrder', params: { id: orderId } })
```

To this:
```javascript
router.push({
  name: 'EditOrder',
  params: { id: orderId },
  query: { quotationId: selectedQuotationId.value, enquiryId: enquiry.value.id }
})
```

**Why:** Pass quotation info to OrderForm

---

#### 2. `src/views/orders/OrderForm.vue` ← 3 changes (50 min total)

**Change 2A: Around line 1100 in onMounted hook**

Add after loading order:
```typescript
if (orderStore.currentOrder?.sales_enquiry_pricing_id) {
  const enquiryId = orderStore.currentOrder.sales_enquiry_id
  const quotationId = orderStore.currentOrder.sales_enquiry_pricing_id
  
  const enquiry = await orderStore.fetchEnquiryWithQuotations(enquiryId)
  const quotation = enquiry.pricings?.find(p => p.id === quotationId)
  
  if (quotation?.items?.length > 0) {
    form.items = quotation.items.map((item: any) => ({
      name: item.name || '',
      category: item.type || 'Service',
      unitPrice: item.price || 0,
      quantity: 1,
      rate: item.price || 0
    }))
  }
  form.enquiryId = enquiryId?.toString()
  form.quotationId = quotationId?.toString()
}
```

**Change 2B: Around line 1100-1150 in onMounted hook**

Add after loading order items:
```typescript
const order = orderStore.currentOrder
if (order?.items?.length > 0) {
  form.items = order.items.map((item: any) => ({
    name: item.description || '',
    category: item.item_category_id || '',
    unitPrice: item.unit_price || 0,
    quantity: item.quantity || 1,
    rate: item.unit_price || 0
  }))
}
if (order?.parties?.length > 0) {
  form.parties = order.parties.map((party: any) => ({
    role: party.party_role_id || '',
    entity: party.entity_id || '',
    contact: party.contact_person || '',
    email: party.email || ''
  }))
}
```

**Change 2C: At top of TAB 1 in template**

Add this banner:
```vue
<div v-if="form.enquiryId && form.quotationId" class="alert alert-info mb-4">
  <strong>Source:</strong> Enquiry {{ form.enquiryId }} → Quotation {{ form.quotationId }}
  <button @click="goToSourceQuotation" class="btn btn-sm btn-outline-info ms-2">
    View Source
  </button>
</div>
```

Add this method:
```typescript
const goToSourceQuotation = () => {
  router.push({ name: 'SalesEnquiryDetail', params: { id: form.enquiryId } })
}
```

**Why:** Load quotation data, populate items, show source info

---

#### 3. `src/views/orders/OrderDetails.vue` ← 1 change (20 min)

**At top of page, after header**

Add this card:
```vue
<div v-if="order.sales_enquiry_id" class="card mb-4 border-info">
  <div class="card-header bg-light">
    <h6 class="mb-0">Order Traceability</h6>
  </div>
  <div class="card-body">
    <p><strong>Source Enquiry:</strong> ENQ-{{ order.sales_enquiry_id }}</p>
    <p><strong>Source Quotation:</strong> QUOTE-{{ order.sales_enquiry_pricing_id }}</p>
    <RouterLink :to="`/orders/enquiry/${order.sales_enquiry_id}`" class="btn btn-sm btn-outline-info">
      View Source Enquiry
    </RouterLink>
  </div>
</div>
```

**Why:** Show where order came from

---

#### 4. `src/stores/bushman/order-store.ts` ← 1 change (5 min)

**Around line 750-770 in `createOrderFromQuotation()` method**

Make sure payload includes both:
```typescript
const orderPayload = {
  // ... other fields
  sales_enquiry_id: payload.sales_enquiry_id,          // ← Add if missing
  sales_enquiry_pricing_id: payload.sales_enquiry_pricing_id,  // ← Already there
  // ... rest
}
```

**Why:** Ensure database has both links

---

## Quick Test

After making changes, test this:

1. **Go to Sales → Enquiries**
2. **Click an enquiry with quotations**
3. **Select a quotation → "Convert to Order"**
4. **Verify OrderForm shows:**
   - ✅ Source quotation badge
   - ✅ Items pre-filled (3 items visible)
   - ✅ Correct prices showing
5. **Save order**
6. **View order details**
7. **Verify you see:**
   - ✅ "Order Traceability" card
   - ✅ Source quotation ID
   - ✅ "View Source Enquiry" button works

---

## Summary

| Phase | What | Time | Files |
|-------|------|------|-------|
| 1A | Pass quotationId in navigation | 5 min | SalesEnquiryDetail.vue |
| 1B | Load quotation in OrderForm | 20 min | OrderForm.vue |
| 1C | Load existing items | 15 min | OrderForm.vue |
| 1D | Fix store payload | 5 min | order-store.ts |
| 2A | Add source banner | 15 min | OrderForm.vue |
| 2B | Add traceability card | 20 min | OrderDetails.vue |
| 2C | Add validation | 15 min | OrderForm.vue |
| **Test** | **Verify everything** | **30 min** | All |

**TOTAL: ~2.5 hours to implement everything**

---

## Do You Want Me To:

1. **Implement all changes for you?** (Most efficient)
2. **Do it step-by-step while you watch?** (Most educational)
3. **Give you a checklist to do yourself?** (Most independent)

Which approach would you prefer?
