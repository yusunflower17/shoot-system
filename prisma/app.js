const IMG={};function I(s){s=IMG[s]||s;return s.replace('assets/images/','images/').replace('assets/qr.png','images/qr.png');}
/* === P2: token-based price-tier access control === */
/* P1 方案A (?tier=) 保留为 localhost 调试模式; 生产环境统一用 ?k=<token> */
let DATA_EN, DATA_CN, DATA;
(function(){
  var p = new URLSearchParams(location.search);
  var want = p.get('lang');
  if(!want && location.hash){ want = new URLSearchParams(location.hash.replace('#','')).get('lang'); }
  var lang = want ? (String(want).toLowerCase().indexOf('zh')===0 ? 'zh-CN' : 'en')
                  : ((navigator.language||'').toLowerCase().indexOf('zh')===0 ? 'zh-CN' : 'en');
  document.documentElement.lang = lang;
})();
var SALT='TWITTER_PR1C3_SALT_2026';
var IS_LOCAL = location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.hostname===''||location.protocol==='file:';
const TIER_MAP = {
  'retail':'Level-3','r':'Level-3','l3':'Level-3','level3':'Level-3',
  'dealer':'Level-2','d':'Level-2','l2':'Level-2','level2':'Level-2',
  'agent':'Level-1','a':'Level-1','l1':'Level-1','level1':'Level-1',
  'wholesale':'Level-1','w':'Level-1',
  'all':'all','*':'all'
};
function cyrb53(str,seed){
  var h1=0xdeadbeef^((seed||0)>>>0), h2=0x41c6ce57^((seed||0)>>>0);
  for(var i=0;i<str.length;i++){var ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return 4294967296*(2097151&h2)+(h1>>>0);
}
function hashToken(token){
  var s=SALT+token;
  var a=cyrb53(s,0)>>>0, b=cyrb53(s,0x9e3779b9)>>>0;
  return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');
}
function getTokenFromURL(){
  var p=new URLSearchParams(location.search);
  var v=p.get('k')||p.get('token')||p.get('key');
  if(!v&&location.hash){var hp=new URLSearchParams(location.hash.replace('#',''));v=hp.get('k')||hp.get('token')||hp.get('key');}
  return v;
}
function getLegacyTierFromURL(){
  var p=new URLSearchParams(location.search);
  var keys=['tier','t','p','price'];
  for(var k of keys){var v=p.get(k);if(v)return TIER_MAP[String(v).toLowerCase()]||'Level-3';}
  if(location.hash){var hp=new URLSearchParams(location.hash.replace('#',''));for(var k2 of keys){var v2=hp.get(k2);if(v2)return TIER_MAP[String(v2).toLowerCase()]||'Level-3';}}
  return null;
}
var URL_TOKEN = getTokenFromURL();
var LEGACY_TIER = getLegacyTierFromURL();
var TOKEN_VALIDATED = !URL_TOKEN; /* no token = nothing to validate */
let TIER_LOCKED;
if(IS_LOCAL){
  /* localhost: ?tier= works as debug; ?k= works as token; no params = unlocked */
  TIER_LOCKED = URL_TOKEN || LEGACY_TIER ? true : false;
}else{
  /* production: always locked (selector hidden); ?tier= ignored, ?k= validated */
  TIER_LOCKED = true;
}
if(TIER_LOCKED) document.documentElement.classList.add('tier-locked');
let LANG=document.documentElement.lang==='zh-CN'?'cn':'en';
let cat='all';
let tier = 'Level-3'; /* default retail; updated by token resolution in bootCatalog */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'—').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const labels={
  cn:{all:'全部',gravel:'砾石车',road:'公路车',mtb:'山地车',ebike:'电助力',retail:'零售价',dealer:'经销商价',agent:'代理价',page:'车型',shared:'适用规格',wheel:'轮径',size:'车架尺码',material:'材质',style:'用途 / 类型',axle:'轴制',colors:'可选颜色',hint:'点击查看其他配色',buyer:'采购要点',configs:'配置与人民币价格',details:'查看完整配置',gallery:'颜色图库',count:'个配置',market:'国内人民币',custom:'支持涂装定制',expand:'完整规格可展开',indexTitle:'车型目录'},
  en:{all:'ALL',gravel:'GRAVEL',road:'ROAD',mtb:'MTB',ebike:'E-BIKE',retail:'RETAIL',dealer:'DEALER',agent:'AGENT',page:'MODEL',shared:'CORE SPEC',wheel:'WHEEL',size:'FRAME SIZE',material:'MATERIAL',style:'USE / TYPE',axle:'AXLE',colors:'AVAILABLE COLORS',hint:'CLICK FOR COLOR GALLERY',buyer:'BUYER HIGHLIGHTS',configs:'CONFIGURATIONS & USD EXW',details:'VIEW FULL SPEC',gallery:'COLOR GALLERY',count:'OPTIONS',market:'USD EXW',custom:'LOGO / PAINT',expand:'FULL SPEC ON DEMAND',indexTitle:'Model Index'}
};
const toolbarLabels={
  cn:{
    brand:'骓特 · 全车型图册',
    brandSub:'TWITTER Bicycle · 轻量增强版 · 中英双语',
    catLabel:'分类',
    all:'全部',
    gravel:'砾石',
    road:'公路',
    mtb:'山地',
    ebike:'电助力',
    tierLabel:'价格',
    tier3:'零售',
    tier2:'经销',
    tier1:'代理',
    tierAll:'全部',
    pdf:'导出 PDF',
    lang:'EN',
    countUnit:'车型'
  },
  en:{
    brand:'TWITTER · Full Model Catalog',
    brandSub:'TWITTER Bicycle · Lightweight Bilingual Edition',
    catLabel:'CATEGORY',
    all:'ALL',
    gravel:'GRAVEL',
    road:'ROAD',
    mtb:'MTB',
    ebike:'E-BIKE',
    tierLabel:'PRICE TIER',
    tier3:'RETAIL',
    tier2:'DEALER',
    tier1:'AGENT',
    tierAll:'ALL',
    pdf:'EXPORT PDF',
    lang:'中文',
    countUnit:'MODELS'
  }
};
let L=labels[LANG];

function series(c){return c==='gravel'?(LANG==='cn'?'砾石车系列':'GRAVEL SERIES'):c==='road'?(LANG==='cn'?'公路车系列':'ROAD SERIES'):c==='ebike'?(LANG==='cn'?'电助力系列':'E-BIKE SERIES'):(LANG==='cn'?'山地车系列':'MTB SERIES')}
function colorTokens(s){return String(s||'').split(/[\/，,;；]+/).map(x=>x.trim()).filter(Boolean).slice(0,8)}
function colorCode(n){let x=n.toLowerCase();if(/全变|holog|彩/.test(x))return 'conic-gradient(#f44,#fd4,#4c7,#49f,#a5f,#f44)';if(/白|white/.test(x))return '#f7f7f5';if(/哑黑|黑|black/.test(x))return '#191b1e';if(/深灰|灰|gray|grey/.test(x))return '#8b929a';if(/银|silver|钛|titan/.test(x))return '#c4c7c7';if(/青|绿|green|cyan/.test(x))return '#19a79c';if(/蓝|blue/.test(x))return '#2864b7';if(/红|red/.test(x))return '#c92831';if(/橙|orange/.test(x))return '#e4762d';if(/黄|yellow/.test(x))return '#e4b838';if(/金|gold/.test(x))return '#ad8343';if(/紫|purple/.test(x))return '#7751a7';if(/粉|pink/.test(x))return '#df8da3';return '#aab1b8'}
function swatches(p){let a=colorTokens(p.colors);return `<div class="colorline"><span class="color-label">${L.colors}</span><div class="swatches">${a.slice(0,6).map(x=>{let holo=/全变|holog|彩|镭射/i.test(x);return `<span class="swatch-chip${holo?' holo':''}"><i style="background:${colorCode(x)}"></i><em>${esc(x)}</em></span>`}).join('')}${a.length>6?`<span class="swatch-chip more"><i style="background:#e2e8f0"></i><em>+${a.length-6}</em></span>`:''}</div></div>`}
function first(o,keys){for(let k of keys)if(o&&o[k])return o[k];return '—'}
function short(s,n=44){s=String(s||'—').replace(/Gravel\s*V?\d*\([^)]*\)/ig,'').replace(/[，,]/g,' · ');return s.length>n?s.slice(0,n-1)+'…':s}
function highlights(p){let spec=p.variants[0]?.spec||{},frame=first(spec,LANG==='cn'?['车架']:['Frame']);let h1=p.material.includes('碳')||/carbon/i.test(p.material)?(LANG==='cn'?'轻量碳纤维平台':'LIGHT CARBON PLATFORM'):(LANG==='cn'?'耐用铝合金平台':'DURABLE ALLOY PLATFORM');let h2=/内走|inner/i.test(frame)?(LANG==='cn'?'简洁内走线设计':'CLEAN INTERNAL ROUTING'):(LANG==='cn'?'成熟车架结构':'PROVEN FRAME PLATFORM');let h3=p.category==='ebike'?(LANG==='cn'?'电助力驱动系统':'E-POWER DRIVE SYSTEM'):p.category==='mtb'?(LANG==='cn'?(p.style.includes('全避震')?'全避震林道操控':'Boost 稳定操控'):'TRAIL-READY CONTROL'):(LANG==='cn'?'桶轴碟刹系统':'THRU-AXLE DISC SYSTEM');return [[h1,LANG==='cn'?'轻量、刚性与耐用性的平衡':'Balanced weight, stiffness and durability'],[h2,LANG==='cn'?'提升整车视觉和线管保护':'Cleaner presentation and cable protection'],[h3,LANG==='cn'?'兼顾制动一致性与轮组兼容':'Consistent braking and wheel compatibility']]}
function rowData(v){let s=v.spec||{};return LANG==='cn'?[["变速",short(first(s,['手变','指拨']))],["前拨",short(first(s,['前拨']))],["后拨",short(first(s,['后拨']))],["牙盘",short(first(s,['牙盘','Cranksets']))],["飞轮",short(first(s,['飞轮','Cassettes']))],["轮组",short(first(s,['车圈','花鼓','Rim','Hub','Hubs']))],["重量",v.weight]]:[["SHIFT",short(first(s,['Derailleur Handle','Derailleur Lever']))],["FRONT D.",short(first(s,['Front Derailleur']))],["REAR D.",short(first(s,['Rear Derailleur']))],["CRANK",short(first(s,['Cranksets','牙盘']))],["CASSETTE",short(first(s,['Cassettes','飞轮']))],["WHEEL",short(first(s,['Rim','Hub','Hubs','车圈','花鼓']))],["WEIGHT",v.weight]]}
function price(v){let q=v.prices||{};if(tier==='all')return `<div class="alltier"><div><small>${L.agent}</small><b>${LANG==='cn'?'¥':'$'}${q['Level-1']??'—'}</b></div><div><small>${L.dealer}</small><b>${LANG==='cn'?'¥':'$'}${q['Level-2']??'—'}</b></div><div><small>${L.retail}</small><b>${LANG==='cn'?'¥':'$'}${q['Level-3']??'—'}</b></div></div>`;let lab=tier==='Level-1'?L.agent:tier==='Level-2'?L.dealer:L.retail;return `<div class="plabel">${lab}${LANG==='en'?' · USD EXW':''}</div><div class="pvalue">${LANG==='cn'?'¥':'$'}${q[tier]??'—'}</div>`}
function card(p,v,i){let name=p.configs[i]||`Config ${i+1}`;return `<div class="card"><div class="cname">${esc(name)}</div><div class="rows">${rowData(v).map(r=>`<div class="row"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div><div class="price" data-tier="${tier}">${price(v)}</div><div class="print-spec"><h5>${L.details}</h5><table>${Object.entries(v.spec||{}).map(([k,val])=>`<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</table></div><button class="full" onclick="openSpec('${p.slug}',${i})">${L.details} →</button></div>`}
function page(p,i){let hs=highlights(p),img=p.images[0]||'';return `<article class="page" data-cat="${p.category}" data-slug="${p.slug}" id="page-${p.slug}"><div class="topline"></div><div class="head"><div><div class="series">TWITTER · ${series(p.category)}${p.category==='ebike'?' <span class="ebadge">⚡ E-BIKE</span>':''}</div><div class="model">${esc(p.model)}</div><div class="position">${esc(p.style)} · ${esc(p.material)}</div></div><div class="counter"><b>${String(i+1).padStart(2,'0')}</b> / ${DATA.length}<br>${L.page}</div></div><div class="hero"><div class="photo" onclick="openGallery('${p.slug}')"><img decoding="async" loading="lazy" src="${I(img)}"><div class="tap">${L.hint}</div></div><div class="shared"><h3>${L.shared}</h3><div class="specgrid">${[[L.wheel,p.wheel,''],[L.material,p.material,'hot'],[L.style,p.style,'hot'],[L.axle,p.axle,'hot'],[L.size,p.size,'size']].map(x=>`<div class="item ${x[2]}"><span>${x[0]}</span><b>${esc(x[1])}</b></div>`).join('')}</div>${swatches(p)}</div></div><div class="buyer"><div class="buyer-top"><div class="buyer-title">${L.buyer}</div><div class="buyer-meta"><span class="meta">${L.market}</span><span class="meta">${L.custom}</span><span class="meta">${L.expand}</span></div></div><div class="buyer-points">${hs.map((x,j)=>`<div class="bp"><i>0${j+1}</i><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div>`).join('')}</div></div><div class="config-title"><h3>${L.configs}</h3><small>${p.variants.length} ${L.count}</small></div><div class="cards" style="grid-template-columns:repeat(${p.variants.length},minmax(0,1fr))">${p.variants.map((v,j)=>card(p,v,j)).join('')}</div><div class="foot"><span class="conf">${LANG==='cn'?'机密 · CONFIDENTIAL':'CONFIDENTIAL'}</span><div class="company">${LANG==='cn'?'深圳市菲仕特科技有限公司 · TWITTER 骓特自行车':'Shenzhen First Technology Co., Ltd. · TWITTER Bicycle'}</div><div class="contacts">yu@twittercycles.com · +86 185 6570 8041</div><span class="pageno">${String(i+1).padStart(2,'0')} / ${DATA.length}</span><img class="qr" src="${I('assets/qr.png')}"></div></article>`}
function render(){document.title=`TWITTER · ${LANG==='cn'?'轻量增强版图册':'Lightweight Enhanced Catalog'}`;$('#pages').innerHTML=DATA.map(page).join('');apply();buildIndex()}
function apply(){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('hidden',cat!=='all'&&x.dataset.cat!==cat));document.querySelectorAll('[data-catbtn]').forEach(x=>x.classList.toggle('on',x.dataset.catbtn===cat));document.querySelectorAll('[data-tier]').forEach(x=>x.classList.toggle('on',x.dataset.tier===tier));updateCounter()}
function updateCounter(){const c=document.getElementById('tbCount');if(c)c.textContent=document.querySelectorAll('.page:not(.hidden)').length}
function setCat(x){cat=x;apply();buildIndex()}
function setTier(x){tier=x;render()}
function buildIndex(){
  const body=$('#indexBody');if(!body)return;
  const groups={gravel:[],road:[],mtb:[],ebike:[]};
  DATA.forEach((p,idx)=>{if(cat!=='all'&&p.category!==cat)return;groups[p.category]=groups[p.category]||[];groups[p.category].push({...p,idx});});
  body.innerHTML=['gravel','road','mtb','ebike'].map(c=>{
    if(!groups[c].length)return'';
    return `<div class="index-group"><div class="index-group-title">${series(c)}</div>${groups[c].map(p=>`<div class="index-item" onclick="scrollToSlug('${p.slug}')"><span>${esc(p.model)}</span><small>${String(p.idx+1).padStart(2,'0')}</small></div>`).join('')}</div>`;
  }).join('');
}
function toggleIndex(){
  const panel=$('#indexPanel'),ov=$('#indexOverlay');
  panel.classList.toggle('open');ov.classList.toggle('open');
  panel.setAttribute('aria-hidden',String(!panel.classList.contains('open')));
}
function scrollToSlug(slug){
  toggleIndex();
  const el=document.getElementById('page-'+slug);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}
function openGallery(slug){let p=DATA.find(x=>x.slug===slug);if(!p||!p.images.length)return;let m=$('#modal');m.innerHTML=`<div class="dialog"><button class="x" onclick="closeM()">×</button><h2>${esc(p.model)} · ${L.gallery}</h2><div class="gallery-main"><img id="mainImg" loading="lazy" src="${I(p.images[0])}"></div><div class="thumbs">${p.images.map((x,i)=>`<img loading="lazy" decoding="async" class="thumb ${i?'':'on'}" loading="lazy" src="${I(x)}" onclick="pick(this,'${x}')">`).join('')}</div></div>`;m.classList.add('open')}
function pick(el,src){$('#mainImg').src=I(src);document.querySelectorAll('.thumb').forEach(x=>x.classList.remove('on'));el.classList.add('on')}
function openSpec(slug,i){let p=DATA.find(x=>x.slug===slug),v=p.variants[i],m=$('#modal');m.innerHTML=`<div class="dialog"><button class="x" onclick="closeM()">×</button><h2>${esc(p.model)} · ${esc(p.configs[i]||'')}</h2><table>${Object.entries(v.spec||{}).map(([k,val])=>`<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</table></div>`;m.classList.add('open')}
function closeM(){$('#modal').classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeM(); if(e.key==='l'||e.key==='L'){ if(e.target&&['INPUT','TEXTAREA'].includes(e.target.tagName))return; setLang(LANG==='cn'?'en':'cn'); } if(e.key==='m'||e.key==='M'){ if(e.target&&['INPUT','TEXTAREA'].includes(e.target.tagName))return; toggleIndex(); }});

function updateToolbarText(){
  const T=toolbarLabels[LANG];
  document.querySelector('.tb-brand .tb-brand-main').textContent=T.brand;
  document.querySelector('.tb-brand .tb-brand-sub').textContent=T.brandSub;
  document.querySelector('[data-tb="catLabel"]').textContent=T.catLabel;
  document.querySelector('[data-catbtn="all"]').textContent=T.all;
  document.querySelector('[data-catbtn="gravel"]').textContent=T.gravel;
  document.querySelector('[data-catbtn="road"]').textContent=T.road;
  document.querySelector('[data-catbtn="mtb"]').textContent=T.mtb;
  document.querySelector('[data-catbtn="ebike"]').textContent=T.ebike;
  document.querySelector('[data-tb="tierLabel"]').textContent=T.tierLabel;
  document.querySelector('[data-tier="Level-3"]').textContent=T.tier3;
  document.querySelector('[data-tier="Level-2"]').textContent=T.tier2;
  document.querySelector('[data-tier="Level-1"]').textContent=T.tier1;
  document.querySelector('[data-tier="all"]').textContent=T.tierAll;
  const cu=document.querySelector('[data-tb="countUnit"]'); if(cu)cu.textContent=T.countUnit;
  document.querySelector('[data-tb="pdf"]').textContent=T.pdf;
  document.querySelector('[data-tb="lang"]').textContent=T.lang;
  updateCounter();
}
function setLang(l){
  LANG=l;
  document.documentElement.lang=LANG==='cn'?'zh-CN':'en';
  DATA=LANG==='cn'?DATA_CN:DATA_EN;
  L=labels[LANG];
  updateToolbarText();
  const it=$('#indexTitle');if(it)it.textContent=L.indexTitle;
  render();
}
function preloadAllImages(){
  document.querySelectorAll('img[loading="lazy"]').forEach(img=>{img.loading='eager';});
  document.querySelectorAll('img.img-broken').forEach(img=>{img.classList.remove('img-broken'); img.src=img.src; });
}
window.addEventListener('beforeprint',()=>{ preloadAllImages(); });
/* online: initial toolbar+render deferred to bootCatalog after data fetch */

/* === P2: async boot (token resolution + data fetch + render) === */
async function bootCatalog(){
  const loader = document.getElementById('loader');
  const tip = document.getElementById('ldTip');
  try {
    /* P2: resolve token → tier before any rendering */
    if (URL_TOKEN) {
      try {
        var tresp = await fetch('data/tokens.json', {cache:'force-cache'});
        var tokens = tresp.ok ? await tresp.json() : {};
        var h = hashToken(URL_TOKEN);
        if (tokens[h] && tokens[h].tier) {
          tier = tokens[h].tier;
        } else {
          if(tip) tip.textContent = (LANG==='cn'?'链接无效 · 显示零售价':'Invalid link · showing retail');
        }
        TOKEN_VALIDATED = true;
      } catch(te) {
        console.warn('Token validation failed:', te);
        TOKEN_VALIDATED = true;
      }
    } else if (IS_LOCAL && LEGACY_TIER) {
      /* localhost debug: honor ?tier= param */
      tier = LEGACY_TIER;
    }
    if (tip) tip.textContent = (LANG==='cn'?'正在加载车型数据…':'Loading models…');
    const lang = document.documentElement.lang === 'zh-CN' ? 'cn' : 'en';
    const file = lang === 'cn' ? 'data/data-cn.json' : 'data/data-en.json';
    const resp = await fetch(file, { cache: 'force-cache' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const d = await resp.json();
    DATA = d;
    if (lang === 'cn') DATA_CN = d; else DATA_EN = d;
    if (tip) tip.textContent = (LANG==='cn'?'渲染中…':'Rendering…') + ' ' + DATA.length + (LANG==='cn'?' 款车型':' models');
    await new Promise(r => setTimeout(r, 60));
    try { updateToolbarText(); } catch(e) { console.warn('toolbar', e); }
    var it = document.getElementById('indexTitle'); if (it) it.textContent = L.indexTitle;
    render();
    if (typeof window.renderTable === 'function') window.renderTable();
    if (typeof window.__updInfoStrip === 'function') window.__updInfoStrip();
    setTimeout(function(){
      if (loader) { loader.classList.add('hide'); setTimeout(function(){ loader.style.display='none'; }, 500); }
    }, 400);
  } catch(e) {
    console.error('Catalog boot failed:', e);
    if (tip) tip.innerHTML = '<span style="color:#ff6b6b">' + (LANG==='cn'?'加载失败':'Load failed') + ': ' + e.message + '</span>';
  }
}

/* === Merged-doc info-strip: quotation metadata (MOQ, EXW, version, date, brands) === */
(function(){
  const MOQ={'Level-1':'120/300','Level-2':'50/120','Level-3':'1'};
  toolbarLabels.cn.ver='版本';      toolbarLabels.en.ver='VERSION';
  toolbarLabels.cn.cur='币种 / 条款'; toolbarLabels.en.cur='CURRENCY / TERMS';
  toolbarLabels.cn.upd='更新日期';   toolbarLabels.en.upd='UPDATED';
  toolbarLabels.cn.moqL='当前起订'; toolbarLabels.en.moqL='CURRENT MOQ';
  toolbarLabels.cn.allMoq='全部三级'; toolbarLabels.en.allMoq='ALL TIERS';
  const $=id=>document.getElementById(id);
  function upd(){
    const T=toolbarLabels[LANG];
    if(!$('infoTerms')) return;
    $('infoTerms').textContent = LANG==='cn' ? '人民币 · 国内价 (代理/经销/零售)' : 'USD · EXW (Agent/Dealer/Retail)';
    $('infoMoq').textContent = tier==='all' ? T.allMoq : ('MOQ ' + (MOQ[tier]||''));
    $('iLabVer').textContent=T.ver; $('iLabCur').textContent=T.cur; $('iLabUpd').textContent=T.upd; $('iLabMoq').textContent=T.moqL;
  }
  const _setTier=window.setTier; window.setTier=function(x){_setTier(x);upd();if(window.renderTable)window.renderTable();};
  const _setLang=window.setLang; window.setLang=function(l){_setLang(l);upd();if(window.renderTable)window.renderTable();};
  const _setCat=window.setCat;  window.setCat=function(x){_setCat(x);upd();if(window.renderTable)window.renderTable();};
  window.__updInfoStrip=upd;
  upd();
})();

/* === View toggle (gallery <-> quotation table) === */
(function(){
  toolbarLabels.cn.vGallery='图册'; toolbarLabels.cn.vQuote='报价单';
  toolbarLabels.en.vGallery='CATALOG'; toolbarLabels.en.vQuote='QUOTE';
  const Q={
    cn:{brand:'配置品牌',img:'产品',model:'整车型号',mat:'材质',size:'轮径 / 车架尺码',color:'车架颜色',conf:'型号及配置',confS:'变速 / 轮组 / 车把',wt:'重量',p1:'代理价',p2:'经销价',p3:'零售价',notes:'备注',series:'系列',quot:'价格表',upd:'更新日期',moq:'起订',detail:'完整配置'},
    en:{brand:'Brand',img:'Product',model:'Model',mat:'Material',size:'Wheel / Frame',color:'Colors',conf:'Config',confS:'Drivetrain / Wheel / Bar',wt:'Weight',p1:'Agent',p2:'Dealer',p3:'Retail',notes:'Notes',series:'Series',quot:'Quotation',upd:'Updated',moq:'MOQ',detail:'Full spec'}
  };
  let VIEW='gallery';
  function q(){return Q[LANG];}
  function money(n){if(n==null||n===undefined)return LANG==='cn'?'待询价':'TBD';return (LANG==='cn'?'¥':'$')+Number(n).toLocaleString('en-US');}
  function brandOf(v,p,i){
    const s=v.spec||{},cfg=(p.configs&&p.configs[i])||v.configuration||'';
    const t=[s['Derailleur Handle'],s['Derailleur Lever'],s['Rear Derailleur'],s['手变'],s['后拨'],s['指拨'],cfg].join(' ');
    if(/SHIMANO/i.test(t))return 'SHIMANO';
    if(/轮峰|Wheeltop|ES7000|ES8000/i.test(t))return 'WHEELTOP';
    if(/SENTYEH|顺泰/i.test(t))return 'SENTYEH';
    if(/SRAM/i.test(t))return 'SRAM';
    if(/LTWOO|SENSAH/i.test(t)||t.indexOf('RS(')!==-1)return 'SENSAH';
    return 'LTWOO';
  }
  function list(){return DATA.filter(p=>cat==='all'||p.category===cat);}
  function setView(v){
    VIEW=v;
    const g=$('#pages'),qw=$('#quoteWrap');
    if(v==='table'){g.classList.add('hidden-by-view');qw.classList.add('on');renderTable();}
    else{g.classList.remove('hidden-by-view');qw.classList.remove('on');}
    document.getElementById('viewGallery').classList.toggle('on',v==='gallery');
    document.getElementById('viewQuote').classList.toggle('on',v==='table');
    if(v==='table'){const p=$('#indexPanel');if(p&&p.classList.contains('open'))toggleIndex();}
  }
  function renderTable(){
    const T=q(),L=toolbarLabels[LANG];
    const catName=cat==='all'?(LANG==='cn'?'全部车型':L.all):series(cat);
    document.getElementById('qtTitle').innerHTML=catName+' <span>'+(LANG==='cn'?'配置与价格表':'· Configuration & Price')+'</span>';
    document.getElementById('qtYear').textContent=LANG==='cn'?'2026 版本':'2026 Edition';
    document.getElementById('qtCur').textContent=(LANG==='cn'?'币种：人民币 · 贸易条款：EXW':'Currency: USD · Terms: EXW');
    document.getElementById('qtUpd').textContent=(LANG==='cn'?'更新日期：2026-09-05':'Updated: 2026-09-05');
    document.getElementById('qtLabBrand').textContent=T.brand;
    const head=document.getElementById('qtHead');
    const showP=l=>tier==='all'||tier===l;
    // P1/方案A: when a single tier is locked, omit the other price columns entirely
    head.innerHTML='<th>'+T.img+'</th><th>'+T.model+'</th><th>'+T.mat+'</th><th>'+T.size+'</th><th>'+T.color+'</th><th>'+T.conf+'<small>'+T.confS+'</small></th><th>'+T.wt+'</th>'
      +(showP('Level-1')?'<th class="Level-1">'+T.p1+'</th>':'')
      +(showP('Level-2')?'<th class="Level-2">'+T.p2+'</th>':'')
      +(showP('Level-3')?'<th class="Level-3">'+T.p3+'</th>':'')
      +'<th>'+T.notes+'</th>';
    const rows=document.getElementById('qtRows');
    let html='',n=0;
    list().forEach(p=>{
      const vs=p.variants||[];
      if(!vs.length)return;
      vs.forEach((v,i)=>{
        const img=I(p.images&&p.images[0]||'');
        const br=brandOf(v,p,i);
        const pcls=l=>'qt-price '+l;
        const imgCell=i===0?'<td rowspan="'+vs.length+'" style="text-align:center"><img class="qt-img" loading="lazy" src="'+img+'" data-qt-gallery="'+p.slug+'"></td>':'';
        const modelCell=i===0?'<td rowspan="'+vs.length+'"><div class="qt-model">'+esc(p.model)+'</div><div class="qt-sub">'+esc(p.style)+' · '+esc(p.axle||'—')+'</div></td>':'';
        const matCell=i===0?'<td rowspan="'+vs.length+'"><b>'+esc(p.material)+'</b></td>':'';
        const sizeCell=i===0?'<td rowspan="'+vs.length+'"><b>'+esc(p.wheel)+'</b><div class="qt-sub">'+esc(p.size)+'</div></td>':'';
        const colorCell=i===0?'<td rowspan="'+vs.length+'"><div class="qt-sub">'+esc(p.colors)+'</div></td>':'';
        const cfg=(p.configs&&p.configs[i])||v.configuration||('Config '+(i+1));
        html+='<tr data-cat="'+p.category+'">'+imgCell+modelCell+matCell+sizeCell+colorCell+
          '<td><div class="qt-conf">'+esc(cfg)+'</div><span class="qt-brand '+br+'">'+br+'</span> <button class="qt-conf" style="border:0;background:none;color:#2563eb;padding:2px 0;cursor:pointer;font-size:11px" data-qt-spec="'+p.slug+':'+i+'">'+T.detail+'</button></td>'+
          '<td>'+esc(v.weight)+'</td>'+
          (showP('Level-1')?'<td class="'+pcls('Level-1')+'">'+money(v.prices&&v.prices['Level-1'])+'</td>':'')+
          (showP('Level-2')?'<td class="'+pcls('Level-2')+'">'+money(v.prices&&v.prices['Level-2'])+'</td>':'')+
          (showP('Level-3')?'<td class="'+pcls('Level-3')+'">'+money(v.prices&&v.prices['Level-3'])+'</td>':'')+
          '<td class="qt-notes">—</td></tr>';
        n++;
      });
    });
    rows.innerHTML=html||'<tr><td colspan="20" class="qt-empty">'+(LANG==='cn'?'没有符合条件的配置':'No matching configurations')+'</td></tr>';
    document.getElementById('qtStats').textContent=list().length+' '+(LANG==='cn'?'款车型':'models')+' · '+n+' '+(LANG==='cn'?'个配置':'configs');
    rows.querySelectorAll('[data-qt-spec]').forEach(b=>b.onclick=()=>openQtSpec(b.dataset.qtSpec));
    rows.querySelectorAll('[data-qt-gallery]').forEach(b=>b.onclick=()=>openQtGallery(b.dataset.qtGallery));
  }
  function findP(slug){return DATA.find(p=>p.slug===slug);}
  function openQtSpec(key){
    const parts=key.split(':');const slug=parts[0],i=+parts[1];const p=findP(slug);if(!p)return;const v=p.variants[i];
    const m=document.getElementById('qtModal');
    m.innerHTML='<div class="qt-dialog"><button class="x">×</button><h2>'+esc(p.model)+' · '+esc((p.configs&&p.configs[i])||'')+'</h2><div class="qt-gal">'+(p.images||[]).map(x=>'<img loading="lazy" src="'+I(x)+'">').join('')+'</div><table class="qt-spec">'+Object.entries(v.spec||{}).map(([k,val])=>'<tr><th>'+esc(k)+'</th><td>'+esc(val)+'</td></tr>').join('')+'</table></div>';
    m.classList.add('open');
    var xb=m.querySelector('.x');if(xb)xb.onclick=function(){m.classList.remove('open');};
  }
  function openQtGallery(slug){
    const p=findP(slug);if(!p||!(p.images||[]).length)return;
    const m=document.getElementById('qtModal');
    m.innerHTML='<div class="qt-dialog"><button class="x">×</button><h2>'+esc(p.model)+' · '+(LANG==='cn'?'颜色图库':'Color Gallery')+'</h2><div class="qt-gal">'+p.images.map(x=>'<img loading="lazy" src="'+I(x)+'">').join('')+'</div></div>';
    m.classList.add('open');
    var xb=m.querySelector('.x');if(xb)xb.onclick=function(){m.classList.remove('open');};
  }
  const _origUpd=window.updateToolbarText;
  window.updateToolbarText=function(){
    _origUpd();
    const T=toolbarLabels[LANG];
    const vg=document.getElementById('viewGallery'),vq=document.getElementById('viewQuote');
    if(vg)vg.textContent=T.vGallery;if(vq)vq.textContent=T.vQuote;
    if(VIEW==='table')renderTable();
  };
  window.setView=setView;window.renderTable=renderTable;
  document.addEventListener('click',e=>{if(e.target.id==='qtModal')e.target.classList.remove('open');});
})();

/* === P1: async language switching — pre-fetch the other language JSON === */
window.setLang = (function(prev){
  return async function(l){
    if (l === LANG) return;
    try {
      const file = l === 'cn' ? 'data/data-cn.json' : 'data/data-en.json';
      const resp = await fetch(file, { cache: 'force-cache' });
      const d = await resp.json();
      if (l === 'cn') DATA_CN = d; else DATA_EN = d;
    } catch(e) { console.error('lang data load failed:', e); }
    prev(l);
  };
})(window.setLang);
