import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Item } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Layers, EyeOff, Eye } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Props {
  items: Item[];
  onClose: () => void;
}

export const QRGeneratorSheet: React.FC<Props> = ({ items, onClose }) => {
  // Mystery mode (default: true) hides item name, type and location, showing "ITEM ???" instead
  const [hideItemDetails, setHideItemDetails] = useState(true);

  // Chunk items into exact groups of 9 items per page (3 columns x 3 rows on A4)
  const itemsPerPage = 9;
  const pages: Item[][] = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  const modalContent = (
    <div 
      id="qr-portal-root" 
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-white overflow-y-auto print:bg-white print:text-black print:overflow-visible print:static print:inset-auto print:z-auto"
    >
      {/* Top Action Bar (Hidden completely on Print) */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 print:hidden no-print">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-mario-yellow" />
          <div>
            <h2 className="font-game text-xs text-mario-yellow">
              QR CODE PRINT SHEET (9 CARDS / A4 PORTRAIT)
            </h2>
            <p className="text-xs text-slate-400">
              ทั้งหมด {items.length} ชิ้น ({pages.length} แผ่น A4) • ขนาดพอดีกระดาษ A4 แนวตั้ง 3x3 ไม่ซ้อนทับ 100%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mystery Mode Toggle */}
          <button
            type="button"
            onClick={() => { soundManager.playClick(); setHideItemDetails(!hideItemDetails); }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              hideItemDetails 
                ? 'bg-purple-950 border-purple-600 text-purple-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="สลับโหมดปิดบังข้อมูล (ITEM ???)"
          >
            {hideItemDetails ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            <span>{hideItemDetails ? 'โหมดปริศนา: ITEM ??? (ซ่อนข้อมูล)' : 'แสดงข้อมูลไอเทมจริง'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white text-xs font-black shadow-neon-red flex items-center gap-1.5 pixel-btn"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ (Print A4)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pages Container - Exact A4 Dimensions */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {pages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-sheet-container bg-white text-slate-950 p-4 rounded-2xl mb-8 shadow-xl print:shadow-none print:rounded-none print:p-0 print:m-0"
            style={{
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIndex < pages.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* Screen Header Indicator */}
            <div className="text-xs text-slate-500 font-mono mb-3 pb-2 border-b border-slate-200 flex justify-between items-center print:hidden">
              <span className="font-bold text-red-600">แผ่นที่ {pageIndex + 1} จาก {pages.length} (9 ชิ้นต่อแผ่น A4 แนวตั้ง)</span>
              <span className="text-slate-700 font-bold">
                {hideItemDetails ? '🔒 โหมดปริศนา (ซ่อนข้อมูลไอเทม)' : '📋 โหมดแสดงข้อมูลเต็ม'}
              </span>
            </div>

            {/* 3x3 Grid of 9 Cards */}
            <div className="grid-3x3-a4">
              {pageItems.map((item, itemIdx) => {
                const globalIndex = pageIndex * itemsPerPage + itemIdx + 1;

                return (
                  <div key={item.id} className="qr-card-a4">
                    
                    {/* Top Header Badge */}
                    <div className="qr-card-header">
                      <span className="qr-card-tag">PTECH-SCI 2026</span>
                      <span className="qr-card-code">
                        {hideItemDetails ? `ITEM ???` : item.item_code}
                      </span>
                    </div>

                    {/* Item Name / Mystery Title */}
                    <div className="qr-card-title-box">
                      <h3 className="qr-card-title">
                        {hideItemDetails ? `SECRET ITEM #${String(globalIndex).padStart(2, '0')}` : item.name}
                      </h3>
                    </div>

                    {/* QR Code SVG - Enlarged for easy scanning */}
                    <div className="qr-card-qr-box">
                      <QRCodeSVG
                        value={item.qr_token}
                        size={104}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Location / Mission Instructions */}
                    <div className="qr-card-location">
                      {hideItemDetails ? (
                        <span>🎯 สแกนเช็คอินที่ PTECH Dome</span>
                      ) : (
                        <span>📍 {item.location_hint || 'พื้นที่จัดกิจกรรม'}</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
