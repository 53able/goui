/**
 * WebGL座標変換ユーティリティ
 * @description ゲーム座標とWebGL座標の変換
 */

/**
 * 座標変換: ゲーム座標 → WebGL座標
 * WebGLは中心が原点なので変換が必要
 * @param x - ゲームX座標
 * @param y - ゲームY座標
 * @param canvasWidth - キャンバス幅
 * @param canvasHeight - キャンバス高さ
 * @returns [WebGL X座標, WebGL Y座標]
 */
export const toWebGL = (
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
): [number, number] => {
  return [x - canvasWidth / 2, y - canvasHeight / 2];
};
