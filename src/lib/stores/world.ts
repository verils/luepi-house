import type { GameState, WorldConfig } from '../game';

let world: WorldConfig | null = null;

export function initWorld(state: GameState): WorldConfig {
  world = {
    house: state.house,
    tileMap: state.tileMap,
    shelters: state.shelters,
    catBeds: state.catBeds,
    furnitures: state.furnitures,
    toys: state.toys,
    solidObjects: state.solidObjects,
  };
  return world;
}

export function getWorld(): WorldConfig {
  if (world === null) {
    throw new Error('world not initialized: call initWorld() first');
  }
  return world;
}
