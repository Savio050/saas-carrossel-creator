'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface Slide {
  slide: number;
  texto: string;
  usar_imagem: boolean;
  termo_pesquisa: string;
  imageUrl?: string;
}

interface Carrossel {
  tema_principal: string;
  numero_de_slides: number;
  carrossel: Slide[];
}

interface Props {
  user: { email: string; id: string };
  isPro: boolean;
}

export default function DashboardClient({ user, isPro }: Props) {
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrossel, setCarrossel] = useState<Carrossel | null>(null);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    setLoading(true);
    setError('');
    setCarrossel(null);

    try {
      const res = await fetch('/api/gerar-carrossel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar carrossel');
      setCarrossel(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Erro ao iniciar checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // CORREÇÃO 1: Sempre retorna a URL, com foto ou com a string 'null'
  const getSlideImageUrl = (slide: Slide) => {
    const imgParam = slide.imageUrl ? encodeURIComponent(slide.imageUrl) : 'null';
    // Observação: se a sua pasta no backend se chama "og-image", mude /api/og para /api/og-image
    return `/api/og?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}`;
  };

  // CORREÇÃO 2: Função para baixar todos os slides de uma vez
  const baixarTodasAsImagens = async () => {
    if (!carrossel) return;
    
    carrossel.carrossel.forEach(async (slide, index) => {
      const imgUrl = getSlideImageUrl(slide);
      try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `slide-${index + 1}.png`; // Nome do arquivo
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Erro ao baixar o slide ${index + 1}:`, error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Carrossel</span>
          <span className="text-xl font-bold text-purple-400">Creator</span>
          {isPro && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">PRO</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Paywall */}
        {!isPro && (
          <div className="mb-8 bg-purple-900/20 border border-purple-700 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white mb-1">Desbloqueie o acesso completo</h3>
              <p className="text-gray-400 text-sm">Assine o plano PRO para gerar carrosséis ilimitados.</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              {checkoutLoading ? 'Aguarde...' : 'Assinar PRO'}
            </button>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Gerar novo carrossel</h2>
          <form onSubmit={handleGenerate} className="flex gap-3">
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Como a Shein conquistou o Brasil..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
              disabled={!isPro || loading}
            />
            <button
              type="submit"
              disabled={!isPro || loading || !tema.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? 'Gerando...' : 'Gerar'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">A IA está criando seu carrossel...</p>
          </div>
        )}

        {/* Slides */}
        {carrossel && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{carrossel.tema_principal}</h2>
                <span className="text-gray-400 text-sm">{carrossel.numero_de_slides} slides</span>
              </div>
              
              {/* BOTÃO BAIXAR TODOS */}
              <button 
                onClick={baixarTodasAsImagens}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Baixar Todos (PNG)
              </button>
            </div>
            
            <div className="grid gap-4">
              {carrossel.carrossel.map((slide) => {
                const imgUrl = getSlideImageUrl(slide);
                return (
                  <div key={slide.slide} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      
                      {/* Imagem de Preview agora aparece sempre */}
                      <div className="md:w-64 md:flex-shrink-0 bg-gray-800 flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={`Slide ${slide.slide}`}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-purple-600/30 text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                              Slide {slide.slide}
                            </span>
                            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                              {slide.usar_imagem ? 'Com imagem de fundo' : 'Sem imagem (Respiro)'}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm leading-relaxed">{slide.texto}</p>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`slide-${slide.slide}.png`}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors bg-purple-600 hover:bg-purple-500 text-white"
                          >
                            Baixar Este Slide
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
