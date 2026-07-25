/**
 * 获取设备像素比，上限为 2 以避免高 DPI 屏幕上计算量过大。
 */
export function getDPR(): number {
  return Math.min(devicePixelRatio, 2);
}
