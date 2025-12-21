import type {
  Ball,
  BreakoutGame,
  Brick,
  GameConfig,
  GameState,
  Item,
  ItemType,
  Paddle,
  PowerUp,
} from '@/schemas/breakout';

/**
 * ブロックの色パレット 🎁 クリスマスプレゼント風
 */
const BRICK_COLORS = [
  'hsl(0, 80%, 45%)',    // 🎅 クリスマスレッド
  'hsl(140, 60%, 35%)',  // 🌲 クリスマスグリーン
  'hsl(43, 100%, 50%)',  // ⭐ ゴールド
  'hsl(0, 0%, 90%)',     // ❄️ シルバーホワイト
  'hsl(340, 80%, 50%)',  // 🎀 ピンクレッド
  'hsl(160, 50%, 40%)',  // 🌿 ダークグリーン
];

/**
 * アイテムの出現確率（％）
 */
const ITEM_DROP_CHANCE = 15;

/**
 * アイテム種類と重み付け
 * @description 重みが高いほど出やすい
 */
const ITEM_WEIGHTS: { type: ItemType; weight: number }[] = [
  { type: 'expandPaddle', weight: 20 }, // 🔲 パドル拡張
  { type: 'shrinkPaddle', weight: 12 }, // 🔹 パドル縮小（デバフ）
  { type: 'piercingBall', weight: 12 }, // 🔥 貫通ボール
  { type: 'slowBall', weight: 15 }, // 🐢 スローボール
  { type: 'extraLife', weight: 8 }, // 💖 ライフ+1
  { type: 'speedUp', weight: 12 }, // ⚡ スピードアップ
  { type: 'multiBall', weight: 18 }, // 🎱 マルチボール
];

/**
 * パワーアップの持続時間（フレーム数）
 * @description 60fps換算: 300 = 5秒, 600 = 10秒
 */
const POWERUP_DURATIONS: Record<ItemType, number> = {
  expandPaddle: 600, // 10秒
  shrinkPaddle: 300, // 5秒
  piercingBall: 480, // 8秒
  slowBall: 360, // 6秒
  extraLife: 0, // 即時効果
  speedUp: 480, // 8秒
  multiBall: 0, // 即時効果（ボール追加）
};

/**
 * 重み付きランダムでアイテムタイプを選択
 * @returns 選ばれたアイテムタイプ
 */
const pickRandomItemType = (): ItemType => {
  const totalWeight = ITEM_WEIGHTS.reduce((sum, i) => sum + i.weight, 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const item of ITEM_WEIGHTS) {
    cumulative += item.weight;
    if (random < cumulative) {
      return item.type;
    }
  }
  return 'expandPaddle'; // フォールバック
};

/**
 * アイテムを生成（ブロック破壊時）
 * @param x - X座標
 * @param y - Y座標
 * @returns 生成されたアイテム or null
 */
export const maybeSpawnItem = (x: number, y: number): Item | null => {
  if (Math.random() * 100 > ITEM_DROP_CHANCE) {
    return null;
  }

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    x,
    y,
    type: pickRandomItemType(),
    speed: 2,
    size: 12,
  };
};

/**
 * アイテムとパドルの衝突判定
 * @param item - アイテム
 * @param paddle - パドル
 * @returns 衝突しているか
 */
const checkItemPaddleCollision = (item: Item, paddle: Paddle): boolean => {
  return (
    item.x + item.size > paddle.x &&
    item.x - item.size < paddle.x + paddle.width &&
    item.y + item.size > paddle.y &&
    item.y - item.size < paddle.y + paddle.height
  );
};

/**
 * パワーアップ効果を適用
 * @param game - 現在のゲーム状態
 * @param itemType - アイテムの種類
 * @returns 更新されたゲーム状態
 */
export const applyPowerUp = (
  game: BreakoutGame,
  itemType: ItemType,
): BreakoutGame => {
  const { paddle, ball, extraBalls, powerUps, config } = game;
  const duration = POWERUP_DURATIONS[itemType];

  // 即時効果: ライフ+1
  if (itemType === 'extraLife') {
    return {
      ...game,
      lives: game.lives + 1,
    };
  }

  // 即時効果: マルチボール（+5個）
  if (itemType === 'multiBall') {
    // 現在のボール速度
    const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
    const baseAngle = Math.atan2(ball.velocity.y, ball.velocity.x);

    // 扇状に5つのボールを追加（-60度〜+60度）
    const newBalls: Ball[] = [];
    for (let i = 0; i < 5; i++) {
      const angleOffset = ((i - 2) * Math.PI) / 6; // -60, -30, 0, +30, +60度
      newBalls.push({
        x: ball.x,
        y: ball.y,
        radius: ball.radius,
        velocity: {
          x: Math.cos(baseAngle + angleOffset) * speed,
          y: Math.sin(baseAngle + angleOffset) * speed,
        },
      });
    }

    return {
      ...game,
      extraBalls: [...extraBalls, ...newBalls],
    };
  }

  // 既存の同種パワーアップを更新（時間リセット）
  const existingIdx = powerUps.findIndex((p) => p.type === itemType);
  const newPowerUp: PowerUp = {
    type: itemType,
    remainingTime: duration,
    maxTime: duration,
  };

  const newPowerUps =
    existingIdx >= 0
      ? powerUps.map((p, i) => (i === existingIdx ? newPowerUp : p))
      : [...powerUps, newPowerUp];

  // パドルサイズ変更
  let newPaddle = paddle;
  if (itemType === 'expandPaddle') {
    const newWidth = Math.min(config.paddleWidth * 1.5, 200);
    newPaddle = {
      ...paddle,
      width: newWidth,
      x: Math.max(0, Math.min(config.canvasWidth - newWidth, paddle.x)),
    };
  } else if (itemType === 'shrinkPaddle') {
    const newWidth = Math.max(config.paddleWidth * 0.7, 50);
    newPaddle = {
      ...paddle,
      width: newWidth,
    };
  }

  // ボール速度変更
  let newBall = ball;
  if (itemType === 'slowBall') {
    const currentSpeed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
    const targetSpeed = config.ballSpeed * 0.6;
    if (currentSpeed > targetSpeed) {
      const ratio = targetSpeed / currentSpeed;
      newBall = {
        ...ball,
        velocity: {
          x: ball.velocity.x * ratio,
          y: ball.velocity.y * ratio,
        },
      };
    }
  } else if (itemType === 'speedUp') {
    const currentSpeed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
    const targetSpeed = config.ballSpeed * 1.5;
    if (currentSpeed < targetSpeed) {
      const ratio = targetSpeed / currentSpeed;
      newBall = {
        ...ball,
        velocity: {
          x: ball.velocity.x * ratio,
          y: ball.velocity.y * ratio,
        },
      };
    }
  }

  return {
    ...game,
    paddle: newPaddle,
    ball: newBall,
    powerUps: newPowerUps,
  };
};

/**
 * パワーアップ効果を解除
 * @param game - 現在のゲーム状態
 * @param itemType - アイテムの種類
 * @returns 更新されたゲーム状態
 */
const removePowerUpEffect = (
  game: BreakoutGame,
  itemType: ItemType,
): BreakoutGame => {
  const { paddle, ball, config } = game;

  // パドルサイズをリセット
  if (itemType === 'expandPaddle' || itemType === 'shrinkPaddle') {
    return {
      ...game,
      paddle: {
        ...paddle,
        width: config.paddleWidth,
        x: Math.max(
          0,
          Math.min(config.canvasWidth - config.paddleWidth, paddle.x),
        ),
      },
    };
  }

  // ボール速度をリセット
  if (itemType === 'slowBall' || itemType === 'speedUp') {
    const currentSpeed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
    const ratio = config.ballSpeed / currentSpeed;
    return {
      ...game,
      ball: {
        ...ball,
        velocity: {
          x: ball.velocity.x * ratio,
          y: ball.velocity.y * ratio,
        },
      },
    };
  }

  return game;
};

/**
 * パワーアップのタイマーを更新
 * @param game - 現在のゲーム状態
 * @returns 更新されたゲーム状態
 */
const updatePowerUps = (game: BreakoutGame): BreakoutGame => {
  const { powerUps } = game;
  let updatedGame = game;

  // 期限切れパワーアップを処理
  const expiredTypes: ItemType[] = [];
  const activePowerUps = powerUps.reduce<PowerUp[]>((acc, pu) => {
    const newRemainingTime = pu.remainingTime - 1;
    if (newRemainingTime <= 0) {
      expiredTypes.push(pu.type);
      return acc;
    }
    return [...acc, { ...pu, remainingTime: newRemainingTime }];
  }, []);

  // 期限切れ効果を解除
  for (const type of expiredTypes) {
    updatedGame = removePowerUpEffect(updatedGame, type);
  }

  return {
    ...updatedGame,
    powerUps: activePowerUps,
  };
};

/**
 * 貫通ボールが有効かチェック
 * @param powerUps - アクティブなパワーアップ
 * @returns 貫通ボールが有効か
 */
export const hasPiercingBall = (powerUps: PowerUp[]): boolean => {
  return powerUps.some((p) => p.type === 'piercingBall');
};

/**
 * パドルを初期化
 * @param config - ゲーム設定
 * @returns 初期パドル状態
 */
export const createPaddle = (config: GameConfig): Paddle => ({
  x: (config.canvasWidth - config.paddleWidth) / 2,
  y: config.canvasHeight - config.paddleHeight - 20,
  width: config.paddleWidth,
  height: config.paddleHeight,
});

/**
 * ボールを初期化（パドルの上に配置）
 * @param config - ゲーム設定
 * @param paddle - パドル
 * @returns 初期ボール状態
 */
export const createBall = (config: GameConfig, paddle: Paddle): Ball => ({
  x: paddle.x + paddle.width / 2,
  y: paddle.y - config.ballRadius - 2,
  radius: config.ballRadius,
  velocity: { x: 0, y: 0 },
});

/**
 * ブロック配列を初期化
 * @param config - ゲーム設定
 * @returns ブロック配列
 */
export const createBricks = (config: GameConfig): Brick[] => {
  const bricks: Brick[] = [];

  for (let row = 0; row < config.brickRows; row++) {
    for (let col = 0; col < config.brickCols; col++) {
      bricks.push({
        x:
          config.brickOffsetLeft +
          col * (config.brickWidth + config.brickPadding),
        y:
          config.brickOffsetTop +
          row * (config.brickHeight + config.brickPadding),
        width: config.brickWidth,
        height: config.brickHeight,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        destroyed: false,
        row,
      });
    }
  }

  return bricks;
};

/**
 * ゲームを初期化
 * @param config - ゲーム設定
 * @returns 初期ゲーム状態
 */
export const createGame = (config: GameConfig): BreakoutGame => {
  const paddle = createPaddle(config);
  const ball = createBall(config, paddle);
  const bricks = createBricks(config);

  return {
    paddle,
    ball,
    extraBalls: [],
    bricks,
    items: [],
    powerUps: [],
    score: 0,
    lives: config.lives,
    level: 1,
    state: 'ready',
    config,
  };
};

/**
 * ボールを発射
 * @param game - 現在のゲーム状態
 * @returns 新しいゲーム状態
 */
export const launchBall = (game: BreakoutGame): BreakoutGame => {
  // ランダムな角度で発射（-60度〜60度、必ず上向き）
  const angle = (Math.random() - 0.5) * (Math.PI / 1.5); // -60度〜60度
  const speed = game.config.ballSpeed;

  return {
    ...game,
    ball: {
      ...game.ball,
      velocity: {
        x: Math.sin(angle) * speed,
        y: -Math.abs(Math.cos(angle) * speed), // 必ず上向き（負の値）
      },
    },
    state: 'playing',
  };
};

/**
 * パドルを移動
 * @param paddle - 現在のパドル
 * @param direction - 移動方向 (-1: 左, 1: 右)
 * @param config - ゲーム設定
 * @returns 新しいパドル位置
 */
export const movePaddle = (
  paddle: Paddle,
  direction: -1 | 0 | 1,
  config: GameConfig,
): Paddle => {
  const newX = paddle.x + direction * config.paddleSpeed;
  return {
    ...paddle,
    x: Math.max(0, Math.min(config.canvasWidth - paddle.width, newX)),
  };
};

/**
 * パドルをマウス/タッチ位置に移動
 * @param paddle - 現在のパドル
 * @param targetX - 目標X座標
 * @param config - ゲーム設定
 * @returns 新しいパドル位置
 */
export const movePaddleToPosition = (
  paddle: Paddle,
  targetX: number,
  config: GameConfig,
): Paddle => {
  const newX = targetX - paddle.width / 2;
  return {
    ...paddle,
    x: Math.max(0, Math.min(config.canvasWidth - paddle.width, newX)),
  };
};

/**
 * ボールとパドルの衝突判定
 * @param ball - ボール
 * @param paddle - パドル
 * @returns 衝突しているか
 */
const checkPaddleCollision = (ball: Ball, paddle: Paddle): boolean => {
  return (
    ball.x + ball.radius > paddle.x &&
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height
  );
};

/**
 * ボールとブロックの衝突判定
 * @param ball - ボール
 * @param brick - ブロック
 * @returns 衝突しているか
 */
const checkBrickCollision = (ball: Ball, brick: Brick): boolean => {
  if (brick.destroyed) return false;

  return (
    ball.x + ball.radius > brick.x &&
    ball.x - ball.radius < brick.x + brick.width &&
    ball.y + ball.radius > brick.y &&
    ball.y - ball.radius < brick.y + brick.height
  );
};

/**
 * ボールの壁・パドル衝突を処理（位置と速度を更新）
 * @returns 更新後のボールと落下フラグ
 */
const updateBallPhysics = (
  ball: Ball,
  paddle: Paddle,
  config: GameConfig,
): { ball: Ball; fellDown: boolean } => {
  const newBall = { ...ball };
  let fellDown = false;

  // ボールを移動
  newBall.x += newBall.velocity.x;
  newBall.y += newBall.velocity.y;

  // 壁との衝突（左右）
  if (newBall.x - newBall.radius <= 0) {
    newBall.x = newBall.radius;
    newBall.velocity = { ...newBall.velocity, x: Math.abs(newBall.velocity.x) };
  } else if (newBall.x + newBall.radius >= config.canvasWidth) {
    newBall.x = config.canvasWidth - newBall.radius;
    newBall.velocity = {
      ...newBall.velocity,
      x: -Math.abs(newBall.velocity.x),
    };
  }

  // 壁との衝突（上）
  if (newBall.y - newBall.radius <= 0) {
    newBall.y = newBall.radius;
    newBall.velocity = { ...newBall.velocity, y: Math.abs(newBall.velocity.y) };
  }

  // 下に落ちた
  if (newBall.y + newBall.radius >= config.canvasHeight) {
    fellDown = true;
  }

  // パドルとの衝突
  if (!fellDown && checkPaddleCollision(newBall, paddle)) {
    const hitPos = (newBall.x - paddle.x) / paddle.width;
    const angle = (hitPos - 0.5) * (Math.PI / 3);
    const speed = Math.sqrt(newBall.velocity.x ** 2 + newBall.velocity.y ** 2);

    newBall.y = paddle.y - newBall.radius;
    newBall.velocity = {
      x: Math.sin(angle) * speed,
      y: -Math.abs(Math.cos(angle) * speed),
    };
  }

  return { ball: newBall, fellDown };
};

/**
 * ボール同士の衝突判定
 * @param ball1 - ボール1
 * @param ball2 - ボール2
 * @returns 衝突しているか
 */
const checkBallCollision = (ball1: Ball, ball2: Ball): boolean => {
  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = ball1.radius + ball2.radius;
  return distance < minDistance;
};

/**
 * ボール同士の弾性衝突を処理（質量が等しい場合）
 * @description 運動量保存則に基づいて速度ベクトルを更新
 * @param ball1 - ボール1
 * @param ball2 - ボール2
 * @returns 衝突後の2つのボール
 */
const resolveBallCollision = (
  ball1: Ball,
  ball2: Ball,
): { ball1: Ball; ball2: Ball } => {
  // 中心間のベクトル
  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 衝突していない or 重なりすぎ → 処理しない
  if (distance === 0 || distance > ball1.radius + ball2.radius) {
    return { ball1, ball2 };
  }

  // 正規化された衝突法線ベクトル
  const nx = dx / distance;
  const ny = dy / distance;

  // 相対速度
  const dvx = ball1.velocity.x - ball2.velocity.x;
  const dvy = ball1.velocity.y - ball2.velocity.y;

  // 法線方向の相対速度（内積）
  const dvn = dvx * nx + dvy * ny;

  // 離れていく方向なら衝突しない
  if (dvn >= 0) {
    return { ball1, ball2 };
  }

  // 質量が等しい場合の弾性衝突: 法線方向の速度成分を交換
  const impulse = dvn; // 質量が等しいので単純化

  const newBall1 = {
    ...ball1,
    velocity: {
      x: ball1.velocity.x - impulse * nx,
      y: ball1.velocity.y - impulse * ny,
    },
  };

  const newBall2 = {
    ...ball2,
    velocity: {
      x: ball2.velocity.x + impulse * nx,
      y: ball2.velocity.y + impulse * ny,
    },
  };

  // ボールが重なっている場合、位置を補正
  const overlap = ball1.radius + ball2.radius - distance;
  if (overlap > 0) {
    const separationX = (overlap / 2) * nx;
    const separationY = (overlap / 2) * ny;

    return {
      ball1: {
        ...newBall1,
        x: newBall1.x - separationX,
        y: newBall1.y - separationY,
      },
      ball2: {
        ...newBall2,
        x: newBall2.x + separationX,
        y: newBall2.y + separationY,
      },
    };
  }

  return { ball1: newBall1, ball2: newBall2 };
};

/**
 * ボールとブロックの衝突を処理
 * @returns 更新後のボール、ブロック、破壊位置
 */
const updateBallBrickCollisions = (
  ball: Ball,
  bricks: Brick[],
  isPiercing: boolean,
  config: GameConfig,
): {
  ball: Ball;
  bricks: Brick[];
  destroyedPositions: { x: number; y: number }[];
  scoreGained: number;
} => {
  const newBall = { ...ball };
  let newBricks = [...bricks];
  const destroyedPositions: { x: number; y: number }[] = [];
  let scoreGained = 0;

  for (let i = 0; i < newBricks.length; i++) {
    const brick = newBricks[i];
    if (checkBrickCollision(newBall, brick)) {
      newBricks = newBricks.map((b, idx) =>
        idx === i ? { ...b, destroyed: true } : b,
      );

      scoreGained += (config.brickRows - brick.row) * 10;
      destroyedPositions.push({
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
      });

      if (!isPiercing) {
        const overlapLeft = newBall.x + newBall.radius - brick.x;
        const overlapRight =
          brick.x + brick.width - (newBall.x - newBall.radius);
        const overlapTop = newBall.y + newBall.radius - brick.y;
        const overlapBottom =
          brick.y + brick.height - (newBall.y - newBall.radius);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          newBall.velocity = { ...newBall.velocity, x: -newBall.velocity.x };
        } else {
          newBall.velocity = { ...newBall.velocity, y: -newBall.velocity.y };
        }
        break;
      }
    }
  }

  return { ball: newBall, bricks: newBricks, destroyedPositions, scoreGained };
};

/**
 * ゲームを1フレーム更新
 * @param game - 現在のゲーム状態
 * @returns 新しいゲーム状態
 */
export const updateGame = (game: BreakoutGame): BreakoutGame => {
  if (game.state !== 'playing') {
    return game;
  }

  const { ball, extraBalls, paddle, bricks, items, powerUps, config } = game;
  let newBricks = [...bricks];
  let newItems = [...items];
  let newScore = game.score;
  let newLives = game.lives;
  let newState: GameState = game.state;
  let updatedGame = game;
  const isPiercing = hasPiercingBall(powerUps);
  const allDestroyedPositions: { x: number; y: number }[] = [];

  // === メインボールの更新 ===
  const mainBallResult = updateBallPhysics(ball, paddle, config);
  let newMainBall = mainBallResult.ball;
  const mainBallFell = mainBallResult.fellDown;

  // メインボールのブロック衝突（落ちてなければ）
  if (!mainBallFell) {
    const collision = updateBallBrickCollisions(
      newMainBall,
      newBricks,
      isPiercing,
      config,
    );
    newMainBall = collision.ball;
    newBricks = collision.bricks;
    newScore += collision.scoreGained;
    allDestroyedPositions.push(...collision.destroyedPositions);
  }

  // === 追加ボールの更新 ===
  const survivingExtraBalls: Ball[] = [];
  for (const extraBall of extraBalls) {
    const result = updateBallPhysics(extraBall, paddle, config);

    // 落ちたボールは削除
    if (result.fellDown) {
      continue;
    }

    // ブロック衝突
    const collision = updateBallBrickCollisions(
      result.ball,
      newBricks,
      isPiercing,
      config,
    );
    survivingExtraBalls.push(collision.ball);
    newBricks = collision.bricks;
    newScore += collision.scoreGained;
    allDestroyedPositions.push(...collision.destroyedPositions);
  }

  // === ボール同士の衝突処理 ===
  // メインボールが生きていて、追加ボールがある場合のみ処理
  if (!mainBallFell && survivingExtraBalls.length > 0) {
    // メインボール vs 各追加ボール
    for (let i = 0; i < survivingExtraBalls.length; i++) {
      if (checkBallCollision(newMainBall, survivingExtraBalls[i])) {
        const resolved = resolveBallCollision(
          newMainBall,
          survivingExtraBalls[i],
        );
        newMainBall = resolved.ball1;
        survivingExtraBalls[i] = resolved.ball2;
      }
    }

    // 追加ボール同士の衝突（全ペアチェック）
    for (let i = 0; i < survivingExtraBalls.length; i++) {
      for (let j = i + 1; j < survivingExtraBalls.length; j++) {
        if (checkBallCollision(survivingExtraBalls[i], survivingExtraBalls[j])) {
          const resolved = resolveBallCollision(
            survivingExtraBalls[i],
            survivingExtraBalls[j],
          );
          survivingExtraBalls[i] = resolved.ball1;
          survivingExtraBalls[j] = resolved.ball2;
        }
      }
    }
  }

  // === メインボールが落ちた場合の処理 ===
  if (mainBallFell) {
    if (survivingExtraBalls.length > 0) {
      // 追加ボールが残っている → 最初の追加ボールをメインに昇格
      newMainBall = survivingExtraBalls[0];
      survivingExtraBalls.shift();
    } else {
      // 全ボール落ちた → ライフ減少
      newLives--;
      if (newLives <= 0) {
        newState = 'gameOver';
      } else {
        newMainBall = createBall(config, paddle);
        newState = 'ready';
      }
    }
  }

  // 破壊されたブロックからアイテムをドロップ
  for (const pos of allDestroyedPositions) {
    const item = maybeSpawnItem(pos.x, pos.y);
    if (item) {
      newItems = [...newItems, item];
    }
  }

  // アイテムの更新
  const collectedItems: Item[] = [];
  newItems = newItems.reduce<Item[]>((acc, item) => {
    const updatedItem = { ...item, y: item.y + item.speed };

    if (updatedItem.y - updatedItem.size > config.canvasHeight) {
      return acc;
    }

    if (checkItemPaddleCollision(updatedItem, paddle)) {
      collectedItems.push(updatedItem);
      return acc;
    }

    return [...acc, updatedItem];
  }, []);

  // 全ブロック破壊でレベルクリア
  if (newBricks.every((b) => b.destroyed)) {
    newState = 'levelClear';
  }

  // 仮のゲーム状態を作成
  updatedGame = {
    ...game,
    ball: newMainBall,
    extraBalls: survivingExtraBalls,
    bricks: newBricks,
    items: newItems,
    score: newScore,
    lives: newLives,
    state: newState,
  };

  // 収集したアイテムのパワーアップを適用
  for (const item of collectedItems) {
    updatedGame = applyPowerUp(updatedGame, item.type);
  }

  // パワーアップタイマー更新
  updatedGame = updatePowerUps(updatedGame);

  return updatedGame;
};

/**
 * ゲームをリセット
 * @param game - 現在のゲーム状態
 * @returns 新しいゲーム状態
 */
export const resetGame = (game: BreakoutGame): BreakoutGame => {
  return createGame(game.config);
};

/**
 * 最大レベル（これをクリアしたら完全勝利）
 */
const MAX_LEVEL = 10;

/**
 * レベルに応じたボール速度倍率
 * @param level - 現在のレベル
 * @returns 速度倍率（1.0〜）
 */
const getSpeedMultiplier = (level: number): number => {
  // レベル1: 1.0倍、レベル10: 1.9倍（10%ずつ増加）
  return 1 + (level - 1) * 0.1;
};

/**
 * 次のレベルへ進む
 * @param game - 現在のゲーム状態
 * @returns 新しいゲーム状態
 */
export const advanceToNextLevel = (game: BreakoutGame): BreakoutGame => {
  const { config, score, lives, level } = game;
  const nextLevel = level + 1;

  // 最大レベルクリアで完全勝利
  if (nextLevel > MAX_LEVEL) {
    return {
      ...game,
      state: 'victory',
    };
  }

  // 新しいパドルとボール
  const paddle = createPaddle(config);
  const ball = createBall(config, paddle);

  // レベルに応じたボール速度調整（configを更新）
  const speedMultiplier = getSpeedMultiplier(nextLevel);
  const newConfig = {
    ...config,
    ballSpeed: (config.ballSpeed * speedMultiplier) / getSpeedMultiplier(level),
  };

  return {
    paddle,
    ball,
    extraBalls: [],
    bricks: createBricks(config),
    items: [],
    powerUps: [],
    score, // スコアは維持
    lives, // ライフも維持
    level: nextLevel,
    state: 'ready',
    config: newConfig,
  };
};
