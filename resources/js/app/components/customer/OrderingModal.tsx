import React, { useMemo, useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import Button from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Skeleton } from '@/app/components/ui/Loading';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { useCustomerAddresses, useTimeSlots } from '@/app/hooks/useCustomer';
import { CustomerAddress, MenuItem, OrderItem, OrderMode, TimeSlot } from '@/app/types/domain';
import { useCartStore } from '@/app/store/cart';
import { toastSuccess } from '@/app/utils/toast';
import { MapPin, Clock, ShoppingCart, XCircle } from 'lucide-react';

interface OrderingModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'delivery' | 'pickup';
}

export function OrderingModal({ open, onClose, mode }: OrderingModalProps) {
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [search, setSearch] = useState<string>('');

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: menu, isLoading: menuLoading } = useMenuItems({ category_id: categoryId, search });

  const { data: addresses, isLoading: addrLoading } = useCustomerAddresses();
  const { data: slots, isLoading: slotsLoading } = useTimeSlots(mode);

  const cart = useCartStore();

  const filteredMenu = useMemo(() => menu || [], [menu]);

  function addItem(item: MenuItem) {
    const orderItem: OrderItem = {
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: 1,
    };
    cart.addItem(orderItem);
    toastSuccess(`${item.name} added to cart`);
  }

  function onSelectAddress(addr?: CustomerAddress | null) {
    cart.setAddress(addr ?? null);
  }

  function onSelectSlot(slot?: TimeSlot | null) {
    cart.setTimeSlot(slot ?? null);
  }

  function proceedCheckout() {
    // In a future step, we can navigate to Checkout page via Inertia router
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'delivery' ? 'Delivery Order' : 'Pickup Order'} size="full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Menu</div>
                <div className="flex gap-2">
                  <Input placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {catsLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <>
                    <Button variant={categoryId ? 'ghost' : 'secondary'} size="sm" onClick={() => setCategoryId(undefined)}>
                      All
                    </Button>
                    {categories?.map((c) => (
                      <Button key={c.id} variant={categoryId === c.id ? 'primary' : 'ghost'} size="sm" onClick={() => setCategoryId(c.id)}>
                        {c.name}
                      </Button>
                    ))}
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {menuLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)
                ) : (
                  filteredMenu.map((m) => (
                    <div key={m.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl">
                      {m.image_url ? (
                        <img src={m.image_url} alt={m.name} className="h-28 w-full object-cover" />
                      ) : (
                        <div className="h-28 bg-gradient-to-br from-fuchsia-600/30 to-rose-500/30" />
                      )}
                      <div className="p-3">
                        <div className="font-medium truncate">{m.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">${m.price.toFixed(2)}</div>
                        <div className="mt-2">
                          <Button size="sm" className="w-full" onClick={() => addItem(m)} leftIcon={<ShoppingCart className="w-4 h-4" />}>Add</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {mode === 'delivery' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold"><MapPin className="w-4 h-4" /> Delivery Address</div>
              </CardHeader>
              <CardContent>
                {addrLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="space-y-2">
                    {(addresses || []).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => onSelectAddress(a)}
                        className={`w-full text-left px-4 py-3 rounded-xl border ${cart.selectedAddress?.id === a.id ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/10 bg-white/5'}`}
                      >
                        <div className="font-medium">{a.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{a.line1}</div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 font-semibold"><Clock className="w-4 h-4" /> Time Slot</div>
            </CardHeader>
            <CardContent>
              {slotsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(slots || []).filter(s => s.available).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectSlot(s)}
                      className={`px-3 py-2 rounded-xl border text-sm ${cart.timeSlot?.id === s.id ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/10 bg-white/5'}`}
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
              <div className="font-semibold">Order Summary</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.items.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Your cart is empty.</div>
                ) : (
                  cart.items.map((it) => (
                    <div key={it.menu_item_id} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-gray-500">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => cart.updateQty(it.menu_item_id, Math.max(1, it.quantity - 1))} className="px-2 py-1 rounded-lg bg-white/10">-</button>
                        <span className="w-6 text-center">{it.quantity}</span>
                        <button onClick={() => cart.updateQty(it.menu_item_id, it.quantity + 1)} className="px-2 py-1 rounded-lg bg-white/10">+</button>
                        <button onClick={() => cart.removeItem(it.menu_item_id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
                {mode === 'delivery' && <div className="flex justify-between"><span>Delivery</span><span>${cart.deliveryFee.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold text-lg mt-2"><span>Total</span><span>${cart.total.toFixed(2)}</span></div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={proceedCheckout} leftIcon={<ShoppingCart className="w-5 h-5" />}>Proceed to checkout</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Modal>
  );
}

export default OrderingModal;
