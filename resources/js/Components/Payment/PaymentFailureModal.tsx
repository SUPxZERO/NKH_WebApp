import React, { useState } from 'react';
import { AlertCircle, RefreshCw, CreditCard, X } from 'lucide-react';
import { router } from '@inertiajs/react';

interface PaymentFailureModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    errorMessage: string;
    onRetry?: () => void;
    availablePaymentMethods?: Array<{
        id: number;
        code: string;
        name: string;
    }>;
}

/**
 * Sprint 3: Payment Failure Recovery Modal
 * 
 * Shown when payment processing fails, offering users multiple recovery options:
 * - Retry the same payment method
 * - Choose a different payment method
 * - Review/cancel the order
 * 
 * Helps reduce cart abandonment by providing clear next steps.
 */
export function PaymentFailureModal({
    isOpen,
    onClose,
    orderId,
    errorMessage,
    onRetry,
    availablePaymentMethods = []
}: PaymentFailureModalProps) {
    const [isRetrying, setIsRetrying] = useState(false);

    if (!isOpen) return null;

    const handleRetry = async () => {
        if (onRetry) {
            setIsRetrying(true);
            try {
                await onRetry();
            } finally {
                setIsRetrying(false);
            }
        }
    };

    const handleChangeMethod = () => {
        router.visit(`/checkout?order_id=${orderId}`, {
            preserveState: false,
            replace: false
        });
        onClose();
    };

    const handleReviewOrder = () => {
        router.visit(`/orders/${orderId}`, {
            preserveState: false
        });
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Payment Failed
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Order #{orderId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Error Message */}
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-800">
                                <span className="font-medium">Error: </span>
                                {errorMessage}
                            </p>
                        </div>

                        {/* Help Text */}
                        <p className="text-sm text-gray-600">
                            Don't worry! Your order is saved. Here's what you can do:
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {/* Retry Button */}
                            {onRetry && (
                                <button
                                    onClick={handleRetry}
                                    disabled={isRetrying}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                    {isRetrying ? 'Retrying...' : 'Try Again'}
                                </button>
                            )}

                            {/* Change Payment Method */}
                            <button
                                onClick={handleChangeMethod}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
                            >
                                <CreditCard className="h-4 w-4" />
                                Use Different Payment Method
                            </button>

                            {/* Review Order */}
                            <button
                                onClick={handleReviewOrder}
                                className="w-full text-gray-600 px-4 py-2 hover:text-gray-800 transition-colors text-sm"
                            >
                                Review Order Details
                            </button>
                        </div>

                        {/* Available Methods (if provided) */}
                        {availablePaymentMethods.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">
                                    Available payment methods:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {availablePaymentMethods.map((method) => (
                                        <span
                                            key={method.id}
                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                                        >
                                            {method.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                        <p className="text-xs text-gray-500 text-center">
                            Need help? Contact our support team at{' '}
                            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                                support@example.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * Simpler version for quick integration
 */
export function usePaymentFailure() {
    const [failure, setFailure] = useState<{
        show: boolean;
        orderId: number;
        message: string;
    } | null>(null);

    const showFailure = (orderId: number, message: string) => {
        setFailure({ show: true, orderId, message });
    };

    const hideFailure = () => {
        setFailure(null);
    };

    return {
        failure,
        showFailure,
        hideFailure
    };
}
