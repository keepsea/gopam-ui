import React, { useState } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { RefreshCw, Key } from 'lucide-react';
import type { Device } from '../../types';

interface Props {
    device: Device | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResetModal({ device, isOpen, onClose, onSuccess }: Props) {
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = async () => {
        if (!device || !newPassword) return;
        try {
            await api.resetDevice(device.ID, { new_password: newPassword });
            alert('密码已轮转，设备状态已重置为 SAFE');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert('操作失败: ' + err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="密码轮转 (回收)">
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 mb-6 rounded-r-lg">
                <h4 className="text-orange-800 font-bold text-sm mb-1 flex items-center gap-2">
                    <RefreshCw size={14} /> 操作确认
                </h4>
                <p className="text-orange-700 text-xs">
                    请确认您已登录设备 <strong>{device?.IP}</strong> 并手动修改了 root 密码。此操作会将设备状态重置为“在库安全”。
                </p>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <div className="relative">
                    <input
                        type="text"
                        className="w-full border p-3 pr-10 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                        placeholder="输入设备上设定的新密码..."
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                    <Key className="absolute right-3 top-3 text-gray-400" size={18} />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                <button onClick={handleSubmit} disabled={!newPassword} className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg shadow disabled:opacity-50">
                    确认回收
                </button>
            </div>
        </Modal>
    );
}