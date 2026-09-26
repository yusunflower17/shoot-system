// GET /api/configs — 配置标准库
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withError, ApiError } from '@/lib/api-error';

export const GET = withError(async () => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');
  const configs = await prisma.config.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json(configs);
});

export const POST = withError(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');
  if (user.role !== 'admin') return NextResponse.json({ error: '无权操作' }, { status: 403 });
  const body = await req.json();
  const c = await prisma.config.create({
    data: { code: body.code, type: body.type, name: body.name, enName: body.enName || null, remark: body.remark || null },
  });
  return NextResponse.json(c, { status: 201 });
});
