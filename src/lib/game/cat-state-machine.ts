import type { Cat, CatActionState, CatMood, Shelter, CatBed } from './types';
import { WALL_THICKNESS, HOUSE_SIZE } from './types';

const ARRIVAL_THRESHOLD = 3;
const CAT_SEPARATION_DISTANCE = 30;

const MOOD_LOW_DURATION = 300;
const MOOD_EXCITED_DURATION = 400;
const ACTION_SWITCH_MIN = 20;
const ACTION_SWITCH_MAX = 60;
const CHASE_TRIGGER_CHANCE = 0.1;
const CHASE_REVERSE_CHANCE = 0.3;
const GROOMING_CHANCE = 0.15;
const PLAY_FIGHT_CHANCE = 0.2;

const MOOD_SPEED_MULTIPLIER: Record<CatMood, number> = {
  low: 0.6,
  calm: 1.0,
  excited: 1.4,
};

const MOOD_ACTION_SWITCH_MULTIPLIER: Record<CatMood, number> = {
  low: 2.0,
  calm: 1.0,
  excited: 0.5,
};

export interface StateContext {
  shelters: Shelter[];
  catBeds: CatBed[];
  allCats: Cat[];
}

export function updateCatState(cat: Cat, ctx: StateContext): void {
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

  updateBlink(cat);
}

function updateMood(cat: Cat): void {
  if (cat.moodTimer > 0) {
    cat.moodTimer--;
    if (cat.moodTimer <= 0) {
      cat.mood = 'calm';
    }
  }
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
  return cat.speed * MOOD_SPEED_MULTIPLIER[cat.mood];
}

function getActionSwitchInterval(cat: Cat): number {
  const base = ACTION_SWITCH_MIN + Math.floor(Math.random() * (ACTION_SWITCH_MAX - ACTION_SWITCH_MIN));
  return Math.floor(base * MOOD_ACTION_SWITCH_MULTIPLIER[cat.mood]);
}

function updateIdleState(cat: Cat, ctx: StateContext): void {
  cat.idleTimer--;

  if (cat.idleTimer <= 0) {
    const roll = Math.random();
    const chaseChance = cat.mood === 'excited' ? CHASE_TRIGGER_CHANCE * 3 : CHASE_TRIGGER_CHANCE;

    if (roll < chaseChance && ctx.allCats.length > 1) {
      startChasing(cat, ctx);
    } else if (roll < 0.30 && ctx.catBeds.length > 0) {
      enterSleepingState(cat);
    } else if (roll < 0.45 && ctx.shelters.length > 0) {
      enterHidingState(cat);
    } else {
      enterMovingState(cat);
    }
  }
}

function updateMovingState(cat: Cat, ctx: StateContext): void {
  const dx = cat.targetX - cat.x;
  const dy = cat.targetY - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= ARRIVAL_THRESHOLD) {
    cat.x = cat.targetX;
    cat.y = cat.targetY;
    cat.action = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 180);
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
    if (Math.random() < CHASE_REVERSE_CHANCE) {
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
    cat.targetX = clampToHouseX(fleeX, cat.collisionRadius);
    cat.targetY = clampToHouseY(fleeY, cat.collisionRadius);
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
  if (otherCats.length === 0) return;

  const target = otherCats[Math.floor(Math.random() * otherCats.length)];

  cat.mood = 'excited';
  cat.moodTimer = MOOD_EXCITED_DURATION;
  cat.chaseTargetId = target.id;
  cat.actionSwitchTimer = getActionSwitchInterval(cat);
  cat.action = 'chasing';
  cat.actionTimer = 0;

  target.mood = 'excited';
  target.moodTimer = MOOD_EXCITED_DURATION;
  target.chaseTargetId = cat.id;
  target.action = 'fleeing';
  target.actionTimer = 0;
  target.actionSwitchTimer = getActionSwitchInterval(target);
}

function switchExcitedAction(cat: Cat, ctx: StateContext): void {
  if (cat.mood !== 'excited') return;

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
    } else if (roll < PLAY_FIGHT_CHANCE + GROOMING_CHANCE + CHASE_REVERSE_CHANCE) {
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

  newX = clampToHouseX(newX, cat.collisionRadius);
  newY = clampToHouseY(newY, cat.collisionRadius);

  cat.x = newX;
  cat.y = newY;
}

function clampToHouseX(x: number, radius: number): number {
  const minX = WALL_THICKNESS + radius;
  const maxX = WALL_THICKNESS + HOUSE_SIZE - radius;
  return Math.max(minX, Math.min(x, maxX));
}

function clampToHouseY(y: number, radius: number): number {
  const minY = WALL_THICKNESS + radius;
  const maxY = WALL_THICKNESS + HOUSE_SIZE - radius;
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
    if (other.id === cat.id) continue;

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

      resultX = clampToHouseX(resultX, cat.collisionRadius);
      resultY = clampToHouseY(resultY, cat.collisionRadius);
    }
  }

  return { x: resultX, y: resultY };
}
