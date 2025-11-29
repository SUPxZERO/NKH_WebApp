# 📊 NKH Restaurant Admin Interface Redesign Plan

## 🎯 Project Goal
Create a complete, modern admin interface to achieve **full CRUD management** over the entire `nkh_restaurant.sql` database.

---

## 📋 Phase 1: Deep Database Schema Analysis

### Complete Table Overview (50 Tables Total)

#### **Core Business Entities** (9 tables)
1. **users** - User account management
2. **customers** - Customer profiles 
3. **employees** - Staff information
4. **locations** - Restaurant branch details
5. **menu_items** - Food & beverage items
6. **orders** - Customer orders
7. **reservations** - Table bookings
8. **suppliers** - Vendor information
9. **feedback** - Customer reviews

#### **Menu & Categorization** (5 tables)
10. **categories** - Menu categories (hierarchical with parent_id)
11. **category_translations** - Multi-language support for categories
12. **menu_item_translations** - Multi-language support for menu items
13. **recipes** - Recipe information for menu items
14. **recipe_ingredients** - Ingredients required for each recipe

#### **Inventory Management** (5 tables)
15. **ingredients** - Raw material inventory
16. **inventory_transactions** - Stock movement tracking
17. **purchase_orders** - Supplier orders
18. **purchase_order_items** - Line items in purchase orders
19. **units** - Measurement units for ingredients

#### **Financial Management** (7 tables)
20. **invoices** - Customer invoices
21. **payments** - Payment transactions
22. **payment_methods** - Available payment options
23. **expenses** - Business expenses
24. **expense_categories** - Expense categorization
25. **payrolls** - Employee salary payments
26. **loyalty_points** - Customer loyalty transactions

#### **Order Management** (4 tables)
27. **order_items** - Line items in customer orders
28. **order_time_slots** - Available pickup/delivery slots
29. **cart_items** - Customer shopping carts
30. **order_holds** - On-hold orders system

#### **Table & Floor Management** (2 tables)
31. **tables** - Restaurant tables
32. **floors** - Floor/seating area organization

#### **Employee Management** (7 tables)
33. **positions** - Job titles/roles
34. **shifts** - Employee work schedules
35. **attendances** - Clock-in/out records
36. **leave_requests** - Employee leave applications (deprecated - see time_off_requests)
37. **time_off_requests** - Modern time-off request system
38. **roles** - User role definitions
39. **permissions** - Permission definitions

#### **System Configuration** (6 tables)
40. **settings** - Application configuration (key-value, location-specific)
41. **operating_hours** - Business hours per service type
42. **promotions** - Discount & promotion campaigns
43. **customer_addresses** - Saved delivery addresses
44. **notifications** - System notifications
45. **audit_logs** - Activity logging

#### **Laravel Framework** (5 tables)
46. **migrations** - Database version control
47. **sessions** - User sessions
48. **cache** / **cache_locks** - Cache storage
49. **jobs** / **job_batches** - Queue management
50. **failed_jobs** - Failed background jobs
51. **password_reset_tokens** - Password reset functionality
52. **personal_access_tokens** - API authentication

#### **Linking/Junction Tables** (2 tables)
53. **role_user** - Many-to-many: users ↔ roles
54. **role_permission** - Many-to-many: roles ↔ permissions

---

## 🔍 Phase 2: Gap Analysis

### Currently Managed Entities (17/50 = 34%)
✅ **Fully Managed:**
1. Categories
2. Customers
3. Employees
4. Expenses
5. Floors
6. Inventory (Ingredients)
7. Invoices
8. Loyalty Points
9. Menu Items
10. Orders
11. Promotions
12. Reservations
13. Tables
14. Notifications (Read-only)
15. Audit Logs (Read-only)
16. Dashboard (Analytics)
17. Settings (Minimal)

---

### 🚨 UNMANAGED ENTITIES (33 Tables)

#### **High Priority - Core Business Operations** (13 tables)
1. **locations** ⭐⭐⭐
   - Missing: Complete CRUD management
   - Impact: Cannot manage multiple restaurant branches
   - Required Operations: C/R/U/D
   
2. **suppliers** ⭐⭐⭐
   - Missing: Complete CRUD management
   - Impact: Cannot manage vendor relationships
   - Required Operations: C/R/U/D

3. **purchase_orders** & **purchase_order_items** ⭐⭐⭐
   - Missing: Complete purchase order workflow
   - Impact: Cannot order stock from suppliers
   - Required Operations: C/R/U/D (with approval workflow)

4. **recipes** & **recipe_ingredients** ⭐⭐⭐
   - Missing: Recipe management and ingredient linkage
   - Impact: Cannot track what ingredients are needed per menu item
   - Required Operations: C/R/U/D

5. **order_items** ⭐⭐
   - Partially Managed: Visible in Orders page but no individual management
   - Missing: Individual item status tracking, kitchen display updates
   - Required Operations: R/U for status

6. **order_time_slots** ⭐⭐
   - Missing: Complete CRUD management
   - Impact: Cannot configure available pickup/delivery time slots
   - Required Operations: C/R/U/D

7. **payment_methods** ⭐⭐
   - Missing: Complete CRUD management
   - Impact: Cannot add/edit payment options
   - Required Operations: C/R/U/D

8. **payments** ⭐⭐
   - Missing: Complete payment tracking
   - Impact: Cannot view/manage individual payment transactions
   - Required Operations: C/R

9. **customer_addresses** ⭐⭐
   - Missing: Address management interface
   - Impact: Cannot view/edit customer saved addresses
   - Required Operations: R/U/D

10. **feedback** ⭐⭐
    - Missing: Complete review management
    - Impact: Cannot moderate/respond to customer reviews
    - Required Operations: R/U/D

11. **cart_items** ⭐
    - Missing: Active cart monitoring
    - Impact: Cannot see abandoned carts or assist customers
    - Required Operations: R/D

12. **units** ⭐⭐
    - Missing: Measurement unit management
    - Impact: Cannot add custom units for ingredients
    - Required Operations: C/R/U/D

13. **expense_categories** ⭐
    - Partially Managed: Used in Expenses page
    - Missing: Separate management interface
    - Required Operations: C/R/U/D

#### **Medium Priority - HR & Employee Management** (7 tables)
14. **positions** ⭐⭐
    - Missing: Job title/role management
    - Impact: Cannot add/edit employee positions
    - Required Operations: C/R/U/D

15. **shifts** ⭐⭐
    - Missing: Shift scheduling system
    - Impact: Cannot create/manage employee schedules
    - Required Operations: C/R/U/D

16. **attendances** ⭐⭐
    - Missing: Time tracking interface
    - Impact: Cannot view/edit clock-in/out records
    - Required Operations: R/U/D

17. **time_off_requests** ⭐⭐
    - Missing: Time-off approval system
    - Impact: Cannot manage employee time-off requests
    - Required Operations: R/U (Approve/Deny)

18. **leave_requests** ⭐
    - Deprecated: Replaced by time_off_requests
    - Required: Possible data migration interface

19. **payrolls** ⭐⭐
    - Missing: Payroll management system
    - Impact: Cannot track/manage employee payments
    - Required Operations: C/R/U

20. **roles** & **permissions** ⭐⭐⭐
    - Missing: Role-based access control management
    - Impact: Cannot customize user permissions
    - Required Operations: C/R/U/D

#### **Medium Priority - Configuration** (5 tables)
21. **operating_hours** ⭐⭐
    - Missing: Business hours configuration
    - Impact: Cannot set different hours per service type
    - Required Operations: C/R/U/D

22. **settings** ⭐
    - Partially Managed: Minimal interface exists
    - Missing: Comprehensive settings management
    - Required Operations: U (key-value editor)

23. **category_translations** & **menu_item_translations** ⭐
    - Missing: Translation management interface
    - Impact: Cannot manage multi-language content easily
    - Required Operations: C/R/U/D

24. **order_holds** ⭐
    - Missing: Hold order management (table appears empty/unused)
    - Required Operations: System design needed

#### **Low Priority - System/Framework** (8 tables)
25-32. **Laravel Framework Tables** ⭐
    - migrations, sessions, cache, cache_locks, jobs, job_batches, failed_jobs, password_reset_tokens, personal_access_tokens
    - Managed by: Framework automatically
    - Impact: System functionality only
    - Required: Read-only dashboards for monitoring

---

### ⚠️ PARTIAL MANAGEMENT ISSUES

#### **Orders Page**
- ✅ Can view orders
- ✅ Can update order status
- ❌ Cannot individually manage order_items status
- ❌ No kitchen display system integration
- ❌ No order time tracking visualization

#### **Settings Page**
- ✅ Basic structure exists
- ❌ Extremely minimal (239 bytes)
- ❌ No comprehensive configuration management

#### **Menu Items Page**
- ✅ Can view/edit menu items
- ❌ No recipe ingredient linkage visible
- ❌ No cost calculation from recipes

#### **Employees Page**
- ✅ Can manage employee profiles
- ❌ No shift scheduling
- ❌ No attendance tracking
- ❌ No payroll management

---

## ✏️ Phase 3: Redesign Execution Plan

### 📐 Design Specifications

#### **Architecture Principles**
1. **Single Page Application (SPA)** structure using React + TypeScript
2. **Consistent Component Library**: Reuse existing component patterns from current admin pages
3. **Responsive Design**: Mobile-first approach with tablet/desktop optimization
4. **Dark/Light Mode**: Support theme switching
5. **Real-time Updates**: WebSocket integration for live data (orders, reservations)
6. **Performance**: Implement pagination, lazy loading, and virtualization for large datasets

#### **UI/UX Standards**
- **Search/Filter/Sort** on ALL list views
- **Bulk actions** where applicable (multi-select + batch operations)
- **Export functionality** (CSV/PDF) for reports
- **Audit trail visibility** on critical data modifications
- **Inline editing** where possible to reduce clicks
- **Toast notifications** for user feedback
- **Loading states** and skeleton screens
- **Error boundaries** with graceful degradation

#### **Form Design**
- **Validation** with real-time feedback
- **Auto-save** drafts for complex forms
- **Multi-step wizards** for complex workflows (e.g., Purchase Orders)
- **Dropdown/Select fields** for ALL foreign key relationships
- **Date/Time pickers** with timezone awareness
- **Rich text editors** where descriptions are needed

---

### 🚀 Implementation Roadmap

#### **Sprint 1: Foundation & High-Impact Tables** (Week 1-2)
Priority: Core business operations that block daily work

**1.1 Locations Management** ⭐⭐⭐
- CRUD: locations
- Features:
  - Multiple branch management
  - Operating hours per location
  - Service type toggles (dine-in/pickup/delivery)
  - Active/inactive status
- FK Links: Default location for users, employees, orders

**1.2 Suppliers Management** ⭐⭐⭐
- CRUD: suppliers
- Features:
  - Contact information management
  - Payment terms tracking
  - Active/inactive suppliers
  - Filter by supplier type
- FK Links: purchase_orders

**1.3 Positions Management** ⭐⭐
- CRUD: positions
- Features:
  - Job title library
  - Description and requirements
  - Active/inactive positions
- FK Links: employees, shifts

**1.4 Units Management** ⭐⭐
- CRUD: units
- Features:
  - Base unit configuration
  - Conversion factors
  - Unit types (weight, volume, quantity, etc.)
- FK Links: ingredients, recipe_ingredients

---

#### **Sprint 2: Inventory & Procurement** (Week 3-4)
Priority: Complete inventory management workflow

**2.1 Purchase Orders Module** ⭐⭐⭐
- CRUD: purchase_orders, purchase_order_items
- Features:
  - Create PO with multiple line items
  - Supplier selection dropdown
  - Ingredient selection with current stock visibility
  - Status workflow (draft → submitted → partial → received → cancelled)
  - Receiving workflow (mark items received, adjust quantities)
  - Auto-generate inventory transactions on receive
- FK Links: suppliers, ingredients, locations, users

**2.2 Recipes & Recipe Ingredients** ⭐⭐⭐
- CRUD: recipes, recipe_ingredients
- Features:
  - Link menu items to recipes
  - Define ingredient quantities per recipe
  - Calculate recipe costs automatically
  - Yield portions configuration
  - Instructions editor
  - Ingredient availability checks
- FK Links: menu_items, ingredients

**2.3 Enhanced Inventory Transactions** ⭐⭐
- Expand existing Inventory page
- Add views for:
  - Transaction history with advanced filters
  - Stock level alerts (below reorder level)
  - Inventory valuation reports

---

#### **Sprint 3: Financial Management** (Week 5-6)
Priority: Complete financial tracking

**3.1 Payment Methods Management** ⭐⭐
- CRUD: payment_methods
- Features:
  - Payment type configuration
  - Processing fees
  - Display order
  - Active/inactive status
- FK Links: payments

**3.2 Payments Module** ⭐⭐
- CR: payments (payments are usually created automatically, not manually)
- Features:
  - View all payment transactions
  - Link to invoices
  - Filter by status, payment method, date range
  - Transaction logs
  - Export reports
- FK Links: invoices, payment_methods

**3.3 Expense Categories Management** ⭐
- CRUD: expense_categories
- Features:
  - Separate management (currently embedded in Expenses)
  - Location-specific categories
  - Active/inactive status
- FK Links: expenses

**3.4 Payroll Module** ⭐⭐
- CRUD: payrolls
- Features:
  - Calculate payroll by employee and period
  - Gross pay, bonuses, deductions tracking
  - Payment status workflow
  - Export payroll reports
  - Integration with attendances for hourly calculations
- FK Links: employees

---

#### **Sprint 4: HR & Scheduling** (Week 7-8)
Priority: Employee management tools

**4.1 Shift Scheduling System** ⭐⭐
- CRUD: shifts
- Features:
  - Calendar view of shifts
  - Drag-and-drop scheduling
  - Employee assignment
  - Position-based shift creation
  - Shift status tracking (scheduled/completed/cancelled/no_show)
  - Conflict detection (double-booking)
  - Export schedules (PDF/email to employees)
- FK Links: employees, positions, locations

**4.2 Attendance Tracking** ⭐⭐
- RUD: attendances (Create happens via clock-in system)
- Features:
  - Clock-in/out records view
  - Edit incomplete records
  - Notes on attendance issues
  - Reports: hours worked by employee/period
  - Integration with payroll calculation
- FK Links: employees, locations

**4.3 Time-Off Request Management** ⭐⭐
- RU: time_off_requests (employees create, admins approve/deny)
- Features:
  - Pending requests dashboard
  - Approval workflow with admin notes
  - Calendar view of approved time-off
  - Conflict checking with shifts
  - Email notifications on approval/denial
- FK Links: employees, users (approved_by)

**4.4 Leave Requests Migration** ⭐
- One-time tool: Migrate data from deprecated leave_requests → time_off_requests
- Archive old table

---

#### **Sprint 5: Order & Customer Experience** (Week 9-10)
Priority: Enhanced order management and customer tools

**5.1 Order Items Status Management** ⭐⭐
- RU: order_items
- Features:
  - Kitchen Display System (KDS) view
  - Individual item status updates (pending/preparing/ready/served/cancelled)
  - Special instructions visibility
  - Preparation time tracking
  - Integration with main Orders page
- FK Links: orders, menu_items

**5.2 Order Time Slots Management** ⭐⭐
- CRUD: order_time_slots
- Features:
  - Configure pickup/delivery time slots
  - Set max orders per slot
  - Track current bookings
  - Disable/enable slots dynamically
  - Slot type (pickup vs delivery)
- FK Links: locations, orders

**5.3 Shopping Cart Management** ⭐
- RD: cart_items (Read + optionally Delete for admin support)
- Features:
  - View active carts
  - Identify abandoned carts (old cart_items)
  - Clear carts for debugging
  - Customer support tool
- FK Links: customers, menu_items

**5.4 Customer Addresses Management** ⭐⭐
- RUD: customer_addresses (customers create, admins can view/edit/delete)
- Features:
  - View all customer addresses
  - Edit/delete for data cleanup
  - Map integration for GPS validation
  - Delivery zone assignment
- FK Links: customers, orders

**5.5 Feedback Management** ⭐⭐
- RUD: feedback (customers create, admins moderate)
- Features:
  - Review moderation (change visibility)
  - Respond to reviews (notes field)
  - Rating analytics
  - Filter by rating,visibility, date
  - Link to orders
- FK Links: customers, orders, locations

---

#### **Sprint 6: Configuration & Access Control** (Week 11-12)
Priority: System administration tools

**6.1 Operating Hours Management** ⭐⭐
- CRUD: operating_hours
- Features:
  - Configure hours per location, day of week, and service type
  - Multiple service types per day
  - Easy copy/paste for recurring schedules
  - Holiday/special hours override
- FK Links: locations

**6.2 Enhanced Settings Management** ⭐
- Update: settings
- Features:
  - Comprehensive settings UI
  - Grouped by category (General, Order, Payment, Notification, etc.)
  - Location-specific vs global settings
  - JSON value editor with validation
  - Export/import settings for backup
- FK Links: locations

**6.3 Roles & Permissions Management** ⭐⭐⭐
- CRUD: roles, permissions, role_permission, role_user
- Features:
  - Role creation with permission assignment
  - User role assignment
  - Permission matrix view
  - Predefined role templates (Admin, Manager, Staff, Customer)
  - Audit log for permission changes
- FK Links: users

**6.4 Translation Management** ⭐
- CRUD: category_translations, menu_item_translations
- Features:
  - Side-by-side translation editor (English + Khmer)
  - Missing translation detection
  - Bulk translation tools
  - Export/import for professional translation services
- FK Links: categories, menu_items

---

#### **Sprint 7: System Monitoring & Optimization** (Week 13-14)
Priority: Developer/admin tools

**7.1 System Tables Dashboards** ⭐
- Read-only views for:
  - **Failed Jobs**: View and retry failed background jobs
  - **Cache**: Cache statistics and manual purge
  - **Sessions**: Active user sessions monitoring
  - **Jobs/Job Batches**: Queue monitoring
  - **Migrations**: Database version history
- No FK links (system tables)

**7.2 Enhanced Audit Logs** ⭐
- Expand existing Audit Logs page:
  - Filter by user, action type, entity type, date range
  - Detailed metadata view
  - Export audit trails for compliance

**7.3 Order Holds System** ⭐
- Design and implement order_holds functionality:
  - Currently undefined/unused table
  - Propose: Link to POS "hold order" feature allowing staff to temporarily save an incomplete order
  - CRUD: order_holds (if functionality is confirmed needed)

---

## 🔗 Foreign Key Relationship Requirements

**Critical Implementation Rule:**
> ALL foreign key relationships MUST be represented as **searchable dropdown/select fields** with entity labels, not raw IDs.

### Examples:

#### **When creating an Order:**
```
❌ BAD: customer_id = 5
✅ GOOD: Customer = [Dropdown: "John Doe (CUST-12345)" | "Jane Smith (CUST-67890)" | ...]
```

#### **When creating a Purchase Order:**
```
✅ Supplier = [Dropdown with supplier names]
✅ Ingredient = [Dropdown: "Premium Beef (BEEF-001) - Current Stock: 25.5 kg"]
✅ Created By = [Auto-filled: Current User]
```

#### **When creating a Shift:**
```
✅ Employee = [Dropdown: "John Doe - Waiter"]
✅ Position = [Dropdown: "Waiter" | "Chef" | "Manager" | ...]
✅ Location = [Dropdown: "Downtown Branch" | "Airport Branch"]
```

### FK Dropdown Features:
- **Search/filter** capability (typeahead)
- **Show relevant context** (e.g., customer code, current stock level, employee name + position)
- **Indicate status** (e.g., inactive ingredients grayed out)
- **Smart defaults** (e.g., default location from user profile)
- **Create new** option where appropriate (quick-add without leaving form)

---

## 📊 Data Integrity Rules

### Referential Integrity:
- **ON DELETE CASCADE**: child records deleted when parent is deleted
  - Examples: order → order_items, category → category_translations
  
- **ON DELETE RESTRICT**: prevent deletion if references exist
  - Examples: categories, locations, ingredients (widely referenced)
  
- **ON DELETE SET NULL**: allow deletion but preserve child records
  - Examples: orders.employee_id (if employee deleted, orders remain)

### Constraints to Enforce:
- **UNIQUE** constraints: email, customer_code, employee_code, etc.
- **CHECK** constraints: rating (1-5), quantity > 0, etc.
- **NOT NULL**: critical fields like name, price, order_type
- **ENUM** fields: order_type, order_status, payment_status - use dropdowns

---

## 🎨 Component Reusability

### Shared Components to Build:
1. **DataTable** - Reusable table with sort/filter/pagination
2. **EntityDropdown** - Smart FK selector component
3. **StatusBadge** - Color-coded status indicators
4. **ActionButtons** - Edit/Delete/View button groups
5. **ConfirmDialog** - Standardized confirmation modals
6. **Form Wizards** - Multi-step form component
7. **DateRangePicker** - Consistent date selection
8. **SearchBar** - Debounced search input
9. **EmptyState** - Consistent empty state messaging
10. **LoadingSpinner** - Consistent loading indicators

---

## 🧪 Testing Requirements

### Per Module:
- **Unit Tests**: Business logic, calculations (e.g., payroll, recipe cost)
- **Integration Tests**: API endpoints for CRUD operations
- **E2E Tests**: Critical user flows (create order, approve time-off, receive purchase order)
- **Validation Tests**: All form inputs validated correctly

### Data Integrity Tests:
- FK constraint enforcement
- Cascade delete behaviors
- Unique constraint violations
- Enum value validation

---

## 📈 Success Metrics

### Coverage Goals:
- ✅ 100% of business tables have admin interfaces (target: 37/37 non-system tables)
- ✅ All CRUD operations functional (target: ~150 operations across 37 tables)
- ✅ Zero manual SQL queries needed for daily operations
- ✅ < 3 clicks to reach any data
- ✅ Page load time < 2 seconds
- ✅ Zero data inconsistencies from missing FK management

### User Satisfaction:
- Reduce admin task time by 50%
- Admin can onboard new staff without developer help
- All business logic configurable through UI

---

## 🔐 Security Considerations

### Access Control:
- Implement role-based access using roles/permissions tables
- Sensitive operations require specific permissions:
  - Delete operations
  - Financial data access (invoices, payments, payrolls)
  - User/role management
  - Supplier/vendor information
  
### Audit Logging:
- Extend audit_logs to track ALL admin actions
- Log before/after values for updates
- Cannot delete audit logs (append-only)

### Data Protection:
- Mask sensitive data (payment details, personal info) based on permissions
- Require confirmation for destructive operations
- Rate limiting on API endpoints

---

## 🛠️ Technical Stack

### Frontend:
- **React** 18+ with TypeScript
- **Inertia.js** for SPA routing
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Query** for data fetching/caching
- **Zod** for form validation
- **date-fns** for date handling

### Backend:
- **Laravel** 11+ (existing)
- **Laravel Excel** for exports
- **Laravel Sanctum** for API auth
- **Laravel Queue** for async jobs
- **Laravel Telescope** for debugging

### Database:
- **MySQL** 8+ (existing)
- Ensure indexes on all FK columns
- Optimize queries with eager loading

---

## 📚 Documentation Requirements

### For Each Module:
1. **User Guide**: How to use the admin interface (screenshots + steps)
2. **API Documentation**: Endpoints, request/response schemas
3. **Database Schema**: ERD diagrams for related tables
4. **Business Logic**: Rules and calculations explained
5. **Troubleshooting**: Common issues and solutions

### Developer Handoff:
- **Code Comments**: Complex business logic explained
- **Naming Conventions**: Consistent across frontend/backend
- **Component Library**: Storybook for shared components
- **Deployment Guide**: Steps to deploy updates

---

## 🚦 Next Steps

1. **Review & Approve** this plan with stakeholders
2. **Prioritize Sprints** based on business needs (order can be adjusted)
3. **Assign Developers** to sprints
4. **Set Up Project Board** (e.g., Jira, GitHub Projects)
5. **Create Design Mockups** for high-priority pages before development
6. **Begin Sprint 1** with Locations, Suppliers, Positions, Units

---

## 📋 Summary Table: Unmanaged Entities by Priority

| Priority | Count | Tables |
|----------|-------|--------|
| ⭐⭐⭐ High | 9 | locations, suppliers, purchase_orders, purchase_order_items, recipes, recipe_ingredients, payrolls, roles, permissions |
| ⭐⭐ Medium | 19 | order_items, order_time_slots, payment_methods, payments, customer_addresses, feedback, cart_items, units, positions, shifts, attendances, time_off_requests, operating_hours, category_translations, menu_item_translations, expense_categories |
| ⭐ Low | 5 | leave_requests (deprecated), order_holds, settings (enhance), audit_logs (enhance), system tables (8 framework tables) |

**Total Unmanaged: 33 tables**
**Total with Partial Management Needing Enhancement: 4 tables**

---

## 🎓 Glossary

- **CRUD**: Create, Read, Update, Delete
- **FK**: Foreign Key
- **PK**: Primary Key
- **SPA**: Single Page Application
- **KDS**: Kitchen Display System
- **PO**: Purchase Order
- **ERD**: Entity-Relationship Diagram
- **UI/UX**: User Interface / User Experience

---

**Document Version:** 1.0
**Created:** 2025-11-29
**Author:** AI Development Assistant
**Status:** Ready for Review
