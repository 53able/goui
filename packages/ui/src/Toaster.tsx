import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import type { CSSProperties, FC } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Toasterコンポーネント
 * @description Sonnerベースのトースト通知コンポーネント
 */
export const Toaster: FC<ToasterProps> = (props) => (
  <Sonner
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={
      {
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      } as CSSProperties
    }
    {...props}
  />
);

// Sonnerのtoast関数を再エクスポート
export { toast } from 'sonner';
