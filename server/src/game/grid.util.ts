export const CELL_SIZE = 20;

export function getCellId(x: number, z: number): string {
  return `${Math.floor(x / CELL_SIZE)}_${Math.floor(z / CELL_SIZE)}`;
}

export function getAdjacentCellIds(cellId: string): string[] {
  const parts = cellId.split('_');
  const cx = parseInt(parts[0], 10);
  const cz = parseInt(parts[1], 10);
  const cells = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      cells.push(`${cx + dx}_${cz + dz}`);
    }
  }
  return cells;
}
