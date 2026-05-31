import type { GameState, Tile, Wall, Cat, Shelter, CatBed } from './types';
import { TILE_SIZE, WALL_THICKNESS, HOUSE_SIZE, FloorType, WallType } from './types';
import { Camera } from './camera';
import { LuelueCatRenderer, PipiCatRenderer, DefaultCatRenderer, CatRenderer } from './cat-renderer';
import { TextureManager } from './texture-manager';

/**
 * 游戏渲染器
 */
export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly camera: Camera;
  private readonly textureManager: TextureManager;
  private debugMode: boolean = false;

  // 猫咪渲染器映射表
  private readonly defaultCatRenderer: CatRenderer;
  private readonly catRenderers: Map<string, CatRenderer>;

  constructor(canvas: HTMLCanvasElement, debugMode: boolean = false) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文');
    }
    this.ctx = ctx;
    this.camera = new Camera();
    this.debugMode = debugMode;
    this.textureManager = new TextureManager(ctx);

    // 初始化猫咪渲染器映射
    this.defaultCatRenderer = new DefaultCatRenderer(this.ctx);
    this.catRenderers = new Map<string, CatRenderer>([
      ['luelue', new LuelueCatRenderer(ctx)],
      ['pipi', new PipiCatRenderer(ctx)],
    ]);
  }

  /**
   * 渲染游戏状态
   */
  render(state: GameState): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.camera.apply(this.ctx);

    if (this.debugMode) {
      this.renderDebugLayers();
    }

    // 渲染顺序：地面 → 特殊区域 → 墙壁 → 猫
    this.renderTiles(state.tiles);
    this.renderShelters(state.shelters);
    this.renderCatBeds(state.catBeds);
    this.renderWalls(state.walls);
    this.renderCats(state.cats);

    this.camera.restore(this.ctx);
  }

  /**
   * 【调试】绘制层次区域边界
   */
  private renderDebugLayers(): void {
    const canvasRect = this.camera.screenToWorld(0, 0);
    const canvasWidth = this.canvas.width / this.camera.zoom;
    const canvasHeight = this.canvas.height / this.camera.zoom;

    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    this.ctx.fillRect(canvasRect.x, canvasRect.y, canvasWidth, canvasHeight);

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(canvasRect.x, canvasRect.y, canvasWidth, canvasHeight);

    const mapSize = HOUSE_SIZE + WALL_THICKNESS * 2;
    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.15)';
    this.ctx.fillRect(0, 0, mapSize, mapSize);

    this.ctx.strokeStyle = '#0066FF';
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(0, 0, mapSize, mapSize);

    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
    this.ctx.fillRect(WALL_THICKNESS, WALL_THICKNESS, HOUSE_SIZE, HOUSE_SIZE);

    this.ctx.strokeStyle = '#00CC00';
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(WALL_THICKNESS, WALL_THICKNESS, HOUSE_SIZE, HOUSE_SIZE);
  }

  /**
   * 渲染瓷砖（地板纹理）
   */
  private renderTiles(tiles: Tile[]): void {
    // 按纹理类型分组渲染，减少 Pattern 切换
    const tilesByType = new Map<FloorType, Tile[]>();

    for (const tile of tiles) {
      const floorType = tile.floorType ?? FloorType.WOOD;
      if (!tilesByType.has(floorType)) {
        tilesByType.set(floorType, []);
      }
      tilesByType.get(floorType)!.push(tile);
    }

    for (const [floorType, typeTiles] of tilesByType) {
      const pattern = this.textureManager.getFloorPattern(floorType);
      if (pattern) {
        this.ctx.fillStyle = pattern;
      } else {
        // fallback 纯色
        this.ctx.fillStyle = this.getFloorFallbackColor(floorType);
      }

      for (const tile of typeTiles) {
        this.ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  /**
   * 渲染庇护所（半透明蓝色标记）
   */
  private renderShelters(shelters: Shelter[]): void {
    for (const shelter of shelters) {
      // 半透明蓝色底色
      this.ctx.fillStyle = 'rgba(66, 135, 245, 0.2)';
      this.ctx.fillRect(shelter.x, shelter.y, shelter.width, shelter.height);

      // 虚线边框
      this.ctx.strokeStyle = 'rgba(66, 135, 245, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(shelter.x, shelter.y, shelter.width, shelter.height);
      this.ctx.setLineDash([]);

      // 标签文字
      this.ctx.fillStyle = 'rgba(66, 135, 245, 0.8)';
      this.ctx.font = '10px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        shelter.name,
        shelter.x + shelter.width / 2,
        shelter.y + shelter.height / 2 + 4
      );
    }
  }

  /**
   * 渲染猫窝（半透明绿色标记）
   */
  private renderCatBeds(catBeds: CatBed[]): void {
    for (const bed of catBeds) {
      // 半透明绿色底色
      this.ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      this.ctx.fillRect(bed.x, bed.y, bed.width, bed.height);

      // 虚线边框
      this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(bed.x, bed.y, bed.width, bed.height);
      this.ctx.setLineDash([]);

      // 标签文字
      this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
      this.ctx.font = '10px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        bed.name,
        bed.x + bed.width / 2,
        bed.y + bed.height / 2 + 4
      );
    }
  }

  /**
   * 渲染墙体（纹理 + 2.5D 立体效果）
   */
  private renderWalls(walls: Wall[]): void {
    for (const wall of walls) {
      this.renderSingleWall(wall);
    }
  }

  /**
   * 渲染单个墙体（2.5D 立体效果）
   */
  private renderSingleWall(wall: Wall): void {
    const wallType = wall.wallType ?? WallType.BRICK;
    const pattern = this.textureManager.getWallPattern(wallType);
    const wallHeight = 8; // 2.5D 立体高度偏移

    // 1. 侧面（阴影面 - 底部延伸）
    this.ctx.fillStyle = pattern
      ? this.darkenPattern(pattern, 0.7)
      : this.getWallShadowColor(wallType);
    this.ctx.fillRect(wall.x, wall.y + wall.height, wall.width, wallHeight);

    // 侧面右边缘阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(wall.x + wall.width - 2, wall.y + wall.height, 2, wallHeight);

    // 2. 正面（主墙面）
    if (pattern) {
      this.ctx.fillStyle = pattern;
    } else {
      this.ctx.fillStyle = this.getWallFallbackColor(wallType);
    }
    this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

    // 3. 顶部高光条
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.fillRect(wall.x, wall.y, wall.width, 3);

    // 左侧高光
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(wall.x, wall.y, 2, wall.height);

    // 4. 底部阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.fillRect(wall.x, wall.y + wall.height - 2, wall.width, 2);

    // 5. 黑色描边
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  }

  /**
   * 渲染猫咪
   */
  private renderCats(cats: Cat[]): void {
    cats.forEach((cat) => {
      this.ctx.save();

      const centerX = cat.x + cat.visualWidth / 2;
      const centerY = cat.y + cat.visualHeight / 2;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(cat.rotation);

      const renderer = this.catRenderers.get(cat.id) || this.defaultCatRenderer;
      renderer.render(cat);

      this.ctx.restore();
    });
  }

  /**
   * 获取摄影机实例
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * 地板 fallback 颜色
   */
  private getFloorFallbackColor(floorType: FloorType): string {
    switch (floorType) {
      case FloorType.WOOD: return '#D4A76A';
      case FloorType.CARPET: return '#E8D5B7';
      case FloorType.TILE: return '#F0EDE8';
    }
  }

  /**
   * 墙壁 fallback 颜色
   */
  private getWallFallbackColor(wallType: WallType): string {
    switch (wallType) {
      case WallType.BRICK: return '#8B5E3C';
      case WallType.PLASTER: return '#F5F0E8';
    }
  }

  /**
   * 墙壁阴影 fallback 颜色
   */
  private getWallShadowColor(wallType: WallType): string {
    switch (wallType) {
      case WallType.BRICK: return '#6B4E2C';
      case WallType.PLASTER: return '#D5D0C8';
    }
  }

  /**
   * 创建变暗的 Pattern（用于侧面阴影）
   */
  private darkenPattern(pattern: CanvasPattern, factor: number): CanvasPattern {
    // 通过覆盖半透明黑色来变暗
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = TILE_SIZE;
    tempCanvas.height = TILE_SIZE;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = pattern;
    tempCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    tempCtx.fillStyle = `rgba(0, 0, 0, ${1 - factor})`;
    tempCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    return this.ctx.createPattern(tempCanvas, 'repeat')!;
  }
}
