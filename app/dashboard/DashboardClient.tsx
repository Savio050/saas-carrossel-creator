'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Twitter, Image as ImageIcon, User, LogOut, Zap, Clock, Plus, 
  ChevronLeft, ChevronRight, Download, Upload, Menu, X, Settings2, Trash2, PlusCircle, MinusCircle, Save, Sparkles
} from 'lucide-react';

interface Slide { slide: number; texto: string; usar_imagem: boolean; termo_pesquisa: string; imageUrl?: string | null; tipo?: string; layout?: string; posicao_texto?: string; }
interface Carrossel { tema_principal: string; numero_de_slides: number; carrossel: Slide[]; estilo?: string; palavra_comentario?: string; }
interface Props { user: { email: string; id: string }; isPro: boolean; }

const FONTES_DISPONEIS = ['Montserrat', 'Open Sans', 'Nunito Sans', 'League Spartan', 'Kalam', 'Poppins', 'Anton', 'Bebas Neue'];

const TEMPLATES_PADRAO = [
  { id: 'business', icon: '💼', nome: 'Negócios & Cases', prompt: 'Você é um estrategista de negócios experiente. Crie um carrossel analisando casos reais de empresas, focando em lucros, estratégias de marketing e modelos de negócios inovadores.' },
  { id: 'noticias', icon: '📰', nome: 'Notícias (Urgente)', prompt: 'Você é um jornalista dinâmico. Transforme esta notícia em um carrossel de alto impacto, direto ao ponto, com manchetes escandalosas e foco no que isso impacta a vida do leitor.' },
  { id: 'social_media', icon: '📱', nome: 'Social Media', prompt: 'Você é um especialista em tráfego e criação de conteúdo. Escreva um carrossel dando dicas acionáveis, ferramentas secretas e hacks de algoritmo para crescer no Instagram e TikTok.' },
  { id: 'esportes', icon: '⚽', nome: 'Futebol & Esportes', prompt: 'Você é um comentarista esportivo passional. Crie um carrossel com análises táticas, fofocas de vestiário e opiniões polêmicas sobre o mundo do futebol.' },
  { id: 'custom', icon: '✨', nome: 'Meu Modelo Customizado', prompt: 'Escreva um carrossel viral com um tom provocativo e bem-humorado.' }
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
  
  const [templateAtivo, setTemplateAtivo] = useState(TEMPLATES_PADRAO[0]);
  const [customPromptText, setCustomPromptText] = useState(TEMPLATES_PADRAO[4].prompt);

  const [configTwitter, setConfigTwitter] = useState({
    temaVisor: 'light', 
    imagens: 'aleatorio', 
    numSlides: '10'
  });

  // CONFIGURAÇÕES COMPLETAS DO ILUSTRATIVO RESTAURADAS
  const [config, setConfig] = useState({
    capa: { fonte: 'Montserrat', tamanho: 'gigante' },
    cards: { fonte: 'Open Sans', tamanho: 'padrao' },
    cta: { fonte: 'League Spartan', tamanho: 'grande' }
  });

  const [nome, setNome] = useState('');
  const [arroba, setArroba] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const carregarTudo = async () => {
      const { data } = await supabase.from('users').select('nome, arroba, avatar_url, is_verified').eq('id', user.id).single();
      if (data) { setNome(data.nome || ''); setArroba(data.arroba || ''); setAvatarUrl(data.avatar_url || ''); setIsVerified(data.is_verified || false); }
      const savedConfig = localStorage.getItem('configIlustrativo');
      if (savedConfig) setConfig(JSON.parse(savedConfig));
      const savedTwConfig = localStorage.getItem('configTwitter');
      if (savedTwConfig) setConfigTwitter(JSON.parse(savedTwConfig));
      const savedCustomPrompt = localStorage.getItem('customPrompt');
      if (savedCustomPrompt) setCustomPromptText(savedCustomPrompt);
    };
    carregarTudo();
  }, [supabase, user.id]);

  useEffect(() => { if (carrossel) setImgLoading(true); }, [slideAtual, carrossel, config, configTwitter]);

  const salvarConfiguracoesGlobais = () => {
    localStorage.setItem('configIlustrativo', JSON.stringify(config));
    localStorage.setItem('configTwitter', JSON.stringify(configTwitter));
    localStorage.setItem('customPrompt', customPromptText);
    alert('Todas as predefinições foram salvas!');
    setShowSettings(false);
  };

  const handleUploadGeneric = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string) => {
    try {
      setFazendoUpload(true);
      if (!event.target.files || event.target.files.length === 0) return null;
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { alert('Máximo 5MB.'); return null; }

      const apiKey = "d08afd1a36de9640074b348b1820cfbd"; 
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', apiKey);

      const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) return data.data.url; 
      else { alert('Erro ImgBB: ' + (data.error?.message || 'Desconhecido')); return null; }
    } catch (error) { alert('Erro no upload.'); return null; } finally { setFazendoUpload(false); event.target.value = ''; }
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
    const promptDefinitivo = templateAtivo.id === 'custom' ? customPromptText : templateAtivo.prompt;

    try {
      const res = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          tema,
          modeloPrompt: promptDefinitivo,
          // CORREÇÃO: Impede que o Ilustrativo puxe a configuração "Sem Imagens" do Twitter
          configImagem: activeTab === 'twitter' ? configTwitter.imagens : 'aleatorio',
          numSlides: activeTab === 'twitter' ? parseInt(configTwitter.numSlides) : 10
        }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      data.estilo = activeTab; 
      setCarrossel(data);
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
      let fontParam = config.cards.fonte; let sizeParam = config.cards.tamanho;
      
      if (layoutParam === 'capa' || slide.tipo === 'capa') { fontParam = config.capa.fonte; sizeParam = config.capa.tamanho; } 
      else if (layoutParam.includes('cta') || slide.tipo === 'cta') { fontParam = config.cta.fonte; sizeParam = config.cta.tamanho; }

      return `/api/og-ilustrativo?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&marca=${nomeParam}&arroba=${arrobaParam}&layout=${layoutParam}&comentario=${comParam}&posicao=${posParam}&fonte=${encodeURIComponent(fontParam)}&tamanho=${sizeParam}`;
    }

    const avatarParam = encodeURIComponent(avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png');
    return `/api/og-image?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&nome=${nomeParam}&arroba=${arrobaParam}&avatar=${avatarParam}&verified=${isVerified}&tema=${configTwitter.temaVisor}`;
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
        </header>

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          
          {activeTab === 'perfil' && (
            <div className="max-w-4xl bg-gray-950 border border-gray-900 rounded-2xl p-6 lg:p-8 space-y-8">
              <h3 className="text-2xl font-bold">Configurações da Conta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-white" />
                <input value={arroba} onChange={e => setArroba(e.target.value)} placeholder="@arroba" className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <button onClick={() => { setSalvandoPerfil(true); supabase.from('users').update({ nome, arroba, avatar_url: avatarUrl, is_verified: isVerified }).eq('id', user.id).then(() => { setSalvandoPerfil(false); alert('Salvo!'); }) }} className="bg-orange-500 text-black font-bold px-8 py-3 rounded-xl">Salvar Perfil</button>
            </div>
          )}

          {(activeTab === 'twitter' || activeTab === 'ilustrativo') && !carrossel && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 py-10">
              <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 mb-2">
                {activeTab === 'twitter' ? <Twitter className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
              </div>
              <h3 className="text-3xl font-black">Carrossel {activeTab === 'twitter' ? 'Viral Twitter' : 'Ilustrativo'}</h3>
              
              <div className="w-full max-w-4xl flex flex-col gap-6 px-4">
                <form onSubmit={handleGenerate} className="flex gap-2">
                  <div className="relative group flex-1">
                    <input 
                      value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: O segredo por trás do sucesso da..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-5 pr-40 text-lg focus:border-orange-500 outline-none transition-all shadow-2xl"
                    />
                    <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 bg-orange-500 text-black px-8 rounded-xl font-bold flex items-center gap-2">
                      {loading ? <Zap className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />} {loading ? 'Gerando...' : 'Criar'}
                    </button>
                  </div>
                  <button type="button" onClick={() => setShowSettings(!showSettings)} className={`px-4 rounded-2xl border ${showSettings ? 'bg-gray-800 border-orange-500 text-orange-500' : 'bg-gray-950 border-gray-800 text-gray-400'}`}><Settings2 /></button>
                </form>

                <div className="text-left mt-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Modelos de IA (Selecione o Nicho)</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {TEMPLATES_PADRAO.map(tpl => (
                      <button 
                        key={tpl.id} onClick={() => setTemplateAtivo(tpl)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl border flex items-center gap-2 transition-all ${templateAtivo.id === tpl.id ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                      >
                        <span className="text-lg">{tpl.icon}</span> <span className="font-semibold text-sm whitespace-nowrap">{tpl.nome}</span>
                      </button>
                    ))}
                  </div>
                  
                  {templateAtivo.id === 'custom' && (
                    <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                      <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Edite as instruções do seu modelo</label>
                      <textarea value={customPromptText} onChange={e => setCustomPromptText(e.target.value)} className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-orange-500 outline-none h-24 resize-none" />
                    </div>
                  )}
                </div>

                {showSettings && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left animate-in fade-in slide-in-from-top-2 mt-2 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                      <h4 className="font-bold text-lg text-white">Predefinições ({activeTab})</h4>
                      <button onClick={salvarConfiguracoesGlobais} className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Salvar Padrões</button>
                    </div>

                    {activeTab === 'twitter' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase">Tema do Card</label>
                          <select value={configTwitter.temaVisor} onChange={e => setConfigTwitter({...configTwitter, temaVisor: e.target.value})} className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-sm">
                            <option value="light">Claro (Fundo Branco)</option><option value="dark">Escuro (Fundo Preto)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase">Frequência de Imagens</label>
                          <select value={configTwitter.imagens} onChange={e => setConfigTwitter({...configTwitter, imagens: e.target.value})} className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-sm">
                            <option value="aleatorio">Alguns Cards (Aleatório)</option><option value="sempre">Em Todos os Cards</option><option value="nunca">Sem Imagens (Apenas Texto)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase">Número Alvo de Slides</label>
                          <input type="number" min="5" max="20" value={configTwitter.numSlides} onChange={e => setConfigTwitter({...configTwitter, numSlides: e.target.value})} className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-sm" />
                        </div>
                      </div>
                    )}

                    {activeTab === 'ilustrativo' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* RESTAURADO: BLOCO CAPA COMPLETO */}
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

                        {/* RESTAURADO: BLOCO CARDS COMPLETO */}
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

                        {/* RESTAURADO: BLOCO CTA COMPLETO */}
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
                    )}
                  </div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </div>
          )}

          {/* ESTÚDIO (EXIBIÇÃO DOS SLIDES GERADOS) */}
          {carrossel && (
            <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start animate-in fade-in">
              <div className="flex-1 w-full space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <button onClick={() => setSlideAtual(prev => Math.max(0, prev - 1))} className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 disabled:opacity-20"><ChevronLeft/></button>
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Slide {slideAtual + 1} de {carrossel.numero_de_slides}</span>
                    <button onClick={() => setSlideAtual(prev => Math.min(carrossel.carrossel.length - 1, prev + 1))} className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 disabled:opacity-20"><ChevronRight/></button>
                  </div>
                  <button onClick={() => setCarrossel(null)} className="px-6 py-2 bg-red-950/30 text-red-500 rounded-lg text-xs font-bold">FECHAR CARROSSEL</button>
                </div>

                <div className="aspect-square w-full max-w-[700px] mx-auto bg-gray-950 rounded-[40px] shadow-2xl relative overflow-hidden">
                  {imgLoading && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
                  <img 
                    src={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} 
                    className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`} 
                    onLoad={() => setImgLoading(false)}
                    onError={() => { setImgLoading(false); if (carrossel.carrossel[slideAtual].usar_imagem) updateSlideAtual({ usar_imagem: false }); }}
                    key={`${slideAtual}-${carrossel.carrossel[slideAtual].usar_imagem}-${configTwitter.temaVisor}-${carrossel.carrossel[slideAtual].posicao_texto}`}
                  />
                </div>
              </div>

              {/* EDITOR LATERAL RESTAURADO */}
              <div className="w-full xl:w-[450px] space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={adicionarSlide} className="bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold py-3 rounded-xl text-xs flex justify-center items-center gap-2"><PlusCircle className="w-4 h-4"/> ADD SLIDE</button>
                  <button onClick={removerSlide} className="bg-red-950/20 text-red-400 font-bold py-3 rounded-xl text-xs flex justify-center items-center gap-2"><MinusCircle className="w-4 h-4"/> REMOVER</button>
                </div>

                <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-xl space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Texto do Slide</label>
                  <textarea value={carrossel.carrossel[slideAtual].texto} onChange={e => updateSlideAtual({ texto: e.target.value })} className="w-full bg-[#111] border border-gray-800 rounded-xl p-4 text-base h-32 focus:border-orange-500 outline-none resize-none" />
                  
                  {/* RESTAURADO: BOTÕES DE POSIÇÃO DO TEXTO E PALAVRA DO COMENTÁRIO */}
                  {activeTab === 'ilustrativo' && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase">Alinhamento do Texto</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['topo', 'centro', 'rodape'].map((pos) => (
                            <button key={pos} onClick={() => updateSlideAtual({ posicao_texto: pos })} className={`py-2 px-2 lg:px-3 rounded-lg text-[10px] font-bold uppercase transition-all ${(carrossel.carrossel[slideAtual].posicao_texto || 'centro') === pos ? 'bg-orange-500 text-black' : 'bg-[#111111] border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'}`}>{pos}</button>
                          ))}
                        </div>
                      </div>

                      {carrossel.carrossel[slideAtual].tipo === 'cta' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-600 uppercase">Palavra do Comentário</label>
                          <input value={carrossel.palavra_comentario || ''} onChange={e => setCarrossel({...carrossel, palavra_comentario: e.target.value.toUpperCase()})} className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="relative w-full">
                      <button className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-xs flex justify-center items-center gap-2"><Upload className="w-4 h-4"/> {fazendoUpload ? '...' : 'UPLOAD'}</button>
                      <input type="file" onChange={handleUploadSlideBg} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <button onClick={() => updateSlideAtual({ usar_imagem: false, imageUrl: null })} className="w-full bg-red-950/20 text-red-400 font-bold py-3 rounded-xl text-xs flex justify-center items-center gap-2"><Trash2 className="w-4 h-4"/> TIRAR IMAGEM</button>
                  </div>

                  <a href={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} download={`slide-${slideAtual+1}.png`} className="block text-center w-full bg-orange-500 text-black font-black py-4 rounded-xl mt-4">BAIXAR SLIDE</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
