// Prisma Client — client engine + Neon HTTP adapter（Netlify/Cloudflare/Vercel 跨平台兼容）
import { PrismaClient } from '../generated/prisma-client/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || '';

  if (dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:')) {
    // 本地 SQLite：按需 require 原生模块（生产走 Neon，不加载它，避免 serverless 缺少原生二进制而崩溃）
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    console.log('[PRISMA] SQLite + better-sqlite3');
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });
  }

  console.log('[PRISMA] Postgres + Neon HTTP');
  return new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl || '', undefined) });
}

const prisma = (globalThis as any).prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prisma = prisma;
}

export default prisma;
