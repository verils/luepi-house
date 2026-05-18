import type { GameState, Tile, Wall, House, Cat } from './types';
import { TILE_SIZE, WALL_THICKNESS, HOUSE_SIZE } from './types';
import { Camera } from './camera';

/**
 * 游戏渲染器
 */
export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly camera: Camera;
  private debugMode: boolean = false; // 调试模式开关

  constructor(canvas: HTMLCanvasElement, debugMode: boolean = false) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文');
    }
    this.ctx = ctx;
    this.camera = new Camera();
    this.debugMode = debugMode;
  }

  /**
   * 渲染游戏状态
   */
  render(state: GameState): void {
    // 清空画布（这会显示 CSS 中设置的灰色背景）
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 应用摄影机变换
    this.camera.apply(this.ctx);

    // 【调试】绘制4个层次的区域（仅在调试模式下）
    if (this.debugMode) {
      this.renderDebugLayers();
    }

    // 渲染瓷砖
    this.renderTiles(state.tiles);

    // 渲染房屋地板
    this.renderHouse(state.house);

    // 渲染墙体
    this.renderWalls(state.walls);

    // 渲染猫咪
    this.renderCats(state.cats);

    // 恢复摄影机变换
    this.camera.restore(this.ctx);
  }

  /**
   * 【调试】绘制4个层次区域的边界和填充
   */
  private renderDebugLayers(): void {
    // 1. 画布边界 - 黄色半透明（整个 Canvas 可视区域）
    const canvasRect = this.camera.screenToWorld(0, 0);
    const canvasWidth = this.canvas.width / this.camera.zoom;
    const canvasHeight = this.canvas.height / this.camera.zoom;
    
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; // 黄色，10% 透明度
    this.ctx.fillRect(canvasRect.x, canvasRect.y, canvasWidth, canvasHeight);
    
    this.ctx.strokeStyle = '#FFD700'; // 金黄色边框
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(canvasRect.x, canvasRect.y, canvasWidth, canvasHeight);

    // 2. 地图有效区域 - 蓝色半透明（房屋 + 墙体的总范围）
    const mapSize = HOUSE_SIZE + WALL_THICKNESS * 2; // 688px
    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.15)'; // 蓝色，15% 透明度
    this.ctx.fillRect(0, 0, mapSize, mapSize);
    
    this.ctx.strokeStyle = '#0066FF'; // 蓝色边框
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(0, 0, mapSize, mapSize);

    // 3. 房屋有效区域 - 绿色半透明（房屋内部，不包括墙体）
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.15)'; // 绿色，15% 透明度
    this.ctx.fillRect(WALL_THICKNESS, WALL_THICKNESS, HOUSE_SIZE, HOUSE_SIZE);
    
    this.ctx.strokeStyle = '#00CC00'; // 绿色边框
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(WALL_THICKNESS, WALL_THICKNESS, HOUSE_SIZE, HOUSE_SIZE);
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
      this.ctx.save();
      
      // 移动到猫的中心位置并旋转
      const centerX = cat.x + cat.visualWidth / 2;
      const centerY = cat.y + cat.visualHeight / 2;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(cat.rotation);
      
      // 根据猫的ID选择不同的绘制方法
      if (cat.id === 'luelue') {
        this.renderCatLuelue(cat);
      } else if (cat.id === 'pipi') {
        this.renderCatPipi(cat);
      } else {
        // 默认绘制方法
        this.renderCatDefault(cat);
      }
      
      this.ctx.restore();
    });
  }

  /**
   * 渲染默认猫咪（简单版本）
   */
  private renderCatDefault(cat: Cat): void {
    // 绘制身体（椭圆）- 使用视觉尺寸
    this.ctx.fillStyle = cat.color;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4, cat.visualWidth / 2, cat.visualHeight / 3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // 绘制头部（圆形）- 使用视觉尺寸
    this.ctx.beginPath();
    this.ctx.arc(0, -6, cat.visualWidth / 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 绘制耳朵（三角形）- 使用视觉尺寸
    const earSize = cat.visualWidth / 4;
    // 左耳
    this.ctx.beginPath();
    this.ctx.moveTo(-earSize, -10);
    this.ctx.lineTo(-earSize - 4, -18);
    this.ctx.lineTo(-earSize + 4, -18);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 右耳
    this.ctx.beginPath();
    this.ctx.moveTo(earSize, -10);
    this.ctx.lineTo(earSize - 4, -18);
    this.ctx.lineTo(earSize + 4, -18);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * 渲染略略（橘白猫）
   */
  private renderCatLuelue(cat: Cat): void {
    const scale = cat.visualWidth / 32; // 基于32x32标准尺寸的缩放比例
    
    // 绘制阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 12 * scale, 14 * scale, 6 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制身体（椭圆）- 暖橘色主体
    this.ctx.fillStyle = '#E8945A'; // 暖橘色
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
    
    // 绘制腹部奶油白色区域
    this.ctx.fillStyle = '#FFF5E6'; // 奶油白
    this.ctx.beginPath();
    this.ctx.ellipse(0, 6 * scale, 8 * scale, 5 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制头部（圆形）- 暖橘色
    this.ctx.fillStyle = '#E8945A'; // 暖橘色
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 绘制脸部奶油白色区域
    this.ctx.fillStyle = '#FFF5E6'; // 奶油白
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 7 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制耳朵（三角形）- 暖橘色外部
    this.ctx.fillStyle = '#E8945A'; // 暖橘色
    // 左耳
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -10 * scale);
    this.ctx.lineTo(-12 * scale, -18 * scale);
    this.ctx.lineTo(-4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 右耳
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -10 * scale);
    this.ctx.lineTo(4 * scale, -18 * scale);
    this.ctx.lineTo(12 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 绘制耳朵内侧（粉橘色）
    this.ctx.fillStyle = '#FFB6A0'; // 粉橘色
    // 左耳内侧
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -11 * scale);
    this.ctx.lineTo(-10 * scale, -16 * scale);
    this.ctx.lineTo(-6 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    
    // 右耳内侧
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -11 * scale);
    this.ctx.lineTo(6 * scale, -16 * scale);
    this.ctx.lineTo(10 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    
    // 绘制眼睛（绿色或蓝色）
    this.ctx.fillStyle = '#6BCB77'; // 翠绿色
    // 左眼
    this.ctx.beginPath();
    this.ctx.arc(-4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 右眼
    this.ctx.beginPath();
    this.ctx.arc(4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制鼻子（粉橘色）
    this.ctx.fillStyle = '#FFB6A0'; // 粉橘色
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制胡须（白色线条）
    this.ctx.strokeStyle = '#FFFFFF'; // 纯白色
    this.ctx.lineWidth = 1 * scale;
    
    // 左侧胡须
    this.ctx.beginPath();
    this.ctx.moveTo(-6 * scale, -4 * scale);
    this.ctx.lineTo(-14 * scale, -5 * scale);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(-6 * scale, -3 * scale);
    this.ctx.lineTo(-14 * scale, -2 * scale);
    this.ctx.stroke();
    
    // 右侧胡须
    this.ctx.beginPath();
    this.ctx.moveTo(6 * scale, -4 * scale);
    this.ctx.lineTo(14 * scale, -5 * scale);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(6 * scale, -3 * scale);
    this.ctx.lineTo(14 * scale, -2 * scale);
    this.ctx.stroke();
    
    // 绘制尾巴（曲线）
    this.ctx.strokeStyle = '#E8945A'; // 暖橘色
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
    
    // 绘制爪子（奶油白色）
    this.ctx.fillStyle = '#FFF5E6'; // 奶油白
    // 前爪
    this.ctx.beginPath();
    this.ctx.arc(-6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 后爪
    this.ctx.beginPath();
    this.ctx.arc(-8 * scale, 12 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(8 * scale, 12 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * 渲染皮皮（暹罗猫）
   */
  private renderCatPipi(cat: Cat): void {
    const scale = cat.visualWidth / 32; // 基于32x32标准尺寸的缩放比例
    
    // 绘制阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 12 * scale, 12 * scale, 5 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制身体（椭圆）- 暖米色主体
    this.ctx.fillStyle = '#F5E6D3'; // 暖米色
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
    
    // 绘制重点色区域（深巧克力色）- 脸部面具
    this.ctx.fillStyle = '#5C3A21'; // 深巧克力色
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 9 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制头部（圆形）- 暖米色外层
    this.ctx.fillStyle = '#F5E6D3'; // 暖米色
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 重新绘制脸部重点色（确保在最上层）
    this.ctx.fillStyle = '#5C3A21'; // 深巧克力色
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 8 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制耳朵（三角形）- 深巧克力色外部
    this.ctx.fillStyle = '#5C3A21'; // 深巧克力色
    // 左耳
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -10 * scale);
    this.ctx.lineTo(-12 * scale, -18 * scale);
    this.ctx.lineTo(-4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 右耳
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -10 * scale);
    this.ctx.lineTo(4 * scale, -18 * scale);
    this.ctx.lineTo(12 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 绘制耳朵内侧（淡粉色）
    this.ctx.fillStyle = '#FFD9E0'; // 淡粉色
    // 左耳内侧
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -11 * scale);
    this.ctx.lineTo(-10 * scale, -16 * scale);
    this.ctx.lineTo(-6 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    
    // 右耳内侧
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -11 * scale);
    this.ctx.lineTo(6 * scale, -16 * scale);
    this.ctx.lineTo(10 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    
    // 绘制眼睛（宝石蓝色 - 暹罗猫标志性蓝眼）
    this.ctx.fillStyle = '#4D96FF'; // 宝石蓝色
    // 左眼
    this.ctx.beginPath();
    this.ctx.arc(-4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 右眼
    this.ctx.beginPath();
    this.ctx.arc(4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制鼻子（深巧克力色）
    this.ctx.fillStyle = '#5C3A21'; // 深巧克力色
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制胡须（白色线条）
    this.ctx.strokeStyle = '#FFFFFF'; // 纯白色
    this.ctx.lineWidth = 1 * scale;
    
    // 左侧胡须
    this.ctx.beginPath();
    this.ctx.moveTo(-6 * scale, -4 * scale);
    this.ctx.lineTo(-14 * scale, -5 * scale);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(-6 * scale, -3 * scale);
    this.ctx.lineTo(-14 * scale, -2 * scale);
    this.ctx.stroke();
    
    // 右侧胡须
    this.ctx.beginPath();
    this.ctx.moveTo(6 * scale, -4 * scale);
    this.ctx.lineTo(14 * scale, -5 * scale);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(6 * scale, -3 * scale);
    this.ctx.lineTo(14 * scale, -2 * scale);
    this.ctx.stroke();
    
    // 绘制尾巴（深巧克力色，曲线）
    this.ctx.strokeStyle = '#5C3A21'; // 深巧克力色
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
    
    // 绘制爪子（深巧克力色 - "黑手套"）
    this.ctx.fillStyle = '#5C3A21'; // 深巧克力色
    // 前爪
    this.ctx.beginPath();
    this.ctx.arc(-6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 后爪
    this.ctx.beginPath();
    this.ctx.arc(-8 * scale, 12 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(8 * scale, 12 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 绘制深蓝色丝质蝴蝶结
    this.ctx.fillStyle = '#1E3A8A'; // 深蓝色
    // 蝴蝶结左翼
    this.ctx.beginPath();
    this.ctx.ellipse(-4 * scale, -12 * scale, 3 * scale, 2 * scale, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 蝴蝶结右翼
    this.ctx.beginPath();
    this.ctx.ellipse(4 * scale, -12 * scale, 3 * scale, 2 * scale, -Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 蝴蝶结中心
    this.ctx.fillStyle = '#1E3A8A'; // 深蓝色
    this.ctx.beginPath();
    this.ctx.arc(0, -12 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 获取摄影机实例
   */
  getCamera(): Camera {
    return this.camera;
  }
}
