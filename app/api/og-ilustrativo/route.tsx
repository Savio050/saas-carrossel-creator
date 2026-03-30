import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1080;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const texto = searchParams.get('texto') || 'Slide';
    const imageUrl = searchParams.get('imageUrl');
    const tipo = searchParams.get('tipo') || 'conteudo'; // capa | conteudo | cta
    const nomeMarca = searchParams.get('marca') || 'SUA MARCA';
    const arroba = searchParams.get('arroba') || '@seu_arroba';
    const palavraComentario = searchParams.get('comentario') || 'EUQUERO';

    // Busca a imagem com fallback seguro
    let imageData: string | null = null;
    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      try {
        const res = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          imageData = `data:${contentType};base64,${base64}`;
        }
      } catch {
        // fallback silencioso - renderiza sem imagem
        imageData = null;
      }
    }

    // ---- LAYOUT: CAPA ----
    if (tipo === 'capa') {
      return new ImageResponse(
        (
          <div
            style={{
              width: W,
              height: H,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              position: 'relative',
              backgroundColor: '#111111',
              overflow: 'hidden',
            }}
          >
            {imageData && (
              <img
                src={imageData}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            {/* Gradiente preto inferior */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
                display: 'flex',
              }}
            />
            {/* Nome da marca no topo */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 60px',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(255,107,0,0.85)',
                  padding: '10px 28px',
                  borderRadius: 8,
                  display: 'flex',
                }}
              >
                {nomeMarca}
              </div>
            </div>
            {/* Titulo gigante no rodape */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                padding: '0 70px 80px',
                display: 'flex',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 85,
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  lineHeight: 1.05,
                  letterSpacing: -1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {texto}
              </div>
            </div>
          </div>
        ),
        { width: W, height: H }
      );
    }

    // ---- LAYOUT: CONTEUDO ----
    if (tipo === 'conteudo') {
      return new ImageResponse(
        (
          <div
            style={{
              width: W,
              height: H,
              display: 'flex',
              position: 'relative',
              backgroundColor: '#111111',
              overflow: 'hidden',
            }}
          >
            {imageData && (
              <img
                src={imageData}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            {/* Mascara preta solida */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.62)',
                display: 'flex',
              }}
            />
            {/* Barra laranja lateral */}
            <div
              style={{
                position: 'absolute',
                left: 60,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 7,
                height: 220,
                backgroundColor: '#FF6B00',
                borderRadius: 4,
                display: 'flex',
              }}
            />
            {/* Texto central alinhado a esquerda */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                height: '100%',
                padding: '80px 90px 80px 100px',
              }}
            >
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.35,
                  letterSpacing: -0.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  textAlign: 'left',
                }}
              >
                {texto}
              </div>
              {/* Marca no canto inferior */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 50,
                  right: 70,
                  fontSize: 22,
                  color: 'rgba(255,255,255,0.55)',
                  fontWeight: 500,
                  display: 'flex',
                  letterSpacing: 1,
                }}
              >
                {arroba}
              </div>
            </div>
          </div>
        ),
        { width: W, height: H }
      );
    }

    // ---- LAYOUT: CTA ----
    return new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#002882',
            overflow: 'hidden',
          }}
        >
          {imageData && (
            <img
              src={imageData}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.3,
              }}
            />
          )}
          {/* Vinheta de borda */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
              display: 'flex',
            }}
          />
          {/* Conteudo central */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 40,
              padding: '0 80px',
            }}
          >
            {/* Badge arroba */}
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#FF6B00',
                backgroundColor: 'rgba(255,107,0,0.15)',
                border: '2px solid rgba(255,107,0,0.5)',
                padding: '12px 32px',
                borderRadius: 50,
                letterSpacing: 2,
                display: 'flex',
              }}
            >
              {arroba}
            </div>
            {/* Texto CTA */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 1.2,
                letterSpacing: -0.5,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {texto}
            </div>
            {/* Botao branco gigante */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: '#002882',
                fontSize: 46,
                fontWeight: 900,
                padding: '26px 70px',
                borderRadius: 20,
                letterSpacing: 2,
                textTransform: 'uppercase',
                display: 'flex',
                marginTop: 10,
              }}
            >
              Comente {palavraComentario}
            </div>
          </div>
          {/* Marca no canto inferior */}
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 3,
                backgroundColor: '#FF6B00',
                borderRadius: 2,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                letterSpacing: 2,
                display: 'flex',
              }}
            >
              {nomeMarca}
            </div>
            <div
              style={{
                width: 40,
                height: 3,
                backgroundColor: '#FF6B00',
                borderRadius: 2,
                display: 'flex',
              }}
            />
          </div>
        </div>
      ),
      { width: W, height: H }
    );
  } catch (error) {
    console.error('Erro em /api/og-ilustrativo:', error);
    return new Response('Erro ao gerar imagem', { status: 500 });
  }
}
