import React, { useState } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { Shield } from 'lucide-react';
import type { Device } from '../../types';

interface Props {
    device: Device | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RequestModal({ device, isOpen, onClose, onSuccess }: Props) {
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('2h');

    const handleSubmit = async () => {
        if (!device) return;
        try {
            await api.createRequest({ device_id: device.ID, reason, duration });
            alert('申请已提交，请等待管理员审批');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="申请借用设备">
            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start gap-3 border border-blue-100">
                <Shield className="text-blue-600 mt-0.5 shrink-0" size={20} />
                <div>
                    <div className="font-bold text-blue-900">{device?.Name}</div>
                    <div className="text-blue-700 text-xs font-mono mt-1">{device?.IP}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">申请理由 / 工单号</label>
                    <textarea
                        className="mt-1 w-full border p-3 rounded-lg bg-gray-50 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="例如: 故障排查 FW-20231020"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">预计时长</label>
                    <select className="mt-1 w-full border p-2.5 rounded-lg bg-gray-50" value={duration} onChange={e => setDuration(e.target.value)}>
                        <option>1h</option><option>2h</option><option>4h</option><option>24h</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                    <button onClick={handleSubmit} disabled={!reason} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow disabled:opacity-50">提交申请</button>
                </div>
            </div>
        </Modal>
    );
}