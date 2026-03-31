import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1350; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const texto = searchParams.get('texto') || 'Texto não encontrado';
    const imageUrl = searchParams.get('imageUrl');
    const layout = searchParams.get('layout') || searchParams.get('tipo') || 'conteudo_overlay'; 
    const nomeMarca = searchParams.get('marca') || 'SUA MARCA';
    const palavraComentario = searchParams.get('comentario') || 'MED';
    const posicao = searchParams.get('posicao') || 'centro'; 
    
    // Novas Configurações de Tipografia
    const tamanho = searchParams.get('tamanho') || 'padrao';
    const espacamento = searchParams.get('espacamento') || 'padrao';

    // Calculando Tamanho
    let baseFontSize = 56;
    if (tamanho === 'pequeno') baseFontSize = 46;
    if (tamanho === 'grande') baseFontSize = 66;
    if (tamanho === 'gigante') baseFontSize = 76;

    // Calculando Espaçamento
    let lineHeight = 1.4;
    if (espacamento === 'apertado') lineHeight = 1.1;
    if (espacamento === 'largo') lineHeight = 1.7;

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
        imageData = null;
      }
    }

    // 1. CAPA
    if (layout === 'capa') {
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
            {imageData && <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4), transparent)' }} />
            <div style={{ position: 'absolute', top: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '0.2em' }}>{nomeMarca}</div>
            </div>
            <div style={{ position: 'relative', zIndex: 10, padding: '0 60px 100px 60px', display: 'flex', width: '100%', justifyContent: 'center' }}>
              <div style={{ fontSize: baseFontSize + 35, fontWeight: 900, color: 'white', textTransform: 'uppercase', textAlign: 'center', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
                {texto}
              </div>
            </div>
          </div>
        ), { width: W, height: H }
      );
    }

    // 2. CONTEÚDO SPLIT (Metade Imagem / Metade Branco)
    if (layout === 'conteudo_split') {
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: '#F4F7F6', overflow: 'hidden' }}>
            <div style={{ display: 'flex', width: '100%', height: '55%', position: 'relative', backgroundColor: '#E2E8F0' }}>
              {imageData && <img src={imageData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ display: 'flex', width: '100%', height: '45%', padding: '0 100px', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: baseFontSize - 4, fontWeight: 500, color: '#0F172A', lineHeight: lineHeight, whiteSpace: 'pre-wrap' }}>
                {texto}
              </div>
            </div>
          </div>
        ), { width: W, height: H }
      );
    }

    // 3. CTA MINIMALISTA
    if (layout === 'cta_minimalista' || layout === 'cta') {
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#001E60', overflow: 'hidden' }}>
            {imageData && <img src={imageData} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, padding: '0 100px' }}>
              <div style={{ fontSize: baseFontSize + 4, fontWeight: 500, color: 'white', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
                {texto}
              </div>
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '30px 80px', borderRadius: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#001E60', fontSize: 56, fontWeight: 900 }}>Comente {palavraComentario}</span>
              </div>
            </div>
          </div>
        ), { width: W, height: H }
      );
    }

    // 4. CONTEÚDO OVERLAY (PADRÃO)
    let justifyContent = 'center';
    let padding = '0 100px';

    if (posicao === 'topo') {
      justifyContent = 'flex-start';
      padding = '180px 100px 0 100px'; 
    } else if (posicao === 'rodape') {
      justifyContent = 'flex-end';
      padding = '0 100px 180px 100px'; 
    }

    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
          {imageData && <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: justifyContent, padding: padding, width: '100%', height: '100%' }}>
            <div style={{ fontSize: baseFontSize, fontWeight: 600, color: 'white', lineHeight: lineHeight, whiteSpace: 'pre-wrap' }}>
              {texto}
            </div>
          </div>
        </div>
      ), { width: W, height: H }
    );

  } catch (error) {
    return new Response('Erro ao gerar imagem', { status: 500 });
  }
}
