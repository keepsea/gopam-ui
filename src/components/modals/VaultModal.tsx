import React, { useState } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { Database, Lock, Unlock } from 'lucide-react';

interface Props {
    mode: 'SETUP' | 'UNLOCK';
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function VaultModal({ mode, isOpen, onClose, onSuccess }: Props) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const handleSubmit = async () => {
        if (!password) return;
        if (mode === 'SETUP' && password !== confirm) {
            alert('两次输入的口令不一致');
            return;
        }

        try {
            if (mode === 'SETUP') {
                await api.setupVault(password);
                alert('金库初始化成功，已自动解锁。请务必牢记此口令！');
            } else {
                await api.unlockVault(password);
                // 不提示，直接成功，体验更流畅
            }
            setPassword('');
            setConfirm('');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert('操作失败: ' + err.message);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'SETUP' ? '初始化安全金库' : '解锁金库'}
            maxWidth="max-w-md"
        >
            <div className="text-center mb-6">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${mode === 'SETUP' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    {mode === 'SETUP' ? <Database size={32} /> : <Lock size={32} />}
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                    {mode === 'SETUP' ? '设置主口令' : '请输入金库口令'}
                </h3>
                <p className="text-sm text-gray-500 mt-2 px-4">
                    {mode === 'SETUP'
                        ? '这是加密所有核心数据的唯一密钥。若丢失此口令，所有加密数据将永久无法恢复！'
                        : '系统核心数据处于加密锁定状态，请输入口令以临时解锁内存。'
                    }
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <input
                        type="password"
                        className="w-full border p-3 rounded-lg text-center text-lg tracking-wider focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={mode === 'SETUP' ? "设置高强度口令" : "输入口令"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoFocus
                    />
                </div>

                {mode === 'SETUP' && (
                    <div>
                        <input
                            type="password"
                            className="w-full border p-3 rounded-lg text-center text-lg tracking-wider focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="再次确认口令"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 text-gray-600 border rounded-lg hover:bg-gray-50">取消</button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-1 py-2.5 text-white rounded-lg shadow transition-colors flex items-center justify-center gap-2 ${mode === 'SETUP' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        {mode === 'SETUP' ? <Database size={18} /> : <Unlock size={18} />}
                        {mode === 'SETUP' ? '初始化' : '解锁'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}