import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Landing } from './pages/Landing';
import { GraduateFlow } from './pages/GraduateFlow';
import { GuestFlow } from './pages/GuestFlow';
import { Checkout } from './pages/Checkout';
import { TicketView } from './pages/TicketView';
import { AdminScanner } from './pages/AdminScanner';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { DelegatePanel } from './pages/DelegatePanel';
import { Graduate, CartItem, Ticket } from './types';
import { PRICES } from './constants';

function App() {
  const [page, setPage] = useState('home');
  const [cart, setCart] = useState<CartItem | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  
  // Auth state
  const [authRole, setAuthRole] = useState<'ADMIN' | 'DELEGATE' | null>(null);

  // Simple hash router
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setPage(hash);
      else setPage('home');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (p: string) => {
    window.location.hash = p;
  };

  const startGraduateCheckout = (grad: Graduate) => {
    setCart({
      type: 'GRADUATE' as any,
      basePrice: PRICES.GRADUATE_BASE,
      bus: false,
      total: PRICES.GRADUATE_BASE,
      graduateId: grad.id,
      guestName: grad.nombre
    });
    navigate('checkout');
  };

  const startGuestCheckout = (guestData: any) => {
    setCart({
      type: 'GUEST' as any,
      basePrice: guestData.basePrice,
      bus: false,
      total: guestData.basePrice,
      graduateId: guestData.inviterId,
      guestName: guestData.name
    });
    navigate('checkout');
  };

  const handlePaymentSuccess = (ticketData: Ticket) => {
    setTicket(ticketData);
    navigate('ticket');
  };

  const handleStaffLogin = (role: 'ADMIN' | 'DELEGATE') => {
    setAuthRole(role);
    if (role === 'ADMIN') navigate('admin-dashboard');
    else navigate('delegate-panel');
  };

  const handleLogout = () => {
    setAuthRole(null);
    navigate('home');
  };

  const renderContent = () => {
    switch (page) {
      case 'home':
        return <Landing onNavigate={navigate} />;
      case 'grad-login':
        return (
          <GraduateFlow 
            onBack={() => navigate('home')} 
            onProceedToCheckout={startGraduateCheckout}
            onViewTicket={handlePaymentSuccess}
          />
        );
      case 'guest-login':
        return (
          <GuestFlow 
            onBack={() => navigate('home')} 
            onProceedToCheckout={startGuestCheckout}
          />
        );
      case 'checkout':
        return cart ? (
          <Checkout 
            cart={cart} 
            onBack={() => navigate('home')} 
            onSuccess={handlePaymentSuccess} 
          />
        ) : <Landing onNavigate={navigate} />;
      case 'ticket':
        return ticket ? (
          <TicketView ticket={ticket} onHome={() => navigate('home')} />
        ) : <Landing onNavigate={navigate} />;
      
      // STAFF ROUTES
      case 'admin':
      case 'admin-login':
         return <AdminLogin onLogin={handleStaffLogin} onBack={() => navigate('home')} />;
      
      case 'admin-dashboard':
         if (authRole !== 'ADMIN') return <AdminLogin onLogin={handleStaffLogin} onBack={() => navigate('home')} />;
         return <AdminDashboard onScan={() => navigate('admin-scanner')} onLogout={handleLogout} />;
      
      case 'admin-scanner':
         if (authRole !== 'ADMIN') return <AdminLogin onLogin={handleStaffLogin} onBack={() => navigate('home')} />;
         return <AdminScanner onBack={() => navigate('admin-dashboard')} />;
      
      case 'delegate-panel':
          if (authRole !== 'DELEGATE') return <AdminLogin onLogin={handleStaffLogin} onBack={() => navigate('home')} />;
          return <DelegatePanel onBack={handleLogout} />;

      default:
        return <Landing onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      {page !== 'admin-scanner' && <Header />}
      <main className={page === 'admin-scanner' ? "" : "container mx-auto mt-6"}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;