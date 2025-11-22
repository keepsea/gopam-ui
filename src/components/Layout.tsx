import React from 'react';
import { Shield, LogOut, User, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { username, role, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* 顶部导航栏 */}
            <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Shield size={24} className="text-blue-400" />
                        <h1 className="font-bold text-xl tracking-tight">密码金库管理系统</h1>
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">V1.0</span>
                    </div>

                    {/* 用户信息 & 退出 */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                            {role === 'ADMIN' ? (
                                <UserCog size={16} className="text-yellow-400" />
                            ) : (
                                <User size={16} className="text-blue-400" />
                            )}
                            <span className="font-medium">{username}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-xs font-mono text-slate-300">{role}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
                            title="退出登录"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* 主要内容区域 */}
            <main className="max-w-7xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
}