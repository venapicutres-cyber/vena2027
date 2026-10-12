/**
 * TeamMemberDetailModal
 *
 * Redesigned detail modal for a team / vendor member.
 *
 * Layout:
 *   ┌─ Profile header (avatar, name, role, category badge, contact)
 *   ├─ Snapshot row  (total acara · total pendapatan · rating)
 *   ├─ Tab nav       (Acara | Pembayaran | Kinerja | Portal)
 *   └─ Tab content   (scrollable)
 */

import React, { useMemo } from 'react';
import Modal from '../../../shared/ui/Modal';
import FreelancerProjects from './FreelancerProjects';
import PerformanceTab from './PerformanceTab';
import CreatePaymentTab from './CreatePaymentTab';
import {
  TeamMember,
  TeamProjectPayment,
  TeamPaymentRecord,
  Project,
  Card,
  FinancialPocket,
  PerformanceNoteType,
} from '../../../types';
import { formatCurrency, formatDate } from '../utils/teamUtils';
import { StarIcon, FileTextIcon, HistoryIcon, Share2Icon } from '../../../constants';
import { Phone, Mail, CreditCard, ChevronDown, FileText } from 'lucide-react';

// ─── Local types ──────────────────────────────────────────────────────────────

type DetailTab = 'projects' | 'payments' | 'performance' | 'create-payment';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamMemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: TeamMember;
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  // Projects tab
  selectedMemberUnpaidProjects: TeamProjectPayment[];
  projectsToPay: string[];
  onToggleProject: (id: string) => void;
  onProceedToPayment: () => void;
  projectsInDateRange: Project[];
  // Payments tab
  teamProjectPayments: TeamProjectPayment[];
  teamPaymentRecords: TeamPaymentRecord[];
  projects: Project[];
  expandedRecordId: string | null;
  onToggleExpandRecord: (id: string) => void;
  onViewSlip: (record: TeamPaymentRecord) => void;
  // Performance tab
  newNote: string;
  setNewNote: (note: string) => void;
  newNoteType: PerformanceNoteType;
  setNewNoteType: (type: PerformanceNoteType) => void;
  onSetRating: (rating: number) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
  // Create-payment tab
  paymentAmount: number | '';
  setPaymentAmount: React.Dispatch<React.SetStateAction<number | ''>>;
  isInstallment: boolean;
  setIsInstallment: React.Dispatch<React.SetStateAction<boolean>>;
  onPay: () => void;
  renderPaymentSlipBody: (record: TeamPaymentRecord) => React.ReactNode;
  cards: Card[];
  monthlyBudgetPocket: FinancialPocket | undefined;
  paymentSourceId: string;
  setPaymentSourceId: (id: string) => void;
  onSign: () => void;
  // Portal
  onOpenQrModal: (member: TeamMember) => void;
}

// ─── Snapshot stat ────────────────────────────────────────────────────────────

const SnapshotStat: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
}> = ({ label, value, sub }) => (
  <div className="flex-1 min-w-0 text-center px-1.5 py-2 sm:px-2 sm:py-2.5">
    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-1">
      {label}
    </p>
    <div className="text-sm sm:text-xl font-black text-brand-text-primary leading-none">{value}</div>
    {sub && <p className="text-[8px] sm:text-[9px] text-brand-text-secondary mt-1">{sub}</p>}
  </div>
);

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, label, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center gap-1 min-w-0 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold
      whitespace-nowrap transition-all duration-200
      ${active
        ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/25'
        : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg'
      }
    `}
  >
    <span className="truncate">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        className={`text-[9px] font-black px-1.25 py-0.5 rounded-full leading-none ${
          active ? 'bg-white/25 text-white' : 'bg-red-500/15 text-red-400 border border-red-500/25'
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

// ─── Payments tab content ─────────────────────────────────────────────────────

const PaymentsTabContent: React.FC<{
  memberPaymentRecords: TeamPaymentRecord[];
  teamProjectPayments: TeamProjectPayment[];
  projects: Project[];
  expandedRecordId: string | null;
  onToggleExpandRecord: (id: string) => void;
  onViewSlip: (record: TeamPaymentRecord) => void;
}> = ({
  memberPaymentRecords,
  teamProjectPayments,
  projects,
  expandedRecordId,
  onToggleExpandRecord,
  onViewSlip,
}) => {
  if (memberPaymentRecords.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="text-sm font-medium text-brand-text-secondary">Belum ada riwayat pembayaran.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {memberPaymentRecords.map((record, idx) => {
        const isExpanded = expandedRecordId === record.id;
        return (
          <div
            key={record.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
          >
            {/* Record row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-bold text-[#5A6A85] w-5 text-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-semibold text-[#2A3547] truncate">
                  {record.recordNumber}
                </p>
                <p className="text-xs text-[#5A6A85] mt-0.5">
                  {formatDate(record.date)}
                </p>
              </div>
              <span className="font-black text-sm text-emerald-600 shrink-0">
                {formatCurrency(record.totalAmount)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleExpandRecord(record.id)}
                  title={isExpanded ? 'Tutup rincian' : 'Lihat rincian'}
                  className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-slate-100 border border-slate-200 transition-all"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => onViewSlip(record)}
                  title="Lihat Slip"
                  className="p-1.5 rounded-lg text-[#5D87FF] bg-[#ECF2FF] hover:bg-[#d8e6ff] border border-[#5D87FF]/20 transition-all"
                >
                  <FileTextIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-200 bg-[#F8FAFC]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6A85] my-3">
                  Acara yang dibayar
                </p>
                <div className="space-y-1.5 divide-y divide-slate-200/70">
                  {record.projectPaymentIds.map((paymentId) => {
                    const payment = teamProjectPayments.find((p) => p.id === paymentId);
                    const project = projects.find((p) => p.id === payment?.projectId);
                    return (
                      <div
                        key={paymentId}
                        className="flex justify-between items-center gap-3 text-sm pt-1.5 first:pt-0"
                      >
                        <span className="text-[#2A3547] font-medium truncate">
                          {project?.projectName ?? 'Acara tidak ditemukan'}
                        </span>
                        <span className="font-bold text-[#2A3547] shrink-0">
                          {formatCurrency(payment?.fee ?? 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const TeamMemberDetailModal: React.FC<TeamMemberDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMember,
  detailTab,
  setDetailTab,
  selectedMemberUnpaidProjects,
  projectsToPay,
  onToggleProject,
  onProceedToPayment,
  projectsInDateRange,
  teamProjectPayments,
  teamPaymentRecords,
  projects,
  expandedRecordId,
  onToggleExpandRecord,
  onViewSlip,
  newNote,
  setNewNote,
  newNoteType,
  setNewNoteType,
  onSetRating,
  onAddNote,
  onDeleteNote,
  paymentAmount,
  setPaymentAmount,
  isInstallment,
  setIsInstallment,
  onPay,
  renderPaymentSlipBody,
  cards,
  monthlyBudgetPocket,
  paymentSourceId,
  setPaymentSourceId,
  onSign,
  onOpenQrModal,
}) => {
  const memberPaymentRecords = useMemo(
    () => teamPaymentRecords.filter((r) => r.teamMemberId === selectedMember.id),
    [teamPaymentRecords, selectedMember.id],
  );

  const totalPaidEvents = useMemo(
    () =>
      teamProjectPayments.filter(
        (p) => p.teamMemberId === selectedMember.id && p.status === 'Paid',
      ).length,
    [teamProjectPayments, selectedMember.id],
  );

  const totalEarnings = useMemo(
    () =>
      teamProjectPayments
        .filter((p) => p.teamMemberId === selectedMember.id && p.status === 'Paid')
        .reduce((sum, p) => sum + p.fee, 0),
    [teamProjectPayments, selectedMember.id],
  );

  const isProjectsActive = detailTab === 'projects' || detailTab === 'create-payment';
  const avatarLetter = selectedMember.name?.charAt(0).toUpperCase() ?? '?';
  const isVendor = selectedMember.category === 'Vendor';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="4xl"
    >
      <div className="flex flex-col gap-2.5 -mt-1">

        {/* ── Profile header ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-accent overflow-hidden flex items-center justify-center shrink-0 text-white text-2xl sm:text-3xl font-black shadow-lg shadow-brand-accent/25">
            {selectedMember.avatarUrl ? (
              <img src={selectedMember.avatarUrl} alt={`${selectedMember.name} avatar`} className="w-full h-full object-cover" />
            ) : avatarLetter}
          </div>

          {/* Info */}
          <div className="w-full flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-brand-text-primary leading-tight truncate">
                  {selectedMember.name}
                </h3>
                <p className="text-[11px] sm:text-sm text-brand-text-secondary mt-0.5">{selectedMember.role}</p>
              </div>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[11px] font-bold border shrink-0 ${
                  isVendor
                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                    : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                }`}
              >
                {isVendor ? 'Vendor' : 'Tim'}
              </span>
            </div>

            {/* Contact chips */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-2 sm:justify-start">
              {selectedMember.phone && (
                <a
                  href={`tel:${selectedMember.phone}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] text-brand-text-secondary bg-brand-bg border border-brand-border hover:text-brand-text-primary transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {selectedMember.phone}
                </a>
              )}
              {selectedMember.email && (
                <a
                  href={`mailto:${selectedMember.email}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] text-brand-text-secondary bg-brand-bg border border-brand-border hover:text-brand-text-primary transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  {selectedMember.email}
                </a>
              )}
              {selectedMember.noRek && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] text-brand-text-secondary bg-brand-bg border border-brand-border">
                  <CreditCard className="w-3 h-3" />
                  {selectedMember.bankName ? `${selectedMember.bankName} · ` : ''}{selectedMember.noRek}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Snapshot stats row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-brand-border bg-brand-bg border border-brand-border rounded-lg sm:rounded-2xl overflow-hidden">
          <SnapshotStat
            label="Acara Selesai"
            value={totalPaidEvents}
            sub="Sudah dibayar"
          />
          <SnapshotStat
            label="Total Pendapatan"
            value={
              <span className="text-base font-black">{formatCurrency(totalEarnings)}</span>
            }
            sub="Lifetime"
          />
          <SnapshotStat
            label="Rating"
            value={
              <span className="inline-flex items-center gap-1 justify-center">
                {selectedMember.rating.toFixed(1)}
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              </span>
            }
            sub="dari 5"
          />
        </div>

        {/* ── Tab navigation ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-brand-bg border border-brand-border rounded-lg sm:rounded-2xl">
          <TabBtn
            active={isProjectsActive}
            onClick={() => setDetailTab('projects')}
            icon={<FileTextIcon className="w-3.5 h-3.5 shrink-0" />}
            label="Acara"
            badge={selectedMemberUnpaidProjects.length}
          />
          <TabBtn
            active={detailTab === 'payments'}
            onClick={() => setDetailTab('payments')}
            icon={<HistoryIcon className="w-3.5 h-3.5 shrink-0" />}
            label="Pembayaran"
          />
          <TabBtn
            active={detailTab === 'performance'}
            onClick={() => setDetailTab('performance')}
            icon={<StarIcon className="w-3.5 h-3.5 shrink-0" />}
            label="Kinerja"
          />
          <TabBtn
            active={false}
            onClick={() => onOpenQrModal(selectedMember)}
            icon={<Share2Icon className="w-3.5 h-3.5 shrink-0" />}
            label="Portal"
          />
        </div>

        {/* ── Tab content (scrollable) ────────────────────────────────────── */}
        <div className="max-h-[50vh] overflow-y-auto pr-1 pb-1">

          {/* Tab: Acara Pernikahan */}
          {detailTab === 'projects' && (
            <FreelancerProjects
              unpaidProjects={selectedMemberUnpaidProjects}
              projectsToPay={projectsToPay}
              onToggleProject={onToggleProject}
              onProceedToPayment={onProceedToPayment}
              projects={projectsInDateRange}
            />
          )}

          {/* Tab: Riwayat Pembayaran */}
          {detailTab === 'payments' && (
            <PaymentsTabContent
              memberPaymentRecords={memberPaymentRecords}
              teamProjectPayments={teamProjectPayments}
              projects={projects}
              expandedRecordId={expandedRecordId}
              onToggleExpandRecord={onToggleExpandRecord}
              onViewSlip={onViewSlip}
            />
          )}

          {/* Tab: Kinerja */}
          {detailTab === 'performance' && (
            <PerformanceTab
              member={selectedMember}
              onSetRating={onSetRating}
              newNote={newNote}
              setNewNote={setNewNote}
              newNoteType={newNoteType}
              setNewNoteType={setNewNoteType}
              onAddNote={onAddNote}
              onDeleteNote={onDeleteNote}
            />
          )}

          {/* Tab: Buat Pembayaran */}
          {detailTab === 'create-payment' && (
            <CreatePaymentTab
              member={selectedMember}
              paymentDetails={{
                projects: selectedMemberUnpaidProjects.filter((p) =>
                  projectsToPay.includes(p.id),
                ),
                total: typeof paymentAmount === 'number' ? paymentAmount : 0,
              }}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              isInstallment={isInstallment}
              setIsInstallment={setIsInstallment}
              onPay={onPay}
              onSetTab={() => setDetailTab('projects')}
              renderPaymentDetailsContent={() =>
                renderPaymentSlipBody({
                  id: `TEMP-${Date.now()}`,
                  recordNumber: `PAY-FR-${selectedMember.id.slice(-4)}-${Date.now()}`,
                  teamMemberId: selectedMember.id,
                  date: new Date().toISOString(),
                  projectPaymentIds: projectsToPay,
                  totalAmount: typeof paymentAmount === 'number' ? paymentAmount : 0,
                })
              }
              cards={cards}
              monthlyBudgetPocket={monthlyBudgetPocket}
              paymentSourceId={paymentSourceId}
              setPaymentSourceId={setPaymentSourceId}
              onSign={onSign}
            />
          )}

        </div>
      </div>
    </Modal>
  );
};

export default TeamMemberDetailModal;
