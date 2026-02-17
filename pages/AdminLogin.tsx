import React, { useState } from 'react';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { Lock, ArrowLeft } from 'lucide-react';
import { USE_MOCK_API } from '../constants';

interface AdminLoginProps {
  onLogin: (role: 'ADMIN' | 'DELEGATE') => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.loginStaff(password);
      if (res.role) {
        onLogin(res.role);
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 mt-10">
      <button onClick={onBack} className="flex items-center text-slate-500 mb-6 hover:text-indigo-600">
        <ArrowLeft size={20} className="mr-1" /> Volver
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-100 rounded-full">
            <Lock size={32} className="text-slate-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Acceso Staff / Delegados</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Código de Acceso</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 outline-none bg-white text-slate-900 placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
          )}

          <Button fullWidth type="submit" isLoading={loading} className="bg-slate-800 hover:bg-slate-900">
            Entrar
          </Button>

          {USE_MOCK_API && (
            <div className="text-xs text-center text-slate-400 mt-2">
              <p>Demo Admin: <strong>ADMIN2026</strong></p>
              <p>Demo Delegado: <strong>DELEGADO2026</strong></p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};