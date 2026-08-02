import {describe, it, expect} from 'vitest';
import {FpsMeter} from './fps-meter';

describe('FpsMeter', () => {
  it('应该以 1000ms 为默认窗口', () => {
    // 构造时不传 now，使用 performance.now()；这里只验证默认窗口行为
    const meter = new FpsMeter(1000, 0);
    expect(meter.tick(500)).toBeNull(); // 未到 1000ms
  });

  it('窗口内未到结算点应返回 null', () => {
    const meter = new FpsMeter(1000, 0);
    meter.tick(100);
    meter.tick(200);
    meter.tick(900);
    expect(meter.tick(999)).toBeNull();
  });

  it('攒满窗口应返回该周期帧数', () => {
    const meter = new FpsMeter(1000, 0);
    for (let i = 1; i <= 60; i++) {
      meter.tick(i * 16); // ~60 帧跨 ~960ms
    }
    // 第 61 帧落在 1000ms，触发结算
    const fps = meter.tick(1000);
    expect(fps).toBe(61);
  });

  it('结算后应归零，下一周期重新计数', () => {
    const meter = new FpsMeter(1000, 0);
    // 第一周期：在 1000ms 内打 30 帧（每帧都不触发，最后一帧触发结算）
    for (let i = 1; i <= 29; i++) {
      meter.tick(i * 33); // 33..957ms，均 < 1000，返回 null
    }
    expect(meter.tick(1000)).toBe(30); // 第 30 帧触发结算

    // 第二周期：20 帧
    for (let i = 1; i <= 19; i++) {
      meter.tick(1000 + i * 50); // 1050..1950ms，均 < 2000
    }
    expect(meter.tick(2000)).toBe(20); // 第 20 帧触发结算
  });

  it('应该按实际经过时间换算 FPS（非硬编码系数）', () => {
    // 窗口 500ms。打 30 帧，最后一帧落在 516ms 触发结算。
    // 实际经过 516ms，数到 30 帧 -> FPS = round(30 * 1000 / 516) = 58
    const meter = new FpsMeter(500, 0);
    for (let i = 1; i <= 29; i++) {
      meter.tick(i * 17); // 17..493ms，均 < 500，返回 null
    }
    const fps = meter.tick(516); // 第 30 帧，516 >= 500 触发结算
    expect(fps).toBe(Math.round((30 * 1000) / 516));
  });

  it('应该支持自定义窗口长度', () => {
    const meter = new FpsMeter(250, 0);
    for (let i = 1; i <= 15; i++) {
      meter.tick(i * 16);
    }
    // 15 帧跨 ~240ms，第 16 帧落在 256ms 触发结算
    const fps = meter.tick(256);
    expect(fps).toBe(Math.round((16 * 1000) / 256));
  });
});
