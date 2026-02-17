
const metaEnv = (import.meta as any).env || {};

export const PRICES = {
  GRADUATE_BASE: 85, // Cena + Barra
  GUEST_FULL: 85,    // Cena + Barra
  GUEST_PARTY: 50,   // Solo Barra
  BUS_ADDON: 7
};

// If in production (Render), use relative path "/api". 
// If in localhost, use full URL "http://localhost:3000/api".
export const API_URL = metaEnv.PROD ? '/api' : 'http://localhost:3000/api';

// Set to FALSE for production deployment
export const USE_MOCK_API = false; 

// Empty start for clean testing. 
// You can add one via the Delegate Panel or Admin Panel to start testing.
export const MOCK_GRADUATES: any[] = []; 

// Secrets now loaded from .env (prefixed with VITE_)
// If variables are missing, it falls back to empty string to prevent accidental public leak of defaults
export const DELEGATE_PASSWORD = metaEnv.VITE_DELEGATE_PASSWORD || "";
export const ADMIN_PASSWORD = metaEnv.VITE_ADMIN_PASSWORD || "";
