import React, { useState, useEffect, useMemo } from 'react';
import {
    Package,
    AddOn,
    Project,
    Profile,
    NavigationAction,
    REGIONS,
    Region,
    PhysicalItem,
    DurationOption,
} from '../../types';
import {
    createPackage,
    updatePackage,
    deletePackage,
} from '../../services/packages';
import {
    createAddOn,
    updateAddOn,
    deleteAddOn,
} from '../../services/addOns';
import { updateProfile } from '../../services/profile';

import { PackageCard } from './components/PackageCard';
import { PackageModal } from './components/PackageModal';
import { DuplicatePackageModal } from './components/DuplicatePackageModal';
import { SharePackageModal } from './components/SharePackageModal';
import { PackageGuideModal } from './components/PackageGuideModal';
import { buildPublicShareUrl, getPackageShareIdentifier } from '../../utils/publicRouting';

import {
    Package as PackageIcon,
    Plus,
    Share2,
    HelpCircle,
    Search,
    LayoutGrid,
    List,
    Sparkles,
    Tag,
    DollarSign,
    Pencil,
    Copy,
    Trash2,
    MapPin,
    X,
    FileText,
    Download,
    Upload
} from 'lucide-react';
import RupiahInput from '../../shared/form/RupiahInput';

export interface PackagesProps {
    packages: Package[];
    setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    addOns: AddOn[];
    setAddOns: React.Dispatch<React.SetStateAction<AddOn[]>>;
    projects: Project[];
    profile: Profile;
    showNotification: (message: string) => void;
    initialAction: NavigationAction | null;
    setInitialAction: (action: NavigationAction | null) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(amount);
};

const emptyPackageForm = {
    name: '',
    price: '',
    category: '',
    region: '' as '' | Region,
    processingTime: '',
    photographers: '',
    videographers: '',
    physicalItems: [{ name: '', price: '' }],
    digitalItems: [''],
    coverImage: '',
    durationOptions: [
        { label: '4 Jam', price: '', default: true },
        { label: '8 Jam', price: '', default: false },
        { label: 'Full Day', price: '', default: false }
    ],
};

const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

const titleCase = (s: string) =>
    s ? s.replace(/\b\w/g, c => c.toUpperCase()) : '';

interface AddOnEditorModalProps {
    isOpen: boolean;
    addOn: AddOn | null;
    regionFilter: string;
    unionRegions: { value: string; label: string }[];
    onClose: () => void;
    onSave: (data: { id?: string; name: string; price: number; region?: string }) => Promise<void>;
}

const AddOnEditorModal: React.FC<AddOnEditorModalProps> = ({ isOpen, addOn, regionFilter, unionRegions, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', price: '', region: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setFormData(addOn
            ? { name: addOn.name, price: addOn.price.toString(), region: addOn.region || '' }
            : { name: '', price: '', region: regionFilter || '' });
    }, [isOpen, addOn, regionFilter]);

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            alert('Nama Add-On dan Harga wajib diisi.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                id: addOn?.id,
                name: formData.name.trim(),
                price: Number(formData.price),
                region: formData.region.trim() ? formData.region.trim().toLowerCase() : undefined,
            });
            onClose();
        } catch (error) {
            console.error('Error saving add-on:', error);
            alert('Gagal menyimpan Add-On. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#5D87FF]/10 flex items-center justify-center text-[#5D87FF]">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                            {addOn ? 'Edit Layanan Add-On' : 'Tambah Add-On Baru'}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 pr-1">
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Nama Layanan Add-On</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                            placeholder="Contoh: Drone Pilot, Extra Jam, Live Streaming..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Harga (IDR)</label>
                        <RupiahInput
                            value={formData.price}
                            onChange={raw => setFormData(prev => ({ ...prev, price: raw }))}
                            placeholder="Contoh: 1.500.000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50 font-semibold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Wilayah (Opsional)</label>
                        <input
                            type="text"
                            list="catalog-addon-regions"
                            value={formData.region}
                            onChange={event => setFormData(prev => ({ ...prev, region: event.target.value }))}
                            placeholder="Kosongkan jika berlaku untuk semua wilayah"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                        />
                        <datalist id="catalog-addon-regions">
                            {unionRegions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
                        </datalist>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {unionRegions.map(region => (
                                <button
                                    key={region.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, region: region.value }))}
                                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${formData.region.toLowerCase() === region.value.toLowerCase() ? 'bg-[#5D87FF] text-white border-[#5D87FF]' : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:border-[#5D87FF]/50'}`}
                                >
                                    {region.label}
                                </button>
                            ))}
                            {formData.region && (
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, region: '' }))} className="px-2 py-0.5 rounded-lg text-[11px] font-medium border bg-rose-50 border-rose-200 text-rose-600">
                                    Hapus Wilayah
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2.5 pt-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors">Batal</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-2.5 px-4 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(93,135,255,0.25)] disabled:opacity-50">
                            {isSaving ? 'Menyimpan...' : addOn ? 'Simpan Perubahan' : 'Tambahkan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CatalogItemCardProps {
    addOn: AddOn;
    onEdit: (addOn: AddOn) => void;
    onDelete: (id: string) => void;
}

const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ addOn, onEdit, onDelete }) => (
    <article className="h-full min-h-[150px] bg-white rounded-xl sm:rounded-2xl border border-[#EAEFF4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-[#5D87FF]/30 p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all">
        <div>
            <div className="flex items-start justify-between gap-2 mb-2">
                <span className="w-8 h-8 rounded-xl bg-[#49BEFF]/10 text-[#49BEFF] flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4" /></span>
                <span className="text-[10px] font-medium text-[#5A6A85] bg-[#F4F6F9] px-2 py-0.5 rounded-md">{addOn.region || 'Semua Wilayah'}</span>
            </div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#49BEFF]">Add-On</p>
            <h3 className="font-bold text-sm text-[#2A3547] leading-snug">{addOn.name}</h3>
        </div>
        <div className="pt-2 border-t border-[#EAEFF4] flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-[#5D87FF] truncate">{formatCurrency(addOn.price)}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => onEdit(addOn)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-[#5D87FF] hover:bg-[#5D87FF]/10 flex items-center justify-center" title="Edit Add-On"><Pencil className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onDelete(addOn.id)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center" title="Hapus Add-On"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    </article>
);

export const Packages: React.FC<PackagesProps> = ({
    packages,
    setPackages,
    addOns,
    setAddOns,
    projects,
    profile,
    showNotification,
    initialAction,
    setInitialAction,
}) => {
    // ── Main UI States ──
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    // ── Modal States ──
    const [packageEditMode, setPackageEditMode] = useState<string | null>(null);
    const [packageFormData, setPackageFormData] = useState<any>(emptyPackageForm);
    const [copySourcePkg, setCopySourcePkg] = useState<Package | null>(null);
    const [isAddOnFormOpen, setIsAddOnFormOpen] = useState(false);
    const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPricelistModalOpen, setIsPricelistModalOpen] = useState(false);
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [termsText, setTermsText] = useState(profile.termsAndConditions || '');
    const [pricelistFile, setPricelistFile] = useState<File | null>(null);
    const [isUploadingPricelist, setIsUploadingPricelist] = useState(false);
    const [weddingWorkflowTitle, setWeddingWorkflowTitle] = useState(profile.publicPageConfig?.weddingWorkflow?.title || 'Wedding Timeline');
    const [weddingTimeline, setWeddingTimeline] = useState(profile.publicPageConfig?.weddingWorkflow?.timeline?.join('\n') || 'Konsep Acara Pernikahan / Awal → H-90\nPemilihan Vendor / Detail → H-60\nPersiapan Final (Technical Meeting) → H-14\nPelaksanaan Acara Pernikahan → Hari H\nPenyelesaian / Review Akhir → H+7\nSerah Terima Dokumentasi / Laporan → H+30');
    const [smallEventWorkflowTitle, setSmallEventWorkflowTitle] = useState(profile.publicPageConfig?.smallEventWorkflow?.title || 'Event / Acara Pernikahan Kecil Timeline');
    const [smallEventTimeline, setSmallEventTimeline] = useState(profile.publicPageConfig?.smallEventWorkflow?.timeline?.join('\n') || 'Konsep / Kesepakatan Awal → H-30\nPersiapan Final → H-7\nPelaksanaan Acara Pernikahan → Hari H\nPenyelesaian Layanan / Laporan → H+14');

    // Initial action handler (e.g. redirected from dashboard with "add" action)
    useEffect(() => {
        if (initialAction?.type === 'add') {
            setPackageEditMode('new');
            setPackageFormData(emptyPackageForm);
            setInitialAction(null);
        }
    }, [initialAction, setInitialAction]);

    // Available Regions calculation
    const existingRegions = useMemo(() => {
        const set = new Set<string>();
        for (const p of packages) {
            if (p.region && String(p.region).trim() !== '') set.add(String(p.region));
        }
        for (const addOn of addOns) {
            if (addOn.region && String(addOn.region).trim() !== '') set.add(String(addOn.region));
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [packages, addOns]);

    const unionRegions = useMemo(() => {
        const baseValues = REGIONS.map(r => r.value.toLowerCase());
        const extra = existingRegions.filter(er => !baseValues.includes(er.toLowerCase()));
        return [
            ...REGIONS.map(r => ({ value: r.value, label: r.label })),
            ...extra.map(er => ({ value: er, label: titleCase(er) })),
        ];
    }, [existingRegions]);

    // Categories list
    const availableCategories = useMemo(() => {
        const cats = new Set<string>(profile.packageCategories || []);
        packages.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).filter(Boolean).sort();
    }, [packages, profile.packageCategories]);

    // Filtered Packages
    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const matchesSearch = 
                pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (pkg.category && pkg.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (pkg.photographers && pkg.photographers.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (pkg.digitalItems && pkg.digitalItems.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesRegion = !regionFilter || (pkg.region && pkg.region.toLowerCase() === regionFilter.toLowerCase());
            const matchesCategory = !categoryFilter || pkg.category === categoryFilter;

            return matchesSearch && matchesRegion && matchesCategory;
        });
    }, [packages, searchTerm, regionFilter, categoryFilter]);

    const filteredAddOns = useMemo(() => addOns.filter(addOn => {
        const matchesSearch = addOn.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = !regionFilter || (addOn.region && addOn.region.toLowerCase() === regionFilter.toLowerCase());
        return matchesSearch && matchesRegion && !categoryFilter;
    }), [addOns, searchTerm, regionFilter, categoryFilter]);

    type CatalogEntry = { kind: 'package'; pkg: Package } | { kind: 'addon'; addOn: AddOn };
    const catalogEntries = useMemo<CatalogEntry[]>(() => [
        ...filteredPackages.map(pkg => ({ kind: 'package' as const, pkg })),
        ...filteredAddOns.map(addOn => ({ kind: 'addon' as const, addOn })),
    ], [filteredPackages, filteredAddOns]);

    const packageGroups = useMemo(() => {
        const groups = new Map<string, Package[]>();
        filteredPackages.forEach(pkg => {
            const key = (pkg.region || '').trim().toLowerCase();
            groups.set(key, [...(groups.get(key) || []), pkg]);
        });

        return Array.from(groups.entries())
            .map(([regionKey, items]) => ({
                regionKey,
                label: regionKey
                    ? unionRegions.find(region => region.value.toLowerCase() === regionKey)?.label || titleCase(regionKey)
                    : 'Semua Wilayah',
                items,
            }))
            .sort((a, b) => {
                if (!a.regionKey) return 1;
                if (!b.regionKey) return -1;
                return a.label.localeCompare(b.label);
            });
    }, [filteredPackages, unionRegions]);

    const addOnGroups = useMemo(() => {
        const groups = new Map<string, AddOn[]>();
        filteredAddOns.forEach(addOn => {
            const key = (addOn.region || '').trim().toLowerCase();
            groups.set(key, [...(groups.get(key) || []), addOn]);
        });

        return Array.from(groups.entries())
            .map(([regionKey, items]) => ({
                regionKey,
                label: regionKey
                    ? unionRegions.find(region => region.value.toLowerCase() === regionKey)?.label || titleCase(regionKey)
                    : 'Semua Wilayah',
                items,
            }))
            .sort((a, b) => {
                if (!a.regionKey) return 1;
                if (!b.regionKey) return -1;
                return a.label.localeCompare(b.label);
            });
    }, [filteredAddOns, unionRegions]);

    // Grouping by Category for Cards view
    const packagesByCategory = useMemo(() => {
        const grouped: Record<string, Package[]> = {};
        filteredPackages.forEach(pkg => {
            const cat = pkg.category || 'Tanpa Kategori';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(pkg);
        });
        return grouped;
    }, [filteredPackages]);

    // Stat / KPI Calculations
    const stats = useMemo(() => {
        const allPrices = filteredPackages.flatMap(p => 
            p.durationOptions && p.durationOptions.length > 0 
                ? p.durationOptions.map(o => o.price) 
                : [p.price]
        ).filter(price => price > 0);

        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

        return {
            totalPackages: filteredPackages.length,
            totalAddOns: addOns.length,
            totalCategories: Object.keys(packagesByCategory).length,
            minPrice,
            maxPrice,
        };
    }, [filteredPackages, addOns, packagesByCategory]);

    // ── Package CRUD Handlers ──
    const handleOpenCreatePackage = () => {
        setPackageEditMode('new');
        setPackageFormData({
            ...emptyPackageForm,
            category: availableCategories[0] || '',
            region: regionFilter || '',
        });
    };

    const handleOpenEditPackage = (pkg: Package) => {
        setPackageEditMode(pkg.id);
        setPackageFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            category: pkg.category,
            region: (pkg.region || '') as any,
            processingTime: '',
            photographers: pkg.photographers && pkg.videographers
                ? `${pkg.photographers} & ${pkg.videographers}`
                : (pkg.photographers || pkg.videographers || ''),
            videographers: '',
            physicalItems: pkg.physicalItems && pkg.physicalItems.length > 0 
                ? pkg.physicalItems.map(item => ({ ...item, price: item.price.toString() })) 
                : [{ name: '', price: '' }],
            digitalItems: pkg.digitalItems && pkg.digitalItems.length > 0 ? pkg.digitalItems : [''],
            coverImage: pkg.coverImage || '',
            durationOptions: pkg.durationOptions && pkg.durationOptions.length > 0
                ? pkg.durationOptions.map(o => ({
                    label: o.label,
                    price: o.price.toString(),
                    default: o.default,
                    photographers: o.photographers || '',
                    digitalItems: o.digitalItems && o.digitalItems.length > 0 ? o.digitalItems : [''],
                    physicalItems: o.physicalItems && o.physicalItems.length > 0 
                        ? o.physicalItems.map((p: PhysicalItem) => ({ ...p, price: p.price })) 
                        : [{ name: '', price: 0 }],
                }))
                : [
                    { label: '4 Jam', price: '', default: true },
                    { label: '8 Jam', price: '', default: false },
                    { label: 'Full Day', price: '', default: false }
                ],
        });
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran file foto tidak boleh melebihi 2MB.');
                e.target.value = '';
                return;
            }
            if (!file.type.match('image.*')) {
                alert('Hanya format file gambar yang diperbolehkan.');
                e.target.value = '';
                return;
            }
            try {
                const base64 = await toBase64(file);
                setPackageFormData((prev: any) => ({ ...prev, coverImage: base64 }));
            } catch (err) {
                console.error(err);
                alert('Gagal mengunggah gambar. Silakan coba lagi.');
            }
        }
    };

    const handleSubmitPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasValidDurationOptions = Array.isArray(packageFormData.durationOptions) && 
            packageFormData.durationOptions.some((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '');

        if (!packageFormData.name.trim()) {
            alert('Nama Paket wajib diisi.');
            return;
        }

        if (!hasValidDurationOptions && !packageFormData.price) {
            alert('Silakan isi Harga Paket atau tambahkan Opsi Durasi & Harga.');
            return;
        }

        const defaultOption = hasValidDurationOptions 
            ? (packageFormData.durationOptions.find((o: any) => o.default) || packageFormData.durationOptions[0]) 
            : null;
        const computedBasePrice = defaultOption ? Number(defaultOption.price || 0) : Number(packageFormData.price || 0);

        const packageData: Omit<Package, 'id'> = {
            name: packageFormData.name.trim(),
            price: computedBasePrice,
            category: packageFormData.category,
            region: packageFormData.region ? String(packageFormData.region).trim().toLowerCase() : undefined,
            processingTime: '',
            photographers: packageFormData.photographers?.trim() || undefined,
            videographers: '',
            physicalItems: packageFormData.physicalItems
                .filter((item: any) => typeof item.name === 'string' && item.name.trim() !== '')
                .map((item: any) => ({ name: item.name.trim(), price: Number(item.price || 0) })),
            digitalItems: packageFormData.digitalItems.filter((item: string) => typeof item === 'string' && item.trim() !== ''),
            coverImage: packageFormData.coverImage || undefined,
            durationOptions: hasValidDurationOptions
                ? packageFormData.durationOptions
                    .filter((opt: any) => String(opt.label || '').trim() !== '' && Number(opt.price) >= 0)
                    .map((opt: any): DurationOption => ({
                        label: String(opt.label).trim(),
                        price: Number(opt.price),
                        default: !!opt.default,
                        photographers: opt.photographers?.trim() || undefined,
                    }))
                : undefined,
        };

        try {
            if (packageEditMode !== 'new' && packageEditMode) {
                const updated = await updatePackage(packageEditMode, packageData);
                setPackages(prev => prev.map(p => p.id === packageEditMode ? updated : p));
                showNotification('Paket layanan berhasil diperbarui.');
            } else {
                const created = await createPackage(packageData as any);
                setPackages(prev => [...prev, created]);
                showNotification('Paket layanan baru berhasil ditambahkan.');
            }
            setPackageEditMode(null);
            setPackageFormData(emptyPackageForm);
        } catch (err: any) {
            console.error('[Packages.save] error:', err);
            alert(`Gagal menyimpan paket ke database. ${err?.message || 'Silakan coba lagi.'}`);
        }
    };

    const handleDeletePackage = async (pkgId: string) => {
        const isPackageInUse = projects.some(p => p.packageId === pkgId);
        if (isPackageInUse) {
            alert('Paket ini tidak dapat dihapus karena masih digunakan pada satu atau lebih data Acara Pernikahan.');
            return;
        }

        if (!window.confirm('Apakah Anda yakin ingin menghapus paket layanan ini?')) return;

        try {
            await deletePackage(pkgId);
            setPackages(prev => prev.filter(p => p.id !== pkgId));
            showNotification('Paket layanan berhasil dihapus.');
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus paket di database. Silakan coba lagi.');
        }
    };

    const handleDuplicatePackage = async (targetRegion: string) => {
        if (!copySourcePkg) return;
        const { id, ...rest } = copySourcePkg;
        const newPkg: Omit<Package, 'id'> = {
            ...rest,
            name: `${copySourcePkg.name} (${titleCase(targetRegion)})`,
            region: targetRegion as any,
        };
        const created = await createPackage(newPkg as any);
        setPackages(prev => [...prev, created]);
        showNotification(`Paket berhasil diduplikasi ke wilayah ${titleCase(targetRegion)}.`);
    };

    const handleShareSinglePackage = async (pkg: Package) => {
        const shareUrl = buildPublicShareUrl('booking', undefined, {
            query: {
                ...(pkg.region ? { region: pkg.region } : {}),
                package: getPackageShareIdentifier(pkg, packages),
            },
        });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${pkg.name} - Weddfin`,
                    text: `Lihat paket ${pkg.name} dari Weddfin`,
                    url: shareUrl,
                });
                showNotification(`Paket "${pkg.name}" berhasil dibagikan!`);
                return;
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            }
        }

        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showNotification(`Tautan paket "${pkg.name}" berhasil disalin ke clipboard!`);
                return;
            } catch {
                // fallback to modal
            }
        }

        setIsShareModalOpen(true);
    };

    // ── Add-On CRUD Handlers ──
    const handleSaveAddOn = async (addOnData: { id?: string; name: string; price: number; region?: string }) => {
        if (addOnData.id) {
            const updated = await updateAddOn(addOnData.id, {
                name: addOnData.name,
                price: addOnData.price,
                region: addOnData.region,
            });
            setAddOns(prev => prev.map(a => a.id === addOnData.id ? updated : a));
            showNotification('Add-on berhasil diperbarui.');
        } else {
            const created = await createAddOn({
                name: addOnData.name,
                price: addOnData.price,
                region: addOnData.region,
            } as any);
            setAddOns(prev => [...prev, created]);
            showNotification('Add-on baru berhasil ditambahkan.');
        }
    };

    const handleDeleteAddOn = async (addOnId: string) => {
        const isAddOnInUse = projects.some(p => p.addOns && p.addOns.some(a => a.id === addOnId));
        if (isAddOnInUse) {
            alert('Add-on ini tidak dapat dihapus karena sedang dipilih pada salah satu Acara Pernikahan.');
            return;
        }

        if (!window.confirm('Hapus layanan add-on ini?')) return;

        try {
            await deleteAddOn(addOnId);
            setAddOns(prev => prev.filter(p => p.id !== addOnId));
            showNotification('Add-on berhasil dihapus.');
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus add-on di database.');
        }
    };

    const handleOpenCreateAddOn = () => {
        setEditingAddOn(null);
        setIsAddOnFormOpen(true);
    };

    const handleOpenEditAddOn = (addOn: AddOn) => {
        setEditingAddOn(addOn);
        setIsAddOnFormOpen(true);
    };

    const handleCloseAddOnForm = () => {
        setIsAddOnFormOpen(false);
        setEditingAddOn(null);
    };

    // ── Terms & Conditions Handler ──
    const handleSaveTerms = async () => {
        try {
            await updateProfile({
                ...profile,
                termsAndConditions: termsText,
            });
            showNotification('Syarat dan ketentuan berhasil disimpan.');
            setIsTermsModalOpen(false);
        } catch (err) {
            console.error('Error saving terms:', err);
            alert('Gagal menyimpan syarat dan ketentuan. Silakan coba lagi.');
        }
    };

    // ── Pricelist PDF Handler ──
    const handlePricelistUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert('Hanya file PDF yang diperbolehkan.');
                e.target.value = '';
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('Ukuran file tidak boleh melebihi 10MB.');
                e.target.value = '';
                return;
            }
            setPricelistFile(file);
        }
    };

    const handleUploadPricelist = async () => {
        if (!pricelistFile) {
            alert('Silakan pilih file PDF terlebih dahulu.');
            return;
        }

        setIsUploadingPricelist(true);
        try {
            // Convert file to base64 for storage
            const base64 = await toBase64(pricelistFile);

            await updateProfile({
                ...profile,
                publicPageConfig: {
                    ...profile.publicPageConfig,
                    pricelistPdfUrl: base64,
                },
            });

            showNotification('Pricelist PDF berhasil diupload.');
            setIsPricelistModalOpen(false);
            setPricelistFile(null);
        } catch (err) {
            console.error('Error uploading pricelist:', err);
            alert('Gagal mengupload pricelist. Silakan coba lagi.');
        } finally {
            setIsUploadingPricelist(false);
        }
    };

    const handleDeletePricelist = async () => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus pricelist PDF?')) return;

        try {
            await updateProfile({
                ...profile,
                publicPageConfig: {
                    ...profile.publicPageConfig,
                    pricelistPdfUrl: undefined,
                },
            });

            showNotification('Pricelist PDF berhasil dihapus.');
        } catch (err) {
            console.error('Error deleting pricelist:', err);
            alert('Gagal menghapus pricelist. Silakan coba lagi.');
        }
    };

    const handleDownloadPricelist = () => {
        const pdfUrl = profile.publicPageConfig?.pricelistPdfUrl;
        if (!pdfUrl) {
            alert('Tidak ada pricelist PDF yang tersedia.');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'pricelist.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Workflow Handler ──
    const handleSaveWorkflow = async () => {
        try {
            await updateProfile({
                ...profile,
                publicPageConfig: {
                    ...profile.publicPageConfig,
                    weddingWorkflow: {
                        title: weddingWorkflowTitle,
                        timeline: weddingTimeline.split('\n').filter(item => item.trim() !== ''),
                    },
                    smallEventWorkflow: {
                        title: smallEventWorkflowTitle,
                        timeline: smallEventTimeline.split('\n').filter(item => item.trim() !== ''),
                    },
                },
            });
            showNotification('Workflow berhasil disimpan.');
            setIsWorkflowModalOpen(false);
        } catch (err) {
            console.error('Error saving workflow:', err);
            alert('Gagal menyimpan workflow. Silakan coba lagi.');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#2A3547] tracking-tight flex items-center gap-2">
                        <PackageIcon className="w-5 h-5 text-[#5D87FF] flex-shrink-0" />
                        <span>Katalog Paket & Layanan</span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#5A6A85] mt-0.5 line-clamp-2 sm:line-clamp-none">
                        Kelola paket dokumentasi, opsi durasi dinamis, add-on, dan portofolio penawaran harga pengantin
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setIsGuideModalOpen(true)}
                        className="py-2 sm:py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Lihat Panduan Pengelolaan Paket"
                    >
                        <HelpCircle className="w-4 h-4 text-[#5A6A85]" />
                        <span className="hidden xs:inline sm:inline">Panduan</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsTermsModalOpen(true)}
                        className="py-2 sm:py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Kelola Syarat & Ketentuan"
                    >
                        <FileText className="w-4 h-4 text-[#5A6A85]" />
                        <span className="hidden xs:inline sm:inline">Syarat</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPricelistModalOpen(true)}
                        className="py-2 sm:py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Kelola Pricelist PDF"
                    >
                        <Upload className="w-4 h-4 text-[#5A6A85]" />
                        <span className="hidden xs:inline sm:inline">Pricelist</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsWorkflowModalOpen(true)}
                        className="py-2 sm:py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Kelola Workflow"
                    >
                        <List className="w-4 h-4 text-[#5A6A85]" />
                        <span className="hidden xs:inline sm:inline">Workflow</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        className="py-2 sm:py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Bagikan Tautan Booking & Katalog"
                    >
                        <Share2 className="w-4 h-4 text-[#5D87FF]" />
                        <span>Bagikan</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreatePackage}
                        className="flex-1 sm:flex-initial bg-[#5D87FF] hover:bg-[#4871e3] text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(93,135,255,0.25)] inline-flex items-center justify-center gap-1.5 sm:gap-2 text-xs transition-all min-h-[44px] touch-manipulation cursor-pointer"
                    >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span>Tambah Paket</span>
                    </button>
                </div>
            </div>

            {/* ── KPI Stat Highlights ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {/* Total Packages */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#5D87FF]/10 text-[#5D87FF] flex items-center justify-center flex-shrink-0">
                        <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">Paket Aktif</p>
                        <p className="text-base sm:text-2xl font-bold text-[#2A3547] mt-0.5 leading-none">
                            {stats.totalPackages}
                        </p>
                    </div>
                </div>

                {/* Total Add-Ons */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#13DEB9]/10 text-[#13DEB9] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">Layanan Add-On</p>
                        <p className="text-base sm:text-2xl font-bold text-[#2A3547] mt-0.5 leading-none">
                            {stats.totalAddOns}
                        </p>
                    </div>
                </div>

                {/* Active Categories */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#FFAE1F]/10 text-[#FFAE1F] flex items-center justify-center flex-shrink-0">
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">Kategori Layanan</p>
                        <p className="text-base sm:text-2xl font-bold text-[#2A3547] mt-0.5 leading-none">
                            {stats.totalCategories}
                        </p>
                    </div>
                </div>

                {/* Price Range */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#FA896B]/10 text-[#FA896B] flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">Rentang Harga</p>
                        <p className="text-[10px] sm:text-sm font-bold text-[#2A3547] mt-1 truncate" title={stats.minPrice > 0 ? `${formatCurrency(stats.minPrice)} – ${formatCurrency(stats.maxPrice)}` : '—'}>
                            {stats.minPrice > 0
                                ? `${new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.minPrice)} – ${new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.maxPrice)}`
                                : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Unified Package & Add-On Catalog ── */}
            <section className="bg-white p-3 sm:p-4 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
                    <div className="relative min-w-0 flex-1">
                        <Search className="w-4 h-4 text-[#5A6A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            placeholder="Cari paket atau Add-On..."
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-xs sm:text-sm text-[#2A3547] placeholder-[#5A6A85] outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={categoryFilter}
                            onChange={event => setCategoryFilter(event.target.value)}
                            className="min-w-0 flex-1 sm:flex-none sm:min-w-[180px] py-2.5 px-3 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-xs font-semibold text-[#2A3547] outline-none cursor-pointer"
                            aria-label="Filter kategori paket"
                        >
                            <option value="">Semua Kategori Paket</option>
                            {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
                        </select>

                        <div className="flex items-center gap-1 bg-[#F4F6F9] p-1 rounded-xl border border-[#EAEFF4]">
                            <button type="button" onClick={() => setViewMode('cards')} className={`min-h-9 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${viewMode === 'cards' ? 'bg-white text-[#5D87FF] shadow-xs' : 'text-[#5A6A85]'}`} title="Tampilan Kartu">
                                <LayoutGrid className="w-4 h-4" /><span>Kartu</span>
                            </button>
                            <button type="button" onClick={() => setViewMode('table')} className={`min-h-9 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white text-[#5D87FF] shadow-xs' : 'text-[#5A6A85]'}`} title="Tampilan Tabel">
                                <List className="w-4 h-4" /><span>Tabel</span>
                            </button>
                        </div>

                        <div className="flex w-full sm:w-auto gap-2">
                            <button type="button" onClick={handleOpenCreatePackage} className="min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-[#5D87FF] text-white text-xs font-semibold hover:bg-[#4871e3]">
                                <Plus className="w-4 h-4" /><span>Tambah Paket</span>
                            </button>
                            <button type="button" onClick={handleOpenCreateAddOn} className="min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-[#49BEFF] text-white text-xs font-semibold hover:bg-sky-500">
                                <Sparkles className="w-4 h-4" /><span>Tambah Add-On</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#EAEFF4] pt-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85]">Filter wilayah · Paket dan Add-On</p>
                        {regionFilter && <span className="text-[10px] sm:text-xs text-[#5A6A85]">{catalogEntries.length} item</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button type="button" onClick={() => setRegionFilter('')} aria-pressed={regionFilter === ''} className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border whitespace-nowrap ${regionFilter === '' ? 'bg-[#5D87FF] text-white border-[#5D87FF]' : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:bg-[#F4F6F9]'}`}>
                            Semua Wilayah
                        </button>
                        {unionRegions.map(region => (
                            <button key={region.value} type="button" onClick={() => setRegionFilter(region.value)} aria-pressed={regionFilter === region.value} className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border whitespace-nowrap ${regionFilter === region.value ? 'bg-[#5D87FF] text-white border-[#5D87FF]' : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:bg-[#F4F6F9]'}`}>
                                {region.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {catalogEntries.length === 0 ? (
                <div className="py-12 sm:py-16 text-center bg-white rounded-2xl border border-[#EAEFF4] p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#5D87FF]/10 text-[#5D87FF] flex items-center justify-center mx-auto mb-3"><PackageIcon className="w-6 h-6" /></div>
                    <h3 className="font-bold text-base text-[#2A3547]">Tidak ada item ditemukan</h3>
                    <p className="text-xs text-[#5A6A85] mt-1 max-w-sm mx-auto">Coba ubah pencarian, kategori paket, atau wilayah yang dipilih.</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button type="button" onClick={handleOpenCreatePackage} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5D87FF] text-white text-xs font-semibold"><Plus className="w-3.5 h-3.5" />Tambah Paket</button>
                        <button type="button" onClick={handleOpenCreateAddOn} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#49BEFF] text-white text-xs font-semibold"><Sparkles className="w-3.5 h-3.5" />Tambah Add-On</button>
                    </div>
                </div>
            ) : viewMode === 'cards' ? (
                <div className="space-y-6">
                    {packageGroups.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF4] pb-2">
                                <div className="flex items-center gap-2">
                                    <PackageIcon className="w-4 h-4 text-[#5D87FF]" />
                                    <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">Paket</h3>
                                    <span className="rounded-full bg-[#F4F6F9] border border-[#EAEFF4] px-2 py-0.5 text-[10px] font-semibold text-[#5A6A85]">{filteredPackages.length} item</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {packageGroups.map(group => (
                                    <div key={group.regionKey || 'unassigned'} className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-[#5D87FF]" />
                                                <h4 className="font-semibold text-xs sm:text-sm text-[#2A3547]">{group.label}</h4>
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-[#5A6A85]">{group.items.length} paket</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                                            {group.items.map(pkg => (
                                                <PackageCard key={`package-${pkg.id}`} pkg={pkg} onEdit={handleOpenEditPackage} onDuplicate={setCopySourcePkg} onShare={handleShareSinglePackage} onDelete={handleDeletePackage} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {addOnGroups.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF4] pb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#49BEFF]" />
                                    <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">Add-On</h3>
                                    <span className="rounded-full bg-[#F4F6F9] border border-[#EAEFF4] px-2 py-0.5 text-[10px] font-semibold text-[#5A6A85]">{filteredAddOns.length} item</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {addOnGroups.map(group => (
                                    <div key={group.regionKey || 'unassigned'} className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-[#49BEFF]" />
                                                <h4 className="font-semibold text-xs sm:text-sm text-[#2A3547]">{group.label}</h4>
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-[#5A6A85]">{group.items.length} add-on</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                                            {group.items.map(addOn => (
                                                <CatalogItemCard key={`addon-${addOn.id}`} addOn={addOn} onEdit={handleOpenEditAddOn} onDelete={handleDeleteAddOn} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#EAEFF4] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <table className="w-full min-w-[720px] text-left text-xs">
                        <thead className="bg-[#F4F6F9] text-[10px] uppercase tracking-wider text-[#5A6A85]">
                            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Wilayah</th><th className="px-4 py-3 text-right">Harga</th><th className="px-4 py-3 text-right">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEFF4]">
                            {catalogEntries.map(item => {
                                const isPackage = item.kind === 'package';
                                const name = isPackage ? item.pkg.name : item.addOn.name;
                                const region = isPackage ? item.pkg.region : item.addOn.region;
                                const price = isPackage ? item.pkg.price : item.addOn.price;
                                return (
                                    <tr key={`${item.kind}-${isPackage ? item.pkg.id : item.addOn.id}`} className="hover:bg-[#F8FAFC]">
                                        <td className="px-4 py-3 font-semibold text-[#2A3547]">{name}</td>
                                        <td className="px-4 py-3 text-[#5A6A85]">{isPackage ? 'Paket' : 'Add-On'}</td>
                                        <td className="px-4 py-3 text-[#5A6A85]">{isPackage ? item.pkg.category || 'Umum' : '—'}</td>
                                        <td className="px-4 py-3 text-[#5A6A85]">{region ? unionRegions.find(option => option.value.toLowerCase() === region.toLowerCase())?.label || titleCase(region) : 'Semua Wilayah'}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-[#2A3547]">{formatCurrency(price)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {isPackage ? (
                                                    <>
                                                        <button type="button" onClick={() => handleOpenEditPackage(item.pkg)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-[#5D87FF]/10 hover:text-[#5D87FF]" title="Edit Paket"><Pencil className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => setCopySourcePkg(item.pkg)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-[#5D87FF]/10 hover:text-[#5D87FF]" title="Duplikat Paket"><Copy className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => handleShareSinglePackage(item.pkg)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-[#5D87FF]/10 hover:text-[#5D87FF]" title="Bagikan Paket"><Share2 className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => handleDeletePackage(item.pkg.id)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-rose-50 hover:text-rose-600" title="Hapus Paket"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" onClick={() => handleOpenEditAddOn(item.addOn)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-[#5D87FF]/10 hover:text-[#5D87FF]" title="Edit Add-On"><Pencil className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => handleDeleteAddOn(item.addOn.id)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-rose-50 hover:text-rose-600" title="Hapus Add-On"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <AddOnEditorModal
                isOpen={isAddOnFormOpen}
                addOn={editingAddOn}
                regionFilter={regionFilter}
                unionRegions={unionRegions}
                onClose={handleCloseAddOnForm}
                onSave={handleSaveAddOn}
            />

            {/* ── Package Edit/Add Modal ── */}
            {packageEditMode && (
                <PackageModal
                    isOpen={true}
                    onClose={() => {
                        setPackageEditMode(null);
                        setPackageFormData(emptyPackageForm);
                    }}
                    formData={packageFormData}
                    setFormData={setPackageFormData}
                    editMode={packageEditMode}
                    packageCategories={availableCategories}
                    unionRegions={unionRegions}
                    existingRegions={existingRegions}
                    onSubmit={handleSubmitPackage}
                    onCoverImageUpload={handleCoverImageUpload}
                />
            )}

            {/* ── Duplicate Modal ── */}
            {copySourcePkg && (
                <DuplicatePackageModal
                    packageToCopy={copySourcePkg}
                    onClose={() => setCopySourcePkg(null)}
                    unionRegions={unionRegions}
                    onDuplicate={handleDuplicatePackage}
                />
            )}

            {/* ── Share Modal ── */}
            <SharePackageModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                unionRegions={unionRegions}
            />

            {/* ── Guide Modal ── */}
            <PackageGuideModal
                isOpen={isGuideModalOpen}
                onClose={() => setIsGuideModalOpen(false)}
            />

            {/* ── Terms & Conditions Modal ── */}
            {isTermsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#5D87FF]/10 flex items-center justify-center text-[#5D87FF]">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                                    Kelola Syarat & Ketentuan
                                </h3>
                            </div>
                            <button type="button" onClick={() => setIsTermsModalOpen(false)} className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Syarat & Ketentuan</label>
                                <textarea
                                    value={termsText}
                                    onChange={(e) => setTermsText(e.target.value)}
                                    placeholder="Masukkan syarat dan ketentuan untuk booking..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50 resize-none"
                                    rows={12}
                                />
                                <p className="text-[10px] text-[#5A6A85] mt-1.5">
                                    Syarat dan ketentuan ini akan ditampilkan di halaman booking publik. Gunakan emoji (📜, 📅, 💰, dll) untuk header bagian.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-3">
                            <button type="button" onClick={() => setIsTermsModalOpen(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors">Batal</button>
                            <button type="button" onClick={handleSaveTerms} className="flex-1 py-2.5 px-4 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(93,135,255,0.25)]">
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Pricelist PDF Modal ── */}
            {isPricelistModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#49BEFF]/10 flex items-center justify-center text-[#49BEFF]">
                                    <Upload className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                                    Kelola Pricelist PDF
                                </h3>
                            </div>
                            <button type="button" onClick={() => setIsPricelistModalOpen(false)} className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                            {profile.publicPageConfig?.pricelistPdfUrl ? (
                                <div className="p-4 bg-[#F4F6F9] rounded-xl border border-[#EAEFF4] space-y-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-[#5D87FF]" />
                                        <span className="text-sm font-semibold text-[#2A3547]">Pricelist PDF Terupload</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleDownloadPricelist}
                                            className="flex-1 py-2 px-3 rounded-lg bg-[#5D87FF] text-white text-xs font-semibold hover:bg-[#4871e3] flex items-center justify-center gap-1.5"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeletePricelist}
                                            className="py-2 px-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 flex items-center justify-center gap-1.5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-[#F4F6F9] rounded-xl border border-[#EAEFF4]">
                                    <p className="text-xs text-[#5A6A85] text-center">Belum ada pricelist PDF yang diupload</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Upload Pricelist PDF Baru</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handlePricelistUpload}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all"
                                />
                                <p className="text-[10px] text-[#5A6A85] mt-1.5">
                                    Maksimal ukuran file: 10MB. Hanya format PDF yang diperbolehkan.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-3">
                            <button type="button" onClick={() => setIsPricelistModalOpen(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors">Batal</button>
                            <button
                                type="button"
                                onClick={handleUploadPricelist}
                                disabled={!pricelistFile || isUploadingPricelist}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-[#49BEFF] hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(73,190,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingPricelist ? 'Mengupload...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Workflow Modal ── */}
            {isWorkflowModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#FFAE1F]/10 flex items-center justify-center text-[#FFAE1F]">
                                    <List className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                                    Kelola Workflow
                                </h3>
                            </div>
                            <button type="button" onClick={() => setIsWorkflowModalOpen(false)} className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                            {/* Wedding Workflow */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Judul Workflow Wedding</label>
                                    <input
                                        type="text"
                                        value={weddingWorkflowTitle}
                                        onChange={(e) => setWeddingWorkflowTitle(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Timeline Wedding</label>
                                    <textarea
                                        value={weddingTimeline}
                                        onChange={(e) => setWeddingTimeline(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all resize-none"
                                        placeholder="Masukkan timeline wedding. Gunakan Enter untuk memisahkan setiap item timeline."
                                        rows={6}
                                    />
                                    <p className="text-[10px] text-[#5A6A85] mt-1.5">
                                        Setiap baris baru akan menjadi item timeline terpisah.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-[#EAEFF4] pt-4"></div>

                            {/* Small Event Workflow */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Judul Workflow Acara Kecil</label>
                                    <input
                                        type="text"
                                        value={smallEventWorkflowTitle}
                                        onChange={(e) => setSmallEventWorkflowTitle(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Timeline Acara Kecil</label>
                                    <textarea
                                        value={smallEventTimeline}
                                        onChange={(e) => setSmallEventTimeline(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none transition-all resize-none"
                                        placeholder="Masukkan timeline acara kecil. Gunakan Enter untuk memisahkan setiap item timeline."
                                        rows={4}
                                    />
                                    <p className="text-[10px] text-[#5A6A85] mt-1.5">
                                        Setiap baris baru akan menjadi item timeline terpisah.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-3">
                            <button type="button" onClick={() => setIsWorkflowModalOpen(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors">Batal</button>
                            <button type="button" onClick={handleSaveWorkflow} className="flex-1 py-2.5 px-4 rounded-xl bg-[#FFAE1F] hover:bg-[#e5a31d] text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(255,174,31,0.25)]">
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Packages;
