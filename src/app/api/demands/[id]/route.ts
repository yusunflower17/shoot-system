// /api/demands/[id]/route.ts — GET/PATCH/DELETE 单个需求
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: Request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const d = await prisma.demand.findUnique({
    where: { id }, include: { model: true, history: { orderBy: { time: 'asc' } } },
  });
  if (!d) return NextResponse.json({ error: '需求不存在' }, { status: 404 });
  return NextResponse.json(d);
}

export async function PATCH(req: Request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await req.json();
  const existing = await prisma.demand.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: '需求不存在' }, { status: 404 });

  const allowedStatuses = ['draft', 'pending', 'confirmed', 'scheduled', 'shooting', 'review', 'done', 'archived', 'cancelled', 'revision'];
  const updateData: any = { updatedAt: new Date() };

  // 处理状态变更，自动记录历史
  if (body.status && allowedStatuses.includes(body.status) && body.status !== existing.status) {
    updateData.status = body.status;
    updateData.history = { create: {
      time: new Date(), user: user.name,
      action: body.action || '状态变更', toStatus: body.status,
      detail: body.detail || body.reason || null,
    }};
    if (['confirmed', 'scheduled'].includes(body.status)) {
      updateData.reviewerId = user.id;
      updateData.reviewedAt = new Date();
    }
    if (body.status === 'revision') {
      updateData.revisionNote = body.reason || null;
    }
  }

  // 允许更新的字段
  const editable = ['title', 'description', 'priority', 'scheduleNote', 'revisionNote', 'content', 'purpose', 'needPerson'];
  for (const key of editable) {
    if (body[key] !== undefined) {
      updateData[key] = Array.isArray(body[key]) ? JSON.stringify(body[key]) : body[key];
    }
  }

  if (body.detail) updateData.scheduleNote = body.detail;

  let cancelledSessions: string[] = [];

  await prisma.$transaction(async (tx) => {
    const updated = await tx.demand.update({ where: { id }, data: updateData });

    // 如果取消需求 → 找出所有关联的 Session，如果这个 Session 只剩这一个 demand → 删除 Session
    if (body.status === 'cancelled') {
      const linked = await tx.sessionDemand.findMany({ where: { demandId: id }, select: { sessionId: true } });
      for (const sd of linked) {
        const count = await tx.sessionDemand.count({ where: { sessionId: sd.sessionId } });
        if (count <= 1) {
          // 这个 session 只关联了这一个 demand → 删除整个 session（级联 task）
          await tx.task.deleteMany({ where: { sessionId: sd.sessionId } });
          await tx.sessionDemand.deleteMany({ where: { sessionId: sd.sessionId } });
          await tx.session.delete({ where: { id: sd.sessionId } });
          cancelledSessions.push(sd.sessionId);
        } else {
          // session 还有其他 demand → 只移除这次关联
          await tx.sessionDemand.deleteMany({ where: { demandId: id, sessionId: sd.sessionId } });
        }
      }
    }

    return updated;
  });

  return NextResponse.json({ ok: true, cancelledSessions });
}
