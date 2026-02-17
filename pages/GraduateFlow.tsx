import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Graduate } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, CheckCircle, Ticket as TicketIcon, Users } from 'lucide-react';
import { USE_MOCK_API } from '../constants';

interface GraduateFlowProps {
  onBack: () => void;
  onProceedToCheckout: (grad: Graduate) => void;
  onViewTicket: (data: any) => void;
}

export const GraduateFlow: React.FC<GraduateFlowProps> = ({ onBack, onProceedToCheckout, onViewTicket }) => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graduate, setGraduate] = useState<Graduate | null>(null);
  const [guests, setGuests] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Now checks password too
      const result = await api.checkGraduate(dni, password);
      if (result) {
        setGraduate(result);
        if (result.pagado) {
             loadGuests(result.id);
        }
      } else {
        setError('Credenciales incorrectas o usuario no encontrado.');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const loadGuests = async (id: string | number) => {
      try {
          const guestNames = await api.getGraduateGuests(id);
          setGuests(guestNames);
      } catch (e) { console.error(e); }
  };

  // If logged in and already paid
  if (graduate?.pagado) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-6">
         <div className="flex items-center text-green-600 space-x-2">
            <CheckCircle size={32} />
            <h2 className="text-2xl font-bold">Entrada ya adquirida</h2>
         </div>
         <p className="text-slate-600">
           Hola <strong>{graduate.nombre}</strong>, tu entrada está confirmada.
         </p>
         
         <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 text-center">
            <p className="text-sm text-indigo-800 uppercase font-semibold mb-2">Tu Código de Invitación</p>
            <div className="text-3xl font-mono font-bold tracking-widest text-indigo-900 select-all">
              {graduate.codigo_invitacion}
            </div>
            <p className="text-xs text-indigo-600 mt-2">Comparte este código con hasta 3 amigos.</p>
         </div>

         {/* Guest List */}
         {guests.length > 0 && (
             <div className="bg-slate-50 p-4 rounded-lg">
                 <h4 className="flex items-center text-sm font-bold text-slate-700 mb-3">
                     <Users size={16} className="mr-2"/> Amigos que han usado tu código:
                 </h4>
                 <ul className="text-sm space-y-1">
                     {guests.map((name, i) => (
                         <li key={i} className="flex items-center text-slate-600">
                             <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span> {name}
                         </li>
                     ))}
                 </ul>
             </div>
         )}

         <Button fullWidth onClick={() => onViewTicket({ uuid: 'DEMO-UUID', graduate })}>
            <TicketIcon size={20} className="mr-2" />
            Ver mi Entrada QR
         </Button>
         <Button fullWidth variant="outline" onClick={onBack}>Cerrar Sesión</Button>
      </div>
    );
  }

  // If logged in but pending payment
  if (graduate && !graduate.pagado) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Hola, {graduate.nombre}</h2>
        <p className="text-slate-600">
          Para generar tu QR y obtener tu código de invitación para amigos, debes abonar la entrada.
        </p>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <ul className="space-y-2 text-sm text-yellow-900">
            <li className="flex justify-between font-bold">
              <span>Cena + Barra Libre</span>
              <span>85.00€</span>
            </li>
            <li className="text-xs text-yellow-700">Incluye acceso prioritario y sorpresas.</li>
          </ul>
        </div>
        
        <Button fullWidth onClick={() => onProceedToCheckout(graduate)}>
          Continuar al Pago
        </Button>
        <button onClick={() => setGraduate(null)} className="text-sm text-slate-400 w-full text-center hover:underline">
          No soy {graduate.nombre}
        </button>
      </div>
    );
  }

  // Login Form
  return (
    <div className="max-w-md mx-auto px-4 w-full">
      <button onClick={onBack} className="flex items-center text-slate-500 mb-6 hover:text-indigo-600">
        <ArrowLeft size={20} className="mr-1" /> Volver
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Acceso Graduados</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">DNI / NIE</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 uppercase placeholder-slate-400"
              placeholder="12345678X"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder-slate-400"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={loading}>
            Verificar y Entrar
          </Button>

          {USE_MOCK_API && (
            <div className="text-xs text-center text-slate-400 mt-4">
              <p>Si no tienes datos, pide a un Delegado que te registre.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};