export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  region: string[];
  role: 'admin' | 'manager' | 'security_officer' | 'observer';
  permissions?: RolePermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface RolePermissions {
  canCreatePermits: boolean;
  canEditPermits: boolean;
  canDeletePermits: boolean;
  canClosePermits: boolean;
  canReopenPermits: boolean;
  canViewPermits: boolean;
  canExportPermits: boolean;
  canManageUsers: boolean;
  canViewStatistics: boolean;
  canViewActivityLog: boolean;
  canManagePermissions: boolean;
  canReopenAnyPermit: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    canCreatePermits: true,
    canEditPermits: true,
    canDeletePermits: true,
    canClosePermits: true,
    canReopenPermits: true,
    canViewPermits: true,
    canExportPermits: true,
    canManageUsers: true,
    canViewStatistics: true,
    canViewActivityLog: true,
    canManagePermissions: true,
    canReopenAnyPermit: true,
  },
  manager: {
    canCreatePermits: true,
    canEditPermits: true,
    canDeletePermits: false,
    canClosePermits: true,
    canReopenPermits: true,
    canViewPermits: true,
    canExportPermits: true,
    canManageUsers: false,
    canViewStatistics: true,
    canViewActivityLog: true,
    canManagePermissions: false,
    canReopenAnyPermit: true,
  },
  security_officer: {
    canCreatePermits: false,
    canEditPermits: false,
    canDeletePermits: false,
    canClosePermits: true,
    canReopenPermits: true,
    canViewPermits: true,
    canExportPermits: false,
    canManageUsers: false,
    canViewStatistics: false,
    canViewActivityLog: true,
    canManagePermissions: false,
    canReopenAnyPermit: false,
  },
  observer: {
    canCreatePermits: false,
    canEditPermits: false,
    canDeletePermits: false,
    canClosePermits: false,
    canReopenPermits: false,
    canViewPermits: true,
    canExportPermits: false,
    canManageUsers: false,
    canViewStatistics: false,
    canViewActivityLog: false,
    canManagePermissions: false,
    canReopenAnyPermit: false,
  },
};

export interface Permit {
  id: string;
  permitNumber: string;
  date: string;
  region: string;
  location: string;
  carrierName: string;
  carrierId: string;
  requestType: 'material_entrance' | 'material_exit' | 'heavy_vehicle_entrance_exit' | 'heavy_vehicle_entrance' | 'heavy_vehicle_exit';
  vehiclePlate: string;
  materials: Material[];
  closedBy?: string;
  closedAt?: string;
  closedByName?: string;
  canReopen: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Material {
  id: string;
  description: string;
  serialNumber: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  name: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface Statistics {
  totalPermits: number;
  activePermits: number;
  closedPermits: number;
  permitsByRegion: { [key: string]: number };
  permitsByType: { [key: string]: number };
  permitsByDate: { date: string; count: number }[];
  topCarriers: { name: string; count: number }[];
}

export const REGIONS = [
  'headquarters', 'riyadh', 'qassim', 'hail', 'dammam', 'ahsa', 
  'jubail', 'jouf', 'northern_borders', 'jeddah', 'makkah', 
  'medina', 'tabuk', 'yanbu', 'asir', 'taif', 'baha', 'jizan', 'najran'
];

export const REQUEST_TYPES = [
  'material_entrance', 'material_exit', 'heavy_vehicle_entrance_exit',
  'heavy_vehicle_entrance', 'heavy_vehicle_exit'
];