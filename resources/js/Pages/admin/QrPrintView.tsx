import React from 'react';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';
import { Button } from '@/app/components/ui/Button';
import { Printer, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { DiningTable, Floor } from '@/types';
import { useLanguage } from '@/app/context/LanguageContext';

export default function QrPrintView() {
    const { t } = useLanguage();
    const { data: grouped, isLoading, refetch } = useQuery<{ [key: string]: DiningTable[] }>({
        queryKey: ['admin/tables/grouped', 'all'],
        queryFn: () => apiGet('/api/admin/tables/grouped?status=all'),
    });

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        window.history.back();
    };

    // Helper to construct QR Image URL
    const getQrImageUrl = (table: DiningTable) => {
        return `/api/admin/tables/${table.id}/qr-image?format=svg&size=300`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-fuchsia-600 mb-4" />
                <p className="text-gray-500">{t('admin.common.loading')}</p>
            </div>
        );
    }

    // Flatten tables if needed or iterate grouped
    const hasTables = grouped && Object.keys(grouped).length > 0;

    return (
        <div className="min-h-screen bg-white">
            <Head title={t('admin.tables.print.page_title') as string} />

            {/* No-Print Header */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            {t('admin.common.back')}
                        </Button>
                        <h1 className="text-xl font-bold">{t('admin.tables.print.page_title')}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
                            {t('admin.tables.actions.regenerate')}
                        </Button>
                        <Button onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                            {t('admin.tables.actions.print_all')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 print:p-0">
                {!hasTables ? (
                    <div className="text-center py-12 text-gray-500">
                        {t('admin.tables.empty.no_tables')}
                    </div>
                ) : (
                    Object.entries(grouped || {}).map(([floorName, tables]) => (
                        <div key={floorName} className="mb-8 break-inside-avoid">
                            <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-black print:mb-4">{floorName}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
                                {tables.map((table) => (
                                    <div
                                        key={table.id}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-900 rounded-xl break-inside-avoid text-center bg-white print:border-black print:p-4"
                                    >
                                        <div className="mb-2 text-lg font-bold uppercase tracking-wider">{t('admin.tables.print.table_prefix')}</div>
                                        <div className="mb-4 text-5xl font-black">{table.code}</div>

                                        <div className="w-40 h-40 mb-4 bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={getQrImageUrl(table)}
                                                alt={`QR for ${table.code}`}
                                                className="w-full h-full object-contain"
                                                loading="lazy"
                                            />
                                        </div>

                                        <div className="text-xs text-gray-500 font-medium print:text-black">
                                            {t('admin.tables.print.scan_to_order')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 print:hidden">
                                            ID: {table.id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
        @media print {
          @page { margin: 1cm; size: auto; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
        </div>
    );
}
