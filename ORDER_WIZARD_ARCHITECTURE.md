# Order Wizard Architecture Guide

## Overview

The Bushman ERP system uses a **multi-step wizard pattern** for complex business operations. Each wizard guides users through a structured workflow with related data management.

## How Other Modules Handle Multi-Step Workflows

### 1. Sales Inquiries Module (`SalesInquiryWizard.vue`)

**Current Implementation**:
- ✅ Multi-step form with 5+ sections
- ✅ Customer Selection Modal (Pre-wizard)
- ✅ Sequential form validation
- ✅ Progress tracking
- ✅ Save & Continue functionality

**Steps**:
1. **Customer/Party Selection** - Who is involved (embedded in modal before wizard)
2. **Hunt Details** - Season, dates, area, package
3. **Participant Configuration** - Hunters, companions, observers
4. **Species Selection** - What animals to hunt
5. **Pricing & Packages** - Cost breakdown
6. **Extras & Add-ons** - Safari packages, equipment
7. **Final Review** - Summary before submission

**Data Stored**:
```typescript
SalesInquiry Model:
- customer info
- season, dates, area
- hunt parameters
- participant counts
- species list
- pricing details
- special requests
```

### 2. Price List Management

**Current Implementation**:
- ✅ Simple form (not wizard)
- ✅ Shows pricing for different hunt types
- ✅ Links to hunt lengths, species rates
- Readonly view in most cases

**Data Stored**:
```typescript
PriceList Model:
- base hunting rates
- companion rates
- observer rates
- safari package extras
- hunting license costs
```

### 3. Sales Confirmation Proposals (Quotations)

**Current Implementation**:
- ✅ Auto-generated from inquiry
- ✅ Shows approved pricing
- Can mark as confirmed/completed
- Linked to inquiry

**Data Stored**:
```typescript
SalesEnquiryPricing Model:
- price breakdown
- payment terms
- installment schedule
- total amount
```

---

## The Orders Module - Missing Pieces

Your 7-step wizard needs to handle data that doesn't currently exist in the system:

### ❌ Step 1: Order Type Selection (SIMPLE)
**Current Status**: ✅ Implemented
- SALES / PURCHASE / TRANSFER
- Already in OrderForm

### ❌ Step 2: Party Management (MISSING)
**What needs to happen**:
- Drag-drop interface for assigning roles
- Roles: CUSTOMER, SUPPLIER, AGENT, BROKER, BILL-TO, SHIP-TO
- Select from existing entities/contacts

**Where this should be managed**:
- **Database**: `OrderParty` table (already exists in backend)
- **API Endpoint**: `POST /orders/{id}/parties`
- **New Component**: `OrderParties.vue` sub-component

**How Sales Inquiries does it**:
- Passes `customer_data` through wizard
- Stores in SalesInquiry.customer_id

### ❌ Step 3: Item Selection (MISSING)
**What needs to happen**:
- Search/autocomplete items from catalog
- Category filtering (species, equipment, services)
- Variants selection (e.g., "Lion - Plains Game" vs "Lion - Desert")
- Pricing retrieval
- Quantity and rate adjustment

**Where this should be managed**:
- **Database**: `OrderItem` table (exists)
- **API Endpoint**: `POST /orders/{id}/items`
- **New Component**: `OrderItems.vue` sub-component
- **Required**: Item catalog/inventory API

**How others do it**:
- SalesInquiry → selects species directly (not items)
- PriceList → shows rates, not items
- **Solution**: Create item search similar to PosCustomerOrder.vue

### ❌ Step 4: Logistics Planning (MISSING)
**What needs to happen**:
- Hotel bookings (dates, location, rooms)
- Charter flights (departure, destination, capacity)
- Ground transfers (pickup/dropoff times)
- Timeline builder (Gantt-like view)

**Where this should be managed**:
- **Database**: `OrderLogistic` table (exists)
- **API Endpoint**: `POST /orders/{id}/logistics`
- **New Component**: `OrderLogistics.vue` sub-component
- **Required**: Hotel, charter, transport modules/APIs

**How others do it**:
- SalesInquiry → captures dates & area only
- No logistics management yet
- **Solution**: New functionality, use Hotel/Charter modules if available

### ❌ Step 5: Participant Management (PARTIALLY)
**What needs to happen**:
- Counters: Hunters, Observers, Companions, Guides
- Total validation
- Assign specific people to roles
- Pricing impact calculation

**Where this should be managed**:
- **Database**: `OrderParticipant` table (exists)
- **API Endpoint**: `POST /orders/{id}/participants`
- **New Component**: `OrderParticipants.vue` sub-component

**How Sales Inquiries does it**:
```typescript
// In SalesInquiryWizard - Participant counts
form.numberOfHunters = 2
form.numberOfCompanions = 1
form.numberOfObservers = 3
form.numberOfGuides = 0  // Auto-calculated
```

### ❌ Step 6: Payment Terms (MISSING)
**What needs to happen**:
- Installment schedule builder
- Due dates
- Payment methods
- Discount/surcharge application

**Where this should be managed**:
- **Database**: `OrderPaymentTerm` table (doesn't exist yet)
- **New API**: `POST /orders/{id}/payment-terms`
- **New Component**: `OrderPaymentTerms.vue` sub-component
- **Reference**: SalesEnquiryPricing has payment_terms field

**How others do it**:
- SalesEnquiryPricing → stores total price only
- No installment management
- **Solution**: New functionality

### ❌ Step 7: Preferences & Notes (PARTIALLY)
**What needs to happen**:
- Allergies & dietary restrictions
- Special requests
- VIP notes
- Activity preferences

**Where this should be managed**:
- **Database**: `OrderPreference` table (exists)
- **API Endpoint**: `POST /orders/{id}/preferences`
- **New Component**: Could be inline in form

**How Sales Inquiries does it**:
```typescript
form.special_requests = "..."  // Free text field
```

---

## Recommended Implementation Architecture

### Option A: Tabbed Form (Simpler)
```vue
OrderForm.vue (Main)
├── Tab 1: Basic Info (type, status, dates)
├── Tab 2: Parties (drag-drop roles)
├── Tab 3: Items (search & add)
├── Tab 4: Logistics (flights, hotels, transfers)
├── Tab 5: Participants (counters + assignments)
├── Tab 6: Payment (installments)
└── Tab 7: Preferences (notes, allergies)
```

**Pros**: Easy to navigate, can save at each step  
**Cons**: Less immersive than wizard

### Option B: True Wizard (Current SalesInquiry pattern)
```vue
OrderWizard.vue
├── Step 1: Type Selection
├── Step 2: Party Selection Modal → Back to main
├── Step 3: Items Selection
├── Step 4: Logistics
├── Step 5: Participants
├── Step 6: Payment Terms
├── Step 7: Review & Submit
└── Success Page
```

**Pros**: Guided, linear flow, validates as you go  
**Cons**: Can't jump between steps, more code

### Option C: Hybrid (Recommended)
- **Create**: Use simplified wizard (Steps 1-3)
- **Edit**: Use tabbed form (easier to modify pieces)
- **Reference**: Link to inquiry/quotation in Step 1

---

## Implementation Roadmap

### Phase 1: Core (What exists)
- ✅ OrderForm (basic fields)
- ✅ OrderList (CRUD)
- ✅ OrderDetails (view)

### Phase 2: Sub-Components (What's needed)
```
1. OrderParties.vue
   - Role selector (drag-drop)
   - Entity search & link
   - Contact details
   - API: POST /orders/{id}/parties

2. OrderItems.vue
   - Item search with catalog
   - Quantity & rate editor
   - Discount calculator
   - API: POST /orders/{id}/items

3. OrderParticipants.vue
   - Counters (hunters, observers, etc.)
   - People assignment
   - Pricing impact
   - API: POST /orders/{id}/participants

4. OrderLogistics.vue
   - Timeline editor (Gantt-like)
   - Hotel bookings
   - Charter flights
   - Transfers
   - API: POST /orders/{id}/logistics

5. OrderPaymentTerms.vue (NEW)
   - Installment schedule
   - Payment methods
   - Discount terms
   - API: POST /orders/{id}/payment-terms

6. OrderPreferences.vue
   - Allergies & diet
   - VIP notes
   - Activity preferences
   - API: POST /orders/{id}/preferences
```

### Phase 3: Backend (What's needed)
- New models:
  - `OrderPaymentTerm` (if not exists)
  - Migrate item selection logic
  
- New/Updated endpoints:
  - `GET /items/search?category=&keyword=`
  - `GET /items/{id}/pricing`
  - `POST /orders/{id}/payment-terms`
  - Update existing: `/orders/{id}/parties`, `/items`, `/participants`, `/logistics`, `/preferences`

---

## Data Flow Example: Creating an Order with Full Wizard

```typescript
// Step 1: Type Selection
const order = {
  order_number: 'ORD-2025-001',
  type: 'SALES',
  status: 'DRAFT'
}

// Step 2: Party Management
const parties = [
  { role: 'CUSTOMER', entity_id: 123, name: 'John Doe Safari' },
  { role: 'SUPPLIER', entity_id: 456, name: 'Tanzanian Outfitters' },
  { role: 'AGENT', entity_id: 789, name: 'Safari Booking Agent Inc.' }
]

// Step 3: Items
const items = [
  { item_id: 1, name: 'Lion Hunt', quantity: 2, rate: 5000, discount: 0 },
  { item_id: 2, name: 'Equipment Rental', quantity: 1, rate: 1000, discount: 100 }
]

// Step 4: Logistics
const logistics = [
  { type: 'HOTEL', location: 'Serengeti', check_in: '2025-06-01', nights: 7 },
  { type: 'CHARTER', from: 'Dar', to: 'Serengeti', date: '2025-06-01', pax: 4 },
  { type: 'TRANSFER', location: 'Airport → Hotel', date: '2025-06-01' }
]

// Step 5: Participants
const participants = [
  { type: 'HUNTER', count: 2, people: [{ name: 'Guest 1' }, { name: 'Guest 2' }] },
  { type: 'OBSERVER', count: 1, people: [{ name: 'Spouse' }] },
  { type: 'GUIDE', count: 2 }  // Auto-assigned by system
]

// Step 6: Payment Terms
const paymentTerms = [
  { installment: 1, amount: 5000, due_date: '2025-04-01', status: 'PENDING' },
  { installment: 2, amount: 5000, due_date: '2025-05-01', status: 'PENDING' },
  { installment: 3, amount: 1900, due_date: '2025-06-01', status: 'PENDING' }
]

// Step 7: Preferences
const preferences = {
  allergies: ['Shellfish', 'Peanuts'],
  dietary: 'Vegetarian',
  special_requests: 'Early morning game drives preferred',
  vip_notes: 'Upgrade to deluxe tent',
  activity_preferences: ['Photography', 'Bird watching']
}

// All saved via:
await orderStore.createOrder(order)
await orderStore.addParties(order.id, parties)
await orderStore.addItems(order.id, items)
await orderStore.addLogistics(order.id, logistics)
await orderStore.addParticipants(order.id, participants)
await orderStore.addPaymentTerms(order.id, paymentTerms)
await orderStore.addPreferences(order.id, preferences)
```

---

## Next Steps

**Immediate**:
1. Define which pattern (Tabbed vs Wizard vs Hybrid)
2. Create backend endpoints for missing sub-components
3. Build sub-components one by one

**Short-term**:
1. Add Party selection UI
2. Implement item search/selection
3. Add payment terms scheduling

**Medium-term**:
1. Logistics timeline builder
2. Participant assignment
3. Integration with hotel/charter systems

**Long-term**:
1. Advanced preferences (activity, dietary)
2. Multi-tenant logistics
3. Reporting & analytics

---

## Comparison Table

| Feature | SalesInquiry | SalesQuotation | PriceList | Orders (Today) | Orders (Proposed) |
|---------|--------------|----------------|-----------|----------------|-------------------|
| Multi-step | ✅ Wizard | ❌ Auto-gen | ❌ Simple | ❌ Form | ✅ Wizard |
| Party Mgmt | ✅ Customer | ✅ Customer | ❌ N/A | ❌ Missing | ✅ Full |
| Items | ❌ Species | ✅ Specs | ❌ Rates | ⚠️ Planned | ✅ Full |
| Participants | ✅ Counts | ✅ Counts | ❌ N/A | ❌ Missing | ✅ Full |
| Logistics | ❌ N/A | ✅ Dates | ❌ N/A | ❌ Missing | ✅ Full |
| Payment Terms | ❌ N/A | ✅ Basic | ❌ N/A | ❌ Missing | ✅ Full |
| Preferences | ✅ Text | ❌ N/A | ❌ N/A | ❌ Missing | ✅ Full |

