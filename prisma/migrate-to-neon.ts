// 迁移: SQLite → Neon Postgres (带类型转换)
import Database from 'better-sqlite3';
import { PrismaClient } from '../src/generated/prisma-client/client';

const DB_PATH = 'prisma/dev.db';
const NEON = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true';

// SQLite表名 → Prisma client方法名
const TABLES: [string, string][] = [
  ['User', 'user'], ['Model', 'model'], ['ModelVersion', 'modelVersion'],
  ['Config', 'config'], ['ModelApp', 'modelApp'], ['ConfigApp', 'configApp'],
  ['Demand', 'demand'], ['DemandHistory', 'demandHistory'], ['Session', 'session'],
  ['Task', 'task'], ['SessionDemand', 'sessionDemand'], ['Record', 'record'],
];

// 需要 boolean 转换的字段 (SQLite 存 0/1)
const BOOL_FIELDS = new Set(['launchStatus']);

function convertRow(row: any): any {
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    // null 保持 null
    if (v === null || v === undefined) { out[k] = v; continue; }
    // 时间字段: number timestamp → Date
    if (k.endsWith('At') && typeof v === 'number') { out[k] = new Date(v); continue; }
    // boolean 字段: 0/1 → true/false
    if (BOOL_FIELDS.has(k) && typeof v === 'number') { out[k] = v !== 0; continue; }
    out[k] = v;
  }
  return out;
}

async function main() {
  console.log('=== SQLite → Neon 迁移 ===');
  const sqlite = new Database(DB_PATH, { readonly: true });
  const { PrismaNeonHttp } = require('@prisma/adapter-neon');
  const pg = new PrismaClient({ adapter: new PrismaNeonHttp(NEON) });

  // 清 Neon
  console.log('\n1. 清 Neon...');
  const child = ['sessionDemand','demandHistory','task','demand','session','modelVersion','model','config','modelApp','configApp','user','record'];
  for (const m of child) { try { await (pg as any)[m].deleteMany({}); } catch {} }
  console.log('   ✅');

  // 迁移
  console.log('\n2. 迁移数据...');
  let totalOk = 0, totalFail = 0;
  for (const [tbl, method] of TABLES) {
    const rows = sqlite.prepare(`SELECT * FROM "${tbl}"`).all() as any[];
    if (rows.length === 0) { console.log(`   ⏭️  ${tbl}: 空`); continue; }

    let ok = 0, fail = 0;
    for (const row of rows) {
      try {
        await (pg as any)[method].create({ data: convertRow(row) });
        ok++;
      } catch (e: any) {
        fail++;
        if (fail <= 2) console.log(`   ⚠️  ${tbl} ${row.id || row.no || row.code || '?'}: ${e.message?.split('\n')[0]?.substring(0,100)}`);
      }
    }
    totalOk += ok; totalFail += fail;
    console.log(`   ✅ ${tbl}: ${ok}/${rows.length}`);
  }

  console.log(`\n=== 完成: ${totalOk} 成功 / ${totalFail} 失败 ===`);
  sqlite.close();
  await pg.$disconnect();
}

main().catch(e => { console.error('❌', e); process.exit(1); });
