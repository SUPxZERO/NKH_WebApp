import React from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCartStore } from '@/app/store/cart';
import { CartItem } from '@/app/components/cart/CartItem';
import { CartSummary } from '@/app/components/cart/CartSummary';
import { CartEmpty } from '@/app/components/cart/CartEmpty';
import Button from '@/app/components/ui/Button';
import { Trash2, ShoppingBag } from 'lucide-react';
import { toastSuccess, toastError } from '@/app/utils/toast';

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
            {/* Cart Items */}
            <motion.div className="lg:col-span-8 space-y-4" variants={itemVariants}>
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

            {/* Cart Summary */}
            <motion.div className="lg:col-span-4" variants={itemVariants}>
              <CartSummary
                subtotal={cart.subtotal}
                deliveryFee={cart.deliveryFee}
                tax={cart.tax}
                total={cart.total}
                itemCount={cart.items.length}
                mode={cart.mode}
                onCheckout={handleCheckout}
                isCheckoutDisabled={cart.items.length === 0}
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
      </motion.div>
    </CustomerLayout>
  );
}
