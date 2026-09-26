// GET /api/users/shooters — 返回所有 shooter 角色用户
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withError, ApiError } from '@/lib/api-error';

export const GET = withError(async () => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');
  const shooters = await prisma.user.findMany({
    where: { role: 'shooter' },
    orderBy: { name: 'asc' },
  });
  // 不返回 password
  const safe = shooters.map(({ password: _pw, ...rest }) => rest);
  return NextResponse.json(safe);
});
