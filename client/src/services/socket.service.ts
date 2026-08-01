import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../types';
import { useAuthStore } from '../stores/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private serverTimeOffset: number = 0;
  private pingInterval: NodeJS.Timeout | null = null;

  public getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }

  public connect(): Socket {
    if (!this.socket) {
      const token = useAuthStore.getState().accessToken;
      
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        auth: {
          token
        }
      });

      this.setupTimeSync();
    }
    return this.socket;
  }

  private setupTimeSync() {
    if (!this.socket) return;
    
    this.socket.on(SOCKET_EVENTS.PONG, (payload: { clientTime: number, serverTime: number }) => {
      const latency = (Date.now() - payload.clientTime) / 2;
      const calculatedOffset = payload.serverTime - Date.now() - latency;
      
      // Smooth the offset with a simple moving average or just assign if first time
      if (this.serverTimeOffset === 0) {
        this.serverTimeOffset = calculatedOffset;
      } else {
        this.serverTimeOffset = this.serverTimeOffset * 0.8 + calculatedOffset * 0.2;
      }
    });

    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(SOCKET_EVENTS.PING, { clientTime: Date.now() });
      }
    }, 5000);
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
