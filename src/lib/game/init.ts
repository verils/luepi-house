import {
  TILE_SIZE,
  HOUSE_WIDTH,
  HOUSE_HEIGHT,
  WALL_THICKNESS,
  TileType,
  type GameState,
  type Tile,
  type MapConfig,
  type SolidObject,
  type Wall,
} from './types';
import { MAP_CONFIG } from '../config/map';
import { CAT_CONFIGS, createCatFromConfig } from '../config/cats';
import { createTimeState } from './time-system';
import { createEventLogState } from './event-log';
import { createWeatherState } from './weather-system';

function initTiles(): Tile[] {
  const tiles: Tile[] = [];
  const cols = HOUSE_WIDTH / TILE_SIZE;
  const rows = HOUSE_HEIGHT / TILE_SIZE;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
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

function buildSolidObjects(walls: Wall[]): SolidObject[] {
  return walls.map(w => ({ x: w.x, y: w.y, width: w.width, height: w.height }));
}

function initCats() {
  const livingRoomX = WALL_THICKNESS + 320 + WALL_THICKNESS;
  const livingRoomWidth = HOUSE_WIDTH - 320 - WALL_THICKNESS;
  const positions = [
    { x: livingRoomX + livingRoomWidth / 3, y: WALL_THICKNESS + HOUSE_HEIGHT / 2 },
    { x: livingRoomX + (livingRoomWidth * 2) / 3, y: WALL_THICKNESS + HOUSE_HEIGHT / 2 },
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
    furnitures: MAP_CONFIG.furnitures,
    defaultFloor: MAP_CONFIG.defaultFloor,
  };

  const tiles = initTiles();
  const cats = initCats();
  const time = createTimeState();
  const weather = createWeatherState();
  const eventLog = createEventLogState();
  const solidObjects = [
    ...buildSolidObjects(map.walls),
    ...map.furnitures,
  ];

  return {
    map,
    house: map.house,
    walls: map.walls,
    cats,
    tiles,
    shelters: map.shelters,
    catBeds: map.catBeds,
    furnitures: map.furnitures,
    solidObjects,
    time,
    weather,
    eventLog,
  };
}
