
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { api } from '../services/api';
import { ScanMode, ScanResult } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Camera, XCircle, RefreshCw } from 'lucide-react';

export const AdminScanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "html5qr-code-full-region";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setErrorMsg(null);
    setScanning(true);
    
    // Give React a moment to render the div
    setTimeout(async () => {
        try {
            if (scannerRef.current) {
                // Already running
                return;
            }

            const html5QrCode = new Html5Qrcode(scannerRegionId);
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, // Back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    handleScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore frame parse errors
                }
            );
        } catch (err) {
            console.error(err);
            setScanning(false);
            setErrorMsg("No se pudo acceder a la cámara. Asegúrate de dar permisos y estar en HTTPS.");
        }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
        } catch (e) {
            console.error("Error stopping scanner", e);
        }
        scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (decodedText: string) => {
    // Pause immediately to prevent multiple scans
    if (scannerRef.current) {
        try { await scannerRef.current.pause(); } catch(e){}
    }
    
    try {
      // Assuming QR contains JSON { uuid: "..." }
      let uuid = decodedText;
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.uuid) uuid = parsed.uuid;
      } catch (e) {
        // use raw text if not json
      }

      const result = await api.scanTicket(uuid, mode!);
      setLastScan(result);
    } catch (e) {
      setLastScan({ success: false, message: 'Error de Red' });
    }
  };

  const resetScan = () => {
    setLastScan(null);
    if (scannerRef.current) {
      try { scannerRef.current.resume(); } catch(e) {
          // If resume fails (e.g. was stopped), restart
          stopScanner().then(startScanner);
      }
    }
  };

  const exitScanner = async () => {
      await stopScanner();
      setMode(null);
  };

  // 1. Mode Selection Screen
  if (!mode) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-8 text-center text-slate-800">Selecciona Modo de Escaneo</h2>
        <div className="grid grid-cols-1 gap-4">
          <Button onClick={() => { setMode('CENA'); startScanner(); }} className="bg-orange-600 hover:bg-orange-700 h-20 text-xl shadow-lg border-b-4 border-orange-800">
            Validar CENA
          </Button>
          <Button onClick={() => { setMode('BARRA'); startScanner(); }} className="bg-purple-600 hover:bg-purple-700 h-20 text-xl shadow-lg border-b-4 border-purple-800">
            Validar BARRA LIBRE
          </Button>
          <Button onClick={() => { setMode('BUS'); startScanner(); }} className="bg-blue-600 hover:bg-blue-700 h-20 text-xl shadow-lg border-b-4 border-blue-800">
            Validar AUTOBÚS
          </Button>
        </div>
        <Button variant="outline" className="mt-8" fullWidth onClick={onBack}>
          <ArrowLeft className="mr-2" size={20} /> Volver al Panel
        </Button>
      </div>
    );
  }

  // 2. Scanner / Result Screen
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
        <div className="flex flex-col">
            <span className="text-xs text-slate-300 uppercase font-bold">Modo Activo</span>
            <span className="text-xl font-bold text-yellow-400 tracking-wide">{mode}</span>
        </div>
        <button onClick={exitScanner} className="bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm">
            <XCircle size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        
        {/* Error State */}
        {errorMsg && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900">
                <XCircle size={48} className="text-red-500 mb-4" />
                <p className="text-center text-white mb-6">{errorMsg}</p>
                <Button onClick={() => { stopScanner().then(startScanner); }} variant="secondary">
                    Reintentar
                </Button>
            </div>
        )}

        {/* Camera Container */}
        {!lastScan && (
            <div id={scannerRegionId} className="w-full max-w-md overflow-hidden rounded-xl border-2 border-slate-700" style={{ minHeight: '300px' }}></div>
        )}
        
        {/* Helper Text */}
        {!lastScan && !errorMsg && (
             <div className="absolute bottom-10 left-0 right-0 text-center text-slate-400 text-sm animate-pulse px-4">
                Apunta al código QR de la entrada
             </div>
        )}

        {/* Result Overlay */}
        {lastScan && (
          <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 ${lastScan.success ? 'bg-green-600' : 'bg-red-600'} animate-in fade-in zoom-in duration-200`}>
            <div className="bg-white p-4 rounded-full mb-6 shadow-xl">
                {lastScan.success ? <RefreshCw size={48} className="text-green-600" /> : <XCircle size={48} className="text-red-600" />}
            </div>
            
            <h1 className="text-5xl font-black mb-2 tracking-tighter shadow-black drop-shadow-lg">
                {lastScan.success ? 'ACCESO OK' : 'DENEGADO'}
            </h1>
            <p className="text-2xl text-center font-bold mb-8 opacity-90">{lastScan.message}</p>
            
            {lastScan.ticket && (
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl text-left w-full max-w-sm mb-8 shadow-xl">
                 <p className="text-sm text-white/60 uppercase font-bold mb-1">Titular</p>
                 <p className="text-xl font-bold mb-4">{lastScan.ticket.nombre_titular}</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-white/60 uppercase font-bold">Tipo</p>
                        <p className="font-mono">{lastScan.ticket.type}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/60 uppercase font-bold">Cena</p>
                        <p className="font-mono">{lastScan.ticket.tiene_cena ? 'SI' : 'NO'}</p>
                    </div>
                 </div>
               </div>
            )}
            
            <Button onClick={resetScan} className="w-full max-w-sm h-16 text-xl bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-xl border-b-4 border-slate-300">
              Escanear Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
