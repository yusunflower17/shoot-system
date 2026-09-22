import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  // 清理所有 session + 级联 sessionDemand 和 task
  const count = await prisma.session.count();
  console.log(`当前 session 数: ${count}`);
  await prisma.sessionDemand.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.session.deleteMany({});
  console.log('✓ 已清空所有 session / sessionDemand / task');
  await prisma.$disconnect();
})();
