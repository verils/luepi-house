import { describe, it, expect } from 'vitest';
import {
  createEventLogState,
  logEvent,
  getEventIcon,
  getFilteredEvents,
  formatEventTime,
  logBehaviorEvent,
  logMoodEvent,
  logSystemEvent,
} from './event-log';

describe('createEventLogState', () => {
  it('应该创建初始状态', () => {
    const state = createEventLogState();
    expect(state.events).toHaveLength(0);
    expect(state.maxEvents).toBe(100);
    expect(state.filters.categories).toHaveLength(0);
  });
});

describe('logEvent', () => {
  it('应该记录事件', () => {
    const state = createEventLogState();
    logEvent(state, 'behavior', 'state_change', '测试事件');
    expect(state.events).toHaveLength(1);
    expect(state.events[0].category).toBe('behavior');
    expect(state.events[0].type).toBe('state_change');
    expect(state.events[0].message).toBe('测试事件');
  });

  it('应该限制最大事件数', () => {
    const state = createEventLogState();
    state.maxEvents = 3;
    logEvent(state, 'behavior', 'a', '1');
    logEvent(state, 'behavior', 'b', '2');
    logEvent(state, 'behavior', 'c', '3');
    logEvent(state, 'behavior', 'd', '4');
    expect(state.events).toHaveLength(3);
    expect(state.events[0].message).toBe('4');
  });

  it('新事件应该插入到列表头部', () => {
    const state = createEventLogState();
    logEvent(state, 'behavior', 'a', 'first');
    logEvent(state, 'behavior', 'b', 'second');
    expect(state.events[0].message).toBe('second');
    expect(state.events[1].message).toBe('first');
  });

  it('应该携带 catId 和 gameTime', () => {
    const state = createEventLogState();
    logEvent(state, 'behavior', 'test', 'msg', {}, 'cat1', { hour: 14, minute: 30, day: 1 });
    expect(state.events[0].catId).toBe('cat1');
    expect(state.events[0].timestamp).toBe(14 * 60 + 30);
  });
});

describe('getFilteredEvents', () => {
  it('无筛选条件时返回所有事件', () => {
    const state = createEventLogState();
    logEvent(state, 'behavior', 'a', '1');
    logEvent(state, 'emotion', 'b', '2');
    expect(getFilteredEvents(state)).toHaveLength(2);
  });

  it('按类别筛选', () => {
    const state = createEventLogState();
    logEvent(state, 'behavior', 'a', '1');
    logEvent(state, 'emotion', 'b', '2');
    logEvent(state, 'system', 'c', '3');
    const filtered = getFilteredEvents(state, { categories: ['behavior', 'emotion'] });
    expect(filtered).toHaveLength(2);
  });

  it('按 catId 筛选', () => {
    const state = createEventLogState();
    logEvent(state, 'behavior', 'a', '1', {}, 'cat1');
    logEvent(state, 'behavior', 'b', '2', {}, 'cat2');
    logEvent(state, 'behavior', 'c', '3', {}, 'cat1');
    const filtered = getFilteredEvents(state, { catId: 'cat1' });
    expect(filtered).toHaveLength(2);
  });
});

describe('formatEventTime', () => {
  it('应该格式化时间戳', () => {
    expect(formatEventTime(0)).toBe('00:00');
    expect(formatEventTime(14 * 60 + 30)).toBe('14:30');
    expect(formatEventTime(9 * 60 + 5)).toBe('09:05');
  });
});

describe('getEventIcon', () => {
  it('已知类型应返回对应图标', () => {
    expect(getEventIcon('state_change')).toBe('🔄');
    expect(getEventIcon('mood_change')).toBe('💭');
  });

  it('未知类型应返回默认图标', () => {
    expect(getEventIcon('unknown')).toBe('📌');
  });
});

describe('logBehaviorEvent', () => {
  it('应该记录行为事件', () => {
    const state = createEventLogState();
    logBehaviorEvent(state, 'cat1', '略略', 'sleeping', { hour: 10, minute: 0, day: 1 });
    expect(state.events).toHaveLength(1);
    expect(state.events[0].category).toBe('behavior');
    expect(state.events[0].catId).toBe('cat1');
    expect(state.events[0].message).toContain('略略');
    expect(state.events[0].message).toContain('睡觉');
  });
});

describe('logMoodEvent', () => {
  it('相同阈值不应记录', () => {
    const state = createEventLogState();
    logMoodEvent(state, 'cat1', '略略', 'content', 'content');
    expect(state.events).toHaveLength(0);
  });

  it('不同阈值应记录', () => {
    const state = createEventLogState();
    logMoodEvent(state, 'cat1', '略略', 'content', 'excited');
    expect(state.events).toHaveLength(1);
    expect(state.events[0].category).toBe('emotion');
  });
});

describe('logSystemEvent', () => {
  it('应该记录系统事件', () => {
    const state = createEventLogState();
    logSystemEvent(state, 'weather_change', '天气变为晴天', { weather: 'sunny' });
    expect(state.events).toHaveLength(1);
    expect(state.events[0].category).toBe('system');
    expect(state.events[0].catId).toBeUndefined();
  });
});
