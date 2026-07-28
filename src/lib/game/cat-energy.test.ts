import { describe, it, expect } from 'vitest';
import {
  createEnergy,
  updateEnergy,
  canChase,
  canPlayFight,
  canFlee,
  isExhausted,
  getEnergyBehaviorFactor,
  ENERGY_MAX,
  CHASE_MIN_ENERGY,
  PLAY_FIGHT_MIN_ENERGY,
  EXHAUSTED_ENERGY,
} from './cat-energy';
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
    satiety: 50,
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

describe('createEnergy', () => {
  it('初始体力在 70-90 之间', () => {
    for (let i = 0; i < 50; i++) {
      const e = createEnergy();
      expect(e).toBeGreaterThanOrEqual(70);
      expect(e).toBeLessThan(90);
    }
  });
});

describe('updateEnergy', () => {
  it('睡觉恢复体力', () => {
    expect(updateEnergy(50, 'sleeping', 1)).toBeCloseTo(50.5);
  });

  it('追逐消耗体力', () => {
    expect(updateEnergy(50, 'chasing', 1)).toBeCloseTo(49.55);
  });

  it('按 dt 缩放', () => {
    expect(updateEnergy(50, 'sleeping', 2)).toBeCloseTo(51);
    expect(updateEnergy(50, 'playFighting', 3)).toBeCloseTo(48.2);
  });

  it('上限 clamp 到 ENERGY_MAX', () => {
    expect(updateEnergy(99.8, 'sleeping', 1)).toBe(ENERGY_MAX);
  });

  it('下限 clamp 到 0', () => {
    expect(updateEnergy(0.2, 'playFighting', 1)).toBe(0);
  });
});

describe('体力门控', () => {
  it('canChase 边界', () => {
    expect(canChase(CHASE_MIN_ENERGY - 1)).toBe(false);
    expect(canChase(CHASE_MIN_ENERGY)).toBe(true);
  });

  it('canPlayFight 边界', () => {
    expect(canPlayFight(PLAY_FIGHT_MIN_ENERGY - 1)).toBe(false);
    expect(canPlayFight(PLAY_FIGHT_MIN_ENERGY)).toBe(true);
  });

  it('isExhausted 与 canFlee 互斥', () => {
    expect(isExhausted(EXHAUSTED_ENERGY)).toBe(true);
    expect(canFlee(EXHAUSTED_ENERGY)).toBe(false);
    expect(isExhausted(EXHAUSTED_ENERGY + 1)).toBe(false);
    expect(canFlee(EXHAUSTED_ENERGY + 1)).toBe(true);
  });

  it('getEnergyBehaviorFactor：<30 归零，30→100 线性', () => {
    expect(getEnergyBehaviorFactor(20)).toBe(0);
    expect(getEnergyBehaviorFactor(CHASE_MIN_ENERGY)).toBe(0);
    expect(getEnergyBehaviorFactor(65)).toBeCloseTo(0.5);
    expect(getEnergyBehaviorFactor(ENERGY_MAX)).toBe(1);
  });
});

describe('体力系统集成（updateCatState）', () => {
  it('睡觉的猫体力回升', () => {
    const cat = createTestCat({ action: 'sleeping', energy: 50, actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.energy).toBeGreaterThan(50);
  });

  it('追逐的猫体力下降', () => {
    const target = createTestCat({ id: 'b', x: 400, y: 100 });
    const cat = createTestCat({
      id: 'a',
      action: 'chasing',
      chaseTargetId: 'b',
      energy: 50,
      x: 100,
      y: 100,
    });
    const ctx = createCtx([cat, target]);

    updateCatState(cat, ctx);

    expect(cat.energy).toBeLessThan(50);
  });

  it('力竭的追逐者主动放弃，回到 idle', () => {
    const target = createTestCat({ id: 'b', x: 400, y: 100 });
    const cat = createTestCat({
      id: 'a',
      action: 'chasing',
      chaseTargetId: 'b',
      energy: EXHAUSTED_ENERGY - 0.2,
      actionTimer: 50,
      x: 100,
      y: 100,
    });
    const ctx = createCtx([cat, target]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
    expect(cat.chaseTargetId).toBeNull();
  });

  it('力竭的打闹者提前结束并发出停止意图', () => {
    const partner = createTestCat({ id: 'b', x: 110, y: 100, action: 'playFighting', chaseTargetId: 'a' });
    const cat = createTestCat({
      id: 'a',
      action: 'playFighting',
      chaseTargetId: 'b',
      energy: EXHAUSTED_ENERGY - 0.3,
      actionTimer: 10,
      x: 100,
      y: 100,
    });
    const ctx = createCtx([cat, partner]);

    const intents = updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
    expect(intents).toEqual([{ type: 'want_stop_play_fighting', catId: 'a' }]);
  });

  it('力竭的逃跑者停下喘息，回到 idle', () => {
    const chaser = createTestCat({ id: 'b', x: 120, y: 100, action: 'chasing', chaseTargetId: 'a' });
    const cat = createTestCat({
      id: 'a',
      action: 'fleeing',
      chaseTargetId: 'b',
      energy: EXHAUSTED_ENERGY - 0.2,
      actionTimer: 40,
      x: 100,
      y: 100,
    });
    const ctx = createCtx([cat, chaser]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
    expect(cat.chaseTargetId).toBeNull();
  });
});
