/**
 * 默认地图配置
 */
export const defaultMapConfig = {
  width: 1920,
  height: 1080,
  rooms: [
    {
      name: '客厅',
      x: 100,
      y: 100,
      width: 800,
      height: 600,
      floorType: 'wood',
      themeColor: '#FFE4B5'
    },
    {
      name: '卧室',
      x: 900,
      y: 100,
      width: 600,
      height: 400,
      floorType: 'carpet',
      themeColor: '#E6E6FA'
    },
    {
      name: '厨房',
      x: 100,
      y: 700,
      width: 500,
      height: 300,
      floorType: 'tile',
      themeColor: '#FFFACD'
    },
    {
      name: '游戏区',
      x: 600,
      y: 700,
      width: 500,
      height: 300,
      floorType: 'carpet',
      themeColor: '#FFB6C1'
    }
  ],
  walls: [
    // 上边界
    { x: 960, y: 0, width: 1920, height: 20 },
    // 下边界
    { x: 960, y: 1080, width: 1920, height: 20 },
    // 左边界
    { x: 0, y: 540, width: 20, height: 1080 },
    // 右边界
    { x: 1920, y: 540, width: 20, height: 1080 }
  ]
}

/**
 * 猫的初始配置
 */
export const initialCats = [
  {
    id: 'cat1',
    name: '略略',
    x: 300,
    y: 300,
    colorConfig: {
      mainColor: '#E8945A',      // 暖橘色
      secondaryColor: '#D4783E', // 深橘色
      accentColor: '#FFB6A0',    // 粉橘色
      bellyColor: '#FFF5E6'      // 奶油白
    }
  },
  {
    id: 'cat2',
    name: '皮皮',
    x: 500,
    y: 300,
    colorConfig: {
      mainColor: '#F5E6D3',      // 暖米色
      secondaryColor: '#5C3A21', // 深巧克力色
      accentColor: '#FFD9E0',    // 淡粉色
      bellyColor: '#F5E6D3'      // 暖米色
    }
  }
]
