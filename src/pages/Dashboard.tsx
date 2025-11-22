import React, { useEffect, useState } from 'react';
import { Server, Plus, Shield, CheckCircle, Clock, Activity, RefreshCw, Search, History, Settings, Users, Eye, Key, Lock, Layers, Database, Unlock } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Device, RequestItem, LogEntry } from '../types';

// Modals
import CreateDeviceModal from '../components/modals/CreateDeviceModal';
import RequestModal from '../components/modals/RequestModal';
import ApproveModal from '../components/modals/ApproveModal';
import RevealModal from '../components/modals/RevealModal';
import ResetModal from '../components/modals/ResetModal';
import SetupMFAModal from '../components/modals/SetupMFAModal';
import UserManagementModal from '../components/modals/UserManagementModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import GroupManagementModal from '../components/modals/GroupManagementModal';
import VaultModal from '../components/modals/VaultModal';

const ACTION_MAP: Record<string, { label: string; color: string }> = {
    'CREATE_DEVICE': { label: '录入设备', color: 'text-blue-400' },
    'RESET_PASSWORD': { label: '密码重置/回收', color: 'text-orange-400' },
    'APPROVE_REQUEST': { label: '审批通过', color: 'text-green-400' },
    'VIEW_PASSWORD': { label: '查看密码', color: 'text-red-400' },
    'CREATE_USER': { label: '创建用户', color: 'text-purple-400' },
    'UPDATE_USER': { label: '修改用户', color: 'text-purple-300' },
    'DELETE_USER': { label: '删除用户', color: 'text-red-600' },
    'ADMIN_RESET_USER_PWD': { label: '超管重置密码', color: 'text-orange-500' },
    'UPDATE_SELF_PWD': { label: '自助改密', color: 'text-teal-500' },
    'ACTIVATE_MFA': { label: '激活MFA', color: 'text-teal-400' },
    'CREATE_REQUEST': { label: '发起申请', color: 'text-blue-300' },
    'CREATE_GROUP': { label: '创建设备组', color: 'text-indigo-400' },
    'UPDATE_GROUP': { label: '修改设备组', color: 'text-indigo-300' },
    'DELETE_GROUP': { label: '删除设备组', color: 'text-red-500' },
    'SETUP_VAULT': { label: '初始化金库', color: 'text-pink-500' },
    'UNLOCK_VAULT': { label: '解锁金库', color: 'text-pink-400' },
    'LOCK_VAULT': { label: '锁定金库', color: 'text-gray-400' },
};

const FIELD_MAP: Record<string, string> = {
    'status_before': '变更前',
    'status_after': '变更后',
    'ip': 'IP来源',
    'applicant': '申请人',
    'reason': '理由',
    'device': '设备名',
};

const REQ_STATUS_MAP: Record<string, string> = {
    'PENDING': '审批中',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'COMPLETED': '已归还',
};

export default function Dashboard() {
    const { role } = useAuth();

    const [devices, setDevices] = useState<Device[]>([]);
    const [pendingRequests, setPendingRequests] = useState<RequestItem[]>([]);
    const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
    const [auditLogs, setAuditLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // 金库状态
    const [vaultStatus, setVaultStatus] = useState({ initialized: false, unlocked: false });

    const [modals, setModals] = useState({
        create: false,
        request: false,
        approve: false,
        reveal: false,
        reset: false,
        setupMFA: false,
        userManage: false,
        groupManage: false,
        changePwd: false,
        vault: false,
    });
    const [vaultMode, setVaultMode] = useState<'SETUP' | 'UNLOCK'>('UNLOCK');

    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
    const [revealRequestId, setRevealRequestId] = useState<number | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const vStatus = await api.getVaultStatus();
            setVaultStatus(vStatus);

            const devData = await api.getDevices();
            setDevices(devData);

            if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                if (role === 'ADMIN') {
                    const reqData = await api.getPendingRequests();
                    setPendingRequests(reqData);
                }
                try {
                    const logData = await api.getAuditLogs();
                    setAuditLogs(logData);
                } catch (e) { /* Ignore */ }
            }

            if (role === 'USER') {
                const myReqData = await api.getMyRequests();
                setMyRequests(myReqData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (name: keyof typeof modals, device: Device | null = null, request: RequestItem | null = null) => {
        // 敏感操作检查金库状态
        if (['create', 'approve', 'reveal', 'reset'].includes(name)) {
            if (!vaultStatus.initialized) {
                alert("系统金库尚未初始化，请联系超级管理员。");
                return;
            }
            if (!vaultStatus.unlocked) {
                if (role === 'SUPER_ADMIN') {
                    setVaultMode('UNLOCK');
                    setModals({ ...modals, vault: true });
                } else {
                    alert("系统处于【安全锁定】状态。\n\n当前操作需要访问加密金库，请联系超级管理员 (System Administrator) 执行解锁操作。");
                }
                return;
            }
        }

        setSelectedDevice(device);
        setSelectedRequest(request);
        setModals({ ...modals, [name]: true });
    };

    const closeModal = (name: keyof typeof modals) => {
        setModals({ ...modals, [name]: false });
        setSelectedDevice(null);
        setSelectedRequest(null);
    };

    const handleVaultAction = async () => {
        if (role !== 'SUPER_ADMIN') {
            alert("权限不足：仅超级管理员可管理金库状态。");
            return;
        }

        if (!vaultStatus.initialized) {
            setVaultMode('SETUP');
            setModals({ ...modals, vault: true });
        } else if (vaultStatus.unlocked) {
            await api.lockVault();
            loadData();
        } else {
            setVaultMode('UNLOCK');
            setModals({ ...modals, vault: true });
        }
    };

    const renderAuditDetails = (detailsJson: string) => {
        try {
            const obj = JSON.parse(detailsJson);
            if (!obj || Object.keys(obj).length === 0) return null;
            return Object.entries(obj).map(([k, v]) => (
                <span key={k} className="mr-2 bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                    {FIELD_MAP[k] || k}: <span className="text-slate-200 font-mono">{String(v)}</span>
                </span>
            ));
        } catch {
            return <span className="text-slate-500">{detailsJson}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        const config: any = {
            SAFE: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Shield size={12} />, label: '在库安全' },
            PENDING_APPROVAL: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Clock size={12} />, label: '待审批' },
            APPROVED: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle size={12} />, label: '待领取' },
            IN_USE: { color: 'bg-red-50 text-red-700 border-red-200', icon: <Activity size={12} />, label: '已借出' },
            PENDING_RESET: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <RefreshCw size={12} />, label: '待重置' },
        };

        const style = config[status] || { color: 'bg-gray-100', icon: null, label: status };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex w-fit items-center gap-1.5 ${style.color}`}>
                {style.icon} {style.label}
            </span>
        );
    };

    const filteredDevices = devices.filter(d => d.Name.toLowerCase().includes(searchTerm.toLowerCase()) || d.IP.includes(searchTerm));

    // [UI优化] 判断是否因为金库锁定而禁用按钮样式
    const isVaultLocked = !vaultStatus.unlocked;

    return (
        <Layout>
            <div className="space-y-8">

                {/* --- Top Controls & Vault Status --- */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${!vaultStatus.initialized ? 'bg-red-50 border-red-200 text-red-700' :
                        vaultStatus.unlocked ? 'bg-green-50 border-green-200 text-green-700' :
                            'bg-orange-50 border-orange-200 text-orange-700'
                        }`}>
                        <div className={`p-1.5 rounded-full ${!vaultStatus.initialized ? 'bg-red-200' : vaultStatus.unlocked ? 'bg-green-200' : 'bg-orange-200'
                            }`}>
                            {vaultStatus.unlocked ? <Unlock size={16} /> : <Lock size={16} />}
                        </div>
                        <div className="text-sm">
                            <span className="font-bold block">
                                {!vaultStatus.initialized ? '金库未初始化' : vaultStatus.unlocked ? '金库已解锁' : '金库已锁定'}
                            </span>
                            <span className="text-xs opacity-80">
                                {!vaultStatus.initialized ? '系统不可用' : vaultStatus.unlocked ? '可以进行敏感操作' : '无法解密/录入密码'}
                            </span>
                        </div>
                        <button
                            onClick={handleVaultAction}
                            className="ml-2 text-xs font-bold underline hover:opacity-80"
                        >
                            {!vaultStatus.initialized ? '去初始化' : vaultStatus.unlocked ? '立即锁定' : '点击解锁'}
                        </button>
                    </div>

                    <div className="flex justify-end gap-3">
                        {role === 'SUPER_ADMIN' && (
                            <>
                                <button onClick={() => setModals({ ...modals, groupManage: true })} className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:border-indigo-300 text-slate-700 transition-colors">
                                    <Layers size={16} className="text-indigo-600" /> 组管理
                                </button>
                                <button onClick={() => setModals({ ...modals, userManage: true })} className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:border-blue-300 text-slate-700 transition-colors">
                                    <Users size={16} className="text-blue-600" /> 用户管理
                                </button>
                            </>
                        )}
                        <button onClick={() => setModals({ ...modals, changePwd: true })} className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:border-blue-300 text-slate-700 transition-colors">
                            <Lock size={16} className="text-slate-600" /> 修改密码
                        </button>

                        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                            <button onClick={() => setModals({ ...modals, setupMFA: true })} className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:border-purple-300 text-slate-700 transition-colors">
                                <Settings size={16} className="text-purple-600" /> 设置 MFA
                            </button>
                        )}
                    </div>
                </div>

                {/* Admin: Pending Approvals */}
                {role === 'ADMIN' && pendingRequests.length > 0 && (
                    <div className="bg-white border-l-4 border-yellow-500 rounded-xl shadow-sm p-5 animate-in slide-in-from-top duration-300">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                            <Clock className="text-yellow-600" /> 待审批事项 ({pendingRequests.length})
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            {pendingRequests.map(req => (
                                <div key={req.ID} className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100 hover:shadow-sm transition-shadow">
                                    <div className="text-sm">
                                        <div className="font-bold text-slate-800">{req.User.Username} <span className="font-normal text-slate-500">申请借用</span></div>
                                        <div className="text-blue-700 font-mono font-medium mt-0.5">{req.Device.Name}</div>
                                        <div className="text-slate-500 text-xs mt-1">{req.Reason} · {req.Duration}</div>
                                    </div>
                                    {/* [优化] 锁定状态下，审批按钮变灰 */}
                                    <button
                                        onClick={() => openModal('approve', null, req)}
                                        className={`px-4 py-2 rounded-lg text-sm shadow-sm transition-colors font-medium whitespace-nowrap flex items-center gap-1 ${isVaultLocked
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                            }`}
                                    >
                                        {isVaultLocked ? <Lock size={14} /> : <Key size={14} />}
                                        {isVaultLocked ? '金库锁定' : 'TOTP 审批'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User: My Requests Summary */}
                {role === 'USER' && myRequests.length > 0 && (
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
                            <Key size={20} /> 我的申请记录 / 密码箱
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-blue-400 border-b border-blue-200">
                                    <tr>
                                        <th className="pb-2">设备</th>
                                        <th className="pb-2">申请时间</th>
                                        <th className="pb-2">状态</th>
                                        <th className="pb-2 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-200/50">
                                    {myRequests.map(req => (
                                        <tr key={req.ID}>
                                            <td className="py-3 font-medium text-blue-900">{req.Device.Name}</td>
                                            <td className="py-3 text-blue-700">{new Date(req.CreatedAt).toLocaleString()}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs ${req.Status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {REQ_STATUS_MAP[req.Status] || req.Status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                {req.Status === 'APPROVED' ? (
                                                    // [优化] 锁定状态下，查看密码按钮变灰
                                                    <button
                                                        onClick={() => { setRevealRequestId(req.ID); setModals({ ...modals, reveal: true }); }}
                                                        className={`px-3 py-1 rounded text-xs shadow-sm flex items-center gap-1 ml-auto ${isVaultLocked
                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        {isVaultLocked ? <Lock size={12} /> : <Eye size={12} />}
                                                        {isVaultLocked ? '金库锁定' : '查看密码'}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">等待中...</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Device List */}
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Server className="text-slate-500" /> 资产列表
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="搜索设备名称或IP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all" />
                            </div>
                            {role === 'USER' && (
                                // [优化] 锁定状态下，录入按钮变灰
                                <button
                                    onClick={() => openModal('create')}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium transition-colors whitespace-nowrap ${isVaultLocked
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {isVaultLocked ? <Lock size={16} /> : <Plus size={16} />}
                                    录入新设备
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-semibold">设备名称</th>
                                        <th className="p-4 font-semibold">IP / 协议</th>
                                        <th className="p-4 font-semibold">归属组</th>
                                        <th className="p-4 font-semibold">状态</th>
                                        <th className="p-4 font-semibold text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">加载数据中...</td></tr>
                                    ) : filteredDevices.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">暂无数据 (或无权限查看)</td></tr>
                                    ) : (
                                        filteredDevices.map(dev => {
                                            const myApprovedReq = role === 'USER' ? myRequests.find(r => {
                                                const rDevId = r.DeviceID || (r as any).device_id;
                                                const rStatus = r.Status || (r as any).status;
                                                return rDevId === dev.ID && rStatus === 'APPROVED';
                                            }) : null;

                                            const myPendingReq = role === 'USER' ? myRequests.find(r => {
                                                const rDevId = r.DeviceID || (r as any).device_id;
                                                const rStatus = r.Status || (r as any).status;
                                                return rDevId === dev.ID && rStatus === 'PENDING';
                                            }) : null;

                                            return (
                                                <tr key={dev.ID} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="p-4 font-medium text-slate-900">{dev.Name}</td>
                                                    <td className="p-4 text-slate-600">
                                                        <div className="font-mono">{dev.IP}</div>
                                                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 inline-block">{dev.Protocol}</span>
                                                    </td>
                                                    <td className="p-4 text-slate-500">{dev.Group?.Name}</td>
                                                    <td className="p-4">{getStatusBadge(dev.Status)}</td>
                                                    <td className="p-4 text-right">
                                                        {role === 'USER' && (
                                                            <>
                                                                {myApprovedReq && (
                                                                    // [优化] 列表内查看密码按钮
                                                                    <button
                                                                        onClick={() => { setRevealRequestId(myApprovedReq.ID); setModals({ ...modals, reveal: true }); }}
                                                                        className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 ml-auto transition-colors text-xs ${isVaultLocked
                                                                            ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                                                                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                                                            }`}
                                                                    >
                                                                        {isVaultLocked ? <Lock size={14} /> : <Key size={14} />}
                                                                        {isVaultLocked ? '金库锁定' : '查看密码'}
                                                                    </button>
                                                                )}
                                                                {!myApprovedReq && myPendingReq && (
                                                                    <span className="text-yellow-600 bg-yellow-50 px-3 py-1 rounded text-xs font-medium border border-yellow-100">
                                                                        审批中...
                                                                    </span>
                                                                )}
                                                                {!myApprovedReq && !myPendingReq && dev.Status === 'SAFE' && (
                                                                    <button onClick={() => openModal('request', dev)} className="text-blue-600 hover:text-white border border-blue-200 hover:bg-blue-600 font-medium px-4 py-1.5 rounded transition-colors text-xs">
                                                                        申请借用
                                                                    </button>
                                                                )}
                                                                {!myApprovedReq && !myPendingReq && dev.Status !== 'SAFE' && (
                                                                    <span className="text-gray-400 text-xs italic px-2">当前不可用</span>
                                                                )}
                                                            </>
                                                        )}
                                                        {role === 'ADMIN' && (
                                                            <>
                                                                {dev.Status !== 'PENDING_APPROVAL' && (
                                                                    // [优化] 列表内回收按钮
                                                                    <button
                                                                        onClick={() => openModal('reset', dev)}
                                                                        className={`font-medium px-3 py-1.5 rounded transition-colors text-xs flex items-center gap-1 ml-auto ${isVaultLocked
                                                                            ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                                                                            : 'text-orange-600 hover:text-white border border-orange-200 hover:bg-orange-500'
                                                                            }`}
                                                                    >
                                                                        {isVaultLocked ? <Lock size={12} /> : <RefreshCw size={12} />}
                                                                        {isVaultLocked ? '金库锁定' : (dev.Status === 'SAFE' ? '主动轮转' : '回收重置')}
                                                                    </button>
                                                                )}
                                                                {dev.Status === 'PENDING_APPROVAL' && (
                                                                    <span className="text-gray-400 text-xs italic px-2">请在上方审批</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- Audit Logs (UI Optimized) --- */}
                {(role === 'ADMIN' || role === 'SUPER_ADMIN') && auditLogs.length > 0 && (
                    <div className="pt-4">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
                            <History size={20} /> 审计日志
                        </h3>
                        <div className="bg-slate-900 text-slate-300 rounded-xl p-2 font-mono text-xs max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-500 font-medium border-b border-slate-800">
                                    <tr>
                                        <th className="p-3 whitespace-nowrap w-48">时间</th>
                                        <th className="p-3 whitespace-nowrap w-48">操作人</th>
                                        <th className="p-3 whitespace-nowrap w-32">动作</th>
                                        <th className="p-3 whitespace-nowrap">对象 / 详情</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {auditLogs.map(log => {
                                        const actionMeta = ACTION_MAP[log.Action] || { label: log.Action, color: 'text-slate-400' };
                                        return (
                                            <tr key={log.ID} className="hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-3 text-slate-500 whitespace-nowrap align-top">
                                                    {new Date(log.CreatedAt).toLocaleString()}
                                                </td>
                                                <td className="p-3 font-bold text-blue-400 align-top break-words">
                                                    {log.ActorName}
                                                </td>
                                                <td className="p-3 align-top">
                                                    <span className={`px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 ${actionMeta.color} inline-block whitespace-nowrap`}>
                                                        {actionMeta.label}
                                                    </span>
                                                </td>
                                                <td className="p-3 align-top">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                                                        <span className="text-white font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                                                            {log.Target}
                                                        </span>
                                                        {renderAuditDetails(log.Details)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            <CreateDeviceModal isOpen={modals.create} onClose={() => closeModal('create')} onSuccess={loadData} />
            <RequestModal device={selectedDevice} isOpen={modals.request} onClose={() => closeModal('request')} onSuccess={loadData} />
            <ApproveModal request={selectedRequest} isOpen={modals.approve} onClose={() => closeModal('approve')} onSuccess={loadData} />
            <RevealModal requestId={revealRequestId} isOpen={modals.reveal} onClose={() => closeModal('reveal')} />
            <ResetModal device={selectedDevice} isOpen={modals.reset} onClose={() => closeModal('reset')} onSuccess={loadData} />
            <SetupMFAModal isOpen={modals.setupMFA} onClose={() => setModals({ ...modals, setupMFA: false })} />
            <UserManagementModal isOpen={modals.userManage} onClose={() => setModals({ ...modals, userManage: false })} />
            <ChangePasswordModal isOpen={modals.changePwd} onClose={() => setModals({ ...modals, changePwd: false })} />
            <GroupManagementModal isOpen={modals.groupManage} onClose={() => setModals({ ...modals, groupManage: false })} />
            <VaultModal
                mode={vaultMode}
                isOpen={modals.vault}
                onClose={() => setModals({ ...modals, vault: false })}
                onSuccess={loadData}
            />

        </Layout>
    );
}