import { create } from 'zustand';
import {
  createGame,
  launchBall,
  movePaddle,
  movePaddleToPosition,
  resetGame,
  updateGame,
} from '@/lib/breakoutLogic';
import type { BreakoutGame, GameConfig } from '@/schemas/breakout';
import { GameConfigSchema } from '@/schemas/breakout';

/**
 * ブロック崩しストアの型定義
 */
interface BreakoutStore {
  /** ゲーム状態 */
  game: BreakoutGame;
  /** キー入力状態 */
  keys: {
    left: boolean;
    right: boolean;
  };
  /** アニメーションフレームID */
  animationFrameId: number | null;

  // アクション
  /** ゲームを開始/再開 */
  start: () => void;
  /** ゲームを一時停止 */
  pause: () => void;
  /** ゲームをリセット */
  reset: () => void;
  /** キー押下 */
  handleKeyDown: (key: string) => void;
  /** キー解放 */
  handleKeyUp: (key: string) => void;
  /** マウス/タッチ移動（スケール対応） */
  handlePointerMove: (
    clientX: number,
    canvasLeft: number,
    scale: number,
  ) => void;
  /** ゲームループ更新 */
  tick: () => void;
  /** ゲームループを開始 */
  startGameLoop: () => void;
  /** ゲームループを停止 */
  stopGameLoop: () => void;
}

/**
 * デフォルト設定
 */
const defaultConfig: GameConfig = GameConfigSchema.parse({});

/**
 * ブロック崩しのZustandストア
 */
export const useBreakoutStore = create<BreakoutStore>((set, get) => ({
  game: createGame(defaultConfig),
  keys: { left: false, right: false },
  animationFrameId: null,

  start: () => {
    const { game } = get();
    if (game.state === 'ready') {
      set({ game: launchBall(game) });
      get().startGameLoop();
    } else if (game.state === 'paused') {
      set({ game: { ...game, state: 'playing' } });
      get().startGameLoop();
    } else if (game.state === 'gameOver' || game.state === 'victory') {
      const newGame = resetGame(game);
      set({ game: launchBall(newGame) });
      get().startGameLoop();
    }
  },

  pause: () => {
    const { game } = get();
    if (game.state === 'playing') {
      set({ game: { ...game, state: 'paused' } });
      get().stopGameLoop();
    }
  },

  reset: () => {
    get().stopGameLoop();
    set({ game: createGame(defaultConfig) });
  },

  handleKeyDown: (key: string) => {
    const { game, keys } = get();

    // スペースキーでスタート/ポーズ
    if (key === ' ' || key === 'Space') {
      if (game.state === 'playing') {
        get().pause();
      } else {
        get().start();
      }
      return;
    }

    // 左右キー
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      set({ keys: { ...keys, left: true } });
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      set({ keys: { ...keys, right: true } });
    }
  },

  handleKeyUp: (key: string) => {
    const { keys } = get();
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      set({ keys: { ...keys, left: false } });
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      set({ keys: { ...keys, right: false } });
    }
  },

  handlePointerMove: (clientX: number, canvasLeft: number, scale: number) => {
    const { game } = get();
    // CSSスケールを考慮してゲーム座標に変換
    const targetX = (clientX - canvasLeft) / scale;
    set({
      game: {
        ...game,
        paddle: movePaddleToPosition(game.paddle, targetX, game.config),
      },
    });
  },

  tick: () => {
    const { game, keys } = get();

    // パドル移動
    let newPaddle = game.paddle;
    if (keys.left) {
      newPaddle = movePaddle(newPaddle, -1, game.config);
    }
    if (keys.right) {
      newPaddle = movePaddle(newPaddle, 1, game.config);
    }

    // ready状態ならボールをパドルに追従させる
    if (game.state === 'ready') {
      const ballX = newPaddle.x + newPaddle.width / 2;
      set({
        game: {
          ...game,
          paddle: newPaddle,
          ball: { ...game.ball, x: ballX },
        },
      });
      return;
    }

    // ゲーム状態を更新
    const updatedGame = updateGame({ ...game, paddle: newPaddle });

    // ゲーム終了時はループを停止
    if (
      updatedGame.state === 'gameOver' ||
      updatedGame.state === 'victory' ||
      updatedGame.state === 'ready'
    ) {
      get().stopGameLoop();
    }

    set({ game: updatedGame });
  },

  startGameLoop: () => {
    const { animationFrameId } = get();
    if (animationFrameId !== null) return;

    const gameLoop = () => {
      get().tick();
      const id = requestAnimationFrame(gameLoop);
      set({ animationFrameId: id });
    };

    const id = requestAnimationFrame(gameLoop);
    set({ animationFrameId: id });
  },

  stopGameLoop: () => {
    const { animationFrameId } = get();
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      set({ animationFrameId: null });
    }
  },
}));
