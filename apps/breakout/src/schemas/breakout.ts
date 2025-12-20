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
 * アイテムの種類
 * @description ブロック破壊時にランダムドロップ
 */
export const ItemTypeSchema = z.enum([
  'expandPaddle', // 🔲 パドル拡張（1.5倍）
  'shrinkPaddle', // 🔹 パドル縮小（0.7倍）
  'piercingBall', // 🔥 貫通ボール
  'slowBall', // 🐢 スローボール
  'extraLife', // 💖 ライフ+1
  'speedUp', // ⚡ スピードアップ
  'multiBall', // 🎱 マルチボール（+2個）
]);
export type ItemType = z.infer<typeof ItemTypeSchema>;

/**
 * ドロップアイテム
 * @description ブロック破壊時に出現、パドルでキャッチ
 */
export const ItemSchema = z.object({
  /** アイテムID */
  id: z.string(),
  /** X座標（中心） */
  x: z.number(),
  /** Y座標（中心） */
  y: z.number(),
  /** アイテムの種類 */
  type: ItemTypeSchema,
  /** 落下速度 */
  speed: z.number().default(2),
  /** サイズ（半径） */
  size: z.number().default(12),
});
export type Item = z.infer<typeof ItemSchema>;

/**
 * アクティブなパワーアップ効果
 * @description 時間制限付きの効果を管理
 */
export const PowerUpSchema = z.object({
  /** 効果の種類 */
  type: ItemTypeSchema,
  /** 残り時間（フレーム数） */
  remainingTime: z.number(),
  /** 最大時間（フレーム数） */
  maxTime: z.number(),
});
export type PowerUp = z.infer<typeof PowerUpSchema>;

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
  'ready', // 発射待ち
  'playing', // プレイ中
  'paused', // 一時停止
  'levelClear', // レベルクリア（次レベルへ進む準備）
  'gameOver', // ゲームオーバー
  'victory', // 全レベルクリア（最終勝利）
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
  /** ブロック行数（増量！） */
  brickRows: z.number().default(8),
  /** ブロック列数（8列に増量！） */
  brickCols: z.number().default(8),
  /** ブロック間パディング */
  brickPadding: z.number().default(3),
  /** ブロック幅（(400-20-24)/8≈44） */
  brickWidth: z.number().default(44),
  /** ブロック高さ */
  brickHeight: z.number().default(18),
  /** ブロック上端オフセット */
  brickOffsetTop: z.number().default(40),
  /** ブロック左端オフセット */
  brickOffsetLeft: z.number().default(10),
  /** 初期ライフ数（余裕を持って） */
  lives: z.number().default(5),
});
export type GameConfig = z.infer<typeof GameConfigSchema>;

/**
 * ブロック崩しゲーム全体の状態
 */
export const BreakoutGameSchema = z.object({
  paddle: PaddleSchema,
  /** メインボール */
  ball: BallSchema,
  /** マルチボール時の追加ボール */
  extraBalls: z.array(BallSchema),
  bricks: z.array(BrickSchema),
  /** ドロップ中のアイテム */
  items: z.array(ItemSchema),
  /** アクティブなパワーアップ効果 */
  powerUps: z.array(PowerUpSchema),
  score: z.number(),
  lives: z.number(),
  level: z.number(),
  state: GameStateSchema,
  config: GameConfigSchema,
});
export type BreakoutGame = z.infer<typeof BreakoutGameSchema>;

/**
 * ハイスコアエントリ
 * @description ローカルストレージに保存されるスコア記録
 */
export const HighScoreEntrySchema = z.object({
  /** スコア */
  score: z.number(),
  /** 到達レベル */
  level: z.number(),
  /** 記録日時（ISO文字列） */
  date: z.string(),
});
export type HighScoreEntry = z.infer<typeof HighScoreEntrySchema>;

/**
 * ハイスコアデータ
 * @description 上位10件のスコアを保存
 */
export const HighScoreDataSchema = z.object({
  /** スコア一覧（降順ソート済み） */
  scores: z.array(HighScoreEntrySchema).max(10),
});
export type HighScoreData = z.infer<typeof HighScoreDataSchema>;
