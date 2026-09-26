// src/lib/api-error.ts — 统一 API 错误处理
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// 给 route handler 包一层 try-catch，返回结构化错误
export function withError<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (err: any) {
      console.error(`[API ERROR] ${fn.name || 'handler'}:`, err?.message, err?.stack?.split('\n')[1]);

      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }

      // Prisma 特有错误
      if (err?.code === 'P2002') {
        return NextResponse.json({ error: '数据唯一约束冲突，可能已存在相同记录', code: 'DUPLICATE' }, { status: 409 });
      }
      if (err?.code === 'P2025') {
        return NextResponse.json({ error: '数据不存在', code: 'NOT_FOUND' }, { status: 404 });
      }
      if (err?.code === 'P2003' || err?.code === 'P2014') {
        return NextResponse.json({ error: '关联数据约束错误', code: 'FK_ERROR' }, { status: 400 });
      }

      const status = err?.status || 500;
      const code = err?.code || 'INTERNAL_ERROR';
      const msg = process.env.NODE_ENV === 'production'
        ? (status >= 500 ? '服务器内部错误' : (err?.message || '请求处理失败'))
        : (err?.message || '未知错误');

      return NextResponse.json({ error: msg, code }, { status });
    }
  }) as T;
}

// 状态机 — 哪些状态可以合法跳转到哪些状态
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:     ['pending', 'cancelled'],
  pending:   ['confirmed', 'revision', 'cancelled'],
  revision:  ['pending', 'cancelled'],
  confirmed: ['scheduled', 'cancelled'],
  scheduled: ['shooting', 'cancelled'],
  shooting:  ['review', 'cancelled'],
  review:    ['done', 'revision'],
  done:      ['archived'],
  cancelled: [],
  archived:  [],
};

export function validateStatusTransition(from: string, to: string): string | null {
  if (from === to) return null;
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed) return `未知源状态: ${from}`;
  if (!allowed.includes(to)) return `不允许从 ${from} 跳转到 ${to}。合法目标: ${allowed.join(', ')}`;
  return null;
}
