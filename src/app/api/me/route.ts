// GET /api/me — 返回当前登录用户
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withError, ApiError } from '@/lib/api-error';

export const GET = withError(async () => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');
  return NextResponse.json(user);
});
