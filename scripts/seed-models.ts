// 车型标准库种子脚本（adapter 自适应：Neon Postgres / 本地 SQLite）
// 用 tsx 运行：npm run db:seed
// 依据 WorkBuddy 资料库「整车三合一表格合集」整理出的 52 款车型，按 code upsert，重复执行不会新增重复记录。
import { PrismaClient } from '../src/generated/prisma-client/client';
import { readFileSync } from 'node:fs';

const dbUrl = process.env.DATABASE_URL || '';

async function getPrisma(): Promise<PrismaClient> {
  if (dbUrl.startsWith('postgres')) {
    const { PrismaNeonHttp } = await import('@prisma/adapter-neon');
    return new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, undefined) });
  }
  if (dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:')) {
    const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });
  }
  return new PrismaClient();
}

async function main() {
  const prisma = await getPrisma();
  const models = JSON.parse(readFileSync(new URL('../prisma/seed/models.json', import.meta.url), 'utf-8'));
  for (const m of models) {
    await prisma.model.upsert({
      where: { code: m.code },
      update: { brand: m.brand, series: m.series, name: m.name, type: m.type, status: m.status, launchStatus: m.launchStatus, remark: m.remark },
      create: m,
    });
  }
  console.log(`车型标准库种子完成：共处理 ${models.length} 条`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); process.exit(1); });
