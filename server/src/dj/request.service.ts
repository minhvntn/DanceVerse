import prisma from '../database/prisma';

export class RequestService {
  static async getRequests(eventId: string) {
    return prisma.songRequest.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, displayName: true, profileImageUrl: true }
        },
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async submitRequest(eventId: string, userId: string, metadata: any) {
    // 1. Check max pending limits (Max 3 pending requests)
    const pendingCount = await prisma.songRequest.count({
      where: { eventId, userId, status: 'pending' }
    });

    if (pendingCount >= 3) {
      throw new Error('You have reached the maximum of 3 pending requests.');
    }

    // 2. Check duplicate (is it already in queue, pending or recently played?)
    const existing = await prisma.songRequest.findFirst({
      where: { eventId, videoId: metadata.videoId, status: { in: ['pending', 'approved'] } }
    });
    if (existing) {
      throw new Error('This song is already in the request queue.');
    }

    const inPlaylist = await prisma.eventPlaylistItem.findFirst({
      where: { eventId, videoId: metadata.videoId, isPlayed: false }
    });
    if (inPlaylist) {
      throw new Error('This song is already in the upcoming playlist.');
    }

    const recentlyPlayed = await prisma.playHistory.findFirst({
      where: { 
        eventId, 
        videoId: metadata.videoId,
        playedAt: { gt: new Date(Date.now() - 30 * 60000) } // 30 min cooldown
      }
    });
    if (recentlyPlayed) {
      throw new Error('This song was played recently.');
    }

    // Create request
    return prisma.songRequest.create({
      data: {
        eventId,
        userId,
        videoId: metadata.videoId,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        channel: metadata.channel,
        duration: metadata.duration,
      }
    });
  }

  static async updateRequestStatus(id: string, status: string) {
    return prisma.songRequest.update({
      where: { id },
      data: { status }
    });
  }

  static async toggleVote(requestId: string, userId: string) {
    const existingVote = await prisma.songRequestVote.findUnique({
      where: { requestId_userId: { requestId, userId } }
    });

    if (existingVote) {
      await prisma.songRequestVote.delete({
        where: { id: existingVote.id }
      });
      return false; // unvoted
    } else {
      await prisma.songRequestVote.create({
        data: { requestId, userId }
      });
      return true; // voted
    }
  }

  static async getTopApprovedRequest(eventId: string) {
    const requests = await prisma.songRequest.findMany({
      where: { eventId, status: 'approved' },
      include: {
        _count: { select: { votes: true } }
      }
    });

    if (requests.length === 0) return null;

    // Sort by most votes, then oldest
    requests.sort((a: any, b: any) => {
      if (b._count.votes !== a._count.votes) {
        return b._count.votes - a._count.votes;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return requests[0];
  }
}
