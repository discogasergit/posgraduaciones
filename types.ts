
export enum UserType {
  GRADUATE = 'GRADUATE',
  GUEST = 'GUEST'
}

export interface Graduate {
  id: string | number; 
  dni: string;
  nombre: string;
  email?: string;
  telefono?: string;
  password?: string; 
  codigo_invitacion: string | null;
  pagado: boolean;
}

export interface TicketOption {
  id: string;
  name: string;
  price: number;
  description: string;
  mandatory?: boolean;
}

export interface CartItem {
  type: UserType;
  basePrice: number;
  bus: boolean;
  total: number;
  graduateId?: string | number; 
  guestName?: string;
}

export interface Ticket {
  uuid: string;
  type: UserType;
  nombre_titular: string;
  inviter_id?: string; // Added for frontend logic
  tiene_cena: boolean;
  tiene_barra: boolean;
  tiene_bus: boolean;
  // Usage flags
  used_cena: boolean;
  used_barra: boolean;
  used_bus_ida: boolean;    
  used_bus_vuelta: boolean; 
}

export type ScanMode = 'CENA' | 'BARRA' | 'BUS_IDA' | 'BUS_VUELTA';

export interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
}

export interface AdminStats {
  total_recaudado: number;
  total_asistentes: number;
  entradas_graduados: number;
  entradas_invitados: number;
  desglose_tipos: {
    cena_y_barra: number;
    solo_barra: number;
  };
  total_bus: number;
  graduados_registrados: number;
}
