'use client';
import { useState, useEffect } from 'react';
import { Search, X as XIcon, Check } from 'lucide-react';
import { Modal, Drawer } from './App';

// 共享类型和导入（从 App.tsx 导出或内联）
type User = { id: string; username: string; name: string; role: string; dept: string | null; };

// 这些是从 App.tsx 引入的——为避免循环依赖，直接内联公共组件
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (res.status === 401) { window.location.href = '/login'; throw new Error('未登录'); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || '请求失败'); }
  return res.json();
}
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { draft: '草稿', pending: '待确认', confirmed: '已确认', scheduled: '已排期', shooting: '拍摄中', review: '待验收', done: '已完成', archived: '已归档', cancelled: '已取消', revision: '待修改' };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}
export function PriorityBadge({ p }: { p: string }) { return <span className={`badge badge-${p || 'p2'}`}>{p || 'P2'}</span>; }
export function DirectionBadge({ d }: { d: string }) { const cls = d === '国内' ? 'badge-domestic' : d === '海外' || d === '外贸' ? 'badge-overseas' : 'badge-p3'; return <span className={`badge ${cls}`}>{d}</span>; }
export function TagList({ items }: { items: string[] | null | undefined }) { if (!items?.length) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>; return <div className="tag-list">{items.map((t, i) => <span key={i} className="tag">{t}</span>)}</div>; }

export const SHOOT_PURPOSES = ['国内短视频', '抖音', '视频号', '小红书', '快手', 'B站', 'Instagram', 'TikTok', 'Facebook', 'YouTube', '海外客户展示', '产品资料', '电商详情页', '广告投放', '展会/宣传', '其他'];
export const SHOOT_CONTENTS = ['整车展示', '外观展示', '细节特写', '配置展示', '骑行实拍', '上车效果', '动态骑行', '产品开箱', '产品安装', '参数讲解', '功能展示', '对比内容', '场景内容', '模特出镜', '主播出镜', '其他'];
export const SHOOT_SCENES = ['棚拍', '室内', '城市道路', '山路', '公路', '骑行场景', '商业街', '工厂', '展厅', '其他'];
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5'];
export const VIDEO_DURATIONS = ['15s', '30s', '60s', '长视频', '不限'];
export const DIRECTIONS = ['国内', '海外', '外贸', '电商', '品牌', '其他'];
export const STATUS_LABELS: Record<string, string> = { draft: '草稿', pending: '待确认', confirmed: '已确认', scheduled: '已排期', shooting: '拍摄中', review: '待验收', done: '已完成', archived: '已归档', cancelled: '已取消', revision: '待修改' };

// ============ Dashboard ============
export function DashboardPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  useEffect(() => {
    api('/api/dashboard').then(setData);
    api('/api/sessions').catch(() => []).then(setAllSessions);
  }, []);
  if (!data) return <div className="empty-state"><p>加载中...</p></div>;
  const s = data.stats;
  const today = new Date();
  const dateSubtitle = `${today.getMonth() + 1} 月 ${today.getDate()} 日 · ${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][today.getDay()]}`;
  const isStaff = ['admin', 'reviewer'].includes(user.role);

  // --- 月历 ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const fd = new Date(year, month, 1);
  const ld = new Date(year, month + 1, 0);
  const startWeekday = fd.getDay();
  const daysInMonth = ld.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const sessionsByDate = allSessions.reduce((acc: any, ses: any) => {
    if (!ses.date) return acc;
    (acc[ses.date] = acc[ses.date] || []).push(ses);
    return acc;
  }, {});

  const summaries = [
    { val: s.pending, label: '待确认' },
    { val: s.confirmed, label: '已确认' },
    { val: s.scheduled, label: '已排期' },
    { val: s.shooting, label: '拍摄中', hi: true },
    { val: s.review, label: '待验收' },
    { val: s.done, label: '本月已完成' },
  ];

  const handleCalCellClick = (dateStr: string, daySessions: any[]) => {
    if (!isStaff) { showToast('仅管理员/审核员可排期', 'warning'); return; }
    if (daySessions.length > 0) {
      // 有 session → 跳到 PlansPage 查看
      window.location.hash = '#/plans';
    } else {
      // 空日期 → 跳到 PlansPage，该日期会被选中
      window.location.hash = `#/plans?date=${dateStr}`;
    }
  };

  return (
    <>
      <div>
        <h1 className="page-title">工作台</h1>
        <p className="page-subtitle">{dateSubtitle} · {user.name}</p>
      </div>

      <div className="dash-summary">
        {summaries.map((c, i) => (
          <div key={i} className={`dash-stat ${c.hi ? 'hi' : ''}`}>
            <span className="num">{String(c.val).padStart(2, '0')}</span>
            <span className="lbl">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="section-block">
        <div className="section-head">今日拍摄</div>
        {data.todaySessions.length === 0 ? (
          <div className="empty-state"><h3>今日无拍摄安排</h3><p>可以先去新建需求或创建拍摄场次</p></div>
        ) : (
          <div className="today-list">
            {data.todaySessions.map((s: any) => (
              <div key={s.id} className="today-item">
                <div className="today-time">{s.startTime || '--:--'}</div>
                <div className="today-info">
                  <div className="title">{s.title} <StatusBadge status={s.status} /></div>
                  <div className="meta">{s.location || ''} · 拍摄人员 {s.shooterName || '待定'} · {(s._count?.tasks || 0)} 个任务</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-block">
        <div className="section-head">本周拍摄计划</div>
        {data.weekSessions.length === 0 ? (
          <div className="empty-state"><h3>本周暂无安排</h3><p>确认需求后会自动排入日程</p></div>
        ) : (
          <div className="week-list">
            {[...data.weekSessions].sort((a, b) => a.date.localeCompare(b.date)).map((s: any) => {
              const d = new Date(s.date);
              return (
                <div key={s.id} className="week-item">
                  <div className="today-time">{d.getMonth()+1}/{d.getDate()}</div>
                  <div className="today-info">
                    <div className="title">{s.title} <StatusBadge status={s.status} /></div>
                    <div className="meta">{s.startTime || '--:--'} · 拍摄人员 {s.shooterName || '待定'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === 拍摄日历（月历）=== */}
      <div className="section-block">
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>拍摄日历 · {year}年 {month + 1}月</span>
          <div className="calendar-nav">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))}>上月</button>
            <button onClick={() => setCurrentMonth(new Date())} className={month === new Date().getMonth() && year === new Date().getFullYear() ? 'active' : ''}>今天</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))}>下月</button>
            {isStaff && <button onClick={() => { window.location.hash = '#/plans'; }} style={{ borderLeft: 'none' }}>排期 →</button>}
          </div>
        </div>
        <div className="calendar-grid">
          {['日', '一', '二', '三', '四', '五', '六'].map(w => <div key={w} className="calendar-day-header">{w}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="calendar-cell empty" />;
            const dateStrVal = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daySessions = sessionsByDate[dateStrVal] || [];
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
            return (
              <div key={i}
                className={`calendar-cell ${isToday ? 'today' : ''} ${isStaff ? '' : 'no-click'}`}
                onClick={() => isStaff && handleCalCellClick(dateStrVal, daySessions)}
                style={!isStaff ? { cursor: 'default' } : undefined}
              >
                <div className="calendar-date">{d}</div>
                <div className="calendar-events">
                  {daySessions.slice(0, 3).map((ses: any) => (
                    <div key={ses.id} className={`calendar-event event-${ses.status}`}
                      title={`${ses.startTime || ''} ${ses.title}${ses.shooterName ? ' · ' + ses.shooterName : ''}`}>
                      <span>{ses.startTime || ''} {ses.title}</span>
                    </div>
                  ))}
                  {daySessions.length > 3 && <div className="calendar-more">+{daySessions.length - 3} 更多</div>}
                  {daySessions.length === 0 && isStaff && (
                    <div style={{ fontSize: 11, color: 'var(--ink-5)', padding: '2px 4px' }}>+ 排期</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============ 新建需求 ============
export function DemandNewPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedVerName, setSelectedVerName] = useState('');
  const [modelTypeFilter, setModelTypeFilter] = useState('全部');
  const [modelSearch, setModelSearch] = useState('');
  const [purposes, setPurposes] = useState<string[]>([]);
  const [contents, setContents] = useState<string[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [aspectRatios, setAspectRatios] = useState<string[]>([]);
  const [videoDurations, setVideoDurations] = useState<string[]>([]);
  const [form, setForm] = useState({
    direction: '国内', expectStart: '', expectEnd: '',
    urgency: '普通', needPerson: '不需要', description: '',
    submitterName: user.name === '访客提报' ? '' : '', submitterDept: '',
  });
  const isGuest = user.name === '访客提报';
  const [activeStep, setActiveStep] = useState(0);

  // 每步完成条件
  const canAdvance = (n: number): boolean => {
    switch (n) {
      case 0: return !!selectedModel && !!selectedVersion;
      case 1: return form.direction !== '' && purposes.length > 0;
      case 2: return contents.length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return !!form.expectStart && !!form.expectEnd;
      default: return true;
    }
  };
  const stepTitles = [
    '选择产品',
    '业务方向',
    '拍摄内容',
    '场景与人物',
    '素材规格',
    '时间与优先级',
    '确认需求',
  ];

  useEffect(() => { api('/api/models').then(setModels); }, []);
  const currentModel = models.find(m => m.id === selectedModel);
  const versions = currentModel?.versions || [];
  const currentVer = versions.find(v => v.id === selectedVersion);

  const MODEL_TYPES = ['全部', '公路车', '砾石车', '山地车', '电助力'];
  const filteredModels = models
    .filter(m => modelTypeFilter === '全部' ? true : m.type === modelTypeFilter)
    .filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.code.toLowerCase().includes(modelSearch.toLowerCase()) || m.series.toLowerCase().includes(modelSearch.toLowerCase()));
  const groupedModels = filteredModels.reduce((acc: any, m: any) => {
    (acc[m.series] = acc[m.series] || []).push(m);
    return acc;
  }, {});

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const submit = async (status: 'draft' | 'pending') => {
    const missing: string[] = [];
    if (!form.direction) missing.push('业务方向');
    if (!selectedModel) missing.push('车型');
    if (!selectedVersion) missing.push('版本');
    if (purposes.length === 0) missing.push('拍摄用途');
    if (contents.length === 0) missing.push('拍摄内容');
    if (!form.expectStart) missing.push('期望开始日期');
    if (!form.expectEnd) missing.push('期望完成日期');
    if (!form.description) missing.push('需求说明');
    if (isGuest && !form.submitterName) missing.push('你的姓名');
    if (missing.length > 0) { showToast(`还缺少：${missing.join('、')}`, 'warning'); return; }

    try {
      await api('/api/demands', {
        method: 'POST',
        body: JSON.stringify({
          title: `${currentModel?.name}｜${currentVer?.name}｜${purposes[0]}`,
          direction: form.direction, purpose: purposes, content: contents, scenes,
          modelId: selectedModel, modelName: currentModel?.name,
          versionId: selectedVersion, versionName: currentVer?.name,
          components: currentVer ? { wheelset: currentVer.wheelset, groupset: currentVer.groupset, brake: currentVer.brake, frame: currentVer.frame, handlebar: currentVer.handlebar, color: currentVer.color, size: currentVer.size } : null,
          needPerson: form.needPerson, aspectRatio: aspectRatios, videoDuration: videoDurations,
          expectStart: form.expectStart, expectEnd: form.expectEnd,
          urgency: form.urgency, description: form.description,
          priority: form.urgency === '紧急' ? 'P0' : form.urgency === '重要' ? 'P1' : 'P2',
          status,
          submitterName: form.submitterName || undefined,
          submitterDept: form.submitterDept || undefined,
        }),
      });
      showToast(status === 'pending' ? '需求已提交审核！' : '草稿已保存', 'success');
      setTimeout(() => window.location.hash = '#/my-demands', 500);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <>
      <div>
        <h1 className="page-title">新建拍摄需求</h1>
        <p className="page-subtitle">从标准车型库选择，填写后提交审核</p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 40, borderBottom: '1px solid var(--border-hair)', paddingBottom: 16 }}>
        {stepTitles.map((t, i) => {
          const isDone = canAdvance(i);
          const isActive = activeStep === i;
          const isOpen = i <= activeStep;
          return (
            <button key={i} onClick={() => { if (isDone || i < activeStep) setActiveStep(i); }}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--ink-1)' : isDone ? 'var(--ink-2)' : 'var(--ink-4)',
                border: 'none', background: isActive ? 'var(--brand-50)' : 'none',
                borderRadius: 'var(--r-md)',
                cursor: isOpen ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.12s',
              }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: isActive ? 'var(--brand-500)' : isDone ? 'var(--success)' : 'var(--bg-soft)',
                color: isActive || isDone ? 'white' : 'var(--ink-4)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>{isDone && !isActive ? '✓' : i + 1}</span>
              {t}
            </button>
          );
        })}
      </div>

      {/* Step 0: 选择产品 */}
      {activeStep >= 0 && (
        <SectionBlock title="选择产品" subtitle="从 60 款标准车型中选择">
          {isGuest && (
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">你的姓名 <span className="required">*</span></label>
                <input value={form.submitterName} onChange={e => setForm({ ...form, submitterName: e.target.value })} placeholder="提报人姓名" />
              </div>
              <div className="form-group">
                <label className="form-label">部门（可选）</label>
                <input value={form.submitterDept} onChange={e => setForm({ ...form, submitterDept: e.target.value })} placeholder="例如：海外业务 / 国内业务" />
              </div>
            </div>
          )}
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">业务方向 <span className="required">*</span></label>
              <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
                {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            {MODEL_TYPES.map(t => (
              <label key={t} className={`option-item ${modelTypeFilter === t ? 'selected' : ''}`} onClick={() => { setModelTypeFilter(t); setSelectedModel(''); setSelectedVersion(''); }}>{t} {t !== '全部' && <span style={{ color: 'var(--ink-5)', marginLeft: 4 }}>({models.filter(m => m.type === t).length})</span>}</label>
            ))}
            <input placeholder="搜索车型名 / 编号 / 系列..." value={modelSearch} onChange={e => { setModelSearch(e.target.value); setSelectedModel(''); setSelectedVersion(''); }} style={{ maxWidth: 240, marginLeft: 'auto' }} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">车型 <span className="required">*</span> <span style={{ color: 'var(--ink-5)', fontWeight: 400, fontSize: 11 }}>({filteredModels.length}款可选)</span></label>
              <select value={selectedModel} onChange={e => { setSelectedModel(e.target.value); setSelectedVersion(''); setSelectedVerName(''); }}>
                <option value="">请选择车型</option>
                {Object.entries(groupedModels).map(([series, items]: any) => (
                  <optgroup key={series} label={`${series} · ${items.length}款`}>
                    {items.map((m: any) => (
                      <option key={m.id} value={m.id}>[{m.type}] {m.name} {m.position ? `· ${m.position}` : ''}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">版本 <span className="required">*</span></label>
              <select value={selectedVersion} onChange={e => { setSelectedVersion(e.target.value); const v = versions.find(x => x.id === e.target.value); setSelectedVerName(v?.name || ''); }} disabled={!currentModel}>
                <option value="">{currentModel ? `请选择版本 (${versions.length}个)` : '请先选择车型'}</option>
                {versions.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name} {v.groupset ? `· ${v.groupset}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {currentVer && (
            <div className="config-grid" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-hair)' }}>
              <div className="config-item"><span className="cfg-label">轮组</span><span className="cfg-value">{currentVer.wheelset || '-'}</span></div>
              <div className="config-item"><span className="cfg-label">套件</span><span className="cfg-value">{currentVer.groupset || '-'}</span></div>
              <div className="config-item"><span className="cfg-label">刹车</span><span className="cfg-value">{currentVer.brake || '-'}</span></div>
              <div className="config-item"><span className="cfg-label">车架</span><span className="cfg-value">{currentVer.frame || '-'}</span></div>
              <div className="config-item"><span className="cfg-label">把组</span><span className="cfg-value">{currentVer.handlebar || '-'}</span></div>
              <div className="config-item"><span className="cfg-label">颜色</span><span className="cfg-value">{currentVer.color || '-'}</span></div>
            </div>
          )}

          {canAdvance(0) && activeStep === 0 && <NextStepButton onClick={() => setActiveStep(1)} text="下一步：选择业务方向" />}
        </SectionBlock>
      )}

      {/* Step 1: 业务方向 + 用途 */}
      {activeStep >= 1 && (
        <SectionBlock title="业务方向与用途" subtitle="这批素材要在哪里使用">
          <FormRow label="拍摄用途（可多选）" required>
            <div className="option-group">{SHOOT_PURPOSES.map(p => (
              <label key={p} className={`option-item ${purposes.includes(p) ? 'selected' : ''}`} onClick={() => toggle(purposes, p, setPurposes)}>{p}</label>
            ))}</div>
          </FormRow>
          {canAdvance(1) && activeStep === 1 && <NextStepButton onClick={() => setActiveStep(2)} text="下一步：选择拍摄内容" />}
        </SectionBlock>
      )}

      {/* Step 2: 拍摄内容 */}
      {activeStep >= 2 && (
        <SectionBlock title="拍摄内容" subtitle="你希望拍什么">
          <FormRow label="拍摄内容（可多选）" required>
            <div className="option-group">{SHOOT_CONTENTS.map(c => (
              <label key={c} className={`option-item ${contents.includes(c) ? 'selected' : ''}`} onClick={() => toggle(contents, c, setContents)}>{c}</label>
            ))}</div>
          </FormRow>
          {canAdvance(2) && activeStep === 2 && <NextStepButton onClick={() => setActiveStep(3)} text="下一步：场景与人物" />}
        </SectionBlock>
      )}

      {/* Step 3: 场景与人物 */}
      {activeStep >= 3 && (
        <SectionBlock title="场景与人物" subtitle="拍摄环境与是否需要出镜">
          <FormRow label="拍摄场景（可多选）">
            <div className="option-group">{SHOOT_SCENES.map(s => (
              <label key={s} className={`option-item ${scenes.includes(s) ? 'selected' : ''}`} onClick={() => toggle(scenes, s, setScenes)}>{s}</label>
            ))}</div>
          </FormRow>
          <FormRow label="是否需要人物">
            <div className="option-group">
              {['不需要', '需要模特', '需要主播', '需要骑手', '待定'].map(p => (
                <label key={p} className={`option-item ${form.needPerson === p ? 'selected' : ''}`} onClick={() => setForm({ ...form, needPerson: p })}>{p}</label>
              ))}
            </div>
          </FormRow>
          {activeStep === 3 && <NextStepButton onClick={() => setActiveStep(4)} text="下一步：素材规格" />}
        </SectionBlock>
      )}

      {/* Step 4: 素材规格 */}
      {activeStep >= 4 && (
        <SectionBlock title="素材规格" subtitle="比例与时长">
          <FormRow label="画幅比例">
            <div className="option-group">{ASPECT_RATIOS.map(r => (
              <label key={r} className={`option-item ${aspectRatios.includes(r) ? 'selected' : ''}`} onClick={() => toggle(aspectRatios, r, setAspectRatios)}>{r}</label>
            ))}</div>
          </FormRow>
          <FormRow label="视频时长">
            <div className="option-group">{VIDEO_DURATIONS.map(d => (
              <label key={d} className={`option-item ${videoDurations.includes(d) ? 'selected' : ''}`} onClick={() => toggle(videoDurations, d, setVideoDurations)}>{d}</label>
            ))}</div>
          </FormRow>
          {activeStep === 4 && <NextStepButton onClick={() => setActiveStep(5)} text="下一步：时间与优先级" />}
        </SectionBlock>
      )}

      {/* Step 5: 时间与优先级 */}
      {activeStep >= 5 && (
        <SectionBlock title="时间与优先级" subtitle="期望完成日期与紧急程度">
          <div className="form-grid">
            <div className="form-group"><label className="form-label">开始日期 <span className="required">*</span></label>
              <input type="date" value={form.expectStart} onChange={e => setForm({ ...form, expectStart: e.target.value })} />
            </div>
            <div className="form-group"><label className="form-label">完成日期 <span className="required">*</span></label>
              <input type="date" value={form.expectEnd} onChange={e => setForm({ ...form, expectEnd: e.target.value })} />
            </div>
          </div>
          <FormRow label="紧急程度">
            <div className="option-group">{['普通', '重要', '紧急'].map(u => (
              <label key={u} className={`option-item ${form.urgency === u ? 'selected' : ''}`} onClick={() => setForm({ ...form, urgency: u })}>{u}</label>
            ))}</div>
          </FormRow>
          <FormRow label="需求说明（为什么需要拍？）" required>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="主要想突出什么？客户/平台是谁？" />
          </FormRow>
          {canAdvance(5) && activeStep === 5 && <NextStepButton onClick={() => setActiveStep(6)} text="查看摘要并提交" />}
        </SectionBlock>
      )}

      {/* Step 6: Summary + Submit */}
      {activeStep >= 6 && (
        <SectionBlock title="确认需求" subtitle="核对信息后提交审核">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 40px', padding: 24, background: 'var(--bg-soft)', borderRadius: 'var(--r-lg)', marginBottom: 28 }}>
            <SummaryItem label="产品" value={currentModel ? `${currentModel.name} · ${currentModel.position || ''}` : '—'} />
            <SummaryItem label="版本" value={selectedVerName || '—'} />
            <SummaryItem label="业务方向" value={form.direction} />
            <SummaryItem label="紧急程度" value={form.urgency} />
            <SummaryItem label="拍摄用途" value={purposes.length ? purposes.join(' / ') : '—'} />
            <SummaryItem label="拍摄内容" value={contents.length ? contents.join(' / ') : '—'} />
            <SummaryItem label="场景" value={scenes.length ? scenes.join(' / ') : '—'} />
            <SummaryItem label="人物需求" value={form.needPerson} />
            <SummaryItem label="画幅" value={aspectRatios.length ? aspectRatios.join(' / ') : '—'} />
            <SummaryItem label="时长" value={videoDurations.length ? videoDurations.join(' / ') : '—'} />
            <SummaryItem label="期望日期" value={form.expectStart && form.expectEnd ? `${form.expectStart} ~ ${form.expectEnd}` : '—'} />
            <SummaryItem label="提报人" value={`${user.name} · ${user.dept || ''}`} />
          </div>

          {form.description && (
            <div style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 'var(--r-lg)', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>需求说明</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{form.description}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => submit('draft')}>保存草稿</button>
            <button className="btn btn-primary" onClick={() => submit('pending')}>提交审核</button>
          </div>
        </SectionBlock>
      )}
    </>
  );
}

// ---------- 辅助组件 ----------
function SectionBlock({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="section-block">
      <div className="section-head">{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: -8, marginBottom: 20 }}>{subtitle}</div>}
      {children}
    </div>
  );
}
function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="form-label">{label}{required && <span className="required">*</span>}</div>
      {children}
    </div>
  );
}
function NextStepButton({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <div style={{ marginTop: 24 }}>
      <button className="btn btn-primary" onClick={onClick}>{text} →</button>
    </div>
  );
}
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--ink-1)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ============ 我的需求 ============
export function MyDemandsPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [demands, setDemands] = useState<any[]>([]);
  useEffect(() => { api<any[]>('/api/demands?my=1').then(d => setDemands(d || [])); }, []);
  const del = async (id: string) => {
    if (!confirm('确定取消该需求？')) return;
    await api(`/api/demands/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', action: '取消需求' }) });
    setDemands(d => d.filter(x => x.id !== id));
    showToast('已取消', 'success');
  };

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">我的需求</h1><p className="page-subtitle">跟踪你提交的所有拍摄需求</p></div>
        <a href="#/demand/new" className="btn btn-primary">+ 新建需求</a>
      </div>
      <div className="card">
        {demands.length === 0 ? (
          <div className="empty-state"><h3>暂无需求</h3><p>点击右上角新建第一个需求吧</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>编号</th><th>标题</th><th>车型</th><th>业务</th><th>优先级</th><th>期望时间</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {demands.map(d => {
                const comps = typeof d.components === 'string' ? JSON.parse(d.components || '{}') : (d.components || {});
                const purp = typeof d.purpose === 'string' ? JSON.parse(d.purpose || '[]') : (d.purpose || []);
                return (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{d.no}</td>
                    <td style={{ maxWidth: 260 }}>{d.title}</td>
                    <td>{d.modelName} · {d.versionName || '-'}</td>
                    <td><DirectionBadge d={d.direction} /></td>
                    <td><PriorityBadge p={d.priority} /></td>
                    <td style={{ fontSize: 12 }}>{d.expectStart} ~ {d.expectEnd}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      {(d.status === 'draft' || d.status === 'revision') && (
                        <button className="btn-link" onClick={() => api(`/api/demands/${d.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'pending', action: '提交需求' }) }).then(() => { window.location.reload(); })}>提交</button>
                      )}
                      {['pending', 'revision'].includes(d.status) && (
                        <button className="btn-link" onClick={() => del(d.id)}>取消</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ============ 审核中心 ============
export function ReviewPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [allDemands, setAllDemands] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [drawerDemand, setDrawerDemand] = useState<any>(null);
  const [showSessions, setShowSessions] = useState<any[]>([]);
  const [scheduleForDemand, setScheduleForDemand] = useState<any>(null); // 排期 Modal
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleShooterId, setScheduleShooterId] = useState('');
  const [shooters, setShooters] = useState<any[]>([]);

  useEffect(() => {
    api<any[]>('/api/demands').then(setAllDemands);
    api<any[]>('/api/users/shooters').then(list => {
      setShooters(list);
      if (list.length > 0) setScheduleShooterId(list[0].id);
    }).catch(() => {});
  }, []);

  const filterTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '已确认' },
    { key: 'scheduled', label: '已排期' },
    { key: 'shooting', label: '拍摄中' },
    { key: 'review', label: '待验收' },
    { key: 'done', label: '已完成' },
  ];

  const counts = {
    all: allDemands.length,
    pending: allDemands.filter(d => d.status === 'pending').length,
    confirmed: allDemands.filter(d => d.status === 'confirmed').length,
    scheduled: allDemands.filter(d => d.status === 'scheduled').length,
    shooting: allDemands.filter(d => d.status === 'shooting').length,
    review: allDemands.filter(d => d.status === 'review').length,
    done: allDemands.filter(d => d.status === 'done').length,
  };

  const filtered = filter === 'all' ? allDemands : allDemands.filter(d => d.status === filter);

  const confirmDemand = async (id: string) => {
    const note = prompt('审核备注（可选）：');
    const priority = prompt('最终优先级 (P0/P1/P2)：', 'P2') || 'P2';
    await api(`/api/demands/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'confirmed', action: '审核确认', detail: note || undefined, priority }) });
    setAllDemands(list => list.map(d => d.id === id ? { ...d, status: 'confirmed', priority } : d));
    showToast('已确认，需求可以排期', 'success');
  };
  const revisionDemand = async (id: string) => {
    const reason = prompt('退回原因：');
    if (!reason) return;
    await api(`/api/demands/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'revision', action: '退回修改', reason }) });
    setAllDemands(list => list.map(d => d.id === id ? { ...d, status: 'revision' } : d));
    showToast('已退回', 'success');
  };
  const quickSchedule = async (d: any) => {
    // 如果还是 pending 先自动确认
    if (d.status === 'pending') {
      await api(`/api/demands/${d.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'confirmed', action: '审核确认', priority: d.priority || 'P2' }) });
    }
    // 弹简易排期 Modal，预填期望日期
    setScheduleForDemand(d);
    setScheduleDate(d.expectStart || new Date().toISOString().slice(0, 10));
  };

  const confirmSchedule = async () => {
    if (!scheduleDate) { showToast('请选择日期', 'warning'); return; }
    if (!scheduleShooterId) { showToast('请选择拍摄人员', 'warning'); return; }
    const shooter = shooters.find(s => s.id === scheduleShooterId);
    try {
      // 1. 创建 session
      const title = `${scheduleForDemand.modelName} · ${scheduleForDemand.versionName || ''}`.trim();
      await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title,
          date: scheduleDate,
          startTime: scheduleTime,
          location: scheduleForDemand.description ? scheduleForDemand.description.slice(0, 50) : '',
          shooterId: shooter?.id,
          shooterName: shooter?.name,
          status: 'scheduled',
          demandIds: [scheduleForDemand.id],
        }),
      });
      // 2. demand 状态改 scheduled
      await api(`/api/demands/${scheduleForDemand.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'scheduled', action: '排期确认' }) });
      // 3. 本地刷新
      setAllDemands(list => list.map(x => x.id === scheduleForDemand.id ? { ...x, status: 'scheduled' } : x));
      showToast(`已排期 · ${scheduleDate} ${scheduleTime} · ${shooter?.name || ''}`, 'success');
      setScheduleForDemand(null);
    } catch (e: any) {
      showToast(e.message || '排期失败', 'error');
    }
  };

  const cancelDemand = async (d: any) => {
    const reason = prompt(`确认取消该需求？（将标记为已取消，不可恢复）\n当前状态：${d.status}`, '业务变更，取消拍摄');
    if (!reason) return;
    await api(`/api/demands/${d.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', action: '取消需求', detail: reason }) });
    setAllDemands(list => list.map(x => x.id === d.id ? { ...x, status: 'cancelled' } : x));
    showToast('需求已取消', 'success');
  };
  const changePriority = async (d: any) => {
    const p = prompt('设置优先级 (P0/P1/P2/P3)', d.priority || 'P2');
    if (!p || !['P0', 'P1', 'P2', 'P3'].includes(p.toUpperCase())) return;
    await api(`/api/demands/${d.id}`, { method: 'PATCH', body: JSON.stringify({ priority: p.toUpperCase() }) });
    setAllDemands(list => list.map(x => x.id === d.id ? { ...x, priority: p.toUpperCase() } : x));
    showToast(`优先级已改为 ${p.toUpperCase()}`, 'success');
  };
  const archiveDemand = async (d: any) => {
    await api(`/api/demands/${d.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'archived', action: '归档' }) });
    setAllDemands(list => list.map(x => x.id === d.id ? { ...x, status: 'archived' } : x));
    showToast('已归档', 'success');
  };

  const openDetail = async (d: any) => {
    setDrawerDemand(d);
    // 查关联场次
    try {
      const sessions = await api<any[]>('/api/sessions');
      setShowSessions(sessions.filter(s => s.demands?.some((sd: any) => sd.demandId === d.id)));
    } catch { setShowSessions([]); }
  };

  return (
    <>
      <div>
        <h1 className="page-title">需求总表</h1>
        <p className="page-subtitle">所有提报需求 · 按状态查阅 · 管理员一站式审核</p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border-hair)' }}>
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: filter === t.key ? 600 : 400,
            color: filter === t.key ? 'var(--ink-1)' : 'var(--ink-4)',
            border: 'none', background: 'none',
            borderBottom: filter === t.key ? '2px solid var(--brand-500)' : '2px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}>
            {t.label}
            <span style={{ marginLeft: 6, color: 'var(--ink-5)', fontSize: 11, fontWeight: 500 }}>{counts[t.key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>暂无需求</h3>
          <p>{filter === 'all' ? '还没有业务员提报需求' : `没有「${filterTabs.find(t => t.key === filter)?.label}」状态的需求`}</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>标题 / 车型</th>
              <th>提报人</th>
              <th>业务</th>
              <th>优先级</th>
              <th>期望日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-4)' }}>{d.no}</td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--ink-1)', maxWidth: 300 }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{d.modelName} · {d.versionName || '-'}</div>
                </td>
                <td>{d.submitterName}</td>
                <td><DirectionBadge d={d.direction} /></td>
                <td><PriorityBadge p={d.priority} /></td>
                <td style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                  {d.expectStart} ~ {d.expectEnd}
                </td>
                <td><StatusBadge status={d.status} /></td>
                <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {d.status === 'pending' && (
                    <>
                      <button className="btn-link" onClick={() => confirmDemand(d.id)}>确认</button>
                      <button className="btn-link" onClick={() => revisionDemand(d.id)} style={{ color: 'var(--danger)' }}>退回</button>
                    </>
                  )}
                  {d.status === 'confirmed' && (
                    <button className="btn-link" onClick={() => quickSchedule(d)}>去排期</button>
                  )}
                  {d.status === 'revision' && (
                    <button className="btn-link" onClick={() => confirmDemand(d.id)}>重新确认</button>
                  )}
                  {['admin', 'reviewer'].includes(user.role) && !['done', 'archived'].includes(d.status) && (
                    <>
                      <button className="btn-link" onClick={() => changePriority(d)}>改优先级</button>
                      <button className="btn-link" onClick={() => cancelDemand(d)} style={{ color: 'var(--danger)' }}>取消</button>
                    </>
                  )}
                  {['admin', 'reviewer'].includes(user.role) && d.status === 'done' && (
                    <button className="btn-link" onClick={() => archiveDemand(d)}>归档</button>
                  )}
                  <button className="btn-link" onClick={() => openDetail(d)}>详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detail Drawer */}
      {drawerDemand && (
        <Drawer open={!!drawerDemand} title="需求详情" onClose={() => setDrawerDemand(null)}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-4)' }}>{drawerDemand.no}</div>
            <StatusBadge status={drawerDemand.status} />
            <PriorityBadge p={drawerDemand.priority} />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{drawerDemand.title}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>产品</div>
              <div style={{ fontSize: 14 }}>{drawerDemand.modelName} · {drawerDemand.versionName}</div>
            </div>

            {drawerDemand.components && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>核心配置</div>
                <div className="config-grid">
                  {(() => {
                    try {
                      const comp = typeof drawerDemand.components === 'string' ? JSON.parse(drawerDemand.components) : drawerDemand.components;
                      const labels: Record<string, string> = { wheelset: '轮组', groupset: '套件', brake: '刹车', frame: '车架', handlebar: '把组', seatpost: '座管', color: '颜色', size: '尺寸' };
                      return Object.entries(comp).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="config-item">
                          <span className="cfg-label">{labels[k] || k}</span>
                          <span className="cfg-value">{String(v)}</span>
                        </div>
                      ));
                    } catch { return null; }
                  })()}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>业务信息</div>
              <div className="config-grid">
                <div className="config-item"><span className="cfg-label">提报人</span><span className="cfg-value">{drawerDemand.submitterName}</span></div>
                <div className="config-item"><span className="cfg-label">业务方向</span><span className="cfg-value">{drawerDemand.direction}</span></div>
                <div className="config-item"><span className="cfg-label">期望日期</span><span className="cfg-value">{drawerDemand.expectStart} ~ {drawerDemand.expectEnd}</span></div>
                <div className="config-item"><span className="cfg-label">优先级</span><span className="cfg-value">{drawerDemand.priority}</span></div>
              </div>
            </div>

            {drawerDemand.description && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>需求说明</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{drawerDemand.description}</div>
              </div>
            )}

            {showSessions.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>关联场次 ({showSessions.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {showSessions.map(s => (
                    <div key={s.id} style={{ padding: '10px 12px', background: 'var(--bg-soft)', borderRadius: 'var(--r-md)', fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{s.date} {s.startTime || ''}</strong>
                        <StatusBadge status={s.status} />
                      </div>
                      <div style={{ color: 'var(--ink-4)', marginTop: 2 }}>{s.title} · 拍摄人员 {s.shooterName || '待定'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* 简易排期 Modal — 一步到位 */}
      {scheduleForDemand && (
        <Modal
          open
          title={`快速排期：${scheduleForDemand.modelName}${scheduleForDemand.versionName ? ' · ' + scheduleForDemand.versionName : ''}`}
          onClose={() => setScheduleForDemand(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setScheduleForDemand(null)}>取消</button>
              <button className="btn btn-primary" onClick={confirmSchedule}>确认排期</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
            {/* 需求摘要 */}
            <div style={{ padding: 14, background: 'var(--bg-soft)', borderRadius: 'var(--r-md)', fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span><strong>{scheduleForDemand.modelName}</strong></span>
                <span style={{ color: 'var(--ink-4)' }}>{scheduleForDemand.versionName || ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: 'var(--ink-4)' }}>
                <span>业务：{scheduleForDemand.direction}</span>
                <span>优先级：{scheduleForDemand.priority}</span>
                <span>期望：{scheduleForDemand.expectStart}</span>
              </div>
            </div>

            {/* 日期 + 时间 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">排期日期 <span className="required">*</span></label>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ padding: '10px 14px', fontSize: 14 }} />
              </div>
              <div className="form-group">
                <label className="form-label">开始时间</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ padding: '10px 14px', fontSize: 14 }} />
              </div>
            </div>

            {/* 拍摄人员 */}
            <div className="form-group">
              <label className="form-label">拍摄人员 <span className="required">*</span></label>
              {shooters.length === 0 ? (
                <div style={{ padding: 12, background: 'var(--bg-soft)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-4)' }}>
                  还没有拍摄人员，请先到拍摄计划 → 拍摄人员排班 → 管理拍摄人员中添加
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {shooters.map(s => (
                    <label key={s.id}
                      className={`option-item ${scheduleShooterId === s.id ? 'selected' : ''}`}
                      style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => setScheduleShooterId(s.id)}>
                      <div className="shooter-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{s.name.charAt(0)}</div>
                      {s.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ============ 拍摄场次 ============
export function SessionsPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', date: '', startTime: '09:00', location: '', shooterId: '' });

  useEffect(() => {
    api<any[]>('/api/sessions').then(setSessions);
    api<any[]>('/api/demands?status=confirmed').then(setConfirmed);
    api<any[]>('/api/auth/users').catch(() => []).then(u => setUsers(u || []));
  }, []);

  const refresh = () => { api<any[]>('/api/sessions').then(setSessions); };
  const sessionGoShooting = async (s: any) => {
    await api(`/api/sessions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'shooting' }) });
    showToast('已开始拍摄', 'success'); refresh();
  };
  const sessionGoReview = async (s: any) => {
    await api(`/api/sessions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'review' }) });
    showToast('已提交验收', 'success'); refresh();
  };
  const sessionGoDone = async (s: any) => {
    await api(`/api/sessions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) });
    showToast('已验收通过', 'success'); refresh();
  };
  const deleteSession = async (s: any) => {
    if (!confirm(`确定删除场次 ${s.no}？\n关联的需求状态会回退为「已确认」。\n此操作不可恢复。`)) return;
    try {
      await api(`/api/sessions/${s.id}`, { method: 'DELETE' });
      showToast('场次已删除，关联需求已回退', 'success');
      refresh();
    } catch (e: any) { showToast(e.message || '删除失败', 'error'); }
  };

  const suggestions = Object.values(confirmed.reduce((acc: any, d) => {
    const k = `${d.modelName || ''}|${d.versionName || ''}`;
    (acc[k] = acc[k] || []).push(d);
    return acc;
  }, {})).filter((arr: any) => arr.length >= 2);

  const submitSession = async () => {
    if (!form.date || selectedDemands.length === 0) { showToast('请选择日期和至少一个需求', 'warning'); return; }
    try {
      await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ ...form, demandIds: selectedDemands }),
      });
      showToast('场次创建成功！', 'success');
      setShowCreate(false); setSelectedDemands([]); setForm({ title: '', date: '', startTime: '09:00', location: '', shooterId: '' });
      api<any[]>('/api/sessions').then(setSessions);
      api<any[]>('/api/demands?status=confirmed').then(setConfirmed);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">拍摄场次</h1><p className="page-subtitle">每场拍摄的任务、拍摄人员、素材交付</p></div>
        {['admin', 'reviewer'].includes(user.role) && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 创建场次</button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="card" style={{ border: '1px solid #f7d9a3', background: '#fffbea' }}>
          <div className="card-header"><h3 className="card-title">💡 合并拍摄建议</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((arr: any, i: number) => (
              <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>🎯 {arr[0].modelName} · {arr[0].versionName}（{arr.length}个需求）</div>
                <TagList items={arr.map((d: any) => `${d.no} ${d.submitterName}`)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        {sessions.length === 0 ? (
          <div className="empty-state"><h3>暂无场次</h3><p>先确认一些需求，然后创建拍摄场次</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>场次号</th><th>日期</th><th>时间</th><th>标题</th><th>拍摄人员</th><th>任务数</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.no}</td>
                  <td>{s.date}</td>
                  <td>{s.startTime || '--:--'}</td>
                  <td>{s.title}</td>
                  <td>{s.shooterName || '待定'}</td>
                  <td>{(s._count?.tasks || s.taskCount) || 0}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['scheduled'].includes(s.status) && (
                      <button className="btn-link" onClick={() => sessionGoShooting(s)}>开始拍摄</button>
                    )}
                    {['shooting'].includes(s.status) && (
                      <button className="btn-link" onClick={() => sessionGoReview(s)}>提交验收</button>
                    )}
                    {['review'].includes(s.status) && (
                      <button className="btn-link" onClick={() => sessionGoDone(s)}>验收通过</button>
                    )}
                    {['admin', 'reviewer'].includes(user.role) && !['done'].includes(s.status) && (
                      <button className="btn-link" onClick={() => deleteSession(s)} style={{ color: 'var(--danger)' }}>删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">创建拍摄场次</h3><button className="btn-ghost" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">标题</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="如：3月15日公路车棚拍" /></div>
                <div className="form-group"><label className="form-label">日期 *</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">开始时间</label>
                  <input className="form-input" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">拍摄人员</label>
                  <select className="form-select" value={form.shooterId} onChange={e => setForm({ ...form, shooterId: e.target.value })}>
                    <option value="">自动分配</option>
                    {users.filter(u => u.role === 'shooter').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select></div>
              </div>
              <div className="form-group"><label className="form-label">地点</label>
                <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="如：2楼摄影棚" /></div>
              <div style={{ marginTop: 16 }}><label className="form-label">选择要一起拍的需求 *（已确认的）</label>
                <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  {confirmed.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)', textAlign: 'center' }}>还没有已确认的需求</div>}
                  {confirmed.map(d => {
                    const sel = selectedDemands.includes(d.id);
                    return (
                      <div key={d.id} onClick={() => setSelectedDemands(s => sel ? s.filter(x => x !== d.id) : [...s, d.id])}
                        style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: sel ? '#e6f6ee' : 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span>{sel ? '✅ ' : ''}<strong>{d.modelName} · {d.versionName}</strong> · {d.submitterName}</span>
                          <PriorityBadge p={d.priority} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                          {(typeof d.purpose === 'string' ? JSON.parse(d.purpose) : d.purpose || []).join('、')} | {(typeof d.content === 'string' ? JSON.parse(d.content) : d.content || []).join('、')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitSession}>创建场次</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============ 拍摄任务 ============
export function TasksPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api<any[]>('/api/tasks').then(setTasks); }, []);

  const filtered = tasks.filter(t => filter === 'all' ? true : t.status === filter);
  const upload = async (id: string) => {
    const url = prompt('素材URL（如网盘链接）：');
    if (!url) return;
    await api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'review', materialUrl: url }) });
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'review', materialUrl: url } : t));
    showToast('素材已上传', 'success');
  };
  const deliver = async (id: string) => {
    await api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) });
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'done' } : t));
    showToast('已交付', 'success');
  };

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">拍摄任务</h1><p className="page-subtitle">每个任务对应一个具体交付物</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'shooting', 'review', 'done'].map(f => (
            <button key={f} className={`btn-sm ${filter === f ? 'btn btn-primary' : 'btn btn-secondary'}`} onClick={() => setFilter(f)}>
              {f === 'all' ? '全部' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><h3>暂无任务</h3></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>任务号</th><th>标题</th><th>场次</th><th>素材URL</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.no}</td>
                  <td>{t.title}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t.sessionNo || '-'}</td>
                  <td style={{ maxWidth: 200 }}>
                    {t.materialUrl ? <a href={t.materialUrl} target="_blank" className="btn-link">查看素材</a> : <span style={{ color: 'var(--color-text-muted)' }}>未上传</span>}
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    {(t.status === 'pending' || t.status === 'shooting') && <button className="btn-link" onClick={() => upload(t.id)}>上传</button>}
                    {t.status === 'review' && (user.role === 'admin' || user.role === 'reviewer') && <button className="btn-link" onClick={() => deliver(t.id)}>验收</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ============ 拍摄人员管理 Modal — 标准月历大格子 ============
function PeopleManagerModal({ sessions = [], onClose, showToast }: { sessions?: any[]; onClose: () => void; showToast: (m: string, t?: string) => void }) {
  const [people, setPeople] = useState<any[]>([]);
  const [addName, setAddName] = useState('');
  const [addDept, setAddDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [quickAssignDate, setQuickAssignDate] = useState<string | null>(null);
  const [quickForm, setQuickForm] = useState({ title: '', startTime: '09:00', shooterId: '', location: '', demandId: '' });
  const [pendingDemands, setPendingDemands] = useState<any[]>([]);

  useEffect(() => {
    // 拉 confirmed + pending 两种状态 — 管理员排期时 pending 也可以先 confirm 再排
    Promise.all([
      api<any[]>('/api/demands?status=confirmed'),
      api<any[]>('/api/demands?status=pending'),
    ]).then(([c, p]) => setPendingDemands([...(c || []), ...(p || [])])).catch(() => {});
  }, []);

  const load = async () => {
    try {
      const list = await api<any[]>('/api/users/shooters');
      setPeople(list);
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!addName.trim()) { showToast('请填写姓名', 'warning'); return; }
    setLoading(true);
    try {
      const autoUsername = `shooter_${Date.now().toString().slice(-6)}`;
      await api('/api/users', { method: 'POST', body: JSON.stringify({ username: autoUsername, password: '123456', name: addName.trim(), dept: addDept.trim(), role: 'shooter' }) });
      showToast(`已添加 ${addName}`, 'success');
      setAddName(''); setAddDept('');
      load();
    } catch (e: any) { showToast(e.message || '添加失败', 'error'); }
    setLoading(false);
  };

  const deletePerson = async (p: any) => {
    if (!confirm(`确认删除拍摄人员「${p.name}」？\n他名下的场次会保留（只移除人员关联）。`)) return;
    try {
      await api('/api/users', { method: 'DELETE', body: JSON.stringify({ id: p.id }) });
      showToast(`已删除 ${p.name}`, 'success');
      load();
    } catch (e: any) { showToast(e.message || '删除失败', 'error'); }
  };

  const monthStr = selectedMonth.toISOString().slice(0, 7);
  const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const weekStartDay = firstDay.getDay(); // 0=周日
  // 标准月历格子（含前月/下月空位）
  const totalCells = Math.ceil((weekStartDay + daysInMonth) / 7) * 7;
  const cells: { date: Date | null; day: number | null; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - weekStartDay;
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayOffset + 1);
    const inMonth = dayOffset >= 0 && dayOffset < daysInMonth;
    cells.push({ date: inMonth ? d : null, day: inMonth ? dayOffset + 1 : null, inMonth });
  }

  const monthSessions = (sessions || []).filter(s => (s.date || '').startsWith(monthStr));
  const sessionsByDate: Record<string, any[]> = {};
  monthSessions.forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });

  const totalThisMonth = monthSessions.length;
  const assignedPeople = new Set(monthSessions.map(s => s.shooterName).filter(Boolean));

  const openQuickAssign = (date: string) => {
    setQuickAssignDate(date);
    setQuickForm(f => ({ ...f, shooterId: people[0]?.id || '' }));
  };
  const confirmQuickAssign = async () => {
    if (!quickAssignDate) return;
    if (!quickForm.shooterId) { showToast('请先添加拍摄人员', 'warning'); return; }
    if (!quickForm.title.trim()) { showToast('请填写标题', 'warning'); return; }
    const shooter = people.find(p => p.id === quickForm.shooterId);
    try {
      // 1. 创建 session（可关联 demandIds）
      await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: quickForm.title,
          date: quickAssignDate,
          startTime: quickForm.startTime,
          location: quickForm.location,
          shooterId: shooter?.id,
          shooterName: shooter?.name,
          status: 'scheduled',
          demandIds: quickForm.demandId ? [quickForm.demandId] : [],
        }),
      });
      // 2. 如果选了需求 → 自动改成 scheduled（pending 的先 confirm 再 scheduled）
      if (quickForm.demandId) {
        const demand = pendingDemands.find(d => d.id === quickForm.demandId);
        const targetStatus = demand?.status === 'pending' ? 'confirmed' : 'scheduled';
        try {
          await api(`/api/demands/${quickForm.demandId}`, { method: 'PATCH', body: JSON.stringify({ status: targetStatus, action: '排期自动确认' }) });
          // 如果刚从 pending → confirmed，再 patch 一次到 scheduled
          if (targetStatus === 'confirmed') {
            await api(`/api/demands/${quickForm.demandId}`, { method: 'PATCH', body: JSON.stringify({ status: 'scheduled', action: '排期确认' }) });
          }
        } catch { /* 已经 scheduled 就忽略 */ }
      }
      showToast(`已排 ${quickAssignDate} ${quickForm.startTime} · ${shooter?.name}`, 'success');
      setQuickAssignDate(null);
      setQuickForm({ title: '', startTime: '09:00', shooterId: people[0]?.id || '', location: '', demandId: '' });
      // 刷新待排需求列表
      api<any[]>('/api/demands?status=confirmed').then(setPendingDemands).catch(() => {});
    } catch (e: any) { showToast(e.message || '排期失败', 'error'); }
  };
  const deleteQuickSession = async (id: string) => {
    if (!confirm('确认删除这场排期？')) return;
    try {
      await api(`/api/sessions/${id}`, { method: 'DELETE' });
      showToast('已删除', 'success');
    } catch (e: any) { showToast(e.message || '删除失败', 'error'); }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <Modal open title="拍摄人员 · 月历排期" onClose={onClose} footer={<button className="btn btn-secondary" onClick={onClose}>完成</button>} style={{ maxWidth: 1100 }}>
      {/* 月份导航 + 统计 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost" onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}>←</button>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedMonth.getFullYear()}年 {selectedMonth.getMonth() + 1}月</div>
          <button className="btn btn-ghost" onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}>→</button>
          <button className="btn btn-ghost" onClick={() => setSelectedMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>今天</button>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--ink-3)' }}>
          <span>本月排期 <strong style={{ color: 'var(--ink-1)' }}>{totalThisMonth}</strong></span>
          <span>占用人员 <strong style={{ color: 'var(--ink-1)' }}>{assignedPeople.size}/{people.length}</strong></span>
        </div>
      </div>

      {/* 快速添加拍摄人员 — 极简 */}
      <div style={{ padding: 14, background: 'var(--bg-soft)', borderRadius: 'var(--r-md)', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input placeholder="添加拍摄人员姓名" value={addName} onChange={e => setAddName(e.target.value)} style={{ flex: 2, padding: '8px 12px' }} onKeyDown={e => e.key === 'Enter' && add()} />
        <input placeholder="部门（可选）" value={addDept} onChange={e => setAddDept(e.target.value)} style={{ flex: 1, padding: '8px 12px' }} onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn btn-primary" disabled={loading || !addName.trim()} onClick={add}>+ 添加</button>
        <span style={{ fontSize: 12, color: 'var(--ink-4)', marginLeft: 6 }}>共 {people.length} 位拍摄人员</span>
      </div>

      {/* 当前拍摄人员列表（可删除） */}
      {people.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {people.map(p => (
            <div key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px 8px 8px',
                background: 'white',
                border: '1px solid var(--border-hair)',
                borderRadius: 20,
              }}>
              <div className="shooter-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{p.name.charAt(0)}</div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
              {p.dept && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>· {p.dept}</span>}
              <button onClick={() => deletePerson(p)} title="删除"
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--ink-5)', fontSize: 14, lineHeight: 1,
                  padding: '2px 4px', borderRadius: 4,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.background = '#ffeaea'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-5)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* 标准月历 */}
      <div style={{ border: '1px solid var(--border-hair)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {/* 星期表头 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border-hair)' }}>
          {weekdayNames.map((w, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, fontWeight: 600, color: i === 0 || i === 6 ? 'var(--ink-4)' : 'var(--ink-2)' }}>{w}</div>
          ))}
        </div>

        {/* 日期格子 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((c, i) => {
            if (!c.date || !c.inMonth) {
              return <div key={i} style={{ minHeight: 100, borderRight: '1px solid var(--border-hair)', borderBottom: '1px solid var(--border-hair)', background: 'var(--bg-soft)', opacity: 0.3 }} />;
            }
            const dateStr = c.date.toISOString().slice(0, 10);
            const daySessions = sessionsByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isWeekend = [0, 6].includes(c.date.getDay());
            return (
              <div key={i}
                onClick={() => openQuickAssign(dateStr)}
                style={{
                  minHeight: 100,
                  borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid var(--border-hair)',
                  borderBottom: i >= totalCells - 7 ? 'none' : '1px solid var(--border-hair)',
                  padding: '8px 10px',
                  background: isToday ? 'var(--brand-50)' : 'white',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 4,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isToday ? '#e8f0ff' : '#f7f8fa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isToday ? 'var(--brand-50)' : 'white'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: isToday ? 'var(--brand-500)' : 'transparent',
                    color: isToday ? 'white' : isWeekend ? 'var(--ink-4)' : 'var(--ink-2)',
                  }}>{c.day}</div>
                  {daySessions.length > 0 && <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{daySessions.length}</span>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {daySessions.slice(0, 3).map(s => (
                    <div key={s.id} onClick={e => { e.stopPropagation(); deleteQuickSession(s.id); }} title="点击删除"
                      style={{
                        fontSize: 11,
                        padding: '3px 7px',
                        borderRadius: 4,
                        background: 'var(--brand-500)',
                        color: 'white',
                        display: 'flex', alignItems: 'center', gap: 4,
                        cursor: 'pointer',
                        lineHeight: 1.4,
                      }}>
                      <span style={{ fontWeight: 600 }}>{(s.startTime || '').slice(0, 5) || '●'}</span>
                      <span style={{ opacity: 0.9 }}>{s.title}</span>
                      {s.shooterName && <span style={{ opacity: 0.75 }}>· {s.shooterName}</span>}
                    </div>
                  ))}
                  {daySessions.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--ink-4)', paddingLeft: 4 }}>+{daySessions.length - 3} 更多</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 快速分配 mini modal — 用一个 Modal 覆盖 */}
      {quickAssignDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setQuickAssignDate(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 12, padding: 24, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{quickAssignDate}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 18 }}>点击了这一天，填写即排</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 关联需求（可选）— 选了就自动把需求改成已排期 */}
              <div>
                <label className="form-label">关联待排需求（可选）</label>
                <select value={quickForm.demandId} onChange={e => {
                  const did = e.target.value;
                  const d = pendingDemands.find(x => x.id === did);
                  setQuickForm(f => ({ ...f, demandId: did, title: f.title || (d ? `${d.modelName} · ${d.versionName || ''}` : '') }));
                }} style={{ padding: '10px 14px' }}>
                  <option value="">— 独立排期（不关联需求）—</option>
                  {pendingDemands.length === 0 ? (
                    <option disabled value="">没有待排需求</option>
                  ) : pendingDemands.map(d => (
                    <option key={d.id} value={d.id}>{d.no} {d.modelName} · {d.versionName || ''} · {d.submitterName} {d.status === 'pending' ? '（待确认）' : ''}</option>
                  ))}
                </select>
                {quickForm.demandId && <div className="form-hint">关联后「需求总表」中该需求会自动变成「已排期」</div>}
              </div>
              <div>
                <label className="form-label">拍摄内容（标题）</label>
                <input placeholder="如：G2max 棚拍" value={quickForm.title} onChange={e => setQuickForm({ ...quickForm, title: e.target.value })} style={{ padding: '10px 14px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <div>
                  <label className="form-label">开始时间</label>
                  <input type="time" value={quickForm.startTime} onChange={e => setQuickForm({ ...quickForm, startTime: e.target.value })} style={{ padding: '10px 14px' }} />
                </div>
                <div>
                  <label className="form-label">拍摄人员</label>
                  <select value={quickForm.shooterId} onChange={e => setQuickForm({ ...quickForm, shooterId: e.target.value })} style={{ padding: '10px 14px' }}>
                    {people.length === 0 ? <option value="">先添加拍摄人员</option> :
                      people.map(p => <option key={p.id} value={p.id}>{p.name}{p.dept ? ` · ${p.dept}` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">地点（可选）</label>
                <input placeholder="如：骓特棚拍室 / 深圳湾公园" value={quickForm.location} onChange={e => setQuickForm({ ...quickForm, location: e.target.value })} style={{ padding: '10px 14px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setQuickAssignDate(null)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirmQuickAssign}>确认排期</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============ 拍摄计划日历 ============
export function PlansPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'schedule'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPeopleMgr, setShowPeopleMgr] = useState(false);
  const [demands, setDemands] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '11:00', location: '', note: '', demandIds: [] as string[] });

  useEffect(() => {
    api<any[]>('/api/sessions').then(setSessions);
    api<any[]>('/api/demands').then(setDemands);
  }, []);

  // 读 hash query param — 从需求总表或 Dashboard 跳转排期
  useEffect(() => {
    const h = window.location.hash;
    const qIdx = h.indexOf('?');
    if (qIdx === -1) return;
    const qs = new URLSearchParams(h.substring(qIdx + 1));
    const demandId = qs.get('demandId');
    const dateStr = qs.get('date');
    if (!dateStr) return; // date 是必须的，demandId 可选

    // 定位月份
    const d = new Date(dateStr);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));

    // 查对应 demand（如果有）
    const demand = demandId ? demands.find(x => x.id === demandId) : null;
    setSelectedDate(dateStr);
    setForm(f => ({
      ...f,
      title: demand ? `${demand.modelName || '拍摄'} · 排期` : '新建拍摄场次',
      date: dateStr,
      demandIds: demandId ? [demandId] : [],
      location: '',
    }));
    setShowCreate(true);
    // 清除 query，避免刷新后重复触发
    history.replaceState(null, '', h.substring(0, qIdx));
  }, [demands]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const sessionsByDate = sessions.reduce((acc: any, s) => {
    if (!s.date) return acc;
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  const openCreateForDate = (dateStr: string) => {
    if (!['admin', 'reviewer'].includes(user.role)) { showToast('仅管理员/审核员可排期', 'warning'); return; }
    setSelectedDate(dateStr);
    setForm(f => ({ ...f, date: dateStr }));
    setShowCreate(true);
  };

  const submitCreate = async () => {
    if (!['admin', 'reviewer'].includes(user.role)) { showToast('无权限', 'error'); return; }
    if (!form.title || !form.date) { showToast('请填写标题和日期', 'warning'); return; }
    if (!form.demandIds || form.demandIds.length === 0) { showToast('请至少选择一个关联需求', 'warning'); return; }
    try {
      const shooters = await api<any[]>('/api/users/shooters').catch(() => []);
      const shooter = shooters[0];
      await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          no: `SHOOT-${form.date.replace(/-/g, '')}-001`,
          title: form.title,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          shooterId: shooter?.id,
          shooterName: shooter?.name,
          status: 'scheduled',
          vehicleCount: 1,
          note: form.note,
          demandIds: form.demandIds,
        }),
      });
      showToast('拍摄场次已创建 · 关联需求自动排期', 'success');
      // 把关联的 demand 状态改成 scheduled
      for (const did of form.demandIds) {
        try {
          await api(`/api/demands/${did}`, { method: 'PATCH', body: JSON.stringify({ status: 'scheduled', action: '排期确认' }) });
        } catch { /* 忽略已排期的 */ }
      }
      setShowCreate(false);
      api<any[]>('/api/sessions').then(setSessions);
    } catch (e: any) { showToast(e.message || '创建失败', 'error'); }
  };

  // ---- 拍摄人员排班视图 ----
  // 合并两类：已排 session 的拍摄人员 + role=shooter 的所有用户（确保即使没排也显示）
  const [shooterUsers, setShooterUsers] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>('/api/users/shooters').then(setShooterUsers).catch(() => {});
  }, []);
  const assignedNames = [...new Set(sessions.map(s => s.shooterName).filter(Boolean))] as string[];
  // shooterUsers 从 API 拿（有 id），assignedNames 从 session 里拿（只有名字）
  // 合并去重：优先用 shooterUsers 的名字
  const allPeopleNames = [
    ...shooterUsers.map(u => u.name),
    ...assignedNames.filter(n => !shooterUsers.some(u => u.name === n)),
  ];
  // Show next 7 days from today
  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const dateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekdayShort = (d: Date) => ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  return (
    <>
      <div>
        <h1 className="page-title">拍摄计划</h1>
        <p className="page-subtitle">一眼看清排期 · 点击日期可快速创建</p>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 28, borderBottom: '1px solid var(--border-hair)' }}>
        {[{ key: 'calendar', label: '日历' }, { key: 'schedule', label: '拍摄人员排班' }].map(t => (
          <button key={t.key} onClick={() => setView(t.key as any)} style={{
            padding: '10px 0',
            fontSize: 14,
            fontWeight: view === t.key ? 600 : 400,
            color: view === t.key ? 'var(--ink-1)' : 'var(--ink-4)',
            border: 'none', background: 'none',
            borderBottom: view === t.key ? '2px solid var(--brand-500)' : '2px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {view === 'calendar' ? (
        <>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {year}年 {month + 1}月
            </div>
            <div className="calendar-nav">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1))}>上月</button>
              <button onClick={() => setCurrentMonth(new Date())} className={month === new Date().getMonth() && year === new Date().getFullYear() ? 'active' : ''}>今天</button>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1))}>下月</button>
            </div>
          </div>

          <div className="calendar-grid">
            {['日', '一', '二', '三', '四', '五', '六'].map(w => <div key={w} className="calendar-day-header">{w}</div>)}
            {cells.map((d, i) => {
              if (d === null) return <div key={i} className="calendar-cell empty" />;
              const dateStrVal = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const daySessions = sessionsByDate[dateStrVal] || [];
              const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
              const isSelected = selectedDate === dateStrVal;
              return (
                <div key={i}
                  className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => openCreateForDate(dateStrVal)}
                  onDoubleClick={() => openCreateForDate(dateStrVal)}
                >
                  <div className="calendar-date">{d}</div>
                  <div className="calendar-events">
                    {daySessions.slice(0, 3).map((s: any) => (
                      <div key={s.id} className={`calendar-event event-${s.status}`} title={`${s.startTime} ${s.title}${s.shooterName ? ' · ' + s.shooterName : ''}`}>
                        <span>{s.startTime || ''} {s.title}</span>
                        {s.shooterName && <span style={{ opacity: 0.75, marginLeft: 6 }}>· {s.shooterName}</span>}
                      </div>
                    ))}
                    {daySessions.length > 3 && <div className="calendar-more">+{daySessions.length - 3} 更多</div>}
                    {daySessions.length === 0 && (
                      <div style={{ fontSize: 11, color: 'var(--ink-5)', padding: '2px 4px' }}>
                        {['admin', 'reviewer'].includes(user.role) ? '点击创建' : '—'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>
              {`${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()}`} — {`${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`} · 共 {allPeopleNames.length} 位拍摄人员
            </div>
            {['admin', 'reviewer'].includes(user.role) && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPeopleMgr(true)}>管理拍摄人员</button>
            )}
          </div>
          {allPeopleNames.length === 0 ? (
            <div className="empty-state"><h3>暂无拍摄人员排班</h3><p>管理员还没添加拍摄人员，或者还没分配场次</p></div>
          ) : (
            <div className="shooter-schedule" style={{ border: '1px solid var(--border-hair)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              {/* Header row */}
              <div className="schedule-row" style={{ borderBottom: '1px solid var(--border-hair)' }}>
                <div className="schedule-label" style={{ background: 'var(--bg-soft)', borderBottom: 'none' }}>拍摄人员</div>
                <div className="schedule-cells" style={{ borderBottom: 'none' }}>
                  {weekDates.map((d, i) => (
                    <div key={i} className="schedule-cell" style={{ minHeight: 'auto', padding: '10px 8px', borderBottom: 'none', background: 'var(--bg-soft)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isWeekend(d) ? 'var(--ink-4)' : 'var(--ink-1)' }}>{d.getMonth() + 1}/{d.getDate()}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>周{weekdayShort(d)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per shooter rows */}
              {allPeopleNames.map(name => (
                <div key={name} className="schedule-row">
                  <div className="schedule-label">
                    <div className="shooter-avatar">{name.charAt(0)}</div>
                    {name}
                  </div>
                  <div className="schedule-cells">
                    {weekDates.map((d, i) => {
                      const ds = dateStr(d);
                      const daySessions = sessions.filter(s => s.shooterName === name && s.date === ds);
                      const isTodayCell = ds === dateStr(new Date());
                      return (
                        <div key={i} className={`schedule-cell ${isWeekend(d) ? 'weekend' : ''} ${isTodayCell ? 'today' : ''}`}>
                          {daySessions.map(s => (
                            <div key={s.id} className={`schedule-event event-${s.status}`} title={`${s.title}\n${s.location || ''}\n${s.startTime || ''}`}>
                              {s.startTime || ''} {s.title.length > 12 ? s.title.substring(0, 12) + '…' : s.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick Create Modal */}
      {showCreate && (
        <Modal open={showCreate} title="新建拍摄场次" onClose={() => setShowCreate(false)} footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>取消</button>
            <button className="btn btn-primary" onClick={submitCreate}>创建</button>
          </>
        }>
          <div className="form-grid">
            <div className="form-group form-group-full"><label className="form-label">标题 <span className="required">*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例如：Cyclone ET 棚拍" />
            </div>
            <div className="form-group"><label className="form-label">日期 <span className="required">*</span></label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group"><label className="form-label">时间段</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                <span style={{ paddingTop: 8 }}>—</span>
                <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group"><label className="form-label">地点</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="骓特棚拍室 / 深圳湾公园" />
            </div>
            <div className="form-group form-group-full"><label className="form-label">关联需求 <span className="required">*</span></label>
              <select multiple size={4} value={form.demandIds} onChange={e => { const ids = Array.from(e.target.selectedOptions).map(o => o.value); setForm({ ...form, demandIds: ids }); }}>
                {demands.filter(d => ['confirmed', 'scheduled'].includes(d.status)).map(d => (
                  <option key={d.id} value={d.id}>{d.modelName} · {d.title.substring(0, 30)}</option>
                ))}
              </select>
              <div className="form-hint">按住 Ctrl 多选</div>
            </div>
            <div className="form-group form-group-full"><label className="form-label">备注</label>
              <textarea className="form-textarea" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="特别注意事项..." />
            </div>
          </div>
        </Modal>
      )}

      {/* 拍摄人员管理 Modal */}
      {showPeopleMgr && <PeopleManagerModal sessions={sessions} onClose={() => { setShowPeopleMgr(false); api<any[]>('/api/users/shooters').then(setShooterUsers); }} showToast={showToast} />}
    </>
  );
}

// ============ 车型标准库 ============
export function ModelsPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [models, setModels] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [modelTypeFilter, setModelTypeFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ brand: 'TWITTER', series: '', code: '', name: '', category: '公路车' });
  useEffect(() => { api<any[]>('/api/models').then(setModels); }, []);

  const MODEL_TYPES = ['全部', '公路车', '砾石车', '山地车', '电助力'];
  const filtered = models
    .filter(m => modelTypeFilter === '全部' ? true : m.type === modelTypeFilter)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()) || m.series.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase()));

  const submitAdd = async () => {
    if (!form.name || !form.series) { showToast('请填写完整信息', 'warning'); return; }
    await api('/api/models', { method: 'POST', body: JSON.stringify({ ...form, type: 'model_app' }) });
    showToast('申请已提交，等待审核', 'success');
    setShowAdd(false); setForm({ brand: '骓特', series: '', code: '', name: '', category: '公路车' });
  };

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">车型标准库</h1><p className="page-subtitle">所有可用车型，新增需审核</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 申请新增车型</button>
      </div>
      <div className="card">
        {/* 筛选栏 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {MODEL_TYPES.map(t => (
            <label key={t} className={`option-item ${modelTypeFilter === t ? 'selected' : ''}`} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setModelTypeFilter(t)}>{t} {t !== '全部' && <span style={{ color: 'var(--text-4)', marginLeft: 4 }}>({models.filter(m => m.type === t).length})</span>}</label>
          ))}
          <input className="form-input" placeholder="搜索车型 / 系列 / 编号..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260, marginLeft: 'auto', padding: '7px 12px', fontSize: 13 }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>共 {filtered.length} 款</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><h3>暂无车型</h3><p>换个筛选条件试试</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th></th><th>编号</th><th>品牌</th><th>系列</th><th>名称</th><th>类别</th><th>定位</th><th>版本</th><th>状态</th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ width: 56, padding: '8px 12px' }}>
                    {m.image ? <img src={m.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-subtle)' }} /> : <div style={{ width: 40, height: 40, background: 'var(--bg-soft)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚲</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{m.code}</td>
                  <td>{m.brand}</td>
                  <td>{m.series}</td>
                  <td><strong>{m.name}</strong></td>
                  <td><span className="tag" style={{ background: m.type === '公路车' ? '#dbeafe' : m.type === '山地车' ? '#dcfce7' : m.type === '电助力' ? '#fef3c7' : '#ede9fe', border: 'none', color: 'var(--text-1)' }}>{m.type}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.position || '-'}</td>
                  <td>{m.versions?.length || 0}</td>
                  <td><StatusBadge status={m.status || 'active'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">申请新增车型</h3><button className="btn-ghost" onClick={() => setShowAdd(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">品牌</label>
                  <input className="form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">类别</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['公路车', '山地车', '折叠车', '电动车', 'BMX', '儿童车', '其他'].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">系列 *</label>
                  <input className="form-input" value={form.series} onChange={e => setForm({ ...form, series: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">编号</label>
                  <input className="form-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div className="form-group form-group-full"><label className="form-label">名称 *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitAdd}>提交申请</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============ 配置标准库 ============
export function ConfigsPage({ user, showToast }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: '轮组', code: '', name: '' });
  useEffect(() => { api<any[]>('/api/configs').then(setConfigs); }, []);

  const submitAdd = async () => {
    if (!form.name) { showToast('请填写名称', 'warning'); return; }
    await api('/api/configs', { method: 'POST', body: JSON.stringify({ ...form, type: 'config_app' }) });
    showToast('申请已提交，等待审核', 'success');
    setShowAdd(false); setForm({ type: '轮组', code: '', name: '' });
  };

  const types = [...new Set(configs.map(c => c.type))];

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">配置标准库</h1><p className="page-subtitle">轮组、套件、刹车、车架等可复用配置项</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 申请新增配置</button>
      </div>
      <div className="card">
        {types.map(t => {
          const items = configs.filter(c => c.type === t);
          return (
            <div key={t} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{t}（{items.length}项）</div>
              <div className="option-group">
                {items.map(c => <label key={c.id} className="option-item selected">{c.name}</label>)}
              </div>
            </div>
          );
        })}
        {configs.length === 0 && <div className="empty-state"><h3>暂无配置数据</h3></div>}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">申请新增配置</h3><button className="btn-ghost" onClick={() => setShowAdd(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">类型</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['轮组', '套件', '刹车', '车架', '把组', '颜色', '尺寸', '坐垫', '其他'].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">名称 *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitAdd}>提交申请</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============ 操作记录 ============
export function RecordsPage({ user }: { user: User; showToast: (m: string, t?: string) => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api<any>('/api/records').then(r => setRecords(r.records || [])); }, []);

  const filtered = filter === 'all' ? records : records.filter(r => r.targetType === filter);

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">操作记录</h1><p className="page-subtitle">系统内所有操作日志</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'demand', 'session', 'task', 'model', 'config'].map(f => (
            <button key={f} className={`btn-sm ${filter === f ? 'btn btn-primary' : 'btn btn-secondary'}`} onClick={() => setFilter(f)}>
              {f === 'all' ? '全部' : ({ demand: '需求', session: '场次', task: '任务', model: '车型', config: '配置' } as any)[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><h3>暂无记录</h3></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>对象</th><th>详情</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(r.time).toLocaleString('zh-CN', { hour12: false })}
                  </td>
                  <td>{r.user}</td>
                  <td>{r.action}</td>
                  <td>{r.targetType} #{r.targetId}</td>
                  <td style={{ maxWidth: 300, fontSize: 12 }}>{r.detail || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
