import Image from 'next/image';

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
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

      {/* Content */}
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <span className="text-amber-400 text-sm font-medium">🔒 Documento legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Aviso de Privacidad</h1>
            <p className="text-white/40 text-lg">Última actualización: 22 de junio de 2026</p>
          </div>

          {/* Summary card */}
          <div className="glass rounded-2xl p-8 mb-12 border-l-4 border-l-amber-500">
            <p className="text-white/80 leading-relaxed">
              <strong className="text-amber-400">Resumen:</strong> Recopilamos solo los datos necesarios para gestionar tu trámite migratorio ante el INM. No vendemos ni compartimos tu información con terceros para fines publicitarios. Tus documentos están protegidos con cifrado de extremo a extremo.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            <Section number="1" title="Responsable del tratamiento">
              <p><strong className="text-white">Migración Segura MX</strong> (en adelante &quot;nosotros&quot; o &quot;la plataforma&quot;) es responsable del tratamiento de los datos personales recabados a través de la aplicación móvil y el sitio web.</p>
              <InfoBox>
                <p>📧 Correo: <a href="mailto:admin@migracionseguramx.com" className="text-amber-400 hover:underline">admin@migracionseguramx.com</a></p>
                <p>🌐 Sitio web: <a href="https://migracionseguramx.com" className="text-amber-400 hover:underline">migracionseguramx.com</a></p>
              </InfoBox>
            </Section>

            <Section number="2" title="Datos personales que recopilamos">
              <SubSection title="2.1 Datos de registro">
                <BulletList items={['Nombre completo', 'Correo electrónico', 'Número de teléfono (WhatsApp)', 'Contraseña (almacenada de forma cifrada, nunca en texto plano)']} />
              </SubSection>
              <SubSection title="2.2 Datos del trámite migratorio">
                <BulletList items={['Nombre, apellidos, sexo, fecha de nacimiento', 'Nacionalidad, estado civil, país de nacimiento', 'Número de pasaporte, fecha de expedición y vencimiento', 'CURP (cuando aplica al tipo de trámite)', 'Domicilio en México (calle, colonia, municipio, estado, CP)', 'Datos laborales (cuando el trámite lo requiere)']} />
              </SubSection>
              <SubSection title="2.3 Documentos">
                <BulletList items={['Fotografía del pasaporte (escaneado por OCR)', 'Comprobante de domicilio (opcional)', 'INE o tarjeta de residencia (opcional)', 'Comprobantes de pago (vouchers de transferencia)']} />
              </SubSection>
              <SubSection title="2.4 Datos técnicos">
                <BulletList items={['Ubicación aproximada (con tu consentimiento explícito)', 'Token de notificaciones push', 'Tipo de dispositivo y sistema operativo']} />
              </SubSection>
            </Section>

            <Section number="3" title="Finalidad del tratamiento">
              <p>Utilizamos tus datos personales exclusivamente para:</p>
              <BulletList items={['Gestionar y dar seguimiento a tu trámite migratorio ante el Instituto Nacional de Migración (INM)', 'Comunicarnos contigo sobre el estado de tu trámite (notificaciones push, email, WhatsApp)', 'Generar la solicitud oficial ante el INM con tus datos', 'Procesar pagos por los servicios de gestión migratoria', 'Enviar recordatorios de vencimiento de documentos', 'Mejorar la calidad de nuestros servicios']} />
            </Section>

            <Section number="4" title="Base legal">
              <p>El tratamiento de tus datos se realiza con fundamento en:</p>
              <BulletList items={['Tu consentimiento expreso al registrarte y usar la aplicación', 'La relación contractual de prestación de servicios de gestoría migratoria', 'La Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)', 'Su Reglamento y los Lineamientos del Aviso de Privacidad']} />
            </Section>

            <Section number="5" title="Compartición de datos">
              <InfoBox>
                <p className="font-bold text-white">⚠️ No vendemos ni compartimos tus datos personales con terceros para fines publicitarios o de marketing.</p>
              </InfoBox>
              <p className="mt-4">Tus datos pueden ser compartidos únicamente con:</p>
              <BulletList items={['Instituto Nacional de Migración (INM) — Para la presentación oficial de tu trámite (es el propósito principal del servicio)', 'Procesadores de pago (Mercado Pago) — Para procesar tus pagos de forma segura mediante su plataforma certificada', 'Servicios de infraestructura — Servidores donde se almacenan tus documentos de forma cifrada (con medidas de seguridad enterprise)']} />
            </Section>

            <Section number="6" title="Seguridad de los datos">
              <p>Implementamos las siguientes medidas técnicas y organizativas:</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {[
                  { icon: '🔐', text: 'Cifrado en reposo y en tránsito (HTTPS/TLS 1.3)' },
                  { icon: '🔑', text: 'Contraseñas con hash bcrypt (irreversible)' },
                  { icon: '👁️', text: 'Acceso restringido solo a personal autorizado' },
                  { icon: '⏱️', text: 'Tokens JWT con expiración automática' },
                  { icon: '📜', text: 'Historial inmutable de operaciones financieras' },
                  { icon: '🛡️', text: 'Monitoreo continuo de accesos no autorizados' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-white/70">{item.text}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section number="7" title="Conservación de datos">
              <BulletList items={['Tus datos se conservan mientras mantengas una cuenta activa en la plataforma', 'Los expedientes de trámite se conservan por 5 años después de concluido (requisito legal)', 'Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento', 'Los datos financieros se conservan por el plazo que exige la legislación fiscal mexicana']} />
            </Section>

            <Section number="8" title="Derechos ARCO">
              <p>De conformidad con la LFPDPPP, tienes derecho a:</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {[
                  { letter: 'A', title: 'Acceso', desc: 'Conocer qué datos personales tenemos sobre ti' },
                  { letter: 'R', title: 'Rectificación', desc: 'Corregir datos incorrectos o incompletos' },
                  { letter: 'C', title: 'Cancelación', desc: 'Solicitar la eliminación de tus datos' },
                  { letter: 'O', title: 'Oposición', desc: 'Oponerte al tratamiento para fines específicos' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">{item.letter}</span>
                      <span className="font-semibold text-white">{item.title}</span>
                    </div>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                ))}
              </div>
              <InfoBox>
                <p>Para ejercer tus derechos ARCO, envía un correo a <a href="mailto:admin@migracionseguramx.com" className="text-amber-400 hover:underline">admin@migracionseguramx.com</a> con el asunto &quot;Derechos ARCO&quot;, indicando tu nombre completo y el derecho que deseas ejercer. Responderemos en un plazo máximo de 20 días hábiles.</p>
              </InfoBox>
            </Section>

            <Section number="9" title="Uso de la cámara">
              <p>La aplicación solicita acceso a la cámara de tu dispositivo exclusivamente para:</p>
              <BulletList items={['Escanear tu pasaporte y extraer datos automáticamente mediante OCR (reconocimiento óptico de caracteres)', 'Tomar fotografías de documentos requeridos para tu expediente migratorio']} />
              <p className="mt-3 text-white/50">Las imágenes se procesan localmente en tu dispositivo antes de subirse a tu expediente privado. No se comparten con terceros ni se utilizan para ningún otro fin.</p>
            </Section>

            <Section number="10" title="Notificaciones">
              <p>Enviamos notificaciones push para informarte sobre:</p>
              <BulletList items={['Cambios de estatus en tu trámite migratorio', 'Pagos pendientes o confirmados', 'Documentos por vencer (30 días antes)', 'Mensajes de tu asesor asignado', 'Recordatorios de citas programadas']} />
              <p className="mt-3 text-white/50">Puedes desactivar las notificaciones push en la configuración de tu dispositivo en cualquier momento sin que esto afecte el servicio.</p>
            </Section>

            <Section number="11" title="Menores de edad">
              <p>La aplicación puede ser utilizada por menores de edad únicamente bajo la supervisión y consentimiento expreso de su padre, madre o tutor legal, quien será responsable del registro, uso de la cuenta y veracidad de los datos proporcionados.</p>
            </Section>

            <Section number="12" title="Cambios a este aviso">
              <p>Nos reservamos el derecho de actualizar este aviso de privacidad en cualquier momento. Te notificaremos de cambios significativos a través de la aplicación móvil, notificación push o por correo electrónico. La fecha de última actualización siempre estará visible al inicio del documento.</p>
            </Section>

            <Section number="13" title="Contacto">
              <div className="glass rounded-2xl p-8 mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <Image src="/logo.png" alt="Migración Segura MX" width={48} height={48} className="rounded-xl" />
                  <div>
                    <p className="font-bold text-white text-lg">Migración Segura MX</p>
                    <p className="text-white/50 text-sm">Gestión migratoria profesional</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-white/70">
                  <p>📧 Email: <a href="mailto:admin@migracionseguramx.com" className="text-amber-400 hover:underline">admin@migracionseguramx.com</a></p>
                  <p>💬 WhatsApp: Disponible en la aplicación</p>
                  <p>🌐 Sitio web: <a href="https://migracionseguramx.com" className="text-amber-400 hover:underline">migracionseguramx.com</a></p>
                </div>
              </div>
            </Section>
          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">
              Este aviso de privacidad cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento, y los Lineamientos del Aviso de Privacidad publicados en el Diario Oficial de la Federación.
            </p>
            <p className="text-xs text-white/30 mt-2">© 2026 Migración Segura MX. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

// --- Componentes auxiliares ---

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="scroll-mt-24" id={`seccion-${number}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{number}</span>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="pl-11 text-white/60 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-white/80 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-white/70 text-sm leading-relaxed">
      {children}
    </div>
  );
}
