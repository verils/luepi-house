/**
 * FPS 计量器：累计帧数，按固定窗口周期结算一次返回 FPS 值。
 * 由调用方在游戏帧循环中每帧调一次 tick()。
 *
 * 结算用「实际经过时间」计算速率（而非硬编码系数），因此 windowMs
 * 只控制「多久报一次」，不影响精度：默认 1000ms 与原始内联逻辑等价。
 */
export class FpsMeter {
  private frames = 0;
  private lastTime: number;

  constructor(
    private readonly windowMs: number = 1000,
    now: number = performance.now(),
  ) {
    this.lastTime = now;
  }

  /**
   * 记一帧。
   * @returns 攒满窗口周期时返回该周期的 FPS（按实际经过时间换算）；
   *          未到结算点返回 null。
   */
  tick(now: number = performance.now()): number | null {
    this.frames++;
    const elapsed = now - this.lastTime;
    if (elapsed >= this.windowMs) {
      const fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = now;
      return fps;
    }
    return null;
  }
}
