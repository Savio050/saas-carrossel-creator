'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, Twitter, Image as ImageIcon, User, LogOut, Zap, Clock, Plus, 
  ChevronLeft, ChevronRight, Download, Upload, Menu, X, Settings2, Trash2, PlusCircle, MinusCircle, Save
} from 'lucide-react';

interface Slide {
  slide: number; texto: string; usar_imagem: boolean; termo_pesquisa: string;
  imageUrl?: string | null; tipo?: string; layout?: string; posicao_texto?: string; 
}

interface Carrossel {
  tema_principal: string; numero_de_slides: number; carrossel: Slide[];
  estilo?: string; palavra_comentario?: string;
}

interface Props { user: { email: string; id: string }; isPro: boolean; }

const FONTES_DISPONEIS = [
  'Montserrat', 'Open Sans', 'Nunito Sans', 'League Spartan', 'Kalam', 'Poppins', 'Anton', 'Bebas Neue'
];

export default function DashboardClient({ user, isPro }: Props) {
  const [activeTab, setActiveTab] = useState('twitter');
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrossel, setCarrossel] = useState<Carrossel | null>(null);
  const [error, setError] = useState('');
  const [slideAtual, setSlideAtual] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // NOVO: Estado Avançado de Configuração (Capa, Cards, CTA)
  const [config, setConfig] = useState({
    capa: { fonte: 'Montserrat', tamanho: 'gigante' },
    cards: { fonte: 'Open Sans', tamanho: 'padrao' },
    cta: { fonte: 'League Spartan', tamanho: 'grande' }
  });

  // Perfil
  const [nome, setNome] = useState('');
  const [arroba, setArroba] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Carrega Perfil do BD e Configurações Salvas do Navegador
  useEffect(() => {
    const carregarTudo = async () => {
      const { data } = await supabase.from('users').select('nome, arroba, avatar_url, is_verified').eq('id', user.id).single();
      if (data) {
        setNome(data.nome || ''); setArroba(data.arroba || '');
        setAvatarUrl(data.avatar_url || ''); setIsVerified(data.is_verified || false);
      }
      const savedConfig = localStorage.getItem('configIlustrativo');
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    };
    carregarTudo();
  }, [supabase, user.id]);

  useEffect(() => { if (carrossel) setImgLoading(true); }, [slideAtual, carrossel, config]);

  const salvarConfiguracoes = () => {
    localStorage.setItem('configIlustrativo', JSON.stringify(config));
    alert('Predefinições salvas para os próximos carrosséis!');
    setShowSettings(false);
  };

  const handleUploadGeneric = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string) => {
    try {
      setFazendoUpload(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) return alert('Máximo 5MB.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { alert('Erro no upload.'); return null; } finally { setFazendoUpload(false); }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleUploadGeneric(e, 'avatars');
    if (url) { setAvatarUrl(url); await supabase.from('users').update({ avatar_url: url }).eq('id', user.id); }
  };

  const handleUploadSlideBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleUploadGeneric(e, 'fundo-carrossel');
    if (url) updateSlideAtual({ usar_imagem: true, imageUrl: url });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    setLoading(true); setError(''); setCarrossel(null); setSlideAtual(0); setShowSettings(false);
    
    const endpoint = activeTab === 'ilustrativo' ? '/api/gerar-ilustrativo' : '/api/gerar-carrossel';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tema }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      data.estilo = activeTab; setCarrossel(data);
    } catch (err: any) { setError(err.message || 'Erro inesperado'); } finally { setLoading(false); }
  };

  const getSlideImageUrl = (slide: Slide, carrosselData: Carrossel) => {
    const imgParam = (slide.usar_imagem && slide.imageUrl) ? encodeURIComponent(slide.imageUrl) : 'null';
    const nomeParam = encodeURIComponent(nome || 'Sua Marca');
    const arrobaParam = encodeURIComponent(arroba || '@seu_arroba');

    if (carrosselData.estilo === 'ilustrativo') {
      const layoutParam = slide.layout || slide.tipo || 'conteudo_overlay';
      const comParam = encodeURIComponent(carrosselData.palavra_comentario || 'EUQUERO');
      const posParam = slide.posicao_texto || 'centro'; 
      
      // Inteligência para aplicar a fonte correta dependendo do slide
      let fontParam = config.cards.fonte;
      let sizeParam = config.cards.tamanho;
      
      if (layoutParam === 'capa' || slide.tipo === 'capa') {
        fontParam = config.capa.fonte; sizeParam = config.capa.tamanho;
      } else if (layoutParam.includes('cta') || slide.tipo === 'cta') {
        fontParam = config.cta.fonte; sizeParam = config.cta.tamanho;
      }

      return `/api/og-ilustrativo?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&marca=${nomeParam}&arroba=${arrobaParam}&layout=${layoutParam}&comentario=${comParam}&posicao=${posParam}&fonte=${encodeURIComponent(fontParam)}&tamanho=${sizeParam}`;
    }

    const avatarParam = encodeURIComponent(avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png');
    return `/api/og-image?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&nome=${nomeParam}&arroba=${arrobaParam}&avatar=${avatarParam}&verified=${isVerified}`;
  };

  const updateSlideAtual = (updates: Partial<Slide>) => {
    if (!carrossel) return;
    const novosSlides = [...carrossel.carrossel];
    novosSlides[slideAtual] = { ...novosSlides[slideAtual], ...updates };
    setCarrossel({ ...carrossel, carrossel: novosSlides });
  };

  const adicionarSlide = () => {
    if (!carrossel) return;
    const novos = [...carrossel.carrossel];
    novos.splice(slideAtual + 1, 0, { slide: novos.length + 1, texto: 'Novo slide...', usar_imagem: false, termo_pesquisa: '', imageUrl: null, tipo: 'conteudo', layout: 'conteudo_overlay' });
    setCarrossel({ ...carrossel, numero_de_slides: novos.length, carrossel: novos }); setSlideAtual(slideAtual + 1);
  };

  const removerSlide = () => {
    if (!carrossel) return;
    if (carrossel.carrossel.length <= 1) return alert('Você precisa de no mínimo 1 slide.');
    if (!window.confirm('Tem certeza que deseja excluir este slide?')) return;
    const novos = [...carrossel.carrossel];
    novos.splice(slideAtual, 1);
    setCarrossel({ ...carrossel, numero_de_slides: novos.length, carrossel: novos });
    if (slideAtual >= novos.length) setSlideAtual(novos.length - 1);
  };

  const MenuItem = ({ id, label, icon, disabled = false }: { id: string, label: string, icon: any, disabled?: boolean }) => (
    <button onClick={() => { if (!disabled) { setActiveTab(id); setIsMobileMenuOpen(false); setCarrossel(null); setShowSettings(false); } }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : disabled ? 'opacity-40 cursor-not-allowed text-gray-500' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
      {icon} <span className="font-medium">{label}</span> {disabled && <Clock className="w-3 h-3 ml-auto opacity-50" />}
    </button>
  );

  // Componente Reutilizável de Configuração (Para usar no Modal e no Perfil)
  const ConfigPanel = () => (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <h4 className="font-bold text-lg flex items-center gap-2"><Settings2 className="w-5 h-5 text-orange-500"/> Predefinições de Tipografia</h4>
        <button onClick={salvarConfiguracoes} className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-colors">
          <Save className="w-4 h-4" /> SALVAR PADRÃO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BLOCO CAPA */}
        <div className="bg-[#111] border border-gray-800 p-4 rounded-xl space-y-4">
          <h5 className="font-bold text-orange-500 text-sm uppercase tracking-wider text-center border-b border-gray-800 pb-2">🖼️ Capa</h5>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Fonte</label>
            <select value={config.capa.fonte} onChange={e => setConfig({ ...config, capa: { ...config.capa, fonte: e.target.value }})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
              {FONTES_DISPONEIS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Tamanho</label>
            <select value={config.capa.tamanho} onChange={e => setConfig({ ...config, capa: { ...config.capa, tamanho: e.target.value }})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
              <option value="padrao">Padrão</option><option value="grande">Grande</option><option value="gigante">Gigante</option>
            </select>
          </div>
        </div>

        {/* BLOCO CARDS */}
        <div className="bg-[#111] border border-gray-800 p-4 rounded-xl space-y-4">
          <h5 className="font-bold text-orange-500 text-sm uppercase tracking-wider text-center border-b border-gray-800 pb-2">📄 Cards</h5>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Fonte</label>
            <select value={config.cards.fonte} onChange={e => setConfig({ ...config, cards: { ...config.cards, fonte: e.target.value }})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
              {FONTES_DISPONEIS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Tamanho</label>
            <select value={config.cards.tamanho} onChange={e => setConfig({ ...config, cards: { ...config.cards, tamanho: e.target.value }})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
              <option value="pequeno">Pequeno</option><option value="padrao">Padrão</option><option value="grande">Grande</option>
            </select>
          </div>
        </div>

        {/* BLOCO CTA */}
        <div className="bg-[#111] border border-gray-800 p-4 rounded-xl space-y-4">
          <h5 className="font-bold text-orange-500 text-sm uppercase tracking-wider text-center border-b border-gray-800 pb-2">🎯 CTA</h5>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Fonte</label>
            <select value={config.cta.fonte} onChange={e => setConfig({ ...config, cta: { ...config.cta, fonte: e.target.value }})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
              {FONTES_DISPONEIS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Tamanho</label>
            <select value={config.cta.tamanho} onChange={e => setConfig({ ...config, cta: { ...config.cta, tamanho: e.target.value }})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
               <option value="pequeno">Pequeno</option><option value="padrao">Padrão</option><option value="grande">Grande</option><option value="gigante">Gigante</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#111111] text-gray-100 overflow-hidden font-sans">
      
      {isMobileMenuOpen && ( <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} /> )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 border-r border-gray-900 flex flex-col p-6 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black">C</div>
            <h1 className="text-xl font-bold tracking-tight">Carrossel<span className="text-orange-500">Creator</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-4 px-2">Formatos</p>
          <MenuItem id="twitter" label="Twitter Style" icon={<Twitter className="w-5 h-5" />} />
          <MenuItem id="ilustrativo" label="Ilustrativo" icon={<ImageIcon className="w-5 h-5" />} />
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mt-10 mb-4 px-2">Configurações</p>
          <MenuItem id="perfil" label="Minha Conta" icon={<User className="w-5 h-5" />} />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
        
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-900 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-300 hover:text-white bg-gray-900 p-2 rounded-lg border border-gray-800"><Menu className="w-5 h-5" /></button>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest hidden sm:block">Dashboard / {activeTab}</h2>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            {isPro && <span className="bg-orange-500/10 text-orange-500 text-[10px] font-bold px-3 py-1 rounded-full border border-orange-500/20">PLANO PRO</span>}
            <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          
          {/* TELA: PERFIL */}
          {activeTab === 'perfil' && (
            <div className="space-y-8">
              <div className="max-w-4xl bg-gray-950 border border-gray-900 rounded-2xl p-6 lg:p-8 space-y-8">
                <h3 className="text-2xl font-bold">Perfil da Marca</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome / Marca</label>
                    <input value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">@ Arroba</label>
                    <input value={arroba} onChange={e => setArroba(e.target.value)} className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#111111] rounded-2xl border border-gray-800 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-orange-500 relative overflow-hidden group flex-shrink-0">
                    {avatarUrl && <img src={avatarUrl} className="w-full h-full object-cover" />}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                      <input type="file" className="hidden" onChange={handleUploadAvatar} />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-bold">Foto de Perfil</h4>
                    <p className="text-sm text-gray-500">Usado no estilo Twitter. Recomenda-se 400x400.</p>
                  </div>
                  <div className="sm:ml-auto flex items-center gap-2 mt-4 sm:mt-0">
                     <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                     <span className="text-sm font-bold">Selo Verificado</span>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    setSalvandoPerfil(true);
                    await supabase.from('users').update({ nome, arroba, avatar_url: avatarUrl, is_verified: isVerified }).eq('id', user.id);
                    setSalvandoPerfil(false); alert('Perfil Salvo!');
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-50"
                >
                  {salvandoPerfil ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>

              {/* Seção de Tipografia direto no Perfil */}
              <div className="max-w-4xl">
                 <ConfigPanel />
              </div>
            </div>
          )}

          {/* GERADOR */}
          {(activeTab === 'twitter' || activeTab === 'ilustrativo') && !carrossel && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 py-10">
              <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 mb-4">
                {activeTab === 'twitter' ? <Twitter className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
              </div>
              <div className="space-y-2 px-4">
                <h3 className="text-3xl font-black">Crie um Carrossel {activeTab === 'twitter' ? 'Viral' : 'Magnético'}</h3>
                <p className="text-gray-500 max-w-md mx-auto">Nossa IA modela o roteiro perfeito e busca imagens de alta qualidade automaticamente.</p>
              </div>

              <div className="w-full max-w-3xl flex flex-col gap-4 px-4">
                <form onSubmit={handleGenerate} className="flex gap-2">
                  <div className="relative group flex-1">
                    <input 
                      value={tema} 
                      onChange={e => setTema(e.target.value)}
                      placeholder="Ex: Dicas de produtividade..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 lg:py-5 pr-32 lg:pr-48 text-base lg:text-lg focus:border-orange-500 outline-none transition-all shadow-2xl group-hover:border-gray-700"
                    />
                    <button 
                      type="submit" disabled={loading}
                      className="absolute right-2 top-2 bottom-2 lg:right-3 lg:top-3 lg:bottom-3 bg-orange-500 hover:bg-orange-600 text-black px-4 lg:px-8 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 text-sm lg:text-base"
                    >
                      {loading ? <Zap className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" /> : <Plus className="w-4 h-4 lg:w-5 lg:h-5" />}
                      <span className="hidden sm:inline">{loading ? 'Gerando...' : 'Criar Agora'}</span>
                      <span className="sm:hidden">{loading ? '...' : 'Criar'}</span>
                    </button>
                  </div>
                  {activeTab === 'ilustrativo' && (
                    <button type="button" onClick={() => setShowSettings(!showSettings)} className={`flex-shrink-0 px-4 rounded-2xl border transition-colors flex items-center justify-center ${showSettings ? 'bg-gray-800 border-orange-500 text-orange-500' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                      <Settings2 className="w-6 h-6" />
                    </button>
                  )}
                </form>

                {showSettings && activeTab === 'ilustrativo' && (
                  <div className="animate-in fade-in slide-in-from-top-2 text-left mt-4">
                    <ConfigPanel />
                  </div>
                )}
                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              </div>
            </div>
          )}

          {/* ESTÚDIO SIDE-BY-SIDE RESPONSIVO */}
          {carrossel && (activeTab === 'twitter' || activeTab === 'ilustrativo') && (
            <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex-1 w-full space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <button onClick={() => setSlideAtual(prev => Math.max(0, prev - 1))} className="p-3 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 disabled:opacity-20 flex-shrink-0" disabled={slideAtual === 0}><ChevronLeft className="w-5 h-5" /></button>
                    <span className="font-mono text-xs text-gray-500 tracking-widest uppercase text-center">Slide {slideAtual + 1} de {carrossel.numero_de_slides}</span>
                    <button onClick={() => setSlideAtual(prev => Math.min(carrossel.carrossel.length - 1, prev + 1))} className="p-3 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 disabled:opacity-20 flex-shrink-0" disabled={slideAtual === carrossel.carrossel.length - 1}><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => { if(window.confirm('Excluir este carrossel?')) setCarrossel(null); }} className="flex-1 sm:flex-none px-4 py-3 sm:py-2 text-xs font-bold text-red-400 bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4"/> EXCLUIR CARROSSEL
                    </button>
                    <button 
                      onClick={() => {
                        carrossel.carrossel.forEach(async (s, i) => {
                          const res = await fetch(getSlideImageUrl(s, carrossel)); const blob = await res.blob();
                          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `slide-${i+1}.png`; a.click();
                        });
                      }}
                      className="flex-1 sm:flex-none justify-center bg-white text-black px-4 sm:px-6 py-3 sm:py-2 rounded-lg text-xs font-black flex items-center gap-2 hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4" /> <span className="hidden sm:inline">BAIXAR TODOS</span>
                    </button>
                  </div>
                </div>

                <div className="aspect-square w-full max-w-[700px] mx-auto bg-gray-950 rounded-[20px] lg:rounded-[40px] border border-gray-900 shadow-2xl overflow-hidden relative group">
                  {imgLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm">
                      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Renderizando HD...</p>
                    </div>
                  )}
                  <img 
                    src={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} 
                    className={`w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`} 
                    onLoad={() => setImgLoading(false)}
                    key={`${slideAtual}-${activeTab}-${carrossel.carrossel[slideAtual].posicao_texto}-${carrossel.carrossel[slideAtual].usar_imagem}-${JSON.stringify(config)}`}
                  />
                  <div className="absolute inset-0 border-[8px] lg:border-[16px] border-black/5 rounded-[20px] lg:rounded-[40px] pointer-events-none" />
                </div>
              </div>

              <div className="w-full xl:w-[450px] space-y-4 lg:space-y-6">
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={adicionarSlide} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
                    <PlusCircle className="w-4 h-4" /> NOVO SLIDE AQUI
                  </button>
                  <button onClick={removerSlide} className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
                    <MinusCircle className="w-4 h-4" /> REMOVER SLIDE
                  </button>
                </div>

                <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-2 lg:mb-4">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Editor de Slide</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase">Texto Principal</label>
                      <textarea 
                        value={carrossel.carrossel[slideAtual].texto}
                        onChange={e => updateSlideAtual({ texto: e.target.value })}
                        className="w-full bg-[#111111] border border-gray-800 rounded-2xl px-4 py-4 text-base lg:text-lg h-32 focus:border-orange-500 outline-none transition-all resize-none"
                      />
                    </div>

                    {carrossel.estilo === 'ilustrativo' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase">Alinhamento do Texto</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['topo', 'centro', 'rodape'].map((pos) => (
                            <button key={pos} onClick={() => updateSlideAtual({ posicao_texto: pos })} className={`py-2 px-2 lg:px-3 rounded-lg text-[10px] font-bold uppercase transition-all ${(carrossel.carrossel[slideAtual].posicao_texto || 'centro') === pos ? 'bg-orange-500 text-black' : 'bg-[#111111] border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'}`}>{pos}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {carrossel.estilo === 'ilustrativo' && carrossel.carrossel[slideAtual].tipo === 'cta' && (
                       <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase">Palavra do Comentário</label>
                        <input value={carrossel.palavra_comentario || ''} onChange={e => setCarrossel({...carrossel, palavra_comentario: e.target.value.toUpperCase()})} className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none" />
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      <div className="relative overflow-hidden w-full">
                        <button className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" /> MUDAR FUNDO
                        </button>
                        <input type="file" onChange={handleUploadSlideBg} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <button 
                        onClick={() => updateSlideAtual({ usar_imagem: !carrossel.carrossel[slideAtual].usar_imagem })}
                        className={`w-full font-bold py-3 px-4 rounded-xl text-xs transition-all ${carrossel.carrossel[slideAtual].usar_imagem ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-900 text-gray-500 border border-gray-800'}`}
                      >
                        {carrossel.carrossel[slideAtual].usar_imagem ? 'REMOVER IMAGEM' : 'USAR IMAGEM'}
                      </button>
                    </div>

                    <a href={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} download={`slide-${slideAtual+1}.png`} className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 mt-2">
                      BAIXAR ESTE SLIDE
                    </a>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
