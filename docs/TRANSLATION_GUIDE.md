# Translation System Guide

This project uses a unified translation architecture that combines database-driven content with file-based UI translations.

## 1. Architecture Overview

-   **Static UI Text** (Buttons, Labels, Placeholders) -> **JSON Files** (`lang/en.json`, `lang/km.json`).
-   **Dynamic Content** (Menu Items, Categories) -> **Database** (`translations` tables).
-   **System Messages** (Validation, Auth) -> **PHP Files** (`lang/xx/validation.php`).

## 2. Frontend Translations (React/Inertia)

We use a custom `useTranslation` hook that consumes JSON files injected via Inertia props.

### Usage
```tsx
import { useTranslation } from '@/app/hooks/useTranslation';

export default function MyComponent() {
    const { t, locale } = useTranslation();

    return (
        <div>
            <h1>{t('home.title')}</h1>
            <button>{t('common.save')}</button>
            
            {/* With Replacements */}
            <p>{t('menu.pagination.page_info', { current: '1', total: '10' })}</p>
        </div>
    );
}
```

### Adding New Keys
1.  Open `lang/en.json`.
2.  Add your key (nested structure supported).
3.  Open `lang/km.json`.
4.  Add the same key with Khmer translation.

## 3. Backend Translations (Dynamic Content)

Content like Menu Items and Categories are stored in the database.

### Database Structure
-   `menu_items` table (base data)
-   `menu_item_translations` table (`menu_item_id`, `locale`, `name`, `description`)

### API Resources
The API automatically resolves translations based on the current locale.
```php
// MenuItemResource.php
'name' => $this->translations->firstWhere('locale', app()->getLocale())?->name ?? $this->name,
```

To add a new translatable model:
1.  Create a `_translations` table.
2.  Add `HasMany` relation in the model.
3.  Update the Resource to fetch the correct translation.

## 4. System Messages (Backend Validation)

Validation messages are stored in `lang/en/validation.php` and `lang/km/validation.php`.
To customize a validation error, edit these files.

## 5. Switch Language

The language switcher calls the `SetLocale` middleware.
```tsx
const { setLocale } = useTranslation();
<button onClick={() => setLocale('km')}>Khmer</button>
```
