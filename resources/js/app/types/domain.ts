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
  original_price?: number;
  image_url?: string | null;
  active: boolean;
  popularity?: number;
  rating?: number;
  prep_time?: number; // in minutes
  dietary_restrictions?: string[];
  ingredients?: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
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
  location_id: number;
  table_id?: number | null;
  customer_id?: number | null;
  employee_id?: number | null;
  order_number: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  order_type?: string | null;
  status: 'pending' | 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  subtotal: number;
  tax_total: number;
  discount_total: number;
  service_charge: number;
  total: number;
  currency: string;
  placed_at: string; // ISO
  scheduled_at?: string | null; // ISO
  closed_at?: string | null; // ISO
  notes?: string | null;
  customer_address_id?: number | null;
  items: OrderItem[];
  table?: DiningTable;
  customer?: Customer;
  employee?: Employee;
  invoice?: Invoice;
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

// Additional domain types for complete integration

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  roles: string[];
}

export interface Employee {
  id: number;
  user_id: number;
  location_id: number;
  position_id: number;
  employee_number: string;
  hire_date: string;
  salary?: number | null;
  hourly_rate?: number | null;
  is_active: boolean;
  user: User;
  position?: Position;
  location?: Location;
}

export interface Customer {
  id: number;
  user_id: number;
  loyalty_points: number;
  total_spent: number;
  is_active: boolean;
  user: User;
  addresses?: CustomerAddress[];
}

export interface DiningTable {
  id: number;
  location_id: number;
  floor_id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  x_position?: number | null;
  y_position?: number | null;
}

export interface Floor {
  id: number;
  location_id: number;
  name: string;
  display_order: number;
  tables?: DiningTable[];
}

export interface Location {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
}

export interface Position {
  id: number;
  name: string;
  description?: string | null;
}

export interface Invoice {
  id: number;
  order_id: number;
  location_id: number;
  invoice_number: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  service_charge: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  issued_at: string; // ISO
  status: 'paid' | 'unpaid';
  order?: Order;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at?: string | null; // ISO
  reference?: string | null;
}
