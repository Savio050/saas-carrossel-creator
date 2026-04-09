'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Check } from 'lucide-react';

/* ── Utilitários de força de senha ── */
interface StrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: 'bg-gray-800' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-red-500' };
  if (score === 2) return { score: 2, label: 'Média', color: 'bg-yellow-500' };
  return { score: 3, label: 'Forte', color: 'bg-green-500' };
}

interface Rule { label: string; ok: boolean; }
function getPasswordRules(password: string): Rule[] {
  return [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Maiúsculas e minúsculas', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Pelo menos um número', ok: /[0-9]/.test(password) },
    { label: 'Caractere especial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const strength = getPasswordStrength(password);
  const rules = getPasswordRules(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  // Verifica se há uma sessão ativa (vinda do link de recovery)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Sem sessão — link expirado ou inválido
        router.replace('/auth/forgot-password?error=link_expired');
      } else {
        setSessionReady(true);
      }
    });
  }, [supabase, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erro ao redefinir senha. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  /* ── Sucesso ── */
  if (done) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Senha redefinida!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition-all text-sm"
          >
            Ir para o login
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
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center font-black text-black text-lg">C</div>
            <span className="text-2xl font-black text-white tracking-tight">
              Carrossel<span className="text-orange-500">Creator</span>
            </span>
          </Link>
        </div>

        <div className="bg-gray-950 border border-gray-800/60 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <h1 className="text-xl font-bold text-white mb-1">Criar nova senha</h1>
          <p className="text-gray-500 text-sm mb-6">
            Escolha uma senha segura para sua conta.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            {/* Nova Senha */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  autoFocus
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Força + Regras */}
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
                        strength.score === 3 ? 'text-green-400' : strength.score === 2 ? 'text-yellow-400' : 'text-red-400'
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {rules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs ${rule.ok ? 'text-green-400' : 'text-gray-600'}`}
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

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Confirmar Nova Senha
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
                  placeholder="Repita a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-red-400 mt-1.5">As senhas não coincidem.</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-950/50 text-red-400 border border-red-800/60 text-sm p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!passwordsMismatch}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
