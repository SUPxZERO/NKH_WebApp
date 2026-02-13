import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Promotion } from '@/app/types/domain';
import { apiGet } from '@/app/utils/api';

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
    selected_categories: number[];
    selected_items: number[];
    buy_quantity: string;
    get_quantity: string;
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
  const { t } = useTranslation();
  // Fetch categories and menu items for selection
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet('/api/categories'),
    enabled: open
  });

  const { data: menuItemsData } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => apiGet('/api/menu-items?per_page=100'),
    enabled: open
  });

  const categories = (categoriesData as any)?.data || [];
  const menuItems = (menuItemsData as any)?.data || [];

  const toggleCategory = (id: number) => {
    const current = formData.selected_categories || [];
    const updated = current.includes(id)
      ? current.filter((c: number) => c !== id)
      : [...current, id];
    setFormData({ ...formData, selected_categories: updated });
  };

  const toggleItem = (id: number) => {
    const current = formData.selected_items || [];
    const updated = current.includes(id)
      ? current.filter((i: number) => i !== id)
      : [...current, id];
    setFormData({ ...formData, selected_items: updated });
  };

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
      title={editingPromotion ? t('admin.marketing.promotions.form.edit_title') : t('admin.marketing.promotions.form.create_title')}
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
          <h3 className="text-lg font-semibold text-foreground">{t('admin.marketing.promotions.form.sections.basic_info')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.name')} *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border text-foreground h-11"
                placeholder={t('admin.marketing.promotions.form.placeholders.name')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.code')}</label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-background border-border text-foreground flex-1 h-11"
                  placeholder={t('admin.marketing.promotions.form.placeholders.code')}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={generatePromoCode}
                  className="h-11 px-4"
                >
                  {t('admin.marketing.promotions.form.buttons.generate')}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground h-24 resize-none"
              placeholder={t('admin.marketing.promotions.form.placeholders.description')}
            />
          </div>
        </div>

        {/* Discount Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('admin.marketing.promotions.form.sections.discount_config')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.type')} *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 h-11 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 touch-manipulation"
              >
                <option value="percentage" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.percentage')}</option>
                <option value="fixed_amount" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.fixed_amount')}</option>
                <option value="buy_x_get_y" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.buy_x_get_y')}</option>
                <option value="free_item" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.free_item')}</option>
              </select>
            </div>

            {/* Standard discount value for percentage/fixed_amount */}
            {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {formData.type === 'percentage' ? t('admin.marketing.promotions.form.fields.percentage') : t('admin.marketing.promotions.form.fields.amount')} *
                </label>
                <Input
                  type="number"
                  step={formData.type === 'percentage' ? '0.01' : '0.01'}
                  min="0"
                  max={formData.type === 'percentage' ? '100' : undefined}
                  required
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="bg-background border-border text-foreground h-11"
                  placeholder={formData.type === 'percentage' ? t('admin.marketing.promotions.form.placeholders.discount_pct') : t('admin.marketing.promotions.form.placeholders.discount_amt')}
                />
              </div>
            )}

            {/* Buy X Get Y specific fields */}
            {formData.type === 'buy_x_get_y' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.buy_quantity')} *</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.buy_quantity}
                    onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                    className="bg-background border-border text-foreground h-11"
                    placeholder={t('admin.marketing.promotions.form.placeholders.qty_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.get_quantity')} *</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.get_quantity}
                    onChange={(e) => setFormData({ ...formData, get_quantity: e.target.value })}
                    className="bg-background border-border text-foreground h-11"
                    placeholder={t('admin.marketing.promotions.form.placeholders.qty_placeholder')}
                  />
                </div>
              </>
            )}

            {/* Free item discount value (item ID or placeholder) */}
            {formData.type === 'free_item' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.free_item_value')} *</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="bg-background border-border text-foreground h-11"
                  placeholder={t('admin.marketing.promotions.form.placeholders.qty_placeholder')}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.min_order')}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder={t('admin.marketing.promotions.form.placeholders.min_order')}
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.max_discount')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  className="bg-background border-border text-foreground h-11"
                  placeholder={t('admin.marketing.promotions.form.placeholders.no_limit')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Usage & Validity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('admin.marketing.promotions.form.sections.usage_validity')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.usage_limit')}</label>
              <Input
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder={t('admin.marketing.promotions.form.placeholders.unlimited')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.start_date')} *</label>
              <Input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.end_date')} *</label>
              <Input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Applicability */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('admin.marketing.promotions.form.sections.applicability')}</h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.applies_to')}</label>
            <select
              value={formData.applicable_to}
              onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any, selected_categories: [], selected_items: [] })}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 h-11 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 touch-manipulation"
            >
              <option value="all" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.all_items')}</option>
              <option value="categories" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.categories')}</option>
              <option value="items" className="bg-background text-foreground">{t('admin.marketing.promotions.form.options.items')}</option>
            </select>
          </div>

          {/* Category Selection */}
          {formData.applicable_to === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.select_categories')} *</label>
              <div className="max-h-48 overflow-y-auto bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('admin.marketing.promotions.form.helpers.loading_categories')}</p>
                ) : (
                  categories.map((cat: any) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary p-1 rounded">
                      <input
                        type="checkbox"
                        checked={(formData.selected_categories || []).includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-border bg-background text-primary focus:ring-primary"
                      />
                      <span className="text-foreground text-sm">{cat.name || cat.translations?.[0]?.name || `Category ${cat.id}`}</span>
                    </label>
                  ))
                )}
              </div>
              {(formData.selected_categories || []).length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{formData.selected_categories.length} {t('admin.marketing.promotions.form.helpers.categories_selected')}</p>
              )}
            </div>
          )}

          {/* Item Selection */}
          {formData.applicable_to === 'items' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.select_items')} *</label>
              <div className="max-h-48 overflow-y-auto bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
                {menuItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('admin.marketing.promotions.form.helpers.loading_items')}</p>
                ) : (
                  menuItems.map((item: any) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary p-1 rounded">
                      <input
                        type="checkbox"
                        checked={(formData.selected_items || []).includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-border bg-background text-primary focus:ring-primary"
                      />
                      <span className="text-foreground text-sm">{item.name || item.translations?.[0]?.name || `Item ${item.id}`}</span>
                      <span className="text-muted-foreground text-xs ml-auto">${item.price}</span>
                    </label>
                  ))
                )}
              </div>
              {(formData.selected_items || []).length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{formData.selected_items.length} {t('admin.marketing.promotions.form.helpers.items_selected')}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('admin.marketing.promotions.form.fields.terms')}</label>
            <textarea
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              rows={4}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground h-28 resize-none"
              placeholder={t('admin.marketing.promotions.form.placeholders.terms')}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-border bg-background text-primary"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              {t('admin.marketing.promotions.form.fields.is_active')}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 h-12"
          >
            {t('admin.marketing.promotions.form.buttons.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1 h-12"
          >
            {editingPromotion ? t('admin.marketing.promotions.form.buttons.update') : t('admin.marketing.promotions.form.buttons.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
