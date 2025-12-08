<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Bakong Open API Integration Service
 * 
 * Integrates with NBC's Bakong payment system for KHQR payments.
 * @see BakongApiInfo.md for API documentation
 */
class BakongApiService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = config('payment.bakong.api_url', 'https://sit-api-bakong.nbc.gov.kh');
        $this->token = config('payment.bakong.token', '');
    }

    /**
     * Get authorization header.
     */
    protected function getAuthHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Renew API token.
     * POST /v1/renew_token
     */
    public function renewToken(string $email): ?string
    {
        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post("{$this->baseUrl}/v1/renew_token", [
                    'email' => $email,
                ]);

            if ($response->successful() && $response->json('responseCode') === 0) {
                $newToken = $response->json('data.token');
                
                // Store new token in cache
                Cache::put('bakong_api_token', $newToken, 3600 * 23); // 23 hours
                
                return $newToken;
            }

            Log::error('Bakong token renewal failed', [
                'response' => $response->json(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Bakong API error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Generate deeplink from KHQR string.
     * POST /v1/generate_deeplink_by_qr
     */
    public function generateDeeplink(string $qrString, array $sourceInfo = []): ?array
    {
        try {
            $payload = ['qr' => $qrString];
            
            if (!empty($sourceInfo)) {
                $payload['sourceInfo'] = [
                    'appIconUrl' => $sourceInfo['icon_url'] ?? config('app.url') . '/images/logo.png',
                    'appName' => $sourceInfo['app_name'] ?? config('app.name'),
                    'appDeepLinkCallback' => $sourceInfo['callback_url'] ?? config('app.url') . '/payment/callback',
                ];
            }

            $response = Http::withHeaders($this->getAuthHeaders())
                ->post("{$this->baseUrl}/v1/generate_deeplink_by_qr", $payload);

            if ($response->successful() && $response->json('responseCode') === 0) {
                return [
                    'success' => true,
                    'short_link' => $response->json('data.shortLink'),
                ];
            }

            Log::warning('Bakong deeplink generation failed', [
                'response_code' => $response->json('responseCode'),
                'error_code' => $response->json('errorCode'),
                'message' => $response->json('responseMessage'),
            ]);

            return [
                'success' => false,
                'error' => $response->json('responseMessage') ?? 'Deeplink generation failed',
            ];
        } catch (\Exception $e) {
            Log::error('Bakong API error', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Check transaction status by MD5 hash.
     * POST /v1/check_transaction_by_md5
     */
    public function checkTransactionByMd5(string $md5Hash): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_md5', ['md5' => $md5Hash]);
    }

    /**
     * Check transaction status by full hash.
     * POST /v1/check_transaction_by_hash
     */
    public function checkTransactionByHash(string $fullHash): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_hash', ['hash' => $fullHash]);
    }

    /**
     * Check transaction status by short hash.
     * POST /v1/check_transaction_by_short_hash
     */
    public function checkTransactionByShortHash(string $shortHash): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_short_hash', ['shortHash' => $shortHash]);
    }

    /**
     * Check transaction status by instruction reference.
     * POST /v1/check_transaction_by_instruction_ref
     */
    public function checkTransactionByInstructionRef(string $instructionRef): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_instruction_ref', [
            'instructionRef' => $instructionRef,
        ]);
    }

    /**
     * Check transaction status by external reference.
     * POST /v1/check_transaction_by_external_ref
     */
    public function checkTransactionByExternalRef(string $externalRef): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_external_ref', [
            'externalRef' => $externalRef,
        ]);
    }

    /**
     * Check multiple transactions by MD5 list.
     * POST /v1/check_transaction_by_md5_list
     */
    public function checkTransactionsByMd5List(array $md5List): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_md5_list', ['md5List' => $md5List]);
    }

    /**
     * Check multiple transactions by hash list.
     * POST /v1/check_transaction_by_hash_list
     */
    public function checkTransactionsByHashList(array $hashList): ?array
    {
        return $this->checkTransaction('/v1/check_transaction_by_hash_list', ['hashList' => $hashList]);
    }

    /**
     * Check Bakong account status.
     * POST /v1/check_bakong_account
     */
    public function checkBakongAccount(string $accountId): ?array
    {
        try {
            $response = Http::withHeaders($this->getAuthHeaders())
                ->post("{$this->baseUrl}/v1/check_bakong_account", [
                    'accountId' => $accountId,
                ]);

            if ($response->successful()) {
                return [
                    'success' => $response->json('responseCode') === 0,
                    'data' => $response->json('data'),
                    'error_code' => $response->json('errorCode'),
                    'message' => $response->json('responseMessage'),
                ];
            }

            return [
                'success' => false,
                'error' => 'API request failed',
            ];
        } catch (\Exception $e) {
            Log::error('Bakong account check error', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Generic transaction check method.
     */
    protected function checkTransaction(string $endpoint, array $payload): ?array
    {
        try {
            $response = Http::withHeaders($this->getAuthHeaders())
                ->post("{$this->baseUrl}{$endpoint}", $payload);

            if ($response->successful()) {
                $code = $response->json('responseCode');
                
                return [
                    'success' => $code === 0,
                    'found' => $code === 0,
                    'data' => $response->json('data'),
                    'error_code' => $response->json('errorCode'),
                    'message' => $response->json('responseMessage'),
                ];
            }

            return [
                'success' => false,
                'error' => 'API request failed with status ' . $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('Bakong transaction check error', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Generate MD5 hash for transaction lookup.
     * Format: md5(qrString)
     */
    public function generateTransactionMd5(string $qrString): string
    {
        return md5($qrString);
    }

    /**
     * Poll for transaction completion.
     * Returns result when transaction is found or timeout reached.
     */
    public function pollTransactionStatus(
        string $md5Hash,
        int $maxAttempts = 30,
        int $intervalSeconds = 2
    ): array {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $result = $this->checkTransactionByMd5($md5Hash);
            
            if ($result && $result['found']) {
                return [
                    'success' => true,
                    'found' => true,
                    'data' => $result['data'],
                    'attempts' => $attempt,
                ];
            }
            
            if ($attempt < $maxAttempts) {
                sleep($intervalSeconds);
            }
        }

        return [
            'success' => false,
            'found' => false,
            'message' => 'Transaction not found after ' . $maxAttempts . ' attempts',
        ];
    }
}
