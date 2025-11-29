# 🚀 Employee Management System (EMS) - Complete Development Sprint

## Executive Summary

This document outlines a comprehensive sprint to build and enhance the Employee Management System for the NKH Restaurant Web Application. The current system has foundational database tables and partial API implementation, but lacks complete CRUD functionality, a robust time-tracking system, comprehensive scheduling UI, and integrated time clock features.

---

## 📋 Phase 1: Database Schema Analysis Report

### Current Employee-Related Tables (Existing)

#### 1. **`employees`** Table
```sql
Columns:
- id (PK, AUTO_INCREMENT)
- user_id (FK → users) - UNIQUE
- position_id (FK → positions)
- location_id (FK → locations)
- employee_code (VARCHAR 50) - UNIQUE with location_id
- hire_date (DATE)
- salary_type (ENUM: 'hourly', 'monthly')
- salary (DECIMAL 12,2)
- address (VARCHAR 255)
- status (ENUM: 'active', 'inactive', 'terminated', 'on_leave')
- created_at, updated_at (TIMESTAMPS)
```
**Relationships:** user (1:1), position (M:1), location (M:1), attendances (1:M), payrolls (1:M), leaveRequests (1:M), orders (1:M)

#### 2. **`attendances`** Table (Time Clock Records)
```sql
Columns:
- id (PK)
- employee_id (FK → employees)
- location_id (FK → locations)
- clock_in_at (TIMESTAMP) - NOT NULL
- clock_out_at (TIMESTAMP) - NULLABLE
- notes (TEXT)
- created_at, updated_at (TIMESTAMPS)
```
**Relationships:** employee (M:1), location (M:1)

#### 3. **`shifts`** Table (Current Schema - INCOMPLETE)
```sql
Expected Columns (from ShiftController analysis):
- id (PK)
- employee_id (FK → employees)
- position_id (FK → positions)
- location_id (FK → locations)
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- status (ENUM: 'scheduled', 'completed', 'cancelled', 'no_show')
- notes (TEXT)
- created_at, updated_at (TIMESTAMPS)
```
**Status:** Table exists in SQL but Shift model is missing from codebase

#### 4. **`leave_requests`** Table
```sql
Columns:
- id (PK)
- employee_id (FK → employees)
- location_id (FK → locations)
- start_date (DATE) - NOT NULL
- end_date (DATE) - NOT NULL
- type (ENUM: 'annual', 'sick', 'unpaid', 'other')
- reason (TEXT)
- status (ENUM: 'pending', 'approved', 'rejected', 'cancelled')
- created_at, updated_at (TIMESTAMPS)
```
**Relationships:** employee (M:1), location (M:1)

#### 5. **`payrolls`** Table
```sql
Columns:
- id (PK)
- employee_id (FK → employees)
- period_start (DATE) - NOT NULL
- period_end (DATE) - NOT NULL
- gross_pay (DECIMAL 12,2) - NOT NULL
- bonuses (DECIMAL 12,2)
- deductions (DECIMAL 12,2)
- net_pay (DECIMAL 12,2) - NOT NULL
- status (ENUM: 'draft', 'paid', 'cancelled')
- paid_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMPS)
```
**Relationships:** employee (M:1)

#### 6. **`positions`** Table
```sql
Columns:
- id (PK)
- title (VARCHAR 120) - UNIQUE
- description (TEXT)
- is_active (TINYINT 1)
- created_at, updated_at (TIMESTAMPS)
```
**Relationships:** employees (1:M)

#### 7. **`locations`** Table
```sql
Columns:
- id (PK)
- code (VARCHAR 50) - UNIQUE
- name (VARCHAR 150)
- address_line1, address_line2 (VARCHAR 255)
- city, state, postal_code, country
- phone (VARCHAR 30)
- is_active (TINYINT 1)
- accepts_online_orders, accepts_pickup, accepts_delivery (TINYINT 1)
- created_at, updated_at (TIMESTAMPS)
```

#### 8. **`users`** Table (Auth)
```sql
Columns:
- id (PK)
- name (VARCHAR 255)
- email (VARCHAR 255) - UNIQUE
- email_verified_at (TIMESTAMP)
- password (VARCHAR 255)
- phone (VARCHAR 255)
- is_active (TINYINT 1)
- remember_token (VARCHAR 100)
- created_at, updated_at (TIMESTAMPS)
```

#### 9. **`orders`** Table (Contains Employee Reference)
```sql
Columns with Employee Context:
- employee_id (FK → employees) - NULLABLE
- assigned_at (timestamp implicitly through created_at/updated_at)
```

### Entity-Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────┐
│   Users     │◄────────│  Employees   │
│  (Auth)     │ 1:1     │  (Staff)     │
└─────────────┘         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼────┐ ┌────▼────┐ ┌──▼───────┐
              │Positions │ │Locations│ │Attendances
              │(Job Role)│ │(Sites)  │ │(TimeCard)
              └──────────┘ └─────────┘ └──────────┘
                    │
        ┌───────────┘
        │
    ┌───▼────┐      ┌─────────────┐      ┌──────────┐
    │ Shifts │      │LeaveRequests│      │Payrolls  │
    │(Sched) │      │(TimeOff)    │      │(Payroll) │
    └────────┘      └─────────────┘      └──────────┘
```

### Current Database Gaps & Missing Features

#### ❌ **Critical Missing Components:**

1. **Shift Model Missing from Codebase**
   - Database table exists but no Eloquent model
   - Controller references non-existent model relationships

2. **Incomplete Employee Fields**
   - ❌ No `hourly_rate` field for hourly employees (only salary)
   - ❌ No `tax_id` or `ssn` (security concern - might need encryption)
   - ❌ No `phone` field on employees table (only on users)
   - ❌ No `emergency_contact` information
   - ❌ No `bank_account_info` (payment details)
   - ❌ No `department` classification
   - ❌ No `start_time` preference tracking

3. **No Time-Off Accrual Tracking**
   - ❌ No `vacation_hours_available` tracking
   - ❌ No `sick_hours_available` tracking
   - ❌ No `paid_time_off_balance` table
   - ❌ No automated accrual calculation logic

4. **No Performance Management**
   - ❌ No performance_reviews table
   - ❌ No employee_ratings or feedback tables
   - ❌ No attendance_metrics for tracking tardiness

5. **No Shift Constraints or Conflict Detection**
   - ❌ No shift_templates for recurring schedules
   - ❌ No shift_preferences (preferred hours)
   - ❌ No ability to detect overlapping/conflicting shifts
   - ❌ No automatic shift swapping mechanism

6. **Incomplete Payroll System**
   - ❌ No tax_withholdings tracking
   - ❌ No payroll_details table for itemized deductions
   - ❌ No overtime tracking integration
   - ❌ No automatic payroll calculation based on hours

7. **Missing Audit & Compliance**
   - ❌ No employment_history table (rehires, role changes)
   - ❌ No audit logs for employee data changes
   - ❌ No document storage for employment agreements

8. **No Integration with Attendance**
   - ❌ No calculated_hours on shifts (actual vs. scheduled)
   - ❌ No late_arrival or early_departure tracking
   - ❌ No breaks_taken tracking

---

## 💾 Proposed Database Schema Updates (DDL)

### Update 1: Enhance Employees Table with Missing Fields

```sql
ALTER TABLE `employees` ADD COLUMN `phone` VARCHAR(20) AFTER `address`;
ALTER TABLE `employees` ADD COLUMN `hourly_rate` DECIMAL(12,2) AFTER `salary_type`;
ALTER TABLE `employees` ADD COLUMN `department` VARCHAR(100) AFTER `position_id`;
ALTER TABLE `employees` ADD COLUMN `emergency_contact_name` VARCHAR(255) AFTER `phone`;
ALTER TABLE `employees` ADD COLUMN `emergency_contact_phone` VARCHAR(20) AFTER `emergency_contact_name`;
ALTER TABLE `employees` ADD COLUMN `bank_account_last_four` VARCHAR(4) AFTER `emergency_contact_phone`;
ALTER TABLE `employees` ADD COLUMN `national_id` VARCHAR(50) AFTER `bank_account_last_four`;
ALTER TABLE `employees` ADD COLUMN `date_of_birth` DATE AFTER `national_id`;
ALTER TABLE `employees` ADD COLUMN `preferred_shift_start` TIME DEFAULT NULL AFTER `date_of_birth`;
```

### Update 2: Create Time Off Balance Table

```sql
CREATE TABLE `time_off_balances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `year` int unsigned NOT NULL,
  `vacation_hours_available` decimal(10,2) NOT NULL DEFAULT '0.00',
  `vacation_hours_used` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sick_hours_available` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sick_hours_used` decimal(10,2) NOT NULL DEFAULT '0.00',
  `personal_hours_available` decimal(10,2) NOT NULL DEFAULT '0.00',
  `personal_hours_used` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `time_off_balances_employee_id_year_unique` (`employee_id`, `year`),
  CONSTRAINT `time_off_balances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Update 3: Create Shift Templates for Recurring Schedules

```sql
CREATE TABLE `shift_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `position_id` bigint unsigned DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `day_of_week` tinyint unsigned NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shift_templates_location_id_foreign` (`location_id`),
  KEY `shift_templates_position_id_foreign` (`position_id`),
  CONSTRAINT `shift_templates_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shift_templates_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Update 4: Create Attendance Metrics Table

```sql
CREATE TABLE `attendance_metrics` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `attendance_id` bigint unsigned NOT NULL,
  `minutes_late` int unsigned NOT NULL DEFAULT '0',
  `minutes_early_departure` int unsigned NOT NULL DEFAULT '0',
  `break_duration_minutes` int unsigned NOT NULL DEFAULT '0',
  `total_shift_hours` decimal(10,2) NOT NULL,
  `overtime_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_metrics_employee_id_foreign` (`employee_id`),
  KEY `attendance_metrics_attendance_id_foreign` (`attendance_id`),
  CONSTRAINT `attendance_metrics_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attendance_metrics_attendance_id_foreign` FOREIGN KEY (`attendance_id`) REFERENCES `attendances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Update 5: Enhance Shifts Table with Calculated Fields

```sql
ALTER TABLE `shifts` ADD COLUMN `actual_start_time` TIME DEFAULT NULL AFTER `end_time`;
ALTER TABLE `shifts` ADD COLUMN `actual_end_time` TIME DEFAULT NULL AFTER `actual_start_time`;
ALTER TABLE `shifts` ADD COLUMN `calculated_hours` DECIMAL(10,2) DEFAULT NULL AFTER `actual_end_time`;
ALTER TABLE `shifts` ADD COLUMN `published_at` TIMESTAMP DEFAULT NULL AFTER `calculated_hours`;
ALTER TABLE `shifts` ADD INDEX `shifts_location_id_date_index` (`location_id`, `date`);
ALTER TABLE `shifts` ADD INDEX `shifts_status_index` (`status`);
```

### Update 6: Create Employment History Table (Audit Trail)

```sql
CREATE TABLE `employment_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `changed_by_user_id` bigint unsigned DEFAULT NULL,
  `effective_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employment_history_employee_id_foreign` (`employee_id`),
  KEY `employment_history_changed_by_user_id_foreign` (`changed_by_user_id`),
  KEY `employment_history_effective_date_index` (`effective_date`),
  CONSTRAINT `employment_history_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `employment_history_changed_by_user_id_foreign` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Update 7: Create Payroll Details Table (Itemized)

```sql
CREATE TABLE `payroll_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payroll_id` bigint unsigned NOT NULL,
  `type` enum('earning','deduction') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_details_payroll_id_foreign` (`payroll_id`),
  CONSTRAINT `payroll_details_payroll_id_foreign` FOREIGN KEY (`payroll_id`) REFERENCES `payrolls` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔍 Phase 2: Existing Code & Functionality Analysis Report

### Current API Implementation Status

#### ✅ **Implemented:**

1. **EmployeeController** (CRUD Operations)
   - `index()` - List employees with search, location filter, pagination
   - `store()` - Create new employee with user account and role assignment
   - `show()` - Retrieve single employee with relationships
   - `update()` - Update employee, user, and role information
   - `destroy()` - Soft-delete by marking inactive
   - **Status:** Fully functional

2. **ShiftController** (Partial Implementation)
   - `index()` - List shifts with multiple filters
   - `schedule()` - Get shifts by date range (day/week/month views)
   - `publish()` - Publish shifts to employees
   - `conflicts()` - Detect overlapping shifts
   - `stats()` - Generate shift statistics
   - `copy()` - Copy shifts to multiple dates
   - **Status:** Implemented but Shift model missing from codebase

3. **EmployeeScheduleController** (Employee Self-Service)
   - `shifts()` - Get employee's own shifts
   - `showShift()` - View specific shift details
   - **Status:** Basic implementation

4. **EmployeeTimeOffController** (Time Off Requests)
   - `index()` - List time off requests
   - `store()` - Submit time off request
   - `destroy()` - Cancel request
   - **Status:** Basic implementation

5. **TimeOffRequestController** (Manager-Side)
   - `approve()` - Approve time off request
   - `reject()` - Reject time off request
   - `balance()` - Get time off balance for employee
   - `calendar()` - View time off calendar
   - `stats()` - Generate time off statistics
   - **Status:** Implemented

#### ❌ **Missing/Incomplete:**

1. **Attendance/Time Clock Controller** - MISSING
   - No `clock_in()` endpoint
   - No `clock_out()` endpoint
   - No attendance history endpoints
   - No real-time attendance tracking

2. **Payroll Controller** - MISSING
   - No payroll generation endpoints
   - No payroll calculation logic
   - No payroll history retrieval
   - No deduction/earning management

3. **Shift Model** - MISSING
   - Database table exists but no Eloquent model file
   - ShiftController references undefined model

4. **Employee Form Validation** - INCOMPLETE
   - Missing email uniqueness validation across users table
   - Missing hourly_rate validation
   - Missing date_of_birth age verification
   - Missing phone format validation

5. **API Route Documentation** - Missing authentication checks
   - Routes not properly middleware-protected
   - `enforce_admin_auth` config check exists but not enforced

### Front-End Implementation Status

#### ✅ **Implemented Pages:**

1. **Employee/Schedule.tsx**
   - Weekly/monthly schedule view
   - Next shift highlighting
   - Time off request submission form
   - Weekly hours calculation
   - Request status tracking (pending/approved/denied)
   - **Functionality:** ~60% complete (UI present, backend integration working)

2. **Employee/KitchenDisplay.tsx**
   - Kitchen display system (KDS)
   - Real-time order status tracking
   - Order aging with urgency alerts
   - Sound notifications
   - Multi-status column view
   - **Functionality:** ~80% complete (primarily UI-focused, not employee mgmt)

3. **Employee/POS.tsx**
   - Point-of-sale interface
   - Not employee management specific
   - **Status:** Out of scope for EMS

#### ❌ **Missing Front-End Pages:**

1. **Admin: Employee Management List**
   - ❌ No employee list/directory page
   - ❌ No search/filter UI
   - ❌ No quick actions (edit, deactivate, view)
   - ❌ No pagination UI

2. **Admin: Employee Creation/Edit Form**
   - ❌ No employee data entry form
   - ❌ No position/location selector
   - ❌ No salary/wage configuration UI
   - ❌ No role assignment interface

3. **Admin: Time Clock Management**
   - ❌ No attendance log viewer
   - ❌ No manual clock-in/out interface
   - ❌ No attendance corrections UI
   - ❌ No attendance reports/analytics

4. **Admin: Shift Scheduling Interface**
   - ❌ No visual schedule builder
   - ❌ No drag-and-drop shift assignment
   - ❌ No shift template management
   - ❌ No bulk scheduling interface

5. **Admin: Payroll Management**
   - ❌ No payroll generation interface
   - ❌ No payroll history viewer
   - ❌ No deduction/earning management
   - ❌ No payroll export functionality

6. **Admin: Employee Analytics Dashboard**
   - ❌ No attendance trends
   - ❌ No payroll summaries
   - ❌ No departmental metrics
   - ❌ No performance indicators

### Current UI Elements Inventory

#### Present but Non-Functional:
- Schedule view buttons (exist in layout but limited functionality)
- Filter options on shift list (basic but need enhancement)
- Time off request form (basic UI, needs validation)

#### Completely Missing:
- Employee management data tables
- Employee creation modals/forms
- Attendance tracking interface
- Payroll management console
- Shift builder calendar

---

## ✏️ Phase 3: Sprint Development Prompt

---

# 🚀 **Sprint Goal**

**Achieve a functional, complete Employee Management System (EMS) by:**
1. Fixing database schema gaps with new tables and enhanced columns
2. Implementing all necessary backend API endpoints with proper validation
3. Creating comprehensive, fully-functional front-end UI pages
4. Enabling real-time attendance tracking and payroll management

**Definition of Done:** System supports complete employee lifecycle management including recruitment, scheduling, time tracking, and payroll processing.

---

## 💾 Task Group 1: Database Schema Updates

### 1.1 - Enhance Employees Table
**Acceptance Criteria:**
- ✅ Add phone, hourly_rate, department, emergency contact fields
- ✅ Add date_of_birth and national_id with appropriate encryption
- ✅ Add preferred_shift_start time preference
- ✅ Run migration and verify existing data integrity

**DDL Statement:**
```sql
ALTER TABLE `employees` ADD COLUMN `phone` VARCHAR(20) AFTER `address`;
ALTER TABLE `employees` ADD COLUMN `hourly_rate` DECIMAL(12,2) AFTER `salary_type`;
ALTER TABLE `employees` ADD COLUMN `department` VARCHAR(100) AFTER `position_id`;
ALTER TABLE `employees` ADD COLUMN `emergency_contact_name` VARCHAR(255) AFTER `phone`;
ALTER TABLE `employees` ADD COLUMN `emergency_contact_phone` VARCHAR(20) AFTER `emergency_contact_name`;
ALTER TABLE `employees` ADD COLUMN `date_of_birth` DATE AFTER `emergency_contact_phone`;
ALTER TABLE `employees` ADD COLUMN `preferred_shift_start` TIME DEFAULT NULL AFTER `date_of_birth`;
```

### 1.2 - Create Time Off Balance Tracking Table
**Acceptance Criteria:**
- ✅ Table created with year-based accrual tracking
- ✅ Foreign key constraint to employees
- ✅ Indexes on employee_id and year
- ✅ Default balances set to 0

**DDL Statement:** (See schema updates section above)

### 1.3 - Create Shift Templates Table
**Acceptance Criteria:**
- ✅ Templates support recurring schedule patterns
- ✅ Day-of-week based scheduling
- ✅ Can be filtered by location and position
- ✅ Active/inactive toggle

**DDL Statement:** (See schema updates section above)

### 1.4 - Enhance Shifts Table
**Acceptance Criteria:**
- ✅ Add actual_start_time and actual_end_time fields
- ✅ Add calculated_hours for tracking
- ✅ Add published_at timestamp
- ✅ Add appropriate indexes for performance

**DDL Statement:** (See schema updates section above)

### 1.5 - Create Attendance Metrics Table
**Acceptance Criteria:**
- ✅ Track tardiness, early departures, breaks
- ✅ Calculate actual shift duration
- ✅ Track overtime hours
- ✅ Link to both employee and attendance records

**DDL Statement:** (See schema updates section above)

### 1.6 - Create Employment History (Audit Trail)
**Acceptance Criteria:**
- ✅ Log all employee record changes
- ✅ Track who made changes and when
- ✅ Store before/after values in JSON
- ✅ Support role changes, status changes, salary updates

**DDL Statement:** (See schema updates section above)

### 1.7 - Create Payroll Details Table
**Acceptance Criteria:**
- ✅ Itemize all earnings and deductions
- ✅ Support percentage-based and fixed deductions
- ✅ Link to parent payroll record
- ✅ Allow flexible deduction types

**DDL Statement:** (See schema updates section above)

---

## 💻 Task Group 2: Back-End (API/Logic) Implementation

### 2.1 - Create Shift Model & Fix ShiftController

**File:** `app/Models/Shift.php`

```php
<?php
namespace App\Models;

class Shift extends Model {
    protected $fillable = [
        'employee_id', 'position_id', 'location_id', 'date', 
        'start_time', 'end_time', 'status', 'notes',
        'actual_start_time', 'actual_end_time', 'calculated_hours', 'published_at'
    ];
    
    protected $casts = [
        'date' => 'date',
        'published_at' => 'datetime',
    ];
    
    // Relationships
    public function employee() { return $this->belongsTo(Employee::class); }
    public function position() { return $this->belongsTo(Position::class); }
    public function location() { return $this->belongsTo(Location::class); }
    public function attendanceMetrics() { return $this->hasMany(AttendanceMetric::class); }
}
```

**Acceptance Criteria:**
- ✅ Shift model created with all relationships
- ✅ ShiftController properly imports and uses model
- ✅ All existing CRUD methods work without errors
- ✅ Tests pass for shift retrieval and filtering

### 2.2 - Create Attendance/Time Clock Controller

**Endpoint:** `POST /api/attendance/clock-in`
```php
Request: {
    "employee_id": 123,
    "location_id": 1,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "notes": "Optional location verification"
}
Response: {
    "id": 456,
    "employee_id": 123,
    "clock_in_at": "2024-11-29T08:00:00Z",
    "clock_out_at": null,
    "status": "clocked_in"
}
```

**Endpoint:** `POST /api/attendance/clock-out`
```php
Request: {
    "attendance_id": 456,
    "latitude": 40.7128,
    "longitude": -74.0060
}
Response: {
    "id": 456,
    "clock_in_at": "2024-11-29T08:00:00Z",
    "clock_out_at": "2024-11-29T17:00:00Z",
    "total_hours": 9,
    "status": "clocked_out"
}
```

**Endpoint:** `GET /api/attendance/today`
```php
Response: {
    "current_status": "clocked_in",
    "current_attendance": {...},
    "today_records": [...]
}
```

**Endpoint:** `GET /api/attendance/history?employee_id=123&from=2024-01-01&to=2024-12-31`
```php
Response: {
    "data": [
        {
            "id": 456,
            "employee_name": "John Doe",
            "clock_in_at": "2024-11-29T08:00:00Z",
            "clock_out_at": "2024-11-29T17:00:00Z",
            "total_hours": 9,
            "location": "Main Branch"
        }
    ],
    "pagination": {...}
}
```

**Acceptance Criteria:**
- ✅ Clock-in creates attendance record with timestamp
- ✅ Clock-out updates same record with end time
- ✅ Hours automatically calculated on clock-out
- ✅ Location/GPS data stored (optional geo-fencing)
- ✅ Prevents double clock-in on same day
- ✅ Handles missing clock-out scenarios

### 2.3 - Create Payroll Controller

**Endpoint:** `POST /api/payroll/generate`
```php
Request: {
    "employee_ids": [1, 2, 3],
    "period_start": "2024-11-01",
    "period_end": "2024-11-30",
    "include_overtime": true
}
Response: {
    "message": "Payroll generated successfully",
    "payrolls": [
        {
            "id": 789,
            "employee_id": 1,
            "period_start": "2024-11-01",
            "period_end": "2024-11-30",
            "gross_pay": 2000.00,
            "bonuses": 50.00,
            "deductions": 300.00,
            "net_pay": 1750.00,
            "status": "draft"
        }
    ]
}
```

**Endpoint:** `POST /api/payroll/{payroll_id}/finalize`
```php
Request: {}
Response: {
    "id": 789,
    "status": "paid",
    "paid_at": "2024-12-01T10:00:00Z",
    "net_pay": 1750.00
}
```

**Endpoint:** `GET /api/payroll/history?employee_id=123`
```php
Response: {
    "data": [
        {
            "id": 789,
            "period": "Nov 2024",
            "gross_pay": 2000.00,
            "net_pay": 1750.00,
            "status": "paid",
            "paid_at": "2024-12-01"
        }
    ]
}
```

**Endpoint:** `GET /api/payroll/{payroll_id}/details`
```php
Response: {
    "payroll_id": 789,
    "earnings": [
        { "description": "Base Salary", "amount": 2000.00 },
        { "description": "Overtime", "amount": 100.00 }
    ],
    "deductions": [
        { "description": "Health Insurance", "amount": 200.00 },
        { "description": "Tax Withholding", "amount": 100.00 }
    ],
    "net_pay": 1750.00
}
```

**Acceptance Criteria:**
- ✅ Calculates hours from attendance records
- ✅ Applies hourly rate or salary based on salary_type
- ✅ Tracks overtime (hours > 40/week)
- ✅ Applies deductions and bonuses
- ✅ Generates payroll_details itemizations
- ✅ Prevents duplicate payroll periods
- ✅ Payroll can be finalized or remain in draft

### 2.4 - Enhance Employee Controller with Validation

**Update:** `StoreEmployeeRequest.php`
```php
public function rules() {
    return [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'phone' => 'required|regex:/^\+?[1-9]\d{1,14}$/',
        'position_id' => 'required|exists:positions,id',
        'location_id' => 'required|exists:locations,id',
        'salary_type' => 'required|in:hourly,monthly',
        'salary' => 'required_if:salary_type,monthly|numeric|min:0',
        'hourly_rate' => 'required_if:salary_type,hourly|numeric|min:0',
        'hire_date' => 'required|date',
        'date_of_birth' => 'required|date|before:18 years ago',
        'emergency_contact_name' => 'required|string|max:255',
        'emergency_contact_phone' => 'required|regex:/^\+?[1-9]\d{1,14}$/',
        'department' => 'nullable|string|max:100',
    ];
}
```

**Acceptance Criteria:**
- ✅ Email validation against users table
- ✅ Phone format validation
- ✅ Conditional validation for hourly_rate vs salary
- ✅ Date of birth age verification (18+)
- ✅ Required emergency contact information
- ✅ Proper error messages for validation failures

### 2.5 - Create Shift Template Management API

**Endpoint:** `POST /api/shift-templates`
```php
Request: {
    "location_id": 1,
    "position_id": 5,
    "name": "Standard Morning Shift",
    "day_of_week": 1,
    "start_time": "08:00",
    "end_time": "16:00"
}
```

**Endpoint:** `GET /api/shift-templates?location_id=1`

**Endpoint:** `POST /api/shifts/from-template`
```php
Request: {
    "template_id": 10,
    "employee_id": 123,
    "start_date": "2024-12-01",
    "end_date": "2024-12-31",
    "include_weekends": false
}
Response: {
    "message": "21 shifts created from template",
    "shifts_created": 21
}
```

**Acceptance Criteria:**
- ✅ Templates can be created per location
- ✅ Can apply templates to date ranges
- ✅ Auto-generates shifts matching template schedule
- ✅ Respects weekday filtering

### 2.6 - Create Attendance Metrics Calculation

**File:** `app/Services/AttendanceService.php`

**Responsibility:**
- Calculate attendance metrics after clock-out
- Track tardiness vs scheduled shift
- Calculate overtime hours
- Generate attendance reports

**Methods:**
```php
public function calculateMetrics(Attendance $attendance): AttendanceMetric
public function getDailyReport(Employee $employee, Carbon $date): array
public function getAttendanceSummary(Employee $employee, Carbon $from, Carbon $to): array
public function generateLatenessReport(Location $location, Carbon $month): array
```

**Acceptance Criteria:**
- ✅ Metrics calculated on every clock-out
- ✅ Compares to scheduled shift times
- ✅ Tracks breaks duration
- ✅ Identifies overtime automatically

### 2.7 - Create Time Off Balance Service

**File:** `app/Services/TimeOffService.php`

**Methods:**
```php
public function accrueBalance(Employee $employee, int $year): void
public function requestTimeOff(Employee $employee, TimeOffRequest $request): bool
public function approveRequest(TimeOffRequest $request, User $approver): void
public function deductBalance(Employee $employee, TimeOffRequest $request): void
public function getBalance(Employee $employee, int $year): TimeOffBalance
```

**Acceptance Criteria:**
- ✅ Annual accrual happens on hire date anniversary
- ✅ Balances per leave type (vacation, sick, personal)
- ✅ Prevents approval if insufficient balance
- ✅ Deducts balance when request is approved

---

## 🖥️ Task Group 3: Front-End (UI/UX) Implementation

### 3.1 - Employee Management List Page

**File:** `resources/js/Pages/admin/Employee/EmployeeList.tsx`

**Components:**
- DataTable with columns: Name, Email, Position, Location, Status, Phone
- Search bar (searches name/email)
- Filters: Location, Status, Position
- Pagination controls
- Quick actions: View, Edit, Deactivate
- Bulk actions: Export, Deactivate Multiple

**Features:**
- Real-time search with debounce
- Column sorting
- Status badges (Active=Green, Inactive=Gray, Terminated=Red)
- Loading states
- Empty state messaging
- Responsive table on mobile

**Acceptance Criteria:**
- ✅ Loads 50 employees per page
- ✅ Search responds in <500ms
- ✅ Can filter by location, status, position
- ✅ Edit/view buttons route correctly
- ✅ Delete soft-deactivates employee
- ✅ Shows total employee count

### 3.2 - Employee Creation/Edit Form Page

**File:** `resources/js/Pages/admin/Employee/EmployeeForm.tsx`

**Form Sections:**
1. **Personal Information**
   - Full Name (required)
   - Email (required, unique)
   - Phone (required, format validated)
   - Date of Birth (required, 18+ validation)
   - Emergency Contact Name (required)
   - Emergency Contact Phone (required)

2. **Employment Details**
   - Employee Code (auto-generated or manual)
   - Position (dropdown, required)
   - Location (dropdown, required)
   - Department (text input)
   - Hire Date (date picker, required)
   - Status (radio: Active/Inactive/On Leave)
   - Preferred Shift Start Time (time picker)

3. **Compensation**
   - Salary Type (radio: Hourly/Monthly)
   - Salary/Hourly Rate (conditional, required, min validation)
   - Bank Account Last 4 Digits (masked input, optional)

4. **Account Setup (Create Only)**
   - Password (required, strength meter)
   - Confirm Password
   - Role Assignment (multi-select from available roles)

**Features:**
- Real-time form validation
- Conditional field visibility (hourly_rate shows if hourly)
- Error messages on each field
- Submit button disabled during API call
- Success/error toast notifications
- Unsaved changes warning
- Prefill edit form from API

**Acceptance Criteria:**
- ✅ All required fields validated
- ✅ Email unique check (real-time)
- ✅ Phone format validation
- ✅ Password strength requirements
- ✅ Age verification for DOB (18+)
- ✅ Create submits to POST /api/employees
- ✅ Edit submits to PUT /api/employees/{id}
- ✅ Error handling displays validation messages
- ✅ After submit, redirects to employee list

### 3.3 - Attendance/Time Clock Interface

**File:** `resources/js/Pages/Employee/TimeClock.tsx`

**Components:**
1. **Current Status Card**
   - Large display: "Clocked Out" or "Clocked In Since HH:MM"
   - Live timer showing elapsed time
   - Current location name
   - Employee name

2. **Clock In/Out Button Area**
   - Large, high-contrast button (Green for clock-in, Red for clock-out)
   - Disabled state if already clocked in/out
   - Loading spinner during API call
   - Last action timestamp

3. **Today's Timeline**
   - Visual timeline of clock events
   - Card per clock-in/out pair
   - Shows calculated hours for completed pairs
   - Running total hours today

4. **Quick Stats**
   - Hours worked today
   - Breaks remaining
   - Overtime status

**Features:**
- Geolocation on clock-in (optional, for verification)
- Sound notification on successful clock action
- Prevents multiple clock-ins per day
- Handles edge case: clock-out without clock-in
- Manual notes on clock action (optional)
- Real-time sync with server

**Acceptance Criteria:**
- ✅ POST to /api/attendance/clock-in on button click
- ✅ POST to /api/attendance/clock-out on button click
- ✅ Real-time timer updates display
- ✅ Prevents double clock-in
- ✅ Shows error if already clocked in
- ✅ Displays success toast
- ✅ Geolocation data sent with request
- ✅ Works offline with sync on reconnect

### 3.4 - Attendance Management Page (Admin)

**File:** `resources/js/Pages/admin/Employee/AttendanceManagement.tsx`

**Components:**
1. **Filter Section**
   - Date range picker (From/To)
   - Employee search/select
   - Location filter
   - Status filter (Clocked In, Clocked Out, Missing Clock-Out)

2. **Attendance Table**
   - Columns: Employee, Date, Clock In, Clock Out, Total Hours, Late?, Overtime?, Location, Actions
   - Sortable columns
   - Row color coding: Green=On time, Yellow=Late, Red=Missing clock-out
   - Pagination

3. **Attendance Detail Modal**
   - Show full record details
   - Manual clock-in/out time adjustment
   - Add notes
   - View calculated metrics
   - Mark as approved/reviewed

**Features:**
- Export to CSV functionality
- Manual time adjustment (with audit trail)
- Add/edit break duration
- Flag for review
- Batch approval

**Acceptance Criteria:**
- ✅ Fetches data from GET /api/attendance/history
- ✅ Can filter by date range
- ✅ Can filter by employee
- ✅ Shows calculated hours
- ✅ Identifies late arrivals/early departures
- ✅ Modal allows manual adjustments
- ✅ Adjustments POST to /api/attendance/{id}/adjust
- ✅ Audit logs changes
- ✅ Export generates CSV file

### 3.5 - Shift Scheduling Interface

**File:** `resources/js/Pages/admin/Employee/ShiftScheduler.tsx`

**Components:**
1. **Calendar View**
   - Month/week/day view toggle
   - Drag-and-drop shift assignment
   - Color-coded by position/employee
   - Click to create new shift

2. **Shift Creation Modal**
   - Date picker
   - Start/end time picker
   - Employee search (autocomplete)
   - Position selector
   - Notes field
   - Save/Cancel buttons

3. **Shift Template Selector**
   - Quick apply templates to date range
   - Bulk assign shifts
   - Template preview

4. **Published Schedule View**
   - Read-only display for employees
   - Show only published shifts
   - Time-off indicators
   - Shift swaps pending

**Features:**
- Conflict detection (show warning if overlap)
- Drag-and-drop to modify/move shifts
- Bulk operations (apply template, mass update)
- Copy from previous week/month
- Shift swaps request workflow
- Generate schedule statistics

**Acceptance Criteria:**
- ✅ Renders calendar view correctly
- ✅ Can create shift via modal
- ✅ POST to /api/shifts on create
- ✅ Drag-and-drop updates shift (PUT /api/shifts/{id})
- ✅ Detects overlapping shifts
- ✅ Can publish all shifts (POST /api/shifts/publish)
- ✅ Employees see published shifts only
- ✅ Shows shift statistics (total hours, coverage)

### 3.6 - Payroll Management Page

**File:** `resources/js/Pages/admin/Employee/PayrollManagement.tsx`

**Components:**
1. **Payroll Period Selector**
   - Month picker
   - Quick select: This Month, Last Month, Last 3 Months
   - Generate button

2. **Payroll Generation Panel**
   - Checkbox to select employees
   - Select all / deselect all
   - Generate payroll button
   - Preview before finalization

3. **Payroll Summary Table**
   - Columns: Employee, Base Pay, Overtime, Bonuses, Deductions, Net Pay, Status
   - Status badges: Draft, Finalized, Paid
   - Row actions: View Details, Edit, Finalize, Mark as Paid

4. **Payroll Details Modal**
   - Itemized earnings
   - Itemized deductions
   - Gross and net totals
   - Edit deductions
   - Add notes
   - View approval history

5. **Payroll History Table**
   - Archive of past payrolls
   - Filter by period
   - View/export historical payrolls

**Features:**
- Automatic calculation from attendance
- Manual deduction/bonus entry
- Tax calculation
- PDF export
- Email to employee
- Bulk finalize
- Approval workflow

**Acceptance Criteria:**
- ✅ POST to /api/payroll/generate on generation
- ✅ Shows preview of calculated amounts
- ✅ Can modify deductions before finalization
- ✅ POST to /api/payroll/{id}/finalize
- ✅ Shows itemized details on modal
- ✅ GET /api/payroll/history shows past records
- ✅ Can export payroll as PDF/CSV
- ✅ Handles edge cases (no hours, partial month)

### 3.7 - Employee Self-Service Dashboard

**File:** `resources/js/Pages/Employee/Dashboard.tsx`

**Components:**
1. **Quick Stats Card**
   - Hours worked this week
   - Hours worked this month
   - Time off balance (vacation/sick/personal)
   - Next scheduled shift

2. **Current Shift Card**
   - Next shift details (date, time, location, position)
   - Clock in/out button
   - Travel time estimate

3. **Recent Pay Stubs**
   - Last 3 payroll records
   - View details button
   - Download PDF button

4. **Upcoming Shifts Widget**
   - Next 7 days of shifts
   - Request shift swap button
   - Mark unavailable button

5. **Time Off Requests**
   - Request form
   - Status of pending requests
   - Approved/denied history

6. **Attendance Calendar**
   - Last 30 days attendance
   - Color-coded by status
   - Hover to see details

**Features:**
- Real-time clock status
- Notification for shift reminders
- Download pay stubs
- Request time off
- Swap shifts with coworkers

**Acceptance Criteria:**
- ✅ Fetches from /api/employee/shifts
- ✅ Fetches from /api/employee/attendances
- ✅ Fetches from /api/payroll/history
- ✅ Shows current clock status
- ✅ Clock in/out buttons functional
- ✅ Time off balance displays correctly
- ✅ Links to detailed pages

---

## ✅ Definition of Done (DoD)

### Database
- [ ] All 7 schema update DDL statements executed successfully
- [ ] Data integrity verified (foreign keys, constraints)
- [ ] Migration files created and tested in staging
- [ ] No data loss on existing records
- [ ] Backups taken before changes

### Backend API
- [ ] All 7 controller/service implementations complete
- [ ] HTTP status codes correct (200/201/400/404/422/500)
- [ ] Request validation working (400 on invalid data)
- [ ] Response DTOs consistent across endpoints
- [ ] Error messages helpful and actionable
- [ ] Rate limiting implemented on sensitive endpoints
- [ ] Unit tests for each controller (>80% coverage)
- [ ] API documentation generated (OpenAPI/Swagger)
- [ ] Tested with Postman/Insomnia collection provided

### Frontend Pages
- [ ] All 7 pages implemented and responsive
- [ ] Mobile-friendly (tested on 320px, 768px, 1920px widths)
- [ ] Form validation displays errors clearly
- [ ] Loading states shown during API calls
- [ ] Error states with retry buttons
- [ ] Success notifications (toast messages)
- [ ] No console errors or warnings
- [ ] Accessibility: WCAG 2.1 AA compliant (keyboard navigation, screen readers)
- [ ] Performance: Paginated for >100 records, debounced search
- [ ] Unit tests for each page component (>70% coverage)

### Integration & E2E
- [ ] Full flow tested: Create Employee → Assign Shift → Clock In/Out → Generate Payroll
- [ ] Time off balance decrements on approval
- [ ] Payroll calculates correctly based on hours
- [ ] Shift conflicts detected and prevented
- [ ] Attendance metrics calculated on clock-out
- [ ] Employment history logged for all changes

### Deployment & Staging
- [ ] Tested on staging environment
- [ ] Database migrations run successfully
- [ ] No breaking changes to existing functionality
- [ ] API response times <500ms (p95)
- [ ] Can handle 1000+ concurrent users (load tested)
- [ ] Rollback plan documented

### Documentation
- [ ] API endpoint documentation complete
- [ ] Database schema documentation (ERD, field descriptions)
- [ ] Frontend component storybook or demo
- [ ] User guide for employees
- [ ] Administrator guide for payroll/scheduling
- [ ] Troubleshooting guide for common issues
- [ ] Code comments for complex logic

### Security
- [ ] All inputs validated server-side
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (HTML escaping)
- [ ] CSRF tokens on forms
- [ ] Authentication required on all admin endpoints
- [ ] Authorization checks (role-based access)
- [ ] Sensitive data encrypted (SSN, bank account)
- [ ] Audit logs for payroll modifications
- [ ] No passwords in logs
- [ ] Rate limiting on auth endpoints

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Employee CRUD Operations | 100% functional | Manual testing + automated tests |
| Shift Scheduling Coverage | 95% of staff scheduled per week | Reports generation |
| Attendance Accuracy | 99% clock records captured | Spot checks + audit logs |
| Payroll Generation Time | <2 minutes for 100 employees | Performance monitoring |
| User Adoption | 80% daily active usage | Analytics dashboard |
| System Availability | 99.5% uptime | Monitoring alerts |
| Bug-Free Deployment | <5 critical bugs per month | Issue tracking |

---

## 🗓️ Timeline Estimate

| Phase | Task Group | Estimated Duration |
|-------|-----------|-------------------|
| 1 | Database Schema Updates | 2-3 days |
| 2 | Backend API Implementation | 5-7 days |
| 3 | Frontend UI Implementation | 7-10 days |
| 4 | Integration Testing | 3-4 days |
| 5 | Staging Deployment | 2-3 days |
| **Total** | | **19-27 days** |

---

## 📝 Notes for Implementation Team

1. **Database Changes**: Run migrations in staging first, verify data integrity, then production
2. **API Backward Compatibility**: Ensure existing endpoints continue to work (no breaking changes)
3. **Frontend Dependencies**: Uses React Query, Framer Motion, Lucide Icons (ensure installed)
4. **Error Handling**: Implement graceful degradation for offline scenarios
5. **Notifications**: Use existing toast notification system
6. **Testing**: Require unit + integration tests for each component
7. **Code Review**: 2-person review before merge to main
8. **Performance**: Monitor API response times during load testing
9. **Security Audit**: Conduct before production deployment
10. **User Training**: Prepare guides for admin and employee roles

---

**End of Sprint Prompt**

---

## 📚 Additional Resources

### Related Documentation Files in Repository
- `QUICK_START_GUIDE.md` - Developer setup
- `BACKEND_INTEGRATION_COMPLETE.md` - API integration patterns
- `HOME_PAGE_IMPLEMENTATION.md` - Frontend page patterns
- `FULL_IMPLEMENTATION_GUIDE.md` - Complete system architecture

### External References
- Laravel Documentation: https://laravel.com/docs
- React Query: https://tanstack.com/query
- Tailwind CSS: https://tailwindcss.com
- MySQL: https://dev.mysql.com/doc

---

**Report Generated:** November 29, 2024
**System:** NKH Restaurant Web Application
**Status:** Ready for Sprint Implementation
