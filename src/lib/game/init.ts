import {
  TILE_SIZE,
  WALL_THICKNESS,
  HOUSE_SIZE,
  CAT_VISUAL_SIZE,
  TileType,
  type GameState,
  type Tile,
  type Wall,
  type House,
  type Cat,
} from './types';

/**
 * 初始化游戏状态
 */
export function initGameState(): GameState {
  // 计算画布大小（房屋 + 四周墙体）
  const canvasSize = HOUSE_SIZE + WALL_THICKNESS * 2;

  // 初始化房屋（位于中心）
  const house: House = {
    x: WALL_THICKNESS,
    y: WALL_THICKNESS,
    width: HOUSE_SIZE,
    height: HOUSE_SIZE,
  };

  // 初始化四周墙体
  const walls: Wall[] = [
    // 上墙
    { x: 0, y: 0, width: canvasSize, height: WALL_THICKNESS },
    // 下墙
    { x: 0, y: canvasSize - WALL_THICKNESS, width: canvasSize, height: WALL_THICKNESS },
    // 左墙
    { x: 0, y: 0, width: WALL_THICKNESS, height: canvasSize },
    // 右墙
    { x: canvasSize - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: canvasSize },
  ];

  // 初始化瓷砖（只渲染房屋内部的地板）
  const tiles: Tile[] = [];
  const tilesCount = HOUSE_SIZE / TILE_SIZE; // 20x20 的瓷砖网格

  for (let row = 0; row < tilesCount; row++) {
    for (let col = 0; col < tilesCount; col++) {
      tiles.push({
        x: house.x + col * TILE_SIZE,
        y: house.y + row * TILE_SIZE,
        type: TileType.FLOOR,
      });
    }
  }

  // 初始化两只猫（放在房屋内的不同位置）
  const cats: Cat[] = [
    {
      id: 'luelue',
      name: '略略',
      x: house.x + HOUSE_SIZE / 3,
      y: house.y + HOUSE_SIZE / 2,
      visualWidth: CAT_VISUAL_SIZE,
      visualHeight: CAT_VISUAL_SIZE,
      collisionRadius: 16,
      interactionRadius: 20,
      color: '#E8945A',
      rotation: 0,
      speed: 1.5,
      targetX: house.x + HOUSE_SIZE / 3,
      targetY: house.y + HOUSE_SIZE / 2,
      state: 'idle',
      idleTimer: 30,
    },
    {
      id: 'pipi',
      name: '皮皮',
      x: house.x + (HOUSE_SIZE * 2) / 3,
      y: house.y + HOUSE_SIZE / 2,
      visualWidth: CAT_VISUAL_SIZE,
      visualHeight: CAT_VISUAL_SIZE,
      collisionRadius: 14, // 皮皮体型更纤细
      interactionRadius: 18,
      color: '#F5E6D3',
      rotation: 0,
      speed: 1.2,
      targetX: house.x + (HOUSE_SIZE * 2) / 3,
      targetY: house.y + HOUSE_SIZE / 2,
      state: 'idle',
      idleTimer: 60,
    },
  ];

  return {
    house,
    walls,
    cats,
    tiles,
  };
}
