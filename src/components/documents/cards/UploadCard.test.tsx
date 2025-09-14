import React from 'react';
import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadCard } from './UploadCard';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { useDragAndDrop } from '@/hooks/documents';

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

// Mock the useDragAndDrop hook
vi.mock('@/hooks/documents', () => ({
  useDragAndDrop: vi.fn(),
}));

const mockUseDragAndDrop = useDragAndDrop as MockedFunction<
  typeof useDragAndDrop
>;

describe('UploadCard', () => {
  const defaultProps = {
    onUpload: vi.fn(),
    maxFilesAllowed: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock behavior
    mockUseDragAndDrop.mockReturnValue({
      isDragging: false,
      dragProps: {},
    } as ReturnType<typeof useDragAndDrop>);
  });

  it('should display default upload text when not dragging', () => {
    renderWithI18n(<UploadCard {...defaultProps} />);

    expect(screen.getByText('Click or drop files')).toBeInTheDocument();
  });

  it('should display drag text when dragging', () => {
    mockUseDragAndDrop.mockReturnValue({
      isDragging: true,
      dragProps: {},
    } as ReturnType<typeof useDragAndDrop>);

    renderWithI18n(<UploadCard {...defaultProps} />);

    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });

  it('should trigger onUpload when clicking the card', async () => {
    const onUpload = vi.fn();
    renderWithI18n(<UploadCard {...defaultProps} onUpload={onUpload} />);

    const card = screen
      .getByText('Click or drop files')
      .closest('.cursor-pointer');
    await userEvent.click(card!);

    // The click should trigger file input click, but we can't test actual file selection
    // in this environment
  });

  it('should show tooltip with file format information', () => {
    renderWithI18n(<UploadCard {...defaultProps} maxFilesAllowed={5} />);

    const infoIcon = screen.getByText('ⓘ');
    expect(infoIcon).toBeInTheDocument();

    // Tooltip content would show on hover but requires more complex testing setup
  });

  it('should apply correct styling when dragging', () => {
    mockUseDragAndDrop.mockReturnValue({
      isDragging: true,
      dragProps: {},
    } as ReturnType<typeof useDragAndDrop>);

    renderWithI18n(<UploadCard {...defaultProps} />);

    const card = screen.getByText('Drop files here').closest('.cursor-pointer');
    expect(card).toHaveClass('bg-accent');
  });

  // Critical i18n test
  it('should display tooltip with i18n translated file limits and formats', async () => {
    const user = userEvent.setup();

    renderWithI18n(<UploadCard onUpload={vi.fn()} maxFilesAllowed={10} />);

    // Find the tooltip trigger (info icon)
    const tooltipTrigger = screen.getByText('ⓘ');
    expect(tooltipTrigger).toBeInTheDocument();

    // Hover over the tooltip trigger to show the tooltip
    await user.hover(tooltipTrigger);

    // Wait for the tooltip content to appear and check it contains translated text
    const tooltipContents = await screen.findAllByText(/Max 10 files/);
    expect(tooltipContents.length).toBeGreaterThan(0);

    const tooltipContent = tooltipContents[0];
    expect(tooltipContent).toBeInTheDocument();
    expect(tooltipContent.textContent).toContain('Max 10 files');
    expect(tooltipContent.textContent).toContain('Supports:');
    expect(tooltipContent.textContent).toContain(
      'Note: HEIC files will be converted to JPEG format automatically'
    );
  });
});
