# Quick Start: Using the Order Wizard

## 🚀 TL;DR - Get Started in 2 Minutes

### Step 1: Load the Wizard
```
1. Go to: http://localhost:8000/#/orders
2. Click: "Create Order" button (blue button with + icon)
3. You should see: "Create New Order" page with 8 steps
```

### Step 2: Fill the Wizard
```
Step 1: Order Details
  ├─ Order Number: Enter a unique number (e.g., "ORD-2025-001")
  ├─ Order Type: Select from dropdown (SALES, PURCHASE, TRANSFER)
  ├─ Status: Select from dropdown (default DRAFT)
  ├─ Order Date: Pick a date
  ├─ Currency: Select currency
  └─ Click: "Next >"

Step 2: Party Management
  ├─ Role: Select role (CUSTOMER, SUPPLIER, AGENT)
  ├─ Entity: Enter company name
  ├─ Contact: Enter contact person name
  ├─ Click: "Add Party" to add more
  └─ Click: "Next >"

Step 3: Item Selection
  ├─ Item Name: Enter item name
  ├─ Category: Enter category
  ├─ Unit Price: Enter price
  ├─ Quantity: Enter quantity
  ├─ Rate: Enter rate (auto-calculated)
  └─ Click: "Next >"

Step 4: Logistics (OPTIONAL)
  ├─ Hotels: Enter location, dates, rooms
  ├─ Flights: Enter airports, date, seats
  ├─ Transfers: Enter pickup/dropoff, date, vehicle
  └─ Click: "Next >"

Step 5: Participants (OPTIONAL)
  ├─ Click +/- buttons to set:
  │  ├─ Hunters count
  │  ├─ Observers count
  │  └─ Companions count
  ├─ Guides auto-calculate (1 per 2 hunters)
  └─ Click: "Next >"

Step 6: Payment Terms (OPTIONAL)
  ├─ Set number of installments
  ├─ Fill amount, due date, payment method for each
  └─ Click: "Next >"

Step 7: Preferences (OPTIONAL)
  ├─ Select allergies (multi-select)
  ├─ Select dietary preference
  ├─ Check activity preferences
  ├─ Enter special notes
  └─ Click: "Next >"

Step 8: Review
  ├─ Review all entered data
  ├─ Click "Edit Step X" if you need to change anything
  └─ Click: "Create Order" button
```

### Step 3: See Results
```
Success: "Order created successfully" message appears
         Browser redirects to: /orders/{id}/view
         Order details page loads with your new order
```

---

## 📝 Example: Creating a Safari Order

### Data to Enter

**Step 1: Order Details**
```
Order Number: ORD-2025-SAFARI-001
Order Type: SALES
Status: DRAFT
Order Date: 2025-02-01
Currency: USD (or whatever currency)
```

**Step 2: Parties**
```
Party 1:
  Role: CUSTOMER
  Entity: John Smith Safari Adventures
  Contact: John Smith

Party 2:
  Role: SUPPLIER
  Entity: Serengeti Bush Camp
  Contact: Manager
```

**Step 3: Items**
```
Item 1:
  Item Name: 7-Day Safari Package
  Category: EQUIPMENT
  Unit Price: 100
  Quantity: 10
  Rate: 120

Item 2:
  Item Name: Accommodation - Luxury Lodge
  Category: ACCOMMODATION
  Unit Price: 50
  Quantity: 70
  Rate: 60
```

**Step 4: Logistics** (Fill this in for a safari)
```
Hotels:
  Location: Serengeti
  Check-in: 2025-02-01
  Nights: 7
  Rooms: 10

Charter Flights:
  From: JRO (Kilimanjaro)
  To: ARS (Arusha)
  Date: 2025-02-01
  Seats: 20

Ground Transfers:
  From: Airport
  To: Safari Lodge
  Date: 2025-02-01
  Vehicle: SUV
```

**Step 5: Participants**
```
Hunters: 5 (click + button 5 times)
Observers: 3 (click + button 3 times)
Guides: 3 (auto-calculated from 5 hunters ÷ 2)
Companions: 2 (click + button 2 times)
Total: 13 participants
```

**Step 6: Payment Terms**
```
Number of Installments: 3

Installment 1:
  Amount: 4000
  Due Date: 2025-02-01
  Payment Method: BANK_TRANSFER

Installment 2:
  Amount: 4000
  Due Date: 2025-02-15
  Payment Method: BANK_TRANSFER

Installment 3:
  Amount: 4000
  Due Date: 2025-03-01
  Payment Method: BANK_TRANSFER
```

**Step 7: Preferences**
```
Allergies: SHELLFISH, DAIRY (select multiple)
Dietary: VEGETARIAN
Activity Preferences: 
  ☑ Early morning drives
  ☑ Photography focus
  ☑ Bird watching
Special Notes: 
"VIP group. Extra guides appreciated. 
Early morning drives preferred. 
One guest has mobility concerns - 
please arrange accessible accommodations."
```

**Step 8: Review**
- All data is shown
- Verify everything is correct
- Click "Create Order"

---

## ❓ FAQ

### Q: What if I make a mistake on a step?
**A**: Click the step number at the top to go back and edit it.

### Q: Which steps are required?
**A**: Steps 1, 2, and 3 are required. Steps 4-7 are optional but recommended.

### Q: What happens if a required field is missing?
**A**: You'll see a toast message saying "Please fill [field name]" and can't go to next step.

### Q: Can I edit the order after creating it?
**A**: Yes! Click the order in the list, then click "Edit" button. The edit page uses a different interface (tabs instead of wizard).

### Q: Where is the order saved?
**A**: In your database. After successful creation, you're redirected to the detail page showing the saved order.

### Q: Can I delete an order?
**A**: Yes! Go to Orders list, find the order, and click the trash icon.

### Q: How do I know if the order was saved?
**A**: 
1. You see the success message
2. You're redirected to the detail page
3. The order appears in the Orders list

### Q: What if I close the browser before submitting?
**A**: All data is lost. The order was not created.

### Q: Can I save as draft and come back later?
**A**: Not with the current wizard (all-or-nothing submission). You could add a save-draft feature in the future.

### Q: Are there any limits to number of items/parties?
**A**: No hard limits in the UI. Backend may have limits - check with your admin.

### Q: Can I use the same wizard for multiple orders?
**A**: Yes! After creating one order, you're shown the list. Click "Create Order" again for a new one.

---

## 🔧 Troubleshooting

### Problem: "Create Order" button doesn't show
**Solution**:
- Make sure you're on the Orders list page (/orders)
- Refresh the page (Ctrl+F5)
- Check browser console (F12) for errors

### Problem: Wizard doesn't load
**Solution**:
- Check URL - should be http://localhost:8000/#/orders/create
- Refresh page (Ctrl+F5)
- Check console for errors
- Verify backend is running

### Problem: Can't click "Next" button
**Solution**:
- Fill all required fields on current step
- Wait for validation to pass
- Look for error message toast

### Problem: "Order created successfully" but no redirect
**Solution**:
- Check browser network tab for errors
- Check backend logs
- Try clicking "View Order" on the list
- Refresh Orders list (Ctrl+F5)

### Problem: Order doesn't appear in list after creation
**Solution**:
- Refresh Orders list (Ctrl+F5)
- Go back to /orders and check again
- Check if order was actually created (backend logs)

### Problem: Form fields are greyed out or disabled
**Solution**:
- Check if page is still loading (loading indicator at top)
- Check browser console for errors
- Try refreshing page

---

## 📱 On Mobile

The wizard works on mobile but is best viewed on desktop due to:
- Large form with many fields
- Tables that may scroll horizontally
- Step indicators spanning multiple rows

For mobile testing, use responsive mode (F12 → toggle device toolbar).

---

## 🎓 Learning Resources

### Understand the Structure
1. Read **ORDER_WIZARD_ARCHITECTURE_VISUAL.md** - See file structure and flow diagrams
2. Read **ORDER_WIZARD_IMPLEMENTED.md** - See what was actually built
3. Read **ORDER_WIZARD_DATA_FLOW.md** - Understand backend integration

### Customize for Your Needs
1. Edit **src/views/orders/OrderWizard.vue** to add/remove fields
2. Modify step validation in the `validateCurrentStep()` function
3. Change colors/styling in the `<style>` section
4. Add new steps by copying an existing step block

### Add Features
- Item search: Replace text input with autocomplete component
- Party search: Add modal to search contacts
- File upload: Add attachment fields in Step 7
- Email templates: Auto-generate email after creation
- Print preview: Add PDF preview before submit

---

## 💡 Pro Tips

1. **Use keyboard**: Tab through fields, Enter to submit forms

2. **Copy-paste**: Some fields (like notes) support pasting multi-line text

3. **Dates**: Click the date field to open a calendar picker

4. **Numbers**: Use decimal point for prices (e.g., 100.50)

5. **Party names**: Can be company name or full contact name

6. **Item categories**: Use consistent naming across orders for filtering

7. **Payment methods**: Choose the method actually used (affects accounting)

8. **Multiple orders**: The wizard resets after each creation, so you can create many orders sequentially

---

## 🎯 Next Steps

### After Creating Your First Order
- [ ] View order details
- [ ] Edit order (if needed)
- [ ] Filter orders by type/status
- [ ] Create another order
- [ ] Print order (if feature exists)
- [ ] Send order to supplier (if feature exists)

### If Something Doesn't Work
1. Check **ORDER_WIZARD_DATA_FLOW.md** - Backend requirements section
2. Verify all required database tables exist
3. Check backend logs for error messages
4. Ask for help with specific error message

---

## 📞 Getting Help

When reporting issues, provide:
1. What you were trying to do (specific step)
2. What happened (error message, or no response)
3. Browser console errors (F12 → Console)
4. Network tab errors (F12 → Network)
5. Backend logs if available

