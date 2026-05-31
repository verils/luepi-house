// 游戏常量定义
export const TILE_SIZE = 32; // 瓷砖大小 32x32px
export const WALL_THICKNESS = 24; // 墙体厚度 24px
export const HOUSE_SIZE = 640; // 房屋大小 640x640px
export const CAT_VISUAL_SIZE = 32; // 猫咪视觉尺寸 32x32px（标准Sprite尺寸）
export const CAT_COLLISION_RADIUS = 16; // 猫咪碰撞半径 16px

// 地板纹理类型
export enum FloorType {
  WOOD = 'wood', // 木地板
  CARPET = 'carpet', // 地毯
  TILE = 'tile', // 瓷砖
}

// 墙壁纹理类型
export enum WallType {
  BRICK = 'brick', // 砖墙
  PLASTER = 'plaster', // 粉刷墙
}

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
  floorType?: FloorType; // 地板纹理类型
}

// 墙体接口
export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  wallType?: WallType; // 墙壁纹理类型
}

// 房屋接口
export interface House {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 庇护所接口（猫可以躲藏的位置）
export interface Shelter {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 猫窝接口（猫可以睡觉的位置）
export interface CatBed {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 地图配置接口
export interface MapConfig {
  width: number; // 地图总宽度
  height: number; // 地图总高度
  house: House; // 房屋区域
  walls: Wall[]; // 所有墙体（边界墙 + 内部墙）
  shelters: Shelter[]; // 庇护所列表
  catBeds: CatBed[]; // 猫窝列表
  defaultFloor: FloorType; // 默认地板类型
}

// 猫咪状态
export type CatState = 'idle' | 'moving';

// 猫咪接口（三尺寸分离）
export interface Cat {
  id: string;
  name: string;
  x: number;
  y: number;
  // 视觉尺寸 - 用于渲染显示
  visualWidth: number;
  visualHeight: number;
  // 物理尺寸 - 用于碰撞检测
  collisionRadius: number;
  // 交互尺寸 - 用于点击检测
  interactionRadius: number;
  color: string;
  rotation: number; // 旋转角度（弧度）
  speed: number; // 移动速度（像素/帧）
  targetX: number; // AI 目标点 X
  targetY: number; // AI 目标点 Y
  state: CatState; // 当前行为状态
  idleTimer: number; // 静止计时器（帧数）
}

// 游戏状态接口
export interface GameState {
  map: MapConfig; // 地图配置
  house: House;
  walls: Wall[];
  cats: Cat[];
  tiles: Tile[];
  shelters: Shelter[];
  catBeds: CatBed[];
}
