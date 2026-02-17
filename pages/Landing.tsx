import React from 'react';
import { User, Users, QrCode } from 'lucide-react';
import { Button } from '../components/Button';

interface LandingProps {
  onNavigate: (path: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center space-y-8 py-10">
      <div className="text-center space-y-4 px-4">
        <h2 className="text-3xl font-extrabold text-slate-800">Bienvenido a la Gala</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Gestiona tu entrada para la graduación de forma rápida y segura. Selecciona tu perfil para continuar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        {/* Card Graduado */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-50 flex flex-col items-center hover:border-indigo-200 transition-colors">
          <div className="p-4 bg-indigo-100 rounded-full mb-6">
            <User size={48} className="text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Soy Graduado</h3>
          <p className="text-center text-slate-500 mb-6 text-sm">
            Accede con tu DNI. Compra tu entrada y obtén tu código de invitación para amigos.
          </p>
          <Button fullWidth onClick={() => onNavigate('grad-login')}>
            Acceder
          </Button>
        </div>

        {/* Card Invitado */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-50 flex flex-col items-center hover:border-indigo-200 transition-colors">
          <div className="p-4 bg-yellow-100 rounded-full mb-6">
            <Users size={48} className="text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Soy Invitado</h3>
          <p className="text-center text-slate-500 mb-6 text-sm">
            ¿Tienes un código de invitación? Canjéalo aquí para comprar tu entrada.
          </p>
          <Button fullWidth variant="outline" onClick={() => onNavigate('guest-login')}>
            Tengo un código
          </Button>
        </div>
      </div>

      {/* Staff Access */}
      <div className="pt-10">
        <button 
          onClick={() => onNavigate('admin')}
          className="text-slate-400 text-sm flex items-center hover:text-indigo-600 transition-colors"
        >
          <QrCode size={16} className="mr-2" />
          Acceso Staff / Seguridad
        </button>
      </div>
    </div>
  );
};