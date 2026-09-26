import Database from 'better-sqlite3';
import { PrismaClient } from '../src/generated/prisma-client/client';
async function main() {
  const NEON = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true';
  const sqlite = new Database('prisma/dev.db', { readonly: true });
  const { PrismaNeonHttp } = require('@prisma/adapter-neon');
  const pg = new PrismaClient({ adapter: new PrismaNeonHttp(NEON) });
  
  const row = sqlite.prepare('SELECT * FROM "DemandHistory" LIMIT 1').get() as any;
  console.log('RAW:', JSON.stringify(row));
  console.log('TYPES:', Object.fromEntries(Object.entries(row).map(([k,v]) => [k, typeof v])));
  
  // time 字段可能不以 At 结尾
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) { out[k] = v; continue; }
    if ((k.endsWith('At') || k === 'time') && typeof v === 'number') { out[k] = new Date(v); continue; }
    out[k] = v;
  }
  console.log('CONVERTED:', JSON.stringify(out));
  
  try {
    const r = await pg.demandHistory.create({ data: out });
    console.log('✅ OK:', r.id);
  } catch (e: any) {
    console.log('❌:', e.message);
  }
  
  sqlite.close(); pg.$disconnect();
}
main();
