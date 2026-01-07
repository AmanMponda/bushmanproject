# Order Wizard: Executive Summary

## Quick Answer to Your Questions

### 1. "Where does this information get managed?"

| Information | Where in Bushman | How Other Modules Do It |
|-------------|-----------------|------------------------|
| **Order Type/Status** | `OrderForm.vue` ✅ | Sales Inquiry: Part of wizard |
| **Parties (Customer/Supplier/Agent)** | ❌ Missing - Needs `OrderParties.vue` | Sales Inquiry: Modal selection before wizard |
| **Items & Pricing** | ⚠️ Partial - Needs `OrderItems.vue` | Sales Inquiry: Species selection from fixed list |
| **Logistics (Hotels/Flights)** | ❌ Missing - Needs `OrderLogistics.vue` | Sales Inquiry: Only dates/area, no logistics |
| **Participants (Hunters/Observers)** | ⚠️ Partial - Needs `OrderParticipants.vue` | Sales Inquiry: Counter buttons in Step 5 |
| **Payment Terms (Installments)** | ❌ Missing - Needs `OrderPaymentTerms.vue` | Sales Inquiry: Handled in Quotation, not inquiry |
| **Preferences & Notes** | ✅ Partially - `notes` field in form | Sales Inquiry: `special_requests` field |

---

### 2. "What was the plan?"

**Original Order System Design** (from migrations/models):
- ✅ Basic order fields (type, status, date)
- ✅ Line items (products/services ordered)
- ✅ Party management (customer, supplier relationships)
- ✅ Participant tracking (who's involved)
- ✅ Logistics (travel/accommodation planning)
- ✅ Preferences (allergies, special requests)
- ✅ Payment terms management

**What Got Built**:
- ✅ Pinia store with CRUD operations
- ✅ List view with filtering
- ✅ Form for creation (basic fields + inquiry linking)
- ✅ Detail view with calculations

**What's Missing**:
- ❌ Multi-step wizard UI
- ❌ Party selection component
- ❌ Item search & selection
- ❌ Logistics timeline builder
- ❌ Payment installment scheduler
- ❌ Participant assignment UI
- ❌ Advanced preferences form

---

### 3. "How do other modules do it?"

#### Sales Inquiries Module (The Template)
**File**: `SalesInquiryWizard.vue` (3689 lines - full example)

**Structure**:
```
Step 1: Customer Selection (Modal before wizard)
  ↓ Proceeds to wizard with customer_id passed
Step 2: Hunt Details (Season, Area, Dates, Package)
Step 3: Participants (Hunter/Observer/Companion counters)
Step 4: Species Selection (Multi-select from list)
Step 5: Pricing & Packages (Display calculated pricing)
Step 6: Extras & Add-ons (Optional safari packages)
Step 7: Final Review (Summary before submit)
  ↓
Success Page
```

**Key Features**:
- Linear wizard flow (can't skip steps)
- Form validation at each step
- Progress indicator
- Save button on each step
- Estimated pricing calculated in real-time

**Data Structure**:
```typescript
const form = {
  // Customer (from modal)
  customer_id: 123,
  full_name: "John Doe",
  
  // Hunt Details
  season: "JANUARY",
  start_date: "2025-01-15",
  area: "SERENGETI",
  no_of_days: 10,
  priceListId: 5,
  
  // Participants
  numberOfHunters: 2,
  numberOfCompanions: 1,
  numberOfObservers: 2,
  numberOfGuides: 1,  // Auto-calculated
  
  // Species
  selectedSpecies: [
    { id: 1, name: 'Lion', quantity: 2, trophy_fee: 5000 },
    { id: 2, name: 'Buffalo', quantity: 1, trophy_fee: 3000 }
  ],
  
  // Pricing
  huntingPackageId: 1,
  safariBundleId: 2,
  
  // Extras
  selectedExtras: [{ id: 1, name: 'Bush Camp', cost: 500 }],
  
  // Final
  special_requests: "Vegetarian meals please"
}
```

#### Price List Module
**File**: `ManagePriceList.vue`

**What it does**:
- Simple CRUD form (not wizard)
- Shows fixed pricing tiers
- Links to hunt lengths & species rates
- Mostly read-only after creation

#### Sales Confirmation Proposals
**File**: `SalesConfirmationProposals.vue`

**What it does**:
- Auto-generated from inquiry
- Shows approved pricing
- Mark as confirmed/completed
- Minimal editing (mostly view-only)

---

## The Pattern: How the System Works

```
SALES FLOW IN BUSHMAN:

┌─────────────────┐
│ Sales Inquiry   │  ← Multi-step wizard
│ (Customer        │     Step 1: Customer
│  wants hunt)     │     Step 2: Hunt details
│                  │     Step 3: Participants
│                  │     Step 4: Species
│                  │     Step 5: Pricing
│                  │     Step 6: Extras
│                  │     Step 7: Review
└────────┬────────┘
         │ (approved & confirmed)
         ↓
┌─────────────────┐
│ Sales           │  ← Auto-generated from inquiry
│ Confirmation    │     Shows pricing breakdown
│ Proposal        │     Can mark as confirmed/done
│ (Quotation)     │
└────────┬────────┘
         │ (customer accepts pricing)
         ↓
┌─────────────────┐
│ Sales Order     │  ← NOW YOU ARE HERE
│ (This Module)   │     Should be multi-step wizard
│                 │     Capture ALL order details
│                 │     Manage parties, items, logistics
└─────────────────┘
         │ (order confirmed)
         ↓
     FULFILLMENT
     (Goods/Services Delivery)
```

---

## Recommended Architecture for Orders Wizard

**Option: Hybrid Approach (Best for Your Use Case)**

```
For Creating a NEW Order:
└─ Linear Wizard (Similar to SalesInquiry)
   1. Order Type Selection
   2. Party Management (Customer, Supplier, Agent)
   3. Item Selection (from catalog)
   4. Participants (Hunters, Observers counters)
   5. Logistics Planning (Hotels, Flights, Transfers)
   6. Payment Terms (Installment schedule)
   7. Preferences & Review

For EDITING an Order:
└─ Tabbed Form (Easier to modify individual sections)
   ├─ Tab 1: Basic Info
   ├─ Tab 2: Parties
   ├─ Tab 3: Items
   ├─ Tab 4: Logistics
   ├─ Tab 5: Participants
   ├─ Tab 6: Payment
   └─ Tab 7: Preferences
```

---

## Implementation Roadmap (Recommended Order)

### Priority 1️⃣ - CRITICAL (Do First)
**OrderItems.vue** - Without items, the order is empty
- Item search/catalog interface
- Quantity & pricing
- Discount handling
- Est. time: 1 week

### Priority 2️⃣ - HIGH
**OrderParties.vue** - Define relationships
- Customer/Supplier/Agent selection
- Contact details
- Est. time: 3 days

**OrderParticipants.vue** - Capture who's involved
- Hunter/Observer/Guide counters
- Est. time: 2 days

### Priority 3️⃣ - MEDIUM
**OrderPaymentTerms.vue** - Financial tracking (NEW MODEL needed)
- Installment schedule builder
- Payment methods
- Est. time: 1 week

**OrderLogistics.vue** - Travel coordination
- Hotel/Flight/Transfer management
- Timeline view
- Est. time: 2 weeks

### Priority 4️⃣ - LOW
**OrderPreferences.vue** - Nice-to-have details
- Allergies & dietary
- Activity preferences
- Est. time: 2 days

---

## What You Need to Know

### Backend Exists ✅
- All database tables created
- All relationships defined
- API endpoints ready (mostly)

### Frontend Exists ✅
- Pinia store created
- OrderForm component created
- List and detail views created

### What's Missing ❌
- **UI Components** for each sub-form
- **Item catalog** search functionality
- **Payment terms** model/endpoint
- **Logistics** integration (hotel/flight APIs)
- **Wizard UI** layer orchestrating everything

---

## Code Examples: How to Connect to Pinia Store

Each sub-component uses the Pinia store same way:

```typescript
// In OrderParties.vue
import { useOrderStore } from '@/stores/bushman/order-store'

const orderStore = useOrderStore()

// Save a party
const saveParty = async (party) => {
  await axios.post(`/orders/${route.params.id}/parties`, party)
}

// Update state
await orderStore.addParties(orderId, [party1, party2])
```

All sub-components follow this same pattern - independent, reusable!

---

## Success Criteria

✅ **You'll Know You're Done When**:
1. Can create order with all 7 steps
2. All data persists in database
3. Can edit existing orders in tabbed form
4. Can link order to inquiry/quotation
5. All calculations work (subtotal, VAT, total)
6. Order shows in list with correct status
7. Detail view displays all information

---

## Files to Reference

1. **ORDER_WIZARD_ARCHITECTURE.md** - Detailed technical architecture
2. **ORDER_WIZARD_CURRENT_STATE.md** - What exists vs what's needed
3. **ORDER_WIZARD_COMPONENTS.md** - Step-by-step build guides
4. **SalesInquiryWizard.vue** - Working example (3689 lines)
5. **orderStore.ts** - Pinia store with all actions

---

## Bottom Line

| Aspect | Status | Effort |
|--------|--------|--------|
| **Architecture** | ✅ Designed | 0 hours |
| **Database** | ✅ Ready | 0 hours |
| **Backend API** | ✅ Mostly ready | 2-3 hours |
| **Frontend Store** | ✅ Built | 0 hours |
| **UI Components** | ❌ Missing | 3-4 weeks |
| **Integration** | ⚠️ Partial | 1 week |
| **Testing** | ❌ Not started | 1 week |

**Total Effort**: ~4-5 weeks to full multi-step wizard with all 7 steps

**Can ship faster**: 1-2 weeks if you do basic tabbed form instead of wizard

