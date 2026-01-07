# Order Wizard: Visual Architecture & File Structure

## File Organization

```
src/views/orders/
├── OrderList.vue ✅ (DONE)
│   └── Browse all orders, filter by type/status
│
├── OrderForm.vue ⚠️ (PARTIAL - needs wizard layers)
│   └── Main container for wizard/tabs
│
├── OrderDetails.vue ✅ (DONE)
│   └── View order with calculations
│
├── components/ (NEW FOLDER)
│   │
│   ├── OrderBasics.vue (Rename from OrderForm main fields)
│   │   ├── Order number
│   │   ├── Order type selector → /orders/order-types
│   │   ├── Status selector → /orders/order-statuses
│   │   ├── Order date
│   │   └── Currency selector → /settings/currencies
│   │
│   ├── OrderParties.vue (NEW - HIGH PRIORITY)
│   │   ├── Role selector (CUSTOMER, SUPPLIER, AGENT, BROKER, BILL-TO, SHIP-TO)
│   │   ├── Entity search input
│   │   ├── Contact person input
│   │   ├── Email/Phone fields
│   │   └── Add/Remove party buttons
│   │   API: POST/GET /orders/{id}/parties
│   │
│   ├── OrderItems.vue (NEW - CRITICAL)
│   │   ├── Item search bar
│   │   ├── Category filter dropdown
│   │   ├── Search results grid
│   │   ├── Items table (edit quantity, rate, discount)
│   │   ├── Total calculations
│   │   └── Add/Remove item buttons
│   │   API: GET /items/search, POST/GET /orders/{id}/items
│   │
│   ├── OrderLogistics.vue (NEW - MEDIUM PRIORITY)
│   │   ├── Hotel bookings section
│   │   │   ├─ Location input
│   │   │   ├─ Check-in/Check-out dates
│   │   │   └─ Number of rooms
│   │   │
│   │   ├── Charter flights section
│   │   │   ├─ Departure airport
│   │   │   ├─ Destination airport
│   │   │   ├─ Departure date
│   │   │   └─ Capacity
│   │   │
│   │   ├── Ground transfers section
│   │   │   ├─ Pickup location
│   │   │   ├─ Dropoff location
│   │   │   ├─ Date/Time
│   │   │   └─ Vehicle type
│   │   │
│   │   ├── Timeline/Gantt view
│   │   └── Add/Remove logistics buttons
│   │   API: POST/GET /orders/{id}/logistics
│   │
│   ├── OrderParticipants.vue (NEW - HIGH PRIORITY)
│   │   ├── Hunters counter (+/- buttons)
│   │   ├── Observers counter (+/- buttons)
│   │   ├── Guides counter (auto-calculated, readonly)
│   │   ├── Companions counter (+/- buttons)
│   │   ├── People assignment section (expandable)
│   │   │   └─ List of people per role
│   │   └── Total participants display
│   │   API: POST/GET /orders/{id}/participants
│   │
│   ├── OrderPaymentTerms.vue (NEW - MEDIUM PRIORITY)
│   │   ├── Installment count selector
│   │   ├── Installments table
│   │   │   ├─ Installment # (1, 2, 3, ...)
│   │   │   ├─ Amount per installment
│   │   │   ├─ Due date picker
│   │   │   ├─ Payment method selector
│   │   │   └─ Status badge
│   │   │
│   │   ├── Discount/Surcharge inputs
│   │   ├── Early payment discount
│   │   └── Add/Remove installment buttons
│   │   API: POST/GET /orders/{id}/payment-terms (NEW ENDPOINT)
│   │
│   ├── OrderPreferences.vue (NEW - LOW PRIORITY)
│   │   ├── Allergies multi-select
│   │   │   ├─ Shellfish
│   │   │   ├─ Peanuts
│   │   │   ├─ Dairy
│   │   │   └─ Other (text)
│   │   │
│   │   ├── Dietary preferences radio
│   │   │   ├─ Omnivore
│   │   │   ├─ Vegetarian
│   │   │   ├─ Vegan
│   │   │   └─ Kosher/Halal
│   │   │
│   │   ├── Activity preferences checkboxes
│   │   │   ├─ Early morning drives
│   │   │   ├─ Photography focus
│   │   │   ├─ Bird watching
│   │   │   └─ Night safari
│   │   │
│   │   ├── VIP notes textarea
│   │   └── Special requests textarea
│   │   API: POST/GET /orders/{id}/preferences
│   │
│   ├── OrderWizardContainer.vue (NEW - ORCHESTRATOR)
│   │   ├── Step navigation
│   │   ├── Progress indicator
│   │   ├── Dynamic component loader
│   │   ├── Step validation
│   │   ├── Save/Continue buttons
│   │   └── Back button
│   │
│   └── OrderWizardReview.vue (NEW - FINAL STEP)
│       ├── Summary of all entered data
│       ├── Edit buttons (→ back to specific step)
│       └── Submit button
│
└── stores/bushman/
    └── order-store.ts ✅ (DONE - extend with new actions)
        ├── listOrders() ✅
        ├── getOrder() ✅
        ├── createOrder() ✅
        ├── updateOrder() ✅
        ├── deleteOrder() ✅
        │
        ├── addParties() (NEW)
        ├── updateParties() (NEW)
        ├── deleteParties() (NEW)
        │
        ├── addItems() (NEW)
        ├── updateItems() (NEW)
        ├── deleteItems() (NEW)
        │
        ├── addLogistics() (NEW)
        ├── updateLogistics() (NEW)
        ├── deleteLogistics() (NEW)
        │
        ├── addParticipants() (NEW)
        ├── updateParticipants() (NEW)
        ├── deleteParticipants() (NEW)
        │
        ├── addPaymentTerms() (NEW)
        ├── updatePaymentTerms() (NEW)
        ├── deletePaymentTerms() (NEW)
        │
        └── addPreferences() (NEW)
            updatePreferences() (NEW)
            deletePreferences() (NEW)
```

---

## Wizard Flow Diagram

```
START: OrderWizardContainer.vue
    ↓
    ├─ currentStep = 1
    └─ validatePreviousSteps()
    
    ↓ STEP 1: Order Basics
    ┌─────────────────────┐
    │ OrderBasics.vue     │
    │ ✅ Order #          │
    │ ✅ Type             │
    │ ✅ Status           │
    │ ✅ Date             │
    │ ✅ Currency         │
    │                     │
    │ [Next] button       │
    └─────────────────────┘
    ↓
    ├─ currentStep = 2
    └─ Validate Step 1
    
    ↓ STEP 2: Parties
    ┌─────────────────────┐
    │ OrderParties.vue    │
    │ ❌ Customer         │
    │ ❌ Supplier         │
    │ ❌ Agent            │
    │                     │
    │ [Back] [Next]       │
    └─────────────────────┘
    ↓
    ├─ currentStep = 3
    └─ Validate Step 2
    
    ↓ STEP 3: Items
    ┌─────────────────────┐
    │ OrderItems.vue      │
    │ ❌ Item search      │
    │ ❌ Add items        │
    │ ❌ Edit quantities  │
    │ ❌ Totals           │
    │                     │
    │ [Back] [Next]       │
    └─────────────────────┘
    ↓
    ├─ currentStep = 4
    └─ Validate Step 3
    
    ↓ STEP 4: Logistics
    ┌─────────────────────┐
    │ OrderLogistics.vue  │
    │ ❌ Hotels           │
    │ ❌ Flights          │
    │ ❌ Transfers        │
    │ ❌ Timeline         │
    │                     │
    │ [Back] [Next]       │
    └─────────────────────┘
    ↓
    ├─ currentStep = 5
    └─ Validate Step 4
    
    ↓ STEP 5: Participants
    ┌────────────────────────┐
    │ OrderParticipants.vue  │
    │ ❌ Hunters counter     │
    │ ❌ Observers counter   │
    │ ❌ Guides (auto-calc)  │
    │ ❌ Companions counter  │
    │                        │
    │ [Back] [Next]          │
    └────────────────────────┘
    ↓
    ├─ currentStep = 6
    └─ Validate Step 5
    
    ↓ STEP 6: Payment Terms
    ┌──────────────────────────┐
    │ OrderPaymentTerms.vue    │
    │ ❌ Installment schedule  │
    │ ❌ Due dates             │
    │ ❌ Payment methods       │
    │ ❌ Discounts             │
    │                          │
    │ [Back] [Next]            │
    └──────────────────────────┘
    ↓
    ├─ currentStep = 7
    └─ Validate Step 6
    
    ↓ STEP 7: Preferences & Review
    ┌──────────────────────────┐
    │ OrderPreferences.vue     │
    │ ❌ Allergies             │
    │ ❌ Dietary               │
    │ ❌ Activities            │
    │ ❌ Special requests      │
    │                          │
    │ [Back] [Review]          │
    └──────────────────────────┘
    ↓
    ├─ currentStep = 8
    └─ Validate Step 7
    
    ↓ STEP 8 (FINAL): Review
    ┌──────────────────────────────┐
    │ OrderWizardReview.vue        │
    │                              │
    │ Summary Card 1:              │
    │ ✅ Order #: ORD-2025-001     │
    │ ✅ Type: SALES               │
    │ ✅ Date: Jan 5, 2025         │
    │                              │
    │ Summary Card 2:              │
    │ ❌ Customer: XYZ Corp        │
    │ ❌ Supplier: ABC Outfitters  │
    │                              │
    │ Summary Card 3:              │
    │ ❌ Total Items: 5            │
    │ ❌ Total Amount: $25,000     │
    │                              │
    │ Summary Card 4:              │
    │ ❌ Hunters: 2                │
    │ ❌ Observers: 1              │
    │ ❌ Companions: 0             │
    │                              │
    │ Summary Card 5:              │
    │ ❌ 3 Installments            │
    │ ❌ First Due: Feb 1, 2025    │
    │                              │
    │ [Edit Step 1] [Edit Step 2]  │
    │ ... [Edit Step 7]            │
    │                              │
    │ [Back] [SUBMIT ORDER]        │
    └──────────────────────────────┘
    ↓
    ├─ Validate all steps
    ├─ Save to database
    └─ Show success message
    
    ↓ SUCCESS PAGE
    ┌──────────────────────────────┐
    │ Order Created Successfully   │
    │                              │
    │ Order #: ORD-2025-001        │
    │ Status: DRAFT                │
    │ Amount: $25,000              │
    │                              │
    │ [View Order] [Create Another]│
    │ [Back to Orders List]        │
    └──────────────────────────────┘
    
    END
```

---

## Component Hierarchy (Parent-Child)

```
OrderForm.vue (Parent)
│
├─ (If create mode)
│  └─ OrderWizardContainer.vue
│     ├─ Step Navigator
│     ├─ Progress Bar
│     └─ Dynamic Step Loader
│        ├─ OrderBasics.vue (Step 1)
│        ├─ OrderParties.vue (Step 2)
│        ├─ OrderItems.vue (Step 3)
│        ├─ OrderLogistics.vue (Step 4)
│        ├─ OrderParticipants.vue (Step 5)
│        ├─ OrderPaymentTerms.vue (Step 6)
│        ├─ OrderPreferences.vue (Step 7)
│        └─ OrderWizardReview.vue (Step 8)
│
└─ (If edit mode)
   └─ OrderTabsContainer.vue
      ├─ Tabs Navigation
      ├─ OrderBasics.vue (Tab 1)
      ├─ OrderParties.vue (Tab 2)
      ├─ OrderItems.vue (Tab 3)
      ├─ OrderLogistics.vue (Tab 4)
      ├─ OrderParticipants.vue (Tab 5)
      ├─ OrderPaymentTerms.vue (Tab 6)
      └─ OrderPreferences.vue (Tab 7)
```

---

## State Flow (Using Pinia Store)

```
OrderWizardContainer.vue
    │
    ├─ Local State
    │  ├─ currentStep (1-8)
    │  ├─ wizardData (accumulator)
    │  └─ validationErrors
    │
    └─ Pinia Store (orderStore)
       ├─ orders[] (list)
       ├─ currentOrder (detail)
       ├─ loading
       ├─ error
       │
       └─ Actions
          ├─ createOrder() → saves orders[0]
          ├─ addParties() → POST /orders/{id}/parties
          ├─ addItems() → POST /orders/{id}/items
          ├─ addLogistics() → POST /orders/{id}/logistics
          ├─ addParticipants() → POST /orders/{id}/participants
          ├─ addPaymentTerms() → POST /orders/{id}/payment-terms
          └─ addPreferences() → POST /orders/{id}/preferences
```

---

## Data Flow: Creating an Order

```
Step 1: Basic Info
├─ Fill form
├─ Click [Next]
└─ Save to wizardData = { type, status, date, ... }

Step 2: Parties
├─ Add parties
├─ Click [Next]
└─ Append to wizardData.parties = [{ role, entity_id, ... }]

Step 3: Items
├─ Search & select items
├─ Click [Next]
└─ Append to wizardData.items = [{ item_id, qty, rate, ... }]

... (similar for steps 4-7)

Step 8: Review
├─ Display wizardData summary
├─ User clicks [SUBMIT]
└─ Trigger submitOrder()
    │
    ├─ 1. POST /orders (basic info)
    │      → orderId = response.id
    │
    ├─ 2. POST /orders/{orderId}/parties (parties)
    ├─ 3. POST /orders/{orderId}/items (items)
    ├─ 4. POST /orders/{orderId}/logistics (logistics)
    ├─ 5. POST /orders/{orderId}/participants (participants)
    ├─ 6. POST /orders/{orderId}/payment-terms (payment)
    ├─ 7. POST /orders/{orderId}/preferences (preferences)
    │
    ├─ 8. Update store: orderStore.orders.push(newOrder)
    │
    └─ Success → Redirect to /orders or detail view
```

---

## API Request Flow

```
Create Order Wizard - Multi-Step API Calls:

Browser                Backend              Database
  │                      │                    │
  ├─ Step 1 validation   │                    │
  │                      │                    │
  ├─ Step 2 validation   │                    │
  │                      │                    │
  ├─ Step 3 validation   │                    │
  │                      │                    │
  ├─ Final validation    │                    │
  │                      │                    │
  ├─ Click SUBMIT ─────→ POST /orders ─────→ INSERT Order
  │                      ↓                    │
  │                      orderId = 123 ←──┘
  │                      │
  ├──────────────────→ POST /orders/123/parties → INSERT OrderParty
  │                      │
  ├──────────────────→ POST /orders/123/items ─→ INSERT OrderItem
  │                      │
  ├──────────────────→ POST /orders/123/logistics → INSERT OrderLogistic
  │                      │
  ├──────────────────→ POST /orders/123/participants → INSERT OrderParticipant
  │                      │
  ├──────────────────→ POST /orders/123/payment-terms → INSERT OrderPaymentTerm
  │                      │
  ├──────────────────→ POST /orders/123/preferences → INSERT OrderPreference
  │                      │
  ├← Success response ←─┤
  │                      │
  └─ Redirect to        └─ Return success
    /orders/123/view
```

---

## Quick Reference: Component Effort Estimates

```
MINIMAL EFFORT (< 1 hour to basic version):
├─ OrderBasics (split from current OrderForm)
├─ OrderParticipants (counters only)
└─ OrderPreferences (textarea fields)

SMALL EFFORT (1-3 hours):
├─ OrderParties (entity search + role selector)
├─ OrderWizardContainer (step navigator)
└─ OrderWizardReview (summary display)

MEDIUM EFFORT (3-8 hours):
├─ OrderItems (item search, table, calculations)
├─ OrderPaymentTerms (installment schedule)
└─ Order Wizard Layout & Navigation

LARGE EFFORT (1-2 weeks):
├─ OrderLogistics (hotel, flight, transfer forms)
├─ Timeline/Gantt visualization
└─ Full integration testing

EXTERNAL DEPENDENCIES:
├─ Item catalog API (need to create)
├─ Hotel booking integration
├─ Flight charter integration
└─ Transfer service integration
```

---

## Success Checklist

When you're done, you should be able to:

- [ ] Create new order with 7-step wizard
- [ ] Step 1: Select order type & date
- [ ] Step 2: Add customer, supplier, agent
- [ ] Step 3: Search and add order items
- [ ] Step 4: Add hotels, flights, transfers
- [ ] Step 5: Set participant counts
- [ ] Step 6: Create installment schedule
- [ ] Step 7: Set allergies and preferences
- [ ] Step 8: Review and submit
- [ ] Order saved with all sub-items
- [ ] Can view order with all details
- [ ] Can edit order (switches to tabs view)
- [ ] Can filter orders by type/status
- [ ] Detail view shows all calculations

