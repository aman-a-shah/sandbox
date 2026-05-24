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

  for (let y = boatStartRow; y < boatStartRow + boatHeight; y += 1) {
    for (let x = boatStartCol; x < boatStartCol + boatWidth; x += 1) {
      terrain[y][x] = "boat";
    }
  }

  return terrain;
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
