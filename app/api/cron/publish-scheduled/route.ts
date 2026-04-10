import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const IG_API = 'https://graph.facebook.com/v19.0';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Find posts due for publishing (status = 'scheduled', publish_time <= now)
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*, users!inner(instagram_access_token, instagram_user_id)')
    .eq('status', 'scheduled')
    .lte('publish_time', new Date().toISOString())
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts?.length) return NextResponse.json({ published: 0 });

  let published = 0;
  for (const post of posts) {
    try {
      const token = (post.users as { instagram_access_token: string }).instagram_access_token;
      const igUserId = (post.users as { instagram_user_id: string }).instagram_user_id;
      if (!token || !igUserId) throw new Error('Instagram not connected');

      const imageUrls: string[] = post.slide_urls || [];
      if (!imageUrls.length) throw new Error('No image URLs');

      // Create media objects
      const mediaIds: string[] = [];
      for (const url of imageUrls) {
        const r = await fetch(`${IG_API}/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ image_url: url, is_carousel_item: 'true', access_token: token }).toString(),
        });
        const d = await r.json();
        if (!d.id) throw new Error(d.error?.message || 'media creation failed');
        mediaIds.push(d.id);
      }

      // Create carousel container
      const cr = await fetch(`${IG_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ media_type: 'CAROUSEL', caption: post.legenda || '', children: mediaIds.join(','), access_token: token }).toString(),
      });
      const cd = await cr.json();
      if (!cd.id) throw new Error(cd.error?.message || 'carousel creation failed');

      // Publish
      const pr = await fetch(`${IG_API}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ creation_id: cd.id, access_token: token }).toString(),
      });
      const pd = await pr.json();
      if (!pd.id) throw new Error(pd.error?.message || 'publish failed');

      await supabase.from('scheduled_posts').update({ status: 'published', instagram_post_id: pd.id }).eq('id', post.id);
      published++;
    } catch (e) {
      await supabase.from('scheduled_posts').update({ status: 'failed', error_message: e instanceof Error ? e.message : 'Unknown error' }).eq('id', post.id);
    }
  }

  return NextResponse.json({ published });
}
