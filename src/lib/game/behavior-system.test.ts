import { describe, it, expect } from 'vitest';
import {
  BEHAVIOR_CONFIG,
  getBehaviorDuration,
  getTimeModifier,
  canExecuteBehavior,
  calculateBehaviorWeight,
  weightedRandomBehavior,
} from './behavior-system';

describe('BEHAVIOR_CONFIG', () => {
  it('应该包含所有 16 种行为', () => {
    const behaviors = Object.keys(BEHAVIOR_CONFIG);
    expect(behaviors).toHaveLength(16);
    expect(behaviors).toContain('idle');
    expect(behaviors).toContain('moving');
    expect(behaviors).toContain('sleeping');
    expect(behaviors).toContain('chasing');
    expect(behaviors).toContain('fleeing');
    expect(behaviors).toContain('playing');
    expect(behaviors).toContain('following');
  });

  it('每种行为应有合理的持续时间范围', () => {
    for (const [name, config] of Object.entries(BEHAVIOR_CONFIG)) {
      expect(config.minDuration).toBeGreaterThan(0);
      expect(config.maxDuration).toBeGreaterThanOrEqual(config.minDuration);
      expect(config.cooldown).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getBehaviorDuration', () => {
  it('应该返回范围内的时间', () => {
    for (let i = 0; i < 50; i++) {
      const duration = getBehaviorDuration('idle');
      expect(duration).toBeGreaterThanOrEqual(BEHAVIOR_CONFIG.idle.minDuration);
      expect(duration).toBeLessThanOrEqual(BEHAVIOR_CONFIG.idle.maxDuration);
    }
  });
});

describe('getTimeModifier', () => {
  it('白天应返回 1.0（无修正）', () => {
    expect(getTimeModifier('day', 'idle')).toBe(1.0);
    expect(getTimeModifier('day', 'moving')).toBe(1.0);
  });

  it('夜晚应增加睡觉概率', () => {
    expect(getTimeModifier('night', 'sleeping')).toBeGreaterThan(1.0);
  });

  it('夜晚应降低移动概率', () => {
    expect(getTimeModifier('night', 'moving')).toBeLessThan(1.0);
  });

  it('未知阶段应返回 1.0', () => {
    expect(getTimeModifier('unknown', 'idle')).toBe(1.0);
  });
});

describe('canExecuteBehavior', () => {
  it('不需要目标的行为应始终可执行', () => {
    expect(canExecuteBehavior('idle', {})).toBe(true);
    expect(canExecuteBehavior('grooming', {})).toBe(true);
  });

  it('需要目标且目标存在时应可执行', () => {
    expect(canExecuteBehavior('sleeping', { catBed: true })).toBe(true);
    expect(canExecuteBehavior('hiding', { shelter: true })).toBe(true);
  });

  it('需要目标但目标不存在时应不可执行', () => {
    expect(canExecuteBehavior('sleeping', { catBed: false })).toBe(false);
    expect(canExecuteBehavior('hiding', { shelter: false })).toBe(false);
  });
});

describe('calculateBehaviorWeight', () => {
  it('所有修正为 1.0 时应返回基础权重', () => {
    expect(calculateBehaviorWeight('idle', 10, 1.0, 1.0, 1.0)).toBe(10);
  });

  it('修正系数应正确应用', () => {
    expect(calculateBehaviorWeight('idle', 10, 2.0, 1.0, 1.0)).toBe(20);
    expect(calculateBehaviorWeight('idle', 10, 1.0, 0.5, 1.0)).toBe(5);
  });
});

describe('weightedRandomBehavior', () => {
  it('单一权重应始终返回该行为', () => {
    for (let i = 0; i < 20; i++) {
      expect(weightedRandomBehavior({ idle: 100 })).toBe('idle');
    }
  });

  it('应返回有效的行为名称', () => {
    const result = weightedRandomBehavior({ idle: 50, moving: 50 });
    expect(['idle', 'moving']).toContain(result);
  });

  it('零权重的行为不应被选中', () => {
    for (let i = 0; i < 20; i++) {
      const result = weightedRandomBehavior({ idle: 0, moving: 100 });
      expect(result).toBe('moving');
    }
  });
});
