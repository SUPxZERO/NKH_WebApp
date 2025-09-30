import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Heart, 
  Star, 
  Clock, 
  MapPin, 
  Gift,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import EnhancedButton from '@/app/components/ui/EnhancedButton';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Order, MenuItem, ApiResponse } from '@/app/types/domain';
import QuickOrderPanel from './QuickOrderPanel';
import SmartOrderRecommendations from './SmartOrderRecommendations';

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  favorite_items: MenuItem[];
  recent_orders: Order[];
  achievements: Achievement[];
  next_reward: {
    points_needed: number;
    reward_name: string;
  };
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function EnhancedCustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'favorites' | 'rewards'>('overview');

  const { data: customerStats, isLoading } = useQuery({
    queryKey: ['customer.dashboard'],
    queryFn: () => apiGet<ApiResponse<CustomerStats>>('/customer/dashboard').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: popularItems = [] } = useQuery({
    queryKey: ['popular-items'],
    queryFn: () => apiGet<ApiResponse<MenuItem[]>>('/menu/popular').then(r => r.data),
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const loyaltyProgress = customerStats ? 
    Math.min((customerStats.loyalty_points % 1000) / 1000 * 100, 100) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
    { id: 'rewards', label: 'Rewards', icon: <Gift className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 via-pink-600/20 to-orange-500/20" />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back! 👋</h1>
                <p className="text-gray-300">Ready to order something delicious?</p>
              </div>
              
              {customerStats && (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-fuchsia-400">
                      {customerStats.total_orders}
                    </div>
                    <div className="text-sm text-gray-400">Orders</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      ${customerStats.total_spent.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-400">Spent</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {customerStats.loyalty_points}
                    </div>
                    <div className="text-sm text-gray-400">Points</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Loyalty Progress */}
            {customerStats && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20">
                      <Award className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Loyalty Progress</h3>
                      <p className="text-sm text-gray-400">
                        {customerStats.next_reward.points_needed} points until {customerStats.next_reward.reward_name}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Current Points</span>
                      <span className="font-medium">{customerStats.loyalty_points}</span>
                    </div>
                    
                    <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${loyaltyProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0</span>
                      <span>1000 points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Smart Recommendations */}
            <SmartOrderRecommendations
              customerId={1} // Replace with actual customer ID
              currentTime={new Date().toISOString()}
              onItemSelect={(item) => console.log('Selected:', item)}
            />

            {/* Quick Order Panel */}
            <QuickOrderPanel
              popularItems={popularItems}
              onItemSelect={(item) => console.log('Quick order:', item)}
            />

            {/* Recent Achievements */}
            {customerStats && customerStats.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20">
                        <Star className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Recent Achievements</h3>
                        <p className="text-sm text-gray-400">Your latest accomplishments</p>
                      </div>
                    </div>
                    
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      View All
                    </EnhancedButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customerStats.achievements.slice(0, 3).map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center mb-3`}>
                          <span className="text-2xl">{achievement.icon}</span>
                        </div>
                        <h4 className="font-medium mb-1">{achievement.name}</h4>
                        <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                        <div className="text-xs text-gray-500">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                      <ShoppingBag className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Order History</h3>
                      <p className="text-sm text-gray-400">Your recent orders</p>
                    </div>
                  </div>
                  
                  <EnhancedButton
                    variant="gradient"
                    leftIcon={<Plus className="w-4 h-4" />}
                    haptic
                  >
                    New Order
                  </EnhancedButton>
                </div>
              </CardHeader>
              <CardContent>
                {customerStats && customerStats.recent_orders.length > 0 ? (
                  <div className="space-y-4">
                    {customerStats.recent_orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 flex items-center justify-center">
                              <span className="text-sm font-bold">#{order.id}</span>
                            </div>
                            <div>
                              <div className="font-medium">{order.items?.length || 0} items</div>
                              <div className="text-sm text-gray-400">
                                {new Date(order.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-fuchsia-400">${order.total.toFixed(2)}</div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                              order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <EnhancedButton variant="secondary" size="sm" className="flex-1">
                            View Details
                          </EnhancedButton>
                          <EnhancedButton variant="ghost" size="sm" className="flex-1">
                            Reorder
                          </EnhancedButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-semibold mb-2">No Orders Yet</h4>
                    <p className="text-gray-400 mb-4">Start your culinary journey with us!</p>
                    <EnhancedButton variant="gradient" leftIcon={<Plus className="w-4 h-4" />}>
                      Place Your First Order
                    </EnhancedButton>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'favorites' && (
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20">
                    <Heart className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Favorite Items</h3>
                    <p className="text-sm text-gray-400">Items you love most</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {customerStats && customerStats.favorite_items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerStats.favorite_items.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                            <Heart className="w-6 h-6 text-white fill-current" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="text-lg font-bold text-fuchsia-400">${item.price.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <EnhancedButton
                          variant="gradient"
                          size="sm"
                          className="w-full"
                          leftIcon={<Plus className="w-4 h-4" />}
                          haptic
                        >
                          Add to Cart
                        </EnhancedButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-semibold mb-2">No Favorites Yet</h4>
                    <p className="text-gray-400">Heart items you love to see them here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
                    <Gift className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Rewards & Offers</h3>
                    <p className="text-sm text-gray-400">Special deals just for you</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold mb-2">Rewards Coming Soon</h4>
                  <p className="text-gray-400 mb-4">
                    Exclusive offers, discounts, and special rewards are on the way!
                  </p>
                  <EnhancedButton variant="gradient">
                    Get Notified
                  </EnhancedButton>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedCustomerDashboard;
