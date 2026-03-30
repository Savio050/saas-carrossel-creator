import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Inicializa o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { tema } = await req.json();

    if (!tema) {
      return NextResponse.json({ error: 'Tema é obrigatório' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // O Prompt focado no formato Ilustrativo (Estilo "Futebol Interativo", "Mentalidade", etc)
    const prompt = `
      Você é um copywriter de elite especialista em carrosséis virais do Instagram.
      Crie um roteiro para um carrossel no estilo "Ilustrativo" sobre o tema: "${tema}".
      
      Regras rigorosas:
      1. O carrossel DEVE ter entre 5 e 12 slides.
      2. Slide 1 (tipo: "capa"): Título de impacto, muito curto (máximo 7 palavras). Letras maiúsculas.
      3. Slides 2, 3 e 4 ... (tipo: "conteudo"): Desenvolvimento rápido. Máximo de 2 frases curtas por slide. Sem clichês. sem negrito, sem emojis
      4. Ultimo Slide (tipo: "cta"): Uma chamada para ação agressiva focada em automação. Ofereça algo (aula, material, link) e peça para o usuário comentar uma palavra-chave ESPECÍFICA (uma palavra só, sem espaços, em maiúsculo).
      5. Para cada slide, forneça um "termo_pesquisa" em INGLÊS que represente perfeitamente o fundo ideal (ex: "football stadium dark", "businessman thinking", "laptop coding").

      Retorne APENAS um JSON válido, sem formatação markdown extra, exatamente neste formato:
      {
        "tema_principal": "Resumo do tema",
        "numero_de_slides": X,
        "palavra_comentario": "AULA",
        "carrossel": [
          {
            "slide": 1,
            "tipo": "capa",
            "texto": "O ERRO QUE DESTRUIU A TEMPORADA",
            "termo_pesquisa": "sad soccer player"
          },
          {
            "slide": 2,
            "tipo": "conteudo",
            "texto": "Ele tinha tudo para brilhar, mas um detalhe nos bastidores mudou o jogo.",
            "termo_pesquisa": "stadium lights"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpa o markdown do JSON se o Gemini enviar com ```json
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const carrosselData = JSON.parse(cleanJson);

    // BÔNUS: Lógica de busca de imagens automática (Usa a mesma chave Pexels da sua variável de ambiente)
    // Se você não usa Pexels, ele vai retornar as imagens vazias para o usuário fazer o upload manual, o que não quebra a aplicação.
    if (process.env.PEXELS_API_KEY) {
      for (const slide of carrosselData.carrossel) {
        try {
          const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(slide.termo_pesquisa)}&per_page=1&orientation=portrait`, {
            headers: { Authorization: process.env.PEXELS_API_KEY }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.photos && data.photos.length > 0) {
              slide.imageUrl = data.photos[0].src.large2x || data.photos[0].src.large;
              slide.usar_imagem = true;
            }
          }
        } catch (e) {
          console.error(`Erro ao buscar imagem para o slide ${slide.slide}`, e);
          slide.imageUrl = null;
          slide.usar_imagem = false;
        }
      }
    } else {
      // Se não tiver API Key configurada, apenas prepara o campo
      carrosselData.carrossel.forEach((slide: any) => {
        slide.imageUrl = null;
        slide.usar_imagem = false;
      });
    }

    return NextResponse.json(carrosselData);

  } catch (error) {
    console.error('Erro na geração do carrossel ilustrativo:', error);
    return NextResponse.json({ error: 'Falha ao processar a inteligência artificial.' }, { status: 500 });
  }
}
