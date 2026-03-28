import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">Carrossel</span>
          <span className="text-2xl font-bold text-purple-400">Creator</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-purple-400 hover:text-white transition-colors text-sm">
            Entrar
          </Link>
          <Link href="/auth/login" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors text-sm">
            Começar Gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-1 text-purple-300 text-sm mb-6">
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Gere carrosséis virais{' '}
          <span className="text-purple-400">em segundos</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Digite um tema. A IA cria o roteiro completo, busca imagens relevantes e entrega slides prontos para publicar no Instagram.
        </p>
        <Link href="/auth/login" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
          Gerar meu primeiro carrossel
        </Link>
        <p className="text-gray-500 text-sm mt-4">Sem cartão de crédito para começar</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-bold text-white mb-2">IA de Elite</h3>
            <p className="text-gray-400 text-sm">Roteiros criados pelo Gemini com linguagem de insider do mercado, sem clichês.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🖼️</div>
            <h3 className="text-lg font-bold text-white mb-2">Imagens Automáticas</h3>
            <p className="text-gray-400 text-sm">Busca e integra imagens relevantes de alta qualidade para cada slide do carrossel.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-bold text-white mb-2">Pronto em Segundos</h3>
            <p className="text-gray-400 text-sm">De um tema a slides completos em menos de 30 segundos. Só copiar e publicar.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Um plano. Acesso total.</h2>
        <p className="text-gray-400 mb-10">Sem limites, sem taxa de surpresa.</p>
        <div className="bg-gray-900 border border-purple-700 rounded-2xl p-8">
          <div className="text-purple-400 font-semibold mb-2">PRO</div>
          <div className="text-5xl font-bold text-white mb-1">R$ 47<span className="text-xl text-gray-400">/mês</span></div>
          <p className="text-gray-400 mb-6">Cancele quando quiser</p>
          <ul className="text-left space-y-3 mb-8">
            {['Geração ilimitada de carrosséis', 'Imagens automáticas por slide', 'Download em PNG', 'Suporte prioritário'].map((f) => (
              <li key={f} className="flex items-center gap-3 text-gray-300">
                <span className="text-purple-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link href="/auth/login" className="block w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors text-center">
            Assinar agora
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        © 2026 Carrossel Creator. Todos os direitos reservados.
      </footer>
    </main>
  );
}
