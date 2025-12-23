# Price Structure API Documentation

This document describes the API endpoints for managing price structures using the new database tables.

## Base URL
```
/api/v1.0/settings
```

---

## Hunt Lengths

### Get All Hunt Lengths
```http
GET /hunt-lengths
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "days": 7,
      "label": "7-Day Safari",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z"
    },
    {
      "id": 2,
      "days": 14,
      "label": "14-Day Safari",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z"
    }
  ]
}
```

### Create Hunt Length
```http
POST /hunt-lengths
```

**Request Body:**
```json
{
  "days": 10,
  "label": "10-Day Safari",
  "is_active": true
}
```

**Response (201):**
```json
{
  "message": "Hunt length created successfully",
  "data": {
    "id": 3,
    "days": 10,
    "label": "10-Day Safari",
    "is_active": true
  }
}
```

---

## Price Structures

### List Price Structures
```http
GET /price-structures
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `area_id` | integer | Filter by hunting area |
| `is_active` | boolean | Filter by active status |
| `current_only` | boolean | Only return current/future price structures (default: true) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "area_id": 1,
      "area_name": "Selous Game Reserve",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "is_active": true,
      "user_id": 1,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z",
      "items": [
        {
          "id": 1,
          "name": "Buffalo Hunt Package",
          "description": "Premium buffalo hunting experience",
          "hunting_type_id": 1,
          "hunting_type_name": "Dangerous Game",
          "hunt_length_id": 1,
          "hunt_length_days": 7,
          "hunt_length_label": "7-Day Safari",
          "currency_id": 1,
          "currency_symbol": "$",
          "amount": "15000.00",
          "is_active": true
        }
      ],
      "observer_hunter_prices": [
        {
          "id": 1,
          "hunt_length_id": 1,
          "hunt_length_days": 7,
          "hunt_length_label": "7-Day Safari",
          "currency_id": 1,
          "currency_symbol": "$",
          "amount": "500.00"
        }
      ],
      "companion_hunter_prices": [
        {
          "id": 1,
          "hunt_length_id": 1,
          "hunt_length_days": 7,
          "hunt_length_label": "7-Day Safari",
          "currency_id": 1,
          "currency_symbol": "$",
          "amount": "350.00"
        }
      ],
      "upgrade_fees": [
        {
          "id": 1,
          "species_id": 1,
          "species_name": "Lion",
          "trigger_condition": "Trophy size > 9 feet",
          "fee_amount": "5000.00",
          "currency_id": 1,
          "currency_symbol": "$",
          "notes": "Additional fee for exceptional trophy"
        }
      ]
    }
  ]
}
```

### Get Single Price Structure
```http
GET /price-structures/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "area_id": 1,
    "area_name": "Selous Game Reserve",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "is_active": true,
    "user_id": 1,
    "user": {
      "id": 1,
      "name": "Admin User"
    },
    "area": {
      "id": 1,
      "name": "Selous Game Reserve",
      "description": "Tanzania's largest game reserve"
    },
    "items": [...],
    "observer_hunter_prices": [...],
    "companion_hunter_prices": [...],
    "upgrade_fees": [...]
  }
}
```

### Create Price Structure
```http
POST /price-structures
```

**Request Body:**
```json
{
  "user_id": 1,
  "area_id": 1,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "is_active": true,
  "items": [
    {
      "hunting_type_id": 1,
      "hunt_length_id": 1,
      "currency_id": 1,
      "amount": 15000.00,
      "name": "Buffalo Hunt Package",
      "description": "Premium buffalo hunting experience",
      "is_active": true
    },
    {
      "hunting_type_id": 2,
      "hunt_length_id": 2,
      "currency_id": 1,
      "amount": 25000.00,
      "name": "Lion Hunt Package",
      "description": "Ultimate lion hunting safari",
      "is_active": true
    }
  ],
  "observer_hunter_prices": [
    {
      "hunt_length_id": 1,
      "currency_id": 1,
      "amount": 500.00
    },
    {
      "hunt_length_id": 2,
      "currency_id": 1,
      "amount": 900.00
    }
  ],
  "companion_hunter_prices": [
    {
      "hunt_length_id": 1,
      "currency_id": 1,
      "amount": 350.00
    },
    {
      "hunt_length_id": 2,
      "currency_id": 1,
      "amount": 650.00
    }
  ],
  "upgrade_fees": [
    {
      "species_id": 1,
      "trigger_condition": "Trophy size > 9 feet",
      "fee_amount": 5000.00,
      "currency_id": 1,
      "notes": "Additional fee for exceptional trophy"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Price structure created successfully",
  "data": {
    "id": 1
  }
}
```

### Update Price Structure
```http
PUT /price-structures/{id}
```

**Request Body:** (all fields optional - only send what you want to update)
```json
{
  "area_id": 2,
  "start_date": "2025-02-01",
  "end_date": "2025-12-31",
  "is_active": true,
  "items": [
    {
      "hunting_type_id": 1,
      "hunt_length_id": 1,
      "currency_id": 1,
      "amount": 16000.00,
      "name": "Updated Buffalo Hunt Package",
      "description": "Updated description",
      "is_active": true
    }
  ],
  "observer_hunter_prices": [
    {
      "hunt_length_id": 1,
      "currency_id": 1,
      "amount": 550.00
    }
  ],
  "companion_hunter_prices": [
    {
      "hunt_length_id": 1,
      "currency_id": 1,
      "amount": 400.00
    }
  ],
  "upgrade_fees": [
    {
      "species_id": 1,
      "trigger_condition": "Trophy size > 10 feet",
      "fee_amount": 6000.00,
      "currency_id": 1,
      "notes": "Updated notes"
    }
  ]
}
```

> **Note:** When updating `items`, `observer_hunter_prices`, `companion_hunter_prices`, or `upgrade_fees`, the existing records are **replaced entirely** with the new data. Send the complete list of items you want to keep.

**Response:**
```json
{
  "success": true,
  "message": "Price structure updated successfully"
}
```

### Delete Price Structure
```http
DELETE /price-structures/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Price structure deleted successfully"
}
```

---

## Safari Extras (New Table)

### List Safari Extras
```http
GET /safari-extras-new
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `area_id` | integer | Filter by hunting area |
| `is_active` | boolean | Filter by active status |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "account_id": 1,
      "currency_id": 1,
      "amount": "150.00",
      "description": "Airport transfer",
      "charge_type": "FLAT",
      "area_id": 1,
      "is_active": true,
      "account": { "id": 1, "name": "Transport" },
      "currency": { "id": 1, "symbol": "$" },
      "area": { "id": 1, "name": "Selous" }
    }
  ]
}
```

### Create Safari Extra
```http
POST /safari-extras-new
```

**Request Body:**
```json
{
  "account_id": 1,
  "currency_id": 1,
  "amount": 150.00,
  "description": "Airport transfer",
  "charge_type": "FLAT",
  "area_id": 1,
  "is_active": true
}
```

**Charge Types:**
- `PER_DAY` - Charged per day
- `PER_DAY_PERSON` - Charged per day per person
- `PER_ROUND` - Charged per round/trip
- `FLAT` - Flat fee

**Response (201):**
```json
{
  "success": true,
  "message": "Safari extra created successfully",
  "data": { ... }
}
```

### Update Safari Extra
```http
PUT /safari-extras-new/{id}
```

**Request Body:**
```json
{
  "amount": 175.00,
  "description": "Updated airport transfer",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Safari extra updated successfully",
  "data": { ... }
}
```

### Delete Safari Extra
```http
DELETE /safari-extras-new/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Safari extra deleted successfully"
}
```

---

## Upgrade Fees

### List Upgrade Fees
```http
GET /upgrade-fees
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `area_id` | integer | Filter by hunting area |
| `price_structure_id` | integer | Filter by price structure |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "species_id": 1,
      "trigger_condition": "Trophy size > 9 feet",
      "fee_amount": "5000.00",
      "currency_id": 1,
      "notes": "Additional fee for exceptional trophy",
      "area_id": 1,
      "price_structure_id": 1,
      "species": { "id": 1, "name": "Lion" },
      "currency": { "id": 1, "symbol": "$" },
      "area": { "id": 1, "name": "Selous" },
      "priceStructure": { ... }
    }
  ]
}
```

### Create Upgrade Fee
```http
POST /upgrade-fees
```

**Request Body:**
```json
{
  "species_id": 1,
  "trigger_condition": "Trophy size > 9 feet",
  "fee_amount": 5000.00,
  "currency_id": 1,
  "notes": "Additional fee for exceptional trophy",
  "area_id": 1,
  "price_structure_id": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Upgrade fee created successfully",
  "data": { ... }
}
```

### Update Upgrade Fee
```http
PUT /upgrade-fees/{id}
```

**Request Body:**
```json
{
  "fee_amount": 6000.00,
  "trigger_condition": "Trophy size > 10 feet",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Upgrade fee updated successfully",
  "data": { ... }
}
```

### Delete Upgrade Fee
```http
DELETE /upgrade-fees/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Upgrade fee deleted successfully"
}
```

---

## Related Endpoints (Existing)

These existing endpoints are useful when creating price structures:

| Endpoint | Description |
|----------|-------------|
| `GET /currencies` | Get all currencies |
| `GET /hunting-areas` | Get all hunting areas |
| `GET /hunting-types` | Get all hunting types |
| `GET /species` | Get all species |
| `GET /accounts` | Get all accounts |

---

## Hunting Types (pre-defined values)

The `GET /hunting-types` endpoint returns the available hunting types. Current values in the database are:

```sql
SELECT * FROM hunting_types;
+----+------+-------------+
| id | name | description |
+----+------+-------------+
|  1 | 1x1  | 1x1         |
|  2 | 2x1  | 2x1         |
|  3 | 2x2  | 2x2         |
+----+------+-------------+
```

Frontend notes:
- Use the `id` as the option value and `name` as the label in dropdowns (for example: `1x1`, `2x1`, `2x2`).
- When creating or updating `PriceStructureItem`, send `hunting_type_id` set to the selected id.
- If you need a human-friendly label different from `name`, map it in the UI layer rather than changing DB values.


## Error Responses

All endpoints return errors in this format:

**404 Not Found:**
```json
{
  "success": false,
  "message": "Price structure not found"
}
```

**422 Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "area_id": ["The area id field is required."],
    "items.0.amount": ["The items.0.amount field is required."]
  }
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Failed to create price structure",
  "error": "Database error message"
}
```

---

## TypeScript Interfaces

```typescript
interface HuntLength {
  id: number;
  days: number;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PriceStructureItem {
  id?: number;
  hunting_type_id: number;
  hunting_type_name?: string;
  hunt_length_id: number;
  hunt_length_days?: number;
  hunt_length_label?: string;
  currency_id: number;
  currency_symbol?: string;
  amount: number | string;
  name: string;
  description?: string;
  is_active?: boolean;
}

interface ObserverHunterPrice {
  id?: number;
  hunt_length_id: number;
  hunt_length_days?: number;
  hunt_length_label?: string;
  currency_id: number;
  currency_symbol?: string;
  amount: number | string;
}

interface CompanionHunterPrice {
  id?: number;
  hunt_length_id: number;
  hunt_length_days?: number;
  hunt_length_label?: string;
  currency_id: number;
  currency_symbol?: string;
  amount: number | string;
}

interface UpgradeFee {
  id?: number;
  species_id: number;
  species_name?: string;
  trigger_condition: string;
  fee_amount: number | string;
  currency_id: number;
  currency_symbol?: string;
  notes?: string;
  area_id?: number;
  price_structure_id?: number;
}

interface PriceStructure {
  id?: number;
  user_id: number;
  area_id: number;
  area_name?: string;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
  items: PriceStructureItem[];
  observer_hunter_prices?: ObserverHunterPrice[];
  companion_hunter_prices?: CompanionHunterPrice[];
  upgrade_fees?: UpgradeFee[];
  created_at?: string;
  updated_at?: string;
}

interface SafariExtra {
  id?: number;
  account_id: number;
  currency_id: number;
  amount: number | string;
  description?: string;
  charge_type: 'PER_DAY' | 'PER_DAY_PERSON' | 'PER_ROUND' | 'FLAT';
  area_id?: number;
  is_active?: boolean;
}
```

---

## Example: Complete Price Structure Creation Flow

```typescript
// 1. Fetch required data for dropdowns
const [huntLengths, currencies, areas, huntingTypes, species] = await Promise.all([
  fetch('/api/v1.0/settings/hunt-lengths').then(r => r.json()),
  fetch('/api/v1.0/settings/currencies').then(r => r.json()),
  fetch('/api/v1.0/settings/hunting-areas').then(r => r.json()),
  fetch('/api/v1.0/settings/hunting-types').then(r => r.json()),
  fetch('/api/v1.0/settings/species').then(r => r.json()),
]);

// 2. Create price structure
const response = await fetch('/api/v1.0/settings/price-structures', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: currentUserId,
    area_id: selectedAreaId,
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    is_active: true,
    items: [
      {
        hunting_type_id: 1,
        hunt_length_id: 1,
        currency_id: 1,
        amount: 15000,
        name: 'Buffalo Hunt Package',
        description: 'Premium buffalo hunting',
      }
    ],
    observer_hunter_prices: [
      { hunt_length_id: 1, currency_id: 1, amount: 500 }
    ],
    companion_hunter_prices: [
      { hunt_length_id: 1, currency_id: 1, amount: 350 }
    ],
  }),
});

const result = await response.json();
console.log('Created price structure ID:', result.data.id);
```
