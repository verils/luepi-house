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
 * 网格: 22x20, L形不规则外形
 *
 * 上层 (rows 0-10):
 *   卧室1: cols 1-9, rows 1-5       CARPET
 *   卧室2: cols 11-20, rows 1-5     CARPET
 *   走廊:  cols 1-9, rows 7-10      WOOD
 *   客厅:  cols 11-20, rows 7-10    WOOD
 *
 * 下层 (rows 12-18):
 *   厨房:  cols 1-9, rows 12-18     TILE
 *   小厅:  cols 11-20, rows 12-17   WOOD
 *
 * L形轮廓: 上层22宽(rows 0-18 右侧到col 21)，下层仅到col 10(row 19)
 *
 * 门洞:
 *   卧室1→走廊: col 4-5, row 6
 *   卧室2→客厅: col 14-15, row 6
 *   走廊→客厅: col 10, rows 8-9
 *   走廊→厨房: col 4-5, row 11
 *   客厅→小厅: col 14-15, row 11
 *   厨房→小厅: col 10, rows 14-15
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

  // 上边界: row 0, cols 0-21
  fillRect(0, 0, 21, 0, TileType.WALL);

  // 左边界: col 0, rows 0-19
  fillRect(0, 0, 0, 19, TileType.WALL);

  // 右边界: col 21, rows 0-18
  fillRect(21, 0, 21, 18, TileType.WALL);

  // 厨房底边: row 19, cols 0-10
  fillRect(0, 19, 10, 19, TileType.WALL);

  // 小厅底边: row 18, cols 10-21
  fillRect(10, 18, 21, 18, TileType.WALL);

  // === 2. 内部墙体（全部厚度1） ===

  // 卧室分隔墙: col 10, rows 0-6
  fillRect(10, 0, 10, 6, TileType.WALL);

  // 卧室下方水平墙: row 6, cols 1-20
  fillRect(1, 6, 20, 6, TileType.WALL);

  // 走廊/客厅分隔墙: col 10, rows 7-10
  fillRect(10, 7, 10, 10, TileType.WALL);

  // 走廊/客厅下方水平墙: row 11, cols 1-20
  fillRect(1, 11, 20, 11, TileType.WALL);

  // 厨房/小厅分隔墙: col 10, rows 12-18
  fillRect(10, 12, 10, 18, TileType.WALL);

  // === 3. 门洞 ===

  // 卧室1 → 走廊: col 4-5, row 6
  fillRect(4, 6, 5, 6, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 卧室2 → 客厅: col 14-15, row 6
  fillRect(14, 6, 15, 6, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 走廊 ↔ 客厅: col 10, rows 8-9
  fillRect(10, 8, 10, 9, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 走廊 → 厨房: col 4-5, row 11
  fillRect(4, 11, 5, 11, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // 客厅 → 小厅: col 14-15, row 11
  fillRect(14, 11, 15, 11, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  // 厨房 ↔ 小厅: col 10, rows 14-15
  fillRect(10, 14, 10, 15, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  // === 4. 房间地板 ===

  // 卧室1: cols 1-9, rows 1-5
  fillRect(1, 1, 9, 5, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM1);

  // 卧室2: cols 11-20, rows 1-5
  fillRect(11, 1, 20, 5, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM2);

  // 走廊: cols 1-9, rows 7-10
  fillRect(1, 7, 9, 10, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 客厅: cols 11-20, rows 7-10
  fillRect(11, 7, 20, 10, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 厨房: cols 1-9, rows 12-18
  fillRect(1, 12, 9, 18, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // 小厅: cols 11-20, rows 12-17
  fillRect(11, 12, 20, 17, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  return map;
}

// 派生数据：从 TileMap 计算房屋边界（用于摄像机居中）
export function computeHouseBounds(tileMap: TileMap): House {
  return tileMap.getFloorBounds();
}

// 默认家具布局（基于新地图坐标）
export function createDefaultFurnitures(): Furniture[] {
  const T = TILE_SIZE;
  return [
    // 卧室1 家具
    { id: 'bookshelf', name: '书架', x: 2 * T, y: 1 * T, width: 4 * T, height: T, wallPlaced: true },
    { id: 'desk', name: '书桌', x: 6 * T, y: 1 * T, width: 3 * T, height: T, wallPlaced: true },
    { id: 'chair', name: '椅子', x: 5 * T, y: 3 * T, width: T, height: T, wallPlaced: false },
    // 客厅家具
    { id: 'sofa', name: '沙发', x: 15 * T, y: 8 * T, width: 4 * T, height: 2 * T, wallPlaced: true },
    { id: 'coffeeTable', name: '茶几', x: 12 * T, y: 8 * T, width: 2 * T, height: T, wallPlaced: false },
    { id: 'catbox', name: '猫箱', x: 12 * T, y: 14 * T, width: 2 * T, height: 2 * T, wallPlaced: false },
  ];
}

// 默认庇护所
export function createDefaultShelters(): Shelter[] {
  const T = TILE_SIZE;
  return [
    { id: 'box', name: '纸箱', x: 2 * T, y: 3 * T, width: 2 * T, height: 2 * T },
    { id: 'tunnel', name: '隧道', x: 16 * T, y: 14 * T, width: 3 * T, height: 2 * T },
  ];
}

// 默认猫窝
export function createDefaultCatBeds(): CatBed[] {
  const T = TILE_SIZE;
  return [
    { id: 'bed1', name: '猫窝', x: 14 * T, y: 14 * T, width: 2 * T, height: 2 * T },
  ];
}
