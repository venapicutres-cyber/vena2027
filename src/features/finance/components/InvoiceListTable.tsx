import React from 'react';
import { InvoiceDoc, SortField, SortDir } from '../hooks/useInvoices';
import { ArrowUpDown, ChevronUp, ChevronDown, Eye, Trash2, Pencil, FileText, Plus } from 'lucide-react';
import { MobileExpandableExtra } from '../../../components/ui/MobileProgressiveDisclosure';

// ─── Helpers ──────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ─── Status badge ─────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    Lunas: 'bg-[#13DEB9]/10 text-[#13DEB9] border-[#13DEB9]/20',
    'DP Terbayar': 'bg-[#5D87FF]/10 text-[#5D87FF] border-[#5D87FF]/20',
    'Belum Bayar': 'bg-[#FFAE1F]/10 text-[#FFAE1F] border-[#FFAE1F]/20',
    Pemasukan: 'bg-[#49BEFF]/10 text-[#49BEFF] border-[#49BEFF]/20',
  };
  const cls = cfg[status] ?? 'bg-[#5A6A85]/10 text-[#5A6A85] border-[#5A6A85]/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {status}
    </span>
  );
};

// ─── Kind badge ───────────────────────────────────────────────────────────

const KindBadge: React.FC<{ kind: 'invoice' | 'receipt' | 'slip-gaji' }> = ({ kind }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      kind === 'invoice'
        ? 'bg-[#5D87FF]/10 text-[#5D87FF] border-[#5D87FF]/20'
        : kind === 'receipt'
        ? 'bg-[#49BEFF]/10 text-[#49BEFF] border-[#49BEFF]/20'
        : 'bg-[#13DEB9]/10 text-[#13DEB9] border-[#13DEB9]/20'
    }`}
  >
    {kind === 'invoice' ? 'Invoice' : kind === 'receipt' ? 'Tanda Terima' : 'Slip Gaji'}
  </span>
);

// ─── Sort icon ────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ field: SortField; current: SortField; dir: SortDir }> = ({
  field,
  current,
  dir,
}) => {
  if (field !== current) {
    return <ArrowUpDown className="w-3 h-3 text-brand-text-secondary/40" />;
  }
  return dir === 'asc' ? (
    <ChevronUp className="w-3 h-3 text-brand-accent" />
  ) : (
    <ChevronDown className="w-3 h-3 text-brand-accent" />
  );
};

const EyeIcon = () => <Eye className="w-4 h-4" />;
const TrashIcon = () => <Trash2 className="w-4 h-4" />;
const EditIcon = () => <Pencil className="w-4 h-4" />;

// ─── Props ────────────────────────────────────────────────────────────────

interface InvoiceListTableProps {
  docs: InvoiceDoc[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onView: (doc: InvoiceDoc) => void;
  onEdit?: (doc: InvoiceDoc) => void;
  onDelete: (doc: InvoiceDoc) => void;
  onAdd?: () => void;
}

// ─── Sortable TH ─────────────────────────────────────────────────────────

const Th: React.FC<{
  label: string;
  field?: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}> = ({ label, field, sortField, sortDir, onSort, className = '' }) => (
  <th
    className={`px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-brand-text-secondary whitespace-nowrap ${
      field ? 'cursor-pointer select-none hover:text-brand-text-primary transition-colors' : ''
    } ${className}`}
    onClick={() => field && onSort(field)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      {field && <SortIcon field={field} current={sortField} dir={sortDir} />}
    </span>
  </th>
);

// ─── Main Component ───────────────────────────────────────────────────────

const InvoiceListTable: React.FC<InvoiceListTableProps> = ({
  docs,
  sortField,
  sortDir,
  onSort,
  onView,
  onEdit,
  onDelete,
  onAdd,
}) => {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <FileText className="w-14 h-14 text-brand-text-secondary/20 mb-4" strokeWidth={1.5} />
        <p className="text-brand-text-secondary font-medium">Tidak ada dokumen ditemukan</p>
        <p className="text-xs text-brand-text-secondary/60 mt-1">Coba ubah filter atau kata kunci pencarian</p>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Invoice Baru</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card list ───────────────────────────────────────────── */}
      <div className="md:hidden divide-y divide-brand-border">
        {docs.map((doc) => (
          <div key={`${doc.kind}-${doc.id}`} className="p-3 hover:bg-[#F4F6F9]/50 transition-colors">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <KindBadge kind={doc.kind} />
                  <span className="text-[11px] font-mono text-[#5A6A85]">{doc.number}</span>
                </div>
                <p className="text-xs font-bold text-[#2A3547] truncate">{doc.clientName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-[#2A3547] tabular-nums">{formatCurrency(doc.amount)}</p>
                <div className="mt-0.5">
                  <StatusBadge status={doc.paymentStatus} />
                </div>
              </div>
            </div>

            <MobileExpandableExtra
              labelOpen="Lihat Detail & Aksi"
              labelClose="Ringkas"
              headerRight={
                <button
                  onClick={() => onView(doc)}
                  className="px-2 py-1 rounded-lg bg-[#ECF2FF] text-[#5D87FF] hover:bg-[#5D87FF] hover:text-white transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                  title="Lihat dokumen"
                >
                  <EyeIcon />
                  <span>Lihat</span>
                </button>
              }
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#5A6A85]">
                <div className="min-w-0">
                  {doc.projectName && (
                    <p className="truncate font-medium text-[#2A3547]">Acara: {doc.projectName}</p>
                  )}
                  <p className="text-[10px]">{formatDate(doc.date)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(doc)}
                      className="px-2 py-1 rounded-lg bg-[#FEF5E5] text-[#FFAE1F] hover:bg-[#FFAE1F] hover:text-white transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                      title="Edit dokumen"
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(doc)}
                    className="p-1.5 rounded-lg bg-[#FDEDE8] text-[#FA896B] hover:bg-[#FA896B] hover:text-white transition-all"
                    title="Hapus dokumen"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </MobileExpandableExtra>
          </div>
        ))}
      </div>

      {/* ── Desktop table ──────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-xs lg:text-sm text-left">
          <thead className="bg-brand-bg/60 border-b border-brand-border">
            <tr>
              <Th label="No. Dokumen" field="number" sortField={sortField} sortDir={sortDir} onSort={onSort} className="px-2 lg:px-4" />
              <Th label="Jenis" sortField={sortField} sortDir={sortDir} onSort={onSort} className="px-2 lg:px-4" />
              <Th label="Pengantin" field="clientName" sortField={sortField} sortDir={sortDir} onSort={onSort} className="px-2 lg:px-4" />
              <Th label="Acara" sortField={sortField} sortDir={sortDir} onSort={onSort} className="hidden lg:table-cell px-2 lg:px-4" />
              <Th label="Tanggal" field="date" sortField={sortField} sortDir={sortDir} onSort={onSort} className="px-2 lg:px-4" />
              <Th label="Jumlah" field="amount" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right px-2 lg:px-4" />
              <Th label="Status" sortField={sortField} sortDir={sortDir} onSort={onSort} className="px-2 lg:px-4" />
              <th className="px-2 lg:px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-brand-text-secondary">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {docs.map((doc, idx) => (
              <tr
                key={`${doc.kind}-${doc.id}`}
                className={`hover:bg-brand-bg/40 transition-colors ${
                  idx % 2 === 0 ? 'bg-brand-surface' : 'bg-brand-bg/20'
                }`}
              >
                {/* Number */}
                <td className="px-2 lg:px-4 py-3">
                  <span className="text-[10px] lg:text-xs font-mono font-bold text-brand-text-primary">{doc.number}</span>
                </td>

                {/* Kind */}
                <td className="px-2 lg:px-4 py-3">
                  <KindBadge kind={doc.kind} />
                </td>

                {/* Client */}
                <td className="px-2 lg:px-4 py-3">
                  <p className="font-semibold text-brand-text-primary max-w-[140px] lg:max-w-[180px] truncate">{doc.clientName}</p>
                </td>

                {/* Project */}
                <td className="px-2 lg:px-4 py-3 hidden lg:table-cell">
                  <p className="text-brand-text-secondary text-[10px] lg:text-xs max-w-[140px] lg:max-w-[180px] truncate">
                    {doc.projectName || '—'}
                  </p>
                </td>

                {/* Date */}
                <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-brand-text-secondary text-[10px] lg:text-xs">
                  {formatDate(doc.date)}
                </td>

                {/* Amount */}
                <td className="px-2 lg:px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-bold text-brand-text-primary">{formatCurrency(doc.amount)}</span>
                  {doc.kind === 'invoice' && doc.paidAmount < doc.amount && (
                    <p className="text-[9px] lg:text-[10px] text-orange-400 mt-0.5">
                      Sisa {formatCurrency(doc.amount - doc.paidAmount)}
                    </p>
                  )}
                </td>

                {/* Status */}
                <td className="px-2 lg:px-4 py-3">
                  <StatusBadge status={doc.paymentStatus} />
                </td>

                {/* Actions */}
                <td className="px-2 lg:px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(doc)}
                      className="p-1 lg:p-1.5 rounded-lg text-brand-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Lihat dokumen"
                    >
                      <EyeIcon />
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(doc)}
                        className="p-1 lg:p-1.5 rounded-lg text-brand-text-secondary hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                        title={
                          doc.kind === 'invoice' 
                            ? 'Edit invoice & rincian' 
                            : doc.kind === 'receipt' 
                            ? 'Edit tanda terima / transaksi'
                            : 'Aksi Slip Gaji tidak tersedia'
                        }
                      >
                        <EditIcon />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1 lg:p-1.5 rounded-lg text-brand-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Hapus dokumen"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InvoiceListTable;
