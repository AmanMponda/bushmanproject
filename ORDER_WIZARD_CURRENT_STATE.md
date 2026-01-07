# Orders Module: Current State vs Full Vision

## Quick Reference: Where Information is Managed

### Information Categories & Their Locations

#### 1️⃣ ORDER BASICS (Order Type, Status, Dates)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Order Number | ✅ Done | OrderForm | /orders |
| Order Type (SALES/PURCHASE/TRANSFER) | ✅ Done | OrderForm | /orders/order-types |
| Status (DRAFT/PENDING/CONFIRMED/FULFILLED) | ✅ Done | OrderForm | /orders/order-statuses |
| Order Date | ✅ Done | OrderForm | /orders |

**Location**: `src/views/orders/OrderForm.vue`

---

#### 2️⃣ PARTY MANAGEMENT (Who's Involved)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Customer/Parties | ❌ Missing | OrderParty table | POST /orders/{id}/parties |
| Supplier | ❌ Missing | OrderParty table | POST /orders/{id}/parties |
| Agent/Broker | ❌ Missing | OrderParty table | POST /orders/{id}/parties |
| Role Assignment | ❌ Missing | OrderParty.role | POST /orders/{id}/parties |

**Location Needed**: `src/views/orders/OrderParties.vue` (NEW)

**How SalesInquiry does it**:
```vue
<!-- In SalesInquiryWizard.vue -->
<CustomerSelectionModal
  @proceed="handleCustomerModalProceed"
/>
<!-- Stores: SalesInquiry.customer_id -->
```

---

#### 3️⃣ ITEM SELECTION (What's Being Ordered)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Item Search/Catalog | ❌ Missing | OrderItem | GET /items/search |
| Item Variants | ❌ Missing | OrderItem | GET /items/{id}/variants |
| Quantity & Rate | ⚠️ Partial | OrderItem | POST /orders/{id}/items |
| Discounts | ❌ Missing | OrderItem.discount | POST /orders/{id}/items |

**Location Needed**: `src/views/orders/OrderItems.vue` (NEW)

**How PosCustomerOrder.vue does it**:
```vue
<!-- Item Search & Selection -->
<div v-for="menu in menu">
  <img :src="menu.image" />
  <span @click="selectItem">{{ menu.title }}</span>
</div>
<!-- Stores in OrderItem -->
```

---

#### 4️⃣ LOGISTICS PLANNING (Travel & Accommodation)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Hotel Bookings | ❌ Missing | OrderLogistic | POST /orders/{id}/logistics |
| Charter Flights | ❌ Missing | OrderLogistic | POST /orders/{id}/logistics |
| Ground Transfers | ❌ Missing | OrderLogistic | POST /orders/{id}/logistics |
| Timeline/Gantt View | ❌ Missing | OrderLogistic | GET /orders/{id}/logistics |

**Location Needed**: `src/views/orders/OrderLogistics.vue` (NEW)

**How SalesInquiry does it**:
```typescript
// Only stores dates and area, not full logistics
form.start_date = "2025-06-01"
form.area = "Serengeti"
// No hotel/flight/transfer management
```

---

#### 5️⃣ PARTICIPANT MANAGEMENT (Hunters, Observers, Guides)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Hunter Counters | ⚠️ Reference | OrderParticipant | POST /orders/{id}/participants |
| Observer Counters | ⚠️ Reference | OrderParticipant | POST /orders/{id}/participants |
| Companion Counters | ⚠️ Reference | OrderParticipant | POST /orders/{id}/participants |
| People Assignment | ❌ Missing | OrderParticipant.person_id | POST /orders/{id}/participants |

**Location Needed**: `src/views/orders/OrderParticipants.vue` (NEW)

**How SalesInquiry does it**:
```typescript
// In SalesInquiryWizard - Step 5
form.numberOfHunters = 2
form.numberOfCompanions = 1
form.numberOfObservers = 3
form.numberOfGuides = Math.ceil(hunterCount / 2)  // Auto-calc
```

---

#### 6️⃣ PAYMENT TERMS (Installment Schedule)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Installment Schedule | ❌ Missing | OrderPaymentTerm | POST /orders/{id}/payment-terms |
| Due Dates | ❌ Missing | OrderPaymentTerm.due_date | POST /orders/{id}/payment-terms |
| Payment Method | ❌ Missing | OrderPaymentTerm.method | POST /orders/{id}/payment-terms |
| Discount Terms | ❌ Missing | OrderPaymentTerm.discount | POST /orders/{id}/payment-terms |

**Location Needed**: `src/views/orders/OrderPaymentTerms.vue` (NEW)

**How SalesEnquiryPricing does it**:
```typescript
// In SalesEnquiryPricing model
{
  payment_terms: "50% upfront, 50% on arrival",
  total_price: 10000,
  discount: 0,
  // No installment schedule breakdown
}
```

---

#### 7️⃣ PREFERENCES & NOTES (Special Requests)
| Component | Status | Storage | Backend |
|-----------|--------|---------|---------|
| Allergies | ⚠️ Partial | OrderPreference | POST /orders/{id}/preferences |
| Dietary Restrictions | ⚠️ Partial | OrderPreference | POST /orders/{id}/preferences |
| Special Requests | ✅ Done | OrderForm.notes | /orders |
| VIP/Activity Prefs | ❌ Missing | OrderPreference | POST /orders/{id}/preferences |

**Location**: `src/views/orders/OrderForm.vue` (notes field) + NEW `OrderPreferences.vue`

**How SalesInquiry does it**:
```typescript
// In SalesInquiryWizard
form.special_requests = "Please accommodate vegetarian guests"
// Stored in SalesInquiry.special_requests
```

---

## Visual Architecture: Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CREATE ORDER WIZARD                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: ORDER BASICS ✅ DONE
└─ OrderForm.vue
   ├─ order_number (auto-generated)
   ├─ order_type (SALES/PURCHASE/TRANSFER) → /orders/order-types
   ├─ status (DRAFT/PENDING/...) → /orders/order-statuses
   └─ order_date
   └─ currency → /settings/currencies

        ↓

Step 2: PARTIES ❌ MISSING
└─ OrderParties.vue (NEW)
   ├─ Customer → Search entities
   ├─ Supplier → Search entities
   ├─ Agent → Search entities
   └─ Save to → POST /orders/{id}/parties

        ↓

Step 3: ITEMS ❌ MISSING
└─ OrderItems.vue (NEW)
   ├─ Search items → GET /items/search
   ├─ Select variants → GET /items/{id}/variants
   ├─ Set quantity & rate
   ├─ Apply discount
   └─ Save to → POST /orders/{id}/items

        ↓

Step 4: LOGISTICS ❌ MISSING
└─ OrderLogistics.vue (NEW)
   ├─ Hotel bookings (dates, location, rooms)
   ├─ Charter flights (from, to, capacity)
   ├─ Transfers (pickup, dropoff, times)
   ├─ Timeline visualization
   └─ Save to → POST /orders/{id}/logistics

        ↓

Step 5: PARTICIPANTS ⚠️ PARTIAL
└─ OrderParticipants.vue (NEW/UPGRADE)
   ├─ Hunter count (+/- buttons)
   ├─ Observer count (+/- buttons)
   ├─ Companion count (+/- buttons)
   ├─ Assign specific people
   └─ Save to → POST /orders/{id}/participants

        ↓

Step 6: PAYMENT TERMS ❌ MISSING
└─ OrderPaymentTerms.vue (NEW)
   ├─ Installment schedule builder
   ├─ Due dates per installment
   ├─ Payment method per installment
   ├─ Apply discounts/surcharges
   └─ Save to → POST /orders/{id}/payment-terms

        ↓

Step 7: PREFERENCES ⚠️ PARTIAL
└─ OrderPreferences.vue (NEW/UPGRADE)
   ├─ Allergies (multi-select)
   ├─ Dietary preferences (radio/checkboxes)
   ├─ Special activity requests
   ├─ VIP notes
   └─ Save to → POST /orders/{id}/preferences

        ↓

SAVE & COMPLETE ✅
└─ OrderList.vue
   └─ Show in list with status DRAFT
```

---

## Component Dependency Tree

```
OrderForm.vue (Parent - Entry Point)
├── ✅ Basic Info Section
│   ├── Order Type Input → orderStore.fetchOrderTypes()
│   ├── Status Input → orderStore.fetchOrderStatuses()
│   ├── Currency Input → orderStore.fetchCurrencies()
│   └── Date Input
│
├── ❌ OrderParties.vue (NEW SUB-COMPONENT)
│   ├── Entity Search
│   ├── Role Selector
│   └── Contact Details
│
├── ❌ OrderItems.vue (NEW SUB-COMPONENT)
│   ├── Item Catalog Search
│   ├── Variant Selector
│   ├── Quantity/Rate Editor
│   └── Discount Calculator
│
├── ❌ OrderLogistics.vue (NEW SUB-COMPONENT)
│   ├── Hotel Booking Form
│   ├── Charter Flight Form
│   ├── Transfer Form
│   └── Timeline View
│
├── ❌ OrderParticipants.vue (NEW SUB-COMPONENT)
│   ├── Counter Controls
│   ├── People Selector
│   └── Pricing Impact Display
│
├── ❌ OrderPaymentTerms.vue (NEW SUB-COMPONENT)
│   ├── Installment Schedule Editor
│   ├── Payment Method Selector
│   └── Discount/Surcharge Editor
│
├── ⚠️ OrderPreferences.vue (NEW/UPGRADE)
│   ├── Allergy Selector
│   ├── Dietary Preference Selector
│   ├── Activity Selector
│   └── Notes Editor
│
└── ✅ Notes Field
    └── free_text_input
```

---

## Backend Implementation Checklist

### Existing Models/Endpoints ✅
- `Order` model + `/orders` endpoints
- `OrderItem` model + `/orders/{id}/items`
- `OrderParty` model + `/orders/{id}/parties`
- `OrderParticipant` model + `/orders/{id}/participants`
- `OrderLogistic` model + `/orders/{id}/logistics`
- `OrderPreference` model + `/orders/{id}/preferences`

### Missing Models/Endpoints ❌
- `OrderPaymentTerm` model (NEW)
  - Endpoint: `POST /orders/{id}/payment-terms`
  - Endpoint: `GET /orders/{id}/payment-terms`
- Item catalog endpoints
  - Endpoint: `GET /items/search?keyword=&category=`
  - Endpoint: `GET /items/{id}`
  - Endpoint: `GET /items/{id}/variants`

### Upgrade Needed Endpoints ⚠️
- `/orders/order-types` (if not exists) or use `/settings/order-types`
- `/orders/order-statuses` (if not exists) or use `/settings/order-statuses`

---

## Implementation Priority

### 🔴 CRITICAL (Do First)
1. Item search/selection (Step 3)
   - Blocks order creation workflow
   - Core to order functionality
   
### 🟡 HIGH (Do Second)
2. Payment terms (Step 6)
   - Financial tracking
   - Customer reporting
   
3. Party management (Step 2)
   - Relationship tracking
   - Contact info

### 🟠 MEDIUM (Do Third)
4. Logistics planning (Step 4)
   - Travel coordination
   - Hotel/flight integration
   
5. Participant assignment (Step 5)
   - Advanced feature
   - Uses counters (partial exists)

### 🟢 LOW (Do Last)
6. Full preferences management (Step 7)
   - Dietary/allergy data
   - Activity preferences

---

## Comparison: How Other Modules Do It

### Sales Inquiries Wizard ✅
**File**: `src/views/bushman/sales/salesinquiries/SalesInquiryWizard.vue`

**Steps**:
1. Customer Selection (Modal)
2. Hunt Details (Season, Area, Dates)
3. Participant Counts (Hunters, Companions, Observers)
4. Species Selection
5. Pricing & Packages
6. Extras & Add-ons
7. Final Review

**Data Structure**:
```typescript
const form = {
  // Customer
  customer_id,
  full_name,
  
  // Hunt details
  season,
  start_date,
  area,
  no_of_days,
  priceListId,
  
  // Participants
  numberOfHunters,
  numberOfCompanions,
  numberOfObservers,
  numberOfGuides,
  
  // Species
  selectedSpecies: [{id, quantity, trophy_fee}],
  
  // Packages
  huntingPackageId,
  safariBundleId,
  
  // Extras
  selectedExtras: [],
  
  // Special
  special_requests,
  notes
}
```

**What's Missing for Orders**:
- Parties (only customer, not supplier/agent)
- Items (uses fixed species list, not flexible items)
- Logistics (no hotel/flight management)
- Payment terms (no installment schedule)

---

## Quick Start: Building OrderParties.vue

```vue
<template>
  <div class="order-parties">
    <h5>Order Parties</h5>
    
    <!-- Party Roles List -->
    <div class="party-roles">
      <draggable
        v-model="parties"
        item-key="id"
        @change="savePart ties"
      >
        <template #item="{ element }">
          <div class="party-item">
            <span class="role-badge">{{ element.role }}</span>
            <input 
              v-model="element.entity_name"
              @click="openEntitySearch(element)"
              placeholder="Search entity..."
            />
            <button @click="removeParty(element.id)">Remove</button>
          </div>
        </template>
      </draggable>
    </div>
    
    <!-- Add New Party -->
    <button @click="addPartyRow">+ Add Party</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOrderStore } from '@/stores/bushman/order-store'

const orderStore = useOrderStore()
const parties = ref([
  { id: 1, role: 'CUSTOMER', entity_id: null, entity_name: '' },
  { id: 2, role: 'SUPPLIER', entity_id: null, entity_name: '' }
])

const saveParties = async () => {
  await orderStore.updateOrderParties(route.params.id, parties.value)
}

const addPartyRow = () => {
  parties.value.push({
    id: Date.now(),
    role: 'AGENT',
    entity_id: null,
    entity_name: ''
  })
}
</script>
```

---

## Summary Table: What Exists vs What's Needed

| Feature | Component | Status | DB Model | API | Effort |
|---------|-----------|--------|----------|-----|--------|
| Type/Status | OrderForm | ✅ | Order | ✅ | Done |
| Order Items | ⚠️ | ⚠️ | OrderItem | ⚠️ | Medium |
| Parties | ❌ | ✅ | OrderParty | ✅ | Small |
| Participants | ⚠️ | ⚠️ | OrderParticipant | ✅ | Small |
| Logistics | ❌ | ✅ | OrderLogistic | ✅ | Large |
| Payment Terms | ❌ | ❌ | Missing | ❌ | Large |
| Preferences | ⚠️ | ⚠️ | OrderPreference | ✅ | Small |
| Item Search | ❌ | ❌ | Item | ❌ | Medium |
| Hotel Integration | ❌ | ❌ | External | ❌ | Large |
| Flight Integration | ❌ | ❌ | External | ❌ | Large |

**Total Effort to Full Wizard**: ~3-4 weeks for all components + backend

