import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../../stores/useGameStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { ConcertArena } from '../stage/ConcertArena';
import { PlayerController } from '../controllers/PlayerController';
import { RemotePlayer } from './RemotePlayer';
import { CameraController } from '../camera/CameraController';
import { Vector3D } from '../../types';
import { getLocalPlayerLabel, selectWorldPlayers } from './playerIdentity';

interface WorldSceneProps {
  activeEmote?: string;
  isBeatDrop?: boolean;
}

export const WorldScene: React.FC<WorldSceneProps> = ({ activeEmote, isBeatDrop = false }) => {
  const { showEffects, showNames, performanceMode } = useGameStore();
  const { players, role } = useRoomStore();
  const { nickname, avatarType, myPlayerId } = usePlayerStore();

  const playerPosRef = useRef<Vector3D>({ x: 0, y: 0, z: 8 });

  const { localPlayer, remotePlayers } = selectWorldPlayers(players, myPlayerId);
  const localNickname = localPlayer?.nickname || nickname || 'Dancer';
  const localAvatarType = localPlayer?.avatarType || avatarType;
  const localLabel = getLocalPlayerLabel(localNickname, role);

  const shadowEnabled = performanceMode !== 'Low';

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 4.5, 18], fov: 50 }}
        shadows={shadowEnabled}
        className="w-full h-full"
      >
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 46, 92]} />
        <ambientLight intensity={0.38} color="#B8C7FF" />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.05}
          color="#D9E7FF"
          castShadow={shadowEnabled}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-18, 10, -10]} intensity={2.2} distance={44} color="#FF007F" />
        <pointLight position={[18, 9, -8]} intensity={2.1} distance={44} color="#00F0FF" />
        <pointLight position={[0, 15, -24]} intensity={2.5} distance={36} color="#8B5CF6" />
        <hemisphereLight args={["#172554", "#020617", 0.55]} />

        {/* 3D Concert Stage and Visual Effects */}
        <ConcertArena
          showEffects={showEffects}
          performanceMode={performanceMode}
          isBeatDrop={isBeatDrop}
        />

        {/* Local Player with Keyboard Controller */}
        <PlayerController
          myPlayerId={myPlayerId}
          nickname={localLabel}
          avatarType={localAvatarType}
          initialPosition={localPlayer?.position}
          showNames={showNames}
          playerPosRef={playerPosRef}
          activeEmote={activeEmote}
        />

        {/* Remote Players & NPC Dancers */}
        {remotePlayers.map((player) => (
          <RemotePlayer key={player.id} player={player} showNames={showNames} localPosRef={playerPosRef} />
        ))}

        {/* Third Person Camera with Lerp tracking */}
        <CameraController targetPosRef={playerPosRef} isBeatDrop={isBeatDrop} />
      </Canvas>
    </div>
  );
};
