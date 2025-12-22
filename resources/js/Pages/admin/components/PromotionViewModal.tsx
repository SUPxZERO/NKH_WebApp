import React from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Edit, Calendar, Users, DollarSign, Tag, Percent, Gift } from 'lucide-react';
import { Promotion } from '@/app/types/domain';

interface PromotionViewModalProps {
  open: boolean;
  onClose: () => void;
  promotion: Promotion | null;
  onEdit: (promotion: Promotion) => void;
}

export default function PromotionViewModal({
  open,
  onClose,
  promotion,
  onEdit
}: PromotionViewModalProps) {
  if (!promotion) return null;

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
        return `${promotion.discount_value}% off`;
      case 'fixed_amount':
        return `$${promotion.discount_value} off`;
      case 'buy_x_get_y':
        return `Buy ${promotion.discount_value}, Get 1 Free`;
      case 'free_item':
        return 'Free Item';
      default:
        return promotion.discount_value.toString();
    }
  };

  const usagePercentage = promotion.usage_limit
    ? (promotion.usage_count / promotion.usage_limit) * 100
    : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Promotion Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{promotion.name}</h2>
            {promotion.code && (
              <p className="text-lg text-foreground mt-1">Code: <span className="font-mono bg-secondary px-2 py-1 rounded">{promotion.code}</span></p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getStatusColor(promotion)}>
              {getStatusText(promotion)}
            </Badge>
            <Badge className={getTypeColor(promotion.type)}>
              <div className="flex items-center gap-1">
                {getTypeIcon(promotion.type)}
                {(promotion.type || 'percentage').replace(/_/g, ' ')}
              </div>
            </Badge>
          </div>
        </div>

        {/* Description */}
        {promotion.description && (
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
            <p className="text-foreground">{promotion.description}</p>
          </div>
        )}

        {/* Discount Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Discount Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount Value:</span>
                <span className="text-foreground font-bold text-xl">{formatDiscountValue(promotion)}</span>
              </div>

              {promotion.min_order_amount && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Minimum Order:</span>
                  <span className="text-foreground">${promotion.min_order_amount}</span>
                </div>
              )}

              {promotion.max_discount_amount && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Maximum Discount:</span>
                  <span className="text-foreground">${promotion.max_discount_amount}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Applies To:</span>
                <span className="text-foreground capitalize">{(promotion.applicable_to || 'all').replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Usage & Validity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Usage Count:</span>
                <span className="text-foreground">{promotion.usage_count}</span>
              </div>

              {promotion.usage_limit && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Usage Limit:</span>
                    <span className="text-foreground">{promotion.usage_limit}</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Usage Progress:</span>
                      <span className="text-foreground">{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="text-foreground">{new Date(promotion.start_date).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">End Date:</span>
                <span className="text-foreground">{new Date(promotion.end_date).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">{new Date(promotion.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {promotion.terms_conditions && (
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Terms & Conditions</h3>
            <div className="text-foreground whitespace-pre-wrap">{promotion.terms_conditions}</div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
          <h3 className="text-lg font-semibold text-foreground mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{promotion.usage_count}</div>
              <div className="text-sm text-muted-foreground">Times Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {promotion.usage_limit ? `${((promotion.usage_count / promotion.usage_limit) * 100).toFixed(1)}%` : '∞'}
              </div>
              <div className="text-sm text-muted-foreground">Usage Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.max(0, Math.ceil((new Date(promotion.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
              </div>
              <div className="text-sm text-muted-foreground">Days Left</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">
                {promotion.is_active ? '✓' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => onEdit(promotion)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Promotion
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
