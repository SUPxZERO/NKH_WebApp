import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, ArrowRightLeft, Trash2, Package, AlertTriangle,
  DollarSign, History, MapPin, Calendar, Clock
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

import { useLanguage } from '@/app/context/LanguageContext';

// Stats Ribbon with Dark/Light Mode Support - Mobile optimized
const InventoryStatsRibbon = ({ stats }: { stats: any }) => {
  const { t } = useLanguage();
  return (
    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
      <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-sm min-w-[110px] sm:min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.inventory.stats.value')}</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">${Number(stats.totalValue).toFixed(0)}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-sm min-w-[110px] sm:min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.inventory.stats.low')}</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{stats.lowStock}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-sm min-w-[110px] sm:min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.inventory.stats.expiring')}</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5 sm:mt-1">{stats.expiringSoon}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-sm min-w-[110px] sm:min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.inventory.stats.items')}</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">{stats.totalItems}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
interface InventoryItem {
  id: number; ingredient_id: number; location_id: number; quantity: number;
  batch_number: string; expiration_date: string;
  ingredient: { id: number; name: string; code: string; unit: { code: string }; cost_per_unit: number; category: string; };
  location: { id: number; name: string; };
}

export default function Inventory() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openWastage, setOpenWastage] = useState(false);
  const [openMovements, setOpenMovements] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Fetch Data
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', page, search, locationFilter],
    queryFn: () => {
      let url = `/api/admin/inventory?page=${page}&per_page=${perPage}&search=${search}`;
      if (locationFilter !== 'all') url += `&location_id=${locationFilter}`;
      return apiGet(url);
    }
  });

  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/api/admin/locations') });
  const { data: statsData } = useQuery({ queryKey: ['inventory-stats'], queryFn: () => apiGet('/api/admin/inventory/stats') });

  const inventoryList = useMemo(() => inventory?.data || [], [inventory]);

  const stats = useMemo(() => ({
    totalValue: statsData?.total_value || 0,
    lowStock: statsData?.low_stock_count || 0,
    expiringSoon: statsData?.expiring_soon || 0,
    totalItems: inventory?.meta?.total || 0
  }), [statsData, inventory]);

  // Mutations
  const transferMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/inventory/transfer', data),
    onSuccess: () => { toastSuccess('Stock transferred'); setOpenTransfer(false); qc.invalidateQueries({ queryKey: ['inventory'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const wastageMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/inventory/wastage', data),
    onSuccess: () => { toastSuccess('Wastage recorded'); setOpenWastage(false); qc.invalidateQueries({ queryKey: ['inventory'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const isExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-3 sm:p-4 md:p-6 transition-colors overflow-x-hidden">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{t('admin.inventory.title')}</h1>
            <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.inventory.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setOpenTransfer(true)} className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
              <ArrowRightLeft className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('admin.inventory.actions.transfer')}</span>
            </Button>
            <Button onClick={() => setOpenWastage(true)} className="bg-red-600 hover:bg-red-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
              <Trash2 className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('admin.inventory.actions.wastage')}</span>
            </Button>
          </div>
        </div>

        <InventoryStatsRibbon stats={stats} />

        {/* Filters */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-sm">
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder={t('admin.inventory.filters.search')} value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:pl-10 h-10 text-sm bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500" />
            </div>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-2 sm:px-4 py-2 h-10 text-xs sm:text-sm text-gray-900 dark:text-white focus:border-purple-500 outline-none">
              <option value="all">{t('admin.inventory.filters.location')}</option>
              {locations?.data?.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
          {/* Table Header - Desktop only */}
          <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            <div className="col-span-3">{t('admin.inventory.table.item')}</div>
            <div className="col-span-2">{t('admin.inventory.table.location')}</div>
            <div className="col-span-2">{t('admin.inventory.table.stock')}</div>
            <div className="col-span-2">{t('admin.inventory.table.batch')}</div>
            <div className="col-span-2">{t('admin.inventory.table.expiry')}</div>
            <div className="col-span-1 text-right">{t('admin.inventory.table.history')}</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoading ? (
              <div className="p-8 sm:p-12 text-center text-gray-500 text-sm">Loading...</div>
            ) : inventoryList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.inventory.empty')}</p>
              </div>
            ) : inventoryList.map((item: InventoryItem) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {/* Mobile Card Layout */}
                <div className="lg:hidden">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.ingredient.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{item.ingredient.code} • {item.ingredient.category}</div>
                    </div>
                    <button onClick={() => { setSelectedItem(item); setOpenMovements(true); }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-700 flex-shrink-0">
                      <History size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 flex items-center gap-1 text-xs px-2 py-0.5">
                      <MapPin size={10} /> {item.location.name}
                    </Badge>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{Number(item.quantity).toFixed(2)} <span className="text-gray-400 text-xs font-normal">{item.ingredient.unit?.code}</span></span>
                    <span className="text-xs text-gray-500">${(item.quantity * item.ingredient.cost_per_unit).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {item.batch_number && <span className="font-mono">{item.batch_number}</span>}
                    {item.expiration_date && (
                      <span className={cn(
                        "flex items-center gap-0.5",
                        isExpired(item.expiration_date) ? "text-red-600 dark:text-red-400 font-bold" :
                          isExpiringSoon(item.expiration_date) ? "text-amber-600 dark:text-amber-400 font-medium" : ""
                      )}>
                        {new Date(item.expiration_date).toLocaleDateString()}
                        {isExpired(item.expiration_date) && <AlertTriangle size={10} />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Grid Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="font-medium text-gray-900 dark:text-white">{item.ingredient.name}</div>
                    <div className="text-xs text-gray-500">{item.ingredient.code} • {item.ingredient.category}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 flex items-center gap-1 w-fit">
                      <MapPin size={10} /> {item.location.name}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-900 dark:text-white font-bold">{Number(item.quantity).toFixed(3)} <span className="text-gray-400 text-xs font-normal">{item.ingredient.unit?.code}</span></div>
                    <div className="text-gray-500 text-xs">${(item.quantity * item.ingredient.cost_per_unit).toFixed(2)} {t('admin.inventory.table.value')}</div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {item.batch_number || '-'}
                  </div>
                  <div className="col-span-2 text-sm">
                    {item.expiration_date ? (
                      <span className={cn(
                        "flex items-center gap-1",
                        isExpired(item.expiration_date) ? "text-red-600 dark:text-red-400 font-bold" :
                          isExpiringSoon(item.expiration_date) ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-600 dark:text-gray-300"
                      )}>
                        {new Date(item.expiration_date).toLocaleDateString()}
                        {isExpired(item.expiration_date) && <AlertTriangle size={12} />}
                      </span>
                    ) : <span className="text-gray-500">-</span>}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button size="sm" variant="secondary" onClick={() => { setSelectedItem(item); setOpenMovements(true); }} className="h-8 w-8 p-0"><History size={14} /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={openTransfer} onClose={() => setOpenTransfer(false)} title={t('admin.inventory.modal.transfer_title')}>
        <TransferForm locations={locations?.data} onClose={() => setOpenTransfer(false)} onSubmit={transferMutation.mutate} />
      </Modal>

      <Modal open={openWastage} onClose={() => setOpenWastage(false)} title={t('admin.inventory.modal.wastage_title')}>
        <WastageForm locations={locations?.data} onClose={() => setOpenWastage(false)} onSubmit={wastageMutation.mutate} />
      </Modal>

      <Modal open={openMovements} onClose={() => setOpenMovements(false)} title={t('admin.inventory.modal.history_title', { item: selectedItem?.ingredient.name || '' })} size="lg">
        <MovementsList item={selectedItem} />
      </Modal>
    </AdminLayout>
  );
}

function TransferForm({ locations, onClose, onSubmit }: any) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ from_location_id: '', to_location_id: '', ingredient_id: '', quantity: '', notes: '' });
  const { data: ingredients } = useQuery({ queryKey: ['ingredients-list'], queryFn: () => apiGet('/api/admin/ingredients?per_page=100') });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 block">{t('admin.inventory.modal.from')}</label>
          <select required className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg p-2 h-10 text-sm text-gray-900 dark:text-white"
            value={formData.from_location_id} onChange={e => setFormData({ ...formData, from_location_id: e.target.value })}>
            <option value="">Select Location</option>
            {locations?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 block">{t('admin.inventory.modal.to')}</label>
          <select required className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg p-2 h-10 text-sm text-gray-900 dark:text-white"
            value={formData.to_location_id} onChange={e => setFormData({ ...formData, to_location_id: e.target.value })}>
            <option value="">Select Location</option>
            {locations?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 block">Ingredient</label>
        <select required className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg p-2 h-10 text-sm text-gray-900 dark:text-white"
          value={formData.ingredient_id} onChange={e => setFormData({ ...formData, ingredient_id: e.target.value })}>
          <option value="">Select Ingredient</option>
          {ingredients?.data?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>
      <Input label={t('admin.inventory.modal.quantity')} type="number" step="0.001" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="h-10 text-sm" />
      <Input label={t('admin.inventory.modal.notes')} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="h-10 text-sm" />
      <div className="flex gap-2 sm:gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1 h-9 sm:h-10 text-sm">{t('admin.inventory.modal.cancel')}</Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-sm">{t('admin.inventory.modal.transfer')}</Button>
      </div>
    </form>
  );
}

function WastageForm({ locations, onClose, onSubmit }: any) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ location_id: '', ingredient_id: '', quantity: '', reason: 'expired', notes: '' });
  const { data: ingredients } = useQuery({ queryKey: ['ingredients-list'], queryFn: () => apiGet('/api/admin/ingredients?per_page=100') });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 block">{t('admin.inventory.modal.location')}</label>
        <select required className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg p-2 h-10 text-sm text-gray-900 dark:text-white"
          value={formData.location_id} onChange={e => setFormData({ ...formData, location_id: e.target.value })}>
          <option value="">Select Location</option>
          {locations?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 block">Ingredient</label>
        <select required className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg p-2 h-10 text-sm text-gray-900 dark:text-white"
          value={formData.ingredient_id} onChange={e => setFormData({ ...formData, ingredient_id: e.target.value })}>
          <option value="">Select Ingredient</option>
          {ingredients?.data?.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Input label={t('admin.inventory.modal.quantity')} type="number" step="0.001" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="h-10 text-sm" />
        <div>
          <label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-1 block">{t('admin.inventory.modal.reason')}</label>
          <select required className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg p-2 h-10 text-sm text-gray-900 dark:text-white"
            value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}>
            <option value="expired">{t('admin.inventory.reasons.expired')}</option>
            <option value="damaged">{t('admin.inventory.reasons.damaged')}</option>
            <option value="spilled">{t('admin.inventory.reasons.spilled')}</option>
            <option value="other">{t('admin.inventory.reasons.other')}</option>
          </select>
        </div>
      </div>
      <Input label={t('admin.inventory.modal.notes')} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="h-10 text-sm" />
      <div className="flex gap-2 sm:gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1 h-9 sm:h-10 text-sm">{t('admin.inventory.modal.cancel')}</Button>
        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 h-9 sm:h-10 text-sm">{t('admin.inventory.modal.record')}</Button>
      </div>
    </form>
  );
}

function MovementsList({ item }: { item: InventoryItem | null }) {
  const { data: movements } = useQuery({
    queryKey: ['movements', item?.ingredient_id],
    queryFn: () => apiGet(`/api/admin/inventory/movements/${item?.ingredient_id}`),
    enabled: !!item
  });

  if (!item) return null;

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {(movements?.data ?? []).filter((m: any) => m != null).map((m: any) => (
        <div key={m.id} className="bg-gray-50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10 flex justify-between items-center">
          <div>
            <div className="text-gray-900 dark:text-white font-medium capitalize flex items-center gap-2">
              {m.type === 'purchase_received' && <Package size={14} className="text-blue-600 dark:text-blue-400" />}
              {m.type === 'wastage' && <Trash2 size={14} className="text-red-600 dark:text-red-400" />}
              {m.type === 'transfer_in' && <ArrowRightLeft size={14} className="text-green-600 dark:text-green-400" />}
              {String(m.type ?? 'unknown').replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-gray-500">{m.transacted_at ? new Date(m.transacted_at).toLocaleString() : '-'}</div>
            {m.notes && <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">"{m.notes}"</div>}
          </div>
          <div className={`font-bold ${Number(m.quantity) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {Number(m.quantity) > 0 ? '+' : ''}{Number(m.quantity ?? 0).toFixed(3)}
          </div>
        </div>
      ))}
      {(!movements?.data || movements.data.length === 0) && (
        <div className="text-gray-400 text-center py-4">No history found</div>
      )}
    </div>
  );
}
