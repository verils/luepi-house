import { describe, it, expect } from 'vitest';
import { resolveIntents } from './cat-intent-resolver';
import type { Cat, CatIntent } from './types';
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

describe('resolveIntents', () => {
  it('空意图列表应无操作', () => {
    const cat = createTestCat();
    resolveIntents([], [cat]);
    expect(cat.action).toBe('idle');
  });

  describe('want_chase', () => {
    it('正常生效：target 从 idle 变为 fleeing', () => {
      const initiator = createTestCat({ id: 'a' });
      const target = createTestCat({ id: 'b', action: 'idle' });
      const intents: CatIntent[] = [
        { type: 'want_chase', initiatorId: 'a', targetId: 'b' },
      ];

      resolveIntents(intents, [initiator, target]);

      expect(target.action).toBe('fleeing');
      expect(target.chaseTargetId).toBe('a');
      expect(target.actionTimer).toBe(0);
    });

    it('target sleeping 时意图被忽略', () => {
      const initiator = createTestCat({ id: 'a' });
      const target = createTestCat({ id: 'b', action: 'sleeping' });
      const intents: CatIntent[] = [
        { type: 'want_chase', initiatorId: 'a', targetId: 'b' },
      ];

      resolveIntents(intents, [initiator, target]);

      expect(target.action).toBe('sleeping');
    });

    it('target hiding 时意图被忽略', () => {
      const initiator = createTestCat({ id: 'a' });
      const target = createTestCat({ id: 'b', action: 'hiding' });
      const intents: CatIntent[] = [
        { type: 'want_chase', initiatorId: 'a', targetId: 'b' },
      ];

      resolveIntents(intents, [initiator, target]);

      expect(target.action).toBe('hiding');
    });

    it('target playFighting 时意图被忽略', () => {
      const initiator = createTestCat({ id: 'a' });
      const target = createTestCat({ id: 'b', action: 'playFighting' });
      const intents: CatIntent[] = [
        { type: 'want_chase', initiatorId: 'a', targetId: 'b' },
      ];

      resolveIntents(intents, [initiator, target]);

      expect(target.action).toBe('playFighting');
    });
  });

  describe('want_play_fight', () => {
    it('正常生效：target 进入 playFighting', () => {
      const initiator = createTestCat({ id: 'a', x: 100, y: 100 });
      const target = createTestCat({ id: 'b', x: 200, y: 200 });
      const intents: CatIntent[] = [
        { type: 'want_play_fight', initiatorId: 'a', targetId: 'b' },
      ];

      resolveIntents(intents, [initiator, target]);

      expect(target.action).toBe('playFighting');
      expect(target.chaseTargetId).toBe('a');
      expect(target.actionTimer).toBe(0);
    });
  });

  describe('want_reverse_chase', () => {
    it('正常生效：target 变为 chasing', () => {
      const initiator = createTestCat({ id: 'a', action: 'fleeing' });
      const target = createTestCat({ id: 'b', action: 'chasing' });
      const intents: CatIntent[] = [
        { type: 'want_reverse_chase', initiatorId: 'a', targetId: 'b' },
      ];

      resolveIntents(intents, [initiator, target]);

      expect(target.action).toBe('chasing');
      expect(target.chaseTargetId).toBe('a');
      expect(target.actionTimer).toBe(0);
    });
  });

  describe('want_stop_play_fighting', () => {
    it('正常生效：partner 回到 idle', () => {
      const cat = createTestCat({ id: 'a', action: 'idle', chaseTargetId: null });
      const partner = createTestCat({ id: 'b', action: 'playFighting', chaseTargetId: 'a' });
      const intents: CatIntent[] = [
        { type: 'want_stop_play_fighting', catId: 'a' },
      ];

      resolveIntents(intents, [cat, partner]);

      expect(partner.action).toBe('idle');
      expect(partner.chaseTargetId).toBeNull();
    });
  });

  describe('冲突处理', () => {
    it('两个 want_chase 同一 target：只有第一个生效', () => {
      const a = createTestCat({ id: 'a' });
      const b = createTestCat({ id: 'b' });
      const target = createTestCat({ id: 't', action: 'idle' });
      const intents: CatIntent[] = [
        { type: 'want_chase', initiatorId: 'a', targetId: 't' },
        { type: 'want_chase', initiatorId: 'b', targetId: 't' },
      ];

      resolveIntents(intents, [a, b, target]);

      expect(target.action).toBe('fleeing');
      expect(target.chaseTargetId).toBe('a');
    });

    it('无效 targetId 被忽略', () => {
      const a = createTestCat({ id: 'a' });
      const intents: CatIntent[] = [
        { type: 'want_chase', initiatorId: 'a', targetId: 'nonexistent' },
      ];

      resolveIntents(intents, [a]);
      expect(a.action).toBe('idle');
    });
  });
});
