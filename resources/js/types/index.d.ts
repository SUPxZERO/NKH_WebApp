export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    avatar?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};

// Assuming User type from Laravel Inertia default isn't fully exported with custom fields:
// We extend the base User type if needed or declare it if it was globally defined.
// To be safe and fix errors:
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string;
    is_active?: boolean;
    latitude?: string;
    longitude?: string;
    roles?: any[];
}

export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    status: 'success' | 'error';
    [key: string]: any;
}

export interface CustomerAddress {
    id: number;
    customer_id: number;
    label?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    province?: string;
    postal_code: string;
    country: string;
    is_default: boolean;
    latitude?: string;
    longitude?: string;
    delivery_instructions?: string;
}

export interface ExpenseCategory {
    id: number;
    name: string;
    description: string;
}

export interface Employee {
    id: number;
    user_id: number;
    position_id: number;
    first_name: string;
    last_name: string;
    employee_code?: string;
    phone?: string;
    hire_date?: string;
    salary_type?: string;
    salary?: number;
    address?: string;
    location_id?: number;
    status?: string;
    position?: Position;
    user?: User;
}

export interface Position {
    id: number;
    title: string;
}

export interface TimeSlot {
    id: number | string;
    label: string;
    date?: string;
    time?: string;
    type?: string;
    slot_date?: string;
    slot_start_time?: string;
    slot_type?: string;
    available?: boolean;
    start?: string;
    end?: string;
}

export interface Expense {
    id: number;
    amount: number;
    description: string;
    expense_category_id: number;
    expense_date?: string;
    vendor_name?: string;
    reference?: string;
    status?: string;
}

export interface Reservation {
    id: number;
    customer_id?: number;
    table_id?: number;
    party_size: number;
    reservation_time: string;
    reserved_for?: string;
    guest_count?: number;
    duration_minutes?: number;
    notes?: string;
    status: string;
    special_requests?: string;
    customer?: Customer;
    table?: DiningTable;
}

export interface Promotion {
    id: number;
    name?: string;
    code: string;
    description: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    type?: string;
    usage_limit?: number;
    usage_count?: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    applicable_to?: string;
    terms_conditions?: string;
    created_at?: string;
}

export type OrderMode = 'dine_in' | 'takeout' | 'delivery' | 'pickup' | 'dine-in';

export interface OrderWithDetails extends Order {
    mode?: OrderMode;
}

export interface Location {
    id: number;
    code: string;
    name: string;
    address: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    latitude?: string;
    longitude?: string;
    is_active: boolean;
    accepts_online_orders: boolean;
    accepts_pickup: boolean;
    accepts_delivery: boolean;
    operating_hours?: any;
    created_at?: string;
    updated_at?: string;
}

export interface Customer {
    id: number;
    user?: User;
    customer_code?: string;
    preferred_location_id?: number;
    preferred_location?: { id: number; name: string };
    birth_date?: string;
    gender?: string;
    preferred_language: string;
    marketing_consent: boolean;
    preferences?: any;
    points_balance?: number;
    loyalty_points?: number;
    total_spent?: number;
    customer_tier?: string;
    notes?: string;
}

export interface Category {
    id: number;
    parent_id?: number;
    name: string;
    slug: string;
    description?: string;
    image_path?: string;
    is_active: boolean;
    display_order: number;
    children?: Category[];
    translations?: any[];
    menu_items_count?: number;
}

export interface MenuItem {
    id: number;
    location_id?: number;
    category_id?: number;
    category?: Category;
    name: string;
    sku?: string;
    slug: string;
    description?: string;
    price: number;
    cost?: number;
    original_price?: number;
    image_path?: string;
    is_popular: boolean;
    is_featured: boolean;
    featured_order: number;
    badge?: string;
    is_active: boolean;
    display_order: number;
    rating?: number;
    reviews_count: number;
    prep_time?: number;
    cook_time?: number;
    total_time?: string;
    calories?: number;
    nutrition?: any;
    ingredients?: any[];
    allergens?: any[];
    dietary_tags?: any[];
    dietary_restrictions?: any[];
    recipe?: any;
    serving_size?: string;
    spice_level: number;
    availability_status: string;
    availability_note?: string;
    is_available: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface OrderItem {
    id?: number;
    order_id?: number;
    menu_item_id: number;
    menu_item?: MenuItem;
    name?: string;
    image_path?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_amount?: number;
    total_price?: number;
    total?: number;
    special_instructions?: string;
    notes?: string;
    status?: string;
}

export interface Floor {
    id: number;
    location_id: number;
    name: string;
    level: number;
    is_active: boolean;
    display_order?: number;
    location?: Location;
    tables?: DiningTable[];
}

export interface DiningTable {
    id: number;
    floor_id: number;
    floor?: Floor;
    code: string;
    number: string; // alias
    capacity: number;
    status: string;
    created_at?: string;
    updated_at?: string;
}

export interface Order {
    id: number;
    location_id: number;
    table_id?: number;
    customer_id?: number;
    employee_id?: number;
    order_number: string;
    order_type: string;
    status: string;
    payment_status: string;
    subtotal: number;
    tax_amount: number;
    tax_total: number; // alias
    discount_amount: number;
    discount_total: number; // alias
    service_charge: number;
    delivery_fee?: number;
    total_amount: number;
    total: number; // alias
    currency: string;
    ordered_at?: string;
    scheduled_at?: string;
    completed_at?: string;
    approved_at?: string;
    rejected_at?: string;
    created_at?: string;
    special_instructions?: string;
    rejection_reason?: string;
    table?: DiningTable;
    customer?: Customer;
    location?: Location;
    items?: OrderItem[];
    invoice?: Invoice;
    time_slot?: {
        id: number;
        label: string;
        date: string;
        time: string;
        type: string;
    };
    delivery_latitude?: string;
    delivery_longitude?: string;
    has_coordinates?: boolean;
    customer_phone?: string;
    delivery_address?: string;
    mode?: OrderMode;
}

export interface Payment {
    id: number;
    amount: number;
    currency: string;
    status: string;
    paid_at?: string;
    reference?: string;
}

export interface Invoice {
    id: number;
    order_id: number;
    location_id: number;
    invoice_number: string;
    subtotal: number;
    tax_total: number;
    tax_amount: number;
    discount_total: number;
    discount_amount: number;
    service_charge: number;
    total: number;
    total_amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    issued_at?: string;
    created_at?: string;
    updated_at?: string;
    status: string;
    paid_at?: string;
    location?: { id: number; name: string };
    order?: any; // Avoiding circular dependency hell for now
    payments?: Payment[];
}
