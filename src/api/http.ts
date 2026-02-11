
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

export interface ApiError extends Error {
    status?: number;
    code?: string;
    data?: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('pos_token');

    // Default headers
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    // Remove leading slash if present in endpoint to avoid double slashes with API_URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_URL}/${cleanEndpoint}`;

    try {
        const response = await fetch(url, config);

        let data;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
            // Try to parse text as JSON just in case, or leave as string
            try { data = JSON.parse(data); } catch (e) { /* ignore */ }
        }

        if (!response.ok) {
            const error = new Error(data?.error || data?.message || 'Error en la petición') as ApiError;
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data as T;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

export const api = {
    get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
    // Helper for raw fetch if needed
    fetch: request
};
