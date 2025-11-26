import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderItem, OrderMode, CustomerAddress, TimeSlot } from '@/app/types/domain';

interface CartState {
  mode: OrderMode; // 'delivery' | 'pickup'
  items: OrderItem[];
  location_id?: number;
  locationName?: string;
  addressId?: number; // for delivery
  selectedAddress?: CustomerAddress | null;
  timeSlot?: TimeSlot | null;
  notes?: string;

  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;

  setMode: (mode: OrderMode) => void;
  setLocation: (location_id: number, locationName?: string) => void;
  setAddress: (address?: CustomerAddress | null) => void;
  setTimeSlot: (slot?: TimeSlot | null) => void;
  setNotes: (notes?: string) => void;

  addItem: (item: Omit<OrderItem, 'unit_price' | 'name'> & { unit_price: number; name?: string }) => void;
  updateQty: (menu_item_id: number, quantity: number) => void;
  removeItem: (menu_item_id: number) => void;
  clear: () => void;
  recalc: () => void;
}

function calcSubtotal(items: OrderItem[]) {
  return items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      mode: 'delivery',
      items: [],
      location_id: undefined,
      locationName: undefined,
      selectedAddress: null,
      timeSlot: null,
      notes: '',

      subtotal: 0,
      deliveryFee: 0,
      tax: 0,
      total: 0,

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

      setTimeSlot: (slot) => set({ timeSlot: slot ?? null }),
      setNotes: (notes) => set({ notes: notes ?? '' }),

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

      clear: () => set({ items: [], notes: '', timeSlot: null }),

      recalc: () => {
        const items = get().items;
        const subtotal = calcSubtotal(items);

        // Delivery fee logic - can be enhanced to fetch from location settings
        const deliveryFee = get().mode === 'delivery' ? (subtotal > 0 ? 2.5 : 0) : 0;

        // Tax calculation - 10% placeholder (should come from location settings)
        const tax = +(subtotal * 0.1).toFixed(2);

        const total = +(subtotal + tax + deliveryFee).toFixed(2);
        set({ subtotal, tax, deliveryFee, total });
      },
    }),
    {
      name: 'cart-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

