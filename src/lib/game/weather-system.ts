// 天气系统 - 仅视觉效果（窗外背景）

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherState {
  current: WeatherType;
  duration: number;           // 剩余持续帧数
  transitionProgress: number; // 0-1 过渡进度
}

// 天气概率分布
const WEATHER_PROBABILITIES: Record<WeatherType, number> = {
  sunny: 0.4,
  cloudy: 0.3,
  rainy: 0.2,
  snowy: 0.1,
};

// 天气窗口背景颜色
const WEATHER_COLORS: Record<WeatherType, string> = {
  sunny: '#87CEEB',   // 蓝天
  cloudy: '#B0C4DE',  // 灰白色
  rainy: '#708090',   // 灰暗色
  snowy: '#DCDCDC',   // 浅灰色
};

/**
 * 创建初始天气状态
 */
export function createWeatherState(): WeatherState {
  return {
    current: 'sunny',
    duration: getRandomDuration(),
    transitionProgress: 1.0,
  };
}

/**
 * 更新天气状态
 */
export function updateWeather(weather: WeatherState, dt: number = 1): boolean {
  weather.duration -= dt;
  
  if (weather.duration <= 0) {
    const newWeather = getRandomWeather();
    if (newWeather !== weather.current) {
      weather.current = newWeather;
      weather.transitionProgress = 0;
    }
    weather.duration = getRandomDuration();
    return true; // 天气变化
  }
  
  // 过渡动画
  if (weather.transitionProgress < 1) {
    weather.transitionProgress = Math.min(1, weather.transitionProgress + 0.02 * dt);
  }
  
  return false;
}

/**
 * 获取随机天气持续时间（10-30分钟，假设60FPS）
 * 10分钟 = 600秒 × 60帧 = 36000帧
 * 30分钟 = 1800秒 × 60帧 = 108000帧
 * 简化：使用游戏时间帧数
 */
function getRandomDuration(): number {
  // 600-1800帧（约10-30秒 at 60FPS）
  return 600 + Math.floor(Math.random() * 1200);
}

/**
 * 获取随机天气（基于概率）
 */
function getRandomWeather(): WeatherType {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [weather, probability] of Object.entries(WEATHER_PROBABILITIES)) {
    cumulative += probability;
    if (rand < cumulative) {
      return weather as WeatherType;
    }
  }
  
  return 'sunny';
}

/**
 * 获取天气窗口背景颜色
 */
export function getWeatherBackgroundColor(weather: WeatherState): string {
  const targetColor = WEATHER_COLORS[weather.current];
  
  if (weather.transitionProgress >= 1) {
    return targetColor;
  }
  
  // 简单过渡：直接返回目标颜色，使用transitionProgress控制混合
  return targetColor;
}

/**
 * 获取天气名称
 */
export function getWeatherName(weather: WeatherType): string {
  const names: Record<WeatherType, string> = {
    sunny: '晴天',
    cloudy: '多云',
    rainy: '雨天',
    snowy: '雪天',
  };
  return names[weather];
}

/**
 * 获取天气图标
 */
export function getWeatherIcon(weather: WeatherType): string {
  const icons: Record<WeatherType, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
  };
  return icons[weather];
}
