// /api/demands/[id]/route.ts — GET/PATCH/DELETE 单个需求
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withError, ApiError, validateStatusTransition } from '@/lib/api-error';
import { notifyStatusChange, notifyDemandCancelled } from '@/lib/notify';

export const GET = withError(async (_: Request, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');

  const d = await prisma.demand.findUnique({
    where: { id }, include: { model: true, history: { orderBy: { time: 'asc' } } },
  });
  if (!d) throw new ApiError('需求不存在', 404, 'NOT_FOUND');
  return NextResponse.json(d);
});

export const PATCH = withError(async (req: Request, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');

  const body = await req.json();
  const existing = await prisma.demand.findUnique({ where: { id } });
  if (!existing) throw new ApiError('需求不存在', 404, 'NOT_FOUND');

  // 权限：只有 admin/reviewer 可以改状态
  const wantChangeStatus = body.status && body.status !== existing.status;
  if (wantChangeStatus && !['admin', 'reviewer'].includes(user.role)) {
    throw new ApiError('只有管理员/审核员可以改变需求状态', 403, 'FORBIDDEN');
  }

  // 状态机校验
  if (wantChangeStatus) {
    const err = validateStatusTransition(existing.status, body.status);
    if (err) throw new ApiError(err, 400, 'INVALID_TRANSITION');
  }

  const allowedStatuses = ['draft', 'pending', 'confirmed', 'scheduled', 'shooting', 'review', 'done', 'archived', 'cancelled', 'revision'];
  const updateData: any = { updatedAt: new Date() };
  let historyEntry: any = null;

  if (wantChangeStatus && allowedStatuses.includes(body.status)) {
    updateData.status = body.status;
    historyEntry = {
      time: new Date(), user: user.name,
      action: body.action || '状态变更', toStatus: body.status,
      detail: body.detail || body.reason || null,
    };
    if (['confirmed', 'scheduled'].includes(body.status)) {
      updateData.reviewerId = user.id;
      updateData.reviewedAt = new Date();
    }
    if (body.status === 'revision') {
      updateData.revisionNote = body.reason || null;
    }
  }

  // 允许编辑的字段（任何登录用户都能改自己提交的需求的内容字段）
  const editable = ['title', 'description', 'priority', 'scheduleNote', 'revisionNote', 'content', 'purpose', 'needPerson'];
  for (const key of editable) {
    if (body[key] !== undefined) {
      updateData[key] = Array.isArray(body[key]) ? JSON.stringify(body[key]) : body[key];
    }
  }
  if (body.detail) updateData.scheduleNote = body.detail;

  const updated = await prisma.demand.update({ where: { id }, data: updateData });

  if (historyEntry) {
    await prisma.demandHistory.create({ data: { demandId: id, ...historyEntry } });

    // 异步推送状态变更通知
    notifyStatusChange({
      no: existing.no, title: existing.title, modelName: existing.modelName,
      versionName: existing.versionName, direction: existing.direction,
      priority: existing.priority, urgency: existing.urgency,
      submitterName: existing.submitterName, description: existing.description,
      purpose: existing.purpose,
    }, existing.status, body.status, user.name).catch(() => {});

    if (body.status === 'cancelled') {
      notifyDemandCancelled({
        no: existing.no, title: existing.title, modelName: existing.modelName,
      }, user.name, body.reason || body.detail || undefined).catch(() => {});
    }
  }

  let cancelledSessions: string[] = [];
  if (wantChangeStatus && body.status === 'cancelled') {
    const linked = await prisma.sessionDemand.findMany({ where: { demandId: id }, select: { sessionId: true } });
    for (const sd of linked) {
      const count = await prisma.sessionDemand.count({ where: { sessionId: sd.sessionId } });
      if (count <= 1) {
        await prisma.task.deleteMany({ where: { sessionId: sd.sessionId } });
        await prisma.sessionDemand.deleteMany({ where: { sessionId: sd.sessionId } });
        await prisma.session.delete({ where: { id: sd.sessionId } });
        cancelledSessions.push(sd.sessionId);
      } else {
        await prisma.sessionDemand.deleteMany({ where: { demandId: id, sessionId: sd.sessionId } });
      }
    }
  }

  return NextResponse.json({ ok: true, cancelledSessions });
});

// 软删除 — 把 status 改成 cancelled
export const DELETE = withError(async (_: Request, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');
  if (!['admin', 'reviewer'].includes(user.role)) throw new ApiError('无权限删除', 403, 'FORBIDDEN');

  const existing = await prisma.demand.findUnique({ where: { id } });
  if (!existing) throw new ApiError('需求不存在', 404, 'NOT_FOUND');
  if (['done', 'cancelled', 'archived'].includes(existing.status)) {
    throw new ApiError(`当前状态 ${existing.status} 不能删除`, 400, 'INVALID_STATE');
  }

  await prisma.demand.update({ where: { id }, data: { status: 'cancelled', updatedAt: new Date() } });
  await prisma.demandHistory.create({
    data: { demandId: id, time: new Date(), user: user.name, action: '取消需求', toStatus: 'cancelled' },
  });

  return NextResponse.json({ ok: true });
});
