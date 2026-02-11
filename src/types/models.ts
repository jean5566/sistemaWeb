
// Basic Entities
export interface User {
    id: number | string;
    email: string;
    name?: string;
    role?: string;
    token?: string; // Sometimes returned with user
    permissions?: string[];
}

export interface Category {
    id: string | number;
    name: string;
}

export interface Customer {
    id: string | number;
    name: string;
    document_id: string; // Unified from cedula/docId
    email?: string;
    phone?: string;
    address?: string;
    created_at?: string;
    // Legacy support (optional, should be phased out)
    cedula?: string;
    docId?: string;
}

export interface Product {
    id: number | string;
    name: string;
    price: number;
    category: string;
    stock: number;
    min_stock: number;
    code?: string;
    image?: string;
    category_id?: string | number;
    created_at?: string;
}

export interface ProductBase {
    name: string;
    price: number;
    category: string;
    category_id?: string | number;
    stock: number;
    min_stock?: number;
    code?: string;
}

// Sales / Transactions
export interface SaleItem {
    name?: string;
    product_id: string | number;
    quantity: number;
    price: number;
    unit_price?: number;
    subtotal?: number;
}

export interface SaleTransaction {
    customer_id?: string | number;
    total: number;
    payment_method: string;
    document_type: string;
    items: SaleItem[];
    date?: string;
}

export interface Sale {
    id: number | string;
    total: number;
    date: string;
    created_at?: string;
    customer_name?: string;
    customer_id?: number | string;
    items?: SaleItem[];
    payment_method?: string;
    document_type?: string;
    customers?: Customer; // For the joined data
}

// API Responses
export interface ApiResponse<T = any> {
    success?: boolean;
    data?: T; // Some APIs return { data: ... }
    error?: string;
    message?: string;
    // User login response specific
    user?: User;
    token?: string;
    id?: string | number; // Create response often returns just ID
}
