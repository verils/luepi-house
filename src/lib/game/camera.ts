/**
 * 摄影机类，用于控制画布的平移和缩放
 */
export class Camera {
  public x: number = 0; // 摄影机X坐标偏移
  public y: number = 0; // 摄影机Y坐标偏移
  public zoom: number = 1; // 缩放比例，默认为1（正常大小）
  
  private minZoom: number = 0.5; // 最小缩放比例
  private maxZoom: number = 3;   // 最大缩放比例
  
  constructor() {}
  
  /**
   * 应用摄影机变换到Canvas上下文
   */
  apply(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.zoom, this.zoom);
  }
  
  /**
   * 恢复摄影机变换
   */
  restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
  
  /**
   * 平移摄影机
   */
  pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }
  
  /**
   * 缩放摄影机
   */
  zoomAt(scaleFactor: number, centerX?: number, centerY?: number): void {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * scaleFactor));
    
    if (centerX !== undefined && centerY !== undefined) {
      // 以指定点为中心进行缩放
      const worldX = (centerX - this.x) / this.zoom;
      const worldY = (centerY - this.y) / this.zoom;
      
      this.zoom = newZoom;
      
      this.x = centerX - worldX * this.zoom;
      this.y = centerY - worldY * this.zoom;
    } else {
      // 以屏幕中心为基准缩放
      this.zoom = newZoom;
    }
  }
  
  /**
   * 将屏幕坐标转换为世界坐标
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.x) / this.zoom,
      y: (screenY - this.y) / this.zoom
    };
  }
  
  /**
   * 将世界坐标转换为屏幕坐标
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.zoom + this.x,
      y: worldY * this.zoom + this.y
    };
  }
}
