import type { Cat, CatActionState } from './types';
import { canChase, canFlee } from './cat-energy';

// 感知-反应层常量（单位：像素 / 帧）
export const VIEW_RADIUS = 200; // 圆形视野半径
export const ATTENTION_RADIUS = 120; // 进入此距离且接近时触发主动反应
export const REACTION_COOLDOWN = 90; // 反应冷却（帧），防打断抖动
export const APPROACH_THRESHOLD = 0.5; // 两帧距离差判定"接近"的阈值（像素/帧）

// 可被反应层打断的状态；睡觉/躲藏/打闹/吃喝/追逐/逃跑不可打断
const INTERRUPTABLE_ACTIONS: ReadonlySet<CatActionState> = new Set([
  'idle',
  'moving',
  'grooming',
  'watching',
  'exploring',
]);

// 感知结果（纯数据）
export interface Perception {
  otherId: string;
  distance: number;
  otherAction: CatActionState;
  approaching: boolean;
}

// 反应类型：追逐走意图系统，逃离/注视直接切自身状态
export type ReactionType = 'chase' | 'flee' | 'watch';

// 感知：视野内产出对方信息，视野外返回 null。approaching 用两帧距离差估算
export function perceive(cat: Cat, other: Cat, lastDistance: number | null): Perception | null {
  const dx = other.x - cat.x;
  const dy = other.y - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > VIEW_RADIUS) {
    return null;
  }

  const approaching = lastDistance !== null && lastDistance - distance > APPROACH_THRESHOLD;
  return { otherId: other.id, distance, otherAction: other.action, approaching };
}

// 反应评估：按个性分支。纯函数，不修改任何状态
export function evaluateReaction(cat: Cat, p: Perception): ReactionType | null {
  // 围观：视野内对方在打闹
  if (p.otherAction === 'playFighting') {
    return 'watch';
  }

  // 对方进入关注距离（随警觉性缩放）且正在接近
  if (p.distance <= getAttentionRadius(cat) && p.approaching) {
    const personality = cat.personality;
    // 胆小且不够贪玩的猫先逃跑；力竭的猫跑不动，降级为注视
    if (personality.bravery < 50 && personality.playfulness < 70) {
      return canFlee(cat.energy) ? 'flee' : 'watch';
    }
    // 社交或调皮度高的猫主动发起追逐；体力不足降级为注视
    if (personality.sociability >= 60 || personality.playfulness >= 60) {
      return canChase(cat.energy) ? 'chase' : 'watch';
    }
    return 'watch';
  }

  return null;
}

// 当前状态是否可被反应层打断
export function canInterrupt(action: CatActionState): boolean {
  return INTERRUPTABLE_ACTIONS.has(action);
}

// 注意力半径：随警觉性缩放（60-120px）。钝感猫注意不到远处的接近，神经质猫眼观六路
export function getAttentionRadius(cat: Cat): number {
  return ATTENTION_RADIUS * (0.5 + 0.5 * (cat.personality.alertness / 100));
}

// 对方是否可被作为反应对象（睡着/躲藏的猫不引发反应）
export function isReactable(otherAction: CatActionState): boolean {
  return otherAction !== 'sleeping' && otherAction !== 'hiding';
}
