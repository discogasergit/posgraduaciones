
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminStats, Graduate, Ticket } from '../types';
import { Button } from '../components/Button';
import { 
    QrCode, TrendingUp, Users, Plus, RefreshCw, Mail, Beaker, Wifi, 
    Trash2, Copy, CheckCircle, AlertCircle, ChevronDown, ChevronUp, 
    Bus, Utensils, Wine
} from 'lucide-react';

interface AdminDashboardProps {
  onScan: () => void;
  onLogout: () => void;
}

// Component outside to prevent re-renders
const StatsBar = ({ label, value, max, colorClass }: { label: string, value: number, max: number, colorClass: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1 font-bold text-slate-600">
                <span>{label}</span>
                <span>{value} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onScan, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'LIST' | 'STATS' | 'DEBUG'>('LIST');
  const [expandedGradId, setExpandedGradId] = useState<string | number | null>(null);
  
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

  const toggleExpand = (id: string | number) => {
      setExpandedGradId(expandedGradId === id ? null : id);
  };

  // Helper to find tickets associated with a graduate
  const getTicketsForGrad = (gradId: string | number) => {
      // 1. Get Guest Tickets invited by this ID
      const guestTickets = tickets.filter(t => 
          t.type === 'GUEST' && 
          String((t as any).inviter_id) === String(gradId)
      );
      
      // 2. Get Graduate's own ticket (usually by checking if inviter_id matches self, or implicitly if not stored)
      const ownTicket = tickets.find(t => 
          t.type === 'GRADUATE' && 
          String((t as any).inviter_id) === String(gradId)
      );

      return { ownTicket, guestTickets };
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
        <div className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                    <p className="text-sm text-slate-500 uppercase font-bold">Recaudación</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total_recaudado.toFixed(2)}€</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                    <p className="text-sm text-slate-500 uppercase font-bold">Asistencia Total</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total_asistentes}</p>
                    <p className="text-xs text-slate-400 mt-1">{stats.entradas_graduados} Graduados + {stats.entradas_invitados} Invitados</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
                    <p className="text-sm text-slate-500 uppercase font-bold">Autobuses</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total_bus} <span className="text-sm font-normal text-slate-400">plazas</span></p>
                </div>
            </div>

            {/* Detailed Graphs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Desglose de Entradas</h3>
                    {stats.desglose_tipos && (
                        <>
                            <StatsBar 
                                label="Cena + Barra Libre" 
                                value={stats.desglose_tipos.cena_y_barra} 
                                max={stats.total_asistentes} 
                                colorClass="bg-indigo-600" 
                            />
                            <StatsBar 
                                label="Solo Barra Libre (Fiesta)" 
                                value={stats.desglose_tipos.solo_barra} 
                                max={stats.total_asistentes} 
                                colorClass="bg-purple-500" 
                            />
                        </>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">Logística</h3>
                    <StatsBar 
                        label="Uso de Autobús" 
                        value={stats.total_bus} 
                        max={stats.total_asistentes} 
                        colorClass="bg-yellow-500" 
                    />
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                        <p><strong>Nota:</strong> Estos datos se basan en las entradas vendidas. La asistencia real se calcula con el escáner.</p>
                    </div>
                </div>
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
             <div>
               <table className="w-full text-sm text-left text-slate-800">
                 <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider">
                   <tr>
                     <th className="p-4 w-10"></th>
                     <th className="p-4">Graduado</th>
                     <th className="p-4">Estado</th>
                     <th className="p-4">Código</th>
                     <th className="p-4">Invitados</th>
                     <th className="p-4 text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {graduates.map(grad => {
                     const { ownTicket, guestTickets } = getTicketsForGrad(grad.id);
                     const guestCount = guestTickets.length;
                     const isExpanded = expandedGradId === grad.id;
                     
                     return (
                     <React.Fragment key={grad.id}>
                         <tr className={`transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50'}`} onClick={() => toggleExpand(grad.id)}>
                           <td className="p-4 text-center">
                               {isExpanded ? <ChevronUp size={16} className="text-indigo-600"/> : <ChevronDown size={16} className="text-slate-400"/>}
                           </td>
                           <td className="p-4">
                               <div className="font-bold text-indigo-900">{grad.nombre}</div>
                               <div className="font-mono text-xs text-slate-500">{grad.dni}</div>
                           </td>
                           <td className="p-4">
                             {grad.pagado ? 
                               <span className="flex items-center text-green-700 font-bold text-xs"><CheckCircle size={14} className="mr-1"/> PAGADO</span> : 
                               <span className="flex items-center text-slate-400 font-bold text-xs"><AlertCircle size={14} className="mr-1"/> PENDIENTE</span>
                             }
                           </td>
                           <td className="p-4 font-mono text-xs">
                               {grad.codigo_invitacion ? (
                                   <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                       <span className="bg-white px-2 py-1 rounded border border-slate-300 select-all font-bold">
                                           {grad.codigo_invitacion}
                                       </span>
                                       <button onClick={() => copyToClipboard(grad.codigo_invitacion!)} className="text-indigo-500 hover:text-indigo-700">
                                           <Copy size={16} />
                                       </button>
                                   </div>
                               ) : '-'}
                           </td>
                           <td className="p-4">
                               {grad.pagado ? (
                                   <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${guestCount === 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                       {guestCount} / 3
                                   </span>
                               ) : '-'}
                           </td>
                           <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              {!grad.pagado && (
                                  <button onClick={() => handleDeleteGraduate(grad.id)} className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50">
                                      <Trash2 size={18} />
                                  </button>
                              )}
                           </td>
                         </tr>
                         
                         {/* EXPANDED ROW */}
                         {isExpanded && (
                             <tr className="bg-indigo-50">
                                 <td colSpan={6} className="p-4 border-b border-indigo-100">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                                         {/* Contact Details */}
                                         <div className="space-y-2 text-sm text-slate-700">
                                             <h4 className="font-bold text-indigo-900 mb-2 border-b border-indigo-200 pb-1">Datos de Contacto</h4>
                                             <p><Mail size={14} className="inline mr-2 text-slate-400"/> {grad.email || 'Sin email'}</p>
                                             <p><Wifi size={14} className="inline mr-2 text-slate-400"/> {grad.telefono || 'Sin teléfono'}</p>
                                             <p><QrCode size={14} className="inline mr-2 text-slate-400"/> Pass: <span className="font-mono">{grad.password}</span></p>
                                         </div>

                                         {/* Tickets Details */}
                                         <div>
                                             <h4 className="font-bold text-indigo-900 mb-2 border-b border-indigo-200 pb-1 text-sm">Entradas Adquiridas</h4>
                                             <div className="space-y-2">
                                                 {/* Own Ticket */}
                                                 {ownTicket && (
                                                     <div className="bg-white p-2 rounded border border-indigo-100 shadow-sm flex justify-between items-center">
                                                         <div>
                                                             <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-1 rounded mr-2">GRAD</span>
                                                             <span className="text-sm font-medium">{ownTicket.nombre_titular}</span>
                                                         </div>
                                                         <div className="flex space-x-2">
                                                             {ownTicket.tiene_bus && <span title="Bus"><Bus size={16} className="text-yellow-600" /></span>}
                                                             {ownTicket.tiene_cena && <span title="Cena"><Utensils size={16} className="text-green-600" /></span>}
                                                             {ownTicket.tiene_barra && <span title="Barra"><Wine size={16} className="text-purple-600" /></span>}
                                                         </div>
                                                     </div>
                                                 )}
                                                 
                                                 {/* Guests */}
                                                 {guestTickets.map((t) => (
                                                     <div key={t.uuid} className="bg-white p-2 rounded border border-slate-200 shadow-sm flex justify-between items-center ml-4">
                                                         <div>
                                                             <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-1 rounded mr-2">INV</span>
                                                             <span className="text-sm text-slate-600">{t.nombre_titular}</span>
                                                         </div>
                                                         <div className="flex space-x-2">
                                                             {t.tiene_bus && <span title="Bus"><Bus size={16} className="text-yellow-600" /></span>}
                                                             {t.tiene_cena && <span title="Cena"><Utensils size={16} className="text-green-600" /></span>}
                                                             {t.tiene_barra && <span title="Barra"><Wine size={16} className="text-purple-600" /></span>}
                                                         </div>
                                                     </div>
                                                 ))}
                                                 {guestTickets.length === 0 && !ownTicket && <p className="text-xs text-slate-400 italic">Sin entradas generadas</p>}
                                             </div>
                                         </div>
                                     </div>
                                 </td>
                             </tr>
                         )}
                     </React.Fragment>
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
