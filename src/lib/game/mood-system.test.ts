import { describe, it, expect } from 'vitest';
import {
  createMoodState,
  updateMood,
  applyMoodEvent,
  getMoodThreshold,
  getMoodBehaviorModifier,
  getEarAngle,
  getTailHeight,
  getTailWagSpeed,
  getEyeScale,
  getParticleType,
} from './mood-system';
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

describe('createMoodState', () => {
  it('应该创建初始情绪状态', () => {
    const mood = createMoodState();
    expect(mood.value).toBe(50);
    expect(mood.decayRate).toBe(0.01);
    expect(mood.lastEventTime).toBe(0);
  });
});

describe('getMoodThreshold', () => {
  it('应该正确映射情绪阈值', () => {
    expect(getMoodThreshold(0)).toBe('depressed');
    expect(getMoodThreshold(19)).toBe('depressed');
    expect(getMoodThreshold(20)).toBe('calm');
    expect(getMoodThreshold(39)).toBe('calm');
    expect(getMoodThreshold(40)).toBe('content');
    expect(getMoodThreshold(59)).toBe('content');
    expect(getMoodThreshold(60)).toBe('excited');
    expect(getMoodThreshold(79)).toBe('excited');
    expect(getMoodThreshold(80)).toBe('euphoric');
    expect(getMoodThreshold(100)).toBe('euphoric');
  });
});

describe('updateMood', () => {
  it('高于中性值时应向 50 衰减', () => {
    const mood = createMoodState();
    mood.value = 70;
    updateMood(mood, defaultPersonality);
    expect(mood.value).toBeLessThan(70);
    expect(mood.value).toBeGreaterThanOrEqual(50);
  });

  it('低于中性值时应向 50 衰减', () => {
    const mood = createMoodState();
    mood.value = 30;
    updateMood(mood, defaultPersonality);
    expect(mood.value).toBeGreaterThan(30);
    expect(mood.value).toBeLessThanOrEqual(50);
  });

  it('在中性值时不应变化', () => {
    const mood = createMoodState();
    mood.value = 50;
    updateMood(mood, defaultPersonality);
    expect(mood.value).toBe(50);
  });
});

describe('applyMoodEvent', () => {
  it('正面事件应增加情绪值', () => {
    const mood = createMoodState();
    applyMoodEvent(mood, 'chase_start', defaultPersonality, Date.now());
    expect(mood.value).toBeGreaterThan(50);
  });

  it('负面事件应减少情绪值', () => {
    const mood = createMoodState();
    applyMoodEvent(mood, 'flee', defaultPersonality, Date.now());
    expect(mood.value).toBeLessThan(50);
  });

  it('未知事件类型不应改变情绪', () => {
    const mood = createMoodState();
    applyMoodEvent(mood, 'unknown_event', defaultPersonality, Date.now());
    expect(mood.value).toBe(50);
  });

  it('情绪值不应超出 0-100 范围', () => {
    const mood = createMoodState();
    mood.value = 95;
    applyMoodEvent(mood, 'pet', defaultPersonality, Date.now());
    expect(mood.value).toBeLessThanOrEqual(100);

    mood.value = 5;
    applyMoodEvent(mood, 'flee', defaultPersonality, Date.now());
    expect(mood.value).toBeGreaterThanOrEqual(0);
  });

  it('个性应影响情绪变化幅度', () => {
    const playfulPersonality = { ...defaultPersonality, playfulness: 100 };
    const shyPersonality = { ...defaultPersonality, playfulness: 0 };

    const mood1 = createMoodState();
    const mood2 = createMoodState();

    applyMoodEvent(mood1, 'chase_start', playfulPersonality, Date.now());
    applyMoodEvent(mood2, 'chase_start', shyPersonality, Date.now());

    expect(mood1.value).toBeGreaterThan(mood2.value);
  });
});

describe('getMoodBehaviorModifier', () => {
  it('euphoric 状态应增加 chasing 权重', () => {
    expect(getMoodBehaviorModifier(90, 'chasing')).toBe(1.3);
  });

  it('euphoric 状态应降低 sleeping 权重', () => {
    expect(getMoodBehaviorModifier(90, 'sleeping')).toBe(0.5);
  });

  it('depressed 状态应增加 sleeping 权重', () => {
    expect(getMoodBehaviorModifier(10, 'sleeping')).toBe(1.5);
  });

  it('depressed 状态应降低 moving 权重', () => {
    expect(getMoodBehaviorModifier(10, 'moving')).toBe(0.6);
  });

  it('content 状态应返回 1.0', () => {
    expect(getMoodBehaviorModifier(50, 'chasing')).toBe(1.0);
  });
});

describe('视觉反馈函数', () => {
  it('耳朵角度应随情绪变化', () => {
    expect(getEarAngle(0)).toBeLessThan(getEarAngle(100));
  });

  it('尾巴高度应随情绪增加', () => {
    expect(getTailHeight(0)).toBeLessThan(getTailHeight(100));
  });

  it('尾巴摆动频率应随情绪增加', () => {
    expect(getTailWagSpeed(0)).toBeLessThan(getTailWagSpeed(100));
  });

  it('眼睛大小应随情绪变化', () => {
    expect(getEyeScale(0)).toBeLessThan(getEyeScale(100));
  });

  it('粒子类型应随情绪阈值变化', () => {
    expect(getParticleType(10)).toBe('sigh');
    expect(getParticleType(30)).toBe('none');
    expect(getParticleType(50)).toBe('heart');
    expect(getParticleType(70)).toBe('mixed');
    expect(getParticleType(90)).toBe('burst');
  });
});
