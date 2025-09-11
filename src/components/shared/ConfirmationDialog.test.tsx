import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

const mockUseTranslation = useTranslation as MockedFunction<typeof useTranslation>;

describe('ConfirmationDialog', () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'common.cancel': 'Cancel',
          'common.confirm': 'Confirm',
        };
        return translations[key] || key;
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn(),
      } as any,
      ready: true,
    });
  });

  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item?',
    actionLabel: 'Delete',
    actionVariant: 'destructive' as const,
  };

  it('renders with all provided content when open', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this item?')
    ).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('handles button interactions correctly', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);

    // Test confirm action
    await user.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);

    // Test cancel action
    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses default labels when not provided', () => {
    const { actionLabel, ...propsWithoutLabel } = defaultProps;
    render(<ConfirmationDialog {...propsWithoutLabel} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('applies destructive variant', () => {
    render(
      <ConfirmationDialog {...defaultProps} actionVariant="destructive" />
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeInTheDocument();
  });
});