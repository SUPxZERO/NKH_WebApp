import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Clock, Star, Zap } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import EnhancedButton from '@/app/components/ui/EnhancedButton';
import { useCartStore } from '@/app/store/cart';
import { MenuItem } from '@/app/types/domain';

interface QuickOrderPanelProps {
  popularItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  className?: string;
}

export function QuickOrderPanel({ popularItems, onItemSelect, className }: QuickOrderPanelProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addItem, items } = useCartStore();

  const updateQuantity = (itemId: number, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const addToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1;
    addItem({
      menu_item_id: item.id,
      name: item.name || item.slug,
      unit_price: item.price,
      quantity
    });
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  const getCartQuantity = (itemId: number) => {
    return items.find(item => item.menu_item_id === itemId)?.quantity || 0;
  };

  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-fuchsia-500/20">
                <Zap className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quick Order</h3>
                <p className="text-sm text-gray-400">Popular items for fast ordering</p>
              </div>
            </div>
          </div>

          {/* Quick Order Grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularItems.map((item) => {
                const quantity = quantities[item.id] || 0;
                const cartQuantity = getCartQuantity(item.id);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="group relative"
                  >
                    <Card className="overflow-hidden hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all duration-300">
                      <CardContent className="p-0">
                        {/* Item Image */}
                        <div className="relative h-32 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                          {item.image_path ? (
                            <img
                              src={item.image_path}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                  {(item.name || item.slug).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Popular Badge */}
                          <div className="absolute top-2 left-2">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm">
                              <Star className="w-3 h-3 text-white fill-current" />
                              <span className="text-xs font-medium text-white">Popular</span>
                            </div>
                          </div>

                          {/* Cart Indicator */}
                          {cartQuantity > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm">
                                <ShoppingCart className="w-3 h-3 text-white" />
                                <span className="text-xs font-medium text-white">{cartQuantity}</span>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="p-3">
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">{item.name}</h4>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-fuchsia-400">
                              ${item.price.toFixed(2)}
                            </span>
                            {item.prep_time && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{item.prep_time}min</span>
                              </div>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            {quantity === 0 ? (
                              <EnhancedButton
                                variant="gradient"
                                size="sm"
                                className="flex-1"
                                onClick={() => updateQuantity(item.id, 1)}
                                leftIcon={<Plus className="w-4 h-4" />}
                                haptic
                                soundEffect="click"
                              >
                                Add
                              </EnhancedButton>
                            ) : (
                              <>
                                <EnhancedButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  haptic
                                >
                                  <Minus className="w-4 h-4" />
                                </EnhancedButton>
                                
                                <div className="flex-1 text-center">
                                  <motion.span
                                    key={quantity}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    className="font-bold text-lg"
                                  >
                                    {quantity}
                                  </motion.span>
                                </div>
                                
                                <EnhancedButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  haptic
                                >
                                  <Plus className="w-4 h-4" />
                                </EnhancedButton>
                              </>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <AnimatePresence>
                            {quantity > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3"
                              >
                                <EnhancedButton
                                  variant="gradient"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => addToCart(item)}
                                  leftIcon={<ShoppingCart className="w-4 h-4" />}
                                  glow
                                  haptic
                                  soundEffect="success"
                                >
                                  Add ${(item.price * quantity).toFixed(2)}
                                </EnhancedButton>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuickOrderPanel;
