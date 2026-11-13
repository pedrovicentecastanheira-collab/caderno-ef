/* ---------- planear: avaliação inicial guiada, banco de exercícios e plano de aula ---------- */
// A avaliação inicial fica na turma (t.ai = {mats, lv:{aluno:{matéria:nível}}}); as AE de 2026 pedem-na até meados de outubro.
const AIL = ['NI', 'I', 'E', 'A'], AIG = {NI:'g0', I:'g1', E:'g2', A:'g3'};
const nome2 = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1] : p[0]; };
const aiOf = t => t.ai || (t.ai = {mats:[], lv:{}});
function aiPrazo() {
  const ini = (CFG.per[0] || {}).ini, d = new Date(), y = ini ? +ini.slice(0, 4) : (d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1);
  return y + '-10-15';
}
const diasAte = d => Math.round((new Date(d + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 864e5);
const aiLv = (t, aid, m) => ((aiOf(t).lv || {})[aid] || {})[m];
function aiProg(t) {
  const ai = aiOf(t), als = alunosOf(t).filter(al => (REG[regAt(al, 1)] || REG.Normal).af > 0);
  const tot = als.length * ai.mats.length, done = als.reduce((s, al) => s + ai.mats.filter(m => aiLv(t, al.id, m)).length, 0);
  return {tot, done, als};
}
// Resultado por matéria: contagens, nível mediano da turma e índice de necessidade (0 = todos A, 1 = todos NI).
function aiRes(t, m) {
  const {als} = aiProg(t), c = {NI:0, I:0, E:0, A:0}; let n = 0, sum = 0;
  als.forEach(al => { const l = aiLv(t, al.id, m); if (l) { c[l]++; n++; sum += AIL.indexOf(l); } });
  let acc = 0, med = null; for (const l of AIL) { acc += c[l]; if (n && acc >= n / 2) { med = l; break; } }
  return {c, n, med, need:n ? 1 - sum / n / 3 : null};
}
function aiPrior(t) { return aiOf(t).mats.map(m => ({m, r:aiRes(t, m)})).filter(x => x.r.n).sort((a, b) => b.r.need - a.r.need); }
// Nível da turma numa matéria, para sugerir exercícios: avaliação inicial ou, sem ela, os níveis do período.
function nivelTurma(t, m) {
  const r = aiRes(t, m); if (r.med) return r.med === 'NI' ? 'I' : r.med;
  const v = avalOf(t.id, UI.p), ls = alunosOf(t).map(al => (lvOf(v, al.id, m) || {}).l).filter(Boolean);
  if (!ls.length) return 'I';
  const k = ls.map(l => ({NI:0, PI:0, I:0, PE:1, E:1, PA:2, A:2}[l] ?? 0)).sort((a, b) => a - b)[Math.floor(ls.length / 2)];
  return ['I', 'E', 'A'][k];
}

function vPlanear(t) {
  const sub = UI.plv || 'ai';
  let h = `<div class="seg block" role="group" aria-label="Planear">${[['ai', 'Avaliação inicial'], ['ex', 'Exercícios'], ['esp', 'Espaços']].map(([k, n]) => `<button data-a="plv" data-k="${k}" class="${sub === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (sub === 'ex') return h + vExercicios(t);
  if (sub === 'esp') return h + (typeof vEspacos === 'function' ? vEspacos(t) : '');
  return h + vAvInicial(t);
}

function vAvInicial(t) {
  if (t.ciclo === '1') return `<div class="card empty"><h3>Avaliação inicial</h3><p>No 1.º ciclo a avaliação faz-se por blocos do programa, diretamente na grelha.</p></div>`;
  const ai = aiOf(t), pr = aiProg(t), prazo = aiPrazo(), dias = diasAte(prazo), pct = pr.tot ? Math.round(pr.done / pr.tot * 100) : 0;
  let h = `<div class="card ai-h"><div class="sec-h" style="margin:0"><h2 style="font-size:18px">Avaliação inicial</h2><span class="pill ${dias < 0 ? 'inc' : dias <= 10 ? 'bad' : 'ok'}">${dias < 0 ? 'Prazo terminado' : dias === 0 ? 'Termina hoje' : 'Faltam ' + dias + ' dias'}</span></div>
    <p class="hint" style="margin:4px 0 10px">As Aprendizagens Essenciais de 2026 pedem a avaliação inicial até meados de outubro (${fmtDate(prazo)}). Observe cada matéria numa situação de jogo ou exercício critério e registe o nível de cada aluno: daqui saem as prioridades, os grupos de nível e o plano da turma.</p>
    <div class="pl-b big" role="img" aria-label="${pr.done} de ${pr.tot} registos"><i style="width:${pct}%"></i></div><p class="small muted num-t" style="margin:6px 0 0">${pr.done} de ${pr.tot} registos (${pct}%) · ${ai.mats.length} ${ai.mats.length === 1 ? 'matéria' : 'matérias'} · ${pr.als.length} alunos</p></div>`;
  h += `<div class="sec-h"><h2>Matérias a observar</h2><button class="link" data-a="ai-mats">Escolher</button></div>`;
  if (!ai.mats.length) return h + `<div class="card empty">${ART}<h3>Escolha as matérias</h3><p>Normalmente observam-se as matérias nucleares que vai lecionar no ano. Pode começar pelas sugeridas para o ${anoOf(t)}.º ano.</p><div class="btn-row" style="justify-content:center"><button class="btn primary" data-a="ai-sug">Usar as sugeridas</button><button class="btn" data-a="ai-mats">Escolher</button></div></div>`;
  if (!ai.mats.includes(UI.aim)) UI.aim = ai.mats[0];
  const m = UI.aim;
  h += `<div class="chips">${ai.mats.map(x => { const r = aiRes(t, x); return `<button class="chip ${x === m ? 'on' : ''}" data-a="ai-m" data-m="${esc(x)}">${subIcon(x, anoOf(t))}${esc(x)} <span class="muted num-t">${r.n}/${pr.als.length}</span></button>`; }).join('')}</div>`;
  // protocolo: o que observar e em que situação
  const cs = compsOf(t.ciclo, m), sit = (cs.find(c => c.k === 'I' && c.ctx) || cs.find(c => c.k === 'E' && c.ctx) || {}).ctx;
  h += `<div class="card"><b>Protocolo · ${esc(m)}</b>${sit ? `<p class="small" style="margin:6px 0"><span class="muted">Situação de observação sugerida:</span> ${esc(sit)}.</p>` : ''}
    <p class="hint" style="margin:6px 0">NI: não cumpre o nível Introdução. I: cumpre a Introdução. E: cumpre o Elementar. A: cumpre o Avançado.</p>
    ${['I', 'E'].map(k => { const xs = cs.filter(c => c.k === k); return xs.length ? `<details class="desc"><summary>O que observar · ${LVN[k]} (${xs.length})</summary>${compList(xs)}</details>` : ''; }).join('')}</div>`;
  // registo rápido
  h += `<div class="card ai-reg"><div class="sec-h" style="margin:0 0 6px"><h3 style="margin:0;font-size:15px">Registo</h3><span class="small muted">Restantes: ${AIL.map(l => `<button class="link" data-a="ai-rest" data-l="${l}">${l}</button>`).join(' · ')}</span></div>
    ${pr.als.map(al => { const l = aiLv(t, al.id, m); return `<div class="ai-r"><span class="n">${esc(al.num ?? '')}</span>${avatar(al, 'sm')}<span class="nm">${esc(al.nome)}</span><span class="ai-lv" role="group" aria-label="Nível inicial de ${esc(al.nome)}">${AIL.map(x => `<button class="${AIG[x]}${l === x ? ' on' : ''}" data-a="ai-set" data-aid="${esc(al.id)}" data-l="${x}" aria-pressed="${l === x}">${x}</button>`).join('')}</span></div>`; }).join('')}</div>`;
  // grupos de nível da matéria
  const gs = AIL.map(l => ({l, xs:pr.als.filter(al => aiLv(t, al.id, m) === l)})).filter(g => g.xs.length);
  if (gs.length) h += `<div class="sec-h"><h2>Grupos de nível · ${esc(m)}</h2></div><div class="ai-gs">${gs.map(g => `<div class="ai-g ${AIG[g.l]}"><b>${LVN[g.l] || g.l} <span class="num-t">(${g.xs.length})</span></b><div>${g.xs.map(al => `<span>${esc(nome2(al.nome))}</span>`).join('')}</div></div>`).join('')}</div>`;
  // resultados e prioridades
  const pri = aiPrior(t);
  if (pri.length) {
    h += `<div class="sec-h"><h2>Prioridades da turma</h2><button class="link" data-a="ai-plano">Gerar plano anual</button></div><div class="card"><p class="hint" style="margin:0 0 8px">Da matéria em que a turma está mais atrás para a mais avançada. As primeiras pedem mais aulas e começam mais cedo.</p>`;
    h += pri.map(({m, r}, i) => `<div class="ai-pr"><span class="ai-i num-t">${i + 1}</span><span class="ai-m">${esc(m)}<span class="small muted"> · turma: ${r.med ? esc(LVN[r.med] || r.med) : '—'}</span></span><span class="ai-bar" role="img" aria-label="${AIL.map(l => l + ' ' + r.c[l]).join(', ')}">${AIL.map(l => r.c[l] ? `<i class="${AIG[l]}" style="flex:${r.c[l]}" title="${l}: ${r.c[l]}">${r.c[l]}</i>` : '').join('')}</span></div>`).join('');
    h += `<div class="legend" style="margin-top:8px">${AIL.map(l => `<span><i class="sw ${AIG[l]}"></i>${l}</span>`).join('')}</div></div>`;
  }
  return h;
}
function sheetAiMats() {
  const t = turma(), ai = aiOf(t);
  openSheet('Matérias da avaliação inicial', `<p class="hint">Toque para juntar ou retirar.</p>` + matChips(t, m => `<button class="chip ${ai.mats.includes(m) ? 'on' : ''}" data-a="ai-mt" data-m="${esc(m)}">${subIcon(m, anoOf(t))}${esc(m)}</button>`, ai.mats), `<button class="btn primary" data-a="sh-close">Feito</button>`);
}
const AISUG = ['Voleibol', 'Basquetebol', 'Andebol', 'Futebol', 'Ginástica de Solo', 'Ginástica de Aparelhos (Trampolins)', 'Atletismo', 'Badminton', 'Dança'];
// Plano anual a partir das prioridades: as matérias em serpentina pelos períodos e mais aulas onde a turma está mais atrás.
function aiPlano(t, porPer) {
  const pri = aiPrior(t), np = CFG.per.filter(p => p.ini || p.fim).length >= 2 ? Math.min(3, CFG.per.length) : 3, per = Array.from({length:np}, () => []);
  pri.forEach((x, i) => { const r = Math.floor(i / np), c = i % np; per[r % 2 ? np - 1 - c : c].push(x); });
  return per.map(xs => { const w = xs.map(x => 1 + x.r.need * 1.5), sw = w.reduce((a, b) => a + b, 0) || 1; return xs.map((x, i) => ({m:x.m, n:Math.max(4, Math.round(porPer * w[i] / sw))})); });
}
function sheetAiPlano() {
  const t = turma(); UI.aiN = UI.aiN || 26; const pl = aiPlano(t, UI.aiN), has = [1, 2, 3].some(p => planOf(t, p).length);
  const body = `<div class="form"><div class="field"><label for="ai-n">Aulas por período (aproximado)</label><input id="ai-n" type="number" min="6" max="80" inputmode="numeric" data-in="ai-n" value="${UI.aiN}"></div>
    ${pl.map((us, i) => `<div class="card"><b>${perLabel(i + 1, true)}</b>${us.length ? us.map(u => `<div class="pl-r"><span class="pl-n">${subIcon(u.m, anoOf(t))} ${esc(u.m)}</span><span class="pl-v num-t">${u.n} aulas</span></div>`).join('') : '<p class="hint">Sem matérias.</p>'}</div>`).join('')}
    ${has ? '<p class="note warn">Substitui os planos de período que já existem.</p>' : ''}</div>`;
  const foot = `<button class="btn primary" data-a="ai-plano-go">${has ? 'Substituir os planos' : 'Criar os planos'}</button>`;
  if ($('#sheet').hidden) openSheet('Plano anual da turma', body, foot); else updSheet(body, foot);
}

/* banco de exercícios */
function vExercicios(t) {
  const m = UI.exm || '', lv = UI.exl || '', xs = exAll().filter(x => (!m || x.m === m) && (!lv || x.lv === lv));
  let h = `<div class="card"><div class="grid2"><div class="field"><label for="ex-m">Matéria</label><select id="ex-m" data-in="ex-f" data-k="exm"><option value="">Todas</option>${matOpts(t, m)}</select></div>
    <div class="field"><span class="lbl">Nível</span><div class="seg block">${[['', 'Todos'], ['I', 'I'], ['E', 'E'], ['A', 'A']].map(([k, n]) => `<button data-a="ex-l" data-k="${k}" class="${lv === k ? 'on' : ''}">${n}</button>`).join('')}</div></div></div>
    <button class="btn block" data-a="ex-new">+ Novo exercício</button></div>`;
  h += `<p class="small muted">${xs.length} ${xs.length === 1 ? 'exercício' : 'exercícios'}. Os seus exercícios entram no pacote partilhado com o grupo de EF.</p>`;
  h += xs.length ? `<div class="ex-list">${xs.map(x => exCard(x)).join('')}</div>` : `<div class="card empty"><h3>Sem exercícios</h3><p>Ainda não há exercícios para esta matéria e nível. Crie o primeiro.</p></div>`;
  return h;
}
function exCard(x, add) {
  return `<div class="card ex"><div class="ex-h"><span class="pill ${AIG[x.lv] || ''} lvp">${esc(x.lv)}</span><b>${esc(x.nome)}</b><span class="small muted">${esc(x.m)}${x.base ? '' : ' · meu'}</span>
    ${add ? `<button class="btn sm primary" data-a="pa-add" data-id="${esc(x.id)}">Juntar</button>` : x.base ? '' : `<button class="link" data-a="ex-edit" data-id="${esc(x.id)}">Editar</button>`}</div>
    ${x.desc ? `<p class="small" style="margin:6px 0 0">${esc(x.desc)}</p>` : ''}${x.crit ? `<p class="small muted" style="margin:4px 0 0"><b>Critérios de êxito:</b> ${esc(x.crit)}</p>` : ''}</div>`;
}
function sheetEx(x) {
  const t = turma(); UI.draft = x; const isNew = !((CFG.exs || []).some(e => e.id === x.id));
  const body = `<div class="form"><div class="grid2"><div class="field"><label for="ex-dm">Matéria</label><select id="ex-dm">${matOpts(t, x.m)}</select></div>
    <div class="field"><span class="lbl">Nível</span><div class="seg block">${['I', 'E', 'A'].map(k => `<button data-a="ex-dl" data-k="${k}" class="${x.lv === k ? 'on' : ''}">${k}</button>`).join('')}</div></div></div>
    <div class="field"><label for="ex-dn">Nome</label><input id="ex-dn" type="text" value="${esc(x.nome)}" placeholder="Ex.: Jogo 3x3 com obrigatoriedade de passe"></div>
    <div class="field"><label for="ex-dd">Organização</label><textarea id="ex-dd" placeholder="Espaço, grupos, material e regras.">${esc(x.desc || '')}</textarea></div>
    <div class="field"><label for="ex-dc">Critérios de êxito</label><textarea id="ex-dc" placeholder="O que o aluno tem de fazer bem.">${esc(x.crit || '')}</textarea></div></div>`;
  openSheet(isNew ? 'Novo exercício' : 'Editar exercício', body, (isNew ? '' : `<button class="btn danger" data-a="ex-del">Eliminar</button>`) + `<button class="btn primary" data-a="ex-save">Guardar</button>`);
}

/* plano de aula: aquecimento, parte fundamental com exercícios do banco e retorno à calma */
const paOf = a => a.plano || (a.plano = {dur:50, aq:{txt:'', min:10}, pf:[], rc:{txt:'', min:5}});
// Unidade didática de cada matéria da aula e o número da aula dentro dela.
function udInfo(t, a) {
  const p = periodOf(a.data), pl = planOf(t, p);
  return (a.materias || []).map(m => { const u = pl.find(x => x.m === m); if (!u) return null;
    const k = aulasOf(t.id).filter(x => x.id !== a.id && periodOf(x.data) === p && (x.materias || []).includes(m) && x.data <= a.data).length + 1;
    return `${esc(m)}: aula ${k} de ${u.n}`; }).filter(Boolean);
}
function paHtml(a) {
  const t = turma(), P = paOf(a), tot = (+P.aq.min || 0) + (+P.rc.min || 0) + P.pf.reduce((s, x) => s + (+x.min || 0), 0), ud = udInfo(t, a);
  let h = `${ud.length ? `<p class="small" style="margin:0 0 8px"><span class="muted">Unidade didática ·</span> ${ud.join(' · ')}</p>` : ''}
    <div class="pa-tot"><span class="pl-b" role="img" aria-label="${tot} de ${P.dur} minutos"><i class="${tot > P.dur ? 'over' : ''}" style="width:${Math.min(100, tot / (P.dur || 1) * 100)}%"></i></span><span class="small num-t">${tot}/<input type="number" min="20" max="180" inputmode="numeric" data-in="pa" data-k="dur" value="${P.dur}" aria-label="Duração da aula em minutos"> min</span></div>
    <div class="pa-p"><div class="pa-ph"><b>Aquecimento</b><input type="number" min="0" max="60" inputmode="numeric" data-in="pa" data-k="aqm" value="${P.aq.min}" aria-label="Minutos de aquecimento"> min</div>
    <textarea data-in="pa" data-k="aq" rows="2" placeholder="Ex.: corrida contínua e mobilização articular.">${esc(P.aq.txt)}</textarea><div class="sug">${EXAQ.map(x => `<button data-a="pa-sug" data-k="aq" data-t="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
    <div class="pa-p"><div class="pa-ph"><b>Parte fundamental</b><span class="small muted">${P.pf.length} ${P.pf.length === 1 ? 'exercício' : 'exercícios'}</span></div>
    ${P.pf.map((x, i) => `<div class="pa-ex"><span class="pill ${AIG[x.lv] || ''} lvp">${esc(x.lv || '·')}</span><span class="pa-exn"><input type="text" data-in="pa-ex" data-i="${i}" data-k="nome" value="${esc(x.nome)}" aria-label="Exercício"><span class="small muted">${esc(x.m || '')}${x.crit ? ' · ' + esc(x.crit) : ''}</span></span><input type="number" min="0" max="90" inputmode="numeric" data-in="pa-ex" data-i="${i}" data-k="min" value="${x.min}" aria-label="Minutos"><span class="small">min</span><button class="icon-btn" data-a="pa-up" data-i="${i}" aria-label="Subir">↑</button><button class="icon-btn" data-a="pa-rm" data-i="${i}" aria-label="Retirar">×</button></div>`).join('')}
    <div class="btn-row"><button class="btn sm" data-a="pa-pick">${UI.paPick ? 'Fechar o banco' : '+ Do banco de exercícios'}</button><button class="btn sm ghost" data-a="pa-free">+ Exercício livre</button></div>
    ${UI.paPick ? paPicker(t, a) : ''}</div>
    <div class="pa-p"><div class="pa-ph"><b>Retorno à calma</b><input type="number" min="0" max="30" inputmode="numeric" data-in="pa" data-k="rcm" value="${P.rc.min}" aria-label="Minutos de retorno à calma"> min</div>
    <textarea data-in="pa" data-k="rc" rows="2" placeholder="Ex.: alongamentos e balanço da aula.">${esc(P.rc.txt)}</textarea><div class="sug">${EXRC.map(x => `<button data-a="pa-sug" data-k="rc" data-t="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
    <div class="btn-row"><button class="btn sm" data-a="pa-sum">Escrever o sumário a partir do plano</button>${paPrev(t, a) ? '<button class="btn sm ghost" data-a="pa-copy">Copiar o plano da aula anterior</button>' : ''}</div>`;
  return h;
}
function paPrev(t, a) { return aulasOf(t.id).filter(x => x.id !== a.id && x.plano && x.plano.pf && x.plano.pf.length && x.data <= a.data && (!a.materias.length || (x.materias || []).some(m => a.materias.includes(m)))).pop(); }
function paPicker(t, a) {
  const ms = a.materias.length ? a.materias : null, all = exAll().filter(x => !ms || ms.includes(x.m));
  if (!all.length) return `<p class="hint">Sem exercícios no banco para ${ms ? 'estas matérias' : 'a turma'}. Crie-os em Turma › Planear › Exercícios.</p>`;
  const byM = {}; all.forEach(x => (byM[x.m] = byM[x.m] || []).push(x));
  return `<div class="pa-pick">${Object.entries(byM).map(([m, xs]) => { const nv = nivelTurma(t, m); xs.sort((p, q) => (q.lv === nv) - (p.lv === nv));
    return `<div class="small muted" style="margin:8px 0 4px"><b>${esc(m)}</b> · nível da turma: ${esc(LVN[nv] || nv)} (sugeridos primeiro)</div>` + xs.map(x => exCard(x, true)).join(''); }).join('')}</div>`;
}
function paBox(a) { return `<details class="aplano" id="pa-det"${a.plano && (a.plano.pf.length || a.plano.aq.txt) ? ' open' : ''}><summary><span class="lbl" style="margin:0">Plano da aula</span> <span class="small muted">aquecimento, parte fundamental e retorno à calma</span></summary><div id="pa-box">${paHtml(a)}</div></details>`; }
function paRefresh() { const b = $('#pa-box'); if (b && UI.draft) b.innerHTML = paHtml(UI.draft); }

/* ações */
Object.assign(A, {
  'plv': el => { UI.plv = el.dataset.k; render(); },
  'ai-m': el => { UI.aim = el.dataset.m; render(); },
  'ai-mats': () => sheetAiMats(),
  'ai-mt': el => { const t = turma(), ai = aiOf(t), m = el.dataset.m, i = ai.mats.indexOf(m); i >= 0 ? ai.mats.splice(i, 1) : ai.mats.push(m); const o = MATS[t.ciclo] || GR; ai.mats.sort((a, b) => o.indexOf(a) - o.indexOf(b)); el.classList.toggle('on', i < 0); Store.save('turmas', t); render(); },
  'ai-sug': () => { const t = turma(), ai = aiOf(t), o = MATS[t.ciclo] || GR; ai.mats = AISUG.filter(m => o.includes(m)); Store.save('turmas', t); render(); },
  'ai-set': el => { const t = turma(), ai = aiOf(t), aid = el.dataset.aid, l = el.dataset.l; ai.lv[aid] = ai.lv[aid] || {}; if (ai.lv[aid][UI.aim] === l) delete ai.lv[aid][UI.aim]; else ai.lv[aid][UI.aim] = l; Store.save('turmas', t); render(); },
  'ai-rest': el => { const t = turma(), ai = aiOf(t); let n = 0; aiProg(t).als.forEach(al => { ai.lv[al.id] = ai.lv[al.id] || {}; if (!ai.lv[al.id][UI.aim]) { ai.lv[al.id][UI.aim] = el.dataset.l; n++; } }); Store.save('turmas', t); render(); toast(n + ' ' + (n === 1 ? 'aluno marcado' : 'alunos marcados') + ' com ' + el.dataset.l + '.'); },
  'ai-plano': () => sheetAiPlano(),
  'ai-plano-go': () => { const t = turma(), pl = aiPlano(t, UI.aiN || 26); t.plano = t.plano || {}; pl.forEach((us, i) => { t.plano[i + 1] = us; }); Store.save('turmas', t); closeSheet(); UI.tsub = 'aulas'; render(); toast('Plano anual criado a partir da avaliação inicial.'); },
  'ex-l': el => { UI.exl = el.dataset.k; render(); },
  'ex-new': () => sheetEx({id:uid(), m:UI.exm || (matsOf(turma(), UI.p)[0] || (MATS[turma().ciclo] || GR)[0]), lv:UI.exl || 'I', nome:'', desc:'', crit:''}),
  'ex-edit': el => { const x = (CFG.exs || []).find(e => e.id === el.dataset.id); if (x) sheetEx(clone(x)); },
  'ex-dl': el => { UI.draft.lv = el.dataset.k; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  'ex-save': () => { const x = UI.draft; x.m = $('#ex-dm').value; x.nome = $('#ex-dn').value.trim(); x.desc = $('#ex-dd').value.trim(); x.crit = $('#ex-dc').value.trim();
    if (!x.nome) { toast('Dê um nome ao exercício.', 'bad'); return; }
    CFG.exs = (CFG.exs || []).filter(e => e.id !== x.id).concat([x]); Store.save('cfg', CFG); closeSheet(); render(); toast('Exercício guardado.'); },
  'ex-del': el => { if (!armed(el, 'Toque de novo para eliminar')) return; CFG.exs = (CFG.exs || []).filter(e => e.id !== UI.draft.id); Store.save('cfg', CFG); closeSheet(); render(); toast('Exercício eliminado.'); },
  'pa-pick': () => { UI.paPick = !UI.paPick; paRefresh(); },
  'pa-add': el => { const x = exById(el.dataset.id); if (!x) return; paOf(UI.draft).pf.push({ex:x.id, nome:x.nome, m:x.m, lv:x.lv, crit:x.crit || '', min:10}); UI.paPick = false; paRefresh(); },
  'pa-free': () => { const a = UI.draft; paOf(a).pf.push({ex:null, nome:'', m:a.materias[0] || '', lv:'', crit:'', min:10}); paRefresh(); const ins = document.querySelectorAll('#pa-box [data-in="pa-ex"][data-k="nome"]'); if (ins.length) ins[ins.length - 1].focus(); },
  'pa-rm': el => { paOf(UI.draft).pf.splice(+el.dataset.i, 1); paRefresh(); },
  'pa-up': el => { const pf = paOf(UI.draft).pf, i = +el.dataset.i; if (i > 0) [pf[i - 1], pf[i]] = [pf[i], pf[i - 1]]; paRefresh(); },
  'pa-sug': el => { const P = paOf(UI.draft), o = P[el.dataset.k]; o.txt = (o.txt.trim() ? o.txt.trim() + ' ' : '') + el.dataset.t; paRefresh(); },
  'pa-copy': () => { const t = turma(), p = paPrev(t, UI.draft); if (!p) return; const dur = paOf(UI.draft).dur; UI.draft.plano = clone(p.plano); UI.draft.plano.dur = dur || p.plano.dur; paRefresh(); toast('Plano copiado da aula de ' + fmtDate(p.data) + '.'); },
  'pa-sum': () => { const P = paOf(UI.draft), by = {}; P.pf.filter(x => x.nome).forEach(x => (by[x.m || 'Aula'] = by[x.m || 'Aula'] || []).push(x.nome.charAt(0).toLowerCase() + x.nome.slice(1)));
    const s = Object.entries(by).map(([m, xs]) => `${m}: ${xs.join('; ')}.`).join(' ') + (P.aq.txt ? '' : '');
    if (!s) { toast('Junte primeiro exercícios à parte fundamental.', 'bad'); return; }
    const ta = $('#d-sum'); ta.value = s; UI.draft.sumario = s; toast('Sumário escrito a partir do plano.'); }
});
// A matéria da aula muda os exercícios sugeridos.
const _dMat = A['d-mat']; A['d-mat'] = el => { _dMat(el); if (UI.paPick) paRefresh(); };
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset && el.dataset.in; if (!k || !UI.draft) return;
  if (k === 'pa') { const P = paOf(UI.draft), f = el.dataset.k, n = Math.max(0, parseInt(el.value, 10) || 0);
    if (f === 'aq' || f === 'rc') P[f].txt = el.value; else if (f === 'aqm') P.aq.min = n; else if (f === 'rcm') P.rc.min = n; else if (f === 'dur') P.dur = n || 50;
    if (f !== 'aq' && f !== 'rc') paTot(); }
  else if (k === 'pa-ex') { const x = paOf(UI.draft).pf[+el.dataset.i]; if (!x) return; if (el.dataset.k === 'min') { x.min = Math.max(0, parseInt(el.value, 10) || 0); paTot(); } else x.nome = el.value; }
});
// Atualiza só a barra do tempo, sem tirar o foco do campo.
function paTot() {
  const P = paOf(UI.draft), tot = (+P.aq.min || 0) + (+P.rc.min || 0) + P.pf.reduce((s, x) => s + (+x.min || 0), 0), i = $('#pa-box .pa-tot i'), s = $('#pa-box .pa-tot .small');
  if (i) { i.style.width = Math.min(100, tot / (P.dur || 1) * 100) + '%'; i.classList.toggle('over', tot > P.dur); }
  if (s && s.firstChild) s.firstChild.nodeValue = tot + '/';
}
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'ex-f') { UI[el.dataset.k] = el.value; render(); }
  else if (k === 'ai-n') { UI.aiN = Math.max(6, Math.min(80, parseInt(el.value, 10) || 26)); sheetAiPlano(); }
});
