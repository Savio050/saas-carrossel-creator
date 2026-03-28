import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const texto = searchParams.get('texto') || 'Texto não encontrado';
    const imageUrl = searchParams.get('imageUrl'); 

    // O Satori usa dimensões de Instagram Portrait (1080x1350)
    return new ImageResponse(
      (
        <div style={{
          display: 'flex', flexDirection: 'column', width: 1080, height: 1350,
          backgroundColor: imageUrl ? '#000000' : '#1E293B', // Fundo preto se tiver imagem, azul escuro se não tiver
          position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center'
        }}>
          
          {/* Imagem de Fundo com Opacidade (se existir) */}
          {imageUrl && imageUrl !== 'null' && (
            <img 
              src={imageUrl} 
              style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} 
            />
          )}
          
          {/* Card do Tweet */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            backgroundColor: 'white', padding: '60px', borderRadius: '32px',
            width: '880px', zIndex: 10,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            
            {/* Cabeçalho do Tweet: Foto, Nome e @ */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50px', backgroundColor: '#E2E8F0', display: 'flex' }} />
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '30px' }}>
                <span style={{ fontSize: '42px', fontWeight: 'bold', color: '#0F1419', lineHeight: 1.2 }}>Sávio | T3 Studio</span>
                <span style={{ fontSize: '32px', color: '#536471' }}>@t3studio</span>
              </div>
            </div>

            {/* Corpo do Texto (Com quebra automática para não cortar) */}
            <div style={{ 
              fontSize: '48px', color: '#0F1419', lineHeight: 1.4, 
              display: 'flex', flexWrap: 'wrap', letterSpacing: '-0.02em'
            }}>
              {texto}
            </div>
            
          </div>
        </div>
      ),
      { width: 1080, height: 1350 }
    );
  } catch (e) {
    return new Response(`Erro ao gerar imagem`, { status: 500 });
  }
}
