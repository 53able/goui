import type {
  Ball,
  BreakoutGame,
  Brick,
  GameConfig,
  GameState,
  Paddle,
} from '@/schemas/breakout';

/**
 * ブロックの色パレット（行ごとに異なる色）
 */
const BRICK_COLORS = [
  'hsl(0, 80%, 55%)', // 赤
  'hsl(30, 90%, 55%)', // オレンジ
  'hsl(60, 90%, 55%)', // 黄
  'hsl(120, 70%, 50%)', // 緑
  'hsl(180, 80%, 50%)', // シアン
  'hsl(270, 70%, 60%)', // 紫
];

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
    bricks,
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
 * ゲームを1フレーム更新
 * @param game - 現在のゲーム状態
 * @returns 新しいゲーム状態
 */
export const updateGame = (game: BreakoutGame): BreakoutGame => {
  if (game.state !== 'playing') {
    return game;
  }

  const { ball, paddle, bricks, config } = game;
  let newBall = { ...ball };
  let newBricks = [...bricks];
  let newScore = game.score;
  let newLives = game.lives;
  let newState: GameState = game.state;

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

  // 下に落ちた（ライフ減少）
  if (newBall.y + newBall.radius >= config.canvasHeight) {
    newLives--;
    if (newLives <= 0) {
      newState = 'gameOver';
    } else {
      // ボールをリセット
      newBall = createBall(config, paddle);
      newState = 'ready';
    }
  }

  // パドルとの衝突
  if (checkPaddleCollision(newBall, paddle)) {
    // パドルのどの位置に当たったかで反射角度を変える
    const hitPos = (newBall.x - paddle.x) / paddle.width;
    const angle = (hitPos - 0.5) * (Math.PI / 3); // -60度〜60度
    const speed = Math.sqrt(newBall.velocity.x ** 2 + newBall.velocity.y ** 2);

    newBall.y = paddle.y - newBall.radius;
    newBall.velocity = {
      x: Math.sin(angle) * speed,
      y: -Math.abs(Math.cos(angle) * speed),
    };
  }

  // ブロックとの衝突
  for (let i = 0; i < newBricks.length; i++) {
    const brick = newBricks[i];
    if (checkBrickCollision(newBall, brick)) {
      // ブロックを破壊
      newBricks = newBricks.map((b, idx) =>
        idx === i ? { ...b, destroyed: true } : b,
      );

      // スコア加算（上の行ほど高得点）
      newScore += (config.brickRows - brick.row) * 10;

      // 反射方向を決定（より正確な衝突判定）
      const overlapLeft = newBall.x + newBall.radius - brick.x;
      const overlapRight = brick.x + brick.width - (newBall.x - newBall.radius);
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

      break; // 1フレームで1つのブロックのみ破壊
    }
  }

  // 全ブロック破壊で勝利
  if (newBricks.every((b) => b.destroyed)) {
    newState = 'victory';
  }

  return {
    ...game,
    ball: newBall,
    bricks: newBricks,
    score: newScore,
    lives: newLives,
    state: newState,
  };
};

/**
 * ゲームをリセット
 * @param game - 現在のゲーム状態
 * @returns 新しいゲーム状態
 */
export const resetGame = (game: BreakoutGame): BreakoutGame => {
  return createGame(game.config);
};
