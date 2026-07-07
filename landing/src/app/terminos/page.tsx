import Image from 'next/image';

export default function TerminosPage() {
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
              <span className="text-amber-400 text-sm font-medium">📋 Documento legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Términos y Condiciones de Uso</h1>
            <p className="text-white/40 text-lg">Última actualización: Julio 2026</p>
          </div>

          {/* Disclaimer */}
          <div className="glass rounded-2xl p-8 mb-12 border-l-4 border-l-amber-500">
            <p className="text-amber-400 font-semibold mb-2">⚠️ AVISO IMPORTANTE</p>
            <p className="text-white/70 leading-relaxed text-sm">
              Migración Segura MX es un servicio PRIVADO de gestoría y asesoría migratoria. NO somos una entidad gubernamental, NO estamos afiliados al Instituto Nacional de Migración (INM) ni a ninguna dependencia del gobierno de México. Los trámites migratorios son responsabilidad exclusiva de las autoridades competentes.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            <Section number="1" title="Naturaleza del Servicio">
              <p>Migración Segura MX (&quot;la Plataforma&quot;) es un servicio de gestoría migratoria privada que ofrece:</p>
              <BulletList items={[
                'Asesoría y acompañamiento en la preparación de trámites migratorios ante el Instituto Nacional de Migración (INM).',
                'Generación de solicitudes y llenado de formularios del INM en nombre del extranjero.',
                'Organización y seguimiento del estatus de trámites.',
                'Almacenamiento seguro de documentos digitalizados.',
                'Notificaciones sobre el avance de procedimientos.',
              ]} />
              <p>El servicio NO incluye la resolución de trámites, la cual es competencia exclusiva del INM y las autoridades migratorias mexicanas.</p>
            </Section>

            <Section number="2" title="No Garantía de Resultados">
              <p>Migración Segura MX <strong className="text-white">NO garantiza</strong> la aprobación, resolución favorable, ni tiempos de respuesta de ningún trámite migratorio. Las decisiones sobre visas, permisos, regularizaciones y cualquier condición de estancia son tomadas exclusivamente por las autoridades migratorias conforme a la Ley de Migración vigente.</p>
              <p>El usuario entiende y acepta que el pago por los servicios de gestoría es por la asesoría, preparación y seguimiento del trámite, independientemente del resultado final.</p>
            </Section>

            <Section number="3" title="Cobros y Pagos">
              <p>Los pagos realizados a través de la Plataforma corresponden a:</p>
              <BulletList items={[
                'Servicios de gestoría: Honorarios por la asesoría, preparación de documentos y seguimiento del trámite.',
                'Generación de solicitudes INM: Servicio de llenado y captura de solicitudes en el sistema del INM.',
              ]} />
              <p>Los pagos NO corresponden a derechos gubernamentales ni tasas del INM. Los pagos de derechos ante el gobierno (cuando apliquen) son responsabilidad del extranjero y se realizan directamente ante las instituciones bancarias o ventanillas autorizadas.</p>
              <p>Métodos de pago aceptados: MercadoPago (tarjeta de crédito/débito), transferencia bancaria y criptomonedas. Los pagos no son reembolsables una vez que el servicio de gestoría ha sido iniciado.</p>
            </Section>

            <Section number="4" title="Requisitos del Usuario">
              <p>Para utilizar la Plataforma, el usuario debe:</p>
              <BulletList items={[
                'Ser mayor de 18 años.',
                'Proporcionar información veraz y actualizada.',
                'Contar con documentos de identidad válidos y vigentes.',
                'Mantener la confidencialidad de sus credenciales de acceso.',
              ]} />
            </Section>

            <Section number="5" title="Protección de Datos Personales">
              <p>La Plataforma recopila y almacena datos personales sensibles (nombre, nacionalidad, número de pasaporte, CURP, documentos de identidad) necesarios para la gestión migratoria. Estos datos son tratados conforme a:</p>
              <BulletList items={[
                'La Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
                'Nuestro Aviso de Privacidad.',
              ]} />
              <p>Los documentos se almacenan cifrados con tecnología AES-256. La comunicación se realiza exclusivamente mediante conexiones cifradas (HTTPS/TLS). No compartimos datos con terceros sin consentimiento expreso del usuario.</p>
            </Section>

            <Section number="6" title="Obligaciones del Gestor">
              <p>Migración Segura MX se compromete a:</p>
              <BulletList items={[
                'Brindar asesoría profesional y actualizada sobre procedimientos migratorios.',
                'Mantener al usuario informado del avance de su trámite.',
                'Proteger la información personal y documental del usuario.',
                'Actuar con diligencia en la preparación y seguimiento de trámites.',
              ]} />
            </Section>

            <Section number="7" title="Limitación de Responsabilidad">
              <p>Migración Segura MX no será responsable por:</p>
              <BulletList items={[
                'Resoluciones negativas emitidas por autoridades migratorias.',
                'Retrasos en los tiempos de respuesta del INM.',
                'Cambios en la legislación migratoria o requisitos documentales.',
                'Documentos falsos, alterados o información incorrecta proporcionada por el usuario.',
                'Pérdida de acceso por uso indebido de credenciales.',
              ]} />
            </Section>

            <Section number="8" title="Propiedad Intelectual">
              <p>La Plataforma, su diseño, código fuente, logotipos y contenido son propiedad de Migración Segura MX. Queda prohibida su reproducción total o parcial sin autorización escrita.</p>
            </Section>

            <Section number="9" title="Cancelación del Servicio">
              <p>El usuario puede solicitar la cancelación de su cuenta en cualquier momento. Los pagos realizados por servicios ya iniciados no son reembolsables. Al cancelar, los datos del usuario serán eliminados en un plazo de 30 días, salvo obligación legal de conservación.</p>
            </Section>

            <Section number="10" title="Legislación Aplicable">
              <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México.</p>
            </Section>

            <Section number="11" title="Contacto">
              <p>Para dudas, aclaraciones o solicitudes relacionadas con estos términos:</p>
              <InfoBox>
                <p>📧 Correo: <a href="mailto:admin@migracionseguramx.com" className="text-amber-400 hover:underline">admin@migracionseguramx.com</a></p>
                <p>💬 WhatsApp: +52 1 56 5317 3104</p>
              </InfoBox>
            </Section>

            <Section number="12" title="Fuentes Oficiales">
              <p>Para información oficial sobre trámites migratorios en México:</p>
              <BulletList items={[
                'Instituto Nacional de Migración: https://www.gob.mx/inm',
                'Trámites y servicios del INM: https://www.inm.gob.mx/tramites/',
                'Ley de Migración: Disponible en diputados.gob.mx',
              ]} />
            </Section>
          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">
              © 2026 Migración Segura MX. Todos los derechos reservados.
            </p>
            <p className="text-xs text-white/30 mt-2">Servicio privado de gestoría migratoria. No afiliado al gobierno de México.</p>
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
    <div className="mt-4 p-5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-white/70 text-sm leading-relaxed space-y-1">
      {children}
    </div>
  );
}
