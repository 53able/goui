import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('Tetrisのスコア表示がある', () => {
    render(<App />);
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('Tetrisのレベル表示がある', () => {
    render(<App />);
    expect(screen.getByText('Lv')).toBeInTheDocument();
  });

  it('Tetrisのライン数表示がある', () => {
    render(<App />);
    expect(screen.getByText('Lines')).toBeInTheDocument();
  });
});
