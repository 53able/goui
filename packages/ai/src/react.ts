/**
 * @goui/ai/react - AI SDK React Hooks
 *
 * クライアントサイドで使用するReact用フック
 *
 * @example
 * ```typescript
 * import { useChat, useCompletion } from '@goui/ai/react';
 *
 * const { messages, input, handleInputChange, handleSubmit } = useChat();
 * ```
 *
 * @packageDocumentation
 */

// NOTE: @ai-sdk/react は別途各アプリでインストールが必要
// このファイルは将来的にカスタムフックを追加する場所として用意

/**
 * AI SDK React を使う場合は、各アプリで @ai-sdk/react をインストールして直接使用してください
 *
 * @example
 * ```bash
 * pnpm --filter @goui/web add @ai-sdk/react@beta
 * ```
 *
 * ```typescript
 * import { useChat } from '@ai-sdk/react';
 * ```
 */
export const AI_SDK_REACT_SETUP_INFO = `
AI SDK React を使う場合:

1. 各アプリで @ai-sdk/react をインストール:
   pnpm --filter @goui/web add @ai-sdk/react@beta

2. 直接インポートして使用:
   import { useChat, useCompletion } from '@ai-sdk/react';
`;
