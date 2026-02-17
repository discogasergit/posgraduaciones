
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
  tiene_cena: boolean;
  tiene_bus: boolean;
  tiene_barra: boolean;
  // Usage flags
  used_cena: boolean;
  used_barra: boolean;
  used_bus_ida: boolean;    // New
  used_bus_vuelta: boolean; // New
}

export type ScanMode = 'CENA' | 'BARRA' | 'BUS_IDA' | 'BUS_VUELTA';

export interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
}

export interface AdminStats {
  total_recaudado: number;
  entradas_graduados: number;
  entradas_invitados: number;
  total_bus: number;
  graduados_registrados: number;
}
