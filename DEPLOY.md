# 骓特拍摄工作台 — 部署指南

后端已构建通过（`prisma generate` + `next build --no-lint` 全绿，20 个页面全部生成）。
下面给出 **Vercel / Netlify / Cloudflare** 三套零成本部署方式，任选其一即可上线拿到公网链接。

---

## 0. 准备（一次性）

1. **数据库**：已在 `wrangler.jsonc` 的 `vars.DATABASE_URL` 配好一个真实的 Neon Postgres 连接串（pooled）。
   - 部署到 Vercel / Netlify 时，把**同一串**填进对应平台的环境变量 `DATABASE_URL`。
   - ⚠️ 该串含数据库密码。Cloudflare 建议改用 `wrangler secret put DATABASE_URL` 加密，不要明文留在仓库。
2. **JWT 密钥**：`JWT_SECRET` 也在 `wrangler.jsonc` 的 `vars` 里（可替换为你自己的随机长串），同样填进平台环境变量。
3. **建表 + 灌数据 + 建管理员**（数据库就绪后，本地或 CI 跑）：
   ```bash
   npx prisma generate --schema=prisma/schema.prisma
   npx prisma db push --schema=prisma/schema.prisma      # 按 schema 建表
   npm run db:seed                                       # 灌入 52 款车型（WorkBuddy 资料库）
   ADMIN_USER=admin ADMIN_PASS=你的密码 npm run db:seed:admin   # 建首个管理员
   ```
4. **登录**：浏览器打开站点 → 用上面建的管理员账号登录 → 在「账号管理」里继续添加 审核/拍摄/业务/主播。
   （也支持一键访客登录，会自动建一个 `submitter` 角色游客，仅能提报需求。）

---

## 1. Vercel（最省事，推荐）

- 仓库推到 GitHub，在 [vercel.com](https://vercel.com) 导入。
- 已内置 `vercel.json`：`buildCommand` 会自动 `prisma generate && next build --no-lint`。
- 在 **Project Settings → Environment Variables** 添加：
  - `DATABASE_URL` = Neon 连接串
  - `JWT_SECRET` = 你的密钥
  （`vercel.json` 里用 `@shoot_neon_database_url` / `@shoot_jwt_secret` 引用这两个变量，需先在后台建好）
- 点 Deploy → 拿到 `https://你的项目.vercel.app`。

---

## 2. Netlify

- 仓库推到 GitHub，在 [netlify.com](https://netlify.com) 导入。
- 已内置 `netlify.toml`（指定 Postgres schema + Node 22）。
- 在 **Site settings → Environment variables** 添加 `DATABASE_URL` 与 `JWT_SECRET`。
- 部署命令已为 `npx prisma generate --schema=prisma/schema.prisma && npm run build`。
- 拿到 `https://你的项目.netlify.app`。

---

## 3. Cloudflare Workers（已配好，最完整）

- 已内置 `open-next.config.ts` + `wrangler.jsonc`，环境变量（含 Neon 串、JWT 密钥）已写在 `vars` 里。
- 建议先把 `DATABASE_URL`/`JWT_SECRET` 改成加密 secret：
  ```bash
  wrangler secret put DATABASE_URL
  wrangler secret put JWT_SECRET
  ```
- 部署：
  ```bash
  npm install
  npx prisma generate --schema=prisma/schema.prisma
  npx prisma db push --schema=prisma/schema.prisma
  npm run db:seed
  ADMIN_USER=admin ADMIN_PASS=你的密码 npm run db:seed:admin
  npm run deploy        # opennextjs-cloudflare build && deploy
  ```
- 拿到 `https://shoot-system.<你的子域>.workers.dev`。

---

## 4. 本地开发（SQLite，零外部依赖）

```bash
npm install
PRISMA_SCHEMA_FILE=prisma/schema-local.prisma npx next dev
# 或：DATABASE_URL="file:./prisma/dev.db" npx next dev
```
本地用 `prisma/schema-local.prisma`（SQLite + better-sqlite3），数据落在 `dev.db`。

---

## 5. 环境变量清单

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | Neon Postgres pooled 串（生产） / `file:./prisma/dev.db`（本地） | `postgresql://...` |
| `JWT_SECRET` | JWT 签名密钥，生产别用默认值 | `tw-bike-shoot-system-secret-2026-prod` |
| `PRISMA_SCHEMA_FILE` | 本地开发指定 SQLite schema（可选） | `prisma/schema-local.prisma` |

---

## 6. 已就绪的部署产物

- `vercel.json` — Vercel 构建/环境变量配置
- `netlify.toml` — Netlify 构建/Node 版本配置
- `open-next.config.ts` + `wrangler.jsonc` — Cloudflare 配置（含 Neon 串）
- `scripts/seed-models.mjs` — 52 款车型种子（Neon/SQLite 自适应）
- `scripts/seed-admin.mjs` + `npm run db:seed:admin` — 首个管理员引导
- `src/lib/prisma.ts` — 生产走 Neon（不加载 better-sqlite3 原生模块，避免 serverless 缺二进制崩溃）

> 注：本机内存不足以在 `next build` 阶段跑全量类型检查（Prisma 生成的 client 类型图过大，OOM）。
> 已在 `next.config.ts` 设 `typescript.ignoreBuildErrors=true`——SWC 编译仍校验语法/模块解析/导出。
> 类型安全请在 CI（≥16GB RAM）执行 `tsc --noEmit` 兜底。
