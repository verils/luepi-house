import type { GameState, Tile, Wall, House, Cat } from './types';
import { TILE_SIZE, WALL_THICKNESS } from './types';

/**
 * 游戏渲染器
 */
export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文');
    }
    this.ctx = ctx;
  }

  /**
   * 渲染游戏状态
   */
  render(state: GameState): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染背景（白色）
    this.renderBackground();

    // 渲染瓷砖
    this.renderTiles(state.tiles);

    // 渲染房屋地板
    this.renderHouse(state.house);

    // 渲染墙体
    this.renderWalls(state.walls);

    // 渲染猫咪
    this.renderCats(state.cats);
  }

  /**
   * 渲染背景
   */
  private renderBackground(): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染瓷砖
   */
  private renderTiles(tiles: Tile[]): void {
    tiles.forEach((tile) => {
      // 地板瓷砖使用浅灰色
      this.ctx.fillStyle = '#E8E8E8';
      this.ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);

      // 绘制瓷砖边框
      this.ctx.strokeStyle = '#D0D0D0';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
    });
  }

  /**
   * 渲染房屋
   */
  private renderHouse(house: House): void {
    // 房屋地板使用浅棕色
    this.ctx.fillStyle = '#F5DEB3';
    this.ctx.fillRect(house.x, house.y, house.width, house.height);
  }

  /**
   * 渲染墙体
   */
  private renderWalls(walls: Wall[]): void {
    this.ctx.fillStyle = '#8B4513'; // 深棕色墙体
    walls.forEach((wall) => {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
  }

  /**
   * 渲染猫咪
   */
  private renderCats(cats: Cat[]): void {
    cats.forEach((cat) => {
      // 绘制猫咪方形色块
      this.ctx.fillStyle = cat.color;
      this.ctx.fillRect(cat.x, cat.y, cat.width, cat.height);

      // 绘制猫咪边框
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(cat.x, cat.y, cat.width, cat.height);
    });
  }
}
