import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, ApiResponse } from '../types/models';
import { api } from '../api/http';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<User | undefined>;
    signUp: (email: string, password: string) => Promise<User | undefined>;
    signOut: () => Promise<void>;
    updateUser: (updated: Partial<User>) => void;
    checkSystemInitialization: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('pos_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('pos_user');
            }
        }
        setLoading(false);
    }, []);

    const signIn = async (email: string, password: string): Promise<User | undefined> => {
        try {
            const data = await api.post<ApiResponse>('/login.php', { email, password });

            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('pos_user', JSON.stringify(data.user));
                if (data.token) {
                    localStorage.setItem('pos_token', data.token);
                    // Force a settings reload now that we have a valid token
                    window.dispatchEvent(new Event('auth:login'));
                }
                return data.user;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string): Promise<User | undefined> => {
        try {
            const data = await api.post<ApiResponse>('/register.php', { email, password });

            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('pos_user', JSON.stringify(data.user));
                if (data.token) {
                    localStorage.setItem('pos_token', data.token);
                    window.dispatchEvent(new Event('auth:login'));
                }
                return data.user;
            }
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    };

    const updateUser = (updated: Partial<User>) => {
        setUser(prev => {
            if (!prev) return prev;
            const merged = { ...prev, ...updated };
            localStorage.setItem('pos_user', JSON.stringify(merged));
            return merged;
        });
    };

    const signOut = async () => {
        try {
            await api.post('/logout.php', {});
        } catch (error) {
            // Proceed with local logout even if server revocation fails
            console.error('Server logout failed:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('pos_user');
            localStorage.removeItem('pos_token');
        }
    };

    const checkSystemInitialization = async (): Promise<boolean> => {
        try {
            const data = await api.get<{ initialized: boolean }>('/check_init.php');
            return data.initialized;
        } catch (error) {
            console.error("Error checking initialization:", error);
            return true; // Assume initialized (secure default) on error
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateUser,
        checkSystemInitialization
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
