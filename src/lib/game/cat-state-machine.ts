import type { Cat, CatState, Shelter, CatBed } from './types';
import { WALL_THICKNESS, HOUSE_SIZE } from './types';

const ARRIVAL_THRESHOLD = 3;
const CAT_SEPARATION_DISTANCE = 30;

export interface StateContext {
  shelters: Shelter[];
  catBeds: CatBed[];
  allCats: Cat[];
}

export function updateCatState(cat: Cat, ctx: StateContext): void {
  cat.stateTimer++;

  switch (cat.state) {
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
  }

  updateBlink(cat);
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

function updateIdleState(cat: Cat, ctx: StateContext): void {
  cat.idleTimer--;

  if (cat.idleTimer <= 0) {
    const roll = Math.random();

    if (roll < 0.25 && ctx.catBeds.length > 0) {
      enterSleepingState(cat, ctx);
    } else if (roll < 0.40 && ctx.shelters.length > 0) {
      enterHidingState(cat, ctx);
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
    cat.state = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 180);
    cat.stateTimer = 0;
    return;
  }

  const dirX = dx / distance;
  const dirY = dy / distance;

  let newX = cat.x + dirX * cat.speed;
  let newY = cat.y + dirY * cat.speed;

  newX = clampToHouseX(newX, cat.collisionRadius);
  newY = clampToHouseY(newY, cat.collisionRadius);

  const separation = resolveCatCollision(cat, newX, newY, ctx.allCats);
  newX = separation.x;
  newY = separation.y;

  cat.x = newX;
  cat.y = newY;
}

function updateSleepingState(cat: Cat, ctx: StateContext): void {
  if (cat.stateTimer < 60) {
    moveTowardTarget(cat, cat.targetX, cat.targetY);
  }

  if (cat.stateTimer > 300 + Math.random() * 300) {
    cat.state = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 120);
    cat.stateTimer = 0;
  }
}

function updateHidingState(cat: Cat, ctx: StateContext): void {
  if (cat.stateTimer < 90) {
    moveTowardTarget(cat, cat.targetX, cat.targetY);
  }

  if (cat.stateTimer > 240 + Math.random() * 360) {
    cat.state = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 120);
    cat.stateTimer = 0;
  }
}

function enterMovingState(cat: Cat): void {
  const margin = cat.visualWidth;
  cat.targetX = WALL_THICKNESS + margin + Math.random() * (HOUSE_SIZE - margin * 2);
  cat.targetY = WALL_THICKNESS + margin + Math.random() * (HOUSE_SIZE - margin * 2);
  cat.state = 'moving';
  cat.stateTimer = 0;
}

function enterSleepingState(cat: Cat, ctx: StateContext): void {
  const bed = ctx.catBeds[Math.floor(Math.random() * ctx.catBeds.length)];
  cat.targetX = bed.x + bed.width / 2 - cat.visualWidth / 2;
  cat.targetY = bed.y + bed.height / 2 - cat.visualHeight / 2;
  cat.state = 'sleeping';
  cat.stateTimer = 0;
}

function enterHidingState(cat: Cat, ctx: StateContext): void {
  let nearestShelter = ctx.shelters[0];
  let minDist = Infinity;

  for (const shelter of ctx.shelters) {
    const dx = (shelter.x + shelter.width / 2) - cat.x;
    const dy = (shelter.y + shelter.height / 2) - cat.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearestShelter = shelter;
    }
  }

  cat.targetX = nearestShelter.x + nearestShelter.width / 2 - cat.visualWidth / 2;
  cat.targetY = nearestShelter.y + nearestShelter.height / 2 - cat.visualHeight / 2;
  cat.state = 'hiding';
  cat.stateTimer = 0;
}

function moveTowardTarget(cat: Cat, targetX: number, targetY: number): void {
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

  cat.x += dirX * cat.speed;
  cat.y += dirY * cat.speed;

  cat.x = clampToHouseX(cat.x, cat.collisionRadius);
  cat.y = clampToHouseY(cat.y, cat.collisionRadius);
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
