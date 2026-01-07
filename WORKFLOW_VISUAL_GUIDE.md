# Sales Enquiry → Quotation → Order: Visual Workflow Guide

## Complete User Journey with Screenshots

### Screen 1: Sales Enquiry List
```
┌─────────────────────────────────────────────────────────────┐
│ Sales / Orders > Sales Enquiries                        [+] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ENQ-202601-0001    │  amani mponda   │  NEW     │  2026-10-27  │
│  ENQ-2026-003       │  ADRIANO        │  QUOTED  │  2026-10-25  │
│  ENQ-2026-002       │  ADRIANO        │  CLOSED  │  2026-10-20  │
│  ENQ-2026-001       │  ADRIANO        │  ORDERED │  2026-10-15  │
│                                                              │
│  [Convert to Order ▶] [View Details] [Export] [Delete]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

User clicks: "Convert to Order" or "ENQ-202601-0001"
↓
Navigates to: /orders/enquiry/4
```

---

### Screen 2: Enquiry Detail with Quotations (NEW)

```
┌─────────────────────────────────────────────────────────────┐
│ ◀ Back to Enquiries                                         │
│                                                              │
│ Sales Enquiry to Order                                      │
│ Review enquiry details and select a quotation to create    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ENQ-202601-0001         [NEW]                              │
│ amani mponda                                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│ Enquiry Date: Oct 27, 2026  │  Customer: amani mponda    │
│ Status: NEW                 │  Remarks: Premium hunt     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ AVAILABLE QUOTATIONS (3)                                    │
│                                                              │
│ ┌──────────────────────┐  ┌──────────────────────┐        │
│ │ QUOTE-001      [USD]  │  │ QUOTE-002      [USD]  │        │
│ │ NEW                   │  │ NEW                   │        │
│ ├──────────────────────┤  ├──────────────────────┤        │
│ │ Package | Hunt       │  │ Premium | Safari     │        │
│ │         $25,000      │  │         $35,000      │        │
│ │ Trophy | Elephant    │  │ Trophy | Lion        │        │
│ │         $15,000      │  │         $18,000      │        │
│ │ Logistics| Transport │  │ Logistics| Premium   │        │
│ │         $5,000       │  │         $12,000      │        │
│ ├──────────────────────┤  ├──────────────────────┤        │
│ │ TOTAL   $45,000      │  │ TOTAL   $65,000      │        │
│ │                      │  │ (Selected)           │        │
│ │ [ Select ]           │  │ [✓ Selected ]        │        │
│ └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│                      ┌──────────────────────┐              │
│                      │ QUOTE-003      [USD]  │              │
│                      │ QUOTED                │              │
│                      ├──────────────────────┤              │
│                      │ Basic | Hunting      │              │
│                      │        $20,000       │              │
│                      │ Trophy | Buffalo     │              │
│                      │        $12,000       │              │
│                      │ Logistics| Standard  │              │
│                      │        $3,000        │              │
│                      ├──────────────────────┤              │
│                      │ TOTAL   $35,000      │              │
│                      │                      │              │
│                      │ [ Select ]           │              │
│                      └──────────────────────┘              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Cancel]              ✓ [Convert to Order] (Creating...)  │
└─────────────────────────────────────────────────────────────┘

Key Points:
- Each quotation card shows pricing breakdown
- Selected quotation highlighted in blue
- Line items display clearly
- Total price prominently shown
- Single click to select/deselect
- Convert button disabled until selection made
```

---

### Screen 3: Create Order (Backend Processing)

```
API Call Flow:
┌────────────────────────────────────────────────────────────┐
│ POST /api/v1.0/orders                                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ {                                                           │
│   "type": "SALES",                                         │
│   "order_type_id": 1,                                      │
│   "status_id": 1,                                          │
│   "entity_id": 2,              // From enquiry.entity_id   │
│   "order_date": "2026-01-07",                              │
│   "currency_id": 1,                                        │
│   "sales_enquiry_pricing_id": 10,  // LINK TO QUOTATION   │
│   "notes": "Converted from ENQ-202601-0001",              │
│                                                             │
│   "items": [                    // From quotation.items    │
│     {                                                       │
│       "item_category_id": 1,                               │
│       "description": "Premium Hunt Package",               │
│       "quantity": 1,                                       │
│       "unit_price": 25000                                  │
│     },                                                      │
│     {                                                       │
│       "item_category_id": 2,                               │
│       "description": "Elephant Permit",                    │
│       "quantity": 1,                                       │
│       "unit_price": 15000                                  │
│     }                                                       │
│   ],                                                        │
│                                                             │
│   "parties": [                  // From enquiry.entity     │
│     {                                                       │
│       "entity_id": 2,                                      │
│       "party_role_id": 1        // CUSTOMER role          │
│     }                                                       │
│   ]                                                         │
│ }                                                           │
│                                                             │
└────────────────────────────────────────────────────────────┘
                            ↓
                  Backend Processing
                  - Generate order_number: ORD-2026-0025
                  - Create order record
                  - Create item records (from quotation.items)
                  - Create party records (customer)
                            ↓
                    Response: 200 OK
                  { data: { id: 25, order_number: "ORD-2026-0025", ... } }
                            ↓
                  Frontend Navigation
                  → /orders/edit/25
```

---

### Screen 4: Edit Order (Pre-filled)

```
┌─────────────────────────────────────────────────────────────┐
│ [◀ Back]  [↺ Reset]  [✓ Save Order] (Save Order)          │
│                                                              │
│ Create Order                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [ⓘ] Linked to quotation: QUOTE-002                         │
│     View Enquiry →                                          │
│                                                              │
│ ━━━ BASIC INFORMATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                              │
│ Order Number *              │  Order Type *               │
│ [Auto-generated]            │  [SALES v]                  │
│ System generated on save    │                              │
│                                                              │
│ Status *                    │  Order Date *               │
│ [DRAFT v]                   │  [2026-01-07]               │
│                                                              │
│ ━━━ FINANCIAL INFORMATION ━━━━━━━━━━━━━━━━━━━━━━━         │
│                                                              │
│ Currency * │ Exchange Rate │ VAT (%) │ Additional Expenses │
│ [USD   v]  │ [1.0]        │ [0]     │ [0]                 │
│                                                              │
│ ━━━ REFERENCES & LINKS ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                              │
│ Sales Enquiry [Optional]    │ Quotation [Optional]        │
│ [ENQ-202601-0001 v]        │ [QUOTE-002 v]               │
│ Link to customer enquiry    │ Link approved quotation     │
│                                                              │
│ ━━━ ADDITIONAL DETAILS ━━━━━━━━━━━━━━━━━━━━━━━━━         │
│                                                              │
│ Reference Number            │ Payment Terms              │
│ [_____________]             │ [Net 30]                   │
│                                                              │
│ Notes / Description                                         │
│ [_________________________________]                        │
│ [Converted from enquiry ENQ-202601-0001]                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Items & Parties Tab] [Logistics & More] [Payment Plan]    │
│                                                              │
│ ITEMS & PARTIES                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Order Items        [+ Add Item]                      │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ # | Item Category | Description    | Qty | Price   │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ 1 | PACKAGE       | Premium Hunt   │ 1   | 25,000 │  │
│ │ 2 | TROPHY        | Elephant Permit│ 1   | 15,000 │  │
│ │ 3 | LOGISTICS     | Transport      │ 1   | 5,000  │  │
│ │                                         │  [Delete] │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Parties            [+ Add Party]                     │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ # | Entity         | Role             | [Action]   │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ 1 | amani mponda   | CUSTOMER         | [Delete]   │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ User can:                                                   │
│ ✅ Add more items                                           │
│ ✅ Modify quantity/price                                    │
│ ✅ Add participants, hotel details, dietary preferences    │
│ ✅ Configure payment plan with installments               │
│ ✅ Save changes                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structure Flow

```
INPUT: Sales Enquiry (from API)
┌──────────────────────────────────────────────────────────┐
│ {                                                         │
│   "id": 4,                                               │
│   "code": "ENQ-202601-0001",                            │
│   "date": "2026-10-27",                                 │
│   "entity_id": 2,                                        │
│   "entity": {                                            │
│     "id": 2,                                             │
│     "full_name": "amani mponda"                          │
│   },                                                     │
│   "pricings": [                  ← Multiple quotations   │
│     {                                                    │
│       "id": 10,                                          │
│       "code": "QUOTE-001",                              │
│       "total_price": 45000,                             │
│       "currency": "USD",                                │
│       "items": [                 ← Line items           │
│         {                                                │
│           "id": 1,                                       │
│           "type": "Package",                             │
│           "name": "Premium Hunt",                        │
│           "price": 25000                                │
│         },                                              │
│         {                                                │
│           "id": 2,                                       │
│           "type": "Trophy",                              │
│           "name": "Elephant Permit",                     │
│           "price": 15000                                │
│         },                                              │
│         {                                                │
│           "id": 3,                                       │
│           "type": "Logistics",                           │
│           "name": "Transport",                           │
│           "price": 5000                                 │
│         }                                               │
│       ]                                                 │
│     },                                                  │
│     {                                                    │
│       "id": 11,                                          │
│       "code": "QUOTE-002",                              │
│       "total_price": 65000,                             │
│       "items": [...]                                    │
│     }                                                   │
│   ]                                                     │
│ }                                                        │
│                                                         │
└──────────────────────────────────────────────────────────┘
                            ↓
                DISPLAY IN UI (Grid)
                - 2 quotation cards per row
                - Each card shows code + status + total
                - Table with all line items
                - Select button for each quotation
                            ↓
                USER SELECTS QUOTATION #2
                (sales_enquiry_pricing_id = 11)
                            ↓
                CONVERT TO ORDER (API Call)
                ┌─────────────────────────────────────┐
                │ POST /orders                         │
                │ {                                    │
                │   sales_enquiry_pricing_id: 11,     │
                │   entity_id: 2,                     │
                │   items: [                          │
                │     { description: "...", price }   │
                │   ],                                 │
                │   parties: [{entity_id: 2, role}]   │
                │ }                                    │
                └─────────────────────────────────────┘
                            ↓
                BACKEND CREATES ORDER
                ┌─────────────────────────────────────┐
                │ 1. Generate order_number            │
                │ 2. Create order record              │
                │ 3. Create item records              │
                │ 4. Create party records             │
                │ 5. Return: ORD-2026-0025            │
                └─────────────────────────────────────┘
                            ↓
                FRONTEND DISPLAYS ORDER FORM
                (Pre-filled with quotation data)
                            ↓
                USER EDITS & SAVES ORDER
```

---

## Component Communication

```
┌─────────────────────────────────────────────────────────┐
│ SalesEnquiryDetail.vue                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Responsibilities:                                       │
│ 1. Load enquiry with quotations                        │
│ 2. Display quotation grid                              │
│ 3. Handle quotation selection                          │
│ 4. Convert to order                                    │
│ 5. Navigate to OrderForm                               │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Store: useOrderStore()                             │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ fetchEnquiryWithQuotations(id)                    │ │
│ │ ↓ Returns: enquiry.pricings.items                │ │
│ │                                                   │ │
│ │ createOrderFromQuotation(payload)                │ │
│ │ ↓ Returns: { id, order_number, ... }            │ │
│ │                                                   │ │
│ │ linkQuotationToOrder(orderId, quotationId)      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Router: useRouter()                                │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ router.push({                                      │ │
│ │   name: 'EditOrder',                             │ │
│ │   params: { id: createdOrder.id }                │ │
│ │ })                                                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Data Flow:                                              │
│ 1. onMounted() → loadEnquiryDetails()                  │
│ 2. API returns enquiry with .pricings.items           │
│ 3. Display quotation grid                              │
│ 4. selectQuotation(pricing) → highlight card          │
│ 5. convertToOrder() → create order via store          │
│ 6. navigate to OrderForm with created order ID         │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
                ┌─────────────────────────────────────┐
                │ OrderForm.vue (Edit Mode)           │
                ├─────────────────────────────────────┤
                │ Pre-filled with:                     │
                │ - Items from quotation              │
                │ - Customer as party                 │
                │ - Currency from quotation           │
                │ - Link to source enquiry            │
                │ - Link to source quotation          │
                │                                     │
                │ User can edit further before save   │
                └─────────────────────────────────────┘
```

---

## Comparison: Single API Call vs Sequential Calls

### ✅ RECOMMENDED: Single Eager Loading Call

```
Timeline:
0ms:   Browser sends: GET /sales/inquiries/4?include=pricings,pricings.items
200ms: ✅ Receive: enquiry + all pricings + all items

Total: 200ms (1 request)

Browser Network:
1 API call
1 response with all data
Fast UI rendering
```

### ❌ NOT RECOMMENDED: Sequential Calls

```
Timeline:
0ms:   Browser sends: GET /sales/inquiries/4
100ms: ✅ Receive: enquiry
100ms: Send: GET /sales/inquiries/4/pricings
200ms: ✅ Receive: pricings array
200ms: FOR EACH pricing, send: GET /pricings/{id}/items
       ↓ Send: GET /pricings/10/items
       ↓ Send: GET /pricings/11/items
       ↓ Send: GET /pricings/12/items
400ms: ✅ Receive: items for quotation 1
450ms: ✅ Receive: items for quotation 2
500ms: ✅ Receive: items for quotation 3

Total: 500ms (5 requests)

Browser Network:
5 API calls
Waterfall effect
Slow UI rendering
```

**Difference: 300ms slower with sequential calls**

---

## Error Handling Scenarios

```
Scenario 1: API Call Fails
┌──────────────────────────────────────┐
│ API Error: Network timeout           │
├──────────────────────────────────────┤
│ catch error → console.error(...)     │
│ ↓                                     │
│ Fallback: Load from orderStore       │
│ enquiry = orderStore.enquiries.find()│
│ ↓                                     │
│ Display cached enquiry data          │
│ (May be empty if not fetched before) │
└──────────────────────────────────────┘

Scenario 2: Order Creation Fails
┌──────────────────────────────────────┐
│ API Error: Validation failed         │
├──────────────────────────────────────┤
│ catch error → console.error(...)     │
│ ↓                                     │
│ Show alert: "Failed to create order" │
│ ↓                                     │
│ Stay on SalesEnquiryDetail page      │
│ User can: Try again / Select another │
└──────────────────────────────────────┘

Scenario 3: No Quotations Exist
┌──────────────────────────────────────┐
│ API Response: { pricings: [] }       │
├──────────────────────────────────────┤
│ Display: Empty state message         │
│ "No quotations available..."         │
│ ↓                                     │
│ "Convert to Order" button disabled   │
│ ↓                                     │
│ User can: Back to enquiries list     │
└──────────────────────────────────────┘
```

---

## Mobile Responsiveness

```
LARGE SCREEN (lg ≥ 1024px)
┌─────────────────┬─────────────────┐
│  Quotation 1    │   Quotation 2   │
│  (2 columns)    │   (selected)     │
├─────────────────┴─────────────────┤
│         Quotation 3                │
│         (2nd row, 1st column)      │
└────────────────────────────────────┘

MEDIUM SCREEN (md < 1024px)
┌─────────────────────────────────┐
│         Quotation 1              │
│      (1 column, full width)      │
├─────────────────────────────────┤
│         Quotation 2              │
│         (selected)               │
├─────────────────────────────────┤
│         Quotation 3              │
└─────────────────────────────────┘

SMALL SCREEN (sm < 768px)
Same as medium (1 column)
```

---

**Visual Guide Created:** January 7, 2026  
**Status:** Complete and Ready for Development  
**Format:** ASCII Diagrams + Description
