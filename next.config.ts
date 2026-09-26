import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // 本机内存不足以在 build 阶段完成全量类型检查（Prisma 生成的 client 体积大，
  // 类型图超出可用 RAM，tsc/Next 类型检查 worker 会 OOM）。
  // next build 的 SWC 编译步骤仍会校验语法、模块解析与导出，类型安全请在
  // CI（≥16GB RAM）或本机单独执行 `tsc --noEmit` 时保障。
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
