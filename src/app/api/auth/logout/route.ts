// POST /api/auth/logout
import { NextResponse } from 'next/server';
import { withError } from '@/lib/api-error';

const COOKIE_NAME = 'shoot-session';

export const POST = withError(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
});
