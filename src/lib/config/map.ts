import { TILE_SIZE, MAP_COLS, MAP_ROWS, FloorType } from '../game/types';
import type { House, Shelter, CatBed, Furniture, Room, Toy } from '../game/types';
import { TileMap } from '../game/tile-map';
import { TileType } from '../game/types';

// 房间 ID 常量
export const ROOM_IDS = {
  BEDROOM1: 'bedroom1',
  BEDROOM2: 'bedroom2',
  LIVING: 'living',
  KITCHEN: 'kitchen',
} as const;

// 房间定义
export const ROOMS: Room[] = [
  { id: ROOM_IDS.BEDROOM1, name: '卧室1', floorType: FloorType.CARPET },
  { id: ROOM_IDS.BEDROOM2, name: '卧室2', floorType: FloorType.CARPET },
  { id: ROOM_IDS.LIVING, name: '客厅', floorType: FloorType.WOOD },
  { id: ROOM_IDS.KITCHEN, name: '厨房', floorType: FloorType.TILE },
];

/**
 * 数据驱动的十字形布局
 *
 * 网格: 40×40 格 (10m × 10m)
 *
 *   卧室1 (cols 10-29, rows 1-8):  5m × 2m = 10 m²   CARPET
 *   客厅  (cols 1-38, rows 10-29): 9.5m × 5m = 47.5 m² WOOD
 *   卧室2 (cols 1-18, rows 31-38): 4.5m × 2m = 9 m²   CARPET
 *   厨房  (cols 20-38, rows 31-38): 4.75m × 2m = 9.5 m² TILE
 *   总面积 ≈ 76 m²
 */
export function createDefaultLayout(): TileMap {
  const map = new TileMap(MAP_COLS, MAP_ROWS);

  // 房间声明：[id, col1, row1, col2, row2, floorType]
  const rooms: [string, number, number, number, number, FloorType][] = [
    [ROOM_IDS.BEDROOM1, 10, 1, 29, 8, FloorType.CARPET],
    [ROOM_IDS.LIVING,    1, 10, 38, 29, FloorType.WOOD],
    [ROOM_IDS.BEDROOM2,  1, 31, 18, 38, FloorType.CARPET],
    [ROOM_IDS.KITCHEN,  20, 31, 38, 38, FloorType.TILE],
  ];

  // 门洞声明：[row, colStart, colEnd, roomId, floorType]
  const doors: [number, number, number, string, FloorType][] = [
    [9,  18, 21, ROOM_IDS.BEDROOM1, FloorType.CARPET], // 卧室1 → 客厅
    [30,  8, 11, ROOM_IDS.BEDROOM2, FloorType.CARPET], // 客厅 → 卧室2
    [30, 28, 31, ROOM_IDS.KITCHEN,  FloorType.TILE],   // 客厅 → 厨房
  ];

  // 1. 填充房间地板
  for (const [id, c1, r1, c2, r2, floor] of rooms) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        map.setTileType(c, r, TileType.FLOOR);
        map.setFloorType(c, r, floor);
        map.setRoomId(c, r, id);
      }
    }
  }

  // 2. 在房间边缘生成墙体（厚度1格）
  for (const [, c1, r1, c2, r2] of rooms) {
    for (let r = r1 - 1; r <= r2 + 1; r++) {
      for (let c = c1 - 1; c <= c2 + 1; c++) {
        if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) {continue;}
        if (map.getTile(c, r)?.type === TileType.EMPTY) {
          map.setTileType(c, r, TileType.WALL);
        }
      }
    }
  }

  // 3. 在门洞位置清除墙体，设为地板
  for (const [row, colStart, colEnd, roomId, floor] of doors) {
    for (let c = colStart; c <= colEnd; c++) {
      map.setTileType(c, row, TileType.FLOOR);
      map.setFloorType(c, row, floor);
      map.setRoomId(c, row, roomId);
    }
  }

  // 4. 剩余 EMPTY 格填充为 WALL（室外）
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (map.getTile(c, r)?.type === TileType.EMPTY) {
        map.setTileType(c, r, TileType.WALL);
      }
    }
  }

  return map;
}

// 派生数据：从 TileMap 计算房屋边界（用于摄像机居中）
export function computeHouseBounds(tileMap: TileMap): House {
  return tileMap.getFloorBounds();
}

// 默认家具布局
export function createDefaultFurnitures(): Furniture[] {
  const T = TILE_SIZE;
  return [
    // 卧室1 (cols 10-29, rows 1-8)
    { id: 'cushion', name: '软垫', x: 18 * T, y: 3 * T, width: 3 * T, height: 2 * T, wallPlaced: false },
    // 客厅 (cols 1-38, rows 10-29)
    { id: 'sofa', name: '沙发', x: 28 * T, y: 14 * T, width: 6 * T, height: 3 * T, wallPlaced: true },
    { id: 'coffeeTable', name: '茶几', x: 22 * T, y: 18 * T, width: 3 * T, height: 2 * T, wallPlaced: false },
    { id: 'catTree', name: '猫爬架', x: 4 * T, y: 12 * T, width: 3 * T, height: 4 * T, wallPlaced: false },
    // 厨房 (cols 20-38, rows 31-38)
    { id: 'foodBowl', name: '食盆', x: 25 * T, y: 34 * T, width: 2 * T, height: 2 * T, wallPlaced: false },
  ];
}

// 默认庇护所
export function createDefaultShelters(): Shelter[] {
  const T = TILE_SIZE;
  return [
    { id: 'box', name: '纸箱', x: 4 * T, y: 22 * T, width: 3 * T, height: 3 * T },
  ];
}

// 默认猫窝
export function createDefaultCatBeds(): CatBed[] {
  const T = TILE_SIZE;
  return [
    { id: 'bed1', name: '猫窝', x: 20 * T, y: 3 * T, width: 3 * T, height: 2 * T },
  ];
}

// 默认玩具（无碰撞的小物件）
export function createDefaultToys(): Toy[] {
  const T = TILE_SIZE;
  return [
    { id: 'yarnBall', name: '毛线球', x: 10 * T, y: 20 * T, width: T, height: T },
    { id: 'toyMouse', name: '玩具老鼠', x: 26 * T, y: 22 * T, width: T, height: T },
  ];
}
