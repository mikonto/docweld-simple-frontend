import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/utils/testUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LanguageSwitcher } from './LanguageSwitcher';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ReactElement } from 'react';

// Helper function to render with i18n
const renderWithI18n = (component: ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.changeLanguage('en');
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should render with current language displayed', () => {
    renderWithI18n(<LanguageSwitcher />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧')).toBeInTheDocument();
  });

  it('should show available languages when opened', async () => {
    renderWithI18n(<LanguageSwitcher />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Dansk')).toBeInTheDocument();
    });
  });

  it('should change language and persist preference', async () => {
    renderWithI18n(<LanguageSwitcher />);

    // Open dropdown and select Danish
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const danskOption = screen.getByText('Dansk');
      fireEvent.click(danskOption);
    });

    // Verify language changed and was persisted
    await waitFor(() => {
      expect(i18n.language).toBe('da');
      expect(localStorage.getItem('language')).toBe('da');
    });
  });

  it('should load saved language preference', () => {
    localStorage.setItem('language', 'da');
    i18n.changeLanguage('da');

    renderWithI18n(<LanguageSwitcher />);

    expect(screen.getByText('Dansk')).toBeInTheDocument();
    expect(screen.getByText('🇩🇰')).toBeInTheDocument();
  });

  it('should display globe icon', () => {
    renderWithI18n(<LanguageSwitcher />);

    const globeIcon = screen.getByRole('combobox').querySelector('svg');
    expect(globeIcon).toBeInTheDocument();
  });
});