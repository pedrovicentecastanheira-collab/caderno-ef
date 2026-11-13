/* ---------- competências por matéria e nível ---------- */
// Do 2.º ciclo ao secundário: as competências numeradas dos Anexos 2, 3 e 4 das AE (2026), com o id oficial (ex.: E4.2).
// Um item com subitens não se avalia: é o contexto dos subitens. Sem anexo (1.º ciclo e Jogos Tradicionais), parte-se o descritivo PNEF.
function ae26Of(ciclo, m) {
  const d = AE26[ciclo] && AE26[ciclo][m]; if (!d) return null;
  const out = [];
  ['I', 'E', 'A'].forEach(k => {
    const its = d[k] === '=3' ? AE26['3'][m][k] : d[k]; if (!its) return;
    const txt = Object.fromEntries(its.map(([n, t]) => [n, t]));
    its.forEach(([n, t]) => {
      if (its.some(([o]) => o.startsWith(n + '.'))) return;
      const ps = n.split('.'), ctx = [];
      for (let i = 1; i < ps.length; i++) { const p = txt[ps.slice(0, i).join('.')]; if (p) ctx.push(p.replace(/[:.]\s*$/, '')); }
      out.push({k, id:k + n, n, ctx:ctx.join(' — '), txt:t, of:true});
    });
  });
  return out;
}
// Corta-se onde começa uma nova ação (verbo); as enumerações ficam juntas e o contexto ("Em jogo 4x4…") passa a cabeçalho.
const CVERB = new Set('executa desloca-se desliza combina recebe desmarca-se realiza cria aplica mantém lança remata salta participa passa dança serve coordena segue trava inicia defende nada faz dá dribla opta finaliza finta corre flutua associa apresenta apresenta-as aproveita arranca desenha curva posiciona-se conhece compõe reproduz agarra marca elabora progride bate desempenha aperfeiçoa conduz patina devolve coopera identifica varia alterna especializa-se lê otimiza domina distingue analisa orienta interpreta calcula planeia organiza enquadra-se dificulta ocupa preenche seleciona escolhe utiliza assegura mergulha joga respeita cumpre'.split(' '));
const CCTX = /^(em |no |na |nos |nas |após |a par|a pares|ao |sem |como |durante |depois |numa |num )/i;
function splitTop(s, sep) { const out = []; let d = 0, cur = ''; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === '(') d++; else if (c === ')') d--; if (!d && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; } cur += c; } out.push(cur); return out.map(x => x.trim()).filter(Boolean); }
const fw = x => x.trim().replace(/^e\s+/, '').split(/\s+/)[0].toLowerCase();
const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
const COMPC = {};
function compsOf(ciclo, m) {
  const key = ciclo + '|' + m; if (COMPC[key]) return COMPC[key];
  const of = ae26Of(ciclo, m); if (of) return COMPC[key] = of;
  const d = (PNEF[ciclo] || []).find(x => x.m === m), out = [];
  if (d) ['I', 'E', 'A'].forEach(k => { let n = 0;
    splitTop(String(d[k] || '').replace(/\.\s*$/, ''), ';').forEach(cl => {
      let ctx = '', segs, list = false;
      const co = splitTop(cl, ': ');
      if (co.length > 1 && co[0].length < 140) { ctx = co[0]; segs = splitTop(co.slice(1).join(': '), ', '); list = true; }
      else {
        segs = splitTop(cl, ', ');
        if (segs.length > 1 && CCTX.test(segs[0]) && segs[0].split(/\s+/).every(w => !CVERB.has(w.toLowerCase()))) ctx = segs.shift();
        const g = segs.findIndex((x, i) => i > 0 && /ndo$/.test(fw(x)) && segs.length - i - 1 >= 2 && segs.slice(i + 1).every(y => !CVERB.has(fw(y))));
        if (g > 0) { ctx = (ctx ? ctx + ', ' : '') + segs.slice(0, g).join(', ') + ', ' + fw(segs[g]); segs = [segs[g].replace(/^\S+\s+/, ''), ...segs.slice(g + 1)]; list = true; }
      }
      const items = [];
      segs.forEach(x => { x = x.replace(/^e\s+/, ''); if (items.length && (list ? /ndo$/.test(fw(x)) : !CVERB.has(fw(x)))) items[items.length - 1] += ', ' + x; else items.push(x); });
      items.forEach(x => out.push({k, id:k + (n++), ctx:ctx ? cap(ctx) : '', txt:cap(x)}));
    });
  });
  return COMPC[key] = out;
}
const tksOf = (v, aid, m) => ((v.comp || {})[aid] || {})[m];
// Agrupa por contexto; um contexto com uma só competência fica na própria linha, para não parecer que abrange as seguintes.
function compList(cs) {
  const gs = []; cs.forEach(c => { const g = gs[gs.length - 1]; if (g && g.ctx === c.ctx && c.ctx) g.xs.push(c); else gs.push({ctx:c.ctx, xs:[c]}); });
  let h = '<ul>'; gs.forEach(g => { if (g.ctx && g.xs.length > 1) h += `<li class="cg"><span class="cctx">${esc(g.ctx)}:</span><ul>${g.xs.map(c => `<li>${cidOf(c)}${esc(c.txt)}</li>`).join('')}</ul></li>`; else g.xs.forEach(c => { h += `<li>${cidOf(c)}${g.ctx ? `<span class="cctx">${esc(g.ctx)}:</span> ` + esc(c.txt.charAt(0).toLowerCase() + c.txt.slice(1)) : esc(c.txt)}</li>`; }); });
  return h + '</ul>';
}
const cidOf = c => c.of ? `<b class="cid">${c.k}${c.n}</b> ` : '';
// Descritivos de uma matéria: as competências oficiais por nível (Anexos de 2026) ou, sem elas, o texto PNEF.
function descHtml(ciclo, m, open) {
  const cs = compsOf(ciclo, m), of = cs.length && cs[0].of, d = (PNEF[ciclo] || []).find(x => x.m === m);
  const body = of ? ['I', 'E', 'A'].map(k => { const xs = cs.filter(c => c.k === k); return xs.length ? `<div class="dlv"><b>${k} · ${LVN[k]}</b> <span class="muted small">${xs.length} competências</span>${compList(xs)}</div>` : ''; }).join('')
    : d ? `<dl>${['I','E','A'].map(k => `<dt>${k} · ${LVN[k]}</dt><dd>${esc(d[k] || '—')}</dd>`).join('')}</dl>` : '<p class="hint">Sem descritivo para esta matéria neste ciclo.</p>';
  return `<details class="desc"${open ? ' open' : ''}><summary>${of ? 'Competências · Aprendizagens Essenciais 2026' : 'Descritivos PNEF'} · ${esc(m)}${isAlt(ciclo, m) ? ' <span class="pill">alternativa</span>' : ''}</summary>${body}<p class="hint" style="margin:6px 0 12px">PI, PE e PA: domina pelo menos metade das competências do nível I, E ou A.</p></details>`;
}
// O que domina e o que falta: pelas competências assinaladas ou, sem elas, pelo nível escolhido.
function compSplit(ciclo, m, l, ticks) {
  const cs = compsOf(ciclo, m); if (!cs.length) return null;
  if (ticks && Object.values(ticks).some(Boolean)) {
    const low = ['I', 'E', 'A'].find(k => cs.some(c => c.k === k && !ticks[c.id]));
    return {dom:cs.filter(c => ticks[c.id]), mel:low ? cs.filter(c => c.k === low && !ticks[c.id]) : [], parcial:false, exato:true};
  }
  if (!(l in LVP)) return null;
  const full = {NI:[], PI:[], I:['I'], PE:['I'], E:['I', 'E'], PA:['I', 'E'], A:['I', 'E', 'A']}[l], part = {PI:'I', PE:'E', PA:'A'}[l], next = {NI:'I', I:'E', E:'A'}[l];
  return {dom:cs.filter(c => full.includes(c.k)), mel:cs.filter(c => c.k === (part || next)), parcial:!!part, exato:false};
}
function lvSummary(ciclo, m, l, ticks) {
  const x = compSplit(ciclo, m, l, ticks); if (!x) return '';
  let h = x.dom.length ? `<div class="ok"><b>Domina</b>${compList(x.dom)}</div>` : '<div class="nx"><b>Ainda não domina as competências de base desta matéria.</b></div>';
  h += x.mel.length ? `<div class="nx"><b>Para melhorar</b>${x.parcial ? ' <span class="hint">(já realiza parte destas competências)</span>' : ''}${compList(x.mel)}</div>` : '<div class="ok"><b>Domina todas as competências previstas para esta matéria.</b></div>';
  return h;
}
function lvShort(ciclo, m, l, ticks) {
  const x = compSplit(ciclo, m, l, ticks); if (!x) return '';
  const f = x.mel[0] ? x.mel[0].txt : '';
  return `<span class="ok">Domina ${x.dom.length} ${x.dom.length === 1 ? 'competência' : 'competências'}</span> · <span class="nx">${x.mel.length ? `Para melhorar ${x.mel.length}: ${esc(f.length > 70 ? f.slice(0, 68) + '…' : f)}` : 'Domina todas'}</span>`;
}
// Nível a partir das competências assinaladas (PI, PE, PA = pelo menos metade do nível).
function lvFromTicks(ciclo, m, ticks) {
  const cs = compsOf(ciclo, m), f = k => { const xs = cs.filter(c => c.k === k); return xs.length ? xs.filter(c => ticks[c.id]).length / xs.length : 0; };
  const fI = f('I'), fE = f('E'), fA = f('A');
  return fI < 1 ? (fI >= .5 ? 'PI' : 'NI') : fE < 1 ? (fE >= .5 ? 'PE' : 'I') : fA < 1 ? (fA >= .5 ? 'PA' : 'E') : 'A';
}
function compCheck(ciclo, m, ticks) {
  const cs = compsOf(ciclo, m); ticks = ticks || {};
  return ['I', 'E', 'A'].map(k => { const xs = cs.filter(c => c.k === k); if (!xs.length) return ''; const all = xs.every(c => ticks[c.id]); let last = null;
    return `<div class="clh"><b>${LVN[k]}</b><button class="link" data-a="comp-all" data-k="${k}" data-v="${all ? 0 : 1}">${all ? 'Desmarcar todas' : 'Marcar todas'}</button></div>` + xs.map(c => { const hd = c.ctx !== last && c.ctx ? `<div class="cctx">${esc(c.ctx)}:</div>` : ''; last = c.ctx; return hd + `<label class="cli"><input type="checkbox" data-in="comp" data-id="${c.id}"${ticks[c.id] ? ' checked' : ''}> <span>${c.of ? `<b class="cid">${c.n}</b> ` : ''}${esc(c.txt)}</span></label>`; }).join(''); }).join('');
}
function regOf(t, p, aid) {
  let pos = 0, neg = 0;
  aulasOf(t.id).forEach(a => { if (periodOf(a.data) !== p) return; const r = (a.reg || {})[aid]; if (r) { pos += r.p || 0; neg += r.n || 0; } });
  return {p:pos, n:neg};
}

function gCols(t, v) {
  const cols = [], H = UI.hide || {}, fa = FOCUS && S.aulas[FOCUS];
  if (fa || !H.mat) {
    let ms = matsOf(t, UI.p); if (fa) ms = ms.filter(m => (fa.materias || []).includes(m));
    ms.forEach(m => {
      cols.push({k:'m:' + m, g:'mat', type:'lvl', m, label:m.replace(/\s*\(.*\)$/, ''), title:m});
      ((v.ind || {})[m] || []).forEach(i => cols.push({k:'i:' + i.id, g:'mat', type:'lvl', m, ind:i, label:i.n, title:m + ' · ' + i.n, sub:true}));
    });
    cols.push({k:'t:AF', g:'mat', type:'calc', label:'AF', title:'Nota das matérias'});
  }
  if (fa) { cols.push({k:'reg', g:'av', type:'reg', label:'+/−', title:'Registos desta aula'}); return cols; }
  if (!H.fit) { FIT.forEach(f => cols.push({k:'f:' + f.k, g:'fit', type:f.bool ? 'bool' : 'num', f, label:FITL[f.k], unit:f.u, title:f.n})); cols.push({k:'t:APF', g:'fit', type:'calc', label:'Apt.', title:'Nota da aptidão física'}); }
  if (!H.con) cols.push({k:'con', g:'con', type:'num', label:'Conhec.', unit:t.escala === '1-5' ? '1-5' : '0-20', title:'Conhecimentos'});
  if (!H.av) {
    Object.keys(AVW).forEach(k => cols.push({k:'a:' + k, g:'av', type:'q4', ak:k, label:AVL[k], title:AVN[k]}));
    cols.push({k:'reg', g:'av', type:'reg', label:'+/−', title:'Registos +/− das aulas do período'});
    cols.push({k:'t:AV', g:'av', type:'calc', label:'Atit.', title:'Nota das atitudes'});
  }
  cols.push({k:'t:FIN', g:'fin', type:'calc', label:'Final', title:'Nota final'});
  return cols;
}
function gCtx(t) { return {t, v:avalOf(t.id, UI.p), p:UI.p, R:{}}; }
const gCalc = (c, al) => c.R[al.id] || (c.R[al.id] = calc(c.t, c.p, al));
function gOff(col, al) { const R = REG[regAt(al)] || REG.Normal; return (col.g === 'mat' && col.type !== 'calc' && R.af === 0) || (col.g === 'fit' && col.type !== 'calc' && R.apf === 0); }
function gEditable(col, al) { return col.type !== 'calc' && !(col.type === 'reg' && !FOCUS) && !gOff(col, al); }
function gGet(c, col, al) {
  const v = c.v, id = al.id, k = col.k, blank = x => x === '' || x === undefined ? null : x;
  if (k.startsWith('m:')) return ((v.af || {})[id] || {})[col.m] || null;
  if (k.startsWith('i:')) return ((v.iv || {})[id] || {})[col.ind.id] || null;
  if (k.startsWith('f:')) return blank(((v.fit || {})[id] || {})[col.f.k]);
  if (k === 'con') return blank((v.con || {})[id]);
  if (k.startsWith('a:')) return blank(((v.av || {})[id] || {})[col.ak]);
  if (k === 'reg') { const r = FOCUS ? ((S.aulas[FOCUS] || {}).reg || {})[id] : regOf(c.t, c.p, id); return r && (r.p || r.n) ? r : null; }
  return null;
}
function gShow(c, col, al) {
  if (gOff(col, al)) return {txt:col.type === 'calc' ? 'n/a' : '', cls:'off'};
  const x = gGet(c, col, al);
  if (col.type === 'calc') {
    const r = gCalc(c, al), n = r[col.k.slice(2)];
    if (col.k === 't:FIN') return {txt:n ?? '—', cls:'calc ' + (r.EST === 'Apto' ? 'fin-ok' : r.EST === 'Não apto' ? 'fin-bad' : 'fin-inc')};
    return {txt:f1(n), cls:'calc' + (n != null && n < 10 ? ' low' : '')};
  }
  if (col.k.startsWith('m:')) { const d = lvOf(c.v, al.id, col.m); return d ? {txt:d.l, cls:GLV[d.l], auto:d.auto} : {txt:'', cls:''}; }
  if (col.type === 'lvl') return x ? {txt:x, cls:GLV[x]} : {txt:'', cls:''};
  if (col.f) {
    const z = zoneOf(col.f, al, ageAt(al.nasc, refDate(c.p)), c.v), zc = z != null ? 'z' + z : '';
    if (col.f.bool) return {txt:x === 'S' ? 'Sim' : x === 'N' ? 'Não' : '', cls:zc};
    return x != null ? {txt:String(x).replace('.', ','), cls:zc} : z != null ? {txt:['Fora', 'ZS', 'ZA'][z], cls:zc, auto:true} : {txt:'', cls:''};
  }
  if (col.k === 'con') { const eq = x == null ? null : c.t.escala === '1-5' ? x * 4 : x; return {txt:x == null ? '' : String(x).replace('.', ','), cls:eq != null && eq < 10 ? 'low' : ''}; }
  if (col.type === 'q4') {
    if (x != null) return {txt:x + 1, cls:GAV[x]};
    if (col.ak === 'pont' || col.ak === 'mat') { const ct = counts(c.t, c.p, al.id), a = idxFromCount(col.ak === 'pont' ? ct.F + ct.A : ct.M); return {txt:a + 1, cls:GAV[a], auto:true}; }
    return {txt:'', cls:''};
  }
  if (col.type === 'reg') return {txt:x ? [x.p ? '+' + x.p : '', x.n ? '−' + x.n : ''].filter(Boolean).join(' ') : '', cls:x ? (x.p >= x.n ? 'g3' : 'g0') : ''};
  return {txt:'', cls:''};
}
const gFilled = (c, col, al) => { const s = gShow(c, col, al); return s.txt !== '' && s.cls !== 'off'; };
function gChoices(col) {
  if (col.type === 'lvl') return LV.map(l => ({v:l, label:l, cls:GLV[l], title:LVN[l]}));
  if (col.type === 'q4') return [0, 1, 2, 3].map(i => ({v:i, label:String(i + 1), cls:GAV[i], title:AVD[col.ak][i]}));
  if (col.type === 'bool') return [{v:'S', label:'Sim', cls:'g3'}, {v:'N', label:'Não', cls:'g0'}];
  if (col.type === 'reg') return [{v:-1, label:'−1', cls:'g0'}, {v:1, label:'+1', cls:'g3'}];
  return null;
}
function gSnap(c, col) { UNDO = col.type === 'reg' ? {aula:FOCUS, snap:clone((S.aulas[FOCUS] || {}).reg || {})} : {vid:c.v.id, snap:clone(c.v)}; UNDOS.push(UNDO); if (UNDOS.length > 40) UNDOS.shift(); }
// Grava um valor numa célula (val null apaga). Não faz render.
function gSet(c, col, al, val) {
  const v = c.v, id = al.id, k = col.k, at = (o, key) => (o[key] = o[key] || {});
  if (k === 'reg') {
    const a = S.aulas[FOCUS]; a.reg = a.reg || {}; const r = a.reg[id] || {p:0, n:0};
    if (val == null) delete a.reg[id]; else { if (val > 0) r.p++; else r.n++; a.reg[id] = r; }
    Store.save('aulas', a); return;
  }
  if (k.startsWith('m:')) { const o = at(at(v, 'af'), id); if (val == null) delete o[col.m]; else o[col.m] = val; }
  else if (k.startsWith('i:')) { const o = at(at(v, 'iv'), id); if (val == null) delete o[col.ind.id]; else o[col.ind.id] = val; }
  else if (k.startsWith('f:')) at(at(v, 'fit'), id)[col.f.k] = val;
  else if (k === 'con') { const max = c.t.escala === '1-5' ? 5 : 20; at(v, 'con')[id] = val == null ? null : Math.max(0, Math.min(max, val)); }
  else if (k.startsWith('a:')) at(at(v, 'av'), id)[col.ak] = val;
  touchAval(v);
}

function gOrder(c, cols, als) {
  if (UI.todo) { const started = cols.filter(col => col.type !== 'calc' && col.type !== 'reg' && als.some(al => gGet(c, col, al) != null || (col.m && !col.ind && lvOf(c.v, al.id, col.m))));
    als = als.filter(al => started.some(col => !gOff(col, al) && !gFilled(c, col, al))); }
  const so = UI.sort && cols.find(x => x.k === UI.sort.k);
  if (so) {
    const key = al => { const s = gShow(c, so, al); if (s.txt === '' || s.cls === 'off' || s.txt === '—') return null; return s.txt in LVP ? LVP[s.txt] : parseNum(String(s.txt).replace(/[^\d,.-]/g, '')); };
    als = als.map(al => ({al, x:key(al)})).sort((a, b) => a.x == null ? 1 : b.x == null ? -1 : (a.x - b.x) * UI.sort.d).map(o => o.al);
  }
  return als;
}
function gLayout() { return UI.glay || (window.innerWidth < 640 ? 'coluna' : 'tabela'); }

function vGrelha(t) {
  const c = gCtx(t), cols = gCols(t, c.v), als = gOrder(c, cols, alunosOf(t));
  COLS = cols.map(x => x.k); ORDER = als.map(x => x.id);
  if (SEL && !COLS.includes(SEL.k)) SEL = null;
  let h = '';
  if (FOCUS && S.aulas[FOCUS]) { const a = S.aulas[FOCUS]; h += `<div class="note">A avaliar a aula de <b>${esc(fmtDate(a.data))}</b>${(a.materias || []).length ? ': ' + esc(a.materias.join(', ')) : ' (sem matérias marcadas)'}. Registe também +/− de participação. <button class="link" data-a="g-unfocus">Ver o período todo</button></div>`; }
  h += gToolbar(!FOCUS);
  if (!UI.hintSeen) h += `<p class="hint">Toque numa célula para lançar o valor. Toque no título de uma coluna para preencher a turma toda, ordenar, ver descritivos ou criar indicadores.</p>`;
  const lay = gLayout();
  if (!als.length) return h + `<div class="card empty">${ART}<h3>${UI.todo ? 'Tudo avaliado' : 'Sem alunos'}</h3><p>${UI.todo ? 'Não há alunos com avaliações em falta nas colunas já começadas.' : 'Adicione alunos à turma.'}</p></div>`;
  return h + (lay === 'coluna' ? vColuna(c, cols, als) : lay === 'cartoes' ? vCartoes(c, cols, als) : vTabela(c, cols, als));
}
// Uma só barra: domínios visíveis, disposição, desfazer e filtros.
const GICO = {
  tabela:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9 4.5v15"/></svg>',
  coluna:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  cartoes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="15.5" y="4" width="5" height="7" rx="1.5"/></svg>',
  dominio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="7" cy="7" r="2.5"/><path d="M12 6h8M12 9h5"/><circle cx="7" cy="17" r="2.5"/><path d="M12 16h8M12 19h5"/></svg>',
  undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0 -6)"/></svg>',
  filtro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 8v5l-4 2v-7z"/></svg>'
};
const GDL = {mat:'Mat.', fit:'Apt.', con:'Con.', av:'Atit.'};
function gToolbar(doms) {
  const lay = UI.avMode === 'dominio' ? 'dominio' : gLayout(), nf = (UI.todo ? 1 : 0) + (UI.sort ? 1 : 0);
  return `<div class="gtool">${doms ? `<div class="gt-dom" role="group" aria-label="Domínios visíveis">${Object.keys(GN).map(g => `<button class="${UI.hide[g] ? '' : 'on'}" data-a="g-grp" data-g="${g}" aria-pressed="${!UI.hide[g]}" title="${esc(GN[g])}">${GDL[g]}</button>`).join('')}</div>` : ''}
    <div class="seg gt-lay" role="group" aria-label="Disposição">${[['tabela', 'Tabela'], ['coluna', 'Uma coluna'], ['cartoes', 'Cartões'], ['dominio', 'Aluno a aluno']].map(([k, n]) => `<button data-a="g-lay" data-k="${k}" class="${lay === k ? 'on' : ''}" title="${n}" aria-label="${n}">${GICO[k]}<span>${n}</span></button>`).join('')}</div>
    <span class="sp"></span>${UNDO ? `<button class="icon-btn" data-a="g-undo" title="Desfazer${UNDOS.length > 1 ? ' (' + UNDOS.length + ')' : ''}" aria-label="Desfazer">${GICO.undo}</button>` : ''}
    <button class="btn gt-f${nf ? ' on' : ''}" data-a="g-filtros">${GICO.filtro}<span>Filtros${nf ? ' · ' + nf : ''}</span></button></div>`;
}
function sheetFiltros() {
  const t = turma(), cols = gCols(t, avalOf(t.id, UI.p)).filter(x => x.type !== 'reg');
  openSheet('Filtros e ordem', `<div class="form">
    <label class="pin"><input type="checkbox" data-in="f-todo"${UI.todo ? ' checked' : ''}> Só alunos com avaliações em falta</label>
    <div class="field"><label for="f-sort">Ordenar os alunos por</label><select id="f-sort" data-in="f-sort"><option value="">Número</option>${cols.map(c => `<option value="${esc(c.k)}"${UI.sort && UI.sort.k === c.k ? ' selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
    ${UI.sort ? `<div class="seg block">${[[-1, 'Do maior para o menor'], [1, 'Do menor para o maior']].map(([v, n]) => `<button data-a="f-dir" data-v="${v}" class="${UI.sort.d === v ? 'on' : ''}">${n}</button>`).join('')}</div>` : ''}
    <button class="btn" data-a="mat-add">+ Acrescentar matéria ao período</button></div>`, `<button class="btn primary" data-a="sh-close">Ver resultado</button>`);
}
function vTabela(c, cols, als) {
  const grp = []; cols.forEach(col => { const l = grp[grp.length - 1]; if (l && l.g === col.g) l.n++; else grp.push({g:col.g, n:1}); });
  let h = `<div class="gwrap" id="gwrap"><table class="gt2"><thead><tr class="grp"><th class="corner" rowspan="2">Aluno <span class="muted">(${als.length})</span></th>${grp.map(x => `<th colspan="${x.n}" class="gk-${x.g}">${x.g === 'fin' ? '' : esc(GN[x.g])}</th>`).join('')}</tr>
    <tr class="cols">${cols.map(col => `<th class="gk-${col.g}${col.sub ? ' sub' : ''}${UI.sort && UI.sort.k === col.k ? ' srt' : ''}" data-a="col-menu" data-k="${esc(col.k)}" title="${esc(col.title)}">${col.sub ? '↳ ' : ''}${esc(col.label)}${col.unit ? `<small>${esc(col.unit)}</small>` : ''}</th>`).join('')}</tr></thead><tbody>`;
  als.forEach(al => {
    h += `<tr class="${SEL && SEL.aid === al.id ? 'rsel' : ''}"><th class="rh" data-a="aluno-edit" data-id="${esc(al.id)}" title="${esc(al.nome)}"><span class="rhi"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nmx">${esc(al.nome)}</span></span></th>` +
      cols.map(col => { const s = gShow(c, col, al), on = SEL && SEL.aid === al.id && SEL.k === col.k; return `<td class="c ${s.cls}${s.auto ? ' auto' : ''}${on ? ' sel' : ''}${isFlash(al, col) ? ' flash' : ''}" data-a="cell" data-aid="${esc(al.id)}" data-k="${esc(col.k)}">${esc(s.txt)}</td>`; }).join('') + '</tr>';
  });
  h += `</tbody><tfoot><tr><th>Avaliados</th>${cols.map(col => {
    if (col.k === 't:FIN') { const n = als.filter(al => gCalc(c, al).EST === 'Apto').length; return `<td title="Aptos">${n} aptos</td>`; }
    if (col.type === 'calc' || col.type === 'reg') return '<td></td>';
    const el = als.filter(al => !gOff(col, al)); return `<td>${el.filter(al => gFilled(c, col, al)).length}/${el.length}</td>`;
  }).join('')}</tr></tfoot></table></div>`;
  return h;
}
function vColuna(c, cols, als) {
  const col = cols.find(x => x.k === UI.gcol) || cols.find(x => x.type !== 'calc') || cols[0]; UI.gcol = col.k;
  const grp = {}; cols.forEach(x => (grp[x.g] = grp[x.g] || []).push(x));
  let h = `<div class="gcnav"><button class="btn" data-a="g-colstep" data-d="-1" aria-label="Coluna anterior">‹</button><select data-in="gcol" aria-label="Coluna">${Object.entries(grp).map(([g, xs]) => `<optgroup label="${esc(GN[g] || 'Final')}">${xs.map(x => `<option value="${esc(x.k)}"${x.k === col.k ? ' selected' : ''}>${x.sub ? '↳ ' : ''}${esc(x.title)}</option>`).join('')}</optgroup>`).join('')}</select><button class="btn" data-a="g-colstep" data-d="1" aria-label="Coluna seguinte">›</button></div>`;
  h += `<div class="vt"><span class="hint">Deslize para o lado para mudar de coluna.</span><button class="link" data-a="col-menu" data-k="${esc(col.k)}">Preencher, ordenar…</button></div>`;
  h += `<div class="gcl" id="gcl">${als.map(al => {
    const s = gShow(c, col, al), on = SEL && SEL.aid === al.id && SEL.k === col.k, r = gCalc(c, al);
    return `<button class="gcr${on ? ' sel' : ''}${isFlash(al, col) ? ' flash' : ''}" data-a="cell" data-aid="${esc(al.id)}" data-k="${esc(col.k)}">${avatar(al)}<span class="who"><span class="nm">${esc(al.num ?? '')} · ${esc(al.nome)}</span><span class="meta">Final ${r.FIN ?? '—'} · ${esc(r.EST)}</span></span><span class="c ${s.cls}${s.auto ? ' auto' : ''}">${esc(s.txt) || '·'}</span></button>`;
  }).join('')}</div>`;
  return h;
}

// Barra de edição: valores da coluna da célula escolhida, sempre no mesmo sítio.
function gEditor() {
  const el = $('#ged'), t = turma();
  const nav = $('#nav'); document.documentElement.style.setProperty('--nav-h', (nav.hidden ? 0 : nav.offsetHeight) + 'px');
  const off = () => { el.hidden = true; el.innerHTML = ''; document.body.classList.remove('ged-on'); gFit(); };
  if (!t || UI.tab !== 'avaliar' || UI.avMode === 'dominio' || !SEL) return off();
  const c = gCtx(t), col = gCols(t, c.v).find(x => x.k === SEL.k), al = (t.alunos || []).find(x => x.id === SEL.aid);
  if (!col || !al) { SEL = null; return off(); }
  const ok = gEditable(col, al), ch = gChoices(col), cur = gGet(c, col, al);
  let h = `<button class="ged-grab" data-a="ged-tog" aria-label="${UI.gedOpen ? 'Recolher' : 'Ver mais'}"><i></i></button><div class="ged-h">${avatar(al, 'sm')}<span class="t"><b>${esc(al.nome)}</b> <span class="muted">· ${esc(col.title)}</span></span><button class="icon-btn" data-a="g-move" data-d="-1" aria-label="Aluno anterior">↑</button><button class="icon-btn" data-a="g-move" data-d="1" aria-label="Aluno seguinte">↓</button><button class="icon-btn" data-a="g-desel" aria-label="Fechar">×</button></div>`;
  if (!ok) h += `<p class="hint">${col.type === 'calc' ? 'Calculado automaticamente.' : col.type === 'reg' ? 'Os registos +/− lançam-se numa aula: Aulas → abrir a aula → Avaliar nesta aula.' : 'Não se aplica a este aluno (dispensa).'}</p>`;
  else if (ch) {
    h += `<div class="gbr" role="group" aria-label="Valor">${ch.map(x => `<button class="lv ${x.cls}${cur === x.v ? ' on' : ''}" data-a="g-set" data-v="${x.v}" title="${esc(x.title || '')}" aria-pressed="${cur === x.v}">${esc(x.label)}</button>`).join('')}<button class="lv" data-a="g-set" data-v="" title="Apagar" aria-label="Apagar">⌫</button></div>`;
    if (col.type !== 'reg') h += `<label class="pin"><input type="checkbox" data-in="g-pin"${PIN ? ' checked' : ''}> Pincel: repetir o valor a cada toque${PIN && PIN.val != null ? ` (<b>${esc(PIN.label)}</b>)` : ''}</label>`;
  } else {
    let info = '';
    if (col.f) { const age = ageAt(al.nasc, refDate(c.p)), r = fitRef(col.f.k, al.sexo, age); info = !al.sexo || !al.nasc ? 'Indique sexo e data de nascimento para calcular a zona.' : r ? `${al.sexo === 'F' ? 'Rapariga' : 'Rapaz'}, ${age} anos: ZS ${col.f.dir > 0 ? '≥' : '≤'} ${String(r.zs).replace('.', ',')}${r.za != null ? ' · ZA ' + (col.f.dir > 0 ? '≥ ' : '≤ ') + String(r.za).replace('.', ',') : ''}` : `Sem tabela de referência para ${age ?? '?'} anos: escolha a zona na vista Aluno a aluno.`; }
    else if (col.k === 'con' && c.t.escala === '1-5') info = 'Escala 1-5: convertida para 0-20 (×4) nos cálculos.';
    h += `<div class="ged-num"><input id="ged-num" type="text" inputmode="decimal" enterkeyhint="next" data-in="g-num" value="${esc(cur ?? '')}" placeholder="${esc(col.unit || '')}" aria-label="${esc(col.title)} de ${esc(al.nome)}"><button class="btn primary" data-a="g-move" data-d="1">Seguinte ↓</button><button class="btn" data-a="g-set" data-v="" aria-label="Apagar">⌫</button></div>${info ? `<p class="hint">${esc(info)}</p>` : ''}`;
  }
  if (col.type === 'lvl' && col.m && !col.ind && compsOf(c.t.ciclo, col.m).length) {
    const l = (lvOf(c.v, al.id, col.m) || {}).l, tk = tksOf(c.v, al.id, col.m), sm = lvSummary(c.t.ciclo, col.m, l, tk), ex = tk && Object.values(tk).some(Boolean);
    h += `<details class="domd"${UI.domOpen ? ' open' : ''}><summary>${lvShort(c.t.ciclo, col.m, l, tk) || 'Assinalar as competências que o aluno domina'}</summary>${sm ? `<div class="dom">${sm}</div>` : ''}<div class="cl"><div class="hint">${ex ? 'Nível calculado pelas competências assinaladas.' : 'Assinale as competências que o aluno já domina: o nível passa a ser calculado e o resumo fica exato.'}</div>${compCheck(c.t.ciclo, col.m, tk)}</div></details>`;
  } else if (col.type === 'lvl') h += `<p class="hint">${col.ind ? 'Indicador de ' + esc(col.m) + '.' : 'Sem competências descritas para esta matéria neste ciclo.'}</p>`;
  else if (col.type === 'q4' && cur != null) h += `<p class="hint">${esc(AVD[col.ak][cur])}</p>`;
  const sc = el.querySelector('.cl'), st = sc ? sc.scrollTop : 0;
  el.innerHTML = `<div class="wrap">${h}</div>`; el.hidden = false; document.body.classList.add('ged-on');
  el.classList.toggle('min', !UI.gedOpen && window.innerWidth < 900);
  const sc2 = el.querySelector('.cl'); if (sc2) sc2.scrollTop = st;
  document.documentElement.style.setProperty('--ged-h', el.offsetHeight + 'px'); gFit();
}
// A tabela ocupa o espaço visível entre o cabeçalho e as barras de baixo, para os títulos e a coluna dos nomes ficarem sempre à vista.
function gFit() {
  const w = $('#gwrap'); if (!w) return;
  const ged = $('#ged'), used = $('#top').offsetHeight + ($('#nav').hidden ? 0 : $('#nav').offsetHeight) + (ged.hidden ? 0 : ged.offsetHeight) + 24;
  w.style.maxHeight = Math.max(240, window.innerHeight - used) + 'px';
}
function gRefresh(focusNum) {
  const w = $('#gwrap'), sl = w ? w.scrollLeft : 0, st = w ? w.scrollTop : 0, y = window.scrollY;
  render();
  const w2 = $('#gwrap'); if (w2) { w2.scrollLeft = sl; w2.scrollTop = st; } window.scrollTo(0, y);
  const s = document.querySelector('td.c.sel, .gcr.sel'); if (s) s.scrollIntoView({block:'nearest', inline:'nearest'});
  if (focusNum) { const i = $('#ged-num'); if (i) { i.focus(); i.select(); } }
}
function gHere() { const t = turma(), c = gCtx(t), col = SEL && gCols(t, c.v).find(x => x.k === SEL.k), al = SEL && (t.alunos || []).find(x => x.id === SEL.aid); return {t, c, col, al}; }
function gMove(dr, dc, focusNum) {
  if (!SEL) return;
  if (dr) { const i = ORDER.indexOf(SEL.aid) + dr; if (i >= 0 && i < ORDER.length) SEL.aid = ORDER[i]; }
  if (dc) { const i = COLS.indexOf(SEL.k) + dc; if (i >= 0 && i < COLS.length) { SEL.k = COLS[i]; if (gLayout() === 'coluna') UI.gcol = SEL.k; } }
  const {col} = gHere(); gRefresh(focusNum && col && col.type === 'num');
}
// Aplica um valor à célula escolhida; sem pincel, passa ao aluno seguinte (como numa folha de cálculo).
let FLASH = null;
const isFlash = (al, col) => FLASH && FLASH.aid === al.id && FLASH.k === col.k && Date.now() - FLASH.ts < 900;
function gApply(val, advance) {
  const {c, col, al} = gHere(); if (!col || !al || !gEditable(col, al)) return;
  gSnap(c, col); gSet(c, col, al, val); FLASH = {aid:al.id, k:col.k, ts:Date.now()};
  if (PIN && val != null && col.type !== 'reg') { PIN = {type:col.type, val, label:(gChoices(col) || []).find(x => x.v === val)?.label || String(val)}; }
  if (advance && !PIN && col.type !== 'reg') gMove(1, 0); else gRefresh();
}
function gFill(k, val) {
  const {t, c} = gHere(), col = gCols(t, c.v).find(x => x.k === k); if (!col) return 0;
  gSnap(c, col); let n = 0;
  alunosOf(t).forEach(al => { if (!gEditable(col, al)) return; const has = val == null ? gGet(c, col, al) != null : gFilled(c, col, al) && !gShow(c, col, al).auto; if (val == null ? has : !has) { gSet(c, col, al, val); n++; } });
  if (!n) { UNDOS.pop(); UNDO = UNDOS[UNDOS.length - 1] || null; } return n;
}

function sheetCol(k) {
  const t = turma(), c = gCtx(t), col = gCols(t, c.v).find(x => x.k === k); if (!col) return;
  const ch = gChoices(col), canEdit = col.type !== 'calc' && col.type !== 'reg';
  let b = '<div class="form">';
  if (col.m && !col.ind) b += aeBox(t);
  if (col.k === 'con' && AE[anoOf(t)]) b += `<div class="aebox"><b>Conhecimentos · Aprendizagens Essenciais do ${anoOf(t)}.º ano</b>${AE[anoOf(t)].con.map(x => `<div>• ${esc(x)}</div>`).join('')}<div><span class="ae1 pill">Proficiente</span> ${AE_CON_P}</div><div><span class="ae2 pill">${esc(aeTop(AE[anoOf(t)]))}</span> ${AE_CON_E}</div></div>`;
  if (col.m) {
    if (col.ind) b += `<p class="hint">Indicador de <b>${esc(col.m)}</b>. A média dos indicadores dá o nível da matéria quando este não é escolhido à mão.</p>`;
    b += descHtml(t.ciclo, col.m, !col.ind);
    if (!col.ind) {
      const inds = (c.v.ind || {})[col.m] || [], prev = UI.p > 1 ? ((avalOf(t.id, UI.p - 1).ind || {})[col.m] || []) : [];
      b += `<div class="field"><span class="lbl">Indicadores de desempenho</span><p class="hint">Divida a matéria em indicadores (ex.: passe, manchete, jogo 2x2). Cada um ganha uma coluna; o nível da matéria passa a ser a média, a não ser que o escolha à mão.</p>
        ${inds.length ? `<div class="list">${inds.map(i => `<div class="li"><span class="who nm">${esc(i.n)}</span><button class="btn danger" data-a="ind-del" data-m="${esc(col.m)}" data-id="${esc(i.id)}">Remover</button></div>`).join('')}</div>` : ''}
        <div style="display:flex;gap:8px"><input type="text" id="ind-new" placeholder="Novo indicador" aria-label="Novo indicador"><button class="btn" data-a="ind-add" data-m="${esc(col.m)}">Adicionar</button></div>
        ${!inds.length && prev.length ? `<button class="link" style="align-self:flex-start" data-a="ind-copy" data-m="${esc(col.m)}">Usar os indicadores do ${perLabel(UI.p - 1, true)} (${prev.map(i => esc(i.n)).join(', ')})</button>` : ''}</div>`;
    }
  }
  if (canEdit && ch) b += `<div class="field"><span class="lbl">Preencher os vazios da turma com</span><div class="gbr">${ch.map(x => `<button class="lv ${x.cls}" data-a="col-fill" data-k="${esc(k)}" data-v="${x.v}" title="${esc(x.title || '')}">${esc(x.label)}</button>`).join('')}</div></div>`;
  if (col.ak === 'emp') b += `<button class="btn" data-a="col-reg">Sugerir o Empenho pelos registos +/− das aulas</button>`;
  b += `<div class="field"><span class="lbl">Ordenar os alunos</span><div class="btn-row"><button class="btn" data-a="col-sort" data-k="${esc(k)}" data-d="-1">Do maior para o menor</button><button class="btn" data-a="col-sort" data-k="${esc(k)}" data-d="1">Do menor para o maior</button>${UI.sort ? '<button class="btn" data-a="col-sort" data-d="0">Pelo n.º</button>' : ''}</div></div>`;
  if (canEdit) b += `<button class="btn danger" data-a="col-clear" data-k="${esc(k)}">Limpar esta coluna</button>`;
  openSheet(col.title, b + '</div>');
}

function vPauta(t) {
  const als = alunosOf(t); const ms = matsOf(t, UI.p);
  const rows = als.map(al => ({al, r: calc(t, UI.p, al)}));
  const nA = rows.filter(x => x.r.EST === 'Apto').length, nN = rows.filter(x => x.r.EST === 'Não apto').length, nI = rows.length - nA - nN;
  const seg = `<div class="seg block" role="group" aria-label="Vista">${[['pauta','Pauta'],['graf','Gráficos'],['rel','Documentos']].map(([k, n]) => `<button data-a="pview" data-k="${k}" class="${(UI.pview || 'pauta') === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (UI.pview === 'graf') return `<div class="stack">${seg}${vGraficos(t)}</div>`;
  if (UI.pview === 'rel') return `<div class="stack">${seg}${vDocs(t)}</div>`;
  let h = `<div class="stack">${seg}<div class="sec-h"><h2>Pauta · ${perLabel(UI.p, true)}</h2><span class="muted small">${ms.length} ${ms.length === 1 ? 'matéria' : 'matérias'}</span></div>`;
  h += `<div class="tiles"><div class="tile"><b>${rows.length}</b><span>Alunos</span></div><div class="tile ok"><b>${nA}</b><span>Aptos</span></div><div class="tile bad"><b>${nN}</b><span>Não aptos</span></div><div class="tile"><b>${nI}</b><span>Incompletos</span></div></div>`;
  if (!rows.length) return h + `<div class="card empty">${ART}<h3>Sem alunos</h3><p>A pauta aparece quando a turma tiver alunos.</p></div></div>`;
  h += vConsist(t);
  const cell = (x, cls) => `<td class="${x != null && x < 10 ? 'low' : ''} ${cls || ''}">${f1(x)}</td>`;
  h += `<div class="tbl-wrap"><table><thead><tr><th>Nº</th><th class="l">Aluno</th><th>AF</th><th>Apt.</th><th>Con.</th><th>Atit.</th><th>Final</th>${t.ciclo !== 'S' ? '<th>' + nivelLbl(t) + '</th>' : ''}<th>Estado</th>${AE[anoOf(t)] ? '<th title="Aprendizagens Essenciais: atividades físicas / aptidão física / conhecimentos">AE</th>' : ''}<th>F</th></tr></thead><tbody>`;
  rows.forEach(({al, r}) => {
    h += `<tr class="click" data-a="aluno-edit" data-id="${esc(al.id)}"><td>${esc(al.num ?? '')}</td><td class="l nm">${esc(al.nome)}</td>${r.afOn ? cell(r.AF) : '<td class="muted">n/a</td>'}${r.apfOn ? cell(r.APF) : '<td class="muted">n/a</td>'}${cell(r.CON)}${cell(r.AV)}<td class="fin ${r.FIN != null && r.FIN < 10 ? 'low' : ''}">${r.FIN ?? '—'}</td>${t.ciclo !== 'S' ? `<td><b>${esc(nivel(t, r.FIN) ?? '—')}</b></td>` : ''}<td><span class="pill ${r.EST === 'Apto' ? 'ok' : r.EST === 'Não apto' ? 'bad' : 'inc'}">${r.EST}</span></td>${(ae => ae ? `<td class="aecell" title="${esc('Atividades físicas: ' + aeLbl(ae, ae.af) + ' · Aptidão física: ' + aeLbl(ae, ae.apf) + ' · Conhecimentos: ' + aeLbl(ae, ae.con))}">${[ae.af, ae.apf, ae.con].map(x => `<span class="${aeCls(x)} pill">${aeShort(ae, x)}</span>`).join(' ')}</td>` : '')(aeOf(t, al, UI.p))}<td>${r.c.F || ''}</td></tr>`;
  });
  h += `</tbody></table></div>`;
  h += `<p class="hint">Regra da grelha: se algum domínio aplicável ficar abaixo de 10, a nota final fica limitada a 9 (Não apto). Toque num aluno para ver o detalhe.</p>`;
  h += `<button class="btn primary block" data-a="xlsx">Exportar pauta, sumários e presenças (Excel)</button></div>`;
  return h;
}

function vMais(t) {
  const ts = Object.values(S.turmas).sort((a, b) => a.nome.localeCompare(b.nome, 'pt', {numeric:true}));
  let h = `<div class="stack">`;
  h += `<div class="sec-h"><h2>Turmas</h2><button class="link" data-a="turma-new">+ Nova turma</button></div><div class="list">`;
  h += ts.length ? ts.map(x => `<button class="li" data-a="turma-edit" data-id="${esc(x.id)}"><span class="who"><div class="nm">${esc(x.nome)}</div><div class="meta">${esc(CICLOS[x.ciclo])} · ${(x.alunos || []).length} alunos · ${aulasOf(x.id).length} aulas</div></span><span class="end muted">›</span></button>`).join('') : '<div class="empty">Ainda não há turmas.</div>';
  h += `</div>`;
  h += `<div class="sec-h"><h2>Ano letivo</h2></div><div class="card form">
    <div class="grid2"><div class="field"><label for="cfg-ano">Ano letivo</label><input id="cfg-ano" type="text" data-in="cfg-ano" value="${esc(CFG.ano)}"></div>
    <div class="field"><span class="lbl">Organização</span><div class="seg block">${[[3,'Períodos'],[2,'Semestres']].map(([n, l]) => `<button data-a="nper" data-n="${n}" class="${CFG.nper === n ? 'on' : ''}">${l}</button>`).join('')}</div></div></div>
    ${CFG.per.slice(0, CFG.nper).map((p, i) => `<div class="grid2"><div class="field"><label for="per-${i}-ini">${perLabel(i + 1, true)}: início</label><input type="date" id="per-${i}-ini" data-in="per" data-i="${i}" data-k="ini" value="${esc(p.ini)}"></div><div class="field"><label for="per-${i}-fim">fim</label><input type="date" id="per-${i}-fim" data-in="per" data-i="${i}" data-k="fim" value="${esc(p.fim)}"></div></div>`).join('')}
    <p class="hint">As aulas entram no período pela data. Confirme as datas com o calendário da sua escola.</p></div>`;
  const f = FIT.find(x => x.k === UI.fitref && !x.bool) || FIT[0];
  const ref = CFG.fit[f.k];
  h += `<div class="sec-h"><h2>Tabelas FITescola</h2></div><div class="card form">
    <div class="chips">${FIT.filter(x => !x.bool).map(x => `<button class="chip ${x.k === f.k ? 'on' : ''}" data-a="fitref-sel" data-k="${x.k}">${esc(x.n)}</button>`).join('')}</div>
    <p class="hint">${esc(f.n)} (${esc(f.u)}) · ${f.dir > 0 ? 'mais é melhor' : 'menos é melhor'} · origem: <b>${esc(ref.src || '—')}</b></p>
    <div class="tbl-wrap"><table class="ref"><thead><tr><th>Idade</th><th>Rapazes ZS</th><th>Rapazes ZA</th><th>Raparigas ZS</th><th>Raparigas ZA</th></tr></thead><tbody>
    ${[0,1,2,3,4,5,6,7,8].map(i => `<tr><td><b>${i === 8 ? '18+' : 10 + i}</b></td>${['M','F'].map(sx => ['zs','za'].map(z => `<td><input type="text" inputmode="decimal" data-in="fitref" data-k="${f.k}" data-sx="${sx}" data-z="${z}" data-i="${i}" value="${esc(ref[sx][z][i] ?? '')}" aria-label="${sx === 'M' ? 'Rapazes' : 'Raparigas'} ${z.toUpperCase()} ${10 + i} anos"></td>`).join('')).join('')}</tr>`).join('')}
    </tbody></table></div>
    <p class="note warn">Confirme estes valores com a tabela oficial do FITescola (DGE). Vaivém, abdominais e senta e alcança vêm da tabela FITescola; as flexões são provisórias; velocidade, agilidade e impulsão estão por preencher. Sem valor, a zona escolhe-se à mão. Abaixo dos 10 anos não há referência.</p></div>`;
  h += `<div class="sec-h"><h2>Todas as turmas</h2></div><div class="card form"><p class="hint" style="margin:0">Médias, aptos, aptidão física e faltas de todas as turmas lado a lado, com gráficos: útil para o grupo de Educação Física e o conselho pedagógico.</p><button class="btn" data-a="grupo">Painel de todas as turmas · ${perLabel(UI.p)}</button></div>`;
  h += `<div class="sec-h"><h2>Horário semanal</h2></div><div class="card form">${vHorarioSemana()}<p class="hint" style="margin:0">Com o horário definido, o ecrã das aulas mostra as turmas do dia e abre a aula certa com um toque.</p></div>`;
  const nv = CFG.niv || [4, 10, 14, 18];
  h += `<div class="sec-h"><h2>Escola e relatórios</h2></div><div class="card form">
    <div class="grid2"><div class="field"><label for="cfg-escola">Escola / agrupamento</label><input type="text" id="cfg-escola" data-in="cfg-txt" data-k="escola" value="${esc(CFG.escola || '')}"></div><div class="field"><label for="cfg-prof">Professor(a)</label><input type="text" id="cfg-prof" data-in="cfg-txt" data-k="prof" value="${esc(CFG.prof || '')}"></div></div>
    <div class="field"><span class="lbl">Conversão da classificação 0–20 em nível 1–5 (2.º e 3.º ciclos) e menção (1.º ciclo)</span><div class="tbl-wrap"><table class="ref"><thead><tr><th>Nível 2 a partir de</th><th>Nível 3</th><th>Nível 4</th><th>Nível 5</th></tr></thead><tbody><tr>${nv.map((x, i) => `<td><input type="text" inputmode="decimal" data-in="cfg-niv" data-i="${i}" value="${x}" aria-label="Limite do nível ${i + 2}"></td>`).join('')}</tr></tbody></table></div><p class="hint" style="margin:0">Por defeito: 1 (0–3), 2 (4–9), 3 (10–13), 4 (14–17), 5 (18–20). Ajuste aos critérios aprovados na sua escola.</p></div>
    <div class="field"><span class="lbl">Aprendizagens Essenciais · Conhecimentos (a escala das AE é descritiva; indique a partir de que classificação 0–20 considera)</span><div class="grid2">${['Proficiente', 'Elevado / Avançado'].map((n, i) => `<div class="field"><label for="aecon-${i}">${n} a partir de</label><input type="text" inputmode="decimal" id="aecon-${i}" data-in="cfg-aecon" data-i="${i}" value="${(CFG.aeCon || [10, 14])[i]}"></div>`).join('')}</div></div>
    <button class="btn" data-a="doc-crit">Critérios de avaliação (imprimir ou PDF)</button></div>`;
  h += `<div class="sec-h"><h2>Cópia de segurança</h2></div><div class="card form">
    <p class="note">${esc(storageNote())}</p>
    ${Store.local ? `<p class="hint">Última cópia: ${lastBackup() ? esc(fmtDate(lastBackup(), {day:'numeric', month:'long', year:'numeric'})) : 'nunca'}. Guarde o ficheiro no OneDrive ou no email.</p>` : ''}
    <div class="btn-row"><button class="btn" data-a="backup">Exportar cópia (.json)</button><button class="btn" data-a="restore">Importar cópia</button></div>
    ${t ? `<button class="btn" data-a="xlsx">Exportar ${esc(t.nome)} · ${perLabel(UI.p)} para Excel</button>` : ''}</div>`;
  h += `<div class="sec-h"><h2>Regras de cálculo</h2></div><div class="card small" style="display:grid;gap:6px">
    ${Object.entries(REG).map(([k, r]) => `<div><b>${k}</b>: ${r.af ? 'AF ' + r.af * 100 + '% · Apt. ' + r.apf * 100 + '% · ' : ''}Con. ${r.con * 100}% · Atit. ${r.av * 100}%</div>`).join('')}
    <div class="muted">Níveis: NI 4 · PI 8 · I 11 · PE 13 · E 15 · PA 17 · A 19 (média das matérias avaliadas no período). Aptidão física: soma dos pontos + 5, máx. 20.</div></div>`;
  return h + '</div>';
}

