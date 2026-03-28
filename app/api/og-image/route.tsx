import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const texto = searchParams.get('texto') || 'Texto não encontrado';
    const imageUrl = searchParams.get('imageUrl');
    
    const nome = searchParams.get('nome') || 'Nome de Usuário';
    const arroba = searchParams.get('arroba') || '@usuario';
    const avatar = searchParams.get('avatar') || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

    // Variáveis para controlar a imagem de fundo
    let imageBuffer: ArrayBuffer | null = null;
    let hasImage = false;

    // Se o Gemini pediu imagem, tentamos baixar primeiro
    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      try {
        // Finge ser um navegador real (Chrome) para tentar furar os bloqueios de segurança dos sites
        const res = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(4000) // Se o site demorar mais de 4 segundos, desiste para não travar o app
        });

        if (res.ok) {
          // Se baixou com sucesso, passamos o arquivo direto para o Satori renderizar
          imageBuffer = await res.arrayBuffer();
          hasImage = true;
        }
      } catch (error) {
        console.warn('A imagem externa bloqueou o download. Convertendo slide para modo texto.', imageUrl);
        // O hasImage continua false, então o slide vira branco automaticamente!
      }
    }

    return new ImageResponse(
      (
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          width: 1080, 
          height: 1350,
          backgroundColor: '#FFFFFF', 
          padding: '80px', 
          fontFamily: 'sans-serif',
          // A MÁGICA ACONTECE AQUI:
          justifyContent: hasImage ? 'flex-start' : 'center', 
        }}>
          
          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '50px' }}>
            <img
              src={avatar}
              style={{ width: '130px', height: '130px', borderRadius: '65px', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '35px' }}>
              <span style={{ fontSize: '52px', fontWeight: 'bold', color: '#000000', lineHeight: 1.2 }}>
                {nome}
              </span>
              <span style={{ fontSize: '42px', color: '#657786' }}>
                {arroba}
              </span>
            </div>
          </div>

          {/* Texto */}
          <div style={{ 
            display: 'flex', fontSize: '48px', color: '#000000', lineHeight: 1.4, 
            letterSpacing: '-0.02em', marginBottom: hasImage ? '60px' : '0', 
            flexWrap: 'wrap', whiteSpace: 'pre-wrap' 
          }}>
            {texto}
          </div>

          {/* Imagem (Só renderiza se o download foi bem-sucedido) */}
          {hasImage && imageBuffer && (
            <div style={{ display: 'flex', width: '100%', flex: 1, overflow: 'hidden', borderRadius: '32px' }}>
              {/* O Satori consegue ler o ArrayBuffer diretamente, o que evita erros de URL quebrada */}
              <img src={imageBuffer as any} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

        </div>
      ),
      { width: 1080, height: 1350 }
    );
  } catch (e) {
    console.error('Erro geral na geracao do Satori:', e);
    return new Response(`Erro ao gerar imagem`, { status: 500 });
  }
}
