
import React, { useState } from 'react';
import { api } from '../services/api';
import { CartItem, UserType } from '../types';
import { PRICES, USE_MOCK_API } from '../constants';
import { Button } from '../components/Button';
import { Bus, CreditCard, ArrowLeft, Receipt, TestTube } from 'lucide-react';

interface CheckoutProps {
  cart: CartItem;
  onBack: () => void;
  onSuccess: (ticketData: any) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ cart, onBack, onSuccess }) => {
  const [addBus, setAddBus] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate total with Management Fee
  const total = cart.basePrice + (addBus ? PRICES.BUS_ADDON : 0) + PRICES.MANAGEMENT_FEE;

  const handlePayment = async () => {
    setLoading(true);
    const finalCart = { ...cart, bus: addBus, total };

    try {
      if (USE_MOCK_API) {
        // Simulation flow
        const { orderId } = await api.initiatePayment(finalCart);
        // Simulate waiting for user to "pay" on external site
        const ticket = await api.mockPaymentSuccess(orderId, finalCart);
        onSuccess(ticket);
      } else {
        // Real Redsys flow
        const { form } = await api.initiatePayment(finalCart);
        // Create hidden form and submit
        const formEl = document.createElement('form');
        formEl.setAttribute('method', 'POST');
        formEl.setAttribute('action', form.url); // Redsys URL
        
        Object.keys(form.params).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = form.params[key];
          formEl.appendChild(input);
        });
        
        document.body.appendChild(formEl);
        formEl.submit();
      }
    } catch (e) {
      alert('Error iniciando el pago');
      setLoading(false);
    }
  };
  
  const handleSimulatePayment = async () => {
      if(!confirm("¿Estás seguro? Esto creará una entrada válida en la BD sin pagar.")) return;
      setLoading(true);
      const finalCart = { ...cart, bus: addBus, total };
      try {
          const ticket = await api.debugBypassPayment(finalCart);
          onSuccess(ticket);
      } catch (e) {
          alert('Error en simulación');
          setLoading(false);
      }
  };

  return (
    <div className="max-w-md mx-auto px-4 w-full pb-20">
      <button onClick={onBack} className="flex items-center text-slate-500 mb-6 hover:text-indigo-600">
        <ArrowLeft size={20} className="mr-1" /> Volver
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800 p-6 text-white">
          <h2 className="text-xl font-bold">Resumen del Pedido</h2>
          <p className="opacity-80 text-sm">{cart.type === UserType.GRADUATE ? 'Entrada Graduado' : 'Entrada Invitado'}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Item */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-800">Entrada Base</p>
              <p className="text-xs text-slate-500">
                {cart.basePrice === PRICES.GUEST_PARTY ? 'Solo Barra Libre' : 'Cena + Barra Libre'}
              </p>
            </div>
            <span className="font-mono font-medium">{cart.basePrice.toFixed(2)}€</span>
          </div>

          {/* Bus Option */}
          <div 
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${addBus ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}
            onClick={() => setAddBus(!addBus)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Bus size={20} className={`mr-3 ${addBus ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold text-sm text-slate-800">Añadir Autobús</p>
                  <p className="text-xs text-slate-500">Ida y vuelta incluida</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-700">+{PRICES.BUS_ADDON}€</span>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${addBus ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                  {addBus && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Management Fee */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <div className="flex items-center">
              <Receipt size={16} className="text-slate-400 mr-2" />
              <div>
                <p className="font-semibold text-slate-800">Gastos de gestión</p>
                <p className="text-xs text-slate-500">Plataforma y pasarela de pago</p>
              </div>
            </div>
            <span className="font-mono font-medium">{PRICES.MANAGEMENT_FEE.toFixed(2)}€</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
            <span className="text-lg font-bold text-slate-800">TOTAL A PAGAR</span>
            <span className="text-2xl font-bold text-indigo-600">{total.toFixed(2)}€</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-500">
            Al continuar, serás redirigido a la pasarela de pago segura de Redsys (Ibercaja).
            {USE_MOCK_API && <p className="text-red-500 font-bold mt-1">MODO DEMO: El pago se simulará automáticamente.</p>}
          </div>

          <Button fullWidth onClick={handlePayment} isLoading={loading}>
            <CreditCard size={18} className="mr-2" />
            Pagar Ahora
          </Button>
          
          <Button fullWidth onClick={handleSimulatePayment} isLoading={loading} className="bg-slate-200 text-slate-600 hover:bg-slate-300 mt-2">
            <TestTube size={18} className="mr-2" />
            Simular Pago (Debug)
          </Button>
        </div>
      </div>
    </div>
  );
};
