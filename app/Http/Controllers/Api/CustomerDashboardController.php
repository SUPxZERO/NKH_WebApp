<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\LoyaltyPointResource;
use App\Models\Customer;
use App\Models\Order;
use App\Models\TableSession;
use App\Services\Customer\CustomerOrderService;
use App\Services\Customer\CustomerProfileService;
use App\Services\Customer\CustomerLoyaltyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerDashboardController extends Controller
{
    use ApiResponse;

    protected CustomerOrderService $orderService;
    protected CustomerProfileService $profileService;
    protected CustomerLoyaltyService $loyaltyService;

    public function __construct(
        CustomerOrderService $orderService,
        CustomerProfileService $profileService,
        CustomerLoyaltyService $loyaltyService
    ) {
        $this->orderService = $orderService;
        $this->profileService = $profileService;
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Get authenticated customer from request
     */
    private function getCustomer(Request $request): ?Customer
    {
        // 1. Check direct customer relation (for logged-in Users)
        if ($request->user() && $request->user()->customer) {
            return $request->user()->customer;
        }

        // 2. Check session (for Telegram WebApp)
        $telegramData = session('telegram_user');
        if ($telegramData && isset($telegramData['customer_id'])) {
            return Customer::find($telegramData['customer_id']);
        }

        return null; // Guest or unauthenticated
    }

    /**
     * Get aggregated dashboard stats
     */
    public function dashboardStats(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer) {
            return $this->error('Customer profile not found', 404);
        }

        $stats = $this->profileService->getDashboardStats($customer);
        return $this->success($stats);
    }

    /**
     * Get customer profile
     */
    public function profile(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer) {
            return $this->error('Customer profile not found', 404);
        }

        return $this->success(new CustomerResource($customer->load(['user', 'preferredLocation'])));
    }

    /**
     * Get customer orders
     */
    public function orders(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        // Handle table session guest check
        $tableSession = null;
        if (!$customer) {
            $sessionToken = $request->header('X-Table-Session');
            if ($sessionToken) {
                $tableSession = TableSession::findByToken($sessionToken);
            }
        }

        if (!$customer && !$tableSession) {
            return $this->error('Authentication required', 401);
        }

        $orders = $this->orderService->getOrders($customer ?? new Customer(), $request, $tableSession);
        return OrderResource::collection($orders)->additional(['success' => true])->response();
    }

    /**
     * Get single order details
     */
    public function show(Request $request, string $orderId): JsonResponse
    {
        $customer = $this->getCustomer($request);

        // Handle table session guest check
        $tableSession = null;
        if (!$customer) {
            $sessionToken = $request->header('X-Table-Session');
            if ($sessionToken) {
                $tableSession = TableSession::findByToken($sessionToken);
            }
        }

        try {
            $order = $this->orderService->getOrderDetails($orderId, $customer, $tableSession);
            return $this->success(new OrderResource($order));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Order not found');
        }
    }

    /**
     * Reorder items from a past order
     */
    public function reorder(Request $request, Order $order): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer) {
            return $this->error('Authentication required', 401);
        }

        // Authorization check
        if ($order->customer_id !== $customer->id) {
            return $this->unauthorized('You cannot reorder this order');
        }

        try {
            $result = $this->orderService->reorder($order, $customer);
            return $this->success($result, 'Items added to cart');
        } catch (\Exception $e) {
            return $this->error('Reorder failed: ' . $e->getMessage());
        }
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer || $order->customer_id !== $customer->id) {
            return $this->unauthorized('You cannot cancel this order');
        }

        try {
            $order = $this->orderService->cancelOrder($order, $request->input('reason', 'Cancelled by customer'));
            return $this->success(new OrderResource($order), 'Order cancelled successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), [], 422);
        }
    }

    /**
     * Get loyalty stats
     */
    public function loyaltyStats(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer) {
            return $this->error('Authentication required', 401);
        }

        $stats = $this->loyaltyService->getLoyaltyStats($customer);
        return $this->success($stats);
    }

    /**
     * Get loyalty history
     */
    public function loyaltyHistory(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer) {
            return $this->error('Authentication required', 401);
        }

        $history = $this->loyaltyService->getHistory($customer);
        return $this->success(LoyaltyPointResource::collection($history));
    }

    /**
     * Get favorite items
     */
    public function favorites(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);

        if (!$customer) {
            return $this->error('Authentication required', 401);
        }

        $stats = $this->profileService->getStats($customer);

        return $this->success([
            'data' => $stats['favorite_items'] ?? []
        ]);
    }

    /**
     * Get notifications
     */
    public function notifications(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);
        if (!$customer)
            return $this->error('Auth required', 401);

        return $this->success($customer->notifications()->latest()->limit(15)->get());
    }

    /**
     * Get explicit favorite IDs (for UI toggles)
     */
    public function getExplicitFavorites(Request $request): JsonResponse
    {
        $customer = $this->getCustomer($request);
        if (!$customer)
            return $this->success(['data' => []]);

        // This is a simplified version, ideally moved to LoyaltyService too
        $ids = $this->loyaltyService->getFavorites($customer)->pluck('id');
        return $this->success(['data' => $ids]);
    }

    /**
     * Toggle favorite
     */
    public function toggleFavorite(Request $request): JsonResponse
    {
        // To be implemented in Service if needed, or kept here if simple
        // Identifying this as a P3 task to move to Service completely later
        return $this->success(['status' => 'success', 'message' => 'Feature pending migration']);
    }
}
