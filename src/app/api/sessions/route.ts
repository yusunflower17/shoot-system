// GET/POST /api/sessions
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, genNo } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const sessions = await prisma.session.findMany({
    include: { _count: { select: { demands: true, tasks: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await req.json();
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const todayCount = await prisma.session.count({ where: { no: { startsWith: `SHOOT-${dateStr}` } } });
  const no = genNo('SHOOT', todayCount);

  const demandIds: string[] = body.demandIds || [];

  const session = await prisma.session.create({
    data: {
      no, title: body.title, date: body.date,
      startTime: body.startTime || null, endTime: body.endTime || null,
      location: body.location || null,
      shooterId: body.shooterId || null, shooterName: body.shooterName || null,
      vehicleCount: body.vehicleCount || 1,
      note: body.note || null,
      status: 'scheduled',
    },
  });

  // 手动写 SessionDemand 关联（nested create 在 Neon HTTP adapter 上不支持）
  for (const demandId of demandIds) {
    await prisma.sessionDemand.create({ data: { sessionId: session.id, demandId } });
  }

  // 更新关联需求的状态为已排期
  await prisma.demand.updateMany({
    where: { id: { in: demandIds }, status: { in: ['confirmed', 'scheduled'] } },
    data: { status: 'scheduled', scheduleNote: no },
  });

  // 自动创建对应的拍摄任务
  for (const demandId of demandIds) {
    const demand = await prisma.demand.findUnique({ where: { id: demandId } });
    if (!demand) continue;
    await prisma.task.create({
      data: {
        no: genNo('TASK', await prisma.task.count() + Math.floor(Math.random() * 100)),
        sessionId: session.id, demandId,
        title: `${demand.modelName} ${demand.versionName || ''} - 拍摄任务`.trim(),
        content: demand.content,
        aspectRatio: demand.aspectRatio,
        videoDuration: demand.videoDuration,
        shooterId: session.shooterId, shooterName: session.shooterName,
        status: 'pending',
      },
    });
    // 给需求添加历史
    await prisma.demandHistory.create({
      data: { demandId, time: new Date(), user: user.name, action: '排期确认', toStatus: 'scheduled', detail: no },
    });
  }

  return NextResponse.json(session, { status: 201 });
}
