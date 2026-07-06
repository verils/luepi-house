import { describe, it, expect } from 'vitest';
import {
  createWeatherState,
  updateWeather,
  getWeatherBackgroundColor,
  getWeatherName,
  getWeatherIcon,
} from './weather-system';

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

  it('持续时间归零时应切换天气', () => {
    const weather = createWeatherState();
    weather.duration = 1;
    const changed = updateWeather(weather);
    expect(changed).toBe(true);
    expect(weather.duration).toBeGreaterThan(0);
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
});
