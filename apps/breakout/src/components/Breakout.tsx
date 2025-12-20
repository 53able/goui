import { Button, cn } from '@goui/ui';
import { type FC, useEffect, useRef } from 'react';
import { useBreakoutStore } from '@/stores/breakoutStore';

/**
 * パーティクル（破片エフェクト）
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

/**
 * スコアポップアップ
 */
interface ScorePopup {
  x: number;
  y: number;
  score: number;
  combo: number;
  life: number;
}

/**
 * ボールトレイル（残像）
 */
interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

/**
 * 背景パーティクル
 */
interface BgParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

/**
 * ブロック崩しゲームコンポーネント（ド派手版）
 */
export const Breakout: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ストアから関数を取得
  const start = useBreakoutStore((state) => state.start);
  const pause = useBreakoutStore((state) => state.pause);
  const reset = useBreakoutStore((state) => state.reset);
  const handleKeyDown = useBreakoutStore((state) => state.handleKeyDown);
  const handleKeyUp = useBreakoutStore((state) => state.handleKeyUp);
  const handlePointerMove = useBreakoutStore(
    (state) => state.handlePointerMove,
  );

  // UIレンダリング用
  const gameState = useBreakoutStore((state) => state.game.state);
  const gameScore = useBreakoutStore((state) => state.game.score);
  const gameLives = useBreakoutStore((state) => state.game.lives);
  const gameLevel = useBreakoutStore((state) => state.game.level);
  const gameConfig = useBreakoutStore((state) => state.game.config);

  // エフェクト用ref（すべてrefで管理！）
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const bgParticlesRef = useRef<BgParticle[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const comboRef = useRef({ count: 0, lastHitTime: 0 });
  const prevBricksCountRef = useRef<number>(0);

  // 背景パーティクル初期化
  useEffect(() => {
    const config = useBreakoutStore.getState().game.config;
    const particles: BgParticle[] = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * config.canvasWidth,
        y: Math.random() * config.canvasHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.2 + 0.05,
      });
    }
    bgParticlesRef.current = particles;
  }, []);

  // 描画ループ
  useEffect(() => {
    let animationId: number;

    /**
     * パーティクル爆発を生成
     */
    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      count: number,
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2 + Math.random() * 4;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 2 + Math.random() * 4,
          life: 1,
        });
      }
    };

    /**
     * スコアポップアップを生成
     */
    const spawnScorePopup = (
      x: number,
      y: number,
      score: number,
      combo: number,
    ) => {
      scorePopupsRef.current.push({ x, y, score, combo, life: 1 });
    };

    /**
     * 画面シェイクを発動
     */
    const triggerShake = (intensity: number) => {
      shakeRef.current.intensity = Math.min(intensity, 8);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // ★ 毎フレーム最新の状態をストアから直接取得
      const game = useBreakoutStore.getState().game;
      const { paddle, ball, bricks, config } = game;

      // ブロック破壊検出
      const currentBricksCount = bricks.filter((b) => !b.destroyed).length;
      if (
        currentBricksCount < prevBricksCountRef.current &&
        game.state === 'playing'
      ) {
        const destroyedCount = prevBricksCountRef.current - currentBricksCount;

        // コンボ計算
        const now = Date.now();
        if (now - comboRef.current.lastHitTime < 1500) {
          comboRef.current.count += destroyedCount;
        } else {
          comboRef.current.count = destroyedCount;
        }
        comboRef.current.lastHitTime = now;

        // ボールに最も近い破壊済みブロックを見つける
        let closestBrick = null;
        let closestDist = Number.POSITIVE_INFINITY;
        for (const brick of bricks) {
          if (brick.destroyed) {
            const cx = brick.x + brick.width / 2;
            const cy = brick.y + brick.height / 2;
            const dist = Math.hypot(ball.x - cx, ball.y - cy);
            if (dist < closestDist) {
              closestDist = dist;
              closestBrick = brick;
            }
          }
        }

        // エフェクト発動（ボールに近いブロックで）
        if (closestBrick) {
          const cx = closestBrick.x + closestBrick.width / 2;
          const cy = closestBrick.y + closestBrick.height / 2;

          // パーティクル（コンボで増加）
          spawnParticles(
            cx,
            cy,
            closestBrick.color,
            10 + comboRef.current.count * 3,
          );

          // スコアポップアップ
          const baseScore = (config.brickRows - closestBrick.row) * 10;
          spawnScorePopup(cx, cy, baseScore, comboRef.current.count);

          // 画面シェイク
          triggerShake(2 + comboRef.current.count * 0.5);
        }
      }
      prevBricksCountRef.current = currentBricksCount;

      // 画面シェイク更新
      if (shakeRef.current.intensity > 0) {
        shakeRef.current.x =
          (Math.random() - 0.5) * shakeRef.current.intensity * 2;
        shakeRef.current.y =
          (Math.random() - 0.5) * shakeRef.current.intensity * 2;
        shakeRef.current.intensity *= 0.9;
        if (shakeRef.current.intensity < 0.1) {
          shakeRef.current.intensity = 0;
          shakeRef.current.x = 0;
          shakeRef.current.y = 0;
        }
      }

      // シェイク適用
      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // 背景グラデーション
      const bgGradient = ctx.createLinearGradient(0, 0, 0, config.canvasHeight);
      bgGradient.addColorStop(0, 'hsl(230, 30%, 8%)');
      bgGradient.addColorStop(1, 'hsl(260, 30%, 12%)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

      // 背景パーティクル
      for (const p of bgParticlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = config.canvasWidth;
        if (p.x > config.canvasWidth) p.x = 0;
        if (p.y < 0) p.y = config.canvasHeight;
        if (p.y > config.canvasHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, 70%, ${p.alpha})`;
        ctx.fill();
      }

      // グリッド線
      ctx.strokeStyle = 'hsla(180, 100%, 50%, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= config.canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, config.canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= config.canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(config.canvasWidth, y);
        ctx.stroke();
      }

      // ブロック（ネオングロー）
      for (const brick of bricks) {
        if (brick.destroyed) continue;

        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
        ctx.fill();

        // ハイライト
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'hsla(0, 0%, 100%, 0.35)';
        ctx.fillRect(brick.x + 2, brick.y + 1, brick.width - 4, 2);
      }
      ctx.shadowBlur = 0;

      // ボールトレイル
      if (game.state === 'playing') {
        trailRef.current.push({ x: ball.x, y: ball.y, life: 1 });
        if (trailRef.current.length > 12) {
          trailRef.current.shift();
        }
      }
      for (const t of trailRef.current) {
        t.life -= 0.08;
        if (t.life > 0) {
          ctx.beginPath();
          ctx.arc(t.x, t.y, ball.radius * t.life, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(45, 100%, 60%, ${t.life * 0.5})`;
          ctx.fill();
        }
      }
      trailRef.current = trailRef.current.filter((t) => t.life > 0);

      // パドル（超ネオン）
      ctx.shadowColor = 'hsl(180, 100%, 50%)';
      ctx.shadowBlur = 20;
      const paddleGradient = ctx.createLinearGradient(
        paddle.x,
        paddle.y,
        paddle.x,
        paddle.y + paddle.height,
      );
      paddleGradient.addColorStop(0, 'hsl(180, 100%, 70%)');
      paddleGradient.addColorStop(0.5, 'hsl(180, 100%, 50%)');
      paddleGradient.addColorStop(1, 'hsl(180, 100%, 40%)');
      ctx.fillStyle = paddleGradient;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
      ctx.fill();

      // パドル装飾ライン
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'hsla(180, 100%, 80%, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(paddle.x + 8, paddle.y + paddle.height / 2);
      ctx.lineTo(paddle.x + paddle.width - 8, paddle.y + paddle.height / 2);
      ctx.stroke();

      // ボール（超グロー）
      ctx.shadowColor = 'hsl(45, 100%, 60%)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      const ballGradient = ctx.createRadialGradient(
        ball.x - 2,
        ball.y - 2,
        0,
        ball.x,
        ball.y,
        ball.radius,
      );
      ballGradient.addColorStop(0, 'hsl(45, 100%, 95%)');
      ballGradient.addColorStop(0.5, 'hsl(45, 100%, 60%)');
      ballGradient.addColorStop(1, 'hsl(35, 100%, 50%)');
      ctx.fillStyle = ballGradient;
      ctx.fill();
      ctx.shadowBlur = 0;

      // パーティクル
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // 重力
        p.life -= 0.025;
        p.size *= 0.97;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // スコアポップアップ
      for (let i = scorePopupsRef.current.length - 1; i >= 0; i--) {
        const popup = scorePopupsRef.current[i];
        popup.y -= 1.5;
        popup.life -= 0.02;

        if (popup.life <= 0) {
          scorePopupsRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = popup.life;
        const fontSize = 12 + popup.combo * 2;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';

        // コンボカラー
        const hue = popup.combo > 1 ? 45 + popup.combo * 20 : 45;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 8;

        const text =
          popup.combo > 1
            ? `+${popup.score * popup.combo} x${popup.combo}!`
            : `+${popup.score}`;
        ctx.fillText(text, popup.x, popup.y);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // コンボ表示（画面上部）
      if (
        comboRef.current.count > 1 &&
        Date.now() - comboRef.current.lastHitTime < 2000
      ) {
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        const comboHue = 45 + comboRef.current.count * 15;
        ctx.fillStyle = `hsl(${comboHue}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${comboHue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.fillText(
          `${comboRef.current.count} COMBO!`,
          config.canvasWidth / 2,
          config.canvasHeight - 80,
        );
        ctx.shadowBlur = 0;
      }

      // ゲームオーバー/勝利
      if (game.state === 'gameOver' || game.state === 'victory') {
        ctx.fillStyle = 'hsla(0, 0%, 0%, 0.85)';
        ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        const isVictory = game.state === 'victory';
        ctx.shadowColor = isVictory ? 'hsl(120, 70%, 60%)' : 'hsl(0, 80%, 60%)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = isVictory ? 'hsl(120, 70%, 60%)' : 'hsl(0, 80%, 60%)';
        ctx.fillText(
          isVictory ? '🎉 VICTORY!' : '💀 GAME OVER',
          config.canvasWidth / 2,
          config.canvasHeight / 2 - 40,
        );

        ctx.shadowBlur = 10;
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = 'hsl(45, 100%, 60%)';
        ctx.fillText(
          `Score: ${game.score}`,
          config.canvasWidth / 2,
          config.canvasHeight / 2 + 10,
        );

        ctx.shadowBlur = 0;
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'hsl(180, 100%, 70%)';
        ctx.fillText(
          'タップしてリトライ',
          config.canvasWidth / 2,
          config.canvasHeight / 2 + 50,
        );
      }

      // 一時停止
      if (game.state === 'paused') {
        ctx.fillStyle = 'hsla(0, 0%, 0%, 0.6)';
        ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'hsl(45, 100%, 60%)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'hsl(45, 100%, 60%)';
        ctx.fillText(
          '⏸ PAUSED',
          config.canvasWidth / 2,
          config.canvasHeight / 2,
        );
        ctx.shadowBlur = 0;
      }

      // 準備完了
      if (game.state === 'ready') {
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'hsl(180, 100%, 70%)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'hsl(180, 100%, 70%)';
        ctx.fillText(
          'タップしてスタート',
          config.canvasWidth / 2,
          config.canvasHeight / 2,
        );
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // キーボードイベント
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }
      handleKeyDown(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => handleKeyUp(e.key);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  /**
   * タッチ/マウス移動
   */
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const config = useBreakoutStore.getState().game.config;
    const scale = rect.width / config.canvasWidth;
    handlePointerMove(e.clientX, rect.left, scale);
  };

  /**
   * キャンバスタップ
   */
  const onCanvasTap = () => {
    const currentState = useBreakoutStore.getState().game.state;
    if (currentState === 'playing') {
      pause();
    } else {
      start();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full max-w-2xl px-2">
      {/* スコアとライフ（キャンバス幅に合わせる） */}
      <div className="flex justify-between items-center w-full max-w-[min(100%,50vh*0.625)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            {gameScore}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              pts
            </span>
          </span>
          <span className="text-base text-muted-foreground">
            Lv.{gameLevel}
          </span>
        </div>
        <div className="flex items-center text-xl">
          {'❤️'.repeat(gameLives)}
          <span className="opacity-20">
            {'❤️'.repeat(Math.max(0, gameConfig.lives - gameLives))}
          </span>
        </div>
      </div>

      {/* キャンバス（画面いっぱいに拡大） */}
      <canvas
        ref={canvasRef}
        width={gameConfig.canvasWidth}
        height={gameConfig.canvasHeight}
        onPointerMove={onPointerMove}
        onPointerDown={onCanvasTap}
        className={cn(
          // 高さベースでサイズを決定（縦長レイアウト）
          'h-full max-h-[70vh] w-auto',
          'rounded-xl border-2 border-primary/50',
          'shadow-[0_0_40px_rgba(0,255,255,0.4),inset_0_0_30px_rgba(0,255,255,0.15)]',
          'touch-none select-none',
          'cursor-pointer sm:cursor-none',
        )}
        style={{
          aspectRatio: `${gameConfig.canvasWidth} / ${gameConfig.canvasHeight}`,
        }}
      />

      {/* ボタン */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => (gameState === 'playing' ? pause() : start())}
          variant={gameState === 'playing' ? 'outline' : 'default'}
          size="lg"
          className={cn(
            'min-w-[120px] h-11 text-base',
            'active:scale-95 transition-transform',
            'shadow-[0_0_15px_rgba(0,255,255,0.2)]',
          )}
        >
          {gameState === 'playing'
            ? '⏸ ポーズ'
            : gameState === 'paused'
              ? '▶️ 再開'
              : '▶️ スタート'}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          size="lg"
          className="min-w-[120px] h-11 text-base active:scale-95 transition-transform"
        >
          🔄 リセット
        </Button>
      </div>
    </div>
  );
};
