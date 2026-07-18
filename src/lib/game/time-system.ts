// 时间系统 - 快速昼夜循环

export type TimePhase = 'dawn' | 'day' | 'dusk' | 'night';
export type TimeSpeed = 1 | 2 | 4;

export interface TimeState {
  hour: number;           // 0-23 游戏内小时
  minute: number;         // 0-59 游戏内分钟
  day: number;            // 天数
  phase: TimePhase;       // 当前阶段
  speed: TimeSpeed;       // 时间流速倍数
  tickAccumulator: number; // 帧累积器
}

// 基础流速：1秒=2分钟游戏时间（60FPS时每帧约0.033分钟）
const BASE_TICK_RATE = 2 / 60;

// 时间阶段配置
const PHASE_CONFIG: Record<TimePhase, { start: number; end: number }> = {
  dawn:  { start: 5,  end: 7  },
  day:   { start: 7,  end: 17 },
  dusk:  { start: 17, end: 19 },
  night: { start: 19, end: 5  }, // 跨越午夜
};

// 可选速度选项
const SPEED_OPTIONS: TimeSpeed[] = [1, 2, 4];

/**
 * 创建初始时间状态
 */
export function createTimeState(): TimeState {
  return {
    hour: 8,
    minute: 0,
    day: 1,
    phase: 'day',
    speed: 1,
    tickAccumulator: 0,
  };
}

/**
 * 更新时间状态
 */
export function updateTime(time: TimeState, dt: number = 1): TimePhase | null {
  const previousPhase = time.phase;
  
  // 根据速度倍数累积时间（dt=1 等价 60fps 一帧）
  time.tickAccumulator += BASE_TICK_RATE * time.speed * dt;
  
  while (time.tickAccumulator >= 1) {
    time.tickAccumulator -= 1;
    time.minute++;
    
    if (time.minute >= 60) {
      time.minute = 0;
      time.hour++;
      
      if (time.hour >= 24) {
        time.hour = 0;
        time.day++;
      }
    }
  }
  
  time.phase = getCurrentPhase(time.hour);
  
  // 返回阶段变化（如果发生了变化）
  return time.phase !== previousPhase ? time.phase : null;
}

/**
 * 获取当前时间阶段
 */
export function getCurrentPhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 7) {return 'dawn';}
  if (hour >= 7 && hour < 17) {return 'day';}
  if (hour >= 17 && hour < 19) {return 'dusk';}
  return 'night';
}

/**
 * 切换时间速度
 */
export function cycleTimeSpeed(current: TimeSpeed): TimeSpeed {
  const index = SPEED_OPTIONS.indexOf(current);
  return SPEED_OPTIONS[(index + 1) % SPEED_OPTIONS.length];
}

/**
 * 格式化游戏时间显示
 */
export function formatGameTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 获取阶段内进度（0-1）
 */
export function getPhaseProgress(hour: number, minute: number): number {
  const phase = getCurrentPhase(hour);
  const config = PHASE_CONFIG[phase];
  
  let phaseStart = config.start;
  let phaseEnd = config.end;
  let currentMinutes = hour * 60 + minute;
  
  // 处理夜晚跨越午夜的情况
  if (phase === 'night') {
    if (hour >= 19) {
      // 19:00 - 23:59
      phaseStart = 19 * 60;
      phaseEnd = 24 * 60 + 5 * 60; // 次日05:00
    } else {
      // 00:00 - 04:59
      phaseStart = 0;
      phaseEnd = 5 * 60;
      currentMinutes = hour * 60 + minute;
    }
  } else {
    phaseStart = config.start * 60;
    phaseEnd = config.end * 60;
  }
  
  const progress = (currentMinutes - phaseStart) / (phaseEnd - phaseStart);
  return Math.max(0, Math.min(1, progress));
}

/**
 * 获取时间阶段对应的颜色叠加
 */
export function getTimeOverlayColor(phase: TimePhase): { color: string; opacity: number } {
  switch (phase) {
    case 'dawn':
      return { color: '#FFD700', opacity: 0.05 }; // 暖金色
    case 'day':
      return { color: '#000000', opacity: 0 };     // 无叠加
    case 'dusk':
      return { color: '#FF8C42', opacity: 0.10 }; // 暖橙色
    case 'night':
      return { color: '#1A1A3E', opacity: 0.30 }; // 深蓝紫色
  }
}

/**
 * 获取窗外背景颜色
 */
export function getWindowBackgroundColor(phase: TimePhase, progress: number): string {
  switch (phase) {
    case 'dawn':
      // 橙色渐变 → 蓝色
      return interpolateColor('#FF8C42', '#87CEEB', progress);
    case 'day':
      return '#87CEEB'; // 蓝天
    case 'dusk':
      // 蓝色 → 橙红色
      return interpolateColor('#87CEEB', '#FF6B35', progress);
    case 'night':
      return '#1A1A3E'; // 深蓝紫色
  }
}

/**
 * 颜色插值辅助函数
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
