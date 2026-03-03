import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderItem, OrderMode, CustomerAddress, TimeSlot } from '@/types';

interface CartState {
  mode: OrderMode; // 'delivery' | 'pickup' | 'dine-in'
  items: OrderItem[];
  location_id?: number;
  locationName?: string;
  addressId?: number; // for delivery
  selectedAddress?: CustomerAddress | null;
  orderNow: boolean; // true = ASAP order, false = scheduled
  timeSlot?: TimeSlot | null;
  notes?: string;

  // Table Session State
  tableSessionToken?: string;
  tableId?: number;
  tableCode?: string;
  floorName?: string;
  isTableOrder: boolean;

  // Computed totals (recalculated via recalc() with live pricing)
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;

  // AUDIT FIX: Live pricing from API — set externally by useLocationSettings hook.
  // Never hardcode tax_rate or delivery_fee in the store; they must come from the DB.
  _taxRate: number;
  _deliveryFee: number;

  setMode: (mode: OrderMode) => void;
  setLocation: (location_id: number, locationName?: string) => void;
  setAddress: (address?: CustomerAddress | null) => void;
  setOrderNow: (value: boolean) => void;
  setTimeSlot: (slot?: TimeSlot | null) => void;
  setNotes: (notes?: string) => void;

  /**
   * AUDIT FIX: Updates live pricing from the API response and recalculates totals.
   * Called by the useLocationSettings hook whenever the location changes or
   * fresh pricing is loaded. Replaces the old hardcoded 10% tax / $2.50 fee.
   */
  setPricing: (taxRate: number, deliveryFee: number) => void;

  // Table Session Actions
  setTableSession: (token: string, tableId: number, tableCode: string, floorName?: string) => void;
  clearTableSession: () => void;

  addItem: (item: Omit<OrderItem, 'unit_price' | 'name'> & { unit_price: number; name?: string }) => void;
  setItems: (items: OrderItem[]) => void;
  updateQty: (menu_item_id: number, quantity: number) => void;
  removeItem: (menu_item_id: number) => void;
  clear: () => void;
  recalc: () => void;
}

function calcSubtotal(items: OrderItem[]) {
  return items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
}

// AUDIT FIX: Safe defaults used only as placeholders until the API responds.
// These match the backend Setting fallback defaults in OrderCalculationService.
const DEFAULT_TAX_RATE = 0.10;   // 10% — must match backend default
const DEFAULT_DELIVERY_FEE = 2.50; // $2.50 — must match backend default

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      mode: 'delivery',
      items: [],
      location_id: undefined,
      locationName: undefined,
      selectedAddress: null,
      orderNow: true,
      timeSlot: null,
      notes: '',

      // Table Session Initial State
      tableSessionToken: undefined,
      tableId: undefined,
      tableCode: undefined,
      floorName: undefined,
      isTableOrder: false,

      subtotal: 0,
      deliveryFee: 0,
      tax: 0,
      total: 0,

      // AUDIT FIX: Live pricing — defaults until first API fetch
      _taxRate: DEFAULT_TAX_RATE,
      _deliveryFee: DEFAULT_DELIVERY_FEE,

      setMode: (mode) => {
        set({ mode });
        get().recalc();
      },

      setLocation: (location_id, locationName) => {
        set({ location_id, locationName });
        get().recalc();
      },

      setAddress: (addr) => {
        set({ selectedAddress: addr ?? null, addressId: addr?.id });
        get().recalc();
      },

      setOrderNow: (value) => set({ orderNow: value, timeSlot: value ? null : get().timeSlot }),
      setTimeSlot: (slot) => set({ timeSlot: slot ?? null, orderNow: slot ? false : get().orderNow }),
      setNotes: (notes) => set({ notes: notes ?? '' }),

      // AUDIT FIX: Update live pricing from API and immediately recalculate
      setPricing: (taxRate, deliveryFee) => {
        set({ _taxRate: taxRate, _deliveryFee: deliveryFee });
        get().recalc();
      },

      setTableSession: (token, tableId, tableCode, floorName) => {
        set({
          tableSessionToken: token,
          tableId,
          tableCode,
          floorName,
          isTableOrder: true,
          mode: 'dine-in',
          orderNow: true,
          timeSlot: null,
        });
        get().recalc();
      },

      clearTableSession: () => {
        set({
          tableSessionToken: undefined,
          tableId: undefined,
          tableCode: undefined,
          floorName: undefined,
          isTableOrder: false,
        });
      },

      addItem: (item) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.menu_item_id === item.menu_item_id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
        } else {
          items.push({ ...item });
        }
        set({ items });
        get().recalc();
      },

      setItems: (items) => {
        set({ items });
        get().recalc();
      },

      updateQty: (menu_item_id, quantity) => {
        const items = get().items.map((i) => (i.menu_item_id === menu_item_id ? { ...i, quantity } : i));
        set({ items });
        get().recalc();
      },

      removeItem: (menu_item_id) => {
        const items = get().items.filter((i) => i.menu_item_id !== menu_item_id);
        set({ items });
        get().recalc();
      },

      clear: () => set({ items: [], notes: '', timeSlot: null, orderNow: true }),

      recalc: () => {
        const { items, mode, _taxRate, _deliveryFee } = get();
        const subtotal = calcSubtotal(items);

        // AUDIT FIX: Use live _deliveryFee from API (set via setPricing / useLocationSettings).
        // Delivery is free when cart is empty or mode is not delivery.
        const deliveryFee = mode === 'delivery' && subtotal > 0 ? _deliveryFee : 0;

        // AUDIT FIX: Use live _taxRate from API (set via setPricing / useLocationSettings).
        const tax = +(subtotal * _taxRate).toFixed(2);

        const total = +(subtotal + tax + deliveryFee).toFixed(2);
        set({ subtotal, tax, deliveryFee, total });
      },
    }),
    {
      name: 'cart-storage-v2',
      storage: createJSONStorage(() => localStorage),
      // Don't persist internal pricing state — always fetch fresh from API on load
      partialize: (state) => ({
        ...state,
        _taxRate: DEFAULT_TAX_RATE,
        _deliveryFee: DEFAULT_DELIVERY_FEE,
      }),
    }
  )
);
