# 骓特自行车拍摄工作台 — 项目现状压缩包

## ✅ 现在能做的事

### 本地开发（立刻能用）
```
cd "d:\trae\国内外提交表单\shoot-system"
npx prisma generate --schema=prisma/schema-local.prisma
npx next dev -H 0.0.0.0 -p 3000
# 打开 http://localhost:3000
# 同 WiFi 同事打开 http://192.168.1.198:3000
```

### 账号（SQLite 本地数据库）
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 访客 | （点登录页「访客登录」按钮） | — |
| 管理员 | admin | admin123 |
| 审核员 | wangwu | 123456 |
| 业务员 | zhaoliu / qianqi / sunba / zhoujiu | 123456 |

---

## 🔧 已修复的 Bug

### 1. 访客登录点了没反应 ✅
**根因**：`src/app/api/auth/login/route.ts` 里 `cookies().set()` 是 Next.js headers API（存到请求上下文），不自动带到 `NextResponse.json()` 上。浏览器收不到 Set-Cookie 头，session 存不下来。

**修复**：改用 `response.cookies.set()` 直接在 Response 对象上设 cookie。同时 logout route 也修了。

**改动文件**：
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/login/page.tsx`（fetch 加 credentials: 'include'）

### 2. `.env` 被改成 Neon URL 导致本地 500 ✅
**根因**：之前为了推 Vercel 临时把 `.env` 改成了 Neon Postgres URL，Prisma schema 是 SQLite，adapter 不匹配崩了。

**修复**：`.env` 改回 `file:./prisma/dev.db`。Vercel/Cloudflare 部署时**不要**提交 `.env`，在 Vercel UI 的 Environment Variables 里配。

### 3. 权限隔离 ✅
- Sidebar 菜单按角色过滤（guest/submitter 看不到"拍摄/审核"分组）
- PageRouter URL hash 守卫（越权跳回 Dashboard）
- 拍摄计划/场次创建按钮只对 admin/reviewer 显示

### 4. Dashboard 月历 ✅
- 保留原 stats + 今日/本周列表
- 底部新增月历（管理员点日期跳排期，访客只读）

### 5. Prisma schema 双版本 ✅
- `prisma/schema-local.prisma` → SQLite（本地）
- `prisma/schema.prisma` → Postgres + engineType="client"（Vercel/Cloudflare）

---

## 🚀 永久部署（Vercel）

### 前置条件
1. GitHub 仓库：`https://github.com/yusunflower17/shoot-system`
2. Neon Postgres：已建表 + seed 7 用户（可用了）
3. Vercel：你已登录

### 部署步骤（最简单）
1. 打开 Vercel → 点 **Add New Project** → Import `yusunflower17/shoot-system`
2. Framework 自动识别 Next.js，**不改任何构建设置**
3. Environment Variables 加两个：
   ```
   DATABASE_URL = postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET   = tw-bike-shoot-system-secret-2026-prod
   ```
4. 点 Deploy → 等 2-3 分钟 → 拿到 `xxx.vercel.app` 链接

### Prisma 在 Vercel 上的处理
`prisma.ts` 已自动适配：
- NODE_ENV=production + DATABASE_URL 含 neon/pooler → 用 `@prisma/adapter-neon`
- 本地 + file: URL → 用 `@prisma/adapter-better-sqlite3`

Vercel 会自动运行 `prisma generate`，Prisma migrate/deploy 不需要（我们用 db push 建表）。

---

## 📁 项目结构
```
shoot-system/
├── prisma/
│   ├── schema.prisma        # Postgres 生产 schema
│   ├── schema-local.prisma  # SQLite 本地 schema
│   ├── dev.db               # 本地数据库文件
│   └── neon-init.ts         # 之前跑过的 Neon 建表脚本（可删）
├── src/
│   ├── app/
│   │   ├── login/page.tsx   # 登录页（含访客一键登录）
│   │   ├── api/auth/        # 认证 API（login/logout/me）
│   │   ├── api/dashboard/   # Dashboard API
│   │   └── ...              # 其他 API 路由
│   ├── components/          # App.tsx + pages.tsx（所有页面）
│   ├── lib/
│   │   ├── prisma.ts        # 动态 adapter（SQLite 本地 / Neon 生产）
│   │   └── auth.ts          # JWT + Cookie 工具
│   └── generated/prisma-client/  # Prisma Client 输出目录
├── package.json
├── next.config.ts
├── .env                     # 本地 SQLite（不要 commit 给 Vercel）
└── .env.example             # 示例（已 commit）
```

---

## ⚠️ 注意事项
1. **不要把 `.env` 推到 GitHub**——`.gitignore` 里应该有它。Vercel 用自己的 Environment Variables。
2. **Cloudflare Pages/Workers 在 Windows 中文路径下有 bug**（EPERM + Turbopack 不认 Junction），跳过这条路线，用 Vercel 最简单。
3. **cloudflared tunnel 依赖你电脑开着且公司网络不挡 UDP 7844/TCP 7844**，容易断，不建议长期用。
4. **本地 SQLite 和 Neon 是两个独立数据库**——本地改的数据不会同步到 Vercel/Neon，反之亦然。

---

## 🎯 下一步建议
1. **立刻重启 dev server**（我刚帮你 kill 了所有 node 进程）
2. **本地验证访客登录能用** → 让同事先试内网
3. **Vercel 点 Redeploy** → 出永久链接
4. 永久链接出来后，后续改代码 push GitHub，Vercel 自动部署
