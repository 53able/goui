import { Button, cn } from '@goui/ui';
import { type FC, useMemo } from 'react';
import { createBreakoutSketch } from '@/lib/breakoutSketch';
import { getTopScore } from '@/lib/highScoreStorage';
import { useBreakoutStore } from '@/stores/breakoutStore';
import { P5Canvas } from './P5Canvas';

/**
 * ブロック崩しゲームコンポーネント 🎄 クリスマスエディション
 *
 * 雪降る聖夜にプレゼントを届けよう！
 * - プレゼント箱を壊してスコアゲット 🎁
 * - サンタのソリでオーナメントを打ち返せ 🛷
 * - クリスマスイルミネーションが輝く夜空 ✨
 */
export const Breakout: FC = () => {
  const start = useBreakoutStore((state) => state.start);
  const pause = useBreakoutStore((state) => state.pause);
  const reset = useBreakoutStore((state) => state.reset);

  const gameState = useBreakoutStore((state) => state.game.state);
  const gameScore = useBreakoutStore((state) => state.game.score);
  const gameLives = useBreakoutStore((state) => state.game.lives);
  const gameLevel = useBreakoutStore((state) => state.game.level);
  const gameConfig = useBreakoutStore((state) => state.game.config);

  const highScores = useBreakoutStore((state) => state.highScores);
  const isNewRecord = useBreakoutStore((state) => state.isNewRecord);
  const newRecordRank = useBreakoutStore((state) => state.newRecordRank);
  const topScore = getTopScore(highScores);

  const sketch = useMemo(() => createBreakoutSketch(), []);

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full max-w-2xl px-2">
      {/* スコアとライフ 🎄 */}
      <div className="flex justify-between items-center w-full max-w-[min(100%,50vh*0.625)]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              {gameScore}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                pts
              </span>
            </span>
            <span className="text-base text-muted-foreground">
              🎄 Lv.{gameLevel}
            </span>
          </div>
          {/* ハイスコア表示 */}
          <div className="text-xs text-yellow-500/80">
            ⭐ BEST: {topScore.toLocaleString()}
          </div>
        </div>
        <div className="flex items-center text-xl">
          {'🎅'.repeat(gameLives)}
          <span className="opacity-20">
            {'🎅'.repeat(Math.max(0, gameConfig.lives - gameLives))}
          </span>
        </div>
      </div>

      {/* p5.jsキャンバス + オーバーレイ */}
      <div className="relative h-full max-h-[70vh] w-auto">
        <P5Canvas
          sketch={sketch}
          className={cn(
            'h-full w-auto',
            'rounded-xl border-2 border-primary/50',
            'shadow-[0_0_40px_rgba(255,215,0,0.3),inset_0_0_30px_rgba(200,30,30,0.1)]',
            'touch-none select-none',
            'cursor-pointer sm:cursor-none',
            '[&>canvas]:rounded-xl [&>canvas]:block',
          )}
        />

        {/* レベルクリア時のオーバーレイ 🎁 */}
        {gameState === 'levelClear' && (
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center',
              'bg-[#0f1930]/80 rounded-xl backdrop-blur-sm',
              'animate-in fade-in duration-300',
            )}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] mb-4 animate-pulse">
              🎁 LEVEL {gameLevel} CLEAR! 🎁
            </h2>
            <p className="text-xl text-white mb-2">
              SCORE:{' '}
              <span className="text-yellow-400 font-bold">
                {gameScore.toLocaleString()}
              </span>
            </p>
            <p className="text-lg text-green-300 mb-4">
              🎄 次のレベル: もっとたくさんのプレゼント!
            </p>
            <p className="text-sm text-muted-foreground">
              スペースキーまたはスタートボタンで次のレベルへ
            </p>
          </div>
        )}

        {/* ゲームオーバー / 完全勝利時のオーバーレイ 🎄 */}
        {(gameState === 'gameOver' || gameState === 'victory') && (
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center',
              'bg-[#0f1930]/85 rounded-xl backdrop-blur-sm',
              'animate-in fade-in duration-300',
            )}
          >
            {/* タイトル */}
            <h2
              className={cn(
                'text-4xl sm:text-5xl font-black mb-4',
                gameState === 'victory'
                  ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]'
                  : 'text-red-400 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]',
              )}
            >
{gameState === 'victory'
                ? '🎄 Merry Christmas! 🎄'
                : '⛄ また挑戦してね！'}
            </h2>

            {/* 最終レベル表示（完全勝利時） */}
            {gameState === 'victory' && (
              <p className="text-lg text-yellow-300 mb-2">
                🌟 全レベルクリア！素敵なクリスマスを！ 🌟
              </p>
            )}

            {/* スコア */}
            <p className="text-2xl text-white mb-2">
              SCORE:{' '}
              <span className="text-yellow-400 font-bold">
                {gameScore.toLocaleString()}
              </span>
            </p>

            {/* 到達レベル表示（ゲームオーバー時） */}
            {gameState === 'gameOver' && (
              <p className="text-sm text-muted-foreground mb-2">
                🎁 到達レベル: {gameLevel}
              </p>
            )}

            {/* ハイスコア更新時の演出 */}
            {isNewRecord && (
              <div
                className={cn(
                  'flex flex-col items-center gap-1 mb-4',
                  'animate-bounce',
                )}
              >
                <span className="text-xl text-yellow-300 font-bold tracking-wide">
                  🌟 NEW RECORD! 🌟
                </span>
                <span className="text-lg text-yellow-400/90">
                  {newRecordRank === 1
                    ? '⭐ 歴代1位！最高のプレゼント！'
                    : `🎁 ランキング ${newRecordRank}位にランクイン！`}
                </span>
              </div>
            )}

            {/* リプレイ案内 */}
            <p className="text-sm text-muted-foreground mt-2">
              スペースキーまたはスタートボタンで再プレイ
            </p>
          </div>
        )}
      </div>

      {/* ボタン 🎄 */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => (gameState === 'playing' ? pause() : start())}
          variant={gameState === 'playing' ? 'outline' : 'default'}
          size="lg"
          className={cn(
            'min-w-[120px] h-11 text-base',
            'active:scale-95 transition-transform',
            'shadow-[0_0_15px_rgba(255,215,0,0.2)]',
            gameState !== 'playing' && 'bg-red-700 hover:bg-red-600 text-white',
          )}
        >
          {gameState === 'playing'
            ? '⏸ ポーズ'
            : gameState === 'paused'
              ? '▶️ 再開'
              : gameState === 'levelClear'
                ? '🎁 次へ'
                : '🎄 スタート'}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          size="lg"
          className="min-w-[120px] h-11 text-base active:scale-95 transition-transform border-yellow-600/50 text-yellow-500 hover:bg-yellow-950/30"
        >
          🔄 リセット
        </Button>
      </div>

      {/* 操作説明 */}
      <div className="text-center text-xs text-muted-foreground/60 mt-1">
        <p>🛷 マウス/タッチでソリ操作 | ←→キー | スペースで発射</p>
        <p className="text-yellow-500/50">✨ Christmas Edition ✨</p>
      </div>
    </div>
  );
};
