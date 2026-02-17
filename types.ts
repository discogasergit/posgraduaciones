
export enum UserType {
  GRADUATE = 'GRADUATE',
  GUEST = 'GUEST'
}

export interface Graduate {
  id: string | number; // Updated to support MongoDB _id (string)
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
  graduateId?: string | number; // Updated to support MongoDB _id
  guestName?: string;
}

export interface Ticket {
  uuid: string;
  type: UserType;
  nombre_titular: string;
  tiene_cena: boolean;
  tiene_bus: boolean;
  tiene_barra: boolean;
  estado_cena: boolean;
  estado_bus: boolean;
  estado_barra: boolean;
}

export type ScanMode = 'CENA' | 'BARRA' | 'BUS';

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
