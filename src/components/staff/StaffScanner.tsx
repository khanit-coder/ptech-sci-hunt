import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Camera, QrCode, Keyboard, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  isScanning: boolean;
  label?: string;
}

export const StaffScanner: React.FC<Props> = ({ onScanSuccess, isScanning, label = 'SCAN ITEM QR CODE' }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5qr-code-scanner-element';

  // Listen to external USB/Bluetooth Barcode/QR Keyboard Scanners
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into an active form input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && buffer.length >= 4) {
        soundManager.playClick();
        onScanSuccess(buffer.trim());
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScanSuccess]);

  const startCamera = async () => {
    soundManager.playClick();
    setErrorMsg(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          soundManager.playClick();
          stopCamera();
          onScanSuccess(decodedText);
        },
        () => {
          // ignore scan errors
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setErrorMsg('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้อง หรือกรอกรหัสด้วยตนเอง');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    soundManager.playClick();
    onScanSuccess(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="w-full bg-slate-900/90 border border-mario-orange/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-mario-orange" />
          <h2 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
            {label}
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">STEP 1 / 3</span>
      </div>

      {/* Camera Video Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center p-4">
        
        <div id={scannerContainerId} className={`w-full max-w-sm rounded-xl overflow-hidden ${cameraActive ? 'block' : 'hidden'}`} />

        {!cameraActive && (
          <div className="flex flex-col items-center text-center p-6 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-mario-orange/10 border border-mario-orange/30 flex items-center justify-center text-mario-orange shadow-neon-red/20 animate-pulse">
              <Camera className="w-10 h-10" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200">
                พร้อมสแกน QR Code จากไอเทม
              </p>
              <p className="text-xs text-slate-400 mt-1">
                กดปุ่มด้านล่างเพื่อเปิดกล้อง หรือใช้เครื่องสแกนบาร์โค้ด USB/Bluetooth
              </p>
            </div>

            <button
              type="button"
              onClick={startCamera}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-mario-red via-mario-orange to-mario-yellow text-white font-bold text-sm shadow-neon-red hover:opacity-95 transition-all flex items-center gap-2 pixel-btn"
            >
              <Camera className="w-4 h-4" />
              <span>เปิดกล้องมือถือสแกน</span>
            </button>
          </div>
        )}

        {cameraActive && (
          <button
            type="button"
            onClick={stopCamera}
            className="mt-4 px-4 py-2 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold hover:bg-red-900 transition-colors"
          >
            ปิดกล้อง
          </button>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-700 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-mario-yellow" />
            <span>หรือกรอกรหัสไอเทม / Token ด้วยตนเอง (กรณีกล้องขัดข้อง):</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="เช่น STAR-001 หรือ tok_star_alpha_99182a"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-mario-orange"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-mario-orange hover:bg-mario-red text-white text-xs font-bold transition-all disabled:opacity-50 pixel-btn"
            >
              ตรวจสอบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
