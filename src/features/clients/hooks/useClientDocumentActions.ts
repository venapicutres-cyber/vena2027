import React, { useState } from 'react';
import { Client, Project, Transaction, Profile, TeamPaymentRecord } from '../../../types';
import {
    generateInvoiceWhatsAppMessage,
    generateReceiptWhatsAppMessage
} from '../utils/clientWhatsAppTemplates';
import { toPublicNameSlug } from '../../../utils/publicRouting';

export type DocumentToView =
    | { type: 'invoice'; project: Project }
    | { type: 'receipt'; transaction: Transaction }
    | { type: 'slip-gaji'; teamPaymentRecord: TeamPaymentRecord };

interface UseClientDocumentActionsParams {
    documentToView: DocumentToView | null;
    clientForDetail: Client | null;
    userProfile: Profile;
    projects: Project[];
    showNotification: (msg: string) => void;
    onSignInvoice: (projectId: string, signatureDataUrl: string) => void;
    onSignTransaction: (transactionId: string, signatureDataUrl: string) => void;
    onRemoveInvoiceSignature?: (projectId: string) => void;
    onRemoveTransactionSignature?: (transactionId: string) => void;
    setSharePreview: (val: { title: string; message: string; phone?: string } | null) => void;
}

export const useClientDocumentActions = ({
    documentToView,
    clientForDetail,
    userProfile,
    projects,
    showNotification,
    onSignInvoice,
    onSignTransaction,
    onRemoveInvoiceSignature,
    onRemoveTransactionSignature,
    setSharePreview,
}: UseClientDocumentActionsParams) => {
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    const handleSaveSignature = (signatureDataUrl: string) => {
        if (documentToView?.type === 'invoice' && documentToView.project) {
            onSignInvoice(documentToView.project.id, signatureDataUrl);
        } else if (documentToView?.type === 'receipt' && documentToView.transaction) {
            onSignTransaction(documentToView.transaction.id, signatureDataUrl);
        }
        setIsSignatureModalOpen(false);
    };

    const handleRemoveSignature = () => {
        if (documentToView?.type === 'invoice' && documentToView.project) {
            onRemoveInvoiceSignature?.(documentToView.project.id);
        } else if (documentToView?.type === 'receipt' && documentToView.transaction) {
            onRemoveTransactionSignature?.(documentToView.transaction.id);
        }
    };

    const getPdfOptions = (elementId: string, filename: string) => ({
        margin: [6, 8, 6, 8] as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 1400,
            onclone: (clonedDoc: any) => {
                const el = clonedDoc.getElementById(elementId);
                if (el) {
                    el.style.width = '100%';
                    el.style.maxWidth = '100%';
                    el.style.minWidth = '0';
                    el.style.margin = '0';
                    el.style.boxSizing = 'border-box';
                    el.style.boxShadow = 'none';
                    el.style.border = 'none';
                    el.classList.add('force-desktop');
                }
                const container = clonedDoc.querySelector('.html2pdf__container');
                if (container) {
                    container.style.boxSizing = 'border-box';
                    container.style.overflow = 'visible';
                }
                // Bersihkan div liar dalam tbody agar tabel tidak rusak
                const padDivs = clonedDoc.querySelectorAll('tbody > div');
                padDivs.forEach((div: HTMLElement) => {
                    const tr = clonedDoc.createElement('tr');
                    tr.className = 'html2pdf-pad-row';
                    tr.style.border = 'none';
                    tr.style.background = 'transparent';
                    const td = clonedDoc.createElement('td');
                    td.colSpan = 10;
                    td.style.height = div.style.height || `${div.offsetHeight}px`;
                    td.style.border = 'none';
                    td.style.padding = '0';
                    td.style.margin = '0';
                    td.style.background = 'transparent';
                    tr.appendChild(td);
                    if (div.parentNode) {
                        div.parentNode.replaceChild(tr, div);
                    }
                });
            }
        },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.avoid-break'] },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    });

    const handleShareDocumentWA = async () => {
        if (!documentToView || !clientForDetail) return;

        const phone = clientForDetail.whatsapp || clientForDetail.phone;
        const companyName = userProfile?.companyName || 'Weddfinter';

        if (documentToView.type === 'invoice') {
            const proj = documentToView.project;

            // 1. Auto-generate & download PDF in background
            const elementId = 'invoice-document';
            const element = document.getElementById(elementId);
            if (element) {
                const opt = getPdfOptions(elementId, `Invoice-${proj.projectName.replace(/\s+/g, '_')}.pdf`);
                const html2pdf = (await import('html2pdf.js')).default;
                html2pdf().from(element).set(opt).save();
            }

            // 2. Build public invoice link
            const basePath = window.location.pathname.replace(/index\.html$/, '');
            const publicInvoiceUrl = `${window.location.origin}${basePath}#/portal/invoice/${toPublicNameSlug(proj.projectName)}`;

            // 3. Build WhatsApp template with PDF link
            const text = generateInvoiceWhatsAppMessage(clientForDetail.name, companyName, proj, publicInvoiceUrl);

            setSharePreview({
                title: `Bagikan Invoice - ${proj.projectName}`,
                message: text,
                phone,
            });
        } else if (documentToView.type === 'receipt') {
            const tx = documentToView.transaction;

            // 1. Auto-generate & download PDF in background
            const elementId = 'receipt-document';
            const element = document.getElementById(elementId);
            if (element) {
                const opt = getPdfOptions(elementId, `Tanda_Terima-${tx.id.slice(0, 8)}.pdf`);
                const html2pdf = (await import('html2pdf.js')).default;
                html2pdf().from(element).set(opt).save();
            }

            // 2. Build public receipt link
            const basePath = window.location.pathname.replace(/index\.html$/, '');
            const publicReceiptUrl = `${window.location.origin}${basePath}#/portal/receipt/${tx.id}`;

            const projName = tx.projectId ? projects.find(p => p.id === tx.projectId)?.projectName || '' : '';
            const text = generateReceiptWhatsAppMessage(clientForDetail.name, companyName, tx, projName, publicReceiptUrl);

            setSharePreview({
                title: `Bagikan Tanda Terima - ${tx.id.slice(0, 8).toUpperCase()}`,
                message: text,
                phone,
            });
        }
    };

    const handleDownloadPDF = async () => {
        if (!documentToView) return;

        const elementId = documentToView.type === 'invoice'
            ? 'invoice-document'
            : documentToView.type === 'receipt'
                ? 'receipt-document'
                : `payment-slip-content-${documentToView.teamPaymentRecord.id}`;
        const element = document.getElementById(elementId);

        if (!element) {
            showNotification('Gagal menemukan elemen dokumen untuk diunduh.');
            return;
        }

        const filename = documentToView.type === 'invoice'
            ? `Invoice-${documentToView.project.projectName.replace(/[\\/:*?"<>|\s]+/g, '_')}.pdf`
            : documentToView.type === 'receipt'
                ? `Tanda_Terima-${documentToView.transaction.id.slice(0, 8)}.pdf`
                : `Slip-Gaji-${(documentToView.teamPaymentRecord.recordNumber || documentToView.teamPaymentRecord.id.slice(0, 8)).replace(/[\\/:*?"<>|\s]+/g, '_')}.pdf`;

        try {
            const opt = getPdfOptions(elementId, filename);
            const html2pdfModule: any = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default || html2pdfModule;
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('[ClientDocumentActions] PDF download failed:', error);
            showNotification('Gagal membuat PDF. Membuka dialog cetak sebagai alternatif.');
            window.print();
        }
    };

    return {
        isSignatureModalOpen,
        setIsSignatureModalOpen,
        handleSaveSignature,
        handleRemoveSignature,
        handleShareDocumentWA,
        handleDownloadPDF,
    };
};
