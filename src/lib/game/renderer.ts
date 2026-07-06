import type { GameState, Tile, Wall, Cat, Shelter, CatBed } from './types';
import { TILE_SIZE, WALL_THICKNESS, HOUSE_SIZE, FloorType, WallType } from './types';
import { Camera } from './camera';
import { LuelueCatRenderer, PipiCatRenderer, DefaultCatRenderer, CatRenderer } from './cat-renderer';
import { TextureManager } from './texture-manager';
import { getTimeOverlayColor } from './time-system';

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
  private readonly darkenPatternCache = new Map<string, CanvasPattern>();
  private staticCanvas: HTMLCanvasElement | null = null;
  private staticDirty = true;

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

    // 静态元素使用离屏 Canvas 缓存
    if (this.staticDirty || !this.staticCanvas) {
      this.renderStaticToOffscreen(state);
      this.staticDirty = false;
    }
    this.ctx.drawImage(this.staticCanvas!, 0, 0);

    // 动态元素每帧重绘
    this.renderCats(state.cats);

    // 应用时间色调叠加
    this.applyTimeOverlay(state.time);
    
    // 应用天气效果（窗外背景）
    this.applyWeatherEffect(state.weather);

    this.camera.restore(this.ctx);
  }

  /**
   * 将静态元素渲染到离屏 Canvas
   */
  private renderStaticToOffscreen(state: GameState): void {
    if (!this.staticCanvas) {
      this.staticCanvas = document.createElement('canvas');
      this.staticCanvas.width = this.canvas.width;
      this.staticCanvas.height = this.canvas.height;
    }
    const offCtx = this.staticCanvas.getContext('2d')!;
    offCtx.clearRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);

    this.renderTilesToCtx(offCtx, state.tiles);
    this.renderSheltersToCtx(offCtx, state.shelters);
    this.renderCatBedsToCtx(offCtx, state.catBeds);
    this.renderWallsToCtx(offCtx, state.walls);
  }

  /**
   * 应用时间色调叠加
   */
  private applyTimeOverlay(time: GameState['time']): void {
    const { color, opacity } = getTimeOverlayColor(time.phase);
    
    if (opacity > 0) {
      this.ctx.save();
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = opacity;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
  }

  /**
   * 应用天气效果（窗外背景）
   */
  private applyWeatherEffect(_weather: GameState['weather']): void {
    // 天气效果仅影响窗外背景，预留接口
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
    this.renderTilesToCtx(this.ctx, tiles);
  }

  private renderTilesToCtx(ctx: CanvasRenderingContext2D, tiles: Tile[]): void {
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
        ctx.fillStyle = pattern;
      } else {
        ctx.fillStyle = this.getFloorFallbackColor(floorType);
      }

      for (const tile of typeTiles) {
        ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  /**
   * 渲染庇护所（半透明蓝色标记）
   */
  private renderShelters(shelters: Shelter[]): void {
    this.renderSheltersToCtx(this.ctx, shelters);
  }

  private renderSheltersToCtx(ctx: CanvasRenderingContext2D, shelters: Shelter[]): void {
    for (const shelter of shelters) {
      ctx.fillStyle = 'rgba(66, 135, 245, 0.2)';
      ctx.fillRect(shelter.x, shelter.y, shelter.width, shelter.height);

      ctx.strokeStyle = 'rgba(66, 135, 245, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(shelter.x, shelter.y, shelter.width, shelter.height);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(66, 135, 245, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
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
    this.renderCatBedsToCtx(this.ctx, catBeds);
  }

  private renderCatBedsToCtx(ctx: CanvasRenderingContext2D, catBeds: CatBed[]): void {
    for (const bed of catBeds) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      ctx.fillRect(bed.x, bed.y, bed.width, bed.height);

      ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(bed.x, bed.y, bed.width, bed.height);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
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
    this.renderWallsToCtx(this.ctx, walls);
  }

  private renderWallsToCtx(ctx: CanvasRenderingContext2D, walls: Wall[]): void {
    for (const wall of walls) {
      this.renderSingleWallToCtx(ctx, wall);
    }
  }

  /**
   * 渲染单个墙体（2.5D 立体效果）
   */
  private renderSingleWallToCtx(ctx: CanvasRenderingContext2D, wall: Wall): void {
    const wallType = wall.wallType ?? WallType.BRICK;
    const pattern = this.textureManager.getWallPattern(wallType);
    const wallHeight = 8;

    ctx.fillStyle = pattern
      ? this.darkenPattern(pattern, 0.7)
      : this.getWallShadowColor(wallType);
    ctx.fillRect(wall.x, wall.y + wall.height, wall.width, wallHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(wall.x + wall.width - 2, wall.y + wall.height, 2, wallHeight);

    if (pattern) {
      ctx.fillStyle = pattern;
    } else {
      ctx.fillStyle = this.getWallFallbackColor(wallType);
    }
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(wall.x, wall.y, wall.width, 3);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(wall.x, wall.y, 2, wall.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(wall.x, wall.y + wall.height - 2, wall.width, 2);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  }

  /**
   * 渲染猫咪
   */
  private renderCats(cats: Cat[]): void {
    for (const cat of cats) {
      this.ctx.save();

      const centerX = cat.x + cat.visualWidth / 2;
      const centerY = cat.y + cat.visualHeight / 2;
      this.ctx.translate(centerX, centerY);

      const renderer = this.catRenderers.get(cat.id) || this.defaultCatRenderer;
      renderer.render(cat);

      this.ctx.restore();
    }
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
   * 创建变暗的 Pattern（用于侧面阴影），带缓存
   */
  private darkenPattern(pattern: CanvasPattern, factor: number): CanvasPattern {
    const key = `${factor}`;
    const cached = this.darkenPatternCache.get(key);
    if (cached) {return cached;}

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = TILE_SIZE;
    tempCanvas.height = TILE_SIZE;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = pattern;
    tempCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    tempCtx.fillStyle = `rgba(0, 0, 0, ${1 - factor})`;
    tempCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    const result = this.ctx.createPattern(tempCanvas, 'repeat')!;
    this.darkenPatternCache.set(key, result);
    return result;
  }
}
