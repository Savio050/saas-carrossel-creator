import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── Prompts de Copywriting por Modelo de IA ────────────────────────────────
const MODELO_PROMPTS: Record<string, string> = {
  aesthetic_minimalist: `
MODELO ATIVO: Aesthetic Minimalist (Ref: @hyeser)
Aplique RIGOROSAMENTE as 5 regras:
1. GANCHO: Pergunta curta que quebra padrão do feed. "Você está errando nisso." / "Por que ainda não mudou?"
2. ESTRUTURA: MÁXIMO 10 palavras por slide. Frases cortadas, zero enchimento.
3. DIREÇÃO VISUAL: Termos em inglês evocando minimalismo: "white minimal desk", "empty clean room", "blank space aesthetic".
4. FOCO: Reflexão profunda ou provocação direta. Sem listas, sem texto longo.
5. CTA: Tom irônico-provocativo. "Ainda acha que estou errado? Comenta aí."`,

  clean_corporate: `
MODELO ATIVO: Clean Corporate (Ref: @academiabrsocialmedia)
Aplique RIGOROSAMENTE as 5 regras:
1. GANCHO: Título orientado a utilidade. "5 Ferramentas gratuitas para..." / "O framework que empresas bilionárias usam:"
2. ESTRUTURA: Tópicos numerados ou bullet points. Cada slide entrega informação completa.
3. DIREÇÃO VISUAL: Termos profissionais: "business presentation whiteboard", "corporate clean office", "data dashboard screen".
4. FOCO: Valor técnico, prático e aplicável. O leitor aprende algo concreto.
5. CTA: Focado em utilidade. "Salve esse post para não esquecer." / "Aplique hoje."`,

  dynamic_sports: `
MODELO ATIVO: Dynamic Sports (Ref: @futebolinterativobr)
Aplique RIGOROSAMENTE as 5 regras:
1. GANCHO: Afirmação de alto impacto. "O verdadeiro motivo da demissão de X." / "Nenhum canal vai te contar isso."
2. ESTRUTURA: Textos dramáticos. Use NÚMEROS GRANDES. Cada slide aumenta a tensão narrativa.
3. DIREÇÃO VISUAL: Termos de ação: "stadium crowd explosion", "athlete victory celebration", "sports dramatic moment".
4. FOCO: Dinamismo, paixão visceral. O leitor sente urgência em avançar.
5. CTA: Debate intenso. "Deixe sua opinião. Faria diferente?" / "Concorda ou é lenda?"`,

  minimalist_editorial: `
MODELO ATIVO: Minimalist Editorial (Ref: @thenews.cc)
Aplique RIGOROSAMENTE as 5 regras:
1. GANCHO: Manchete jornalística direta. Resuma o fato em até 6 palavras. Sem clickbait.
2. ESTRUTURA: Estilo parágrafo de notícia — direto aos fatos. Um fato por slide.
3. DIREÇÃO VISUAL: Termos editoriais: "newspaper texture", "editorial minimal layout", "clean news studio", "modern journalism desk".
4. FOCO: Linguagem imparcial, inteligente. Zero opiniões, só dados e contexto.
5. CTA: Neutro e direcionador. "Leia a matéria completa no link da bio." / "Siga para mais análises."`,
};

async function searchImage(termo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(termo)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY || '' }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('is_pro').eq('id', user.id).single();
    if (!profile?.is_pro) return NextResponse.json({ error: 'Plano PRO necessario' }, { status: 403 });

    const { tema, modelo_ia, configImagem, numSlides, customPrompt } = await req.json();
    if (!tema) return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });

    let regraImagens = 'Tente usar imagens conceituais na maioria dos slides, mas deixe 2-3 sem imagem.';
    if (configImagem === 'sempre') regraImagens = 'TODOS os slides DEVEM ter usar_imagem como true.';
    if (configImagem === 'nunca')  regraImagens = 'TODOS os slides DEVEM ter usar_imagem como false.';

    const qtdSlides = numSlides || 10;
    const basePrompt = customPrompt || 'Você é um diretor de arte e copywriter de elite, especialista em carrosséis magnéticos para o Instagram.';
    const modeloPrompt = MODELO_PROMPTS[modelo_ia] ?? '';

    const systemPrompt = `${basePrompt}
${modeloPrompt}

INSTRUÇÕES DE ESTRUTURA — ARQUITETURA LEGO (não sobrescreva as regras do Modelo acima):
- Escreva EXATAMENTE ${qtdSlides} slides sobre o tema fornecido.
- Regra de imagens: ${regraImagens}
- Se usar imagem, coloque o termo_pesquisa EM INGLÊS seguindo a DIREÇÃO VISUAL do Modelo ativo.

Você é o Diretor de Arte. Escolha o bloco visual mais impactante para cada slide:
- "capa_impacto": Capa. Headline grande centralizada. Use APENAS no slide 1. Tipo: "capa".
- "fundo_overlay_texto": Imagem de fundo + overlay escuro + texto sobreposto. Para slides dramáticos. Tipo: "conteudo".
- "split_horizontal": Imagem top, texto bottom. Para slides informativos. Tipo: "conteudo".
- "apenas_tipografia": Sem imagem. Fundo sólido + tipografia expressiva. Para insights e dados. Tipo: "conteudo".
- "cta_minimalista": Call-to-action final. Use APENAS no último slide. Tipo: "cta". Inclua uma palavra de 4-6 letras no campo "palavra_comentario" do JSON raiz.

Para cada slide defina:
- "layout": bloco escolhido
- "titulo": headline do slide (máx 8 palavras, seguindo o estilo do Modelo ativo)
- "palavra_destaque": UMA palavra do titulo para colorir com a cor de marca
- "alinhamento": "esquerda", "centro" ou "direita"
- "usar_imagem": true apenas para "fundo_overlay_texto" e "split_horizontal"
- "termo_pesquisa": em inglês, seguindo a DIREÇÃO VISUAL do Modelo ativo
- "texto": corpo do slide (máx 2 frases, seguindo o estilo do Modelo ativo)
- "tipo": "capa" | "conteudo" | "cta"

Retorne APENAS JSON válido, sem markdown:
{
  "tema_principal": "string",
  "numero_de_slides": ${qtdSlides},
  "palavra_comentario": "string",
  "carrossel": [
    {
      "slide": number,
      "tipo": "string",
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
        return { ...slide, imageUrl: await searchImage(slide.termo_pesquisa) };
      }
      return { ...slide, imageUrl: null };
    }));

    return NextResponse.json({ ...carrossel, carrossel: slidesComImagem });
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
