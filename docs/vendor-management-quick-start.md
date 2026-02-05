# Vendor Management V1 MVP - Quick Start Guide

## 📍 Navigation

### Access the Feature
1. **Sidebar Menu** → Procurement → Vendor Management
2. **Direct URL:** `/procurement/vendors`

---

## 🚀 Key Features

### 1. **Minimal Registration (3 Required Fields Only)**
Get vendors into the system in under 2 minutes!

**Required Fields:**
- ✅ Entity Type (Company or Individual)
- ✅ Vendor Name
- ✅ Vendor Category

**That's it!** Everything else is optional.

---

### 2. **Optional Fields Available**
Add these now or later:
- Trading Name
- Country
- Base Currency
- Notes

---

### 3. **Expandable Sections (Add Later)**
Click to expand and fill when ready:

📧 **Primary Contact** (Optional)
- Contact Person Name
- Phone Number
- Email Address

🪪 **Identification/Light KYC** (Optional)
- Identity Type
- Identity Number
- Issuing Country
- Issued Date
- Expiry Date
- Issuing Authority

📍 **Registered Address** (Optional)
- Address Line 1
- City
- Country

---

## ✨ Comparison with Master Data Settings

### Master Data Settings (`/module-settings/vendors`)
- ❌ 15+ required fields
- ❌ 5-10 minutes to complete
- ✅ Complete vendor profile immediately
- 👥 Best for: Formal onboarding, compliance needs

### Procurement V1 MVP (`/procurement/vendors`)
- ✅ 3 required fields
- ✅ 1-2 minutes to complete
- ✅ Progressive data entry
- 👥 Best for: Quick procurement needs, daily operations

---

## 📋 Workflow Examples

### Quick Vendor Registration
```
1. Click "Add New Vendor" button
2. Select Entity Type: "Company"
3. Enter Name: "ABC Supplies Ltd"
4. Select Vendor Category: "Office Supplies"
5. Click "Register Vendor"
✅ Done! Vendor is now available for purchase orders
```

### Complete Vendor Profile Later
```
1. Find vendor in list
2. Click "Edit" button
3. Expand "Primary Contact" accordion
4. Fill contact details
5. Expand "Identification" accordion
6. Fill KYC information
7. Click "Update Vendor"
✅ Vendor profile enhanced with additional info
```

---

## 🎯 Benefits

### For Procurement Team
- ⚡ Fast vendor onboarding
- 🔄 No bottlenecks waiting for complete info
- 📦 Immediately usable for purchases
- 📊 Vendors grouped by category

### For System Admins
- ✅ Same backend as Master Data Settings
- 🔒 Permission-based access
- 📈 Progressive data quality improvement
- 🔍 Easy to identify incomplete profiles (future feature)

---

## 🔐 Permissions
**Required:** `CAN_VIEW_PROCUREMENT`

---

## 💡 Pro Tips

1. **Use categories wisely** - They group vendors in the list view
2. **Fill Entity Code** - Leave blank, system auto-generates
3. **Collapsed sections** - Only expand if you have the info
4. **Edit anytime** - Come back and complete profile later
5. **Both systems work** - Use both Master Data & Procurement versions as needed!

---

## 🐛 Troubleshooting

**Q: I can't see "Vendor Management" under Procurement?**  
A: Check if you have `CAN_VIEW_PROCUREMENT` permission

**Q: What's the difference from `/module-settings/vendors`?**  
A: See the full comparison document: `docs/vendor-management-comparison.md`

**Q: Can I use both vendor management screens?**  
A: Yes! They use the same database. Use Procurement for speed, Master Data for completeness.

**Q: Vendor not showing in list?**  
A: Check if category is set correctly and vendor status is ACTIVE

---

## 📊 Database Tables Used

✅ `entities` - Main vendor data  
✅ `entity_categories` - Category assignment  
⚡ `contacts` - Contact info (optional)  
⚡ `identities` - KYC data (optional)  
⚡ `addresses` - Address info (optional)  

---

## 🚀 Next Steps

After creating this V1 MVP, consider:
- [ ] Add vendor data completion indicator
- [ ] Create "Complete Profile" workflow
- [ ] Add vendor approval process
- [ ] Implement vendor rating/scoring
- [ ] Add vendor performance tracking

---

**Created:** January 27, 2026  
**Version:** 1.0 MVP  
**Status:** Production Ready ✅
