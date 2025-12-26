import React, { useMemo, useState, useRef, useEffect } from 'react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Skeleton } from '@/app/components/ui/Loading';
import { useCartStore } from '@/app/store/cart';
import { ShoppingCart, XCircle, Star, Grid3x3, List, Calculator, Info, Clock, Receipt, Plus, RefreshCw } from 'lucide-react';
import { useOrderUpdates } from '@/app/hooks/useRealtime';
import { MenuItem } from '@/app/types/domain';
import { toastSuccess } from '@/app/utils/toast';
import { useActivePOSOrders } from '@/app/hooks/useOrderPayment';
import POSOrderPaymentPanel from '@/app/components/pos/POSOrderPaymentPanel';
import { POSMenuGrid } from '@/app/components/pos/POSMenuGrid';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiGet } from '@/app/utils/api';
import { toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { FoodDetailModal } from '@/app/components/food/FoodDetailModal';
import { useHotkeys } from 'react-hotkeys-hook';
import { isUserInInputField } from '@/app/utils/shortcuts';

interface Floor {
  id: number;
  name: string;
  tables: Table[];
}

interface Table {
  id: number;
  code: string;
  status: 'available' | 'occupied' | 'reserved';
}


import { useSmartPolling } from '@/app/hooks/useSmartPolling';

export default function POS() {
  // Smart Polling for Orders and Tables
  useSmartPolling(['orders', 'tables'], 10000);

  const [categoryId, setCategoryId] = React.useState<number | undefined>();
  const [search, setSearch] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'new' | 'orders'>('new');
  const [showNumpad, setShowNumpad] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const searchRef = useRef<HTMLInputElement>(null);

  // Food detail modal state
  const [detailItemId, setDetailItemId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewItemDetail = (item: MenuItem) => {
    setDetailItemId(item.id);
    setIsDetailOpen(true);
  };

  const handleAddFromDetail = (item: MenuItem, qty: number) => {
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: qty,
      image_path: item.image_path || undefined,
    });
    toastSuccess(`${item.name} x${qty} added`);
    setIsDetailOpen(false);
    setDetailItemId(null);
  };

  // --- New Logic State ---
  const [activeFloorId, setActiveFloorId] = useState<number | undefined>();
  const [selectedTable, setSelectedTable] = useState<number | undefined>();
  const [heldOrders, setHeldOrders] = useState<any[]>([]);

  // Fetch Tables & Floors
  const { data: floorsData } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: async () => {
      const res = await apiGet('/api/employee/pos/tables');
      // The controller returns { floors: [...] }, and apiGet returns the response body directly.
      // If the controller wrapped it in 'data', it would be res.data.floors.
      // But it doesn't.
      return (res.floors || res.data?.floors || []) as Floor[];
    }
  });

  // Auto-select first floor
  useEffect(() => {
    if (floorsData && floorsData.length > 0 && !activeFloorId) {
      setActiveFloorId(floorsData[0].id);
    }
  }, [floorsData, activeFloorId]);

  const activeFloor = useMemo(() =>
    floorsData?.find(f => f.id === activeFloorId),
    [floorsData, activeFloorId]);

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: menu, isLoading: menuLoading } = useMenuItems({ category_id: categoryId });
  const { data: activeOrders, isLoading: ordersLoading, refetch: refetchOrders } = useActivePOSOrders();
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

  useHotkeys(
    '/',
    (e) => {
      if (isUserInInputField()) return;
      e.preventDefault();
      searchRef.current?.focus();
    },
    { preventDefault: true },
    []
  );

  useHotkeys(
    'mod+shift+n',
    (e) => {
      if (isUserInInputField()) return;
      e.preventDefault();
      setShowNumpad((prev) => !prev);
    },
    { preventDefault: true },
    []
  );

  const handleQuickAdd = (item: MenuItem) => {
    const qty = parseInt(quantity) || 1;
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: qty,
      image_path: item.image_path || undefined,
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

  // Load held orders
  useEffect(() => {
    const saved = localStorage.getItem('pos_held_orders');
    if (saved) {
      try {
        setHeldOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load held orders', e);
      }
    }
  }, []);

  const handleHoldOrder = () => {
    if (cart.items.length === 0) return;

    const newHold = {
      id: Date.now(),
      items: [...cart.items],
      tableId: selectedTable,
      timestamp: new Date().toISOString(),
      total: cart.total
    };

    const updated = [...heldOrders, newHold];
    setHeldOrders(updated);
    localStorage.setItem('pos_held_orders', JSON.stringify(updated));

    cart.clear();
    setSelectedTable(undefined);
    toastSuccess('Order held');
  };

  const restoreHeldOrder = (holdId: number) => {
    const order = heldOrders.find(h => h.id === holdId);
    if (!order) return;

    if (cart.items.length > 0) {
      if (!confirm('This will replace your current cart. Continue?')) return;
    }

    cart.clear();
    order.items.forEach((item: any) => {
      cart.addItem(item);
    });
    setSelectedTable(order.tableId);

    // Remove from held
    const updated = heldOrders.filter(h => h.id !== holdId);
    setHeldOrders(updated);
    localStorage.setItem('pos_held_orders', JSON.stringify(updated));
    toastSuccess('Held order restored');
  };

  // Charge Mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        table_id: selectedTable,
        items: cart.items.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          notes: i.notes
        })),
        notes: cart.notes
      };
      const res = await apiPost('/api/employee/pos/orders', payload);
      return res.data;
    },
    onSuccess: (order) => {
      cart.clear();
      setSelectedTable(undefined);
      setPaymentOrder(order); // Open payment modal
    },
    onError: (err) => {
      toastError('Failed to create order');
      console.error(err);
    }
  });

  const handleChargeOrder = () => {
    if (cart.items.length === 0) return;
    createOrderMutation.mutate();
  };

  return (
    <EmployeeLayout>
      <div className="space-y-4 pb-20 lg:pb-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl dark:bg-gray-800/80 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                "flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
              )}
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
              )}
            >
              <Receipt className="w-4 h-4" />
              Active
              {activeOrders && activeOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                  {activeOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* View Mode Toggle (only in New Order tab) */}
        {activeTab === 'new' && (
          <div className="flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
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
        )}

        {activeTab === 'orders' ? (
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-fuchsia-500" />
                  <h3 className="font-semibold text-lg">Active Orders</h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => refetchOrders()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center p-8"><Skeleton className="w-12 h-12 rounded-full" /></div>
                ) : activeOrders?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Receipt className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No active orders</p>
                    <p className="text-sm text-gray-400 mt-1">Create a new order to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeOrders?.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setPaymentOrder(order)}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 cursor-pointer transition-all bg-white dark:bg-gray-800 shadow-sm hover:shadow-md active:scale-98"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-bold text-lg">#{order.order_number}</div>
                            <div className="text-sm text-gray-500">{order.customer_name}</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'}`
                          }>
                            {order.payment_status}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-3">
                          <div className="flex gap-2">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{order.order_type}</span>
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{order.items_count} items</span>
                          </div>
                          <div className="text-gray-400">{new Date(order.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <div className="font-bold text-xl">${order.total_amount.toFixed(2)}</div>
                          <Button size="sm" className="bg-blue-600 h-10 px-4">Pay</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={cn("lg:col-span-8 space-y-4", mobileTab === 'cart' ? 'hidden lg:block' : 'block')}>
              {/* QUICK ACCESS - FAVORITES */}
              {favoriteItems.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Favorites</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                    {favoriteItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleQuickAdd(item)}
                        className="group relative min-w-[140px] h-36 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 snap-start flex-shrink-0 flex flex-col text-left transition-transform active:scale-95"
                      >
                        {/* Image Area */}
                        <div className="h-20 w-full relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                          {item.image_path ? (
                            <img
                              src={item.image_path}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                              ⭐
                            </div>
                          )}
                          {/* Price Tag Overlay */}
                          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 flex-1 flex flex-col justify-center">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                            {item.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MAIN MENU */}
              <Card className="border-0 shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-white sm:dark:bg-gray-800">
                <CardHeader className="px-0 sm:px-6 pt-0 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <div className="text-lg font-bold hidden sm:block">Menu</div>
                    <div className="flex gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-md">
                      <div className="relative flex-1">
                        <Input
                          ref={searchRef}
                          placeholder="Search items..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {catsLoading ? (
                      <Skeleton className="h-9 w-24 rounded-full" />
                    ) : (
                      <>
                        <button
                          onClick={() => setCategoryId(undefined)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                            !categoryId
                              ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-md"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          )}
                        >
                          All
                        </button>
                        {categories?.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setCategoryId(c.id)}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                              categoryId === c.id
                                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-md"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                            )}
                          >
                            {c.name}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-6 pt-0 sm:pt-0">
                  <POSMenuGrid
                    items={filteredMenu}
                    isLoading={menuLoading}
                    viewMode={viewMode}
                    onItemClick={handleQuickAdd}
                    onViewDetails={handleViewItemDetail}
                  />
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDEBAR - ORDER & NUMPAD */}
            <div className={cn("lg:col-span-4 space-y-4", mobileTab === 'menu' ? 'hidden lg:block' : 'block')}>

              {/* HELD ORDERS PANEL */}
              {heldOrders.length > 0 && (
                <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="text-lg font-semibold text-foreground">Held ({heldOrders.length})</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {heldOrders.map((h) => (
                        <div key={h.id} className="flex justify-between items-center p-2 rounded bg-card border border-border text-sm">
                          <div>
                            <div className="font-medium text-foreground">Table {h.tableId || 'Walk-in'}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${h.total.toFixed(2)}
                            </div>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => restoreHeldOrder(h.id)}>
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <div className="font-semibold">Table & Customer</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Floor Selector */}
                  {floorsData && floorsData.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {floorsData.map((floor) => (
                        <div
                          key={floor.id}
                          className={cn(
                            "cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeFloorId === floor.id
                              ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-800"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                          )}
                          onClick={() => setActiveFloorId(floor.id)}
                        >
                          {floor.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No floors found</div>
                  )}

                  {/* Table Selector */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedTable(undefined)}
                      className={cn(
                        "h-12 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center",
                        selectedTable === undefined
                          ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                      )}
                    >
                      Walk-in
                    </button>

                    {activeFloor?.tables?.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.id)}
                        className={cn(
                          "h-12 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center justify-center",
                          selectedTable === table.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                            : table.status === 'occupied'
                              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                              : "bg-white text-gray-800 border-gray-200 hover:border-blue-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        )}
                      >
                        <span>{table.code}</span>
                        {table.status === 'occupied' && <span className="text-[10px] opacity-75">Occupied</span>}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* NUMBER PAD */}
              {showNumpad && (
                <Card className="bg-info-muted dark:bg-info/5 border-info/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Quantity</span>
                      <span className="text-3xl font-bold text-info">{quantity}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {['7', '8', '9', '4', '5', '6', '1', '2', '3', '←', '0', 'C'].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleNumpadClick(num)}
                          className="h-12 sm:h-14 rounded-lg bg-secondary hover:bg-secondary-hover border border-border text-foreground font-bold text-lg sm:text-xl transition-all active:scale-95 min-h-[44px]"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    {selectedItem && (
                      <Button
                        className="w-full mt-2 h-12"
                        variant="success"
                        onClick={() => handleNumpadClick('✓')}
                      >
                        ✓ Add {selectedItem.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* CURRENT ORDER */}
              <Card className='sticky top-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-2 border-fuchsia-200 dark:border-fuchsia-800/30 shadow-lg'>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-fuchsia-600" />
                      </div>
                      <span className="font-semibold text-lg">Current Order</span>
                    </div>
                    {cart.items.length > 0 && (
                      <span className="text-sm text-muted-foreground">{cart.items.length} items</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100vh-14rem)] lg:h-auto lg:max-h-none">
                  <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-3 pb-4">
                    {cart.items.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center justify-center h-full">
                        <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
                        No items yet
                      </div>
                    ) : (
                      cart.items.map((it) => (
                        <div key={it.menu_item_id} className="flex items-start justify-between gap-2 pb-3 border-b border-border last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{it.name}</div>
                            <div className="text-xs text-muted-foreground">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => cart.updateQty(it.menu_item_id, Math.max(1, it.quantity - 1))}
                              className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary-hover border border-border text-foreground font-bold flex items-center justify-center touch-manipulation"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-foreground text-sm">{it.quantity}</span>
                            <button
                              onClick={() => cart.updateQty(it.menu_item_id, it.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary-hover border border-border text-foreground font-bold flex items-center justify-center touch-manipulation"
                            >
                              +
                            </button>
                            <button
                              onClick={() => cart.removeItem(it.menu_item_id)}
                              className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 ml-1 touch-manipulation"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-base border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">${cart.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-semibold text-foreground">${cart.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl mt-3 pt-3 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">${cart.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button
                      variant="ghost"
                      className="h-12 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => cart.clear()}
                      disabled={cart.items.length === 0}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-12 text-base"
                      onClick={handleHoldOrder}
                      disabled={cart.items.length === 0}
                    >
                      Hold
                    </Button>
                    <Button
                      className="h-12 text-base"
                      variant="success"
                      onClick={handleChargeOrder}
                      disabled={cart.items.length === 0 || createOrderMutation.isPending}
                      loading={createOrderMutation.isPending}
                    >
                      💳 Charge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MOBILE BOTTOM NAVIGATION - Sticky Footer */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 z-50 flex gap-2">
              <button
                onClick={() => setMobileTab('menu')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                  mobileTab === 'menu'
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Grid3x3 className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Menu</span>
              </button>
              <button
                onClick={() => setMobileTab('cart')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
                  mobileTab === 'cart'
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {cart.items.length > 0 && (
                  <span className="absolute top-2 right-1/4 translate-x-1/2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cart.items.length}
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium flex items-center gap-1">
                    Cart
                    {cart.total > 0 && <span className="text-green-600 dark:text-green-400 font-bold">(${cart.total.toFixed(0)})</span>}
                  </span>
                </div>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Payment Modal */}
      {
        paymentOrder && (
          <POSOrderPaymentPanel
            order={paymentOrder}
            onClose={() => setPaymentOrder(null)}
            onSuccess={() => {
              setPaymentOrder(null);
              refetchOrders();
            }}
          />
        )
      }

      {/* Food Detail Modal - View item details before adding */}
      <FoodDetailModal
        foodId={detailItemId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailItemId(null);
        }}
        onAddToCart={handleAddFromDetail}
        showAddToCart={true}
        initialQuantity={parseInt(quantity) || 1}
      />
    </EmployeeLayout >
  );
}
