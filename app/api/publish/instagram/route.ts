import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const IG_API = 'https://graph.facebook.com/v19.0';

async function createMediaObject(igUserId: string, imageUrl: string, token: string, isCarouselItem: boolean): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: isCarouselItem.toString(),
    access_token: token,
  });
  const res = await fetch(`${IG_API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(data.error?.message || 'Failed to create media object');
  return data.id as string;
}

async function createCarouselContainer(igUserId: string, childrenIds: string[], caption: string, token: string, scheduledTime?: number): Promise<string> {
  const params: Record<string, string> = {
    media_type: 'CAROUSEL',
    caption,
    children: childrenIds.join(','),
    access_token: token,
  };
  if (scheduledTime) {
    params.published = 'false';
    params.scheduled_publish_time = scheduledTime.toString();
  }
  const res = await fetch(`${IG_API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(data.error?.message || 'Failed to create carousel container');
  return data.id as string;
}

async function publishMedia(igUserId: string, creationId: string, token: string): Promise<string> {
  const params = new URLSearchParams({ creation_id: creationId, access_token: token });
  const res = await fetch(`${IG_API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(data.error?.message || 'Failed to publish media');
  return data.id as string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { imageUrls, caption, scheduleTime } = await req.json() as {
      imageUrls: string[];
      caption: string;
      scheduleTime?: number; // unix timestamp, optional
    };

    if (!imageUrls?.length) return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });

    // Get user's Instagram credentials
    const { data: profile } = await supabase
      .from('users')
      .select('instagram_access_token, instagram_user_id')
      .eq('id', user.id)
      .single();

    if (!profile?.instagram_access_token || !profile?.instagram_user_id) {
      return NextResponse.json({ error: 'Instagram não conectado. Configure seu token em Minha Conta.' }, { status: 400 });
    }

    const { instagram_access_token: token, instagram_user_id: igUserId } = profile;

    // Create media objects for each image
    const mediaIds: string[] = [];
    for (const url of imageUrls) {
      const id = await createMediaObject(igUserId, url, token, true);
      mediaIds.push(id);
    }

    // Create carousel container
    const containerId = await createCarouselContainer(igUserId, mediaIds, caption, token, scheduleTime);

    if (scheduleTime) {
      // Already scheduled via Instagram API - just return the container ID
      return NextResponse.json({ success: true, scheduled: true, containerId });
    }

    // Publish now
    const postId = await publishMedia(igUserId, containerId, token);
    return NextResponse.json({ success: true, postId });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao publicar';
    console.error('Instagram publish error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
