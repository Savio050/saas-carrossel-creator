import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1350; 

// Função mágica para baixar a fonte do Google Fonts em tempo real
async function loadGoogleFont(fontFamily: string) {
  try {
    const familyFormatted = fontFamily.replace(/ /g, '+');
    // Pegamos um peso alto (700/bold) porque carrosséis precisam de impacto
    const url = `https://fonts.googleapis.com/css2?family=${familyFormatted}:wght@600;700`;
    const css = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(res => res.text());
    
    const match = css.match(/url\(([^)]+)\)/);
    if (match && match[1]) {
      const fontUrl = match[1].replace(/['"]/g, '');
      const res = await fetch(fontUrl);
      return await res.arrayBuffer();
    }
  } catch (e) {
    console.error('Erro ao carregar a fonte', e);
  }
  return null;
}

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
    const fonteEscolhida = searchParams.get('fonte') || 'Montserrat';

    // Baixa a fonte customizada
    const fontBuffer = await loadGoogleFont(fonteEscolhida);
    const fontOptions = fontBuffer ? {
      fonts: [{ name: fonteEscolhida, data: fontBuffer, style: 'normal' as any }]
    } : {};

    // Calculando Tamanho Base
    let baseFontSize = 56;
    if (tamanho === 'pequeno') baseFontSize = 46;
    if (tamanho === 'grande') baseFontSize = 66;
    if (tamanho === 'gigante') baseFontSize = 76;

    let imageData: string | null = null;
    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      try {
        const res = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          imageData = `data:${contentType};base64,${base64}`;
        }
      } catch { imageData = null; }
    }

    const fontFamilyStyle = fontBuffer ? `"${fonteEscolhida}", sans-serif` : 'sans-serif';

    // 1. CAPA
    if (layout === 'capa') {
      return new ImageResponse(
        (
          <div style={{ fontFamily: fontFamilyStyle, width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
            {imageData && <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4), transparent)' }} />
            <div style={{ position: 'absolute', top: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '0.2em' }}>{nomeMarca}</div>
            </div>
            <div style={{ position: 'relative', zIndex: 10, padding: '0 60px 100px 60px', display: 'flex', width: '100%', justifyContent: 'center' }}>
              <div style={{ fontSize: baseFontSize + 35, fontWeight: 800, color: 'white', textTransform: 'uppercase', textAlign: 'center', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
                {texto}
              </div>
            </div>
          </div>
        ), { width: W, height: H, ...fontOptions }
      );
    }

    // 2. CONTEÚDO SPLIT
    if (layout === 'conteudo_split') {
      return new ImageResponse(
        (
          <div style={{ fontFamily: fontFamilyStyle, width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: '#F4F7F6', overflow: 'hidden' }}>
            <div style={{ display: 'flex', width: '100%', height: '55%', position: 'relative', backgroundColor: '#E2E8F0' }}>
              {imageData && <img src={imageData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ display: 'flex', width: '100%', height: '45%', padding: '0 100px', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: baseFontSize - 4, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                {texto}
              </div>
            </div>
          </div>
        ), { width: W, height: H, ...fontOptions }
      );
    }

    // 3. CTA MINIMALISTA
    if (layout === 'cta_minimalista' || layout === 'cta') {
      return new ImageResponse(
        (
          <div style={{ fontFamily: fontFamilyStyle, width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#001E60', overflow: 'hidden' }}>
            {imageData && <img src={imageData} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, padding: '0 100px' }}>
              <div style={{ fontSize: baseFontSize + 4, fontWeight: 600, color: 'white', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
                {texto}
              </div>
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '30px 80px', borderRadius: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#001E60', fontSize: 56, fontWeight: 800 }}>Comente {palavraComentario}</span>
              </div>
            </div>
          </div>
        ), { width: W, height: H, ...fontOptions }
      );
    }

    // 4. CONTEÚDO OVERLAY (PADRÃO)
    let justifyContent = 'center'; let padding = '0 100px';
    if (posicao === 'topo') { justifyContent = 'flex-start'; padding = '180px 100px 0 100px'; }
    else if (posicao === 'rodape') { justifyContent = 'flex-end'; padding = '0 100px 180px 100px'; }

    return new ImageResponse(
      (
        <div style={{ fontFamily: fontFamilyStyle, width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
          {imageData && <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: justifyContent, padding: padding, width: '100%', height: '100%' }}>
            <div style={{ fontSize: baseFontSize, fontWeight: 600, color: 'white', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
              {texto}
            </div>
          </div>
        </div>
      ), { width: W, height: H, ...fontOptions }
    );

  } catch (error) {
    return new Response('Erro ao gerar imagem', { status: 500 });
  }
}
