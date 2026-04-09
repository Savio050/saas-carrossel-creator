'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('E-mail confirmado com sucesso! Faça seu login.');
    }
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
        } else if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('invalid_credentials')
        ) {
          throw new Error('E-mail ou senha incorretos.');
        }
        throw new Error('Erro ao fazer login. Tente novamente.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center font-black text-black text-lg transition-transform group-hover:scale-105">
            C
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Carrossel<span className="text-orange-500">Creator</span>
          </span>
        </Link>
        <p className="text-gray-500 mt-3 text-sm">Bem-vindo de volta</p>
      </div>

      {/* Card */}
      <div className="bg-gray-950 border border-gray-800/60 rounded-2xl p-8 shadow-2xl shadow-black/50">
        <h1 className="text-xl font-bold text-white mb-6">Entrar na conta</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
              placeholder="seu@email.com"
            />
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Senha
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                placeholder="Sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Alertas */}
          {error && (
            <div className="flex items-start gap-3 bg-red-950/50 text-red-400 border border-red-800/60 text-sm p-3.5 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 bg-green-950/50 text-green-400 border border-green-800/60 text-sm p-3.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-950 px-3 text-gray-600">ou</span>
          </div>
        </div>

        {/* Link para criar conta */}
        <Link
          href="/auth/signup"
          className="w-full flex items-center justify-center gap-2 bg-transparent border border-gray-800 hover:border-gray-700 hover:bg-gray-900 text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition-all text-sm"
        >
          Criar conta grátis
        </Link>
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        Ao continuar, você concorda com nossos{' '}
        <span className="text-gray-500">Termos de Uso</span> e{' '}
        <span className="text-gray-500">Política de Privacidade</span>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      {/* Glow de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="text-gray-600 text-sm">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
