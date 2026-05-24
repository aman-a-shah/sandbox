import type { SceneId, TerrainGrid, TileKind } from "./types";

const ISLAND_COLLISION_MAP = `
############################################
############################################
############################################
############################################
############################################
############################################
############################################
#######################......###############
#######################.....################
#######################.....################
#######################.......##############
################%%#####........#############
##############...................###########
##############......................########
#############..............##.........######
#########..................#######...$$#####
#########..................#########.$$#####
#########....................###############
#########....................###############
#########....................###############
##########.....#####........################
######################......################
############################################
############################################
############################################
############################################
############################################
############################################
`;

const SHOP_COLLISION_MAP = `
############################################
############################################
############################################
############################################
############################........########
############################........########
############################........########
############################...........#####
##############################.........#####
#######.........###....#######.........#####
#######................##...#..........#####
#######................##..##......#...#####
#######................##.####....###..#####
#####.....##########........#.....###..#####
#####.....##########...............#...#####
#####.....##########...................#####
###################....................#####
###################....................#####
###################.........#######....#####
#####################.......#######....#####
#####################.......#######....#####
#####################..................#####
##########################.............#####
##########################.............#####
############################################
############################################
############################################
############################################
`;

const BOAT_COLLISION_MAP = `
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
###################.......##################
##################........##################
##################.......###################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
############################################
`;

function parseCollisionMapRows(mapName: string, map: string): string[] {
  const mapRows = map.trim().split("\n");
  const expectedWidth = mapRows[0]?.length ?? 0;
  if (expectedWidth === 0) {
    throw new Error(`${mapName} must contain at least one row.`);
  }

  for (const [index, row] of mapRows.entries()) {
    if (row.length !== expectedWidth) {
      throw new Error(
        `${mapName} has inconsistent row widths: row 1 is ${expectedWidth}, row ${index + 1} is ${row.length}.`,
      );
    }
  }

  return mapRows;
}

function createTerrainFromCollisionMap(
  mapName: string,
  map: string,
  cols: number,
  rows: number,
  walkableTileKind: TileKind = "plain",
): TerrainGrid {
  const mapRows = parseCollisionMapRows(mapName, map);
  if (mapRows.length !== rows) {
    throw new Error(`${mapName} row count mismatch: expected ${rows}, got ${mapRows.length}.`);
  }

  return mapRows.map((row, rowIndex) => {
    if (row.length !== cols) {
      throw new Error(
        `${mapName} column count mismatch at row ${rowIndex + 1}: expected ${cols}, got ${row.length}.`,
      );
    }

    return Array.from(row, (cell, colIndex) => {
      if (cell === "#") {
        return "water";
      }
      if (cell === "." || cell === "$" || cell === "%") {
        return walkableTileKind;
      }

      throw new Error(
        `${mapName} invalid character '${cell}' at row ${rowIndex + 1}, col ${colIndex + 1}. Allowed: '#', '.', '$', or '%'.`,
      );
    });
  });
}

function getMarkerTileRect(
  mapName: string,
  map: string,
  marker: "$" | "%",
  fallbackRect: { x: number; y: number; width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const mapRows = parseCollisionMapRows(mapName, map);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let markerCount = 0;

  for (let y = 0; y < mapRows.length; y += 1) {
    const row = mapRows[y];
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== marker) {
        continue;
      }

      markerCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (markerCount === 0) {
    return fallbackRect;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function getIslandDockInteractionTileRect(): { x: number; y: number; width: number; height: number } {
  return getMarkerTileRect("ISLAND_COLLISION_MAP", ISLAND_COLLISION_MAP, "$", { x: 28, y: 10, width: 2, height: 2 });
}

export function getIslandHouseDoorInteractionTileRect(): { x: number; y: number; width: number; height: number } {
  return getMarkerTileRect("ISLAND_COLLISION_MAP", ISLAND_COLLISION_MAP, "%", { x: 16, y: 11, width: 2, height: 1 });
}

export function createIslandTerrain(cols: number, rows: number, islandBlobWidth: number, islandBlobHeight: number): TerrainGrid {
  void islandBlobWidth;
  void islandBlobHeight;
  return createTerrainFromCollisionMap("ISLAND_COLLISION_MAP", ISLAND_COLLISION_MAP, cols, rows);
}

export function createOceanTerrain(cols: number, rows: number, boatWidth: number, boatHeight: number): TerrainGrid {
  void boatWidth;
  void boatHeight;
  return createTerrainFromCollisionMap("BOAT_COLLISION_MAP", BOAT_COLLISION_MAP, cols, rows, "boat");
}

export function createRestaurantTerrain(cols: number, rows: number): TerrainGrid {
  return createTerrainFromCollisionMap("SHOP_COLLISION_MAP", SHOP_COLLISION_MAP, cols, rows);
}

export function isRestaurantInteriorTile(tileX: number, tileY: number): boolean {
  const kitchenWing = tileX >= 5 && tileX <= 23 && tileY >= 4 && tileY <= 15;
  const diningRoom = tileX >= 18 && tileX <= 38 && tileY >= 7 && tileY <= 23;
  const frontEntry = tileX >= 20 && tileX <= 25 && tileY >= 22 && tileY <= 25;
  const bayWindow = tileX >= 28 && tileX <= 35 && tileY >= 4 && tileY <= 8;
  const serviceNook = tileX >= 8 && tileX <= 14 && tileY >= 15 && tileY <= 21;

  return kitchenWing || diningRoom || frontEntry || bayWindow || serviceNook;
}

export function getTileKind(
  sceneTerrains: Partial<Record<SceneId, TerrainGrid>>,
  sceneId: SceneId,
  tileX: number,
  tileY: number,
): TileKind {
  const terrain = sceneTerrains[sceneId];
  if (!terrain) {
    return "plain";
  }

  const row = terrain[tileY];
  if (!row || tileX < 0 || tileX >= row.length) {
    return "water";
  }

  return row[tileX];
}

export function isWalkableTile(
  sceneTerrains: Partial<Record<SceneId, TerrainGrid>>,
  sceneId: SceneId,
  tileX: number,
  tileY: number,
): boolean {
  if (!sceneTerrains[sceneId]) {
    return true;
  }

  return getTileKind(sceneTerrains, sceneId, tileX, tileY) !== "water";
}
