import { TILE_SIZE, FloorType } from './types';

/**
 * 纹理管理器
 * 负责加载、缓存和提供纹理资源
 * 当前使用程序生成占位纹理，未来可替换为真实图片
 */
export class TextureManager {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly patterns: Map<string, CanvasPattern> = new Map();
  private readonly textures: Map<string, HTMLCanvasElement> = new Map();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.generateAllTextures();
  }

  /**
   * 获取地板纹理 Pattern
   */
  getFloorPattern(floorType: FloorType): CanvasPattern | null {
    return this.patterns.get(`floor_${floorType}`) ?? null;
  }

  /**
   * 获取墙壁纹理 Pattern
   */
  getWallPattern(): CanvasPattern | null {
    return this.patterns.get('wall_brick') ?? null;
  }

  /**
   * 获取纹理 Canvas（用于调试或自定义绘制）
   */
  getTexture(key: string): HTMLCanvasElement | null {
    return this.textures.get(key) ?? null;
  }

  /**
   * 生成所有占位纹理
   */
  private generateAllTextures(): void {
    // 地板纹理
    this.createWoodFloorTexture();
    this.createCarpetTexture();
    this.createTileFloorTexture();

    // 墙壁纹理
    this.createBrickWallTexture();
  }

  /**
   * 创建纹理 Canvas 并注册为 Pattern
   */
  private registerTexture(
    key: string,
    draw: (ctx: CanvasRenderingContext2D, size: number) => void,
    size: number = TILE_SIZE
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    draw(ctx, size);

    this.textures.set(key, canvas);

    const pattern = this.ctx.createPattern(canvas, 'repeat');
    if (pattern) {
      this.patterns.set(key, pattern);
    }
  }

  /**
   * 木地板纹理 - 暖棕色木纹
   */
  private createWoodFloorTexture(): void {
    this.registerTexture('floor_wood', (ctx, size) => {
      // 基础木色
      ctx.fillStyle = '#D4A76A';
      ctx.fillRect(0, 0, size, size);

      // 木纹线条（深色条纹）
      ctx.fillStyle = '#C49A5C';
      ctx.fillRect(0, 4, size, 2);
      ctx.fillRect(0, 12, size, 1);
      ctx.fillRect(0, 20, size, 2);
      ctx.fillRect(0, 28, size, 1);

      // 木板接缝（垂直线）
      ctx.fillStyle = '#B8894E';
      ctx.fillRect(0, 0, 1, size);
      ctx.fillRect(16, 0, 1, size);

      // 高光点
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(2, 6, 4, 1);
      ctx.fillRect(18, 14, 3, 1);
      ctx.fillRect(8, 22, 5, 1);

      // 深色纹理细节
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(4, 8, 6, 1);
      ctx.fillRect(20, 2, 4, 1);
      ctx.fillRect(10, 24, 3, 1);
    });
  }

  /**
   * 地毯纹理 - 柔软的暖色地毯
   */
  private createCarpetTexture(): void {
    this.registerTexture('floor_carpet', (ctx, size) => {
      // 基础地毯色（暖米色）
      ctx.fillStyle = '#E8D5B7';
      ctx.fillRect(0, 0, size, size);

      // 织物纹理（交错像素点）
      ctx.fillStyle = '#DEC9A8';
      for (let y = 0; y < size; y += 2) {
        for (let x = (y % 4 === 0 ? 0 : 1); x < size; x += 2) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // 细微高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(3, 3, 2, 1);
      ctx.fillRect(19, 11, 2, 1);
    });
  }

  /**
   * 瓷砖纹理 - 光滑的瓷砖地板
   */
  private createTileFloorTexture(): void {
    this.registerTexture('floor_tile', (ctx, size) => {
      // 基础瓷砖色（浅灰白）
      ctx.fillStyle = '#F0EDE8';
      ctx.fillRect(0, 0, size, size);

      // 瓷砖边缘（浅灰色缝）
      ctx.strokeStyle = '#D8D4CE';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

      // 微弱高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(2, 2, 6, 2);
      ctx.fillRect(2, 2, 2, 6);
    });
  }

  /**
   * 砖墙纹理 - 红棕色砖块
   */
  private createBrickWallTexture(): void {
    this.registerTexture('wall_brick', (ctx, size) => {
      // 背景（灰泥色）
      ctx.fillStyle = '#A0937D';
      ctx.fillRect(0, 0, size, size);

      // 砖块颜色
      const brickColor = '#8B5E3C';
      const brickLight = '#9D6E4A';
      const brickDark = '#7A4F30';
      const mortarColor = '#A0937D';

      // 第一行砖块
      ctx.fillStyle = brickColor;
      ctx.fillRect(1, 1, 14, 6);
      ctx.fillRect(17, 1, 14, 6);

      // 第二行砖块（偏移半块）
      ctx.fillRect(1, 9, 6, 6);
      ctx.fillRect(9, 9, 14, 6);
      ctx.fillRect(25, 9, 6, 6);

      // 砖块高光（顶部边缘）
      ctx.fillStyle = brickLight;
      ctx.fillRect(1, 1, 14, 1);
      ctx.fillRect(17, 1, 14, 1);
      ctx.fillRect(1, 9, 6, 1);
      ctx.fillRect(9, 9, 14, 1);
      ctx.fillRect(25, 9, 6, 1);

      // 砖块阴影（底部边缘）
      ctx.fillStyle = brickDark;
      ctx.fillRect(1, 6, 14, 1);
      ctx.fillRect(17, 6, 14, 1);
      ctx.fillRect(1, 14, 6, 1);
      ctx.fillRect(9, 14, 14, 1);
      ctx.fillRect(25, 14, 6, 1);

      // 灰泥缝
      ctx.fillStyle = mortarColor;
      ctx.fillRect(0, 0, size, 1); // 顶部边缘
      ctx.fillRect(0, 8, size, 1); // 中间缝
      ctx.fillRect(15, 0, 2, 8); // 垂直缝
      ctx.fillRect(7, 8, 2, 8); // 垂直缝（偏移）
      ctx.fillRect(23, 8, 2, 8); // 垂直缝
    });
  }
}
