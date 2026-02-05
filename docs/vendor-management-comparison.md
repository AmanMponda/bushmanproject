# Vendor Management Comparison

## Overview
This document compares two vendor management implementations in the Bushman ERP system.

---

## 1. Master Data Settings - Vendor Management
**Location:** `src/views/bushman/module-settings/ManageVendors.vue`  
**Route:** `/module-settings/vendors`  
**Menu:** Settings → Master Data → (Vendor Management hidden in procurement settings)

### Features
- **Full featured** vendor registration with all fields
- Comprehensive entity profiles (Company & Individual)
- Required fields enforcement:
  - Entity Type, Name, Country, Currency ✅
  - Registration details (for companies) ✅
  - Contact person details ✅
  - Identity/KYC information ✅
  - Registered address ✅
  - Default payable account ✅

### Form Sections
1. ✅ Basic Entity Information (9 fields - mostly required)
2. ✅ Vendor Category Assignment (required)
3. ✅ Company/Individual Profile (required based on type)
4. ✅ Primary Contact (required)
5. ✅ Identification/Light KYC (required)
6. ✅ Registered Address (required)

### Pros
- Complete data capture upfront
- Ensures data quality and compliance
- All vendor information centralized
- Better for regulated environments

### Cons
- Time-consuming registration process
- May block vendor onboarding
- Can be intimidating for quick vendor additions
- No flexibility for partial data entry

---

## 2. Procurement - Vendor Management (V1 MVP)
**Location:** `src/views/bushman/procurement/VendorManagement.vue`  
**Route:** `/procurement/vendors`  
**Menu:** Procurement → Vendor Management

### Features
- **Minimal MVP** vendor registration
- Focus on getting vendors into system quickly
- Progressive data entry approach
- Only 3 required fields:
  - Entity Type ✅
  - Name ✅
  - Vendor Category ✅

### Form Sections
1. ✅ Basic Entity Information (7 fields - 3 required)
   - Entity Type ⭐ (required)
   - Name ⭐ (required)
   - Trading Name (optional)
   - Country (optional)
   - Base Currency (optional)
   - Entity Code (auto-generated)
   - Notes (optional)

2. ✅ Vendor Category Assignment (1 required field)
   - Vendor Category ⭐ (required)
   - Default Payable Account (optional)

3. ⚡ Optional Sections (Collapsible accordions - can be added later)
   - Primary Contact (collapsed by default)
   - Identification/Light KYC (collapsed by default)
   - Registered Address (collapsed by default)

### System Defaults (Auto-set)
```javascript
status = 'ACTIVE'
is_group = 0
parent_entity_id = null
category.is_active = 1
category.effective_from = today
```

### Pros
- ✅ Fast vendor onboarding (3 fields minimum)
- ✅ Vendors immediately usable in procurement
- ✅ Optional fields can be added later
- ✅ Less intimidating for users
- ✅ Progressive data capture
- ✅ Vendors grouped by category in list view

### Cons
- Incomplete vendor profiles initially
- May need follow-up for compliance data
- Less data validation upfront

---

## Key Differences Table

| Feature | Master Data Settings | Procurement (V1 MVP) |
|---------|---------------------|---------------------|
| **Required Fields** | 15+ fields | 3 fields only |
| **Registration Time** | 5-10 minutes | 1-2 minutes |
| **Form Layout** | Linear, all visible | Progressive with accordions |
| **Contact Info** | Required upfront | Optional (collapsible) |
| **KYC/Identity** | Required upfront | Optional (collapsible) |
| **Address** | Required upfront | Optional (collapsible) |
| **Use Case** | Complete vendor master setup | Quick procurement vendor add |
| **Data Completion** | 100% at registration | ~30% at registration, grow over time |
| **User Experience** | Comprehensive but slower | Fast but minimal |
| **Grouping** | Standard table | Grouped by vendor category |

---

## When to Use Which?

### Use Master Data Settings Version When:
- Setting up vendor master data
- Compliance/audit requirements need complete profiles
- You have time for thorough onboarding
- Vendor will be used across multiple modules
- Financial controls require complete information

### Use Procurement V1 MVP Version When:
- Need to add vendors quickly during procurement
- Vendor is needed immediately for a purchase
- Can gather additional info later
- Procurement team needs autonomy
- Want to reduce data entry barriers
- Progressive data capture is acceptable

---

## Technical Implementation

### Both Use Same Backend
- Same Pinia store: `useVendorStore`
- Same API endpoints
- Same database tables:
  - `entities`
  - `entity_categories`
  - `contacts` (optional)
  - `identities` (optional)
  - `addresses` (optional)

### Payload Structure (V1 MVP)
```javascript
{
  // Minimal required payload
  type: 'COMPANY',              // Required
  name: 'Vendor Name',          // Required
  trading_name: null,           // Optional
  country_id: null,             // Optional
  base_currency_id: null,       // Optional
  code: null,                   // Auto-generated
  notes: null,                  // Optional
  status: 'ACTIVE',             // Default
  is_group: 0,                  // Default
  parent_entity_id: null,       // Default
  
  // Category (Required)
  categories: [{
    category_id: 123,           // Required
    default_payable_account_id: null, // Optional
    is_active: 1,               // Default
    effective_from: '2026-01-27' // Auto
  }],
  
  // Optional sections (only included if filled)
  contacts: [...],              // Optional
  identities: [...],            // Optional
  addresses: [...]              // Optional
}
```

---

## Recommendations

### Short Term
- ✅ Use **Procurement V1 MVP** for day-to-day procurement operations
- ✅ Use **Master Data Settings** for formal vendor onboarding & compliance

### Long Term
- Add vendor data completion indicator (e.g., 30%, 70%, 100%)
- Create a "Complete Vendor Profile" workflow
- Add validation rules based on business requirements
- Consider vendor approval workflows
- Implement vendor classification (critical, regular, one-time)

---

## Access & Permissions
- **Master Data:** `CAN_VIEW_MODULE_SETTINGS`
- **Procurement:** `CAN_VIEW_PROCUREMENT`

Both can coexist in the system, serving different use cases!

---

## Summary
The **V1 MVP Procurement version** follows modern UX best practices:
1. **Reduce friction** - minimize required fields
2. **Progressive disclosure** - optional sections collapsed
3. **Quick wins** - vendors usable immediately
4. **Flexibility** - complete profile later

This approach balances **speed vs. completeness**, letting procurement teams move fast while maintaining the option for full data capture when needed.
