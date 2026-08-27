import { writable } from 'svelte/store';
import type { EventLogState } from '../game';
import { createEventLogState } from '../game';

export const eventLogStore = writable<EventLogState>(createEventLogState());
