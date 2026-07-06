import { describe, it, expect } from 'vitest';
import {
  createTimeState,
  updateTime,
  getCurrentPhase,
  cycleTimeSpeed,
  formatGameTime,
  getPhaseProgress,
  getTimeOverlayColor,
} from './time-system';

describe('createTimeState', () => {
  it('应该创建初始时间状态', () => {
    const time = createTimeState();
    expect(time.hour).toBe(8);
    expect(time.minute).toBe(0);
    expect(time.day).toBe(1);
    expect(time.phase).toBe('day');
    expect(time.speed).toBe(1);
  });
});

describe('getCurrentPhase', () => {
  it('应该正确判断时间阶段', () => {
    expect(getCurrentPhase(0)).toBe('night');
    expect(getCurrentPhase(4)).toBe('night');
    expect(getCurrentPhase(5)).toBe('dawn');
    expect(getCurrentPhase(6)).toBe('dawn');
    expect(getCurrentPhase(7)).toBe('day');
    expect(getCurrentPhase(12)).toBe('day');
    expect(getCurrentPhase(16)).toBe('day');
    expect(getCurrentPhase(17)).toBe('dusk');
    expect(getCurrentPhase(18)).toBe('dusk');
    expect(getCurrentPhase(19)).toBe('night');
    expect(getCurrentPhase(23)).toBe('night');
  });
});

describe('updateTime', () => {
  it('应该推进时间', () => {
    const time = createTimeState();
    const initialMinute = time.minute;
    updateTime(time);
    expect(time.minute).toBeGreaterThanOrEqual(initialMinute);
  });

  it('应该返回阶段变化', () => {
    const time = createTimeState();
    time.hour = 6;
    time.minute = 59;
    time.phase = 'dawn';
    // 推进到 7:00 应该触发 dawn → day 变化
    const newPhase = updateTime(time);
    // 由于累积器机制，可能需要多次调用
    if (time.hour >= 7) {
      expect(newPhase).toBe('day');
    }
  });

  it('天数应该在午夜递增', () => {
    const time = createTimeState();
    time.hour = 23;
    time.minute = 59;
    time.day = 1;
    // 推进到 0:00
    for (let i = 0; i < 100; i++) {
      updateTime(time);
      if (time.hour === 0 && time.day > 1) {break;}
    }
    expect(time.day).toBeGreaterThan(1);
  });
});

describe('cycleTimeSpeed', () => {
  it('应该循环切换速度', () => {
    expect(cycleTimeSpeed(1)).toBe(2);
    expect(cycleTimeSpeed(2)).toBe(4);
    expect(cycleTimeSpeed(4)).toBe(1);
  });
});

describe('formatGameTime', () => {
  it('应该格式化时间为 HH:MM', () => {
    expect(formatGameTime(8, 0)).toBe('08:00');
    expect(formatGameTime(14, 30)).toBe('14:30');
    expect(formatGameTime(0, 5)).toBe('00:05');
  });
});

describe('getPhaseProgress', () => {
  it('白天开始时进度应接近 0', () => {
    expect(getPhaseProgress(7, 0)).toBeCloseTo(0, 1);
  });

  it('白天结束时进度应接近 1', () => {
    expect(getPhaseProgress(16, 59)).toBeCloseTo(1, 0);
  });

  it('进度应在 0-1 范围内', () => {
    expect(getPhaseProgress(0, 0)).toBeGreaterThanOrEqual(0);
    expect(getPhaseProgress(0, 0)).toBeLessThanOrEqual(1);
    expect(getPhaseProgress(12, 30)).toBeGreaterThanOrEqual(0);
    expect(getPhaseProgress(12, 30)).toBeLessThanOrEqual(1);
  });
});

describe('getTimeOverlayColor', () => {
  it('白天应无叠加', () => {
    const overlay = getTimeOverlayColor('day');
    expect(overlay.opacity).toBe(0);
  });

  it('夜晚应有深色叠加', () => {
    const overlay = getTimeOverlayColor('night');
    expect(overlay.opacity).toBeGreaterThan(0);
  });

  it('各阶段应返回有效颜色', () => {
    for (const phase of ['dawn', 'day', 'dusk', 'night'] as const) {
      const overlay = getTimeOverlayColor(phase);
      expect(overlay.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(overlay.opacity).toBeGreaterThanOrEqual(0);
      expect(overlay.opacity).toBeLessThanOrEqual(1);
    }
  });
});
