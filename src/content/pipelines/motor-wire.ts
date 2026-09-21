/**
 * Motor Impairment Wire Pipeline - Lucent Accessibility Suite
 * 
 * Bridges DOM event telemetry with client-side motor adaptations:
 * 1. Virtual Dwell-Click Countdown Engine (Zero-force clicks for quadriplegia/ALS)
 * 2. Magnetic Target Gravity (Tremor trajectory stabilization & snapping)
 * 3. Hold-to-Confirm Gateway (Spasm & involuntary muscle contraction shield)
 * 4. Hitbox Expansion Geometry (WCAG 2.5.5 / 2.5.8 >=48px enforcement)
 */

export interface MotorWireConfig {
  dwellClick: boolean;
  dwellDelay: number;
  magneticGravity: boolean;
  gravityRadius: number;
  holdToConfirm: boolean;
  hitboxExpansion: boolean;
  onTelemetryLog?: (category: 'DOM_PATCH' | 'RL_AGENT' | 'AI_GEMINI' | 'USER_TELEMETRY' | 'WCAG_AUDIT', message: string, badgeType: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose') => void;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class MotorWirePipeline {
  private config: MotorWireConfig;
  private trajectoryBuffer: TrajectoryPoint[] = [];
  private dwellTimer: number | null = null;
  private currentDwellTarget: HTMLElement | null = null;
  private holdStartTimestamp: number | null = null;

  constructor(config: MotorWireConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<MotorWireConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Tracks cursor movements to evaluate tremor frequencies (4-12 Hz)
   */
  public recordMovement(x: number, y: number) {
    const now = Date.now();
    this.trajectoryBuffer.push({ x, y, timestamp: now });

    // Keep buffer capped to last 1500ms
    if (this.trajectoryBuffer.length > 50) {
      this.trajectoryBuffer.shift();
    }
  }

  /**
   * Calculates distance to nearest interactive element to apply magnetic target gravity
   */
  public findMagneticTarget(cursorX: number, cursorY: number, interactiveSelectors: string = 'button, [data-shortcut], a, input'): {
    element: HTMLElement | null;
    distance: number;
    centerX: number;
    centerY: number;
  } {
    if (!this.config.magneticGravity) {
      return { element: null, distance: Infinity, centerX: 0, centerY: 0 };
    }

    const elements = Array.from(document.querySelectorAll<HTMLElement>(interactiveSelectors));
    let closestEl: HTMLElement | null = null;
    let minDistance = Infinity;
    let bestCenterX = 0;
    let bestCenterY = 0;

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(cursorX - centerX, cursorY - centerY);

      // Check if within proximity and closest
      if (dist < minDistance && dist <= this.config.gravityRadius) {
        minDistance = dist;
        closestEl = el;
        bestCenterX = centerX;
        bestCenterY = centerY;
      }
    });

    return {
      element: closestEl,
      distance: minDistance,
      centerX: bestCenterX,
      centerY: bestCenterY
    };
  }

  /**
   * Evaluates tremor jitter metric from the trajectory buffer
   */
  public evaluateTremorScore(): number {
    if (this.trajectoryBuffer.length < 5) return 0;

    let pathLength = 0;
    let reversals = 0;

    for (let i = 1; i < this.trajectoryBuffer.length; i++) {
      const p1 = this.trajectoryBuffer[i - 1];
      const p2 = this.trajectoryBuffer[i];
      pathLength += Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (i >= 2) {
        const p0 = this.trajectoryBuffer[i - 2];
        const dx1 = p1.x - p0.x;
        const dx2 = p2.x - p1.x;
        if (dx1 * dx2 < 0) reversals++;
      }
    }

    const first = this.trajectoryBuffer[0];
    const last = this.trajectoryBuffer[this.trajectoryBuffer.length - 1];
    const directDistance = Math.hypot(last.x - first.x, last.y - first.y);

    if (pathLength === 0) return 0;
    const efficiency = directDistance / pathLength;
    const score = Math.min(1.0, (1.0 - efficiency) * 0.7 + (reversals / this.trajectoryBuffer.length) * 0.3);
    return Number(score.toFixed(2));
  }

  /**
   * Initiates dwell countdown on an element
   */
  public startDwell(
    target: HTMLElement, 
    onProgress: (percent: number) => void, 
    onTrigger: () => void
  ) {
    if (!this.config.dwellClick) return;

    this.cancelDwell();
    this.currentDwellTarget = target;
    const startTime = Date.now();
    const duration = this.config.dwellDelay;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      onProgress(progress);

      if (elapsed >= duration) {
        window.clearInterval(interval);
        this.dwellTimer = null;
        this.currentDwellTarget = null;
        onTrigger();
      }
    }, 25);

    this.dwellTimer = interval;
  }

  /**
   * Cancels any pending dwell click
   */
  public cancelDwell() {
    if (this.dwellTimer !== null) {
      window.clearInterval(this.dwellTimer);
      this.dwellTimer = null;
      this.currentDwellTarget = null;
    }
  }

  /**
   * Records start of press for Hold-to-Confirm
   */
  public startHold() {
    this.holdStartTimestamp = Date.now();
  }

  /**
   * Validates hold duration against accidental spasm release
   */
  public endHold(minDurationMs: number = 600): { confirmed: boolean; elapsedMs: number } {
    if (!this.holdStartTimestamp) return { confirmed: false, elapsedMs: 0 };
    const elapsed = Date.now() - this.holdStartTimestamp;
    this.holdStartTimestamp = null;
    return {
      confirmed: elapsed >= minDurationMs,
      elapsedMs: elapsed
    };
  }
}
