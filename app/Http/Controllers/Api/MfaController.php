<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Security\SecurityEventLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * MFA Controller
 * 
 * Handles Multi-Factor Authentication (TOTP) setup and verification.
 * Uses TOTP (Time-based One-Time Password) compatible with Google Authenticator, Authy, etc.
 */
class MfaController extends Controller
{
    /**
     * Generate a new MFA secret for setup.
     * Returns the secret and a QR code URL for authenticator apps.
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->mfa_enabled) {
            return response()->json([
                'message' => 'MFA is already enabled for this account.',
            ], 400);
        }

        // Generate a new secret (base32 encoded, 16 characters)
        $secret = $this->generateSecret();

        // Store temporarily (not enabled yet until verified)
        $user->mfa_secret = encrypt($secret);
        $user->save();

        // Generate QR code URL for authenticator apps
        $appName = config('app.name', 'NKH Restaurant');
        $email = $user->email;
        $otpauthUrl = "otpauth://totp/{$appName}:{$email}?secret={$secret}&issuer={$appName}";

        return response()->json([
            'message' => 'MFA setup initiated. Scan the QR code with your authenticator app.',
            'secret' => $secret,
            'qr_url' => $otpauthUrl,
            'manual_entry' => [
                'account' => $email,
                'key' => $secret,
                'type' => 'Time-based',
            ],
        ]);
    }

    /**
     * Verify the TOTP code and enable MFA.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if ($user->mfa_enabled) {
            return response()->json([
                'message' => 'MFA is already enabled.',
            ], 400);
        }

        if (!$user->mfa_secret) {
            return response()->json([
                'message' => 'Please initiate MFA setup first.',
            ], 400);
        }

        $secret = decrypt($user->mfa_secret);
        $code = $request->input('code');

        if (!$this->verifyTotp($secret, $code)) {
            return response()->json([
                'message' => 'Invalid verification code.',
            ], 400);
        }

        // Enable MFA and generate backup codes
        $backupCodes = $this->generateBackupCodes();

        $user->mfa_enabled = true;
        $user->save();

        // Store backup codes (in production, store hashed)
        $this->storeBackupCodes($user->id, $backupCodes);

        SecurityEventLogger::log(SecurityEventLogger::EVENT_MFA_ENABLED, $user->id);

        return response()->json([
            'message' => 'MFA has been enabled successfully.',
            'backup_codes' => $backupCodes,
            'warning' => 'Save these backup codes in a secure location. They can only be shown once.',
        ]);
    }

    /**
     * Disable MFA for the account.
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!$user->mfa_enabled) {
            return response()->json([
                'message' => 'MFA is not enabled.',
            ], 400);
        }

        // Verify password
        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid password.',
            ], 401);
        }

        // Verify TOTP
        $secret = decrypt($user->mfa_secret);
        if (!$this->verifyTotp($secret, $request->input('code'))) {
            return response()->json([
                'message' => 'Invalid verification code.',
            ], 400);
        }

        $user->mfa_enabled = false;
        $user->mfa_secret = null;
        $user->save();

        // Delete backup codes
        $this->deleteBackupCodes($user->id);

        SecurityEventLogger::log(SecurityEventLogger::EVENT_MFA_DISABLED, $user->id);

        return response()->json([
            'message' => 'MFA has been disabled.',
        ]);
    }

    /**
     * Validate MFA code during login.
     */
    public function validateLoginCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();

        if (!$user->mfa_enabled) {
            return response()->json([
                'message' => 'MFA is not enabled for this account.',
            ], 400);
        }

        $code = $request->input('code');

        // Check if it's a backup code
        if (strlen($code) === 10) {
            if ($this->verifyBackupCode($user->id, $code)) {
                return response()->json(['message' => 'MFA verified via backup code.', 'valid' => true]);
            }
        }

        // Verify TOTP
        $secret = decrypt($user->mfa_secret);
        if ($this->verifyTotp($secret, $code)) {
            return response()->json(['message' => 'MFA verified.', 'valid' => true]);
        }

        return response()->json(['message' => 'Invalid code.', 'valid' => false], 400);
    }

    /**
     * Get MFA status for current user.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'mfa_enabled' => (bool) $user->mfa_enabled,
        ]);
    }

    /**
     * Generate a base32 secret for TOTP.
     */
    protected function generateSecret(int $length = 16): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }
        return $secret;
    }

    /**
     * Verify a TOTP code.
     */
    protected function verifyTotp(string $secret, string $code, int $window = 1): bool
    {
        $timeStep = 30;
        $currentTime = floor(time() / $timeStep);

        // Check codes within the time window
        for ($i = -$window; $i <= $window; $i++) {
            $expectedCode = $this->generateTotp($secret, $currentTime + $i);
            if (hash_equals($expectedCode, $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate TOTP code for a given time counter.
     */
    protected function generateTotp(string $secret, int $counter): string
    {
        // Decode base32 secret
        $key = $this->base32Decode($secret);

        // Pack counter as 64-bit big-endian
        $data = pack('N*', 0) . pack('N*', $counter);

        // Generate HMAC-SHA1
        $hash = hash_hmac('sha1', $data, $key, true);

        // Dynamic truncation
        $offset = ord($hash[19]) & 0x0F;
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Decode base32 string.
     */
    protected function base32Decode(string $input): string
    {
        $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $input = strtoupper($input);
        $input = str_replace('=', '', $input);

        $buffer = 0;
        $bits = 0;
        $output = '';

        foreach (str_split($input) as $char) {
            $val = strpos($map, $char);
            if ($val === false)
                continue;

            $buffer = ($buffer << 5) | $val;
            $bits += 5;

            if ($bits >= 8) {
                $bits -= 8;
                $output .= chr(($buffer >> $bits) & 0xFF);
            }
        }

        return $output;
    }

    /**
     * Generate backup codes.
     */
    protected function generateBackupCodes(int $count = 10): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(Str::random(10));
        }
        return $codes;
    }

    /**
     * Store backup codes (hashed).
     */
    protected function storeBackupCodes(int $userId, array $codes): void
    {
        // Store in cache or database - simplified for now
        cache()->put("mfa_backup_codes:{$userId}", array_map(fn($c) => Hash::make($c), $codes), now()->addYear());
    }

    /**
     * Verify and consume a backup code.
     */
    protected function verifyBackupCode(int $userId, string $code): bool
    {
        $storedCodes = cache()->get("mfa_backup_codes:{$userId}", []);

        foreach ($storedCodes as $index => $hashedCode) {
            if (Hash::check($code, $hashedCode)) {
                // Remove used code
                unset($storedCodes[$index]);
                cache()->put("mfa_backup_codes:{$userId}", array_values($storedCodes), now()->addYear());
                return true;
            }
        }

        return false;
    }

    /**
     * Delete all backup codes.
     */
    protected function deleteBackupCodes(int $userId): void
    {
        cache()->forget("mfa_backup_codes:{$userId}");
    }
}
