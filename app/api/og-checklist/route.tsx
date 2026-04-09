import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1080;

const MODELO_PRESETS: Record<string, {
  bg: string; textColor: string; accent: string; accentText: string;
  itemBg: string; itemBorder: string;
  fontFamily: string; displayWeight: number; bodyWeight: number;
  titleSize: number; itemSize: number;
}> = {
  aesthetic_minimalist: {
    bg: '#FAFAFA', textColor: '#18181B', accent: '#18181B', accentText: '#FFFFFF',
    itemBg: '#F4F4F5', itemBorder: '#E4E4E7',
    fontFamily: 'Inter', displayWeight: 300, bodyWeight: 300,
    titleSize: 52, itemSize: 26,
  },
  clean_corporate: {
    bg: '#F8FAFC', textColor: '#0F172A', accent: '#2563EB', accentText: '#FFFFFF',
    itemBg: '#EFF6FF', itemBorder: '#BFDBFE',
    fontFamily: 'Inter', displayWeight: 700, bodyWeight: 500,
    titleSize: 54, itemSize: 28,
  },
  dynamic_sports: {
    bg: '#0A0A0A', textColor: '#FFFFFF', accent: '#EF4444', accentText: '#FFFFFF',
    itemBg: '#1C1C1C', itemBorder: '#2A2A2A',
    fontFamily: 'Inter', displayWeight: 800, bodyWeight: 700,
    titleSize: 58, itemSize: 30,
  },
  minimalist_editorial: {
    bg: '#FFFFFF', textColor: '#111827', accent: '#374151', accentText: '#FFFFFF',
    itemBg: '#F9FAFB', itemBorder: '#E5E7EB',
    fontFamily: 'Inter', displayWeight: 600, bodyWeight: 400,
    titleSize: 50, itemSize: 26,
  },
};

async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then(r => r.text());
    const match = css.match(/url\(([^)]+)\)/);
    if (match?.[1]) return fetch(match[1].replace(/['"]/g, '')).then(r => r.arrayBuffer());
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const titulo    = decodeURIComponent(searchParams.get('titulo') || '');
  const passosRaw = searchParams.get('passos') || '[]';
  const tipo      = searchParams.get('tipo')   || 'conteudo';
  const modelo    = searchParams.get('modelo') || 'aesthetic_minimalist';
  const corPrimariaRaw = searchParams.get('corPrimaria');
  const arrobaRaw = decodeURIComponent(searchParams.get('arroba') || '@seu_arroba');
  const watermark = searchParams.get('watermark') !== 'false';

  const preset  = MODELO_PRESETS[modelo] ?? MODELO_PRESETS.aesthetic_minimalist;
  const accent  = corPrimariaRaw ? decodeURIComponent(corPrimariaRaw) : preset.accent;

  let passos: string[] = [];
  try { passos = JSON.parse(decodeURIComponent(passosRaw)); } catch {}

  const [fontLight, fontBold] = await Promise.all([
    loadFont(preset.bodyWeight),
    loadFont(preset.displayWeight),
  ]);

  const fonts = [];
  if (fontLight) fonts.push({ name: 'Inter', data: fontLight, weight: preset.bodyWeight as 300 | 400 | 500 | 600 | 700 | 800 });
  if (fontBold && preset.bodyWeight !== preset.displayWeight) fonts.push({ name: 'Inter', data: fontBold, weight: preset.displayWeight as 300 | 400 | 500 | 600 | 700 | 800 });

  const isDark  = preset.bg === '#0A0A0A';
  const maxItems = 6;
  const visiblePassos = passos.slice(0, maxItems);

  // Slide CTA especial
  const isCta = tipo === 'cta';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: W,
          height: H,
          background: preset.bg,
          fontFamily: 'Inter, sans-serif',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Barra de acento lateral (corporate + sports) */}
        {(modelo === 'clean_corporate' || modelo === 'dynamic_sports') && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: H, background: accent, display: 'flex' }} />
        )}

        {/* Linha de categoria editorial */}
        {modelo === 'minimalist_editorial' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 32, height: 2, background: accent, display: 'flex' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>
              Checklist
            </div>
          </div>
        )}

        {isCta ? (
          /* CTA slide */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ fontSize: 64, fontWeight: preset.displayWeight, color: preset.textColor, textAlign: 'center', lineHeight: 1.1, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {titulo}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <div style={{
                fontSize: 22, fontWeight: 600, color: preset.accentText,
                background: accent, paddingTop: 14, paddingBottom: 14, paddingLeft: 36, paddingRight: 36,
                borderRadius: 60, letterSpacing: '0.04em', display: 'flex',
              }}>
                Salve este checklist
              </div>
            </div>
          </div>
        ) : (
          /* Conteúdo / Capa */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0 }}>
            {/* Título */}
            <div
              style={{
                fontSize: visiblePassos.length > 4 ? preset.titleSize - 8 : preset.titleSize,
                fontWeight: preset.displayWeight,
                color: preset.textColor,
                lineHeight: 1.15,
                letterSpacing: modelo === 'dynamic_sports' ? '-0.02em' : '0em',
                marginBottom: visiblePassos.length > 0 ? 48 : 0,
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {titulo}
            </div>

            {/* Items */}
            {visiblePassos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                {visiblePassos.map((passo, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                      background: preset.itemBg,
                      border: `1px solid ${preset.itemBorder}`,
                      borderRadius: 16,
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingLeft: 20,
                      paddingRight: 20,
                    }}
                  >
                    {/* Número */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        background: accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: preset.accentText,
                      }}
                    >
                      {i + 1}
                    </div>
                    {/* Texto */}
                    <div
                      style={{
                        fontSize: visiblePassos.length > 4 ? preset.itemSize - 4 : preset.itemSize,
                        fontWeight: preset.bodyWeight,
                        color: preset.textColor,
                        lineHeight: 1.3,
                        flex: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                      }}
                    >
                      {passo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Marca d'água */}
        {watermark && (
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              right: 40,
              fontSize: 16,
              fontWeight: 400,
              color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              letterSpacing: '0.04em',
              display: 'flex',
            }}
          >
            {arrobaRaw}
          </div>
        )}
      </div>
    ),
    { width: W, height: H, fonts }
  );
}
