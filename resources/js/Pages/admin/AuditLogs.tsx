import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, FileText } from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import {
  AuditTimeline,
  AuditFilters,
  AuditStatsPanel,
  FilterState,
  AuditLog
} from '@/app/components/audit';
import { apiGet } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

// Page Header Component
const PageHeader: React.FC<{ onRefresh: () => void; isRefreshing: boolean }> = ({ onRefresh, isRefreshing }) => {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('analytics.audit.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('analytics.audit.subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          {t('analytics.audit.refresh')}
        </Button>
      </div>
    </motion.div>
  );
};

// Pagination Component
const Pagination: React.FC<{
  page: number;
  lastPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}> = ({ page, lastPage, perPage, onPageChange, onPerPageChange }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('analytics.audit.pagination.show')}</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-muted-foreground">{t('analytics.audit.pagination.per_page')}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('analytics.audit.pagination.previous')}
        </Button>
        <span className="text-sm text-muted-foreground px-3">
          {t('analytics.audit.pagination.page_of', { page: String(page), lastPage: String(lastPage) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          {t('analytics.audit.pagination.next')}
        </Button>
      </div>
    </div>
  );
};

// Export Actions Component
const ExportActions: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { t } = useLanguage();
  const buildExportUrl = (format: 'csv' | 'json') => {
    const params = new URLSearchParams();
    if (filters.action !== 'all') params.append('action', filters.action);
    if (filters.user_id !== 'all') params.append('user_id', filters.user_id);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    return `/api/admin/audit-logs/export/${format}?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.href = buildExportUrl('csv')}
        className="gap-1.5"
      >
        <Download className="w-4 h-4" />
        {t('analytics.audit.export_csv')}
      </Button>
    </div>
  );
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    action: 'all',
    user_id: 'all',
    guard: 'all',
    source: 'all',
    role: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    riskLevel: 'all',
    status: 'all'
  });

  // Build API URL with filters
  const buildApiUrl = useCallback(() => {
    let url = `/api/admin/audit-logs?page=${page}&per_page=${perPage}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.action !== 'all') url += `&action=${filters.action}`;
    if (filters.user_id !== 'all') url += `&user_id=${filters.user_id}`;
    if (filters.guard !== 'all') url += `&guard=${filters.guard}`;
    if (filters.source !== 'all') url += `&source=${filters.source}`;
    if (filters.status !== 'all') url += `&status=${filters.status}`;

    // Handle date filters
    if (filters.dateRange !== 'all' && filters.dateRange !== 'custom') {
      const today = new Date();
      let startDate = '';
      if (filters.dateRange === 'today') {
        startDate = today.toISOString().split('T')[0];
      } else if (filters.dateRange === 'yesterday') {
        const yesterday = new Date(today.getTime() - 86400000);
        startDate = yesterday.toISOString().split('T')[0];
        url += `&end_date=${startDate}`;
      } else if (filters.dateRange === 'week') {
        startDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
      } else if (filters.dateRange === 'month') {
        startDate = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
      }
      if (startDate) url += `&start_date=${startDate}`;
    }

    return url;
  }, [page, perPage, filters]);

  // Fetch audit logs
  const { data: auditLogs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin/audit-logs', page, perPage, filters],
    queryFn: () => apiGet(buildApiUrl()),
  });

  // Fetch stats
  const { data: auditStats } = useQuery({
    queryKey: ['admin/audit-stats'],
    queryFn: () => apiGet('/api/admin/audit-stats'),
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['admin/audit-logs/filters'],
    queryFn: () => apiGet('/api/admin/audit-logs/filters'),
  });

  const logList: AuditLog[] = useMemo(() => auditLogs?.data || [], [auditLogs]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Page Header */}
        <PageHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

        {/* Stats Panel */}
        {auditStats?.data && (
          <AuditStatsPanel stats={auditStats.data} />
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <AuditFilters
              onFiltersChange={handleFiltersChange}
              availableFilters={{
                users: filterOptions?.data?.users ?
                  Object.entries(filterOptions.data.users).map(([id, name]) => ({ id: Number(id), name: String(name) })) : [],
                guards: filterOptions?.data?.guards || [],
                sources: filterOptions?.data?.sources || [],
                roles: filterOptions?.data?.roles || []
              }}
              className="flex-1"
            />
            <ExportActions filters={filters} />
          </div>
        </div>

        {/* Timeline View */}
        <AuditTimeline logs={logList} isLoading={isLoading} />

        {/* Pagination */}
        {auditLogs?.meta && (
          <Pagination
            page={page}
            lastPage={auditLogs.meta.last_page}
            perPage={perPage}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>
    </AdminLayout>
  );
}
