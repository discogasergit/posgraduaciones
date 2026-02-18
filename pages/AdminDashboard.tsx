
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminStats, Graduate, Ticket } from '../types';
import { Button } from '../components/Button';
import { QrCode, TrendingUp, Users, Plus, RefreshCw, Mail, Beaker, Wifi, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  onScan: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onScan, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'LIST' | 'STATS' | 'DEBUG'>('LIST');
  
  // New Grad Form
  const [form, setForm] = useState({ dni: '', nombre: '', email: '', telefono: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Debug
  const [debugEmail, setDebugEmail] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, gradsData, ticketsData] = await Promise.all([
        api.getStats(),
        api.getGraduates(),
        api.getAllTickets()
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
        alert("Todos los campos obligatorios.");
        return;
    }

    setAddLoading(true);
    try {
      const res: any = await api.addGraduate(form);
      const pass = res?.password || '???';
      setForm({ dni: '', nombre: '', email: '', telefono: '' });
      await loadData();
      alert(`Graduado añadido. Pass: ${pass}`);
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

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Código copiado: " + text);
  };

  // Helper to find guests for a graduate
  const getGuestsForGrad = (gradId: string | number) => {
      // Robust comparison (handle string vs number id issues)
      return tickets.filter(t => 
          t.type === 'GUEST' && 
          String((t as any).inviter_id) === String(gradId)
      );
  };

  const inputClass = "border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none w-full";

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Panel de Control ADMIN</h2>
        <Button variant="outline" onClick={onLogout} className="text-sm px-3 py-1 h-auto">
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <Button 
            variant={view === 'LIST' ? 'primary' : 'outline'} 
            onClick={() => setView('LIST')}
            className={view === 'LIST' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <Users size={18} className="mr-2" /> Listado General
         </Button>
         <Button 
            variant={view === 'STATS' ? 'primary' : 'outline'} 
            onClick={() => setView('STATS')}
            className={view === 'STATS' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <TrendingUp size={18} className="mr-2" /> Estadísticas
         </Button>
         <Button 
            variant={view === 'DEBUG' ? 'primary' : 'outline'} 
            onClick={() => setView('DEBUG')}
            className={view === 'DEBUG' ? "bg-slate-800 hover:bg-slate-900" : ""}
          >
           <Beaker size={18} className="mr-2" /> Debug / Tests
         </Button>
         <Button 
            onClick={onScan}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
           <QrCode size={18} className="mr-2" /> IR AL ESCÁNER
         </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando datos...</div>
      ) : view === 'STATS' && stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-sm text-slate-500 uppercase font-bold">Recaudación</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total_recaudado.toFixed(2)}€</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-sm text-slate-500 uppercase font-bold">Asistencia Total</p>
            <p className="text-3xl font-bold text-slate-800">{stats.entradas_graduados + stats.entradas_invitados}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
            <p className="text-sm text-slate-500 uppercase font-bold">Total Bus</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total_bus}</p>
          </div>
        </div>
      ) : view === 'DEBUG' ? (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Mail size={20} className="mr-2 text-indigo-600" /> Probar Envío de Emails
                </h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setDebugLoading(true);
                    try { await api.debugTestEmail(debugEmail); alert('Enviado'); } 
                    catch { alert('Error'); } finally { setDebugLoading(false); }
                }} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="tu-email@ejemplo.com"
                        className={inputClass}
                        value={debugEmail}
                        onChange={(e) => setDebugEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" isLoading={debugLoading} fullWidth>Enviar Prueba</Button>
                </form>
            </div>
             <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Wifi size={20} className="mr-2 text-indigo-600" /> Diagnóstico de Red
                </h3>
                <Button variant="secondary" fullWidth onClick={async () => {
                     setDebugLoading(true);
                     try { const res = await api.debugCheckConnectivity(); alert(JSON.stringify(res,null,2)); } 
                     catch { alert("Error"); } finally { setDebugLoading(false); }
                }} isLoading={debugLoading}>
                    Chequear Conexión
                </Button>
            </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Add Form */}
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider border-b pb-2">Registrar Nuevo Graduado</h3>
            <form onSubmit={handleAddGraduate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div><input type="text" placeholder="DNI" className={inputClass} value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} required /></div>
              <div><input type="text" placeholder="Nombre" className={inputClass} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required /></div>
              <div><input type="email" placeholder="Email" className={inputClass} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
              <div><input type="tel" placeholder="Teléfono" className={inputClass} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
              <Button type="submit" isLoading={addLoading}><Plus size={16} className="mr-2"/> Añadir</Button>
            </form>
          </div>

          {/* MASTER LIST */}
          <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">Listado General de Asistentes</h3>
               <button onClick={loadData} className="text-slate-500 hover:text-indigo-600"><RefreshCw size={18}/></button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-slate-800">
                 <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider">
                   <tr>
                     <th className="p-4">Graduado</th>
                     <th className="p-4">Estado</th>
                     <th className="p-4">Código Invitación</th>
                     <th className="p-4">Invitados (Max 3)</th>
                     <th className="p-4 text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {graduates.map(grad => {
                     const myGuests = getGuestsForGrad(grad.id);
                     const guestCount = myGuests.length;
                     
                     return (
                     <tr key={grad.id} className="hover:bg-indigo-50 transition-colors group">
                       <td className="p-4">
                           <div className="font-bold text-indigo-900">{grad.nombre}</div>
                           <div className="font-mono text-xs text-slate-500">{grad.dni}</div>
                           <div className="text-xs text-slate-400">{grad.password}</div>
                       </td>
                       <td className="p-4">
                         {grad.pagado ? 
                           <span className="flex items-center text-green-700 font-bold text-xs"><CheckCircle size={14} className="mr-1"/> PAGADO</span> : 
                           <span className="flex items-center text-slate-400 font-bold text-xs"><AlertCircle size={14} className="mr-1"/> PENDIENTE</span>
                         }
                       </td>
                       <td className="p-4 font-mono text-xs">
                           {grad.codigo_invitacion ? (
                               <div className="flex items-center space-x-2">
                                   <span className="bg-slate-100 px-2 py-1 rounded border border-slate-300 select-all font-bold">
                                       {grad.codigo_invitacion}
                                   </span>
                                   <button 
                                      onClick={() => copyToClipboard(grad.codigo_invitacion!)}
                                      className="text-indigo-500 hover:text-indigo-700" title="Copiar código"
                                    >
                                       <Copy size={16} />
                                   </button>
                               </div>
                           ) : (
                               <span className="text-slate-300 italic">-</span>
                           )}
                       </td>
                       <td className="p-4">
                           {grad.pagado ? (
                               <div>
                                   <div className="flex items-center mb-1">
                                       <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${guestCount === 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                           {guestCount} / 3
                                       </span>
                                   </div>
                                   {guestCount > 0 && (
                                       <div className="flex flex-col space-y-1">
                                           {myGuests.map((t, idx) => (
                                               <span key={idx} className="text-xs text-slate-600 flex items-center">
                                                   <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></span>
                                                   {t.nombre_titular}
                                               </span>
                                           ))}
                                       </div>
                                   )}
                               </div>
                           ) : (
                               <span className="text-slate-300 text-xs">Requiere Pago</span>
                           )}
                       </td>
                       <td className="p-4 text-right">
                          {!grad.pagado && (
                              <button 
                                onClick={() => handleDeleteGraduate(grad.id)} 
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition"
                                title="Borrar Reserva"
                              >
                                  <Trash2 size={18} />
                              </button>
                          )}
                       </td>
                     </tr>
                   )})}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
