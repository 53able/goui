import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwindクラスをマージするユーティリティ関数
 * @param inputs - クラス名の配列
 * @returns マージされたクラス名
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
