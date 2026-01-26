<?php

namespace App\Listeners;

use App\Services\AuditService;
use Illuminate\Auth\Events\Registered;

/**
 * Listen to user registration events and log to audit trail
 */
class LogUserRegistration
{
    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        AuditService::log(
            action: 'register',
            model: $event->user,
            before: null,
            after: [
                'user_id' => $event->user->id,
                'email' => $event->user->email,
                'name' => $event->user->name,
            ],
            metadata: [
                'source' => 'user_registration',
            ]
        );
    }
}
