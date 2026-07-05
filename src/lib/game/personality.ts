// 个性系统 - 猫咪固定个性属性

import type { CatPersonality } from './types';

/**
 * 创建个性配置（带随机浮动）
 */
export function createPersonality(base: CatPersonality): CatPersonality {
  return {
    curiosity: addVariation(base.curiosity),
    energy: addVariation(base.energy),
    sociability: addVariation(base.sociability),
    bravery: addVariation(base.bravery),
    independence: addVariation(base.independence),
    appetite: addVariation(base.appetite),
    cleanliness: addVariation(base.cleanliness),
    playfulness: addVariation(base.playfulness),
    alertness: addVariation(base.alertness),
    patience: addVariation(base.patience),
  };
}

/**
 * 添加随机浮动（±10）
 */
function addVariation(baseValue: number): number {
  const variation = Math.floor(Math.random() * 21) - 10; // -10 to +10
  return Math.max(0, Math.min(100, baseValue + variation));
}

/**
 * 获取个性修正系数（线性映射 0-100 → 0.5-1.5）
 */
export function getPersonalityModifier(value: number): number {
  return 0.5 + (value / 100) * 1.0;
}

/**
 * 获取反向个性修正系数（用于反向关系，如勇敢度→hiding概率）
 * 0 → 2.0, 100 → 0.2
 */
export function getInversePersonalityModifier(value: number): number {
  return 2.0 - (value / 100) * 1.8;
}

/**
 * 计算行为权重修正
 */
export function calculateBehaviorWeight(
  personality: CatPersonality,
  behavior: string
): number {
  switch (behavior) {
    case 'moving':
    case 'climbing':
      return getPersonalityModifier(personality.energy);
    
    case 'sleeping':
      return getPersonalityModifier(personality.patience) * 
             (2.0 - getPersonalityModifier(personality.energy));
    
    case 'hiding':
      return getInversePersonalityModifier(personality.bravery);
    
    case 'chasing':
      return getPersonalityModifier(personality.sociability) * 
             getPersonalityModifier(personality.playfulness);
    
    case 'grooming':
      return getPersonalityModifier(personality.cleanliness);
    
    case 'eating':
      return getPersonalityModifier(personality.appetite);
    
    case 'exploring':
      return getPersonalityModifier(personality.curiosity);
    
    case 'socializing':
      return getPersonalityModifier(personality.sociability);
    
    case 'watching':
      return getPersonalityModifier(personality.alertness);
    
    case 'playFighting':
      return getPersonalityModifier(personality.playfulness);
    
    case 'idle':
    case 'drinking':
    case 'fleeing':
    default:
      return 1.0;
  }
}

/**
 * 获取追逐反转概率（受调皮度影响）
 */
export function getChaseReverseChance(personality: CatPersonality): number {
  const baseChance = 0.3;
  return baseChance * getPersonalityModifier(personality.playfulness);
}

/**
 * 获取反应延迟（受警觉性影响）
 */
export function getReactionDelay(personality: CatPersonality): number {
  const baseDelay = 1.0;
  return baseDelay * (2.0 - getPersonalityModifier(personality.alertness));
}

/**
 * 获取idle时长修正（受耐心影响）
 */
export function getIdleDurationModifier(personality: CatPersonality): number {
  return 0.6 + (personality.patience / 100) * 1.0;
}
