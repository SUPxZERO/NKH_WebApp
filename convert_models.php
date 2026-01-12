#!/usr/bin/env php
<?php

/**
 * Sprint 0 Model Conversion Script
 * Batch converts remaining models from $fillable to $guarded pattern
 */

$modelsToConvert = [
    // Priority B: Financial Support (6 remaining)
    'PayrollDetail.php' => ['gross_amount', 'net_amount', 'created_at', 'updated_at'],
    'PurchaseOrderItem.php' => ['unit_price', 'total_price', 'created_at', 'updated_at'],
    'InventoryTransaction.php' => ['quantity', 'cost_per_unit', 'total_cost', 'created_at', 'updated_at'],
    'InventoryAdjustment.php' => ['quantity_adjusted', 'cost_impact', 'created_at', 'updated_at'],
    'Expense.php' => ['amount', 'status', 'created_at', 'updated_at'],
    'DailySettlement.php' => ['total_revenue', 'cash_total', 'card_total', 'qr_total', 'created_at', 'updated_at'],
   
    // Priority C: Support Models - Minimal Protection (40 remaining)
    'Attendance.php' => ['id', 'created_at', 'updated_at'],
    'AttendanceMetric.php' => ['id', 'created_at', 'updated_at'],
    'BroadcastNotification.php' => ['id', 'created_at', 'updated_at'],
    'CategoryTranslation.php' => ['id', 'created_at', 'updated_at'],
    'CustomerAddress.php' => ['id', 'created_at', 'updated_at'],
    'CustomerCommunicationLog.php' => ['id', 'created_at', 'updated_at'],
    'CustomerLoginHistory.php' => ['id', 'created_at', 'updated_at'],
    'CustomerPreference.php' => ['id', 'created_at', 'updated_at'],
    'EmployeeFeedback.php' => ['id', 'created_at', 'updated_at'],
    'EmploymentHistory.php' => ['id', 'created_at', 'updated_at'],
    'ExpenseCategory.php' => ['id', 'created_at', 'updated_at'],
    'Floor.php' => ['id', 'created_at', 'updated_at'],
    'Inventory.php' => ['id', 'quantity_on_hand', 'created_at', 'updated_at'],
    'InventoryOrderDeduction.php' => ['id', 'created_at', 'updated_at'],
    'LeaveRequest.php' => ['id', 'status', 'created_at', 'updated_at'],
    'MenuItemTranslation.php' => ['id', 'created_at', 'updated_at'],
    'NotificationPreference.php' => ['id', 'created_at', 'updated_at'],
    'OperatingHour.php' => ['id', 'created_at', 'updated_at'],
    'OperatingHours.php' => ['id', 'created_at', 'updated_at'],
    'OrderTimeSlot.php' => ['id', 'created_at', 'updated_at'],
    'PaymentMethod.php' => ['id', 'created_at', 'updated_at'],
    'Permission.php' => ['id', 'created_at', 'updated_at'],
    'Position.php' => ['id', 'created_at', 'updated_at'],
    'Recipe.php' => ['id', 'created_at', 'updated_at'],
    'RecipeIngredient.php' => ['id', 'quantity', 'created_at', 'updated_at'],
    'Role.php' => ['id', 'created_at', 'updated_at'],
    'Setting.php' => ['id', 'created_at', 'updated_at'],
    'ShiftSwap.php' => ['id', 'status', 'created_at', 'updated_at'],
    'ShiftTemplate.php' => ['id', 'created_at', 'updated_at'],
    'StockAlert.php' => ['id', 'created_at', 'updated_at'],
    'Supplier.php' => ['id', 'created_at', 'updated_at'],
    'SupportTicket.php' => ['id', 'status', 'created_at', 'updated_at'],
    'TableSession.php' => ['id', 'session_token', 'created_at', 'updated_at'],
    'TelegramOrderNotification.php' => ['id', 'created_at', 'updated_at'],
    'TelegramUser.php' => ['id', 'telegram_id', 'created_at', 'updated_at'],
    'TimeOffBalance.php' => ['id', 'balance', 'created_at', 'updated_at'],
    'TimeOffRequest.php' => ['id', 'status', 'created_at', 'updated_at'],
    'Unit.php' => ['id', 'created_at', 'updated_at'],
    'UserNotification.php' => ['id', 'created_at', 'updated_at'],
    'UserProfile.php' => ['id', 'created_at', 'updated_at'],
    'UserSetting.php' => ['id', 'created_at', 'updated_at'],
];

$modelsDir = 'e:\promgramming\NKH_WebApp\app\Models';
$converted = 0;
$skipped = 0;

foreach ($modelsToConvert as $modelFile => $guarded Fields) {
    $path = $modelsDir . '\\' . $modelFile;
    
    if (!file_exists($path)) {
        echo "⚠️  Skipped: $modelFile (not found)\n";
        $skipped++;
        continue;
    }
    
    $content = file_get_contents($path);
    
    // Already converted?
    if (strpos($content, 'protected $guarded') !== false) {
        echo "✓  Already converted: $modelFile\n";
        $skipped++;
        continue;
    }
    
    // Find and replace$fillable pattern
    $pattern = '/protected \$fillable = \[[^\]]+\];/s';
    
    $guardedArray = "[\n        '" . implode("',\n        '", $guardedFields) . "',\n    ]";
    
    $replacement = "/**\n     * SECURITY: Use \$guarded to protect critical fields\n     */\n    protected \$guarded = $guardedArray;";
    
    $newContent = preg_replace($pattern, $replacement, $content);
    
    if ($newContent !== $content) {
        file_put_contents($path, $newContent);
        echo "✅ Converted: $modelFile\n";
        $converted++;
    } else {
        echo "⚠️  Failed to convert: $modelFile\n";
        $skipped++;
    }
}

echo "\n📊 Summary:\n";
echo "  Converted: $converted models\n";
echo "  Skipped: $skipped models\n";
echo "  Total: " . ($converted + $skipped) . " models processed\n";
