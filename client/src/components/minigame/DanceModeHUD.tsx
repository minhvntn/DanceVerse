import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../../../shared/events';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Volume2, VolumeX, Flame, Settings, Sliders } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { danceSfx } from '../../services/danceSfx.service';
import { TimingBar } from './TimingBar';

interface DanceModeHUDProps {
  onClose: () => void;
  onDanceModeEffect: (active: boolean) => void;
}

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
export type HitResult = 'PerfectMax' | 'Perfect' | 'Great' | 'Good' | 'Miss' | null;
export type Difficulty = 'Easy' | 'Normal' | 'Hard';

export interface DanceLevelConfig {
  level: number;
  arrows: number;
  durationMs: number;
}

export const DANCE_LEVELS: DanceLevelConfig[] = [
  { level: 1, arrows: 3, durationMs: 3200 },
  { level: 2, arrows: 4, durationMs: 3200 },
  { level: 3, arrows: 5, durationMs: 3100 },
  { level: 4, arrows: 6, durationMs: 3100 },
  { level: 5, arrows: 7, durationMs: 3000 },
  { level: 6, arrows: 8, durationMs: 3000 },
  { level: 7, arrows: 9, durationMs: 2900 },
  { level: 8, arrows: 10, durationMs: 2900 },
  { level: 9, arrows: 11, durationMs: 2800 },
];

export interface HitWindows {
  perfectMaxMs: number;
  perfectMs: number;
  greatMs: number;
  goodMs: number;
}

export const BASE_HIT_WINDOWS: Record<Difficulty, HitWindows> = {
  Easy: { perfectMaxMs: 45, perfectMs: 90, greatMs: 160, goodMs: 250 },
  Normal: { perfectMaxMs: 30, perfectMs: 70, greatMs: 130, goodMs: 200 },
  Hard: { perfectMaxMs: 20, perfectMs: 50, greatMs: 100, goodMs: 160 },
};

export const DIFFICULTY_DURATION_OFFSET: Record<Difficulty, number> = {
  Easy: 300,
  Normal: 0,
  Hard: -200,
};

const ARROW_KEYS: ArrowKey[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
export const HIT_CENTER = 0.90; // Exact normalized position (90% of the bar)
const IS_DEV = process.env.NODE_ENV === 'development';

export const DanceModeHUD: React.FC<DanceModeHUDProps> = ({ onClose, onDanceModeEffect }) => {
  // Configs
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(danceSfx.isEnabled());
  const [roundsPerLevel, setRoundsPerLevel] = useState<number>(4);

  // Game States
  const [countdown, setCountdown] = useState<number | 'DANCE!' | null>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  
  const [level, setLevel] = useState<number>(1);
  const [successfulRoundsAtLevel, setSuccessfulRoundsAtLevel] = useState<number>(0);
  const [sequence, setSequence] = useState<ArrowKey[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const [sequenceComplete, setSequenceComplete] = useState<boolean>(false);
  
  // HUD states
  const [markerProgress, setMarkerProgress] = useState<number>(0);
  const [judged, setJudged] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<HitResult>(null);
  const [earlyLate, setEarlyLate] = useState<'EARLY' | 'LATE' | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [levelUpAlert, setLevelUpAlert] = useState<{ level: number; arrows: number } | null>(null);
  const [comboMilestoneMsg, setComboMilestoneMsg] = useState<string | null>(null);
  const [isFeverActive, setIsFeverActive] = useState<boolean>(false);
  const [feverMeter, setFeverMeter] = useState<number>(0);
  
  // Battle states
  const [teamSyncMsg, setTeamSyncMsg] = useState<{ msg: string; color: string } | null>(null);
  const [battleResult, setBattleResult] = useState<{ cyan: number; pink: number } | null>(null);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [weightedScoreTotal, setWeightedScoreTotal] = useState<number>(0);

  // Live Debug State
  const [showDebug, setShowDebug] = useState<boolean>(IS_DEV);
  const [customWindows, setCustomWindows] = useState<HitWindows>(BASE_HIT_WINDOWS.Normal);
  const [lastDebugInfo, setLastDebugInfo] = useState<{
    markerProgress: number;
    hitCenter: number;
    pressedAt: number;
    targetHitTime: number;
    errorMs: number;
    earlyLate: 'EARLY' | 'LATE' | null;
    judgement: HitResult;
    sequenceProgress: string;
    isReady: boolean;
    roundNumber: number;
    level: number;
    successfulAtLevel: number;
    roundsPerLevel: number;
  } | null>(null);

  // Engine Refs (Single Source of Truth - Prevents ALL Stale Closures)
  const roundStartTimeRef = useRef<number>(0);
  const roundDurationRef = useRef<number>(3200);
  const targetHitTimeRef = useRef<number>(0);
  const judgedRef = useRef<boolean>(false);
  const sequenceRef = useRef<ArrowKey[]>([]);
  const currentIndexRef = useRef<number>(0);
  const levelRef = useRef<number>(1);
  const successfulRoundsAtLevelRef = useRef<number>(0);
  const difficultyRef = useRef<Difficulty>('Normal');
  const roundsPerLevelRef = useRef<number>(4);
  const customWindowsRef = useRef<HitWindows>(BASE_HIT_WINDOWS.Normal);
  const isPlayingRef = useRef<boolean>(false);
  const showResultRef = useRef<boolean>(false);
  const feverMeterRef = useRef<number>(0);
  const isFeverActiveRef = useRef<boolean>(false);
  const roundCountRef = useRef<number>(0);
  const feverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPairRoundIdRef = useRef<string | null>(null);

  const { currentPair, incrementStat, setCombo: setGlobalCombo, setScore: setGlobalScore, setRhythmFeedback, resetRhythmStats, perfectMaxHits, perfectHits, greatHits, goodHits, missHits, maxCombo } = usePlayerStore();
  const currentRoom = useRoomStore(s => s.currentRoom);

  // Sync refs when states change
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { successfulRoundsAtLevelRef.current = successfulRoundsAtLevel; }, [successfulRoundsAtLevel]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { roundsPerLevelRef.current = roundsPerLevel; }, [roundsPerLevel]);
  useEffect(() => { customWindowsRef.current = customWindows; }, [customWindows]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { showResultRef.current = showResult; }, [showResult]);
  useEffect(() => { feverMeterRef.current = feverMeter; }, [feverMeter]);
  useEffect(() => { isFeverActiveRef.current = isFeverActive; }, [isFeverActive]);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Update customWindows when difficulty changes
  useEffect(() => {
    setCustomWindows(BASE_HIT_WINDOWS[difficulty]);
    customWindowsRef.current = BASE_HIT_WINDOWS[difficulty];
  }, [difficulty]);

  // Initialization & Countdown
  useEffect(() => {
    onDanceModeEffect(true);
    danceSfx.init();
    resetRhythmStats();
    
    // Countdown
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else if (count === 0) setCountdown('DANCE!');
      else {
        setCountdown(null);
        setIsPlaying(true);
        isPlayingRef.current = true;
        if (!usePlayerStore.getState().currentPair) {
          startRound(1, difficultyRef.current);
        }
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      onDanceModeEffect(false);
      clearInterval(interval);
      if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
    };
  }, []); // eslint-disable-line

  const getLevelConfig = (lvl: number, diff: Difficulty) => {
    const clampedLevel = Math.max(1, Math.min(9, lvl));
    const cfg = DANCE_LEVELS.find(l => l.level === clampedLevel) || DANCE_LEVELS[0];
    const durationOffset = DIFFICULTY_DURATION_OFFSET[diff] || 0;
    return {
      level: clampedLevel,
      arrows: cfg.arrows,
      duration: Math.max(2000, cfg.durationMs + durationOffset),
    };
  };

  const startRound = (currentLevel: number, diff: Difficulty) => {
    roundCountRef.current += 1;
    const { arrows, duration } = getLevelConfig(currentLevel, diff);
    
    const seq: ArrowKey[] = [];
    for (let i = 0; i < arrows; i++) {
      seq.push(ARROW_KEYS[Math.floor(Math.random() * ARROW_KEYS.length)]);
    }
    
    sequenceRef.current = seq;
    currentIndexRef.current = 0;
    setSequence(seq);
    setCurrentIndex(0);
    setIsError(false);
    setSequenceComplete(false);
    
    judgedRef.current = false;
    setJudged(false);
    setLastResult(null);
    setEarlyLate(null);
    setWarningMsg(null);
    
    const now = performance.now();
    roundDurationRef.current = duration;
    roundStartTimeRef.current = now;
    targetHitTimeRef.current = now + duration * HIT_CENTER;
    setMarkerProgress(0);
  };

  useEffect(() => {
    if (currentIndex > 0 && currentIndex === sequence.length && sequence.length > 0) {
      setSequenceComplete(true);
      danceSfx.playSequenceReady();
    }
  }, [currentIndex, sequence.length]);

  // High-Precision Rhythm Animation Loop
  useEffect(() => {
    if (!isPlaying || showResult) return;
    let animationFrameId: number;

    const updateRhythm = () => {
      if (judgedRef.current) {
        animationFrameId = requestAnimationFrame(updateRhythm);
        return;
      }

      const elapsed = performance.now() - roundStartTimeRef.current;
      const progress = Math.max(0, Math.min(1, elapsed / roundDurationRef.current));
      
      setMarkerProgress(progress);

      // Auto-miss on timeout when ball passes 1.0 (100% of the bar)
      if (progress >= 1.0 && !judgedRef.current) {
        finishRound('Miss', 'LATE');
      }

      animationFrameId = requestAnimationFrame(updateRhythm);
    };

    animationFrameId = requestAnimationFrame(updateRhythm);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, showResult]);

  // Battle & Pair Socket Events
  useEffect(() => {
    const handleTeamSync = (e: any) => {
      const { team, type, count } = e.detail;
      const color = team === 'cyan' ? 'text-neon-cyan' : 'text-neon-pink';
      const txt = type === 'MASS_PERFECT' ? 'MASS PERFECT!' : `TEAM SYNC x${count}!`;
      setTeamSyncMsg({ msg: txt, color });
      
      danceSfx.playComboMilestone(100);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => setTeamSyncMsg(null), 3000);
    };

    const handleBattleResult = (e: any) => {
      setBattleResult(e.detail.scores);
    };

    window.addEventListener('team-sync-event', handleTeamSync);
    window.addEventListener('battle-result', handleBattleResult);
    
    // Pair Handlers
    const handlePairRoundStart = (payload: { roundId: string; startsAt: number; hitAt: number }) => {
      if (!isPlayingRef.current || showResultRef.current) return;
      const { startsAt, hitAt, roundId } = payload;
      currentPairRoundIdRef.current = roundId;
      
      const { arrows } = getLevelConfig(levelRef.current, difficultyRef.current);
      const seq: ArrowKey[] = [];
      for (let i = 0; i < arrows; i++) seq.push(ARROW_KEYS[Math.floor(Math.random() * ARROW_KEYS.length)]);
      
      sequenceRef.current = seq;
      currentIndexRef.current = 0;
      setSequence(seq);
      setCurrentIndex(0);
      setIsError(false);
      setSequenceComplete(false);
      
      judgedRef.current = false;
      setJudged(false);
      setLastResult(null);
      setEarlyLate(null);
      setWarningMsg(null);
      
      roundStartTimeRef.current = startsAt;
      roundDurationRef.current = hitAt - startsAt;
      targetHitTimeRef.current = hitAt;
      setMarkerProgress(0);
    };

    const handlePairSyncResult = (payload: any) => {
      if (!isPlayingRef.current || showResultRef.current) return;
      const { judgement, pairScoreBonus } = payload;
      
      if (judgement !== 'MISS') {
        const color = judgement === 'ULTRA' ? 'text-yellow-300' : 'text-neon-pink';
        setTeamSyncMsg({ msg: `${judgement} SYNC! +${pairScoreBonus}`, color });
        danceSfx.playComboMilestone(100);
        
        if (judgement === 'ULTRA' || judgement === 'PERFECT') {
          const anims = ['dance-perfect-01', 'dance-perfect-02', 'dance-advanced-01'];
          const move = anims[Math.floor(Math.random() * anims.length)];
          window.dispatchEvent(new CustomEvent('trigger-animation', { detail: move }));
        }
        
        setTimeout(() => setTeamSyncMsg(null), 2500);
      } else {
        setTeamSyncMsg({ msg: 'SYNC BREAK', color: 'text-red-500' });
        setTimeout(() => setTeamSyncMsg(null), 1500);
      }
    };

    socketService.on(SOCKET_EVENTS.PAIR_ROUND_START, handlePairRoundStart);
    socketService.on(SOCKET_EVENTS.PAIR_SYNC_RESULT, handlePairSyncResult);

    return () => {
      window.removeEventListener('team-sync-event', handleTeamSync);
      window.removeEventListener('battle-result', handleBattleResult);
      socketService.off(SOCKET_EVENTS.PAIR_ROUND_START, handlePairRoundStart);
      socketService.off(SOCKET_EVENTS.PAIR_SYNC_RESULT, handlePairSyncResult);
    };
  }, []);

  // Global Keydown Handler (Zero Closure Delay / Always Current Refs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current || showResultRef.current || judgedRef.current) return;
      
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      if (e.code === 'KeyF' && feverMeterRef.current >= 100 && !isFeverActiveRef.current) {
        activateFever();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault(); 
        e.stopPropagation();
        const pressedAt = performance.now();
        handleHitSpace(pressedAt);
        return;
      }

      const key = e.code as ArrowKey;
      if (ARROW_KEYS.includes(key)) {
        e.preventDefault(); 
        e.stopPropagation();
        processArrow(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []); // Intentionally empty: all handlers use live refs!

  const processArrow = (key: ArrowKey) => {
    if (!isPlayingRef.current || judgedRef.current) return;
    const seq = sequenceRef.current;
    const idx = currentIndexRef.current;

    if (idx < seq.length) {
      if (seq[idx] === key) {
        const nextIdx = idx + 1;
        currentIndexRef.current = nextIdx;
        setCurrentIndex(nextIdx);
        setIsError(false);
        danceSfx.playArrowTick();
      } else {
        // Wrong key: sequence progress resets, but LEVEL DOES NOT RESET!
        setIsError(true);
        currentIndexRef.current = 0;
        setCurrentIndex(0);
        setTimeout(() => setIsError(false), 200);
      }
    }
  };

  const activateFever = () => {
    setIsFeverActive(true);
    isFeverActiveRef.current = true;
    setFeverMeter(0);
    feverMeterRef.current = 0;
    socketService.emit('player:emote', { emote: 'fever' });
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);

    if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
    feverTimerRef.current = setTimeout(() => {
      setIsFeverActive(false);
      isFeverActiveRef.current = false;
    }, 10000);
  };

  // Direct Time-Based Judgement Engine
  const handleHitSpace = (customTimestamp?: number) => {
    if (judgedRef.current) return;

    const pressedAt = customTimestamp || performance.now();
    const seq = sequenceRef.current;
    const currentIdx = currentIndexRef.current;

    // Check if user finished entering the arrow sequence
    if (currentIdx < seq.length) {
      setWarningMsg('COMPLETE ARROWS FIRST!');
      setTimeout(() => setWarningMsg(null), 1000);
      return;
    }

    const startTime = roundStartTimeRef.current;
    const duration = roundDurationRef.current;
    const targetHitTime = targetHitTimeRef.current || (startTime + duration * HIT_CENTER);
    
    // Time error in milliseconds: negative = EARLY, positive = LATE
    const errorMs = pressedAt - targetHitTime;
    const absErrorMs = Math.abs(errorMs);
    const progress = Math.max(0, Math.min(1, (pressedAt - startTime) / duration));

    const windows = customWindowsRef.current || BASE_HIT_WINDOWS[difficultyRef.current];

    let res: HitResult = 'Miss';
    let el: 'EARLY' | 'LATE' | null = null;

    if (absErrorMs <= windows.perfectMaxMs) {
      res = 'PerfectMax';
    } else if (absErrorMs <= windows.perfectMs) {
      res = 'Perfect';
    } else if (absErrorMs <= windows.greatMs) {
      res = 'Great';
    } else if (absErrorMs <= windows.goodMs) {
      res = 'Good';
    }

    if (res !== 'Miss' && res !== 'PerfectMax') {
      el = errorMs < 0 ? 'EARLY' : 'LATE';
    }

    // Capture Debug Info for real-time overlay
    setLastDebugInfo({
      markerProgress: progress,
      hitCenter: HIT_CENTER,
      pressedAt,
      targetHitTime,
      errorMs,
      earlyLate: el,
      judgement: res,
      sequenceProgress: `${currentIdx}/${seq.length}`,
      isReady: currentIdx === seq.length,
      roundNumber: roundCountRef.current,
      level: levelRef.current,
      successfulAtLevel: successfulRoundsAtLevelRef.current,
      roundsPerLevel: roundsPerLevelRef.current,
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (res === 'PerfectMax') navigator.vibrate(25);
      else if (res === 'Perfect') navigator.vibrate(15);
    }

    finishRound(res, el);
  };

  const finishRound = (res: HitResult, el: 'EARLY' | 'LATE' | null) => {
    if (judgedRef.current) return;
    judgedRef.current = true;
    setJudged(true);
    setLastResult(res);
    setEarlyLate(el);
    setTotalNotes((t) => t + 1);
    
    if (res) danceSfx.playJudgement(res);

    let pts = 0, weight = 0, feverAdd = 0;
    if (res === 'PerfectMax') { pts = 120; weight = 100; feverAdd = 3; }
    else if (res === 'Perfect') { pts = 100; weight = 95; feverAdd = 2; }
    else if (res === 'Great') { pts = 75; weight = 80; feverAdd = 1; }
    else if (res === 'Good') { pts = 50; weight = 60; feverAdd = 0.5; }
    else { pts = 0; weight = 0; feverAdd = 0; }

    setWeightedScoreTotal(w => w + weight);

    // On MISS: Combo resets, but LEVEL AND PROGRESSION DO NOT RESET!
    if (res === 'Miss') {
      setCombo(0);
      setGlobalCombo(0);
      setRhythmFeedback('miss');
      incrementStat('miss');

      if (currentPair) {
        socketService.emit('player:rhythm-hit', {
          rating: 'miss',
          scoreAdd: 0,
          energyAdd: 0,
          combo: 0,
          hitTime: Date.now(),
          roundId: currentPairRoundIdRef.current
        });
      } else {
        setTimeout(() => startRound(levelRef.current, difficultyRef.current), 1000);
      }
      return;
    }

    // On SUCCESS (Good / Great / Perfect / PerfectMax)
    if (isFeverActiveRef.current) pts *= 2;
    if (!isFeverActiveRef.current) {
      setFeverMeter(prev => {
        const next = Math.min(100, prev + feverAdd);
        feverMeterRef.current = next;
        return next;
      });
    }

    setScore(s => s + pts);
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setGlobalCombo(nextCombo);
    setGlobalScore(usePlayerStore.getState().score + pts);
    
    const ratingStr = (res || 'Good').toLowerCase();
    setRhythmFeedback(ratingStr);
    incrementStat(ratingStr);

    if (res === 'PerfectMax') {
      window.dispatchEvent(new CustomEvent('trigger-floor-pulse'));
    }

    if (res === 'PerfectMax' || res === 'Perfect' || nextCombo % 10 === 0 || currentPair) {
      socketService.emit('player:rhythm-hit', {
        rating: ratingStr.replace('max', ''),
        scoreAdd: pts,
        energyAdd: 1,
        combo: nextCombo,
        hitTime: currentPair ? Date.now() : undefined,
        roundId: currentPairRoundIdRef.current || undefined
      });
    }

    const roomState = useRoomStore.getState().currentRoom;
    if (roomState?.battleState === 'active') {
      socketService.emit('player:battle:hit', {
        judgement: ratingStr,
        combo: nextCombo
      });
    }

    // Combo milestones
    if ([10, 25, 50, 100].includes(nextCombo) || (nextCombo > 100 && nextCombo % 100 === 0)) {
      danceSfx.playComboMilestone(nextCombo);
      const msgs: Record<number, string> = { 10: 'NICE!', 25: 'AWESOME!', 50: 'UNSTOPPABLE!', 100: 'GODLIKE!' };
      setComboMilestoneMsg(`${nextCombo} COMBO - ${msgs[nextCombo] || 'CRAZY!'}`);
      setTimeout(() => setComboMilestoneMsg(null), 2000);
    }

    // LEVEL PROGRESSION SYSTEM (Based on successful rounds at current level)
    let currentLvl = levelRef.current;
    const nextSuccessCount = successfulRoundsAtLevelRef.current + 1;
    successfulRoundsAtLevelRef.current = nextSuccessCount;
    setSuccessfulRoundsAtLevel(nextSuccessCount);

    const requiredRounds = roundsPerLevelRef.current;
    if (nextSuccessCount >= requiredRounds && currentLvl < 9) {
      const nextLvl = currentLvl + 1;
      levelRef.current = nextLvl;
      setLevel(nextLvl);
      successfulRoundsAtLevelRef.current = 0;
      setSuccessfulRoundsAtLevel(0);
      
      const nextArrows = DANCE_LEVELS.find(l => l.level === nextLvl)?.arrows || (2 + nextLvl);
      setLevelUpAlert({ level: nextLvl, arrows: nextArrows });
      danceSfx.playLevelUp();
      setTimeout(() => setLevelUpAlert(null), 1600);
      currentLvl = nextLvl;
    }
    
    if (!currentPair) {
      setTimeout(() => startRound(currentLvl, difficultyRef.current), 800);
    }
  };

  const handleEndDance = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setShowResult(true);
    showResultRef.current = true;
  };

  const closeCompletely = () => {
    onDanceModeEffect(false);
    onClose();
  };

  const accuracy = totalNotes > 0 ? (weightedScoreTotal / totalNotes).toFixed(1) : '100.0';

  const getRank = () => {
    const acc = parseFloat(accuracy);
    if (acc >= 95) return 'S';
    if (acc >= 85) return 'A';
    if (acc >= 70) return 'B';
    return 'C';
  };

  // Dynamic responsive arrow sizing & icon scale based on arrow count
  const currentArrowsCount = sequence.length;
  const arrowBoxSizeClass = currentArrowsCount <= 5 
    ? 'w-12 h-12 md:w-14 md:h-14' 
    : currentArrowsCount <= 8 
      ? 'w-10 h-10 md:w-11 md:h-11' 
      : 'w-8 h-8 md:w-9 md:h-9';
  
  const arrowIconSize = currentArrowsCount <= 5 ? 28 : currentArrowsCount <= 8 ? 22 : 18;

  // Active Hit Windows for visual brackets scaling
  const activeWindows = customWindowsRef.current || BASE_HIT_WINDOWS[difficulty];
  const currentDuration = roundDurationRef.current || 3000;
  const goodWidthPercent = Math.min(30, ((activeWindows.goodMs * 2) / currentDuration) * 100);
  const perfectWidthPercent = Math.min(20, ((activeWindows.perfectMs * 2) / currentDuration) * 100);
  const perfectMaxWidthPercent = Math.max(3, Math.min(8, ((activeWindows.perfectMaxMs * 2) / currentDuration) * 100));

  // Results Screen
  if (showResult) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto animate-fade-in">
        <div className="flex flex-col items-center max-w-2xl">
          {battleResult ? (
            <>
              <h2 className="text-4xl font-black italic tracking-widest text-white mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                BATTLE RESULT
              </h2>
              <div className="flex items-center justify-center gap-12 my-8 w-full max-w-2xl">
                <div className={`flex flex-col items-center ${battleResult.cyan > battleResult.pink ? 'scale-125' : 'opacity-70'}`}>
                  <div className="text-3xl font-black text-neon-cyan mb-2 tracking-wider">CYAN TEAM</div>
                  <div className="text-5xl font-black text-white">{battleResult.cyan.toLocaleString()}</div>
                  {battleResult.cyan > battleResult.pink && <div className="mt-2 text-yellow-400 font-bold uppercase tracking-widest">WINNER!</div>}
                </div>
                <div className="text-4xl font-black text-white/30 italic">VS</div>
                <div className={`flex flex-col items-center ${battleResult.pink > battleResult.cyan ? 'scale-125' : 'opacity-70'}`}>
                  <div className="text-3xl font-black text-neon-pink mb-2 tracking-wider">PINK TEAM</div>
                  <div className="text-5xl font-black text-white">{battleResult.pink.toLocaleString()}</div>
                  {battleResult.pink > battleResult.cyan && <div className="mt-2 text-yellow-400 font-bold uppercase tracking-widest">WINNER!</div>}
                </div>
              </div>
              <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left">
                <div className="text-sm font-bold text-white/50 mb-2 uppercase tracking-widest">Your Contribution</div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/70">Personal Score</span>
                  <span className="font-bold text-white">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Max Combo</span>
                  <span className="font-bold text-white">{maxCombo}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-5xl font-black italic tracking-widest text-white mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                DANCE COMPLETE!
              </h2>
              <div className="text-xl font-bold text-white/70 mb-8 tracking-widest">
                RANK: <span className="text-yellow-400 text-3xl ml-2">{getRank()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-left bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 w-80">
                <div className="text-white/60 font-bold">SCORE</div>
                <div className="text-white font-black text-right text-xl">{score.toLocaleString()}</div>
                
                <div className="text-white/60 font-bold">MAX COMBO</div>
                <div className="text-white font-black text-right text-xl">{maxCombo}</div>
                
                <div className="text-white/60 font-bold">ACCURACY</div>
                <div className="text-neon-cyan font-black text-right text-xl">{accuracy}%</div>
              </div>
              
              <div className="flex gap-4 text-sm font-bold">
                <div className="flex flex-col items-center">
                  <span className="text-white">PERFECT+</span>
                  <span className="text-2xl mt-1 text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]">{perfectMaxHits}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-yellow-400">PERFECT</span>
                  <span className="text-2xl mt-1 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)]">{perfectHits}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-neon-cyan">GREAT</span>
                  <span className="text-2xl mt-1 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,1)]">{greatHits}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-green-400">GOOD</span>
                  <span className="text-2xl mt-1 text-green-400">{goodHits}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-red-400">MISS</span>
                  <span className="text-2xl mt-1 text-red-400">{missHits}</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={closeCompletely}
            className="mt-12 px-8 py-3 bg-white text-black font-black text-xl italic tracking-widest rounded hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
          >
            EXIT DANCE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-x-0 bottom-[140px] md:bottom-7 z-[100] flex flex-col items-center pointer-events-none px-3 md:px-4 ${isFeverActive ? 'shadow-[inset_0_0_80px_rgba(255,43,155,0.15)]' : ''}`}>
      
      {/* Floating Judgement / Level Up / Warning Alerts above HUD */}
      <div className="absolute -top-12 sm:-top-14 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 whitespace-nowrap">
        {levelUpAlert ? (
          <div className="flex flex-col items-center animate-pop-in bg-slate-950/95 border border-neon-cyan px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.7)]">
            <span className="text-neon-cyan font-black text-xs md:text-sm tracking-[0.2em]">
              LEVEL UP! LEVEL {levelUpAlert.level} ({levelUpAlert.arrows} ARROWS)
            </span>
          </div>
        ) : comboMilestoneMsg ? (
          <span className="text-neon-pink font-black tracking-widest text-xs md:text-sm animate-bounce drop-shadow-[0_0_15px_rgba(255,43,155,0.8)] bg-slate-950/85 px-3 py-1 rounded-full border border-pink-500/30">
            {comboMilestoneMsg}
          </span>
        ) : warningMsg ? (
          <span className="text-rose-500 font-black tracking-widest text-xs md:text-sm bg-slate-950/90 px-3 py-1 rounded-full border border-rose-500/50 animate-shake">
            {warningMsg}
          </span>
        ) : lastResult ? (
          <div className="flex flex-col items-center bg-slate-950/85 backdrop-blur-sm px-4 py-1 rounded-full border border-white/15 shadow-xl">
            <div className={`font-black text-base md:text-xl tracking-widest italic animate-pop-in ${
              lastResult === 'PerfectMax' ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)] scale-110' : 
              lastResult === 'Perfect' ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]' : 
              lastResult === 'Great' ? 'text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]' : 
              lastResult === 'Good' ? 'text-green-400' : 'text-rose-500'
            }`}>
              {lastResult === 'PerfectMax' ? '✨ PERFECT MAX ✨' : `${lastResult}!`}
            </div>
            {earlyLate && (
              <div className={`text-[9px] font-black uppercase tracking-widest animate-pop-in ${earlyLate === 'EARLY' ? 'text-cyan-300' : 'text-amber-300'}`}>
                {earlyLate}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Main Audition Compact HUD Panel */}
      <div 
        className={`pointer-events-auto relative w-full max-w-3xl bg-[rgba(5,10,28,0.85)] border ${
          isFeverActive 
            ? 'border-neon-pink shadow-[0_0_30px_rgba(255,43,155,0.4)]' 
            : 'border-[rgba(120,180,255,0.22)] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
        } rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col items-center backdrop-blur-md transition-all duration-300`}
        style={{ width: 'min(900px, calc(100vw - 24px))' }}
      >
        {/* Fever Indicator Bar (Top Edge of Panel) */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-36 md:w-48 h-1.5 bg-slate-950 rounded-b-md overflow-hidden border border-t-0 border-white/20 shadow-md">
          <div 
            className={`h-full transition-all duration-300 ${
              isFeverActive 
                ? 'bg-gradient-to-r from-neon-pink to-neon-cyan animate-pulse' 
                : feverMeter >= 100 
                  ? 'bg-neon-pink shadow-[0_0_10px_rgba(255,43,155,1)]' 
                  : 'bg-neon-blue'
            }`} 
            style={{ width: `${isFeverActive ? 100 : feverMeter}%` }} 
          />
        </div>

        {/* TOP ROW: SCORE | LEVEL & ARROWS | ACCURACY | CONTROLS */}
        <div className="w-full flex items-center justify-between gap-2 px-1 mb-2">
          
          {/* Left Side: Audio, Debug, Difficulty & Score */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={() => { const newVal = !sfxEnabled; setSfxEnabled(newVal); danceSfx.setEnabled(newVal); }} 
              className={`p-1.5 rounded-lg bg-slate-900/80 border border-white/10 transition-colors ${sfxEnabled ? 'text-neon-cyan' : 'text-slate-500'}`}
              title="Toggle SFX"
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {IS_DEV && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`p-1.5 rounded-lg text-xs transition-colors border ${showDebug ? 'text-green-400 bg-green-950/60 border-green-500/40' : 'text-slate-500 bg-slate-900/80 border-white/10'}`}
                title="Toggle Live Hit Debug & Calibration Panel"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {!isPlaying && !countdown && (
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="bg-slate-900/90 text-xs text-slate-200 border border-white/15 rounded-lg px-2 py-1 outline-none font-bold tracking-wider hidden sm:block"
              >
                <option value="Easy">Easy</option>
                <option value="Normal">Normal</option>
                <option value="Hard">Hard</option>
              </select>
            )}

            {/* Score Pill */}
            <div className="flex items-center gap-1.5 bg-slate-900/85 border border-white/10 px-2.5 py-1 rounded-xl shadow-sm">
              <span className="text-[9px] text-neon-cyan font-black tracking-wider uppercase">SCORE</span>
              <span className="text-sm md:text-base font-black text-white font-mono">{score.toLocaleString()}</span>
            </div>
          </div>

          {/* Center: Level & Arrows Badge + Progress Pips */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="bg-slate-900/95 text-white px-2.5 md:px-3 py-0.5 rounded-full text-[11px] md:text-xs font-black tracking-wider uppercase border border-neon-cyan/40 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                LEVEL {level} • {DANCE_LEVELS.find(l => l.level === level)?.arrows || (2 + level)} ARROWS
              </span>
              <span className="bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-white/10 hidden sm:inline-block">
                {difficulty}
              </span>
            </div>

            {/* Level Progress Pips */}
            {level < 9 && (
              <div className="flex items-center gap-1.5 mt-1" title={`Rounds: ${successfulRoundsAtLevel}/${roundsPerLevel}`}>
                {Array.from({ length: roundsPerLevel }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx < successfulRoundsAtLevel 
                        ? 'bg-neon-cyan shadow-[0_0_6px_rgba(0,240,255,1)] scale-110' 
                        : 'bg-slate-800 border border-white/10'
                    }`} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Fever Trigger, Accuracy & Close Button */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Fever Ready Button */}
            {feverMeter >= 100 && !isFeverActive && (
              <button 
                onClick={activateFever} 
                className="hidden sm:flex items-center gap-1 bg-neon-pink/90 text-white px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider animate-pulse border border-white/40 shadow-[0_0_10px_rgba(255,43,155,0.8)]"
              >
                <Flame className="w-3 h-3" /> FEVER (F)
              </button>
            )}

            {/* Accuracy Pill */}
            <div className="flex items-center gap-1.5 bg-slate-900/85 border border-white/10 px-2.5 py-1 rounded-xl shadow-sm">
              <span className="text-[9px] text-emerald-400 font-black tracking-wider uppercase">ACC</span>
              <span className="text-sm md:text-base font-black text-white font-mono">{accuracy}%</span>
              <span className="text-xs font-black text-yellow-400">({getRank()})</span>
            </div>

            {/* Close Button */}
            <button 
              onClick={handleEndDance} 
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-white/10"
              title="Exit Dance Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MIDDLE ROW: Dynamic Responsive Arrow Sequence */}
        <div className={`flex flex-wrap items-center justify-center gap-1.5 md:gap-2 my-1.5 md:my-2 max-w-full px-2 transition-transform ${isError ? 'animate-shake' : ''}`}>
          {sequence.map((arrow, i) => {
            const isCompleted = i < currentIndex;
            let Icon = ArrowUp;
            if (arrow === 'ArrowDown') Icon = ArrowDown;
            if (arrow === 'ArrowLeft') Icon = ArrowLeft;
            if (arrow === 'ArrowRight') Icon = ArrowRight;

            return (
              <div 
                key={`${i}-${arrow}`} 
                className={`${arrowBoxSizeClass} flex items-center justify-center rounded-lg transition-all duration-150 ${
                  isCompleted 
                    ? 'border-2 border-neon-cyan text-neon-cyan bg-neon-cyan/15 shadow-[0_0_18px_rgba(0,240,255,0.7)] scale-105' 
                    : isError 
                      ? 'border-2 border-rose-500 text-rose-500 bg-rose-950/30' 
                      : 'border border-slate-700 text-slate-400 bg-slate-900/90'
                }`}
              >
                <Icon size={arrowIconSize} strokeWidth={3} />
              </div>
            );
          })}
        </div>

        {/* BOTTOM ROW: Unified Rhythm Timing Bar with Distinct TimingBall & HitZone */}
        <TimingBar
          progress={markerProgress}
          hitCenter={HIT_CENTER}
          goodWidthPercent={goodWidthPercent}
          perfectWidthPercent={perfectWidthPercent}
          perfectMaxWidthPercent={perfectMaxWidthPercent}
          isFeverActive={isFeverActive}
          isReadyToHit={sequenceComplete && !judged}
          judged={judged}
        />

        {/* Battle Announcements if active */}
        {teamSyncMsg && (
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-30">
            <div className={`font-black text-3xl md:text-4xl italic tracking-widest uppercase animate-pulse ${teamSyncMsg.color} drop-shadow-[0_0_20px_currentColor]`}>
              {teamSyncMsg.msg}
            </div>
          </div>
        )}

        {/* Team Battle Bar if active */}
        {currentRoom?.battleState === 'active' && currentRoom?.battleScores && (
          <div className="w-full flex items-center justify-between gap-4 mt-1 bg-black/40 px-4 py-1.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-neon-cyan font-black text-xs uppercase tracking-wider">CYAN</span>
              <span className="text-white text-xs font-bold font-mono">{currentRoom.battleScores.cyan.toLocaleString()}</span>
            </div>
            
            <div className="flex-1 h-2 rounded-full bg-black/50 border border-white/10 overflow-hidden flex">
              <div 
                className="h-full bg-neon-cyan transition-all duration-300"
                style={{ width: `${currentRoom.battleScores.cyan + currentRoom.battleScores.pink > 0 ? (currentRoom.battleScores.cyan / (currentRoom.battleScores.cyan + currentRoom.battleScores.pink)) * 100 : 50}%` }}
              />
              <div 
                className="h-full bg-neon-pink transition-all duration-300"
                style={{ width: `${currentRoom.battleScores.cyan + currentRoom.battleScores.pink > 0 ? (currentRoom.battleScores.cyan / (currentRoom.battleScores.cyan + currentRoom.battleScores.pink)) * 100 : 50}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-bold font-mono">{currentRoom.battleScores.pink.toLocaleString()}</span>
              <span className="text-neon-pink font-black text-xs uppercase tracking-wider">PINK</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Development Debug & Calibration Panel */}
      {showDebug && (
        <div className="fixed bottom-6 right-6 z-[120] pointer-events-auto bg-slate-950/90 text-green-400 text-xs font-mono p-4 rounded-xl border border-green-500/40 shadow-2xl backdrop-blur-md max-w-sm flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-green-500/20 pb-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-green-400" /> TIMING DEBUG ENGINE
            </span>
            <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div>Marker Prog: <span className="text-white">{markerProgress.toFixed(3)}</span></div>
            <div>Hit Center: <span className="text-white">{HIT_CENTER.toFixed(3)}</span></div>
            
            {lastDebugInfo ? (
              <>
                <div>Pressed: <span className="text-white">{lastDebugInfo.pressedAt.toFixed(1)}ms</span></div>
                <div>Target: <span className="text-white">{lastDebugInfo.targetHitTime.toFixed(1)}ms</span></div>
                <div className="col-span-2">
                  Error: <span className={lastDebugInfo.errorMs < 0 ? 'text-cyan-300' : 'text-amber-300'}>
                    {lastDebugInfo.errorMs > 0 ? '+' : ''}{lastDebugInfo.errorMs.toFixed(1)}ms ({lastDebugInfo.earlyLate || 'CENTER'})
                  </span>
                </div>
                <div>Judgement: <span className="font-bold text-yellow-300">{lastDebugInfo.judgement}</span></div>
                <div>Sequence: <span className="text-white">{lastDebugInfo.sequenceProgress}</span></div>
                <div>Round: <span className="text-white">#{lastDebugInfo.roundNumber}</span></div>
                <div>Level Success: <span className="text-white">{lastDebugInfo.successfulAtLevel}/{lastDebugInfo.roundsPerLevel}</span></div>
              </>
            ) : (
              <div className="col-span-2 text-slate-500 italic">Hit SPACE to record timing sample</div>
            )}
          </div>

          {/* Quick Calibration Sliders */}
          <div className="border-t border-green-500/20 pt-2 flex flex-col gap-1.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calibration Windows (ms)</div>
            
            <div className="flex items-center justify-between text-[10px]">
              <span>P-Max: ±{customWindows.perfectMaxMs}ms</span>
              <input 
                type="range" min="10" max="60" value={customWindows.perfectMaxMs} 
                onChange={(e) => setCustomWindows({ ...customWindows, perfectMaxMs: Number(e.target.value) })}
                className="w-24 accent-green-400"
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span>Perfect: ±{customWindows.perfectMs}ms</span>
              <input 
                type="range" min="30" max="120" value={customWindows.perfectMs} 
                onChange={(e) => setCustomWindows({ ...customWindows, perfectMs: Number(e.target.value) })}
                className="w-24 accent-green-400"
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span>Great: ±{customWindows.greatMs}ms</span>
              <input 
                type="range" min="60" max="180" value={customWindows.greatMs} 
                onChange={(e) => setCustomWindows({ ...customWindows, greatMs: Number(e.target.value) })}
                className="w-24 accent-green-400"
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span>Good: ±{customWindows.goodMs}ms</span>
              <input 
                type="range" min="100" max="300" value={customWindows.goodMs} 
                onChange={(e) => setCustomWindows({ ...customWindows, goodMs: Number(e.target.value) })}
                className="w-24 accent-green-400"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1">
              <span>Rounds/Level: {roundsPerLevel}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setRoundsPerLevel(1)} 
                  className={`px-1.5 py-0.5 rounded text-[9px] ${roundsPerLevel === 1 ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  1 (Fast Test)
                </button>
                <button 
                  onClick={() => setRoundsPerLevel(4)} 
                  className={`px-1.5 py-0.5 rounded text-[9px] ${roundsPerLevel === 4 ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  4 (Normal)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <span className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-neon-cyan drop-shadow-[0_0_30px_rgba(0,240,255,0.8)] animate-pop-in">
            {countdown}
          </span>
        </div>
      )}

      {/* Mobile Touch Controls */}
      <div className="pointer-events-auto fixed bottom-6 left-0 right-0 flex justify-between items-end px-6 md:hidden">
        <div className="grid grid-cols-3 gap-2 w-32 h-32">
          <div />
          <button onClick={() => processArrow('ArrowUp')} className="bg-slate-900/90 border border-white/20 rounded-xl flex items-center justify-center active:bg-slate-700 text-white shadow-lg"><ArrowUp /></button>
          <div />
          <button onClick={() => processArrow('ArrowLeft')} className="bg-slate-900/90 border border-white/20 rounded-xl flex items-center justify-center active:bg-slate-700 text-white shadow-lg"><ArrowLeft /></button>
          <button onClick={() => processArrow('ArrowDown')} className="bg-slate-900/90 border border-white/20 rounded-xl flex items-center justify-center active:bg-slate-700 text-white shadow-lg"><ArrowDown /></button>
          <button onClick={() => processArrow('ArrowRight')} className="bg-slate-900/90 border border-white/20 rounded-xl flex items-center justify-center active:bg-slate-700 text-white shadow-lg"><ArrowRight /></button>
        </div>

        <div className="flex flex-col gap-4">
          {feverMeter >= 100 && !isFeverActive && (
            <button onClick={activateFever} className="w-16 h-16 rounded-full bg-neon-pink border-2 border-white/50 animate-pulse text-white font-black text-xs shadow-[0_0_15px_rgba(255,43,155,0.8)]">FEVER</button>
          )}
          <button 
            onClick={() => handleHitSpace(performance.now())} 
            className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple border-2 border-white/30 shadow-[0_0_20px_rgba(255,43,155,0.5)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="font-black text-white text-xl tracking-widest italic">HIT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
