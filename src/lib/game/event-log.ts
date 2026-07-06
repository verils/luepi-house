// 事件日志系统 - 记录所有游戏事件

export type EventCategory = 
  | 'behavior'    // 猫咪行为
  | 'emotion'     // 情绪变化
  | 'interaction' // 猫咪互动
  | 'system'      // 系统事件（时间、天气）
  | 'environment'; // 环境事件

export interface GameEvent {
  id: string;
  timestamp: number;           // 游戏内时间戳
  realTime: number;            // 真实时间戳
  category: EventCategory;
  type: string;
  catId?: string;
  data: Record<string, any>;
  message: string;             // 可读描述
}

export interface EventLogState {
  events: GameEvent[];
  maxEvents: number;           // 最大100条
  filters: EventFilter;
}

export interface EventFilter {
  categories: EventCategory[];
  catId?: string;
}

// 事件图标映射
const EVENT_ICONS: Record<string, string> = {
  // 行为事件
  state_change: '🔄',
  action_start: '▶️',
  action_end: '⏹️',
  
  // 情绪事件
  mood_change: '💭',
  mood_threshold: '💫',
  
  // 互动事件
  chase_start: '🏃',
  chase_end: '🏁',
  play_fight: '⚔️',
  
  // 系统事件
  phase_change: '🌅',
  weather_change: '🌤️',
  hour_change: '⏰',
  
  // 环境事件
  enter_shelter: '🏠',
  leave_shelter: '🚪',
  eat: '🍽️',
  drink: '💧',
};

let eventCounter = 0;

/**
 * 创建初始事件日志状态
 */
export function createEventLogState(): EventLogState {
  return {
    events: [],
    maxEvents: 100,
    filters: {
      categories: [],
    },
  };
}

/**
 * 记录事件
 */
export function logEvent(
  eventLog: EventLogState,
  category: EventCategory,
  type: string,
  message: string,
  data: Record<string, any> = {},
  catId?: string,
  gameTime?: { hour: number; minute: number; day: number }
): void {
  const event: GameEvent = {
    id: `event_${++eventCounter}`,
    timestamp: gameTime ? gameTime.hour * 60 + gameTime.minute : 0,
    realTime: Date.now(),
    category,
    type,
    catId,
    data,
    message,
  };
  
  eventLog.events.unshift(event);
  if (eventLog.events.length > eventLog.maxEvents) {
    eventLog.events.pop();
  }
}

/**
 * 获取事件图标
 */
export function getEventIcon(type: string): string {
  return EVENT_ICONS[type] || '📌';
}

/**
 * 获取过滤后的事件列表
 */
export function getFilteredEvents(
  eventLog: EventLogState,
  filters?: Partial<EventFilter>
): GameEvent[] {
  let events = eventLog.events;
  
  if (filters?.categories && filters.categories.length > 0) {
    events = events.filter(e => filters.categories!.includes(e.category));
  }
  
  if (filters?.catId) {
    events = events.filter(e => e.catId === filters.catId);
  }
  
  return events;
}

/**
 * 格式化事件时间
 */
export function formatEventTime(timestamp: number): string {
  const hour = Math.floor(timestamp / 60);
  const minute = timestamp % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 记录行为事件
 */
export function logBehaviorEvent(
  eventLog: EventLogState,
  catId: string,
  catName: string,
  action: string,
  gameTime?: { hour: number; minute: number; day: number }
): void {
  const actionNames: Record<string, string> = {
    idle: '静止',
    moving: '移动',
    sleeping: '睡觉',
    hiding: '躲藏',
    chasing: '追逐',
    fleeing: '逃跑',
    grooming: '舔毛',
    playFighting: '打闹',
    eating: '吃东西',
    drinking: '喝水',
    exploring: '探索',
    socializing: '社交',
    watching: '观察',
    climbing: '攀爬',
  };
  
  const actionName = actionNames[action] || action;
  logEvent(
    eventLog,
    'behavior',
    'state_change',
    `${catName} 开始${actionName}`,
    { action },
    catId,
    gameTime
  );
}

/**
 * 记录情绪事件
 */
export function logMoodEvent(
  eventLog: EventLogState,
  catId: string,
  catName: string,
  oldThreshold: string,
  newThreshold: string,
  gameTime?: { hour: number; minute: number; day: number }
): void {
  if (oldThreshold === newThreshold) {return;}
  
  const thresholdNames: Record<string, string> = {
    depressed: '沮丧',
    calm: '平静',
    content: '满足',
    excited: '兴奋',
    euphoric: '极度兴奋',
  };
  
  logEvent(
    eventLog,
    'emotion',
    'mood_threshold',
    `${catName} 情绪变为${thresholdNames[newThreshold]}`,
    { oldThreshold, newThreshold },
    catId,
    gameTime
  );
}

/**
 * 记录系统事件
 */
export function logSystemEvent(
  eventLog: EventLogState,
  type: string,
  message: string,
  data: Record<string, any> = {},
  gameTime?: { hour: number; minute: number; day: number }
): void {
  logEvent(eventLog, 'system', type, message, data, undefined, gameTime);
}
