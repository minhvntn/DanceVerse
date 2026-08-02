export const SOCKET_EVENTS = {
  // Host events
  HOST_ROOM_CREATE: 'host:room:create',
  HOST_ROOM_UPDATE: 'host:room:update',
  HOST_ROOM_END: 'host:room:end',
  HOST_PLAYLIST_ADD: 'host:playlist:add',
  HOST_PLAYLIST_REMOVE: 'host:playlist:remove',
  HOST_PLAYLIST_REORDER: 'host:playlist:reorder',
  HOST_PLAYLIST_CLEAR: 'host:playlist:clear',
  HOST_MUSIC_PLAY: 'host:music:play',
  HOST_MUSIC_PAUSE: 'host:music:pause',
  HOST_MUSIC_RESUME: 'host:music:resume',
  HOST_MUSIC_SEEK: 'host:music:seek',
  HOST_MUSIC_NEXT: 'host:music:next',
  HOST_MUSIC_PREVIOUS: 'host:music:previous',
  HOST_MUSIC_VOLUME: 'host:music:volume',
  HOST_PLAYER_KICK: 'host:player:kick',

  // Room events
  ROOM_GET: 'room:get',
  ROOM_LIST: 'room:list',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE: 'room:state',
  ROOM_ENDED: 'room:ended',
  ROOM_LEADERBOARD: 'room:leaderboard',
  ROOM_NOTIFICATION: 'room:notification',

  // Player events
  PLAYER_JOIN: 'player:join',
  PLAYER_LEFT: 'player:left',
  PLAYER_MOVE: 'player:move',
  PLAYER_ANIMATION: 'player:animation',
  PLAYER_EMOTE: 'player:emote',
  PLAYER_SCORE: 'player:score',
  PLAYER_KICKED: 'player:kicked',
  PLAYER_LIGHTSTICK_UPDATE: 'player:lightstick-update',
  PLAYER_RHYTHM_HIT: 'player:rhythm-hit',
  PLAYER_AVATAR_UPDATE: 'player:avatar-update',

  // Music events
  PLAYLIST_UPDATED: 'playlist:updated',
  MUSIC_STATE: 'music:state',
  MUSIC_SYNC: 'music:sync',
  HOST_TRACK_METADATA_UPDATE: 'host:track:metadata:update',
  TRACK_METADATA_UPDATED: 'track:metadata:updated',

  // Song Request events
  SONG_REQUEST_CREATE: 'song-request:create',
  SONG_REQUEST_VOTE: 'song-request:vote',
  SONG_REQUEST_UNVOTE: 'song-request:unvote',
  SONG_REQUEST_APPROVE: 'song-request:approve',
  SONG_REQUEST_REJECT: 'song-request:reject',
  SONG_REQUEST_PLAY_NOW: 'song-request:play-now',
  SONG_REQUEST_LIST: 'song-request:list',
  SONG_REQUEST_UPDATED: 'song-request:updated',

  // Role events
  HOST_COHOST_ASSIGN: 'host:cohost:assign',
  HOST_COHOST_REMOVE: 'host:cohost:remove',
  ROOM_ROLES_UPDATED: 'room:roles-updated',

  // Chat events
  CHAT_MESSAGE: 'chat:message',

  // System / Network
  PING: 'system:ping',
  PONG: 'system:pong',

  // System events
  ERROR: 'error',
  SOCKET_ERROR: 'socket:error',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Stage Cues
  HOST_TRIGGER_CUE: 'host:trigger-cue',
  SERVER_STAGE_CUE: 'server:stage-cue',

  // Social & Reactions
  REACTION_SEND: 'reaction:send',
  REACTION_SHOW: 'reaction:show',
  SOCIAL_WAVE: 'social:wave',

  // Friends
  FRIEND_REQUEST: 'friend:request',
  FRIEND_ACCEPT: 'friend:accept',
  FRIEND_DECLINE: 'friend:decline',
  FRIEND_STATUS: 'friend:status', // For online presence updates

  // Party
  PARTY_INVITE: 'party:invite',
  PARTY_JOIN: 'party:join',
  PARTY_LEAVE: 'party:leave',
  PARTY_UPDATE: 'party:update',
  GROUP_DANCE_START: 'group-dance:start',

  // Battle Mode
  HOST_BATTLE_START: 'host:battle:start',
  HOST_BATTLE_END: 'host:battle:end',
  BATTLE_UPDATE: 'battle:update',
  BATTLE_RESULT: 'battle:result',
  PLAYER_BATTLE_HIT: 'player:battle:hit',
  TEAM_SYNC_EVENT: 'team:sync',

  // Couple Dance / Pair
  PAIR_INVITE: 'pair:invite',
  PAIR_INVITE_RESPONSE: 'pair:invite_response',
  PAIR_UPDATE: 'pair:update',
  PAIR_ROUND_START: 'pair:round_start',
  PAIR_SYNC_RESULT: 'pair:sync_result',
  PAIR_LEAVE: 'pair:leave',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
