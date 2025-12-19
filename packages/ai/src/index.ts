/**
 * @goui/ai - AI SDK 6 Beta 共有パッケージ
 *
 * Vercel AI SDK のセットアップと共有エージェント定義を提供
 *
 * @example
 * ```typescript
 * // サーバーサイドで使用
 * import { openai, generateText, streamText } from '@goui/ai';
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   prompt: 'こんにちは！',
 * });
 * ```
 *
 * @packageDocumentation
 */

// OpenAI Provider
export { createOpenAI, openai } from '@ai-sdk/openai';
// AI SDK Core - サーバーサイド用
export {
  generateObject,
  generateText,
  Output,
  streamObject,
  streamText,
  type Tool,
  type ToolExecutionOptions,
  ToolLoopAgent,
  tool,
} from 'ai';

// 共有エージェント
export { chatAgent } from './agents/chatAgent.js';
