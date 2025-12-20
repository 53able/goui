/**
 * UI描画モジュール 🎄 クリスマス仕様
 * @description 2DオーバーレイUI（スコアポップアップ、コンボ、パワーアップなど）
 */

import type { P5Instance } from '@/components/P5Canvas';
import type { GameState, Item, PowerUp } from '@/schemas/breakout';
import type {
  ComboState,
  GlitchState,
  ItemCollectEffect,
  ScorePopup,
} from '../types/index.js';
import { ITEM_COLORS, ITEM_ICONS, ITEM_NAMES } from '../utils/itemConstants.js';

/**
 * グリッチノイズラインを描画
 */
export const drawGlitchNoise = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  glitch: GlitchState,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  if (glitch.intensity > 0.1 && p.random() > 0.7) {
    const noiseY = p.random(canvasHeight);
    const noiseH = p.random(2, 10);
    buffer.fill(255, 255, 255, glitch.intensity * 50);
    buffer.noStroke();
    buffer.rect(0, noiseY, canvasWidth, noiseH);
  }
};

/**
 * ドロップアイテムのアイコンを描画
 */
export const drawItemIcons = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  items: Item[],
  time: number,
): void => {
  for (const item of items) {
    const bobOffset = p.sin(time * 4 + item.x * 0.1) * 3;
    const itemColor = ITEM_COLORS[item.type];
    const icon = ITEM_ICONS[item.type];
    const pulseScale = 1 + p.sin(time * 6) * 0.1;

    buffer.push();
    buffer.translate(item.x, item.y + bobOffset);

    // 背景の円（色付き）
    buffer.noStroke();
    buffer.fill(itemColor.r, itemColor.g, itemColor.b, 180);
    buffer.ellipse(
      0,
      0,
      item.size * 2.8 * pulseScale,
      item.size * 2.8 * pulseScale,
    );

    // 白いリング
    buffer.noFill();
    buffer.stroke(255, 255, 255, 200);
    buffer.strokeWeight(2);
    buffer.ellipse(
      0,
      0,
      item.size * 3.2 * pulseScale,
      item.size * 3.2 * pulseScale,
    );

    // アイコン（大きく表示）
    buffer.noStroke();
    buffer.textSize(20);
    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.fill(255, 255, 255);
    buffer.text(icon, 0, 1);

    buffer.pop();
  }
};

/**
 * スコアポップアップを描画・更新 🎄
 */
export const drawScorePopups = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  scorePopups: ScorePopup[],
): void => {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const popup = scorePopups[i];
    popup.y -= 1.5;
    popup.life -= 0.02;
    popup.scale = p.min(popup.scale + 0.15, 1);

    if (popup.life <= 0) {
      scorePopups.splice(i, 1);
      continue;
    }

    buffer.push();
    buffer.translate(popup.x, popup.y);
    buffer.scale(popup.scale);

    const fontSize = 14 + popup.combo * 3;
    buffer.textSize(fontSize);
    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.textStyle(p.BOLD);

    // クリスマスゴールド ⭐
    buffer.fill(255, 215, 0, popup.life * 255);

    const text =
      popup.combo > 1
        ? `+${popup.score * popup.combo} ⭐x${popup.combo}!`
        : `+${popup.score}`;
    buffer.text(text, 0, 0);

    buffer.pop();
  }
};

/**
 * コンボ表示を描画 🌟
 */
export const drawComboDisplay = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  combo: ComboState,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  if (combo.count <= 1 || Date.now() - combo.lastHitTime >= 2000) return;

  buffer.push();
  buffer.textSize(24);
  buffer.textAlign(p.CENTER, p.CENTER);
  buffer.textStyle(p.BOLD);

  // クリスマスゴールド ⭐
  buffer.fill(255, 215, 0);

  buffer.text(`⭐ ${combo.count} COMBO! ⭐`, canvasWidth / 2, canvasHeight - 90);

  buffer.pop();
};

/**
 * パワーアップステータスを描画
 */
export const drawPowerUpStatus = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  powerUps: PowerUp[],
  canvasHeight: number,
): void => {
  if (powerUps.length === 0) return;

  buffer.push();
  buffer.textAlign(buffer.LEFT, buffer.CENTER);
  buffer.textStyle(buffer.BOLD);

  const barWidth = 60;
  const barHeight = 8;
  const startX = 10;
  const startY = canvasHeight - 25;

  for (let i = 0; i < powerUps.length; i++) {
    const pu = powerUps[i];
    const puColor = ITEM_COLORS[pu.type];
    const progress = pu.remainingTime / pu.maxTime;
    const xOffset = i * (barWidth + 15);

    // アイコン
    buffer.textSize(14);
    buffer.fill(puColor.r, puColor.g, puColor.b);
    buffer.text(ITEM_ICONS[pu.type], startX + xOffset, startY - 10);

    // バー背景
    buffer.noStroke();
    buffer.fill(50, 50, 50, 200);
    buffer.rect(startX + xOffset, startY, barWidth, barHeight, 4);

    // バー（残り時間）
    buffer.fill(puColor.r, puColor.g, puColor.b, 200);
    buffer.rect(startX + xOffset, startY, barWidth * progress, barHeight, 4);
  }

  buffer.pop();
};

/**
 * アイテム収集エフェクトを描画・更新 🎁
 */
export const drawItemCollectEffects = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  itemCollectEffects: ItemCollectEffect[],
  canvasWidth: number,
  canvasHeight: number,
): void => {
  for (let i = itemCollectEffects.length - 1; i >= 0; i--) {
    const effect = itemCollectEffects[i];
    effect.life -= 0.015;
    effect.scale = p.min(effect.scale + 0.15, 1.2);

    if (effect.life <= 0) {
      itemCollectEffects.splice(i, 1);
      continue;
    }

    const effectColor = ITEM_COLORS[effect.type];
    const icon = ITEM_ICONS[effect.type];
    const name = ITEM_NAMES[effect.type];
    const yOffset = (1 - effect.life) * -30;

    // 背景（冬の夜空風）
    buffer.push();
    buffer.noStroke();
    buffer.fill(20, 30, 50, effect.life * 180);
    buffer.rectMode(p.CENTER);
    buffer.rect(canvasWidth / 2, canvasHeight / 2 - 50 + yOffset, 220, 60, 10);
    buffer.pop();

    // アイコン
    buffer.push();
    buffer.textSize(32 * effect.scale);
    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.fill(255, 255, 255, effect.life * 255);
    buffer.text(icon, canvasWidth / 2 - 70, canvasHeight / 2 - 50 + yOffset);
    buffer.pop();

    // 効果名
    buffer.push();
    buffer.textSize(20 * effect.scale);
    buffer.textAlign(p.LEFT, p.CENTER);
    buffer.textStyle(p.BOLD);
    buffer.fill(effectColor.r, effectColor.g, effectColor.b, effect.life * 255);
    buffer.text(name, canvasWidth / 2 - 45, canvasHeight / 2 - 50 + yOffset);
    buffer.pop();
  }
};

/**
 * ゲームオーバー/勝利オーバーレイを描画 🎄
 */
export const drawGameEndOverlay = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  state: GameState,
  score: number,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  if (state !== 'gameOver' && state !== 'victory') return;

  // 冬の夜空風オーバーレイ
  buffer.fill(15, 25, 45, 220);
  buffer.rect(0, 0, canvasWidth, canvasHeight);

  const isVictory = state === 'victory';

  buffer.push();
  buffer.textAlign(p.CENTER, p.CENTER);
  buffer.textStyle(p.BOLD);
  buffer.textSize(36);

  if (isVictory) {
    buffer.fill(255, 215, 0); // 金色 ⭐
  } else {
    buffer.fill(200, 50, 50); // 赤
  }

  buffer.text(
    isVictory ? '🎄 Merry Christmas! 🎄' : '⛄ また挑戦してね！',
    canvasWidth / 2,
    canvasHeight / 2 - 50,
  );

  buffer.textSize(28);
  buffer.fill(255, 215, 0);
  buffer.text(`Score: ${score}`, canvasWidth / 2, canvasHeight / 2 + 10);

  buffer.textSize(18);
  buffer.fill(200, 230, 255);
  buffer.text('タップしてリトライ', canvasWidth / 2, canvasHeight / 2 + 60);

  buffer.pop();
};

/**
 * 一時停止オーバーレイを描画
 */
export const drawPausedOverlay = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  buffer.fill(15, 25, 45, 180);
  buffer.rect(0, 0, canvasWidth, canvasHeight);

  buffer.push();
  buffer.textAlign(p.CENTER, p.CENTER);
  buffer.textStyle(p.BOLD);
  buffer.textSize(36);
  buffer.fill(255, 215, 0); // 金色
  buffer.text('⏸ PAUSED', canvasWidth / 2, canvasHeight / 2);
  buffer.pop();
};

/**
 * 準備画面を描画 🎄
 */
export const drawReadyScreen = (
  // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
  buffer: any,
  p: P5Instance,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  buffer.push();
  buffer.textAlign(p.CENTER, p.CENTER);
  buffer.textStyle(p.BOLD);
  buffer.textSize(22);
  buffer.fill(255, 215, 0); // 金色
  buffer.text('🎄 タップしてスタート 🎄', canvasWidth / 2, canvasHeight / 2);
  buffer.pop();
};
