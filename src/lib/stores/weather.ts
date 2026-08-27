import { writable } from 'svelte/store';
import type { WeatherState } from '../game';
import { createWeatherState } from '../game';

export const weatherStore = writable<WeatherState>(createWeatherState());
