import React, { useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { ArrowLeft, UserPlus, Users, Mail } from 'lucide-react';

interface DelegatePanelProps {
  onBack: () => void;
}

export const DelegatePanel: React.FC<DelegatePanelProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    email: '',
    telefono: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dni || !formData.nombre || !formData.email) {
      alert('DNI, Nombre y Email son obligatorios para enviar la contraseña.');
      return;
    }
    setLoading(true);
    try {
      // The API now returns the generated password for testing purposes
      const response: any = await api.addGraduate(formData);
      
      // In production, this would just say "Email sent". 
      // For testing, we show the password.
      const generatedPass = response?.password || 'Generada en servidor';
      
      alert(`✅ Alumno registrado correctamente.\n\n📧 Se ha enviado un correo a ${formData.email} con la contraseña: ${generatedPass}`);
      
      setFormData({ dni: '', nombre: '', email: '', telefono: '' });
    } catch (error) {
      alert('Error al registrar. Comprueba si el DNI ya existe.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-slate-300 p-3 rounded bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
       <button onClick={onBack} className="flex items-center text-slate-500 mb-6 hover:text-indigo-600">
        <ArrowLeft size={20} className="mr-1" /> Salir del Panel
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
                <Users className="mr-3" /> Panel de Delegados
            </h2>
            <span className="bg-indigo-700 px-3 py-1 rounded-full text-xs">Alta de Alumnos</span>
        </div>

        <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                <Mail className="text-blue-600 mr-3 mt-1" size={20} />
                <p className="text-blue-800 text-sm">
                    Introduce los datos del alumno. El sistema <strong>generará una contraseña automática</strong> y se la enviará por correo electrónico junto con las instrucciones de acceso.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">DNI / NIE *</label>
                        <input 
                            name="dni" 
                            value={formData.dni} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="12345678X" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo *</label>
                        <input 
                            name="nombre" 
                            value={formData.nombre} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="Apellido Nombre" 
                            required 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email (Obligatorio) *</label>
                        <input 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="alumno@email.com" 
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                        <input 
                            name="telefono" 
                            type="tel" 
                            value={formData.telefono} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="600123456" 
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button fullWidth type="submit" isLoading={loading}>
                        <UserPlus size={18} className="mr-2" /> Registrar y Enviar Claves
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};