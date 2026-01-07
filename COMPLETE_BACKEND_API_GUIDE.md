# Orders Module - Complete Backend Data Fetching Guide

## Overview
All data in the Orders form is fetched from the backend API. No hardcoded values exist. This document lists all the API endpoints required and their expected behavior.

---

## Data Flow Architecture

```
Component (OrderForm.vue)
    ↓
onMounted() hook
    ↓
loadDropdownData() function
    ↓
Promise.all([9 fetch methods])
    ↓
Pinia Store (order-store.ts)
    ↓
API Calls via Axios
    ↓
Backend Endpoints
```

---

## Complete List of Backend Endpoints Required

### 1. Order Management Endpoints

#### GET `/orders` - List Orders
**Purpose**: Fetch all orders with filtering
**Used by**: OrderList.vue
**Query Parameters**:
- `search`: string (optional)
- `type`: string (optional)
- `status`: string (optional)
- `page`: number (default: 1)
- `per_page`: number (default: 15)

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "order_number": "ORD-001",
      "order_type": "SALES",
      "status": "PENDING",
      "order_date": "2026-01-07",
      "currency": "USD",
      "exchange_rate": 1.0,
      "vat": 0,
      "expenses": 0,
      "items": [],
      "parties": [],
      "participants": {},
      "created_at": "2026-01-07T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "per_page": 15,
    "current_page": 1,
    "last_page": 7
  }
}
```

#### POST `/orders` - Create Order
**Purpose**: Create a new order
**Used by**: OrderForm.vue (create mode)
**Request Body**:
```json
{
  "order_number": "string",
  "order_type": "string",
  "status": "string",
  "order_date": "date",
  "currency": "string",
  "exchange_rate": "number",
  "enquiry_id": "number",
  "quotation_id": "number",
  "vat": "number",
  "expenses": "number",
  "reference_number": "string",
  "payment_terms": "string",
  "notes": "string",
  "items": [
    {
      "name": "string",
      "category": "string",
      "unit_price": "number",
      "quantity": "number",
      "rate": "number"
    }
  ],
  "parties": [
    {
      "role": "string",
      "entity": "string",
      "contact": "string",
      "email": "string"
    }
  ],
  "participants": {
    "hunters": "number",
    "observers": "number",
    "companions": "number"
  },
  "hotel_location": "string",
  "hotel_check_in": "date",
  "hotel_nights": "number",
  "dietary_preferences": "string",
  "allergies": ["string"]
}
```

#### GET `/orders/{id}` - Get Single Order
**Purpose**: Fetch a specific order for editing
**Used by**: OrderForm.vue (edit mode), OrderDetails.vue
**Response**: Same as list order format

#### PUT `/orders/{id}` - Update Order
**Purpose**: Update an existing order
**Used by**: OrderForm.vue (edit mode)
**Request Body**: Same as POST /orders

#### DELETE `/orders/{id}` - Delete Order
**Purpose**: Delete an order
**Used by**: OrderList.vue

---

### 2. Order Type Endpoint

#### GET `/orders/order-types`
**Purpose**: Fetch all available order types
**Called by**: OrderForm.vue on mount
**Response Format**:
```json
{
  "data": [
    {"id": 1, "name": "Sales"},
    {"id": 2, "name": "Purchase"},
    {"id": 3, "name": "Transfer"}
  ]
}
```

**Flexible Format** (also supported):
```json
{
  "data": [
    {"value": "SALES", "label": "Sales"},
    {"value": "PURCHASE", "label": "Purchase"}
  ]
}
```

---

### 3. Order Status Endpoint

#### GET `/orders/order-statuses`
**Purpose**: Fetch all available order statuses
**Called by**: OrderForm.vue on mount
**Response Format**:
```json
{
  "data": [
    {"id": 1, "name": "Draft"},
    {"id": 2, "name": "Pending"},
    {"id": 3, "name": "Approved"},
    {"id": 4, "name": "Completed"},
    {"id": 5, "name": "Cancelled"}
  ]
}
```

---

### 4. Currency Endpoint

#### GET `/settings/currencies`
**Purpose**: Fetch all available currencies
**Called by**: OrderForm.vue on mount
**Response Format**:
```json
{
  "data": [
    {"id": "USD", "code": "USD", "name": "US Dollar"},
    {"id": "EUR", "code": "EUR", "name": "Euro"},
    {"id": "GBP", "code": "GBP", "name": "British Pound"},
    {"id": "ZWL", "code": "ZWL", "name": "Zimbabwean Dollar"}
  ]
}
```

---

### 5. Sales Enquiries Endpoint

#### GET `/sales/sales-inquiries`
**Purpose**: Fetch all sales enquiries for linking to orders
**Called by**: OrderForm.vue on mount
**Response Format**:
```json
{
  "data": [
    {"id": 1, "name": "Enquiry #1", "customer": "ABC Company"},
    {"id": 2, "name": "Enquiry #2", "customer": "XYZ Corp"}
  ]
}
```

---

### 6. Quotations Endpoint

#### GET `/sales-confirmation/proposals`
**Purpose**: Fetch all quotations/proposals
**Called by**: OrderForm.vue on mount
**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Quote #001",
      "enquiry_id": 1,
      "amount": 5000
    },
    {
      "id": 2,
      "name": "Quote #002",
      "enquiry_id": 1,
      "amount": 6000
    }
  ]
}
```

---

### 7. Dietary Preferences Endpoint

#### GET `/orders/dietary-preferences`
**Purpose**: Fetch all dietary preference options
**Called by**: OrderForm.vue on mount
**Used in**: Tab 3 "Dietary Preferences" dropdown
**Response Format**:
```json
{
  "data": [
    {"id": 1, "name": "None"},
    {"id": 2, "name": "Vegetarian"},
    {"id": 3, "name": "Vegan"},
    {"id": 4, "name": "Halal"},
    {"id": 5, "name": "Kosher"},
    {"id": 6, "name": "No Dairy"},
    {"id": 7, "name": "No Gluten"}
  ]
}
```

**NOTE**: This endpoint must be created if it doesn't exist. It's new for the Orders module.

---

### 8. Allergies Endpoint

#### GET `/orders/allergies`
**Purpose**: Fetch all allergy/allergen options
**Called by**: OrderForm.vue on mount
**Used in**: Tab 3 "Allergies" checkboxes
**Response Format**:
```json
{
  "data": [
    {"id": 1, "name": "Peanuts"},
    {"id": 2, "name": "Shellfish"},
    {"id": 3, "name": "Tree Nuts"},
    {"id": 4, "name": "Milk"},
    {"id": 5, "name": "Eggs"},
    {"id": 6, "name": "Fish"}
  ]
}
```

**NOTE**: This endpoint must be created if it doesn't exist. It's new for the Orders module.

---

### 9. Party Roles Endpoint

#### GET `/orders/party-roles`
**Purpose**: Fetch all party role options
**Called by**: OrderForm.vue on mount
**Used in**: Tab 2 "Add Party" modal/form
**Response Format**:
```json
{
  "data": [
    {"id": "supplier", "name": "Supplier"},
    {"id": "customer", "name": "Customer"},
    {"id": "guide", "name": "Guide"},
    {"id": "partner", "name": "Partner"},
    {"id": "broker", "name": "Broker"},
    {"id": "operator", "name": "Operator"}
  ]
}
```

**NOTE**: This endpoint must be created if it doesn't exist. It's new for the Orders module.

---

### 10. Item Categories Endpoint

#### GET `/orders/item-categories`
**Purpose**: Fetch all item category options
**Called by**: OrderForm.vue on mount
**Used in**: Tab 2 "Add Item" modal/form
**Response Format**:
```json
{
  "data": [
    {"id": 1, "name": "Permit"},
    {"id": 2, "name": "License"},
    {"id": 3, "name": "Service"},
    {"id": 4, "name": "Equipment"},
    {"id": 5, "name": "Accommodation"},
    {"id": 6, "name": "Transport"},
    {"id": 7, "name": "Extra"}
  ]
}
```

**NOTE**: This endpoint must be created if it doesn't exist. It's new for the Orders module.

---

## Data Fetching Sequence

### On Component Mount (OrderForm.vue):

1. **loadDropdownData()** is called
2. **Promise.all()** executes all 9 fetch methods in parallel:
   - fetchOrderTypes()
   - fetchOrderStatuses()
   - fetchCurrencies()
   - fetchEnquiries()
   - fetchQuotations()
   - fetchDietaryPreferences()
   - fetchAllergies()
   - fetchPartyRoles()
   - fetchItemCategories()

3. **Data stored in Pinia store** as:
   - orderStore.orderTypes
   - orderStore.orderStatuses
   - orderStore.currencies
   - orderStore.enquiries
   - orderStore.quotations
   - orderStore.dietaryPreferences
   - orderStore.allergies
   - orderStore.partyRoles
   - orderStore.itemCategories

4. **loadExistingOrder()** is called (if editing)
   - Fetches order by ID: GET `/orders/{id}`
   - Pre-fills all form fields with existing data

5. **Template renders with data**
   - All dropdowns show fetched options
   - Item and Party tables initialized (empty or pre-filled)

---

## API Response Handling

### Success Response
- Status: 200-299
- Data extracted from: `response.data.data` or `response.data`
- Stored in Pinia state
- Component re-renders with fresh data

### Error Response
- Status: 400-599
- Error message: `response.data.message`
- Logged to console
- Gracefully falls back to empty array
- UI doesn't break, form still usable

### Timeout/Network Error
- Falls back to empty array
- User sees empty dropdown (user-friendly)
- Logged to console for debugging

---

## Data Binding Examples

### Order Types Dropdown (Tab 1)
```vue
<select v-model="form.orderType" class="form-select">
  <option value="">-- Select Type --</option>
  <option v-for="type in orderTypes" :key="type.id" :value="type.id">
    {{ type.name }}
  </option>
</select>
```

**Data Source**: 
- `orderTypes` computed property
- Points to: `orderStore.orderTypes`
- Populated by: `fetchOrderTypes()` API call

### Item Categories Dropdown (Tab 2 - Add Item Form)
```vue
<select v-model="newItem.category" class="form-select">
  <option value="">-- Select Category --</option>
  <option v-for="cat in itemCategories" :key="cat.id || cat.value" :value="cat.id || cat.value">
    {{ cat.name || cat.label }}
  </option>
</select>
```

**Data Source**:
- `itemCategories` computed property
- Points to: `orderStore.itemCategories`
- Populated by: `fetchItemCategories()` API call

### Allergies Checkboxes (Tab 3)
```vue
<div v-for="allergy in allergies" :key="allergy.id || allergy.value" class="form-check">
  <input
    v-model="form.allergies"
    type="checkbox"
    :value="allergy.id || allergy.value"
  />
  <label>{{ allergy.name || allergy.label }}</label>
</div>
```

**Data Source**:
- `allergies` computed property
- Points to: `orderStore.allergies`
- Populated by: `fetchAllergies()` API call

---

## Testing Checklist

### Backend Endpoints
- [ ] GET `/orders/order-types` returns data
- [ ] GET `/orders/order-statuses` returns data
- [ ] GET `/settings/currencies` returns data
- [ ] GET `/sales/sales-inquiries` returns data
- [ ] GET `/sales-confirmation/proposals` returns data
- [ ] GET `/orders/dietary-preferences` returns data (CREATE if missing)
- [ ] GET `/orders/allergies` returns data (CREATE if missing)
- [ ] GET `/orders/party-roles` returns data (CREATE if missing)
- [ ] GET `/orders/item-categories` returns data (CREATE if missing)

### Frontend Behavior
- [ ] Navigate to `/orders/create`
- [ ] All 9 dropdowns populate with data from backend
- [ ] No hardcoded values visible
- [ ] Can select values from all dropdowns
- [ ] Add Item form has category dropdown populated
- [ ] Add Party form has role dropdown populated
- [ ] Dietary preferences dropdown works
- [ ] Allergies checkboxes show all options
- [ ] Create order with all data → submits successfully
- [ ] Edit order → all fields pre-fill with saved values
- [ ] All dropdowns re-populate correctly on edit

### Browser DevTools
- [ ] Network tab shows all 9 API calls on page load
- [ ] Console shows no errors
- [ ] All API responses return 200 status
- [ ] Pinia store contains all data (Vue DevTools)

---

## Endpoints That Need Creation

If these endpoints don't exist in your backend, create them:

1. **GET `/orders/dietary-preferences`** → Return dietary preference options
2. **GET `/orders/allergies`** → Return allergy/allergen options
3. **GET `/orders/party-roles`** → Return party role options
4. **GET `/orders/item-categories`** → Return item category options

All other endpoints should already exist in your system.

---

## Summary

✅ **All data is fetched from backend**
✅ **No hardcoded values in form**
✅ **9 API endpoints integrated**
✅ **Flexible response format handling**
✅ **Error handling with graceful fallbacks**
✅ **Parallel data loading for performance**
✅ **Pre-filling on edit mode**

**Status**: Ready for testing - Implement missing backend endpoints as listed above.
