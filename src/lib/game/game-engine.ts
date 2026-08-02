import type {CatIntent, GameState} from './types';
import {type StateContext, updateCatState} from './cat-state-machine';
import {resolveIntents} from './cat-intent-resolver';
import {updateTime} from './time-system';
import {updateWeather, getWeatherName} from './weather-system';
import {logSystemEvent} from './event-log';

/**
 * 游戏模拟引擎：推进一帧的游戏状态（时间 / 天气 / 猫咪 AI / 意图解算）。
 *
 * 纯模拟单元——不持有 rAF 循环、不渲染、不触碰 store、不做帧计时。
 * 循环驱动、帧计时、FPS 上报、UI 同步均由 App.svelte 负责。
 */
export class GameEngine {
  /**
   * 推进一帧模拟。原地修改 state，不返回新对象。
   */
  step(state: GameState, dt: number): void {
    updateTime(state.time, dt);

    const weatherChanged = updateWeather(state.weather, dt);
    if (weatherChanged && state.eventLog) {
      logSystemEvent(
        state.eventLog,
        'weather_change',
        `天气变为${getWeatherName(state.weather.current)}`,
        {weather: state.weather.current},
        {
          hour: state.time.hour,
          minute: state.time.minute,
          day: state.time.day,
        },
      );
    }

    const stateCtx: StateContext = {
      shelters: state.shelters,
      catBeds: state.catBeds,
      furnitures: state.furnitures,
      toys: state.toys,
      solidObjects: state.solidObjects,
      house: state.house,
      allCats: state.cats,
      eventLog: state.eventLog,
      gameTime: {
        hour: state.time.hour,
        minute: state.time.minute,
        day: state.time.day,
      },
    };

    const allIntents: CatIntent[] = [];
    for (const cat of state.cats) {
      allIntents.push(...updateCatState(cat, stateCtx, dt));
    }
    resolveIntents(allIntents, state.cats);
  }
}
