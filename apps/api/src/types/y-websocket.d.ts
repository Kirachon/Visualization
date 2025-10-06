declare module 'y-websocket/bin/utils.js' {
  export function setupWSConnection(ws: any, req: any, options?: any): void;
}

declare module 'ws' {
  export class WebSocketServer {
    constructor(opts: any);
    on(event: string, listener: (...args: any[]) => void): void;
  }
}

