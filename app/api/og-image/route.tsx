import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const texto = searchParams.get('texto') || 'Texto não encontrado';
    const imageUrl = searchParams.get('imageUrl');
    
    // Novos parâmetros dinâmicos
    const nome = searchParams.get('nome') || 'Nome de Usuário';
    const arroba = searchParams.get('arroba') || '@usuario';
    const avatar = searchParams.get('avatar') || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

    const hasImage = imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined';

    return new ImageResponse(
      (
        <div style={{
          display: 'flex', flexDirection: 'column', width: 1080, height: 1350,
          backgroundColor: '#FFFFFF', padding: '80px', fontFamily: 'sans-serif',
        }}>
          
          {/* Cabeçalho Dinâmico */}
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

          <div style={{ 
            display: 'flex', fontSize: '48px', color: '#000000', lineHeight: 1.4, 
            letterSpacing: '-0.02em', marginBottom: hasImage ? '60px' : '0', 
            flexWrap: 'wrap', whiteSpace: 'pre-wrap' 
          }}>
            {texto}
          </div>

          {hasImage && (
            <div style={{ display: 'flex', width: '100%', flex: 1, overflow: 'hidden', borderRadius: '32px' }}>
              <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      ),
      { width: 1080, height: 1350 }
    );
  } catch (e) {
    return new Response(`Erro ao gerar imagem`, { status: 500 });
  }
}
