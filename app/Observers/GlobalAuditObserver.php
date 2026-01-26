<?php

namespace App\Observers;

use App\Models\AuditLog;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Global Model Observer - Tracks ALL model changes
 * 
 * This observer is registered in AppServiceProvider and automatically tracks:
 * - Created records (with full data snapshot)
 * - Updated records (with before/after comparison)
 * - Deleted records (soft delete - marked as deleted)
 * - Restored records (soft delete restoration)
 * 
 * ⚠️ SECURITY NOTE: This observer excludes certain models from audit logging:
 * - AuditLog (prevent recursive logging)
 * - Cache tables
 * - Session tables
 * - Internal system tables
 */
class GlobalAuditObserver
{
    /**
     * Models to exclude from audit logging
     * (to prevent recursive logging or log table pollution)
     */
    private const EXCLUDED_MODELS = [
        'App\Models\AuditLog',
        'App\Models\Cache',
        'App\Models\CacheLock',
        'App\Models\Session',
        'App\Models\FailedJob',
        'App\Models\JobBatch',
    ];

    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        if ($this->shouldExclude($model)) {
            return;
        }

        // Capture the created data
        $data = $model->getAttributes();

        // Log as 'created' action
        AuditService::log(
            action: 'created',
            model: $model,
            before: null,
            after: $data,
            metadata: [
                'model_class' => $model::class,
                'model_id' => $model->getKey(),
            ]
        );
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        if ($this->shouldExclude($model)) {
            return;
        }

        // Get original (before) data from dirty attributes
        $original = $model->getOriginal();
        $current = $model->getAttributes();

        // Filter to only changed attributes
        $before = [];
        $after = [];
        $hasChanges = false;

        foreach ($current as $key => $value) {
            $oldValue = $original[$key] ?? null;
            
            // Skip timestamp columns (they always change)
            if (in_array($key, ['created_at', 'updated_at'])) {
                continue;
            }

            if ($oldValue !== $value) {
                $before[$key] = $oldValue;
                $after[$key] = $value;
                $hasChanges = true;
            }
        }

        // Only log if actual changes were made
        if (!$hasChanges) {
            return;
        }

        // Log as 'updated' action
        AuditService::log(
            action: 'updated',
            model: $model,
            before: $before,
            after: $after,
            metadata: [
                'model_class' => $model::class,
                'model_id' => $model->getKey(),
                'changed_fields' => array_keys($after),
            ]
        );
    }

    /**
     * Handle the model "deleted" event.
     * 
     * This fires for:
     * - Soft deletes (if model uses SoftDeletes trait)
     * - Hard deletes
     */
    public function deleted(Model $model): void
    {
        if ($this->shouldExclude($model)) {
            return;
        }

        // Determine if this is a soft delete or hard delete
        $isSoftDelete = method_exists($model, 'isForceDeleting') ? !$model->isForceDeleting() : false;

        // Log with appropriate action
        AuditService::log(
            action: $isSoftDelete ? 'soft_deleted' : 'deleted',
            model: $model,
            before: $model->getAttributes(),
            after: null,
            metadata: [
                'model_class' => $model::class,
                'model_id' => $model->getKey(),
                'is_soft_delete' => $isSoftDelete,
            ]
        );
    }

    /**
     * Handle the model "restored" event.
     * 
     * This fires when a soft-deleted model is restored.
     */
    public function restored(Model $model): void
    {
        if ($this->shouldExclude($model)) {
            return;
        }

        // Log the restoration
        AuditService::log(
            action: 'restored',
            model: $model,
            before: null,
            after: $model->getAttributes(),
            metadata: [
                'model_class' => $model::class,
                'model_id' => $model->getKey(),
            ]
        );
    }

    /**
     * Handle the model "force deleted" event.
     * (This is for permanent deletion of soft-deleted models)
     */
    public function forceDeleted(Model $model): void
    {
        if ($this->shouldExclude($model)) {
            return;
        }

        // Log as permanent deletion
        AuditService::log(
            action: 'force_deleted',
            model: $model,
            before: $model->getAttributes(),
            after: null,
            metadata: [
                'model_class' => $model::class,
                'model_id' => $model->getKey(),
                'deletion_type' => 'permanent',
            ]
        );
    }

    /**
     * Check if a model should be excluded from audit logging
     * 
     * @param Model $model
     * @return bool
     */
    private function shouldExclude(Model $model): bool
    {
        // Check exclusion list
        foreach (self::EXCLUDED_MODELS as $excludedClass) {
            if ($model instanceof $excludedClass) {
                return true;
            }
        }

        // Check if model has audit logging disabled
        if (method_exists($model, 'shouldAudit') && !$model->shouldAudit()) {
            return true;
        }

        return false;
    }
}
