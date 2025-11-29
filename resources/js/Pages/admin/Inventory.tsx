import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  ArrowRightLeft,
  Trash2,
  Package,
  AlertTriangle,
  DollarSign,
  History,
  MapPin,
  Calendar
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface InventoryItem {
  id: number;
  ingredient_id: number;
  location_id: number;
  quantity: number;
  batch_number: string;
  expiration_date: string;
  ingredient: {
    id: number;
    name: string;
    code: string;
    unit: { code: string };
    cost_per_unit: number;
  };
  location: {
    id: number;
    name: string;
  };
}

export default function Inventory() {
  const [search, setSearch] = React.useState('');
  const [locationFilter, setLocationFilter] = React.useState('all');
  const [openTransfer, setOpenTransfer] = React.useState(false);
  const [openWastage, setOpenWastage] = React.useState(false);
  const [openMovements, setOpenMovements] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);

  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);

  // Fetch Inventory
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', page, search, locationFilter],
    queryFn: () => {
      let url = `/api/admin/inventory?page=${page}&search=${search}`;
      if (locationFilter !== 'all') url += `&location_id=${locationFilter}`;
      return apiGet(url);
    }
  });

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => apiGet('/api/admin/inventory/stats')
  });

  // Fetch Locations (for filter and transfer)
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/locations') // Assuming this exists from Sprint 1
  });

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/inventory/transfer', data),
    onSuccess: () => {
      toastSuccess('Stock transferred successfully');
      setOpenTransfer(false);
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Transfer failed')
  });

  // Wastage Mutation
  const wastageMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/inventory/wastage', data),
    onSuccess: () => {
      toastSuccess('Wastage recorded successfully');
      setOpenWastage(false);
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to record wastage')
  });

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Inventory Management
              </h1>
              <p className="text-gray-400 mt-1">Track stock across locations</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-xl font-bold text-green-400">${Number(stats?.total_value || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Low Stock Items</div>
                <div className="text-xl font-bold text-orange-400">{stats?.low_stock_count || 0}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Expiring Soon</div>
                <div className="text-xl font-bold text-red-400">{stats?.expiring_soon || 0}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setOpenTransfer(true)} className="bg-blue-600 hover:bg-blue-700">
                <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Stock
              </Button>
              <Button onClick={() => setOpenWastage(true)} variant="danger" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" /> Record Wastage
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className="text-black">All Locations</option>
            {locations?.data?.map((loc: any) => (
              <option key={loc.id} value={loc.id} className="text-black">{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="text-white">Loading...</div>
          ) : (
            inventory?.data?.map((item: InventoryItem) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{item.ingredient.name}</h3>
                        <p className="text-sm text-gray-400">{item.ingredient.code}</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.location.name}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Quantity:</span>
                        <span className="text-white font-bold">{Number(item.quantity).toFixed(3)} {item.ingredient.unit?.code}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Batch:</span>
                        <span className="text-white">{item.batch_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Expires:</span>
                        <span className={`font-medium ${new Date(item.expiration_date) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                          {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="w-full border-white/20" onClick={() => { setSelectedItem(item); setOpenMovements(true); }}>
                        <History className="w-3 h-3 mr-1" /> History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      <Modal open={openTransfer} onClose={() => setOpenTransfer(false)} title="Transfer Stock">
        <TransferForm locations={locations?.data} onClose={() => setOpenTransfer(false)} onSubmit={transferMutation.mutate} />
      </Modal>

      {/* Wastage Modal */}
      <Modal open={openWastage} onClose={() => setOpenWastage(false)} title="Record Wastage">
        <WastageForm locations={locations?.data} onClose={() => setOpenWastage(false)} onSubmit={wastageMutation.mutate} />
      </Modal>

      {/* Movements Modal */}
      <Modal open={openMovements} onClose={() => setOpenMovements(false)} title="Movement History" size="lg">
        <MovementsList item={selectedItem} />
      </Modal>
    </AdminLayout>
  );
}

function TransferForm({ locations, onClose, onSubmit }: any) {
  const [formData, setFormData] = React.useState({
    from_location_id: '',
    to_location_id: '',
    ingredient_id: '',
    quantity: '',
    notes: ''
  });

  // Need to fetch ingredients for dropdown
  const { data: ingredients } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: () => apiGet('/api/admin/ingredients?per_page=100')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-gray-300 text-sm">From Location</label>
          <select required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
            value={formData.from_location_id} onChange={e => setFormData({ ...formData, from_location_id: e.target.value })}>
            <option value="">Select Location</option>
            {locations?.map((l: any) => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-300 text-sm">To Location</label>
          <select required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
            value={formData.to_location_id} onChange={e => setFormData({ ...formData, to_location_id: e.target.value })}>
            <option value="">Select Location</option>
            {locations?.map((l: any) => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-gray-300 text-sm">Ingredient</label>
        <select required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
          value={formData.ingredient_id} onChange={e => setFormData({ ...formData, ingredient_id: e.target.value })}>
          <option value="">Select Ingredient</option>
          {ingredients?.data?.map((i: any) => <option key={i.id} value={i.id} className="text-black">{i.name} ({i.code})</option>)}
        </select>
      </div>
      <div>
        <label className="text-gray-300 text-sm">Quantity</label>
        <Input required type="number" step="0.001" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div>
        <label className="text-gray-300 text-sm">Notes</label>
        <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit">Transfer</Button>
      </div>
    </form>
  );
}

function WastageForm({ locations, onClose, onSubmit }: any) {
  const [formData, setFormData] = React.useState({
    location_id: '',
    ingredient_id: '',
    quantity: '',
    reason: 'expired',
    notes: ''
  });

  const { data: ingredients } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: () => apiGet('/api/admin/ingredients?per_page=100')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-gray-300 text-sm">Location</label>
        <select required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
          value={formData.location_id} onChange={e => setFormData({ ...formData, location_id: e.target.value })}>
          <option value="">Select Location</option>
          {locations?.map((l: any) => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-gray-300 text-sm">Ingredient</label>
        <select required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
          value={formData.ingredient_id} onChange={e => setFormData({ ...formData, ingredient_id: e.target.value })}>
          <option value="">Select Ingredient</option>
          {ingredients?.data?.map((i: any) => <option key={i.id} value={i.id} className="text-black">{i.name} ({i.code})</option>)}
        </select>
      </div>
      <div>
        <label className="text-gray-300 text-sm">Quantity</label>
        <Input required type="number" step="0.001" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div>
        <label className="text-gray-300 text-sm">Reason</label>
        <select required className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
          value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}>
          <option value="expired" className="text-black">Expired</option>
          <option value="damaged" className="text-black">Damaged</option>
          <option value="spilled" className="text-black">Spilled</option>
          <option value="other" className="text-black">Other</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="danger">Record Wastage</Button>
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
    <div className="space-y-4">
      <h3 className="text-white font-semibold">History for {item.ingredient.name}</h3>
      <div className="space-y-2">
        {movements?.data?.map((m: any) => (
          <div key={m.id} className="bg-white/5 p-3 rounded border border-white/10 flex justify-between items-center">
            <div>
              <div className="text-white font-medium capitalize">{m.type.replace('_', ' ')}</div>
              <div className="text-sm text-gray-400">{new Date(m.transacted_at).toLocaleString()}</div>
              <div className="text-xs text-gray-500">{m.notes}</div>
            </div>
            <div className={`font-bold ${m.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {m.quantity > 0 ? '+' : ''}{Number(m.quantity).toFixed(3)}
            </div>
          </div>
        ))}
        {(!movements?.data || movements.data.length === 0) && (
          <div className="text-gray-400 text-center py-4">No history found</div>
        )}
      </div>
    </div>
  );
}
