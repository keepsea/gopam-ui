import React, { createContext, useContext, useState } from 'react';
// 修复1: 使用 import type 导入类型
import type { UserRole } from '../types';

interface AuthState {
    token: string | null;
    username: string | null;
    role: UserRole | null;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    login: (token: string, username: string, role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // 修复2: 移除了未使用的 useEffect
    const [auth, setAuth] = useState<AuthState>({
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role') as UserRole,
        isAuthenticated: !!localStorage.getItem('token'),
    });

    const login = (token: string, username: string, role: UserRole) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);
        setAuth({ token, username, role, isAuthenticated: true });
    };

    const logout = () => {
        localStorage.clear();
        setAuth({ token: null, username: null, role: null, isAuthenticated: false });
    };

    return (
        <AuthContext.Provider value={{ ...auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}