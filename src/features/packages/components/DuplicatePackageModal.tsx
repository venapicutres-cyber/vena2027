import React, { useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import { Package } from '../../../types';
import { Copy, MapPin, Check, Plus, Loader2 } from 'lucide-react';

interface DuplicatePackageModalProps {
    packageToCopy: Package | null;
    onClose: () => void;
    unionRegions: { value: string; label: string }[];
    onDuplicate: (targetRegion: string) => Promise<void>;
}

export const DuplicatePackageModal: React.FC<DuplicatePackageModalProps> = ({
    packageToCopy,
    onClose,
    unionRegions,
    onDuplicate,
}) => {
    const [targetRegion, setTargetRegion] = useState<string>('');
    const [customRegion, setCustomRegion] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!packageToCopy) return null;

    const handleConfirm = async () => {
        const finalRegion = (targetRegion === '__custom__' ? customRegion : targetRegion).trim().toLowerCase();
        if (!finalRegion) {
            alert('Silakan pilih atau masukkan nama wilayah tujuan.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onDuplicate(finalRegion);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const effectiveRegion = targetRegion === '__custom__' ? customRegion : targetRegion;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Duplikasi Paket ke Wilayah Lain"
            size="md"
        >
            <div className="space-y-5">
                {/* Source Package Info */}
                <div className="bg-[#F4F6F9] rounded-2xl p-4 border border-[#EAEFF4] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A6A85]">
                        Paket Sumber
                    </span>
                    <h4 className="font-bold text-base text-[#2A3547]">
                        {packageToCopy.name}
                    </h4>
                    <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-[#5A6A85]">Wilayah saat ini:</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#EAEFF4] text-[#2A3547]">
                            <MapPin className="w-3 h-3 text-[#5D87FF]" />
                            {packageToCopy.region || 'Semua Wilayah'}
                        </span>
                    </div>
                </div>

                {/* Region Selection */}
                <div>
                    <label className="block text-xs font-bold text-[#2A3547] mb-2 uppercase tracking-wider">
                        Pilih Wilayah Tujuan Baru
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {unionRegions.map(r => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => { setTargetRegion(r.value); setCustomRegion(''); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                    targetRegion === r.value
                                        ? 'bg-[#5D87FF] text-white border-[#5D87FF] shadow-sm'
                                        : 'bg-white text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9] border-[#EAEFF4]'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setTargetRegion('__custom__')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 ${
                                targetRegion === '__custom__'
                                    ? 'bg-[#5D87FF] text-white border-[#5D87FF] shadow-sm'
                                    : 'bg-white text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9] border-[#EAEFF4]'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Wilayah Baru</span>
                        </button>
                    </div>

                    {targetRegion === '__custom__' && (
                        <div className="animate-fade-in mt-2">
                            <input
                                type="text"
                                autoFocus
                                value={customRegion}
                                onChange={e => setCustomRegion(e.target.value)}
                                placeholder="Ketik nama wilayah (cth: Bandung, Bali, Surabaya...)"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Preview Name */}
                {effectiveRegion && (
                    <div className="bg-[#5D87FF]/5 border border-[#5D87FF]/20 rounded-xl p-3 text-xs text-[#2A3547] space-y-1">
                        <span className="font-semibold text-[#5D87FF]">Hasil Nama Paket Duplikasi:</span>
                        <p className="font-bold text-sm text-[#2A3547]">
                            "{packageToCopy.name} ({effectiveRegion.charAt(0).toUpperCase() + effectiveRegion.slice(1)})"
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 pt-2 border-t border-[#EAEFF4]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting || !effectiveRegion.trim()}
                        onClick={handleConfirm}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(93,135,255,0.25)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menduplikasi...</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span>Duplikasi Sekarang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
