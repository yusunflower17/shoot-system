// GET /api/demands — 需求列表（支持筛选）
// POST /api/demands — 新建需求（含软重复检测）
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, genNo } from '@/lib/auth';
import { withError, ApiError } from '@/lib/api-error';
import { notifyDemandCreated } from '@/lib/notify';

export const GET = withError(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const myOnly = url.searchParams.get('my');
  const direction = url.searchParams.get('direction');
  const q = url.searchParams.get('q');

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (myOnly === '1') where.submitterId = user.id;
  if (direction && direction !== 'all') where.direction = direction;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { no: { contains: q } },
      { modelName: { contains: q } },
      { submitterName: { contains: q } },
    ];
  }

  const demands = await prisma.demand.findMany({
    where, orderBy: { createdAt: 'desc' }, include: { model: true },
  });
  return NextResponse.json(demands);
});

export const POST = withError(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('未登录', 401, 'UNAUTHORIZED');

  const body = await req.json();
  if (!body.title && !body.modelId) {
    throw new ApiError('请填写标题或选择车型', 400, 'VALIDATION');
  }

  // === 软重复检测 ===
  const { purpose = [], content = [] } = body;
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const todayCount = await prisma.demand.count({ where: { no: { startsWith: `REQ-${dateStr}` } } });
  const no = genNo('REQ', todayCount);

  const title = body.title || `${body.modelName || ''}｜${body.versionName || ''}｜${purpose[0] || '拍摄'}`;

  const demand = await prisma.demand.create({
    data: {
      no, title,
      submitterId: user.id,
      submitterName: body.submitterName || user.name,
      submitterDept: body.submitterDept || user.dept,
      direction: body.direction || '其他',
      purpose: JSON.stringify(purpose),
      modelId: body.modelId, modelName: body.modelName,
      versionId: body.versionId || null, versionName: body.versionName || null,
      components: body.components ? JSON.stringify(body.components) : null,
      content: JSON.stringify(content),
      needPerson: body.needPerson,
      scenes: JSON.stringify(body.scenes || []),
      aspectRatio: JSON.stringify(body.aspectRatio || []),
      videoDuration: JSON.stringify(body.videoDuration || []),
      expectStart: body.expectStart || null,
      expectEnd: body.expectEnd || null,
      urgency: body.urgency || '普通',
      priority: body.priority || (body.urgency === '紧急' ? 'P0' : body.urgency === '重要' ? 'P1' : 'P2'),
      description: body.description,
      status: body.status || 'draft',
    },
  });

  // 自动写历史
  await prisma.demandHistory.create({
    data: {
      demandId: demand.id, time: new Date(),
      user: user.name, action: '创建需求',
      toStatus: body.status || 'draft',
    },
  });

  // 异步推送通知（不阻塞响应）
  if ((body.status || 'draft') !== 'draft') {
    notifyDemandCreated({
      no: demand.no, title: demand.title, modelName: demand.modelName,
      direction: demand.direction, priority: demand.priority, urgency: demand.urgency,
      purpose: demand.purpose, submitterName: demand.submitterName,
      expectStart: demand.expectStart, expectEnd: demand.expectEnd,
      description: demand.description,
    }).catch(() => {});
  }

  return NextResponse.json(demand, { status: 201 });
});
