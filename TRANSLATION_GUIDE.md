# Translation Quick Reference Guide

## 🎯 How to Add Translations

### For Tooltip Titles (Buttons, Links)

```typescript
// 1. Import the hook
import { useLanguage } from '@/app/context/LanguageContext';

// 2. Use in your component
const YourComponent = () => {
  const { t } = useLanguage();
  
  return (
    <button title={t('common.actions.view')}>
      <Eye />
    </button>
  );
};
```

### Available Common Actions

All keys under `common.actions.*`:

```typescript
t('common.actions.view')                  // "View"
t('common.actions.edit')                  // "Edit"
t('common.actions.delete')                // "Delete"
t('common.actions.duplicate')             // "Duplicate"
t('common.actions.preview')               // "Preview"
t('common.actions.approve')               // "Approve"
t('common.actions.submit')                // "Submit"
t('common.actions.deactivate')            // "Deactivate"
t('common.actions.view_details')          // "View Details"
t('common.actions.receive_items')         // "Receive Items"
t('common.actions.costing')               // "Costing"
t('common.actions.view_qr_code')          // "View QR Code"
t('common.actions.view_audit_history')    // "View Audit History"
t('common.actions.toggle_featured')       // "Toggle Featured"
t('common.actions.popular_item')          // "Popular Item"
t('common.actions.mark_ordered')          // "Mark Ordered"
t('common.actions.submit_for_approval')   // "Submit for Approval"
// ... and more (see lang/en.json)
```

---

## 📝 Adding New Translation Keys

### Step 1: Add to English (`lang/en.json`)
```json
{
  "common": {
    "actions": {
      "your_new_action": "Your New Action"
    }
  }
}
```

### Step 2: Add to Khmer (`lang/km.json`)
```json
{
  "common": {
    "actions": {
      "your_new_action": "សកម្មភាពថ្មីរបស់អ្នក"
    }
  }
}
```

### Step 3: Use in Component
```typescript
title={t('common.actions.your_new_action')}
```

---

## 🎨 Translation Patterns

### Text Content
```typescript
<h1>{t('admin.dashboard.title')}</h1>
<p>{t('admin.dashboard.welcome_message')}</p>
```

### Button Labels
```typescript
<Button>{t('common.actions.save')}</Button>
```

### Tooltip Titles
```typescript
<button title={t('common.actions.edit')}>
  <Edit />
</button>
```

### Placeholders
```typescript
<Input placeholder={t('common.search_placeholder')} />
```

### With Replacements
```typescript
t('admin.users.welcome', { name: user.name })
// "Welcome, John!"
```

---

## 🚫 What NOT to Translate

### Component Props (Usually)
```typescript
// These are component props, not user-facing text
<Modal title="Add User" />        // Component internal
<StatCard title="Total" />        // Component internal
<iframe title="Map" />            // Accessibility (can translate if needed)
```

### Technical Identifiers
```typescript
// Don't translate
const API_KEY = "abc123";
const ROUTE_NAME = "/admin/users";
```

---

## ✅ Best Practices

1. **Always use translation keys** for user-facing text
2. **Check if key exists** before adding new ones
3. **Use snake_case** for key names
4. **Keep keys descriptive** (e.g., `view_details` not `vd`)
5. **Group related keys** under namespaces
6. **Update both languages** when adding keys
7. **Test in both languages** before deploying

---

## 🔍 Finding Translation Keys

### Search in Files
```bash
# Find all translation keys
grep -r "t('admin" lang/en.json

# Find specific namespace
grep -r "common.actions" lang/en.json
```

### Check Key Parity
```bash
# Run the sync script
python storage/sync_km_to_en.py
```

---

## 🌐 Language Switching

Users can switch languages via:
- Language selector in the UI
- User preferences
- Browser language detection (fallback)

Current supported languages:
- 🇬🇧 English (`en`)
- 🇰🇭 Khmer (`km`)

---

## 📚 File Locations

- **English Translations:** `lang/en.json`
- **Khmer Translations:** `lang/km.json`
- **Language Context:** `resources/js/app/context/LanguageContext.tsx`
- **Translation Hook:** Use `useLanguage()` hook

---

## 🐛 Troubleshooting

### Key Not Found
```typescript
// If you see: "admin.users.title"
// The key doesn't exist in the JSON file
// Add it to both en.json and km.json
```

### Translation Not Updating
```bash
# Clear cache
php artisan cache:clear
php artisan config:clear

# Restart dev server
npm run dev
```

### Missing Translation
```typescript
// If Khmer shows English text
// The key exists in en.json but not km.json
// Run sync script or add manually
```

---

## 📞 Need Help?

- Check `LOCALIZATION_COMPLETE.md` for full documentation
- Review existing patterns in the codebase
- Search for similar translations in `lang/en.json`

---

**Last Updated:** 2026-02-05  
**Status:** Production Ready ✅
