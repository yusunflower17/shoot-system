import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const s = await p.session.findMany({ include: { demands: true } });
  console.log('Sessions:', s.length);
  s.forEach(x => console.log(' ', x.title, '| shooter:', x.shooterName, '| demands:', x.demands.map(d => d.demandId).join(',')));
  const d = await p.demand.findMany({ where: { status: 'scheduled' }, select: { id: true, no: true, status: true } });
  console.log('Scheduled demands:', d.length, d.map(x => x.no).join(', '));
  const all = await p.demand.findMany({ select: { id: true, no: true, status: true } });
  console.log('All demands:', all.length);
  all.forEach(x => console.log(' ', x.no, '|', x.status));
  await p.$disconnect();
})();
