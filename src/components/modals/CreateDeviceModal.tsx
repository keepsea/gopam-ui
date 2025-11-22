import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import type { DeviceGroup } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateDeviceModal({ isOpen, onClose, onSuccess }: Props) {
    const [groups, setGroups] = useState<DeviceGroup[]>([]);
    const [form, setForm] = useState({
        name: '',
        ip: '',
        protocol: 'SSH',
        group_id: 1,
        initial_password: ''
    });

    // 加载组列表
    useEffect(() => {
        if (isOpen) {
            api.getGroups().then(setGroups).catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!form.name || !form.ip || !form.initial_password) return;
        try {
            await api.createDevice({ ...form, group_id: Number(form.group_id) });
            alert('设备录入成功');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert('录入失败: ' + err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="录入新资产">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">设备名称</label>
                    <input type="text" className="mt-1 w-full border p-2.5 rounded-lg bg-gray-50" placeholder="Core-Switch-01" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">IP 地址</label>
                        <input type="text" className="mt-1 w-full border p-2.5 rounded-lg bg-gray-50" placeholder="192.168.x.x" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">协议</label>
                        <select className="mt-1 w-full border p-2.5 rounded-lg bg-gray-50" value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })}>
                            <option>SSH</option><option>RDP</option><option>HTTPS</option><option>Telnet</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">归属设备组</label>
                    <select className="mt-1 w-full border p-2.5 rounded-lg bg-gray-50" value={form.group_id} onChange={e => setForm({ ...form, group_id: Number(e.target.value) })}>
                        {groups.map(g => <option key={g.ID} value={g.ID}>{g.Name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">初始 Root 密码</label>
                    <input type="text" className="mt-1 w-full border p-2.5 rounded-lg bg-gray-50 font-mono" placeholder="封存后不可见" value={form.initial_password} onChange={e => setForm({ ...form, initial_password: e.target.value })} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow">录入封存</button>
                </div>
            </div>
        </Modal>
    );
}