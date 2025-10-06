export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roleId: string;
  isActive: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  deletedAt?: Date; // for soft delete
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  tenantId: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetComplete {
  token: string;
  newPassword: string;
}

