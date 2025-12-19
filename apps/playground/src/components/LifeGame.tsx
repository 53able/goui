import { Button, cn } from '@goui/ui';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLifeGameStore } from '@/stores/lifeGameStore';

/**
 * ビューポート幅に応じた最適なセルサイズを計算
 */
const useCellSize = () => {
  const [cellSize, setCellSize] = useState(12);

  useEffect(() => {
    const updateCellSize = () => {
      const width = window.innerWidth;
      // モバイルファースト: 小さい画面では大きめのセル（タッチしやすく）
      if (width < 480) {
        setCellSize(10);
      } else if (width < 768) {
        setCellSize(12);
      } else if (width < 1024) {
        setCellSize(14);
      } else {
        setCellSize(16);
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  return cellSize;
};

/**
 * ライフゲームメインコンポーネント
 * Conway's Game of Life の実装
 */
export const LifeGame: FC = () => {
  const {
    grid,
    generation,
    isRunning,
    config,
    step,
    toggleRunning,
    reset,
    clear,
    toggleCellAt,
    setInterval,
    setGridSize,
  } = useLifeGameStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellSize = useCellSize();

  // Canvas サイズを計算
  const canvasWidth = config.width * cellSize;
  const canvasHeight = config.height * cellSize;

  // グリッドサイズオプション（全デバイス共通）
  const widthOptions = [15, 20, 25, 30, 40, 50, 60];
  const heightOptions = [15, 20, 25, 30, 40, 50];

  /**
   * Canvasにグリッドを描画
   */
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const computedStyle = getComputedStyle(document.documentElement);
    const aliveColor =
      computedStyle.getPropertyValue('--color-cell-alive').trim() || '#22c55e';
    const deadColor =
      computedStyle.getPropertyValue('--color-cell-dead').trim() || '#f1f5f9';
    const borderColor =
      computedStyle.getPropertyValue('--color-grid-border').trim() || '#cbd5e1';

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const x = col * cellSize;
        const y = row * cellSize;
        const isAlive = grid[row][col];

        ctx.fillStyle = isAlive ? aliveColor : deadColor;
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }, [grid, cellSize]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  /**
   * Canvas上のクリック/タッチ位置からセル座標を計算
   */
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < config.height && col >= 0 && col < config.width) {
      toggleCellAt(row, col);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleCanvasInteraction(e.clientX, e.clientY);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      handleCanvasInteraction(touch.clientX, touch.clientY);
    }
  };

  /**
   * キーボードショートカット
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggleRunning();
          break;
        case 'n':
          if (!isRunning) step();
          break;
        case 'r':
          reset();
          break;
        case 'c':
          clear();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRunning, step, reset, clear, isRunning]);

  return (
    <div className="app-layout bg-background">
      {/* メインコンテンツ - Gentle Flex パターン */}
      <main className="flex flex-col items-center justify-center gap-4 p-4 sm:gap-6 sm:p-6">
        {/* ヘッダー */}
        <header className="text-center">
          <h1 className="game-title font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            Life Game
          </h1>
          <p className="game-subtitle text-muted-foreground mt-1 sm:mt-2">
            Conway's Game of Life
          </p>
        </header>

        {/* ステータス表示 */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground sm:text-base">
              世代:
            </span>
            <span className="generation-count font-mono font-bold text-primary">
              {generation.toLocaleString()}
            </span>
          </div>
          <div
            className={cn(
              'status-badge rounded-full font-medium transition-colors',
              isRunning
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
            )}
          >
            {isRunning ? '▶ 実行中' : '⏸ 停止'}
          </div>
        </div>

        {/* コントロールボタン - Deconstructed Pancake */}
        <div className="controls-grid w-full max-w-md">
          <Button
            onClick={toggleRunning}
            className={cn(
              'flex-1 min-w-[100px] transition-all',
              isRunning
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-emerald-500 hover:bg-emerald-600',
            )}
          >
            {isRunning ? '⏸ 停止' : '▶ 開始'}
          </Button>
          <Button
            onClick={step}
            disabled={isRunning}
            variant="outline"
            className="flex-1 min-w-[80px]"
          >
            ⏭ 次へ
          </Button>
          <Button
            onClick={reset}
            variant="outline"
            className="flex-1 min-w-[80px]"
          >
            🔄 リセット
          </Button>
          <Button
            onClick={clear}
            variant="outline"
            className="flex-1 min-w-[80px]"
          >
            🗑 クリア
          </Button>
        </div>

        {/* 設定パネル */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* 速度調整 */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            速度:
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={500 - config.interval + 50}
              onChange={(e) => setInterval(500 - Number(e.target.value) + 50)}
              className="slider-control accent-emerald-500"
            />
          </label>

          {/* グリッドサイズ */}
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              幅:
              <select
                value={config.width}
                onChange={(e) =>
                  setGridSize(Number(e.target.value), config.height)
                }
                className="select-control bg-background border border-grid-border rounded text-foreground"
              >
                {widthOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              高さ:
              <select
                value={config.height}
                onChange={(e) =>
                  setGridSize(config.width, Number(e.target.value))
                }
                className="select-control bg-background border border-grid-border rounded text-foreground"
              >
                {heightOptions.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* ゲームグリッド（Canvas）- Aspect Ratio 対応 */}
        <div className="canvas-container border-2 border-grid-border rounded-lg shadow-lg">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasTouch}
            className="w-full h-auto cursor-crosshair touch-none"
          />
        </div>

        {/* タッチヒント（モバイル向け） */}
        <p className="text-xs text-muted-foreground text-center sm:hidden">
          💡 セルをタップして生死を切り替え
        </p>

        {/* キーボードショートカット（デスクトップのみ） */}
        <div className="keyboard-hints text-xs text-muted-foreground text-center space-y-1">
          <p>💡 セルをクリックして生死を切り替え</p>
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span>
              <kbd className="px-2 py-0.5 bg-muted rounded">Space</kbd>{' '}
              開始/停止
            </span>
            <span>
              <kbd className="px-2 py-0.5 bg-muted rounded">N</kbd> 次へ
            </span>
            <span>
              <kbd className="px-2 py-0.5 bg-muted rounded">R</kbd> リセット
            </span>
            <span>
              <kbd className="px-2 py-0.5 bg-muted rounded">C</kbd> クリア
            </span>
          </p>
        </div>
      </main>

      {/* フッター - ルール説明 */}
      <footer className="p-4 sm:p-6">
        <details className="w-full max-w-xl mx-auto">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base">
            📖 ライフゲームのルール
          </summary>
          <div className="mt-3 p-3 sm:p-4 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-2">
            <p>
              <strong className="text-emerald-500">誕生:</strong>{' '}
              死んでいるセルの周囲にちょうど3つの生きたセルがあれば、次の世代で生まれる
            </p>
            <p>
              <strong className="text-cyan-500">生存:</strong>{' '}
              生きているセルの周囲に2つか3つの生きたセルがあれば、次の世代でも生き続ける
            </p>
            <p>
              <strong className="text-red-500">死亡:</strong>{' '}
              それ以外の場合、セルは死ぬ（過疎または過密）
            </p>
          </div>
        </details>
      </footer>
    </div>
  );
};
