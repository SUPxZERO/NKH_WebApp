import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCartStore } from '@/app/store/cart';
import AddressManager from '@/app/components/customer/AddressManagerEnhanced';
import { useTimeSlots } from '@/app/hooks/useCustomer';
import { Card, CardContent, CardHeader, CardFooter } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { usePlaceOnlineOrder } from '@/app/hooks/useOrders';
import { usePaymentModes } from '@/app/hooks/useOrderPayment';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Banknote, CreditCard, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { OrderProgress } from '@/app/components/customer/OrderProgress';
import { TimePicker } from '@/app/components/ui/TimePicker';
import { useTableSession } from '@/app/hooks/useTableSession';
import { useFormPersistence } from '@/app/hooks/useFormPersistence';
import { LoadingButton } from '@/Components/ui/LoadingButton';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function Checkout() {
  const cart = useCartStore();
  const { t } = useTranslation();
  const { isTableOrder } = useTableSession();

  const { data: slots, isLoading: slotsLoading } = useTimeSlots(
    cart.mode === 'delivery' ? 'delivery' : 'pickup',
    cart.location_id
  );
  const { data: paymentModes, isLoading: modesLoading } = usePaymentModes(
    isTableOrder ? 'dine-in' : (cart.mode || 'pickup')
  );
  const [selectedPaymentMode, setSelectedPaymentMode] = React.useState<string>(
    isTableOrder ? 'pay_at_counter' : 'pay_now'
  );
  const [showSummary, setShowSummary] = React.useState(false);

  // Scheduled time state for the time picker
  const [scheduledTime, setScheduledTime] = React.useState<{ hour: number; minute: number; period: 'AM' | 'PM' } | null>(null);

  const placeOrder = usePlaceOnlineOrder();

  // Sprint 3 Phase 2: Form persistence
  const { restore, clear } = useFormPersistence({
    key: 'checkout',
    data: {
      selectedPaymentMode,
      scheduledTime
    },
    excludeFields: [] // No sensitive data in checkout
  });

  // Helper to convert picker time to slot format
  const formatTimeForSlot = (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => {
    let hour24 = time.hour;
    if (time.period === 'AM' && time.hour === 12) hour24 = 0;
    else if (time.period === 'PM' && time.hour !== 12) hour24 = time.hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}:00`;
  };

  // FIX Issue #10: Reset payment mode based on order type (respect backend options)
  // - Table orders: Default to pay_at_counter
  // - Pickup/Delivery: Let backend decide available modes (don't force pay_now)
  React.useEffect(() => {
    if (isTableOrder) {
      setSelectedPaymentMode('pay_at_counter');
    }
  }, [cart.mode, isTableOrder]);

  // Sprint 3 Phase 2: Restore form data on mount
  React.useEffect(() => {
    const saved = restore();
    if (saved) {
      if (saved.selectedPaymentMode && !isTableOrder) {
        setSelectedPaymentMode(saved.selectedPaymentMode);
      }
      if (saved.scheduledTime) {
        setScheduledTime(saved.scheduledTime);
      }
      toastSuccess(t('customer.checkout.form_restored') as string);
    }
  }, []); // Only run once on mount

  // Initialize scheduled time when switching to "Schedule for Later"
  React.useEffect(() => {
    if (!cart.orderNow && !cart.timeSlot) {
      const now = new Date();
      // Default to next hour
      let nextHour = now.getHours() + 1;
      // Clamp between min and max (assuming roughly 7 AM to 10 PM)
      if (nextHour < 7) nextHour = 7;
      if (nextHour > 22) nextHour = 22;

      const period = nextHour >= 12 ? 'PM' : 'AM';
      const displayHour = nextHour > 12 ? nextHour - 12 : (nextHour === 0 || nextHour === 12 ? 12 : nextHour);

      const initialTime = {
        hour: displayHour,
        minute: 0,
        period: period as 'AM' | 'PM'
      };

      setScheduledTime(initialTime);

      // Also update the cart immediately
      const timeStr = formatTimeForSlot(initialTime);
      // Format today as YYYY-MM-DD in local time
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const label = `${displayHour}:00 ${period}`;

      cart.setTimeSlot({
        id: `custom-${timeStr}`,
        label: label,
        start: `${today}T${timeStr}`,
        end: `${today}T${timeStr}`,
        available: true,
        slot_date: today,
        slot_start_time: timeStr,
        slot_type: cart.mode === 'delivery' ? 'delivery' : 'pickup',
      });
    }
  }, [cart.orderNow, cart.timeSlot]);

  async function onPlaceOrder() {
    // Validation
    if (cart.items.length === 0) {
      toastError(t('customer.checkout.empty_cart') as string);
      return;
    }

    if (!cart.location_id) {
      toastError(t('customer.checkout.select_location') as string);
      return;
    }

    if (!cart.orderNow && !cart.timeSlot) {
      toastError(t('customer.checkout.select_time') as string);
      return;
    }

    if (cart.mode === 'delivery') {
      if (!cart.selectedAddress) {
        toastError(t('customer.checkout.select_address') as string);
        return;
      }

      // Sprint 4: Ensure address has coordinates for delivery driver map
      if (!cart.selectedAddress.latitude || !cart.selectedAddress.longitude) {
        toastError(t('customer.checkout.address_missing_coordinates') || 'Selected address is missing location on map. Please edit the address and pin your location.');
        return;
      }
    }

    // Build payload matching backend API expectations
    const payload = {
      order_type: (cart.mode === 'dine-in' ? 'dine_in' : cart.mode) as any, // 'delivery' | 'pickup' | 'dine-in'
      location_id: cart.location_id,
      customer_address_id: cart.mode === 'delivery' ? cart.selectedAddress?.id : undefined,
      order_now: cart.orderNow, // ASAP order flag
      slot_date: cart.orderNow ? undefined : cart.timeSlot?.slot_date,
      slot_time: cart.orderNow ? undefined : cart.timeSlot?.slot_start_time,
      notes: cart.notes || undefined,
      payment_mode: selectedPaymentMode,
      // Inject Telegram ID if available
      telegram_id: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id,
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
        toastSuccess(t('customer.checkout.order_placed_pay') as string);
        cart.clear(); // Clear cart immediately for pay_now
        clear(); // Sprint 3 Phase 2: Clear saved form data
        setTimeout(() => {
          router.visit(`/payment?order_id=${orderId}`);
        }, 500);
      } else {
        // For pay later / pay at counter, redirect to order details/success page
        toastSuccess(t('customer.checkout.order_placed_success') as string);
        cart.clear(); // Clear cart (but session persists via cookie if table order)
        clear(); // Sprint 3 Phase 2: Clear saved form data
        setTimeout(() => {
          router.visit(`/customer/orders/${orderId}`);
        }, 1000);
      }

    } catch (error: any) {
      console.error('❌ Order placement error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      let errorMsg = t('customer.checkout.failed_place') as string;

      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (error?.message) {
        errorMsg = error.message;
      }

      toastError(errorMsg);
    }
  }

  const isCheckoutDisabled = placeOrder.isPending || cart.items.length === 0 || !cart.location_id || (!cart.orderNow && !cart.timeSlot) || (cart.mode === 'delivery' && !cart.selectedAddress);

  return (
    <CustomerLayout>
      <Head>
        <title>{t('customer.checkout.page_title')}</title>
      </Head>

      <motion.div className="space-y-4 sm:space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <motion.div className="flex items-center gap-3" initial={{ y: -10 }} animate={{ y: 0 }}>
          <button
            onClick={() => window.history.back()}
            className="sm:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('customer.checkout.title')}</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t('customer.checkout.items_summary', { count: cart.items.length, unit: cart.items.length === 1 ? t('common.item') : t('common.items'), total: `$${cart.total.toFixed(2)}` })}
            </p>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <OrderProgress currentStep="checkout" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column - Form Sections */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-6">
            {/* Table Info Card - Only for Table Orders */}
            {isTableOrder && (
              <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                    <span className="text-xl">🍽️</span> {t('customer.checkout.dine_in_title')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cart.tableCode || t('customer.checkout.table_fallback')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cart.floorName || t('customer.checkout.floor_fallback')}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 max-w-[50%]">
                      {t('customer.checkout.table_linked')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isTableOrder && cart.mode === 'delivery' && (
              <AddressManager
                selected={cart.selectedAddress}
                onSelect={(a: any) => cart.setAddress(a)}
                allowAdd={true}
                allowEdit={true}
                allowDelete={true}
                compact={false}
              />
            )}

            {/* Time Slot - Hide for Table Orders */}
            {!isTableOrder && (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="text-sm sm:text-base font-semibold">{t('customer.checkout.when_title')}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {!cart.location_id ? (
                    <div className="text-xs sm:text-sm text-gray-400 p-3 sm:p-4 text-center border border-white/10 rounded-lg bg-white/5">
                      {t('customer.checkout.select_location_first')}
                    </div>
                  ) : (
                    <>
                      {/* Order Now Option */}
                      <button
                        onClick={() => cart.setOrderNow(true)}
                        className={`w-full p-3 sm:p-4 rounded-xl border text-left transition-all ${cart.orderNow
                          ? 'border-fuchsia-500 bg-fuchsia-500/15 ring-1 ring-fuchsia-500/50'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cart.orderNow ? 'bg-fuchsia-500/20' : 'bg-white/10'
                              }`}>
                              <span className="text-lg">⚡</span>
                            </div>
                            <div>
                              <div className={`font-semibold text-sm sm:text-base ${cart.orderNow ? 'text-fuchsia-300' : 'text-gray-300'
                                }`}>
                                {t('customer.checkout.order_now')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cart.mode === 'delivery' ? t('customer.checkout.fastest_delivery') : t('customer.checkout.ready_in_mins')}
                              </div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cart.orderNow
                            ? 'border-fuchsia-500 bg-fuchsia-500'
                            : 'border-gray-500'
                            }`}>
                            {cart.orderNow && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>

                      {/* Schedule for Later - Collapsible */}
                      <details
                        className="group"
                        open={!cart.orderNow}
                        onToggle={(e) => {
                          if ((e.target as HTMLDetailsElement).open && cart.orderNow) {
                            cart.setOrderNow(false);
                          }
                        }}
                      >
                        <summary className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all list-none ${!cart.orderNow
                          ? 'border-fuchsia-500 bg-fuchsia-500/15 ring-1 ring-fuchsia-500/50'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!cart.orderNow ? 'bg-fuchsia-500/20' : 'bg-white/10'
                                }`}>
                                <span className="text-lg">📅</span>
                              </div>
                              <div>
                                <div className={`font-semibold text-sm sm:text-base ${!cart.orderNow ? 'text-fuchsia-300' : 'text-gray-300'
                                  }`}>
                                  {t('customer.checkout.schedule_later')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {cart.timeSlot ? cart.timeSlot.label : t('customer.checkout.pick_time')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChevronDown className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!cart.orderNow
                                ? 'border-fuchsia-500 bg-fuchsia-500'
                                : 'border-gray-500'
                                }`}>
                                {!cart.orderNow && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>
                          </div>
                        </summary>

                        {/* Time Picker */}
                        <div className="mt-3 p-4 rounded-lg border border-white/10 bg-gray-800/30">
                          {slotsLoading ? (
                            <Skeleton className="h-14 w-full" />
                          ) : (!slots || slots.length === 0) ? (
                            <div className="text-sm text-gray-400 py-4 text-center">
                              <div className="font-medium text-gray-300">{t('customer.checkout.restaurant_closed')}</div>
                              <div className="text-xs mt-1">{t('customer.checkout.no_times_available', { mode: cart.mode })}</div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <TimePicker
                                value={scheduledTime}
                                minHour24={new Date().getHours() + new Date().getMinutes() / 60} // Current time forward
                                maxHour24={22} // Restaurant closes at 10 PM
                                onChange={(time) => {
                                  setScheduledTime(time);
                                  const timeStr = formatTimeForSlot(time);
                                  const today = new Date().toISOString().split('T')[0];
                                  const label = `${time.hour}:${time.minute.toString().padStart(2, '0')} ${time.period}`;

                                  cart.setTimeSlot({
                                    id: `custom-${timeStr}`,
                                    label: label,
                                    start: `${today}T${timeStr}`,
                                    end: `${today}T${timeStr}`,
                                    available: true,
                                    slot_date: today,
                                    slot_start_time: timeStr,
                                    slot_type: cart.mode === 'delivery' ? 'delivery' : 'pickup',
                                  });
                                }}
                              />

                              {scheduledTime && (
                                <div className="text-center text-sm text-fuchsia-400 font-medium">
                                  ✓ {cart.mode === 'pickup'
                                    ? t('customer.checkout.pickup_at', { time: `${scheduledTime.hour}:${scheduledTime.minute.toString().padStart(2, '0')} ${scheduledTime.period}` })
                                    : t('customer.checkout.delivery_at', { time: `${scheduledTime.hour}:${scheduledTime.minute.toString().padStart(2, '0')} ${scheduledTime.period}` })
                                  }
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    </>
                  )}
                </CardContent>
              </Card>
            )}


            {/* Payment Option */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="text-sm sm:text-base font-semibold">{t('customer.checkout.payment_title')}</div>
              </CardHeader>
              <CardContent className="pt-0">
                {modesLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Skeleton className="h-16 sm:h-20 w-full" />
                    <Skeleton className="h-16 sm:h-20 w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {paymentModes?.map((mode) => (
                      <button
                        key={mode.code}
                        onClick={() => setSelectedPaymentMode(mode.code)}
                        className={`
                          relative p-2.5 sm:p-4 rounded-lg border text-left
                          transition-all duration-200
                          ${selectedPaymentMode === mode.code
                            ? `
                                border-fuchsia-500
                                bg-fuchsia-50 dark:bg-fuchsia-500/15
                                text-fuchsia-700 dark:text-white
                              `
                            : `
                                border-gray-200 dark:border-white/10
                                bg-white dark:bg-white/5
                                text-gray-700 dark:text-gray-400
                                hover:border-fuchsia-300
                              `
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          {mode.code === 'pay_now' ? (
                            <CreditCard className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedPaymentMode === mode.code ? 'text-fuchsia-400' : 'text-gray-400'}`} />
                          ) : (
                            <Banknote className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedPaymentMode === mode.code ? 'text-fuchsia-400' : 'text-gray-400'}`} />
                          )}
                          <div className={`text-xs sm:text-sm font-semibold ${selectedPaymentMode === mode.code ? 'text-fuchsia-700 dark:text-white' : ''}`}>
                            {mode.name}
                          </div>
                        </div>
                        <div className="text-[10px] sm:text-xs opacity-70">{mode.description}</div>

                        {selectedPaymentMode === mode.code && (
                          <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-current flex items-center justify-center">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary (Desktop) */}
          <div className=" lg:col-span-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-2">
                <div className="font-semibold">{t('customer.checkout.order_summary')}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.items.map((it) => (
                    <div key={it.menu_item_id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-gray-500">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                      </div>
                      <div className="font-medium">${(it.unit_price * it.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('customer.checkout.subtotal')}</span><span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.mode === 'delivery' && cart.deliveryFee > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>{t('customer.checkout.delivery')}</span><span>${cart.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('customer.checkout.tax')}</span><span>${cart.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>{t('customer.checkout.total')}</span><span className="text-fuchsia-600">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <LoadingButton
                  className="w-full"
                  size="lg"
                  onClick={onPlaceOrder}
                  disabled={isCheckoutDisabled}
                  loading={placeOrder.isPending}
                  loadingText={t('customer.checkout.placing_order') as string}
                >
                  {selectedPaymentMode === 'pay_now' ? t('customer.checkout.pay_now') : t('customer.checkout.place_order')}
                </LoadingButton>
              </CardFooter>
            </Card>
          </div>
        </div >

        {/* Spacer for mobile fixed bar */}
        < div className="h-20 sm:h-0" />
      </motion.div >

      {/* Mobile Fixed Summary & Checkout */}
      < motion.div
        initial={{ y: 100, opacity: 0 }
        }
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg"
      >
        {/* Collapsible Summary Toggle */}
        < details className="group" open={showSummary} onToggle={(e) => setShowSummary((e.target as HTMLDetailsElement).open)}>
          <summary className="flex items-center justify-between p-3 sm:p-4 cursor-pointer list-none bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{cart.items.length} {t('common.items')}</span>
              <span className="text-base font-bold text-gray-900 dark:text-white">
                ${cart.total.toFixed(2)}
              </span>
            </div>
            <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform flex items-center gap-1">
              {t('customer.checkout.details')}
              {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </summary>

          {/* Expanded Details */}
          <div className="px-3 sm:p-4 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-h-32 overflow-y-auto space-y-1.5">
              {cart.items.map((it) => (
                <div key={it.menu_item_id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{it.name}</span>
                  <span className="text-gray-500 mx-2">×{it.quantity}</span>
                  <span className="font-medium">${(it.unit_price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-1 text-xs border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-gray-500">
                <span>{t('customer.checkout.subtotal')}</span><span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.mode === 'delivery' && cart.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>{t('customer.checkout.delivery')}</span><span>${cart.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>{t('customer.checkout.tax')}</span><span>${cart.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-1">
                <span>{t('customer.checkout.total')}</span><span className="text-fuchsia-600">${cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </details >

        {/* Checkout Button */}
        < div className="p-3 sm:p-4 pt-0" >
          <button
            onClick={onPlaceOrder}
            disabled={isCheckoutDisabled}
            className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placeOrder.isPending ? t('customer.checkout.placing_order') : (
              selectedPaymentMode === 'pay_now' ? t('customer.checkout.pay_now') : t('customer.checkout.place_order')
            )}
          </button>
        </div >
      </motion.div >
    </CustomerLayout >
  );
}
