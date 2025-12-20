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
 * アイテム収集エフェクト（画面中央に効果名表示）
 */
export interface ItemCollectEffect {
  type: ItemType;
  life: number;
  scale: number;
}

/**
 * ボール出現演出タイプ
 * - beam: パドルから光の柱がチャージしてボール形成
 * - impact: 衝撃波と共にドンと出現
 * - lightning: 稲妻が落ちてボール出現
 */
export type SpawnEffectType = 'beam' | 'impact' | 'lightning';

/**
 * ボール出現演出の状態
 */
export interface BallSpawnEffect {
  /** 演出タイプ */
  type: SpawnEffectType;
  /** 進行度（0〜1） */
  progress: number;
  /** ボール位置 */
  ballX: number;
  ballY: number;
  /** 稲妻用のジグザグポイント */
  lightningPoints: Array<{ x: number; y: number }>;
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
 * エフェクトマネージャーの状態
 */
export interface EffectState {
  particles: Particle3D[];
  shockwaves: Shockwave[];
  scorePopups: ScorePopup[];
  trail: TrailPoint[];
  stars: Star[];
  scanlines: Scanline[];
  itemCollectEffects: ItemCollectEffect[];
  shake: ShakeState;
  glitch: GlitchState;
  combo: ComboState;
  ballSpawnEffect: BallSpawnEffect | null;
}
