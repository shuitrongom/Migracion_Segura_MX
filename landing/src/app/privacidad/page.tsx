import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad Integral — Migración Segura MX',
  description: 'Aviso de Privacidad conforme a la LFPDPPP 2025. Conoce cómo protegemos tus datos personales.',
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image src="/logo.png" alt="Migración Segura MX" width={40} height={40} className="rounded-xl" />
            <span className="text-white font-bold text-lg hidden sm:block">Migración <span className="text-amber-500">Segura</span> MX</span>
          </a>
          <a href="/" className="px-5 py-2.5 border border-white/10 hover:border-amber-500/30 hover:bg-white/5 text-white rounded-xl text-sm font-medium transition flex items-center gap-2">
            ← Regresar al inicio
          </a>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <span className="text-amber-400 text-sm font-medium">🔒 Documento legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">Aviso de Privacidad Integral</h1>
            <p className="text-white/40 text-lg">Última actualización: 14 de julio de 2026</p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-12 border-l-4 border-l-amber-500">
            <p className="text-white/80 leading-relaxed">
              <strong className="text-amber-400">Resumen:</strong> Recopilamos datos personales y sensibles estrictamente necesarios para gestionar trámites migratorios. No vendemos, cedemos ni compartimos tu información con terceros para fines publicitarios. Tus documentos están cifrados con AES-256 en reposo y TLS en tránsito. Cumplimos con la LFPDPPP 2025 y nos alineamos a ISO/IEC 27001:2022 e ISO/IEC 27701:2024.
            </p>
          </div>

          <div className="space-y-10 text-white/60 leading-relaxed">

            <Section title="1. Identidad y domicilio del Responsable">
              <p><strong className="text-white">Migración Segura MX</strong> es responsable del tratamiento de los datos personales que usted nos proporcione a través de la aplicación móvil, el panel de administración y el sitio web.</p>
              <InfoBox>
                <p>📧 Datos Personales: <a href="mailto:privacidad@migracionseguramx.com" className="text-amber-400 hover:underline">privacidad@migracionseguramx.com</a></p>
                <p>📧 General: <a href="mailto:admin@migracionseguramx.com" className="text-amber-400 hover:underline">admin@migracionseguramx.com</a></p>
                <p>🌐 Web: <a href="https://migracionseguramx.com" className="text-amber-400 hover:underline">migracionseguramx.com</a></p>
              </InfoBox>
            </Section>

            <Section title="2. Datos personales que recopilamos">
              <p className="mb-2">Conforme al artículo 16 de la LFPDPPP 2025, distinguimos entre datos generales y sensibles:</p>
              <SubTitle text="2.1 Datos de identificación y contacto" />
              <BulletList items={['Nombre completo y apellidos', 'Correo electrónico', 'Número de teléfono (WhatsApp)', 'Contraseña de acceso (almacenada como hash bcrypt irreversible)']} />
              <SubTitle text="2.2 Datos sensibles — información migratoria" />
              <p className="text-amber-400/80 text-sm mb-2">El Titular consiente expresamente que estos datos son sensibles:</p>
              <BulletList items={['Nacionalidad, país de nacimiento, fecha de nacimiento, sexo, estado civil', 'Número de pasaporte, fecha de expedición y vencimiento', 'CURP (cuando aplique)', 'Condición de estancia migratoria actual y solicitada', 'Domicilio en México', 'Datos laborales (cuando el trámite lo requiera)', 'Información de familiares y beneficiarios del trámite']} />
              <SubTitle text="2.3 Documentos digitalizados" />
              <BulletList items={['Fotografía de pasaporte (procesada por OCR)', 'INE/IFE — frente y reverso', 'Comprobante de domicilio', 'Vouchers de pago', 'Documentos requeridos por el INM según el trámite', 'Solicitudes generadas ante el INM (PDF)']} />
              <SubTitle text="2.4 Datos de geolocalización" />
              <p><strong className="text-white">Recopilamos ubicación (latitud, longitud, ciudad) con consentimiento explícito previo.</strong> Se obtiene una sola vez al abrir la app. No realizamos rastreo continuo ni en segundo plano.</p>
              <BulletList items={['Identificar entidad federativa para formularios del INM', 'Estadísticas internas agregadas y anonimizadas', 'Asignación de asesores según cercanía']} />
              <p className="text-sm text-white/40">Puede negar/revocar el permiso desde la configuración del dispositivo sin afectar el uso general.</p>
              <SubTitle text="2.5 Datos biométricos" />
              <p>La autenticación biométrica (Face ID/Touch ID/huella) es opcional y se procesa exclusivamente en el hardware seguro del dispositivo. <strong className="text-white">Los datos biométricos NO se transmiten a nuestros servidores.</strong></p>
              <SubTitle text="2.6 Datos técnicos" />
              <BulletList items={['Token de notificaciones push (Expo Push Token)', 'Plataforma del dispositivo (iOS/Android)', 'Idioma preferido', 'Identificador de dispositivo para sesiones múltiples']} />
              <SubTitle text="2.7 Datos financieros" />
              <BulletList items={['Historial de pagos (monto, fecha, método, estatus)', 'Comprobantes de transferencia (imagen cifrada)', 'NO almacenamos números de tarjeta de crédito/débito — se procesan directamente por MercadoPago (PCI-DSS)']} />
            </Section>

            <Section title="3. Finalidades del tratamiento">
              <SubTitle text="3.1 Finalidades primarias (necesarias)" />
              <BulletList items={['Gestionar, preparar y dar seguimiento a trámites migratorios ante el INM', 'Generar y llenar solicitudes oficiales del INM', 'Almacenar y organizar el expediente documental de forma segura', 'Procesar pagos por servicios de gestoría', 'Enviar notificaciones sobre avance del trámite', 'Comunicación entre el Titular y su gestor asignado', 'Verificar identidad para prevenir fraude', 'Cumplir obligaciones legales']} />
              <SubTitle text="3.2 Finalidades secundarias (requieren consentimiento)" />
              <BulletList items={['Estadísticas agregadas y anonimizadas', 'Información sobre nuevos servicios o actualizaciones regulatorias', 'Datos de geolocalización para fines estadísticos']} />
              <p className="text-sm">Para oponerse a finalidades secundarias: <a href="mailto:privacidad@migracionseguramx.com" className="text-amber-400">privacidad@migracionseguramx.com</a></p>
            </Section>

            <Section title="4. Base legal del tratamiento">
              <BulletList items={['Consentimiento expreso e informado al registrarse', 'Consentimiento expreso para datos sensibles (art. 9 LFPDPPP 2025)', 'Relación contractual de servicios de gestoría', 'Obligación legal de conservar expedientes migratorios', 'Interés legítimo en prevención de fraude']} />
            </Section>

            <Section title="5. Transferencias y encargados del tratamiento">
              <p><strong className="text-white">No vendemos, arrendamos ni cedemos datos personales a terceros.</strong></p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs border border-white/10 rounded-lg overflow-hidden">
                  <thead><tr className="bg-white/5"><th className="p-3 text-amber-400 text-left">Destinatario</th><th className="p-3 text-amber-400 text-left">País</th><th className="p-3 text-amber-400 text-left">Finalidad</th></tr></thead>
                  <tbody className="text-white/60">
                    <tr className="border-t border-white/5"><td className="p-3">INM</td><td className="p-3">México</td><td className="p-3">Presentación del trámite migratorio</td></tr>
                    <tr className="border-t border-white/5"><td className="p-3">MercadoPago</td><td className="p-3">México/Argentina</td><td className="p-3">Procesamiento de pagos electrónicos</td></tr>
                    <tr className="border-t border-white/5"><td className="p-3">Google Cloud Vision</td><td className="p-3">EE.UU.</td><td className="p-3">OCR de imágenes de pasaporte</td></tr>
                    <tr className="border-t border-white/5"><td className="p-3">Firebase/FCM</td><td className="p-3">EE.UU.</td><td className="p-3">Notificaciones push</td></tr>
                    <tr className="border-t border-white/5"><td className="p-3">Expo</td><td className="p-3">EE.UU.</td><td className="p-3">Intermediación de push notifications</td></tr>
                    <tr className="border-t border-white/5"><td className="p-3">Resend</td><td className="p-3">EE.UU.</td><td className="p-3">Envío de correos transaccionales</td></tr>
                    <tr className="border-t border-white/5"><td className="p-3">Supabase</td><td className="p-3">EE.UU.</td><td className="p-3">Base de datos y almacenamiento cifrado</td></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="6. Medidas de seguridad">
              <p>Alineadas con ISO/IEC 27001:2022 e ISO/IEC 27701:2024:</p>
              <BulletList items={['Cifrado AES-256 en reposo', 'HTTPS/TLS 1.2+ con HSTS (cifrado en tránsito)', 'Contraseñas con hash bcrypt + salt aleatorio', 'JWT con expiración (24h acceso / 7d refresh)', 'Bloqueo tras 5 intentos fallidos por 30 min', 'Rate limiting en todos los endpoints', 'Headers de seguridad HTTP (Helmet.js)', 'Aislamiento de datos por roles (mínimo privilegio)', 'Auditoría inmutable en JSONB de cambios financieros', 'Cierre automático de sesión tras 15 min de inactividad (admin)']} />
            </Section>

            <Section title="7. Conservación de datos">
              <BulletList items={['Cuenta activa: mientras permanezca activa', 'Expedientes concluidos: 5 años (obligación legal)', 'Datos de pago: 5 años (obligaciones fiscales)', 'Geolocalización: 1 año desde última actualización', 'Registros de auditoría: 3 años', 'Tras cancelación: bloqueo 30 días → eliminación definitiva']} />
            </Section>

            <Section title="8. Derechos ARCO">
              <p>Conforme a la LFPDPPP 2025, usted tiene derecho a:</p>
              <div className="grid md:grid-cols-2 gap-3 mt-4">
                {[
                  { l: 'A', t: 'Acceso', d: 'Conocer qué datos tenemos sobre usted' },
                  { l: 'R', t: 'Rectificación', d: 'Corregir datos incorrectos o incompletos' },
                  { l: 'C', t: 'Cancelación', d: 'Solicitar eliminación de sus datos' },
                  { l: 'O', t: 'Oposición', d: 'Oponerse al tratamiento para fines específicos' },
                ].map((item) => (
                  <div key={item.l} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">{item.l}</span>
                      <span className="font-semibold text-white text-sm">{item.t}</span>
                    </div>
                    <p className="text-xs text-white/40 pl-10">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">Envíe solicitud a <a href="mailto:privacidad@migracionseguramx.com" className="text-amber-400">privacidad@migracionseguramx.com</a> con asunto &quot;Solicitud ARCO&quot;. Respuesta en máximo 20 días hábiles.</p>
              <p className="text-sm">También tiene derecho a oponerse a decisiones automatizadas que afecten significativamente sus derechos.</p>
            </Section>

            <Section title="9. Uso de la cámara y OCR">
              <BulletList items={['Captura de documentos para expediente digital', 'Extracción de datos del pasaporte via Google Cloud Vision API', 'La imagen se procesa en tiempo real y NO se almacena por Google', 'Puede negar el permiso e ingresar datos manualmente']} />
            </Section>

            <Section title="10. Notificaciones push">
              <p>Enviamos notificaciones sobre: cambios de estatus, pagos, citas, documentos por vencer y mensajes del asesor. <strong className="text-white">No enviamos publicidad ni comunicaciones de terceros.</strong> Se desactivan desde la configuración del dispositivo.</p>
            </Section>

            <Section title="11. Pagos — MercadoPago">
              <BulletList items={['MercadoPago actúa como procesador certificado PCI-DSS Nivel 1', 'El Usuario es redirigido al entorno seguro de MercadoPago', 'Migración Segura MX JAMÁS recibe ni almacena números de tarjeta', 'Solo recibimos: ID de transacción, monto, estatus, método']} />
            </Section>

            <Section title="12. Cookies y rastreo">
              <p>La app móvil <strong className="text-white">NO usa cookies de terceros ni rastreo publicitario</strong>. No usamos Google Analytics, Meta Pixel ni servicios similares.</p>
            </Section>

            <Section title="13. Menores de edad">
              <p>Los trámites de menores se gestionan exclusivamente a través de la cuenta del padre, madre o tutor legal con consentimiento expreso. No se permite registro directo de menores de 18 años.</p>
            </Section>

            <Section title="14. Revocación del consentimiento">
              <p>Puede revocar su consentimiento en cualquier momento enviando correo a <a href="mailto:privacidad@migracionseguramx.com" className="text-amber-400">privacidad@migracionseguramx.com</a>. La revocación no tiene efectos retroactivos.</p>
            </Section>

            <Section title="15. Modificaciones al aviso">
              <p>Se notificarán cambios mediante notificación push y/o correo electrónico. El uso continuado después de publicados los cambios constituye aceptación.</p>
            </Section>

            <Section title="16. Autoridad competente">
              <p>Puede acudir ante la <strong className="text-white">Secretaría Anticorrupción y de Buen Gobierno (SABG)</strong> si considera vulnerado su derecho a la protección de datos.</p>
            </Section>

            <Section title="17. Legislación aplicable">
              <BulletList items={['LFPDPPP 2025', 'Reglamento de la LFPDPPP', 'Lineamientos del Aviso de Privacidad', 'Jurisdicción: tribunales competentes de la Ciudad de México']} />
            </Section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">Aviso de Privacidad Integral conforme a la LFPDPPP 2025. Alineado con ISO/IEC 27001:2022 e ISO/IEC 27701:2024.</p>
            <p className="text-xs text-white/30 mt-2">© 2026 Migración Segura MX. Todos los derechos reservados.</p>
            <div className="mt-4">
              <a href="/terminos" className="text-amber-400 text-sm hover:underline">Ver Términos y Condiciones →</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="scroll-mt-24">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubTitle({ text }: { text: string }) {
  return <h3 className="font-semibold text-white/80 mt-4 mb-1 text-sm">{text}</h3>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-white/70 text-sm leading-relaxed space-y-1">
      {children}
    </div>
  );
}
