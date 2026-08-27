import { writable } from 'svelte/store';
import type { Cat } from '../game';

export const catsStore = writable<Cat[]>([]);
