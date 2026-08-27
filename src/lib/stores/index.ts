import { initGameState } from '../game';
import { catsStore } from './cats';
import { eventLogStore } from './eventLog';
import { deselectCat } from './selection';
import { timeStore } from './time';
import { weatherStore } from './weather';
import { initWorld } from './world';

export function initializeGame(): void {
  const state = initGameState();
  initWorld(state);
  catsStore.set(state.cats);
  timeStore.set(state.time);
  weatherStore.set(state.weather);
  eventLogStore.set(state.eventLog);
  deselectCat();
}
