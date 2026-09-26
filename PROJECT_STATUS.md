# PROJECT_STATUS.md — TWITTER 骓特自行车拍摄管理系统

> 最后更新：2026-09-23

---

## 当前阶段：**正式部署完成 · 等待验收**

---

## 🚀 生产部署

| 项目 | 值 |
|------|-----|
| **永久公开链接** | `https://chimerical-gumdrop-753da5.netlify.app` |
| **部署平台** | Netlify（免费版） |
| **数据库** | Neon Postgres (serverless, 已 735+ 条历史数据) |
| **Node Runtime** | Netlify Functions (Linux) |
| **Next.js 版本** | 15.5.26 |
| **Prisma 版本** | 6.19.3 (engineType=client + Neon HTTP adapter) |

---

## 👤 账号（Neon 生产库）

| 角色 | 用户名 | 密码 | 备注 |
|------|--------|------|------|
| **访客** | 自动 / guest | — | 打开自动登录 |
| **管理员** | admin | admin123 | 顶栏 → 管理员登录 |
| **审核员** | wangwu | 123456 | — |
| **业务员** | zhaoliu/qianqi/sunba/zhoujiu | 123456 | — |

---

## ✅ 已完成功能

### 核心业务
- [x] 访客自动登录（打开直接进工作台，无需登录页）
- [x] 管理员 Modal 登录（顶栏按钮 → inline 输账号密码切换）
- [x] 拍摄需求提交（Create）
- [x] 拍摄需求列表（Read + 筛选：状态/方向/关键词）
- [x] 拍摄需求详情
- [x] 需求状态管理（draft → pending → confirmed → ... → done）
- [x] 需求历史记录（DemandHistory）
- [x] 车型标准库（70+ 车型 Model + ModelVersion）
- [x] 配置标准库（Config）
- [x] Dashboard（stats + 今日/本周排期 + 月历）

### 权限体系
- [x] Role: admin / reviewer / shooter / submitter / guest
- [x] Sidebar 按角色过滤菜单
- [x] 拍摄计划/场次按钮只对 admin/reviewer 显示

### 部署架构
- [x] Netlify 永久公开链接（国内无需 VPN）
- [x] Neon Postgres 生产数据库
- [x] JWT Cookie 会话（30 天有效期）
- [x] 编号自动生成（REQ/DEMAND/TASK + 日期 + 随机后缀）

---

## 🔴 已知待改进（按优先级）

### P0 — 建议尽快做
- [ ] **后端重复校验**：提交需求前检查是否有完全相同或高度相似的需求（软重复 + 硬重复）
- [ ] **API 层 try-catch + 详细错误码**：当前 API 裸奔，Next.js 默认 500 不返回错误体
- [ ] **状态机严格校验**：Status Flow（auth.ts 有定义但 API 没用）
- [ ] **操作记录自动写入**：Record model 有定义但各 API 没自动写

### P1 — 中期优化
- [ ] **幂等提交保护**：前端点击两次产生两条相同需求
- [ ] **Draft 草稿保存**：提交失败保留草稿
- [ ] **需求 Update/Delete API**：目前只有 Create 和 Read
- [ ] **拍摄场次 CRUD**：Session model 有定义但 API 不完整
- [ ] **拍摄任务 CRUD**：Task model 有定义但 API 不完整

### P2 — 长期
- [ ] **图片/素材上传**：当前无文件存储
- [ ] **消息通知**：需求创建/审核通知
- [ ] **软删除**：代替物理删除
- [ ] **数据导出 Excel**

---

## 🏗️ 技术栈

```
前端:  Next.js 15 (App Router) + React + 原生 CSS + Day.js
后端:  Next.js Route Handlers (Node.js Runtime)
ORM:   Prisma 6 (engineType=client + @prisma/adapter-neon HTTP)
数据库: Neon Postgres (serverless pooler)
认证:  JWT + httpOnly Cookie (jsonwebtoken)
部署:  Netlify (Next.js 官方 adapter 自动适配)
```

---

## 📁 项目结构

```
shoot-system/
├── prisma/
│   ├── schema.prisma          ← Postgres + engineType=client (生产用)
│   └── [其他 ts 调试脚本]
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/guest/route.ts      ← 访客一键登录
│   │   │   ├── auth/login/route.ts      ← 管理员登录
│   │   │   ├── demands/route.ts         ← 需求 CRUD（Create/Read）
│   │   │   ├── dashboard/route.ts       ← Dashboard 数据
│   │   │   ├── models/route.ts          ← 车型库
│   │   │   └── ...                      ← 其他 API
│   │   ├── login/page.tsx               ← 登录页（目前被 App.tsx 跳过）
│   │   ├── page.tsx                     ← 首页（重定向到 App.tsx）
│   │   └── layout.tsx
│   ├── components/
│   │   ├── App.tsx                      ← 主应用（访客自动登录 + 顶栏 Modal）
│   │   └── pages.tsx                    ← 所有子页面
│   ├── lib/
│   │   ├── prisma.ts                    ← Prisma 客户端初始化
│   │   └── auth.ts                      ← JWT + Cookie + 工具函数
│   └── generated/prisma-client/         ← Prisma Client 输出
├── netlify.toml             ← Netlify 构建配置
├── package.json
└── next.config.ts
```

---

## 📊 数据库模型

| 模型 | 用途 | 关键字段 |
|------|------|----------|
| User | 用户 | username(unique), role |
| Model | 车型标准库 | code(unique), 70+ 条 |
| ModelVersion | 车型版本 | modelId → Model |
| Config | 配置标准库 | code(unique), type |
| ModelApp / ConfigApp | 车型/配置新增申请 | status: pending/approved/rejected |
| **Demand** | **拍摄需求（核心）** | **no(unique), status, priority** |
| DemandHistory | 需求变更历史 | demandId → Demand |
| Session | 拍摄场次 | no(unique), date, shooterId |
| Task | 拍摄任务 | no(unique), sessionId, demandId |
| Record | 全局操作记录 | user, action, targetType |

---

## 🔗 状态机

```
Demand.status:
  draft → pending → confirmed → scheduled → shooting → review → done → archived
                ↓           ↓                               ↓
              revision   cancelled                       revision
```

### 当前实现状态
- ✅ 数据库 status 字段有 default 值
- ✅ STATUS_FLOW 定义在 auth.ts
- ❌ API 层没严格校验（可随意跳状态）
- ❌ 状态变更没自动写 DemandHistory

---

## 🔧 构建配置

### netlify.toml
```toml
[build]
  command = "npx prisma generate --schema=prisma/schema.prisma && npm run build"
  publish = ".next"
```

### package.json build
```json
"build": "npx prisma generate --schema=prisma/schema.prisma && next build --no-lint"
```

### Netlify 环境变量
```
DATABASE_URL = postgresql://neondb_owner:npg_8AnVIGPH1jOu@ep-crimson-art-b59gdsro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET   = tw-bike-shoot-system-secret-2026-prod
```

---

## 🐛 踩过的坑（不要重蹈覆辙）

| 问题 | 根因 | 解决 |
|------|------|------|
| EdgeOne 401 强制 token | 中国大陆项目合规要求 | 换 Netlify |
| Vercel `.vercel.app` 被墙 | 公司网络策略 | 换 Netlify |
| PowerShell curl.exe 丢双引号 | Windows curl.exe 引号处理 | 用 `--%` 停止 PS 解析 |
| `PrismaNeonHttp(dbUrl)` 报错 Expected 2 args | @prisma/adapter-neon v2 API 变了 | `PrismaNeonHttp(dbUrl, undefined)` |
| Next.js TypeScript 编译 prisma/ 下的 ts | prisma 目录不是 Next.js 编译目标 | 测试文件删或放 src 外 |
| EPERM 不能 rename DLL | dev server 占用 native engine 文件 | 关掉 dev server 再 generate |
| Native engine 在 Netlify Linux 上不能用 | Windows DLL vs Linux .so | 必须用 `engineType=client` |

---

## 🎯 下一步任务

按优先级排序的 TODO：

1. **P0 — API 层加 try-catch + 错误处理**（当前裸奔）
2. **P0 — 后端重复校验**（软重复提示 + 硬重复拦截）
3. **P0 — 状态机校验 + 自动写 History**
4. **P1 — Demand Update/Delete API** + 前端入口
5. **P1 — Session/Task 完整 CRUD**
6. **P1 — 幂等提交保护**
7. **P2 — 图片上传 + 对象存储**

---

## 🔒 数据安全声明

- ❌ **禁止** DROP TABLE / TRUNCATE / DELETE 全表
- ❌ **禁止** 覆盖已有数据的 Migration
- ✅ **必须** ALTER TABLE ADD COLUMN（保留旧数据）
- ✅ **必须** 新字段 DEFAULT 值
- ✅ **必须** 任何 Migration 前备份

---

## 🧪 测试清单

### 已验证（2026-09-23）
- ✅ 访客自动登录
- ✅ 管理员 Modal 登录
- ✅ Demand Create（HTTP 201 + 数据持久化）
- ✅ Demand List（历史数据保留）
- ✅ Demand History 自动写入
- ✅ Dashboard stats 正确
- ✅ Model 列表（70+ 车型）
- ✅ Config 列表
- ✅ JWT Cookie 会话持久化

### 待验证
- ❌ 需求 Update API（需先实现）
- ❌ 需求 Delete API（需先实现）
- ❌ Session/Task CRUD
- ❌ 重复提交保护
- ❌ 并发提交

---

## 📝 修改日志

| 日期 | 事件 |
|------|------|
| 2026-09-23 | Netlify 正式部署上线 ✅ |
| 2026-09-23 | 修复 PrismaNeonHttp 2 参数签名问题 |
| 2026-09-23 | 修复 prisma/test-create.ts 被 Next.js 编译问题 |
| 2026-09-23 | 修复 powershell curl.exe 双引号丢失（测试工具问题） |
| 2026-09-23 | EdgeOne 401 token 问题 → 换 Netlify |
| 2026-09-23 | Vercel `.vercel.app` 被墙 |
| 2026-09-23 | 访客自动登录 + TopBar Modal 管理员登录 |
| 2026-09-23 | Neon Postgres 迁移完成（735+ 条数据） |
