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
    const stageSlots = [
      { x: -9, z: -17.2 },
      { x: -4.5, z: -18.1 },
      { x: 0, z: -17.4 },
      { x: 4.5, z: -18.1 },
      { x: 9, z: -17.2 }
    ];

    for (let i = 0; i < count; i++) {
      const template = this.npcTemplates[i % this.npcTemplates.length];
      const slot = stageSlots[i % stageSlots.length];
      const randomAnim = this.animations[Math.floor(Math.random() * this.animations.length)];

      npcs.push({
        id: `npc-${roomId}-${i}`,
        nickname: `${template.nickname} [NPC]`,
        avatarType: template.avatarType,
        roomId,
        position: { x: slot.x, y: 1.5, z: slot.z },
        rotation: 0, // avatars face +Z toward the audience
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
