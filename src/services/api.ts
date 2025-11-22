// 封装 fetch，统一处理 Token 和 BaseURL

// 智能判断 API 地址
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8080/api';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // 如果是 GET 请求，手动追加时间戳参数，彻底绕过任何缓存
    let url = `${API_BASE}${endpoint}`;
    if (!options.method || options.method.toUpperCase() === 'GET') {
        const separator = endpoint.includes('?') ? '&' : '?';
        url = `${url}${separator}_t=${new Date().getTime()}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API Request Failed');
    }

    return data as T;
}

// 具体的 API 方法集合
export const api = {
    login: (credentials: any) => request<any>('/login', { method: 'POST', body: JSON.stringify(credentials) }),

    // 组管理 (此前遗漏的部分，已补全)
    getGroups: () => request<any[]>('/groups'),
    createGroup: (data: any) => request('/admin/groups', { method: 'POST', body: JSON.stringify(data) }),
    updateGroup: (id: number, data: any) => request(`/admin/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteGroup: (id: number) => request(`/admin/groups/${id}`, { method: 'DELETE' }),

    // 设备管理
    getDevices: () => request<any[]>('/devices'),
    createDevice: (data: any) => request('/devices', { method: 'POST', body: JSON.stringify(data) }),
    resetDevice: (id: number, data: any) => request(`/devices/${id}/reset`, { method: 'POST', body: JSON.stringify(data) }),

    // 申请 & 审批
    createRequest: (data: any) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
    getMyRequests: () => request<any[]>('/requests/my'),
    getPendingRequests: () => request<any[]>('/admin/pending-requests'),
    approveRequest: (id: number, totpCode: string) => request(`/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'X-TOTP-Code': totpCode }
    }),
    revealPassword: (reqId: number) => request<any>(`/requests/${reqId}/reveal`),

    // 审计日志
    getAuditLogs: () => request<any[]>('/admin/audit-logs'),

    // 用户管理
    getUsers: () => request<any[]>('/admin/users'),
    createUser: (data: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: number, data: any) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id: number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    adminResetPwd: (id: number, pwd: string) => request(`/admin/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ new_password: pwd }) }),
    adminResetMFA: (id: number) => request(`/admin/users/${id}/reset-mfa`, { method: 'PUT' }),


    // 个人设置
    updateSelfPwd: (oldPwd: string, newPwd: string) => request('/user/password', { method: 'PUT', body: JSON.stringify({ old_password: oldPwd, new_password: newPwd }) }),

    // MFA 设置
    setupMFA: () => request<{ secret: string, qr_image: string }>('/auth/totp/setup', { method: 'POST' }),
    activateMFA: (secret: string, code: string) => request('/auth/totp/activate', {
        method: 'POST',
        body: JSON.stringify({ secret, code })
    }),

    // 金库管理
    getVaultStatus: () => request<{ initialized: boolean, unlocked: boolean }>('/vault/status'),
    setupVault: (password: string) => request('/vault/setup', { method: 'POST', body: JSON.stringify({ vault_password: password }) }),
    unlockVault: (password: string) => request('/vault/unlock', { method: 'POST', body: JSON.stringify({ vault_password: password }) }),
    lockVault: () => request('/vault/lock', { method: 'POST' }),
};