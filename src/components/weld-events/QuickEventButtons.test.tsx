import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/utils/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { QuickEventButtons } from './QuickEventButtons';

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

describe('QuickEventButtons', () => {
  it('opens menu and calls onSelect with matching event type', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<QuickEventButtons onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'weldEvents.quickActions.logEvent' }));
    await user.click(screen.getByRole('menuitem', { name: 'weldEvents.quickActions.logWeld' }));
    await user.click(screen.getByRole('button', { name: 'weldEvents.quickActions.logEvent' }));
    await user.click(screen.getByRole('menuitem', { name: 'weldEvents.quickActions.logInspection' }));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'weld');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'visual-inspection');
  });

  it('disables trigger when disabled prop is true', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<QuickEventButtons onSelect={onSelect} disabled />);

    const trigger = screen.getByRole('button', { name: 'weldEvents.quickActions.logEvent' });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(onSelect).not.toHaveBeenCalled();
  });
});