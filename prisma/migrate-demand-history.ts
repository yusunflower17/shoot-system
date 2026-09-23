// 补跑 DemandHistory (加 time 字段转换)
import Database from 'better-sqlite3';
import { PrismaClient } from '../src/generated/prisma-client/client';

async function main() {
  const NEON = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true';
  const sqlite = new Database('prisma/dev.db', { readonly: true });
  const { PrismaNeonHttp } = require('@prisma/adapter-neon');
  const pg = new PrismaClient({ adapter: new PrismaNeonHttp(NEON) });

  await pg.demandHistory.deleteMany({});

  const rows = sqlite.prepare('SELECT * FROM "DemandHistory"').all() as any[];
  console.log(`补跑 DemandHistory: ${rows.length} 条`);

  let ok = 0, fail = 0;
  for (const row of rows) {
    const converted: any = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === null || v === undefined) { converted[k] = v; continue; }
      if ((k.endsWith('At') || k === 'time') && typeof v === 'number') { converted[k] = new Date(v); continue; }
      converted[k] = v;
    }
    try { await pg.demandHistory.create({ data: converted }); ok++; }
    catch (e: any) { fail++; if (fail <= 2) console.log(`  ❌ ${row.id}: ${e.message?.substring(0,80)}`); }
  }
  console.log(`✅ ${ok}/${rows.length} (${fail} 失败)`);

  sqlite.close(); pg.$disconnect();
}
main();
