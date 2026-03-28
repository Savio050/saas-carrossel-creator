'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Separamos o formulário em um componente filho para o Next.js não reclamar do useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Novo estado para confirmar senha
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Novo estado para mensagens de sucesso (Banner Verde)
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Escuta a URL para ver se o usuário veio do link do e-mail
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('E-mail confirmado com sucesso! Pode fazer seu login.');
      setIsSignUp(false);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        // Trava de Segurança: Verifica se as senhas batem
        if (isSignUp) {
        // Trava de Segurança: Verifica se as senhas batem
        if (password !== confirmPassword) {
          setError('As senhas não coincidem. Digite novamente.');
          setLoading(false);
          return;
        }

        // NOVO: Passando a URL de redirecionamento nativamente pelo Supabase
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // O window.location.origin pega automaticamente o http://localhost:3000 ou o seu domínio da Vercel
            emailRedirectTo: `${window.location.origin}/auth/login?verified=true`,
          }
        });
        
        if (signUpError) throw signUpError;
        
        setSuccess('Enviamos um link de confirmação para o seu e-mail. Verifique sua caixa de entrada (e o spam)!');
        setPassword('');
        setConfirmPassword('');
        
        
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInError) {
          // Traduz a mensagem padrão do Supabase para um erro amigável
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link.');
          } else if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw signInError;
        }
        
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-1 text-2xl font-bold">
          <span className="text-white">Carrossel</span>
          <span className="text-purple-400">Creator</span>
        </Link>
        <p className="text-gray-400 mt-2">{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Campo que só aparece na hora de criar a conta */}
          {isSignUp && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Digite a senha novamente"
              />
            </div>
          )}

          {/* Banner de Erro (Vermelho) */}
          {error && (
            <div className="bg-red-900/30 text-red-400 border border-red-700 text-sm p-4 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Banner de Sucesso (Verde) */}
          {success && (
            <div className="bg-green-900/30 text-green-400 border border-green-700 text-sm p-4 rounded-lg font-medium">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-gray-400 hover:text-purple-400 text-sm transition-colors font-medium"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
          </button>
        </div>
      </div>
    </div>
  );
}

// O componente principal envelopa o formulário no Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
