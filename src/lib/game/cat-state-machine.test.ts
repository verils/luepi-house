import { describe, it, expect } from 'vitest';
import {
  updateCatState,
  rememberVisit,
  isNearRecentVisit,
  VISIT_MEMORY_MAX,
  type StateContext,
} from './cat-state-machine';
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

describe('碰撞解析统一', () => {
  it('追逐状态也应被固体碰撞推离', () => {
    const cat = createTestCat({
      id: 'chaser',
      action: 'chasing',
      chaseTargetId: 'target',
      x: 100,
      y: 100,
    });
    const target = createTestCat({ id: 'target', x: 200, y: 100 });
    const ctx = createCtx([cat, target]);
    // 固体障碍物与猫移动后的中心 (≈117.6, 116) 重叠
    ctx.solidObjects = [{ x: 120, y: 90, width: 32, height: 32 }];

    updateCatState(cat, ctx, 1);

    // 猫先向 target 移动（+x），随后被固体碰撞向 -x 推离，最终 x 小于初始值
    expect(cat.x).toBeLessThan(100);
  });

  it('moving 状态固体碰撞推离位置精确', () => {
    const cat = createTestCat({ action: 'moving', targetX: 400, targetY: 100, x: 100, y: 100 });
    const ctx = createCtx([cat]);
    // 障碍物紧贴移动路径但不完全阻挡
    ctx.solidObjects = [{ x: 130, y: 90, width: 32, height: 32 }];

    updateCatState(cat, ctx, 1);

    // 猫移动后中心 (117.5,116) 与 rect (130-162, 90-122) 的最近点 (130,116) 距离 12.5 < 16
    // 推离后：x = 101.5 - (16-12.5) = 98
    expect(cat.x).toBeCloseTo(98, 0);
  });
});

describe('following 社交跟随', () => {
  it('跟随中的猫向对方移动', () => {
    const target = createTestCat({ id: 'b', x: 400, y: 100 });
    const cat = createTestCat({ id: 'a', action: 'following', chaseTargetId: 'b', x: 100, y: 100 });
    const ctx = createCtx([cat, target]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('following');
    expect(cat.x).toBeGreaterThan(100);
    // 跟随只修改自身
    expect(target.x).toBe(400);
    expect(target.action).toBe('idle');
  });

  it('靠近后转为注视并清空跟随目标', () => {
    const target = createTestCat({ id: 'b', x: 125, y: 100 });
    const cat = createTestCat({ id: 'a', action: 'following', chaseTargetId: 'b', x: 100, y: 100 });
    const ctx = createCtx([cat, target]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('watching');
    expect(cat.chaseTargetId).toBeNull();
  });

  it('目标睡着后放弃跟随', () => {
    const target = createTestCat({ id: 'b', x: 400, y: 100, action: 'sleeping' });
    const cat = createTestCat({ id: 'a', action: 'following', chaseTargetId: 'b', x: 100, y: 100 });
    const ctx = createCtx([cat, target]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
    expect(cat.chaseTargetId).toBeNull();
  });

  it('跟随超时后回到 idle', () => {
    const target = createTestCat({ id: 'b', x: 400, y: 100 });
    const cat = createTestCat({ id: 'a', action: 'following', chaseTargetId: 'b', actionTimer: 700, x: 100, y: 100 });
    const ctx = createCtx([cat, target]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
    expect(cat.chaseTargetId).toBeNull();
  });
});

describe('playing 玩耍', () => {
  it('玩耍超时后回到 idle', () => {
    const cat = createTestCat({ action: 'playing', actionTimer: 200 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
  });

  it('玩耍消耗体力', () => {
    const cat = createTestCat({ action: 'playing', energy: 50, actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.energy).toBeLessThan(50);
  });
});

describe('探索路径记忆', () => {
  it('rememberVisit 记录并封顶 VISIT_MEMORY_MAX', () => {
    const cat = createTestCat();
    for (let i = 0; i < VISIT_MEMORY_MAX + 3; i++) {
      rememberVisit(cat, i * 10, i * 10);
    }
    expect(cat.visitedPoints).toHaveLength(VISIT_MEMORY_MAX);
    // 最新的在最前
    expect(cat.visitedPoints[0].x).toBe((VISIT_MEMORY_MAX + 2) * 10);
  });

  it('isNearRecentVisit 判定半径内的访问点', () => {
    const cat = createTestCat({ visitedPoints: [{ x: 200, y: 200 }] });
    expect(isNearRecentVisit(cat, 210, 200)).toBe(true);
    expect(isNearRecentVisit(cat, 500, 500)).toBe(false);
    expect(isNearRecentVisit(cat, 210, 200, 5)).toBe(false); // 自定义半径
  });

  it('moving 到达目标后记录访问点', () => {
    const cat = createTestCat({ action: 'moving', targetX: 100, targetY: 100, x: 100, y: 100 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.visitedPoints).toHaveLength(1);
    expect(cat.visitedPoints[0]).toEqual({ x: 100, y: 100 });
  });
});
