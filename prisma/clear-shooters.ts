import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // 删除所有 shooter（张三/李四/陈二等 seed 数据）
  const result = await p.user.deleteMany({ where: { role: 'shooter' } });
  console.log('Deleted shooters:', result.count);
  const remaining = await p.user.findMany({ select: { username: true, name: true, role: true } });
  console.log('Remaining users:', remaining.length);
  remaining.forEach(u => console.log(`  ${u.username} | ${u.name} | ${u.role}`));
  await p.$disconnect();
})();
