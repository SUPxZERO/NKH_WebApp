<?php

namespace App\Listeners;

use App\Services\AuditService;
use Illuminate\Auth\Events\Logout;

/**
 * Listen to user logout events and log to audit trail
 */
class LogUserLogout
{
    /**
     * Handle the event.
     */
    public function handle(Logout $event): void
    {
        AuditService::log(
            action: 'logout',
            model: null,
            before: null,
            after: [
                'user_id' => $event->user->id,
                'email' => $event->user->email,
                'name' => $event->user->name,
            ],
            metadata: [
                'guard' => $event->guard,
            ]
        );
    }
}
