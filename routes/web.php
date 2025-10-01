<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Customer routes
Route::get('/', fn () => Inertia::render('Customer/Home'))->name('customer.home');
Route::get('/dashboard', fn () => Inertia::render('Customer/Dashboard'))->middleware('auth')->name('customer.dashboard');
Route::get('/menu', fn () => Inertia::render('Customer/Menu'))->name('customer.menu');
Route::get('/cart', fn () => Inertia::render('Customer/Cart'))->name('customer.cart');
Route::get('/checkout', fn () => Inertia::render('Customer/Checkout'))->name('customer.checkout');
Route::get('/orders/{order}', fn () => Inertia::render('Customer/OrderDetail'))->name('customer.order.detail');
Route::get('/track/{orderId}', fn () => Inertia::render('Customer/OrderTracking'))->name('customer.order.track');

// Auth routes are handled in auth.php
Route::get('/login', fn () => Inertia::render('Auth/SignIn'))->name('login');
Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');

// Employee routes
// Route::prefix('employee')->middleware(['auth', 'role:employee'])->group(function () {
//     Route::get('pos', fn () => Inertia::render('Employee/POS'))->name('employee.pos');
// });

// Admin routes
// Route::prefix('admin')->middleware(['auth', 'role:admin'])->group(function () {
//     Route::get('dashboard', fn () => Inertia::render('Admin/Dashboard'))->name('admin.dashboard');
//     Route::get('categories', fn () => Inertia::render('Admin/Categories'))->name('admin.categories');
//     Route::get('sub-categories', fn () => Inertia::render('Admin/SubCategories'))->name('admin.sub-categories');
//     Route::get('employees', fn () => Inertia::render('Admin/Employees'))->name('admin.employees');
//     Route::get('customers', fn () => Inertia::render('Admin/Customers'))->name('admin.customers');
//     Route::get('expenses', fn () => Inertia::render('Admin/Expenses'))->name('admin.expenses');
//     Route::get('floors', fn () => Inertia::render('Admin/Floors'))->name('admin.floors');
//     Route::get('tables', fn () => Inertia::render('Admin/Tables'))->name('admin.tables');
//     Route::get('invoices', fn () => Inertia::render('Admin/Invoices'))->name('admin.invoices');
//     Route::get('reservations', fn () => Inertia::render('Admin/Reservations'))->name('admin.reservations');
//     Route::get('settings', fn () => Inertia::render('Admin/Settings'))->name('admin.settings');
//     Route::get('customer-requests', fn () => Inertia::render('Admin/CustomerRequests'))->name('admin.customer-requests');
// });

Route::prefix('admin')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('Admin/Dashboard'))->name('admin.dashboard');
    Route::get('categories', fn () => Inertia::render('Admin/Categories'))->name('admin.categories');
    Route::get('menu-items', fn () => Inertia::render('Admin/MenuItems'))->name('admin.menu-items');
    Route::get('employees', fn () => Inertia::render('Admin/Employees'))->name('admin.employees');
    Route::get('customers', fn () => Inertia::render('Admin/Customers'))->name('admin.customers');
    Route::get('orders', fn () => Inertia::render('Admin/Orders'))->name('admin.orders');
    Route::get('expenses', fn () => Inertia::render('Admin/Expenses'))->name('admin.expenses');
    Route::get('floors', fn () => Inertia::render('Admin/Floors'))->name('admin.floors');
    Route::get('tables', fn () => Inertia::render('Admin/Tables'))->name('admin.tables');
    Route::get('invoices', fn () => Inertia::render('Admin/Invoices'))->name('admin.invoices');
    Route::get('reservations', fn () => Inertia::render('admin/Reservations'))->name('admin.reservations');
    Route::get('inventory', fn () => Inertia::render('Admin/Inventory'))->name('admin.inventory');
    Route::get('loyalty-points', fn () => Inertia::render('Admin/LoyaltyPoints'))->name('admin.loyalty-points');
    Route::get('promotions', fn () => Inertia::render('Admin/Promotions'))->name('admin.promotions');
    Route::get('notifications', fn () => Inertia::render('Admin/Notifications'))->name('admin.notifications');
    Route::get('audit-logs', fn () => Inertia::render('Admin/AuditLogs'))->name('admin.audit-logs');
    Route::get('settings', fn () => Inertia::render('Admin/Settings'))->name('admin.settings');
    Route::get('customer-requests', fn () => Inertia::render('Admin/CustomerRequests'))->name('admin.customer-requests');
});

Route::prefix('employee')->group(function () {
    Route::get('pos', fn () => Inertia::render('Employee/POS'))->name('employee.pos');
});

// Test time slots seeder
Route::get('/test-time-slots', function () {
    try {
        echo "<h2>⏰ Testing Order Time Slots Seeder</h2>";
        
        // Check current time slots
        $timeSlotCount = \App\Models\OrderTimeSlot::count();
        echo "⏰ Current time slots: {$timeSlotCount}<br>";
        
        // Run the seeder
        echo "Running OrderTimeSlotSeeder...<br>";
        (new \Database\Seeders\OrderTimeSlotSeeder())->run();
        echo "✅ OrderTimeSlotSeeder completed<br>";
        
        $newCount = \App\Models\OrderTimeSlot::count();
        echo "📊 Total time slots after seeding: {$newCount}<br>";
        
        // Show some time slots
        $timeSlots = \App\Models\OrderTimeSlot::where('slot_date', now()->format('Y-m-d'))->limit(10)->get();
        echo "<h3>📅 Today's Time Slots ({$timeSlots->count()} shown):</h3>";
        foreach ($timeSlots as $slot) {
            echo "- {$slot->slot_type}: {$slot->slot_start_time} - {$slot->slot_end_time} (Max: {$slot->max_orders})<br>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test local menu item seeder
Route::get('/test-menu-local', function () {
    try {
        echo "<h2>🧪 Testing Local Menu Item Seeder</h2>";
        
        // Check current menu items
        $menuItemCount = \App\Models\MenuItem::count();
        echo "🍽️ Current menu items: {$menuItemCount}<br>";
        
        // Check categories
        $categoryCount = \App\Models\Category::count();
        echo "📂 Available categories: {$categoryCount}<br>";
        
        // Show some category slugs
        $categories = \App\Models\Category::limit(10)->get();
        echo "Sample category slugs: ";
        foreach ($categories as $cat) {
            echo $cat->slug . ", ";
        }
        echo "<br><br>";
        
        // Run the seeder
        echo "Running MenuItemSeederLocal...<br>";
        (new \Database\Seeders\MenuItemSeederLocal())->run();
        echo "✅ MenuItemSeederLocal completed<br>";
        
        $newCount = \App\Models\MenuItem::count();
        echo "📊 Total menu items after seeding: {$newCount}<br>";
        
        // Show menu items with local images
        $menuItems = \App\Models\MenuItem::whereNotNull('image_path')->with('category')->limit(15)->get();
        echo "<h3>🖼️ Menu Items with Local Images ({$menuItems->count()} items):</h3>";
        foreach ($menuItems as $item) {
            echo "<div style='margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;'>";
            echo "<strong>{$item->slug}</strong> - \${$item->price} ";
            if ($item->is_popular) echo "<span style='color: red;'>⭐ POPULAR</span>";
            echo "<br>Category: {$item->category->slug}<br>";
            echo "Image: <a href='{$item->image_path}' target='_blank'><img src='{$item->image_path}' style='width: 100px; height: 75px; object-fit: cover;'></a>";
            echo "</div>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test final menu item seeder
Route::get('/test-menu-final', function () {
    try {
        echo "<h2>🧪 Testing Final Menu Item Seeder</h2>";
        
        // Check current menu items
        $menuItemCount = \App\Models\MenuItem::count();
        echo "🍽️ Current menu items: {$menuItemCount}<br>";
        
        // Check categories
        $categoryCount = \App\Models\Category::count();
        echo "📂 Available categories: {$categoryCount}<br>";
        
        // Show some category slugs
        $categories = \App\Models\Category::limit(10)->get();
        echo "Sample category slugs: ";
        foreach ($categories as $cat) {
            echo $cat->slug . ", ";
        }
        echo "<br><br>";
        
        // Run the seeder
        echo "Running MenuItemSeederFinal...<br>";
        (new \Database\Seeders\MenuItemSeederFinal())->run();
        echo "✅ MenuItemSeederFinal completed<br>";
        
        $newCount = \App\Models\MenuItem::count();
        echo "📊 Total menu items after seeding: {$newCount}<br>";
        
        // Show menu items with images
        $menuItems = \App\Models\MenuItem::whereNotNull('image_path')->with('category')->limit(15)->get();
        echo "<h3>🖼️ Menu Items with Images ({$menuItems->count()} items):</h3>";
        foreach ($menuItems as $item) {
            echo "<div style='margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;'>";
            echo "<strong>{$item->slug}</strong> - \${$item->price} ";
            if ($item->is_popular) echo "<span style='color: red;'>⭐ POPULAR</span>";
            echo "<br>Category: {$item->category->slug}<br>";
            echo "Image: <a href='{$item->image_path}' target='_blank'><img src='{$item->image_path}' style='width: 100px; height: 75px; object-fit: cover;'></a>";
            echo "</div>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test new menu item seeder with images
Route::get('/test-menu-images', function () {
    try {
        echo "<h2>🧪 Testing Menu Item Seeder With Images</h2>";
        
        // Check current menu items
        $menuItemCount = \App\Models\MenuItem::count();
        echo "🍽️ Current menu items: {$menuItemCount}<br>";
        
        // Check categories
        $categoryCount = \App\Models\Category::count();
        echo "📂 Available categories: {$categoryCount}<br>";
        
        // Run the seeder
        echo "Running MenuItemSeederWithImages...<br>";
        (new \Database\Seeders\MenuItemSeederWithImages())->run();
        echo "✅ MenuItemSeederWithImages completed<br>";
        
        $newCount = \App\Models\MenuItem::count();
        echo "📊 Total menu items after seeding: {$newCount}<br>";
        
        // Show menu items with images
        $menuItems = \App\Models\MenuItem::whereNotNull('image_path')->with('category')->limit(10)->get();
        echo "<h3>Menu Items with Images:</h3>";
        foreach ($menuItems as $item) {
            echo "- <strong>{$item->slug}</strong> (\${$item->price}) - Category: {$item->category->slug}<br>";
            echo "&nbsp;&nbsp;Image: <a href='{$item->image_path}' target='_blank'>{$item->image_path}</a><br><br>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test ingredient seeder
Route::get('/test-ingredients', function () {
    try {
        echo "<h2>🧪 Testing Ingredient Seeder</h2>";
        
        // Check current ingredients
        $ingredientCount = \App\Models\Ingredient::count();
        echo "🥘 Current ingredients: {$ingredientCount}<br>";
        
        // Check locations
        $locationCount = \App\Models\Location::count();
        echo "📍 Available locations: {$locationCount}<br>";
        
        // Run the seeder
        echo "Running IngredientSeeder...<br>";
        (new \Database\Seeders\IngredientSeeder())->run();
        echo "✅ IngredientSeeder completed<br>";
        
        $newCount = \App\Models\Ingredient::count();
        echo "📊 Total ingredients after seeding: {$newCount}<br>";
        
        // Show some ingredients
        $ingredients = \App\Models\Ingredient::limit(5)->get();
        foreach ($ingredients as $ingredient) {
            echo "- {$ingredient->name} ({$ingredient->quantity_on_hand} {$ingredient->unit}) - \${$ingredient->cost}<br>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test menu item seeder
Route::get('/test-menu-items', function () {
    try {
        echo "<h2>🧪 Testing Menu Item Seeder</h2>";
        
        // Check current menu items
        $menuItemCount = \App\Models\MenuItem::count();
        echo "🍽️ Current menu items: {$menuItemCount}<br>";
        
        // Check categories
        $categoryCount = \App\Models\Category::count();
        echo "📂 Available categories: {$categoryCount}<br>";
        
        // Check locations
        $locationCount = \App\Models\Location::count();
        echo "📍 Available locations: {$locationCount}<br>";
        
        // Run the seeder
        echo "Running MenuItemSeederFixed...<br>";
        (new \Database\Seeders\MenuItemSeederFixed())->run();
        echo "✅ MenuItemSeederFixed completed<br>";
        
        $newCount = \App\Models\MenuItem::count();
        echo "📊 Total menu items after seeding: {$newCount}<br>";
        
        // Show some menu items
        $menuItems = \App\Models\MenuItem::with('category')->limit(5)->get();
        foreach ($menuItems as $item) {
            echo "- {$item->slug} (\${$item->price}) - Category: {$item->category->slug}<br>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test category seeder
Route::get('/test-categories', function () {
    try {
        echo "<h2>🧪 Testing Category Seeder</h2>";
        
        // Check current categories
        $categoryCount = \App\Models\Category::count();
        echo "📂 Current categories: {$categoryCount}<br>";
        
        // Check locations
        $locationCount = \App\Models\Location::count();
        echo "📍 Available locations: {$locationCount}<br>";
        
        // Run the seeder
        echo "Running CategorySeederFixed...<br>";
        (new \Database\Seeders\CategorySeederFixed())->run();
        echo "✅ CategorySeederFixed completed<br>";
        
        $newCount = \App\Models\Category::count();
        echo "📊 Total categories after seeding: {$newCount}<br>";
        
        // Show some categories
        $categories = \App\Models\Category::limit(5)->get();
        foreach ($categories as $category) {
            echo "- {$category->slug} (Location: {$category->location_id})<br>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test user seeder
Route::get('/test-users', function () {
    try {
        echo "<h2>🧪 Testing User Seeder</h2>";
        
        // Check current users
        $userCount = \App\Models\User::count();
        echo "👥 Current users: {$userCount}<br>";
        
        // Run the seeder
        echo "Running UserSeeder...<br>";
        (new \Database\Seeders\UserSeeder())->run();
        echo "✅ UserSeeder completed<br>";
        
        $newCount = \App\Models\User::count();
        echo "📊 Total users after seeding: {$newCount}<br>";
        
        // Show some users
        $users = \App\Models\User::with('roles')->limit(5)->get();
        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->join(', ');
            echo "- {$user->name} ({$user->email}) - Roles: {$roles}<br>";
        }
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Test position seeder
Route::get('/test-positions', function () {
    try {
        echo "<h2>🧪 Testing Position Seeder</h2>";
        
        // Test creating a position directly
        $position = \App\Models\Position::create([
            'title' => 'Test Position',
            'description' => 'Test description',
            'is_active' => true,
        ]);
        
        echo "✅ Test position created with ID: {$position->id}<br>";
        
        // Run the seeder
        echo "Running PositionSeeder...<br>";
        (new \Database\Seeders\PositionSeeder())->run();
        echo "✅ PositionSeeder completed<br>";
        
        $count = \App\Models\Position::count();
        echo "📊 Total positions: {$count}<br>";
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Simple test route
Route::get('/test-db', function () {
    try {
        echo "<h2>🧪 Database Connection Test</h2>";
        
        // Test database connection
        $locationCount = \App\Models\Location::count();
        echo "📍 Current locations: {$locationCount}<br>";
        
        // Try to create a simple location
        $location = \App\Models\Location::create([
            'code' => 'TEST-' . time(),
            'name' => 'Test Location',
            'address_line1' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'Test Country',
            'phone' => '+1-234-567-8900',
            'is_active' => true,
            'accepts_online_orders' => true,
            'accepts_pickup' => true,
            'accepts_delivery' => true,
        ]);
        
        echo "✅ Test location created with ID: {$location->id}<br>";
        echo "📊 Total locations now: " . \App\Models\Location::count() . "<br>";
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        echo "Stack trace: " . nl2br($e->getTraceAsString());
    }
});

// Database summary route
Route::get('/database-summary', function () {
    try {
        echo "<h1>🎉 NKH Restaurant Database Summary</h1>";
        
        // Get counts
        $locations = \App\Models\Location::count();
        $positions = \App\Models\Position::count();
        $users = \App\Models\User::count();
        $categories = \App\Models\Category::count();
        $menuItems = \App\Models\MenuItem::count();
        $menuItemsWithImages = \App\Models\MenuItem::whereNotNull('image_path')->count();
        $ingredients = \App\Models\Ingredient::count();
        
        echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;'>";
        
        echo "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
        echo "<h3>📍 Locations</h3><h2>{$locations}</h2></div>";
        
        echo "<div style='background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
        echo "<h3>👔 Positions</h3><h2>{$positions}</h2></div>";
        
        echo "<div style='background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
        echo "<h3>📂 Categories</h3><h2>{$categories}</h2></div>";
        
        echo "<div style='background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
        echo "<h3>🍽️ Menu Items</h3><h2>{$menuItems}</h2><small>({$menuItemsWithImages} with images)</small></div>";
        
        echo "<div style='background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
        echo "<h3>🥘 Ingredients</h3><h2>{$ingredients}</h2></div>";
        
        echo "</div>";
        
        // Show popular menu items with images
        $popularItems = \App\Models\MenuItem::where('is_popular', true)->whereNotNull('image_path')->with('category')->get();
        if ($popularItems->count() > 0) {
            echo "<h2>⭐ Popular Menu Items</h2>";
            echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;'>";
            foreach ($popularItems as $item) {
                echo "<div style='border: 2px solid #ff6b6b; border-radius: 15px; padding: 15px; background: white;'>";
                echo "<img src='{$item->image_path}' style='width: 100%; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;'>";
                echo "<h3 style='color: #ff6b6b; margin: 0;'>{$item->slug}</h3>";
                echo "<p style='color: #666; margin: 5px 0;'>Category: {$item->category->slug}</p>";
                echo "<p style='color: #333; font-size: 18px; font-weight: bold; margin: 0;'>\${$item->price}</p>";
                echo "</div>";
            }
            echo "</div>";
        }
        
        // Show sample menu by category
        $sampleCategories = ['appetizers', 'main-dishes', 'desserts', 'beverages'];
        foreach ($sampleCategories as $categorySlug) {
            $category = \App\Models\Category::where('slug', $categorySlug)->first();
            if ($category) {
                $items = \App\Models\MenuItem::where('category_id', $category->id)->whereNotNull('image_path')->limit(3)->get();
                if ($items->count() > 0) {
                    echo "<h2>🍽️ " . ucwords(str_replace('-', ' ', $categorySlug)) . "</h2>";
                    echo "<div style='display: flex; gap: 15px; overflow-x: auto; padding: 10px 0;'>";
                    foreach ($items as $item) {
                        echo "<div style='min-width: 250px; border: 1px solid #ddd; border-radius: 10px; padding: 10px; background: white;'>";
                        echo "<img src='{$item->image_path}' style='width: 100%; height: 150px; object-fit: cover; border-radius: 8px;'>";
                        echo "<h4 style='margin: 10px 0 5px 0;'>{$item->slug}</h4>";
                        echo "<p style='color: #666; margin: 0; font-size: 16px; font-weight: bold;'>\${$item->price}</p>";
                        echo "</div>";
                    }
                    echo "</div>";
                }
            }
        }
        
        echo "<div style='margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; text-align: center;'>";
        echo "<h2>🎉 Database Successfully Seeded!</h2>";
        echo "<p>Your NKH Restaurant Management System is now populated with comprehensive data including high-quality images from Unsplash.</p>";
        echo "</div>";
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage();
    }
});

// Database seeding route (for development only)
Route::get('/seed-database', function () {
    // Remove environment check for now to test seeding
    // if (app()->environment('local', 'development')) {
        try {
            echo "🚀 Starting NKH Restaurant Database Seeding...<br><br>";
            
            echo "📍 Seeding Locations...<br>";
            (new \Database\Seeders\LocationSeeder())->run();
            echo "✅ Locations seeded successfully!<br><br>";

            echo "👔 Seeding Positions...<br>";
            (new \Database\Seeders\PositionSeeder())->run();
            echo "✅ Positions seeded successfully!<br><br>";

            echo "👥 Seeding Users...<br>";
            (new \Database\Seeders\UserSeeder())->run();
            echo "✅ Users seeded successfully!<br><br>";

            echo "📂 Seeding Categories...<br>";
            (new \Database\Seeders\CategorySeederFixed())->run();
            echo "✅ Categories seeded successfully!<br><br>";

            echo "🌐 Seeding Category Translations...<br>";
            (new \Database\Seeders\CategoryTranslationSeeder())->run();
            echo "✅ Category Translations seeded successfully!<br><br>";

            echo "🍽️ Seeding Menu Items...<br>";
            (new \Database\Seeders\MenuItemSeederLocal())->run();
            echo "✅ Menu Items seeded successfully!<br><br>";

            echo "🌐 Seeding Menu Item Translations...<br>";
            (new \Database\Seeders\MenuItemTranslationSeeder())->run();
            echo "✅ Menu Item Translations seeded successfully!<br><br>";

            echo "🥘 Seeding Ingredients...<br>";
            (new \Database\Seeders\IngredientSeeder())->run();
            echo "✅ Ingredients seeded successfully!<br><br>";

            echo "🏢 Seeding Floors...<br>";
            (new \Database\Seeders\FloorSeeder())->run();
            echo "✅ Floors seeded successfully!<br><br>";

            echo "🪑 Seeding Tables...<br>";
            (new \Database\Seeders\TableSeeder())->run();
            echo "✅ Tables seeded successfully!<br><br>";

            echo "👥 Seeding Employees...<br>";
            (new \Database\Seeders\EmployeeSeeder())->run();
            echo "✅ Employees seeded successfully!<br><br>";

            echo "🛍️ Seeding Customers...<br>";
            (new \Database\Seeders\CustomerSeeder())->run();
            echo "✅ Customers seeded successfully!<br><br>";

            echo "💳 Seeding Payment Methods...<br>";
            (new \Database\Seeders\PaymentMethodSeeder())->run();
            echo "✅ Payment Methods seeded successfully!<br><br>";

            echo "🛒 Seeding Orders...<br>";
            (new \Database\Seeders\OrderSeeder())->run();
            echo "✅ Orders seeded successfully!<br><br>";

            echo "📋 Seeding Order Items...<br>";
            (new \Database\Seeders\OrderItemSeeder())->run();
            echo "✅ Order Items seeded successfully!<br><br>";

            echo "🧾 Seeding Invoices...<br>";
            (new \Database\Seeders\InvoiceSeeder())->run();
            echo "✅ Invoices seeded successfully!<br><br>";

            echo "💰 Seeding Payments...<br>";
            (new \Database\Seeders\PaymentSeeder())->run();
            echo "✅ Payments seeded successfully!<br><br>";

            echo "📅 Seeding Reservations...<br>";
            (new \Database\Seeders\ReservationSeeder())->run();
            echo "✅ Reservations seeded successfully!<br><br>";

            echo "⏰ Seeding Order Time Slots...<br>";
            (new \Database\Seeders\OrderTimeSlotSeeder())->run();
            echo "✅ Order Time Slots seeded successfully!<br><br>";

            echo "<strong>🎉 COMPLETE DATABASE SEEDING FINISHED!</strong><br>";
            echo "📊 Your NKH Restaurant Management System is now populated with realistic data.<br><br>";
            
            // Show counts
            echo "<strong>📈 Data Summary:</strong><br>";
            echo "- Locations: " . \App\Models\Location::count() . "<br>";
            echo "- Users: " . \App\Models\User::count() . "<br>";
            echo "- Positions: " . \App\Models\Position::count() . "<br>";
            echo "- Categories: " . \App\Models\Category::count() . "<br>";
            echo "- Menu Items: " . \App\Models\MenuItem::count() . "<br>";
            
        } catch (\Exception $e) {
            echo "❌ Error during seeding: " . $e->getMessage() . "<br>";
            echo "Stack trace: " . nl2br($e->getTraceAsString());
        }
    // } else {
    //     echo "This route is only available in development environment.";
    // }
});

// Database verification route
Route::get('/verify-data', function () {
    echo "<h2>🔍 NKH Restaurant Database Verification</h2>";
    echo "<style>body{font-family:Arial;margin:20px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;}</style>";
    
    try {
        echo "<table>";
        echo "<tr><th>Table</th><th>Count</th><th>Status</th></tr>";
        
        $locations = \App\Models\Location::count();
        echo "<tr><td>Locations</td><td>{$locations}</td><td>" . ($locations > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $users = \App\Models\User::count();
        echo "<tr><td>Users</td><td>{$users}</td><td>" . ($users > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $positions = \App\Models\Position::count();
        echo "<tr><td>Positions</td><td>{$positions}</td><td>" . ($positions > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $categories = \App\Models\Category::count();
        echo "<tr><td>Categories</td><td>{$categories}</td><td>" . ($categories > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $menuItems = \App\Models\MenuItem::count();
        echo "<tr><td>Menu Items</td><td>{$menuItems}</td><td>" . ($menuItems > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $ingredients = \App\Models\Ingredient::count();
        echo "<tr><td>Ingredients</td><td>{$ingredients}</td><td>" . ($ingredients > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $floors = \App\Models\Floor::count();
        echo "<tr><td>Floors</td><td>{$floors}</td><td>" . ($floors > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $tables = \App\Models\DiningTable::count();
        echo "<tr><td>Tables</td><td>{$tables}</td><td>" . ($tables > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $employees = \App\Models\Employee::count();
        echo "<tr><td>Employees</td><td>{$employees}</td><td>" . ($employees > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $customers = \App\Models\Customer::count();
        echo "<tr><td>Customers</td><td>{$customers}</td><td>" . ($customers > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $orders = \App\Models\Order::count();
        echo "<tr><td>Orders</td><td>{$orders}</td><td>" . ($orders > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $invoices = \App\Models\Invoice::count();
        echo "<tr><td>Invoices</td><td>{$invoices}</td><td>" . ($invoices > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $payments = \App\Models\Payment::count();
        echo "<tr><td>Payments</td><td>{$payments}</td><td>" . ($payments > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        $reservations = \App\Models\Reservation::count();
        echo "<tr><td>Reservations</td><td>{$reservations}</td><td>" . ($reservations > 0 ? "✅ Seeded" : "❌ Empty") . "</td></tr>";
        
        echo "</table>";
        
        if ($locations > 0 && $users > 0 && $categories > 0 && $menuItems > 0) {
            echo "<br><h3 style='color:green;'>🎉 Database Successfully Seeded!</h3>";
            echo "<p><strong>Your NKH Restaurant Management System is ready!</strong></p>";
            echo "<p>Login credentials:</p>";
            echo "<ul>";
            echo "<li><strong>Admin:</strong> admin@nkhrestaurant.com / admin123</li>";
            echo "<li><strong>Manager:</strong> sophea.chen@nkhrestaurant.com / manager123</li>";
            echo "<li><strong>Employee:</strong> ratha.meng@nkhrestaurant.com / employee123</li>";
            echo "</ul>";
            echo "<p><a href='/admin/dashboard' style='background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Access Admin Dashboard</a></p>";
        } else {
            echo "<br><h3 style='color:red;'>❌ Database Not Fully Seeded</h3>";
            echo "<p><a href='/seed-database' style='background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Run Database Seeding</a></p>";
        }
        
    } catch (\Exception $e) {
        echo "<tr><td colspan='3' style='color:red;'>Error: " . $e->getMessage() . "</td></tr>";
        echo "</table>";
    }
});




Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
