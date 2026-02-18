
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminStats, Graduate, Ticket } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, QrCode, TrendingUp, Users, Plus, RefreshCw, Mail, Beaker, Wifi, Ticket as TicketIcon, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  onScan: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onScan, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'STATS' | 'GRADUATES' | 'TICKETS' | 'DEBUG'>('STATS');
  
  // New Grad Form
  const [form, setForm] = useState({ dni: '', nombre: '', email: '', telefono: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Debug Email Form
  const [debugEmail, setDebugEmail] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, gradsData, ticketsData] = await Promise.all([
        api.getStats(),
        api.getGraduates(),
        api.getAllTickets() // Fetch Tickets
      ]);
      setStats(statsData);
      setGraduates(gradsData);
      setTickets(ticketsData);
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

  const handleDeleteGraduate = async (id: string | number) => {
      if(!confirm("¿Seguro que quieres borrar este registro PENDIENTE?")) return;
      try {
          await api.deleteGraduate(id);
          await loadData();
      } catch(e) {
          alert("Error al borrar");
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

  const handleCheckConnectivity = async () => {
    setDebugLoading(true);
    try {
        const res = await api.debugCheckConnectivity();
        alert("📊 Reporte de Red:\n\n" + JSON.stringify(res, null, 2));
    } catch (e) {
        alert("❌ Error contactando con el servidor");
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
         <Button 
            variant={view === 'STATS' ? 'primary' : 'outline'} 
            onClick={() => setView('STATS')}
            className={view === 'STATS' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <TrendingUp size={18} className="mr-2" /> Stats
         </Button>
         <Button 
            variant={view === 'GRADUATES' ? 'primary' : 'outline'} 
            onClick={() => setView('GRADUATES')}
            className={view === 'GRADUATES' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <Users size={18} className="mr-2" /> Graduados
         </Button>
         <Button 
            variant={view === 'TICKETS' ? 'primary' : 'outline'} 
            onClick={() => setView('TICKETS')}
            className={view === 'TICKETS' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <TicketIcon size={18} className="mr-2" /> Entradas
         </Button>
         <Button 
            variant={view === 'DEBUG' ? 'primary' : 'outline'} 
            onClick={() => setView('DEBUG')}
            className={view === 'DEBUG' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <Beaker size={18} className="mr-2" /> Debug
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
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Mail size={20} className="mr-2 text-indigo-600" /> Probar Envío de Emails
                </h3>
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
             <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Wifi size={20} className="mr-2 text-indigo-600" /> Diagnóstico de Red
                </h3>
                <Button variant="secondary" fullWidth onClick={handleCheckConnectivity} isLoading={debugLoading}>
                    Chequear Conexión con Gmail
                </Button>
            </div>
        </div>
      ) : view === 'TICKETS' ? (
         <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">Entradas Vendidas (Todos)</h3>
               <button onClick={loadData} className="text-slate-500 hover:text-indigo-600"><RefreshCw size={18}/></button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-slate-800">
                 <thead className="bg-slate-100 text-slate-700 font-bold">
                   <tr>
                     <th className="p-3">Titular</th>
                     <th className="p-3">Tipo</th>
                     <th className="p-3">Bus</th>
                     <th className="p-3">Cena</th>
                     <th className="p-3">UUID</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {tickets.map(t => (
                     <tr key={t.uuid} className="hover:bg-indigo-50">
                       <td className="p-3 font-bold">{t.nombre_titular}</td>
                       <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'GRADUATE' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                {t.type}
                            </span>
                       </td>
                       <td className="p-3">{t.tiene_bus ? '✅' : '❌'}</td>
                       <td className="p-3">{t.tiene_cena ? '✅' : '❌'}</td>
                       <td className="p-3 font-mono text-xs text-slate-400">{t.uuid.slice(0,8)}...</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
         </div>
      ) : (
        <div className="space-y-8">
          {/* Add Form */}
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-indigo-600" /> Alta Rápida
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
               <h3 className="font-bold text-slate-700">Lista Graduados ({graduates.length})</h3>
               <button onClick={loadData} className="text-slate-500 hover:text-indigo-600"><RefreshCw size={18}/></button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-slate-800">
                 <thead className="bg-slate-100 text-slate-700 font-bold">
                   <tr>
                     <th className="p-3">DNI</th>
                     <th className="p-3">Nombre</th>
                     <th className="p-3">Email</th>
                     <th className="p-3">Pass</th>
                     <th className="p-3">Estado</th>
                     <th className="p-3">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {graduates.map(grad => (
                     <tr key={grad.id} className="hover:bg-indigo-50 transition-colors">
                       <td className="p-3 font-mono font-medium">{grad.dni}</td>
                       <td className="p-3 font-medium">{grad.nombre}</td>
                       <td className="p-3 text-slate-600">{grad.email || '-'}</td>
                       <td className="p-3 text-slate-400 font-mono text-xs">{grad.password}</td>
                       <td className="p-3">
                         {grad.pagado ? 
                           <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200">PAGADO</span> : 
                           <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs border border-slate-200">PENDIENTE</span>
                         }
                       </td>
                       <td className="p-3 text-center">
                          {!grad.pagado && (
                              <button 
                                onClick={() => handleDeleteGraduate(grad.id)} 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                                title="Borrar Reserva Pendiente"
                              >
                                  <Trash2 size={16} />
                              </button>
                          )}
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
