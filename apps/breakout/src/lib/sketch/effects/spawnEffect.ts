/**
 * ボール出現演出描画モジュール 🎄 クリスマス仕様
 * @description star, snow, bell の3種類の演出
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { BallSpawnEffect } from '../types/index.js';
import { toWebGL } from '../utils/webglUtils.js';

/**
 * STAR演出: 星が集まってオーナメント形成 ⭐
 */
const drawStarEffect = (
  p: P5Instance,
  bx: number,
  by: number,
  t: number,
  starPoints: Array<{ x: number; y: number; angle: number }>,
  ballX: number,
  ballY: number,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
): void => {
  const progress = Math.min(t * 1.5, 1);

  // 星が集まってくる
  for (let i = 0; i < starPoints.length; i++) {
    const pt = starPoints[i];
    const currentX = pt.x + (ballX - pt.x) * progress;
    const currentY = pt.y + (ballY - pt.y) * progress;
    const [sx, sy] = toWebGL(currentX, currentY, canvasWidth, canvasHeight);
    const starAlpha = (1 - progress * 0.7) * 255;

    p.push();
    p.translate(sx, sy, 20 + i * 2);
    p.rotateZ(time * 3 + i);
    p.noStroke();
    p.fill(255, 215, 0, starAlpha);
    // 星型を描画
    const starSize = 10 * (1 - progress * 0.5);
    p.beginShape();
    for (let j = 0; j < 10; j++) {
      const angle = (j / 10) * p.TWO_PI - p.HALF_PI;
      const r = j % 2 === 0 ? starSize : starSize * 0.4;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }

  // 中央の輝き
  if (t > 0.5) {
    const flashAlpha = Math.sin((t - 0.5) * 2 * Math.PI) * 255;
    p.push();
    p.translate(bx, by, 25);
    p.noStroke();
    p.fill(255, 255, 200, flashAlpha);
    p.sphere(15 * (t - 0.5) * 2);
    p.pop();
  }
};

/**
 * SNOW演出: 雪が渦を巻いて形成 ❄️
 */
const drawSnowEffect = (
  p: P5Instance,
  bx: number,
  by: number,
  t: number,
  time: number,
): void => {
  const spiralCount = 12;
  for (let i = 0; i < spiralCount; i++) {
    const spiralT = (t * 2 + i / spiralCount) % 1;
    const spiralAngle = spiralT * Math.PI * 4 + i;
    const spiralRadius = (1 - spiralT) * 80;
    const spiralX = bx + Math.cos(spiralAngle) * spiralRadius;
    const spiralY = by + Math.sin(spiralAngle) * spiralRadius;

    p.push();
    p.translate(spiralX, spiralY, 15);
    p.rotateZ(time * 2);
    p.noStroke();
    p.fill(255, 255, 255, (1 - spiralT) * 200);
    // 雪の結晶型
    for (let j = 0; j < 6; j++) {
      p.push();
      p.rotateZ((j / 6) * p.TWO_PI);
      p.rect(0, 0, 2, 8);
      p.pop();
    }
    p.pop();
  }
};

/**
 * BELL演出: ベルの音と共に出現 🔔
 */
const drawBellEffect = (
  p: P5Instance,
  bx: number,
  by: number,
  t: number,
  time: number,
): void => {
  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const ringT = Math.max(0, t - i * 0.2);
    if (ringT <= 0) continue;

    const ringProgress = Math.min(ringT * 2, 1);
    const ringRadius = ringProgress * 60;
    const ringAlpha = (1 - ringProgress) * 255;

    p.push();
    p.translate(bx, by, 15 + i * 3);
    p.noFill();
    p.stroke(255, 215, 0, ringAlpha);
    p.strokeWeight(3 - ringProgress * 2);
    p.ellipse(0, 0, ringRadius * 2, ringRadius * 2);
    p.pop();
  }

  // ベルの形
  if (t > 0.3) {
    const bellScale = Math.min((t - 0.3) * 3, 1);
    const bellSwing = Math.sin(time * 15) * 0.2 * (1 - t);

    p.push();
    p.translate(bx, by - 30 * bellScale, 25);
    p.rotateZ(bellSwing);
    p.fill(255, 215, 0, 200 * bellScale);
    p.noStroke();
    // ベル本体（簡易）
    p.ellipse(0, 0, 20 * bellScale, 25 * bellScale);
    p.rect(-3 * bellScale, 10 * bellScale, 6 * bellScale, 8 * bellScale);
    p.pop();
  }
};

/**
 * ボール出現演出を描画 🎄 クリスマス仕様
 * @param p - p5インスタンス
 * @param effect - 出現演出状態
 * @param ballX - ボールX座標（ゲーム座標）
 * @param ballY - ボールY座標（ゲーム座標）
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 * @param time - 現在時間（アニメーション用）
 */
export const drawBallSpawnEffect = (
  p: P5Instance,
  effect: BallSpawnEffect,
  ballX: number,
  ballY: number,
  canvasWidth: number,
  canvasHeight: number,
  time = 0,
): void => {
  const [bx, by] = toWebGL(ballX, ballY, canvasWidth, canvasHeight);
  const t = effect.progress;

  switch (effect.type) {
    case 'star':
      drawStarEffect(
        p,
        bx,
        by,
        t,
        effect.starPoints,
        ballX,
        ballY,
        canvasWidth,
        canvasHeight,
        time,
      );
      break;
    case 'snow':
      drawSnowEffect(p, bx, by, t, time);
      break;
    case 'bell':
      drawBellEffect(p, bx, by, t, time);
      break;
  }
};
