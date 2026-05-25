import type { Cat } from './types';
import { WALL_THICKNESS, HOUSE_SIZE } from './types';

const ARRIVAL_THRESHOLD = 2;

export function updateCatMovement(cat: Cat): void {
  if (cat.state !== 'moving') return;

  const dx = cat.targetX - cat.x;
  const dy = cat.targetY - cat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= ARRIVAL_THRESHOLD) {
    cat.x = cat.targetX;
    cat.y = cat.targetY;
    cat.state = 'idle';
    cat.idleTimer = 60 + Math.floor(Math.random() * 180);
    return;
  }

  const dirX = dx / distance;
  const dirY = dy / distance;

  cat.x += dirX * cat.speed;
  cat.y += dirY * cat.speed;

  cat.x = Math.max(WALL_THICKNESS, Math.min(cat.x, WALL_THICKNESS + HOUSE_SIZE - cat.visualWidth));
  cat.y = Math.max(WALL_THICKNESS, Math.min(cat.y, WALL_THICKNESS + HOUSE_SIZE - cat.visualHeight));
}
