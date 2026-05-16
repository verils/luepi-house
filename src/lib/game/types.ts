// 游戏常量定义
export const TILE_SIZE = 32; // 瓷砖大小 32x32px
export const WALL_THICKNESS = 24; // 墙体厚度 24px
export const HOUSE_SIZE = 640; // 房屋大小 640x640px
export const CAT_VISUAL_SIZE = 24; // 猫咪视觉尺寸 24x24px
export const CAT_COLLISION_RADIUS = 12; // 猫咪碰撞半径 12px

// 瓷砖类型
export enum TileType {
  EMPTY = 0,
  FLOOR = 1,
  WALL = 2,
}

// 瓷砖接口
export interface Tile {
  x: number;
  y: number;
  type: TileType;
}

// 墙体接口
export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 房屋接口
export interface House {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 猫咪接口
export interface Cat {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

// 游戏状态接口
export interface GameState {
  house: House;
  walls: Wall[];
  cats: Cat[];
  tiles: Tile[];
}
