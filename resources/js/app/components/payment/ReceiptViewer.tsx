import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Receipt,
    Download,
    Mail,
    Printer,
    CheckCircle2,
    Clock,
    X,
    Loader2,
    FileText,
    ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import {
    useReceipt,
    useSendReceiptEmail,
    getReceiptPdfUrl,
    getReceiptPrintUrl,
    ReceiptData,
} from '@/app/hooks/useReceipt';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface ReceiptViewerProps {
    paymentId: number;
    onClose?: () => void;
    showActions?: boolean;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-400' },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

export default function ReceiptViewer({ paymentId, onClose, showActions = true }: ReceiptViewerProps) {
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [email, setEmail] = useState('');

    const { data: receipt, isLoading, error } = useReceipt(paymentId);
    const sendEmail = useSendReceiptEmail();

    const formatCurrency = (amount: number, currency?: string) => {
        if (currency === 'KHR') {
            return `៛${amount.toLocaleString()}`;
        }
        return `$${amount.toFixed(2)}`;
    };

    const handleDownloadPdf = () => {
        window.open(getReceiptPdfUrl(paymentId), '_blank');
    };

    const handlePrint = (format: 'standard' | 'thermal' = 'standard') => {
        window.open(getReceiptPrintUrl(paymentId, format), '_blank');
    };

    const handleSendEmail = async () => {
        if (!email.trim()) {
            toastError('Please enter an email address');
            return;
        }

        try {
            await sendEmail.mutateAsync({ paymentId, email });
            toastSuccess(`Receipt sent to ${email}`);
            setShowEmailModal(false);
            setEmail('');
        } catch (error: any) {
            toastError(error.message || 'Failed to send email');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="text-center py-12 text-gray-400">
                <X className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Failed to load receipt</p>
            </div>
        );
    }

    const statusConfig = statusColors[receipt.payment_status] || statusColors.pending;

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            {showActions && (
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-violet-400" />
                        Receipt
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={handleDownloadPdf}>
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handlePrint('standard')}>
                            <Printer className="w-4 h-4 mr-1" />
                            Print
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowEmailModal(true)}>
                            <Mail className="w-4 h-4 mr-1" />
                            Email
                        </Button>
                        {onClose && (
                            <Button size="sm" variant="ghost" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Receipt Card */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                    {/* Business Header */}
                    <div className="text-center mb-6 pb-4 border-b border-white/10">
                        <h3 className="text-xl font-bold">{receipt.business_name}</h3>
                        {receipt.location_name && (
                            <p className="text-gray-400 text-sm">{receipt.location_name}</p>
                        )}
                        <p className="text-gray-500 text-sm">{receipt.business_address}</p>
                        {receipt.business_phone && (
                            <p className="text-gray-500 text-sm">Tel: {receipt.business_phone}</p>
                        )}
                    </div>

                    {/* Receipt Info */}
                    <div className="flex justify-between items-center mb-4 p-3 bg-white/5 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">Receipt #</p>
                            <p className="font-mono font-bold">{receipt.receipt_number}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm">
                                {new Date(receipt.receipt_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Order Info */}
                    {receipt.order_number && (
                        <div className="mb-4 text-sm">
                            <span className="text-gray-400">Order:</span>{' '}
                            <span className="font-bold">#{receipt.order_number}</span>
                            {receipt.table_number && (
                                <>
                                    <span className="text-gray-400 ml-3">Table:</span>{' '}
                                    <span>{receipt.table_number}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    <div className="mb-4">
                        <h4 className="text-xs text-gray-500 uppercase mb-2">Items</h4>
                        <div className="space-y-2">
                            {receipt.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <div className="flex-1">
                                        <span>{item.name}</span>
                                        <span className="text-gray-500 ml-2">×{item.quantity}</span>
                                    </div>
                                    <span>{formatCurrency(item.total, receipt.currency)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-white/10 pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal</span>
                            <span>{formatCurrency(receipt.subtotal, receipt.currency)}</span>
                        </div>
                        {receipt.tax_amount > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Tax ({receipt.tax_rate}%)</span>
                                <span>{formatCurrency(receipt.tax_amount, receipt.currency)}</span>
                            </div>
                        )}
                        {receipt.discount_amount > 0 && (
                            <div className="flex justify-between text-sm text-green-400">
                                <span>Discount</span>
                                <span>-{formatCurrency(receipt.discount_amount, receipt.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                            <span>Total</span>
                            <span className="text-violet-400">
                                {formatCurrency(receipt.total_amount, receipt.currency)}
                            </span>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-4 p-4 bg-violet-500/10 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-bold">{receipt.payment_method}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                                {receipt.payment_status.toUpperCase()}
                            </span>
                        </div>
                        <div className="mt-2 text-sm">
                            <span className="text-gray-400">Amount Paid: </span>
                            <span className="font-bold">
                                {formatCurrency(receipt.amount_paid, receipt.currency)}
                            </span>
                        </div>
                        {receipt.cash_received && (
                            <div className="mt-2 text-sm border-t border-violet-500/20 pt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Cash Received</span>
                                    <span>{formatCurrency(receipt.cash_received, receipt.currency)}</span>
                                </div>
                                {receipt.change_given && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Change</span>
                                        <span>{formatCurrency(receipt.change_given, receipt.currency)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-gray-400">
                        <p className="font-medium">{receipt.thank_you_message}</p>
                        <p className="text-sm">{receipt.footer_text}</p>
                        {receipt.transaction_id && (
                            <p className="text-xs font-mono mt-2">TXN: {receipt.transaction_id}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Email Modal */}
            <Modal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                title="Email Receipt"
            >
                <div className="space-y-4">
                    <p className="text-gray-400">
                        Enter an email address to send the receipt:
                    </p>
                    <Input
                        type="email"
                        placeholder="customer@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowEmailModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-violet-600 hover:bg-violet-700"
                            onClick={handleSendEmail}
                            disabled={sendEmail.isPending}
                        >
                            {sendEmail.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Mail className="w-4 h-4 mr-2" />
                            )}
                            Send Receipt
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
