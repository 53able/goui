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
 * パーティクル（3D破片）- クリスマス仕様
 */
interface Particle3D {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
  size: number;
  rotSpeed: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  life: number;
  type: 'ribbon' | 'paper' | 'sparkle';  // パーティクルの種類
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
 * 雪の結晶 ❄️
 */
interface Snowflake {
  x: number;
  y: number;
  z: number;
  size: number;
  rotationSpeed: number;
  rotation: number;
  swayOffset: number;
  swaySpeed: number;
  fallSpeed: number;
  /** 雪の種類: dot=小さな点, hex=六角形, crystal=結晶 */
  type: 'dot' | 'hex' | 'crystal';
  /** キラキラの位相 */
  sparklePhase: number;
}

/**
 * イルミネーションライト 💡
 */
interface ChristmasLight {
  x: number;
  y: number;
  color: { r: number; g: number; b: number };
  phase: number;
  size: number;
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
 * - star: 星が集まってオーナメント形成
 * - snow: 雪が渦を巻いて形成
 * - bell: ベルの音と共に出現
 */
type SpawnEffectType = 'star' | 'snow' | 'bell';

/**
 * ボール出現演出の状態
 */
interface BallSpawnEffect {
  type: SpawnEffectType;
  progress: number;
  ballX: number;
  ballY: number;
  starPoints: Array<{ x: number; y: number; angle: number }>;
  completed: boolean;
}

/**
 * アイテムの色設定 🎁 クリスマス仕様
 */
const ITEM_COLORS: Record<ItemType, { r: number; g: number; b: number }> = {
  expandPaddle: { r: 34, g: 139, b: 34 },   // 🎄 フォレストグリーン
  shrinkPaddle: { r: 70, g: 70, b: 90 },    // 🌫️ 冬の霧
  piercingBall: { r: 255, g: 215, b: 0 },   // ⭐ ゴールドスター
  slowBall: { r: 176, g: 224, b: 230 },     // ❄️ アイスブルー
  extraLife: { r: 220, g: 20, b: 60 },      // ❤️ クリムゾンレッド
  speedUp: { r: 255, g: 140, b: 0 },        // 🔥 暖炉オレンジ
  multiBall: { r: 255, g: 255, b: 255 },    // ⛄ スノーホワイト
};

/**
 * アイテムのアイコン 🎄 クリスマス絵文字
 */
const ITEM_ICONS: Record<ItemType, string> = {
  expandPaddle: '🎄',  // パドル拡張 → クリスマスツリー
  shrinkPaddle: '🌫️', // パドル縮小 → 霧
  piercingBall: '⭐',  // 貫通ボール → 星
  slowBall: '❄️',      // スローボール → 雪の結晶
  extraLife: '🎅',     // ライフ+1 → サンタ
  speedUp: '🔥',       // スピードアップ → 暖炉の火
  multiBall: '⛄',     // マルチボール → 雪だるま
};

/**
 * アイテムの効果名（日本語表示用）クリスマス風
 */
const ITEM_NAMES: Record<ItemType, string> = {
  expandPaddle: 'ツリーパワー！',
  shrinkPaddle: '冬の霧...',
  piercingBall: '聖夜の星！',
  slowBall: '雪化粧',
  extraLife: 'サンタの贈り物！',
  speedUp: '暖炉の炎！',
  multiBall: '雪だるま軍団！',
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
 * p5.jsブロック崩しスケッチを生成 🎄 クリスマスエディション
 */
export const createBreakoutSketch = (): P5Sketch => {
  return (p: P5Instance) => {
    // エフェクト用変数
    const particles: Particle3D[] = [];
    const shockwaves: Shockwave[] = [];
    const scorePopups: ScorePopup[] = [];
    const trail: TrailPoint[] = [];
    const snowflakes: Snowflake[] = [];
    const christmasLights: ChristmasLight[] = [];
    const itemCollectEffects: ItemCollectEffect[] = [];

    // 画面シェイク
    const shake = { x: 0, y: 0, intensity: 0 };

    // グリッチを雪のきらめきに置き換え
    const sparkle = { intensity: 0 };

    // コンボ追跡
    const combo = { count: 0, lastHitTime: 0 };

    // ボール出現演出
    let ballSpawnEffect: BallSpawnEffect | null = null;
    const spawnEffectTypes: SpawnEffectType[] = ['star', 'snow', 'bell'];

    // 前フレームのブロック数（破壊検出用）
    let prevBricksCount = 0;
    let prevLives = 5;
    let prevState = 'ready';
    let prevItemsMap = new Map<string, ItemType>();

    // グラフィックスバッファ（2D UI用）
    // biome-ignore lint/suspicious/noExplicitAny: p5.Graphics型
    let uiBuffer: any;

    // 時間
    let time = 0;

    /**
     * 初期設定
     */
    p.setup = () => {
      const config = useBreakoutStore.getState().game.config;
      p.createCanvas(config.canvasWidth, config.canvasHeight, p.WEBGL);
      p.pixelDensity(1);

      // UIバッファ
      uiBuffer = p.createGraphics(config.canvasWidth, config.canvasHeight);

      // 雪の結晶を生成 ❄️
      // 種類の分布: dot(小さな点)60%, hex(六角形)25%, crystal(結晶)15%
      for (let i = 0; i < 100; i++) {
        const typeRand = p.random();
        const snowType = typeRand < 0.6 ? 'dot' : typeRand < 0.85 ? 'hex' : 'crystal';
        
        snowflakes.push({
          x: p.random(-config.canvasWidth / 2, config.canvasWidth / 2),
          y: p.random(-config.canvasHeight, 0),
          z: p.random(-400, -50),  // より奥に配置してボールと区別
          size: snowType === 'dot' ? p.random(1, 2.5) : snowType === 'hex' ? p.random(3, 5) : p.random(5, 8),
          rotationSpeed: p.random(-0.02, 0.02),
          rotation: p.random(p.TWO_PI),
          swayOffset: p.random(p.TWO_PI),
          swaySpeed: p.random(0.015, 0.04),
          fallSpeed: snowType === 'dot' ? p.random(0.3, 0.8) : p.random(0.5, 1.2),
          type: snowType,
          sparklePhase: p.random(p.TWO_PI),
        });
      }

      // イルミネーションライトを配置 💡
      const lightColors = [
        { r: 255, g: 50, b: 50 },    // 赤
        { r: 50, g: 255, b: 50 },    // 緑
        { r: 255, g: 215, b: 0 },    // 金
        { r: 100, g: 150, b: 255 },  // 青
        { r: 255, g: 100, b: 200 },  // ピンク
      ];
      
      // 上部にライトを並べる
      for (let i = 0; i < 20; i++) {
        christmasLights.push({
          x: (i / 19) * config.canvasWidth - config.canvasWidth / 2,
          y: -config.canvasHeight / 2 + 15,
          color: lightColors[i % lightColors.length],
          phase: i * 0.5,
          size: 8,
        });
      }

      p.frameRate(60);
      prevLives = useBreakoutStore.getState().game.lives;
    };

    /**
     * パーティクル爆発を生成（クリスマスリボン＆ラッピング）
     */
    const spawnParticles = (
      x: number,
      y: number,
      colorStr: string,
      count: number,
    ) => {
      const rgb = parseHslColor(colorStr) || { r: 255, g: 255, b: 255 };
      const types: Array<'ribbon' | 'paper' | 'sparkle'> = ['ribbon', 'paper', 'sparkle'];
      
      for (let i = 0; i < count; i++) {
        const angle = p.random(p.TWO_PI);
        const speed = p.random(2, 6);
        const particleType = types[Math.floor(p.random(3))];
        
        particles.push({
          pos: { x, y, z: p.random(-20, 20) },
          vel: {
            x: p.cos(angle) * speed,
            y: p.sin(angle) * speed - 2,  // 上向きに飛ばす
            z: p.random(-2, 2),
          },
          color: particleType === 'sparkle' 
            ? { r: 255, g: 215, b: 0 }  // キラキラは金色
            : rgb,
          size: particleType === 'ribbon' ? p.random(8, 15) : p.random(4, 10),
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
          type: particleType,
        });
      }
    };

    /**
     * 衝撃波を生成（星型に変更）
     */
    const spawnShockwave = (x: number, y: number, colorStr: string) => {
      const rgb = parseHslColor(colorStr) || { r: 255, g: 215, b: 0 };
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
      shake.intensity = p.min(intensity, 10);
      sparkle.intensity = p.min(intensity * 0.3, 1);
    };

    /**
     * アイテム収集エフェクトを生成
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
     */
    const toWebGL = (x: number, y: number): [number, number] => {
      const config = useBreakoutStore.getState().game.config;
      return [x - config.canvasWidth / 2, y - config.canvasHeight / 2];
    };

    /**
     * ボール出現演出を開始（クリスマス仕様）
     */
    const startBallSpawnEffect = (ballX: number, ballY: number) => {
      const effectType =
        spawnEffectTypes[Math.floor(Math.random() * spawnEffectTypes.length)];

      // 星の軌跡用ポイント生成
      const starPoints: Array<{ x: number; y: number; angle: number }> = [];
      const pointCount = 8;
      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2;
        const dist = 100 + Math.random() * 50;
        starPoints.push({
          x: ballX + Math.cos(angle) * dist,
          y: ballY + Math.sin(angle) * dist,
          angle,
        });
      }

      ballSpawnEffect = {
        type: effectType,
        progress: 0,
        ballX,
        ballY,
        starPoints,
        completed: false,
      };
    };

    /**
     * ボール出現演出を更新・描画（クリスマス仕様）
     */
    const updateAndDrawBallSpawnEffect = (ballX: number, ballY: number) => {
      if (!ballSpawnEffect) return;

      const effect = ballSpawnEffect;
      const [bx, by] = toWebGL(ballX, ballY);

      effect.progress += p.deltaTime * 0.001 * 2.5;
      if (effect.progress >= 1) {
        effect.completed = true;
        ballSpawnEffect = null;
        return;
      }

      const t = effect.progress;

      // ======== STAR: 星が集まってオーナメント形成 ========
      if (effect.type === 'star') {
        for (let i = 0; i < effect.starPoints.length; i++) {
          const pt = effect.starPoints[i];
          const progress = Math.min(t * 1.5, 1);
          const currentX = pt.x + (ballX - pt.x) * progress;
          const currentY = pt.y + (ballY - pt.y) * progress;
          const [sx, sy] = toWebGL(currentX, currentY);
          const starAlpha = (1 - progress * 0.7) * 255;

          p.push();
          p.translate(sx, sy, 20 + i * 2);
          p.rotateZ(time * 3 + i);
          p.noStroke();
          p.fill(255, 215, 0, starAlpha);
          // 星型を描画
          const starSize = 10 * (1 - progress * 0.5);
          p.beginShape();
          for (let j = 0; j < 10; j++) {
            const angle = (j / 10) * p.TWO_PI - p.HALF_PI;
            const r = j % 2 === 0 ? starSize : starSize * 0.4;
            p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          p.endShape(p.CLOSE);
          p.pop();
        }

        // 中央の輝き
        if (t > 0.5) {
          const flashAlpha = Math.sin((t - 0.5) * 2 * Math.PI) * 255;
          p.push();
          p.translate(bx, by, 25);
          p.noStroke();
          p.fill(255, 255, 200, flashAlpha);
          p.sphere(15 * (t - 0.5) * 2);
          p.pop();
        }
      }

      // ======== SNOW: 雪が渦を巻いて形成 ========
      else if (effect.type === 'snow') {
        const spiralCount = 12;
        for (let i = 0; i < spiralCount; i++) {
          const spiralT = (t * 2 + i / spiralCount) % 1;
          const spiralAngle = spiralT * Math.PI * 4 + i;
          const spiralRadius = (1 - spiralT) * 80;
          const spiralX = bx + Math.cos(spiralAngle) * spiralRadius;
          const spiralY = by + Math.sin(spiralAngle) * spiralRadius;

          p.push();
          p.translate(spiralX, spiralY, 15);
          p.rotateZ(time * 2);
          p.noStroke();
          p.fill(255, 255, 255, (1 - spiralT) * 200);
          // 雪の結晶型
          for (let j = 0; j < 6; j++) {
            p.push();
            p.rotateZ((j / 6) * p.TWO_PI);
            p.rect(0, 0, 2, 8);
            p.pop();
          }
          p.pop();
        }
      }

      // ======== BELL: ベルの音と共に出現 ========
      else if (effect.type === 'bell') {
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
          const ringT = Math.max(0, t - i * 0.2);
          if (ringT <= 0) continue;

          const ringProgress = Math.min(ringT * 2, 1);
          const ringRadius = ringProgress * 60;
          const ringAlpha = (1 - ringProgress) * 255;

          p.push();
          p.translate(bx, by, 15 + i * 3);
          p.noFill();
          p.stroke(255, 215, 0, ringAlpha);
          p.strokeWeight(3 - ringProgress * 2);
          p.ellipse(0, 0, ringRadius * 2, ringRadius * 2);
          p.pop();
        }

        // ベルの形
        if (t > 0.3) {
          const bellScale = Math.min((t - 0.3) * 3, 1);
          const bellSwing = Math.sin(time * 15) * 0.2 * (1 - t);

          p.push();
          p.translate(bx, by - 30 * bellScale, 25);
          p.rotateZ(bellSwing);
          p.fill(255, 215, 0, 200 * bellScale);
          p.noStroke();
          // ベル本体（簡易）
          p.ellipse(0, 0, 20 * bellScale, 25 * bellScale);
          p.rect(-3 * bellScale, 10 * bellScale, 6 * bellScale, 8 * bellScale);
          p.pop();
        }
      }
    };

    /**
     * プレゼント箱（ブロック）を描画 🎁
     */
    const drawPresentBox = (
      x: number,
      y: number,
      width: number,
      height: number,
      rgb: { r: number; g: number; b: number },
      row: number,
    ) => {
      // 箱本体
      p.push();
      p.translate(x, y, 0);
      p.fill(rgb.r, rgb.g, rgb.b);
      p.stroke(255, 255, 255, 80);
      p.strokeWeight(1);
      p.box(width - 2, height - 2, 18);

      // 上面ハイライト
      p.push();
      p.translate(0, 0, 10);
      p.fill(255, 255, 255, 60);
      p.noStroke();
      p.plane(width - 6, height - 6);
      p.pop();

      // リボン（縦）🎀
      const ribbonColor = row % 2 === 0 
        ? { r: 255, g: 215, b: 0 }  // 金リボン
        : { r: 255, g: 255, b: 255 }; // 白リボン
      
      p.fill(ribbonColor.r, ribbonColor.g, ribbonColor.b, 230);
      p.noStroke();
      
      // 縦リボン
      p.push();
      p.translate(0, 0, 10);
      p.plane(6, height - 2);
      p.pop();
      
      // 横リボン
      p.push();
      p.translate(0, 0, 10);
      p.plane(width - 2, 6);
      p.pop();

      // リボンの結び目（中央の丸）
      p.push();
      p.translate(0, 0, 12);
      p.fill(ribbonColor.r, ribbonColor.g, ribbonColor.b);
      p.sphere(5);
      p.pop();

      p.pop();
    };

    /**
     * サンタのソリ（パドル）を描画 🛷
     */
    const drawSleigh = (x: number, y: number, width: number, height: number) => {
      // ソリ本体（赤）
      p.push();
      p.translate(x, y, 0);
      p.fill(180, 30, 30);  // 深い赤
      p.stroke(100, 20, 20);
      p.strokeWeight(2);
      p.box(width, height, 15);

      // ソリの縁取り（金色）
      p.push();
      p.translate(0, -height / 2 - 2, 0);
      p.fill(255, 215, 0);
      p.noStroke();
      p.box(width + 4, 4, 18);
      p.pop();

      // ソリのカーブ（両端）
      p.push();
      p.translate(-width / 2 - 5, 0, 0);
      p.fill(139, 69, 19);  // 茶色（木）
      p.noStroke();
      p.rotateZ(0.3);
      p.box(15, 8, 12);
      p.pop();

      p.push();
      p.translate(width / 2 + 5, 0, 0);
      p.fill(139, 69, 19);
      p.noStroke();
      p.rotateZ(-0.3);
      p.box(15, 8, 12);
      p.pop();

      // 装飾ライン（金）
      p.push();
      p.translate(0, 0, 9);
      p.fill(255, 215, 0, 180);
      p.noStroke();
      p.plane(width - 30, 3);
      p.pop();

      p.pop();
    };

    /**
     * クリスマスオーナメント（ボール）を描画 🔮
     */
    const drawOrnament = (
      x: number, 
      y: number, 
      radius: number, 
      scale: number = 1,
      isPiercing: boolean = false,
    ) => {
      const effectiveRadius = radius * scale;

      // 外側のグロー（金色）
      p.push();
      p.translate(x, y, 15);
      p.noStroke();
      p.fill(255, 215, 0, 40 * scale);
      p.sphere(effectiveRadius * 2.5);
      p.pop();

      // 中間グロー（暖かいオレンジ）
      p.push();
      p.translate(x, y, 18);
      p.noStroke();
      p.fill(255, 180, 80, 80 * scale);
      p.sphere(effectiveRadius * 1.8);
      p.pop();

      // オーナメント本体（赤）
      p.push();
      p.translate(x, y, 25);
      p.noStroke();
      
      if (isPiercing) {
        // 貫通時は金色に輝く
        p.fill(255, 215, 0);
      } else {
        p.fill(200, 30, 30);  // クリスマスレッド
      }
      p.sphere(effectiveRadius);
      p.pop();

      // ハイライト（白く光る）
      p.push();
      p.translate(x - 2, y - 2, 25 + effectiveRadius * 0.7);
      p.fill(255, 255, 255, 230 * scale);
      p.noStroke();
      p.sphere(effectiveRadius * 0.35);
      p.pop();

      // オーナメントのキャップ（金色）
      p.push();
      p.translate(x, y - effectiveRadius - 3, 25);
      p.fill(255, 215, 0);
      p.noStroke();
      p.box(6, 6, 6);
      p.pop();

      // 装飾ライン（金色の帯）
      p.push();
      p.translate(x, y, 25);
      p.noFill();
      p.stroke(255, 215, 0, 200 * scale);
      p.strokeWeight(2);
      p.rotateX(0.3);
      p.ellipse(0, 0, effectiveRadius * 2, effectiveRadius * 0.5);
      p.pop();

      // 貫通時の星エフェクト
      if (isPiercing) {
        for (let i = 0; i < 6; i++) {
          const starAngle = time * 4 + i * (p.TWO_PI / 6);
          const starOffset = Math.sin(time * 8 + i) * 3;
          p.push();
          p.translate(
            x + Math.cos(starAngle) * (radius + 8 + starOffset),
            y + Math.sin(starAngle) * (radius + 8 + starOffset),
            25,
          );
          p.rotateZ(time * 3);
          p.noStroke();
          p.fill(255, 255, 200, 200);
          // 小さな星
          p.beginShape();
          for (let j = 0; j < 10; j++) {
            const a = (j / 10) * p.TWO_PI;
            const r = j % 2 === 0 ? 5 : 2;
            p.vertex(Math.cos(a) * r, Math.sin(a) * r);
          }
          p.endShape(p.CLOSE);
          p.pop();
        }
      }
    };

    /**
     * 描画ループ 🎄
     */
    p.draw = () => {
      const game = useBreakoutStore.getState().game;
      const { paddle, ball, extraBalls, bricks, items, powerUps, config } = game;

      time += p.deltaTime * 0.001;

      // 状態変化検出
      if (prevState !== game.state) {
        if (game.state === 'playing' && prevState === 'ready') {
          playStartSound();
          startBallSpawnEffect(ball.x, ball.y);
        } else if (game.state === 'playing' && prevState === 'levelClear') {
          playStartSound();
          startBallSpawnEffect(ball.x, ball.y);
        } else if (game.state === 'gameOver') {
          playGameOverSound();
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
          playItemSound();
          spawnItemCollectEffect(prevType);
          triggerShake(2);
        }
      }
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

        const pitch = 0.8 + combo.count * 0.1;
        playHitSound(pitch);
        if (combo.count > 1) {
          playComboSound(combo.count);
        }

        for (const brick of bricks) {
          if (brick.destroyed) {
            const cx = brick.x + brick.width / 2;
            const cy = brick.y + brick.height / 2;
            const dist = p.dist(ball.x, ball.y, cx, cy);
            if (dist < 100) {
              spawnParticles(cx, cy, brick.color, 12 + combo.count * 4);
              spawnShockwave(cx, cy, brick.color);
              const baseScore = (config.brickRows - brick.row) * 10;
              spawnScorePopup(cx, cy, baseScore, combo.count);
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

      // きらめき減衰
      if (sparkle.intensity > 0) {
        sparkle.intensity *= 0.95;
        if (sparkle.intensity < 0.01) {
          sparkle.intensity = 0;
        }
      }

      // ボールトレイル追加
      if (game.state === 'playing') {
        trail.push({ x: ball.x, y: ball.y, life: 1 });
        for (const eb of extraBalls) {
          trail.push({ x: eb.x, y: eb.y, life: 1 });
        }
        const maxTrail = 15 + extraBalls.length * 10;
        while (trail.length > maxTrail) {
          trail.shift();
        }
      }

      // === 3D描画開始 ===
      p.push();
      p.translate(shake.x, shake.y, 0);

      // 背景（冬の夜空）🌃
      p.background(15, 25, 45);

      // 遠くの雪山を暗示する地平線グラデーション
      p.push();
      p.translate(0, config.canvasHeight / 2 - 30, -200);
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        p.fill(40 + i * 10, 50 + i * 10, 80 + i * 5, 150 - i * 25);
        p.plane(config.canvasWidth * 2, 40);
        p.translate(0, -20, 10);
      }
      p.pop();

      // イルミネーションライト 💡
      for (const light of christmasLights) {
        const pulseAlpha = 150 + Math.sin(time * 3 + light.phase) * 105;
        const glowSize = light.size * (1 + Math.sin(time * 2 + light.phase) * 0.2);

        // グロー
        p.push();
        p.translate(light.x, light.y, 10);
        p.noStroke();
        p.fill(light.color.r, light.color.g, light.color.b, pulseAlpha * 0.3);
        p.sphere(glowSize * 2);
        p.pop();

        // ライト本体
        p.push();
        p.translate(light.x, light.y, 15);
        p.noStroke();
        p.fill(light.color.r, light.color.g, light.color.b, pulseAlpha);
        p.sphere(glowSize);
        p.pop();

        // 吊り下げ線
        p.push();
        p.stroke(100, 100, 100, 100);
        p.strokeWeight(1);
        p.line(light.x, -config.canvasHeight / 2, 5, light.x, light.y - light.size, 5);
        p.pop();
      }

      // 雪の結晶 ❄️ - 種類によって異なる形状で描画
      for (const snow of snowflakes) {
        snow.y += snow.fallSpeed;
        // ふわふわと揺れる動き
        snow.x += Math.sin(time * snow.swaySpeed + snow.swayOffset) * 0.4;
        snow.rotation += snow.rotationSpeed;

        // 画面下に出たらリセット
        if (snow.y > config.canvasHeight / 2 + 50) {
          snow.y = -config.canvasHeight / 2 - p.random(50, 150);
          snow.x = p.random(-config.canvasWidth / 2, config.canvasWidth / 2);
        }

        // 奥行きによる透明度（より奥は薄く）
        const baseAlpha = p.map(snow.z, -400, -50, 40, 150);
        // キラキラ効果
        const sparkle = Math.sin(time * 3 + snow.sparklePhase) * 0.3 + 0.7;
        const alpha = baseAlpha * sparkle;

        p.push();
        p.translate(snow.x, snow.y, snow.z);
        p.rotateZ(snow.rotation);

        if (snow.type === 'dot') {
          // 小さな点（シンプルな円）
          p.noStroke();
          p.fill(255, 255, 255, alpha);
          p.ellipse(0, 0, snow.size, snow.size);
        } else if (snow.type === 'hex') {
          // 六角形
          p.noStroke();
          p.fill(240, 248, 255, alpha);  // 少し青みがかった白
          p.beginShape();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * p.TWO_PI;
            p.vertex(Math.cos(angle) * snow.size, Math.sin(angle) * snow.size);
          }
          p.endShape(p.CLOSE);
        } else {
          // 結晶（六芒星風）
          p.stroke(220, 240, 255, alpha);
          p.strokeWeight(1);
          p.noFill();
          
          // 6本の腕を描画
          for (let i = 0; i < 6; i++) {
            const armAngle = (i / 6) * p.TWO_PI;
            const armLength = snow.size;
            const endX = Math.cos(armAngle) * armLength;
            const endY = Math.sin(armAngle) * armLength;
            
            // メインの腕
            p.line(0, 0, endX, endY);
            
            // 小さな枝（腕の途中から）
            const branchPos = 0.6;
            const branchLen = armLength * 0.35;
            const midX = endX * branchPos;
            const midY = endY * branchPos;
            
            // 左の枝
            p.line(
              midX, midY,
              midX + Math.cos(armAngle + 0.7) * branchLen,
              midY + Math.sin(armAngle + 0.7) * branchLen
            );
            // 右の枝
            p.line(
              midX, midY,
              midX + Math.cos(armAngle - 0.7) * branchLen,
              midY + Math.sin(armAngle - 0.7) * branchLen
            );
          }
          
          // 中心の輝き
          p.noStroke();
          p.fill(255, 255, 255, alpha * 0.8);
          p.ellipse(0, 0, 2, 2);
        }

        p.pop();
      }

      // プレゼントボックス（ブロック）🎁
      for (const brick of bricks) {
        if (brick.destroyed) continue;

        const [bx, by] = toWebGL(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
        );

        const brickRgb = parseHslColor(brick.color) || {
          r: 255,
          g: 255,
          b: 255,
        };

        drawPresentBox(bx, by, brick.width, brick.height, brickRgb, brick.row);
      }

      // 衝撃波（星型のきらめき）
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const wave = shockwaves[i];
        wave.radius += 3;
        wave.alpha -= 0.025;

        if (wave.alpha <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }

        const [wx, wy] = toWebGL(wave.x, wave.y);
        
        // 星型の衝撃波
        p.push();
        p.translate(wx, wy, 10);
        p.rotateZ(time * 2);
        p.noFill();
        p.stroke(255, 215, 0, wave.alpha * 255);
        p.strokeWeight(2);
        p.beginShape();
        for (let j = 0; j < 12; j++) {
          const angle = (j / 12) * p.TWO_PI;
          const r = j % 2 === 0 ? wave.radius : wave.radius * 0.6;
          p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        p.endShape(p.CLOSE);
        p.pop();
      }

      // ボールトレイル（金色のきらめき）
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        t.life -= 0.06;
        if (t.life <= 0) continue;

        const [tx, ty] = toWebGL(t.x, t.y);

        p.push();
        p.translate(tx, ty, 10);
        p.noStroke();
        p.fill(255, 215, 0, t.life * 150);
        p.sphere(ball.radius * t.life * 0.8);
        p.pop();
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        if (trail[i].life <= 0) trail.splice(i, 1);
      }

      // サンタのソリ（パドル）🛷
      const [px, py] = toWebGL(
        paddle.x + paddle.width / 2,
        paddle.y + paddle.height / 2,
      );
      drawSleigh(px, py, paddle.width, paddle.height);

      // ボール出現演出
      if (ballSpawnEffect && !ballSpawnEffect.completed) {
        updateAndDrawBallSpawnEffect(ball.x, ball.y);
      }

      // クリスマスオーナメント（ボール）🔮
      const [ballX, ballY] = toWebGL(ball.x, ball.y);
      const spawnScale = ballSpawnEffect
        ? Math.min(1, ballSpawnEffect.progress * 1.5)
        : 1;
      const isPiercing = powerUps.some((pu) => pu.type === 'piercingBall');
      
      drawOrnament(ballX, ballY, ball.radius, spawnScale, isPiercing);

      // 追加ボール（同じオーナメントデザイン）
      for (const extraBall of extraBalls) {
        const [exX, exY] = toWebGL(extraBall.x, extraBall.y);
        drawOrnament(exX, exY, extraBall.radius, 1, isPiercing);
      }

      // ドロップアイテムの3D描画 🎁
      for (const item of items) {
        const [itemX, itemY] = toWebGL(item.x, item.y);
        const itemColor = ITEM_COLORS[item.type];
        const bobOffset = Math.sin(time * 4 + item.x * 0.1) * 4;
        const pulseScale = 1 + Math.sin(time * 5) * 0.1;
        const spinAngle = time * 2;

        // 外側グロー
        p.push();
        p.translate(itemX, itemY + bobOffset, 10);
        p.noStroke();
        p.fill(itemColor.r, itemColor.g, itemColor.b, 50);
        p.sphere(item.size * 2.5 * pulseScale);
        p.pop();

        // 中間グロー
        p.push();
        p.translate(itemX, itemY + bobOffset, 15);
        p.rotateZ(spinAngle);
        p.noStroke();
        p.fill(itemColor.r, itemColor.g, itemColor.b, 120);
        p.sphere(item.size * 1.5 * pulseScale);
        p.pop();

        // コア
        p.push();
        p.translate(itemX, itemY + bobOffset, 20);
        p.rotateZ(spinAngle);
        p.noStroke();
        p.fill(
          Math.min(itemColor.r + 60, 255),
          Math.min(itemColor.g + 60, 255),
          Math.min(itemColor.b + 60, 255),
          240,
        );
        p.sphere(item.size * 0.9);
        p.pop();

        // キラキラパーティクル
        for (let i = 0; i < 4; i++) {
          const sparkleAngle = time * 3 + i * (p.TWO_PI / 4);
          const sparkleR = item.size * 1.8;
          p.push();
          p.translate(
            itemX + Math.cos(sparkleAngle) * sparkleR,
            itemY + bobOffset + Math.sin(sparkleAngle) * sparkleR,
            22,
          );
          p.noStroke();
          p.fill(255, 255, 255, 180 + Math.sin(time * 10 + i * 2) * 70);
          p.sphere(2);
          p.pop();
        }
      }

      // 3Dパーティクル（リボン/紙/キラキラ）
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.pos.x += particle.vel.x;
        particle.pos.y += particle.vel.y;
        particle.pos.z += particle.vel.z;
        particle.vel.y += 0.12;  // 重力
        particle.rotation.x += particle.rotSpeed.x;
        particle.rotation.y += particle.rotSpeed.y;
        particle.rotation.z += particle.rotSpeed.z;
        particle.life -= 0.018;
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

        if (particle.type === 'ribbon') {
          // リボン（薄い長方形）
          p.box(particle.size, particle.size * 0.3, 1);
        } else if (particle.type === 'sparkle') {
          // キラキラ（小さな球）
          p.sphere(particle.size * 0.5);
        } else {
          // 紙（正方形）
          p.box(particle.size * 0.8);
        }

        p.pop();
      }

      p.pop(); // シェイク終了

      // === 2D UI描画 ===
      uiBuffer.clear();

      // ドロップアイテムのアイコン
      for (const item of items) {
        const bobOffset = Math.sin(time * 4 + item.x * 0.1) * 4;
        const itemColor = ITEM_COLORS[item.type];
        const icon = ITEM_ICONS[item.type];
        const pulseScale = 1 + Math.sin(time * 5) * 0.08;

        uiBuffer.push();
        uiBuffer.translate(item.x, item.y + bobOffset);

        // 背景の円
        uiBuffer.noStroke();
        uiBuffer.fill(itemColor.r, itemColor.g, itemColor.b, 180);
        uiBuffer.ellipse(0, 0, item.size * 2.8 * pulseScale, item.size * 2.8 * pulseScale);

        // 白いリング
        uiBuffer.noFill();
        uiBuffer.stroke(255, 255, 255, 200);
        uiBuffer.strokeWeight(2);
        uiBuffer.ellipse(0, 0, item.size * 3.2 * pulseScale, item.size * 3.2 * pulseScale);

        // アイコン
        uiBuffer.noStroke();
        uiBuffer.textSize(18);
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.fill(255, 255, 255);
        uiBuffer.text(icon, 0, 1);

        uiBuffer.pop();
      }

      // スコアポップアップ 🎄
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

        // クリスマスゴールド
        uiBuffer.fill(255, 215, 0, popup.life * 255);

        const text =
          popup.combo > 1
            ? `+${popup.score * popup.combo} ⭐x${popup.combo}!`
            : `+${popup.score}`;
        uiBuffer.text(text, 0, 0);

        uiBuffer.pop();
      }

      // コンボ表示 🌟
      if (combo.count > 1 && Date.now() - combo.lastHitTime < 2000) {
        uiBuffer.push();
        uiBuffer.textSize(24);
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.fill(255, 215, 0);
        uiBuffer.text(
          `⭐ ${combo.count} COMBO! ⭐`,
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

          uiBuffer.textSize(14);
          uiBuffer.fill(puColor.r, puColor.g, puColor.b);
          uiBuffer.text(ITEM_ICONS[pu.type], startX + xOffset, startY - 10);

          uiBuffer.noStroke();
          uiBuffer.fill(50, 50, 50, 200);
          uiBuffer.rect(startX + xOffset, startY, barWidth, barHeight, 4);

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

      // アイテム収集エフェクト 🎁
      for (let i = itemCollectEffects.length - 1; i >= 0; i--) {
        const effect = itemCollectEffects[i];
        effect.life -= 0.015;
        effect.scale = p.min(effect.scale + 0.15, 1.2);

        if (effect.life <= 0) {
          itemCollectEffects.splice(i, 1);
          continue;
        }

        const effectColor = ITEM_COLORS[effect.type];
        const icon = ITEM_ICONS[effect.type];
        const name = ITEM_NAMES[effect.type];
        const yOffset = (1 - effect.life) * -30;

        // 背景
        uiBuffer.push();
        uiBuffer.noStroke();
        uiBuffer.fill(20, 30, 50, effect.life * 180);
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
        uiBuffer.textSize(20 * effect.scale);
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

      // ゲームオーバー / 勝利オーバーレイ 🎄
      if (game.state === 'gameOver' || game.state === 'victory') {
        uiBuffer.fill(15, 25, 45, 220);
        uiBuffer.rect(0, 0, config.canvasWidth, config.canvasHeight);

        const isVictory = game.state === 'victory';

        uiBuffer.push();
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.textSize(36);

        if (isVictory) {
          uiBuffer.fill(255, 215, 0);  // 金色
        } else {
          uiBuffer.fill(200, 50, 50);  // 赤
        }

        uiBuffer.text(
          isVictory ? '🎄 Merry Christmas! 🎄' : '⛄ また挑戦してね！',
          config.canvasWidth / 2,
          config.canvasHeight / 2 - 50,
        );

        uiBuffer.textSize(28);
        uiBuffer.fill(255, 215, 0);
        uiBuffer.text(
          `Score: ${game.score}`,
          config.canvasWidth / 2,
          config.canvasHeight / 2 + 10,
        );

        uiBuffer.textSize(18);
        uiBuffer.fill(200, 230, 255);
        uiBuffer.text(
          'タップしてリトライ',
          config.canvasWidth / 2,
          config.canvasHeight / 2 + 60,
        );

        uiBuffer.pop();
      }

      // 一時停止オーバーレイ
      if (game.state === 'paused') {
        uiBuffer.fill(15, 25, 45, 180);
        uiBuffer.rect(0, 0, config.canvasWidth, config.canvasHeight);

        uiBuffer.push();
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.textSize(36);
        uiBuffer.fill(255, 215, 0);
        uiBuffer.text(
          '⏸ PAUSED',
          config.canvasWidth / 2,
          config.canvasHeight / 2,
        );
        uiBuffer.pop();
      }

      // 準備画面 🎄
      if (game.state === 'ready') {
        uiBuffer.push();
        uiBuffer.textAlign(p.CENTER, p.CENTER);
        uiBuffer.textStyle(p.BOLD);
        uiBuffer.textSize(22);
        uiBuffer.fill(255, 215, 0);
        uiBuffer.text(
          '🎄 タップしてスタート 🎄',
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
     * マウスドラッグ
     */
    p.mouseDragged = () => {
      const game = useBreakoutStore.getState().game;
      if (game.state !== 'playing' && game.state !== 'ready') return;

      const targetX = p.mouseX;
      useBreakoutStore.getState().handlePointerMove(targetX, 0, 1);
      return false;
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
        return false;
      }
    };

    p.keyReleased = () => {
      useBreakoutStore.getState().handleKeyUp(p.key);
    };
  };
};
