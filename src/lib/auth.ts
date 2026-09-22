// src/lib/auth.ts — 简单的 Cookie 会话认证
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'shoot-session';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
  dept: string | null;
}

export async function signToken(user: AuthUser): Promise<string> {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    // 从数据库刷新最新信息
    const dbUser = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!dbUser) return null;
    return {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      role: dbUser.role,
      dept: dbUser.dept,
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30天
    path: '/',
  });
}

export async function clearAuthCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export const STATUS_FLOW: Record<string, string[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'revision', 'cancelled'],
  revision: ['pending', 'cancelled'],
  confirmed: ['scheduled', 'cancelled'],
  scheduled: ['shooting', 'cancelled'],
  shooting: ['review', 'revision'],
  review: ['done', 'revision'],
  done: ['archived'],
  cancelled: [],
  archived: [],
};

export const STATUS_LABELS: Record<string, string> = {
  draft: '草稿', pending: '待确认', confirmed: '已确认',
  scheduled: '已排期', shooting: '拍摄中', review: '待验收',
  done: '已完成', archived: '已归档', cancelled: '已取消', revision: '待修改',
};

export function genNo(prefix: string, count: number): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const num = String(count + 1).padStart(3, '0');
  return `${prefix}-${dateStr}-${num}`;
}

export function safeParseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}
