'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Twitter, Image as ImageIcon, User, LogOut, ChevronLeft, ChevronRight,
  Download, Upload, Menu, X, Settings2, Trash2, PlusCircle, MinusCircle,
  Save, Sparkles, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2,
  Check, Quote, ListChecks, Zap, Plus,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────
type FormatoAtivo = 'twitter' | 'ilustrativo' | 'citacao' | 'checklist' | 'perfil';
type ModeloIA = 'aesthetic_minimalist' | 'clean_corporate' | 'dynamic_sports' | 'minimalist_editorial';

interface Slide {
  slide: number;
  texto: string;
  usar_imagem: boolean;
  termo_pesquisa: string;
  imageUrl?: string | null;
  tipo?: string;
  layout?: string;
  posicao_texto?: string;
  cor_texto_slide?: string;
  fonte_slide?: string;
  toggle_fade?: boolean;
  toggle_marca_dagua?: boolean;
  texto_citacao?: string;
  autor?: string;
  titulo?: string;
  palavra_destaque?: string;
  alinhamento?: string;
  passos?: string[];
}

interface Carrossel {
  tema_principal: string;
  numero_de_slides: number;
  carrossel: Slide[];
  estilo?: string;
  palavra_comentario?: string;
}

interface Props { user: { email: string; id: string }; isPro: boolean; }

interface ConfigGlobal {
  modelo_ia: ModeloIA;
  cor_primaria_marca: string;
  cor_texto_global: string;
  num_slides: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────
const FONTES_DISPONEIS = ['Montserrat', 'Open Sans', 'Nunito Sans', 'League Spartan', 'Kalam', 'Poppins', 'Anton', 'Bebas Neue'];

const MODELOS_IA: { id: ModeloIA; nome: string; ref: string; descricao: string; img: string; corDefault: string }[] = [
  { id: 'aesthetic_minimalist', nome: 'Aesthetic Minimalist', ref: '@hyeser',               descricao: 'Frases de impacto. Espaço vazio como linguagem.',    img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80', corDefault: '#18181B' },
  { id: 'clean_corporate',      nome: 'Clean Corporate',      ref: '@academiabrsocialmedia', descricao: 'Estrutura, valor técnico e autoridade.',              img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', corDefault: '#1E40AF' },
  { id: 'dynamic_sports',       nome: 'Dynamic Sports',       ref: '@futebolinterativobr',   descricao: 'Alta energia, drama e urgência visceral.',            img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80', corDefault: '#DC2626' },
  { id: 'minimalist_editorial', nome: 'Minimalist Editorial', ref: '@thenews.cc',            descricao: 'Jornalismo limpo. Fatos que retêm atenção.',          img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80', corDefault: '#1F2937' },
];

// ── Nichos Twitter ─────────────────────────────────────────────────────────
// Cada nicho embute um prompt de sistema específico para o Gemini.
// Requer a coluna `saved_prompts JSONB DEFAULT '[]'` na tabela `users` do Supabase.
// SQL: ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_prompts JSONB DEFAULT '[]';
const NICHES_TWITTER: { id: string; label: string; img: string; prompt: string }[] = [
  {
    id: 'negocios',
    label: 'Negócios',
    img: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um especialista em negócios, empreendedorismo e estratégia empresarial. Crie carrosséis virais sobre cases reais de sucesso e fracasso de empresas, estratégias de crescimento, liderança e mindset executivo. Cada slide deve entregar um insight concreto que um CEO ou empreendedor usaria imediatamente. Use dados reais, nomes de empresas conhecidas e situações concretas. Tom: direto, impactante, baseado em evidências.',
  },
  {
    id: 'noticias',
    label: 'Notícias',
    img: 'https://images.pexels.com/photos/4617292/pexels-photo-4617292.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um jornalista digital especialista em transformar notícias complexas em conteúdo viral. Explique os fatos com precisão e gancho progressivo. Cada slide deve revelar um novo detalhe que prende o leitor. Use a técnica "revelação progressiva" — cada slide é mais impactante que o anterior. Tom: jornalístico, imparcial, manchete que gera curiosidade imediata.',
  },
  {
    id: 'economia',
    label: 'Economia',
    img: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um economista que sabe simplificar conceitos complexos para o público geral. Crie carrosséis sobre economia, mercado financeiro, inflação, investimentos e tendências econômicas. Use analogias do cotidiano para explicar conceitos técnicos. Cada slide deve fazer o leitor entender algo que parecia complicado. Use dados reais e percentuais concretos. Tom: educativo, acessível, baseado em números.',
  },
  {
    id: 'futebol',
    label: 'Futebol',
    img: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um jornalista esportivo apaixonado com conhecimento profundo de táticas, história e bastidores do futebol. Crie carrosséis sobre análises táticas, histórias épicas de jogos, revelações de bastidores, carreiras de jogadores e curiosidades que poucos sabem. Tom: dramático, apaixonado, com doses de intensidade. Use estatísticas e números para embasar cada afirmação.',
  },
  {
    id: 'socialmedia',
    label: 'Social Media',
    img: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um expert em social media, algoritmos e crescimento orgânico. Crie carrosséis sobre estratégias reais de crescimento nas redes sociais, como o algoritmo funciona, erros que matam o engajamento e táticas que os maiores criadores usam. Tom: prático, direto ao ponto, baseado em dados. Cada slide deve ser uma dica acionável que o leitor pode aplicar hoje.',
  },
  {
    id: 'historia',
    label: 'História',
    img: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um historiador apaixonado que sabe contar histórias de forma cinematográfica. Crie carrosséis sobre eventos históricos fascinantes, personagens controversos, segredos que os livros escondem e paralelos entre o passado e o presente. Tom: narrativo, dramático, revelador. Cada slide deve sentir como uma cena de um documentário da Netflix.',
  },
  {
    id: 'tecnologia',
    label: 'Tecnologia',
    img: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um tech writer especialista em tornar tecnologia acessível e fascinante. Crie carrosséis sobre IA, inovações disruptivas, startups que vão mudar o mundo e a tecnologia por trás das coisas que usamos todo dia. Tom: entusiasmado, educativo, com visão de futuro. Use exemplos concretos e explique o impacto real na vida das pessoas.',
  },
  {
    id: 'moda',
    label: 'Moda',
    img: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um editor de moda com olhar aguçado para tendências e cultura. Crie carrosséis sobre tendências que vão dominar a temporada, a história por trás de peças icônicas, dicas de styling que democratizam a moda e os bastidores da indústria fashion. Tom: sofisticado mas acessível, visual e inspirador. Faça o leitor sentir que está descobrindo segredos do mundo da moda.',
  },
  {
    id: 'academia',
    label: 'Academia',
    img: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um personal trainer e nutricionista especialista em alta performance. Crie carrosséis sobre treinos eficientes, nutrição baseada em ciência, recuperação e mentalidade de atleta. Desminta mitos comuns da academia com evidências científicas. Tom: motivador, baseado em ciência, prático. Cada slide deve ser uma revelação ou dica que o leitor aplica no próximo treino.',
  },
  {
    id: 'politica',
    label: 'Política',
    img: 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=600',
    prompt: 'Você é um analista político que traduz política complexa para o cidadão comum. Crie carrosséis sobre votações, projetos de lei, bastidores do poder, histórias de ascensão e queda de líderes e conexões que a mídia não mostra. Tom: analítico, imparcial, revelador. Explique "o que isso significa para você" em cada slide.',
  },
];

const FORMATO_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  twitter:    { label: 'Twitter Style',  icon: <Twitter className="w-5 h-5" />,    desc: 'Cards no estilo tweet, personalizados com seu perfil.' },
  ilustrativo:{ label: 'Ilustrativo',    icon: <ImageIcon className="w-5 h-5" />,  desc: 'Imagem de fundo com texto sobreposto cinematográfico.' },
  citacao:    { label: 'Citação',        icon: <Quote className="w-5 h-5" />,      desc: 'Aspas gigantes, frase central de impacto e autor.' },
  checklist:  { label: 'Checklist',      icon: <ListChecks className="w-5 h-5" />, desc: 'Passos numerados ou itens com estrutura de lista.' },
};

// ── Componente Principal ───────────────────────────────────────────────────
export default function DashboardClient({ user, isPro }: Props) {
  const [activeTab, setActiveTab]             = useState<FormatoAtivo>('twitter');
  const [tema, setTema]                       = useState('');
  const [loading, setLoading]                 = useState(false);
  const [carrossel, setCarrossel]             = useState<Carrossel | null>(null);
  const [error, setError]                     = useState('');
  const [slideAtual, setSlideAtual]           = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imgLoading, setImgLoading]           = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [selectedNicheId, setSelectedNicheId]   = useState<string | null>(null);
  const [savedPrompts, setSavedPrompts]         = useState<{ id: string; name: string; prompt: string }[]>([]);
  const [showSaveModal, setShowSaveModal]       = useState(false);
  const [newPromptName, setNewPromptName]       = useState('');
  const [savingPrompt, setSavingPrompt]         = useState(false);
  const [downloadingAll, setDownloadingAll]     = useState(false);

  const [configTwitter, setConfigTwitter] = useState({ temaVisor: 'light', imagens: 'aleatorio', numSlides: '10' });

  const [config, setConfig] = useState({
    capa:  { fonte: 'Montserrat',    tamanho: 'gigante' },
    cards: { fonte: 'Open Sans',     tamanho: 'padrao'  },
    cta:   { fonte: 'League Spartan', tamanho: 'grande' },
  });

  const [configGlobal, setConfigGlobal] = useState<ConfigGlobal>({
    modelo_ia: 'aesthetic_minimalist',
    cor_primaria_marca: '#18181B',
    cor_texto_global: '#FFFFFF',
    num_slides: 10,
  });

  const [nome, setNome]                           = useState('');
  const [arroba, setArroba]                       = useState('');
  const [avatarUrl, setAvatarUrl]                 = useState('');
  const [isVerified, setIsVerified]               = useState(false);
  const [salvandoPerfil, setSalvandoPerfil]       = useState(false);
  const [fazendoUpload, setFazendoUpload]         = useState(false);
  const [senhaAtual, setSenhaAtual]               = useState('');
  const [novaSenha, setNovaSenha]                 = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual]       = useState(false);
  const [showNovaSenha, setShowNovaSenha]         = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [alterandoSenha, setAlterandoSenha]       = useState(false);
  const [senhaErro, setSenhaErro]                 = useState('');
  const [senhaSucesso, setSenhaSucesso]           = useState(false);

  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('users').select('nome, arroba, avatar_url, is_verified, saved_prompts').eq('id', user.id).single();
      if (data) {
        setNome(data.nome || '');
        setArroba(data.arroba || '');
        setAvatarUrl(data.avatar_url || '');
        setIsVerified(data.is_verified || false);
        if (Array.isArray(data.saved_prompts)) setSavedPrompts(data.saved_prompts);
      }
      const sc = localStorage.getItem('configIlustrativo'); if (sc) setConfig(JSON.parse(sc));
      const st = localStorage.getItem('configTwitter');     if (st) setConfigTwitter(JSON.parse(st));
      const sp = localStorage.getItem('customPrompt');      if (sp) setCustomPromptText(sp);
      const sg = localStorage.getItem('configGlobal');      if (sg) setConfigGlobal(JSON.parse(sg));
    };
    load();
  }, [supabase, user.id]);

  useEffect(() => { if (carrossel) setImgLoading(true); }, [slideAtual, carrossel, config, configTwitter, configGlobal]);

  const getSenhaStrength = (p: string) => {
    if (!p) return { score: 0, label: '', color: 'bg-white/10' };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { score: 1, label: 'Fraca', color: 'bg-red-500' };
    if (s === 2) return { score: 2, label: 'Média', color: 'bg-yellow-500' };
    return { score: 3, label: 'Forte', color: 'bg-green-400' };
  };
  const senhaRules = [
    { label: 'Mínimo 8 caracteres',    ok: novaSenha.length >= 8 },
    { label: 'Maiúsculas e minúsculas', ok: /[A-Z]/.test(novaSenha) && /[a-z]/.test(novaSenha) },
    { label: 'Pelo menos um número',   ok: /[0-9]/.test(novaSenha) },
    { label: 'Caractere especial',     ok: /[^A-Za-z0-9]/.test(novaSenha) },
  ];

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault(); setSenhaErro(''); setSenhaSucesso(false);
    if (novaSenha.length < 8) { setSenhaErro('Mínimo 8 caracteres.'); return; }
    if (novaSenha !== confirmarNovaSenha) { setSenhaErro('As senhas não coincidem.'); return; }
    setAlterandoSenha(true);
    try {
      const { error: re } = await supabase.auth.signInWithPassword({ email: user.email, password: senhaAtual });
      if (re) { setSenhaErro('Senha atual incorreta.'); return; }
      const { error: ue } = await supabase.auth.updateUser({ password: novaSenha });
      if (ue) throw ue;
      setSenhaSucesso(true); setSenhaAtual(''); setNovaSenha(''); setConfirmarNovaSenha('');
      setTimeout(() => setSenhaSucesso(false), 5000);
    } catch (err: unknown) { setSenhaErro(err instanceof Error ? err.message : 'Erro ao alterar senha.'); }
    finally { setAlterandoSenha(false); }
  };

  const handleUploadGeneric = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setFazendoUpload(true);
      if (!e.target.files?.length) return null;
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { alert('Máximo 5MB.'); return null; }
      const fd = new FormData(); fd.append('image', file); fd.append('key', 'd08afd1a36de9640074b348b1820cfbd');
      const res  = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
      const data = await res.json();
      return data.success ? (data.data.url as string) : null;
    } catch { return null; } finally { setFazendoUpload(false); e.target.value = ''; }
  };

  const handleUploadAvatar   = async (e: React.ChangeEvent<HTMLInputElement>) => { const u = await handleUploadGeneric(e); if (u) { setAvatarUrl(u); await supabase.from('users').update({ avatar_url: u }).eq('id', user.id); } };
  const handleUploadSlideBg  = async (e: React.ChangeEvent<HTMLInputElement>) => { const u = await handleUploadGeneric(e); if (u) updateSlideAtual({ usar_imagem: true, imageUrl: u }); };

  const handleSavePrompt = async () => {
    if (!newPromptName.trim() || !customPromptText.trim()) return;
    setSavingPrompt(true);
    const newEntry = { id: crypto.randomUUID(), name: newPromptName.trim(), prompt: customPromptText.trim() };
    const updated  = [...savedPrompts, newEntry];
    try {
      await supabase.from('users').update({ saved_prompts: updated } as never).eq('id', user.id);
      setSavedPrompts(updated);
      setNewPromptName('');
      setShowSaveModal(false);
    } catch { /* silently ignore if column doesn't exist yet */ }
    finally { setSavingPrompt(false); }
  };

  const handleDeletePrompt = async (id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id);
    await supabase.from('users').update({ saved_prompts: updated } as never).eq('id', user.id);
    setSavedPrompts(updated);
    if (selectedNicheId === `custom:${id}`) setSelectedNicheId(null);
  };

  const handleDownloadAll = async () => {
    if (!carrossel) return;
    setDownloadingAll(true);
    for (let i = 0; i < carrossel.carrossel.length; i++) {
      const url = getSlideImageUrl(carrossel.carrossel[i], carrossel);
      try {
        const res  = await fetch(url);
        const blob = await res.blob();
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = `slide-${i + 1}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch { /* skip on error */ }
      await new Promise(r => setTimeout(r, 400));
    }
    setDownloadingAll(false);
  };

  const salvarConfiguracoesGlobais = () => {
    localStorage.setItem('configIlustrativo', JSON.stringify(config));
    localStorage.setItem('configTwitter', JSON.stringify(configTwitter));
    localStorage.setItem('customPrompt', customPromptText);
    localStorage.setItem('configGlobal', JSON.stringify(configGlobal));
    setShowSettings(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    setLoading(true); setError(''); setCarrossel(null); setSlideAtual(0); setShowSettings(false);
    const eps: Record<string, string> = { twitter: '/api/gerar-carrossel', ilustrativo: '/api/gerar-ilustrativo', citacao: '/api/gerar-citacao', checklist: '/api/gerar-checklist' };
    try {
      const res = await fetch(eps[activeTab] || '/api/gerar-carrossel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema,
          modelo_ia: configGlobal.modelo_ia,
          formato: activeTab,
          configImagem: activeTab === 'twitter' ? configTwitter.imagens : 'aleatorio',
          numSlides: activeTab === 'twitter' ? parseInt(configTwitter.numSlides) : configGlobal.num_slides,
          customPrompt: (() => {
            if (activeTab === 'twitter') {
              // Prompt personalizado do usuário tem prioridade máxima
              if (showCustomPrompt && customPromptText) return customPromptText;
              // GEM salvo selecionado
              if (selectedNicheId?.startsWith('custom:')) {
                const id = selectedNicheId.replace('custom:', '');
                return savedPrompts.find(p => p.id === id)?.prompt;
              }
              // Nicho pré-definido
              if (selectedNicheId) return NICHES_TWITTER.find(n => n.id === selectedNicheId)?.prompt;
              return undefined;
            }
            return showCustomPrompt && customPromptText ? customPromptText : undefined;
          })(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      data.estilo = activeTab;
      setCarrossel(data);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro inesperado'); }
    finally { setLoading(false); }
  };

  const getSlideImageUrl = (slide: Slide, cd: Carrossel) => {
    const img      = (slide.usar_imagem && slide.imageUrl) ? encodeURIComponent(slide.imageUrl) : 'null';
    const nomeP    = encodeURIComponent(nome   || 'Sua Marca');
    const arrobaP  = encodeURIComponent(arroba || '@seu_arroba');
    const modelo   = configGlobal.modelo_ia;
    const corP     = encodeURIComponent(configGlobal.cor_primaria_marca);
    const corT     = encodeURIComponent(slide.cor_texto_slide || configGlobal.cor_texto_global);
    const fade     = slide.toggle_fade     !== undefined ? slide.toggle_fade     : true;
    const wm       = slide.toggle_marca_dagua !== undefined ? slide.toggle_marca_dagua : true;

    if (cd.estilo === 'ilustrativo') {
      const layout = slide.layout || slide.tipo || 'conteudo_overlay';
      const com    = encodeURIComponent(cd.palavra_comentario || 'EUQUERO');
      const pos    = slide.posicao_texto || 'centro';
      let font = config.cards.fonte; let sz = config.cards.tamanho;
      if (layout === 'capa' || slide.tipo === 'capa')               { font = config.capa.fonte;  sz = config.capa.tamanho;  }
      else if (layout.includes('cta') || slide.tipo === 'cta')      { font = config.cta.fonte;   sz = config.cta.tamanho;   }
      const f = slide.fonte_slide || font;
      const tit  = encodeURIComponent(slide.titulo || slide.texto || '');
      const dest = encodeURIComponent(slide.palavra_destaque || '');
      const txt  = encodeURIComponent(slide.texto || '');
      return `/api/og-ilustrativo?titulo=${tit}&destaque=${dest}&texto=${txt}&imageUrl=${img}&marca=${nomeP}&arroba=${arrobaP}&layout=${layout}&comentario=${com}&posicao=${pos}&fonte=${encodeURIComponent(f)}&tamanho=${sz}&modelo=${modelo}&corPrimaria=${corP}&corTexto=${corT}&fade=${fade}&watermark=${wm}`;
    }
    if (cd.estilo === 'citacao') {
      const tq = encodeURIComponent(slide.texto_citacao || slide.texto || '');
      const au = encodeURIComponent(slide.autor || '');
      return `/api/og-citacao?texto=${tq}&autor=${au}&modelo=${modelo}&corPrimaria=${corP}&arroba=${arrobaP}&watermark=${wm}`;
    }
    if (cd.estilo === 'checklist') {
      const tt = encodeURIComponent(slide.titulo || slide.texto || '');
      const ps = encodeURIComponent(JSON.stringify(slide.passos || []));
      const tp = encodeURIComponent(slide.tipo || 'conteudo');
      return `/api/og-checklist?titulo=${tt}&passos=${ps}&tipo=${tp}&modelo=${modelo}&corPrimaria=${corP}&arroba=${arrobaP}&watermark=${wm}`;
    }
    const av = encodeURIComponent(avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png');
    return `/api/og-image?texto=${encodeURIComponent(slide.texto)}&imageUrl=${img}&nome=${nomeP}&arroba=${arrobaP}&avatar=${av}&verified=${isVerified}&tema=${configTwitter.temaVisor}`;
  };

  const updateSlideAtual = (updates: Partial<Slide>) => {
    if (!carrossel) return;
    const s = [...carrossel.carrossel];
    s[slideAtual] = { ...s[slideAtual], ...updates };
    setCarrossel({ ...carrossel, carrossel: s });
  };

  const adicionarSlide = () => {
    if (!carrossel) return;
    const s = [...carrossel.carrossel];
    s.splice(slideAtual + 1, 0, { slide: s.length + 1, texto: 'Novo slide...', usar_imagem: false, termo_pesquisa: '', imageUrl: null, tipo: 'conteudo', layout: 'conteudo_overlay', titulo: 'Novo título', passos: ['Primeiro passo'] });
    setCarrossel({ ...carrossel, numero_de_slides: s.length, carrossel: s });
    setSlideAtual(slideAtual + 1);
  };

  const removerSlide = () => {
    if (!carrossel) return;
    if (carrossel.carrossel.length <= 1) return alert('Mínimo 1 slide.');
    if (!window.confirm('Excluir este slide?')) return;
    const s = [...carrossel.carrossel]; s.splice(slideAtual, 1);
    setCarrossel({ ...carrossel, numero_de_slides: s.length, carrossel: s });
    if (slideAtual >= s.length) setSlideAtual(s.length - 1);
  };

  const updatePassoSlide = (idx: number, val: string) => {
    const ps = [...(carrossel?.carrossel[slideAtual].passos || [])];
    ps[idx] = val; updateSlideAtual({ passos: ps });
  };
  const adicionarPasso = () => updateSlideAtual({ passos: [...(carrossel?.carrossel[slideAtual].passos || []), 'Novo item...'] });
  const removerPasso   = (idx: number) => updateSlideAtual({ passos: (carrossel?.carrossel[slideAtual].passos || []).filter((_, i) => i !== idx) });

  const MenuItem = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => { setActiveTab(id as FormatoAtivo); setIsMobileMenuOpen(false); setCarrossel(null); setShowSettings(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm border ${activeTab === id ? 'bg-white/10 text-white border-white/10' : 'text-white/40 hover:bg-white/5 hover:text-white/70 border-transparent'}`}
    >
      {icon}<span className="font-light">{label}</span>
    </button>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 15% 25%, rgba(99,102,241,0.06) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(16,185,129,0.04) 0%, transparent 55%), #08080f' }}
    >
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col p-5 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-white/5 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'rgba(8,8,15,0.9)', backdropFilter: 'blur(24px)' }}
      >
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/8 border border-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-xs leading-none">C</span>
            </div>
            <span className="text-sm font-light tracking-tight text-white/80">Carrossel<span className="font-semibold">Creator</span></span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-white/30 hover:text-white/70"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-white/20 font-medium mb-3 px-3">Formatos</p>
          <MenuItem id="twitter"     label="Twitter Style" icon={<Twitter className="w-4 h-4" />} />
          <MenuItem id="ilustrativo" label="Ilustrativo"   icon={<ImageIcon className="w-4 h-4" />} />
          <MenuItem id="citacao"     label="Citação"       icon={<Quote className="w-4 h-4" />} />
          <MenuItem id="checklist"   label="Checklist"     icon={<ListChecks className="w-4 h-4" />} />
          <p className="text-[10px] uppercase tracking-widest text-white/20 font-medium mt-8 mb-3 px-3">Conta</p>
          <MenuItem id="perfil" label="Minha Conta" icon={<User className="w-4 h-4" />} />
        </nav>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="av" className="w-full h-full object-cover" /> : <span className="text-white/50 text-xs">{nome?.[0]?.toUpperCase() || 'U'}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-white/60 text-xs font-light truncate">{nome || user.email}</p>
              {isPro && <span className="text-[9px] text-white/25 uppercase tracking-widest">PRO</span>}
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth/login'); }} className="w-full flex items-center gap-2 px-3 py-2 text-white/25 hover:text-white/60 text-xs font-light transition-colors rounded-xl hover:bg-white/5">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center justify-between border-b border-white/5" style={{ background: 'rgba(8,8,15,0.75)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-white/40 hover:text-white/80 bg-white/5 p-2 rounded-lg border border-white/5"><Menu className="w-5 h-5" /></button>
            <span className="text-xs text-white/30 uppercase tracking-widest hidden sm:block font-light">{FORMATO_META[activeTab]?.label || 'Dashboard'}</span>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">

          {/* PERFIL */}
          {activeTab === 'perfil' && (
            <div className="max-w-3xl rounded-3xl p-6 lg:p-8 space-y-8 border border-white/8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
              <h3 className="text-xl font-light text-white/80">Configurações da Conta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 placeholder-white/20 focus:border-white/20 outline-none text-sm font-light" />
                <input value={arroba} onChange={e => setArroba(e.target.value)} placeholder="@arroba" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 placeholder-white/20 focus:border-white/20 outline-none text-sm font-light" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
                  {avatarUrl ? <img src={avatarUrl} alt="av" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30 text-xl">{nome?.[0] || '?'}</div>}
                </div>
                <label className="relative cursor-pointer">
                  <span className="text-xs text-white/40 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors block">{fazendoUpload ? 'Enviando...' : 'Alterar foto'}</span>
                  <input type="file" className="absolute inset-0 opacity-0 w-0 h-0" onChange={handleUploadAvatar} />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="verified" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} className="w-4 h-4 rounded accent-white" />
                <label htmlFor="verified" className="text-white/40 text-sm font-light">Exibir ✓ verificado nos cards Twitter</label>
              </div>
              <button onClick={() => { setSalvandoPerfil(true); supabase.from('users').update({ nome, arroba, avatar_url: avatarUrl, is_verified: isVerified }).eq('id', user.id).then(() => setSalvandoPerfil(false)); }} className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 font-light px-6 py-2.5 rounded-xl text-sm transition-colors">
                {salvandoPerfil ? 'Salvando...' : 'Salvar Perfil'}
              </button>

              {/* Alterar Senha */}
              <div className="border-t border-white/5 pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center"><Lock className="w-4 h-4 text-white/30" /></div>
                  <div>
                    <h4 className="text-sm font-light text-white/60">Segurança</h4>
                    <p className="text-xs text-white/25 font-light">Altere sua senha de acesso</p>
                  </div>
                </div>
                <form onSubmit={handleAlterarSenha} className="space-y-4 max-w-sm">
                  {[
                    { label: 'Senha Atual', v: senhaAtual, sv: setSenhaAtual, sh: showSenhaAtual, ssh: setShowSenhaAtual, ac: 'current-password' },
                    { label: 'Nova Senha',  v: novaSenha,  sv: setNovaSenha,  sh: showNovaSenha,  ssh: setShowNovaSenha,  ac: 'new-password' },
                  ].map(({ label, v, sv, sh, ssh, ac }) => (
                    <div key={label}>
                      <label className="block text-[10px] font-medium text-white/25 uppercase tracking-widest mb-1.5">{label}</label>
                      <div className="relative">
                        <input type={sh ? 'text' : 'password'} value={v} onChange={e => sv(e.target.value)} required autoComplete={ac} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white/70 placeholder-white/15 focus:border-white/20 outline-none text-sm font-light" placeholder={label} />
                        <button type="button" onClick={() => ssh(x => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 p-1" tabIndex={-1}>{sh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      </div>
                      {label === 'Nova Senha' && novaSenha && (() => { const str = getSenhaStrength(novaSenha); return (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2"><div className="flex gap-1 flex-1">{[1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${str.score >= i ? str.color : 'bg-white/10'}`} />)}</div><span className="text-xs text-white/40">{str.label}</span></div>
                          <div className="grid grid-cols-2 gap-1">{senhaRules.map(r => (<div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-400' : 'text-white/25'}`}>{r.ok ? <Check className="w-3 h-3 flex-shrink-0" /> : <div className="w-3 h-3 rounded-full border border-white/15 flex-shrink-0" />}{r.label}</div>))}</div>
                        </div>
                      ); })()}
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] font-medium text-white/25 uppercase tracking-widest mb-1.5">Confirmar Nova Senha</label>
                    <div className="relative">
                      <input type={showConfirmarSenha ? 'text' : 'password'} value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} required autoComplete="new-password" className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-12 text-white/70 placeholder-white/15 outline-none text-sm font-light transition-all ${confirmarNovaSenha && novaSenha !== confirmarNovaSenha ? 'border-red-500/40' : confirmarNovaSenha && novaSenha === confirmarNovaSenha ? 'border-green-500/40' : 'border-white/10 focus:border-white/20'}`} placeholder="Repita a nova senha" />
                      <button type="button" onClick={() => setShowConfirmarSenha(x => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 p-1" tabIndex={-1}>{showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  {senhaErro && <div className="flex items-start gap-2 bg-red-500/10 text-red-400 border border-red-500/20 text-xs p-3 rounded-xl"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{senhaErro}</span></div>}
                  {senhaSucesso && <div className="flex items-start gap-2 bg-green-500/10 text-green-400 border border-green-500/20 text-xs p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Senha alterada com sucesso!</span></div>}
                  <button type="submit" disabled={alterandoSenha || (!!confirmarNovaSenha && novaSenha !== confirmarNovaSenha)} className="bg-white/8 hover:bg-white/12 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white/70 font-light px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm">
                    {alterandoSenha ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Alterar senha'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* GERADOR (formatos) */}
          {(activeTab === 'twitter' || activeTab === 'ilustrativo' || activeTab === 'citacao' || activeTab === 'checklist') && !carrossel && (
            <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-8 py-10">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white/40 border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="scale-110">{FORMATO_META[activeTab]?.icon}</span>
              </div>
              <div>
                <h3 className="text-2xl font-extralight text-white/70 tracking-tight">{FORMATO_META[activeTab]?.label}</h3>
                <p className="text-white/25 text-sm font-light mt-1">{FORMATO_META[activeTab]?.desc}</p>
              </div>

              <div className="w-full max-w-4xl flex flex-col gap-5 px-4">
                {/* Input */}
                <form onSubmit={handleGenerate} className="flex gap-2">
                  <div className="relative flex-1">
                    <input value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: O segredo por trás do sucesso da Apple..." className="w-full border border-white/8 rounded-2xl px-6 py-5 pr-36 text-base text-white/70 placeholder-white/20 focus:border-white/15 outline-none font-light" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }} />
                    <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 bg-white/8 hover:bg-white/12 disabled:opacity-40 border border-white/10 text-white/60 px-5 rounded-xl font-light flex items-center gap-2 transition-all text-sm">
                      {loading ? <Zap className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
                      {loading ? 'Gerando...' : 'Criar'}
                    </button>
                  </div>
                  <button type="button" onClick={() => setShowSettings(!showSettings)} className={`px-4 rounded-2xl border transition-all ${showSettings ? 'bg-white/10 border-white/15 text-white/60' : 'border-white/8 text-white/30 hover:border-white/15 hover:text-white/60'}`} style={{ background: showSettings ? undefined : 'rgba(255,255,255,0.03)' }}>
                    <Settings2 className="w-4 h-4" />
                  </button>
                </form>

                {/* ── Twitter: Grade de Nichos ── */}
                {activeTab === 'twitter' && (
                  <div className="text-left space-y-4">
                    <p className="text-sm font-light text-white/60">Escolha um modelo inteligente de acordo com seu nicho:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {NICHES_TWITTER.map(n => {
                        const sel = selectedNicheId === n.id;
                        return (
                          <button key={n.id} onClick={() => { setSelectedNicheId(sel ? null : n.id); setShowCustomPrompt(false); }}
                            className={`relative rounded-2xl overflow-hidden aspect-[4/3] group transition-all outline-none ${sel ? 'ring-2 ring-white/40 shadow-lg shadow-black/50' : 'opacity-60 hover:opacity-90'}`}>
                            <img src={n.img} alt={n.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                            {sel && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                                <Check className="w-3 h-3 text-black" strokeWidth={3} />
                              </div>
                            )}
                            <span className="absolute bottom-2.5 left-3 right-3 text-left text-xs font-semibold text-white leading-tight">{n.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* ── GEMs Personalizados salvos ── */}
                    {savedPrompts.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/25 font-medium">Meus Modelos</p>
                        <div className="flex flex-wrap gap-2">
                          {savedPrompts.map(p => {
                            const sel = selectedNicheId === `custom:${p.id}`;
                            return (
                              <div key={p.id} className={`group flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${sel ? 'bg-white/12 border-white/25 text-white/80' : 'bg-white/[0.03] border-white/8 text-white/40 hover:border-white/15 hover:text-white/60'}`}>
                                <button onClick={() => { setSelectedNicheId(sel ? null : `custom:${p.id}`); setShowCustomPrompt(false); }} className="font-light">{p.name}</button>
                                <button onClick={() => handleDeletePrompt(p.id)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400/80 transition-all ml-1">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Outros formatos: Modelo de IA clássico ── */}
                {activeTab !== 'twitter' && (
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-medium mb-3">Modelo de IA · Estética Visual</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {MODELOS_IA.map(m => {
                        const sel = configGlobal.modelo_ia === m.id;
                        return (
                          <button key={m.id} onClick={() => setConfigGlobal({ ...configGlobal, modelo_ia: m.id, cor_primaria_marca: m.corDefault })} className={`flex-shrink-0 w-44 rounded-2xl overflow-hidden flex flex-col transition-all outline-none group ${sel ? 'ring-1 ring-white/25 shadow-lg shadow-black/50' : 'opacity-55 hover:opacity-85'}`}>
                            <div className="h-28 relative overflow-hidden">
                              <img src={m.img} alt={m.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              {sel && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" strokeWidth={3} /></div>}
                            </div>
                            <div className="p-3 text-left border-t border-white/5" style={{ background: 'rgba(8,8,15,0.95)' }}>
                              <p className={`text-[9px] uppercase tracking-widest font-medium mb-0.5 ${sel ? 'text-white/50' : 'text-white/20'}`}>{m.ref}</p>
                              <p className={`text-xs font-light leading-tight ${sel ? 'text-white/70' : 'text-white/35'}`}>{m.nome}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Prompt personalizado (avançado) ── */}
                <div className="text-left">
                  <button onClick={() => { setShowCustomPrompt(v => !v); if (!showCustomPrompt) setSelectedNicheId(null); }}
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors uppercase tracking-widest font-medium flex items-center gap-1.5">
                    <Plus className={`w-3 h-3 transition-transform ${showCustomPrompt ? 'rotate-45' : ''}`} />
                    Prompt personalizado (avançado)
                  </button>
                  {showCustomPrompt && (
                    <div className="mt-3 rounded-2xl border border-white/8 p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest block">Instruções extras para o Gemini</label>
                      <textarea value={customPromptText} onChange={e => setCustomPromptText(e.target.value)}
                        className="w-full bg-white/5 border border-white/8 rounded-xl p-3 text-sm text-white/55 font-light focus:border-white/15 outline-none h-24 resize-none"
                        placeholder="Você é um especialista em..." />
                      {/* Salvar como GEM personalizado */}
                      {activeTab === 'twitter' && customPromptText.trim() && (
                        showSaveModal ? (
                          <div className="flex gap-2 items-center">
                            <input value={newPromptName} onChange={e => setNewPromptName(e.target.value)}
                              placeholder="Nome do modelo..." maxLength={30}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/65 font-light focus:border-white/20 outline-none" />
                            <button onClick={handleSavePrompt} disabled={savingPrompt || !newPromptName.trim()}
                              className="bg-white/10 hover:bg-white/15 disabled:opacity-40 border border-white/15 text-white/60 px-3 py-2 rounded-xl text-xs font-light transition-colors flex-shrink-0">
                              {savingPrompt ? '...' : 'Salvar'}
                            </button>
                            <button onClick={() => { setShowSaveModal(false); setNewPromptName(''); }}
                              className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setShowSaveModal(true)}
                            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/55 transition-colors uppercase tracking-widest font-medium">
                            <Save className="w-3 h-3" /> Salvar como Meu Modelo
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Settings */}
                {showSettings && (
                  <div className="rounded-2xl border border-white/8 p-6 text-left" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/5">
                      <h4 className="text-sm font-light text-white/60">Predefinições — {FORMATO_META[activeTab]?.label}</h4>
                      <button onClick={salvarConfiguracoesGlobais} className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/45 px-4 py-2 rounded-xl text-xs font-light flex items-center gap-2 transition-colors"><Save className="w-3.5 h-3.5" /> Salvar padrões</button>
                    </div>

                    {activeTab === 'twitter' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Tema do Card</label>
                          <select value={configTwitter.temaVisor} onChange={e => setConfigTwitter({...configTwitter, temaVisor: e.target.value})} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/55 outline-none">
                            <option value="light">Claro</option><option value="dark">Escuro</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Frequência de Imagens</label>
                          <select value={configTwitter.imagens} onChange={e => setConfigTwitter({...configTwitter, imagens: e.target.value})} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/55 outline-none">
                            <option value="aleatorio">Alguns (Aleatório)</option><option value="sempre">Todos</option><option value="nunca">Sem imagens</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Número de Slides</label>
                          <input type="number" min="5" max="20" value={configTwitter.numSlides} onChange={e => setConfigTwitter({...configTwitter, numSlides: e.target.value})} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/55 outline-none" />
                        </div>
                      </div>
                    )}

                    {(activeTab === 'ilustrativo' || activeTab === 'citacao' || activeTab === 'checklist') && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[{ label: 'Cor Primária', key: 'cor_primaria_marca' }, { label: 'Cor do Texto', key: 'cor_texto_global' }].map(({ label, key }) => (
                            <div key={key} className="space-y-1.5">
                              <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">{label}</label>
                              <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
                                <input type="color" value={configGlobal[key as keyof ConfigGlobal] as string} onChange={e => setConfigGlobal({ ...configGlobal, [key]: e.target.value })} className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer flex-shrink-0" />
                                <span className="text-xs font-mono text-white/40">{(configGlobal[key as keyof ConfigGlobal] as string).toUpperCase()}</span>
                              </div>
                            </div>
                          ))}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Número de Slides</label>
                            <input type="number" min="4" max="20" value={configGlobal.num_slides} onChange={e => setConfigGlobal({ ...configGlobal, num_slides: parseInt(e.target.value) || 10 })} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/55 outline-none" />
                          </div>
                        </div>
                        {activeTab === 'ilustrativo' && (
                          <details className="group">
                            <summary className="text-[10px] font-medium text-white/25 uppercase tracking-widest cursor-pointer hover:text-white/45 list-none flex items-center gap-2">
                              <span className="group-open:rotate-90 transition-transform inline-block">▶</span> Tipografia Avançada
                            </summary>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                              {[{ k: 'capa', l: 'Capa' }, { k: 'cards', l: 'Cards' }, { k: 'cta', l: 'CTA' }].map(({ k, l }) => (
                                <div key={k} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                                  <h5 className="font-medium text-white/30 text-xs uppercase">{l}</h5>
                                  <select value={config[k as keyof typeof config].fonte} onChange={e => setConfig({ ...config, [k]: { ...config[k as keyof typeof config], fonte: e.target.value }})} className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white/45 outline-none">
                                    {FONTES_DISPONEIS.map(f => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-red-400/60 text-sm font-light">{error}</p>}
              </div>
            </div>
          )}

          {/* VISUALIZADOR */}
          {carrossel && (
            <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start mt-4">
              {/* Viewer */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <button onClick={() => setSlideAtual(p => Math.max(0, p - 1))} disabled={slideAtual === 0} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/8 border border-white/8 disabled:opacity-20 transition-colors"><ChevronLeft className="w-5 h-5 text-white/50" /></button>
                    <span className="font-mono text-xs text-white/30 uppercase tracking-widest">{slideAtual + 1} / {carrossel.numero_de_slides}</span>
                    <button onClick={() => setSlideAtual(p => Math.min(carrossel.carrossel.length - 1, p + 1))} disabled={slideAtual === carrossel.carrossel.length - 1} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/8 border border-white/8 disabled:opacity-20 transition-colors"><ChevronRight className="w-5 h-5 text-white/50" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAll}
                      disabled={downloadingAll}
                      className="px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: downloadingAll ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.35)', color: downloadingAll ? 'rgba(134,239,172,0.6)' : 'rgba(134,239,172,0.9)' }}>
                      {downloadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {downloadingAll ? 'Baixando...' : 'Baixar Tudo'}
                    </button>
                    <button onClick={() => setCarrossel(null)} className="px-5 py-2 text-white/25 hover:text-white/55 rounded-xl text-xs font-light border border-white/5 hover:border-white/10 transition-colors">← Novo carrossel</button>
                  </div>
                </div>

                <div className="aspect-square w-full max-w-[640px] mx-auto rounded-[32px] relative overflow-hidden border border-white/8 shadow-2xl shadow-black/60" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {imgLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-3" />
                      <p className="text-white/25 text-xs uppercase tracking-widest font-light animate-pulse">Renderizando...</p>
                    </div>
                  )}
                  <img
                    src={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setImgLoading(false)}
                    onError={() => { setImgLoading(false); if (carrossel.carrossel[slideAtual].usar_imagem) updateSlideAtual({ usar_imagem: false }); }}
                    key={`${slideAtual}-${JSON.stringify(carrossel.carrossel[slideAtual])}-${JSON.stringify(configGlobal)}`}
                    alt={`Slide ${slideAtual + 1}`}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 max-w-[640px] mx-auto">
                  {carrossel.carrossel.map((_, i) => (
                    <button key={i} onClick={() => setSlideAtual(i)} className={`flex-shrink-0 w-9 h-9 rounded-lg border transition-all text-xs font-light ${i === slideAtual ? 'bg-white/15 border-white/25 text-white/80' : 'bg-white/[0.03] border-white/8 text-white/25 hover:border-white/15'}`}>{i + 1}</button>
                  ))}
                </div>
              </div>

              {/* Editor */}
              <div className="w-full xl:w-[420px] space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={adicionarSlide} className="bg-white/5 hover:bg-white/8 border border-white/8 text-white/45 font-light py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors"><PlusCircle className="w-4 h-4" /> Adicionar</button>
                  <button onClick={removerSlide} className="bg-red-500/5 hover:bg-red-500/8 border border-red-500/10 text-red-400/40 font-light py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors"><MinusCircle className="w-4 h-4" /> Remover</button>
                </div>

                <div className="rounded-3xl p-6 border border-white/8 space-y-5" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/25 animate-pulse" />
                    <h4 className="text-xs font-medium uppercase tracking-widest text-white/35">Editor · Slide {slideAtual + 1}</h4>
                  </div>

                  {/* Twitter */}
                  {activeTab === 'twitter' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Texto do Slide</label>
                        <textarea value={carrossel.carrossel[slideAtual].texto} onChange={e => updateSlideAtual({ texto: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl p-4 text-sm text-white/65 font-light h-32 focus:border-white/15 outline-none resize-none" />
                      </div>
                      {/* Controles de imagem para Twitter */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <label className="relative cursor-pointer">
                          <span className="w-full bg-white/5 hover:bg-white/8 border border-white/8 text-white/40 font-light py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors">
                            <Upload className="w-3.5 h-3.5" /> {fazendoUpload ? '...' : 'Inserir Imagem'}
                          </span>
                          <input type="file" accept="image/*" onChange={handleUploadSlideBg} className="absolute inset-0 opacity-0 w-0 h-0" />
                        </label>
                        <button
                          onClick={() => updateSlideAtual({ usar_imagem: false, imageUrl: null })}
                          disabled={!carrossel.carrossel[slideAtual].usar_imagem && !carrossel.carrossel[slideAtual].imageUrl}
                          className="bg-red-500/5 hover:bg-red-500/8 disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/10 text-red-400/40 font-light py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Remover Imagem
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ilustrativo */}
                  {activeTab === 'ilustrativo' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Headline</label>
                        <input value={carrossel.carrossel[slideAtual].titulo || ''} onChange={e => updateSlideAtual({ titulo: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/65 font-light focus:border-white/15 outline-none" placeholder="Headline do slide (máx 8 palavras)" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Palavra Destaque</label>
                        <input value={carrossel.carrossel[slideAtual].palavra_destaque || ''} onChange={e => updateSlideAtual({ palavra_destaque: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/65 font-light focus:border-white/15 outline-none" placeholder="Uma palavra do título para colorir" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Texto do Slide</label>
                        <textarea value={carrossel.carrossel[slideAtual].texto} onChange={e => updateSlideAtual({ texto: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl p-4 text-sm text-white/65 font-light h-28 focus:border-white/15 outline-none resize-none" />
                      </div>
                    </div>
                  )}

                  {/* Citação */}
                  {activeTab === 'citacao' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Citação</label>
                        <textarea value={carrossel.carrossel[slideAtual].texto_citacao || carrossel.carrossel[slideAtual].texto || ''} onChange={e => updateSlideAtual({ texto_citacao: e.target.value, texto: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl p-4 text-sm text-white/65 font-light h-28 focus:border-white/15 outline-none resize-none" placeholder="A frase de impacto..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Autor / Contexto</label>
                        <input value={carrossel.carrossel[slideAtual].autor || ''} onChange={e => updateSlideAtual({ autor: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/65 font-light focus:border-white/15 outline-none" placeholder="Nome do autor" />
                      </div>
                    </div>
                  )}

                  {/* Checklist */}
                  {activeTab === 'checklist' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Título</label>
                        <input value={carrossel.carrossel[slideAtual].titulo || carrossel.carrossel[slideAtual].texto || ''} onChange={e => updateSlideAtual({ titulo: e.target.value, texto: e.target.value })} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/65 font-light focus:border-white/15 outline-none" placeholder="Título da lista" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Itens</label>
                        {(carrossel.carrossel[slideAtual].passos || []).map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-white/20 text-xs w-4 flex-shrink-0 text-center">{i + 1}</span>
                            <input value={p} onChange={e => updatePassoSlide(i, e.target.value)} className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white/65 font-light focus:border-white/15 outline-none" />
                            <button onClick={() => removerPasso(i)} className="text-red-400/30 hover:text-red-400/60 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={adicionarPasso} className="w-full flex items-center justify-center py-2 text-white/20 hover:text-white/40 text-xs font-light transition-colors border border-white/5 rounded-lg hover:border-white/10">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ilustrativo: controles granulares */}
                  {activeTab === 'ilustrativo' && (
                    <div className="space-y-4 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Controles deste slide</p>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Posição do Texto</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['topo','centro','rodape'].map(pos => (
                            <button key={pos} onClick={() => updateSlideAtual({ posicao_texto: pos })} className={`py-2 rounded-xl text-[10px] font-light uppercase transition-all border ${(carrossel.carrossel[slideAtual].posicao_texto || 'centro') === pos ? 'bg-white/12 border-white/20 text-white/75' : 'bg-white/[0.02] border-white/5 text-white/25 hover:border-white/10 hover:text-white/45'}`}>{pos}</button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Cor do Texto (override)</label>
                          {carrossel.carrossel[slideAtual].cor_texto_slide && <button onClick={() => updateSlideAtual({ cor_texto_slide: undefined })} className="text-[10px] text-white/20 hover:text-red-400/50 transition-colors">↩ global</button>}
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                          <input type="color" value={carrossel.carrossel[slideAtual].cor_texto_slide || configGlobal.cor_texto_global} onChange={e => updateSlideAtual({ cor_texto_slide: e.target.value })} className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer" />
                          <span className="text-xs font-mono text-white/35">{(carrossel.carrossel[slideAtual].cor_texto_slide || configGlobal.cor_texto_global).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Fonte (override)</label>
                          {carrossel.carrossel[slideAtual].fonte_slide && <button onClick={() => updateSlideAtual({ fonte_slide: undefined })} className="text-[10px] text-white/20 hover:text-red-400/50 transition-colors">↩ global</button>}
                        </div>
                        <select value={carrossel.carrossel[slideAtual].fonte_slide || ''} onChange={e => updateSlideAtual({ fonte_slide: e.target.value || undefined })} className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white/45 outline-none font-light">
                          <option value="">Usar global</option>
                          {FONTES_DISPONEIS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(['toggle_fade','toggle_marca_dagua'] as const).map(key => {
                          const val = (carrossel.carrossel[slideAtual][key] as boolean) ?? true;
                          const label = key === 'toggle_fade' ? 'Fade/Overlay' : "Marca d'água";
                          return (
                            <button key={key} onClick={() => updateSlideAtual({ [key]: !val })} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-light transition-all ${val ? 'border-white/15 bg-white/8 text-white/55' : 'border-white/5 bg-white/[0.02] text-white/20'}`}>
                              <span>{label}</span>
                              <span className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 ${val ? 'bg-white/40 border-white/40' : 'border-white/15'}`} />
                            </button>
                          );
                        })}
                      </div>

                      {carrossel.carrossel[slideAtual].tipo === 'cta' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Palavra do Comentário</label>
                          <input value={carrossel.palavra_comentario || ''} onChange={e => setCarrossel({...carrossel, palavra_comentario: e.target.value.toUpperCase()})} className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/65 font-light focus:border-white/15 outline-none" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload / remove imagem */}
                  {(activeTab === 'ilustrativo' || activeTab === 'citacao') && (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                      <label className="relative cursor-pointer">
                        <span className="w-full bg-white/5 hover:bg-white/8 border border-white/8 text-white/35 font-light py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors">
                          <Upload className="w-3.5 h-3.5" /> {fazendoUpload ? '...' : 'Upload'}
                        </span>
                        <input type="file" onChange={handleUploadSlideBg} className="absolute inset-0 opacity-0 w-0 h-0" />
                      </label>
                      <button onClick={() => updateSlideAtual({ usar_imagem: false, imageUrl: null })} className="bg-red-500/5 hover:bg-red-500/8 border border-red-500/10 text-red-400/35 font-light py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Tirar imagem
                      </button>
                    </div>
                  )}

                  <a href={getSlideImageUrl(carrossel.carrossel[slideAtual], carrossel)} download={`slide-${slideAtual + 1}.png`} className="block text-center w-full bg-white/8 hover:bg-white/12 border border-white/10 text-white/55 font-light py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Baixar slide
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
