import React from 'react';
import { TeamProjectPayment, Project } from '../../../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

interface FreelancerProjectsProps {
  unpaidProjects: TeamProjectPayment[];
  projectsToPay: string[];
  onToggleProject: (projectPaymentId: string) => void;
  onProceedToPayment: () => void;
  projects: Project[];
}

const FreelancerProjects: React.FC<FreelancerProjectsProps> = ({
  unpaidProjects,
  projectsToPay,
  onToggleProject,
  onProceedToPayment,
  projects,
}) => {
  if (unpaidProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-semibold text-brand-text-primary">Semua Fee Sudah Lunas</p>
        <p className="text-sm text-brand-text-secondary mt-1">Tidak ada item yang belum dibayar.</p>
      </div>
    );
  }

  const allSelected = projectsToPay.length === unpaidProjects.length && unpaidProjects.length > 0;
  const totalSelected = unpaidProjects
    .filter((p) => projectsToPay.includes(p.id))
    .reduce((sum, p) => sum + p.fee, 0);

  const handleSelectAll = () => {
    if (allSelected) {
      unpaidProjects.forEach((p) => onToggleProject(p.id));
    } else {
      unpaidProjects.filter((p) => !projectsToPay.includes(p.id)).forEach((p) => onToggleProject(p.id));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-[10px] sm:text-xs text-brand-text-secondary">
        Pilih acara yang akan dibayarkan. Bisa memilih beberapa sekaligus.
      </p>

      {/* Table */}
      <div className="border border-brand-border rounded-xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.25rem_1fr_auto_auto] items-center gap-2 px-2.5 py-2 bg-brand-bg/60 border-b border-brand-border sm:px-4 sm:gap-3 sm:py-2.5">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer sm:w-4 sm:h-4"
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary sm:text-[10px]">
            Acara
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary hidden sm:block">
            Tanggal
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary text-right sm:text-[10px]">
            Fee
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-brand-border/50">
          {unpaidProjects.map((p) => {
            const projectName =
              projects.find((proj) => proj.id === p.projectId)?.projectName ??
              'Acara tidak ditemukan';
            const isSelected = projectsToPay.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => onToggleProject(p.id)}
                className={`grid grid-cols-[1.25rem_1fr_auto_auto] items-center gap-2 px-2.5 py-2.5 cursor-pointer transition-colors sm:px-4 sm:gap-3 ${
                  isSelected
                    ? 'bg-blue-500/10 hover:bg-blue-500/15'
                    : 'hover:bg-brand-bg/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="w-3.5 h-3.5 rounded accent-blue-500 pointer-events-none sm:w-4 sm:h-4"
                />
                <span className="font-semibold text-xs text-brand-text-primary truncate sm:text-sm">
                  {projectName}
                </span>
                <span className="text-[10px] text-brand-text-secondary hidden sm:block whitespace-nowrap">
                  {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-[11px] font-bold text-brand-text-primary text-right whitespace-nowrap sm:text-sm">
                  {formatCurrency(p.fee)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      {projectsToPay.length > 0 && (
        <div className="flex flex-col gap-2.5 p-3 bg-brand-accent/10 border border-brand-accent/30 rounded-xl sm:flex-row sm:justify-between sm:items-center sm:gap-3 sm:p-4 sm:rounded-2xl">
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-brand-accent">{projectsToPay.length} acara</span>
            <span className="text-brand-text-secondary mx-2">·</span>
            <span className="text-brand-text-secondary">Total: </span>
            <span className="font-black text-brand-text-primary">{formatCurrency(totalSelected)}</span>
          </div>
          <button
            type="button"
            onClick={onProceedToPayment}
            className="button-primary w-full text-xs px-4 py-2 sm:w-auto sm:text-sm sm:px-5"
          >
            Lanjut ke Pembayaran →
          </button>
        </div>
      )}
    </div>
  );
};

export default FreelancerProjects;
