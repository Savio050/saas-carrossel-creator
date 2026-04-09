import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function searchImage(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY || '' }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large ?? null;
  } catch { return null; }
}

// ── Regras de copywriting por modelo ──────────────────────────────────────
const MODELO_TONE_HINTS: Record<string, string> = {
  aesthetic_minimalist: 'Tom: reflexivo, provocador, máximo 10 palavras por tweet/slide. Frases cortadas, impacto direto.',
  clean_corporate:      'Tom: objetivo, estruturado em tópicos numerados, alto valor prático. Entregue aprendizado concreto.',
  dynamic_sports:       'Tom: dramático, urgente, use NÚMEROS GRANDES e linguagem intensa. Cada slide aumenta a tensão.',
  minimalist_editorial: 'Tom: jornalístico, imparcial, direto ao fato principal. Zero opiniões, só dados.',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('is_pro').eq('id', user.id).single();
    if (!profile?.is_pro) return NextResponse.json({ error: 'Plano PRO necessario' }, { status: 403 });

    const { tema, modelo_ia, configImagem, numSlides, customPrompt } = await req.json();
    if (!tema) return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });

    let regraImagens = '30% dos slides sem imagem.';
    if (configImagem === 'sempre') regraImagens = 'TODOS os slides DEVEM ter usar_imagem como true.';
    if (configImagem === 'nunca')  regraImagens = 'TODOS os slides DEVEM ter usar_imagem como false.';

    const toneHint  = modelo_ia ? (MODELO_TONE_HINTS[modelo_ia] ?? '') : '';
    const basePrompt = customPrompt || 'Você é um copywriter de elite especialista em carrosséis virais para Instagram.';

    const systemPrompt = `${basePrompt}
${toneHint ? `\nDIRETIVA DE TOM OBRIGATÓRIA: ${toneHint}\n` : ''}
Você é um Diretor de Arte e Copywriter de elite. Escreva EXATAMENTE ${numSlides || 10} slides sobre o tema fornecido.
A regra para imagens é: ${regraImagens}

ARQUITETURA LEGO — BLOCOS VISUAIS DISPONÍVEIS:
Escolha o layout mais impactante para cada slide entre os 5 blocos abaixo:
- "capa_impacto": Capa do carrossel. Headline grande centralizada. Use APENAS no slide 1.
- "fundo_overlay_texto": Imagem de fundo com overlay escuro + texto sobreposto. Para slides dramáticos com imagem.
- "split_horizontal": Imagem na metade superior, texto na metade inferior. Para slides educativos com imagem.
- "apenas_tipografia": Sem imagem. Fundo sólido + tipografia expressiva. Para insights, dados, citações.
- "cta_minimalista": Call-to-action final. Fundo colorido com botão. Use APENAS no último slide.

Para cada slide defina obrigatoriamente:
- "layout": o bloco visual mais adequado
- "titulo": headline impactante (máx 8 palavras) — exibida em destaque no slide
- "palavra_destaque": UMA palavra do titulo que deve ser colorida com a cor da marca
- "alinhamento": "esquerda", "centro" ou "direita"
- "usar_imagem": true apenas para layouts "fundo_overlay_texto" e "split_horizontal"
- "termo_pesquisa": em inglês com -stock -watermark, apenas se usar_imagem=true
- "texto": corpo do slide (máx 2 frases curtas, sem negrito, sem asterisco)

Retorne APENAS JSON válido, sem markdown:
{
  "tema_principal": "string",
  "numero_de_slides": ${numSlides || 10},
  "carrossel": [
    {
      "slide": number,
      "layout": "capa_impacto|fundo_overlay_texto|split_horizontal|apenas_tipografia|cta_minimalista",
      "titulo": "string",
      "palavra_destaque": "string",
      "alinhamento": "esquerda|centro|direita",
      "texto": "string",
      "usar_imagem": boolean,
      "termo_pesquisa": "string"
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
          contents: [{ parts: [{ text: `Tema: ${tema}` }] }],
          generationConfig: {
            temperature: modelo_ia === 'minimalist_editorial' ? 0.6 : 0.9,
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
    try { carrossel = JSON.parse(rawText); }
    catch {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      try { carrossel = JSON.parse(cleaned); }
      catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) { try { carrossel = JSON.parse(match[0]); } catch { return NextResponse.json({ error: 'JSON invalido do Gemini' }, { status: 500 }); } }
        else return NextResponse.json({ error: 'JSON invalido do Gemini' }, { status: 500 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slidesComImagem = await Promise.all(carrossel.carrossel.map(async (slide: any) => {
      if (slide.usar_imagem && slide.termo_pesquisa && slide.termo_pesquisa !== 'none') {
        const imageUrl = await searchImage(slide.termo_pesquisa);
        return { ...slide, imageUrl };
      }
      return { ...slide, imageUrl: null };
    }));

    return NextResponse.json({ ...carrossel, carrossel: slidesComImagem });
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
