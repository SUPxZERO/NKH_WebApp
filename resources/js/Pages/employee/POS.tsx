import React, { useMemo, useState, useRef, useEffect } from 'react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Skeleton } from '@/app/components/ui/Loading';
import { useCartStore } from '@/app/store/cart';
import { ShoppingCart, XCircle, Star, Grid3x3, List, Calculator } from 'lucide-react';
import { useOrderUpdates } from '@/app/hooks/useRealtime';
import { MenuItem } from '@/app/types/domain';
import { toastSuccess } from '@/app/utils/toast';

export default function POS() {
  const [categoryId, setCategoryId] = React.useState<number | undefined>();
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNumpad, setShowNumpad] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: menu, isLoading: menuLoading } = useMenuItems({ category_id: categoryId });
  const cart = useCartStore();

  // Favorite/Popular items for quick access
  const favoriteItems = useMemo(() => {
    if (!menu) return [];
    return menu.filter(item => item.is_popular).slice(0, 8);
  }, [menu]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Focus search with '/'
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Toggle numpad with 'n'
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowNumpad(!showNumpad);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showNumpad]);

  const handleQuickAdd = (item: MenuItem) => {
    const qty = parseInt(quantity) || 1;
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: qty
    });
    toastSuccess(`${item.name} x${qty} added`);
    setQuantity('1');
  };

  const handleNumpadClick = (value: string) => {
    if (value === '←') {
      setQuantity(prev => prev.slice(0, -1) || '1');
    } else if (value === 'C') {
      setQuantity('1');
    } else if (value === '✓' && selectedItem) {
      handleQuickAdd(selectedItem);
    } else {
      setQuantity(prev => (prev === '1' ? value : prev + value));
    }
  };

  return (
    <EmployeeLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Point of Sale</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('grid')}
              leftIcon={<Grid3x3 className="w-4 h-4" />}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
              leftIcon={<List className="w-4 h-4" />}
            >
              List
            </Button>
            <Button
              size="sm"
              variant={showNumpad ? 'primary' : 'ghost'}
              onClick={() => setShowNumpad(!showNumpad)}
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              Numpad
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {/* QUICK ACCESS - FAVORITES */}
            {favoriteItems.length > 0 && (
              <Card className="bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-fuchsia-600" />
                    <h3 className="font-semibold text-lg">Quick Access - Favorites</h3>
                    <span className="text-xs text-gray-500">1-tap ordering</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {favoriteItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleQuickAdd(item)}
                        onMouseEnter={() => setSelectedItem(item)}
                        className="group relative h-24 rounded-xl overflow-hidden border-2 border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:border-fuchsia-500/50 hover:scale-105 transition-all duration-200 active:scale-95"
                      >
                        {item.image_path && (
                          <img
                            src={item.image_path}
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40"
                          />
                        )}
                        <div className="relative h-full flex flex-col items-center justify-center p-2 text-center">
                          <div className="text-2xl mb-1">⭐</div>
                          <div className="font-semibold text-sm line-clamp-1">{item.name}</div>
                          <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-bold">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MAIN MENU */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Full Menu</div>
                  <div className="flex gap-2 flex-1 max-w-md">
                    <Input
                      ref={searchRef}
                      placeholder="Search menu... (Press / to focus)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1"
                    />
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
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-2"
                }>
                  {menuLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)
                  ) : (
                    filteredMenu.map((m) => (
                      viewMode === 'grid' ? (
                        // GRID VIEW - Larger cards
                        <div
                          key={m.id}
                          className="group rounded-2xl overflow-hidden border-2 border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:border-fuchsia-500/30 transition-all hover:scale-102"
                        >
                          {m.image_path ? (
                            <img src={m.image_path} alt={m.name} className="h-32 w-full object-cover" />
                          ) : (
                            <div className="h-32 bg-gradient-to-br from-fuchsia-600/30 to-rose-500/30 flex items-center justify-center text-5xl">
                              🍽️
                            </div>
                          )}
                          <div className="p-4">
                            <div className="font-medium truncate text-base">{m.name}</div>
                            <div className="text-sm text-fuchsia-600 dark:text-fuchsia-400 font-bold mt-1">
                              ${m.price.toFixed(2)}
                            </div>
                            <div className="mt-3">
                              <Button
                                size="sm"
                                className="w-full h-12 text-base"
                                onClick={() => handleQuickAdd(m)}
                                leftIcon={<ShoppingCart className="w-5 h-5" />}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // LIST VIEW - Compact
                        <div
                          key={m.id}
                          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all"
                        >
                          {m.image_path && (
                            <img src={m.image_path} alt={m.name} className="w-16 h-16 rounded-lg object-cover" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{m.name}</div>
                            <div className="text-sm text-gray-500">${m.price.toFixed(2)}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleQuickAdd(m)}
                            leftIcon={<ShoppingCart className="w-4 h-4" />}
                          >
                            Add
                          </Button>
                        </div>
                      )
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR - ORDER & NUMPAD */}
          <div className="lg:col-span-4 space-y-4">

          {/* HELD ORDERS PANEL */}
          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-600/30\">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white\">Held Orders</h3>
            </CardHeader>
            <CardContent>
              {/* Placeholder – real UI will read from localStorage */}
              <div className="text-sm text-gray-400\">No held orders</div>
            </CardContent>
          </Card>
            {/* TABLE SELECTOR */}
            <Card>
              <CardHeader>
                <div className="font-semibold">Table & Customer</div>
              </CardHeader>
              <CardContent>
                <select className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-gray-900 dark:text-white text-base">
                  <option value="" className='text-gray-400'>Walk-in</option>
                  <option value="1" className='text-gray-400'>Table 1</option>
                  <option value="2" className='text-gray-400'>Table 2</option>
                  <option value="3" className='text-gray-400'>Table 3</option>
                  <option value="4" className='text-gray-400'>Table 4</option>
                  <option value="5" className='text-gray-400'>Table 5</option>
                </select>
              </CardContent>
            </Card>

            {/* NUMBER PAD */}
            {showNumpad && (
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Quantity</span>
                    <span className="text-3xl font-bold text-blue-600">{quantity}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', '←', '0', 'C'].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumpadClick(num)}
                        className="h-14 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-xl transition-all active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {selectedItem && (
                    <Button
                      className="w-full mt-2 h-12 bg-green-600 hover:bg-green-700"
                      onClick={() => handleNumpadClick('✓')}
                    >
                      ✓ Add {selectedItem.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CURRENT ORDER */}
            <Card className='sticky top-4'>
              <CardHeader>
                <div className="font-semibold">Current Order</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.items.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      No items yet
                    </div>
                  ) : (
                    cart.items.map((it) => (
                      <div key={it.menu_item_id} className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                        <div className="flex-1">
                          <div className="font-medium">{it.name}</div>
                          <div className="text-xs text-gray-500">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cart.updateQty(it.menu_item_id, Math.max(1, it.quantity - 1))}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold">{it.quantity}</span>
                          <button
                            onClick={() => cart.updateQty(it.menu_item_id, it.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => cart.removeItem(it.menu_item_id)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 space-y-2 text-base border-t border-white/20 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-semibold">${cart.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl mt-3 pt-3 border-t border-white/20">
                    <span>Total</span>
                    <span className="text-fuchsia-600">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="h-12 text-base">Hold</Button>
                  <Button className="h-12 text-base bg-green-600 hover:bg-green-700">💳 Charge</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
