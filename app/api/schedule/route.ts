import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - create scheduled post
// GET - list user's scheduled posts
// DELETE - cancel scheduled post

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { carousel_data, legenda, publish_time, slide_urls } = await req.json();
    if (!publish_time) return NextResponse.json({ error: 'Data de publicação obrigatória' }, { status: 400 });

    const { data, error } = await supabase.from('scheduled_posts').insert({
      user_id: user.id,
      carousel_data,
      legenda: legenda || '',
      slide_urls: slide_urls || [],
      publish_time,
      status: 'scheduled',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, post: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao agendar' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('publish_time', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ posts: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await req.json();
    const { error } = await supabase.from('scheduled_posts').update({ status: 'cancelled' }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
