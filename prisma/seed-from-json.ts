// prisma/seed-from-json.ts
// 用官网真实数据 (data-cn.json) 重新 seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// 品牌系列映射：data-cn.json 没有 code/series，我们生成
function genCode(slug: string) {
  return 'TW-' + slug.replace(/-/g, '_').toUpperCase();
}
function guessSeries(slug: string, category: string): string {
  if (category === 'gravel') return 'Gravel';
  if (category === 'ebike') {
    if (slug.startsWith('ec')) return 'EC';
    if (slug.startsWith('em')) return 'EM';
    return 'E-Bike';
  }
  if (category === 'mtb') {
    const s = slug.split('-')[1] || '';
    if (s === 'mt') return 'MT';
    if (s === 'm') return 'M';
    if (s === 'gtr') return 'GTR';
    if (s === 'warrior') return 'Warrior';
    if (s === 'leopard') return 'Leopard';
    if (s === 'overlord') return 'Overlord';
    if (s === 'predator') return 'Predator';
    if (s === 'rider') return 'Rider';
    if (s === 'endu') return 'Endurance';
    return s.toUpperCase();
  }
  // road
  const parts = slug.split('-');
  return (parts[1] || parts[0] || 'Road').toUpperCase();
}
function guessType(cat: string): string {
  const map: any = { gravel: '砾石车', road: '公路车', mtb: '山地车', ebike: '电助力' };
  return map[cat] || cat;
}

async function main() {
  console.log('🌱 Seeding from REAL website data...');

  // Read data-cn.json
  const raw = fs.readFileSync(path.join(__dirname, 'data-cn.json'), 'utf-8');
  const models = JSON.parse(raw);
  console.log('Loaded', models.length, 'models from data-cn.json');

  // ===== 1. Users =====
  const users = [
    { username: 'admin', password: 'admin123', name: '管理员', dept: '管理', role: 'admin' },
    { username: 'wangwu', password: '123456', name: '王五', dept: '产品运营', role: 'reviewer' },
    { username: 'zhangsan', password: '123456', name: '张三', dept: '短视频团队', role: 'shooter' },
    { username: 'lisi', password: '123456', name: '李四', dept: '短视频团队', role: 'shooter' },
    { username: 'zhaoliu', password: '123456', name: '赵六', dept: '海外业务', role: 'submitter' },
    { username: 'qianqi', password: '123456', name: '钱七', dept: '国内业务', role: 'submitter' },
    { username: 'sunba', password: '123456', name: '孙八', dept: '跨境电商', role: 'submitter' },
    { username: 'zhoujiu', password: '123456', name: '周九', dept: '品牌市场', role: 'submitter' },
    { username: 'wushi', password: '123456', name: '吴十', dept: '国内业务', role: 'submitter' },
    { username: 'zheng11', password: '123456', name: '郑十一', dept: '海外业务', role: 'submitter' },
    { username: 'chener', password: '123456', name: '陈二', dept: '短视频团队', role: 'shooter' },
    { username: 'guest', password: 'guest123', name: '访客提报', dept: '访客', role: 'submitter' },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { username: u.username }, update: {}, create: { username: u.username, password: bcrypt.hashSync(u.password, 10), name: u.name, dept: u.dept, role: u.role } });
  }
  console.log(' ✓ Users:', users.length);

  // ===== 2. Delete existing Model data (cascade will clear versions) =====
  await prisma.modelVersion.deleteMany({});
  await prisma.model.deleteMany({});
  await prisma.config.deleteMany({});
  await prisma.demand.deleteMany({});
  await prisma.demandHistory.deleteMany({});
  console.log(' ✓ Cleaned existing data');

  // ===== 3. Models + Versions from real data =====
  const modelMap: Record<string, string> = {};
  let modelCount = 0;
  let versionCount = 0;

  // Collect all unique config component strings for config library
  const allConfigs = new Map<string, { type: string; name: string }>();

  for (const m of models) {
    const code = genCode(m.slug);
    const series = guessSeries(m.slug, m.category);
    const type = guessType(m.category);
    const img = m.images?.[0]?.replace('assets/', 'https://bucolic-maamoul-d1fe02.netlify.app/') || null;

    const created = await prisma.model.create({
      data: {
        code,
        brand: 'TWITTER',
        series,
        name: m.model,
        enName: m.model,
        type,
        position: `${m.style || ''}·${m.material || ''}`.trim(),
        status: '在售',
        launchStatus: true,
        image: img,
        remark: `轮径: ${m.wheel || ''} | 尺寸: ${m.size || ''} | 颜色: ${m.colors || ''} | 轴制: ${m.axle || ''}`,
      },
    });
    modelMap[code] = created.id;
    modelCount++;

    // Create one ModelVersion per variant, using REAL spec data
    const variants = m.variants || [];
    const configNames = m.configs || [];
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const spec = v.spec || {};
      const versionName = configNames[i] || `配置${i + 1}`;

      // Extract component strings from spec
      const frame = spec['车架'] || null;
      const fork = spec['前叉'] || null;
      const handlebar = spec['把组'] || null;
      const seatpost = spec['座管'] || null;
      const groupset = [spec['手变'], spec['后拨']].filter(Boolean).join(' + ') || null;
      const brake = spec['刹车'] || null;
      const wheelset = [spec['车圈'], spec['花鼓']].filter(Boolean).join(' / ') || null;
      const tire = spec['车胎'] || null;
      const crankset = spec['牙盘'] || null;
      const cassette = spec['飞轮'] || null;
      const chain = spec['链条'] || null;
      const weight = spec['整车净重'] || null;

      // Also collect flat strings as component descriptions
      const componentDesc = Object.entries(spec)
        .filter(([k]) => !['整车净重'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');

      await prisma.modelVersion.create({
        data: {
          modelId: created.id,
          name: versionName,
          wheelset: wheelset || null,
          groupset: groupset || null,
          brake: brake || null,
          frame: frame || null,
          handlebar: handlebar || null,
          seatpost: seatpost || null,
          color: m.colors || null,
          size: m.size || null,
        },
      });
      versionCount++;
    }
  }
  console.log(` ✓ Models: ${modelCount} | Versions: ${versionCount}`);

  // ===== 4. Config library (from real component strings) =====
  // Extract all unique components from all variant specs
  const configTypes: Record<string, string> = {
    '车架': '车架', '前叉': '车架', '把组': '把组', '座管': '座管', '手变': '变速', '前拨': '变速', '后拨': '变速',
    '牙盘': '套件', '飞轮': '套件', '链条': '套件', '中轴': '套件', '刹车': '刹车', '花鼓': '轮组', '车圈': '轮组',
    '车胎': '轮胎', '坐垫': '坐垫', '脚踏': '其他',
  };
  const configCodes: Record<string, number> = {};
  let configCount = 0;

  for (const m of models) {
    for (const v of m.variants || []) {
      const spec = v.spec || {};
      for (const [key, val] of Object.entries(spec)) {
        if (!val || typeof val !== 'string' || key === '整车净重') continue;
        const type = configTypes[key] || '其他';
        const name = val.substring(0, 80);
        const codeKey = `${type}:${name}`;
        if (!configCodes[codeKey]) {
          configCodes[codeKey] = configCount++;
          const code = `CFG-${type}-${String(configCount).padStart(4, '0')}`;
          await prisma.config.create({
            data: { code, type, name: name.substring(0, 60), remark: `来自 ${m.model}` },
          });
        }
      }
    }
  }
  console.log(` ✓ Configs: ${configCount} (真实组件型号)`);

  // ===== 5. Sample Demands =====
  const mCyclone = await prisma.model.findFirst({ where: { code: { contains: 'CYCLONE' } }, include: { versions: true } });
  const mR10 = await prisma.model.findFirst({ where: { code: { contains: 'R10PRO' } }, include: { versions: true } });
  const mGravelV3 = await prisma.model.findFirst({ where: { code: { contains: 'GRAVEL_V3' } }, include: { versions: true } });
  const mM9 = await prisma.model.findFirst({ where: { code: { contains: 'M9' } }, include: { versions: true } });
  const mEM10 = await prisma.model.findFirst({ where: { code: { contains: 'EM10' } }, include: { versions: true } });
  const mC5 = await prisma.model.findFirst({ where: { code: { contains: 'C5PRO' } }, include: { versions: true } });

  const submitters: Record<string, any> = {};
  for (const u of ['zhaoliu', 'qianqi']) {
    submitters[u] = await prisma.user.findUnique({ where: { username: u } });
  }

  const demandsData = [
    { model: mCyclone, vIdx: 0, title: '龙卷风CYCLONE-三代 105大套版 海外Instagram素材', direction: '海外', purpose: ['Instagram', '海外客户展示'], content: ['整车展示', '细节特写', '配置展示'], scenes: ['棚拍', '城市道路'], urgency: '紧急', priority: 'P0', expectStart: '2026-09-23', expectEnd: '2026-09-24', status: 'shooting', submitter: 'zhaoliu', description: '海外客户重点关注Cyclone 三代公路竞速车，需要整车白底图+轮组/变速/刹车细节特写，用于Instagram发帖和WhatsApp客户资料包。' },
    { model: mEM10, vIdx: 0, title: 'EM10 碳版 国内抖音通勤短视频', direction: '国内', purpose: ['抖音', '视频号'], content: ['骑行实拍', '动态骑行', '产品开箱'], scenes: ['城市道路'], urgency: '重要', priority: 'P1', expectStart: '2026-09-25', expectEnd: '2026-09-26', status: 'pending', submitter: 'qianqi', description: '电助力EM10碳架版本通勤场景短视频，重点突出续航和骑行体验。' },
    { model: mGravelV3, vIdx: 2, title: 'Gravel V3电变 R7170大套 电商详情页', direction: '电商', purpose: ['电商详情页', '产品资料'], content: ['整车展示', '外观展示', '细节特写', '配置展示', '参数讲解'], scenes: ['棚拍'], urgency: '普通', priority: 'P2', expectStart: '2026-09-28', expectEnd: '2026-09-29', status: 'confirmed', submitter: 'zhaoliu', description: '砾石车 Gravel V3 电变版 R7170 大套白底整车图+配置细节用于官网详情页。' },
    { model: mR10, vIdx: 0, title: 'R10pro-碟刹(ET) 轮峰TX电变 海外客户展示', direction: '海外', purpose: ['海外客户展示', '产品资料'], content: ['整车展示', '配置展示'], scenes: ['棚拍', '展厅'], urgency: '重要', priority: 'P1', expectStart: '2026-09-28', expectEnd: '2026-09-29', status: 'confirmed', submitter: 'zhaoliu', description: 'R10pro碟刹ET版单独一组，突出轮峰TX无线电变速系统。' },
    { model: mM9, vIdx: 0, title: 'M9 SRAM GX版 国内山地车短视频', direction: '国内', purpose: ['抖音', '快手', '视频号'], content: ['骑行实拍', '动态骑行', '对比内容'], scenes: ['山路', '骑行场景'], urgency: '普通', priority: 'P2', expectStart: '2026-09-20', expectEnd: '2026-09-21', status: 'done', submitter: 'qianqi', description: '硬尾山地车 M9 SRAM GX 版本越野场景短视频推广。' },
    { model: mC5, vIdx: 0, title: 'C5pro(26款) RS24速 小红书种草', direction: '国内', purpose: ['小红书', '抖音'], content: ['外观展示', '上车效果', '场景内容', '模特出镜'], scenes: ['城市道路', '商业街'], urgency: '普通', priority: 'P2', expectStart: '2026-09-30', expectEnd: '2026-10-02', status: 'draft', submitter: 'qianqi', description: '入门铝合金公路车 C5pro 种草内容，高颜值城市骑行场景。' },
  ];

  let dCount = 0;
  for (const d of demandsData) {
    if (!d.model || !d.model.versions?.[d.vIdx]) continue;
    const ver = d.model.versions[d.vIdx];
    const user = submitters[d.submitter];
    if (!user) continue;

    const no = `REQ-202609${String(22 + dCount).padStart(2, '0')}-${String(dCount + 1).padStart(3, '0')}`;
    const dem = await prisma.demand.create({
      data: {
        no,
        title: d.title,
        submitterId: user.id,
        submitterName: user.name,
        submitterDept: user.dept,
        direction: d.direction,
        purpose: JSON.stringify(d.purpose),
        content: JSON.stringify(d.content),
        needPerson: '需要骑手',
        modelId: d.model.id,
        modelName: d.model.name,
        versionId: ver.id,
        versionName: ver.name,
        components: JSON.stringify({ wheelset: ver.wheelset, groupset: ver.groupset, brake: ver.brake, frame: ver.frame, handlebar: ver.handlebar, seatpost: ver.seatpost, color: ver.color, size: ver.size }),
        scenes: JSON.stringify(d.scenes),
        aspectRatio: JSON.stringify(['16:9', '9:16', '1:1']),
        videoDuration: JSON.stringify(['15s', '30s', '60s', '不限']),
        expectStart: d.expectStart,
        expectEnd: d.expectEnd,
        urgency: d.urgency,
        priority: d.priority,
        description: d.description,
        status: d.status,
      },
    });
    await prisma.demandHistory.create({ data: { demandId: dem.id, user: user.name, action: '创建需求', toStatus: d.status } });
    dCount++;
  }
  console.log(` ✓ Demands: ${dCount}`);

  // ===== 6. Sessions (拍摄场次) =====
  const shooters = [
    await prisma.user.findUnique({ where: { username: 'zhangsan' } }),
    await prisma.user.findUnique({ where: { username: 'lisi' } }),
    await prisma.user.findUnique({ where: { username: 'chener' } }),
  ];
  const allDemands = await prisma.demand.findMany({ include: { model: true } });
  const shooterUser = (u: any) => u;

  // 排期表：9月22日 ~ 10月3日
  const sessionPlan = [
    { date: '2026-09-22', start: '09:30', end: '12:00', title: 'Cyclone ET 棚拍', location: '骓特棚拍室', shooter: 0, demands: ['Cyclone', 'Cyclone-ET'], status: 'shooting', vehicleCount: 2, note: '白底整车 + 细节特写 + 配置展示' },
    { date: '2026-09-22', start: '14:00', end: '17:30', title: 'EM10 电助力 城市骑行场景', location: '深圳湾公园', shooter: 1, demands: ['EM10'], status: 'scheduled', vehicleCount: 1, note: '通勤场景短视频' },
    { date: '2026-09-23', start: '09:00', end: '12:30', title: 'Gravel V3 R7170 大套 棚拍', location: '骓特棚拍室', shooter: 0, demands: ['Gravel V3'], status: 'scheduled', vehicleCount: 2, note: '电商详情页素材' },
    { date: '2026-09-23', start: '14:00', end: '18:00', title: 'R10pro-碟刹(ET) 展厅拍摄', location: '骓特品牌展厅', shooter: 2, demands: ['R10pro', 'ET'], status: 'scheduled', vehicleCount: 1, note: '海外客户展示用途' },
    { date: '2026-09-24', start: '08:30', end: '12:00', title: 'M9 硬尾山地 越野实拍', location: '凤凰山森林公园', shooter: 1, demands: ['M9'], status: 'scheduled', vehicleCount: 3, note: '山路骑行 + 动态跟拍' },
    { date: '2026-09-25', start: '09:30', end: '17:00', title: 'C5pro 种草合集', location: '深圳湾 + 海岸城商业街', shooter: 0, demands: ['C5pro'], status: 'review', vehicleCount: 2, note: '小红书种草内容，含模特出镜' },
    { date: '2026-09-26', start: '10:00', end: '16:00', title: '多车型产品开箱', location: '骓特棚拍室', shooter: 2, demands: ['EM10', 'R10pro', 'Gravel V3'], status: 'scheduled', vehicleCount: 3, note: 'B站开箱视频' },
    { date: '2026-09-28', start: '09:00', end: '12:00', title: 'C8pro R7120 棚拍', location: '骓特棚拍室', shooter: 1, demands: ['C8pro'], status: 'scheduled', vehicleCount: 1, note: '白底整车' },
    { date: '2026-09-29', start: '13:30', end: '17:30', title: 'G2max 砾石车 城市通勤场景', location: '大沙河公园', shooter: 0, demands: ['G2max'], status: 'scheduled', vehicleCount: 2, note: '抖音短视频' },
    { date: '2026-09-30', start: '09:00', end: '12:00', title: 'Cyclone 3K版 波浪碳圈 棚拍', location: '骓特棚拍室', shooter: 2, demands: ['Cyclone-3k'], status: 'scheduled', vehicleCount: 1, note: '高端组详情页' },
    { date: '2026-10-02', start: '10:00', end: '15:00', title: '全家桶 多车型外拍', location: '东莞松山湖', shooter: 0, demands: ['M9', 'EM10', 'C5pro'], status: 'scheduled', vehicleCount: 5, note: '展会宣传素材' },
    { date: '2026-10-03', start: '09:30', end: '16:00', title: 'Gravel V3平把 电商详情', location: '骓特棚拍室', shooter: 1, demands: ['Gravel V3 平把'], status: 'scheduled', vehicleCount: 1, note: '白底 + 细节' },
  ];

  let sessionCount = 0;
  let taskCount = 0;
  const createdSessions: any[] = [];
  for (const sp of sessionPlan) {
    const shooter = shooters[sp.shooter];
    const no = `SHOOT-${sp.date.replace(/-/g, '')}-${String(sessionCount + 1).padStart(3, '0')}`;

    // 匹配 demand：按 model name 模糊匹配
    const matchedDemands = allDemands.filter(d => {
      const mn = d.modelName.toLowerCase();
      return sp.demands.some(kw => mn.includes(kw.toLowerCase()));
    });

    const sess = await prisma.session.create({
      data: {
        no,
        title: sp.title,
        date: sp.date,
        startTime: sp.start,
        endTime: sp.end,
        location: sp.location,
        shooterId: shooter?.id,
        shooterName: shooter?.name,
        status: sp.status,
        vehicleCount: sp.vehicleCount,
        note: sp.note,
      },
    });
    createdSessions.push(sess);
    sessionCount++;

    // 关联 demands
    for (const dem of matchedDemands) {
      await prisma.sessionDemand.create({ data: { sessionId: sess.id, demandId: dem.id } });

      // 每个 demand 生成 1-2 个 task
      const content = JSON.parse(dem.content || '[]');
      const scene = JSON.parse(dem.scenes || '[]');
      const tasksToCreate = Math.min(content.length, 3);
      for (let i = 0; i < tasksToCreate; i++) {
        const tno = `TASK-${sp.date.replace(/-/g, '')}-${String(taskCount + 1).padStart(3, '0')}`;
        await prisma.task.create({
          data: {
            no: tno,
            sessionId: sess.id,
            demandId: dem.id,
            title: `${dem.modelName} · ${content[i] || '素材'}`,
            content: JSON.stringify([content[i]]),
            aspectRatio: dem.aspectRatio,
            videoDuration: dem.videoDuration,
            shooterId: shooter?.id,
            shooterName: shooter?.name,
            status: sp.status === 'done' ? 'done' : sp.status === 'shooting' ? 'shooting' : sp.status === 'review' ? 'review' : 'pending',
          },
        });
        taskCount++;
      }
    }
  }
  console.log(` ✓ Sessions: ${sessionCount}`);
  console.log(` ✓ Tasks: ${taskCount}`);

  console.log('\n✅ Real-data seed complete!');
  console.log(`   Users: ${users.length} (6 submitters + 3 shooters + 2 admin/reviewer)`);
  console.log(`   Models: ${modelCount} (砾石9 + 公路24 + 山地19 + 电助力8)`);
  console.log(`   Versions: ${versionCount}`);
  console.log(`   Configs: ${configCount} (真实组件型号)`);
  console.log(`   Demands: ${dCount}`);
  console.log(`   Sessions: ${sessionCount}`);
  console.log(`   Tasks: ${taskCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
