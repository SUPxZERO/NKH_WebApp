# Automatic Time Slot Generation - Implementation Guide

## ✅ Problem Solved

**Issue**: Time slots were always empty on new days and had to be manually created  
**Solution**: Automatic time slot generation based on Operating Hours configuration

## 🎯 How It Works Now

### 1. **Operating Hours Drive Time Slots**

The system now automatically generates time slots based on your Operating Hours settings:

```
Operating Hours (One-time setup)
    ↓
Automatic Generation (Daily at midnight)
    ↓
Time Slots Available (For next 7-14 days)
```

### 2. **Generation Rules**

| Service Type | Slot Interval | Max Orders/Slot |
|--------------|---------------|-----------------|
| **Pickup** | 30 minutes | 10 orders |
| **Delivery** | 60 minutes | 5 orders |
| **Dine-In** | 60 minutes | 15 orders |

### 3. **Example Generation**

If Operating Hours for Location 1, Monday, Pickup service are:
- **Opening**: 09:00
- **Closing**: 22:00

The system generates:
```
09:00 - Pickup (Max: 10)
09:30 - Pickup (Max: 10)
10:00 - Pickup (Max: 10)
10:30 - Pickup (Max: 10)
...
21:30 - Pickup (Max: 10)
```

## 📋 Implementation Details

### Files Created

1. **`app/Console/Commands/GenerateTimeSlots.php`**
   - Artisan command to generate time slots
   - Usage: `php artisan timeslots:generate {days}`
   - Default: 7 days ahead

2. **`app/Console/Kernel.php`** (Modified)
   - Scheduled task runs daily at 00:01 AM
   - Automatically generates slots for next 7 days
   - Logs output to `storage/logs/timeslots.log`

### Command Usage

```bash
# Generate time slots for next 7 days (default)
php artisan timeslots:generate

# Generate time slots for next 14 days
php artisan timeslots:generate 14

# Generate time slots for next 30 days
php artisan timeslots:generate 30
```

### Schedule Configuration

The system runs automatically every day:

```php
// Runs at 12:01 AM daily
$schedule->command('timeslots:generate 7')
    ->daily()
    ->at('00:01')
    ->appendOutputTo(storage_path('logs/timeslots.log'));
```

## 🚀 Initial Setup

### Step 1: Set Up Operating Hours

Make sure you have Operating Hours configured for each location:

```sql
-- Example: Check existing operating hours
SELECT * FROM operating_hours WHERE location_id = 1;
```

Operating hours should have:
- `location_id`: Which location
- `day_of_week`: 0-6 (Sunday-Saturday)
- `service_type`: pickup, delivery, or dine_in
- `opening_time`: e.g., "09:00:00"
- `closing_time`: e.g., "22:00:00"

### Step 2: Generate Initial Time Slots

Run the command manually to populate time slots:

```bash
php artisan timeslots:generate 14
```

Output:
```
Generating time slots for the next 14 days...
Processing location: NKH Downtown Flagship (ID: 1)
Processing location: NKH Siem Reap Branch (ID: 2)

✅ Time slot generation complete!
   Generated: 546 new slots
   Skipped: 0 existing slots
```

### Step 3: Verify Time Slots Created

```bash
php artisan tinker
```

```php
// Check total time slots
OrderTimeSlot::count();
// Output: 546

// Check today's slots
OrderTimeSlot::where('slot_date', today())->count();
// Output: 39

// View sample slots
OrderTimeSlot::where('slot_date', today())->take(5)->get();
```

## 📊 Current Status

### After Implementation

| Metric | Value |
|--------|-------|
| **Total Time Slots** | 546 |
| **Days Covered** | 14 days |
| **Locations** | 2 (NKH Downtown, NKH Siem Reap) |
| **Service Types** | Pickup, Delivery, Dine-In |

### Sample Generated Slots (Today)

```
Date: 2025-12-03
Time: 09:00 - Type: pickup - Max: 10 orders
Time: 09:30 - Type: pickup - Max: 10 orders
Time: 10:00 - Type: pickup - Max: 10 orders
Time: 10:30 - Type: pickup - Max: 10 orders
...
Time: 21:30 - Type: pickup - Max: 10 orders
```

## 🔄 Automatic Daily Updates

The scheduler ensures:
1. Runs every day at 12:01 AM
2. Generates slots for the next 7 days
3. Skips already existing slots (no duplicates)
4. Logs all activity to `storage/logs/timeslots.log`
5. Keeps your calendar always populated

## 🛠️ Customization Options

### Modify Slot Intervals

Edit `GenerateTimeSlots.php`:

```php
// Current settings
$interval = 30; // pickup: 30 minutes
$interval = 60; // delivery & dine-in: 60 minutes

// Change to 15-minute slots for pickup
if ($normalizedType === 'pickup') {
    $interval = 15; // Now generates 09:00, 09:15, 09:30, etc.
}
```

### Modify Max Orders  

```php
// Current settings
'pickup' => 10 orders/slot
'delivery' => 5 orders/slot
'dine_in' => 15 orders/slot

// Change if needed
if ($normalizedType === 'pickup') {
    $maxOrders = 20; // Increase capacity
}
```

### Change Schedule Time

Edit `app/Console/Kernel.php`:

```php
// Current: Runs at 12:01 AM
->at('00:01')

// Change to run at different time
->at('06:00') // Runs at 6:00 AM
->at('23:00') // Runs at 11:00 PM
```

### Generate More Days Ahead

```php
// Current: 7 days
$schedule->command('timeslots:generate 7')

// Change to 30 days
$schedule->command('timeslots:generate 30')
```

## 📝 Maintenance

### View Generation Logs

```bash
# View recent log entries
tail -50 storage/logs/timeslots.log
```

### Clear Old Time Slots

```php
// Delete past time slots (optional cleanup)
OrderTimeSlot::where('slot_date', '<', today())->delete();
```

### Regenerate All Slots

```bash
# Clear all existing slots
php artisan tinker
OrderTimeSlot::truncate();
exit

# Generate fresh slots
php artisan timeslots:generate 30
```

## 🎓 Understanding the Logic

### Day of Week Mapping

```
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

### Service Type Normalization

The command handles both formats:
- `dine-in` → converts to → `dine_in`
- `dine_in` → stays as → `dine_in`

### Slot Generation Flow

```
For each Location:
  For each Day (next N days):
    Get Operating Hours for that day
    If Operating Hours exist:
      For each Service Type (pickup/delivery/dine-in):
        Generate slots from opening to closing
        Use appropriate interval (30min or 60min)
        Set max orders based on service type
        Skip if slot already exists
```

## ✅ Benefits

1. **No Manual Work** - Slots generate automatically  
2. **Always Available** - Always 7-14 days ahead  
3. **Consistent** - Based on your operating hours  
4. **Flexible** - Easy to customize intervals and capacities  
5. **Efficient** - Skips duplicates, logs activity  

## 🚨 Troubleshooting

### Problem: No slots generated
**Solution**: Check if Operating Hours are configured  
```bash
php artisan tinker
OperatingHours::count(); // Should be > 0
```

### Problem: Scheduler not running
**Solution**: Ensure Laravel scheduler is active  
```bash
# Add to crontab (Linux/Mac)
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1

# Or run manually for testing
php artisan schedule:run
```

### Problem: Wrong intervals
**Solution**: Modify interval values in GenerateTimeSlots.php

## 📈 Next Steps

1. ✅ **Setup Complete** - Time slots auto-generate  
2. ⏰ **Monitor** - Check logs daily for first week  
3. 🔧 **Adjust** - Fine-tune intervals if needed  
4. 📊 **Optimize** - Adjust max orders based on actual demand  

---

**Status**: ✅ Fully Operational  
**Last Run**: Generated 546 slots for next 14 days  
**Next Run**: Tomorrow at 12:01 AM (automatic)
