import { RoomStatePayload } from '../../types';

interface InitialRoomStateActions {
  setRoomState: (payload: RoomStatePayload) => void;
  setMyPlayerId: (id: string) => void;
}

export function applyInitialRoomState(
  payload: RoomStatePayload,
  actions: InitialRoomStateActions
): void {
  actions.setRoomState(payload);
  if (payload.myPlayerId) {
    actions.setMyPlayerId(payload.myPlayerId);
  }
}
