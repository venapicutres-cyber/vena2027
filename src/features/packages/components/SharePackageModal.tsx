import React, { useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import { Copy, Check, ExternalLink, Share2, MapPin } from 'lucide-react';
import { buildPublicShareUrl } from '../../../utils/publicRouting';

interface SharePackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    unionRegions: { value: string; label: string }[];
}

export const SharePackageModal: React.FC<SharePackageModalProps> = ({
    isOpen,
    onClose,
    unionRegions,
}) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (url: string, index: number) => {
        navigator.clipboard.writeText(url);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const baseUrl = buildPublicShareUrl('booking');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tautan Booking & Paket per Wilayah"
            size="lg"
        >
            <div className="space-y-4">
                <p className="text-xs sm:text-sm text-[#5A6A85]">
                    Bagikan tautan booking publik khusus ke calon pengantin. Setiap tautan akan menyaring paket & add-on sesuai dengan wilayah yang dipilih.
                </p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {/* General link */}
                    <div className="bg-[#F4F6F9] rounded-2xl p-4 border border-[#EAEFF4] space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#2A3547] flex items-center gap-1.5">
                                <Share2 className="w-3.5 h-3.5 text-[#5D87FF]" />
                                Semua Wilayah (Katalog Lengkap)
                            </span>
                            <a
                                href={baseUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-[#5D87FF] hover:underline inline-flex items-center gap-1"
                            >
                                <span>Buka Halaman</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={baseUrl}
                                className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#EAEFF4] text-xs text-[#2A3547] outline-none select-all"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(baseUrl, 999)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                    copiedIndex === 999
                                        ? 'bg-[#13DEB9] text-white'
                                        : 'bg-[#5D87FF] text-white hover:bg-[#4871e3]'
                                }`}
                            >
                                {copiedIndex === 999 ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Tersalin</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Salin</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Regional links */}
                    {unionRegions.map((r, idx) => {
                        const regionUrl = buildPublicShareUrl('booking', undefined, { query: { region: r.value } });
                        const isCopied = copiedIndex === idx;

                        return (
                            <div key={r.value} className="bg-white rounded-2xl p-4 border border-[#EAEFF4] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-[#2A3547] flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-[#5D87FF]" />
                                        Khusus Wilayah: {r.label}
                                    </span>
                                    <a
                                        href={regionUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] font-semibold text-[#5D87FF] hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>Buka Halaman</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={regionUrl}
                                        className="flex-1 px-3 py-2 rounded-xl bg-[#F4F6F9] border border-[#EAEFF4] text-xs text-[#2A3547] outline-none select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(regionUrl, idx)}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                            isCopied
                                                ? 'bg-[#13DEB9] text-white'
                                                : 'bg-[#5D87FF] text-white hover:bg-[#4871e3]'
                                        }`}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Tersalin</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Salin</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-3 border-t border-[#EAEFF4] flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-5 rounded-xl bg-[#F4F6F9] hover:bg-[#EAEFF4] text-xs font-semibold text-[#2A3547] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
};
