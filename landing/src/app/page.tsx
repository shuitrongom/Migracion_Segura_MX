import Image from 'next/image';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-hidden relative noise">
      {/* ═══ Navigation ═══ */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Migración Segura MX" width={40} height={40} className="rounded-xl" />
            <span className="text-white font-bold text-lg hidden sm:block">Migración <span className="text-amber-500">Segura</span> MX</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#servicios" className="text-sm text-white/50 hover:text-white transition hidden md:block">Servicios</a>
            <a href="#como-funciona" className="text-sm text-white/50 hover:text-white transition hidden md:block">Proceso</a>
            <a href="#seguridad" className="text-sm text-white/50 hover:text-white transition hidden md:block">Seguridad</a>
            <a href="#descargar" className="text-sm text-white/50 hover:text-white transition hidden md:block">Descargar</a>
            <a href="https://wa.me/5215653173104" target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105">
              💬 Asesor
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-32 pb-24 px-6 min-h-[100vh] flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-amber-500/[0.07] rounded-full blur-[180px] animate-morph" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-600/[0.04] rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-amber-400/[0.03] rounded-full blur-[100px] animate-float-slow delay-300" />
          {/* Floating particles */}
          <div className="absolute top-20 left-[20%] w-2 h-2 bg-amber-500/30 rounded-full animate-float delay-200" />
          <div className="absolute top-40 right-[30%] w-1.5 h-1.5 bg-amber-400/20 rounded-full animate-float delay-500" />
          <div className="absolute bottom-40 left-[15%] w-1 h-1 bg-amber-500/25 rounded-full animate-float delay-700" />
          <div className="absolute top-[60%] right-[15%] w-2.5 h-2.5 bg-amber-600/20 rounded-full animate-float-slow" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text content */}
            <div>
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-strong rounded-full mb-8 animate-badge-bounce">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-amber-400 text-sm font-medium">La primera app migratoria en México</span>
                  <span className="text-white/30 text-xs ml-1">🇲🇽</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] mb-7 animate-fade-in-up delay-100">
                Tu trámite migratorio
                <br />
                <span className="gradient-text animate-gradient">seguro, profesional</span>
                <br />
                <span className="text-white/90">y 100% digital</span>
              </h1>

              <p className="text-lg md:text-xl text-white/45 mb-10 max-w-xl leading-relaxed animate-fade-in-up delay-200">
                Escanea tu pasaporte, sube documentos y un asesor profesional gestiona tu trámite ante el INM. Todo desde tu celular, en cualquier momento.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
                <a href="#descargar" className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-lg font-bold transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] flex items-center justify-center gap-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer opacity-0 group-hover:opacity-100" />
                  <span className="relative">📲 Descargar Gratis</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </a>
                <a href="https://wa.me/5215653173104" target="_blank" rel="noopener noreferrer" className="px-8 py-4 glass hover:bg-white/5 text-white rounded-2xl text-lg font-medium transition-all hover:border-amber-500/20 flex items-center justify-center gap-2 hover-glow">
                  💬 Contactar asesor
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-white/5 animate-fade-in-up delay-500">
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                  <span className="text-amber-500 text-sm">🔒</span>
                  <span className="text-xs text-white/50">AES-256 cifrado</span>
                </div>
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                  <span className="text-amber-500 text-sm">⚡</span>
                  <span className="text-xs text-white/50">Respuesta en 24h</span>
                </div>
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                  <span className="text-amber-500 text-sm">🏛️</span>
                  <span className="text-xs text-white/50">Trámites oficiales INM</span>
                </div>
              </div>
            </div>

            {/* Phone mockup with orbiting elements */}
            <div className="relative flex justify-center animate-scale-in delay-400">
              {/* Orbiting badges */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-orbit opacity-60"><div className="glass px-3 py-1.5 rounded-full text-xs text-amber-400 font-medium whitespace-nowrap">🛂 Visa</div></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{animationDelay: '7s'}}>
                <div className="animate-orbit delay-700 opacity-60" style={{animationDuration: '25s'}}><div className="glass px-3 py-1.5 rounded-full text-xs text-green-400 font-medium whitespace-nowrap">✅ Aprobado</div></div>
              </div>

              <div className="relative">
                {/* Phone frame */}
                <div className="w-[300px] h-[600px] bg-gradient-to-b from-[#1c1c1c] to-[#0d0d0d] rounded-[3.5rem] border border-white/10 shadow-2xl shadow-black/60 p-3.5 animate-float">
                  <div className="w-full h-full bg-gradient-to-b from-[#111] to-[#080808] rounded-[3rem] overflow-hidden flex flex-col items-center justify-center relative">
                    <div className="absolute top-0 w-full h-8 bg-black/80 flex items-center justify-center"><div className="w-24 h-5 bg-black rounded-full" /></div>
                    <Image src="/app-icon.png" alt="App" width={100} height={100} className="rounded-3xl mb-5 shadow-xl" />
                    <p className="text-white font-bold text-base tracking-wide">MIGRACIÓN SEGURA</p>
                    <p className="text-amber-500 text-xs font-bold mt-1 tracking-widest">MX</p>
                    <div className="mt-8 space-y-3 w-52">
                      <div className="h-11 bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/20 flex items-center justify-center gap-2 hover-glow cursor-default"><span className="text-xs text-amber-400 font-semibold">📄 Nuevo trámite</span></div>
                      <div className="h-11 bg-white/[0.03] rounded-xl border border-white/8 flex items-center justify-center gap-2"><span className="text-xs text-white/50">📋 Seguimiento</span></div>
                      <div className="h-11 bg-white/[0.03] rounded-xl border border-white/8 flex items-center justify-center gap-2"><span className="text-xs text-white/50">📷 Escanear pasaporte</span></div>
                    </div>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -inset-12 bg-amber-500/8 rounded-full blur-[80px] -z-10 animate-pulse-glow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats con animación ═══ */}
      <section className="py-20 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] via-transparent to-amber-500/[0.02]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent animate-glow-line" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center relative z-10">
          {[
            { value: '7+', label: 'Tipos de trámite', icon: '📋', color: 'from-blue-400 to-blue-600' },
            { value: '100%', label: 'Digital y seguro', icon: '🔒', color: 'from-green-400 to-green-600' },
            { value: '24/7', label: 'Seguimiento en app', icon: '📱', color: 'from-purple-400 to-purple-600' },
            { value: 'INM', label: 'Trámites oficiales', icon: '🏛️', color: 'from-amber-400 to-amber-600' },
          ].map((stat, i) => (
            <div key={i} className="animate-counter" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4 hover-lift">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-4xl md:text-5xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
              <p className="text-sm text-white/40 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Servicios ═══ */}
      <section id="servicios" className="py-28 px-6 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 glass rounded-full text-amber-400 text-sm font-semibold uppercase tracking-wider mb-4">Servicios</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">Todo lo que necesitas para<br /><span className="gradient-text">tu trámite migratorio</span></h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg">Gestión profesional de todos los trámites ante el Instituto Nacional de Migración de México.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '✈️', title: 'Visas ante el INM', desc: 'Unidad familiar, razones humanitarias, oferta de empleo. Formularios pre-llenados con OCR.', color: 'from-blue-500/10 to-blue-600/5', border: 'hover:border-blue-500/30' },
              { icon: '💼', title: 'Permisos de trabajo', desc: 'Con empleador o independiente. Gestión completa incluyendo constancia CIE.', color: 'from-purple-500/10 to-purple-600/5', border: 'hover:border-purple-500/30' },
              { icon: '📄', title: 'Expedición de documentos', desc: 'Renovación, canje o reposición de tu tarjeta de residente o visitante.', color: 'from-green-500/10 to-green-600/5', border: 'hover:border-green-500/30' },
              { icon: '📋', title: 'Regularización migratoria', desc: 'Si tu documento venció o realizas actividades no autorizadas. Te ayudamos.', color: 'from-red-500/10 to-red-600/5', border: 'hover:border-red-500/30' },
              { icon: '🔄', title: 'Cambio de condición', desc: '7 modalidades de cambio de condición de estancia: temporal, permanente, humanitaria.', color: 'from-amber-500/10 to-amber-600/5', border: 'hover:border-amber-500/30' },
              { icon: '📝', title: 'Notificaciones de cambio', desc: 'Estado civil, domicilio, nombre, nacionalidad, lugar de trabajo. Todo digital.', color: 'from-cyan-500/10 to-cyan-600/5', border: 'hover:border-cyan-500/30' },
            ].map((feature, i) => (
              <div key={i} className={`group p-8 rounded-3xl bg-gradient-to-br ${feature.color} border border-white/5 ${feature.border} transition-all duration-500 hover-lift glass-card`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Cómo funciona ═══ */}
      <section id="como-funciona" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 glass rounded-full text-amber-400 text-sm font-semibold uppercase tracking-wider mb-4">Proceso</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">4 pasos simples</h2>
            <p className="text-white/40 text-lg">Desde tu celular, en minutos</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-20 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            {[
              { step: '1', icon: '📷', title: 'Escanea tu pasaporte', desc: 'La cámara lee la zona MRZ y extrae tus datos en segundos con OCR' },
              { step: '2', icon: '✅', title: 'Valida y completa', desc: 'Datos pre-llenados automáticamente. Solo verifica y agrega lo que falte' },
              { step: '3', icon: '📎', title: 'Sube documentos', desc: 'Pasaporte, comprobantes, INE. Cifrados y almacenados de forma segura' },
              { step: '4', icon: '🚀', title: 'Tu asesor gestiona', desc: 'Seguimiento en tiempo real con notificaciones push hasta la resolución' },
            ].map((item, i) => (
              <div key={i} className="text-center relative group" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">{item.icon}</span>
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white text-sm font-bold mb-4 shadow-lg shadow-amber-500/30">{item.step}</div>
                <h3 className="font-bold text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Seguridad ═══ */}
      <section id="seguridad" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-green-500/[0.03] rounded-full blur-[120px] -translate-y-1/2" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="glass-strong rounded-[2rem] p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]" />
            <div className="grid md:grid-cols-2 gap-14 items-center relative z-10">
              <div>
                <span className="inline-block px-4 py-2 glass rounded-full text-green-400 text-sm font-semibold uppercase tracking-wider mb-6">Seguridad enterprise</span>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">Tus datos protegidos<br /><span className="gradient-text">al más alto nivel</span></h3>
                <p className="text-white/45 mb-8 leading-relaxed text-lg">Tu información migratoria es sensible. Usamos el mismo nivel de cifrado que los bancos para proteger cada documento que subes.</p>
                <ul className="space-y-4">
                  {[
                    { icon: '🔐', text: 'Cifrado AES-256 en todos los documentos' },
                    { icon: '🛡️', text: 'Autenticación biométrica (Face ID / huella)' },
                    { icon: '🔑', text: 'Tokens almacenados en Keychain/Keystore del SO' },
                    { icon: '🌐', text: 'Conexión HTTPS cifrada en todo momento' },
                    { icon: '🚫', text: 'Tus datos nunca se comparten con terceros' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm text-white/70 glass px-4 py-3 rounded-xl hover-glow transition-all">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-amber-500/10 rounded-full animate-morph" />
                  <div className="absolute inset-8 bg-gradient-to-br from-green-500/5 to-transparent rounded-full flex items-center justify-center">
                    <span className="text-8xl animate-float">🛡️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Testimonios / Social proof ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 glass rounded-full text-amber-400 text-sm font-semibold uppercase tracking-wider mb-4">Testimonios</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">Lo que dicen nuestros<br /><span className="gradient-text">extranjeros</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Carlos M.', country: '🇨🇴 Colombia', text: 'Hice mi regularización migratoria desde el celular. Mi asesor me guió en cada paso. En 3 semanas tenía mi tarjeta.', rating: 5 },
              { name: 'Ana P.', country: '🇻🇪 Venezuela', text: 'El escaneo del pasaporte es increíble. En segundos llenó todos mis datos. Ya no tengo que ir a escribir formularios a mano.', rating: 5 },
              { name: 'Jean L.', country: '🇫🇷 Francia', text: 'Necesitaba renovar mi visa de trabajo. La app me notificó cada avance. Servicio profesional y seguro.', rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="glass-card rounded-2xl p-8 hover-lift" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (<span key={j} className="text-amber-500 text-lg">★</span>))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6 italic">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center text-sm font-bold text-amber-400">{testimonial.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/40">{testimonial.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Multi-idioma badge ═══ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-strong rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">¿Hablas otro idioma?</h3>
            <p className="text-white/45 mb-6">Nuestros asesores te atienden en español. La app está diseñada para ser intuitiva sin importar tu idioma nativo.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['🇪🇸 Español', '🇺🇸 English support', '🇫🇷 Français', '🇧🇷 Português', '🇨🇳 中文'].map((lang, i) => (
                <span key={i} className="px-4 py-2 glass rounded-full text-sm text-white/60">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA / Download ═══ */}
      <section id="descargar" className="py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="glass-strong rounded-[2rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] animate-morph" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600/8 rounded-full blur-[80px] animate-float-slow" />

            <div className="relative z-10">
              <Image src="/app-icon.png" alt="Migración Segura MX" width={90} height={90} className="rounded-3xl mx-auto mb-8 shadow-2xl animate-float" />
              <h2 className="text-3xl md:text-5xl font-bold mb-5">Descarga la app ahora</h2>
              <p className="text-white/45 mb-12 text-lg max-w-lg mx-auto">Comienza tu trámite migratorio en minutos. Disponible gratis en iOS y Android.</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <a href="https://play.google.com/store/apps/details?id=mx.migracion_segura.app" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-8 py-5 glass-strong rounded-2xl hover:bg-white/5 hover:border-amber-500/30 transition-all duration-300 w-full sm:w-auto hover-lift">
                  <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white group-hover:fill-amber-400 transition-colors"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/></svg>
                  <div className="text-left">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Disponible en</p>
                    <p className="text-xl font-bold">Google Play</p>
                  </div>
                </a>
                <a href="https://apps.apple.com/app/migracion-segura-mx/id6789283931" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-8 py-5 glass-strong rounded-2xl hover:bg-white/5 hover:border-amber-500/30 transition-all duration-300 w-full sm:w-auto hover-lift">
                  <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white group-hover:fill-amber-400 transition-colors"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div className="text-left">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Disponible en</p>
                    <p className="text-xl font-bold">App Store</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Disclaimer legal ═══ */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-xs text-white/30 leading-relaxed">
              <strong className="text-white/50">AVISO IMPORTANTE:</strong> Esta aplicación NO es un servicio del gobierno mexicano ni del Instituto Nacional de Migración (INM). Es un servicio privado de gestión y consultoría migratoria. Para información oficial del gobierno, visite: <a href="https://www.gob.mx/inm" target="_blank" rel="noopener noreferrer" className="text-amber-500/60 hover:text-amber-400 underline">www.gob.mx/inm</a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="py-16 px-6 border-t border-white/5 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-amber-500/[0.03] rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="Migración Segura MX" width={36} height={36} className="rounded-lg" />
                <span className="text-white font-bold">Migración <span className="text-amber-500">Segura</span> MX</span>
              </div>
              <p className="text-sm text-white/35 leading-relaxed">La primera plataforma digital en México para gestionar trámites migratorios de forma segura y profesional.</p>
            </div>
            {/* Links */}
            <div>
              <p className="text-sm font-semibold text-white/70 mb-4">Enlaces</p>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><a href="#servicios" className="hover:text-amber-400 transition">Servicios</a></li>
                <li><a href="#como-funciona" className="hover:text-amber-400 transition">Cómo funciona</a></li>
                <li><a href="#seguridad" className="hover:text-amber-400 transition">Seguridad</a></li>
                <li><a href="#descargar" className="hover:text-amber-400 transition">Descargar app</a></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-sm font-semibold text-white/70 mb-4">Legal</p>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><a href="/privacidad" className="hover:text-amber-400 transition">Política de Privacidad</a></li>
                <li><a href="/terminos" className="hover:text-amber-400 transition">Términos y Condiciones</a></li>
                <li><a href="mailto:admin@migracionseguramx.com" className="hover:text-amber-400 transition">admin@migracionseguramx.com</a></li>
                <li><a href="https://wa.me/5215653173104" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition">WhatsApp: +52 1 56 5317 3104</a></li>
              </ul>
            </div>
          </div>
          {/* Bottom */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">© 2026 Migración Segura MX. Todos los derechos reservados. Servicio privado no gubernamental.</p>
            <div className="flex items-center gap-4">
              <a href="https://play.google.com/store/apps/details?id=mx.migracion_segura.app" target="_blank" rel="noopener noreferrer" className="text-xs text-white/30 hover:text-amber-400 transition">Google Play</a>
              <span className="text-white/10">|</span>
              <a href="https://apps.apple.com/app/migracion-segura-mx/id6789283931" target="_blank" rel="noopener noreferrer" className="text-xs text-white/30 hover:text-amber-400 transition">App Store</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
