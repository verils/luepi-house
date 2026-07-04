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

    if (cat.action === 'hiding') {
      this.ctx.globalAlpha = 0.5;
    }

    if (cat.mood === 'excited' && (cat.action === 'chasing' || cat.action === 'fleeing')) {
      this.renderSpeedLines(cat, scale);
    }

    if (cat.action === 'playFighting') {
      this.renderPlayFightEffect(cat, scale);
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

    if (cat.action === 'sleeping') {
      this.renderSleepBubble(cat, scale);
    }

    if (cat.action === 'grooming') {
      this.renderGroomingEffect(cat, scale);
    }

    if (cat.mood === 'excited') {
      this.renderExcitementSparkles(cat, scale);
    }

    if (cat.mood === 'low') {
      this.renderLowMoodEffect(cat, scale);
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
    if (cat.action === 'sleeping' || cat.isBlinking) {
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
    const bobOffset = Math.sin(cat.actionTimer * 0.05) * 2 * scale;
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
    this.ctx.fillStyle = '#FFB6A0';
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * 绘制胡须（默认实现）
   */
  protected renderWhiskers(cat: Cat, scale: number): void {
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1 * scale;
    
    this.ctx.beginPath();
    this.ctx.moveTo(-6 * scale, -4 * scale);
    this.ctx.lineTo(-14 * scale, -5 * scale);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(-6 * scale, -3 * scale);
    this.ctx.lineTo(-14 * scale, -2 * scale);
    this.ctx.stroke();
    
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
    this.ctx.strokeStyle = '#8B4513';
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
    this.ctx.fillStyle = '#8B4513';
    this.ctx.beginPath();
    this.ctx.arc(-6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
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

  /**
   * 绘制速度线（兴奋+追逐/逃跑状态）
   */
  protected renderSpeedLines(cat: Cat, scale: number): void {
    const time = cat.actionTimer * 0.2;
    this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
    this.ctx.lineWidth = 1.5 * scale;
    this.ctx.lineCap = 'round';

    for (let i = 0; i < 3; i++) {
      const offset = Math.sin(time + i * 2) * 3 * scale;
      const y = -5 * scale + i * 6 * scale + offset;
      this.ctx.beginPath();
      this.ctx.moveTo(-16 * scale, y);
      this.ctx.lineTo(-12 * scale, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制打闹效果
   */
  protected renderPlayFightEffect(cat: Cat, scale: number): void {
    const time = cat.actionTimer * 0.15;
    const bounce = Math.sin(time * 3) * 2 * scale;

    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(0, bounce - 10 * scale, 8 * scale, 0, Math.PI * 2);
    this.ctx.fill();

    const starCount = 3;
    for (let i = 0; i < starCount; i++) {
      const angle = (time + i * Math.PI * 2) / starCount;
      const starX = Math.cos(angle) * 12 * scale;
      const starY = Math.sin(angle) * 12 * scale - 10 * scale + bounce;
      this.renderStar(starX, starY, 2 * scale);
    }
  }

  /**
   * 绘制星星
   */
  protected renderStar(x: number, y: number, size: number): void {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * 绘制舔毛效果
   */
  protected renderGroomingEffect(cat: Cat, scale: number): void {
    const time = cat.actionTimer * 0.1;
    const tongueExtend = Math.abs(Math.sin(time * 2)) * 3 * scale;

    this.ctx.fillStyle = '#FF9999';
    this.ctx.beginPath();
    this.ctx.ellipse(2 * scale, -2 * scale + tongueExtend, 2 * scale, 1 * scale, 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    this.ctx.lineWidth = 1 * scale;
    for (let i = 0; i < 3; i++) {
      const dropX = 4 * scale + i * 2 * scale;
      const dropY = -1 * scale + Math.sin(time + i) * 2 * scale;
      this.ctx.beginPath();
      this.ctx.arc(dropX, dropY, 1 * scale, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制兴奋火花
   */
  protected renderExcitementSparkles(cat: Cat, scale: number): void {
    const time = cat.moodTimer * 0.1;
    const sparkleCount = 4;

    for (let i = 0; i < sparkleCount; i++) {
      const angle = time + (i * Math.PI * 2) / sparkleCount;
      const radius = 14 * scale + Math.sin(time * 2 + i) * 2 * scale;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius - 5 * scale;
      const size = (1 + Math.sin(time * 3 + i * 1.5)) * scale;

      this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(time + i) * 0.3})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * 绘制低落情绪效果（灰色光晕）
   */
  protected renderLowMoodEffect(cat: Cat, scale: number): void {
    this.ctx.fillStyle = 'rgba(100, 100, 150, 0.15)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 16 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

/**
 * 略略（橘白猫）渲染器
 */
export class LuelueCatRenderer extends CatRenderer {
  protected renderBody(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#E8945A';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#FFF5E6';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 6 * scale, 8 * scale, 5 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderHead(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#E8945A';
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#FFF5E6';
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 7 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderEars(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#E8945A';
    
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -10 * scale);
    this.ctx.lineTo(-12 * scale, -18 * scale);
    this.ctx.lineTo(-4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -10 * scale);
    this.ctx.lineTo(4 * scale, -18 * scale);
    this.ctx.lineTo(12 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#FFB6A0';
    
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -11 * scale);
    this.ctx.lineTo(-10 * scale, -16 * scale);
    this.ctx.lineTo(-6 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -11 * scale);
    this.ctx.lineTo(6 * scale, -16 * scale);
    this.ctx.lineTo(10 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  protected renderEyes(cat: Cat, scale: number): void {
    if (cat.action === 'sleeping' || cat.isBlinking) {
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
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderTail(cat: Cat, scale: number): void {
    this.ctx.strokeStyle = '#E8945A';
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
  }
  
  protected renderPaws(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#FFF5E6';
    
    this.ctx.beginPath();
    this.ctx.arc(-6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
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
    this.ctx.fillStyle = '#F5E6D3';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 4 * scale, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();
  }
  
  protected renderHead(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#F5E6D3';
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 10 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#5C3A21';
    this.ctx.beginPath();
    this.ctx.arc(0, -6 * scale, 8 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderEars(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#5C3A21';
    
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -10 * scale);
    this.ctx.lineTo(-12 * scale, -18 * scale);
    this.ctx.lineTo(-4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -10 * scale);
    this.ctx.lineTo(4 * scale, -18 * scale);
    this.ctx.lineTo(12 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#FFD9E0';
    
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -11 * scale);
    this.ctx.lineTo(-10 * scale, -16 * scale);
    this.ctx.lineTo(-6 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, -11 * scale);
    this.ctx.lineTo(6 * scale, -16 * scale);
    this.ctx.lineTo(10 * scale, -16 * scale);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  protected renderEyes(cat: Cat, scale: number): void {
    if (cat.action === 'sleeping' || cat.isBlinking) {
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
    this.ctx.beginPath();
    this.ctx.arc(0, -4 * scale, 1.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  protected renderTail(cat: Cat, scale: number): void {
    this.ctx.strokeStyle = '#5C3A21';
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(8 * scale, 8 * scale);
    this.ctx.quadraticCurveTo(14 * scale, 12 * scale, 16 * scale, 6 * scale);
    this.ctx.stroke();
  }
  
  protected renderPaws(cat: Cat, scale: number): void {
    this.ctx.fillStyle = '#5C3A21';
    
    this.ctx.beginPath();
    this.ctx.arc(-6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(6 * scale, 10 * scale, 2 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
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
    this.ctx.fillStyle = '#1E3A8A';
    
    this.ctx.beginPath();
    this.ctx.ellipse(-4 * scale, -12 * scale, 3 * scale, 2 * scale, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.ellipse(4 * scale, -12 * scale, 3 * scale, 2 * scale, -Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
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
    
    this.ctx.beginPath();
    this.ctx.moveTo(-earSize, -10 * scale);
    this.ctx.lineTo(-earSize - 4 * scale, -18 * scale);
    this.ctx.lineTo(-earSize + 4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(earSize, -10 * scale);
    this.ctx.lineTo(earSize - 4 * scale, -18 * scale);
    this.ctx.lineTo(earSize + 4 * scale, -18 * scale);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
}
