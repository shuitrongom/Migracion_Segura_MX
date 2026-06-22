export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm">MS</div>
            <span className="text-white font-bold text-lg">Migración <span className="text-amber-500">Segura</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition hidden md:block">Servicios</a>
            <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition hidden md:block">Cómo funciona</a>
            <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition">
              Contactar asesor
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-400 text-sm font-medium">La primera app migratoria en México</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Tu trámite migratorio
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">seguro y profesional</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Gestiona tu visa, residencia, permisos de trabajo y más desde tu celular. 
              Escanea tu pasaporte, sube tus documentos y un asesor te acompaña en cada paso.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#descargar" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-lg font-bold transition shadow-lg shadow-amber-500/20">
                📲 Descargar App Gratis
              </a>
              <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 border border-white/20 hover:border-amber-500/50 text-white rounded-2xl text-lg font-medium transition">
                💬 Hablar con asesor
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-amber-500">7+</p>
            <p className="text-sm text-white/50 mt-1">Tipos de trámite</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-500">100%</p>
            <p className="text-sm text-white/50 mt-1">Digital y seguro</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-500">24/7</p>
            <p className="text-sm text-white/50 mt-1">Seguimiento en app</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-500">INM</p>
            <p className="text-sm text-white/50 mt-1">Trámites oficiales</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Servicios que ofrecemos</h2>
            <p className="text-white/50 max-w-xl mx-auto">Todos los trámites ante el INM que necesitas, gestionados por profesionales.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '✈️', title: 'Visas ante el INM', desc: 'Unidad familiar, razones humanitarias, oferta de empleo' },
              { icon: '💼', title: 'Permisos de trabajo', desc: 'Con empleador o independiente/autoempleo' },
              { icon: '📄', title: 'Expedición de documentos', desc: 'Renovación, canje o reposición de tarjeta migratoria' },
              { icon: '📋', title: 'Regularización migratoria', desc: 'Si tu documento venció o realizas actividades no autorizadas' },
              { icon: '🔄', title: 'Cambio de condición', desc: '7 modalidades de cambio de estancia migratoria' },
              { icon: '📝', title: 'Notificaciones de cambio', desc: 'Estado civil, domicilio, nombre, nacionalidad, lugar de trabajo' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition group">
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="text-lg font-semibold mt-4 mb-2 group-hover:text-amber-400 transition">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-6 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Cómo funciona?</h2>
            <p className="text-white/50">En 4 pasos simples desde tu celular</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: '📷', title: 'Escanea tu pasaporte', desc: 'La app lee tus datos automáticamente con la cámara' },
              { step: '2', icon: '📝', title: 'Completa tu solicitud', desc: 'Los datos se pre-llenan. Solo verifica y corrige' },
              { step: '3', icon: '📎', title: 'Sube tus documentos', desc: 'Pasaporte, comprobante de domicilio, INE (opcionales)' },
              { step: '4', icon: '✅', title: 'Tu asesor gestiona', desc: 'Seguimiento en tiempo real hasta que se resuelva' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="text-xs font-bold text-amber-500 mb-2">PASO {item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Download */}
      <section id="descargar" className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
            <h2 className="text-3xl font-bold mb-4">Descarga la app</h2>
            <p className="text-white/60 mb-8">Disponible para Android y próximamente iOS</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#" className="flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/></svg>
                <div className="text-left">
                  <p className="text-[10px] text-white/50">Disponible en</p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left">
                  <p className="text-[10px] text-white/50">Próximamente en</p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs">MS</div>
            <span className="text-white/70 text-sm">© 2026 Migración Segura MX</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="/politica-privacidad.html" className="hover:text-white transition">Política de privacidad</a>
            <a href="mailto:admin@migracionseguramx.com" className="hover:text-white transition">Contacto</a>
            <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">WhatsApp</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
