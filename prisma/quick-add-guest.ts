// quick-add-guest.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
(async () => {
  await p.user.upsert({
    where: { username: 'guest' },
    update: {},
    create: { username: 'guest', password: bcrypt.hashSync('guest123', 10), name: '访客提报', dept: '访客', role: 'submitter' },
  });
  const all = await p.user.findMany({ select: { username: true, name: true, role: true } });
  console.log('Users:', all.length);
  await p.$disconnect();
})().catch(e => console.error(e));
