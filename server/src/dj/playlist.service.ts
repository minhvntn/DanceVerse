import prisma from '../database/prisma';

export class PlaylistService {
  static async getPlaylist(eventId: string) {
    return prisma.eventPlaylistItem.findMany({
      where: { eventId },
      orderBy: { order: 'asc' }
    });
  }

  static async addPlaylistItem(eventId: string, itemData: any) {
    // Determine the next order index
    const lastItem = await prisma.eventPlaylistItem.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = lastItem ? lastItem.order + 1 : 0;

    return prisma.eventPlaylistItem.create({
      data: {
        ...itemData,
        eventId,
        order: nextOrder
      }
    });
  }

  static async updatePlaylistOrder(eventId: string, orderedIds: string[]) {
    // Perform bulk update of order based on array index
    const updates = orderedIds.map((id, index) => 
      prisma.eventPlaylistItem.update({
        where: { id },
        data: { order: index }
      })
    );
    
    await prisma.$transaction(updates);
    
    return this.getPlaylist(eventId);
  }

  static async removePlaylistItem(id: string) {
    return prisma.eventPlaylistItem.delete({
      where: { id }
    });
  }
}
