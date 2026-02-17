
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { ScanMode, ScanResult } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, XCircle, RefreshCw, Bus, Utensils, Wine } from 'lucide-react';

export const AdminScanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    setLastScan(null);
    setIsProcessing(false);
    
    // Give DOM time to render the div
    setTimeout(async () => {
        try {
            if (scannerRef.current) return; // Already running

            const html5QrCode = new Html5Qrcode(scannerRegionId);
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, 
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
            setErrorMsg("Error accediendo a la cámara. Asegúrate de estar en HTTPS.");
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
  };

  const handleScan = async (decodedText: string) => {
    // 1. Lock immediately
    if (scannerRef.current) {
        try { await scannerRef.current.pause(); } catch(e){}
    }
    setIsProcessing(true);

    try {
      // Parse QR
      let uuid = decodedText;
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.uuid) uuid = parsed.uuid;
      } catch (e) {
        // use raw text
      }

      // 2. Call API
      const result = await api.scanTicket(uuid, mode!);
      setLastScan(result);

    } catch (e) {
      setLastScan({ success: false, message: 'Error de Red / Servidor' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextScan = () => {
    setLastScan(null);
    setIsProcessing(false);
    if (scannerRef.current) {
      try { 
          scannerRef.current.resume(); 
      } catch(e) {
          // If resume fails, restart completely
          stopScanner().then(startScanner);
      }
    }
  };

  const exitScanner = async () => {
      await stopScanner();
      setMode(null);
  };

  // --- SCREEN 1: MODE SELECTION ---
  if (!mode) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center bg-slate-50">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Selecciona Modo</h2>
        
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => { setMode('BUS_IDA'); startScanner(); }} className="bg-blue-600 hover:bg-blue-700 h-24 text-lg flex-col justify-center border-b-4 border-blue-800">
                    <Bus size={28} className="mb-1" /> BUS IDA
                </Button>
                <Button onClick={() => { setMode('BUS_VUELTA'); startScanner(); }} className="bg-blue-500 hover:bg-blue-600 h-24 text-lg flex-col justify-center border-b-4 border-blue-800">
                    <Bus size={28} className="mb-1" /> BUS VUELTA
                </Button>
            </div>

            <Button onClick={() => { setMode('CENA'); startScanner(); }} className="bg-orange-600 hover:bg-orange-700 h-20 text-xl shadow-lg border-b-4 border-orange-800 w-full">
                <Utensils size={24} className="mr-3" /> Validar CENA
            </Button>
            
            <Button onClick={() => { setMode('BARRA'); startScanner(); }} className="bg-purple-600 hover:bg-purple-700 h-20 text-xl shadow-lg border-b-4 border-purple-800 w-full">
                <Wine size={24} className="mr-3" /> Validar COPA/BARRA
            </Button>
        </div>
        
        <Button variant="outline" className="mt-8" fullWidth onClick={onBack}>
          <ArrowLeft className="mr-2" size={20} /> Volver al Panel
        </Button>
      </div>
    );
  }

  // --- SCREEN 2: SCANNER ---
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-black/60 backdrop-blur-sm flex justify-between items-center border-b border-white/10">
        <div className="flex flex-col">
            <span className="text-xs text-slate-300 uppercase font-bold tracking-widest">Modo Activo</span>
            <span className="text-xl font-bold text-yellow-400 tracking-wide">{mode.replace('_', ' ')}</span>
        </div>
        <button onClick={exitScanner} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
            <XCircle size={28} />
        </button>
      </div>

      {/* Camera Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        
        {/* Error Msg */}
        {errorMsg && (
            <div className="z-20 p-6 text-center">
                <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                <p className="text-white mb-6 font-bold">{errorMsg}</p>
                <Button onClick={() => { stopScanner().then(startScanner); }} variant="secondary">Reintentar</Button>
            </div>
        )}

        {/* The Camera Div */}
        <div 
            id={scannerRegionId} 
            className={`w-full h-full object-cover ${lastScan ? 'opacity-0' : 'opacity-100'}`} // Hide camera when result is shown
        ></div>

        {/* Loading Spinner overlay */}
        {isProcessing && !lastScan && (
             <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
                 <div className="w-16 h-16 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin"></div>
             </div>
        )}

        {/* Result Overlay (Replaces Camera) */}
        {lastScan && (
          <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 ${lastScan.success ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="bg-white p-5 rounded-full mb-6 shadow-2xl scale-125">
                {lastScan.success ? <RefreshCw size={40} className="text-green-600" /> : <XCircle size={40} className="text-red-600" />}
            </div>
            
            <h1 className="text-5xl font-black mb-2 tracking-tighter text-white drop-shadow-md">
                {lastScan.success ? 'OK' : 'ERROR'}
            </h1>
            <p className="text-2xl text-center font-bold mb-8 text-white/90 uppercase tracking-wide">{lastScan.message}</p>
            
            {lastScan.ticket && (
               <div className="bg-black/20 backdrop-blur-md border border-white/10 p-6 rounded-xl w-full max-w-sm mb-8 shadow-xl">
                 <p className="text-xs text-white/60 uppercase font-bold mb-1">Titular de la Entrada</p>
                 <p className="text-2xl font-bold mb-4 text-white truncate">{lastScan.ticket.nombre_titular}</p>
                 
                 <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                    <div>
                        <p className="text-xs text-white/60 uppercase font-bold">Tipo</p>
                        <p className="font-mono text-lg">{lastScan.ticket.type}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/60 uppercase font-bold">Bus Contratado</p>
                        <p className="font-mono text-lg">{lastScan.ticket.tiene_bus ? 'SI' : 'NO'}</p>
                    </div>
                 </div>
               </div>
            )}
            
            <Button onClick={handleNextScan} className="w-full max-w-xs h-16 text-xl bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-2xl border-b-4 border-slate-300">
              Siguiente Entrada
            </Button>
          </div>
        )}
      </div>
      
      {/* Footer Hint */}
      {!lastScan && !errorMsg && (
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-black to-transparent">
            <p className="text-slate-400 text-sm animate-pulse">Enfoca el código QR</p>
        </div>
      )}
    </div>
  );
};
