import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchSearchContext, parseGeminiJson, gerarLegenda } from '@/lib/gemini-utils';

// ── Prompts de Copywriting por Modelo (Formato: Citação) ──────────────────
const MODELO_PROMPTS: Record<string, string> = {
  aesthetic_minimalist: `
MODELO ATIVO: Aesthetic Minimalist — Formato CITAÇÃO
Regras de copywriting:
1. GANCHO (capa): Uma citação-pergunta que quebra o padrão. Máximo 8 palavras.
2. ESTRUTURA: Cada slide é uma citação independente e de alto impacto. Frases curtas, densas, sem explicações.
3. TOM: Reflexivo, filosófico, quase poético. Espaços de silêncio entre ideias.
4. FOCO: O autor pode ser real (pessoa famosa) ou abstrato ("— Anônimo", "— Alguém que já errou").
5. CTA: Frase convocando reflexão. "Qual dessas te pegou? Comenta."`,

  clean_corporate: `
MODELO ATIVO: Clean Corporate — Formato CITAÇÃO
Regras de copywriting:
1. GANCHO (capa): Uma citação de liderança ou negócios com poder de autoridade.
2. ESTRUTURA: Citações de empresários, CEOs, livros de negócios. Cada slide uma citação de valor prático.
3. TOM: Profissional, inspirador, voltado a resultados e crescimento.
4. FOCO: Atribua cada citação a uma fonte crível (nome do livro, pessoa, empresa).
5. CTA: "Salve para reler quando precisar de direção."`,

  dynamic_sports: `
MODELO ATIVO: Dynamic Sports — Formato CITAÇÃO
Regras de copywriting:
1. GANCHO (capa): Uma citação bombástica de atleta ou treinador. Tom de guerra.
2. ESTRUTURA: Citações de atletas, técnicos, momentos históricos do esporte. Cada slide, uma declaração.
3. TOM: Intenso, emocional, visceral. Use CAPS quando necessário para impacto.
4. FOCO: O autor deve ser identificável. Atleta, treinador ou personagem marcante.
5. CTA: "Qual citação te motivou mais? Responde nos comentários."`,

  minimalist_editorial: `
MODELO ATIVO: Minimalist Editorial — Formato CITAÇÃO
Regras de copywriting:
1. GANCHO (capa): Uma citação jornalística de fonte primária — político, especialista, histórico.
2. ESTRUTURA: Citações documentadas e verificáveis. Cada slide contextualiza o autor brevemente.
3. TOM: Sóbrio, jornalístico, informativo. Zero sensacionalismo.
4. FOCO: O autor e contexto são fundamentais. Inclua cargo ou período da declaração.
5. CTA: "Siga para mais análises documentadas como essa."`,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('is_pro').eq('id', user.id).single();
    if (!profile?.is_pro) return NextResponse.json({ error: 'Plano PRO necessario' }, { status: 403 });

    const { tema, modelo_ia, numSlides, customPrompt } = await req.json();
    if (!tema) return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });

    // Busca de contexto real via Serper
    const contextoPesquisa = await fetchSearchContext(tema);

    // Run legenda generation in parallel with carousel
    const legendaPromise = gerarLegenda(tema, contextoPesquisa, process.env.GEMINI_API_KEY || '');

    const qtdSlides = numSlides || 10;
    const basePrompt = customPrompt || 'Você é um curador de frases e citações de elite para Instagram.';
    const modeloPrompt = MODELO_PROMPTS[modelo_ia] ?? '';

    const systemPrompt = `${basePrompt}
${modeloPrompt}

REGRA DE FACTUALIDADE OBRIGATÓRIA: Quando um bloco de CONTEXTO REAL for fornecido junto ao tema, use-o como base factual primária. Não atribua citações falsas a pessoas reais. Se for usar citação de alguém específico, ela deve ser real e verificável.

INSTRUÇÕES DE ESTRUTURA (não sobrescreva as regras do Modelo acima):
- Escreva EXATAMENTE ${qtdSlides} slides sobre o tema fornecido.
- Slide 1: tipo "capa" — citação de abertura impactante.
- Slides do meio: tipo "citacao" — cada um com uma citação distinta e seu autor.
- Último slide: tipo "cta" — crie uma palavra de 4-6 letras para "palavra_comentario".
- O campo "texto" deve conter a citação principal (usado como fallback/preview).

Retorne APENAS JSON válido, sem markdown:
{
  "tema_principal": "string",
  "numero_de_slides": ${qtdSlides},
  "palavra_comentario": "string",
  "carrossel": [
    {
      "slide": number,
      "texto_citacao": "string (a frase/citação completa)",
      "autor": "string (nome do autor ou contexto)",
      "texto": "string (igual ao texto_citacao — fallback)",
      "usar_imagem": false,
      "termo_pesquisa": "",
      "tipo": "capa|citacao|cta"
    }
  ]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: contextoPesquisa ? `Tema: ${tema}\n\n${contextoPesquisa}` : `Tema: ${tema}` }] }],
          generationConfig: {
            temperature: modelo_ia === 'minimalist_editorial' ? 0.5 : 0.85,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) return NextResponse.json({ error: 'Erro na API do Gemini', details: geminiData }, { status: 500 });

    const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    if (!rawText) return NextResponse.json({ error: 'Gemini retornou resposta vazia' }, { status: 500 });

    let carrossel;
    try { carrossel = parseGeminiJson(rawText); }
    catch { return NextResponse.json({ error: 'JSON invalido do Gemini' }, { status: 500 }); }

    const legenda = await legendaPromise;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ ...(carrossel as any), legenda });
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
