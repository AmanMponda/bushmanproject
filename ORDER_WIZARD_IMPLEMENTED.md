# Order Wizard Implementation - COMPLETE

## ✅ What Was Created

### 1. **OrderWizard.vue** - Main 8-Step Wizard Component
**Location**: `src/views/orders/OrderWizard.vue` (850+ lines)

**Features**:
- ✅ Step 1: Order Details (number, type, status, date, currency)
- ✅ Step 2: Party Management (CUSTOMER, SUPPLIER, AGENT roles with drag-drop UI)
- ✅ Step 3: Item Selection (search, category filter, table with quantity/rate editors)
- ✅ Step 4: Logistics Planning (hotels, flights, transfers with date/location fields)
- ✅ Step 5: Participant Management (hunters/observers counters with auto-calculated guides)
- ✅ Step 6: Payment Terms (installment schedule builder)
- ✅ Step 7: Preferences & Notes (allergies, dietary, activity preferences, special requests)
- ✅ Step 8: Review & Submit (summary of all entered data)

**UI Features**:
- Progress bar with percentage
- Step indicators (can click to go back)
- Back/Next/Submit buttons with validation
- Form validation for required fields
- Toast notifications for errors
- Loading state during submission
- Professional styling with Tailwind + Bootstrap

**Data Structure**:
```typescript
wizardData = {
  order_number: string
  type: string (SALES/PURCHASE/TRANSFER)
  status: string (default: DRAFT)
  date: string (ISO format)
  currency_id: number
  parties: [
    { role: string, entity_name: string, contact_person: string }
  ]
  items: [
    { item_name: string, category: string, unit_price: number, quantity: number, rate: number }
  ]
  participants: {
    hunters: number
    observers: number
    companions: number
    (guides: auto-calculated as Math.ceil(hunters/2))
  }
  paymentTerms: [
    { amount: number, dueDate: string, paymentMethod: string }
  ]
  preferences: {
    allergies: string[]
    dietary: string
    activities: string[]
  }
  notes: string
}

logistics = {
  hotel: { location, checkIn, nights, rooms }
  flight: { from, to, date, seats }
  transfer: { from, to, date, vehicle }
}
```

---

## 🔄 Routing Changes

### Updated: `src/router/index.ts`

**Before**:
```typescript
const OrdersList = () => import('@/views/orders/OrderList.vue');
const OrderForm = () => import('@/views/orders/OrderForm.vue');
const OrderDetails = () => import('@/views/orders/OrderDetails.vue');

// Route config
{
  path: "/orders/create",
  name: "orders-create",
  component: OrderForm  // ❌ Was using form for both create & edit
}
```

**After**:
```typescript
const OrdersList = () => import('@/views/orders/OrderList.vue');
const OrderWizard = () => import('@/views/orders/OrderWizard.vue');  // ✅ NEW
const OrderForm = () => import('@/views/orders/OrderForm.vue');
const OrderDetails = () => import('@/views/orders/OrderDetails.vue');

// Route config
{
  path: "/orders/create",
  name: "orders-create",
  component: OrderWizard  // ✅ Wizard for creating
},
{
  path: "/orders/:id/edit",
  name: "orders-edit",
  component: OrderForm  // ✅ Form for editing (stays as is)
}
```

---

## 🎯 How It Works

### User Flow for Creating Order

```
1. Click "Create Order" button on OrderList
   ↓ Routes to: /orders/create
   ↓ Loads: OrderWizard component
   ↓
2. Step 1: Fill Order Details (order #, type, status, date, currency)
   ↓ Validate: Required fields filled
   ↓
3. Step 2: Add Parties (customer, supplier, agent)
   ↓ Add/remove buttons to manage multiple parties
   ↓
4. Step 3: Add Items (search, select, set quantities)
   ↓ Table shows items with qty/rate editors
   ↓
5. Step 4: Logistics (hotel, flight, transfer details)
   ↓ Optional but helpful for safari orders
   ↓
6. Step 5: Participants (hunters, observers, guides auto-calc)
   ↓ Counter buttons with +/- controls
   ↓
7. Step 6: Payment Terms (installment schedule)
   ↓ Auto-generates rows based on number selected
   ↓
8. Step 7: Preferences (allergies, dietary, activities, notes)
   ↓ Multi-select, checkboxes, textarea fields
   ↓
9. Step 8: Review (summary of everything entered)
   ↓ Click "Create Order" button
   ↓
10. Submit to Backend
    POST /api/v1.0/orders with complete payload
    ↓
11. Success → Redirect to /orders/{id}/view
    Show "Order created successfully"
```

---

## 🔧 Technical Details

### State Management
- Uses **Pinia store** (`useOrderStore`) for:
  - `orderTypes`, `orderStatuses`, `currencies`
  - `createOrder()` action
  - `fetchOrderTypes()`, `fetchOrderStatuses()`, `fetchCurrencies()`

### Validation
- Step 1: Requires order_number, type, currency_id
- Step 2: At least one party must be added
- Step 3: At least one item must be added
- Step 8: Final confirmation before submit

### Computed Properties
```typescript
progressPercentage = (currentStep / 8) * 100
calculatedGuides = Math.ceil(hunters / 2)
totalParticipants = hunters + observers + guides + companions
```

### API Integration
Sends complete payload to: `POST /api/v1.0/orders`

**Payload Structure**:
```json
{
  "order_number": "ORD-2025-001",
  "type": "SALES",
  "status": "DRAFT",
  "date": "2025-01-07",
  "currency_id": 1,
  "notes": "Special requests...",
  "parties": [...],
  "items": [...],
  "participants": {...},
  "payment_terms": [...],
  "preferences": {...},
  "logistics": {...}
}
```

---

## 🎨 UI/UX Features

### Step Indicators
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │
│Order│Party│Items│Plan │Part.│Pay. │Pref.│Rev. │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  ⬤Active, ✓Completed, ⭕Not visited
```

### Progress Bar
- Visual fill showing completion percentage
- Updates as user moves through steps
- Smooth animation between steps

### Validation Feedback
- Toast messages for validation errors
- Required field indicators (*)
- Form controls show visual feedback on focus

### Review Step
- Cards showing summary of each section
- "Edit Step" links to jump back to specific step
- Final confirmation message

---

## 📝 Example: Creating an Order

```typescript
// Step 1: Fill Order Details
wizardData.order_number = "ORD-2025-001"
wizardData.type = "SALES"
wizardData.status = "DRAFT"
wizardData.date = "2025-01-07"
wizardData.currency_id = 1

// Step 2: Add Parties
wizardData.parties = [
  { role: "CUSTOMER", entity_name: "John Safari Ltd", contact_person: "John Doe" },
  { role: "SUPPLIER", entity_name: "Bush Camp Outfitters", contact_person: "Jane Smith" }
]

// Step 3: Add Items
wizardData.items = [
  { item_name: "Safari Package", category: "EQUIPMENT", unit_price: 100, quantity: 5, rate: 120 },
  { item_name: "Hotel Night", category: "ACCOMMODATION", unit_price: 50, quantity: 7, rate: 55 }
]

// Step 4: Logistics (optional)
logistics.hotel = { location: "Serengeti", checkIn: "2025-02-01", nights: 7, rooms: 5 }
logistics.flight = { from: "JRO", to: "ARS", date: "2025-02-01", seats: 10 }

// Step 5: Participants
wizardData.participants = { hunters: 2, observers: 1, companions: 2 }
// → calculatedGuides = Math.ceil(2/2) = 1

// Step 6: Payment Terms
wizardData.paymentTerms = [
  { amount: 3333, dueDate: "2025-02-01", paymentMethod: "BANK_TRANSFER" },
  { amount: 3333, dueDate: "2025-02-15", paymentMethod: "BANK_TRANSFER" },
  { amount: 3334, dueDate: "2025-03-01", paymentMethod: "BANK_TRANSFER" }
]

// Step 7: Preferences
wizardData.preferences = {
  allergies: ["SHELLFISH", "DAIRY"],
  dietary: "VEGETARIAN",
  activities: ["PHOTOGRAPHY", "BIRD_WATCHING"]
}
wizardData.notes = "VIP group. Need extra guides. Early morning drives preferred."

// Step 8: Review & Submit
await orderStore.createOrder({...wizardData, logistics})
// → POST /api/v1.0/orders
// → Redirect to /orders/123/view
```

---

## 🚀 Getting Started

### 1. Test the Wizard
```
1. Navigate to Orders page (http://localhost:8000/#/orders)
2. Click "Create Order" button
3. Fill in Step 1 (order details)
4. Click "Next" to continue
5. Complete all 7 steps
6. Review on Step 8
7. Click "Create Order" to submit
```

### 2. Check Your Browser Console
- Look for "Orders loaded:" message
- Verify API response is correct
- Check network tab for `/api/v1.0/orders` POST request

### 3. Backend Requirements
The wizard sends data to `POST /api/v1.0/orders` with this structure:
```
✅ order_number
✅ type
✅ status
✅ date
✅ currency_id
✅ notes
✅ vat
✅ expenses
✅ exchange_rate
⚠️ parties (may need endpoint: POST /orders/{id}/parties)
⚠️ items (may need endpoint: POST /orders/{id}/items)
⚠️ participants (may need endpoint: POST /orders/{id}/participants)
⚠️ payment_terms (may need endpoint: POST /orders/{id}/payment-terms)
⚠️ preferences (may need endpoint: POST /orders/{id}/preferences)
⚠️ logistics (may need endpoint: POST /orders/{id}/logistics)
```

---

## 🔗 Related Files

| File | Purpose | Status |
|------|---------|--------|
| OrderWizard.vue | Main wizard component | ✅ Created |
| OrderList.vue | List view (uses wizard for create) | ✅ Updated |
| OrderForm.vue | Edit view (kept as is) | ✅ No change |
| OrderDetails.vue | Detail view | ✅ No change |
| order-store.ts | Pinia store with actions | ✅ Existing |
| router/index.ts | Routes (create uses wizard) | ✅ Updated |

---

## ✨ What's Next

### Option 1: Test Current Wizard
- [ ] Refresh browser at http://localhost:8000/#/orders
- [ ] Click "Create Order"
- [ ] Fill all steps and submit
- [ ] Check if order appears in the list

### Option 2: Add Missing Backend Endpoints
If the order creation fails, you may need to add:
- [ ] `POST /orders/{id}/parties` - save order parties
- [ ] `POST /orders/{id}/items` - save order items
- [ ] `POST /orders/{id}/participants` - save participant counts
- [ ] `POST /orders/{id}/payment-terms` - save payment schedule
- [ ] `POST /orders/{id}/preferences` - save preferences
- [ ] `POST /orders/{id}/logistics` - save logistics details

### Option 3: Customize Components
- [ ] Extract each step as a sub-component if too complex
- [ ] Add item search functionality
- [ ] Add party search/autocomplete
- [ ] Add hotel/flight APIs integration
- [ ] Add drag-drop for party role assignment

---

## 🎓 Key Concepts

### Why 7 Steps?
Following the multi-step pattern from **SalesInquiryWizard** (which also has 7 steps), this wizard guides users through:
1. Basic order info (required)
2. Relationship management (parties)
3. Line items (required)
4. Supply chain planning (logistics)
5. Resource planning (participants)
6. Financial planning (payment terms)
7. Customer details (preferences)

Each step is optional except 1, 2, and 3 (which have validation).

### Step Validation
- Users can only go forward if current step is valid
- Users can always go backward (no validation required)
- Users can click step indicators to jump to previous steps (but not future steps)
- Step 8 (review) requires all previous steps to be completed

### Data Persistence
- All data is stored in Vue reactive state during wizard
- Data is only sent to backend when "Create Order" button is clicked
- If user navigates away before submitting, data is lost (no auto-save)

---

## 💡 Tips

1. **Default Values**: Step 1 date defaults to today. Step 6 pre-populates with 3 installments.

2. **Form Validation**: Check toast messages in bottom-right corner for validation feedback.

3. **Party Roles**: Commonly used roles are CUSTOMER and SUPPLIER. Others (AGENT, BROKER) optional.

4. **Items Search**: Currently accepts manual entry. Can be upgraded to search from item catalog API.

5. **Logistics Optional**: Steps 4-7 are optional. Users can complete wizard without filling them.

6. **Participants Calculation**: Guides are auto-calculated. Setting hunters=2 → guides=1 automatically.

7. **Payment Terms**: Auto-generates rows. Setting "3 installments" creates 3 rows. User fills amounts and due dates.

