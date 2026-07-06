// 情绪系统 - 连续数值系统

import type { CatPersonality } from './types';

export type MoodThreshold = 'depressed' | 'calm' | 'content' | 'excited' | 'euphoric';

export interface CatMoodState {
  value: number;           // 0-100 当前情绪值
  decayRate: number;       // 基础衰减率
  lastEventTime: number;   // 上次事件时间
}

// 情绪事件修正表
const MOOD_EVENTS: Record<string, number> = {
  // 正面事件
  chase_start: +15,
  play_fight: +10,
  pet: +20,
  eat: +5,
  socialize: +8,
  
  // 负面事件
  flee: -10,
  hide: -5,
  lonely: -3,
  bored: -2,
  
  // 中性事件
  sleep: -5,
  groom: +2,
};

/**
 * 创建初始情绪状态
 */
export function createMoodState(): CatMoodState {
  return {
    value: 50, // 初始中性
    decayRate: 0.01,
    lastEventTime: 0,
  };
}

/**
 * 更新情绪状态（距离衰减机制）
 */
export function updateMood(mood: CatMoodState, personality: CatPersonality): void {
  const baseRate = mood.decayRate;
  const personalityFactor = 0.8 + (personality.energy / 100) * 0.4;
  const decayRate = calculateDecayRate(mood.value, baseRate * personalityFactor);
  
  // 向中性值(50)衰减
  if (mood.value > 50) {
    mood.value = Math.max(50, mood.value - decayRate);
  } else if (mood.value < 50) {
    mood.value = Math.min(50, mood.value + decayRate);
  }
}

/**
 * 计算衰减率（离中性越远衰减越快）
 */
function calculateDecayRate(currentValue: number, baseRate: number): number {
  const distanceFromNeutral = Math.abs(currentValue - 50);
  // 距离 0 → 衰减率 0.5x
  // 距离 50 → 衰减率 2.0x
  const distanceMultiplier = 0.5 + (distanceFromNeutral / 50) * 1.5;
  return baseRate * distanceMultiplier;
}

/**
 * 应用情绪事件
 */
export function applyMoodEvent(
  mood: CatMoodState,
  eventType: string,
  personality: CatPersonality,
  currentTime: number
): void {
  const baseModifier = MOOD_EVENTS[eventType] || 0;
  if (baseModifier === 0) {return;}
  
  const personalityFactor = getPersonalityMoodFactor(personality, eventType);
  const finalModifier = baseModifier * personalityFactor;
  
  mood.value = Math.max(0, Math.min(100, mood.value + finalModifier));
  mood.lastEventTime = currentTime;
}

/**
 * 获取个性对情绪变化的影响系数
 */
function getPersonalityMoodFactor(personality: CatPersonality, eventType: string): number {
  switch (eventType) {
    case 'chase_start':
    case 'play_fight':
      return 0.5 + (personality.playfulness / 100) * 1.0;
    
    case 'pet':
    case 'socialize':
      return 0.5 + (personality.sociability / 100) * 1.0;
    
    case 'flee':
    case 'hide':
      // 勇敢猫受影响更小（反向）
      return 1.5 - (personality.bravery / 100) * 1.0;
    
    case 'eat':
      return 0.5 + (personality.appetite / 100) * 1.0;
    
    case 'bored':
      // 耐心猫更不容易无聊（反向）
      return 1.5 - (personality.patience / 100) * 1.0;
    
    case 'groom':
      return 0.5 + (personality.cleanliness / 100) * 1.0;
    
    default:
      return 1.0;
  }
}

/**
 * 获取当前情绪阈值
 */
export function getMoodThreshold(value: number): MoodThreshold {
  if (value < 20) {return 'depressed';}
  if (value < 40) {return 'calm';}
  if (value < 60) {return 'content';}
  if (value < 80) {return 'excited';}
  return 'euphoric';
}

/**
 * 获取情绪对行为权重的修正
 */
export function getMoodBehaviorModifier(moodValue: number, behavior: string): number {
  const threshold = getMoodThreshold(moodValue);
  
  switch (threshold) {
    case 'euphoric':
      if (behavior === 'chasing' || behavior === 'socializing') {return 1.3;}
      if (behavior === 'sleeping') {return 0.5;}
      return 1.0;
    
    case 'excited':
      if (behavior === 'chasing' || behavior === 'socializing') {return 1.15;}
      return 1.0;
    
    case 'content':
      return 1.0;
    
    case 'calm':
      if (behavior === 'sleeping') {return 1.2;}
      if (behavior === 'hiding') {return 1.1;}
      return 1.0;
    
    case 'depressed':
      if (behavior === 'sleeping') {return 1.5;}
      if (behavior === 'hiding') {return 1.3;}
      if (behavior === 'moving') {return 0.6;}
      return 1.0;
  }
}

/**
 * 获取耳朵角度（情绪视觉反馈）
 */
export function getEarAngle(moodValue: number): number {
  // 0 → -30°（下垂），50 → 0°（正常），100 → +20°（竖起）
  return -30 + (moodValue / 100) * 50;
}

/**
 * 获取尾巴高度（情绪视觉反馈）
 */
export function getTailHeight(moodValue: number): number {
  // 0 → 0.3（低垂），50 → 0.65（正常），100 → 1.0（翘起）
  return 0.3 + (moodValue / 100) * 0.7;
}

/**
 * 获取尾巴摆动频率（情绪视觉反馈）
 */
export function getTailWagSpeed(moodValue: number): number {
  // 0 → 0.5Hz，50 → 1.75Hz，100 → 3Hz
  return 0.5 + (moodValue / 100) * 2.5;
}

/**
 * 获取眼睛大小（情绪视觉反馈）
 */
export function getEyeScale(moodValue: number): number {
  // 0 → 0.8（半闭），50 → 1.0（正常），100 → 1.2（睁大）
  return 0.8 + (moodValue / 100) * 0.4;
}

/**
 * 检查是否应该触发粒子效果
 */
export function shouldTriggerParticle(moodValue: number, frameCount: number): boolean {
  const threshold = getMoodThreshold(moodValue);
  
  let interval: number;
  let chance: number;
  
  switch (threshold) {
    case 'depressed':
      interval = 300;
      chance = 1.0;
      break;
    case 'calm':
      return false; // 无粒子
    case 'content':
      interval = 180;
      chance = 0.3;
      break;
    case 'excited':
      interval = 90;
      chance = 1.0;
      break;
    case 'euphoric':
      interval = 30;
      chance = 1.0;
      break;
  }
  
  return frameCount % interval === 0 && Math.random() < chance;
}

/**
 * 获取粒子类型
 */
export function getParticleType(moodValue: number): string {
  const threshold = getMoodThreshold(moodValue);
  
  switch (threshold) {
    case 'depressed': return 'sigh';
    case 'calm': return 'none';
    case 'content': return 'heart';
    case 'excited': return 'mixed';
    case 'euphoric': return 'burst';
  }
}
