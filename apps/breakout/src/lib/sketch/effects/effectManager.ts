/**
 * エフェクトマネージャー
 * @description パーティクル、衝撃波、ボール出現演出などを一元管理
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { ItemType } from '@/schemas/breakout';
import type {
  ChristmasLight,
  EffectState,
  ItemCollectEffect,
  Particle3D,
  Scanline,
  ScorePopup,
  Shockwave,
  Snowflake,
  SpawnEffectType,
  Star,
  TrailPoint,
} from '../types/index.js';
import { parseHslColor } from '../utils/colorUtils.js';
import { toWebGL } from '../utils/webglUtils.js';

/**
 * パフォーマンス制限設定
 * @description 大量エフェクト時の処理落ちを防ぐ
 */
const EFFECT_LIMITS = {
  /** パーティクル最大数 */
  maxParticles: 150,
  /** 衝撃波最大数 */
  maxShockwaves: 8,
  /** スコアポップアップ最大数 */
  maxScorePopups: 10,
  /** トレイル最大長 */
  maxTrail: 30,
  /** 1回の破壊で生成するパーティクル数上限 */
  particlesPerHit: 12,
};

/**
 * エフェクト状態を初期化 🎄 クリスマス仕様
 * @param p - p5インスタンス
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 * @returns 初期化されたエフェクト状態
 */
export const createEffectState = (
  p: P5Instance,
  canvasWidth: number,
  canvasHeight: number,
): EffectState => {
  // 背景の星を生成（控えめに）
  const stars: Star[] = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: p.random(-canvasWidth, canvasWidth),
      y: p.random(-canvasHeight, canvasHeight),
      z: p.random(-500, 0),
      size: p.random(1, 2),
    });
  }

  // スキャンラインを生成（クリスマスでは控えめに）
  const scanlines: Scanline[] = [];
  for (let i = 0; i < 3; i++) {
    scanlines.push({
      y: p.random(canvasHeight),
      speed: p.random(1, 3),
      alpha: p.random(0.01, 0.03),
    });
  }

  // 雪の結晶を生成 ❄️
  const snowflakes: Snowflake[] = [];
  for (let i = 0; i < 100; i++) {
    const typeRand = p.random();
    const snowType: 'dot' | 'hex' | 'crystal' =
      typeRand < 0.6 ? 'dot' : typeRand < 0.85 ? 'hex' : 'crystal';

    snowflakes.push({
      x: p.random(-canvasWidth / 2, canvasWidth / 2),
      y: p.random(-canvasHeight, 0),
      z: p.random(-400, -50),
      size:
        snowType === 'dot'
          ? p.random(1, 2.5)
          : snowType === 'hex'
            ? p.random(3, 5)
            : p.random(5, 8),
      rotationSpeed: p.random(-0.02, 0.02),
      rotation: p.random(p.TWO_PI),
      swayOffset: p.random(p.TWO_PI),
      swaySpeed: p.random(0.015, 0.04),
      fallSpeed:
        snowType === 'dot' ? p.random(0.3, 0.8) : p.random(0.5, 1.2),
      type: snowType,
      sparklePhase: p.random(p.TWO_PI),
    });
  }

  // イルミネーションライトを配置 💡
  const lightColors = [
    { r: 255, g: 50, b: 50 }, // 赤
    { r: 50, g: 255, b: 50 }, // 緑
    { r: 255, g: 215, b: 0 }, // 金
    { r: 100, g: 150, b: 255 }, // 青
    { r: 255, g: 100, b: 200 }, // ピンク
  ];

  const christmasLights: ChristmasLight[] = [];
  for (let i = 0; i < 20; i++) {
    christmasLights.push({
      x: (i / 19) * canvasWidth - canvasWidth / 2,
      y: -canvasHeight / 2 + 15,
      color: lightColors[i % lightColors.length],
      phase: i * 0.5,
      size: 8,
    });
  }

  return {
    particles: [],
    shockwaves: [],
    scorePopups: [],
    trail: [],
    stars,
    scanlines,
    snowflakes,
    christmasLights,
    itemCollectEffects: [],
    shake: { x: 0, y: 0, intensity: 0 },
    glitch: { intensity: 0, chromatic: 0 },
    combo: { count: 0, lastHitTime: 0 },
    ballSpawnEffect: null,
  };
};

/**
 * パーティクル爆発を生成
 * @description パフォーマンス対策: 上限を超えたら古いパーティクルを削除
 */
export const spawnParticles = (
  p: P5Instance,
  particles: Particle3D[],
  x: number,
  y: number,
  colorStr: string,
  count: number,
): void => {
  const rgb = parseHslColor(colorStr) || { r: 255, g: 255, b: 255 };

  // パーティクル数を制限
  const actualCount = Math.min(count, EFFECT_LIMITS.particlesPerHit);

  // 上限に達しそうなら古いパーティクルを削除
  const overflow =
    particles.length + actualCount - EFFECT_LIMITS.maxParticles;
  if (overflow > 0) {
    particles.splice(0, overflow);
  }

  for (let i = 0; i < actualCount; i++) {
    const angle = p.random(p.TWO_PI);
    const speed = p.random(2, 7);
    const particle: Particle3D = {
      pos: { x, y, z: p.random(-15, 15) },
      vel: {
        x: p.cos(angle) * speed,
        y: p.sin(angle) * speed,
        z: p.random(-2, 2),
      },
      color: rgb,
      size: p.random(4, 10),
      rotSpeed: {
        x: p.random(-0.15, 0.15),
        y: p.random(-0.15, 0.15),
        z: p.random(-0.15, 0.15),
      },
      rotation: {
        x: p.random(p.TWO_PI),
        y: p.random(p.TWO_PI),
        z: p.random(p.TWO_PI),
      },
      life: 1,
    };
    particles.push(particle);
  }
};

/**
 * 衝撃波を生成
 * @description パフォーマンス対策: 上限を超えたら古い衝撃波を削除
 */
export const spawnShockwave = (
  shockwaves: Shockwave[],
  x: number,
  y: number,
  colorStr: string,
): void => {
  // 上限チェック
  if (shockwaves.length >= EFFECT_LIMITS.maxShockwaves) {
    shockwaves.shift();
  }

  const rgb = parseHslColor(colorStr) || { r: 255, g: 255, b: 255 };
  shockwaves.push({
    x,
    y,
    radius: 0,
    maxRadius: 80,
    alpha: 1,
    color: rgb,
  });
};

/**
 * スコアポップアップを生成
 * @description パフォーマンス対策: 上限を超えたら古いポップアップを削除
 */
export const spawnScorePopup = (
  scorePopups: ScorePopup[],
  x: number,
  y: number,
  score: number,
  comboCount: number,
): void => {
  // 上限チェック
  if (scorePopups.length >= EFFECT_LIMITS.maxScorePopups) {
    scorePopups.shift();
  }

  scorePopups.push({
    x,
    y,
    score,
    combo: comboCount,
    life: 1,
    scale: 0,
  });
};

/**
 * アイテム収集エフェクトを生成
 */
export const spawnItemCollectEffect = (
  itemCollectEffects: ItemCollectEffect[],
  type: ItemType,
): void => {
  itemCollectEffects.push({
    type,
    life: 1,
    scale: 0,
  });
};

/**
 * 画面シェイクとグリッチを発動
 */
export const triggerShake = (state: EffectState, intensity: number): void => {
  state.shake.intensity = Math.min(intensity, 12);
  state.glitch.intensity = Math.min(intensity * 0.3, 1);
  state.glitch.chromatic = Math.min(intensity * 0.5, 3);
};

/**
 * ボール出現演出を開始 🎄 クリスマス仕様
 */
export const startBallSpawnEffect = (
  state: EffectState,
  ballX: number,
  ballY: number,
): void => {
  const spawnEffectTypes: SpawnEffectType[] = ['star', 'snow', 'bell'];
  const effectType =
    spawnEffectTypes[Math.floor(Math.random() * spawnEffectTypes.length)];

  // 星の軌跡用ポイント生成（starタイプ用）
  const starPoints: Array<{ x: number; y: number; angle: number }> = [];
  const pointCount = 8;
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const dist = 100 + Math.random() * 50;
    starPoints.push({
      x: ballX + Math.cos(angle) * dist,
      y: ballY + Math.sin(angle) * dist,
      angle,
    });
  }

  state.ballSpawnEffect = {
    type: effectType,
    progress: 0,
    ballX,
    ballY,
    starPoints,
    completed: false,
  };
};

/**
 * エフェクト状態を更新
 */
export const updateEffectState = (
  p: P5Instance,
  state: EffectState,
  deltaTime: number,
): void => {
  // 画面シェイク更新
  if (state.shake.intensity > 0) {
    state.shake.x = p.random(-1, 1) * state.shake.intensity;
    state.shake.y = p.random(-1, 1) * state.shake.intensity;
    state.shake.intensity *= 0.9;
    if (state.shake.intensity < 0.1) {
      state.shake.intensity = 0;
      state.shake.x = 0;
      state.shake.y = 0;
    }
  }

  // グリッチ減衰
  if (state.glitch.intensity > 0) {
    state.glitch.intensity *= 0.95;
    state.glitch.chromatic *= 0.95;
    if (state.glitch.intensity < 0.01) {
      state.glitch.intensity = 0;
      state.glitch.chromatic = 0;
    }
  }

  // ボール出現演出の更新
  if (state.ballSpawnEffect && !state.ballSpawnEffect.completed) {
    state.ballSpawnEffect.progress += deltaTime * 0.001 * 2.2;
    if (state.ballSpawnEffect.progress >= 1) {
      state.ballSpawnEffect.completed = true;
      state.ballSpawnEffect = null;
    }
  }
};

/**
 * トレイルを追加
 * @description パフォーマンス対策: グローバル上限を適用
 */
export const addTrailPoint = (
  trail: TrailPoint[],
  x: number,
  y: number,
  _maxTrail: number, // 旧パラメータは無視してグローバル上限を使用
): void => {
  trail.push({ x, y, life: 1 });
  while (trail.length > EFFECT_LIMITS.maxTrail) {
    trail.shift();
  }
};

/**
 * パーティクルを描画・更新
 * @description パフォーマンス最適化: box()をplane()に、回転を簡略化
 */
export const drawParticles = (
  p: P5Instance,
  particles: Particle3D[],
  canvasWidth: number,
  canvasHeight: number,
): void => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    // 物理更新
    particle.pos.x += particle.vel.x;
    particle.pos.y += particle.vel.y;
    particle.pos.z += particle.vel.z;
    particle.vel.y += 0.18; // 重力（少し強く）
    particle.rotation.z += particle.rotSpeed.z; // Z軸回転のみに簡略化
    particle.life -= 0.025; // 少し速く消える
    particle.size *= 0.97;

    if (particle.life <= 0 || particle.size < 1) {
      particles.splice(i, 1);
      continue;
    }

    const [partX, partY] = toWebGL(
      particle.pos.x,
      particle.pos.y,
      canvasWidth,
      canvasHeight,
    );

    p.push();
    p.translate(partX, partY, particle.pos.z);
    p.rotateZ(particle.rotation.z); // Z軸回転のみ

    p.fill(
      particle.color.r,
      particle.color.g,
      particle.color.b,
      particle.life * 255,
    );
    p.noStroke();
    // box()をplane()に置き換えて軽量化
    p.plane(particle.size, particle.size);

    p.pop();
  }
};

/**
 * 衝撃波を描画・更新
 */
export const drawShockwaves = (
  p: P5Instance,
  shockwaves: Shockwave[],
  canvasWidth: number,
  canvasHeight: number,
): void => {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const wave = shockwaves[i];
    wave.radius += 4;
    wave.alpha -= 0.03;

    if (wave.alpha <= 0) {
      shockwaves.splice(i, 1);
      continue;
    }

    const [wx, wy] = toWebGL(wave.x, wave.y, canvasWidth, canvasHeight);
    p.push();
    p.translate(wx, wy, 10);
    p.noFill();
    p.stroke(wave.color.r, wave.color.g, wave.color.b, wave.alpha * 255);
    p.strokeWeight(3);
    p.ellipse(0, 0, wave.radius * 2, wave.radius * 2);
    p.pop();
  }
};

/**
 * ボールトレイルを描画・更新
 * @description パフォーマンス最適化: sphere()をellipse()に置き換え
 */
export const drawTrail = (
  p: P5Instance,
  trail: TrailPoint[],
  ballRadius: number,
  glitchChromatic: number,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  // 削除対象インデックスを収集
  const toRemove: number[] = [];

  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    t.life -= 0.08; // 少し速く消える
    if (t.life <= 0) {
      toRemove.push(i);
      continue;
    }

    const [tx, ty] = toWebGL(t.x, t.y, canvasWidth, canvasHeight);
    const size = ballRadius * t.life * 2;

    // 色収差（グリッチ時のみ、描画を簡略化）
    const chromOffset = glitchChromatic * 2;
    if (chromOffset > 0.5) {
      p.push();
      p.translate(tx, ty, 5);
      p.noStroke();
      // 1つの楕円で色収差を表現（複数描画を避ける）
      p.fill(255, 150, 50, t.life * 120);
      p.ellipse(-chromOffset, 0, size * 1.1, size * 1.1);
      p.fill(200, 255, 80, t.life * 120);
      p.ellipse(chromOffset, 0, size * 1.1, size * 1.1);
      p.pop();
    }

    // メイントレイル（ellipse使用で軽量化）
    p.push();
    p.translate(tx, ty, 10);
    p.noStroke();
    p.fill(255, 200, 50, t.life * 180);
    p.ellipse(0, 0, size, size);
    p.pop();
  }

  // 後ろからspliceで削除（インデックスずれを防ぐ）
  for (let i = toRemove.length - 1; i >= 0; i--) {
    trail.splice(toRemove[i], 1);
  }
};
