// 测试 Neon 连接 + 建表
import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma-client/client';

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    // 测试连接
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Neon 连接成功！');
    console.log('Postgres version:', JSON.stringify(result));

    // 看看有哪些表
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    console.log('现有表:', JSON.stringify(tables));
  } catch (e: any) {
    console.error('❌ 连接失败:', e?.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
