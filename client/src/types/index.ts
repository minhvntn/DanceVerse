export * from '../../../shared/types';
export * from '../../../shared/events';

export type ConnectionStatus = 'Connecting' | 'Connected' | 'Reconnecting' | 'Disconnected';
export type PageStep = 'landing' | 'login' | 'register' | 'avatar' | 'lobby' | 'game' | 'oauth' | 'customize' | 'profile' | 'djcontrol';
