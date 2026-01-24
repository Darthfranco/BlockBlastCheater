
export type PieceLayout = number[][]; // 1 for filled, 0 for empty

export interface GamePiece {
  id: string;
  layout: PieceLayout;
  color: string;
}

export type GridState = (string | null)[][]; // null for empty, color string for filled

export enum AppMode {
  PLAY = 'PLAY',
  EDIT_BOARD = 'EDIT_BOARD',
  EDIT_PIECES = 'EDIT_PIECES'
}

export interface SolutionStep {
  pieceId: string;
  r: number;
  c: number;
  color: string;
}

export interface GameState {
  grid: GridState;
  tray: GamePiece[];
  mode: AppMode;
  savedScenario: {
    grid: GridState;
    tray: GamePiece[];
  } | null;
}
