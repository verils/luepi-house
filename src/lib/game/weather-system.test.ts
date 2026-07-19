import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createWeatherState,
  updateWeather,
  getWeatherBackgroundColor,
  getWeatherName,
  getWeatherIcon,
} from './weather-system';
import { interpolateColor } from './time-system';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createWeatherState', () => {
  it('应该创建初始天气状态', () => {
    const weather = createWeatherState();
    expect(weather.current).toBe('sunny');
    expect(weather.duration).toBeGreaterThan(0);
    expect(weather.transitionProgress).toBe(1.0);
  });
});

describe('updateWeather', () => {
  it('应该递减持续时间', () => {
    const weather = createWeatherState();
    const initialDuration = weather.duration;
    updateWeather(weather);
    expect(weather.duration).toBe(initialDuration - 1);
  });

  it('持续时间归零且抽中不同天气时应切换天气', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 0.5 → cloudy（与当前 sunny 不同）
    const weather = createWeatherState();
    weather.duration = 1;
    const changed = updateWeather(weather);
    expect(changed).toBe(true);
    expect(weather.current).toBe('cloudy');
    expect(weather.previous).toBe('sunny');
    expect(weather.transitionProgress).toBe(0);
    expect(weather.duration).toBeGreaterThan(0);
  });

  it('抽中相同天气时不误报变化事件', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3); // 0.3 → sunny（与当前相同）
    const weather = createWeatherState();
    weather.duration = 1;
    const changed = updateWeather(weather);
    expect(changed).toBe(false);
    expect(weather.current).toBe('sunny');
    expect(weather.previous).toBe('sunny');
    expect(weather.transitionProgress).toBe(1.0);
    expect(weather.duration).toBeGreaterThan(0); // duration 仍被重置
  });

  it('未到切换时间时应返回 false', () => {
    const weather = createWeatherState();
    weather.duration = 100;
    const changed = updateWeather(weather);
    expect(changed).toBe(false);
  });

  it('过渡进度应逐渐增加', () => {
    const weather = createWeatherState();
    weather.transitionProgress = 0.5;
    updateWeather(weather);
    expect(weather.transitionProgress).toBeGreaterThan(0.5);
  });
});

describe('getWeatherName', () => {
  it('应该返回正确的天气名称', () => {
    expect(getWeatherName('sunny')).toBe('晴天');
    expect(getWeatherName('cloudy')).toBe('多云');
    expect(getWeatherName('rainy')).toBe('雨天');
    expect(getWeatherName('snowy')).toBe('雪天');
  });
});

describe('getWeatherIcon', () => {
  it('应该返回正确的天气图标', () => {
    expect(getWeatherIcon('sunny')).toBe('☀️');
    expect(getWeatherIcon('cloudy')).toBe('☁️');
    expect(getWeatherIcon('rainy')).toBe('🌧️');
    expect(getWeatherIcon('snowy')).toBe('❄️');
  });
});

describe('getWeatherBackgroundColor', () => {
  it('应该返回有效的颜色值', () => {
    const weather = createWeatherState();
    const color = getWeatherBackgroundColor(weather);
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('不同天气应返回不同颜色', () => {
    const colors = new Set<string>();
    for (const type of ['sunny', 'cloudy', 'rainy', 'snowy'] as const) {
      const weather = createWeatherState();
      weather.current = type;
      colors.add(getWeatherBackgroundColor(weather));
    }
    expect(colors.size).toBe(4);
  });

  it('过渡中应返回 previous 与 current 的插值颜色', () => {
    const weather = createWeatherState();
    weather.previous = 'sunny';
    weather.current = 'rainy';
    weather.transitionProgress = 0.5;
    expect(getWeatherBackgroundColor(weather)).toBe(interpolateColor('#87CEEB', '#708090', 0.5));
  });

  it('过渡完成后应返回当前天气颜色', () => {
    const weather = createWeatherState();
    weather.previous = 'sunny';
    weather.current = 'rainy';
    weather.transitionProgress = 1;
    expect(getWeatherBackgroundColor(weather)).toBe('#708090');
  });
});

describe('updateWeather deltaTime', () => {
  it('dt=2 时 duration 减少量翻倍', () => {
    const w1 = createWeatherState();
    const w2 = createWeatherState();
    w2.duration = w1.duration;
    const d0 = w1.duration;
    updateWeather(w1, 1);
    updateWeather(w2, 2);
    expect(d0 - w2.duration).toBeCloseTo((d0 - w1.duration) * 2, 5);
  });

  it('dt=2 时过渡进度增速翻倍', () => {
    const w1 = createWeatherState();
    const w2 = createWeatherState();
    w1.transitionProgress = 0;
    w2.transitionProgress = 0;
    updateWeather(w1, 1);
    updateWeather(w2, 2);
    expect(w2.transitionProgress).toBeCloseTo(w1.transitionProgress * 2, 5);
  });
});
