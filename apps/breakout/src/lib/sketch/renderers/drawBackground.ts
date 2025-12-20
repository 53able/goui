/**
 * 背景描画モジュール
 * @description 星、グリッド、スキャンラインなどの背景要素
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { GlitchState, Scanline, Star } from '../types/index.js';

/**
 * 背景の星を描画・更新
 * @param p - p5インスタンス
 * @param stars - 星の配列
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 */
export const drawStars = (
  p: P5Instance,
  stars: Star[],
  canvasWidth: number,
  canvasHeight: number,
): void => {
  p.push();
  for (const star of stars) {
    star.z += 1;
    if (star.z > 0) {
      star.z = -500;
      star.x = p.random(-canvasWidth, canvasWidth);
      star.y = p.random(-canvasHeight, canvasHeight);
    }

    p.push();
    p.translate(star.x, star.y, star.z);
    p.noStroke();
    const alpha = p.map(star.z, -500, 0, 50, 255);
    p.fill(180, 200, 255, alpha);
    p.sphere(star.size);
    p.pop();
  }
  p.pop();
};

/**
 * グリッド線（床）を描画
 * @param p - p5インスタンス
 * @param canvasHeight - キャンバス高さ
 */
export const drawGrid = (p: P5Instance, canvasHeight: number): void => {
  p.push();
  p.translate(0, canvasHeight / 2 - 50, -100);
  p.rotateX(p.PI / 3);
  p.stroke(0, 255, 255, 30);
  p.strokeWeight(1);
  p.noFill();
  const gridSize = 40;
  for (let gx = -200; gx <= 200; gx += gridSize) {
    p.line(gx, -200, gx, 200);
  }
  for (let gy = -200; gy <= 200; gy += gridSize) {
    p.line(-200, gy, 200, gy);
  }
  p.pop();
};

/**
 * スキャンライン（グリッチ効果）を描画
 * @param p - p5インスタンス
 * @param scanlines - スキャンラインの配列
 * @param glitch - グリッチ状態
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 */
export const drawScanlines = (
  p: P5Instance,
  scanlines: Scanline[],
  glitch: GlitchState,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  if (glitch.intensity <= 0.01) return;

  for (const line of scanlines) {
    line.y += line.speed;
    if (line.y > canvasHeight) {
      line.y = 0;
    }
    const ly = line.y - canvasHeight / 2;
    p.push();
    p.translate(0, ly, 50);
    p.noStroke();
    p.fill(255, 255, 255, line.alpha * glitch.intensity * 255);
    p.plane(canvasWidth, 2);
    p.pop();
  }
};

/**
 * 背景全体を描画
 * @param p - p5インスタンス
 * @param stars - 星の配列
 * @param scanlines - スキャンラインの配列
 * @param glitch - グリッチ状態
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 */
export const drawBackground = (
  p: P5Instance,
  stars: Star[],
  scanlines: Scanline[],
  glitch: GlitchState,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  // 背景色（深い宇宙）
  p.background(10, 15, 30);

  // スキャンライン
  drawScanlines(p, scanlines, glitch, canvasWidth, canvasHeight);

  // 星
  drawStars(p, stars, canvasWidth, canvasHeight);

  // グリッド
  drawGrid(p, canvasHeight);
};
