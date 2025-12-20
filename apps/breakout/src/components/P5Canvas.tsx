import { type FC, useEffect, useRef, useState } from 'react';

/**
 * p5.jsスケッチ関数の型
 * instance modeで使用
 */
export type P5Sketch = (p: P5Instance) => void;

/**
 * p5インスタンスの型（動的インポート用）
 */
// biome-ignore lint/suspicious/noExplicitAny: p5.jsは動的インポートのため型定義が複雑
export type P5Instance = any;

/**
 * P5Canvasコンポーネントのプロパティ
 */
interface P5CanvasProps {
  /** p5.jsスケッチ関数 */
  sketch: P5Sketch;
  /** キャンバスのクラス名 */
  className?: string;
}

/**
 * p5.jsをReactで使用するためのラッパーコンポーネント
 * instance modeを使用してReactのライフサイクルと統合
 *
 * ⚠️ SSR対応: p5.jsはクライアントサイドでのみ動的にロードされる
 *
 * @example
 * ```tsx
 * const mySketch: P5Sketch = (p) => {
 *   p.setup = () => {
 *     p.createCanvas(400, 400, p.WEBGL);
 *   };
 *   p.draw = () => {
 *     p.background(0);
 *     p.box(50);
 *   };
 * };
 *
 * <P5Canvas sketch={mySketch} className="rounded-xl" />
 * ```
 */
export const P5Canvas: FC<P5CanvasProps> = ({ sketch, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // p5.jsの初期化（クライアントサイドのみ）
  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    // p5.jsを動的にインポート
    const initP5 = async () => {
      const p5Module = await import('p5');
      const p5 = p5Module.default;

      // p5インスタンスを作成
      if (containerRef.current && !p5InstanceRef.current) {
        p5InstanceRef.current = new p5(sketch, containerRef.current);
      }
    };

    initP5();

    // クリーンアップ: コンポーネントがアンマウントされたらp5を破棄
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [isClient, sketch]);

  // SSR時はプレースホルダーを表示
  if (!isClient) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full min-h-[200px] bg-muted/20 rounded-xl">
          <span className="text-muted-foreground animate-pulse">
            🎮 Loading...
          </span>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
};
