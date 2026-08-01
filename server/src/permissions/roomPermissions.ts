import { UserRole, RoomPermission } from '../../../shared/types';

export const ROLE_PERMISSIONS: Record<UserRole, RoomPermission[]> = {
  host: [
    'room.manage',
    'room.end',
    'player.kick',
    'role.manage',
    'playlist.manage',
    'music.control',
    'request.review',
    'chat.moderate'
  ],
  'co-host': [
    'playlist.manage',
    'music.control',
    'request.review',
    'chat.moderate'
  ],
  guest: []
};

/**
 * Check if a specific role has a specific permission
 */
export function hasRoomPermission(role: UserRole | undefined, permission: RoomPermission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}
