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
 * 网格: 40x30, 不规则外形
 *
 * 上层 (rows 0-13):
 *   卧室1: cols 2-9, rows 1-5      CARPET
 *   卧室2: cols 12-19, rows 1-5    CARPET
 *   走廊:  cols 2-19, rows 7-12    WOOD
 *   客厅:  cols 22-37, rows 1-22   WOOD (右侧通高)
 *
 * 下层 (rows 15-28):
 *   厨房:  cols 2-9, rows 15-22    TILE
 *   小厅:  cols 12-19, rows 15-22  WOOD
 *
 * 门洞:
 *   卧室1→走廊: col 5-6, row 6
 *   卧室2→走廊: col 15-16, row 6
 *   走廊→客厅: col 20, rows 9-10
 *   走廊→小厅: col 10-11, row 13 (下方开放)
 *   走廊→厨房: (通过小厅)
 *   厨房→客厅: col 20, rows 19-20
 *   小厅→客厅: col 20, rows 19-20
 */
export function createDefaultLayout(): TileMap {
  const map = new TileMap(MAP_COLS, MAP_ROWS);

  // Helper: 填充矩形区域
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

  // === 1. 外边界墙 ===
  // 上
  fillRect(0, 0, MAP_COLS - 1, 0, TileType.WALL);
  // 下
  fillRect(0, MAP_ROWS - 1, MAP_COLS - 1, MAP_ROWS - 1, TileType.WALL);
  // 左
  fillRect(0, 0, 0, MAP_ROWS - 1, TileType.WALL);
  // 右
  fillRect(MAP_COLS - 1, 0, MAP_COLS - 1, MAP_ROWS - 1, TileType.WALL);

  // === 2. 内部墙体 ===

  // --- 上层 ---

  // 卧室1 外墙: col 1 (左), col 10 (右), row 0 already wall
  fillRect(1, 0, 1, 5, TileType.WALL);   // 左墙
  fillRect(10, 0, 10, 6, TileType.WALL);  // 右墙 (延伸到 row 6)

  // 卧室2 外墙: col 11 (左), col 20 (右)
  fillRect(11, 0, 11, 6, TileType.WALL);  // 左墙
  fillRect(20, 0, 20, 6, TileType.WALL);  // 右墙

  // 水平墙: row 6, cols 1-20 (卧室下方)
  fillRect(1, 6, 20, 6, TileType.WALL);

  // 客厅左墙: col 21, rows 0-22
  fillRect(21, 0, 21, 22, TileType.WALL);

  // 客厅下墙: row 23, cols 21-37
  fillRect(21, 23, 37, 23, TileType.WALL);

  // 走廊左墙: col 1, rows 6-13
  fillRect(1, 6, 1, 13, TileType.WALL);

  // 走廊下墙 / 厨房上墙: row 14, cols 1-20
  fillRect(1, 14, 20, 14, TileType.WALL);

  // 卧室2 右墙延伸: col 20, rows 7-13 (走廊右墙)
  fillRect(20, 7, 20, 13, TileType.WALL);

  // --- 下层 ---

  // 厨房左墙: col 1, rows 14-23
  fillRect(1, 14, 1, 23, TileType.WALL);

  // 厨房/小厅分隔墙: col 10, rows 14-23
  fillRect(10, 14, 10, 23, TileType.WALL);

  // 小厅右墙: col 20, rows 14-23
  fillRect(20, 14, 20, 23, TileType.WALL);

  // 厨房/小厅下墙: row 23, cols 1-20
  fillRect(1, 23, 20, 23, TileType.WALL);

  // === 3. 门洞（清除墙体，设为 FLOOR） ===

  // 卧室1 → 走廊: col 5-6, row 6
  fillRect(5, 6, 6, 6, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 卧室2 → 走廊: col 15-16, row 6
  fillRect(15, 6, 16, 6, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 走廊 → 客厅: col 21, rows 9-10
  fillRect(21, 9, 21, 10, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 走廊 → 下层通道: col 5-6, row 14
  fillRect(5, 14, 6, 14, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 厨房 → 客厅: col 21, rows 19-20
  fillRect(21, 19, 21, 20, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // === 4. 房间地板 ===

  // 卧室1: cols 2-9, rows 1-5
  fillRect(2, 1, 9, 5, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM1);

  // 卧室2: cols 12-19, rows 1-5
  fillRect(12, 1, 19, 5, TileType.FLOOR, FloorType.CARPET, ROOM_IDS.BEDROOM2);

  // 走廊: cols 2-19, rows 7-13
  fillRect(2, 7, 19, 13, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.CORRIDOR);

  // 客厅: cols 22-37, rows 1-22
  fillRect(22, 1, 37, 22, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.LIVING);

  // 厨房: cols 2-9, rows 15-22
  fillRect(2, 15, 9, 22, TileType.FLOOR, FloorType.TILE, ROOM_IDS.KITCHEN);

  // 小厅: cols 11-19, rows 15-22
  fillRect(11, 15, 19, 22, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

  // 走廊→小厅 通道: cols 11-19, row 14 → 打开为地板
  fillRect(11, 14, 19, 14, TileType.FLOOR, FloorType.WOOD, ROOM_IDS.HALL);

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
    { id: 'desk', name: '书桌', x: 5 * T, y: 1 * T, width: 3 * T, height: T, wallPlaced: true },
    { id: 'chair', name: '椅子', x: 6 * T, y: 3 * T, width: T, height: T, wallPlaced: false },
    // 客厅家具
    { id: 'sofa', name: '沙发', x: 33 * T, y: 4 * T, width: 4 * T, height: 2 * T, wallPlaced: true },
    { id: 'coffeeTable', name: '茶几', x: 28 * T, y: 10 * T, width: 3 * T, height: 2 * T, wallPlaced: false },
    { id: 'catbox', name: '猫箱', x: 23 * T, y: 18 * T, width: 2 * T, height: 2 * T, wallPlaced: false },
  ];
}

// 默认庇护所
export function createDefaultShelters(): Shelter[] {
  const T = TILE_SIZE;
  return [
    { id: 'box', name: '纸箱', x: 23 * T, y: 2 * T, width: 2 * T, height: 2 * T },
    { id: 'tunnel', name: '隧道', x: 34 * T, y: 19 * T, width: 3 * T, height: 2 * T },
  ];
}

// 默认猫窝
export function createDefaultCatBeds(): CatBed[] {
  const T = TILE_SIZE;
  return [
    { id: 'bed1', name: '猫窝', x: 28 * T, y: 18 * T, width: 2 * T, height: 2 * T },
  ];
}
