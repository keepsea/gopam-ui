import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [showMFA, setShowMFA] = useState(false); // 控制是否显示 MFA 输入框
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // 尝试登录
            const data = await api.login({ username, password, totp_code: totpCode });
            login(data.token, data.username, data.role);
            navigate('/');
        } catch (err: any) {
            // 如果后端返回 MFA_REQUIRED，则显示输入框并中断流程
            if (err.message === 'MFA_REQUIRED') {
                setShowMFA(true);
                setError('请输入安全令牌动态码');
            } else {
                setError(err.message || '登录失败');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transition-all">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-lg">
                        <Shield className="text-white" size={32} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">GoPAM 登录</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!showMFA && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">用户名</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none"
                                    placeholder="账号"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">密码</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none"
                                    placeholder="密码"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* 只有触发 MFA 要求后才显示此块 */}
                    {showMFA && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2 mb-2 text-blue-700 bg-blue-50 p-3 rounded-lg text-sm">
                                <Lock size={16} /> 检测到双因子认证保护，请验证。
                            </div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Google Authenticator Code</label>
                            <input
                                type="text"
                                value={totpCode}
                                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                className="w-full border p-3 rounded text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-purple-500 outline-none border-purple-200"
                                placeholder="000 000"
                                autoFocus
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded hover:bg-slate-800 transition font-medium shadow-lg mt-6">
                        {showMFA ? '验证并登录' : '安全登录'}
                    </button>
                </form>
            </div>
        </div>
    );
}