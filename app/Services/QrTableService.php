<?php

namespace App\Services;

use App\Models\DiningTable;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * QrTableService
 * 
 * Service for generating and managing QR codes for restaurant tables.
 * Handles QR token generation, verification, and image rendering.
 */
class QrTableService
{
    /**
     * Default QR code settings
     */
    protected int $defaultSize = 300;
    protected string $defaultFormat = 'png';
    protected string $defaultErrorCorrection = 'M';

    /**
     * Generate or regenerate QR code for a table
     */
    public function generateQrForTable(DiningTable $table): string
    {
        $token = $table->generateQrToken();
        
        Log::info("Generated QR token for table {$table->code}", [
            'table_id' => $table->id,
            'token_prefix' => substr($token, 0, 20) . '...',
        ]);

        return $token;
    }

    /**
     * Generate QR codes for multiple tables
     */
    public function bulkGenerateQr(array $tableIds): array
    {
        $results = [];
        $tables = DiningTable::whereIn('id', $tableIds)->get();

        foreach ($tables as $table) {
            try {
                $token = $this->generateQrForTable($table);
                $results[$table->id] = [
                    'success' => true,
                    'token' => $token,
                    'url' => $table->getQrUrl(),
                ];
            } catch (\Exception $e) {
                $results[$table->id] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
                Log::error("Failed to generate QR for table {$table->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Generate QR code image as base64
     * 
     * Uses simplesoftwareio/simple-qrcode if available,
     * otherwise falls back to external service.
     */
    public function getQrImageBase64(DiningTable $table, int $size = null): string
    {
        $url = $table->getQrUrl();
        $size = $size ?? $this->defaultSize;
        
        Log::info("Generating QR image for table {$table->id}", ['url' => $url, 'size' => $size]);

        // Try to use simple-qrcode package if available
        if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
            Log::info("SimpleSoftwareIO\QrCode class exists, attempting generation");
            try {
                // Use SVG format to avoid Imagick dependency
                $qrCode = QrCode::format('svg')
                    ->size($size)
                    ->errorCorrection($this->defaultErrorCorrection)
                    ->generate($url);
                
                $svgLength = strlen($qrCode);
                Log::info("QR Code SVG generated successfully", ['length' => $svgLength]);

                if ($svgLength > 0) {
                     return 'data:image/svg+xml;base64,' . base64_encode($qrCode);
                }
                Log::warning("Generated SVG string was empty");
            } catch (\Exception $e) {
                Log::warning("QrCode package failed, falling back to external service", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        } else {
             Log::info("SimpleSoftwareIO\QrCode class NOT found");
        }

        // Fallback to QR Server API
        $encodedUrl = urlencode($url);
        $qrServerUrl = "https://api.qrserver.com/v1/create-qr-code/?size={$size}x{$size}&data={$encodedUrl}";
        Log::info("Attempting fallback to QR Server", ['url' => $qrServerUrl]);
        
        try {
            $imageData = file_get_contents($qrServerUrl);
            if ($imageData) {
                Log::info("QR Server fallback successful", ['length' => strlen($imageData)]);
                return 'data:image/png;base64,' . base64_encode($imageData);
            }
            Log::warning("QR Server returned empty data");
        } catch (\Exception $e) {
            Log::error("Failed to fetch QR from QR Server API", [
                'error' => $e->getMessage(),
            ]);
        }

        throw new \Exception("Failed to generate QR code image");
    }

    /**
     * Get QR code as SVG string
     */
    public function getQrImageSvg(DiningTable $table, int $size = null): string
    {
        $url = $table->getQrUrl();
        $size = $size ?? $this->defaultSize;

        if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
            try {
                return QrCode::format('svg')
                    ->size($size)
                    ->errorCorrection($this->defaultErrorCorrection)
                    ->generate($url);
            } catch (\Exception $e) {
                Log::warning("QrCode SVG generation failed", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Return base64 PNG as fallback for SVG
        return $this->getQrImageBase64($table, $size);
    }

    /**
     * Verify a QR token and return the table if valid
     */
    public function verifyAndGetTable(string $token): ?DiningTable
    {
        return DiningTable::findByQrToken($token);
    }

    /**
     * Rotate QR token for a table (regenerate)
     */
    public function rotateToken(DiningTable $table): string
    {
        Log::info("Rotating QR token for table {$table->code}", [
            'table_id' => $table->id,
            'old_token_prefix' => $table->qr_token ? substr($table->qr_token, 0, 20) . '...' : 'none',
        ]);

        return $this->generateQrForTable($table);
    }

    /**
     * Get printable QR code data for a table
     * Returns data suitable for printing table tents/cards
     */
    public function getPrintableData(DiningTable $table): array
    {
        return [
            'table_id' => $table->id,
            'table_code' => $table->code,
            'floor_name' => $table->floor?->name ?? "Floor {$table->floor_id}",
            'capacity' => $table->capacity,
            'qr_url' => $table->getQrUrl(),
            'qr_image_base64' => $this->getQrImageBase64($table, 400),
            'generated_at' => $table->qr_generated_at?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get QR statistics for admin dashboard
     */
    public function getStatistics(): array
    {
        return [
            'total_tables' => DiningTable::count(),
            'tables_with_qr' => DiningTable::withQr()->count(),
            'tables_without_qr' => DiningTable::withoutQr()->count(),
            'available_tables' => DiningTable::available()->count(),
            'occupied_tables' => DiningTable::where('status', 'occupied')->count(),
        ];
    }
}
