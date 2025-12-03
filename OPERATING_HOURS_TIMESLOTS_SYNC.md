# Operating Hours ↔️ Time Slots Integration - Complete

## ✅ Problem Solved

**Issue**: Operating Hours and Time Slots didn't work together automatically  
**Solution**: Complete automatic synchronization system with real-time updates

## 🔄 How They Work Together Now

### Automatic Synchronization

```
Operating Hours Changes
    ↓
Observer Detects Change
    ↓
Auto-Regenerate Time Slots
    ↓
Time Slots Always Match Operating Hours
```

### Real-Time Updates

| Action on Operating Hours | What Happens to Time Slots |
|---------------------------|----------------------------|
| **Create** new hours | Generates matching time slots |
| **Update** existing hours | Regenerates affected time slots |
| **Delete** hours | Removes related future time slots |

## 🎯 Implementation Details

### Files Created/Modified

1. **`app/Observers/OperatingHoursObserver.php`** (NEW)
   - Automatically detects when Operating Hours change
   - Triggers time slot regeneration
   - Cleans up deleted slots

2. **`app/Http/Controllers/Api/TimeSlotController.php`** (NEW)
   - View available time slots
   - Manual regeneration endpoint
   - Cleanup old slots
   - Statistical information

3. **`app/Providers/AppServiceProvider.php`** (MODIFIED)
   - Registered OperatingHoursObserver

4. **`routes/api.php`** (MODIFIED)
   - Added 4 new time slot API endpoints

## 📡 New API Endpoints

### 1. GET `/api/timeslots` - View Time Slots

**Purpose**: Get available time slots for checkout/booking

**Parameters**:
```json
{
  "location_id": 1,
  "date": "2025-12-03",
  "service_type": "pickup"  // pickup, delivery, or dine_in
}
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "location_id": 1,
      "date": "2025-12-03",
      "time": "09:00",
      "display_time": "9:00 AM",
      "type": "pickup",
      "max_orders": 10,
      "current_orders": 0,
      "available": true,
      "availability_percentage": 100
    }
  ],
  "total": 39
}
```

### 2. POST `/api/timeslots/regenerate` - Manual Regeneration

**Purpose**: Manually rebuild time slots (admin only)

**Parameters**:
```json
{
  "days": 14,
  "clear_existing": true
}
```

**Response**:
```json
{
  "message": "Time slots regenerated successfully",
  "days": 14,
  "cleared": 546,
  "output": "✅ Time slot generation complete!\n   Generated: 546 new slots"
}
```

### 3. POST `/api/timeslots/cleanup` - Remove Old Slots

**Purpose**: Clean up past time slots

**Response**:
```json
{
  "message": "Old time slots cleaned up successfully",
  "deleted": 120
}
```

### 4. GET `/api/timeslots/stats` - Statistics

**Purpose**: View time slot statistics

**Response**:
```json
{
  "data": {
    "total_slots": 546,
    "future_slots": 546,
    "past_slots": 0,
    "fully_booked": 0,
    "available": 546
  }
}
```

## 🔧 Observer Behavior

### When Operating Hours are Created:

```php
// Admin creates new operating hours in dashboard
OperatingHours::create([
    'location_id' => 1,
    'day_of_week' => 0,  // Sunday
    'service_type' => 'pickup',
    'opening_time' => '09:00:00',
    'closing_time' => '22:00:00',
]);

// Observer automatically:
// 1. Detects creation
// 2. Queues time slot generation command
// 3. Generates slots for next 14 days
```

### When Operating Hours are Updated:

```php
// Admin changes closing time
$hours->update(['closing_time' => '23:00:00']);

// Observer automatically:
// 1. Detects update
// 2. Queues regeneration
// 3. Updates future time slots to 23:00
```

### When Operating Hours are Deleted:

```php
// Admin removes pickup hours for Sunday
$hours->delete();

// Observer automatically:
// 1. Detects deletion
// 2. Removes all future Sunday pickup slots
// 3. Keeps past slots for records
```

## 🎨 Integration with Checkout

### Before (Static/Manual):
```tsx
// Checkout page shows hardcoded or manually created slots
const slots = ['09:00', '10:00', '11:00']; // ❌ Static
```

### After (Dynamic/Automatic):
```tsx
// Checkout page fetches real-time available slots
const { data } = useQuery({
  queryKey: ['timeslots', date, location],
  queryFn: () => fetch(`/api/timeslots?date=${date}&location_id=${location}`)
});

// ✅ Shows only slots based on operating hours
// ✅ Shows availability (10/10, 5/10, etc.)
// ✅ Automatically updates when operating hours change
```

## 📊 Example Workflow

### Scenario: Add Saturday Delivery Hours

1. **Admin** goes to Operating Hours page
2. Enables **Saturday** for **Delivery** service
3. Sets hours: **10:00 AM - 08:00 PM**
4. Clicks **Save**

**What Happens Automatically:**

```
1. OperatingHoursObserver detects creation ⚡
2. Queues: Artisan::queue('timeslots:generate', ['days' => 14])
3. Command runs in background 🔄
4. Generates delivery slots for all Saturdays:
   - Dec 7, 2025: 10:00, 11:00, 12:00... 20:00
   - Dec 14, 2025: 10:00, 11:00, 12:00... 20:00
   - Dec 21, 2025: 10:00, 11:00, 12:00... 20:00
   - Dec 28, 2025: 10:00, 11:00, 12:00... 20:00
5. Customers immediately see Saturday delivery slots in checkout ✅
```

## 🛠️ Manual Operations

### Regenerate All Time Slots

```bash
# Via Command Line
php artisan timeslots:generate 30

# Via API
POST /api/timeslots/regenerate
{
  "days": 30,
  "clear_existing": true
}
```

### View Current Slots

```bash
# Via API
GET /api/timeslots?location_id=1&date=2025-12-03

# Via Tinker
php artisan tinker
OrderTimeSlot::where('slot_date', today())->get();
```

### Cleanup Old Slots

```bash
# Via API
POST /api/timeslots/cleanup

# Via Command Line
php artisan tinker
OrderTimeSlot::where('slot_date', '<', today())->delete();
```

## ⚙️ Configuration

### Slot Intervals (Customizable)

Edit `app/Console/Commands/GenerateTimeSlots.php`:

```php
// Current defaults
'pickup' => 30 minutes    // 09:00, 09:30, 10:00, 10:30...
'delivery' => 60 minutes  // 09:00, 10:00, 11:00, 12:00...
'dine_in' => 60 minutes   // 09:00, 10:00, 11:00, 12:00...
```

### Max Orders per Slot (Customizable)

```php
// Current defaults
'pickup' => 10 orders/slot
'delivery' => 5 orders/slot
'dine_in' => 15 orders/slot
```

### Auto-Generation Schedule

Edit `app/Console/Kernel.php`:

```php
// Current: Daily at 12:01 AM for next 7 days
$schedule->command('timeslots:generate 7')
    ->daily()
    ->at('00:01');

// Change as needed
->at('06:00')  // 6 AM instead
->twiceDaily(1, 13)  // 1 AM and 1 PM
```

## 📈 Performance Considerations

### Observer Uses Queue

The observer uses `Artisan::queue()` instead of `Artisan::call()`:

```php
// Good ✅ - Non-blocking
Artisan::queue('timeslots:generate', ['days' => 14]);

// Bad ❌ - Blocks the request
Artisan::call('timeslots:generate', ['days' => 14]);
```

This means:
- Operating Hours updates return immediately
- Time slot generation happens in background
- No delay for admin users
- Requires queue worker to be running

### Queue Worker Setup

For production:
```bash
# Run queue worker
php artisan queue:work

# Or use Supervisor for persistent worker
```

For development:
```bash
# Process queued jobs immediately
php artisan queue:listen
```

## 🎯 Benefits

| Feature | Before | After |
|---------|---------|--------|
| **Sync Method** | Manual | Automatic ✅ |
| **Update Speed** | Hours/Days | Immediate ✅ |
| **Data Accuracy** | Often out of sync | Always in sync ✅ |
| **Admin Effort** | High (manual updates) | Zero ✅ |
| **Customer Experience** | May see unavailable slots | Always accurate ✅ |

## 🚨 Troubleshooting

### Slots Not Updating After Operating Hours Change

**Check**:
1. Is observer registered? `php artisan tinker` → `app()->getProvider('App\Providers\AppServiceProvider')`
2. Is queue worker running? `php artisan queue:work`
3. Check logs: `storage/logs/laravel.log`

**Solution**:
```bash
# Clear cache
php artisan cache:clear

# Restart queue worker
php artisan queue:restart

# Manually regenerate
php artisan timeslots:generate 14
```

### No Slots Available for Certain Days

**Check**:
1. Are Operating Hours configured for that day?
2. Check `operating_hours` table:
   ```sql
   SELECT * FROM operating_hours WHERE location_id = 1;
   ```

**Solution**:
```bash
# Add operating hours in dashboard, or manually:
php artisan tinker
OperatingHours::create([...]);
```

### Too Many/Too Few Slots

**Check interval settings** in `GenerateTimeSlots.php`

**Solution**: Adjust intervals and regenerate

## 📝 Logging

All synchronization events are logged:

```
[2025-12-03T14:00:00] Operating hours created, regenerating time slots
  location_id: 1
  day_of_week: 0
  service_type: pickup

[2025-12-03T14:00:05] Time slot generation queued
  days: 14
  
[2025-12-03T14:00:10] ✅ Generated 546 new time slots
```

View logs:
```bash
tail -f storage/logs/laravel.log
tail -f storage/logs/timeslots.log
```

## ✨ Summary

Your Operating Hours and Time Slots now work together **perfectly**:

1. ✅ **Automatic Sync** - No manual work needed
2. ✅ **Real-Time Updates** - Changes reflect immediately
3. ✅ **Observer Pattern** - Detects all changes
4. ✅ **Queue Processing** - Non-blocking background jobs
5. ✅ **API Endpoints** - Full programmatic control
6. ✅ **Manual Override** - Can regenerate anytime
7. ✅ **Cleanup Tools** - Remove old data

**Status**: 🟢 Fully Operational

The system is now **production-ready** and will automatically keep time slots in perfect sync with your operating hours! 🎉
