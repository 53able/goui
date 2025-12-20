/**
 * エフェクトマネージャー
 * @description パーティクル、衝撃波、ボール出現演出などを一元管理
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { ItemType } from '@/schemas/breakout';
import type {
  EffectState,
  ItemCollectEffect,
  Particle3D,
  Scanline,
  ScorePopup,
  Shockwave,
  SpawnEffectType,
  Star,
  TrailPoint,
} from '../types/index.js';
import { parseHslColor } from '../utils/colorUtils.js';
import { toWebGL } from '../utils/webglUtils.js';

/**
 * エフェクト状態を初期化
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
  // 背景の星を生成
  const stars: Star[] = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: p.random(-canvasWidth, canvasWidth),
      y: p.random(-canvasHeight, canvasHeight),
      z: p.random(-500, 0),
      size: p.random(1, 3),
    });
  }

  // スキャンラインを生成
  const scanlines: Scanline[] = [];
  for (let i = 0; i < 5; i++) {
    scanlines.push({
      y: p.random(canvasHeight),
      speed: p.random(2, 5),
      alpha: p.random(0.02, 0.08),
    });
  }

  return {
    particles: [],
    shockwaves: [],
    scorePopups: [],
    trail: [],
    stars,
    scanlines,
    itemCollectEffects: [],
    shake: { x: 0, y: 0, intensity: 0 },
    glitch: { intensity: 0, chromatic: 0 },
    combo: { count: 0, lastHitTime: 0 },
    ballSpawnEffect: null,
  };
};

/**
 * パーティクル爆発を生成
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
  for (let i = 0; i < count; i++) {
    const angle = p.random(p.TWO_PI);
    const speed = p.random(2, 8);
    const particle: Particle3D = {
      pos: { x, y, z: p.random(-20, 20) },
      vel: {
        x: p.cos(angle) * speed,
        y: p.sin(angle) * speed,
        z: p.random(-3, 3),
      },
      color: rgb,
      size: p.random(4, 12),
      rotSpeed: {
        x: p.random(-0.2, 0.2),
        y: p.random(-0.2, 0.2),
        z: p.random(-0.2, 0.2),
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
 */
export const spawnShockwave = (
  shockwaves: Shockwave[],
  x: number,
  y: number,
  colorStr: string,
): void => {
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
 */
export const spawnScorePopup = (
  scorePopups: ScorePopup[],
  x: number,
  y: number,
  score: number,
  comboCount: number,
): void => {
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
 * ボール出現演出を開始
 */
export const startBallSpawnEffect = (
  state: EffectState,
  ballX: number,
  ballY: number,
): void => {
  const spawnEffectTypes: SpawnEffectType[] = ['beam', 'impact', 'lightning'];
  const effectType =
    spawnEffectTypes[Math.floor(Math.random() * spawnEffectTypes.length)];

  // 稲妻用のジグザグポイント生成
  const lightningPoints: Array<{ x: number; y: number }> = [];
  if (effectType === 'lightning') {
    const segments = 8;
    const startY = ballY - 300;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const offsetX =
        i === 0 || i === segments ? 0 : (Math.random() - 0.5) * 60;
      lightningPoints.push({
        x: ballX + offsetX,
        y: startY + (ballY - startY) * t,
      });
    }
  }

  state.ballSpawnEffect = {
    type: effectType,
    progress: 0,
    ballX,
    ballY,
    lightningPoints,
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
 */
export const addTrailPoint = (
  trail: TrailPoint[],
  x: number,
  y: number,
  maxTrail: number,
): void => {
  trail.push({ x, y, life: 1 });
  while (trail.length > maxTrail) {
    trail.shift();
  }
};

/**
 * パーティクルを描画・更新
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
    particle.vel.y += 0.15; // 重力
    particle.rotation.x += particle.rotSpeed.x;
    particle.rotation.y += particle.rotSpeed.y;
    particle.rotation.z += particle.rotSpeed.z;
    particle.life -= 0.02;
    particle.size *= 0.98;

    if (particle.life <= 0) {
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
    p.rotateX(particle.rotation.x);
    p.rotateY(particle.rotation.y);
    p.rotateZ(particle.rotation.z);

    p.fill(
      particle.color.r,
      particle.color.g,
      particle.color.b,
      particle.life * 255,
    );
    p.noStroke();
    p.box(particle.size);

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
 */
export const drawTrail = (
  p: P5Instance,
  trail: TrailPoint[],
  ballRadius: number,
  glitchChromatic: number,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    t.life -= 0.07;
    if (t.life <= 0) continue;

    const [tx, ty] = toWebGL(t.x, t.y, canvasWidth, canvasHeight);

    // 色収差（RGB分離）
    const chromOffset = glitchChromatic * 2;
    if (chromOffset > 0.1) {
      // 赤オレンジ
      p.push();
      p.translate(tx - chromOffset, ty, 5);
      p.noStroke();
      p.fill(255, 100, 50, t.life * 100);
      p.sphere(ballRadius * t.life * 1.2);
      p.pop();
      // 黄緑
      p.push();
      p.translate(tx + chromOffset, ty, 5);
      p.noStroke();
      p.fill(200, 255, 50, t.life * 100);
      p.sphere(ballRadius * t.life * 1.2);
      p.pop();
    }

    p.push();
    p.translate(tx, ty, 10);
    p.noStroke();
    p.fill(255, 200, 50, t.life * 180); // 黄色系トレイル
    p.sphere(ballRadius * t.life);
    p.pop();
  }

  // トレイルクリーンアップ
  for (let i = trail.length - 1; i >= 0; i--) {
    if (trail[i].life <= 0) trail.splice(i, 1);
  }
};
