import React, { useState, useEffect } from 'react';
import { AdminPaymentMethod, UpdatePaymentMethodPayload } from '@/app/hooks/usePaymentMethods';
import { Input, Textarea } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { ConfigurationEditor } from './ConfigurationEditor';

interface PaymentMethodFormProps {
    paymentMethod: AdminPaymentMethod;
    onSubmit: (data: UpdatePaymentMethodPayload) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export default function PaymentMethodForm({
    paymentMethod,
    onSubmit,
    onCancel,
    isSubmitting = false
}: PaymentMethodFormProps) {
    const [formData, setFormData] = useState<UpdatePaymentMethodPayload>({
        description: paymentMethod.description || '',
        processing_fee: paymentMethod.processing_fee || 0,
        display_order: paymentMethod.display_order || 0,
        configuration: paymentMethod.configuration || {},
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when paymentMethod changes
    useEffect(() => {
        setFormData({
            description: paymentMethod.description || '',
            processing_fee: paymentMethod.processing_fee || 0,
            display_order: paymentMethod.display_order || 0,
            configuration: paymentMethod.configuration || {},
        });
        setErrors({});
    }, [paymentMethod]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (formData.processing_fee! < 0 || formData.processing_fee! > 100) {
            newErrors.processing_fee = 'Processing fee must be between 0 and 100%';
        }

        if (formData.display_order! < 0) {
            newErrors.display_order = 'Display order must be 0 or greater';
        }

        if (formData.description && formData.description.length > 255) {
            newErrors.description = 'Description must be less than 255 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            await onSubmit(formData);
        } catch (error) {
            // Errors are handled by the parent or global error handler
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Core Identification (Read-only)</h3>
                    <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Method Name</span>
                            <div className="mt-1 font-medium text-foreground">{paymentMethod.name}</div>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Code / Type</span>
                            <div className="mt-1 font-mono text-sm text-foreground/80">
                                {paymentMethod.code} <span className="text-muted-foreground mx-1">•</span> {paymentMethod.type}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Status</span>
                            <div className={`mt-1 inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${paymentMethod.is_active
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                                }`}>
                                {paymentMethod.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Editable Configuration</h3>

                    <Input
                        label="Processing Fee (%)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.processing_fee}
                        onChange={(e) => setFormData({ ...formData, processing_fee: parseFloat(e.target.value) || 0 })}
                        error={errors.processing_fee}
                        hint="Fee percentage applied to customer (0-100)"
                        disabled={isSubmitting}
                    />

                    <Input
                        label="Display Order"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        error={errors.display_order}
                        hint="Lower numbers appear first in the checkout list"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={errors.description}
                hint="Customer-facing description of this payment method"
                rows={3}
                showCount
                maxLength={255}
                disabled={isSubmitting}
            />

            <div className="pt-2 border-t border-border">
                <ConfigurationEditor
                    value={formData.configuration || null}
                    onChange={(newConfig) => setFormData({ ...formData, configuration: newConfig })}
                    readOnly={isSubmitting}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                >
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
