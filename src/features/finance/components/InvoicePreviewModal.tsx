import React from 'react';
import Modal from '../../../shared/ui/Modal';
import InvoiceDocument from './InvoiceDocument';
import { Profile, PaymentStatus } from '../../../types';
import { InvoiceFormData } from '../types/invoiceForm';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  Info,
  CreditCard,
  FileCheck,
} from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmFinalize?: () => void;
  isSubmitting?: boolean;
  formData: InvoiceFormData;
  profile?: Profile;
  isEditMode?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmFinalize,
  isSubmitting = false,
  formData,
  profile,
  isEditMode = false,
}) => {
  const companyName = profile?.companyName || 'Weddfin';
  const companyAddress = profile?.address || 'Jl. Fotografi Studio No. 1, Jakarta';
  const companyPhone = profile?.phone || profile?.email || '';
  const companyEmail = profile?.email || '';
  const authorizedSigner = profile?.authorizedSigner || profile?.fullName || companyName;
  const bankInfo = profile?.bankAccount || 'BCA 1234567890 a/n Studio';

  const effectiveNumber =
    formData.invoiceNumber ||
    `DRAFT-${formData.invoiceDate ? formData.invoiceDate.replace(/-/g, '') : 'INV'}-${Math.floor(1000 + Math.random() * 9000)}`;

  const effectiveTitle =
    formData.title ||
    `Dokumentasi ${formData.projectType || 'Wedding'} - ${formData.clientName || 'Pengantin'}`;

  const balanceDue = Math.max(0, formData.grandTotal - (formData.amountPaid || 0));

  const handlePrint = () => {
    const el = document.getElementById('invoice-printable-doc');
    if (!el) { window.print(); return; }
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { window.print(); return; }
    const invoiceTitle = el.querySelector('h1,h2,[class*="invoice"]')?.textContent || 'Invoice';
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>${invoiceTitle}</title><style>* { box-sizing: border-box; } body { margin: 0; padding: 0; font-family: Inter, Arial, sans-serif; background: #fff; color: #000; } @media print { body { margin: 0; } @page { margin: 12mm; size: A4; } } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #000; padding: 6px 10px; text-align: left; vertical-align: top; word-break: break-word; } th { background: #f8fafc; font-weight: 700; } .text-right { text-align: right !important; } .text-center { text-align: center !important; } img { max-width: 100%; height: auto; }</style></head><body>${el.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const getStatusBadge = () => {
    if (formData.paymentStatus === PaymentStatus.LUNAS) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
          Lunas
        </span>
      );
    }
    if (formData.paymentStatus === PaymentStatus.DP_TERBAYAR) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300 uppercase tracking-wider">
          DP Terbayar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
        Belum Bayar
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Dokumen Invoice (Read-Only)"
      size="4xl"
    >
      <div className="space-y-4">
        {/* Banner Notice */}
        <div className="flex items-center justify-between gap-3 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-500" />
            <span>
              <strong>Mode Pratinjau:</strong> Periksa tampilan invoice ini sebelum difinalisasi. Data belum disimpan sampai Anda mengonfirmasi.
            </span>
          </div>
          <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300">
            DRAF INVOICE
          </span>
        </div>

        {/* Printable Invoice Document Canvas */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div
            id="invoice-printable-doc"
            className="invoice-container invoice-document-mobile bg-white text-slate-900 w-full p-2.5 sm:p-8 font-sans"
          >
            <style>
              {`
                #invoice-printable-doc.invoice-container { overflow: visible !important; font-family: 'Inter', sans-serif !important; }
                #invoice-printable-doc table { border-collapse: collapse !important; border: 1.5px solid #000000 !important; table-layout: fixed !important; width: 100% !important; page-break-inside: auto !important; break-inside: auto !important; }
                #invoice-printable-doc thead { display: table-header-group !important; page-break-inside: avoid !important; break-inside: avoid !important; }
                #invoice-printable-doc tbody { page-break-inside: auto !important; break-inside: auto !important; }
                #invoice-printable-doc tbody tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                #invoice-printable-doc th, #invoice-printable-doc td, #invoice-printable-doc td p { white-space: normal !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; vertical-align: top !important; color: #000000 !important; }
                #invoice-printable-doc th { border: 1px solid #000000 !important; border-top: none !important; border-bottom: 1.5px solid #000000 !important; background-color: #f8fafc !important; padding: 7px 10px !important; color: #000000 !important; vertical-align: top !important; }
                #invoice-printable-doc td { border: 1px solid #000000 !important; padding: 6px 10px !important; padding-top: 6px !important; vertical-align: top !important; line-height: 1.15 !important; }
                #invoice-printable-doc td p { margin: 0 !important; padding: 0 !important; line-height: 1.15 !important; }
                @media (max-width: 768px) {
                  #invoice-printable-doc { font-size: 7.5px !important; padding: 10px 12px !important; overflow: hidden !important; }
                  #invoice-printable-doc h1 { font-size: 14px !important; line-height: 1.1 !important; }
                  #invoice-printable-doc h2 { font-size: 11px !important; line-height: 1.2 !important; }
                  #invoice-printable-doc p, #invoice-printable-doc span { font-size: 7px !important; line-height: 1.3 !important; }
                  #invoice-printable-doc .invoice-preview-logo { display: block !important; height: 32px !important; max-height: 32px !important; width: auto !important; max-width: 120px !important; object-fit: contain !important; }
                  #invoice-printable-doc .invoice-preview-signature { display: block !important; height: 32px !important; max-height: 32px !important; width: auto !important; max-width: 100% !important; object-fit: contain !important; }
                  #invoice-printable-doc .grid-cols-2 { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
                  #invoice-printable-doc th, #invoice-printable-doc td { font-size: 7px !important; padding: 3.5px 5px !important; line-height: 1.25 !important; }
                  #invoice-printable-doc th { white-space: nowrap !important; }
                  #invoice-printable-doc td.text-right { white-space: nowrap !important; }
                }
                @media (max-width: 640px) {
                  #invoice-printable-doc .py-6 { overflow-x: auto !important; display: block !important; }
                  #invoice-printable-doc table { min-width: 480px !important; }
                  #invoice-printable-doc .grid { grid-template-columns: 1fr !important; gap: 8px !important; }
                }
              `}
            </style>
            {/* Header Section */}
            <div className="flex flex-row justify-between items-start gap-2.5 sm:gap-6 border-b-2 border-slate-100 pb-3 sm:pb-6">
              {/* Vendor Branding */}
              <div className="space-y-1 sm:space-y-2 flex-1 min-w-0 pr-1">
                {profile?.logoBase64 ? (
                  <img
                    src={profile.logoBase64}
                    alt={companyName}
                    className="invoice-preview-logo h-9 sm:h-16 w-auto max-w-[130px] sm:max-w-[220px] object-contain object-left block shrink-0"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-md sm:rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs sm:text-xl shadow-sm shrink-0">
                      {companyName.charAt(0) || 'V'}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-xl font-black tracking-tight text-slate-900 leading-tight truncate">
                        {companyName}
                      </h2>
                      <p className="text-[7px] sm:text-[11px] text-slate-500 font-medium">Professional Photography & Cinema</p>
                    </div>
                  </div>
                )}

                <div className="text-[7.5px] sm:text-xs text-slate-500 leading-snug sm:leading-relaxed pt-0.5 sm:pt-1 space-y-0.5 break-words">
                  <p className="font-semibold text-slate-700">{companyName}</p>
                  {companyAddress && <p>{companyAddress}</p>}
                  {(companyPhone || companyEmail) && (
                    <p className="break-words">
                      {companyPhone} {companyPhone && companyEmail && '•'} {companyEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Tag & Meta */}
              <div className="text-right space-y-1 sm:space-y-2 shrink-0 flex flex-col items-end">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  INVOICE
                </h1>
                <div className="flex justify-end">
                  {getStatusBadge()}
                </div>
                <div className="text-xs space-y-1 text-slate-600 pt-1">
                  <p>
                    <span className="text-slate-400 font-medium">No. Dokumen: </span>
                    <span className="font-mono font-bold text-slate-900">{effectiveNumber}</span>
                  </p>
                  <p>
                    <span className="text-slate-400 font-medium">Tanggal Invoice: </span>
                    <span className="font-semibold text-slate-800">{formatDate(formData.invoiceDate)}</span>
                  </p>
                  <p>
                    <span className="text-slate-400 font-medium">Jatuh Tempo / Acara: </span>
                    <span className="font-semibold text-slate-800">{formatDate(formData.eventDate || formData.invoiceDate)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Client & Project Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100">
              {/* Bill To */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ditagihkan Kepada (Pengantin):
                </span>
                <p className="text-base font-bold text-slate-900">{formData.clientName || 'Nama Pengantin Belum Diisi'}</p>
                <div className="text-xs text-slate-600 space-y-1">
                  {formData.clientPhone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formData.clientPhone}</span>
                    </p>
                  )}
                  {formData.clientEmail && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formData.clientEmail}</span>
                    </p>
                  )}
                  {formData.clientAddress && (
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{formData.clientAddress}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Project / Event Info */}
              <div className="space-y-2 text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Informasi Layanan / Acara:
                </span>
                <p className="text-base font-bold text-slate-900">{effectiveTitle}</p>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <span className="text-slate-400">Kategori: </span>
                    <span className="font-semibold text-slate-800">{formData.projectType || 'Wedding'}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Tanggal Pelaksanaan: </span>
                    <span className="font-semibold text-slate-800">{formatDate(formData.eventDate)}</span>
                  </p>
                  {(formData.location || formData.address) && (
                    <p>
                      <span className="text-slate-400">Lokasi: </span>
                      <span className="font-semibold text-slate-800">
                        {[formData.location, formData.address].filter(Boolean).join(', ')}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="w-full text-xs border border-black">
                <thead>
                  <tr className="border-b border-black bg-slate-50 text-black">
                    <th className="py-3 px-3 text-center font-bold w-12 uppercase tracking-wider border-r border-black">#</th>
                    <th className="py-3 px-4 text-left font-bold uppercase tracking-wider border-r border-black">Deskripsi Layanan / Item</th>
                    <th className="py-3 px-3 text-center font-bold w-20 uppercase tracking-wider border-r border-black">Qty</th>
                    <th className="py-3 px-4 text-right font-bold w-32 uppercase tracking-wider border-r border-black">Harga Satuan</th>
                    <th className="py-3 px-4 text-right font-bold w-36 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {formData.lineItems && formData.lineItems.length > 0 ? (
                    formData.lineItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-800 border-r border-black">{idx + 1}</td>
                        <td className="py-3.5 px-4 border-r border-black">
                          <p className="font-bold text-slate-900">{item.description || 'Layanan Fotografi'}</p>
                          {item.packageDetails && item.packageDetails.length > 0 ? (
                            <ul className="mt-1 space-y-0.5">
                              {item.packageDetails.map((detail, i) => (
                                <li key={i} className="flex items-start gap-1 text-[10px] text-slate-500 leading-snug">
                                  <span className="shrink-0 mt-0.5">-</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">Item rincian paket resmi</p>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-medium text-slate-800 border-r border-black">{item.quantity || 1}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800 border-r border-black">
                          {formatCurrency(item.unitPrice || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(item.totalPrice || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        Belum ada rincian item layanan
                      </td>
                    </tr>
                  )}

                  {formData.transportCost > 0 && (
                    <tr className="bg-slate-50/40">
                      <td className="py-3 px-3 text-center font-semibold text-slate-800 border-r border-black">
                        {(formData.lineItems?.length || 0) + 1}
                      </td>
                      <td className="py-3 px-4 border-r border-black">
                        <p className="font-bold text-slate-900">Biaya Transportasi & Logistik Operasional</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Akomodasi dan transportasi kru ke lokasi acara</p>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-800 border-r border-black">1</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800 border-r border-black">
                        {formatCurrency(formData.transportCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(formData.transportCost)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown & Bank Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span>Instruksi Pembayaran & Rekening Bank</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg p-2.5">
                    {bankInfo}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Harap sertakan nomor invoice pada berita transfer dan kirimkan bukti konfirmasi pembayaran melalui WhatsApp admin.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Subtotal Rincian Item:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(formData.subtotal - (formData.transportCost || 0))}
                  </span>
                </div>
                {formData.transportCost > 0 && (
                  <div className="flex justify-between py-1.5 px-2 text-slate-600">
                    <span>Biaya Transportasi:</span>
                    <span className="font-semibold text-slate-900">
                      +{formatCurrency(formData.transportCost)}
                    </span>
                  </div>
                )}
                {formData.discountAmount > 0 && (
                  <div className="flex justify-between py-1.5 px-2 text-emerald-600 font-semibold">
                    <span>Diskon Potongan:</span>
                    <span>-{formatCurrency(formData.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t-2 border-slate-200 pt-2 flex justify-between items-center px-2">
                  <span className="text-sm font-black text-slate-900 uppercase">Grand Total:</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(formData.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 px-2">
                  <span className="text-slate-600">Sudah Dibayar (DP / Titipan):</span>
                  <span className="font-bold text-[#166534]">{formatCurrency(formData.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between py-2 px-2.5 rounded-lg bg-slate-100 font-bold border border-slate-200">
                  <span className="text-slate-800">Sisa Tagihan (Balance Due):</span>
                  <span className={balanceDue > 0 ? 'text-[#DC2626] font-black text-sm' : 'text-[#166534] font-black text-sm'}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-100 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-8">Penerima / Pengantin,</p>
                <div className="h-10 border-b border-slate-300 w-40" />
                <p className="mt-1 font-bold text-slate-800">{formData.clientName || 'Pengantin'}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Hormat Kami,</p>
                <div className="h-10 sm:h-16 w-full flex items-center justify-end">
                  {profile?.signatureBase64 ? (
                    <img
                      src={profile.signatureBase64}
                      alt="Tanda Tangan"
                      className="invoice-preview-signature h-9 sm:h-16 w-auto max-w-full object-contain block"
                    />
                  ) : (
                    <div className="h-px w-20 sm:w-36 bg-slate-300 my-auto" />
                  )}
                </div>
                <p className="font-bold text-slate-800 underline underline-offset-2">{authorizedSigner}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{companyName}</p>
              </div>
            </div>
          </div>
        </div>



        {/* Modal Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-3 border-t border-brand-border">
          <button
            type="button"
            onClick={handlePrint}
            className="button-secondary w-full sm:w-auto px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Print</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary w-full sm:w-auto px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali & Edit Form</span>
            </button>

            {onConfirmFinalize && (
              <button
                type="button"
                onClick={onConfirmFinalize}
                disabled={isSubmitting}
                className="button-primary w-full sm:w-auto px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : isEditMode
                    ? 'Konfirmasi & Simpan Perubahan'
                    : 'Finalisasi & Buat Invoice'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;
