// Prisma Client — 本地开发用 SQLite, 生产 Cloudflare Workers 用 Neon
// 无 Rust 引擎模式 (engineType="client") + driver adapter
import { PrismaClient } from '../generated/prisma-client/client';

// 根据运行环境选择数据库 adapter
// - 本地开发 (localhost / 非 production): SQLite + better-sqlite3
// - 生产 Cloudflare Workers: Neon Postgres (HTTP serverless driver, 无 TCP socket)
function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbUrl = process.env.DATABASE_URL || '';

  // 如果 DATABASE_URL 是 SQLite 文件 (本地开发)
  if (dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:')) {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    return new PrismaClient({ adapter });
  }

  // 如果是 Cloudflare Workers 生产环境 (Neon Postgres)
  if (isProduction) {
    const { PrismaNeon } = require('@prisma/adapter-neon');
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  }

  // 默认: 本地 + Postgres URL 也用 Neon adapter
  if (dbUrl.includes('neon') || dbUrl.includes('-pooler')) {
    const { PrismaNeon } = require('@prisma/adapter-neon');
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  }

  // 兜底: 直接用默认 Prisma Client (带 url)
  return new PrismaClient({ datasourceUrl: dbUrl });
}

const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export default prisma;
