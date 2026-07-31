import {describe, it, expect} from 'vitest';
import {DragController} from './drag-controller';

describe('DragController', () => {
  it('未 start 直接 move 不触发拖拽', () => {
    const drag = new DragController();
    expect(drag.move(100, 100)).toEqual({started: false, panned: false, dx: 0, dy: 0});
    expect(drag.isActive()).toBe(false);
  });

  it('start 后 isActive 仍为 false（待定状态）', () => {
    const drag = new DragController();
    drag.start(10, 20);
    expect(drag.isActive()).toBe(false);
  });

  it('阈值内多次 move 不触发拖拽', () => {
    const drag = new DragController();
    drag.start(100, 100);
    expect(drag.move(102, 102)).toEqual({started: false, panned: false, dx: 0, dy: 0});
    expect(drag.move(101, 103)).toEqual({started: false, panned: false, dx: 0, dy: 0});
    expect(drag.isActive()).toBe(false);
  });

  it('跨越阈值那一帧 started=true 且不平移', () => {
    const drag = new DragController();
    drag.start(100, 100);
    const result = drag.move(105, 100);
    expect(result.started).toBe(true);
    expect(result.panned).toBe(false);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(drag.isActive()).toBe(true);
  });

  it('跨越帧后后续 move 产生正确平移量', () => {
    const drag = new DragController();
    drag.start(100, 100);
    drag.move(105, 100);

    const r1 = drag.move(115, 110);
    expect(r1).toEqual({started: false, panned: true, dx: 10, dy: 10});

    const r2 = drag.move(118, 114);
    expect(r2).toEqual({started: false, panned: true, dx: 3, dy: 4});
  });

  it('end 后再 move 不触发拖拽', () => {
    const drag = new DragController();
    drag.start(100, 100);
    drag.move(105, 100);
    expect(drag.isActive()).toBe(true);

    drag.end();
    expect(drag.isActive()).toBe(false);

    expect(drag.move(200, 200)).toEqual({started: false, panned: false, dx: 0, dy: 0});
  });

  it('end 后可重新 start 进入新拖拽', () => {
    const drag = new DragController();
    drag.start(0, 0);
    drag.move(10, 0);
    drag.end();

    drag.start(500, 500);
    expect(drag.isActive()).toBe(false);
    expect(drag.move(505, 500).started).toBe(true);
    expect(drag.isActive()).toBe(true);
  });

  it('自定义阈值生效', () => {
    const drag = new DragController(10);
    drag.start(0, 0);
    expect(drag.move(8, 0).started).toBe(false);
    expect(drag.move(11, 0).started).toBe(true);
  });

  it('start 重置已有拖拽状态', () => {
    const drag = new DragController();
    drag.start(0, 0);
    drag.move(10, 0);
    expect(drag.isActive()).toBe(true);

    drag.start(200, 200);
    expect(drag.isActive()).toBe(false);
    expect(drag.move(201, 201)).toEqual({started: false, panned: false, dx: 0, dy: 0});
  });
});
