import React, { useState } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
    const [form, setForm] = useState({ old: '', new: '', confirm: '' });

    const handleSubmit = async () => {
        if (form.new !== form.confirm) {
            alert("两次新密码输入不一致");
            return;
        }
        try {
            await api.updateSelfPwd(form.old, form.new);
            alert("密码修改成功");
            onClose();
            setForm({ old: '', new: '', confirm: '' });
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="修改登录密码" maxWidth="max-w-sm">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-1">当前旧密码</label>
                    <input type="password" className="w-full border p-2 rounded" value={form.old} onChange={e => setForm({ ...form, old: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-1">新密码</label>
                    <input type="password" className="w-full border p-2 rounded" value={form.new} onChange={e => setForm({ ...form, new: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-1">确认新密码</label>
                    <input type="password" className="w-full border p-2 rounded" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600">取消</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">确认修改</button>
                </div>
            </div>
        </Modal>
    );
}