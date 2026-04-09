import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const W = 1080;
const H = 1080;

const MODELO_PRESETS: Record<string, {
  bg: string; textColor: string; accent: string;
  quoteMarkColor: string; lineColor: string;
  fontFamily: string; displayWeight: number; bodyWeight: number;
  authorSize: number;
}> = {
  aesthetic_minimalist: {
    bg: '#FAFAFA', textColor: '#18181B', accent: '#18181B',
    quoteMarkColor: '#E4E4E7', lineColor: '#D4D4D8',
    fontFamily: 'Inter', displayWeight: 300, bodyWeight: 300,
    authorSize: 22,
  },
  clean_corporate: {
    bg: '#F8FAFC', textColor: '#0F172A', accent: '#2563EB',
    quoteMarkColor: '#BFDBFE', lineColor: '#2563EB',
    fontFamily: 'Inter', displayWeight: 600, bodyWeight: 500,
    authorSize: 22,
  },
  dynamic_sports: {
    bg: '#0A0A0A', textColor: '#FFFFFF', accent: '#EF4444',
    quoteMarkColor: '#1C1C1C', lineColor: '#EF4444',
    fontFamily: 'Inter', displayWeight: 800, bodyWeight: 700,
    authorSize: 24,
  },
  minimalist_editorial: {
    bg: '#FFFFFF', textColor: '#111827', accent: '#374151',
    quoteMarkColor: '#F3F4F6', lineColor: '#9CA3AF',
    fontFamily: 'Inter', displayWeight: 400, bodyWeight: 400,
    authorSize: 20,
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

  const textoCitacao = decodeURIComponent(searchParams.get('texto')  || '');
  const autor        = decodeURIComponent(searchParams.get('autor')  || '');
  const modelo       = searchParams.get('modelo') || 'aesthetic_minimalist';
  const corPrimariaRaw = searchParams.get('corPrimaria');
  const arrobaRaw    = decodeURIComponent(searchParams.get('arroba') || '@seu_arroba');
  const watermark    = searchParams.get('watermark') !== 'false';

  const preset = MODELO_PRESETS[modelo] ?? MODELO_PRESETS.aesthetic_minimalist;
  const accent = corPrimariaRaw ? decodeURIComponent(corPrimariaRaw) : preset.accent;

  const [fontLight, fontBold] = await Promise.all([
    loadFont(preset.bodyWeight),
    loadFont(preset.displayWeight),
  ]);

  const fonts = [];
  if (fontLight) fonts.push({ name: 'Inter', data: fontLight, weight: preset.bodyWeight as 300 | 400 | 500 | 600 | 700 | 800 });
  if (fontBold && preset.bodyWeight !== preset.displayWeight) fonts.push({ name: 'Inter', data: fontBold, weight: preset.displayWeight as 300 | 400 | 500 | 600 | 700 | 800 });

  // Calcula tamanho da fonte da citação dinamicamente
  const len = textoCitacao.length;
  const quoteSize = len > 200 ? 32 : len > 120 ? 38 : len > 70 ? 46 : 56;

  const isDark = preset.bg === '#0A0A0A' || preset.bg.startsWith('#0') || preset.bg.startsWith('#1');

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: W,
          height: H,
          background: preset.bg,
          position: 'relative',
          fontFamily: 'Inter, sans-serif',
          padding: '80px',
          overflow: 'hidden',
        }}
      >
        {/* Giant quote mark decorativo */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 60,
            fontSize: 240,
            fontWeight: preset.displayWeight,
            color: preset.quoteMarkColor,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            userSelect: 'none',
            display: 'flex',
          }}
        >
          &ldquo;
        </div>

        {/* Accent bar (clean_corporate e dynamic_sports) */}
        {(modelo === 'clean_corporate' || modelo === 'dynamic_sports') && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 8,
              height: H,
              background: accent,
              display: 'flex',
            }}
          />
        )}

        {/* Content area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 80,
            paddingBottom: autor ? 60 : 40,
            gap: 0,
          }}
        >
          {/* Citação */}
          <div
            style={{
              fontSize: quoteSize,
              fontWeight: preset.displayWeight,
              color: preset.textColor,
              textAlign: 'center',
              lineHeight: 1.35,
              letterSpacing: modelo === 'dynamic_sports' ? '-0.02em' : '0em',
              maxWidth: 860,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {textoCitacao}
          </div>

          {/* Separador + Autor */}
          {autor && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                marginTop: 48,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 2,
                  background: accent,
                  display: 'flex',
                }}
              />
              <div
                style={{
                  fontSize: preset.authorSize,
                  fontWeight: preset.bodyWeight,
                  color: isDark ? 'rgba(255,255,255,0.55)' : preset.accent,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex',
                }}
              >
                {autor}
              </div>
            </div>
          )}
        </div>

        {/* Linha decorativa editorial */}
        {modelo === 'minimalist_editorial' && (
          <div
            style={{
              position: 'absolute',
              bottom: 120,
              left: 80,
              right: 80,
              height: 1,
              background: preset.lineColor,
              display: 'flex',
            }}
          />
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
