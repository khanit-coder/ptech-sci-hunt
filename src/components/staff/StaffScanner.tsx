import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { 
  Camera, 
  QrCode, 
  Keyboard, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Flashlight, 
  FlashlightOff, 
  Image as ImageIcon, 
  FlipHorizontal, 
  HelpCircle, 
  CheckCircle2, 
  Upload 
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  isScanning: boolean;
  label?: string;
  subLabel?: string;
}

export const StaffScanner: React.FC<Props> = ({ 
  onScanSuccess, 
  isScanning, 
  label = 'สแกน QR CODE ไอเทม',
  subLabel = 'ใช้กล้องมือถือสแกน หรือถ่ายภาพ QR Code'
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      if (currentTime - lastKeyTime > 120) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && buffer.length >= 3) {
        if (navigator.vibrate) navigator.vibrate(80);
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

  // Clean unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const getOrCreateScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerContainerId, {
        verbose: false,
      });
    }
    return scannerRef.current;
  };

  const handleScanHit = async (decodedText: string) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 80]);
      } catch {
        // ignore
      }
    }
    soundManager.playClick();
    await stopCamera();
    onScanSuccess(decodedText.trim());
  };

  const startCamera = async (cameraConfig?: { deviceId?: string; facing?: 'environment' | 'user' }, retryCount = 0) => {
    soundManager.playClick();
    setErrorMsg(null);
    setShowPermissionHelp(false);

    try {
      // Stop & destroy existing scanner before creating new one
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(scannerContainerId, { verbose: false });
      scannerRef.current = scanner;

      // Check available cameras
      try {
        const devs = await Html5Qrcode.getCameras();
        if (devs && devs.length > 0) {
          setCameras(devs);
        }
      } catch {
        // ignore camera enum errors
      }

      const cameraConstraint = cameraConfig?.deviceId 
        ? { deviceId: { exact: cameraConfig.deviceId } }
        : { facingMode: cameraConfig?.facing || facingMode };

      await scanner.start(
        cameraConstraint,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(180, Math.floor(minEdge * 0.72));
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanHit(decodedText);
        },
        () => {
          // scanning frame tick
        }
      );

      setCameraActive(true);

      // Check torch capability
      try {
        const capabilities = scanner.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torchFeature) {
          setHasTorchCapability(true);
        } else {
          setHasTorchCapability(false);
        }
      } catch {
        setHasTorchCapability(false);
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      const errMsg = err?.toString?.() || '';

      if (errMsg.includes('NotReadableError') || errMsg.includes('Could not start video source')) {
        if (retryCount === 0) {
          // First retry: try the OPPOSITE facing (front vs back) — this fixes most NotReadableError cases
          const alternateFacing = (cameraConfig?.facing || facingMode) === 'environment' ? 'user' : 'environment';
          setFacingMode(alternateFacing);
          setErrorMsg('กำลังลองกล้องอีกตัว...');
          await new Promise(r => setTimeout(r, 800));
          return startCamera({ facing: alternateFacing }, 1);
        } else if (retryCount === 1) {
          // Second retry: wait and try again with same config
          setErrorMsg('กำลังลองเปิดกล้องใหม่...');
          await new Promise(r => setTimeout(r, 1500));
          return startCamera(cameraConfig, 2);
        }
        setErrorMsg(
          'กล้องถูกแอปอื่นใช้งานอยู่ — ปิด tab/แอปอื่น แล้วกด "เปิดกล้อง" หรือใช้ปุ่ม "ถ่ายรูป/อัปโหลด" แทน'
        );
      } else if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setErrorMsg('ไม่ได้รับสิทธิ์เข้าถึงกล้อง กรุณากดอนุญาตการใช้กล้องในเบราว์เซอร์');
        setShowPermissionHelp(true);
      } else if (errMsg.includes('NotFoundError')) {
        setErrorMsg('ไม่พบอุปกรณ์กล้องในเครื่องของคุณ');
      } else {
        setErrorMsg('ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่ หรือใช้วิธีถ่ายรูป/กรอกรหัส');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleCameraFacing = async () => {
    soundManager.playClick();
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameras.length > 1) {
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      await startCamera({ deviceId: cameras[nextIndex].id });
    } else {
      await startCamera({ facing: nextFacing });
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
      soundManager.playClick();
    } catch {
      // torch not supported on this device
    }
  };

  // Handle Photo / File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    setErrorMsg(null);

    try {
      const scanner = getOrCreateScanner();
      if (scanner.isScanning) {
        await scanner.stop();
        setCameraActive(false);
      }

      const decodedText = await scanner.scanFile(file, false);
      if (decodedText) {
        handleScanHit(decodedText);
      } else {
        setErrorMsg('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาถ่ายให้ชัดเจนอีกครั้ง');
      }
    } catch (err) {
      console.warn('Scan file error:', err);
      setErrorMsg('ไม่สามารถอ่าน QR Code จากรูปภาพนี้ได้ กรุณาถ่ายใหม่อีกครั้ง');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    soundManager.playClick();
    onScanSuccess(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="w-full bg-slate-900/95 border-2 border-mario-orange/40 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-mario-orange/20 border border-mario-orange/40 text-mario-orange">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
              {label}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {subLabel}
            </p>
          </div>
        </div>

        {/* Camera active status badge */}
        {cameraActive && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-[10px] font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        )}
      </div>

      {/* Camera Viewport Container */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center p-2 sm:p-4">
        
        {/* HTML5 QR Scanner DOM element */}
        <div 
          id={scannerContainerId} 
          className={`w-full max-w-sm rounded-xl overflow-hidden ${cameraActive ? 'block' : 'hidden'} [&_video]:rounded-xl [&_video]:object-cover [&_video]:w-full`} 
        />

        {/* Laser HUD overlay when camera active */}
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-mario-orange/70 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-mario-yellow rounded-tl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-mario-yellow rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-mario-yellow rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-mario-yellow rounded-br" />
              
              {/* Laser scanning line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-mario-red to-transparent shadow-[0_0_10px_#EA2027] absolute animate-bounce top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        {/* Inactive Camera State */}
        {!cameraActive && (
          <div className="flex flex-col items-center text-center p-4 sm:p-6 space-y-4 max-w-xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-mario-orange/10 border-2 border-mario-orange/30 flex items-center justify-center text-mario-orange shadow-neon-red/20">
              <Camera className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-100">
                พร้อมเปิดกล้องสแกน QR Code
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                รองรับกล้องโทรศัพท์มือถือทุกรุ่น หรือเลือกถ่ายภาพ QR Code
              </p>
            </div>

            <div className="flex flex-col w-full gap-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-mario-red via-mario-orange to-mario-yellow text-white font-black text-xs sm:text-sm shadow-neon-red hover:opacity-95 transition-all flex items-center justify-center gap-2 pixel-btn"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องมือถือสแกน</span>
              </button>

              {/* Photo Upload / Camera Capture button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingFile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-mario-yellow" />
                    <span>กำลังอ่านรูปภาพ...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-sci-cyan" />
                    <span>ถ่ายรูป / เลือกภาพ QR จากอัลบั้ม</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Active Camera Action Controls */}
        {cameraActive && (
          <div className="mt-3 flex items-center gap-2 z-10">
            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5 transition-all"
              title="สลับกล้องหน้า/หลัง"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-sci-cyan" />
              <span>สลับกล้อง</span>
            </button>

            {/* Torch Button */}
            {hasTorchCapability && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-neon-yellow'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title="เปิด/ปิดไฟฉาย"
              >
                {torchOn ? <Flashlight className="w-3.5 h-3.5 text-slate-950" /> : <FlashlightOff className="w-3.5 h-3.5 text-slate-400" />}
                <span>{torchOn ? 'ปิดไฟ' : 'เปิดไฟ'}</span>
              </button>
            )}

            {/* Stop Camera Button */}
            <button
              type="button"
              onClick={stopCamera}
              className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold hover:bg-red-900 transition-colors"
            >
              ปิดกล้อง
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 w-full p-3 rounded-xl bg-red-950/70 border border-red-700 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p>{errorMsg}</p>
              {showPermissionHelp && (
                <div className="mt-2 pt-2 border-t border-red-800/60 text-[11px] text-red-300 space-y-1">
                  <p className="font-bold">📱 วิธีเปิดสิทธิ์กล้องบนมือถือ:</p>
                  <p>• <strong>iPhone (Safari):</strong> ไปที่ การตั้งค่า &gt; Safari &gt; กล้อง &gt; เลือก อนุญาต</p>
                  <p>• <strong>Android (Chrome):</strong> แตะไอคอนแม่กุญแจ 🔒 ที่แถบ URL ด้านบน &gt; สิทธิ์ &gt; กล้อง &gt; อนุญาต</p>
                  <p>• หรือใช้ปุ่ม <strong>"ถ่ายรูป / เลือกภาพ QR จากอัลบั้ม"</strong> ด้านบนได้ทันที</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Image Capture / Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Manual Input Fallback */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-mario-yellow" />
              <span>หรือกรอกรหัส / Token ด้วยตนเอง:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">USB / Bluetooth Scanner OK</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="เช่น STAR-001 หรือ EXT-8819 หรือ Token"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-mario-orange"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-mario-orange hover:bg-mario-red text-white text-xs font-bold transition-all disabled:opacity-50 pixel-btn shrink-0"
            >
              ตรวจสอบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

