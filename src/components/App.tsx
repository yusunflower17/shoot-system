'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardPage, DemandNewPage, MyDemandsPage, ReviewPage, SessionsPage, PlansPage, ModelsPage, ConfigsPage, RecordsPage } from './pages';
import { LayoutDashboard, Plus, ListChecks, Shield, Calendar, Film, Camera, Bike, Settings, History } from 'lucide-react';

// ============ 通用类型 ============
interface User { id: string; username: string; name: string; role: string; dept: string | null; }

// ============ 简单 fetch 封装 ============
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  // 401 由调用方处理（App 初始化时自动访客登录）
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || '请求失败'); }
  return res.json();
}

// ============ Toast ============
function useToast() {
  const [items, setItems] = useState<{ id: number; msg: string; type: string }[]>([]);
  const show = (msg: string, type = 'success') => {
    const id = Date.now() + Math.random();
    setItems(s => [...s, { id, msg, type }]);
    setTimeout(() => setItems(s => s.filter(i => i.id !== id)), 3000);
  };
  const node = <div className="toast-container">{items.map(i => <div key={i.id} className={`toast toast-${i.type}`}>{i.msg}</div>)}</div>;
  return { show, node };
}

// ============ Badge ============
function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: '草稿', pending: '待确认', confirmed: '已确认', scheduled: '已排期',
    shooting: '拍摄中', review: '待验收', done: '已完成', archived: '已归档',
    cancelled: '已取消', revision: '待修改',
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}
function PriorityBadge({ p }: { p: string }) {
  return <span className={`badge badge-${p || 'p2'}`}>{p || 'P2'}</span>;
}
function DirectionBadge({ d }: { d: string }) {
  const cls = d === '国内' ? 'badge-domestic' : d === '海外' || d === '外贸' ? 'badge-overseas' : 'badge-p3';
  return <span className={`badge ${cls}`}>{d}</span>;
}
function TagList({ items }: { items: string[] }) {
  if (!items?.length) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
  return <div className="tag-list">{items.map((t, i) => <span key={i} className="tag">{t}</span>)}</div>;
}

// ============ Modal ============
export function Modal({ open, title, children, footer, onClose }: any) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">{title}</h3><button className="btn-ghost" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
// ============ Drawer ============
export function Drawer({ open, title, children, onClose }: any) {
  if (!open) return null;
  return (
    <><div className="drawer-overlay" onClick={onClose} /><div className="drawer">
      <div className="drawer-header"><h3 className="modal-title">{title}</h3><button className="btn-ghost" onClick={onClose}>✕</button></div>
      <div className="drawer-body">{children}</div>
    </div></>
  );
}

// ============ 路由 Hook ============
function useHashRoute() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? (window.location.hash || '#/dashboard') : '#/dashboard');
  useEffect(() => {
    const h = () => setHash(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return [hash, (h: string) => { window.location.hash = h; }] as const;
}

// ============ 共享常量 ============
const STATUS_LABELS: Record<string, string> = { draft: '草稿', pending: '待确认', confirmed: '已确认', scheduled: '已排期', shooting: '拍摄中', review: '待验收', done: '已完成', archived: '已归档', cancelled: '已取消', revision: '待修改' };
const SHOOT_PURPOSES = ['国内短视频', '抖音', '视频号', '小红书', '快手', 'B站', 'Instagram', 'TikTok', 'Facebook', 'YouTube', '海外客户展示', '产品资料', '电商详情页', '广告投放', '展会/宣传', '其他'];
const SHOOT_CONTENTS = ['整车展示', '外观展示', '细节特写', '配置展示', '骑行实拍', '上车效果', '动态骑行', '产品开箱', '产品安装', '参数讲解', '功能展示', '对比内容', '场景内容', '模特出镜', '主播出镜', '其他'];
const SHOOT_SCENES = ['棚拍', '室内', '城市道路', '山路', '公路', '骑行场景', '商业街', '工厂', '展厅', '其他'];
const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5'];
const VIDEO_DURATIONS = ['15s', '30s', '60s', '长视频', '不限'];
const DIRECTIONS = ['国内', '海外', '外贸', '电商', '品牌', '其他'];

// ============ 主应用 ============
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [hash, setHash] = useHashRoute();
  const { show, node: toastNode } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const u = await api<User>('/api/me');
        setUser(u);
      } catch {
        // 未登录 → 自动访客登录
        try {
          await fetch('/api/auth/guest', { method: 'POST', credentials: 'include' });
          const u = await api<User>('/api/me');
          setUser(u);
        } catch {
          // 彻底失败才跳 login
          window.location.href = '/login';
        }
      }
    })();
  }, []);

  if (!user) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  return (
    <>
      <TopBar user={user} setUser={setUser} showToast={show} onLogout={() => { api('/api/auth/logout', { method: 'POST' }).then(() => window.location.reload()); }} />
      <div className="app-layout">
        <Sidebar hash={hash} setHash={setHash} user={user} />
        <div className="content">
          <PageRouter hash={hash} setHash={setHash} user={user} showToast={show} />
        </div>
      </div>
      {toastNode}
    </>
  );
}

function TopBar({ user, setUser, showToast, onLogout }: any) {
  const roleMap: Record<string, string> = { admin: '管理员', reviewer: '审核负责人', shooter: '拍摄团队', submitter: '业务人员' };
  const [adminModal, setAdminModal] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const doAdminLogin = async () => {
    if (!adminUser || !adminPass) { showToast('请输入账号密码', 'error'); return; }
    setAdminLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json', credentials: 'include' },
        body: JSON.stringify({ username: adminUser, password: adminPass }),
      });
      if (!res.ok) { const e = await res.json(); showToast(e.error || '登录失败', 'error'); return; }
      const u = await res.json();
      setUser(u);
      showToast(`欢迎回来，${u.name}！`, 'success');
      setAdminModal(false); setAdminUser(''); setAdminPass('');
    } catch { showToast('网络错误', 'error'); }
    finally { setAdminLoading(false); }
  };

  return (
    <div className="top-bar">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="brand-dot" style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--brand-500)' }} />
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>骓特 · 拍摄工作台</span>
      </div>
      <div className="top-bar-user">
        {user.username === 'guest' && (
          <span style={{ fontSize: 11, color: 'var(--ink-4)', background: 'var(--bg-soft)', padding: '4px 10px', borderRadius: 12, marginRight: 8 }}>访客模式 · 仅可提报和查阅</span>
        )}
        {user.username === 'guest' && (
          <button className="btn-ghost btn-sm" onClick={() => setAdminModal(true)} style={{ marginRight: 8 }}>管理员登录</button>
        )}
        {user.username !== 'guest' && (
          <button className="btn-ghost btn-sm" onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            await fetch('/api/auth/guest', { method: 'POST', credentials: 'include' });
            const u = await fetch('/api/me', { credentials: 'include' }).then(r => r.json());
            setUser(u);
            showToast('已切换为访客模式', 'info');
          }} style={{ marginRight: 8 }}>切换为访客</button>
        )}
        <div className="user-avatar">{user.name.charAt(0)}</div>
        <span>{user.name}</span>
        <span className="user-role-tag">{roleMap[user.role] || user.role}</span>
        <button className="btn-ghost btn-sm" onClick={onLogout}>退出</button>
      </div>

      {/* 管理员登录 Modal */}
      {adminModal && (
        <div className="modal-overlay" onClick={() => setAdminModal(false)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">管理员登录</h3>
              <button className="btn-ghost" onClick={() => setAdminModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 14 }}>登录后解锁完整拍摄/审核/排期功能</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="input" placeholder="用户名 (admin / wangwu)" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
                <input className="input" type="password" placeholder="密码" value={adminPass} onChange={e => setAdminPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doAdminLogin()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setAdminModal(false)}>取消</button>
              <button className="btn-primary" onClick={doAdminLogin} disabled={adminLoading}>{adminLoading ? '登录中...' : '登录'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ hash, setHash, user }: any) {
  const iconMap: Record<string, any> = {
    dashboard: LayoutDashboard,
    demandNew: Plus,
    myDemands: ListChecks,
    review: Shield,
    plans: Calendar,
    sessions: Film,
    models: Bike,
    configs: Settings,
    records: History,
  };
  const items = [
    { group: '工作台', routes: [{ path: '#/dashboard', label: '工作台', icon: 'dashboard' }] },
    { group: '需求', routes: [
      { path: '#/demand/new', label: '新建需求', icon: 'demandNew' },
      { path: '#/my-demands', label: '我的需求', icon: 'myDemands' },
      { path: '#/review', label: '需求总表', icon: 'review', badge: 'reviewer' },
    ]},
    { group: '拍摄', badge: 'reviewer', routes: [
      { path: '#/plans', label: '拍摄计划', icon: 'plans', badge: 'reviewer' },
      { path: '#/sessions', label: '拍摄场次', icon: 'sessions', badge: 'reviewer' },
    ]},
    { group: '基础数据', routes: [
      { path: '#/models', label: '车型标准库', icon: 'models' },
      { path: '#/configs', label: '配置标准库', icon: 'configs' },
      { path: '#/records', label: '操作记录', icon: 'records' },
    ]},
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bike size={13} color="white" strokeWidth={2.5} />
        </div>
        <span>骓特 · 工作台</span>
      </div>
      {items.filter(g => {
        // 整个 group 有 badge 限制
        if (g.badge === 'reviewer' && ['guest', 'submitter'].includes(user.role)) return false;
        return true;
      }).map(g => {
        const visibleRoutes = g.routes.filter((r: any) => !(r.badge === 'reviewer' && ['guest', 'submitter'].includes(user.role)));
        if (visibleRoutes.length === 0) return null;
        return (
          <div key={g.group} style={{ marginTop: 4 }}>
            <div className="nav-title">{g.group}</div>
            {visibleRoutes.map((r: any) => {
              const Ico = iconMap[r.icon];
              return (
                <div key={r.path} className={`nav-item ${hash === r.path ? 'active' : ''}`} onClick={() => setHash(r.path)}>
                  {Ico && <Ico size={16} strokeWidth={1.8} />}
                  <span>{r.label}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PageRouter({ hash, user, showToast, setHash }: any) {
  const isReviewerOnly = ['#/review', '#/plans', '#/sessions'].includes(hash)
    && ['guest', 'submitter'].includes(user.role);
  if (isReviewerOnly) {
    // 越权访问，打回去
    const target: any = setTimeout(() => setHash('#/dashboard'), 0);
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>您的账号没有此页面的权限</div>
      <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>正在返回工作台...</div>
    </div>;
  }
  switch (hash) {
    case '#/dashboard': return <DashboardPage key={hash} user={user} showToast={showToast} />;
    case '#/demand/new': return <DemandNewPage key={hash} user={user} showToast={showToast} />;
    case '#/my-demands': return <MyDemandsPage key={hash} user={user} showToast={showToast} />;
    case '#/review': return <ReviewPage key={hash} user={user} showToast={showToast} />;
    case '#/sessions': return <SessionsPage key={hash} user={user} showToast={showToast} />;
    case '#/plans': return <PlansPage key={hash} user={user} showToast={showToast} />;
    case '#/models': return <ModelsPage key={hash} user={user} showToast={showToast} />;
    case '#/configs': return <ConfigsPage key={hash} user={user} showToast={showToast} />;
    case '#/records': return <RecordsPage key={hash} user={user} showToast={showToast} />;
    default: return <DashboardPage key="dashboard" user={user} showToast={showToast} />;
  }
}

// 下面是所有页面组件
