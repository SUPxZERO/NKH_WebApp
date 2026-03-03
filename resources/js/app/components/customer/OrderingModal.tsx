import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react'; // Sprint 3
import Modal from '@/app/components/ui/Modal';
import Button from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Skeleton } from '@/app/components/ui/Loading';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { MenuItem, OrderItem } from '@/types';
import { useCartStore } from '@/app/store/cart';
import { toastSuccess, toastInfo } from '@/app/utils/toast';
import { ShoppingCart, XCircle, LogIn, ArrowRight, Star, Clock, TrendingUp, Plus } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface OrderingModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'delivery' | 'pickup' | 'dine-in';
}

export function OrderingModal({ open, onClose, mode }: OrderingModalProps) {
  const [categoryId, setCategoryId] = React.useState<number | undefined>();
  const [search, setSearch] = useState<string>('');

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: menu, isLoading: menuLoading } = useMenuItems({ category_id: categoryId });

  const cart = useCartStore();

  const { t } = useTranslation();

  // Get auth state from Inertia props
  const { auth } = usePage().props as { auth?: { user?: any } };
  const isAuthenticated = !!auth?.user;

  // Set mode when modal opens
  React.useEffect(() => {
    if (open) {
      cart.setMode(mode);
    }
  }, [open, mode]);

  const filteredMenu = React.useMemo(() => {
    if (!menu) return [];

    let filtered = menu;

    // Filter by category if selected
    if (categoryId) {
      filtered = filtered.filter(item => item.category_id === categoryId);
    }

    // Filter by search term if present
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ?? false
      );
    }

    return filtered;
  }, [menu, categoryId, search]);

  function addItem(item: MenuItem) {
    const orderItem: OrderItem = {
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: 1,
      image_path: item.image_path || undefined,
    };
    cart.addItem(orderItem);
    toastSuccess(`${item.name} added to cart`);
  }

  function proceedToCart() {
    if (cart.items.length === 0) {
      toastInfo('Please add items to your cart first');
      return;
    }

    onClose();

    if (!isAuthenticated) {
      // Save pending state and redirect to login
      localStorage.setItem('pendingCheckout', 'true');
      localStorage.setItem('checkoutRedirectUrl', '/cart');
      // Sprint 3: Use router.visit
      router.visit('/login?redirect=/cart', {
        preserveScroll: false
      });
    } else {
      router.visit('/cart', {
        preserveScroll: false
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        mode === 'dine-in'
          ? 'Table Order'
          : mode === 'delivery'
            ? 'Order for Delivery'
            : 'Order for Pickup'
      }
      size="full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] overflow-hidden">
        {/* Menu Browser - Main Section */}
        <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-4">
          <Card>
            <CardHeader className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-lg font-semibold">{t('customer.ordering.browse_menu')}</div>
                <div className="w-full sm:w-64">
                  <Input
                    placeholder={t('customer.ordering.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-16rem)] overflow-y-auto">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-white/10">
                {catsLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <>
                    <Button
                      variant={categoryId ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => setCategoryId(undefined)}
                    >
                      All
                    </Button>
                    {categories?.map((c) => (
                      <Button
                        key={c.id}
                        variant={categoryId === c.id ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCategoryId(c.id)}
                      >
                        {c.name}
                      </Button>
                    ))}
                  </>
                )}
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64" />)
                ) : filteredMenu.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No items found. Try a different search or category.
                  </div>
                ) : (
                  filteredMenu.map((m) => (
                    <div
                      key={m.id}
                      className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:border-fuchsia-500/30 transition-all hover:shadow-xl duration-300"
                    >
                      {/* Image Section */}
                      <div className="relative h-36 overflow-hidden">
                        {m.image_path ? (
                          <img
                            src={m.image_path ?? ""}
                            alt={m.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full bg-gradient-to-br from-fuchsia-500/20 to-rose-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-10 h-10 text-fuchsia-400/40" />
                          </div>
                        )}

                        {/* Popular Badge */}
                        {m.is_popular && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
                            <TrendingUp className="w-3 h-3" />
                            Popular
                          </span>
                        )}

                        {/* Quick Add Button on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => addItem(m)}
                            leftIcon={<Plus className="w-4 h-4" />}
                            className="shadow-xl"
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">{m.name}</h4>

                        {/* Description - if available */}
                        {m.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                            {m.description}
                          </p>
                        )}

                        {/* Meta Info Row */}
                        <div className="flex items-center gap-2 mb-2 text-xs">
                          {/* Rating */}
                          {m.rating && (
                            <div className="flex items-center gap-0.5 text-yellow-500">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="font-medium">{m.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {/* Prep Time */}
                          {m.prep_time && (
                            <div className="flex items-center gap-0.5 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{m.prep_time}m</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Add Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                            ${m.price.toFixed(2)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addItem(m)}
                            leftIcon={<Plus className="w-4 h-4" />}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Summary - Sidebar */}
        <div className="lg:col-span-4">
          <Card className="sticky top-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Your Order
                </div>
                {cart.items.length > 0 && (
                  <span className="px-2 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-xs font-semibold">
                    {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('customer.ordering.empty_cart')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('customer.ordering.add_items')}</p>
                  </div>
                ) : (
                  cart.items.map((it) => (
                    <div key={it.menu_item_id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-gray-500">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cart.updateQty(it.menu_item_id, Math.max(1, it.quantity - 1))}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm">{it.quantity}</span>
                        <button
                          onClick={() => cart.updateQty(it.menu_item_id, it.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => cart.removeItem(it.menu_item_id)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors ml-1"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('customer.ordering.subtotal')}</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  {mode === 'delivery' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('customer.ordering.delivery_fee')}</span>
                      <span>${cart.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>${cart.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                    <span>{t('customer.ordering.total')}</span>
                    <span className="text-fuchsia-500">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full"
                onClick={proceedToCart}
                disabled={cart.items.length === 0}
                leftIcon={isAuthenticated ? <ArrowRight className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              >
                {cart.items.length === 0
                  ? t('customer.cart.add_items_btn')
                  : isAuthenticated
                    ? t('customer.cart.go_to_cart_btn')
                    : t('customer.cart.sign_in_modal_title')
                }
              </Button>
              {!isAuthenticated && cart.items.length > 0 && (
                <p className="text-xs text-center text-gray-500">
                  {t('customer.cart.sign_in_required_msg')}
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </Modal>
  );
}

export default OrderingModal;
