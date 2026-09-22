// GET/POST /api/records — 操作记录 + 车型/配置申请审核
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const url = new URL(req.url);
  const targetType = url.searchParams.get('type');

  const where: any = targetType ? { targetType } : {};
  const records = await prisma.record.findMany({ where, orderBy: { time: 'desc' }, take: 200 });

  // 同时返回待审核的车型申请和配置申请
  const modelApps = await prisma.modelApp.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });
  const configApps = await prisma.configApp.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });

  return NextResponse.json({ records, modelApps, configApps });
}

// 审核车型/配置申请
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'reviewer') {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }
  const body = await req.json();
  const { type, id, action } = body; // type: 'model' | 'config', action: 'approve' | 'reject'

  if (type === 'model') {
    const app = await prisma.modelApp.findUnique({ where: { id } });
    if (!app) return NextResponse.json({ error: '不存在' }, { status: 404 });
    if (action === 'approve') {
      await prisma.model.create({
        data: {
          code: app.code, brand: app.brand, series: app.series, name: app.name,
          enName: app.enName || null, type: app.type || null,
          position: app.position || null, status: '在售',
          launchStatus: app.launchStatus, remark: app.remark || null,
        },
      });
    }
    await prisma.modelApp.update({ where: { id }, data: { status: action === 'approve' ? 'approved' : 'rejected', reviewedAt: new Date() } });
  } else if (type === 'config') {
    const app = await prisma.configApp.findUnique({ where: { id } });
    if (!app) return NextResponse.json({ error: '不存在' }, { status: 404 });
    if (action === 'approve') {
      const count = await prisma.config.count();
      await prisma.config.create({
        data: {
          code: `CFG-${app.type?.toUpperCase() || 'OTHER'}-${String(count+1).padStart(3,'0')}`,
          type: app.type, name: app.name, enName: app.enName || null, remark: app.remark || null,
        },
      });
    }
    await prisma.configApp.update({ where: { id }, data: { status: action === 'approve' ? 'approved' : 'rejected', reviewedAt: new Date() } });
  }

  // 写操作记录
  await prisma.record.create({
    data: { time: new Date(), user: user.name, role: user.role,
      action: action === 'approve' ? '审核通过' : '审核驳回',
      targetType: type === 'model' ? '车型申请' : '配置申请', targetId: id },
  });

  return NextResponse.json({ ok: true });
}
