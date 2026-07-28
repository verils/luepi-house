import { describe, it, expect } from 'vitest';
import {
  derivePOIs,
  getPOIWeight,
  selectPOI,
  getPOIApproachPoint,
  getArrivalAction,
  type POI,
} from './cat-poi';
import { updateCatState, type StateContext } from './cat-state-machine';
import type { Cat, CatBed, Furniture, Shelter, Toy } from './types';
import { createMoodState } from './mood-system';

function createTestCat(overrides: Partial<Cat> = {}): Cat {
  return {
    id: 'cat-' + Math.random().toString(36).slice(2, 6),
    name: 'TestCat',
    x: 100,
    y: 100,
    visualWidth: 32,
    visualHeight: 32,
    collisionRadius: 16,
    interactionRadius: 20,
    color: '#fff',
    rotation: 0,
    speed: 1.5,
    targetX: 100,
    targetY: 100,
    action: 'idle',
    idleTimer: 600,
    actionTimer: 0,
    blinkTimer: 120,
    isBlinking: false,
    mood: createMoodState(),
    moodTimer: 0,
    chaseTargetId: null,
    actionSwitchTimer: 0,
    reactionCooldown: 0,
    lastPerceivedDistance: null,
    energy: 100,
    satiety: 50,
    visitedPoints: [],
    personality: {
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
    },
    ...overrides,
  };
}

function createCtx(cats: Cat[], overrides: Partial<StateContext> = {}): StateContext {
  return {
    shelters: [],
    catBeds: [],
    furnitures: [],
    toys: [],
    solidObjects: [],
    house: { x: 24, y: 24, width: 960, height: 640 },
    allCats: cats,
    ...overrides,
  };
}

const furnitures: Furniture[] = [
  { id: 'sofa', name: '沙发', x: 100, y: 100, width: 96, height: 48, wallPlaced: true },
  { id: 'cushion', name: '软垫', x: 300, y: 100, width: 48, height: 32, wallPlaced: false },
  { id: 'catTree', name: '猫爬架', x: 500, y: 100, width: 48, height: 64, wallPlaced: false },
  { id: 'coffeeTable', name: '茶几', x: 700, y: 100, width: 48, height: 32, wallPlaced: false },
  { id: 'foodBowl', name: '食盆', x: 100, y: 400, width: 32, height: 32, wallPlaced: false },
  { id: 'bookshelf', name: '书架', x: 300, y: 400, width: 64, height: 32, wallPlaced: true },
];
const catBeds: CatBed[] = [
  { id: 'bed1', name: '猫窝', x: 500, y: 400, width: 48, height: 32 },
];
const shelters: Shelter[] = [
  { id: 'box', name: '纸箱', x: 700, y: 400, width: 48, height: 48 },
];

describe('derivePOIs', () => {
  it('按家具 id 映射 POI 类型', () => {
    const pois = derivePOIs(furnitures, [], []);
    const byId = new Map(pois.map((p) => [p.id, p]));

    expect(byId.get('sofa')!.type).toBe('rest');
    expect(byId.get('cushion')!.type).toBe('rest');
    expect(byId.get('catTree')!.type).toBe('observe');
    expect(byId.get('coffeeTable')!.type).toBe('observe');
    expect(byId.get('foodBowl')!.type).toBe('eat');
  });

  it('未知家具 id 不派生 POI', () => {
    const pois = derivePOIs(furnitures, [], []);
    expect(pois.find((p) => p.id === 'bookshelf')).toBeUndefined();
  });

  it('猫窝→rest、庇护所→hide，且均为非实体', () => {
    const pois = derivePOIs([], catBeds, shelters);
    const bed = pois.find((p) => p.id === 'bed1')!;
    const box = pois.find((p) => p.id === 'box')!;

    expect(bed.type).toBe('rest');
    expect(bed.solid).toBe(false);
    expect(box.type).toBe('hide');
    expect(box.solid).toBe(false);
  });

  it('家具 POI 标记为实体', () => {
    const pois = derivePOIs(furnitures, [], []);
    expect(pois.every((p) => p.solid)).toBe(true);
  });
});

describe('getPOIWeight', () => {
  const restPOI: POI = { id: 'bed1', name: '猫窝', type: 'rest', x: 0, y: 0, width: 48, height: 32, solid: false };
  const hidePOI: POI = { id: 'box', name: '纸箱', type: 'hide', x: 0, y: 0, width: 48, height: 48, solid: false };
  const eatPOI: POI = { id: 'foodBowl', name: '食盆', type: 'eat', x: 0, y: 0, width: 32, height: 32, solid: true };

  it('低体力时 rest 权重翻倍', () => {
    const normal = getPOIWeight(createTestCat({ energy: 100 }), restPOI);
    const tired = getPOIWeight(createTestCat({ energy: 20 }), restPOI);
    expect(tired).toBeCloseTo(normal * 2);
  });

  it('胆小猫 hide 权重更高', () => {
    const brave = getPOIWeight(createTestCat({
      personality: { ...createTestCat().personality, bravery: 80 },
    }), hidePOI);
    const timid = getPOIWeight(createTestCat({
      personality: { ...createTestCat().personality, bravery: 20 },
    }), hidePOI);
    expect(timid).toBeGreaterThan(brave);
  });

  it('贪吃猫 eat 权重更高', () => {
    const picky = getPOIWeight(createTestCat({
      personality: { ...createTestCat().personality, appetite: 20 },
    }), eatPOI);
    const glutton = getPOIWeight(createTestCat({
      personality: { ...createTestCat().personality, appetite: 90 },
    }), eatPOI);
    expect(glutton).toBeGreaterThan(picky);
  });

  it('情绪低落时 rest/hide 权重翻倍', () => {
    const cat = createTestCat();
    cat.mood.value = 10; // depressed
    const normalCat = createTestCat();
    normalCat.mood.value = 50; // content

    expect(getPOIWeight(cat, restPOI)).toBeCloseTo(getPOIWeight(normalCat, restPOI) * 2);
    expect(getPOIWeight(cat, hidePOI)).toBeCloseTo(getPOIWeight(normalCat, hidePOI) * 2);
  });
});

describe('selectPOI', () => {
  it('空列表返回 null', () => {
    expect(selectPOI(createTestCat(), [])).toBeNull();
  });

  it('按权重确定性选中（注入 rng）', () => {
    const pois = derivePOIs(furnitures, [], []);
    const cat = createTestCat();
    const weights = pois.map((p) => getPOIWeight(cat, p));
    const total = weights.reduce((s, w) => s + w, 0);

    // rng=0 → 命中第一个；rng 接近 1 → 命中最后一个
    expect(selectPOI(cat, pois, () => 0)).toBe(pois[0]);
    expect(selectPOI(cat, pois, () => (total - 0.001) / total)).toBe(pois[pois.length - 1]);
  });
});

describe('getPOIApproachPoint', () => {
  it('非实体 POI 返回中心点', () => {
    const bed: POI = { id: 'bed1', name: '猫窝', type: 'rest', x: 100, y: 100, width: 48, height: 32, solid: false };
    expect(getPOIApproachPoint(bed, 22, () => 0.5)).toEqual({ x: 124, y: 116 });
  });

  it('实体 POI 返回矩形外侧 clearance 处（rng 定边）', () => {
    const sofa: POI = { id: 'sofa', name: '沙发', type: 'rest', x: 100, y: 100, width: 96, height: 48, solid: true };
    // rng=0.5 → side=2（左边），y 居中
    const p = getPOIApproachPoint(sofa, 22, () => 0.5);
    expect(p.x).toBe(100 - 22);
    expect(p.y).toBe(100 + 0.5 * 48);

    // rng=0.1 → side=0（上边）
    const top = getPOIApproachPoint(sofa, 22, () => 0.1);
    expect(top.y).toBe(100 - 22);
    expect(top.x).toBeGreaterThanOrEqual(100);
    expect(top.x).toBeLessThanOrEqual(196);
  });
});

describe('getArrivalAction', () => {
  it('rest：体力低瞌睡，体力足长休息', () => {
    expect(getArrivalAction(createTestCat({ energy: 40 }), 'rest')).toBe('sleeping');
    expect(getArrivalAction(createTestCat({ energy: 80 }), 'rest')).toBe('idle');
  });

  it('observe：按 rng 注视或停留', () => {
    const cat = createTestCat();
    expect(getArrivalAction(cat, 'observe', () => 0.4)).toBe('watching');
    expect(getArrivalAction(cat, 'observe', () => 0.6)).toBe('idle');
  });

  it('eat→eating，hide→hiding', () => {
    const cat = createTestCat();
    expect(getArrivalAction(cat, 'eat')).toBe('eating');
    expect(getArrivalAction(cat, 'hide')).toBe('hiding');
  });
});

describe('POI 集成（updateCatState）', () => {
  it('moving 到达带 nextAction 的目标点后切换对应状态', () => {
    const bed = catBeds[0];
    const cat = createTestCat({
      action: 'moving',
      x: bed.x + 24,
      y: bed.y + 16,
      targetX: bed.x + 24,
      targetY: bed.y + 16,
      nextAction: 'sleeping',
    });
    const ctx = createCtx([cat], { catBeds });

    updateCatState(cat, ctx);

    expect(cat.action).toBe('sleeping');
    expect(cat.nextAction).toBeUndefined();
  });

  it('moving 到达无 nextAction 的目标点后回到 idle', () => {
    const cat = createTestCat({ action: 'moving', x: 300, y: 300, targetX: 300, targetY: 300 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.action).toBe('idle');
    expect(cat.nextAction).toBeUndefined();
  });

  it('非 moving 状态不持有残留 nextAction（安全网）', () => {
    const cat = createTestCat({ action: 'grooming', nextAction: 'sleeping', actionTimer: 0 });
    const ctx = createCtx([cat]);

    updateCatState(cat, ctx);

    expect(cat.nextAction).toBeUndefined();
  });

  it('选择睡觉时不再瞬移：变为 moving 且 nextAction=sleeping（200 次抽样无一直接入睡）', () => {
    let sleepingWalks = 0;
    for (let i = 0; i < 200; i++) {
      const cat = createTestCat({ action: 'idle', idleTimer: 0, x: 600, y: 500 });
      const ctx = createCtx([cat], { catBeds });

      updateCatState(cat, ctx);

      // 有猫窝可达时，睡觉决策必须走过去，不允许直接切入 sleeping
      expect(cat.action).not.toBe('sleeping');
      if (cat.action === 'moving' && cat.nextAction === 'sleeping') {
        sleepingWalks++;
      }
    }
    // 确认睡觉路径被真实走到（加权随机下 200 次几乎必然命中）
    expect(sleepingWalks).toBeGreaterThan(0);
  });
});

describe('play POI（玩具）', () => {
  const toys: Toy[] = [
    { id: 'yarnBall', name: '毛线球', x: 100, y: 700, width: 32, height: 32 },
  ];
  const playPOI: POI = { id: 'yarnBall', name: '毛线球', type: 'play', x: 0, y: 0, width: 32, height: 32, solid: false };

  it('玩具派生为 play POI 且非实体', () => {
    const pois = derivePOIs([], [], [], toys);
    expect(pois).toHaveLength(1);
    expect(pois[0].type).toBe('play');
    expect(pois[0].solid).toBe(false);
  });

  it('不传玩具时不产生 play POI（向后兼容）', () => {
    const pois = derivePOIs(furnitures, catBeds, shelters);
    expect(pois.find((p) => p.type === 'play')).toBeUndefined();
  });

  it('调皮猫 play 权重更高', () => {
    const calm = getPOIWeight(createTestCat({
      personality: { ...createTestCat().personality, playfulness: 10 },
    }), playPOI);
    const naughty = getPOIWeight(createTestCat({
      personality: { ...createTestCat().personality, playfulness: 90 },
    }), playPOI);
    expect(naughty).toBeGreaterThan(calm);
  });

  it('低体力猫 play 权重更低', () => {
    const energetic = getPOIWeight(createTestCat({ energy: 100 }), playPOI);
    const tired = getPOIWeight(createTestCat({ energy: 20 }), playPOI);
    expect(tired).toBeLessThan(energetic);
  });

  it('到达 play POI 后进入 playing', () => {
    expect(getArrivalAction(createTestCat(), 'play')).toBe('playing');
  });
});
