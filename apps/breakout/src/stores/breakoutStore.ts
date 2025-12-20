import { create } from 'zustand';
import {
  advanceToNextLevel,
  createGame,
  launchBall,
  movePaddle,
  movePaddleToPosition,
  resetGame,
  updateGame,
} from '@/lib/breakoutLogic';
import {
  addHighScore,
  getScoreRank,
  isNewHighScore,
  loadHighScores,
  saveHighScores,
} from '@/lib/highScoreStorage';
import type {
  BreakoutGame,
  GameConfig,
  HighScoreData,
} from '@/schemas/breakout';
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
  /** ハイスコアデータ */
  highScores: HighScoreData;
  /** 今回の記録がハイスコア更新か */
  isNewRecord: boolean;
  /** 今回のランキング順位（1〜10、ランク外は-1） */
  newRecordRank: number;

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
  /** ハイスコアをチェックして更新（ゲーム終了時に呼び出し） */
  checkAndUpdateHighScore: () => void;
  /** ハイスコアデータを再読み込み */
  reloadHighScores: () => void;
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
  highScores: loadHighScores(),
  isNewRecord: false,
  newRecordRank: -1,

  start: () => {
    const { game } = get();
    if (game.state === 'ready') {
      set({ game: launchBall(game), isNewRecord: false, newRecordRank: -1 });
      get().startGameLoop();
    } else if (game.state === 'paused') {
      set({ game: { ...game, state: 'playing' } });
      get().startGameLoop();
    } else if (game.state === 'levelClear') {
      // 次のレベルへ進む
      const nextGame = advanceToNextLevel(game);
      if (nextGame.state === 'victory') {
        // 最終レベルクリア → ハイスコアチェック
        set({ game: nextGame });
        get().checkAndUpdateHighScore();
      } else {
        // 次のレベルへ → 即座に発射
        set({ game: launchBall(nextGame) });
        get().startGameLoop();
      }
    } else if (game.state === 'gameOver' || game.state === 'victory') {
      const newGame = resetGame(game);
      set({
        game: launchBall(newGame),
        isNewRecord: false,
        newRecordRank: -1,
      });
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
    set({
      game: createGame(defaultConfig),
      isNewRecord: false,
      newRecordRank: -1,
    });
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

    // ゲーム終了時はループを停止してハイスコアチェック
    if (updatedGame.state === 'gameOver' || updatedGame.state === 'victory') {
      get().stopGameLoop();
      set({ game: updatedGame });
      get().checkAndUpdateHighScore();
      return;
    }

    // レベルクリア時はループを停止（次レベルへの遷移待ち）
    if (updatedGame.state === 'levelClear') {
      get().stopGameLoop();
      set({ game: updatedGame });
      return;
    }

    // ライフ減少でready状態に戻った場合
    if (updatedGame.state === 'ready') {
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

  checkAndUpdateHighScore: () => {
    const { game, highScores } = get();
    const { score, level } = game;

    if (isNewHighScore(score, highScores.scores)) {
      const rank = getScoreRank(score, highScores.scores);
      const updatedData = addHighScore(score, level, highScores);
      saveHighScores(updatedData);
      set({
        highScores: updatedData,
        isNewRecord: true,
        newRecordRank: rank,
      });
    }
  },

  reloadHighScores: () => {
    set({ highScores: loadHighScores() });
  },
}));
