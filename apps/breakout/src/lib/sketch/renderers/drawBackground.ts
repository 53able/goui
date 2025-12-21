/**
 * 背景描画モジュール 🎄 クリスマス仕様
 * @description 冬の夜空、雪の結晶、イルミネーションなど
 */

import type { P5Instance } from '@/components/P5Canvas';
import type {
  ChristmasLight,
  GlitchState,
  Scanline,
  Snowflake,
  Star,
} from '../types/index.js';

/**
 * 背景の星を描画・更新（遠くの星空）
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
    star.z += 0.5; // ゆっくり流れる
    if (star.z > 0) {
      star.z = -500;
      star.x = p.random(-canvasWidth, canvasWidth);
      star.y = p.random(-canvasHeight, canvasHeight);
    }

    p.push();
    p.translate(star.x, star.y, star.z);
    p.noStroke();
    const alpha = p.map(star.z, -500, 0, 30, 180);
    p.fill(255, 255, 240, alpha); // 暖かい白
    p.sphere(star.size);
    p.pop();
  }
  p.pop();
};

/**
 * 雪の結晶を描画・更新 ❄️
 */
export const drawSnowflakes = (
  p: P5Instance,
  snowflakes: Snowflake[],
  canvasWidth: number,
  canvasHeight: number,
  time: number,
): void => {
  for (const snow of snowflakes) {
    // 落下と揺れ
    snow.y += snow.fallSpeed;
    snow.x += Math.sin(time * snow.swaySpeed + snow.swayOffset) * 0.4;
    snow.rotation += snow.rotationSpeed;

    // 画面下に出たらリセット
    if (snow.y > canvasHeight / 2 + 50) {
      snow.y = -canvasHeight / 2 - p.random(50, 150);
      snow.x = p.random(-canvasWidth / 2, canvasWidth / 2);
    }

    // 奥行きによる透明度
    const baseAlpha = p.map(snow.z, -400, -50, 40, 150);
    const sparkle = Math.sin(time * 3 + snow.sparklePhase) * 0.3 + 0.7;
    const alpha = baseAlpha * sparkle;

    p.push();
    p.translate(snow.x, snow.y, snow.z);
    p.rotateZ(snow.rotation);

    if (snow.type === 'dot') {
      // 小さな点
      p.noStroke();
      p.fill(255, 255, 255, alpha);
      p.ellipse(0, 0, snow.size, snow.size);
    } else if (snow.type === 'hex') {
      // 六角形
      p.noStroke();
      p.fill(240, 248, 255, alpha);
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * p.TWO_PI;
        p.vertex(Math.cos(angle) * snow.size, Math.sin(angle) * snow.size);
      }
      p.endShape(p.CLOSE);
    } else {
      // 結晶（六芒星風）
      p.stroke(220, 240, 255, alpha);
      p.strokeWeight(1);
      p.noFill();

      for (let i = 0; i < 6; i++) {
        const armAngle = (i / 6) * p.TWO_PI;
        const armLength = snow.size;
        const endX = Math.cos(armAngle) * armLength;
        const endY = Math.sin(armAngle) * armLength;

        p.line(0, 0, endX, endY);

        // 小さな枝
        const branchPos = 0.6;
        const branchLen = armLength * 0.35;
        const midX = endX * branchPos;
        const midY = endY * branchPos;

        p.line(
          midX,
          midY,
          midX + Math.cos(armAngle + 0.7) * branchLen,
          midY + Math.sin(armAngle + 0.7) * branchLen,
        );
        p.line(
          midX,
          midY,
          midX + Math.cos(armAngle - 0.7) * branchLen,
          midY + Math.sin(armAngle - 0.7) * branchLen,
        );
      }

      // 中心の輝き
      p.noStroke();
      p.fill(255, 255, 255, alpha * 0.8);
      p.ellipse(0, 0, 2, 2);
    }

    p.pop();
  }
};

/**
 * イルミネーションライトを描画 💡
 */
export const drawChristmasLights = (
  p: P5Instance,
  lights: ChristmasLight[],
  canvasHeight: number,
  time: number,
): void => {
  for (const light of lights) {
    const pulseAlpha = 150 + Math.sin(time * 3 + light.phase) * 105;
    const glowSize = light.size * (1 + Math.sin(time * 2 + light.phase) * 0.2);

    // グロー
    p.push();
    p.translate(light.x, light.y, 10);
    p.noStroke();
    p.fill(light.color.r, light.color.g, light.color.b, pulseAlpha * 0.3);
    p.sphere(glowSize * 2);
    p.pop();

    // ライト本体
    p.push();
    p.translate(light.x, light.y, 15);
    p.noStroke();
    p.fill(light.color.r, light.color.g, light.color.b, pulseAlpha);
    p.sphere(glowSize);
    p.pop();

    // 吊り下げ線
    p.push();
    p.stroke(100, 100, 100, 100);
    p.strokeWeight(1);
    p.line(light.x, -canvasHeight / 2, 5, light.x, light.y - light.size, 5);
    p.pop();
  }
};

/**
 * 遠くの雪山（地平線グラデーション）を描画 🏔️
 * @param p - p5インスタンス
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 */
export const drawSnowMountains = (
  p: P5Instance,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  p.push();
  p.translate(0, canvasHeight / 2 - 30, -200);
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    p.fill(40 + i * 10, 50 + i * 10, 80 + i * 5, 150 - i * 25);
    p.plane(canvasWidth * 2, 40);
    p.translate(0, -20, 10);
  }
  p.pop();
};

/**
 * スキャンライン（控えめなきらめき効果）を描画
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
  // クリスマス版では控えめに
  if (glitch.intensity <= 0.05) return;

  for (const line of scanlines) {
    line.y += line.speed;
    if (line.y > canvasHeight) {
      line.y = 0;
    }
    const ly = line.y - canvasHeight / 2;
    p.push();
    p.translate(0, ly, 50);
    p.noStroke();
    p.fill(255, 215, 0, line.alpha * glitch.intensity * 150); // 金色に
    p.plane(canvasWidth, 2);
    p.pop();
  }
};

/**
 * 背景全体を描画 🎄 クリスマス仕様
 * @param p - p5インスタンス
 * @param stars - 星の配列
 * @param scanlines - スキャンラインの配列
 * @param snowflakes - 雪の結晶の配列
 * @param christmasLights - イルミネーションの配列
 * @param glitch - グリッチ状態
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 * @param time - 現在時間（アニメーション用）
 */
export const drawBackground = (
  p: P5Instance,
  stars: Star[],
  scanlines: Scanline[],
  snowflakes: Snowflake[],
  christmasLights: ChristmasLight[],
  glitch: GlitchState,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
): void => {
  // 背景色（冬の夜空）🌃
  p.background(15, 25, 45);

  // スキャンライン（控えめに）
  drawScanlines(p, scanlines, glitch, canvasWidth, canvasHeight);

  // 遠くの雪山
  drawSnowMountains(p, canvasWidth, canvasHeight);

  // 星（控えめに）
  drawStars(p, stars, canvasWidth, canvasHeight);

  // イルミネーションライト 💡
  drawChristmasLights(p, christmasLights, canvasHeight, time);

  // 雪の結晶 ❄️
  drawSnowflakes(p, snowflakes, canvasWidth, canvasHeight, time);
};
