import type { Cat, CatActionState, CatBed, CatIntent, Shelter, SolidObject, Furniture, House } from './types';
import { MAP_WIDTH, MAP_HEIGHT } from './types';
import { calculateBehaviorWeight, getChaseReverseChance, getIdleDurationModifier } from './personality';
import {
  applyMoodEvent,
  getMoodBehaviorModifier,
  getMoodThreshold,
  updateMood as updateMoodState
} from './mood-system';
import { getTimeModifier, weightedRandomBehavior } from './behavior-system';
import { type EventLogState, logBehaviorEvent } from './event-log';
import {
  canInterrupt,
  evaluateReaction,
  isReactable,
  perceive,
  REACTION_COOLDOWN,
} from './cat-perception';
import {
  canChase,
  canPlayFight,
  getEnergyBehaviorFactor,
  isExhausted,
  updateEnergy,
} from './cat-energy';
import { getEatUrgency, updateHunger } from './cat-hunger';
import {
  derivePOIs,
  getArrivalAction,
  getPOIApproachPoint,
  POI_CHANCE,
  selectPOI,
  type POI,
} from './cat-poi';

const ARRIVAL_THRESHOLD = 3;
const CAT_SEPARATION_DISTANCE = 16;

const ACTION_SWITCH_MIN = 20;
const ACTION_SWITCH_MAX = 60;
const GROOMING_CHANCE = 0.15;
const PLAY_FIGHT_CHANCE = 0.2;

const MOOD_SPEED_MULTIPLIER: Record<string, number> = {
  depressed: 0.6,
  calm: 0.8,
  content: 1.0,
  excited: 1.2,
  euphoric: 1.4,
};

const MOOD_ACTION_SWITCH_MULTIPLIER: Record<string, number> = {
  depressed: 2.0,
  calm: 1.5,
  content: 1.0,
  excited: 0.7,
  euphoric: 0.5,
};

export interface StateContext {
  shelters: Shelter[];
  catBeds: CatBed[];
  furnitures: Furniture[];
  solidObjects: readonly SolidObject[];
  house: House;
  allCats: readonly Cat[];
  eventLog?: EventLogState;
  gameTime?: { hour: number; minute: number; day: number };
}

export function updateCatState(cat: Cat, ctx: StateContext, dt: number = 1): CatIntent[] {
  const previousAction = cat.action;
  cat.actionTimer += dt;
  cat.moodTimer += dt;

  updateMood(cat, dt);
  cat.energy = updateEnergy(cat.energy, cat.action, dt);
  cat.hunger = updateHunger(cat.hunger, cat.action, dt);

  // nextAction 安全网：非移动状态不持有残留目的地（如反应层打断 moving 后）
  if (cat.action !== 'moving') {
    cat.nextAction = undefined;
  }

  if (cat.actionSwitchTimer > 0) {
    cat.actionSwitchTimer -= dt;
    if (cat.actionSwitchTimer <= 0) {
      const switchIntents = switchExcitedAction(cat, ctx);
      if (switchIntents.length > 0) { return switchIntents; }
    }
  }

  let intents: CatIntent[] = [];
  const reactionIntents = applyPerceptionReaction(cat, ctx, dt);
  if (reactionIntents !== null) {
    // 反应层打断了当前状态，本帧不再执行原状态更新
    intents = reactionIntents;
  } else {
  switch (cat.action) {
    case 'idle':
      intents = updateIdleState(cat, ctx, dt);
      break;
    case 'moving':
      updateMovingState(cat, ctx, dt);
      break;
    case 'sleeping':
      updateSleepingState(cat, ctx);
      break;
    case 'hiding':
      updateHidingState(cat, ctx);
      break;
    case 'chasing':
      intents = updateChasingState(cat, ctx, dt);
      break;
    case 'fleeing':
      updateFleeingState(cat, ctx, dt);
      break;
    case 'grooming':
      updateGroomingState(cat, ctx);
      break;
    case 'eating':
      updateEatingState(cat, ctx);
      break;
    case 'watching':
      updateWatchingState(cat, ctx);
      break;
    case 'playFighting':
      intents = updatePlayFightingState(cat, ctx);
      break;
  }
  }

  // 记录行为变化事件
  if (cat.action !== previousAction && ctx.eventLog) {
    logBehaviorEvent(ctx.eventLog, cat.id, cat.name, cat.action, ctx.gameTime);
  }

  updateBlink(cat, dt);

  // 猫间分离仅在非交互状态应用（追逐/逃跑/打闹需要贴身）
  let resolvedX = cat.x;
  let resolvedY = cat.y;
  if (cat.action !== 'chasing' && cat.action !== 'fleeing' && cat.action !== 'playFighting') {
    const resolved = resolveCatCollision(cat, resolvedX, resolvedY, ctx.allCats, ctx.house);
    resolvedX = resolved.x;
    resolvedY = resolved.y;
  }
  // 固体碰撞（墙/家具）对所有状态生效，每帧每猫恰好一次
  const solidResolved = resolveSolidCollisions(cat, resolvedX, resolvedY, ctx.solidObjects);
  cat.x = solidResolved.x;
  cat.y = solidResolved.y;

  return intents;
}

function updateMood(cat: Cat, dt: number): void {
  // 使用新的情绪系统
  updateMoodState(cat.mood, cat.personality, dt);
}

function updateBlink(cat: Cat, dt: number): void {
  cat.blinkTimer -= dt;
  if (cat.blinkTimer <= 0) {
    if (cat.isBlinking) {
      cat.isBlinking = false;
      cat.blinkTimer = 120 + Math.floor(Math.random() * 240);
    } else {
      cat.isBlinking = true;
      cat.blinkTimer = 4 + Math.floor(Math.random() * 4);
    }
  }
}

// 感知-反应层：每帧感知对方，命中条件时打断当前可打断状态。
// 返回 null 表示未触发反应；追逐反应走意图系统，逃离/注视只修改自身。
function applyPerceptionReaction(cat: Cat, ctx: StateContext, dt: number): CatIntent[] | null {
  if (cat.reactionCooldown > 0) {
    cat.reactionCooldown -= dt;
  }

  const other = ctx.allCats.find((c) => c.id !== cat.id);
  if (!other) {
    cat.lastPerceivedDistance = null;
    return null;
  }

  const perception = perceive(cat, other, cat.lastPerceivedDistance);
  cat.lastPerceivedDistance = perception ? perception.distance : null;

  if (!perception) { return null; }
  if (cat.reactionCooldown > 0) { return null; }
  if (!canInterrupt(cat.action)) { return null; }
  if (!isReactable(perception.otherAction)) { return null; }

  const reaction = evaluateReaction(cat, perception);
  if (!reaction) { return null; }

  cat.reactionCooldown = REACTION_COOLDOWN;

  switch (reaction) {
    case 'chase': {
      applyMoodEvent(cat.mood, 'chase_start', cat.personality, Date.now());
      cat.chaseTargetId = other.id;
      cat.actionSwitchTimer = getActionSwitchInterval(cat);
      cat.action = 'chasing';
      cat.actionTimer = 0;
      return [{ type: 'want_chase', initiatorId: cat.id, targetId: other.id }];
    }
    case 'flee':
      applyMoodEvent(cat.mood, 'flee', cat.personality, Date.now());
      cat.action = 'fleeing';
      cat.chaseTargetId = other.id;
      cat.actionTimer = 0;
      return [];
    case 'watch':
      enterWatchingState(cat, ctx);
      return [];
  }
}

function getEffectiveSpeed(cat: Cat): number {
  const moodThreshold = getMoodThreshold(cat.mood.value);
  return cat.speed * MOOD_SPEED_MULTIPLIER[moodThreshold];
}

function getActionSwitchInterval(cat: Cat): number {
  const base = ACTION_SWITCH_MIN + Math.floor(Math.random() * (ACTION_SWITCH_MAX - ACTION_SWITCH_MIN));
  const moodThreshold = getMoodThreshold(cat.mood.value);
  return Math.floor(base * MOOD_ACTION_SWITCH_MULTIPLIER[moodThreshold]);
}

function updateIdleState(cat: Cat, ctx: StateContext, dt: number): CatIntent[] {
  cat.idleTimer -= dt;

  if (cat.idleTimer <= 0) {
    // 互动类行为的体力因子：<30 归零，30→100 线性
    const energyFactor = getEnergyBehaviorFactor(cat.energy);

    // 使用加权随机选择下一个行为
    const weights: Record<string, number> = {
      idle: 30,
      moving: 40 * calculateBehaviorWeight(cat.personality, 'moving'),
      sleeping: 12 * calculateBehaviorWeight(cat.personality, 'sleeping'),
      hiding: 5 * calculateBehaviorWeight(cat.personality, 'hiding'),
      chasing: 2 * calculateBehaviorWeight(cat.personality, 'chasing') * energyFactor,
      eating: 5 * calculateBehaviorWeight(cat.personality, 'eating') * getEatUrgency(cat.hunger),
      drinking: 3,
      exploring: 8 * calculateBehaviorWeight(cat.personality, 'exploring'),
      socializing: calculateBehaviorWeight(cat.personality, 'socializing') * energyFactor,
      watching: 5 * calculateBehaviorWeight(cat.personality, 'watching'),
      climbing: 4 * calculateBehaviorWeight(cat.personality, 'climbing'),
      grooming: 8 * calculateBehaviorWeight(cat.personality, 'grooming'),
    };

    // 应用情绪修正
    for (const behavior of Object.keys(weights)) {
      weights[behavior] *= getMoodBehaviorModifier(cat.mood.value, behavior);
    }

    // 应用时间修正（需要从外部传入时间阶段）
    // 暂时使用默认值，后续集成时间系统
    const timePhase = 'day';
    for (const behavior of Object.keys(weights)) {
      weights[behavior] *= getTimeModifier(timePhase, behavior as CatActionState);
    }

    // 归一化并随机选择
    const action = weightedRandomBehavior(weights);
    
    switch (action) {
      case 'chasing':
        if (ctx.allCats.length > 1) {
          return startChasing(cat, ctx);
        } else {
          enterMovingState(cat, ctx);
        }
        break;
      case 'sleeping':
        if (ctx.catBeds.length > 0) {
          enterSleepingState(cat, ctx);
        } else {
          enterMovingState(cat, ctx);
        }
        break;
      case 'hiding':
        if (ctx.shelters.length > 0) {
          enterHidingState(cat, ctx);
        } else {
          enterMovingState(cat, ctx);
        }
        break;
      case 'eating': {
        // 走向食盆，到达后进食
        const eatPOIs = derivePOIs(ctx.furnitures, ctx.catBeds, ctx.shelters).filter((p) => p.type === 'eat');
        const poi = selectPOI(cat, eatPOIs);
        const point = poi ? pickApproachPoint(poi, cat, ctx) : null;
        if (point) {
          cat.targetX = point.x;
          cat.targetY = point.y;
          cat.nextAction = 'eating';
          cat.action = 'moving';
          cat.actionTimer = 0;
        } else {
          enterMovingState(cat, ctx);
        }
        break;
      }
      case 'drinking':
        // 没有水碗配置，保持随机移动
        enterMovingState(cat, ctx);
        break;
      case 'exploring':
        enterMovingState(cat, ctx);
        break;
      case 'socializing':
        if (ctx.allCats.length > 1) {
          return startChasing(cat, ctx);
        } else {
          enterMovingState(cat, ctx);
        }
        break;
      case 'watching':
        enterWatchingState(cat, ctx);
        break;
      case 'climbing':
      case 'grooming':
        enterGroomingState(cat);
        break;
      case 'moving':
      default:
        enterMovingState(cat, ctx);
        break;
    }
  }
  return [];
}

function updateMovingState(cat: Cat, ctx: StateContext, dt: number): void {
  const dx = cat.targetX - cat.x;
  const dy = cat.targetY - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= ARRIVAL_THRESHOLD) {
    cat.x = cat.targetX;
    cat.y = cat.targetY;
    // 消费 nextAction（POI 目的地携带的到达后行为）
    const next = cat.nextAction;
    cat.nextAction = undefined;
    cat.actionTimer = 0;
    switch (next) {
      case 'sleeping':
      case 'hiding':
      case 'eating':
        cat.action = next;
        return;
      case 'watching':
        enterWatchingState(cat, ctx);
        return;
      case 'idle':
        // POI 停留：较长的休息
        cat.action = 'idle';
        cat.idleTimer = Math.floor((240 + Math.floor(Math.random() * 240)) * getIdleDurationModifier(cat.personality));
        return;
      default:
        cat.action = 'idle';
        cat.idleTimer = Math.floor((180 + Math.floor(Math.random() * 360)) * getIdleDurationModifier(cat.personality));
        return;
    }
  }

  moveToward(cat, cat.targetX, cat.targetY, getEffectiveSpeed(cat), ctx, dt);
}

function updateSleepingState(cat: Cat, ctx: StateContext): void {
  if (cat.actionTimer > 300 + Math.random() * 300) {
    cat.action = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 120);
    cat.actionTimer = 0;
  }
}

function updateHidingState(cat: Cat, ctx: StateContext): void {
  if (cat.actionTimer > 240 + Math.random() * 360) {
    cat.action = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 120);
    cat.actionTimer = 0;
  }
}

function updateChasingState(cat: Cat, ctx: StateContext, dt: number): CatIntent[] {
  if (!cat.chaseTargetId) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 120);
    return [];
  }

  // 力竭：追累了，主动放弃
  if (isExhausted(cat.energy)) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 120);
    cat.actionTimer = 0;
    cat.chaseTargetId = null;
    return [];
  }

  const target = ctx.allCats.find((c) => c.id === cat.chaseTargetId);
  if (!target) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 120);
    cat.chaseTargetId = null;
    return [];
  }

  const dx = target.x - cat.x;
  const dy = target.y - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < CAT_SEPARATION_DISTANCE * 1.5) {
    if (canPlayFight(cat.energy) && Math.random() < PLAY_FIGHT_CHANCE) {
      return enterPlayFightingState(cat, target);
    }
    if (Math.random() < GROOMING_CHANCE) {
      enterGroomingState(cat);
      return [];
    }
    if (Math.random() < getChaseReverseChance(cat.personality)) {
      return reverseChase(cat, target);
    }
  }

  moveToward(cat, target.x, target.y, getEffectiveSpeed(cat) * 1.05, ctx, dt);
  return [];
}

function updateFleeingState(cat: Cat, ctx: StateContext, dt: number): void {
  if (!cat.chaseTargetId) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 120);
    return;
  }

  // 力竭：跑不动了，停下喘息
  if (isExhausted(cat.energy)) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 120);
    cat.actionTimer = 0;
    cat.chaseTargetId = null;
    return;
  }

  const chaser = ctx.allCats.find((c) => c.id === cat.chaseTargetId);
  if (!chaser) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 120);
    cat.chaseTargetId = null;
    return;
  }

  const dx = cat.x - chaser.x;
  const dy = cat.y - chaser.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 120 && cat.actionTimer > 30) {
    cat.action = 'idle';
    cat.idleTimer = 120 + Math.floor(Math.random() * 180);
    cat.chaseTargetId = null;
    return;
  }

  if (distance > 0) {
    const fleeX = cat.x + (dx / distance) * getEffectiveSpeed(cat) * 1.2 * dt;
    const fleeY = cat.y + (dy / distance) * getEffectiveSpeed(cat) * 1.2 * dt;
    cat.targetX = clampToHouseX(fleeX, cat, ctx.house);
    cat.targetY = clampToHouseY(fleeY, cat, ctx.house);
  } else {
    // 零距离：随机方向逃跑
    const angle = Math.random() * Math.PI * 2;
    const speed = getEffectiveSpeed(cat) * 1.2 * dt;
    cat.targetX = clampToHouseX(cat.x + Math.cos(angle) * speed, cat, ctx.house);
    cat.targetY = clampToHouseY(cat.y + Math.sin(angle) * speed, cat, ctx.house);
  }
  moveToward(cat, cat.targetX, cat.targetY, getEffectiveSpeed(cat) * 1.2, ctx, dt);
}

function updateGroomingState(cat: Cat, ctx: StateContext): void {
  if (cat.actionTimer > 60 + Math.random() * 60) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.actionTimer = 0;
  }
}

function updateEatingState(cat: Cat, ctx: StateContext): void {
  if (cat.actionTimer > 60 + Math.random() * 60) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.actionTimer = 0;
  }
}

function updateWatchingState(cat: Cat, ctx: StateContext): void {
  // 持续将注视点对准对方（供后续朝向/渲染扩展使用）
  const other = ctx.allCats.find((c) => c.id !== cat.id);
  if (other) {
    cat.targetX = other.x;
    cat.targetY = other.y;
  }
  if (cat.actionTimer > 60 + Math.random() * 60) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.actionTimer = 0;
  }
}

function updatePlayFightingState(cat: Cat, ctx: StateContext): CatIntent[] {
  // 力竭：打不动了，提前结束
  if (isExhausted(cat.energy)) {
    cat.action = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 120);
    cat.actionTimer = 0;
    cat.chaseTargetId = null;
    return [{ type: 'want_stop_play_fighting', catId: cat.id }];
  }
  if (cat.actionTimer > 90 + Math.random() * 90) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.actionTimer = 0;
    cat.chaseTargetId = null;
    return [{ type: 'want_stop_play_fighting', catId: cat.id }];
  }
  return [];
}

function startChasing(cat: Cat, ctx: StateContext): CatIntent[] {
  // 体力门控：体力不足时不发起追逐（防御性检查，正常路径已被权重因子拦截）
  if (!canChase(cat.energy)) {
    enterMovingState(cat, ctx);
    return [];
  }

  const otherCats = ctx.allCats.filter((c) => c.id !== cat.id);
  if (otherCats.length === 0) {return [];}

  // 过滤掉不可追逐的状态
  const chaseable = otherCats.filter(c =>
    c.action !== 'sleeping' && c.action !== 'hiding' && c.action !== 'playFighting'
  );
  if (chaseable.length === 0) {return [];}

  const target = chaseable[Math.floor(Math.random() * chaseable.length)];

  // 只修改自身
  applyMoodEvent(cat.mood, 'chase_start', cat.personality, Date.now());

  cat.chaseTargetId = target.id;
  cat.actionSwitchTimer = getActionSwitchInterval(cat);
  cat.action = 'chasing';
  cat.actionTimer = 0;

  return [{ type: 'want_chase', initiatorId: cat.id, targetId: target.id }];
}

function switchExcitedAction(cat: Cat, ctx: StateContext): CatIntent[] {
  const moodThreshold = getMoodThreshold(cat.mood.value);
  if (moodThreshold !== 'excited' && moodThreshold !== 'euphoric') {return [];}

  cat.actionSwitchTimer = getActionSwitchInterval(cat);

  if (!cat.chaseTargetId) {
    cat.action = 'idle';
    return [];
  }

  const target = ctx.allCats.find((c) => c.id === cat.chaseTargetId);
  if (!target) {
    cat.action = 'idle';
    cat.chaseTargetId = null;
    return [];
  }

  const dx = target.x - cat.x;
  const dy = target.y - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const roll = Math.random();

  if (distance < CAT_SEPARATION_DISTANCE * 2) {
    if (canPlayFight(cat.energy) && roll < PLAY_FIGHT_CHANCE) {
      return enterPlayFightingState(cat, target);
    } else if (roll < PLAY_FIGHT_CHANCE + GROOMING_CHANCE) {
      enterGroomingState(cat);
    } else if (roll < PLAY_FIGHT_CHANCE + GROOMING_CHANCE + getChaseReverseChance(cat.personality)) {
      return reverseChase(cat, target);
    } else {
      cat.action = 'chasing';
    }
  } else {
    cat.action = 'chasing';
  }
  return [];
}

function reverseChase(cat: Cat, target: Cat): CatIntent[] {
  cat.action = 'fleeing';
  cat.chaseTargetId = target.id;
  cat.actionTimer = 0;

  return [{ type: 'want_reverse_chase', initiatorId: cat.id, targetId: target.id }];
}

function enterPlayFightingState(cat: Cat, target: Cat): CatIntent[] {
  cat.action = 'playFighting';
  cat.actionTimer = 0;
  cat.targetX = (cat.x + target.x) / 2;
  cat.targetY = (cat.y + target.y) / 2;

  return [{ type: 'want_play_fight', initiatorId: cat.id, targetId: target.id }];
}

function enterGroomingState(cat: Cat): void {
  cat.action = 'grooming';
  cat.actionTimer = 0;
  cat.targetX = cat.x;
  cat.targetY = cat.y;
}

function enterWatchingState(cat: Cat, ctx: StateContext): void {
  const other = ctx.allCats.find((c) => c.id !== cat.id);
  cat.action = 'watching';
  cat.actionTimer = 0;
  cat.targetX = other ? other.x : cat.x;
  cat.targetY = other ? other.y : cat.y;
}

function enterMovingState(cat: Cat, ctx?: StateContext): void {
  // POI 目的地偏好：有上下文时 70% 走向兴趣点，30% 纯随机探索
  if (ctx) {
    const pois = derivePOIs(ctx.furnitures, ctx.catBeds, ctx.shelters);
    if (pois.length > 0 && Math.random() < POI_CHANCE) {
      const poi = selectPOI(cat, pois);
      const point = poi ? pickApproachPoint(poi, cat, ctx) : null;
      if (poi && point) {
        cat.targetX = point.x;
        cat.targetY = point.y;
        cat.nextAction = getArrivalAction(cat, poi.type);
        cat.action = 'moving';
        cat.actionTimer = 0;
        return;
      }
    }
  }

  // 纯随机选点（保留探索感，也是 POI 选点失败时的回退）
  const margin = cat.visualWidth;
  const house = ctx?.house;
  const houseX = house?.x ?? 0;
  const houseY = house?.y ?? 0;
  const houseW = house?.width ?? MAP_WIDTH;
  const houseH = house?.height ?? MAP_HEIGHT;
  let attempts = 0;
  let tx: number, ty: number;
  do {
    tx = houseX + margin + Math.random() * (houseW - margin * 2);
    ty = houseY + margin + Math.random() * (houseH - margin * 2);
    attempts++;
  } while (ctx && isInsideObject(tx, ty, ctx) && attempts < 5);

  cat.targetX = tx;
  cat.targetY = ty;
  cat.nextAction = undefined;
  cat.action = 'moving';
  cat.actionTimer = 0;
}

// 为 POI 挑选可到达的停靠点：在房屋内且不在任何实体内部，最多重试 3 次
function pickApproachPoint(poi: POI, cat: Cat, ctx: StateContext): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = getPOIApproachPoint(poi, cat.collisionRadius + 6);
    if (
      p.x < ctx.house.x || p.x > ctx.house.x + ctx.house.width ||
      p.y < ctx.house.y || p.y > ctx.house.y + ctx.house.height
    ) {
      continue;
    }
    if (!isPointInSolids(p.x, p.y, ctx.solidObjects)) {
      return p;
    }
  }
  return null;
}

function isPointInSolids(x: number, y: number, solidObjects: readonly SolidObject[]): boolean {
  for (const obj of solidObjects) {
    if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
      return true;
    }
  }
  return false;
}

function isInsideObject(x: number, y: number, ctx: StateContext): boolean {
  for (const s of ctx.shelters) {
    if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {return true;}
  }
  for (const b of ctx.catBeds) {
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {return true;}
  }
  for (const f of ctx.furnitures) {
    if (x >= f.x && x <= f.x + f.width && y >= f.y && y <= f.y + f.height) {return true;}
  }
  return false;
}

function enterSleepingState(cat: Cat, ctx: StateContext): void {
  // 走向休息点（猫窝/沙发/软垫按权重竞争），到达后再睡，不再瞬移
  const restPOIs = derivePOIs(ctx.furnitures, ctx.catBeds, ctx.shelters).filter((p) => p.type === 'rest');
  const poi = selectPOI(cat, restPOIs);
  const point = poi ? pickApproachPoint(poi, cat, ctx) : null;
  if (point) {
    cat.targetX = point.x;
    cat.targetY = point.y;
    cat.nextAction = 'sleeping';
    cat.action = 'moving';
    cat.actionTimer = 0;
    return;
  }
  // 无可用休息点：原地睡
  cat.targetX = cat.x;
  cat.targetY = cat.y;
  cat.nextAction = undefined;
  cat.action = 'sleeping';
  cat.actionTimer = 0;
}

function enterHidingState(cat: Cat, ctx: StateContext): void {
  // 走向最近的躲藏点，到达后再躲，不再瞬移
  const hidePOIs = derivePOIs(ctx.furnitures, ctx.catBeds, ctx.shelters).filter((p) => p.type === 'hide');
  let nearest: POI | null = null;
  let minDist = Infinity;
  for (const p of hidePOIs) {
    const dx = (p.x + p.width / 2) - cat.x;
    const dy = (p.y + p.height / 2) - cat.y;
    const d = dx * dx + dy * dy;
    if (d < minDist) {
      minDist = d;
      nearest = p;
    }
  }
  const point = nearest ? pickApproachPoint(nearest, cat, ctx) : null;
  if (point) {
    cat.targetX = point.x;
    cat.targetY = point.y;
    cat.nextAction = 'hiding';
    cat.action = 'moving';
    cat.actionTimer = 0;
    return;
  }
  // 无可用躲藏点：原地躲
  cat.targetX = cat.x;
  cat.targetY = cat.y;
  cat.nextAction = undefined;
  cat.action = 'hiding';
  cat.actionTimer = 0;
}

function moveToward(cat: Cat, targetX: number, targetY: number, speed: number, ctx?: StateContext, dt: number = 1): void {
  const dx = targetX - cat.x;
  const dy = targetY - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= ARRIVAL_THRESHOLD) {
    cat.x = targetX;
    cat.y = targetY;
    return;
  }

  const dirX = dx / distance;
  const dirY = dy / distance;

  let newX = cat.x + dirX * speed * dt;
  let newY = cat.y + dirY * speed * dt;

  newX = clampToHouseX(newX, cat, ctx?.house);
  newY = clampToHouseY(newY, cat, ctx?.house);

  cat.x = newX;
  cat.y = newY;
}

function clampToHouseX(x: number, cat: Cat, house?: House): number {
  const halfWidth = cat.visualWidth / 2;
  const clearance = Math.max(cat.collisionRadius, halfWidth);
  const houseX = house?.x ?? 0;
  const houseW = house?.width ?? MAP_WIDTH;
  const minX = houseX + clearance - halfWidth;
  const maxX = houseX + houseW - clearance - halfWidth;
  return Math.max(minX, Math.min(x, maxX));
}

function clampToHouseY(y: number, cat: Cat, house?: House): number {
  const halfHeight = cat.visualHeight / 2;
  const clearance = Math.max(cat.collisionRadius, halfHeight);
  const houseY = house?.y ?? 0;
  const houseH = house?.height ?? MAP_HEIGHT;
  const minY = houseY + clearance - halfHeight;
  const maxY = houseY + houseH - clearance - halfHeight;
  return Math.max(minY, Math.min(y, maxY));
}

function resolveCatCollision(
  cat: Cat,
  newX: number,
  newY: number,
  allCats: readonly Cat[],
  house?: House
): { x: number; y: number } {
  let resultX = newX;
  let resultY = newY;

  for (const other of allCats) {
    if (other.id === cat.id) {continue;}

    const dx = resultX - other.x;
    const dy = resultY - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = CAT_SEPARATION_DISTANCE;

    if (distance < minDist) {
      let pushX: number;
      let pushY: number;
      if (distance > 0) {
        const overlap = minDist - distance;
        pushX = (dx / distance) * overlap * 0.5;
        pushY = (dy / distance) * overlap * 0.5;
      } else {
        const angle = Math.random() * Math.PI * 2;
        pushX = Math.cos(angle) * minDist * 0.5;
        pushY = Math.sin(angle) * minDist * 0.5;
      }

      resultX += pushX;
      resultY += pushY;

      resultX = clampToHouseX(resultX, cat, house);
      resultY = clampToHouseY(resultY, cat, house);
    }
  }

  return { x: resultX, y: resultY };
}

function resolveSolidCollisions(
  cat: Cat,
  x: number,
  y: number,
  solidObjects: readonly SolidObject[]
): { x: number; y: number } {
  let rx = x;
  let ry = y;
  const cx = rx + cat.visualWidth / 2;
  const cy = ry + cat.visualHeight / 2;
  const r = cat.collisionRadius;

  for (const obj of solidObjects) {
    const nearestX = Math.max(obj.x, Math.min(cx, obj.x + obj.width));
    const nearestY = Math.max(obj.y, Math.min(cy, obj.y + obj.height));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < r * r) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = r - dist;
      rx += (dx / dist) * overlap;
      ry += (dy / dist) * overlap;
    }
  }

  return { x: rx, y: ry };
}
