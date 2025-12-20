/**
 * ボール描画モジュール
 * @description メインボールと追加ボールで共通利用
 */

import type { P5Instance } from '@/components/P5Canvas';

/**
 * ボール描画オプション
 */
export interface DrawBallOptions {
  /** 出現演出時のスケール（0-1） */
  spawnScale?: number;
  /** 出現演出時のパルス効果 */
  spawnPulse?: number;
  /** 貫通ボールエフェクトを描画するか */
  isPiercing?: boolean;
  /** 現在時間（アニメーション用） */
  time?: number;
  /** グリッチ効果の強さ */
  glitchChromatic?: number;
}

/**
 * ボールを描画（3D球体 + グロー効果）
 * メインボールと追加ボールで共通利用可能
 *
 * @param p - p5インスタンス
 * @param x - WebGL X座標
 * @param y - WebGL Y座標
 * @param radius - ボール半径
 * @param options - 描画オプション
 */
export const drawBall = (
  p: P5Instance,
  x: number,
  y: number,
  radius: number,
  options: DrawBallOptions = {},
): void => {
  const {
    spawnScale = 1,
    spawnPulse = 1,
    isPiercing = false,
    time = 0,
    glitchChromatic = 0,
  } = options;

  const effectiveRadius = radius * spawnScale * spawnPulse;

  // ボールのグロー（外側から描画）- 黄色/オレンジ系
  // 最外層グロー（大きく薄い）
  p.push();
  p.translate(x, y, 15);
  p.noStroke();
  p.fill(255, 200, 50, 40 * spawnScale);
  p.sphere(effectiveRadius * 2.5);
  p.pop();

  // 中間グロー
  p.push();
  p.translate(x, y, 18);
  p.noStroke();
  p.fill(255, 220, 80, 80 * spawnScale);
  p.sphere(effectiveRadius * 1.8);
  p.pop();

  // 内側グロー
  p.push();
  p.translate(x, y, 20);
  p.noStroke();
  p.fill(255, 240, 150, 120 * spawnScale);
  p.sphere(effectiveRadius * 1.3);
  p.pop();

  // ボールの色収差（グリッチ時）
  if (glitchChromatic > 0.5) {
    p.push();
    p.translate(x - glitchChromatic * 2, y, 22);
    p.noStroke();
    p.fill(255, 100, 50, 150);
    p.sphere(effectiveRadius * 1.1);
    p.pop();

    p.push();
    p.translate(x + glitchChromatic * 2, y, 22);
    p.noStroke();
    p.fill(255, 50, 100, 150);
    p.sphere(effectiveRadius * 1.1);
    p.pop();
  }

  // ボール本体（黄色🟡）
  p.push();
  p.translate(x, y, 25);
  p.noStroke();
  p.fill(255, 220, 50); // 鮮やかな黄色
  p.sphere(effectiveRadius);
  p.pop();

  // ボールハイライト（白く光る）
  p.push();
  p.translate(x - 2, y - 2, 25 + effectiveRadius * 0.7);
  p.fill(255, 255, 255, 230 * spawnScale);
  p.noStroke();
  p.sphere(effectiveRadius * 0.35);
  p.pop();

  // ボールリング（アウトライン効果）
  p.push();
  p.translate(x, y, 25);
  p.noFill();
  p.stroke(255, 255, 200, 200 * spawnScale);
  p.strokeWeight(2);
  p.ellipse(0, 0, effectiveRadius * 2.2, effectiveRadius * 2.2);
  p.pop();

  // 貫通ボールエフェクト（炎のオーラ）
  if (isPiercing) {
    p.push();
    p.translate(x, y, 20);
    // 炎のようなオーラ
    for (let i = 0; i < 8; i++) {
      const flameAngle = time * 5 + i * (p.TWO_PI / 8);
      const flameOffset = p.sin(time * 10 + i) * 3;
      p.push();
      p.translate(
        p.cos(flameAngle) * (radius + 5 + flameOffset),
        p.sin(flameAngle) * (radius + 5 + flameOffset),
        0,
      );
      p.noStroke();
      p.fill(255, 100 + p.sin(time * 15 + i) * 50, 50, 200);
      p.sphere(4);
      p.pop();
    }
    p.pop();
  }
};
