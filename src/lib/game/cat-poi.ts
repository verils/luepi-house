import type { Cat, CatActionState, CatBed, Furniture, Shelter, Toy } from './types';
import { getMoodThreshold } from './mood-system';
import { CHASE_MIN_ENERGY, getEnergyBehaviorFactor } from './cat-energy';
import { getEatUrgency } from './cat-satiety';

// POI（兴趣点）系统：从现有家具/猫窝/庇护所/玩具派生目的地，不新增配置。
// 全部纯函数；状态机负责把选中的 POI 转成移动目标与 nextAction。

export type POIType = 'rest' | 'observe' | 'eat' | 'hide' | 'play';

export interface POI {
  id: string;
  name: string;
  type: POIType;
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean; // 实体家具无法走到中心，需要边缘停靠点
}

export const POI_CHANCE = 0.7; // 移动选 POI 的概率；30% 纯随机保留探索感

// 家具 id → POI 类型映射；未知 id 不派生 POI
const FURNITURE_POI_TYPE: Record<string, POIType> = {
  sofa: 'rest',
  cushion: 'rest',
  catTree: 'observe',
  coffeeTable: 'observe',
  foodBowl: 'eat',
};

export function derivePOIs(
  furnitures: readonly Furniture[],
  catBeds: readonly CatBed[],
  shelters: readonly Shelter[],
  toys: readonly Toy[] = []
): POI[] {
  const pois: POI[] = [];
  for (const f of furnitures) {
    const type = FURNITURE_POI_TYPE[f.id];
    if (type) {
      pois.push({ id: f.id, name: f.name, type, x: f.x, y: f.y, width: f.width, height: f.height, solid: true });
    }
  }
  for (const b of catBeds) {
    pois.push({ id: b.id, name: b.name, type: 'rest', x: b.x, y: b.y, width: b.width, height: b.height, solid: false });
  }
  for (const s of shelters) {
    pois.push({ id: s.id, name: s.name, type: 'hide', x: s.x, y: s.y, width: s.width, height: s.height, solid: false });
  }
  for (const t of toys) {
    pois.push({ id: t.id, name: t.name, type: 'play', x: t.x, y: t.y, width: t.width, height: t.height, solid: false });
  }
  return pois;
}

// POI 权重：个性驱动 + 体力/情绪修正
export function getPOIWeight(cat: Cat, poi: POI): number {
  const p = cat.personality;
  const depressed = getMoodThreshold(cat.mood.value) === 'depressed';
  switch (poi.type) {
    case 'rest': {
      let w = 1 + p.patience / 100 + p.cleanliness / 100;
      if (cat.energy < CHASE_MIN_ENERGY) { w *= 2; } // 体力低更想休息
      if (depressed) { w *= 2; }
      return w;
    }
    case 'observe':
      return 1 + p.energy / 100 + p.curiosity / 100;
    case 'eat':
      return (1 + p.appetite / 50) * getEatUrgency(cat.satiety); // 越饿越想去食盆
    case 'hide': {
      let w = 1 + (100 - p.bravery) / 100;
      if (depressed) { w *= 2; }
      return w;
    }
    case 'play': {
      // 调皮驱动 + 体力因子（保底 0.2，力竭的猫偶尔也拨弄两下）
      const energyFactor = 0.2 + 0.8 * getEnergyBehaviorFactor(cat.energy);
      return (1 + p.playfulness / 50) * energyFactor;
    }
  }
}

// 加权随机选择 POI；空列表返回 null
export function selectPOI(cat: Cat, pois: readonly POI[], rng: () => number = Math.random): POI | null {
  if (pois.length === 0) { return null; }
  const weights = pois.map((poi) => getPOIWeight(cat, poi));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < pois.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { return pois[i]; }
  }
  return pois[pois.length - 1];
}

// 停靠点：非实体（猫窝/纸箱）→ 中心；实体家具 → 随机一条边的外侧 clearance 处
export function getPOIApproachPoint(
  poi: POI,
  clearance: number,
  rng: () => number = Math.random
): { x: number; y: number } {
  if (!poi.solid) {
    return { x: poi.x + poi.width / 2, y: poi.y + poi.height / 2 };
  }
  const side = Math.floor(rng() * 4); // 0上 1下 2左 3右
  switch (side) {
    case 0: return { x: poi.x + rng() * poi.width, y: poi.y - clearance };
    case 1: return { x: poi.x + rng() * poi.width, y: poi.y + poi.height + clearance };
    case 2: return { x: poi.x - clearance, y: poi.y + rng() * poi.height };
    default: return { x: poi.x + poi.width + clearance, y: poi.y + rng() * poi.height };
  }
}

// 到达 POI 后的行为：rest 按体力决定瞌睡或长休息，observe 注视或停留，eat 进食，hide 躲藏，play 玩耍
export function getArrivalAction(cat: Cat, poiType: POIType, rng: () => number = Math.random): CatActionState {
  switch (poiType) {
    case 'rest': return cat.energy < 50 ? 'sleeping' : 'idle';
    case 'observe': return rng() < 0.5 ? 'watching' : 'idle';
    case 'eat': return 'eating';
    case 'hide': return 'hiding';
    case 'play': return 'playing';
  }
}
