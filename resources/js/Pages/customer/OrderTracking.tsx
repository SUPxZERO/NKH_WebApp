import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { ApiResponse, Order } from '@/app/types/domain';
import { useOrderUpdates } from '@/app/hooks/useRealtime';
import { CheckCircle, Clock, Truck, ChefHat, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderTracking() {
  const { props } = usePage();
  const orderId = (props as any).orderId;
  
  const { data: order, isLoading } = useQuery({
    queryKey: ['customer.order', orderId],
    queryFn: () => apiGet<ApiResponse<Order>>(`/customer/orders/${orderId}`).then(r => r.data),
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time updates
  useOrderUpdates();

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'preparing', 'ready', 'delivered'];
    return steps.indexOf(status);
  };

  const getStatusIcon = (status: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = `w-6 h-6 ${isCompleted ? 'text-emerald-400' : isActive ? 'text-fuchsia-400' : 'text-gray-400'}`;
    
    switch (status) {
      case 'pending': return <Clock className={iconClass} />;
      case 'preparing': return <ChefHat className={iconClass} />;
      case 'ready': return <Package className={iconClass} />;
      case 'delivered': return <Truck className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Received', description: 'Your order has been confirmed' },
    { key: 'preparing', label: 'Preparing', description: 'Our chefs are working on your order' },
    { key: 'ready', label: 'Ready', description: order?.mode === 'delivery' ? 'Out for delivery' : 'Ready for pickup' },
    { key: 'delivered', label: order?.mode === 'delivery' ? 'Delivered' : 'Completed', description: 'Enjoy your meal!' }
  ];

  const currentStep = order ? getStatusStep(order.status) : 0;
  const estimatedTime = order?.mode === 'delivery' ? '25-35 min' : '15-20 min';

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Order Tracking</h1>
          {order && (
            <p className="text-gray-600 dark:text-gray-300">
              Order #{order.id} • {order.mode === 'delivery' ? 'Delivery' : 'Pickup'}
            </p>
          )}
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : order ? (
          <>
            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">
                    {order.status === 'delivered' ? 'Order Complete!' : `Estimated ${estimatedTime}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.status === 'delivered' 
                      ? 'Thank you for your order!' 
                      : `Your ${order.mode} order is being processed`
                    }
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  <motion.div 
                    className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-fuchsia-500 to-pink-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />

                  {/* Status Steps */}
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index < currentStep;
                      const isActive = index === currentStep;
                      const isFuture = index > currentStep;

                      return (
                        <motion.div
                          key={step.key}
                          className="relative flex items-start gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {/* Icon */}
                          <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 ${
                            isCompleted ? 'bg-emerald-500/20 border-emerald-400' :
                            isActive ? 'bg-fuchsia-500/20 border-fuchsia-400' :
                            'bg-gray-500/20 border-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-emerald-400" />
                            ) : (
                              getStatusIcon(step.key, isActive, isCompleted)
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-2">
                            <div className={`font-medium ${
                              isCompleted || isActive ? 'text-current' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {step.description}
                            </div>
                            {isActive && order.status !== 'delivered' && (
                              <motion.div
                                className="mt-2 text-xs text-fuchsia-400"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                In progress...
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Order Details</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-medium">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-gray-500">
                  Need help with your order?{' '}
                  <a href="tel:+1234567890" className="text-fuchsia-400 hover:underline">
                    Call us at (123) 456-7890
                  </a>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">Order not found</div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}
