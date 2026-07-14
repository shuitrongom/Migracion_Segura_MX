import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Migración Segura MX',
  description: 'Términos y Condiciones de uso de la plataforma Migración Segura MX. Servicio privado de gestoría migratoria.',
};

export default function TerminosPage() {
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
              <span className="text-amber-400 text-sm font-medium">📋 Documento legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">Términos y Condiciones de Uso</h1>
            <p className="text-white/40 text-lg">Última actualización: 14 de julio de 2026</p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-12 border-l-4 border-l-amber-500">
            <p className="text-amber-400 font-semibold mb-2">⚠️ AVISO IMPORTANTE</p>
            <p className="text-white/70 leading-relaxed text-sm">
              Migración Segura MX es un servicio PRIVADO de gestoría y asesoría migratoria. NO somos una entidad gubernamental, NO estamos afiliados al Instituto Nacional de Migración (INM) ni a ninguna dependencia del gobierno de México. La resolución de trámites migratorios es competencia exclusiva de las autoridades.
            </p>
          </div>

          <div className="space-y-10 text-white/60 leading-relaxed">

            <Section title="1. Definiciones">
              <BulletList items={['"Plataforma": La app móvil (iOS/Android), panel web y servicios backend de Migración Segura MX', '"Responsable": Migración Segura MX, prestadora de servicios de gestoría', '"Usuario": Persona física que se registra para recibir servicios', '"Gestor/Asesor": Personal autorizado que brinda asesoría', '"INM": Instituto Nacional de Migración de México', '"Servicios": Asesoría, preparación, captura, seguimiento y acompañamiento de trámites migratorios']} />
            </Section>

            <Section title="2. Naturaleza y alcance del Servicio">
              <BulletList items={['Asesoría profesional sobre requisitos y procedimientos migratorios', 'Preparación y llenado de solicitudes ante el INM', 'Organización, digitalización y almacenamiento seguro del expediente', 'Seguimiento del estatus y notificación oportuna de cambios', 'Programación y recordatorio de citas', 'Comunicación directa con el Gestor asignado', 'Generación de reportes y constancias']} />
              <SubTitle text="El servicio NO incluye:" />
              <BulletList items={['Garantizar aprobación o resultado favorable de trámites', 'Poder de decisión sobre trámites (es competencia del INM)', 'Presentación física ante ventanilla (salvo contratación adicional)', 'Representación legal ante tribunales', 'Emisión de documentos migratorios oficiales', 'Pago de derechos gubernamentales ante el INM', 'Asesoría legal fiscal, laboral o penal']} />
            </Section>

            <Section title="3. No garantía de resultados">
              <p>El Usuario acepta que:</p>
              <BulletList items={['Las decisiones migratorias son exclusivas de las autoridades', 'Los tiempos de resolución dependen del INM', 'Cambios legislativos pueden afectar el trámite en cualquier momento', 'El pago es por asesoría y preparación, independientemente del resultado', 'Una resolución negativa NO genera derecho a reembolso de honorarios']} />
            </Section>

            <Section title="4. Registro y cuenta">
              <SubTitle text="Requisitos:" />
              <BulletList items={['Mayor de 18 años', 'Información veraz, completa y actualizada', 'Correo electrónico válido', 'Contraseña segura (mínimo 8 caracteres)', 'Aceptar estos Términos y el Aviso de Privacidad']} />
              <SubTitle text="Responsabilidades del Usuario:" />
              <BulletList items={['Mantener confidencialidad de credenciales', 'No compartir cuenta con terceros', 'Notificar uso no autorizado inmediatamente', 'Mantener datos de contacto actualizados']} />
            </Section>

            <Section title="5. Obligaciones del Usuario">
              <BulletList items={['Proporcionar información veraz y completa', 'Entregar documentos auténticos y vigentes', 'Atender oportunamente solicitudes del Gestor', 'Realizar pagos conforme a plazos acordados', 'Presentarse a citas ante el INM cuando requerido', 'Informar cambios en su situación migratoria', 'No usar la Plataforma para fines ilegales']} />
            </Section>

            <Section title="6. Cobros, pagos y reembolso">
              <SubTitle text="Los pagos corresponden a:" />
              <BulletList items={['Honorarios de gestoría (asesoría, preparación, seguimiento)', 'Generación de solicitudes INM']} />
              <SubTitle text="Los pagos NO corresponden a:" />
              <BulletList items={['Derechos gubernamentales ni tasas del INM', 'Multas migratorias', 'Garantía de resultado favorable']} />
              <SubTitle text="Métodos: MercadoPago (tarjeta), transferencia bancaria, criptomonedas" />
              <SubTitle text="Política de reembolso:" />
              <p><strong className="text-white">No reembolsable una vez iniciado el servicio.</strong> Excepciones: pago duplicado por error técnico, servicio no iniciado en 7 días hábiles por causa nuestra, error comprobable en monto.</p>
              <p className="text-sm">Solicitudes de reembolso: <a href="mailto:admin@migracionseguramx.com" className="text-amber-400">admin@migracionseguramx.com</a> dentro de 15 días naturales.</p>
            </Section>

            <Section title="7. Obligaciones de Migración Segura MX">
              <BulletList items={['Asesoría profesional, diligente y actualizada', 'Mantener informado al Usuario del avance', 'Proteger información conforme al Aviso de Privacidad', 'Asignar un Gestor responsable por expediente', 'Proporcionar comprobantes de pago', 'Mantener la Plataforma disponible en condiciones razonables', 'Notificar cambios regulatorios que afecten trámites en curso']} />
            </Section>

            <Section title="8. Limitación de responsabilidad">
              <p>Migración Segura MX NO será responsable por:</p>
              <BulletList items={['Resoluciones negativas de autoridades migratorias', 'Retrasos del INM o cualquier autoridad', 'Cambios legislativos o de requisitos', 'Documentos falsos o información incorrecta del Usuario', 'Pérdida de acceso por negligencia del Usuario', 'Interrupciones por fuerza mayor', 'Multas o consecuencias de situación migratoria previa', 'Decisiones del Usuario de no seguir recomendaciones']} />
              <InfoBox>
                <p><strong className="text-white">Límite cuantitativo:</strong> La responsabilidad máxima no excederá el monto total pagado por los Servicios objeto de la reclamación.</p>
                <p className="mt-2"><strong className="text-white">Exclusión:</strong> No somos responsables por daños indirectos, incidentales, consecuentes o punitivos (lucro cesante, pérdida de oportunidades, etc.).</p>
              </InfoBox>
            </Section>

            <Section title="9. Propiedad intelectual">
              <p>La Plataforma, diseño, código, algoritmos, logotipos y contenido son propiedad exclusiva de Migración Segura MX. Se prohíbe reproducción, ingeniería inversa, scraping y uso de marcas sin autorización.</p>
            </Section>

            <Section title="10. Conducta prohibida">
              <BulletList items={['Información falsa o documentos fraudulentos', 'Suplantación de identidad', 'Facilitar migración irregular o tráfico de personas', 'Contenido ofensivo o ilegal en el chat', 'Acceder a datos de otros usuarios', 'Interferir con el funcionamiento (ataques, bots)']} />
              <p className="text-sm text-white/40">Violaciones resultan en cancelación inmediata sin reembolso y posible reporte a autoridades.</p>
            </Section>

            <Section title="11. Cancelación">
              <SubTitle text="Por el Usuario:" />
              <BulletList items={['Puede solicitar cancelación en cualquier momento', 'Pagos por servicios iniciados no son reembolsables', 'Datos en bloqueo 30 días → eliminación', 'Expedientes concluidos se conservan 5 años (obligación legal)']} />
            </Section>

            <Section title="12. Indemnización">
              <p>El Usuario se obliga a indemnizar a Migración Segura MX por reclamaciones derivadas de: información falsa, documentos fraudulentos, violación de estos Términos o de leyes aplicables.</p>
            </Section>

            <Section title="13. Protección de datos">
              <p>El tratamiento se rige por nuestro <a href="/privacidad" className="text-amber-400 hover:underline">Aviso de Privacidad Integral</a>. Al aceptar estos Términos, el Usuario consiente: tratamiento de datos sensibles, geolocalización, OCR, transferencias internacionales y almacenamiento cifrado en cloud.</p>
            </Section>

            <Section title="14. Legislación y controversias">
              <BulletList items={['Ley aplicable: Leyes de los Estados Unidos Mexicanos', 'Resolución: 1) Negociación directa (30 días) → 2) PROFECO → 3) Tribunales de la Ciudad de México', 'El Usuario renuncia a cualquier otro fuero']} />
            </Section>

            <Section title="15. Disposiciones generales">
              <BulletList items={['Fuerza mayor: ninguna parte responsable por incumplimiento ajeno a su control', 'Divisibilidad: si una cláusula es inválida, las demás continúan vigentes', 'Cesión: el Usuario no puede ceder sin consentimiento escrito', 'Acuerdo completo: estos Términos + Aviso de Privacidad reemplazan acuerdos previos', 'Renuncia: la falta de ejercicio de un derecho no constituye renuncia']} />
            </Section>

            <Section title="16. Contacto">
              <InfoBox>
                <p>📧 Email: <a href="mailto:admin@migracionseguramx.com" className="text-amber-400 hover:underline">admin@migracionseguramx.com</a></p>
                <p>📧 Datos personales: <a href="mailto:privacidad@migracionseguramx.com" className="text-amber-400 hover:underline">privacidad@migracionseguramx.com</a></p>
                <p>📱 WhatsApp: +52 1 56 5317 3104</p>
                <p>🌐 Web: <a href="https://migracionseguramx.com" className="text-amber-400 hover:underline">migracionseguramx.com</a></p>
              </InfoBox>
            </Section>

            <Section title="17. Fuentes oficiales">
              <BulletList items={['INM: https://www.gob.mx/inm', 'Trámites INM: https://www.inm.gob.mx/tramites/', 'PROFECO: https://www.gob.mx/profeco']} />
            </Section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">© 2026 Migración Segura MX. Todos los derechos reservados. Servicio privado de gestoría migratoria.</p>
            <p className="text-xs text-white/30 mt-1">Conforme a la Ley Federal de Protección al Consumidor, el Código de Comercio y la LFPDPPP 2025.</p>
            <div className="mt-4">
              <a href="/privacidad" className="text-amber-400 text-sm hover:underline">Ver Aviso de Privacidad →</a>
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
