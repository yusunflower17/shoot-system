// src/app/layout.tsx — Next.js 根布局
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '骓特自行车拍摄需求管理系统',
  description: '车型拍摄需求 → 审核确认 → 排期 → 拍摄执行 → 素材交付 完整闭环',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
