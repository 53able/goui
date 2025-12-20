/**
 * ボール出現演出描画モジュール
 * @description beam, impact, lightning の3種類の演出
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { BallSpawnEffect } from '../types/index.js';
import { toWebGL } from '../utils/webglUtils.js';

/**
 * BEAM演出: 光の柱がチャージしてボール形成
 */
const drawBeamEffect = (
  p: P5Instance,
  bx: number,
  by: number,
  t: number,
): void => {
  const chargePhase = Math.min(t * 2, 1); // 前半でチャージ
  const formPhase = Math.max(0, (t - 0.5) * 2); // 後半で収束

  // 光の柱（下から上へ）
  const beamHeight = 150 * chargePhase;
  const beamWidth = 30 - formPhase * 25;
  const beamAlpha = (1 - formPhase * 0.7) * 255;

  // ビーム本体
  p.push();
  p.translate(bx, by + beamHeight / 2, 15);
  p.noStroke();
  p.fill(255, 220, 50, beamAlpha * 0.8);
  p.box(beamWidth, beamHeight, 5);
  p.pop();

  // ビームの光芒（左右）
  p.push();
  p.translate(bx, by + beamHeight / 2, 12);
  p.noStroke();
  p.fill(255, 180, 50, beamAlpha * 0.3);
  p.box(beamWidth * 2, beamHeight, 3);
  p.pop();

  // チャージリング（ビームの根元）
  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const ringT = (t * 3 + i * 0.3) % 1;
    const ringY = by + ringT * beamHeight;
    const ringSize = 40 * (1 - ringT * 0.5) * chargePhase;
    const ringAlpha = (1 - ringT) * 200 * chargePhase;

    p.push();
    p.translate(bx, ringY - by, 20);
    p.noFill();
    p.stroke(255, 255, 200, ringAlpha);
    p.strokeWeight(3);
    p.ellipse(0, 0, ringSize, ringSize);
    p.pop();
  }

  // 形成時の輝き
  if (formPhase > 0) {
    const flashAlpha = Math.sin(formPhase * Math.PI) * 255;
    p.push();
    p.translate(bx, by, 25);
    p.noStroke();
    p.fill(255, 255, 255, flashAlpha);
    p.sphere(20 * formPhase);
    p.pop();
  }
};

/**
 * IMPACT演出: 衝撃波と共にドンと出現
 */
const drawImpactEffect = (
  p: P5Instance,
  bx: number,
  by: number,
  t: number,
): void => {
  const easeOut = 1 - (1 - t) ** 4;

  // 出現フラッシュ（最初の瞬間）
  if (t < 0.2) {
    const flashIntensity = 1 - t / 0.2;
    p.push();
    p.translate(bx, by, 30);
    p.noStroke();
    p.fill(255, 255, 255, flashIntensity * 255);
    p.sphere(50 * flashIntensity + 10);
    p.pop();
  }

  // 衝撃波リング（複数）
  const waveCount = 3;
  for (let i = 0; i < waveCount; i++) {
    const waveDelay = i * 0.15;
    const waveT = Math.max(0, t - waveDelay);
    if (waveT <= 0) continue;

    const waveProgress = Math.min(waveT * 1.5, 1);
    const waveRadius = waveProgress * 120;
    const waveAlpha = (1 - waveProgress) * 255;
    const waveThickness = 4 - waveProgress * 2;

    p.push();
    p.translate(bx, by, 18 - i * 3);
    p.noFill();
    p.stroke(255, 200, 50, waveAlpha);
    p.strokeWeight(waveThickness);
    p.ellipse(0, 0, waveRadius * 2, waveRadius * 2);
    p.pop();
  }

  // 六角形の衝撃エフェクト
  const hexProgress = easeOut;
  const hexSize = 80 * hexProgress;
  const hexAlpha = (1 - hexProgress * 0.8) * 200;
  const hexRotation = t * Math.PI * 2;

  p.push();
  p.translate(bx, by, 22);
  p.rotateZ(hexRotation);
  p.noFill();
  p.stroke(255, 220, 100, hexAlpha);
  p.strokeWeight(2);
  p.beginShape();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    p.vertex(Math.cos(angle) * hexSize, Math.sin(angle) * hexSize);
  }
  p.endShape(p.CLOSE);
  p.pop();

  // 中央の爆発コア
  const coreSize = 15 * (1 + Math.sin(t * Math.PI * 4) * 0.3);
  p.push();
  p.translate(bx, by, 25);
  p.noStroke();
  p.fill(255, 150, 50, 200 * easeOut);
  p.sphere(coreSize);
  p.pop();
};

/**
 * LIGHTNING演出: 稲妻が落ちてボール出現
 */
const drawLightningEffect = (
  p: P5Instance,
  bx: number,
  by: number,
  t: number,
  lightningPoints: Array<{ x: number; y: number }>,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  const strikePhase = Math.min(t * 3, 1); // 稲妻が落ちる
  const flashPhase = t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.7);

  // 稲妻を描画
  if (strikePhase > 0 && lightningPoints.length > 1) {
    const drawCount = Math.floor(lightningPoints.length * strikePhase);

    // メイン稲妻（太い）
    p.push();
    p.stroke(255, 255, 255, 255);
    p.strokeWeight(4);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= drawCount && i < lightningPoints.length; i++) {
      const pt = lightningPoints[i];
      const [lx, ly] = toWebGL(pt.x, pt.y, canvasWidth, canvasHeight);
      p.vertex(lx, ly, 25);
    }
    p.endShape();
    p.pop();

    // グロー稲妻（太くて薄い）
    p.push();
    p.stroke(200, 220, 255, 100);
    p.strokeWeight(12);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= drawCount && i < lightningPoints.length; i++) {
      const pt = lightningPoints[i];
      const [lx, ly] = toWebGL(pt.x, pt.y, canvasWidth, canvasHeight);
      p.vertex(lx, ly, 20);
    }
    p.endShape();
    p.pop();

    // 分岐稲妻（細い）
    if (drawCount > 2) {
      p.push();
      p.stroke(180, 200, 255, 150);
      p.strokeWeight(2);
      const branchPoint = lightningPoints[Math.floor(drawCount / 2)];
      const [bpx, bpy] = toWebGL(
        branchPoint.x,
        branchPoint.y,
        canvasWidth,
        canvasHeight,
      );
      p.line(bpx, bpy, 22, bpx + 40, bpy + 30, 22);
      p.line(bpx, bpy, 22, bpx - 35, bpy + 25, 22);
      p.pop();
    }
  }

  // 着弾フラッシュ
  if (strikePhase >= 1) {
    const impactT = (t - 0.33) / 0.67;
    const impactRadius = impactT * 60;
    const impactAlpha = (1 - impactT) * 255;

    // 白いフラッシュ
    p.push();
    p.translate(bx, by, 25);
    p.noStroke();
    p.fill(255, 255, 255, impactAlpha * flashPhase);
    p.sphere(20 + impactT * 10);
    p.pop();

    // 電撃リング
    p.push();
    p.translate(bx, by, 20);
    p.noFill();
    p.stroke(150, 200, 255, impactAlpha * 0.8);
    p.strokeWeight(3);
    p.ellipse(0, 0, impactRadius * 2, impactRadius * 2);
    p.pop();
  }
};

/**
 * ボール出現演出を描画
 * @param p - p5インスタンス
 * @param effect - 出現演出状態
 * @param ballX - ボールX座標（ゲーム座標）
 * @param ballY - ボールY座標（ゲーム座標）
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 */
export const drawBallSpawnEffect = (
  p: P5Instance,
  effect: BallSpawnEffect,
  ballX: number,
  ballY: number,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  const [bx, by] = toWebGL(ballX, ballY, canvasWidth, canvasHeight);
  const t = effect.progress;

  switch (effect.type) {
    case 'beam':
      drawBeamEffect(p, bx, by, t);
      break;
    case 'impact':
      drawImpactEffect(p, bx, by, t);
      break;
    case 'lightning':
      drawLightningEffect(
        p,
        bx,
        by,
        t,
        effect.lightningPoints,
        canvasWidth,
        canvasHeight,
      );
      break;
  }
};
