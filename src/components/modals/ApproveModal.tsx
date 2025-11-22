import React, { useState } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { Lock } from 'lucide-react';
import type { RequestItem } from '../../types';

interface Props {
    request: RequestItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ApproveModal({ request, isOpen, onClose, onSuccess }: Props) {
    const [totpCode, setTotpCode] = useState('');

    const handleSubmit = async () => {
        if (!request) return;
        try {
            await api.approveRequest(request.ID, totpCode);
            alert('审批通过');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert('验证失败: ' + err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="安全审批确认" maxWidth="max-w-sm">
            <div className="text-center">
                <div className="mx-auto bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-purple-600" size={28} />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-left text-sm mb-6 border border-gray-100">
                    <div className="flex justify-between mb-1"><span className="text-gray-500">申请人:</span> <span className="font-medium">{request?.User.Username}</span></div>
                    <div className="flex justify-between mb-1"><span className="text-gray-500">设备:</span> <span className="font-medium">{request?.Device.Name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">理由:</span> <span className="font-medium text-gray-800">{request?.Reason}</span></div>
                </div>

                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Authenticator Code (MFA)</label>
                <input
                    type="text"
                    maxLength={6}
                    className="w-full border-b-2 border-purple-200 text-center text-3xl font-mono focus:border-purple-600 outline-none py-2 bg-transparent mb-8 tracking-[0.5em] text-gray-800 placeholder:tracking-normal"
                    placeholder="000000"
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-100">验证并批准</button>
                </div>
            </div>
        </Modal>
    );
}