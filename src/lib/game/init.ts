import { type GameState, type SolidObject, TILE_SIZE, } from './types';
import {
  computeHouseBounds,
  createDefaultCatBeds,
  createDefaultFurnitures,
  createDefaultLayout,
  createDefaultShelters,
  createDefaultToys,
} from '../config/map';
import { CAT_CONFIGS, createCatFromConfig } from '../config';
import { createTimeState } from './time-system';
import { createEventLogState } from './event-log';
import { createWeatherState } from './weather-system';

function initCats() {
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
  const toys = createDefaultToys();

  const cats = initCats();
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
    house,
    tileMap,
    cats,
    shelters,
    catBeds,
    furnitures,
    toys,
    solidObjects,
    time,
    weather,
    eventLog,
  };
}
