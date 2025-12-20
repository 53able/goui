import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GameState, TetrisGame, Tetromino } from '@/schemas/tetris';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  calculateDropSpeed,
  calculateLevel,
  calculateScore,
  checkCollision,
  clearLines,
  createRandomTetromino,
  placeTetromino,
  rotateTetromino,
} from '../lib/tetrisLogic';

/**
 * ハイスコアエントリ
 */
interface HighScoreEntry {
  score: number;
  level: number;
  lines: number;
  date: string;
}

/**
 * テトリスストアの状態インターフェース
 */
interface TetrisStore {
  /** ゲーム状態 */
  game: TetrisGame;
  /** ハイスコアリスト（トップ5） */
  highScores: HighScoreEntry[];
  /** 新記録達成フラグ（ランク番号、nullなら未達成） */
  newHighScoreRank: number | null;
  /** ゲームを開始 */
  startGame: () => void;
  /** ゲームを一時停止/再開 */
  togglePause: () => void;
  /** ゲームをリセット */
  resetGame: () => void;
  /** テトリミノを左に移動 */
  moveLeft: () => void;
  /** テトリミノを右に移動 */
  moveRight: () => void;
  /** テトリミノを下に移動 */
  moveDown: () => void;
  /** テトリミノを回転 */
  rotate: () => void;
  /** テトリミノをハードドロップ */
  hardDrop: () => void;
  /** ゲームループを更新 */
  update: (currentTime: number) => void;
  /** 消去アニメーションを完了 */
  completeLineClear: () => void;
}

/**
 * ハイスコアを更新してランクを返す
 */
const updateHighScores = (
  highScores: HighScoreEntry[],
  newScore: number,
  level: number,
  lines: number,
): { newHighScores: HighScoreEntry[]; rank: number | null } => {
  if (newScore === 0) {
    return { newHighScores: highScores, rank: null };
  }

  const newEntry: HighScoreEntry = {
    score: newScore,
    level,
    lines,
    date: new Date().toISOString(),
  };

  // スコアでソートして挿入位置を決定
  const allScores = [...highScores, newEntry].sort((a, b) => b.score - a.score);
  const rank = allScores.indexOf(newEntry);

  // トップ5のみ保持
  const newHighScores = allScores.slice(0, 5);

  // ランク5位以内ならランクを返す（0-indexed）
  if (rank < 5) {
    return { newHighScores, rank: rank + 1 }; // 1-indexed に変換
  }

  return { newHighScores: highScores, rank: null };
};

/**
 * 空のボードを生成
 */
const createEmptyBoard = (): number[][] => {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    new Array(BOARD_WIDTH).fill(0),
  );
};

/**
 * テトリスゲーム管理用Zustandストア
 * ハイスコアはローカルストレージに永続化
 */
export const useTetrisStore = create<TetrisStore>()(
  persist(
    devtools(
      (set, get) => {
        const initializeGame = (): TetrisGame => {
          const currentPiece = createRandomTetromino();
          const nextPiece = createRandomTetromino();
          const now = performance.now();

          return {
            board: createEmptyBoard(),
            currentPiece,
            nextPiece,
            score: 0,
            level: 1,
            lines: 0,
            state: 'playing',
            dropTime: calculateDropSpeed(1),
            lastTime: now,
            clearingLines: [],
            scoreAnimation: null,
          };
        };

        return {
          game: initializeGame(),
          highScores: [],
          newHighScoreRank: null,

          startGame: () => {
            set({ game: initializeGame(), newHighScoreRank: null });
          },

          togglePause: () => {
            const { game } = get();
            if (game.state === 'gameOver') {
              return;
            }

            const newState: GameState =
              game.state === 'playing' ? 'paused' : 'playing';

            set({
              game: {
                ...game,
                state: newState,
              },
            });
          },

          resetGame: () => {
            set({ game: initializeGame() });
          },

          moveLeft: () => {
            const { game } = get();
            if (!game.currentPiece || game.state !== 'playing') {
              return;
            }

            const movedPiece: Tetromino = {
              ...game.currentPiece,
              position: {
                x: game.currentPiece.position.x - 1,
                y: game.currentPiece.position.y,
              },
            };

            if (!checkCollision(game.board, movedPiece)) {
              set({
                game: {
                  ...game,
                  currentPiece: movedPiece,
                },
              });
            }
          },

          moveRight: () => {
            const { game } = get();
            if (!game.currentPiece || game.state !== 'playing') {
              return;
            }

            const movedPiece: Tetromino = {
              ...game.currentPiece,
              position: {
                x: game.currentPiece.position.x + 1,
                y: game.currentPiece.position.y,
              },
            };

            if (!checkCollision(game.board, movedPiece)) {
              set({
                game: {
                  ...game,
                  currentPiece: movedPiece,
                },
              });
            }
          },

          moveDown: () => {
            const { game } = get();
            if (!game.currentPiece || game.state !== 'playing') {
              return;
            }

            const movedPiece: Tetromino = {
              ...game.currentPiece,
              position: {
                x: game.currentPiece.position.x,
                y: game.currentPiece.position.y + 1,
              },
            };

            if (checkCollision(game.board, movedPiece)) {
              // 衝突したら固定
              const newBoard = placeTetromino(game.board, game.currentPiece);
              const { clearedLines, clearedLineIndices } = clearLines(newBoard);

              // 消去するラインがある場合はアニメーション開始
              if (clearedLines > 0) {
                const newScore =
                  game.score + calculateScore(clearedLines, game.level);
                set({
                  game: {
                    ...game,
                    board: newBoard, // アニメーション中は消去前のボードを表示
                    clearingLines: clearedLineIndices,
                    scoreAnimation: newScore,
                  },
                });
                return;
              }

              // 消去するラインがない場合は通常処理
              const nextPiece = game.nextPiece ?? createRandomTetromino();
              const newCurrentPiece = createRandomTetromino();

              // ゲームオーバーチェック
              if (checkCollision(newBoard, newCurrentPiece)) {
                const { highScores } = get();
                const { newHighScores, rank } = updateHighScores(
                  highScores,
                  game.score,
                  game.level,
                  game.lines,
                );
                set({
                  game: {
                    ...game,
                    board: newBoard,
                    state: 'gameOver',
                  },
                  highScores: newHighScores,
                  newHighScoreRank: rank,
                });
                return;
              }

              set({
                game: {
                  ...game,
                  board: newBoard,
                  currentPiece: newCurrentPiece,
                  nextPiece,
                  dropTime: calculateDropSpeed(game.level),
                  lastTime: performance.now(),
                },
              });
            } else {
              set({
                game: {
                  ...game,
                  currentPiece: movedPiece,
                },
              });
            }
          },

          rotate: () => {
            const { game } = get();
            if (!game.currentPiece || game.state !== 'playing') {
              return;
            }

            const rotatedPiece = rotateTetromino(game.currentPiece);

            if (!checkCollision(game.board, rotatedPiece)) {
              set({
                game: {
                  ...game,
                  currentPiece: rotatedPiece,
                },
              });
            }
          },

          hardDrop: () => {
            const { game } = get();
            if (!game.currentPiece || game.state !== 'playing') {
              return;
            }

            let droppedPiece = game.currentPiece;
            while (true) {
              const testPiece: Tetromino = {
                ...droppedPiece,
                position: {
                  x: droppedPiece.position.x,
                  y: droppedPiece.position.y + 1,
                },
              };

              if (checkCollision(game.board, testPiece)) {
                break;
              }

              droppedPiece = testPiece;
            }

            // 固定処理
            const newBoard = placeTetromino(game.board, droppedPiece);
            const { clearedLines, clearedLineIndices } = clearLines(newBoard);

            // 消去するラインがある場合はアニメーション開始
            if (clearedLines > 0) {
              const newScore =
                game.score + calculateScore(clearedLines, game.level);
              set({
                game: {
                  ...game,
                  board: newBoard, // アニメーション中は消去前のボードを表示
                  clearingLines: clearedLineIndices,
                  scoreAnimation: newScore,
                },
              });
              return;
            }

            // 消去するラインがない場合は通常処理
            const nextPiece = game.nextPiece ?? createRandomTetromino();
            const newCurrentPiece = createRandomTetromino();

            // ゲームオーバーチェック
            if (checkCollision(newBoard, newCurrentPiece)) {
              const { highScores } = get();
              const { newHighScores, rank } = updateHighScores(
                highScores,
                game.score,
                game.level,
                game.lines,
              );
              set({
                game: {
                  ...game,
                  board: newBoard,
                  state: 'gameOver',
                },
                highScores: newHighScores,
                newHighScoreRank: rank,
              });
              return;
            }

            set({
              game: {
                ...game,
                board: newBoard,
                currentPiece: newCurrentPiece,
                nextPiece,
                dropTime: calculateDropSpeed(game.level),
                lastTime: performance.now(),
              },
            });
          },

          update: (currentTime: number) => {
            const { game } = get();
            if (game.state !== 'playing') {
              return;
            }

            // 消去アニメーション中は落下を停止
            if (game.clearingLines.length > 0 || !game.currentPiece) {
              return;
            }

            const elapsed = currentTime - game.lastTime;

            if (elapsed >= game.dropTime) {
              get().moveDown();
              set((state) => ({
                game: {
                  ...state.game,
                  lastTime: currentTime,
                },
              }));
            }
          },

          completeLineClear: () => {
            const { game } = get();
            if (game.clearingLines.length === 0) {
              return;
            }

            // 実際にラインを消去
            const { newBoard: clearedBoard } = clearLines(game.board);
            const clearedLines = game.clearingLines.length;
            const newLines = game.lines + clearedLines;
            const newLevel = calculateLevel(newLines);
            const newScore = game.scoreAnimation ?? game.score;

            const nextPiece = game.nextPiece ?? createRandomTetromino();
            const newCurrentPiece = createRandomTetromino();

            // ゲームオーバーチェック
            if (checkCollision(clearedBoard, newCurrentPiece)) {
              const { highScores } = get();
              const { newHighScores, rank } = updateHighScores(
                highScores,
                newScore,
                newLevel,
                newLines,
              );
              set({
                game: {
                  ...game,
                  board: clearedBoard,
                  score: newScore,
                  level: newLevel,
                  lines: newLines,
                  state: 'gameOver',
                  clearingLines: [],
                  scoreAnimation: null,
                },
                highScores: newHighScores,
                newHighScoreRank: rank,
              });
              return;
            }

            set({
              game: {
                ...game,
                board: clearedBoard,
                currentPiece: newCurrentPiece,
                nextPiece,
                score: newScore,
                level: newLevel,
                lines: newLines,
                dropTime: calculateDropSpeed(newLevel),
                lastTime: performance.now(),
                clearingLines: [],
                scoreAnimation: null,
              },
            });
          },
        };
      },
      { name: 'tetris-store' },
    ),
    {
      name: 'tetris-highscores',
      // ハイスコアのみ永続化（ゲーム状態は保存しない）
      partialize: (state) => ({ highScores: state.highScores }),
    },
  ),
);
