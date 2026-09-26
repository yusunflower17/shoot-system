// 首个管理员引导脚本（adapter 自适应：Neon Postgres / 本地 SQLite）
// 用法：ADMIN_USER=admin ADMIN_PASS=你的密码 npm run db:seed:admin
// 默认账号 admin / admin123，重复执行只会更新密码与角色，不会重复建号。
import { PrismaClient } from '../src/generated/prisma-client/client';
import bcrypt from 'bcryptjs';

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
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'admin123';
  const name = process.env.ADMIN_NAME || '管理员';
  const dept = process.env.ADMIN_DEPT || '管理部';
  const hash = bcrypt.hashSync(password, 10);
  await prisma.user.upsert({
    where: { username },
    update: { role: 'admin', name, dept, password: hash },
    create: { username, password: hash, name, dept, role: 'admin' },
  });
  console.log(`管理员就绪：用户名=${username} 角色=admin`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); process.exit(1); });
