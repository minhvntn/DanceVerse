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

interface WorldSceneProps {
  activeEmote?: string;
  isBeatDrop?: boolean;
}

export const WorldScene: React.FC<WorldSceneProps> = ({ activeEmote, isBeatDrop = false }) => {
  const { showEffects, showNames, performanceMode } = useGameStore();
  const { players } = useRoomStore();
  const { nickname, avatarType, myPlayerId } = usePlayerStore();

  const playerPosRef = useRef<Vector3D>({ x: 0, y: 0, z: 8 });

  // Separate local player from remote players & NPCs
  const remotePlayersList = Object.values(players).filter((p) => p.id !== myPlayerId);

  const shadowEnabled = performanceMode !== 'Low';

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 4.5, 18], fov: 50 }}
        shadows={shadowEnabled}
        className="w-full h-full"
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow={shadowEnabled}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[0, 10, -10]} intensity={1.5} color="#FF007F" />
        <pointLight position={[0, 10, 10]} intensity={1} color="#00F0FF" />

        {/* 3D Concert Stage and Visual Effects */}
        <ConcertArena
          showEffects={showEffects}
          performanceMode={performanceMode}
          isBeatDrop={isBeatDrop}
        />

        {/* Local Player with Keyboard Controller */}
        <PlayerController
          myPlayerId={myPlayerId}
          nickname={nickname || 'Dancer'}
          avatarType={avatarType}
          showNames={showNames}
          playerPosRef={playerPosRef}
          activeEmote={activeEmote}
        />

        {/* Remote Players & NPC Dancers */}
        {remotePlayersList.map((player) => (
          <RemotePlayer key={player.id} player={player} showNames={showNames} localPosRef={playerPosRef} />
        ))}

        {/* Third Person Camera with Lerp tracking */}
        <CameraController targetPosRef={playerPosRef} isBeatDrop={isBeatDrop} />
      </Canvas>
    </div>
  );
};
