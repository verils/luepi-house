export interface DragMoveResult {
  readonly started: boolean;
  readonly panned: boolean;
  readonly dx: number;
  readonly dy: number;
}

const NO_MOVE: DragMoveResult = {started: false, panned: false, dx: 0, dy: 0};

export class DragController {
  private isDragging = false;
  private pendingDrag = false;
  private downX = 0;
  private downY = 0;
  private lastX = 0;
  private lastY = 0;

  private readonly threshold: number;

  constructor(threshold: number = 4) {
    this.threshold = threshold;
  }

  isActive(): boolean {
    return this.isDragging;
  }

  start(clientX: number, clientY: number): void {
    this.isDragging = false;
    this.pendingDrag = true;
    this.downX = clientX;
    this.downY = clientY;
    this.lastX = clientX;
    this.lastY = clientY;
  }

  move(clientX: number, clientY: number): DragMoveResult {
    if (this.isDragging) {
      const dx = clientX - this.lastX;
      const dy = clientY - this.lastY;
      this.lastX = clientX;
      this.lastY = clientY;
      return {started: false, panned: true, dx, dy};
    }

    if (!this.pendingDrag) {
      return NO_MOVE;
    }

    if (Math.hypot(clientX - this.downX, clientY - this.downY) <= this.threshold) {
      return NO_MOVE;
    }

    this.isDragging = true;
    this.pendingDrag = false;
    this.lastX = clientX;
    this.lastY = clientY;
    return {started: true, panned: false, dx: 0, dy: 0};
  }

  end(): void {
    this.isDragging = false;
    this.pendingDrag = false;
  }
}
