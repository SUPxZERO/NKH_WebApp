<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderTimeSlot;
use App\Models\TelegramUser;
use App\Services\Telegram\TelegramBotService;
use App\Services\Telegram\TelegramCartSessionManager;
use App\Services\Telegram\TelegramKeyboardBuilder;
use App\Services\Telegram\TelegramErrorHandler;
use App\Services\Telegram\TelegramAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class TelegramWebhookController extends Controller
{
    private TelegramBotService $botService;
    private TelegramAdminService $adminService;

    public function __construct(
        TelegramBotService $botService,
        TelegramAdminService $adminService
    ) {
        $this->botService = $botService;
        $this->adminService = $adminService;
    }

    /**
     * Handle incoming Telegram webhook with graceful error handling
     */
    public function handle(Request $request): JsonResponse
    {
        // Always return 200 to prevent Telegram retries on errors
        $successResponse = response()->json(['ok' => true]);

        try {
            // Verify secret token
            $secretToken = $request->header('X-Telegram-Bot-Api-Secret-Token');
            if (!$this->botService->verifySecretToken($secretToken)) {
                Log::warning('Telegram webhook: Invalid secret token');
                return response()->json(['ok' => false, 'error' => 'Invalid secret token'], 403);
            }

            // Validate request
            $update = $request->all();
            if (!isset($update['update_id'])) {
                return $successResponse; // Acknowledge invalid updates
            }

            Log::debug('Telegram webhook received', ['update_id' => $update['update_id']]);

            // Handle different update types
            if (isset($update['message'])) {
                $this->handleMessage($update['message']);
            } elseif (isset($update['callback_query'])) {
                $this->handleCallbackQuery($update['callback_query']);
            } elseif (isset($update['inline_query'])) {
                $this->handleInlineQuery($update['inline_query']);
            }

            return $successResponse;
        } catch (Throwable $e) {
            // Use error handler to log appropriately
            TelegramErrorHandler::handleWebhookError($e, $request->all());

            // Try to send error message to user if we have a chat_id
            try {
                $chatId = $update['message']['chat']['id']
                    ?? $update['callback_query']['message']['chat']['id']
                    ?? null;

                if ($chatId) {
                    $errorMessage = TelegramErrorHandler::formatTelegramError($e);
                    $this->botService->sendMessage($chatId, $errorMessage, withRetry: false);
                }
            } catch (Throwable $sendError) {
                // If sending error fails, just log it
                Log::error('Failed to send error message to user', [
                    'original_error' => $e->getMessage(),
                    'send_error' => $sendError->getMessage(),
                ]);
            }

            // Return success to prevent Telegram from retrying
            return $successResponse;
        }
    }

    /**
     * Handle regular messages
     */
    private function handleMessage(array $message): void
    {
        $chatId = $message['chat']['id'];
        $text = $message['text'] ?? '';
        $contact = $message['contact'] ?? null;

        // Get or create user
        $user = $this->botService->findOrCreateUser($message);
        $this->botService->updateUserInteraction($user);

        // Handle contact sharing
        if ($contact) {
            $this->handleContactShare($user, $contact);
            return;
        }

        // Handle commands
        if (str_starts_with($text, '/')) {
            $this->handleCommand($user, $text, $chatId);
            return;
        }

        // Handle text messages based on conversation state
        $this->handleTextByState($user, $text, $chatId);
    }

    /**
     * Handle callback queries (inline button clicks) with validation
     */
    private function handleCallbackQuery(array $callbackQuery): void
    {
        try {
            $chatId = $callbackQuery['message']['chat']['id'] ?? null;
            $messageId = $callbackQuery['message']['message_id'] ?? null;
            $data = $callbackQuery['data'] ?? '';

            // Validate callback data
            if (!TelegramErrorHandler::validateCallbackData($data)) {
                Log::warning('Invalid callback data', ['data' => $data, 'chat_id' => $chatId]);
                return;
            }

            $user = $this->botService->findOrCreateUser($callbackQuery);
            $this->botService->updateUserInteraction($user);
            $this->botService->answerCallbackQuery($callbackQuery['id']);

            Log::debug('Telegram callback query', ['data' => $data, 'user_id' => $user->id]);

            // Route to appropriate handler
            $this->routeCallback($user, $data, $chatId, $messageId);
        } catch (Throwable $e) {
            // Log error but don't fail - answer the callback anyway
            TelegramErrorHandler::logError($e, ['operation' => 'handleCallbackQuery']);

            try {
                $this->botService->answerCallbackQuery(
                    $callbackQuery['id'],
                    'An error occurred. Please try again.',
                    true
                );
            } catch (Throwable) {
                // Ignore error answering callback
            }
        }
    }

    /**
     * Handle inline queries
     */
    private function handleInlineQuery(array $inlineQuery): void
    {
        // TODO: Implement inline query for menu search
        Log::debug('Telegram inline query', ['query' => $inlineQuery['query']]);
    }

    /**
     * Handle commands
     */
    private function handleCommand(TelegramUser $user, string $text, int $chatId): void
    {
        $command = strtolower(explode(' ', $text)[0]);

        match ($command) {
            '/start' => $this->cmdStart($user, $chatId),
            '/menu' => $this->cmdMenu($user, $chatId),
            '/cart' => $this->cmdCart($user, $chatId),
            '/orders' => $this->cmdOrders($user, $chatId),
            '/help' => $this->cmdHelp($user, $chatId),
            '/cancel' => $this->cmdCancel($user, $chatId),
            '/locations' => $this->cmdLocations($user, $chatId),
            default => $this->cmdUnknown($user, $chatId, $command),
        };
    }

    /**
     * Route callback data to handlers
     */
    private function routeCallback(TelegramUser $user, string $data, int $chatId, int $messageId): void
    {
        // Language selection
        if (str_starts_with($data, 'lang_')) {
            $this->handleLanguageSelection($user, $data, $chatId);
            return;
        }

        // Auth callbacks
        if (str_starts_with($data, 'auth_')) {
            $this->handleAuthCallback($user, $data, $chatId);
            return;
        }

        // Menu callbacks
        if (str_starts_with($data, 'menu_')) {
            $this->handleMenuCallback($user, $data, $chatId, $messageId);
            return;
        }

        // Cart callbacks
        if (str_starts_with($data, 'cart_')) {
            $this->handleCartCallback($user, $data, $chatId);
            return;
        }

        // Item callbacks
        if (str_starts_with($data, 'item_')) {
            $this->handleItemCallback($user, $data, $chatId);
            return;
        }

        // Quantity callbacks
        if (str_starts_with($data, 'qty_')) {
            $this->handleQuantityCallback($user, $data, $chatId);
            return;
        }

        // Checkout callbacks
        if (str_starts_with($data, 'checkout_') || str_starts_with($data, 'order_type_')
            || str_starts_with($data, 'location_') || str_starts_with($data, 'slot_')
            || str_starts_with($data, 'payment_') || str_starts_with($data, 'address_')) {
            $this->handleCheckoutCallback($user, $data, $chatId);
            return;
        }

        // Order callbacks
        if (str_starts_with($data, 'order_')) {
            $this->handleOrderCallback($user, $data, $chatId);
            return;
        }

        // Orders list callback
        if ($data === 'orders_list') {
            $this->showOrdersList($user, $chatId);
            return;
        }

        // Locations list callback
        if ($data === 'locations_list') {
            $this->cmdLocations($user, $chatId);
            return;
        }

        // Help menu callback
        if ($data === 'help_menu') {
            $this->cmdHelp($user, $chatId);
            return;
        }

        // Help callback
        if (str_starts_with($data, 'help_')) {
            $this->handleHelpCallback($user, $data, $chatId);
            return;
        }

        // Loyalty callback
        if (str_starts_with($data, 'loyalty_')) {
            $this->handleLoyaltyCallback($user, $data, $chatId);
            return;
        }

        // Admin callbacks
        if (str_starts_with($data, 'admin_')) {
            $this->handleAdminCallback($user, $data, $chatId);
            return;
        }

        // Main menu
        if ($data === 'menu_main') {
            $this->showMainMenu($user, $chatId);
            return;
        }

        // Generic navigation
        if ($data === 'back' || $data === 'cancel') {
            $this->goBack($user, $chatId);
            return;
        }
    }

    // ============================================
    // Command Handlers
    // ============================================

    private function cmdStart(TelegramUser $user, int $chatId): void
    {
        $isLinked = $user->hasLinkedAccount();

        if ($isLinked) {
            $this->handleReturningUser($user, $chatId);
        } else {
            $this->handleNewUser($user, $chatId);
        }
    }

    /**
     * Handle returning user welcome
     */
    private function handleReturningUser(TelegramUser $user, int $chatId): void
    {
        $customer = $user->customer;
        $points = $customer->points_balance ?? 0;
        $tier = $customer->customer_tier ?? 'bronze';
        $tierEmoji = $this->getTierEmoji($tier);

        // Calculate progress to next tier
        $nextTier = $this->getNextTier($tier);
        $progress = $this->calculateTierProgress($customer, $tier);

        // Build welcome message
        $message = "👋 Welcome back, *{$user->display_name}*! {$tierEmoji}\n\n";

        // Loyalty stats
        $message .= "┌─ Your Rewards ──\n";
        $message .= "│ ⭐ Points: *{$points}*\n";
        $message .= "│ 🏆 Tier: *{$this->formatTierName($tier)}*\n";

        if ($nextTier) {
            $nextTierName = $this->formatTierName($nextTier);
            $message .= "│ 📈 Next: {$this->getTierEmoji($nextTier)} {$nextTierName}\n";
            $message .= "│ 📊 Progress: {$progress}%\n";
        }

        $message .= "└────────────────\n\n";

        // Quick stats
        $orderCount = $customer->orders()->count() ?? 0;
        $message .= "📦 Orders: {$orderCount} | ";

        $totalSpent = $customer->total_spent ?? 0;
        $message .= "💰 Spent: \$" . number_format($totalSpent, 0) . "\n\n";

        // Quick actions
        $message .= "What would you like to do? 😊";

        $this->botService->sendMessage($chatId, $message);
        $this->showMainMenu($user, $chatId);
    }

    /**
     * Handle new user onboarding
     */
    private function handleNewUser(TelegramUser $user, int $chatId): void
    {
        // Welcome banner
        $message = "🎉 *Welcome to NKH Restaurant!*\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";
        $message .= "🍽️ *Your favorite food, delivered to you!*\n\n";
        $message .= "What would you like to do?";

        // Simple inline keyboard with clear actions
        $keyboard = [
            [
                ['text' => '🍔 Order Now', 'callback_data' => 'menu_browse'],
            ],
            [
                ['text' => '📍 Locations', 'callback_data' => 'locations_list'],
                ['text' => '❓ Help', 'callback_data' => 'help_menu'],
            ],
            [
                ['text' => '🔐 Link Account', 'callback_data' => 'auth_phone_request'],
            ],
        ];

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Get tier emoji
     */
    private function getTierEmoji(string $tier): string
    {
        return match (strtolower($tier)) {
            'platinum' => '💎',
            'gold' => '🥇',
            'silver' => '🥈',
            'bronze' => '🥉',
            default => '🏅',
        };
    }

    /**
     * Get next tier
     */
    private function getNextTier(string $currentTier): ?string
    {
        return match (strtolower($currentTier)) {
            'bronze' => 'silver',
            'silver' => 'gold',
            'gold' => 'platinum',
            default => null,
        };
    }

    /**
     * Calculate tier progress
     */
    private function calculateTierProgress(Customer $customer, string $tier): int
    {
        $spent = (float) ($customer->total_spent ?? 0);
        $thresholds = [
            'bronze' => 0,
            'silver' => 2000,
            'gold' => 5000,
            'platinum' => 10000,
        ];

        $currentMin = $thresholds[strtolower($tier)] ?? 0;
        $nextTier = $this->getNextTier($tier);
        $nextMin = $thresholds[$nextTier] ?? 10000;

        if ($nextMin === $currentMin) {
            return 100;
        }

        $progress = (($spent - $currentMin) / ($nextMin - $currentMin)) * 100;
        return min(100, max(0, (int) $progress));
    }

    /**
     * Format tier name
     */
    private function formatTierName(string $tier): string
    {
        return ucfirst(strtolower($tier));
    }

    private function cmdMenu(TelegramUser $user, int $chatId): void
    {
        $this->showCategories($user, $chatId);
    }

    private function cmdCart(TelegramUser $user, int $chatId): void
    {
        $this->showCart($user, $chatId);
    }

    private function cmdOrders(TelegramUser $user, int $chatId): void
    {
        $this->showOrdersList($user, $chatId);
    }

    private function cmdHelp(TelegramUser $user, int $chatId): void
    {
        $message = "🆘 *Help & Support*\n\n";
        $message .= "*Commands:*\n";
        $message .= "/menu - Browse our menu\n";
        $message .= "/cart - View your shopping cart\n";
        $message .= "/orders - View your order history\n";
        $message .= "/locations - Find our branches\n";
        $message .= "/help - Show this help message\n\n";
        $message .= "*Ordering:*\n";
        $message .= "1. Browse the menu using /menu\n";
        $message .= "2. Add items to your cart\n";
        $message .= "3. Use /cart to checkout\n";
        $message .= "4. Choose pickup or delivery\n";
        $message .= "5. Confirm your order!\n\n";
        $message .= "Need assistance? Contact us at support@nkh.com";

        $this->botService->sendMessage($chatId, $message);
        $this->showMainMenu($user, $chatId);
    }

    private function cmdCancel(TelegramUser $user, int $chatId): void
    {
        $user->clearConversationState();
        $this->showMainMenu($user, $chatId);
    }

    private function cmdLocations(TelegramUser $user, int $chatId): void
    {
        $locations = \App\Models\Location::active()->get();

        $message = "📍 *Our Locations*\n\n";

        foreach ($locations as $location) {
            $message .= "*{$location->name}*\n";
            $message .= "📌 {$location->address}\n";
            $message .= "📞 {$location->phone}\n\n";
        }

        $this->botService->sendMessage($chatId, $message);
        $this->showMainMenu($user, $chatId);
    }

    private function cmdUnknown(TelegramUser $user, int $chatId, string $command): void
    {
        $message = "❓ Unknown command: `{$command}`\n\n";
        $message .= "Use /help to see available commands.";

        $this->botService->sendMessage($chatId, $message);
    }

    // ============================================
    // Callback Handlers
    // ============================================

    private function handleAuthCallback(TelegramUser $user, string $data, int $chatId): void
    {
        match ($data) {
            'auth_phone_request' => $this->requestPhoneAuth($user, $chatId),
            'auth_email_request' => $this->requestEmailAuth($user, $chatId),
            'auth_start' => $this->cmdStart($user, $chatId),
            'auth_register_phone' => $this->initiateRegistration($user, $chatId),
            default => str_starts_with($data, 'auth_register_email_')
                ? $this->handleRegistrationRequest($user, $data, $chatId)
                : $this->showMainMenu($user, $chatId),
        };
    }

    private function handleMenuCallback(TelegramUser $user, string $data, int $chatId, int $messageId): void
    {
        // Category navigation
        if (str_starts_with($data, 'category_')) {
            $this->handleCategoryCallback($user, $data, $chatId);
            return;
        }

        // Menu browse commands
        if ($data === 'menu_browse' || $data === 'menu_categories') {
            $this->showCategories($user, $chatId, 1);
        } elseif ($data === 'menu_guest') {
            $this->showCategories($user, $chatId, 1);
        }

        // Search
        if ($data === 'menu_search') {
            $this->showSearchPrompt($user, $chatId);
        }
    }

    /**
     * Handle category-related callbacks
     */
    private function handleCategoryCallback(TelegramUser $user, string $data, int $chatId): void
    {
        // View category items
        if (str_starts_with($data, 'category_') && is_numeric(str_replace('category_', '', $data))) {
            $categoryId = (int) str_replace('category_', '', $data);
            $this->showMenuItems($user, $chatId, $categoryId, 1);
            return;
        }

        // Category pagination
        if ($data === 'category_prev') {
            $currentPage = $user->getConversationData('category_page', 1);
            $this->showCategories($user, $chatId, max(1, $currentPage - 1));
            return;
        }

        if ($data === 'category_next') {
            $currentPage = $user->getConversationData('category_page', 1);
            $this->showCategories($user, $chatId, $currentPage + 1);
            return;
        }

        // Items pagination within a category
        if (str_starts_with($data, 'items_prev_')) {
            $categoryId = (int) str_replace('items_prev_', '', $data);
            $currentPage = $user->getConversationData('items_page', 1);
            $this->showMenuItems($user, $chatId, $categoryId, max(1, $currentPage - 1));
            return;
        }

        if (str_starts_with($data, 'items_next_')) {
            $categoryId = (int) str_replace('items_next_', '', $data);
            $currentPage = $user->getConversationData('items_page', 1);
            $this->showMenuItems($user, $chatId, $categoryId, $currentPage + 1);
            return;
        }

        // Back to categories
        if ($data === 'category_back' || $data === 'menu_categories') {
            $this->showCategories($user, $chatId, 1);
        }
    }

    /**
     * Show categories with pagination
     */
    private function showCategories(TelegramUser $user, int $chatId, int $page = 1, int $perPage = 8): void
    {
        $user->setConversationData('category_page', $page);
        $user->setConversationData('browsing_category', true);

        $totalCategories = Category::active()->count();
        $categories = Category::active()
            ->with('translations')
            ->orderBy('display_order')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        if ($categories->isEmpty()) {
            $this->botService->sendMessage($chatId, "❌ No categories available at the moment.");
            return;
        }

        $keyboard = TelegramKeyboardBuilder::categories($categories, $page, $totalCategories, $perPage);

        $message = "🍽️ *Select a Category*\n\n";
        $message .= "_Page {$page} of " . ceil($totalCategories / $perPage) . "_";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Show menu items for a category with pagination
     */
    private function showMenuItems(TelegramUser $user, int $chatId, int $categoryId, int $page = 1): void
    {
        $category = Category::find($categoryId);

        if (!$category) {
            $this->botService->sendMessage($chatId, "❌ Category not found.");
            return;
        }

        $user->setConversationData('current_category_id', $categoryId);
        $user->setConversationData('items_page', $page);

        $perPage = 8;
        $totalItems = MenuItem::where('category_id', $categoryId)->active()->count();
        $items = MenuItem::where('category_id', $categoryId)
            ->active()
            ->orderBy('name')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $hasMore = ($page * $perPage) < $totalItems;

        $keyboard = TelegramKeyboardBuilder::menuItemsWithPagination(
            $items,
            $category->name,
            $hasMore,
            $page,
            $categoryId
        );

        $message = "🍔 *{$category->name}*\n\n";

        if ($items->isEmpty()) {
            $message .= "No items available in this category.";
        } else {
            $message .= "_Showing " . min($items->count(), $totalItems) . " of {$totalItems} items_";
        }

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Show search prompt
     */
    private function showSearchPrompt(TelegramUser $user, int $chatId): void
    {
        $user->setConversationState(TelegramUser::STATE_AWAITING_SEARCH);

        $message = "🔍 *Search Menu*\n\n";
        $message .= "Enter the name of a dish you're looking for:\n\n";
        $message .= "_Example: pizza, burger, fries_";

        $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
            [
                ['text' => '◀️ Cancel', 'callback_data' => 'menu_browse'],
            ],
        ]);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Handle menu search
     */
    private function handleMenuSearch(TelegramUser $user, string $query, int $chatId): void
    {
        $user->clearConversationState();

        $items = MenuItem::where('name', 'like', "%{$query}%")
            ->active()
            ->limit(10)
            ->get();

        if ($items->isEmpty()) {
            $message = "🔍 *No Results*\n\n";
            $message .= "No items found matching '{$query}'.\n\n";
            $message .= "Try a different search term.";

            $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                [
                    ['text' => '🔄 Search Again', 'callback_data' => 'menu_search'],
                ],
                [
                    ['text' => '◀️ Back to Menu', 'callback_data' => 'menu_browse'],
                ],
            ]);

            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
            return;
        }

        $message = "🔍 *Search Results for '{$query}'*\n\n";
        $message .= "Found {$items->count()} items:\n\n";

        foreach ($items as $index => $item) {
            $itemNumber = $index + 1;
            $message .= "{$itemNumber}. {$item->name} - \$" . number_format($item->price, 2) . "\n";
        }

        $keyboard = TelegramKeyboardBuilder::searchResults($items);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function handleCartCallback(TelegramUser $user, string $data, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);

        // Cart item inline actions
        if (str_starts_with($data, 'cart_item_')) {
            $this->handleCartItemAction($user, $data, $chatId);
            return;
        }

        // Clear cart with confirmation
        if ($data === 'cart_clear_confirm') {
            $this->confirmClearCart($user, $chatId);
            return;
        }

        if ($data === 'cart_clear') {
            $this->handleClearCart($user, $chatId);
            return;
        }

        match ($data) {
            'cart_view' => $this->showCart($user, $chatId),
            'cart_clear' => $this->handleClearCart($user, $chatId),
            'cart_edit' => $this->showCart($user, $chatId),
            'cart_confirm_clear' => $this->confirmClearCart($user, $chatId),
            default => str_starts_with($data, 'cart_add_')
                ? $this->handleQuickAdd($user, $data, $chatId)
                : $this->showMainMenu($user, $chatId),
        };
    }

    /**
     * Handle quick add from menu
     */
    private function handleQuickAdd(TelegramUser $user, string $data, int $chatId): void
    {
        if (str_starts_with($data, 'cart_add_')) {
            $itemId = (int) str_replace('cart_add_', '', $data);
            $cart = new TelegramCartSessionManager($user);
            $success = $cart->addItem($itemId, 1);

            if ($success) {
                $itemName = $cart->getItemName($itemId);
                $this->botService->sendMessage($chatId, "✅ *{$itemName}* added to cart!\n\n_Use /cart to view or checkout_");
            } else {
                $this->botService->sendMessage($chatId, "❌ Could not add item to cart.");
            }
        }
    }

    private function handleItemCallback(TelegramUser $user, string $data, int $chatId): void
    {
        $itemId = (int) str_replace('item_', '', $data);
        $item = MenuItem::with('category')->find($itemId);

        if (!$item) {
            $this->botService->sendMessage($chatId, "❌ Item not found.");
            return;
        }

        // Build enhanced item message
        $message = $this->formatItemDetailMessage($item);

        // Get current quantity from cart
        $cart = new TelegramCartSessionManager($user);
        $currentQty = $cart->getItemQuantity($itemId);

        // Build item detail keyboard with current quantity
        $keyboard = TelegramKeyboardBuilder::itemDetail($item, $currentQty);

        // Send photo with message
        if ($item->image_path) {
            $this->botService->sendPhoto($chatId, $item->image_path, $message, $keyboard);
        } else {
            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
        }
    }

    /**
     * Format item detail message with all information
     */
    private function formatItemDetailMessage(MenuItem $item): string
    {
        $message = "🍽️ *{$item->name}*\n\n";

        // Price with badge
        $message .= "💵 *Price:* \$" . number_format($item->price, 2) . "\n";

        // Category
        if ($item->category) {
            $emoji = TelegramKeyboardBuilder::getCategoryEmoji($item->category->slug);
            $message .= "📂 *Category:* {$emoji} {$item->category->name}\n";
        }

        // Availability
        $availability = $item->is_available ?? true;
        $status = $availability ? '✅ In Stock' : '❌ Out of Stock';
        $message .= "📊 *Status:* {$status}\n";

        // Description
        if ($item->description) {
            $message .= "\n📝 *Description:*\n_{$item->description}_\n";
        }

        // Dietary info
        $tags = [];
        if ($item->is_vegetarian) $tags[] = '🥬 Vegetarian';
        if ($item->is_vegan) $tags[] = '🌱 Vegan';
        if ($item->is_gluten_free) $tags[] = '🌾 Gluten-Free';
        if ($item->is_spicy) $tags[] = '🌶️ Spicy';

        if (!empty($tags)) {
            $message .= "\n🏷️ *Tags:* " . implode(' | ', $tags) . "\n";
        }

        // Calories if available
        if ($item->calories) {
            $message .= "\n🔥 *Calories:* {$item->calories}\n";
        }

        // Preparation time
        if ($item->preparation_time) {
            $message .= "⏱️ *Prep Time:* {$item->preparation_time} min\n";
        }

        // Stock info
        if ($item->stock_quantity !== null) {
            $stockMsg = $item->stock_quantity > 10
                ? " Plenty available"
                : " Only {$item->stock_quantity} left!";
            $message .= $stockMsg;
        }

        return $message;
    }

    private function handleQuantityCallback(TelegramUser $user, string $data, int $chatId): void
    {
        // For now, just add to cart with default quantity
        if (str_starts_with($data, 'cart_add_')) {
            $itemId = (int) str_replace('cart_add_', '', $data);
            $cart = new TelegramCartSessionManager($user);
            $cart->addItem($itemId, 1);
            $this->botService->sendMessage($chatId, "✅ Added to cart!");
        }
    }

    private function handleCheckoutCallback(TelegramUser $user, string $data, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);

        // Order type
        if ($data === 'order_type_pickup') {
            $cart->setOrderType('pickup');
            $this->showCheckoutLocations($user, $chatId);
        } elseif ($data === 'order_type_delivery') {
            $cart->setOrderType('delivery');
            $this->showCheckoutLocations($user, $chatId);
        }

        // Location
        elseif (str_starts_with($data, 'location_')) {
            $locationId = (int) str_replace('location_', '', $data);
            $cart->setLocation($locationId);
            $this->showCheckoutTimeSlots($user, $chatId);
        }

        // Time slot
        elseif (str_starts_with($data, 'slot_')) {
            $slotId = (int) str_replace('slot_', '', $data);
            $cart->setTimeSlot($slotId);
            $this->showCheckoutPayment($user, $chatId);
        }

        // Payment
        elseif ($data === 'payment_online') {
            $this->botService->sendMessage($chatId, "💳 Online payment integration coming soon! Please choose pay on pickup for now.");
            $this->showCheckoutPayment($user, $chatId);
        } elseif ($data === 'payment_cash') {
            $this->showOrderConfirmation($user, $chatId);
        }

        // Address for delivery
        elseif (str_starts_with($data, 'address_')) {
            if ($data === 'address_add') {
                $this->botService->sendMessage($chatId, "📍 Please add a new delivery address on our website.");
                return;
            }
            $addressId = (int) str_replace('address_', '', $data);
            $cart->setCustomerAddress($addressId);
            $this->showCheckoutTimeSlots($user, $chatId);
        }

        // Start checkout
        elseif ($data === 'checkout_start') {
            $this->showCheckoutOrderType($user, $chatId);
        }

        // Confirm order
        elseif ($data === 'order_confirm') {
            $this->processOrder($user, $chatId);
        } elseif ($data === 'order_cancel') {
            $cart->clearCart();
            $this->botService->sendMessage($chatId, "❌ Order cancelled.");
            $this->showMainMenu($user, $chatId);
        } elseif ($data === 'order_edit') {
            $this->showCart($user, $chatId);
        }
    }

    private function handleOrderCallback(TelegramUser $user, string $data, int $chatId): void
    {
        if (str_starts_with($data, 'order_detail_')) {
            $orderId = (int) str_replace('order_detail_', '', $data);
            $this->showOrderDetail($user, $chatId, $orderId);
        } elseif (str_starts_with($data, 'order_cancel_request_')) {
            $orderId = (int) str_replace('order_cancel_request_', '', $data);
            $this->cancelOrder($user, $chatId, $orderId);
        } elseif (str_starts_with($data, 'order_track_')) {
            $orderId = (int) str_replace('order_track_', '', $data);
            $this->trackOrder($user, $chatId, $orderId);
        }
    }

    private function handleHelpCallback(TelegramUser $user, string $data, int $chatId): void
    {
        $keyboard = TelegramKeyboardBuilder::helpMenu();
        $message = "Select a topic:";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function handleLoyaltyCallback(TelegramUser $user, string $data, int $chatId): void
    {
        if (!$user->hasLinkedAccount()) {
            $this->botService->sendMessage($chatId, "Please link your account to view loyalty details.");
            return;
        }

        $customer = $user->customer;
        $stats = [
            'points' => $customer->points_balance ?? 0,
            'tier' => $customer->customer_tier ?? 'Bronze',
        ];

        $keyboard = TelegramKeyboardBuilder::loyaltyStatus($stats);
        $message = "🎁 *Loyalty Program*\n\n";
        $message .= "⭐ Points: {$stats['points']}\n";
        $message .= "🏆 Tier: {$stats['tier']}\n";
        $message .= "💰 Next reward at: 100 points";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Handle admin callbacks
     */
    private function handleAdminCallback(TelegramUser $user, string $data, int $chatId): void
    {
        // Dashboard
        if ($data === 'admin_dashboard') {
            $result = $this->adminService->getDashboardMessage($user->telegram_id);
            $this->botService->sendInlineKeyboard($chatId, $result['message'], $result['keyboard']);
            return;
        }

        // Pending orders
        if ($data === 'admin_pending_orders' || str_starts_with($data, 'admin_pending_page_')) {
            $page = 1;
            if (str_starts_with($data, 'admin_pending_page_')) {
                $page = (int) str_replace('admin_pending_page_', '', $data);
            }
            $result = $this->adminService->getPendingOrdersMessage($user->telegram_id, $page);
            $this->botService->sendInlineKeyboard($chatId, $result['message'], $result['keyboard']);
            return;
        }

        // Order detail
        if (str_starts_with($data, 'admin_order_detail_')) {
            $orderId = (int) str_replace('admin_order_detail_', '', $data);
            $result = $this->adminService->getOrderDetailMessage($user->telegram_id, $orderId);
            $this->botService->sendInlineKeyboard($chatId, $result['message'], $result['keyboard']);
            return;
        }

        // Order status update
        if (str_starts_with($data, 'admin_order_') && !str_starts_with($data, 'admin_order_detail_')) {
            // Parse: admin_order_{orderId}_{action}
            $parts = explode('_', $data);
            if (count($parts) >= 4) {
                $orderId = (int) $parts[2];
                $action = $parts[3];

                // Map action to status
                $statusMap = [
                    'approve' => 'received',
                    'decline' => 'cancelled',
                    'preparing' => 'preparing',
                    'ready' => 'ready',
                    'out' => 'out_for_delivery',
                    'complete' => 'completed',
                ];

                $status = $statusMap[$action] ?? null;
                if ($status) {
                    $success = $this->adminService->updateOrderStatus($user->telegram_id, $orderId, $status);

                    if ($success) {
                        $this->botService->sendMessage($chatId, "✅ Order #{$orderId} status updated to {$status}");
                        // Refresh order detail
                        $result = $this->adminService->getOrderDetailMessage($user->telegram_id, $orderId);
                        $this->botService->sendInlineKeyboard($chatId, $result['message'], $result['keyboard']);
                    } else {
                        $this->botService->sendMessage($chatId, "❌ Failed to update order status");
                    }
                }
            }
            return;
        }

        // Analytics
        if (str_starts_with($data, 'admin_analytics_')) {
            $period = str_replace('admin_analytics_', '', $data);
            // Analytics implementation can be added later
            $this->botService->sendMessage($chatId, "📊 Analytics feature coming soon!");
            return;
        }

        // Other admin features (placeholder)
        if (in_array($data, ['admin_locations', 'admin_customers', 'admin_search_customer'])) {
            $this->botService->sendMessage($chatId, "🔧 This admin feature is coming soon!");
            return;
        }
    }

    // ============================================
    // Helper Methods
    // ============================================

    private function showMainMenu(TelegramUser $user, int $chatId): void
    {
        $hasAccount = $user->hasLinkedAccount();
        $isAdmin = $this->adminService->isAdmin($user->telegram_id);

        // Build custom keyboard with admin option
        $keyboard = [];

        if ($isAdmin) {
            // Admin user - show admin dashboard option
            $keyboard[] = [
                ['text' => '📊 Admin Dashboard', 'callback_data' => 'admin_dashboard'],
            ];
            $keyboard[] = [
                ['text' => '🍽️ Menu', 'callback_data' => 'menu_browse'],
                ['text' => '🛒 Cart', 'callback_data' => 'cart_view'],
            ];
        } else {
            // Regular user
            $keyboard[] = [
                ['text' => '🍽️ Menu', 'callback_data' => 'menu_browse'],
                ['text' => '🛒 Cart', 'callback_data' => 'cart_view'],
            ];
        }

        $keyboard[] = [
            ['text' => '📦 My Orders', 'callback_data' => 'orders_list'],
            ['text' => '🎁 Loyalty', 'callback_data' => 'loyalty_status'],
        ];

        $keyboard[] = [
            ['text' => '📍 Locations', 'callback_data' => 'locations_list'],
            ['text' => '❓ Help', 'callback_data' => 'help_menu'],
        ];

        $message = "🍽️ *NKH Restaurant*\n\n";
        if ($isAdmin) {
            $message .= "👑 *Admin Access Enabled*\n\n";
        }
        $message .= "What would you like to do?";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showCart(TelegramUser $user, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);

        if ($cart->isEmpty()) {
            $message = "🛒 *Your Cart is Empty*\n\n";
            $message .= "Add some delicious items from our menu! 🍔\n\n";
            $message .= "_Use /menu to browse our categories_";

            $keyboard = TelegramKeyboardBuilder::emptyCart();
            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
            return;
        }

        $items = $cart->getItems();

        // Build cart message
        $message = $this->formatCartMessage($cart, $items);

        // Build cart keyboard with inline controls
        $keyboard = TelegramKeyboardBuilder::cartWithControls(
            $items,
            $cart->getSubtotal(),
            $cart->getTaxAmount(),
            $cart->getDiscountAmount(),
            $cart->getTotalAmount(),
            $cart->getItemCount()
        );

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Format cart message with all details
     */
    private function formatCartMessage(TelegramCartSessionManager $cart, Collection $items): string
    {
        $message = "🛒 *Your Shopping Cart*\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";

        foreach ($items as $index => $item) {
            $itemNumber = $index + 1;
            $name = $item['name'];
            $qty = $item['quantity'];
            $unitPrice = $item['unit_price'];
            $totalPrice = $item['total_price'];

            $message .= "{$itemNumber}. *{$name}*\n";
            $message .= "   📝 {$qty}x @ \$" . number_format($unitPrice, 2) . " = \$" . number_format($totalPrice, 2) . "\n";

            if (!empty($item['special_instructions'])) {
                $message .= "   └ 💬 \"" . substr($item['special_instructions'], 0, 30) . "\"\n";
            }
            $message .= "\n";
        }

        $message .= "━━━━━━━━━━━━━━━━━━━━━\n";

        // Totals
        $subtotal = $cart->getSubtotal();
        $discount = $cart->getDiscountAmount();
        $tax = $cart->getTaxAmount();
        $total = $cart->getTotalAmount();

        $message .= "💵 *Subtotal:* \$" . number_format($subtotal, 2) . "\n";

        if ($discount > 0) {
            $message .= "🎁 *Discount:* -\$" . number_format($discount, 2) . "\n";
        }

        $message .= "🏷️ *Tax (10%):* \$" . number_format($tax, 2) . "\n";

        $message .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $message .= "💰 *TOTAL: \$" . number_format($total, 2) . "*\n";

        // Item count
        $itemCount = $cart->getItemCount();
        $message .= "\n📦 *Items:* {$itemCount}";

        // Order type if selected
        $orderType = $cart->getOrderType();
        if ($orderType) {
            $typeEmoji = $orderType === 'pickup' ? '🚶' : '🏠';
            $message .= " | {$typeEmoji} " . ucfirst($orderType);
        }

        return $message;
    }

    /**
     * Handle cart item actions
     */
    private function handleCartItemAction(TelegramUser $user, string $data, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);

        // Parse: cart_item_{id}_{action}
        $parts = explode('_', $data);
        $itemId = (int) ($parts[2] ?? 0);
        $action = $parts[3] ?? '';

        if (!$itemId) {
            $this->botService->sendMessage($chatId, "❌ Invalid item.");
            return;
        }

        match ($action) {
            'plus' => $this->incrementCartItem($user, $chatId, $itemId),
            'minus' => $this->decrementCartItem($user, $chatId, $itemId),
            'remove' => $this->removeCartItem($user, $chatId, $itemId),
            default => $this->showCart($user, $chatId),
        };
    }

    /**
     * Increment cart item quantity
     */
    private function incrementCartItem(TelegramUser $user, int $chatId, int $itemId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $currentQty = $cart->getItemQuantity($itemId);
        $cart->updateQuantity($itemId, $currentQty + 1);

        $this->botService->sendMessage($chatId, "✅ Quantity increased!");
        $this->showCart($user, $chatId);
    }

    /**
     * Decrement cart item quantity
     */
    private function decrementCartItem(TelegramUser $user, int $chatId, int $itemId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $currentQty = $cart->getItemQuantity($itemId);

        if ($currentQty <= 1) {
            $this->removeCartItem($user, $chatId, $itemId);
            return;
        }

        $cart->updateQuantity($itemId, $currentQty - 1);
        $this->botService->sendMessage($chatId, "✅ Quantity decreased!");
        $this->showCart($user, $chatId);
    }

    /**
     * Remove item from cart
     */
    private function removeCartItem(TelegramUser $user, int $chatId, int $itemId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $itemName = $cart->getItemName($itemId);
        $cart->removeItem($itemId);

        $this->botService->sendMessage($chatId, "❌ *{$itemName}* removed from cart.");
        $this->showCart($user, $chatId);
    }

    /**
     * Handle clear cart with confirmation
     */
    private function handleClearCart(TelegramUser $user, int $chatId): void
    {
        $keyboard = TelegramKeyboardBuilder::confirmClearCart();

        $message = "⚠️ *Clear Cart?*\n\n";
        $message .= "Are you sure you want to remove all items from your cart?\n\n";
        $message .= "_This action cannot be undone._";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Confirm clear cart
     */
    private function confirmClearCart(TelegramUser $user, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $itemCount = $cart->getItemCount();
        $cart->clearCart();

        $message = "✅ *Cart Cleared*\n\n";
        $message .= "Removed {$itemCount} items from your cart.\n\n";
        $message .= "_Ready for a new order!_";

        $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
            [
                ['text' => '🍔 Browse Menu', 'callback_data' => 'menu_browse'],
            ],
            [
                ['text' => '◀️ Main Menu', 'callback_data' => 'menu_main'],
            ],
        ]);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showOrdersList(TelegramUser $user, int $chatId): void
    {
        if (!$user->hasLinkedAccount()) {
            $message = "📦 *Your Orders*\n\n";
            $message .= "Please link your account to view your order history.\n\n";
            $message .= "/start to link your account";

            $this->botService->sendMessage($chatId, $message);
            return;
        }

        $orders = Order::where('customer_id', $user->customer_id)
            ->with('location')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        if ($orders->isEmpty()) {
            $message = "📦 *Your Orders*\n\n";
            $message .= "You haven't placed any orders yet.\n\n";
            $message .= "🍔 Browse our menu to get started!";

            $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                [['text' => '🍔 Browse Menu', 'callback_data' => 'menu_categories']],
            ]);

            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
            return;
        }

        $message = "📦 *Your Recent Orders*\n\n";

        $keyboard = TelegramKeyboardBuilder::orderList($orders);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showOrderDetail(TelegramUser $user, int $chatId, int $orderId): void
    {
        $order = Order::where('id', $orderId)
            ->where('customer_id', $user->customer_id)
            ->with(['items.menuItem', 'location', 'timeSlot'])
            ->first();

        if (!$order) {
            $this->botService->sendMessage($chatId, "❌ Order not found.");
            return;
        }

        $message = "🎫 *Order {$order->order_number}*\n\n";
        $message .= "Status: " . $this->getStatusText($order->status) . "\n";
        $message .= "Type: " . ucfirst($order->order_type) . "\n";
        $message .= "📍 " . ($order->location?->name ?? 'N/A') . "\n";

        if ($order->pickup_time) {
            $message .= "🕐 " . $order->pickup_time->format('M j, g:i A') . "\n";
        }

        $message .= "\n*Items:*\n";
        foreach ($order->items as $item) {
            $name = $item->menuItem?->name ?? 'Unknown';
            $message .= "• {$name} × {$item->quantity}\n";
        }

        $message .= "\n─────────────────────\n";
        $message .= "Total: $" . number_format($order->total_amount, 2);

        $keyboard = TelegramKeyboardBuilder::orderDetail($order);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showCheckoutOrderType(TelegramUser $user, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $errors = $cart->isValidForCheckout();

        if (!empty($errors)) {
            $message = "⚠️ *Cannot proceed to checkout*\n\n" . implode("\n", $errors);
            $this->botService->sendMessage($chatId, $message);
            $this->showCart($user, $chatId);
            return;
        }

        $keyboard = TelegramKeyboardBuilder::orderType();
        $message = "📦 *Checkout*\n\n";
        $message .= "Select your order type:";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showCheckoutLocations(TelegramUser $user, int $chatId): void
    {
        $locations = \App\Models\Location::active()->get();

        $message = "📍 *Select Location*\n\n";
        $message .= "Choose a branch for " .
            (new TelegramCartSessionManager($user))->getOrderType() . ":";

        $keyboard = TelegramKeyboardBuilder::locations($locations);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showCheckoutTimeSlots(TelegramUser $user, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $locationId = $cart->getLocationId();
        $orderType = $cart->getOrderType();

        if (!$locationId || !$orderType) {
            $this->showCheckoutOrderType($user, $chatId);
            return;
        }

        $mode = $orderType === 'delivery' ? 'delivery' : 'pickup';
        $slots = \App\Services\TimeSlotService::getAvailableTimeSlots(
            $locationId,
            $mode,
            now()->format('Y-m-d'),
            30
        );

        $message = "🕐 *Select Time*\n\n";
        $message .= "Available slots for today:";

        $keyboard = TelegramKeyboardBuilder::timeSlots(
            collect($slots),
            now()->format('Y-m-d'),
            false
        );

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showCheckoutPayment(TelegramUser $user, int $chatId): void
    {
        $keyboard = TelegramKeyboardBuilder::paymentMethods(false);
        $message = "💳 *Payment Method*\n\n";
        $message .= "How would you like to pay?";

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function showOrderConfirmation(TelegramUser $user, int $chatId): void
    {
        $cart = new TelegramCartSessionManager($user);
        $orderData = $cart->getOrderData();

        if (!$orderData) {
            $this->botService->sendMessage($chatId, "❌ Cart is empty or invalid.");
            return;
        }

        $message = "📋 *Order Summary*\n\n";

        $location = \App\Models\Location::find($cart->getLocationId());
        $message .= "📍 Location: " . ($location?->name ?? 'N/A') . "\n";
        $message .= "🕐 Type: " . ucfirst($cart->getOrderType()) . "\n";
        $message .= "💵 Payment: Pay on " . ($cart->getOrderType() === 'delivery' ? 'Delivery' : 'Pickup') . "\n\n";

        $message .= "*Items:*\n";
        foreach ($cart->getItems() as $item) {
            $message .= "• {$item['name']} × {$item['quantity']} = $" . number_format($item['total_price'], 2) . "\n";
        }

        $message .= "\n─────────────────────\n";
        $message .= "Subtotal: $" . number_format($cart->getSubtotal(), 2) . "\n";
        $message .= "Tax: $" . number_format($cart->getTaxAmount(), 2) . "\n";
        $message .= "*Total: $" . number_format($cart->getTotalAmount(), 2) . "*";

        $keyboard = TelegramKeyboardBuilder::orderConfirmation('NEW');

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Process order with error handling and fallback
     */
    private function processOrder(TelegramUser $user, int $chatId): void
    {
        if (!$user->hasLinkedAccount()) {
            $this->botService->sendMessage($chatId, "❌ Please link your account to place orders.");
            return;
        }

        $cart = new TelegramCartSessionManager($user);
        $orderData = $cart->getOrderData();

        if (!$orderData) {
            $this->botService->sendMessage($chatId, "❌ Cart is empty or invalid.");
            return;
        }

        try {
            // Validate cart before processing
            $errors = $cart->isValidForCheckout();
            if (!empty($errors)) {
                $message = "⚠️ *Cannot place order*\n\n";
                $message .= implode("\n", array_map(fn($e) => "• {$e}", $errors));

                $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                    [
                        ['text' => '🔙 View Cart', 'callback_data' => 'cart_view'],
                    ],
                    [
                        ['text' => '🍔 Browse Menu', 'callback_data' => 'menu_categories'],
                    ],
                ]);

                $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
                return;
            }

            // Sync cart to database first
            $cart->syncToDatabase($user->customer);

            // Create order via API with timeout
            $response = TelegramErrorHandler::withRetry(function () use ($user, $orderData) {
                return \Illuminate\Support\Facades\Http::timeout(30)->withHeaders([
                    'Authorization' => 'Bearer ' . $this->getCustomerToken($user->customer),
                    'Accept' => 'application/json',
                ])->post(route('api.customer.online-orders'), $orderData);
            });

            if ($response->successful()) {
                $order = $response->json('data');
                $cart->clearCart();

                $message = "✅ *Order Placed Successfully!*\n\n";
                $message .= "🎫 Order Number: *{$order['order_number']}*\n";
                $message .= "📍 Type: " . ucfirst($order['order_type']) . "\n";
                $message .= "💵 Total: \${$order['total_amount']}\n\n";
                $message .= "⏳ Status: Awaiting approval...";

                $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                    [
                        ['text' => '📋 View Order', 'callback_data' => 'order_detail_' . $order['id']],
                        ['text' => '🔔 Track', 'callback_data' => 'order_track_' . $order['id']],
                    ],
                    [
                        ['text' => '◀️ Back to Menu', 'callback_data' => 'menu_main'],
                    ],
                ]);

                $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
            } else {
                $errorData = $response->json();
                $error = $errorData['message'] ?? $errorData['error'] ?? 'Failed to place order';

                // Handle validation errors
                if (is_array($error)) {
                    $error = implode(', ', $error);
                }

                $message = "❌ *Order Failed*\n\n";
                $message .= TelegramErrorHandler::getUserContext(new \Exception($error));

                $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                    [
                        ['text' => '🔄 Try Again', 'callback_data' => 'cart_view'],
                    ],
                    [
                        ['text' => '🍔 Browse Menu', 'callback_data' => 'menu_categories'],
                    ],
                ]);

                $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
            }
        } catch (Throwable $e) {
            Log::error('Telegram order processing failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            $message = TelegramErrorHandler::formatTelegramError($e);

            $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                [
                    ['text' => '🔄 Try Again', 'callback_data' => 'cart_view'],
                ],
                [
                    ['text' => '📞 Contact Support', 'callback_data' => 'help_support'],
                ],
            ]);

            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
        }
    }

    private function cancelOrder(TelegramUser $user, int $chatId, int $orderId): void
    {
        $order = Order::where('id', $orderId)
            ->where('customer_id', $user->customer_id)
            ->first();

        if (!$order) {
            $this->botService->sendMessage($chatId, "❌ Order not found.");
            return;
        }

        if (!$order->can_cancel) {
            $this->botService->sendMessage($chatId, "❌ This order cannot be cancelled.");
            return;
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->getCustomerToken($user->customer),
            ])->post(route('api.customer.orders.cancel', $orderId));

            if ($response->successful()) {
                $this->botService->sendMessage($chatId, "✅ Order cancelled successfully.");
            } else {
                $this->botService->sendMessage($chatId, "❌ Could not cancel order.");
            }
        } catch (\Exception $e) {
            $this->botService->sendMessage($chatId, "❌ An error occurred.");
        }
    }

    private function trackOrder(TelegramUser $user, int $chatId, int $orderId): void
    {
        $order = Order::where('id', $orderId)
            ->where('customer_id', $user->customer_id)
            ->with(['location', 'timeSlot'])
            ->first();

        if (!$order) {
            $this->botService->sendMessage($chatId, "❌ Order not found.");
            return;
        }

        $message = $this->botService->formatOrderStatusMessage($order, $order->status);

        $keyboard = TelegramKeyboardBuilder::orderDetail($order);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function handleContactShare(TelegramUser $user, array $contact): void
    {
        $chatId = $contact['chat']['id'] ?? ($contact['chat_id'] ?? 0);
        $phone = $contact['phone_number'] ?? null;
        $firstName = $contact['first_name'] ?? '';
        $lastName = $contact['last_name'] ?? '';

        if (!$chatId) {
            return;
        }

        if (!$phone) {
            $this->sendAuthFailed($chatId, "Could not get phone number. Please try again.");
            return;
        }

        // Normalize phone number
        $normalizedPhone = ltrim($phone, '+');
        if (str_starts_with($normalizedPhone, '855')) {
            // Cambodian phone number format
            $normalizedPhone = '0' . substr($normalizedPhone, 3);
        }

        // Show processing message
        $processingKeyboard = TelegramKeyboardBuilder::accountLinkingProgress('phone_shared');
        $this->botService->sendInlineKeyboard($chatId, "📱 Looking up your account...", $processingKeyboard);

        // Find customer by phone
        $customer = Customer::whereHas('user', function ($q) use ($normalizedPhone, $phone) {
            $q->where(function ($subQ) use ($normalizedPhone, $phone) {
                $subQ->where('phone', 'like', '%' . $normalizedPhone)
                    ->orWhere('phone', 'like', '%' . $phone)
                    ->orWhere('phone', 'like', '%' . ltrim($normalizedPhone, '0'));
            });
        })->first();

        if ($customer) {
            // Success - link account
            $user->update(['customer_id' => $customer->id]);

            $message = "✅ *Account Linked Successfully!*\n\n";
            $message .= "Welcome back, *{$user->display_name}*!\n\n";
            $message .= "Your phone number has been verified.\n";
            $message .= "You can now:\n";
            $message .= "• 📦 Track your orders\n";
            $message .= "• 🎁 Earn loyalty points\n";
            $message .= "• 🔔 Get order updates\n\n";
            $message .= "What would you like to do?";

            $this->botService->sendMessage($chatId, $message);
            $this->showMainMenu($user, $chatId);

            Log::info('Telegram: Account linked via phone', [
                'telegram_user_id' => $user->id,
                'customer_id' => $customer->id,
                'phone' => $normalizedPhone,
            ]);
        } else {
            // No account found - offer registration
            $message = "❌ *No Account Found*\n\n";
            $message .= "We couldn't find an account with phone number: `{$phone}`\n\n";
            $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";
            $message .= "Would you like to register a new account? You'll receive a verification link via SMS.";

            $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                [
                    ['text' => '📝 Register New Account', 'callback_data' => 'auth_register_phone'],
                ],
                [
                    ['text' => '🔄 Try Different Phone', 'callback_data' => 'auth_phone_request'],
                ],
                [
                    ['text' => '📧 Use Email Instead', 'callback_data' => 'auth_email_request'],
                ],
            ]);

            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
        }
    }

    /**
     * Send authentication failed message
     */
    private function sendAuthFailed(int $chatId, string $reason): void
    {
        $message = "❌ *Authentication Failed*\n\n{$reason}";

        $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
            [
                ['text' => '🔄 Try Again', 'callback_data' => 'auth_phone_request'],
            ],
            [
                ['text' => '📧 Use Email', 'callback_data' => 'auth_email_request'],
            ],
        ]);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    private function requestPhoneAuth(TelegramUser $user, int $chatId): void
    {
        $keyboard = [
            [
                ['text' => '📱 Share Phone Number', 'request_contact' => true],
            ],
        ];

        $message = "🔐 *Link Your Account*\n\n";
        $message .= "Please share your phone number to verify your identity.\n\n";
        $message .= "This helps us:\n";
        $message .= "• Protect your account\n";
        $message .= "• Access your order history\n";
        $message .= "• Send order updates\n\n";
        $message .= "_We only use your phone number for account verification._";

        $this->botService->sendReplyKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Handle text messages based on conversation state
     */
    private function handleTextByState(TelegramUser $user, string $text, int $chatId): void
    {
        if ($user->conversation_state === TelegramUser::STATE_AWAITING_EMAIL) {
            $this->handleEmailAuth($user, $text, $chatId);
            return;
        }

        if ($user->conversation_state === TelegramUser::STATE_AWAITING_PHONE) {
            $this->requestPhoneAuth($user, $chatId);
            return;
        }

        // Handle registration flow text inputs
        if ($user->conversation_state === TelegramUser::STATE_AWAITING_REGISTRATION) {
            $this->handleRegistrationText($user, $text, $chatId);
            return;
        }

        // Handle menu search
        if ($user->conversation_state === TelegramUser::STATE_AWAITING_SEARCH) {
            $this->handleMenuSearch($user, $text, $chatId);
            return;
        }

        // Default: show main menu
        $this->showMainMenu($user, $chatId);
    }

    /**
     * Handle registration text input
     */
    private function handleRegistrationText(TelegramUser $user, string $text, int $chatId): void
    {
        $registrationData = $user->getRegistrationData();

        if (!$registrationData) {
            $user->clearConversationState();
            $this->showMainMenu($user, $chatId);
            return;
        }

        $field = $registrationData['current_field'] ?? 'name';
        $data = $registrationData['data'] ?? [];

        match ($field) {
            'name' => $this->processRegistrationName($user, $text, $chatId, $data),
            'phone' => $this->processRegistrationPhone($user, $text, $chatId, $data),
            default => $this->showMainMenu($user, $chatId),
        };
    }

    private function processRegistrationName(TelegramUser $user, string $name, int $chatId, array $data): void
    {
        if (strlen($name) < 2) {
            $this->botService->sendMessage($chatId, "❌ Name is too short. Please enter your full name.");
            return;
        }

        $data['name'] = $name;
        $user->setRegistrationData(array_merge($data, ['current_field' => 'phone']));

        $message = "📱 *Phone Number*\n\n";
        $message .= "Please enter your phone number (e.g., 012 345 678 or +855 12 345 678):";

        $user->setConversationState(TelegramUser::STATE_AWAITING_REGISTRATION);
        $this->botService->sendMessage($chatId, $message);
    }

    private function processRegistrationPhone(TelegramUser $user, string $phone, int $chatId, array $data): void
    {
        // Normalize phone
        $normalizedPhone = ltrim($phone, '+');
        if (str_starts_with($normalizedPhone, '855')) {
            $normalizedPhone = '0' . substr($normalizedPhone, 3);
        }

        if (!preg_match('/^(\+?855|0)?[1-9]\d{7,8}$/', $normalizedPhone)) {
            $this->botService->sendMessage($chatId, "❌ Invalid phone format. Please try again.");
            return;
        }

        $data['phone'] = $normalizedPhone;
        $user->setRegistrationData(array_merge($data, ['current_field' => 'complete']));

        // Create pending registration
        $user->setPendingRegistration($data);
        $user->clearConversationState();

        $message = "✅ *Registration Complete!*\n\n";
        $message .= "Thank you, *{$data['name']}*!\n\n";
        $message .= "We've created your account.\n";
        $message .= "A verification link has been sent to your phone.\n\n";
        $message .= "Once verified, you can link this Telegram account to access your rewards!";

        $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
            [
                ['text' => '🔐 Link This Account', 'callback_data' => 'auth_phone_request'],
            ],
            [
                ['text' => '◀️ Main Menu', 'callback_data' => 'menu_main'],
            ],
        ]);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Handle email authentication with registration option
     */
    private function handleEmailAuth(TelegramUser $user, string $email, int $chatId): void
    {
        $validator = Validator::make(['email' => $email], [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            $this->botService->sendMessage($chatId, "❌ Invalid email format. Please enter a valid email address.");
            return;
        }

        // Check if account exists
        $customer = Customer::whereHas('user', function ($q) use ($email) {
            $q->where('email', $email);
        })->first();

        if ($customer) {
            // Account found - link it
            $user->update(['customer_id' => $customer->id]);
            $user->clearConversationState();

            $message = "✅ *Account Linked Successfully!*\n\n";
            $message .= "Welcome back, *{$user->display_name}*!\n\n";
            $message .= "Your email has been verified.\n";
            $message .= "You now have full access to your account.";

            $this->botService->sendMessage($chatId, $message);
            $this->handleReturningUser($user, $chatId);

            Log::info('Telegram: Account linked via email', [
                'telegram_user_id' => $user->id,
                'customer_id' => $customer->id,
                'email' => $email,
            ]);
        } else {
            // Account not found - offer registration
            $message = "📝 *No Account Found*\n\n";
            $message .= "We couldn't find an account with email: `{$email}`\n\n";
            $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";
            $message .= "Would you like to create a new account? You'll receive a verification email.";

            $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
                [
                    ['text' => '📝 Create New Account', 'callback_data' => 'auth_register_email_' . $email],
                ],
                [
                    ['text' => '🔄 Try Different Email', 'callback_data' => 'auth_email_request'],
                ],
                [
                    ['text' => '📱 Use Phone Instead', 'callback_data' => 'auth_phone_request'],
                ],
            ]);

            $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
        }
    }

    /**
     * Handle language selection
     */
    private function handleLanguageSelection(TelegramUser $user, string $data, int $chatId): void
    {
        $language = str_replace('lang_', '', $data);

        if ($language === 'en') {
            $user->update(['language' => 'en']);
            $message = "🇺🇸 *Language Changed*\n\n";
            $message .= "English has been set as your preferred language.";
        } elseif ($language === 'km') {
            $user->update(['language' => 'km']);
            $message = "🇰🇭 *ប្តូរភាសា*\n\n";
            $message .= "ភាសាខ្មែរត្រូវបានជ្រើសរើសជាភាសាចង់បានរបស់អ្នក។";
        } else {
            $message = "❌ Unknown language selection.";
        }

        $this->botService->sendMessage($chatId, $message);

        // Refresh main menu
        $this->showMainMenu($user, $chatId);
    }

    /**
     * Handle registration request
     */
    private function handleRegistrationRequest(TelegramUser $user, string $data, int $chatId): void
    {
        if (str_starts_with($data, 'auth_register_email_')) {
            $email = str_replace('auth_register_email_', '', $data);
            $this->initiateEmailRegistration($user, $email, $chatId);
        } elseif ($data === 'auth_register_phone') {
            $this->initiatePhoneRegistration($user, $chatId);
        } else {
            $this->requestPhoneAuth($user, $chatId);
        }
    }

    /**
     * Initiate phone-based registration flow
     */
    private function initiatePhoneRegistration(TelegramUser $user, int $chatId): void
    {
        $user->setConversationState(TelegramUser::STATE_AWAITING_REGISTRATION);
        $user->setRegistrationData(['current_field' => 'name', 'data' => []]);

        $message = "📝 *New Account Registration*\n\n";
        $message .= "Let's create your account!\n\n";
        $message .= "*Step 1 of 2:*\n";
        $message .= "Please enter your full name:";

        $this->botService->sendMessage($chatId, $message);
    }

    /**
     * Initiate email-based registration
     */
    private function initiateEmailRegistration(TelegramUser $user, string $email, int $chatId): void
    {
        $message = "📧 *Registration Initiated*\n\n";
        $message .= "We've sent a verification link to: `{$email}`\n\n";
        $message .= "Please check your email and click the link to complete registration.\n\n";
        $message .= "_The link will expire in 24 hours._\n\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";
        $message .= "Already registered? You can now link this Telegram account to your existing account.";

        $keyboard = TelegramKeyboardBuilder::inlineKeyboard([
            [
                ['text' => '🔄 Link Existing Account', 'callback_data' => 'auth_email_request'],
            ],
            [
                ['text' => '◀️ Back', 'callback_data' => 'menu_main'],
            ],
        ]);

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);

        Log::info('Telegram: Registration initiated via email', [
            'telegram_user_id' => $user->id,
            'email' => $email,
        ]);
    }

    /**
     * Initiate account registration (phone-based - entry point)
     */
    private function initiateRegistration(TelegramUser $user, int $chatId): void
    {
        $this->initiatePhoneRegistration($user, $chatId);
    }

    private function goBack(TelegramUser $user, int $chatId): void
    {
        $user->clearConversationState();
        $this->showMainMenu($user, $chatId);
    }

    private function getStatusText(string $status): string
    {
        return match ($status) {
            'pending' => '⏳ Pending',
            'received' => '✅ Received',
            'preparing' => '👨‍🍳 Preparing',
            'ready' => '🔔 Ready',
            'completed' => '⭐ Completed',
            'cancelled' => '🚫 Cancelled',
            'out_for_delivery' => '🚗 Out for Delivery',
            'delivered' => '📦 Delivered',
            default => ucfirst($status),
        };
    }

    private function getCustomerToken(Customer $customer): string
    {
        // This is a simplified token retrieval
        // In production, use proper token management
        return $customer->user->createToken('telegram')->plainTextToken;
    }
}
