/**
 * ゲームオブジェクト描画モジュール 🎄 クリスマス仕様
 * @description プレゼント箱、サンタのソリ、アイテムの3D描画
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { Brick, Item, Paddle } from '@/schemas/breakout';
import type { GlitchState } from '../types/index.js';
import { parseHslColor } from '../utils/colorUtils.js';
import { ITEM_COLORS } from '../utils/itemConstants.js';
import { toWebGL } from '../utils/webglUtils.js';

/**
 * プレゼント箱（ブロック）を描画 🎁
 */
export const drawBricks = (
  p: P5Instance,
  bricks: Brick[],
  _glitch: GlitchState,
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

    const brickRgb = parseHslColor(brick.color) || {
      r: 255,
      g: 255,
      b: 255,
    };

    // 箱本体
    p.push();
    p.translate(bx, by, 0);
    p.fill(brickRgb.r, brickRgb.g, brickRgb.b);
    p.stroke(255, 255, 255, 80);
    p.strokeWeight(1);
    p.box(brick.width - 2, brick.height - 2, 18);

    // 上面ハイライト
    p.push();
    p.translate(0, 0, 10);
    p.fill(255, 255, 255, 60);
    p.noStroke();
    p.plane(brick.width - 6, brick.height - 6);
    p.pop();

    // リボン（縦）🎀
    const ribbonColor =
      brick.row % 2 === 0
        ? { r: 255, g: 215, b: 0 } // 金リボン
        : { r: 255, g: 255, b: 255 }; // 白リボン

    p.fill(ribbonColor.r, ribbonColor.g, ribbonColor.b, 230);
    p.noStroke();

    // 縦リボン
    p.push();
    p.translate(0, 0, 10);
    p.plane(6, brick.height - 2);
    p.pop();

    // 横リボン
    p.push();
    p.translate(0, 0, 10);
    p.plane(brick.width - 2, 6);
    p.pop();

    // リボンの結び目（中央の丸）
    p.push();
    p.translate(0, 0, 12);
    p.fill(ribbonColor.r, ribbonColor.g, ribbonColor.b);
    p.sphere(5);
    p.pop();

    p.pop();
  }
};

/**
 * サンタのソリ（パドル）を描画 🛷
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

  // ソリ本体（赤）
  p.fill(180, 30, 30); // 深い赤
  p.stroke(100, 20, 20);
  p.strokeWeight(2);
  p.box(paddle.width, paddle.height, 15);

  // ソリの縁取り（金色）
  p.push();
  p.translate(0, -paddle.height / 2 - 2, 0);
  p.fill(255, 215, 0);
  p.noStroke();
  p.box(paddle.width + 4, 4, 18);
  p.pop();

  // ソリのカーブ（左端）
  p.push();
  p.translate(-paddle.width / 2 - 5, 0, 0);
  p.fill(139, 69, 19); // 茶色（木）
  p.noStroke();
  p.rotateZ(0.3);
  p.box(15, 8, 12);
  p.pop();

  // ソリのカーブ（右端）
  p.push();
  p.translate(paddle.width / 2 + 5, 0, 0);
  p.fill(139, 69, 19);
  p.noStroke();
  p.rotateZ(-0.3);
  p.box(15, 8, 12);
  p.pop();

  // 装飾ライン（金）
  p.push();
  p.translate(0, 0, 9);
  p.fill(255, 215, 0, 180);
  p.noStroke();
  p.plane(paddle.width - 30, 3);
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
