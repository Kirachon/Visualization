export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateSessionRequest {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

