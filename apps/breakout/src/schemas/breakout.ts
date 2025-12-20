import { z } from 'zod';

/**
 * 2Dベクトル（位置・速度に使用）
 */
export const Vector2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Vector2D = z.infer<typeof Vector2DSchema>;

/**
 * パドル（プレイヤー操作）
 */
export const PaddleSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type Paddle = z.infer<typeof PaddleSchema>;

/**
 * ボール
 */
export const BallSchema = z.object({
  x: z.number(),
  y: z.number(),
  radius: z.number(),
  velocity: Vector2DSchema,
});
export type Ball = z.infer<typeof BallSchema>;

/**
 * ブロックの状態
 */
export const BrickSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string(),
  destroyed: z.boolean(),
  row: z.number(),
});
export type Brick = z.infer<typeof BrickSchema>;

/**
 * ゲーム状態
 */
export const GameStateSchema = z.enum([
  'ready',
  'playing',
  'paused',
  'gameOver',
  'victory',
]);
export type GameState = z.infer<typeof GameStateSchema>;

/**
 * ゲーム設定（モバイルファースト縦長レイアウト）
 * @description 400x640 の縦長キャンバスでスマホ縦持ちに最適化
 */
export const GameConfigSchema = z.object({
  /** キャンバス幅（モバイル向け400px） */
  canvasWidth: z.number().default(400),
  /** キャンバス高さ（縦長640px） */
  canvasHeight: z.number().default(640),
  /** パドル幅（大きめで操作しやすく） */
  paddleWidth: z.number().default(100),
  /** パドル高さ */
  paddleHeight: z.number().default(12),
  /** パドル移動速度 */
  paddleSpeed: z.number().default(8),
  /** ボール半径 */
  ballRadius: z.number().default(8),
  /** ボール初速（遊びやすい速度） */
  ballSpeed: z.number().default(4),
  /** ブロック行数 */
  brickRows: z.number().default(6),
  /** ブロック列数（縦長なので6列） */
  brickCols: z.number().default(6),
  /** ブロック間パディング */
  brickPadding: z.number().default(4),
  /** ブロック幅（(400-44-20)/6≈56） */
  brickWidth: z.number().default(56),
  /** ブロック高さ */
  brickHeight: z.number().default(20),
  /** ブロック上端オフセット */
  brickOffsetTop: z.number().default(50),
  /** ブロック左端オフセット */
  brickOffsetLeft: z.number().default(22),
  /** 初期ライフ数（余裕を持って） */
  lives: z.number().default(5),
});
export type GameConfig = z.infer<typeof GameConfigSchema>;

/**
 * ブロック崩しゲーム全体の状態
 */
export const BreakoutGameSchema = z.object({
  paddle: PaddleSchema,
  ball: BallSchema,
  bricks: z.array(BrickSchema),
  score: z.number(),
  lives: z.number(),
  level: z.number(),
  state: GameStateSchema,
  config: GameConfigSchema,
});
export type BreakoutGame = z.infer<typeof BreakoutGameSchema>;
