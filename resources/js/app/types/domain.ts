// Base domain types shared across Admin, Employee, and Customer UIs

export interface Category {
  id: number;
  location_id?: number | null;
  parent_id?: number | null;
  parent?: Category | null;
  children?: Category[];
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Relations
  menu_items?: MenuItem[];
  location?: Location;
  translations?: CategoryTranslation[];
}

export interface CategoryTranslation {
  id: number;
  category_id: number;
  locale: string;
  name: string;
  description?: string | null;
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

export interface MenuItemTranslation {
  id: number;
  menu_item_id: number;
  locale: string;
  name: string;
  description?: string | null;
}

export interface MenuItem {
  id: number;
  location_id: number;
  category_id?: number | null;
  sku?: string | null;
  slug: string;
  name?: string; // For display purposes, can be derived from translations
  description?: string | null;
  price: number;
  cost?: number | null;
  original_price?: number | null; // For showing discounts
  image_path?: string | null;
  image_url?: string | null; // Alias for image_path for compatibility
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  rating?: number | null; // Average rating
  prep_time?: number | null; // Preparation time in minutes
  ingredients?: string[]; // List of ingredients
  dietary_restrictions?: string[]; // e.g., ["vegetarian", "gluten-free"]
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  translations?: MenuItemTranslation[];
  category?: Category;
  location?: Location;
  options?: MenuItemOption[];
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  label: string; // e.g. "Home", "Office"
  address_line_1: string;
  address_line_2?: string | null;
  line1: string; // Alias for address_line_1 for compatibility
  city: string;
  province: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  delivery_instructions?: string | null;
  created_at: string;
  updated_at: string;
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
  name?: string; // Optional since it can be derived from menu item
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
  mode: 'dine-in' | 'pickup' | 'delivery'; // Alias for type for frontend compatibility
  preparation_status: 'pending' | 'preparing' | 'ready' | 'served';
  priority: number;
  status: 'pending' | 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'delivered';
  subtotal: number;
  tax_total: number;
  discount_total: number;
  service_charge: number;
  total: number;
  currency: string;
  placed_at?: string | null;
  closed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_type: 'dine-in' | 'pickup' | 'delivery';
  customer_address_id?: number | null;
  delivery_address?: string | null; // For display purposes
  payment_status: 'unpaid' | 'paid' | 'refunded';
  scheduled_at?: string | null;
  kitchen_submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  customer?: Customer;
  employee?: Employee;
  location?: Location;
  table?: DiningTable;
  items?: OrderItem[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
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
  position_id?: number | null;
  employee_code: string;
  hire_date?: string | null;
  salary_type: 'hourly' | 'monthly';
  salary?: number | null;
  phone?: string | null;
  address?: string | null;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  user: User;
  position?: Position;
  location?: Location;
}

export interface Customer {
  id: number;
  user_id: number;
  preferred_location_id?: number | null;
  birth_date?: string | null;
  gender?: string | null;
  preferences?: any | null;
  points_balance: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user: User;
  preferred_location?: Location;
  addresses?: CustomerAddress[];
}

export interface DiningTable {
  id: number;
  floor_id: number;
  code: string;
  number: string; // Alias for code for compatibility
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'unavailable';
  created_at: string;
  updated_at: string;
  floor?: Floor;
}

export interface Floor {
  id: number;
  location_id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: Location;
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
  title: string; // Alias for name for compatibility
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
  issued_at?: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  location?: Location;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at?: string | null; // ISO
  reference?: string | null;
}

export interface ExpenseCategory {
  id: number;
  location_id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: Location;
}

export interface Expense {
  id: number;
  location_id: number;
  expense_category_id: number;
  created_by?: number | null;
  expense_date: string;
  amount: number;
  currency: string;
  vendor_name?: string | null;
  reference?: string | null;
  description?: string | null;
  attachment_path?: string | null;
  status: 'draft' | 'approved' | 'paid' | 'voided';
  created_at: string;
  updated_at: string;
  location?: Location;
  expense_category?: ExpenseCategory;
  created_by_user?: User;
}

export interface Reservation {
  id: number;
  location_id: number;
  table_id: number;
  customer_id: number;
  code: string;
  reserved_for: string; // datetime
  duration_minutes: number;
  guest_count: number;
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'completed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  location?: Location;
  table?: DiningTable;
  customer?: Customer;
}

export interface Ingredient {
  id: number;
  location_id: number;
  sku?: string | null;
  name: string;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity?: number | null;
  cost?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  location?: Location;
}

export interface InventoryTransaction {
  id: number;
  location_id: number;
  ingredient_id: number;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  unit_cost?: number | null;
  value?: number | null;
  sourceable_type?: string | null;
  sourceable_id?: number | null;
  notes?: string | null;
  transacted_at: string; // datetime
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  location?: Location;
  ingredient?: Ingredient;
  created_by_user?: User;
}

export interface LoyaltyPoint {
  id: number;
  customer_id: number;
  order_id?: number | null;
  location_id: number;
  type: 'earn' | 'redeem' | 'adjust';
  points: number;
  balance_after: number;
  occurred_at: string; // datetime
  notes?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order?: Order;
  location?: Location;
}

export interface Promotion {
  id: number;
  name: string;
  description?: string | null;
  code?: string | null;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_item';
  discount_value: number;
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  usage_count: number;
  start_date: string; // datetime
  end_date: string; // datetime
  is_active: boolean;
  applicable_to: 'all' | 'categories' | 'items';
  terms_conditions?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_type: 'all' | 'role' | 'user' | 'location';
  recipient_id?: number | null;
  sender_id?: number | null;
  is_read: boolean;
  is_broadcast: boolean;
  scheduled_at?: string | null; // datetime
  expires_at?: string | null; // datetime
  action_url?: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
  sender?: User;
  recipient?: User;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  auditable_type?: string | null;
  auditable_id?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
  user?: User;
}
