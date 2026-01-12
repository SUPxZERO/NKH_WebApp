<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse; // FIX: Phase 4 - Standardized responses
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\TableSession;
use App\Models\TelegramUser;
use App\Services\QrTableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * QrTableController
 * 
 * Handles QR code scanning and table session management for customers.
 * This controller is the entry point when a customer scans a table QR code.
 */
class QrTableController extends Controller
{
    use ApiResponse; // FIX: Phase 4 - Standardized responses

    public function __construct(
        protected QrTableService $qrService
    ) {}

    /**
     * Validate QR token and return table info
     * GET /api/table-scan/{token}
     * 
     * Called when customer scans a QR code. Returns table info and
     * creates/resumes a table session.
     */
    public function scan(Request $request, string $token): JsonResponse
    {
        // Verify token signature
        if (!DiningTable::verifyQrToken($token)) {
            return response()->json([
                'success' => false,
                'error' => 'invalid_token',
                'message' => 'Invalid or expired QR code. Please ask staff for assistance.',
            ], 400);
        }

        // Find table by token
        $table = DiningTable::findByQrToken($token);
        
        if (!$table) {
            return response()->json([
                'success' => false,
                'error' => 'table_not_found',
                'message' => 'Table not found. Please ask staff for assistance.',
            ], 404);
        }

        // Check if table is available or occupied (not unavailable)
        if ($table->status === DiningTable::STATUS_UNAVAILABLE) {
            return response()->json([
                'success' => false,
                'error' => 'table_unavailable',
                'message' => 'This table is currently unavailable. Please ask staff for another table.',
            ], 400);
        }

        // Get customer/telegram user from request if authenticated
        $customer = $this->getCustomerFromRequest($request);
        $telegramUser = $this->getTelegramUserFromRequest($request);

        // Get device fingerprint for session tracking
        $deviceFingerprint = $request->header('X-Device-Fingerprint') 
            ?? $request->fingerprint();
        $userAgent = $request->userAgent();
        $ipAddress = $request->ip();

        // Find or create session
        $session = TableSession::findOrCreateForTable(
            $table,
            $customer,
            $telegramUser,
            $deviceFingerprint,
            $userAgent,
            $ipAddress
        );

        // Mark table as occupied if not already
        if ($table->status === DiningTable::STATUS_AVAILABLE) {
            $table->markOccupied();
        }

        Log::info("Table QR scanned", [
            'table_id' => $table->id,
            'table_code' => $table->code,
            'session_id' => $session->id,
            'customer_id' => $customer?->id,
            'telegram_user_id' => $telegramUser?->id,
            'ip' => $ipAddress,
        ]);

        $cookie = cookie(
            'table_session',
            $session->session_token,
            240, // 4 hours
            '/',
            null,
            true, // Secure
            true, // HttpOnly
            false, // Raw
            'Strict' // SameSite
        );

        return response()->json([
            'success' => true,
            'message' => 'Welcome! You are seated at ' . $table->display_name,
            'data' => [
                'table' => [
                    'id' => $table->id,
                    'code' => $table->code,
                    'capacity' => $table->capacity,
                    'floor_name' => $table->floor?->name ?? "Floor {$table->floor_id}",
                    'location_id' => $table->floor?->location_id ?? 1, // Fallback to 1 if floor not loaded or missing
                    'display_name' => $table->display_name,
                    'status' => $table->status,
                ],
                'session' => [
                    'token' => $session->session_token,
                    'status' => $session->status,
                    'started_at' => $session->started_at->toIso8601String(),
                    'has_order' => $session->hasOrder(),
                    'order_id' => $session->order_id,
                ],
            ],
        ])->withCookie($cookie);
    }

    /**
     * Get current table session status
     * GET /api/table-session/current
     */
    public function currentSession(Request $request): JsonResponse
    {
        $sessionToken = $request->header('X-Table-Session') 
            ?? $request->cookie('table_session');

        if (!$sessionToken) {
            return response()->json([
                'success' => false,
                'error' => 'no_session',
                'message' => 'No active table session. Please scan the QR code on your table.',
            ], 400);
        }

        $session = TableSession::findByToken($sessionToken);

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'session_expired',
                'message' => 'Your session has expired. Please scan the QR code again.',
            ], 400);
        }

        // Update activity timestamp
        $session->touch();

        $table = $session->table;

        return response()->json([
            'success' => true,
            'data' => [
                'table' => [
                    'id' => $table->id,
                    'code' => $table->code,
                    'capacity' => $table->capacity,
                    'floor_name' => $table->floor?->name ?? "Floor {$table->floor_id}",
                    'display_name' => $table->display_name,
                ],
                'session' => [
                    'token' => $session->session_token,
                    'status' => $session->status,
                    'started_at' => $session->started_at->toIso8601String(),
                    'last_activity_at' => $session->last_activity_at->toIso8601String(),
                    'has_order' => $session->hasOrder(),
                    'order_id' => $session->order_id,
                ],
            ],
        ]);
    }

    /**
     * Close table session (after payment complete)
     * POST /api/table-session/close
     */
    public function closeSession(Request $request): JsonResponse
    {
        $sessionToken = $request->header('X-Table-Session') 
            ?? $request->cookie('table_session')
            ?? $request->input('session_token');

        if (!$sessionToken) {
            return response()->json([
                'success' => false,
                'error' => 'no_session',
                'message' => 'No session to close.',
            ], 400);
        }

        $session = TableSession::where('session_token', $sessionToken)->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'session_not_found',
                'message' => 'Session not found.',
            ], 404);
        }

        $table = $session->table;
        $session->close();

        // Try to reset table status
        $table->resetStatus();

        Log::info("Table session closed", [
            'session_id' => $session->id,
            'table_id' => $table->id,
            'order_id' => $session->order_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for dining with us!',
        ]);
    }

    /**
     * Update session status (for internal use)
     * POST /api/table-session/status
     */
    public function updateSessionStatus(Request $request): JsonResponse
    {
        $request->validate([
            'session_token' => 'required|string',
            'status' => 'required|in:active,ordering,payment_pending,completed',
        ]);

        $session = TableSession::where('session_token', $request->session_token)->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'session_not_found',
            ], 404);
        }

        $session->updateStatus($request->status);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $session->status,
            ],
        ]);
    }

    /**
     * Get active sessions for a table (admin endpoint)
     * GET /api/admin/tables/{table}/sessions
     */
    public function tableSessions(DiningTable $table): JsonResponse
    {
        $sessions = $table->sessions()
            ->with(['customer.user', 'telegramUser', 'order'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sessions->map(fn($s) => [
                'id' => $s->id,
                'session_token' => substr($s->session_token, 0, 16) . '...',
                'owner_name' => $s->owner_name,
                'status' => $s->status,
                'has_order' => $s->hasOrder(),
                'order_id' => $s->order_id,
                'started_at' => $s->started_at->toIso8601String(),
                'last_activity_at' => $s->last_activity_at->toIso8601String(),
                'closed_at' => $s->closed_at?->toIso8601String(),
                'is_expired' => $s->isExpired(),
            ]),
        ]);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get authenticated customer from request
     */
    protected function getCustomerFromRequest(Request $request): ?Customer
    {
        $user = $request->user();
        if ($user) {
            return Customer::where('user_id', $user->id)->first();
        }
        return null;
    }

    /**
     * Get Telegram user from request headers
     */
    protected function getTelegramUserFromRequest(Request $request): ?TelegramUser
    {
        $telegramId = $request->header('X-Telegram-User-Id');
        if ($telegramId) {
            return TelegramUser::where('telegram_id', $telegramId)->first();
        }
        return null;
    }
}
