<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * FieldPermissionService
 * 
 * Centralized service for field-level permission control.
 * Determines which fields a user can view or edit based on their role and context.
 * 
 * Sprint 0: Foundation & Security
 */
class FieldPermissionService
{
    /**
     * Check if a user can edit a specific field on a model
     * 
     * @param User $user
     * @param Model $model
     * @param string $field
     * @return bool
     */
    public function canEdit(User $user, Model $model, string $field): bool
    {
        $modelClass = get_class($model);
        $role = $this->getUserRole($user);

        // System-managed fields (timestamps, IDs) - nobody can edit
        if (in_array($field, ['id', 'created_at', 'updated_at', 'deleted_at'])) {
            return false;
        }

        // Check specific model + field combinations
        return match ($modelClass) {
            'App\\Models\\Customer' => $this->canEditCustomerField($role, $field),
            'App\\Models\\Order' => $this->canEditOrderField($role, $field),
            'App\\Models\\Payment' => $this->canEditPaymentField($role, $field),
            'App\\Models\\Invoice' => $this->canEditInvoiceField($role, $field),
            'App\\Models\\MenuItem' => $this->canEditMenuItemField($role, $field),
            default => $this->canEditGenericField($role, $field),
        };
    }

    /**
     * Check if a user can view a specific field on a model
     * 
     * @param User $user
     * @param Model $model
     * @param string $field
     * @return bool
     */
    public function canView(User $user, Model $model, string $field): bool
    {
        $modelClass = get_class($model);
        $role = $this->getUserRole($user);

        // Most fields are viewable, only hide truly sensitive data
        return match ($modelClass) {
            'App\\Models\\Customer' => $this->canViewCustomerField($role, $field, $model, $user),
            'App\\Models\\Order' => $this->canViewOrderField($role, $field, $model, $user),
            'App\\Models\\Payment' => $this->canViewPaymentField($role, $field),
            'App\\Models\\MenuItem' => $this->canViewMenuItemField($role, $field),
            default => true, // Default: visible
        };
    }

    /**
     * Get list of editable fields for a user on a specific model instance
     * 
     * @param User $user
     * @param Model $model
     * @return array
     */
    public function getEditableFields(User $user, Model $model): array
    {
        $guarded = $model->getGuarded();
        $allFields = array_keys($model->getAttributes());
        
        $editableFields = [];
        foreach ($allFields as $field) {
            // Skip guarded fields (they're protected at model level)
            if (in_array($field, $guarded)) {
                // But check if this role has override permission
                if ($this->canOverrideGuarded($user, $model, $field)) {
                    $editableFields[] = $field;
                }
                continue;
            }

            // Check field-level permission
            if ($this->canEdit($user, $model, $field)) {
                $editableFields[] = $field;
            }
        }

        return $editableFields;
    }

    // ==================== CUSTOMER FIELD PERMISSIONS ====================

    private function canEditCustomerField(string $role, string $field): bool
    {
        // Financial/System fields: Admin override only
        $financialFields = ['loyalty_points', 'points_balance', 'total_spent', 'average_order_value'];
        $systemFields = ['customer_tier', 'visit_count', 'last_visit_date', 'last_purchase_date', 
                          'customer_code', 'referral_code', 'email_verified_at', 'phone_verified_at', 'no_show_count'];

        if (in_array($field, $financialFields) || in_array($field, $systemFields)) {
            return $role === 'admin'; // Admin can override with reason (logged separately)
        }

        // Tags: Admin + Manager
        if ($field === 'tags') {
            return in_array($role, ['admin', 'manager']);
        }

        // Notes: Admin + Manager + Staff
        if ($field === 'notes') {
            return in_array($role, ['admin', 'manager', 'staff']);
        }

        // Profile fields: Everyone (validated by controller)
        $profileFields = ['name', 'email', 'phone', 'birth_date', 'gender', 
                          'preferred_language', 'marketing_consent', 'communication_preferences', 'preferences'];
        if (in_array($field, $profileFields)) {
            return true; // Controller enforces "own profile only" for customers
        }

        return $role === 'admin'; // Default: admin only
    }

    private function canViewCustomerField(string $role, string $field, Model $customer, User $user): bool
    {
        // Customer can view their own data
        if ($role === 'customer' && $customer->user_id === $user->id) {
            // Hide internal notes
            return $field !== 'notes';
        }

        // Staff/Manager/Admin can view all
        return in_array($role, ['admin', 'manager', 'staff']);
    }

    // ==================== ORDER FIELD PERMISSIONS ====================

    private function canEditOrderField(string $role, string $field): bool
    {
        // Status transitions: Role-based workflow
        if ($field === 'status') {
            return in_array($role, ['admin', 'manager', 'staff']); // Staff can update status
        }

        // Approval: Admin + Manager
        if (in_array($field, [])) {
            return in_array($role, ['admin', 'manager']);
        }

        // Priority flagging: Admin + Manager
        if ($field === 'priority') {
            return in_array($role, ['admin', 'manager']);
        }

        // Payment fields: Admin only
        $paymentFields = ['payment_status', 'payment_mode', 'payment_collected_by', 'payment_collected_at'];
        if (in_array($field, $paymentFields)) {
            return $role === 'admin';
        }

        // Financial amounts: Never editable (system-calculated)
        $amountFields = ['subtotal', 'tax_amount', 'discount_amount', 'service_charge', 'delivery_fee', 'total_amount'];
        if (in_array($field, $amountFields)) {
            return false; // Only OrderCalculation Service
        }

        return $role === 'admin'; // Default: admin
    }

    private function canViewOrderField(string $role, string $field, Model $order, User $user): bool
    {
        // Customer can view their own orders
        if ($role === 'customer') {
            $customer = $user->customer;
            if ($customer && $order->customer_id === $customer->id) {
                // Hide internal fields
                return !in_array($field, ['notes', 'priority', 'approval_status']);
            }
            return false;
        }

        // Staff/Manager/Admin can view all
        return true;
    }

    // ==================== PAYMENT FIELD PERMISSIONS ====================

    private function canEditPaymentField(string $role, string $field): bool
    {
        // Cash handling fields: Staff + Admin
        if (in_array($field, ['cash_received', 'change_given', 'confirmed_by', 'confirmed_at'])) {
            return in_array($role, ['admin', 'staff']); // Staff can confirm cash
        }

        // Everything else: Admin only (PaymentService handles it)
        return $role === 'admin';
    }

    private function canViewPaymentField(string $role, string $field): bool
    {
        // Audit fields (IP, user agent, fingerprint): Admin only
        if (in_array($field, ['ip_address', 'user_agent', 'device_fingerprint', 'metadata'])) {
            return $role === 'admin';
        }

        // Customer sees basic payment info
        if ($role === 'customer') {
            return in_array($field, ['uuid', 'amount', 'tip', 'currency', 'status', 'notes', 'created_at']);
        }

        // Staff/Manager/Admin see all
        return true;
    }

    // ==================== MENU ITEM FIELD PERMISSIONS ====================

    private function canEditMenuItemField(string $role, string $field): bool
    {
        // Cost: Admin only (profit margin visibility)
        if ($field === 'cost') {
            return $role === 'admin';
        }

        // System fields
        if (in_array($field, ['rating', 'reviews_count'])) {
            return false; // System-calculated
        }

        // Everything else: Admin + Manager
        return in_array($role, ['admin', 'manager']);
    }

    private function canViewMenuItemField(string $role, string $field): bool
    {
        // Cost: Admin only
        if ($field === 'cost') {
            return $role === 'admin';
        }

        // Everything else: Public
        return true;
    }

    // ==================== INVOICE FIELD PERMISSIONS ====================

    private function canEditInvoiceField(string $role, string $field): bool
    {
        // All financial fields: Never directly editable (InvoiceService/PaymentService)
        return false;
    }

    // ==================== GENERIC FIELD PERMISSIONS ====================

    private function canEditGenericField(string $role, string $field): bool
    {
        // For models without specific rules, only admin can edit
        return $role === 'admin';
    }

    // ==================== HELPER METHODS ====================

    private function getUserRole(User $user): string
    {
        // Check user's role (simplified for now, can check roles table)
        if ($user->hasRole('admin')) return 'admin';
        if ($user->hasRole('manager')) return 'manager';
        if ($user->hasRole('staff')) return 'staff';
        if ($user->hasRole('customer')) return 'customer';
        
        return 'guest';
    }

    private function canOverrideGuarded(User $user, Model $model, string $field): bool
    {
        $role = $this->getUserRole($user);
        
        // Admin can override certain guarded fields with audit trail
        if ($role !== 'admin') {
            return false;
        }

        $modelClass = get_class($model);
        
        // Customer tier override: Admin can manually set
        if ($modelClass === 'App\\Models\\Customer' && $field === 'customer_tier') {
            return true; // But must log reason in audit table
        }

        return false;
    }
}
