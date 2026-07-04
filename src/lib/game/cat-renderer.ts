import type { Cat } from './types';

/**
 * 猫咪渲染器基类
 */
export abstract class CatRenderer {
  protected readonly ctx: CanvasRenderingContext2D;
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  /**
   * 渲染猫咪（模板方法）
   */
  render(cat: Cat): void {
    const scale = cat.visualWidth / 32;

    this.ctx.save();

    if (cat.state === 'hiding') {
      this.ctx.globalAlpha = 0.5;
    }

    this.renderShadow(cat, scale);
    this.renderBody(cat, scale);
    this.renderHead(cat, scale);
    this.renderEars(cat, scale);
    this.renderFace(cat, scale);
    this.renderTail(cat, scale);
    this.renderPaws(cat, scale);
    this.renderAccessories(cat, scale);

    this.ctx.restore();

    if (cat.state === 'sleeping') {
      this.renderSleepBubble(cat, scale);
    }
  }
  
  /**
   * 绘制阴影（默认实现）
   */
  protected renderShadow(cat: Cat, scale: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 12 * scale, 12 * scale, 5 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * 绘制身体（抽象方法，由子类实现）
   */
  protected abstract renderBody(cat: Cat, scale: number): void;
  
  /**
   * 绘制头部（抽象方法，由子类实现）
   */
  protected abstract renderHead(cat: Cat, scale: number): void;
  
  /**
   * 绘制耳朵（抽象方法，由子类实现）
   */
  protected abstract renderEars(cat: Cat, scale: number): void;
  
  /**
   * 绘制面部特征（默认实现，可被子类覆盖）
   */
  protected renderFace(cat: Cat, scale: number): void {
    this.renderEyes(cat, scale);
    this.renderNose(cat, scale);
    this.renderWhiskers(cat, scale);
  }
  
  /**
   * 绘制眼睛（默认实现）
   */
  protected renderEyes(cat: Cat, scale: number): void {
    if (cat.state === 'sleeping' || cat.isBlinking) {
      this.renderClosedEyes(cat, scale);
      return;
    }

    this.ctx.fillStyle = '#6BCB77';
    this.ctx.beginPath();
    this.ctx.arc(-4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * 绘制闭合眼睛
   */
  protected renderClosedEyes(cat: Cat, scale: number): void {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1.5 * scale;
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    this.ctx.arc(-4 * scale, -7 * scale, 2 * scale, 0.1 * Math.PI, 0.9 * Math.PI);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(4 * scale, -7 * scale, 2 * scale, 0.1 * Math.PI, 0.9 * Math.PI);
    this.ctx.stroke();
  }

  /**
   * 绘制睡眠气泡 "Zzz"
   */
  protected renderSleepBubble(cat: Cat, scale: number): void {
    const bobOffset = Math.sin(cat.stateTimer * 0.05) * 2 * scale;
    const bubbleX = 14 * scale;
    const bubbleY = -18 * scale + bobOffset;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.ellipse(bubbleX, bubbleY, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#6B7280';
    this.ctx.font = `bold ${8 * scale}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Zzz', bubbleX, bubbleY);
  }
  
  /**
   * 绘制鼻子（默认实现）
   */
  protected renderNose(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#FFB6A0'; // 粉橘色
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * 绘制胡须（默认实现）
   */
  protected renderWhiskers(cat: Cat, scale: number): void {
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
  }
  
  /**
   * 绘制尾巴（默认实现）
   */
  protected renderTail(cat: Cat, scale: number): void {
    this.ctx.strokeStyle = '#8B4513'; // 深棕色
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
  }
  
  /**
   * 绘制爪子（默认实现）
   */
  protected renderPaws(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#8B4513'; // 深棕色
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
   * 绘制装饰物（默认空实现，子类可覆盖）
   */
  protected renderAccessories(cat: Cat, scale: number): void {
    // 默认无装饰
  }
}

/**
 * 略略（橘白猫）渲染器
 */
export class LuelueCatRenderer extends CatRenderer {
  protected renderBody(cat: Cat, scale: number): void {
    // 暖橘色主体
    this.ctx.fillStyle = '#E8945A';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
    
    // 腹部奶油白色区域
    this.ctx.fillStyle = '#FFF5E6';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 6 * scale, 8 * scale, 5 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderHead(cat: Cat, scale: number): void {
    // 暖橘色头部
    this.ctx.fillStyle = '#E8945A';
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 脸部奶油白色区域
    this.ctx.fillStyle = '#FFF5E6';
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 7 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderEars(cat: Cat, scale: number): void {
    // 暖橘色外部
    this.ctx.fillStyle = '#E8945A';
    
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
    
    // 耳朵内侧（粉橘色）
    this.ctx.fillStyle = '#FFB6A0';
    
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
  }
  
  protected renderEyes(cat: Cat, scale: number): void {
    if (cat.state === 'sleeping' || cat.isBlinking) {
      this.renderClosedEyes(cat, scale);
      return;
    }

    this.ctx.fillStyle = '#6BCB77';
    this.ctx.beginPath();
    this.ctx.arc(-4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }

  protected renderNose(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#FFB6A0';
    this.ctx.fillStyle = '#FFB6A0';
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderTail(cat: Cat, scale: number): void {
    // 暖橘色尾巴
    this.ctx.strokeStyle = '#E8945A';
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
  }
  
  protected renderPaws(cat: Cat, scale: number): void {
    // 奶油白色爪子
    this.ctx.fillStyle = '#FFF5E6';
    
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
}

/**
 * 皮皮（暹罗猫）渲染器
 */
export class PipiCatRenderer extends CatRenderer {
  protected renderBody(cat: Cat, scale: number): void {
    // 暖米色主体
    this.ctx.fillStyle = '#F5E6D3';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
  }
  
  protected renderHead(cat: Cat, scale: number): void {
    // 暖米色外层
    this.ctx.fillStyle = '#F5E6D3';
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 重点色脸部面具（深巧克力色）
    this.ctx.fillStyle = '#5C3A21';
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 8 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderEars(cat: Cat, scale: number): void {
    // 深巧克力色外部
    this.ctx.fillStyle = '#5C3A21';
    
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
    
    // 耳朵内侧（淡粉色）
    this.ctx.fillStyle = '#FFD9E0';
    
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
  }
  
  protected renderEyes(cat: Cat, scale: number): void {
    if (cat.state === 'sleeping' || cat.isBlinking) {
      this.renderClosedEyes(cat, scale);
      return;
    }

    this.ctx.fillStyle = '#4D96FF';
    this.ctx.beginPath();
    this.ctx.arc(-4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(4 * scale, -7 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }

  protected renderNose(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#5C3A21';
    this.ctx.fillStyle = '#5C3A21';
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderTail(cat: Cat, scale: number): void {
    // 深巧克力色尾巴
    this.ctx.strokeStyle = '#5C3A21';
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
  }
  
  protected renderPaws(cat: Cat, scale: number): void {
    // 深巧克力色爪子（"黑手套"）
    this.ctx.fillStyle = '#5C3A21';
    
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
  
  protected renderAccessories(cat: Cat, scale: number): void {
    // 深蓝色丝质蝴蝶结
    this.ctx.fillStyle = '#1E3A8A';
    
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
    this.ctx.fillStyle = '#1E3A8A';
    this.ctx.beginPath();
    this.ctx.arc(0, -12 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }
}

/**
 * 默认猫咪渲染器
 */
export class DefaultCatRenderer extends CatRenderer {
  protected renderBody(cat: Cat, scale: number): void {
    this.ctx.fillStyle = cat.color;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
  }
  
  protected renderHead(cat: Cat, scale: number): void {
    this.ctx.fillStyle = cat.color;
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }
  
  protected renderEars(cat: Cat, scale: number): void {
    const earSize = 8 * scale;
    this.ctx.fillStyle = cat.color;
    
    // 左耳
    this.ctx.beginPath();
    this.ctx.moveTo(-earSize, -10 * scale);
    this.ctx.lineTo(-earSize - 4 * scale, -18 * scale);
    this.ctx.lineTo(-earSize + 4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 右耳
    this.ctx.beginPath();
    this.ctx.moveTo(earSize, -10 * scale);
    this.ctx.lineTo(earSize - 4 * scale, -18 * scale);
    this.ctx.lineTo(earSize + 4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
}
