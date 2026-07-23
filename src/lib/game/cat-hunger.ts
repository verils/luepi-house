import type { CatActionState } from './types';

// 饥饿系统（第二驱力维度）：饥饿随时间累积，进食补充。
// 全部纯函数，状态只是 Cat 上的一个 number，仿 cat-energy 模式。
// 语义与体力相反：0 = 饱足，100 = 极饿（越高越糟）。

export const HUNGER_MAX = 100;
export const HUNGRY_THRESHOLD = 60; // 饥饿阈值：超过后进食成为优先事项

// 各行为每帧饥饿增量（× dt）：正为变饿，负为补充
const HUNGER_DELTA: Record<CatActionState, number> = {
  eating: -1.5,
  drinking: -0.2,
  sleeping: 0.02,
  hiding: 0.02,
  idle: 0.04,
  watching: 0.04,
  grooming: 0.04,
  moving: 0.06,
  exploring: 0.06,
  socializing: 0.06,
  climbing: 0.08,
  chasing: 0.1,
  fleeing: 0.1,
  playFighting: 0.12,
};

// 初始饥饿：20-40，开局不饿但也非完全饱足
export function createHunger(): number {
  return 20 + Math.floor(Math.random() * 20);
}

// 每帧更新饥饿（dt 缩放），结果 clamp 到 [0, HUNGER_MAX]
export function updateHunger(hunger: number, action: CatActionState, dt: number): number {
  const next = hunger + HUNGER_DELTA[action] * dt;
  return Math.max(0, Math.min(HUNGER_MAX, next));
}

export function isHungry(hunger: number): boolean {
  return hunger >= HUNGRY_THRESHOLD;
}

// 进食紧迫因子：不饿时 0.1（几乎不想吃），阈值处 1，极饿时线性升至 3。
// 用于 idle 决策的 eating 权重与 eat POI 权重。
export function getEatUrgency(hunger: number): number {
  if (hunger >= HUNGRY_THRESHOLD) {
    return 1 + ((hunger - HUNGRY_THRESHOLD) / (HUNGER_MAX - HUNGRY_THRESHOLD)) * 2;
  }
  return 0.1 + (hunger / HUNGRY_THRESHOLD) * 0.9;
}
