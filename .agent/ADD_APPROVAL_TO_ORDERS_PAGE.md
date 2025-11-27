# 🎯 SIMPLE GUIDE: Add Approval to Your Existing Orders Page

## ✅ **What You Have Now**

- ✅ API endpoints working: `/api/admin/orders/pending-approval`, `/approve`, `/reject`
- ✅ Order model has helper methods
- ✅ Database consolidated
- ✅ CustomerRequests module deleted

## 🎯 **What You Need to Do**

**Add approval functionality to your EXISTING** `resources/js/Pages/admin/Orders.tsx` page.

---

## 📝 **Step-by-Step Implementation**

### **Step 1: Add Filter State**

In your `admin/Orders.tsx`, add a state for filtering:

```typescript
const [filter, setFilter] = useState<'all' | 'pending'>('all');
```

### **Step 2: Update Fetch Logic**

Change your fetch to use different endpoints based on filter:

```typescript
const fetchOrders = async () => {
  const endpoint = filter === 'pending'
    ? '/api/admin/orders/pending-approval'
    : '/api/admin/orders';
  
  const response = await fetch(endpoint);
  const data = await response.json();
  setOrders(data.data);
};

// Re-fetch when filter changes
useEffect(() => {
  fetchOrders();
}, [filter]);
```

### **Step 3: Add Filter Buttons to UI**

Add these buttons above your orders table:

```typescript
<div className="mb-4 flex gap-2">
  <button
    onClick={() => setFilter('all')}
    className={filter === 'all' ? 'btn-active' : 'btn'}
  >
    All Orders
  </button>
  <button
    onClick={() => setFilter('pending')}
    className={filter === 'pending' ? 'btn-active' : 'btn'}
  >
    Pending Approval
  </button>
</div>
```

### **Step 4: Add Approve/Reject Actions**

In your table row (where you render each order), add:

```typescript
{order.approval_status === 'pending' && (
  <td className="px-4 py-2">
    <button
      onClick={() => handleApprove(order.id)}
      className="bg-green-500 text-white px-3 py-1 rounded mr-2"
    >
      ✓ Approve
    </button>
    <button
      onClick={() => handleReject(order.id)}
      className="bg-red-500 text-white px-3 py-1 rounded"
    >
      ✗ Reject
    </button>
  </td>
)}
```

### **Step 5: Implement Approve Handler**

```typescript
const handleApprove = async (orderId: number) => {
  if (!confirm('Approve this order?')) return;

  try {
    const response = await fetch(`/api/admin/orders/${orderId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
      },
    });

    if (response.ok) {
      alert('Order approved!');
      fetchOrders(); // Refresh list
    } else {
      alert('Failed to approve order');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error approving order');
  }
};
```

### **Step 6: Implement Reject Handler**

```typescript
const handleReject = async (orderId: number) => {
  const reason = prompt('Enter rejection reason (min 10 characters):');
  
  if (!reason || reason.length < 10) {
    alert('Rejection reason must be at least 10 characters');
    return;
  }

  try {
    const response = await fetch(`/api/admin/orders/${orderId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
      },
      body: JSON.stringify({ rejection_reason: reason }),
    });

    if (response.ok) {
      alert('Order rejected!');
      fetchOrders(); // Refresh list
    } else {
      alert('Failed to reject order');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error rejecting order');
  }
};
```

---

## 🎨 **Visual Enhancement (Optional)**

### Add Status Badges

```typescript
const getStatusBadge = (status: string) => {
  const badges = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${badges[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

// In your table:
<td>{getStatusBadge(order.approval_status)}</td>
```

---

## ✅ **That's It!**

You now have:
- ✅ Filter button to show pending orders
- ✅ Approve/reject buttons on pending orders
- ✅ Full approval workflow in your existing Orders page

---

## 🧪 **Test It**

1. Visit `/admin/orders`
2. Click "Pending Approval" filter
3. See only pending orders
4. Click "Approve" on an order → Order approved
5. Click "Reject" → Enter reason → Order rejected
6. Check that list refreshes

---

## 📞 **API Endpoints You're Using**

```
GET  /api/admin/orders/pending-approval   (for filter)
PATCH /api/admin/orders/{id}/approve      (for approve button)
PATCH /api/admin/orders/{id}/reject       (for reject button)
```

---

**That's all you need!** Everything else is already done. 🎉
