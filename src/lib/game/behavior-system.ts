// 行为系统 - 14种行为配置和决策逻辑

import type { CatActionState } from './types';

export interface BehaviorConfig {
  minDuration: number;    // 最小持续帧数
  maxDuration: number;    // 最大持续帧数
  cooldown: number;       // 冷却帧数
  requiresTarget: boolean; // 是否需要目标位置
  targetTypes?: string[];  // 目标类型（食盆、水碗等）
}

// 行为配置表
export const BEHAVIOR_CONFIG: Record<CatActionState, BehaviorConfig> = {
  idle:         { minDuration: 60,  maxDuration: 300, cooldown: 0,   requiresTarget: false },
  moving:       { minDuration: 30,  maxDuration: 180, cooldown: 0,   requiresTarget: true },
  sleeping:     { minDuration: 300, maxDuration: 600, cooldown: 120, requiresTarget: true, targetTypes: ['catBed'] },
  hiding:       { minDuration: 240, maxDuration: 480, cooldown: 180, requiresTarget: true, targetTypes: ['shelter'] },
  chasing:      { minDuration: 60,  maxDuration: 300, cooldown: 60,  requiresTarget: true, targetTypes: ['cat'] },
  fleeing:      { minDuration: 30,  maxDuration: 120, cooldown: 30,  requiresTarget: true },
  grooming:     { minDuration: 60,  maxDuration: 180, cooldown: 60,  requiresTarget: false },
  playFighting: { minDuration: 90,  maxDuration: 180, cooldown: 120, requiresTarget: true, targetTypes: ['cat'] },
  eating:       { minDuration: 60,  maxDuration: 120, cooldown: 300, requiresTarget: true, targetTypes: ['foodBowl'] },
  drinking:     { minDuration: 30,  maxDuration: 60,  cooldown: 300, requiresTarget: true, targetTypes: ['waterBowl'] },
  exploring:    { minDuration: 120, maxDuration: 300, cooldown: 60,  requiresTarget: true },
  socializing:  { minDuration: 60,  maxDuration: 180, cooldown: 120, requiresTarget: true, targetTypes: ['cat'] },
  watching:     { minDuration: 60,  maxDuration: 180, cooldown: 60,  requiresTarget: true },
  climbing:     { minDuration: 90,  maxDuration: 240, cooldown: 120, requiresTarget: true, targetTypes: ['catTree'] },
};

// 时间阶段对行为的修正系数
const TIME_BEHAVIOR_MODIFIERS: Record<string, Partial<Record<CatActionState, number>>> = {
  dawn: {
    sleeping: 0.7,    // 黎明时睡觉概率降低
    idle: 1.2,        // 逐渐活跃
    moving: 1.1,
  },
  day: {
    // 白天无特殊修正
  },
  dusk: {
    sleeping: 1.2,    // 黄昏时睡觉概率增加
    hiding: 1.1,
    moving: 0.9,
  },
  night: {
    sleeping: 1.5,    // 夜晚睡觉概率大幅增加
    hiding: 1.2,
    moving: 0.6,      // 移动概率降低
    chasing: 0.7,
  },
};

/**
 * 获取行为持续时间
 */
export function getBehaviorDuration(behavior: CatActionState): number {
  const config = BEHAVIOR_CONFIG[behavior];
  return config.minDuration + Math.random() * (config.maxDuration - config.minDuration);
}

/**
 * 获取时间阶段修正系数
 */
export function getTimeModifier(phase: string, behavior: CatActionState): number {
  const modifiers = TIME_BEHAVIOR_MODIFIERS[phase];
  if (!modifiers || !(behavior in modifiers)) {
    return 1.0;
  }
  return modifiers[behavior] ?? 1.0;
}

/**
 * 检查行为是否可以执行
 */
export function canExecuteBehavior(
  behavior: CatActionState,
  availableTargets: Record<string, boolean>
): boolean {
  const config = BEHAVIOR_CONFIG[behavior];
  
  if (!config.requiresTarget) {
    return true;
  }
  
  if (!config.targetTypes || config.targetTypes.length === 0) {
    return true;
  }
  
  return config.targetTypes.some(type => availableTargets[type]);
}

/**
 * 计算行为权重（综合所有因素）
 */
export function calculateBehaviorWeight(
  behavior: CatActionState,
  baseWeight: number,
  personalityModifier: number,
  moodModifier: number,
  timeModifier: number
): number {
  return baseWeight * personalityModifier * moodModifier * timeModifier;
}

/**
 * 加权随机选择行为
 */
export function weightedRandomBehavior(weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([_, w]) => w > 0);
  const total = entries.reduce((sum, [_, w]) => sum + w, 0);
  
  let random = Math.random() * total;
  for (const [action, weight] of entries) {
    random -= weight;
    if (random <= 0) return action;
  }
  
  return 'idle';
}
