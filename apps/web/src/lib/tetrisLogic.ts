import type { Position, Tetromino, TetrominoType } from '@/schemas/tetris';

/**
 * テトリミノの形状定義（SRS: Super Rotation System準拠）
 * 各テトリミノは4x4のグリッドで表現される
 * 回転状態: 0=初期, 1=右90度, 2=180度, 3=左90度（右270度）
 */
const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  // I型: 横長の棒
  I: [
    // 0: 横向き
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 右90度回転（縦向き）
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    // 2: 180度回転（横向き）
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    // 3: 左90度回転（縦向き）
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  // O型: 正方形（回転しても形は変わらない）
  O: [
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
  ],
  // T型: T字型
  T: [
    // 0: 凸が上向き
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    // 1: 凸が右向き
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
    ],
    // 2: 凸が下向き
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
    ],
    // 3: 凸が左向き
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  // S型: S字型（SRS準拠）
  S: [
    // 0: 横向き
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 縦向き（右90度）
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
    ],
    // 2: 横向き（180度）
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
    ],
    // 3: 縦向き（左90度）
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
    ],
  ],
  // Z型: Z字型（SRS準拠）
  Z: [
    // 0: 横向き
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    // 1: 縦向き（右90度）
    [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
    ],
    // 2: 横向き（180度）
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
    ],
    // 3: 縦向き（左90度）- 状態1と同じ形状、位置が異なる
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  // J型: J字型
  J: [
    // 0: 左上にブロック
    [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    // 1: 右上にブロック
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    // 2: 右下にブロック
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
    ],
    // 3: 左下にブロック
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
    ],
  ],
  // L型: L字型
  L: [
    // 0: 右上にブロック
    [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    // 1: 右下にブロック
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
    ],
    // 2: 左下にブロック
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
    ],
    // 3: 左上にブロック
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
};

/**
 * テトリミノの色定義（0は空、1-7は各テトリミノの色）
 */
const TETROMINO_COLORS: Record<TetrominoType, number> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
};

/**
 * ボードのサイズ
 */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/**
 * ランダムなテトリミノを生成
 * 画面外（上部）から落ちてくるように初期位置を設定
 * @returns 新しいテトリミノ
 */
export const createRandomTetromino = (): Tetromino => {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const type = types[Math.floor(Math.random() * types.length)];
  const shape = TETROMINO_SHAPES[type][0];

  return {
    type,
    position: { x: Math.floor(BOARD_WIDTH / 2) - 2, y: -2 }, // 画面外から開始
    rotation: 0,
    shape,
  };
};

/**
 * テトリミノを回転
 * @param tetromino - 回転するテトリミノ
 * @returns 回転後のテトリミノ
 */
export const rotateTetromino = (tetromino: Tetromino): Tetromino => {
  const nextRotation = (tetromino.rotation + 1) % 4;
  const shape = TETROMINO_SHAPES[tetromino.type][nextRotation];

  return {
    ...tetromino,
    rotation: nextRotation,
    shape,
  };
};

/**
 * テトリミノの位置を取得（実際のボード座標）
 * @param tetromino - テトリミノ
 * @returns テトリミノが占める位置の配列
 */
export const getTetrominoPositions = (tetromino: Tetromino): Position[] => {
  const positions: Position[] = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (tetromino.shape[row]?.[col] === 1) {
        positions.push({
          x: tetromino.position.x + col,
          y: tetromino.position.y + row,
        });
      }
    }
  }

  return positions;
};

/**
 * 衝突判定
 * @param board - ゲームボード
 * @param tetromino - チェックするテトリミノ
 * @returns 衝突しているかどうか
 */
export const checkCollision = (
  board: number[][],
  tetromino: Tetromino,
): boolean => {
  const positions = getTetrominoPositions(tetromino);

  return positions.some((pos) => {
    // ボードの外側チェック
    if (pos.x < 0 || pos.x >= BOARD_WIDTH || pos.y >= BOARD_HEIGHT) {
      return true;
    }

    // 上方向はチェックしない（落下中）
    if (pos.y < 0) {
      return false;
    }

    // 既存のブロックとの衝突チェック
    return board[pos.y]?.[pos.x] !== 0;
  });
};

/**
 * テトリミノをボードに固定
 * @param board - ゲームボード
 * @param tetromino - 固定するテトリミノ
 * @returns 更新されたボード
 */
export const placeTetromino = (
  board: number[][],
  tetromino: Tetromino,
): number[][] => {
  const newBoard = board.map((row) => [...row]);
  const color = TETROMINO_COLORS[tetromino.type];
  const positions = getTetrominoPositions(tetromino);

  positions.forEach((pos) => {
    if (
      pos.y >= 0 &&
      pos.y < BOARD_HEIGHT &&
      pos.x >= 0 &&
      pos.x < BOARD_WIDTH
    ) {
      const row = newBoard[pos.y];
      if (row) {
        row[pos.x] = color;
      }
    }
  });

  return newBoard;
};

/**
 * 完成したラインを検出して削除
 * @param board - ゲームボード
 * @returns 削除されたライン数、更新されたボード、消去されたラインのインデックス
 */
export const clearLines = (
  board: number[][],
): {
  clearedLines: number;
  newBoard: number[][];
  clearedLineIndices: number[];
} => {
  const newBoard: number[][] = [];
  const clearedLineIndices: number[] = [];
  let clearedLines = 0;

  for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
    const line = board[row];
    const isFullLine = line?.every((cell) => cell !== 0) ?? false;

    if (!isFullLine && line) {
      newBoard.unshift([...line]);
    } else if (isFullLine) {
      clearedLines++;
      clearedLineIndices.push(row);
    }
  }

  // 上部に空のラインを追加
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(new Array(BOARD_WIDTH).fill(0));
  }

  return { clearedLines, newBoard, clearedLineIndices };
};

/**
 * スコア計算
 * @param lines - 消去したライン数
 * @param level - 現在のレベル
 * @returns 獲得スコア
 */
export const calculateScore = (lines: number, level: number): number => {
  const baseScores = [0, 100, 300, 500, 800];
  return (baseScores[lines] ?? 0) * (level + 1);
};

/**
 * レベル計算
 * @param lines - 消去した総ライン数
 * @returns 現在のレベル
 */
export const calculateLevel = (lines: number): number => {
  return Math.floor(lines / 10) + 1;
};

/**
 * ドロップ速度計算（ミリ秒）
 * @param level - 現在のレベル
 * @returns ドロップ間隔（ミリ秒）
 */
export const calculateDropSpeed = (level: number): number => {
  return Math.max(50, 1000 - (level - 1) * 50);
};
