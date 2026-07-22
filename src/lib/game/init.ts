import {
  MAP_COLS,
  MAP_ROWS,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  FloorType,
  type GameState,
  type MapConfig,
  type SolidObject,
} from './types';
import {
  createDefaultLayout,
  computeHouseBounds,
  createDefaultFurnitures,
  createDefaultShelters,
  createDefaultCatBeds,
  ROOMS,
} from '../config/map';
import { CAT_CONFIGS, createCatFromConfig } from '../config/cats';
import { createTimeState } from './time-system';
import { createEventLogState } from './event-log';
import { createWeatherState } from './weather-system';
import { TileMap } from './tile-map';

function initCats(tileMap: TileMap) {
  // 将猫放在客厅区域的中间位置 (cols 1-38, rows 10-29)
  const T = TILE_SIZE;
  const livingRoomCenterX = 19 * T;
  const livingRoomCenterY = 19 * T;

  return CAT_CONFIGS.map((config, i) =>
    createCatFromConfig(
      config,
      livingRoomCenterX + (i - 0.5) * 4 * T,
      livingRoomCenterY
    )
  );
}

export function initGameState(): GameState {
  const tileMap = createDefaultLayout();
  const house = computeHouseBounds(tileMap);
  const furnitures = createDefaultFurnitures();
  const shelters = createDefaultShelters();
  const catBeds = createDefaultCatBeds();

  const map: MapConfig = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    house,
    rooms: ROOMS,
    shelters,
    catBeds,
    furnitures,
    defaultFloor: tileMap.getTile(
      Math.floor(MAP_COLS / 2),
      Math.floor(MAP_ROWS / 2)
    )?.floorType ?? FloorType.WOOD,
  };

  const cats = initCats(tileMap);
  const time = createTimeState();
  const weather = createWeatherState();
  const eventLog = createEventLogState();

  // 碰撞对象 = 合并的墙壁矩形 + 家具
  const wallRects = tileMap.getWallRects();
  const solidObjects: SolidObject[] = [
    ...wallRects,
    ...furnitures,
  ];

  return {
    map,
    house,
    tileMap,
    cats,
    shelters,
    catBeds,
    furnitures,
    solidObjects,
    time,
    weather,
    eventLog,
  };
}
