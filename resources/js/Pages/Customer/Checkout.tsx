
import React from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCartStore } from '@/app/store/cart';
import AddressManager from '@/app/components/customer/AddressManagerEnhanced';
import { useTimeSlots } from '@/app/hooks/useCustomer';
import { Card, CardContent, CardHeader, CardFooter } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import { usePlaceOnlineOrder } from '@/app/hooks/useOrders';
import { usePaymentModes } from '@/app/hooks/useOrderPayment';
import { toastLoading, toastSuccess, toastError } from '@/app/utils/toast';
import { Banknote, CreditCard, ShoppingBag, Truck } from 'lucide-react';

export default function Checkout() {
  const cart = useCartStore();
  const { data: slots, isLoading: slotsLoading } = useTimeSlots(
    cart.mode === 'delivery' ? 'delivery' : 'pickup',
    cart.location_id // Pass location_id from cart
  );
  const { data: paymentModes, isLoading: modesLoading } = usePaymentModes(cart.mode || 'pickup');
  const [selectedPaymentMode, setSelectedPaymentMode] = React.useState<string>('pay_now');

  const placeOrder = usePlaceOnlineOrder();

  // Reset payment mode when order type changes
  React.useEffect(() => {
    setSelectedPaymentMode('pay_now');
  }, [cart.mode]);

  async function onPlaceOrder() {
    // Validation
    if (cart.items.length === 0) {
      toastError('Your cart is empty');
      return;
    }

    if (!cart.location_id) {
      toastError('Please select a restaurant location');
      return;
    }

    if (!cart.timeSlot) {
      toastError('Please select a time slot');
      return;
    }

    if (cart.mode === 'delivery' && !cart.selectedAddress) {
      toastError('Please select a delivery address');
      return;
    }

    // Build payload matching backend API expectations
    const payload = {
      order_type: cart.mode as 'delivery' | 'pickup',
      location_id: cart.location_id,
      customer_address_id: cart.mode === 'delivery' ? cart.selectedAddress?.id : undefined,
      slot_date: cart.timeSlot?.slot_date,
      slot_time: cart.timeSlot?.slot_start_time,
      notes: cart.notes || undefined,
      payment_mode: selectedPaymentMode,
      order_items: cart.items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_instructions: undefined,
      })),
    };

    console.log('🛒 Checkout Payload:', JSON.stringify(payload, null, 2));

    try {
      const result = await placeOrder.mutateAsync(payload);

      console.log('✅ Order placed successfully:', result);

      const orderId = (result as any)?.data?.id || (result as any)?.id || result?.id;

      // Determine next step based on payment mode
      if (selectedPaymentMode === 'pay_now') {
        toastSuccess('Order placed! Redirecting to payment...');
        cart.clear(); // Clear cart immediately for pay_now
        setTimeout(() => {
          window.location.href = `/payment?order_id=${orderId}`;
        }, 500);
      } else {
        // For pay later, redirect to order details/success page
        toastSuccess('Order placed successfully!');
        cart.clear();
        setTimeout(() => {
          window.location.href = `/customer/orders/${orderId}`;
        }, 1000);
      }

    } catch (error: any) {
      // ... existing error handling ...
      console.error('❌ Order placement error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      let errorMsg = 'Failed to place order. Please try again.';

      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (error?.message) {
        errorMsg = error.message;
      }

      window.alert(`Order Failed: ${errorMsg}`);
      toastError(errorMsg);
    }
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {cart.mode === 'delivery' && (
              <AddressManager
                selected={cart.selectedAddress}
                onSelect={(a) => cart.setAddress(a)}
                allowAdd={true}
                allowEdit={true}
                allowDelete={true}
                compact={false}
              />
            )}

            <Card>
              <CardHeader>
                <div className="font-semibold">Time Slot</div>
              </CardHeader>
              <CardContent>
                {!cart.location_id ? (
                  <div className="text-sm text-gray-400 p-4 text-center border border-white/10 rounded-xl bg-white/5">
                    Please select a restaurant location first
                  </div>
                ) : slotsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (!slots || slots.length === 0) ? (
                  <div className="text-sm text-gray-400 p-4 text-center border border-white/10 rounded-xl bg-white/5">
                    <div className="font-medium text-gray-300 mb-1">No time slots available</div>
                    <div className="text-xs">The restaurant is currently closed for {cart.mode}. Please check operating hours or try a different date.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => cart.setTimeSlot(s)}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${cart.timeSlot?.id === s.id
                          ? 'border-fuchsia-400 bg-fuchsia-500/10 text-fuchsia-300'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Payment Option</div>
              </CardHeader>
              <CardContent>
                {modesLoading ? (
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-1/2" />
                    <Skeleton className="h-20 w-1/2" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentModes?.map((mode) => (
                      <button
                        key={mode.code}
                        onClick={() => setSelectedPaymentMode(mode.code)}
                        className={`relative p-4 rounded-xl border text-left transition-all ${selectedPaymentMode === mode.code
                            ? 'border-fuchsia-400 bg-fuchsia-500/10 text-white'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {mode.code === 'pay_now' ? (
                            <CreditCard className={`w-5 h-5 ${selectedPaymentMode === mode.code ? 'text-fuchsia-400' : 'text-gray-400'}`} />
                          ) : (
                            <Banknote className={`w-5 h-5 ${selectedPaymentMode === mode.code ? 'text-fuchsia-400' : 'text-gray-400'}`} />
                          )}
                          <div className="font-semibold">{mode.name}</div>
                        </div>
                        <div className="text-xs opacity-70 ml-8">{mode.description}</div>

                        {selectedPaymentMode === mode.code && (
                          <div className="absolute top-4 right-4 text-fuchsia-400">
                            <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-current" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <div className="font-semibold">Order Summary</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cart.items.map((it) => (
                    <div key={it.menu_item_id} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-gray-500">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                      </div>
                      <div className="text-sm font-medium">${(it.unit_price * it.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
                  {cart.mode === 'delivery' && <div className="flex justify-between"><span>Delivery</span><span>${cart.deliveryFee.toFixed(2)}</span></div>}
                  <div className="flex justify-between"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg mt-2"><span>Total</span><span>${cart.total.toFixed(2)}</span></div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={onPlaceOrder} disabled={placeOrder.isPending || cart.items.length === 0 || !cart.location_id || !cart.timeSlot}>
                  {placeOrder.isPending ? 'Placing...' : (
                    selectedPaymentMode === 'pay_now' ? 'Place & Pay Now' : 'Place Order'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
