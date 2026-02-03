import React from 'react';
import { PaymentMethodAuditLog } from '@/app/hooks/usePaymentMethods';
import { Badge } from '@/app/components/ui/Badge';
import { Clock, User as UserIcon, Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentMethodAuditViewerProps {
    logs: PaymentMethodAuditLog[];
    isLoading: boolean;
}

export default function PaymentMethodAuditViewer({ logs, isLoading }: PaymentMethodAuditViewerProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse">
                <Activity className="h-8 w-8 mb-2 opacity-50" />
                <span>Loading audit history...</span>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Shield className="h-10 w-10 mb-3 opacity-20" />
                <p>No audit history available for this payment method.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Change History
            </h3>

            <div className="relative border-l border-border ml-3 space-y-8 pb-4">
                {logs.map((log) => (
                    <div key={log.id} className="relative pl-8">
                        {/* Timeline dot */}
                        <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-border ring-4 ring-background" />

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">
                                    {log.user ? log.user.name : 'System'}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {format(new Date(log.created_at), 'PPP p')}
                                </span>
                            </div>

                            <div className="mt-1">
                                <Badge variant={getBadgeVariant(log.action)} className="mr-2 uppercase text-[10px] tracking-wider">
                                    {log.action}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    IP: {log.ip_address}
                                </span>
                            </div>

                            {/* Changes Diff */}
                            {log.changes && Object.keys(log.changes).length > 0 && (
                                <div className="mt-3 bg-muted/30 rounded-lg p-3 text-sm border border-border/50">
                                    {Object.entries(log.changes).map(([field, delta]: [string, any]) => (
                                        <div key={field} className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center py-1 border-b border-border/30 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground font-mono text-xs">{formatFieldName(field)}</span>

                                            {/* If it's a simple value update */}
                                            {isSimpleChange(delta) ? (
                                                <>
                                                    <span className="text-destructive line-through text-xs break-all justify-self-end text-right opacity-70">
                                                        {formatValue(delta.old)}
                                                    </span>
                                                    <span className="text-success font-medium text-xs break-all">
                                                        {formatValue(delta.new)}
                                                    </span>
                                                </>
                                            ) : (
                                                <div className="col-span-2 text-xs text-foreground italic">
                                                    Complex update (view raw data if needed)
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback for enabled/disabled actions if no explicit changes object (though backend usually sends it) */}
                            {(!log.changes || Object.keys(log.changes).length === 0) && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    Performed action: <strong>{log.action}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helpers

function getBadgeVariant(action: string): 'default' | 'success' | 'destructive' | 'warning' {
    switch (action) {
        case 'created': return 'success';
        case 'enabled': return 'success'; // or success if we had it
        case 'disabled': return 'destructive';
        case 'updated': return 'warning';
        default: return 'default';
    }
}

function formatFieldName(field: string): string {
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value: any): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function isSimpleChange(delta: any): boolean {
    return delta && typeof delta === 'object' && 'old' in delta && 'new' in delta;
}
