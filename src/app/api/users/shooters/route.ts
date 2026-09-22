// GET /api/users/shooters — 返回所有 shooter 角色用户
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const shooters = await prisma.user.findMany({
    where: { role: 'shooter' },
    orderBy: { name: 'asc' },
  });
  // 不返回 password
  const safe = shooters.map(({ password: _pw, ...rest }) => rest);
  return NextResponse.json(safe);
}
