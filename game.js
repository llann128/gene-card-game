// ========== 游戏核心逻辑 v2 ==========

let G = {
  difficulty: 'easy',
  round: 0,           // 0,1,2
  playerWins: 0,
  aiWins: 0,
  roundResults: [],
  currentEnv: null,
  envRevealed: false,

  // 手牌
  playerHand: { creatures: [], genes: [], specials: [] },
  aiHand: { creatures: [], genes: [], specials: [] },

  // 当前局选择
  playerSel: { creature: null, genes: [], special: null },
  aiSel: { creature: null, genes: [], special: null },

  // 弃牌堆
  discardPile: { creatures: [], genes: [], specials: [] },

  // 抽牌阶段
  drawStep: 0,       // 0=生物,1=基因,2=特殊
  drawOffered: { creatures: [], genes: [], specials: [] },
  drawPicked: { creatures: [], genes: [], specials: [] },

  // 规则
  ruleIndex: 0,
  rulesConfirmed: false,

  // 手牌区当前 tab
  handTab: 'creature',
};

// ========== 工具 ==========
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function isCompat(gene, creature) {
  if (!creature) return false;
  // 通用基因（包含所有环境）总是适配
  if (gene.compatibleHabitats.length >= 3) return true;
  // 解锁型基因（水陆两栖、滑翔）可以给不同环境的生物
  if (gene.special === 'unlock') return true;
  return gene.compatibleHabitats.some(h => creature.habitat.includes(h));
}
function envBonus(creature, env) { if (!creature || !env) return 0; return creature.habitat.includes(env.habitat) ? 1 : 0; }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2000); }

// ========== 弹窗控制 ==========
function openModal(id) { document.getElementById('modal' + id.charAt(0).toUpperCase() + id.slice(1)).classList.add('show'); }
function closeModal(id) { document.getElementById('modal' + id.charAt(0).toUpperCase() + id.slice(1)).classList.remove('show'); }

// ========== 首页 → 难度选择 ==========
function selectDifficulty() { openModal('Difficulty'); }

function pickDifficulty(diff) {
  G.difficulty = diff;
  closeModal('Difficulty');
  // 显示规则弹窗
  G.ruleIndex = 0;
  G.rulesConfirmed = false;
  buildRulesSlides('rulesViewport', 'rulesDots', true);
  updateRulesNav();
  openModal('Rules');
}

// ========== 规则弹窗翻页 ==========
function buildRulesSlides(viewportId, dotsId, isInitial) {
  const slides = [
    { emoji: '🧑‍🔬', title: '你是基因小博士', text: '你要帮助小动物选择合适的基因，把它们改造成更强、更适合环境的超级生物。' },
    { emoji: '🃏', title: '认识四种卡牌', html: '<span class="rt green">生物载体卡</span>小动物，有基础分<br><span class="rt purple">基因片段卡</span>增强能力，需适配环境<br><span class="rt blue">特殊卡牌</span>每局最多1张<br><span class="rt yellow">环境卡</span>决定对战环境' },
    { emoji: '🔗', title: '什么是适配', text: '基因必须适配生物的环境才生效。例如水中基因装给陆地动物不会生效。' },
    { emoji: '🔄', title: '一局怎么玩', text: '翻环境卡 → 选生物 → 装基因 → 用特殊卡 → 亮牌 → 算分 → 弃牌' },
    { emoji: '🧮', title: '怎么算分', text: '总分 = 生物基础分 + 有效基因攻击力 + 环境加成 + 特殊卡效果 − 对手有效基因攻击力' },
    { emoji: '🗑️', title: '弃牌规则', text: '每局用过的卡牌进入弃牌堆，后续局数不能再使用。请认真选择！' },
  ];

  if (isInitial) {
    slides.push({ emoji: '✅', title: '准备好了吗？', confirm: true });
  }

  const vp = document.getElementById(viewportId);
  vp.innerHTML = slides.map((s, i) => {
    let body;
    if (s.confirm) {
      body = '<button class="btn-start" id="btnRulesConfirm" onclick="confirmRules()">我已全部了解，开始抽卡！</button>';
    } else if (s.html) {
      body = `<div class="rule-tags">${s.html}</div>`;
    } else {
      body = `<p>${s.text}</p>`;
    }
    return `<div class="rule-slide" data-index="${i}"><div class="rule-emoji">${s.emoji}</div><h3>${s.title}</h3>${body}</div>`;
  }).join('');

  // 圆点
  const dots = document.getElementById(dotsId);
  dots.innerHTML = slides.map((_, i) => `<span class="dot${i === 0 ? ' active' : ''}"></span>`).join('');
}

function slideRules(dir) {
  const total = document.querySelectorAll('#rulesViewport .rule-slide').length;
  G.ruleIndex = Math.max(0, Math.min(total - 1, G.ruleIndex + dir));
  updateRulesNav();
}

function updateRulesNav() {
  const vp = document.getElementById('rulesViewport');
  const slides = vp.querySelectorAll('.rule-slide');
  slides.forEach((s, i) => {
    s.style.display = i === G.ruleIndex ? 'flex' : 'none';
  });
  // 更新圆点
  document.querySelectorAll('#rulesDots .dot').forEach((d, i) => {
    d.classList.toggle('active', i === G.ruleIndex);
  });
  // 按钮
  const prev = document.getElementById('rulesPrev');
  const next = document.getElementById('rulesNext');
  if (prev) prev.style.visibility = G.ruleIndex === 0 ? 'hidden' : 'visible';
  if (next) next.style.visibility = G.ruleIndex === slides.length - 1 ? 'hidden' : 'visible';
}

function confirmRules() {
  G.rulesConfirmed = true;
  closeModal('Rules');
  initDrawPhase();
}

// ========== 对战中规则小窗 ==========
function openRulesModal() {
  buildRulesSlides('rulesMiniViewport', 'rulesMiniDots', false);
  G.ruleIndex = 0;
  updateMiniRulesNav();
  openModal('RulesMini');
}

function slideMiniRules(dir) {
  const total = document.querySelectorAll('#rulesMiniViewport .rule-slide').length;
  G.ruleIndex = Math.max(0, Math.min(total - 1, G.ruleIndex + dir));
  updateMiniRulesNav();
}

function updateMiniRulesNav() {
  const vp = document.getElementById('rulesMiniViewport');
  const slides = vp.querySelectorAll('.rule-slide');
  slides.forEach((s, i) => { s.style.display = i === G.ruleIndex ? 'flex' : 'none'; });
  document.querySelectorAll('#rulesMiniDots .dot').forEach((d, i) => d.classList.toggle('active', i === G.ruleIndex));
}

// ========== 图鉴小窗 ==========
function openHandbookModal() {
  openModal('Handbook');
  switchHBTab('creature', document.querySelector('#modalHandbook .htab'));
}

function switchHBTab(tab, btn) {
  document.querySelectorAll('#modalHandbook .htab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const grid = document.getElementById('handbookGrid');

  if (tab === 'env') {
    grid.innerHTML = ENV_CARDS.map(c => `
      <div class="hb-card env-card">
        <div class="env-emoji">${c.emoji}</div>
        <div class="hb-name">${c.name}</div>
        <div class="hb-desc">${c.desc}</div>
      </div>`).join('');
  } else {
    let cards = tab === 'creature' ? CREATURE_CARDS : (tab === 'gene' ? GENE_CARDS : SPECIAL_CARDS);
    grid.innerHTML = cards.map(c => `
      <div class="hb-card">
        <img src="${c.image}" alt="${c.name}" onerror="this.style.background='#eef';this.style.minHeight='80px'">
        <div class="hb-name">${c.name}${c.effect === 'env' ? '<span style="font-size:10px;color:#e8a33d;"> (系统抽取)</span>' : ''}</div>
        <div class="hb-info">${tab === 'creature' ? '基础分:'+c.baseScore+' | '+c.geneSlots+'槽' : (tab==='gene' ? (c.special==='heal' ? '抵消攻击' : (c.attack===0 ? '解锁环境' : '攻击:'+c.attack)) : c.desc.slice(0,8)+'...')}</div>
      </div>`).join('');
  }
}

// ========== 手牌查看小窗 ==========
function openHandModal() {
  openModal('Hand');
  renderHandModal();
}

function renderHandModal() {
  const h = G.playerHand;
  const content = document.getElementById('modalHandContent');
  const total = h.creatures.length + h.genes.length + h.specials.length;
  if (total === 0) { content.innerHTML = '<p class="empty-note">手牌为空</p>'; return; }
  let html = '';
  if (h.creatures.length) html += `<div class="hand-group"><h4>🧬 生物载体卡 (${h.creatures.length})</h4><div class="hand-chips">${h.creatures.map(c => `<span class="chip green">${c.name}</span>`).join('')}</div></div>`;
  if (h.genes.length) html += `<div class="hand-group"><h4>🔬 基因片段卡 (${h.genes.length})</h4><div class="hand-chips">${h.genes.map(g => `<span class="chip purple">${g.name}</span>`).join('')}</div></div>`;
  if (h.specials.length) html += `<div class="hand-group"><h4>⚡ 特殊卡牌 (${h.specials.length})</h4><div class="hand-chips">${h.specials.map(s => `<span class="chip blue">${s.name}</span>`).join('')}</div></div>`;
  content.innerHTML = html;
}

// ========== 弃牌堆小窗 ==========
function openDiscardModal() {
  openModal('Discard');
  const dp = G.discardPile;
  const total = dp.creatures.length + dp.genes.length + dp.specials.length;
  const content = document.getElementById('modalDiscardContent');
  if (total === 0) { content.innerHTML = '<p class="empty-note">弃牌堆为空</p>'; return; }
  let html = `<p class="discard-total">共 <b>${total}</b> 张已弃置</p>`;
  const allC = CREATURE_CARDS.filter(c => dp.creatures.includes(c.id));
  const allG = GENE_CARDS.filter(g => dp.genes.includes(g.id));
  const allS = SPECIAL_CARDS.filter(s => dp.specials.includes(s.id));
  if (allC.length) html += `<div class="hand-group"><h4>🧬 生物 (${allC.length})</h4><div class="hand-chips">${allC.map(c=>`<span class="chip green">${c.name}</span>`).join('')}</div></div>`;
  if (allG.length) html += `<div class="hand-group"><h4>🔬 基因 (${allG.length})</h4><div class="hand-chips">${allG.map(g=>`<span class="chip purple">${g.name}</span>`).join('')}</div></div>`;
  if (allS.length) html += `<div class="hand-group"><h4>⚡ 特殊 (${allS.length})</h4><div class="hand-chips">${allS.map(s=>`<span class="chip blue">${s.name}</span>`).join('')}</div></div>`;
  content.innerHTML = html;
}

// ========== 抽牌阶段 ==========
function initDrawPhase() {
  const cp = shuffle(CREATURE_CARDS);
  const gp = shuffle(GENE_CARDS);
  // 特殊卡：排除环境卡（环境卡由系统每局开始前自动抽取，不进入玩家抽卡池）
  const sp = shuffle(SPECIAL_CARDS.filter(s => s.effect !== 'env'));

  G.drawOffered = {
    creatures: cp.slice(0, 6),
    genes: gp.slice(0, 9),
    specials: sp.slice(0, 4),
  };
  G.drawPicked = { creatures: [], genes: [], specials: [] };
  G.drawStep = 0;

  // AI 后台手牌（AI 的特殊卡在进入对战时分配：玩家未选择的非环境特殊卡）
  G.aiHand = {
    creatures: cp.slice(6, 9),
    genes: gp.slice(9, 15),
    specials: [],
  };

  // 重置游戏
  G.round = 0;
  G.playerWins = 0;
  G.aiWins = 0;
  G.roundResults = [];
  G.discardPile = { creatures: [], genes: [], specials: [] };
  G.playerHand = { creatures: [], genes: [], specials: [] };
  G.playerSel = { creature: null, genes: [], special: null };
  G.aiSel = { creature: null, genes: [], special: null };
  G.currentEnv = null;
  G.envRevealed = false;

  showPage('draw');
  renderDrawStep();
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
}

function renderDrawStep() {
  const step = G.drawStep;
  const labels = ['抽取生物载体卡', '抽取基因片段卡', '抽取特殊卡牌'];
  const counts = [3, 6, 2];
  const keys = ['creatures', 'genes', 'specials'];
  const backImgs = [CARD_BACKS.creature, CARD_BACKS.gene, CARD_BACKS.special];

  document.getElementById('drawStage').textContent = `第 ${step + 1} 步：${labels[step]}`;
  document.getElementById('drawCount').textContent = `${G.drawPicked[keys[step]].length} / ${counts[step]}`;

  const grid = document.getElementById('drawGrid');
  grid.innerHTML = '';

  const offered = G.drawOffered[keys[step]];
  const pickedIds = G.drawPicked[keys[step]].map(c => c.id);

  // 只显示未翻面的卡牌（上方）
  offered.forEach((card, i) => {
    const picked = pickedIds.includes(card.id);
    // 已抽取的卡牌不显示在上方网格中
    if (picked) return;

    const div = document.createElement('div');
    div.className = 'draw-card';
    div.style.animationDelay = (i * 0.06) + 's';
    div.innerHTML = `
      <div class="dc-inner">
        <div class="dc-front"><img src="${card.image}" alt="${card.name}" onerror="this.innerHTML='<div class=dc-place>${card.name}</div>'"></div>
        <div class="dc-back"><img src="${backImgs[step]}" alt="卡背" onerror="this.innerHTML='<div class=dc-place>?</div>'"></div>
      </div>
    `;
    if (G.drawPicked[keys[step]].length < counts[step]) {
      div.onclick = () => pickDrawCard(card, step, keys, counts);
    }
    grid.appendChild(div);
  });

  // 当前阶段抽满后显示完成提示
  if (G.drawPicked[keys[step]].length >= counts[step]) {
    grid.innerHTML += '<div class="draw-complete">✅ 本阶段抽取完成</div>';
  }

  // 底部手牌堆（已翻面的大框）
  renderDrawHandPile();
}

function renderDrawHandPile() {
  const pile = document.getElementById('dhpCards');
  const all = [...G.drawPicked.creatures, ...G.drawPicked.genes, ...G.drawPicked.specials];
  if (all.length === 0) {
    pile.innerHTML = '<div class="dhp-empty">点击上方卡牌，抽取到此处</div>';
    return;
  }

  // 按类型分组渲染
  const creatures = G.drawPicked.creatures;
  const genes = G.drawPicked.genes;
  const specials = G.drawPicked.specials;

  let html = '';

  if (creatures.length) {
    html += `<div class="dhp-group"><div class="dhp-group-label green">🧬 生物载体卡 (${creatures.length})</div><div class="dhp-group-cards">`;
    html += creatures.map(c => `
      <div class="dhp-card" id="dhp-${c.id}">
        <img src="${c.image}" alt="${c.name}" onerror="this.style.background='#eef'">
        <div class="dhp-info">
          <div class="dhp-name">${c.name}</div>
          <div class="dhp-stat">基础 ${c.baseScore} | 槽位 ${c.geneSlots} | ${HABITATS[c.habitat[0]] || c.habitat.join('/')}</div>
        </div>
      </div>
    `).join('');
    html += '</div></div>';
  }

  if (genes.length) {
    html += `<div class="dhp-group"><div class="dhp-group-label purple">🔬 基因片段卡 (${genes.length})</div><div class="dhp-group-cards">`;
    html += genes.map(c => {
      let atkStr;
      if (c.special === 'heal') atkStr = '抵消全部攻击';
      else if (c.attack === 0) atkStr = '解锁环境';
      else atkStr = '攻击 +' + c.attack;
      return `
      <div class="dhp-card" id="dhp-${c.id}">
        <img src="${c.image}" alt="${c.name}" onerror="this.style.background='#eef'">
        <div class="dhp-info">
          <div class="dhp-name">${c.name}</div>
          <div class="dhp-stat">${atkStr} | ${c.compatibleHabitats.map(h=>HABITATS[h]||h).join('/')}</div>
        </div>
      </div>
    `}).join('');
    html += '</div></div>';
  }

  if (specials.length) {
    html += `<div class="dhp-group"><div class="dhp-group-label blue">⚡ 特殊卡牌 (${specials.length})</div><div class="dhp-group-cards">`;
    html += specials.map(c => `
      <div class="dhp-card" id="dhp-${c.id}">
        <img src="${c.image}" alt="${c.name}" onerror="this.style.background='#eef'">
        <div class="dhp-info">
          <div class="dhp-name">${c.name}</div>
          <div class="dhp-stat">${c.desc}</div>
        </div>
      </div>
    `).join('');
    html += '</div></div>';
  }

  pile.innerHTML = html;
}

// 手牌堆滚动到最新卡牌
function scrollToDrawCard(cardId) {
  setTimeout(() => {
    const el = document.getElementById('dhp-' + cardId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // 高亮闪烁效果
      el.classList.add('dhp-new');
      setTimeout(() => el.classList.remove('dhp-new'), 800);
    }
  }, 100);
}

function pickDrawCard(card, step, keys, counts) {
  const k = keys[step];
  if (G.drawPicked[k].length >= counts[step]) return;
  G.drawPicked[k].push(card);
  renderDrawStep();

  // 自动滚动到刚抽取的卡牌
  scrollToDrawCard(card.id);

  // 检查是否抽满
  if (G.drawPicked[k].length >= counts[step]) {
    if (step < 2) {
      setTimeout(() => {
        G.drawStep++;
        renderDrawStep();
      }, 500);
    } else {
      // 完成，进入对战
      setTimeout(() => {
        G.playerHand = {
          creatures: [...G.drawPicked.creatures],
          genes: [...G.drawPicked.genes],
          specials: [...G.drawPicked.specials],
        };
        startBattle();
      }, 600);
    }
  }
}

// ========== 对战阶段 ==========
function startBattle() {
  showPage('battle');
  updateBattleTopBar();
  G.playerSel = { creature: null, genes: [], special: null };
  G.envRevealed = true;
  // 环境卡：由系统在每局开始前自动抽取（玩家不会抽到环境卡）
  const pool = shuffle(ENV_CARDS);
  G.currentEnv = pool[0];
  // AI 特殊卡：分配玩家未选择的非环境特殊卡
  const pickedSpIds = G.playerHand.specials.map(s => s.id);
  G.aiHand.specials = SPECIAL_CARDS.filter(s => s.effect !== 'env' && !pickedSpIds.includes(s.id));
  renderBattleEnv();
  renderAllHandRows();
  updatePreviewRow();
  renderAiArea();
}

function updateBattleTopBar() {
  document.getElementById('topRound').textContent = `第 ${G.round + 1} / 3 局`;
  document.getElementById('topPlayerScore').textContent = G.playerWins;
  document.getElementById('topAIScore').textContent = G.aiWins;
  const total = G.discardPile.creatures.length + G.discardPile.genes.length + G.discardPile.specials.length;
  document.getElementById('discardBadge').textContent = total;
}

function renderBattleEnv() {
  const env = G.currentEnv;
  document.getElementById('envCardAuto').innerHTML = `
    <div class="env-card-emoji">${env.emoji}</div>
    <div class="env-card-title">${env.name}</div>
    <div class="env-card-desc">${env.desc}</div>
    <div style="font-size:11px;color:#999;margin-top:6px;">系统每局自动抽取，不参与抽卡</div>
  `;
}

// AI区域渲染（显示一堆卡牌背面）
function renderAiArea() {
  const container = document.getElementById('aiPlayedCards');
  const ah = G.aiHand;

  // 根据AI手牌数量显示对应数量的卡背
  const creatureCount = ah.creatures.length;
  const geneCount = ah.genes.length;
  const specialCount = ah.specials.length;

  let html = '';

  // 生物卡背
  for (let i = 0; i < creatureCount; i++) {
    html += `<div class="ai-card-back creature">
      <img src="${CARD_BACKS.creature}" alt="卡背" onerror="this.innerHTML='<span>?</span>'">
    </div>`;
  }

  // 基因卡背
  for (let i = 0; i < geneCount; i++) {
    html += `<div class="ai-card-back gene">
      <img src="${CARD_BACKS.gene}" alt="卡背" onerror="this.innerHTML='<span>?</span>'">
    </div>`;
  }

  // 特殊卡背
  for (let i = 0; i < specialCount; i++) {
    html += `<div class="ai-card-back special">
      <img src="${CARD_BACKS.special}" alt="卡背" onerror="this.innerHTML='<span>?</span>'">
    </div>`;
  }

  if (!html) {
    html = '<div class="ai-card-back empty">?</div>';
  }

  container.innerHTML = html;

  // 环境卡
  const env = G.currentEnv;
  document.getElementById('aiEnvCard').innerHTML = `
    <div class="ai-env-mini">
      <span>${env.emoji}</span>
      <span>${env.name}</span>
    </div>
  `;
}

// 三排手牌
function renderAllHandRows() {
  const h = G.playerHand;
  const sel = G.playerSel;

  // 生物排
  renderHandRow('handRowCreatureCards', h.creatures, 'creature', sel);
  // 基因排
  renderHandRow('handRowGeneCards', h.genes, 'gene', sel);
  // 特殊排
  renderHandRow('handRowSpecialCards', h.specials, 'special', sel);
}

function renderHandRow(containerId, cards, type, sel) {
  const container = document.getElementById(containerId);
  if (!cards || cards.length === 0) {
    container.innerHTML = '<div class="hand-row-empty">暂无</div>';
    return;
  }

  container.innerHTML = cards.map(c => {
    let selected = false;
    let disabled = false;
    let tag = '';

    if (type === 'creature') {
      selected = sel.creature && sel.creature.id === c.id;
      if (G.envRevealed && envBonus(c, G.currentEnv)) tag = '<span class="card-tag env-tag">+1</span>';
    } else if (type === 'gene') {
      selected = sel.genes.some(g => g.id === c.id);
      if (sel.creature) {
        if (!isCompat(c, sel.creature)) { disabled = true; tag = '<span class="card-tag bad-tag">不适配</span>'; }
        else if (!selected && sel.genes.length >= sel.creature.geneSlots) { disabled = true; tag = '<span class="card-tag bad-tag">已满</span>'; }
      }
    } else if (type === 'special') {
      selected = sel.special && sel.special.id === c.id;
      if (!selected && sel.special) disabled = true;
    }

    let cls = 'hand-row-card';
    if (selected) cls += ' selected';
    if (disabled) cls += ' disabled';

    return `<div class="${cls}" onclick="${disabled ? '' : `clickHandCardRow('${c.id}','${type}')`}">
      <img src="${c.image}" alt="${c.name}" onerror="this.style.background='#eef'">
      <div class="hrc-name">${c.name}</div>
      ${type==='creature' ? `<div class="hrc-stat">基础${c.baseScore} | ${c.geneSlots}槽</div>` : (type==='gene' ? (c.special==='heal' ? `<div class="hrc-stat">抵消攻击</div>` : (c.attack===0 ? `<div class="hrc-stat">解锁</div>` : `<div class="hrc-stat">攻${c.attack}</div>`)) : `<div class="hrc-stat">${c.desc.slice(0,4)}</div>`)}
      ${tag}
      ${selected ? '<div class="card-tag sel-tag">✓</div>' : ''}
    </div>`;
  }).join('');
}

function clickHandCardRow(id, type) {
  const sel = G.playerSel;

  if (type === 'creature') {
    const card = G.playerHand.creatures.find(c => c.id === id);
    if (!card) return;
    if (sel.creature && sel.creature.id === id) {
      sel.creature = null;
      sel.genes = [];
    } else {
      sel.creature = card;
      sel.genes = [];
    }
  } else if (type === 'gene') {
    if (!sel.creature) { toast('请先选择一个小动物！'); return; }
    const card = G.playerHand.genes.find(g => g.id === id);
    if (!card) return;
    const already = sel.genes.some(g => g.id === id);
    if (already) {
      sel.genes = sel.genes.filter(g => g.id !== id);
    } else {
      if (!isCompat(card, sel.creature)) { toast('这个基因不适合当前小动物，换一张试试吧！'); return; }
      if (sel.genes.length >= sel.creature.geneSlots) { toast('这个小动物装不下更多基因啦！'); return; }
      sel.genes.push(card);
    }
  } else if (type === 'special') {
    const card = G.playerHand.specials.find(s => s.id === id);
    if (!card) return;
    if (sel.special && sel.special.id === id) {
      sel.special = null;
    } else {
      if (sel.special) { toast('每局最多只能使用一张特殊卡哦！'); return; }
      sel.special = card;
    }
  }

  renderAllHandRows();
  updatePreviewRow();
}

function updatePreviewRow() {
  const sel = G.playerSel;
  const row = document.getElementById('previewRow');
  if (!sel.creature) {
    row.innerHTML = '<span class="preview-text">请选择出战组合</span>';
    return;
  }
  const base = sel.creature.baseScore;
  const hasHeal = sel.genes.some(g => g.special === 'heal');
  const geneAtk = hasHeal ? 0 : sel.genes.reduce((s, g) => (g.attack > 0 ? g.attack : 0), 0);
  const eb = envBonus(sel.creature, G.currentEnv);
  let spBonus = 0;
  if (sel.special) {
    if (sel.special.effect === 'env' && sel.special.envType && sel.creature.habitat.includes(sel.special.envType)) spBonus = 1;
  }
  const total = base + geneAtk + eb + spBonus;
  const geneStr = hasHeal ? '抵消攻击' : ('基因' + geneAtk);
  row.innerHTML = `
    <span class="preview-text">${sel.creature.name}</span>
    <span class="preview-breakdown">基础${base} + ${geneStr} + 环境${eb} + 特殊${spBonus}</span>
    <span class="preview-total">= ${total}</span>
  `;
}

// ========== AI 出牌 ==========
function aiDecide() {
  const h = G.aiHand;
  const env = G.currentEnv;
  const diff = G.difficulty;
  let cc, cg = [], cs = null;

  function geneScore(g) {
    if (g.special === 'heal') return 0;
    return Math.max(0, g.attack);
  }

  if (diff === 'easy') {
    const ad = h.creatures.filter(c => c.habitat.includes(env.habitat));
    cc = ad.length ? ad[Math.floor(Math.random() * ad.length)] : h.creatures[Math.floor(Math.random() * h.creatures.length)];
    const cgPool = shuffle(h.genes.filter(g => isCompat(g, cc)));
    cg = cgPool.slice(0, Math.min(cc.geneSlots, cgPool.length));
    if (Math.random() < 0.3 && h.specials.length) cs = h.specials[Math.floor(Math.random() * h.specials.length)];
  } else if (diff === 'medium') {
    const pool = (h.creatures.filter(c => c.habitat.includes(env.habitat))).sort((a, b) => b.baseScore - a.baseScore);
    cc = pool.length ? pool[0] : h.creatures.sort((a, b) => b.baseScore - a.baseScore)[0];
    const cgPool = h.genes.filter(g => isCompat(g, cc)).sort((a, b) => geneScore(b) - geneScore(a));
    cg = cgPool.slice(0, Math.min(cc.geneSlots, cgPool.length));
    if (Math.random() < 0.5 && h.specials.length) cs = h.specials[Math.floor(Math.random() * h.specials.length)];
  } else {
    let best = -Infinity;
    for (const cr of h.creatures) {
      const cgPool = h.genes.filter(g => isCompat(g, cr)).sort((a, b) => geneScore(b) - geneScore(a));
      const top = cgPool.slice(0, Math.min(cr.geneSlots, cgPool.length));
      const eb = envBonus(cr, env);
      const gs = top.reduce((s, g) => s + geneScore(g), 0);
      const base = cr.baseScore + gs + eb;
      for (const sp of h.specials) {
        let b = base + (sp.effect === 'env' && sp.envType && cr.habitat.includes(sp.envType) ? 1 : 0);
        if (b > best) { best = b; cc = cr; cg = top; cs = sp; }
      }
      if (base > best) { best = base; cc = cr; cg = top; cs = null; }
    }
  }

  G.aiSel = { creature: cc, genes: cg, special: cs };
}

// ========== 确认出战 → 亮牌 ==========
function confirmBattle() {
  if (!G.playerSel.creature) { toast('请选择一个生物载体再出战！'); return; }
  
  // 检查是否没选基因或没选特殊卡
  const sel = G.playerSel;
  const hasGenes = sel.genes.length > 0;
  const hasSpecial = sel.special !== null;
  const hasAvailableGenes = G.playerHand.genes.some(g => isCompat(g, sel.creature));
  const hasAvailableSpecials = G.playerHand.specials.length > 0;
  
  if (!hasGenes && hasAvailableGenes && hasAvailableSpecials && !hasSpecial) {
    // 两者都没选
    document.getElementById('confirmSkipTitle').textContent = '⚠️ 提示';
    document.getElementById('confirmSkipMsg').textContent = '你还没有装备基因和特殊卡，确定要空身上阵吗？';
    openModal('ConfirmSkip');
    document.getElementById('btnSkipForce').onclick = () => { closeModal('ConfirmSkip'); doConfirmBattle(); };
    return;
  }
  if (!hasGenes && hasAvailableGenes) {
    document.getElementById('confirmSkipTitle').textContent = '⚠️ 提示';
    document.getElementById('confirmSkipMsg').textContent = '你还没有装备任何基因，确定要直接出战吗？';
    openModal('ConfirmSkip');
    document.getElementById('btnSkipForce').onclick = () => { closeModal('ConfirmSkip'); doConfirmBattle(); };
    return;
  }
  if (!hasSpecial && hasAvailableSpecials) {
    document.getElementById('confirmSkipTitle').textContent = '⚠️ 提示';
    document.getElementById('confirmSkipMsg').textContent = '你还没有使用特殊卡，确定要直接出战吗？';
    openModal('ConfirmSkip');
    document.getElementById('btnSkipForce').onclick = () => { closeModal('ConfirmSkip'); doConfirmBattle(); };
    return;
  }
  
  doConfirmBattle();
}

function confirmBattleForce() {
  // 由 btnSkipForce onclick 触发
}

function doConfirmBattle() {
  aiDecide();
  openModal('Reveal');
  renderRevealModal();
}

function renderRevealModal() {
  const ps = G.playerSel;
  const as = G.aiSel;

  // 基因卡描述（处理特殊效果）
  function geneLabel(g) {
    if (g.special === 'heal') return `${g.name} (抵消全部攻击)`;
    if (g.attack === 0) return `${g.name} (解锁环境)`;
    return `${g.name} (+${g.attack})`;
  }

  // 玩家
  document.getElementById('rvPlayer').innerHTML = `
    <div class="rv-creature"><img src="${ps.creature.image}" alt="${ps.creature.name}" onerror="this.style.background='#eef'"><span>${ps.creature.name}</span></div>
    ${ps.genes.map(g => `<div class="rv-gene"><img src="${g.image}" alt="${g.name}" onerror="this.style.background='#eef'"><span>${geneLabel(g)}</span></div>`).join('')}
    ${ps.special ? `<div class="rv-sp">⚡ ${ps.special.name}</div>` : '<div class="rv-sp none">未使用特殊卡</div>'}
  `;

  // AI 先隐藏
  document.getElementById('rvAI').innerHTML = `
    <div class="rv-creature hidden-card" id="rvAICreature"><img src="${CARD_BACKS.creature}" alt="?"><span>???</span></div>
    <div id="rvAIGenes"><div class="rv-gene hidden-card"><img src="${CARD_BACKS.gene}" alt="?"><span>???</span></div></div>
    <div class="rv-sp none" id="rvAISP">???</div>
  `;

  document.getElementById('btnGoCalc').style.display = 'none';

  // 1秒后翻牌
  setTimeout(() => {
    document.getElementById('rvAICreature').innerHTML = `<img src="${as.creature.image}" alt="${as.creature.name}" onerror="this.style.background='#eef'"><span>${as.creature.name}</span>`;
    document.getElementById('rvAICreature').classList.remove('hidden-card');
    document.getElementById('rvAIGenes').innerHTML = as.genes.map(g => `<div class="rv-gene"><img src="${g.image}" alt="${g.name}" onerror="this.style.background='#eef'"><span>${geneLabel(g)}</span></div>`).join('');
    document.getElementById('rvAISP').innerHTML = as.special ? `⚡ ${as.special.name}` : '未使用特殊卡';
    document.getElementById('rvAISP').className = as.special ? 'rv-sp' : 'rv-sp none';
    document.getElementById('btnGoCalc').style.display = 'block';
  }, 1000);
}

// ========== 算分 ==========
function goCalcScore() {
  const ps = G.playerSel;
  const as = G.aiSel;
  const env = G.currentEnv;

  function calc(cr, genes, sp, oppGenes, oppSp) {
    const base = cr.baseScore;
    // 检查是否有自愈基因（抵消全部攻击）
    const hasHeal = genes.some(g => g.special === 'heal');
    let gs;
    if (hasHeal) {
      gs = 0; // 自愈基因本身不加攻击，显示为"抵消全部攻击"
    } else {
      gs = genes.reduce((s, g) => (g.special === 'heal' ? 0 : g.attack > 0 ? g.attack : 0), 0);
    }
    const eb = envBonus(cr, env);
    let sb = 0;
    // 特殊卡效果
    if (sp) {
      if (sp.effect === 'env') {
        // 环境卡：对应属性生物+1分
        if (sp.envType && cr.habitat.includes(sp.envType)) sb = 1;
      }
    }
    // 对手攻击计算
    let oa;
    if (hasHeal) {
      oa = 0; // 自愈：抵消对手全部攻击
    } else {
      oa = oppGenes.reduce((s, g) => (g.special === 'heal' ? 0 : g.attack > 0 ? g.attack : 0), 0);
      // 盾牌卡：抵消对手特殊卡
      if (sp && sp.effect === 'shield') {
        // 如果对手有特殊卡，本方的盾牌抵消它（但不对具体数值产生影响，这里简化为抵消对手特殊卡效果）
        if (oppSp && oppSp.effect === 'env') {
          // 对方环境卡被抵消
        }
      }
    }
    return { base, gs, eb, sb, oa, total: base + gs + eb + sb - oa };
  }

  const pr = calc(ps.creature, ps.genes, ps.special, as.genes, as.special);
  const ar = calc(as.creature, as.genes, as.special, ps.genes, ps.special);

  let winner, icon;
  if (pr.total > ar.total) { winner = 'player'; icon = '🎉'; G.playerWins += 1; }
  else if (pr.total < ar.total) { winner = 'ai'; icon = '😔'; G.aiWins += 1; }
  else { winner = 'draw'; icon = '🤝'; G.playerWins += 0.5; G.aiWins += 0.5; }

  G.roundResults.push({ pScore: pr.total, aScore: ar.total, winner });

  // 弃牌
  G.discardPile.creatures.push(ps.creature.id);
  ps.genes.forEach(g => G.discardPile.genes.push(g.id));
  if (ps.special) G.discardPile.specials.push(ps.special.id);
  G.discardPile.creatures.push(as.creature.id);
  as.genes.forEach(g => G.discardPile.genes.push(g.id));
  if (as.special) G.discardPile.specials.push(as.special.id);

  // 移除手牌
  G.playerHand.creatures = G.playerHand.creatures.filter(c => c.id !== ps.creature.id);
  G.playerHand.genes = G.playerHand.genes.filter(g => !ps.genes.some(pg => pg.id === g.id));
  G.playerHand.specials = G.playerHand.specials.filter(s => !ps.special || s.id !== ps.special.id);
  G.aiHand.creatures = G.aiHand.creatures.filter(c => c.id !== as.creature.id);
  G.aiHand.genes = G.aiHand.genes.filter(g => !as.genes.some(ag => ag.id === g.id));
  G.aiHand.specials = G.aiHand.specials.filter(s => !as.special || s.id !== as.special.id);

  // 显示结算小窗
  closeModal('Reveal');
  const verdictText = winner === 'player' ? '本局胜利！' : (winner === 'ai' ? '本局失败！' : '本局平局！');
  const verdictClass = winner === 'player' ? 'win' : (winner === 'ai' ? 'lose' : 'draw');

  document.getElementById('roundResultContent').innerHTML = `
    <h2>📋 本局实验结果</h2>
    <div class="rr-dual">
      <div class="rr-side">
        <h4>🧑‍🔬 你</h4>
        <div>基础 +${pr.base}</div><div>基因 +${pr.gs}</div><div>环境 +${pr.eb}</div><div>特殊 +${pr.sb}</div>
        <div class="rr-neg">对手 −${pr.oa}</div>
        <div class="rr-total">= ${pr.total}</div>
      </div>
      <div class="rr-side">
        <h4>🤖 AI</h4>
        <div>基础 +${ar.base}</div><div>基因 +${ar.gs}</div><div>环境 +${ar.eb}</div><div>特殊 +${ar.sb}</div>
        <div class="rr-neg">对手 −${ar.oa}</div>
        <div class="rr-total">= ${ar.total}</div>
      </div>
    </div>
    <div class="verdict ${verdictClass}">${icon} ${verdictText}</div>
    <div class="rr-score">你 ${G.playerWins} : ${G.aiWins} AI</div>
  `;

  document.getElementById('btnAfterRound').textContent = G.round >= 2 ? '查看最终结果' : '进入下一局';
  openModal('RoundResult');

  // 更新对战页状态
  updateBattleTopBar();
}

function nextAfterResult() {
  closeModal('RoundResult');
  if (G.round >= 2) {
    showFinalResult();
  } else {
    G.round++;
    G.playerSel = { creature: null, genes: [], special: null };
    G.envRevealed = true;
    // 新环境
    const pool = shuffle(ENV_CARDS);
    G.currentEnv = pool[0];
    updateBattleTopBar();
    renderBattleEnv();
    renderAllHandRows();
    updatePreviewRow();
    renderAiArea();
  }
}

function showFinalResult() {
  let icon, cls, title, msg;
  if (G.playerWins > G.aiWins) {
    icon = '🏆'; cls = 'win'; title = '恭喜你成为优秀基因小博士！'; msg = '你成功改造出了更适合环境的超级生物！';
  } else if (G.playerWins < G.aiWins) {
    icon = '🤖'; cls = 'lose'; title = 'AI 小博士略胜一筹！'; msg = '再试一次，选择更适合环境的基因吧！';
  } else {
    icon = '🤝'; cls = 'draw'; title = '你们打成平手！'; msg = '看来你们都是很厉害的基因研究员！';
  }

  document.getElementById('finalContent').innerHTML = `
    <div class="final-icon">${icon}</div>
    <h2 class="final-title ${cls}">${title}</h2>
    <p class="final-msg">${msg}</p>
    <div class="final-rounds">
      ${G.roundResults.map((r, i) => {
        const wi = r.winner === 'player' ? '✅' : (r.winner === 'ai' ? '❌' : '🤝');
        return `<div>第${i+1}局 ${wi} 你:${r.pScore} AI:${r.aScore}</div>`;
      }).join('')}
    </div>
    <div class="final-score">最终比分：你 <b>${G.playerWins}</b> : <b>${G.aiWins}</b> AI</div>
  `;
  openModal('Final');
}

function restartGame() {
  closeModal('Final');
  // 重置
  G = {
    difficulty: G.difficulty,
    round: 0, playerWins: 0, aiWins: 0, roundResults: [],
    currentEnv: null, envRevealed: false,
    playerHand: { creatures: [], genes: [], specials: [] },
    aiHand: { creatures: [], genes: [], specials: [] },
    playerSel: { creature: null, genes: [], special: null },
    aiSel: { creature: null, genes: [], special: null },
    discardPile: { creatures: [], genes: [], specials: [] },
    drawStep: 0,
    drawOffered: { creatures: [], genes: [], specials: [] },
    drawPicked: { creatures: [], genes: [], specials: [] },
    ruleIndex: 0, rulesConfirmed: false, handTab: 'creature',
  };
  initDrawPhase();
}

function goHome() {
  closeModal('Final');
  showPage('home');
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
});
