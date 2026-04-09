import Link from 'next/link';

const MODELS = [
  {
    nome: 'Aesthetic Minimalist',
    ref: '@hyeser',
    descricao: 'Reflexões de impacto. Espaço vazio como linguagem visual.',
    img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80',
    tag: 'Minimalismo',
  },
  {
    nome: 'Clean Corporate',
    ref: '@academiabrsocialmedia',
    descricao: 'Estrutura clara, valor técnico e autoridade de mercado.',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    tag: 'Corporativo',
  },
  {
    nome: 'Dynamic Sports',
    ref: '@futebolinterativobr',
    descricao: 'Alta energia, narrativa dramática e emoção visceral.',
    img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80',
    tag: 'Esportes',
  },
  {
    nome: 'Minimalist Editorial',
    ref: '@thenews.cc',
    descricao: 'Jornalismo limpo. Fatos que constroem autoridade.',
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
    tag: 'Editorial',
  },
];

const BENEFITS = [
  {
    icon: '⚡',
    title: 'Velocidade sem precedentes',
    desc: 'De um tema a slides completos e publicáveis em menos de 30 segundos. Sem esforço manual.',
  },
  {
    icon: '🎯',
    title: 'Precisão estratégica',
    desc: 'Cada modelo de IA foi treinado com as regras do nicho. Sem clichê, sem enchimento de linguagem.',
  },
  {
    icon: '🎨',
    title: 'Design de referência',
    desc: 'Visuais inspirados nas maiores contas do Instagram. Profissional por padrão, personalizável por escolha.',
  },
];

const FORMATS = [
  { icon: '🐦', nome: 'Twitter Style', desc: 'Cards no estilo tweet com personalidade de rede social.' },
  { icon: '🖼️', nome: 'Ilustrativo', desc: 'Imagem de fundo com texto sobreposto cinematográfico.' },
  { icon: '💬', nome: 'Citação', desc: 'Aspas gigantes, frase de impacto central e autor.' },
  { icon: '✅', nome: 'Checklist', desc: 'Passos numerados ou itens com estrutura de lista.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs leading-none">C</span>
          </div>
          <span className="text-base font-light tracking-tight text-gray-900">
            Carrossel<span className="font-semibold">Creator</span>
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 rounded-xl hover:bg-gray-50"
          >
            Entrar
          </Link>
          <Link
            href="/auth/login"
            className="text-sm bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02]"
          >
            Assinar Agora
          </Link>
        </nav>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-gray-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-20 right-0 w-80 h-80 bg-gray-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-64 bg-gray-50 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 lg:px-16 pt-28 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-medium px-4 py-1.5 rounded-full mb-10 tracking-wide">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Powered by Gemini 2.5 Flash · Pexels · Satori
          </div>

          <h1 className="text-5xl md:text-[72px] font-extralight text-gray-900 leading-[1.05] tracking-tight mb-7">
            Carrosséis que{' '}
            <em className="font-semibold not-italic">param o scroll.</em>
            <br />
            <span className="text-gray-400">Em segundos.</span>
          </h1>

          <p className="text-lg text-gray-500 font-light max-w-xl mx-auto mb-12 leading-relaxed">
            Selecione um formato estrutural, escolha um modelo de IA, insira o tema.
            A plataforma entrega slides prontos para publicar — com copy, imagens e design.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/auth/login"
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-medium text-sm transition-all hover:scale-[1.02] shadow-xl shadow-gray-900/10 w-full sm:w-auto"
            >
              Garantir Acesso — R$ 47/mês
            </Link>
            <Link
              href="/auth/login"
              className="border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl font-light text-sm transition-all w-full sm:w-auto"
            >
              Já tenho conta &rarr; Entrar
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-5 font-light">
            Cancele quando quiser. Sem taxa de cancelamento. Sem contrato.
          </p>
        </div>
      </section>

      {/* ─── Formats ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">4 Formatos Estruturais</p>
            <h2 className="text-3xl font-light text-white tracking-tight">
              Escolha a estrutura. <span className="font-semibold italic">Cruze com o estilo.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FORMATS.map(f => (
              <div
                key={f.nome}
                className="border border-white/5 bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 hover:border-white/10 hover:bg-white/[0.05] transition-all group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-white font-medium text-sm mb-1.5">{f.nome}</h3>
                <p className="text-gray-500 text-xs font-light leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits ──────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 lg:px-16 py-24">
        <div className="text-center mb-14">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mb-3">Por que usar</p>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Feito para quem <span className="font-semibold">produz em escala.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {BENEFITS.map(b => (
            <div
              key={b.title}
              className="bg-gray-50/80 border border-gray-100 rounded-3xl p-8 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-5">{b.icon}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-gray-500 text-sm font-light leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Models Showcase ───────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-14">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">4 Modelos de IA</p>
            <h2 className="text-3xl font-light text-white tracking-tight">
              Uma estética para <span className="font-semibold italic">cada nicho.</span>
            </h2>
            <p className="text-gray-500 text-sm font-light mt-3 max-w-md mx-auto">
              Cada modelo injeta regras rígidas de copywriting e direção visual no Gemini.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODELS.map(m => (
              <div key={m.nome} className="group relative overflow-hidden rounded-3xl aspect-[3/4] cursor-pointer">
                <img
                  src={m.img}
                  alt={m.nome}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    {m.tag}
                  </span>
                  <h3 className="text-white font-medium text-sm mt-1 leading-tight">{m.nome}</h3>
                  <p className="text-gray-400 text-xs font-light mt-2 leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {m.descricao}
                  </p>
                  <p className="text-gray-600 text-[10px] mt-2">{m.ref}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ───────────────────────────────────────────────────────── */}
      <section className="max-w-lg mx-auto px-6 py-28 text-center">
        <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mb-3">Plano único</p>
        <h2 className="text-3xl font-light text-gray-900 mb-12 tracking-tight">
          Acesso <span className="font-semibold">completo.</span> Sem surpresas.
        </h2>

        <div className="border border-gray-200 rounded-3xl p-10 text-left hover:border-gray-300 hover:shadow-lg transition-all">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-light text-gray-900 tracking-tight">R$ 47</span>
            <span className="text-gray-400 mb-2 font-light text-sm">/mês</span>
          </div>
          <p className="text-gray-400 text-sm font-light mb-8">Cancele a qualquer momento. Sem contrato mínimo.</p>

          <ul className="space-y-3.5 mb-10">
            {[
              '4 formatos de carrossel (Twitter, Ilustrativo, Citação, Checklist)',
              '4 modelos de IA especializados por nicho',
              'Geração ilimitada com Gemini 2.5 Flash',
              'Imagens automáticas via Pexels',
              'Download em PNG slide a slide',
              'Controles granulares de cor, fonte e overlay por slide',
              'Suporte prioritário',
            ].map(f => (
              <li key={f} className="flex items-start gap-3 text-gray-600 text-sm font-light">
                <span className="text-gray-300 mt-0.5 flex-shrink-0 font-light">—</span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/auth/login"
            className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-medium py-4 rounded-2xl transition-all hover:scale-[1.01] shadow-xl shadow-gray-900/10 text-sm tracking-wide"
          >
            Assinar Agora
          </Link>
          <p className="text-center text-xs text-gray-400 mt-4 font-light">
            Acesso imediato após o pagamento.
          </p>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">C</span>
          </div>
          <span className="text-sm font-light text-gray-500">
            Carrossel<span className="font-medium text-gray-700">Creator</span>
          </span>
        </div>
        <p className="text-gray-400 text-xs font-light">
          © 2026 Carrossel Creator. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  );
}
