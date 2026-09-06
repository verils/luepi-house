import { CAT_VISUAL_SIZE } from '../game';
import type { Cat, CatPersonality } from '../game';
import { createPersonality } from '../game';
import { createMoodState } from '../game';
import { createEnergy } from '../game';
import { createSatiety } from '../game/cat-satiety';

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
      curiosity: 85,
      energy: 90,
      sociability: 70,
      bravery: 45,
      independence: 30,
      appetite: 75,
      cleanliness: 50,
      playfulness: 95,
      alertness: 95,
      patience: 25,
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
      curiosity: 30,
      energy: 15,
      sociability: 55,
      bravery: 70,
      independence: 40,
      appetite: 65,
      cleanliness: 30,
      playfulness: 20,
      alertness: 10,
      patience: 95,
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
    reactionCooldown: 0,
    lastPerceivedDistance: null,
    energy: createEnergy(),
    satiety: createSatiety(),
    visitedPoints: [],
    personality: createPersonality(config.personality),
  };
}
