export interface ClickHouseExecuteInput {
  sql: string;
  params?: unknown[];
  timeoutMs?: number;
  tenantId?: string;
}

class ClickHouseService {
  private isEnabled(): boolean {
    return (process.env.CLICKHOUSE_ENABLE || 'false').toLowerCase() === 'true';
  }

  async execute(_input: ClickHouseExecuteInput): Promise<{ rows: any[]; rowCount: number; durationMs: number }>{
    if (!this.isEnabled()) throw new Error('ClickHouse disabled');
    // Real implementation would connect to CH and execute. Out of scope for this story.
    // This method will be mocked in tests.
    return { rows: [], rowCount: 0, durationMs: 1 };
  }
}

export const clickhouseService = new ClickHouseService();

