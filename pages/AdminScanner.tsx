import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../services/api';
import { ScanMode, ScanResult } from '../types';
import { Button } from '../components/Button';

export const AdminScanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: 250 }, 
        /* verbose= */ false
      );
      
      scannerRef.current.render(onScanSuccess, (err) => { /* ignore errors */ });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.pause();
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
      scannerRef.current.resume();
    }
  };

  if (!mode) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Panel de Control</h2>
        <div className="grid grid-cols-1 gap-4">
          <Button onClick={() => { setMode('CENA'); setScanning(true); }} className="bg-orange-600 hover:bg-orange-700 h-20 text-xl">
            Validar CENA
          </Button>
          <Button onClick={() => { setMode('BARRA'); setScanning(true); }} className="bg-purple-600 hover:bg-purple-700 h-20 text-xl">
            Validar BARRA LIBRE
          </Button>
          <Button onClick={() => { setMode('BUS'); setScanning(true); }} className="bg-blue-600 hover:bg-blue-700 h-20 text-xl">
            Validar AUTOBÚS
          </Button>
        </div>
        <Button variant="outline" className="mt-8" fullWidth onClick={onBack}>Salir</Button>
      </div>
    );
  }

  return (
    <div className="p-4 h-screen flex flex-col bg-black text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Validando: <span className="text-yellow-400">{mode}</span></h3>
        <button onClick={() => { setScanning(false); setMode(null); }} className="text-sm underline">Cambiar</button>
      </div>

      {/* Result Overlay */}
      {lastScan ? (
        <div className={`flex-1 flex flex-col items-center justify-center rounded-xl p-6 ${lastScan.success ? 'bg-green-600' : 'bg-red-600'}`}>
          <h1 className="text-6xl font-black mb-4">{lastScan.success ? 'OK' : 'STOP'}</h1>
          <p className="text-2xl text-center font-bold mb-8">{lastScan.message}</p>
          {lastScan.ticket && (
             <div className="bg-white/20 p-4 rounded text-sm mb-4 w-full">
               <p>Titular: {lastScan.ticket.nombre_titular}</p>
               <p>Tipo: {lastScan.ticket.type}</p>
             </div>
          )}
          <Button onClick={resetScan} variant="secondary" className="w-full h-16 text-xl">
            Siguiente
          </Button>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl overflow-hidden relative">
          <div id="reader" className="w-full h-full"></div>
        </div>
      )}
    </div>
  );
};