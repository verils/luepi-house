import { writable } from 'svelte/store';
import type { Cat, GameState } from '../game';
import { initGameState } from '../game';

export const gameState = writable<GameState | null>(null);
export const selectedCat = writable<Cat | null>(null);
export const showCatInfo = writable(false);
export const debugMode = writable(false);

export function initializeGameState(): GameState {
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
