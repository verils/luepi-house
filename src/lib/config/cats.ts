import { CAT_VISUAL_SIZE } from '../game/types';
import type { Cat } from '../game/types';

export interface CatConfig {
  id: string;
  name: string;
  color: string;
  visualWidth: number;
  visualHeight: number;
  collisionRadius: number;
  interactionRadius: number;
  speed: number;
}

export const CAT_CONFIGS: CatConfig[] = [
  {
    id: 'luelue',
    name: '略略',
    color: '#E8945A',
    visualWidth: CAT_VISUAL_SIZE,
    visualHeight: CAT_VISUAL_SIZE,
    collisionRadius: 16,
    interactionRadius: 20,
    speed: 1.5,
  },
  {
    id: 'pipi',
    name: '皮皮',
    color: '#F5E6D3',
    visualWidth: CAT_VISUAL_SIZE,
    visualHeight: CAT_VISUAL_SIZE,
    collisionRadius: 14,
    interactionRadius: 18,
    speed: 1.2,
  },
];

export function createCatFromConfig(config: CatConfig, x: number, y: number): Cat {
  return {
    id: config.id,
    name: config.name,
    x,
    y,
    visualWidth: config.visualWidth,
    visualHeight: config.visualHeight,
    collisionRadius: config.collisionRadius,
    interactionRadius: config.interactionRadius,
    color: config.color,
    rotation: 0,
    speed: config.speed,
    targetX: x,
    targetY: y,
    state: 'idle',
    idleTimer: 30 + Math.floor(Math.random() * 60),
    stateTimer: 0,
    blinkTimer: 120 + Math.floor(Math.random() * 120),
    isBlinking: false,
  };
}
