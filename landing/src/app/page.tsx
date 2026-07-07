import Image from 'next/image';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Migración Segura MX" width={40} height={40} className="rounded-xl" />
            <span className="text-white font-bold text-lg hidden sm:block">Migración <span className="text-amber-500">Segura</span> MX</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#servicios" className="text-sm text-white/60 hover:text-white transition hidden md:block">Servicios</a>
            <a href="#como-funciona" className="text-sm text-white/60 hover:text-white transition hidden md:block">Cómo funciona</a>
            <a href="#descargar" className="text-sm text-white/60 hover:text-white transition hidden md:block">Descargar</a>
            <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-amber-500/20">
              💬 Asesor
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-6 min-h-[100vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[80px]" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-amber-400 text-sm font-medium">🇲🇽 La primera app migratoria en México</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
                Tu trámite migratorio
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 animate-gradient">seguro y profesional</span>
              </h1>
              
              <p className="text-lg text-white/50 mb-10 max-w-xl leading-relaxed">
                Escanea tu pasaporte, sube tus documentos y un asesor profesional gestiona tu trámite ante el INM. Todo desde tu celular.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#descargar" className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-lg font-bold transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2">
                  <span>📲 Descargar Gratis</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </a>
                <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" className="px-8 py-4 glass hover:bg-white/5 text-white rounded-2xl text-lg font-medium transition flex items-center justify-center gap-2">
                  💬 Contactar asesor
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">🔒</span>
                  <span className="text-xs text-white/40">Datos cifrados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">⚡</span>
                  <span className="text-xs text-white/40">Respuesta en 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">🏛️</span>
                  <span className="text-xs text-white/40">Trámites oficiales INM</span>
                </div>
              </div>
            </div>

            {/* App mockup */}
            <div className="relative flex justify-center animate-scale-in delay-300">
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[280px] h-[560px] bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-[3rem] border-2 border-white/10 shadow-2xl shadow-black/50 p-3 animate-float">
                  <div className="w-full h-full bg-gradient-to-b from-[#111] to-[#0a0a0a] rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center relative">
                    {/* Status bar mock */}
                    <div className="absolute top-0 w-full h-8 bg-black/50 flex items-center justify-center">
                      <div className="w-20 h-5 bg-black rounded-full" />
                    </div>
                    {/* App content mock */}
                    <Image src="/app-icon.png" alt="App" width={120} height={120} className="rounded-3xl mb-4 shadow-lg" />
                    <p className="text-white font-bold text-sm">MIGRACIÓN SEGURA</p>
                    <p className="text-amber-500 text-xs font-semibold mt-1">MX</p>
                    {/* Mock buttons */}
                    <div className="mt-8 space-y-3 w-48">
                      <div className="h-10 bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
                        <span className="text-xs text-amber-400 font-medium">📄 Nuevo trámite</span>
                      </div>
                      <div className="h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-white/60">📋 Seguimiento</span>
                      </div>
                      <div className="h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-white/60">💬 Chat asesor</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow behind phone */}
                <div className="absolute -inset-8 bg-amber-500/10 rounded-full blur-[60px] -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 via-transparent to-amber-500/3" />
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {[
            { value: '7+', label: 'Tipos de trámite', icon: '📋' },
            { value: '100%', label: 'Digital y seguro', icon: '🔒' },
            { value: '24/7', label: 'Seguimiento en app', icon: '📱' },
            { value: 'INM', label: 'Trámites oficiales', icon: '🏛️' },
          ].map((stat, i) => (
            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">{stat.value}</p>
              <p className="text-sm text-white/40 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="servicios" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-wider">Servicios</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Todo lo que necesitas</h2>
            <p className="text-white/40 max-w-xl mx-auto text-lg">Gestión profesional de todos los trámites ante el Instituto Nacional de Migración.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '✈️', title: 'Visas ante el INM', desc: 'Unidad familiar, razones humanitarias, oferta de empleo', color: 'from-blue-500/10 to-blue-600/5' },
              { icon: '💼', title: 'Permisos de trabajo', desc: 'Con empleador o independiente/autoempleo', color: 'from-purple-500/10 to-purple-600/5' },
              { icon: '📄', title: 'Expedición de documentos', desc: 'Renovación, canje o reposición de tarjeta migratoria', color: 'from-green-500/10 to-green-600/5' },
              { icon: '📋', title: 'Regularización migratoria', desc: 'Si tu documento venció o realizas actividades no autorizadas', color: 'from-red-500/10 to-red-600/5' },
              { icon: '🔄', title: 'Cambio de condición', desc: '7 modalidades de cambio de condición de estancia', color: 'from-amber-500/10 to-amber-600/5' },
              { icon: '📝', title: 'Notificaciones de cambio', desc: 'Estado civil, domicilio, nombre, nacionalidad, lugar de trabajo', color: 'from-cyan-500/10 to-cyan-600/5' },
            ].map((feature, i) => (
              <div key={i} className={`group p-7 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5`}>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] via-amber-500/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-wider">Proceso</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">¿Cómo funciona?</h2>
            <p className="text-white/40 text-lg">4 pasos simples desde tu celular</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            
            {[
              { step: '1', icon: '📷', title: 'Escanea tu pasaporte', desc: 'La cámara lee tus datos automáticamente con OCR' },
              { step: '2', icon: '✅', title: 'Valida y completa', desc: 'Los datos se pre-llenan. Solo verifica y agrega lo que falte' },
              { step: '3', icon: '📎', title: 'Sube documentos', desc: 'Pasaporte, comprobante, INE — los opcionales cuando los tengas' },
              { step: '4', icon: '🚀', title: 'Tu asesor gestiona', desc: 'Seguimiento en tiempo real con notificaciones hasta resolución' },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold mb-3">{item.step}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Passport scan feature highlight */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <span className="text-amber-500 text-sm font-semibold uppercase tracking-wider">Tecnología</span>
                <h3 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Escaneo inteligente de pasaporte</h3>
                <p className="text-white/50 mb-6 leading-relaxed">Nuestra tecnología de reconocimiento óptico lee la zona MRZ de tu pasaporte y extrae todos tus datos en segundos. Sin escribir nada manualmente.</p>
                <ul className="space-y-3">
                  {['Nombre y apellidos automáticos', 'Nacionalidad detectada', 'Número de pasaporte y vencimiento', 'Foto guardada en tu expediente'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-xs">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="w-56 h-80 bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-[2rem] border border-white/10 p-4 animate-float shadow-2xl">
                  <div className="w-full h-full bg-[#0d0d0d] rounded-[1.5rem] flex flex-col items-center justify-center gap-3">
                    <span className="text-4xl">📷</span>
                    <p className="text-xs text-white/60 text-center px-4">Coloca tu pasaporte frente a la cámara</p>
                    <div className="w-32 h-20 border-2 border-amber-500/50 rounded-lg mt-2 flex items-center justify-center">
                      <span className="text-[8px] text-amber-500/70 font-mono">P&lt;MEXGARCIA&lt;&lt;JUAN...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Download */}
      <section id="descargar" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-600/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10">
              <Image src="/app-icon.png" alt="Migración Segura MX" width={80} height={80} className="rounded-2xl mx-auto mb-6 shadow-lg" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Descarga la app ahora</h2>
              <p className="text-white/50 mb-10 text-lg">Comienza tu trámite migratorio en minutos</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#" className="group flex items-center gap-4 px-7 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 w-full sm:w-auto">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white group-hover:fill-amber-400 transition-colors"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/></svg>
                  <div className="text-left">
                    <p className="text-[11px] text-white/40 uppercase tracking-wider">Disponible en</p>
                    <p className="text-lg font-bold">Google Play</p>
                  </div>
                </a>
                <a href="#" className="group flex items-center gap-4 px-7 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 w-full sm:w-auto">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white group-hover:fill-amber-400 transition-colors"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div className="text-left">
                    <p className="text-[11px] text-white/40 uppercase tracking-wider">Próximamente</p>
                    <p className="text-lg font-bold">App Store</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Migración Segura MX" width={32} height={32} className="rounded-lg" />
              <span className="text-white/50 text-sm">© 2026 Migración Segura MX. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/40">
              <a href="/privacidad" className="hover:text-amber-400 transition">Privacidad</a>
              <a href="/terminos-condiciones.html" className="hover:text-amber-400 transition">Términos y Condiciones</a>
              <a href="mailto:admin@migracionseguramx.com" className="hover:text-amber-400 transition">Contacto</a>
              <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
