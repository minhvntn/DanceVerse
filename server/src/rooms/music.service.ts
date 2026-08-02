import { PlaylistItem, MusicState } from '../../../shared/types';

export class MusicService {
  private static tracks: Record<string, PlaylistItem[]> = {
    'room-neon': [
      {
        id: 'track-neon-1',
        source: 'mp3',
        sourceId: 'track-neon-1',
        originalUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3',
        title: 'Cyberpunk Odyssey',
        artist: 'DJ NeonX',
        url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3',
        duration: 135,
        addedBy: 'system',
        addedAt: Date.now()
      },
      {
        id: 'track-neon-2',
        source: 'mp3',
        sourceId: 'track-neon-2',
        originalUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
        title: 'Neon Pulse Beat',
        artist: 'SynthWave Collective',
        url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
        duration: 152,
        addedBy: 'system',
        addedAt: Date.now()
      }
    ],
    'room-beach': [
      {
        id: 'track-beach-1',
        source: 'mp3',
        sourceId: 'track-beach-1',
        originalUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b84333fd.mp3',
        title: 'Tropical Sunset Breeze',
        artist: 'DJ Island Groove',
        url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b84333fd.mp3',
        duration: 140,
        addedBy: 'system',
        addedAt: Date.now()
      },
      {
        id: 'track-beach-2',
        source: 'mp3',
        sourceId: 'track-beach-2',
        originalUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3',
        title: 'Summer Dance Festival',
        artist: 'Palm Trees Duo',
        url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3',
        duration: 160,
        addedBy: 'system',
        addedAt: Date.now()
      }
    ],
    'room-space': [
      {
        id: 'track-space-1',
        source: 'mp3',
        sourceId: 'track-space-1',
        originalUrl: 'https://cdn.pixabay.com/download/audio/2022/11/04/audio_349911961e.mp3',
        title: 'Cosmic EDM Voyage',
        artist: 'StarBoy & Luna',
        url: 'https://cdn.pixabay.com/download/audio/2022/11/04/audio_349911961e.mp3',
        duration: 148,
        addedBy: 'system',
        addedAt: Date.now()
      },
      {
        id: 'track-space-2',
        source: 'mp3',
        sourceId: 'track-space-2',
        originalUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        title: 'Galactic Supernova',
        artist: 'Astro Beats',
        url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        duration: 130,
        addedBy: 'system',
        addedAt: Date.now()
      }
    ]
  };

  private static roomMusicStates: Record<string, MusicState> = {};

  public static getPlaylist(roomId: string): PlaylistItem[] {
    return this.tracks[roomId] || [];
  }

  public static setPlaylist(roomId: string, playlist: PlaylistItem[]): void {
    this.tracks[roomId] = playlist;
  }

  public static getInitialMusicState(playlist: PlaylistItem[], roomId?: string): { musicState: MusicState; currentTrack: PlaylistItem | null } {
    const track = playlist[0] || null;
    const musicState: MusicState = {
      currentItemId: track ? track.id : null,
      trackId: track ? track.id : undefined,
      currentTrackId: track ? track.id : undefined,
      currentVideoId: track && track.source === 'youtube' ? track.sourceId : undefined,
      status: track ? 'playing' : 'idle',
      isPlaying: !!track,
      startedAt: track ? Date.now() : null,
      pausedAt: null,
      pausedPosition: 0,
      volume: 80,
      revision: 1
    };
    if (roomId) {
      this.roomMusicStates[roomId] = musicState;
    }
    return {
      musicState,
      currentTrack: track
    };
  }

  public static getMusicState(roomId: string): MusicState | undefined {
    return this.roomMusicStates[roomId];
  }

  public static setMusicState(roomId: string, state: MusicState): void {
    this.roomMusicStates[roomId] = state;
  }

  public static getCurrentPlaybackTime(musicState: MusicState): number {
    const isPlaying = musicState.isPlaying || musicState.status === 'playing';
    if (!isPlaying || !musicState.startedAt) return musicState.pausedPosition || 0;
    return (Date.now() - musicState.startedAt) / 1000;
  }

  public static addPlaylistItem(
    roomId: string,
    sourceId: string,
    originalUrl: string,
    title: string,
    addedBy: string
  ): PlaylistItem {
    const playlist = this.getPlaylist(roomId);
    const item: PlaylistItem = {
      id: `yt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source: 'youtube',
      sourceId,
      originalUrl,
      title,
      thumbnailUrl: `https://img.youtube.com/vi/${sourceId}/hqdefault.jpg`,
      addedBy,
      addedAt: Date.now()
    };
    playlist.push(item);
    this.setPlaylist(roomId, playlist);
    return item;
  }

  public static removePlaylistItem(roomId: string, itemId: string): boolean {
    const playlist = this.getPlaylist(roomId);
    const index = playlist.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    playlist.splice(index, 1);
    this.setPlaylist(roomId, playlist);
    return true;
  }

  public static reorderPlaylist(roomId: string, newOrder: string[]): PlaylistItem[] {
    const playlist = this.getPlaylist(roomId);
    const itemMap = new Map(playlist.map((item) => [item.id, item]));
    const reordered: PlaylistItem[] = [];
    newOrder.forEach((id) => {
      const found = itemMap.get(id);
      if (found) {
        reordered.push(found);
        itemMap.delete(id);
      }
    });
    // Append any remaining items not in newOrder
    itemMap.forEach((item) => reordered.push(item));
    this.setPlaylist(roomId, reordered);
    return reordered;
  }

  public static clearPlaylist(roomId: string): void {
    this.setPlaylist(roomId, []);
  }

  public static play(roomId: string, itemId?: string): MusicState {
    const state = this.roomMusicStates[roomId] || this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;
    const playlist = this.getPlaylist(roomId);
    const targetItem = itemId ? playlist.find((i) => i.id === itemId) : playlist.find((i) => i.id === state.currentItemId) || playlist[0];
    
    if (!targetItem) {
      return state;
    }

    const nextRevision = (state.revision || 0) + 1;
    const updated: MusicState = {
      currentItemId: targetItem.id,
      trackId: targetItem.id,
      currentTrackId: targetItem.id,
      currentVideoId: targetItem.source === 'youtube' ? targetItem.sourceId : undefined,
      status: 'playing',
      isPlaying: true,
      startedAt: Date.now() - (state.pausedPosition || 0) * 1000,
      pausedAt: null,
      pausedPosition: 0,
      volume: state.volume || 80,
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return updated;
  }

  public static pause(roomId: string): MusicState {
    const state = this.roomMusicStates[roomId];
    if (!state) return this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;

    const currentPos = this.getCurrentPlaybackTime(state);
    const nextRevision = (state.revision || 0) + 1;
    const updated: MusicState = {
      ...state,
      status: 'paused',
      isPlaying: false,
      startedAt: null,
      pausedAt: Date.now(),
      pausedPosition: currentPos,
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return updated;
  }

  public static resume(roomId: string): MusicState {
    const state = this.roomMusicStates[roomId];
    if (!state) return this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;

    const nextRevision = (state.revision || 0) + 1;
    const updated: MusicState = {
      ...state,
      status: 'playing',
      isPlaying: true,
      startedAt: Date.now() - (state.pausedPosition || 0) * 1000,
      pausedAt: null,
      pausedPosition: 0,
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return updated;
  }

  public static seek(roomId: string, position: number): MusicState {
    const state = this.roomMusicStates[roomId];
    if (!state) return this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;

    const nextRevision = (state.revision || 0) + 1;
    const isPlaying = state.status === 'playing' || state.isPlaying;
    const updated: MusicState = {
      ...state,
      startedAt: isPlaying ? Date.now() - position * 1000 : null,
      pausedPosition: position,
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return updated;
  }

  public static next(roomId: string): { musicState: MusicState; currentTrack: PlaylistItem | null } {
    const state = this.roomMusicStates[roomId] || this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;
    const playlist = this.getPlaylist(roomId);
    const currentIndex = playlist.findIndex((i) => i.id === state.currentItemId);
    const nextIndex = currentIndex + 1 < playlist.length ? currentIndex + 1 : 0;
    const nextTrack = playlist[nextIndex] || null;

    const nextRevision = (state.revision || 0) + 1;
    const updated: MusicState = {
      currentItemId: nextTrack ? nextTrack.id : null,
      trackId: nextTrack ? nextTrack.id : undefined,
      currentTrackId: nextTrack ? nextTrack.id : undefined,
      currentVideoId: nextTrack && nextTrack.source === 'youtube' ? nextTrack.sourceId : undefined,
      status: nextTrack ? 'playing' : 'idle',
      isPlaying: !!nextTrack,
      startedAt: nextTrack ? Date.now() : null,
      pausedAt: null,
      pausedPosition: 0,
      volume: state.volume || 80,
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return { musicState: updated, currentTrack: nextTrack };
  }

  public static previous(roomId: string): { musicState: MusicState; currentTrack: PlaylistItem | null } {
    const state = this.roomMusicStates[roomId] || this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;
    const playlist = this.getPlaylist(roomId);
    const currentIndex = playlist.findIndex((i) => i.id === state.currentItemId);
    const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : playlist.length - 1;
    const prevTrack = playlist[prevIndex] || null;

    const nextRevision = (state.revision || 0) + 1;
    const updated: MusicState = {
      currentItemId: prevTrack ? prevTrack.id : null,
      trackId: prevTrack ? prevTrack.id : undefined,
      currentTrackId: prevTrack ? prevTrack.id : undefined,
      currentVideoId: prevTrack && prevTrack.source === 'youtube' ? prevTrack.sourceId : undefined,
      status: prevTrack ? 'playing' : 'idle',
      isPlaying: !!prevTrack,
      startedAt: prevTrack ? Date.now() : null,
      pausedAt: null,
      pausedPosition: 0,
      volume: state.volume || 80,
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return { musicState: updated, currentTrack: prevTrack };
  }

  public static setVolume(roomId: string, volume: number): MusicState {
    const state = this.roomMusicStates[roomId];
    if (!state) return this.getInitialMusicState(this.getPlaylist(roomId), roomId).musicState;

    const nextRevision = (state.revision || 0) + 1;
    const updated: MusicState = {
      ...state,
      volume: Math.max(0, Math.min(100, volume)),
      revision: nextRevision
    };
    this.roomMusicStates[roomId] = updated;
    return updated;
  }

  public static async updateTrackMetadata(roomId: string, trackId: string, metadata: import('../../../shared/types').TrackMusicMetadata): Promise<PlaylistItem | null> {
    const playlist = this.getPlaylist(roomId);
    const trackIndex = playlist.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return null;

    playlist[trackIndex] = {
      ...playlist[trackIndex],
      metadata
    };

    // Attempt to persist to database if it's a live room item (id usually maps to RoomPlaylistItem.id)
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.roomPlaylistItem.update({
        where: { id: trackId },
        data: { metadata: JSON.stringify(metadata) }
      });
      await prisma.$disconnect();
    } catch (e) {
      console.warn('[MusicService] Failed to persist track metadata to DB, continuing in memory.', e);
    }

    return playlist[trackIndex];
  }
}

