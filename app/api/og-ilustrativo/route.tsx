import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1350;

// ── Tema Presets ────────────────────────────────────────────────────────────
// Cada tema define seu sistema de cores e estilo base. As props corPrimaria/corTexto
// recebidas pela URL sobrescrevem os defaults do tema para personalização de marca.
const TEMA_PRESETS: Record<string, {
  bgDefault: string;
  capaBg: string;
  ctaBg: string;
  accentColor: string;
  textDefault: string;
  overlayBase: number;  // opacidade base do overlay de fade
  displayWeight: number;
  bodyWeight: number;
}> = {
  aesthetic_minimalist: {
    bgDefault:     '#FFFFFF',
    capaBg:        '#F4F4F5',
    ctaBg:         '#18181B',
    accentColor:   '#18181B',
    textDefault:   '#18181B',
    overlayBase:   0.40,
    displayWeight: 700,
    bodyWeight:    400,
  },
  clean_corporate: {
    bgDefault:     '#F8FAFC',
    capaBg:        '#EFF6FF',
    ctaBg:         '#1D4ED8',
    accentColor:   '#2563EB',
    textDefault:   '#0F172A',
    overlayBase:   0.58,
    displayWeight: 700,
    bodyWeight:    500,
  },
  dynamic_sports: {
    bgDefault:     '#0A0A0A',
    capaBg:        '#111111',
    ctaBg:         '#DC2626',
    accentColor:   '#EF4444',
    textDefault:   '#FFFFFF',
    overlayBase:   0.68,
    displayWeight: 900,
    bodyWeight:    700,
  },
  minimalist_editorial: {
    bgDefault:     '#FAFAFA',
    capaBg:        '#F3F4F6',
    ctaBg:         '#1F2937',
    accentColor:   '#374151',
    textDefault:   '#111827',
    overlayBase:   0.62,
    displayWeight: 600,
    bodyWeight:    400,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
async function loadGoogleFont(fontFamily: string, weight = 700): Promise<ArrayBuffer | null> {
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

async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url || url === 'null' || url === 'undefined') return null;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64  = Buffer.from(buffer).toString('base64');
    const ct      = res.headers.get('content-type') || 'image/jpeg';
    return `data:${ct};base64,${base64}`;
  } catch {
    return null;
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Params legados (manter compatibilidade)
    const texto           = searchParams.get('texto')      || 'Texto não encontrado';
    const imageUrl        = searchParams.get('imageUrl');
    const layout          = searchParams.get('layout')     || searchParams.get('tipo') || 'fundo_overlay_texto';
    const nomeMarca       = searchParams.get('marca')      || 'SUA MARCA';
    const palavraCom      = searchParams.get('comentario') || 'MED';
    const posicao         = searchParams.get('posicao')    || 'centro';
    const tamanho         = searchParams.get('tamanho')    || 'padrao';
    const fonteEscolhida  = searchParams.get('fonte')      || 'Montserrat';

    // Params de Design System
    const tema            = searchParams.get('modelo') || searchParams.get('tema') || 'aesthetic_minimalist';
    const corPrimaria     = searchParams.get('corPrimaria');
    const corTextoParam   = searchParams.get('corTexto');
    const fade            = searchParams.get('fade') !== 'false';
    const watermark       = searchParams.get('watermark') !== 'false';

    // Params Lego Architecture
    const titulo          = searchParams.get('titulo') || texto;
    const destaque        = (searchParams.get('destaque') || '').toLowerCase().trim();

    // Resolve preset + overrides de marca
    const preset      = TEMA_PRESETS[tema] ?? TEMA_PRESETS['aesthetic_minimalist'];
    const accentColor = corPrimaria || preset.accentColor;
    const textColor   = corTextoParam || preset.textDefault;

    // Tamanho base de fonte
    let baseFontSize = 56;
    if (tamanho === 'pequeno') baseFontSize = 46;
    if (tamanho === 'grande')  baseFontSize = 66;
    if (tamanho === 'gigante') baseFontSize = 76;

    // Carrega fonte e imagem em paralelo
    const [fontBuffer, imageData] = await Promise.all([
      loadGoogleFont(fonteEscolhida, preset.displayWeight),
      fetchImageAsBase64(imageUrl!),
    ]);

    const fontFamily   = fontBuffer ? `"${fonteEscolhida}", sans-serif` : 'sans-serif';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fontOptions  = fontBuffer ? { fonts: [{ name: fonteEscolhida, data: fontBuffer, style: 'normal' as any }] } : {};
    const overlayAlpha = fade ? preset.overlayBase : 0.0;

    // ── Marca d'água ───────────────────────────────────────────────────────
    const BrandTag = watermark ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor, display: 'flex' }} />
        <span style={{ color: textColor, fontSize: 22, fontWeight: preset.bodyWeight, opacity: 0.7, letterSpacing: '0.15em', fontFamily, display: 'flex' }}>
          {nomeMarca.toUpperCase()}
        </span>
      </div>
    ) : null;

    // ── renderTitulo: pinta a palavra_destaque com accentColor ─────────────
    // Divide o titulo em palavras e colore a que bate com `destaque`.
    const renderTitulo = (tituloText: string, colorText: string, justifyContent = 'flex-start') => {
      const words = tituloText.split(' ');
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent }}>
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                color: destaque && word.toLowerCase() === destaque ? accentColor : colorText,
                display: 'flex',
                marginRight: i < words.length - 1 ? '0.3em' : 0,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      );
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 1 — CAPA_IMPACTO  (alias legado: capa)
    // Headline gigante centralizada. Imagem de fundo ultralevada (6% opac.)
    // ═══════════════════════════════════════════════════════════════════════
    if (layout === 'capa_impacto' || layout === 'capa') {
      return new ImageResponse((
        <div style={{
          fontFamily, width: W, height: H, display: 'flex', flexDirection: 'column',
          backgroundColor: preset.capaBg, position: 'relative', overflow: 'hidden',
        }}>
          {imageData && (
            <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.06 }} />
          )}
          {/* Accent bar topo */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: accentColor, display: 'flex' }} />
          {/* Brand */}
          {watermark && <div style={{ position: 'absolute', top: 60, left: 70, display: 'flex' }}>{BrandTag}</div>}
          {/* Conteúdo central */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '100px 80px 80px', gap: 32 }}>
            {/* Pílula numerada */}
            <div style={{ display: 'flex', backgroundColor: accentColor, padding: '10px 28px', borderRadius: 100 }}>
              <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, letterSpacing: '0.15em', display: 'flex' }}>01</span>
            </div>
            {/* Headline */}
            <div style={{ fontSize: baseFontSize + 20, fontWeight: preset.displayWeight, lineHeight: 1.05, letterSpacing: '-0.035em', width: '100%' }}>
              {renderTitulo(titulo, textColor, 'center')}
            </div>
            {/* Subtítulo opcional */}
            {texto && texto !== titulo && (
              <div style={{ fontSize: baseFontSize - 10, fontWeight: preset.bodyWeight, color: textColor, opacity: 0.6, lineHeight: 1.55, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {texto}
              </div>
            )}
            {/* Decoração */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: i === 1 ? 44 : 14, height: 6, borderRadius: 3, backgroundColor: i === 1 ? accentColor : `${accentColor}55`, display: 'flex' }} />
              ))}
            </div>
          </div>
        </div>
      ), { width: W, height: H, ...fontOptions });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 2 — APENAS_TIPOGRAFIA
    // Zero imagem. Fundo sólido, barra lateral accent, headline colossal.
    // ═══════════════════════════════════════════════════════════════════════
    if (layout === 'apenas_tipografia') {
      let jc  = 'center';
      let pad = '0 90px';
      if (posicao === 'topo')   { jc = 'flex-start'; pad = '180px 90px 0 90px'; }
      if (posicao === 'rodape') { jc = 'flex-end';   pad = '0 90px 180px 90px'; }

      return new ImageResponse((
        <div style={{
          fontFamily, width: W, height: H, display: 'flex', flexDirection: 'column',
          backgroundColor: preset.bgDefault, position: 'relative', overflow: 'hidden',
        }}>
          {/* Barra lateral esquerda */}
          <div style={{ position: 'absolute', left: 0, top: 80, bottom: 80, width: 6, backgroundColor: accentColor, borderRadius: '0 3px 3px 0', display: 'flex' }} />
          {/* Detalhe canto superior direito */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 6, backgroundColor: accentColor, opacity: 0.2, display: 'flex' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: jc, padding: pad, width: '100%', height: '100%', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 4, backgroundColor: accentColor, borderRadius: 2, display: 'flex' }} />
            </div>
            <div style={{ fontSize: baseFontSize + 12, fontWeight: preset.displayWeight, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              {renderTitulo(titulo, textColor)}
            </div>
            {texto && texto !== titulo && (
              <div style={{ fontSize: baseFontSize - 8, fontWeight: preset.bodyWeight, color: textColor, opacity: 0.7, lineHeight: 1.6, display: 'flex', flexWrap: 'wrap' }}>
                {texto}
              </div>
            )}
          </div>
          {watermark && <div style={{ position: 'absolute', bottom: 60, left: 70, display: 'flex' }}>{BrandTag}</div>}
        </div>
      ), { width: W, height: H, ...fontOptions });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 3 — SPLIT_HORIZONTAL  (alias legado: conteudo_split)
    // Imagem nos 45% superiores, headline + texto nos 55% inferiores.
    // ═══════════════════════════════════════════════════════════════════════
    if (layout === 'split_horizontal' || layout === 'conteudo_split') {
      return new ImageResponse((
        <div style={{
          fontFamily, width: W, height: H, display: 'flex', flexDirection: 'column',
          backgroundColor: preset.bgDefault, overflow: 'hidden',
        }}>
          {/* Imagem topo 45% */}
          <div style={{ width: '100%', height: '45%', position: 'relative', display: 'flex', overflow: 'hidden', backgroundColor: `${accentColor}18`, flexShrink: 0 }}>
            {imageData
              ? <img src={imageData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ flex: 1, backgroundColor: `${accentColor}22`, display: 'flex' }} />
            }
            {/* Gradiente fade na borda inferior */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: `linear-gradient(to top, ${preset.bgDefault}, transparent)`, display: 'flex' }} />
          </div>
          {/* Texto rodapé 55% */}
          <div style={{ flex: 1, padding: '36px 80px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 4, backgroundColor: accentColor, borderRadius: 2, display: 'flex' }} />
            </div>
            <div style={{ fontSize: baseFontSize + 4, fontWeight: preset.displayWeight, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
              {renderTitulo(titulo, textColor)}
            </div>
            {texto && texto !== titulo && (
              <div style={{ fontSize: baseFontSize - 8, fontWeight: preset.bodyWeight, color: textColor, opacity: 0.7, lineHeight: 1.55, display: 'flex', flexWrap: 'wrap' }}>
                {texto}
              </div>
            )}
            {watermark && <div style={{ marginTop: 16, display: 'flex' }}>{BrandTag}</div>}
          </div>
        </div>
      ), { width: W, height: H, ...fontOptions });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 4 — CTA_MINIMALISTA  (alias legado: cta)
    // Fundo ctaBg, pílula branca "Comente X", headline central.
    // ═══════════════════════════════════════════════════════════════════════
    if (layout === 'cta_minimalista' || layout === 'cta') {
      const ctaBg = corPrimaria ? corPrimaria : preset.ctaBg;
      return new ImageResponse((
        <div style={{
          fontFamily, width: W, height: H, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', backgroundColor: ctaBg,
          position: 'relative', overflow: 'hidden',
        }}>
          {imageData && <img src={imageData} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />}
          {/* Círculos decorativos */}
          <div style={{ position: 'absolute', top: 60, right: 60, width: 220, height: 220, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: 60, left: 60, width: 320, height: 320, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)', display: 'flex' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48, padding: '0 100px' }}>
            {/* Headline */}
            <div style={{ fontSize: baseFontSize + 4, fontWeight: preset.displayWeight, lineHeight: 1.2, width: '100%' }}>
              {renderTitulo(titulo, '#FFFFFF', 'center')}
            </div>
            {texto && texto !== titulo && (
              <div style={{ fontSize: baseFontSize - 10, fontWeight: 300, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {texto}
              </div>
            )}
            {/* Pílula CTA */}
            <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '28px 80px', borderRadius: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
              <span style={{ color: ctaBg, fontSize: 48, fontWeight: 800, letterSpacing: '0.03em', fontFamily, display: 'flex' }}>
                Comente {palavraCom}
              </span>
            </div>
            {watermark && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 18, letterSpacing: '0.25em', display: 'flex' }}>
                {nomeMarca.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ), { width: W, height: H, ...fontOptions });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 5 — FUNDO_OVERLAY_TEXTO  (alias legado: conteudo_overlay, default)
    // Imagem 100% de fundo com overlay dinâmico. Posição via param posicao.
    // ═══════════════════════════════════════════════════════════════════════
    let justifyContent = 'center';
    let paddingStyle   = '0 90px';
    if (posicao === 'topo')   { justifyContent = 'flex-start'; paddingStyle = '160px 90px 0 90px'; }
    if (posicao === 'rodape') { justifyContent = 'flex-end';   paddingStyle = '0 90px 160px 90px'; }

    const hasImage = !!imageData;
    const bgColor  = hasImage ? '#0a0a0a' : preset.bgDefault;
    const txtColor = hasImage ? '#FFFFFF' : textColor;

    return new ImageResponse((
      <div style={{
        fontFamily, width: W, height: H, display: 'flex', position: 'relative',
        backgroundColor: bgColor, overflow: 'hidden',
      }}>
        {imageData && (
          <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
        )}
        {fade && hasImage && (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,${overlayAlpha * 0.5}) 0%, rgba(0,0,0,${overlayAlpha + 0.15}) 100%)`, display: 'flex' }} />
        )}
        {!hasImage && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: accentColor, display: 'flex' }} />
        )}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent, padding: paddingStyle, width: '100%', height: '100%', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 4, backgroundColor: accentColor, borderRadius: 2, display: 'flex' }} />
          </div>
          <div style={{ fontSize: baseFontSize + 6, fontWeight: preset.displayWeight, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
            {renderTitulo(titulo, txtColor)}
          </div>
          {texto && texto !== titulo && (
            <div style={{ fontSize: baseFontSize - 8, fontWeight: preset.bodyWeight, color: txtColor, opacity: hasImage ? 0.85 : 0.7, lineHeight: 1.55, display: 'flex', flexWrap: 'wrap', marginTop: 8 }}>
              {texto}
            </div>
          )}
        </div>
        {watermark && (
          <div style={{ position: 'absolute', bottom: 50, left: 60, display: 'flex' }}>
            {hasImage
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor, display: 'flex' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, fontWeight: preset.bodyWeight, letterSpacing: '0.15em', fontFamily, display: 'flex' }}>
                    {nomeMarca.toUpperCase()}
                  </span>
                </div>
              : BrandTag
            }
          </div>
        )}
      </div>
    ), { width: W, height: H, ...fontOptions });

  } catch (error) {
    console.error('og-ilustrativo error:', error);
    return new Response('Erro ao gerar imagem', { status: 500 });
  }
}
