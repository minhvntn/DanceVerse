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
import { useStageChoreography } from '../../hooks/useStageChoreography';

interface WorldSceneProps {
  activeEmote?: string;
  isBeatDrop?: boolean;
}

export const WorldScene: React.FC<WorldSceneProps> = ({ activeEmote, isBeatDrop = false }) => {
  const { showEffects, showNames, performanceMode } = useGameStore();
  const { players, role } = useRoomStore();
  const { nickname, avatarType, myPlayerId } = usePlayerStore();
  const stageChoreography = useStageChoreography();

  const playerPosRef = useRef<Vector3D>({ x: 0, y: 0, z: 8 });

  const { localPlayer, remotePlayers } = selectWorldPlayers(players, myPlayerId);
  const localNickname = localPlayer?.nickname || nickname || 'Fan';
  const localAvatarType = localPlayer?.avatarType || avatarType;
  const localLabel = getLocalPlayerLabel(localNickname, role);

  const shadowEnabled = performanceMode !== 'Low';

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 9.5, 30], fov: 52 }}
        shadows={shadowEnabled}
        className="w-full h-full"
      >
        <color attach="background" args={["#01030B"]} />
        <fog attach="fog" args={["#02030D", 58, 112]} />
        <ambientLight intensity={0.27} color="#B9C8FF" />
        <directionalLight
          position={[12, 24, 12]}
          intensity={0.82}
          color="#D9E9FF"
          castShadow={shadowEnabled}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-22, 12, -10]} intensity={1.7} distance={48} color="#FF007F" />
        <pointLight position={[22, 11, -9]} intensity={1.8} distance={48} color="#00F0FF" />
        <pointLight position={[0, 17, -28]} intensity={2.1} distance={42} color="#8B5CF6" />
        <hemisphereLight args={["#172554", "#010207", 0.42]} />

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
          <RemotePlayer
            key={player.id}
            player={player}
            showNames={showNames}
            localPosRef={playerPosRef}
            stageChoreography={stageChoreography}
          />
        ))}

        {/* Third Person Camera with Lerp tracking */}
        <CameraController targetPosRef={playerPosRef} isBeatDrop={isBeatDrop} />
      </Canvas>
    </div>
  );
};
