<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\StoreAddressRequest;
use App\Http\Requests\Api\OnlineOrder\StoreOnlineOrderRequest;
use App\Http\Resources\CustomerAddressResource;
use App\Http\Resources\OrderResource;
use App\Http\Responses\ApiResponse; // Sprint 2A
use App\Http\Traits\TelegramAwareAuth;
use App\Models\Customer;
use App\Models\TableSession;
use App\Services\OrderPlacementService;
use App\Services\TimeSlotService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OnlineOrderController extends Controller
{
    use TelegramAwareAuth, ApiResponse; // Sprint 2A

    protected $orderPlacementService;
    protected $timeSlotService;

    public function __construct(
        OrderPlacementService $orderPlacementService,
        TimeSlotService $timeSlotService
    ) {
        $this->orderPlacementService = $orderPlacementService;
        $this->timeSlotService = $timeSlotService;
    }

    /**
     * GET /api/time-slots?date=YYYY-MM-DD&mode=delivery&location_id=1
     */
    public function timeSlots(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'mode' => ['required', 'in:pickup,delivery'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'interval' => ['nullable', 'integer', 'in:15,30,60'],
        ]);

        $date = $validated['date'] ?? now()->format('Y-m-d');
        $serviceType = $validated['mode'];
        $locationId = $validated['location_id'];
        $interval = $validated['interval'] ?? 30;

        $slots = $this->timeSlotService->getAvailableTimeSlots(
            $locationId,
            $serviceType,
            $date,
            $interval
        );

        $formattedSlots = $slots->map(function ($slot) use ($locationId, $serviceType) {
            return [
                'id' => md5($slot['slot_date'] . $slot['slot_time'] . $locationId . $serviceType),
                'label' => $slot['full_label'],
                'start' => $slot['slot_date'] . 'T' . $slot['slot_time'],
                'end' => $slot['slot_date'] . 'T' . $slot['slot_time'],
                'available' => $slot['is_available'],
                'location_id' => $locationId,
                'slot_date' => $slot['slot_date'],
                'slot_start_time' => $slot['slot_time'],
                'slot_type' => $serviceType,
            ];
        });

        return response()->json([
            'data' => $formattedSlots->values(),
            'total' => $formattedSlots->count(),
        ]);
    }

    // GET /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesIndex(Request $request)
    {
        $customer = $this->getCurrentCustomer($request);
        if (!$customer) {
            abort(404, __('messages.api.errors.profile_not_found'));
        }

        return CustomerAddressResource::collection($customer->addresses()->latest()->paginate());
    }

    // POST /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesStore(StoreAddressRequest $request)
    {
        $customer = $this->getCurrentCustomer($request);
        if (!$customer) {
            abort(404, __('messages.api.errors.profile_not_found'));
        }

        $payload = $request->validated();
        if ($request->filled('notes')) {
            $payload['delivery_instructions'] = $request->string('notes');
        }

        $address = $customer->addresses()->create($payload);
        return new CustomerAddressResource($address);
    }

    /**
     * POST /api/online-orders (auth:sanctum, role:customer)
     */
    public function store(StoreOnlineOrderRequest $request)
    {
        \Log::info('🛒 OnlineOrderController: store() called');

        $data = $request->validated();

        // Get Customer using unified helper
        $customer = $this->getCurrentCustomer($request);
        $tableSession = $this->getActiveTableSession($request);

        // ==================== GUEST HANDLING ====================
        if (!$customer && $tableSession && $tableSession->isValid()) {
            if ($tableSession->customer) {
                $customer = $tableSession->customer;
            } else {
                try {
                    $customer = Customer::create([
                        'name' => 'Guest ' . $tableSession->table->code,
                        'customer_code' => 'GUEST-' . strtoupper(Str::random(6)),
                    ]);
                    $tableSession->customer_id = $customer->id;
                    $tableSession->save();
                } catch (\Exception $e) {
                    \Log::error('Failed to create guest customer: ' . $e->getMessage());
                }
            }
        }

        // Telegram First Time User
        if (!$customer && $request->filled('telegram_id')) {
            $telegramId = $request->input('telegram_id');
            $telegramUser = \App\Models\TelegramUser::firstOrCreate(
                ['telegram_id' => $telegramId],
                ['is_active' => true, 'notifications_enabled' => true]
            );

            if (!$telegramUser->customer_id) {
                $newCustomer = Customer::create([
                    'user_id' => null,
                    'name' => $telegramUser->first_name ? ($telegramUser->first_name . ' ' . $telegramUser->last_name) : 'Telegram Guest',
                    'customer_code' => Customer::generateCustomerCode('TG'),
                ]);
                $telegramUser->update(['customer_id' => $newCustomer->id]);
                $customer = $newCustomer;
            } else {
                $customer = $telegramUser->customer;
            }
        }

        if (!$customer) {
            abort(401, __('messages.api.errors.scan_again'));
        }

        \Log::info('👤 Customer identified:', ['id' => $customer->id]);

        // DELEGATE TO SERVICE
        try {
            $order = $this->orderPlacementService->placeOrder(
                $data,
                $customer,
                $tableSession,
                $request->input('telegram_id')
            );

            return new OrderResource($order->load(['items.menuItem', 'customerAddress', 'timeSlot']));

        } catch (\Exception $e) {
            \Log::error('❌ Order Placement Failed:', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Get active table session from request
     */
    private function getActiveTableSession(Request $request): ?TableSession
    {
        if ($request->attributes->has('table_session')) {
            return $request->attributes->get('table_session');
        }

        $sessionToken = $request->header('X-Table-Session')
            ?? $request->cookie('table_session')
            ?? $request->input('table_session_token');

        if (!$sessionToken) {
            return null;
        }

        return TableSession::findByToken($sessionToken);
    }
}
