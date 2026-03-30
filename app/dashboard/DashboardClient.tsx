'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Slide {
  slide: number;
  texto: string;
  usar_imagem: boolean;
  termo_pesquisa: string;
  imageUrl?: string | null;
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
  // Navegação do Menu
  const [activeTab, setActiveTab] = useState('twitter');

  // Estados Gerais do Carrossel (Twitter)
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrossel, setCarrossel] = useState<Carrossel | null>(null);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [slideAtual, setSlideAtual] = useState(0);

  // Estados do Perfil e Configurações
  const [nome, setNome] = useState('');
  const [arroba, setArroba] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  
  // Estado para Senha
  const [novaSenha, setNovaSenha] = useState('');
  const [atualizandoSenha, setAtualizandoSenha] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const carregarPerfil = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('nome, arroba, avatar_url, is_verified')
        .eq('id', user.id)
        .single();
        
      if (data && !error) {
        setNome(data.nome || '');
        setArroba(data.arroba || '');
        setAvatarUrl(data.avatar_url || '');
        setIsVerified(data.is_verified || false);
      }
    };
    carregarPerfil();
  }, [supabase, user.id]);

  const salvarPerfil = async () => {
    setSalvandoPerfil(true);
    const { error } = await supabase
      .from('users')
      .update({ nome, arroba, avatar_url: avatarUrl, is_verified: isVerified })
      .eq('id', user.id);
      
    setSalvandoPerfil(false);
    if (error) alert('Erro ao salvar no banco de dados.');
    else alert('Perfil salvo na nuvem com sucesso!');
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setFazendoUpload(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) return alert('A imagem deve ter no máximo 5MB.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      alert('Foto de perfil atualizada!');
    } catch (error) {
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setFazendoUpload(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) return alert('A senha precisa ter no mínimo 6 caracteres.');
    setAtualizandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setAtualizandoSenha(false);
    if (error) alert(`Erro: ${error.message}`);
    else {
      alert('Senha alterada com sucesso!');
      setNovaSenha('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
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

  // --- LÓGICA DO CARROSSEL TWITTER ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    setLoading(true);
    setError('');
    setCarrossel(null);
    setSlideAtual(0);

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

  const getSlideImageUrl = (slide: Slide) => {
    const imgParam = slide.imageUrl ? encodeURIComponent(slide.imageUrl) : 'null';
    const nomeParam = encodeURIComponent(nome || 'Seu Nome');
    const arrobaParam = encodeURIComponent(arroba || '@seu_arroba');
    const avatarParam = encodeURIComponent(avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png');
    const verificadoParam = isVerified ? 'true' : 'false';
    return `/api/og-image?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&nome=${nomeParam}&arroba=${arrobaParam}&avatar=${avatarParam}&verified=${verificadoParam}`;
  };

  const updateSlideAtual = (updates: Partial<Slide>) => {
    if (!carrossel) return;
    const novosSlides = [...carrossel.carrossel];
    novosSlides[slideAtual] = { ...novosSlides[slideAtual], ...updates };
    setCarrossel({ ...carrossel, carrossel: novosSlides });
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

  // --- COMPONENTES DA INTERFACE ---

  const MenuItem = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
        activeTab === id ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div>
          <div className="p-6 border-b border-gray-800 flex items-center gap-2">
            <span className="text-xl font-bold text-white">Carrossel</span>
            <span className="text-xl font-bold text-purple-400">Creator</span>
            {isPro && <span className="bg-purple-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-1">PRO</span>}
          </div>
          
          <nav className="p-4 space-y-2">
            <MenuItem id="inicio" label="Início" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} />
            <MenuItem id="twitter" label="Twitter" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>} />
            <MenuItem id="video" label="Twitter com Vídeo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>} />
            <MenuItem id="ilustrativo" label="Ilustrativo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>} />
            <MenuItem id="frase" label="Frase de Efeito" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>} />
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <MenuItem id="perfil" label="Minha Conta" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>} />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-gray-500 hover:text-red-400 transition-colors text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        
        {/* Menu Mobile Rápido (Aparece só em telas pequenas) */}
        <header className="md:hidden border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-900 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Carrossel</span>
            <span className="text-xl font-bold text-purple-400">Creator</span>
          </div>
          <button onClick={() => setActiveTab('perfil')} className="text-gray-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
        </header>

        <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32">
          
          {/* TELA: INÍCIO */}
          {activeTab === 'inicio' && (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-white mb-4">Bem-vindo ao Carrossel Creator</h1>
              <p className="text-gray-400 mb-8">Selecione uma das opções no menu lateral para começar a criar.</p>
              <button onClick={() => setActiveTab('twitter')} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                Criar Carrossel Twitter
              </button>
            </div>
          )}

          {/* TELAS EM CONSTRUÇÃO */}
          {(activeTab === 'video' || activeTab === 'ilustrativo' || activeTab === 'frase') && (
            <div className="text-center py-32 bg-gray-900 border border-gray-800 rounded-3xl">
              <span className="text-5xl mb-4 block">🚀</span>
              <h2 className="text-2xl font-bold text-white mb-2">Em Desenvolvimento</h2>
              <p className="text-gray-400">Esta funcionalidade será liberada nas próximas atualizações.</p>
            </div>
          )}

          {/* TELA: PERFIL E ASSINATURA */}
          {activeTab === 'perfil' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white">Minha Conta</h2>
              
              {/* Box Assinatura */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Status da Assinatura</h3>
                  <p className="text-gray-400 text-sm mb-3">E-mail: {user.email}</p>
                  {isPro ? (
                    <span className="bg-green-900/40 text-green-400 border border-green-800 px-3 py-1 rounded-full text-sm font-bold">Plano PRO Ativo</span>
                  ) : (
                    <span className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded-full text-sm font-bold">Plano Gratuito</span>
                  )}
                </div>
                {!isPro && (
                  <button onClick={handleCheckout} disabled={checkoutLoading} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                    {checkoutLoading ? 'Aguarde...' : 'Assinar PRO'}
                  </button>
                )}
              </div>

              {/* Box Personalização de Tweet */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Personalidade dos Tweets</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-1">
                    <label className="block text-gray-400 text-sm mb-1">Nome</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-gray-400 text-sm mb-1">Arroba (@)</label>
                    <input type="text" value={arroba} onChange={(e) => setArroba(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-gray-400 text-sm mb-1">Foto (Max 5MB)</label>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleUploadAvatar} disabled={fazendoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="w-full h-[42px] bg-gray-800 border border-gray-700 rounded-xl px-4 flex items-center justify-center transition-colors hover:bg-gray-700">
                        <span className="text-sm font-medium text-white truncate">{fazendoUpload ? 'Enviando...' : avatarUrl ? 'Trocar Foto' : 'Upload'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-1 flex flex-col justify-end">
                    <label className="flex items-center justify-center gap-3 cursor-pointer bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 h-[42px]">
                      <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} className="w-4 h-4 text-purple-600 bg-gray-700 rounded" />
                      <span className="text-sm font-medium text-white">Selo Verificado</span>
                    </label>
                  </div>
                </div>
                <button onClick={salvarPerfil} disabled={salvandoPerfil} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                  {salvandoPerfil ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>

              {/* Box Segurança (Senha) */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Segurança</h3>
                <form onSubmit={handleAlterarSenha} className="flex gap-3 max-w-md">
                  <input 
                    type="password" 
                    value={novaSenha} 
                    onChange={(e) => setNovaSenha(e.target.value)} 
                    placeholder="Nova senha (mínimo 6 caracteres)" 
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none" 
                    required 
                  />
                  <button type="submit" disabled={atualizandoSenha} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm whitespace-nowrap">
                    {atualizandoSenha ? 'Alterando...' : 'Atualizar Senha'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TELA: CARROSSSEL TWITTER */}
          {activeTab === 'twitter' && (
            <div>
              {!isPro && (
                <div className="mb-8 bg-purple-900/20 border border-purple-700 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white mb-1">Desbloqueie o acesso completo</h3>
                    <p className="text-gray-400 text-sm">Assine o plano PRO para gerar carrosséis ilimitados.</p>
                  </div>
                  <button onClick={handleCheckout} disabled={checkoutLoading} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                    {checkoutLoading ? 'Aguarde...' : 'Assinar PRO'}
                  </button>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Gerar Carrossel Twitter</h2>
                <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
                  <input type="text" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Como a Shein conquistou o Brasil..." className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none" disabled={!isPro || loading} />
                  <button type="submit" disabled={!isPro || loading || !tema.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                    {loading ? 'Gerando...' : 'Gerar Carrossel'}
                  </button>
                </form>
              </div>

              {error && <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-4 mb-6 text-sm">{error}</div>}

              {loading && (
                <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                  <div className="inline-block w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 font-medium">Escrevendo roteiro e buscando imagens...</p>
                </div>
              )}

              {/* ESTÚDIO DE EDIÇÃO */}
              {carrossel && (
                <div className="mt-12 bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-gray-800 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{carrossel.tema_principal}</h2>
                      <span className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">{carrossel.numero_de_slides} slides gerados</span>
                    </div>
                    <button onClick={baixarTodasAsImagens} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-green-900/20">
                      Baixar Todos (PNG)
                    </button>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                    <button onClick={() => slideAtual > 0 && setSlideAtual(slideAtual - 1)} disabled={slideAtual === 0} className="hidden lg:flex items-center justify-center w-12 hover:bg-gray-800 rounded-2xl transition-colors disabled:opacity-20">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <div className="flex-shrink-0 w-full lg:w-[400px] flex justify-center bg-white rounded-2xl overflow-hidden border border-gray-700 shadow-inner">
                      <img src={getSlideImageUrl(carrossel.carrossel[slideAtual])} alt={`Preview Slide ${slideAtual + 1}`} className="w-full h-auto object-contain" />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full">Slide {slideAtual + 1} de {carrossel.numero_de_slides}</span>
                      </div>
                      
                      <label className="block text-gray-400 text-sm mb-2 font-medium">Editar Texto do Tweet:</label>
                      <textarea value={carrossel.carrossel[slideAtual].texto} onChange={(e) => updateSlideAtual({ texto: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 text-white text-lg h-48 resize-none outline-none focus:border-purple-500 transition-colors mb-6" />

                      <div className="flex flex-wrap gap-3">
                        {!carrossel.carrossel[slideAtual].usar_imagem || !carrossel.carrossel[slideAtual].imageUrl ? (
                          <button onClick={() => { const url = window.prompt("Cole a URL da imagem:"); if (url) updateSlideAtual({ usar_imagem: true, imageUrl: url }); }} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                            + Adicionar Imagem
                          </button>
                        ) : (
                          <button onClick={() => updateSlideAtual({ usar_imagem: false, imageUrl: null })} className="bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 font-bold py-3 px-6 rounded-xl transition-colors">
                            Remover Imagem
                          </button>
                        )}
                        <a href={getSlideImageUrl(carrossel.carrossel[slideAtual])} download={`slide-${slideAtual + 1}.png`} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-colors text-center">
                          Baixar Apenas Este
                        </a>
                      </div>
                    </div>

                    <button onClick={() => slideAtual < carrossel.carrossel.length - 1 && setSlideAtual(slideAtual + 1)} disabled={slideAtual === carrossel.carrossel.length - 1} className="hidden lg:flex items-center justify-center w-12 hover:bg-gray-800 rounded-2xl transition-colors disabled:opacity-20">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="flex lg:hidden justify-center gap-4 mt-8">
                    <button onClick={() => slideAtual > 0 && setSlideAtual(slideAtual - 1)} disabled={slideAtual === 0} className="bg-gray-800 p-4 rounded-xl disabled:opacity-30"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <button onClick={() => slideAtual < carrossel.carrossel.length - 1 && setSlideAtual(slideAtual + 1)} disabled={slideAtual === carrossel.carrossel.length - 1} className="bg-gray-800 p-4 rounded-xl disabled:opacity-30"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
