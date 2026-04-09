'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        }
      );

      // Mesmo se o e-mail não existir, mostramos sucesso por segurança
      // (evita enumeration attack)
      if (resetError && !resetError.message.includes('not found')) {
        throw resetError;
      }

      setDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erro ao enviar e-mail. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Tela de confirmação ── */
  if (done) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Verifique seu e-mail</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            Se o endereço{' '}
            <span className="text-white font-semibold">{email}</span> estiver
            cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <p className="text-gray-600 text-xs mb-8">
            Não recebeu? Verifique a pasta de spam ou{' '}
            <button
              onClick={() => { setDone(false); setEmail(''); }}
              className="text-orange-500 hover:text-orange-400 underline transition-colors"
            >
              tente outro e-mail
            </button>
            .
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  /* ── Formulário ── */
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>

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
        </div>

        <div className="bg-gray-950 border border-gray-800/60 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao login
          </Link>

          <h1 className="text-xl font-bold text-white mb-1">Esqueci minha senha</h1>
          <p className="text-gray-500 text-sm mb-6">
            Digite seu e-mail e enviaremos um link para criar uma nova senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                placeholder="seu@email.com"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-950/50 text-red-400 border border-red-800/60 text-sm p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
