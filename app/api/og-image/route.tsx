import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1350;

async function loadGoogleFont(fontFamily: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const familyFormatted = fontFamily.replace(/ /g, '+');
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${familyFormatted}:wght@${weight}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then(r => r.text());
    const match = css.match(/url\(([^)]+)\)/);
    if (match?.[1]) {
      const url = match[1].replace(/['"]/g, '');
      return await fetch(url).then(r => r.arrayBuffer());
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const texto        = searchParams.get('texto') || '';
    const nome         = searchParams.get('nome') || 'Nome Padrão';
    const arroba       = searchParams.get('arroba') || '@arroba';
    const avatar       = searchParams.get('avatar') || '';
    const isVerified   = searchParams.get('verified') === 'true';
    const imageUrl     = searchParams.get('imageUrl');
    const tema         = searchParams.get('tema') || 'light';

    // New style params
    const fonteParam   = searchParams.get('fonte') || '';
    const boldParam    = searchParams.get('bold') === 'true';
    const italicParam  = searchParams.get('italic') === 'true';
    const tamanhoParam = parseInt(searchParams.get('tamanho') || '52', 10);
    const posicao      = searchParams.get('posicao') || 'centro';
    const alinhamento  = searchParams.get('alinhamento') || 'esquerda';
    const corFundo     = searchParams.get('corFundo') || '';

    // Configuração de Cores Dinâmicas
    const bgCorBase   = tema === 'dark' ? '#000000' : '#FFFFFF';
    const bgCor       = corFundo || bgCorBase;
    const textoCor    = tema === 'dark' ? '#E7E9EA' : '#0F1419';
    const subtextoCor = tema === 'dark' ? '#71767B' : '#536471';
    const bordaCor    = tema === 'dark' ? '#2F3336' : '#EFF3F4';

    // Font loading
    const shouldLoadFont = fonteParam && fonteParam !== 'sans-serif';
    const fontWeight     = boldParam ? 700 : 400;
    const fontBuffer     = shouldLoadFont ? await loadGoogleFont(fonteParam, fontWeight) : null;
    const fontFamily     = fontBuffer ? `"${fonteParam}", sans-serif` : 'sans-serif';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fontOptions    = fontBuffer ? { fonts: [{ name: fonteParam, data: fontBuffer, style: italicParam ? 'italic' as any : 'normal' as any }] } : {};

    // Text alignment
    const textAlign = alinhamento === 'centro' ? 'center' : alinhamento === 'direita' ? 'right' : 'left';

    // Vertical position
    let justifyContent = 'center';
    if (posicao === 'topo')   justifyContent = 'flex-start';
    if (posicao === 'rodape') justifyContent = 'flex-end';

    let imageData: string | null = null;
    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      try {
        const res = await fetch(imageUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          imageData = `data:${contentType};base64,${base64}`;
        }
      } catch { imageData = null; }
    }

    // When no image, default position is center; with image default is flex-start
    const contentJustify = imageData ? justifyContent : (posicao === 'centro' ? 'center' : justifyContent);

    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: bgCor, padding: '80px', fontFamily }}>

          {/* HEADER DO TWITTER */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
            <img src={avatar} style={{ width: 120, height: 120, borderRadius: '50%', marginRight: '30px', objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 46, fontWeight: 700, color: textoCor, marginRight: '10px' }}>{nome}</span>
                {isVerified && (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="#1D9BF0">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.45-.032.205-.05.412-.05.62 0 2.21 1.71 4 3.918 4 .622 0 1.213-.157 1.744-.427.575 1.155 1.745 1.93 3.12 1.93 1.373 0 2.544-.775 3.118-1.93.53.27 1.122.427 1.745.427 2.208 0 3.918-1.79 3.918-4 0-.208-.018-.415-.05-.62 1.126-.704 1.866-1.99 1.866-3.45zm-11.46 5.48l-4.1-3.6 1.48-1.68 2.45 2.14 5.38-6.9 1.66 1.3-6.87 8.74z" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 38, color: subtextoCor }}>{arroba}</span>
            </div>
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: contentJustify }}>
            <div style={{
              fontSize: tamanhoParam,
              fontWeight: boldParam ? 700 : 400,
              fontStyle: italicParam ? 'italic' : 'normal',
              color: textoCor,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              textAlign,
              marginBottom: imageData ? '50px' : '0',
              fontFamily,
            }}>
              {texto}
            </div>

            {/* IMAGEM OPCIONAL */}
            {imageData && (
              <div style={{ display: 'flex', flex: 1, borderRadius: '40px', overflow: 'hidden', border: `2px solid ${bordaCor}` }}>
                <img src={imageData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      ), { width: W, height: H, ...fontOptions }
    );
  } catch (error) {
    return new Response('Erro', { status: 500 });
  }
}
