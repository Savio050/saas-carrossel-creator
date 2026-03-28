import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const texto = searchParams.get('texto') || 'Slide';
  const imageUrl = searchParams.get('imageUrl') || '';
  const slide = searchParams.get('slide') || '1';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background image */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.25,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(88,28,135,0.6) 0%, rgba(10,10,10,0.9) 100%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '80px',
          }}
        >
          {/* Slide number */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                background: 'rgba(147,51,234,0.3)',
                border: '1px solid rgba(147,51,234,0.5)',
                borderRadius: '100px',
                padding: '8px 20px',
                color: '#c084fc',
                fontSize: '24px',
                fontWeight: 700,
                display: 'flex',
              }}
            >
              #{slide}
            </div>
          </div>

          {/* Text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <p
              style={{
                color: '#ffffff',
                fontSize: '52px',
                fontWeight: 700,
                lineHeight: 1.3,
                margin: 0,
                maxWidth: '900px',
              }}
            >
              {texto.length > 200 ? texto.substring(0, 200) + '...' : texto}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '100%',
                  background: '#9333ea',
                  display: 'flex',
                }}
              />
              <span style={{ color: '#9ca3af', fontSize: '24px', display: 'flex' }}>Carrossel Creator</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
