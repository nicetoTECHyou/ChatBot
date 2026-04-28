import { io, Socket } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
  : '';

let socket: Socket | null = null;

type EventCallback = (...args: unknown[]) => void;

const eventListeners: Map<string, Set<EventCallback>> = new Map();

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[StreamForge] Socket verbunden');
    emitInternal('__connected', {});
  });

  socket.on('disconnect', (reason) => {
    console.log('[StreamForge] Socket getrennt:', reason);
    emitInternal('__disconnected', { reason });
  });

  socket.on('connect_error', (error) => {
    console.error('[StreamForge] Socket Fehler:', error.message);
    emitInternal('__error', { error: error.message });
  });

  // Re-attach all stored listeners on reconnect
  eventListeners.forEach((callbacks, event) => {
    callbacks.forEach((cb) => {
      socket!.on(event, cb as (...args: unknown[]) => void);
    });
  });

  return socket;
}

function emitInternal(event: string, data: unknown) {
  const callbacks = eventListeners.get(event);
  if (callbacks) {
    callbacks.forEach((cb) => cb(data));
  }
}

export function onSocket(event: string, callback: EventCallback): void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);

  if (socket?.connected) {
    socket.on(event, callback as (...args: unknown[]) => void);
  }
}

export function offSocket(event: string, callback?: EventCallback): void {
  if (callback && eventListeners.has(event)) {
    eventListeners.get(event)!.delete(callback);
    socket?.off(event, callback as (...args: unknown[]) => void);
  } else if (eventListeners.has(event)) {
    eventListeners.get(event)!.clear();
    socket?.off(event);
  }
}

export function emitSocket(event: string, data?: unknown): void {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  eventListeners.clear();
}

export function getSocketStatus(): 'connected' | 'disconnected' | 'connecting' {
  if (!socket) return 'disconnected';
  if (socket.connected) return 'connected';
  return 'connecting';
}

export function getSocket(): Socket | null {
  return socket;
}
