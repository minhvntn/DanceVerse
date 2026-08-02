import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
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
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { BeatClock } from '../stage/BeatClock';

const BeatClockUpdater = () => {
  useFrame(() => {
    BeatClock.update();
  });
  return null;
};

const ScenePrewarmer: React.FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { gl, scene, camera } = useThree();
  const framesRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    try {
      gl.compile(scene, camera);
    } catch {
      // ignore
    }
  }, [gl, scene, camera]);

  useFrame(() => {
    if (readyRef.current) return;
    framesRef.current += 1;
    if (framesRef.current >= 3) {
      readyRef.current = true;
      onReady?.();
    }
  });

  return <Preload all />;
};

interface WorldSceneProps {
  activeEmote?: string;
  activeEmoteStartedAt?: number;
  isBeatDrop?: boolean;
  onSceneReady?: () => void;
}

export const WorldScene: React.FC<WorldSceneProps> = ({ activeEmote, activeEmoteStartedAt, isBeatDrop = false, onSceneReady }) => {
  const { showEffects, showNames, performanceMode } = useGameStore();
  const { players, role } = useRoomStore();
  const { nickname, avatarType, myPlayerId } = usePlayerStore();
  const stageChoreography = useStageChoreography();

  const playerPosRef = useRef<Vector3D>({ x: 0, y: 0, z: 8 });

  const energy = useRoomStore((state) => state.energy);

  const { localPlayer, remotePlayers } = selectWorldPlayers(players, myPlayerId);
  const localNickname = localPlayer?.nickname || nickname || 'Fan';
  const localAvatarType = localPlayer?.avatarType || avatarType;
  const localLabel = getLocalPlayerLabel(localNickname, role);

  const shadowEnabled = performanceMode !== 'Low';

  const remotePlayerComponents = React.useMemo(() => {
    return remotePlayers.map((player) => (
      <RemotePlayer
        key={player.id}
        player={player}
        showNames={showNames}
        localPosRef={playerPosRef}
        stageChoreography={stageChoreography}
      />
    ));
  }, [remotePlayers, showNames, stageChoreography]);

  return (
    <div className="w-full h-full absolute inset-0">
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 9.5, 30], fov: 52 }}
          shadows={shadowEnabled}
          className="w-full h-full"
        >
        <ScenePrewarmer onReady={onSceneReady} />
        <BeatClockUpdater />
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
          energy={energy}
          stageChoreography={stageChoreography}
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
          activeEmoteStartedAt={activeEmoteStartedAt}
          team={localPlayer?.team}
        />

        {/* Remote Players & NPC Dancers */}
        {remotePlayerComponents}

        {/* Third Person Camera with Lerp tracking */}
        <CameraController targetPosRef={playerPosRef} isBeatDrop={isBeatDrop} />
      </Canvas>
      </ErrorBoundary>
    </div>
  );
};
