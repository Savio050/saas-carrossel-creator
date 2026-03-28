'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
  // Estados do Carrossel
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrossel, setCarrossel] = useState<Carrossel | null>(null);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Estados do Perfil do Usuário
  const [nome, setNome] = useState('');
  const [arroba, setArroba] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const router = useRouter();
  const supabase = createClient();

  // Carrega os dados do perfil salvos no navegador quando a página abre
  useEffect(() => {
    setNome(localStorage.getItem('perfil_nome') || '');
    setArroba(localStorage.getItem('perfil_arroba') || '');
    setAvatarUrl(localStorage.getItem('perfil_avatar') || '');
  }, []);

  // Salva os dados do perfil no navegador
  const salvarPerfil = () => {
    localStorage.setItem('perfil_nome', nome);
    localStorage.setItem('perfil_arroba', arroba);
    localStorage.setItem('perfil_avatar', avatarUrl);
    alert('Perfil atualizado com sucesso!');
  };

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

  // Constrói a URL chamando a rota do Satori com os dados do perfil
  const getSlideImageUrl = (slide: Slide) => {
    const imgParam = slide.imageUrl ? encodeURIComponent(slide.imageUrl) : 'null';
    const nomeParam = encodeURIComponent(nome || 'Seu Nome');
    const arrobaParam = encodeURIComponent(arroba || '@seu_arroba');
    const avatarParam = encodeURIComponent(avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png');
    
  
    return `/api/og-image?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&nome=${nomeParam}&arroba=${arrobaParam}&avatar=${avatarParam}`;
  };

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
        a.download = `slide-${index + 1}.png`;
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
    <div className="min-h-screen bg-gray-950 text-white pb-20">
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

        {/* Configurações do Perfil */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Personalizar Visual do Tweet</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Nome de Exibição</label>
              <input 
                type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sávio Linhares"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Nome de Usuário (@)</label>
              <input 
                type="text" value={arroba} onChange={(e) => setArroba(e.target.value)}
                placeholder="Ex: @saviotlinhares"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">URL da Foto de Perfil</label>
              <input 
                type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Cole o link de uma imagem"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
          </div>
          <button 
            onClick={salvarPerfil}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Salvar Perfil
          </button>
        </div>

        {/* Formulario de Geração */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Gerar novo carrossel</h2>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
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
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              {loading ? 'Gerando...' : 'Gerar Carrossel'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <div className="inline-block w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-medium">A IA do T3 Studio está escrevendo seu conteúdo...</p>
          </div>
        )}

        {/* Resultados: Slides */}
        {carrossel && (
          <div className="mt-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{carrossel.tema_principal}</h2>
                <span className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">{carrossel.numero_de_slides} slides gerados</span>
              </div>
              
              <button 
                onClick={baixarTodasAsImagens}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-green-900/20"
              >
                Baixar Todos (PNG)
              </button>
            </div>
            
            <div className="grid gap-6">
              {carrossel.carrossel.map((slide) => {
                const imgUrl = getSlideImageUrl(slide);
                return (
                  <div key={slide.slide} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="flex flex-col md:flex-row">
                      
                      {/* Preview da Imagem Final */}
                      <div className="md:w-72 md:flex-shrink-0 bg-white flex items-center justify-center border-r border-gray-800">
                        <img
                          src={imgUrl}
                          alt={`Preview Slide ${slide.slide}`}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                      
                      {/* Informações do Slide */}
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              Slide {slide.slide}
                            </span>
                            <span className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                              {slide.usar_imagem ? 'Com imagem de fundo' : 'Fundo branco (Respiro)'}
                            </span>
                          </div>
                          <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{slide.texto}</p>
                        </div>
                        
                        <div className="mt-6 flex items-center gap-3 border-t border-gray-800 pt-4">
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`slide-${slide.slide}.png`}
                            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            Abrir Imagem
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
