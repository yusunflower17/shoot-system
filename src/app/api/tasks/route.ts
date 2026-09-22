// GET/POST /api/tasks
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, genNo } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
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
}


