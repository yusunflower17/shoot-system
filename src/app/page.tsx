// src/app/page.tsx — 主入口
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  // 服务器端检查登录状态
  const c = await cookies();
  const session = c.get('shoot-session');
  if (!session) redirect('/login');
  return <AppClient />;
}

import App from '@/components/App';

function AppClient() {
  return <App />;
}
