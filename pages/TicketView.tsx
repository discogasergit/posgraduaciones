import React from 'react';
import QRCode from 'react-qr-code';
import { Ticket } from '../types';
import { Button } from '../components/Button';
import { Download } from 'lucide-react';

interface TicketViewProps {
  ticket: Ticket;
  onHome: () => void;
}

export const TicketView: React.FC<TicketViewProps> = ({ ticket, onHome }) => {
  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border-t-8 border-indigo-600 relative overflow-hidden">
        {/* Punch hole visual effect */}
        <div className="absolute -left-3 top-1/3 w-6 h-6 bg-[#f8fafc] rounded-full"></div>
        <div className="absolute -right-3 top-1/3 w-6 h-6 bg-[#f8fafc] rounded-full"></div>

        <div className="text-center mb-6">
          <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Entrada Oficial</h2>
          <h1 className="text-2xl font-extrabold text-slate-800 mt-1">Graduación 2026</h1>
          <p className="text-indigo-600 font-semibold mt-2">{ticket.nombre_titular}</p>
        </div>

        <div className="flex justify-center mb-6 p-4 bg-white rounded-xl">
          <QRCode 
            value={JSON.stringify({ uuid: ticket.uuid })} 
            size={200}
            level="H"
          />
        </div>

        <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Tipo:</span>
            <span className="font-bold text-slate-800">{ticket.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cena:</span>
            <span className={`font-bold ${ticket.tiene_cena ? 'text-green-600' : 'text-slate-300'}`}>
              {ticket.tiene_cena ? 'INCLUIDA' : 'NO INCLUIDA'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Autobús:</span>
            <span className={`font-bold ${ticket.tiene_bus ? 'text-green-600' : 'text-slate-300'}`}>
              {ticket.tiene_bus ? 'INCLUIDO' : 'NO INCLUIDO'}
            </span>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          UUID: {ticket.uuid.substring(0, 8)}...
        </div>
      </div>

      <div className="mt-8 space-y-3 w-full max-w-sm">
        <Button fullWidth variant="secondary" onClick={() => window.print()}>
          <Download size={18} className="mr-2" /> Guardar / Imprimir
        </Button>
        <Button fullWidth variant="outline" onClick={onHome}>
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};