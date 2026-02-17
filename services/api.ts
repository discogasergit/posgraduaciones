import { API_URL, USE_MOCK_API, MOCK_GRADUATES, PRICES, ADMIN_PASSWORD, DELEGATE_PASSWORD } from '../constants';
import { Graduate, Ticket, CartItem, ScanResult, ScanMode, AdminStats } from '../types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Session Mock Store
let sessionGraduates: Graduate[] = [...MOCK_GRADUATES];
let sessionTickets: Ticket[] = [];

export const api = {
  // --- PUBLIC / GRADUATE ---
  
  checkGraduate: async (dni: string, password?: string): Promise<Graduate | null> => {
    if (USE_MOCK_API) {
      await delay(600);
      const grad = sessionGraduates.find(g => g.dni.toUpperCase() === dni.toUpperCase());
      if (!grad) return null;
      // If password provided, check it (simple equality for mock)
      if (password && grad.password !== password) return null;
      return grad;
    }
    const res = await fetch(`${API_URL}/graduate/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, password })
    });
    if (!res.ok) return null;
    return res.json();
  },

  getGraduateGuests: async (graduateId: string | number): Promise<string[]> => {
    if (USE_MOCK_API) {
        await delay(300);
        // Find tickets in session that are GUESTS invited by this ID
        return sessionTickets
          .filter(t => t.type === 'GUEST' && (t as any).inviter_id === graduateId)
          .map(t => t.nombre_titular);
    }
    const res = await fetch(`${API_URL}/graduate/${graduateId}/guests`);
    return res.json();
  },

  checkInvitationCode: async (code: string): Promise<{ valid: boolean, graduateId?: number, remainingSlots?: number }> => {
    if (USE_MOCK_API) {
      await delay(600);
      const grad = sessionGraduates.find(g => g.codigo_invitacion === code);
      if (grad) {
          const used = sessionTickets.filter(t => (t as any).inviter_id === grad.id).length;
          if (used >= 3) return { valid: false };
          return { valid: true, graduateId: grad.id as number, remainingSlots: 3 - used };
      }
      return { valid: false };
    }
    const res = await fetch(`${API_URL}/guest/check-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return res.json();
  },

  initiatePayment: async (cart: CartItem): Promise<{ form: any, orderId: string }> => {
    if (USE_MOCK_API) {
      await delay(1000);
      return { 
        form: { action: '#fake-redsys', params: {} }, 
        orderId: `ORD-${Date.now()}` 
      };
    }
    const res = await fetch(`${API_URL}/payment/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cart)
    });
    return res.json();
  },

  mockPaymentSuccess: async (orderId: string, cart: CartItem): Promise<Ticket> => {
    await delay(1000);
    
    // Create Ticket Object
    const newTicket: Ticket = {
      uuid: crypto.randomUUID(),
      type: cart.type,
      nombre_titular: cart.guestName || "Graduado Demo",
      tiene_cena: cart.basePrice === PRICES.GRADUATE_BASE || cart.basePrice === PRICES.GUEST_FULL,
      tiene_barra: true,
      tiene_bus: cart.bus,
      estado_cena: false,
      estado_bus: false,
      estado_barra: false,
      ...({ inviter_id: cart.graduateId } as any) // store hidden field for logic
    };

    if (USE_MOCK_API) {
        sessionTickets.push(newTicket);
        
        if (cart.type === 'GRADUATE' && cart.graduateId) {
            const gradIndex = sessionGraduates.findIndex(g => g.id === cart.graduateId);
            if (gradIndex !== -1) {
                sessionGraduates[gradIndex].pagado = true;
                sessionGraduates[gradIndex].codigo_invitacion = `INV-${cart.graduateId}-${Math.floor(Math.random()*1000)}`;
            }
        }
    }

    return newTicket;
  },

  // --- ADMIN & DELEGATES ---

  loginStaff: async (password: string): Promise<{role: 'ADMIN' | 'DELEGATE' | null}> => {
    if (USE_MOCK_API) {
      await delay(500);
      if (password === ADMIN_PASSWORD) return { role: 'ADMIN' };
      if (password === DELEGATE_PASSWORD) return { role: 'DELEGATE' };
      return { role: null };
    }
    const res = await fetch(`${API_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    if (!res.ok) return { role: null };
    return res.json();
  },

  getStats: async (): Promise<AdminStats> => {
    if (USE_MOCK_API) {
      await delay(500);
      // Calculate REAL stats from session data
      const paidGrads = sessionGraduates.filter(g => g.pagado);
      const guestTickets = sessionTickets.filter(t => t.type === 'GUEST');
      const busTickets = sessionTickets.filter(t => t.tiene_bus);
      
      const revenue = (paidGrads.length * PRICES.GRADUATE_BASE) + 
                      (guestTickets.length * PRICES.GUEST_FULL) + // approximation
                      (busTickets.length * PRICES.BUS_ADDON);

      return {
        total_recaudado: revenue,
        entradas_graduados: paidGrads.length,
        entradas_invitados: guestTickets.length,
        total_bus: busTickets.length,
        graduados_registrados: sessionGraduates.length
      };
    }
    const res = await fetch(`${API_URL}/admin/stats`);
    return res.json();
  },

  getGraduates: async (): Promise<Graduate[]> => {
    if (USE_MOCK_API) {
      await delay(500);
      return sessionGraduates;
    }
    const res = await fetch(`${API_URL}/admin/graduates`);
    return res.json();
  },

  addGraduate: async (data: Partial<Graduate>): Promise<{success: boolean, password?: string}> => {
    if (USE_MOCK_API) {
      await delay(500);
      const newId = sessionGraduates.length + 1;
      // Auto-generate password
      const genPassword = Math.random().toString(36).slice(-8).toUpperCase();
      
      sessionGraduates.push({
        id: newId,
        dni: data.dni!.toUpperCase(),
        nombre: data.nombre!,
        email: data.email,
        telefono: data.telefono,
        password: genPassword,
        codigo_invitacion: null,
        pagado: false
      });
      return { success: true, password: genPassword };
    }
    const res = await fetch(`${API_URL}/admin/graduates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },

  scanTicket: async (uuid: string, mode: ScanMode): Promise<ScanResult> => {
    if (USE_MOCK_API) {
      await delay(400);
      // Check session tickets
      const ticket = sessionTickets.find(t => t.uuid === uuid);
      if (!ticket) return { success: false, message: 'Ticket no encontrado' };
      
      return {
        success: true,
        message: 'Acceso Permitido',
        ticket
      };
    }
    const res = await fetch(`${API_URL}/admin/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, mode })
    });
    return res.json();
  }
};
