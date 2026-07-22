import { TILE_SIZE, MAP_COLS, MAP_ROWS, TileType, FloorType, type Tile, type Room } from './types';

/**
 * TileMap - 统一的 tile 地图管理
 * 地图中每个 tile 存储类型（EMPTY/FLOOR/WALL）、地板样式和房间归属
 */
export class TileMap {
  readonly cols: number;
  readonly rows: number;
  private grid: Tile[][]; // grid[row][col]

  constructor(cols: number = MAP_COLS, rows: number = MAP_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    for (let r = 0; r < rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          x: c * TILE_SIZE,
          y: r * TILE_SIZE,
          type: TileType.EMPTY,
        });
      }
      this.grid.push(row);
    }
  }

  getTile(col: number, row: number): Tile | null {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {return null;}
    return this.grid[row][col];
  }

  setTileType(col: number, row: number, type: TileType): void {
    const tile = this.getTile(col, row);
    if (tile) {tile.type = type;}
  }

  setFloorType(col: number, row: number, floorType: FloorType): void {
    const tile = this.getTile(col, row);
    if (tile) {tile.floorType = floorType;}
  }

  setRoomId(col: number, row: number, roomId: string): void {
    const tile = this.getTile(col, row);
    if (tile) {tile.roomId = roomId;}
  }

  isWalkable(col: number, row: number): boolean {
    const tile = this.getTile(col, row);
    return tile?.type === TileType.FLOOR;
  }

  isInBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  /** 获取所有 FLOOR tile 的扁平列表（兼容渲染器） */
  getFloorTiles(): Tile[] {
    const result: Tile[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (tile.type === TileType.FLOOR) {
          result.push(tile);
        }
      }
    }
    return result;
  }

  /** 获取指定房间的所有 tile */
  getTilesByRoom(roomId: string): Tile[] {
    const result: Tile[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (tile.roomId === roomId) {
          result.push(tile);
        }
      }
    }
    return result;
  }

  /** 计算所有 FLOOR tile 的包围盒（用于摄像机居中） */
  getFloorBounds(): { x: number; y: number; width: number; height: number } {
    let minCol = this.cols;
    let maxCol = -1;
    let minRow = this.rows;
    let maxRow = -1;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].type === TileType.FLOOR) {
          if (c < minCol) {minCol = c;}
          if (c > maxCol) {maxCol = c;}
          if (r < minRow) {minRow = r;}
          if (r > maxRow) {maxRow = r;}
        }
      }
    }

    if (maxCol < 0) {
      return { x: 0, y: 0, width: this.cols * TILE_SIZE, height: this.rows * TILE_SIZE };
    }

    return {
      x: minCol * TILE_SIZE,
      y: minRow * TILE_SIZE,
      width: (maxCol - minCol + 1) * TILE_SIZE,
      height: (maxRow - minRow + 1) * TILE_SIZE,
    };
  }

  /** 将连续的 WALL tile 合并为矩形（用于碰撞检测优化） */
  getWallRects(): { x: number; y: number; width: number; height: number }[] {
    const visited = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
    const rects: { x: number; y: number; width: number; height: number }[] = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (visited[r][c] || this.grid[r][c].type !== TileType.WALL) {continue;}

        // 尽量向右扩展
        let endC = c;
        while (endC + 1 < this.cols && !visited[r][endC + 1] && this.grid[r][endC + 1].type === TileType.WALL) {
          endC++;
        }
        // 尽量向下扩展
        let endR = r;
        outer: while (endR + 1 < this.rows) {
          for (let cc = c; cc <= endC; cc++) {
            if (visited[endR + 1][cc] || this.grid[endR + 1][cc].type !== TileType.WALL) {
              break outer;
            }
          }
          endR++;
        }

        // 标记已访问
        for (let rr = r; rr <= endR; rr++) {
          for (let cc = c; cc <= endC; cc++) {
            visited[rr][cc] = true;
          }
        }

        rects.push({
          x: c * TILE_SIZE,
          y: r * TILE_SIZE,
          width: (endC - c + 1) * TILE_SIZE,
          height: (endR - r + 1) * TILE_SIZE,
        });
      }
    }

    return rects;
  }

  /** 获取完整的扁平 tile 列表 */
  getAllTiles(): Tile[] {
    const result: Tile[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        result.push(this.grid[r][c]);
      }
    }
    return result;
  }

  /** 遍历所有 tile */
  forEach(callback: (tile: Tile, col: number, row: number) => void): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        callback(this.grid[r][c], c, r);
      }
    }
  }

  /** 序列化为 JSON */
  toJSON(): object {
    return {
      cols: this.cols,
      rows: this.rows,
      tiles: this.grid.map(row => row.map(tile => ({
        type: tile.type,
        floorType: tile.floorType,
        roomId: tile.roomId,
      }))),
    };
  }

  /** 从 JSON 反序列化 */
  static fromJSON(data: { cols: number; rows: number; tiles: { type: TileType; floorType?: FloorType; roomId?: string }[][] }): TileMap {
    const map = new TileMap(data.cols, data.rows);
    for (let r = 0; r < data.rows; r++) {
      for (let c = 0; c < data.cols; c++) {
        const src = data.tiles[r][c];
        map.grid[r][c].type = src.type;
        map.grid[r][c].floorType = src.floorType;
        map.grid[r][c].roomId = src.roomId;
      }
    }
    return map;
  }
}
