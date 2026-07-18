import { describe, it, expect } from 'vitest';
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
    idleTimer: 60,
    actionTimer: 0,
    blinkTimer: 120,
    isBlinking: false,
    mood: createMoodState(),
    moodTimer: 0,
    chaseTargetId: null,
    actionSwitchTimer: 0,
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

describe('updateCatState', () => {
  it('空闲猫返回空意图数组', () => {
    const cat = createTestCat({ action: 'idle', idleTimer: 100 });
    const ctx = createCtx([cat]);

    const intents = updateCatState(cat, ctx);

    expect(Array.isArray(intents)).toBe(true);
    expect(intents).toHaveLength(0);
  });

  it('moving 状态不返回意图', () => {
    const cat = createTestCat({ action: 'moving', targetX: 300, targetY: 300 });
    const ctx = createCtx([cat]);

    const intents = updateCatState(cat, ctx);

    expect(intents).toHaveLength(0);
  });

  it('sleeping 状态不返回意图', () => {
    const cat = createTestCat({ action: 'sleeping', actionTimer: 100 });
    const ctx = createCtx([cat]);

    const intents = updateCatState(cat, ctx);

    expect(intents).toHaveLength(0);
  });

  it('返回值类型始终是 CatIntent[]', () => {
    const cat = createTestCat({ action: 'grooming', actionTimer: 100 });
    const ctx = createCtx([cat]);

    const intents = updateCatState(cat, ctx);

    expect(Array.isArray(intents)).toBe(true);
  });
});

describe('startChasing 通过 updateChasingState', () => {
  it('追逐猫接近目标时只修改自身，返回意图', () => {
    // 创建已处于 chasing 状态的猫，目标在很近距离内
    const chaser = createTestCat({
      id: 'chaser',
      action: 'chasing',
      chaseTargetId: 'target',
      x: 100,
      y: 100,
      actionTimer: 10,
    });
    const target = createTestCat({
      id: 'target',
      action: 'fleeing',
      chaseTargetId: 'chaser',
      x: 105,
      y: 105,
    });
    const ctx = createCtx([chaser, target]);

    // 追逐状态接近目标时可能触发 playFighting、reverseChase 或继续追逐
    // 多次运行以触发其中一个分支
    let gotIntent = false;
    for (let i = 0; i < 100; i++) {
      chaser.action = 'chasing';
      chaser.chaseTargetId = 'target';
      chaser.actionTimer = 10;
      chaser.x = 100;
      chaser.y = 100;
      target.action = 'fleeing';
      target.chaseTargetId = 'chaser';
      target.x = 105;
      target.y = 105;

      const intents = updateCatState(chaser, ctx);

      if (intents.length > 0) {
        gotIntent = true;
        // target 不应被 chaser 的 updateCatState 修改
        expect(target.action).toBe('fleeing');
        expect(target.chaseTargetId).toBe('chaser');
        break;
      }
    }
    expect(gotIntent).toBe(true);
  });
});

describe('updatePlayFightingState', () => {
  it('超时后返回 want_stop_play_fighting，不修改 partner', () => {
    const cat = createTestCat({
      id: 'a',
      action: 'playFighting',
      actionTimer: 200, // 足够大，触发超时
      chaseTargetId: 'b',
    });
    const partner = createTestCat({
      id: 'b',
      action: 'playFighting',
      chaseTargetId: 'a',
    });
    const ctx = createCtx([cat, partner]);

    const intents = updateCatState(cat, ctx);

    // cat 修改了自身
    expect(cat.action).toBe('idle');
    expect(cat.chaseTargetId).toBeNull();

    // partner 不应被修改
    expect(partner.action).toBe('playFighting');
    expect(partner.chaseTargetId).toBe('a');

    // 返回意图
    expect(intents).toHaveLength(1);
    expect(intents[0]).toEqual({ type: 'want_stop_play_fighting', catId: 'a' });
  });
});

describe('updateCatState deltaTime', () => {
  it('dt=2 时 idleTimer 减少量翻倍', () => {
    const cat = createTestCat({ action: 'idle', idleTimer: 100 });
    const ctx = createCtx([cat]);
    updateCatState(cat, ctx, 2);
    expect(cat.idleTimer).toBe(98);
  });

  it('dt=2 时 moving 位移翻倍', () => {
    const cat1 = createTestCat({ action: 'moving', targetX: 400, targetY: 100, x: 100, y: 100 });
    const cat2 = createTestCat({ action: 'moving', targetX: 400, targetY: 100, x: 100, y: 100 });
    const ctx1 = createCtx([cat1]);
    const ctx2 = createCtx([cat2]);
    updateCatState(cat1, ctx1, 1);
    updateCatState(cat2, ctx2, 2);
    expect(cat2.x - 100).toBeCloseTo((cat1.x - 100) * 2, 5);
  });

  it('moodTimer 应随帧推进（驱动特效动画）', () => {
    const cat = createTestCat({ action: 'idle', idleTimer: 100 });
    const ctx = createCtx([cat]);
    updateCatState(cat, ctx, 1);
    expect(cat.moodTimer).toBe(1);
  });
});
