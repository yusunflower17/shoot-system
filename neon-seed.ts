// 直接用 Neon HTTP + Prisma adapter push schema + seed users
import { PrismaClient } from './src/generated/prisma-client/client';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';

const NEON_URL = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const adapter = new PrismaNeonHTTP({ connectionString: NEON_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('Connected to Neon!');
  
  // 测试连接
  const count = await prisma.user.count();
  console.log(`Current user count in Neon: ${count}`);

  if (count === 0) {
    console.log('Seeding users...');
    
    const bcrypt = await import('bcryptjs');
    const hashGuest = bcrypt.hashSync('guest123', 10);
    const hash123 = bcrypt.hashSync('123456', 10);
    const hashAdmin = bcrypt.hashSync('admin123', 10);

    const users = [
      { username: 'admin',  name: '超级管理员', role: 'admin',     dept: '管理部',    password: hashAdmin },
      { username: 'wangwu', name: '王五',       role: 'reviewer',  dept: '审核部',    password: hash123 },
      { username: 'zhaoliu',name: '赵六',       role: 'submitter', dept: '市场部',    password: hash123 },
      { username: 'qianqi', name: '钱七',       role: 'submitter', dept: '产品部',    password: hash123 },
      { username: 'sunba',  name: '孙八',       role: 'submitter', dept: '设计部',    password: hash123 },
      { username: 'zhoujiu',name: '周九',       role: 'submitter', dept: '运营部',    password: hash123 },
      { username: 'guest',  name: '访客',       role: 'guest',     dept: '访客',      password: hashGuest },
    ];

    for (const u of users) {
      await prisma.user.upsert({
        where: { username: u.username },
        update: {},
        create: u,
      });
    }
    console.log(`✅ Seeded ${users.length} users!`);
  } else {
    console.log('Users already exist, skipping seed');
  }

  await prisma.$disconnect();
  console.log('Done!');
}

main().catch(e => { console.error('FAILED:', e); process.exit(1); });
