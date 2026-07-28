import { describe, it, expect } from 'vitest';
import {
  createSatiety,
  updateSatiety,
  isHungry,
  getEatUrgency,
  SATIETY_MAX,
  HUNGRY_SATIETY,
} from './cat-satiety';
import { updateCatState, type StateContext } from './cat-state-machine';
import type { Cat } from './types';
import { createMoodState } from './mood-system';

function createTestCat(overrides: Partial<Cat> = {}): Cat {
  return {
    id: 'cat-' + Math.random().toString(36).slice(2, 6),
    name: 'TestCat',
    x: 100,
    y: 100,
    visualWidth: 32,
    visualHeight: 32,
    collisionRadius: 16,
    interactionRadius: 20,
    color: '#fff',
    rotation: 0,
    speed: 1.5,
    targetX: 100,
    targetY: 100,
    action: 'idle',
    idleTimer: 600,
    actionTimer: 0,
    blinkTimer: 120,
    isBlinking: false,
    mood: createMoodState(),
    moodTimer: 0,
    chaseTargetId: null,
    actionSwitchTimer: 0,
    reactionCooldown: 0,
    lastPerceivedDistance: null,
    energy: 100,
    satiety: 80,
    visitedPoints: [],
    personality: {
      curiosity: 50,
      energy: 50,
      sociability: 50,
      bravery: 50,
      independence: 50,
      appetite: 50,
      cleanliness: 50,
      playfulness: 50,
      alertness: 50,
      patience: 50,
    },
    ...overrides,
  };
}

function createCtx(cats: Cat[]): StateContext {
  return {
    shelters: [],
    catBeds: [],
    furnitures: [],
    toys: [],
    solidObjects: [],
    house: { x: 24, y: 24, width: 960, height: 640 },
    allCats: cats,
  };
}

describe('createSatiety', () => {
  it('初始饱腹在 60-80 之间', () => {
    for (let i = 0; i < 50; i++) {
      const s = createSatiety();
      expect(s).toBeGreaterThanOrEqual(60);
      expect(s).toBeLessThan(80);
    }
  });
});

describe('updateSatiety', () => {
  it('进食补充饱腹', () => {
    expect(updateSatiety(50, 'eating', 1)).toBeCloseTo(51.5);
  });

  it('闲置缓慢消耗', () => {
    expect(updateSatiety(50, 'idle', 1)).toBeCloseTo(49.96);
  });

  it('高强度行为更快消耗', () => {
    expect(updateSatiety(50, 'playFighting', 1)).toBeCloseTo(49.88);
    expect(updateSatiety(50, 'chasing', 1)).toBeCloseTo(49.9);
  });

  it('按 dt 缩放', () => {
    expect(updateSatiety(50, 'eating', 2)).toBeCloseTo(53);
    expect(updateSatiety(50, 'idle', 3)).toBeCloseTo(49.88);
  });

  it('上限 clamp 到 SATIETY_MAX', () => {
    expect(updateSatiety(99.5, 'eating', 1)).toBe(SATIETY_MAX);
  });

  it('下限 clamp 到 0', () => {
    expect(updateSatiety(0.05, 'playFighting', 1)).toBe(0);
  });
});

describe('饥饿门控', () => {
  it('isHungry 边界', () => {
    expect(isHungry(HUNGRY_SATIETY + 1)).toBe(false);
    expect(isHungry(HUNGRY_SATIETY)).toBe(true);
  });

  it('getEatUrgency：饱足 0.1，阈值处 1，极饿升至 3', () => {
    expect(getEatUrgency(SATIETY_MAX)).toBeCloseTo(0.1);
    expect(getEatUrgency(HUNGRY_SATIETY)).toBe(1);
    expect(getEatUrgency(0)).toBe(3);
    expect(getEatUrgency(70)).toBeCloseTo(0.55);
  });

  it('getEatUrgency 随饱腹降低单调递增', () => {
    let prev = -Infinity;
    for (let s = SATIETY_MAX; s >= 0; s -= 5) {
      const u = getEatUrgency(s);
      expect(u).toBeGreaterThan(prev);
      prev = u;
    }
  });
});

describe('饱腹系统集成（updateCatState）', () => {
  it('进食的猫饱腹上升', () => {
    const cat = createTestCat({ action: 'eating', satiety: 50, actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.satiety).toBeGreaterThan(50);
  });

  it('闲置的猫饱腹下降', () => {
    const cat = createTestCat({ action: 'idle', satiety: 80, idleTimer: 600 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.satiety).toBeLessThan(80);
  });

  it('饱腹不影响体力更新（两驱力独立）', () => {
    const cat = createTestCat({ action: 'sleeping', energy: 50, satiety: 20, actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.energy).toBeGreaterThan(50);
    expect(cat.satiety).toBeLessThan(20); // 睡觉也在缓慢消耗
  });
});
