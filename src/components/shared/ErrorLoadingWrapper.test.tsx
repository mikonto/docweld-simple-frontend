import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorLoadingWrapper } from './ErrorLoadingWrapper';

describe('ErrorLoadingWrapper', () => {
  const TestChild = () => <div>Test Content</div>;

  it('renders children when not loading and no error', () => {
    render(
      <ErrorLoadingWrapper loading={false} error={null}>
        <TestChild />
      </ErrorLoadingWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows loading state and hides children', () => {
    render(
      <ErrorLoadingWrapper loading={true} error={null}>
        <TestChild />
      </ErrorLoadingWrapper>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('shows error message with default resource name', () => {
    const error = new Error('Something went wrong');
    render(
      <ErrorLoadingWrapper loading={false} error={error}>
        <TestChild />
      </ErrorLoadingWrapper>
    );

    expect(
      screen.getByText('Error loading data: Something went wrong')
    ).toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('shows error message with custom resource name', () => {
    const error = new Error('Network error');
    render(
      <ErrorLoadingWrapper loading={false} error={error} resourceName="users">
        <TestChild />
      </ErrorLoadingWrapper>
    );

    expect(
      screen.getByText('Error loading users: Network error')
    ).toBeInTheDocument();
  });

  it('prioritizes error over loading state', () => {
    const error = new Error('Error occurred');
    render(
      <ErrorLoadingWrapper loading={true} error={error}>
        <TestChild />
      </ErrorLoadingWrapper>
    );

    expect(
      screen.getByText('Error loading data: Error occurred')
    ).toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });
});