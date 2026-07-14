const GRID_SIZE = 5;

function rowPositions(row: number): number[] {
  return Array.from({ length: GRID_SIZE }, (_, col) => row * GRID_SIZE + col + 1);
}

function colPositions(col: number): number[] {
  return Array.from({ length: GRID_SIZE }, (_, row) => row * GRID_SIZE + col + 1);
}

const DIAGONAL_TOP_LEFT = Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + i + 1);
const DIAGONAL_TOP_RIGHT = Array.from(
  { length: GRID_SIZE },
  (_, i) => i * GRID_SIZE + (GRID_SIZE - 1 - i) + 1
);

/** All possible bingo lines on the 5x5 board, keyed by a stable id. */
export const BINGO_LINES: { id: string; positions: number[] }[] = [
  ...Array.from({ length: GRID_SIZE }, (_, row) => ({ id: `row-${row}`, positions: rowPositions(row) })),
  ...Array.from({ length: GRID_SIZE }, (_, col) => ({ id: `col-${col}`, positions: colPositions(col) })),
  { id: "diag-tl", positions: DIAGONAL_TOP_LEFT },
  { id: "diag-tr", positions: DIAGONAL_TOP_RIGHT },
];

/** Line ids (row/column/diagonal) that are fully completed given a set of completed positions. */
export function getCompleteLineIds(completedPositions: Set<number>): string[] {
  return BINGO_LINES.filter((line) => line.positions.every((p) => completedPositions.has(p))).map(
    (line) => line.id
  );
}
