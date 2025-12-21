/**
 * ブロック崩しp5.jsスケッチ
 * @description WebGLモードで3D演出 + サウンド + グリッチエフェクト
 *
 * リファクタリング後: 各描画処理を sketch/ 配下のモジュールに分離
 */

import type { P5Instance, P5Sketch } from '@/components/P5Canvas';
import type { ItemType } from '@/schemas/breakout';
import { useBreakoutStore } from '@/stores/breakoutStore';
import {
  addTrailPoint,
  createEffectState,
  drawBallSpawnEffect,
  drawParticles,
  drawShockwaves,
  drawTrail,
  spawnItemCollectEffect,
  spawnParticles,
  spawnScorePopup,
  spawnShockwave,
  startBallSpawnEffect,
  triggerShake,
  updateEffectState,
} from './sketch/effects/index.js';
import {
  drawBackground,
  drawBall,
  drawBricks,
  drawComboDisplay,
  drawGameEndOverlay,
  drawGlitchNoise,
  drawItemCollectEffects,
  drawItemIcons,
  drawItems3D,
  drawPaddle,
  drawPausedOverlay,
  drawPowerUpStatus,
  drawReadyScreen,
  drawScorePopups,
} from './sketch/renderers/index.js';
// スケッチモジュール
import type { EffectState } from './sketch/types/index.js';
import { toWebGL } from './sketch/utils/webglUtils.js';

// サウンド
import {
  playComboSound,
  playGameOverSound,
  playHitSound,
  playItemSound,
  playLifeLostSound,
  playStartSound,
  playVictorySound,
} from './soundManager';

/**
 * p5.jsブロック崩しスケッチを生成
 */
export const createBreakoutSketch = (): P5Sketch => {
  return (p: P5Instance) => {
    // エフェクト状態（setup時に初期化）
    let effects: EffectState;

    // 前フレームのブロック数（破壊検出用）
    let prevBricksCount = 0;

    // 前フレームのライフ数（ライフ減少検出用）
    let prevLives = 5;

    // 前フレームの状態（状態変化検出用）
    let prevState = 'ready';

    // 前フレームのアイテム情報（収集検出用）
    let prevItemsMap = new Map<string, ItemType>();

    // グラフィックスバッファ（2D UI用）
    // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
    let uiBuffer: any;

    // 時間（アニメーション用）
    let time = 0;

    /**
     * 初期設定
     */
    p.setup = () => {
      const config = useBreakoutStore.getState().game.config;
      p.createCanvas(config.canvasWidth, config.canvasHeight, p.WEBGL);
      p.pixelDensity(1);

      // UIバッファ（2D描画用）
      uiBuffer = p.createGraphics(config.canvasWidth, config.canvasHeight);

      // エフェクト状態を初期化
      effects = createEffectState(p, config.canvasWidth, config.canvasHeight);

      // フレームレート設定
      p.frameRate(60);

      // 初期ライフを記録
      prevLives = useBreakoutStore.getState().game.lives;
    };

    /**
     * 描画ループ
     */
    p.draw = () => {
      const game = useBreakoutStore.getState().game;
      const { paddle, ball, extraBalls, bricks, items, powerUps, config } =
        game;

      // 時間を更新
      time += p.deltaTime * 0.001;

      // ===== 状態変化検出 =====
      detectStateChanges(game);

      // ===== エフェクト状態更新 =====
      updateEffectState(p, effects, p.deltaTime);

      // ===== ボールトレイル追加 =====
      if (game.state === 'playing') {
        addTrailPoint(
          effects.trail,
          ball.x,
          ball.y,
          15 + extraBalls.length * 10,
        );
        for (const eb of extraBalls) {
          addTrailPoint(effects.trail, eb.x, eb.y, 15 + extraBalls.length * 10);
        }
      }

      // ===== 3D描画開始 =====
      p.push();
      p.translate(effects.shake.x, effects.shake.y, 0);

      // 背景 🎄 クリスマス仕様
      drawBackground(
        p,
        effects.stars,
        effects.scanlines,
        effects.snowflakes,
        effects.christmasLights,
        effects.glitch,
        config.canvasWidth,
        config.canvasHeight,
        time,
      );

      // ブロック
      drawBricks(
        p,
        bricks,
        effects.glitch,
        config.canvasWidth,
        config.canvasHeight,
      );

      // 衝撃波
      drawShockwaves(
        p,
        effects.shockwaves,
        config.canvasWidth,
        config.canvasHeight,
      );

      // ボールトレイル
      drawTrail(
        p,
        effects.trail,
        ball.radius,
        effects.glitch.chromatic,
        config.canvasWidth,
        config.canvasHeight,
      );

      // パドル
      drawPaddle(p, paddle, config.canvasWidth, config.canvasHeight);

      // ボール出現演出 🎄
      if (effects.ballSpawnEffect && !effects.ballSpawnEffect.completed) {
        drawBallSpawnEffect(
          p,
          effects.ballSpawnEffect,
          ball.x,
          ball.y,
          config.canvasWidth,
          config.canvasHeight,
          time,
        );
      }

      // メインボール
      const [ballX, ballY] = toWebGL(
        ball.x,
        ball.y,
        config.canvasWidth,
        config.canvasHeight,
      );
      const spawnScale = effects.ballSpawnEffect
        ? Math.min(1, effects.ballSpawnEffect.progress * 1.5)
        : 1;
      const spawnPulse = effects.ballSpawnEffect
        ? 1 +
          Math.sin(effects.ballSpawnEffect.progress * Math.PI * 6) *
            0.15 *
            (1 - effects.ballSpawnEffect.progress)
        : 1;

      drawBall(p, ballX, ballY, ball.radius, {
        spawnScale,
        spawnPulse,
        isPiercing: powerUps.some((pu) => pu.type === 'piercingBall'),
        time,
        glitchChromatic: effects.glitch.chromatic,
      });

      // 追加ボール
      for (const extraBall of extraBalls) {
        const [exX, exY] = toWebGL(
          extraBall.x,
          extraBall.y,
          config.canvasWidth,
          config.canvasHeight,
        );
        drawBall(p, exX, exY, extraBall.radius, {
          isPiercing: powerUps.some((pu) => pu.type === 'piercingBall'),
          time,
          glitchChromatic: effects.glitch.chromatic,
        });
      }

      // ドロップアイテム（3D）
      drawItems3D(p, items, time, config.canvasWidth, config.canvasHeight);

      // パーティクル
      drawParticles(
        p,
        effects.particles,
        config.canvasWidth,
        config.canvasHeight,
      );

      p.pop(); // シェイク終了

      // ===== 2D UI描画（オーバーレイ） =====
      uiBuffer.clear();

      // グリッチノイズ
      drawGlitchNoise(
        uiBuffer,
        p,
        effects.glitch,
        config.canvasWidth,
        config.canvasHeight,
      );

      // アイテムアイコン
      drawItemIcons(uiBuffer, p, items, time);

      // スコアポップアップ
      drawScorePopups(uiBuffer, p, effects.scorePopups);

      // コンボ表示
      drawComboDisplay(
        uiBuffer,
        p,
        effects.combo,
        config.canvasWidth,
        config.canvasHeight,
      );

      // パワーアップステータス
      drawPowerUpStatus(uiBuffer, powerUps, config.canvasHeight);

      // アイテム収集エフェクト
      drawItemCollectEffects(
        uiBuffer,
        p,
        effects.itemCollectEffects,
        config.canvasWidth,
        config.canvasHeight,
      );

      // ゲーム状態に応じたオーバーレイ
      drawGameEndOverlay(
        uiBuffer,
        p,
        game.state,
        game.score,
        config.canvasWidth,
        config.canvasHeight,
      );

      if (game.state === 'paused') {
        drawPausedOverlay(uiBuffer, p, config.canvasWidth, config.canvasHeight);
      }

      if (game.state === 'ready') {
        drawReadyScreen(uiBuffer, p, config.canvasWidth, config.canvasHeight);
      }

      // UIバッファを描画
      p.push();
      p.resetMatrix();
      p.translate(-config.canvasWidth / 2, -config.canvasHeight / 2, 100);
      p.image(uiBuffer, 0, 0);
      p.pop();
    };

    /**
     * 状態変化を検出してエフェクト・サウンドをトリガー
     */
    const detectStateChanges = (
      game: ReturnType<typeof useBreakoutStore.getState>['game'],
    ): void => {
      const { ball, bricks, items, config } = game;

      // ゲーム状態変化
      if (prevState !== game.state) {
        handleStateChange(game.state, prevState, ball);
        prevState = game.state;
      }

      // ライフ減少検出
      if (game.lives < prevLives && game.state !== 'gameOver') {
        playLifeLostSound();
        triggerShake(effects, 8);
      }
      prevLives = game.lives;

      // アイテム収集検出
      detectItemCollection(items);

      // ブロック破壊検出
      detectBrickDestruction(game, bricks, ball, config);
    };

    /**
     * ゲーム状態変化時の処理
     */
    const handleStateChange = (
      newState: string,
      oldState: string,
      ball: { x: number; y: number },
    ): void => {
      if (
        newState === 'playing' &&
        (oldState === 'ready' || oldState === 'levelClear')
      ) {
        playStartSound();
        startBallSpawnEffect(effects, ball.x, ball.y);
      } else if (newState === 'gameOver') {
        playGameOverSound();
        effects.glitch.intensity = 1;
        effects.glitch.chromatic = 5;
      } else if (newState === 'victory' || newState === 'levelClear') {
        playVictorySound();
      }
    };

    /**
     * アイテム収集を検出
     */
    const detectItemCollection = (
      items: Array<{ id: string; type: ItemType }>,
    ): void => {
      const currentItemIds = new Set(items.map((i) => i.id));
      for (const [prevId, prevType] of prevItemsMap) {
        if (!currentItemIds.has(prevId)) {
          playItemSound();
          spawnItemCollectEffect(effects.itemCollectEffects, prevType);
          triggerShake(effects, 2);
        }
      }
      prevItemsMap = new Map(items.map((i) => [i.id, i.type]));
    };

    /**
     * ブロック破壊を検出
     * @description パフォーマンス最適化: 破壊数のカウントを効率化、エフェクトを制限
     */
    const detectBrickDestruction = (
      game: ReturnType<typeof useBreakoutStore.getState>['game'],
      bricks: Array<{
        destroyed: boolean;
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
        row: number;
      }>,
      ball: { x: number; y: number },
      config: { brickRows: number },
    ): void => {
      // 破壊数を効率的にカウント（reduceで1回のループ）
      let currentBricksCount = 0;
      for (const b of bricks) {
        if (!b.destroyed) currentBricksCount++;
      }

      const destroyedCount = prevBricksCount - currentBricksCount;

      if (destroyedCount > 0 && game.state === 'playing') {
        const now = Date.now();
        if (now - effects.combo.lastHitTime < 1500) {
          effects.combo.count += destroyedCount; // 複数破壊時はコンボを加算
        } else {
          effects.combo.count = destroyedCount;
        }
        effects.combo.lastHitTime = now;

        // サウンド再生（スロットリングされるので頻繁に呼んでもOK）
        const pitch = 0.8 + Math.min(effects.combo.count * 0.08, 0.8);
        playHitSound(pitch);
        if (effects.combo.count > 1) {
          playComboSound(effects.combo.count);
        }

        // 破壊されたブロックのエフェクト（最大3つまで）
        let effectCount = 0;
        const maxEffects = 3;

        for (const brick of bricks) {
          if (effectCount >= maxEffects) break;

          if (brick.destroyed) {
            const cx = brick.x + brick.width / 2;
            const cy = brick.y + brick.height / 2;
            const dist = Math.sqrt((ball.x - cx) ** 2 + (ball.y - cy) ** 2);
            if (dist < 120) {
              // パーティクル数を固定値に（コンボで増やさない）
              spawnParticles(
                p,
                effects.particles,
                cx,
                cy,
                brick.color,
                10,
              );
              spawnShockwave(effects.shockwaves, cx, cy, brick.color);

              // 最初の1つだけスコアポップアップ
              if (effectCount === 0) {
                const baseScore = (config.brickRows - brick.row) * 10 * destroyedCount;
                spawnScorePopup(
                  effects.scorePopups,
                  cx,
                  cy,
                  baseScore,
                  effects.combo.count,
                );
              }

              effectCount++;
            }
          }
        }

        // シェイクは1回だけ（強度は破壊数に応じて）
        triggerShake(effects, Math.min(3 + destroyedCount, 8));
      }
      prevBricksCount = currentBricksCount;
    };

    /**
     * CSSスケーリングを考慮したマウス座標をゲーム座標に変換
     */
    const getScaledMouseX = (): number => {
      const config = useBreakoutStore.getState().game.config;
      const canvas = p.canvas as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      // 表示サイズと論理サイズの比率でスケーリング
      const scale = rect.width / config.canvasWidth;
      return p.mouseX / scale;
    };

    /**
     * マウス移動
     */
    p.mouseMoved = () => {
      const game = useBreakoutStore.getState().game;
      if (game.state !== 'playing' && game.state !== 'ready') return;

      const targetX = getScaledMouseX();
      useBreakoutStore.getState().handlePointerMove(targetX, 0, 1);
    };

    /**
     * マウスドラッグ（タッチ対応）
     */
    p.mouseDragged = () => {
      const game = useBreakoutStore.getState().game;
      if (game.state !== 'playing' && game.state !== 'ready') return;

      const targetX = getScaledMouseX();
      useBreakoutStore.getState().handlePointerMove(targetX, 0, 1);
      return false; // デフォルト動作を防止
    };

    /**
     * クリック/タップ
     */
    p.mousePressed = () => {
      const game = useBreakoutStore.getState().game;
      if (game.state === 'playing') {
        useBreakoutStore.getState().pause();
      } else {
        useBreakoutStore.getState().start();
      }
    };

    /**
     * キーボード入力
     */
    p.keyPressed = () => {
      useBreakoutStore.getState().handleKeyDown(p.key);
      if (p.key === ' ' || p.key === 'ArrowLeft' || p.key === 'ArrowRight') {
        return false; // デフォルト動作を防止
      }
    };

    p.keyReleased = () => {
      useBreakoutStore.getState().handleKeyUp(p.key);
    };
  };
};
