import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Packages } from './Packages';

describe('Packages catalog layout', () => {
  it('renders package and add-on sections separately with add-ons below packages', () => {
    render(
      <Packages
        packages={[
          {
            id: 'pkg-1',
            name: 'Paket Premium',
            price: 5000000,
            category: 'Wedding',
            region: 'vendor',
            physicalItems: [],
            digitalItems: ['Album Digital'],
            processingTime: '7 hari',
            photographers: '2 fotografer',
          },
        ]}
        setPackages={vi.fn()}
        addOns={[
          { id: 'addon-1', name: 'Album', price: 900000, region: 'vendor' },
        ]}
        setAddOns={vi.fn()}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    const packageHeading = screen.getByRole('heading', { name: 'Paket' });
    const addOnHeading = screen.getByRole('heading', { name: 'Add-On' });

    expect(packageHeading).toBeTruthy();
    expect(addOnHeading).toBeTruthy();
    expect(packageHeading.compareDocumentPosition(addOnHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
