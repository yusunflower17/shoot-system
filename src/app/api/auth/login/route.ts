// POST /api/auth/login
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const COOKIE_NAME = 'shoot-session';

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
    const response = NextResponse.json({
      id: user.id, username: user.username, name: user.name, role: user.role, dept: user.dept,
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
