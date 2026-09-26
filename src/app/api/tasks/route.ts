// GET/POST /api/tasks
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, genNo } from '@/lib/auth';
import { withError, ApiError } from '@/lib/api-error';

export const GET = withError(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  const status = url.searchParams.get('status');
  const where: any = {};
  if (sessionId) where.sessionId = sessionId;
  if (status && status !== 'all') where.status = status;
  const tasks = await prisma.task.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { session: true, demand: true },
  });
  return NextResponse.json(tasks);
});
