import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { User, Plus, ShieldAlert, Edit2, Trash2, KeyRound, Save, ShieldOff } from 'lucide-react';
import type { DeviceGroup } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface UserItem {
    ID: number;
    Username: string;
    Role: string;
    RealName: string;
    ContactInfo: string;
    TOTPSecret: string; // [修复] 修正为 TOTPSecret 以匹配后端 Go 结构体的 JSON 输出
    ManagedGroupID?: number;
    CreatedAt: string;
}

export default function UserManagementModal({ isOpen, onClose }: Props) {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [groups, setGroups] = useState<DeviceGroup[]>([]);
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');

    // Edit/Create Form
    const [formData, setFormData] = useState({
        id: 0,
        username: '', password: '', role: 'USER',
        real_name: '', contact_info: '',
        managed_group_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            api.getGroups().then(setGroups);
        }
    }, [isOpen]);

    const loadUsers = () => api.getUsers().then(setUsers);

    // 打开编辑
    const openEdit = (u: UserItem) => {
        setFormData({
            id: u.ID,
            username: u.Username,
            password: '', // 编辑时不显示密码
            role: u.Role,
            real_name: u.RealName,
            contact_info: u.ContactInfo,
            managed_group_id: u.ManagedGroupID ? String(u.ManagedGroupID) : ''
        });
        setView('EDIT');
    };

    // 提交保存 (Create or Update)
    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                managed_group_id: formData.managed_group_id ? Number(formData.managed_group_id) : null
            };

            if (view === 'CREATE') {
                await api.createUser(payload);
                alert('用户创建成功');
            } else {
                // Update Logic
                await api.updateUser(formData.id, payload);
                alert('用户信息更新成功');
            }
            setView('LIST');
            loadUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定要删除该用户吗？此操作不可恢复。")) return;
        try {
            await api.deleteUser(id);
            loadUsers();
        } catch (err: any) { alert(err.message); }
    };

    const handleResetPwd = async (id: number) => {
        const newPwd = prompt("请输入该用户的新密码:");
        if (!newPwd) return;
        try {
            await api.adminResetPwd(id, newPwd);
            alert("密码重置成功");
        } catch (err: any) { alert(err.message); }
    };

    // 重置 MFA 处理函数
    const handleResetMFA = async (id: number) => {
        if (!confirm("确定要重置该用户的 MFA 吗？用户下次登录时将不再需要动态码，需重新绑定。")) return;
        try {
            await api.adminResetMFA(id);
            alert("MFA 重置成功");
            loadUsers(); // 刷新列表状态
        } catch (err: any) { alert(err.message); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="用户与权限管理 (超级管理员)" maxWidth="max-w-5xl">
            {view === 'LIST' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500">仅超级管理员可操作</div>
                        <button onClick={() => {
                            setFormData({ id: 0, username: '', password: '', role: 'USER', real_name: '', contact_info: '', managed_group_id: '' });
                            setView('CREATE');
                        }} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                            <Plus size={14} /> 新增用户
                        </button>
                    </div>
                    <div className="overflow-y-auto max-h-96 border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="p-3">账号</th>
                                    <th className="p-3">姓名/联系方式</th>
                                    <th className="p-3">角色</th>
                                    <th className="p-3">MFA状态</th>
                                    <th className="p-3">管辖组</th>
                                    <th className="p-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.map(u => (
                                    <tr key={u.ID} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{u.Username}</td>
                                        <td className="p-3">
                                            <div className="font-medium text-gray-900">{u.RealName || '-'}</div>
                                            <div className="text-xs text-gray-500">{u.ContactInfo}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold
                        ${u.Role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                                                    u.Role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {u.Role}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {/* [修复] 使用 TOTPSecret */}
                                            {u.TOTPSecret === 'BOUND' ?
                                                <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded border border-green-200">已启用</span> :
                                                <span className="text-gray-400 text-xs">未绑定</span>
                                            }
                                        </td>
                                        <td className="p-3 text-gray-500">{u.ManagedGroupID ? `Group #${u.ManagedGroupID}` : '-'}</td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <button onClick={() => openEdit(u)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="编辑"><Edit2 size={14} /></button>
                                            <button onClick={() => handleResetPwd(u.ID)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="重置密码"><KeyRound size={14} /></button>

                                            {/* [修复] 使用 TOTPSecret */}
                                            {u.TOTPSecret === 'BOUND' && (
                                                <button onClick={() => handleResetMFA(u.ID)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="重置 MFA (解绑)"><ShieldOff size={14} /></button>
                                            )}

                                            <button onClick={() => handleDelete(u.ID)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="删除"><Trash2 size={14} /></button>
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
                        {view === 'CREATE' ? '创建新账号' : '编辑账号信息'}
                    </h4>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">登录用户名 {view === 'EDIT' && '(不可修改)'}</label>
                                <input
                                    className="w-full border p-2 rounded bg-gray-50 disabled:opacity-60"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={view === 'EDIT'}
                                />
                            </div>
                            {view === 'CREATE' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">初始密码 *</label>
                                    <input className="w-full border p-2 rounded bg-gray-50" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">使用人真实姓名</label>
                                <input className="w-full border p-2 rounded" value={formData.real_name} onChange={e => setFormData({ ...formData, real_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">联系方式</label>
                                <input className="w-full border p-2 rounded" value={formData.contact_info} onChange={e => setFormData({ ...formData, contact_info: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-blue-800 mb-1">系统角色</label>
                                <select className="w-full border border-blue-200 p-2 rounded" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="USER">普通运维 (USER)</option>
                                    <option value="ADMIN">组管理员 (ADMIN)</option>
                                    <option value="SUPER_ADMIN">超级管理员 (SUPER_ADMIN)</option>
                                </select>
                            </div>
                            {formData.role === 'ADMIN' && (
                                <div>
                                    <label className="block text-sm font-bold text-blue-800 mb-1">管辖设备组</label>
                                    <select className="w-full border border-blue-200 p-2 rounded" value={formData.managed_group_id} onChange={e => setFormData({ ...formData, managed_group_id: e.target.value })}>
                                        <option value="">无 (需选择)</option>
                                        {groups.map(g => <option key={g.ID} value={g.ID}>{g.Name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button onClick={() => setView('LIST')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">返回</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow flex items-center gap-2">
                            <Save size={16} /> 保存提交
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}