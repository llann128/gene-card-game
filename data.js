// ========== 卡牌数据定义 ==========
// 序号与压缩包中图片文件名对应

const HABITATS = {
  water: '水中',
  land: '陆地',
  air: '空中',
  water_land: '水陆',
  water_air: '水空',
  land_air: '陆空',
  universal: '通用'
};

// 生物载体卡（表2）
// 序号:图片名, 名称, 基础分值, 类型(环境+槽位)
const CREATURE_CARDS = [
  { id: 'c9',  name: '麻雀', habitat: ['air'],            baseScore: 1, geneSlots: 1, desc: '飞行小型鸟类，空中环境。', image: 'cards/卡牌/生物载体卡/9.png' },
  { id: 'c1',  name: '兔子', habitat: ['land'],           baseScore: 1, geneSlots: 1, desc: '陆地小型哺乳动物。', image: 'cards/卡牌/生物载体卡/1.png' },
  { id: 'c2',  name: '松鼠', habitat: ['land'],           baseScore: 1, geneSlots: 1, desc: '陆地小型哺乳动物。', image: 'cards/卡牌/生物载体卡/2.png' },
  { id: 'c3',  name: '大象', habitat: ['land'],           baseScore: 3, geneSlots: 2, desc: '陆地大型动物。', image: 'cards/卡牌/生物载体卡/3.png' },
  { id: 'c4',  name: '棕熊', habitat: ['land'],           baseScore: 3, geneSlots: 2, desc: '陆地大型动物。', image: 'cards/卡牌/生物载体卡/4.png' },
  { id: 'c5',  name: '金鱼', habitat: ['water'],          baseScore: 1, geneSlots: 1, desc: '水生小型鱼类。', image: 'cards/卡牌/生物载体卡/5.png' },
  { id: 'c6',  name: '蝌蚪', habitat: ['water'],          baseScore: 1, geneSlots: 1, desc: '水生小型动物。', image: 'cards/卡牌/生物载体卡/6.png' },
  { id: 'c7',  name: '鲸鱼', habitat: ['water'],          baseScore: 3, geneSlots: 2, desc: '水生大型动物。', image: 'cards/卡牌/生物载体卡/7.png' },
  { id: 'c8',  name: '鲨鱼', habitat: ['water'],          baseScore: 3, geneSlots: 2, desc: '水生大型动物。', image: 'cards/卡牌/生物载体卡/8.png' },
  { id: 'c10', name: '蜻蜓', habitat: ['air'],            baseScore: 1, geneSlots: 1, desc: '飞行小型昆虫。', image: 'cards/卡牌/生物载体卡/10.png' },
  { id: 'c11', name: '老鹰', habitat: ['air'],            baseScore: 3, geneSlots: 2, desc: '飞行大型猛禽。', image: 'cards/卡牌/生物载体卡/11.png' },
  { id: 'c12', name: '秃鹫', habitat: ['air'],            baseScore: 3, geneSlots: 2, desc: '飞行大型鸟类。', image: 'cards/卡牌/生物载体卡/12.png' },
];

// 基因片段卡（表1）
// 序号:图片名, 名称, 攻击力/效果, 适用环境
const GENE_CARDS = [
  { id: 'g9',  name: '飞行强化基因卡', attack: 2,  compatibleHabitats: ['air'],           desc: '攻击力+2，空中专用。', image: 'cards/卡牌/基因片段卡/9.png' },
  { id: 'g1',  name: '反应基因卡',     attack: 3,  compatibleHabitats: ['water','land','air'], desc: '攻击力+3，通用。', image: 'cards/卡牌/基因片段卡/1.png' },
  { id: 'g2',  name: '力量基因卡',     attack: 3,  compatibleHabitats: ['water','land','air'], desc: '攻击力+3，通用。', image: 'cards/卡牌/基因片段卡/2.png' },
  { id: 'g3',  name: '毒刺基因卡',     attack: 5,  compatibleHabitats: ['water','land','air'], desc: '攻击力+5，通用。', image: 'cards/卡牌/基因片段卡/3.png' },
  { id: 'g4',  name: '自愈基因卡',     attack: -1, compatibleHabitats: ['water','land','air'], desc: '抵消对手全部攻击。', image: 'cards/卡牌/基因片段卡/4.png', special: 'heal' },
  { id: 'g5',  name: '铠甲基因卡',     attack: 2,  compatibleHabitats: ['water','land','air'], desc: '攻击力+2，通用。', image: 'cards/卡牌/基因片段卡/5.png' },
  { id: 'g6',  name: '声波攻击基因卡', attack: 4,  compatibleHabitats: ['water','land','air'], desc: '攻击力+4，通用。', image: 'cards/卡牌/基因片段卡/6.png' },
  { id: 'g7',  name: '深潜基因卡',     attack: 2,  compatibleHabitats: ['water'],         desc: '攻击力+2，水中专用。', image: 'cards/卡牌/基因片段卡/7.png' },
  { id: 'g8',  name: '疾跑基因卡',     attack: 2,  compatibleHabitats: ['land'],          desc: '攻击力+2，陆地专用。', image: 'cards/卡牌/基因片段卡/8.png' },
  { id: 'g10', name: '水陆两栖基因卡', attack: 0,  compatibleHabitats: ['water','land'],  desc: '解锁水中/陆地环境。', image: 'cards/卡牌/基因片段卡/12.png', special: 'unlock' },
  { id: 'g11', name: '流线基因卡',     attack: 2,  compatibleHabitats: ['water','air'],   desc: '攻击力+2，水空两用。', image: 'cards/卡牌/基因片段卡/10.png' },
  { id: 'g12', name: '滑翔基因卡',     attack: 1,  compatibleHabitats: ['land','air'],    desc: '攻击力+1，解锁陆地/空中环境。', image: 'cards/卡牌/基因片段卡/11.png', special: 'unlock' },
];

// 特殊卡牌（表3）
// 序号:图片名, 名称, 类型, 效果
const SPECIAL_CARDS = [
  { id: 's6', name: '水环境卡',   effect: 'env',   desc: '水中环境：对应属性的生物额外+1分。', envType: 'water', image: 'cards/卡牌/特殊卡牌/6.png' },
  { id: 's1', name: '剪刀卡',     effect: 'cut',   desc: '剪掉对手生物1个已装载的基因。', image: 'cards/卡牌/特殊卡牌/1.png' },
  { id: 's2', name: '盾牌卡',     effect: 'shield',desc: '抵消对手特殊卡牌。', image: 'cards/卡牌/特殊卡牌/2.png' },
  { id: 's3', name: '复制卡',     effect: 'copy',  desc: '复制对手生物1个已装载的基因。', image: 'cards/卡牌/特殊卡牌/3.png' },
  { id: 's4', name: '置换卡',     effect: 'swap',  desc: '与对手交换本轮1张基因卡牌。', image: 'cards/卡牌/特殊卡牌/4.png' },
  { id: 's5', name: '陆地环境卡', effect: 'env',   desc: '陆地环境：对应属性的生物额外+1分。', envType: 'land', image: 'cards/卡牌/特殊卡牌/5.png' },
  { id: 's7', name: '空中环境卡', effect: 'env',   desc: '空中环境：对应属性的生物额外+1分。', envType: 'air', image: 'cards/卡牌/特殊卡牌/7.png' },
];

// 环境卡（对战环境，不在抽牌阶段）
const ENV_CARDS = [
  { id: 'e1', name: '水中环境', habitat: 'water', desc: '本局在水中对战，选择水生动物可获得环境加成。', emoji: '🌊' },
  { id: 'e2', name: '陆地环境', habitat: 'land',  desc: '本局在陆地对战，选择陆地动物可获得环境加成。', emoji: '🏔️' },
  { id: 'e3', name: '空中环境', habitat: 'air',   desc: '本局在空中对战，选择飞行动物可获得环境加成。', emoji: '☁️' },
];

// 卡牌背面图路径
const CARD_BACKS = {
  creature: 'cards/卡牌/生物载体卡/绿色卡牌背面.png',
  gene: 'cards/卡牌/基因片段卡/紫色卡牌背面.png',
  special: 'cards/卡牌/特殊卡牌/蓝色卡牌背面.png'
};
