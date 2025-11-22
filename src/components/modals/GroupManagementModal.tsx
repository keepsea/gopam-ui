import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { Layers, Plus, Edit2, Trash2, Save } from 'lucide-react';
import type { DeviceGroup } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function GroupManagementModal({ isOpen, onClose }: Props) {
    const [groups, setGroups] = useState<DeviceGroup[]>([]);
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const [formData, setFormData] = useState({ id: 0, name: '', description: '' });

    useEffect(() => {
        if (isOpen) loadGroups();
    }, [isOpen]);

    const loadGroups = () => api.getGroups().then(setGroups);

    const openEdit = (g: DeviceGroup) => {
        setFormData({ id: g.ID, name: g.Name, description: g.Description });
        setView('EDIT');
    };

    const handleSave = async () => {
        try {
            if (view === 'CREATE') {
                await api.createGroup({ name: formData.name, description: formData.description });
                alert('设备组创建成功');
            } else {
                await api.updateGroup(formData.id, { name: formData.name, description: formData.description });
                alert('设备组更新成功');
            }
            setView('LIST');
            loadGroups();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定删除该组吗？如果有设备或管理员关联此组，删除将失败。")) return;
        try {
            await api.deleteGroup(id);
            loadGroups();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="设备组管理 (超级管理员)" maxWidth="max-w-3xl">
            {view === 'LIST' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500">管理系统内的安全域/设备分组</div>
                        <button
                            onClick={() => { setFormData({ id: 0, name: '', description: '' }); setView('CREATE'); }}
                            className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                        >
                            <Plus size={14} /> 新增分组
                        </button>
                    </div>
                    <div className="overflow-y-auto max-h-96 border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">组名称</th>
                                    <th className="p-3">描述</th>
                                    <th className="p-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {groups.map(g => (
                                    <tr key={g.ID} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-400 font-mono">#{g.ID}</td>
                                        <td className="p-3 font-medium">{g.Name}</td>
                                        <td className="p-3 text-gray-500">{g.Description}</td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <button onClick={() => openEdit(g)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="编辑"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(g.ID)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="删除"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 border-b pb-2">
                        {view === 'CREATE' ? '创建新分组' : '编辑分组信息'}
                    </h4>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">组名称</label>
                        <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例如: Network-Zone-B" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">描述</label>
                        <input className="w-full border p-2 rounded" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="例如: 核心交换机区域" />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setView('LIST')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">返回</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow flex items-center gap-2">
                            <Save size={16} /> 保存
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}