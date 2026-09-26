import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // Reset 3 demands back to confirmed
  const targets = ['REQ-20260922-001', 'REQ-20260923-002', 'REQ-20260924-003'];
  for (const no of targets) {
    await p.demand.updateMany({ where: { no }, data: { status: 'confirmed' } });
  }
  // Now link existing 2 sessions to a demand + schedule them
  const confirmed = await p.demand.findMany({ where: { status: 'confirmed' }, orderBy: { createdAt: 'asc' } });
  const sessions = await p.session.findMany({ orderBy: { createdAt: 'asc' } });
  
  for (let i = 0; i < sessions.length && i < confirmed.length; i++) {
    await p.sessionDemand.create({ data: { sessionId: sessions[i].id, demandId: confirmed[i].id } });
    await p.demand.update({ where: { id: confirmed[i].id }, data: { status: 'scheduled' } });
    console.log(`Linked: ${sessions[i].title} → ${confirmed[i].no} → scheduled ✓`);
  }
  
  const after = await p.demand.findMany({ select: { no: true, status: true } });
  console.log('\nFinal state:');
  after.forEach(x => console.log(' ', x.no, '|', x.status));
  await p.$disconnect();
})();
