import { writable } from 'svelte/store';
import type { Cat } from '../game';

export const selectedCat = writable<Cat | null>(null);
export const showCatInfo = writable(false);
export const debugMode = writable(false);

export function selectCat(cat: Cat | null) {
  selectedCat.set(cat);
  showCatInfo.set(!!cat);
}

export function deselectCat() {
  selectedCat.set(null);
  showCatInfo.set(false);
}
