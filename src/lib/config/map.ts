import { HOUSE_WIDTH, HOUSE_HEIGHT, WALL_THICKNESS, FloorType } from '../game/types';
import type { House, Wall, Shelter, CatBed, Furniture } from '../game/types';

export interface MapConfigData {
  house: House;
  walls: Wall[];
  shelters: Shelter[];
  catBeds: CatBed[];
  furnitures: Furniture[];
  defaultFloor: FloorType;
}

const canvasWidth = HOUSE_WIDTH + WALL_THICKNESS * 2;
const canvasHeight = HOUSE_HEIGHT + WALL_THICKNESS * 2;

const NEW_ROOM_WIDTH = 320;
const LIVING_ROOM_WIDTH = HOUSE_WIDTH - NEW_ROOM_WIDTH;
const DIVIDER_X = WALL_THICKNESS + NEW_ROOM_WIDTH;
const DOOR_GAP = 72;
const DIVIDER_TOP_HEIGHT = HOUSE_HEIGHT - DOOR_GAP;

export const MAP_CONFIG: MapConfigData = {
  house: {
    x: WALL_THICKNESS,
    y: WALL_THICKNESS,
    width: HOUSE_WIDTH,
    height: HOUSE_HEIGHT,
  },
  walls: [
    // 上边界
    { x: 0, y: 0, width: canvasWidth, height: WALL_THICKNESS },
    // 下边界
    { x: 0, y: canvasHeight - WALL_THICKNESS, width: canvasWidth, height: WALL_THICKNESS },
    // 左边界
    { x: 0, y: 0, width: WALL_THICKNESS, height: canvasHeight },
    // 右边界
    { x: canvasWidth - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: canvasHeight },
    // 隔断墙上段（门洞上方）
    { x: DIVIDER_X, y: WALL_THICKNESS, width: WALL_THICKNESS, height: DIVIDER_TOP_HEIGHT },
    // 隔断墙下段（门洞下方）
    { x: DIVIDER_X, y: WALL_THICKNESS + DIVIDER_TOP_HEIGHT + DOOR_GAP, width: WALL_THICKNESS, height: WALL_THICKNESS },
  ],
  shelters: [
    {
      id: 'box',
      name: '纸箱',
      x: DIVIDER_X + WALL_THICKNESS + 40,
      y: WALL_THICKNESS + 40,
      width: 64,
      height: 64,
    },
    {
      id: 'tunnel',
      name: '隧道',
      x: WALL_THICKNESS + HOUSE_WIDTH - 120,
      y: WALL_THICKNESS + HOUSE_HEIGHT - 100,
      width: 80,
      height: 48,
    },
  ],
  catBeds: [
    {
      id: 'bed1',
      name: '猫窝',
      x: DIVIDER_X + WALL_THICKNESS + LIVING_ROOM_WIDTH / 2 - 24,
      y: WALL_THICKNESS + HOUSE_HEIGHT - 80,
      width: 48,
      height: 48,
    },
  ],
  furnitures: [
    // 新房间家具
    {
      id: 'bookshelf',
      name: '书架',
      x: WALL_THICKNESS,
      y: WALL_THICKNESS + 60,
      width: 160,
      height: 40,
      wallPlaced: true,
    },
    {
      id: 'desk',
      name: '书桌',
      x: WALL_THICKNESS + 100,
      y: WALL_THICKNESS,
      width: 80,
      height: 40,
      wallPlaced: true,
    },
    {
      id: 'chair',
      name: '椅子',
      x: WALL_THICKNESS + 128,
      y: WALL_THICKNESS + 44,
      width: 32,
      height: 32,
      wallPlaced: false,
    },
    // 客厅家具
    {
      id: 'sofa',
      name: '沙发',
      x: WALL_THICKNESS + HOUSE_WIDTH - 148,
      y: WALL_THICKNESS + 200,
      width: 120,
      height: 48,
      wallPlaced: true,
    },
    {
      id: 'catbox',
      name: '猫箱',
      x: DIVIDER_X + WALL_THICKNESS + 40,
      y: WALL_THICKNESS + HOUSE_HEIGHT - 120,
      width: 48,
      height: 48,
      wallPlaced: false,
    },
    {
      id: 'coffeeTable',
      name: '茶几',
      x: DIVIDER_X + WALL_THICKNESS + 200,
      y: WALL_THICKNESS + 350,
      width: 80,
      height: 48,
      wallPlaced: false,
    },
  ],
  defaultFloor: FloorType.WOOD,
};
