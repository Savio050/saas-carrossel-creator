import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Motor de busca do Ilustrativo: Usa Pexels (Imagens de estúdio, 100% seguras e gratuitas)
async function searchImage(termo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(termo)}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: process.env.PEXELS_API_KEY || '' },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      // Usamos o tamanho 'large' (ótima qualidade, mas leve para carregar rápido)
      return data.photos[0].src.large || null; 
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('is_pro').eq('id', user.id).single();
    if (!profile?.is_pro) return NextResponse.json({ error: 'Plano PRO necessario' }, { status: 403 });

    // Recebendo as configurações dinâmicas da interface
    const { tema, modeloPrompt, configImagem, numSlides } = await req.json();
    if (!tema) return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });

    // Lógica de Imagens (Herdada das configurações)
    let regraImagens = 'Tente usar imagens conceituais na maioria dos slides, mas pode deixar 2 ou 3 sem imagem para respiro.';
    if (configImagem === 'sempre') {
      regraImagens = 'TODOS os slides DEVEM ter usar_imagem como true e um termo_pesquisa correspondente.';
    } else if (configImagem === 'nunca') {
      regraImagens = 'TODOS os slides DEVEM ter usar_imagem como false. O carrossel será 100% focado no texto.';
    }

    const qtdSlides = numSlides || 10;
    const basePrompt = modeloPrompt || 'Você é um diretor de arte e copywriter de elite, especialista em carrosséis magnéticos e visuais para o Instagram.';

    const systemPrompt = `${basePrompt}
    Escreva EXATAMENTE ${qtdSlides} slides sobre o tema fornecido.
    A regra para imagens é: ${regraImagens}
    O texto deve ser curto, poético ou incisivo (máximo de 15 palavras por slide de conteúdo).
    Se usar imagem, coloque o termo_pesquisa EM INGLÊS focando na EMOÇÃO ou CONCEITO (ex: "lonely man", "success building", "dark aesthetic").
    
    Cada slide DEVE ter um "tipo" e um "layout":
    - Slide 1: tipo "capa", layout "capa".
    - Slides do meio: tipo "conteudo", layout alternando entre "conteudo_overlay" e "conteudo_split".
    - Último slide: tipo "cta", layout "cta_minimalista". Crie uma palavra de 4 a 6 letras para "palavra_comentario".

    Retorne APENAS JSON válido, sem markdown:
    { 
      "tema_principal": "string", 
      "numero_de_slides": ${qtdSlides},
      "palavra_comentario": "EUQUERO",
      "carrossel": [ 
        { "slide": number, "texto": "string", "usar_imagem": boolean, "termo_pesquisa": "string", "tipo": "string", "layout": "string" } 
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
            temperature: 0.9,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini API error:', geminiData);
      return NextResponse.json({ error: 'Erro na API do Gemini', details: geminiData }, { status: 500 });
    }

    const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();

    if (!rawText) return NextResponse.json({ error: 'Gemini retornou resposta vazia' }, { status: 500 });

    let carrossel;
    try {
      carrossel = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      try {
        carrossel = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            carrossel = JSON.parse(match[0]);
          } catch {
            return NextResponse.json({ error: 'JSON invalido do Gemini' }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: 'JSON invalido do Gemini' }, { status: 500 });
        }
      }
    }

    // Busca as imagens no Pexels
    const slidesComImagem = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      carrossel.carrossel.map(async (slide: any) => {
        if (slide.usar_imagem && slide.termo_pesquisa && slide.termo_pesquisa !== 'none') {
          const imageUrl = await searchImage(slide.termo_pesquisa);
          return { ...slide, imageUrl };
        }
        return { ...slide, imageUrl: null };
      })
    );

    return NextResponse.json({
      tema_principal: carrossel.tema_principal,
      numero_de_slides: carrossel.numero_de_slides,
      palavra_comentario: carrossel.palavra_comentario,
      carrossel: slidesComImagem,
    });
  } catch (error) {
    console.error('Erro na rota gerar-ilustrativo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
