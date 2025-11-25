# 🧪 Testing Dynamic Data on Home Page

## ✅ Verify Data is Coming from Database

### **Test 1: Check Featured Items**
```bash
php artisan tinker --execute="
\App\Models\MenuItem::where('is_featured', true)->get(['id', 'slug', 'badge', 'featured_order'])->each(function(\$item) {
    echo 'ID: ' . \$item->id . ' | Slug: ' . \$item->slug . ' | Badge: ' . (\$item->badge ?? 'none') . ' | Order: ' . \$item->featured_order . PHP_EOL;
});
"
```

### **Test 2: Check Categories**
```bash
php artisan tinker --execute="
\App\Models\Category::where('is_active', true)->withCount('menuItems')->limit(6)->get(['id', 'slug'])->each(function(\$cat) {
    echo 'ID: ' . \$cat->id . ' | Slug: ' . \$cat->slug . ' | Items: ' . \$cat->menu_items_count . PHP_EOL;
});
"
```

---

## 🔄 Add/Remove Featured Items Dynamically

### **Mark an item as featured:**
```bash
php artisan tinker --execute="
\$item = \App\Models\MenuItem::find(YOUR_ITEM_ID);
\$item->is_featured = true;
\$item->featured_order = 4;
\$item->badge = 'New Arrival';
\$item->rating = 4.7;
\$item->reviews_count = 150;
\$item->save();
echo 'Item marked as featured!' . PHP_EOL;
"
```

### **Remove from featured:**
```bash
php artisan tinker --execute="
\$item = \App\Models\MenuItem::find(YOUR_ITEM_ID);
\$item->is_featured = false;
\$item->save();
echo 'Item removed from featured!' . PHP_EOL;
"
```

### **Clear cache to see changes:**
```bash
php artisan cache:forget homepage_data
```

---

## 🎯 Real-Time Testing

1. **Check current featured items:**
   ```bash
   php artisan tinker --execute="echo \App\Models\MenuItem::where('is_featured', true)->count() . ' featured items' . PHP_EOL;"
   ```

2. **Visit homepage** - You'll see those items

3. **Add a new featured item** (use command above)

4. **Clear cache:**
   ```bash
   php artisan cache:forget homepage_data
   ```

5. **Refresh homepage** - New item appears!

---

## 📊 View Raw Data Being Sent to Frontend

```bash
php artisan route:list --name=customer.home
```

Then in browser console (F12):
```javascript
console.log('Featured Items:', window.page.props.featuredItems);
console.log('Categories:', window.page.props.categories);
console.log('Testimonials:', window.page.props.testimonials);
console.log('Stats:', window.page.props.stats);
```

---

## 🔍 Database Direct Check

```sql
-- See all featured items
SELECT id, slug, badge, featured_order, rating, reviews_count 
FROM menu_items 
WHERE is_featured = 1 
ORDER BY featured_order;

-- See category counts
SELECT c.id, c.slug, COUNT(mi.id) as item_count
FROM categories c
LEFT JOIN menu_items mi ON mi.category_id = c.id AND mi.is_active = 1
WHERE c.is_active = 1
GROUP BY c.id
LIMIT 6;
```

---

## ✨ The Data Flow

```
Database (menu_items table)
    ↓
HomeController::getFeaturedItems() [queries WHERE is_featured = true]
    ↓
MenuItemResource [formats data]
    ↓
Cache (5 minutes)
    ↓
Inertia::render('Customer/Home', $data)
    ↓
Home.tsx receives props
    ↓
Renders on page
```

**Everything is 100% dynamic!** No hardcoded data in the frontend.

---

## 🚫 Common Mistakes

❌ **Don't do this:**
```typescript
// Hardcoded array - BAD!
const items = [
  { id: 1, name: 'Burger' },
  { id: 2, name: 'Pizza' }
];
```

✅ **We're doing this:**
```typescript
// Props from Inertia - GOOD!
export default function Home({ featuredItems }: HomeProps) {
  return featuredItems.map(item => ...)
}
```

Your Home page is **fully dynamic** from the backend! 🎉
