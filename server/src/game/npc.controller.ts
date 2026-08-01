import { Player, AvatarType, DanceAnimationType } from '../../../shared/types';

export class NpcController {
  private static npcTemplates: Array<{ nickname: string; avatarType: AvatarType }> = [
    { nickname: 'DJMax', avatarType: 'Robot' },
    { nickname: 'StarBoy', avatarType: 'Alien' },
    { nickname: 'Luna', avatarType: 'Girl' },
    { nickname: 'PandaX', avatarType: 'Panda' },
    { nickname: 'ChipChip', avatarType: 'Bunny' }
  ];

  private static animations: DanceAnimationType[] = [
    'HipHop',
    'Shuffle',
    'Moonwalk',
    'Breakdance',
    'Wave',
    'Cheer',
    'Spin',
    'RandomDance'
  ];

  public static generateNpcsForRoom(roomId: string, count: number): Player[] {
    const npcs: Player[] = [];
    const radius = 8;
    for (let i = 0; i < count; i++) {
      const template = this.npcTemplates[i % this.npcTemplates.length];
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 5; // near front stage
      const randomAnim = this.animations[Math.floor(Math.random() * this.animations.length)];

      npcs.push({
        id: `npc-${roomId}-${i}`,
        nickname: `${template.nickname} [NPC]`,
        avatarType: template.avatarType,
        roomId,
        position: { x, y: 0, z },
        rotation: Math.PI, // facing audience
        animation: randomAnim,
        isNpc: true,
        score: Math.floor(Math.random() * 8000) + 4000
      });
    }
    return npcs;
  }

  public static randomizeNpcAnimation(npc: Player): Player {
    const randomAnim = this.animations[Math.floor(Math.random() * this.animations.length)];
    return {
      ...npc,
      animation: randomAnim
    };
  }
}
