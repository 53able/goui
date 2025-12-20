/**
 * アイテム関連の定数
 * @description アイテムの色、アイコン、効果名などの設定
 */

import type { ItemType } from '@/schemas/breakout';
import type { RGB } from '../types/index.js';

/**
 * アイテムの色設定
 */
export const ITEM_COLORS: Record<ItemType, RGB> = {
  expandPaddle: { r: 50, g: 150, b: 255 }, // 🔲 青
  shrinkPaddle: { r: 180, g: 50, b: 255 }, // 🔹 紫
  piercingBall: { r: 255, g: 100, b: 50 }, // 🔥 オレンジレッド
  slowBall: { r: 50, g: 220, b: 100 }, // 🐢 緑
  extraLife: { r: 255, g: 100, b: 150 }, // 💖 ピンク
  speedUp: { r: 255, g: 220, b: 50 }, // ⚡ 黄色
  multiBall: { r: 100, g: 200, b: 255 }, // 🎱 水色
};

/**
 * アイテムのアイコン（絵文字で一目瞭然！）
 */
export const ITEM_ICONS: Record<ItemType, string> = {
  expandPaddle: '🔲', // パドル拡張
  shrinkPaddle: '🔹', // パドル縮小
  piercingBall: '🔥', // 貫通ボール
  slowBall: '🐢', // スローボール
  extraLife: '💖', // ライフ+1
  speedUp: '⚡', // スピードアップ
  multiBall: '🎱', // マルチボール
};

/**
 * アイテムの効果名（日本語表示用）
 */
export const ITEM_NAMES: Record<ItemType, string> = {
  expandPaddle: 'パドル拡張！',
  shrinkPaddle: 'パドル縮小...',
  piercingBall: '貫通ボール！',
  slowBall: 'スローダウン',
  extraLife: 'ライフ+1！',
  speedUp: 'スピードアップ！',
  multiBall: 'マルチボール！',
};
