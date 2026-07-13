// 游戏常量定义
export const TILE_SIZE = 32; // 瓷砖大小 32x32px
export const WALL_THICKNESS = 24; // 墙体厚度 24px
export const HOUSE_SIZE = 640; // 房屋大小 640x640px（向后兼容）
export const HOUSE_WIDTH = 960; // 房屋总宽度（含新房间）
export const HOUSE_HEIGHT = 640; // 房屋总高度
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

// 碰撞基元（可碰撞的矩形区域）
export interface SolidObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 家具接口（有碰撞的装饰物）
export interface Furniture extends SolidObject {
  id: string;
  name: string;
  wallPlaced: boolean;
}

// 地图配置接口
export interface MapConfig {
  width: number; // 地图总宽度
  height: number; // 地图总高度
  house: House; // 房屋区域
  walls: Wall[]; // 所有墙体（边界墙 + 内部墙）
  shelters: Shelter[]; // 庇护所列表
  catBeds: CatBed[]; // 猫窝列表
  furnitures: Furniture[]; // 家具列表
  defaultFloor: FloorType; // 默认地板类型
}

// 猫咪动作状态
export type CatActionState =
  | 'idle'
  | 'moving'
  | 'sleeping'
  | 'hiding'
  | 'chasing'
  | 'fleeing'
  | 'grooming'
  | 'playFighting'
  | 'eating'
  | 'drinking'
  | 'exploring'
  | 'socializing'
  | 'watching'
  | 'climbing';

// 猫咪情绪状态（重构为连续数值）
export interface CatMoodState {
  value: number;           // 0-100 当前情绪值
  decayRate: number;       // 基础衰减率
  lastEventTime: number;   // 上次事件时间
}

// 保留旧类型用于兼容
export type CatMood = 'low' | 'calm' | 'excited';

// 猫咪个性接口
export interface CatPersonality {
  curiosity: number;      // 0-100 好奇心
  energy: number;         // 0-100 活泼度
  sociability: number;    // 0-100 社交性
  bravery: number;        // 0-100 勇敢度
  independence: number;   // 0-100 独立性
  appetite: number;       // 0-100 贪吃
  cleanliness: number;    // 0-100 爱干净
  playfulness: number;    // 0-100 调皮
  alertness: number;      // 0-100 警觉性
  patience: number;       // 0-100 耐心
}

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
  speed: number; // 基础移动速度（像素/帧）
  targetX: number; // AI 目标点 X
  targetY: number; // AI 目标点 Y
  action: CatActionState; // 当前动作状态
  idleTimer: number; // 静止计时器（帧数）
  actionTimer: number; // 动作持续计时器（帧数）
  blinkTimer: number; // 眨眼计时器
  isBlinking: boolean; // 是否正在眨眼
  // 情绪系统
  mood: import('./mood-system').CatMoodState; // 当前情绪状态
  moodTimer: number; // 情绪持续时间（帧数）- 保留用于兼容
  // 追逐系统
  chaseTargetId: string | null; // 追逐目标猫的id
  actionSwitchTimer: number; // 动作切换计时器（兴奋期间使用）
  // 个性系统
  personality: CatPersonality; // 猫咪个性
}

// 追逐配对接口
export interface ChasePair {
  chaserId: string; // 追逐者
  targetId: string; // 被追者
  switchChance: number; // 反转追逐的概率
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
  furnitures: Furniture[]; // 家具列表
  solidObjects: SolidObject[]; // 所有可碰撞对象（内部墙 + 家具）
  time: import('./time-system').TimeState; // 时间状态
  weather: import('./weather-system').WeatherState; // 天气状态
  eventLog: import('./event-log').EventLogState; // 事件日志
}

// 猫咪意图事件（独立AI架构核心）
export type CatIntent =
  | { type: 'want_chase'; initiatorId: string; targetId: string }
  | { type: 'want_play_fight'; initiatorId: string; targetId: string }
  | { type: 'want_reverse_chase'; initiatorId: string; targetId: string }
  | { type: 'want_stop_play_fighting'; catId: string };
