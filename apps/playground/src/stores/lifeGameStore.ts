import { create } from 'zustand';
import {
  computeNextGeneration,
  createEmptyGrid,
  initializeGrid,
  toggleCell,
} from '@/lib/lifeGameLogic';
import type { Grid, LifeGameConfig } from '@/schemas/lifeGame';
import { LifeGameConfigSchema } from '@/schemas/lifeGame';

/**
 * ライフゲームストアの型定義
 */
interface LifeGameStore {
  /** 現在のグリッド */
  grid: Grid;
  /** 世代数 */
  generation: number;
  /** 実行中フラグ */
  isRunning: boolean;
  /** 設定 */
  config: LifeGameConfig;
  /** タイマーID */
  timerId: ReturnType<typeof setInterval> | null;

  // アクション
  /** 次の世代へ進める */
  step: () => void;
  /** 実行/停止をトグル */
  toggleRunning: () => void;
  /** リセット（ランダム再生成） */
  reset: () => void;
  /** クリア（全てのセルを死に） */
  clear: () => void;
  /** セルをトグル */
  toggleCellAt: (row: number, col: number) => void;
  /** 速度を変更 */
  setInterval: (interval: number) => void;
  /** グリッドサイズを変更 */
  setGridSize: (width: number, height: number) => void;
  /** 密度を変更 */
  setDensity: (density: number) => void;
}

/**
 * デフォルト設定
 */
const defaultConfig = LifeGameConfigSchema.parse({});

/**
 * ライフゲームのZustandストア
 */
export const useLifeGameStore = create<LifeGameStore>((set, get) => ({
  grid: initializeGrid(defaultConfig),
  generation: 0,
  isRunning: false,
  config: defaultConfig,
  timerId: null,

  step: () => {
    set((state) => ({
      grid: computeNextGeneration(state.grid),
      generation: state.generation + 1,
    }));
  },

  toggleRunning: () => {
    const { isRunning, timerId, config } = get();

    if (isRunning) {
      // 停止
      if (timerId) {
        clearInterval(timerId);
      }
      set({ isRunning: false, timerId: null });
    } else {
      // 開始
      const newTimerId = setInterval(() => {
        get().step();
      }, config.interval);
      set({ isRunning: true, timerId: newTimerId });
    }
  },

  reset: () => {
    const { timerId, config } = get();
    if (timerId) {
      clearInterval(timerId);
    }
    set({
      grid: initializeGrid(config),
      generation: 0,
      isRunning: false,
      timerId: null,
    });
  },

  clear: () => {
    const { timerId, config } = get();
    if (timerId) {
      clearInterval(timerId);
    }
    set({
      grid: createEmptyGrid(config.width, config.height),
      generation: 0,
      isRunning: false,
      timerId: null,
    });
  },

  toggleCellAt: (row: number, col: number) => {
    set((state) => ({
      grid: toggleCell(state.grid, row, col),
    }));
  },

  setInterval: (interval: number) => {
    const { isRunning, timerId } = get();

    // 実行中なら再起動
    if (isRunning && timerId) {
      clearInterval(timerId);
      const newTimerId = setInterval(() => {
        get().step();
      }, interval);
      set((state) => ({
        config: { ...state.config, interval },
        timerId: newTimerId,
      }));
    } else {
      set((state) => ({
        config: { ...state.config, interval },
      }));
    }
  },

  setGridSize: (width: number, height: number) => {
    const { timerId, config } = get();
    if (timerId) {
      clearInterval(timerId);
    }
    const newConfig = { ...config, width, height };
    set({
      config: newConfig,
      grid: initializeGrid(newConfig),
      generation: 0,
      isRunning: false,
      timerId: null,
    });
  },

  setDensity: (density: number) => {
    set((state) => ({
      config: { ...state.config, density },
    }));
  },
}));
