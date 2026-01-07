# Orders Management - Relationship Map

## Sales Flow: Enquiry → Quotation → Order

```
┌─────────────────┐
│ Sales Enquiry   │
│  (Created when  │
│   customer      │
│   requests hunt)│
└────────┬────────┘
         │
         ├─ Customer Details
         ├─ Hunt Parameters
         ├─ Hunting Area
         ├─ Season
         ├─ Number of Hunters
         └─ Species Selection
         │
         ▼
┌─────────────────────────────────┐
│ Quotation / Pricing Proposal    │
│ (SalesEnquiryPricing)           │
│ (Created from Enquiry details)  │
└────────┬────────────────────────┘
         │
         ├─ Price breakdown
         ├─ Payment installments
         ├─ Package selection
         ├─ Companion rates
         ├─ Safari extras
         └─ Hunting license info
         │
         ▼
┌──────────────────────────────────┐
│ Sales Order (This Module)        │
│ (Created from Approved Quotation)│
└──────────────────────────────────┘
         │
         ├─ Order Number
         ├─ Order Type (SALES/PURCHASE/TRANSFER)
         ├─ Status (DRAFT → CONFIRMED → FULFILLED)
         ├─ Order Items (with quantities & rates)
         ├─ Parties (Customer, Supplier, Agent)
         ├─ Participants (Hunters, Observers, etc.)
         ├─ Logistics (Flights, Hotels, Transfers)
         └─ Customer Preferences
```

## Database Relationships

### Order ↔ SalesOrderDetail
- **Purpose**: SalesOrderDetail extends Order with sales-specific data
- **Fields**:
  - `sales_enquiry_id` - Link to the original enquiry
  - `sales_enquiry_pricing_id` - Link to the approved quotation/pricing

### Order ↔ OrderItem
- **1:Many** - One order can have multiple line items
- **Fields**: Item, Quantity, Rate, Discount

### Order ↔ OrderParty
- **1:Many** - Multiple parties per order
- **Roles**: Customer, Supplier, Agent, Broker, Bill-to, Ship-to

### Order ↔ OrderParticipant
- **1:Many** - Track participants (Hunters, Observers, Companions)

### Order ↔ OrderLogistic
- **1:Many** - Multiple logistics arrangements
- **Types**: Airport, Charter, Hotel, Transfer, Other

### Order ↔ OrderPreference
- **1:1** - Customer preferences per order
- **Fields**: Food, Beverage, Allergies, Alcohol, Special requests

## Current Implementation

### Frontend Components
- **OrderList.vue** - Browse all orders with filtering by type & status
- **OrderForm.vue** - Create/Edit orders with enquiry & quotation references
- **OrderDetails.vue** - View complete order with items, parties, and summary

### Backend Models (Implemented)
✅ Order
✅ OrderItem
✅ OrderParty
✅ OrderParticipant
✅ OrderLogistic
✅ OrderPreference
✅ SalesOrderDetail
✅ PurchaseOrderDetail

### API Endpoints (Implemented)
✅ GET/POST /orders - List and create orders
✅ GET/PUT/DELETE /orders/{id} - View, edit, delete
✅ GET/POST /orders/{id}/items - Manage line items
✅ GET/POST /orders/{id}/parties - Manage parties
✅ GET/POST /orders/{id}/participants - Manage participants
✅ GET/POST /orders/{id}/logistics - Manage logistics
✅ GET/POST /orders/{id}/preferences - Manage preferences

## What's Configurable

### Order Types (Currently Hardcoded)
```
- SALES (Sales Order)
- PURCHASE (Purchase Order)
- TRANSFER (Transfer Order)
```
**TODO**: Create backend endpoint `/orders/order-types` or `/settings/order-types/`

### Order Statuses (Currently Hardcoded)
```
- DRAFT (Initial state)
- PENDING (Awaiting confirmation)
- CONFIRMED (Approved and ready)
- FULFILLED (Completed)
- CANCELLED (Cancelled)
```
**TODO**: Create backend endpoint `/orders/statuses` or `/settings/order-statuses/`

## How to Link Orders to Enquiries/Quotations

### In OrderForm.vue:
```typescript
// When creating an order from a quotation:
const form = {
  order_number: 'ORD-001',
  type: 'SALES',
  status: 'DRAFT',
  sales_enquiry_id: enquiryId,      // Link to source enquiry
  sales_enquiry_pricing_id: quoteId, // Link to approved quotation
  // ... other fields
}
```

### Filtering:
When user selects an enquiry, quotations are filtered to show only that enquiry's proposals.

## Integration Points

### From Sales Inquiries Module
- Import enquiries to link orders to source requests
- Display enquiry details in order context
- Validate that quotation belongs to selected enquiry

### From Sales Confirmations Module
- Get approved quotations/proposals
- Extract pricing and specifications
- Pre-populate order with quotation data

## Future Enhancements

1. **Auto-populate from Quotation**
   - When selecting a quotation, auto-fill order items, customer, and pricing

2. **Create Order from Quotation**
   - Add button in quotation view to "Create Order"
   - Pre-fills all relevant data

3. **Order Confirmation Workflow**
   - Send order confirmation to customer
   - Track order fulfillment status

4. **Order Templates**
   - Save successful orders as templates
   - Quick-create similar orders

5. **Backend Configuration**
   - Make order types and statuses configurable in admin panel
   - Store in database instead of hardcoding

6. **Advanced Filtering**
   - Filter orders by source enquiry
   - Filter by quotation
   - Timeline view of enquiry → quotation → order progression

## Notes

- **Temporary Solution**: Order types and statuses are hardcoded with TODO comments
- **Best Practice**: These should be loaded from backend when endpoints are created
- **Relationships**: The `sales_enquiry_id` and `sales_enquiry_pricing_id` fields link orders back to their source
- **Cascading**: When enquiry is deleted, related orders should handle appropriately
