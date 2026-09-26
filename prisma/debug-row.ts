import Database from 'better-sqlite3';
import { PrismaClient } from '../src/generated/prisma-client/client';

async function main() {
  const NEON = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true';
  const sqlite = new Database('prisma/dev.db', { readonly: true });
  const { PrismaNeonHttp } = require('@prisma/adapter-neon');
  const pg = new PrismaClient({ adapter: new PrismaNeonHttp(NEON) });

  await pg.user.deleteMany({});

  const row = sqlite.prepare('SELECT * FROM "User" LIMIT 1').get() as any;
  console.log('RAW_ROW:', JSON.stringify(row));
  console.log('TYPES:', Object.fromEntries(Object.entries(row).map(([k,v]) => [k, typeof v])));

  try {
    const r = await pg.user.create({ data: row });
    console.log('✅ CREATE_OK:', r.id);
  } catch (e: any) {
    console.log('❌ CODE:', e.code);
    console.log('❌ MSG:', e.message);
    console.log('❌ META:', JSON.stringify(e.meta));
  }

  sqlite.close();
  pg.$disconnect();
}
main();
