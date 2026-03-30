import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Textos e Configurações
    const texto = searchParams.get('texto') || 'Texto não encontrado';
    const imageUrl = searchParams.get('imageUrl');
    const tipo = searchParams.get('tipo') || 'conteudo'; // capa | conteudo | cta
    const palavraComentario = searchParams.get('comentario') || 'EUQUERO';
    
    // Dados da Marca
    const nomeMarca = searchParams.get('marca') || 'SUA MARCA';
    const arroba = searchParams.get('arroba') || '@seu_arroba';

    // Download da Imagem de Fundo (Sistema Antibloqueio)
    let imageBuffer: ArrayBuffer | null = null;
    let hasImage = false;

    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      try {
        const res = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          imageBuffer = await res.arrayBuffer();
          hasImage = true;
        }
      } catch (error) {
        console.warn('Erro ao baixar imagem de fundo.');
      }
    }

    // --- RENDERIZAÇÃO DA CAPA ---
    if (tipo === 'capa') {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', width: 1080, height: 1350, backgroundColor: '#111', position: 'relative' }}>
            {hasImage && imageBuffer && (
              <img src={imageBuffer as any} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {/* Máscara de Gradiente Inferior Escura para o texto aparecer */}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '60%', backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }} />
            
            {/* Logo Topo */}
            <div style={{ position: 'absolute', top: 60, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase' }}>
                {nomeMarca}
              </span>
            </div>

            {/* Título Gigante Rodapé */}
            <div style={{ display: 'flex', position: 'absolute', bottom: 80, padding: '0 60px', width: '100%', justifyContent: 'center' }}>
              <h1 style={{ fontSize: '85px', color: '#FFFFFF', textAlign: 'center', textTransform: 'uppercase', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', margin: 0 }}>
                {texto}
              </h1>
            </div>
          </div>
        ),
        { width: 1080, height: 1350 }
      );
    }

    // --- RENDERIZAÇÃO DO CTA (ÚLTIMO SLIDE) ---
    if (tipo === 'cta') {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 1080, height: 1350, backgroundColor: '#002882', position: 'relative' }}>
            {hasImage && imageBuffer && (
              <img src={imageBuffer as any} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
            )}
            
            {/* Conteúdo Centralizado */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', zIndex: 10, padding: '0 100px', marginTop: '-150px' }}>
              
              {/* Badge Arroba */}
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '40px', padding: '10px 30px', marginBottom: '60px' }}>
                <span style={{ color: '#FFF', fontSize: '28px', fontWeight: 'bold' }}>{arroba}</span>
              </div>

              {/* Texto Principal */}
              <p style={{ fontSize: '56px', color: '#FFFFFF', textAlign: 'center', fontWeight: '500', lineHeight: 1.3, marginBottom: '60px' }}>
                {texto}
              </p>

              {/* Botão Comente */}
              <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderRadius: '80px', padding: '30px 80px', marginBottom: '60px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '64px', color: '#000000', fontWeight: 'bold' }}>
                  Comente <span style={{ color: '#002882' }}>{palavraComentario}</span>
                </span>
              </div>

              {/* Texto Secundário */}
              <p style={{ fontSize: '42px', color: '#FFFFFF', textAlign: 'center', fontWeight: '400' }}>
                e receba o link no seu direct!
              </p>
            </div>
          </div>
        ),
        { width: 1080, height: 1350 }
      );
    }

    // --- RENDERIZAÇÃO DO CONTEÚDO (MEIO) ---
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: 1080, height: 1350, backgroundColor: '#111', position: 'relative' }}>
          {hasImage && imageBuffer && (
            <img src={imageBuffer as any} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {/* Máscara Escura Inteira para garantir leitura do texto, independentemente da imagem */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
          
          <div style={{ display: 'flex', position: 'absolute', top: '15%', padding: '0 80px', width: '100%', justifyContent: 'center' }}>
            <p style={{ fontSize: '54px', color: '#FFFFFF', textAlign: 'left', fontWeight: '500', lineHeight: 1.4, margin: 0 }}>
              {texto}
            </p>
          </div>
        </div>
      ),
      { width: 1080, height: 1350 }
    );

  } catch (e) {
    console.error('Erro geral no Satori (Ilustrativo):', e);
    return new Response(`Erro ao gerar imagem ilustrativa`, { status: 500 });
  }
}
