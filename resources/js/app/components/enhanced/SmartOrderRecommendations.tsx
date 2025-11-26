import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Star, 
  Users, 
  Zap,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import EnhancedButton from '@/app/components/ui/EnhancedButton';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { MenuItem, ApiResponse } from '@/app/types/domain';
import { useCartStore } from '@/app/store/cart';

interface MockMenuItem {
  id: number;
  category_id: number;
  name: string;
  price: number;
  image_path?: string | null;
  prep_time?: number;
  rating?: number;
  orders_count?: number;
  active?: boolean;
  // Required for MenuItem compatibility
  location_id: number;
  slug: string;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface RecommendationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  items: MockMenuItem[];
}

interface SmartRecommendationsProps {
  customerId?: number;
  currentTime?: string;
  weather?: string;
  onItemSelect: (item: MenuItem) => void;
}

export function SmartOrderRecommendations({ 
  customerId, 
  currentTime, 
  weather,
  onItemSelect 
}: SmartRecommendationsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const { addItem } = useCartStore();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', customerId, currentTime, weather],
    queryFn: () => apiGet<ApiResponse<RecommendationCategory[]>>('/recommendations', {
      params: { 
        customer_id: customerId,
        time: currentTime,
        weather 
      }
    }).then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper to create complete mock items
  const createMockItem = (partial: Partial<MockMenuItem> & { id: number; name: string; price: number }): MockMenuItem => ({
    location_id: 1,
    slug: partial.name?.toLowerCase().replace(/\s+/g, '-') || 'item',
    is_popular: false,
    is_active: true,
    display_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_id: 1,
    image_path: null,
    prep_time: 10,
    rating: 4.5,
    orders_count: 50,
    active: true,
    ...partial
  });

  // Mock data for demo (replace with actual API data)
  const mockRecommendations: RecommendationCategory[] = [
    {
      id: 'trending',
      title: 'Trending Now',
      description: 'Popular items ordered by others',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500',
      items: [
        createMockItem({ id: 1, category_id: 1, name: 'Margherita Pizza', price: 18.99, prep_time: 15, rating: 4.8, orders_count: 127 }),
        createMockItem({ id: 2, category_id: 2, name: 'Caesar Salad', price: 12.99, prep_time: 8, rating: 4.6, orders_count: 89 }),
        createMockItem({ id: 3, category_id: 3, name: 'Chicken Wings', price: 14.99, prep_time: 12, rating: 4.7, orders_count: 156 })
      ]
    },
    {
      id: 'personalized',
      title: 'For You',
      description: 'Based on your order history',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-fuchsia-500 to-pink-500',
      items: [
        createMockItem({ id: 4, category_id: 1, name: 'Pepperoni Pizza', price: 20.99, prep_time: 15, rating: 4.9, orders_count: 203 }),
        createMockItem({ id: 5, category_id: 4, name: 'Garlic Bread', price: 8.99, prep_time: 5, rating: 4.5, orders_count: 67 })
      ]
    },
    {
      id: 'quick',
      title: 'Quick Bites',
      description: 'Ready in under 10 minutes',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-500',
      items: [
        createMockItem({ id: 6, category_id: 5, name: 'French Fries', price: 6.99, prep_time: 5, rating: 4.4, orders_count: 234 }),
        createMockItem({ id: 7, category_id: 6, name: 'Soft Drink', price: 3.99, prep_time: 1, rating: 4.2, orders_count: 445 })
      ]
    },
    {
      id: 'group',
      title: 'Perfect for Sharing',
      description: 'Great for groups and families',
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-purple-500',
      items: [
        createMockItem({ id: 8, category_id: 1, name: 'Family Pizza Combo', price: 45.99, prep_time: 20, rating: 4.8, orders_count: 78 }),
        createMockItem({ id: 9, category_id: 7, name: 'Appetizer Platter', price: 28.99, prep_time: 15, rating: 4.6, orders_count: 92 })
      ]
    }
  ];
  const categories = recommendations.length > 0 ? recommendations : mockRecommendations;
  const activeData = categories.find(cat => cat.id === activeCategory) || categories[0];

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      menu_item_id: item.id,
      name: item.name || item.slug,
      unit_price: item.price,
      quantity: 1
    });
    onItemSelect(item);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <h3 className="font-semibold">Smart Recommendations</h3>
              <p className="text-sm text-gray-400">Personalized just for you</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {category.icon}
                <span>{category.title}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${activeData.color} bg-opacity-20`}>
                    {activeData.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{activeData.title}</h4>
                    <p className="text-sm text-gray-400">{activeData.description}</p>
                  </div>
                </div>
                
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  View All
                </EnhancedButton>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeData.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
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
                              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${activeData.color} flex items-center justify-center`}>
                                <span className="text-2xl font-bold text-white">
                                  {(item.name || item.slug).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-2">
                            {activeCategory === 'trending' && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm">
                                <TrendingUp className="w-3 h-3 text-white" />
                                <span className="text-xs font-medium text-white">Hot</span>
                              </div>
                            )}
                            
                            {activeCategory === 'quick' && item.prep_time && item.prep_time <= 10 && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm">
                                <Zap className="w-3 h-3 text-white" />
                                <span className="text-xs font-medium text-white">Fast</span>
                              </div>
                            )}
                          </div>

                          {/* Rating */}
                          {item.rating && (
                            <div className="absolute top-2 right-2">
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs font-medium text-white">{item.rating}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="p-4">
                          <h5 className="font-medium mb-2 line-clamp-1">{item.name}</h5>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-fuchsia-400">
                              ${item.price.toFixed(2)}
                            </span>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              {item.prep_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{item.prep_time}min</span>
                                </div>
                              )}
                              
                              {item.orders_count && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{item.orders_count}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <EnhancedButton
                            variant="gradient"
                            size="sm"
                            className="w-full"
                            onClick={() => handleAddToCart(item)}
                            leftIcon={<Plus className="w-4 h-4" />}
                            glow
                            haptic
                            soundEffect="success"
                          >
                            Add to Cart
                          </EnhancedButton>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default SmartOrderRecommendations;
