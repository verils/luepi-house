type ScreenSize = {
  width: number;
  height: number;
};

/**
 * 获取物理屏幕尺寸，具体就是逻辑屏幕尺寸 * 系统分辨率缩放比例
 */
export function getPhysicalWindowScreenSize(): ScreenSize {
  return {
    width: window.innerWidth * devicePixelRatio,
    height: window.innerHeight * devicePixelRatio
  };
}
