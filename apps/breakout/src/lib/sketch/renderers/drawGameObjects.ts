/**
 * ゲームオブジェクト描画モジュール
 * @description ブロック、パドル、アイテムの3D描画
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { Brick, Item, Paddle } from '@/schemas/breakout';
import type { GlitchState } from '../types/index.js';
import { parseHslColor } from '../utils/colorUtils.js';
import { ITEM_COLORS } from '../utils/itemConstants.js';
import { toWebGL } from '../utils/webglUtils.js';

/**
 * ブロックを描画（3Dボックス）
 */
export const drawBricks = (
  p: P5Instance,
  bricks: Brick[],
  glitch: GlitchState,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  for (const brick of bricks) {
    if (brick.destroyed) continue;

    const [bx, by] = toWebGL(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      canvasWidth,
      canvasHeight,
    );

    // グリッチ時のRGBずれ
    const chromaticOffset = glitch.chromatic * (p.random() > 0.5 ? 1 : -1);

    p.push();
    p.translate(bx + chromaticOffset * 0.5, by, 0);

    // 立体ブロック
    const brickRgb = parseHslColor(brick.color) || {
      r: 255,
      g: 255,
      b: 255,
    };
    p.fill(brickRgb.r, brickRgb.g, brickRgb.b);
    p.stroke(255, 255, 255, 100);
    p.strokeWeight(1);
    p.box(brick.width - 2, brick.height - 2, 15);

    // 上面ハイライト
    p.push();
    p.translate(0, 0, 8);
    p.fill(255, 255, 255, 80);
    p.noStroke();
    p.plane(brick.width - 6, brick.height - 6);
    p.pop();

    p.pop();
  }
};

/**
 * パドルを描画（3D）
 */
export const drawPaddle = (
  p: P5Instance,
  paddle: Paddle,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  const [px, py] = toWebGL(
    paddle.x + paddle.width / 2,
    paddle.y + paddle.height / 2,
    canvasWidth,
    canvasHeight,
  );
  p.push();
  p.translate(px, py, 0);

  // パドル本体
  p.fill(0, 255, 255);
  p.stroke(255, 255, 255, 150);
  p.strokeWeight(2);
  p.box(paddle.width, paddle.height, 12);

  // パドル装飾
  p.push();
  p.translate(0, 0, 7);
  p.fill(255, 255, 255, 100);
  p.noStroke();
  p.plane(paddle.width - 20, 3);
  p.pop();

  p.pop();
};

/**
 * ドロップアイテムを3Dで描画（光るオーブ）
 */
export const drawItems3D = (
  p: P5Instance,
  items: Item[],
  time: number,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  for (const item of items) {
    const [itemX, itemY] = toWebGL(item.x, item.y, canvasWidth, canvasHeight);
    const itemColor = ITEM_COLORS[item.type];
    const bobOffset = p.sin(time * 4 + item.x * 0.1) * 3;
    const pulseScale = 1 + p.sin(time * 6) * 0.15;

    // 外側グロー（大きく薄い）
    p.push();
    p.translate(itemX, itemY + bobOffset, 10);
    p.noStroke();
    p.fill(itemColor.r, itemColor.g, itemColor.b, 40);
    p.sphere(item.size * 2.5 * pulseScale);
    p.pop();

    // 中間グロー
    p.push();
    p.translate(itemX, itemY + bobOffset, 15);
    p.noStroke();
    p.fill(itemColor.r, itemColor.g, itemColor.b, 100);
    p.sphere(item.size * 1.6 * pulseScale);
    p.pop();

    // コア（明るい）
    p.push();
    p.translate(itemX, itemY + bobOffset, 20);
    p.noStroke();
    p.fill(
      p.min(itemColor.r + 80, 255),
      p.min(itemColor.g + 80, 255),
      p.min(itemColor.b + 80, 255),
      230,
    );
    p.sphere(item.size * 0.9);
    p.pop();

    // キラキラパーティクル（回転）
    for (let i = 0; i < 4; i++) {
      const sparkleAngle = time * 4 + i * (p.TWO_PI / 4);
      const sparkleR = item.size * 1.5;
      p.push();
      p.translate(
        itemX + p.cos(sparkleAngle) * sparkleR,
        itemY + bobOffset + p.sin(sparkleAngle) * sparkleR,
        22,
      );
      p.noStroke();
      p.fill(255, 255, 255, 180 + p.sin(time * 12 + i * 2) * 70);
      p.sphere(2.5);
      p.pop();
    }
  }
};
