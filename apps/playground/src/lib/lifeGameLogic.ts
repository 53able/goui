import type { Grid, LifeGameConfig } from '@/schemas/lifeGame';

/**
 * 空のグリッドを生成
 * @param width - グリッドの幅
 * @param height - グリッドの高さ
 * @returns 全てfalse（死）のグリッド
 */
export const createEmptyGrid = (width: number, height: number): Grid => {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false),
  );
};

/**
 * ランダムなグリッドを生成
 * @param width - グリッドの幅
 * @param height - グリッドの高さ
 * @param density - セルの生存確率（0-1）
 * @returns ランダムに生成されたグリッド
 */
export const createRandomGrid = (
  width: number,
  height: number,
  density: number,
): Grid => {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => Math.random() < density),
  );
};

/**
 * 指定位置の周囲8マスの生きているセル数をカウント
 * @param grid - 現在のグリッド
 * @param row - 行インデックス
 * @param col - 列インデックス
 * @returns 生きている隣接セルの数（0-8）
 */
export const countNeighbors = (
  grid: Grid,
  row: number,
  col: number,
): number => {
  const height = grid.length;
  const width = grid[0].length;

  // 8方向のオフセット
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ] as const;

  return directions.reduce((count, [dr, dc]) => {
    // トーラス（端が反対側につながる）で計算
    const newRow = (row + dr + height) % height;
    const newCol = (col + dc + width) % width;
    return count + (grid[newRow][newCol] ? 1 : 0);
  }, 0);
};

/**
 * 次の世代のグリッドを計算
 *
 * Conway's Game of Life のルール:
 * 1. 生きているセルの周囲に生きているセルが2つか3つあれば生き続ける
 * 2. 死んでいるセルの周囲に生きているセルがちょうど3つあれば生まれる
 * 3. それ以外の場合、セルは死ぬ（過疎または過密）
 *
 * @param grid - 現在のグリッド
 * @returns 次の世代のグリッド
 */
export const computeNextGeneration = (grid: Grid): Grid => {
  const height = grid.length;
  const width = grid[0].length;

  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => {
      const neighbors = countNeighbors(grid, row, col);
      const isAlive = grid[row][col];

      // ルール適用
      if (isAlive) {
        // 生存: 隣接セルが2または3なら生き続ける
        return neighbors === 2 || neighbors === 3;
      }
      // 誕生: 隣接セルがちょうど3なら生まれる
      return neighbors === 3;
    }),
  );
};

/**
 * グリッド上のセルをトグル（生死を反転）
 * @param grid - 現在のグリッド
 * @param row - 行インデックス
 * @param col - 列インデックス
 * @returns 指定セルがトグルされた新しいグリッド
 */
export const toggleCell = (grid: Grid, row: number, col: number): Grid => {
  return grid.map((gridRow, r) =>
    gridRow.map((cell, c) => (r === row && c === col ? !cell : cell)),
  );
};

/**
 * 有名なパターン: グライダー
 * @param startRow - 開始行
 * @param startCol - 開始列
 * @returns グライダーパターンの座標配列
 */
export const getGliderPattern = (
  startRow: number,
  startCol: number,
): Array<[number, number]> => {
  return [
    [startRow, startCol + 1],
    [startRow + 1, startCol + 2],
    [startRow + 2, startCol],
    [startRow + 2, startCol + 1],
    [startRow + 2, startCol + 2],
  ];
};

/**
 * パターンをグリッドに適用
 * @param grid - 現在のグリッド
 * @param pattern - 配置するセル座標の配列
 * @returns パターンが適用された新しいグリッド
 */
export const applyPattern = (
  grid: Grid,
  pattern: Array<[number, number]>,
): Grid => {
  const height = grid.length;
  const width = grid[0].length;

  const newGrid = grid.map((row) => [...row]);

  for (const [row, col] of pattern) {
    // 範囲内なら適用
    if (row >= 0 && row < height && col >= 0 && col < width) {
      newGrid[row][col] = true;
    }
  }

  return newGrid;
};

/**
 * 設定からグリッドを初期化
 * @param config - ライフゲームの設定
 * @returns 初期化されたグリッド
 */
export const initializeGrid = (config: LifeGameConfig): Grid => {
  return createRandomGrid(config.width, config.height, config.density);
};
