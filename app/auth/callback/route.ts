import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth Callback Handler
 * Handles two flows:
 * 1. Email confirmation (signup) → redirects to /auth/login?verified=true
 * 2. Password recovery (forgot password) → redirects to /auth/reset-password
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery' | 'signup' | null
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle errors returned by Supabase (e.g., expired link)
  if (error) {
    const message = errorDescription || 'Link inválido ou expirado.';
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cookieStore.set(name, value, options as any)
              );
            } catch {
              // Server Component — ignorar
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Recovery flow → vai para página de redefinição de senha
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      // Email confirmation flow → vai para login com mensagem de sucesso
      return NextResponse.redirect(`${origin}/auth/login?verified=true`);
    }
  }

  // Fallback: link inválido ou sem código
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent('Link inválido ou expirado. Solicite um novo.')}`
  );
}
