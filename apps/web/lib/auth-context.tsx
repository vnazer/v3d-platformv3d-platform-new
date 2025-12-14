'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api';

interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    organization: {
        id: string;
        name: string;
        slug: string;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        organizationName: string;
    }) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await apiClient.getCurrentUser();
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch current user:', error);
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await apiClient.login(email, password);
        const { user, tokens } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        setUser(user);
    };

    const register = async (data: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        organizationName: string;
    }) => {
        const response = await apiClient.register(data);
        const { user, tokens } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        setUser(user);
    };

    const logout = () => {
        apiClient.logout().catch(console.error);
        localStorage.clear();
        setUser(null);
        window.location.href = '/auth/login';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
