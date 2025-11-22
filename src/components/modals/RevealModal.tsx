import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { AlertTriangle, Key, Eye, Copy } from 'lucide-react';

interface Props {
    requestId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function RevealModal({ requestId, isOpen, onClose }: Props) {
    const [password, setPassword] = useState('');
    const [revealed, setRevealed] = useState(false);

    const fetchPassword = async () => {
        if (!requestId) return;
        try {
            const data = await api.revealPassword(requestId);
            setPassword(data.password);
            setRevealed(true);
        } catch (err: any) {
            alert(err.message);
            onClose();
        }
    };

    // 每次打开时重置状态
    useEffect(() => {
        if (isOpen) {
            setRevealed(false);
            setPassword('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="账号凭证" maxWidth="max-w-lg">
            <div className="relative overflow-hidden">
                {/* 背景水印 */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center rotate-[-12deg]">
                    <span className="text-8xl font-bold">CONFIDENTIAL</span>
                </div>

                <div className="relative z-10 text-center">
                    <div className="bg-slate-900 rounded-xl p-8 mb-6 relative group overflow-hidden">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Root Password</div>

                        {revealed ? (
                            <div className="font-mono text-4xl text-green-400 tracking-wider select-all selection:bg-green-900 break-all">
                                {password}
                            </div>
                        ) : (
                            <div className="font-mono text-4xl text-slate-700 tracking-widest blur-md select-none">
                                •H8&kL#9x
                            </div>
                        )}

                        {/* 遮罩层按钮 */}
                        {!revealed && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                                <button
                                    onClick={fetchPassword}
                                    className="bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-all shadow-xl"
                                >
                                    <Eye size={18} /> 点击解密查看
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg mb-6 flex gap-3 text-left">
                        <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-orange-800 leading-relaxed">
                            <strong>安全警告：</strong> 此操作已被系统审计记录。严禁通过即时通讯工具（微信/钉钉）传输明文密码。使用完毕后请立即在系统中归还。
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button onClick={onClose} className="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">关闭窗口</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}