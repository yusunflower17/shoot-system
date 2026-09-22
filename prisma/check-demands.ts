import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const all = await p.demand.findMany({ select: { id: true, no: true, status: true } });
  console.log('All demands:', all.length);
  all.forEach(d => console.log(`  ${d.no} | ${d.status}`));
  await p.$disconnect();
})();
