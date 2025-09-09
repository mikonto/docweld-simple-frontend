import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardGrid } from './CardGrid';

describe('CardGrid', () => {
  it('should render children within a grid container', () => {
    render(
      <CardGrid>
        <div data-testid="child-1">Card 1</div>
        <div data-testid="child-2">Card 2</div>
        <div data-testid="child-3">Card 3</div>
      </CardGrid>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('should render as a div with grid styles', () => {
    const { container } = render(
      <CardGrid>
        <div>Test Card</div>
      </CardGrid>
    );

    const gridElement = container.firstChild;
    expect(gridElement).toBeInTheDocument();
    expect(gridElement.tagName).toBe('DIV');
  });

  it('should apply additional className when provided', () => {
    const { container } = render(
      <CardGrid className="custom-class">
        <div>Test Card</div>
      </CardGrid>
    );

    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('custom-class');
  });

  it('should apply inline grid styles', () => {
    const { container } = render(
      <CardGrid>
        <div>Test Card</div>
      </CardGrid>
    );

    const gridElement = container.firstChild;
    const styles = window.getComputedStyle(gridElement);

    // Check inline styles are applied
    expect(styles.display).toBe('grid');
    expect(styles.gap).toBe('1rem');
    expect(styles.width).toBe('100%');
  });

  it('should handle empty children gracefully', () => {
    const { container } = render(<CardGrid>{null}</CardGrid>);

    const gridElement = container.firstChild;
    expect(gridElement).toBeInTheDocument();
    expect(gridElement.children).toHaveLength(0);
  });

  it('should maintain grid structure with various numbers of children', () => {
    const { rerender, container } = render(
      <CardGrid>
        <div>Card 1</div>
      </CardGrid>
    );

    let gridElement = container.firstChild;
    expect(gridElement.children).toHaveLength(1);

    // Add more children
    rerender(
      <CardGrid>
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
        <div>Card 4</div>
        <div>Card 5</div>
      </CardGrid>
    );

    gridElement = container.firstChild;
    expect(gridElement.children).toHaveLength(5);
  });

  it('should wrap all children as direct descendants of grid', () => {
    const { container } = render(
      <CardGrid>
        <div>Card 1</div>
        <span>Card 2</span>
        <article>Card 3</article>
      </CardGrid>
    );

    const gridElement = container.firstChild;
    const children = gridElement.children;

    expect(children[0].tagName).toBe('DIV');
    expect(children[1].tagName).toBe('SPAN');
    expect(children[2].tagName).toBe('ARTICLE');
  });
});
