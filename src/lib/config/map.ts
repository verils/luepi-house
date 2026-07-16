import { TILE_SIZE, MAP_COLS, MAP_ROWS, FloorType } from '../game/types';
import type { House, Shelter, CatBed, Furniture, Room } from '../game/types';
import { TileMap } from '../game/tile-map';
import { TileType } from '../game/types';

// 房间 ID 常量
export const ROOM_IDS = {
  BEDROOM: 'bedroom',
  LIVING: 'living',
  KITCHEN: 'kitchen',
} as const;

// 房间定义
export const ROOMS: Room[] = [
  { id: ROOM_IDS.BEDROOM, name: '卧室', floorType: FloorType.CARPET },
  { id: ROOM_IDS.LIVING, name: '客厅', floorType: FloorType.WOOD },
  { id: ROOM_IDS.KITCHEN, name: '厨房', floorType: FloorType.TILE },
];

/**
 * 创建默认的3房间菱形布局
 *
 * 网格: 44×44 格 (11m × 11m)
 *
 * 外形: 菱形/十字形 — 中间宽、上下窄
 *
 *   卧室 (cols 16-27, rows 1-8):   3m × 2m = 6 m²   CARPET
 *   客厅 (cols 1-42, rows 10-33): 10.5m × 6m = 63 m² WOOD
 *   厨房 (cols 16-27, rows 35-42): 3m × 2m = 6 m²   TILE
 *   总面积 ≈ 75 m²
 *
 * 门洞 (4格宽 = 1m):
 *   卧室→客厅: cols 20-23, row 9
 *   客厅→厨房: cols 20-23, row 34
 */
export function createDefaultLayout(): TileMap {
  const map = new TileMap(MAP_COLS, MAP_ROWS);

  function fillRect(
    c1: number, r1: number, c2: number, r2: number,
    type: TileType, floorType?: FloorType, roomId?: string
  ) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        map.setTileType(c, r, type);
        if (floorType !== undefined) map.setFloorType(c, r, floorType);
        if (roomId !== undefined) map.setRoomId(c, r, roomId);
      }
    }
  }

  // === 1. 墙体 ===

  // 卧室顶部
  fillRect(16, 0, 27, 0, TileType.WALL);
  // 卧室左侧
  fillRect(15, 0, 15, 9, TileType.WALL);
  // 卧室右侧
  fillRect(28, 0, 28, 9, TileType.WALL);
  // 客厅顶部 (= 卧室底部)
  fillRect(0, 9, 43, 9, TileType.WALL);
  // 客厅左侧
  fillRect(0, 9, 0, 34, TileType.WALL);
  // 客厅右侧
  fillRect(43, 9, 43, 34, TileType.WALL);
  // 客厅底部 (= 厨房顶部)
  fillRect(0, 34, 43, 34, TileType.WALL);
  // 厨房左侧
  fillRect(15, 34, 15, 43, TileType.WALL);
  // 厨房右侧
  fillRect(28, 34, 28, 43, TileType.WALL);
  // 厨房底部
  fillRect(16, 43, 27, 43, TileType.WALL);

  // === 2. 门洞 (4格宽) ===

  // 卧室 → 客厅
  fillRect(20, 9, 23, 9, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM);
  // 客厅 → 厨房
  fillRect(20, 34, 23, 34, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // === 3. 房间地板 ===

  // 卧室: 3m × 2m
  fillRect(16, 1, 27, 8, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM);

  // 客厅: 10.5m × 6m
  fillRect(1, 10, 42, 33, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 厨房: 3m × 2m
  fillRect(16, 35, 27, 42, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // === 4. 室外填充 ===
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
    // 卧室 (cols 16-27, rows 1-8)
    { id: 'cushion', name: '软垫', x: 18 * T, y: 3 * T, width: 3 * T, height: 2 * T, wallPlaced: false },
    // 客厅 (cols 1-42, rows 10-33)
    { id: 'sofa', name: '沙发', x: 30 * T, y: 15 * T, width: 6 * T, height: 3 * T, wallPlaced: true },
    { id: 'coffeeTable', name: '茶几', x: 25 * T, y: 20 * T, width: 3 * T, height: 2 * T, wallPlaced: false },
    { id: 'catTree', name: '猫爬架', x: 5 * T, y: 12 * T, width: 3 * T, height: 4 * T, wallPlaced: false },
    // 厨房 (cols 16-27, rows 35-42)
    { id: 'foodBowl', name: '食盆', x: 18 * T, y: 38 * T, width: 2 * T, height: 2 * T, wallPlaced: false },
  ];
}

// 默认庇护所
export function createDefaultShelters(): Shelter[] {
  const T = TILE_SIZE;
  return [
    { id: 'box', name: '纸箱', x: 5 * T, y: 25 * T, width: 3 * T, height: 3 * T },
  ];
}

// 默认猫窝
export function createDefaultCatBeds(): CatBed[] {
  const T = TILE_SIZE;
  return [
    { id: 'bed1', name: '猫窝', x: 22 * T, y: 3 * T, width: 3 * T, height: 2 * T },
  ];
}
