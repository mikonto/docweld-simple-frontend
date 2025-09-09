import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import CollectionsList from './CollectionsList';

describe('CollectionsList', () => {
  const mockOnCollectionClick = vi.fn();

  const mockCollections = [
    {
      id: 'col-1',
      name: 'Collection 1',
      sectionCount: 3,
      documentCount: 10,
    },
    {
      id: 'col-2',
      name: 'Collection 2',
      sectionCount: 1,
      documentCount: 1,
    },
  ];

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders collections with correct information', () => {
    renderWithProviders(
      <CollectionsList
        collections={mockCollections}
        onCollectionClick={mockOnCollectionClick}
      />
    );

    expect(screen.getByText('Collection 1')).toBeInTheDocument();
    expect(screen.getByText('Collection 2')).toBeInTheDocument();
    expect(screen.getByText(/3 sections/)).toBeInTheDocument();
    expect(screen.getByText(/10 documents/)).toBeInTheDocument();
    expect(screen.getByText(/1 section/)).toBeInTheDocument();
    expect(screen.getByText(/1 document/)).toBeInTheDocument();
  });

  it('calls onCollectionClick when collection is clicked', () => {
    renderWithProviders(
      <CollectionsList
        collections={mockCollections}
        onCollectionClick={mockOnCollectionClick}
      />
    );

    const collection1 = screen
      .getByText('Collection 1')
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(collection1);

    expect(mockOnCollectionClick).toHaveBeenCalledWith(mockCollections[0]);
  });

  it('renders empty state when no collections', () => {
    renderWithProviders(
      <CollectionsList
        collections={[]}
        onCollectionClick={mockOnCollectionClick}
      />
    );

    // Check for translated text or key
    expect(
      screen.getByText((content) => {
        return (
          content.includes('No collections found') ||
          content === 'documents.noCollectionsFound'
        );
      })
    ).toBeInTheDocument();
  });

  it('does not render when loading', () => {
    const { container } = renderWithProviders(
      <CollectionsList
        collections={mockCollections}
        onCollectionClick={mockOnCollectionClick}
        isLoading={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
