export type AlertChannel = 'email' | 'slack' | 'sms' | 'webhook';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertCondition {
  operator: '>' | '<' | '>=' | '<=' | 'delta%' | 'trend';
  threshold?: number;
  window?: '5m' | '1h' | '24h';
  aggregation?: 'avg' | 'p95' | 'sum' | 'count';
}

export interface Alert {
  id: string;
  tenantId: string;
  name: string;
  subjectRef: string; // e.g., "dashboard:123" or "query:456"
  condition: AlertCondition;
  channels: AlertChannel[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertInput {
  tenantId: string;
  name: string;
  subjectRef: string;
  condition: AlertCondition;
  channels: AlertChannel[];
  enabled?: boolean;
}

export interface UpdateAlertInput {
  name?: string;
  condition?: AlertCondition;
  channels?: AlertChannel[];
  enabled?: boolean;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  severity: AlertSeverity;
  message: string;
  data: any;
  createdAt: string;
}

export interface TestAlertResult {
  success: boolean;
  deliveries: Array<{
    channel: AlertChannel;
    status: 'sent' | 'failed';
    message?: string;
  }>;
}

function validateCondition(condition: AlertCondition): void {
  const validOps = ['>', '<', '>=', '<=', 'delta%', 'trend'];
  if (!validOps.includes(condition.operator)) {
    throw new Error('Invalid operator');
  }
  if (condition.threshold !== undefined && typeof condition.threshold !== 'number') {
    throw new Error('threshold must be a number');
  }
  if (condition.window && !['5m', '1h', '24h'].includes(condition.window)) {
    throw new Error('Invalid window');
  }
  if (condition.aggregation && !['avg', 'p95', 'sum', 'count'].includes(condition.aggregation)) {
    throw new Error('Invalid aggregation');
  }
}

function validateChannels(channels: AlertChannel[]): void {
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new Error('At least one channel is required');
  }
  const validChannels: AlertChannel[] = ['email', 'slack', 'sms', 'webhook'];
  for (const ch of channels) {
    if (!validChannels.includes(ch)) {
      throw new Error(`Invalid channel: ${ch}`);
    }
  }
}

export class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private events: Map<string, AlertEvent> = new Map();
  private idCounter = 1;
  private eventIdCounter = 1;

  list(tenantId: string): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.tenantId === tenantId);
  }

  get(id: string, tenantId: string): Alert | undefined {
    const alert = this.alerts.get(id);
    return alert && alert.tenantId === tenantId ? alert : undefined;
  }

  create(input: CreateAlertInput): Alert {
    if (!input.tenantId || !input.name || !input.subjectRef || !input.condition) {
      throw new Error('tenantId, name, subjectRef, and condition are required');
    }
    validateCondition(input.condition);
    validateChannels(input.channels);

    const id = `alert_${this.idCounter++}`;
    const now = new Date().toISOString();
    const alert: Alert = {
      id,
      tenantId: input.tenantId,
      name: input.name,
      subjectRef: input.subjectRef,
      condition: input.condition,
      channels: input.channels,
      enabled: input.enabled !== undefined ? input.enabled : true,
      createdAt: now,
      updatedAt: now,
    };
    this.alerts.set(id, alert);
    return alert;
  }

  update(id: string, tenantId: string, input: UpdateAlertInput): Alert {
    const existing = this.get(id, tenantId);
    if (!existing) throw new Error('Alert not found');

    if (input.condition) validateCondition(input.condition);
    if (input.channels) validateChannels(input.channels);

    const updated: Alert = {
      ...existing,
      name: input.name ?? existing.name,
      condition: input.condition ?? existing.condition,
      channels: input.channels ?? existing.channels,
      enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
      updatedAt: new Date().toISOString(),
    };
    this.alerts.set(id, updated);
    return updated;
  }

  delete(id: string, tenantId: string): void {
    const existing = this.get(id, tenantId);
    if (!existing) throw new Error('Alert not found');
    this.alerts.delete(id);
  }

  test(id: string, tenantId: string): TestAlertResult {
    const alert = this.get(id, tenantId);
    if (!alert) throw new Error('Alert not found');

    // Mock delivery to all channels
    const deliveries = alert.channels.map(ch => ({
      channel: ch,
      status: 'sent' as const,
      message: `Test alert sent to ${ch}`,
    }));

    // Create a test event
    const eventId = `evt_${this.eventIdCounter++}`;
    const event: AlertEvent = {
      id: eventId,
      alertId: id,
      severity: 'info',
      message: `Test alert: ${alert.name}`,
      data: { test: true, condition: alert.condition },
      createdAt: new Date().toISOString(),
    };
    this.events.set(eventId, event);

    return { success: true, deliveries };
  }

  getHistory(id: string, tenantId: string, limit = 50): AlertEvent[] {
    const alert = this.get(id, tenantId);
    if (!alert) throw new Error('Alert not found');

    return Array.from(this.events.values())
      .filter(e => e.alertId === id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  }
}

export const alertService = new AlertService();

