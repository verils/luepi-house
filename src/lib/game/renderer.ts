import type {Cat, CatBed, Furniture, GameState, Shelter, Toy} from './types';
import {FloorType, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, TileType} from './types';
import {Camera} from './camera';
import {CatRenderer, DefaultCatRenderer, LuelueCatRenderer, PipiCatRenderer} from './cat-renderer';
import {TextureManager} from './texture-manager';
import {getTimeOverlayColor} from './time-system';
import {getWeatherBackgroundColor} from './weather-system';
import type {TileMap} from './tile-map';

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

  constructor(canvas: HTMLCanvasElement, camera: Camera, debugMode: boolean = false) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文');
    }
    this.ctx = ctx;

    this.camera = camera;
    this.textureManager = new TextureManager(ctx);

    this.debugMode = debugMode;

    // 初始化猫咪渲染器映射
    this.defaultCatRenderer = new DefaultCatRenderer(this.ctx);
    this.catRenderers = new Map<string, CatRenderer>([
      ['luelue', new LuelueCatRenderer(ctx)],
      ['pipi', new PipiCatRenderer(ctx)],
    ]);
  }

  /**
   * 运行时切换调试层显隐
   */
  setDebugMode(value: boolean): void {
    this.debugMode = value;
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

    // 1. 渲染 tile 地图（地板 + 墙壁 + 空白）
    this.renderTileMap(offCtx, state.tileMap);

    // 2. 渲染物体层
    this.renderSheltersToCtx(offCtx, state.shelters);
    this.renderCatBedsToCtx(offCtx, state.catBeds);
    this.renderFurnituresToCtx(offCtx, state.furnitures);
    this.renderToysToCtx(offCtx, state.toys);
  }

  /**
   * 渲染 TileMap：EMPTY / FLOOR / WALL
   */
  private renderTileMap(ctx: CanvasRenderingContext2D, tileMap: TileMap): void {
    const wallPattern = this.textureManager.getWallPattern();

    tileMap.forEach((tile, col, row) => {
      const x = tile.x;
      const y = tile.y;

      switch (tile.type) {
        case TileType.EMPTY:
          // 空白区域 - 浅灰色背景
          ctx.fillStyle = '#E8E4DE';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          break;

        case TileType.FLOOR: {
          const floorType = tile.floorType ?? FloorType.WOOD;
          const pattern = this.textureManager.getFloorPattern(floorType);
          if (pattern) {
            ctx.fillStyle = pattern;
          } else {
            ctx.fillStyle = this.getFloorFallbackColor(floorType);
          }
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          break;
        }

        case TileType.WALL: {
          // 墙壁 - 砖纹理 + 2.5D 效果
          if (wallPattern) {
            ctx.fillStyle = wallPattern;
          } else {
            ctx.fillStyle = '#8B5E3C';
          }
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // 2.5D 阴影底边
          const shadowPattern = wallPattern
            ? this.darkenPattern(wallPattern, 0.7, 'wall_brick')
            : null;
          ctx.fillStyle = shadowPattern ?? '#6B4E2C';
          ctx.fillRect(x, y + TILE_SIZE, TILE_SIZE, 6);

          // 顶部高光
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(x, y, TILE_SIZE, 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(x, y, 2, TILE_SIZE);

          // 底部暗边
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);

          // 边框
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          break;
        }
      }
    });
  }

  /**
   * 应用时间色调叠加
   */
  private applyTimeOverlay(time: GameState['time']): void {
    const {color, opacity} = getTimeOverlayColor(time.phase);

    if (opacity > 0) {
      this.ctx.save();
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = opacity;
      this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      this.ctx.restore();
    }
  }

  /**
   * 应用天气效果（全屏轻色调叠加，随天气变化平滑过渡）
   */
  private applyWeatherEffect(weather: GameState['weather']): void {
    this.ctx.save();
    this.ctx.fillStyle = getWeatherBackgroundColor(weather);
    this.ctx.globalAlpha = 0.08;
    this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.ctx.restore();
  }

  /**
   * 【调试】绘制层次区域边界
   */
  private renderDebugLayers(): void {
    const canvasRect = this.camera.screenToWorld(0, 0);
    // canvas.width 是物理像素（= CSS 宽 × dpr），需换算回逻辑像素再除 zoom
    const dpr = devicePixelRatio;
    const canvasWidth = this.canvas.width / dpr / this.camera.zoom;
    const canvasHeight = this.canvas.height / dpr / this.camera.zoom;

    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    this.ctx.fillRect(canvasRect.x, canvasRect.y, canvasWidth, canvasHeight);

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(canvasRect.x, canvasRect.y, canvasWidth, canvasHeight);

    // 地图边界
    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.15)';
    this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.ctx.strokeStyle = '#0066FF';
    this.ctx.lineWidth = 3 / this.camera.zoom;
    this.ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  /**
   * 渲染庇护所（半透明蓝色标记）
   */
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
   * 渲染家具（简笔画轮廓）
   */
  private renderFurnituresToCtx(ctx: CanvasRenderingContext2D, furnitures: Furniture[]): void {
    for (const f of furnitures) {
      ctx.strokeStyle = '#5C4033';
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.width, f.height);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(f.x + 1, f.y + 1, f.width - 2, f.height - 2);

      this.renderFurnitureDetail(ctx, f);

      ctx.fillStyle = '#5C4033';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, f.x + f.width / 2, f.y + f.height / 2 + 3);
    }
  }

  /**
   * 渲染玩具（小圆点 + 名称）
   */
  private renderToysToCtx(ctx: CanvasRenderingContext2D, toys: Toy[]): void {
    for (const toy of toys) {
      const cx = toy.x + toy.width / 2;
      const cy = toy.y + toy.height / 2;
      const r = Math.min(toy.width, toy.height) / 3;

      ctx.fillStyle = 'rgba(233, 30, 99, 0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(233, 30, 99, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(233, 30, 99, 0.9)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(toy.name, cx, toy.y + toy.height + 10);
    }
  }

  private renderFurnitureDetail(ctx: CanvasRenderingContext2D, f: Furniture): void {
    ctx.strokeStyle = 'rgba(92, 64, 51, 0.5)';
    ctx.lineWidth = 1;

    switch (f.id) {
      case 'sofa': {
        const backY = f.y + 8;
        ctx.beginPath();
        ctx.moveTo(f.x + 4, backY);
        ctx.lineTo(f.x + f.width - 4, backY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(f.x + 6, f.y + 4);
        ctx.lineTo(f.x + 6, f.y + f.height - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(f.x + f.width - 6, f.y + 4);
        ctx.lineTo(f.x + f.width - 6, f.y + f.height - 4);
        ctx.stroke();
        break;
      }
      case 'bookshelf': {
        const rows = 3;
        const cols = 4;
        for (let r = 1; r < rows; r++) {
          const y = f.y + (f.height / rows) * r;
          ctx.beginPath();
          ctx.moveTo(f.x + 2, y);
          ctx.lineTo(f.x + f.width - 2, y);
          ctx.stroke();
        }
        for (let c = 1; c < cols; c++) {
          const x = f.x + (f.width / cols) * c;
          ctx.beginPath();
          ctx.moveTo(x, f.y + 2);
          ctx.lineTo(x, f.y + f.height - 2);
          ctx.stroke();
        }
        break;
      }
      case 'desk': {
        ctx.beginPath();
        ctx.moveTo(f.x + 4, f.y + f.height * 0.6);
        ctx.lineTo(f.x + f.width - 4, f.y + f.height * 0.6);
        ctx.stroke();
        const drawerX = f.x + f.width * 0.6;
        ctx.strokeRect(drawerX, f.y + f.height * 0.6 + 2, f.width * 0.3, f.height * 0.3);
        break;
      }
      case 'chair': {
        ctx.beginPath();
        ctx.moveTo(f.x + f.width / 2, f.y + 2);
        ctx.lineTo(f.x + f.width / 2, f.y + f.height - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(f.x + 2, f.y + f.height / 2);
        ctx.lineTo(f.x + f.width - 2, f.y + f.height / 2);
        ctx.stroke();
        break;
      }
      case 'catbox': {
        ctx.beginPath();
        ctx.moveTo(f.x + f.width * 0.2, f.y + 2);
        ctx.quadraticCurveTo(f.x + f.width / 2, f.y - 6, f.x + f.width * 0.8, f.y + 2);
        ctx.stroke();
        break;
      }
      case 'coffeeTable': {
        ctx.beginPath();
        ctx.moveTo(f.x + 4, f.y + f.height / 2);
        ctx.lineTo(f.x + f.width - 4, f.y + f.height / 2);
        ctx.stroke();
        break;
      }
    }
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
   * 释放渲染器持有的所有资源
   */
  destroy(): void {
    this.textureManager.dispose();
    this.darkenPatternCache.clear();
    this.staticCanvas = null;
  }

  /**
   * 地板 fallback 颜色
   */
  private getFloorFallbackColor(floorType: FloorType): string {
    switch (floorType) {
      case FloorType.WOOD:
        return '#D4A76A';
      case FloorType.CARPET:
        return '#E8D5B7';
      case FloorType.TILE:
        return '#F0EDE8';
    }
  }

  /**
   * 创建变暗的 Pattern（用于侧面阴影），带缓存
   * patternKey 为纹理标识（如 'wall_brick'），避免不同纹理共享缓存 key
   */
  private darkenPattern(pattern: CanvasPattern, factor: number, patternKey: string): CanvasPattern {
    const key = `${patternKey}_${factor}`;
    const cached = this.darkenPatternCache.get(key);
    if (cached) {
      return cached;
    }

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
