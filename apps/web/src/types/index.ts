export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  tenantId: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  timezone?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}
