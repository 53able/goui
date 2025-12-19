/**
 * チャットエージェント - 汎用的な対話AIエージェント
 *
 * @example
 * ```typescript
 * import { chatAgent } from '@goui/ai';
 *
 * // テキスト生成
 * const result = await chatAgent.generate({
 *   prompt: 'TypeScriptの利点を3つ教えて',
 * });
 * console.log(result.text);
 *
 * // ストリーミング
 * const stream = await chatAgent.stream({
 *   prompt: '小さな物語を書いて',
 * });
 * for await (const chunk of stream.textStream) {
 *   process.stdout.write(chunk);
 * }
 * ```
 *
 * @packageDocumentation
 */

import { openai } from '@ai-sdk/openai';
import { ToolLoopAgent } from 'ai';

/**
 * 汎用チャットエージェント
 *
 * GPT-4o-miniをデフォルトモデルとして使用するシンプルなエージェント。
 * カスタマイズが必要な場合は、ToolLoopAgentを直接使用することを推奨。
 */
export const chatAgent = new ToolLoopAgent({
  model: openai('gpt-4o-mini'),
  instructions: `あなたは親切で知識豊富なAIアシスタントです。
ユーザーの質問に対して、明確で役立つ回答を提供してください。
日本語で回答してください。`,
});
