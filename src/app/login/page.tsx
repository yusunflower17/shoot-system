// src/app/login/page.tsx — 登录页（含访客一键登录）
'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (u: string, p: string) => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(e.error || '登录失败'); return; }
      window.location.href = '/';
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); doLogin(username, password); };
  const guestLogin = () => doLogin('guest', 'guest123');

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#0d7a4f" strokeWidth="2.5"/>
            <path d="M12 30 L24 14 L36 30 M14 30 L34 30" stroke="#0d7a4f" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h1>骓特 · 拍摄工作台</h1>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">用户名</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">密码</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="login-divider"><span>或</span></div>

        <button
          onClick={guestLogin}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          访客登录
        </button>
        <p className="login-hint">访客模式 · 仅可提报需求和查阅进度</p>
      </div>
    </div>
  );
}
