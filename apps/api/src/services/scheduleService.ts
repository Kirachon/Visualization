import cron from 'node-cron';

export interface Schedule {
  id: string;
  subjectType: 'dashboard' | 'query' | 'pipeline';
  subjectId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  nextRunAt?: string;
}

export interface CreateScheduleInput {
  subjectType: 'dashboard' | 'query' | 'pipeline';
  subjectId: string;
  cronExpression: string;
  timezone?: string;
  enabled?: boolean;
}

export interface UpdateScheduleInput {
  cronExpression?: string;
  timezone?: string;
  enabled?: boolean;
}

export interface ScheduleRun {
  id: string;
  scheduleId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt?: string;
  endedAt?: string;
  logs: string[];
}

function validateCron(expression: string): void {
  if (!cron.validate(expression)) {
    throw new Error('Invalid cron expression');
  }
}

function validateTimezone(tz: string): void {
  try {
    // Test if timezone is valid by attempting to format a date
    new Date().toLocaleString('en-US', { timeZone: tz });
  } catch {
    throw new Error('Invalid timezone');
  }
}

function computeNextRun(_cronExpression: string, _timezone: string): string {
  // Simple next-run calculation using current time + cron parsing
  // In production, would use a library like cron-parser for accurate next-run
  // For Option A, return a deterministic mock based on current time
  const now = new Date();
  const nextRunMs = now.getTime() + 60 * 60 * 1000; // +1 hour as simple mock
  const nextRun = new Date(nextRunMs);
  return nextRun.toISOString();
}

export class ScheduleService {
  private schedules: Map<string, Schedule> = new Map();
  private runs: Map<string, ScheduleRun> = new Map();
  private idCounter = 1;
  private runIdCounter = 1;

  list(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  get(id: string): Schedule | undefined {
    return this.schedules.get(id);
  }

  create(input: CreateScheduleInput): Schedule {
    if (!input.subjectType || !input.subjectId || !input.cronExpression) {
      throw new Error('subjectType, subjectId, and cronExpression are required');
    }
    validateCron(input.cronExpression);
    const tz = input.timezone || 'UTC';
    validateTimezone(tz);

    const id = `sched_${this.idCounter++}`;
    const now = new Date().toISOString();
    const enabled = input.enabled !== undefined ? input.enabled : true;
    const nextRunAt = enabled ? computeNextRun(input.cronExpression, tz) : undefined;

    const schedule: Schedule = {
      id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      cronExpression: input.cronExpression,
      timezone: tz,
      enabled,
      createdAt: now,
      updatedAt: now,
      nextRunAt,
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  update(id: string, input: UpdateScheduleInput): Schedule {
    const existing = this.schedules.get(id);
    if (!existing) throw new Error('Schedule not found');

    if (input.cronExpression !== undefined) {
      validateCron(input.cronExpression);
    }
    if (input.timezone !== undefined) {
      validateTimezone(input.timezone);
    }

    const updated: Schedule = {
      ...existing,
      cronExpression: input.cronExpression ?? existing.cronExpression,
      timezone: input.timezone ?? existing.timezone,
      enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
      updatedAt: new Date().toISOString(),
    };
    updated.nextRunAt = updated.enabled ? computeNextRun(updated.cronExpression, updated.timezone) : undefined;
    this.schedules.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    if (!this.schedules.has(id)) throw new Error('Schedule not found');
    this.schedules.delete(id);
  }

  pause(id: string): Schedule {
    return this.update(id, { enabled: false });
  }

  resume(id: string): Schedule {
    return this.update(id, { enabled: true });
  }

  runNow(id: string): ScheduleRun {
    const schedule = this.schedules.get(id);
    if (!schedule) throw new Error('Schedule not found');

    const runId = `run_${this.runIdCounter++}`;
    const run: ScheduleRun = {
      id: runId,
      scheduleId: id,
      status: 'pending',
      logs: [`Run triggered manually at ${new Date().toISOString()}`],
    };
    this.runs.set(runId, run);

    // Simulate async execution (Option A mock)
    setTimeout(() => {
      const r = this.runs.get(runId);
      if (r) {
        r.status = 'running';
        r.startedAt = new Date().toISOString();
        r.logs.push(`Execution started for ${schedule.subjectType} ${schedule.subjectId}`);
        setTimeout(() => {
          const r2 = this.runs.get(runId);
          if (r2) {
            r2.status = 'success';
            r2.endedAt = new Date().toISOString();
            r2.logs.push('Execution completed successfully');
          }
        }, 100);
      }
    }, 10);

    return run;
  }

  getRun(runId: string): ScheduleRun | undefined {
    return this.runs.get(runId);
  }

  listRuns(scheduleId?: string): ScheduleRun[] {
    const allRuns = Array.from(this.runs.values());
    return scheduleId ? allRuns.filter(r => r.scheduleId === scheduleId) : allRuns;
  }
}

export const scheduleService = new ScheduleService();
