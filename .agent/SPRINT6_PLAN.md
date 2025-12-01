# Sprint 6: Configuration & Access Control

## 🎯 Objective
Implement system administration tools for managing access control, business hours, system settings, and translations.

## 📋 Tasks

### 1. Roles & Permissions Management ⭐⭐⭐
- **Backend**:
  - Create `RoleController` (CRUD for roles)
  - Create `PermissionController` (CRUD for permissions)
  - Implement logic for assigning permissions to roles
  - Implement logic for assigning roles to users
- **Frontend**:
  - Create `admin/Roles.tsx` page
  - Create `RoleForm` component
  - Create `PermissionMatrix` component for easy assignment
  - Add "Users" tab to manage user roles

### 2. Operating Hours Management ⭐⭐
- **Backend**:
  - Create `OperatingHoursController`
  - Support multiple service types (Dine-in, Pickup, Delivery)
  - Validation for overlapping hours
- **Frontend**:
  - Create `admin/OperatingHours.tsx` page
  - Create `WeeklySchedule` component
  - Implement "Copy to all days" functionality

### 3. Enhanced Settings Management ⭐
- **Backend**:
  - Create `SettingsController`
  - Group settings by category (General, Order, Payment, etc.)
  - Support different value types (string, boolean, json)
- **Frontend**:
  - Create `admin/Settings.tsx` page
  - Create categorized tabs
  - Implement appropriate input types for settings

### 4. Translation Management ⭐
- **Backend**:
  - Create `TranslationController`
  - Support `category_translations` and `menu_item_translations`
- **Frontend**:
  - Create `admin/Translations.tsx` page
  - Side-by-side editor for languages

## 📅 Roadmap
1. **Step 1**: Roles & Permissions (Foundational)
2. **Step 2**: Operating Hours (Business Critical)
3. **Step 3**: Settings (Configuration)
4. **Step 4**: Translations (Content)

## 📝 Notes
- Use `spatie/laravel-permission` logic if available (tables seem custom but follow similar pattern).
- Ensure all forms use the new `DateRangePicker` style where applicable (e.g. audit logs if added).
- Maintain the high aesthetic standard set in Sprint 5.
