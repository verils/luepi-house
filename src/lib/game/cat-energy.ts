import type { CatActionState } from './types';

// 体力系统（驱力 MVP）：行为产生体力消耗/恢复，高成本行为受体力门控。
// 全部纯函数，状态只是 Cat 上的一个 number，便于测试与未来扩展驱力维度。

export const ENERGY_MAX = 100;
export const CHASE_MIN_ENERGY = 30; // 发起追逐所需体力
export const PLAY_FIGHT_MIN_ENERGY = 25; // 发起打闹所需体力
export const EXHAUSTED_ENERGY = 10; // 力竭阈值：≤10 放弃高强度行为，>10 才能逃跑

// 各行为每帧体力增量（× dt）：正为恢复，负为消耗
const ENERGY_DELTA: Record<CatActionState, number> = {
  sleeping: 0.5,
  hiding: 0.25,
  eating: 0.15,
  drinking: 0.15,
  idle: 0.12,
  watching: 0.12,
  grooming: 0.08,
  moving: -0.06,
  exploring: -0.06,
  socializing: -0.06,
  climbing: -0.15,
  fleeing: -0.35,
  chasing: -0.45,
  playFighting: -0.6,
};

// 初始体力：70-90，避免开局即力竭也避免满值同质化
export function createEnergy(): number {
  return 70 + Math.floor(Math.random() * 20);
}

// 每帧更新体力（dt 缩放），结果 clamp 到 [0, ENERGY_MAX]
export function updateEnergy(energy: number, action: CatActionState, dt: number): number {
  const next = energy + ENERGY_DELTA[action] * dt;
  return Math.max(0, Math.min(ENERGY_MAX, next));
}

export function canChase(energy: number): boolean {
  return energy >= CHASE_MIN_ENERGY;
}

export function canPlayFight(energy: number): boolean {
  return energy >= PLAY_FIGHT_MIN_ENERGY;
}

export function isExhausted(energy: number): boolean {
  return energy <= EXHAUSTED_ENERGY;
}

// 与力竭互斥：恰好处于力竭阈值的猫不逃跑（降级为注视），避免边界矛盾
export function canFlee(energy: number): boolean {
  return !isExhausted(energy);
}

// idle 决策中互动类行为的体力因子：<30 归零，30→100 线性升至 1
export function getEnergyBehaviorFactor(energy: number): number {
  if (energy < CHASE_MIN_ENERGY) {
    return 0;
  }
  return (energy - CHASE_MIN_ENERGY) / (ENERGY_MAX - CHASE_MIN_ENERGY);
}
