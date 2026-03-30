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

    const prompt = `
Você é um Copywriter Sênior e Diretor de Arte especialista em carrosséis de retenção extrema para Instagram (Estilo Documentário/Storytelling).

Sua missão é criar o roteiro de um carrossel sobre o tema: "${tema}".

DIRETRIZES DE ENGAJAMENTO (COPY):
- O carrossel DEVE ter entre 8 e 15 slides.
- Use a técnica de "Escorregador": cada slide deve deixar um gancho para o próximo.
- Textos dos slides de conteúdo devem ser curtos (máximo 15 a 20 palavras).
- Linguagem de autoridade, revelando "bastidores", "segredos" ou "erros fatais".

DIRETRIZES DE DIREÇÃO DE ARTE (VISUAL):
Para reproduzir o design perfeito, você deve assinalar a propriedade "layout" de cada slide escolhendo UMA das opções abaixo:
1. "capa": Uso exclusivo no slide 1. Título GIGANTE EM UPPERCASE no rodapé.
2. "conteudo_overlay": Imagem em tela cheia com máscara escura, texto branco legível e centralizado.
3. "conteudo_split": Imagem na metade superior, fundo branco sólido na metade inferior com texto escuro e elegante (excelente para respiros visuais).
4. "cta_minimalista": Uso exclusivo no último slide. Fundo em cor sólida, texto direto e um "botão" de comentário.

ESTRUTURA OBRIGATÓRIA DO JSON (Retorne APENAS o JSON, sem markdown ou explicações):
{
  "tema_principal": "string com o tema resumido",
  "numero_de_slides": integer (entre 8 e 15),
  "estilo": "ilustrativo",
  "palavra_comentario": "PALAVRA_EM_UPPERCASE",
  "carrossel": [
    {
      "slide": 1,
      "tipo": "capa",
      "layout": "capa",
      "texto": "TITULO DE IMPACTO GIGANTE (MAX 7 PALAVRAS)",
      "usar_imagem": true,
      "termo_pesquisa": "english search term for pexels (e.g., sad athlete, dark office)"
    },
    {
      "slide": 2,
      "tipo": "conteudo",
      "layout": "conteudo_overlay",
      "texto": "A narrativa começa aqui com um problema ou curiosidade intrigante.",
      "usar_imagem": true,
      "termo_pesquisa": "english search term"
    },
    {
      "slide": 3,
      "tipo": "conteudo",
      "layout": "conteudo_split",
      "texto": "Use este layout de fundo branco para destacar um dado técnico ou fato oficial.",
      "usar_imagem": true,
      "termo_pesquisa": "english search term"
    },
    {
      "slide": "...",
      "tipo": "conteudo",
      "layout": "Intercale entre conteudo_overlay e conteudo_split para dinamicidade",
      "texto": "...",
      "usar_imagem": true,
      "termo_pesquisa": "..."
    },
    {
      "slide": "ultimo",
      "tipo": "cta",
      "layout": "cta_minimalista",
      "texto": "Quer dominar [ASSUNTO]?\\n\\nComente [PALAVRA]\\n\\ne receba o acesso no direct!",
      "usar_imagem": false,
      "termo_pesquisa": ""
    }
  ]
}
`;

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
