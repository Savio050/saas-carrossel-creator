import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function buscarImagemPexels(termo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(termo)}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: process.env.PEXELS_API_KEY || '' },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large2x || data.photos[0].src.large || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tema } = await req.json();
    if (!tema || !tema.trim()) {
      return NextResponse.json({ error: 'Tema obrigatorio' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Voce e um especialista em marketing de conteudo para redes sociais.
Crie um carrossel ilustrativo com EXATAMENTE 5 slides sobre o tema: "${tema}".

Retorne APENAS um JSON valido, sem markdown, sem explicacoes, sem blocos de codigo.
O JSON deve ter este formato exato:
{
  "tema_principal": "string com o tema resumido",
  "numero_de_slides": 5,
  "estilo": "ilustrativo",
  "palavra_comentario": "PALAVRA",
  "carrossel": [
    {
      "slide": 1,
      "tipo": "capa",
      "texto": "TITULO DE IMPACTO EM UPPERCASE (maximo 8 palavras)",
      "usar_imagem": true,
      "termo_pesquisa": "english search term for pexels image"
    },
    {
      "slide": 2,
      "tipo": "conteudo",
      "texto": "Desenvolvimento do ponto 1 com insight valioso. Use 2 a 3 frases curtas e diretas.",
      "usar_imagem": true,
      "termo_pesquisa": "english search term for pexels image"
    },
    {
      "slide": 3,
      "tipo": "conteudo",
      "texto": "Desenvolvimento do ponto 2 com dado ou exemplo pratico. Use 2 a 3 frases curtas.",
      "usar_imagem": true,
      "termo_pesquisa": "english search term for pexels image"
    },
    {
      "slide": 4,
      "tipo": "conteudo",
      "texto": "Conclusao com dica acionavel e pratica. Use 2 a 3 frases motivadoras.",
      "usar_imagem": true,
      "termo_pesquisa": "english search term for pexels image"
    },
    {
      "slide": 5,
      "tipo": "cta",
      "texto": "Comente abaixo com a palavra-chave para receber o material completo!",
      "usar_imagem": true,
      "termo_pesquisa": "english search term for pexels image"
    }
  ]
}

Regras obrigatorias:
- "palavra_comentario" deve ser UMA unica palavra em UPPERCASE sem espacos (ex: QUERO, ACESSO, SIM, INICIO, CRESCER)
- "termo_pesquisa" deve estar em INGLES, ser especifico e visual (ex: "modern city skyline night", "entrepreneur working laptop cafe", "social media marketing strategy")
- O texto do slide 1 (capa) deve ser CURTO, IMPACTANTE e em UPPERCASE
- Os slides de conteudo devem trazer valor real e pratico sobre: ${tema}
- Retorne APENAS o JSON, absolutamente nada mais`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON nao encontrado na resposta');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Erro ao processar resposta da IA. Tente novamente.' }, { status: 500 });
    }

    // Busca imagens no Pexels para cada slide em paralelo (silenciosamente)
    const slidesComImagem = await Promise.all(
      (parsed.carrossel as Array<{ termo_pesquisa: string; imageUrl?: string | null; [key: string]: unknown }>).map(async (slide) => {
        const imageUrl = await buscarImagemPexels(slide.termo_pesquisa);
        return { ...slide, imageUrl };
      })
    );

    return NextResponse.json({
      ...parsed,
      carrossel: slidesComImagem,
    });
  } catch (error) {
    console.error('Erro em /api/gerar-ilustrativo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
