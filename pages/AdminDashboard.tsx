
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminStats, Graduate } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, QrCode, TrendingUp, Users, Plus, RefreshCw, Mail, Beaker } from 'lucide-react';

interface AdminDashboardProps {
  onScan: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onScan, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'STATS' | 'GRADUATES' | 'DEBUG'>('STATS');
  
  // New Grad Form
  const [form, setForm] = useState({ dni: '', nombre: '', email: '', telefono: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Debug Email Form
  const [debugEmail, setDebugEmail] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, gradsData] = await Promise.all([
        api.getStats(),
        api.getGraduates()
      ]);
      setStats(statsData);
      setGraduates(gradsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddGraduate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dni || !form.nombre || !form.email) {
        alert("Todos los campos (DNI, Nombre, Email) son obligatorios para enviar la contraseña.");
        return;
    }

    setAddLoading(true);
    try {
      const res: any = await api.addGraduate(form);
      const pass = res?.password || '???';
      setForm({ dni: '', nombre: '', email: '', telefono: '' });
      await loadData();
      alert(`Graduado añadido. Contraseña generada: ${pass} (Enviada a ${form.email})`);
    } catch (e) {
      alert('Error añadiendo graduado');
    } finally {
      setAddLoading(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugLoading(true);
    try {
        await api.debugTestEmail(debugEmail);
        alert('✅ Email enviado correctamente. Revisa tu bandeja de entrada (y spam).');
    } catch (e) {
        alert('❌ Error enviando email. Revisa la consola del servidor.');
    } finally {
        setDebugLoading(false);
    }
  };

  const inputClass = "border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none w-full";

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Panel de Control ADMIN</h2>
        <Button variant="outline" onClick={onLogout} className="text-sm px-3 py-1 h-auto">
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <Button 
            variant={view === 'STATS' ? 'primary' : 'outline'} 
            onClick={() => setView('STATS')}
            className={view === 'STATS' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <TrendingUp size={18} className="mr-2" /> Estadísticas
         </Button>
         <Button 
            variant={view === 'GRADUATES' ? 'primary' : 'outline'} 
            onClick={() => setView('GRADUATES')}
            className={view === 'GRADUATES' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <Users size={18} className="mr-2" /> Graduados
         </Button>
         <Button 
            variant={view === 'DEBUG' ? 'primary' : 'outline'} 
            onClick={() => setView('DEBUG')}
            className={view === 'DEBUG' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <Beaker size={18} className="mr-2" /> Depuración
         </Button>
         <Button 
            onClick={onScan}
            className="bg-indigo-600 hover:bg-indigo-700 md:col-span-1"
          >
           <QrCode size={18} className="mr-2" /> ESCÁNER
         </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando datos...</div>
      ) : view === 'STATS' && stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-sm text-slate-500 uppercase font-bold">Recaudación Total</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total_recaudado.toFixed(2)}€</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-sm text-slate-500 uppercase font-bold">Entradas Vendidas</p>
            <p className="text-3xl font-bold text-slate-800">{stats.entradas_graduados + stats.entradas_invitados}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.entradas_graduados} Graduados / {stats.entradas_invitados} Invitados
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
            <p className="text-sm text-slate-500 uppercase font-bold">Plazas Autobús</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total_bus}</p>
          </div>
        </div>
      ) : view === 'DEBUG' ? (
        <div className="max-w-xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Mail size={20} className="mr-2 text-indigo-600" /> Probar Envío de Emails
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    Envía un correo de prueba para verificar que la configuración SMTP es correcta.
                </p>
                <form onSubmit={handleTestEmail} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="tu-email@ejemplo.com"
                        className={inputClass}
                        value={debugEmail}
                        onChange={(e) => setDebugEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" isLoading={debugLoading} fullWidth>
                        Enviar Correo de Prueba
                    </Button>
                </form>
            </div>
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                <p><strong>Nota:</strong> Si estás usando Gmail, asegúrate de haber generado una "Contraseña de Aplicación".</p>
            </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Add Form */}
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-indigo-600" /> Alta Rápida & Envío de Claves
            </h3>
            <form onSubmit={handleAddGraduate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                  <label className="text-xs font-bold text-slate-500">DNI</label>
                  <input 
                    type="text" className={inputClass}
                    value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} required
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500">Nombre</label>
                  <input 
                    type="text" className={inputClass}
                    value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500">Email</label>
                  <input 
                    type="email" className={inputClass}
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500">Teléfono</label>
                  <input 
                    type="tel" className={inputClass}
                    value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                  />
              </div>
              <Button type="submit" isLoading={addLoading}>
                  <Mail size={16} className="mr-2"/> Alta
              </Button>
            </form>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">Lista Completa ({graduates.length})</h3>
               <button onClick={loadData} className="text-slate-500 hover:text-indigo-600"><RefreshCw size={18}/></button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-slate-800">
                 <thead className="bg-slate-100 text-slate-700 font-bold">
                   <tr>
                     <th className="p-3 border-b border-slate-200">DNI</th>
                     <th className="p-3 border-b border-slate-200">Nombre</th>
                     <th className="p-3 border-b border-slate-200">Email</th>
                     <th className="p-3 border-b border-slate-200">Teléfono</th>
                     <th className="p-3 border-b border-slate-200">Pass (Autogen)</th>
                     <th className="p-3 border-b border-slate-200">Estado</th>
                     <th className="p-3 border-b border-slate-200">Cód. Invitación</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {graduates.length === 0 && (
                     <tr>
                       <td colSpan={7} className="p-8 text-center text-slate-400">
                         No hay graduados registrados.
                       </td>
                     </tr>
                   )}
                   {graduates.map(grad => (
                     <tr key={grad.id} className="hover:bg-indigo-50 transition-colors">
                       <td className="p-3 font-mono font-medium">{grad.dni}</td>
                       <td className="p-3 font-medium">{grad.nombre}</td>
                       <td className="p-3 text-slate-600">{grad.email || '-'}</td>
                       <td className="p-3 text-slate-600">{grad.telefono || '-'}</td>
                       <td className="p-3 text-slate-400 font-mono text-xs">{grad.password}</td>
                       <td className="p-3">
                         {grad.pagado ? 
                           <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200">PAGADO</span> : 
                           <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs border border-slate-200">PENDIENTE</span>
                         }
                       </td>
                       <td className="p-3 font-mono text-indigo-600 font-bold">
                         {grad.codigo_invitacion || '-'}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
