import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // 把前 3 个 cancelled 改成 confirmed 让流程跑通
  const targets = ['REQ-20260922-001', 'REQ-20260923-002', 'REQ-20260924-003'];
  for (const no of targets) {
    const d = await p.demand.findFirst({ where: { no } });
    if (d) {
      await p.demand.update({ where: { id: d.id }, data: { status: 'confirmed' } });
      console.log(`${no}: ${d.status} → confirmed ✓`);
    }
  }
  // 验证
  const confirmed = await p.demand.findMany({ where: { status: 'confirmed' }, select: { no: true } });
  console.log('Confirmed now:', confirmed.map(c => c.no).join(', '));
  await p.$disconnect();
})();
