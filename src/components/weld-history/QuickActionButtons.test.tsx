import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/utils/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { QuickActionButtons } from './QuickActionButtons';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>(
    'react-i18next'
  );
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

describe('QuickActionButtons', () => {
  it('opens menu and calls onSelect with matching event type', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<QuickActionButtons onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'weldHistory.quickActions.logEvent' }));
    await user.click(screen.getByRole('menuitem', { name: 'weldHistory.quickActions.logWeld' }));
    await user.click(screen.getByRole('button', { name: 'weldHistory.quickActions.logEvent' }));
    await user.click(screen.getByRole('menuitem', { name: 'weldHistory.quickActions.logInspection' }));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'weld');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'visual-inspection');
  });

  it('disables trigger when disabled prop is true', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<QuickActionButtons onSelect={onSelect} disabled />);

    const trigger = screen.getByRole('button', { name: 'weldHistory.quickActions.logEvent' });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(onSelect).not.toHaveBeenCalled();
  });
});