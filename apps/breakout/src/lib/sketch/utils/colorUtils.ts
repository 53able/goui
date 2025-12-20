/**
 * 色変換ユーティリティ
 * @description HSL文字列からRGBへの変換など
 */

import type { RGB } from '../types/index.js';

/**
 * HSL文字列からRGBを抽出
 * @param hslStr - HSL形式の色文字列 (例: "hsl(120, 50%, 50%)")
 * @returns RGB値、パース失敗時はnull
 */
export const parseHslColor = (hslStr: string): RGB | null => {
  const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return null;

  const h = Number.parseInt(match[1], 10) / 360;
  const s = Number.parseInt(match[2], 10) / 100;
  const l = Number.parseInt(match[3], 10) / 100;

  // HSL to RGB conversion
  const hue2rgb = (pv: number, qv: number, tv: number): number => {
    const tt = tv < 0 ? tv + 1 : tv > 1 ? tv - 1 : tv;
    if (tt < 1 / 6) return pv + (qv - pv) * 6 * tt;
    if (tt < 1 / 2) return qv;
    if (tt < 2 / 3) return pv + (qv - pv) * (2 / 3 - tt) * 6;
    return pv;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const pv = 2 * l - q;

  return {
    r: Math.round(hue2rgb(pv, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(pv, q, h) * 255),
    b: Math.round(hue2rgb(pv, q, h - 1 / 3) * 255),
  };
};

/**
 * RGB値を明るくする
 * @param color - 元の色
 * @param amount - 明るさ増加量（0-255）
 * @returns 明るくなったRGB
 */
export const brightenColor = (color: RGB, amount: number): RGB => ({
  r: Math.min(color.r + amount, 255),
  g: Math.min(color.g + amount, 255),
  b: Math.min(color.b + amount, 255),
});
