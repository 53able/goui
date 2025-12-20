/**
 * ゲームサウンドマネージャー
 * Web Audio APIを使用したシンセサイザーベースの効果音
 *
 * ⚠️ SSR対応: AudioContextはクライアントサイドでのみ初期化
 */

/** サウンドが有効かどうか */
let soundEnabled = true;

/** AudioContext（遅延初期化） */
let audioContext: AudioContext | null = null;

/**
 * AudioContextを取得（遅延初期化）
 */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      )();
    } catch {
      console.warn('Web Audio API is not supported');
      return null;
    }
  }

  return audioContext;
};

/**
 * サウンドの有効/無効を切り替え
 */
export const toggleSound = (): boolean => {
  soundEnabled = !soundEnabled;
  return soundEnabled;
};

/**
 * サウンドが有効かどうか
 */
export const isSoundEnabled = (): boolean => soundEnabled;

/**
 * ブロック破壊音（ピュン！）
 * @param pitch - ピッチ調整（0.5-2.0）
 */
export const playHitSound = (pitch = 1.0): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // オシレーター（矩形波）
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800 * pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    200 * pitch,
    ctx.currentTime + 0.1,
  );

  // ゲイン（音量エンベロープ）
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  // 接続
  osc.connect(gain);
  gain.connect(ctx.destination);

  // 再生
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

/**
 * コンボ音（テテテン！）
 * @param comboCount - コンボ数（ピッチに影響）
 */
export const playComboSound = (comboCount: number): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // コンボ数に応じてピッチアップ
  const basePitch = 400 + comboCount * 50;

  // 3音のアルペジオ
  const notes = [basePitch, basePitch * 1.25, basePitch * 1.5];

  for (let i = 0; i < notes.length; i++) {
    const time = ctx.currentTime + i * 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(notes[i], time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  }
};

/**
 * パドルヒット音（ポン！）
 */
export const playPaddleSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
};

/**
 * 壁バウンド音（ボン！）
 */
export const playWallSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
};

/**
 * ゲームオーバー音（ブブー）
 */
export const playGameOverSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // 低音の不協和音
  const frequencies = [100, 95];

  for (const freq of frequencies) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      freq * 0.5,
      ctx.currentTime + 0.5,
    );

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }
};

/**
 * 勝利音（ファンファーレ！）
 */
export const playVictorySound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // 勝利のメロディ（ドミソド）
  const melody = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const durations = [0.15, 0.15, 0.15, 0.3];

  let time = ctx.currentTime;

  for (let i = 0; i < melody.length; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(melody[i], time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + durations[i]);

    time += durations[i];
  }
};

/**
 * ライフ減少音（ピロリン↓）
 */
export const playLifeLostSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};

/**
 * スタート音（ピュイン！）
 */
export const playStartSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
};

/**
 * アイテム取得音（キラーン✨）
 * 上昇するアルペジオで「ゲット！」感を演出
 */
export const playItemSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // キラキラした上昇音（4音アルペジオ）
  const notes = [880, 1100, 1320, 1760]; // A5, C#6, E6, A6

  for (let i = 0; i < notes.length; i++) {
    const time = ctx.currentTime + i * 0.04;

    // メイン音（正弦波）
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(notes[i], time);

    // サブ音（倍音）
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(notes[i] * 2, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.04, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
    osc2.start(time);
    osc2.stop(time + 0.1);
  }
};
