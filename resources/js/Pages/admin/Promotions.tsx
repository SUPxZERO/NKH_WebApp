import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Tag, 
  Percent,
  DollarSign,
  Gift,
  Calendar,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Promotion } from '@/app/types/domain';
import PromotionFormModal from './components/PromotionFormModal';
import PromotionViewModal from './components/PromotionViewModal';

export default function Promotions() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedPromotion, setSelectedPromotion] = React.useState<Promotion | null>(null);
  const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_item',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true,
    applicable_to: 'all' as 'all' | 'categories' | 'items',
    terms_conditions: ''
  });

  // Fetch promotions
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin/promotions', page, search, statusFilter, typeFilter],
    queryFn: () => {
      let url = `/api/admin/promotions?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (statusFilter === 'active') {
        url += '&is_active=1';
      } else if (statusFilter === 'inactive') {
        url += '&is_active=0';
      } else if (statusFilter === 'expired') {
        url += '&expired=1';
      }
      
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch promotion stats
  const { data: promotionStats } = useQuery({
    queryKey: ['admin/promotion-stats'],
    queryFn: () => apiGet('/api/admin/promotion-stats')
  }) as { data: any };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/promotions', data),
    onSuccess: () => {
      toastSuccess('Promotion created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/promotions'] });
      qc.invalidateQueries({ queryKey: ['admin/promotion-stats'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create promotion');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/promotions/${id}`, data),
    onSuccess: () => {
      toastSuccess('Promotion updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/promotions'] });
      qc.invalidateQueries({ queryKey: ['admin/promotion-stats'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update promotion');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/promotions/${id}`),
    onSuccess: () => {
      toastSuccess('Promotion deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/promotions'] });
      qc.invalidateQueries({ queryKey: ['admin/promotion-stats'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete promotion');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      start_date: '',
      end_date: '',
      is_active: true,
      applicable_to: 'all',
      terms_conditions: ''
    });
    setEditingPromotion(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      start_date: now.toISOString().slice(0, 16),
      end_date: tomorrow.toISOString().slice(0, 16)
    }));
    setOpenCreate(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      code: promotion.code || '',
      type: promotion.type,
      discount_value: promotion.discount_value.toString(),
      min_order_amount: promotion.min_order_amount?.toString() || '',
      max_discount_amount: promotion.max_discount_amount?.toString() || '',
      usage_limit: promotion.usage_limit?.toString() || '',
      start_date: promotion.start_date.slice(0, 16),
      end_date: promotion.end_date.slice(0, 16),
      is_active: promotion.is_active,
      applicable_to: promotion.applicable_to,
      terms_conditions: promotion.terms_conditions || ''
    });
    setEditingPromotion(promotion);
    setOpenEdit(true);
  };

  const handleView = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
    };

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fixed_amount': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'buy_x_get_y': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'free_item': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed_amount': return <DollarSign className="w-4 h-4" />;
      case 'buy_x_get_y': return <Gift className="w-4 h-4" />;
      case 'free_item': return <Tag className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (!promotion.is_active) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (now < startDate) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (now > endDate) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getStatusText = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (!promotion.is_active) return 'Inactive';
    if (now < startDate) return 'Scheduled';
    if (now > endDate) return 'Expired';
    return 'Active';
  };

  const formatDiscountValue = (promotion: Promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.discount_value}%`;
      case 'fixed_amount':
        return `$${promotion.discount_value}`;
      case 'buy_x_get_y':
        return `Buy ${promotion.discount_value} Get 1`;
      case 'free_item':
        return 'Free Item';
      default:
        return promotion.discount_value.toString();
    }
  };

  const totalPromotions = promotions?.data?.length || 0;
  const activePromotions = promotions?.data?.filter((promo: Promotion) => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    return promo.is_active && now >= startDate && now <= endDate;
  }).length || 0;
  const totalUsage = promotionStats?.total_usage || 0;
  const totalSavings = promotionStats?.total_savings || 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Promotions Management
              </h1>
              <p className="text-gray-400 mt-1">Manage marketing campaigns and discounts</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-xl font-bold text-white">{totalPromotions}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Active</div>
                <div className="text-xl font-bold text-green-400">{activePromotions}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Usage</div>
                <div className="text-xl font-bold text-blue-400">{totalUsage}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Savings</div>
                <div className="text-xl font-bold text-purple-400">${totalSavings}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search promotions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className='text-black'>All Status</option>
            <option value="active" className='text-black'>Active</option>
            <option value="inactive" className='text-black'>Inactive</option>
            <option value="expired" className='text-black'>Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed_amount">Fixed Amount</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
            <option value="free_item">Free Item</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-8 bg-white/10 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            promotions?.data?.map((promotion: Promotion, index: number) => (
              <motion.div
                key={promotion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Promotion Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {promotion.name}
                        </h3>
                        {promotion.code && (
                          <p className="text-sm text-gray-400">Code: {promotion.code}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(promotion)}>
                          {getStatusText(promotion)}
                        </Badge>
                        <Badge className={getTypeColor(promotion.type)}>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(promotion.type)}
                            {promotion.type.replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                    </div>

                    {/* Promotion Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Discount:</span>
                        <span className="text-white font-bold text-lg">
                          {formatDiscountValue(promotion)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Usage:</span>
                        <span className="text-white">
                          {promotion.usage_count}{promotion.usage_limit ? `/${promotion.usage_limit}` : ''}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Valid Until:</span>
                        <span className="text-white">
                          {new Date(promotion.end_date).toLocaleDateString()}
                        </span>
                      </div>

                      {promotion.min_order_amount && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Min Order:</span>
                          <span className="text-white">${promotion.min_order_amount}</span>
                        </div>
                      )}

                      {promotion.description && (
                        <div className="text-sm text-gray-300 line-clamp-2">
                          {promotion.description}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(promotion)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(promotion)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(promotion.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {promotions?.meta && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {promotions?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === promotions?.meta?.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <PromotionFormModal
        open={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingPromotion={editingPromotion}
        error={error}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* View Modal */}
      <PromotionViewModal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedPromotion(null);
        }}
        promotion={selectedPromotion}
        onEdit={(promotion) => {
          setOpenView(false);
          handleEdit(promotion);
        }}
      />
    </AdminLayout>
  );
}
