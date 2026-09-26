
/* ============================================================
   骓特自行车拍摄需求管理工作台 —— 单文件本地应用
   数据互通：车型库 → 需求 → 审批 → 排期 → 人员排班 → 计划视图
   持久化：localStorage（刷新不丢，各模块共享同一份数据）
   ============================================================ */

const STORE_KEY = 'zhuite_shoot_workbench_v1';

/* ---------- 车型主数据（同步自 WorkBuddy 资料库整车三合一表格合集，共 52 款） ---------- */
const RAW_MODELS = [
  // 公路车 25
  ["C5pro(26款)","公路车"],["C8pro(26款)","公路车"],["R10pro-碟刹(ET)","公路车"],["C6(26款)","公路车"],["Freedom","公路车"],
  ["R12pro平把特供(26款)","公路车"],["T10pro二代(26款)","公路车"],["STEALTHpro二代(26款)","公路车"],["R12pro特供(26款)","公路车"],["R15pro三代","公路车"],
  ["R18(竞速版)","公路车"],["R5pro终结版","公路车"],["T3(铁三TT)","公路车"],["R18(运动版)","公路车"],["R5pro二代","公路车"],
  ["T8pro二代(26款)","公路车"],["龙卷风CYCLONE-三代(105大套)","公路车"],["龙卷风CYCLONE-三代(R7120小套)","公路车"],["龙卷风CYCLONE-三代(ET)","公路车"],["龙卷风CYCLONE 三代（进阶版）UCI认证","公路车"],
  ["龙卷风CYCLONE-三代(3K版)","公路车"],["X7","公路车"],["龙卷风CYCLONE-三代(RS24)","公路车"],["T10 Ultra+GT（26YRS)","公路车"],["X7轮峰","公路车"],
  // 砾石车 9
  ["G2max平把","砾石车"],["Gravel V3","砾石车"],["G2max","砾石车"],["Gravel V1平把","砾石车"],["Gravel V1","砾石车"],
  ["Gravel V3平把","砾石车"],["Gravel X","砾石车"],["Gravel V3电变","砾石车"],["Gravel X平把","砾石车"],
  // 山地车 18（碳纤维 + 铝合金去重）
  ["KID20碳纤","山地车"],["LEOPARDpro","山地车"],["LEOPARDpro轻量版","山地车"],["M5山马版","山地车"],["M10","山地车"],
  ["M3桶轴版","山地车"],["M9","山地车"],["M5桶轴版","山地车"],["OVERLORD软尾","山地车"],["WARRIORpro桶轴版(25款)","山地车"],
  ["PREDATORpro桶轴版","山地车"],["WARRIORpro轻量版","山地车"],["GTR土坡车","山地车"],["ENDU150","山地车"],["MT390","山地车"],
  ["MT590","山地车"],["RIDER快拆版","山地车"],["RIDER桶轴版","山地车"]
];

const CATEGORY_COLOR = {"公路车":"#3a5fe0","砾石车":"#2f8f5a","山地车":"#b5711c"};

/* ---------- 角色与权限 ---------- */
const ROLES = {
  admin:   {name:"管理员", desc:"全部权限（审批/排期/排班/改状态）", initials:"A", can:{approve:1,schedule:1,editStatus:1,assignStaff:1,submit:1,editModels:1,manageConfigs:1,confirm:1}},
  reviewer:{name:"审核", desc:"审批需求、查看全部", initials:"R", can:{approve:1,schedule:0,editStatus:1,assignStaff:0,submit:0,editModels:0,manageConfigs:0,confirm:1}},
  shooter: {name:"拍摄", desc:"查看排班、更新拍摄进度", initials:"S", can:{approve:0,schedule:0,editStatus:0,assignStaff:0,submit:0,editModels:0,manageConfigs:0,confirm:0,updateSession:1}},
  submitter:{name:"业务", desc:"提交拍摄需求、查看自己需求", initials:"B", can:{approve:0,schedule:0,editStatus:0,assignStaff:0,submit:1,editModels:0,manageConfigs:0,confirm:0}},
  guest:   {name:"访客", desc:"只读预览", initials:"G", can:{approve:0,schedule:0,editStatus:0,assignStaff:0,submit:0,editModels:0,manageConfigs:0,confirm:0}},
};

/* ---------- 状态机 ---------- */
const STATUS = {
  draft:    {label:"草稿",   cls:"badge-draft"},
  pending:  {label:"待审批", cls:"badge-pending"},
  approved: {label:"已通过", cls:"badge-approved"},
  rejected: {label:"已驳回", cls:"badge-rejected"},
  scheduled:{label:"已排期", cls:"badge-scheduled"},
  shooting: {label:"拍摄中", cls:"badge-shooting"},
  done:     {label:"已完成", cls:"badge-done"},
  cancelled:{label:"已取消", cls:"badge-cancelled"},
};
const SESSION_STATUS = {scheduled:"已排期", shooting:"拍摄中", done:"已完成", cancelled:"已取消"};

/* ---------- 工具 ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fmtDate(d){const x=new Date(d+"T00:00:00");const y=x.getFullYear();const m=String(x.getMonth()+1).padStart(2,"0");const day=String(x.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
function todayStr(){return fmtDate(new Date());}
function addDays(n){const x=new Date();x.setDate(x.getDate()+n);return fmtDate(x);}
function weekday(d){const names=["周日","周一","周二","周三","周四","周五","周六"];return names[new Date(d+"T00:00:00").getDay()];}
function dateLabel(d){const t=todayStr();if(d===t)return"今天";if(d===addDays(1))return"明天";if(d===addDays(2))return"后天";return `${d.slice(5)} ${weekday(d)}`;}
function can(action){return !!ROLES[state.role].can[action];}

let toastTimer;
function toast(msg,type=""){const box=$("#toasts");const el=document.createElement("div");el.className="toast "+type;el.textContent=msg;box.appendChild(el);setTimeout(()=>{el.style.opacity="0";el.style.transform="translateY(8px)";setTimeout(()=>el.remove(),250);},2200);}

/* ---------- 导航定义 ---------- */
const NAV = [
  {group:"总览", items:[
    {path:"dashboard",label:"工作台",icon:"grid",badge:""},
    {path:"plan",label:"计划视图",icon:"calendar",badge:"plan"},
  ]},
  {group:"需求与审批", items:[
    {path:"demands",label:"需求总表",icon:"list",badge:"demands"},
    {path:"approvals",label:"审批流程",icon:"check",badge:"pending"},
    {path:"schedule",label:"拍摄排期",icon:"clock",badge:""},
  ]},
  {group:"资源与排班", items:[
    {path:"models",label:"车型标准库",icon:"bike",badge:""},
    {path:"staff",label:"人员排班",icon:"users",badge:""},
  ]},
];

/* ============================================================
   状态 / 持久化 / 种子数据
   ============================================================ */
let state = load() || seed();

function load(){try{const s=JSON.parse(localStorage.getItem(STORE_KEY));return s&&s.models?validate(s):null;}catch(e){return null;}}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function validate(s){
  s.role = ROLES[s.role]?s.role:"admin";
  s.models = s.models||[]; s.demands=s.demands||[]; s.sessions=s.sessions||[]; s.staff=s.staff||[]; s.log=s.log||[];
  return s;
}

function genConfigs(name,cat){
  const sets = {
    "公路车":[["基础版(铝合金)",{frame:"铝合金车架",group:"机械变速"}],["进阶版(碳架)",{frame:"碳纤维车架",group:"液压碟刹 105"}],["旗舰版(电变)",{frame:"高模碳架",group:"电子变速 ET"}]],
    "砾石车":[["平把版",{frame:"铝合金车架",group:"平把 1x"}],["弯把版",{frame:"碳纤维车架",group:"弯把 2x"}],["电变版",{frame:"碳架",group:"电子变速"}]],
    "山地车":[["铝合金版",{frame:"铝合金车架",group:"线控前叉"}],["碳纤维版",{frame:"碳纤维车架",group:"气压前叉"}],["速降版",{frame:"碳架",group:"双肩前叉"}]],
  }[cat] || [["标准版",{frame:"车架",group:"变速"}]];
  const base = cat==="公路车"?2999:cat==="砾石车"?3499:3999;
  return sets.map((c,i)=>({id:uid("c_"),name:c[0],specs:JSON.stringify(c[1]),price:base*(i+1)+ (i*500),status:"在售"}));
}

function seed(){
  const models = RAW_MODELS.map((m,i)=>({
    id:"m"+(i+1), code:"TW-"+String(i+1).padStart(3,"0"), name:m[0], category:m[1],
    brand:"TWITTER", series:m[1]==="公路车"?"ROAD":m[1]==="砾石车"?"GRAVEL":"MTB",
    status:"在售", remark:"同步自资料库配置单", configs:genConfigs(m[0],m[1])
  }));
  const staff = [
    {id:"u1",name:"陈昊",role:"摄影师",load:0},
    {id:"u2",name:"李婷",role:"摄影师",load:0},
    {id:"u3",name:"王锐",role:"摄影助理",load:0},
    {id:"u4",name:"周琳",role:"修图",load:0},
    {id:"u5",name:"赵宇",role:"外拍统筹",load:0},
  ];
  const demands=[]; const sessions=[];
  // 构造示例需求（覆盖各状态），日期相对今天
  const samples=[
    {model:1, region:"国内", submitter:"市场部-张琳", status:"pending",  cfg:[0], days:1},
    {model:6, region:"海外", submitter:"Overseas-Kevin", status:"pending", cfg:[1,2], days:2},
    {model:26,region:"国内", submitter:"电商部-刘洋", status:"approved", cfg:[0,1], days:2},
    {model:30,region:"海外", submitter:"Overseas-Mia", status:"approved", cfg:[2], days:3},
    {model:2, region:"国内", submitter:"市场部-张琳", status:"scheduled",cfg:[1], days:1, slot:"上午"},
    {model:9, region:"海外", submitter:"Overseas-Kevin", status:"scheduled",cfg:[0,2], days:4, slot:"全天"},
    {model:14,region:"国内", submitter:"展会组-孙琪", status:"shooting", cfg:[1], days:0, slot:"下午"},
    {model:33,region:"国内", submitter:"电商部-刘洋", status:"done",     cfg:[0], days:-3, slot:"上午"},
    {model:40,region:"海外", submitter:"Overseas-Mia", status:"rejected", cfg:[1], days:5},
    {model:18,region:"国内", submitter:"市场部-张琳", status:"cancelled",cfg:[0,2], days:6},
  ];
  samples.forEach((s,idx)=>{
    const m=models[s.model];
    const id="d"+(idx+1);
    const no="XQ-"+String(2026000+idx+1);
    const cfgIds=m.configs.filter((_,i)=>s.cfg.includes(i)).map(c=>c.id);
    const d={
      id, no, modelId:m.id, configIds:cfgIds, submitter:s.submitter, region:s.region,
      remark: s.status==="rejected"?"配置与现有素材重复，暂缓":"", priority: idx%2?"普通":"加急",
      status:s.status, confirmed: (s.status==="approved"||s.status==="scheduled"||s.status==="shooting"||s.status==="done"),
      scheduleDate: (s.status==="scheduled"||s.status==="shooting"||s.status==="done")?addDays(s.days):"",
      createdAt: addDays(-(idx+2)), history:[{ts:addDays(-(idx+2)),text:`由 ${s.submitter} 提交需求`,by:s.submitter}]
    };
    demands.push(d);
    if(s.status==="scheduled"||s.status==="shooting"||s.status==="done"){
      const sid="s"+(idx+1);
      sessions.push({id:sid,demandId:id,modelId:m.id,date:d.scheduleDate,slot:s.slot||"全天",shooterId:(idx%5)+1,status:s.status==="done"?"done":s.status==="shooting"?"shooting":"scheduled",note:""});
    }
  });
  const log=[{ts:addDays(-1),text:"系统初始化：导入 52 款车型标准库",by:"系统"}];
  return {role:"admin",models,demands,sessions,staff,log};
}

/* ---------- 业务动作（带一致性维护） ---------- */
function log(text,by){state.log.unshift({ts:todayStr(),text,by:by||ROLES[state.role].name});}
function modelById(id){return state.models.find(m=>m.id===id);}
function demandById(id){return state.demands.find(d=>d.id===id);}
function sessionById(id){return state.sessions.find(s=>s.id===id);}

function approveDemand(id,note){
  const d=demandById(id); if(!d||d.status!=="pending")return;
  d.status="approved"; d.confirmed=true;
  d.history.push({ts:todayStr(),text:"审核通过"+(note?`：${note}`:""),by:ROLES[state.role].name});
  log(`需求 ${d.no} 审核通过`,"审核");
  save();renderAll();toast("已通过："+d.no,"ok");
}
function rejectDemand(id,note){
  const d=demandById(id); if(!d||d.status!=="pending")return;
  d.status="rejected";
  d.history.push({ts:todayStr(),text:"审核驳回"+(note?`：${note}`:""),by:ROLES[state.role].name});
  log(`需求 ${d.no} 被驳回`,"审核");
  save();renderAll();toast("已驳回："+d.no,"warn");
}
function scheduleDemand(id,date,slot){
  const d=demandById(id); if(!d)return;
  d.status="scheduled"; d.scheduleDate=date;
  if(!d.confirmed)d.confirmed=true;
  let s=state.sessions.find(x=>x.demandId===id);
  if(!s){s={id:uid("s_"),demandId:id,modelId:d.modelId,date,slot:slot||"全天",shooterId:"",status:"scheduled",note:""};state.sessions.push(s);}
  else{s.date=date;s.slot=slot||s.slot;s.status="scheduled";}
  d.history.push({ts:todayStr(),text:`排期至 ${date} ${slot||""}`,by:ROLES[state.role].name});
  log(`需求 ${d.no} 已排期 ${date}`,"排期");
  save();renderAll();toast("已排期："+d.no,"ok");
}
function setStatus(id,status){
  const d=demandById(id); if(!d)return;
  if(status==="cancelled"){d.status="cancelled";state.sessions=state.sessions.filter(s=>s.demandId!==id);}
  else d.status=status;
  if(status==="scheduled"&&!d.scheduleDate)d.scheduleDate=addDays(2);
  d.history.push({ts:todayStr(),text:`状态调整为「${STATUS[status].label}」`,by:ROLES[state.role].name});
  log(`需求 ${d.no} → ${STATUS[status].label}`,"管理员");
  save();renderAll();toast("状态已更新");
}
function toggleConfirm(id,val){
  const d=demandById(id); if(!d)return; d.confirmed=val;
  save();renderAll();
}
function setScheduleDate(id,date){
  const d=demandById(id); if(!d)return; d.scheduleDate=date;
  if(date&&(d.status==="approved")){d.status="scheduled";let s=state.sessions.find(x=>x.demandId===id);if(!s){s={id:uid("s_"),demandId:id,modelId:d.modelId,date,slot:"全天",shooterId:"",status:"scheduled",note:""};state.sessions.push(s);}else{s.date=date;}}
  save();renderAll();
}
function assignStaff(sessionId,shooterId){
  const s=sessionById(sessionId); if(!s)return; s.shooterId=shooterId;
  const d=demandById(s.demandId); if(d)d.history.push({ts:todayStr(),text:`分配拍摄人员：${staffName(shooterId)}`,by:ROLES[state.role].name});
  log(`场次排班：${staffName(shooterId)}`,"排班");
  save();renderAll();toast("排班已保存","ok");
}
function updateSession(sessionId,status){
  const s=sessionById(sessionId); if(!s)return; s.status=status;
  const d=demandById(s.demandId); if(d){d.status=status;d.history.push({ts:todayStr(),text:`拍摄进度更新为「${SESSION_STATUS[status]}」`,by:ROLES[state.role].name});}
  log(`场次 ${s.id} → ${SESSION_STATUS[status]}`,"拍摄");
  save();renderAll();toast("进度已更新");
}
function staffName(id){const s=state.staff.find(x=>x.id===id);return s?s.name:"未分配";}
function sessConfirmCell(s){
  if(can("updateSession")||can("editStatus")){
    const opt=(v)=>`<option value="${v}" ${s.status===v?"selected":""}>${v}</option>`;
    return `<select class="select" data-sess-status="${s.id}" style="width:auto;padding:5px 8px;font-size:12px">${opt("scheduled")}${opt("shooting")}${opt("done")}${opt("cancelled")}</select>`;
  }
  if(s.status==="done")return '<span style="color:var(--success)">✓ 已交付</span>';
  return '<span class="muted">待执行</span>';
}
function addDemand(form){
  const m=modelById(form.modelId); if(!m)return;
  const id=uid("d_"); const no="XQ-"+String(2026000+state.demands.length+1);
  const d={id,no,modelId:m.id,configIds:form.configIds,submitter:form.submitter,region:form.region,
    remark:form.remark,priority:form.priority||"普通",status:"pending",confirmed:false,scheduleDate:"",
    createdAt:todayStr(),history:[{ts:todayStr(),text:`由 ${form.submitter} 提交需求`,by:form.submitter}]};
  state.demands.unshift(d); log(`新需求 ${no}（${m.name}）提交`,form.submitter);
  save();renderAll();toast("需求已提交："+no,"ok");
}
function addModel(form){
  const id=uid("m_"); const code="TW-"+String(state.models.length+1).padStart(3,"0");
  const m={id,code,name:form.name,category:form.category,brand:"TWITTER",series:form.category==="公路车"?"ROAD":form.category==="砾石车"?"GRAVEL":"MTB",status:"在售",remark:form.remark||"",configs:[]};
  state.models.push(m); log(`新增车型 ${form.name}`,"车型库");
  save();renderAll();toast("车型已添加："+form.name,"ok");
}
function addConfig(modelId,form){
  const m=modelById(modelId); if(!m)return;
  m.configs.push({id:uid("c_"),name:form.name,specs:JSON.stringify({frame:form.frame||"",group:form.group||""}),price:Number(form.price)||0,status:"在售"});
  log(`车型 ${m.name} 新增配置 ${form.name}`,"车型库");
  save();renderAll();toast("配置已添加","ok");
}
function delConfig(modelId,cfgId){
  const m=modelById(modelId); if(!m)return;
  m.configs=m.configs.filter(c=>c.id!==cfgId);
  // 同步移除需求中引用
  state.demands.forEach(d=>{d.configIds=d.configIds.filter(id=>id!==cfgId);});
  log(`车型 ${m.name} 删除配置`,"车型库"); save();renderAll();toast("配置已删除","warn");
}

/* ============================================================
   渲染
   ============================================================ */
function renderAll(){renderNav();renderView();}
function renderNav(){
  const nav=$("#nav"); const cur=(location.hash.slice(2)||"dashboard");
  let html="";
  NAV.forEach(g=>{
    html+=`<div class="nav-group">${g.group}</div>`;
    g.items.forEach(it=>{
      const cnt=badgeCount(it.badge);
      const active=cur===it.path?"active":"";
      html+=`<div class="nav-item ${active}" data-nav="${it.path}">
        <span class="ic">${ICON[it.icon]||""}</span><span>${it.label}</span>
        ${cnt?`<span class="count">${cnt}</span>`:""}
      </div>`;
    });
  });
  nav.innerHTML=html;
  // 角色
  const r=ROLES[state.role];
  $("#roleAvatar").textContent=r.initials;
  $("#roleName").textContent=r.name; $("#roleDesc").textContent=r.desc;
  const sel=$("#roleSelect"); if(!sel.dataset.filled){sel.innerHTML=Object.keys(ROLES).map(k=>`<option value="${k}">${ROLES[k].name}</option>`).join("");sel.dataset.filled="1";}
  sel.value=state.role;
}
function badgeCount(kind){
  if(kind==="demands")return state.demands.filter(d=>d.status!=="cancelled").length;
  if(kind==="pending")return state.demands.filter(d=>d.status==="pending").length;
  if(kind==="plan")return state.sessions.filter(s=>s.date>=todayStr()&&s.date<=addDays(7)&&s.status!=="cancelled").length;
  return "";
}
function renderView(){
  const cur=(location.hash.slice(2)||"dashboard");
  const titles={dashboard:"工作台",plan:"计划视图",demands:"需求总表",approvals:"审批流程",schedule:"拍摄排期",models:"车型标准库",staff:"人员排班"};
  $("#pageTitle").textContent=titles[cur]||"工作台";
  $("#todayLabel").textContent=todayStr()+" "+weekday(todayStr());
  const v=$("#view"); v.classList.remove("view"); void v.offsetWidth; v.classList.add("view");
  const map={dashboard:viewDashboard,plan:viewPlan,demands:viewDemands,approvals:viewApprovals,schedule:viewSchedule,models:viewModels,staff:viewStaff};
  (map[cur]||viewDashboard)(v);
}

/* ---------- 工作台 ---------- */
function viewDashboard(v){
  const totalModels=state.models.length;
  const pending=state.demands.filter(d=>d.status==="pending").length;
  const approved=state.demands.filter(d=>d.status==="approved").length;
  const scheduled=state.demands.filter(d=>d.status==="scheduled").length;
  const shooting=state.demands.filter(d=>d.status==="shooting").length;
  const done=state.demands.filter(d=>d.status==="done").length;
  const week=state.sessions.filter(s=>s.date>=todayStr()&&s.date<=addDays(7)&&s.status!=="cancelled").length;
  const cats={};state.models.forEach(m=>cats[m.category]=(cats[m.category]||0)+1);
  const totalCfg=state.models.reduce((a,m)=>a+m.configs.length,0);

  v.innerHTML=`
  <div class="kpi-grid mb16">
    ${kpi("车型总数",totalModels,`配置项 ${totalCfg} 个`,'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h4l4 9M10 8l2-3 2 3"/></svg>')}
    ${kpi("待审批",pending,"需管理员处理",'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5711c" stroke-width="2"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>')}
    ${kpi("已排期",scheduled,"拍摄场次待执行",'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2b6cb0" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>')}
    ${kpi("本周拍摄",week,"未来 7 天",'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a5fe0" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>')}
    ${kpi("已完成",done,"累计交付",'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f8f5a" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>')}
  </div>
  <div class="grid-2">
    <div class="card card-pad">
      <h3 class="card-title">需求状态分布</h3>
      <p class="card-sub">全流程：提交 → 审批 → 排期 → 拍摄 → 交付</p>
      <div class="mt16">
        ${statusBar([["pending",pending],["approved",approved],["scheduled",scheduled],["shooting",shooting],["done",done]])}
      </div>
      <div class="divider"></div>
      <div class="stat-inline">
        <div class="s"><b>${cats["公路车"]||0}</b>公路车</div>
        <div class="s"><b>${cats["砾石车"]||0}</b>砾石车</div>
        <div class="s"><b>${cats["山地车"]||0}</b>山地车</div>
        <div class="s"><b>${totalCfg}</b>配置项</div>
      </div>
    </div>
    <div class="card card-pad">
      <div class="row between mb12"><h3 class="card-title">最近动态</h3><span class="small muted">${state.log.length} 条</span></div>
      <div class="timeline">
        ${state.log.slice(0,8).map(l=>`<div class="tl-item"><div class="tl-t">${escapeHtml(l.text)}</div><div class="tl-m">${l.ts} · ${escapeHtml(l.by)}</div></div>`).join("")}
      </div>
    </div>
  </div>`;
}
function kpi(label,num,delta,icon){
  return `<div class="card kpi"><div class="label">${icon||""}${label}</div><div class="num">${num}</div><div class="delta muted">${delta}</div></div>`;
}
function statusBar(arr){
  const total=arr.reduce((a,b)=>a+b[1],0)||1;
  return `<div class="row" style="gap:0;height:10px;border-radius:999px;overflow:hidden;background:var(--bg-soft)">`+
    arr.map(([k,val])=>val?`<div style="flex:${val};background:var(${statusColor(k)})" title="${STATUS[k].label}:${val}"></div>`:"").join("")+
    `</div><div class="row row-wrap mt12" style="gap:14px">`+
    arr.map(([k,val])=>`<div class="row" style="gap:6px"><span style="width:9px;height:9px;border-radius:2px;background:var(${statusColor(k)})"></span><span class="small muted">${STATUS[k].label} ${val}</span></div>`).join("")+
    `</div>`;
}
function statusColor(k){return {"pending":"--warning","approved":"--success","scheduled":"--info","shooting":"--purple","done":"#1f7a4d","rejected":"--danger","cancelled":"--ink-5"}[k]||"--brand-500";}

/* ---------- 车型标准库 ---------- */
let modelFilter={cat:"全部",q:""};
function viewModels(v){
  const cats=["全部","公路车","砾石车","山地车"];
  let list=state.models;
  if(modelFilter.cat!=="全部")list=list.filter(m=>m.category===modelFilter.cat);
  if(modelFilter.q){const q=modelFilter.q.toLowerCase();list=list.filter(m=>m.name.toLowerCase().includes(q)||m.code.toLowerCase().includes(q));}
  v.innerHTML=`
  <div class="row between mb16 row-wrap">
    <div class="tabs">${cats.map(c=>`<div class="tab ${modelFilter.cat===c?'active':''}" data-mcat="${c}">${c}</div>`).join("")}</div>
    <div class="row" style="gap:10px">
      <div class="search">${ICON.search}<input class="input" id="modelSearch" placeholder="搜索车型 / 编码" value="${escapeHtml(modelFilter.q)}"></div>
      ${can("editModels")?`<button class="btn btn-primary btn-sm" data-action="new-model">+ 新增车型</button>`:""}
    </div>
  </div>
  <div class="model-grid">
    ${list.map(m=>`
      <div class="card model-card" data-model="${m.id}">
        <div class="top">
          <div>
            <div class="mname">${escapeHtml(m.name)}</div>
            <div class="mcode">${m.code} · ${m.category}</div>
          </div>
          <span class="cat-dot" style="background:${CATEGORY_COLOR[m.category]}"></span>
        </div>
        <div class="mbody">
          <span class="cfg-count">${m.configs.length} 个配置</span>
          <span class="small muted" style="margin-left:auto">点击管理 →</span>
        </div>
      </div>`).join("")}
  </div>
  ${list.length===0?`<div class="empty">未找到匹配车型</div>`:""}`;
}

/* ---------- 需求总表 ---------- */
let demandFilter={q:"",status:"全部",mine:false};
function viewDemands(v){
  let list=state.demands.slice();
  if(demandFilter.status!=="全部")list=list.filter(d=>d.status===demandFilter.status);
  if(demandFilter.q){const q=demandFilter.q.toLowerCase();list=list.filter(d=>{const m=modelById(d.modelId);return (d.no.toLowerCase().includes(q))||(m&&m.name.toLowerCase().includes(q))||(d.submitter.toLowerCase().includes(q));});}
  const statuses=["全部","pending","approved","rejected","scheduled","shooting","done","cancelled"];
  v.innerHTML=`
  <div class="row between mb16 row-wrap">
    <div class="tabs">${statuses.map(s=>`<div class="tab ${demandFilter.status===s?'active':''}" data-dstatus="${s}">${s==="全部"?"全部":STATUS[s].label}</div>`).join("")}</div>
    <div class="row" style="gap:10px">
      <div class="search">${ICON.search}<input class="input" id="demandSearch" placeholder="需求号 / 车型 / 提报人" value="${escapeHtml(demandFilter.q)}"></div>
      ${can("submit")?`<button class="btn btn-primary btn-sm" data-action="new-demand">+ 新建需求</button>`:""}
    </div>
  </div>
  <div class="card"><div style="overflow-x:auto">
  <table class="data-table">
    <thead><tr>
      <th>需求号</th><th>车型</th><th>配置</th><th>提报人 / 区域</th><th>优先级</th><th>状态</th>
      <th>确认</th><th>排期日期</th><th>操作</th>
    </tr></thead>
    <tbody>
      ${list.length?list.map(d=>demandRow(d)).join(""):`<tr><td colspan="9"><div class="empty">暂无需求</div></td></tr>`}
    </tbody>
  </table></div></div>`;
}
function demandRow(d){
  const m=modelById(d.modelId);
  const cfgs=d.configIds.map(id=>{const c=m&&m.configs.find(x=>x.id===id);return c?c.name:"?";}).join("、")||"—";
  const admin=can("editStatus");
  return `<tr>
    <td class="mono nowrap">${d.no}</td>
    <td><b>${m?escapeHtml(m.name):"?"}</b><div class="small muted">${m?m.code:""}</div></td>
    <td>${escapeHtml(cfgs)}</td>
    <td>${escapeHtml(d.submitter)}<br><span class="badge-region ${d.region==="海外"?"overseas":""}">${d.region}</span></td>
    <td>${d.priority==="加急"?'<span style="color:var(--danger);font-weight:600">加急</span>':"普通"}</td>
    <td><span class="badge ${STATUS[d.status].cls}">${STATUS[d.status].label}</span></td>
    <td>${admin?`<label class="switch"><input type="checkbox" data-confirm="${d.id}" ${d.confirmed?"checked":""}><span class="slider"></span></label>`:(d.confirmed?'<span style="color:var(--success)">✓</span>':"<span class='muted'>—</span>")}</td>
    <td>${admin?`<input type="date" class="input" style="width:auto;padding:5px 8px;font-size:12px" data-sdate="${d.id}" value="${d.scheduleDate}">`:(d.scheduleDate||"<span class='muted'>—</span>")}</td>
    <td class="nowrap">${demandOps(d)}</td>
  </tr>`;
}
function demandOps(d){
  let h="";
  if(can("approve")&&d.status==="pending"){h+=`<button class="btn btn-primary btn-xs" data-approve="${d.id}">通过</button> <button class="btn btn-danger btn-xs" data-reject="${d.id}">驳回</button>`;}
  else if(can("schedule")&&d.status==="approved"){h+=`<button class="btn btn-secondary btn-xs" data-tosched="${d.id}">排期</button>`;}
  if(can("editStatus")&&d.status!=="done"&&d.status!=="cancelled"){h+=` <button class="btn btn-ghost btn-xs" data-cancel="${d.id}">取消</button>`;}
  h+=` <button class="btn btn-link btn-xs" data-detail="${d.id}">详情</button>`;
  return h||'<span class="muted small">—</span>';
}

/* ---------- 审批流程 ---------- */
function viewApprovals(v){
  const pending=state.demands.filter(d=>d.status==="pending");
  const handled=state.demands.filter(d=>d.status==="approved"||d.status==="rejected").slice(0,12);
  v.innerHTML=`
  <div class="card card-pad mb16">
    <div class="row between mb12"><h3 class="card-title">待审批 <span class="badge badge-pending">${pending.length}</span></h3>
    <span class="small muted">${can("approve")?"你拥有审批权限，可决定通过或驳回":"当前角色无审批权限（只读）"}</span></div>
    ${pending.length?`<div class="row row-wrap" style="gap:12px">`+pending.map(d=>{
      const m=modelById(d.modelId);const cfgs=d.configIds.map(id=>{const c=m.configs.find(x=>x.id===id);return c?c.name:"";}).join("、");
      return `<div class="card card-pad" style="flex:1;min-width:280px">
        <div class="row between"><b>${escapeHtml(m.name)}</b><span class="badge badge-pending">待审批</span></div>
        <div class="small muted mt8">${d.no} · ${escapeHtml(d.submitter)} · ${d.region} · ${d.priority}</div>
        <div class="small mt8">配置：${escapeHtml(cfgs)||"—"}</div>
        ${d.remark?`<div class="small mt8" style="color:var(--ink-3)">备注：${escapeHtml(d.remark)}</div>`:""}
        <div class="row mt12" style="gap:8px">
          ${can("approve")?`<button class="btn btn-primary btn-sm" data-approve="${d.id}">通过</button><button class="btn btn-danger btn-sm" data-reject="${d.id}">驳回</button>`:`<span class="small muted">等待审批…</span>`}
        </div>
      </div>`;}).join("")+`</div>`:`<div class="empty">🎉 暂无待审批需求</div>`}
  </div>
  <div class="card card-pad">
    <h3 class="card-title">近期审批记录</h3>
    <div class="timeline mt12">
      ${handled.map(d=>`<div class="tl-item"><div class="tl-t">${d.no} · ${escapeHtml(modelById(d.modelId)?.name||"")} <span class="badge ${STATUS[d.status].cls}">${STATUS[d.status].label}</span></div><div class="tl-m">${d.submitter} · ${d.history[d.history.length-1]?.ts||""}</div></div>`).join("")||'<div class="empty">暂无记录</div>'}
    </div>
  </div>`;
}

/* ---------- 拍摄排期 ---------- */
function viewSchedule(v){
  const todo=state.demands.filter(d=>d.status==="approved");
  const scheduled=state.sessions.slice().sort((a,b)=>a.date.localeCompare(b.date));
  v.innerHTML=`
  <div class="card card-pad mb16">
    <div class="row between mb12"><h3 class="card-title">待排期需求 <span class="badge badge-approved">${todo.length}</span></h3>
    <span class="small muted">${can("schedule")?"选择日期与时段即可排期，自动生成拍摄场次":"只读"}</span></div>
    ${todo.length?`<div class="row row-wrap" style="gap:12px">`+todo.map(d=>{
      const m=modelById(d.modelId);return `<div class="card card-pad" style="flex:1;min-width:260px">
        <b>${escapeHtml(m.name)}</b><div class="small muted mt8">${d.no} · ${escapeHtml(d.submitter)}</div>
        ${can("schedule")?`<div class="row mt12" style="gap:8px"><input type="date" class="input" style="width:auto;padding:5px 8px;font-size:12px" data-sched-date="${d.id}"><select class="select" data-sched-slot="${d.id}" style="width:auto"><option>上午</option><option>下午</option><option>全天</option></select><button class="btn btn-primary btn-xs" data-dosched="${d.id}">排期</button></div>`:""}
      </div>`;}).join("")+`</div>`:`<div class="empty">暂无待排期需求</div>`}
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="data-table"><thead><tr><th>拍摄日期</th><th>时段</th><th>需求号</th><th>车型</th><th>拍摄人员</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>
      ${scheduled.length?scheduled.map(s=>{
        const d=demandById(s.demandId);const m=modelById(s.modelId);
        return `<tr>
          <td class="mono">${s.date}<div class="small muted">${dateLabel(s.date)}</div></td>
          <td>${s.slot}</td><td class="mono">${d?d.no:"-"}</td><td>${m?escapeHtml(m.name):"-"}</td>
          <td>${can("assignStaff")?`<select class="select" data-assign="${s.id}" style="width:auto;padding:5px 8px;font-size:12px"><option value="">未分配</option>${state.staff.map(st=>`<option ${s.shooterId===st.id?"selected":""} value="${st.id}">${st.name}</option>`).join("")}</select>`:staffName(s.shooterId)}</td>
          <td><span class="badge badge-${s.status}">${SESSION_STATUS[s.status]}</span></td>
          <td class="nowrap">${can("assignStaff")&&!s.shooterId?'<span class="small muted">待排班</span>':(s.shooterId?'<span class="small" style="color:var(--success)">已排班</span>':'<span class="small muted">—</span>')}</td>
        </tr>`;}).join(""):`<tr><td colspan="7"><div class="empty">暂无拍摄场次</div></td></tr>`}
    </tbody></table></div></div>`;
}

/* ---------- 计划视图 ---------- */
function viewPlan(v){
  const t=todayStr();
  const today=state.sessions.filter(s=>s.date===t&&s.status!=="cancelled");
  const tmr=state.sessions.filter(s=>s.date===addDays(1)&&s.status!=="cancelled");
  const week=state.sessions.filter(s=>s.date>t&&s.date<=addDays(7)&&s.status!=="cancelled").sort((a,b)=>a.date.localeCompare(b.date));
  const monthSessions=state.sessions.filter(s=>s.status!=="cancelled");
  // 月历
  const now=new Date();const y=now.getFullYear();const mo=now.getMonth();
  const first=new Date(y,mo,1).getDay();const days=new Date(y,mo+1,0).getDate();
  const byDate={};monthSessions.forEach(s=>{if(s.date.startsWith(`${y}-${String(mo+1).padStart(2,"0")}`)){byDate[s.date]=(byDate[s.date]||0)+1;}});
  let cal=`<div class="cal">`;
  ["日","一","二","三","四","五","六"].forEach(w=>`<div class="cal-h">${w}</div>`);
  for(let i=0;i<first;i++)cal+=`<div class="cal-d empty"></div>`;
  for(let d=1;d<=days;d++){const ds=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const has=byDate[ds];const cls=ds===t?"cal-d today":(has?"cal-d has":"cal-d");cal+=`<div class="${cls}">${d}${has?`<span class="dot"></span>`:""}</div>`;}
  cal+=`</div>`;
  v.innerHTML=`
  <div class="card card-pad mb16"><h3 class="card-title">${y}年 ${mo+1}月 拍摄总览</h3>
    <p class="card-sub">本月已排拍摄场次 ${Object.values(byDate).reduce((a,b)=>a+b,0)} 天有安排</p>
    <div class="mt16">${cal}</div>
  </div>
  <div class="plan-sections">
    <div class="card card-pad">
      <h3 class="card-title">今日 / 明日</h3>
      <div class="mt12">${planBlock(t,today)}</div>
      <div class="divider"></div>
      <div class="mt12">${planBlock(addDays(1),tmr)}</div>
    </div>
    <div class="card card-pad">
      <h3 class="card-title">未来一周</h3>
      <div class="mt12">${week.length?week.map(s=>{
        const m=modelById(s.modelId);const d=demandById(s.demandId);
        return `<div class="plan-item"><span class="badge badge-${s.status}">${s.slot}</span><div class="grow"><b>${m?escapeHtml(m.name):"?"}</b><div class="small muted">${d?d.no:""} · ${staffName(s.shooterId)}</div></div><span class="slot">${dateLabel(s.date)}</span></div>`;
      }).join(""):`<div class="empty">未来一周暂无安排</div>`}</div>
    </div>
  </div>`;
}
function planBlock(date,sessions){
  const head=`<div class="row" style="gap:8px;margin-bottom:8px"><span style="font-weight:600">${dateLabel(date)}</span><span class="small muted">${date} ${weekday(date)}</span></div>`;
  if(!sessions.length)return head+`<div class="empty" style="padding:16px">无安排</div>`;
  return head+sessions.map(s=>{const m=modelById(s.modelId);const d=demandById(s.demandId);return `<div class="plan-item"><span class="badge badge-${s.status}">${s.slot}</span><div class="grow"><b>${m?escapeHtml(m.name):"?"}</b><div class="small muted">${d?d.no:""} · ${staffName(s.shooterId)}</div></div></div>`;}).join("");
}

/* ---------- 人员排班 ---------- */
function viewStaff(v){
  const loads={};state.staff.forEach(s=>loads[s.id]=0);
  state.sessions.forEach(s=>{if(s.shooterId&&s.status!=="cancelled"&&s.status!=="done")loads[s.shooterId]=(loads[s.shooterId]||0)+1;});
  const maxLoad=Math.max(1,...Object.values(loads));
  v.innerHTML=`
  <div class="card card-pad mb16">
    <h3 class="card-title">拍摄人员负载</h3>
    <p class="card-sub">统计未完成的已排期场次，便于均衡排班</p>
    <div class="mt12">${state.staff.map(st=>`
      <div class="staff-row">
        <div class="avatar">${st.name[0]}</div>
        <div style="width:90px"><div class="staff-name">${st.name}</div><div class="small muted">${st.role}</div></div>
        <div class="load-bar"><i style="width:${Math.round(loads[st.id]/maxLoad*100)}%"></i></div>
        <span class="small muted nowrap">${loads[st.id]} 场待拍</span>
      </div>`).join("")}</div>
  </div>
  <div class="card"><div style="overflow-x:auto">
    <table class="data-table"><thead><tr><th>日期</th><th>需求号</th><th>车型</th><th>拍摄人员</th><th>状态</th><th>确认</th></tr></thead>
    <tbody>
      ${state.sessions.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(s=>{
        const d=demandById(s.demandId);const m=modelById(s.modelId);
        return `<tr>
          <td class="mono">${s.date}</td><td class="mono">${d?d.no:"-"}</td><td>${m?escapeHtml(m.name):"-"}</td>
          <td>${can("assignStaff")?`<select class="select" data-assign="${s.id}" style="width:auto;padding:5px 8px;font-size:12px"><option value="">未分配</option>${state.staff.map(st=>`<option ${s.shooterId===st.id?"selected":""} value="${st.id}">${st.name}</option>`).join("")}</select>`:staffName(s.shooterId)}</td>
          <td><span class="badge badge-${s.status}">${SESSION_STATUS[s.status]}</span></td>
          <td>${can("updateSession")?`<select class="select" data-sess-status="${s.id}" style="width:auto;padding:5px 8px;font-size:12px"><option ${s.status==="scheduled"?"selected":""}>scheduled</option><option ${s.status==="shooting"?"selected":""}>shooting</option><option ${s.status==="done"?"selected":""}>done</option><option ${s.status==="cancelled"?"selected":""}>cancelled</option></select>`:sessConfirmCell(s)}</td>
        </tr>`;}).join("")||`<tr><td colspan="6"><div class="empty">暂无场次</div></td></tr>`}
    </tbody></table></div></div>`;
}

/* ============================================================
   抽屉 / 弹窗
   ============================================================ */
function openDrawer(title,bodyHtml,footHtml){$("#drawerHead").innerHTML=`<h3>${title}</h3><button class="icon-btn" data-close="1">${ICON.x}</button>`;$("#drawerBody").innerHTML=bodyHtml;$("#drawerFoot").innerHTML=footHtml||"";$("#drawer").classList.add("show");$("#scrim").classList.add("show");}
function openModal(title,bodyHtml,footHtml){$("#modalHead").innerHTML=`<h3>${title}</h3><button class="icon-btn" data-close="1">${ICON.x}</button>`;$("#modalBody").innerHTML=bodyHtml;$("#modalFoot").innerHTML=footHtml||"";$("#modal").classList.add("show");$("#scrim").classList.add("show");}
function closeOverlays(){$("#drawer").classList.remove("show");$("#modal").classList.remove("show");$("#scrim").classList.remove("show");}

/* 车型详情 + 配置管理 */
function openModelDetail(id){
  const m=modelById(id); if(!m)return;
  const body=`
    <div class="stat-inline mb16"><div class="s"><b>${m.code}</b>编码</div><div class="s"><b>${m.category}</b>类别</div><div class="s"><b>${m.configs.length}</b>配置项</div><div class="s"><b>${m.status}</b>状态</div></div>
    <div class="row between mb12"><h4 style="margin:0;font-size:14px">配置项管理</h4>${can("manageConfigs")?`<button class="btn btn-secondary btn-xs" data-addcfg="${m.id}">+ 新增配置</button>`:""}</div>
    ${m.configs.length?`<div class="row col" style="gap:10px">`+m.configs.map(c=>{
      const sp=JSON.parse(c.specs||"{}");
      return `<div class="card card-pad" style="padding:12px 14px">
        <div class="row between"><b>${escapeHtml(c.name)}</b><span class="mono small">¥${c.price}</span></div>
        <div class="small muted mt8">${escapeHtml(sp.frame||"")} · ${escapeHtml(sp.group||"")}</div>
        ${can("manageConfigs")?`<div class="row mt8" style="gap:8px"><button class="btn btn-ghost btn-xs" data-delcfg="${m.id}|${c.id}">删除</button></div>`:""}
      </div>`;}).join("")+`</div>`:`<div class="empty">暂无配置项，点击右上角新增</div>`}
  `;
  const foot=can("editModels")?`<button class="btn btn-secondary" data-close="1">关闭</button>`:`<button class="btn btn-primary" data-close="1">知道了</button>`;
  openDrawer(escapeHtml(m.name)+" · 车型详情",body,foot);
}

/* 需求详情 + 历史 */
function openDemandDetail(id){
  const d=demandById(id); if(!d)return;const m=modelById(d.modelId);
  const cfgs=d.configIds.map(cid=>{const c=m.configs.find(x=>x.id===cid);return c?c.name:"";}).filter(Boolean).join("、")||"—";
  const body=`
    <div class="stat-inline mb16">
      <div class="s"><b>${d.no}</b>需求号</div><div class="s"><b>${m?escapeHtml(m.name):"?"}</b>车型</div>
      <div class="s"><b>${escapeHtml(d.submitter)}</b>提报人</div><div class="s"><b>${d.region}</b>区域</div>
      <div class="s"><b>${d.priority}</b>优先级</div><div class="s"><b>${d.confirmed?"已确认":"未确认"}</b>确认</div>
    </div>
    <div class="field"><label>配置项</label><div>${escapeHtml(cfgs)}</div></div>
    ${d.scheduleDate?`<div class="field"><label>排期日期</label><div class="mono">${d.scheduleDate}</div></div>`:""}
    ${d.remark?`<div class="field"><label>备注</label><div>${escapeHtml(d.remark)}</div></div>`:""}
    <div class="divider"></div>
    <h4 style="margin:0 0 10px;font-size:14px">处理记录</h4>
    <div class="timeline">${d.history.slice().reverse().map(h=>`<div class="tl-item"><div class="tl-t">${escapeHtml(h.text)}</div><div class="tl-m">${h.ts}${h.by?" · "+escapeHtml(h.by):""}</div></div>`).join("")}</div>
  `;
  const foot=`<button class="btn btn-primary" data-close="1">关闭</button>`;
  openDrawer("需求详情",body,foot);
}

/* 新建需求表单 */
function openNewDemand(){
  const body=`
    <div class="field"><label>选择车型 *</label><select class="select" id="ndModel">${state.models.map(m=>`<option value="${m.id}">${escapeHtml(m.name)}（${m.category}）</option>`).join("")}</select><div class="hint">车型来自「车型标准库」，可在该模块新增</div></div>
    <div class="field"><label>选择配置项（可多选）</label><div id="ndConfigs" class="row col" style="gap:8px"></div><div class="hint">勾选该车型下需要拍摄的具体配置</div></div>
    <div class="grid-2">
      <div class="field"><label>提报人 *</label><input class="input" id="ndSubmitter" placeholder="如：市场部-张琳 / Overseas-Kevin"></div>
      <div class="field"><label>区域</label><select class="select" id="ndRegion"><option>国内</option><option>海外</option></select></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>优先级</label><select class="select" id="ndPriority"><option>普通</option><option>加急</option></select></div>
      <div class="field"><label>期望日期</label><input type="date" class="input" id="ndWant" value="${addDays(3)}"></div>
    </div>
    <div class="field"><label>备注</label><textarea class="textarea" id="ndRemark" placeholder="拍摄要点、场景、参考样式…"></textarea></div>
  `;
  const foot=`<button class="btn btn-secondary" data-close="1">取消</button><button class="btn btn-primary" id="ndSubmit">提交需求</button>`;
  openModal("新建拍摄需求",body,foot);
  renderNdConfigs();
  $("#ndModel").addEventListener("change",renderNdConfigs);
}
function renderNdConfigs(){
  const mid=$("#ndModel").value;const m=modelById(mid);const box=$("#ndConfigs");
  if(!m){box.innerHTML="";return;}
  box.innerHTML=m.configs.length?m.configs.map(c=>`<label class="row" style="gap:8px;padding:8px 10px;background:var(--bg-soft);border-radius:var(--r-md);cursor:pointer"><input type="checkbox" value="${c.id}" style="width:16px;height:16px"><span><b>${escapeHtml(c.name)}</b> <span class="muted small">¥${c.price}</span></span></label>`).join(""):`<span class="muted small">该车型暂无配置项，可先到车型库添加</span>`;
}

/* 新增车型 */
function openNewModel(){
  const body=`
    <div class="field"><label>车型名称 *</label><input class="input" id="nmName" placeholder="如：R20pro 竞速版"></div>
    <div class="field"><label>类别 *</label><select class="select" id="nmCat"><option>公路车</option><option>砾石车</option><option>山地车</option></select></div>
    <div class="field"><label>备注</label><input class="input" id="nmRemark" placeholder="来源 / 定位"></div>
    <div class="empty" style="padding:14px">保存后可在车型详情中继续添加配置项</div>
  `;
  const foot=`<button class="btn btn-secondary" data-close="1">取消</button><button class="btn btn-primary" id="nmSubmit">保存车型</button>`;
  openModal("新增车型",body,foot);
}

/* 新增配置 */
function openAddConfig(mid){
  const body=`
    <div class="field"><label>配置名称 *</label><input class="input" id="acName" placeholder="如：旗舰版(电变)"></div>
    <div class="grid-2"><div class="field"><label>车架</label><input class="input" id="acFrame" placeholder="碳纤维车架"></div><div class="field"><label>套件 / 变速</label><input class="input" id="acGroup" placeholder="电子变速 ET"></div></div>
    <div class="field"><label>参考价(¥)</label><input class="input" id="acPrice" type="number" value="0"></div>
  `;
  const foot=`<button class="btn btn-secondary" data-close="1">取消</button><button class="btn btn-primary" id="acSubmit" data-mid="${mid}">保存配置</button>`;
  openModal("新增配置项",body,foot);
}

/* 审批备注弹窗 */
function openApproveNote(id,kind){
  const body=`<div class="field"><label>${kind==="approve"?"通过备注（可选）":"驳回原因（建议填写）"}</label><textarea class="textarea" id="apNote" placeholder="${kind==="approve"?"如：安排下周排期":"如：与现有素材重复"}"></textarea></div>`;
  const foot=`<button class="btn btn-secondary" data-close="1">取消</button><button class="btn btn-primary" id="apSubmit" data-id="${id}" data-kind="${kind}">确认${kind==="approve"?"通过":"驳回"}</button>`;
  openModal(kind==="approve"?"通过需求":"驳回需求",body,foot);
}

/* ============================================================
   事件绑定
   ============================================================ */
function bindGlobal(){
  // 导航
  $("#nav").addEventListener("click",e=>{const it=e.target.closest("[data-nav]");if(it){location.hash="#/"+it.dataset.nav;if(window.innerWidth<=760)$("#sidebar").classList.remove("open");}});
  // 角色切换
  $("#roleSelect").addEventListener("change",e=>{state.role=e.target.value;save();renderAll();toast("已切换为「"+ROLES[state.role].name+"」角色");});
  $("#hamburger").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#scrim").addEventListener("click",closeOverlays);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeOverlays();});

  // 顶部按钮
  document.addEventListener("click",e=>{
    const t=e.target.closest("[data-action],[data-close]"); if(!t)return;
    if(t.dataset.close!==undefined){closeOverlays();return;}
    const a=t.dataset.action;
    if(a==="new-demand"){ if(can("submit"))openNewDemand(); else toast("当前角色无提交权限","warn"); }
    if(a==="new-model"){ if(can("editModels"))openNewModel(); else toast("当前角色无权限","warn"); }
    if(a==="export")exportData();
    if(a==="import"){ $("#fileInput").click(); }
  });

  // 文件导入
  $("#fileInput").addEventListener("change",e=>{
    const f=e.target.files[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{try{const s=validate(JSON.parse(r.result));state=s;save();renderAll();toast("数据已导入","ok");}catch(err){toast("导入失败：文件格式错误","err");}};
    r.readAsText(f);e.target.value="";
  });

  // 委托：分类/搜索/状态筛选
  document.addEventListener("click",e=>{
    const c=e.target.closest("[data-mcat]"); if(c){modelFilter.cat=c.dataset.mcat;viewModels($("#view"));}
    const ds=e.target.closest("[data-dstatus]"); if(ds){demandFilter.status=ds.dataset.dstatus;viewDemands($("#view"));}
  });
  document.addEventListener("input",e=>{
    if(e.target.id==="modelSearch"){modelFilter.q=e.target.value;viewModels($("#view"));}
    if(e.target.id==="demandSearch"){demandFilter.q=e.target.value;viewDemands($("#view"));}
  });

  // 车型卡片 → 详情
  document.addEventListener("click",e=>{const c=e.target.closest("[data-model]");if(c)openModelDetail(c.dataset.model);});
  // 配置新增 / 删除
  document.addEventListener("click",e=>{
    const ac=e.target.closest("[data-addcfg]"); if(ac)openAddConfig(ac.dataset.addcfg);
    const dc=e.target.closest("[data-delcfg]"); if(dc){const [mid,cid]=dc.dataset.delcfg.split("|");if(confirm("确认删除该配置项？"))delConfig(mid,cid);}
  });
  // 需求：通过/驳回/排期/取消/详情
  document.addEventListener("click",e=>{
    const ap=e.target.closest("[data-approve]"); if(ap){ if(can("approve"))openApproveNote(ap.dataset.approve,"approve"); else toast("无审批权限","warn"); }
    const rj=e.target.closest("[data-reject]"); if(rj){ if(can("approve"))openApproveNote(rj.dataset.reject,"reject"); else toast("无审批权限","warn"); }
    const ts=e.target.closest("[data-tosched]"); if(ts){ if(can("schedule"))openSchedModal(ts.dataset.tosched); else toast("无排期权限","warn"); }
    const cz=e.target.closest("[data-cancel]"); if(cz){ if(can("editStatus")){if(confirm("确认取消该需求？关联的拍摄场次也会移除"))setStatus(cz.dataset.cancel,"cancelled");} }
    const dt=e.target.closest("[data-detail]"); if(dt)openDemandDetail(dt.dataset.detail);
    const ds=e.target.closest("[data-dosched]"); if(ds){ const id=ds.dataset.dosched; const date=$(`[data-sched-date="${id}"]`).value; const slot=$(`[data-sched-slot="${id}"]`).value; if(!date){toast("请选择拍摄日期","warn");return;} scheduleDemand(id,date,slot); }
  });
  // 排期弹窗
  document.addEventListener("click",e=>{const a=e.target.closest("#apSubmit");if(a){const note=$("#apNote").value.trim();if(a.dataset.kind==="approve")approveDemand(a.dataset.id,note);else rejectDemand(a.dataset.id,note);closeOverlays();}});
  // 新建需求提交
  document.addEventListener("click",e=>{const b=e.target.closest("#ndSubmit");if(b){const cfgIds=$$("#ndConfigs input:checked").map(x=>x.value);if(!$("#ndSubmitter").value.trim()){toast("请填写提报人","warn");return;}addDemand({modelId:$("#ndModel").value,configIds:cfgIds,submitter:$("#ndSubmitter").value.trim(),region:$("#ndRegion").value,priority:$("#ndPriority").value,remark:$("#ndRemark").value.trim()});closeOverlays();}});
  // 新增车型提交
  document.addEventListener("click",e=>{const b=e.target.closest("#nmSubmit");if(b){if(!$("#nmName").value.trim()){toast("请填写车型名称","warn");return;}addModel({name:$("#nmName").value.trim(),category:$("#nmCat").value,remark:$("#nmRemark").value.trim()});closeOverlays();}});
  // 新增配置提交
  document.addEventListener("click",e=>{const b=e.target.closest("#acSubmit");if(b){if(!$("#acName").value.trim()){toast("请填写配置名称","warn");return;}addConfig(b.dataset.mid,{name:$("#acName").value.trim(),frame:$("#acFrame").value.trim(),group:$("#acGroup").value.trim(),price:$("#acPrice").value});closeOverlays();if($("#drawer").classList.contains("show"))openModelDetail(b.dataset.mid);}});

  // 行内变更（确认 / 排期日期 / 排班 / 场次状态）
  document.addEventListener("change",e=>{
    if(e.target.dataset.confirm){toggleConfirm(e.target.dataset.confirm,e.target.checked);}
    if(e.target.dataset.sdate){setScheduleDate(e.target.dataset.sdate,e.target.value);}
    if(e.target.dataset.assign){assignStaff(e.target.dataset.assign,e.target.value);}
    if(e.target.dataset.sessStatus){updateSession(e.target.dataset.sessStatus,e.target.value);}
  });
  // 排期日期（在排期页）
  document.addEventListener("change",e=>{
    const el=e.target.closest("[data-sched-date]"); if(el&&el.value&&can("schedule")){ /* 等待点按钮 */ }
  });

  window.addEventListener("hashchange",renderView);
}

function openSchedModal(id){
  const d=demandById(id);const m=modelById(d.modelId);
  const body=`<div class="field"><label>车型</label><div><b>${escapeHtml(m.name)}</b> · ${d.no}</div></div>
    <div class="grid-2"><div class="field"><label>拍摄日期 *</label><input type="date" class="input" id="schDate" value="${d.scheduleDate||addDays(2)}"></div>
    <div class="field"><label>时段</label><select class="select" id="schSlot"><option>上午</option><option>下午</option><option>全天</option></select></div></div>
    <div class="field"><label>拍摄人员</label><select class="select" id="schStaff"><option value="">暂不分配</option>${state.staff.map(st=>`<option value="${st.id}">${st.name}</option>`).join("")}</select></div>`;
  const foot=`<button class="btn btn-secondary" data-close="1">取消</button><button class="btn btn-primary" id="schSubmit" data-id="${id}">确认排期</button>`;
  openModal("安排拍摄排期",body,foot);
  document.addEventListener("click",function h(e){const b=e.target.closest("#schSubmit");if(!b)return;const date=$("#schDate").value;if(!date){toast("请选择日期","warn");return;}scheduleDemand(b.dataset.id,date,$("#schSlot").value);const sid=state.sessions.find(s=>s.demandId===b.dataset.id);if(sid&&$("#schStaff").value)assignStaff(sid.id,$("#schStaff").value);closeOverlays();document.removeEventListener("click",h);});
}

function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="zhuite_shoot_"+todayStr()+".json";a.click();toast("已导出当前数据","ok");
}

/* 图标 */
const ICON={
  grid:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  calendar:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  list:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  check:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  clock:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  bike:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h4l4 9M10 8l2-3 2 3"/></svg>',
  users:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 6a3 3 0 010 6M21 20c0-2-1-4-3-5"/></svg>',
  x:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
};

/* ---------- 启动 ---------- */
bindGlobal();
renderAll();
