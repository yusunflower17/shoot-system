// POST /api/auth/guest — 一键访客登录（无需账号密码）
// 自动查找 guest 用户，发 cookie
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const COOKIE_NAME = 'shoot-session';

export async function POST() {
  try {
    let user = await prisma.user.findUnique({ where: { username: 'guest' } });
    
    // 如果 Neon 上没有 guest 用户 → 自动创建
    if (!user) {
      const bcrypt = require('bcryptjs');
      user = await prisma.user.create({
        data: {
          username: 'guest',
          password: bcrypt.hashSync('guest123', 10),
          name: '访客',
          dept: '访客',
          role: 'submitter',
        },
      });
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
    console.error('Guest login error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
