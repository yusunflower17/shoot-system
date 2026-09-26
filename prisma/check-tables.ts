import Database from 'better-sqlite3';
const db = new Database('prisma/dev.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
console.log('TABLES:', tables.map(t => t.name));
db.close();
