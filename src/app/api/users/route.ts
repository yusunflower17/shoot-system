// POST /api/users — 管理员添加新用户（role 可选）
// GET  /api/users — 返回所有用户（安全字段）
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const all = await prisma.user.findMany({ orderBy: { role: 'asc' } });
  const safe = all.map(({ password: _pw, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: '未登录' }, { status: 401 });
  // 只有 admin/reviewer 能加人
  if (!['admin', 'reviewer'].includes(admin.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const body = await req.json();
  const { username, password, name, dept, role } = body;
  if (!username || !password || !name) {
    return NextResponse.json({ error: '用户名、密码、姓名必填' }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
  const u = await prisma.user.create({
    data: {
      username,
      password: bcrypt.hashSync(password, 10),
      name,
      dept: dept || '',
      role: role || 'shooter',
    },
  });
  const { password: _pw, ...safe } = u;
  return NextResponse.json(safe);
}

// PATCH /api/users/[id] — 修改角色/部门
export async function PATCH(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (!['admin', 'reviewer'].includes(admin.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const { id, name, dept, role } = await req.json();
  if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
  const u = await prisma.user.update({
    where: { id },
    data: { name, dept, role },
  });
  const { password: _pw, ...safe } = u;
  return NextResponse.json(safe);
}

// DELETE /api/users — admin only
export async function DELETE(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (admin.role !== 'admin') return NextResponse.json({ error: '仅管理员可删除' }, { status: 403 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: '不能删除自己' }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
