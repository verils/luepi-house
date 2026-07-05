import { CAT_VISUAL_SIZE } from '../game/types';
import type { Cat, CatPersonality } from '../game/types';
import { createPersonality } from '../game/personality';
import { createMoodState } from '../game/mood-system';

export interface CatConfig {
  id: string;
  name: string;
  color: string;
  visualWidth: number;
  visualHeight: number;
  collisionRadius: number;
  interactionRadius: number;
  speed: number;
  personality: CatPersonality;
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
    personality: {
      curiosity: 80,
      energy: 85,
      sociability: 70,
      bravery: 60,
      independence: 30,
      appetite: 75,
      cleanliness: 50,
      playfulness: 90,
      alertness: 65,
      patience: 40,
    },
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
    personality: {
      curiosity: 60,
      energy: 50,
      sociability: 80,
      bravery: 40,
      independence: 20,
      appetite: 55,
      cleanliness: 85,
      playfulness: 45,
      alertness: 70,
      patience: 75,
    },
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
    action: 'idle',
    idleTimer: 30 + Math.floor(Math.random() * 60),
    actionTimer: 0,
    blinkTimer: 120 + Math.floor(Math.random() * 120),
    isBlinking: false,
    mood: createMoodState(),
    moodTimer: 0,
    chaseTargetId: null,
    actionSwitchTimer: 0,
    personality: createPersonality(config.personality),
  };
}
