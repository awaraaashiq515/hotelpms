"use client";

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Printer, Download, X, Smartphone } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: string;
    name: string;
    qrToken?: string | null;
  } | null;
  property: {
    name: string;
    code: string;
  } | null;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, table, property }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!table || !property) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${baseUrl}/menu/${property.code}/${table.qrToken || table.id}`;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${table.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .qr-card { border: 2px solid #e2e8f0; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            h1 { margin-top: 20px; font-size: 32px; font-weight: 900; color: #1e293b; }
            p { color: #64748b; font-size: 18px; margin-bottom: 30px; font-weight: 600; }
            .footer { margin-top: 30px; font-size: 14px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <h1>${property.name}</h1>
            <p>Scan to view Menu & Order</p>
            ${printContent.innerHTML}
            <h1>${table.name}</h1>
            <div class="footer">Powered by OrderMint POS</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const svg = document.getElementById('table-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 100;
      canvas.height = img.height + 150;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(table.name, canvas.width / 2, canvas.height - 40);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${table.name}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Table QR Code">
      <div className="flex flex-col items-center py-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 mb-8" ref={printRef}>
          <QRCodeSVG 
            id="table-qr-svg"
            value={qrUrl} 
            size={240}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-gray-900">{table.name}</h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Scan to open menu</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-pos-primary bg-pos-primary/5 px-4 py-2 rounded-full border border-pos-primary/10">
            <Smartphone size={14} />
            <span className="truncate max-w-[200px]">{qrUrl}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Button 
            variant="secondary" 
            className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest gap-2"
            onClick={handleDownload}
          >
            <Download size={18} />
            Download
          </Button>
          <Button 
            className="rounded-2xl h-14 bg-pos-primary hover:bg-pos-primary-dark text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-pos-primary/20"
            onClick={handlePrint}
          >
            <Printer size={18} />
            Print QR
          </Button>
        </div>
      </div>
    </Modal>
  );
};
