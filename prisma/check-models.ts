import { PrismaClient } from '../src/generated/prisma-client/client';
const { PrismaNeonHttp } = require('@prisma/adapter-neon');
const neon = 'postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true';
const pg = new PrismaClient({ adapter: new PrismaNeonHttp(neon) });
console.log('PRISMA_MODELS:', Object.keys(pg).filter(k => k.length > 2 && !k.startsWith('$')));
pg.$disconnect();
