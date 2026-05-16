import { describe, it, expect } from 'vitest';
import { Camera } from './camera';

describe('Camera', () => {
  it('应该正确初始化摄影机', () => {
    const camera = new Camera();
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
    expect(camera.zoom).toBe(1);
  });

  it('应该能够平移摄影机', () => {
    const camera = new Camera();
    camera.pan(10, 20);
    expect(camera.x).toBe(10);
    expect(camera.y).toBe(20);
  });

  it('应该能够缩放摄影机', () => {
    const camera = new Camera();
    camera.zoomAt(1.5);
    expect(camera.zoom).toBe(1.5);
  });

  it('应该限制缩放范围', () => {
    const camera = new Camera();
    
    // 测试最小缩放
    camera.zoomAt(0.1); // 应该被限制在最小值 0.5
    expect(camera.zoom).toBe(0.5);
    
    // 测试最大缩放
    camera.zoomAt(10); // 应该被限制在最大值 3
    expect(camera.zoom).toBe(3);
  });

  it('应该能够将屏幕坐标转换为世界坐标', () => {
    const camera = new Camera();
    camera.x = 100;
    camera.y = 50;
    camera.zoom = 2;
    
    const worldPos = camera.screenToWorld(300, 200);
    expect(worldPos.x).toBe((300 - 100) / 2); // 100
    expect(worldPos.y).toBe((200 - 50) / 2);  // 75
  });

  it('应该能够将世界坐标转换为屏幕坐标', () => {
    const camera = new Camera();
    camera.x = 100;
    camera.y = 50;
    camera.zoom = 2;
    
    const screenPos = camera.worldToScreen(100, 75);
    expect(screenPos.x).toBe(100 * 2 + 100); // 300
    expect(screenPos.y).toBe(75 * 2 + 50);   // 200
  });
});