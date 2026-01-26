<?php

namespace App\Listeners;

use App\Services\AuditService;
use Illuminate\Auth\Events\Login;

/**
 * Listen to user login events and log to audit trail
 */
class LogUserLogin
{
    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        AuditService::log(
            action: 'login',
            model: null,
            before: null,
            after: [
                'user_id' => $event->user->id,
                'email' => $event->user->email,
                'name' => $event->user->name,
            ],
            metadata: [
                'remember' => $event->remember,
                'guard' => $event->guard,
            ]
        );
    }
}
