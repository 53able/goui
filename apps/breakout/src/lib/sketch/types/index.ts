/**
 * p5.js スケッチ用型定義
 * @description breakoutSketch.ts で使用するエフェクト・描画用の型
 */

import type { ItemType } from '@/schemas/breakout';

/**
 * RGB色
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 3D座標
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * パーティクル（3D破片）
 */
export interface Particle3D {
  pos: Vector3D;
  vel: Vector3D;
  color: RGB;
  size: number;
  rotSpeed: Vector3D;
  rotation: Vector3D;
  life: number;
}

/**
 * 衝撃波エフェクト
 */
export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: RGB;
}

/**
 * スコアポップアップ
 */
export interface ScorePopup {
  x: number;
  y: number;
  score: number;
  combo: number;
  life: number;
  scale: number;
}

/**
 * トレイルポイント
 */
export interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

/**
 * 背景星
 */
export interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

/**
 * スキャンライン
 */
export interface Scanline {
  y: number;
  speed: number;
  alpha: number;
}

/**
 * 雪の結晶 ❄️ クリスマス仕様
 */
export interface Snowflake {
  x: number;
  y: number;
  z: number;
  size: number;
  rotationSpeed: number;
  rotation: number;
  swayOffset: number;
  swaySpeed: number;
  fallSpeed: number;
  /** 雪の種類: dot=小さな点, hex=六角形, crystal=結晶 */
  type: 'dot' | 'hex' | 'crystal';
  /** キラキラの位相 */
  sparklePhase: number;
}

/**
 * イルミネーションライト 💡 クリスマス仕様
 */
export interface ChristmasLight {
  x: number;
  y: number;
  color: RGB;
  phase: number;
  size: number;
}

/**
 * アイテム収集エフェクト（画面中央に効果名表示）
 */
export interface ItemCollectEffect {
  type: ItemType;
  life: number;
  scale: number;
}

/**
 * ボール出現演出タイプ 🎄 クリスマス仕様
 * - star: 星が集まってオーナメント形成 ⭐
 * - snow: 雪が渦を巻いて形成 ❄️
 * - bell: ベルの音と共に出現 🔔
 */
export type SpawnEffectType = 'star' | 'snow' | 'bell';

/**
 * ボール出現演出の状態 🎄 クリスマス仕様
 */
export interface BallSpawnEffect {
  /** 演出タイプ */
  type: SpawnEffectType;
  /** 進行度（0〜1） */
  progress: number;
  /** ボール位置 */
  ballX: number;
  ballY: number;
  /** 星が集まる軌跡用ポイント（starタイプ用） */
  starPoints: Array<{ x: number; y: number; angle: number }>;
  /** 演出が完了したか */
  completed: boolean;
}

/**
 * 画面シェイク状態
 */
export interface ShakeState {
  x: number;
  y: number;
  intensity: number;
}

/**
 * グリッチエフェクト状態
 */
export interface GlitchState {
  intensity: number;
  chromatic: number;
}

/**
 * コンボ追跡状態
 */
export interface ComboState {
  count: number;
  lastHitTime: number;
}

/**
 * エフェクトマネージャーの状態 🎄 クリスマス仕様
 */
export interface EffectState {
  particles: Particle3D[];
  shockwaves: Shockwave[];
  scorePopups: ScorePopup[];
  trail: TrailPoint[];
  stars: Star[];
  scanlines: Scanline[];
  /** 雪の結晶 ❄️ */
  snowflakes: Snowflake[];
  /** イルミネーションライト 💡 */
  christmasLights: ChristmasLight[];
  itemCollectEffects: ItemCollectEffect[];
  shake: ShakeState;
  glitch: GlitchState;
  combo: ComboState;
  ballSpawnEffect: BallSpawnEffect | null;
}
