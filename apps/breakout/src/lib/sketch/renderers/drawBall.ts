/**
 * ボール描画モジュール 🎄 クリスマス仕様
 * @description クリスマスオーナメント（赤＋金）として描画
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
  /** グリッチ効果の強さ（クリスマス版では控えめに使用） */
  glitchChromatic?: number;
}

/**
 * クリスマスオーナメント（ボール）を描画 🔮
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
  } = options;

  const effectiveRadius = radius * spawnScale * spawnPulse;

  // 外側のグロー（金色）✨
  p.push();
  p.translate(x, y, 15);
  p.noStroke();
  p.fill(255, 215, 0, 40 * spawnScale);
  p.sphere(effectiveRadius * 2.5);
  p.pop();

  // 中間グロー（暖かいオレンジ）
  p.push();
  p.translate(x, y, 18);
  p.noStroke();
  p.fill(255, 180, 80, 80 * spawnScale);
  p.sphere(effectiveRadius * 1.8);
  p.pop();

  // オーナメント本体（クリスマスレッド or 金）🎄
  p.push();
  p.translate(x, y, 25);
  p.noStroke();

  if (isPiercing) {
    // 貫通時は金色に輝く ⭐
    p.fill(255, 215, 0);
  } else {
    // 通常時はクリスマスレッド ❤️
    p.fill(200, 30, 30);
  }
  p.sphere(effectiveRadius);
  p.pop();

  // ハイライト（白く光る）
  p.push();
  p.translate(x - 2, y - 2, 25 + effectiveRadius * 0.7);
  p.fill(255, 255, 255, 230 * spawnScale);
  p.noStroke();
  p.sphere(effectiveRadius * 0.35);
  p.pop();

  // オーナメントのキャップ（金色）🔔
  p.push();
  p.translate(x, y - effectiveRadius - 3, 25);
  p.fill(255, 215, 0);
  p.noStroke();
  p.box(6, 6, 6);
  p.pop();

  // 装飾ライン（金色の帯）
  p.push();
  p.translate(x, y, 25);
  p.noFill();
  p.stroke(255, 215, 0, 200 * spawnScale);
  p.strokeWeight(2);
  p.rotateX(0.3);
  p.ellipse(0, 0, effectiveRadius * 2, effectiveRadius * 0.5);
  p.pop();

  // 貫通ボールエフェクト（星のオーラ）⭐
  if (isPiercing) {
    for (let i = 0; i < 6; i++) {
      const starAngle = time * 4 + i * (p.TWO_PI / 6);
      const starOffset = Math.sin(time * 8 + i) * 3;
      p.push();
      p.translate(
        x + Math.cos(starAngle) * (radius + 8 + starOffset),
        y + Math.sin(starAngle) * (radius + 8 + starOffset),
        25,
      );
      p.rotateZ(time * 3);
      p.noStroke();
      p.fill(255, 255, 200, 200);
      // 小さな星
      p.beginShape();
      for (let j = 0; j < 10; j++) {
        const a = (j / 10) * p.TWO_PI;
        const r = j % 2 === 0 ? 5 : 2;
        p.vertex(Math.cos(a) * r, Math.sin(a) * r);
      }
      p.endShape(p.CLOSE);
      p.pop();
    }
  }
};
