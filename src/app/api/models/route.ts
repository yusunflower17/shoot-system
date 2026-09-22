// GET/POST /api/models — 车型标准库
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const models = await prisma.model.findMany({
    include: { versions: true },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json(models);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'reviewer') {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }
  const body = await req.json();
  const m = await prisma.model.create({
    data: {
      code: body.code, brand: body.brand, series: body.series, name: body.name,
      enName: body.enName || null, type: body.type || null,
      position: body.position || null, status: body.status || '在售',
      launchStatus: body.launchStatus ?? true,
      remark: body.remark || null,
    },
  });
  return NextResponse.json(m, { status: 201 });
}


