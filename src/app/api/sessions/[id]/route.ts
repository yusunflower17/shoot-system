// /api/sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: Request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      demands: { include: { demand: true } },
      tasks: true,
    },
  });
  if (!s) return NextResponse.json({ error: '场次不存在' }, { status: 404 });
  return NextResponse.json(s);
}

export async function PATCH(req: Request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await req.json();
  const existing = await prisma.session.findUnique({ where: { id }, include: { demands: true } });
  if (!existing) return NextResponse.json({ error: '场次不存在' }, { status: 404 });

  const updateData: any = { updatedAt: new Date() };
  if (body.status) {
    updateData.status = body.status;
    // 同步更新关联需求和任务
    const demandIds = existing.demands.map(d => d.demandId);
    const statusMap: Record<string, string> = { shooting: 'shooting', review: 'review', done: 'done' };
    if (statusMap[body.status]) {
      await prisma.demand.updateMany({
        where: { id: { in: demandIds }, status: statusMap[body.status] === 'shooting' ? 'scheduled' : 'shooting' },
        data: { status: statusMap[body.status] },
      });
      await prisma.task.updateMany({
        where: { sessionId: id, status: statusMap[body.status] === 'shooting' ? 'pending' : 'shooting' },
        data: { status: statusMap[body.status] },
      });
    }
  }
  const editable = ['title', 'date', 'startTime', 'endTime', 'location', 'shooterName', 'note'];
  for (const key of editable) if (body[key] !== undefined) updateData[key] = body[key];

  const updated = await prisma.session.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (!['admin', 'reviewer'].includes(user.role)) {
    return NextResponse.json({ error: '无权限删除' }, { status: 403 });
  }
  const existing = await prisma.session.findUnique({ where: { id }, include: { demands: true } });
  if (!existing) return NextResponse.json({ error: '场次不存在' }, { status: 404 });

  const demandIds = existing.demands.map(d => d.demandId);

  // 分步删除（$transaction 在 Neon HTTP adapter 上不支持）
  await prisma.sessionDemand.deleteMany({ where: { sessionId: id } });
  await prisma.task.deleteMany({ where: { sessionId: id } });
  await prisma.session.delete({ where: { id } });
  await prisma.demand.updateMany({
    where: { id: { in: demandIds }, status: 'scheduled' },
    data: { status: 'confirmed' },
  });

  return NextResponse.json({ ok: true, demandIds });
}
