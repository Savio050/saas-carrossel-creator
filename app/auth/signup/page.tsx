'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Check, X } from 'lucide-react';

/* ── Utilitários de força de senha ── */
interface StrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
  bg: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: 'bg-gray-800', bg: 'bg-gray-800' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-red-500', bg: 'bg-red-500/10' };
  if (score === 2) return { score: 2, label: 'Média', color: 'bg-yellow-500', bg: 'bg-yellow-500/10' };
  return { score: 3, label: 'Forte', color: 'bg-green-500', bg: 'bg-green-500/10' };
}

interface Rule {
  label: string;
  ok: boolean;
}

function getPasswordRules(password: string): Rule[] {
  return [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letras maiúsculas e minúsculas', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Pelo menos um número', ok: /[0-9]/.test(password) },
    { label: 'Caractere especial (!@#$...)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

/* ── Componente Principal ── */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const supabase = createClient();
  const strength = getPasswordStrength(password);
  const rules = getPasswordRules(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações locais
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          throw new Error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
        }
        throw signUpError;
      }

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Tela de sucesso ── */
  if (done) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Confirme seu e-mail</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Enviamos um link de confirmação para{' '}
            <span className="text-white font-semibold">{email}</span>.
            <br />
            Verifique sua caixa de entrada (e o spam).
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition-all text-sm"
          >
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
          <p className="text-gray-500 mt-3 text-sm">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-gray-950 border border-gray-800/60 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <h1 className="text-xl font-bold text-white mb-6">Criar conta</h1>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* E-mail */}
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
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                  placeholder="Mínimo 8 caracteres"
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

              {/* Barra de força */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= i ? strength.color : 'bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs font-semibold ml-3 ${
                        strength.score === 3
                          ? 'text-green-400'
                          : strength.score === 2
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>

                  {/* Regras */}
                  <div className="grid grid-cols-2 gap-1">
                    {rules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          rule.ok ? 'text-green-400' : 'text-gray-600'
                        }`}
                      >
                        {rule.ok ? (
                          <Check className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-gray-700 flex-shrink-0" />
                        )}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`w-full bg-gray-900 border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all text-sm ${
                    passwordsMismatch
                      ? 'border-red-700 focus:border-red-500 focus:ring-red-500/30'
                      : passwordsMatch
                      ? 'border-green-700 focus:border-green-500 focus:ring-green-500/30'
                      : 'border-gray-800 focus:border-orange-500 focus:ring-orange-500/30'
                  }`}
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Ícone de match */}
                {confirmPassword && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-red-400 mt-1.5">As senhas não coincidem.</p>
              )}
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-start gap-3 bg-red-950/50 text-red-400 border border-red-800/60 text-sm p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading || !!passwordsMismatch}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          {/* Já tem conta */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">Já tem uma conta? </span>
            <Link
              href="/auth/login"
              className="text-sm text-orange-500 hover:text-orange-400 font-semibold transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
