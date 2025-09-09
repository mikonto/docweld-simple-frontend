import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTablePagination } from './DataTablePagination';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

const renderWithI18n = (component) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

// Mock table object
const createMockTable = (overrides = {}) => ({
  getFilteredSelectedRowModel: () => ({
    rows: overrides.selectedRows || [],
  }),
  getFilteredRowModel: () => ({
    rows: overrides.filteredRows || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  }),
  getState: () => ({
    pagination: {
      pageSize: overrides.pageSize || 10,
      pageIndex: overrides.pageIndex || 0,
    },
  }),
  getPageCount: () => overrides.pageCount || 5,
  getCanPreviousPage: () => overrides.canPreviousPage || false,
  getCanNextPage: () => overrides.canNextPage || true,
  setPageSize: vi.fn(),
  setPageIndex: vi.fn(),
  previousPage: vi.fn(),
  nextPage: vi.fn(),
  ...overrides,
});

describe('DataTablePagination', () => {
  it("should use i18n for 'Rows per page' text", () => {
    const mockTable = createMockTable();

    renderWithI18n(<DataTablePagination table={mockTable} />);

    // Should display the translated "Rows per page" text
    expect(screen.getByText('Rows per page')).toBeInTheDocument();
  });

  it('should use i18n for page display text', () => {
    const mockTable = createMockTable({
      pageIndex: 2,
      pageCount: 5,
    });

    renderWithI18n(<DataTablePagination table={mockTable} />);

    // Should display "Page 3 of 5" using translations
    expect(screen.getByText(/Page 3 of 5/)).toBeInTheDocument();
  });

  it('should use i18n for selected rows text', () => {
    const mockTable = createMockTable({
      selectedRows: [1, 2, 3],
      filteredRows: Array(10).fill({}),
    });

    renderWithI18n(<DataTablePagination table={mockTable} />);

    // Should display "3 of 10 row(s) selected." using translations
    expect(screen.getByText(/3 of 10 row\(s\) selected/)).toBeInTheDocument();
  });
});
