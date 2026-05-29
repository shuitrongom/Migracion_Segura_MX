// ============================================
// Configuración de la app - Migración Segura MX
// ============================================
// Cambia estos valores para producción

/** Número de WhatsApp de contacto (con código de país, sin +) */
export const WHATSAPP_NUMBER = '5215653173104';

/** Mensaje predeterminado al contactar por WhatsApp */
export const WHATSAPP_MESSAGE = 'Hola, necesito ayuda con mi trámite migratorio.';

/** URL completa para abrir WhatsApp */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/** URL del backend */
export const API_URL = 'https://api.migracionseguramx.com/api/v1';

/** URL del panel web admin */
export const ADMIN_PANEL_URL = 'https://admin.migracionseguramx.com';
