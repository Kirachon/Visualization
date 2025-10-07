/**
 * Workspace Member Service
 * Story 3.3: Collaboration Features
 *
 * Manages membership for workspaces (roles: owner, admin, member, viewer).
 */

import { query } from '../database/connection.js';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  addedAt: Date;
  addedBy?: string | null;
}

export class WorkspaceMemberService {
  async addMember(input: { workspaceId: string; userId: string; role: WorkspaceRole; addedBy?: string }): Promise<WorkspaceMember> {
    const res = await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role, added_at, added_by)
       VALUES ($1,$2,$3,NOW(),$4)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role, added_by = EXCLUDED.added_by
       RETURNING workspace_id, user_id, role, added_at, added_by`,
      [input.workspaceId, input.userId, input.role, input.addedBy || null]
    );
    return this.hydrate(res.rows[0]);
  }

  async updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember | null> {
    const res = await query(
      `UPDATE workspace_members SET role = $3 WHERE workspace_id = $1 AND user_id = $2 RETURNING workspace_id, user_id, role, added_at, added_by`,
      [workspaceId, userId, role]
    );
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    const res = await query(`DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`, [workspaceId, userId]);
    return (res.rowCount ?? 0) > 0;
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await query(
      `SELECT workspace_id, user_id, role, added_at, added_by FROM workspace_members WHERE workspace_id = $1 ORDER BY role DESC, added_at ASC`,
      [workspaceId]
    );
    return res.rows.map((r) => this.hydrate(r));
  }

  private hydrate(r: any): WorkspaceMember {
    return { workspaceId: r.workspace_id, userId: r.user_id, role: r.role, addedAt: r.added_at, addedBy: r.added_by };
  }
}

export const workspaceMemberService = new WorkspaceMemberService();

