import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from './SettingsPage';

const mocks = vi.hoisted(() => ({
    upsertProfile: vi.fn(),
    updatePackage: vi.fn(),
}));

vi.mock('../../services/profile', () => ({ upsertProfile: mocks.upsertProfile }));
vi.mock('../../services/packages', () => ({ updatePackage: mocks.updatePackage }));

describe('Settings package category rename', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renames the category on every matching package when changes are saved', async () => {
        const profile = {
            id: 'profile-1',
            adminUserId: 'admin-1',
            email: 'admin@example.com',
            fullName: 'Admin',
            packageCategories: ['Candid & Before-After'],
            projectStatusConfig: [],
        } as any;
        const packages = [
            { id: 'package-1', name: 'Paket Satu', category: 'Candid & Before-After' },
            { id: 'package-2', name: 'Paket Dua', category: 'Candid & Before-After' },
        ] as any[];
        const setPackages = vi.fn();
        const renamedCategory = 'Candid & Before-After Premium';

        mocks.upsertProfile.mockImplementation(async (patch: Record<string, unknown>) => ({ ...profile, ...patch }));
        mocks.updatePackage.mockImplementation(async (id: string, patch: Record<string, unknown>) => ({
            ...packages.find(pkg => pkg.id === id),
            ...patch,
        }));

        render(
            <Settings
                profile={profile}
                setProfile={vi.fn()}
                transactions={[]}
                projects={[]}
                packages={packages}
                setPackages={setPackages}
                users={[]}
                setUsers={vi.fn()}
                currentUser={{ id: 'admin-1', email: 'admin@example.com', fullName: 'Admin', role: 'Admin' } as any}
            />,
        );

        fireEvent.click(screen.getAllByRole('button', { name: 'Kustomisasi Kategori' })[0]);
        const categoryLabel = screen.getByText('Candid & Before-After');
        const categoryRow = categoryLabel.closest('div.flex.items-center.justify-between');
        fireEvent.click(categoryRow?.querySelector('button[title="Edit"]') as HTMLButtonElement);
        fireEvent.change(document.getElementById('input-KategoriPackage') as HTMLInputElement, {
            target: { value: renamedCategory },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
        fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        await waitFor(() => expect(mocks.updatePackage).toHaveBeenCalledTimes(2));
        expect(mocks.updatePackage).toHaveBeenCalledWith('package-1', { category: renamedCategory });
        expect(mocks.updatePackage).toHaveBeenCalledWith('package-2', { category: renamedCategory });
        expect(mocks.upsertProfile).toHaveBeenCalledWith({
            id: 'profile-1',
            packageCategories: [renamedCategory],
        });

        const updateCache = setPackages.mock.calls[0][0] as (current: typeof packages) => typeof packages;
        expect(updateCache(packages).map(pkg => pkg.category)).toEqual([renamedCategory, renamedCategory]);
    });
});