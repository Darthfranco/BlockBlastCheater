
import { GridState, PieceLayout, GamePiece, SolutionStep } from '../types';
import { GRID_SIZE } from '../constants';

export const createEmptyGrid = (): GridState => 
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

export const canPlacePiece = (
  grid: GridState, 
  piece: PieceLayout, 
  row: number, 
  col: number
): boolean => {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c] === 1) {
        const targetR = row + r;
        const targetC = col + c;
        if (
          targetR < 0 || targetR >= GRID_SIZE || 
          targetC < 0 || targetC >= GRID_SIZE || 
          grid[targetR][targetC] !== null
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

export const placePiece = (
  grid: GridState, 
  piece: GamePiece, 
  row: number, 
  col: number
): GridState => {
  const newGrid = grid.map(rowArr => [...rowArr]);
  piece.layout.forEach((rowLayout, r) => {
    rowLayout.forEach((cell, c) => {
      if (cell === 1) {
        newGrid[row + r][col + c] = piece.color;
      }
    });
  });
  return newGrid;
};

export const checkAndClearLines = (grid: GridState): { newGrid: GridState; clearedCount: number } => {
  const rowsToClear = new Set<number>();
  const colsToClear = new Set<number>();

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every(cell => cell !== null)) {
      rowsToClear.add(r);
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.add(c);
  }

  if (rowsToClear.size === 0 && colsToClear.size === 0) {
    return { newGrid: grid, clearedCount: 0 };
  }

  const newGrid = grid.map((rowArr, r) => 
    rowArr.map((cell, c) => {
      if (rowsToClear.has(r) || colsToClear.has(c)) {
        return null;
      }
      return cell;
    })
  );

  return { newGrid, clearedCount: rowsToClear.size + colsToClear.size };
};

export const findSolution = (
  grid: GridState, 
  pieces: GamePiece[]
): SolutionStep[] | null => {
  if (pieces.length === 0) return [];

  // Try every piece as the next one to place
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const remaining = pieces.filter((_, idx) => idx !== i);

    // Try every valid position for this piece
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlacePiece(grid, piece.layout, r, c)) {
          // Simulate placement
          const tempGrid = placePiece(grid, piece, r, c);
          const { newGrid: clearedGrid } = checkAndClearLines(tempGrid);
          
          // Recurse
          const result = findSolution(clearedGrid, remaining);
          
          if (result !== null) {
            return [{ pieceId: piece.id, r, c, color: piece.color }, ...result];
          }
        }
      }
    }
  }

  return null;
};
