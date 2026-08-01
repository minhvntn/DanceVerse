import { Vector3D } from '../../../shared/types';

export class ValidationService {
  private static rateLimits = new Map<string, { lastChat: number; lastEmote: number }>();

  public static sanitizeNickname(raw: string): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const cleaned = raw.replace(/<[^>]*>?/gm, '').trim();
    if (cleaned.length < 2 || cleaned.length > 16) return null;
    return cleaned;
  }

  public static sanitizeChat(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    return raw.replace(/<[^>]*>?/gm, '').trim().slice(0, 150);
  }

  public static canSendChat(socketId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(socketId) || { lastChat: 0, lastEmote: 0 };
    if (now - limit.lastChat < 500) {
      return false; // 500ms cooldown for chat
    }
    limit.lastChat = now;
    this.rateLimits.set(socketId, limit);
    return true;
  }

  public static canSendEmote(socketId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(socketId) || { lastChat: 0, lastEmote: 0 };
    if (now - limit.lastEmote < 1500) {
      return false; // 1.5s cooldown for emote
    }
    limit.lastEmote = now;
    this.rateLimits.set(socketId, limit);
    return true;
  }

  public static validatePosition(pos: Vector3D): Vector3D {
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number') {
      return { x: 0, y: 0, z: 0 };
    }
    return {
      x: Math.max(-40, Math.min(40, pos.x)),
      y: Math.max(0, Math.min(15, pos.y)),
      z: Math.max(-40, Math.min(40, pos.z)),
    };
  }

  public static clearSocket(socketId: string): void {
    this.rateLimits.delete(socketId);
  }
}
