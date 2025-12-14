<?php

namespace App\Security;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * Password Policy Configuration
 * 
 * Enforces strong password requirements per OWASP recommendations.
 * All settings are configurable via environment variables.
 */
class PasswordPolicy
{
    /**
     * Minimum password length (OWASP recommends 12+)
     */
    public const MIN_LENGTH = 12;

    /**
     * Maximum password length (prevent DOS via bcrypt)
     */
    public const MAX_LENGTH = 128;

    /**
     * Require at least one uppercase letter
     */
    public const REQUIRE_UPPERCASE = true;

    /**
     * Require at least one lowercase letter
     */
    public const REQUIRE_LOWERCASE = true;

    /**
     * Require at least one number
     */
    public const REQUIRE_NUMBER = true;

    /**
     * Require at least one special character
     */
    public const REQUIRE_SPECIAL = true;

    /**
     * Number of previous passwords to prevent reuse
     */
    public const HISTORY_COUNT = 5;

    /**
     * Maximum days before password expires (0 = no expiry)
     */
    public const EXPIRY_DAYS = 0;

    /**
     * Common passwords to block (loaded from file)
     */
    public const BLOCK_COMMON = true;

    /**
     * Get the Laravel Password validation rule with all policies applied.
     */
    public static function rules(): Password
    {
        $rule = Password::min(self::MIN_LENGTH)
            ->max(self::MAX_LENGTH);

        if (self::REQUIRE_UPPERCASE) {
            $rule->mixedCase();
        }

        if (self::REQUIRE_NUMBER) {
            $rule->numbers();
        }

        if (self::REQUIRE_SPECIAL) {
            $rule->symbols();
        }

        if (self::BLOCK_COMMON) {
            $rule->uncompromised();
        }

        return $rule;
    }

    /**
     * Validate a password against the policy.
     * 
     * @param string $password
     * @return array{valid: bool, errors: array}
     */
    public static function validate(string $password): array
    {
        $validator = Validator::make(
            ['password' => $password],
            ['password' => ['required', 'string', self::rules()]]
        );

        return [
            'valid' => !$validator->fails(),
            'errors' => $validator->errors()->get('password'),
        ];
    }

    /**
     * Get human-readable password requirements.
     */
    public static function requirements(): array
    {
        $reqs = [
            "At least " . self::MIN_LENGTH . " characters",
        ];

        if (self::REQUIRE_UPPERCASE && self::REQUIRE_LOWERCASE) {
            $reqs[] = "Both uppercase and lowercase letters";
        }

        if (self::REQUIRE_NUMBER) {
            $reqs[] = "At least one number";
        }

        if (self::REQUIRE_SPECIAL) {
            $reqs[] = "At least one special character (!@#$%^&*...)";
        }

        if (self::BLOCK_COMMON) {
            $reqs[] = "Not a commonly used password";
        }

        return $reqs;
    }
}
