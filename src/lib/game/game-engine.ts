import type {Writable} from 'svelte/store';
import {get} from 'svelte/store';
import type {CatIntent, GameState} from './types';
import type {GameRenderer} from './renderer';
import {type StateContext, updateCatState} from './cat-state-machine';
import {resolveIntents} from './cat-intent-resolver';
import {updateTime} from './time-system';
import {updateWeather, getWeatherName} from './weather-system';
import {logSystemEvent} from './event-log';

export interface GameEngineOptions {
  getGameState: () => GameState | null;
  renderer: GameRenderer;
  debugMode: Writable<boolean>;
  onFrameTick?: (state: GameState) => void;
  onFPSUpdate?: (fps: number) => void;
}

export class GameEngine {
  private animationFrameId = 0;
  private fpsFrames = 0;
  private fpsLastTime = performance.now();
  private lastUiSync = 0;
  private lastFrameTime = 0;
  private unsubDebug: (() => void) | null = null;

  private readonly getGameState: () => GameState | null;
  private readonly renderer: GameRenderer;
  private readonly onFrameTick?: (state: GameState) => void;
  private readonly onFPSUpdate?: (fps: number) => void;

  constructor(options: GameEngineOptions) {
    this.getGameState = options.getGameState;
    this.renderer = options.renderer;
    this.onFrameTick = options.onFrameTick;
    this.onFPSUpdate = options.onFPSUpdate;

    this.unsubDebug = options.debugMode.subscribe((debug) => {
      this.renderer.setDebugMode(debug);
      const state = this.getGameState();
      if (state) {
        this.renderer.render(state);
      }
    });
  }

  start(): void {
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  stop(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.unsubDebug?.();
    this.unsubDebug = null;
  }

  private tick(): void {
    const state = this.getGameState();
    if (!state) {
      this.animationFrameId = requestAnimationFrame(() => this.tick());
      return;
    }

    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 1000) {
      this.onFPSUpdate?.(this.fpsFrames);
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }

    const dt = this.lastFrameTime === 0
      ? 1
      : Math.min((now - this.lastFrameTime) / (1000 / 60), 3);
    this.lastFrameTime = now;

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

    this.renderer.render(state);

    if (now - this.lastUiSync >= 200) {
      this.lastUiSync = now;
      this.onFrameTick?.(state);
    }

    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }
}
