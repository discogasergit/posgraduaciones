
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { ScanMode, ScanResult } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, XCircle, RefreshCw, Bus, Utensils, Wine, Keyboard, CheckCircle } from 'lucide-react';

export const AdminScanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scannedUUID, setScannedUUID] = useState<string>(''); // Debug info
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanLock = useRef(false); // CRITICAL: Strict physical lock for scanning
  const scannerRegionId = "html5qr-code-full-region";

  // Cleanup
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    setLastScan(null);
    setShowManual(false);
    setErrorMsg(null);
    setIsProcessing(false);
    scanLock.current = false; // Reset lock
    
    // Small delay to ensure DOM is ready
    setTimeout(async () => {
        try {
            if (scannerRef.current) return; 

            const html5QrCode = new Html5Qrcode(scannerRegionId);
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, 
                {
                    fps: 5, // Reduced FPS to prevent cpu overload and accidental double reads
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    handleScan(decodedText);
                },
                (errorMessage) => { /* ignore */ }
            );
        } catch (err) {
            console.error(err);
            setErrorMsg("No se pudo iniciar la cámara. Usa la entrada manual.");
        }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
        } catch (e) {
            // ignore stop errors
        }
        scannerRef.current = null;
    }
  };

  const handleScan = async (decodedText: string) => {
    // 1. PHYSICAL LOCK Check
    if (scanLock.current) return;
    scanLock.current = true; // Lock immediately

    // 2. Stop camera
    await stopScanner();
    
    setIsProcessing(true);
    setScannedUUID(decodedText);

    try {
      // Clean UUID
      let uuid = decodedText.trim();
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.uuid) uuid = parsed.uuid;
      } catch (e) {}

      // 3. Call API
      if (!mode) throw new Error("Modo perdido");
      
      const result = await api.scanTicket(uuid, mode);
      setLastScan(result);

    } catch (e) {
      setLastScan({ success: false, message: 'ERROR DE RED' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(manualInput.length < 4) return;
      handleScan(manualInput);
  };

  const handleNextScan = () => {
    setLastScan(null);
    startScanner();
  };

  const exitScanner = async () => {
      await stopScanner();
      setMode(null);
  };

  // --- SCREEN 1: MODE SELECTION ---
  if (!mode) {
    return (
      <div className="p-4 max-w-md mx-auto min-h-screen flex flex-col justify-center bg-slate-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Panel de Control</h2>
        
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => { setMode('BUS_IDA'); startScanner(); }} className="bg-blue-600 hover:bg-blue-700 h-24 flex-col border-b-4 border-blue-800">
                    <Bus size={32} className="mb-2" /> BUS IDA
                </Button>
                <Button onClick={() => { setMode('BUS_VUELTA'); startScanner(); }} className="bg-cyan-600 hover:bg-cyan-700 h-24 flex-col border-b-4 border-cyan-800">
                    <Bus size={32} className="mb-2" /> BUS VUELTA
                </Button>
            </div>

            <Button onClick={() => { setMode('CENA'); startScanner(); }} className="bg-orange-600 hover:bg-orange-700 h-20 text-xl border-b-4 border-orange-800 w-full">
                <Utensils size={24} className="mr-3" /> Validar CENA
            </Button>
            
            <Button onClick={() => { setMode('BARRA'); startScanner(); }} className="bg-purple-600 hover:bg-purple-700 h-20 text-xl border-b-4 border-purple-800 w-full">
                <Wine size={24} className="mr-3" /> Validar COPA
            </Button>
        </div>
        
        <Button variant="outline" className="mt-8 bg-white" fullWidth onClick={onBack}>
          <ArrowLeft className="mr-2" size={20} /> Volver al Dashboard
        </Button>
      </div>
    );
  }

  // --- SCREEN 3: RESULT ---
  if (lastScan) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${lastScan.success ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            <div className="bg-white p-6 rounded-full mb-6 shadow-2xl">
                {lastScan.success ? <CheckCircle size={64} className="text-green-600" /> : <XCircle size={64} className="text-red-600" />}
            </div>
            
            <h1 className="text-6xl font-black mb-4 tracking-tighter drop-shadow-md">
                {lastScan.success ? 'OK' : 'ERROR'}
            </h1>
            
            <div className="bg-black/30 px-6 py-4 rounded-xl mb-8 w-full text-center">
                <p className="text-3xl font-bold uppercase tracking-wide leading-tight">
                    {lastScan.message}
                </p>
            </div>
            
            {/* Ticket Info */}
            {lastScan.ticket ? (
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl w-full max-w-sm mb-8 shadow-xl">
                 <p className="text-xs text-white/70 uppercase font-bold mb-1">Titular</p>
                 <p className="text-2xl font-bold mb-4 truncate">{lastScan.ticket.nombre_titular}</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-white/70 uppercase font-bold">Tipo</p>
                        <p className="font-mono text-lg">{lastScan.ticket.type}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/70 uppercase font-bold">Bus</p>
                        <p className="font-mono text-lg">{lastScan.ticket.tiene_bus ? 'SI' : 'NO'}</p>
                    </div>
                 </div>
               </div>
            ) : (
                <div className="mb-8 text-center opacity-70 font-mono text-sm break-all max-w-xs bg-black/20 p-2 rounded">
                    Lectura: {scannedUUID}
                </div>
            )}
            
            <Button onClick={handleNextScan} className="w-full max-w-sm h-20 text-2xl bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-2xl border-b-8 border-slate-300 transform transition hover:-translate-y-1">
              ESCANEAR SIGUIENTE
            </Button>
        </div>
      );
  }

  // --- SCREEN 2: SCANNING / MANUAL ---
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-800 flex justify-between items-center shadow-md z-10">
        <div>
            <span className="text-xs text-slate-400 uppercase font-bold block">Modo Activo</span>
            <span className="text-xl font-bold text-yellow-400 tracking-wide">{mode.replace('_', ' ')}</span>
        </div>
        <button onClick={exitScanner} className="bg-slate-700 p-2 rounded-full hover:bg-slate-600">
            <XCircle size={24} />
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-black">
        
        {isProcessing && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-indigo-500 rounded-full animate-spin mb-4 mx-auto"></div>
                    <p className="font-bold text-xl">Verificando...</p>
                </div>
            </div>
        )}

        {showManual ? (
            <div className="w-full max-w-sm p-6">
                <h3 className="text-center text-xl font-bold mb-6">Entrada Manual</h3>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Escribe el código..." 
                        className="w-full p-4 text-black text-center text-xl rounded-lg outline-none border-4 border-indigo-500"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                    />
                    <Button type="submit" fullWidth className="h-16 text-lg">Validar Código</Button>
                    <Button variant="outline" fullWidth onClick={() => { setShowManual(false); startScanner(); }} className="text-white border-white hover:bg-white/10">
                        Cancelar
                    </Button>
                </form>
            </div>
        ) : (
            <>
                <div id={scannerRegionId} className="w-full h-full object-cover"></div>
                
                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center space-y-4 px-6">
                    <div className="bg-black/50 px-4 py-2 rounded-full text-sm animate-pulse">
                        Enfoca el código QR
                    </div>
                    <Button 
                        onClick={() => { stopScanner(); setShowManual(true); }} 
                        className="bg-white text-slate-900 hover:bg-slate-200 w-full max-w-xs shadow-xl"
                    >
                        <Keyboard size={20} className="mr-2" /> Introducir Manualmente
                    </Button>
                </div>
            </>
        )}

        {errorMsg && !showManual && (
            <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col items-center justify-center p-6">
                <XCircle size={48} className="text-red-500 mb-4" />
                <p className="text-center mb-6">{errorMsg}</p>
                <Button onClick={startScanner} variant="secondary">Reintentar Cámara</Button>
                <div className="mt-4"></div>
                <Button onClick={() => setShowManual(true)} variant="outline" className="text-white border-white">Usar Teclado</Button>
            </div>
        )}
      </div>
    </div>
  );
};
