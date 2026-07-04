import { HOUSE_SIZE, WALL_THICKNESS, FloorType, WallType } from '../game/types';
import type { House, Wall, Shelter, CatBed } from '../game/types';

export interface MapConfigData {
  house: House;
  walls: Wall[];
  shelters: Shelter[];
  catBeds: CatBed[];
  defaultFloor: FloorType;
}

const canvasSize = HOUSE_SIZE + WALL_THICKNESS * 2;

export const MAP_CONFIG: MapConfigData = {
  house: {
    x: WALL_THICKNESS,
    y: WALL_THICKNESS,
    width: HOUSE_SIZE,
    height: HOUSE_SIZE,
  },
  walls: [
    { x: 0, y: 0, width: canvasSize, height: WALL_THICKNESS, wallType: WallType.BRICK },
    { x: 0, y: canvasSize - WALL_THICKNESS, width: canvasSize, height: WALL_THICKNESS, wallType: WallType.BRICK },
    { x: 0, y: 0, width: WALL_THICKNESS, height: canvasSize, wallType: WallType.BRICK },
    { x: canvasSize - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: canvasSize, wallType: WallType.BRICK },
  ],
  shelters: [
    {
      id: 'box',
      name: '纸箱',
      x: WALL_THICKNESS + 40,
      y: WALL_THICKNESS + 40,
      width: 64,
      height: 64,
    },
    {
      id: 'tunnel',
      name: '隧道',
      x: WALL_THICKNESS + HOUSE_SIZE - 120,
      y: WALL_THICKNESS + HOUSE_SIZE - 100,
      width: 80,
      height: 48,
    },
  ],
  catBeds: [
    {
      id: 'bed1',
      name: '猫窝',
      x: WALL_THICKNESS + HOUSE_SIZE / 2 - 24,
      y: WALL_THICKNESS + HOUSE_SIZE - 80,
      width: 48,
      height: 48,
    },
  ],
  defaultFloor: FloorType.WOOD,
};
