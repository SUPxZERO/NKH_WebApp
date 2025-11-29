# 🚀 NKH Restaurant Admin Redesign - Sprint 3 Progress

## Sprint 3: Employee Scheduling & Time Management

**Start Date:** 2025-11-29  
**Status:** 🔄 IN PROGRESS

---

## 📋 Sprint 3 Objectives

### Core Modules
1. **Employee Shifts** - Shift scheduling and management
2. **Time Off Requests** - Employee leave/vacation requests  
3. **Shift Templates** - Recurring shift patterns
4. **Attendance Tracking** - Clock in/out logs

---

## 🎯 Sprint 3 Features

### Employee Shifts Module
- Create/edit/delete shifts
- Assign employees to shifts
- Shift type (morning, evening, night, split)
- Location-based scheduling
- Conflict detection
- Shift swapping/trading
- Coverage gaps detection
- Schedule publishing

### Time Off Requests Module
- Submit time-off requests
- Approval workflow (pending → approved/rejected)
- Request types (vacation, sick leave, personal, other)
- Date conflict checking
- Balance tracking
- Manager approval dashboard
- Email notifications

### Shift Templates Module
- Create recurring shift patterns
- Weekly/monthly templates
- Auto-assign shifts from templates
- Template categories (weekday, weekend, holiday)
- Clone templates
- Apply template to date range

### Attendance Tracking Module
- Clock in/out functionality
- GPS/location verification
- Late arrival tracking
- Early departure alerts
- Overtime calculation
- Attendance reports
- Export to payroll

---

## ✅ Completed Tasks

### Backend API Controllers (0/4) ⏳ **0% COMPLETE**

#### 1. ⏳ ShiftController
**File:** `app/Http/Controllers/Api/ShiftController.php`
**Status:** Not started
**Features needed:**
- CRUD operations for shifts
- Assign employees to shifts
- Conflict detection
- Coverage calculation
- Filter by date, location, employee
- Schedule publishing

#### 2. ⏳ TimeOffRequestController  
**File:** `app/Http/Controllers/Api/TimeOffRequestController.php`
**Status:** Not started
**Features needed:**
- CRUD for time-off requests
- Approval workflow
- Balance tracking
- Conflict detection
- Filter by status, type, employee
- Manager approval methods

#### 3. ⏳ ShiftTemplateController
**File:** `app/Http/Controllers/Api/ShiftTemplateController.php`
**Status:** Not started
**Features needed:**
- CRUD for shift templates
- Apply template to date range
- Clone templates
- Category management

#### 4. ⏳ AttendanceController
**File:** `app/Http/Controllers/Api/AttendanceController.php`
**Status:** Not started
**Features needed:**
- Clock in/out
- Attendance records
- Late/early tracking
- Overtime calculation
- Reports and exports

---

## Frontend Admin Pages (0/4) ⏳ **0% COMPLETE**

#### 1. ⏳ Shifts Management Page
**File:** `resources/js/Pages/admin/Shifts.tsx`
**Status:** Not started
**Features needed:**
- Calendar view (week/month)
- Drag-and-drop scheduling
- Employee assignment
- Shift details panel
- Coverage overview
- Conflict warnings
- Publish schedule button

#### 2. ⏳ Time Off Requests Page
**File:** `resources/js/Pages/admin/TimeOffRequests.tsx`
**Status:** Not started
**Features needed:**
- Request list view
- Create request form
- Approve/reject buttons
- Status badges
- Calendar view
- Balance display
- Filter by employee, status, type

#### 3. ⏳ Shift Templates Page
**File:** `resources/js/Pages/admin/ShiftTemplates.tsx` 
**Status:** Not started
**Features needed:**
- Template list
- Create/edit template
- Apply to date range
- Clone template
- Category selector

#### 4. ⏳ Attendance Page
**File:** `resources/js/Pages/admin/Attendance.tsx`
**Status:** Not started
**Features needed:**
- Attendance log
- Clock in/out interface
- Late/early indicators
- Overtime display
- Export functionality
- Reports

---

## 📋 Routes to Add

### API Routes Required
Add to `routes/api.php`:

```php
// Employee Scheduling
Route::prefix('admin')->group(function () {
    // Shifts
    Route::apiResource('shifts', ShiftController::class);
    Route::post('shifts/{shift}/assign', [ShiftController::class, 'assignEmployee']);
    Route::post('shifts/{shift}/publish', [ShiftController::class, 'publish']);
    Route::get('shifts/{shift}/conflicts', [ShiftController::class, 'checkConflicts']);
    Route::get('schedule/{date}', [ShiftController::class, 'scheduleByDate']);
    
    // Time Off Requests
    Route::apiResource('time-off-requests', TimeOffRequestController::class);
    Route::post('time-off-requests/{request}/approve', [TimeOffRequestController::class, 'approve']);
    Route::post('time-off-requests/{request}/reject', [TimeOffRequestController::class, 'reject']);
    Route::get('time-off-balance/{employee}', [TimeOffRequestController::class, 'balance']);
    
    // Shift Templates
    Route::apiResource('shift-templates', ShiftTemplateController::class);
    Route::post('shift-templates/{template}/apply', [ShiftTemplateController::class, 'applyToDateRange']);
    Route::post('shift-templates/{template}/clone', [ShiftTemplateController::class, 'clone']);
    
    // Attendance
    Route::apiResource('attendance', AttendanceController::class);
    Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::get('attendance/report/{employee}/{month}', [AttendanceController::class, 'monthlyReport']);
});
```

### Inertia Routes Required
Add to `routes/web.php`:

```php
Route::prefix('admin')->group(function () {
    Route::get('shifts', fn() => Inertia::render('admin/Shifts'))->name('admin.shifts');
    Route::get('time-off-requests', fn() => Inertia::render('admin/TimeOffRequests'))->name('admin.time-off-requests');
    Route::get('shift-templates', fn() => Inertia::render('admin/ShiftTemplates'))->name('admin.shift-templates');
    Route::get('attendance', fn() => Inertia::render('admin/Attendance'))->name('admin.attendance');
});
```

---

## 🎯 Sprint 3 Completion Checklist

### Backend (0/4 Complete) ⏳
- [ ] ShiftController
- [ ] TimeOffRequestController
- [ ] ShiftTemplateController
- [ ] AttendanceController

### Frontend (0/4 Complete) ⏳
- [ ] Shifts page
- [ ] Time Off Requests page
- [ ] Shift Templates page
- [ ] Attendance page

### Integration (0/2 Complete) ⏳
- [ ] Add API routes
- [ ] Add Inertia routes

### Navigation (0/1 Complete) ⏳
- [ ] Add menu items to admin sidebar

---

## 📊 Overall Progress: 0% Complete

**Completed:** 0/10 items
- ⏳ 0 Backend controllers
- ⏳ 0 Frontend pages
- ⏳ 0 Integration tasks

---

## 🎨 Key Features to Implement

### Shift Management
1. **Calendar interface** with week/month views
2. **Drag-and-drop** shift assignment
3. **Conflict detection** when assigning overlapping shifts
4. **Coverage calculation** to identify gaps
5. **Shift templates** for recurring patterns
6. **Publish schedule** to notify employees

### Time Off Management
1. **Request submission** by employees
2. **Approval workflow** for managers
3. **Balance tracking** (vacation days, sick days)
4. **Conflict checking** with scheduled shifts
5. **Email notifications** on approval/rejection
6. **Calendar integration** showing time-off on schedule

### Attendance Tracking
1. **Clock in/out** buttons
2. **Geolocation verification** (optional)
3. **Late/early warnings**
4. **Overtime calculation**
5. **Monthly reports**
6. **Export to CSV/PDF**

---

## 🔗 Database Relationships

### Shifts
```
shifts
├── employee_id → employees
├── location_id → locations
├── position_id → positions
└── template_id → shift_templates (optional)
```

### Time Off Requests
```
time_off_requests
├── employee_id → employees
└── approved_by → employees (manager)
```

### Attendance
```
attendance
├── employee_id → employees
├── shift_id → shifts (optional)
└── location_id → locations
```

---

## 💡 Business Rules

### Shifts
- ✅ Cannot assign employee to overlapping shifts
- ✅ Cannot schedule shifts for inactive employees
- ✅ Published shifts can only be edited with manager approval
- ✅ Must assign position matching employee's role
- ✅ Weekend/holiday shifts may require premium pay flag

### Time Off Requests
- ✅ Cannot request time off for past dates
- ✅ Cannot approve own requests
- ✅ Check remaining balance before approval
- ✅ Automatically reject conflicting requests
- ✅ Require reason for sick leave \u003e 3 days

### Attendance
- ✅ Cannot clock in twice without clocking out
- ✅ Cannot clock in more than 1 hour early
- ✅ Overtime triggers after 8 hours/day or 40 hours/week
- ✅ Manager approval required to edit attendance
- ✅ Location verification within X meters (optional)

---

## 🚀 Next Steps

1. Create ShiftController
2. Create TimeOffRequestController
3. Create ShiftTemplateController
4. Create AttendanceController
5. Create Shifts frontend page (calendar view)
6. Create Time Off Requests page
7. Create Shift Templates page
8. Create Attendance page
9. Add routes
10. Test all workflows

**Estimated time:** 4-6 hours

---

*Last Updated: 2025-11-29 14:35*
*Status: Ready to start development*
