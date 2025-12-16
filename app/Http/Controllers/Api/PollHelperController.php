<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Notification; // Assuming standard notification model or custom one
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PollHelperController extends Controller
{
    /**
     * Light-weight endpoint to check for updates.
     * Clients send a list of 'modules' they are interested in.
     * Server returns the last_updated timestamp (or count) for each.
     * 
     * GET /api/poll-helper/sync-state?modules=orders,tables,kitchen
     */
    public function syncState(Request $request): JsonResponse
    {
        $modules = explode(',', $request->query('modules', ''));
        $response = [];
        $user = $request->user();
        
        // Scope to location if user has one (assuming employee/admin)
        $locationId = $user->employee->location_id ?? null; // Adjust based on actual User-Employee relation
        
        // If user is a customer, logic might differ, but assuming this is mostly for staff/admin for now as per plan
        // detailed logic:
        
        foreach ($modules as $module) {
            switch (trim($module)) {
                case 'orders':
                    // Global orders check (for Admin/Manager)
                    // Efficiently get the latest updated_at
                    $query = Order::query();
                    if ($locationId) {
                        $query->where('location_id', $locationId);
                    }
                    $lastUpdated = $query->max('updated_at');
                    $response['orders'] = $lastUpdated;
                    break;

                case 'kitchen':
                    // Kitchen only cares about active orders
                    $query = Order::query()->whereIn('status', ['pending', 'received', 'preparing', 'ready']);
                    if ($locationId) {
                        $query->where('location_id', $locationId);
                    }
                    $lastUpdated = $query->max('updated_at');
                    $response['kitchen'] = $lastUpdated;
                    break;
                    
                case 'tables':
                    // Table status updates
                    $query = DiningTable::query();
                    if ($locationId) {
                        $query->whereHas('floor', function($q) use ($locationId) {
                            $q->where('location_id', $locationId);
                        });
                    }
                    $lastUpdated = $query->max('updated_at');
                    $response['tables'] = $lastUpdated;
                    break;

                case 'admin-notifications':
                   // Notification count for the authenticated user
                   // Using the standard Laravel notification table or Custom?
                   // Checking routes... NotificationController::unreadCount uses $user->unreadNotifications()->count() usually
                   $count = $user->unreadNotifications()->count();
                   // We return count + latest timestamp to be safe, or just count
                   // For polling, if count changes or latest timestamp changes, we fetch.
                   // Let's return a composite or just the latest created_at
                   $lastNotif = $user->unreadNotifications()->latest()->first();
                   $response['admin-notifications'] = [
                       'count' => $count,
                       'latest' => $lastNotif ? $lastNotif->created_at : null
                   ];
                   break;
                
                case 'customer-orders':
                    // For a specific customer (if logged in as customer)
                    if ($user->role === 'customer') {
                         $lastUpdated = Order::where('customer_id', $user->customer->id ?? 0)->max('updated_at');
                         $response['customer-orders'] = $lastUpdated;
                    }
                    break;
            }
        }
        
        return response()->json([
            'data' => $response,
            'timestamp' => now()->toIso8601String() // Server time for reference
        ]);
    }
}
