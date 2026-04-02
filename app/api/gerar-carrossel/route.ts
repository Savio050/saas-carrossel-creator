import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Busca limpa no Serper: Pega o primeiro resultado e deixa o frontend lidar com os erros silenciosamente
async function searchImage(query: string): Promise<string | null> {
  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 3 }),
    });
    const data = await res.json();
    return data.images?.[0]?.imageUrl ?? null;
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

    // Recebendo as novas configurações enviadas pela interface
    const { tema, modeloPrompt, configImagem, numSlides } = await req.json();
    if (!tema) return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });

    // Lógica dinâmica de imagens baseada na escolha do usuário
    let regraImagens = '30% dos slides sem imagem.';
    if (configImagem === 'sempre') {
      regraImagens = 'TODOS os slides DEVEM ter usar_imagem como true e um termo_pesquisa correspondente.';
    } else if (configImagem === 'nunca') {
      regraImagens = 'TODOS os slides DEVEM ter usar_imagem como false. O carrossel será 100% texto.';
    }

    // Montagem do Prompt Dinâmico com a Persona selecionada
    const basePrompt = modeloPrompt || 'Você é um copywriter de elite especialista em carrosséis virais para Instagram.';
    
    const systemPrompt = `${basePrompt}
    Você deve escrever EXATAMENTE ${numSlides || 10} slides sobre o tema fornecido.
    A regra para imagens é: ${regraImagens}
    O texto deve ser incisivo, máximo 2 parágrafos curtos por slide. SEM negrito, SEM asterisco.
    Se usar_imagem for true, coloque o termo_pesquisa em inglês com -stock -watermark -getty -shutterstock.
    Retorne APENAS JSON válido, sem markdown, no formato exato:
    { "tema_principal": "string", "numero_de_slides": ${numSlides || 10}, "carrossel": [ { "slide": number, "texto": "string", "usar_imagem": boolean, "termo_pesquisa": "string" } ] }`;

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

    if (!rawText) {
      console.error('Gemini retornou texto vazio.');
      return NextResponse.json({ error: 'Gemini retornou resposta vazia' }, { status: 500 });
    }

    let carrossel;
    try {
      carrossel = JSON.parse(rawText);
    } catch {
      // Fallback de limpeza caso o Gemini mande blocos de markdown ```json
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      try {
        carrossel = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            carrossel = JSON.parse(match[0]);
          } catch {
            return NextResponse.json({ error: 'JSON invalido do Gemini', raw: rawText }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: 'JSON invalido do Gemini', raw: rawText }, { status: 500 });
        }
      }
    }

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
      carrossel: slidesComImagem,
    });
  } catch (error) {
    console.error('Erro na rota gerar-carrossel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
