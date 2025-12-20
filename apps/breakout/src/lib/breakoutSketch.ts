import { useBreakoutStore } from '@/stores/breakoutStore';
import type { P5Instance, P5Sketch } from '@/components/P5Canvas';
import type { ItemType } from '@/schemas/breakout';
import {
  playHitSound,
  playComboSound,
  playGameOverSound,
  playVictorySound,
  playStartSound,
  playLifeLostSound,
  playItemSound,
} from './soundManager';

/**
 * パーティクル（3D破片）
 */
interface Particle3D {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
  size: number;
  rotSpeed: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  life: number;
}

/**
 * 衝撃波エフェクト
 */
interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: { r: number; g: number; b: number };
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
  scale: number;
}

/**
 * トレイルポイント
 */
interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

/**
 * 背景星
 */
interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

/**
 * スキャンライン
 */
interface Scanline {
  y: number;
  speed: number;
  alpha: number;
}

/**
 * アイテム収集エフェクト（画面中央に効果名表示）
 */
interface ItemCollectEffect {
  type: ItemType;
  life: number;
  scale: number;
}

/**
 * ボール出現演出タイプ
 * - beam: パドルから光の柱がチャージしてボール形成
 * - impact: 衝撃波と共にドンと出現
 * - lightning: 稲妻が落ちてボール出現
 */
type SpawnEffectType = 'beam' | 'impact' | 'lightning';

/**
 * ボール出現演出の状態
 */
interface BallSpawnEffect {
  /** 演出タイプ */
  type: SpawnEffectType;
  /** 進行度（0〜1） */
  progress: number;
  /** ボール位置 */
  ballX: number;
  ballY: number;
  /** 稲妻用のジグザグポイント */
  lightningPoints: Array<{ x: number; y: number }>;
  /** 演出が完了したか */
  completed: boolean;
}

/**
 * アイテムの色設定
 */
const ITEM_COLORS: Record<ItemType, { r: number; g: number; b: number }> = {
  expandPaddle: { r: 50, g: 150, b: 255 }, // 🔲 青
  shrinkPaddle: { r: 180, g: 50, b: 255 }, // 🔹 紫
  piercingBall: { r: 255, g: 100, b: 50 }, // 🔥 オレンジレッド
  slowBall: { r: 50, g: 220, b: 100 }, // 🐢 緑
  extraLife: { r: 255, g: 100, b: 150 }, // 💖 ピンク
  speedUp: { r: 255, g: 220, b: 50 }, // ⚡ 黄色
  multiBall: { r: 100, g: 200, b: 255 }, // 🎱 水色
};

/**
 * アイテムのアイコン（絵文字で一目瞭然！）
 */
const ITEM_ICONS: Record<ItemType, string> = {
  expandPaddle: '🔲', // パドル拡張
  shrinkPaddle: '🔹', // パドル縮小
  piercingBall: '🔥', // 貫通ボール
  slowBall: '🐢', // スローボール
  extraLife: '💖', // ライフ+1
  speedUp: '⚡', // スピードアップ
  multiBall: '🎱', // マルチボール
};

/**
 * アイテムの効果名（日本語表示用）
 */
const ITEM_NAMES: Record<ItemType, string> = {
  expandPaddle: 'パドル拡張！',
  shrinkPaddle: 'パドル縮小...',
  piercingBall: '貫通ボール！',
  slowBall: 'スローダウン',
  extraLife: 'ライフ+1！',
  speedUp: 'スピードアップ！',
  multiBall: 'マルチボール！',
};

/**
 * HSL文字列からRGBを抽出
 */
const parseHslColor = (
  hslStr: string,
): { r: number; g: number; b: number } | null => {
  const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return null;

  const h = Number.parseInt(match[1]) / 360;
  const s = Number.parseInt(match[2]) / 100;
  const l = Number.parseInt(match[3]) / 100;

  // HSL to RGB conversion
  const hue2rgb = (pv: number, qv: number, tv: number): number => {
    const tt = tv < 0 ? tv + 1 : tv > 1 ? tv - 1 : tv;
    if (tt < 1 / 6) return pv + (qv - pv) * 6 * tt;
    if (tt < 1 / 2) return qv;
    if (tt < 2 / 3) return pv + (qv - pv) * (2 / 3 - tt) * 6;
    return pv;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const pv = 2 * l - q;

  return {
    r: Math.round(hue2rgb(pv, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(pv, q, h) * 255),
    b: Math.round(hue2rgb(pv, q, h - 1 / 3) * 255),
  };
};

/**
 * p5.jsブロック崩しスケッチを生成
 * WebGLモードで3D演出 + サウンド + グリッチエフェクト
 */
export const createBreakoutSketch = (): P5Sketch => {
  return (p: P5Instance) => {
    // エフェクト用変数
    const particles: Particle3D[] = [];
    const shockwaves: Shockwave[] = [];
    const scorePopups: ScorePopup[] = [];
    const trail: TrailPoint[] = [];
    const stars: Star[] = [];
    const scanlines: Scanline[] = [];
    const itemCollectEffects: ItemCollectEffect[] = [];

    // 画面シェイク
    const shake = { x: 0, y: 0, intensity: 0 };

    // グリッチエフェクト
    const glitch = { intensity: 0, chromatic: 0 };

    // コンボ追跡
    const combo = { count: 0, lastHitTime: 0 };

    // ボール出現演出
    let ballSpawnEffect: BallSpawnEffect | null = null;
    const spawnEffectTypes: SpawnEffectType[] = ['beam', 'impact', 'lightning'];

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

    // 時間（グリッチアニメーション用）
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

      // 背景の星を生成
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: p.random(-config.canvasWidth, config.canvasWidth),
          y: p.random(-config.canvasHeight, config.canvasHeight),
          z: p.random(-500, 0),
          size: p.random(1, 3),
        });
      }

      // スキャンラインを生成
      for (let i = 0; i < 5; i++) {
        scanlines.push({
          y: p.random(config.canvasHeight),
          speed: p.random(2, 5),
          alpha: p.random(0.02, 0.08),
        });
      }

      // フレームレート設定
      p.frameRate(60);

      // 初期ライフを記録
      prevLives = useBreakoutStore.getState().game.lives;
    };

    /**
     * パーティクル爆発を生成
     */
    const spawnParticles = (
      x: number,
      y: number,
      colorStr: string,
      count: number,
    ) => {
      const rgb = parseHslColor(colorStr) || { r: 255, g: 255, b: 255 };
      for (let i = 0; i < count; i++) {
        const angle = p.random(p.TWO_PI);
        const speed = p.random(2, 8);
        const particle: Particle3D = {
          pos: { x, y, z: p.random(-20, 20) },
          vel: {
            x: p.cos(angle) * speed,
            y: p.sin(angle) * speed,
            z: p.random(-3, 3),
          },
          color: rgb,
          size: p.random(4, 12),
          rotSpeed: {
            x: p.random(-0.2, 0.2),
            y: p.random(-0.2, 0.2),
            z: p.random(-0.2, 0.2),
          },
          rotation: {
            x: p.random(p.TWO_PI),
            y: p.random(p.TWO_PI),
            z: p.random(p.TWO_PI),
          },
          life: 1,
        };
        particles.push(particle);
      }
    };

    /**
     * 衝撃波を生成
     */
    const spawnShockwave = (x: number, y: number, colorStr: string) => {
      const rgb = parseHslColor(colorStr) || { r: 255, g: 255, b: 255 };
      shockwaves.push({
        x,
        y,
        radius: 0,
        maxRadius: 80,
        alpha: 1,
        color: rgb,
      });
    };

    /**
     * スコアポップアップを生成
     */
    const spawnScorePopup = (
      x: number,
      y: number,
      score: number,
      comboCount: number,
    ) => {
      scorePopups.push({
        x,
        y,
        score,
        combo: comboCount,
        life: 1,
        scale: 0,
      });
    };

    /**
     * 画面シェイクを発動
     */
    const triggerShake = (intensity: number) => {
      shake.intensity = p.min(intensity, 12);
      // グリッチもトリガー
      glitch.intensity = p.min(intensity * 0.3, 1);
      glitch.chromatic = p.min(intensity * 0.5, 3);
    };

    /**
     * アイテム収集エフェクトを生成（画面中央に効果名表示）
     */
    const spawnItemCollectEffect = (type: ItemType) => {
      itemCollectEffects.push({
        type,
        life: 1,
        scale: 0,
      });
    };

    /**
     * 座標変換: ゲーム座標 → WebGL座標
     * WebGLは中心が原点なので変換が必要
     */
    const toWebGL = (x: number, y: number): [number, number] => {
      const config = useBreakoutStore.getState().game.config;
      return [x - config.canvasWidth / 2, y - config.canvasHeight / 2];
    };

    /**
     * ボール出現演出を開始
     * @param ballX - ボールのX座標
     * @param ballY - ボールのY座標
     */
    const startBallSpawnEffect = (ballX: number, ballY: number) => {
      const effectType =
        spawnEffectTypes[Math.floor(Math.random() * spawnEffectTypes.length)];

      // 稲妻用のジグザグポイント生成
      const lightningPoints: Array<{ x: number; y: number }> = [];
      if (effectType === 'lightning') {
        const segments = 8;
        const startY = ballY - 300;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const offsetX = i === 0 || i === segments ? 0 : (Math.random() - 0.5) * 60;
          lightningPoints.push({
            x: ballX + offsetX,
            y: startY + (ballY - startY) * t,
          });
        }
      }

      ballSpawnEffect = {
        type: effectType,
        progress: 0,
        ballX,
        ballY,
        lightningPoints,
        completed: false,
      };
    };

    /**
     * ボール出現演出を更新・描画
     */
    const updateAndDrawBallSpawnEffect = (ballX: number, ballY: number) => {
      if (!ballSpawnEffect) return;

      const effect = ballSpawnEffect;
      const [bx, by] = toWebGL(ballX, ballY);

      // 演出の進行（0.5秒で完了）
      effect.progress += p.deltaTime * 0.001 * 2.2;
      if (effect.progress >= 1) {
        effect.completed = true;
        ballSpawnEffect = null;
        return;
      }

      const t = effect.progress;
      // イージング
      const easeOut = 1 - Math.pow(1 - t, 4);

      // ======== BEAM: 光の柱がチャージしてボール形成 ========
      if (effect.type === 'beam') {
        const chargePhase = Math.min(t * 2, 1); // 前半でチャージ
        const formPhase = Math.max(0, (t - 0.5) * 2); // 後半で収束

        // 光の柱（下から上へ）
        const beamHeight = 150 * chargePhase;
        const beamWidth = 30 - formPhase * 25;
        const beamAlpha = (1 - formPhase * 0.7) * 255;

        // ビーム本体
        p.push();
        p.translate(bx, by + beamHeight / 2, 15);
        p.noStroke();
        p.fill(255, 220, 50, beamAlpha * 0.8);
        p.box(beamWidth, beamHeight, 5);
        p.pop();

        // ビームの光芒（左右）
        p.push();
        p.translate(bx, by + beamHeight / 2, 12);
        p.noStroke();
        p.fill(255, 180, 50, beamAlpha * 0.3);
        p.box(beamWidth * 2, beamHeight, 3);
        p.pop();

        // チャージリング（ビームの根元）
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
          const ringT = (t * 3 + i * 0.3) % 1;
          const ringY = by + ringT * beamHeight;
          const ringSize = 40 * (1 - ringT * 0.5) * chargePhase;
          const ringAlpha = (1 - ringT) * 200 * chargePhase;

          p.push();
          p.translate(bx, ringY - by, 20);
          p.noFill();
          p.stroke(255, 255, 200, ringAlpha);
          p.strokeWeight(3);
          p.ellipse(0, 0, ringSize, ringSize);
          p.pop();
        }

        // 形成時の輝き
        if (formPhase > 0) {
          const flashAlpha = Math.sin(formPhase * Math.PI) * 255;
          p.push();
          p.translate(bx, by, 25);
          p.noStroke();
          p.fill(255, 255, 255, flashAlpha);
          p.sphere(20 * formPhase);
          p.pop();
        }
      }

      // ======== IMPACT: 衝撃波と共にドンと出現 ========
      else if (effect.type === 'impact') {
        // 出現フラッシュ（最初の瞬間）
        if (t < 0.2) {
          const flashIntensity = 1 - t / 0.2;
          p.push();
          p.translate(bx, by, 30);
          p.noStroke();
          p.fill(255, 255, 255, flashIntensity * 255);
          p.sphere(50 * flashIntensity + 10);
          p.pop();
        }

        // 衝撃波リング（複数）
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
          const waveDelay = i * 0.15;
          const waveT = Math.max(0, t - waveDelay);
          if (waveT <= 0) continue;

          const waveProgress = Math.min(waveT * 1.5, 1);
          const waveRadius = waveProgress * 120;
          const waveAlpha = (1 - waveProgress) * 255;
          const waveThickness = 4 - waveProgress * 2;

          p.push();
          p.translate(bx, by, 18 - i * 3);
          p.noFill();
          p.stroke(255, 200, 50, waveAlpha);
          p.strokeWeight(waveThickness);
          p.ellipse(0, 0, waveRadius * 2, waveRadius * 2);
          p.pop();
        }

        // 六角形の衝撃エフェクト
        const hexProgress = easeOut;
        const hexSize = 80 * hexProgress;
        const hexAlpha = (1 - hexProgress * 0.8) * 200;
        const hexRotation = t * Math.PI * 2;

        p.push();
        p.translate(bx, by, 22);
        p.rotateZ(hexRotation);
        p.noFill();
        p.stroke(255, 220, 100, hexAlpha);
        p.strokeWeight(2);
        p.beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          p.vertex(Math.cos(angle) * hexSize, Math.sin(angle) * hexSize);
        }
        p.endShape(p.CLOSE);
        p.pop();

        // 中央の爆発コア
        const coreSize = 15 * (1 + Math.sin(t * Math.PI * 4) * 0.3);
        p.push();
        p.translate(bx, by, 25);
        p.noStroke();
        p.fill(255, 150, 50, 200 * easeOut);
        p.sphere(coreSize);
        p.pop();
      }

      // ======== LIGHTNING: 稲妻が落ちてボール出現 ========
      else if (effect.type === 'lightning') {
        const strikePhase = Math.min(t * 3, 1); // 稲妻が落ちる
        const flashPhase = t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.7);

        // 稲妻を描画
        if (strikePhase > 0 && effect.lightningPoints.length > 1) {
          const drawCount = Math.floor(effect.lightningPoints.length * strikePhase);

          // メイン稲妻（太い）
          p.push();
          p.stroke(255, 255, 255, 255);
          p.strokeWeight(4);
          p.noFill();
          p.beginShape();
          for (let i = 0; i <= drawCount && i < effect.lightningPoints.length; i++) {
            const pt = effect.lightningPoints[i];
            const [lx, ly] = toWebGL(pt.x, pt.y);
            p.vertex(lx, ly, 25);
          }
          p.endShape();
          p.pop();

          // グロー稲妻（太くて薄い）
          p.push();
          p.stroke(200, 220, 255, 100);
          p.strokeWeight(12);
          p.noFill();
          p.beginShape();
          for (let i = 0; i <= drawCount && i < effect.lightningPoints.length; i++) {
            const pt = effect.lightningPoints[i];
            const [lx, ly] = toWebGL(pt.x, pt.y);
            p.vertex(lx, ly, 20);
          }
          p.endShape();
          p.pop();

          // 分岐稲妻（細い）
          if (drawCount > 2) {
            p.push();
            p.stroke(180, 200, 255, 150);
            p.strokeWeight(2);
            const branchPoint = effect.lightningPoints[Math.floor(drawCount / 2)];
            const [bpx, bpy] = toWebGL(branchPoint.x, branchPoint.y);
            p.line(bpx, bpy, 22, bpx + 40, bpy + 30, 22);
            p.line(bpx, bpy, 22, bpx - 35, bpy + 25, 22);
            p.pop();
          }
        }

        // 着弾フラッシュ
        if (strikePhase >= 1) {
          const impactT = (t - 0.33) / 0.67;
          const impactRadius = impactT * 60;
          const impactAlpha = (1 - impactT) * 255;

          // 白いフラッシュ
          p.push();
          p.translate(bx, by, 25);
          p.noStroke();
          p.fill(255, 255, 255, impactAlpha * flashPhase);
          p.sphere(20 + impactT * 10);
          p.pop();

          // 電撃リング
          p.push();
          p.translate(bx, by, 20);
          p.noFill();
          p.stroke(150, 200, 255, impactAlpha * 0.8);
          p.strokeWeight(3);
          p.ellipse(0, 0, impactRadius * 2, impactRadius * 2);
          p.pop();
        }
      }
    };

    /**
     * 描画ループ
     */
    p.draw = () => {
      const game = useBreakoutStore.getState().game;
      const { paddle, ball, extraBalls, bricks, items, powerUps, config } = game;

      // 時間を更新
      time += p.deltaTime * 0.001;

      // 状態変化検出
      if (prevState !== game.state) {
        if (game.state === 'playing' && prevState === 'ready') {
          playStartSound();
          // ボール出現演出を開始
          startBallSpawnEffect(ball.x, ball.y);
        } else if (game.state === 'playing' && prevState === 'levelClear') {
          // 次のレベル開始時も出現演出
          playStartSound();
          startBallSpawnEffect(ball.x, ball.y);
        } else if (game.state === 'gameOver') {
          playGameOverSound();
          glitch.intensity = 1;
          glitch.chromatic = 5;
        } else if (game.state === 'victory' || game.state === 'levelClear') {
          playVictorySound();
        }
        prevState = game.state;
      }

      // ライフ減少検出
      if (game.lives < prevLives && game.state !== 'gameOver') {
        playLifeLostSound();
        triggerShake(8);
      }
      prevLives = game.lives;

      // アイテム収集検出
      const currentItemIds = new Set(items.map((i) => i.id));
      for (const [prevId, prevType] of prevItemsMap) {
        if (!currentItemIds.has(prevId)) {
          // アイテムが消えた = 収集 or 画面外
          // サウンドとエフェクトを出す（収集時のみ表示されるのでOK）
          playItemSound();
          spawnItemCollectEffect(prevType);
          triggerShake(2);
        }
      }
      // 現在のアイテム情報を保存
      prevItemsMap = new Map(items.map((i) => [i.id, i.type]));

      // ブロック破壊検出
      const currentBricksCount = bricks.filter(
        (b: { destroyed: boolean }) => !b.destroyed,
      ).length;
      if (currentBricksCount < prevBricksCount && game.state === 'playing') {
        const now = Date.now();
        if (now - combo.lastHitTime < 1500) {
          combo.count++;
        } else {
          combo.count = 1;
        }
        combo.lastHitTime = now;

        // サウンド再生
        const pitch = 0.8 + combo.count * 0.1;
        playHitSound(pitch);
        if (combo.count > 1) {
          playComboSound(combo.count);
        }

        // 破壊されたブロックを見つける
        for (const brick of bricks) {
          if (brick.destroyed) {
            const cx = brick.x + brick.width / 2;
            const cy = brick.y + brick.height / 2;
            const dist = p.dist(ball.x, ball.y, cx, cy);
            if (dist < 100) {
              // パーティクル
              spawnParticles(cx, cy, brick.color, 15 + combo.count * 5);
              // 衝撃波
              spawnShockwave(cx, cy, brick.color);
              // スコアポップアップ
              const baseScore = (config.brickRows - brick.row) * 10;
              spawnScorePopup(cx, cy, baseScore, combo.count);
              // 画面シェイク + グリッチ
              triggerShake(3 + combo.count);
              break;
            }
          }
        }
      }
      prevBricksCount = currentBricksCount;

      // 画面シェイク更新
      if (shake.intensity > 0) {
        shake.x = p.random(-1, 1) * shake.intensity;
        shake.y = p.random(-1, 1) * shake.intensity;
        shake.intensity *= 0.9;
        if (shake.intensity < 0.1) {
          shake.intensity = 0;
          shake.x = 0;
          shake.y = 0;
        }
      }

      // グリッチ減衰
      if (glitch.intensity > 0) {
        glitch.intensity *= 0.95;
        glitch.chromatic *= 0.95;
        if (glitch.intensity < 0.01) {
          glitch.intensity = 0;
          glitch.chromatic = 0;
        }
      }

      // ボールトレイル追加（メイン + 追加ボール全部）
      if (game.state === 'playing') {
        // メインボール
        trail.push({ x: ball.x, y: ball.y, life: 1 });
        // 追加ボール
        for (const eb of extraBalls) {
          trail.push({ x: eb.x, y: eb.y, life: 1 });
        }
        // トレイル数制限（ボール数に応じて増加）
        const maxTrail = 15 + extraBalls.length * 10;
        while (trail.length > maxTrail) {
          trail.shift();
        }
      }

      // === 3D描画開始 ===
      p.push();
      p.translate(shake.x, shake.y, 0);

      // 背景（深い宇宙）
      p.background(10, 15, 30);

      // スキャンライン（グリッチ効果）
      if (glitch.intensity > 0.01) {
        for (const line of scanlines) {
          line.y += line.speed;
          if (line.y > config.canvasHeight) {
            line.y = 0;
          }
          const [_, ly] = toWebGL(0, line.y);
          p.push();
          p.translate(0, ly, 50);
          p.noStroke();
          p.fill(255, 255, 255, line.alpha * glitch.intensity * 255);
          p.plane(config.canvasWidth, 2);
          p.pop();
        }
      }

      // 背景の星（3D）
      p.push();
      for (const star of stars) {
        star.z += 1;
        if (star.z > 0) {
          star.z = -500;
          star.x = p.random(-config.canvasWidth, config.canvasWidth);
          star.y = p.random(-config.canvasHeight, config.canvasHeight);
        }

        p.push();
        p.translate(star.x, star.y, star.z);
        p.noStroke();
        const alpha = p.map(star.z, -500, 0, 50, 255);
        p.fill(180, 200, 255, alpha);
        p.sphere(star.size);
        p.pop();
      }
      p.pop();

      // グリッド線（床）
      p.push();
      p.translate(0, config.canvasHeight / 2 - 50, -100);
      p.rotateX(p.PI / 3);
      p.stroke(0, 255, 255, 30);
      p.strokeWeight(1);
      p.noFill();
      const gridSize = 40;
      for (let gx = -200; gx <= 200; gx += gridSize) {
        p.line(gx, -200, gx, 200);
      }
      for (let gy = -200; gy <= 200; gy += gridSize) {
        p.line(-200, gy, 200, gy);
      }
      p.pop();

      // ブロック（3Dボックス）
      for (const brick of bricks) {
        if (brick.destroyed) continue;

        const [bx, by] = toWebGL(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
        );

        // グリッチ時のRGBずれ
        const chromaticOffset = glitch.chromatic * (p.random() > 0.5 ? 1 : -1);

        p.push();
        p.translate(bx + chromaticOffset * 0.5, by, 0);

        // 立体ブロック
        const brickRgb = parseHslColor(brick.color) || {
          r: 255,
          g: 255,
          b: 255,
        };
        p.fill(brickRgb.r, brickRgb.g, brickRgb.b);
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(1);
        p.box(brick.width - 2, brick.height - 2, 15);

        // 上面ハイライト
        p.push();
        p.translate(0, 0, 8);
        p.fill(255, 255, 255, 80);
        p.noStroke();
        p.plane(brick.width - 6, brick.height - 6);
        p.pop();

        p.pop();
      }

      // 衝撃波
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const wave = shockwaves[i];
        wave.radius += 4;
        wave.alpha -= 0.03;

        if (wave.alpha <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }

        const [wx, wy] = toWebGL(wave.x, wave.y);
        p.push();
        p.translate(wx, wy, 10);
        p.noFill();
        p.stroke(wave.color.r, wave.color.g, wave.color.b, wave.alpha * 255);
        p.strokeWeight(3);
        p.ellipse(0, 0, wave.radius * 2, wave.radius * 2);
        p.pop();
      }

      // ボールトレイル（色収差効果付き）- 黄色/オレンジ系
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        t.life -= 0.07;
        if (t.life <= 0) continue;

        const [tx, ty] = toWebGL(t.x, t.y);

        // 色収差（RGB分離）
        const chromOffset = glitch.chromatic * 2;
        if (chromOffset > 0.1) {
          // 赤オレンジ
          p.push();
          p.translate(tx - chromOffset, ty, 5);
          p.noStroke();
          p.fill(255, 100, 50, t.life * 100);
          p.sphere(ball.radius * t.life * 1.2);
          p.pop();
          // 黄緑
          p.push();
          p.translate(tx + chromOffset, ty, 5);
          p.noStroke();
          p.fill(200, 255, 50, t.life * 100);
          p.sphere(ball.radius * t.life * 1.2);
          p.pop();
        }

        p.push();
        p.translate(tx, ty, 10);
        p.noStroke();
        p.fill(255, 200, 50, t.life * 180); // 黄色系トレイル
        p.sphere(ball.radius * t.life);
        p.pop();
      }
      // トレイルクリーンアップ
      for (let i = trail.length - 1; i >= 0; i--) {
        if (trail[i].life <= 0) trail.splice(i, 1);
      }

      // パドル（3D）
      const [px, py] = toWebGL(
        paddle.x + paddle.width / 2,
        paddle.y + paddle.height / 2,
      );
      p.push();
      p.translate(px, py, 0);

      // パドル本体
      p.fill(0, 255, 255);
      p.stroke(255, 255, 255, 150);
      p.strokeWeight(2);
      p.box(paddle.width, paddle.height, 12);

      // パドル装飾
      p.push();
      p.translate(0, 0, 7);
      p.fill(255, 255, 255, 100);
      p.noStroke();
      p.plane(paddle.width - 20, 3);
      p.pop();

      p.pop();

      // ボール出現演出の更新・描画
      if (ballSpawnEffect && !ballSpawnEffect.completed) {
        updateAndDrawBallSpawnEffect(ball.x, ball.y);
      }

      // ボール（3D球体）- 黄色🟡 + グロー効果
      const [ballX, ballY] = toWebGL(ball.x, ball.y);

      // 出現演出中のボールサイズ補正
      const spawnScale = ballSpawnEffect
        ? Math.min(1, ballSpawnEffect.progress * 1.5)
        : 1;
      const spawnPulse = ballSpawnEffect
        ? 1 + Math.sin(ballSpawnEffect.progress * Math.PI * 6) * 0.15 * (1 - ballSpawnEffect.progress)
        : 1;
      const effectiveRadius = ball.radius * spawnScale * spawnPulse;

      // ボールのグロー（外側から描画）- 黄色/オレンジ系
      // 最外層グロー（大きく薄い）
      p.push();
      p.translate(ballX, ballY, 15);
      p.noStroke();
      p.fill(255, 200, 50, 40 * spawnScale);
      p.sphere(effectiveRadius * 2.5);
      p.pop();

      // 中間グロー
      p.push();
      p.translate(ballX, ballY, 18);
      p.noStroke();
      p.fill(255, 220, 80, 80 * spawnScale);
      p.sphere(effectiveRadius * 1.8);
      p.pop();

      // 内側グロー
      p.push();
      p.translate(ballX, ballY, 20);
      p.noStroke();
      p.fill(255, 240, 150, 120 * spawnScale);
      p.sphere(effectiveRadius * 1.3);
      p.pop();

      // ボールの色収差（グリッチ時）
      if (glitch.chromatic > 0.5) {
        p.push();
        p.translate(ballX - glitch.chromatic * 2, ballY, 22);
        p.noStroke();
        p.fill(255, 100, 50, 150);
        p.sphere(effectiveRadius * 1.1);
        p.pop();

        p.push();
        p.translate(ballX + glitch.chromatic * 2, ballY, 22);
        p.noStroke();
        p.fill(255, 50, 100, 150);
        p.sphere(effectiveRadius * 1.1);
        p.pop();
      }

      // ボール本体（黄色🟡）
      p.push();
      p.translate(ballX, ballY, 25);
      p.noStroke();
      p.fill(255, 220, 50); // 鮮やかな黄色
      p.sphere(effectiveRadius);
      p.pop();

      // ボールハイライト（白く光る）
      p.push();
      p.translate(ballX - 2, ballY - 2, 25 + effectiveRadius * 0.7);
      p.fill(255, 255, 255, 230 * spawnScale);
      p.noStroke();
      p.sphere(effectiveRadius * 0.35);
      p.pop();

      // ボールリング（アウトライン効果）
      p.push();
      p.translate(ballX, ballY, 25);
      p.noFill();
      p.stroke(255, 255, 200, 200 * spawnScale);
      p.strokeWeight(2);
      p.ellipse(0, 0, effectiveRadius * 2.2, effectiveRadius * 2.2);
      p.pop();

      // 貫通ボールエフェクト（炎のオーラ）- メインボール
      if (powerUps.some((pu) => pu.type === 'piercingBall')) {
        p.push();
        p.translate(ballX, ballY, 20);
        // 炎のようなオーラ
        for (let i = 0; i < 8; i++) {
          const flameAngle = time * 5 + i * (p.TWO_PI / 8);
          const flameOffset = p.sin(time * 10 + i) * 3;
          p.push();
          p.translate(
            p.cos(flameAngle) * (ball.radius + 5 + flameOffset),
            p.sin(flameAngle) * (ball.radius + 5 + flameOffset),
            0,
          );
          p.noStroke();
          p.fill(255, 100 + p.sin(time * 15 + i) * 50, 50, 200);
          p.sphere(4);
          p.pop();
        }
        p.pop();
      }

      // === 追加ボールの描画（メインと同じ黄色） ===
      for (const extraBall of extraBalls) {
        const [exX, exY] = toWebGL(extraBall.x, extraBall.y);

        // グロー（外側）- 黄色系
        p.push();
        p.translate(exX, exY, 15);
        p.noStroke();
        p.fill(255, 200, 50, 40);
        p.sphere(extraBall.radius * 2.5);
        p.pop();

        // 中間グロー
        p.push();
        p.translate(exX, exY, 18);
        p.noStroke();
        p.fill(255, 220, 80, 80);
        p.sphere(extraBall.radius * 1.8);
        p.pop();

        // 内側グロー
        p.push();
        p.translate(exX, exY, 20);
        p.noStroke();
        p.fill(255, 240, 150, 120);
        p.sphere(extraBall.radius * 1.3);
        p.pop();

        // ボール本体（黄色）
        p.push();
        p.translate(exX, exY, 25);
        p.noStroke();
        p.fill(255, 220, 50);
        p.sphere(extraBall.radius);
        p.pop();

        // ハイライト
        p.push();
        p.translate(exX - 2, exY - 2, 25 + extraBall.radius * 0.7);
        p.fill(255, 255, 255, 230);
        p.noStroke();
        p.sphere(extraBall.radius * 0.35);
        p.pop();

        // リング
        p.push();
        p.translate(exX, exY, 25);
        p.noFill();
        p.stroke(255, 255, 200, 200);
        p.strokeWeight(2);
        p.ellipse(0, 0, extraBall.radius * 2.2, extraBall.radius * 2.2);
        p.pop();

        // 貫通ボールエフェクト（追加ボールにも適用）
        if (powerUps.some((pu) => pu.type === 'piercingBall')) {
          p.push();
          p.translate(exX, exY, 20);
          for (let i = 0; i < 8; i++) {
            const flameAngle = time * 5 + i * (p.TWO_PI / 8);
            const flameOffset = p.sin(time * 10 + i) * 3;
            p.push();
            p.translate(
              p.cos(flameAngle) * (extraBall.radius + 5 + flameOffset),
              p.sin(flameAngle) * (extraBall.radius + 5 + flameOffset),
              0,
            );
            p.noStroke();
            p.fill(255, 100 + p.sin(time * 15 + i) * 50, 50, 200);
            p.sphere(4);
            p.pop();
          }
          p.pop();
        }
      }

      // ドロップアイテムの3D描画（光るオーブ部分のみ）
      for (const item of items) {
        const [itemX, itemY] = toWebGL(item.x, item.y);
        const itemColor = ITEM_COLORS[item.type];
        const bobOffset = p.sin(time * 4 + item.x * 0.1) * 3;
        const pulseScale = 1 + p.sin(time * 6) * 0.15;

        // 外側グロー（大きく薄い）
        p.push();
        p.translate(itemX, itemY + bobOffset, 10);
        p.noStroke();
        p.fill(itemColor.r, itemColor.g, itemColor.b, 40);
        p.sphere(item.size * 2.5 * pulseScale);
        p.pop();

        // 中間グロー
        p.push();
        p.translate(itemX, itemY + bobOffset, 15);
        p.noStroke();
        p.fill(itemColor.r, itemColor.g, itemColor.b, 100);
        p.sphere(item.size * 1.6 * pulseScale);
        p.pop();

        // コア（明るい）
        p.push();
        p.translate(itemX, itemY + bobOffset, 20);
        p.noStroke();
        p.fill(
          p.min(itemColor.r + 80, 255),
          p.min(itemColor.g + 80, 255),
          p.min(itemColor.b + 80, 255),
          230,
        );
        p.sphere(item.size * 0.9);
        p.pop();

        // キラキラパーティクル（回転）
        for (let i = 0; i < 4; i++) {
          const sparkleAngle = time * 4 + i * (p.TWO_PI / 4);
          const sparkleR = item.size * 1.5;
          p.push();
          p.translate(
            itemX + p.cos(sparkleAngle) * sparkleR,
            itemY + bobOffset + p.sin(sparkleAngle) * sparkleR,
            22,
          );
          p.noStroke();
          p.fill(255, 255, 255, 180 + p.sin(time * 12 + i * 2) * 70);
          p.sphere(2.5);
          p.pop();
        }
      }

      // 3Dパーティクル
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // 物理更新
        particle.pos.x += particle.vel.x;
        particle.pos.y += particle.vel.y;
        particle.pos.z += particle.vel.z;
        particle.vel.y += 0.15; // 重力
        particle.rotation.x += particle.rotSpeed.x;
        particle.rotation.y += particle.rotSpeed.y;
        particle.rotation.z += particle.rotSpeed.z;
        particle.life -= 0.02;
        particle.size *= 0.98;

        if (particle.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const [partX, partY] = toWebGL(particle.pos.x, particle.pos.y);
        p.push();
        p.translate(partX, partY, particle.pos.z);
        p.rotateX(particle.rotation.x);
        p.rotateY(particle.rotation.y);
        p.rotateZ(particle.rotation.z);

        p.fill(
          particle.color.r,
          particle.color.g,
          particle.color.b,
          particle.life * 255,
        );
        p.noStroke();
        p.box(particle.size);

        p.pop();
      }

      p.pop(); // シェイク終了

      // === 2D UI描画（オーバーレイ） ===
      uiBuffer.clear();

      // グリッチノイズライン（ランダム）
      if (glitch.intensity > 0.1 && p.random() > 0.7) {
        const noiseY = p.random(config.canvasHeight);
        const noiseH = p.random(2, 10);
        uiBuffer.fill(255, 255, 255, glitch.intensity * 50);
        uiBuffer.noStroke();
        uiBuffer.rect(0, noiseY, config.canvasWidth, noiseH);
      }

      // ドロップアイテムのアイコン（2D描画でハッキリ表示）
      for (const item of items) {
        const bobOffset = p.sin(time * 4 + item.x * 0.1) * 3;
        const itemColor = ITEM_COLORS[item.type];
        const icon = ITEM_ICONS[item.type];
        const pulseScale = 1 + p.sin(time * 6) * 0.1;

        uiBuffer.push();
        uiBuffer.translate(item.x, item.y + bobOffset);

        // 背景の円（色付き）
        uiBuffer.noStroke();
        uiBuffer.fill(itemColor.r, itemColor.g, itemColor.b, 180);
        uiBuffer.ellipse(0, 0, item.size * 2.8 * pulseScale, item.size * 2.8 * pulseScale);

        // 白いリング
        uiBuffer.noFill();
        uiBuffer.stroke(255, 255, 255, 200);
        uiBuffer.strokeWeight(2);
        uiBuffer.ellipse(0, 0, item.size * 3.2 * pulseScale, item.size * 3.2 * pulseScale);

        // アイコン（大きく表示）
        uiBuffer.noStroke();
        uiBuffer.textSize(20);
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.fill(255, 255, 255);
        uiBuffer.text(icon, 0, 1);

        uiBuffer.pop();
      }

      // スコアポップアップ
      for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        popup.y -= 1.5;
        popup.life -= 0.02;
        popup.scale = p.min(popup.scale + 0.15, 1);

        if (popup.life <= 0) {
          scorePopups.splice(i, 1);
          continue;
        }

        uiBuffer.push();
        uiBuffer.translate(popup.x, popup.y);
        uiBuffer.scale(popup.scale);

        const fontSize = 14 + popup.combo * 3;
        uiBuffer.textSize(fontSize);
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);

        uiBuffer.fill(255, 200, 50, popup.life * 255);

        const text =
          popup.combo > 1
            ? `+${popup.score * popup.combo} x${popup.combo}!`
            : `+${popup.score}`;
        uiBuffer.text(text, 0, 0);

        uiBuffer.pop();
      }

      // コンボ表示
      if (combo.count > 1 && Date.now() - combo.lastHitTime < 2000) {
        uiBuffer.push();
        uiBuffer.textSize(24);
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);

        uiBuffer.fill(255, 150 + combo.count * 20, 50);

        uiBuffer.text(
          `${combo.count} COMBO!`,
          config.canvasWidth / 2,
          config.canvasHeight - 90,
        );

        uiBuffer.pop();
      }

      // パワーアップステータス表示
      if (powerUps.length > 0) {
        uiBuffer.push();
        uiBuffer.textAlign(p.LEFT, p.CENTER);
        uiBuffer.textStyle(p.BOLD);

        const barWidth = 60;
        const barHeight = 8;
        const startX = 10;
        const startY = config.canvasHeight - 25;

        for (let i = 0; i < powerUps.length; i++) {
          const pu = powerUps[i];
          const puColor = ITEM_COLORS[pu.type];
          const progress = pu.remainingTime / pu.maxTime;
          const xOffset = i * (barWidth + 15);

          // アイコン
          uiBuffer.textSize(14);
          uiBuffer.fill(puColor.r, puColor.g, puColor.b);
          uiBuffer.text(ITEM_ICONS[pu.type], startX + xOffset, startY - 10);

          // バー背景
          uiBuffer.noStroke();
          uiBuffer.fill(50, 50, 50, 200);
          uiBuffer.rect(startX + xOffset, startY, barWidth, barHeight, 4);

          // バー（残り時間）
          uiBuffer.fill(puColor.r, puColor.g, puColor.b, 200);
          uiBuffer.rect(
            startX + xOffset,
            startY,
            barWidth * progress,
            barHeight,
            4,
          );
        }

        uiBuffer.pop();
      }

      // アイテム収集エフェクト（画面中央に効果名を大きく表示）
      for (let i = itemCollectEffects.length - 1; i >= 0; i--) {
        const effect = itemCollectEffects[i];
        effect.life -= 0.015; // ゆっくり消える
        effect.scale = p.min(effect.scale + 0.15, 1.2);

        if (effect.life <= 0) {
          itemCollectEffects.splice(i, 1);
          continue;
        }

        const effectColor = ITEM_COLORS[effect.type];
        const icon = ITEM_ICONS[effect.type];
        const name = ITEM_NAMES[effect.type];
        const yOffset = (1 - effect.life) * -30; // 上に浮かぶ

        // 背景（半透明の帯）
        uiBuffer.push();
        uiBuffer.noStroke();
        uiBuffer.fill(0, 0, 0, effect.life * 150);
        uiBuffer.rectMode(p.CENTER);
        uiBuffer.rect(
          config.canvasWidth / 2,
          config.canvasHeight / 2 - 50 + yOffset,
          220,
          60,
          10,
        );
        uiBuffer.pop();

        // アイコン
        uiBuffer.push();
        uiBuffer.textSize(32 * effect.scale);
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.fill(255, 255, 255, effect.life * 255);
        uiBuffer.text(
          icon,
          config.canvasWidth / 2 - 70,
          config.canvasHeight / 2 - 50 + yOffset,
        );
        uiBuffer.pop();

        // 効果名
        uiBuffer.push();
        uiBuffer.textSize(22 * effect.scale);
        uiBuffer.textAlign(p.LEFT, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.fill(
          effectColor.r,
          effectColor.g,
          effectColor.b,
          effect.life * 255,
        );
        uiBuffer.text(
          name,
          config.canvasWidth / 2 - 45,
          config.canvasHeight / 2 - 50 + yOffset,
        );
        uiBuffer.pop();
      }

      // ゲームオーバー/勝利オーバーレイ
      if (game.state === 'gameOver' || game.state === 'victory') {
        uiBuffer.fill(0, 0, 0, 220);
        uiBuffer.rect(0, 0, config.canvasWidth, config.canvasHeight);

        const isVictory = game.state === 'victory';

        uiBuffer.push();
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.textSize(36);

        if (isVictory) {
          uiBuffer.fill(100, 255, 150);
        } else {
          uiBuffer.fill(255, 100, 100);
        }

        uiBuffer.text(
          isVictory ? '🎉 VICTORY!' : '💀 GAME OVER',
          config.canvasWidth / 2,
          config.canvasHeight / 2 - 50,
        );

        uiBuffer.textSize(28);
        uiBuffer.fill(255, 220, 100);
        uiBuffer.text(
          `Score: ${game.score}`,
          config.canvasWidth / 2,
          config.canvasHeight / 2 + 10,
        );

        uiBuffer.textSize(18);
        uiBuffer.fill(0, 255, 255);
        uiBuffer.text(
          'タップしてリトライ',
          config.canvasWidth / 2,
          config.canvasHeight / 2 + 60,
        );

        uiBuffer.pop();
      }

      // 一時停止オーバーレイ
      if (game.state === 'paused') {
        uiBuffer.fill(0, 0, 0, 150);
        uiBuffer.rect(0, 0, config.canvasWidth, config.canvasHeight);

        uiBuffer.push();
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.textSize(36);
        uiBuffer.fill(255, 220, 100);
        uiBuffer.text(
          '⏸ PAUSED',
          config.canvasWidth / 2,
          config.canvasHeight / 2,
        );
        uiBuffer.pop();
      }

      // 準備画面
      if (game.state === 'ready') {
        uiBuffer.push();
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.textSize(20);
        uiBuffer.fill(0, 255, 255);
        uiBuffer.text(
          'タップしてスタート',
          config.canvasWidth / 2,
          config.canvasHeight / 2,
        );
        uiBuffer.pop();
      }

      // UIバッファを描画
      p.push();
      p.resetMatrix();
      p.translate(-config.canvasWidth / 2, -config.canvasHeight / 2, 100);
      p.image(uiBuffer, 0, 0);
      p.pop();
    };

    /**
     * マウス移動
     */
    p.mouseMoved = () => {
      const game = useBreakoutStore.getState().game;
      if (game.state !== 'playing' && game.state !== 'ready') return;

      const targetX = p.mouseX;
      useBreakoutStore.getState().handlePointerMove(targetX, 0, 1);
    };

    /**
     * マウスドラッグ（タッチ対応）
     */
    p.mouseDragged = () => {
      const game = useBreakoutStore.getState().game;
      if (game.state !== 'playing' && game.state !== 'ready') return;

      const targetX = p.mouseX;
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
