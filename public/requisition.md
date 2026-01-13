# Requisition Management System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Business Workflow](#business-workflow)
4. [API Endpoints](#api-endpoints)
5. [Request Payloads](#request-payloads)
6. [Response Formats](#response-formats)
7. [Backend Implementation](#backend-implementation)
8. [Usage Examples](#usage-examples)

---

## System Overview

The Requisition Management System is a corporate-level procurement and approval workflow system that handles multi-level requisitions with comprehensive tracking, dimensional costing, and approval chain integration.

### Key Features
- **Multi-level Approval Workflow** - Configurable approval chains with role-based authorization
- **Dimensional Costing** - Cost center, project, and department allocation
- **GL Account Integration** - Direct general ledger account allocations
- **Material Management** - Line item tracking with quantity, rate, and unit of measurement
- **Source Management** - Multiple payment sources (Cash, Vendor, Store, Service Provider)
- **Status Workflow** - Complete lifecycle from draft to closed
- **Approver Modifications** - Approvers can modify items during approval process

### System Components
- **13 Database Tables** - Normalized structure for requisitions, items, approvals, and dimensions
- **3 Controllers** - AccountingDimensionController, RequisitionTypeController, RequisitionController
- **2 Services** - Business logic layer for dimensions and requisitions
- **2 Request Validators** - StoreRequisitionRequest, UpdateRequisitionRequest
- **37 API Endpoints** - Complete CRUD and workflow operations

---

## Database Architecture

### Core Tables

#### 1. **accounting_dimension_types**
Defines dimension categories (Cost Centers, Projects, Departments, etc.)
```
- id (BIGINT PK)
- code (VARCHAR 50)
- name (VARCHAR 100)
- is_active (BOOLEAN)
- timestamps
```

#### 2. **accounting_dimension_values**
Specific values for each dimension type
```
- id (BIGINT PK)
- dimension_type_id (FK -> accounting_dimension_types)
- code (VARCHAR 50)
- name (VARCHAR 100)
- is_active (BOOLEAN)
- timestamps
```

#### 3. **requisition_types**
Types of requisitions with approval chain linkage
```
- id (BIGINT PK)
- code (VARCHAR 50)
- type (VARCHAR 50)
- name (VARCHAR 100)
- approval_chain_module_id (FK -> approval_chain_modules)
- form_behavior_json (JSON)
- is_active (BOOLEAN)
- timestamps
```

#### 4. **requisitions** (Main Table)
Primary requisition record
```
- id (BIGINT PK)
- company_id (BIGINT FK -> companies)
- branch_id (BIGINT FK -> branches)
- user_id (INT FK -> auth_user)
- requested_by (INT FK -> auth_user)
- requisition_type_id (BIGINT FK -> requisition_types)
- form_behavior_json (JSON)
- fund_direction (ENUM: INCOMING/OUTGOING)
- required_date (DATE)
- date (DATE)
- handler (INT FK -> auth_user)
- status (ENUM: DRAFT/SUBMITTED/APPROVAL_PENDING/APPROVED/REJECTED/CANCELLED/CLOSED)
- is_closed (BOOLEAN)
- is_printed (BOOLEAN)
- remarks (TEXT)
- timestamps
```

#### 5. **requisition_sources**
Payment/procurement sources
```
- id (BIGINT PK)
- requisition_id (FK -> requisitions)
- source_type (ENUM: CASH/STORE/VENDOR/SERVICE_PROVIDER)
- payee (VARCHAR 255)
- source_account_id (BIGINT FK -> accounts)
- mode_of_payment (ENUM: CASH/TT/CREDIT)
- currency_id (BIGINT FK -> currencies)
- exchange_rate (DECIMAL)
- description (TEXT)
- timestamps
```

#### 6. **requisition_items**
Line items in requisition
```
- id (BIGINT PK)
- requisition_id (FK -> requisitions)
- currency_id (BIGINT FK -> currencies)
- value_added_tax_id (BIGINT)
- discount_amount (DECIMAL)
- discount_method (ENUM: PERCENTAGE/AMOUNT)
- tax_method (ENUM: INCLUSIVE/EXCLUSIVE)
- remarks (TEXT)
- timestamps
```

#### 7. **requisition_item_dimensions**
Cost allocation by dimensions
```
- id (BIGINT PK)
- requisition_item_id (FK -> requisition_items)
- dimension_type_id (FK -> accounting_dimension_types)
- dimension_value_id (FK -> accounting_dimension_values)
- amount (DECIMAL)
- percentage (DECIMAL)
- timestamps
```

#### 8. **requisition_item_accounts**
GL account allocations per item
```
- id (BIGINT PK)
- requisition_item_id (FK -> requisition_items)
- account_id (BIGINT FK -> accounts)
- currency_id (BIGINT FK -> currencies)
- amount (DECIMAL)
- description (TEXT)
- timestamps
```

#### 9. **requisition_item_materials**
Physical items/materials
```
- id (BIGINT PK)
- requisition_item_id (FK -> requisition_items)
- item_id (BIGINT FK -> items)
- unit_of_measurement_id (BIGINT FK -> unit_of_measurements)
- quantity (DECIMAL)
- rate (DECIMAL)
- currency_id (BIGINT FK -> currencies)
- description (TEXT)
- timestamps
```

#### 10. **requisition_approvals**
Approval history records
```
- id (BIGINT PK)
- requisition_id (FK -> requisitions)
- approved_by (INT FK -> auth_user)
- handled_by (INT FK -> auth_user)
- approval_chain_level_id (BIGINT FK -> approval_chain_levels)
- status (ENUM: APPROVED/REJECTED)
- date (DATETIME)
- remarks (TEXT)
- timestamps
```

#### 11-13. **requisition_approval_item[_account|_material]**
Approver modifications to items, accounts, and materials during approval process.

---

## Business Workflow

### Requisition Lifecycle

```
┌─────────┐
│  DRAFT  │ ← Initial creation state
└────┬────┘
     │
     │ submit()
     ▼
┌──────────┐
│SUBMITTED │ ← Awaiting first approval level
└────┬─────┘
     │
     │ approve() at level 1
     ▼
┌─────────────────┐
│APPROVAL_PENDING │ ← Multi-level approval in progress
└────┬────────────┘
     │
     │ approve() at final level
     ▼
┌──────────┐
│ APPROVED │ ← All levels approved
└────┬─────┘
     │
     │ close()
     ▼
┌────────┐
│ CLOSED │ ← Final state (completed)
└────────┘

Alternative paths:
- DRAFT/SUBMITTED/APPROVAL_PENDING → cancel() → CANCELLED
- SUBMITTED/APPROVAL_PENDING → reject() → REJECTED
```

### Approval Chain Integration

The system integrates with the existing approval chain infrastructure:

1. **Requisition Type** → Links to `approval_chain_module`
2. **Approval Chain Module** → Has multiple `approval_chain_levels` (Level 1, 2, 3, etc.)
3. **Approval Chain Level** → Has `approval_chains` (user assignments)
4. **Approval Chain** → Links `user_id` to specific level

**Approval Flow Logic:**
1. User submits requisition → Status becomes `SUBMITTED`
2. System checks Level 1 approvers from approval chain
3. Level 1 approver approves → Status becomes `APPROVAL_PENDING`
4. System checks if more levels exist
5. If yes: Next level approver must approve
6. If no: Status becomes `APPROVED`

**Authorization Check:**
- System verifies approver is assigned to current approval level
- Unauthorized users cannot approve
- Approvers can modify items during approval (tracked separately)

### Status Permissions

| Status | Can Edit | Can Submit | Can Approve | Can Cancel | Can Delete |
|--------|----------|------------|-------------|------------|------------|
| DRAFT | ✓ | ✓ | ✗ | ✓ | ✓ |
| SUBMITTED | ✗ | ✗ | ✓ | ✓ | ✗ |
| APPROVAL_PENDING | ✗ | ✗ | ✓ | ✓ | ✗ |
| APPROVED | ✗ | ✗ | ✗ | ✗ | ✗ |
| REJECTED | ✗ | ✗ | ✗ | ✗ | ✗ |
| CANCELLED | ✗ | ✗ | ✗ | ✗ | ✓ |
| CLOSED | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## API Endpoints

### Base URL
```
/api/v1.0/
```

### 1. Accounting Dimensions

#### Dimension Types
```
GET    /accounting-dimensions/types              - List all dimension types
GET    /accounting-dimensions/types/{id}         - Get single dimension type
POST   /accounting-dimensions/types              - Create dimension type
PUT    /accounting-dimensions/types/{id}         - Update dimension type
PATCH  /accounting-dimensions/types/{id}         - Partial update
DELETE /accounting-dimensions/types/{id}         - Delete dimension type
```

**Query Parameters (List):**
- `active_only` (boolean) - Filter active dimension types only

#### Dimension Values
```
GET    /accounting-dimensions/values             - List all dimension values
GET    /accounting-dimensions/values/{id}        - Get single dimension value
POST   /accounting-dimensions/values             - Create dimension value
PUT    /accounting-dimensions/values/{id}        - Update dimension value
PATCH  /accounting-dimensions/values/{id}        - Partial update
DELETE /accounting-dimensions/values/{id}        - Delete dimension value
```

**Query Parameters (List):**
- `type_id` (integer) - Filter by dimension type
- `active_only` (boolean) - Filter active values only

---

### 2. Requisition Types

```
GET    /requisition-types                        - List all requisition types
GET    /requisition-types/{id}                   - Get single requisition type
POST   /requisition-types                        - Create requisition type
PUT    /requisition-types/{id}                   - Update requisition type
PATCH  /requisition-types/{id}                   - Partial update
DELETE /requisition-types/{id}                   - Delete requisition type
```

**Query Parameters (List):**
- `active_only` (boolean) - Filter active types only

---

### 3. Requisitions (Main)

#### Core CRUD
```
GET    /requisitions                             - List requisitions (filtered)
GET    /requisitions/{id}                        - Get single requisition
POST   /requisitions                             - Create requisition
PUT    /requisitions/{id}                        - Update requisition
PATCH  /requisitions/{id}                        - Partial update
DELETE /requisitions/{id}                        - Delete requisition
```

**Query Parameters (List):**
- `company_id` (integer) - Filter by company
- `user_id` (integer) - Filter by creator
- `status` (string) - Filter by status
- `requisition_type_id` (integer) - Filter by type
- `date_from` (date) - Filter from date
- `date_to` (date) - Filter to date
- `is_closed` (boolean) - Filter closed status

#### Status Workflow
```
POST   /requisitions/{id}/submit                 - Submit for approval
POST   /requisitions/{id}/cancel                 - Cancel requisition
POST   /requisitions/{id}/close                  - Close approved requisition
```

#### Approval Workflow
```
POST   /requisitions/{id}/approve                - Approve requisition
POST   /requisitions/{id}/reject                 - Reject requisition
GET    /requisitions/pending-approvals           - Get pending approvals for user
```

#### Sources Management
```
POST   /requisitions/{requisitionId}/sources                    - Add source
PUT    /requisitions/{requisitionId}/sources/{sourceId}         - Update source
DELETE /requisitions/{requisitionId}/sources/{sourceId}         - Delete source
```

#### Items Management
```
POST   /requisitions/{requisitionId}/items                      - Add item
PUT    /requisitions/{requisitionId}/items/{itemId}             - Update item
DELETE /requisitions/{requisitionId}/items/{itemId}             - Delete item
```

#### Statistics
```
GET    /requisitions/summary                     - Get requisition statistics
```

---

## Request Payloads

### 1. Create Requisition

**Endpoint:** `POST /api/v1.0/requisitions`

**Payload:**
```json
{
  "company_id": 1,
  "branch_id": 5,
  "requisition_type_id": 3,
  "fund_direction": "OUTGOING",
  "requested_by": 42,
  "required_date": "2026-02-15",
  "date": "2026-01-12",
  "handler": 38,
  "remarks": "Office supplies purchase request",
  "form_behavior_json": "{\"show_sources\": true}",
  
  "sources": [
    {
      "source_type": "VENDOR",
      "payee": "Office Supplies Ltd",
      "source_account_id": 150,
      "mode_of_payment": "CREDIT",
      "currency_id": 1,
      "exchange_rate": 1.0,
      "description": "Main vendor for office supplies"
    }
  ],
  
  "items": [
    {
      "currency_id": 1,
      "value_added_tax_id": 2,
      "discount_amount": 50.00,
      "discount_method": "AMOUNT",
      "tax_method": "EXCLUSIVE",
      "remarks": "Bulk order discount applied",
      
      "dimensions": [
        {
          "dimension_type_id": 1,
          "dimension_value_id": 5,
          "amount": 500.00,
          "percentage": 50.0
        },
        {
          "dimension_type_id": 2,
          "dimension_value_id": 12,
          "amount": 500.00,
          "percentage": 50.0
        }
      ],
      
      "accounts": [
        {
          "account_id": 300,
          "currency_id": 1,
          "amount": 1000.00,
          "description": "Office Supplies Expense"
        }
      ],
      
      "materials": [
        {
          "item_id": 450,
          "unit_of_measurement_id": 3,
          "quantity": 50,
          "rate": 20.00,
          "currency_id": 1,
          "description": "A4 Paper - 500 sheets/ream"
        }
      ]
    }
  ]
}
```

**Validation Rules:**
- `company_id` - Required, must exist in companies table
- `requisition_type_id` - Required, must exist in requisition_types
- `date` - Required, valid date format
- `items` - Required, must have at least 1 item
- `sources` - Optional array
- `fund_direction` - Must be "INCOMING" or "OUTGOING"

---

### 2. Update Requisition

**Endpoint:** `PUT /api/v1.0/requisitions/{id}`

**Payload:** (Only include fields to update)
```json
{
  "branch_id": 6,
  "required_date": "2026-02-20",
  "remarks": "Updated delivery date due to supplier delay",
  
  "sources": [
    {
      "source_type": "VENDOR",
      "payee": "New Supplier Co",
      "mode_of_payment": "CASH"
    }
  ],
  
  "items": [
    {
      "currency_id": 1,
      "materials": [
        {
          "item_id": 451,
          "unit_of_measurement_id": 3,
          "quantity": 100,
          "rate": 18.50
        }
      ]
    }
  ]
}
```

**Note:** 
- Can only update requisitions in `DRAFT` status
- If `sources` or `items` arrays provided, existing ones are **replaced** entirely
- Omit `sources`/`items` to keep existing data unchanged

---

### 3. Submit Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{id}/submit`

**Payload:** Empty
```json
{}
```

**Business Rules:**
- Requisition must be in `DRAFT` status
- Must have at least 1 item
- Changes status to `SUBMITTED`

---

### 4. Approve Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{id}/approve`

**Payload:**
```json
{
  "remarks": "Approved with minor adjustments",
  "handled_by": 25,
  
  "items": [
    {
      "requisition_item_id": 101,
      "currency_id": 1,
      "discount_method": "PERCENTAGE",
      "discount_amount": 10.0,
      "description": "Approved with 10% discount instead",
      
      "accounts": [
        {
          "account_id": 305,
          "currency_id": 1,
          "amount": 900.00,
          "description": "Reduced allocation to this account"
        }
      ],
      
      "materials": [
        {
          "item_id": 450,
          "unit_of_measurement_id": 3,
          "quantity": 40,
          "rate": 20.00,
          "description": "Reduced quantity to 40"
        }
      ]
    }
  ]
}
```

**Business Rules:**
- User must be assigned to current approval level
- Creates `requisition_approval` record
- If approver modifies items, creates `requisition_approval_items` records
- Advances to next level or marks as `APPROVED` if final level

---

### 5. Reject Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{id}/reject`

**Payload:**
```json
{
  "remarks": "Insufficient budget allocation for this period"
}
```

**Business Rules:**
- User must be assigned to current approval level
- Creates `requisition_approval` record with `REJECTED` status
- Changes requisition status to `REJECTED`
- `remarks` is required for rejections

---

### 6. Cancel Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{id}/cancel`

**Payload:**
```json
{
  "remarks": "Vendor no longer available"
}
```

**Business Rules:**
- Can cancel from `DRAFT`, `SUBMITTED`, or `APPROVAL_PENDING` status
- Cannot cancel `APPROVED`, `REJECTED`, or `CLOSED` requisitions

---

### 7. Close Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{id}/close`

**Payload:** Empty
```json
{}
```

**Business Rules:**
- Only `APPROVED` requisitions can be closed
- Sets `is_closed = true`
- Changes status to `CLOSED`

---

### 8. Add Source to Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{requisitionId}/sources`

**Payload:**
```json
{
  "source_type": "CASH",
  "payee": "Petty Cash",
  "source_account_id": 100,
  "mode_of_payment": "CASH",
  "currency_id": 1,
  "exchange_rate": 1.0,
  "description": "Payment from petty cash account"
}
```

---

### 9. Add Item to Requisition

**Endpoint:** `POST /api/v1.0/requisitions/{requisitionId}/items`

**Payload:**
```json
{
  "currency_id": 1,
  "value_added_tax_id": 2,
  "discount_amount": 5.0,
  "discount_method": "PERCENTAGE",
  "tax_method": "INCLUSIVE",
  "remarks": "Additional item requested",
  
  "dimensions": [
    {
      "dimension_type_id": 1,
      "dimension_value_id": 5,
      "amount": 200.00,
      "percentage": 100.0
    }
  ],
  
  "accounts": [
    {
      "account_id": 310,
      "currency_id": 1,
      "amount": 200.00,
      "description": "Additional expense"
    }
  ],
  
  "materials": [
    {
      "item_id": 452,
      "unit_of_measurement_id": 4,
      "quantity": 10,
      "rate": 20.00,
      "currency_id": 1,
      "description": "Printer cartridges"
    }
  ]
}
```

---

### 10. Create Dimension Type

**Endpoint:** `POST /api/v1.0/accounting-dimensions/types`

**Payload:**
```json
{
  "code": "COSTCENTER",
  "name": "Cost Center",
  "is_active": true
}
```

---

### 11. Create Dimension Value

**Endpoint:** `POST /api/v1.0/accounting-dimensions/values`

**Payload:**
```json
{
  "dimension_type_id": 1,
  "code": "CC001",
  "name": "IT Department",
  "is_active": true
}
```

---

### 12. Create Requisition Type

**Endpoint:** `POST /api/v1.0/requisition-types`

**Payload:**
```json
{
  "code": "PURCHASE",
  "type": "PROCUREMENT",
  "name": "Purchase Requisition",
  "approval_chain_module_id": 5,
  "form_behavior_json": "{\"require_sources\": true, \"allow_multiple_items\": true}",
  "is_active": true
}
```

---

## Response Formats

### Success Response (Single Resource)

```json
{
  "success": true,
  "message": "Requisition created successfully",
  "data": {
    "id": 123,
    "company_id": 1,
    "branch_id": 5,
    "user_id": 10,
    "requisition_type_id": 3,
    "status": "DRAFT",
    "date": "2026-01-12",
    "required_date": "2026-02-15",
    "remarks": "Office supplies purchase request",
    "is_closed": false,
    "created_at": "2026-01-12T10:30:00.000000Z",
    "updated_at": "2026-01-12T10:30:00.000000Z",
    
    "requisition_type": {
      "id": 3,
      "name": "Purchase Requisition",
      "code": "PURCHASE"
    },
    
    "user": {
      "id": 10,
      "name": "John Doe",
      "email": "john@example.com"
    },
    
    "sources": [
      {
        "id": 55,
        "source_type": "VENDOR",
        "payee": "Office Supplies Ltd",
        "mode_of_payment": "CREDIT",
        "currency": {
          "id": 1,
          "code": "USD",
          "name": "US Dollar"
        }
      }
    ],
    
    "items": [
      {
        "id": 101,
        "currency_id": 1,
        "discount_amount": "50.00",
        "discount_method": "AMOUNT",
        "tax_method": "EXCLUSIVE",
        
        "dimensions": [
          {
            "id": 201,
            "dimension_type": {
              "id": 1,
              "name": "Cost Center"
            },
            "dimension_value": {
              "id": 5,
              "name": "IT Department"
            },
            "amount": "500.00",
            "percentage": "50.00"
          }
        ],
        
        "accounts": [
          {
            "id": 301,
            "account": {
              "id": 300,
              "name": "Office Supplies Expense",
              "code": "5100"
            },
            "amount": "1000.00"
          }
        ],
        
        "materials": [
          {
            "id": 401,
            "item": {
              "id": 450,
              "name": "A4 Paper",
              "code": "PAPER-A4"
            },
            "unit_of_measurement": {
              "id": 3,
              "name": "Ream",
              "abbreviation": "RM"
            },
            "quantity": "50.00",
            "rate": "20.00",
            "line_total": "1000.00"
          }
        ]
      }
    ],
    
    "approvals": []
  }
}
```

### Success Response (Collection)

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "status": "DRAFT",
      "date": "2026-01-12",
      "user": {
        "id": 10,
        "name": "John Doe"
      },
      "requisition_type": {
        "id": 3,
        "name": "Purchase Requisition"
      },
      "items_count": 3,
      "total_amount": "5000.00"
    },
    {
      "id": 124,
      "status": "APPROVED",
      "date": "2026-01-11",
      "user": {
        "id": 12,
        "name": "Jane Smith"
      },
      "requisition_type": {
        "id": 3,
        "name": "Purchase Requisition"
      },
      "items_count": 1,
      "total_amount": "1200.00"
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "message": "Requisition cannot be edited in current status: APPROVED"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "company_id": [
      "The company id field is required."
    ],
    "items": [
      "At least one item is required."
    ],
    "items.0.materials.0.quantity": [
      "The quantity must be at least 0."
    ]
  }
}
```

---

## Backend Implementation

### Architecture Overview

```
┌─────────────────┐
│  Controllers    │ ← HTTP Layer (Request/Response)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Services      │ ← Business Logic Layer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Models       │ ← Data Access Layer (Eloquent ORM)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │ ← MySQL Storage
└─────────────────┘
```

### Service Layer (RequisitionService)

**Key Methods:**

#### 1. `createRequisition(array $data): Requisition`
- Wraps in database transaction
- Creates main requisition record
- Creates nested sources (if provided)
- Creates nested items with dimensions/accounts/materials
- Returns created requisition

#### 2. `updateRequisition(int $id, array $data): ?Requisition`
- Checks if requisition `canBeEdited()`
- Updates main requisition fields
- Replaces sources if provided in payload
- Replaces items if provided in payload
- Returns updated requisition

#### 3. `submitRequisition(int $id): Requisition`
- Validates requisition has items
- Checks `canBeSubmitted()` (must be DRAFT)
- Changes status to `SUBMITTED`

#### 4. `approveRequisition(int $id, int $approverId, array $data): Requisition`
- Gets current approval level from approval history
- Determines next approval level needed
- Verifies approver is authorized for that level
- Creates `requisition_approval` record
- Optionally creates `requisition_approval_items` if approver modified items
- Advances status to `APPROVAL_PENDING` or `APPROVED`

**Approval Level Detection Logic:**
```php
protected function getCurrentApprovalLevel(Requisition $requisition): int
{
    $lastApproval = $requisition->approvals()
        ->where('status', RequisitionApproval::STATUS_APPROVED)
        ->orderBy('created_at', 'desc')
        ->first();

    if (!$lastApproval || !$lastApproval->approvalChainLevel) {
        return 0; // No approvals yet
    }

    return $lastApproval->approvalChainLevel->level_id;
}

protected function getNextApprovalLevel(int $moduleId, int $currentLevel): ?ApprovalChainLevel
{
    return ApprovalChainLevel::where('approval_chain_module_id', $moduleId)
        ->where('level_id', '>', $currentLevel)
        ->orderBy('level_id')
        ->first();
}

protected function getApproverLevel(int $userId, int $moduleId, int $levelId): ?ApprovalChainLevel
{
    return ApprovalChainLevel::where('approval_chain_module_id', $moduleId)
        ->where('level_id', $levelId)
        ->whereHas('approvalChains', fn($q) => $q->where('user_id', $userId))
        ->first();
}
```

#### 5. `rejectRequisition(int $id, int $approverId, ?string $remarks): Requisition`
- Creates `requisition_approval` with `REJECTED` status
- Changes requisition status to `REJECTED`

#### 6. `getPendingApprovals(int $approverId): Collection`
- Gets all approval chain levels assigned to user
- For each module/level, finds requisitions pending at that level
- Returns unique collection of requisitions

#### 7. Item/Source Management
- `createItem()`, `updateItem()`, `deleteItem()`
- `createSource()`, `updateSource()`, `deleteSource()`
- All check if requisition can be edited

### Model Layer

**Key Relationships:**

```php
// Requisition.php
public function requisitionType(): BelongsTo
public function user(): BelongsTo
public function sources(): HasMany
public function items(): HasMany
public function approvals(): HasMany

// RequisitionItem.php
public function requisition(): BelongsTo
public function dimensions(): HasMany
public function accounts(): HasMany
public function materials(): HasMany

// RequisitionApproval.php
public function requisition(): BelongsTo
public function approvedByUser(): BelongsTo
public function approvalChainLevel(): BelongsTo
public function approvalItems(): HasMany
```

**Helper Methods:**

```php
// Requisition.php
public function canBeEdited(): bool
{
    return in_array($this->status, [self::STATUS_DRAFT]);
}

public function canBeSubmitted(): bool
{
    return $this->status === self::STATUS_DRAFT;
}

public function canBeCancelled(): bool
{
    return in_array($this->status, [
        self::STATUS_DRAFT,
        self::STATUS_SUBMITTED,
        self::STATUS_APPROVAL_PENDING
    ]);
}

public function getTotal(): float
{
    $total = 0;
    foreach ($this->items as $item) {
        $total += $item->getTotal();
    }
    return $total;
}

// RequisitionItem.php
public function getSubtotal(): float
{
    return $this->materials->sum(fn($m) => $m->getLineTotal());
}

public function getTotal(): float
{
    $subtotal = $this->getSubtotal();
    
    // Apply discount
    if ($this->discount_amount) {
        if ($this->discount_method === self::DISCOUNT_PERCENTAGE) {
            $subtotal -= ($subtotal * $this->discount_amount / 100);
        } else {
            $subtotal -= $this->discount_amount;
        }
    }
    
    // Apply tax if exclusive
    if ($this->value_added_tax_id && $this->tax_method === self::TAX_EXCLUSIVE) {
        // Tax calculation would happen here
    }
    
    return $subtotal;
}

// RequisitionItemMaterial.php
public function getLineTotal(): float
{
    return $this->quantity * $this->rate;
}
```

### Controller Layer

**RequisitionController** handles:
- Request validation (via FormRequest classes)
- Calling service methods
- Formatting responses
- Error handling

**Standard Response Pattern:**
```php
try {
    $requisition = $this->service->createRequisition($data);
    
    return response()->json([
        'success' => true,
        'message' => 'Requisition created successfully',
        'data' => $this->service->getRequisition($requisition->id),
    ], 201);
} catch (\Exception $e) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 400);
}
```

---

## Usage Examples

### Complete Workflow Example

#### Step 1: Create Requisition Type (One-time setup)
```bash
POST /api/v1.0/requisition-types
{
  "code": "PURCHASE",
  "name": "Purchase Requisition",
  "approval_chain_module_id": 5,
  "is_active": true
}
```

#### Step 2: Create Dimension Types (One-time setup)
```bash
POST /api/v1.0/accounting-dimensions/types
{
  "code": "COSTCENTER",
  "name": "Cost Center",
  "is_active": true
}

POST /api/v1.0/accounting-dimensions/values
{
  "dimension_type_id": 1,
  "code": "IT",
  "name": "IT Department",
  "is_active": true
}
```

#### Step 3: Create Draft Requisition
```bash
POST /api/v1.0/requisitions
{
  "company_id": 1,
  "requisition_type_id": 1,
  "date": "2026-01-12",
  "required_date": "2026-02-01",
  "remarks": "Monthly IT supplies",
  "items": [
    {
      "currency_id": 1,
      "materials": [
        {
          "item_id": 100,
          "unit_of_measurement_id": 1,
          "quantity": 10,
          "rate": 25.00
        }
      ],
      "accounts": [
        {
          "account_id": 500,
          "amount": 250.00
        }
      ],
      "dimensions": [
        {
          "dimension_type_id": 1,
          "dimension_value_id": 1,
          "percentage": 100
        }
      ]
    }
  ]
}

Response: { "id": 123, "status": "DRAFT", ... }
```

#### Step 4: Submit for Approval
```bash
POST /api/v1.0/requisitions/123/submit

Response: { "id": 123, "status": "SUBMITTED", ... }
```

#### Step 5: Level 1 Manager Approves
```bash
POST /api/v1.0/requisitions/123/approve
{
  "remarks": "Approved by Department Manager"
}

Response: { "id": 123, "status": "APPROVAL_PENDING", ... }
```

#### Step 6: Level 2 Finance Approves
```bash
POST /api/v1.0/requisitions/123/approve
{
  "remarks": "Approved by Finance Director"
}

Response: { "id": 123, "status": "APPROVED", ... }
```

#### Step 7: Close Requisition After Fulfillment
```bash
POST /api/v1.0/requisitions/123/close

Response: { "id": 123, "status": "CLOSED", "is_closed": true, ... }
```

---

### Filter Requisitions Example

```bash
GET /api/v1.0/requisitions?company_id=1&status=APPROVED&date_from=2026-01-01&date_to=2026-01-31

Response:
{
  "success": true,
  "data": [
    { "id": 120, "status": "APPROVED", "date": "2026-01-05", ... },
    { "id": 123, "status": "APPROVED", "date": "2026-01-12", ... }
  ]
}
```

---

### Get Pending Approvals for User

```bash
GET /api/v1.0/requisitions/pending-approvals

Response:
{
  "success": true,
  "data": [
    {
      "id": 125,
      "status": "SUBMITTED",
      "user": { "name": "John Doe" },
      "items": [...],
      "current_approval_level": 1
    },
    {
      "id": 126,
      "status": "APPROVAL_PENDING",
      "user": { "name": "Jane Smith" },
      "items": [...],
      "current_approval_level": 2
    }
  ]
}
```

---

### Rejection Example

```bash
POST /api/v1.0/requisitions/125/reject
{
  "remarks": "Budget not allocated for this item. Please resubmit next quarter."
}

Response: { "id": 125, "status": "REJECTED", ... }
```

---

### Add Item to Existing Draft

```bash
POST /api/v1.0/requisitions/127/items
{
  "currency_id": 1,
  "materials": [
    {
      "item_id": 105,
      "unit_of_measurement_id": 2,
      "quantity": 5,
      "rate": 50.00
    }
  ],
  "accounts": [
    {
      "account_id": 510,
      "amount": 250.00
    }
  ]
}

Response: { "id": 450, "requisition_id": 127, ... }
```

---

## Summary Statistics

```bash
GET /api/v1.0/requisitions/summary?company_id=1

Response:
{
  "success": true,
  "data": {
    "total": 150,
    "draft": 20,
    "submitted": 15,
    "approval_pending": 10,
    "approved": 80,
    "rejected": 10,
    "cancelled": 5,
    "closed": 10
  }
}
```

---

## Security & Best Practices

### Authorization
- Implement middleware to check user permissions
- Verify user has access to company_id in requests
- Validate approvers are authorized for their approval level

### Data Validation
- All input validated via FormRequest classes
- Foreign key constraints enforced at database level
- Status transitions validated in service layer

### Transaction Safety
- All create/update operations wrapped in database transactions
- Rollback on failure ensures data consistency

### Performance Optimization
- Use eager loading for relationships (`with()`)
- Index foreign keys and status columns
- Implement pagination for large result sets

### Audit Trail
- All requisitions have created_at/updated_at timestamps
- Approval history maintained in requisition_approvals table
- Approver modifications tracked separately

---

## Troubleshooting

### Common Issues

**Issue:** "Requisition cannot be edited in current status"
- **Solution:** Only DRAFT requisitions can be edited. Check status before attempting update.

**Issue:** "User is not authorized to approve at this level"
- **Solution:** Verify user is assigned to correct approval_chain_level via approval_chains table.

**Issue:** "At least one item is required"
- **Solution:** Include items array with at least 1 item when creating or submitting requisition.

**Issue:** Approval stuck in APPROVAL_PENDING
- **Solution:** Check if all approval levels have been satisfied. Use `getPendingApprovals()` to see who needs to approve.

---

## Version History

- **v1.0** (2026-01-12) - Initial implementation with full CRUD and approval workflow

---

## Support

For technical support or questions, contact the development team or refer to the Laravel application documentation.
