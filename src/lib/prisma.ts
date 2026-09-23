// Prisma Client — 生产强制 Neon adapter, 本地强制 SQLite adapter
import { PrismaClient } from '../generated/prisma-client/client';

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('[PRISMA] URL=', dbUrl.substring(0, 50), 'len=', dbUrl.length);

  if (dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:')) {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    console.log('[PRISMA] Using SQLite + better-sqlite3 adapter');
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    return new PrismaClient({ adapter });
  }

  if (dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres://')) {
    const { PrismaNeonHttp } = require('@prisma/adapter-neon');
    console.log('[PRISMA] Using Postgres + Neon HTTP adapter');
    const adapter = new PrismaNeonHttp(dbUrl);
    return new PrismaClient({ adapter });
  }

  // 如果没有 dbUrl, 也要防止 P2038 (engineType=client 必须要 adapter)
  // 默认尝试 Neon adapter
  console.log('[PRISMA] WARNING: No DATABASE_URL matched branches! Trying Neon anyway...');
  const { PrismaNeonHttp } = require('@prisma/adapter-neon');
  return new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl || process.env.DATABASE_URL || '') });
}

const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export default prisma;
