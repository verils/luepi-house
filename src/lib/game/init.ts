import {
  TILE_SIZE,
  HOUSE_SIZE,
  TileType,
  type GameState,
  type Tile,
  type MapConfig,
} from './types';
import { MAP_CONFIG } from '../config/map';
import { CAT_CONFIGS, createCatFromConfig } from '../config/cats';

function initTiles(): Tile[] {
  const tiles: Tile[] = [];
  const tilesCount = HOUSE_SIZE / TILE_SIZE;

  for (let row = 0; row < tilesCount; row++) {
    for (let col = 0; col < tilesCount; col++) {
      tiles.push({
        x: MAP_CONFIG.house.x + col * TILE_SIZE,
        y: MAP_CONFIG.house.y + row * TILE_SIZE,
        type: TileType.FLOOR,
        floorType: MAP_CONFIG.defaultFloor,
      });
    }
  }

  return tiles;
}

function initCats() {
  const positions = [
    { x: MAP_CONFIG.house.x + HOUSE_SIZE / 3, y: MAP_CONFIG.house.y + HOUSE_SIZE / 2 },
    { x: MAP_CONFIG.house.x + (HOUSE_SIZE * 2) / 3, y: MAP_CONFIG.house.y + HOUSE_SIZE / 2 },
  ];

  return CAT_CONFIGS.map((config, i) => createCatFromConfig(config, positions[i].x, positions[i].y));
}

export function initGameState(): GameState {
  const map: MapConfig = {
    width: MAP_CONFIG.house.width + MAP_CONFIG.house.x * 2,
    height: MAP_CONFIG.house.height + MAP_CONFIG.house.y * 2,
    house: MAP_CONFIG.house,
    walls: MAP_CONFIG.walls,
    shelters: MAP_CONFIG.shelters,
    catBeds: MAP_CONFIG.catBeds,
    defaultFloor: MAP_CONFIG.defaultFloor,
  };

  const tiles = initTiles();
  const cats = initCats();

  return {
    map,
    house: map.house,
    walls: map.walls,
    cats,
    tiles,
    shelters: map.shelters,
    catBeds: map.catBeds,
  };
}
