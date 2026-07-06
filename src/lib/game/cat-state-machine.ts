import type { Cat, CatActionState, CatBed, Shelter } from './types';
import { HOUSE_SIZE, WALL_THICKNESS } from './types';
import { calculateBehaviorWeight, getChaseReverseChance, getIdleDurationModifier } from './personality';
import {
  applyMoodEvent,
  getMoodBehaviorModifier,
  getMoodThreshold,
  updateMood as updateMoodState
} from './mood-system';
import { getTimeModifier, weightedRandomBehavior } from './behavior-system';
import { type EventLogState, logBehaviorEvent } from './event-log';

const ARRIVAL_THRESHOLD = 3;
const CAT_SEPARATION_DISTANCE = 30;

const MOOD_LOW_DURATION = 300;
const MOOD_EXCITED_DURATION = 400;
const ACTION_SWITCH_MIN = 20;
const ACTION_SWITCH_MAX = 60;
const CHASE_TRIGGER_CHANCE = 0.1;
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
  allCats: Cat[];
  eventLog?: EventLogState;
  gameTime?: { hour: number; minute: number; day: number };
}

export function updateCatState(cat: Cat, ctx: StateContext): void {
  const previousAction = cat.action;
  cat.actionTimer++;

  updateMood(cat);

  if (cat.actionSwitchTimer > 0) {
    cat.actionSwitchTimer--;
    if (cat.actionSwitchTimer <= 0) {
      switchExcitedAction(cat, ctx);
    }
  }

  switch (cat.action) {
    case 'idle':
      updateIdleState(cat, ctx);
      break;
    case 'moving':
      updateMovingState(cat, ctx);
      break;
    case 'sleeping':
      updateSleepingState(cat, ctx);
      break;
    case 'hiding':
      updateHidingState(cat, ctx);
      break;
    case 'chasing':
      updateChasingState(cat, ctx);
      break;
    case 'fleeing':
      updateFleeingState(cat, ctx);
      break;
    case 'grooming':
      updateGroomingState(cat, ctx);
      break;
    case 'playFighting':
      updatePlayFightingState(cat, ctx);
      break;
  }

  // 记录行为变化事件
  if (cat.action !== previousAction && ctx.eventLog) {
    logBehaviorEvent(ctx.eventLog, cat.id, cat.name, cat.action, ctx.gameTime);
  }

  updateBlink(cat);
}

function updateMood(cat: Cat): void {
  // 使用新的情绪系统
  updateMoodState(cat.mood, cat.personality);
}

function updateBlink(cat: Cat): void {
  cat.blinkTimer--;
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

function getEffectiveSpeed(cat: Cat): number {
  const moodThreshold = getMoodThreshold(cat.mood.value);
  return cat.speed * MOOD_SPEED_MULTIPLIER[moodThreshold];
}

function getActionSwitchInterval(cat: Cat): number {
  const base = ACTION_SWITCH_MIN + Math.floor(Math.random() * (ACTION_SWITCH_MAX - ACTION_SWITCH_MIN));
  const moodThreshold = getMoodThreshold(cat.mood.value);
  return Math.floor(base * MOOD_ACTION_SWITCH_MULTIPLIER[moodThreshold]);
}

function updateIdleState(cat: Cat, ctx: StateContext): void {
  cat.idleTimer--;

  if (cat.idleTimer <= 0) {
    // 使用加权随机选择下一个行为
    const weights: Record<string, number> = {
      idle: 20,
      moving: 30 * calculateBehaviorWeight(cat.personality, 'moving'),
      sleeping: 10 * calculateBehaviorWeight(cat.personality, 'sleeping'),
      hiding: 5 * calculateBehaviorWeight(cat.personality, 'hiding'),
      chasing: 10 * calculateBehaviorWeight(cat.personality, 'chasing'),
      eating: 5 * calculateBehaviorWeight(cat.personality, 'eating'),
      drinking: 3,
      exploring: 8 * calculateBehaviorWeight(cat.personality, 'exploring'),
      socializing: 5 * calculateBehaviorWeight(cat.personality, 'socializing'),
      watching: 4 * calculateBehaviorWeight(cat.personality, 'watching'),
      climbing: 4 * calculateBehaviorWeight(cat.personality, 'climbing'),
      grooming: 5 * calculateBehaviorWeight(cat.personality, 'grooming'),
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
          startChasing(cat, ctx);
        } else {
          enterMovingState(cat);
        }
        break;
      case 'sleeping':
        if (ctx.catBeds.length > 0) {
          enterSleepingState(cat);
        } else {
          enterMovingState(cat);
        }
        break;
      case 'hiding':
        if (ctx.shelters.length > 0) {
          enterHidingState(cat);
        } else {
          enterMovingState(cat);
        }
        break;
      case 'eating':
      case 'drinking':
        // 暂时简化为移动到随机位置
        enterMovingState(cat);
        break;
      case 'exploring':
        enterMovingState(cat);
        break;
      case 'socializing':
        if (ctx.allCats.length > 1) {
          startChasing(cat, ctx);
        } else {
          enterMovingState(cat);
        }
        break;
      case 'watching':
      case 'climbing':
      case 'grooming':
        enterGroomingState(cat);
        break;
      case 'moving':
      default:
        enterMovingState(cat);
        break;
    }
  }
}

/**
 * 加权随机选择
 */
function weightedRandom(weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([_, w]) => w > 0);
  const total = entries.reduce((sum, [_, w]) => sum + w, 0);

  let random = Math.random() * total;
  for (const [action, weight] of entries) {
    random -= weight;
    if (random <= 0) {return action;}
  }

  return 'idle';
}

function updateMovingState(cat: Cat, ctx: StateContext): void {
  const dx = cat.targetX - cat.x;
  const dy = cat.targetY - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= ARRIVAL_THRESHOLD) {
    cat.x = cat.targetX;
    cat.y = cat.targetY;
    cat.action = 'idle';
    const baseIdle = 60 + Math.floor(Math.random() * 180);
    cat.idleTimer = Math.floor(baseIdle * getIdleDurationModifier(cat.personality));
    cat.actionTimer = 0;
    return;
  }

  moveToward(cat, cat.targetX, cat.targetY, getEffectiveSpeed(cat));
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

function updateChasingState(cat: Cat, ctx: StateContext): void {
  if (!cat.chaseTargetId) {
    cat.action = 'idle';
    cat.idleTimer = 30;
    return;
  }

  const target = ctx.allCats.find((c) => c.id === cat.chaseTargetId);
  if (!target) {
    cat.action = 'idle';
    cat.idleTimer = 30;
    return;
  }

  const dx = target.x - cat.x;
  const dy = target.y - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < CAT_SEPARATION_DISTANCE * 1.5) {
    if (Math.random() < PLAY_FIGHT_CHANCE) {
      enterPlayFightingState(cat, target);
      return;
    }
    if (Math.random() < GROOMING_CHANCE) {
      enterGroomingState(cat);
      return;
    }
    if (Math.random() < getChaseReverseChance(cat.personality)) {
      reverseChase(cat, target);
      return;
    }
  }

  moveToward(cat, target.x, target.y, getEffectiveSpeed(cat) * 1.3);
}

function updateFleeingState(cat: Cat, ctx: StateContext): void {
  if (!cat.chaseTargetId) {
    cat.action = 'idle';
    cat.idleTimer = 30;
    return;
  }

  const chaser = ctx.allCats.find((c) => c.id === cat.chaseTargetId);
  if (!chaser) {
    cat.action = 'idle';
    cat.idleTimer = 30;
    return;
  }

  const dx = cat.x - chaser.x;
  const dy = cat.y - chaser.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 200) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.chaseTargetId = null;
    return;
  }

  if (distance > 0) {
    const fleeX = cat.x + (dx / distance) * getEffectiveSpeed(cat) * 1.2;
    const fleeY = cat.y + (dy / distance) * getEffectiveSpeed(cat) * 1.2;
    cat.targetX = clampToHouseX(fleeX, cat);
    cat.targetY = clampToHouseY(fleeY, cat);
    moveToward(cat, cat.targetX, cat.targetY, getEffectiveSpeed(cat) * 1.2);
  }
}

function updateGroomingState(cat: Cat, ctx: StateContext): void {
  if (cat.actionTimer > 60 + Math.random() * 60) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.actionTimer = 0;
  }
}

function updatePlayFightingState(cat: Cat, ctx: StateContext): void {
  if (cat.actionTimer > 90 + Math.random() * 90) {
    cat.action = 'idle';
    cat.idleTimer = 30 + Math.floor(Math.random() * 60);
    cat.actionTimer = 0;
    cat.chaseTargetId = null;

    for (const other of ctx.allCats) {
      if (other.chaseTargetId === cat.id) {
        other.action = 'idle';
        other.idleTimer = 30 + Math.floor(Math.random() * 60);
        other.actionTimer = 0;
        other.chaseTargetId = null;
      }
    }
  }
}

function startChasing(cat: Cat, ctx: StateContext): void {
  const otherCats = ctx.allCats.filter((c) => c.id !== cat.id);
  if (otherCats.length === 0) {return;}

  const target = otherCats[Math.floor(Math.random() * otherCats.length)];

  // 应用情绪事件
  applyMoodEvent(cat.mood, 'chase_start', cat.personality, Date.now());
  applyMoodEvent(target.mood, 'flee', target.personality, Date.now());

  cat.chaseTargetId = target.id;
  cat.actionSwitchTimer = getActionSwitchInterval(cat);
  cat.action = 'chasing';
  cat.actionTimer = 0;

  target.chaseTargetId = cat.id;
  target.action = 'fleeing';
  target.actionTimer = 0;
  target.actionSwitchTimer = getActionSwitchInterval(target);
}

function switchExcitedAction(cat: Cat, ctx: StateContext): void {
  const moodThreshold = getMoodThreshold(cat.mood.value);
  if (moodThreshold !== 'excited' && moodThreshold !== 'euphoric') {return;}

  cat.actionSwitchTimer = getActionSwitchInterval(cat);

  if (!cat.chaseTargetId) {
    cat.action = 'idle';
    return;
  }

  const target = ctx.allCats.find((c) => c.id === cat.chaseTargetId);
  if (!target) {
    cat.action = 'idle';
    cat.chaseTargetId = null;
    return;
  }

  const dx = target.x - cat.x;
  const dy = target.y - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const roll = Math.random();

  if (distance < CAT_SEPARATION_DISTANCE * 2) {
    if (roll < PLAY_FIGHT_CHANCE) {
      enterPlayFightingState(cat, target);
    } else if (roll < PLAY_FIGHT_CHANCE + GROOMING_CHANCE) {
      enterGroomingState(cat);
    } else if (roll < PLAY_FIGHT_CHANCE + GROOMING_CHANCE + getChaseReverseChance(cat.personality)) {
      reverseChase(cat, target);
    }
  }
}

function reverseChase(cat: Cat, target: Cat): void {
  cat.action = 'fleeing';
  cat.chaseTargetId = target.id;
  cat.actionTimer = 0;

  target.action = 'chasing';
  target.chaseTargetId = cat.id;
  target.actionTimer = 0;
}

function enterPlayFightingState(cat: Cat, target: Cat): void {
  cat.action = 'playFighting';
  cat.actionTimer = 0;
  cat.targetX = (cat.x + target.x) / 2;
  cat.targetY = (cat.y + target.y) / 2;

  target.action = 'playFighting';
  target.actionTimer = 0;
  target.targetX = cat.targetX;
  target.targetY = cat.targetY;
}

function enterGroomingState(cat: Cat): void {
  cat.action = 'grooming';
  cat.actionTimer = 0;
  cat.targetX = cat.x;
  cat.targetY = cat.y;
}

function enterMovingState(cat: Cat): void {
  const margin = cat.visualWidth;
  cat.targetX = WALL_THICKNESS + margin + Math.random() * (HOUSE_SIZE - margin * 2);
  cat.targetY = WALL_THICKNESS + margin + Math.random() * (HOUSE_SIZE - margin * 2);
  cat.action = 'moving';
  cat.actionTimer = 0;
}

function enterSleepingState(cat: Cat): void {
  cat.targetX = cat.x;
  cat.targetY = cat.y;
  cat.action = 'sleeping';
  cat.actionTimer = 0;
}

function enterHidingState(cat: Cat): void {
  cat.targetX = cat.x;
  cat.targetY = cat.y;
  cat.action = 'hiding';
  cat.actionTimer = 0;
}

function moveToward(cat: Cat, targetX: number, targetY: number, speed: number): void {
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

  let newX = cat.x + dirX * speed;
  let newY = cat.y + dirY * speed;

  newX = clampToHouseX(newX, cat);
  newY = clampToHouseY(newY, cat);

  cat.x = newX;
  cat.y = newY;
}

function clampToHouseX(x: number, cat: Cat): number {
  const halfWidth = cat.visualWidth / 2;
  const minX = WALL_THICKNESS + cat.collisionRadius - halfWidth;
  const maxX = WALL_THICKNESS + HOUSE_SIZE - cat.collisionRadius - halfWidth;
  return Math.max(minX, Math.min(x, maxX));
}

function clampToHouseY(y: number, cat: Cat): number {
  const halfHeight = cat.visualHeight / 2;
  const minY = WALL_THICKNESS + cat.collisionRadius - halfHeight;
  const maxY = WALL_THICKNESS + HOUSE_SIZE - cat.collisionRadius - halfHeight;
  return Math.max(minY, Math.min(y, maxY));
}

function resolveCatCollision(
  cat: Cat,
  newX: number,
  newY: number,
  allCats: Cat[]
): { x: number; y: number } {
  let resultX = newX;
  let resultY = newY;

  for (const other of allCats) {
    if (other.id === cat.id) {continue;}

    const dx = resultX - other.x;
    const dy = resultY - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = CAT_SEPARATION_DISTANCE;

    if (distance < minDist && distance > 0) {
      const overlap = minDist - distance;
      const pushX = (dx / distance) * overlap * 0.5;
      const pushY = (dy / distance) * overlap * 0.5;

      resultX += pushX;
      resultY += pushY;

      resultX = clampToHouseX(resultX, cat);
      resultY = clampToHouseY(resultY, cat);
    }
  }

  return { x: resultX, y: resultY };
}
