<?php

namespace App\Listeners;

use App\Services\AuditService;
use Illuminate\Auth\Events\Failed;

/**
 * Listen to failed login attempts and log to audit trail
 */
class LogFailedLogin
{
    /**
     * Handle the event.
     */
    public function handle(Failed $event): void
    {
        AuditService::logFailure(
            action: 'login_failed',
            errorMessage: 'Invalid credentials provided',
            context: [
                'credentials' => [
                    'email' => $event->credentials['email'] ?? null,
                    'guard' => $event->guard,
                ],
            ]
        );
    }
}
