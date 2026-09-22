import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
(async () => {
  let guest = await p.user.findUnique({ where: { username: 'guest' } });
  if (!guest) {
    const pw = await bcrypt.hash('guest123', 10);
    guest = await p.user.create({
      data: { username: 'guest', password: pw, name: '访客提报', role: 'submitter', dept: '访客' },
    });
    console.log('guest created ✓');
  } else {
    console.log('guest exists:', guest.name, guest.role);
  }
  const admin = await p.user.findUnique({ where: { username: 'admin' } });
  console.log('admin:', admin?.name, admin?.role);
  await p.$disconnect();
})();
