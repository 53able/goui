import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('TODOリストのタイトルが表示される', () => {
    render(<App />);
    expect(screen.getByText('TODO リスト')).toBeInTheDocument();
  });

  it('説明文が表示される', () => {
    render(<App />);
    expect(
      screen.getByText('タスクを整理して生産性を高めよう'),
    ).toBeInTheDocument();
  });

  it('タスク追加フォームが表示される', () => {
    render(<App />);
    expect(
      screen.getByPlaceholderText('新しいタスクを入力...'),
    ).toBeInTheDocument();
  });
});
