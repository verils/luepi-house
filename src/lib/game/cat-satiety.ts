import type { CatActionState } from './types';

// 饱腹系统（第二驱力维度）：饱腹随时间消耗，进食补充。
// 全部纯函数，状态只是 Cat 上的一个 number，仿 cat-energy 模式。
// 语义与体力一致：100 = 饱足，0 = 极饿（越高越好）。

export const SATIETY_MAX = 100;
export const HUNGRY_SATIETY = 40; // 饥饿阈值：饱腹低于该值后进食成为优先事项

// 各行为每帧饱腹增量（× dt）：正为补充，负为消耗
const SATIETY_DELTA: Record<CatActionState, number> = {
  eating: 1.5,
  drinking: 0.2,
  sleeping: -0.02,
  hiding: -0.02,
  idle: -0.04,
  watching: -0.04,
  grooming: -0.04,
  moving: -0.06,
  exploring: -0.06,
  socializing: -0.06,
  following: -0.06,
  climbing: -0.08,
  playing: -0.08,
  chasing: -0.1,
  fleeing: -0.1,
  playFighting: -0.12,
};

// 初始饱腹：60-80，开局不饿但也非完全饱足
export function createSatiety(): number {
  return 60 + Math.floor(Math.random() * 20);
}

// 每帧更新饱腹（dt 缩放），结果 clamp 到 [0, SATIETY_MAX]
export function updateSatiety(satiety: number, action: CatActionState, dt: number): number {
  const next = satiety + SATIETY_DELTA[action] * dt;
  return Math.max(0, Math.min(SATIETY_MAX, next));
}

export function isHungry(satiety: number): boolean {
  return satiety <= HUNGRY_SATIETY;
}

// 进食紧迫因子：饱足时 0.1（几乎不想吃），阈值处 1，极饿时线性升至 3。
// 用于 idle 决策的 eating 权重与 eat POI 权重。
export function getEatUrgency(satiety: number): number {
  if (satiety <= HUNGRY_SATIETY) {
    return 1 + ((HUNGRY_SATIETY - satiety) / HUNGRY_SATIETY) * 2;
  }
  return 0.1 + ((SATIETY_MAX - satiety) / (SATIETY_MAX - HUNGRY_SATIETY)) * 0.9;
}
