import {
  TILE_SIZE,
  WALL_THICKNESS,
  HOUSE_SIZE,
  CAT_VISUAL_SIZE,
  TileType,
  FloorType,
  WallType,
  type GameState,
  type Tile,
  type Wall,
  type House,
  type Cat,
  type MapConfig,
  type Shelter,
  type CatBed,
} from './types';

/**
 * 初始化地图配置
 */
function initMapConfig(): MapConfig {
  const canvasSize = HOUSE_SIZE + WALL_THICKNESS * 2;

  const house: House = {
    x: WALL_THICKNESS,
    y: WALL_THICKNESS,
    width: HOUSE_SIZE,
    height: HOUSE_SIZE,
  };

  // 边界墙体
  const walls: Wall[] = [
    // 上墙
    { x: 0, y: 0, width: canvasSize, height: WALL_THICKNESS, wallType: WallType.BRICK },
    // 下墙
    { x: 0, y: canvasSize - WALL_THICKNESS, width: canvasSize, height: WALL_THICKNESS, wallType: WallType.BRICK },
    // 左墙
    { x: 0, y: 0, width: WALL_THICKNESS, height: canvasSize, wallType: WallType.BRICK },
    // 右墙
    { x: canvasSize - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: canvasSize, wallType: WallType.BRICK },
  ];

  // 庇护所（纸箱、隧道等）
  const shelters: Shelter[] = [
    {
      id: 'box',
      name: '纸箱',
      x: house.x + 40,
      y: house.y + 40,
      width: 64,
      height: 64,
    },
    {
      id: 'tunnel',
      name: '隧道',
      x: house.x + HOUSE_SIZE - 120,
      y: house.y + HOUSE_SIZE - 100,
      width: 80,
      height: 48,
    },
  ];

  // 猫窝
  const catBeds: CatBed[] = [
    {
      id: 'bed1',
      name: '猫窝',
      x: house.x + HOUSE_SIZE / 2 - 24,
      y: house.y + HOUSE_SIZE - 80,
      width: 48,
      height: 48,
    },
  ];

  return {
    width: canvasSize,
    height: canvasSize,
    house,
    walls,
    shelters,
    catBeds,
    defaultFloor: FloorType.WOOD,
  };
}

/**
 * 初始化瓷砖网格
 */
function initTiles(map: MapConfig): Tile[] {
  const tiles: Tile[] = [];
  const tilesCount = HOUSE_SIZE / TILE_SIZE; // 20x20

  for (let row = 0; row < tilesCount; row++) {
    for (let col = 0; col < tilesCount; col++) {
      tiles.push({
        x: map.house.x + col * TILE_SIZE,
        y: map.house.y + row * TILE_SIZE,
        type: TileType.FLOOR,
        floorType: map.defaultFloor,
      });
    }
  }

  return tiles;
}

/**
 * 初始化猫咪
 */
function initCats(house: House): Cat[] {
  return [
    {
      id: 'luelue',
      name: '略略',
      x: house.x + HOUSE_SIZE / 3,
      y: house.y + HOUSE_SIZE / 2,
      visualWidth: CAT_VISUAL_SIZE,
      visualHeight: CAT_VISUAL_SIZE,
      collisionRadius: 16,
      interactionRadius: 20,
      color: '#E8945A',
      rotation: 0,
      speed: 1.5,
      targetX: house.x + HOUSE_SIZE / 3,
      targetY: house.y + HOUSE_SIZE / 2,
      state: 'idle',
      idleTimer: 30,
    },
    {
      id: 'pipi',
      name: '皮皮',
      x: house.x + (HOUSE_SIZE * 2) / 3,
      y: house.y + HOUSE_SIZE / 2,
      visualWidth: CAT_VISUAL_SIZE,
      visualHeight: CAT_VISUAL_SIZE,
      collisionRadius: 14,
      interactionRadius: 18,
      color: '#F5E6D3',
      rotation: 0,
      speed: 1.2,
      targetX: house.x + (HOUSE_SIZE * 2) / 3,
      targetY: house.y + HOUSE_SIZE / 2,
      state: 'idle',
      idleTimer: 60,
    },
  ];
}

/**
 * 初始化游戏状态
 */
export function initGameState(): GameState {
  const map = initMapConfig();
  const tiles = initTiles(map);
  const cats = initCats(map.house);

  return {
    map,
    house: map.house,
    walls: map.walls,
    cats,
    tiles,
    shelters: map.shelters,
    catBeds: map.catBeds,
  };
}
