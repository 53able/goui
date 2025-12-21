import {
  type HighScoreData,
  HighScoreDataSchema,
  type HighScoreEntry,
} from '@/schemas/breakout';

/**
 * ローカルストレージのキー
 */
const STORAGE_KEY = 'breakout-high-scores';

/**
 * 保存するスコアの最大数
 */
const MAX_SCORES = 10;

/**
 * ローカルストレージからハイスコアを読み込む
 * @returns ハイスコアデータ（存在しない場合は空配列）
 */
export const loadHighScores = (): HighScoreData => {
  // SSR時はlocalStorageが存在しないため空配列を返す
  if (typeof window === 'undefined') {
    return { scores: [] };
  }

  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      return { scores: [] };
    }

    const parsed = JSON.parse(json);
    const result = HighScoreDataSchema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }

    // スキーマ不一致の場合は初期化
    console.warn('Invalid high score data, resetting:', result.error);
    return { scores: [] };
  } catch (error) {
    console.warn('Failed to load high scores:', error);
    return { scores: [] };
  }
};

/**
 * ハイスコアをローカルストレージに保存
 * @param data - ハイスコアデータ
 */
export const saveHighScores = (data: HighScoreData): void => {
  // SSR時は何もしない
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save high scores:', error);
  }
};

/**
 * 新しいスコアがランクインするか判定
 * @param score - 新しいスコア
 * @param currentScores - 現在のスコア一覧
 * @returns ランクインする場合true
 */
export const isNewHighScore = (
  score: number,
  currentScores: HighScoreEntry[],
): boolean => {
  if (score <= 0) return false;
  if (currentScores.length < MAX_SCORES) return true;
  return score > (currentScores.at(-1)?.score ?? 0);
};

/**
 * 新しいスコアのランキング順位を取得
 * @param score - 新しいスコア
 * @param currentScores - 現在のスコア一覧
 * @returns 1から始まる順位（ランク外の場合は-1）
 */
export const getScoreRank = (
  score: number,
  currentScores: HighScoreEntry[],
): number => {
  if (!isNewHighScore(score, currentScores)) return -1;

  const rank = currentScores.findIndex((entry) => score > entry.score);
  return rank === -1 ? currentScores.length + 1 : rank + 1;
};

/**
 * 新しいスコアを追加（上位10件のみ保持）
 * @param score - スコア
 * @param level - 到達レベル
 * @param currentData - 現在のハイスコアデータ
 * @returns 更新後のハイスコアデータ
 */
export const addHighScore = (
  score: number,
  level: number,
  currentData: HighScoreData,
): HighScoreData => {
  const newEntry: HighScoreEntry = {
    score,
    level,
    date: new Date().toISOString(),
  };

  const newScores = [...currentData.scores, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);

  return { scores: newScores };
};

/**
 * ハイスコアデータを初期化（テスト・デバッグ用）
 */
export const resetHighScores = (): void => {
  // SSR時は何もしない
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset high scores:', error);
  }
};

/**
 * トップスコアを取得
 * @param data - ハイスコアデータ
 * @returns 最高スコア（存在しない場合は0）
 */
export const getTopScore = (data: HighScoreData): number => {
  return data.scores[0]?.score ?? 0;
};
