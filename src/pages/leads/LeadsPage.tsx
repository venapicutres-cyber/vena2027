import React, { useState, useMemo, useEffect } from 'react';
import { Kanban, Table, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { MobileCollapsibleSection, MobileExpandableExtra } from '../../components/ui/MobileProgressiveDisclosure';

// Helper function to escape special regex characters
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};
import { Lead, LeadStatus, Client, ClientStatus, Project, Package, AddOn, Transaction, TransactionType, PaymentStatus, Profile, Card, FinancialPocket, ContactChannel, PromoCode, ClientType, ViewType, NavigationAction, Gallery } from '../../types';

import Modal from '../../shared/ui/Modal';
import RupiahInput from '../../shared/form/RupiahInput';
import { PlusIcon, PencilIcon, Trash2Icon, Share2Icon, DownloadIcon, SendIcon, UsersIcon, TargetIcon, TrendingUpIcon, CalendarIcon, MapPinIcon, QrCodeIcon, MessageSquareIcon, CameraIcon, FileTextIcon, PhoneIncomingIcon, LightbulbIcon, ChevronRightIcon, CheckCircleIcon, EyeIcon, LinkIcon, WhatsappIcon } from '../../constants';
import { ModernStatCard } from '../../components/modernize/ModernStatCard';
import { cleanPhoneNumber } from '../../constants';
import { listLeads as _listLeads, createLead as createLeadRow, updateLead as updateLeadRow, deleteLead as deleteLeadRow } from '../../services/leads';
import { createClient as createClientRow } from '../../services/clients';
import { createProject as createProjectRow } from '../../services/projects';
import { createTransaction as createTransactionRow, updateCardBalance } from '../../services/transactions';
import { findCardIdByMeta } from '../../services/cards';
import { upsertProfile } from '../../services/profile';
import { listGalleries } from '../../services/galleries';
import { buildPublicShareUrl, getGalleryPublicRouteId } from '../../utils/publicRouting';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const getContactChannelIcon = (channel: ContactChannel) => {
    const iconProps = { className: "w-4 h-4" };
    switch (channel) {
        case ContactChannel.WHATSAPP: return <WhatsappIcon {...iconProps} />;
        case ContactChannel.INSTAGRAM: return <CameraIcon {...iconProps} />;
        case ContactChannel.WEBSITE: return <FileTextIcon {...iconProps} />;
        case ContactChannel.PHONE: return <PhoneIncomingIcon {...iconProps} />;
        case ContactChannel.REFERRAL: return <Share2Icon {...iconProps} />;
        case ContactChannel.SUGGESTION_FORM: return <WhatsappIcon {...iconProps} />;
        default: return <LightbulbIcon {...iconProps} />;
    }
};

const getDaysSince = (dateString: string) => {
    const leadDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - leadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Hari ini';
    if (diffDays === 2) return 'Kemarin';
    return `${diffDays} hari lalu`;
};

const sourceColors: { [key in ContactChannel]?: string } = {
    [ContactChannel.INSTAGRAM]: '#c13584', [ContactChannel.WHATSAPP]: '#25D366',
    [ContactChannel.WEBSITE]: '#3b82f6', [ContactChannel.REFERRAL]: '#f59e0b',
    [ContactChannel.PHONE]: '#8b5cf6', [ContactChannel.SUGGESTION_FORM]: '#14b8a6',
    [ContactChannel.OTHER]: '#64748b'
};

const statusConfig: Record<LeadStatus, { color: string, softBg: string, badgeClass: string, title: string, surface: string, border: string }> = {
    [LeadStatus.DISCUSSION]: {
        color: '#3563E9',
        softBg: '#ECF2FF',
        badgeClass: 'bg-[#ECF2FF] text-[#2348C7] border border-[#CFE0FF]',
        title: 'Diskusi',
        surface: '#F7FAFF',
        border: '#D9E5FF',
    },
    [LeadStatus.FOLLOW_UP]: {
        color: '#8B5CF6',
        softBg: '#F3E8FF',
        badgeClass: 'bg-[#F3E8FF] text-[#6F38D9] border border-[#E2D0FF]',
        title: 'Follow Up',
        surface: '#FAF7FF',
        border: '#E7D8FF',
    },
    [LeadStatus.CONVERTED]: {
        color: '#14A76C',
        softBg: '#EAFBF2',
        badgeClass: 'bg-[#EAFBF2] text-[#0F8C5A] border border-[#CDEEDC]',
        title: 'Dikonversi',
        surface: '#F5FFF9',
        border: '#D2F0E0',
    },
    [LeadStatus.REJECTED]: {
        color: '#EA5A47',
        softBg: '#FCECEC',
        badgeClass: 'bg-[#FCECEC] text-[#C63F31] border border-[#F7C8C8]',
        title: 'Ditolak',
        surface: '#FFF9F8',
        border: '#F7D0CC',
    },
};

// --- Form Components ---

interface LeadFormProps {
    formData: any;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleCloseModal: () => void;
    modalMode: 'add' | 'edit';
    isSubmitting?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({ formData, handleFormChange, handleSubmit, handleCloseModal, modalMode, isSubmitting = false }) => {
    return (
        <form onSubmit={handleSubmit} className="space-y-4 form-compact form-compact--ios-scale">
            <div className="hidden sm:block bg-blue-100 border border-blue-600 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <LightbulbIcon className="w-4 h-4" />
                    Informasi Calon Pengantin
                </h4>
                <p className="text-xs text-brand-text-secondary">
                    Catat informasi Calon Pengantin baru yang menghubungi Anda. Data ini akan membantu Anda melacak dan mengelola calon pengantin.
                </p>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-brand-text-light mb-3">Data Calon Pengantin</h5>
                <div className="input-group">
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} className="input-field" placeholder=" " required />
                    <label htmlFor="name" className="input-label">Nama Calon Pengantin</label>
                    <p className="hidden sm:block text-xs text-brand-text-secondary mt-1">Nama lengkap pasangan calon pengantin</p>
                </div>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-brand-text-light mb-3">Sumber &amp; Lokasi</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="input-group">
                        <select id="contactChannel" name="contactChannel" value={formData.contactChannel} onChange={handleFormChange} className="input-field">
                            {Object.values(ContactChannel).map(channel => <option key={channel} value={channel}>{channel}</option>)}
                        </select>
                        <label htmlFor="contactChannel" className="input-label">Sumber Calon Pengantin</label>
                        <p className="hidden sm:block text-xs text-brand-text-secondary mt-1">Dari mana Calon Pengantin menghubungi?</p>
                    </div>
                    <div className="input-group">
                        <input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} className="input-field" placeholder=" " />
                        <label htmlFor="location" className="input-label">Lokasi (Kota)</label>
                        <p className="hidden sm:block text-xs text-brand-text-secondary mt-1">Kota domisili Calon Pengantin</p>
                    </div>
                </div>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-brand-text-light mb-3">Alamat Lengkap</h5>
                <div className="input-group">
                    <textarea id="address" name="address" value={formData.address} onChange={handleFormChange} className="input-field" placeholder=" " rows={3}></textarea>
                    <label htmlFor="address" className="input-label">Alamat Lengkap / Gedung</label>
                    <p className="hidden sm:block text-xs text-brand-text-secondary mt-1">Alamat spesifik untuk Acara Pernikahan</p>
                </div>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-brand-text-light mb-3">Kontak</h5>
                <div className="input-group">
                    <input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleFormChange} className="input-field" placeholder=" " />
                    <label htmlFor="whatsapp" className="input-label">No. WhatsApp</label>
                    <p className="hidden sm:block text-xs text-brand-text-secondary mt-1">Nomor WhatsApp aktif untuk komunikasi</p>
                </div>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-brand-text-light mb-3">Tanggal Acara <span className="text-brand-text-secondary font-normal">(Opsional)</span></h5>
                <div className="input-group">
                    <input type="date" id="eventDate" name="eventDate" value={formData.eventDate || ''} onChange={handleFormChange} className="input-field" placeholder=" " aria-label="Tanggal acara (opsional)" />
                    <label htmlFor="eventDate" className="input-label">Tanggal Acara Pernikahan</label>
                    <p className="hidden sm:block text-xs text-brand-text-secondary mt-1">Bisa dikosongkan jika belum ada tanggal pasti dari client.</p>
                </div>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-brand-text-light mb-3">Catatan Tambahan</h5>
                <div className="input-group">
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleFormChange} className="input-field" placeholder=" " rows={4}></textarea>
                    <label htmlFor="notes" className="input-label">Catatan</label>
                    <p className="text-xs text-brand-text-secondary mt-1">Catat kebutuhan, preferensi, atau informasi penting lainnya dan tanggal acaranya</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-brand-border sticky bottom-0 bg-brand-surface">
                <button type="button" onClick={handleCloseModal} className="button-secondary w-full sm:w-auto">Batal</button>
                <button type="submit" disabled={isSubmitting} className="button-primary w-full sm:w-auto">{isSubmitting ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Calon Pengantin' : 'Update Calon Pengantin')}</button>
            </div>
        </form>
    );
};

interface ConvertLeadFormProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleCloseModal: () => void;
    packages: Package[];
    addOns: AddOn[];
    userProfile: Profile;
    cards: Card[];
    promoCodes: PromoCode[];
    isSubmitting?: boolean;
}

const ConvertLeadForm: React.FC<ConvertLeadFormProps> = ({ formData, setFormData, handleFormChange, handleSubmit, handleCloseModal, packages, addOns, userProfile, cards, promoCodes, isSubmitting = false }) => {
    const priceCalculations = useMemo(() => {
        const selectedPackage = packages.find(p => p.id === formData.packageId);
        const packagePrice = selectedPackage?.price || 0;

        const addOnsPrice = addOns
            .filter(addon => formData.selectedAddOnIds.includes(addon.id))
            .reduce((sum, addon) => sum + addon.price, 0);

        let totalProjectBeforeDiscount = packagePrice + addOnsPrice;
        let discountAmount = 0;
        let discountApplied = 'N/A';
        const promoCode = promoCodes.find(p => p.id === formData.promoCodeId);

        if (promoCode) {
            if (promoCode.discountType === 'percentage') {
                discountAmount = (totalProjectBeforeDiscount * promoCode.discountValue) / 100;
                discountApplied = `${promoCode.discountValue}%`;
            } else { // fixed
                discountAmount = promoCode.discountValue;
                discountApplied = formatCurrency(promoCode.discountValue);
            }
        }

        const totalProject = totalProjectBeforeDiscount - discountAmount;
        const remainingPayment = totalProject - Number(formData.dp);

        return { packagePrice, addOnsPrice, totalProject, remainingPayment, discountAmount, discountApplied };
    }, [formData.packageId, formData.selectedAddOnIds, formData.dp, formData.promoCodeId, packages, addOns, promoCodes]);

    return (
        <form onSubmit={handleSubmit} className="form-compact form-compact--ios-scale">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                {/* Left Column: Client & Project Info */}
                <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gradient border-b border-brand-border pb-2">Informasi Pengantin</h4>
                    <div className="input-group"><input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleFormChange} className="input-field" placeholder=" " required /><label htmlFor="clientName" className="input-label">Nama Pengantin</label></div>
                    <div className="input-group">
                        <select id="clientType" name="clientType" value={formData.clientType} onChange={handleFormChange} className="input-field" required>
                            {Object.values(ClientType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                        </select>
                        <label htmlFor="clientType" className="input-label">Jenis Pengantin</label>
                    </div>
                    <div className="input-group"><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} className="input-field" placeholder=" " required /><label htmlFor="phone" className="input-label">Nomor Telepon</label></div>
                    <div className="input-group"><input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp || ''} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="whatsapp" className="input-label">No. WhatsApp</label></div>
                    <div className="input-group"><input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} className="input-field" placeholder=" " required /><label htmlFor="email" className="input-label">Email</label></div>
                    <div className="input-group"><input type="text" id="instagram" name="instagram" value={formData.instagram} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="instagram" className="input-label">Instagram (@username)</label></div>

                    <h4 className="text-base font-semibold text-gradient border-b border-brand-border pb-2 pt-4">Informasi Acara Pernikahan</h4>
                    <div className="input-group"><input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={handleFormChange} className="input-field" placeholder=" " required /><label htmlFor="projectName" className="input-label">Nama Acara Pernikahan</label></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="input-group"><select id="projectType" name="projectType" value={formData.projectType} onChange={handleFormChange} className="input-field" required><option value="" disabled>Pilih Jenis...</option>{userProfile.projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}</select><label htmlFor="projectType" className="input-label">Jenis Acara Pernikahan</label></div>
                        <div className="input-group"><input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="date" className="input-label">Tanggal Acara Pernikahan</label></div>
                    </div>
                    <div className="input-group"><input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} className="input-field" placeholder=" " /><label htmlFor="location" className="input-label">Lokasi (Kota)</label></div>
                    <div className="input-group"><textarea id="address" name="address" value={formData.address} onChange={handleFormChange} className="input-field" placeholder=" " rows={2}></textarea><label htmlFor="address" className="input-label">Alamat Lengkap</label></div>
                </div>

                {/* Right Column: Financial & Other Info */}
                <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gradient border-b border-brand-border pb-2">Detail Package & Pembayaran</h4>
                    <div className="input-group">
                        <select id="packageId" name="packageId" value={formData.packageId} onChange={handleFormChange} className="input-field" required>
                            <option value="">Pilih Package...</option>
                            {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <label htmlFor="packageId" className="input-label">Package</label>
                        <p className="text-right text-xs text-brand-text-secondary mt-1">Harga Package: {formatCurrency(priceCalculations.packagePrice)}</p>
                    </div>

                    <div className="input-group">
                        <label className="input-label !static !-top-4 !text-brand-accent">Add-On</label>
                        <div className="p-3 border border-brand-border bg-brand-bg rounded-lg max-h-32 overflow-y-auto space-y-2 mt-2">
                            {addOns.map(addon => (
                                <label key={addon.id} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-input cursor-pointer">
                                    <span className="text-sm text-brand-text-primary">{addon.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-brand-text-secondary">{formatCurrency(addon.price)}</span>
                                        <input type="checkbox" id={addon.id} name="addOns" checked={formData.selectedAddOnIds.includes(addon.id)} onChange={handleFormChange} className="h-4 w-4 rounded flex-shrink-0 text-blue-600 focus:ring-blue-600 transition-colors" />
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-right text-xs text-brand-text-secondary mt-1">Total Harga Add-On: {formatCurrency(priceCalculations.addOnsPrice)}</p>
                    </div>

                    <div className="input-group">
                        <select id="promoCodeId" name="promoCodeId" value={formData.promoCodeId} onChange={handleFormChange} className="input-field">
                            <option value="">Tanpa Kode Promo</option>
                            {promoCodes.filter(p => p.isActive).map(p => (
                                <option key={p.id} value={p.id}>{p.code} - ({p.discountType === 'percentage' ? `${p.discountValue}%` : formatCurrency(p.discountValue)})</option>
                            ))}
                        </select>
                        <label htmlFor="promoCodeId" className="input-label">Kode Promo</label>
                        {formData.promoCodeId && <p className="text-right text-xs text-brand-success mt-1">Diskon Diterapkan: {priceCalculations.discountApplied}</p>}
                    </div>

                    <div className="p-4 bg-brand-bg rounded-lg space-y-3">
                        <div className="flex justify-between items-center font-bold text-lg"><span className="text-brand-text-secondary">Total Acara Pernikahan</span><span className="text-brand-text-light">{formatCurrency(priceCalculations.totalProject)}</span></div>
                        <div className="input-group !mt-2">
                            <RupiahInput
                                id="dp"
                                name="dp"
                                value={String(formData.dp ?? '')}
                                onChange={(raw) => setFormData((prev: any) => ({ ...prev, dp: raw }))}
                                className="input-field text-right"
                                placeholder=" "
                            />
                            <label htmlFor="dp" className="input-label">Uang DP</label>
                        </div>
                        {Number(formData.dp) > 0 && (
                            <div className="input-group !mt-2">
                                <select name="dpDestinationCardId" value={formData.dpDestinationCardId} onChange={handleFormChange} className="input-field" required>
                                    <option value="">Setor DP ke...</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} {c.lastFourDigits !== 'CASH' ? `**** ${c.lastFourDigits}` : '(Tunai)'}</option>)}
                                </select>
                                <label htmlFor="dpDestinationCardId" className="input-label">Kartu Tujuan</label>
                            </div>
                        )}
                        <hr className="border-brand-border" />
                        <div className="flex justify-between items-center font-bold text-lg"><span className="text-brand-text-secondary">Sisa Pembayaran</span><span className="text-blue-800">{formatCurrency(priceCalculations.remainingPayment)}</span></div>
                    </div>

                    <h4 className="text-base font-semibold text-gradient border-b border-brand-border pb-2 pt-4">Lainnya (Opsional)</h4>
                    <div className="input-group"><textarea id="notes" name="notes" value={formData.notes} onChange={handleFormChange} className="input-field" placeholder=" "></textarea><label htmlFor="notes" className="input-label">Catatan Tambahan</label></div>
                </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-8 mt-8 border-t border-brand-border sticky bottom-0 bg-brand-surface">
                <button type="button" onClick={handleCloseModal} className="button-secondary">Batal</button>
                <button type="submit" disabled={isSubmitting} className="button-primary">{isSubmitting ? 'Menyimpan...' : 'Konversi Calon Pengantin'}</button>
            </div>
        </form>
    );
};


// --- SUB-COMPONENTS ---

const LeadCard: React.FC<{
    lead: Lead;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onNextStatus: () => void;
    onShare: (type: 'package' | 'booking') => void;
}> = ({ lead, onDragStart, onClick, onEdit, onDelete, onNextStatus, onShare }) => {
    const isHot = useMemo(() => new Date(lead.date) > new Date(Date.now() - 24 * 60 * 60 * 1000), [lead.date]);
    const needsFollowUp = useMemo(() => lead.status === LeadStatus.DISCUSSION && new Date(lead.date) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), [lead.date, lead.status]);
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    const renderActions = () => {
        if (lead.status === LeadStatus.DISCUSSION) {
            return (
                <div className="flex items-center gap-1.5 md:gap-2 leads-card-actions">
                    <button onClick={(e) => { e.stopPropagation(); onShare('package'); }} className="btn-box-wa text-xs px-2.5 py-1.5" title="Bagikan Package via WA"><WhatsappIcon className="w-3.5 h-3.5 flex-shrink-0 text-white" /><span>Package WA</span></button>
                    <button onClick={(e) => { e.stopPropagation(); onNextStatus(); }} className="btn-box-read text-xs px-3 py-1.5 inline-flex items-center gap-1 font-semibold"><span>Follow Up</span><ChevronRightIcon className="w-3.5 h-3.5 flex-shrink-0 text-white" /></button>
                </div>
            );
        }
        if (lead.status === LeadStatus.FOLLOW_UP) {
            return (
                <div className="flex items-center gap-1.5 md:gap-2 leads-card-actions">
                    <button onClick={(e) => { e.stopPropagation(); onShare('booking'); }} className="btn-box-wa text-xs px-2.5 py-1.5" title="Kirim Form Booking via WA"><WhatsappIcon className="w-3.5 h-3.5 flex-shrink-0 text-white" /><span>Form WA</span></button>
                    <button onClick={(e) => { e.stopPropagation(); onNextStatus(); }} className="btn-box-add text-xs px-3 py-1.5 inline-flex items-center gap-1 font-semibold"><span>Konversi</span><CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0 text-white" /></button>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            draggable
            onDragStart={e => onDragStart(e, lead.id)}
            onClick={onClick}
            className="group p-3 md:p-4 rounded-2xl cursor-grab border shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.99] leads-card"
            style={{
                borderLeftColor: statusConfig[lead.status].color,
                borderLeftWidth: '4px',
                background: statusConfig[lead.status].surface,
                borderColor: statusConfig[lead.status].border,
                boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF3FF] to-[#F1F5F9] text-[11px] font-black text-[#3758D1] shrink-0">
                        {getInitials(lead.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <p className="font-bold text-sm md:text-base text-[#2A3547] truncate">{lead.name}</p>
                            {isHot && (
                                <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-700" title="Calon Pengantin baru (24 jam terakhir)">
                                    Baru
                                </span>
                            )}
                            {needsFollowUp && (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700" title="Perlu Follow Up">
                                    Follow Up
                                </span>
                            )}
                        </div>

                        {lead.location && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#5A6A85] min-w-0">
                                <MapPinIcon className="w-3 h-3 flex-shrink-0 text-[#6B7280]" />
                                <span className="truncate">{lead.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8EDF5] bg-white text-[#42526B] shadow-sm transition hover:border-[#CCD8F5] hover:text-[#2348C7]"
                        title="Edit"
                    >
                        <PencilIcon className="w-4 h-4 flex-shrink-0" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EA5A47] text-white shadow-sm transition hover:bg-[#D94F3C]"
                        title="Hapus"
                    >
                        <Trash2Icon className="w-4 h-4 flex-shrink-0" />
                    </button>
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {lead.eventDate && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#F6F8FB] px-2.5 py-1.5 text-[11px] text-[#41506B]">
                        <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#5D87FF]" />
                        <span className="font-medium text-[#2A3547]">Acara:</span>
                        <span>{new Date(lead.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                )}

                {lead.whatsapp && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E3ECF5] bg-[#F9FBFF] px-2.5 py-1.5">
                        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#5A6A85]">
                            <span className="text-green-600 flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </span>
                            <span className="truncate">{lead.whatsapp}</span>
                        </div>
                        <a
                            href={`https://wa.me/${cleanPhoneNumber(lead.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-box-wa px-2 py-1 text-[10px] rounded-lg font-semibold"
                            title="Chat Langsung via WA"
                        >
                            Chat WA
                        </a>
                    </div>
                )}

                {lead.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-[#5A6A85]">
                        <MapPinIcon className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 text-[#6B7280]" />
                        <span className="line-clamp-2">{lead.address}</span>
                    </div>
                )}

                {lead.notes && (
                    <p className="line-clamp-2 border-t border-[#EEF2F7] pt-2 text-[11px] leading-5 text-[#41506B]">
                        {lead.notes}
                    </p>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF2F7] pt-2.5 text-[11px] text-[#5A6A85]">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                    {getContactChannelIcon(lead.contactChannel)}
                    <span className="truncate">{getDaysSince(lead.date)}</span>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusConfig[lead.status].badgeClass}`}>
                    {statusConfig[lead.status].title}
                </span>
            </div>

            <div className="sm:hidden mt-3" onClick={e => e.stopPropagation()}>
                <MobileExpandableExtra
                    labelOpen="Lihat detail"
                    labelClose="Sembunyikan"
                    headerRight={renderActions()}
                >
                    <div className="space-y-1.5 text-xs">
                        {lead.whatsapp && (
                            <div className="flex items-center justify-between gap-1.5 text-brand-text-secondary">
                                <span className="truncate">{lead.whatsapp}</span>
                                <a
                                    href={`https://wa.me/${cleanPhoneNumber(lead.whatsapp)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-box-wa px-2 py-0.5 text-[10px] flex-shrink-0"
                                >
                                    Chat WA
                                </a>
                            </div>
                        )}
                        {lead.address && (
                            <p className="text-brand-text-secondary line-clamp-2">{lead.address}</p>
                        )}
                        {lead.notes && (
                            <p className="text-brand-text-primary italic line-clamp-3">{lead.notes}</p>
                        )}
                    </div>
                </MobileExpandableExtra>
            </div>

            <div className="hidden sm:flex mt-3 pt-3 border-t border-[#EEF2F7] justify-end">
                {renderActions()}
            </div>
        </div>
    );
};

// --- Main Component ---

interface LeadsProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    packages: Package[];
    addOns: AddOn[];
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    userProfile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    showNotification: (message: string) => void;
    handleNavigation: (view: ViewType, action?: NavigationAction) => void;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    totals: {
        projects: number;
        activeProjects: number;
        clients: number;
        activeClients: number;
        leads: number;
        discussionLeads: number;
        followUpLeads: number;
        teamMembers: number;
        transactions: number;
        revenue: number;
        expense: number;
    };
}

export const Leads: React.FC<LeadsProps> = ({
    leads, setLeads, clients, setClients, projects, setProjects, packages, addOns, transactions, setTransactions, userProfile, setProfile, showNotification, handleNavigation, cards, setCards, pockets, setPockets, promoCodes, setPromoCodes, totals
}) => {
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'convert'>('add');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [activeStatModal, setActiveStatModal] = useState<string | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [hiddenColumns, setHiddenColumns] = useState<Set<LeadStatus>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState<ContactChannel | 'all'>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [shareModalState, setShareModalState] = useState<{ type: 'package' | 'booking', lead: Lead } | null>(null);
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const activeLeadFilterCount = (sourceFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

    const publicLeadFormUrl = useMemo(() => buildPublicShareUrl('lead'), []);
    const publicBookingFormUrl = useMemo(() => buildPublicShareUrl('booking'), []);
    const publicPackagesUrl = useMemo(() => buildPublicShareUrl('packages'), []);

    useEffect(() => {
        if (isShareModalOpen && typeof (window as any).QRCode !== 'undefined') {
            const qrCodeContainer = document.getElementById('lead-form-qrcode');
            if (qrCodeContainer) {
                qrCodeContainer.innerHTML = '';
                new (window as any).QRCode(qrCodeContainer, {
                    text: publicLeadFormUrl, width: 200, height: 200, colorDark: "#020617", colorLight: "#ffffff", correctLevel: 2
                });
            }
        }
    }, [isShareModalOpen, publicLeadFormUrl]);

    const handleStatCardClick = (stat: string) => setActiveStatModal(stat);
    const toggleHiddenColumns = () => {
        setHiddenColumns(prev => {
            const newHidden = new Set(prev);
            const completedStatuses: LeadStatus[] = [LeadStatus.CONVERTED, LeadStatus.REJECTED];
            if (newHidden.has(LeadStatus.CONVERTED)) {
                completedStatuses.forEach(s => newHidden.delete(s));
            } else {
                completedStatuses.forEach(s => newHidden.add(s));
            }
            return newHidden;
        });
    };

    const filteredLeads = useMemo(() => leads.filter(lead => {
        const searchMatch = searchTerm === '' || lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || (lead.notes && lead.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        const sourceMatch = sourceFilter === 'all' || lead.contactChannel === sourceFilter;
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(23, 59, 59, 999);
        const leadDate = new Date(lead.date);
        const dateMatch = (!from || leadDate >= from) && (!to || leadDate <= to);
        return searchMatch && sourceMatch && dateMatch;
    }), [leads, searchTerm, sourceFilter, dateFrom, dateTo]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
        e.dataTransfer.setData("leadId", leadId);
        setDraggedLeadId(leadId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: LeadStatus) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("leadId");
        const leadToUpdate = leads.find(l => l.id === leadId);

        if (leadToUpdate && leadToUpdate.status !== newStatus) {
            if (newStatus === LeadStatus.CONVERTED) {
                handleOpenModal('convert', leadToUpdate);
            } else {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus, date: new Date().toISOString() } : l));
                // persist status change
                void updateLeadRow(leadId, { status: newStatus, date: new Date().toISOString().split('T')[0] }).catch(err => console.warn('[Supabase] update lead status failed', err));
            }
        }
        setDraggedLeadId(null);
    };

    const handleNextStatus = (leadId: string, currentStatus: LeadStatus) => {
        let newStatus: LeadStatus | null = null;
        if (currentStatus === LeadStatus.DISCUSSION) newStatus = LeadStatus.FOLLOW_UP;
        if (currentStatus === LeadStatus.FOLLOW_UP) newStatus = LeadStatus.CONVERTED;

        if (newStatus) {
            const lead = leads.find(l => l.id === leadId);
            if (!lead) return;
            if (newStatus === LeadStatus.CONVERTED) {
                handleOpenModal('convert', lead);
            } else {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus, date: new Date().toISOString() } : l));
                void updateLeadRow(leadId, { status: newStatus, date: new Date().toISOString().split('T')[0] }).catch(err => console.warn('[Supabase] update lead status failed', err));
                showNotification(`Calon Pengantin "${lead.name}" dipindahkan ke "${newStatus}".`);
            }
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'convert', lead?: Lead) => {
        setModalMode(mode);
        setSelectedLead(lead || null);
        if (mode === 'edit' && lead) {
            setFormData(lead);
        } else if (mode === 'convert' && lead) {
            setFormData({
                clientName: lead.name, email: '', phone: '', whatsapp: lead.whatsapp || '', instagram: '', clientType: ClientType.DIRECT,
                projectName: `${lead.name}`, projectType: userProfile.projectTypes[0] || '',
                location: lead.location, address: lead.address || '', date: lead.eventDate || new Date().toISOString().split('T')[0], packageId: '', selectedAddOnIds: [], dp: '', dpDestinationCardId: '', notes: lead.notes || '', promoCodeId: ''
            });
        } else {
            setFormData({ name: '', contactChannel: ContactChannel.OTHER, location: '', address: '', whatsapp: '', notes: '', eventDate: '', date: new Date().toISOString(), status: LeadStatus.DISCUSSION });
        }
        setIsModalOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { id, checked } = e.target as HTMLInputElement;
            setFormData((prev: any) => ({ ...prev, selectedAddOnIds: checked ? [...prev.selectedAddOnIds, id] : prev.selectedAddOnIds.filter((addOnId: string) => addOnId !== id) }));
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await handleSubmitInner(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitInner = async (e: React.FormEvent) => {
        if (modalMode === 'add' || modalMode === 'edit') {
            try {
                if (modalMode === 'add') {
                    const created = await createLeadRow({
                        name: formData.name,
                        contactChannel: formData.contactChannel,
                        location: formData.location || '',
                        status: formData.status || LeadStatus.DISCUSSION,
                        date: new Date().toISOString().split('T')[0],
                        notes: formData.notes || undefined,
                        whatsapp: formData.whatsapp || undefined,
                        address: formData.address || undefined,
                        eventDate: formData.eventDate || undefined,
                    } as Omit<Lead, 'id'>);
                    setLeads(prev => [created, ...prev]);
                    showNotification('Calon Pengantin baru berhasil ditambahkan.');
                } else if (selectedLead) {
                    const updated = await updateLeadRow(selectedLead.id, {
                        name: formData.name,
                        contactChannel: formData.contactChannel,
                        location: formData.location || '',
                        status: formData.status,
                        notes: formData.notes || undefined,
                        whatsapp: formData.whatsapp || undefined,
                        address: formData.address || undefined,
                        eventDate: formData.eventDate || undefined,
                    });
                    setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l));
                    showNotification('Calon Pengantin berhasil diperbarui.');
                }
            } catch (err) {
                alert('Gagal menyimpan Calon Pengantin ke database. Coba lagi.');
                return;
            }
        } else if (modalMode === 'convert' && selectedLead) {
            const selectedPackage = packages.find(p => p.id === formData.packageId);
            if (!selectedPackage) { alert('Harap pilih Package.'); return; }
            const selectedAddOns = addOns.filter(addon => formData.selectedAddOnIds.includes(addon.id));
            // Prefer explicit unitPrice chosen in the form (duration-based), fallback to package.default price
            const packagePrice = formData.unitPrice !== undefined && !isNaN(Number(formData.unitPrice)) ? Number(formData.unitPrice) : (selectedPackage.price || 0);
            const totalBeforeDiscount = packagePrice + selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
            let finalDiscountAmount = 0;
            const promoCode = promoCodes.find(p => p.id === formData.promoCodeId);
            if (promoCode) {
                if (promoCode.discountType === 'percentage') { finalDiscountAmount = (totalBeforeDiscount * promoCode.discountValue) / 100; }
                else { finalDiscountAmount = promoCode.discountValue; }
            }
            const totalProject = totalBeforeDiscount - finalDiscountAmount;
            const dpAmount = Number(formData.dp) || 0;
            try {
                // Step 1: Update the lead's status to CONVERTED
                await updateLeadRow(selectedLead.id, { status: LeadStatus.CONVERTED });

                // Step 2: Create the new client, project, and transaction records
                const createdClient = await createClientRow({
                    name: formData.clientName,
                    email: formData.email,
                    phone: formData.phone,
                    whatsapp: formData.whatsapp || undefined,
                    instagram: '',
                    clientType: ClientType.DIRECT,
                    since: new Date().toISOString().split('T')[0],
                    status: ClientStatus.ACTIVE,
                    lastContact: new Date().toISOString(),
                    portalAccessId: crypto.randomUUID(),
                    address: formData.address || undefined,
                } as Omit<Client, 'id'>);
                setClients(prev => [createdClient, ...prev]);

                // Create project in Supabase
                const createdProject = await createProjectRow({
                    projectName: `${formData.clientName}`,
                    clientName: formData.clientName,
                    clientId: createdClient.id,
                    projectType: formData.projectType,
                    packageName: selectedPackage.name,
                    date: formData.date,
                    location: formData.location,
                    address: formData.address,
                    status: 'Dikonfirmasi',
                    totalCost: totalProject,
                    amountPaid: dpAmount,
                    paymentStatus: dpAmount >= totalProject ? PaymentStatus.LUNAS : (dpAmount > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR),
                    durationSelection: formData.durationSelection || undefined,
                    unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
                    notes: formData.notes || undefined,
                    promoCodeId: formData.promoCodeId || undefined,
                    discountAmount: finalDiscountAmount > 0 ? finalDiscountAmount : undefined,
                    addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
                    accommodation: undefined,
                    driveLink: undefined,
                    printingCost: undefined,
                    transportCost: undefined,
                    completedDigitalItems: [],
                });
                const mergedProject: Project = { ...createdProject, addOns: selectedAddOns };
                setProjects(prev => [mergedProject, ...prev]);

                // DP transaction persist
                if (dpAmount > 0) {
                    const selectedCard = cards.find(c => c.id === formData.dpDestinationCardId);
                    const supaCardId = selectedCard ? await findCardIdByMeta(selectedCard.bankName, selectedCard.lastFourDigits) : null;
                    try {
                        const createdTx = await createTransactionRow({
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${mergedProject.projectName}`,
                            amount: dpAmount,
                            type: TransactionType.INCOME,
                            projectId: mergedProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: supaCardId || undefined,
                        } as Omit<Transaction, 'id' | 'vendorSignature'>);
                        setTransactions(prev => {
                            const exists = prev.some(t => t.id === createdTx.id);
                            const list = exists ? prev.map(t => t.id === createdTx.id ? createdTx : t) : [createdTx, ...prev];
                            return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        });
                        if (supaCardId) {
                            setCards(prev => prev.map(c => c.id === formData.dpDestinationCardId ? { ...c, balance: c.balance + dpAmount } : c));
                        }
                    } catch (err) {
                        console.warn('[Supabase] DP convert lead transaction failed, fallback local.', err);
                        const fallbackTx: Transaction = {
                            id: `TRN-DP-${mergedProject.id}`,
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${mergedProject.projectName}`,
                            amount: dpAmount,
                            type: TransactionType.INCOME,
                            projectId: mergedProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: formData.dpDestinationCardId,
                        };
                        setTransactions(prev => {
                            const exists = prev.some(t => t.id === fallbackTx.id);
                            const list = exists ? prev.map(t => t.id === fallbackTx.id ? fallbackTx : t) : [fallbackTx, ...prev];
                            return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        });
                        setCards(prev => prev.map(c => c.id === formData.dpDestinationCardId ? { ...c, balance: c.balance + dpAmount } : c));
                    }
                }
                if (promoCode) { setPromoCodes(prev => prev.map(p => p.id === promoCode.id ? { ...p, usageCount: p.usageCount + 1 } : p)); }
                setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: LeadStatus.CONVERTED, notes: `Dikonversi menjadi Pengantin ID: ${createdClient.id}` } : l));
                showNotification(`Calon Pengantin ${selectedLead.name} berhasil dikonversi menjadi pengantin!`);
            } catch (err) {
                alert('Gagal mengkonversi Calon Pengantin. Coba lagi.');
                return;
            }
        }
        handleCloseModal();
    };

    const handleDeleteLead = async (leadId: string) => {
        if (!window.confirm('Hapus Calon Pengantin ini?')) return;
        try {
            await deleteLeadRow(leadId);
            setLeads(prev => prev.filter(l => l.id !== leadId));
            showNotification('Calon Pengantin berhasil dihapus.');
        } catch (err) {
            alert('Gagal menghapus Calon Pengantin di database. Coba lagi.');
        }
    };

    const leadColumns = useMemo(() => {
        const columns: Record<LeadStatus, Lead[]> = {
            [LeadStatus.DISCUSSION]: [], [LeadStatus.FOLLOW_UP]: [], [LeadStatus.CONVERTED]: [], [LeadStatus.REJECTED]: [],
        };
        filteredLeads.forEach(lead => { columns[lead.status]?.push(lead); });
        return columns;
    }, [filteredLeads]);

    const visibleLeadColumns = useMemo(() => Object.entries(leadColumns).filter(([status]) => !hiddenColumns.has(status as LeadStatus)), [leadColumns, hiddenColumns]);

    const modalData = useMemo<{ title: string; items: Lead[]; groupedItems: Record<string, Lead[]> | null }>(() => {
        if (!activeStatModal) return { title: '', items: [], groupedItems: null };
        switch (activeStatModal) {
            case 'all': return { title: `Semua Calon Pengantin (${leads.length})`, items: leads, groupedItems: null };
            case 'active': return { title: 'Calon Pengantin Aktif (Diskusi + Follow Up)', items: leads.filter(l => l.status === LeadStatus.DISCUSSION || l.status === LeadStatus.FOLLOW_UP), groupedItems: null };
            case 'discussion': return { title: 'Sedang Diskusi', items: leads.filter(l => l.status === LeadStatus.DISCUSSION), groupedItems: null };
            case 'followup': return { title: 'Menunggu Follow Up', items: leads.filter(l => l.status === LeadStatus.FOLLOW_UP), groupedItems: null };
            case 'converted': return { title: 'Dikonversi Menjadi Pengantin', items: leads.filter(l => l.status === LeadStatus.CONVERTED), groupedItems: null };
            case 'rejected': return { title: 'Ditolak / Tidak Berlanjut', items: leads.filter(l => l.status === LeadStatus.REJECTED), groupedItems: null };
            case 'new': { const n = new Date(); const som = new Date(n.getFullYear(), n.getMonth(), 1); return { title: 'Calon Pengantin Baru Bulan Ini', items: leads.filter(l => new Date(l.date) >= som), groupedItems: null }; }
            case 'source': { const leadsBySource = leads.reduce((acc, lead) => { const source = lead.contactChannel; if (!acc[source]) acc[source] = []; acc[source].push(lead); return acc; }, {} as Record<string, Lead[]>); return { title: 'Calon Pengantin Berdasarkan Sumber', items: [], groupedItems: leadsBySource }; }
            case 'location': { const leadsByLocation = leads.reduce((acc, lead) => { const location = lead.location.trim() || 'Tidak Diketahui'; if (!acc[location]) acc[location] = []; acc[location].push(lead); return acc; }, {} as Record<string, Lead[]>); return { title: 'Calon Pengantin Berdasarkan Lokasi', items: [], groupedItems: leadsByLocation }; }
            default: return { title: '', items: [], groupedItems: null };
        }
    }, [activeStatModal, leads]);

    // ── Stat computations ─────────────────────────────────────────────────────
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => l.status === LeadStatus.DISCUSSION || l.status === LeadStatus.FOLLOW_UP).length;
    const discussionLeads = leads.filter(l => l.status === LeadStatus.DISCUSSION).length;
    const followUpLeads = leads.filter(l => l.status === LeadStatus.FOLLOW_UP).length;
    const convertedLeads = leads.filter(l => l.status === LeadStatus.CONVERTED).length;
    const rejectedLeads = leads.filter(l => l.status === LeadStatus.REJECTED).length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = leads.filter(l => new Date(l.date) >= startOfMonth).length;

    const isEmpty = leads.length === 0;

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* ── Stat Cards Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <ModernStatCard
                    icon={<UsersIcon className="w-5 h-5" />}
                    title="Total Prospek"
                    value={String(totalLeads)}
                    subtitle={`+${newThisMonth} bulan ini`}
                    iconColorVariant="primary"
                    onClick={() => handleStatCardClick('all')}
                />
                <ModernStatCard
                    icon={<TargetIcon className="w-5 h-5" />}
                    title="Aktif"
                    value={String(activeLeads)}
                    subtitle="Diskusi + Follow Up"
                    iconColorVariant="primary"
                    onClick={() => handleStatCardClick('active')}
                />
                <ModernStatCard
                    icon={<MessageSquareIcon className="w-5 h-5" />}
                    title="Sedang Diskusi"
                    value={String(discussionLeads)}
                    subtitle="Perlu tindakan"
                    iconColorVariant="warning"
                    onClick={() => handleStatCardClick('discussion')}
                />
                <ModernStatCard
                    icon={<ChevronRightIcon className="w-5 h-5" />}
                    title="Follow Up"
                    value={String(followUpLeads)}
                    subtitle="Menunggu respons"
                    iconColorVariant="error"
                    onClick={() => handleStatCardClick('followup')}
                />
                <ModernStatCard
                    icon={<CheckCircleIcon className="w-5 h-5" />}
                    title="Dikonversi"
                    value={String(convertedLeads)}
                    subtitle={`${conversionRate}% konversi`}
                    iconColorVariant="success"
                    changeType="increase"
                    change={`${conversionRate}%`}
                    onClick={() => handleStatCardClick('converted')}
                />
                <ModernStatCard
                    icon={<Share2Icon className="w-5 h-5" />}
                    title="Ditolak"
                    value={String(rejectedLeads)}
                    subtitle="Tidak berlanjut"
                    iconColorVariant="error"
                    onClick={() => handleStatCardClick('rejected')}
                />
            </div>

            {isEmpty ? (
                <div className="text-center py-20">
                    <LightbulbIcon className="mx-auto h-16 w-16 text-brand-accent" />
                    <h2 className="mt-4 text-2xl font-bold text-brand-text-light">Selamat Datang di Halaman Calon Pengantin!</h2>
                    <p className="mt-2 text-brand-text-secondary max-w-lg mx-auto">Halaman ini adalah tempat Anda mengelola semua calon pengantin (Calon Pengantin) sebelum mereka resmi menjadi Acara Pernikahan.</p>
                    <button onClick={() => handleOpenModal('add')} className="mt-8 button-primary inline-flex items-center gap-2"><PlusIcon className="w-5 h-5" />Tambah Calon Pengantin Pertama Anda</button>
                </div>
            ) : (
                <>
                    {/* ── Filter Bar ──────────────────────────────────────────────── */}
                    <div className="bg-brand-surface p-3 md:p-4 rounded-xl shadow-lg border border-brand-border flex flex-col gap-3 md:gap-4 leads-filter-section">
                        {/* Mobile Top Row: Search + Filter Toggle + Add Button */}
                        <div className="flex sm:hidden items-center gap-2 w-full">
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="input-field !rounded-xl !border !bg-brand-bg px-3 py-2 text-xs flex-1 min-w-0"
                                placeholder="Cari Calon Pengantin..."
                            />
                            <button
                                type="button"
                                onClick={() => setMobileFiltersOpen(prev => !prev)}
                                className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors flex-shrink-0 ${
                                    mobileFiltersOpen || activeLeadFilterCount > 0
                                        ? 'bg-[#5D87FF]/10 border-[#5D87FF]/30 text-[#5D87FF]'
                                        : 'bg-brand-bg border-brand-border text-brand-text-primary'
                                }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Filter</span>
                                {activeLeadFilterCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-[#5D87FF] text-white text-[10px] font-bold">
                                        {activeLeadFilterCount}
                                    </span>
                                )}
                                {mobileFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => handleOpenModal('add')}
                                className="button-primary px-3 py-2 inline-flex items-center justify-center gap-1 text-xs font-semibold flex-shrink-0 !rounded-xl"
                                title="Tambah Calon Pengantin Manual"
                            >
                                <PlusIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Tambah</span>
                            </button>
                        </div>

                        {/* Desktop Search + Source row (or mobile expanded) */}
                        <div className={`${mobileFiltersOpen ? 'flex' : 'hidden sm:flex'} flex-col sm:flex-row gap-3 w-full`}>
                            <div className="hidden sm:block input-group flex-grow !mt-0 w-full">
                                <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field !rounded-lg !border !bg-brand-bg p-3 text-sm" placeholder=" " />
                                <label className="input-label text-sm">Cari Calon Pengantin...</label>
                            </div>
                            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)} className="input-field !rounded-lg !border !bg-brand-bg p-2.5 sm:p-3 text-xs sm:text-sm w-full sm:w-44 leads-source-filter">
                                <option value="all">Semua Sumber</option>
                                {Object.values(ContactChannel).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        <div className={`${mobileFiltersOpen ? 'flex' : 'hidden sm:flex'} flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full leads-filter-row`}>
                            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field !rounded-lg !border !bg-brand-bg p-2.5 sm:p-3 text-xs sm:text-sm w-full" title="Dari tanggal" />
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field !rounded-lg !border !bg-brand-bg p-2.5 sm:p-3 text-xs sm:text-sm w-full" title="Sampai tanggal" />
                            </div>
                            <div className="flex items-center justify-end gap-2 w-full sm:w-auto leads-filter-buttons">
                                {/* View toggle */}
                                <div className="flex rounded-lg border border-brand-border overflow-hidden flex-shrink-0">
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className={`px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-brand-accent text-white' : 'bg-brand-bg text-brand-text-secondary hover:bg-brand-border'}`}
                                        title="Tampilan Kanban"
                                    >
                                        <Kanban className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Kanban</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1 ${viewMode === 'table' ? 'bg-brand-accent text-white' : 'bg-brand-bg text-brand-text-secondary hover:bg-brand-border'}`}
                                        title="Tampilan Tabel"
                                    >
                                        <Table className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Tabel</span>
                                    </button>
                                </div>
                                {viewMode === 'kanban' && (
                                    <button onClick={toggleHiddenColumns} className="button-secondary min-h-[35px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm font-semibold" title={hiddenColumns.has(LeadStatus.CONVERTED) ? 'Tampilkan Kolom Selesai' : 'Sembunyikan Kolom Selesai'}>
                                        <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="inline sm:hidden lg:inline">{hiddenColumns.has(LeadStatus.CONVERTED) ? 'Tampil' : 'Kolom'}</span>
                                    </button>
                                )}
                                <button onClick={() => setIsShareModalOpen(true)} className="button-secondary min-h-[35px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm font-semibold" title="Bagikan Form Calon Pengantin">
                                    <Share2Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="inline sm:hidden">Share</span>
                                </button>
                                <button onClick={() => handleOpenModal('add')} className="hidden sm:inline-flex button-primary min-h-[40px] px-3 py-2 items-center justify-center gap-1.5 text-sm font-semibold" title="Tambah Calon Pengantin Manual">
                                    <PlusIcon className="w-4 h-4 flex-shrink-0" />
                                    <span>Tambah</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Kanban View ─────────────────────────────────────────────── */}
                    {viewMode === 'kanban' && (
                        <>
                            {/* Mobile grouped list */}
                            <div className="md:hidden space-y-3 -mx-4 px-4">
                                {visibleLeadColumns.map(([status, leadItems]) => {
                                    const statusInfo = statusConfig[status as LeadStatus];
                                    return (
                                        <div key={status} className="bg-brand-bg rounded-2xl border border-brand-border overflow-hidden">
                                            <div className="p-3 text-sm font-semibold text-brand-text-light border-b flex justify-between items-center" style={{ borderColor: statusInfo.color, borderBottomWidth: 2 }}>
                                                <span className="truncate">{statusInfo.title}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white ml-2 flex-shrink-0" style={{ backgroundColor: statusInfo.color }}>{leadItems.length}</span>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                {leadItems.map(lead => (
                                                    <LeadCard
                                                        key={lead.id}
                                                        lead={lead}
                                                        onDragStart={() => { }}
                                                        onClick={() => handleOpenModal('edit', lead)}
                                                        onEdit={() => handleOpenModal('edit', lead)}
                                                        onDelete={() => {
                                                            const ok = window.confirm(`Hapus Calon Pengantin "${lead.name}"?`);
                                                            if (!ok) return;
                                                            setLeads(prev => prev.filter(l => l.id !== lead.id));
                                                            void deleteLeadRow(lead.id).catch(err => {
                                                                console.warn('[Supabase] delete lead failed', err);
                                                                showNotification('Gagal menghapus Calon Pengantin. Silakan coba lagi.');
                                                            });
                                                        }}
                                                        onNextStatus={() => handleNextStatus(lead.id, lead.status)}
                                                        onShare={(type) => setShareModalState({ type, lead })}
                                                    />
                                                ))}
                                                {leadItems.length === 0 && (
                                                    <p className="text-center py-6 text-xs text-brand-text-secondary">Tidak ada Calon Pengantin.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Desktop kanban columns */}
                            <div className="hidden md:flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                                {visibleLeadColumns.map(([status, leadItems]) => {
                                    const statusInfo = statusConfig[status as LeadStatus];
                                    return (
                                        <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status as LeadStatus)} className="w-80 flex-shrink-0 rounded-2xl border border-[#EAEFF4] bg-[#F7F9FC] flex flex-col shadow-sm leads-column-container">
                                            <div className="px-4 py-3 font-semibold text-[#2A3547] border-b flex justify-between items-center sticky top-0 rounded-t-2xl z-10 leads-column-header" style={{ borderColor: statusInfo.border, backgroundColor: statusInfo.softBg }}>
                                                <span>{statusInfo.title}</span>
                                                <span className="inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: statusInfo.color }}>{leadItems.length}</span>
                                            </div>
                                            <div className="p-3 space-y-3 h-auto pr-1">
                                                {leadItems.map(lead => (
                                                    <LeadCard key={lead.id} lead={lead} onDragStart={handleDragStart} onClick={() => handleOpenModal('edit', lead)} onEdit={() => handleOpenModal('edit', lead)} onDelete={() => {
                                                        const ok = window.confirm(`Hapus Calon Pengantin "${lead.name}"?`);
                                                        if (!ok) return;
                                                        setLeads(prev => prev.filter(l => l.id !== lead.id));
                                                        void deleteLeadRow(lead.id).catch(err => {
                                                            console.warn('[Supabase] delete lead failed', err);
                                                            showNotification('Gagal menghapus Calon Pengantin. Silakan coba lagi.');
                                                        });
                                                    }} onNextStatus={() => handleNextStatus(lead.id, lead.status)} onShare={(type) => setShareModalState({ type, lead })} />
                                                ))}
                                                {leadItems.length === 0 && <p className="text-center py-8 text-sm text-brand-text-secondary">Tidak ada Calon Pengantin.</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── Table View ──────────────────────────────────────────────── */}
                    {viewMode === 'table' && (
                        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-lg overflow-hidden">
                            {/* Table summary bar */}
                            <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-brand-text-light">
                                    {filteredLeads.length} Calon Pengantin
                                    {filteredLeads.length !== leads.length && <span className="text-brand-text-secondary font-normal"> dari {leads.length} total</span>}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {Object.values(LeadStatus).map(s => {
                                        const sc = statusConfig[s];
                                        if (!sc) return null;
                                        const count = filteredLeads.filter(l => l.status === s).length;
                                        return count > 0 ? (
                                            <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: sc.color }}>
                                                {sc.title}: {count}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm !border-0">
                                    <thead>
                                        <tr className="bg-brand-bg text-left">
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border w-10">#</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border">Nama</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden sm:table-cell">WA / Kontak</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden md:table-cell">Lokasi</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden lg:table-cell">Sumber</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden lg:table-cell">Tgl Kontak</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden xl:table-cell">Tgl Acara</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border">Status</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-12 text-center text-brand-text-secondary !border-0">
                                                    <LightbulbIcon className="mx-auto w-8 h-8 mb-2 opacity-40" />
                                                    <p>Tidak ada Calon Pengantin yang cocok dengan filter.</p>
                                                </td>
                                            </tr>
                                        ) : filteredLeads.map((lead, idx) => {
                                            const sc = statusConfig[lead.status] ?? { color: '#64748b', title: lead.status };
                                            const isHot = new Date(lead.date) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                                            return (
                                                <tr
                                                    key={lead.id}
                                                    className="border-t border-brand-border/50 hover:bg-brand-bg/60 transition-colors cursor-pointer group"
                                                    onClick={() => handleOpenModal('edit', lead)}
                                                >
                                                    {/* # */}
                                                    <td className="px-4 py-3 text-brand-text-secondary text-xs !border-0">{idx + 1}</td>
                                                    {/* Nama */}
                                                    <td className="px-4 py-3 !border-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: sc.color }}>
                                                                {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-brand-text-light text-sm truncate max-w-[160px] flex items-center gap-1.5">
                                                                    <span className="truncate">{lead.name}</span>
                                                                    {isHot && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-100 text-orange-700 shrink-0" title="Baru 24 jam">Baru</span>}
                                                                </p>
                                                                {lead.notes && <p className="text-xs text-brand-text-secondary truncate max-w-[160px]">{lead.notes}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* WA */}
                                                    <td className="px-4 py-3 hidden sm:table-cell !border-0">
                                                        {lead.whatsapp ? (
                                                            <a
                                                                href={`https://wa.me/${cleanPhoneNumber(lead.whatsapp)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={e => e.stopPropagation()}
                                                                className="btn-box-wa px-2 py-1 text-xs inline-flex items-center gap-1"
                                                            >
                                                                <WhatsappIcon className="w-3 h-3" />
                                                                {lead.whatsapp}
                                                            </a>
                                                        ) : (
                                                            <span className="text-brand-text-secondary text-xs">—</span>
                                                        )}
                                                    </td>
                                                    {/* Lokasi */}
                                                    <td className="px-4 py-3 hidden md:table-cell !border-0">
                                                        {lead.location ? (
                                                            <span className="flex items-center gap-1 text-xs text-brand-text-primary">
                                                                <MapPinIcon className="w-3 h-3 text-brand-accent flex-shrink-0" />
                                                                {lead.location}
                                                            </span>
                                                        ) : <span className="text-brand-text-secondary text-xs">—</span>}
                                                    </td>
                                                    {/* Sumber */}
                                                    <td className="px-4 py-3 hidden lg:table-cell !border-0">
                                                        <span className="flex items-center gap-1.5 text-xs text-brand-text-primary">
                                                            <span style={{ color: sourceColors[lead.contactChannel] }}>
                                                                {getContactChannelIcon(lead.contactChannel)}
                                                            </span>
                                                            {lead.contactChannel}
                                                        </span>
                                                    </td>
                                                    {/* Tgl Kontak */}
                                                    <td className="px-4 py-3 hidden lg:table-cell !border-0">
                                                        <span className="text-xs text-brand-text-primary">{new Date(lead.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </td>
                                                    {/* Tgl Acara */}
                                                    <td className="px-4 py-3 hidden xl:table-cell !border-0">
                                                        {lead.eventDate ? (
                                                            <span className="flex items-center gap-1 text-xs text-brand-text-primary">
                                                                <CalendarIcon className="w-3 h-3 text-brand-accent flex-shrink-0" />
                                                                {new Date(lead.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        ) : <span className="text-brand-text-secondary text-xs">—</span>}
                                                    </td>
                                                    {/* Status */}
                                                    <td className="px-4 py-3 !border-0">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: sc.color }}>
                                                            {sc.title}
                                                        </span>
                                                    </td>
                                                    {/* Aksi */}
                                                    <td className="px-4 py-3 !border-0" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {lead.status === LeadStatus.DISCUSSION && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setShareModalState({ type: 'package', lead })}
                                                                        className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1EBF5A]"
                                                                        title="Kirim Package WA"
                                                                    >
                                                                        <WhatsappIcon className="w-3 h-3" />
                                                                        <span>Pkg</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleNextStatus(lead.id, lead.status)}
                                                                        className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#5D87FF] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#4570EA]"
                                                                        title="Pindah ke Follow Up"
                                                                    >
                                                                        <span>FU</span>
                                                                        <ChevronRightIcon className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {lead.status === LeadStatus.FOLLOW_UP && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setShareModalState({ type: 'booking', lead })}
                                                                        className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1EBF5A]"
                                                                        title="Kirim Form Booking WA"
                                                                    >
                                                                        <WhatsappIcon className="w-3 h-3" />
                                                                        <span>Booking</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleOpenModal('convert', lead)}
                                                                        className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#14A76C] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#118E5C]"
                                                                        title="Konversi"
                                                                    >
                                                                        <CheckCircleIcon className="w-3 h-3" />
                                                                        <span>Konversi</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => handleOpenModal('edit', lead)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#D8E1F0] bg-white text-[#42526B] shadow-sm transition hover:border-[#BFD1F9] hover:text-[#2348C7]"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLead(lead.id)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#EA5A47] text-white shadow-sm transition hover:bg-[#D94F3C]"
                                                                title="Hapus"
                                                            >
                                                                <Trash2Icon className="w-3.5 h-3.5 text-white" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* Table footer */}
                            {filteredLeads.length > 0 && (
                                <div className="px-4 py-3 border-t border-brand-border bg-brand-bg/50 text-xs text-brand-text-secondary text-right">
                                    Menampilkan {filteredLeads.length} dari {leads.length} calon pengantin
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Tambah Calon Pengantin Baru' : modalMode === 'edit' ? 'Edit Calon Pengantin' : 'Konversi Calon Pengantin Menjadi Pengantin'} size={modalMode === 'convert' ? '4xl' : 'lg'}>
                {modalMode === 'convert' ? (
                    <ConvertLeadForm
                        formData={formData}
                        setFormData={setFormData}
                        handleFormChange={handleFormChange}
                        handleSubmit={handleSubmit}
                        handleCloseModal={handleCloseModal}
                        packages={packages}
                        addOns={addOns}
                        userProfile={userProfile}
                        cards={cards}
                        promoCodes={promoCodes}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <LeadForm
                        formData={formData}
                        handleFormChange={handleFormChange}
                        handleSubmit={handleSubmit}
                        handleCloseModal={handleCloseModal}
                        modalMode={modalMode}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Modal>

            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Bagikan Formulir Calon Pengantin Publik" size="sm">
                <div className="text-center p-4">
                    <div id="lead-form-qrcode" className="p-4 bg-white rounded-lg inline-block mx-auto"></div>
                    <p className="text-xs text-brand-text-secondary mt-4 break-all">{publicLeadFormUrl}</p>
                    <div className="flex items-center gap-2 mt-6">
                        <button onClick={() => { navigator.clipboard.writeText(publicLeadFormUrl); showNotification('Tautan berhasil disalin!'); }} className="button-secondary w-full">Salin Tautan</button>
                        <a href={`https://wa.me/?text=Silakan%20isi%20formulir%20berikut%20untuk%20memulai%3A%20${encodeURIComponent(publicLeadFormUrl)}`} target="_blank" rel="noopener noreferrer" className="btn-box-wa w-full py-2.5 text-xs sm:text-sm">Bagikan ke WA</a>
                    </div>
                </div>
            </Modal>

            {shareModalState && <ShareMessageModal type={shareModalState.type} lead={shareModalState.lead} userProfile={userProfile} publicBookingFormUrl={publicBookingFormUrl} publicPackagesUrl={publicPackagesUrl} onClose={() => setShareModalState(null)} showNotification={showNotification} setProfile={setProfile} />}

            <Modal isOpen={!!activeStatModal} onClose={() => setActiveStatModal(null)} title={modalData.title} size="2xl"><div className="max-h-[60vh] overflow-y-auto pr-2">{modalData.items.length > 0 ? (<div className="space-y-3">{modalData.items.map(lead => (<div key={lead.id} className="p-3 bg-brand-bg rounded-lg flex justify-between items-center"><div><p className="font-semibold text-brand-text-light">{lead.name}</p><p className="text-sm text-brand-text-secondary">{lead.location} - {lead.contactChannel}</p></div><span className="text-xs text-brand-text-secondary">{new Date(lead.date).toLocaleDateString('id-ID')}</span></div>))}</div>) : modalData.groupedItems ? (<div className="space-y-4">{Object.entries(modalData.groupedItems).map(([group, items]) => (<div key={group}><h4 className="font-semibold text-gradient border-b border-brand-border pb-2 mb-2">{group} ({(items as Lead[]).length})</h4><div className="space-y-2">{(items as Lead[]).map(lead => (<div key={lead.id} className="p-2 bg-brand-bg rounded-md"><p className="font-medium text-sm text-brand-text-light">{lead.name}</p></div>))}</div></div>))}</div>) : <p className="text-center text-brand-text-secondary py-8">Tidak ada data untuk ditampilkan.</p>}</div></Modal>
        </div>
    );
}

// --- Share Modal Component (Internal to Leads) ---
interface ShareMessageModalProps {
    type: 'package' | 'booking';
    lead: Lead;
    userProfile: Profile;
    publicPackagesUrl: string;
    publicBookingFormUrl: string;
    onClose: () => void;
    showNotification: (message: string) => void;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
}

const ShareMessageModal: React.FC<ShareMessageModalProps> = ({ type, lead, userProfile, publicPackagesUrl, publicBookingFormUrl, onClose, showNotification, setProfile }) => {
    const [message, setMessage] = useState('');
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [selectedGalleryId, setSelectedGalleryId] = useState<string>('');

    useEffect(() => {
        let template = '';
        if (type === 'package') {
            template = (userProfile.packageShareTemplate || '').replace('{leadName}', lead.name).replace('{companyName}', userProfile.companyName).replace('{packageLink}', publicPackagesUrl);
        } else {
            const bookingUrlWithId = `${publicBookingFormUrl}?leadId=${lead.id}`;
            template = (userProfile.bookingFormTemplate || '').replace('{leadName}', lead.name).replace('{companyName}', userProfile.companyName).replace('{bookingFormLink}', bookingUrlWithId);
        }
        setMessage(template);
    }, [type, lead, userProfile, publicPackagesUrl, publicBookingFormUrl]);

    // Load public galleries for quick share
    useEffect(() => {
        (async () => {
            try {
                const all = await listGalleries();
                const publicOnes = (all || []).filter(g => g.is_public && g.public_id);
                setGalleries(publicOnes);
                if (publicOnes.length > 0) setSelectedGalleryId(publicOnes[0].id);
            } catch (e) {
                // Non-blocking; ignore error in share modal
                console.warn('Failed to load galleries for share modal', e);
            }
        })();
    }, []);

    const selectedGallery = useMemo(() => galleries.find(g => g.id === selectedGalleryId) || null, [galleries, selectedGalleryId]);
    const selectedGalleryLink = useMemo(() => selectedGallery ? `${window.location.origin}/#/gallery/${getGalleryPublicRouteId(selectedGallery, galleries)}` : '', [selectedGallery, galleries]);

    const handleShareToWhatsApp = () => {
        if (!lead.whatsapp) { showNotification('Nomor WhatsApp untuk Calon Pengantin ini tidak tersedia.'); return; }
        const whatsappUrl = `https://wa.me/${cleanPhoneNumber(lead.whatsapp)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleSaveTemplate = async () => {
        let rawTemplate = message;
        try {
            if (type === 'package') {
                rawTemplate = message
                    .replace(new RegExp(escapeRegExp(lead.name), 'g'), '{leadName}')
                    .replace(new RegExp(escapeRegExp(userProfile.companyName), 'g'), '{companyName}')
                    .replace(new RegExp(escapeRegExp(publicPackagesUrl), 'g'), '{packageLink}');
                setProfile(prev => ({ ...prev, packageShareTemplate: rawTemplate }));
                await upsertProfile({ id: userProfile.id, packageShareTemplate: rawTemplate });
            } else {
                const bookingUrlWithId = `${publicBookingFormUrl}?leadId=${lead.id}`;
                rawTemplate = message
                    .replace(new RegExp(escapeRegExp(lead.name), 'g'), '{leadName}')
                    .replace(new RegExp(escapeRegExp(userProfile.companyName), 'g'), '{companyName}')
                    .replace(new RegExp(escapeRegExp(bookingUrlWithId), 'g'), '{bookingFormLink}');
                setProfile(prev => ({ ...prev, bookingFormTemplate: rawTemplate }));
                await upsertProfile({ id: userProfile.id, bookingFormTemplate: rawTemplate });
            }
            showNotification('Template berhasil disimpan!');
        } catch (err) {
            console.warn('[Supabase] upsert profile template failed', err);
            showNotification('Gagal menyimpan template. Coba lagi.');
        }
    };

    const title = type === 'package' ? `Bagikan Package ke ${lead.name}` : `Kirim Form Booking ke ${lead.name}`;

    return (
        <Modal isOpen={true} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="input-group">
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} className="input-field w-full" placeholder=" "></textarea>
                    <label className="input-label">Pesan WhatsApp</label>
                </div>
                {galleries.length > 0 && (
                    <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-brand-text-light inline-flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Link Pricelist</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <select value={selectedGalleryId} onChange={(e) => setSelectedGalleryId(e.target.value)} className="input-field md:col-span-2">
                                {galleries.map(g => (<option key={g.id} value={g.id}>{g.title} • {g.region}</option>))}
                            </select>
                            <div className="flex gap-2 w-full">
                                <button type="button" onClick={() => { if (selectedGalleryLink) { navigator.clipboard.writeText(selectedGalleryLink); showNotification('Link Pricelist disalin'); } }} className="button-secondary flex-1">Salin Link</button>
                                <button type="button" onClick={() => { if (selectedGalleryLink) setMessage(prev => (prev ? prev + `\n${selectedGalleryLink}` : selectedGalleryLink)); }} className="button-primary flex-1">Masukkan</button>
                            </div>
                        </div>
                        {selectedGalleryLink && (<p className="text-xs text-brand-text-secondary break-all">{selectedGalleryLink}</p>)}
                    </div>
                )}
                <div className="flex flex-col md:flex-row md:justify-between gap-2 pt-4 border-t border-brand-border sticky bottom-0 bg-brand-surface">
                    <button onClick={handleSaveTemplate} className="button-secondary w-full md:w-auto">Simpan Template Ini</button>
                    <button onClick={handleShareToWhatsApp} className="btn-box-wa inline-flex items-center gap-2 w-full md:w-auto px-4 py-2.5 text-xs sm:text-sm"><WhatsappIcon className="w-4 h-4 flex-shrink-0 text-white" /> Bagikan ke WhatsApp</button>
                </div>
            </div>
        </Modal>
    );
};

export default Leads;
