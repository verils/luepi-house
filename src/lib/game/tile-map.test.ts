import { describe, it, expect } from 'vitest';
import { TileMap } from './tile-map';
import { TILE_SIZE, TileType, FloorType } from './types';

/** 在指定 [col, row] 上批量设置 tile 类型 */
function setTiles(map: TileMap, cells: [number, number][], type: TileType): void {
  for (const [c, r] of cells) {
    map.setTileType(c, r, type);
  }
}

describe('getWallRects', () => {
  it('单个 WALL 合并为一个 tile 大小的矩形', () => {
    const map = new TileMap(5, 5);
    setTiles(map, [[2, 3]], TileType.WALL);

    const rects = map.getWallRects();

    expect(rects).toEqual([
      { x: 2 * TILE_SIZE, y: 3 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE },
    ]);
  });

  it('同行连续 WALL 合并为一个横向矩形', () => {
    const map = new TileMap(5, 5);
    setTiles(map, [[1, 2], [2, 2], [3, 2]], TileType.WALL);

    const rects = map.getWallRects();

    expect(rects).toEqual([
      { x: TILE_SIZE, y: 2 * TILE_SIZE, width: 3 * TILE_SIZE, height: TILE_SIZE },
    ]);
  });

  it('2×2 方块 WALL 合并为一个矩形', () => {
    const map = new TileMap(5, 5);
    setTiles(map, [[1, 1], [2, 1], [1, 2], [2, 2]], TileType.WALL);

    const rects = map.getWallRects();

    expect(rects).toEqual([
      { x: TILE_SIZE, y: TILE_SIZE, width: 2 * TILE_SIZE, height: 2 * TILE_SIZE },
    ]);
  });

  it('L 形 WALL 拆分为多个矩形', () => {
    const map = new TileMap(5, 5);
    setTiles(map, [[0, 0], [0, 1], [1, 1]], TileType.WALL);

    const rects = map.getWallRects();

    expect(rects).toHaveLength(2);
    expect(rects).toContainEqual({ x: 0, y: 0, width: TILE_SIZE, height: 2 * TILE_SIZE });
    expect(rects).toContainEqual({ x: TILE_SIZE, y: TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
  });

  it('分离的 WALL 区域各自成矩形，FLOOR/EMPTY 不混入', () => {
    const map = new TileMap(6, 3);
    setTiles(map, [[0, 0], [1, 0]], TileType.WALL);
    setTiles(map, [[2, 0]], TileType.FLOOR);
    setTiles(map, [[4, 2]], TileType.WALL);

    const rects = map.getWallRects();

    expect(rects).toHaveLength(2);
    expect(rects).toContainEqual({ x: 0, y: 0, width: 2 * TILE_SIZE, height: TILE_SIZE });
    expect(rects).toContainEqual({ x: 4 * TILE_SIZE, y: 2 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
  });
});

describe('getFloorBounds', () => {
  it('返回所有 FLOOR tile 的包围盒', () => {
    const map = new TileMap(8, 6);
    setTiles(map, [[2, 1], [5, 1], [2, 4], [3, 3]], TileType.FLOOR);

    expect(map.getFloorBounds()).toEqual({
      x: 2 * TILE_SIZE,
      y: TILE_SIZE,
      width: 4 * TILE_SIZE, // col 2..5
      height: 4 * TILE_SIZE, // row 1..4
    });
  });

  it('无 FLOOR 时返回全图兜底', () => {
    const map = new TileMap(4, 3);

    expect(map.getFloorBounds()).toEqual({
      x: 0,
      y: 0,
      width: 4 * TILE_SIZE,
      height: 3 * TILE_SIZE,
    });
  });
});

describe('isWalkable', () => {
  it('仅 FLOOR 可走，WALL/EMPTY/越界不可走', () => {
    const map = new TileMap(3, 3);
    setTiles(map, [[0, 0]], TileType.FLOOR);
    setTiles(map, [[1, 1]], TileType.WALL);

    expect(map.isWalkable(0, 0)).toBe(true);
    expect(map.isWalkable(1, 1)).toBe(false);
    expect(map.isWalkable(2, 2)).toBe(false); // EMPTY
    expect(map.isWalkable(-1, 0)).toBe(false); // 越界
    expect(map.isWalkable(0, 3)).toBe(false); // 越界
  });
});

describe('序列化往返', () => {
  it('toJSON → fromJSON 后逐 tile 字段一致', () => {
    const map = new TileMap(3, 2);
    setTiles(map, [[0, 0]], TileType.FLOOR);
    setTiles(map, [[1, 0]], TileType.WALL);
    map.setFloorType(0, 0, FloorType.CARPET);
    map.setRoomId(0, 0, 'living');
    map.setRoomId(1, 0, 'living');

    const restored = TileMap.fromJSON(
      map.toJSON() as { cols: number; rows: number; tiles: { type: TileType; floorType?: FloorType; roomId?: string }[][] },
    );

    expect(restored.cols).toBe(3);
    expect(restored.rows).toBe(2);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const src = map.getTile(c, r)!;
        const dst = restored.getTile(c, r)!;
        expect(dst.type).toBe(src.type);
        expect(dst.floorType).toBe(src.floorType);
        expect(dst.roomId).toBe(src.roomId);
      }
    }
  });
});
