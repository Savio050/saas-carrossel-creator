import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function searchImage(query: string): Promise<string | null> {
  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 3 }),
    });
    const data = await res.json();
    return data.images?.[0]?.imageUrl ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('is_pro').eq('id', user.id).single();
    if (!profile?.is_pro) return NextResponse.json({ error: 'Plano PRO necessario' }, { status: 403 });

    const { tema } = await req.json();
    if (!tema) return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });

    const systemPrompt = 'Voce e um copywriter de elite especialista em carrosseis virais de Instagram sobre business, marketing e mercado imobiliario. Escolha um case de negocio NOVO e ALEATORIO baseado no tema fornecido. Escreva entre 8 e 15 slides. Slide 1 deve ter gancho chocante com numeros reais. Desenvolvimento mostra bastidores do modelo de negocios. Ultimo slide entrega a licao brutal ou pergunta provocativa. Texto incisivo, max 3 paragrafos curtos por slide. SEM negrito, SEM asterisco. Retorne APENAS JSON valido, sem markdown: { "tema_principal": string, "numero_de_slides": number, "carrossel": [ { "slide": number, "texto": string, "usar_imagem": boolean, "termo_pesquisa": string } ] }. Para usar_imagem true, termo_pesquisa em ingles com -stock -watermark -getty -shutterstock. 30% dos slides sem imagem.';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `Tema: ${tema}` }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').replace(/```json/g, '').replace(/```/g, '').trim();

    let carrossel;
    try { carrossel = JSON.parse(rawText); }
    catch { const m = rawText.match(/\{[\s\S]*\}/); if (m) carrossel = JSON.parse(m[0]); else throw new Error('JSON invalido do Gemini'); }

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

    return NextResponse.json({ ...carrossel, carrossel: slidesComImagem });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}
