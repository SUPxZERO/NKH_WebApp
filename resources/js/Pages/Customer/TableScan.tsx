import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { QrCode, Utensils, AlertCircle, Loader2, MapPin, Users, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface TableScanProps {
    token: string;
}

interface TableInfo {
    id: number;
    code: string;
    capacity: number;
    floor_name: string;
    location_id: number;
    display_name: string;
    status: string;
}

interface SessionInfo {
    token: string;
    status: string;
    started_at: string;
    has_order: boolean;
    order_id: number | null;
}

interface ScanResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        table: TableInfo;
        session: SessionInfo;
    };
}

export default function TableScan({ token }: TableScanProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [table, setTable] = useState<TableInfo | null>(null);
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [starting, setStarting] = useState(false);
    const translationContext = useTranslation();
    const t = translationContext?.t || ((key: string) => key);

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get<ScanResponse>(`/api/table-scan/${token}`);

            if (response.data.success && response.data.data) {
                setTable(response.data.data.table);
                setSession(response.data.data.session);

                // Store session token in cookie/localStorage
                localStorage.setItem('tableSessionToken', response.data.data.session.token);
                document.cookie = `table_session=${response.data.data.session.token}; path=/; max-age=${4 * 60 * 60}`;
            } else {
                setError(response.data.message || 'Failed to validate QR code');
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 400) {
                setError(t('customer_pages.table_scan.invalid_qr'));
            } else if (err.response?.status === 404) {
                setError(t('customer_pages.table_scan.table_not_found'));
            } else {
                setError(t('customer_pages.table_scan.connection_error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const startOrdering = () => {
        setStarting(true);

        // Populate Table Store with session info if available
        if (table && session) {
            import('@/app/store/tableStore').then(({ useTableStore }) => {
                useTableStore.getState().setTableInfo(
                    table.id,
                    table.code,
                    table.display_name,
                    session.token,
                    table.location_id
                );
            });
        }

        // Navigate to dedicated table menu
        router.visit('/customer/table/menu');
    };

    const viewExistingOrder = () => {
        if (session?.order_id) {
            router.visit(`/customer/orders/${session.order_id}`);
        }
    };

    // Loading state
    if (loading) {
        return (
            <>
                <Head title={t('customer_pages.table_scan.scanning')} />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full mb-6 animate-pulse">
                            <QrCode className="w-10 h-10 text-purple-400" />
                        </div>
                        <div className="flex items-center gap-3 text-white">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-lg">{t('customer_pages.table_scan.validating')}</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <>
                <Head title={t('customer_pages.table_scan.qr_error')} />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-3">
                                {t('customer_pages.table_scan.error_title')}
                            </h1>
                            <p className="text-gray-300 mb-6">
                                {error}
                            </p>
                            <button
                                onClick={validateToken}
                                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                            >
                                {t('customer_pages.table_scan.try_again')}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Success state
    return (
        <>
            <Head title={`${t('customer_pages.table_scan.table_number', { code: table?.code || '' })}`} />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Success Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mb-6 shadow-lg shadow-emerald-500/30">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {t('customer_pages.table_scan.welcome')}
                            </h1>
                            <p className="text-gray-300">
                                {t('customer_pages.table_scan.ready_to_order')}
                            </p>
                        </div>

                        {/* Table Info */}
                        <div className="bg-white/5 rounded-xl p-6 mb-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl">
                                    <Utensils className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">{t('customer_pages.table_scan.your_table')}</div>
                                    <div className="text-xl font-bold text-white">
                                        {t('customer_pages.table_scan.table_number', { code: table?.code })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl">
                                    <MapPin className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">{t('customer_pages.table_scan.location')}</div>
                                    <div className="text-lg font-medium text-white">
                                        {table?.floor_name}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-amber-500/20 rounded-xl">
                                    <Users className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">{t('customer_pages.table_scan.capacity')}</div>
                                    <div className="text-lg font-medium text-white">
                                        {t('customer_pages.table_scan.capacity_guests', { count: table?.capacity })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {session?.has_order && session.order_id ? (
                                <>
                                    <button
                                        onClick={viewExistingOrder}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/30"
                                    >
                                        {t('customer_pages.table_scan.view_current_order')}
                                    </button>
                                    <button
                                        onClick={startOrdering}
                                        disabled={starting}
                                        className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {starting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t('customer_pages.table_scan.loading_menu')}
                                            </>
                                        ) : (
                                            t('customer_pages.table_scan.add_more_items')
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={startOrdering}
                                    disabled={starting}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                                >
                                    {starting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('customer_pages.table_scan.loading_menu')}
                                        </>
                                    ) : (
                                        <>
                                            <Utensils className="w-5 h-5" />
                                            {t('customer_pages.table_scan.start_ordering')}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Session Info */}
                        <div className="mt-6 pt-6 border-t border-white/10 text-center">
                            <p className="text-xs text-gray-500">
                                {t('customer_pages.table_scan.session_active')} • {t('customer_pages.table_scan.orders_linked')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
