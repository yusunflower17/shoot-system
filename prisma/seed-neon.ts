// 一键建表 + seed Neon 数据库
import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma-client/client';
import bcrypt from 'bcryptjs';

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log('🎯 连接 Neon...');
  const v = await prisma.$queryRaw`SELECT version()`;
  console.log('✅ Neon 连接成功:', (v as any[])[0].version.split(',')[0]);

  // 1. 清空旧表
  console.log('\n🧹 清空旧表...');
  const tables = ['DemandHistory', 'SessionDemand', 'Task', 'Session', 'Demand', 'ModelVersion', 'Model', 'User', 'Config', 'Record', 'ModelApp', 'ConfigApp'];
  for (const t of tables) {
    try { await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${t}" CASCADE`); } catch {}
  }

  // 2. 建表（和之前一样的 SQL）
  console.log('📝 建表中...');
  const sql = [
    `CREATE TABLE "User" (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, dept TEXT NOT NULL, role TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`,
    `CREATE TABLE "Model" (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, brand TEXT NOT NULL, series TEXT NOT NULL, name TEXT NOT NULL, "enName" TEXT, type TEXT NOT NULL, position TEXT, status TEXT NOT NULL, "launchStatus" BOOLEAN NOT NULL DEFAULT TRUE, image TEXT, remark TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`,
    `CREATE TABLE "ModelVersion" (id TEXT PRIMARY KEY, "modelId" TEXT NOT NULL, name TEXT NOT NULL, wheelset TEXT, groupset TEXT, brake TEXT, frame TEXT, handlebar TEXT, seatpost TEXT, color TEXT, size TEXT, FOREIGN KEY ("modelId") REFERENCES "Model"(id) ON DELETE CASCADE)`,
    `CREATE TABLE "Config" (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, "enName" TEXT, remark TEXT, status TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`,
    `CREATE TABLE "Demand" (id TEXT PRIMARY KEY, no TEXT UNIQUE NOT NULL, title TEXT NOT NULL, "submitterId" TEXT NOT NULL, "submitterName" TEXT NOT NULL, "submitterDept" TEXT, direction TEXT NOT NULL, contact TEXT, purpose TEXT NOT NULL, "modelId" TEXT NOT NULL, "modelName" TEXT NOT NULL, "versionId" TEXT, "versionName" TEXT, components TEXT, content TEXT NOT NULL, "needPerson" TEXT, scenes TEXT, "aspectRatio" TEXT, "videoDuration" TEXT, "expectStart" TEXT, "expectEnd" TEXT, urgency TEXT NOT NULL DEFAULT '普通', priority TEXT NOT NULL DEFAULT 'P2', description TEXT, status TEXT NOT NULL DEFAULT 'draft', "reviewerId" TEXT, "reviewedAt" TIMESTAMP(3), "revisionNote" TEXT, "scheduleNote" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, FOREIGN KEY ("submitterId") REFERENCES "User"(id) ON DELETE SET NULL, FOREIGN KEY ("modelId") REFERENCES "Model"(id) ON DELETE RESTRICT)`,
    `CREATE TABLE "DemandHistory" (id TEXT PRIMARY KEY, "demandId" TEXT NOT NULL, time TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "user" TEXT NOT NULL, action TEXT NOT NULL, "toStatus" TEXT NOT NULL, detail TEXT, FOREIGN KEY ("demandId") REFERENCES "Demand"(id) ON DELETE CASCADE)`,
    `CREATE TABLE "Session" (id TEXT PRIMARY KEY, no TEXT UNIQUE NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL, "startTime" TEXT, "endTime" TEXT, location TEXT, "shooterId" TEXT, "shooterName" TEXT, status TEXT NOT NULL DEFAULT 'scheduled', "vehicleCount" INTEGER NOT NULL DEFAULT 1, note TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("shooterId") REFERENCES "User"(id) ON DELETE SET NULL)`,
    `CREATE TABLE "SessionDemand" ("sessionId" TEXT NOT NULL, "demandId" TEXT NOT NULL, PRIMARY KEY ("sessionId", "demandId"), FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE CASCADE, FOREIGN KEY ("demandId") REFERENCES "Demand"(id) ON DELETE CASCADE)`,
    `CREATE TABLE "Task" (id TEXT PRIMARY KEY, no TEXT UNIQUE NOT NULL, "sessionId" TEXT NOT NULL, "demandId" TEXT NOT NULL, title TEXT NOT NULL, content TEXT, "aspectRatio" TEXT, "videoDuration" TEXT, "shooterId" TEXT, "shooterName" TEXT, status TEXT NOT NULL DEFAULT 'pending', "materialUrl" TEXT, remark TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE CASCADE, FOREIGN KEY ("demandId") REFERENCES "Demand"(id) ON DELETE CASCADE)`,
    `CREATE TABLE "Record" (id TEXT PRIMARY KEY, time TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "user" TEXT NOT NULL, role TEXT, action TEXT NOT NULL, "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, detail TEXT)`,
    `CREATE TABLE "ModelApp" (id TEXT PRIMARY KEY, code TEXT NOT NULL, brand TEXT NOT NULL, series TEXT NOT NULL, name TEXT NOT NULL, "enName" TEXT, type TEXT, position TEXT, "launchStatus" BOOLEAN NOT NULL DEFAULT FALSE, remark TEXT, status TEXT NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, createdBy TEXT NOT NULL, "reviewedAt" TIMESTAMP(3))`,
    `CREATE TABLE "ConfigApp" (id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, "enName" TEXT, remark TEXT, status TEXT NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, createdBy TEXT NOT NULL, "reviewedAt" TIMESTAMP(3))`,
  ];
  for (const s of sql) await prisma.$executeRawUnsafe(s);
  console.log('✅ 所有表创建完成！');

  // 3. Seed 用户（用 Prisma Client create()，自动处理 id 和时间戳）
  console.log('\n👤 Seed 用户...');
  const defaultHash = await bcrypt.hash('123456', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const guestHash = await bcrypt.hash('guest123', 10);

  const users = [
    { username: 'admin', password: adminHash, name: '管理员', dept: '运营部', role: 'admin' },
    { username: 'wangwu', password: defaultHash, name: '王五', dept: '运营部', role: 'reviewer' },
    { username: 'zhaoliu', password: defaultHash, name: '赵六', dept: '国内销售', role: 'submitter' },
    { username: 'qianqi', password: defaultHash, name: '钱七', dept: '海外销售', role: 'submitter' },
    { username: 'sunba', password: defaultHash, name: '孙八', dept: '电商', role: 'submitter' },
    { username: 'zhoujiu', password: defaultHash, name: '周九', dept: '外贸', role: 'submitter' },
    { username: 'guest', password: guestHash, name: '访客', dept: '访客', role: 'guest' },
  ];

  for (const u of users) {
    try {
      await (prisma as any).user.create({ data: u });
      console.log(`  ✅ ${u.username} (${u.role})`);
    } catch (e: any) {
      if (e?.code === 'P2002') { console.log(`  ⏭️ ${u.username} 已存在`); }
      else { console.log(`  ⚠️ ${u.username}: ${e?.message?.slice(0, 80) || e}`); }
    }
  }

  console.log('\n🎉 Neon 数据库准备完成！');
  await prisma.$disconnect();
}

main().catch(console.error);
