// 通过 Neon HTTP API 直接建表 + seed 用户（绕开被挡的 TCP 5432）
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const NEON_URL = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(NEON_URL);

async function run() {
  console.log('Connecting to Neon via HTTP...');

  // 建表 SQL
  const createTables = [
    `CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      name TEXT NOT NULL, dept TEXT NOT NULL, role TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Model" (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, brand TEXT NOT NULL, series TEXT NOT NULL,
      name TEXT NOT NULL, "enName" TEXT, type TEXT NOT NULL, position TEXT, status TEXT NOT NULL,
      "launchStatus" BOOLEAN NOT NULL DEFAULT true, image TEXT, remark TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "ModelVersion" (
      id TEXT PRIMARY KEY, "modelId" TEXT NOT NULL, name TEXT NOT NULL,
      wheelset TEXT, groupset TEXT, brake TEXT, frame TEXT, handlebar TEXT,
      seatpost TEXT, color TEXT, size TEXT,
      FOREIGN KEY ("modelId") REFERENCES "Model"(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Config" (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL,
      "enName" TEXT, remark TEXT, status TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "ModelApp" (
      id TEXT PRIMARY KEY, code TEXT NOT NULL, brand TEXT NOT NULL, series TEXT NOT NULL,
      name TEXT NOT NULL, "enName" TEXT, type TEXT, position TEXT,
      "launchStatus" BOOLEAN NOT NULL DEFAULT false, remark TEXT, status TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdBy" TEXT NOT NULL, "reviewedAt" TIMESTAMP(3)
    )`,
    `CREATE TABLE IF NOT EXISTS "ConfigApp" (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, "enName" TEXT, remark TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdBy" TEXT NOT NULL, "reviewedAt" TIMESTAMP(3)
    )`,
    `CREATE TABLE IF NOT EXISTS "Demand" (
      id TEXT PRIMARY KEY, no TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
      "submitterId" TEXT NOT NULL, "submitterName" TEXT NOT NULL, "submitterDept" TEXT,
      direction TEXT NOT NULL, contact TEXT, purpose TEXT NOT NULL,
      "modelId" TEXT NOT NULL, "modelName" TEXT NOT NULL, "versionId" TEXT, "versionName" TEXT,
      components TEXT, content TEXT NOT NULL, "needPerson" TEXT, scenes TEXT,
      "aspectRatio" TEXT, "videoDuration" TEXT, "expectStart" TEXT, "expectEnd" TEXT,
      urgency TEXT NOT NULL DEFAULT '普通', priority TEXT NOT NULL DEFAULT 'P2',
      description TEXT, status TEXT NOT NULL DEFAULT 'draft', "reviewerId" TEXT,
      "reviewedAt" TIMESTAMP(3), "revisionNote" TEXT, "scheduleNote" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      FOREIGN KEY ("submitterId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY ("modelId") REFERENCES "Model"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "DemandHistory" (
      id TEXT PRIMARY KEY, "demandId" TEXT NOT NULL, time TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "user" TEXT NOT NULL, action TEXT NOT NULL, "toStatus" TEXT NOT NULL, detail TEXT,
      FOREIGN KEY ("demandId") REFERENCES "Demand"(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Session" (
      id TEXT PRIMARY KEY, no TEXT UNIQUE NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL,
      "startTime" TEXT, "endTime" TEXT, location TEXT, "shooterId" TEXT, "shooterName" TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled', "vehicleCount" INTEGER NOT NULL DEFAULT 1, note TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("shooterId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "SessionDemand" (
      "sessionId" TEXT NOT NULL, "demandId" TEXT NOT NULL,
      FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("demandId") REFERENCES "Demand"(id) ON DELETE CASCADE ON UPDATE CASCADE,
      PRIMARY KEY ("sessionId", "demandId")
    )`,
    `CREATE TABLE IF NOT EXISTS "Task" (
      id TEXT PRIMARY KEY, no TEXT UNIQUE NOT NULL, "sessionId" TEXT NOT NULL,
      "demandId" TEXT NOT NULL, title TEXT NOT NULL, content TEXT, "aspectRatio" TEXT,
      "videoDuration" TEXT, "shooterId" TEXT, "shooterName" TEXT,
      status TEXT NOT NULL DEFAULT 'pending', "materialUrl" TEXT, remark TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("demandId") REFERENCES "Demand"(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Record" (
      id TEXT PRIMARY KEY, time TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "user" TEXT NOT NULL, role TEXT, action TEXT NOT NULL,
      "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, detail TEXT
    )`,
  ];

  console.log('Creating tables...');
  for (const stmt of createTables) {
    await sql.query(stmt);
  }
  console.log('✅ Tables created!');

  // 检查用户
  const existing = await sql.query('SELECT COUNT(*) as cnt FROM "User"');
  const count = (existing[0] as any).cnt;
  console.log(`Existing users: ${count}`);

  if (count === 0) {
    const h123 = bcrypt.hashSync('123456', 10);
    const hAdmin = bcrypt.hashSync('admin123', 10);
    const hGuest = bcrypt.hashSync('guest123', 10);

    const users = [
      ['admin', hAdmin, '超级管理员', '管理部', 'admin'],
      ['wangwu', h123, '王五', '审核部', 'reviewer'],
      ['zhaoliu', h123, '赵六', '市场部', 'submitter'],
      ['qianqi', h123, '钱七', '产品部', 'submitter'],
      ['sunba', h123, '孙八', '设计部', 'submitter'],
      ['zhoujiu', h123, '周九', '运营部', 'submitter'],
      ['guest', hGuest, '访客', '访客', 'guest'],
    ];

    for (const [u, p, n, d, r] of users) {
      await sql.query(
        `INSERT INTO "User" (id, username, password, name, dept, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (username) DO NOTHING`,
        [u, p, n, d, r]
      );
    }
    console.log(`✅ Seeded ${users.length} users!`);
  } else {
    console.log('Users already exist, skipping seed');
  }

  console.log('\n🎉 Neon DB ready! Vercel should work now.');
}

run().catch(e => { console.error('❌ FAILED:', e); process.exit(1); });
