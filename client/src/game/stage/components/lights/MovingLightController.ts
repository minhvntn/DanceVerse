import { MovingLightPattern } from '../../../../../../shared/types';
import * as THREE from 'three';

export interface MovingLightState {
  pattern: MovingLightPattern;
  color: string;
  intensity: number;
  speed: number;
  startTime: number;
}

class MovingLightControllerClass {
  public state: MovingLightState = {
    pattern: 'IDLE',
    color: '#FFFFFF',
    intensity: 1.0,
    speed: 1.0,
    startTime: 0,
  };

  public setCue(
    pattern: MovingLightPattern,
    color?: string,
    intensity: number = 1.0,
    speed: number = 1.0
  ) {
    this.state.pattern = pattern;
    if (color) this.state.color = color;
    this.state.intensity = intensity;
    this.state.speed = speed;
    this.state.startTime = performance.now() / 1000;
  }

  public getFixtureAngles(
    index: number,
    totalFixtures: number,
    time: number,
    position: THREE.Vector3
  ): { pan: number; tilt: number } {
    const elapsed = time - this.state.startTime;
    const speed = this.state.speed;
    const { pattern } = this.state;
    
    // Default resting positions
    let pan = 0;
    let tilt = Math.PI / 2; // Pointing straight down usually
    
    // Normalized index (-1 to 1)
    const ni = totalFixtures > 1 ? (index / (totalFixtures - 1)) * 2 - 1 : 0;

    switch (pattern) {
      case 'IDLE':
        // Slow lazy sweep
        pan = Math.sin(time * 0.3 * speed + index * 0.5) * 0.4;
        tilt = Math.PI / 2 + Math.cos(time * 0.2 * speed + index * 0.3) * 0.2;
        break;
        
      case 'SWEEP_LEFT_RIGHT':
        pan = Math.sin(time * 1.5 * speed) * 1.2;
        tilt = Math.PI / 2 + 0.3; // slightly forward
        break;
        
      case 'SWEEP_CENTER_OUT':
        pan = Math.sin(time * 2 * speed) * 0.8 * (ni > 0 ? 1 : -1);
        tilt = Math.PI / 2 + 0.2;
        break;
        
      case 'CROSS':
        pan = ni > 0 ? -0.8 : 0.8;
        // Oscillate crossing
        pan += Math.sin(time * 1.5 * speed) * 0.4 * (ni > 0 ? 1 : -1);
        tilt = Math.PI / 2 + Math.sin(time * 2 * speed + index) * 0.2;
        break;
        
      case 'FAN':
        // Fan out statically, then pulse tilt
        pan = ni * 1.2;
        tilt = Math.PI / 2 + Math.sin(time * 2.5 * speed) * 0.3;
        break;
        
      case 'AUDIENCE_SCAN':
        // Pan left/right together, tilt up to audience
        pan = Math.sin(time * 1.2 * speed) * 1.4;
        tilt = Math.PI / 2 - 0.4; // Pointing up towards audience
        break;
        
      case 'DJ_FOCUS':
        // Point all fixtures towards DJ booth (approx [0, 1.5, -12])
        // The fixture is typically at z=-13.2 for Top Truss
        // If the fixture is at z=-13, and DJ is at z=-21, target is behind it.
        const targetX = -position.x; 
        const targetZ = -19 - position.z; // DJ booth is far back
        pan = Math.atan2(targetX, targetZ);
        tilt = Math.PI / 2 + 0.4;
        break;
        
      case 'DROP_BURST':
        // Snap to fan and shake wildly, but we want it deterministic
        if (elapsed < 0.5) {
          pan = ni * 1.5;
          tilt = Math.PI / 2 + (Math.sin(time * 20) * 0.2); // jitter
        } else {
          // Fall back to intense sweep
          pan = Math.sin(time * 3 * speed) * 1.2;
          tilt = Math.PI / 2 + 0.2;
        }
        break;
    }

    return { pan, tilt };
  }
}

export const MovingLightController = new MovingLightControllerClass();
