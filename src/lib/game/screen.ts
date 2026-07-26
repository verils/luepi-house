type ScreenSize = {
  width: number;
  height: number;
};

/**
 * 获取物理屏幕尺寸
 */
export function getPhysicalWindowScreenSize(): ScreenSize {
  return {
    width: window.innerWidth * devicePixelRatio,
    height: window.innerHeight * devicePixelRatio
  };
}
