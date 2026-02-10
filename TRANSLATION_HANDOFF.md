# NKH_WebApp Translation Handoff Summary

## Scope & Context
- Project root: `E:\promgramming\NKH_WebApp`
- Goal: eliminate all untranslated content across the project.
- Translation guide followed: `docs/TRANSLATION_GUIDE.md`
- Focus was on language resource parity between `lang/en.json` and `lang/km.json`, plus validation messages in `lang/*.php`.

## Tools & Environment Notes
- Sandbox is read-only, but `apply_patch` worked for edits.
- Large project scan via Python timed out; switched to chunked scanning approach.
- `rg --files -uu` used to list files (`storage/translation_scan_files.txt`).

## Key File Changes (Completed)

### 1. `lang/en/validation.php`
- Updated `attributes` array to include English labels (line numbers were around ~194+).
- Goal: ensure display names exist for validation messages.

### 2. `lang/km/validation.php`
Added missing validation keys and fixed a typo in `prohibited`:
- Added:
  - `can`, `contains`, `extensions`, `hex_color`, `list`,
  - `present_if`, `present_unless`, `present_with`, `present_with_all`,
  - `prohibited_if_accepted`, `prohibited_if_declined`, `prohibits`,
  - `required_if_accepted`, `required_if_declined`, `ulid`
- Fixed: typo in `prohibited`

### 3. `lang/km.json` — Large Khmer translations added
Added complete blocks for admin UI coverage:
- `admin.alerts`
- `admin.common`
- `admin.dashboard`
- `admin.emails.order_status`
- `admin.emails.receipt`
- `admin.expenses`
- `admin.finance`
- `admin.floors`
- `admin.hr` (employees, positions, roles, shifts)
- `admin.ingredients`
- `admin.inventory`
- `admin.invoices`
- `admin.locations`

### 4. `lang/km.json` — Added full `analytics` section
Added all missing keys under `analytics`, fully translated:
- `analytics.title`
- `analytics.sales` (stats, charts, empty states, presets)
- `analytics.audit` (filters, pagination, stats)
- `analytics.marketing` (promotions, loyalty)
- `analytics.system` (configuration, translations)

After this update:
- `lang/en.json` vs `lang/km.json` missing keys = 0

## Audits & Scans

### Missing key audit (en vs km)
- Command used (sample):
  - `python -X utf8` script to diff keys.
- Result after analytics block:
  - Missing keys = **0**

### Full translation scan attempt
- Full project scan with Python timed out repeatedly.
- Generated full file list via:
  - `rg --files -uu > storage/translation_scan_files.txt`
  - Total files listed: **78,698**
- Started chunked scan writing to:
  - `storage/translation_scan_state.json`
- Status after first 5,000 files:
  - Fully: 5
  - Partial: 146
  - Not translated: 2,891
  - Non-text: 1,958
  - This is only partial coverage and must continue to 78,698 files.

## Known Issues / Blockers
- Full translation scan is incomplete; must continue chunked scan.
- Large file base; scanning requires chunking and time.
- There is no `TASK_CONTEXT.md` in repo (searched).

## Current Status Snapshot
- Language JSON parity: **100% (en.json vs km.json)**
- Validation files aligned.
- Full project translation coverage is still incomplete; large number of files remain unverified. Scan completed with totals tracked in `storage/translation_scan_state.json`.

## Recent Progress (Post-Handoff)

### Scan State
- Scan completed across all files (index = 78,698). Current stats (from state file, confirmed Feb 5, 2026):
  - Fully: **43**
  - Partial: **895**
  - Not: **43,278**
  - Non-text: **34,482**

### Scan State (Snapshot Feb 5, 2026)
- Source: `storage/translation_scan_state.json`
- Totals (index = 78,698):
  - Fully: **43**
  - Partial: **895**
  - Not: **43,278**
  - Non-text: **34,482**

### Employee Pages Updated
- `resources/js/Pages/Employee/Settings/NotificationPreferences.tsx` localized.
- `resources/js/Pages/Employee/POS.tsx` localized and status labels mapped; added `employee.pos.*`.
- `resources/js/Pages/Employee/KitchenDisplay.tsx` localized; added `employee.kitchen.*`.
- `resources/js/Pages/Employee/CashPayments.tsx` localized via `CashPaymentQueue`.
- `resources/js/app/components/payment/CashPaymentQueue.tsx` localized; added `employee.cash.*`.
- `resources/js/Pages/Employee/Settings/SecuritySettings.tsx` localized; added `employee.security.*`.
- `resources/js/Pages/Employee/components/MyRequestsTab.tsx` localized shift-swap UI; added `employee.schedule.swap.*` keys and `employee.common.na`.
- `resources/js/Pages/Employee/DriverMapView.tsx` localized driver map UI (filters, alerts, legend, detail panel, actions) and added `employee.delivery.map.*`, `employee.delivery.messages.*`, confirm strings, plus `employee.common.currency_symbol`.
- `resources/js/Pages/Employee/Schedule.tsx` updated date formatting to use `locale` directly (removed hardcoded `en-US` fallback).
- `resources/js/Pages/Employee/Dashboard.tsx` updated date formatting to use `locale` directly (removed hardcoded `en-US`).
- `resources/js/Pages/Employee/HelpSupport.tsx` localized ticket list labels (category/status/priority) and added `employee.help.priority_short.*` + `employee.help.status.*`.
- `resources/js/Pages/Employee/DeliveryOrders.tsx` replaced hardcoded currency symbols and time formatting with `employee.common.currency_symbol` and `locale`.
- `resources/js/Pages/Employee/POS.tsx` replaced hardcoded currency symbols and time formatting with `employee.common.currency_symbol` and `locale`.
- `resources/js/Pages/Employee/POS.tsx` localized remaining error strings (held orders load + no table selected); added `employee.pos.messages.load_held_failed` and `employee.pos.messages.no_table_selected`.
- `resources/js/Pages/Employee/KitchenDisplay.tsx` replaced hardcoded currency symbol with `employee.common.currency_symbol`.
- Other Employee screens already localized earlier: `Dashboard`, `Notifications`, `Schedule`, `Performance`, `TimeClock`, `DeliveryOrders`, `HelpSupport`, `Feedback`, `Settings`, etc.

### Customer Pages Updated
- `resources/js/Pages/Customer/Home.tsx` toast localized; added `menu.added_to_cart`.
- `resources/js/Pages/Customer/Menu.tsx` localized remaining UI strings; added `menu.favorite_error`, `menu.page_title`, `menu.page_desc`, `menu.search_filter`.
- `resources/js/Pages/Customer/Cart.tsx` localized mobile “Items” header.
- `resources/js/Pages/Customer/Checkout.tsx` localized remaining hardcoded labels; added `checkout.table_fallback`, `checkout.floor_fallback`, `checkout.details`.
- `resources/js/Pages/Customer/Orders.tsx` localized remaining hardcoded strings; added `customer_pages.orders.order_card.preview_alt`, `customer_pages.orders.cancel_modal.error`, `customer_pages.orders.reorder_modal.adding`, `customer_pages.orders.reorder_modal.error`.
- `resources/js/Pages/Customer/Payment.tsx` localized remaining hardcoded strings; added `payment.simulated_failure_reason`, `payment.fallbacks.order_number`, `payment.messages.unknown_error`.
- `resources/js/Pages/Customer/Profile.tsx` localized remaining hardcoded strings; added `profile.meta_title_suffix`, `profile.fallbacks.title`, `profile.addresses.default_country`, `profile.messages.geocoding_failed`.
- `resources/js/Pages/Customer/Dashboard.tsx` localized remaining hardcoded strings; added `customer_pages.dashboard.meta_title_suffix`, `customer_pages.dashboard.guest`, `customer_pages.dashboard.messages.*`, `customer_pages.dashboard.rewards_modal.redeem_error`.
- `resources/js/Pages/admin/Dashboard.tsx` localized remaining hardcoded strings; added `admin.dashboard.title`, `admin.dashboard.fallbacks.user_name`, `admin.dashboard.tasks.order_prefix`, `admin.dashboard.tasks.table_prefix`.
- `resources/js/Pages/admin/Orders.tsx` localized remaining hardcoded strings (toasts, search fallback, modal labels/actions, payment status, special instructions, items header, per-item “each”, guest initial); added `admin.orders.messages.*`, `admin.orders.modal.*`.
- `resources/js/Pages/admin/Units.tsx` localized toasts, confirm, search placeholder, loading text, and form placeholders; added `admin.units.search_placeholder`, `admin.units.loading`, `admin.units.placeholders.*`.

### Layouts Updated (Both Layout Folders)
- `resources/js/Layouts/AuthenticatedLayout.tsx` logo alt localized.
- `resources/js/Layouts/RestaurantLayout.tsx` localized portal label, user info placeholders, and logo alt; added `layout.restaurant.*`.
- `resources/js/Layouts/MainLayout.tsx` and `resources/js/Layouts/GuestLayout.tsx` confirmed no hardcoded UI; marked fully.
- `resources/js/app/layouts/CustomerLayout.tsx` localized fallback user name + button titles and logo alt.
- `resources/js/app/layouts/EmployeeLayout.tsx` localized navigation labels, portal text, footer, greetings, and badges; added `layout.employee.*`.
- `resources/js/app/layouts/AdminLayout.tsx` localized navigation tree, page titles, portal labels, theme toggle titles, and date formatting; added `layout.admin.*`.
- `resources/js/app/layouts/TableLayout.tsx` localized table nav labels and title; added `layout.table_brand`, `layout.table_label`, `layout.table_nav.*`.

### Translation Key Additions (Highlights)
- `employee.notification_preferences.*`
- `employee.pos.*`
- `employee.kitchen.*`
- `employee.cash.*`
- `employee.security.*`
- `menu.added_to_cart`, `menu.favorite_error`, `menu.page_title`, `menu.page_desc`, `menu.search_filter`
- `checkout.table_fallback`, `checkout.floor_fallback`, `checkout.details`
- `layout.nav.user_fallback`, `layout.nav.search_title`, `layout.nav.profile_title`
- `layout.employee.*`, `layout.admin.*`, `layout.restaurant.*`, `layout.table_brand`, `layout.table_label`, `layout.table_nav.*`
- `customer_pages.orders.order_card.preview_alt`, `customer_pages.orders.cancel_modal.error`, `customer_pages.orders.reorder_modal.adding`, `customer_pages.orders.reorder_modal.error`
- `payment.simulated_failure_reason`, `payment.fallbacks.order_number`, `payment.messages.unknown_error`
- `profile.meta_title_suffix`, `profile.fallbacks.title`, `profile.addresses.default_country`, `profile.messages.geocoding_failed`
- `customer_pages.dashboard.meta_title_suffix`, `customer_pages.dashboard.guest`, `customer_pages.dashboard.messages.cancel_reservation_confirm`, `customer_pages.dashboard.messages.cancel_reservation_failed`, `customer_pages.dashboard.rewards_modal.redeem_error`
- `admin.dashboard.title`, `admin.dashboard.fallbacks.user_name`, `admin.dashboard.tasks.order_prefix`, `admin.dashboard.tasks.table_prefix`
- `admin.orders.messages.status_updated`, `admin.orders.messages.payment_updated`, `admin.orders.messages.update_failed`
- `admin.orders.modal.items_title`, `admin.orders.modal.each`, `admin.orders.modal.instructions_title`, `admin.orders.modal.actions.*`
- `admin.units.search_placeholder`, `admin.units.loading`, `admin.units.placeholders.*`

### Scan State Notes
- Scanner does not detect `t(...)` inside TSX files reliably; many TSX files remain marked `not` even after localization. Keep this in mind when using scan results to drive work.

### Admin Pages Updated (Latest)
- `resources/js/Pages/admin/Suppliers.tsx` localized phone/email fallbacks; replaced hardcoded `'-'` with `admin.common.na`.

### Admin Components Updated
- `resources/js/app/components/admin/EmployeeScheduler.tsx` localized scheduler UI; added `admin.employee_scheduler.*`.
- `resources/js/app/components/admin/NotificationCenter.tsx` localized notification panel UI; added `admin.notification_center.*`.
- `resources/js/app/components/admin/RefundManagement.tsx` localized refund management UI; added `admin.refunds.*`.
- `resources/js/app/components/admin/RefundModal.tsx` localized refund request modal; added `admin.refunds.request_modal.*` and `admin.refunds.reasons.*`.

## Next Steps (Recommended)
1. Narrow focus to project-owned files:
   - Prioritize `resources/`, `app/`, `routes/`, `lang/`, `database/`, `config/`.
   - Deprioritize `node_modules/`, `vendor/`, `public/build/`, and `storage/framework/` items in scan results.
2. Use scan results to drive micro-tasks:
   - For each `not` or `partial` file in app-owned paths, replace hardcoded strings with i18n keys.
3. After each micro-task, refresh scan stats (or targeted scan) and update the snapshot section.

## Files Updated (Paths)
- `lang/en/validation.php`
- `lang/en.json`
- `lang/km/validation.php`
- `lang/km.json`
- `resources/js/Pages/admin/Orders.tsx`
- (Generated scan list) `storage/translation_scan_files.txt`
- (Partial scan state) `storage/translation_scan_state.json`
 - plus numerous localized TSX/Blade files; see “Recent Progress” section.
