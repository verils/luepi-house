import type { Cat } from './types';
import { WALL_THICKNESS, HOUSE_SIZE } from './types';

export function updateCatAI(cat: Cat): void {
  if (cat.state === 'moving') return;

  if (cat.state === 'idle') {
    cat.idleTimer--;
    if (cat.idleTimer <= 0) {
      pickNewTarget(cat);
    }
  }
}

function pickNewTarget(cat: Cat): void {
  const margin = cat.visualWidth;
  cat.targetX = WALL_THICKNESS + margin + Math.random() * (HOUSE_SIZE - margin * 2);
  cat.targetY = WALL_THICKNESS + margin + Math.random() * (HOUSE_SIZE - margin * 2);
  cat.state = 'moving';
}
