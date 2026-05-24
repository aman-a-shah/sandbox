import type { SceneId, TerrainGrid, TileKind } from "./types";

function createFilledTerrain(cols: number, rows: number, fill: TileKind): TerrainGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function createIslandTerrain(cols: number, rows: number, islandBlobWidth: number, islandBlobHeight: number): TerrainGrid {
  const terrain = createFilledTerrain(cols, rows, "water");
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const radiusX = islandBlobWidth / 2;
  const radiusY = islandBlobHeight / 2;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const normalizedX = (x - centerX) / radiusX;
      const normalizedY = (y - centerY) / radiusY;
      const angle = Math.atan2(normalizedY, normalizedX);
      const distance = Math.hypot(normalizedX, normalizedY);

      const blobEdge =
        0.84 +
        0.1 * Math.sin(angle * 3) +
        0.06 * Math.cos(angle * 5) +
        0.05 * Math.sin((x + y) * 0.45);

      if (distance <= blobEdge) {
        terrain[y][x] = "land";
      }
    }
  }

  return terrain;
}

export function createOceanTerrain(cols: number, rows: number, boatWidth: number, boatHeight: number): TerrainGrid {
  const terrain = createFilledTerrain(cols, rows, "water");
  const boatStartCol = Math.floor((cols - boatWidth) / 2);
  const boatStartRow = Math.floor((rows - boatHeight) / 2);
  const boatRows = [
    { startOffset: 2, endOffset: boatWidth - 2 },
    { startOffset: 1, endOffset: boatWidth - 1 },
    { startOffset: 0, endOffset: boatWidth - 1 },
    { startOffset: 0, endOffset: boatWidth - 2 },
    { startOffset: 1, endOffset: boatWidth - 3 },
  ];

  for (let rowIndex = 0; rowIndex < boatHeight; rowIndex += 1) {
    const rowShape = boatRows[rowIndex] ?? { startOffset: 0, endOffset: boatWidth - 1 };
    const y = boatStartRow + rowIndex;

    for (let x = boatStartCol + rowShape.startOffset; x <= boatStartCol + rowShape.endOffset; x += 1) {
      if (terrain[y]?.[x] !== undefined) {
        terrain[y][x] = "boat";
      }
    }
  }

  return terrain;
}

export function createRestaurantTerrain(cols: number, rows: number): TerrainGrid {
  const terrain = createFilledTerrain(cols, rows, "water");

  markTiles(terrain, "plain", 5, 8, 24, 16);
  markTiles(terrain, "plain", 24, 7, 39, 24);
  markTiles(terrain, "plain", 20, 17, 26, 26);
  markTiles(terrain, "plain", 7, 17, 14, 23);

  markTiles(terrain, "water", 5, 3, 24, 7);
  markTiles(terrain, "water", 4, 5, 8, 14);
  markTiles(terrain, "water", 9, 13, 19, 15);
  markTiles(terrain, "water", 22, 9, 24, 15);

  markTiles(terrain, "water", 25, 8, 33, 11);
  markTiles(terrain, "water", 29, 12, 31, 14);
  markTiles(terrain, "water", 35, 12, 38, 15);
  markTiles(terrain, "water", 28, 18, 36, 21);
  markTiles(terrain, "water", 37, 20, 39, 24);
  markTiles(terrain, "water", 21, 22, 26, 24);
  markTiles(terrain, "water", 9, 19, 13, 22);

  markTiles(terrain, "plain", 22, 25, 25, 26);

  return terrain;
}

export function isRestaurantInteriorTile(tileX: number, tileY: number): boolean {
  const kitchenWing = tileX >= 5 && tileX <= 23 && tileY >= 4 && tileY <= 15;
  const diningRoom = tileX >= 18 && tileX <= 38 && tileY >= 7 && tileY <= 23;
  const frontEntry = tileX >= 20 && tileX <= 25 && tileY >= 22 && tileY <= 25;
  const bayWindow = tileX >= 28 && tileX <= 35 && tileY >= 4 && tileY <= 8;
  const serviceNook = tileX >= 8 && tileX <= 14 && tileY >= 15 && tileY <= 21;

  return kitchenWing || diningRoom || frontEntry || bayWindow || serviceNook;
}

function markTiles(
  terrain: TerrainGrid,
  fill: TileKind,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  for (let y = startY; y <= endY; y += 1) {
    const row = terrain[y];
    if (!row) {
      continue;
    }

    for (let x = startX; x <= endX; x += 1) {
      if (x >= 0 && x < row.length) {
        row[x] = fill;
      }
    }
  }
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
