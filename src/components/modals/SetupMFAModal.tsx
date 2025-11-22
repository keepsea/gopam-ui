import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { Lock, Check, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SetupMFAModal({ isOpen, onClose }: Props) {
    const [step, setStep] = useState<'LOADING' | 'SCAN' | 'SUCCESS'>('LOADING');
    const [qrImage, setQrImage] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    // 打开弹窗时自动请求生成二维码
    useEffect(() => {
        if (isOpen) {
            setStep('LOADING');
            setQrImage('');
            setSecret('');
            setCode('');
            setError('');

            api.setupMFA().then(data => {
                setQrImage(`data:image/png;base64,${data.qr_image}`);
                setSecret(data.secret);
                setStep('SCAN');
            }).catch(err => {
                setError('无法生成密钥: ' + err.message);
            });
        }
    }, [isOpen]);

    const handleActivate = async () => {
        try {
            await api.activateMFA(secret, code);
            setStep('SUCCESS');
        } catch (err: any) {
            setError(err.message || '验证失败，请检查验证码');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="设置多因素认证 (MFA)" maxWidth="max-w-md">
            {step === 'LOADING' && <div className="text-center py-8 text-gray-500">正在生成安全密钥...</div>}

            {step === 'SCAN' && (
                <div className="space-y-6 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-start gap-2 text-left">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        请使用 Google Authenticator 或 Microsoft Authenticator 扫描下方二维码。
                    </div>

                    {qrImage && (
                        <div className="flex justify-center">
                            <img src={qrImage} alt="MFA QR Code" className="border-4 border-white shadow-lg rounded-lg w-48 h-48" />
                        </div>
                    )}

                    <div className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded select-all">
                        密钥: {secret}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">验证动态码</label>
                        <input
                            type="text"
                            maxLength={6}
                            className="w-40 border p-2 rounded text-center font-mono text-xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="000 000"
                            value={code}
                            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600">取消</button>
                        <button
                            onClick={handleActivate}
                            disabled={code.length !== 6}
                            className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                            验证并绑定
                        </button>
                    </div>
                </div>
            )}

            {step === 'SUCCESS' && (
                <div className="text-center py-8 space-y-4">
                    <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
                        <Check className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">绑定成功!</h3>
                    <p className="text-gray-600">您的账户现在受到 MFA 保护，审批时需要输入动态码。</p>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded">完成</button>
                </div>
            )}
        </Modal>
    );
}