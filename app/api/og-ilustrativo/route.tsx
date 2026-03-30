import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Formato Retrato do Instagram (O padrão ouro para retenção)
const W = 1080;
const H = 1350; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parâmetros de Texto e Configuração
    const texto = searchParams.get('texto') || 'Texto não encontrado';
    const imageUrl = searchParams.get('imageUrl');
    // Pegamos o layout. Se não vier, usamos o 'tipo' como fallback de segurança
    const layout = searchParams.get('layout') || searchParams.get('tipo') || 'conteudo_overlay'; 
    const nomeMarca = searchParams.get('marca') || 'FUTEBOL INTERATIVO';
    const palavraComentario = searchParams.get('comentario') || 'MED';

    // Sistema Blindado de Busca de Imagem (ArrayBuffer -> Base64)
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

    // ==========================================
    // 1. LAYOUT: CAPA (Impacto Extremo)
    // ==========================================
    if (layout === 'capa') {
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
            {imageData && <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            
            {/* Máscara Degradê Escura no Rodapé */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4), transparent)' }} />
            
            {/* Logo / Nome da Marca no Topo */}
            <div style={{ position: 'absolute', top: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '0.2em' }}>{nomeMarca}</div>
            </div>

            {/* Título Gigante */}
            <div style={{ position: 'relative', zIndex: 10, padding: '0 60px 100px 60px', display: 'flex', width: '100%', justifyContent: 'center' }}>
              <div style={{ fontSize: 95, fontWeight: 900, color: 'white', textTransform: 'uppercase', textAlign: 'center', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
                {texto}
              </div>
            </div>
          </div>
        ), { width: W, height: H }
      );
    }

    // ==========================================
    // 2. LAYOUT: CONTEÚDO SPLIT (Fundo Branco Embaixo)
    // ==========================================
    if (layout === 'conteudo_split') {
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: '#F4F7F6', overflow: 'hidden' }}>
            {/* Metade Superior: Imagem */}
            <div style={{ display: 'flex', width: '100%', height: '55%', position: 'relative', backgroundColor: '#E2E8F0' }}>
              {imageData && <img src={imageData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            
            {/* Metade Inferior: Texto Limpo e Escuro */}
            <div style={{ display: 'flex', width: '100%', height: '45%', padding: '0 100px', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 500, color: '#0F172A', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                {texto}
              </div>
            </div>
          </div>
        ), { width: W, height: H }
      );
    }

    // ==========================================
    // 3. LAYOUT: CTA MINIMALISTA (Fundo Azul + Botão)
    // ==========================================
    if (layout === 'cta_minimalista' || layout === 'cta') {
      return new ImageResponse(
        (
          <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: '#001E60', overflow: 'hidden' }}>
            {/* Imagem de fundo bem apagada, quase marca d'água */}
            {imageData && <img src={imageData} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />}
            
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, padding: '0 100px' }}>
              
              {/* Texto Principal do CTA */}
              <div style={{ fontSize: 60, fontWeight: 500, color: 'white', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
                {texto}
              </div>

              {/* Botão de Comentário */}
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '30px 80px', borderRadius: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#001E60', fontSize: 56, fontWeight: 900 }}>Comente {palavraComentario}</span>
              </div>
            </div>
          </div>
        ), { width: W, height: H }
      );
    }

    // ==========================================
    // 4. LAYOUT PADRÃO: CONTEÚDO OVERLAY (Imagem Tela Cheia + Máscara)
    // ==========================================
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
          {imageData && <img src={imageData} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          
          {/* Máscara Escura para garantir leitura */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' }} />
          
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 100px', width: '100%' }}>
            <div style={{ fontSize: 56, fontWeight: 600, color: 'white', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
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
