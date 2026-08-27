import { writable } from 'svelte/store';
import type { TimeState } from '../game';
import { createTimeState } from '../game';

export const timeStore = writable<TimeState>(createTimeState());
