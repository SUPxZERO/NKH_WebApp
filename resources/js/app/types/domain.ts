// Base domain types shared across Admin, Employee, and Customer UIs

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  image_url?: string | null;
  active: boolean;
}

export interface MenuItemOptionChoice {
  id: number;
  label: string;
  price_delta: number; // additional price for this choice
}

export interface MenuItemOption {
  id: number;
  name: string; // e.g. "Size", "Spice Level"
  type: 'single' | 'multiple';
  required?: boolean;
  choices: MenuItemOptionChoice[];
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string | null;
  active: boolean;
  popularity?: number;
  options?: MenuItemOption[];
}

export interface CustomerAddress {
  id: number;
  label: string; // e.g. "Home", "Office"
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
}

export interface TimeSlot {
  id: string; // e.g. ISO string or unique id
  label: string; // e.g. "Today 12:30 - 1:00 PM"
  start: string; // ISO
  end: string; // ISO
  available: boolean;
}

export type OrderMode = 'delivery' | 'pickup' | 'dine-in';

export interface OrderItemCustomization {
  option_id: number;
  choice_ids: number[]; // selected choices
}

export interface OrderItem {
  menu_item_id: number;
  name: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  customizations?: OrderItemCustomization[];
}

export interface Order {
  id: number;
  mode: OrderMode;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee?: number;
  total: number;
  placed_at: string; // ISO
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
