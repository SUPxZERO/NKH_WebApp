import React from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCartStore } from '@/app/store/cart';
import AddressManager from '@/app/components/customer/AddressManager';
import { useTimeSlots } from '@/app/hooks/useCustomer';
import { Card, CardContent, CardHeader, CardFooter } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import { usePlaceOnlineOrder } from '@/app/hooks/useOrders';
import { toastLoading, toastSuccess, toastError } from '@/app/utils/toast';

export default function Checkout() {
  const cart = useCartStore();
  const { data: slots, isLoading: slotsLoading } = useTimeSlots(cart.mode === 'delivery' ? 'delivery' : 'pickup');
  const placeOrder = usePlaceOnlineOrder();

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
      order_type: cart.mode as 'delivery' | 'pickup',  // Type assertion to exclude 'dine-in'
      location_id: cart.location_id,
      customer_address_id: cart.mode === 'delivery' ? cart.selectedAddress?.id : undefined,
      time_slot_id: Number(cart.timeSlot.id), // Convert to number
      notes: cart.notes || undefined,
      order_items: cart.items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_instructions: undefined, // Can add per-item notes later
      })),
    };

    console.log('🛒 Checkout Payload:', JSON.stringify(payload, null, 2));

    try {
      const result = await placeOrder.mutateAsync(payload);

      console.log('✅ Order placed successfully:', result);

      // Show success toast
      toastSuccess('Order placed successfully!');

      // Clear cart ONLY on success
      cart.clear();

      // Redirect to order history
      setTimeout(() => {
        window.location.href = '/customer/orders';
      }, 1000);

    } catch (error: any) {
      console.error('❌ Order placement error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      // Extract detailed error message
      let errorMsg = 'Failed to place order. Please try again.';

      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        // Laravel validation errors
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (error?.message) {
        errorMsg = error.message;
      }

      // DEBUG: Alert the error
      window.alert(`Order Failed: ${errorMsg}`);

      toastError(errorMsg);

      // DO NOT clear cart on error - user should be able to retry
    }
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {cart.mode === 'delivery' && (
              <AddressManager selected={cart.selectedAddress} onSelect={(a) => cart.setAddress(a)} />
            )}

            <Card>
              <CardHeader>
                <div className="font-semibold">Time Slot</div>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(slots || []).map((s) => (
                      <button key={s.id} onClick={() => cart.setTimeSlot(s)} className={`px-3 py-2 rounded-xl border text-sm ${cart.timeSlot?.id === s.id ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/10 bg-white/5'}`}>{s.label}</button>
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
                  {placeOrder.isPending ? 'Placing...' : 'Place Order'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
