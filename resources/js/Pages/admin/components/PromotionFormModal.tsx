import React from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Promotion } from '@/app/types/domain';

interface PromotionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    name: string;
    description: string;
    code: string;
    type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_item';
    discount_value: string;
    min_order_amount: string;
    max_discount_amount: string;
    usage_limit: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    applicable_to: 'all' | 'categories' | 'items';
    terms_conditions: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  editingPromotion: Promotion | null;
  error: string;
  isLoading: boolean;
}

export default function PromotionFormModal({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingPromotion,
  error,
  isLoading
}: PromotionFormModalProps) {
  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
      size="xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Promotion Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Summer Sale 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Promo Code</label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 text-white flex-1"
                  placeholder="SUMMER2024"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={generatePromoCode}
                  className="border-white/20 hover:bg-white/10"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Describe your promotion..."
            />
          </div>
        </div>

        {/* Discount Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Discount Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Discount Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed_amount">Fixed Amount Off</option>
                <option value="buy_x_get_y">Buy X Get Y Free</option>
                <option value="free_item">Free Item</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {formData.type === 'percentage' && 'Percentage (%)'}
                {formData.type === 'fixed_amount' && 'Amount ($)'}
                {formData.type === 'buy_x_get_y' && 'Buy Quantity'}
                {formData.type === 'free_item' && 'Free Item ID'}
                *
              </label>
              <Input
                type="number"
                step={formData.type === 'percentage' ? '0.01' : formData.type === 'fixed_amount' ? '0.01' : '1'}
                min="0"
                max={formData.type === 'percentage' ? '100' : undefined}
                required
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder={
                  formData.type === 'percentage' ? '10' :
                  formData.type === 'fixed_amount' ? '5.00' :
                  formData.type === 'buy_x_get_y' ? '2' : '1'
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Order Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0.00"
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Discount Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="No limit"
                />
              </div>
            )}
          </div>
        </div>

        {/* Usage & Validity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Usage & Validity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Usage Limit</label>
              <Input
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
              <Input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
              <Input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* Applicability */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Applicability</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Applies To</label>
            <select
              value={formData.applicable_to}
              onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Items</option>
              <option value="categories">Specific Categories</option>
              <option value="items">Specific Items</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
            <textarea
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Enter terms and conditions for this promotion..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-white/20 bg-white/5 text-fuchsia-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Active promotion
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 border-white/20 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          >
            {editingPromotion ? 'Update' : 'Create'} Promotion
          </Button>
        </div>
      </form>
    </Modal>
  );
}
