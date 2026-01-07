import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '@/app/types/domain';

export interface TableCartItem {
    menu_item_id: number;
    name: string;
    unit_price: number;
    quantity: number;
    quantity_unit?: string;
    image_path?: string;
    special_instructions?: string;
}

interface TableSessionState {
    tableId: number | null;
    tableCode: string | null;
    tableName: string | null;
    sessionToken: string | null;

    locationId: number | null;
    cartItems: TableCartItem[];

    setTableInfo: (id: number, code: string, name: string, token: string, locationId: number) => void;
    addItem: (item: TableCartItem) => void;
    updateQuantity: (itemId: number, quantity: number) => void;
    removeItem: (itemId: number) => void;
    clearCart: () => void;

    // Computed
    getTotalPrice: () => number;
    getItemCount: () => number;
}

export const useTableStore = create<TableSessionState>()(
    persist(
        (set, get) => ({
            tableId: null,
            tableCode: null,
            tableName: null,
            sessionToken: null,
            locationId: null,
            cartItems: [],

            setTableInfo: (id, code, name, token, locationId) => set({
                tableId: id,
                tableCode: code,
                tableName: name,
                sessionToken: token,
                locationId: locationId
            }),

            addItem: (newItem) => set((state) => {
                const existingItem = state.cartItems.find(i => i.menu_item_id === newItem.menu_item_id);

                if (existingItem) {
                    // Increment quantity if already exists
                    return {
                        cartItems: state.cartItems.map(i =>
                            i.menu_item_id === newItem.menu_item_id
                                ? { ...i, quantity: i.quantity + newItem.quantity }
                                : i
                        )
                    };
                }

                return { cartItems: [...state.cartItems, newItem] };
            }),

            updateQuantity: (itemId, quantity) => set((state) => ({
                cartItems: state.cartItems.map(i =>
                    i.menu_item_id === itemId ? { ...i, quantity } : i
                ).filter(i => i.quantity > 0)
            })),

            removeItem: (itemId) => set((state) => ({
                cartItems: state.cartItems.filter(i => i.menu_item_id !== itemId)
            })),

            clearCart: () => set({ cartItems: [] }),

            getTotalPrice: () => {
                const { cartItems } = get();
                return cartItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
            },

            getItemCount: () => {
                const { cartItems } = get();
                return cartItems.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'nkh-table-session', // LocalStorage key
            partialize: (state) => ({
                tableId: state.tableId,
                tableCode: state.tableCode,
                tableName: state.tableName,
                sessionToken: state.sessionToken,
                locationId: state.locationId,
                cartItems: state.cartItems,
            }),
        }
    )
);
