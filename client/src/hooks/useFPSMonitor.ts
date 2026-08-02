import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';

export const useFPSMonitor = () => {
  const [fps, setFps] = useState(60);
  const { performanceMode, setPerformanceMode } = useGameStore();
  const fpsHistory = useRef<number[]>([]);
  const lastChangeTime = useRef<number>(Date.now());
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;
      
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;

        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }

        const timeSinceLastChange = Date.now() - lastChangeTime.current;
        if (timeSinceLastChange > 15000 && fpsHistory.current.length >= 3) {
          // If FPS < 40 for 3 seconds, downgrade
          const recentLow = fpsHistory.current.slice(-3).every(f => f < 40);
          if (recentLow && performanceMode !== 'Low') {
            setPerformanceMode(performanceMode === 'High' ? 'Medium' : 'Low');
            lastChangeTime.current = Date.now();
            fpsHistory.current = [];
          }
          
          // If FPS > 55 for 10 seconds, upgrade
          if (fpsHistory.current.length >= 10) {
            const sustainedHigh = fpsHistory.current.every(f => f > 55);
            if (sustainedHigh && performanceMode !== 'High') {
              setPerformanceMode(performanceMode === 'Low' ? 'Medium' : 'High');
              lastChangeTime.current = Date.now();
              fpsHistory.current = [];
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationFrameId);
  }, [performanceMode, setPerformanceMode]);

  return fps;
};
