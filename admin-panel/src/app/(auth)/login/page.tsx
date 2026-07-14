'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStore = useAuthStore();

  useEffect(() => {
    setMounted(true);
    authStore.initialize();
    const reason = searchParams.get('reason');
    if (reason === 'idle') {
      toast.info('Tu sesión expiró por inactividad. Inicia sesión nuevamente.');
    }
  }, []);

  useEffect(() => {
    if (authStore.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authStore.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authStore.login(email, password);
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión. Verifica tus credenciales.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-950">
      {/* Fondo animado con partículas */}
      <div className="absolute inset-0">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-stone-900 to-gray-950" />
        
        {/* Orbes animados */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Líneas diagonales decorativas */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent rotate-45" />
          <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent rotate-45" />
        </div>
      </div>

      {/* Panel izquierdo - Branding (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className={`relative z-10 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo grande */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
            <img src="/logo.png" alt="Migración Segura MX" className="relative h-28 w-28 rounded-2xl shadow-2xl shadow-amber-500/20 border border-amber-500/20" />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            MIGRACIÓN <span className="text-amber-400">SEGURA</span>
          </h1>
          <p className="text-xl text-amber-200/60 font-light mb-8">Panel de Gestión Administrativa</p>
          
          {/* Features */}
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-[#222222] border border-white/5 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-500/20"><Shield className="h-4 w-4 text-amber-400" /></div>
              <div>
                <p className="text-sm font-medium text-white/90">Seguridad avanzada</p>
                <p className="text-xs text-white/70">Cifrado AES-256 + JWT rotativo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-[#222222] border border-white/5 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-500/20"><Lock className="h-4 w-4 text-amber-400" /></div>
              <div>
                <p className="text-sm font-medium text-white/90">Auto-cierre de sesión</p>
                <p className="text-xs text-white/70">Protección por inactividad de 15 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className={`w-full max-w-md transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Card del formulario */}
          <div className="relative">
            {/* Glow detrás del card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 rounded-3xl blur-xl" />
            
            <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-[#3a3a3a] shadow-2xl p-8 lg:p-10">
              {/* Logo mobile */}
              <div className="lg:hidden text-center mb-8">
                <img src="/logo.png" alt="Logo" className="h-16 w-16 rounded-xl mx-auto mb-3 shadow-lg shadow-amber-500/20 border border-amber-500/20" />
                <h1 className="text-2xl font-bold text-white">MIGRACIÓN <span className="text-amber-400">SEGURA</span></h1>
                <p className="text-sm text-white/70 mt-1">Panel de Gestión</p>
              </div>

              {/* Header del form */}
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                <p className="text-sm text-white/70 mt-1">Ingresa tus credenciales para acceder al panel</p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xs font-medium text-white/70 uppercase tracking-wider">
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 to-amber-600/15 rounded-xl opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 h-4 w-4 text-white/70 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-[#222222] border border-[#3a3a3a] rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-[#171717]/10 transition-all duration-300"
                        placeholder="admin@migracion-segura.mx"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-xs font-medium text-white/70 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 to-amber-600/15 rounded-xl opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300" />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 h-4 w-4 text-white/70 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-11 pr-12 py-3.5 bg-[#222222] border border-[#3a3a3a] rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-[#171717]/10 transition-all duration-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 p-1 text-white/70 hover:text-amber-400 transition-colors"
                        aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full group mt-2"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25">
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <span>Acceder al Panel</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-white/70">
                  Sesión protegida con cifrado de extremo a extremo
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-400/60 font-medium">Sistema seguro</span>
                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <a href="/politica-privacidad.html" target="_blank" className="text-[11px] text-white/40 hover:text-amber-400 transition-colors">Aviso de Privacidad</a>
                  <span className="text-white/20">|</span>
                  <a href="/terminos-condiciones.html" target="_blank" className="text-[11px] text-white/40 hover:text-amber-400 transition-colors">Términos y Condiciones</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <LoginForm />
    </Suspense>
  );
}
