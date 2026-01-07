# Order Wizard - Data Flow & Backend Integration

## 📊 Complete Data Flow Diagram

```
User Opens OrderWizard
    ↓
Pinia Store Loads Data
├─ fetchOrderTypes() → GET /api/v1.0/orders/order-types
├─ fetchOrderStatuses() → GET /api/v1.0/orders/order-statuses
└─ fetchCurrencies() → GET /api/v1.0/settings/currencies
    ↓
Wizard Component Mounts
├─ orderTypes computed property populated
├─ orderStatuses computed property populated
└─ currencies computed property populated
    ↓
User Fills Step 1: Order Details
├─ Fills: order_number, type, status, date, currency_id
└─ Validates: All required fields
    ↓
User Fills Step 2: Parties
├─ Adds parties: [{ role, entity_name, contact_person }]
└─ Validates: At least one party
    ↓
User Fills Step 3: Items
├─ Adds items: [{ item_name, category, unit_price, quantity, rate }]
└─ Validates: At least one item
    ↓
User Fills Step 4: Logistics (Optional)
├─ Hotels: { location, checkIn, nights, rooms }
├─ Flights: { from, to, date, seats }
└─ Transfers: { from, to, date, vehicle }
    ↓
User Fills Step 5: Participants
├─ Sets counters: { hunters, observers, companions }
└─ Calculated: guides = Math.ceil(hunters / 2)
    ↓
User Fills Step 6: Payment Terms
├─ Sets number of installments
├─ Auto-generates rows
└─ Fills: amount, dueDate, paymentMethod for each
    ↓
User Fills Step 7: Preferences
├─ Selects: allergies (multi-select)
├─ Selects: dietary preference
├─ Checks: activity preferences
└─ Enters: notes/special requests
    ↓
User Reviews Step 8
├─ Sees summary of all data
├─ Can click "Edit Step X" to go back
└─ Clicks "Create Order" button
    ↓
submitOrder() Function Called
├─ Validates all data one more time
├─ Constructs payload object
└─ Calls: orderStore.createOrder(payload)
    ↓
Pinia Store Action: createOrder()
├─ Sets loading = true
├─ Constructs axios request
└─ POST /api/v1.0/orders with payload
    ↓
    ├─ [SUCCESS] Status 200
    │   ├─ response.data.data = { id, order_number, ... }
    │   ├─ Store updates: orders.push(newOrder)
    │   ├─ Toast: "Order created successfully"
    │   └─ Redirect: /orders/{id}/view
    │
    └─ [ERROR] Status 4xx/5xx
        ├─ Catch error in catch block
        ├─ Toast: error.response.data.message
        └─ User stays on wizard (can retry)
```

---

## 🔌 API Endpoint: POST /api/v1.0/orders

### Request Payload Example

```json
{
  "order_number": "ORD-2025-001",
  "type": "SALES",
  "status": "DRAFT",
  "date": "2025-01-07",
  "currency_id": 1,
  "notes": "VIP group. Early morning drives preferred.",
  "vat": 0,
  "expenses": 0,
  "exchange_rate": 1,
  "parties": [
    {
      "role": "CUSTOMER",
      "entity_name": "John Safari Ltd",
      "contact_person": "John Doe"
    },
    {
      "role": "SUPPLIER",
      "entity_name": "Bush Camp Outfitters",
      "contact_person": "Jane Smith"
    }
  ],
  "items": [
    {
      "item_name": "Safari Package",
      "category": "EQUIPMENT",
      "unit_price": 100,
      "quantity": 5,
      "rate": 120
    },
    {
      "item_name": "Hotel Night",
      "category": "ACCOMMODATION",
      "unit_price": 50,
      "quantity": 7,
      "rate": 55
    }
  ],
  "participants": {
    "hunters": 2,
    "observers": 1,
    "companions": 2,
    "guides": 1
  },
  "payment_terms": [
    {
      "amount": 3333,
      "dueDate": "2025-02-01",
      "paymentMethod": "BANK_TRANSFER"
    },
    {
      "amount": 3333,
      "dueDate": "2025-02-15",
      "paymentMethod": "BANK_TRANSFER"
    },
    {
      "amount": 3334,
      "dueDate": "2025-03-01",
      "paymentMethod": "BANK_TRANSFER"
    }
  ],
  "preferences": {
    "allergies": ["SHELLFISH", "DAIRY"],
    "dietary": "VEGETARIAN",
    "activities": ["PHOTOGRAPHY", "BIRD_WATCHING"]
  },
  "logistics": {
    "hotel": {
      "location": "Serengeti",
      "checkIn": "2025-02-01",
      "nights": 7,
      "rooms": 5
    },
    "flight": {
      "from": "JRO",
      "to": "ARS",
      "date": "2025-02-01",
      "seats": 10
    },
    "transfer": {
      "from": "Airport",
      "to": "Safari Lodge",
      "date": "2025-02-01",
      "vehicle": "SUV"
    }
  }
}
```

### Expected Response (Success 200)

```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "id": 123,
    "order_number": "ORD-2025-001",
    "type": "SALES",
    "status": "DRAFT",
    "date": "2025-01-07",
    "currency_id": 1,
    "total_amount": 10000,
    "created_at": "2025-01-07T10:30:00Z",
    "updated_at": "2025-01-07T10:30:00Z"
  }
}
```

---

## ⚙️ Backend Implementation Checklist

### Model: Order (✅ Already Exists)
```sql
✅ id (primary key)
✅ order_number (unique)
✅ type (SALES/PURCHASE/TRANSFER)
✅ status (DRAFT/PENDING/CONFIRMED/FULFILLED)
✅ date (order date)
✅ currency_id (foreign key)
✅ notes (text)
✅ vat (decimal)
✅ expenses (decimal)
✅ exchange_rate (decimal)
✅ created_at
✅ updated_at
```

### Model: OrderParty (✅ Already Exists)
```sql
✅ id
✅ order_id (foreign key)
✅ role (CUSTOMER/SUPPLIER/AGENT/BROKER)
✅ entity_id (foreign key to Entity/Contact)
✅ entity_name (fallback if entity not found)
✅ contact_person
✅ email
✅ phone
```

### Model: OrderItem (✅ Already Exists)
```sql
✅ id
✅ order_id
✅ item_id
✅ item_name
✅ category
✅ unit_price
✅ quantity
✅ rate
✅ total (calculated: quantity * rate)
```

### Model: OrderParticipant (✅ Already Exists)
```sql
✅ id
✅ order_id
✅ hunters (integer)
✅ observers (integer)
✅ guides (integer, calculated)
✅ companions (integer)
✅ total_participants (integer, calculated)
```

### Model: OrderPaymentTerm (❌ MISSING - Need to Create)
```sql
❌ id
❌ order_id (foreign key)
❌ installment_number (1, 2, 3, ...)
❌ amount (decimal)
❌ due_date (date)
❌ payment_method (BANK_TRANSFER/CREDIT_CARD/CHECK/CASH)
❌ status (PENDING/PAID/OVERDUE)
❌ created_at
❌ updated_at
```

### Model: OrderLogistic (✅ Already Exists)
```sql
✅ id
✅ order_id
✅ type (HOTEL/FLIGHT/TRANSFER)
✅ details (JSON: { location, checkIn, nights, rooms } etc)
✅ status
```

### Model: OrderPreference (✅ Already Exists)
```sql
✅ id
✅ order_id
✅ allergies (JSON array)
✅ dietary_preference
✅ activity_preferences (JSON array)
```

---

## 🛠️ Backend Changes Needed

### 1. Modify createOrder() Endpoint

**Current**: Simple POST with basic fields
**Needed**: Accept nested data (parties, items, participants, etc.)

**Option A - Single Request with Nested Data** (Recommended)
```php
POST /api/v1.0/orders
{
  "order": {...},
  "parties": [...],
  "items": [...],
  "participants": {...},
  "payment_terms": [...],
  "preferences": {...},
  "logistics": {...}
}

// Controller logic:
1. Create Order record
2. Create OrderParty records from parties array
3. Create OrderItem records from items array
4. Create OrderParticipant record
5. Create OrderPaymentTerm records from payment_terms array
6. Create OrderPreference record
7. Create OrderLogistic records
```

**Option B - Multiple Sequential Requests** (Current Pattern)
```php
// Request 1
POST /api/v1.0/orders
← returns order_id = 123

// Request 2-7
POST /api/v1.0/orders/123/parties
POST /api/v1.0/orders/123/items
POST /api/v1.0/orders/123/participants
POST /api/v1.0/orders/123/payment-terms
POST /api/v1.0/orders/123/preferences
POST /api/v1.0/orders/123/logistics
```

**Recommendation**: Use Option A (single request) for better UX and atomic transactions.

### 2. Create OrderPaymentTerm Model & Migration

```bash
# Generate model and migration
php artisan make:model OrderPaymentTerm -m

# Migration file
Schema::create('order_payment_terms', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
    $table->integer('installment_number');
    $table->decimal('amount', 15, 2);
    $table->date('due_date');
    $table->enum('payment_method', ['BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH']);
    $table->enum('status', ['PENDING', 'PAID', 'OVERDUE'])->default('PENDING');
    $table->timestamps();
    $table->index(['order_id']);
});
```

### 3. Update Order Model Relationships

```php
class Order extends Model {
    public function paymentTerms()
    {
        return $this->hasMany(OrderPaymentTerm::class);
    }
    
    public function parties()
    {
        return $this->hasMany(OrderParty::class);
    }
    
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    
    public function participants()
    {
        return $this->hasOne(OrderParticipant::class);
    }
    
    public function preferences()
    {
        return $this->hasOne(OrderPreference::class);
    }
    
    public function logistics()
    {
        return $this->hasMany(OrderLogistic::class);
    }
}
```

### 4. Update Store Controller

```php
class OrderController extends Controller {
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_number' => 'required|unique:orders',
            'type' => 'required|in:SALES,PURCHASE,TRANSFER',
            'status' => 'required|in:DRAFT,PENDING,CONFIRMED,FULFILLED,CANCELLED',
            'date' => 'required|date',
            'currency_id' => 'required|exists:currencies,id',
            'parties' => 'array|min:1',
            'items' => 'array|min:1',
            'participants' => 'required|array',
            'payment_terms' => 'array',
            'preferences' => 'array',
            'logistics' => 'array'
        ]);

        DB::beginTransaction();
        try {
            // Create order
            $order = Order::create($validated);

            // Create parties
            if (!empty($validated['parties'])) {
                foreach ($validated['parties'] as $party) {
                    $order->parties()->create($party);
                }
            }

            // Create items
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $order->items()->create($item);
                }
            }

            // Create participant record
            if (!empty($validated['participants'])) {
                $order->participants()->create($validated['participants']);
            }

            // Create payment terms
            if (!empty($validated['payment_terms'])) {
                foreach ($validated['payment_terms'] as $index => $term) {
                    $term['installment_number'] = $index + 1;
                    $order->paymentTerms()->create($term);
                }
            }

            // Create preferences
            if (!empty($validated['preferences'])) {
                $order->preferences()->create($validated['preferences']);
            }

            // Create logistics
            if (!empty($validated['logistics'])) {
                $logistics = $validated['logistics'];
                foreach (['hotel', 'flight', 'transfer'] as $type) {
                    if (!empty($logistics[$type])) {
                        $order->logistics()->create([
                            'type' => strtoupper($type),
                            'details' => $logistics[$type]
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order created successfully',
                'data' => $order->load([
                    'parties', 'items', 'participants', 
                    'paymentTerms', 'preferences', 'logistics'
                ])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error creating order: ' . $e->getMessage()
            ], 422);
        }
    }
}
```

---

## 🧪 Testing the Wizard

### Manual Test Steps

1. **Navigate to Create Order**
   - Go to http://localhost:8000/#/orders
   - Click "Create Order" button
   - Should load OrderWizard component

2. **Fill Step 1**
   - Enter Order Number: `ORD-2025-TEST-001`
   - Select Type: `SALES`
   - Select Status: `DRAFT`
   - Select Date: `2025-01-07`
   - Select Currency: `USD`
   - Click "Next"

3. **Fill Step 2**
   - Role: `CUSTOMER`
   - Entity: `Test Company`
   - Contact: `Test Person`
   - Click "Add Party"
   - Click "Next"

4. **Fill Step 3**
   - Item Name: `Test Item`
   - Category: `EQUIPMENT`
   - Quantity: `1`
   - Rate: `100`
   - Click "Next"

5. **Fill Steps 4-7**
   - Optional: Fill logistics, participants, payment, preferences
   - Or skip by clicking "Next"

6. **Review Step 8**
   - Verify all entered data
   - Click "Create Order"

7. **Check Results**
   - Should see "Order created successfully" toast
   - Should redirect to order detail page
   - Order should appear in Orders list

### API Debugging

**Chrome DevTools → Network Tab**
```
Filter: "orders"
Look for: POST request to /api/v1.0/orders
Check:
  ✓ Request payload contains all wizard data
  ✓ Response status is 200/201
  ✓ Response contains order ID
```

**Browser Console**
```javascript
// Check if store is loaded
console.log(useOrderStore().orderTypes)

// Check wizard data
console.log(wizardData)

// Check order creation response
console.log(response.data)
```

---

## 💾 Database State After Creation

After successful order creation with wizard:

```sql
-- Orders table
SELECT * FROM orders WHERE order_number = 'ORD-2025-001';
-- Returns: 1 record with id=123

-- OrderParties table
SELECT * FROM order_parties WHERE order_id = 123;
-- Returns: 1+ records (one for each party)

-- OrderItems table
SELECT * FROM order_items WHERE order_id = 123;
-- Returns: 1+ records (one for each item)

-- OrderParticipants table
SELECT * FROM order_participants WHERE order_id = 123;
-- Returns: 1 record with hunter/observer/companion counts

-- OrderPaymentTerms table
SELECT * FROM order_payment_terms WHERE order_id = 123;
-- Returns: 3 records (one for each installment)

-- OrderPreferences table
SELECT * FROM order_preferences WHERE order_id = 123;
-- Returns: 1 record with allergies/dietary/activities

-- OrderLogistics table
SELECT * FROM order_logistics WHERE order_id = 123;
-- Returns: 0-3 records (hotel, flight, transfer)
```

---

## 🔍 Troubleshooting

### Issue: Wizard doesn't load
**Solution**: 
- Check router config (should point to OrderWizard)
- Check browser console for import errors
- Verify OrderWizard.vue file exists in src/views/orders/

### Issue: Order creation fails
**Solution**:
- Check browser network tab for error response
- Check backend error logs
- Verify database migrations are run
- Verify API endpoint exists: POST /api/v1.0/orders

### Issue: Data not saved to database
**Solution**:
- Check if transaction is being rolled back
- Verify all foreign key constraints
- Check if PaymentTerms model exists
- Verify payload structure matches backend expectations

### Issue: Toast messages don't show
**Solution**:
- Check if useToast() is imported
- Verify toast composable exists: src/composables/useToast.ts
- Check browser console for composable errors

---

## 📚 Related Documentation

- **ORDER_WIZARD_ARCHITECTURE_VISUAL.md** - Visual diagrams and file structure
- **ORDER_WIZARD_COMPONENTS.md** - Ready-to-use component code
- **ORDER_WIZARD_SUMMARY.md** - Executive overview
- **PINIA_REFACTOR_SUMMARY.md** - Store implementation details

