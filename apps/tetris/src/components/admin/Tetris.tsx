import { Button } from '@goui/ui';
import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import type { Tetromino } from '@/schemas/tetris';
import { useTetrisStore } from '@/stores/tetrisStore';

/**
 * テトリミノの色マッピング
 */
const TETROMINO_COLORS: Record<string, string> = {
  0: 'bg-gray-100 dark:bg-gray-800',
  1: 'bg-cyan-500', // I
  2: 'bg-yellow-500', // O
  3: 'bg-purple-500', // T
  4: 'bg-green-500', // S
  5: 'bg-red-500', // Z
  6: 'bg-blue-500', // J
  7: 'bg-orange-500', // L
};

/**
 * ボードセルコンポーネント
 * モバイル: 16px、デスクトップ: 24px
 */
interface BoardCellProps {
  /** セルの値（0-7） */
  value: number;
  /** ハイライトするか（現在のテトリミノ） */
  isHighlighted?: boolean;
  /** 消去アニメーション中か */
  isClearing?: boolean;
}

const BoardCell: FC<BoardCellProps> = ({
  value,
  isHighlighted = false,
  isClearing = false,
}) => {
  const colorClass =
    TETROMINO_COLORS[value] ??
    TETROMINO_COLORS[0] ??
    'bg-gray-100 dark:bg-gray-800';
  const highlightClass = isHighlighted
    ? 'ring-1 sm:ring-2 ring-white dark:ring-gray-300'
    : '';

  // 消去アニメーション用のクラス
  const clearingClass = isClearing
    ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg shadow-yellow-500/50 z-10 animate-[line-clear-pulse_0.6s_ease-in-out]'
    : '';

  // CSS変数 --tetris-cell-size で一元管理（index.css で定義）
  return (
    <div
      className={`border border-gray-300 dark:border-gray-700 ${colorClass} ${highlightClass} ${clearingClass} transition-all duration-300`}
      style={{
        width: 'var(--tetris-cell-size)',
        height: 'var(--tetris-cell-size)',
      }}
    />
  );
};

/**
 * ボードコンポーネント
 */
interface BoardProps {
  /** ゲームボード */
  board: number[][];
  /** 現在のテトリミノ */
  currentPiece: Tetromino | null;
  /** 消去中のライン番号 */
  clearingLines: number[];
}

const Board: FC<BoardProps> = ({ board, currentPiece, clearingLines }) => {
  // 消去中のセルマップを作成
  const clearingMap = new Set(
    clearingLines.flatMap((rowIndex) =>
      Array.from({ length: 10 }, (_, colIndex) => `${rowIndex},${colIndex}`),
    ),
  );

  return (
    <div
      className="grid grid-cols-10 gap-0 bg-gray-200 dark:bg-gray-900 rounded border border-gray-400 dark:border-gray-600 relative overflow-hidden"
      style={{ padding: 'var(--tetris-board-padding)' }}
    >
      {/* パーティクルエフェクト用のオーバーレイ */}
      {clearingLines.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {clearingLines.flatMap((rowIndex) =>
            Array.from({ length: 10 }, (_, colIndex) => {
              const key = `particle-${rowIndex}-${colIndex}`;
              const delay = Math.random() * 0.2;
              const duration = 0.5 + Math.random() * 0.3;
              const angle = Math.random() * Math.PI * 2;
              const distance = 50 + Math.random() * 100;
              const translateX = Math.cos(angle) * distance;
              const translateY = Math.sin(angle) * distance;
              const size = 3 + Math.random() * 4;

              return (
                <div
                  key={key}
                  className="absolute rounded-full opacity-90"
                  style={
                    {
                      left: `${(colIndex * 100) / 10 + 5}%`,
                      top: `${(rowIndex * 100) / 20 + 2.5}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      background: `hsl(${30 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`,
                      boxShadow: `0 0 ${size * 2}px currentColor`,
                      animation: `particle-explode ${duration}s ease-out ${delay}s forwards`,
                      '--tx': `${translateX}px`,
                      '--ty': `${translateY}px`,
                    } as React.CSSProperties
                  }
                />
              );
            }),
          )}
        </div>
      )}

      {/* ボードセル */}
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;
          const isClearing = clearingMap.has(`${rowIndex},${colIndex}`);

          return (
            <BoardCell
              key={key}
              value={cell}
              isHighlighted={false}
              isClearing={isClearing}
            />
          );
        }),
      )}

      {/* テトリミノオーバーレイ（滑らかな移動アニメーション用） */}
      {currentPiece && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `calc(${currentPiece.position.x} * var(--tetris-cell-size) + var(--tetris-board-padding))`,
            top: `calc(${currentPiece.position.y} * var(--tetris-cell-size) + var(--tetris-board-padding))`,
            transition: 'left 0.1s ease-out, top 0.1s ease-out',
            willChange: 'left, top',
          }}
        >
          {currentPiece.shape.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (cell === 0) {
                return null;
              }

              const key = `piece-${rowIndex}-${colIndex}`;
              const colorClass =
                TETROMINO_COLORS[getTetrominoColor(currentPiece.type)] ??
                'bg-gray-100';

              // CSS変数で一元管理（ボードセルと自動同期）
              return (
                <div
                  key={key}
                  className={`absolute border border-gray-300 dark:border-gray-700 ${colorClass} ring-1 sm:ring-2 ring-white dark:ring-gray-300`}
                  style={{
                    left: `calc(${colIndex} * var(--tetris-cell-size))`,
                    top: `calc(${rowIndex} * var(--tetris-cell-size))`,
                    width: 'var(--tetris-cell-size)',
                    height: 'var(--tetris-cell-size)',
                  }}
                />
              );
            }),
          )}
        </div>
      )}
    </div>
  );
};

/**
 * テトリミノタイプから色番号を取得
 */
const getTetrominoColor = (type: string): number => {
  const colorMap: Record<string, number> = {
    I: 1,
    O: 2,
    T: 3,
    S: 4,
    Z: 5,
    J: 6,
    L: 7,
  };
  return colorMap[type] ?? 0;
};

/**
 * テトリスゲームコンポーネント
 * モバイルファースト・レスポンシブレイアウト
 */
export const Tetris: FC = () => {
  const {
    game,
    highScores,
    newHighScoreRank,
    startGame,
    togglePause,
    resetGame,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    update,
    completeLineClear,
  } = useTetrisStore();

  // ハイスコア（1位）を取得
  const topScore = highScores[0]?.score ?? 0;
  const animationFrameRef = useRef<number | undefined>(undefined);
  const clearAnimationTimeoutRef = useRef<number | undefined>(undefined);
  const boardRef = useRef<HTMLDivElement>(null);

  // タッチ操作用の状態
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  // 操作の閾値
  const SWIPE_THRESHOLD = 30; // スワイプと判定する最小移動距離（ピクセル）
  const TAP_THRESHOLD = 10; // タップと判定する最大移動距離
  const LONG_PRESS_DURATION = 300; // 長押しと判定する時間（ミリ秒）

  // タッチ開始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (game.state !== 'playing') return;

    const touch = e.touches[0];
    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isLongPressRef.current = false;

    // 長押しタイマー開始
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      hardDrop();
      // 振動フィードバック（対応している場合）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  };

  // タッチ移動（長押しキャンセル用）
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // 移動が閾値を超えたら長押しをキャンセル
    if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  // タッチ終了
  const handleTouchEnd = (e: React.TouchEvent) => {
    // 長押しタイマーをクリア
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (game.state !== 'playing' || !touchStartRef.current) return;

    // 長押しで既にドロップした場合は何もしない
    if (isLongPressRef.current) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // タップ判定（短い距離）
    if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD) {
      rotate();
      touchStartRef.current = null;
      return;
    }

    // スワイプ判定
    if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
      if (absX > absY) {
        // 左右スワイプ
        if (deltaX > 0) {
          moveRight();
        } else {
          moveLeft();
        }
      } else if (deltaY > 0) {
        // 下スワイプ
        moveDown();
      }
      // 上スワイプは無視
    }

    touchStartRef.current = null;
  };

  // 消去アニメーションの管理
  useEffect(() => {
    if (game.clearingLines.length > 0) {
      const timeoutId = window.setTimeout(() => {
        completeLineClear();
      }, 600);

      clearAnimationTimeoutRef.current = timeoutId;

      return () => {
        if (clearAnimationTimeoutRef.current) {
          window.clearTimeout(clearAnimationTimeoutRef.current);
        }
      };
    }
  }, [game.clearingLines.length, completeLineClear]);

  // ゲームループ
  useEffect(() => {
    if (game.state !== 'playing') {
      return;
    }

    const gameLoop = (currentTime: number) => {
      update(currentTime);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [game.state, update]);

  // キーボード入力処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (game.state === 'gameOver') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          event.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          event.preventDefault();
          rotate();
          break;
        case ' ':
          event.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          event.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    game.state,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    togglePause,
  ]);

  return (
    // Pancake Stack: auto 1fr auto でフルハイトレイアウト
    <div
      className="grid min-h-[100dvh] bg-background"
      style={{ gridTemplateRows: 'auto 1fr auto' }}
    >
      {/* ヘッダー - スコア・NEXT・ボタンを上部に配置 */}
      <header className="px-2 py-1 sm:p-4">
        {/* 上段: スコア・NEXT・ボタン */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* スコア情報 */}
          <div className="flex items-center gap-2 sm:gap-4 bg-gray-100 dark:bg-gray-800 px-2 py-1 sm:px-4 sm:py-2 rounded border border-gray-300 dark:border-gray-700">
            <div className="relative text-center">
              <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                Score
              </div>
              <div
                className={`text-sm sm:text-xl font-bold transition-all duration-300 ${
                  game.scoreAnimation !== null &&
                  game.scoreAnimation > game.score
                    ? 'animate-[score-pop_0.5s_ease-out] text-green-500'
                    : ''
                }`}
              >
                {game.scoreAnimation !== null
                  ? game.scoreAnimation.toLocaleString()
                  : game.score.toLocaleString()}
              </div>
              {game.scoreAnimation !== null &&
                game.scoreAnimation > game.score && (
                  <div className="absolute -top-1 -right-2 text-green-500 font-bold animate-bounce text-[10px] sm:text-sm drop-shadow-lg">
                    +{(game.scoreAnimation - game.score).toLocaleString()}
                  </div>
                )}
            </div>
            <div className="text-center">
              <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                Lv
              </div>
              <div className="text-sm sm:text-xl font-bold">{game.level}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                Lines
              </div>
              <div className="text-sm sm:text-xl font-bold">{game.lines}</div>
            </div>
            {/* ハイスコア表示 */}
            {topScore > 0 && (
              <div className="text-center border-l border-gray-300 dark:border-gray-600 pl-2 sm:pl-4">
                <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                  🏆 Best
                </div>
                <div className="text-sm sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {topScore.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* NEXTピース - コンパクト版 */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 sm:px-3 sm:py-2 rounded border border-gray-300 dark:border-gray-700">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              Next
            </span>
            {game.nextPiece && (
              <div className="grid grid-cols-4 gap-0">
                {game.nextPiece.shape.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const key = `next-${rowIndex}-${colIndex}`;
                    const colorClass =
                      cell === 1
                        ? (TETROMINO_COLORS[
                            getTetrominoColor(game.nextPiece?.type ?? 'I')
                          ] ?? 'bg-gray-100')
                        : 'bg-transparent';

                    return (
                      <div
                        key={key}
                        className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${cell === 1 ? `border border-gray-400 dark:border-gray-600 ${colorClass}` : ''}`}
                      />
                    );
                  }),
                )}
              </div>
            )}
          </div>

          {/* コントロールボタン */}
          <div className="flex gap-1 sm:gap-2">
            <Button
              onClick={game.state === 'playing' ? togglePause : startGame}
              variant="default"
              className="text-xs px-2 py-1 h-7 sm:text-sm sm:px-4 sm:h-10"
            >
              {game.state === 'playing'
                ? '停止'
                : game.state === 'paused'
                  ? '再開'
                  : '開始'}
            </Button>
            <Button
              onClick={resetGame}
              variant="outline"
              className="text-xs px-2 py-1 h-7 sm:text-sm sm:px-4 sm:h-10"
            >
              リセット
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ - ボードのみ中央配置 */}
      <main className="flex items-center justify-center sm:px-4 overflow-hidden">
        {/* ゲームボード - タッチ操作エリア */}
        <div
          ref={boardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="touch-none select-none relative"
        >
          <Board
            board={game.board}
            currentPiece={game.currentPiece}
            clearingLines={game.clearingLines}
          />

          {/* ライン消去メッセージ - ボード上にオーバーレイ */}
          {game.clearingLines.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="text-center p-2 sm:p-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded border sm:border-2 border-yellow-300 animate-pulse shadow-2xl">
                <p className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                  {game.clearingLines.length === 1 && 'Single!'}
                  {game.clearingLines.length === 2 && 'Double!!'}
                  {game.clearingLines.length === 3 && 'Triple!!!'}
                  {game.clearingLines.length >= 4 && 'TETRIS!!!!'}
                </p>
              </div>
            </div>
          )}

          {/* ゲームオーバーメッセージ - ボード上にオーバーレイ */}
          {game.state === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
              <div
                className={`text-center p-3 sm:p-4 bg-background rounded shadow-2xl ${
                  newHighScoreRank
                    ? 'border-2 border-yellow-400 animate-pulse'
                    : 'border border-destructive'
                }`}
              >
                {newHighScoreRank ? (
                  <>
                    <p className="text-base sm:text-xl font-bold text-yellow-500 animate-bounce">
                      🏆 新記録！ {newHighScoreRank}位 🏆
                    </p>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-yellow-600">
                      {game.score.toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Lv.{game.level} / {game.lines} Lines
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base sm:text-xl font-bold text-destructive">
                      ゲームオーバー
                    </p>
                    <p className="text-xs sm:text-sm mt-1">
                      スコア: {game.score.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* フッター - 操作説明 */}
      <footer className="py-1 sm:p-4 text-center">
        {/* モバイル用操作説明 */}
        <div className="sm:hidden text-[10px] text-muted-foreground">
          タップ:回転 | 長押し:ドロップ | スワイプ:移動
        </div>

        {/* デスクトップ用操作説明 */}
        <div className="hidden sm:block text-sm text-muted-foreground space-x-4">
          <span>← → : 移動</span>
          <span>↓ : 下</span>
          <span>↑/X : 回転</span>
          <span>Space : ドロップ</span>
          <span>P/Esc : 一時停止</span>
        </div>
      </footer>
    </div>
  );
};
