// GET /api/demands — 需求列表（支持筛选）
// POST /api/demands — 新建需求
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, genNo, safeParseJSON } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
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
    ];
  }
  const demands = await prisma.demand.findMany({
    where, orderBy: { createdAt: 'desc' }, include: { model: true },
  });
  return NextResponse.json(demands);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await req.json();

  // 自动生成编号
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const todayCount = await prisma.demand.count({ where: { no: { startsWith: `REQ-${dateStr}` } } });
  const no = genNo('REQ', todayCount);

  const { purpose = [], content = [], scenes = [], aspectRatio = [], videoDuration = [] } = body;

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
      scenes: JSON.stringify(scenes),
      aspectRatio: JSON.stringify(aspectRatio),
      videoDuration: JSON.stringify(videoDuration),
      expectStart: body.expectStart || null,
      expectEnd: body.expectEnd || null,
      urgency: body.urgency || '普通',
      priority: body.priority || (body.urgency === '紧急' ? 'P0' : body.urgency === '重要' ? 'P1' : 'P2'),
      description: body.description,
      status: body.status || 'draft',
    },
  });

  // 手动写历史（nested write 在 Neon HTTP adapter 上不支持）
  await prisma.demandHistory.create({
    data: {
      demandId: demand.id, time: new Date(),
      user: user.name, action: '创建需求',
      toStatus: body.status || 'draft',
    },
  });

  return NextResponse.json(demand, { status: 201 });
}
