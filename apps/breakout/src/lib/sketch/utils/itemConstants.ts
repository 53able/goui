/**
 * アイテム関連の定数 🎄 クリスマス仕様
 * @description アイテムの色、アイコン、効果名などの設定
 */

import type { ItemType } from '@/schemas/breakout';
import type { RGB } from '../types/index.js';

/**
 * アイテムの色設定 🎁 クリスマス仕様
 */
export const ITEM_COLORS: Record<ItemType, RGB> = {
  expandPaddle: { r: 34, g: 139, b: 34 }, // 🎄 フォレストグリーン
  shrinkPaddle: { r: 70, g: 70, b: 90 }, // 🌫️ 冬の霧
  piercingBall: { r: 255, g: 215, b: 0 }, // ⭐ ゴールドスター
  slowBall: { r: 176, g: 224, b: 230 }, // ❄️ アイスブルー
  extraLife: { r: 220, g: 20, b: 60 }, // ❤️ クリムゾンレッド
  speedUp: { r: 255, g: 140, b: 0 }, // 🔥 暖炉オレンジ
  multiBall: { r: 255, g: 255, b: 255 }, // ⛄ スノーホワイト
};

/**
 * アイテムのアイコン 🎄 クリスマス絵文字
 */
export const ITEM_ICONS: Record<ItemType, string> = {
  expandPaddle: '🎄', // パドル拡張 → クリスマスツリー
  shrinkPaddle: '🌫️', // パドル縮小 → 霧
  piercingBall: '⭐', // 貫通ボール → 星
  slowBall: '❄️', // スローボール → 雪の結晶
  extraLife: '🎅', // ライフ+1 → サンタ
  speedUp: '🔥', // スピードアップ → 暖炉の火
  multiBall: '⛄', // マルチボール → 雪だるま
};

/**
 * アイテムの効果名（日本語表示用）クリスマス風
 */
export const ITEM_NAMES: Record<ItemType, string> = {
  expandPaddle: 'ツリーパワー！',
  shrinkPaddle: '冬の霧...',
  piercingBall: '聖夜の星！',
  slowBall: '雪化粧',
  extraLife: 'サンタの贈り物！',
  speedUp: '暖炉の炎！',
  multiBall: '雪だるま軍団！',
};
