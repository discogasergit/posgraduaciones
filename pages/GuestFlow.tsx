import React, { useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { ArrowLeft, Utensils, Wine } from 'lucide-react';
import { PRICES, USE_MOCK_API, MOCK_GRADUATES } from '../constants';

interface GuestFlowProps {
  onBack: () => void;
  onProceedToCheckout: (guestData: any) => void;
}

export const GuestFlow: React.FC<GuestFlowProps> = ({ onBack, onProceedToCheckout }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'CODE' | 'OPTIONS'>('CODE');
  const [inviterId, setInviterId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [option, setOption] = useState<'FULL' | 'PARTY'>('FULL');

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.checkInvitationCode(code);
      if (res.valid) {
        setInviterId(res.graduateId!);
        setStep('OPTIONS');
      } else {
        setError('Código inválido o aforo de invitados completo para este graduado.');
      }
    } catch (err) {
      setError('Error al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!name.trim()) {
      setError('Por favor, introduce tu nombre completo.');
      return;
    }
    onProceedToCheckout({
      inviterId,
      name,
      basePrice: option === 'FULL' ? PRICES.GUEST_FULL : PRICES.GUEST_PARTY,
      type: 'GUEST'
    });
  };

  if (step === 'OPTIONS') {
    return (
      <div className="max-w-lg mx-auto px-4 w-full">
        <button onClick={() => setStep('CODE')} className="flex items-center text-slate-500 mb-6 hover:text-indigo-600">
          <ArrowLeft size={20} className="mr-1" /> Cambiar código
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Datos del Invitado</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 uppercase bg-white text-slate-900 placeholder-slate-400"
              placeholder="Nombre y Apellidos"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Selecciona tu entrada</label>
            
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${option === 'FULL' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
              onClick={() => setOption('FULL')}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-4 ${option === 'FULL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Utensils size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Cena + Barra Libre</h4>
                  <p className="text-xs text-slate-500">Experiencia completa</p>
                </div>
              </div>
              <span className="font-bold text-lg">{PRICES.GUEST_FULL}€</span>
            </div>

            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${option === 'PARTY' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
              onClick={() => setOption('PARTY')}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-4 ${option === 'PARTY' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Wine size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Solo Barra Libre</h4>
                  <p className="text-xs text-slate-500">Acceso después de cena</p>
                </div>
              </div>
              <span className="font-bold text-lg">{PRICES.GUEST_PARTY}€</span>
            </div>
          </div>
          
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button fullWidth onClick={handleContinue}>
            Continuar al Pago
          </Button>
        </div>
      </div>
    );
  }

  // Helper logic to find a valid code to show in demo
  // Safely check if MOCK_GRADUATES exists and has items
  const demoCode = (MOCK_GRADUATES && MOCK_GRADUATES.length > 0 && MOCK_GRADUATES.find((g: any) => g.codigo_invitacion))
      ? MOCK_GRADUATES.find((g: any) => g.codigo_invitacion)?.codigo_invitacion
      : "Registra y paga un graduado primero";

  return (
    <div className="max-w-md mx-auto px-4 w-full">
      <button onClick={onBack} className="flex items-center text-slate-500 mb-6 hover:text-indigo-600">
        <ArrowLeft size={20} className="mr-1" /> Volver
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Acceso Invitados</h2>
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Código de Invitación</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase tracking-wider font-mono text-center bg-white text-slate-900 placeholder-slate-400"
              placeholder="CODIGO123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-2">Pídele el código al graduado que te invita.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={loading}>
            Verificar Código
          </Button>
          
          {USE_MOCK_API && (
            <div className="text-xs text-center text-slate-400 mt-4 bg-slate-50 p-2 rounded">
              <p className="font-bold">MODO DEMO ACTIVO</p>
              <p>Prueba con Código: <strong>{demoCode}</strong></p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};