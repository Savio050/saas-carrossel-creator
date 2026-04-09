import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_pro')
    .eq('id', user.id)
    .single();

  return (
    <DashboardClient
      user={{ email: user.email ?? '', id: user.id }}
      isPro={profile?.is_pro ?? false}
    />
  );
}
