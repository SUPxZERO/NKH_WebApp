<?php

namespace App\Enums;

class OrderStatus
{
    public const PENDING = 'pending';
    public const RECEIVED = 'received';
    public const CONFIRMED = 'confirmed';
    public const PREPARING = 'preparing';
    public const READY = 'ready';
    public const COMPLETED = 'completed';
    public const CANCELLED = 'cancelled';

    public static function all(): array
    {
        return [
            self::PENDING,
            self::RECEIVED,
            self::CONFIRMED,
            self::PREPARING,
            self::READY,
            self::COMPLETED,
            self::CANCELLED,
        ];
    }

    public static function getLabel(string $status): string
    {
        return match ($status) {
            self::PENDING => __('messages.status.pending'),
            self::RECEIVED => __('messages.status.received'),
            self::CONFIRMED => __('messages.status.confirmed'),
            self::PREPARING => __('messages.status.preparing'),
            self::READY => __('messages.status.ready'),
            self::COMPLETED => __('messages.status.completed'),
            self::CANCELLED => __('messages.status.cancelled'),
            default => ucfirst($status),
        };
    }
}