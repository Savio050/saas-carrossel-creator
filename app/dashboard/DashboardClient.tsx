'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Twitter, 
  Image as ImageIcon, 
  User, 
  LogOut, 
  Zap, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Upload
} from 'lucide-react';

interface Slide {
  slide: number;
  texto: string;
  usar_imagem: boolean;
  termo_pesquisa: string;
  imageUrl?: string | null;
  tipo?: string; // 'capa' | 'conteudo' | 'cta'
  layout?: string; // NOVO: 'capa' | 'conteudo_overlay' | 'conteudo_split' | 'cta_minimalista'
}

interface Carrossel {
  tema_principal: string;
  numero_de_slides: number;
  carrossel: Slide[];
  estilo?: string; // 'twitter' | 'ilustrativo'
  palavra_comentario?: string;
}

interface Props {
  user: { email: string; id: string };
  isPro: boolean;
}

export default function DashboardClient({ user, isPro }: Props) {
  const [activeTab, setActiveTab] = useState('twitter');
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrossel, setCarrossel] = useState<Carrossel | null>(null);
  const [error, setError] = useState('');
  const [slideAtual, setSlideAtual] = useState(0);

  // Perfil
  const [nome, setNome] = useState('');
  const [arroba, setArroba] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);

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

  const handleUploadGeneric = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string) => {
    try {
      setFazendoUpload(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        return alert('A imagem deve ter no máximo 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      alert('Erro ao fazer upload da imagem.');
      return null;
    } finally {
      setFazendoUpload(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleUploadGeneric(e, 'avatars');
    if (url) {
      setAvatarUrl(url);
      await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
      alert('Foto de perfil atualizada!');
    }
  };

  const handleUploadSlideBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleUploadGeneric(e, 'fundo-carrossel');
    if (url) {
      updateSlideAtual({ usar_imagem: true, imageUrl: url });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;

    setLoading(true);
    setError('');
    setCarrossel(null);
    setSlideAtual(0);

    const endpoint = activeTab === 'ilustrativo' ? '/api/gerar-ilustrativo' : '/api/gerar-carrossel';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar carrossel');
      
      data.estilo = activeTab;
      setCarrossel(data);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const getSlideImageUrl = (slide: Slide, carrosselData: Carrossel) => {
    const imgParam = slide.imageUrl ? encodeURIComponent(slide.imageUrl) : 'null';
    const nomeParam = encodeURIComponent(nome || 'Sua Marca');
    const arrobaParam = encodeURIComponent(arroba || '@seu_arroba');

    if (carrosselData.estilo === 'ilustrativo') {
      // NOVO: Pega o layout gerado pela IA ou usa o tipo como fallback
      const layoutParam = slide.layout || slide.tipo || 'conteudo_overlay';
      const comParam = encodeURIComponent(carrosselData.palavra_comentario || 'EUQUERO');
      
      // NOVO: Passando o parâmetro &layout=
      return `/api/og-ilustrativo?texto=${encodeURIComponent(slide.texto)}&imageUrl=${imgParam}&marca=${nomeParam}&arroba=${arrobaParam}&layout=${layoutParam}&comentario=${comParam}`;
    }

  const updateSlideAtual = (updates: Partial<Slide>) => {
    if (!carrossel) return;
    const novosSlides = [...carrossel.carrossel];
    novosSlides[slideAtual] = { ...novosSlides[slideAtual], ...updates };
    setCarrossel({ ...carrossel, carrossel: novosSlides });
  };

  const MenuItem = ({ id, label, icon, disabled = false }: { id: string, label: string, icon: any, disabled?: boolean }) => (
    <button
      onClick={() => !disabled && setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
          : disabled ? 'opacity-40 cursor-not-allowed text-gray-500' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {disabled && <Clock className="w-3 h-3 ml-auto opacity-50" />}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#111111] text-gray-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-gray-950 border-r border-gray-900 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black">C</div>
          <h1 className="text-xl font-bold tracking-tight">Carrossel<span className="text-orange-500">Creator</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-4 px-2">Formatos</p>
          <MenuItem id="twitter" label="Twitter Style" icon={<Twitter className="w-5 h-5" />} />
          <MenuItem id="ilustrativo" label="Ilustrativo" icon={<ImageIcon className="w-5 h-5" />} />
          <MenuItem id="video" label="Vídeo (Breve)" icon={<LayoutDashboard className="w-5 h-5" />} disabled />
          
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mt-10 mb-4 px-2">Configurações</p>
          <MenuItem id="perfil" label="Minha Conta" icon={<User className="w-5 h-5" />} />
        </nav>

        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da conta</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
        
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-900 px-8 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
            Dashboard / {activeTab}
          </h2>
          <div className="flex items-center gap-4">
            {isPro && <span className="bg-orange-500/10 text-orange-500 text-[10px] font-bold px-3 py-1 rounded-full border border-orange-500/20">PLANO PRO</span>}
            <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
          
          {/* TELA: PERFIL */}
          {activeTab === 'perfil' && (
            <div className="max-w-2xl bg-gray-950 border border-gray-900 rounded-2xl p-8 space-y-8">
              <h3 className="text-2xl font-bold">Perfil da Marca</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome / Marca</label>
                  <input value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">@ Arroba</label>
                  <input value={arroba} onChange={e => setArroba(e.target.value)} className="w-full bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-8 p-6 bg-[#111111] rounded-2xl border border-gray-800">
                <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-orange-500 relative overflow-hidden group">
                  {avatarUrl && <img src={avatarUrl} className="w-full h-full object-cover" />}
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Upload className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={handleUploadAvatar} />
                  </label>
                </div>
                <div>
                  <h4 className="font-bold">Foto de Perfil</h4>
                  <p className="text-sm text-gray-500">Usado no estilo Twitter. Recomenda-se 400x400.</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                   <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                   <span className="text-sm font-bold">Selo Verificado</span>
                </div>
              </div>

              <button 
                onClick={async () => {
                  setSalvandoPerfil(true);
                  await supabase.from('users').update({ nome, arroba, avatar_url: avatarUrl, is_verified: isVerified }).eq('id', user.id);
                  setSalvandoPerfil(false);
                  alert('Salvo!');
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50"
                disabled={salvandoPerfil}
              >
                {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}

          {/* GERADOR */}
          {(activeTab === 'twitter' || activeTab === 'ilustrativo') && !carrossel && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
              <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 mb-4">
                {activeTab === 'twitter' ? <Twitter className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black">Crie um Carrossel {activeTab === 'twitter' ? 'Viral' : 'Magnético'}</h3>
                <p className="text-gray-500 max-w-md mx-auto">Nossa IA modela o roteiro perfeito e busca imagens de alta qualidade automaticamente.</p>
              </div>

              <form onSubmit={handleGenerate} className="w-full max-w-2xl flex flex-col gap-4">
                <div className="relative group">
                  <input 
                    value={tema} 
                    onChange={e => setTema(e.target.value)}
                    placeholder="Sobre o que vamos falar hoje? Ex: Dicas de produtividade..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-5 text-lg focus:border-orange-500 outline-none transition-all shadow-2xl group-hover:border-gray-700"
                  />
                  <button 
                    disabled={loading}
                    className="absolute right-3 top-3 bottom-3 bg-orange-500 hover:bg-orange-600 text-black px-8 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Zap className="w-5 h-5 animate-pulse" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Gerando...' : 'Criar Agora'}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              </form>
            </div>
          )}

          {/* ESTÚDIO SIDE-BY-SIDE */}
          {carrossel && (activeTab === 'twitter' || activeTab === 'ilustrativo') && (
            <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Lado Esquerdo: Preview Gigante */}
              <div className="flex-1 w-full space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSlideAtual(prev => Math.max(0, prev - 1))} className="p-3 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 disabled:opacity-20" disabled={slideAtual === 0}><ChevronLeft /></button>
                    <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Slide {slideAtual + 1} de {carrossel.numero_de_slides}</span>
                    <button onClick={() => setSlideAtual(prev => Math.min(carrossel.carrossel.length - 1, prev + 1))} className="p-3 bg-gray-900 hover:bg-gray-800 rounded-full border border-gray-800 disabled:opacity-20" disabled={slideAtual === carrossel.carrossel.length - 1}><ChevronRight /></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCarrossel(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">DESCARTAR</button>
                    <button 
                      onClick={() => {
                        carrossel.carrossel.forEach(async (s, i) => {
                          const res = await fetch(getSlideImageUrl(s, carrossel));
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a'); a.href = url; a.download = `slide-${i+1}.png`; a.click();
                        });
                      }}
                      className="bg-white text-black px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> BAIXAR TODOS
                    </button>
                  </div>
                </div>

                <div className="aspect-square w-full max-w-[700px] mx-auto bg-gray-950 rounded-[40px] border border-gray-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                   <img 
                    src={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} 
                    className="w-full h-full object-contain pointer-events-none" 
                    key={`${slideAtual}-${activeTab}`}
                  />
                  <div className="absolute inset-0 border-[16px] border-black/5 rounded-[40px] pointer-events-none" />
                </div>
              </div>

              {/* Lado Direito: Controles */}
              <div className="w-full lg:w-[450px] space-y-6">
                <div className="bg-gray-950 border border-gray-900 rounded-3xl p-8 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Editor de Slide</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase">Texto Principal</label>
                      <textarea 
                        value={carrossel.carrossel[slideAtual].texto}
                        onChange={e => updateSlideAtual({ texto: e.target.value })}
                        className="w-full bg-[#111111] border border-gray-800 rounded-2xl px-5 py-4 text-lg h-48 focus:border-orange-500 outline-none transition-all resize-none"
                      />
                    </div>

                    {carrossel.estilo === 'ilustrativo' && carrossel.carrossel[slideAtual].tipo === 'cta' && (
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase">Palavra-chave do Comentário</label>
                        <input 
                          value={carrossel.palavra_comentario || ''}
                          onChange={e => setCarrossel({...carrossel, palavra_comentario: e.target.value.toUpperCase()})}
                          className="w-full bg-[#111111] border border-gray-800 rounded-xl px-5 py-3 focus:border-orange-500 outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-900 grid grid-cols-2 gap-4">
                      <div className="relative overflow-hidden">
                        <button className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" /> MUDAR FUNDO
                        </button>
                        <input type="file" onChange={handleUploadSlideBg} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <button 
                        onClick={() => updateSlideAtual({ usar_imagem: !carrossel.carrossel[slideAtual].usar_imagem })}
                        className={`font-bold py-3 px-4 rounded-xl text-xs transition-all ${carrossel.carrossel[slideAtual].usar_imagem ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-900 text-gray-500 border border-gray-800'}`}
                      >
                        {carrossel.carrossel[slideAtual].usar_imagem ? 'REMOVER IMAGEM' : 'USAR IMAGEM'}
                      </button>
                    </div>

                    <a 
                      href={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} 
                      download={`slide-${slideAtual+1}.png`}
                      className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    >
                      BAIXAR ESTE SLIDE (PNG)
                    </a>
                  </div>
                </div>

                <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-4">
                  <Zap className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  <div className="pt-4 space-y-2">
  <label className="text-[10px] font-black text-gray-600 uppercase text-gray-400">Posição do Texto</label>
  <div className="grid grid-cols-3 gap-2">
    {['topo', 'centro', 'rodape'].map((pos) => (
      <button
        key={pos}
        onClick={() => updateSlideAtual({ posicao_texto: pos })}
        className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all ${
          (carrossel.carrossel[slideAtual].posicao_texto || 'centro') === pos
            ? 'bg-orange-500 text-black'
            : 'bg-[#111111] border border-gray-800 text-gray-400 hover:border-gray-700'
        }`}
      >
        {pos}
      </button>
    ))}
  </div>
</div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-orange-500 block mb-1">Dica de Especialista:</strong>
                    Carrosséis ilustrativos performam 42% melhor quando a imagem de fundo tem relação direta com a emoção do texto.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
