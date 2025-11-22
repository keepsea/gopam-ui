export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'; // [更新] 增加 SUPER_ADMIN

export interface User {
    id: number;
    username: string;
    role: UserRole;
    real_name: string;    // [新增]
    contact_info: string; // [新增]
    totp_secret: string;  // [新增] 用于展示状态(BOUND/UNBOUND)
    managed_group_id?: number;
}

// ... (DeviceGroup, Device 等保持不变) ...
export interface DeviceGroup {
    ID: number;
    Name: string;
    Description: string;
}

export interface Device {
    ID: number;
    Name: string;
    IP: string;
    Protocol: string;
    Status: 'SAFE' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_USE' | 'PENDING_RESET';
    GroupID: number;
    Group: { Name: string };
    CreatedByID: number;
    CreatedBy: { Username: string };
}

export interface RequestItem {
    ID: number;
    DeviceID: number;
    Device: Device;
    UserID: number;
    User: { Username: string };
    Reason: string;
    Duration: string;
    Status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    CreatedAt: string;
}

export interface LogEntry {
    ID: number;
    ActorName: string;
    Action: string;
    Target: string;
    Details: string;
    CreatedAt: string;
}

export interface LoginResponse {
    token: string;
    role: UserRole;
    username: string;
    is_admin: boolean;
}