import React, { useMemo, useState } from 'react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Skeleton } from '@/app/components/ui/Loading';
import { useCartStore } from '@/app/store/cart';
import { ShoppingCart, XCircle } from 'lucide-react';
import { useOrderUpdates } from '@/app/hooks/useRealtime';

export default function POS() {
  const [categoryId, setCategoryId] = React.useState<number | undefined>();
  const [search, setSearch] = useState<string>('');
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: menu, isLoading: menuLoading } = useMenuItems({ category_id: categoryId });
  const cart = useCartStore();
  
  const filteredMenu = useMemo(() => {
    if (!menu) return [];
    
    let filtered = menu;
    
    // Filter by category if selected
    if (categoryId) {
      filtered = filtered.filter(item => item.category_id === categoryId);
    }
    
    // Filter by search term if present
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchLower) ?? false
      );
    }
    
    return filtered;
  }, [menu, categoryId, search]);

  // Real-time order updates
  useOrderUpdates();

  return (
    <EmployeeLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Point of Sale</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Menu</div>
                  <div className="flex gap-2">
                    <Input placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {catsLoading ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <>
                      <Button
                        variant={categoryId ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => setCategoryId(undefined)}
                      >
                        All
                      </Button>
                      {categories?.map((c) => (
                        <Button
                          key={c.id}
                          variant={categoryId === c.id ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setCategoryId(c.id)}
                        >
                          {c.name}
                        </Button>
                      ))}

                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {menuLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)
                  ) : (
                    filteredMenu.map((m) => (
                      <div key={m.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl">
                        {m.image_url ? (
                          <img src={`${m.image_path}`} alt={m.name} className="h-24 w-full object-cover" />)
                          : <div className="h-24 bg-gradient-to-br from-fuchsia-600/30 to-rose-500/30" />}
                        <div className="p-3">
                          <div className="font-medium truncate">{m.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">${m.price.toFixed(2)}</div>
                          <div className="mt-2">
                            <Button size="sm" className="w-full" onClick={() => cart.addItem({ menu_item_id: m.id, name: m.name, unit_price: m.price, quantity: 1 })} leftIcon={<ShoppingCart className="w-4 h-4" />}>Add</Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <div className="font-semibold">Table & Floor</div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">Table selector placeholder (drag-and-drop floor plan coming soon)</div>
              </CardContent>
            </Card>

            <Card className='sticky top-4'>
              <CardHeader>
                <div className="font-semibold">Current Order</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cart.items.length === 0 ? (
                    <div className="text-sm text-gray-500">No items yet</div>
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
                  <div className="flex justify-between"><span>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg mt-2"><span>Total</span><span>${cart.total.toFixed(2)}</span></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary">Hold</Button>
                  <Button>Charge</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
