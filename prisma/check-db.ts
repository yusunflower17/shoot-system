// check-db.ts
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const m = await p.model.findFirst({ include: { versions: true } });
  console.log('First model:', m?.name);
  console.log('versions count:', m?.versions?.length);
  const totalV = await p.modelVersion.count();
  const totalM = await p.model.count();
  console.log('Total models:', totalM, 'total versions:', totalV);
  if (m?.versions?.length) console.log('Sample version:', m.versions[0].name, 'modelId:', m.versions[0].modelId);
  await p.$disconnect();
})();
