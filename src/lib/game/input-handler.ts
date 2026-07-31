import type {Cat, GameState} from './types';
import type {Camera} from './camera';
import {DragController} from './drag-controller';

export interface InputHandlerOptions {
  canvas: HTMLCanvasElement;
  camera: Camera;
  getState: () => GameState | null;
  onSelectCat: (cat: Cat) => void;
  onDeselectCat: () => void;
  onRender: () => void;
  onResize: () => void;
}

export class InputHandler {
  private readonly canvas: HTMLCanvasElement;
  private readonly camera: Camera;
  private readonly getState: () => GameState | null;
  private readonly onSelectCat: (cat: Cat) => void;
  private readonly onDeselectCat: () => void;
  private readonly onRender: () => void;
  private readonly onResize: () => void;
  private readonly drag: DragController;

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundMouseLeave: () => void;
  private boundWheel: (e: WheelEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundWindowResize: () => void;

  constructor(options: InputHandlerOptions) {
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.getState = options.getState;
    this.onSelectCat = options.onSelectCat;
    this.onDeselectCat = options.onDeselectCat;
    this.onRender = options.onRender;
    this.onResize = options.onResize;
    this.drag = new DragController();

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

  private handleMouseDown(e: MouseEvent): void {
    const state = this.getState();
    if (state) {
      const worldPos = this.camera.screenToWorld(e.offsetX, e.offsetY);
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
    this.drag.start(e.clientX, e.clientY);
  }

  private handleMouseMove(e: MouseEvent): void {
    const result = this.drag.move(e.clientX, e.clientY);
    if (result.started) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    if (result.panned) {
      this.camera.pan(result.dx, result.dy);
      this.onRender();
    }
  }

  private handleMouseUp(): void {
    this.drag.end();
    this.canvas.style.cursor = 'grab';
  }

  private handleMouseLeave(): void {
    this.drag.end();
    this.canvas.style.cursor = 'grab';
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    this.camera.zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.offsetX, e.offsetY);
    this.onRender();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const panSpeed = 20;
    switch (e.key) {
      case 'ArrowUp':
        this.camera.pan(0, panSpeed);
        break;
      case 'ArrowDown':
        this.camera.pan(0, -panSpeed);
        break;
      case 'ArrowLeft':
        this.camera.pan(panSpeed, 0);
        break;
      case 'ArrowRight':
        this.camera.pan(-panSpeed, 0);
        break;
      case '+':
      case '=':
        this.camera.zoomAt(1.1);
        break;
      case '-':
      case '_':
        this.camera.zoomAt(0.9);
        break;
      default:
        return;
    }
    e.preventDefault();
    this.onRender();
  }
}
