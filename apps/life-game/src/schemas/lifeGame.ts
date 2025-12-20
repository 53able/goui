import { z } from 'zod';

/**
 * セルの状態（生きている or 死んでいる）
 */
export const CellStateSchema = z.boolean();
export type CellState = z.infer<typeof CellStateSchema>;

/**
 * グリッドの行
 */
export const GridRowSchema = z.array(CellStateSchema);
export type GridRow = z.infer<typeof GridRowSchema>;

/**
 * ライフゲームのグリッド（2次元配列）
 */
export const GridSchema = z.array(GridRowSchema);
export type Grid = z.infer<typeof GridSchema>;

/**
 * ライフゲームの設定
 */
export const LifeGameConfigSchema = z.object({
  /** グリッドの幅（セル数） */
  width: z.number().int().min(5).max(100).default(40),
  /** グリッドの高さ（セル数） */
  height: z.number().int().min(5).max(100).default(30),
  /** 更新間隔（ミリ秒） */
  interval: z.number().int().min(50).max(2000).default(150),
  /** 初期生成時のセル生存確率（0-1） */
  density: z.number().min(0).max(1).default(0.3),
});
export type LifeGameConfig = z.infer<typeof LifeGameConfigSchema>;

/**
 * ライフゲームの状態
 */
export const LifeGameStateSchema = z.object({
  /** 現在のグリッド */
  grid: GridSchema,
  /** 世代数 */
  generation: z.number().int().min(0),
  /** 実行中かどうか */
  isRunning: z.boolean(),
  /** 設定 */
  config: LifeGameConfigSchema,
});
export type LifeGameState = z.infer<typeof LifeGameStateSchema>;
