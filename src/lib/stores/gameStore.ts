import { writable, derived } from 'svelte/store';
import type { GameState, Cat } from '../game/types';
import { initGameState } from '../game/init';

export const gameState = writable<GameState | null>(null);
export const selectedCat = writable<Cat | null>(null);
export const showCatInfo = writable(false);
export const debugMode = writable(false);
export const isGameRunning = writable(false);

export const catList = derived(gameState, ($state) => $state?.cats ?? []);
export const currentFPS = writable(0);

export function initializeGame(): GameState {
  const state = initGameState();
  gameState.set(state);
  return state;
}

export function selectCat(cat: Cat | null) {
  selectedCat.set(cat);
  showCatInfo.set(!!cat);
}

export function deselectCat() {
  selectedCat.set(null);
  showCatInfo.set(false);
}
