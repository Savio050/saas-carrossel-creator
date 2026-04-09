import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchSearchContext, parseGeminiJson } from '@/lib/gemini-utils';

// ── Prompts de Copywriting por Modelo (Formato: Checklist) ────────────────
const MODELO_PROMPTS: Record<string, string> = {
  aesthetic_minimalist: `
MODELO ATIVO: Aesthetic Minimalist — Formato CHECKLIST
Regras de copywriting:
1. GANCHO (capa): Título minimalista e provocativo. Máximo 6 palavras. Ex: "O que ninguém te ensinou."
2. ESTRUTURA: Passos curtos e diretos. Máximo 6 palavras por passo. Zero explicações longas.
3. TOM: Reflexivo, inteligente, quase filosófico. Silêncio como recurso.
4. FOCO: 3 a 5 passos por slide. Menos é mais. Qualidade acima de quantidade.
5. CTA: "Qual passo você ignora? Comenta o número."`,

  clean_corporate: `
MODELO ATIVO: Clean Corporate — Formato CHECKLIST
Regras de copywriting:
1. GANCHO (capa): Framework ou metodologia com nome forte. "O Método X em 5 Passos."
2. ESTRUTURA: Passos numerados com verbos de ação no infinitivo. "1. Mapear os gargalos."
3. TOM: Profissional, prático, orientado a resultados mensuráveis.
4. FOCO: 4 a 6 passos por slide. Cada passo deve ser acionável hoje mesmo.
5. CTA: "Salve esse checklist para aplicar amanhã."`,

  dynamic_sports: `
MODELO ATIVO: Dynamic Sports — Formato CHECKLIST
Regras de copywriting:
1. GANCHO (capa): Título bombástico com número. "7 ERROS que destroem carreiras."
2. ESTRUTURA: Itens com energia máxima. Use verbos de ação fortes. Números e estatísticas quando possível.
3. TOM: Intenso, urgente, como um treinador no vestiário antes do jogo.
4. FOCO: 4 a 7 itens por slide. Cada item deve gerar uma reação emocional.
5. CTA: "Qual desses te pegou? Comenta o número."`,

  minimalist_editorial: `
MODELO ATIVO: Minimalist Editorial — Formato CHECKLIST
Regras de copywriting:
1. GANCHO (capa): Título jornalístico com dado ou fato. "5 dados que mudam sua perspectiva."
2. ESTRUTURA: Itens factuais e verificáveis. Linguagem de boletim ou relatório.
3. TOM: Sóbrio, imparcial, informativo. Zero opinião, só fatos.
4. FOCO: 3 a 5 itens por slide. Cada item com um dado ou contexto breve.
5. CTA: "Siga para mais análises como essa."`,
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

    const qtdSlides = numSlides || 8;
    const basePrompt = customPrompt || 'Você é um especialista em criar checklists e frameworks visuais de alto impacto para Instagram.';
    const modeloPrompt = MODELO_PROMPTS[modelo_ia] ?? '';

    const systemPrompt = `${basePrompt}
${modeloPrompt}

REGRA DE FACTUALIDADE OBRIGATÓRIA: Quando um bloco de CONTEXTO REAL for fornecido junto ao tema, use-o como base factual primária. Não invente dados, estatísticas ou afirmações que não estejam no contexto ou que você não tenha certeza absoluta.

INSTRUÇÕES DE ESTRUTURA (não sobrescreva as regras do Modelo acima):
- Escreva EXATAMENTE ${qtdSlides} slides sobre o tema fornecido.
- Slide 1: tipo "capa" — título principal do checklist.
- Slides do meio: tipo "conteudo" — cada slide com um título e lista de passos/itens.
- Último slide: tipo "cta" — crie uma palavra de 4-6 letras para "palavra_comentario".
- O campo "texto" deve ser igual ao "titulo" (usado como fallback/preview).
- "passos" deve ser um array de strings com os itens da lista daquele slide.

Retorne APENAS JSON válido, sem markdown:
{
  "tema_principal": "string",
  "numero_de_slides": ${qtdSlides},
  "palavra_comentario": "string",
  "carrossel": [
    {
      "slide": number,
      "titulo": "string (título do slide/seção)",
      "passos": ["string", "string", "string"],
      "texto": "string (igual ao titulo — fallback)",
      "usar_imagem": false,
      "termo_pesquisa": "",
      "tipo": "capa|conteudo|cta"
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
            temperature: modelo_ia === 'minimalist_editorial' ? 0.5 : 0.8,
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

    return NextResponse.json(carrossel);
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
