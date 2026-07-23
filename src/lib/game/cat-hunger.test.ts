import { describe, it, expect } from 'vitest';
import {
  createHunger,
  updateHunger,
  isHungry,
  getEatUrgency,
  HUNGER_MAX,
  HUNGRY_THRESHOLD,
} from './cat-hunger';
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
    hunger: 20,
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
    solidObjects: [],
    house: { x: 24, y: 24, width: 960, height: 640 },
    allCats: cats,
  };
}

describe('createHunger', () => {
  it('初始饥饿在 20-40 之间', () => {
    for (let i = 0; i < 50; i++) {
      const h = createHunger();
      expect(h).toBeGreaterThanOrEqual(20);
      expect(h).toBeLessThan(40);
    }
  });
});

describe('updateHunger', () => {
  it('进食降低饥饿', () => {
    expect(updateHunger(50, 'eating', 1)).toBeCloseTo(48.5);
  });

  it('闲置缓慢变饿', () => {
    expect(updateHunger(50, 'idle', 1)).toBeCloseTo(50.04);
  });

  it('高强度行为更快变饿', () => {
    expect(updateHunger(50, 'playFighting', 1)).toBeCloseTo(50.12);
    expect(updateHunger(50, 'chasing', 1)).toBeCloseTo(50.1);
  });

  it('按 dt 缩放', () => {
    expect(updateHunger(50, 'eating', 2)).toBeCloseTo(47);
    expect(updateHunger(50, 'idle', 3)).toBeCloseTo(50.12);
  });

  it('上限 clamp 到 HUNGER_MAX', () => {
    expect(updateHunger(99.99, 'playFighting', 1)).toBe(HUNGER_MAX);
  });

  it('下限 clamp 到 0', () => {
    expect(updateHunger(0.5, 'eating', 1)).toBe(0);
  });
});

describe('饥饿门控', () => {
  it('isHungry 边界', () => {
    expect(isHungry(HUNGRY_THRESHOLD - 1)).toBe(false);
    expect(isHungry(HUNGRY_THRESHOLD)).toBe(true);
  });

  it('getEatUrgency：不饿 0.1，阈值处 1，极饿升至 3', () => {
    expect(getEatUrgency(0)).toBeCloseTo(0.1);
    expect(getEatUrgency(HUNGRY_THRESHOLD)).toBe(1);
    expect(getEatUrgency(HUNGER_MAX)).toBe(3);
    expect(getEatUrgency(30)).toBeCloseTo(0.55);
  });

  it('getEatUrgency 随饥饿单调递增', () => {
    let prev = -Infinity;
    for (let h = 0; h <= HUNGER_MAX; h += 5) {
      const u = getEatUrgency(h);
      expect(u).toBeGreaterThan(prev);
      prev = u;
    }
  });
});

describe('饥饿系统集成（updateCatState）', () => {
  it('进食的猫饥饿下降', () => {
    const cat = createTestCat({ action: 'eating', hunger: 50, actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.hunger).toBeLessThan(50);
  });

  it('闲置的猫饥饿上升', () => {
    const cat = createTestCat({ action: 'idle', hunger: 20, idleTimer: 600 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.hunger).toBeGreaterThan(20);
  });

  it('饥饿不影响体力更新（两驱力独立）', () => {
    const cat = createTestCat({ action: 'sleeping', energy: 50, hunger: 80, actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.energy).toBeGreaterThan(50);
    expect(cat.hunger).toBeGreaterThan(80); // 睡觉也在缓慢变饿
  });
});
