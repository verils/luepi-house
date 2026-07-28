import { describe, it, expect } from 'vitest';
import {
  perceive,
  evaluateReaction,
  canInterrupt,
  isReactable,
  VIEW_RADIUS,
  ATTENTION_RADIUS,
  type Perception,
} from './cat-perception';
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

function makePerception(overrides: Partial<Perception> = {}): Perception {
  return {
    otherId: 'other',
    distance: 60,
    otherAction: 'moving',
    approaching: true,
    ...overrides,
  };
}

describe('perceive', () => {
  it('视野内返回感知结果', () => {
    const cat = createTestCat({ x: 100, y: 100 });
    const other = createTestCat({ x: 100 + VIEW_RADIUS - 1, y: 100 });

    const p = perceive(cat, other, null);

    expect(p).not.toBeNull();
    expect(p!.distance).toBeCloseTo(VIEW_RADIUS - 1);
    expect(p!.otherId).toBe(other.id);
    expect(p!.otherAction).toBe('idle');
  });

  it('视野外返回 null', () => {
    const cat = createTestCat({ x: 100, y: 100 });
    const other = createTestCat({ x: 100 + VIEW_RADIUS + 1, y: 100 });

    expect(perceive(cat, other, null)).toBeNull();
  });

  it('距离缩短判定为接近', () => {
    const cat = createTestCat({ x: 100, y: 100 });
    const other = createTestCat({ x: 200, y: 100 });

    const p = perceive(cat, other, 150);

    expect(p!.approaching).toBe(true);
  });

  it('距离拉大判定为未接近', () => {
    const cat = createTestCat({ x: 100, y: 100 });
    const other = createTestCat({ x: 200, y: 100 });

    const p = perceive(cat, other, 50);

    expect(p!.approaching).toBe(false);
  });

  it('无历史距离时判定为未接近', () => {
    const cat = createTestCat({ x: 100, y: 100 });
    const other = createTestCat({ x: 200, y: 100 });

    const p = perceive(cat, other, null);

    expect(p!.approaching).toBe(false);
  });
});

describe('evaluateReaction', () => {
  it('高社交猫对接近者发起追逐', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, sociability: 70 },
    });

    expect(evaluateReaction(cat, makePerception())).toBe('chase');
  });

  it('胆小且不够贪玩的猫选择逃跑（即使社交高）', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, bravery: 30, playfulness: 40, sociability: 80 },
    });

    expect(evaluateReaction(cat, makePerception())).toBe('flee');
  });

  it('个性均衡的猫选择注视', () => {
    const cat = createTestCat();

    expect(evaluateReaction(cat, makePerception())).toBe('watch');
  });

  it('对方在打闹时围观（不受关注距离限制）', () => {
    const cat = createTestCat();

    expect(
      evaluateReaction(cat, makePerception({ otherAction: 'playFighting', distance: 180, approaching: false }))
    ).toBe('watch');
  });

  it('对方未接近时不反应', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, sociability: 90 },
    });

    expect(evaluateReaction(cat, makePerception({ approaching: false }))).toBeNull();
  });

  it('对方在关注距离外时不反应', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, sociability: 90, alertness: 100 },
    });

    expect(
      evaluateReaction(cat, makePerception({ distance: ATTENTION_RADIUS + 1 }))
    ).toBeNull();
  });

  it('钝感猫注意不到远处接近（注意力半径随警觉性缩小）', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, alertness: 10, sociability: 90 },
    });

    // alertness 10 → 半径 66px；100px 的接近注意不到
    expect(evaluateReaction(cat, makePerception({ distance: 100 }))).toBeNull();
  });

  it('钝感猫对贴脸的接近仍有反应', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, alertness: 10, sociability: 90 },
    });

    // 60px 在 66px 半径内 → 正常分支
    expect(evaluateReaction(cat, makePerception({ distance: 60 }))).toBe('chase');
  });

  it('高警觉猫能反应远处的接近', () => {
    const cat = createTestCat({
      personality: { ...createTestCat().personality, alertness: 95, sociability: 90 },
    });

    // alertness 95 → 半径 117px；110px 内有反应
    expect(evaluateReaction(cat, makePerception({ distance: 110 }))).toBe('chase');
  });

  it('体力不足时追逐降级为注视', () => {
    const cat = createTestCat({
      energy: 20,
      personality: { ...createTestCat().personality, sociability: 90 },
    });

    expect(evaluateReaction(cat, makePerception())).toBe('watch');
  });

  it('力竭时逃跑降级为注视', () => {
    const cat = createTestCat({
      energy: 5,
      personality: { ...createTestCat().personality, bravery: 30, playfulness: 40 },
    });

    expect(evaluateReaction(cat, makePerception())).toBe('watch');
  });
});

describe('canInterrupt / isReactable', () => {
  it('idle/moving/grooming/watching/exploring 可打断', () => {
    for (const action of ['idle', 'moving', 'grooming', 'watching', 'exploring'] as const) {
      expect(canInterrupt(action)).toBe(true);
    }
  });

  it('sleeping/hiding/playFighting/eating/drinking/chasing/fleeing 不可打断', () => {
    for (const action of ['sleeping', 'hiding', 'playFighting', 'eating', 'drinking', 'chasing', 'fleeing'] as const) {
      expect(canInterrupt(action)).toBe(false);
    }
  });

  it('睡着/躲藏的猫不引发反应', () => {
    expect(isReactable('sleeping')).toBe(false);
    expect(isReactable('hiding')).toBe(false);
    expect(isReactable('moving')).toBe(true);
  });
});

describe('感知-反应层集成（updateCatState）', () => {
  it('对方接近时高社交猫在 1 秒内发起追逐意图', () => {
    const a = createTestCat({
      id: 'a',
      x: 400,
      y: 300,
      personality: { ...createTestCat().personality, sociability: 70 },
    });
    const b = createTestCat({ id: 'b', x: 480, y: 300, action: 'moving', targetX: 400, targetY: 300 });
    const ctx = createCtx([a, b]);

    // 第 1 帧：建立距离基线，无反应
    expect(updateCatState(a, ctx)).toHaveLength(0);
    expect(a.lastPerceivedDistance).toBeCloseTo(80);

    // 第 2 帧：对方接近，触发追逐
    b.x = 460;
    const intents = updateCatState(a, ctx);

    expect(a.action).toBe('chasing');
    expect(a.chaseTargetId).toBe('b');
    expect(intents).toEqual([{ type: 'want_chase', initiatorId: 'a', targetId: 'b' }]);
    expect(a.reactionCooldown).toBeGreaterThan(0);
  });

  it('胆小猫对接近者短促逃跑', () => {
    const a = createTestCat({
      id: 'a',
      x: 400,
      y: 300,
      personality: { ...createTestCat().personality, bravery: 30, playfulness: 40 },
    });
    const b = createTestCat({ id: 'b', x: 480, y: 300, action: 'moving' });
    const ctx = createCtx([a, b]);

    updateCatState(a, ctx);
    b.x = 460;
    const intents = updateCatState(a, ctx);

    expect(a.action).toBe('fleeing');
    expect(a.chaseTargetId).toBe('b');
    expect(intents).toHaveLength(0);
  });

  it('均衡个性的猫进入真实 watching 状态并注视对方', () => {
    const a = createTestCat({ id: 'a', x: 400, y: 300 });
    const b = createTestCat({ id: 'b', x: 480, y: 300, action: 'moving' });
    const ctx = createCtx([a, b]);

    updateCatState(a, ctx);
    b.x = 460;
    updateCatState(a, ctx);

    expect(a.action).toBe('watching');
    expect(a.targetX).toBe(b.x);
    expect(a.targetY).toBe(b.y);
  });

  it('冷却期内不重复触发反应', () => {
    const a = createTestCat({ id: 'a', x: 400, y: 300 });
    const b = createTestCat({ id: 'b', x: 480, y: 300, action: 'moving' });
    const ctx = createCtx([a, b]);

    updateCatState(a, ctx);
    b.x = 460;
    updateCatState(a, ctx);
    expect(a.action).toBe('watching');

    // 冷却期内对方继续接近，不应重新进入 watching（actionTimer 不被重置）
    b.x = 450;
    updateCatState(a, ctx);

    expect(a.action).toBe('watching');
    expect(a.actionTimer).toBeGreaterThan(0);
  });

  it('不可打断状态不被反应打断', () => {
    const a = createTestCat({ id: 'a', x: 400, y: 300, action: 'sleeping' });
    const b = createTestCat({ id: 'b', x: 480, y: 300, action: 'moving' });
    const ctx = createCtx([a, b]);

    updateCatState(a, ctx);
    b.x = 460;
    updateCatState(a, ctx);

    expect(a.action).toBe('sleeping');
  });

  it('对方睡觉时不引发反应', () => {
    const a = createTestCat({
      id: 'a',
      x: 400,
      y: 300,
      personality: { ...createTestCat().personality, sociability: 90 },
    });
    const b = createTestCat({ id: 'b', x: 480, y: 300, action: 'sleeping' });
    const ctx = createCtx([a, b]);

    updateCatState(a, ctx);
    b.x = 460;
    const intents = updateCatState(a, ctx);

    expect(a.action).toBe('idle');
    expect(intents).toHaveLength(0);
  });
});
