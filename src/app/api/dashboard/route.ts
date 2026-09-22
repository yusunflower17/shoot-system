// GET /api/dashboard — 统计数据
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const weekEnd = new Date(today.getTime() + 7 * 86400000);
  const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,'0')}-${String(weekEnd.getDate()).padStart(2,'0')}`;

  const [pending, confirmed, scheduled, shooting, review, done, todaySessions, weekSessions] = await Promise.all([
    prisma.demand.count({ where: { status: 'pending' } }),
    prisma.demand.count({ where: { status: 'confirmed' } }),
    prisma.demand.count({ where: { status: 'scheduled' } }),
    prisma.demand.count({ where: { status: 'shooting' } }),
    prisma.demand.count({ where: { status: 'review' } }),
    prisma.demand.count({ where: { status: 'done' } }),
    prisma.session.findMany({ where: { date: todayStr }, include: { _count: { select: { tasks: true } } } }),
    prisma.session.findMany({ where: { date: { gte: todayStr, lte: weekEndStr }, status: { not: { in: ['done', 'cancelled'] } } } }),
  ]);

  const myId = user.id;
  const myDemandsCount = user.role === 'submitter'
    ? await prisma.demand.count({ where: { submitterId: myId } })
    : null;

  return NextResponse.json({
    stats: { pending, confirmed, scheduled, shooting, review, done },
    todaySessions, weekSessions,
    myDemandsCount,
  });
}
