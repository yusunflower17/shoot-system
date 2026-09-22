// POST /api/auth/login
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }
    const token = await signToken({
      id: user.id, username: user.username, name: user.name, role: user.role, dept: user.dept,
    });
    await setAuthCookie(token);
    return NextResponse.json({
      id: user.id, username: user.username, name: user.name, role: user.role, dept: user.dept,
    });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
