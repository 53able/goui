/**
 * テトリミノの種類（7種類）
 */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/**
 * 座標位置
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * テトリミノ（落下中のブロック）
 */
export interface Tetromino {
  type: TetrominoType;
  position: Position;
  rotation: number;
  shape: number[][];
}

/**
 * ゲーム状態
 */
export type GameState = 'playing' | 'paused' | 'gameOver';

/**
 * テトリスゲーム全体の状態
 */
export interface TetrisGame {
  board: number[][];
  currentPiece: Tetromino | null;
  nextPiece: Tetromino | null;
  score: number;
  level: number;
  lines: number;
  state: GameState;
  dropTime: number;
  lastTime: number;
  clearingLines: number[];
  scoreAnimation: number | null;
}
