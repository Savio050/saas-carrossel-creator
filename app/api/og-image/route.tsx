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
    const isVerified = searchParams.get('verified') === 'true'; // Novo parâmetro

    let imageBuffer: ArrayBuffer | null = null;
    let hasImage = false;

    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      try {
        const res = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          imageBuffer = await res.arrayBuffer();
          hasImage = true;
        }
      } catch (error) {
        console.warn('Bloqueio no download da imagem. Convertendo para modo texto.');
      }
    }

    return new ImageResponse(
      (
        <div style={{
          display: 'flex', flexDirection: 'column', width: 1080, height: 1350,
          backgroundColor: '#FFFFFF', padding: '80px', fontFamily: 'sans-serif',
          justifyContent: hasImage ? 'flex-start' : 'center', 
        }}>
          
          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '50px' }}>
            <img
              src={avatar}
              style={{ width: '130px', height: '130px', borderRadius: '65px', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '52px', fontWeight: 'bold', color: '#000000', lineHeight: 1.2 }}>
                  {nome}
                </span>
                {/* Selo de Verificado SVG (Só renderiza se isVerified for true) */}
                {isVerified && (
                  <svg viewBox="0 0 24 24" aria-label="Conta verificada" style={{ width: '48px', height: '48px', marginLeft: '12px', color: '#1D9BF0' }}>
                    <g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.73 2.044 3.397-.042.196-.063.396-.063.603 0 2.21 1.71 4 3.918 4 .5 0 .97-.084 1.408-.238 1.256 1.152 2.924 1.838 4.757 1.838 1.832 0 3.5-.686 4.756-1.838.438.154.908.238 1.408.238 2.21 0 3.918-1.79 3.918-4 0-.207-.02-.407-.063-.603 1.217-.667 2.044-1.937 2.044-3.397z" fill="currentColor"></path><path d="M10.22 15.18l-3.3-3.3 1.41-1.42 1.89 1.89 4.88-4.88 1.42 1.42-6.3 6.3z" fill="#ffffff"></path></g>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '42px', color: '#657786' }}>
                {arroba}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: '48px', color: '#000000', lineHeight: 1.4, letterSpacing: '-0.02em', marginBottom: hasImage ? '60px' : '0', flexWrap: 'wrap', whiteSpace: 'pre-wrap' }}>
            {texto}
          </div>

          {hasImage && imageBuffer && (
            <div style={{ display: 'flex', width: '100%', flex: 1, overflow: 'hidden', borderRadius: '32px' }}>
              <img src={imageBuffer as any} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
