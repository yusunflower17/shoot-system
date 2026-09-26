// prisma/seed.ts — TWITTER(骓特) 完整60车型 + 配置
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TWITTER 车型拍摄管理系统...');

  // ============ 用户 ============
  const users = [
    { username: 'admin', password: 'admin123', name: '管理员', dept: '管理', role: 'admin' },
    { username: 'wangwu', password: '123456', name: '王五', dept: '产品运营', role: 'reviewer' },
    { username: 'zhangsan', password: '123456', name: '张三', dept: '短视频团队', role: 'shooter' },
    { username: 'lisi', password: '123456', name: '李四', dept: '短视频团队', role: 'shooter' },
    { username: 'zhaoliu', password: '123456', name: '赵六', dept: '海外业务', role: 'submitter' },
    { username: 'qianqi', password: '123456', name: '钱七', dept: '国内业务', role: 'submitter' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, password: bcrypt.hashSync(u.password, 10), name: u.name, dept: u.dept, role: u.role },
    });
  }
  console.log(' ✓ Users:', users.length);

  // ============ 配置标准库 ============
  const configs: any[] = [
    // 车架
    { code: 'CFG-FRAME-CARBON', type: '车架', name: '碳纤维', enName: 'Carbon Fiber' },
    { code: 'CFG-FRAME-CARBON-AERO', type: '车架', name: '碳纤维气动', enName: 'Aero Carbon' },
    { code: 'CFG-FRAME-ALLOY', type: '车架', name: '铝合金', enName: 'Aluminum Alloy' },
    { code: 'CFG-FRAME-CARBON-ALLOY', type: '车架', name: '碳铝混合', enName: 'Carbon + Alloy' },
    // 套件
    { code: 'CFG-GRP-105-DI2', type: '套件', name: 'Shimano 105 Di2', enName: 'Shimano 105 Di2' },
    { code: 'CFG-GRP-105', type: '套件', name: 'Shimano 105', enName: 'Shimano 105' },
    { code: 'CFG-GRP-ULTEGRA-DI2', type: '套件', name: 'Shimano Ultegra Di2', enName: 'Shimano Ultegra Di2' },
    { code: 'CFG-GRP-ULTEGRA', type: '套件', name: 'Shimano Ultegra', enName: 'Shimano Ultegra' },
    { code: 'CFG-GRP-DURA-ACE-DI2', type: '套件', name: 'Shimano Dura-Ace Di2', enName: 'Shimano Dura-Ace Di2' },
    { code: 'CFG-GRP-TIAGRA', type: '套件', name: 'Shimano Tiagra', enName: 'Shimano Tiagra' },
    { code: 'CFG-GRP-SORA', type: '套件', name: 'Shimano Sora', enName: 'Shimano Sora' },
    { code: 'CFG-GRP-RIVAL', type: '套件', name: 'SRAM Rival', enName: 'SRAM Rival' },
    { code: 'CFG-GRP-FORCE', type: '套件', name: 'SRAM Force', enName: 'SRAM Force' },
    { code: 'CFG-GRP-RED', type: '套件', name: 'SRAM Red', enName: 'SRAM Red' },
    { code: 'CFG-GRP-GX', type: '套件', name: 'SRAM GX', enName: 'SRAM GX' },
    { code: 'CFG-GRP-NX', type: '套件', name: 'SRAM NX', enName: 'SRAM NX' },
    { code: 'CFG-GRP-SENSAH', type: '套件', name: 'SENSAH', enName: 'SENSAH' },
    { code: 'CFG-GRP-WHEELTOP', type: '套件', name: 'WHEELTOP', enName: 'WHEELTOP' },
    { code: 'CFG-GRP-DEORE-XT', type: '套件', name: 'Shimano Deore XT', enName: 'Shimano Deore XT' },
    { code: 'CFG-GRP-DEORE', type: '套件', name: 'Shimano Deore', enName: 'Shimano Deore' },
    { code: 'CFG-GRP-ALIVIO', type: '套件', name: 'Shimano Alivio', enName: 'Shimano Alivio' },
    // 刹车
    { code: 'CFG-BRAKE-HYD-DISC', type: '刹车', name: '油碟', enName: 'Hydraulic Disc' },
    { code: 'CFG-BRAKE-MEC-DISC', type: '刹车', name: '线碟', enName: 'Mechanical Disc' },
    { code: 'CFG-BRAKE-RIM', type: '刹车', name: '圈刹', enName: 'Rim Brake' },
    // 轮组
    { code: 'CFG-WHL-CARBON-30', type: '轮组', name: '碳轮30', enName: 'Carbon 30mm' },
    { code: 'CFG-WHL-CARBON-50', type: '轮组', name: '碳轮50', enName: 'Carbon 50mm' },
    { code: 'CFG-WHL-CARBON-60', type: '轮组', name: '碳轮60', enName: 'Carbon 60mm' },
    { code: 'CFG-WHL-CARBON-80', type: '轮组', name: '碳轮80', enName: 'Carbon 80mm' },
    { code: 'CFG-WHL-ALLOY', type: '轮组', name: '铝轮', enName: 'Alloy Wheelset' },
    { code: 'CFG-WHL-ALLOY-29', type: '轮组', name: '铝轮29寸', enName: 'Alloy 29er' },
    { code: 'CFG-WHL-ALLOY-275', type: '轮组', name: '铝轮27.5寸', enName: 'Alloy 27.5' },
    { code: 'CFG-WHL-SENTYEH', type: '轮组', name: 'SENTYEH轮组', enName: 'SENTYEH Wheelset' },
    // 把组
    { code: 'CFG-HB-CARBON', type: '把组', name: '碳把', enName: 'Carbon Handlebar' },
    { code: 'CFG-HB-ALLOY', type: '把组', name: '铝把', enName: 'Alloy Handlebar' },
    { code: 'CFG-HB-AERO', type: '把组', name: '气动把', enName: 'Aero Handlebar' },
    { code: 'CFG-HB-FLAT', type: '把组', name: '平把', enName: 'Flat Bar' },
    // 座管
    { code: 'CFG-SP-CARBON', type: '座管', name: '碳座管', enName: 'Carbon Seatpost' },
    { code: 'CFG-SP-ALLOY', type: '座管', name: '铝座管', enName: 'Alloy Seatpost' },
    // 颜色
    { code: 'CFG-COLOR-BLACK', type: '颜色', name: '黑色', enName: 'Black' },
    { code: 'CFG-COLOR-WHITE', type: '颜色', name: '白色', enName: 'White' },
    { code: 'CFG-COLOR-MATTE-BLK', type: '颜色', name: '哑光黑', enName: 'Matte Black' },
    { code: 'CFG-COLOR-GLOSS-WHT', type: '颜色', name: '珍珠白', enName: 'Pearl White' },
    { code: 'CFG-COLOR-RED', type: '颜色', name: '红色', enName: 'Red' },
    { code: 'CFG-COLOR-BLUE', type: '颜色', name: '蓝色', enName: 'Blue' },
    { code: 'CFG-COLOR-GREEN', type: '颜色', name: '荧光绿', enName: 'Neon Green' },
    { code: 'CFG-COLOR-SILVER', type: '颜色', name: '银黑', enName: 'Silver Black' },
    { code: 'CFG-COLOR-GOLD', type: '颜色', name: '渐变金', enName: 'Gradient Gold' },
    // 尺寸
    { code: 'CFG-SIZE-44', type: '尺寸', name: '44', enName: '44cm' },
    { code: 'CFG-SIZE-46', type: '尺寸', name: '46', enName: '46cm' },
    { code: 'CFG-SIZE-48', type: '尺寸', name: '48', enName: '48cm' },
    { code: 'CFG-SIZE-50', type: '尺寸', name: '50', enName: '50cm' },
    { code: 'CFG-SIZE-52', type: '尺寸', name: '52', enName: '52cm' },
    { code: 'CFG-SIZE-54', type: '尺寸', name: '54', enName: '54cm' },
    { code: 'CFG-SIZE-S', type: '尺寸', name: 'S', enName: 'Size S' },
    { code: 'CFG-SIZE-M', type: '尺寸', name: 'M', enName: 'Size M' },
    { code: 'CFG-SIZE-L', type: '尺寸', name: 'L', enName: 'Size L' },
    { code: 'CFG-SIZE-XL', type: '尺寸', name: 'XL', enName: 'Size XL' },
  ];
  for (const c of configs) {
    await prisma.config.upsert({ where: { code: c.code }, update: {}, create: { ...c, status: 'active' } });
  }
  console.log(' ✓ Configs:', configs.length);

  // ============ 60个车型 ============
  // 分类: gravel(砾石) 9, road(公路) 24, mtb(山地) 19, ebike(电助力) 8
  const modelsData: any[] = [
    // === GRAVEL 砾石车 (9) ===
    { code: 'TW-G2MAX', brand: 'TWITTER', series: 'Gravel', name: 'G2max', enName: 'G2max', type: '砾石车', position: '弯把·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/00_g2max_1.jpg' },
    { code: 'TW-G2MAX-FLAT', brand: 'TWITTER', series: 'Gravel', name: 'G2max平把', enName: 'G2max Flat', type: '砾石车', position: '平把·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/01_g2max_flat_1.jpg' },
    { code: 'TW-GRAVEL-V1', brand: 'TWITTER', series: 'Gravel', name: 'Gravel V1', enName: 'Gravel V1', type: '砾石车', position: '弯把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/02_gravel_v1_1.jpg' },
    { code: 'TW-GRAVEL-V1-FLAT', brand: 'TWITTER', series: 'Gravel', name: 'Gravel V1平把', enName: 'Gravel V1 Flat', type: '砾石车', position: '平把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/03_gravel_v1_flat_1.jpg' },
    { code: 'TW-GRAVEL-V3', brand: 'TWITTER', series: 'Gravel', name: 'Gravel V3', enName: 'Gravel V3', type: '砾石车', position: '弯把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/04_gravel_v3_1.jpg' },
    { code: 'TW-GRAVEL-V3-ELEC', brand: 'TWITTER', series: 'Gravel', name: 'Gravel V3电变', enName: 'Gravel V3 Electronic', type: '砾石车', position: '弯把·碳纤维·电变', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/05_gravel_v3_electronic_1.jpg' },
    { code: 'TW-GRAVEL-V3-FLAT', brand: 'TWITTER', series: 'Gravel', name: 'Gravel V3平把', enName: 'Gravel V3 Flat', type: '砾石车', position: '平把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/06_gravel_v3_flat_1.jpg' },
    { code: 'TW-GRAVEL-X', brand: 'TWITTER', series: 'Gravel', name: 'Gravel X', enName: 'Gravel X', type: '砾石车', position: '弯把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/07_gravel_x_1.jpg' },
    { code: 'TW-GRAVEL-X-FLAT', brand: 'TWITTER', series: 'Gravel', name: 'Gravel X平把', enName: 'Gravel X Flat', type: '砾石车', position: '平把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/08_gravel_x_flat_1.jpg' },

    // === ROAD 公路车 (24) ===
    { code: 'TW-C5PRO-26', brand: 'TWITTER', series: 'C5', name: 'C5pro(26款)', enName: 'C5pro 2026', type: '公路车', position: '公路竞速·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/09_road-c5pro-26_1.jpg' },
    { code: 'TW-C6-26', brand: 'TWITTER', series: 'C6', name: 'C6(26款)', enName: 'C6 2026', type: '公路车', position: '公路竞速·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/10_road-c6-26_1.jpg' },
    { code: 'TW-C8PRO-26', brand: 'TWITTER', series: 'C8', name: 'C8pro(26款)', enName: 'C8pro 2026', type: '公路车', position: '公路竞速·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/11_road-c8pro-26_1.jpg' },
    { code: 'TW-CYCLONE-105', brand: 'TWITTER', series: 'Cyclone', name: '龙卷风CYCLONE-三代(105大套)', enName: 'Cyclone Gen3 105 Kit', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/12_road-cyclone-105-big_1.jpg' },
    { code: 'TW-CYCLONE-3K', brand: 'TWITTER', series: 'Cyclone', name: '龙卷风CYCLONE-三代(3K版)', enName: 'Cyclone Gen3 3K', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/13_road-cyclone-3k_1.jpg' },
    { code: 'TW-CYCLONE-ET', brand: 'TWITTER', series: 'Cyclone', name: '龙卷风CYCLONE-三代(ET)', enName: 'Cyclone Gen3 ET', type: '公路车', position: '公路竞速·碳纤维·电变', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/14_road-cyclone-et_1.jpg' },
    { code: 'TW-CYCLONE-R7120', brand: 'TWITTER', series: 'Cyclone', name: '龙卷风CYCLONE-三代(R7120小套)', enName: 'Cyclone Gen3 R7120', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/15_road-cyclone-r7120-small_1.jpg' },
    { code: 'TW-CYCLONE-RS24', brand: 'TWITTER', series: 'Cyclone', name: '龙卷风CYCLONE-三代(RS24)', enName: 'Cyclone Gen3 RS24', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/16_road-cyclone-rs24_1.jpg' },
    { code: 'TW-FREEDOM', brand: 'TWITTER', series: 'Freedom', name: '骓风Freedom', enName: 'Freedom', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/17_road-freedom_1.jpg' },
    { code: 'TW-R10-RIM', brand: 'TWITTER', series: 'R10', name: 'R10-圈刹', enName: 'R10 Rim', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/18_road-r10-rim_1.jpg' },
    { code: 'TW-R10PRO-DISC-ET', brand: 'TWITTER', series: 'R10', name: 'R10pro-碟刹(ET)', enName: 'R10pro Disc ET', type: '公路车', position: '公路竞速·碳纤维·电变', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/19_road-r10pro-disc-et_1.jpg' },
    { code: 'TW-R10PRO-DISC-SPORT', brand: 'TWITTER', series: 'R10', name: 'R10pro-碟刹(运动版)', enName: 'R10pro Disc Sport', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/20_road-r10pro-disc-sport_1.jpg' },
    { code: 'TW-R12PRO-FLAT-26', brand: 'TWITTER', series: 'R12', name: 'R12pro平把特供(26款)', enName: 'R12pro Flat Special 2026', type: '公路车', position: '平把·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/21_road-r12pro-flat-special-26_1.jpg' },
    { code: 'TW-R12PRO-26', brand: 'TWITTER', series: 'R12', name: 'R12pro 特供(26款)', enName: 'R12pro Special 2026', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/22_road-r12pro-special-26_1.jpg' },
    { code: 'TW-R15PRO-3', brand: 'TWITTER', series: 'R15', name: 'R15pro三代', enName: 'R15pro Gen3', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/23_road-r15pro-3_1.jpg' },
    { code: 'TW-R18-RACING', brand: 'TWITTER', series: 'R18', name: 'R18(竞速版)', enName: 'R18 Racing', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/24_road-r18-racing_1.jpg' },
    { code: 'TW-R18-SPORT', brand: 'TWITTER', series: 'R18', name: 'R18(运动版)', enName: 'R18 Sport', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/25_road-r18-sport_1.jpg' },
    { code: 'TW-R5PRO-2', brand: 'TWITTER', series: 'R5', name: 'R5pro二代', enName: 'R5pro Gen2', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/26_road-r5pro-2_1.jpg' },
    { code: 'TW-R5PRO-FINAL', brand: 'TWITTER', series: 'R5', name: 'R5pro终结版', enName: 'R5pro Final', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/27_road-r5pro-final_1.jpg' },
    { code: 'TW-STEALTHPRO-2-26', brand: 'TWITTER', series: 'Stealth', name: '突袭pro二代(26款)', enName: 'Stealthpro Gen2 2026', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/28_road-stealthpro-2-26_1.jpg' },
    { code: 'TW-T10PRO-2-26', brand: 'TWITTER', series: 'T10', name: 'T10pro二代(26款)', enName: 'T10pro Gen2 2026', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/29_road-t10pro-2-26_1.jpg' },
    { code: 'TW-T3-TT', brand: 'TWITTER', series: 'T3', name: 'T3(铁三TT)', enName: 'T3 TT', type: '公路车', position: '铁三TT·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/30_road-t3-tt_1.jpg' },
    { code: 'TW-T8PRO-2-26', brand: 'TWITTER', series: 'T8', name: 'T8pro二代(26款)', enName: 'T8pro Gen2 2026', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/31_road-t8pro-2-26_1.jpg' },
    { code: 'TW-X7', brand: 'TWITTER', series: 'X7', name: 'X7', enName: 'X7', type: '公路车', position: '公路竞速·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/32_road-x7_1.jpg' },

    // === MTB 山地车 (19) ===
    { code: 'TW-ENDU150', brand: 'TWITTER', series: 'Endurance', name: 'ENDU150', enName: 'Endu150', type: '山地车', position: '耐力山地·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/33_mtb-endu150_1.jpg' },
    { code: 'TW-GTR-DIRTJUMP', brand: 'TWITTER', series: 'GTR', name: 'GTR 土坡车', enName: 'GTR Dirt Jump', type: '山地车', position: '土坡车·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/34_mtb-gtr-dirtjump_1.jpg' },
    { code: 'TW-GTR-SPECIAL', brand: 'TWITTER', series: 'GTR', name: 'GTR特供', enName: 'GTR Special', type: '山地车', position: '硬尾山地·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/35_mtb-gtr-special_1.jpg' },
    { code: 'TW-KID20-CARBON', brand: 'TWITTER', series: 'Kids', name: 'KID20碳纤', enName: 'Kid20 Carbon', type: '山地车', position: '儿童车·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/36_mtb-kid20-carbon_1.jpg' },
    { code: 'TW-LEOPARDPRO', brand: 'TWITTER', series: 'Leopard', name: '美洲豹LEOPARDpro', enName: 'Leopardpro', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/37_mtb-leopardpro_1.jpg' },
    { code: 'TW-LEOPARDPRO-LIGHT', brand: 'TWITTER', series: 'Leopard', name: '美洲豹LEOPARDpro轻量版', enName: 'Leopardpro Light', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/38_mtb-leopardpro-light_1.jpg' },
    { code: 'TW-M10', brand: 'TWITTER', series: 'M', name: 'M10', enName: 'M10', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/39_mtb-m10_1.jpg' },
    { code: 'TW-M3-THRU', brand: 'TWITTER', series: 'M', name: 'M3 桶轴版', enName: 'M3 Thru', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/40_mtb-m3-thru_1.jpg' },
    { code: 'TW-M5-HYBRID', brand: 'TWITTER', series: 'M', name: 'M5 山马版', enName: 'M5 Hybrid', type: '山地车', position: '林道山马·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/41_mtb-m5-hybrid_1.jpg' },
    { code: 'TW-M5-THRU', brand: 'TWITTER', series: 'M', name: 'M5桶轴版', enName: 'M5 Thru', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/42_mtb-m5-thru_1.jpg' },
    { code: 'TW-M9', brand: 'TWITTER', series: 'M', name: 'M9', enName: 'M9', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/43_mtb-m9_1.jpg' },
    { code: 'TW-MT390', brand: 'TWITTER', series: 'MT', name: 'MT390', enName: 'MT390', type: '山地车', position: '硬尾山地·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/44_mtb-mt390_1.jpg' },
    { code: 'TW-MT590', brand: 'TWITTER', series: 'MT', name: 'MT590', enName: 'MT590', type: '山地车', position: '硬尾山地·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/45_mtb-mt590_1.jpg' },
    { code: 'TW-OVERLORD', brand: 'TWITTER', series: 'Overlord', name: 'OVERLORD', enName: 'Overlord', type: '山地车', position: '全避震山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/46_mtb-overlord-full-suspension_1.jpg' },
    { code: 'TW-PREDATORPRO-THRU', brand: 'TWITTER', series: 'Predator', name: '铁血战士 PREDATORpro桶轴版', enName: 'Predatorpro Thru', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/47_mtb-predatorpro-thru_1.jpg' },
    { code: 'TW-RIDER-QR', brand: 'TWITTER', series: 'Rider', name: '骑士RIDER 快拆版', enName: 'Rider QR', type: '山地车', position: '硬尾山地·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/48_mtb-rider-qr_1.jpg' },
    { code: 'TW-RIDER-THRU', brand: 'TWITTER', series: 'Rider', name: '骑士RIDER 桶轴版', enName: 'Rider Thru', type: '山地车', position: '硬尾山地·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/49_mtb-rider-thru_1.jpg' },
    { code: 'TW-WARRIORPRO-LIGHT', brand: 'TWITTER', series: 'Warrior', name: '勇士WARRIORpro轻量版', enName: 'Warriorpro Light', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/50_mtb-warriorpro-light_1.jpg' },
    { code: 'TW-WARRIORPRO-THRU-25', brand: 'TWITTER', series: 'Warrior', name: '勇士WARRIORpro桶轴版(25款)', enName: 'Warriorpro Thru 2025', type: '山地车', position: '硬尾山地·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/51_mtb-warriorpro-thru-25_1.jpg' },

    // === EBIKE 电助力 (8) ===
    { code: 'TW-EC1SP', brand: 'TWITTER', series: 'EC', name: 'EC1(特供)', enName: 'EC1 Special', type: '电助力', position: '电助力·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-ec1sp_1.png' },
    { code: 'TW-EC2', brand: 'TWITTER', series: 'EC', name: 'EC2', enName: 'EC2', type: '电助力', position: '电助力·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-ec2_1.png' },
    { code: 'TW-EM5-3RD', brand: 'TWITTER', series: 'EM', name: 'EM5 三代', enName: 'EM5 Gen3', type: '电助力', position: '电助力·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-em5-3rd_1.png' },
    { code: 'TW-EM6-4TH', brand: 'TWITTER', series: 'EM', name: 'EM6 四代', enName: 'EM6 Gen4', type: '电助力', position: '电助力·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-em6-4th_1.png' },
    { code: 'TW-EM7', brand: 'TWITTER', series: 'EM', name: 'EM7', enName: 'EM7', type: '电助力', position: '电助力·铝合金', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-em7_1.png' },
    { code: 'TW-EM8', brand: 'TWITTER', series: 'EM', name: 'EM8', enName: 'EM8', type: '电助力', position: '电助力·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-em8_1.png' },
    { code: 'TW-EM10', brand: 'TWITTER', series: 'EM', name: 'EM10', enName: 'EM10', type: '电助力', position: '电助力·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-em10_1.png' },
    { code: 'TW-EM19', brand: 'TWITTER', series: 'EM', name: 'EM19', enName: 'EM19', type: '电助力', position: '电助力·碳纤维', status: '在售', launchStatus: true, image: 'https://bucolic-maamoul-d1fe02.netlify.app/images/ebike-em19_1.png' },
  ];

  const modelMap: Record<string, string> = {};
  for (const m of modelsData) {
    const created = await prisma.model.upsert({
      where: { code: m.code },
      update: {},
      create: { code: m.code, brand: m.brand, series: m.series, name: m.name, enName: m.enName, type: m.type, position: m.position, status: m.status, launchStatus: m.launchStatus, image: m.image },
    });
    modelMap[m.code] = created.id;
  }
  console.log(' ✓ Models:', modelsData.length);

  // ============ 版本（每个车型配 1-2 个典型版本） ============
  // 版本生成规则：按车型 type + position 中的配置特征自动推导
  const versionDefs: Record<string, any[]> = {
    // gravel - 弯把款 + 平把款
    'TW-G2MAX': [{ name: '弯把标准版', wheelset: '铝轮', groupset: 'SENSAH', brake: '油碟', frame: '铝合金', handlebar: '弯把', seatpost: '铝座管', color: '黑色', size: 'S,M,L' }],
    'TW-G2MAX-FLAT': [{ name: '平把标准版', wheelset: '铝轮', groupset: 'SENSAH', brake: '油碟', frame: '铝合金', handlebar: '平把', seatpost: '铝座管', color: '珍珠白', size: 'S,M,L' }],
    'TW-GRAVEL-V1': [{ name: '碳轮版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52' }],
    'TW-GRAVEL-V1-FLAT': [{ name: '平把碳版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '平把碳', seatpost: '碳座管', color: '哑光黑', size: '48,50,52' }],
    'TW-GRAVEL-V3': [{ name: 'Shimano 105版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '渐变金', size: '48,50,52,54' }, { name: 'SRAM Rival版', wheelset: '碳轮50', groupset: 'SRAM Rival', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-GRAVEL-V3-ELEC': [{ name: '105 Di2电变版', wheelset: '碳轮50', groupset: 'Shimano 105 Di2', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }],
    'TW-GRAVEL-V3-FLAT': [{ name: '平把版', wheelset: '碳轮30', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '平把碳', seatpost: '碳座管', color: '珍珠白', size: '48,50,52' }],
    'TW-GRAVEL-X': [{ name: '碳轮60版', wheelset: '碳轮60', groupset: 'Shimano Ultegra', brake: '油碟', frame: '碳纤维气动', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-GRAVEL-X-FLAT': [{ name: '平把舒适版', wheelset: '铝轮', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '平把碳', seatpost: '碳座管', color: '珍珠白', size: '48,50,52' }],

    // road - 根据套件版本
    'TW-C5PRO-26': [{ name: 'Shimano 105版', wheelset: '铝轮', groupset: 'Shimano 105', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '哑光黑', size: '46,48,50,52' }],
    'TW-C6-26': [{ name: 'Shimano Tiagra版', wheelset: '铝轮', groupset: 'Shimano Tiagra', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '珍珠白', size: '46,48,50,52' }],
    'TW-C8PRO-26': [{ name: 'Shimano 105版', wheelset: '铝轮', groupset: 'Shimano 105', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '黑色', size: '46,48,50,52,54' }],
    'TW-CYCLONE-105': [{ name: '105大套版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }],
    'TW-CYCLONE-3K': [{ name: '3K碳纹版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '3K碳纹', size: '48,50,52,54' }],
    'TW-CYCLONE-ET': [{ name: 'Dura-Ace Di2版', wheelset: '碳轮60', groupset: 'Shimano Dura-Ace Di2', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }],
    'TW-CYCLONE-R7120': [{ name: '105 R7120版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-CYCLONE-RS24': [{ name: 'RS24轮组版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '珍珠白', size: '48,50,52,54' }],
    'TW-FREEDOM': [{ name: 'SRAM Force版', wheelset: '碳轮60', groupset: 'SRAM Force', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '渐变色', size: '48,50,52,54' }],
    'TW-R10-RIM': [{ name: '圈刹版', wheelset: '碳轮50', groupset: 'Shimano Ultegra', brake: '圈刹', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-R10PRO-DISC-ET': [{ name: 'Dura-Ace Di2版', wheelset: '碳轮50', groupset: 'Shimano Dura-Ace Di2', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }, { name: '50刀平碳圈版', wheelset: '碳轮50', groupset: 'Shimano 105 Di2', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '珍珠白', size: '48,50,52,54' }],
    'TW-R10PRO-DISC-SPORT': [{ name: '105机械版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }, { name: '铝轮铝把版', wheelset: '铝轮', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '珍珠白', size: '48,50,52,54' }],
    'TW-R12PRO-FLAT-26': [{ name: '平把舒适版', wheelset: '碳轮30', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '平把碳', seatpost: '碳座管', color: '珍珠白', size: '48,50,52' }],
    'TW-R12PRO-26': [{ name: 'Ultegra版', wheelset: '碳轮50', groupset: 'Shimano Ultegra', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '渐变金', size: '48,50,52,54' }],
    'TW-R15PRO-3': [{ name: '三代 105 Di2版', wheelset: '碳轮50', groupset: 'Shimano 105 Di2', brake: '油碟', frame: '碳纤维气动', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }],
    'TW-R18-RACING': [{ name: '竞速版 Dura-Ace', wheelset: '碳轮80', groupset: 'Shimano Dura-Ace', brake: '油碟', frame: '碳纤维气动', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '50,52,54,56' }],
    'TW-R18-SPORT': [{ name: '运动版 105', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '珍珠白', size: '48,50,52,54' }],
    'TW-R5PRO-2': [{ name: '二代 Ultegra版', wheelset: '碳轮50', groupset: 'Shimano Ultegra', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-R5PRO-FINAL': [{ name: '终结版 Dura-Ace Di2', wheelset: '碳轮60', groupset: 'Shimano Dura-Ace Di2', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }],
    'TW-STEALTHPRO-2-26': [{ name: '突袭二代 105版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维气动', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-T10PRO-2-26': [{ name: 'T10pro二代 Ultegra版', wheelset: '碳轮50', groupset: 'Shimano Ultegra', brake: '油碟', frame: '碳纤维气动', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: '48,50,52,54' }],
    'TW-T3-TT': [{ name: '铁三TT版', wheelset: '碳轮60', groupset: 'Shimano Ultegra Di2', brake: '油碟', frame: '碳纤维气动', handlebar: '气动把', seatpost: '碳座管', color: '哑光黑', size: '48,50,52,54' }],
    'TW-T8PRO-2-26': [{ name: 'T8pro二代 105版', wheelset: '碳轮50', groupset: 'Shimano 105', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '珍珠白', size: '48,50,52,54' }],
    'TW-X7': [{ name: 'X7 SRAM Rival版', wheelset: '碳轮50', groupset: 'SRAM Rival', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '渐变红', size: '48,50,52,54' }],

    // mtb
    'TW-ENDU150': [{ name: '耐力版', wheelset: '铝轮29', groupset: 'SRAM GX', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '黑色', size: 'M,L,XL' }],
    'TW-GTR-DIRTJUMP': [{ name: '土坡标准版', wheelset: '铝轮', groupset: 'SRAM NX', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '荧光绿', size: 'One Size' }],
    'TW-GTR-SPECIAL': [{ name: '硬尾标准版', wheelset: '铝轮27.5', groupset: 'Shimano Deore', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '黑色', size: 'S,M,L' }],
    'TW-KID20-CARBON': [{ name: '儿童碳版', wheelset: '铝轮', groupset: 'Shimano Alivio', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '铝座管', color: '珍珠白', size: '20寸' }],
    'TW-LEOPARDPRO': [{ name: 'Leopardpro GX版', wheelset: '碳轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '黑色', size: 'M,L,XL' }, { name: 'Leopardpro XO版', wheelset: '碳轮29', groupset: 'SRAM XO', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '橙色', size: 'M,L,XL' }],
    'TW-LEOPARDPRO-LIGHT': [{ name: '轻量版', wheelset: '碳轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: 'M,L,XL' }],
    'TW-M10': [{ name: 'M10 SRAM GX版', wheelset: '铝轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '荧光绿', size: 'M,L,XL' }],
    'TW-M3-THRU': [{ name: 'M3 桶轴版', wheelset: '铝轮29', groupset: 'Shimano Deore XT', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '黑色', size: 'M,L' }],
    'TW-M5-HYBRID': [{ name: '山马版', wheelset: '铝轮29', groupset: 'Shimano Deore', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '铝座管', color: '银黑', size: 'M,L' }],
    'TW-M5-THRU': [{ name: '桶轴版', wheelset: '铝轮29', groupset: 'Shimano Deore XT', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '黑色', size: 'M,L,XL' }],
    'TW-M9': [{ name: 'M9 SRAM GX版', wheelset: '铝轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '荧光绿', size: 'M,L,XL' }],
    'TW-MT390': [{ name: 'MT390 入门版', wheelset: '铝轮27.5', groupset: 'Shimano Alivio', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '黑色', size: 'S,M,L' }],
    'TW-MT590': [{ name: 'MT590 进阶版', wheelset: '铝轮29', groupset: 'Shimano Deore', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '珍珠白', size: 'S,M,L' }],
    'TW-OVERLORD': [{ name: '全避震 SRAM Force版', wheelset: '碳轮29', groupset: 'SRAM Force', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: 'M,L,XL' }],
    'TW-PREDATORPRO-THRU': [{ name: '铁血战士 GX版', wheelset: '铝轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '黑色', size: 'M,L' }],
    'TW-RIDER-QR': [{ name: '骑士快拆版', wheelset: '铝轮29', groupset: 'Shimano Deore', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '黑色', size: 'M,L' }],
    'TW-RIDER-THRU': [{ name: '骑士桶轴版', wheelset: '铝轮29', groupset: 'Shimano Deore XT', brake: '油碟', frame: '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '珍珠白', size: 'M,L' }],
    'TW-WARRIORPRO-LIGHT': [{ name: '勇士轻量版', wheelset: '碳轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: 'M,L' }],
    'TW-WARRIORPRO-THRU-25': [{ name: '勇士桶轴版(25款)', wheelset: '碳轮29', groupset: 'SRAM GX', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '荧光绿', size: 'M,L' }],

    // ebike
    'TW-EC1SP': [{ name: '特供标准版', wheelset: '铝轮', groupset: 'Shimano Deore', brake: '油碟', frame: '铝合金', handlebar: '平把', seatpost: '铝座管', color: '珍珠白', size: 'M' }],
    'TW-EC2': [{ name: '标准版', wheelset: '铝轮', groupset: 'Shimano Deore', brake: '油碟', frame: '铝合金', handlebar: '平把', seatpost: '铝座管', color: '黑色', size: 'M,L' }],
    'TW-EM5-3RD': [{ name: '三代标准版', wheelset: '铝轮', groupset: 'Shimano Deore XT', brake: '油碟', frame: '铝合金', handlebar: '平把', seatpost: '铝座管', color: '银黑', size: 'M,L' }],
    'TW-EM6-4TH': [{ name: '四代标准版', wheelset: '铝轮', groupset: 'Shimano Deore XT', brake: '油碟', frame: '铝合金', handlebar: '平把', seatpost: '铝座管', color: '黑色', size: 'M,L' }],
    'TW-EM7': [{ name: 'EM7标准版', wheelset: '铝轮', groupset: 'Shimano Deore XT', brake: '油碟', frame: '铝合金', handlebar: '平把', seatpost: '铝座管', color: '珍珠白', size: 'M,L' }],
    'TW-EM8': [{ name: 'EM8碳版', wheelset: '铝轮', groupset: 'Shimano Deore XT', brake: '油碟', frame: '碳纤维', handlebar: '铝把', seatpost: '碳座管', color: '黑色', size: 'M,L' }],
    'TW-EM10': [{ name: 'EM10碳版', wheelset: '碳轮30', groupset: 'Shimano Deore XT', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '哑光黑', size: 'M,L' }],
    'TW-EM19': [{ name: 'EM19碳版', wheelset: '碳轮30', groupset: 'Shimano Deore XT', brake: '油碟', frame: '碳纤维', handlebar: '碳把', seatpost: '碳座管', color: '黑色', size: 'M,L' }],
  };

  let versionCount = 0;
  for (const m of modelsData) {
    const mid = modelMap[m.code];
    if (!mid) continue;
    const defs = versionDefs[m.code];
    if (!defs) {
      // fallback: create one generic version
      await prisma.modelVersion.create({
        data: { modelId: mid, name: '标准版', wheelset: m.position?.includes('碳') ? '碳轮' : '铝轮', groupset: 'SENSAH', brake: '油碟', frame: m.position?.includes('碳') ? '碳纤维' : '铝合金', handlebar: '铝把', seatpost: '铝座管', color: '黑色', size: 'M' },
      });
      versionCount++;
    } else {
      for (const v of defs) {
        await prisma.modelVersion.create({ data: { modelId: mid, ...v } });
        versionCount++;
      }
    }
  }
  console.log(' ✓ Versions:', versionCount);

  // ============ 示例拍摄需求（从之前 seed 简化，关联新的车型） ============
  const mR10proEt = await prisma.model.findUnique({ where: { code: 'TW-R10PRO-DISC-ET' }, include: { versions: true } });
  const mCycloneEt = await prisma.model.findUnique({ where: { code: 'TW-CYCLONE-ET' }, include: { versions: true } });
  const mGravelV3Elec = await prisma.model.findUnique({ where: { code: 'TW-GRAVEL-V3-ELEC' }, include: { versions: true } });
  const mM9 = await prisma.model.findUnique({ where: { code: 'TW-M9' }, include: { versions: true } });
  const mEm10 = await prisma.model.findUnique({ where: { code: 'TW-EM10' }, include: { versions: true } });

  const findVer = (arr: any[], name: string) => arr?.find(v => v.name === name) || arr?.[0];
  const demTitle = (m: any, v: any) => `${m.name}｜${v?.name || ''}｜海外Instagram素材`;

  const demandsData = [
    { no: 'REQ-20260922-001', title: demTitle(mR10proEt, findVer(mR10proEt?.versions, 'Dura-Ace Di2版')), modelCode: 'TW-R10PRO-DISC-ET', vname: 'Dura-Ace Di2版', status: 'shooting', submitter: 'zhaoliu', submitterName: '赵六', submitterDept: '海外业务', direction: '海外', purpose: ['Instagram', '海外客户展示'], content: ['整车展示', '细节特写', '配置展示'], needPerson: '需要骑手', scenes: ['棚拍', '城市道路'], aspectRatio: ['16:9', '1:1', '9:16'], videoDuration: ['30s', '不限'], expectStart: '2026-09-22', expectEnd: '2026-09-23', urgency: '紧急', priority: 'P0', description: '海外客户重点询问R10pro ET电变版，需要整车+配置细节素材用于Instagram和WhatsApp客户展示。' },
    { no: 'REQ-20260922-002', title: demTitle(mEm10, findVer(mEm10?.versions, 'EM10碳版')), modelCode: 'TW-EM10', vname: 'EM10碳版', status: 'pending', submitter: 'qianqi', submitterName: '钱七', submitterDept: '国内业务', direction: '国内', purpose: ['抖音', '视频号'], content: ['骑行实拍', '动态骑行', '产品开箱'], needPerson: '需要骑手', scenes: ['城市道路', '骑行场景'], aspectRatio: ['9:16'], videoDuration: ['15s', '30s'], expectStart: '2026-09-24', expectEnd: '2026-09-25', urgency: '重要', priority: 'P1', description: '抖音短视频矩阵需要EM10电助力碳架通勤场景素材。' },
    { no: 'REQ-20260921-001', title: demTitle(mCycloneEt, findVer(mCycloneEt?.versions, 'Dura-Ace Di2版')), modelCode: 'TW-CYCLONE-ET', vname: 'Dura-Ace Di2版', status: 'confirmed', submitter: 'zhaoliu', submitterName: '赵六', submitterDept: '海外业务', direction: '电商', purpose: ['电商详情页', '产品资料'], content: ['整车展示', '外观展示', '细节特写', '配置展示'], needPerson: '不需要', scenes: ['棚拍'], aspectRatio: ['16:9', '1:1'], videoDuration: ['不限'], expectStart: '2026-09-26', expectEnd: '2026-09-27', urgency: '普通', priority: 'P2', description: '官网详情页新版需要龙卷风Cyclone ET的白底整车图和配置细节。' },
    { no: 'REQ-20260922-003', title: demTitle(mR10proEt, findVer(mR10proEt?.versions, '50刀平碳圈版')), modelCode: 'TW-R10PRO-DISC-ET', vname: '50刀平碳圈版', status: 'confirmed', submitter: 'zhaoliu', submitterName: '赵六', submitterDept: '海外业务', direction: '海外', purpose: ['海外客户展示'], content: ['整车展示', '配置展示'], needPerson: '不需要', scenes: ['棚拍'], aspectRatio: ['16:9', '1:1'], videoDuration: ['不限'], expectStart: '2026-09-26', expectEnd: '2026-09-27', urgency: '重要', priority: 'P1', description: 'R10pro ET 50刀碳轮版单独拍一组，与Dura-Ace版做对比素材。' },
    { no: 'REQ-20260920-001', title: demTitle(mM9, findVer(mM9?.versions, 'M9 SRAM GX版')), modelCode: 'TW-M9', vname: 'M9 SRAM GX版', status: 'done', submitter: 'qianqi', submitterName: '钱七', submitterDept: '国内业务', direction: '国内', purpose: ['抖音', '快手', '视频号'], content: ['骑行实拍', '动态骑行', '对比内容'], needPerson: '需要骑手', scenes: ['山路'], aspectRatio: ['9:16', '16:9'], videoDuration: ['15s', '30s'], expectStart: '2026-09-20', expectEnd: '2026-09-20', urgency: '普通', priority: 'P2', description: '山地车系列短视频推广，重点突出越野场景。' },
    { no: 'REQ-20260922-004', title: demTitle(mGravelV3Elec, findVer(mGravelV3Elec?.versions, '105 Di2电变版')), modelCode: 'TW-GRAVEL-V3-ELEC', vname: '105 Di2电变版', status: 'draft', submitter: 'qianqi', submitterName: '钱七', submitterDept: '国内业务', direction: '国内', purpose: ['小红书', '抖音'], content: ['外观展示', '上车效果', '场景内容'], needPerson: '需要骑手', scenes: ['公路', '商业街'], aspectRatio: ['4:5', '1:1', '9:16'], videoDuration: ['不限'], expectStart: '2026-09-28', expectEnd: '2026-09-30', urgency: '普通', priority: 'P2', description: '砾石车Gravel V3电变版种草内容，需要高颜值城市骑行场景。' },
  ];

  for (const d of demandsData) {
    const model = await prisma.model.findUnique({ where: { code: d.modelCode }, include: { versions: true } });
    if (!model) continue;
    const ver = findVer(model.versions, d.vname);
    const user = await prisma.user.findUnique({ where: { username: d.submitter } });
    if (!user) continue;

    const dem = await prisma.demand.create({
      data: {
        no: d.no, title: d.title, submitterId: user.id, submitterName: d.submitterName, submitterDept: d.submitterDept, direction: d.direction,
        purpose: JSON.stringify(d.purpose), content: JSON.stringify(d.content), needPerson: d.needPerson,
        modelId: model.id, modelName: model.name, versionId: ver?.id || null, versionName: ver?.name || null,
        components: ver ? JSON.stringify({ wheelset: ver.wheelset, groupset: ver.groupset, brake: ver.brake, frame: ver.frame, handlebar: ver.handlebar, color: ver.color, size: ver.size }) : null,
        scenes: JSON.stringify(d.scenes), aspectRatio: JSON.stringify(d.aspectRatio), videoDuration: JSON.stringify(d.videoDuration),
        expectStart: d.expectStart, expectEnd: d.expectEnd, urgency: d.urgency, priority: d.priority, description: d.description, status: d.status,
      },
    });
    await prisma.demandHistory.create({ data: { demandId: dem.id, user: d.submitterName, action: '创建需求', toStatus: d.status } });
  }
  console.log(' ✓ Demands:', demandsData.length);

  console.log('\n✅ Seed complete!');
  console.log('   Models: 60  砾石9 + 公路24 + 山地19 + 电助力8');
  console.log('   Configs:', configs.length);
  console.log('\n登录账号：');
  console.log('  admin / admin123   (管理员)');
  console.log('  wangwu / 123456    (审核负责人)');
  console.log('  zhangsan / 123456  (拍摄团队)');
  console.log('  lisi / 123456      (拍摄团队)');
  console.log('  zhaoliu / 123456   (海外业务)');
  console.log('  qianqi / 123456    (国内业务)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
