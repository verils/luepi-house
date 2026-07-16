import { TILE_SIZE, MAP_COLS, MAP_ROWS, FloorType } from '../game/types';
import type { House, Shelter, CatBed, Furniture, Room } from '../game/types';
import { TileMap } from '../game/tile-map';
import { TileType } from '../game/types';

// 房间 ID 常量
export const ROOM_IDS = {
  BEDROOM1: 'bedroom1',
  BEDROOM2: 'bedroom2',
  CORRIDOR: 'corridor',
  LIVING: 'living',
  KITCHEN: 'kitchen',
  HALL: 'hall',
} as const;

// 房间定义
export const ROOMS: Room[] = [
  { id: ROOM_IDS.BEDROOM1, name: '卧室1', floorType: FloorType.CARPET },
  { id: ROOM_IDS.BEDROOM2, name: '卧室2', floorType: FloorType.CARPET },
  { id: ROOM_IDS.CORRIDOR, name: '走廊', floorType: FloorType.WOOD },
  { id: ROOM_IDS.LIVING, name: '客厅', floorType: FloorType.WOOD },
  { id: ROOM_IDS.KITCHEN, name: '厨房', floorType: FloorType.TILE },
  { id: ROOM_IDS.HALL, name: '小厅', floorType: FloorType.WOOD },
];

/**
 * 创建默认的 2房2厅+厨房 布局
 *
 * 网格: 42×34 格 (10.5m × 8.5m)，L形不规则外形
 * 房屋面积 ≈ 81 m²
 *
 * 上层 (rows 0-27, 全宽42格):
 *   卧室1: cols 1-18, rows 1-9      CARPET  (4.5m×2.25m ≈ 10 m²)
 *   卧室2: cols 20-40, rows 1-9     CARPET  (5.25m×2.25m ≈ 12 m²)
 *   走廊:  cols 1-18, rows 11-15    WOOD    (4.5m×1.25m ≈ 6 m²)
 *   客厅:  cols 20-40, rows 11-15   WOOD    (5.25m×1.25m ≈ 7 m²)
 *   小厅:  cols 20-40, rows 17-27   WOOD    (5.25m×2.75m ≈ 14 m²)
 *
 * 下层 (rows 17-33, 左半19格):
 *   厨房:  cols 1-18, rows 17-32    TILE    (4.5m×4m ≈ 18 m²)
 *
 * L形轮廓: 上层全宽(rows 0-28 右侧到col 41)，下层仅到col 18(row 33)
 *
 * 门洞 (3格宽 = 0.75m):
 *   卧室1→走廊: cols 7-9, row 10
 *   卧室2→客厅: cols 27-29, row 10
 *   走廊↔客厅: col 19, rows 12-14
 *   走廊→厨房: cols 7-9, row 16
 *   客厅→小厅: cols 27-29, row 16
 *   厨房↔小厅: col 19, rows 22-24
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

  // === 1. 外边界墙（L形） ===

  // 上边界
  fillRect(0, 0, 41, 0, TileType.WALL);

  // 左边界
  fillRect(0, 0, 0, 33, TileType.WALL);

  // 右边界（上层到row 28）
  fillRect(41, 0, 41, 28, TileType.WALL);

  // 小厅底边（L形转折）
  fillRect(19, 28, 41, 28, TileType.WALL);

  // 厨房底边
  fillRect(0, 33, 18, 33, TileType.WALL);

  // === 2. 内部墙体（全部厚度1格） ===

  // 卧室分隔墙
  fillRect(19, 0, 19, 10, TileType.WALL);

  // 卧室下方水平墙
  fillRect(1, 10, 40, 10, TileType.WALL);

  // 走廊/客厅分隔墙
  fillRect(19, 11, 19, 16, TileType.WALL);

  // 走廊/客厅下方水平墙
  fillRect(1, 16, 40, 16, TileType.WALL);

  // 厨房/小厅分隔墙（延伸到L形底部）
  fillRect(19, 17, 19, 28, TileType.WALL);

  // === 3. 门洞（3格宽） ===

  // 卧室1 → 走廊
  fillRect(7, 10, 9, 10, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 卧室2 → 客厅
  fillRect(27, 10, 29, 10, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 走廊 ↔ 客厅
  fillRect(19, 12, 19, 14, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 走廊 → 厨房
  fillRect(7, 16, 9, 16, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // 客厅 → 小厅
  fillRect(27, 16, 29, 16, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  // 厨房 ↔ 小厅
  fillRect(19, 22, 19, 24, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  // === 4. 房间地板 ===

  // 卧室1: 4.5m × 2.25m
  fillRect(1, 1, 18, 9, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM1);

  // 卧室2: 5.25m × 2.25m
  fillRect(20, 1, 40, 9, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM2);

  // 走廊: 4.5m × 1.25m
  fillRect(1, 11, 18, 15, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 客厅: 5.25m × 1.25m
  fillRect(20, 11, 40, 15, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 厨房: 4.5m × 4m
  fillRect(1, 17, 18, 32, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // 小厅: 5.25m × 2.75m
  fillRect(20, 17, 40, 27, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  // === 5. 室外填充 ===
  // 将所有剩余 EMPTY 格填充为 WALL（室外 = 实心）
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
    // 卧室1 家具 (cols 1-18, rows 1-9)
    { id: 'bookshelf', name: '书架', x: 2 * T, y: 1 * T, width: 4 * T, height: T, wallPlaced: true },
    { id: 'desk', name: '书桌', x: 8 * T, y: 1 * T, width: 3 * T, height: T, wallPlaced: true },
    { id: 'chair', name: '椅子', x: 6 * T, y: 5 * T, width: T, height: T, wallPlaced: false },
    // 客厅家具 (cols 20-40, rows 11-15)
    { id: 'sofa', name: '沙发', x: 30 * T, y: 12 * T, width: 4 * T, height: 2 * T, wallPlaced: true },
    { id: 'coffeeTable', name: '茶几', x: 25 * T, y: 12 * T, width: 2 * T, height: T, wallPlaced: false },
    // 厨房家具 (cols 1-18, rows 17-32)
    { id: 'catbox', name: '猫箱', x: 5 * T, y: 25 * T, width: 2 * T, height: 2 * T, wallPlaced: false },
  ];
}

// 默认庇护所
export function createDefaultShelters(): Shelter[] {
  const T = TILE_SIZE;
  return [
    { id: 'box', name: '纸箱', x: 3 * T, y: 3 * T, width: 2 * T, height: 2 * T },
    { id: 'tunnel', name: '隧道', x: 30 * T, y: 22 * T, width: 3 * T, height: 2 * T },
  ];
}

// 默认猫窝
export function createDefaultCatBeds(): CatBed[] {
  const T = TILE_SIZE;
  return [
    { id: 'bed1', name: '猫窝', x: 25 * T, y: 22 * T, width: 2 * T, height: 2 * T },
  ];
}
