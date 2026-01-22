# Requisition Item-Level Approval Tracking - Frontend Guide

## Overview

This guide explains how to use the **Item Approval History** endpoint to track requisition approvals at the item level, showing which items were approved/rejected at each approval level and what changes were made.

---

## Endpoint

```
GET /api/v1.0/requisitions/{id}/item-approval-history
```

### Parameters
- `{id}` - The requisition ID

### Response
- **200 OK** - Success with approval history data
- **404 Not Found** - Requisition not found
- **400 Bad Request** - Error occurred

---

## Use Cases

### 1. **Show Approval Timeline with Item Changes**

Display a timeline showing what happened to each item at each approval level.

```javascript
async function fetchItemApprovalHistory(requisitionId) {
  const response = await fetch(`/api/v1.0/requisitions/${requisitionId}/item-approval-history`);
  const { data } = await response.json();
  
  return data;
}

// Display timeline
function renderApprovalTimeline(data) {
  const { items_history, summary } = data;
  
  console.log(`Requisition #${summary.requisition_id} - Status: ${summary.requisition_status}`);
  console.log(`Total Items: ${summary.total_items}`);
  console.log(`Approval Levels Completed: ${summary.total_approval_levels}`);
  
  items_history.forEach(item => {
    console.log(`\n--- Item #${item.item_id} ---`);
    
    item.approval_history.forEach(approval => {
      console.log(`Level ${approval.level_number} (${approval.level_name}):`);
      console.log(`  Status: ${approval.status}`);
      console.log(`  Approved by: ${approval.approved_by.name}`);
      console.log(`  Date: ${approval.date}`);
      console.log(`  Item included: ${approval.item_included ? 'Yes' : 'No'}`);
      
      if (approval.has_changes) {
        console.log(`  ⚠️ Changes made:`);
        approval.changes.forEach(change => {
          console.log(`    - ${change.field}: ${change.original} → ${change.modified}`);
        });
      }
    });
  });
}
```

### 2. **Highlight Items Modified During Approval**

Show which items were changed and by whom.

```javascript
function getModifiedItems(data) {
  const modified = [];
  
  data.items_history.forEach(item => {
    item.approval_history.forEach(approval => {
      if (approval.has_changes) {
        modified.push({
          itemId: item.item_id,
          level: approval.level_number,
          levelName: approval.level_name,
          approver: approval.approved_by.name,
          changes: approval.changes,
          date: approval.date
        });
      }
    });
  });
  
  return modified;
}

// Usage in React component
function ModifiedItemsBadge({ requisitionId }) {
  const [modifiedItems, setModifiedItems] = useState([]);
  
  useEffect(() => {
    fetchItemApprovalHistory(requisitionId).then(data => {
      setModifiedItems(getModifiedItems(data));
    });
  }, [requisitionId]);
  
  if (modifiedItems.length === 0) return null;
  
  return (
    <div className="alert alert-warning">
      <strong>{modifiedItems.length} item(s) were modified during approval:</strong>
      <ul>
        {modifiedItems.map((mod, idx) => (
          <li key={idx}>
            Item #{mod.itemId} modified at {mod.levelName} by {mod.approver}
            <ul>
              {mod.changes.map((change, i) => (
                <li key={i}>{change.field}: {change.original} → {change.modified}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. **Track Item Rejection Status**

Identify which items were rejected and at which level.

```javascript
function findRejectedItems(data) {
  const rejected = [];
  
  data.items_history.forEach(item => {
    item.approval_history.forEach(approval => {
      if (approval.status === 'REJECTED') {
        rejected.push({
          itemId: item.item_id,
          level: approval.level_number,
          levelName: approval.level_name,
          rejectedBy: approval.approved_by.name,
          reason: approval.remarks,
          date: approval.date,
          originalData: item.original_data
        });
      }
    });
  });
  
  return rejected;
}

// Display rejected items alert
function RejectedItemsAlert({ data }) {
  const rejectedItems = findRejectedItems(data);
  
  if (rejectedItems.length === 0) return null;
  
  return (
    <div className="alert alert-danger">
      <h4>⛔ Items Rejected</h4>
      {rejectedItems.map((item, idx) => (
        <div key={idx} className="mb-2">
          <strong>Item #{item.itemId}</strong> rejected at {item.levelName}
          <br />
          By: {item.rejectedBy} on {new Date(item.date).toLocaleDateString()}
          <br />
          Reason: {item.reason || 'No reason provided'}
        </div>
      ))}
    </div>
  );
}
```

### 4. **Compare Original vs Final Approved Data**

Show side-by-side comparison of original item data vs what was finally approved.

```javascript
function compareOriginalVsFinal(item) {
  const original = item.original_data;
  const lastApproval = item.approval_history[item.approval_history.length - 1];
  const final = lastApproval?.item_data || original;
  
  const comparison = {
    itemId: item.item_id,
    changes: []
  };
  
  // Compare discount
  if (original.discount_amount !== final.discount_amount) {
    comparison.changes.push({
      field: 'Discount Amount',
      original: original.discount_amount,
      final: final.discount_amount
    });
  }
  
  // Compare accounts
  if (original.accounts.length !== final.accounts.length) {
    comparison.changes.push({
      field: 'Account Allocations',
      original: `${original.accounts.length} account(s)`,
      final: `${final.accounts.length} account(s)`
    });
  }
  
  // Compare account amounts
  const originalTotal = original.accounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0);
  const finalTotal = final.accounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0);
  
  if (originalTotal !== finalTotal) {
    comparison.changes.push({
      field: 'Total Account Amount',
      original: originalTotal.toFixed(2),
      final: finalTotal.toFixed(2)
    });
  }
  
  return comparison;
}

// React Component
function OriginalVsFinalComparison({ itemHistory }) {
  const comparison = compareOriginalVsFinal(itemHistory);
  
  if (comparison.changes.length === 0) {
    return <span className="badge badge-success">No changes</span>;
  }
  
  return (
    <div className="comparison-table">
      <h5>Item #{comparison.itemId} - Changes Summary</h5>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Field</th>
            <th>Original</th>
            <th>Final Approved</th>
          </tr>
        </thead>
        <tbody>
          {comparison.changes.map((change, idx) => (
            <tr key={idx}>
              <td>{change.field}</td>
              <td>{change.original}</td>
              <td className="text-success">{change.final}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. **Next Approver Dashboard**

Show the next approver what has been approved/changed by previous levels.

```javascript
function NextApproverView({ requisitionId, currentUserLevel }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchItemApprovalHistory(requisitionId).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [requisitionId]);
  
  if (loading) return <div>Loading approval history...</div>;
  
  const previousLevels = history.summary.approval_chain_levels
    .filter(level => level.level_id < currentUserLevel);
  
  return (
    <div className="approval-dashboard">
      <h3>Previous Approvals</h3>
      
      {history.items_history.map(item => (
        <div key={item.item_id} className="card mb-3">
          <div className="card-header">
            <h5>Item #{item.item_id}</h5>
          </div>
          <div className="card-body">
            {item.approval_history.map(approval => (
              <div key={approval.approval_id} className="mb-3">
                <div className="d-flex justify-content-between">
                  <strong>Level {approval.level_number}: {approval.level_name}</strong>
                  <span className={`badge ${approval.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                    {approval.status}
                  </span>
                </div>
                
                <small className="text-muted">
                  {approval.approved_by.name} on {new Date(approval.date).toLocaleString()}
                </small>
                
                {approval.remarks && (
                  <div className="alert alert-info mt-2">
                    <strong>Remarks:</strong> {approval.remarks}
                  </div>
                )}
                
                {approval.has_changes && (
                  <div className="alert alert-warning mt-2">
                    <strong>⚠️ Changes Made:</strong>
                    <ul className="mb-0">
                      {approval.changes.map((change, idx) => (
                        <li key={idx}>
                          {change.field}: {change.original} → {change.modified}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {!approval.item_included && (
                  <div className="text-muted">
                    <em>Item was not reviewed at this level</em>
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-3">
              <button className="btn btn-primary" onClick={() => openItemDetails(item)}>
                View Current Item Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 6. **Account Allocation Changes Tracker**

Track changes to account allocations across approval levels.

```javascript
function trackAccountChanges(itemHistory) {
  const accountChanges = [];
  
  itemHistory.approval_history.forEach((approval, index) => {
    if (!approval.item_included) return;
    
    const previousData = index === 0 
      ? itemHistory.original_data 
      : itemHistory.approval_history[index - 1].item_data;
    
    const currentData = approval.item_data;
    
    // Compare accounts
    const prevAccounts = previousData.accounts.map(a => ({
      id: a.account_id,
      name: a.account_name,
      amount: parseFloat(a.amount)
    }));
    
    const currAccounts = currentData.accounts.map(a => ({
      id: a.account_id,
      name: a.account_name,
      amount: parseFloat(a.amount)
    }));
    
    // Find differences
    const added = currAccounts.filter(curr => 
      !prevAccounts.find(prev => prev.id === curr.id)
    );
    
    const removed = prevAccounts.filter(prev => 
      !currAccounts.find(curr => curr.id === prev.id)
    );
    
    const modified = currAccounts.filter(curr => {
      const prev = prevAccounts.find(p => p.id === curr.id);
      return prev && prev.amount !== curr.amount;
    });
    
    if (added.length > 0 || removed.length > 0 || modified.length > 0) {
      accountChanges.push({
        level: approval.level_number,
        levelName: approval.level_name,
        approver: approval.approved_by.name,
        added,
        removed,
        modified
      });
    }
  });
  
  return accountChanges;
}

// Display component
function AccountChangesView({ itemHistory }) {
  const changes = trackAccountChanges(itemHistory);
  
  if (changes.length === 0) {
    return <div className="text-success">✓ No account changes</div>;
  }
  
  return (
    <div className="account-changes">
      <h6>Account Allocation Changes</h6>
      {changes.map((change, idx) => (
        <div key={idx} className="mb-3 p-2 border-left border-warning">
          <strong>Level {change.level} ({change.levelName})</strong>
          <small className="text-muted d-block">by {change.approver}</small>
          
          {change.added.length > 0 && (
            <div className="text-success">
              ➕ Added: {change.added.map(a => `${a.name} (${a.amount})`).join(', ')}
            </div>
          )}
          
          {change.removed.length > 0 && (
            <div className="text-danger">
              ➖ Removed: {change.removed.map(a => `${a.name} (${a.amount})`).join(', ')}
            </div>
          )}
          
          {change.modified.length > 0 && (
            <div className="text-warning">
              ✏️ Modified: {change.modified.map(a => `${a.name} amount changed`).join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Response Structure Reference

```typescript
interface ItemApprovalHistoryResponse {
  success: boolean;
  data: {
    summary: {
      requisition_id: number;
      requisition_status: string;
      total_items: number;
      total_approval_levels: number;
      approval_chain_levels: Array<{
        level_id: number;
        role_name: string;
      }>;
    };
    items_history: Array<{
      item_id: number;
      original_data: ItemData;
      approval_history: Array<{
        approval_id: number;
        level_id: number;
        level_name: string;
        level_number: number;
        status: 'APPROVED' | 'REJECTED';
        approved_by: {
          id: number;
          name: string;
          username: string;
        };
        date: string;
        remarks: string;
        item_included: boolean;
        item_data: ItemData | null;
        has_changes: boolean;
        changes: Array<{
          field: string;
          original: any;
          modified: any;
          details?: string;
        }>;
      }>;
    }>;
  };
}

interface ItemData {
  currency_id: number;
  currency: {
    id: number;
    code: string;
    name: string;
  };
  discount_method: string;
  discount_amount: number;
  description: string;
  accounts: Array<AccountData>;
  materials: Array<MaterialData>;
}
```

---

## Best Practices

### 1. **Caching**
Cache the approval history data to avoid repeated API calls:

```javascript
const approvalHistoryCache = new Map();

async function getCachedApprovalHistory(requisitionId) {
  if (approvalHistoryCache.has(requisitionId)) {
    return approvalHistoryCache.get(requisitionId);
  }
  
  const data = await fetchItemApprovalHistory(requisitionId);
  approvalHistoryCache.set(requisitionId, data);
  return data;
}

// Clear cache when requisition is updated
function clearApprovalHistoryCache(requisitionId) {
  approvalHistoryCache.delete(requisitionId);
}
```

### 2. **Progressive Loading**
Load approval history only when needed:

```javascript
function ApprovalHistorySection({ requisitionId }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState(null);
  
  const loadHistory = async () => {
    if (!history) {
      const data = await fetchItemApprovalHistory(requisitionId);
      setHistory(data);
    }
    setExpanded(!expanded);
  };
  
  return (
    <div>
      <button onClick={loadHistory}>
        {expanded ? 'Hide' : 'Show'} Approval History
      </button>
      {expanded && history && <ApprovalHistoryView data={history} />}
    </div>
  );
}
```

### 3. **Error Handling**
Always handle errors gracefully:

```javascript
async function fetchItemApprovalHistory(requisitionId) {
  try {
    const response = await fetch(`/api/v1.0/requisitions/${requisitionId}/item-approval-history`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Requisition not found');
      }
      throw new Error('Failed to fetch approval history');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching approval history:', error);
    throw error;
  }
}
```

---

## Integration Tips

### With Approval Workflow
Combine with the approval endpoint to show context before approving:

```javascript
async function handleApprove(requisitionId, approvalData) {
  // First, show what was previously approved/changed
  const history = await fetchItemApprovalHistory(requisitionId);
  const hasChanges = history.items_history.some(item => 
    item.approval_history.some(a => a.has_changes)
  );
  
  if (hasChanges) {
    const confirmed = confirm('Previous levels made changes to items. Review before approving?');
    if (confirmed) {
      // Show modal with history
      showApprovalHistoryModal(history);
      return;
    }
  }
  
  // Proceed with approval
  await approveRequisition(requisitionId, approvalData);
}
```

### With Requisition Details
Add approval history tab to requisition details page:

```javascript
function RequisitionDetails({ requisitionId }) {
  const [activeTab, setActiveTab] = useState('details');
  
  return (
    <div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
             onClick={() => setActiveTab('details')}>
            Details
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
             onClick={() => setActiveTab('history')}>
            Approval History
          </a>
        </li>
      </ul>
      
      {activeTab === 'details' && <RequisitionDetailsTab id={requisitionId} />}
      {activeTab === 'history' && <ApprovalHistoryTab id={requisitionId} />}
    </div>
  );
}
```

---

## Summary

This endpoint provides complete visibility into the approval process at the item level, enabling:

- ✅ Track which items were approved/rejected at each level
- ✅ See what modifications were made during approval
- ✅ Compare original vs final approved data
- ✅ Provide context to next approvers
- ✅ Maintain complete audit trail
- ✅ Identify account allocation changes

Use it to build transparent, auditable approval workflows in your frontend application!
