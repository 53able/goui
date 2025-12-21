/**
 * ファミコン風クリスマスサウンドマネージャー 🎄🎮
 * Web Audio APIを使用したチップチューン・クリスマス効果音
 *
 * ファミコン（NES）のPSG音源でクリスマスを表現:
 * - 矩形波（パルス波）: キラキラしたベル風メロディの「ピコピコ」
 * - 三角波: 温かいベース音
 * - ノイズ: スレイベル風の「シャカシャカ」
 * - 短いエンベロープ + クリスマスメロディ
 *
 * ⚠️ SSR対応: AudioContextはクライアントサイドでのみ初期化
 */

/** サウンドが有効かどうか */
let soundEnabled = true;

/** AudioContext（遅延初期化） */
let audioContext: AudioContext | null = null;

/** スレイベル風ノイズバッファ */
let sleighNoiseBuffer: AudioBuffer | null = null;

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
      sleighNoiseBuffer = createSleighNoise(audioContext);
    } catch {
      console.warn('Web Audio API is not supported');
      return null;
    }
  }

  return audioContext;
};

/**
 * ファミコン風スレイベルノイズを生成（LFSR風）
 * @param ctx - AudioContext
 */
const createSleighNoise = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  // ファミコン風LFSR（短周期モードで金属的な音）
  let lfsr = 1;
  for (let i = 0; i < bufferSize; i++) {
    // 6ビットLFSR（短周期 = 金属的）
    const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
    lfsr = (lfsr >> 1) | (bit << 5);

    output[i] = (lfsr & 1) * 2 - 1;

    // サンプルレートを下げて荒さを出す（8サンプル保持 = 高音寄り）
    if (i % 8 !== 0 && i > 0) {
      output[i] = output[i - (i % 8)];
    }
  }

  return buffer;
};

/**
 * ファミコン風矩形波を生成（デューティ比可変）
 * @param ctx - AudioContext
 * @param frequency - 周波数
 * @param dutyRatio - デューティ比（0.125, 0.25, 0.5）
 */
const createPulseOscillator = (
  ctx: AudioContext,
  frequency: number,
  dutyRatio: 0.125 | 0.25 | 0.5 = 0.5,
): OscillatorNode => {
  const osc = ctx.createOscillator();

  const harmonics = 32;
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);

  real[0] = 0;
  imag[0] = 0;

  for (let n = 1; n < harmonics; n++) {
    real[n] = 0;
    imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * dutyRatio);
  }

  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  osc.setPeriodicWave(wave);
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  return osc;
};

/**
 * ファミコン風三角波（16段階ステップ）
 * @param ctx - AudioContext
 * @param frequency - 周波数
 */
const createNesTriangle = (
  ctx: AudioContext,
  frequency: number,
): OscillatorNode => {
  const osc = ctx.createOscillator();

  const harmonics = 16;
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);

  real[0] = 0;
  imag[0] = 0;

  for (let n = 1; n < harmonics; n += 2) {
    imag[n] = (8 / (Math.PI * Math.PI * n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1);
  }

  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  osc.setPeriodicWave(wave);
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  return osc;
};

/**
 * ファミコン風スレイベル（ノイズチャンネル）
 * シャカシャカという金属的な鈴の音
 * @param ctx - AudioContext
 * @param duration - 持続時間
 * @param volume - 音量
 * @param startTime - 開始時間
 */
const playSleighBell = (
  ctx: AudioContext,
  duration: number,
  volume: number,
  startTime?: number,
): void => {
  if (!sleighNoiseBuffer) return;

  const start = startTime ?? ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = sleighNoiseBuffer;

  // ハイパスで金属感
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(6000, start);

  // ファミコン風の急峻なエンベロープ
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.setValueAtTime(volume * 0.6, start + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);

  source.connect(highpass);
  highpass.connect(envelope);
  envelope.connect(ctx.destination);

  source.start(start);
  source.stop(start + duration);
};

/**
 * スレイベルパターン（シャンシャンシャン）
 * @param ctx - AudioContext
 * @param count - 回数
 * @param interval - 間隔
 * @param volume - 音量
 */
const playSleighPattern = (
  ctx: AudioContext,
  count: number,
  interval: number,
  volume: number,
): void => {
  for (let i = 0; i < count; i++) {
    playSleighBell(ctx, 0.06, volume * (1 - i * 0.08), ctx.currentTime + i * interval);
  }
};

/**
 * ファミコン風ベル音（矩形波12.5%の高速アルペジオ）
 * キラキラ感を出すためのチップチューンベル
 * @param ctx - AudioContext
 * @param frequency - 基本周波数
 * @param duration - 持続時間
 * @param volume - 音量
 * @param startTime - 開始時間
 */
const playChipBell = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  startTime?: number,
): void => {
  const start = startTime ?? ctx.currentTime;

  // メイン音（12.5%デューティ = キラキラ感）
  const osc = createPulseOscillator(ctx, frequency, 0.125);

  // ファミコン風エンベロープ（急峻なアタック、速い減衰）
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.setValueAtTime(volume * 0.7, start + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);

  // オクターブ上の倍音（ベル感）
  const osc2 = createPulseOscillator(ctx, frequency * 2, 0.125);
  const envelope2 = ctx.createGain();
  envelope2.gain.setValueAtTime(volume * 0.3, start);
  envelope2.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.5);

  osc.connect(envelope);
  osc2.connect(envelope2);
  envelope.connect(ctx.destination);
  envelope2.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
  osc2.start(start);
  osc2.stop(start + duration);
};

/**
 * ファミコン風コード（アルペジオで表現）
 * 同時発音数制限を再現
 * @param ctx - AudioContext
 * @param notes - 音階配列
 * @param noteDuration - 各音の長さ
 * @param volume - 音量
 */
const playChipArpeggio = (
  ctx: AudioContext,
  notes: number[],
  noteDuration: number,
  volume: number,
): void => {
  // 超高速アルペジオでコード感を出す（ファミコン技法）
  const arpSpeed = 0.03;
  let time = ctx.currentTime;

  for (let repeat = 0; repeat < Math.ceil(noteDuration / (notes.length * arpSpeed)); repeat++) {
    for (let i = 0; i < notes.length; i++) {
      if (time < ctx.currentTime + noteDuration) {
        const osc = createPulseOscillator(ctx, notes[i], 0.25);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + arpSpeed * 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + arpSpeed);

        time += arpSpeed;
      }
    }
  }
};

/**
 * ファミコン風ベース音（三角波）
 * @param ctx - AudioContext
 * @param frequency - 周波数
 * @param duration - 持続時間
 * @param volume - 音量
 * @param startTime - 開始時間
 */
const playBass = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  startTime?: number,
): void => {
  const start = startTime ?? ctx.currentTime;
  const osc = createNesTriangle(ctx, frequency);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(volume, start);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(envelope);
  envelope.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
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
 * ブロック破壊音（ピコッ！キラン✨）
 * ファミコン風ベル音 + スレイベル
 * @param pitch - ピッチ調整（0.5-2.0）
 */
export const playHitSound = (pitch = 1.0): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // ファミコン風ベル（ピコッ！）
  playChipBell(ctx, 880 * pitch, 0.08, 0.15);

  // 軽いスレイベル
  playSleighBell(ctx, 0.04, 0.05);
};

/**
 * コンボ音（ピコピコピコ！シャンシャン！）
 * 上昇アルペジオ + スレイベル
 * @param comboCount - コンボ数（ピッチに影響）
 */
export const playComboSound = (comboCount: number): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const basePitch = Math.min(523.25 + comboCount * 50, 1046.5);

  // ファミコン風上昇アルペジオ（C-E-G-C）
  const notes = [basePitch, basePitch * 1.25, basePitch * 1.5, basePitch * 2];

  for (let i = 0; i < notes.length; i++) {
    playChipBell(ctx, notes[i], 0.1, 0.12, ctx.currentTime + i * 0.04);
  }

  // スレイベル
  playSleighPattern(ctx, 4, 0.04, 0.08);
};

/**
 * パドルヒット音（ポコッ♪）
 * ファミコン三角波
 */
export const playPaddleSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // 三角波でポコッ
  playBass(ctx, 220, 0.06, 0.2);

  // 軽い矩形波アクセント
  const osc = createPulseOscillator(ctx, 440, 0.5);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
};

/**
 * 壁バウンド音（ピン！）
 * 短い矩形波
 */
export const playWallSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = createPulseOscillator(ctx, 660, 0.25);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
};

/**
 * ゲームオーバー音（ブッブー↓）
 * 下降音 + 切ないアルペジオ
 */
export const playGameOverSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // 下降する矩形波（ブーッ）
  const osc = createPulseOscillator(ctx, 200, 0.5);
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);

  // 切ないマイナーアルペジオ（Am: A-C-E）
  playChipArpeggio(ctx, [220, 261.63, 329.63], 0.5, 0.06);

  // 三角波で低音
  playBass(ctx, 110, 0.5, 0.15, ctx.currentTime + 0.1);
};

/**
 * 勝利音（ジングルベル風ファンファーレ！🎄🎮）
 * ファミコン風クリスマスメロディ
 */
export const playVictorySound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // ジングルベル風メロディ（ミミミ・ミミミ・ミソドレミ♪）をファミコン音で
  const melody = [
    { note: 659.25, duration: 0.08 }, // E5
    { note: 659.25, duration: 0.08 }, // E5
    { note: 659.25, duration: 0.15 }, // E5（長め）
    { note: 659.25, duration: 0.08 }, // E5
    { note: 659.25, duration: 0.08 }, // E5
    { note: 659.25, duration: 0.15 }, // E5（長め）
    { note: 659.25, duration: 0.08 }, // E5
    { note: 783.99, duration: 0.08 }, // G5
    { note: 523.25, duration: 0.08 }, // C5
    { note: 587.33, duration: 0.08 }, // D5
    { note: 659.25, duration: 0.25 }, // E5（最後長め）
  ];

  let time = ctx.currentTime;
  for (const { note, duration } of melody) {
    playChipBell(ctx, note, duration + 0.05, 0.12, time);
    time += duration;
  }

  // ベース（三角波）でC-G
  playBass(ctx, 130.81, 0.3, 0.15, ctx.currentTime);       // C3
  playBass(ctx, 98, 0.3, 0.15, ctx.currentTime + 0.35);     // G2
  playBass(ctx, 130.81, 0.4, 0.15, ctx.currentTime + 0.7);  // C3

  // スレイベル！🔔
  playSleighPattern(ctx, 8, 0.08, 0.1);

  // 最後にCメジャーアルペジオ
  playChipArpeggio(ctx, [523.25, 659.25, 783.99], 0.4, 0.08);
};

/**
 * ライフ減少音（ピロリン↓）
 * 下降アルペジオ
 */
export const playLifeLostSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // 下降する3音
  const notes = [659.25, 523.25, 392];
  for (let i = 0; i < notes.length; i++) {
    playChipBell(ctx, notes[i], 0.12, 0.12, ctx.currentTime + i * 0.08);
  }
};

/**
 * スタート音（シャンシャン♪ピロリン！）
 * スレイベル + 上昇音
 */
export const playStartSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // スレイベル
  playSleighPattern(ctx, 5, 0.06, 0.12);

  // 上昇アルペジオ（C-E-G）
  playChipBell(ctx, 523.25, 0.1, 0.12, ctx.currentTime + 0.1);  // C5
  playChipBell(ctx, 659.25, 0.1, 0.12, ctx.currentTime + 0.18); // E5
  playChipBell(ctx, 783.99, 0.15, 0.15, ctx.currentTime + 0.26); // G5

  // ベース
  playBass(ctx, 130.81, 0.15, 0.12, ctx.currentTime + 0.1);
};

/**
 * アイテム取得音（シャカシャカ！キラキラ✨）
 * スレイベル + 高音アルペジオ
 */
export const playItemSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // スレイベルメイン
  playSleighPattern(ctx, 6, 0.03, 0.15);

  // 高音キラキラアルペジオ（オクターブ上）
  const sparkles = [1046.5, 1318.51, 1567.98, 2093]; // C6, E6, G6, C7

  for (let i = 0; i < sparkles.length; i++) {
    playChipBell(ctx, sparkles[i], 0.08, 0.08, ctx.currentTime + i * 0.04);
  }
};

/**
 * ボールロスト音（シャン...ピロン↓）
 * スレイベル + 下降音
 */
export const playBallLostSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // スレイベル
  playSleighBell(ctx, 0.1, 0.1);

  // 三角波で下降
  const osc = createNesTriangle(ctx, 440);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
};

/**
 * ハイスコア更新音（ファミコン風聖なる鐘🔔🎮）
 * アルペジオで荘厳に + スレイベル
 */
export const playHighScoreSound = (): void => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Cメジャーセブンスアルペジオ（荘厳）
  const chord = [261.63, 329.63, 392, 493.88]; // C, E, G, B

  for (let i = 0; i < chord.length; i++) {
    playChipBell(ctx, chord[i], 0.4, 0.12, ctx.currentTime + i * 0.15);
  }

  // オクターブ上で繰り返し
  for (let i = 0; i < chord.length; i++) {
    playChipBell(ctx, chord[i] * 2, 0.3, 0.1, ctx.currentTime + 0.6 + i * 0.1);
  }

  // 三角波ベース
  playBass(ctx, 65.41, 0.8, 0.15, ctx.currentTime); // C2
  playBass(ctx, 98, 0.6, 0.12, ctx.currentTime + 0.8); // G2

  // スレイベル盛大に
  playSleighPattern(ctx, 10, 0.06, 0.1);

  // 最後にキラキラ
  playChipBell(ctx, 2093, 0.5, 0.08, ctx.currentTime + 1.2); // C7
};
