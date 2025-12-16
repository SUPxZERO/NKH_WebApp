import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCartStore } from '@/app/store/cart';
import { CartItem } from '@/app/components/cart/CartItem';
import { CartSummary } from '@/app/components/cart/CartSummary';
import { CartEmpty } from '@/app/components/cart/CartEmpty';
import { ModeSelector } from '@/app/components/cart/ModeSelector';
import { LocationSelector } from '@/app/components/cart/LocationSelector';
import Button from '@/app/components/ui/Button';
import { Trash2, ShoppingBag, LogIn, ArrowRight } from 'lucide-react';
import { toastSuccess, toastError, toastInfo } from '@/app/utils/toast';
import { OrderProgress } from '@/app/components/customer/OrderProgress';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function Cart() {
  const cart = useCartStore();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  // Get auth state from Inertia props
  const { auth } = usePage().props as { auth?: { user?: any } };
  const isAuthenticated = !!auth?.user;

  const handleUpdateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity < 1) {
      // If quantity becomes 0, remove the item
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

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save pending checkout state
      localStorage.setItem('pendingCheckout', 'true');
      localStorage.setItem('checkoutRedirectUrl', '/checkout');

      toastInfo('Please sign in to complete your order');

      // Redirect to login with intended destination
      window.location.href = '/login?redirect=/checkout';
      return;
    }

    window.location.href = '/checkout';
  };

  const isEmpty = cart.items.length === 0;

  return (
    <CustomerLayout>
      <Head>
        <title>Cart - NKH Restaurant</title>
        <meta name="description" content="Review your cart and proceed to checkout" />
      </Head>

      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Progress Indicator */}
        <motion.div variants={itemVariants}>
          <OrderProgress currentStep="cart" />
        </motion.div>

        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                Your Cart
              </span>
            </h1>
            {!isEmpty && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
              </p>
            )}
          </div>

          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowClearConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
            >
              Clear Cart
            </Button>
          )}
        </motion.div>

        {/* Clear Cart Confirmation */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Clear Cart?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to remove all items from your cart? This action cannot be undone.
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
                    Clear Cart
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {isEmpty ? (
          <CartEmpty onBrowseMenu={() => (window.location.href = '/menu')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Cart Items + Selectors */}
            <motion.div className="lg:col-span-8 space-y-6" variants={itemVariants}>
              {/* Mode Selector */}
              <ModeSelector
                mode={cart.mode as 'delivery' | 'pickup'}
                onChange={(mode) => cart.setMode(mode)}
              />

              {/* Location Selector */}
              <LocationSelector
                selectedId={cart.location_id}
                onSelect={(id, name) => cart.setLocation(id, name)}
              />

              {/* Cart Items */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Items</h2>
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
              </div>

              {/* Continue Shopping Button (Mobile) */}
              <div className="lg:hidden pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = '/menu')}
                  leftIcon={<ShoppingBag className="w-5 h-5" />}
                >
                  Continue Shopping
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Cart Summary */}
            <motion.div className="lg:col-span-4" variants={itemVariants}>
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
          </div>
        )}

        {/* Recommendations Section (Optional - when cart has items) */}
        {!isEmpty && (
          <motion.section
            className="pt-8 border-t border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              You might also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['🍔', '🍕', '🍝', '🍰'].map((emoji, i) => (
                <motion.div
                  key={i}
                  className="aspect-square rounded-2xl bg-white/60 dark:bg-white/5 border border-white/20 flex items-center justify-center text-5xl hover:scale-105 transition-transform cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Spacer for mobile floating button */}
        {!isEmpty && <div className="lg:hidden h-24" />}
      </motion.div>

      {/* Floating Checkout Button - Mobile Only */}
      {!isEmpty && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-950/90 backdrop-blur-xl border-t border-white/10"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">${cart.total.toFixed(2)}</p>
            </div>
            <motion.button
              onClick={handleCheckout}
              disabled={!cart.location_id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 text-white font-bold text-lg shadow-2xl shadow-fuchsia-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 animate-pulse opacity-30 blur-md" />
              <span className="relative">Checkout</span>
              <ArrowRight className="relative w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </CustomerLayout>
  );
}

