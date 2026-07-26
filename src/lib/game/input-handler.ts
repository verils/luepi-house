import type {Cat, GameState} from './types';
import type {Camera} from './camera';
import {MAP_HEIGHT, MAP_WIDTH} from './types';

export interface InputHandlerOptions {
  canvas: HTMLCanvasElement;
  getCamera: () => Camera;
  getState: () => GameState | null;
  onSelectCat: (cat: Cat) => void;
  onDeselectCat: () => void;
  onRender: () => void;
  onResize: () => void;
}

export class InputHandler {
  private isDragging = false;
  private pendingDrag = false;
  private downX = 0;
  private downY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private readonly canvas: HTMLCanvasElement;
  private readonly getCamera: () => Camera;
  private readonly getState: () => GameState | null;
  private readonly onSelectCat: (cat: Cat) => void;
  private readonly onDeselectCat: () => void;
  private readonly onRender: () => void;
  private readonly onResize: () => void;

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundMouseLeave: () => void;
  private boundWheel: (e: WheelEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundWindowResize: () => void;

  constructor(options: InputHandlerOptions) {
    this.canvas = options.canvas;
    this.getCamera = options.getCamera;
    this.getState = options.getState;
    this.onSelectCat = options.onSelectCat;
    this.onDeselectCat = options.onDeselectCat;
    this.onRender = options.onRender;
    this.onResize = options.onResize;

    this.boundMouseDown = (e) => this.handleMouseDown(e);
    this.boundMouseMove = (e) => this.handleMouseMove(e);
    this.boundMouseUp = () => this.handleMouseUp();
    this.boundMouseLeave = () => this.handleMouseLeave();
    this.boundWheel = (e) => this.handleWheel(e);
    this.boundKeyDown = (e) => this.handleKeyDown(e);
    this.boundWindowResize = () => this.onResize();
  }

  attach(): void {
    this.canvas.style.cursor = 'grab';
    this.canvas.addEventListener('mousedown', this.boundMouseDown);
    this.canvas.addEventListener('mousemove', this.boundMouseMove);
    this.canvas.addEventListener('mouseup', this.boundMouseUp);
    this.canvas.addEventListener('mouseleave', this.boundMouseLeave);
    this.canvas.addEventListener('wheel', this.boundWheel, {passive: false});
    document.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('resize', this.boundWindowResize);
  }

  detach(): void {
    this.canvas.removeEventListener('mousedown', this.boundMouseDown);
    this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    this.canvas.removeEventListener('mouseup', this.boundMouseUp);
    this.canvas.removeEventListener('mouseleave', this.boundMouseLeave);
    this.canvas.removeEventListener('wheel', this.boundWheel);
    document.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('resize', this.boundWindowResize);
  }

  zoomIn(): void {
    this.getCamera().zoomAt(1.2);
    this.onRender();
  }

  zoomOut(): void {
    this.getCamera().zoomAt(0.8);
    this.onRender();
  }

  private handleMouseDown(e: MouseEvent): void {
    const state = this.getState();
    const camera = this.getCamera();
    if (state) {
      const worldPos = camera.screenToWorld(e.offsetX, e.offsetY);
      for (const cat of state.cats) {
        const dx = worldPos.x - (cat.x + cat.visualWidth / 2);
        const dy = worldPos.y - (cat.y + cat.visualHeight / 2);
        if (Math.sqrt(dx * dx + dy * dy) <= cat.interactionRadius) {
          this.onSelectCat(cat);
          return;
        }
      }
    }
    this.onDeselectCat();
    this.pendingDrag = true;
    this.downX = e.clientX;
    this.downY = e.clientY;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) {
      if (!this.pendingDrag) {
        return;
      }
      if (Math.hypot(e.clientX - this.downX, e.clientY - this.downY) <= 4) {
        return;
      }
      this.isDragging = true;
      this.pendingDrag = false;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    const camera = this.getCamera();
    camera.pan(e.clientX - this.lastMouseX, e.clientY - this.lastMouseY);
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.onRender();
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.pendingDrag = false;
    this.canvas.style.cursor = 'grab';
  }

  private handleMouseLeave(): void {
    this.isDragging = false;
    this.pendingDrag = false;
    this.canvas.style.cursor = 'grab';
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    this.getCamera().zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.offsetX, e.offsetY);
    this.onRender();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const camera = this.getCamera();
    const panSpeed = 20;
    switch (e.key) {
      case 'ArrowUp':
        camera.pan(0, panSpeed);
        break;
      case 'ArrowDown':
        camera.pan(0, -panSpeed);
        break;
      case 'ArrowLeft':
        camera.pan(panSpeed, 0);
        break;
      case 'ArrowRight':
        camera.pan(-panSpeed, 0);
        break;
      case '+':
      case '=':
        camera.zoomAt(1.1);
        break;
      case '-':
      case '_':
        camera.zoomAt(0.9);
        break;
      default:
        return;
    }
    e.preventDefault();
    this.onRender();
  }
}
