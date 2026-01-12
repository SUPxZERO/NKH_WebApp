import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react'; // Sprint 3: Added router import
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCartStore } from '@/app/store/cart';
import { CartItem } from '@/app/components/cart/CartItem';
import { CartSummary } from '@/app/components/cart/CartSummary';
import { CartEmpty } from '@/app/components/cart/CartEmpty';
import { ModeSelector } from '@/app/components/cart/ModeSelector';
import { LocationSelector } from '@/app/components/cart/LocationSelector';
import Button from '@/app/components/ui/Button';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { toastSuccess, toastError, toastInfo } from '@/app/utils/toast';

import { apiGet } from '@/app/utils/api';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function Cart() {
  const cart = useCartStore();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const { auth } = usePage().props as { auth?: { user?: any } };
  const isAuthenticated = !!auth?.user;

  // FIX Issue #12: Sync cart with server on mount (SERVER WINS strategy)
  // This prevents data loss when user switches devices (e.g., Telegram -> Desktop)
  React.useEffect(() => {
    if (isAuthenticated) {
      apiGet('/customer/cart')
        .then((res: any) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            // SERVER WINS: If server has items, use server cart
            // This ensures items added on mobile (Telegram) are preserved
            console.log('📱 Syncing cart from server (server wins):', res.data);
            cart.setItems(res.data);
          }
          // If server cart is empty, keep local cart (user just added items)
        })
        .catch(err => {
          console.error('Failed to sync cart:', err);
        });
    }
  }, [isAuthenticated]);

  const handleUpdateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity < 1) {
      cart.removeItem(menuItemId);
      toastSuccess('Item removed from cart');
    } else {
      cart.updateQty(menuItemId, quantity);
    }
  };

  const handleRemoveItem = (menuItemId: number) => {
    cart.removeItem(menuItemId);
    toastSuccess('Item removed from cart');
  };

  const handleClearCart = () => {
    cart.clear();
    setShowClearConfirm(false);
    toastSuccess('Cart cleared');
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toastError('Your cart is empty');
      return;
    }

    if (!cart.location_id) {
      toastError('Please select a restaurant location');
      return;
    }

    // Check if running in Telegram Web App
    const isTelegram = (window as any).Telegram?.WebApp?.initData;

    if (!isAuthenticated && !isTelegram) {
      localStorage.setItem('pendingCheckout', 'true');
      localStorage.setItem('checkoutRedirectUrl', '/checkout');
      toastInfo('Please sign in to complete your order');
      // Sprint 3: Use router.visit for smooth navigation
      router.visit('/login?redirect=/checkout', {
        preserveScroll: false
      });
      return;
    }

    // Sprint 3: Use router.visit instead of window.location.href
    router.visit('/checkout', {
      preserveScroll: false
    });
  };

  const isEmpty = cart.items.length === 0;

  return (
    <CustomerLayout>
      <Head>
        <title>Cart - NKH Restaurant</title>
        <meta name="description" content="Review your cart and proceed to checkout" />
      </Head>

      <motion.div
        className="space-y-4 sm:space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header - Compact on mobile */}
        <motion.div
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="sm:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Your Cart
              </h1>
              {!isEmpty && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>

          {!isEmpty && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-red-500 hover:text-red-600 p-2"
            >
              Clear
            </button>
          )}
        </motion.div>

        {/* Clear Cart Confirmation */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Clear Cart?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Remove all items from your cart?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleClearCart}
                  >
                    Clear
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {isEmpty ? (
          <CartEmpty onBrowseMenu={() => router.visit('/menu')} />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Mobile: Compact Mode Selector */}
            <motion.div variants={itemVariants} className="sm:hidden">
              <ModeSelector
                mode={cart.mode as 'delivery' | 'pickup'}
                onChange={(mode) => cart.setMode(mode)}
              />
            </motion.div>

            {/* Desktop: Full Mode Selector */}
            <motion.div variants={itemVariants} className="hidden sm:block">
              <ModeSelector
                mode={cart.mode as 'delivery' | 'pickup'}
                onChange={(mode) => cart.setMode(mode)}
              />
            </motion.div>

            {/* Location Selector - Compact */}
            <motion.div variants={itemVariants}>
              <LocationSelector
                selectedId={cart.location_id}
                onSelect={(id, name) => cart.setLocation(id, name)}
              />
            </motion.div>

            {/* Cart Items */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:hidden">
                Items ({cart.items.length})
              </h2>
              <AnimatePresence mode="popLayout">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.menu_item_id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Desktop: Cart Summary */}
            <motion.div variants={itemVariants} className="hidden lg:block">
              <CartSummary
                subtotal={cart.subtotal}
                deliveryFee={cart.deliveryFee}
                tax={cart.tax}
                total={cart.total}
                itemCount={cart.items.length}
                mode={cart.mode}
                onCheckout={handleCheckout}
                isCheckoutDisabled={cart.items.length === 0 || !cart.location_id}
              />
            </motion.div>

            {/* Desktop: Continue Shopping */}
            <motion.div variants={itemVariants} className="hidden sm:block pt-2">
              <Button
                variant="outline"
                onClick={() => router.visit('/menu')}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                Continue Shopping
              </Button>
            </motion.div>
          </div>
        )}

        {/* Spacer for mobile floating button */}
        {!isEmpty && <div className="h-24 sm:h-0" />}
      </motion.div>

      {/* Mobile Floating Summary & Checkout */}
      {!isEmpty && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg"
        >
          {/* Collapsible Summary Toggle */}
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{cart.items.length} items</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${cart.total.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">
                Show details
              </span>
            </summary>

            {/* Expanded Details */}
            <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.mode === 'delivery' && cart.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span>${cart.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span>${cart.tax.toFixed(2)}</span>
              </div>
            </div>
          </details>

          {/* Checkout Button */}
          <div className="p-4 pt-0">
            <button
              onClick={handleCheckout}
              disabled={!cart.location_id}
              className="w-full py-3.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout • ${cart.total.toFixed(2)}
            </button>
          </div>
        </motion.div>
      )}
    </CustomerLayout>
  );
}
