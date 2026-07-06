import { describe, it, expect } from 'vitest';
import {
  createPersonality,
  getPersonalityModifier,
  getInversePersonalityModifier,
  calculateBehaviorWeight,
  getChaseReverseChance,
  getReactionDelay,
  getIdleDurationModifier,
} from './personality';
import type { CatPersonality } from './types';

const defaultPersonality: CatPersonality = {
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
};

describe('createPersonality', () => {
  it('应该在基础值 ±10 范围内生成个性', () => {
    for (let i = 0; i < 50; i++) {
      const p = createPersonality(defaultPersonality);
      for (const key of Object.keys(p) as (keyof CatPersonality)[]) {
        expect(p[key]).toBeGreaterThanOrEqual(40);
        expect(p[key]).toBeLessThanOrEqual(60);
      }
    }
  });

  it('边界值应被限制在 0-100', () => {
    const extreme: CatPersonality = {
      curiosity: 5,
      energy: 95,
      sociability: 5,
      bravery: 95,
      independence: 5,
      appetite: 95,
      cleanliness: 5,
      playfulness: 95,
      alertness: 5,
      patience: 95,
    };
    const p = createPersonality(extreme);
    for (const key of Object.keys(p) as (keyof CatPersonality)[]) {
      expect(p[key]).toBeGreaterThanOrEqual(0);
      expect(p[key]).toBeLessThanOrEqual(100);
    }
  });
});

describe('getPersonalityModifier', () => {
  it('0 应返回 0.5', () => {
    expect(getPersonalityModifier(0)).toBe(0.5);
  });

  it('100 应返回 1.5', () => {
    expect(getPersonalityModifier(100)).toBe(1.5);
  });

  it('50 应返回 1.0', () => {
    expect(getPersonalityModifier(50)).toBe(1.0);
  });
});

describe('getInversePersonalityModifier', () => {
  it('0 应返回 2.0', () => {
    expect(getInversePersonalityModifier(0)).toBe(2.0);
  });

  it('100 应返回 0.2', () => {
    expect(getInversePersonalityModifier(100)).toBeCloseTo(0.2, 5);
  });
});

describe('calculateBehaviorWeight', () => {
  it('moving 应受 energy 影响', () => {
    const highEnergy = { ...defaultPersonality, energy: 100 };
    const lowEnergy = { ...defaultPersonality, energy: 0 };
    expect(calculateBehaviorWeight(highEnergy, 'moving')).toBeGreaterThan(
      calculateBehaviorWeight(lowEnergy, 'moving')
    );
  });

  it('hiding 应受 bravery 反向影响', () => {
    const brave = { ...defaultPersonality, bravery: 100 };
    const cowardly = { ...defaultPersonality, bravery: 0 };
    expect(calculateBehaviorWeight(cowardly, 'hiding')).toBeGreaterThan(
      calculateBehaviorWeight(brave, 'hiding')
    );
  });

  it('grooming 应受 cleanliness 影响', () => {
    const clean = { ...defaultPersonality, cleanliness: 100 };
    const dirty = { ...defaultPersonality, cleanliness: 0 };
    expect(calculateBehaviorWeight(clean, 'grooming')).toBeGreaterThan(
      calculateBehaviorWeight(dirty, 'grooming')
    );
  });

  it('未知行为应返回 1.0', () => {
    expect(calculateBehaviorWeight(defaultPersonality, 'unknown')).toBe(1.0);
  });
});

describe('getChaseReverseChance', () => {
  it('高 playfulness 应增加反转概率', () => {
    const playful = { ...defaultPersonality, playfulness: 100 };
    const calm = { ...defaultPersonality, playfulness: 0 };
    expect(getChaseReverseChance(playful)).toBeGreaterThan(getChaseReverseChance(calm));
  });
});

describe('getReactionDelay', () => {
  it('高 alertness 应降低反应延迟', () => {
    const alert = { ...defaultPersonality, alertness: 100 };
    const dull = { ...defaultPersonality, alertness: 0 };
    expect(getReactionDelay(alert)).toBeLessThan(getReactionDelay(dull));
  });
});

describe('getIdleDurationModifier', () => {
  it('高 patience 应增加 idle 时长', () => {
    const patient = { ...defaultPersonality, patience: 100 };
    const impatient = { ...defaultPersonality, patience: 0 };
    expect(getIdleDurationModifier(patient)).toBeGreaterThan(getIdleDurationModifier(impatient));
  });
});
