// src/lib/notify.ts — 飞书/钉钉 webhook 通知
// 在 .env.local 或 Netlify 环境变量里配置即可自动启用：
//   FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx
//   DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxxxx
// 可选：NOTIFY_ENABLED=false 来临时关闭
// 使用：notifyDemandCreated(demand)  notifyDemandApproved(demand, reviewer)  notifyStatusChange(demand, from, to, user)

type DemandSummary = {
  no: string;
  title: string;
  modelName?: string | null;
  versionName?: string | null;
  direction?: string | null;
  status?: string;
  priority?: string;
  urgency?: string | null;
  purpose?: string | null;
  submitterName?: string | null;
  expectStart?: string | null;
  expectEnd?: string | null;
  description?: string | null;
};

const enabled = (process.env.NOTIFY_ENABLED ?? 'true') === 'true';
const feishuUrl = process.env.FEISHU_WEBHOOK || '';
const dingtalkUrl = process.env.DINGTALK_WEBHOOK || '';

function fmtStatus(s?: string) {
  const map: any = { draft: '📝 草稿', pending: '⏳ 待确认', confirmed: '✅ 已确认', scheduled: '📅 已排期', shooting: '🎬 拍摄中', review: '🔍 待验收', done: '🎉 已完成', cancelled: '❌ 已取消', revision: '✏️ 待修改', archived: '📦 已归档' };
  return map[s || ''] || s || '';
}

function buildDemandMarkdown(d: DemandSummary) {
  return [
    `**${d.title}** \`${d.no}\``,
    `> 车型: ${d.modelName || '-'} ${d.versionName ? '| ' + d.versionName : ''}`,
    `> 方向: ${d.direction || '-'} · 优先级: ${d.priority || '-'} · 紧急度: ${d.urgency || '-'}`,
    `> 用途: ${d.purpose || '-'}`,
    `> 提报: ${d.submitterName || '-'}`,
    d.expectStart || d.expectEnd ? `> 时间: ${d.expectStart || '-'} → ${d.expectEnd || '-'}` : null,
    d.description ? `> 说明: ${d.description?.substring(0, 100)}` : null,
  ].filter(Boolean).join('\n');
}

function buildFeishuCard(title: string, content: string, color = 'blue') {
  return {
    msg_type: 'interactive',
    card: {
      header: { title: { tag: 'plain_text', content: title }, template: color },
      elements: [
        { tag: 'markdown', content },
        { tag: 'action', actions: [{ tag: 'button', text: { tag: 'plain_text', content: '查看详情' }, type: 'primary', url: 'https://chimerical-gumdrop-753da5.netlify.app' }] },
      ],
    },
  };
}

async function postFeishu(payload: any) {
  if (!feishuUrl) return;
  try {
    await fetch(feishuUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e: any) { console.warn('[notify] feishu failed:', e?.message); }
}

async function postDingtalk(text: string, title = '骓特拍摄系统') {
  if (!dingtalkUrl) return;
  try {
    await fetch(dingtalkUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msgtype: 'markdown', markdown: { title, text } }) });
  } catch (e: any) { console.warn('[notify] dingtalk failed:', e?.message); }
}

async function broadcast(title: string, markdownContent: string, feishuColor = 'blue') {
  if (!enabled) return;
  await Promise.all([
    feishuUrl ? postFeishu(buildFeishuCard(title, markdownContent, feishuColor)) : Promise.resolve(),
    dingtalkUrl ? postDingtalk(markdownContent, title) : Promise.resolve(),
  ]);
}

// ========== 事件入口 ==========

export async function notifyDemandCreated(d: DemandSummary) {
  await broadcast(
    '📥 新需求提交',
    buildDemandMarkdown(d),
    'blue',
  );
}

export async function notifyDemandApproved(d: DemandSummary, reviewer?: string) {
  const md = buildDemandMarkdown(d);
  await broadcast(
    '✅ 需求已确认',
    `${md}\n\n> 审核: ${reviewer || '-'} → 状态: ${fmtStatus(d.status)}`,
    'green',
  );
}

export async function notifyStatusChange(d: DemandSummary, from: string, to: string, user?: string) {
  const md = buildDemandMarkdown(d);
  const color = to === 'done' ? 'green' : to === 'cancelled' ? 'red' : to === 'review' ? 'orange' : 'blue';
  await broadcast(
    `🔄 状态变更`,
    `${md}\n\n> **${fmtStatus(from)} → ${fmtStatus(to)}**\n> 操作人: ${user || '-'}`,
    color,
  );
}

export async function notifyDemandCancelled(d: DemandSummary, user?: string, reason?: string) {
  await broadcast(
    '❌ 需求已取消',
    `${buildDemandMarkdown(d)}\n\n> 操作人: ${user || '-'}\n${reason ? `> 原因: ${reason}` : ''}`,
    'red',
  );
}

export function isNotifyEnabled() {
  return enabled && (!!feishuUrl || !!dingtalkUrl);
}
