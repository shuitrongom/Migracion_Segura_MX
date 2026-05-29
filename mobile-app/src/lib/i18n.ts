import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

const i18n = new I18n({
  es: {
    // General
    app_name: 'Migración Segura MX',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    back: '← Volver',
    continue: 'Continuar',
    send: 'Enviar',

    // Auth
    login_title: 'Bienvenido',
    login_subtitle: 'Ingresa tus credenciales para acceder',
    login_email: 'Correo electrónico',
    login_password: 'Contraseña',
    login_button: 'Acceder',
    login_verifying: 'Verificando...',
    login_google: 'Continuar con Google',
    login_no_account: '¿No tienes cuenta?',
    login_register: 'Regístrate',
    register_title: 'Crear cuenta',
    register_subtitle: 'Registro para extranjeros\nGestiona tus trámites migratorios',
    register_name: 'Nombre completo',
    register_email: 'Correo electrónico',
    register_whatsapp: 'WhatsApp',
    register_password: 'Contraseña',
    register_confirm_password: 'Confirmar contraseña',
    register_button: 'Crear cuenta',
    register_has_account: '¿Ya tienes cuenta?',
    register_login: 'Inicia sesión',
    verify_title: 'Verificar cuenta',
    verify_subtitle: 'Ingresa el código de 6 dígitos\nque enviamos a tu correo',
    verify_button: 'Verificar',

    // Dashboard cliente
    dashboard_welcome: '¡Bienvenido',
    dashboard_subtitle: 'Gestiona tu trámite migratorio de forma segura.',
    dashboard_generate: 'Generar Solicitud',
    dashboard_full_tramite: 'Trámite completo',
    dashboard_consult: 'Consultar trámite',
    dashboard_documents: 'Mis documentos',
    dashboard_contact: 'Contactar asesor',
    dashboard_my_tramites: 'Mis trámites',
    dashboard_no_tramites: 'No tienes trámites activos aún',
    dashboard_start_hint: 'Inicia uno desde "Iniciar trámite"',

    // Solicitud
    solicitud_title: 'Generar Solicitud',
    solicitud_select_type: 'Selecciona el tipo de trámite que necesitas',
    solicitud_your_data: 'Tus datos',
    solicitud_passport_info: 'Llena la información conforme a tu pasaporte',
    solicitud_cost: 'Costo del servicio',
    solicitud_cost_note: 'Se generará el cobro una vez que tu solicitud sea procesada',
    solicitud_submit: 'Enviar solicitud',
    solicitud_sent: 'Solicitud enviada',
    solicitud_sent_message: 'Tu solicitud fue recibida exitosamente.\n\nEn breve tu gestor te contactará para procesar tu solicitud y enviarte los requisitos.\n\nRecibirás una notificación cuando esté lista.',
    solicitud_back_home: 'Volver al inicio',

    // Estatus
    estatus_title: 'Estatus de trámites',
    estatus_subtitle: 'Sigue el progreso de tus solicitudes',
    estatus_no_tramites: 'Sin trámites',
    estatus_no_tramites_hint: 'Cuando inicies un trámite, aquí verás su progreso en tiempo real',
    estatus_started: 'Iniciado',

    // Documentos
    docs_title: 'Notificaciones y Documentos',
    docs_upload: 'Subir documento',
    docs_upload_hint: 'PDF, JPG, PNG (máx. 10MB)',
    docs_no_notif: 'Sin notificaciones',
    docs_no_notif_hint: 'Aquí recibirás avisos sobre tus trámites, documentos y pagos.',

    // Perfil
    profile_logout: 'Cerrar sesión',
    profile_logout_confirm: '¿Estás seguro?',
    profile_biometric: 'Bloqueo con',
    profile_notifications: 'Notificaciones',
    profile_change_password: 'Cambiar contraseña',
    profile_terms: 'Términos y condiciones',
    profile_contact: 'Contactar asesor por WhatsApp',

    // Campos formulario
    field_name: 'Nombre(s)',
    field_lastname: 'Apellidos',
    field_sex: 'Sexo',
    field_birthdate: 'Fecha de nacimiento',
    field_nationality: 'Nacionalidad',
    field_country_birth: 'País de nacimiento',
    field_curp: 'CURP (si tienes)',
    field_email: 'Correo electrónico',
    field_phone: 'Teléfono / WhatsApp',
    field_address: 'Domicilio en México',
    field_passport_number: 'Número de pasaporte',
    field_passport_expiry: 'Vigencia del pasaporte',

    // Pagos
    pay_button: 'Pagar',
    pay_advance: 'Anticipo',
    pay_settlement: 'Liquidación',
    pay_paid: 'pagado',

    // Seguridad
    security_encrypted: 'Conexión cifrada de extremo a extremo',
    security_secure: 'Sistema seguro',
  },
  en: {
    // General
    app_name: 'Migración Segura MX',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    back: '← Back',
    continue: 'Continue',
    send: 'Send',

    // Auth
    login_title: 'Welcome',
    login_subtitle: 'Enter your credentials to access',
    login_email: 'Email address',
    login_password: 'Password',
    login_button: 'Sign In',
    login_verifying: 'Verifying...',
    login_google: 'Continue with Google',
    login_no_account: "Don't have an account?",
    login_register: 'Sign Up',
    register_title: 'Create Account',
    register_subtitle: 'Registration for foreigners\nManage your immigration procedures',
    register_name: 'Full name',
    register_email: 'Email address',
    register_whatsapp: 'WhatsApp',
    register_password: 'Password',
    register_confirm_password: 'Confirm password',
    register_button: 'Create account',
    register_has_account: 'Already have an account?',
    register_login: 'Sign In',
    verify_title: 'Verify Account',
    verify_subtitle: 'Enter the 6-digit code\nwe sent to your email',
    verify_button: 'Verify',

    // Dashboard cliente
    dashboard_welcome: 'Welcome',
    dashboard_subtitle: 'Manage your immigration process safely.',
    dashboard_generate: 'Generate Application',
    dashboard_full_tramite: 'Full procedure',
    dashboard_consult: 'Check status',
    dashboard_documents: 'My documents',
    dashboard_contact: 'Contact advisor',
    dashboard_my_tramites: 'My procedures',
    dashboard_no_tramites: "You don't have active procedures yet",
    dashboard_start_hint: 'Start one from "Start procedure"',

    // Solicitud
    solicitud_title: 'Generate Application',
    solicitud_select_type: 'Select the type of procedure you need',
    solicitud_your_data: 'Your information',
    solicitud_passport_info: 'Fill in the information as shown in your passport',
    solicitud_cost: 'Service cost',
    solicitud_cost_note: 'Payment will be generated once your application is processed',
    solicitud_submit: 'Submit application',
    solicitud_sent: 'Application submitted',
    solicitud_sent_message: 'Your application was received successfully.\n\nYour advisor will contact you shortly to process your application and send you the requirements.\n\nYou will receive a notification when it is ready.',
    solicitud_back_home: 'Back to home',

    // Estatus
    estatus_title: 'Procedure Status',
    estatus_subtitle: 'Track the progress of your applications',
    estatus_no_tramites: 'No procedures',
    estatus_no_tramites_hint: 'When you start a procedure, you will see its progress here in real time',
    estatus_started: 'Started',

    // Documentos
    docs_title: 'Notifications & Documents',
    docs_upload: 'Upload document',
    docs_upload_hint: 'PDF, JPG, PNG (max. 10MB)',
    docs_no_notif: 'No notifications',
    docs_no_notif_hint: 'Here you will receive alerts about your procedures, documents and payments.',

    // Perfil
    profile_logout: 'Sign out',
    profile_logout_confirm: 'Are you sure?',
    profile_biometric: 'Lock with',
    profile_notifications: 'Notifications',
    profile_change_password: 'Change password',
    profile_terms: 'Terms and conditions',
    profile_contact: 'Contact advisor via WhatsApp',

    // Campos formulario
    field_name: 'First name(s)',
    field_lastname: 'Last name(s)',
    field_sex: 'Sex',
    field_birthdate: 'Date of birth',
    field_nationality: 'Nationality',
    field_country_birth: 'Country of birth',
    field_curp: 'CURP (if you have one)',
    field_email: 'Email address',
    field_phone: 'Phone / WhatsApp',
    field_address: 'Address in Mexico',
    field_passport_number: 'Passport number',
    field_passport_expiry: 'Passport expiry date',

    // Pagos
    pay_button: 'Pay',
    pay_advance: 'Advance',
    pay_settlement: 'Settlement',
    pay_paid: 'paid',

    // Seguridad
    security_encrypted: 'End-to-end encrypted connection',
    security_secure: 'Secure system',
  },
});

// Detectar idioma del dispositivo
const deviceLocale = getLocales()[0]?.languageCode || 'es';
i18n.locale = deviceLocale === 'en' ? 'en' : 'es'; // Default español si no es inglés
i18n.enableFallback = true;
i18n.defaultLocale = 'es';

export default i18n;
export const t = (key: string) => i18n.t(key);
