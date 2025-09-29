import React from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { ApiResponse, Order } from '@/app/types/domain';
import { Clock, Star, Gift, ShoppingBag } from 'lucide-react';

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  loyalty_points: number;
  total_orders: number;
  favorite_items: string[];
}

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['customer.profile'],
    queryFn: () => apiGet<ApiResponse<CustomerProfile>>('/customer/profile').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer.orders.recent'],
    queryFn: () => apiGet<ApiResponse<Order[]>>('/customer/orders?limit=3').then(r => r.data),
    staleTime: 1000 * 60,
  });

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-fuchsia-600/20 via-pink-500/10 to-rose-500/20 border border-white/10 backdrop-blur-xl">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back{profile?.name ? `, ${profile.name}` : ''}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Ready to satisfy your cravings? Check out today's specials or reorder your favorites.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Order Now</Button>
              <Button variant="secondary">View Menu</Button>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-fuchsia-500/20">
                      <Star className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Loyalty Points</div>
                      {profileLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        <div className="text-xl font-bold">{profile?.loyalty_points || 0}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20">
                      <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Orders</div>
                      {profileLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        <div className="text-xl font-bold">{profile?.total_orders || 0}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/20">
                      <Gift className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Rewards Available</div>
                      <div className="text-xl font-bold">2</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Orders</h2>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ordersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/10">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))
                  ) : recentOrders?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No orders yet. Time to place your first order!</p>
                    </div>
                  ) : (
                    recentOrders?.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(order.placed_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.total.toFixed(2)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                            order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Favorite Items */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Your Favorites</h3>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : profile?.favorite_items?.length === 0 ? (
                  <p className="text-sm text-gray-500">No favorites yet. Order something delicious!</p>
                ) : (
                  <div className="space-y-2">
                    {profile?.favorite_items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm">{item}</span>
                        <Button variant="ghost" size="sm">+</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Promotions */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Special Offers</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30">
                    <div className="font-medium text-sm">Free Delivery</div>
                    <div className="text-xs text-gray-400">On orders over $25</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="font-medium text-sm">20% Off</div>
                    <div className="text-xs text-gray-400">Your next pizza order</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
